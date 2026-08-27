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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 md:py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1.5 flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
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

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex self-stretch items-center justify-center shrink-0 bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Timer className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  Pace, Distance & Running Time Calculator
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
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
