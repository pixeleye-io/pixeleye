-- Modify "team" table
ALTER TABLE "public"."team" ADD COLUMN "snapshot_limit" integer NOT NULL DEFAULT 5000;
