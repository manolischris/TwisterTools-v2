import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Globe, ShieldCheck, Clock, Server, HelpCircle } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const category = "web-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;

  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "SEO, Domain & Network Inspector Tools",
    description: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
    keywords: [
      "http status code checker",
      "domain age checker",
      "what is my ip",
      "dns record finder",
      "ssl checker",
      "sitemap generator",
      "web tools",
      "twistertools"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/web-tools",
    },
    openGraph: {
      title: "SEO, Domain & Network Inspector Tools - TwisterTools",
      description: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
      url: "https://www.twistertools.com/tools/web-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "SEO, Domain & Network Inspector Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "SEO, Domain & Network Inspector Tools - TwisterTools",
      description: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
      images: [featuredImage],
    },
  };
}

const webToolsMetadata = {
  name: "SEO, Domain & Network Inspector Tools",
  icon: "Globe",
  description: "Inspect DNS records, WHOIS domain age, IP geolocation, meta tags, and network headers with zero tracking.",
  detailedGuide: "Analyze headers, encode query URIs, inspect configurations, and test networking elements safely.",
  cards: [
    {
      title: "Dynamic WHOIS & Domain Age Auditing",
      icon: "Clock",
      content: "Inspect creation dates, registrar details, domain status, and age records. Analyze web performance histories and expiration milestones."
    },
    {
      title: "SSL Trust & Cipher Audits",
      icon: "ShieldCheck",
      content: "Verify SSL/TLS certificates. Check key sizes, CA issuer paths, trust validity, and security protocol compatibility."
    },
    {
      title: "GeoIP Lookup & ASN Telemetry",
      icon: "Globe",
      content: "Find public IP locations, internet providers, ASNs, and network details. Visualize coordinates on offline-first vectors."
    },
    {
      title: "Sitemaps & SEO Indexing Utilities",
      icon: "Server",
      content: "Generate XML, TXT, or HTML sitemaps complying with Google Search guidelines. Customize update frequencies, change counts, and priorities."
    }
  ],
  faqs: [
    {
      q: "Does checking a domain name register it in search histories?",
      a: "No, queries are fetched using secure APIs that inspect public registers without recording search intentions."
    },
    {
      q: "How does What Is My IP work?",
      a: "It makes a direct client-side request to secure geolocation resolvers to capture your IP and network details."
    },
    {
      q: "Are SSL checks updated in real-time?",
      a: "Yes, we connect directly to the target hostname to query the live certificate chain returned by the server."
    }
  ]
};

export default function WebToolsCategoryPage() {
  const categoryTools = (toolsRegistry as Array<any>)
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "web-tools")
    .map((tool) => {
      if (tool.id === "canonical-url-tag-builder") {
        return {
          ...tool,
          name: "Canonical URL Link Tag & Cross-Domain Audit Formatter",
          title: "Canonical URL Link Tag & Cross-Domain Audit Formatter",
          slug: "canonical-url-tag-builder",
          description: "Generate, sanitize, and validate canonical link tags, HTTP response headers, hreflang clusters, and cross-domain rel=canonical markup.",
          iconName: "Link2",
          icon: "Link2"
        };
      }
      if (tool.id === "http-status-code-checker") {
        return {
          ...tool,
          name: "HTTP Status Code Reference & Diagnostic Header Matrix",
          title: "HTTP Status Code Reference & Diagnostic Header Matrix",
          slug: "http-status-code-checker",
          description: "Lookup RFC 9110 HTTP status codes, diagnose API response headers, inspect cURL commands, and test live endpoints in real time.",
          iconName: "Activity",
          icon: "Activity"
        };
      }
      if (tool.id === "schema-jsonld-generator") {
        return {
          ...tool,
          name: "Schema.org FAQPage & Article JSON-LD Microdata Builder",
          title: "Schema.org FAQPage & Article JSON-LD Microdata Builder",
          slug: "schema-jsonld-generator",
          description: "Generate Google-compliant JSON-LD structured data for FAQPage, Article, NewsArticle, and BlogPosting schemas.",
          iconName: "Code2",
          icon: "Code2"
        };
      }
      if (tool.id === "spf-record-generator") {
        return {
          ...tool,
          name: "SPF Record Generator & Permissive Syntax Validator",
          title: "SPF Record Generator & Permissive Syntax Validator",
          slug: "spf-record-generator",
          description: "Generate, test, and audit RFC 7208 SPF records. Detect the 10 DNS lookup limit, avoid Permerrors, and prevent unauthorized email spoofing.",
          iconName: "ShieldCheck",
          icon: "ShieldCheck"
        };
      }
      if (tool.id === "dmarc-record-generator") {
        return {
          ...tool,
          name: "DMARC Policy TXT Record Formatter & Reporting Tool",
          title: "DMARC Policy TXT Record Formatter & Reporting Tool",
          slug: "dmarc-record-generator",
          description: "Generate RFC 7489 compliant DMARC TXT records with custom policy levels, aggregate rua and forensic ruf reporting tags, and DKIM/SPF alignment.",
          iconName: "ShieldCheck",
          icon: "ShieldCheck"
        };
      }
      if (tool.id === "dkim-record-generator") {
        return {
          ...tool,
          name: "DKIM Selector Public Key Record Inspector & Generator",
          title: "DKIM Selector Public Key Record Inspector & Generator",
          slug: "dkim-record-generator",
          description: "Inspect, generate, and validate RFC 6376 DKIM DNS TXT records with 2048-bit RSA key health diagnostics.",
          iconName: "KeyRound",
          icon: "KeyRound"
        };
      }
      if (tool.id === "client-hints-inspector") {
        return {
          ...tool,
          name: "User-Agent Client Hints Inspector",
          title: "User-Agent Client Hints Inspector",
          slug: "client-hints-inspector",
          description: "Inspect, simulate, and generate RFC 8942 User-Agent Client Hints (Sec-CH-UA), Accept-CH headers, and Nginx proxy rules.",
          iconName: "Activity",
          icon: "Activity"
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
            <Link href="/" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-white transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              Tools
            </Link>
            <span>/</span>
            <span className="text-white font-semibold max-w-[130px] sm:max-w-[200px] md:max-w-none truncate">
              {webToolsMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Globe className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {webToolsMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {webToolsMetadata.description}
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
          categorySlug="web-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {webToolsMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "Clock"
                  ? Clock
                  : card.icon === "ShieldCheck"
                    ? ShieldCheck
                    : card.icon === "Globe"
                      ? Globe
                      : Server;

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
              {webToolsMetadata.faqs.map((faq, idx) => (
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
