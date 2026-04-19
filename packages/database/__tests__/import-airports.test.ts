import { describe, expect, it } from "vitest";
import { mapAirportRows, parseCsv } from "../src/import-airports";

const csvHeader =
  "id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,icao_code,iata_code,gps_code,local_code,home_link,wikipedia_link,keywords";

function airportRow(overrides: Record<string, string>) {
  const row = {
    continent: "NA",
    elevation_ft: "13",
    gps_code: "KJFK",
    home_link: "",
    iata_code: "JFK",
    icao_code: "KJFK",
    id: "3797",
    ident: "KJFK",
    iso_country: "US",
    iso_region: "US-NY",
    keywords: "",
    latitude_deg: "40.639447",
    local_code: "JFK",
    longitude_deg: "-73.779317",
    municipality: "New York",
    name: "John F Kennedy International Airport",
    scheduled_service: "yes",
    type: "large_airport",
    wikipedia_link: "",
    ...overrides,
  };

  return csvHeader
    .split(",")
    .map((header) => row[header as keyof typeof row])
    .join(",");
}

describe("airport import mapping", () => {
  it("imports only medium and large airports", () => {
    const rows = parseCsv(
      [
        csvHeader,
        airportRow({ id: "1", ident: "LARGE", type: "large_airport" }),
        airportRow({ id: "2", ident: "MEDIUM", type: "medium_airport" }),
        airportRow({ id: "3", ident: "SMALL", type: "small_airport" }),
        airportRow({ id: "4", ident: "HELIPAD", type: "heliport" }),
        airportRow({ id: "5", ident: "SEAPLANE", type: "seaplane_base" }),
        airportRow({ id: "6", ident: "BALLOON", type: "balloonport" }),
        airportRow({ id: "7", ident: "CLOSED", type: "closed" }),
      ].join("\n")
    );

    const result = mapAirportRows(rows);

    expect(result.airports).toHaveLength(2);
    expect(result.airports.map((airport) => airport.type)).toEqual([
      "large_airport",
      "medium_airport",
    ]);
    expect(result.skippedUnsupportedType).toBe(5);
  });

  it("normalizes source fields for imported airports", () => {
    const rows = parseCsv(
      [
        csvHeader,
        airportRow({
          continent: "eu",
          iata_code: "lhr",
          icao_code: "egll",
          ident: "egll",
          iso_country: "gb",
          iso_region: "gb-eng",
          local_code: "",
          scheduled_service: "yes",
        }),
      ].join("\n")
    );

    const result = mapAirportRows(rows);
    const [airport] = result.airports;

    expect(airport).toMatchObject({
      continent: "EU",
      iataCode: "LHR",
      icaoCode: "EGLL",
      id: "ourairports:3797",
      ident: "EGLL",
      isoCountry: "GB",
      isoRegion: "GB-ENG",
      localCode: null,
      scheduledService: true,
    });
  });

  it("skips medium and large airports with invalid required fields", () => {
    const rows = parseCsv(
      [
        csvHeader,
        airportRow({ id: "", ident: "NOID" }),
        airportRow({ id: "8", ident: "" }),
        airportRow({ id: "9", ident: "NONAME", name: "" }),
        airportRow({ id: "10", ident: "BADLAT", latitude_deg: "91" }),
        airportRow({ id: "11", ident: "BADLON", longitude_deg: "-181" }),
      ].join("\n")
    );

    const result = mapAirportRows(rows);

    expect(result.airports).toHaveLength(0);
    expect(result.skippedInvalidCoordinates).toBe(2);
    expect(result.skippedMissingId).toBe(1);
    expect(result.skippedMissingIdent).toBe(1);
    expect(result.skippedMissingName).toBe(1);
  });
});
