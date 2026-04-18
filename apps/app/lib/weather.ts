import "server-only";

import { logger } from "@repo/observability/logger.server";
import type {
  ResolvedWeatherLocation,
  SnowConditionsResponse,
  SurfConditionsResponse,
  WeatherErrorCode,
  WeatherLocationInput,
} from "@/lib/weather-types";

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
  error?: boolean;
  reason?: string;
};

type OpenMeteoSurfMarineResponse = {
  current_units?: Record<string, string>;
  current?: {
    time?: string;
    wave_height?: number | null;
    wave_direction?: number | null;
    wave_period?: number | null;
    swell_wave_height?: number | null;
    swell_wave_direction?: number | null;
    swell_wave_period?: number | null;
    wind_wave_height?: number | null;
    wind_wave_direction?: number | null;
    wind_wave_period?: number | null;
    sea_level_height_msl?: number | null;
    sea_surface_temperature?: number | null;
    ocean_current_velocity?: number | null;
    ocean_current_direction?: number | null;
  };
  error?: boolean;
  reason?: string;
};

type OpenMeteoForecastResponse = {
  current_units?: Record<string, string>;
  daily_units?: Record<string, string>;
  current?: {
    time?: string;
    temperature_2m?: number | null;
    snowfall?: number | null;
    snow_depth?: number | null;
    wind_speed_10m?: number | null;
    wind_direction_10m?: number | null;
    wind_gusts_10m?: number | null;
  };
  daily?: {
    time?: string[];
    snowfall_sum?: Array<number | null>;
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
  };
  error?: boolean;
  reason?: string;
};

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

const weatherLogger = logger.child({
  app: "app",
  feature: "weather",
});

export class WeatherProviderError extends Error {
  code: WeatherErrorCode;

  constructor(code: WeatherErrorCode, message: string) {
    super(message);
    this.name = "WeatherProviderError";
    this.code = code;
  }
}

function nullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function requireCurrent<T extends { current?: unknown }>(
  response: T,
  label: string
) {
  if (!response.current) {
    throw new WeatherProviderError(
      "PROVIDER_ERROR",
      `${label} did not return current conditions.`
    );
  }
}

function mergeUnits(...units: Array<Record<string, string> | undefined>) {
  return Object.assign({}, ...units.filter(Boolean));
}

function buildUrl(base: string, params: Record<string, string | number>) {
  const url = new URL(base);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  return url;
}

async function fetchJson<T>(url: URL): Promise<T> {
  const startedAt = performance.now();
  const endpoint = url.hostname;

  weatherLogger.debug(
    {
      endpoint,
      path: url.pathname,
      params: Object.fromEntries(url.searchParams.entries()),
    },
    "Fetching weather provider data"
  );

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "application/json",
    },
  });
  const body = (await response.json()) as T & {
    error?: boolean;
    reason?: string;
  };
  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok || body.error) {
    weatherLogger.warn(
      {
        endpoint,
        status: response.status,
        reason: body.reason,
        durationMs,
      },
      "Weather provider returned an error"
    );
    throw new WeatherProviderError(
      "PROVIDER_ERROR",
      body.reason ?? `Weather provider returned HTTP ${response.status}.`
    );
  }

  weatherLogger.info(
    {
      endpoint,
      status: response.status,
      durationMs,
    },
    "Weather provider data fetched"
  );

  return body;
}

