import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Home, ShieldCheck, Coffee, Sunrise, HelpCircle, Layers } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const category = "home-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Home, Garden & Kitchen Living Utilities",
    description: "Fast, privacy-first everyday calculation engines and measurement tools for home improvement, culinary conversions, gardening, and DIY living.",
    keywords: ["culinary conversions", "gardening calculators", "diy living tools", "home improvement calculators"],
    alternates: {
      canonical: "https://www.twistertools.com/tools/home-tools",
    },
    openGraph: {
      title: "Home, Garden & Kitchen Living Utilities - TwisterTools",
      description: "Fast, privacy-first everyday calculation engines and measurement tools for home improvement, culinary conversions, gardening, and DIY living.",
      url: "https://www.twistertools.com/tools/home-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Home, Garden & Kitchen Living Utilities",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Home, Garden & Kitchen Living Utilities - TwisterTools",
      description: "Fast, privacy-first everyday calculation engines and measurement tools for home improvement, culinary conversions, gardening, and DIY living.",
      images: [featuredImage],
    },
  };
}

const homeMetadata = {
  name: "Home, Garden & Kitchen Living Utilities",
  icon: "Home",
  description: "Fast, privacy-first everyday calculation engines and measurement tools for home improvement, culinary conversions, gardening, and DIY living.",
  detailedGuide: "Perform home, kitchen, and garden calculations locally on your device with complete privacy and offline-first speed.",
  cards: [
    {
      title: "100% Offline Culinary & DIY Conversions",
      icon: "ShieldCheck",
      content: "Every conversion, dilution ratio, and area calculation runs entirely inside your browser's runtime. We do not transmit recipe values, room dimensions, or DIY specifications to any remote server, keeping your daily living plans private."
    },
    {
      title: "Culinary Conversions & Kitchen Scaling",
      icon: "Coffee",
      content: "Convert recipe measurements between volumetric (cups, tablespoons, milliliters) and weight-based (ounces, grams) metrics. Scale recipe portion counts dynamically without loss of precision."
    },
    {
      title: "Home Improvement & Area Estimation",
      icon: "Home",
      content: "Compute tiling, flooring, paint volumes, or gardening soil requirements in seconds. Enter custom parameters to calculate raw materials needed for any DIY project."
    },
    {
      title: "Gardening & Plant Care Calculators",
      icon: "Sunrise",
      content: "Calculate fertilizer dilution rates, plant spacing patterns, or watering volume requirements based on soil type and container sizes to optimize your green space."
    }
  ],
  faqs: [
    {
      q: "Are my kitchen measurements or room dimensions sent to any server?",
      a: "No. All calculations run entirely locally within your browser using client-side JavaScript. No details about your home or recipes are transmitted."
    },
    {
      q: "Can I use these tools offline while working in the garden or garage?",
      a: "Yes. Once the page is loaded, the calculation engines do not require an active internet connection to execute, making them ideal for offline use in any room or outdoor space."
    },
    {
      q: "How precise are the culinary conversion calculators?",
      a: "They use standard international food measurement standards. However, since densities can vary (e.g. flour vs water), weight-to-volume estimations are based on standard average densities."
    }
  ]
};

export default function HomeToolsCategoryPage() {
  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "home-tools")
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
              {homeMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Home className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {homeMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {homeMetadata.description}
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
          categorySlug="home-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {homeMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "ShieldCheck" ? ShieldCheck :
                card.icon === "Coffee" ? Coffee :
                card.icon === "Home" ? Home :
                card.icon === "Sunrise" ? Sunrise : Layers;

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
              {homeMetadata.faqs.map((faq, idx) => (
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
