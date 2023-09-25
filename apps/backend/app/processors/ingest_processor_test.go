package processors

import (
	"bytes"
	"slices"
	"testing"

	"github.com/pixeleye-io/pixeleye/app/models"
	"github.com/stretchr/testify/mock"

	storage_mocks "github.com/pixeleye-io/pixeleye/platform/storage/mocks"
)

type MockedBucketClient struct {
	mock.Mock
}

func TestDownloadSnapshotImages(t *testing.T) {

	t.Setenv("S3_BUCKET", "testBucket")

	s3 := storage_mocks.NewIBucketClient(t)

	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/snapHash.png").Return([]byte("snapBytes"), nil)
	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/baseHash.png").Return([]byte("baseBytes"), nil)

	snapImg := models.SnapImage{ProjectID: "project1", Hash: "snapHash"}
	baseImg := models.SnapImage{ProjectID: "project1", Hash: "baseHash"}

	snapBytes, baseBytes, err := downloadSnapshotImages(s3, snapImg, baseImg)

	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if !bytes.Equal(snapBytes, []byte("snapBytes")) {
		t.Logf("snapBytes: %v", string(snapBytes))
		t.Errorf("Unexpected snapBytes: %v", snapBytes)
	}

	if !bytes.Equal(baseBytes, []byte("baseBytes")) {
		t.Errorf("Unexpected baseBytes: %v", baseBytes)
	}

}

func TestDownloadSnapshotImages2(t *testing.T) {

	t.Setenv("S3_BUCKET", "testBucket2")

	s3 := storage_mocks.NewIBucketClient(t)

	s3.On("DownloadFile", mock.Anything, "testBucket2", "project2/snaps/snapHash.png").Return([]byte("snapBytes2"), nil)
	s3.On("DownloadFile", mock.Anything, "testBucket2", "project2/snaps/baseHash.png").Return([]byte("baseBytes2"), nil)

	snapImg := models.SnapImage{ProjectID: "project2", Hash: "snapHash"}
	baseImg := models.SnapImage{ProjectID: "project2", Hash: "baseHash"}

	snapBytes, baseBytes, err := downloadSnapshotImages(s3, snapImg, baseImg)

	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if !bytes.Equal(snapBytes, []byte("snapBytes2")) {
		t.Logf("snapBytes: %v", string(snapBytes))
		t.Errorf("Unexpected snapBytes: %v", snapBytes)
	}

	if !bytes.Equal(baseBytes, []byte("baseBytes2")) {
		t.Errorf("Unexpected baseBytes: %v", baseBytes)
	}

}

func TestDownloadSnapshotImagesError(t *testing.T) {

	t.Setenv("S3_BUCKET", "testBucket")

	s3 := storage_mocks.NewIBucketClient(t)

	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/snapHash.png").Return(nil, nil)
	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/baseHash.png").Return(nil, nil)

	snapImg := models.SnapImage{ProjectID: "project1", Hash: "snapHash"}
	baseImg := models.SnapImage{ProjectID: "project1", Hash: "baseHash"}

	_, _, err := downloadSnapshotImages(s3, snapImg, baseImg)

	if err == nil {
		t.Errorf("Expected error")
	}

}

func TestDownloadSnapshotImagesError2(t *testing.T) {

	t.Setenv("S3_BUCKET", "testBucket")

	s3 := storage_mocks.NewIBucketClient(t)

	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/snapHash.png").Return([]byte("snapBytes"), nil)
	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/baseHash.png").Return(nil, nil)

	snapImg := models.SnapImage{ProjectID: "project1", Hash: "snapHash"}
	baseImg := models.SnapImage{ProjectID: "project1", Hash: "baseHash"}

	_, _, err := downloadSnapshotImages(s3, snapImg, baseImg)

	if err == nil {
		t.Errorf("Expected error")
	}

}

func TestDownloadSnapshotImagesError3(t *testing.T) {

	t.Setenv("S3_BUCKET", "testBucket")

	s3 := storage_mocks.NewIBucketClient(t)

	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/snapHash.png").Return(nil, nil)
	s3.On("DownloadFile", mock.Anything, "testBucket", "project1/snaps/baseHash.png").Return([]byte("baseBytes"), nil)

	snapImg := models.SnapImage{ProjectID: "project1", Hash: "snapHash"}
	baseImg := models.SnapImage{ProjectID: "project1", Hash: "baseHash"}

	_, _, err := downloadSnapshotImages(s3, snapImg, baseImg)

	if err == nil {
		t.Errorf("Expected error")
	}
}

