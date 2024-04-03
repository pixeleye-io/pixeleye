-- Drop index "idx_snapshot-build_id__name__variant__target" from table: "snapshot"
DROP INDEX "public"."idx_snapshot-build_id__name__variant__target";
-- Create index "idx_snapshot-build_id__name__variant__viewport__target" to table: "snapshot"
CREATE UNIQUE INDEX "idx_snapshot-build_id__name__variant__viewport__target" ON "public"."snapshot" ("build_id", "name", "variant", "viewport", "target");
