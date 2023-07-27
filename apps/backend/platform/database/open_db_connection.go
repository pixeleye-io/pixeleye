package database

import (
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/queries"
)

// Queries struct for collect all app queries.
type Queries struct {
	*queries.BuildQueries
	*queries.SnapshotQueries
	*queries.ProjectQueries
	*queries.SnapImageQueries
	*queries.DiffImageQueries
}

// OpenDBConnection func for opening database connection.
func OpenDBConnection() (*Queries, error) {
	// Define Database connection variables.
	var (
		db  *sqlx.DB
		err error
	)

	// Define a new Database connection
	db, err = PostgreSQLConnection()

	if err != nil {
		return nil, err
	}

	return &Queries{
		// Set queries from models:
		BuildQueries:     &queries.BuildQueries{DB: db},
		SnapshotQueries:  &queries.SnapshotQueries{DB: db},
		ProjectQueries:   &queries.ProjectQueries{DB: db},
		SnapImageQueries: &queries.SnapImageQueries{DB: db},
		DiffImageQueries: &queries.DiffImageQueries{DB: db},
	}, nil
}
