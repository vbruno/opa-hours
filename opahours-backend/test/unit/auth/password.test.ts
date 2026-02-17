import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "../../../src/application/auth/security/password.js";

describe("password security", () => {
  it("hashes and verifies a valid password", () => {
    const plain = "super-secret-password";
    const hashed = hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(verifyPassword(plain, hashed)).toBe(true);
  });

  it("rejects invalid password against hash", () => {
    const hashed = hashPassword("password-1");

    expect(verifyPassword("password-2", hashed)).toBe(false);
  });

  it("rejects malformed hash structure", () => {
    expect(verifyPassword("password-1", "invalid-hash")).toBe(false);
  });

  it("rejects unsupported hashing scheme", () => {
    const hashed = hashPassword("password-1");
    const invalidScheme = hashed.replace("pbkdf2$", "bcrypt$");

    expect(verifyPassword("password-1", invalidScheme)).toBe(false);
  });

  it("rejects invalid iterations value", () => {
    const hashed = hashPassword("password-1");
    const invalidIterations = hashed.replace(/^pbkdf2\$\d+\$/, "pbkdf2$0$");

    expect(verifyPassword("password-1", invalidIterations)).toBe(false);
  });

  it("rejects hash with wrong length", () => {
    const hashed = hashPassword("password-1");
    const parts = hashed.split("$");
    const wrongLength = `${parts[0]}$${parts[1]}$${parts[2]}$abcd`;

    expect(verifyPassword("password-1", wrongLength)).toBe(false);
  });
});
