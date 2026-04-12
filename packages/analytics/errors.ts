import posthog from "posthog-js";

/**
 * Client-side error tracking with PostHog
 * Captures exceptions and errors for analysis
 */

export const captureError = (
  error: unknown,
  context?: Record<string, unknown>
) => {
  const message = error instanceof Error ? error.message : String(error);

  posthog.capture("$exception", {
    $exception_message: message,
    ...context,
  });
};

export const captureMessage = (
  message: string,
  level: "error" | "warning" | "info" = "error"
) => {
  posthog.capture("$exception", {
    $exception_message: message,
    $exception_level: level,
  });
};

// Error boundary handler for React
export const onError = (
  error: Error,
  errorInfo: { componentStack?: string }
) => {
  captureError(error, {
    componentStack: errorInfo.componentStack,
    $exception_type: "react_error_boundary",
  });
};
