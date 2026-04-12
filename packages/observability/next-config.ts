// Next.js configuration utilities
// Sentry has been removed - using PostHog for error tracking instead

// Simple pass-through function (no-op since Sentry is removed)
export const withObservability = (sourceConfig: object): object => sourceConfig;
