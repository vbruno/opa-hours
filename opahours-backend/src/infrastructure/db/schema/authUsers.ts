import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const authUsers = pgTable("auth_users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("auth_users_singleton_guard_unique").on(sql`(true)`),
  check("auth_users_name_min_len_check", sql`char_length(trim(${table.name})) >= 2`),
  check("auth_users_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
  check("auth_users_email_format_check", sql`position('@' in ${table.email}) > 1`),
]);

export type AuthUserRow = typeof authUsers.$inferSelect;
export type NewAuthUserRow = typeof authUsers.$inferInsert;
