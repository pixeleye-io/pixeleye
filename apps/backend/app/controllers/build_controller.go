package controllers

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"slices"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/lib/pq"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	statuses_build "github.com/pixeleye-io/pixeleye/app/statuses/build"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/analytics"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/payments"
	"github.com/posthog/posthog-go"
	"github.com/rs/zerolog/log"
	"github.com/stripe/stripe-go/v76"
)

// Create Build method for creating a new build.
// @Description Create a new build.
// @Summary create a new build
// @Tags Build
// @Accept json
// @Produce json
// @Param sha body string true "Commit SHA"
// @Param targetId body string false "Target build ID"
// @Param branch body string false "Branch name"
// @Param title body string false "Pull request title"
// @Param message body string false "Commit message"
// @Param author body string false "Commit author"
// @Success 200 {object} models.Build
// @Router /v1/builds/create [post]
func CreateBuild(c echo.Context) error {

	build := models.Build{}

	project := middleware.GetProject(c)

	if err := c.Bind(&build); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// Build splitting
	if build.ShardingCount != 0 && build.ShardingID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "shardingID required if shard count is set, we normally try to set this automatically but looks like you've to set it manually")
	} else if build.ShardingID != "" && build.ShardingCount == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "shard count required if shardingID is set")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if build.ShardingID != "" {
		// Attempt to find the build with the same sharding id
		// If it doesn't exist, then this is the first build in the shard and we can set the build number to 1

		existingBuild, err := db.GetBuildFromShardID(c.Request().Context(), project.ID, build.ShardingID)
		if err != nil && err != sql.ErrNoRows {
			return err
		}

		if existingBuild.ID != "" {
			return c.JSON(http.StatusOK, existingBuild)
		}
	}

	if os.Getenv("PIXELEYE_HOSTING") == "true" {

		team, err := db.GetTeamByID(c.Request().Context(), project.TeamID)
		if err != nil {
			return err
		}

		paymentClient := payments.NewPaymentClient()

		subscription, err := paymentClient.GetCurrentSubscription(c.Request().Context(), team)
		if err != nil {
			return err
		}

		if subscription != nil && slices.Contains([]stripe.SubscriptionStatus{"incomplete_expired", "unpaid"}, subscription.Status) {
			// Customer has an unpaid or incomplete subscription, we don't want to let them have anymore snapshots, even free ones until we've sorted this out.
			return echo.NewHTTPError(http.StatusBadRequest, "Account is not active, Please update your payments/subscription")
		}

		if subscription != nil && slices.Contains([]stripe.SubscriptionStatus{"active", "unpaid", "incomplete"}, subscription.Status) {
			// Pro tier

			startDateTime := time.Unix(subscription.CurrentPeriodStart, 0)
			endDateTime := time.Unix(subscription.CurrentPeriodEnd, 0)

			snapshotCount, err := db.GetTeamSnapshotCount(c.Request().Context(), team.ID, startDateTime, endDateTime)
			if err != nil {
				return err
			}

			if team.SnapshotLimit >= 500 && snapshotCount >= team.SnapshotLimit {
				return echo.NewHTTPError(http.StatusBadRequest, "snapshot limit reached")
			}
		} else {
			// Free tier
			startDateTime := time.Now().AddDate(0, -1, 0)
			endDateTime := time.Now()

			snapshotCount, err := db.GetTeamSnapshotCount(c.Request().Context(), team.ID, startDateTime, endDateTime)
			if err != nil {
				return err
			}

			maxSnaps := 5_000 + team.Referrals*1_250

			if snapshotCount > maxSnaps {
				return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("You're free account is limited to %d snapshots per month (rolling)", maxSnaps))
			}
		}

	}

	validate := utils.NewValidator()

	build.ID, err = nanoid.New()
	if err != nil {
		return err
	}

	build.ProjectID = project.ID
	build.Status = models.BUILD_STATUS_UPLOADING

	if len(build.TargetBuildIDs) == 0 && len(build.ParentIDs) > 0 {
		// If we don't have a target but have a parent, we'll default to using those
		build.TargetBuildIDs = build.ParentIDs
	}

	if err := validate.Struct(build); err != nil {
		// Return, if some fields are not valid.
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateBuild(c.Request().Context(), &build); err != nil {
		if driverErr, ok := err.(*pq.Error); ok && driverErr.Code == pq.ErrorCode("23505") && driverErr.Constraint == "idx_unique_build_project_id__sharding_id" {
			// We'e just lost the race to create the build, lets fetch the existing build and return it
			existingBuild, err := db.GetBuildFromShardID(c.Request().Context(), project.ID, build.ShardingID)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, existingBuild)
		}

		return err
	}

	// We can notify all our subscribers that a new build has been created
	notifier, err := events.GetNotifier(nil)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get notifier")
	} else {
		notifier.NewBuild(build)
	}

	return c.JSON(http.StatusCreated, build)
}

