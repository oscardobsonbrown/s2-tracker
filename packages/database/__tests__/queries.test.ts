import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { pages } from "../src/schema";
import { cleanupTestData, createTestDatabase } from "../src/test-utils";

const databaseUrl = process.env.DATABASE_URL;

// Skip all tests if no database URL is provided
const describeOrSkip = databaseUrl ? describe : describe.skip;

describeOrSkip("Database Queries", () => {
  const db = createTestDatabase(databaseUrl || "");

  afterAll(async () => {
    await cleanupTestData(db);
  });

  describe("CREATE operations", () => {
    it("should insert a page", async () => {
      const result = await db
        .insert(pages)
        .values({ name: "Test Page" })
        .returning();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Page");
      expect(result[0].id).toBeDefined();
    });

    it("should insert multiple pages", async () => {
      const result = await db
        .insert(pages)
        .values([{ name: "Page 1" }, { name: "Page 2" }])
        .returning();

      expect(result).toHaveLength(2);
    });
  });

  describe("READ operations", () => {
    it("should select all pages", async () => {
      // Insert some test data
      await db.insert(pages).values([{ name: "Page A" }, { name: "Page B" }]);

      const allPages = await db.select().from(pages);

      expect(allPages.length).toBeGreaterThanOrEqual(2);
      expect(allPages.some((p) => p.name === "Page A")).toBe(true);
      expect(allPages.some((p) => p.name === "Page B")).toBe(true);
    });

    it("should select page by id", async () => {
      const inserted = await db
        .insert(pages)
        .values({ name: "Select By ID Test" })
        .returning();

      const found = await db
        .select()
        .from(pages)
        .where(eq(pages.id, inserted[0].id))
        .limit(1);

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Select By ID Test");
    });

    it("should select page by name", async () => {
      await db.insert(pages).values({ name: "Find Me" });

      const found = await db
        .select()
        .from(pages)
        .where(eq(pages.name, "Find Me"))
        .limit(1);

      expect(found).toHaveLength(1);
      expect(found[0].name).toBe("Find Me");
    });
  });

  describe("UPDATE operations", () => {
    it("should update a page", async () => {
      const inserted = await db
        .insert(pages)
        .values({ name: "Old Name" })
        .returning();

      const updated = await db
        .update(pages)
        .set({ name: "New Name" })
        .where(eq(pages.id, inserted[0].id))
        .returning();

      expect(updated).toHaveLength(1);
      expect(updated[0].name).toBe("New Name");
    });
  });

  describe("DELETE operations", () => {
    it("should delete a page", async () => {
      const inserted = await db
        .insert(pages)
        .values({ name: "To Delete" })
        .returning();

      await db.delete(pages).where(eq(pages.id, inserted[0].id));

      const found = await db
        .select()
        .from(pages)
        .where(eq(pages.id, inserted[0].id));

      expect(found).toHaveLength(0);
    });
  });
});
