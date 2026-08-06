"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Link as LinkIcon,
  Search,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Lock,
  Calculator,
  RefreshCw,
  FileText,
  Globe,
  Database,
  Code2,
  Minimize2,
  CreditCard,
  Image,
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
  BookOpen,
  Cpu,
  HelpCircle,
  Info,
  MapPin,
  Binary,
  Zap,
  Star,
  Scissors,
  FileType2,
  Presentation,
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
  Code,
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
  Activity,
  Flame,
  Droplets,
  PieChart,
  Heart,
  Baby,
  Wine,
  Timer,
  Grid,
  GraduationCap,
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */
interface RegistryTool {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  iconName: string;
  isFeatured?: boolean;
}

/* ─────────────────────────────────────────────────────────
   Icon Map
 ───────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon,
  Activity,
  Flame,
  Droplets,
  PieChart,
  Heart,
  Baby,
  Wine,
  Grid,
  Timer,
  Sparkles,
  Lock,
  Calculator,
  RefreshCw,
  FileText,
  Globe,
  Database,
  Code2,
  Minimize2,
  CreditCard,
  Image,
  ImageIcon: Image,
  FileImage,
  FileCode,
  Clock,
  SearchCode,
  ShieldCheck,
  Layers,
  DollarSign,
  Scale,
  Scaling,
  Hash,
  Percent,
  BookOpen,
  Cpu,
  HelpCircle,
  Info,
  MapPin,
  Binary,
  Zap,
  Star,
  Scissors,
  FileType2,
  Presentation,
  Edit3,
  ListOrdered,
  Fingerprint,
  TrendingUp,
  Building,
  Car,
  PiggyBank,
  GraduationCap,
  QrCode,
  ShieldAlert,
  CalendarClock,
  Type,
  ListStart,
  Code,
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
  AlignLeft,
  ListFilter,
  AtSign,
  Phone,
  Replace
};

/* ─────────────────────────────────────────────────────────
   Category Config
───────────────────────────────────────────────────────── */
const CATEGORY_META: Record<string, { label: string; color: string }> = {
  all: { label: "All Tools", color: "bg-slate-800 text-white" },
  "developer-tools": {
    label: "Developer, Code & Web Engineering Tools",
    color: "bg-indigo-600 text-white",
  },
  calculators: {
    label: "Daily Essentials, Financial & Math Calculators",
    color: "bg-blue-600 text-white",
  },
  "password-tools": {
    label: "Password Management & Security Utilities",
    color: "bg-rose-600 text-white",
  },
  "text-tools": {
    label: "Text Analysis, List Comparison & Editing Tools",
    color: "bg-amber-600 text-white",
  },
  "image-tools": {
    label: "Image Editing, Compression & Conversion Tools",
    color: "bg-emerald-600 text-white",
  },
  "web-tools": {
    label: "SEO, Domain & Network Inspector Tools",
    color: "bg-cyan-600 text-white",
  },
  "generator-tools": {
    label: "Random Data, Identity & Key Generators",
    color: "bg-purple-600 text-white",
  },
  "converter-tools": {
    label: "Data & Number Base Converter Utilities",
    color: "bg-orange-600 text-white",
  },
  "pdf-tools": {
    label: "PDF & Document Utilities",
    color: "bg-orange-600 text-white",
  },
};

/* Category pill inactive colors */
const INACTIVE_PILL =
  "bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/60";

const TOOLS_PER_PAGE = 12;
const BOOKMARK_KEY = "twistertools_bookmarks";

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveBookmarks(bm: Set<string>): void {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(Array.from(bm)));
  } catch {
    /* ignore */
  }
}

