package stores

import (
	"context"
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

func GetSnapPath(projectID string, hash string) string {
	return fmt.Sprintf("%s/snaps/%s.png", projectID, hash)
}

func (s *ImageStore) GetSnapURL(projectID string, hash string) (*v4.PresignedHTTPRequest, error) {
	bucketName := os.Getenv("S3_BUCKET")

	path := GetSnapPath(projectID, hash)
	return s.GetObject(context.TODO(), bucketName, path, 3600)
}

func GetDiffPath(projectID string, hash string) string {
	return fmt.Sprintf("%s/diffs/%s.png", projectID, hash)
}

func (s *ImageStore) GetDiffURL(projectID string, hash string) (*v4.PresignedHTTPRequest, error) {
	bucketName := os.Getenv("S3_BUCKET")

	path := GetDiffPath(projectID, hash)
	return s.GetObject(context.TODO(), bucketName, path, 3600)
}
