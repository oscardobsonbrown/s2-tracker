import "server-only";
import { PostHog } from "posthog-node";

type AnalyticsClient = Pick<PostHog, "capture" | "identify" | "shutdown">;

const runtimeEnv = (
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;
const postHogKey = runtimeEnv?.NEXT_PUBLIC_POSTHOG_KEY;
const postHogHost =
  runtimeEnv?.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export const analytics: AnalyticsClient = postHogKey
  ? new PostHog(postHogKey, {
      host: postHogHost,

      // Don't batch events and flush immediately - we're running in a serverless environment
      flushAt: 1,
      flushInterval: 0,
    })
  : {
      capture: () => undefined,
      identify: () => undefined,
      shutdown: async () => undefined,
    };

/**
 * Server-side error tracking
 * Captures exceptions and errors for analysis
 */
export const serverCaptureError = async (
  error: unknown,
  distinctId?: string,
  context?: Record<string, unknown>
) => {
  if (!postHogKey) {
    return;
  }

  const client = new PostHog(postHogKey, {
    host: postHogHost,
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
