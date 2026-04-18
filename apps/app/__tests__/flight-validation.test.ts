import { describe, expect, test } from "vitest";
import { validateFlightPayload } from "@/lib/flight-validation";

describe("validateFlightPayload", () => {
  test("requires a JSON object body", () => {
    expect(validateFlightPayload(null)).toEqual({
      ok: false,
      message: "Request body must be a JSON object.",
    });
  });

  test("normalizes a valid one-way search", () => {
    expect(
      validateFlightPayload({
        tripType: "one-way",
        origin: " jfk ",
        destination: " lax ",
        departureDate: "2026-05-01",
        adults: "2",
        currency: "usd",
      })
    ).toEqual({
      ok: true,
      data: {
        tripType: "one-way",
        origin: "JFK",
        destination: "LAX",
        departureDate: "2026-05-01",
        returnDate: undefined,
        adults: 2,
        currency: "USD",
      },
    });
  });

  test("rejects round trips where the return date is before departure", () => {
    expect(
      validateFlightPayload({
        tripType: "round-trip",
        origin: "JFK",
        destination: "LAX",
        departureDate: "2026-05-02",
        returnDate: "2026-05-01",
        adults: 1,
        currency: "USD",
      })
    ).toEqual({
      ok: false,
      message: "Return date cannot be before departure date.",
    });
  });
});
