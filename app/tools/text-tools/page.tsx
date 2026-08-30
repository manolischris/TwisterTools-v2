import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText, Type, RefreshCw, Layers, HelpCircle, AlignLeft, Replace, ArrowRightLeft, Key, Radio, Zap, Strikethrough, Table, Terminal, ShieldCheck, Eraser } from "lucide-react";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const category = "text-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Text Analysis, List Comparison & Editing Tools",
    description:
      "Powerful browser-native text tools to compare lists, find set differences, format cases, and process bulk text securely client-side.",
    keywords: [
      "text tools",
      "list comparison",
      "set difference finder",
      "case converter",
      "comma separator",
      "word combiner"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/text-tools"
    },
    openGraph: {
      title: "Text Analysis, List Comparison & Editing Tools - TwisterTools",
      description:
        "Powerful browser-native text tools to compare lists, find set differences, format cases, and process bulk text securely client-side.",
      url: "https://www.twistertools.com/tools/text-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Text Analysis, List Comparison & Editing Tools"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "Text Analysis, List Comparison & Editing Tools - TwisterTools",
      description:
        "Powerful browser-native text tools to compare lists, find set differences, format cases, and process bulk text securely client-side.",
      images: [featuredImage]
    }
  };
}

const textToolsMeta = {
  name: "Text Analysis, List Comparison & Editing Tools",
  description:
    "Powerful browser-native utilities to compare lists, extract differences, transform text cases, and process long datasets privately in your browser.",
  cards: [
    {
      title: "List Comparison & Set Logic",
      icon: "Layers",
      content:
        "Run intersection, union, and set-difference operations on two lists instantly. Ideal for follower audits, lead cleaning, dedupe checks, and QA record validation."
    },
    {
      title: "Case, Delimiter, and Cleanup Operations",
      icon: "RefreshCw",
      content:
        "Convert text casing, normalize spacing, and shift between line-based and delimiter-based formats for spreadsheets, SQL arrays, and automation workflows."
    },
    {
      title: "Bulk Text Processing at Browser Speed",
      icon: "Type",
      content:
        "All parsing and text transformation runs client-side with zero server uploads. Process sensitive datasets directly on your device without data exposure."
    }
  ],
  faqs: [
    {
      q: "Do these text tools upload my list data to servers?",
      a: "No. All list parsing, comparisons, and formatting are executed inside your browser session."
    },
    {
      q: "Can I compare Instagram followers and following exports?",
      a: "Yes. The Compare Two Lists tool supports Instagram export parsing and ZIP-based extraction workflows."
    },
    {
      q: "Is there a line limit for list comparison?",
      a: "Most modern devices can process very large lists quickly, but practical limits depend on available browser memory."
    }
  ]
};

