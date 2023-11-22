package controllers

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/events"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
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

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	team, err := db.GetTeamByID(c.Request().Context(), project.TeamID)
	if err != nil {
		return err
	}

	if team.BillingStatus == models.TEAM_BILLING_STATUS_PAST_DUE {
		return echo.NewHTTPError(http.StatusBadRequest, "payment is overdue, please update your payment details")
	}

	if team.BillingStatus != models.TEAM_BILLING_STATUS_ACTIVE {

		startDateTime := time.Now().AddDate(0, -1, 0)

		endDateTime := time.Now()

		snapshotCount, err := db.GetTeamSnapshotCount(c.Request().Context(), team.ID, startDateTime, endDateTime)
		if err != nil {
			return err
		}

		if snapshotCount > 5_000 {
			return echo.NewHTTPError(http.StatusBadRequest, "free accounts are limited to 5,000 snapshots per month (rolling)")
		}
	}

	validate := utils.NewValidator()

	build.ID, err = nanoid.New()

	if err != nil {
		return err
	}

	build.ProjectID = project.ID
	build.Status = models.BUILD_STATUS_UPLOADING

	if build.TargetBuildID == "" {
		// If we don't have a target but have a parent, we'll default to using that
		build.TargetBuildID = build.TargetParentID
	}

	if err := validate.Struct(build); err != nil {
		// Return, if some fields are not valid.
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateBuild(c.Request().Context(), &build); err != nil {
		return err
	}

	// We can notify all our subscribers that a new build has been created
	go func(build models.Build) {
		notifier, err := events.GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.NewBuild(build)
	}(build)

	return c.JSON(http.StatusCreated, build)
}

func GetBuild(c echo.Context) error {

	build, err := middleware.GetBuild(c)

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

	if err := db.AbortBuild(c.Request().Context(), *build); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, build)
}

func setSnapshotStatus(c echo.Context, status string, snapshotIDs []string) error {

	build, err := middleware.GetBuild(c)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// We can only approve snapshots if the build is in a reviewable state
	if models.IsBuildPreProcessing(build.Status) || models.IsBuildProcessing(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "build is still processing")
	} else if build.Status == models.BUILD_STATUS_ORPHANED {
		return echo.NewHTTPError(http.StatusBadRequest, "build is orphaned")
	} else if build.Status == models.BUILD_STATUS_UNCHANGED {
		return echo.NewHTTPError(http.StatusBadRequest, "build is unchanged")
	}

	if len(snapshotIDs) == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "no snapshots to approve")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	// We can only approve snapshot if the build is the latest build
	if !build.IsLatest {
		return echo.NewHTTPError(http.StatusBadRequest, "build is not the latest build")
	}

	// Check that our snapshots are all from the correct build
	allSnapshots, err := db.GetSnapshotsByBuild(c.Request().Context(), build.ID)
	if err != nil {
		return err
	}

	for _, id := range snapshotIDs {
		found := false
		for _, snapshot := range allSnapshots {
			if snapshot.ID == id {
				if snapshot.Status == models.SNAPSHOT_STATUS_UNCHANGED || snapshot.Status == models.SNAPSHOT_STATUS_ORPHANED {
					return echo.NewHTTPError(http.StatusBadRequest, fmt.Sprintf("snapshot %v is either unchanged or orphaned (you can't approve a snapshot in this state)", snapshot.ID))
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

	// We can check if the build is now complete
	newBuild, err := db.CheckAndUpdateStatusAccordingly(c.Request().Context(), build.ID)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, newBuild)
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

	if branch != "" {
		build, err := db.GetBuildFromBranch(project.ID, branch)
		if err != sql.ErrNoRows {
			if err != nil {
				return err
			}
			builds = append(builds, build)
		}
	}

	type Body struct {
		Shas []string `json:"shas"`
	}

	body := Body{}

	if err := c.Bind(&body); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	shas := body.Shas

	if len(shas) > 128 {
		return echo.NewHTTPError(http.StatusBadRequest, "too many shas")
	}

	if len(shas) > 0 {
		build, err := db.GetBuildFromCommits(project.ID, shas)
		if err != sql.ErrNoRows {
			if err != nil {
				return err
			}
			builds = append(builds, build)
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

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	snapshots, updateBuild, err := db.CreateBatchSnapshots(partial.Snapshots, build.ID)

	if err != nil {
		return err
	}

	if updateBuild {
		go func(build models.Build) {
			notifier, err := events.GetNotifier(nil)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get notifier")
				return
			}
			notifier.BuildStatusChange(build)
		}(*build)
	}

	log.Debug().Msgf("Queuing %v snapshots for processing", snapshots)

	if len(snapshots) == 0 {
		return echo.NewHTTPError(http.StatusOK, "no snapshots to process")
	} else if snapshots[0].Status == models.SNAPSHOT_STATUS_QUEUED {
		return echo.NewHTTPError(http.StatusOK, "snapshots will begin processing once dependencies have been processed")
	}

	channel, err := broker.GetBroker()
	if err != nil {
		return err
	}

	// TODO - Handle error.
	// Need to decide what to do if we can't queue snapshots for processing.
	// The build will remain in a pending state
	// We could create a new table to store snapshots that have failed to be processed,
	// and then once our message broker is back online, we can re-queue them.
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

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	log.Debug().Msgf("Completing build %v", build)

	if !models.IsBuildPreProcessing(build.Status) {
		return echo.NewHTTPError(http.StatusBadRequest, "build has already been completed")
	}

	uploadedBuild, err := db.CompleteBuild(c.Request().Context(), build.ID)

	if err != nil {
		return err
	}

	go func(build models.Build) {
		notifier, err := events.GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.BuildStatusChange(build)
	}(uploadedBuild)

	go func(db *database.Queries, buildID string) {
		ctx := context.Background()
		if _, err := db.CheckAndUpdateStatusAccordingly(ctx, buildID); err != nil {
			log.Error().Err(err).Msg("Failed to check and update build status")
		}
	}(db, uploadedBuild.ID)

	return c.JSON(http.StatusAccepted, uploadedBuild)
}
