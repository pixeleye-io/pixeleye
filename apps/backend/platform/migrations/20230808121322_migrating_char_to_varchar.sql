-- Modify "build" table
ALTER TABLE "public"."build" ALTER COLUMN "id" TYPE character varying(21), ALTER COLUMN "project_id" TYPE character varying(21), ALTER COLUMN "target_parent_id" TYPE character varying(21), ALTER COLUMN "target_build_id" TYPE character varying(21), ALTER COLUMN "approved_by" TYPE character varying(21);
-- Modify "build_history" table
ALTER TABLE "public"."build_history" ALTER COLUMN "child_id" TYPE character varying(21), ALTER COLUMN "parent_id" TYPE character varying(21);
-- Modify "diff_image" table
ALTER TABLE "public"."diff_image" ALTER COLUMN "id" TYPE character varying(21), ALTER COLUMN "project_id" TYPE character varying(21);
-- Modify "project" table
ALTER TABLE "public"."project" ALTER COLUMN "id" TYPE character varying(21), ALTER COLUMN "team_id" TYPE character varying(21);
-- Modify "project_users" table
ALTER TABLE "public"."project_users" ALTER COLUMN "project_id" TYPE character varying(21);
-- Modify "snap_image" table
ALTER TABLE "public"."snap_image" ALTER COLUMN "id" TYPE character varying(21), ALTER COLUMN "project_id" TYPE character varying(21);
-- Modify "snapshot" table
ALTER TABLE "public"."snapshot" ALTER COLUMN "id" TYPE character varying(21), ALTER COLUMN "build_id" TYPE character varying(21), ALTER COLUMN "snap_image_id" TYPE character varying(21), ALTER COLUMN "baseline_snapshot_id" TYPE character varying(21), ALTER COLUMN "diff_image_id" TYPE character varying(21), ALTER COLUMN "reviewer_id" TYPE character varying(21);
-- Modify "team" table
ALTER TABLE "public"."team" ALTER COLUMN "id" TYPE character varying(21);
