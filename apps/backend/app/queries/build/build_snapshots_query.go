package build_queries

import (
	"fmt"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/pixeleye-io/pixeleye/app/stores"
	"github.com/rs/zerolog/log"
)

type PairedSnapshot struct {
	models.Snapshot
	SnapHash *string `db:"snap_hash" json:"snapHash,omitempty"`

	BaselineHash *string `db:"baseline_hash" json:"baselineHash,omitempty"`
	DiffHash     *string `db:"diff_hash" json:"diffHash,omitempty"`

	SnapURL    *string `db:"snap_url" json:"snapURL,omitempty"`
	SnapHeight *int    `db:"snap_height" json:"snapHeight,omitempty"`
	SnapWidth  *int    `db:"snap_width" json:"snapWidth,omitempty"`

	BaselineURL    *string `db:"baseline_url" json:"baselineURL,omitempty"`
	BaselineHeight *int    `db:"baseline_height" json:"baselineHeight,omitempty"`
	BaselineWidth  *int    `db:"baseline_width" json:"baselineWidth,omitempty"`

	DiffURL    *string `db:"diff_url" json:"diffURL,omitempty"`
	DiffHeight *int    `db:"diff_height" json:"diffHeight,omitempty"`
	DiffWidth  *int    `db:"diff_width" json:"diffWidth,omitempty"`
}

// Fetches all snapshots for a build and includes their comparisons
// Primary use is for our reviewer ui
func (q *BuildQueries) GetBuildsPairedSnapshots(build models.Build) ([]PairedSnapshot, error) {

	if !models.IsBuildPostProcessing(build.Status) {
		return []PairedSnapshot{}, fmt.Errorf("Build %s is not in post processing state", build.ID)
	}

	pairs := []PairedSnapshot{}

	imageStore, err := stores.GetImageStore(nil)

	if err != nil {
		return pairs, err
	}

	query := `
		SELECT
			snapshot.*,
			snapshot_image.hash AS snap_hash,
			snapshot_image.height AS snap_height,
			snapshot_image.width AS snap_width,

			baseline_image.hash AS baseline_hash,
			baseline_image.height AS baseline_height,
			baseline_image.width AS baseline_width,

			diff_image.hash AS diff_hash,
			diff_image.height AS diff_height,
			diff_image.width AS diff_width
		FROM
			snapshot
		LEFT JOIN snap_image AS snapshot_image ON snapshot.snap_image_id = snapshot_image.id
		LEFT JOIN snapshot AS baseline ON snapshot.baseline_snapshot_id = baseline.id
		LEFT JOIN snap_image AS baseline_image ON baseline.snap_image_id = baseline_image.id
		LEFT JOIN diff_image ON snapshot.diff_image_id = diff_image.id
		WHERE
			snapshot.build_id = $1
	`

	if err := q.Select(&pairs, query, build.ID); err != nil {
		return pairs, err
	}

	for i := range pairs {
		if pairs[i].SnapHash != nil {
			hash := *pairs[i].SnapHash
			snapURL, err := imageStore.GetSnapURL(build.ProjectID, hash)
			if err == nil {
				pairs[i].SnapURL = &snapURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get snapshot hash %s and projectID %s", hash, build.ProjectID)
			}
		}
		if pairs[i].BaselineHash != nil {
			hash := *pairs[i].BaselineHash
			baselineURL, err := imageStore.GetSnapURL(build.ProjectID, hash)
			if err == nil {
				pairs[i].BaselineURL = &baselineURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get baseline hash %s and projectID %s", hash, build.ProjectID)
			}
		}
		if pairs[i].DiffHash != nil {
			hash := *pairs[i].DiffHash
			diffURL, err := imageStore.GetDiffURL(build.ProjectID, hash)
			if err == nil {
				pairs[i].DiffURL = &diffURL.URL
			} else {
				log.Error().Err(err).Msgf("Failed to get diff hash %s and projectID %s", hash, build.ProjectID)
			}
		}
	}

	return pairs, nil
}
