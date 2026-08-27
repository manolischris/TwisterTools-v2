import type { Metadata, NextPage } from "next";
import fs from "node:fs";
import path from "node:path";
import { Calculator } from "lucide-react";
import RelatedTools from "@/components/RelatedTools";
import QuadraticSolver from "@/components/tools/QuadraticSolver";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://www.twistertools.com/tools/math-tools/quadratic-solver";
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "calculators",
    "quadratic-solver"
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? "https://www.twistertools.com/images/tools/math-tools/quadratic-solver.webp"
    : fs.existsSync(jpgPath)
      ? "https://www.twistertools.com/images/tools/math-tools/quadratic-solver.jpg"
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Quadratic Equation Solver & Visualizer",
    description:
      "Solve quadratic equations instantly with real and complex roots, discriminant analysis, vertex details, and interactive 2D parabola graph visualization.",
    keywords: [
      "quadratic equation solver",
      "quadratic formula calculator",
      "discriminant calculator",
      "parabola graph visualizer",
      "complex roots calculator",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: "Quadratic Equation Solver & Visualizer | TwisterTools",
      description:
        "Solve quadratic equations instantly with real and complex roots, discriminant analysis, vertex details, and interactive 2D parabola graph visualization.",
      url: canonicalUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Quadratic Equation Solver & Visualizer"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Quadratic Equation Solver & Visualizer | TwisterTools",
      description:
        "Solve quadratic equations instantly with real and complex roots, discriminant analysis, vertex details, and interactive 2D parabola graph visualization.",
      images: [ogImageUrl]
    }
  };
}

const QuadraticSolverPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-linear-to-r from-slate-50/80 via-white to-indigo-50/70 dark:from-slate-900/50 dark:via-slate-950 dark:to-indigo-950/40 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-2 md:py-3">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1.5 flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
              <a href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate">
                Home
              </a>
              <span>/</span>
              <a
                href="/tools/math-tools"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-32.5 sm:max-w-50 md:max-w-none truncate"
              >
                Math, Geometry & STEM Science Utilities
              </a>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-medium max-w-32.5 sm:max-w-50 md:max-w-none truncate">
                Quadratic Equation Solver & Visualizer
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex self-stretch items-center justify-center shrink-0 bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Calculator className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  Quadratic Equation Solver & Visualizer
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                  Solve quadratic equations instantly with real and complex roots, discriminant analysis, vertex details, and interactive 2D parabola graph visualization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <QuadraticSolver />

          <RelatedTools
            currentSlug="quadratic-solver"
            currentCategory="math-tools"
          />
        </div>
      </div>
    </div>
  );
};

export default QuadraticSolverPage;
