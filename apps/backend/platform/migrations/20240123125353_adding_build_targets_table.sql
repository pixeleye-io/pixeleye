-- Modify "build" table
ALTER TABLE "public"."build" DROP COLUMN "target_build_id";
-- Create "build_targets" table
CREATE TABLE "public"."build_targets" ("build_id" character varying(21) NOT NULL, "target_id" character varying(255) NOT NULL, PRIMARY KEY ("build_id", "target_id"), CONSTRAINT "build_id" FOREIGN KEY ("build_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "target_id" FOREIGN KEY ("target_id") REFERENCES "public"."build" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
