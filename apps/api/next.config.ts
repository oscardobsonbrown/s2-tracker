import { config, withAnalyzer } from "@repo/next-config";
import { withObservability } from "@repo/observability/next-config";
import type { NextConfig } from "next";

let nextConfig: NextConfig = withObservability(config);

if (process.env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
