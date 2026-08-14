import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { GraduationCap } from "lucide-react";
import GpaCalculator from "@/components/tools/GpaCalculator";

const TOOL_TITLE = "GPA & Grade Point Average Calculator";
const TOOL_SLUG = "gpa-calculator";
const TOOL_DESCRIPTION =
  "Calculate semester & cumulative GPA across 4.0, 4.3, and 5.0 weighted scales.";

import RelatedTools from "@/components/RelatedTools";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `https://www.twistertools.com/tools/calculators/${TOOL_SLUG}`;
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "calculators",
    TOOL_SLUG
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? `https://www.twistertools.com/images/tools/calculators/${TOOL_SLUG}.webp`
    : fs.existsSync(jpgPath)
      ? `https://www.twistertools.com/images/tools/calculators/${TOOL_SLUG}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: TOOL_TITLE,
    description:
      "Calculate semester and cumulative GPA with support for 4.0, 4.3, and 5.0 weighted AP/Honors grading scales. Target GPA goal planner included.",
    keywords: [
      "gpa calculator",
      "grade point average calculator",
      "cumulative gpa calculator",
      "semester gpa calculator",
      "weighted gpa calculator",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${TOOL_TITLE} | TwisterTools`,
      description:
        "Calculate semester and cumulative GPA with support for 4.0, 4.3, and 5.0 weighted AP/Honors grading scales. Target GPA goal planner included.",
      url: canonicalUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: TOOL_TITLE
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${TOOL_TITLE} | TwisterTools`,
      description:
        "Calculate semester and cumulative GPA with support for 4.0, 4.3, and 5.0 weighted AP/Honors grading scales. Target GPA goal planner included.",
      images: [ogImageUrl]
    }
  };
}

export default function GpaCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-slate-200 bg-linear-to-r from-slate-50/80 via-white to-indigo-50/70 dark:border-slate-700 dark:from-slate-900/50 dark:via-slate-950 dark:to-indigo-950/40">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 md:px-8 md:py-3">
          <div className="mx-auto max-w-6xl">
            <div className="scrollbar-none mb-1.5 flex flex-wrap items-center gap-1 overflow-x-auto whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
              <a
                href="/"
                className="max-w-32.5 truncate transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none"
              >
                Home
              </a>
              <span>/</span>
              <a
                href="/tools/calculators"
                className="max-w-32.5 truncate transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none"
              >
                Daily Essentials, Financial & Math Calculators
              </a>
              <span>/</span>
              <span className="max-w-32.5 truncate font-medium text-slate-900 dark:text-white sm:max-w-50 md:max-w-none">
                {TOOL_TITLE}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 self-stretch items-center justify-center rounded-2xl bg-indigo-50/70 shadow-sm dark:bg-slate-800">
                <GraduationCap className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-0.5 text-xl font-bold leading-tight text-slate-900 dark:text-white md:text-2xl">
                  {TOOL_TITLE}
                </h1>
                <p className="text-base leading-snug text-slate-600 dark:text-slate-400">
                  {TOOL_DESCRIPTION}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 md:py-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <GpaCalculator />
        {/* Related Tools */}
        <RelatedTools currentSlug="gpa-calculator" currentCategory="calculators" />
        </div>
      </main>
    </div>
  );
}