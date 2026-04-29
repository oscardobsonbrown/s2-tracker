import "server-only";

import {
  airports,
  BALANCED_RANKING_WEIGHTS,
  database,
  desc,
  eq,
  inArray,
  type NormalizedRankingWeights,
  type RankedResortRow,
  type ResortRankingFeatures,
  rankResortRows,
  resortAirportLinks,
  resortWeatherScores,
  skiResorts,
} from "@repo/database";
import { logger } from "@repo/observability/logger.server";

const travelDataLogger = logger.child({
  app: "app",
  feature: "travel-data",
});

const SNAPSHOT_STALE_MS = 1000 * 60 * 60 * 24;

export interface LoadedSnapshot {
  isStale: boolean;
  rankedRows: RankedResortRow[];
  snapshotDate: string;
}

export interface LinkedAirportOption {
  accessClass: "A" | "B" | "C";
  airportId: string;
  distanceKm: number;
  iataCode: string | null;
  municipality: string | null;
  name: string;
  priorityRank: number;
}

function isSnapshotStale(snapshotDate: string) {
  const timestamp = Date.parse(`${snapshotDate}T00:00:00Z`);

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > SNAPSHOT_STALE_MS;
}

export async function loadLatestSnapshotDate() {
  const rows = await database
    .select({ refreshDate: resortWeatherScores.refreshDate })
    .from(resortWeatherScores)
    .orderBy(desc(resortWeatherScores.refreshDate))
    .limit(1);

  return rows[0]?.refreshDate ?? null;
}

export async function loadRankedSnapshot(
  weights: NormalizedRankingWeights = BALANCED_RANKING_WEIGHTS,
  snapshotDate?: string
): Promise<LoadedSnapshot | null> {
  const resolvedSnapshotDate = snapshotDate ?? (await loadLatestSnapshotDate());

  if (!resolvedSnapshotDate) {
    return null;
  }

  const rows = await database
    .select({
      avgTempC: resortWeatherScores.avgTempC,
      avgWindKmh: resortWeatherScores.avgWindKmh,
      country: skiResorts.country,
      hasDownhill: skiResorts.hasDownhill,
      locality: skiResorts.locality,
      maxElevationM: resortWeatherScores.maxElevationM,
      name: skiResorts.name,
      region: skiResorts.region,
      resortId: skiResorts.id,
      snowDepthCm: resortWeatherScores.snowDepthCm,
      snowfall14Cm: resortWeatherScores.snowfall14Cm,
      snowfall7Cm: resortWeatherScores.snowfall7Cm,
    })
    .from(resortWeatherScores)
    .innerJoin(skiResorts, eq(resortWeatherScores.resortId, skiResorts.id))
    .where(eq(resortWeatherScores.refreshDate, resolvedSnapshotDate));

  travelDataLogger.info(
    {
      rowCount: rows.length,
      snapshotDate: resolvedSnapshotDate,
    },
    "Loaded travel weather snapshot"
  );

  return {
    isStale: isSnapshotStale(resolvedSnapshotDate),
    rankedRows: rankResortRows(rows satisfies ResortRankingFeatures[], weights),
    snapshotDate: resolvedSnapshotDate,
  };
}

export async function loadAirportLinksForResorts(resortIds: string[]) {
  if (!resortIds.length) {
    return new Map<string, LinkedAirportOption[]>();
  }

  const rows = await database
    .select({
      accessClass: resortAirportLinks.accessClass,
      airportId: airports.id,
      distanceKm: resortAirportLinks.distanceKm,
      iataCode: airports.iataCode,
      municipality: airports.municipality,
      name: airports.name,
      priorityRank: resortAirportLinks.priorityRank,
      resortId: resortAirportLinks.resortId,
    })
    .from(resortAirportLinks)
    .innerJoin(airports, eq(resortAirportLinks.airportId, airports.id))
    .where(inArray(resortAirportLinks.resortId, resortIds))
    .orderBy(
      resortAirportLinks.resortId,
      resortAirportLinks.priorityRank,
      resortAirportLinks.distanceKm
    );

  return rows.reduce<Map<string, LinkedAirportOption[]>>((result, row) => {
    const links = result.get(row.resortId) ?? [];
    links.push({
      accessClass: row.accessClass as "A" | "B" | "C",
      airportId: row.airportId,
      distanceKm: Number(row.distanceKm.toFixed(1)),
      iataCode: row.iataCode,
      municipality: row.municipality,
      name: row.name,
      priorityRank: row.priorityRank,
    });
    result.set(row.resortId, links);
    return result;
  }, new Map<string, LinkedAirportOption[]>());
}
