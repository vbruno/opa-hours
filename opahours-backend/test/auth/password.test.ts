import { describe, expect, it } from "vitest";

import {
  hashPassword,
  verifyPassword,
} from "../../src/application/auth/security/password.js";

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
});
