import { describe, expect, test } from "vitest";
import {
  classifyAirportAccess,
  pickResortAirportCandidates,
} from "../src/travel-airports";

describe("travel airport helpers", () => {
  test("classifies large airports as class A", () => {
    expect(
      classifyAirportAccess({
        airportId: "lax",
        iataCode: "LAX",
        keywords: null,
        latitude: 33.9416,
        longitude: -118.4085,
        name: "Los Angeles International Airport",
        scheduledService: true,
        type: "large_airport",
      })
    ).toBe("A");
  });

  test("classifies international medium airports as class B", () => {
    expect(
      classifyAirportAccess({
        airportId: "zqn",
        iataCode: "ZQN",
        keywords: "international ski gateway",
        latitude: -45.0211,
        longitude: 168.739,
        name: "Queenstown International Airport",
        scheduledService: true,
        type: "medium_airport",
      })
    ).toBe("B");
  });

  test("backfills class C airports when fewer than three preferred airports exist", () => {
    const selections = pickResortAirportCandidates(
      {
        resortId: "niseko",
        latitude: 42.8048,
        longitude: 140.6874,
      },
      [
        {
          airportId: "cts",
          iataCode: "CTS",
          keywords: "international",
          latitude: 42.7752,
          longitude: 141.692,
          name: "New Chitose International Airport",
          scheduledService: true,
          type: "large_airport",
        },
        {
          airportId: "okd",
          iataCode: "OKD",
          keywords: null,
          latitude: 43.1161,
          longitude: 141.381,
          name: "Sapporo Okadama Airport",
          scheduledService: true,
          type: "medium_airport",
        },
        {
          airportId: "aoj",
          iataCode: "AOJ",
          keywords: null,
          latitude: 40.7347,
          longitude: 140.691,
          name: "Aomori Airport",
          scheduledService: true,
          type: "medium_airport",
        },
      ]
    );

    expect(selections).toHaveLength(3);
    expect(selections[0]?.accessClass).toBe("A");
    expect(selections[1]?.accessClass).toBe("C");
    expect(selections[2]?.accessClass).toBe("C");
    expect(selections[0]?.isPrimary).toBe(true);
  });

  test("expands the search radius when the primary radius does not find enough airports", () => {
    const selections = pickResortAirportCandidates(
      {
        resortId: "remote",
        latitude: 46,
        longitude: 7,
      },
      [
        {
          airportId: "gva",
          iataCode: "GVA",
          keywords: "international",
          latitude: 46.2381,
          longitude: 6.109,
          name: "Geneva International Airport",
          scheduledService: true,
          type: "large_airport",
        },
        {
          airportId: "zrh",
          iataCode: "ZRH",
          keywords: "international",
          latitude: 47.4581,
          longitude: 8.5555,
          name: "Zurich International Airport",
          scheduledService: true,
          type: "large_airport",
        },
      ]
    );

    expect(selections).toHaveLength(2);
  });
});
