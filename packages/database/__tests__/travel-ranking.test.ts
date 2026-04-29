import { describe, expect, test } from "vitest";
import {
  BALANCED_RANKING_WEIGHTS,
  computeResortScore,
  normalizeRankingWeights,
  rankResortRows,
} from "../src/travel-ranking";

describe("travel ranking helpers", () => {
  test("falls back to balanced defaults when all weights are zero", () => {
    expect(
      normalizeRankingWeights({
        snowfall7: 0,
        snowfall14: 0,
        snowDepth: 0,
        temperature: 0,
        wind: 0,
        elevation: 0,
      })
    ).toEqual(BALANCED_RANKING_WEIGHTS);
  });

  test("normalizes arbitrary ranking weights to 100", () => {
    const normalized = normalizeRankingWeights({
      snowfall7: 10,
      snowfall14: 10,
      snowDepth: 10,
      temperature: 10,
      wind: 10,
      elevation: 10,
    });

    expect(
      normalized.snowfall7 +
        normalized.snowfall14 +
        normalized.snowDepth +
        normalized.temperature +
        normalized.wind +
        normalized.elevation
    ).toBeCloseTo(100);
  });

  test("scores strong snow and low wind better than warm windy conditions", () => {
    const stronger = computeResortScore(
      {
        resortId: "alpha",
        name: "Alpha",
        country: "Japan",
        region: "Hokkaido",
        locality: "Kutchan",
        snowfall7Cm: 60,
        snowfall14Cm: 90,
        snowDepthCm: 180,
        avgTempC: -5,
        avgWindKmh: 12,
        maxElevationM: 1400,
      },
      BALANCED_RANKING_WEIGHTS
    );
    const weaker = computeResortScore(
      {
        resortId: "beta",
        name: "Beta",
        country: "France",
        region: "Alps",
        locality: "Val",
        snowfall7Cm: 5,
        snowfall14Cm: 15,
        snowDepthCm: 25,
        avgTempC: 4,
        avgWindKmh: 42,
        maxElevationM: 900,
      },
      BALANCED_RANKING_WEIGHTS
    );

    expect(stronger.score).toBeGreaterThan(weaker.score);
  });

  test("uses the documented tie-break order", () => {
    const ranked = rankResortRows(
      [
        {
          resortId: "alpha",
          name: "Alpha",
          country: "Japan",
          region: "Hokkaido",
          locality: "Kutchan",
          snowfall7Cm: 40,
          snowfall14Cm: 40,
          snowDepthCm: 120,
          avgTempC: -5,
          avgWindKmh: 10,
          maxElevationM: 1200,
        },
        {
          resortId: "beta",
          name: "Beta",
          country: "Japan",
          region: "Hokkaido",
          locality: "Kutchan",
          snowfall7Cm: 35,
          snowfall14Cm: 50,
          snowDepthCm: 160,
          avgTempC: -5,
          avgWindKmh: 10,
          maxElevationM: 1200,
        },
      ],
      {
        snowfall7: 100,
        snowfall14: 0,
        snowDepth: 0,
        temperature: 0,
        wind: 0,
        elevation: 0,
      }
    );

    expect(ranked[0]?.resortId).toBe("alpha");
    expect(ranked[0]?.rank).toBe(1);
    expect(ranked[1]?.rank).toBe(2);
  });
});
