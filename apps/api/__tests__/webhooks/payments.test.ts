import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock analytics
vi.mock("@repo/analytics/server", () => ({
  analytics: {
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock clerk
vi.mock("@repo/auth/server", () => ({
  clerkClient: vi.fn().mockResolvedValue({
    users: {
      getUserList: vi.fn().mockResolvedValue({
        data: [
          {
            id: "user_test_123",
            privateMetadata: {
              polarCustomerId: "customer_test_456",
            },
          },
        ],
      }),
    },
  }),
}));

// Mock env with a variable secret
let mockWebhookSecret = "test_webhook_secret_123";

vi.mock("@/env", () => ({
  env: {
    get POLAR_WEBHOOK_SECRET() {
      return mockWebhookSecret;
    },
  },
}));

describe("Payment Webhook Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWebhookSecret = "test_webhook_secret_123";
  });

  it("should export POST handler", async () => {
    const route = await import("../../app/webhooks/payments/route");
    expect(route.POST).toBeDefined();
    expect(typeof route.POST).toBe("function");
  });

  it("should handle missing webhook secret", async () => {
    mockWebhookSecret = "";

    const { POST } = await import("../../app/webhooks/payments/route");
    const request = new Request("http://localhost:3002/webhooks/payments", {
      method: "POST",
      body: JSON.stringify({ type: "test" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(body.ok).toBe(false);
    expect(body.message).toBe("Not configured");
  });
});
