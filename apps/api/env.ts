import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    CLERK_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
    POLAR_WEBHOOK_SECRET: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
  },
  emptyStringAsUndefined: true,
});
