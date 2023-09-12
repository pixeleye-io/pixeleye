package storage

import (
	"bytes"
	"context"
	"errors"
	"io"

	_ "image/png"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/aws/smithy-go"
	"github.com/rs/zerolog/log"
)

// BucketExists checks whether a bucket exists in the current account.
func (basics BucketClient) BucketExists(bucketName string) (bool, error) {
	_, err := basics.S3Client.HeadBucket(context.TODO(), &s3.HeadBucketInput{
		Bucket: aws.String(bucketName),
	})
	exists := true
	if err != nil {
		var apiError smithy.APIError
		if errors.As(err, &apiError) {
			switch apiError.(type) {
			case *types.NotFound:
				exists = false
				err = nil
			}
		}
	}

	return exists, err
}

func (basics BucketClient) KeyExists(ctx context.Context, bucketName string, objectKey string) (bool, error) {
	_, err := basics.S3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	exists := true
	if err != nil {
		var apiError smithy.APIError
		if errors.As(err, &apiError) {
			switch apiError.(type) {
			case *types.NotFound:
				exists = false
				err = nil
			}
		}
	}

	return exists, err
}

// Delete deletes a key from a bucket.
func (basics BucketClient) Delete(ctx context.Context, bucketName string, objectKey string) error {
	_, err := basics.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		log.Error().Err(err).Msgf("Couldn't delete object %v:%v", bucketName, objectKey)
	}
	return err
}

// UploadFile reads from a file and puts the data into an object in a bucket.
func (basics BucketClient) UploadFile(bucketName string, objectKey string, file []byte, contentType string) error {

	_, err := basics.S3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		Body:        bytes.NewReader(file),
		ContentType: &contentType,
	})
	if err != nil {
		log.Error().Err(err).Msgf("Couldn't upload file to %v:%v",
			bucketName, objectKey)
	}

	return err
}

// DownloadFile gets an object from a bucket and stores it in a local file.
func (basics BucketClient) DownloadFile(bucketName string, objectKey string) ([]byte, error) {
	result, err := basics.S3Client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		log.Error().Err(err).Msgf("Couldn't get object %v:%v", bucketName, objectKey)
		return nil, err
	}
	defer result.Body.Close()

	body, err := io.ReadAll(result.Body)
	if err != nil {
		log.Error().Err(err).Msgf("Couldn't read object body from %v", objectKey)
	}
	return body, err
}
