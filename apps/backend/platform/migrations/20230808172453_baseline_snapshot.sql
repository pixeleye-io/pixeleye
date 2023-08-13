-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ALTER COLUMN "baseline_snapshot_id" DROP NOT NULL;
