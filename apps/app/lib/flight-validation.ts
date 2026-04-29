import type {
  FlightCabin,
  FlightSearchInput,
  TripType,
} from "@/lib/flight-types";

type ValidationResult =
  | { ok: true; data: FlightSearchInput }
  | { ok: false; message: string };

const IATA_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const ALLOWED_CABINS = new Set<FlightCabin>([
  "economy",
  "premium-economy",
  "business",
  "first",
]);

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

function normalizeTripType(value: string): TripType | null {
  if (value === "one-way" || value === "round-trip") {
    return value;
  }

  return null;
}

function normalizeCabin(value: string): FlightCabin | null {
  if (ALLOWED_CABINS.has(value as FlightCabin)) {
    return value as FlightCabin;
  }

  return null;
}

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function parseAdults(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return Number(value);
  }

  return 1;
}

function validateAirportPair(origin: string, destination: string) {
  if (!(IATA_PATTERN.test(origin) && IATA_PATTERN.test(destination))) {
    return "Use 3-letter airport codes like JFK or LAX.";
  }

  if (origin === destination) {
    return "Origin and destination must be different.";
  }

  return null;
}

function validateTripDates(input: {
  departureDate: string;
  returnDate: string;
  tripType: TripType;
}) {
  if (!isValidDate(input.departureDate)) {
    return "Departure date must be a valid YYYY-MM-DD date.";
  }

  if (input.tripType !== "round-trip") {
    return null;
  }

  if (!isValidDate(input.returnDate)) {
    return "Return date is required for round trips.";
  }

  if (input.returnDate < input.departureDate) {
    return "Return date cannot be before departure date.";
  }

  return null;
}

export function validateFlightPayload(body: unknown): ValidationResult {
  const record = asRecord(body);

  if (!record) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const tripType = normalizeTripType(readString(record, "tripType", "one-way"));
  const origin = readString(record, "origin").toUpperCase();
  const destination = readString(record, "destination").toUpperCase();
  const departureDate = readString(record, "departureDate");
  const rawReturnDate = readString(record, "returnDate");
  const cabin = normalizeCabin(readString(record, "cabin", "economy"));
  const currency = readString(record, "currency", "USD").toUpperCase();
  const adults = parseAdults(record.adults);

  if (!tripType) {
    return { ok: false, message: "Choose one-way or round-trip." };
  }

  const airportPairError = validateAirportPair(origin, destination);

  if (airportPairError) {
    return { ok: false, message: airportPairError };
  }

  const tripDatesError = validateTripDates({
    departureDate,
    returnDate: rawReturnDate,
    tripType,
  });

  if (tripDatesError) {
    return { ok: false, message: tripDatesError };
  }

  if (!Number.isInteger(adults) || adults < 1 || adults > 9) {
    return { ok: false, message: "Adults must be a whole number from 1 to 9." };
  }

  if (!cabin) {
    return {
      ok: false,
      message: "Cabin must be economy, premium-economy, business, or first.",
    };
  }

  if (!CURRENCY_PATTERN.test(currency)) {
    return { ok: false, message: "Currency must be a 3-letter code like USD." };
  }

  return {
    ok: true,
    data: {
      tripType,
      origin,
      destination,
      departureDate,
      returnDate: tripType === "round-trip" ? rawReturnDate : undefined,
      adults,
      cabin,
      currency,
    },
  };
}
