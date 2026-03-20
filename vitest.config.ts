import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.spec.ts", "tests/**/*.spec.tsx"],
    restoreMocks: true,
    clearMocks: true,
  },
});
