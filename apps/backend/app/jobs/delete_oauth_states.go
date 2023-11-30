package jobs

import (
	"context"

	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

func DeleteExpiredOauthStates() {
	db, err := database.OpenDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open database connection for DeleteExpiredOauthStates")
		return
	}

	if err := db.DeleteExpiredOauthStates(context.Background()); err != nil {
		log.Error().Err(err).Msg("Failed to delete expired oauth states")
		return
	}

	log.Info().Msg("Successfully deleted expired oauth states")
}
