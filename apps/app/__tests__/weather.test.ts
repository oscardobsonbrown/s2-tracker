import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@repo/observability/logger.server", () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

import {
  getSnowConditions,
  getSurfConditions,
  type WeatherProviderError,
} from "@/lib/weather";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("weather provider", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("geocodes snow locations and normalizes current and daily forecasts", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          results: [
            {
              name: "Niseko",
              latitude: 42.8048,
              longitude: 140.6874,
              country: "Japan",
              admin1: "Hokkaido",
              timezone: "Asia/Tokyo",
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          current_units: {
            temperature_2m: "C",
            snowfall: "cm",
          },
          daily_units: {
            snowfall_sum: "cm",
          },
          current: {
            time: "2026-04-12T12:00",
            temperature_2m: -3.4,
            snowfall: 1.2,
            snow_depth: null,
            wind_speed_10m: 16,
            wind_direction_10m: 270,
          },
          daily: {
            time: ["2026-04-12", "2026-04-13"],
            snowfall_sum: [4.1, null],
            temperature_2m_min: [-7, -6],
            temperature_2m_max: [-1, 0],
          },
        })
      );

    const response = await getSnowConditions({ location: "Niseko" });

    expect(response).toMatchObject({
      kind: "snow",
      location: {
        name: "Niseko",
        country: "Japan",
        admin1: "Hokkaido",
      },
      current: {
        temperature: -3.4,
        snowfall: 1.2,
        snowDepth: null,
        windSpeed: 16,
        windDirection: 270,
      },
      daily: [
        {
          date: "2026-04-12",
          snowfall: 4.1,
          temperatureMin: -7,
          temperatureMax: -1,
        },
        {
          date: "2026-04-13",
          snowfall: null,
          temperatureMin: -6,
          temperatureMax: 0,
        },
      ],
      source: "Open-Meteo Forecast API",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "geocoding-api.open-meteo.com"
    );
    expect(String(fetchMock.mock.calls[1][0])).toContain("api.open-meteo.com");
  });

  test("maps Open-Meteo error envelopes to provider errors", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          error: true,
          reason: "Marine forecast unavailable",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          current: {
            time: "2026-04-12T12:00",
            wind_speed_10m: 12,
            wind_direction_10m: 260,
            wind_gusts_10m: 20,
          },
        })
      );

    await expect(
      getSurfConditions({
        latitude: -33.953,
        longitude: 115.073,
        location: "Margaret River",
      })
    ).rejects.toMatchObject({
      code: "PROVIDER_ERROR",
      message: "Marine forecast unavailable",
    } satisfies Partial<WeatherProviderError>);
  });
});
