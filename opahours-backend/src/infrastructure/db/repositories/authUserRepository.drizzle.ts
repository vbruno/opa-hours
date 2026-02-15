import { eq, sql } from "drizzle-orm";

import { db } from "../connection.js";
import {
  type AuthUserRow,
  authUsers,
  type NewAuthUserRow,
} from "../schema/authUsers.js";

export interface CreateAuthUserInput {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface UpdateAuthUserInput {
  name?: string;
  email?: string;
  passwordHash?: string;
  isActive?: boolean;
}

export class AuthUserRepository {
  public async countUsers(): Promise<number> {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(authUsers);

    return Number(rows[0]?.count ?? 0);
  }

  public async findById(id: string): Promise<AuthUserRow | null> {
    const rows = await db.select().from(authUsers).where(eq(authUsers.id, id)).limit(1);

    return rows[0] ?? null;
  }

  public async findByEmail(email: string): Promise<AuthUserRow | null> {
    const rows = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.email, email.toLowerCase()))
      .limit(1);

    return rows[0] ?? null;
  }

  public async listAll(): Promise<AuthUserRow[]> {
    return db.select().from(authUsers);
  }

  public async create(input: CreateAuthUserInput): Promise<AuthUserRow> {
    const values: NewAuthUserRow = {
      id: input.id,
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      isActive: true,
    };

    const rows = await db.insert(authUsers).values(values).returning();

    return rows[0];
  }

  public async update(id: string, input: UpdateAuthUserInput): Promise<AuthUserRow | null> {
    const values: Partial<NewAuthUserRow> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) values.name = input.name.trim();
    if (input.email !== undefined) values.email = input.email.toLowerCase();
    if (input.passwordHash !== undefined) values.passwordHash = input.passwordHash;
    if (input.isActive !== undefined) values.isActive = input.isActive;

    const rows = await db
      .update(authUsers)
      .set(values)
      .where(eq(authUsers.id, id))
      .returning();

    return rows[0] ?? null;
  }

  public async delete(id: string): Promise<boolean> {
    const rows = await db.delete(authUsers).where(eq(authUsers.id, id)).returning();

    return rows.length > 0;
  }
}
