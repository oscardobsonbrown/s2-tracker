import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPackageConfig } from "@repo/testing/vitest/node";
import { defineConfig, mergeConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  createPackageConfig(__dirname),
  defineConfig({
    test: {
      // These tests share the same live database table and cleanup hooks.
      fileParallelism: false,
    },
  })
);
