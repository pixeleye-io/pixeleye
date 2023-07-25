package models

type User struct {
	ID     string `json:"id" validate:"required"`
	Name   string `json:"name"`
	Email  string `json:"email" validate:"email"`
	Avatar string `json:"avatar"`
}

type UserTraits struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Avatar         string `json:"avatar"`
	GithubUsername string `json:"githubUsername"`
}
