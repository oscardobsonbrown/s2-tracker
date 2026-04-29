import { logger } from "@repo/observability/logger.server";
import { FlightProviderError } from "@/lib/search-flights";
import {
  loadTravelRecommendations,
  validateRecommendationsRequest,
} from "@/lib/travel-recommendations";
import type { TravelApiError } from "@/lib/travel-types";

export const runtime = "nodejs";

const routeLogger = logger.child({
  app: "app",
  route: "/api/travel/recommendations",
});

function errorResponse(
  code: TravelApiError["error"]["code"],
  message: string,
  status = 400
) {
  return Response.json({ error: { code, message } } satisfies TravelApiError, {
    status,
  });
}

function flightProviderStatus(error: FlightProviderError) {
  return error.code === "TIMEOUT" ? 504 : 502;
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "VALIDATION_ERROR",
      "Request body must be valid JSON."
    );
  }

  const validation = validateRecommendationsRequest(body);

  if (typeof validation === "string") {
    routeLogger.warn(
      {
        durationMs: Math.round(performance.now() - startedAt),
        reason: validation,
      },
      "Travel recommendations validation failed"
    );
    return errorResponse("VALIDATION_ERROR", validation);
  }

  let recommendations: Awaited<ReturnType<typeof loadTravelRecommendations>>;

  try {
    recommendations = await loadTravelRecommendations(validation);
  } catch (error) {
    if (error instanceof FlightProviderError) {
      routeLogger.warn(
        {
          code: error.code,
          durationMs: Math.round(performance.now() - startedAt),
          message: error.message,
        },
        "Travel recommendations flight provider failed"
      );
      return errorResponse(
        "PROVIDER_ERROR",
        error.message,
        flightProviderStatus(error)
      );
    }

    routeLogger.error(
      {
        durationMs: Math.round(performance.now() - startedAt),
        err: error,
      },
      "Travel recommendations failed unexpectedly"
    );
    return errorResponse(
      "PROVIDER_ERROR",
      "Travel recommendations failed. Try again in a moment.",
      502
    );
  }

  if (!recommendations) {
    return errorResponse(
      "NO_SNAPSHOT",
      "No cached resort weather snapshot is available yet.",
      503
    );
  }

  routeLogger.info(
    {
      durationMs: Math.round(performance.now() - startedAt),
      resultCount: recommendations.results.length,
    },
    "Travel recommendations loaded"
  );

  return Response.json(recommendations);
}
