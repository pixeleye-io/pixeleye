package main

import (
	"github.com/pixeleye-io/pixeleye/pkg/ingest"
	"github.com/rs/zerolog/log"
)

func main() {
	log.Info().Msg("Starting ingest server...")
	ingest.StartIngestServerWithGracefulShutdown()
}
