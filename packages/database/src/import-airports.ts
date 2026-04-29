import { pathToFileURL } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { loadDatabaseEnv } from "./load-database-env";
import { airports } from "./schema";

export const ourAirportsCsvUrl =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

const batchSize = 500;
const supportedAirportTypes = new Set(["large_airport", "medium_airport"]);

type AirportInsert = typeof airports.$inferInsert;

interface CsvParseState {
  field: string;
  index: number;
  isInQuotes: boolean;
  row: string[];
  rows: string[][];
}

export interface AirportImportRows {
  airports: AirportInsert[];
  skippedInvalidCoordinates: number;
  skippedMissingId: number;
  skippedMissingIdent: number;
  skippedMissingName: number;
  skippedUnsupportedType: number;
}

function appendField(state: CsvParseState) {
  state.row.push(state.field);
  state.field = "";
}

function appendRow(state: CsvParseState) {
  appendField(state);
  state.rows.push(state.row);
  state.row = [];
}

function handleCsvQuote(state: CsvParseState, csv: string): boolean {
  if (csv[state.index] !== '"') {
    return false;
  }

  if (state.isInQuotes && csv[state.index + 1] === '"') {
    state.field += '"';
    state.index += 1;
    return true;
  }

  state.isInQuotes = !state.isInQuotes;
  return true;
}

function handleCsvDelimiter(state: CsvParseState, csv: string): boolean {
  if (csv[state.index] !== "," || state.isInQuotes) {
    return false;
  }

  appendField(state);
  return true;
}

function handleCsvLineBreak(state: CsvParseState, csv: string): boolean {
  const character = csv[state.index];

  if ((character !== "\n" && character !== "\r") || state.isInQuotes) {
    return false;
  }

  if (character === "\r" && csv[state.index + 1] === "\n") {
    state.index += 1;
  }

  appendRow(state);
  return true;
}

export function parseCsv(csv: string): string[][] {
  const state: CsvParseState = {
    field: "",
    index: 0,
    isInQuotes: false,
    row: [],
    rows: [],
  };

  for (; state.index < csv.length; state.index += 1) {
    if (
      handleCsvQuote(state, csv) ||
      handleCsvDelimiter(state, csv) ||
      handleCsvLineBreak(state, csv)
    ) {
      continue;
    }

    state.field += csv[state.index];
  }

  if (state.field.length > 0 || state.row.length > 0) {
    appendRow(state);
  }

  return state.rows;
}

