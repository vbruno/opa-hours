ALTER TABLE "auth_refresh_tokens" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "auth_users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;
