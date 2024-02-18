-- Modify "build" table
ALTER TABLE "public"."build" ADD COLUMN "check_run_id" character varying(255) NOT NULL DEFAULT '';
