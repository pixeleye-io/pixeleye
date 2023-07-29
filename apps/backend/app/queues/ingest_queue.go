package queues

import (
	"encoding/json"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/platform/brokerTypes"
	"github.com/rs/zerolog/log"
)

type IngestQueue struct {
	*brokerTypes.Broker
}

// TODO - I should investigate what the best batch size is here
const batchSize = 15

func (q *IngestQueue) QueueSnapshotsIngest(snapshots []models.Snapshot) error {

	var err error

	batched := [batchSize]string{}
	for i := 0; i < len(snapshots); i++ {

		batched[i%batchSize] = snapshots[i].ID

		// We send off the batch if it is full or we are at the end of the snapshots
		if i%batchSize == batchSize-1 || i == len(snapshots)-1 {
			body, marshErr := json.Marshal(batched)

			batched = [batchSize]string{}

			if marshErr != nil {
				log.Error().Err(marshErr).Msg("Failed to marshal snapshots")
				err = marshErr
				continue
			}

			err = q.Send(brokerTypes.BuildProcess, "", body)

		}
	}

	return err // This is the last error we got
}
