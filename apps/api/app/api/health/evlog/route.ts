import { createError, withEvlog } from "@repo/observability";
import { NextResponse } from "next/server";
import { withMetrics } from "@/lib/with-metrics";

/**
 * Example API route with evlog distributed tracing
 * Demonstrates wide events and structured logging
 */
/**
 * @swagger
 * /api/health/evlog:
 *   get:
 *     summary: Health check with evlog tracing
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and tracing is enabled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 evlog:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const healthEvlogRouteHandler = withEvlog((req: Request, { log }) => {
  log.set({
    endpoint: "/api/health/evlog",
    feature: "evlog-demo",
  });

  // Simulate some work
  const startTime = Date.now();

  try {
    // Add context about the request
    log.set({
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    });

    // Simulate a successful operation
    const duration = Date.now() - startTime;

    log.set({
      duration,
      healthStatus: "success",
    });

    return NextResponse.json({
      status: "healthy",
      evlog: "enabled",
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    // Structured error with context
    throw createError({
      status: 500,
      message: "Health check failed",
      why: "Database connection timeout",
      fix: "Check database connection pool",
    });
  }
});

export const GET = withMetrics("/api/health/evlog", healthEvlogRouteHandler);
