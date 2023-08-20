package events

import brokerPkg "github.com/pixeleye-io/pixeleye/platform/broker"

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
