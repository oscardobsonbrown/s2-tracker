import { logger } from "@repo/observability/logger.server";
import { getSnowConditions, WeatherProviderError } from "@/lib/weather";
import type { WeatherApiError, WeatherErrorCode } from "@/lib/weather-types";

export const runtime = "nodejs";

const routeLogger = logger.child({
  app: "app",
  route: "/api/weather/snow",
});

function errorResponse(code: WeatherErrorCode, message: string, status = 400) {
  return Response.json({ error: { code, message } } satisfies WeatherApiError, {
    status,
  });
}

function parseCoordinate(value: string | null, label: string) {
  if (!value) {
    return;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new WeatherProviderError(
      "VALIDATION_ERROR",
      `${label} must be a number.`
    );
  }

  return parsed;
}

export async function GET(request: Request) {
  const startedAt = performance.now();
  const searchParams = new URL(request.url).searchParams;

  routeLogger.info(
    {
      method: request.method,
      hasLocation: searchParams.has("location"),
      hasLatitude: searchParams.has("latitude"),
      hasLongitude: searchParams.has("longitude"),
    },
    "Snow weather request received"
  );

  try {
    const latitude = parseCoordinate(searchParams.get("latitude"), "Latitude");
    const longitude = parseCoordinate(
      searchParams.get("longitude"),
      "Longitude"
    );

    if (
      (latitude === undefined && longitude !== undefined) ||
      (latitude !== undefined && longitude === undefined)
    ) {
      routeLogger.warn("Snow weather request had incomplete coordinates");
      return errorResponse(
        "VALIDATION_ERROR",
        "Provide both latitude and longitude, or use a location name."
      );
    }

    const data = await getSnowConditions({
      location: searchParams.get("location") ?? undefined,
      latitude,
      longitude,
    });

    routeLogger.info(
      {
        location: data.location.name,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Snow weather request completed"
    );

    return Response.json(data);
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      const status = error.code === "VALIDATION_ERROR" ? 400 : 502;

      routeLogger.warn(
        {
          code: error.code,
          message: error.message,
          status,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Snow weather provider error mapped to API response"
      );
      return errorResponse(error.code, error.message, status);
    }

    routeLogger.error(
      {
        err: error,
        durationMs: Math.round(performance.now() - startedAt),
      },
      "Unexpected snow weather failure"
    );
    return errorResponse(
      "PROVIDER_ERROR",
      "Snow conditions could not be loaded.",
      502
    );
  }
}
