import type { Metadata, NextPage } from "next";
import Link from "next/link";
import { Scissors } from "lucide-react";
import RemovePdfPages from "@/components/tools/RemovePdfPages";
import RelatedTools from "@/components/RelatedTools";

export const metadata: Metadata = {
  title: "Remove & Delete PDF Pages",
  description:
    "Delete unwanted PDF pages visually or by range completely online and free.",
  keywords: [
    "remove pdf pages",
    "delete pdf pages",
    "remove pages from pdf",
    "delete page range pdf",
    "pdf page remover",
    "client-side pdf page deletion",
    "twistertools",
  ],
  openGraph: {
    title: "Remove & Delete PDF Pages | TwisterTools",
    description:
      "Delete unwanted PDF pages visually or by range completely online and free.",
    url: "https://www.twistertools.com/tools/pdf-tools/remove-pdf-pages",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/tools/pdf-tools/remove-pdf-pages.jpg",
        width: 1200,
        height: 630,
        alt: "Remove & Delete PDF Pages Tool on TwisterTools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remove & Delete PDF Pages | TwisterTools",
    description:
      "Delete unwanted PDF pages visually or by range completely online and free.",
    images: [
      "https://www.twistertools.com/images/tools/pdf-tools/remove-pdf-pages.jpg",
    ],
  },
  alternates: {
    canonical: "https://www.twistertools.com/tools/pdf-tools/remove-pdf-pages",
  },
};

const RemovePdfPagesPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-50/80 via-white to-slate-50/50 dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-2 md:py-3">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1.5 font-medium flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
              <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
                Home
              </Link>
              <span>/</span>
              <Link
                href="/tools/pdf-tools"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
              >
                PDF & Document Utilities
              </Link>
              <span>/</span>
              <span className="text-slate-900 dark:text-white max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
                Remove & Delete PDF Pages
              </span>
            </div>

            {/* Tool Title & Description */}
            <div className="flex items-start gap-3 mt-2">
              <div className="w-14 h-14 rounded-2xl flex self-stretch items-center justify-center flex-shrink-0 bg-indigo-50/70 dark:bg-slate-800 shadow-sm">
                <Scissors className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  Remove & Delete PDF Pages
                </h1>
                <p className="text-base text-slate-600 dark:text-slate-400 leading-snug">
                  Delete unwanted PDF pages visually or by range completely online and free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Interactive Tool Interface */}
          <RemovePdfPages />

          {/* Social Sharing Card */}
          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 flex-1">
                Found this tool helpful?{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Share it with others!
                </span>
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Facebook */}
                <div className="relative group">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/remove-pdf-pages")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on Facebook"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1877f2] hover:bg-[#0c63d4] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/remove-pdf-pages")}&text=${encodeURIComponent("Delete unwanted PDF pages visually or by range completely online and free.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on X (Twitter)"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1da1f2] hover:bg-[#0c8bd9] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.twistertools.com/tools/pdf-tools/remove-pdf-pages")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Share on LinkedIn"
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#0077b5] hover:bg-[#005885] text-white transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
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
          <RelatedTools currentSlug="remove-pdf-pages" currentCategory="pdf-tools" />
        </div>
      </div>
    </div>
  );
};

export default RemovePdfPagesPage;
