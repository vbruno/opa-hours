import "dotenv/config";

import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "test", "production"]).default("development"),
  ),
  PORT: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(3000),
  ),
  HOST: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "HOST cannot be empty").default("0.0.0.0"),
  ),
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .url("DATABASE_URL must be a valid URL"),
  ).optional(),
  DATABASE_URL_TEST: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .url("DATABASE_URL_TEST must be a valid URL")
      .optional(),
  ),
  CORS_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "CORS_ORIGIN cannot be empty").default("*"),
  ),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  ),
  JWT_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(8, "JWT_SECRET must have at least 8 characters"),
  ),
  REFRESH_TOKEN_SECRET: z.preprocess(
    emptyToUndefined,
    z.string().min(8, "REFRESH_TOKEN_SECRET must have at least 8 characters"),
  ),
  ACCESS_TOKEN_TTL_MINUTES: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(15),
  ),
  REFRESH_TOKEN_TTL_DAYS: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().default(30),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => {
      const field = issue.path.join(".") || "env";
      const received =
        issue.input === undefined ? "undefined" : JSON.stringify(issue.input);

      return `- ${field}: ${issue.message} (received: ${received})`;
    })
    .join("\n");

  throw new Error(
    [
      "Invalid environment configuration.",
      "Fix your .env using .env.example as reference.",
      details,
    ].join("\n"),
  );
}

const envData = parsed.data;

if (envData.NODE_ENV === "test" && !envData.DATABASE_URL_TEST) {
  throw new Error(
    [
      "Invalid environment configuration.",
      "DATABASE_URL_TEST is required when NODE_ENV=test.",
    ].join("\n"),
  );
}

if (envData.NODE_ENV !== "test" && !envData.DATABASE_URL) {
  throw new Error(
    [
      "Invalid environment configuration.",
      "DATABASE_URL is required when NODE_ENV is development/production.",
    ].join("\n"),
  );
}

export const env = envData;
