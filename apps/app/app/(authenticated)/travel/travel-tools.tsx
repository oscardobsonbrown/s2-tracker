"use client";

import {
  Alert,
  AlertDescription,
} from "@repo/design-system/components/ui/alert";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@repo/design-system/components/ui/native-select";
import { cn } from "@repo/design-system/lib/utils";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import type { FlightCabin, FlightResult, TripType } from "@/lib/flight-types";
import type {
  TravelApiError,
  TravelRecommendationResult,
  TravelRecommendationsResponse,
} from "@/lib/travel-types";

const TODAY = new Date().toISOString().slice(0, 10);

interface SubmittedPreset {
  cabin: FlightCabin;
  maxStops: 0 | 1 | 2;
}

function defaultReturnDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function latestForecastDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function isTravelApiError(value: unknown): value is TravelApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as TravelApiError).error?.message === "string"
  );
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

function formatTemperature(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(1)} C`;
}

function formatDistance(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(1)} km`;
}

function formatSnow(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(1)} cm`;
}

function formatPrice(price: string) {
  if (!price || price === "0") {
    return "Price not listed";
  }

  return price.startsWith("$") ? price : `$${price}`;
}

function formatAirlines(flight: FlightResult) {
  if (flight.airlines?.length) {
    return flight.airlines.join(", ");
  }

  const normalizedName = flight.name.trim();

  if (!normalizedName) {
    return "Multiple airlines";
  }

  return normalizedName;
}

function formatFlightTiming(flight: FlightResult) {
  const departure = flight.departure.trim();
  const arrival = flight.arrival.trim();
  const stopSummary = flight.stopSummary || formatStops(flight.stops);

  if (departure && arrival) {
    return `${departure} to ${arrival} • ${stopSummary}`;
  }

  if (departure) {
    return `${departure} departure • ${stopSummary}`;
  }

  if (arrival) {
    return `${arrival} arrival • ${stopSummary}`;
  }

  if (flight.duration.trim()) {
    return `${flight.duration.trim()} • ${stopSummary}`;
  }

  return stopSummary;
}

function isSameFlight(
  first: TravelRecommendationResult["flightMatch"]["fallbackFlight"],
  second: TravelRecommendationResult["flightMatch"]["matchingFlight"]
) {
  return (
    Boolean(first && second) &&
    first?.name === second?.name &&
    first?.departure === second?.departure &&
    first?.arrival === second?.arrival &&
    first?.duration === second?.duration &&
    first?.stops === second?.stops &&
    first?.price === second?.price
  );
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

function FlightSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border bg-muted/20 p-3">
      <span className="text-muted-foreground text-xs uppercase">{label}</span>
      <strong className="text-sm leading-tight">{value}</strong>
    </div>
  );
}

function FlightItinerary({
  flight,
  label,
}: {
  flight: FlightResult;
  label: string;
}) {
  return (
    <div className="grid gap-2 text-sm">
      <div className="grid gap-1">
        <span className="font-medium">{label}</span>
        <span>
          {formatAirlines(flight)} • {formatPrice(flight.price)}
        </span>
        <span className="text-muted-foreground">
          {formatFlightTiming(flight)}
        </span>
      </div>
      <Button
        className="w-fit"
        nativeButton={false}
        render={
          <a href={flight.bookingUrl} rel="noreferrer" target="_blank">
            Open booking page
          </a>
        }
        size="sm"
        variant="outline"
      />
    </div>
  );
}

function flightStatusLabel(
  status: TravelRecommendationResult["flightMatch"]["status"]
) {
  if (status === "preset-match") {
    return "Preset match";
  }

  if (status === "fallback-only") {
    return "Available flight";
  }

  return "No flight";
}

function RecommendationCard({
  cabin,
  maxStops,
  row,
}: {
  cabin: FlightCabin;
  maxStops: 0 | 1 | 2;
  row: TravelRecommendationResult;
}) {
  const fallbackFlight = row.flightMatch.fallbackFlight;
  const shouldShowFallback =
    fallbackFlight &&
    !isSameFlight(fallbackFlight, row.flightMatch.matchingFlight);
  const fallbackLabel = row.flightMatch.matchingFlight
    ? "Best overall alternative"
    : "Best available flight";

  return (
    <article className="grid gap-4 rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>#{row.rank}</Badge>
            <strong className="text-lg">{row.resort.name}</strong>
          </div>
          <p className="text-muted-foreground text-sm">
            {[row.resort.locality, row.resort.region, row.resort.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Score {row.weather.resortScore.toFixed(1)}
          </Badge>
          <Badge
            variant={
              row.flightMatch.status === "preset-match" ? "default" : "outline"
            }
          >
            {flightStatusLabel(row.flightMatch.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <FlightSummary
          label="Snowfall 7d"
          value={formatSnow(row.weather.snowfall7Cm)}
        />
        <FlightSummary
          label="Snowfall 14d"
          value={formatSnow(row.weather.snowfall14Cm)}
        />
        <FlightSummary
          label="Snow depth"
          value={formatSnow(row.weather.snowDepthCm)}
        />
        <FlightSummary
          label="Avg temp"
          value={formatTemperature(row.weather.avgTempC)}
        />
        <FlightSummary
          label="Avg wind"
          value={
            row.weather.avgWindKmh === null
              ? "Not available"
              : `${row.weather.avgWindKmh.toFixed(1)} km/h`
          }
        />
        <FlightSummary
          label="Score mix"
          value={`7d ${row.weather.scoreBreakdown.snowfall7} / depth ${row.weather.scoreBreakdown.snowDepth}`}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="grid gap-2 rounded-md border p-4">
          <div className="flex items-center justify-between gap-2">
            <strong>Airport used</strong>
            {row.airportUsed ? (
              <Badge variant="secondary">
                Class {row.airportUsed.accessClass}
              </Badge>
            ) : null}
          </div>
          {row.airportUsed ? (
            <div className="grid gap-1 text-sm">
              <span>{row.airportUsed.name}</span>
              <span className="text-muted-foreground">
                {[row.airportUsed.iataCode, row.airportUsed.municipality]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
              <span className="text-muted-foreground">
                {formatDistance(row.airportUsed.distanceKm)}
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No linked airport candidates were available for this resort.
            </p>
          )}
        </section>

        <section className="grid gap-3 rounded-md border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong>Flight options</strong>
            <span className="text-muted-foreground text-sm">
              Cabin {cabin} • max {maxStops} stop
              {maxStops === 1 ? "" : "s"}
            </span>
          </div>
          {row.flightMatch.matchingFlight ? (
            <FlightItinerary
              flight={row.flightMatch.matchingFlight}
              label="Preset match"
            />
          ) : null}
          {shouldShowFallback ? (
            <FlightItinerary flight={fallbackFlight} label={fallbackLabel} />
          ) : null}
          {row.flightMatch.matchingFlight ||
          row.flightMatch.fallbackFlight ? null : (
            <p className="text-muted-foreground text-sm">
              No flights were found for the linked airports.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}

export function TravelTools() {
  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [originAirport, setOriginAirport] = useState("LAX");
  const [departureDate, setDepartureDate] = useState(TODAY);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [cabin, setCabin] = useState<FlightCabin>("economy");
  const [maxStops, setMaxStops] = useState<0 | 1 | 2>(1);
  const [result, setResult] = useState<TravelRecommendationsResponse | null>(
    null
  );
  const [submittedPreset, setSubmittedPreset] =
    useState<SubmittedPreset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statusMessage = useMemo(() => {
    if (isLoading) {
      return "Ranking resorts and matching flights...";
    }

    if (error) {
      return "Recommendations failed.";
    }

    if (result) {
      return `Showing ${result.results.length} ranked ski trip options.`;
    }

    return "No recommendation run yet.";
  }, [error, isLoading, result]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSubmittedPreset(null);

    try {
      const requestPreset = {
        cabin,
        maxStops,
      };
      const response = await fetch("/api/travel/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originAirport,
          tripType,
          departureDate,
          returnDate: tripType === "round-trip" ? returnDate : undefined,
          preset: requestPreset,
        }),
      });
      const payload = (await response.json()) as
        | TravelRecommendationsResponse
        | TravelApiError;

      if (!response.ok || isTravelApiError(payload)) {
        setError(
          isTravelApiError(payload)
            ? payload.error.message
            : "Recommendations could not be loaded."
        );
        return;
      }

      setResult(payload);
      setSubmittedPreset(requestPreset);
    } catch {
      setError(
        "Recommendations could not be reached. Check the app server and cached resort weather snapshot."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <section className="grid gap-4 rounded-lg border bg-background p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-muted-foreground text-sm">
              Bookable trips ranked by Balanced forecast score
            </p>
            <h1 className="font-semibold text-2xl tracking-normal">
              Find the best ski trips in the next two weeks.
            </h1>
            <p className="max-w-3xl text-muted-foreground text-sm">
              We scan the strongest snow forecasts first, then keep going until
              the list has trips with at least one available itinerary.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Top 10 bookable ski trips</Badge>
            <Badge variant="secondary">Fallback flights included</Badge>
          </div>
        </div>
        <div className="flex items-start justify-end">
          <Button
            nativeButton={false}
            render={<Link href="/travel/ranking-lab" />}
          >
            Open Ranking Lab
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-lg border bg-background p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl">Travel recommendations</h2>
            <p className="text-muted-foreground text-sm">{statusMessage}</p>
          </div>
          {result ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Snapshot: {result.rankingRefreshDate}
              </Badge>
              {result.rankingIsStale ? (
                <Badge variant="outline">Snapshot may be stale</Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        <form className="grid gap-4" onSubmit={onSubmit}>
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
            <Field id="origin-airport" label="Home airport">
              <Input
                autoComplete="off"
                id="origin-airport"
                inputMode="text"
                maxLength={3}
                onChange={(event) =>
                  setOriginAirport(event.target.value.toUpperCase())
                }
                pattern="[A-Za-z]{3}"
                required
                value={originAirport}
              />
            </Field>
            <Field id="departure-date" label="Depart date">
              <Input
                id="departure-date"
                max={latestForecastDate()}
                min={TODAY}
                onChange={(event) => setDepartureDate(event.target.value)}
                required
                type="date"
                value={departureDate}
              />
            </Field>
            <Field id="return-date" label="Return date">
              <Input
                disabled={tripType === "one-way"}
                id="return-date"
                min={departureDate}
                onChange={(event) => setReturnDate(event.target.value)}
                required={tripType === "round-trip"}
                type="date"
                value={returnDate}
              />
            </Field>
            <Field id="cabin" label="Cabin">
              <NativeSelect
                id="cabin"
                onChange={(event) =>
                  setCabin(event.target.value as FlightCabin)
                }
                value={cabin}
              >
                <NativeSelectOption value="economy">Economy</NativeSelectOption>
                <NativeSelectOption value="premium-economy">
                  Premium economy
                </NativeSelectOption>
                <NativeSelectOption value="business">
                  Business
                </NativeSelectOption>
                <NativeSelectOption value="first">First</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field id="max-stops" label="Max stops">
              <NativeSelect
                id="max-stops"
                onChange={(event) =>
                  setMaxStops(Number(event.target.value) as 0 | 1 | 2)
                }
                value={String(maxStops)}
              >
                <NativeSelectOption value="0">Nonstop only</NativeSelectOption>
                <NativeSelectOption value="1">Up to 1 stop</NativeSelectOption>
                <NativeSelectOption value="2">Up to 2 stops</NativeSelectOption>
              </NativeSelect>
            </Field>
          </div>

          <Button className="w-fit" disabled={isLoading} type="submit">
            {isLoading ? "Finding trips..." : "Find top ski trips"}
          </Button>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      {result?.rankingIsStale ? (
        <Alert>
          <AlertDescription>
            Recommendations are using the latest available forecast snapshot
            from {result.rankingRefreshDate}.
          </AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <section className="grid gap-4">
          {result.results.map((row) => (
            <RecommendationCard
              cabin={submittedPreset?.cabin ?? cabin}
              key={row.resort.id}
              maxStops={submittedPreset?.maxStops ?? maxStops}
              row={row}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
