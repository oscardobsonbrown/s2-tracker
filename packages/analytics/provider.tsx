import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

interface AnalyticsProviderProps {
  readonly children: ReactNode;
}

const runtimeEnv = (
  globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  }
).process?.env;
const gaMeasurementId = runtimeEnv?.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => (
  <>
    {children}
    <VercelAnalytics />
    {gaMeasurementId && <GoogleAnalytics gaId={gaMeasurementId} />}
  </>
);
