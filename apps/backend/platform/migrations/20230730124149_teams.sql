-- Create enum type "team_type"
CREATE TYPE "public"."team_type" AS ENUM ('github', 'gitlab', 'bitbucket', 'user');
-- Create enum type "team_member_role"
CREATE TYPE "public"."team_member_role" AS ENUM ('owner', 'admin', 'accountant', 'member');
-- Modify "build" table
ALTER TABLE "public"."build" ALTER COLUMN "target_build_id" SET NOT NULL;
-- Modify "project" table
ALTER TABLE "public"."project" ADD COLUMN "team_id" character(21) NOT NULL;
-- Modify "project_users" table
ALTER TABLE "public"."project_users" ALTER COLUMN "user_id" TYPE character varying(255);
-- Create "team" table
CREATE TABLE "public"."team" ("id" character(21) NOT NULL, "created_at" timestamptz NOT NULL, "updated_at" timestamptz NOT NULL, "name" character varying(255) NOT NULL, "avatar_url" text NOT NULL, "url" text NOT NULL, "type" "public"."team_type" NOT NULL, PRIMARY KEY ("id"));
-- Create "team_users" table
CREATE TABLE "public"."team_users" ("team_id" character varying(255) NOT NULL, "user_id" character varying(255) NOT NULL, "role" "public"."team_member_role" NOT NULL, CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
