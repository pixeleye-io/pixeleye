package models

import (
	"time"
)

// status enum
const (
	TEAM_TYPE_GITHUB    = "github"
	TEAM_TYPE_GITLAB    = "gitlab"
	TEAM_TYPE_BITBUCKET = "bitbucket"
	TEAM_TYPE_USER      = "user"
)

const (
	TEAM_BILLING_STATUS_ACTIVE      = "active"
	TEAM_BILLING_STATUS_INACTIVE    = "inactive"
	TEAM_BILLING_STATUS_CANCELED    = "canceled"
	TEAM_BILLING_STATUS_PAST_DUE    = "past_due"
	TEAM_BILLING_STATUS_NOT_CREATED = "not_created"
)

type Team struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	Type string `db:"type" json:"type" validate:"required,oneof=github gitlab bitbucket user"`

	Name      string `db:"name" json:"name" validate:"required"`
	AvatarURL string `db:"avatar_url" json:"avatarURL" validate:"omitempty,url"`
	URL       string `db:"url" json:"url" validate:"omitempty,url"`

	BillingStatus    string  `db:"billing_status" json:"billingStatus" validate:"required,oneof=active inactive canceled past_due not_created"`
	BillingAccountID *string `db:"billing_account_id" json:"billingAccountID"`
	BillingPlanID    *string `db:"billing_plan_id" json:"billingPlanID"`

	ExternalID string `db:"external_id" json:"externalID" validate:"omitempty"` // Used for GitHub, GitLab, Bitbucket

	OwnerID *string `db:"owner_id" json:"-"` // Used to ensure a user only has 1 personal team

	HasInstall *bool `db:"has_install" json:"hasInstall"` // Used non user teams. Tells us if we have an install for this team

	Role string `db:"role" json:"role,omitempty" validate:"omitempty,oneof=owner admin accountant member"` // only for user scoped queries
}

const (
	TEAM_MEMBER_ROLE_OWNER      = "owner"
	TEAM_MEMBER_ROLE_ADMIN      = "admin"
	TEAM_MEMBER_ROLE_ACCOUNTANT = "accountant"
	TEAM_MEMBER_ROLE_MEMBER     = "member"
)

const (
	TEAM_MEMBER_TYPE_INVITED = "invited"
	TEAM_MEMBER_TYPE_GIT     = "git"
)

type TeamMember struct {
	TeamID   string `db:"team_id" json:"teamID" validate:"required,nanoid"`
	UserID   string `db:"user_id" json:"userID" validate:"required,nanoid"`
	Role     string `db:"role" json:"role" validate:"required,oneof=owner admin accountant member"`
	RoleSync bool   `db:"role_sync" json:"roleSync"`
	Type     string `db:"type" json:"type" validate:"required,oneof=invited git"`
}

// This represents values passed via .env. Ideally we'd sync with stripe but this is easier for now.
type TeamPlan struct {
	Name      string `json:"name" validate:"required"`
	ProductID string `json:"productID" validate:"required"`
	PricingID string `json:"pricingID" validate:"required"`
	Default   bool   `json:"default" validate:"required"`
	Pricing   []struct {
		Price float64 `json:"price" validate:"required"`
		From  int     `json:"from" validate:"required"`
		To    int     `json:"to" validate:"required"`
	} `json:"pricing" validate:"required"`
}
