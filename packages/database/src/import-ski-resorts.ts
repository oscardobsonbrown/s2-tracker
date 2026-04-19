import { loadEnvFile } from "node:process";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { skiResorts } from "./schema";

const openSkiMapCsvUrl = "https://tiles.openskimap.org/csv/ski_areas.csv";
const batchSize = 500;

if (!process.env.DATABASE_URL) {
  loadEnvFile(".env");
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

type SkiResortInsert = typeof skiResorts.$inferInsert;

interface CsvParseState {
  field: string;
  index: number;
  isInQuotes: boolean;
  row: string[];
  rows: string[][];
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

function parseCsv(csv: string): string[][] {
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

function parseBoolean(value: string | undefined): boolean | null {
  const normalizedValue = normalizeText(value)?.toLowerCase();

  if (normalizedValue === "yes" || normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "no" || normalizedValue === "false") {
    return false;
  }

  return null;
}

function mapCsvRows(rows: string[][]): {
  resorts: SkiResortInsert[];
  skippedInvalidCoordinates: number;
  skippedMissingId: number;
  skippedMissingName: number;
} {
  const [headers, ...dataRows] = rows;

  if (!headers) {
    throw new Error("OpenSkiMap CSV did not include a header row.");
  }

  const headerIndexes = new Map(
    headers.map((header, index) => [header.trim(), index])
  );

  const getValue = (row: string[], header: string) =>
    row[headerIndexes.get(header) ?? -1];

  const resorts: SkiResortInsert[] = [];
  let skippedInvalidCoordinates = 0;
  let skippedMissingId = 0;
  let skippedMissingName = 0;

  for (const row of dataRows) {
    const id = normalizeText(getValue(row, "id"));
    const name = normalizeText(getValue(row, "name"));
    const latitude = parseNumber(getValue(row, "lat"));
    const longitude = parseNumber(getValue(row, "lng"));
    const openskimapUrl = normalizeText(getValue(row, "openskimap"));
    const geometry = normalizeText(getValue(row, "geometry"));

    if (!id) {
      skippedMissingId += 1;
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

    resorts.push({
      id,
      name,
      country: normalizeText(getValue(row, "countries")),
      region: normalizeText(getValue(row, "regions")),
      locality: normalizeText(getValue(row, "localities")),
      status: normalizeText(getValue(row, "status")) ?? "unknown",
      hasDownhill: parseBoolean(getValue(row, "has_downhill")),
      hasNordic: parseBoolean(getValue(row, "has_nordic")),
      downhillDistanceKm: parseNumber(getValue(row, "downhill_distance_km")),
      nordicDistanceKm: parseNumber(getValue(row, "nordic_distance_km")),
      verticalM: parseInteger(getValue(row, "vertical_m")),
      minElevationM: parseInteger(getValue(row, "min_elevation_m")),
      maxElevationM: parseInteger(getValue(row, "max_elevation_m")),
      liftCount: parseInteger(getValue(row, "lift_count")),
      surfaceLiftsCount: parseInteger(getValue(row, "surface_lifts_count")),
      runConvention: normalizeText(getValue(row, "run_convention")),
      wikidataId: normalizeText(getValue(row, "wikidata_id")),
      websites: normalizeText(getValue(row, "websites")),
      openskimapUrl: openskimapUrl ?? `https://openskimap.org/?obj=${id}`,
      geometry: geometry ?? "Point",
      latitude,
      longitude,
      sources: normalizeText(getValue(row, "sources")),
      importedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return {
    resorts,
    skippedInvalidCoordinates,
    skippedMissingId,
    skippedMissingName,
  };
}

async function importSkiResorts() {
  console.log(`Downloading OpenSkiMap data from ${openSkiMapCsvUrl}`);

  const response = await fetch(openSkiMapCsvUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download OpenSkiMap CSV: ${response.status} ${response.statusText}`
    );
  }

  const csv = await response.text();
  const parsedRows = parseCsv(csv);
  const {
    resorts,
    skippedInvalidCoordinates,
    skippedMissingId,
    skippedMissingName,
  } = mapCsvRows(parsedRows);

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await db.transaction(async (transaction) => {
      await transaction.delete(skiResorts);

      for (let index = 0; index < resorts.length; index += batchSize) {
        const batch = resorts.slice(index, index + batchSize);
        await transaction.insert(skiResorts).values(batch);
      }
    });
  } finally {
    await pool.end();
  }

  console.log(`Imported ${resorts.length} named ski resorts.`);
  console.log(`Skipped ${skippedMissingName} unnamed ski areas.`);
  console.log(`Skipped ${skippedMissingId} rows without IDs.`);
  console.log(
    `Skipped ${skippedInvalidCoordinates} rows with invalid coordinates.`
  );
}

importSkiResorts().catch((error) => {
  console.error("Failed to import ski resorts:", error);
  process.exit(1);
});
