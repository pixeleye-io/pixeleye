package models

import "time"

type User struct {
	ID          string    `db:"id" json:"id" validate:"required"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt   time.Time `db:"updated_at" json:"updatedAt"`
	AuthID      string    `db:"auth_id" json:"authID" validate:"required"`
	GithubID    string    `db:"github_id" json:"githubID,omitempty"`
	GitLabID    string    `db:"gitlab_id" json:"gitlabID,omitempty"`
	BitbucketID string    `db:"bitbucket_id" json:"bitbucketID,omitempty"`
	Name        string    `db:"name" json:"name"`
	Email       string    `db:"email" json:"email" validate:"email"`
	Avatar      string    `db:"avatar_url" json:"avatar,omitempty"`
}

// These are the traits that we get from the auth provider.
type UserTraits struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Avatar         string `json:"avatar"`
	GithubUsername string `json:"githubUsername"`
}
