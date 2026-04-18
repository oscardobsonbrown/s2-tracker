import { logger } from "@repo/observability/logger.server";
import type {
  FlightErrorCode,
  FlightSearchError,
  FlightSearchResponse,
} from "@/lib/flight-types";
import { validateFlightPayload } from "@/lib/flight-validation";
import { FlightProviderError, searchFlights } from "@/lib/search-flights";

export const runtime = "nodejs";

const routeLogger = logger.child({
  app: "app",
  route: "/api/flights",
});

function errorResponse(code: FlightErrorCode, message: string, status = 400) {
  return Response.json(
    { error: { code, message } } satisfies FlightSearchError,
    { status }
  );
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  let body: unknown;

  routeLogger.info(
    {
      method: request.method,
      userAgent: request.headers.get("user-agent"),
    },
    "Flight search request received"
  );

  try {
    body = await request.json();
  } catch {
    routeLogger.warn("Flight search request body was not valid JSON");
    return errorResponse(
      "VALIDATION_ERROR",
      "Request body must be valid JSON."
    );
  }

  const validation = validateFlightPayload(body);

  if (validation.ok === false) {
    routeLogger.warn(
      {
        reason: validation.message,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Flight search validation failed"
    );
    return errorResponse("VALIDATION_ERROR", validation.message);
  }

  routeLogger.info(
    {
      tripType: validation.data.tripType,
      origin: validation.data.origin,
      destination: validation.data.destination,
      adults: validation.data.adults,
      currency: validation.data.currency,
    },
    "Flight search validation passed"
  );

  try {
    const data = await searchFlights(validation.data);
    const response = {
      query: {
        ...validation.data,
        cabin: "economy",
      },
      priceTrend: data.priceTrend,
      flights: data.flights,
    } satisfies FlightSearchResponse;

    routeLogger.info(
      {
        resultCount: response.flights.length,
        priceTrend: response.priceTrend,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Flight search request completed"
    );

    return Response.json(response);
  } catch (error) {
    if (error instanceof FlightProviderError) {
      const status = error.code === "TIMEOUT" ? 504 : 502;

      routeLogger.warn(
        {
          code: error.code,
          message: error.message,
          status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Flight provider error mapped to API response"
      );
      return errorResponse(error.code, error.message, status);
    }

    routeLogger.error(
      {
        err: error,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Unexpected flight search failure"
    );
    return errorResponse(
      "PROVIDER_ERROR",
      "Flight search failed. Try again in a moment.",
      502
    );
  }
}
