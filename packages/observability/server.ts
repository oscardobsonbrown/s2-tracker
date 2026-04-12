// Server-side observability utilities
// Sentry has been removed - using PostHog for error tracking instead
import { logger } from "./logger.server";

export const initializeServerObservability = (): void => {
  // Errors are now captured by PostHog via the client-side integration
  // Server logs are emitted as structured JSON for downstream log processing
  logger.info("Observability initialized (PostHog mode)");
};