export async function resolveWeatherLocation(
  input: WeatherLocationInput
): Promise<ResolvedWeatherLocation> {
  if (input.latitude !== undefined && input.longitude !== undefined) {
    weatherLogger.info(
      {
        latitude: input.latitude,
        longitude: input.longitude,
        hasLocationLabel: Boolean(input.location?.trim()),
      },
      "Using provided weather coordinates"
    );

    return {
      name: input.location?.trim() || "Custom coordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  const location = input.location?.trim();

  if (!location || location.length < 2) {
    throw new WeatherProviderError(
      "VALIDATION_ERROR",
      "Enter a location name or latitude and longitude."
    );
  }

  weatherLogger.info({ location }, "Resolving weather location");

  const response = await fetchJson<OpenMeteoGeocodingResponse>(
    buildUrl(GEOCODING_URL, {
      name: location,
      count: 1,
      language: "en",
      format: "json",
    })
  );
  const match = response.results?.[0];

  if (!match) {
    weatherLogger.warn({ location }, "Weather location was not found");
    throw new WeatherProviderError(
      "LOCATION_NOT_FOUND",
      `No location matched "${location}".`
    );
  }

  weatherLogger.info(
    {
      location,
      resolvedName: match.name,
      country: match.country,
      admin1: match.admin1,
      timezone: match.timezone,
    },
    "Weather location resolved"
  );

  return {
    name: match.name,
    latitude: match.latitude,
    longitude: match.longitude,
    country: match.country,
    admin1: match.admin1,
    timezone: match.timezone,
  };
}

export async function getSurfConditions(
  input: WeatherLocationInput
): Promise<SurfConditionsResponse> {
  const location = await resolveWeatherLocation(input);

  weatherLogger.info(
    {
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    "Loading surf conditions"
  );

  const [marine, forecast] = await Promise.all([
    fetchJson<OpenMeteoSurfMarineResponse>(
      buildUrl(MARINE_URL, {
        latitude: location.latitude,
        longitude: location.longitude,
        current: [
          "wave_height",
          "wave_direction",
          "wave_period",
          "swell_wave_height",
          "swell_wave_direction",
          "swell_wave_period",
          "wind_wave_height",
          "wind_wave_direction",
          "wind_wave_period",
          "sea_level_height_msl",
          "sea_surface_temperature",
          "ocean_current_velocity",
          "ocean_current_direction",
        ].join(","),
        timezone: "auto",
        forecast_days: 1,
      })
    ),
    fetchJson<OpenMeteoForecastResponse>(
      buildUrl(FORECAST_URL, {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "wind_speed_10m,wind_direction_10m,wind_gusts_10m",
        timezone: "auto",
        forecast_days: 1,
      })
    ),
  ]);

  requireCurrent(marine, "Marine API");
  requireCurrent(forecast, "Forecast API");

  const response = {
    kind: "surf",
    location,
    current: {
      time: marine.current?.time ?? forecast.current?.time ?? "",
      waveHeight: nullableNumber(marine.current?.wave_height),
      waveDirection: nullableNumber(marine.current?.wave_direction),
      wavePeriod: nullableNumber(marine.current?.wave_period),
      swellHeight: nullableNumber(marine.current?.swell_wave_height),
      swellDirection: nullableNumber(marine.current?.swell_wave_direction),
      swellPeriod: nullableNumber(marine.current?.swell_wave_period),
      windWaveHeight: nullableNumber(marine.current?.wind_wave_height),
      windWaveDirection: nullableNumber(marine.current?.wind_wave_direction),
      windWavePeriod: nullableNumber(marine.current?.wind_wave_period),
      tideHeight: nullableNumber(marine.current?.sea_level_height_msl),
      seaSurfaceTemperature: nullableNumber(
        marine.current?.sea_surface_temperature
      ),
      oceanCurrentVelocity: nullableNumber(
        marine.current?.ocean_current_velocity
      ),
      oceanCurrentDirection: nullableNumber(
        marine.current?.ocean_current_direction
      ),
      windSpeed: nullableNumber(forecast.current?.wind_speed_10m),
      windDirection: nullableNumber(forecast.current?.wind_direction_10m),
      windGusts: nullableNumber(forecast.current?.wind_gusts_10m),
    },
    units: mergeUnits(marine.current_units, forecast.current_units),
    source: "Open-Meteo Marine API and Forecast API",
  } satisfies SurfConditionsResponse;

  weatherLogger.info(
    {
      location: location.name,
      time: response.current.time,
      unitCount: Object.keys(response.units).length,
    },
    "Surf conditions normalized"
  );

  return response;
}

export async function getSnowConditions(
  input: WeatherLocationInput
): Promise<SnowConditionsResponse> {
  const location = await resolveWeatherLocation(input);

  weatherLogger.info(
    {
      location: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    "Loading snow conditions"
  );

  const forecast = await fetchJson<OpenMeteoForecastResponse>(
    buildUrl(FORECAST_URL, {
      latitude: location.latitude,
      longitude: location.longitude,
      current:
        "temperature_2m,snowfall,snow_depth,wind_speed_10m,wind_direction_10m",
      daily: "snowfall_sum,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: 5,
    })
  );

  requireCurrent(forecast, "Forecast API");

  const response = {
    kind: "snow",
    location,
    current: {
      time: forecast.current?.time ?? "",
      temperature: nullableNumber(forecast.current?.temperature_2m),
      snowfall: nullableNumber(forecast.current?.snowfall),
      snowDepth: nullableNumber(forecast.current?.snow_depth),
      windSpeed: nullableNumber(forecast.current?.wind_speed_10m),
      windDirection: nullableNumber(forecast.current?.wind_direction_10m),
    },
    daily: (forecast.daily?.time ?? []).map((date, index) => ({
      date,
      snowfall: nullableNumber(forecast.daily?.snowfall_sum?.[index]),
      temperatureMin: nullableNumber(
        forecast.daily?.temperature_2m_min?.[index]
      ),
      temperatureMax: nullableNumber(
        forecast.daily?.temperature_2m_max?.[index]
      ),
    })),
    units: mergeUnits(forecast.current_units, forecast.daily_units),
    source: "Open-Meteo Forecast API",
  } satisfies SnowConditionsResponse;

  weatherLogger.info(
    {
      location: location.name,
      time: response.current.time,
      days: response.daily.length,
      unitCount: Object.keys(response.units).length,
    },
    "Snow conditions normalized"
  );

  return response;
}
