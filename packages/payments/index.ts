import "server-only";
import { Polar } from "@polar-sh/sdk";
import { keys } from "./keys";

export const polar = new Polar({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  server: keys().POLAR_SERVER || "sandbox",
});

export type { Polar } from "@polar-sh/sdk";
