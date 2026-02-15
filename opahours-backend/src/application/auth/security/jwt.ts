import { createHmac } from "node:crypto";

export interface JwtClaims {
  [key: string]: unknown;
  iat: number;
  exp: number;
}

const base64UrlEncode = (value: Buffer | string): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string): Buffer => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(paddingLength);

  return Buffer.from(padded, "base64");
};

const sign = (input: string, secret: string): string => {
  const signature = createHmac("sha256", secret).update(input).digest();

  return base64UrlEncode(signature);
};

export const signJwt = (
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number,
): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload: JwtClaims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const encodedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
};

export const verifyJwt = (
  token: string,
  secret: string,
): JwtClaims | null => {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);

    if (expectedSignature !== encodedSignature) {
      return null;
    }

    const payloadRaw = base64UrlDecode(encodedPayload).toString("utf8");
    const payload = JSON.parse(payloadRaw) as JwtClaims;

    if (typeof payload.exp !== "number") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};
