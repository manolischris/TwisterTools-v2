"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Globe,
  Search,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  FileCode2,
  Trash2,
  HelpCircle,
  Zap,
  Shield,
  Layers,
  Database,
  Cpu,
  FileText,
  Download,
  Settings,
  Link2,
  CheckCircle2,
  Sliders,
  Code2,
  List,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface SitemapUrlConfig {
  url: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: string;
}

interface CrawlerOptions {
  includeImages: boolean;
  includeLastMod: boolean;
  defaultPriority: string;
  defaultFreq: ChangeFreq;
  maxUrls: number;
}

const DEFAULT_OPTIONS: CrawlerOptions = {
  includeImages: false,
  includeLastMod: true,
  defaultPriority: "0.8",
  defaultFreq: "weekly",
  maxUrls: 100,
};

// ─────────────────────────────────────────────────────────────
// Pure Helper Functions
// ─────────────────────────────────────────────────────────────

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    return trimmed;
  }
}

function parseRawUrls(rawText: string): string[] {
  const lines = rawText.split(/\r?\n/);
  const validUrls: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    
    // Split on whitespace or commas in case user pastes bulk lists
    const tokens = trimmed.split(/[\s,]+/);
    for (const token of tokens) {
      if (!token) continue;
      const normalized = normalizeUrl(token);
      try {
        new URL(normalized);
        if (!seen.has(normalized)) {
          seen.add(normalized);
          validUrls.push(normalized);
        }
      } catch {
        /* skip invalid url token */
      }
    }
  }

  return validUrls;
}

function generateXmlSitemap(entries: SitemapUrlConfig[], options: CrawlerOptions): string {
  const today = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`;
  if (options.includeImages) {
    xml += `\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`;
  }
  xml += `>\n`;

  for (const entry of entries) {
    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;
    if (options.includeLastMod) {
      xml += `    <lastmod>${entry.lastmod || today}</lastmod>\n`;
    }
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

function generateTxtSitemap(entries: SitemapUrlConfig[]): string {
  return entries.map((e) => e.url).join("\n");
}

function generateHtmlSitemap(entries: SitemapUrlConfig[]): string {
  let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>HTML Sitemap</title>\n</head>\n<body>\n  <h1>Sitemap</h1>\n  <ul>\n`;
  for (const entry of entries) {
    html += `    <li><a href="${escapeXml(entry.url)}">${escapeXml(entry.url)}</a></li>\n`;
  }
  html += `  </ul>\n</body>\n</html>`;
  return html;
}

