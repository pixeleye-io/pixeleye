-- Create "oauth_account_refresh" table
CREATE TABLE "public"."oauth_account_refresh" ("id" character varying(21) NOT NULL, "created_at" timestamptz NOT NULL, "account_id" character varying(21) NOT NULL, PRIMARY KEY ("id"), CONSTRAINT "account_id" FOREIGN KEY ("account_id") REFERENCES "public"."account" ("id") ON UPDATE NO ACTION ON DELETE CASCADE);
