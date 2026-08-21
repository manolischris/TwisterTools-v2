"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Link as LinkIcon,
  Link2,
  Search,
  Bookmark,
  BookmarkCheck,
  Globe,
  Globe2,
  Database,
  Code2,
  RefreshCw,
  Calculator,
  Image as ImageIcon,
  FileText,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  HelpCircle,
  Cpu,
  CheckCircle2,
  TrendingUp,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Terminal,
  X,
  Minimize2,
  MapPin,
  CreditCard,
  FileImage,
  FileCode,
  DollarSign,
  Percent,
  Scale,
  Scaling,
  Combine,
  Scissors,
  Hash,
  Edit3,
  ListOrdered,
  PiggyBank,
  QrCode,
  ShieldAlert,
  CalendarClock,
  ArrowUpDown,
  Type,
  ListStart,
  Binary,
  Code,
  FileJson,
  ArrowLeftRight,
  ArrowRightLeft,
  Clock,
  SearchCode,
  Columns,
  Share2,
  Server,
  ShieldCheck,
  Palette,
  Unlock,
  Stamp,
  FileType,
  FileType2,
  FolderArchive,
  RotateCw,
  Crop,
  Car,
  Activity,
  Flame,
  Droplets,
  PieChart,
  Wine,
  Fingerprint,
  Building,
  Heart,
  Baby,
  Calendar,
  Timer,
  Grid,
  GraduationCap,
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace,
  Radio,
  Strikethrough,
  CalendarDays,
  Sunrise,
  Moon,
  Dices,
  Users,
  Shuffle,
  Pipette,
  Sliders,
  LayoutGrid,
  Triangle,
  Table,
  Layout,
  Bot,
  Home,
  Wallet
} from "lucide-react";

// Import master tool registry (automatically maintained by build/agent scripts)
import toolsRegistryData from "@/lib/tools-registry.json";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  iconName: string;
  isFeatured?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon,
  Link2,
  Activity,
  Flame,
  Droplets,
  PieChart,
  Wine,
  Fingerprint,
  Building,
  Heart,
  Baby,
  Calendar,
  CalendarDays,
  Timer,
  Grid,
  GraduationCap,
  TrendingUp,
  Code2,
  Sparkles,
  ImageIcon,
  RefreshCw,
  Lock,
  Database,
  FileText,
  Globe,
  Globe2,
  Calculator,
  Terminal,
  FileCheck2,
  Shield,
  Zap,
  Strikethrough,
  Minimize2,
  MapPin,
  CreditCard,
  FileImage,
  FileCode,
  DollarSign,
  Percent,
  Scale,
  Scaling,
  Cpu,
  Combine,
  Layers,
  Scissors,
  Hash,
  Edit3,
  ListOrdered,
  PiggyBank,
  QrCode,
  ShieldAlert,
  CalendarClock,
  Type,
  ListStart,
  Binary,
  Code,
  FileJson,
  ArrowLeftRight,
  ArrowRightLeft,
  Clock,
  SearchCode,
  Columns,
  Share2,
  Server,
  ShieldCheck,
  Palette,
  Unlock,
  Stamp,
  FileType,
  FileType2,
  FolderArchive,
  RotateCw,
  Crop,
  Car,
  ArrowUpDown,
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace,
  Radio,
  Sunrise,
  Moon,
  Dices,
  Users,
  Shuffle,
  Pipette,
  Sliders,
  Layout,
  LayoutGrid,
  Triangle,
  Table,
  Bot,
  Home,
  Wallet
};

const CATEGORIES = [
  { id: "all", name: "All Tools", href: "/tools", icon: Layers },
  { id: "calculators", name: "Calculators & Finance", href: "/tools/calculators", icon: Calculator },
  { id: "converter-tools", name: "Converters", href: "/tools/converter-tools", icon: RefreshCw },
  { id: "developer-tools", name: "Developer Tools", href: "/tools/developer-tools", icon: Code2 },
  { id: "generator-tools", name: "Generators", href: "/tools/generator-tools", icon: Sparkles },
  { id: "image-tools", name: "Image Tools", href: "/tools/image-tools", icon: ImageIcon },
  { id: "pdf-tools", name: "PDF Tools", href: "/tools/pdf-tools", icon: FileCheck2 },
  { id: "text-tools", name: "Text Tools", href: "/tools/text-tools", icon: FileText },
  { id: "web-tools", name: "Web Utilities", href: "/tools/web-tools", icon: Globe },
  { id: "date-tools", name: "Date & Time Tools", href: "/tools/date-tools", icon: Calendar },
  { id: "random-tools", name: "Random & Games", href: "/tools/random-tools", icon: Dices },
];

