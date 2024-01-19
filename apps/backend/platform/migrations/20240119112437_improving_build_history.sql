-- Modify "build" table
ALTER TABLE "public"."build" DROP COLUMN "target_parent_id";
-- Create "build_history" table
CREATE TABLE "public"."build_history" ("child_id" character varying(21) NOT NULL, "parent_id" character varying(21) NOT NULL, PRIMARY KEY ("child_id", "parent_id"), CONSTRAINT "child_id" FOREIGN KEY ("child_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "parent_id" FOREIGN KEY ("parent_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
