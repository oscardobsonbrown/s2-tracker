// biome-ignore lint/performance/noBarrelFile: package entrypoint re-exports public analytics API
export { default as posthog, posthog as analytics } from "posthog-js";
export { captureError, captureMessage, onError } from "./errors";
