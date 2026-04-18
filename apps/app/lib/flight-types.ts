export type TripType = "one-way" | "round-trip";

export interface FlightSearchInput {
  adults: number;
  currency: string;
  departureDate: string;
  destination: string;
  origin: string;
  returnDate?: string;
  tripType: TripType;
}

export interface FlightResult {
  arrival: string;
  arrivalTimeAhead: string;
  delay: string | null;
  departure: string;
  duration: string;
  isBest: boolean;
  name: string;
  price: string;
  rank: number;
  stops: number | "Unknown";
}

export interface FlightSearchResponse {
  flights: FlightResult[];
  priceTrend: "low" | "typical" | "high" | null;
  query: FlightSearchInput & {
    cabin: "economy";
  };
}

export type FlightErrorCode =
  | "VALIDATION_ERROR"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "PYTHON_UNAVAILABLE";

export interface FlightSearchError {
  error: {
    code: FlightErrorCode;
    message: string;
  };
}

export type FlightApiResponse = FlightSearchResponse | FlightSearchError;
