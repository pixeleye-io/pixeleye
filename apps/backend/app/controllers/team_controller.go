package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/go-github/v56/github"
	"github.com/labstack/echo/v4"
	git_github "github.com/pixeleye-io/pixeleye/app/git/github"
	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/pkg/middleware"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	"github.com/pixeleye-io/pixeleye/platform/database"
	"github.com/pixeleye-io/pixeleye/platform/payments"
	"github.com/rs/zerolog/log"
)

func GetTeamProjects(c echo.Context) error {
	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	user, err := middleware.GetUser(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	projects, err := db.GetTeamsProjectsAsUser(team.ID, user.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, projects)
}

func GetTeamUsers(c echo.Context) error {
	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	users, err := db.GetUsersOnTeam(c.Request().Context(), team.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, users)
}

type UpdateTeamRequest struct {
	Name      string `json:"name" validate:"omitempty,min=1,max=255"`
	AvatarURL string `json:"avatarURL" validate:"omitempty,url"`
	URL       string `json:"url" validate:"omitempty,url"`
}

func UpdateTeam(c echo.Context) error {

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	if team.Type == models.TEAM_TYPE_USER {
		return c.String(http.StatusBadRequest, "You can't update your personal team")
	}

	var req UpdateTeamRequest
	if err := c.Bind(&req); err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	validator := utils.NewValidator()

	if err := validator.Struct(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, utils.ValidatorErrors(err))
	}

	if req.Name != "" {
		team.Name = req.Name
	}

	if req.AvatarURL != "" {
		team.AvatarURL = req.AvatarURL
	}

	if req.URL != "" {
		team.URL = req.URL
	}

	if err := db.UpdateTeam(c.Request().Context(), team); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func GetTeamSnapshotUsage(c echo.Context) error {

	startDate := c.QueryParam("from")
	endDate := c.QueryParam("end")

	var startDateTime time.Time
	var err error
	if startDate == "" {
		startDateTime = utils.CurrentTime().AddDate(0, -1, 0)
	} else {
		startDateTime, err = time.Parse(time.UnixDate, startDate)
		if err != nil {
			return err
		}
	}

	var endDateTime time.Time
	if endDate == "" {
		endDateTime = utils.CurrentTime()
	} else {
		endDateTime, err = time.Parse(time.UnixDate, endDate)
		if err != nil {
			return err
		}
	}

	if startDateTime.After(endDateTime) {
		return c.String(http.StatusBadRequest, "Start date can't be after end date")
	}

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	snapshotCount, err := db.GetTeamSnapshotCount(c.Request().Context(), team.ID, startDateTime, endDateTime)
	if err != nil {
		return err
	}

	differenceTime := endDateTime.Sub(startDateTime)

	prevSnapshotCount, err := db.GetTeamSnapshotCount(c.Request().Context(), team.ID, startDateTime.Add(-differenceTime), endDateTime.Add(-differenceTime))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"snapshotCount":     snapshotCount,
		"prevSnapshotCount": prevSnapshotCount,
	})
}

func GetTeamBuildUsage(c echo.Context) error {

	startDate := c.QueryParam("from")
	endDate := c.QueryParam("end")

	var startDateTime time.Time
	var err error
	if startDate == "" {
		startDateTime = utils.CurrentTime().AddDate(0, -1, 0)
	} else {
		startDateTime, err = time.Parse(time.UnixDate, startDate)
		if err != nil {
			return err
		}
	}

	var endDateTime time.Time
	if endDate == "" {
		endDateTime = utils.CurrentTime()
	} else {
		endDateTime, err = time.Parse(time.UnixDate, endDate)
		if err != nil {
			return err
		}
	}

	if startDateTime.After(endDateTime) {
		return c.String(http.StatusBadRequest, "Start date can't be after end date")
	}

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	buildCount, err := db.GetTeamBuildCount(c.Request().Context(), team.ID, startDateTime, endDateTime)
	if err != nil {
		return err
	}

	differenceTime := endDateTime.Sub(startDateTime)

	prevBuildCount, err := db.GetTeamBuildCount(c.Request().Context(), team.ID, startDateTime.Add(-differenceTime), endDateTime.Add(-differenceTime))
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"buildCount":     buildCount,
		"prevBuildCount": prevBuildCount,
	})
}

