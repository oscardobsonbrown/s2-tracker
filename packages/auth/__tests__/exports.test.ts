import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock server-only
vi.mock("server-only", () => ({}));

// Mock @clerk/nextjs/server
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({
    userId: "user_test_123",
    orgId: "org_test_456",
    orgRole: "org:admin",
  }),
  currentUser: vi.fn().mockResolvedValue({
    id: "user_test_123",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  }),
  clerkClient: vi.fn().mockReturnValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: "user_test_123",
        emailAddresses: [{ emailAddress: "test@example.com" }],
      }),
    },
  }),
  clerkMiddleware: vi.fn().mockImplementation((handler) => handler),
}));

// Mock @clerk/nextjs
vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: vi.fn().mockImplementation(({ children }) => children),
  SignIn: vi.fn().mockImplementation(() => null),
  SignUp: vi.fn().mockImplementation(() => null),
  SignedIn: vi.fn().mockImplementation(({ children }) => children),
  SignedOut: vi.fn().mockImplementation(() => null),
  useAuth: vi.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    userId: "user_test_123",
  }),
  useUser: vi.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "user_test_123",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
  }),
}));

describe("Server Exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export server functions without errors", async () => {
    // Import should work without errors
    const server = await import("../server");
    expect(server).toBeDefined();
  });
});

describe("Client Exports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export client functions without errors", async () => {
    // Import should work without errors
    const client = await import("../client");
    expect(client).toBeDefined();
  });
});

describe("Proxy Exports", () => {
  it("should export authMiddleware without errors", async () => {
    // Import should work without errors
    const proxy = await import("../proxy");
    expect(proxy).toBeDefined();
  });
});
