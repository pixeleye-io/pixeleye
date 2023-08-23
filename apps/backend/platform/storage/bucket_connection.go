package storage

import (
	"context"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type BucketClient struct {
	S3Client      *s3.Client
	PresignClient *s3.PresignClient
}

var globalClient *BucketClient

var globalS3Client *s3.Client

func getConfig() (aws.Config, error) {
	var endpoint = os.Getenv("S3_ENDPOINT")
	var accessKeyId = os.Getenv("S3_ACCESS_KEY_ID")
	var accessKeySecret = os.Getenv("S3_KEY_SECRET")

	r2Resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: endpoint,
		}, nil
	})

	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(r2Resolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKeyId, accessKeySecret, "",
		)),
	)
	return cfg, err
}

func getS3Client() (*s3.Client, error) {
	if globalS3Client == nil {

		sdkConfig, err := getConfig()

		if err != nil {
			return nil, err
		}

		globalS3Client = s3.NewFromConfig(sdkConfig)
	}
	return globalS3Client, nil
}

func GetClient() (*BucketClient, error) {

	if globalClient == nil {
		s3Client, err := getS3Client()

		if err != nil {
			return nil, err
		}

		presignClient := s3.NewPresignClient(s3Client)

		globalClient = &BucketClient{
			PresignClient: presignClient,
			S3Client:      s3Client,
		}
	}

	return globalClient, nil
}
