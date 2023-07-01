package database

import (
	"github.com/jmoiron/sqlx"
	"github.com/pixeleye-io/pixeleye/app/queries"
)

// Queries struct for collect all app queries.
type Queries struct {
	*queries.BuildQueries    // load queries from Build model
	*queries.SnapshotQueries // load queries from Snapshot model
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
		BuildQueries:    &queries.BuildQueries{DB: db},    // from Build model
		SnapshotQueries: &queries.SnapshotQueries{DB: db}, // from Snapshot model
	}, nil
}
