export const errorMessages = {
  AUTH_FORBIDDEN: "You can only manage your own user account",
  AUTH_SINGLE_USER_MODE: "System supports a single user only",
  AUTH_EMAIL_ALREADY_EXISTS: "Email already in use",
  AUTH_INVALID_NAME: "Name must have at least 2 characters",
  AUTH_INVALID_EMAIL: "Email is invalid",
  AUTH_USER_NOT_FOUND: "User not found",
  AUTH_INVALID_CREDENTIALS: "Invalid credentials",
  AUTH_USER_INACTIVE: "User is inactive",
  AUTH_MISSING_ACCESS_TOKEN: "Missing bearer access token",
  AUTH_INVALID_ACCESS_TOKEN: "Invalid access token",
  AUTH_MISSING_REFRESH_TOKEN: "Missing refresh token",
  AUTH_INVALID_REFRESH_TOKEN: "Invalid refresh token",
  AUTH_REFRESH_TOKEN_EXPIRED: "Refresh token expired",
  VALIDATION_ERROR: "Invalid request payload",
  INTERNAL_SERVER_ERROR: "Unexpected internal server error",
} as const;

export type ErrorCode = keyof typeof errorMessages;
