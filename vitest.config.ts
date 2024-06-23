import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["**/test/**/*.ts"],
    testTimeout: 1000000,
    fileParallelism: false,
  },
});
