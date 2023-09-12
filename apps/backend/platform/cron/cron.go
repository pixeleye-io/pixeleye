package cron

import (
	"time"

	"github.com/go-co-op/gocron"
	"github.com/pixeleye-io/pixeleye/app/jobs"
	"github.com/rs/zerolog/log"
)

func StartCron() {
	s := gocron.NewScheduler(time.UTC)

	// if _, err := s.Every(1).Day().Do(jobs.DeleteUserJob); err != nil {
	// 	log.Error().Err(err).Msg("Failed to schedule DeleteUserJob")
	// }

	if _, err := s.Every(15).Minutes().Do(jobs.UpdateStuckBuilds); err != nil {
		log.Error().Err(err).Msg("Failed to schedule UpdateStuckBuilds")
	}

	s.StartAsync()
}
