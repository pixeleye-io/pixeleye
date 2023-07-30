package main

import (
	"os"

	"github.com/joho/godotenv"
	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/rs/zerolog"
)

func main() {
	godotenv.Load("./../../.env")

	// Start server (with or without graceful shutdown).
	if os.Getenv("STAGE_STATUS") == "dev" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		ingest.StartIngestServer()
	} else {
		ingest.StartIngestServerWithGracefulShutdown()
	}
}
