import { initializeAnalytics } from "@repo/analytics/instrumentation-client";
import { initializeClientObservability } from "@repo/observability/client";

initializeClientObservability();
initializeAnalytics();
