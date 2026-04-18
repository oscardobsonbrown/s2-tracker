export interface WeatherLocationInput {
  latitude?: number;
  location?: string;
  longitude?: number;
}

export interface ResolvedWeatherLocation {
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  name: string;
  timezone?: string;
}

export interface SurfConditionsResponse {
  current: {
    time: string;
    waveHeight: number | null;
    waveDirection: number | null;
    wavePeriod: number | null;
    swellHeight: number | null;
    swellDirection: number | null;
    swellPeriod: number | null;
    windWaveHeight: number | null;
    windWaveDirection: number | null;
    windWavePeriod: number | null;
    tideHeight: number | null;
    seaSurfaceTemperature: number | null;
    oceanCurrentVelocity: number | null;
    oceanCurrentDirection: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    windGusts: number | null;
  };
  kind: "surf";
  location: ResolvedWeatherLocation;
  source: "Open-Meteo Marine API and Forecast API";
  units: Record<string, string>;
}

export interface SnowDay {
  date: string;
  snowfall: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
}

export interface SnowConditionsResponse {
  current: {
    time: string;
    temperature: number | null;
    snowfall: number | null;
    snowDepth: number | null;
    windSpeed: number | null;
    windDirection: number | null;
  };
  daily: SnowDay[];
  kind: "snow";
  location: ResolvedWeatherLocation;
  source: "Open-Meteo Forecast API";
  units: Record<string, string>;
}

export type WeatherErrorCode =
  | "VALIDATION_ERROR"
  | "LOCATION_NOT_FOUND"
  | "PROVIDER_ERROR";

export interface WeatherApiError {
  error: {
    code: WeatherErrorCode;
    message: string;
  };
}
