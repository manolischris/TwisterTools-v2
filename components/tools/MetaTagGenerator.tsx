"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  Globe,
  FileCode,
  Check,
  Copy,
  Trash2,
  BookOpen,
  HelpCircle,
  Info,
  Search,
  Code,
  Eye,
  Image,
  Share2,
  ArrowRight,
  Shield,
  Zap,
  Layout,
  BarChart3,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface MetaFormData {
  // Basic Meta Tags
  siteTitle: string;
  siteDescription: string;
  keywords: string;
  author: string;
  robotsIndex: "index" | "noindex";
  robotsFollow: "follow" | "nofollow";
  viewport: string;
  charset: string;

  // OpenGraph Meta Tags
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogType: "website" | "article";

  // Twitter Card Meta Tags
  twitterCardType: "summary" | "summary_large_image";
  twitterHandle: string;
}

type PreviewTab = "google" | "facebook" | "twitter";

const SAMPLE_DATA: MetaFormData = {
  siteTitle: "TwisterTools - Free Online Utilities & Web Tools",
  siteDescription:
    "Discover 100+ free online tools for developers, designers, and SEO professionals. Generate QR codes, format JSON, validate XML, minify HTML/CSS, calculate hashes, and more — all 100% client-side with zero server uploads.",
  keywords: "online tools, web utilities, developer tools, SEO tools, free tools, twistertools",
  author: "TwisterTools",
  robotsIndex: "index",
  robotsFollow: "follow",
  viewport: "width=device-width, initial-scale=1.0",
  charset: "UTF-8",
  ogTitle: "TwisterTools - Free Online Utilities & Web Tools Suite",
  ogDescription:
    "100+ free online tools for developers, designers, and SEO professionals. QR codes, JSON formatter, XML validator, hash generator, and more — 100% client-side, zero uploads.",
  ogImageUrl: "https://www.twistertools.com/images/og-default.jpg",
  ogType: "website",
  twitterCardType: "summary_large_image",
  twitterHandle: "@twistertools",
};

const DEFAULT_FORM: MetaFormData = {
  siteTitle: "",
  siteDescription: "",
  keywords: "",
  author: "",
  robotsIndex: "index",
  robotsFollow: "follow",
  viewport: "width=device-width, initial-scale=1.0",
  charset: "UTF-8",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  ogType: "website",
  twitterCardType: "summary_large_image",
  twitterHandle: "",
};

// ─────────────────────────────────────────────────────────────
//  Meta Tag Code Generation Engine (Pure TypeScript)
// ─────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "\x26amp;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#039;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;");
}

function generateMetaTags(data: MetaFormData): string {
  const lines: string[] = [];

  if (data.charset) {
    lines.push('<meta charset="' + data.charset + '">');
  }
  if (data.viewport) {
    lines.push('<meta name="viewport" content="' + data.viewport + '">');
  }
  if (data.siteTitle) {
    lines.push('<title>' + escapeHtml(data.siteTitle) + '</title>');
  }
  if (data.siteDescription) {
    lines.push('<meta name="description" content="' + escapeHtml(data.siteDescription) + '">');
  }
  if (data.keywords) {
    lines.push('<meta name="keywords" content="' + escapeHtml(data.keywords) + '">');
  }
  if (data.author) {
    lines.push('<meta name="author" content="' + escapeHtml(data.author) + '">');
  }
  if (data.robotsIndex || data.robotsFollow) {
    lines.push('<meta name="robots" content="' + data.robotsIndex + ', ' + data.robotsFollow + '">');
  }
  if (data.ogTitle) {
    lines.push('<meta property="og:title" content="' + escapeHtml(data.ogTitle) + '">');
  }
  if (data.ogDescription) {
    lines.push('<meta property="og:description" content="' + escapeHtml(data.ogDescription) + '">');
  }
  if (data.ogImageUrl) {
    lines.push('<meta property="og:image" content="' + escapeHtml(data.ogImageUrl) + '">');
  }
  if (data.ogType) {
    lines.push('<meta property="og:type" content="' + data.ogType + '">');
  }
  if (data.twitterCardType) {
    lines.push('<meta name="twitter:card" content="' + data.twitterCardType + '">');
  }
  if (data.twitterHandle) {
    lines.push('<meta name="twitter:site" content="' + data.twitterHandle + '">');
  }
  if (data.ogTitle) {
    lines.push('<meta name="twitter:title" content="' + escapeHtml(data.ogTitle) + '">');
  }
  if (data.ogDescription) {
    lines.push('<meta name="twitter:description" content="' + escapeHtml(data.ogDescription) + '">');
  }
  if (data.ogImageUrl) {
    lines.push('<meta name="twitter:image" content="' + escapeHtml(data.ogImageUrl) + '">');
  }

  return lines.join("\n");
}

