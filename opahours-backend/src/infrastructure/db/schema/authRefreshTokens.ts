import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "./authUsers.js";

export const authRefreshTokens = pgTable(
  "auth_refresh_tokens",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("auth_refresh_tokens_user_id_idx").on(table.userId)],
);

export type AuthRefreshTokenRow = typeof authRefreshTokens.$inferSelect;
export type NewAuthRefreshTokenRow = typeof authRefreshTokens.$inferInsert;