func RemoveTeamMember(c echo.Context) error {
	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	userID := c.Param("user_id")

	userOnTeam, err := db.GetUserOnTeam(c.Request().Context(), team.ID, userID)
	if err != nil {
		return err
	}

	if userOnTeam.Type == models.TEAM_MEMBER_TYPE_GIT {
		return c.String(http.StatusBadRequest, "You can only remove invited users from teams")
	}

	if err := db.RemoveTeamMembers(c.Request().Context(), team.ID, []string{userOnTeam.ID}); err != nil {
		return err
	}

	return c.NoContent(http.StatusOK)
}

func GetRepos(c echo.Context) error {

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	installation, err := db.GetTeamInstallation(c.Request().Context(), team.ID)
	if err != nil {
		return err
	}

	log.Debug().Msgf("Installation: %+v", installation)

	if installation.Type == models.TEAM_TYPE_GITHUB {

		ghClient, err := git_github.NewGithubInstallClient(installation.InstallationID)
		if err != nil {
			return err
		}

		allRepos := make([]models.GitRepo, 0)

		hasNext := true
		page := 0

		for hasNext {

			var repos *github.ListRepositories
			repos, hasNext, err = ghClient.GetInstallationRepositories(c.Request().Context(), page)
			if err != nil {
				if err.Error() == "installation was suspended from github" {
					return c.JSON(http.StatusBadRequest, map[string]interface{}{
						"code":  "github:installation_suspended",
						"error": "Github installation was suspended from github",
					})
				}
				return err
			}

			page += 1

			formattedRepos := make([]models.GitRepo, len(repos.Repositories))

			for i, repo := range repos.Repositories {
				formattedRepos[i] = models.GitRepo{
					ID:            strconv.FormatInt(repo.GetID(), 10),
					Name:          repo.Name,
					Private:       repo.Private,
					URL:           repo.HTMLURL,
					LastUpdated:   repo.GetPushedAt().Time,
					Description:   repo.Description,
					DefaultBranch: repo.DefaultBranch,
				}
			}

			allRepos = append(allRepos, formattedRepos...)
		}

		return c.JSON(http.StatusOK, allRepos)

	}

	return c.String(http.StatusBadRequest, "Team type not supported")
}

func GetInstallations(c echo.Context) error {

	team, err := middleware.GetTeam(c)

	if err != nil {
		return err
	}

	db, err := database.OpenDBConnection()

	if err != nil {
		return err
	}

	installations, err := db.GetGitInstallations(c.Request().Context(), team.ID)

	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, installations)
}

type SubscriptionResponse struct {
	Status   string `json:"status"`
	CancelAt int64  `json:"cancelAt"`
	ID       string `json:"id"`
}

func GetCurrentSubscription(c echo.Context) error {

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	paymentClient := payments.NewPaymentClient()

	sub, err := paymentClient.GetCurrentSubscription(c.Request().Context(), team)
	if err != nil {
		return err
	}

	if sub == nil {
		return c.NoContent(http.StatusOK)
	}

	return c.JSON(http.StatusOK, SubscriptionResponse{
		Status:   string(sub.Status),
		CancelAt: sub.CancelAt,
		ID:       sub.ID,
	})

}

func Subscribe(c echo.Context) error {

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	paymentClient := payments.NewPaymentClient()

	if ok, code, err := paymentClient.CanCreateNewSubscription(team); err != nil {
		return err
	} else if !ok {
		if code == 1 {
			return c.String(http.StatusBadRequest, "You already has an active subscription")
		} else if code == 2 {
			return c.String(http.StatusBadRequest, "You need to settle your outstanding balance before you can subscribe to a new plan")
		}
	}

	if sub, err := paymentClient.GetCurrentSubscription(c.Request().Context(), team); err != nil {
		return err
	} else if sub != nil {
		return c.String(http.StatusBadRequest, "Team already has a subscription")
	}

	session, err := paymentClient.CreateCheckout(c.Request().Context(), team)
	if err != nil {
		return err
	}

	type CheckoutSessionResponse struct {
		CheckoutURL string `json:"checkoutURL"`
	}

	return c.JSON(http.StatusOK, CheckoutSessionResponse{
		CheckoutURL: session.URL,
	})
}

func GetBillingPortalSession(c echo.Context) error {
	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	if team.CustomerID == "" {

		log.Error().Msgf("Team does not have a billing account id, This should never happen. Team: %+v", team)

		return c.String(http.StatusBadRequest, "Team does not have a billing account id")
	}

	paymentClient := payments.NewPaymentClient()

	session, err := paymentClient.CreateBillingPortalSession(team)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"billingPortalURL": session.URL,
	})
}
