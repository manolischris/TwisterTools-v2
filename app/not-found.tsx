"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Link as LinkIcon,
  AlertCircle,
  Search,
  Compass,
  ArrowRight,
  Home,
  Code2,
  Sparkles,
  RefreshCw,
  Lock,
  Calculator,
  FileText,
  Globe,
  FileCheck2,
  Image as ImageIcon,
} from "lucide-react";
import toolsRegistry from "@/lib/tools-registry.json";

interface Tool {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  iconName: string;
  isFeatured?: boolean;
}

const CATEGORIES = [
  { name: "Calculators", href: "/tools/calculators", icon: Calculator },
  { name: "Developer Tools", href: "/tools/developer-tools", icon: Code2 },
  { name: "Image Tools", href: "/tools/image-tools", icon: ImageIcon },
  { name: "Text Tools", href: "/tools/text-tools", icon: FileText },
  { name: "Converters", href: "/tools/converter-tools", icon: RefreshCw },
  { name: "Generators", href: "/tools/generator-tools", icon: Sparkles },
];

const POPULAR_TOOL_IDS = [
  "qr-code-generator",
  "password-generator",
  "sha-generator",
  "base64-encode-decode",
  "password-strength-checker",
  "age-calculator",
];

const getToolIcon = (iconName: string) => {
  switch (iconName) {
    case "Link":
      return LinkIcon;
    case "Calculator":
      return Calculator;
    case "Code2":
      return Code2;
    case "Sparkles":
      return Sparkles;
    case "ImageIcon":
    case "Image":
      return ImageIcon;
    case "RefreshCw":
      return RefreshCw;
    case "Lock":
      return Lock;
    case "FileText":
      return FileText;
    case "Globe":
      return Globe;
    case "FileCheck2":
      return FileCheck2;
    default:
      return AlertCircle;
  }
};

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tools?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const featuredTools = useMemo(() => {
    const registry = toolsRegistry as Tool[];
    const popular = registry.filter((tool) => POPULAR_TOOL_IDS.includes(tool.id));
    if (popular.length >= 6) {
      return popular.slice(0, 6);
    }
    const merged = [...popular, ...registry.filter((tool) => !POPULAR_TOOL_IDS.includes(tool.id))];
    return merged.slice(0, 6);
  }, []);

  return (
    <main className="flex-1 w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Edge-to-Edge Slate-to-Indigo Gradient Hero Box */}
        <section className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl mb-12">
          {/* Ambient Background Glow Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full filter blur-3xl opacity-30 -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-slate-900 rounded-full filter blur-3xl opacity-20 -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 mb-6">
                <AlertCircle className="h-3.5 w-3.5" />
                Error 404
              </span>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Page Moved or Utility Relocated
              </h1>

              <p className="mt-4 text-slate-200 text-base sm:text-lg leading-relaxed max-w-xl">
                The online utility or resource you are looking for has been moved to our consolidated catalog or is temporarily unavailable. Use the instant search below to find it immediately.
              </p>

              {/* Instant Search Bar */}
              <form onSubmit={handleSearchSubmit} className="mt-8 w-full max-w-md">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-400">
                    <Search className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search 50+ browser-based tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-4 py-3.5 pl-12 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/80 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all border border-indigo-400/30 cursor-pointer"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Right Abstract Visual Column */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Simulated 3D Graphic Rings */}
                <div className="absolute inset-0 rounded-full border border-indigo-400/20 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-dashed border-indigo-400/30 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-10 rounded-full bg-indigo-500/5 backdrop-blur-xl border border-indigo-500/20 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-7xl font-black tracking-widest bg-gradient-to-b from-white to-indigo-300 bg-clip-text text-transparent select-none drop-shadow-md">
                    404
                  </span>
                  <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold mt-1">
                    Not Found
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick-Navigation Category Pills */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Quick Category Navigation
            </h2>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="flex items-center gap-2 px-4.5 py-2.5 rounded-full border border-border bg-card text-card-foreground text-sm font-medium hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all shadow-sm"
                >
                  <Icon className="h-4 w-4 text-indigo-500" />
                  <span>{category.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Utilities Grid */}
        <section className="mb-16">
          <div className="flex flex-col mb-6">
            <h2 className="text-xl font-bold text-foreground">Featured Utilities</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse some of our most popular free tools running completely in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => {
              const ToolIcon = getToolIcon(tool.iconName);
              return (
                <div
                  key={tool.id}
                  className="flex flex-col justify-between p-6 bg-card border border-border rounded-2xl hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 group"
                >
                  <div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit mb-4">
                      <ToolIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      {tool.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors group/link"
                    >
                      <span>Launch Tool</span>
                      <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Back Home Call-To-Action Footer Row */}
        <section className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-border">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-border bg-card hover:bg-muted text-foreground text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Return to Master Homepage</span>
          </Link>
          <Link
            href="/tools"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
          >
            <Compass className="h-4 w-4" />
            <span>Browse All Tools</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
