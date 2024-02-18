package events

import (
	"github.com/pixeleye-io/pixeleye/app/models"
	brokerPkg "github.com/pixeleye-io/pixeleye/platform/broker"
	"github.com/rs/zerolog/log"
)

type Notifier struct {
	*ProjectEvent
}

type EventPayload struct {
	Type string `json:"type"`

	Data interface{} `json:"data"`
}

func GetNotifier(broker *brokerPkg.Queues) (*Notifier, error) {

	var err error
	if broker == nil {
		broker, err = brokerPkg.GetBroker()
		if err != nil {
			return nil, err
		}
	}

	return &Notifier{
		ProjectEvent: &ProjectEvent{
			Queues: broker,
		},
	}, nil
}

func HandleBuildStatusChange(build models.Build) {
	go func(build models.Build) {
		notifier, err := GetNotifier(nil)
		if err != nil {
			log.Error().Err(err).Msg("Failed to get notifier")
			return
		}
		notifier.BuildStatusChange(build)
	}(build)
}
