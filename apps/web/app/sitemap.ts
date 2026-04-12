import type { MetadataRoute } from "next";
import { env } from "@/env";

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  { url: new URL("/", env.NEXT_PUBLIC_WEB_URL).href, lastModified: new Date() },
  {
    url: new URL("/blog", env.NEXT_PUBLIC_WEB_URL).href,
    lastModified: new Date(),
  },
  {
    url: new URL("/pricing", env.NEXT_PUBLIC_WEB_URL).href,
    lastModified: new Date(),
  },
  {
    url: new URL("/contact", env.NEXT_PUBLIC_WEB_URL).href,
    lastModified: new Date(),
  },
];

export default sitemap;
