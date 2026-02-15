ALTER TABLE "auth_refresh_tokens" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "auth_users" ALTER COLUMN "id" SET DATA TYPE uuid;