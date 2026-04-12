import "server-only";
import { PostHog } from "posthog-node";
import { keys } from "./keys";

export const analytics = new PostHog(keys().NEXT_PUBLIC_POSTHOG_KEY, {
  host: keys().NEXT_PUBLIC_POSTHOG_HOST,

  // Don't batch events and flush immediately - we're running in a serverless environment
  flushAt: 1,
  flushInterval: 0,
});

/**
 * Server-side error tracking
 * Captures exceptions and errors for analysis
 */
export const serverCaptureError = async (
  error: unknown,
  distinctId?: string,
  context?: Record<string, unknown>
) => {
  const apiKey = keys().NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    return;
  }

  const client = new PostHog(apiKey, {
    host: keys().NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
  });

  client.capture({
    event: "$exception",
    distinctId: distinctId || "server",
    properties: {
      $exception_message:
        error instanceof Error ? error.message : String(error),
      ...context,
    },
  });

  await client.shutdown();
};
