import { authMiddleware } from "@repo/auth/proxy";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/proxy";
import type { NextProxy } from "next/server";
import { env } from "@/env";

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on all routes except for static assets and Posthog ingest
  matcher: ["/((?!_next/static|_next/image|ingest|favicon.ico).*)"],
};

const securityHeaders = env.FLAGS_SECRET
  ? securityMiddleware(noseconeOptionsWithToolbar)
  : securityMiddleware(noseconeOptions);

// Clerk middleware wraps security headers
export default authMiddleware(() => securityHeaders()) as unknown as NextProxy;
