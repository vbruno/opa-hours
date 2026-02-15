import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const ALGORITHM = "sha256";
const ITERATIONS = 150_000;
const KEY_LENGTH = 32;

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM).toString(
    "hex",
  );

  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
};

export const verifyPassword = (
  password: string,
  storedHash: string,
): boolean => {
  const [scheme, iterationsRaw, salt, expectedHash] = storedHash.split("$");

  if (!scheme || !iterationsRaw || !salt || !expectedHash) {
    return false;
  }

  if (scheme !== "pbkdf2") {
    return false;
  }

  const iterations = Number(iterationsRaw);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const computedHash = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, ALGORITHM);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (expectedBuffer.length !== computedHash.length) {
    return false;
  }

  return timingSafeEqual(computedHash, expectedBuffer);
};
