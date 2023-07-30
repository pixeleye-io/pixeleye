package utils

import (
	"github.com/mitchellh/mapstructure"
	"github.com/ory/client-go"
	"github.com/pixeleye-io/pixeleye/app/models"
)

func DestructureUser(session *client.Session) (models.User, error) {
	user := models.User{}

	if err := mapstructure.Decode(session.Identity.GetTraits(), &user); err != nil {
		return user, err
	}

	user.ID = session.Identity.GetId()

	return user, nil
}
