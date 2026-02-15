import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const authRefreshTokens = pgTable("auth_refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type AuthRefreshTokenRow = typeof authRefreshTokens.$inferSelect;
export type NewAuthRefreshTokenRow = typeof authRefreshTokens.$inferInsert;
