-- Modify "build" table
ALTER TABLE "public"."build" ADD COLUMN "pr_id" character varying(255) NOT NULL, ADD COLUMN "target_branch" character varying(255) NOT NULL;
-- Create "snapshot_conversation" table
CREATE TABLE "public"."snapshot_conversation" ("id" character varying(21) NOT NULL, "snapshot_id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "x" real NOT NULL, "y" real NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "snapshot_id" FOREIGN KEY ("snapshot_id") REFERENCES "public"."snapshot" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
-- Create "snapshot_conversation_message" table
CREATE TABLE "public"."snapshot_conversation_message" ("id" character varying(21) NOT NULL, "conversation_id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "author_id" character varying(21) NOT NULL, "content" text NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "author_id" FOREIGN KEY ("author_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE, CONSTRAINT "conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "public"."snapshot_conversation" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
