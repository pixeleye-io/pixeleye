-- Modify "build" table
ALTER TABLE "public"."build" ALTER COLUMN "message" SET NOT NULL, ALTER COLUMN "title" SET NOT NULL, ALTER COLUMN "approved_by" SET NOT NULL;
-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ALTER COLUMN "baseline_snapshot_id" SET NOT NULL, ALTER COLUMN "diff_image_id" SET NOT NULL, ALTER COLUMN "reviewer_id" SET NOT NULL, ALTER COLUMN "reviewed_at" SET NOT NULL;
