import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadEnvFile } from "node:process";

export function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envLocalPath = join(process.cwd(), ".env.local");

  if (existsSync(envLocalPath)) {
    loadEnvFile(envLocalPath);
  }

  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = join(process.cwd(), ".env");

  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }
}
