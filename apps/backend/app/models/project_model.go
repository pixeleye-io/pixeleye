package models

import (
	"time"
)

type GitSource string

const (
	SOURCE_GITHUB    GitSource = "github"
	SOURCE_GITLAB    GitSource = "gitlab"
	SOURCE_BITBUCKET GitSource = "bitbucket"
	SOURCE_CUSTOM    GitSource = "custom"
)

type Project struct {
	ID        string    `db:"id" json:"id" validate:"required"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt time.Time `db:"updated_at" json:"updatedAt"`

	TeamID string `db:"team_id" json:"teamID" validate:"required"`

	Name       string    `db:"name" json:"name" validate:"required"`
	URL        string    `db:"url" json:"url,omitempty" validate:"omitempty,url"`
	Source     GitSource `json:"source" db:"source" validate:"required,oneof=github gitlab bitbucket custom"`
	SourceID   string    `json:"sourceID,omitempty" db:"source_id"`
	BuildCount int       `db:"build_count" json:"buildCount"`

	Token        string     `db:"token" json:"-"`
	RawToken     string     `json:"token,omitempty" db:"-"` // This is used for sending the token to the client. It should only be populated when a project is first created
	LastActivity *time.Time `db:"last_activity" json:"lastActivity"`

	Role     string `db:"role" json:"role,omitempty" validate:"omitempty,oneof=admin reviewer viewer"`                  // only for user scoped queries
	TeamRole string `db:"team_role" json:"teamRole,omitempty" validate:"omitempty,oneof=owner admin accountant member"` // only for user scoped queries
}

const (
	PROJECT_MEMBER_ROLE_ADMIN    = "admin"
	PROJECT_MEMBER_ROLE_REVIEWER = "reviewer"
	PROJECT_MEMBER_ROLE_VIEWER   = "viewer"
)

type ProjectMember struct {
	ProjectID string `db:"project_id" json:"projectID" validate:"required,nanoid"`
	UserID    string `db:"user_id" json:"userID" validate:"required,nanoid"`
	Role      string `db:"role" json:"role" validate:"required,oneof=admin reviewer viewer"`
	RoleSync  bool   `db:"role_sync" json:"roleSync"`
	Type      string `db:"type" json:"type" validate:"required,oneof=invited git"`
}

type ProjectInviteCode struct {
	ID          string    `db:"id" json:"id" validate:"required,nanoid"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	ExpiresAt   time.Time `db:"expires_at" json:"expiresAt"`
	ProjectID   string    `db:"project_id" json:"projectID" validate:"required,nanoid"`
	Role        string    `db:"role" json:"role" validate:"required,oneof=admin reviewer viewer"`
	Email       string    `db:"email" json:"email" validate:"required,email"`
	InvitedByID string    `db:"invited_by_id" json:"invitedByID" validate:"required,nanoid"`
}
