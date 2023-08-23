package stores

import (
	"fmt"
	"os"

	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/pixeleye-io/pixeleye/platform/storage"
)

type ImageStore struct {
	*storage.BucketClient
}

func GetImageStore(client *storage.BucketClient) (*ImageStore, error) {
	if client == nil {
		var err error
		client, err = storage.GetClient()

		if err != nil {
			return nil, err
		}
	}

	return &ImageStore{client}, nil
}

func GetSnapPath(hash string, projectID string) string {
	return fmt.Sprintf("snaps/%s/%s.png", projectID, hash)
}

func (s *ImageStore) GetSnapURL(hash string, projectID string) (*v4.PresignedHTTPRequest, error) {
	bucketName := os.Getenv("S3_BUCKET")

	path := GetSnapPath(hash, projectID)
	return s.GetObject(bucketName, path, 3600)
}

func GetDiffPath(hash string, projectID string) string {
	return fmt.Sprintf("diffs/%s/%s.png", projectID, hash)
}

func (s *ImageStore) GetDiffURL(hash string, projectID string) (*v4.PresignedHTTPRequest, error) {
	bucketName := os.Getenv("S3_BUCKET")

	path := GetDiffPath(hash, projectID)
	return s.GetObject(bucketName, path, 3600)
}
