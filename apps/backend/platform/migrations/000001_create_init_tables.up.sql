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

CREATE FUNCTION increment_build() RETURNS TRIGGER AS $$
BEGIN
  SELECT max(build_number) + 1 INTO NEW.build_number
  FROM build
  WHERE project_id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE PROJECT_SOURCE AS ENUM ('github', 'gitlab', 'bitbucket', 'custom');

-- Create project table
CREATE TABLE project (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Project information
    name VARCHAR(255) NOT NULL,
    source PROJECT_SOURCE NOT NULL,
    source_id VARCHAR(255),
    token VARCHAR(255)
);

CREATE TYPE PROJECT_ROLE AS ENUM ('owner', 'admin', 'reviewer', 'viewer');

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON project
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Create user_project table
CREATE TABLE project_users (
    user_id UUID NOT NULL,
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    role PROJECT_ROLE NOT NULL
);

CREATE TYPE BUILD_STATUS AS ENUM ('uploading', 'processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');

-- Create build table
CREATE TABLE build (
    id UUID DEFAULT uuid_generate_v4 () PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    build_number INT NOT NULL,

    -- Build information
    sha VARCHAR(40) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    message TEXT,
    author VARCHAR(255),
    pr_title VARCHAR(255),
    status BUILD_STATUS NOT NULL DEFAULT 'uploading',
    errors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    UNIQUE (project_id, build_number)
);

-- Automatically increment build number
CREATE TRIGGER set_build_number
BEFORE INSERT ON build
FOR EACH ROW
EXECUTE PROCEDURE increment_build();

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

-- Create image table
CREATE TABLE image (
    hash VARCHAR(64) NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    url TEXT NOT NULL
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON image
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

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
    image_hash VARCHAR(64) NOT NULL REFERENCES image(hash),

    -- Comparison information
    status SNAPSHOT_STATUS NOT NULL DEFAULT 'processing',
    baseline_snapshot_id UUID REFERENCES snapshot(id),

    -- Review information
    reviewer_id UUID,
    review_timestamp TIMESTAMPTZ,

    UNIQUE (build_id, name, variant, target)
);

-- Automatically set updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON snapshot
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

