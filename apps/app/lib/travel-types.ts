import type { FlightCabin, FlightResult, TripType } from "@/lib/flight-types";

export interface RankingWeightsInput {
  elevation: number;
  snowDepth: number;
  snowfall7: number;
  snowfall14: number;
  temperature: number;
  wind: number;
}

export interface NormalizedRankingWeights extends RankingWeightsInput {}

export interface RankingPreviewFilters {
  country?: string;
  downhillOnly?: boolean;
  minimumScore?: number;
  query?: string;
}

export type RankingSortColumn =
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

export interface RankingPreviewSort {
  column: RankingSortColumn;
  direction: "asc" | "desc";
}

export interface RankingPreviewRow {
  metrics: {
    avgTempC: number | null;
    avgWindKmh: number | null;
    maxElevationM: number | null;
    snowDepthCm: number | null;
    snowfall14Cm: number | null;
    snowfall7Cm: number | null;
  };
  rank: number;
  resort: {
    country: string | null;
    id: string;
    locality: string | null;
    name: string;
    region: string | null;
  };
  score: number;
  scoreBreakdown: {
    elevation: number;
    snowfall14: number;
    snowfall7: number;
    snowDepth: number;
    temperature: number;
    wind: number;
  };
}

export interface RankingPreviewRequest {
  filters?: RankingPreviewFilters;
  pagination?: {
    pageIndex: number;
    pageSize: 25 | 50 | 100;
  };
  snapshotDate?: string;
  sort?: RankingPreviewSort;
  weights: RankingWeightsInput;
}

export interface RankingPreviewResponse {
  isStale: boolean;
  normalizedWeights: NormalizedRankingWeights;
  rows: RankingPreviewRow[];
  snapshotDate: string;
  totalRows: number;
}

export interface TravelRecommendationsRequest {
  departureDate: string;
  originAirport: string;
  preset: {
    cabin: FlightCabin;
    maxStops: 0 | 1 | 2;
  };
  returnDate?: string;
  tripType: TripType;
}

export interface TravelRecommendationAirport {
  accessClass: "A" | "B" | "C";
  distanceKm: number;
  iataCode: string | null;
  municipality: string | null;
  name: string;
}

export interface TravelRecommendationResult {
  airportUsed: TravelRecommendationAirport | null;
  flightMatch: {
    fallbackFlight: FlightResult | null;
    matchingFlight: FlightResult | null;
    status: "preset-match" | "fallback-only" | "no-flight";
  };
  rank: number;
  resort: {
    country: string | null;
    id: string;
    locality: string | null;
    maxElevationM: number | null;
    name: string;
    region: string | null;
  };
  weather: {
    avgTempC: number | null;
    avgWindKmh: number | null;
    resortScore: number;
    scoreBreakdown: RankingPreviewRow["scoreBreakdown"];
    snowDepthCm: number | null;
    snowfall14Cm: number | null;
    snowfall7Cm: number | null;
  };
}

export interface TravelRecommendationsResponse {
  generatedAt: string;
  rankingIsStale: boolean;
  rankingRefreshDate: string;
  results: TravelRecommendationResult[];
}

export interface TravelApiError {
  error: {
    code:
      | "NO_SNAPSHOT"
      | "VALIDATION_ERROR"
      | "PROVIDER_ERROR"
      | "LOCATION_ERROR";
    message: string;
  };
}
