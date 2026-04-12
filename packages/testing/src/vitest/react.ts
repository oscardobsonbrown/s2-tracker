import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export function createReactConfig(
  options: { alias?: Record<string, string>; testInclude?: string[] } = {}
) {
  return defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      include: options.testInclude || ["__tests__/**/*.test.{ts,tsx}"],
    },
    resolve: {
      alias: {
        ...options.alias,
      },
    },
  });
}

export function createNextAppConfig(appPath: string, repoPath: string) {
  return defineConfig({
    plugins: [react()],
    test: {
      environment: "jsdom",
      globals: true,
      include: ["__tests__/**/*.test.{ts,tsx}"],
    },
    resolve: {
      alias: {
        "@": path.resolve(appPath, "./"),
        "@repo": path.resolve(repoPath, "packages"),
      },
    },
  });
}
