import Link from "next/link";
import type { Metadata, NextPage } from "next";
import fs from "node:fs";
import path from "node:path";
import { Binary } from "lucide-react";
import RelatedTools from "@/components/RelatedTools";
import PermutationCombinationCalculator from "@/components/tools/PermutationCombinationCalculator";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://www.twistertools.com/tools/math-tools/permutation-combination-calculator";
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "math-tools",
    "permutation-combination-calculator"
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? "https://www.twistertools.com/images/tools/math-tools/permutation-combination-calculator.webp"
    : fs.existsSync(jpgPath)
      ? "https://www.twistertools.com/images/tools/math-tools/permutation-combination-calculator.jpg"
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Permutation & Combination Calculator (nPr & nCr)",
    description:
      "Calculate permutations (nPr) and combinations (nCr) with exact BigInt precision, step-by-step math derivations, and repetition toggles.",
    keywords: [
      "permutation calculator",
      "combination calculator",
      "npr calculator",
      "ncr calculator",
      "combinatorics calculator",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: "Permutation & Combination Calculator (nPr & nCr) | TwisterTools",
      description:
        "Calculate permutations (nPr) and combinations (nCr) with exact BigInt precision, step-by-step math derivations, and repetition toggles.",
      url: canonicalUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Permutation & Combination Calculator"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Permutation & Combination Calculator (nPr & nCr) | TwisterTools",
      description:
        "Calculate permutations (nPr) and combinations (nCr) with exact BigInt precision, step-by-step math derivations, and repetition toggles.",
      images: [ogImageUrl]
    }
  };
}

const PermutationCombinationCalculatorPage: NextPage = () => {
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
                Permutation & Combination Calculator
              </span>
            </div>

            {/* Tool Title Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-1 shadow-xs shadow-indigo-100/60 dark:border-indigo-900/50 dark:from-slate-800 dark:to-slate-900 sm:h-14 sm:w-14 sm:rounded-2xl sm:p-2">
                <Binary className="h-6 w-6 text-indigo-600 dark:text-indigo-400 sm:h-9 sm:w-9" />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-xl md:text-2xl">
                  Permutation & Combination Calculator
                </h1>
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 sm:line-clamp-none sm:text-sm md:text-base">
                  Calculate permutations (nPr) and combinations (nCr) with exact BigInt precision and full step-by-step derivations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <PermutationCombinationCalculator />

          <RelatedTools
            currentSlug="permutation-combination-calculator"
            currentCategory="math-tools"
          />
        </div>
      </div>
    </div>
  );
};

export default PermutationCombinationCalculatorPage;