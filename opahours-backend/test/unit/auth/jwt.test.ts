import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";

import { signJwt, verifyJwt } from "../../../src/application/auth/security/jwt.js";

const base64UrlEncode = (value: Buffer | string): string =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const sign = (input: string, secret: string): string =>
  base64UrlEncode(createHmac("sha256", secret).update(input).digest());

describe("jwt security", () => {
  it("signs and verifies token", () => {
    const secret = "secret-12345678";
    const token = signJwt({ sub: "user-1", type: "access" }, secret, 60);
    const payload = verifyJwt(token, secret);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-1");
    expect(payload?.type).toBe("access");
  });

  it("returns null for invalid signature", () => {
    const token = signJwt({ sub: "user-1", type: "access" }, "secret-a", 60);

    expect(verifyJwt(token, "secret-b")).toBeNull();
  });

  it("returns null for expired token", () => {
    const token = signJwt({ sub: "user-1", type: "access" }, "secret-a", -1);

    expect(verifyJwt(token, "secret-a")).toBeNull();
  });

  it("returns null for malformed token", () => {
    expect(verifyJwt("invalid-token", "secret-a")).toBeNull();
  });

  it("returns null for valid signature but payload without exp", () => {
    const secret = "secret-a";
    const encodedHeader = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const encodedPayload = base64UrlEncode(
      JSON.stringify({ sub: "user-1", type: "access", iat: 1000 }),
    );
    const encodedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret);
    const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

    expect(verifyJwt(token, secret)).toBeNull();
  });
});
