import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@repo/observability/logger.server", () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

vi.mock("@/lib/search-flights", () => {
  class MockFlightProviderError extends Error {
    code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "FlightProviderError";
      this.code = code;
    }
  }

  return {
    FlightProviderError: MockFlightProviderError,
    searchFlights: vi.fn(),
  };
});

import { FlightProviderError, searchFlights } from "@/lib/search-flights";
import { POST } from "../app/api/flights/route";

const mockedSearchFlights = vi.mocked(searchFlights);

describe("POST /api/flights", () => {
  beforeEach(() => {
    mockedSearchFlights.mockReset();
  });

  test("returns validation errors before calling the provider", async () => {
    const response = await POST(
      new Request("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify({
          tripType: "one-way",
          origin: "JFK",
          destination: "JFK",
          departureDate: "2026-05-01",
          adults: 1,
          currency: "USD",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Origin and destination must be different.",
      },
    });
    expect(mockedSearchFlights).not.toHaveBeenCalled();
  });

  test("maps provider timeouts to 504 responses", async () => {
    mockedSearchFlights.mockRejectedValue(
      new FlightProviderError("TIMEOUT", "Flight search took too long.")
    );

    const response = await POST(
      new Request("http://localhost/api/flights", {
        method: "POST",
        body: JSON.stringify({
          tripType: "one-way",
          origin: "JFK",
          destination: "LAX",
          departureDate: "2026-05-01",
          adults: 1,
          currency: "USD",
        }),
      })
    );

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: {
        code: "TIMEOUT",
        message: "Flight search took too long.",
      },
    });
  });
});
