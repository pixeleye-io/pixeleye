package git

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"sync"
	"time"

	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/identity"
	"github.com/rs/zerolog/log"
)

func SyncProjectMembers(ctx context.Context, team models.Team, project models.Project) error {

	switch project.Source {
	case models.GIT_TYPE_GITHUB:
		{
			log.Debug().Msgf("Syncing github project members for project %s", project.ID)
			if err := git_github.SyncGithubProjectMembers(ctx, team, project); err != nil {
				return err
			}
		}
	}

	return nil
}

func SyncProjectsMembers(ctx context.Context, team models.Team) error {

	log.Debug().Msgf("Syncing project members for team %s", team.ID)

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	projects, err := db.GetTeamsProjects(ctx, team.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	} else if len(projects) == 0 {
		return nil
	}

	log.Debug().Msgf("Found %d projects for team %s", len(projects), team.ID)

	for _, project := range projects {
		if err := SyncProjectMembers(ctx, team, project); err != nil {
			log.Error().Err(err).Msgf("Failed to sync project members for project %s", project.ID)
			continue
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

	if err := SyncProjectsMembers(ctx, team); err != nil {
		log.Error().Err(err).Msgf("Failed to sync project members for team %s", team.ID)
		return err
	}

	return nil
}

// SyncUserTeams syncs the teams for a user
// If the user is a member of a git team without a corresponding team in pixeleye, it will create the team
// Using this function should be aware that if git credentials are expired, it will return an error
func SyncUserTeamsAndAccount(ctx context.Context, user models.User) error {

	// First we sync the user accounts
	if err := SyncUserAccounts(ctx, user); err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	teams, err := db.GetUsersTeams(ctx, user.ID)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	var wg sync.WaitGroup
	wg.Add(2) // Github and current teams

	go func(ctx context.Context, teams []models.Team) {
		// Sync current teams
		for _, team := range teams {
			if err := SyncTeamMembers(ctx, team); err != nil {
				log.Error().Err(err).Msgf("Failed to sync team members for team %s", team.ID)
				continue
			}
		}
		wg.Done()
	}(ctx, teams)

	// Search for new teams and sync them

	githubChannel := make(chan error, 1)

	go func(ctx context.Context, user models.User, teams []models.Team) {
		// GITHUB TEAMS

		if os.Getenv("GITHUB_APP_NAME") == "" {
			githubChannel <- nil
		} else if err := git_github.SyncNewGithubUserTeams(ctx, user.ID, teams); err != nil && err != sql.ErrNoRows && err != git_github.ExpiredRefreshTokenError {
			log.Error().Err(err).Msg("Failed to sync github teams")
			githubChannel <- nil
		} else if err == git_github.ExpiredRefreshTokenError {
			githubChannel <- err
		} else {
			githubChannel <- nil
		}

		wg.Done()
	}(ctx, user, teams)

	wg.Wait()

	if err := <-githubChannel; err != nil {
		return err
	}

	return nil
}

func SyncUserAccounts(ctx context.Context, user models.User) error {
	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	currentAccounts, err := db.GetUserAccounts(ctx, user.ID)
	if err != nil {
		log.Debug().Err(err).Msg("Failed to get user accounts")
		return err
	}

	tokens, err := identity.GetTokens(ctx, user.AuthID)
	if err != nil {
		return err
	}

	configsRaw, ok := tokens.GetConfig()["providers"]
	if !ok {
		return nil // No providers
	}

	configs, ok := configsRaw.([]interface{})
	if !ok {
		return errors.New("Failed to cast ocid providers to map")
	}

	for _, c := range configs {
		config, ok := c.(map[string]interface{})
		if !ok {
			log.Error().Msg("Failed to cast ocid provider to map")
			continue
		}

		// Check if account already exists
		found := false
		for _, account := range currentAccounts {
			if account.Provider == config["provider"].(string) && account.ProviderAccountID == config["subject"].(string) {
				found = true
				break
			}
		}

		if found {
			continue
		}

		switch config["provider"] {
		case "github":
			{
				authTokens, err := git_github.RefreshGithubTokens(ctx, config["initial_refresh_token"].(string))
				if err != nil {
					log.Err(err).Msg("Failed to refresh github tokens")
					break
				}

				if err := db.CreateAccount(ctx, &models.Account{
					UserID:                user.ID,
					Provider:              "github",
					AccessToken:           authTokens.AccessToken,
					ProviderAccountID:     config["subject"].(string),
					RefreshToken:          authTokens.RefreshToken,
					AccessTokenExpiresAt:  time.Now().Add(time.Second * time.Duration(authTokens.ExpiresIn)),
					RefreshTokenExpiresAt: time.Now().Add(time.Second * time.Duration(authTokens.RefreshTokenExpiresIn)),
				}); err != nil {
					log.Err(err).Msg("Failed to create github account")
				}
			}
		}
	}

	// Check if any accounts have been removed
	for _, account := range currentAccounts {
		found := false
		isError := false
		for _, c := range configs {
			config, ok := c.(map[string]interface{})
			if !ok {
				log.Error().Msg("Failed to cast providers to map")
				isError = true
				break
			}

			if account.Provider == config["provider"].(string) && account.ProviderAccountID == config["subject"].(string) {
				found = true
				break
			}
		}

		if !found && !isError {
			if err := db.DeleteAccount(ctx, account.ID); err != nil {
				log.Err(err).Msg("Failed to delete account")
			}
		}
	}

	return nil
}
