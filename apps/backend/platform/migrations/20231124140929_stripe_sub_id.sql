-- Create index "idx_build_history-parent_id" to table: "build_history"
CREATE INDEX "idx_build_history-parent_id" ON "public"."build_history" ("parent_id");
-- Modify "snap_image" table
ALTER TABLE "public"."snap_image" ADD COLUMN "exists" boolean NOT NULL DEFAULT true;
-- Create index "idx_snapshot-hash__project_id" to table: "snapshot"
CREATE INDEX "idx_snapshot-hash__project_id" ON "public"."snapshot" ("snap_image_id", "build_id");
-- Modify "team" table
ALTER TABLE "public"."team" ADD COLUMN "billing_subscription_item_id" character varying(255) NULL;
