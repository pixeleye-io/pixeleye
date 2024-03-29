-- Add new schema named "private"
CREATE SCHEMA "private";
-- Create enum type "project_source"
CREATE TYPE "public"."project_source" AS ENUM ('github', 'gitlab', 'bitbucket', 'custom');
-- Create enum type "team_type"
CREATE TYPE "public"."team_type" AS ENUM ('github', 'gitlab', 'bitbucket', 'user');
-- Create enum type "member_type"
CREATE TYPE "public"."member_type" AS ENUM ('invited', 'git');
-- Create enum type "team_member_role"
CREATE TYPE "public"."team_member_role" AS ENUM ('owner', 'admin', 'accountant', 'member');
-- Create enum type "build_status"
CREATE TYPE "public"."build_status" AS ENUM ('uploading', 'queued-uploading', 'queued-processing', 'processing', 'failed', 'aborted', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned');
-- Create enum type "billing_status"
CREATE TYPE "public"."billing_status" AS ENUM ('not_created', 'incomplete', 'incomplete_expired', 'active', 'past_due', 'canceled', 'unpaid');
-- Create enum type "account_provider"
CREATE TYPE "public"."account_provider" AS ENUM ('github', 'gitlab', 'bitbucket');
-- Create enum type "git_installation_type"
CREATE TYPE "public"."git_installation_type" AS ENUM ('github', 'gitlab', 'bitbucket');
-- Create "user_deletion_request" table
CREATE TABLE "public"."user_deletion_request" ("user_id" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL, "expires_at" timestamptz NOT NULL, PRIMARY KEY ("user_id"));
-- Create enum type "project_member_role"
CREATE TYPE "public"."project_member_role" AS ENUM ('admin', 'reviewer', 'viewer');
-- Create enum type "snapshot_status"
CREATE TYPE "public"."snapshot_status" AS ENUM ('queued', 'processing', 'failed', 'approved', 'rejected', 'unreviewed', 'unchanged', 'orphaned', 'missing_baseline');
-- Create enum type "team_status"
CREATE TYPE "public"."team_status" AS ENUM ('active', 'suspended');
-- Create "users" table
CREATE TABLE "public"."users" ("id" character varying(21) NOT NULL, "auth_id" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "avatar_url" text NOT NULL, PRIMARY KEY ("id"));
-- Create index "idx_unique_user_auth_id" to table: "users"
CREATE UNIQUE INDEX "idx_unique_user_auth_id" ON "public"."users" ("auth_id");
-- Create index "idx_unique_user_email" to table: "users"
CREATE UNIQUE INDEX "idx_unique_user_email" ON "public"."users" ("email");
-- Create "account" table
CREATE TABLE "public"."account" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "user_id" character varying(21) NOT NULL, "provider" "public"."account_provider" NOT NULL, "provider_account_id" character varying(255) NOT NULL, "refresh_token" character varying(255) NOT NULL, "access_token" character varying(255) NOT NULL, "access_token_expires_at" timestamptz NOT NULL, "refresh_token_expires_at" timestamptz NOT NULL, "provider_account_login" character varying(255) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_unique_account_provider_account_id" to table: "account"
CREATE UNIQUE INDEX "idx_unique_account_provider_account_id" ON "public"."account" ("provider_account_id", "provider");
-- Create index "idx_unique_account_user_id__provider" to table: "account"
CREATE UNIQUE INDEX "idx_unique_account_user_id__provider" ON "public"."account" ("user_id", "provider");
-- Create "team" table
CREATE TABLE "public"."team" ("id" character varying(21) NOT NULL, "status" "public"."team_status" NOT NULL DEFAULT 'active', "snapshot_limit" integer NOT NULL DEFAULT 0, "subscription_id" character varying(255) NOT NULL DEFAULT '', "customer_id" character varying(255) NOT NULL DEFAULT '', "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "avatar_url" text NOT NULL, "url" text NOT NULL, "type" "public"."team_type" NOT NULL, "owner_id" character varying(21) NULL, "external_id" character varying(255) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "owner_id" FOREIGN KEY ("owner_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_unique_team_external_id" to table: "team"
CREATE UNIQUE INDEX "idx_unique_team_external_id" ON "public"."team" ("external_id", "type") WHERE (type <> 'user'::team_type);
-- Create index "idx_unqiue_user_team" to table: "team"
CREATE UNIQUE INDEX "idx_unqiue_user_team" ON "public"."team" ("type", "owner_id") WHERE (type = 'user'::team_type);
-- Create "project" table
CREATE TABLE "public"."project" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "team_id" character varying(21) NOT NULL, "name" character varying(255) NOT NULL, "url" text NOT NULL, "source" "public"."project_source" NOT NULL, "source_id" character varying(255) NOT NULL, "token" character varying(255) NOT NULL, "auto_approve" character varying(255) NOT NULL DEFAULT '', "snapshot_threshold" double precision NOT NULL DEFAULT 0.1, "snapshot_blur" boolean NOT NULL DEFAULT false, "build_count" integer NOT NULL DEFAULT 0, PRIMARY KEY ("id"), CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "build" table
CREATE TABLE "public"."build" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "project_id" character varying(21) NOT NULL, "build_number" integer NOT NULL DEFAULT 0, "status" "public"."build_status" NOT NULL DEFAULT 'uploading', "sha" character varying(255) NOT NULL, "branch" character varying(255) NOT NULL, "message" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "pr_id" character varying(255) NOT NULL, "target_branch" character varying(255) NOT NULL, "warnings" text[] NULL, "errors" text[] NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_build-build_number__project_id" to table: "build"
CREATE UNIQUE INDEX "idx_build-build_number__project_id" ON "public"."build" ("project_id", "build_number");
-- Create "build_history" table
CREATE TABLE "public"."build_history" ("child_id" character varying(21) NOT NULL, "parent_id" character varying(21) NOT NULL, PRIMARY KEY ("child_id", "parent_id"), CONSTRAINT "child_id" FOREIGN KEY ("child_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "build_targets" table
CREATE TABLE "public"."build_targets" ("build_id" character varying(21) NOT NULL, "target_id" character varying(255) NOT NULL, PRIMARY KEY ("build_id", "target_id"), CONSTRAINT "build_id" FOREIGN KEY ("build_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "target_id" FOREIGN KEY ("target_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "diff_image" table
CREATE TABLE "public"."diff_image" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "format" character varying(255) NOT NULL, "project_id" character varying(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_diff_image-hash__project_id" to table: "diff_image"
CREATE UNIQUE INDEX "idx_diff_image-hash__project_id" ON "public"."diff_image" ("hash", "project_id");
-- Create "git_installation" table
CREATE TABLE "public"."git_installation" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "team_id" character varying(21) NOT NULL, "type" "public"."git_installation_type" NOT NULL, "installation_id" integer NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "oauth_account_refresh" table
CREATE TABLE "public"."oauth_account_refresh" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "account_id" character varying(21) NOT NULL DEFAULT '', PRIMARY KEY ("id"), CONSTRAINT "account_id" FOREIGN KEY ("account_id") REFERENCES "public"."account" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "project_invite_code" table
CREATE TABLE "public"."project_invite_code" ("id" character varying(21) NOT NULL, "project_id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "role" "public"."project_member_role" NOT NULL, "email" character varying(255) NOT NULL, "invited_by_id" character varying(21) NOT NULL, "expires_at" timestamptz NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "invited_by_id" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "project_users" table
CREATE TABLE "public"."project_users" ("project_id" character varying(21) NOT NULL, "user_id" character varying(21) NOT NULL, "role" "public"."project_member_role" NOT NULL, "role_sync" boolean NOT NULL DEFAULT false, "type" "public"."member_type" NOT NULL, CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_unique_project_user" to table: "project_users"
CREATE UNIQUE INDEX "idx_unique_project_user" ON "public"."project_users" ("project_id", "user_id");
-- Create "snap_image" table
CREATE TABLE "public"."snap_image" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "hash" character varying(64) NOT NULL, "width" integer NOT NULL, "height" integer NOT NULL, "format" character varying(255) NOT NULL, "exists" boolean NOT NULL DEFAULT true, "project_id" character varying(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "project_id" FOREIGN KEY ("project_id") REFERENCES "public"."project" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_snap_image-hash__project_id" to table: "snap_image"
CREATE UNIQUE INDEX "idx_snap_image-hash__project_id" ON "public"."snap_image" ("hash", "project_id");
-- Create "snapshot" table
CREATE TABLE "public"."snapshot" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "build_id" character varying(21) NOT NULL, "snap_image_id" character varying(21) NOT NULL, "name" character varying(255) NOT NULL, "variant" character varying(255) NOT NULL, "target" character varying(255) NOT NULL, "target_icon" character varying(255) NOT NULL DEFAULT '', "viewport" character varying(255) NOT NULL, "status" "public"."snapshot_status" NOT NULL DEFAULT 'processing', "baseline_snapshot_id" character varying(21) NULL, "diff_image_id" character varying(21) NULL, "reviewer_id" character varying(21) NULL, "reviewed_at" timestamptz NULL, "error" text NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "baseline_snapshot_id" FOREIGN KEY ("baseline_snapshot_id") REFERENCES "public"."snapshot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "build_id" FOREIGN KEY ("build_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "diff_image_id" FOREIGN KEY ("diff_image_id") REFERENCES "public"."diff_image" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "reviewer_id" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "snap_image_id" FOREIGN KEY ("snap_image_id") REFERENCES "public"."snap_image" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION);
-- Create index "idx_snapshot-build_id__name__variant__target" to table: "snapshot"
CREATE UNIQUE INDEX "idx_snapshot-build_id__name__variant__target" ON "public"."snapshot" ("build_id", "name", "variant", "target");
-- Create index "idx_snapshot-hash__project_id" to table: "snapshot"
CREATE INDEX "idx_snapshot-hash__project_id" ON "public"."snapshot" ("snap_image_id", "build_id");
-- Create "snapshot_conversation" table
CREATE TABLE "public"."snapshot_conversation" ("id" character varying(21) NOT NULL, "snapshot_id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "x" real NOT NULL, "y" real NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "snapshot_id" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "snapshot_conversation_message" table
CREATE TABLE "public"."snapshot_conversation_message" ("id" character varying(21) NOT NULL, "conversation_id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "author_id" character varying(21) NOT NULL, "content" text NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "public"."snapshot_conversation" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "team_users" table
CREATE TABLE "public"."team_users" ("team_id" character varying(255) NOT NULL, "user_id" character varying(21) NOT NULL, "role" "public"."team_member_role" NOT NULL, "role_sync" boolean NOT NULL DEFAULT false, "type" "public"."member_type" NOT NULL, CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create index "idx_unique_team_user" to table: "team_users"
CREATE UNIQUE INDEX "idx_unique_team_user" ON "public"."team_users" ("team_id", "user_id");
