package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
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
// @Router /v1/build/create [post]
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

	if err := validate.Struct(build); err != nil {
		// Return, if some fields are not valid.
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": utils.ValidatorErrors(err),
		})
	}

	if err := db.CreateBuild(build); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
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
// @Router /v1/build/{build_id} [get]
func GetBuild(c *fiber.Ctx) error {

	// Get build ID from URL.
	id, err := uuid.Parse(c.Params("build_id"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
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

// Upload partial method for creating a new build.
// @Description Upload snapshots for a build. These snapshots, once uploaded, will immediately be queued for processing.
// @Summary Upload snapshots for a build.
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Param snapshots body models.Snapshot true "Snapshots"
// @Router /v1/build/{build_id}/upload [post]
func UploadPartial(c *fiber.Ctx) error {

	buildID, err := uuid.Parse(c.Params("build_id"))

	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid build ID",
		})
	}

	partial := models.Partial{}

	if err := c.BodyParser(&partial); err != nil {

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

	if _, err := db.GetBuild(buildID); err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error":   true,
			"message": "Build with given ID not found",
		})
	}

	// Generate UUIDs for each snapshot.
	for i := 0; i < len(partial.Snapshots); i++ {
		partial.Snapshots[i].ID = uuid.New()
		partial.Snapshots[i].BuildID = buildID
	}

	validate := utils.NewValidator()

	if err := validate.Struct(partial); err != nil {

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": utils.ValidatorErrors(err),
			"data":    partial,
		})

	}

	if err := db.CreateBatchSnapshots(partial.Snapshots); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to create snapshots",
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Snapshots uploaded successfully",
	})
}

// Upload complete method for signalling a completed build.
// @Description Once all snapshots have been uploaded, signal that the build is complete.
// @Summary Signal that a build has completed.
// @Tags Build
// @Accept json
// @Produce json
// @Param build_id path string true "Build ID"
// @Router /v1/build/{build_id}/complete [post]
func UploadComplete(c *fiber.Ctx) error {

	return nil
}
