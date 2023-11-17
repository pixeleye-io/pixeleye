-- Modify "project" table
ALTER TABLE "public"."project" ADD COLUMN "snapshot_threshold" double precision NOT NULL DEFAULT 0.1;
