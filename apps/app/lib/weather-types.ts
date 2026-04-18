export type WeatherLocationInput = {
  location?: string;
  latitude?: number;
  longitude?: number;
};

export type ResolvedWeatherLocation = {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  timezone?: string;
};

export type SurfConditionsResponse = {
  kind: "surf";
  location: ResolvedWeatherLocation;
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
  units: Record<string, string>;
  source: "Open-Meteo Marine API and Forecast API";
};

export type SnowDay = {
  date: string;
  snowfall: number | null;
  temperatureMin: number | null;
  temperatureMax: number | null;
};

export type SnowConditionsResponse = {
  kind: "snow";
  location: ResolvedWeatherLocation;
  current: {
    time: string;
    temperature: number | null;
    snowfall: number | null;
    snowDepth: number | null;
    windSpeed: number | null;
    windDirection: number | null;
  };
  daily: SnowDay[];
  units: Record<string, string>;
  source: "Open-Meteo Forecast API";
};

export type WeatherErrorCode =
  | "VALIDATION_ERROR"
  | "LOCATION_NOT_FOUND"
  | "PROVIDER_ERROR";

export type WeatherApiError = {
  error: {
    code: WeatherErrorCode;
    message: string;
  };
};
