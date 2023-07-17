package models

import "github.com/google/uuid"

type User struct {
	ID     uuid.UUID `json:"id" validate:"required,uuid"`
	Name   string    `json:"name"`
	Email  string    `json:"email" validate:"email"`
	Avatar string    `json:"avatar"`
}

type UserTraits struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Avatar         string `json:"avatar"`
	GithubUsername string `json:"githubUsername"`
}
