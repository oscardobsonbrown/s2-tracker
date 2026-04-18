"use client";

import {
  Alert,
  AlertDescription,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { cn } from "@repo/design-system/lib/utils";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import type {
  FlightApiResponse,
  FlightSearchError,
  FlightSearchResponse,
  TripType,
} from "@/lib/flight-types";
import type {
  SnowConditionsResponse,
  SurfConditionsResponse,
  WeatherApiError,
} from "@/lib/weather-types";

type WeatherKind = "surf" | "snow";
type WeatherResponse = SurfConditionsResponse | SnowConditionsResponse;

const TODAY = new Date().toISOString().slice(0, 10);

function defaultReturnDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function isFlightErrorResponse(
  response: FlightApiResponse
): response is FlightSearchError {
  return "error" in response;
}

function isWeatherError(value: unknown): value is WeatherApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as WeatherApiError).error?.message === "string"
  );
}

function formatPrice(price: string) {
  if (!price || price === "0") {
    return "Price not listed";
  }

  return price.startsWith("$") ? price : `$${price}`;
}

function formatStops(stops: number | "Unknown") {
  if (stops === "Unknown") {
    return "Stops unknown";
  }

  if (stops === 0) {
    return "Nonstop";
  }

  return `${stops} ${stops === 1 ? "stop" : "stops"}`;
}

