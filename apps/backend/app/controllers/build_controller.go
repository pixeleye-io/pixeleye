package controllers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/models"
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

	build := models.Build{}

	if err := c.Bind(&build); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	validate := utils.NewValidator()

	build.ID = uuid.New()

	build.Status = models.BUILD_STATUS_UPLOADING

	if err := validate.Struct(build); err != nil {
		// Return, if some fields are not valid.
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if err := db.CreateBuild(&build); err != nil {
		return err
	}

	return c.JSON(http.StatusCreated, build)
}

// Get Build method for getting a build.
// @Description Get a build.
// @Summary get a build
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Success 200 {object} models.Build
// @Router /v1/builds/{id} [get]
func GetBuild(c echo.Context) error {

	// Get build ID from URL.
	id, err := uuid.Parse(c.QueryParam("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	build, err := db.GetBuild(id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "build with given ID not found")
	}

	return c.JSON(http.StatusOK, build)
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

	buildID, err := uuid.Parse(c.QueryParam("id"))

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
	}

	partial := models.Partial{}

	if err := c.Bind(&partial); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	snapshots, err := db.CreateBatchSnapshots(partial.Snapshots, buildID)

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

	return c.String(http.StatusOK, "snapshots queued for processing")
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

	buildID, err := uuid.Parse(c.QueryParam("id"))

	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid build ID")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	build, err := db.CompleteBuild(buildID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusAccepted, build)
}