/* ─────────────────────────────────────────────────────────
   Tool Card
───────────────────────────────────────────────────────── */
function ToolCard({
  tool,
  bookmarked,
  onToggleBookmark,
}: {
  tool: RegistryTool;
  bookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  const ResolvedIcon = ICON_MAP[tool.iconName] ?? BookOpen;

  return (
    <Link
      href={tool.href}
      className="group relative bg-white border border-slate-200/80 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 min-h-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 p-4 sm:p-6"
      aria-label={`Launch ${tool.title}`}
    >


      {/* Bookmark button */}
      <button
        id={`bookmark-${tool.id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleBookmark(tool.id);
        }}
        aria-label={bookmarked ? `Remove ${tool.title} bookmark` : `Bookmark ${tool.title}`}
        aria-pressed={bookmarked}
        className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          bookmarked
            ? "text-indigo-600 bg-indigo-50"
            : "text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
        }`}
      >
        {bookmarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {/* Card body */}
      <div>
        <div className="flex items-center gap-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors shrink-0">
            <ResolvedIcon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-[15px] leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
            {tool.title}
          </h3>
        </div>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-3">
          {tool.description}
        </p>
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors"
        >
          Launch Tool
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
        </span>
        <span className="text-[11px] text-slate-300 uppercase tracking-wide">
          {CATEGORY_META[tool.category]?.label ?? tool.category}
        </span>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Client Component
───────────────────────────────────────────────────────── */
interface ToolsDirectoryClientProps {
  tools: RegistryTool[];
}

export default function ToolsDirectoryClient({
  tools,
}: ToolsDirectoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  /* Load bookmarks on mount */
  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  /* Toggle bookmark */
  const handleToggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveBookmarks(next);
      return next;
    });
  }, []);

  /* Derived: unique categories */
  const categories = useMemo(() => {
    const cats = Array.from(new Set(tools.map((t) => t.category))).sort();
    return ["all", ...cats];
  }, [tools]);

  /* Filtered + searched list */
  const filteredTools = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tools.filter((tool) => {
      const matchesCategory =
        activeCategory === "all" || tool.category === activeCategory;
      const matchesSearch =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.id.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tools, searchQuery, activeCategory]);

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filteredTools.length / TOOLS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTools = filteredTools.slice(
    (safePage - 1) * TOOLS_PER_PAGE,
    safePage * TOOLS_PER_PAGE
  );

  /* Reset to page 1 on filter/search change */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory]);

  /* Page number range */
  const pageNumbers = useMemo(() => {
    const range: (number | "…")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      range.push(1);
      if (safePage > 3) range.push("…");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) range.push(i);
      if (safePage < totalPages - 2) range.push("…");
      range.push(totalPages);
    }
    return range;
  }, [totalPages, safePage]);

  return (
    <div className="space-y-8">
      {/* ── Search & Filter Bar ──────────────────────────── */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="tools-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all tools — e.g. JSON, password, UUID..."
            aria-label="Search all tools"
            className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400 text-slate-800 placeholder-slate-400 text-base transition-all"
          />
          {searchQuery && (
            <button
              id="tools-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap gap-2 justify-center"
        >
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat];
            const label = meta?.label ?? cat;
            const isActive = activeCategory === cat;
            const count =
              cat === "all"
                ? tools.length
                : tools.filter((t) => t.category === cat).length;

            return (
              <button
                key={cat}
                id={`category-pill-${cat}`}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
                aria-label={`Filter by ${label}`}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  isActive
                    ? (meta?.color ?? "bg-slate-800 text-white")
                    : INACTIVE_PILL
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Results Summary ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {filteredTools.length === 0 ? (
            "No tools found"
          ) : (
            <>
              Showing{" "}
              <strong className="text-slate-700 font-semibold">
                {(safePage - 1) * TOOLS_PER_PAGE + 1}–
                {Math.min(safePage * TOOLS_PER_PAGE, filteredTools.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-700 font-semibold">
                {filteredTools.length}
              </strong>{" "}
              tools
            </>
          )}
        </p>
        {bookmarks.size > 0 && (
          <button
            id="toggle-bookmarks-filter"
            onClick={() =>
              setActiveCategory(activeCategory === "__bookmarks__" ? "all" : "__bookmarks__")
            }
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              activeCategory === "__bookmarks__"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
            }`}
            aria-pressed={activeCategory === "__bookmarks__"}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Bookmarks ({bookmarks.size})
          </button>
        )}
      </div>

      {/* ── Tool Grid ────────────────────────────────────── */}
      {(() => {
        /* Special "bookmarks" pseudo-category */
        const displayTools =
          activeCategory === "__bookmarks__"
            ? tools.filter((t) => bookmarks.has(t.id))
            : paginatedTools;

        const totalDisplay =
          activeCategory === "__bookmarks__" ? displayTools.length : filteredTools.length;

        if (displayTools.length === 0) {
          return (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-14 flex flex-col items-center text-center max-w-lg mx-auto shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-4">
                <BookOpen className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">
                {activeCategory === "__bookmarks__"
                  ? "No bookmarks saved yet"
                  : "No tools matched"}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {activeCategory === "__bookmarks__"
                  ? "Click the bookmark icon on any tool card to save it here for quick access."
                  : `We couldn't find any tools matching "${searchQuery}". Try a different search term or select another category.`}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                Reset Filters
              </button>
            </div>
          );
        }

        return (
          <div
            role="list"
            aria-label="Tool cards"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayTools.map((tool) => (
              <div role="listitem" key={tool.id}>
                <ToolCard
                  tool={tool}
                  bookmarked={bookmarks.has(tool.id)}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Pagination ───────────────────────────────────── */}
      {activeCategory !== "__bookmarks__" && totalPages > 1 && (
        <nav
          aria-label="Page navigation"
          className="flex items-center justify-center gap-1.5 pt-4"
        >
          {/* Previous */}
          <button
            id="pagination-prev"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((p, idx) =>
            p === "…" ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-2 text-slate-400 text-sm select-none"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                id={`pagination-page-${p}`}
                onClick={() => setCurrentPage(p as number)}
                aria-label={`Go to page ${p}`}
                aria-current={safePage === p ? "page" : undefined}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  safePage === p
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            id="pagination-next"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Page label */}
          <span className="ml-3 text-sm text-slate-400 hidden sm:inline">
            Page{" "}
            <strong className="text-slate-600">{safePage}</strong> of{" "}
            <strong className="text-slate-600">{totalPages}</strong>
          </span>
        </nav>
      )}
    </div>
  );
}