function normalizeText(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

function normalizeCode(value: string | undefined): string | null {
  return normalizeText(value)?.toUpperCase() ?? null;
}

function parseNumber(value: string | undefined): number | null {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseInteger(value: string | undefined): number | null {
  const parsedValue = parseNumber(value);
  return parsedValue === null ? null : Math.trunc(parsedValue);
}

function parseScheduledService(value: string | undefined): boolean {
  return normalizeText(value)?.toLowerCase() === "yes";
}

function createHeaderIndexes(headers: string[]) {
  return new Map(headers.map((header, index) => [header.trim(), index]));
}

export function mapAirportRows(rows: string[][]): AirportImportRows {
  const [headers, ...dataRows] = rows;

  if (!headers) {
    throw new Error("OurAirports CSV did not include a header row.");
  }

  const headerIndexes = createHeaderIndexes(headers);
  const getValue = (row: string[], header: string) =>
    row[headerIndexes.get(header) ?? -1];

  const airportRows: AirportInsert[] = [];
  let skippedInvalidCoordinates = 0;
  let skippedMissingId = 0;
  let skippedMissingIdent = 0;
  let skippedMissingName = 0;
  let skippedUnsupportedType = 0;

  for (const row of dataRows) {
    const ourairportsId = parseInteger(getValue(row, "id"));
    const ident = normalizeCode(getValue(row, "ident"));
    const type = normalizeText(getValue(row, "type"));
    const name = normalizeText(getValue(row, "name"));
    const latitude = parseNumber(getValue(row, "latitude_deg"));
    const longitude = parseNumber(getValue(row, "longitude_deg"));

    if (!(type && supportedAirportTypes.has(type))) {
      skippedUnsupportedType += 1;
      continue;
    }

    if (ourairportsId === null) {
      skippedMissingId += 1;
      continue;
    }

    if (!ident) {
      skippedMissingIdent += 1;
      continue;
    }

    if (!name) {
      skippedMissingName += 1;
      continue;
    }

    if (
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      skippedInvalidCoordinates += 1;
      continue;
    }

    airportRows.push({
      id: `ourairports:${ourairportsId}`,
      ourairportsId,
      ident,
      type,
      name,
      latitude,
      longitude,
      elevationFt: parseInteger(getValue(row, "elevation_ft")),
      continent: normalizeCode(getValue(row, "continent")),
      isoCountry: normalizeCode(getValue(row, "iso_country")),
      isoRegion: normalizeCode(getValue(row, "iso_region")),
      municipality: normalizeText(getValue(row, "municipality")),
      scheduledService: parseScheduledService(
        getValue(row, "scheduled_service")
      ),
      icaoCode: normalizeCode(getValue(row, "icao_code")),
      iataCode: normalizeCode(getValue(row, "iata_code")),
      gpsCode: normalizeCode(getValue(row, "gps_code")),
      localCode: normalizeCode(getValue(row, "local_code")),
      homeLink: normalizeText(getValue(row, "home_link")),
      wikipediaLink: normalizeText(getValue(row, "wikipedia_link")),
      keywords: normalizeText(getValue(row, "keywords")),
      sourceUrl: ourAirportsCsvUrl,
      importedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return {
    airports: airportRows,
    skippedInvalidCoordinates,
    skippedMissingId,
    skippedMissingIdent,
    skippedMissingName,
    skippedUnsupportedType,
  };
}

function countByType(airportRows: AirportInsert[]) {
  return airportRows.reduce<Record<string, number>>((counts, airport) => {
    counts[airport.type] = (counts[airport.type] ?? 0) + 1;
    return counts;
  }, {});
}

export async function importAirports() {
  if (!process.env.DATABASE_URL) {
    loadDatabaseEnv();
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL must be set.");
    process.exit(1);
  }

  console.log(`Downloading OurAirports data from ${ourAirportsCsvUrl}`);

  const response = await fetch(ourAirportsCsvUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download OurAirports CSV: ${response.status} ${response.statusText}`
    );
  }

  const csv = await response.text();
  const parsedRows = parseCsv(csv);
  const {
    airports: airportRows,
    skippedInvalidCoordinates,
    skippedMissingId,
    skippedMissingIdent,
    skippedMissingName,
    skippedUnsupportedType,
  } = mapAirportRows(parsedRows);

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await db.transaction(async (transaction) => {
      await transaction.delete(airports);

      for (let index = 0; index < airportRows.length; index += batchSize) {
        const batch = airportRows.slice(index, index + batchSize);
        await transaction.insert(airports).values(batch);
      }
    });
  } finally {
    await pool.end();
  }

  const typeCounts = countByType(airportRows);
  const airportsWithIata = airportRows.filter((airport) => airport.iataCode);
  const scheduledAirports = airportRows.filter(
    (airport) => airport.scheduledService
  );

  console.log(`Imported ${airportRows.length} medium and large airports.`);
  console.log(`Imported ${typeCounts.large_airport ?? 0} large airports.`);
  console.log(`Imported ${typeCounts.medium_airport ?? 0} medium airports.`);
  console.log(`Imported ${airportsWithIata.length} airports with IATA codes.`);
  console.log(
    `Imported ${scheduledAirports.length} airports with scheduled service.`
  );
  console.log(`Skipped ${skippedUnsupportedType} unsupported airport types.`);
  console.log(`Skipped ${skippedMissingName} unnamed airports.`);
  console.log(`Skipped ${skippedMissingId} rows without OurAirports IDs.`);
  console.log(`Skipped ${skippedMissingIdent} rows without identifiers.`);
  console.log(
    `Skipped ${skippedInvalidCoordinates} rows with invalid coordinates.`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  importAirports().catch((error) => {
    console.error("Failed to import airports:", error);
    process.exit(1);
  });
}
