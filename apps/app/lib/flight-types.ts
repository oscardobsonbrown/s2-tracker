export type TripType = "one-way" | "round-trip";
export type FlightCabin = "economy" | "premium-economy" | "business" | "first";

export interface FlightSearchInput {
  adults: number;
  cabin: FlightCabin;
  currency: string;
  departureDate: string;
  destination: string;
  origin: string;
  returnDate?: string;
  tripType: TripType;
}

export interface FlightResult {
  airlines: string[];
  arrival: string;
  arrivalTimeAhead: string;
  bookingUrl: string;
  delay: string | null;
  departure: string;
  duration: string;
  isBest: boolean;
  name: string;
  price: string;
  rank: number;
  stopSummary: string;
  stops: number | "Unknown";
}

export interface FlightSearchResponse {
  flights: FlightResult[];
  priceTrend: "low" | "typical" | "high" | null;
  query: FlightSearchInput;
}

export type FlightErrorCode =
  | "VALIDATION_ERROR"
  | "PROVIDER_ERROR"
  | "PROVIDER_LOADING"
  | "NO_FLIGHTS_FOUND"
  | "TIMEOUT"
  | "PYTHON_UNAVAILABLE";

export interface FlightSearchError {
  error: {
    code: FlightErrorCode;
    message: string;
  };
}

export type FlightApiResponse = FlightSearchResponse | FlightSearchError;
