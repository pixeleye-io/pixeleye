-- Delete tables
DROP TABLE IF EXISTS build;
DROP TABLE IF EXISTS build_target;
DROP TABLE IF EXISTS build_source;
DROP TABLE IF EXISTS snapshot;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS session;

-- Delete types
DROP TYPE IF EXISTS BUILD_STATUS;
DROP TYPE IF EXISTS SNAPSHOT_STATUS;
DROP TYPE IF EXISTS ACCOUNT_PROVIDER;


-- Delete functions
DROP FUNCTION IF EXISTS trigger_set_timestamp;

-- Delete extensions
DROP EXTENSION IF EXISTS "uuid-ossp";