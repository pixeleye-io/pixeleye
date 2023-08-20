package queues

import (
	"encoding/json"

	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

type ProjectEventQueue struct {
	*brokerTypes.Broker
}

func (q *ProjectEventQueue) QueueProjectEvent(projectID string, event interface{}) error {
	log.Debug().Msg("Sending project event")

	body, err := json.Marshal(event)

	if err != nil {
		log.Error().Err(err).Msg("Failed to marshal project event")
		return err
	}

	return q.Send(brokerTypes.ProjectUpdate, projectID, body)
}
