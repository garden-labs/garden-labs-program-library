import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: [process.env.TEST_INCLUDE_PATH || "**/test/**/*.ts"],
    testTimeout: 1000000,
    globalSetup: "./util/js/test-setup.ts",
  },
});
