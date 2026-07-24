import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import {
  Cpu,
  Code,
  Lock,
  Calculator,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Globe,
  ArrowRight,
  LayoutGrid,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
} from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";

/* ─────────────────────────────────────────────────────────────────────────────
   Static Metadata (Next.js 15 App Router)
───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "All Tool Categories | TwisterTools",
  description:
    "Browse all 8 TwisterTools categories — Developer Tools, Calculators, Password Tools, Text Tools, Image Tools, Web Tools, Generator Tools, and Converter Tools. Free, fast, and browser-based.",
  alternates: { canonical: "https://www.twistertools.com/categories" },
  openGraph: {
    title: "All Tool Categories | TwisterTools",
    description:
      "Discover 8 curated categories of free online utilities. Most tools run entirely in your browser — no sign-up, no server uploads.",
    url: "https://www.twistertools.com/categories",
    siteName: "TwisterTools",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Tool Categories | TwisterTools",
    description:
      "8 categories of free browser-based tools — developer utilities, calculators, password generators, image editors, and more.",
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Category Definitions
───────────────────────────────────────────────────────────────────────────── */
type CategoryDef = {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  keywords: string[];
};

const CATEGORIES: CategoryDef[] = [
  {
    slug: "developer-tools",
    name: "Developer & Code Tools",
    description:
      "Robust formatters, cryptographic hashing modules, JWT decoders, regex testers, and diff tools engineered for developers — all client-side.",
    icon: Code,
    accentClass: "bg-violet-100 text-violet-600",
    keywords: [
      "JSON Formatter & Validator",
      "Regex Tester & Explainer",
      "JWT Decoder & Inspector",
    ],
  },
  {
    slug: "calculators",
    name: "Calculators & Unit Converters",
    description:
      "High-precision arithmetic, chronological date computations, statistical analyses, and multi-domain unit conversions at instant speed.",
    icon: Calculator,
    accentClass: "bg-emerald-100 text-emerald-600",
    keywords: [
      "Master Unit Converter",
      "Percentage Calculator",
      "Age Calculator",
    ],
  },
  {
    slug: "password-tools",
    name: "Password & Security Tools",
    description:
      "Cryptographically secure password generators, Shannon-entropy strength scoring, and simulated brute-force timelines — zero server transmission.",
    icon: Lock,
    accentClass: "bg-rose-100 text-rose-600",
    keywords: [
      "Password Generator",
      "Password Strength Checker",
      "Entropy Analyzer",
    ],
  },
  {
    slug: "text-tools",
    name: "Text Analysis & Manipulation",
    description:
      "Case converters, comma separators, word combiners, article rewriters, and full-featured rich-text editors running on optimized string buffers.",
    icon: FileText,
    accentClass: "bg-sky-100 text-sky-600",
    keywords: [
      "Case Converter",
      "Comma Separator",
      "Article Rewriter & Paraphraser",
    ],
  },
  {
    slug: "image-tools",
    name: "Image Editing & Conversion",
    description:
      "Premium canvas-based compressors, format converters, favicon generators, SVG rasterizers, and resizers — images never leave your browser.",
    icon: ImageIcon,
    accentClass: "bg-amber-100 text-amber-600",
    keywords: [
      "PNG to JPG Converter",
      "Image Compressor",
      "Favicon Generator Suite",
    ],
  },
  {
    slug: "web-tools",
    name: "Web & Network Utilities",
    description:
      "Inspect WHOIS records, validate SSL chains, query live DNS, map GeoIP coordinates, and compile XML sitemaps with real-time API telemetry.",
    icon: Globe,
    accentClass: "bg-cyan-100 text-cyan-600",
    keywords: [
      "IP Location & GeoIP Visualizer",
      "DNS Record Finder",
      "SSL Certificate Checker",
    ],
  },
  {
    slug: "generator-tools",
    name: "Generator Tools",
    description:
      "Generate QR codes, bulk UUID / GUID sequences, and test credit card numbers for validation pipelines — instantly computed in-browser.",
    icon: Cpu,
    accentClass: "bg-indigo-100 text-indigo-600",
    keywords: [
      "Bulk UUID / GUID Generator",
      "QR Code Generator",
      "Credit Card Generator",
    ],
  },
  {
    slug: "converter-tools",
    name: "Converter Utilities",
    description:
      "Translate between binary, hexadecimal, decimal, and ASCII with real-time reactive conversions and safe offline string processing.",
    icon: RefreshCw,
    accentClass: "bg-teal-100 text-teal-600",
    keywords: [
      "String to Hex Converter",
      "Text to Binary",
      "Base64 Encode / Decode",
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SEO Below-the-Fold Cards
───────────────────────────────────────────────────────────────────────────── */
type SeoCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
};

const SEO_CARDS: SeoCard[] = [
  {
    icon: ShieldCheck,
    title: "Privacy-First Architecture",
    content:
      "The vast majority of TwisterTools compute entirely inside your browser sandbox — passwords, code snippets, and image data are processed locally without a single byte sent to our servers. Tools that require external API calls (such as network lookups or certificate checks) are clearly scoped and handle only the minimum data required.",
  },
  {
    icon: Zap,
    title: "Instant, Low-Latency Execution",
    content:
      "Browser-based computation responds in milliseconds because the work runs on your own hardware, not a shared cloud server. Tools backed by external APIs are optimized for minimal latency and surface a clear loading indicator whenever a network call is in progress.",
  },
  {
    icon: Layers,
    title: "Eight Growing Specialist Categories",
    content:
      "From cryptographic developer utilities and statistical calculators to image canvas processors and live network diagnostic tools, TwisterTools is organized into eight focused categories. New tools are shipped regularly across every vertical — all free, all accessible without an account.",
  },
  {
    icon: Globe,
    title: "Free to Use, No Account Required",
    content:
      "Every tool in every category is accessible immediately with no registration, no paywall, and no time-limited trial. Optional accounts (coming soon) will unlock cloud bookmark sync and higher API quotas for server-side tools — but all core utilities remain permanently free.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function getToolCount(slug: string): number {
  return (toolsRegistry as { category: string }[]).filter(
    (t) => t.category === slug
  ).length;
}

function getTopTools(slug: string, fallback: string[]): string[] {
  const registryTools = (
    toolsRegistry as { category: string; title: string }[]
  )
    .filter((t) => t.category === slug)
    .slice(0, 3)
    .map((t) => t.title);

  if (registryTools.length >= 3) return registryTools.slice(0, 3);

  const merged = [...registryTools];
  for (const kw of fallback) {
    if (merged.length >= 3) break;
    if (!merged.includes(kw)) merged.push(kw);
  }
  return merged;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Server Component Page
───────────────────────────────────────────────────────────────────────────── */
export default function CategoriesIndexPage() {
  const totalTools = toolsRegistry.length;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Tool Categories — TwisterTools",
    description:
      "Browse 8 curated categories of free browser-based online utilities on TwisterTools.",
    url: "https://www.twistertools.com/categories",
    publisher: {
      "@type": "Organization",
      name: "TwisterTools",
      url: "https://www.twistertools.com",
    },
    hasPart: CATEGORIES.map((cat) => ({
      "@type": "WebPage",
      name: cat.name,
      description: cat.description,
      url: `https://www.twistertools.com/tools/${cat.slug}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.twistertools.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Categories",
        item: "https://www.twistertools.com/categories",
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TwisterTools Category Directory",
    numberOfItems: CATEGORIES.length,
    itemListElement: CATEGORIES.map((cat, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: cat.name,
      url: `https://www.twistertools.com/tools/${cat.slug}`,
    })),
  };

  return (
    <>
      <Script
        id="categories-collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Script
        id="categories-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="categories-itemlist-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
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
            <span className="text-white font-semibold">Categories</span>
          </nav>
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg flex-shrink-0">
              <LayoutGrid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Browse by Category</h1>
              <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-2xl leading-relaxed">
                {totalTools} free tools across {CATEGORIES.length} categories — most run entirely in your browser, no account needed.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-slate-50 min-h-screen">
        {/* Category Grid */}
        <section
          aria-label="Tool categories"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const toolCount = getToolCount(cat.slug);
              const topTools = getTopTools(cat.slug, cat.keywords);
              const CategoryIcon = cat.icon;

              return (
                <article
                  key={cat.slug}
                  className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-200 flex flex-col overflow-hidden"
                >
                  <div className="p-6 pb-4 flex-1 flex flex-col gap-4">
                    {/* Icon + Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.accentClass}`}
                      >
                        <CategoryIcon className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold tabular-nums leading-none">
                        {toolCount > 0 ? toolCount : "—"}{" "}
                        {toolCount === 1 ? "tool" : "tools"}
                      </span>
                    </div>

                    {/* Name + Description */}
                    <div>
                      <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-700 transition-colors duration-150">
                        {cat.name}
                      </h2>
                      <p className="mt-1.5 text-sm text-slate-500 leading-relaxed line-clamp-3">
                        {cat.description}
                      </p>
                    </div>

                    {/* Top 3 Featured Tools */}
                    <div className="mt-auto pt-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Featured
                      </p>
                      <ul
                        className="space-y-1.5"
                        aria-label={`Featured tools in ${cat.name}`}
                      >
                        {topTools.map((toolTitle, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{toolTitle}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Footer */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                    <Link
                      href={`/tools/${cat.slug}`}
                      id={`explore-${cat.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 group-hover:gap-2.5 transition-all duration-150"
                      aria-label={`Explore all ${cat.name} tools`}
                    >
                      Explore Category
                      <ArrowRight
                        className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* SEO Below-the-Fold Cards */}
        <section
          aria-label="About TwisterTools categories"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-2"
        >
          <div className="border-t border-slate-200 pt-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Why TwisterTools?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SEO_CARDS.map((card) => {
                const SeoIcon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="bg-white border-l-4 border-indigo-500 rounded-r-2xl rounded-l-sm p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <SeoIcon className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {card.content}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
