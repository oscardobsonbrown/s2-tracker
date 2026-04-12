import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReactConfig } from "@repo/testing/vitest/react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default createReactConfig({
  alias: {
    "@": path.resolve(__dirname, "./"),
  },
});