// ── Inline SVG icons for Facebook and Twitter (not in lucide-react) ──

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  Google Search Preview Component
// ─────────────────────────────────────────────────────────────

function GoogleSearchPreview({ data }: { data: MetaFormData }) {
  const title = data.siteTitle || data.ogTitle || "Your Site Title";
  const description = data.siteDescription || data.ogDescription || "Your meta description will appear here...";
  const displayUrl = "www.yoursite.com › page-slug";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          <span className="ml-2 text-xs text-slate-400">Google Search Preview</span>
        </div>
      </div>
      <div className="p-4 space-y-1.5">
        <p className="text-xs text-green-700 font-medium truncate">{displayUrl}</p>
        <h3 className="text-lg text-blue-800 font-medium leading-snug cursor-pointer hover:underline line-clamp-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Facebook / LinkedIn Share Card Preview
// ─────────────────────────────────────────────────────────────

function FacebookSharePreview({ data }: { data: MetaFormData }) {
  const title = data.ogTitle || data.siteTitle || "Your OG Title";
  const description = data.ogDescription || data.siteDescription || "Your OpenGraph description...";
  const imageUrl = data.ogImageUrl || "";
  const domain = "yoursite.com";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <FacebookIcon className="w-4 h-4 text-white" />
          <span className="text-xs text-blue-200 font-medium">Facebook / LinkedIn Share Preview</span>
        </div>
      </div>
      {imageUrl ? (
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt="OG Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-slate-400"><svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No OG Image URL provided</p>
          </div>
        </div>
      )}
      <div className="p-4 space-y-1.5">
        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{domain}</p>
        <h3 className="text-[15px] text-slate-900 font-semibold leading-snug line-clamp-2">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Twitter Card Preview
// ─────────────────────────────────────────────────────────────

function TwitterCardPreview({ data }: { data: MetaFormData }) {
  const title = data.ogTitle || data.siteTitle || "Your Card Title";
  const description = data.ogDescription || data.siteDescription || "Your Twitter card description...";
  const imageUrl = data.ogImageUrl || "";
  const handle = data.twitterHandle || "@username";
  const isLarge = data.twitterCardType === "summary_large_image";

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2">
        <div className="flex items-center gap-2">
          <TwitterIcon className="w-4 h-4 text-white" />
          <span className="text-xs text-sky-200 font-medium">Twitter Card Preview</span>
        </div>
      </div>
      <div className={isLarge ? "space-y-0" : "flex gap-3 p-4"}>
        {imageUrl ? (
          <div className={
            isLarge
              ? "w-full h-48 bg-slate-100 overflow-hidden border-b border-slate-200"
              : "w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden"
          }>
            <img
              src={imageUrl}
              alt="Card"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="flex items-center justify-center w-full h-full text-slate-300"><svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                }
              }}
            />
          </div>
        ) : isLarge ? (
          <div className="w-full h-48 bg-gradient-to-br from-sky-100 to-slate-100 flex items-center justify-center border-b border-slate-200">
            <div className="text-center">
              <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No image provided</p>
            </div>
          </div>
        ) : null}
        <div className={isLarge ? "p-4 space-y-1.5" : "flex-1 min-w-0 space-y-1.5"}>
          <p className="text-sm text-slate-500 font-medium truncate">{handle}</p>
          <h3 className="text-[15px] text-slate-900 font-semibold leading-snug line-clamp-2">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{description}</p>
          <p className="text-xs text-slate-400">{isLarge ? "Summary Large Image Card" : "Summary Card"}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Form Field Components
