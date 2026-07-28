import type { NextConfig } from "next";
import urlMap from "./url-map.json";

const nextConfig: NextConfig = {
  async redirects() {
    const redirects = [];

    // Category-level redirects (14 legacy categories → modern categories)
    for (const redirect of urlMap.redirects) {
      redirects.push({
        source: redirect.from,
        destination: redirect.to,
        permanent: true, // 301 Permanent Redirect for SEO preservation
      });
    }

    // Tool-level redirects (146 legacy tool URLs → new clean structure)
    for (const tool of urlMap.tools) {
      redirects.push({
        source: tool.legacy_url,
        destination: tool.new_url,
        permanent: true, // 301 Permanent Redirect to maintain Google indexing
      });
    }

    // Purge data-tools category: redirect the category page to /tools
    redirects.push({
      source: "/tools/data-tools",
      destination: "/tools",
      permanent: true,
    });

    // Redirect nested tools under data-tools to pdf-tools
    redirects.push({
      source: "/tools/data-tools/:path*",
      destination: "/tools/pdf-tools/:path*",
      permanent: true,
    });

    // Purge removed tools under pdf-tools → redirect to PDF category
    const removedPdfTools = [
      "/tools/pdf-tools/ppt-to-pdf",
      "/tools/pdf-tools/pdf-to-ppt",
      "/tools/pdf-tools/excel-to-pdf",
      "/tools/pdf-tools/pdf-to-excel",
    ];
    for (const url of removedPdfTools) {
      redirects.push({
        source: url,
        destination: "/tools/pdf-tools",
        permanent: true,
      });
    }

    return redirects;
  },
};

export default nextConfig;
