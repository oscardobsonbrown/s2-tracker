import { NextRequest } from "next/server";
import { expect, test } from "vitest";
import { POST as checkoutPost } from "../app/api/checkout/route";
import { GET as healthEvlogGet } from "../app/api/health/evlog/route";
import { GET as metricsGet } from "../app/api/metrics/route";

test("metrics endpoint returns Prometheus payload", async () => {
  const healthRequest = new NextRequest("http://localhost/api/health/evlog", {
    headers: {
      "user-agent": "vitest",
    },
    method: "GET",
  });

  const healthResponse = await healthEvlogGet(healthRequest);
  expect(healthResponse.status).toBe(200);

  const metricsResponse = await metricsGet();
  const metricsText = await metricsResponse.text();

  expect(metricsResponse.status).toBe(200);
  expect(metricsResponse.headers.get("content-type")).toContain("text/plain");
  expect(metricsText).toContain("http_requests_total");
  expect(metricsText).toContain('route="/api/health/evlog"');
  expect(metricsText).toContain("nodejs_heap_size_used_bytes");
  expect(metricsText).toContain("process_resident_memory_bytes");
});

test("metrics endpoint records checkout requests", async () => {
  const checkoutRequest = new NextRequest("http://localhost/api/checkout", {
    body: JSON.stringify({ cartId: "cart_1", userId: "user_1" }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  const checkoutResponse = await checkoutPost(checkoutRequest);
  expect(checkoutResponse.status).toBe(200);

  const metricsResponse = await metricsGet();
  const metricsText = await metricsResponse.text();

  expect(metricsText).toContain('route="/api/checkout"');
  expect(metricsText).toContain('method="POST"');
});
