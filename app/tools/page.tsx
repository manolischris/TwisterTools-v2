import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ChevronRight, Layers } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import ToolsDirectoryClient from "@/components/tools/ToolsDirectoryClient";

/* ─────────────────────────────────────────────────────────
   Static Metadata (Next.js 15 App Router)
───────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "All Online Utilities & Tools",
  description:
    "Browse 50+ free online utilities: developer tools, calculators, converters, password tools, image tools, text tools, web tools, and generators — most run entirely in your browser.",
  alternates: { canonical: "https://twistertools.com/tools" },
  openGraph: {
    title: "All Online Utilities & Tools | TwisterTools",
    description:
      "50+ free online tools for developers, designers, and power users. Most tools run entirely in your browser — fast, private, and free.",
    url: "https://twistertools.com/tools",
    siteName: "TwisterTools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Online Utilities & Tools | TwisterTools",
    description:
      "60+ free online tools — most run in your browser with no server calls. Calculators, converters, developer tools & more.",
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
      "TwisterTools already spans eight categories: Developer & Code Tools, Calculators, Password & Security Tools, Text Tools, Image Tools, Web Tools, Generator Tools, and Converter Tools. New tools — including document processors, AI-assisted utilities, and more — are added regularly. Every tool is built to professional standards with full keyboard accessibility and mobile-first layouts.",
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
  const totalTools = toolsRegistry.length;

  /* JSON-LD CollectionPage schema */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Online Utilities & Tools",
    description:
      "Browse all 50+ free online utilities and tools on TwisterTools — developer tools, calculators, converters, password managers, image tools, text utilities, and more.",
    url: "https://twistertools.com/tools",
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
          <ToolsDirectoryClient tools={toolsRegistry} />
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