const SAMPLE_URLS = `https://example.com/
https://example.com/about
https://example.com/services
https://example.com/blog/getting-started
https://example.com/contact`;

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function SitemapGenerator() {
  // ── Core State ──
  const [rawInput, setRawInput] = useState(SAMPLE_URLS);
  const [outputFormat, setOutputFormat] = useState<"xml" | "txt" | "html">("xml");
  const [options, setOptions] = useState<CrawlerOptions>(DEFAULT_OPTIONS);
  
  const [urlConfigs, setUrlConfigs] = useState<SitemapUrlConfig[]>([]);
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);

  // ── Sync Parser and Generator ──
  const processUrls = useCallback(() => {
    setError(null);
    if (!rawInput.trim()) {
      setUrlConfigs([]);
      setGeneratedOutput("");
      return;
    }

    const parsedUrls = parseRawUrls(rawInput);

    if (parsedUrls.length === 0) {
      setError("No valid URLs found. Please enter fully qualified domain URLs (e.g., https://example.com).");
      setUrlConfigs([]);
      setGeneratedOutput("");
      return;
    }

    if (parsedUrls.length > options.maxUrls) {
      setError(`URL limit reached. Truncated list to maximum configured threshold of ${options.maxUrls} URLs.`);
    }

    const today = new Date().toISOString().split("T")[0];
    const sliced = parsedUrls.slice(0, options.maxUrls);

    const configs: SitemapUrlConfig[] = sliced.map((url, index) => ({
      url,
      lastmod: today,
      changefreq: index === 0 ? "daily" : options.defaultFreq,
      priority: index === 0 ? "1.0" : options.defaultPriority,
    }));

    setUrlConfigs(configs);

    if (outputFormat === "xml") {
      setGeneratedOutput(generateXmlSitemap(configs, options));
    } else if (outputFormat === "txt") {
      setGeneratedOutput(generateTxtSitemap(configs));
    } else {
      setGeneratedOutput(generateHtmlSitemap(configs));
    }
  }, [rawInput, outputFormat, options]);

  useEffect(() => {
    processUrls();
  }, [processUrls]);

  // ── Actions ──
  const handleSimulatedCrawl = () => {
    setIsCrawling(true);
    setError(null);
    setTimeout(() => {
      setIsCrawling(false);
      processUrls();
    }, 600);
  };

  const handleClear = () => {
    setRawInput("");
    setGeneratedOutput("");
    setUrlConfigs([]);
    setError(null);
  };

  const copyToClipboard = async () => {
    if (!generatedOutput) return;
    try {
      await navigator.clipboard.writeText(generatedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent fallback */
    }
  };

  const downloadSitemap = () => {
    if (!generatedOutput) return;
    const extensions = { xml: "xml", txt: "txt", html: "html" };
    const mimeTypes = { xml: "application/xml", txt: "text/plain", html: "text/html" };
    
    const blob = new Blob([generatedOutput], { type: mimeTypes[outputFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sitemap.${extensions[outputFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (str: string) => {
    const bytes = new TextEncoder().encode(str).length;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: Inputs & Crawler Config ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl flex items-center justify-center bg-gradient-to-br from-slate-100 to-indigo-100 shadow-sm">
                  <Link2 className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold text-slate-900">URL List & Discovery Queue</span>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                {urlConfigs.length} {urlConfigs.length === 1 ? "URL" : "URLs"} Detected
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Input Textarea */}
              <div>
                <label htmlFor="sitemap-url-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target URLs (Paste one per line)
                </label>
                <textarea
                  id="sitemap-url-input"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`https://example.com/\nhttps://example.com/about\nhttps://example.com/contact`}
                  className="font-mono text-sm h-[260px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              {/* Crawl & Sitemap Options Toolbar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Sitemap Protocol Settings
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label htmlFor="default-freq" className="block font-medium text-slate-600 mb-1">
                      Default Change Frequency
                    </label>
                    <select
                      id="default-freq"
                      value={options.defaultFreq}
                      onChange={(e) => setOptions((p) => ({ ...p, defaultFreq: e.target.value as ChangeFreq }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="always">always</option>
                      <option value="hourly">hourly</option>
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                      <option value="yearly">yearly</option>
                      <option value="never">never</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="default-priority" className="block font-medium text-slate-600 mb-1">
                      Default Priority
                    </label>
                    <select
                      id="default-priority"
                      value={options.defaultPriority}
                      onChange={(e) => setOptions((p) => ({ ...p, defaultPriority: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1.0">1.0 (Highest)</option>
                      <option value="0.9">0.9</option>
                      <option value="0.8">0.8 (Standard)</option>
                      <option value="0.7">0.7</option>
                      <option value="0.5">0.5 (Medium)</option>
                      <option value="0.3">0.3 (Low)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <label htmlFor="toggle-lastmod" className="font-medium text-slate-700 cursor-pointer">
                    Include &lt;lastmod&gt; Timestamp
                  </label>
                  <input
                    id="toggle-lastmod"
                    type="checkbox"
                    checked={options.includeLastMod}
                    onChange={(e) => setOptions((p) => ({ ...p, includeLastMod: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="sitemap-run-crawl"
                  onClick={handleSimulatedCrawl}
                  disabled={isCrawling || !rawInput.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 min-h-[44px] disabled:opacity-50"
                >
                  {isCrawling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isCrawling ? "Parsing URLs..." : "Compile Sitemap"}
                </button>

                <button
                  id="sitemap-clear-btn"
                  onClick={handleClear}
                  disabled={!rawInput}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Workspace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: Output & File Exporter ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Slate-to-Indigo Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Sitemap Payload Exporter</span>
              </div>
              <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded text-indigo-100">
                {formatBytes(generatedOutput)}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Output Format Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                {(
                  [
                    { id: "xml", label: "XML Standard", icon: Code2 },
                    { id: "txt", label: "TXT List", icon: List },
                    { id: "html", label: "HTML Sitemap", icon: FileText },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setOutputFormat(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                      outputFormat === id
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Output Display Container */}
              <div className="relative">
                <textarea
                  id="sitemap-output-textarea"
                  value={generatedOutput}
                  readOnly
                  onClick={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.select();
                  }}
                  placeholder="Generated sitemap code will appear here..."
                  className="font-mono text-xs h-[320px] outline-none p-4 w-full bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl resize-none cursor-pointer leading-relaxed"
                />
              </div>

              {/* Export Toolbar */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="sitemap-copy-btn"
                  onClick={copyToClipboard}
                  disabled={!generatedOutput}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    generatedOutput
                      ? copied
                        ? "bg-green-500 text-white shadow-md shadow-green-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Code
                    </>
                  )}
                </button>

                <button
                  id="sitemap-download-btn"
                  onClick={downloadSitemap}
                  disabled={!generatedOutput}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-200 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        {/* Card 1: Technical Architecture of XML Sitemaps */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of standard XML Sitemaps</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              An <strong>XML Sitemap</strong> is a structured document defined by the Sitemaps.org protocol (supported by Google, Bing, Yandex, and Yahoo!) that explicitly informs search engine web crawlers about accessible URLs on a website. By declaring canonical web page locations alongside meta attributes such as modification timestamps (&lt;lastmod&gt;) and crawl priorities (&lt;priority&gt;), site operators ensure efficient discovery of newly published or updated content.
            </p>
            <p>
              Modern web applications relying heavily on client-side rendering (React, Vue, Next.js) or dynamic database routing often create complex link graphs where traditional web crawlers can miss deeply nested pages. An XML sitemap acts as an authoritative index directory, bridging the gap between site architecture and search engine indexing bots (like Googlebot and Bingbot).
            </p>
            <p>
              Under official protocol specifications, a single XML sitemap file is limited to a maximum uncompressed file size of 50 MB and no more than 50,000 URLs. For large-scale enterprise platforms exceeding these constraints, a <strong>Sitemap Index File</strong> must be utilized to link multiple child XML sitemaps in a hierarchical tree structure.
            </p>
          </div>
        </div>

        {/* Card 2: XML Sitemap Protocol Schema Reference */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>XML Sitemap Tag Attributes Specification</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                tag: "<loc>",
                req: "Mandatory",
                body: "Specifies the absolute, fully qualified URL of the web page. Must begin with a valid protocol scheme (e.g., https://) and end with trailing slashes matching your canonical headers. Must be under 2,048 characters.",
              },
              {
                tag: "<lastmod>",
                req: "Optional (Recommended)",
                body: "Indicates the ISO 8601 modification date of the document (YYYY-MM-DD). Providing accurate timestamps helps search engines prioritize crawling pages that have actually changed since the last index run.",
              },
              {
                tag: "<changefreq>",
                req: "Optional",
                body: "Provides a hint to crawlers regarding how frequently page content updates. Valid values include: always, hourly, daily, weekly, monthly, yearly, and never. Serves as a guide rather than a strict instruction.",
              },
              {
                tag: "<priority>",
                req: "Optional",
                body: "Assigns a relative priority ranking to URLs on your domain ranging from 0.0 to 1.0 (default is 0.5). Useful for signaling to search engine bots which core landing pages should take precedence during crawl budget allocation.",
              },
            ].map(({ tag, req, body }) => (
              <div key={tag} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-indigo-600 text-base">{tag}</span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {req}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Sitemap Format Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Sitemap Format Technical Comparison</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Primary Audience</th>
                  <th className="px-4 py-3 font-semibold">Metadata Support</th>
                  <th className="px-4 py-3 font-semibold">Best Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold font-mono text-indigo-600">XML Standard</td>
                  <td className="px-4 py-3">Search Engines (Googlebot, Bing)</td>
                  <td className="px-4 py-3">Full (&lt;lastmod&gt;, &lt;priority&gt;, &lt;changefreq&gt;)</td>
                  <td className="px-4 py-3">Official submission to Google Search Console and webmaster suites.</td>
                </tr>
                <tr className="bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold font-mono text-indigo-600">Text List (.txt)</td>
                  <td className="px-4 py-3">Lightweight Crawlers & Scripting</td>
                  <td className="px-4 py-3">None (URL strings only)</td>
                  <td className="px-4 py-3">Simple deployments or fast batch ingestion into custom automated crawlers.</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold font-mono text-indigo-600">HTML Sitemap</td>
                  <td className="px-4 py-3">Human Site Visitors & Accessibility</td>
                  <td className="px-4 py-3">Hyperlinks & Category Layouts</td>
                  <td className="px-4 py-3">Footer link pages to improve user experience and internal PageRank flow.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 4: Best Practices for Search Engine Submission */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Search Engine Submission & Discovery Workflow</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "1. Robots.txt Declaration",
                body: "Reference your public sitemap URL directly inside your domain's robots.txt file (e.g., Sitemap: https://yourdomain.com/sitemap.xml). This allows search crawlers to locate your sitemap automatically upon visiting.",
              },
              {
                title: "2. Google Search Console Submission",
                body: "Log into Google Search Console, navigate to the Sitemaps tab under Indexing, paste your relative path (e.g., sitemap.xml), and click Submit. GSC provides detailed status feedback and indexing errors.",
              },
              {
                title: "3. Bing Webmaster Tools Integration",
                body: "Submit your sitemap payload to Bing Webmaster Tools to ensure indexation across Bing, Yahoo, and DuckDuckGo search ecosystems simultaneously.",
              },
              {
                title: "4. Canonical & Noindex Filtering",
                body: "Ensure your sitemap excludes pages configured with non-canonical tags, 301 redirects, 404 error states, or 'noindex' meta tags to avoid wasting crawl budget.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Static Border FAQ Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the maximum URL limit for a single XML sitemap?",
                a: "According to the official Sitemaps.org protocol specification, a single sitemap file can contain a maximum of 50,000 URLs and must not exceed 50 megabytes in uncompressed size. If your site contains more URLs, you must split them into multiple XML files and list them inside a Sitemap Index document.",
              },
              {
                q: "Does submitting an XML sitemap guarantee higher search rankings?",
                a: "Submitting a sitemap does not directly boost your search rankings. However, it ensures that search engine crawlers discover, read, and index your URLs efficiently. Faster discovery and proper indexing are prerequisites for ranking on search result pages.",
              },
              {
                q: "Should I include image and video URLs in my sitemap?",
                a: "Yes. Google supports image and video extensions for XML sitemaps. Including media tags helps search engines index your visual content for Google Images and Video Search results, increasing overall organic search footprint.",
              },
              {
                q: "Is my URL list sent to any server during processing?",
                a: "No. The TwisterTools XML Sitemap Generator executes 100% in your browser using client-side JavaScript. Your URLs and site configurations are never logged, stored, or transmitted to any external backend server.",
              },
            ].map(({ q, a }, idx) => (
              <div key={idx} className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-1.5">{q}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Platform Advantages */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Why Build Sitemaps with TwisterTools?</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Instant In-Browser Assembly",
                body: "Generate full XML, TXT, or HTML sitemaps in milliseconds with zero server queue wait times.",
              },
              {
                title: "Strict RFC & Sitemaps.org Compliance",
                body: "Outputs valid, escaped XML schema markup completely compatible with Google Search Console.",
              },
              {
                title: "Multi-Format Export Support",
                body: "Easily switch between raw XML code, line-separated TXT lists, or clean HTML links for footer pages.",
              },
              {
                title: "100% Private Client-Side Sandbox",
                body: "All data operations execute in browser memory to guarantee privacy and security for staging sites.",
              },
            ].map(({ title, body }) => (
              <div key={title} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-1.5">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {title}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed pl-6">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured WebApplication & FAQ Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "XML Sitemap Generator & URL Crawler Suite",
            applicationCategory: "SEOApplication",
            operatingSystem: "All",
            description: "Free online client-side XML sitemap generator to compile compliant XML, TXT, and HTML sitemaps for Google Search Console.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Instant XML, TXT, and HTML sitemap generation",
              "Sitemaps.org protocol compliant output",
              "Custom lastmod, priority, and changefreq controls",
              "100% browser-side processing for privacy",
            ],
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
                name: "What is the maximum URL limit for a single XML sitemap?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "According to Sitemaps.org, a single sitemap can contain up to 50,000 URLs and must not exceed 50 MB.",
                },
              },
              {
                "@type": "Question",
                name: "Does submitting an XML sitemap guarantee higher search rankings?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No, but it ensures search engines discover and index your URLs faster.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}