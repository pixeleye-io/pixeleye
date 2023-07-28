package models

type GenericRes struct {
	Message string `json:"message" validate:"required"`
}
