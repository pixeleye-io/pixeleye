package git

import (
	"context"
	"database/sql"
	"errors"
	"time"

	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/identity"
	"github.com/rs/zerolog/log"
)

func SyncProjectMembers(ctx context.Context, team models.Team) error {

	log.Debug().Msgf("Syncing project members for team %s", team.ID)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	members, err := db.GetTeamUsers(ctx, team.ID)
	if err != nil {
		return err
	}

	log.Debug().Msgf("Found %d members for team %s", len(members), team.ID)

	projects, err := db.GetTeamsProjects(ctx, team.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	} else if len(projects) == 0 {
		return nil
	}

	log.Debug().Msgf("Found %d projects for team %s", len(projects), team.ID)

	for _, project := range projects {
		switch project.Source {
		case models.GIT_TYPE_GITHUB:
			{
				log.Debug().Msgf("Syncing github project members for project %s", project.ID)
				if err := git_github.SyncGithubProjectMembers(ctx, db, team, members, project); err != nil {
					log.Error().Err(err).Msgf("Failed to sync github project members for project %s", project.ID)
					continue
				}
			}
		}
	}

	return nil
}

func SyncTeamMembers(ctx context.Context, team models.Team) error {
	log.Debug().Msgf("Syncing team members for team %s", team.ID)

	var err error
	switch team.Type {
	case models.TEAM_TYPE_GITHUB:
		err = git_github.SyncGithubTeamMembers(ctx, team)

	}

	if err != nil {
		log.Error().Err(err).Msgf("Failed to sync team members for team %s", team.ID)
		return err
	}

	if err := SyncProjectMembers(ctx, team); err != nil {
		log.Error().Err(err).Msgf("Failed to sync project members for team %s", team.ID)
		return err
	}

	return nil
}

func SyncUserAccounts(ctx context.Context, user models.User) error {

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	tokens, err := identity.GetTokens(ctx, user.ID)
	if err != nil {
		return err
	}

	configsRaw, ok := tokens.GetConfig()["providers"]
	if !ok {
		return errors.New("Failed to get config")
	}

	configs, ok := configsRaw.([]interface{})
	if !ok {
		return errors.New("Failed to cast providers to map")
	}

	for _, c := range configs {

		config, ok := c.(map[string]interface{})
		if !ok {
			log.Error().Msg("Failed to cast providers to map")
			continue
		}

		switch config["provider"] {
		case "github":
			{
				authTokens, err := git_github.RefreshGithubTokens(ctx, config["initial_access_token"].(string))
				if err != nil {
					return err
				}
				if _, err := db.CreateAccount(ctx, models.Account{
					UserID:                user.ID,
					Provider:              "github",
					AccessToken:           authTokens.AccessToken,
					ProviderAccountID:     config["subject"].(string),
					RefreshToken:          authTokens.RefreshToken,
					AccessTokenExpiresAt:  time.Now().Add(time.Second * time.Duration(authTokens.ExpiresIn)),
					RefreshTokenExpiresAt: time.Now().Add(time.Second * time.Duration(authTokens.RefreshTokenExpiresIn)),
				}); err != nil {
					log.Err(err).Msg("Failed to create github account")
					continue
				}
			}
		}
	}

	return nil
}
