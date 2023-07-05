package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
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
func CreateBuild(c *fiber.Ctx) error {

	build := &models.Build{}

	if err := c.BodyParser(build); err != nil {

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})

	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	validate := utils.NewValidator()

	build.ID = uuid.New()

	build.Status = models.BUILD_STATUS_UPLOADING

	if err := validate.Struct(build); err != nil {
		// Return, if some fields are not valid.
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid build data",
			"data":    utils.ValidatorErrors(err),
		})
	}

	if err := db.CreateBuild(build); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"error":   false,
		"message": "Build created successfully",
		"data":    build,
	})
}

// Get Build method for getting a build.
// @Description Get a build.
// @Summary get a build
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Success 200 {object} models.Build
// @Router /v1/builds/{build_id} [get]
func GetBuild(c *fiber.Ctx) error {

	// Get build ID from URL.
	id, err := uuid.Parse(c.Params("build_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	build, err := db.GetBuild(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   true,
			"message": "Build with given ID not found",
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Build retrieved successfully",
		"data":    build,
	})
}

func getDuplicateSnapError(snap models.Snapshot) string {
	errTxt := "Duplicate snapshots with name: " + snap.Name

	if snap.Variant != "" {
		if snap.Target == "" {
			return errTxt + " and variant: " + snap.Variant
		} else {
			return errTxt + ", variant: " + snap.Variant + " and target: " + snap.Target
		}
	}

	if snap.Target != "" {
		return errTxt + " and target: " + snap.Target
	}

	return errTxt
}

// Upload partial method for creating a new build.
// @Description Upload snapshots for a build. These snapshots, once uploaded, will immediately be queued for processing.
// @Summary Upload snapshots for a build.
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Param snapshots body models.Snapshot true "Snapshots"
// @Router /v1/builds/{build_id}/upload [post]
func UploadPartial(c *fiber.Ctx) error {

	buildID, err := uuid.Parse(c.Params("build_id"))

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid build ID",
		})
	}

	partial := models.Partial{}

	if err := c.BodyParser(&partial); err != nil {

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": err.Error(),
		})

	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": err.Error(),
		})
	}

	build, err := db.GetBuild(buildID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "Build with given ID not found",
		})
	}

	// Check the build is not already complete.
	if build.Status != models.BUILD_STATUS_UPLOADING && build.Status != models.BUILD_STATUS_ABORTED {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Build is already complete",
		})
	}

	existingSnapshots, err := db.GetSnapshotsByBuild(buildID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to get existing snapshots",
		})
	}

	// flag to check if there are duplicate snapshots
	updateBuild := false

	// TODO move this into a transaction

	newSnapshots := []models.Snapshot{}

	// Generate UUIDs for each snapshot.
	for i := 0; i < len(partial.Snapshots); i++ {
		snap := partial.Snapshots[i]
		isDup := false
		// Check if snapshot already exists.
		for _, existingSnapshot := range existingSnapshots {
			errorTxt := getDuplicateSnapError(snap)
			if models.CompareSnaps(snap, existingSnapshot) {
				isDup = true

				if !utils.ContainsString(build.Errors, errorTxt) {
					build.Errors = append(build.Errors, errorTxt)
					build.Status = models.BUILD_STATUS_ABORTED
					updateBuild = true
				}

			}
		}

		if !isDup {
			snap.ID = uuid.New()
			snap.BuildID = buildID
			newSnapshots = append(newSnapshots, snap)
		}

	}

	validate := utils.NewValidator()

	partial.Snapshots = newSnapshots

	if err := validate.Struct(partial); err != nil {

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": utils.ValidatorErrors(err),
			"data":    partial,
		})

	}

	if err := db.CreateBatchSnapshots(partial.Snapshots, updateBuild, &build); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to create snapshots",
			"data":    err.Error(),
		})
	}

	channel, err := broker.GetBroker()

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to connect to message broker",
		})
	}

	err = channel.QueueSnapshotsIngest(partial.Snapshots)

	// TODO - Handle error.
	// Need to decide what to do if we can't queue snapshots for processing.
	// The build will remain in a pending state
	// We could create a new table to store snapshots that have failed to be processed,
	// and then once our message broker is back online, we can re-queue them.
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Failed to queue snapshots for processing",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Snapshots uploaded successfully",
	})
}

// Upload complete method for signalling a completed build.
// @Description Once all snapshots have been uploaded, signal that the build is complete.
// @Summary Signal that a build has completed.
// @Tags Build
// @Accept json
// @Produce json
// @Success 200 {object} models.Build
// @Param build_id path string true "Build ID"
// @Router /v1/builds/{build_id}/complete [post]
func UploadComplete(c *fiber.Ctx) error {

	buildID, err := uuid.Parse(c.Params("build_id"))

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid build ID",
		})
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to open database connection",
		})
	}

	build, qErr := db.CompleteBuild(buildID)

	if qErr.IsError() {
		return c.Status(qErr.Code).JSON(fiber.Map{
			"message": qErr.Message,
		})
	}

	return c.Status(qErr.Code).JSON(fiber.Map{
		"message": qErr.Message,
		"data":    build,
	})

}
