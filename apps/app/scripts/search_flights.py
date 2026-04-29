#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
from typing import Any, TypedDict
from urllib.parse import urlencode

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
    cabin: str
    currency: str


FETCH_MODES = {"common", "fallback", "force-fallback", "local"}
PROVIDER_MESSAGE_LIMIT = 240


def write_json(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":")))
    sys.stdout.write("\n")


def fail(code: str, message: str) -> None:
    write_json({"ok": False, "error": {"code": code, "message": message}})


def compact_provider_message(message: str) -> str:
    return " ".join(message.split())[:PROVIDER_MESSAGE_LIMIT]


def classify_provider_exception(error: Exception) -> tuple[str, str]:
    message = str(error) or "Flight search failed."
    compact_message = compact_provider_message(message)
    lower_message = message.lower()

    if "loading results" in lower_message:
        return (
            "PROVIDER_LOADING",
            "The flight provider did not finish loading results for this route.",
        )

    if "no flights found" in lower_message:
        return (
            "NO_FLIGHTS_FOUND",
            "No flights were found for this route.",
        )

    return ("PROVIDER_ERROR", compact_message or "Flight search failed.")


def build_booking_url(flight_filter: Any, currency: str) -> str:
    params = {
        "tfs": flight_filter.as_b64().decode("utf-8"),
        "hl": "en",
        "tfu": "EgQIABABIgA",
        "curr": currency,
    }

    return "https://www.google.com/travel/flights?" + urlencode(params)


def normalize_airlines(name: str) -> list[str]:
    normalized_name = " ".join(name.split())

    if not normalized_name:
        return []

    separators = [" operated by ", " Operated by ", " + ", " / ", " and "]
    airline_names = [normalized_name]

    for separator in separators:
        airline_names = [
            part.strip()
            for airline_name in airline_names
            for part in airline_name.split(separator)
            if part.strip()
        ]

    return list(dict.fromkeys(airline_names))


def format_stop_summary(stops: Any) -> str:
    if stops == "Unknown":
        return "Stops unknown"

    if stops == 0:
        return "Nonstop"

    if stops == 1:
        return "1 stop"

    return f"{stops} stops"


def normalize_flight(rank: int, flight: Any, booking_url: str) -> dict[str, Any]:
    return {
        "rank": rank,
        "isBest": flight.is_best,
        "name": flight.name,
        "airlines": normalize_airlines(flight.name),
        "departure": flight.departure,
        "arrival": flight.arrival,
        "arrivalTimeAhead": flight.arrival_time_ahead,
        "duration": flight.duration,
        "stops": flight.stops,
        "stopSummary": format_stop_summary(flight.stops),
        "delay": flight.delay,
        "price": flight.price,
        "bookingUrl": booking_url,
    }


def run(payload: SearchPayload) -> dict[str, Any]:
    trip_type = payload["tripType"]
    origin = payload["origin"]
    destination = payload["destination"]
    departure_date = payload["departureDate"]
    return_date = payload.get("returnDate")
    adults = payload.get("adults", 1)
    cabin = payload.get("cabin", "economy")
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
        seat=cabin,
    )
    result = get_flights_from_filter(
        flight_filter,
        currency=currency,
        mode=fetch_mode,
    )
    booking_url = build_booking_url(flight_filter, currency)

    return {
        "priceTrend": result.current_price or None,
        "flights": [
            normalize_flight(rank, flight, booking_url)
            for rank, flight in enumerate(result.flights[:20], start=1)
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
        code, message = classify_provider_exception(error)
        fail(code, message)
    else:
        write_json({"ok": True, "data": data})


if __name__ == "__main__":
    main()
