"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  Calculator,
  FileText,
  RefreshCw,
  Globe,
  Database,
  Code,
  Code2,
  Minimize2,
  CreditCard,
  Image,
  ArrowRightLeft,
  Binary,
  FileJson,
  FileCode,
  Clock,
  SearchCode,
  Columns,
  ShieldCheck,
  Server,
  Layers,
  Type,
  Palette,
  DollarSign,
  Scale,
  FileImage,
  FileType,
  Scaling,
  Hash,
  Key,
  Calendar,
  Percent,
  Sigma,
  BookOpen,
  Cpu,
  ShieldAlert,
  HelpCircle,
  Info,
  Combine,
  Stamp,
  Scissors,
  FileType2,
  Presentation,
  FolderArchive,
  RotateCw,
  Edit3,
  Crop,
  ListOrdered,
  Fingerprint,
  TrendingUp,
  Building,
  Car,
  PiggyBank,
  Activity,
  Flame,
  Droplets,
  Heart,
  PieChart,
  Baby,
  Wine,
  Timer
} from "lucide-react";

// Explicit interface for dynamic tools registry entry
interface RegistryTool {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  iconName: string;
  isFeatured?: boolean;
  badge?: string;
}

interface CategoryToolSearchGridProps {
  tools: RegistryTool[];
  categorySlug: string;
}

// Icon mapping dictionary to resolve icon strings dynamically
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Activity,
  Flame,
  Droplets,
  Heart,
  PieChart,
  Baby,
  Wine,
  Timer,
  Sparkles,
  Lock,
  Unlock,
  Calculator,
  FileText,
  RefreshCw,
  Globe,
  Database,
  Code,
  Code2,
  Minimize2,
  CreditCard,
  Image,
  ImageIcon: Image, // Alias just in case
  ArrowRightLeft,
  Binary,
  FileJson,
  FileCode,
  Clock,
  SearchCode,
  Columns,
  ShieldCheck,
  Server,
  Layers,
  Type,
  Palette,
  DollarSign,
  Scale,
  FileImage,
  Scaling,
  Hash,
  Key,
  Calendar,
  Percent,
  Sigma,
  BookOpen,
  Cpu,
  ShieldAlert,
  HelpCircle,
  Info,
  Combine,
  Stamp,
  Scissors,
  FileType,
  FileType2,
  Presentation,
  FolderArchive,
  RotateCw,
  Edit3,
  Crop,
  ListOrdered,
  Fingerprint,
  TrendingUp,
  Building,
  Car,
  PiggyBank
};

export default function CategoryToolSearchGrid({
  tools,
  categorySlug
}: CategoryToolSearchGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Case-insensitive filtering
  const filteredTools = tools.filter((tool) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Dynamic Client Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tools in this category..."
          className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-base transition-all"
          aria-label="Search category tools"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid Rendering */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => {
            // Resolve icon dynamically, fallback to BookOpen if iconName is missing or unrecognized
            const ResolvedIcon = ICON_MAP[tool.iconName] || BookOpen;

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="bg-white border border-slate-200/80 rounded-2xl transition-all duration-300 hover:shadow-lg hover:border-indigo-200 hover:-translate-y-1 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-indigo-500/50 group flex flex-col justify-between cursor-pointer min-h-[190px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 p-4 sm:p-6"
                aria-label={`Open ${tool.title}`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100/50 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      <ResolvedIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {tool.title}
                        </h3>
                        {tool.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3.5 leading-relaxed line-clamp-3">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Launch Tool
                  </span>
                  <div className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1.5 transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center dark:bg-slate-900 dark:border-slate-800 max-w-2xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <BookOpen className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">
            No tools matched your search
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-md">
            We couldn't find any tools matching "{searchQuery}" in this category. Try adjusting your terms or check another category.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            Reset Search Filter
          </button>
        </div>
      )}
    </div>
  );
}
