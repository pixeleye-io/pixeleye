package processors

import (
	"bytes"
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