func GetBuild(c echo.Context) error {

	middlewareBuild, err := middleware.GetBuild(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	build, err := db.GetBuildWithDependencies(c.Request().Context(), middlewareBuild.ID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.JSON(http.StatusOK, build)
}

func GetBuildSnapshots(c echo.Context) error {

	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	pairs, err := db.GetBuildsPairedSnapshots(*build)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, pairs)
}

func AbortBuild(c echo.Context) error {

	build, err := middleware.GetBuild(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	if models.IsBuildPostProcessing(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "build has already finished processing")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if err := db.UpdateBuildStatus(c.Request().Context(), build, models.BUILD_STATUS_ABORTED); err != nil {
		return err
	}

	events.HandleBuildStatusChange(*build)

	if err := statuses_build.ProcessBuildDependents(c.Request().Context(), *build); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, build)
}

func setSnapshotStatus(c echo.Context, status string, snapshotIDs []string) error {

	if len(snapshotIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no snapshots to approve")
	}

	build, err := middleware.GetBuild(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// We can only approve/reject snapshot if the build is the latest build
	if !build.IsLatest {
		return echo.NewHTTPError(http.StatusBadRequest, "build is not the latest build")
	}

	// We can only approve snapshots if the build is in a reviewable state
	if !models.IsBuildPostProcessing(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot approve snapshots for a build that hasn't finished processing")
	} else if models.IsBuildFailedOrAborted(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "cannot approve snapshots for a failed or aborted build")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	// Check that our snapshots are all from the correct build
	// TODO - we should add a query to just fetch the snapshots we need
	allSnapshots, err := db.GetSnapshotsByBuild(c.Request().Context(), build.ID)
	if err != nil {
		return err
	}

	for _, id := range snapshotIDs {
		found := false
		for _, snapshot := range allSnapshots {
			if snapshot.ID == id {
				if !slices.Contains([]string{models.SNAPSHOT_STATUS_APPROVED, models.SNAPSHOT_STATUS_REJECTED, models.SNAPSHOT_STATUS_UNREVIEWED}, snapshot.Status) {
					return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("snapshot %v isn't reviewable (status needs to be unreviewed, approved or rejected)", id))
				}
				found = true
				break
			}
		}

		if !found {
			return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("snapshot %v is not from this build", id))
		}
	}

	if err := db.SetSnapshotsStatus(c.Request().Context(), snapshotIDs, status); err != nil {
		return err
	}

	if err := statuses_build.SyncBuildStatus(c.Request().Context(), build); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, build)
}

type SnapshotApprovalBody struct {
	SnapshotIds []string `json:"snapshotIDs"`
}

func ApproveSnapshots(c echo.Context) error {
	body := SnapshotApprovalBody{}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return setSnapshotStatus(c, models.SNAPSHOT_STATUS_APPROVED, body.SnapshotIds)
}

