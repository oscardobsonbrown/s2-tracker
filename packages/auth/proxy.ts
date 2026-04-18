// biome-ignore lint/performance/noBarrelFile: package facade exposes the auth middleware under repo naming.
export { clerkMiddleware as authMiddleware } from "@clerk/nextjs/server";
