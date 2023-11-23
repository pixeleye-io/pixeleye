package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/google/go-github/v56/github"
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/billing"
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
					ID:          strconv.FormatInt(repo.GetID(), 10),
					Name:        repo.Name,
					Private:     repo.Private,
					URL:         repo.HTMLURL,
					LastUpdated: repo.GetPushedAt().Time,
					Description: repo.Description,
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

func GetBillingPortalSession(c echo.Context) error {
	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	if team.BillingStatus == models.TEAM_BILLING_STATUS_NOT_CREATED {
		return c.String(http.StatusBadRequest, "Team does not have a billing account")
	} else if team.BillingAccountID == nil {

		log.Error().Msgf("Team does not have a billing account id, This should never happen. Team: %+v", team)

		return c.String(http.StatusBadRequest, "Team does not have a billing account id")
	}

	paymentClient := payments.NewPaymentClient()

	session, err := paymentClient.CreateBillingPortalSession(team, billing.CUSTOMER_BILLING_FLOW_MANAGE_BILLING)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"billingPortalURL": session.URL,
	})
}

func CreateBillingAccount(c echo.Context) error {

	user, err := middleware.GetUser(c)
	if err != nil {
		return err
	}

	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	if team.BillingAccountID != nil && *team.BillingAccountID != "" {
		return c.String(http.StatusBadRequest, "Team already has a billing account")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	paymentClient := payments.NewPaymentClient()

	var customerOpts billing.CreateCustomerOpts
	if team.OwnerID != nil && *team.OwnerID == user.ID {
		// This is a user team, we need to attach their email to the customer
		customerOpts = billing.CreateCustomerOpts{
			TeamID: team.ID,
			Email:  &user.Email,
		}
	} else if team.OwnerID != nil && *team.OwnerID != "" {
		// This shouldn't happen but someone is trying to access billing for a user team they don't own
		return c.String(http.StatusBadRequest, "You can't create a billing account for a personal team which isn't yours")
	} else {
		customerOpts = billing.CreateCustomerOpts{
			TeamID: team.ID,
		}
	}

	// Create a customer in stripe
	customer, err := paymentClient.CreateCustomer(customerOpts)
	if err != nil {
		return err
	}

	// Update the team with the customer id
	team.BillingAccountID = &customer.ID
	team.BillingStatus = models.TEAM_BILLING_STATUS_INACTIVE

	if err := db.UpdateTeamBilling(c.Request().Context(), team); err != nil {
		return err
	}

	session, err := paymentClient.CreateBillingPortalSession(team, billing.CUSTOMER_BILLING_FLOW_METHOD_UPDATE)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"billingPortalURL": session.URL,
	})
}

func SubscribeToPlan(c echo.Context) error {
	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	if team.BillingAccountID == nil {
		return c.String(http.StatusBadRequest, "Team does not have a billing account")
	}

	db, err := database.OpenDBConnection()
	if err != nil {
		return err
	}

	paymentClient := payments.NewPaymentClient()

	// Create a subscription
	_, plan, err := paymentClient.SubscribeToPlan(team)
	if err != nil {
		return err
	}

	team.BillingStatus = models.TEAM_BILLING_STATUS_ACTIVE
	team.BillingPlanID = &plan.PricingID
	if err := db.UpdateTeamBilling(c.Request().Context(), team); err != nil {
		return err
	}

	if list, err := paymentClient.GetCustomerPaymentMethods(*team.BillingAccountID); err != nil {
		return err
	} else if len(list) > 0 {
		// If the customer already has a payment method, we can redirect them to the billing portal
		session, err := paymentClient.CreateBillingPortalSession(team, billing.CUSTOMER_BILLING_FLOW_MANAGE_BILLING)
		if err != nil {
			return err
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"billingPortalURL": session.URL,
		})
	}

	// If the customer doesn't have any payment methods, we need to redirect them to the billing portal
	session, err := paymentClient.CreateBillingPortalSession(team, billing.CUSTOMER_BILLING_FLOW_METHOD_UPDATE)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"billingPortalURL": session.URL,
	})
}

func GetTeamBillingPlan(c echo.Context) error {
	team, err := middleware.GetTeam(c)
	if err != nil {
		return err
	}

	freePlan := models.TeamPlan{
		Name:      "Free",
		ProductID: "",
		PricingID: "",
		Default:   false,
	}

	if team.BillingStatus != models.TEAM_BILLING_STATUS_ACTIVE {
		return c.JSON(http.StatusOK, freePlan)
	}

	plans, err := billing.GetPlans()
	if err != nil {
		return err
	}

	for _, plan := range plans {
		if plan.PricingID == *team.BillingPlanID {
			return c.JSON(http.StatusOK, plan)
		}
	}

	return c.NoContent(http.StatusNotFound)
}
