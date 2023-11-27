-- Create enum type "billing_status"
CREATE TYPE "public"."billing_status" AS ENUM ('not_created', 'incomplete', 'incomplete_expired', 'active', 'past_due', 'canceled', 'unpaid');
-- Create enum type "team_status"
CREATE TYPE "public"."team_status" AS ENUM ('active', 'suspended');
-- Modify "account" table
ALTER TABLE "public"."account" ALTER COLUMN "provider_account_login" DROP DEFAULT;
-- Modify "oauth_account_refresh" table
ALTER TABLE "public"."oauth_account_refresh" ALTER COLUMN "account_id" SET DEFAULT '';
-- Modify "team" table
ALTER TABLE "public"."team" ADD COLUMN "status" "public"."team_status" NOT NULL DEFAULT 'active', ADD COLUMN "billing_status" "public"."billing_status" NOT NULL DEFAULT 'not_created', ADD COLUMN "billing_account_id" character varying(255) NULL, ADD COLUMN "billing_subscription_id" character varying(255) NULL, ADD COLUMN "billing_plan_id" character varying(255) NULL;
