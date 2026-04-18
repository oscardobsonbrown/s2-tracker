#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
from typing import Any, TypedDict

try:
    from fast_flights import FlightData, Passengers, create_filter, get_flights_from_filter
except ModuleNotFoundError as error:
    print(
        json.dumps(
            {
                "ok": False,
                "error": {
                    "code": "PYTHON_UNAVAILABLE",
                    "message": f"Missing Python dependency: {error.name}",
                },
            }
        )
    )
    raise SystemExit(0)


class SearchPayload(TypedDict, total=False):
    tripType: str
    origin: str
    destination: str
    departureDate: str
    returnDate: str
    adults: int
    currency: str


FETCH_MODES = {"common", "fallback", "force-fallback", "local"}


def write_json(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")))
    sys.stdout.write("\n")


def fail(code: str, message: str) -> None:
    write_json({"ok": False, "error": {"code": code, "message": message}})


def normalize_flight(rank: int, flight: Any) -> dict[str, Any]:
    return {
        "rank": rank,
        "isBest": flight.is_best,
        "name": flight.name,
        "departure": flight.departure,
        "arrival": flight.arrival,
        "arrivalTimeAhead": flight.arrival_time_ahead,
        "duration": flight.duration,
        "stops": flight.stops,
        "delay": flight.delay,
        "price": flight.price,
    }


def run(payload: SearchPayload) -> dict[str, Any]:
    trip_type = payload["tripType"]
    origin = payload["origin"]
    destination = payload["destination"]
    departure_date = payload["departureDate"]
    return_date = payload.get("returnDate")
    adults = payload.get("adults", 1)
    currency = payload.get("currency", "USD")
    fetch_mode = os.environ.get("FAST_FLIGHTS_FETCH_MODE", "common")

    if fetch_mode not in FETCH_MODES:
        raise ValueError(
            "FAST_FLIGHTS_FETCH_MODE must be common, fallback, force-fallback, or local."
        )

    flight_data = [
        FlightData(
            date=departure_date,
            from_airport=origin,
            to_airport=destination,
        )
    ]

    if trip_type == "round-trip":
        if not return_date:
            raise ValueError("Return date is required for round-trip searches.")
        flight_data.append(
            FlightData(
                date=return_date,
                from_airport=destination,
                to_airport=origin,
            )
        )

    flight_filter = create_filter(
        flight_data=flight_data,
        trip=trip_type,
        passengers=Passengers(adults=adults),
        seat="economy",
    )
    result = get_flights_from_filter(
        flight_filter,
        currency=currency,
        mode=fetch_mode,
    )

    return {
        "priceTrend": result.current_price or None,
        "flights": [
            normalize_flight(rank, flight)
            for rank, flight in enumerate(result.flights[:3], start=1)
        ],
    }


def main() -> None:
    try:
        payload = json.loads(sys.stdin.read())
        data = run(payload)
    except KeyError as error:
        fail("VALIDATION_ERROR", f"Missing required field: {error.args[0]}")
    except (AssertionError, ValueError) as error:
        fail("VALIDATION_ERROR", str(error))
    except Exception as error:
        fail("PROVIDER_ERROR", str(error) or "Flight search failed.")
    else:
        write_json({"ok": True, "data": data})


if __name__ == "__main__":
    main()
