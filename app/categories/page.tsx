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
  FileCheck2,
  Image as ImageIcon,
  Globe,
  ArrowRight,
  LayoutGrid,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Calendar,
  Dices,
  Home,
  Binary,
  Activity,
} from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";

/* ─────────────────────────────────────────────────────────────────────────────
   Static Metadata (Next.js 15 App Router)
───────────────────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: "All Tool Categories",
  description:
    "Browse all 14 TwisterTools categories — Developer Tools, Calculators, Passwords, Text, Images, PDFs, Web/SEO, Generators, Converters, Date & Time, Randomization, Home Living, Math & STEM, and Health, Fitness & Biological Utilities. Free, fast, and browser-based.",
  alternates: { canonical: "https://www.twistertools.com/categories" },
  openGraph: {
    title: "All Tool Categories | TwisterTools",
    description:
      "Discover 14 curated categories of free online utilities. Most tools run entirely in your browser — no sign-up, no server uploads.",
    url: "https://www.twistertools.com/categories",
    siteName: "TwisterTools",
    type: "website",
    images: [
      {
        url: "https://www.twistertools.com/images/categories.jpg",
        width: 1200,
        height: 630,
        alt: "TwisterTools — All Tool Categories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Tool Categories | TwisterTools",
    description:
      "14 categories of free browser-based tools — developer utilities, calculators, password generators, PDF document tools, image editors, and health utilities.",
    images: ["https://www.twistertools.com/images/categories.jpg"],
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
    name: "Developer, Code & Web Engineering Tools",
    description:
      "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
    icon: Code,
    accentClass: "bg-violet-100 text-violet-600",
    keywords: [
      "json formatter",
      "css gradient generator",
      "regex tester",
      "base64 encoder",
      "jwt decoder",
    ],
  },
  {
    slug: "calculators",
    name: "Daily Essentials, Financial & Math Calculators",
    description:
      "Fast, privacy-first online calculators for investments, loans, health, percentages, and daily math computations.",
    icon: Calculator,
    accentClass: "bg-emerald-100 text-emerald-600",
    keywords: [
      "financial calculators",
      "investment tools",
      "math calculators",
      "loan estimators",
      "unit converters",
    ],
  },
  {
    slug: "password-tools",
    name: "Password Management & Security Utilities",
    description:
      "Generate cryptographically strong passphrases and analyze password crack times 100% locally with zero data exposure.",
    icon: Lock,
    accentClass: "bg-rose-100 text-rose-600",
    keywords: [
      "password generator",
      "password strength checker",
      "passphrase generator",
    ],
  },
  {
    slug: "text-tools",
    name: "Text Analysis, List Comparison & Editing Tools",
    description:
      "Powerful browser-native utilities to compare lists, extract URLs, format text, analyze word counts, and style fonts.",
    icon: FileText,
    accentClass: "bg-sky-100 text-sky-600",
    keywords: [
      "list comparison",
      "url extractor",
      "duplicate line remover",
      "text case converter",
      "word counter",
    ],
  },
  {
    slug: "image-tools",
    name: "Image Editing, Compression & Conversion Tools",
    description:
      "Convert HEIC/SVG/PNG graphics, scale pixel dimensions, generate favicons, and compress images locally in browser RAM.",
    icon: ImageIcon,
    accentClass: "bg-amber-100 text-amber-600",
    keywords: [
      "image compressor",
      "image resizer",
      "heic to jpg",
      "svg converter",
      "favicon generator",
    ],
  },
  {
    slug: "web-tools",
    name: "SEO, Domain & Network Inspector Tools",
    description:
      "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
    icon: Globe,
    accentClass: "bg-cyan-100 text-cyan-600",
    keywords: [
      "domain age checker",
      "what is my ip",
      "dns record finder",
      "ssl checker",
      "sitemap generator",
    ],
  },
  {
    slug: "pdf-tools",
    name: "PDF & Document Utilities",
    description:
      "Fast, secure, and privacy-first PDF document processing engines for converting, merging, compressing, and editing PDF files.",
    icon: FileCheck2,
    accentClass: "bg-orange-100 text-orange-600",
    keywords: [
      "merge pdf",
      "compress pdf",
      "unlock pdf",
      "pdf to image",
      "pdf metadata editor",
    ],
  },
  {
    slug: "generator-tools",
    name: "Random Data, Identity & Key Generators",
    description:
      "Generate secure UUIDs, QR codes, test credit cards, mock identities, and random strings with cryptographic precision.",
    icon: Cpu,
    accentClass: "bg-indigo-100 text-indigo-600",
    keywords: [
      "qr code generator",
      "uuid generator",
      "test credit card",
      "password generator",
    ],
  },
  {
    slug: "converter-tools",
    name: "Data & Number Base Converter Utilities",
    description:
      "Convert binary strings, ASCII codes, hexadecimals, bytes, and number bases instantly with real-time telemetry.",
    icon: RefreshCw,
    accentClass: "bg-teal-100 text-teal-600",
    keywords: [
      "binary converter",
      "byte converter",
      "hex to string",
      "number base converter",
    ],
  },
  {
    slug: "date-tools",
    name: "Date, Time & Scheduling Tools",
    description:
      "Fast, precise, and privacy-first utilities for calculating date differences, timezone conversions, workdays, countdowns, and schedule planning.",
    icon: Calendar,
    accentClass: "bg-fuchsia-100 text-fuchsia-600",
    keywords: [
      "date calculator",
      "timezone converter",
      "workday calculator",
      "countdown timer",
      "schedule planner",
    ],
  },
  {
    slug: "random-tools",
    name: "Randomization, Games & Decision Tools",
    description:
      "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
    icon: Dices,
    accentClass: "bg-pink-100 text-pink-600",
    keywords: [
      "random picker",
      "dice roller",
      "coin flipper",
      "team generator",
    ],
  },
  {
    slug: "home-tools",
    name: "Home, Garden & Kitchen Living Utilities",
    description:
      "Fast, privacy-first everyday calculation engines and measurement tools for home improvement, culinary conversions, gardening, and DIY living.",
    icon: Home,
    accentClass: "bg-orange-100 text-orange-600",
    keywords: [
      "culinary conversions",
      "gardening calculators",
      "diy living tools",
      "home improvement calculators",
    ],
  },
  {
    slug: "math-tools",
    name: "Math, Geometry & STEM Science Utilities",
    description:
      "Interactive geometry solvers, physics mechanics formulas, thermodynamic atmospheric calculators, and precision STEM calculation engines.",
    icon: Binary,
    accentClass: "bg-purple-100 text-purple-600",
    keywords: [
      "geometry calculator",
      "physics formulas",
      "thermodynamics calculator",
      "stem math tools",
      "scientific calculator",
    ],
  },
  {
    slug: "health-tools",
    name: "Health, Fitness & Biological Utilities",
    description:
      "Fast, privacy-first body composition calculators, athletic performance estimators, sleep and metabolic trackers, and clinical wellness utilities.",
    icon: Activity,
    accentClass: "bg-emerald-100 text-emerald-600",
    keywords: [
      "bmi calculator",
      "tdee calculator",
      "calorie deficit",
      "body fat percentage",
      "target heart rate zones",
      "sleep cycle tracker",
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
    title: "Fourteen Growing Specialist Categories",
    content:
      "From cryptographic developer utilities and statistical calculators to image canvas processors, PDF document engines, and health and fitness estimators, TwisterTools is organized into fourteen focused categories. New tools are shipped regularly across every vertical — all free, all accessible without an account.",
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
      "Browse 14 curated categories of free browser-based online utilities on TwisterTools.",
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
