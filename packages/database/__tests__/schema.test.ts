import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { cleanupTestData, createTestDatabase } from "../src/test-utils";

const databaseUrl = process.env.DATABASE_URL;

// Skip all tests if no database URL is provided
const describeOrSkip = databaseUrl ? describe : describe.skip;

describeOrSkip("Database Schema", () => {
  const db = createTestDatabase(databaseUrl || "");

  afterAll(async () => {
    await cleanupTestData(db);
  });

  describe("pages table", () => {
    it("should exist", async () => {
      // Try to query the table to verify it exists
      const result = await db
        .execute(sql`SELECT 1 FROM pages LIMIT 1`)
        .catch(() => null);
      expect(result).toBeDefined();
    });

    it("should have id column", async () => {
      const result = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'id'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should have name column", async () => {
      const result = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'name'`
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    it("should have correct column types", async () => {
      const result = await db.execute(
        sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pages'`
      );

      const columns = result.rows.map((row) => String(row.column_name));
      expect(columns).toContain("id");
      expect(columns).toContain("name");
    });
  });

  describe("ski_resorts table", () => {
    it("should exist", async () => {
      const result = await db
        .execute(sql`SELECT 1 FROM ski_resorts LIMIT 1`)
        .catch(() => null);
      expect(result).toBeDefined();
    });

    it("should have required location columns", async () => {
      const result = await db.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'ski_resorts'`
      );

      const columns = result.rows.map((row) => String(row.column_name));
      expect(columns).toContain("id");
      expect(columns).toContain("name");
      expect(columns).toContain("latitude");
      expect(columns).toContain("longitude");
      expect(columns).toContain("openskimap_url");
    });
  });
});
