import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock analytics
vi.mock("@repo/analytics/server", () => ({
  analytics: {
    identify: vi.fn(),
    capture: vi.fn(),
    groupIdentify: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock Svix Webhook
vi.mock("svix", () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockImplementation((payload, headers) => {
      // Mock verification - in real tests we'd verify properly
      const hasId = headers["svix-id"] !== undefined;
      const hasTimestamp = headers["svix-timestamp"] !== undefined;
      const hasSignature = headers["svix-signature"] !== undefined;
      if (!hasId) {
        throw new Error("Missing headers");
      }
      if (!hasTimestamp) {
        throw new Error("Missing headers");
      }
      if (!hasSignature) {
        throw new Error("Missing headers");
      }
      return JSON.parse(payload);
    }),
  })),
}));

// Mock env with a variable secret
let mockClerkSecret = "test_clerk_webhook_secret";

vi.mock("@/env", () => ({
  env: {
    get CLERK_WEBHOOK_SECRET() {
      return mockClerkSecret;
    },
  },
}));

describe("Auth Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClerkSecret = "test_clerk_webhook_secret";
  });

  it("should export POST handler", async () => {
    const route = await import("../../app/webhooks/auth/route");
    expect(route.POST).toBeDefined();
    expect(typeof route.POST).toBe("function");
  });

  it("should handle missing webhook secret", async () => {
    mockClerkSecret = "";

    const { POST } = await import("../../app/webhooks/auth/route");
    const request = new Request("http://localhost:3002/webhooks/auth", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.message).toBe("Not configured");
  });
});
