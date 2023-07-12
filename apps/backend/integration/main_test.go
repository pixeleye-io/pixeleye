package integration

import (
	"fmt"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib" // load pgx driver for PostgreSQL
	"github.com/jmoiron/sqlx"
	"github.com/labstack/v4/echo"
	"github.com/ory/dockertest/v3"
	"github.com/ory/dockertest/v3/docker"
	"github.com/pixeleye-io/pixeleye/pkg/routes"
	"github.com/pixeleye-io/pixeleye/pkg/utils"
	amqp "github.com/rabbitmq/amqp091-go"
	log "github.com/sirupsen/logrus"
)

var db *sqlx.DB
var connectRabbitMQ *amqp.Connection

var app *echo.Echo

func SetEnv(dbPort string, mqPort string) {
	utils.FailOnError(os.Setenv("STAGE_STATUS", "dev"), "Failed setting STAGE_STATUS")
	utils.FailOnError(os.Setenv("SERVER_HOST", "0.0.0.0"), "Failed setting SERVER_HOST")
	utils.FailOnError(os.Setenv("SERVER_PORT", "5000"), "Failed setting SERVER_PORT")
	utils.FailOnError(os.Setenv("SERVER_READ_TIMEOUT", "60"), "Failed setting SERVER_READ_TIMEOUT")

	utils.FailOnError(os.Setenv("AMQP_USER", "guest"), "Failed setting AMQP_USER")
	utils.FailOnError(os.Setenv("AMQP_PASSWORD", "guest"), "Failed setting AMQP_PASSWORD")
	utils.FailOnError(os.Setenv("AMQP_HOST", "localhost"), "Failed setting AMQP_HOST")
	utils.FailOnError(os.Setenv("AMQP_PORT", mqPort), "Failed setting AMQP_PORT")

	utils.FailOnError(os.Setenv("DB_HOST", "localhost"), "Failed setting DB_HOST")
	utils.FailOnError(os.Setenv("DB_PORT", dbPort), "Failed setting DB_PORT")
	utils.FailOnError(os.Setenv("DB_USER", "guest"), "Failed setting DB_USER")
	utils.FailOnError(os.Setenv("DB_PASSWORD", "123"), "Failed setting DB_PASSWORD")
	utils.FailOnError(os.Setenv("DB_NAME", "pixeleye_test"), "Failed setting DB_NAME")
	utils.FailOnError(os.Setenv("DB_SSL_MODE", "disable"), "Failed setting DB_SSL_MODE")
	utils.FailOnError(os.Setenv("DB_MAX_CONNECTIONS", "100"), "Failed setting DB_MAX_CONNECTIONS")
	utils.FailOnError(os.Setenv("DB_MAX_IDLE_CONNECTIONS", "10"), "Failed setting DB_MAX_IDLE_CONNECTIONS")
	utils.FailOnError(os.Setenv("DB_MAX_LIFETIME_CONNECTIONS", "2"), "Failed setting DB_MAX_LIFETIME_CONNECTIONS")
}

func TestMain(m *testing.M) {
	// uses a sensible default on windows (tcp/http) and linux/osx (socket)
	pool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatalf("Could not construct pool: %s", err)
	}

	err = pool.Client.Ping()
	if err != nil {
		log.Fatalf("Could not connect to Docker: %s", err)
	}

	// pulls an image, creates a container based on it and runs it
	postgresDB, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "postgres",
		Tag:        "15",
		Env: []string{
			"POSTGRES_PASSWORD=123",
			"POSTGRES_USER=guest",
			"POSTGRES_DB=pixeleye_test",
			"listen_addresses = '*'",
		},
	}, func(config *docker.HostConfig) {
		// set AutoRemove to true so that stopped container goes away by itself
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})
	if err != nil {
		log.Fatalf("Could not start resource: %s", err)
	}

	// pulls an image, creates a container based on it and runs it
	rabbitmq, err := pool.RunWithOptions(&dockertest.RunOptions{
		Repository: "rabbitmq",
		Tag:        "3",
		Env:        []string{},
	}, func(config *docker.HostConfig) {
		// set AutoRemove to true so that stopped container goes away by itself
		config.AutoRemove = true
		config.RestartPolicy = docker.RestartPolicy{Name: "no"}
	})
	if err != nil {
		log.Fatalf("Could not start resource: %s", err)
	}

	databasePort := postgresDB.GetHostPort("5432/tcp")
	databaseUrl := fmt.Sprintf("postgres://guest:123@%s/pixeleye_test?sslmode=disable", databasePort)

	log.Println("Connecting to database on url: ", databaseUrl)

	postgresDB.Expire(120) // Tell docker to hard kill the container in 120 seconds
	rabbitmq.Expire(120)   // Tell docker to hard kill the container in 120 seconds

	// exponential backoff-retry, because the application in the container might not be ready to accept connections yet
	pool.MaxWait = 60 * time.Second
	if err = pool.Retry(func() error {
		var err error
		db, err = sqlx.Connect("pgx", databaseUrl)
		if err != nil {
			return err
		}
		return db.Ping()
	}); err != nil {
		log.Fatalf("Could not connect to postgres docker: %s", err)
	}

	amqpPort := rabbitmq.GetHostPort("5672/tcp")
	amqpUrl := fmt.Sprintf("amqp://guest:guest@%s/", amqpPort)

	log.Println("Connecting to rabbitmq on url: ", amqpUrl)

	SetEnv(strings.Split(databasePort, ":")[1], strings.Split(amqpPort, ":")[1])

	// exponential backoff-retry, because the application in the container might not be ready to accept connections yet
	pool.MaxWait = 60 * time.Second
	if err = pool.Retry(func() error {
		var err error
		connectRabbitMQ, err = amqp.Dial(amqpUrl)
		if err != nil {
			return err
		}
		return nil
	}); err != nil {
		log.Fatalf("Could not connect to rabbitmq docker: %s", err)
	}

	// Migrating DB
	driver, err := postgres.WithInstance(db.DB, &postgres.Config{})
	utils.FailOnError(err, "Failed to create postgres driver")
	migration, err := migrate.NewWithDatabaseInstance(
		"file://../platform/migrations",
		"postgres", driver)
	utils.FailOnError(err, "Failed to create migration instance")
	migration.Up()

	// Create a new echo app
	app = SetupApp()

	utils.StartServer(app)

	//Run tests
	code := m.Run()

	app.Shutdown()

	// You can't defer this because os.Exit doesn't care for defer
	if err := pool.Purge(postgresDB); err != nil {
		log.Fatalf("Could not purge resource: %s", err)
	}
	if err := pool.Purge(rabbitmq); err != nil {
		log.Fatalf("Could not purge resource: %s", err)
	}

	os.Exit(code)
}

func SetupApp() *echo.Echo {
	e := echo.New()

	// Routes
	routes.HealthRoutes(e) // Register Health routes
	routes.ProjectRoutes(e)

	return e
}
