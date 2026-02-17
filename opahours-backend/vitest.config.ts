import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    testTimeout: 20_000,
    hookTimeout: 20_000,
    pool: "forks",
    maxConcurrency: 1,
    globals: true,
    reporters: "verbose",
    environment: "node",
  },
});
