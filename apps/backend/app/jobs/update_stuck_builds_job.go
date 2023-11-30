package jobs

import (
	"context"

	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

// Job is a job that deletes a user
func UpdateStuckBuilds() {
	db, err := database.OpenDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open database connection for UpdateStuckBuilds job")
		return
	}

	if err := db.UpdateStuckBuilds(context.TODO()); err != nil {
		log.Error().Err(err).Msg("Failed to update builds for UpdateStuckBuilds Job")
		return
	}

	log.Info().Msg("UpdateStuckBuilds job finished")
}
