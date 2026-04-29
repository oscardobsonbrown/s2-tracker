import "server-only";

import {
  BALANCED_RANKING_WEIGHTS,
  normalizeRankingWeights,
  type RankedResortRow,
} from "@repo/database";
import { logger } from "@repo/observability/logger.server";
import type { FlightResult } from "@/lib/flight-types";
import { FlightProviderError, searchFlights } from "@/lib/search-flights";
import {
  loadAirportLinksForResorts,
  loadRankedSnapshot,
} from "@/lib/travel-data";
import type {
  RankingPreviewResponse,
  TravelRecommendationAirport,
  TravelRecommendationsRequest,
  TravelRecommendationsResponse,
} from "@/lib/travel-types";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IATA_PATTERN = /^[A-Z]{3}$/;
const travelRecommendationsLogger = logger.child({
  app: "app",
  feature: "travel-recommendations",
});
const BOOKABLE_RECOMMENDATION_LIMIT = 10;
const RECOMMENDATION_SCAN_BATCH_SIZE = 10;
const MAX_RECOMMENDATION_SCAN_COUNT = 100;
const ALLOWED_CABINS = new Set([
  "economy",
  "premium-economy",
  "business",
  "first",
] as const);

type AllowedCabin = "economy" | "premium-economy" | "business" | "first";
type RankingWeightKey =
  | "elevation"
  | "snowfall14"
  | "snowfall7"
  | "snowDepth"
  | "temperature"
  | "wind";

interface RankingPreviewInput {
  country?: string;
  downhillOnly?: boolean;
  minimumScore?: number;
  pageIndex: number;
  pageSize: 25 | 50 | 100;
  query?: string;
  snapshotDate?: string;
  sortColumn:
    | "rank"
    | "score"
    | "name"
    | "country"
    | "snowfall7Cm"
    | "snowfall14Cm"
    | "snowDepthCm"
    | "avgTempC"
    | "avgWindKmh"
    | "maxElevationM";
  sortDirection: "asc" | "desc";
  weights: {
    elevation: number;
    snowfall14: number;
    snowfall7: number;
    snowDepth: number;
    temperature: number;
    wind: number;
  };
}

