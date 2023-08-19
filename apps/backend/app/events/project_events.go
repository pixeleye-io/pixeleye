package events

import (
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

type ProjectEvent struct {
	*broker.Queues
}

func (b *ProjectEvent) BuildStatusChange(build models.Build) {
	event := models.ProjectEvent{
		Type: models.ProjectEvent_BuildStatus,
		Data: models.BuildStatusBody{
			BuildID: build.ID,
			Status:  build.Status,
		},
	}

	if err := b.QueueProjectEvent(build.ProjectID, event); err != nil {
		log.Error().Err(err).Msg("Failed to publish build status update event")
	}
}

func (b *ProjectEvent) NewBuild(build models.Build) {
	event := models.ProjectEvent{
		Type: models.ProjectEvent_NewBuild,
		Data: models.NewBuildBody{
			BuildID: build.ID,
		},
	}

	if err := b.QueueProjectEvent(build.ProjectID, event); err != nil {
		log.Error().Err(err).Msg("Failed to publish new build event")
	}
}
