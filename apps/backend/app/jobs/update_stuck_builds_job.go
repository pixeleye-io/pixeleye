package jobs

import (
	"context"

	"github.com/pixeleye-io/pixeleye/app/events"
	statuses_build "github.com/pixeleye-io/pixeleye/app/statuses/build"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/rs/zerolog/log"
)

// Job is a job that deletes a user
func UpdateStuckBuilds() {

	ctx := context.Background()

	db, err := database.OpenDBConnection()
	if err != nil {
		log.Error().Err(err).Msg("Failed to open database connection for UpdateStuckBuilds job")
		return
	}

	builds, err := db.GetAndFailStuckBuilds(ctx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to update builds for UpdateStuckBuilds Job")
		return
	}

	for _, build := range builds {

		for _, build := range builds {
			if err := statuses_build.ProcessBuildDependents(ctx, build); err != nil {
				log.Debug().Err(err).Msgf("Failed to process queued builds for build %s", build.ID)
			}
		}

		events.HandleBuildStatusChange(build)
	}

	log.Info().Msg("UpdateStuckBuilds job finished")
}