const RANKING_WEIGHT_KEYS: RankingWeightKey[] = [
  "elevation",
  "snowfall14",
  "snowfall7",
  "snowDepth",
  "temperature",
  "wind",
];
const RANKING_SORT_COLUMNS = new Set<RankingPreviewInput["sortColumn"]>([
  "rank",
  "score",
  "name",
  "country",
  "snowfall7Cm",
  "snowfall14Cm",
  "snowDepthCm",
  "avgTempC",
  "avgWindKmh",
  "maxElevationM",
]);

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(
  body: Record<string, unknown>,
  field: string,
  fallback = ""
) {
  const value = body[field];

  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeCabin(value: string): AllowedCabin | null {
  if (ALLOWED_CABINS.has(value as AllowedCabin)) {
    return value as AllowedCabin;
  }

  return null;
}

function readOptionalString(body: Record<string, unknown>, field: string) {
  const value = body[field];

  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function readOptionalFiniteNumber(
  body: Record<string, unknown>,
  field: string
) {
  const value = body[field];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readRankingWeights(value: unknown) {
  const record = asRecord(value);

  if (!record) {
    return null;
  }

  const weights = {} as RankingPreviewInput["weights"];

  for (const key of RANKING_WEIGHT_KEYS) {
    const weight = record[key];

    if (typeof weight !== "number" || !Number.isFinite(weight) || weight < 0) {
      return null;
    }

    weights[key] = weight;
  }

  return weights;
}

function normalizeSortColumn(
  value: unknown
): RankingPreviewInput["sortColumn"] {
  return typeof value === "string" &&
    RANKING_SORT_COLUMNS.has(value as RankingPreviewInput["sortColumn"])
    ? (value as RankingPreviewInput["sortColumn"])
    : "rank";
}

function normalizeSortDirection(
  value: unknown
): RankingPreviewInput["sortDirection"] {
  return value === "desc" ? "desc" : "asc";
}

function validateRecommendationDates(input: {
  departureDate: string;
  returnDate?: string;
  tripType: "one-way" | "round-trip";
}) {
  if (!isValidDate(input.departureDate)) {
    return "Departure date must be a valid YYYY-MM-DD date.";
  }

  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const latestAllowedDate = new Date();
  latestAllowedDate.setUTCDate(latestAllowedDate.getUTCDate() + 14);
  const latestAllowed = latestAllowedDate.toISOString().slice(0, 10);

  if (input.departureDate < todayDate || input.departureDate > latestAllowed) {
    return "Departure date must be within the next 14 days.";
  }

  if (input.tripType !== "round-trip") {
    return null;
  }

  if (!(input.returnDate && isValidDate(input.returnDate))) {
    return "Return date is required for round trips.";
  }

  if (input.returnDate < input.departureDate) {
    return "Return date cannot be before departure date.";
  }

  return null;
}

function getRankingSortValue(
  row: RankedResortRow,
  column: RankingPreviewInput["sortColumn"]
) {
  switch (column) {
    case "name":
      return row.name;
    case "country":
      return row.country ?? "";
    case "score":
      return row.score;
    case "snowDepthCm":
      return row.snowDepthCm ?? 0;
    case "snowfall7Cm":
      return row.snowfall7Cm ?? 0;
    case "snowfall14Cm":
      return row.snowfall14Cm ?? 0;
    case "avgTempC":
      return row.avgTempC ?? 0;
    case "avgWindKmh":
      return row.avgWindKmh ?? 0;
    case "maxElevationM":
      return row.maxElevationM ?? 0;
    default:
      return row.rank;
  }
}

function compareRankingRows(
  left: RankedResortRow,
  right: RankedResortRow,
  input: Pick<RankingPreviewInput, "sortColumn" | "sortDirection">
) {
  const direction = input.sortDirection === "asc" ? 1 : -1;
  const leftValue = getRankingSortValue(left, input.sortColumn);
  const rightValue = getRankingSortValue(right, input.sortColumn);

  if (typeof leftValue === "string" && typeof rightValue === "string") {
    return leftValue.localeCompare(rightValue) * direction;
  }

  return (Number(leftValue) - Number(rightValue)) * direction;
}

export function validateRecommendationsRequest(
  body: unknown
): TravelRecommendationsRequest | string {
  const record = asRecord(body);

  if (!record) {
    return "Request body must be a JSON object.";
  }

  const originAirport = readString(record, "originAirport").toUpperCase();
  const tripType =
    record.tripType === "one-way" || record.tripType === "round-trip"
      ? record.tripType
      : null;
  const departureDate = readString(record, "departureDate");
  const returnDate = readString(record, "returnDate") || undefined;
  const presetRecord = asRecord(record.preset);
  const cabin = normalizeCabin(
    readString(presetRecord ?? {}, "cabin", "economy")
  );
  const maxStops =
    typeof presetRecord?.maxStops === "number" ? presetRecord.maxStops : 1;

  if (!tripType) {
    return "Trip type must be one-way or round-trip.";
  }

  if (!IATA_PATTERN.test(originAirport)) {
    return "Use a 3-letter home airport code like LAX or JFK.";
  }

  const datesError = validateRecommendationDates({
    departureDate,
    returnDate,
    tripType,
  });

  if (datesError) {
    return datesError;
  }

  if (!cabin) {
    return "Cabin must be economy, premium-economy, business, or first.";
  }

  if (maxStops !== 0 && maxStops !== 1 && maxStops !== 2) {
    return "Maximum stops must be 0, 1, or 2.";
  }

  return {
    departureDate,
    originAirport,
    preset: {
      cabin,
      maxStops,
    },
    returnDate: tripType === "round-trip" ? returnDate : undefined,
    tripType,
  };
}

export function validateRankingPreviewRequest(
  body: unknown
): RankingPreviewInput | string {
  const record = asRecord(body);

  if (!record) {
    return "Request body must be a JSON object.";
  }

  const weights = readRankingWeights(record.weights);

  if (!weights) {
    return "Weights must include non-negative numeric elevation, snowfall14, snowfall7, snowDepth, temperature, and wind values.";
  }

  const filtersRecord = asRecord(record.filters) ?? {};
  const paginationRecord = asRecord(record.pagination) ?? {};
  const sortRecord = asRecord(record.sort) ?? {};
  const pageIndex =
    readOptionalFiniteNumber(paginationRecord, "pageIndex") ?? 0;
  const pageSize = paginationRecord.pageSize;

  return {
    country: readOptionalString(filtersRecord, "country"),
    downhillOnly:
      typeof filtersRecord.downhillOnly === "boolean"
        ? filtersRecord.downhillOnly
        : undefined,
    minimumScore: readOptionalFiniteNumber(filtersRecord, "minimumScore"),
    pageIndex: Math.max(0, Math.floor(pageIndex)),
    pageSize: pageSize === 25 || pageSize === 100 ? pageSize : 50,
    query: readOptionalString(filtersRecord, "query"),
    snapshotDate: readOptionalString(record, "snapshotDate"),
    sortColumn: normalizeSortColumn(sortRecord.column),
    sortDirection: normalizeSortDirection(sortRecord.direction),
    weights,
  };
}

function chooseFlights(
  flights: Array<{
    airport: TravelRecommendationAirport;
    flight: FlightResult;
  }>,
  maxStops: 0 | 1 | 2
) {
  const matchingFlight = flights.find(
    ({ flight }) => flight.stops !== "Unknown" && flight.stops <= maxStops
  );
  const fallbackFlight = flights[0];

  if (matchingFlight) {
    return {
      airportUsed: matchingFlight.airport,
      fallbackFlight:
        fallbackFlight?.flight === matchingFlight.flight
          ? null
          : (fallbackFlight?.flight ?? null),
      matchingFlight: matchingFlight.flight,
      status: "preset-match" as const,
    };
  }

  if (fallbackFlight) {
    return {
      airportUsed: fallbackFlight.airport,
      fallbackFlight: fallbackFlight.flight,
      matchingFlight: null,
      status: "fallback-only" as const,
    };
  }

  return {
    airportUsed: null,
    fallbackFlight: null,
    matchingFlight: null,
    status: "no-flight" as const,
  };
}

async function searchFlightsForAirportOptions(
  request: TravelRecommendationsRequest,
  airportOptions: TravelRecommendationAirport[]
) {
  const results: Array<{
    airport: TravelRecommendationAirport;
    flight: FlightResult;
  }> = [];

  for (const airport of airportOptions) {
    if (!airport.iataCode) {
      continue;
    }

    try {
      const response = await searchFlights({
        adults: 1,
        cabin: request.preset.cabin,
        currency: "USD",
        departureDate: request.departureDate,
        destination: airport.iataCode,
        origin: request.originAirport,
        returnDate: request.returnDate,
        tripType: request.tripType,
      });

      for (const flight of response.flights) {
        results.push({
          airport,
          flight,
        });
      }
    } catch (error) {
      if (
        error instanceof FlightProviderError &&
        (error.code === "NO_FLIGHTS_FOUND" || error.code === "PROVIDER_LOADING")
      ) {
        travelRecommendationsLogger.info(
          {
            airport: airport.iataCode,
            code: error.code,
            message: error.message,
          },
          "Flight search returned no usable itinerary for linked airport"
        );
        continue;
      }

      travelRecommendationsLogger.warn(
        {
          airport: airport.iataCode,
          err: error,
        },
        "Flight search failed for linked airport"
      );
      throw error;
    }
  }

  return results;
}

async function buildBookableRecommendation(
  row: RankedResortRow,
  rank: number,
  request: TravelRecommendationsRequest,
  airportOptions: TravelRecommendationAirport[]
) {
  if (!airportOptions.length) {
    return null;
  }

  const flights = await searchFlightsForAirportOptions(request, airportOptions);
  const selectedFlightSet = chooseFlights(flights, request.preset.maxStops);

  if (selectedFlightSet.status === "no-flight") {
    return null;
  }

  return {
    airportUsed: selectedFlightSet.airportUsed,
    flightMatch: {
      fallbackFlight: selectedFlightSet.fallbackFlight,
      matchingFlight: selectedFlightSet.matchingFlight,
      status: selectedFlightSet.status,
    },
    rank,
    resort: {
      country: row.country,
      id: row.resortId,
      locality: row.locality,
      maxElevationM: row.maxElevationM,
      name: row.name,
      region: row.region,
    },
    weather: {
      avgTempC: row.avgTempC,
      avgWindKmh: row.avgWindKmh,
      resortScore: row.score,
      scoreBreakdown: row.scoreBreakdown,
      snowDepthCm: row.snowDepthCm,
      snowfall14Cm: row.snowfall14Cm,
      snowfall7Cm: row.snowfall7Cm,
    },
  };
}

function toAirportOptions(
  links: ReturnType<typeof loadAirportLinksForResorts> extends Promise<
    Map<string, infer AirportLinks>
  >
    ? AirportLinks
    : never
): TravelRecommendationAirport[] {
  return links.map((link) => ({
    accessClass: link.accessClass,
    distanceKm: link.distanceKm,
    iataCode: link.iataCode,
    municipality: link.municipality,
    name: link.name,
  }));
}

export async function loadTravelRecommendations(
  request: TravelRecommendationsRequest
): Promise<TravelRecommendationsResponse | null> {
  const snapshot = await loadRankedSnapshot(
    normalizeRankingWeights(BALANCED_RANKING_WEIGHTS)
  );

  if (!snapshot) {
    return null;
  }

  const results: TravelRecommendationsResponse["results"] = [];
  const rowsToScan = snapshot.rankedRows.slice(
    0,
    MAX_RECOMMENDATION_SCAN_COUNT
  );

  for (
    let index = 0;
    index < rowsToScan.length && results.length < BOOKABLE_RECOMMENDATION_LIMIT;
    index += RECOMMENDATION_SCAN_BATCH_SIZE
  ) {
    const candidateRows = rowsToScan.slice(
      index,
      index + RECOMMENDATION_SCAN_BATCH_SIZE
    );
    const airportLinks = await loadAirportLinksForResorts(
      candidateRows.map((row) => row.resortId)
    );
    const candidateResults = await Promise.all(
      candidateRows.map((row) =>
        buildBookableRecommendation(
          row,
          results.length + 1,
          request,
          toAirportOptions(airportLinks.get(row.resortId) ?? [])
        )
      )
    );

    for (const candidateResult of candidateResults) {
      if (candidateResult && results.length < BOOKABLE_RECOMMENDATION_LIMIT) {
        results.push({
          ...candidateResult,
          rank: results.length + 1,
        });
      }
    }
  }

  if (results.length < BOOKABLE_RECOMMENDATION_LIMIT) {
    travelRecommendationsLogger.warn(
      {
        requestedCount: BOOKABLE_RECOMMENDATION_LIMIT,
        resultCount: results.length,
        scannedCount: rowsToScan.length,
      },
      "Travel recommendations could not find enough bookable ski trips"
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    rankingIsStale: snapshot.isStale,
    rankingRefreshDate: snapshot.snapshotDate,
    results,
  };
}

export async function loadRankingPreview(
  input: RankingPreviewInput
): Promise<RankingPreviewResponse | null> {
  const normalizedWeights = normalizeRankingWeights(input.weights);
  const snapshot = await loadRankedSnapshot(
    normalizedWeights,
    input.snapshotDate
  );

  if (!snapshot) {
    return null;
  }

  const filteredRows = snapshot.rankedRows.filter((row) => {
    if (input.downhillOnly !== false && row.hasDownhill === false) {
      return false;
    }

    if (
      input.query &&
      !`${row.name} ${row.region ?? ""} ${row.locality ?? ""}`
        .toLowerCase()
        .includes(input.query.toLowerCase())
    ) {
      return false;
    }

    if (
      input.country &&
      !(row.country ?? "").toLowerCase().includes(input.country.toLowerCase())
    ) {
      return false;
    }

    if (
      typeof input.minimumScore === "number" &&
      row.score < input.minimumScore
    ) {
      return false;
    }

    return true;
  });

  const sortedRows = [...filteredRows].sort((left, right) =>
    compareRankingRows(left, right, input)
  );

  const pageStart = input.pageIndex * input.pageSize;
  const pageRows = sortedRows.slice(pageStart, pageStart + input.pageSize);

  return {
    isStale: snapshot.isStale,
    normalizedWeights,
    rows: pageRows.map((row) => ({
      rank: row.rank,
      resort: {
        country: row.country,
        id: row.resortId,
        locality: row.locality,
        name: row.name,
        region: row.region,
      },
      score: row.score,
      scoreBreakdown: row.scoreBreakdown,
      metrics: {
        avgTempC: row.avgTempC,
        avgWindKmh: row.avgWindKmh,
        maxElevationM: row.maxElevationM,
        snowDepthCm: row.snowDepthCm,
        snowfall14Cm: row.snowfall14Cm,
        snowfall7Cm: row.snowfall7Cm,
      },
    })),
    snapshotDate: snapshot.snapshotDate,
    totalRows: filteredRows.length,
  };
}
