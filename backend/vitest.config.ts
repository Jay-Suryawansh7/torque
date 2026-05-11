import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      JWT_SECRET: "test-jwt-secret-at-least-32-characters-long!!",
      ENCRYPTION_KEY: "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYQo=",
      FRONTEND_URL: "http://localhost:5173",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      lines: 40,
      branches: 15,
      functions: 25,
      statements: 40,
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/types/**", "src/database/schema.ts", "src/engine/stores.ts"],
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
