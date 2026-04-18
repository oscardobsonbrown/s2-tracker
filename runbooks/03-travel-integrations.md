# Travel Integrations

## Overview

The authenticated app exposes travel tools at `/travel`.

- `POST /api/flights` runs a server-side Node route that spawns Python and calls `fast-flights`.
- `GET /api/weather/surf` and `GET /api/weather/snow` call keyless Open-Meteo APIs from the server.
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

## Troubleshooting

### Issue: Python is unavailable

Run `pnpm --filter app python:setup`, then verify `FLIGHTS_PYTHON_BIN` points to a real Python executable relative to `apps/app`.

### Issue: Flight provider returns errors

`fast-flights` scrapes Google Flights. Searches can fail when Google markup, consent flows, network behavior, or fallback services change. If the target deployment cannot run Python from the Next.js Node runtime, use one of these deployment shapes:

- Move the Python bridge into a small separate service.
- Keep the Python dependency only for self-hosted or local Node runtime.
- Replace `fast-flights` with an approved flight API provider.

### Issue: Weather location is not found

Use both `latitude` and `longitude` query params to bypass geocoding, or provide a more specific location name.

## Related

- `apps/app/app/api/flights/route.ts`
- `apps/app/app/api/weather/surf/route.ts`
- `apps/app/app/api/weather/snow/route.ts`
- `apps/app/scripts/search_flights.py`
