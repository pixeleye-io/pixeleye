-- Create "user_deletion_request" table
CREATE TABLE "public"."user_deletion_request" ("user_id" character varying(255) NOT NULL, "created_at" timestamptz NOT NULL, "expires_at" timestamptz NOT NULL, PRIMARY KEY ("user_id"));
-- Modify "project" table
ALTER TABLE "public"."project" ALTER COLUMN "url" SET NOT NULL, ALTER COLUMN "source_id" SET NOT NULL, ALTER COLUMN "token" SET NOT NULL, ADD CONSTRAINT "team_id" FOREIGN KEY ("team_id") REFERENCES "public"."team" ("id") ON UPDATE NO ACTION ON DELETE CASCADE;
