-- Modify "project" table
ALTER TABLE "public"."project" ADD COLUMN "auto_approve" character varying(255) NOT NULL DEFAULT '';
