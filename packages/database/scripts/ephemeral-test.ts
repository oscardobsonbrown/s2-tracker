#!/usr/bin/env tsx
/**
 * Ephemeral Database Test Runner
 *
 * This script manages the full lifecycle of an ephemeral Neon database branch:
 * 1. Creates a branch from the main database
 * 2. Pushes schema to the branch
 * 3. Seeds the branch with test data
 * 4. Runs tests against the branch
 * 5. Deletes the branch (cleanup)
 */

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const NEON_PROJECT_ID = process.env.NEON_PROJECT_ID || "withered-rain-16037246";
const NEON_API_KEY = process.env.NEON_API_KEY;

if (!NEON_API_KEY) {
  console.error("❌ NEON_API_KEY environment variable is required");
  process.exit(1);
}

const branchName = `test-${randomUUID().slice(0, 8)}`;
let branchId: string | null = null;
let branchConnectionString: string | null = null;

async function createBranch(): Promise<{
  id: string;
  connectionString: string;
}> {
  console.log(`🔀 Creating ephemeral branch: ${branchName}...`);

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NEON_API_KEY}`,
      },
      body: JSON.stringify({
        branch: {
          name: branchName,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create branch: ${error}`);
  }

  const data = await response.json();
  branchId = data.branch.id;

  // Get the connection string for the branch
  const connectionResponse = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}/databases/neondb/connection_string`,
    {
      headers: {
        Authorization: `Bearer ${NEON_API_KEY}`,
      },
    }
  );

  if (connectionResponse.ok) {
    branchConnectionString = await connectionResponse.text();
  } else {
    // Fallback: construct connection string from branch info
    const branchResponse = await fetch(
      `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${branchId}`,
      {
        headers: {
          Authorization: `Bearer ${NEON_API_KEY}`,
        },
      }
    );
    const branchData = await branchResponse.json();
    const host = branchData.branch.host;
    branchConnectionString = `postgresql://neondb_owner:${NEON_API_KEY}@${host}/neondb?sslmode=require`;
  }

  if (!(branchId && branchConnectionString)) {
    throw new Error("Failed to create branch or get connection string");
  }

  console.log(`✅ Branch created: ${branchId}`);
  console.log("🔗 Connection string obtained");

  return { id: branchId, connectionString: branchConnectionString };
}

function pushSchema(connectionString: string) {
  console.log("📦 Pushing schema to ephemeral branch...");

  execSync("drizzle-kit push", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });

  console.log("✅ Schema pushed successfully");
}

function seedDatabase(connectionString: string) {
  console.log("🌱 Seeding ephemeral database...");

  execSync("tsx src/seed.ts", {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });

  console.log("✅ Database seeded successfully");
}

function runTests(connectionString: string) {
  console.log("🧪 Running tests against ephemeral database...");

  try {
    execSync("vitest run", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: connectionString },
      stdio: "inherit",
    });
    console.log("✅ Tests passed");
  } catch (error) {
    console.error("❌ Tests failed");
    throw error;
  }
}

async function deleteBranch(targetBranchId: string) {
  console.log(`🗑️  Cleaning up ephemeral branch: ${targetBranchId}...`);

  const response = await fetch(
    `https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${targetBranchId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${NEON_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    console.error(
      `⚠️  Failed to delete branch ${targetBranchId}: ${await response.text()}`
    );
    return;
  }

  console.log(`✅ Branch deleted: ${targetBranchId}`);
}

async function main() {
  console.log("🚀 Starting ephemeral database test run\n");

  try {
    // Step 1: Create ephemeral branch
    const { id, connectionString } = await createBranch();
    branchId = id;
    branchConnectionString = connectionString;

    // Step 2: Push schema
    await pushSchema(connectionString);

    // Step 3: Seed database
    await seedDatabase(connectionString);

    // Step 4: Run tests
    await runTests(connectionString);

    console.log("\n✨ All tests passed! Cleaning up...");
  } catch (error) {
    console.error("\n❌ Test run failed:", error);
    process.exitCode = 1;
  } finally {
    // Step 5: Cleanup (always run)
    if (branchId) {
      await deleteBranch(branchId);
    }
  }

  console.log("\n🏁 Ephemeral test run complete");
}

main();
