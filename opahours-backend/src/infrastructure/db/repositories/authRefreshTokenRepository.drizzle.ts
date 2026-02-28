import { and, eq, isNull } from "drizzle-orm";

import { db } from "../connection.js";
import {
  authRefreshTokens,
  type AuthRefreshTokenRow,
  type NewAuthRefreshTokenRow,
} from "../schema/authRefreshTokens.js";

export interface CreateRefreshTokenInput {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export class AuthRefreshTokenRepository {
  public async create(
    input: CreateRefreshTokenInput,
  ): Promise<AuthRefreshTokenRow> {
    const values: NewAuthRefreshTokenRow = {
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    };

    const rows = await db.insert(authRefreshTokens).values(values).returning();

    return rows[0];
  }

  public async findActiveById(id: string): Promise<AuthRefreshTokenRow | null> {
    const rows = await db
      .select()
      .from(authRefreshTokens)
      .where(
        and(eq(authRefreshTokens.id, id), isNull(authRefreshTokens.revokedAt)),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  public async revokeById(id: string): Promise<void> {
    await db
      .update(authRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authRefreshTokens.id, id));
  }

  public async revokeAllByUserId(userId: string): Promise<void> {
    await db
      .update(authRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(authRefreshTokens.userId, userId),
          isNull(authRefreshTokens.revokedAt),
        ),
      );
  }
}
