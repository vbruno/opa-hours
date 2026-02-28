import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "../../../config/env.js";
import { AuthRefreshTokenRepository } from "../../../infrastructure/db/repositories/authRefreshTokenRepository.drizzle.js";
import { AuthUserRepository } from "../../../infrastructure/db/repositories/authUserRepository.drizzle.js";
import { AppError } from "../../shared/errors/appError.js";
import { errorMessages } from "../../shared/errors/errorMessages.js";
import { signJwt, verifyJwt } from "../security/jwt.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import type {
  AccessTokenPayload,
  AuthUserView,
  RefreshTokenPayload,
  TokenPair,
} from "../types/authTypes.js";

const accessTokenTtlSeconds = env.ACCESS_TOKEN_TTL_MINUTES * 60;
const refreshTokenTtlSeconds = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;

const toUserView = (input: {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AuthUserView => ({
  id: input.id,
  name: input.name,
  email: input.email,
  isActive: input.isActive,
  createdAt: input.createdAt,
  updatedAt: input.updatedAt,
});

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const isHex = (value: string): boolean =>
  /^[a-f0-9]+$/i.test(value) && value.length % 2 === 0;

const safeHashEquals = (left: string, right: string): boolean => {
  if (!isHex(left) || !isHex(right)) {
    return false;
  }

  const leftBytes = Buffer.from(left, "hex");
  const rightBytes = Buffer.from(right, "hex");

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  return timingSafeEqual(leftBytes, rightBytes);
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const normalizeName = (name: string): string => name.trim();

const getConstraintName = (error: unknown): string | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    code?: unknown;
    constraint?: unknown;
    cause?: { code?: unknown; constraint?: unknown };
  };
  const pgError = candidate.cause ?? candidate;

  if (
    (pgError.code === "23505" || pgError.code === "23514") &&
    typeof pgError.constraint === "string"
  ) {
    return pgError.constraint;
  }

  return null;
};

const mapAuthUserConstraintError = (error: unknown): AppError | null => {
  const constraint = getConstraintName(error);

  switch (constraint) {
    case "auth_users_singleton_guard_unique":
      return new AppError(
        "AUTH_SINGLE_USER_MODE",
        errorMessages.AUTH_SINGLE_USER_MODE,
        409,
      );
    case "auth_users_email_unique":
      return new AppError(
        "AUTH_EMAIL_ALREADY_EXISTS",
        errorMessages.AUTH_EMAIL_ALREADY_EXISTS,
        409,
      );
    case "auth_users_name_min_len_check":
      return new AppError(
        "AUTH_INVALID_NAME",
        errorMessages.AUTH_INVALID_NAME,
        400,
      );
    case "auth_users_email_lowercase_check":
      return new AppError(
        "AUTH_INVALID_EMAIL",
        errorMessages.AUTH_INVALID_EMAIL,
        400,
        {
          rule: "lowercase",
        },
      );
    case "auth_users_email_format_check":
      return new AppError(
        "AUTH_INVALID_EMAIL",
        errorMessages.AUTH_INVALID_EMAIL,
        400,
        {
          rule: "format",
        },
      );
    default:
      return null;
  }
};

export class AuthService {
  private readonly userRepository: AuthUserRepository;
  private readonly refreshTokenRepository: AuthRefreshTokenRepository;

  public constructor() {
    this.userRepository = new AuthUserRepository();
    this.refreshTokenRepository = new AuthRefreshTokenRepository();
  }

  public async createUser(input: {
    name: string;
    email: string;
    password: string;
    isActive?: boolean;
  }): Promise<AuthUserView> {
    const usersCount = await this.userRepository.countUsers();

    if (usersCount > 0) {
      throw new AppError(
        "AUTH_SINGLE_USER_MODE",
        errorMessages.AUTH_SINGLE_USER_MODE,
        409,
      );
    }

    const normalizedEmail = normalizeEmail(input.email);
    const normalizedName = normalizeName(input.name);
    const existing = await this.userRepository.findByEmail(normalizedEmail);

    if (existing) {
      throw new AppError(
        "AUTH_EMAIL_ALREADY_EXISTS",
        errorMessages.AUTH_EMAIL_ALREADY_EXISTS,
        409,
      );
    }

    let created;
    try {
      created = await this.userRepository.create({
        id: randomUUID(),
        name: normalizedName,
        email: normalizedEmail,
        passwordHash: hashPassword(input.password),
      });
    } catch (error) {
      const mapped = mapAuthUserConstraintError(error);

      if (mapped) {
        throw mapped;
      }

      throw error;
    }

    if (input.isActive !== undefined && input.isActive !== created.isActive) {
      const updated = await this.userRepository.update(created.id, {
        isActive: input.isActive,
      });

      if (!updated) {
        throw new AppError(
          "AUTH_USER_NOT_FOUND",
          errorMessages.AUTH_USER_NOT_FOUND,
          404,
        );
      }

      return toUserView(updated);
    }

    return toUserView(created);
  }

  public async listUsers(): Promise<AuthUserView[]> {
    const users = await this.userRepository.listAll();

    return users.map((user) => toUserView(user));
  }

  public async getUserById(id: string): Promise<AuthUserView> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError(
        "AUTH_USER_NOT_FOUND",
        errorMessages.AUTH_USER_NOT_FOUND,
        404,
      );
    }

    return toUserView(user);
  }

  public async updateUser(
    id: string,
    input: {
      name?: string;
      email?: string;
      password?: string;
      isActive?: boolean;
    },
  ): Promise<AuthUserView> {
    if (input.email) {
      const normalizedEmail = normalizeEmail(input.email);
      const existing = await this.userRepository.findByEmail(normalizedEmail);

      if (existing && existing.id !== id) {
        throw new AppError(
          "AUTH_EMAIL_ALREADY_EXISTS",
          errorMessages.AUTH_EMAIL_ALREADY_EXISTS,
          409,
        );
      }
    }

    const normalizedName =
      input.name !== undefined ? normalizeName(input.name) : undefined;
    const normalizedEmail =
      input.email !== undefined ? normalizeEmail(input.email) : undefined;

    let updated;
    try {
      updated = await this.userRepository.update(id, {
        name: normalizedName,
        email: normalizedEmail,
        isActive: input.isActive,
        passwordHash: input.password ? hashPassword(input.password) : undefined,
      });
    } catch (error) {
      const mapped = mapAuthUserConstraintError(error);

      if (mapped) {
        throw mapped;
      }

      throw error;
    }

    if (!updated) {
      throw new AppError(
        "AUTH_USER_NOT_FOUND",
        errorMessages.AUTH_USER_NOT_FOUND,
        404,
      );
    }

    return toUserView(updated);
  }

  public async deleteUser(id: string): Promise<void> {
    const deleted = await this.userRepository.delete(id);

    if (!deleted) {
      throw new AppError(
        "AUTH_USER_NOT_FOUND",
        errorMessages.AUTH_USER_NOT_FOUND,
        404,
      );
    }

    await this.refreshTokenRepository.revokeAllByUserId(id);
  }

  public async countUsers(): Promise<number> {
    return this.userRepository.countUsers();
  }

  public async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: AuthUserView; tokens: TokenPair }> {
    const user = await this.userRepository.findByEmail(
      normalizeEmail(input.email),
    );

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new AppError(
        "AUTH_INVALID_CREDENTIALS",
        errorMessages.AUTH_INVALID_CREDENTIALS,
        401,
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "AUTH_USER_INACTIVE",
        errorMessages.AUTH_USER_INACTIVE,
        403,
      );
    }

    // Single-user mode: keep only one active refresh session per login.
    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    const tokens = await this.issueTokenPair(user.id, user.email);

    return {
      user: toUserView(user),
      tokens,
    };
  }

  public async refresh(input: {
    refreshToken: string;
  }): Promise<{ user: AuthUserView; tokens: TokenPair }> {
    const payload = verifyJwt(input.refreshToken, env.REFRESH_TOKEN_SECRET);

    if (!payload || payload.type !== "refresh") {
      throw new AppError(
        "AUTH_INVALID_REFRESH_TOKEN",
        errorMessages.AUTH_INVALID_REFRESH_TOKEN,
        401,
      );
    }

    const refreshPayload = payload as unknown as RefreshTokenPayload;
    const tokenRecord = await this.refreshTokenRepository.findActiveById(
      refreshPayload.tokenId,
    );

    if (!tokenRecord) {
      throw new AppError(
        "AUTH_INVALID_REFRESH_TOKEN",
        errorMessages.AUTH_INVALID_REFRESH_TOKEN,
        401,
      );
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      await this.refreshTokenRepository.revokeById(tokenRecord.id);
      throw new AppError(
        "AUTH_REFRESH_TOKEN_EXPIRED",
        errorMessages.AUTH_REFRESH_TOKEN_EXPIRED,
        401,
      );
    }

    const incomingHash = hashToken(input.refreshToken);

    if (!safeHashEquals(incomingHash, tokenRecord.tokenHash)) {
      throw new AppError(
        "AUTH_INVALID_REFRESH_TOKEN",
        errorMessages.AUTH_INVALID_REFRESH_TOKEN,
        401,
      );
    }

    const user = await this.userRepository.findById(refreshPayload.sub);

    if (!user || !user.isActive) {
      throw new AppError(
        "AUTH_INVALID_REFRESH_TOKEN",
        errorMessages.AUTH_INVALID_REFRESH_TOKEN,
        401,
      );
    }

    await this.refreshTokenRepository.revokeById(tokenRecord.id);

    const tokens = await this.issueTokenPair(user.id, user.email);

    return {
      user: toUserView(user),
      tokens,
    };
  }

  public async logout(input: { refreshToken: string }): Promise<void> {
    const payload = verifyJwt(input.refreshToken, env.REFRESH_TOKEN_SECRET);

    if (!payload || payload.type !== "refresh") {
      throw new AppError(
        "AUTH_INVALID_REFRESH_TOKEN",
        errorMessages.AUTH_INVALID_REFRESH_TOKEN,
        401,
      );
    }

    const refreshPayload = payload as unknown as RefreshTokenPayload;

    await this.refreshTokenRepository.revokeById(refreshPayload.tokenId);
  }

  public verifyAccessToken(token: string): AccessTokenPayload {
    const payload = verifyJwt(token, env.JWT_SECRET);

    if (!payload || payload.type !== "access") {
      throw new AppError(
        "AUTH_INVALID_ACCESS_TOKEN",
        errorMessages.AUTH_INVALID_ACCESS_TOKEN,
        401,
      );
    }

    return payload as unknown as AccessTokenPayload;
  }

  private async issueTokenPair(
    userId: string,
    email: string,
  ): Promise<TokenPair> {
    const refreshTokenId = randomUUID();

    const accessToken = signJwt(
      {
        sub: userId,
        email,
        type: "access",
      },
      env.JWT_SECRET,
      accessTokenTtlSeconds,
    );

    const refreshToken = signJwt(
      {
        sub: userId,
        tokenId: refreshTokenId,
        type: "refresh",
      },
      env.REFRESH_TOKEN_SECRET,
      refreshTokenTtlSeconds,
    );

    await this.refreshTokenRepository.create({
      id: refreshTokenId,
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTokenTtlSeconds * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
