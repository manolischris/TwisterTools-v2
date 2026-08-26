import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ChevronRight, Layers } from "lucide-react";
import ToolsDirectoryClient from "@/components/tools/ToolsDirectoryClient";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────
   Static Metadata (Next.js 15 App Router)
───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "All Online Utilities & Tools",
  description:
    "Browse hundreds of free, privacy-first online tools, calculators, and converters. Fast, browser-native utilities that run 100% in your local memory with zero data uploads.",
  alternates: { canonical: "https://www.twistertools.com/tools" },
  openGraph: {
    title: "All Online Utilities & Tools | TwisterTools",
    description:
      "Browse hundreds of free, privacy-first online tools, calculators, and converters. Fast, browser-native utilities that run 100% in your local memory with zero data uploads.",
    url: "https://www.twistertools.com/tools",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/tools.jpg",
        width: 1200,
        height: 630,
        alt: "TwisterTools — All Online Utilities & Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Online Utilities & Tools | TwisterTools",
    description:
      "60+ free online tools — most run in your browser with no server calls. Calculators, converters, developer tools & more.",
    images: ["https://www.twistertools.com/images/tools.jpg"],
  },
};

/* ─────────────────────────────────────────────────────────
   SEO Content Cards
───────────────────────────────────────────────────────── */
const SEO_CARDS = [
  {
    icon: "ShieldCheck",
    title: "Privacy-First by Default",
    content:
      "The majority of TwisterTools run entirely inside your browser's sandbox — your passwords, code, and files are processed locally without being sent anywhere. Tools that do require a server call (such as network lookups or document processing) are clearly scoped and handle only the minimum data needed to function.",
  },
  {
    icon: "Zap",
    title: "Instant, Low-Latency Performance",
    content:
      "Browser-based tools respond instantly because computation runs on your own hardware — no waiting for a shared server. Tools that reach out to external APIs are optimized for speed and will clearly indicate when a network request is in progress.",
  },
  {
    icon: "Layers",
    title: "A Growing Library of Utilities",
    content:
      "TwisterTools already spans eleven categories: Developer, Code & Web Engineering Tools, Daily Essentials, Financial & Math Calculators, Password Management & Security Utilities, Text Analysis, List Comparison & Editing Tools, Image Editing, Compression & Conversion Tools, SEO, Domain & Network Inspector Tools, Random Data, Identity & Key Generators, Data & Number Base Converter Utilities, PDF & Document Utilities, Date, Time & Scheduling Tools, and Randomization, Games & Decision Tools. New tools are added regularly — all free and mobile-first.",
  },
  {
    icon: "Globe",
    title: "Free to Use, No Account Needed Today",
    content:
      "All current tools are free with no sign-up required. As TwisterTools grows, optional accounts will unlock extras like cloud-synced bookmarks and higher usage limits for server-side tools — but core utilities will always remain freely accessible.",
  },
];

/* ─────────────────────────────────────────────────────────
   Server Page
───────────────────────────────────────────────────────── */
export default function ToolsDirectoryPage() {
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;
  const totalTools = toolsRegistry.length;

  /* JSON-LD CollectionPage schema */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Online Utilities & Tools",
    description:
      "Browse all 50+ free online utilities and tools on TwisterTools — developer tools, calculators, converters, password managers, image tools, text utilities, and more.",
    url: "https://www.twistertools.com/tools",
    publisher: {
      "@type": "Organization",
      name: "TwisterTools",
      url: "https://twistertools.com",
    },
    hasPart: toolsRegistry.map((tool) => ({
      "@type": "SoftwareApplication",
      name: tool.title,
      description: tool.description,
      url: `https://twistertools.com${tool.href}`,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })),
  };

  return (
    <>
      <Script
        id="tools-directory-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header: Edge-to-Edge Slate-to-Indigo Title Bar */}
      <header className="relative overflow-hidden bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-indigo-700/50 shadow-md">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/og-hero.jpg"
            alt="TwisterTools Background Visual"
            fill
            priority
            className="object-cover object-center opacity-50 mix-blend-luminosity"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto">
          <nav className="flex items-center space-x-2 text-xs sm:text-sm text-indigo-100 mb-4 font-medium" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-semibold">Tools</span>
          </nav>
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">All Online Utilities & Tools</h1>
              <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl leading-relaxed">
                {totalTools} free online tools — most run entirely in your browser, with no account required to get started.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Client Section ──────────────────────────────── */}
      <main className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ToolsDirectoryClient
            tools={[...toolsRegistry]
              .map((tool, idx) => ({ ...tool, originalIndex: idx }))
              .sort((a, b) => {
                const aFeatured = a.isFeatured ? 1 : 0;
                const bFeatured = b.isFeatured ? 1 : 0;
                if (aFeatured !== bFeatured) return bFeatured - aFeatured;
                return b.originalIndex - a.originalIndex;
              })}
          />
        </div>

        {/* ── SEO Below-the-Fold Cards ─────────────────────── */}
        <section
          aria-label="About TwisterTools"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Why TwisterTools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SEO_CARDS.map((card) => (
              <article
                key={card.title}
                className="bg-white border-l-4 border-indigo-500 rounded-r-2xl rounded-l-sm p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {card.content}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
