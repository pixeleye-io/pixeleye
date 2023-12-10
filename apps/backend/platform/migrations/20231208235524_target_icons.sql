-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ADD COLUMN "target_icon" character varying(255) NOT NULL DEFAULT '';
