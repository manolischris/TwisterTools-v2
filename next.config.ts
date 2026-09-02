import type { NextConfig } from "next";
import urlMap from "./url-map.json";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
    ],
  },
  async redirects() {
    // Force config reload for cache clearance
    const redirects = [];

    // Math tools redirects (from calculators to math-tools)
    const migratedMathTools = [
      "fraction-calculator",
      "ratio-calculator",
      "matrix-calculator",
      "quadratic-solver",
      "permutation-combination-calculator",
      "standard-deviation-calculator",
      "exponential-calculator",
      "scientific-calculator",
      "percentage-calculator",
      "average-calculator",
    ];
    for (const slug of migratedMathTools) {
      redirects.push({
        source: `/tools/calculators/${slug}`,
        destination: `/tools/math-tools/${slug}`,
        permanent: true,
      });
    }

    // Health tools redirects (from calculators to health-tools)
    const migratedHealthTools = [
      "bmi-calculator",
      "tdee-calculator",
      "body-fat-calculator",
      "water-intake-calculator",
      "ideal-weight-calculator",
      "heart-rate-calculator",
      "macro-calculator",
      "pregnancy-due-date-calculator",
      "ovulation-calculator",
      "bac-calculator",
      "pace-calculator",
      "steps-to-calories-calculator",
      "sleep-cycle-calculator",
      "intermittent-fasting-calculator",
      "caffeine-half-life-calculator",
      "one-rep-max-calculator",
      "race-split-pace-calculator",
      "vo2-max-calculator",
      "lean-body-mass-calculator",
      "calorie-deficit-calculator",
      "quit-smoking-savings-calculator",
      "dog-age-calculator",
      "cat-age-calculator",
      "pet-calorie-calculator",
    ];
    for (const slug of migratedHealthTools) {
      redirects.push({
        source: `/tools/calculators/${slug}`,
        destination: `/tools/health-tools/${slug}`,
        permanent: true,
      });
    }

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

    // Specific legacy 301 redirects to resolve 404s and map to appropriate targets
    const legacyRedirects = [
      { source: "/page/terms-of-use", destination: "/terms-of-service" },
      { source: "/ppt-to-pdf", destination: "/tools/pdf-tools" },
      { source: "/length-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/weight-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/temperature-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/area-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/volume-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/temperature-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/weight-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/length-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/area-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/volume-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/power-converter", destination: "/tools/calculators/master-unit-converter" },
      { source: "/tools/calculators/pressure-converter", destination: "/tools/calculators/master-unit-converter" },
    ];
    for (const r of legacyRedirects) {
      // Avoid duplicate redirects if they're already loaded from url-map.json
      if (!redirects.some((existing) => existing.source === r.source)) {
        redirects.push({
          source: r.source,
          destination: r.destination,
          permanent: true,
        });
      }
    }

    return redirects;
  },
};

export default nextConfig;
