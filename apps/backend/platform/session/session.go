package session

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/pixeleye-io/pixeleye/app/models"
)

// global session store
var globalStore *session.Store

func getStore() *session.Store {
	if globalStore == nil {
		globalStore = session.New()
		globalStore.RegisterType(models.User{})
	}
	return globalStore
}

func GetUser(c *fiber.Ctx) (models.User, error) {
	store := getStore()
	sess, err := store.Get(c)

	if err != nil {
		return models.User{}, err
	}

	user := sess.Get("user")

	if user == nil {
		return models.User{}, fmt.Errorf("user not found in session")
	}

	return user.(models.User), nil
}

func SetUser(c *fiber.Ctx, user models.User) error {
	store := getStore()
	sess, err := store.Get(c)

	if err != nil {
		return err
	}

	sess.Set("user", user)
	return sess.Save()
}

func ClearUser(c *fiber.Ctx) error {
	store := getStore()
	sess, err := store.Get(c)

	if err != nil {
		return err
	}

	return sess.Destroy()
}