func TestGenerateBytesHash(t *testing.T) {
	testCases := []struct {
		name     string
		input    []byte
		expected string
	}{
		{
			name:     "empty input",
			input:    []byte{},
			expected: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
		},
		{
			name:     "non-empty input",
			input:    []byte("hello world"),
			expected: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actual, err := generateBytesHash(tc.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tc.expected != actual {
				t.Errorf("expected %s, but got %s", tc.expected, actual)
			}
		})
	}
}

func TestGroupSnapshots(t *testing.T) {
	testCases := []struct {
		name       string
		snapshots  []models.Snapshot
		baselines  []models.Snapshot
		new        []string
		unchanged  [][2]models.Snapshot
		unreviewed [][2]models.Snapshot
		changed    [][2]models.Snapshot
		rejected   [][2]models.Snapshot
	}{
		{
			name:       "empty input",
			snapshots:  []models.Snapshot{},
			baselines:  []models.Snapshot{},
			new:        []string{},
			unchanged:  [][2]models.Snapshot{},
			unreviewed: [][2]models.Snapshot{},
			changed:    [][2]models.Snapshot{},
			rejected:   [][2]models.Snapshot{},
		},
		{
			name: "no baselines",
			snapshots: []models.Snapshot{
				{ID: "1", Name: "snap1", Variant: "variant1"},
				{ID: "2", Name: "snap2", Variant: "variant1"},
				{ID: "3", Name: "snap3", Variant: "variant1"},
			},
			baselines:  []models.Snapshot{},
			new:        []string{"1", "2", "3"},
			unchanged:  [][2]models.Snapshot{},
			unreviewed: [][2]models.Snapshot{},
			changed:    [][2]models.Snapshot{},
			rejected:   [][2]models.Snapshot{},
		},
		{
			name:      "no snapshots",
			snapshots: []models.Snapshot{},
			baselines: []models.Snapshot{
				{ID: "1", Name: "snap1", Variant: "variant1"},
				{ID: "2", Name: "snap2", Variant: "variant1"},
				{ID: "3", Name: "snap3", Variant: "variant1"},
			},
			new:        []string{},
			unchanged:  [][2]models.Snapshot{},
			unreviewed: [][2]models.Snapshot{},
			changed:    [][2]models.Snapshot{},
			rejected:   [][2]models.Snapshot{},
		},
		{
			name: "no changes",
			snapshots: []models.Snapshot{
				{ID: "1", Name: "snap1", Variant: "variant1", SnapID: "snap1"},
				{ID: "2", Name: "snap2", Variant: "variant1", SnapID: "snap2"},
				{ID: "3", Name: "snap3", Variant: "variant1", SnapID: "snap3"},
			},
			baselines: []models.Snapshot{
				{ID: "11", Name: "snap1", Variant: "variant1", SnapID: "snap1", Status: models.SNAPSHOT_STATUS_APPROVED},
				{ID: "22", Name: "snap2", Variant: "variant1", SnapID: "snap2", Status: models.SNAPSHOT_STATUS_ORPHANED},
				{ID: "33", Name: "snap3", Variant: "variant1", SnapID: "snap3", Status: models.SNAPSHOT_STATUS_UNCHANGED},
			},
			new:        []string{},
			unchanged:  [][2]models.Snapshot{{{ID: "1"}, {ID: "11"}}, {{ID: "2"}, {ID: "22"}}, {{ID: "3"}, {ID: "33"}}},
			unreviewed: [][2]models.Snapshot{},
			changed:    [][2]models.Snapshot{},
			rejected:   [][2]models.Snapshot{},
		},
		{
			name: "unreviewed or changes",
			snapshots: []models.Snapshot{
				{ID: "1", Name: "snap1", Variant: "variant1", SnapID: "snap1"},
				{ID: "2", Name: "snap1", Variant: "variant2", SnapID: "snap2"},
				{ID: "3", Name: "snap3", Variant: "variant1", SnapID: "snap3"},
				{ID: "4", Name: "snap4", Variant: "variant1", SnapID: "snap4"},
			},
			baselines: []models.Snapshot{
				{ID: "11", Name: "snap1", Variant: "variant1", SnapID: "snap1", Status: models.SNAPSHOT_STATUS_UNREVIEWED},
				{ID: "22", Name: "snap1", Variant: "variant2", SnapID: "snap4", Status: models.SNAPSHOT_STATUS_APPROVED},
				{ID: "33", Name: "snap3", Variant: "variant1", SnapID: "snap5", Status: models.SNAPSHOT_STATUS_ORPHANED},
				{ID: "44", Name: "snap4", Variant: "variant1", SnapID: "snap6", Status: models.SNAPSHOT_STATUS_REJECTED},
			},
			new:        []string{},
			unchanged:  [][2]models.Snapshot{},
			unreviewed: [][2]models.Snapshot{{{ID: "1"}, {ID: "11"}}},
			changed:    [][2]models.Snapshot{{{ID: "2"}, {ID: "22"}}, {{ID: "3"}, {ID: "33"}}, {{ID: "4"}, {ID: "44"}}},
			rejected:   [][2]models.Snapshot{},
		},
		{
			name: "A bit of everything",
			snapshots: []models.Snapshot{
				{ID: "1", Name: "snap1", Variant: "variant1", SnapID: "snap1"},
				{ID: "2", Name: "snap1", Variant: "variant2", SnapID: "snap2"},
				{ID: "3", Name: "snap3", Variant: "variant1", SnapID: "snap3"},
				{ID: "4", Name: "snap4", Variant: "variant1", SnapID: "snap4"},
				{ID: "5", Name: "snap5", Variant: "variant1", SnapID: "snap5"},
				{ID: "6", Name: "snap6", Variant: "variant1", SnapID: "snap6"},
				{ID: "7", Name: "snap7", Variant: "variant1", SnapID: "snap7"},
				{ID: "8", Name: "snap8", Variant: "variant1", SnapID: "snap8"},
				{ID: "9", Name: "snap9", Variant: "variant1", SnapID: "snap9"},
			},
			baselines: []models.Snapshot{
				{ID: "11", Name: "snap1", Variant: "variant1", SnapID: "snap1", Status: models.SNAPSHOT_STATUS_UNREVIEWED},
				{ID: "22", Name: "snap1", Variant: "variant2", SnapID: "snap4", Status: models.SNAPSHOT_STATUS_APPROVED},
				{ID: "33", Name: "snap3", Variant: "variant1", SnapID: "snap3", Status: models.SNAPSHOT_STATUS_ORPHANED},
				{ID: "44", Name: "snap4", Variant: "variant1", SnapID: "snap4", Status: models.SNAPSHOT_STATUS_REJECTED},
				{ID: "88", Name: "snap8", Variant: "variant1", SnapID: "snap10", Status: models.SNAPSHOT_STATUS_ORPHANED},
			},
			new:        []string{"9", "5", "6", "7"},
			unchanged:  [][2]models.Snapshot{{{ID: "3"}, {ID: "33"}}},
			unreviewed: [][2]models.Snapshot{{{ID: "1"}, {ID: "11"}}},
			changed:    [][2]models.Snapshot{{{ID: "2"}, {ID: "22"}}, {{ID: "8"}, {ID: "88"}}},
			rejected:   [][2]models.Snapshot{{{ID: "4"}, {ID: "44"}}},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			actualNew, actualUnchanged, actualUnreviewed, actualChanged, actualRejected := groupSnapshots(tc.snapshots, tc.baselines)
			for _, id := range actualNew {
				if !slices.Contains(tc.new, id) {
					t.Errorf("actual new expected %v, but got %v", tc.new, actualNew)
				}
			}

			contains(t, tc.unchanged, actualUnchanged)
			contains(t, tc.unreviewed, actualUnreviewed)
			contains(t, tc.changed, actualChanged)
			contains(t, tc.rejected, actualRejected)

		})
	}
}

func contains(t *testing.T, arr [][2]models.Snapshot, actual [][2]models.Snapshot) {
	if len(arr) != len(actual) {
		t.Errorf("expected %v, but got %v", arr, actual)
	} else if len(arr) == 0 {
		return
	}
	for _, a := range arr {
		found := false
		for _, b := range actual {
			if a[0].ID == b[0].ID && a[1].ID == b[1].ID {
				found = true
			}
		}

		if !found {
			t.Errorf("expected %v, but got %v", arr, actual)
		}
	}
}
