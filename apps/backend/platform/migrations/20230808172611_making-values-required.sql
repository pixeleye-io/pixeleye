-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ALTER COLUMN "diff_image_id" DROP NOT NULL;
