import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Dices, ShieldCheck, Layers, Cpu, HelpCircle, MapPin, Globe2, Gift, Shuffle, Type } from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";
import CategoryToolSearchGrid from "@/components/tools/CategoryToolSearchGrid";
import fs from "fs";
import path from "path";

export async function generateMetadata(): Promise<Metadata> {
  const category = "random-tools";
  const categoryImagePath = path.join(process.cwd(), "public", "images", "categories", category);
  const webpCategoryPath = `${categoryImagePath}.webp`;
  const jpgCategoryPath = `${categoryImagePath}.jpg`;
  
  const featuredImage = fs.existsSync(webpCategoryPath)
    ? `https://www.twistertools.com/images/categories/${category}.webp`
    : fs.existsSync(jpgCategoryPath)
      ? `https://www.twistertools.com/images/categories/${category}.jpg`
      : "https://www.twistertools.com/images/og-default.jpg";

  return {
    title: "Randomization, Games & Decision Tools",
    description:
      "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
    keywords: [
      "random picker",
      "dice roller",
      "coin flipper",
      "team generator",
      "list shuffler",
      "decision tools",
      "twistertools"
    ],
    alternates: {
      canonical: "https://www.twistertools.com/tools/random-tools",
    },
    openGraph: {
      title: "Randomization, Games & Decision Tools - TwisterTools",
      description:
        "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
      url: "https://www.twistertools.com/tools/random-tools",
      siteName: "TwisterTools",
      type: "website",
      images: [
        {
          url: featuredImage,
          width: 1200,
          height: 630,
          alt: "Randomization, Games & Decision Tools",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Randomization, Games & Decision Tools - TwisterTools",
      description:
        "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
      images: [featuredImage],
    },
  };
}

const randomMetadata = {
  name: "Randomization, Games & Decision Tools",
  icon: "Dices",
  description:
    "Interactive, client-side tools for quick decision making, chance games, and list shuffling—featuring random pickers, dice rollers, coin flippers, and team generators.",
  detailedGuide:
    "Make quick decisions, play chance games, or shuffle lists securely. All calculations run entirely in your browser with zero server transmission.",
  cards: [
    {
      title: "100% Client-Side Randomization",
      icon: "Dices",
      content:
        "Our randomizers use cryptographically secure random number generation or high-performance pseudo-random algorithms directly inside your browser. No seed data or choices are sent to external servers."
    },
    {
      title: "Fair Play & Transparency",
      icon: "ShieldCheck",
      content:
        "Every coin flip, dice roll, or list shuffle is computed locally with mathematical fairness. There are no rigged outcomes, bias, or hidden algorithms—what you see is exactly what the random math produces."
    },
    {
      title: "Clean, Touch-Friendly Layouts",
      icon: "Layers",
      content:
        "Whether you need to pick a name out of a hat on your phone or roll a set of D&D dice on your tablet, our tools feature responsive, fast, and interactive design elements with satisfying animations."
    },
    {
      title: "Bulk Shuffling & Group Operations",
      icon: "Cpu",
      content:
        "Quickly generate random team groups, assign tasks, or shuffle large lists. Export your randomized outputs or copy them to your clipboard with a single click."
    }
  ],
  faqs: [
    {
      q: "Are the coin flips or dice rolls rigged?",
      a: "No. The outcomes are generated using native JavaScript random number generation (Math.random or Web Crypto API), ensuring unbiased and mathematically random distributions."
    },
    {
      q: "Can I input custom names or lists?",
      a: "Yes. Our random picker and team generator tools allow you to paste custom list entries, shuffle them, and pick single or multiple items locally in your browser memory."
    },
    {
      q: "Is my list data stored anywhere?",
      a: "Never. All list inputs, names, and generated teams exist purely in the temporary memory of your current browser session. Reloading the page clears all data."
    }
  ]
};

export default function RandomToolsCategoryPage() {
  const categoryTools = toolsRegistry
    .map((tool, idx) => ({ ...tool, originalIndex: idx }))
    .filter((tool) => tool.category === "random-tools")
    .map((tool) => {
      if (tool.id === "coin-flipper") {
        return {
          ...tool,
          title: "Coin Flipper & Probability Simulator",
          description: "3D interactive coin flipper and high-speed Monte Carlo probability batch simulator backed by Web Crypto API entropy.",
          iconName: "Dices"
        };
      }
      if (tool.id === "dice-roller") {
        return {
          ...tool,
          title: "Dice Roller & Multi-Die Simulator",
          description: "Cryptographically secure polyhedral dice roller with modifiers, drop rules, and session history.",
          iconName: "Dices"
        };
      }
      if (tool.id === "random-number-generator") {
        return {
          ...tool,
          title: "Random Number Generator & Range Picker",
          description: "Generate cryptographically secure random numbers with customizable bounds, duplicate control, and batch export options.",
          iconName: "Dices"
        };
      }
      if (tool.id === "random-name-picker") {
        return {
          ...tool,
          title: "Random Name Picker & Winner Selector",
          description: "Pick random winners securely with Web Crypto API entropy and slot-machine animations.",
          iconName: "Dices"
        };
      }
      if (tool.id === "spin-the-wheel") {
        return {
          ...tool,
          title: "Spin the Wheel & Choice Picker",
          description: "Interactive wheel spinner for fair decisions, giveaways, and random selection.",
          iconName: "PieChart"
        };
      }
      if (tool.id === "random-team-generator") {
        return {
          ...tool,
          title: "Random Team & Group Generator",
          description: "Split rosters into fair, randomized teams or groups instantly with optional skill balancing and Web Crypto RNG.",
          iconName: "Users"
        };
      }
      if (tool.id === "random-address-generator") {
        return {
          ...tool,
          title: "Random Address & Location Picker",
          description: "Generate realistic mock addresses, real postal code structures, and calibrated latitude and longitude GPS coordinates across international territories.",
          iconName: "MapPin"
        };
      }
      if (tool.id === "random-country-picker") {
        return {
          ...tool,
          title: "Random Country & Flag Quiz",
          description: "Generate random sovereign countries with flag vectors, capitals, and interactive geography trivia quizzes.",
          iconName: "Globe2"
        };
      }
      if (tool.id === "secret-santa-generator") {
        return {
          ...tool,
          title: "Secret Santa & Holiday Gift Exchange Matcher",
          description: "Generate fair, collision-free Secret Santa pairings with custom exclusions, budget limits, wishlists, and private reveal cards.",
          iconName: "Gift"
        };
      }
      if (tool.id === "list-randomizer-shuffler") {
        return {
          ...tool,
          title: "Random List Randomizer & Array Shuffler",
          description: "Shuffle array items and randomize lists with cryptographic Fisher-Yates entropy, grouping, and duplicate removal.",
          iconName: "Shuffle"
        };
      }
      if (tool.id === "random-letter-picker") {
        return {
          ...tool,
          title: "Random Letter & Alphabet Picker",
          description: "Generate unbiased random letters from multiple international alphabets or custom character pools.",
          iconName: "Type"
        };
      }
      if (tool.id === "tournament-bracket-generator") {
        return {
          ...tool,
          title: "Tournament Bracket Generator",
          description: "Generate custom tournament brackets with seeded pairings, crypto random shuffling, automatic byes, and live score tracking.",
          iconName: "Trophy"
        };
      }
      if (tool.id === "truth-or-dare-generator") {
        return {
          ...tool,
          title: "Truth or Dare Card Prompt Generator",
          description: "Interactive, browser-native Truth or Dare card generator with curated game modes, custom deck creator, and player turn tracker.",
          iconName: "Flame"
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
              {randomMetadata.name}
            </span>
          </div>

          {/* Title Block */}
          <div className="flex items-start gap-4 mt-6">
            <div className="bg-white/20 backdrop-blur-sm p-3.5 flex items-center justify-center text-white shadow-lg rounded-2xl w-14 h-14 flex-shrink-0">
              <Dices className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {randomMetadata.name}
              </h1>
              <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-full leading-relaxed">
                {randomMetadata.description}
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
          categorySlug="random-tools"
        />

        {/* Below-The-Fold SEO Content Layout */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {randomMetadata.cards.map((card, idx) => {
              const CardIcon =
                card.icon === "Dices"
                  ? Dices
                  : card.icon === "ShieldCheck"
                  ? ShieldCheck
                  : card.icon === "Layers"
                  ? Layers
                  : Cpu;

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
              {randomMetadata.faqs.map((faq, idx) => (
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
