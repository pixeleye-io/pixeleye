`export POSTGRESQL_URL=''`
`migrate -database postgres://postgres:123@localhost:5432/pixeleye?sslmode=disable -path apps/backend/platform/migrations up`