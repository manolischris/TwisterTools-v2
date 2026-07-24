"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Share2,
  Globe,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Eye,
  Code,
  Image as ImageIcon,
  Search,
  HelpCircle,
  Database,
  Cpu,
  Table,
  HardDrive,
  Zap,
  Shield,
  Blocks,
  Layout,
  Layers,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types & Interfaces
// ─────────────────────────────────────────────────────────────

type PlatformTab = "facebook" | "twitter" | "linkedin" | "google";
type TwitterCardType = "summary" | "summary_large_image";
type OgType = "website" | "article" | "profile" | "book";

interface OpenGraphFormData {
  // Core Page Information
  title: string;
  description: string;
  url: string;
  siteName: string;
  locale: string;

  // Media
  imageUrl: string;
  imageAlt: string;

  // Advanced OpenGraph
  ogType: OgType;
  articleAuthor: string;
  articlePublishedTime: string;

  // Twitter
  twitterCardType: TwitterCardType;
  twitterSite: string;
  twitterCreator: string;
}

const SAMPLE_DATA: OpenGraphFormData = {
  title: "Open Graph Generator & Social Card Suite | TwisterTools",
  description:
    "Generate, preview, and optimize high-converting Open Graph, Twitter Card, and Schema meta tags instantly in your browser. Boost social media engagement and click-through rates.",
  url: "https://www.twistertools.com/tools/web-tools/open-graph-generator",
  siteName: "TwisterTools",
  locale: "en_US",
  imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&h=630&auto=format&fit=crop",
  imageAlt: "TwisterTools Open Graph Generator Interface Dashboard",
  ogType: "website",
  articleAuthor: "TwisterTools Engineering Team",
  articlePublishedTime: "2026-03-31",
  twitterCardType: "summary_large_image",
  twitterSite: "@twistertools",
  twitterCreator: "@twistertools",
};

const DEFAULT_FORM: OpenGraphFormData = {
  title: "",
  description: "",
  url: "",
  siteName: "",
  locale: "en_US",
  imageUrl: "",
  imageAlt: "",
  ogType: "website",
  articleAuthor: "",
  articlePublishedTime: "",
  twitterCardType: "summary_large_image",
  twitterSite: "",
  twitterCreator: "",
};

// ─────────────────────────────────────────────────────────────
//  Meta Tag Code Engine (Pure TypeScript)
// ─────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function generateOpenGraphTags(data: OpenGraphFormData): string {
  const lines: string[] = [
    "<!-- HTML Meta Tags -->",
  ];

  if (data.title) lines.push(`<title>${escapeHtml(data.title)}</title>`);
  if (data.description) lines.push(`<meta name="description" content="${escapeHtml(data.description)}">`);

  lines.push("\n<!-- Open Graph / Facebook Meta Tags -->");
  lines.push(`<meta property="og:type" content="${data.ogType}">`);
  if (data.url) lines.push(`<meta property="og:url" content="${escapeHtml(data.url)}">`);
  if (data.title) lines.push(`<meta property="og:title" content="${escapeHtml(data.title)}">`);
  if (data.description) lines.push(`<meta property="og:description" content="${escapeHtml(data.description)}">`);
  if (data.imageUrl) lines.push(`<meta property="og:image" content="${escapeHtml(data.imageUrl)}">`);
  if (data.imageAlt) lines.push(`<meta property="og:image:alt" content="${escapeHtml(data.imageAlt)}">`);
  if (data.siteName) lines.push(`<meta property="og:site_name" content="${escapeHtml(data.siteName)}">`);
  if (data.locale) lines.push(`<meta property="og:locale" content="${escapeHtml(data.locale)}">`);

  if (data.ogType === "article") {
    if (data.articleAuthor) lines.push(`<meta property="article:author" content="${escapeHtml(data.articleAuthor)}">`);
    if (data.articlePublishedTime) lines.push(`<meta property="article:published_time" content="${escapeHtml(data.articlePublishedTime)}">`);
  }

  lines.push("\n<!-- Twitter Meta Tags -->");
  lines.push(`<meta name="twitter:card" content="${data.twitterCardType}">`);
  if (data.twitterSite) lines.push(`<meta name="twitter:site" content="${escapeHtml(data.twitterSite)}">`);
  if (data.twitterCreator) lines.push(`<meta name="twitter:creator" content="${escapeHtml(data.twitterCreator)}">`);
  if (data.title) lines.push(`<meta name="twitter:title" content="${escapeHtml(data.title)}">`);
  if (data.description) lines.push(`<meta name="twitter:description" content="${escapeHtml(data.description)}">`);
  if (data.imageUrl) lines.push(`<meta name="twitter:image" content="${escapeHtml(data.imageUrl)}">`);
  if (data.imageAlt) lines.push(`<meta name="twitter:image:alt" content="${escapeHtml(data.imageAlt)}">`);

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
//  Social Card Previews
// ─────────────────────────────────────────────────────────────

