-- Add UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
-- For more information, please visit:
-- https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
SET TIMEZONE="Europe/London";

-- Add set timestamp function
-- https://x-team.com/blog/automatic-timestamps-with-postgresql/
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE BUILD_STATUS AS ENUM ('uploading', 'processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');

-- Create build table
CREATE TABLE build (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Build information
    sha VARCHAR(40) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    message TEXT,
    author VARCHAR(255),
    title VARCHAR(255),
    status BUILD_STATUS NOT NULL DEFAULT 'uploading',
    errors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON build
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create build_target table
CREATE TABLE build_target (
    build_id UUID NOT NULL REFERENCES build(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES build(id) ON DELETE CASCADE
);

-- Create build_source table
CREATE TABLE build_source (
    build_id UUID NOT NULL REFERENCES build(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES build(id) ON DELETE CASCADE
);

CREATE TYPE SNAPSHOT_STATUS AS ENUM ('processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');

-- Create snapshot table
CREATE TABLE snapshot (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Snapshot information
    build_id UUID NOT NULL REFERENCES build(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    variant VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,

    status SNAPSHOT_STATUS NOT NULL DEFAULT 'processing',

    UNIQUE (build_id, name, variant, target)
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON snapshot
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create user table
CREATE TABLE user (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- User information
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,

    UNIQUE (email)
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TYPE ACCOUNT_PROVIDER AS ENUM ('github', 'gitlab', 'bitbucket');

-- Create Account table
CREATE TABLE account (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Account information
    user_id UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    provider ACCOUNT_PROVIDER NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    access_token_expires TIMESTAMPTZ NOT NULL,

    UNIQUE (user_id, provider, provider_id)
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON account
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create Session table
CREATE TABLE session (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Session information
    user_id UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    UNIQUE (user_id, token)
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON session
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

