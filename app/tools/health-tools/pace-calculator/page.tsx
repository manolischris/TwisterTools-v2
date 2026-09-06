import type { Metadata, NextPage } from "next";
import { Timer } from "lucide-react";
import PaceCalculator from "@/components/tools/PaceCalculator";
import RelatedTools from "@/components/RelatedTools";

export const metadata: Metadata = {
  title: "Pace, Distance & Running Time Calculator",
  description:
    "Calculate running pace, race finish time, splits, and distance with imperial and metric support.",
  keywords: [
    "pace calculator",
    "running pace calculator",
    "race time calculator",
    "distance calculator",
    "split time calculator",
    "twistertools"
  ],
  openGraph: {
    title: "Pace, Distance & Running Time Calculator | TwisterTools",
    description:
      "Calculate running pace, race finish time, splits, and distance with imperial and metric support.",
    url: "https://www.twistertools.com/tools/health-tools/pace-calculator",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/tools/health-tools/pace-calculator.jpg",
        width: 1200,
        height: 630,
        alt: "Pace, Distance & Running Time Calculator on TwisterTools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pace, Distance & Running Time Calculator | TwisterTools",
    description:
      "Calculate running pace, race finish time, splits, and distance with imperial and metric support.",
    images: [
      "https://www.twistertools.com/images/tools/health-tools/pace-calculator.jpg",
    ],
  },
  alternates: {
    canonical: "https://www.twistertools.com/tools/health-tools/pace-calculator"
  }
};

const PaceCalculatorPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-linear-to-r from-indigo-50/80 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-2 truncate flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
              <a href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate">
                Home
              </a>
              <span>/</span>
              <a
                href="/tools/health-tools"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate"
              >
                Health, Fitness & Biological Utilities
              </a>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-medium max-w-32.5 sm:max-w-50 md:max-w-none truncate">
                Pace, Distance & Running Time Calculator
              </span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Timer className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Pace, Distance & Running Time Calculator
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Calculate running pace, race finish time, splits, and distance with imperial and metric support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <PaceCalculator />

          <RelatedTools
            currentSlug="pace-calculator"
            currentCategory="health-tools"
          />
        </div>
      </div>
    </div>
  );
};

export default PaceCalculatorPage;
