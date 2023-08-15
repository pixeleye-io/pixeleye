package controllers

import (
	"database/sql"
	"net/http"

	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/database"
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

	// TODO - add check to ensure parent build has finished processing
	// TODO - handle case where we already have a build for this commit

	build := models.Build{}

	project := middleware.GetProject(c)

	if err := c.Bind(&build); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
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

	if err := db.CreateBuild(&build); err != nil {
		return err
	}

	// We have triggers in postgres so we need to refetch the build
	build, err = db.GetBuild(build.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, build)
}

func GetBuild(c echo.Context) error {

	build, err := middleware.GetBuild(c)

	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.JSON(http.StatusOK, build)
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

	snapshots, err := db.CreateBatchSnapshots(partial.Snapshots, build.ID)

	if err != nil {
		return err
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

	uploadedBuild, err := db.CompleteBuild(build.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusAccepted, uploadedBuild)
}
