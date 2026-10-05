import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://jevspeak.org" }, { url: "https://jevspeak.org/chat" }];
}
