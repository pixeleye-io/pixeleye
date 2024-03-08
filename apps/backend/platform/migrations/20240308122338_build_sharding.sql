-- Modify "build" table
ALTER TABLE "public"."build" ADD COLUMN "sharding_id" character varying(255) NOT NULL DEFAULT '', ADD COLUMN "sharding_count" integer NOT NULL DEFAULT 0, ADD COLUMN "shards_completed" integer NOT NULL DEFAULT 0;
-- Create index "idx_unique_build_project_id__sharding_id" to table: "build"
CREATE UNIQUE INDEX "idx_unique_build_project_id__sharding_id" ON "public"."build" ("project_id", "sharding_id") WHERE ((sharding_id)::text <> ''::text);
-- Modify "project" table
ALTER TABLE "public"."project" ALTER COLUMN "snapshot_threshold" SET DEFAULT 0.05;
