import path from "node:path";
import { fileURLToPath } from "node:url";
import { createNextAppConfig } from "@repo/testing/vitest/react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

export default createNextAppConfig(__dirname, repoRoot);
