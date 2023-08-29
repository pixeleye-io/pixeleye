-- Create enum type "team_type"
CREATE TYPE "public"."team_type" AS ENUM ('github', 'gitlab', 'bitbucket', 'user');
-- Create enum type "git_installation_type"
CREATE TYPE "public"."git_installation_type" AS ENUM ('github', 'gitlab', 'bitbucket');
-- Create enum type "team_member_role"
CREATE TYPE "public"."team_member_role" AS ENUM ('owner', 'admin', 'accountant', 'member');
-- Create enum type "project_source"
CREATE TYPE "public"."project_source" AS ENUM ('github', 'gitlab', 'bitbucket', 'custom');
-- Create enum type "project_member_role"
CREATE TYPE "public"."project_member_role" AS ENUM ('admin', 'reviewer', 'viewer');
-- Create enum type "build_status"
CREATE TYPE "public"."build_status" AS ENUM ('uploading', 'queued-uploading', 'queued-processing', 'processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');
-- Create enum type "snapshot_status"
CREATE TYPE "public"."snapshot_status" AS ENUM ('queued', 'processing', 'failed', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');
-- Add new schema named "private"
CREATE SCHEMA "private";
-- Create "user_deletion_request" table
CREATE TABLE "public"."user_deletion_request" ("user_id" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL, "expires_at" timestamptz NOT NULL, PRIMARY KEY ("user_id"));
-- Create "users" table
CREATE TABLE "public"."users" ("id" character varying(21) NOT NULL, "auth_id" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "avatar_url" text NOT NULL, PRIMARY KEY ("id"));
-- Create index "idx_unique_user_auth_id" to table: "users"
CREATE UNIQUE INDEX "idx_unique_user_auth_id" ON "public"."users" ("auth_id");
-- Create "team" table
CREATE TABLE "public"."team" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "avatar_url" text NOT NULL, "url" text NOT NULL, "type" "public"."team_type" NOT NULL, "owner_id" character varying(21) NULL, "external_id" character varying(255) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "owner_id" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_unique_team_external_id" to table: "team"
CREATE UNIQUE INDEX "idx_unique_team_external_id" ON "public"."team" ("external_id");
-- Create index "idx_unqiue_user_team" to table: "team"
CREATE UNIQUE INDEX "idx_unqiue_user_team" ON "public"."team" ("type", "owner_id") WHERE (type = 'user'::team_type);
-- Create "git_installation" table
CREATE TABLE "public"."git_installation" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "team_id" character varying(21) NOT NULL, "type" "public"."git_installation_type" NOT NULL, "installation_id" integer NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "project" table
CREATE TABLE "public"."project" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "team_id" character varying(21) NOT NULL, "name" character varying(255) NOT NULL, "url" text NOT NULL, "source" "public"."project_source" NOT NULL, "source_id" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "build_count" integer NOT NULL DEFAULT 0, PRIMARY KEY ("id"), CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "project_users" table
CREATE TABLE "public"."project_users" ("project_id" character varying(21) NOT NULL, "user_id" character varying(21) NOT NULL, "role" "public"."project_member_role" NOT NULL, CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "snap_image" table
CREATE TABLE "public"."snap_image" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "format" character varying(255) NOT NULL, "project_id" character varying(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_snap_image-hash__project_id" to table: "snap_image"
CREATE UNIQUE INDEX "idx_snap_image-hash__project_id" ON "public"."snap_image" ("hash", "project_id");
-- Create "team_users" table
CREATE TABLE "public"."team_users" ("team_id" character varying(255) NOT NULL, "user_id" character varying(21) NOT NULL, "role" "public"."team_member_role" NOT NULL, CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "build" table
CREATE TABLE "public"."build" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "project_id" character varying(21) NOT NULL, "target_parent_id" character varying(21) NOT NULL, "build_number" integer NOT NULL DEFAULT 0, "status" "public"."build_status" NOT NULL DEFAULT 'uploading', "target_build_id" character varying(21) NOT NULL, "sha" character varying(255) NOT NULL, "branch" character varying(255) NOT NULL, "message" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "warnings" text[] NULL, "errors" text[] NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_build-build_number__project_id" to table: "build"
CREATE UNIQUE INDEX "idx_build-build_number__project_id" ON "public"."build" ("project_id", "build_number");
-- Create "diff_image" table
CREATE TABLE "public"."diff_image" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "format" character varying(255) NOT NULL, "project_id" character varying(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_diff_image-hash__project_id" to table: "diff_image"
CREATE UNIQUE INDEX "idx_diff_image-hash__project_id" ON "public"."diff_image" ("hash", "project_id");
-- Create "build_history" table
CREATE TABLE "public"."build_history" ("child_id" character varying(21) NOT NULL, "parent_id" character varying(21) NOT NULL, CONSTRAINT "child_id" FOREIGN KEY ("child_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "snapshot" table
CREATE TABLE "public"."snapshot" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "build_id" character varying(21) NOT NULL, "snap_image_id" character varying(21) NOT NULL, "name" character varying(255) NOT NULL, "variant" character varying(255) NOT NULL, "target" character varying(255) NOT NULL, "viewport" character varying(255) NOT NULL, "status" "public"."snapshot_status" NOT NULL DEFAULT 'processing', "baseline_snapshot_id" character varying(21) NULL, "diff_image_id" character varying(21) NULL, "reviewer_id" character varying(21) NULL, "reviewed_at" timestamptz NULL, PRIMARY KEY ("id"), CONSTRAINT "baseline_snapshot_id" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."snapshot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "build_id" FOREIGN KEY ("build_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "diff_image_id" FOREIGN KEY ("diff_image_id") REFERENCES "public"."diff_image" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "reviewer_id" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "snap_image_id" FOREIGN KEY ("snap_image_id") REFERENCES "public"."snap_image" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);
-- Create index "idx_snapshot-build_id__name__variant__target" to table: "snapshot"
CREATE UNIQUE INDEX "idx_snapshot-build_id__name__variant__target" ON "public"."snapshot" ("build_id", "name", "variant", "target");