export default function TextToolsCategoryPage() {
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;

  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "text-tools")
    .map((tool) => {
      if (tool.id === "compare-two-lists") {
        return {
          ...tool,
          title: "Compare Two Lists & Set Difference Finder",
          description:
            "Compare two lists online to find missing items, set differences, intersections, and unfollowers from Instagram data exports.",
          iconName: "ArrowLeftRight"
        };
      }
      if (tool.id === "character-frequency-counter") {
        return {
          ...tool,
          title: "Character Frequency Counter",
          description:
            "Analyze letter occurrence counts, character density percentages, and symbol frequencies in real time.",
          iconName: "Hash"
        };
      }
      if (tool.id === "reading-time-calculator") {
        return {
          ...tool,
          title: "Reading Time Calculator",
          description:
            "Estimate silent reading time and speech presentation duration based on word counts and custom WPM speeds.",
          iconName: "Clock"
        };
      }
      if (tool.id === "text-replacer") {
        return {
          ...tool,
          title: "Text Replace & Pattern Substitution",
          description:
            "Batch replace text, execute complex Regex patterns, and clean string data instantly.",
          iconName: "Replace"
        };
      }
      if (tool.id === "prefix-suffix-attacher") {
        return {
          ...tool,
          title: "Prefix and Suffix Text Attacher",
          description:
            "Prepend and append custom text, tags, code syntax, or line numbers to each line of text instantly in your browser.",
          iconName: "ArrowRightLeft"
        };
      }
      if (tool.id === "slug-generator") {
        return {
          ...tool,
          title: "Slugify & URL Slug Generator",
          description: "Convert titles and text into clean, SEO-friendly URL permalinks with custom separators and casing rules.",
          iconName: "Link2"
        };
      }
      if (tool.id === "random-string-generator") {
        return {
          ...tool,
          title: "Random String & Hash Key Generator",
          description: "Generate cryptographically secure CSPRNG random strings, API secret keys, and mapped cryptographic hash digests (SHA-256, SHA-512, MD5) on demand.",
          iconName: "Key"
        };
      }
      if (tool.id === "lorem-ipsum-generator") {
        return {
          ...tool,
          title: "Lorem Ipsum Generator",
          description: "Generate customizable placeholder text in paragraphs, sentences, or words with multiple themes including Latin, Hipster, Pirate, and Tech.",
          iconName: "FileText"
        };
      }
      if (tool.id === "fake-word-generator") {
        return {
          ...tool,
          title: "Fake Word Generator",
          description: "Generate unique pseudowords, brand names, and nonsense vocabulary with custom phonetics and JSON/CSV export.",
          iconName: "Type"
        };
      }
      if (tool.id === "text-encryptor") {
        return {
          ...tool,
          title: "Text Encryption & Decryption Suite",
          description: "Secure AES-256-GCM & Caesar cipher text encryption tool.",
          iconName: "Lock"
        };
      }
      if (tool.id === "morse-code-translator") {
        return {
          ...tool,
          title: "Morse Code Translator & Audio Synthesizer",
          description:
            "Encode and decode Morse code in real-time with Web Audio API tone synthesis and PARIS timing standard.",
          iconName: "Radio"
        };
      }
      if (tool.id === "nato-phonetic-converter") {
        return {
          ...tool,
          title: "NATO Phonetic Alphabet Converter",
          description:
            "Convert text to ICAO/NATO phonetic codewords in real-time with native Web Speech audio playback and full pronunciation guides.",
          iconName: "Radio"
        };
      }
      if (tool.id === "zalgo-text-generator") {
        return {
          ...tool,
          title: "Zalgo Glitch Text Generator",
          description:
            "Corrupt text with Unicode combining diacritical marks and adjust glitch intensity.",
          iconName: "Zap"
        };
      }
      if (tool.id === "strikethrough-text-generator") {
        return {
          ...tool,
          title: "Strikethrough & Underline Font Styler",
          description:
            "Generate cross-platform strikethrough, underline, and overline text styles using native Unicode combining characters.",
          iconName: "Strikethrough"
        };
      }
      if (tool.id === "markdown-table-generator") {
        return {
          ...tool,
          title: "Markdown Table Generator & Visual Spreadsheet Exporter",
          description: "Interactive visual spreadsheet editor to build, align, and export clean Markdown, CSV, TSV, HTML, and JSON tables.",
          iconName: "Table"
        };
      }
      if (tool.id === "ascii-art-generator") {
        return {
          ...tool,
          title: "Text to ASCII Art & Banner Typography Generator",
          description: "Generate FIGlet banners, Unicode fonts, and framed source code comments.",
          iconName: "Terminal"
        };
      }
      if (tool.id === "text-pii-redactor") {
        return {
          ...tool,
          title: "Text Anonymizer & PII Redactor",
          description: "Scrub emails, SSNs, credit cards, IP addresses, and API credentials from raw text with client-side zero-leakage masking.",
          iconName: "ShieldCheck"
        };
      }
      if (tool.id === "title-case-converter") {
        return {
          ...tool,
          title: "Title Case Converter",
          description: "Format headlines and academic citations into APA, Chicago, MLA, AP, and NYT guidelines with custom acronym preservation.",
          iconName: "Type"
        };
      }
      if (tool.id === "zero-width-space-cleaner") {
        return {
          ...tool,
          title: "Invisible Whitespace & Zero-Width Space Cleaner",
          description: "Detect, visualize, and strip hidden Unicode characters, zero-width spaces, BOM markers, and BiDi overrides in real time.",
          iconName: "Eraser"
        };
      }
      return tool;
    })
    .sort((a, b) => {
      const aFeatured = a.isFeatured ? 1 : 0;
      const bFeatured = b.isFeatured ? 1 : 0;
      if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      return b.originalIndex - a.originalIndex;
    });

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <header className="relative overflow-hidden border-b border-indigo-700/50 bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/og-hero.jpg"
            alt="TwisterTools Background Visual"
            fill
            priority
            className="object-cover object-center opacity-50 mix-blend-luminosity"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/85" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="scrollbar-none flex flex-wrap items-center gap-1 overflow-x-auto whitespace-nowrap text-xs font-medium text-indigo-100 md:text-sm">
            <Link href="/" className="max-w-32.5 truncate transition-colors hover:text-white sm:max-w-50 md:max-w-none">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="max-w-32.5 truncate transition-colors hover:text-white sm:max-w-50 md:max-w-none">
              Tools
            </Link>
            <span>/</span>
            <span className="max-w-32.5 truncate font-semibold text-white sm:max-w-50 md:max-w-none">
              {textToolsMeta.name}
            </span>
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 p-3.5 text-white shadow-lg backdrop-blur-sm">
              <FileText className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl">
                {textToolsMeta.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-indigo-100 md:text-base">
                {textToolsMeta.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto mt-10 max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <CategoryToolSearchGrid tools={categoryTools} categorySlug="text-tools" />

        <div className="space-y-8 border-t border-slate-200 pt-12 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {textToolsMeta.cards.map((card, idx) => {
              const CardIcon = card.icon === "Layers" ? Layers : card.icon === "RefreshCw" ? RefreshCw : Type;

              return (
                <div
                  key={idx}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                      <CardIcon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400">
                <HelpCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
                Frequently Asked Questions
              </h2>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
              {textToolsMeta.faqs.map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <dt className="text-sm font-semibold text-slate-900 dark:text-white">{faq.q}</dt>
                  <dd className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
