import path from "node:path";
import { defineConfig } from "vitest/config";

export function createNodeConfig(
  options: { alias?: Record<string, string> } = {}
) {
  return defineConfig({
    test: {
      environment: "node",
      globals: true,
    },
    resolve: {
      alias: {
        ...options.alias,
      },
    },
  });
}

export function createPackageConfig(packagePath: string) {
  return defineConfig({
    test: {
      environment: "node",
      globals: true,
      include: ["__tests__/**/*.test.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(packagePath, "./"),
      },
    },
  });
}
