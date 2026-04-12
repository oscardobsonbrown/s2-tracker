import { describe, expect, it, vi } from "vitest";

// Mock server-only module
vi.mock("server-only", () => ({}));

// Mock the @polar-sh/sdk module with a proper constructor
vi.mock("@polar-sh/sdk", () => ({
  Polar: vi.fn().mockImplementation(function (this: unknown, config: object) {
    return {
      config,
      products: {
        list: vi.fn().mockResolvedValue({
          items: [
            { id: "prod_1", name: "Test Product 1" },
            { id: "prod_2", name: "Test Product 2" },
          ],
        }),
      },
      customers: {
        create: vi
          .fn()
          .mockResolvedValue({ id: "cus_test", email: "test@example.com" }),
        get: vi
          .fn()
          .mockResolvedValue({ id: "cus_test", email: "test@example.com" }),
      },
      subscriptions: {
        create: vi.fn().mockResolvedValue({ id: "sub_test", status: "active" }),
        update: vi
          .fn()
          .mockResolvedValue({ id: "sub_test", status: "cancelled" }),
      },
    };
  }),
}));

// Mock the keys module
vi.mock("../keys", () => ({
  keys: vi.fn().mockReturnValue({
    POLAR_ACCESS_TOKEN: "polar_test_token_123",
    POLAR_SERVER: "sandbox",
    POLAR_WEBHOOK_SECRET: "whsec_test_secret",
  }),
}));

describe("Polar Client", () => {
  it("should export polar client", async () => {
    // Import should work without errors
    const { polar } = await import("../index");
    expect(polar).toBeDefined();
  });

  it("polar client has expected methods", async () => {
    const { polar } = await import("../index");
    expect(polar).toBeDefined();
    expect(typeof polar.products.list).toBe("function");
    expect(typeof polar.customers.create).toBe("function");
    expect(typeof polar.subscriptions.create).toBe("function");
  });
});
