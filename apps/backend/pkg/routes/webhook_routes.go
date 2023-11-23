package routes

import (
	"github.com/labstack/echo/v4"
	"github.com/pixeleye-io/pixeleye/app/controllers"
)

func WebhookRoutes(e *echo.Echo) {

	v1 := e.Group("/v1/webhooks")

	v1.POST("/stripe", controllers.StripeWebhookController)

}
