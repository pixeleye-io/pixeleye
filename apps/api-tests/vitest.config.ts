import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./src/setup/account.ts"],
    globals: true,
    testTimeout: 20000,
    maxConcurrency: 3,
  },
});
