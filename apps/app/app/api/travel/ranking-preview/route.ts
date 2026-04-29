import { logger } from "@repo/observability/logger.server";
import {
  loadRankingPreview,
  validateRankingPreviewRequest,
} from "@/lib/travel-recommendations";
import type { TravelApiError } from "@/lib/travel-types";

export const runtime = "nodejs";

const routeLogger = logger.child({
  app: "app",
  route: "/api/travel/ranking-preview",
});

function errorResponse(
  code: TravelApiError["error"]["code"],
  message: string,
  status = 400
) {
  return Response.json({ error: { code, message } } satisfies TravelApiError, {
    status,
  });
}

export async function POST(request: Request) {
  const startedAt = performance.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "VALIDATION_ERROR",
      "Request body must be valid JSON."
    );
  }

  const validation = validateRankingPreviewRequest(body);

  if (typeof validation === "string") {
    return errorResponse("VALIDATION_ERROR", validation);
  }

  const preview = await loadRankingPreview(validation);

  if (!preview) {
    return errorResponse(
      "NO_SNAPSHOT",
      "No cached resort weather snapshot is available yet.",
      503
    );
  }

  routeLogger.info(
    {
      durationMs: Math.round(performance.now() - startedAt),
      returnedRows: preview.rows.length,
      snapshotDate: preview.snapshotDate,
      totalRows: preview.totalRows,
    },
    "Travel ranking preview loaded"
  );

  return Response.json(preview);
}
