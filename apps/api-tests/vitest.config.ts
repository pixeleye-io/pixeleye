import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./src/setup/account.ts"],
    globals: true,
    testTimeout: 20000,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    // singleThread: (process.env.CI ?? false) as boolean,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    maxConcurrency: process.env.CI ?? false ? 2 : 5,
  },
});
