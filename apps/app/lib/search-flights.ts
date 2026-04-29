import "server-only";

import { logger } from "@repo/observability/logger.server";
import type {
  FlightErrorCode,
  FlightResult,
  FlightSearchInput,
} from "@/lib/flight-types";

interface ProviderSuccess {
  data: {
    priceTrend: "low" | "typical" | "high" | null;
    flights: FlightResult[];
  };
  ok: true;
}

interface ProviderFailure {
  error: {
    code?: FlightErrorCode;
    message?: string;
  };
  ok: false;
}

type ProviderEnvelope = ProviderSuccess | ProviderFailure;
type SettleProviderSearch = (
  error: FlightProviderError | null,
  data?: ProviderSuccess["data"]
) => void;

const SCRIPT_PATH = "scripts/search_flights.py";
const MAX_OUTPUT_BYTES = 1024 * 1024;
const SEARCH_TIMEOUT_MS = 45_000;
const DEFAULT_PYTHON_BIN_PARTS = [".venv", "bin", "python"];

const flightLogger = logger.child({
  app: "app",
  feature: "flight-search",
});

export class FlightProviderError extends Error {
  code: FlightErrorCode;

  constructor(code: FlightErrorCode, message: string) {
    super(message);
    this.name = "FlightProviderError";
    this.code = code;
  }
}

function appendCapped(current: string, chunk: Buffer): string {
  if (current.length >= MAX_OUTPUT_BYTES) {
    return current;
  }

  return (current + chunk.toString("utf8")).slice(0, MAX_OUTPUT_BYTES);
}

function parseProviderEnvelope(stdout: string): ProviderEnvelope {
  const trimmed = stdout.trim();

  if (!trimmed) {
    throw new FlightProviderError(
      "PROVIDER_ERROR",
      "The flight provider returned an empty response."
    );
  }

  try {
    return JSON.parse(trimmed) as ProviderEnvelope;
  } catch {
    throw new FlightProviderError(
      "PROVIDER_ERROR",
      "The flight provider returned an unreadable response."
    );
  }
}

function toProviderError(envelope: ProviderFailure): FlightProviderError {
  const code = envelope.error.code ?? "PROVIDER_ERROR";
  const message = envelope.error.message ?? "Flight search failed.";

  return new FlightProviderError(code, message);
}

function readProviderData(stdout: string): ProviderSuccess["data"] {
  const envelope = parseProviderEnvelope(stdout);

  if (envelope.ok === false) {
    throw toProviderError(envelope);
  }

  return envelope.data;
}

function isExpectedProviderMiss(error: unknown): error is FlightProviderError {
  return (
    error instanceof FlightProviderError &&
    (error.code === "NO_FLIGHTS_FOUND" || error.code === "PROVIDER_LOADING")
  );
}

function handleProviderClose({
  durationMs,
  exitCode,
  settle,
  stderr,
  stdout,
}: {
  durationMs: number;
  exitCode: number | null;
  settle: SettleProviderSearch;
  stderr: string;
  stdout: string;
}) {
  if (exitCode !== 0) {
    flightLogger.error(
      {
        exitCode,
        stderr: stderr.slice(0, 1000),
        stderrBytes: stderr.length,
        durationMs,
      },
      "Flight provider exited before returning results"
    );
    settle(
      new FlightProviderError(
        "PROVIDER_ERROR",
        "Flight search failed before returning results."
      )
    );
    return;
  }

  try {
    const data = readProviderData(stdout);

    flightLogger.info(
      {
        resultCount: data.flights.length,
        priceTrend: data.priceTrend,
        stderrBytes: stderr.length,
        durationMs,
      },
      "Flight provider returned results"
    );
    settle(null, data);
  } catch (error) {
    if (isExpectedProviderMiss(error)) {
      flightLogger.info(
        {
          code: error.code,
          message: error.message,
          stderr: stderr.slice(0, 300),
          stderrBytes: stderr.length,
          stdoutBytes: stdout.length,
          durationMs,
        },
        "Flight provider returned no usable itinerary"
      );
      settle(error);
      return;
    }

    const logMethod =
      error instanceof FlightProviderError
        ? flightLogger.warn
        : flightLogger.error;

    logMethod.call(
      flightLogger,
      {
        err: error,
        code: error instanceof FlightProviderError ? error.code : undefined,
        stderr: stderr.slice(0, 1000),
        stderrBytes: stderr.length,
        stdoutBytes: stdout.length,
        durationMs,
      },
      "Flight provider response could not be parsed"
    );
    settle(
      error instanceof FlightProviderError
        ? error
        : new FlightProviderError(
            "PROVIDER_ERROR",
            "Flight search returned an unexpected response."
          )
    );
  }
}

export async function searchFlights(input: FlightSearchInput) {
  const pythonBin =
    process.env.FLIGHTS_PYTHON_BIN ?? DEFAULT_PYTHON_BIN_PARTS.join("/");
  const fetchMode = process.env.FAST_FLIGHTS_FETCH_MODE ?? "common";
  const { spawn } = await import("node:child_process");
  const startedAt = performance.now();

  flightLogger.info(
    {
      tripType: input.tripType,
      origin: input.origin,
      destination: input.destination,
      adults: input.adults,
      cabin: input.cabin,
      currency: input.currency,
      fetchMode,
      pythonBin,
      scriptPath: SCRIPT_PATH,
    },
    "Starting flight provider process"
  );

  return new Promise<ProviderSuccess["data"]>((resolve, reject) => {
    const child = spawn(pythonBin, [SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      flightLogger.warn(
        {
          durationMs: Math.round(performance.now() - startedAt),
          origin: input.origin,
          destination: input.destination,
        },
        "Flight provider timed out"
      );
      settle(
        new FlightProviderError(
          "TIMEOUT",
          "Flight search took too long. Try a narrower search."
        )
      );
    }, SEARCH_TIMEOUT_MS);

    function settle(
      error: FlightProviderError | null,
      data?: ProviderSuccess["data"]
    ) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (error) {
        reject(error);
        return;
      }

      resolve(data as ProviderSuccess["data"]);
    }

    child.on("error", (error: NodeJS.ErrnoException) => {
      const code =
        error.code === "ENOENT" ? "PYTHON_UNAVAILABLE" : "PROVIDER_ERROR";
      const message =
        code === "PYTHON_UNAVAILABLE"
          ? "Python is not available. Run pnpm python:setup and set FLIGHTS_PYTHON_BIN if you use a custom Python."
          : "The flight search process could not start.";

      flightLogger.error(
        {
          err: error,
          code,
          pythonBin,
          durationMs: Math.round(performance.now() - startedAt),
        },
        "Flight provider process failed to start"
      );
      settle(new FlightProviderError(code, message));
    });

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendCapped(stdout, chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendCapped(stderr, chunk);
    });

    child.on("close", (exitCode) => {
      if (settled) {
        return;
      }

      const durationMs = Math.round(performance.now() - startedAt);

      handleProviderClose({ durationMs, exitCode, settle, stderr, stdout });
    });

    child.stdin.end(JSON.stringify(input));
  });
}