function ExtractDomain(urlStr: string): string {
  if (!urlStr) return "example.com";
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname;
  } catch {
    return "example.com";
  }
}

function FacebookPreview({ data }: { data: OpenGraphFormData }) {
  const domain = ExtractDomain(data.url);
  const title = data.title || "Your Page Title Will Appear Here";
  const desc = data.description || "Provide a high-quality description to entice social network users to click through to your page.";

  return (
    <div className="bg-[#f0f2f5] p-4 rounded-xl border border-slate-200">
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm max-w-[500px] mx-auto">
        <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden relative">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.imageAlt || "Open Graph Image"}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageIcon className="w-10 h-10" />
              <span className="text-xs font-medium">1200 x 630 pixels recommended</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-[#f2f3f5] border-t border-slate-200 space-y-1">
          <p className="text-[12px] uppercase text-slate-500 font-normal tracking-tight truncate">{domain}</p>
          <h3 className="text-[16px] font-semibold text-slate-900 leading-snug line-clamp-2">{title}</h3>
          <p className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function TwitterPreview({ data }: { data: OpenGraphFormData }) {
  const domain = ExtractDomain(data.url);
  const title = data.title || "Your Twitter Card Title";
  const desc = data.description || "A concise summary of your content optimized for X/Twitter feeds.";
  const isLarge = data.twitterCardType === "summary_large_image";

  return (
    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
      <div className="bg-black border border-slate-800 rounded-2xl overflow-hidden max-w-[500px] mx-auto text-white">
        {isLarge ? (
          <div>
            <div className="w-full h-60 bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-800">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.imageAlt} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs">1200 x 628 pixels recommended</span>
                </div>
              )}
            </div>
            <div className="p-3 space-y-1">
              <p className="text-xs text-slate-500 truncate">{domain}</p>
              <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{desc}</p>
            </div>
          </div>
        ) : (
          <div className="flex p-3 gap-3 items-center">
            <div className="w-24 h-24 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-800">
              {data.imageUrl ? (
                <img src={data.imageUrl} alt={data.imageAlt} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs text-slate-500 truncate">{domain}</p>
              <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">{desc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedInPreview({ data }: { data: OpenGraphFormData }) {
  const domain = ExtractDomain(data.url);
  const title = data.title || "Professional Article Title";

  return (
    <div className="bg-[#f3f2ef] p-4 rounded-xl border border-slate-200">
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm max-w-[500px] mx-auto">
        <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.imageAlt} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ImageIcon className="w-10 h-10" />
              <span className="text-xs font-medium">LinkedIn Image Ratio 1.91:1</span>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1 border-t border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900 line-clamp-2">{title}</h3>
          <p className="text-[12px] text-slate-500 font-normal">{domain}</p>
        </div>
      </div>
    </div>
  );
}

function GooglePreview({ data }: { data: OpenGraphFormData }) {
  const domain = ExtractDomain(data.url);
  const fullUrl = data.url || `https://${domain}`;
  const title = data.title || "Your Search Result Title";
  const desc = data.description || "The meta description controls how search engines display snippets for your pages in organic search rankings.";

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-[500px] mx-auto shadow-sm space-y-1.5 font-sans">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
          {domain.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-800 font-normal">{data.siteName || domain}</span>
          <span className="text-[11px] text-slate-500 truncate max-w-[350px]">{fullUrl}</span>
        </div>
      </div>
      <h3 className="text-lg text-blue-800 font-normal hover:underline cursor-pointer leading-snug line-clamp-1">
        {title}
      </h3>
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{desc}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────

export default function OpenGraphGenerator() {
  const [formData, setFormData] = useState<OpenGraphFormData>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState<PlatformTab>("facebook");
  const [copied, setCopied] = useState(false);

  const updateField = useCallback(
    <K extends keyof OpenGraphFormData>(field: K, value: OpenGraphFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const metaTagCode = useMemo(() => generateOpenGraphTags(formData), [formData]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(metaTagCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  };

  const loadSample = () => setFormData(SAMPLE_DATA);
  const clearWorkspace = () => setFormData(DEFAULT_FORM);

  return (
    <div className="w-full space-y-8">
      {/* ── 50/50 Workspace Grid ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: FORM CONTROLS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Open Graph Meta Parameters</span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* General Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" /> Essential Open Graph Meta Tags
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title (og:title)</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="e.g. Open Graph Generator & Social Card Suite"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Canonical URL (og:url)</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => updateField("url", e.target.value)}
                      placeholder="https://example.com/page"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description (og:description)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Write a clear 1-2 sentence overview to display on social feeds..."
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 h-20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Media Configuration */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Social Card Image Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image Asset URL (og:image)</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => updateField("imageUrl", e.target.value)}
                      placeholder="https://example.com/og-banner.png"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Image Alt Text (og:image:alt)</label>
                    <input
                      type="text"
                      value={formData.imageAlt}
                      onChange={(e) => updateField("imageAlt", e.target.value)}
                      placeholder="Descriptive accessibility label for search crawlers"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Properties */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Platform Specific Directives
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site Name (og:site_name)</label>
                    <input
                      type="text"
                      value={formData.siteName}
                      onChange={(e) => updateField("siteName", e.target.value)}
                      placeholder="e.g. TwisterTools"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Object Type (og:type)</label>
                    <select
                      value={formData.ogType}
                      onChange={(e) => updateField("ogType", e.target.value as OgType)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 bg-white"
                    >
                      <option value="website">Website</option>
                      <option value="article">Article</option>
                      <option value="profile">Profile</option>
                      <option value="book">Book</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Twitter Card Format</label>
                    <select
                      value={formData.twitterCardType}
                      onChange={(e) => updateField("twitterCardType", e.target.value as TwitterCardType)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 bg-white"
                    >
                      <option value="summary_large_image">Summary Large Image</option>
                      <option value="summary">Summary Small Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Twitter Handle</label>
                    <input
                      type="text"
                      value={formData.twitterSite}
                      onChange={(e) => updateField("twitterSite", e.target.value)}
                      placeholder="@twistertools"
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Toolbar Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={loadSample}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px] transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Load Sample
                </button>
                <button
                  onClick={clearWorkspace}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Clear Workspace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: PREVIEW & CODE OUTPUT ══════════════════ */}
        <div className="space-y-5">
          {/* Card Preview Module */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Live Social Media Feed Preview</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(
                  [
                    { id: "facebook" as PlatformTab, label: "Facebook" },
                    { id: "twitter" as PlatformTab, label: "X / Twitter" },
                    { id: "linkedin" as PlatformTab, label: "LinkedIn" },
                    { id: "google" as PlatformTab, label: "Google Search" },
                  ]
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${activeTab === id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Selected Preview Box */}
              <div className="min-h-[320px] flex items-center justify-center">
                {activeTab === "facebook" && <FacebookPreview data={formData} />}
                {activeTab === "twitter" && <TwitterPreview data={formData} />}
                {activeTab === "linkedin" && <LinkedInPreview data={formData} />}
                {activeTab === "google" && <GooglePreview data={formData} />}
              </div>
            </div>
          </div>

          {/* Generated Code Module */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold">Formatted Open Graph Code Block</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <textarea
                value={metaTagCode}
                readOnly
                className="font-mono text-xs h-[240px] focus:outline-none p-4 w-full bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl resize-none cursor-text leading-relaxed"
              />

              <button
                onClick={copyToClipboard}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${copied
                    ? "bg-green-500 text-white shadow-md shadow-green-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Generated Meta Tags
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXACT SYSTEM SPECIFICATIONS)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: Open Graph Protocol Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of the Open Graph Protocol</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              The Open Graph protocol was originally created by Facebook in 2010 to allow web developers to integrate their pages into the social graph. By placing structured <code>&lt;meta&gt;</code> tags in the <code>&lt;head&gt;</code> of an HTML document, web pages can express rich object properties—such as titles, descriptions, canonical URLs, and primary image assets—that social media crawlers parse when links are shared across platforms.
            </p>
            <p>
              Without explicitly defined Open Graph metadata, social scrapers fall back to heuristic scraping. These automated scrapers scan arbitrary HTML elements, often selecting unintended headers or non-representative inline images. Implementing standardized Open Graph metadata guarantees that social media cards maintain pixel-perfect visual layout, driving significantly higher click-through rates (CTR) across platforms like Facebook, X (formerly Twitter), LinkedIn, and Slack.
            </p>
          </div>
        </div>

        {/* Card 2: Parsing & Metadata Extraction Mechanics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>The Social Crawler Extraction Pipeline</span>
          </h2>
          <div className="space-y-5">
            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
              When a user posts a URL to a social platform, a user-agent bot (such as <code>facebookexternalhit</code> or <code>Twitterbot</code>) issues an HTTP GET request to parse the target resource through a deterministic metadata pipeline:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Document DOM Tokenization",
                  body: "The social bot parses the incoming HTML stream specifically looking for standard <meta> directives inside the <head> section, ignoring body markup to optimize parsing speed.",
                },
                {
                  step: "2",
                  title: "Property Precedence Mapping",
                  body: "Platform scrapers check for platform-native tags first (e.g., twitter:title), falling back to standard Open Graph properties (og:title) if specialized overrides are missing.",
                },
                {
                  step: "3",
                  title: "Asset Validation & Resizing",
                  body: "The bot fetches the image URL defined in og:image, validating HTTP status codes, MIME type, and aspect ratio metrics against platform-specific rendering thresholds.",
                },
                {
                  step: "4",
                  title: "Edge Cache Indexing",
                  body: "Once validated, social platforms cache the extracted metadata and image thumbnail on globally distributed Edge servers to eliminate scraper latency on subsequent link shares.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                      {step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                      <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Platform Requirements Reference Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Social Network Image & Dimension Specifications</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold">Social Platform</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Recommended Dimensions</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Aspect Ratio</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold">Max File Size</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Facebook Feed", "1200 x 630 px", "1.91:1", "8 MB"],
                  ["X / Twitter Large Card", "1200 x 628 px", "1.91:1", "5 MB"],
                  ["LinkedIn Share Card", "1200 x 627 px", "1.91:1", "5 MB"],
                  ["Google Search Snippet", "1200 x 675 px", "16:9", "2 MB"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Enterprise Production Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Deployment & Optimization Workflows</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Dynamic E-Commerce Product Previews",
                body: "Inject dynamic price tags, stock availability, and high-resolution product photography into Open Graph properties to generate interactive social cards directly from database records.",
              },
              {
                title: "Programmatic Blog & CMS Publishing",
                body: "Automate Open Graph meta tag generation across Next.js, Nuxt, or WordPress platforms using structured metadata templates that populate title, author, and featured image variables.",
              },
              {
                title: "Viral Marketing & Landing Page Campaigns",
                body: "Optimize custom landing pages for social viral loops by crafting click-optimized headlines and high-contrast Open Graph imagery verified through live card visual previews.",
              },
              {
                title: "Internal Communications & Slack Unfurls",
                body: "Ensure private enterprise documentation, SaaS dashboard URLs, and internal tools render informative metadata unfurls when shared across team messaging channels.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Static Border-Highlighted FAQ Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why is Facebook showing old metadata when I share my updated URL?",
                a: "Facebook caches Open Graph metadata on their Edge servers for up to 30 days. To force Facebook to re-scrape your page and purge the old cache, input your canonical URL into the official Facebook Sharing Debugger tool and click 'Fetch new scrape information'.",
              },
              {
                q: "What happens if I omit the og:image meta tag?",
                a: "When og:image is missing, social scrapers attempt to parse random images from the body of your HTML page. This often leads to improperly cropped logos, low-resolution icons, or blank preview cards that severely reduce user engagement.",
              },
              {
                q: "Are absolute URLs required for og:image properties?",
                a: "Yes. The Open Graph protocol specification mandates fully qualified absolute URLs (e.g., https://example.com/assets/banner.png) including the HTTPS protocol scheme. Relative paths such as /assets/banner.png will fail to load in social crawlers.",
              },
              {
                q: "What is the difference between og:title and the standard HTML <title> tag?",
                a: "The standard HTML <title> tag is tailored for web browser tab labels and search engine result pages (SERPs). The og:title property specifically targets social media feeds and can be optimized with conversational copy or marketing hooks.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Platform Performance Advantages */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Architectural Performance & Privacy Guarantee</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Zap,
                title: "Zero Server Transmission",
                body: "All metadata generation and social card live preview rendering happens strictly within your browser client memory. Your URLs, descriptions, and media assets are never logged or stored on external servers.",
              },
              {
                icon: Shield,
                title: "RFC Protocol Compliance",
                body: "The output code string complies rigorously with Open Graph Protocol standard conventions and Twitter Card directives, ensuring flawless compatibility across all major social networks.",
              },
              {
                icon: Cpu,
                title: "Real-Time Visual Validation",
                body: "Instantly test and verify how your social cards render on Facebook, X/Twitter, LinkedIn, and Google Search with real-time state synchronization.",
              },
              {
                icon: Blocks,
                title: "Zero Third-Party Dependencies",
                body: "Built entirely in lightweight, modern TypeScript and React without bloated external dependencies, guaranteeing high-speed performance and security.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Open Graph Generator & Social Card Suite",
            url: "https://www.twistertools.com/tools/web-tools/open-graph-generator",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            description:
              "Generate and preview valid Open Graph and Twitter Card HTML meta tags for social media link optimization.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Why is Facebook showing old metadata when I share my updated URL?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Facebook caches Open Graph metadata for up to 30 days. Force Facebook to re-scrape your page using the official Facebook Sharing Debugger tool.",
                },
              },
              {
                "@type": "Question",
                name: "What happens if I omit the og:image meta tag?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Social scrapers will attempt to parse arbitrary images from your HTML body, leading to improperly cropped logos or blank preview cards.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}