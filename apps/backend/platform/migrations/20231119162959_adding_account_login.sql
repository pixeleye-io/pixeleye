-- Modify "account" table
ALTER TABLE "public"."account" ADD COLUMN "provider_account_login" character varying(255) NOT NULL;
