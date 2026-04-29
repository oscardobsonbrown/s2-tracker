export interface RankingWeightsInput {
  elevation: number;
  snowDepth: number;
  snowfall7: number;
  snowfall14: number;
  temperature: number;
  wind: number;
}

export interface NormalizedRankingWeights {
  elevation: number;
  snowDepth: number;
  snowfall7: number;
  snowfall14: number;
  temperature: number;
  wind: number;
}

export interface ResortRankingFeatures {
  avgTempC: number | null;
  avgWindKmh: number | null;
  country: string | null;
  hasDownhill?: boolean | null;
  locality: string | null;
  maxElevationM: number | null;
  name: string;
  region: string | null;
  resortId: string;
  snowDepthCm: number | null;
  snowfall7Cm: number | null;
  snowfall14Cm: number | null;
}

export interface ResortScoreBreakdown {
  elevation: number;
  snowDepth: number;
  snowfall7: number;
  snowfall14: number;
  temperature: number;
  wind: number;
}

export interface RankedResortRow extends ResortRankingFeatures {
  rank: number;
  score: number;
  scoreBreakdown: ResortScoreBreakdown;
}

export const BALANCED_RANKING_WEIGHTS: NormalizedRankingWeights = {
  snowfall7: 35,
  snowfall14: 15,
  snowDepth: 20,
  temperature: 15,
  wind: 10,
  elevation: 5,
};

function roundToSingleDecimal(value: number) {
  return Number(value.toFixed(1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLinear(value: number | null, fullScoreAt: number) {
  if (value === null) {
    return 0;
  }

  return clamp(value / fullScoreAt, 0, 1);
}

function scoreTemperature(tempC: number | null) {
  if (tempC === null) {
    return 0;
  }

  if (tempC >= -8 && tempC <= -1) {
    return 1;
  }

  if (tempC < -20 || tempC > 8) {
    return 0;
  }

  if (tempC < -8) {
    return clamp((tempC + 20) / 12, 0, 1);
  }

  return clamp((8 - tempC) / 9, 0, 1);
}

function scoreWind(windKmh: number | null) {
  if (windKmh === null) {
    return 0;
  }

  if (windKmh <= 15) {
    return 1;
  }

  if (windKmh >= 50) {
    return 0;
  }

  return clamp((50 - windKmh) / 35, 0, 1);
}

export function normalizeRankingWeights(
  input: RankingWeightsInput
): NormalizedRankingWeights {
  const totalWeight =
    input.snowfall7 +
    input.snowfall14 +
    input.snowDepth +
    input.temperature +
    input.wind +
    input.elevation;

  if (totalWeight <= 0) {
    return BALANCED_RANKING_WEIGHTS;
  }

  return {
    snowfall7: (input.snowfall7 / totalWeight) * 100,
    snowfall14: (input.snowfall14 / totalWeight) * 100,
    snowDepth: (input.snowDepth / totalWeight) * 100,
    temperature: (input.temperature / totalWeight) * 100,
    wind: (input.wind / totalWeight) * 100,
    elevation: (input.elevation / totalWeight) * 100,
  };
}

export function computeResortScore(
  features: ResortRankingFeatures,
  weights: NormalizedRankingWeights
) {
  const scoreBreakdown: ResortScoreBreakdown = {
    snowfall7: normalizeLinear(features.snowfall7Cm, 70) * weights.snowfall7,
    snowfall14: normalizeLinear(features.snowfall14Cm, 70) * weights.snowfall14,
    snowDepth: normalizeLinear(features.snowDepthCm, 200) * weights.snowDepth,
    temperature: scoreTemperature(features.avgTempC) * weights.temperature,
    wind: scoreWind(features.avgWindKmh) * weights.wind,
    elevation:
      normalizeLinear(features.maxElevationM, 3000) * weights.elevation,
  };

  const score =
    scoreBreakdown.snowfall7 +
    scoreBreakdown.snowfall14 +
    scoreBreakdown.snowDepth +
    scoreBreakdown.temperature +
    scoreBreakdown.wind +
    scoreBreakdown.elevation;

  return {
    score: roundToSingleDecimal(score),
    scoreBreakdown: {
      snowfall7: roundToSingleDecimal(scoreBreakdown.snowfall7),
      snowfall14: roundToSingleDecimal(scoreBreakdown.snowfall14),
      snowDepth: roundToSingleDecimal(scoreBreakdown.snowDepth),
      temperature: roundToSingleDecimal(scoreBreakdown.temperature),
      wind: roundToSingleDecimal(scoreBreakdown.wind),
      elevation: roundToSingleDecimal(scoreBreakdown.elevation),
    },
  };
}

function compareNullableNumbersDescending(
  left: number | null,
  right: number | null
) {
  const normalizedLeft = left ?? Number.NEGATIVE_INFINITY;
  const normalizedRight = right ?? Number.NEGATIVE_INFINITY;
  return normalizedRight - normalizedLeft;
}

function compareNullableNumbersAscending(
  left: number | null,
  right: number | null
) {
  const normalizedLeft = left ?? Number.POSITIVE_INFINITY;
  const normalizedRight = right ?? Number.POSITIVE_INFINITY;
  return normalizedLeft - normalizedRight;
}

export function rankResortRows(
  rows: ResortRankingFeatures[],
  weights: NormalizedRankingWeights
): RankedResortRow[] {
  return rows
    .map((row) => {
      const { score, scoreBreakdown } = computeResortScore(row, weights);

      return {
        ...row,
        score,
        scoreBreakdown,
        rank: 0,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const snowfallComparison = compareNullableNumbersDescending(
        left.snowfall7Cm,
        right.snowfall7Cm
      );

      if (snowfallComparison !== 0) {
        return snowfallComparison;
      }

      const snowDepthComparison = compareNullableNumbersDescending(
        left.snowDepthCm,
        right.snowDepthCm
      );

      if (snowDepthComparison !== 0) {
        return snowDepthComparison;
      }

      const windComparison = compareNullableNumbersAscending(
        left.avgWindKmh,
        right.avgWindKmh
      );

      if (windComparison !== 0) {
        return windComparison;
      }

      return left.name.localeCompare(right.name);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
}
