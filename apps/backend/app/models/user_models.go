package models

import "time"

type User struct {
	ID          string    `db:"id" json:"id" validate:"required"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time `db:"updated_at" json:"updatedAt"`
	AuthID      string    `db:"auth_id" json:"authID" validate:"required"`
	GithubID    string    `db:"github_id" json:"-"`
	GitLabID    string    `db:"gitlab_id" json:"-"`
	BitbucketID string    `db:"bitbucket_id" json:"-"`
	Name        string    `db:"name" json:"name"`
	Email       string    `db:"email" json:"email" validate:"email"`
	Avatar      string    `db:"avatar_url" json:"avatar,omitempty"`
}

// These are the traits that we get from the auth provider.
type UserTraits struct {
	Name   string `json:"name"`
	Email  string `json:"email"`
	Avatar string `json:"avatar"`
}

type UserReferrer struct {
	TeamID     string `db:"team_id" json:"teamID"`
	ReferrerID string `db:"referrer_id" json:"referrerID"`
}
