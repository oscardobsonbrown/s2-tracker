import pino from "pino";

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const transport =
  process.env.NODE_ENV === "development"
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      })
    : undefined;

export const logger = pino(
  {
    level,
    base: {
      package: "@repo/observability",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport
);
