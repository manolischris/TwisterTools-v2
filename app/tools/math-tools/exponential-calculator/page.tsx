import Link from "next/link";
import type { Metadata, NextPage } from "next";
import fs from "node:fs";
import path from "node:path";
import { TrendingUp } from "lucide-react";
import ExponentialCalculator from "@/components/tools/ExponentialCalculator";
import RelatedTools from "@/components/RelatedTools";

const TOOL_TITLE = "Exponential Growth & Decay Calculator";
const TOOL_SLUG = "exponential-calculator";
const TOOL_DESCRIPTION =
  "Calculate discrete and continuous exponential growth, decay, doubling time, half-life, and timeline trajectories.";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `https://www.twistertools.com/tools/math-tools/${TOOL_SLUG}`;
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "math-tools",
    TOOL_SLUG
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? `https://www.twistertools.com/images/tools/math-tools/${TOOL_SLUG}.webp`
    : fs.existsSync(jpgPath)
      ? `https://www.twistertools.com/images/tools/math-tools/${TOOL_SLUG}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: TOOL_TITLE,
    description: TOOL_DESCRIPTION,
    keywords: [
      "exponential calculator",
      "growth and decay calculator",
      "doubling time calculator",
      "half life calculator",
      "continuous growth calculator",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${TOOL_TITLE} | TwisterTools`,
      description: TOOL_DESCRIPTION,
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
      description: TOOL_DESCRIPTION,
      images: [ogImageUrl]
    }
  };
}

const ExponentialCalculatorPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Strip - Modern Ambient Studio Style */}
      <div className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950">
        {/* Ambient Radial Mesh Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_75%_at_50%_-15%,rgba(99,102,241,0.12),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_65%_75%_at_50%_-15%,rgba(99,102,241,0.18),rgba(0,0,0,0))]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <div className="scrollbar-none mb-1.5 flex flex-wrap items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
              <Link className="max-w-32.5 truncate font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none" href="/">
                Home
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <Link className="max-w-32.5 truncate font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none" href="/tools/math-tools">
                Math, Geometry & STEM Science Utilities
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="max-w-32.5 truncate font-semibold text-slate-800 dark:text-slate-200 sm:max-w-50 md:max-w-none">
                {TOOL_TITLE}
              </span>
            </div>

            {/* Tool Title Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-1 shadow-xs shadow-indigo-100/60 dark:border-indigo-900/50 dark:from-slate-800 dark:to-slate-900 sm:h-14 sm:w-14 sm:rounded-2xl sm:p-2">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400 sm:h-9 sm:w-9" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-xl md:text-2xl">
                  {TOOL_TITLE}
                </h1>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 sm:line-clamp-none sm:text-sm md:text-base">
                  {TOOL_DESCRIPTION}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <ExponentialCalculator />

          <RelatedTools
            currentSlug={TOOL_SLUG}
            currentCategory="math-tools"
          />
        </div>
      </div>
    </div>
  );
};

export default ExponentialCalculatorPage;
