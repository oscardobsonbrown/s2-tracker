import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  const envLocalPath = join(process.cwd(), ".env.local");

  if (existsSync(envLocalPath)) {
    loadEnvFile(envLocalPath);
  }
}

if (!process.env.DATABASE_URL) {
  const envPath = join(process.cwd(), ".env");

  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});
