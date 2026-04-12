import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { pages } from "./schema";

export type TestDatabase = ReturnType<typeof drizzle>;

export function createTestDatabase(connectionString: string): TestDatabase {
  const pool = new Pool({ connectionString });
  return drizzle(pool);
}

export async function cleanupTestData(db: TestDatabase) {
  // Clean up test data - delete all pages created during tests
  await db.delete(pages);
}

export async function withTestDatabase(
  connectionString: string,
  testFn: (db: TestDatabase) => Promise<void>
): Promise<void> {
  const db = createTestDatabase(connectionString);

  try {
    await testFn(db);
  } finally {
    await cleanupTestData(db);
  }
}
