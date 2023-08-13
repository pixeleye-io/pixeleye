-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ALTER COLUMN "reviewer_id" DROP NOT NULL, ALTER COLUMN "reviewed_at" DROP NOT NULL;
