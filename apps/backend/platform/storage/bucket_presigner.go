package storage

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func replaceS3Endpoint(request *v4.PresignedHTTPRequest) {

	if os.Getenv("PIXELEYE_HOSTING") == "true" {
		return
	}

	s3Endpoint := os.Getenv("S3_ENDPOINT")
	clientS3Endpoint := os.Getenv("CLIENT_S3_ENDPOINT")

	if s3Endpoint == "" || clientS3Endpoint == "" {
		return
	}

	httpURL := fmt.Sprint("http://%s", s3Endpoint)
	httpsURL := fmt.Sprint("https://%s", s3Endpoint)

	url := request.URL

	if strings.HasPrefix(url, httpURL) {
		request.URL = strings.Replace(url, httpURL, fmt.Sprint("http://%s", clientS3Endpoint), 1)
	} else if strings.HasPrefix(url, httpsURL) {
		request.URL = strings.Replace(url, httpsURL, fmt.Sprint("https://%s", clientS3Endpoint), 1)
	}
}

// GetObject makes a presigned request that can be used to get an object from a bucket.
// The presigned request is valid for the specified number of seconds.
func (presigner BucketClient) GetObject(ctx context.Context,
	bucketName string, objectKey string, lifetimeSecs int64) (*v4.PresignedHTTPRequest, error) {
	request, err := presigner.PresignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(lifetimeSecs * int64(time.Second))
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to get %v:%v. Here's why: %v\n",
			bucketName, objectKey, err)
	}

	replaceS3Endpoint(request)

	return request, err
}

// PutObject makes a presigned request that can be used to put an object in a bucket.
// The presigned request is valid for the specified number of seconds.
func (presigner BucketClient) PutObject(ctx context.Context,
	bucketName string, objectKey string, contentType string, lifetimeSecs int64) (*v4.PresignedHTTPRequest, error) {
	request, err := presigner.PresignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(bucketName),
		Key:         aws.String(objectKey),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = time.Duration(lifetimeSecs * int64(time.Second))
	})
	if err != nil {
		log.Printf("Couldn't get a presigned request to put %v:%v. Here's why: %v\n",
			bucketName, objectKey, err)
	}

	replaceS3Endpoint(request)

	return request, err
}
