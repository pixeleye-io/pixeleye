package events

import (
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

type ProjectEvent struct {
	*broker.Queues
}

const (
	ProjectEvent_BuildStatus = "build_status"
	ProjectEvent_NewBuild    = "new_build"
)

type BuildStatusBody struct {
	BuildID string `json:"buildID"`
	Status  string `json:"status"`
}

func (b *ProjectEvent) BuildStatusChange(build models.Build) {
	log.Debug().Msgf("Build status changed to %v", build)
	event := EventPayload{
		Type: ProjectEvent_BuildStatus,
		Data: BuildStatusBody{
			BuildID: build.ID,
			Status:  build.Status,
		},
	}

	if err := b.QueueProjectEvent(build.ProjectID, event); err != nil {
		log.Error().Err(err).Msg("Failed to publish build status update event")
	}
}

func (b *ProjectEvent) NewBuild(build models.Build) {
	event := EventPayload{
		Type: ProjectEvent_NewBuild,
		Data: build,
	}

	if err := b.QueueProjectEvent(build.ProjectID, event); err != nil {
		log.Error().Err(err).Msg("Failed to publish new build event")
	}
}
