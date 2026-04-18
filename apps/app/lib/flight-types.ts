export type TripType = "one-way" | "round-trip";

export type FlightSearchInput = {
  tripType: TripType;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
};

export type FlightResult = {
  rank: number;
  isBest: boolean;
  name: string;
  departure: string;
  arrival: string;
  arrivalTimeAhead: string;
  duration: string;
  stops: number | "Unknown";
  delay: string | null;
  price: string;
};

export type FlightSearchResponse = {
  query: FlightSearchInput & {
    cabin: "economy";
  };
  priceTrend: "low" | "typical" | "high" | null;
  flights: FlightResult[];
};

export type FlightErrorCode =
  | "VALIDATION_ERROR"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "PYTHON_UNAVAILABLE";

export type FlightSearchError = {
  error: {
    code: FlightErrorCode;
    message: string;
  };
};

export type FlightApiResponse = FlightSearchResponse | FlightSearchError;
