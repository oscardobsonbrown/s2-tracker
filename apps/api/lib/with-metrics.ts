import { metrics } from "@/lib/metrics";

type ApiRouteHandler = (request: Request) => Promise<Response> | Response;

export const withMetrics =
  (route: string, handler: ApiRouteHandler): ApiRouteHandler =>
  async (request: Request) => {
    const method = request.method.toUpperCase();
    const inFlightAttributes = { route };

    metrics.httpRequestsInFlight.add(1, inFlightAttributes);
    const startTime = performance.now();

    let status = 500;

    try {
      const response = await handler(request);
      status = response.status;
      return response;
    } finally {
      const statusLabel = String(status);
      const requestAttributes = { method, route, status: statusLabel };

      metrics.httpRequestsInFlight.add(-1, inFlightAttributes);
      metrics.httpRequestsTotal.add(1, requestAttributes);
      metrics.httpRequestDurationSeconds.record(
        (performance.now() - startTime) / 1000,
        requestAttributes
      );
    }
  };
