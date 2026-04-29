import { pathToFileURL } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { loadDatabaseEnv } from "./load-database-env";
import { resortWeatherScores, skiResorts } from "./schema";
import {
  BALANCED_RANKING_WEIGHTS,
  computeResortScore,
  type ResortRankingFeatures,
} from "./travel-ranking";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const batchSize = 25;
const batchDelayMs = 400;
const maxRetries = 5;
const retryBaseDelayMs = 16_000;

type ResortWeatherScoreInsert = typeof resortWeatherScores.$inferInsert;

interface BatchForecastResponse {
  current?: {
    snow_depth?: number | null;
  };
  daily?: {
    snowfall_sum?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
    wind_speed_10m_max?: Array<number | null>;
  };
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function nullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sumNullable(values: Array<number | null | undefined>) {
  const numbers = values
    .map((value) => nullableNumber(value))
    .filter((value): value is number => value !== null);

  if (!numbers.length) {
    return null;
  }

  return Number(numbers.reduce((total, value) => total + value, 0).toFixed(1));
}

function averageNullable(values: Array<number | null | undefined>) {
  const numbers = values
    .map((value) => nullableNumber(value))
    .filter((value): value is number => value !== null);

  if (!numbers.length) {
    return null;
  }

  return Number(
    (
      numbers.reduce((total, value) => total + value, 0) / numbers.length
    ).toFixed(1)
  );
}

function readBatchResponses(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as BatchForecastResponse[];
  }

  return [payload as BatchForecastResponse];
}

function parseRetryAfterMilliseconds(retryAfter: string | null) {
  if (!retryAfter) {
    return null;
  }

  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  const retryAtTimestamp = Date.parse(retryAfter);

  if (Number.isNaN(retryAtTimestamp)) {
    return null;
  }

  return Math.max(0, retryAtTimestamp - Date.now());
}

function buildBatchUrl(
  resorts: Array<{
    latitude: number;
    longitude: number;
  }>
) {
  const url = new URL(FORECAST_URL);

  url.searchParams.set(
    "latitude",
    resorts.map((resort) => String(resort.latitude)).join(",")
  );
  url.searchParams.set(
    "longitude",
    resorts.map((resort) => String(resort.longitude)).join(",")
  );
  url.searchParams.set("timezone", "GMT");
  url.searchParams.set("forecast_days", "14");
  url.searchParams.set("current", ["snow_depth"].join(","));
  url.searchParams.set(
    "daily",
    [
      "snowfall_sum",
      "temperature_2m_max",
      "temperature_2m_min",
      "wind_speed_10m_max",
    ].join(",")
  );

  return url;
}

async function fetchForecastBatch(
  resorts: Array<{
    latitude: number;
    longitude: number;
  }>
) {
  const url = buildBatchUrl(resorts);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (response.ok) {
      return readBatchResponses(await response.json());
    }

    if (
      (response.status === 429 || response.status >= 500) &&
      attempt < maxRetries
    ) {
      const retryDelayMs =
        parseRetryAfterMilliseconds(response.headers.get("retry-after")) ??
        retryBaseDelayMs * 2 ** attempt;

      console.warn(
        `Open-Meteo request returned ${response.status}. Retrying batch in ${retryDelayMs}ms.`
      );
      await sleep(retryDelayMs);
      continue;
    }

    const responseText = await response.text();
    const errorDetails = responseText ? ` ${responseText.slice(0, 200)}` : "";

    throw new Error(
      `Open-Meteo forecast request failed: ${response.status} ${response.statusText}.${errorDetails}`
    );
  }

  throw new Error(
    "Open-Meteo forecast request failed after exhausting retries."
  );
}

async function loadProcessedResortIds(
  db: ReturnType<typeof drizzle>,
  refreshDate: string
) {
  const rows = await db
    .select({ resortId: resortWeatherScores.resortId })
    .from(resortWeatherScores)
    .where(eq(resortWeatherScores.refreshDate, refreshDate));

  return new Set(rows.map((row) => row.resortId));
}

