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

type Team struct {
	ID        string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	Type string `db:"type" json:"type" validate:"required,oneof=github gitlab bitbucket user"`

	Name      string `db:"name" json:"name" validate:"required"`
	AvatarURL string `db:"avatar_url" json:"avatarURL" validate:"omitempty,url"`
	URL       string `db:"url" json:"url" validate:"omitempty,url"`

	ExternalID string `db:"external_id" json:"externalID" validate:"omitempty"` // Used for GitHub, GitLab, Bitbucket

	OwnerID *string `db:"owner_id" json:"-"` // Used to ensure a user only has 1 personal team

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

type TeamUsage struct {
	TeamID         string    `db:"team_id" json:"teamID" validate:"required,nanoid"`
	TotalSnapshots int       `db:"total_snapshots" json:"totalSnapshots"`
	FromDate       time.Time `db:"from_date" json:"fromDate"`
	ToDate         time.Time `db:"to_date" json:"toDate"`
}
