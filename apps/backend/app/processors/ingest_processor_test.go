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
