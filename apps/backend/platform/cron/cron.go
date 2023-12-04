package cron

import (
	"time"

	"github.com/go-co-op/gocron"
	"github.com/pixeleye-io/pixeleye/app/jobs"
	"github.com/rs/zerolog/log"
)

func StartCron() {
	s := gocron.NewScheduler(time.UTC)

	// TODO - add cron to delete users marked as deleted after 30 days

	if _, err := s.Every(15).Minutes().Do(jobs.UpdateStuckBuilds); err != nil {
		log.Error().Err(err).Msg("Failed to schedule UpdateStuckBuilds")
	}

	if _, err := s.Every(1).Week().Do(jobs.DeleteExpiredOauthStates); err != nil {
		log.Error().Err(err).Msg("Failed to schedule DeleteExpiredOauthStates")
	}

	s.StartAsync()
}
