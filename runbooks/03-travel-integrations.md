# Travel Integrations

## Overview

The authenticated app exposes travel tools at `/travel`.

- `POST /api/flights` runs a server-side Node route that spawns Python and calls `fast-flights`.
- `GET /api/weather/surf` and `GET /api/weather/snow` call keyless Open-Meteo APIs from the server.
- `POST /api/travel/recommendations` reads the latest cached ski resort weather snapshot and matches flights from the user's home airport.
- `POST /api/travel/ranking-preview` recomputes tunable resort ranking results from the latest cached weather snapshot.
- Browser code calls these endpoints only after the user submits a form.

## Prerequisites

- Node 24 or newer.
- pnpm 10.
- Python 3 with `venv` support.
- App environment variables copied from `apps/app/.env.example`.

## Steps

### Step 1: Install Python Dependencies

```bash
pnpm --filter app python:setup
```

This creates `apps/app/.venv` and installs `fast-flights==2.2` from `apps/app/requirements.txt`.

### Step 2: Configure Flight Runtime

The flight provider uses these optional server variables:

```bash
FLIGHTS_PYTHON_BIN=.venv/bin/python
FAST_FLIGHTS_FETCH_MODE=common
```

`FAST_FLIGHTS_FETCH_MODE` can be `common`, `fallback`, `force-fallback`, or `local`.

### Step 3: Run The App

```bash
pnpm --filter app dev:flights
```

Open `http://localhost:3000/travel` after signing in.

Open `http://localhost:3000/travel/ranking-lab` to tune the ranking model with sliders.

### Step 4: Refresh Travel Snapshot Data

```bash
pnpm db:import:resort-airport-links
pnpm db:import:resort-weather-scores
```

These commands populate:

- `resort_airport_links` using the international-capable airport heuristic
- `resort_weather_scores` using the latest Open-Meteo forecast snapshot

## Verification

Flight route:

```bash
curl -X POST http://localhost:3000/api/flights \
  -H 'content-type: application/json' \
  -d '{"tripType":"one-way","origin":"JFK","destination":"LAX","departureDate":"2026-05-01","adults":1,"currency":"USD"}'
```

Weather routes:

```bash
curl 'http://localhost:3000/api/weather/surf?location=Margaret%20River'
curl 'http://localhost:3000/api/weather/snow?location=Niseko'
```

Travel ranking preview:

```bash
curl -X POST http://localhost:3000/api/travel/ranking-preview \
  -H 'content-type: application/json' \
  -d '{"weights":{"snowfall7":35,"snowfall14":15,"snowDepth":20,"temperature":15,"wind":10,"elevation":5},"pagination":{"pageIndex":0,"pageSize":25},"sort":{"column":"rank","direction":"asc"},"filters":{"downhillOnly":true}}'
```

Travel recommendations:

```bash
curl -X POST http://localhost:3000/api/travel/recommendations \
  -H 'content-type: application/json' \
  -d '{"originAirport":"LAX","tripType":"round-trip","departureDate":"2026-05-01","returnDate":"2026-05-08","preset":{"cabin":"economy","maxStops":1}}'
```

## Troubleshooting

### Issue: Python is unavailable

Run `pnpm --filter app python:setup`, then verify `FLIGHTS_PYTHON_BIN` points to a real Python executable relative to `apps/app`.

### Issue: Flight provider returns errors

`fast-flights` scrapes Google Flights. Searches can fail when Google markup, consent flows, network behavior, or fallback services change. If the target deployment cannot run Python from the Next.js Node runtime, use one of these deployment shapes:

- Move the Python bridge into a small separate service.
- Keep the Python dependency only for self-hosted or local Node runtime.
- Replace `fast-flights` with an approved flight API provider.

### Issue: No ranked ski recommendations are available

Run `pnpm db:import:resort-weather-scores` to refresh the cached forecast snapshot. The `/travel` and `/travel/ranking-lab` flows require snapshot data before they can return resort results.

### Issue: Airport matches look too local

Run `pnpm db:import:resort-airport-links` after importing airport data. Resort flight matching now prefers large airports and medium airports marked as international before falling back to smaller regional options.

### Issue: Weather location is not found

Use both `latitude` and `longitude` query params to bypass geocoding, or provide a more specific location name.

## Related

- `apps/app/app/api/flights/route.ts`
- `apps/app/app/api/travel/recommendations/route.ts`
- `apps/app/app/api/travel/ranking-preview/route.ts`
- `apps/app/app/api/weather/surf/route.ts`
- `apps/app/app/api/weather/snow/route.ts`
- `apps/app/scripts/search_flights.py`