function formatValue(value: number | null, unit = "", digits = 1) {
  if (value === null) {
    return "Not available";
  }

  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function formatDirection(value: number | null) {
  if (value === null) {
    return "Not available";
  }

  return `${Math.round(value)} deg`;
}

function locationLabel(response: WeatherResponse) {
  const { location } = response;

  return [location.name, location.admin1, location.country]
    .filter(Boolean)
    .join(", ");
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2 font-medium text-sm">
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function Metric({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-h-24 gap-1 rounded-md border bg-muted/20 p-3">
      <span className="text-muted-foreground text-xs uppercase">{label}</span>
      <strong className="text-lg leading-tight">{value}</strong>
      {detail ? (
        <small className="text-muted-foreground">{detail}</small>
      ) : null}
    </div>
  );
}

export function TravelTools() {
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [origin, setOrigin] = useState("JFK");
  const [destination, setDestination] = useState("LAX");
  const [departureDate, setDepartureDate] = useState(TODAY);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [adults, setAdults] = useState(1);
  const [currency, setCurrency] = useState("USD");
  const [flightResult, setFlightResult] = useState<FlightSearchResponse | null>(
    null
  );
  const [flightError, setFlightError] = useState<string | null>(null);
  const [isFlightLoading, setIsFlightLoading] = useState(false);
  const [surfLocation, setSurfLocation] = useState("Margaret River");
  const [snowLocation, setSnowLocation] = useState("Niseko");
  const [surfResult, setSurfResult] = useState<SurfConditionsResponse | null>(
    null
  );
  const [snowResult, setSnowResult] = useState<SnowConditionsResponse | null>(
    null
  );
  const [surfError, setSurfError] = useState<string | null>(null);
  const [snowError, setSnowError] = useState<string | null>(null);
  const [loadingKind, setLoadingKind] = useState<WeatherKind | null>(null);

  const flightStatus = useMemo(() => {
    if (isFlightLoading) {
      return "Searching flights. Only the first 3 results will be shown.";
    }

    if (flightError) {
      return "Search failed.";
    }

    if (flightResult) {
      return `Showing ${flightResult.flights.length} result${
        flightResult.flights.length === 1 ? "" : "s"
      }.`;
    }

    return "No search has run yet.";
  }, [flightError, flightResult, isFlightLoading]);

  async function onFlightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isFlightLoading) {
      return;
    }

    setIsFlightLoading(true);
    setFlightError(null);
    setFlightResult(null);

    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tripType,
          origin,
          destination,
          departureDate,
          returnDate: tripType === "round-trip" ? returnDate : undefined,
          adults,
          currency,
        }),
      });
      const payload = (await response.json()) as FlightApiResponse;

      if (!response.ok || isFlightErrorResponse(payload)) {
        setFlightError(
          isFlightErrorResponse(payload)
            ? payload.error.message
            : "Flight search failed."
        );
        return;
      }

      setFlightResult(payload);
    } catch {
      setFlightError(
        "Flight search could not be reached. Check the app server."
      );
    } finally {
      setIsFlightLoading(false);
    }
  }

  async function loadConditions(kind: WeatherKind, location: string) {
    const params = new URLSearchParams({ location });
    const response = await fetch(`/api/weather/${kind}?${params.toString()}`);
    const payload = (await response.json()) as
      | WeatherResponse
      | WeatherApiError;

    if (!response.ok || isWeatherError(payload)) {
      throw new Error(
        isWeatherError(payload)
          ? payload.error.message
          : "Conditions could not be loaded."
      );
    }

    return payload;
  }

  async function onSurfSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loadingKind) {
      return;
    }

    setLoadingKind("surf");
    setSurfError(null);
    setSurfResult(null);

    try {
      const result = await loadConditions("surf", surfLocation);
      setSurfResult(result as SurfConditionsResponse);
    } catch (error) {
      setSurfError(
        error instanceof Error ? error.message : "Surf conditions failed."
      );
    } finally {
      setLoadingKind(null);
    }
  }

  async function onSnowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loadingKind) {
      return;
    }

    setLoadingKind("snow");
    setSnowError(null);
    setSnowResult(null);

    try {
      const result = await loadConditions("snow", snowLocation);
      setSnowResult(result as SnowConditionsResponse);
    } catch (error) {
      setSnowError(
        error instanceof Error ? error.message : "Snow conditions failed."
      );
    } finally {
      setLoadingKind(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-4 rounded-lg border bg-background p-4">
          <div className="grid gap-1">
            <p className="text-muted-foreground text-sm">
              Flights and forecasts
            </p>
            <h1 className="font-semibold text-2xl tracking-normal">
              Plan the next leg.
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm">
              Searches run only after submission. Flight results come through
              the Python bridge, while surf and snow conditions stay server-side
              through Open-Meteo.
            </p>
          </div>
        </div>
        <div
          aria-label="Aircraft wing over a coastline"
          className="hidden h-full min-h-40 rounded-lg bg-center bg-cover lg:block"
          role="img"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=720&q=80)",
          }}
        />
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl">Flight search</h2>
            <p className="text-muted-foreground text-sm">{flightStatus}</p>
          </div>
          {flightResult?.priceTrend ? (
            <Badge variant="secondary">
              Price trend: {flightResult.priceTrend}
            </Badge>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={onFlightSubmit}>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Trip type</legend>
            {(["one-way", "round-trip"] as const).map((type) => (
              <button
                aria-pressed={tripType === type}
                className={cn(
                  "rounded-md border px-3 py-2 font-medium text-sm",
                  tripType === type
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
                key={type}
                onClick={() => setTripType(type)}
                type="button"
              >
                {type === "one-way" ? "One-way" : "Round-trip"}
              </button>
            ))}
          </fieldset>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Field id="flight-origin" label="Origin">
              <Input
                autoComplete="off"
                id="flight-origin"
                inputMode="text"
                maxLength={3}
                onChange={(event) =>
                  setOrigin(event.target.value.toUpperCase())
                }
                pattern="[A-Za-z]{3}"
                required
                value={origin}
              />
            </Field>
            <Field id="flight-destination" label="Destination">
              <Input
                autoComplete="off"
                id="flight-destination"
                inputMode="text"
                maxLength={3}
                onChange={(event) =>
                  setDestination(event.target.value.toUpperCase())
                }
                pattern="[A-Za-z]{3}"
                required
                value={destination}
              />
            </Field>
            <Field id="flight-departure-date" label="Depart date">
              <Input
                id="flight-departure-date"
                onChange={(event) => setDepartureDate(event.target.value)}
                required
                type="date"
                value={departureDate}
              />
            </Field>
            <Field id="flight-return-date" label="Return date">
              <Input
                disabled={tripType === "one-way"}
                id="flight-return-date"
                min={departureDate}
                onChange={(event) => setReturnDate(event.target.value)}
                required={tripType === "round-trip"}
                type="date"
                value={returnDate}
              />
            </Field>
            <Field id="flight-adults" label="Adults">
              <Input
                id="flight-adults"
                max={9}
                min={1}
                onChange={(event) => setAdults(Number(event.target.value))}
                required
                type="number"
                value={adults}
              />
            </Field>
            <Field id="flight-currency" label="Currency">
              <Input
                autoComplete="off"
                id="flight-currency"
                inputMode="text"
                maxLength={3}
                onChange={(event) =>
                  setCurrency(event.target.value.toUpperCase())
                }
                pattern="[A-Za-z]{3}"
                required
                value={currency}
              />
            </Field>
          </div>

          <Button className="w-fit" disabled={isFlightLoading} type="submit">
            {isFlightLoading ? "Searching..." : "Search flights"}
          </Button>
        </form>

        {flightError ? (
          <Alert variant="destructive">
            <AlertDescription>{flightError}</AlertDescription>
          </Alert>
        ) : null}

        {isFlightLoading ? (
          <output className="grid gap-2">
            {[1, 2, 3].map((row) => (
              <div
                className="min-h-16 rounded-md border bg-muted/20 p-4 text-muted-foreground text-sm"
                key={row}
              >
                Loading result row...
              </div>
            ))}
          </output>
        ) : null}

        {flightResult ? (
          <div aria-live="polite" className="grid gap-2">
            {flightResult.flights.length ? (
              flightResult.flights.map((flight) => (
                <article
                  className="grid gap-3 rounded-md border p-4 md:grid-cols-[1.2fr_1.2fr_0.7fr_0.8fr_0.6fr] md:items-center"
                  key={`${flight.rank}-${flight.name}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {flight.isBest ? <Badge>Best</Badge> : null}
                    <strong>{flight.name || "Flight option"}</strong>
                  </div>
                  <div className="text-sm">
                    <span>{flight.departure || "Departure time missing"}</span>
                    <span className="px-2 text-muted-foreground">to</span>
                    <span>{flight.arrival || "Arrival time missing"}</span>
                  </div>
                  <div className="text-sm">
                    {flight.duration || "Duration missing"}
                  </div>
                  <div className="text-sm">
                    {formatStops(flight.stops)}
                    {flight.delay ? `, ${flight.delay}` : ""}
                  </div>
                  <strong className="md:justify-self-end">
                    {formatPrice(flight.price)}
                  </strong>
                </article>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No flights came back for that search.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div>
          <h2 className="font-semibold text-xl">Surf and snow</h2>
          <p className="text-muted-foreground text-sm">
            Check water and mountain conditions before picking the route.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <article className="grid gap-4 rounded-md border p-4">
            <form
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={onSurfSubmit}
            >
              <Field id="surf-location" label="Surf spot">
                <Input
                  id="surf-location"
                  onChange={(event) => setSurfLocation(event.target.value)}
                  required
                  value={surfLocation}
                />
              </Field>
              <Button
                className="self-end"
                disabled={loadingKind !== null}
                type="submit"
              >
                {loadingKind === "surf" ? "Checking..." : "Check surf"}
              </Button>
            </form>

            {surfError ? (
              <Alert variant="destructive">
                <AlertDescription>{surfError}</AlertDescription>
              </Alert>
            ) : null}

            {surfResult ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <strong>{locationLabel(surfResult)}</strong>
                  <span className="text-muted-foreground">
                    {surfResult.current.time}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                  <Metric
                    detail={`${formatDirection(
                      surfResult.current.waveDirection
                    )} / ${formatValue(surfResult.current.wavePeriod, "s")}`}
                    label="Wave"
                    value={formatValue(surfResult.current.waveHeight, "m")}
                  />
                  <Metric
                    detail={`${formatDirection(
                      surfResult.current.swellDirection
                    )} / ${formatValue(surfResult.current.swellPeriod, "s")}`}
                    label="Swell"
                    value={formatValue(surfResult.current.swellHeight, "m")}
                  />
                  <Metric
                    detail={formatDirection(surfResult.current.windDirection)}
                    label="Wind"
                    value={formatValue(surfResult.current.windSpeed, "km/h")}
                  />
                  <Metric
                    detail="Modelled sea level"
                    label="Tide height"
                    value={formatValue(surfResult.current.tideHeight, "m")}
                  />
                  <Metric
                    detail={surfResult.source}
                    label="Sea temp"
                    value={formatValue(
                      surfResult.current.seaSurfaceTemperature,
                      "C"
                    )}
                  />
                  <Metric
                    detail={formatDirection(
                      surfResult.current.oceanCurrentDirection
                    )}
                    label="Ocean current"
                    value={formatValue(
                      surfResult.current.oceanCurrentVelocity,
                      "km/h"
                    )}
                  />
                </div>
              </div>
            ) : null}
          </article>

          <article className="grid gap-4 rounded-md border p-4">
            <form
              className="grid gap-3 sm:grid-cols-[1fr_auto]"
              onSubmit={onSnowSubmit}
            >
              <Field id="snow-location" label="Ski area">
                <Input
                  id="snow-location"
                  onChange={(event) => setSnowLocation(event.target.value)}
                  required
                  value={snowLocation}
                />
              </Field>
              <Button
                className="self-end"
                disabled={loadingKind !== null}
                type="submit"
              >
                {loadingKind === "snow" ? "Checking..." : "Check snow"}
              </Button>
            </form>

            {snowError ? (
              <Alert variant="destructive">
                <AlertDescription>{snowError}</AlertDescription>
              </Alert>
            ) : null}

            {snowResult ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <strong>{locationLabel(snowResult)}</strong>
                  <span className="text-muted-foreground">
                    {snowResult.current.time}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric
                    detail={`Wind ${formatValue(
                      snowResult.current.windSpeed,
                      "km/h"
                    )} / ${formatDirection(snowResult.current.windDirection)}`}
                    label="Current temp"
                    value={formatValue(snowResult.current.temperature, "C")}
                  />
                  <Metric
                    detail={`Snow depth ${formatValue(
                      snowResult.current.snowDepth,
                      "m"
                    )}`}
                    label="Snowfall now"
                    value={formatValue(snowResult.current.snowfall, "cm")}
                  />
                </div>
                <div className="grid gap-2 lg:grid-cols-5 xl:grid-cols-1 2xl:grid-cols-5">
                  {snowResult.daily.map((day) => (
                    <Metric
                      detail={`${formatValue(
                        day.temperatureMin,
                        "C"
                      )} to ${formatValue(day.temperatureMax, "C")}`}
                      key={day.date}
                      label={day.date}
                      value={formatValue(day.snowfall, "cm")}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </main>
  );
}
