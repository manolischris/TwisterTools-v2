import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Code, ShieldCheck, SearchCode, RefreshCw, HelpCircle, Palette, Cpu } from "lucide-react";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const category = "developer-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Developer, Code & Web Engineering Tools",
    description:
      "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
    keywords: [
      "json formatter",
      "css gradient generator",
      "regex tester",
      "base64 encoder",
      "jwt decoder",
      "developer tools",
      "web engineering tools",
      "twistertools"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/developer-tools"
    },
    openGraph: {
      title: "Developer, Code & Web Engineering Tools - TwisterTools",
      description:
        "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
      url: "https://www.twistertools.com/tools/developer-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Developer, Code & Web Engineering Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Developer, Code & Web Engineering Tools - TwisterTools",
      description:
        "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
      images: [featuredImage],
    },
  };
}

const developerMetadata = {
  name: "Developer, Code & Web Engineering Tools",
  description:
    "Essential browser-based utilities for developers: JSON formatters, CSS generators, SQL sanitizers, and encoding suites.",
  detailedGuide:
    "Accelerate your debugging and development workflow with client-safe developer engines. No data entered ever leaves your device.",
  cards: [
    {
      title: "Client-Safe Syntax Formatting",
      icon: "Code",
      content:
        "Analyze and clean your code structures safely. Our formatters parse JSON, XML, SQL, HTML, CSS, and JavaScript using local TypeScript tokenizers. Clean nested syntax, minify stylesheets, or parse complex databases instantly."
    },
    {
      title: "Cryptographic Integrity Auditing",
      icon: "ShieldCheck",
      content:
        "Generate MD5, SHA-1, SHA-256, SHA-512, or SHA-3 hashes in real-time. Verify files or text checksums against software packages directly. The entire process runs client-side, making it ideal for checking proprietary files."
    },
    {
      title: "Regular Expression & Logic Testing",
      icon: "SearchCode",
      content:
        "Test your expressions using live JavaScript RegExp engines. View match highlighting, capturing groups, and execution speeds instantly, supported by a comprehensive syntax cheat sheet to build complex parameters."
    },
    {
      title: "Data Format Conversion Suite",
      icon: "RefreshCw",
      content:
        "Symmetrically convert between YAML and JSON, or JSON and CSV in a split-screen workspace. Adjust delimiters, flatten object hierarchies, and export files directly with single-click triggers."
    }
  ],
  faqs: [
    {
      q: "Is it safe to format proprietary JSON or XML code here?",
      a: "Yes, 100% safe. The formatting and linting operations happen locally. No network requests are sent with your code, keeping your intellectual property completely secure."
    },
    {
      q: "How does the JWT Decoder handle secure tokens?",
      a: "The decoder splits the JSON Web Token structure (header, payload, signature) using client-side base64 url-decoding. No keys or tokens are stored or sent anywhere."
    },
    {
      q: "Does the SQL Formatter support multiple dialects?",
      a: "Yes, you can format queries tailored for Standard SQL, PostgreSQL, MySQL, and Microsoft SQL Server (T-SQL) with customized indentation spacing."
    }
  ]
};

export default function DeveloperToolsCategoryPage() {
  const registryPath = path.join(process.cwd(), "lib", "tools-registry.json");
  const toolsRegistry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Array<any>;

  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "developer-tools")
    .map((tool) => {
      if (tool.id === "css-gradient-generator") {
        return {
          ...tool,
          title: "CSS Gradient Generator",
          description: "Design and export CSS linear, radial, and conic gradients with Tailwind support and 1080p image exports.",
          iconName: "Palette"
        };
      }
      if (tool.id === "html-table-generator") {
        return {
          ...tool,
          title: "HTML Table Code Generator",
          description: "Interactive visual HTML table builder with Tailwind, CSS, React TSX, and Markdown export.",
          iconName: "Table"
        };
      }
      if (tool.id === "htaccess-generator") {
        return {
          ...tool,
          title: "HTACCESS Directives & Rewrite Rules Generator",
          description: "Generate production-ready Apache .htaccess rules with 301 redirects, HTTPS enforcement, GZIP, and security headers.",
          iconName: "FileCode"
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16 text-slate-800 dark:text-slate-200">
      {/* Header: Slate-to-Indigo Title Bar */}
      <header className="relative overflow-hidden bg-slate-900 text-white border-b border-indigo-700/50">
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Navigation Breadcrumbs */}
          <div className="flex items-center gap-1 text-indigo-100 text-xs md:text-sm font-medium flex-wrap overflow-x-auto whitespace-nowrap scrollbar-none">
            <Link
              href="/"
              className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/tools"
              className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate"
            >
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {developerMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Code className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {developerMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-3xl leading-relaxed">
                {developerMetadata.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* Dynamic Search grid component */}
        <CategoryToolSearchGrid
          tools={categoryTools}
          categorySlug="developer-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {developerMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "Code"
                  ? Code
                  : card.icon === "ShieldCheck"
                  ? ShieldCheck
                  : card.icon === "SearchCode"
                  ? SearchCode
                  : RefreshCw;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.content}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Full-width FAQ SEO Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {developerMetadata.faqs.map((faq, idx) => (
                <div key={idx} className="space-y-2">
                  <dt className="font-semibold text-slate-900 dark:text-white text-sm">
                    {faq.q}
                  </dt>
                  <dd className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
