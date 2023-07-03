package queues

import (
	"encoding/json"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
)

type IngestQueue struct {
	*brokerTypes.Broker
}

func (q *IngestQueue) QueueSnapshotsIngest(snapshots []models.Snapshot) error {

	body, err := json.Marshal(snapshots)

	if err != nil {
		return err
	}

	err = q.Send(brokerTypes.BuildProcess, "", body)

	return err
}
