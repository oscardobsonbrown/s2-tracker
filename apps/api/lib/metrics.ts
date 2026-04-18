import {
  PrometheusExporter,
  PrometheusSerializer,
} from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";

interface MetricsRegistryState {
  httpRequestDurationSeconds: ReturnType<
    ReturnType<MeterProvider["getMeter"]>["createHistogram"]
  >;
  httpRequestsInFlight: ReturnType<
    ReturnType<MeterProvider["getMeter"]>["createUpDownCounter"]
  >;
  httpRequestsTotal: ReturnType<
    ReturnType<MeterProvider["getMeter"]>["createCounter"]
  >;
  prometheusReader: PrometheusExporter;
  prometheusSerializer: PrometheusSerializer;
}

declare global {
  var __nextShipApiMetrics: MetricsRegistryState | undefined;
}

const initializeMetrics = (): MetricsRegistryState => {
  const prometheusReader = new PrometheusExporter({
    preventServerStart: true,
    withoutScopeInfo: true,
    withoutTargetInfo: true,
  });
  const meterProvider = new MeterProvider({ readers: [prometheusReader] });

  const meter = meterProvider.getMeter("next-ship-api");
  const prometheusSerializer = new PrometheusSerializer(
    "",
    false,
    undefined,
    true,
    true
  );

  const httpRequestsTotal = meter.createCounter("http_requests_total", {
    description: "Total number of HTTP requests",
  });

  const httpRequestDurationSeconds = meter.createHistogram(
    "http_request_duration_seconds",
    {
      description: "HTTP request duration in seconds",
      unit: "s",
    }
  );

  const httpRequestsInFlight = meter.createUpDownCounter(
    "http_requests_in_flight",
    {
      description: "Number of in-flight HTTP requests",
    }
  );

  const nodejsHeapSizeUsedBytes = meter.createObservableGauge(
    "nodejs_heap_size_used_bytes",
    {
      description: "Node.js heap size currently used in bytes",
      unit: "By",
    }
  );

  const processResidentMemoryBytes = meter.createObservableGauge(
    "process_resident_memory_bytes",
    {
      description: "Resident memory size in bytes",
      unit: "By",
    }
  );

  const processUptimeSeconds = meter.createObservableGauge(
    "process_uptime_seconds",
    {
      description: "Process uptime in seconds",
      unit: "s",
    }
  );

  meter.addBatchObservableCallback(
    (observableResult) => {
      const memoryUsage = process.memoryUsage();
      observableResult.observe(nodejsHeapSizeUsedBytes, memoryUsage.heapUsed);
      observableResult.observe(processResidentMemoryBytes, memoryUsage.rss);
      observableResult.observe(processUptimeSeconds, process.uptime());
    },
    [nodejsHeapSizeUsedBytes, processResidentMemoryBytes, processUptimeSeconds]
  );

  return {
    httpRequestDurationSeconds,
    httpRequestsInFlight,
    httpRequestsTotal,
    prometheusReader,
    prometheusSerializer,
  };
};

export const metrics = globalThis.__nextShipApiMetrics ?? initializeMetrics();

if (!globalThis.__nextShipApiMetrics) {
  globalThis.__nextShipApiMetrics = metrics;
}

export const getMetricsPayload = async () => {
  const collectionResult = await metrics.prometheusReader.collect();
  return {
    body: metrics.prometheusSerializer.serialize(
      collectionResult.resourceMetrics
    ),
    contentType: "text/plain; version=0.0.4; charset=utf-8",
  };
};
