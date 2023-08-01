-- Modify "team" table
ALTER TABLE "public"."team" ADD COLUMN "owner_id" character varying(255) NOT NULL;
-- Create index "idx_unqiue_user_team" to table: "team"
CREATE UNIQUE INDEX "idx_unqiue_user_team" ON "public"."team" ("type", "owner_id") WHERE (type = 'user'::team_type);
