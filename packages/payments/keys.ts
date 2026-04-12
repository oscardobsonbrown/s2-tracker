import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      POLAR_ACCESS_TOKEN: z.string().startsWith("polar_"),
      POLAR_WEBHOOK_SECRET: z.string().optional(),
      POLAR_SERVER: z.enum(["sandbox", "production"]).optional(),
    },
    runtimeEnv: {
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_SERVER: process.env.POLAR_SERVER,
    },
  });
