import { MetadataRoute } from "next";
import urlMap from "../url-map.json";
import toolsRegistry from "../lib/tools-registry.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.twistertools.com";
  const currentDate = new Date();

  // Base and Core Platform pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Category pages (9 modern categories)
  const categoryPages: MetadataRoute.Sitemap = Object.keys(
    urlMap.modern_categories
  ).map((category) => ({
    url: `${baseUrl}/tools/${category}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Tool pages from tools-registry.json
  const toolPages: MetadataRoute.Sitemap = toolsRegistry.map((tool) => ({
    url: `${baseUrl}${tool.href}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
