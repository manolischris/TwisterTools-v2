import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Sunrise } from "lucide-react";
import SunriseSunsetCalculator from "@/components/tools/SunriseSunsetCalculator";
import RelatedTools from "@/components/RelatedTools";
import CopyLinkButton from "@/components/CopyLinkButton";

const TOOL_TITLE = "Sunrise & Sunset Time Estimator";
const TOOL_SLUG = "sunrise-sunset-calculator";
const TOOL_DESCRIPTION =
  "Calculate accurate sunrise, sunset, twilight phases, golden hour, and daylight duration for any coordinates.";
const TOOL_META_DESCRIPTION =
  "Calculate precise sunrise, sunset, solar noon, dawn, dusk, golden hour, and day length for any global coordinates using NOAA astronomical algorithms.";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `https://www.twistertools.com/tools/date-tools/${TOOL_SLUG}`;
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "date-tools",
    TOOL_SLUG
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? `https://www.twistertools.com/images/tools/date-tools/${TOOL_SLUG}.webp`
    : fs.existsSync(jpgPath)
      ? `https://www.twistertools.com/images/tools/date-tools/${TOOL_SLUG}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Sunrise & Sunset Time Estimator",
    description: TOOL_META_DESCRIPTION,
    keywords: [
      "sunrise calculator",
      "sunset calculator",
      "solar noon",
      "golden hour",
      "day length calculator",
      "dawn and dusk",
      "NOAA solar calculations",
      "twistertools"
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: "Sunrise & Sunset Time Estimator | TwisterTools",
      description: TOOL_META_DESCRIPTION,
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
      title: "Sunrise & Sunset Time Estimator | TwisterTools",
      description: TOOL_META_DESCRIPTION,
      images: [ogImageUrl]
    }
  };
}

export default function SunriseSunsetCalculatorPage() {
  const toolUrl = `https://www.twistertools.com/tools/date-tools/${TOOL_SLUG}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header Strip */}
      <div className="border-b border-slate-200 bg-linear-to-r from-slate-50/80 via-white to-indigo-50/70 dark:border-slate-700 dark:from-slate-900/50 dark:via-slate-950 dark:to-indigo-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb */}
            <div className="scrollbar-none mb-2 flex flex-wrap items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 truncate">
              <Link
                href="/"
                className="max-w-32.5 truncate transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none"
              >
                Home
              </Link>
              <span>/</span>
              <Link
                href="/tools/date-tools"
                className="max-w-32.5 truncate transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 sm:max-w-50 md:max-w-none"
              >
                Date, Time &amp; Scheduling Tools
              </Link>
              <span>/</span>
              <span className="max-w-32.5 truncate font-medium text-slate-900 dark:text-white sm:max-w-50 md:max-w-none">
                Sunrise &amp; Sunset Time Estimator
              </span>
            </div>

            {/* Tool Title Row */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Sunrise className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                  {TOOL_TITLE}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {TOOL_DESCRIPTION}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 md:px-8 md:py-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <SunriseSunsetCalculator />

          {/* Social Share Bar */}
          <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-slate-600 dark:text-slate-400">
                Found this tool helpful?{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">Share it with others!</span>
              </p>

              <div className="flex shrink-0 items-center gap-2">
                {/* Facebook */}
                <div className="group relative">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(toolUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877f2] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0c63d4] hover:shadow-md"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
                    Share on Facebook
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* X / Twitter */}
                <div className="group relative">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(toolUrl)}&text=${encodeURIComponent(`Check out this free ${TOOL_TITLE}!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1da1f2] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0c8bd9] hover:shadow-md"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
                    Share on X
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* LinkedIn */}
                <div className="group relative">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(toolUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0077b5] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#005885] hover:shadow-md"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
                    Share on LinkedIn
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* Copy URL */}
                <div className="group relative">
                  <CopyLinkButton url={toolUrl} />
                  <span className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
                    Copy URL
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <RelatedTools currentSlug={TOOL_SLUG} currentCategory="date-tools" />
        </div>
      </main>
    </div>
  );
}
