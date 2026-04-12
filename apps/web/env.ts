import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    ANALYZE: z.string().optional(),
    FLAGS_SECRET: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    RESEND_FROM: z.string().optional(),
    UPSTASH_REDIS_REST_URL: z.string().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.string().optional(),
    NEXT_PUBLIC_DOCS_URL: z.string().optional(),
    NEXT_PUBLIC_WEB_URL: z.url(),
  },
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    FLAGS_SECRET: process.env.FLAGS_SECRET,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    RESEND_FROM: process.env.RESEND_FROM,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
});
