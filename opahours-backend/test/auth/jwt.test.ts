import { describe, expect, it } from "vitest";

import { signJwt, verifyJwt } from "../../src/application/auth/security/jwt.js";

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
});
