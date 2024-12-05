import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: [process.env.TEST_INCLUDE_PATH || "**/test/**/*.ts"],
    exclude: ["node_modules", "build", "test"],
    testTimeout: 1000000,
    globalSetup: "./test/setup.ts",
  },
});