// ─────────────────────────────────────────────────────────────

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  optional,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: boolean;
}) {
  const inputClasses =
    "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
      </label>
      {rows && rows > 1 ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses + " resize-none h-20"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main MetaTagGenerator Component
// ─────────────────────────────────────────────────────────────

export default function MetaTagGenerator() {
  const [formData, setFormData] = useState<MetaFormData>(DEFAULT_FORM);
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>("google");
  const [copied, setCopied] = useState(false);
  const codeOutputRef = useRef<HTMLPreElement>(null);

  const updateField = useCallback(
    <K extends keyof MetaFormData>(field: K, value: MetaFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const loadSample = useCallback(() => {
    setFormData(SAMPLE_DATA);
  }, []);

  const clearAll = useCallback(() => {
    setFormData(DEFAULT_FORM);
  }, []);

  const metaTagCode = useMemo(() => generateMetaTags(formData), [formData]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(metaTagCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = metaTagCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [metaTagCode]);

  const previewTabs: { id: PreviewTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "google", label: "Google Search Preview", icon: Search },
    { id: "facebook", label: "Facebook / LinkedIn Card", icon: Globe },
    { id: "twitter", label: "Twitter Card Preview", icon: Globe },
  ];

  const filledFieldCount = useMemo(() => {
    let count = 0;
    if (formData.siteTitle) count++;
    if (formData.siteDescription) count++;
    if (formData.keywords) count++;
    if (formData.author) count++;
    if (formData.ogTitle) count++;
    if (formData.ogDescription) count++;
    if (formData.ogImageUrl) count++;
    if (formData.twitterHandle) count++;
    return count;
  }, [formData]);

  return (
    <>
      {/* ── Interactive Tool Dashboard ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── Left Column: Form Controls ── */}
        <div className="space-y-5">
          {/* Basic Meta Tags Section */}
          <FormSection icon={Globe} title="Basic Meta Tags">
            <TextField
              label="Site Title"
              value={formData.siteTitle}
              onChange={(v) => updateField("siteTitle", v)}
              placeholder="Enter your page title (50-60 chars recommended)"
            />
            <TextField
              label="Meta Description"
              value={formData.siteDescription}
              onChange={(v) => updateField("siteDescription", v)}
              placeholder="Enter meta description (150-160 chars recommended)"
              rows={3}
            />
            <TextField
              label="Keywords"
              value={formData.keywords}
              onChange={(v) => updateField("keywords", v)}
              placeholder="keyword1, keyword2, keyword3"
              optional
            />
            <TextField
              label="Author"
              value={formData.author}
              onChange={(v) => updateField("author", v)}
              placeholder="Site author name"
              optional
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Robots Index"
                value={formData.robotsIndex}
                onChange={(v) => updateField("robotsIndex", v as "index" | "noindex")}
                options={[
                  { value: "index", label: "Index" },
                  { value: "noindex", label: "No Index" },
                ]}
              />
              <SelectField
                label="Robots Follow"
                value={formData.robotsFollow}
                onChange={(v) => updateField("robotsFollow", v as "follow" | "nofollow")}
                options={[
                  { value: "follow", label: "Follow" },
                  { value: "nofollow", label: "No Follow" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Viewport"
                value={formData.viewport}
                onChange={(v) => updateField("viewport", v)}
                placeholder="width=device-width, initial-scale=1.0"
              />
              <SelectField
                label="Charset"
                value={formData.charset}
                onChange={(v) => updateField("charset", v)}
                options={[
                  { value: "UTF-8", label: "UTF-8" },
                  { value: "UTF-16", label: "UTF-16" },
                  { value: "ISO-8859-1", label: "ISO-8859-1" },
                  { value: "windows-1252", label: "Windows-1252" },
                ]}
              />
            </div>
          </FormSection>

          {/* OpenGraph Meta Tags Section */}
          <FormSection icon={Share2} title="OpenGraph Tags (Facebook / LinkedIn)">
            <TextField
              label="OG Title"
              value={formData.ogTitle}
              onChange={(v) => updateField("ogTitle", v)}
              placeholder="OpenGraph title (overrides site title)"
              optional
            />
            <TextField
              label="OG Description"
              value={formData.ogDescription}
              onChange={(v) => updateField("ogDescription", v)}
              placeholder="OpenGraph description (overrides meta description)"
              rows={3}
              optional
            />
            <TextField
              label="OG Image URL"
              value={formData.ogImageUrl}
              onChange={(v) => updateField("ogImageUrl", v)}
              placeholder="https://example.com/image.jpg (1200x630 recommended)"
              optional
            />
            <SelectField
              label="OG Type"
              value={formData.ogType}
              onChange={(v) => updateField("ogType", v as "website" | "article")}
              options={[
                { value: "website", label: "Website" },
                { value: "article", label: "Article" },
              ]}
            />
          </FormSection>

          {/* Twitter Card Meta Tags Section */}
          <FormSection icon={Share2} title="Twitter Card Tags">
            <SelectField
              label="Twitter Card Type"
              value={formData.twitterCardType}
              onChange={(v) => updateField("twitterCardType", v as "summary" | "summary_large_image")}
              options={[
                { value: "summary_large_image", label: "Summary Large Image" },
                { value: "summary", label: "Summary Card" },
              ]}
            />
            <TextField
              label="Twitter Handle"
              value={formData.twitterHandle}
              onChange={(v) => updateField("twitterHandle", v)}
              placeholder="@yourhandle"
              optional
            />
          </FormSection>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadSample}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium text-sm rounded-xl transition-colors border border-indigo-200"
            >
              <BookOpen className="w-4 h-4" />
              Load Sample Data
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-xl transition-colors border border-slate-300"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* ── Right Column: Previews & Code Output ── */}
        <div className="space-y-6">
          {/* Preview Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Eye className="w-5 h-5 text-indigo-200" />
                <h2 className="text-white font-semibold text-sm">Live Social Preview</h2>
                {filledFieldCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                    {filledFieldCount} fields
                  </span>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200">
              {previewTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activePreviewTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePreviewTab(tab.id)}
                    className={
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-all min-h-[44px] " +
                      (isActive
                        ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-b-2 border-transparent")
                    }
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.id === "google"
                        ? "Google"
                        : tab.id === "facebook"
                        ? "Facebook"
                        : "Twitter"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Preview Content */}
            <div className="p-5">
              {activePreviewTab === "google" && <GoogleSearchPreview data={formData} />}
              {activePreviewTab === "facebook" && <FacebookSharePreview data={formData} />}
              {activePreviewTab === "twitter" && <TwitterCardPreview data={formData} />}
            </div>
          </div>

          {/* Code Output */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-indigo-200" />
                <h2 className="text-white font-semibold text-sm">Generated Meta Tags</h2>
                <button
                  onClick={handleCopy}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-300" />
                      <span className="text-green-200">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Meta Tags</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-0">
              <pre
                ref={codeOutputRef}
                className="w-full h-64 p-5 bg-slate-900 text-green-400 font-mono text-sm leading-relaxed overflow-auto whitespace-pre select-all"
              >
                {metaTagCode || "<!-- Fill in the form fields above to generate meta tags -->"}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ── Below-the-Fold SEO Content: Card 1 ── */}
      <section className="bg-white border border-slate-200 rounded-2xl md:p-10 shadow-sm space-y-6 mb-6 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          <span>What Are Meta Tags and Why Do They Matter for SEO?</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          Meta tags are snippets of HTML code that provide structured metadata about a web page to search
          engines and social media platforms. Although they are not visible to site visitors browsing the
          page itself, meta tags are read by crawlers, browsers, and social preview scrapers to determine
          how your content appears in search results and when shared on social networks.
        </p>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          The three most critical meta tag categories are: <strong>Standard Meta Tags</strong> (title,
          description, keywords, viewport, charset, robots directives), <strong>OpenGraph Protocol Tags</strong>{" "}
          (used by Facebook, LinkedIn, and other platforms to render rich share previews), and{" "}
          <strong>Twitter Card Tags</strong> (used by X/Twitter to control how your content appears in
          tweets). Together, they form a comprehensive metadata layer that powers how your site is
          indexed, displayed, and shared across the entire web ecosystem.
        </p>
      </section>

      {/* ── Below-the-Fold SEO Content: Card 2 ── */}
      <section className="bg-white border border-slate-200 rounded-2xl md:p-10 shadow-sm space-y-6 mb-6 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <span>How Meta Tags Directly Impact Click-Through Rates (CTR)</span>
        </h2>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          Your title tag and meta description are the first impression your website makes in search engine
          results pages (SERPs). A well-crafted title tag (50-60 characters) that includes your primary
          keyword and a compelling value proposition can increase organic CTR by 20-30%. The meta
          description (150-160 characters) acts as your ad copy - it should summarize the page content,
          include a call to action, and entice users to click through to your site over competitors.
        </p>
        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
          OpenGraph and Twitter Card tags extend this impact to social platforms. When someone shares your
          URL on Facebook, LinkedIn, or X/Twitter, the platform scrapes your OG/Twitter tags to generate a
          rich preview card. Pages with complete, optimized social meta tags see 3-5x higher engagement on
          shared links compared to pages with missing or generic previews. Our Meta Tag Generator and
          Social Preview Suite helps you craft, preview, and deploy these tags with zero guesswork.
        </p>
      </section>

      {/* ── Below-the-Fold SEO Content: Card 3 ── */}
      <section className="bg-white border border-slate-200 rounded-2xl md:p-10 shadow-sm space-y-6 mb-6 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <span>How to Use the Meta Tag Generator & Social Preview Suite</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              step: "01", title: "Fill In Your Meta Data",
              body: "Start by entering your page title, description, keywords, and author in the Basic Meta Tags section. Select your Robots directives (Index/NoIndex, Follow/NoFollow) and choose your character encoding - UTF-8 is the universal standard."
            },
            {
              step: "02", title: "Configure OpenGraph Tags",
              body: "Scroll to the OpenGraph section and enter a dedicated OG title, description, and image URL (1200x630 pixels recommended). Choose between Website or Article type depending on your content format."
            },
            {
              step: "03", title: "Set Twitter Card Options",
              body: "Choose between Summary Card (small preview with left-aligned image) or Summary Large Image Card (full-width hero image). Add your Twitter handle so your brand is credited when shared on X/Twitter."
            },
            {
              step: "04", title: "Preview Live Social Cards",
              body: "As you type, the right panel updates in real-time. Toggle between Google Search Preview, Facebook/LinkedIn Share Card, and Twitter Card Preview tabs to see exactly how your tags will render on each platform."
            },
            {
              step: "05", title: "Copy the Generated Code",
              body: "Once satisfied, click the Copy Meta Tags button in the code output panel. The formatted HTML meta tag block is copied to your clipboard with a green checkmark confirmation."
            },
            {
              step: "06", title: "Use Sample Data to Get Started",
              body: "Click Load Sample Data to populate the form with realistic example values. This is great for first-time users to see how the previews and code output work."
            },
          ].map(({ step, title, body }) => (
            <div key={step} className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Below-the-Fold SEO Content: Card 4 - Use Cases ── */}
      <section className="bg-white border border-slate-200 rounded-2xl md:p-10 shadow-sm space-y-6 mb-6 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Layout className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Real-World Applications & Use Cases</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { title: "E-Commerce Product Pages", body: "Generate unique meta tags for each product including title, description, OG image (product photo), and article type. Ensure your products display beautifully when shared on social media or listed in Google Shopping." },
            { title: "Blog Posts & Articles", body: "Craft compelling titles and descriptions for blog content. Use OG:type 'article' to enable enhanced article previews on Facebook/LinkedIn. Include author metadata and Twitter handle for proper attribution." },
            { title: "Landing Pages & Campaigns", body: "Create optimized meta tags for marketing landing pages and seasonal campaigns. A/B test different titles and descriptions using the live preview feature to see exactly how they will appear in search results." },
            { title: "Portfolio & Personal Websites", body: "Ensure your portfolio site presents professionally across all platforms. Proper meta tags help potential clients find you in search and see rich previews when you share your work on social media." },
            { title: "SEO Agencies & Consultants", body: "Use the Meta Tag Generator as a client demo tool or SEO audit remediation tool. Generate optimized meta tag sets for client sites and export the code for immediate deployment." },
            { title: "Content Marketing & Social Media", body: "Plan your social sharing strategy by previewing how content will appear on Facebook, LinkedIn, and X/Twitter before publishing. Ensure consistent branding across all platforms with proper OG image dimensions." },
            { title: "Web Development Starter Kits", body: "Include generated meta tags in website boilerplate templates. Speed up development by having pre-validated, SEO-optimized meta tag code ready to drop into any Next.js, React, or HTML project." },
            { title: "Newsletter & Email Marketing", body: "Generate OpenGraph tags for landing pages used in email marketing campaigns. Rich link previews in messaging apps and social platforms drive higher engagement from your email subscriber base." },
          ].map(({ title, body }) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Below-the-Fold SEO Content: Card 5 - FAQ ── */}
      <section className="bg-white border border-slate-200 rounded-2xl md:p-10 shadow-sm space-y-6 mb-6 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <span>Frequently Asked Questions</span>
        </h2>
        <div className="space-y-5">
          {[
            { q: "What is the ideal length for a title tag and meta description?", a: "The optimal title tag length is 50-60 characters to avoid truncation in SERPs. Google typically displays the first 50-60 characters (approximately 600 pixels). Meta descriptions should be 150-160 characters. Both should include your target keyword naturally, a unique value proposition, and a compelling reason to click." },
            { q: "Do meta keywords still matter for SEO in 2026?", a: "No, Google officially stopped using the meta keywords tag for ranking purposes over a decade ago due to widespread keyword stuffing abuse. Bing and other search engines also largely ignore it. However, some internal search systems and CMS platforms still reference keywords for categorization. Your focus should remain on the title tag, meta description, and OpenGraph/Twitter Card tags." },
            { q: "What is the difference between OpenGraph and Twitter Card tags?", a: "OpenGraph (OG) tags are used by Facebook, LinkedIn, Pinterest, and many other platforms to render rich previews when a URL is shared. Twitter Card tags specifically control how content appears on X/Twitter. While Twitter also falls back to OG tags if Twitter Card tags are missing, defining both ensures precise control over each platform's rendering." },
            { q: "Why is my social preview not showing the correct image?", a: "The most common causes are: (1) image URL is not fully qualified - always use the full https:// URL, not a relative path; (2) image dimensions are too small - Facebook/LinkedIn require at least 600x315 pixels (1200x630 recommended); (3) the image URL returns a non-200 status code or is blocked by robots.txt; (4) the page has no OG image tag defined." },
            { q: "Can I have multiple OG images or Twitter cards on one page?", a: "You should define only ONE set of OG tags per URL. If you need different previews for different contexts, most platforms will use the first valid OG tag they encounter. For Twitter, define exactly one twitter:card type (summary or summary_large_image) per page. Multiple conflicting tags can cause unpredictable behavior." },
            { q: "Do meta tags affect page speed or Core Web Vitals?", a: "Meta tags themselves have a negligible impact on page load time since they are lightweight HTML elements parsed inline. However, OG image URLs that point to unoptimized, large images can delay social preview generation and increase bandwidth. Always serve social preview images at recommended dimensions through a CDN." },
          ].map(({ q, a }) => (
            <div key={q} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                {q}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── JSON-LD Structured Data: FAQPage ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              { "@type": "Question", name: "What is the ideal length for a title tag and meta description?", acceptedAnswer: { "@type": "Answer", text: "The optimal title tag length is 50-60 characters to avoid truncation in SERPs. Meta descriptions should be 150-160 characters. Both should include your target keyword naturally." } },
              { "@type": "Question", name: "Do meta keywords still matter for SEO in 2026?", acceptedAnswer: { "@type": "Answer", text: "No, Google stopped using the meta keywords tag for ranking purposes. Your focus should remain on the title tag, meta description, and OpenGraph/Twitter Card tags." } },
              { "@type": "Question", name: "What is the difference between OpenGraph and Twitter Card tags?", acceptedAnswer: { "@type": "Answer", text: "OpenGraph tags are used by Facebook and LinkedIn. Twitter Card tags control how content appears on X/Twitter. Defining both ensures precise control." } },
              { "@type": "Question", name: "Why is my social preview not showing the correct image?", acceptedAnswer: { "@type": "Answer", text: "Common causes include: image URL not fully qualified, image dimensions too small (minimum 600x315), or the image returns a non-200 status code." } },
              { "@type": "Question", name: "Can I have multiple OG images or Twitter cards on one page?", acceptedAnswer: { "@type": "Answer", text: "You should define only ONE set of OG tags per URL. Multiple conflicting tags can cause unpredictable behavior across platforms." } },
              { "@type": "Question", name: "Do meta tags affect page speed or Core Web Vitals?", acceptedAnswer: { "@type": "Answer", text: "Meta tags themselves have negligible impact on page load time. Always serve social preview images at recommended dimensions through a CDN." } },
            ],
          }),
        }}
      />

      {/* ── JSON-LD Structured Data: WebApplication ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Meta Tag Generator & Social Preview Suite",
            description: "Free online Meta Tag Generator and Social Preview Suite. Generate standard meta tags, OpenGraph tags, and Twitter Card tags with live Google search preview, Facebook/LinkedIn share card preview, and Twitter card preview. Pure TypeScript, 100% client-side, zero external dependencies.",
            url: "https://www.twistertools.com/tools/web-tools/meta-tag-generator",
            applicationCategory: "UtilityApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Interactive form controls for standard meta tags, OpenGraph tags, and Twitter Card tags",
              "Live Google Search Preview Card rendering",
              "Live Facebook/LinkedIn Share Card preview",
              "Live Twitter Card Preview with Summary and Summary Large Image modes",
              "Formatted HTML code block output with one-click copy",
              "Load Sample Data and Clear All controls",
              "Charset, Viewport, Robots directives, and OG Type configuration",
              "100% client-side execution with zero server transmission",
              "Zero external npm dependencies - pure TypeScript implementation",
            ],
            browserRequirements: "Requires JavaScript",
            author: { "@type": "Organization", name: "TwisterTools", url: "https://www.twistertools.com" },
          }),
        }}
      />

      {/* ── Social Sharing Card ── */}
    </>
  );
}