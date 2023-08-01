-- Create enum type "project_source"
CREATE TYPE "public"."project_source" AS ENUM ('github', 'gitlab', 'bitbucket', 'custom');
-- Create enum type "project_member_role"
CREATE TYPE "public"."project_member_role" AS ENUM ('admin', 'reviewer', 'viewer');
-- Create enum type "build_status"
CREATE TYPE "public"."build_status" AS ENUM ('uploading', 'processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');
-- Create enum type "snapshot_status"
CREATE TYPE "public"."snapshot_status" AS ENUM ('processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');
-- Add new schema named "private"
CREATE SCHEMA "private";
-- Create "project" table
CREATE TABLE "public"."project" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "url" text NULL, "source" "public"."project_source" NOT NULL, "source_id" character varying(255) NULL, "token" character varying(255) NULL, PRIMARY KEY ("id"));
-- Create "snap_image" table
CREATE TABLE "public"."snap_image" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "project_id" character(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_snap_image-hash__project_id" to table: "snap_image"
CREATE UNIQUE INDEX "idx_snap_image-hash__project_id" ON "public"."snap_image" ("hash", "project_id");
-- Create "build" table
CREATE TABLE "public"."build" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "project_id" character(21) NOT NULL, "target_parent_id" character(21) NOT NULL, "build_number" integer NOT NULL DEFAULT 0, "status" "public"."build_status" NOT NULL DEFAULT 'uploading', "target_build_id" character(21) NULL, "sha" character varying(255) NOT NULL, "branch" character varying(255) NOT NULL, "message" character varying(255) NULL, "title" character varying(255) NULL, "warnings" text[] NULL, "errors" text[] NULL, "deleted_snapshot_ids" text[] NULL, "approved_by" character(21) NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_build-build_number__project_id" to table: "build"
CREATE UNIQUE INDEX "idx_build-build_number__project_id" ON "public"."build" ("project_id", "build_number");
-- Create "diff_image" table
CREATE TABLE "public"."diff_image" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "project_id" character(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_diff_image-hash__project_id" to table: "diff_image"
CREATE UNIQUE INDEX "idx_diff_image-hash__project_id" ON "public"."diff_image" ("hash", "project_id");
-- Create "snapshot" table
CREATE TABLE "public"."snapshot" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "build_id" character(21) NOT NULL, "snap_image_id" character(21) NOT NULL, "name" character varying(255) NOT NULL, "variant" character varying(255) NOT NULL, "target" character varying(255) NOT NULL, "status" "public"."snapshot_status" NOT NULL DEFAULT 'processing', "baseline_snapshot_id" character(21) NULL, "diff_image_id" character(21) NULL, "reviewer_id" character(21) NULL, "reviewed_at" timestamptz NULL, PRIMARY KEY ("id"), CONSTRAINT "baseline_snapshot_id" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."snapshot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "build_id" FOREIGN KEY ("build_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "diff_image_id" FOREIGN KEY ("diff_image_id") REFERENCES "public"."diff_image" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "snap_image_id" FOREIGN KEY ("snap_image_id") REFERENCES "public"."snap_image" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);
-- Create index "idx_snapshot-build_id__name__variant__target" to table: "snapshot"
CREATE UNIQUE INDEX "idx_snapshot-build_id__name__variant__target" ON "public"."snapshot" ("build_id", "name", "variant", "target");
-- Create "build_history" table
CREATE TABLE "public"."build_history" ("child_id" character(21) NOT NULL, "parent_id" character(21) NOT NULL, CONSTRAINT "child_id" FOREIGN KEY ("child_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "project_users" table
CREATE TABLE "public"."project_users" ("project_id" character(21) NOT NULL, "user_id" character(21) NOT NULL, "role" "public"."project_member_role" NOT NULL, CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