function toSnapshotRow(
  resort: {
    country: string | null;
    hasDownhill: boolean | null;
    id: string;
    locality: string | null;
    maxElevationM: number | null;
    name: string;
    region: string | null;
  },
  forecast: BatchForecastResponse,
  refreshDate: string
): ResortWeatherScoreInsert {
  const snowfall7Cm = sumNullable(
    forecast.daily?.snowfall_sum?.slice(0, 7) ?? []
  );
  const snowfall14Cm = sumNullable(
    forecast.daily?.snowfall_sum?.slice(0, 14) ?? []
  );
  const snowDepthMeters = nullableNumber(forecast.current?.snow_depth);
  const snowDepthCm =
    snowDepthMeters === null
      ? null
      : Number((snowDepthMeters * 100).toFixed(1));

  const averageMidpointTemp = averageNullable(
    (forecast.daily?.temperature_2m_max ?? []).map((maxTemp, index) => {
      const minTemp = nullableNumber(
        forecast.daily?.temperature_2m_min?.[index]
      );
      const normalizedMaxTemp = nullableNumber(maxTemp);

      if (minTemp === null || normalizedMaxTemp === null) {
        return null;
      }

      return (minTemp + normalizedMaxTemp) / 2;
    })
  );

  const avgWindKmh = averageNullable(forecast.daily?.wind_speed_10m_max ?? []);

  const rankingFeatures: ResortRankingFeatures = {
    avgTempC: averageMidpointTemp,
    avgWindKmh,
    country: resort.country,
    hasDownhill: resort.hasDownhill,
    locality: resort.locality,
    maxElevationM: resort.maxElevationM,
    name: resort.name,
    region: resort.region,
    resortId: resort.id,
    snowDepthCm,
    snowfall14Cm,
    snowfall7Cm,
  };

  const { score } = computeResortScore(
    rankingFeatures,
    BALANCED_RANKING_WEIGHTS
  );

  return {
    refreshDate,
    resortId: resort.id,
    snowfall7Cm,
    snowfall14Cm,
    snowDepthCm,
    avgTempC: averageMidpointTemp,
    avgWindKmh,
    maxElevationM: resort.maxElevationM,
    defaultBalancedScore: score,
  };
}

export async function importResortWeatherScores() {
  loadDatabaseEnv();

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL must be set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);
  const refreshDate = new Date().toISOString().slice(0, 10);

  try {
    const [resorts, processedResortIds] = await Promise.all([
      db.select().from(skiResorts).orderBy(asc(skiResorts.id)),
      loadProcessedResortIds(db, refreshDate),
    ]);
    const pendingResorts = resorts.filter(
      (resort) => !processedResortIds.has(resort.id)
    );
    const resortBatches = chunk(pendingResorts, batchSize);

    console.log(
      `Preparing resort weather snapshot for ${refreshDate}. ${processedResortIds.size} resorts already stored, ${pendingResorts.length} remaining in ${resortBatches.length} batches.`
    );

    for (const [batchIndex, resortBatch] of resortBatches.entries()) {
      console.log(
        `Fetching weather batch ${batchIndex + 1}/${resortBatches.length} (${resortBatch.length} resorts).`
      );
      const forecasts = await fetchForecastBatch(resortBatch);
      const batchInserts: ResortWeatherScoreInsert[] = [];

      for (const [index, resort] of resortBatch.entries()) {
        const forecast = forecasts[index];

        if (!forecast) {
          continue;
        }

        batchInserts.push(toSnapshotRow(resort, forecast, refreshDate));
      }

      if (batchInserts.length) {
        await db
          .insert(resortWeatherScores)
          .values(batchInserts)
          .onConflictDoNothing();

        for (const row of batchInserts) {
          processedResortIds.add(row.resortId);
        }
      }

      console.log(
        `Stored ${processedResortIds.size}/${resorts.length} resort weather rows for ${refreshDate}.`
      );

      if (batchIndex < resortBatches.length - 1) {
        await sleep(batchDelayMs);
      }
    }

    console.log(
      `Stored ${processedResortIds.size} resort weather scores for ${refreshDate}.`
    );
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  importResortWeatherScores().catch((error) => {
    console.error("Failed to import resort weather scores:", error);
    process.exit(1);
  });
}
