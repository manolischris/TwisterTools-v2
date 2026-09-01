"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Search,
  Code,
  Code2,
  Calculator,
  Lock,
  FileText,
  FileCheck2,
  Image as ImageIcon,
  Globe,
  Cpu,
  RefreshCw,
  Calendar,
  Dices,
  Home,
  Binary,
  Activity,
  // ── Icons used in search result cards ──
  Link as LinkIcon,
  Link2,
  Sparkles,
  Globe2,
  Database,
  Minimize2,
  CreditCard,
  FileCode,
  Clock,
  SearchCode,
  ShieldCheck,
  Layers,
  DollarSign,
  Scale,
  FileImage,
  Scaling,
  Hash,
  Percent,
  Sigma,
  Scissors,
  FileType2,
  Edit3,
  ListOrdered,
  Fingerprint,
  TrendingUp,
  Building,
  Car,
  PiggyBank,
  QrCode,
  ShieldAlert,
  CalendarClock,
  Type,
  ListStart,
  FileJson,
  ArrowLeftRight,
  ArrowRightLeft,
  ArrowUpDown,
  Columns,
  Share2,
  Server,
  Unlock,
  Stamp,
  FileType,
  FolderArchive,
  RotateCw,
  Crop,
  Combine,
  Flame,
  Droplets,
  PieChart,
  Wine,
  Baby,
  Heart,
  Timer,
  Grid,
  Grid3X3,
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
  Users,
  Shuffle,
  Pipette,
  Sliders,
  Layout,
  LayoutGrid,
  Circle,
  Triangle,
  Table,
  Bot,
  Terminal,
  Shield,
  Wallet,
  Footprints,
  Coffee,
  Dumbbell,
  Dog,
  Cat,
  Wheat,
  PaintBucket,
  ScrollText,
  Boxes,
  Shovel,
  Sprout,
  Fish,
  Sun,
  Box,
  Gauge,
  Wind,
  Volume2,
  Plane,
  Eraser,
  Palette,
  Zap,
  Shapes,
  Trophy,
  ChevronRight,
} from "lucide-react";
import toolsRegistryData from "@/lib/tools-registry.json";
import { rankTools, type SearchableTool } from "@/lib/search-utils";

/* ─────────────────────────────────────────────────────────
   Static Data
   ───────────────────────────────────────────────────────── */

const categories = [
  { slug: "developer-tools", name: "Developer, Code & Web Engineering Tools", icon: Code, desc: "Formatters, generators & checkers" },
  { slug: "calculators", name: "Daily Essentials, Financial & Math Calculators", icon: Calculator, desc: "High-precision math & converters" },
  { slug: "password-tools", name: "Password Management & Security Utilities", icon: Lock, desc: "Secure generators & strength checkers" },
  { slug: "text-tools", name: "Text Analysis, List Comparison & Editing Tools", icon: FileText, desc: "Case, word & text manipulation" },
  { slug: "image-tools", name: "Image Editing, Compression & Conversion Tools", icon: ImageIcon, desc: "Canvas compressors, resizers & converters" },
  { slug: "pdf-tools", name: "PDF & Document Utilities", icon: FileCheck2, desc: "Merge, convert & compress PDF files" },
  { slug: "web-tools", name: "SEO, Domain & Network Inspector Tools", icon: Globe, desc: "WHOIS, DNS & network inspection" },
  { slug: "generator-tools", name: "Random Data, Identity & Key Generators", icon: Cpu, desc: "QR codes & test utilities" },
  { slug: "converter-tools", name: "Data & Number Base Converter Utilities", icon: RefreshCw, desc: "Base64, hex & binary converters" },
  { slug: "date-tools", name: "Date, Time & Scheduling Tools", icon: Calendar, desc: "Date differences, timezone conversions & countdowns" },
  { slug: "random-tools", name: "Randomization, Games & Decision Tools", icon: Dices, desc: "Random pickers, dice, coins & team generators" },
  { slug: "home-tools", name: "Home, Garden & Kitchen Living Utilities", icon: Home, desc: "Home, DIY, kitchen & gardening calculations" },
  { slug: "math-tools", name: "Math, Geometry & STEM Science Utilities", icon: Binary, desc: "Geometry solvers, physics & STEM calculation engines" },
  { slug: "health-tools", name: "Health, Fitness & Biological Utilities", icon: Activity, desc: "Body composition, metabolic & athletic performance estimators" },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon, Link2, Activity, Flame, Droplets, PieChart, Wine,
  Fingerprint, Building, Heart, Baby, Calendar, CalendarDays, Timer, Grid,
  Grid3X3, GraduationCap, TrendingUp, Code2, Sparkles, ImageIcon, RefreshCw,
  Lock, Database, FileText, Globe, Globe2, Calculator, Terminal, FileCheck2,
  Shield, Zap, Strikethrough, Minimize2, CreditCard, FileImage, FileCode,
  DollarSign, Percent, Scale, Sigma, Scaling, Cpu, Combine, Layers, Scissors,
  Hash, Edit3, ListOrdered, PiggyBank, QrCode, ShieldAlert, CalendarClock,
  Type, ListStart, Binary, Code, FileJson, ArrowLeftRight, ArrowRightLeft,
  Clock, SearchCode, Columns, Share2, Server, ShieldCheck, Palette, Unlock,
  Stamp, FileType, FileType2, FolderArchive, RotateCw, Crop, Car, ArrowUpDown,
  AlignLeft, ListFilter, AtSign, Phone, Replace, Radio, Sunrise, Moon, Dices,
  Users, Shuffle, Pipette, Sliders, Layout, LayoutGrid, Circle, Triangle,
  Table, Bot, Home, Wallet, Footprints, Coffee, Dumbbell, Dog, Cat, Wheat,
  PaintBucket, ScrollText, Boxes, Shovel, Sprout, Fish, Sun, Box, Gauge,
  Wind, Volume2, Plane, Eraser, Shapes, Trophy,
  Image: ImageIcon,
};