func RejectSnapshots(c echo.Context) error {
	body := SnapshotApprovalBody{}
	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return setSnapshotStatus(c, models.SNAPSHOT_STATUS_REJECTED, body.SnapshotIds)
}

func setRemainingSnapshotsStatus(c echo.Context, status string) error {
	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	snapshots, err := db.GetUnreviewedSnapshotsByBuild(c.Request().Context(), build.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	ids := []string{}
	for _, snapshot := range snapshots {
		ids = append(ids, snapshot.ID)
	}

	return setSnapshotStatus(c, status, ids)
}

func ApproveRemainingSnapshots(c echo.Context) error {
	return setRemainingSnapshotsStatus(c, models.SNAPSHOT_STATUS_APPROVED)
}

func RejectRemainingSnapshots(c echo.Context) error {
	return setRemainingSnapshotsStatus(c, models.SNAPSHOT_STATUS_REJECTED)
}

func setAllSnapshotsStatus(c echo.Context, status string) error {
	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	snapshots, err := db.GetReviewableSnapshotsByBuild(c.Request().Context(), build.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	ids := []string{}
	for _, snapshot := range snapshots {
		ids = append(ids, snapshot.ID)
	}

	return setSnapshotStatus(c, status, ids)
}

func ApproveAllSnapshots(c echo.Context) error {
	return setAllSnapshotsStatus(c, models.SNAPSHOT_STATUS_APPROVED)
}

func RejectAllSnapshots(c echo.Context) error {
	return setAllSnapshotsStatus(c, models.SNAPSHOT_STATUS_REJECTED)
}

// Search Builds method for searching builds.
// @Description Search builds.
// @Summary search builds
// @Tags Build
// @Accept json
// @Produce json
// @Param branch query string false "Branch name"
// @Accept json
// @Produce json
// @Param shas body []string false "Commit SHAs
// @Success 200 {object} []models.Build
// @Router /v1/builds [post]
func SearchBuilds(c echo.Context) error {

	project := middleware.GetProject(c)

	builds := []models.Build{}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	branch := c.QueryParam("branch")
	limit := c.QueryParam("limit") // TODO - we should parse this to the sql query to limit there too

	type Body struct {
		Shas              []string `json:"shas"`
		ExcludeDependents bool     `json:"excludeDependents"`
	}

	body := Body{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	shas := body.Shas

	if len(shas) > 128 {
		return echo.NewHTTPError(http.StatusBadRequest, "too many shas")
	}

	if branch != "" && len(shas) == 0 {
		build, err := db.GetBuildFromBranch(project.ID, branch)
		if err != sql.ErrNoRows {
			if err != nil {
				return err
			}
			builds = append(builds, build)
		}
	}

	if len(shas) > 0 && branch != "" {
		commitBuilds, err := db.GetBuildsFromCommitsWithBranch(c.Request().Context(), project.ID, shas, branch)
		if err != sql.ErrNoRows {
			if err != nil {
				return err
			}
			builds = commitBuilds
		}
	} else if len(shas) > 0 {
		commitBuilds, err := db.GetBuildsFromCommits(c.Request().Context(), project.ID, shas)
		if err != sql.ErrNoRows {
			if err != nil {
				return err
			}
			builds = commitBuilds
		}
	}

	if limit != "" {
		limitInt, err := strconv.Atoi(limit)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}

		if limitInt < len(builds) {
			builds = builds[:limitInt]
		}
	}

	return c.JSON(http.StatusOK, builds)
}

// Upload partial method for creating a new build.
// @Description Upload snapshots for a build. These snapshots, once uploaded, will immediately be queued for processing.
// @Summary Upload snapshots for a build.
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Param snapshots body models.Snapshot true "Snapshots"
// @Router /v1/builds/{id}/upload [post]
func UploadPartial(c echo.Context) error {
	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "build not found")
	}

	partial := models.Partial{}

	if err := c.Bind(&partial); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if partial.Snapshots == nil || len(partial.Snapshots) == 0 {
		return echo.NewHTTPError(http.StatusAccepted, "no snapshots to upload")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if partial.Snapshots == nil || len(partial.Snapshots) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no snapshots to upload")
	}

	snapshots, buildUpdated, err := db.CreateBatchSnapshots(c.Request().Context(), partial.Snapshots, build)
	if err != nil {
		return err
	}

	if buildUpdated {
		events.HandleBuildStatusChange(*build)

		if err := statuses_build.SyncBuildStatus(c.Request().Context(), build); err != nil {
			return err
		}
	}

	if len(snapshots) == 0 {
		return c.String(http.StatusOK, "no snapshots to process")
	} else if snapshots[0].Status == models.SNAPSHOT_STATUS_QUEUED {
		return c.String(http.StatusOK, "snapshots will begin processing once dependencies have been processed")
	}

	channel, err := broker.GetBroker()
	if err != nil {
		return err
	}

	if err := channel.QueueSnapshotsIngest(snapshots); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, models.GenericRes{
		Message: "snapshots queued for processing",
	})
}

