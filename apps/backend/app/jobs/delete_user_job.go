package jobs

import (
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

// Job is a job that deletes a user
func DeleteUserJob() {
	db, err := database.OpenDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open database connection for DeleteUserJob")
		return
	}

	err = db.DeleteUsers()

	if err != nil {
		log.Error().Err(err).Msg("Failed to delete users for DeleteUserJob")
		return
	}

	log.Info().Msg("DeleteUserJob finished")
}
