import type { Metadata, NextPage } from "next";
import fs from "node:fs";
import path from "node:path";
import { Grid } from "lucide-react";
import RelatedTools from "@/components/RelatedTools";
import MatrixCalculator from "@/components/tools/MatrixCalculator";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = "https://www.twistertools.com/tools/math-tools/matrix-calculator";
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "math-tools",
    "matrix-calculator"
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? "https://www.twistertools.com/images/tools/math-tools/matrix-calculator.webp"
    : fs.existsSync(jpgPath)
      ? "https://www.twistertools.com/images/tools/math-tools/matrix-calculator.jpg"
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Matrix Mathematics & Determinant Calculator",
    description:
      "Solve determinants, matrix inversions, transpositions, and scalar multiplication with step-by-step proofs.",
    keywords: [
      "matrix calculator",
      "determinant calculator",
      "matrix inverse solver",
      "matrix transpose tool",
      "linear algebra calculator",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: "Matrix Mathematics & Determinant Calculator | TwisterTools",
      description:
        "Solve determinants, matrix inversions, transpositions, and scalar multiplication with step-by-step proofs.",
      url: canonicalUrl,
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Matrix Mathematics & Determinant Calculator"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Matrix Mathematics & Determinant Calculator | TwisterTools",
      description:
        "Solve determinants, matrix inversions, transpositions, and scalar multiplication with step-by-step proofs.",
      images: [ogImageUrl]
    }
  };
}

const MatrixCalculatorPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-linear-to-r from-slate-50/80 via-white to-indigo-50/70 dark:from-slate-900/50 dark:via-slate-950 dark:to-indigo-950/40 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-2 truncate flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
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
                Matrix Mathematics & Determinant Calculator
              </span>
            </div>

            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Grid className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  Matrix Mathematics & Determinant Calculator
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  Solve determinants, matrix inversions, transpositions, and scalar multiplication with step-by-step proofs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <MatrixCalculator />

          <RelatedTools
            currentSlug="matrix-calculator"
            currentCategory="math-tools"
          />
        </div>
      </div>
    </div>
  );
};

export default MatrixCalculatorPage;
