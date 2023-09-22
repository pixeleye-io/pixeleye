import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    hookTimeout: 30000,
    testTimeout: 15000
  },
});
