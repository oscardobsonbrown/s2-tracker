import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPackageConfig } from "@repo/testing/vitest/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createPackageConfig(__dirname);
