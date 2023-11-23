-- Create "snapshots_to_bill" table
CREATE TABLE "public"."snapshots_to_bill" ("id" character varying(21) NOT NULL, "billing_account_id" character varying(21) NOT NULL, "snapshot_count" integer NOT NULL, "created_at" timestamptz NOT NULL, PRIMARY KEY ("id"));