const ALL_TOOLS_REGISTRY: Tool[] = (toolsRegistryData as Tool[])
  .map((tool, idx) => ({ ...tool, originalIndex: idx }))
  .sort((a, b) => {
    const aFeatured = a.isFeatured ? 1 : 0;
    const bFeatured = b.isFeatured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;
    return b.originalIndex - a.originalIndex;
  }) as Tool[];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carousel edge scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const toolsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("twistertools_bookmarks");
      if (saved) {
        setBookmarks(JSON.parse(saved));
      }
    } catch {
      // Client hydration fallback
    }
    setIsLoaded(true);
  }, []);

  // Handle Click Outside for Search Popup Dismissal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkScrollLimits = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScrollLimits();
    window.addEventListener("resize", checkScrollLimits);
    return () => window.removeEventListener("resize", checkScrollLimits);
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const updated = bookmarks.includes(id)
      ? bookmarks.filter((bId) => bId !== id)
      : [...bookmarks, id];

    setBookmarks(updated);
    try {
      localStorage.setItem("twistertools_bookmarks", JSON.stringify(updated));
    } catch {
      // Storage fallback
    }
  };

  // Main grid tools filter (Independent of top search input)
  const categoryFilteredTools = useMemo(() => {
    return ALL_TOOLS_REGISTRY.filter((tool) => {
      return selectedCategory === "all" || tool.category === selectedCategory;
    });
  }, [selectedCategory]);

  // Autocomplete live search across ALL registry tools
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return ALL_TOOLS_REGISTRY.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
    ).slice(0, 6);
  }, [searchQuery]);

  const displayedTools = useMemo(() => {
    return categoryFilteredTools.slice(0, 9);
  }, [categoryFilteredTools]);

  const bookmarkedTools = useMemo(() => {
    return ALL_TOOLS_REGISTRY.filter((tool) => bookmarks.includes(tool.id));
  }, [bookmarks]);

  const scrollToGrid = () => {
    if (toolsGridRef.current) {
      toolsGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    scrollToGrid();
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const scrollCategoryBar = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const currentCategoryData = CATEGORIES.find((c) => c.id === selectedCategory);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TwisterTools",
    url: "https://www.twistertools.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.twistertools.com/?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is TwisterTools free to use for personal and commercial projects?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all utilities, financial calculators, media converters, and web generators on TwisterTools are 100% free with no registration required.",
        },
      },
      {
        "@type": "Question",
        name: "How does TwisterTools protect user privacy and file safety?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The vast majority of our utilities process data directly inside your web browser using modern WebAssembly and Web APIs. For heavy server workflows (like batch PDF processing), files are transferred over secure encrypted channels and automatically purged immediately after execution.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use these web utilities offline?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Client-side utilities (such as calculators, JSON formatters, text parsers, and generators) continue running offline once loaded in your browser session.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Header with Background Overlay */}
      <header className="relative z-30 bg-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 min-h-[460px] flex items-center">
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

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/20 backdrop-blur-md text-indigo-100 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            Fast, Free & Privacy-Focused Web Tools
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Free Online Calculators, Converters & Web Utilities
          </h1>

          <p className="max-w-3xl mx-auto text-slate-200 text-base sm:text-lg leading-relaxed font-normal">
            Zero-friction digital tools for financial planning, file conversions, developer workflows, and daily online productivity - built for maximum speed and data privacy.
          </p>

          <div ref={searchContainerRef} className="max-w-2xl mx-auto relative pt-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center z-20">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder={`Search across ${Math.floor(ALL_TOOLS_REGISTRY.length / 10) * 10}+ calculators, converters, tools...`}
                className="w-full pl-12 pr-32 py-4 bg-white text-slate-900 placeholder-slate-400 rounded-xl shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-base"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear Search Input"
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-md"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Persistent Autocomplete Popup */}
            {isSearchFocused && searchQuery.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-left">
                {searchResults.length > 0 ? (
                  <div className="p-2 divide-y divide-slate-100">
                    {searchResults.map((tool) => {
                      const ToolIcon = ICON_MAP[tool.iconName] || Code2;
                      return (
                        <Link
                          key={`search-res-${tool.id}`}
                          href={tool.href}
                          className="flex items-center justify-between p-3 hover:bg-indigo-50/60 rounded-lg transition-colors group"
                          onClick={() => setIsSearchFocused(false)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white rounded-lg text-slate-700 transition-colors">
                              <ToolIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                                {tool.title}
                              </div>
                              <div className="text-xs text-slate-500 line-clamp-1">
                                {tool.description}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No tools found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {isLoaded && bookmarkedTools.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Bookmark className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Your Bookmarked Utilities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarkedTools.map((tool) => {
                const IconComponent = ICON_MAP[tool.iconName] || Code2;
                return (
                  <Link
                    key={`bookmark-${tool.id}`}
                    href={tool.href}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                        {tool.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleBookmark(tool.id, e)}
                      aria-label={`Unpin ${tool.title}`}
                      className="text-indigo-600 hover:text-slate-400 p-1"
                    >
                      <BookmarkCheck className="w-5 h-5" />
                    </button>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section ref={toolsGridRef} id="explore-tools" className="space-y-6 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Explore Utilities
            </h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Showing {displayedTools.length} of {categoryFilteredTools.length}
            </span>
          </div>

          <div className="relative flex items-center group">
            {canScrollLeft && (
              <button
                onClick={() => scrollCategoryBar("left")}
                aria-label="Scroll categories left"
                className="hidden md:flex absolute -left-4 z-10 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              onScroll={checkScrollLimits}
              className="w-full flex items-center gap-2 overflow-x-auto py-2 px-1 scroll-smooth scrollbar-none whitespace-nowrap"
            >
              {CATEGORIES.map((cat) => {
                const CategoryIcon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 font-semibold"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                  >
                    <CategoryIcon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {canScrollRight && (
              <button
                onClick={() => scrollCategoryBar("right")}
                aria-label="Scroll categories right"
                className="hidden md:flex absolute -right-4 z-10 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedTools.map((tool) => {
              const ToolIcon = ICON_MAP[tool.iconName] || Code2;
              const isBookmarked = bookmarks.includes(tool.id);
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group relative"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ToolIcon className="w-6 h-6" />
                      </div>
                      <button
                        onClick={(e) => toggleBookmark(tool.id, e)}
                        aria-label={`Bookmark ${tool.title}`}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider border-t border-slate-100 mt-6">
                    <span>{tool.category.replace("-", " ")}</span>
                    <span className="flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                      Open <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {categoryFilteredTools.length > 9 && (
            <div className="text-center pt-4">
              <Link
                href={currentCategoryData?.href || "/tools"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-colors"
              >
                Explore All {categoryFilteredTools.length} {currentCategoryData?.name || "Tools"}
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          )}

          {categoryFilteredTools.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-slate-800 font-bold text-lg">No tools found matching your selection</p>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                Select a different category above or search using the top input bar.
              </p>
            </div>
          )}
        </section>

        <section className="space-y-8 pt-8 border-t border-slate-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <Cpu className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Ultra-Fast Architecture & Modern Web Processing
              </h2>
            </div>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              TwisterTools is built using Next.js 15, TypeScript, and modern browser APIs. Our utilities are engineered for zero-latency user interaction, offering instantaneous execution for financial forecasting, data conversions, document transformations, and developer tools without annoying signup paywalls or intrusive software installations.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <Shield className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Built-In Privacy & Data Security Standards
              </h2>
            </div>
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              Your data privacy is our core priority. The vast majority of interactive calculators, text utilities, formatters, and generators run completely client-side inside your browser context. For advanced operations requiring server capabilities (such as complex document operations), files are securely transmitted, processed, and immediately purged.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <HelpCircle className="w-9 h-9" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4 py-2 space-y-1">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Is TwisterTools free for personal and commercial use?
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  Yes. Every tool, generator, converter, and calculator on TwisterTools is completely free to use without subscription fees or registration limits.
                </p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4 py-2 space-y-1">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  How are files and user data handled?
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  Calculators, text tools, and code formatters execute 100% locally in your web browser. When using server-assisted tools (like batch file processing), files are transferred securely over HTTPS and permanently deleted right after execution.
                </p>
              </div>

              <div className="border-l-4 border-indigo-500 pl-4 py-2 space-y-1">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Can I use TwisterTools utilities offline?
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  Yes! Once loaded, client-side tools continue to work smoothly even if you disconnect from the internet.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}