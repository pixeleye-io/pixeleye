-- Add "bitbucket_server" to enums
ALTER TYPE "public"."account_provider" ADD VALUE 'bitbucket_server';
ALTER TYPE "public"."git_installation_type" ADD VALUE 'bitbucket_server';
ALTER TYPE "public"."team_type" ADD VALUE 'bitbucket_server';
ALTER TYPE "public"."project_source" ADD VALUE 'bitbucket_server';
-- Modify "git_installation" table
ALTER TABLE "public"."git_installation" ALTER COLUMN "installation_id" TYPE text;
ALTER TABLE "public"."git_installation" ADD COLUMN "access_token" text NULL, ADD COLUMN "refresh_token" text NULL, ADD COLUMN "token_expires_at" timestamptz NULL, ADD COLUMN "base_url" text NULL;
