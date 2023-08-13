package models

type User struct {
	ID     string `db:"id" json:"id" validate:"required"`
	AuthID string `db:"auth_id" json:"authID" validate:"required"`
	Name   string `db:"name" json:"name"`
	Email  string `email:"email" json:"email" validate:"email"`
	Avatar string `db:"avatar_url" json:"avatar,omitempty"`
}

// These are the traits that we get from the auth provider.
type UserTraits struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Avatar         string `json:"avatar"`
	GithubUsername string `json:"githubUsername"`
}
