package models

import "time"

type UserDeleteRequest struct {
	UserID     string    `db:"user_id" json:"userID" validate:"required"`
	CreatedAt  time.Time `db:"created_at" json:"createdAt"`
	ExpiriesAt time.Time `db:"updated_at" json:"expiriesAt"`
}
