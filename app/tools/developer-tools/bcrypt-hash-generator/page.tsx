import type { Metadata, NextPage } from "next";
import fs from "node:fs";
import path from "node:path";
import { KeyRound } from "lucide-react";
import BcryptHashGenerator from "@/components/tools/BcryptHashGenerator";
import RelatedTools from "@/components/RelatedTools";

const TOOL_TITLE = "BCRYPT Password Hash Generator & Salt Verifier";
const TOOL_SLUG = "bcrypt-hash-generator";
const TOOL_DESCRIPTION =
  "Generate secure BCRYPT password hashes with configurable salt rounds and verify candidate strings with constant-time equality check in your browser.";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalUrl = `https://www.twistertools.com/tools/developer-tools/${TOOL_SLUG}`;
  const imageBasePath = path.join(
    process.cwd(),
    "public",
    "images",
    "tools",
    "developer-tools",
    TOOL_SLUG
  );
  const webpPath = `${imageBasePath}.webp`;
  const jpgPath = `${imageBasePath}.jpg`;
  const ogImageUrl = fs.existsSync(webpPath)
    ? `https://www.twistertools.com/images/tools/developer-tools/${TOOL_SLUG}.webp`
    : fs.existsSync(jpgPath)
      ? `https://www.twistertools.com/images/tools/developer-tools/${TOOL_SLUG}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: TOOL_TITLE,
    description: TOOL_DESCRIPTION,
    keywords: [
      "bcrypt hash generator",
      "bcrypt verifier",
      "blowfish salt",
      "password hashing",
      "bcrypt cost factor",
      "bcrypt salt rounds",
      "developer tools",
      "twistertools",
    ],
    alternates: {
      canonical: canonicalUrl,
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
          alt: `${TOOL_TITLE} on TwisterTools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${TOOL_TITLE} | TwisterTools`,
      description: TOOL_DESCRIPTION,
      images: [ogImageUrl],
    },
  };
}

const BcryptHashGeneratorPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mb-2 truncate flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
              <a
                href="/"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
              >
                Home
              </a>
              <span>/</span>
              <a
                href="/tools/developer-tools"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
              >
                Developer, Code & Web Engineering Tools
              </a>
              <span>/</span>
              <span className="text-slate-900 dark:text-white max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
                BCRYPT Password Hash Generator & Salt Verifier
              </span>
            </div>

            {/* Tool Title & Description */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 p-1 sm:p-2 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <KeyRound className="w-7 h-7 sm:w-10 sm:h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Interactive Tool Interface */}
          <BcryptHashGenerator />

          {/* Social Sharing Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate flex-1">
                Found this tool helpful?{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Share it with others!
                </span>
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Facebook */}
                <div className="relative group">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.twistertools.com/tools/developer-tools/${TOOL_SLUG}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[#1877f2] hover:bg-[#0c63d4] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on Facebook
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* X / Twitter */}
                <div className="relative group">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.twistertools.com/tools/developer-tools/${TOOL_SLUG}`)}&text=${encodeURIComponent("Check out this BCRYPT Password Hash Generator & Salt Verifier tool!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X (Twitter)"
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[#1da1f2] hover:bg-[#0c8bd9] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on X
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>

                {/* LinkedIn */}
                <div className="relative group">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://www.twistertools.com/tools/developer-tools/${TOOL_SLUG}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                    className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[#0077b5] hover:bg-[#005885] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-10">
                    Share on LinkedIn
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Tools */}
          <RelatedTools currentSlug={TOOL_SLUG} currentCategory="developer-tools" />
        </div>
      </div>
    </div>
  );
};

export default BcryptHashGeneratorPage;
