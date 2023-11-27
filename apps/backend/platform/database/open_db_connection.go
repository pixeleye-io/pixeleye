package database

import (
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/queries"
	build_queries "github.com/pixeleye-io/pixeleye/app/queries/build"
	github_queries "github.com/pixeleye-io/pixeleye/app/queries/github"
	snapshot_queries "github.com/pixeleye-io/pixeleye/app/queries/snapshot"
	team_queries "github.com/pixeleye-io/pixeleye/app/queries/team"
	"github.com/rs/zerolog/log"
)

// TODO - create something similar for tx (transaction) queries.

// Queries struct for collect all app queries.
type Queries struct {
	*build_queries.BuildQueries
	*snapshot_queries.SnapshotQueries
	*github_queries.GithubQueries
	*team_queries.TeamQueries
	*queries.ProjectQueries
	*queries.SnapImageQueries
	*queries.DiffImageQueries
	*queries.UserQueries
}

// nolint:gochecknoglobals
var db *sqlx.DB

// OpenDBConnection func for opening database connection.
func OpenDBConnection() (*Queries, error) {

	if db == nil {
		log.Info().Msg("OpenDBConnection: db is nil, creating new connection")
		var err error
		// Define a new Database connection
		db, err = PostgreSQLConnection()
		if err != nil {
			return nil, err
		}
	}

	return &Queries{
		// Set queries from models:
		BuildQueries:     &build_queries.BuildQueries{DB: db},
		SnapshotQueries:  &snapshot_queries.SnapshotQueries{DB: db},
		ProjectQueries:   &queries.ProjectQueries{DB: db},
		SnapImageQueries: &queries.SnapImageQueries{DB: db},
		DiffImageQueries: &queries.DiffImageQueries{DB: db},
		UserQueries:      &queries.UserQueries{DB: db},
		TeamQueries:      &team_queries.TeamQueries{DB: db},
		GithubQueries:    &github_queries.GithubQueries{DB: db},
	}, nil
}
