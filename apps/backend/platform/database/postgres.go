package database

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/jmoiron/sqlx"

	_ "github.com/lib/pq"
)

// PostgreSQLConnection func for connection to PostgreSQL database.
func PostgreSQLConnection() (*sqlx.DB, error) {
	// Define database connection settings.
	maxConn, _ := strconv.Atoi(os.Getenv("DB_MAX_CONNECTIONS"))
	maxIdleConn, _ := strconv.Atoi(os.Getenv("DB_MAX_IDLE_CONNECTIONS"))
	maxLifetimeConn, _ := time.ParseDuration(os.Getenv("DB_MAX_LIFETIME_CONNECTIONS"))

	username := os.Getenv("DB_USERNAME")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbSSLMode := os.Getenv("DB_SSL_MODE")

	password = url.PathEscape(password)

	postgresConnURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s", username, password, host, port, dbName, dbSSLMode)

	// Define database connection for PostgreSQL.
	db, err := sqlx.Connect("postgres", postgresConnURL)
	if err != nil {
		return nil, fmt.Errorf("error, not connected to database, env: %s, %w", postgresConnURL, err)
	}

	// Set database connection settings:
	// 	- SetMaxOpenConns: the default is 0 (unlimited)
	// 	- SetMaxIdleConns: defaultMaxIdleConns = 2
	// 	- SetConnMaxLifetime: 0, connections are reused forever
	db.SetMaxOpenConns(maxConn)
	db.SetMaxIdleConns(maxIdleConn)
	db.SetConnMaxLifetime(maxLifetimeConn)

	// Try to ping database.
	if err := db.Ping(); err != nil {
		defer db.Close() // close database connection
		return nil, fmt.Errorf("error, not sent ping to database, %w", err)
	}

	return db.Unsafe(), nil
}