const ALL_TOOLS: SearchableTool[] = toolsRegistryData as SearchableTool[];

/* ─────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────── */

export default function Header() {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);

  // ── Search state ──
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Ranked search results (top 6)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return rankTools(ALL_TOOLS, searchQuery).slice(0, 6);
  }, [searchQuery]);

  // ── Open / close helpers ──
  const openDesktopSearch = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => desktopInputRef.current?.focus(), 50);
  }, []);

  const closeDesktopSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  const toggleMobileSearch = useCallback(() => {
    setIsMobileSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsMobileMenuOpen(false);
        setTimeout(() => mobileInputRef.current?.focus(), 100);
      } else {
        setSearchQuery("");
      }
      return next;
    });
  }, []);

  // ── Click-outside detection ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(target)
      ) {
        closeDesktopSearch();
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(target)
      ) {
        setIsMobileSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeDesktopSearch]);

  // ── Esc key handler ──
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDesktopSearch();
        setIsMobileSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeDesktopSearch]);



  /* ── Shared results dropdown ── */
  const renderResultsDropdown = (position: "desktop" | "mobile") => {
    if (!searchQuery.trim()) return null;

    return (
      <div
        className={`absolute ${
          position === "desktop"
            ? "top-full left-0 mt-2 w-full"
            : "top-full left-0 right-0 mt-1"
        } z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden`}
      >
        {searchResults.length > 0 ? (
          <div className="p-2">
            {searchResults.map((tool) => {
              const ToolIcon = ICON_MAP[tool.iconName] || Code2;
              return (
                <Link
                  href={tool.href}
                  key={`hdr-${tool.id}`}
                  onPointerDown={(e) => {
                    // Prevents default blur race-conditions on touch devices
                    e.preventDefault();
                    router.push(tool.href);
                    setIsSearchOpen(false);
                    setIsMobileSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 dark:text-slate-400 transition-colors shrink-0">
                    <ToolIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {tool.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {tool.description}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 shrink-0" />
                </Link>
              );
            })}
            <div className="mt-1 px-3 py-1.5 flex items-center justify-end">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">Esc</kbd> to dismiss
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-sm">
            No tools found matching &quot;{searchQuery}&quot;
          </div>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left Block: Logo & Desktop Search Widget */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 py-1.5 px-0.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all select-none"
              aria-label="TwisterTools Home"
            >
              <svg
                viewBox="0 0 180 180"
                className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-2, 2)">
                  <path
                    d="M68.75 94C64.27 94.7 61.97 99.74 60.91 103.73C58.63 112.31 61.72 122.25 67.06 129.18C81.72 148.18 107.48 154.36 129.54 144.76C159.06 131.91 175.94 101.72 173.42 69.75C172.84 62.47 171.63 55.21 169.55 48.23C168.46 44.57 165.55 39.52 165.75 35.95C173.15 43.64 177.16 58.32 179.27 68.48C188.84 114.59 153.09 164.62 104.25 163.8C94.66 163.65 85.24 161.28 76.36 157.81C44.61 145.39 30.39 104.18 49.34 75.59C63.32 54.5 97.56 48.64 113.82 70.4C117.35 75.12 119.63 81.31 119.72 87.25C119.77 90.12 118.46 93.27 119.25 96C123.51 95.38 125.96 90.58 127 86.75C129.44 77.77 126.32 67.74 120.73 60.5C106.12 41.55 80.33 35.89 58.45 45.24C28.8 57.92 12.22 88.42 14.62 120.25C15.23 128.42 16.84 136.33 19.17 144.16C20.04 147.11 22.61 151.19 22.25 153.95C19.21 151.46 17.66 146.74 15.92 143.31C10.78 133.17 8.13 122.08 7.41 110.75C4.71 68.14 39.05 25.12 83.75 26.18C93.39 26.41 102.7 28.76 111.65 32.18C143.53 44.37 157.57 86.01 138.68 114.43C127.75 130.86 106.63 137.7 88.55 130.23C83.69 128.22 78.54 125.22 75.29 120.98C71.32 115.79 68.3 109.45 68.25 102.75C68.23 99.88 69.58 96.73 68.75 94Z"
                    fill="#4f46e5"
                    className="text-indigo-600 dark:text-indigo-400 fill-current"
                    fillRule="evenodd"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
              <span className="flex items-baseline font-sans">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-xl md:text-3xl">
                  Twister
                </span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight text-xl md:text-3xl">
                  Tools
                </span>
              </span>
            </Link>

            {/* Desktop Expandable Search Widget */}
            <div ref={desktopSearchRef} className="hidden md:block relative">
              {!isSearchOpen ? (
                <button
                  onClick={openDesktopSearch}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors"
                  aria-label="Quick Search Tools"
                  title="Quick Search Tools"
                >
                  <Search className="w-5 h-5" />
                </button>
              ) : (
                <div className="relative flex items-center">
                  <div className="relative transition-all duration-300 ease-out w-80 lg:w-[420px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      ref={desktopInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tools..."
                      className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm transition-all"
                      aria-label="Search all tools"
                    />
                    <button
                      onClick={closeDesktopSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label="Close search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Desktop results dropdown */}
                  {renderResultsDropdown("desktop")}
                </div>
              )}
            </div>
          </div>

          {/* Right Block: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/tools"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              All Tools
            </Link>

            {/* Categories Dropdown Container */}
            <div
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <Link
                href="/categories"
                className="flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2"
                onClick={() => setIsDropdownOpen(false)}
              >
                Categories
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {/* Dropdown Menu Panel */}
              {isDropdownOpen && (
                <div className="absolute right-0 md:left-1/2 md:-translate-x-1/2 top-full pt-1 w-[560px] z-50">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={cat.slug}
                          href={`/tools/${cat.slug}`}
                          className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/60 transition-colors shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {cat.name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-550 line-clamp-1">
                              {cat.desc}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* ── Mobile: Search + Hamburger ── */}
          <div className="flex md:hidden items-center gap-1">
            <button
              onClick={toggleMobileSearch}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors"
              aria-label={isMobileSearchOpen ? "Close search" : "Open search"}
            >
              {isMobileSearchOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                if (!isMobileMenuOpen) {
                  setIsMobileSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Search Slide-Down ── */}
      {isMobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 animate-in slide-in-from-top-2 duration-200"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all tools..."
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm transition-all"
              aria-label="Search all tools"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Mobile results dropdown */}
            {renderResultsDropdown("mobile")}
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
          <Link
            href="/tools"
            className="block text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            All Tools
          </Link>

          <div>
            <button
              onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
              className="flex w-full items-center justify-between text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
            >
              <span>Categories</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isMobileCategoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMobileCategoriesOpen && (
              <div className="mt-2 pl-4 grid grid-cols-1 gap-2 border-l border-slate-100 dark:border-slate-800">
                <Link
                  href="/categories"
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 py-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  All Categories &rarr;
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/tools/${cat.slug}`}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1 flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <cat.icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            href="/about"
            className="block text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="block text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-1"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
        </div>
      )}
    </header>
  );
}