// Upload complete method for signalling a completed build.
// @Description Once all snapshots have been uploaded, signal that the build is complete.
// @Summary Signal that a build has completed.
// @Tags Build
// @Accept json
// @Produce json
// @Success 200 {object} models.Build
// @Param id path string true "Build ID"
// @Router /v1/builds/{id}/complete [post]
func UploadComplete(c echo.Context) error {

	build, err := middleware.GetBuild(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "build not found")
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	if !models.IsBuildPreProcessing(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "build has already been completed")
	}

	if stillWaiting, err := statuses_build.CompleteBuild(c.Request().Context(), build); err != nil {
		return err
	} else if stillWaiting {
		// We have some parallel builds that are still processing
		return c.JSON(http.StatusAccepted, build)
	}

	snapCount, err := db.CountBuildSnapshots(c.Request().Context(), build.ID)
	if err != nil {
		return err
	}

	analytics.Track(posthog.Capture{
		DistinctId: project.TeamID,
		Event:      "Build Completed",
		Properties: posthog.NewProperties().Set("team_id", project.TeamID).Set("id", build.ID).Set("project_id", build.ProjectID).Set("build_number", build.BuildNumber).Set("snapshots", snapCount),
	})

	if os.Getenv("PIXELEYE_HOSTING") == "true" {
		team, err := db.GetTeamByID(c.Request().Context(), project.TeamID)
		if err != nil {
			return err
		}

		paymentClient := payments.NewPaymentClient()

		subscription, err := paymentClient.GetCurrentSubscription(c.Request().Context(), team)
		if err != nil {
			return err
		}

		if subscription != nil && slices.Contains([]stripe.SubscriptionStatus{"active", "unpaid", "incomplete"}, subscription.Status) {
			// Pro tier - we want to report the snapshot usage
			if err := paymentClient.ReportSnapshotUsage(subscription.Customer.ID, build.ID, snapCount); err != nil {
				log.Error().Err(err).Msg("Failed to report snapshot usage")
				// We can't seem to report the usage, We should log these in a database somewhere but for now we'll just give the user the benefit of the doubt and let them continue without paying
			}
		}
	}

	return c.JSON(http.StatusAccepted, build)
}

// Filters out a list of build id's returning the latest for any given chain
func GetLatestBuildsFromShas(c echo.Context) error {

	type Body struct {
		Shas []string `json:"shas"`
	}

	body := Body{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if len(body.Shas) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no shas provided")
	} else if len(body.Shas) > 128 {
		return echo.NewHTTPError(http.StatusBadRequest, "too many shas")
	}

	project := middleware.GetProject(c)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	builds, err := db.GetLatestBuildsFromShas(c.Request().Context(), project.ID, body.Shas)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, builds)
}
