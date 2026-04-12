import { NextResponse } from "next/server";
import { getMetricsPayload } from "@/lib/metrics";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Returns API and process metrics in Prometheus text format
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to collect metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const GET = async () => {
  try {
    const { body, contentType } = await getMetricsPayload();

    return new Response(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to collect metrics",
        why: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
