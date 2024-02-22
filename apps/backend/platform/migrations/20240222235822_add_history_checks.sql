-- Modify "build_history" table
ALTER TABLE "public"."build_history" ADD CONSTRAINT "child_id_not_parent_id" CHECK ((child_id)::text <> (parent_id)::text);
-- Modify "build_targets" table
ALTER TABLE "public"."build_targets" ADD CONSTRAINT "build_id_not_target_id" CHECK ((build_id)::text <> (target_id)::text);
