CREATE INDEX "auth_refresh_tokens_user_id_idx" ON "auth_refresh_tokens" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE "auth_refresh_tokens"
  ADD CONSTRAINT "auth_refresh_tokens_user_id_auth_users_id_fk"
  FOREIGN KEY ("user_id")
  REFERENCES "public"."auth_users"("id")
  ON DELETE cascade
  ON UPDATE no action;
