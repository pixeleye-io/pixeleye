-- Create index "idx_target_build_id" to table: "build"
CREATE INDEX "idx_target_build_id" ON "public"."build" ("target_build_id");
-- Create index "idx_target_parent_id" to table: "build"
CREATE INDEX "idx_target_parent_id" ON "public"."build" ("target_parent_id");
-- Drop "build_history" table
DROP TABLE "public"."build_history";
