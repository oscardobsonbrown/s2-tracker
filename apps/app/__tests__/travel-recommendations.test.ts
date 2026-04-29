import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@repo/observability/logger.server", () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

vi.mock("@repo/database", () => ({
  BALANCED_RANKING_WEIGHTS: {
    elevation: 5,
    snowfall14: 15,
    snowfall7: 35,
    snowDepth: 20,
    temperature: 15,
    wind: 10,
  },
  normalizeRankingWeights: vi.fn((weights) => weights),
}));

vi.mock("@/lib/travel-data", () => ({
  loadAirportLinksForResorts: vi.fn(),
  loadRankedSnapshot: vi.fn(),
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
import {
  loadAirportLinksForResorts,
  loadRankedSnapshot,
} from "@/lib/travel-data";
import {
  loadTravelRecommendations,
  validateRankingPreviewRequest,
} from "@/lib/travel-recommendations";

const mockedLoadAirportLinksForResorts = vi.mocked(loadAirportLinksForResorts);
const mockedLoadRankedSnapshot = vi.mocked(loadRankedSnapshot);
const mockedSearchFlights = vi.mocked(searchFlights);

describe("travel recommendation helpers", () => {
  beforeEach(() => {
    mockedLoadAirportLinksForResorts.mockReset();
    mockedLoadRankedSnapshot.mockReset();
    mockedSearchFlights.mockReset();
  });

  test("rejects ranking preview requests without complete numeric weights", () => {
    expect(validateRankingPreviewRequest({})).toBe(
      "Weights must include non-negative numeric elevation, snowfall14, snowfall7, snowDepth, temperature, and wind values."
    );
  });

  test("normalizes valid ranking preview requests", () => {
    expect(
      validateRankingPreviewRequest({
        filters: {
          downhillOnly: true,
          minimumScore: 42,
          query: " niseko ",
        },
        pagination: {
          pageIndex: 2.8,
          pageSize: 100,
        },
        sort: {
          column: "score",
          direction: "desc",
        },
        weights: {
          elevation: 5,
          snowfall14: 15,
          snowfall7: 35,
          snowDepth: 20,
          temperature: 15,
          wind: 10,
        },
      })
    ).toMatchObject({
      downhillOnly: true,
      minimumScore: 42,
      pageIndex: 2,
      pageSize: 100,
      query: "niseko",
      sortColumn: "score",
      sortDirection: "desc",
    });
  });

  test("propagates flight provider outages while building recommendations", async () => {
    mockedLoadRankedSnapshot.mockResolvedValue({
      isStale: false,
      snapshotDate: "2026-05-01",
      rankedRows: [
        {
          avgTempC: -4,
          avgWindKmh: 12,
          country: "Japan",
          hasDownhill: true,
          locality: "Kutchan",
          maxElevationM: 1200,
          name: "Niseko",
          rank: 1,
          region: "Hokkaido",
          resortId: "niseko",
          score: 82,
          scoreBreakdown: {
            elevation: 2,
            snowfall14: 15,
            snowfall7: 35,
            snowDepth: 18,
            temperature: 10,
            wind: 2,
          },
          snowDepthCm: 160,
          snowfall14Cm: 80,
          snowfall7Cm: 45,
        },
      ],
    });
    mockedLoadAirportLinksForResorts.mockResolvedValue(
      new Map([
        [
          "niseko",
          [
            {
              accessClass: "A",
              airportId: "cts",
              distanceKm: 110,
              iataCode: "CTS",
              municipality: "Sapporo",
              name: "New Chitose Airport",
              priorityRank: 1,
            },
          ],
        ],
      ])
    );
    mockedSearchFlights.mockRejectedValue(
      new FlightProviderError("PYTHON_UNAVAILABLE", "Python is unavailable.")
    );

    await expect(
      loadTravelRecommendations({
        departureDate: "2026-05-01",
        originAirport: "LAX",
        preset: {
          cabin: "economy",
          maxStops: 1,
        },
        returnDate: "2026-05-08",
        tripType: "round-trip",
      })
    ).rejects.toMatchObject({
      code: "PYTHON_UNAVAILABLE",
      message: "Python is unavailable.",
    });
  });
});
