import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Share2, ShieldCheck, Layers, Zap, ShieldAlert, HelpCircle } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const category = "social-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;

  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Social Media & Content Creator Tools",
    description: "Free browser-based tools for social media managers and content creators. Format Instagram captions, split Twitter threads, calculate character limits, and generate YouTube timestamps.",
    keywords: ["social media tools", "content creator tools", "instagram line breaks", "twitter thread formatter", "youtube timestamp generator", "character counter", "twistertools"],
    alternates: {
      canonical: "https://www.twistertools.com/tools/social-tools",
    },
    openGraph: {
      title: "Social Media & Content Creator Tools - TwisterTools",
      description: "Free browser-based tools for social media managers and content creators. Format Instagram captions, split Twitter threads, calculate character limits, and generate YouTube timestamps.",
      url: "https://www.twistertools.com/tools/social-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Social Media & Content Creator Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Social Media & Content Creator Tools - TwisterTools",
      description: "Free browser-based tools for social media managers and content creators. Format Instagram captions, split Twitter threads, calculate character limits, and generate YouTube timestamps.",
      images: [featuredImage],
    },
  };
}

const socialMetadata = {
  name: "Social Media & Content Creator Tools",
  icon: "Share2",
  description: "Free client-side utilities for creators and marketers: caption formatters, thread splitters, character counters, and platform link generators.",
  detailedGuide: "Streamline your content creation workflow with browser-native social utilities. Format Instagram captions, split Twitter/X threads, count platform character limits, and generate YouTube timestamps with 100% privacy.",
  cards: [
    {
      title: "Zero-Friction Tools for Modern Digital Creators",
      icon: "Share2",
      content: "Drafting, editing, and publishing content across modern social platforms requires fast, reliable text and media utilities. Our suite provides instant caption line-break formatting, thread splitting, hashtag organization, and timestamp link creation without awkward copy-pasting or broken line breaks."
    },
    {
      title: "Platform-Compliant Safe Text & Media Formatting",
      icon: "Layers",
      content: "Every social platform imposes strict character limits, specific line-break rules, and unique URL parameter structures. Our tools automatically validate your posts against official limits for Instagram, X (Twitter), LinkedIn, YouTube, TikTok, Discord, and Reddit so your content publishes cleanly every time."
    },
    {
      title: "100% Client-Side Privacy & Account Security",
      icon: "ShieldCheck",
      content: "Your post drafts, unpublished captions, media tags, and campaign ideas remain completely confidential. All formatting and text processing execute purely inside your browser memory (RAM). No credentials, access tokens, API keys, or draft text are ever saved or transmitted to a server."
    },
    {
      title: "Optimized for Multi-Platform Publishing Workflows",
      icon: "Zap",
      content: "Repurpose your content effortlessly. Easily transform long articles into numbered X threads, format clean Instagram captions with hidden line breaks, calculate exact reading and video speaking times, and generate click-to-subscribe or timestamped media URLs in seconds."
    }
  ],
  faqs: [
    {
      q: "Do these tools require logging into my social media accounts?",
      a: "No, zero logins or API permissions are required. All tools run completely client-side in your browser, generating formatted text, threads, timestamps, and links ready to copy and paste."
    },
    {
      q: "Why do Instagram and other platforms collapse line breaks without formatting?",
      a: "Platforms like Instagram often strip standard newline characters or collapse empty spaces when posts are submitted. Our caption formatters inject invisible, platform-compliant Unicode spacing characters to preserve clean paragraph breaks."
    },
    {
      q: "Are my drafts, captions, or image assets uploaded to a server?",
      a: "No. Every text operation, character count check, thread split, and link generation occurs 100% locally in your browser RAM session. No data is sent to external servers."
    }
  ]
};

export default function SocialToolsCategoryPage() {
  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "social-tools")
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
              {socialMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Share2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {socialMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {socialMetadata.description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-8">

        {/* Trademark Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300 rounded-xl p-4 flex items-start gap-3 text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block mb-1">Trademark Disclaimer</strong>
            <p>
              Disclaimer: TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
            </p>
          </div>
        </div>

        {/* Dynamic Search grid component */}
        <CategoryToolSearchGrid
          tools={categoryTools}
          categorySlug="social-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {socialMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "ShieldCheck" ? ShieldCheck :
                  card.icon === "Share2" ? Share2 :
                    card.icon === "Zap" ? Zap : Layers;

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
              {socialMetadata.faqs.map((faq, idx) => (
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
