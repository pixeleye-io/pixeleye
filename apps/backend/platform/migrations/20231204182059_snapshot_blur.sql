-- Modify "project" table
ALTER TABLE "public"."project" ADD COLUMN "snapshot_blur" boolean NOT NULL DEFAULT false;
