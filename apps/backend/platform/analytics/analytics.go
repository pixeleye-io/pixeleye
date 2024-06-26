package analytics

import (
	"os"

	"github.com/posthog/posthog-go"
	"github.com/rs/zerolog/log"
)

// nolint:gochecknoglobals
var globalClient posthog.Client

func getClient(apiKey string) (posthog.Client, error) {

	if globalClient == nil {
		client, err := posthog.NewWithConfig(apiKey, posthog.Config{Endpoint: "https://eu.posthog.com"})
		if err != nil {
			return nil, err
		}

		globalClient = client
	}

	return globalClient, nil
}

func CloseClient() {
	if globalClient != nil {
		globalClient.Close()
		globalClient = nil
	}
}

// This function is used to filter out properties that we don't want to send to PostHog.
// We do this to ensure when users are self-hosting Pixeleye, we only get anonymous data.
func FilterProperties(properties posthog.Properties) posthog.Properties {
	filteredProperties := posthog.Properties{}

	remove := []string{"email", "name", "team_name", "team_url", "team_avatar_url", "url", "source_id"}

	for _, key := range remove {
		delete(properties, key)
	}

	return filteredProperties
}

func Identify(message posthog.Identify) {

	if os.Getenv("DISABLE_ANALYTICS") == "true" {
		return
	}

	apiKey := os.Getenv("POSTHOG_API_KEY")
	if apiKey == "" {
		log.Error().Msg("POSTHOG_API_KEY is not set")
		return
	}

	client, err := getClient(apiKey)
	if err != nil {
		log.Error().Err(err).Msg("Error getting analytics client")
	}

	if os.Getenv("PIXELEYE_HOSTING") != "true" {
		message.Properties = FilterProperties(message.Properties)
	}

	if err := client.Enqueue(message); err != nil {
		log.Error().Err(err).Msg("Error sending analytics event")
	}
}

func Track(message posthog.Capture) {

	if os.Getenv("DISABLE_ANALYTICS") == "true" {
		return
	}

	apiKey := os.Getenv("POSTHOG_API_KEY")
	if apiKey == "" {
		log.Error().Msg("POSTHOG_API_KEY is not set")
		return
	}

	client, err := getClient(apiKey)
	if err != nil {
		log.Error().Err(err).Msg("Error getting analytics client")
	}

	if os.Getenv("PIXELEYE_HOSTING") != "true" {
		message.Properties = FilterProperties(message.Properties)
	}

	if err := client.Enqueue(message); err != nil {
		log.Error().Err(err).Msg("Error sending analytics event")
	}
}
