package session

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/pixeleye-io/pixeleye/app/models"
)

// global session store
var globalStore *session.Store

func getStore() *session.Store {
	if globalStore == nil {
		globalStore = session.New(
			session.Config{},
		)
	}
	return globalStore
}

func GetUser(c *fiber.Ctx) (*session.Session, error) {
	store := getStore()
	sess, err := store.Get(c)

	if err != nil {
		return nil, err
	}

	return sess, nil
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
