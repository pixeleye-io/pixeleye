-- Modify "team" table
ALTER TABLE "public"."team" DROP COLUMN "billing_status", DROP COLUMN "billing_account_id", DROP COLUMN "billing_subscription_id", DROP COLUMN "billing_plan_id", DROP COLUMN "billing_subscription_item_id", DROP COLUMN "plan_id", ALTER COLUMN "customer_id" DROP DEFAULT, ADD COLUMN "subscription_id" character varying(255) NOT NULL;
