package events

import (
	"context"

	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/pixeleye-io/pixeleye/platform/database"
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
	BuildID   string `json:"buildID"`
	Status    string `json:"status"`
	ProjectID string `json:"projectID"`
}

func syncWithGithub(ctx context.Context, build models.Build) error {
	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	project, err := db.GetProject(ctx, build.ProjectID)
	if err != nil {
		return err
	}

	if err := git_github.SyncBuildStatusWithCheckRun(context.Background(), project, build); err != nil {
		return err
	}

	return nil

}

func (b *ProjectEvent) BuildStatusChange(build models.Build) {

	if err := syncWithGithub(context.Background(), build); err != nil {
		log.Error().Err(err).Msg("Failed to sync build status with github")
	}

	log.Debug().Msgf("Build status changed to %v", build)
	event := EventPayload{
		Type: ProjectEvent_BuildStatus,
		Data: BuildStatusBody{
			BuildID:   build.ID,
			Status:    build.Status,
			ProjectID: build.ProjectID,
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
