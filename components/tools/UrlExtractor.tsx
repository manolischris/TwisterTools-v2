"use client";

import React, { useState, useCallback, useId } from "react";
import {
    Link,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    FileText,
    Download,
    ShieldCheck,
    Zap,
    Globe,
    Filter,
    ExternalLink,
    Code2,
    Layers,
    HelpCircle,
    AlertCircle,
    ListOrdered,
    Sparkles,
    Search,
    Database,
    Cpu,
    Table,
    FileSpreadsheet,
    Terminal,
    Lock,
    BarChart3,
    CheckCircle2,
} from "lucide-react";

type ExportFormat = "txt" | "csv" | "json";
type FilterType = "all" | "http" | "https" | "relative" | "mailto";

interface ExtractedLink {
    id: string;
    url: string;
    anchorText: string;
    type: "http" | "https" | "relative" | "mailto" | "other";
    isExternal: boolean;
}

const SAMPLE_HTML = `<div class="content-wrapper">
  <h2>Featured Resources</h2>
  <p>Check out our latest tools and documentation:</p>
  <ul>
    <li><a href="https://twistertools.com/tools/text-tools/json-csv-converter">JSON to CSV Converter</a> - Transform your data fast.</li>
    <li><a href="https://twistertools.com/tools/seo-tools/meta-tag-generator" target="_blank">Meta Tag Generator</a> - Optimize your search presence.</li>
    <li><a href="/tools/text-tools/url-extractor">URL Extractor Tool</a> - Extract hyperlinks from HTML or raw text.</li>
    <li><a href="http://example.org/documentation?version=2.0#setup">Legacy Documentation (v2.0)</a></li>
    <li><a href="mailto:support@twistertools.com">Contact Support Team</a></li>
  </ul>
</div>`;

export default function UrlExtractor() {
    const [inputText, setInputText] = useState("");
    const [extractedLinks, setExtractedLinks] = useState<ExtractedLink[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [deduplicate, setDeduplicate] = useState(true);
    const [extractMode, setExtractMode] = useState<"html" | "raw">("html");
    const [copied, setCopied] = useState(false);

    const searchInputId = useId();
    const filterSelectId = useId();

    // Parse links from input
    const processExtraction = useCallback(() => {
        if (!inputText.trim()) {
            setExtractedLinks([]);
            return;
        }

        const links: ExtractedLink[] = [];
        const seenUrls = new Set<string>();

        if (extractMode === "html") {
            // DOM Parser approach for HTML
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(inputText, "text/html");
                const anchorElements = doc.querySelectorAll("a");

                anchorElements.forEach((anchor, idx) => {
                    const href = anchor.getAttribute("href") || "";
                    if (!href.trim()) return;

                    if (deduplicate && seenUrls.has(href)) return;
                    seenUrls.add(href);

                    let type: ExtractedLink["type"] = "other";
                    if (href.startsWith("https://")) type = "https";
                    else if (href.startsWith("http://")) type = "http";
                    else if (href.startsWith("mailto:")) type = "mailto";
                    else if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) type = "relative";

                    const isExternal = href.startsWith("http://") || href.startsWith("https://");
                    const anchorText = anchor.textContent?.trim() || "[No Text]";

                    links.push({
                        id: `link-${idx}-${Date.now()}`,
                        url: href,
                        anchorText,
                        type,
                        isExternal,
                    });
                });
            } catch {
                // Fallback regex if DOMParser fails
            }
        }

        // Direct Regex Parsing for raw text or fallback
        if (extractMode === "raw" || links.length === 0) {
            const urlRegex = /(https?:\/\/[^\s<"']+)|(mailto:[^\s<"']+)|(\/[a-zA-Z0-9_.~/-]+)/g;
            let match;
            let idx = 0;

            while ((match = urlRegex.exec(inputText)) !== null) {
                const url = match[0];
                if (deduplicate && seenUrls.has(url)) continue;
                seenUrls.add(url);

                let type: ExtractedLink["type"] = "other";
                if (url.startsWith("https://")) type = "https";
                else if (url.startsWith("http://")) type = "http";
                else if (url.startsWith("mailto:")) type = "mailto";
                else if (url.startsWith("/")) type = "relative";

                links.push({
                    id: `raw-${idx++}-${Date.now()}`,
                    url,
                    anchorText: "[Raw URL]",
                    type,
                    isExternal: url.startsWith("http://") || url.startsWith("https://"),
                });
            }
        }

        setExtractedLinks(links);
    }, [inputText, deduplicate, extractMode]);

    // Execute extraction on input changes
    React.useEffect(() => {
        processExtraction();
    }, [processExtraction]);

    const filteredLinks = extractedLinks.filter((link) => {
        const matchesFilter =
            activeFilter === "all" ? true : link.type === activeFilter;
        const matchesSearch =
            link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
            link.anchorText.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleCopy = async () => {
        if (filteredLinks.length === 0) return;
        const textToCopy = filteredLinks
            .map((l) => `${l.url}${l.anchorText !== "[No Text]" && l.anchorText !== "[Raw URL]" ? ` (${l.anchorText})` : ""}`)
            .join("\n");
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format: ExportFormat) => {
        if (filteredLinks.length === 0) return;
        let content = "";
        let mimeType = "text/plain";
        let extension = "txt";

        if (format === "txt") {
            content = filteredLinks.map((l) => l.url).join("\n");
        } else if (format === "csv") {
            mimeType = "text/csv";
            extension = "csv";
            content = "URL,Anchor Text,Type,Is External\n" +
                filteredLinks
                    .map((l) => `"${l.url.replace(/"/g, '""')}","${l.anchorText.replace(/"/g, '""')}","${l.type}","${l.isExternal}"`)
                    .join("\n");
        } else if (format === "json") {
            mimeType = "application/json";
            extension = "json";
            content = JSON.stringify(filteredLinks, null, 2);
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `extracted-urls.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadSample = () => {
        setInputText(SAMPLE_HTML);
    };

    const clearWorkspace = () => {
        setInputText("");
        setExtractedLinks([]);
        setSearchQuery("");
    };

    return (
        <div className="w-full space-y-8">

            {/* ── 50/50 Workspace Grid ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* LEFT PANEL: Input & Parser Configuration */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-900">Source HTML / Text Input</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                {inputText.length.toLocaleString()} chars
                            </span>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Extraction Mode Switcher */}
                            <div className="flex rounded-xl bg-slate-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setExtractMode("html")}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${extractMode === "html"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    HTML Tag Parser (&lt;a href="..."&gt;)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExtractMode("raw")}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[38px] ${extractMode === "raw"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Raw Regex Matcher (http/https)
                                </button>
                            </div>

                            {/* Input Textarea */}
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste HTML source code or raw string text containing URLs here..."
                                className="font-mono text-sm h-[400px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-white text-slate-800 border border-slate-200 rounded-xl resize-none"
                            />

                            {/* Deduplication Toggle */}
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <label className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-indigo-600" />
                                    Deduplicate Duplicate URLs
                                </label>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={deduplicate}
                                    onClick={() => setDeduplicate(!deduplicate)}
                                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${deduplicate ? "bg-indigo-600" : "bg-slate-300"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${deduplicate ? "translate-x-4" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Toolbar Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={loadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Load HTML Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    disabled={!inputText}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Workspace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Extracted Output & Controls */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-900">Extracted URLs</span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {filteredLinks.length} / {extractedLinks.length} Found
                            </span>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Filter Controls Bar */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <label htmlFor={searchInputId} className="sr-only">
                                        Search extracted links
                                    </label>
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        id={searchInputId}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search URL or anchor text..."
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={filterSelectId} className="sr-only">
                                        Filter link protocol type
                                    </label>
                                    <select
                                        id={filterSelectId}
                                        value={activeFilter}
                                        onChange={(e) => setActiveFilter(e.target.value as FilterType)}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    >
                                        <option value="all">All Protocols & Paths</option>
                                        <option value="https">HTTPS Links Only</option>
                                        <option value="http">HTTP Links Only</option>
                                        <option value="relative">Relative Paths Only</option>
                                        <option value="mailto">Mailto Emails</option>
                                    </select>
                                </div>
                            </div>

                            {/* Extracted Links List Display */}
                            <div className="h-[340px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
                                {filteredLinks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                        <AlertCircle className="w-8 h-8 opacity-50" />
                                        <p className="text-xs">No matching URLs extracted yet.</p>
                                    </div>
                                ) : (
                                    filteredLinks.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1 shadow-sm hover:border-indigo-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-mono text-indigo-600 font-medium truncate hover:underline flex items-center gap-1.5"
                                                >
                                                    {item.url}
                                                    <ExternalLink className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                                </a>
                                                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                    {item.type}
                                                </span>
                                            </div>
                                            {extractMode === "html" && (
                                                <p className="text-slate-500 truncate font-sans">
                                                    Anchor Text: <span className="text-slate-800 font-semibold">{item.anchorText}</span>
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Export and Action Buttons */}
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={filteredLinks.length === 0}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all duration-200 min-h-[44px] ${filteredLinks.length > 0
                                        ? copied
                                            ? "bg-green-600 text-white shadow-md shadow-green-200"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" /> Copied Link List!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" /> Copy Extracted List
                                        </>
                                    )}
                                </button>

                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("txt")}
                                        disabled={filteredLinks.length === 0}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        <Download className="w-3.5 h-3.5" /> TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("csv")}
                                        disabled={filteredLinks.length === 0}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        <Download className="w-3.5 h-3.5" /> CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("json")}
                                        disabled={filteredLinks.length === 0}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        <Download className="w-3.5 h-3.5" /> JSON
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BELOW-THE-FOLD SEO CONTENT CARDS ── */}
            <section className="space-y-6">
                {/* SEO Card 1: Technical Architecture & Mechanics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture of Client-Side Link Extraction</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Extracting hyperlinked URLs and corresponding anchor text from web documents is an essential procedure across search engine optimization (SEO), web scraping pipelines, security vulnerability audits, and content migration projects. Our browser-native <strong>URL & Hyperlink Text Extractor</strong> leverages modern web APIs to process large document trees with zero latency and complete privacy guarantees.
                        </p>
                        <p>
                            When operating in <strong>HTML Tag Parsing Mode</strong>, the utility initializes an isolated, non-rendering <code>DOMParser</code> context in browser memory. This virtual tree allows accurate traversal of standard document elements, specifically selecting all HTML anchor nodes (<code>&lt;a href=&quot;...&quot;&gt;</code>). It separates target destinations from visual anchor labels, stripping out unnecessary inline markup while preserving textual clarity.
                        </p>
                        <p>
                            For plain text strings, server logs, or Markdown files, switching to <strong>Raw Regex Matching Mode</strong> deploys optimized regular expression search algorithms. This mode isolates protocol prefixes—including standard secure paths (<code>https://</code>), legacy unencrypted paths (<code>http://</code>), direct mail targets (<code>mailto:</code>), and relative paths (<code>/</code> or <code>../</code>)—ensuring thorough data harvesting regardless of surrounding document formatting.
                        </p>
                    </div>
                </div>

                {/* SEO Card 2: Four-Stage Extraction Pipeline */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ListOrdered className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>The Four-Stage Data Extraction Pipeline</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Document Stream Ingestion",
                                body: "Raw HTML strings or unformatted text blocks are ingested into browser memory, neutralizing potential script execution vectors for safe client-side inspection.",
                            },
                            {
                                step: "2",
                                title: "Token Mapping & Protocol Parsing",
                                body: "The engine scans all identified nodes or regular expression match sets to identify schema classifications (HTTPS, HTTP, Relative, or Mailto).",
                            },
                            {
                                step: "3",
                                title: "Set-Based Hash Deduplication",
                                body: "An active JavaScript Set data structure tracks previously encountered paths to filter redundant URLs instantly based on user configuration.",
                            },
                            {
                                step: "4",
                                title: "Data Normalization & Serialization",
                                body: "Extracted records are formatted into structured objects containing URL targets, anchor text, and protocol classifications for single-click export.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                                        {step}
                                    </span>
                                    <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                                </div>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO Card 3: Extraction Mode Comparison Matrix */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Parser Mode Feature Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate extraction method depends on your input source structure. The table below compares the functional characteristics of DOM-based HTML parsing against pattern-based Regular Expression matching.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Feature Metric</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">HTML Tag Parser</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Raw Regex Matcher</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Primary Input Source", "Formatted HTML Source Code", "Unstructured Text, Logs, Plain Files"],
                                    ["Anchor Text Harvesting", "Supported (Extracts visible <a> label)", "N/A (Identifies URLs directly)"],
                                    ["Relative Link Extraction", "Supported (Detects root & relative paths)", "Supported (Detects leading slash paths)"],
                                    ["Parsing Engine", "Native Browser DOMParser API", "Regular Expression Execution"],
                                    ["Handling Malformed Syntax", "Auto-corrects minor HTML errors", "Pattern matches regardless of markup"],
                                    ["Execution Speed", "High Speed (Memory DOM Tree)", "Ultra Fast (Direct String Search)"],
                                ].map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SEO Card 4: Enterprise Production Workflows */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Core Use Cases & Enterprise Applications</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "SEO Backlink & Anchor Auditing",
                                body: "Analyze internal link architecture, audit target page anchor text distribution, and uncover broken or outdated outbound link references across site migrations.",
                            },
                            {
                                title: "Web Scraping & Data Mining",
                                body: "Isolate structured hyperlinked endpoints from complex web pages to feed automated indexing, web crawling, or market research pipelines.",
                            },
                            {
                                title: "Security Vulnerability Scans",
                                body: "Identify unencrypted HTTP endpoints, untrusted external domains, or malformed URL patterns embedded within source documents and codebases.",
                            },
                            {
                                title: "Content Cleanups & Redirections",
                                body: "Harvest all embedded hyperlinks prior to platform migration to generate bulk 301 redirection maps or update legacy domain paths efficiently.",
                            },
                        ].map(({ title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    {title}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO Card 5: Platform Technical Advantages */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Architectural Security & Performance Advantages</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "100% Client-Side Sandbox",
                                body: "All parsing and string manipulations are processed entirely within local browser memory. Zero input source data or extracted outputs are transmitted across network servers.",
                            },
                            {
                                icon: Zap,
                                title: "Instant Dynamic Filtering",
                                body: "Filter harvested link inventories in real time by keying in search terms or selecting protocol constraints without needing to re-parse the source document.",
                            },
                            {
                                icon: Download,
                                title: "Multi-Format Export Engine",
                                body: "Download extracted link sets in structured CSV, JSON, or plain text formats, fully formatted for spreadsheet suites or automated scripts.",
                            },
                            {
                                icon: Lock,
                                title: "Zero Dependency Footprint",
                                body: "Engineered with native JavaScript web APIs to eliminate external runtime dependencies, providing reliable performance and high computational speed.",
                            },
                        ].map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                                            {title}
                                        </h3>
                                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEO Card 6: Frequently Asked Questions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Is my input document transmitted or logged on external servers?",
                                a: "No. The entire extraction pipeline operates locally within your web browser using JavaScript's native DOMParser API and Regular Expressions. Your source code, server logs, and extracted links remain entirely private on your device.",
                            },
                            {
                                q: "Does the tool support relative URLs and internal root paths?",
                                a: "Yes. Relative paths starting with leading slashes (e.g., /tools/text-tools) or directory indicators (e.g., ../) are parsed and cataloged under the 'relative' protocol filter.",
                            },
                            {
                                q: "How does URL deduplication function?",
                                a: "When the deduplication toggle is enabled, the extraction process uses a JavaScript Set memory store to track unique path strings. Any repeated instance of a previously recorded URL is omitted from the extracted inventory.",
                            },
                            {
                                q: "Can I export anchor text along with the extracted links?",
                                a: "Yes. When using HTML Tag Parser mode, anchor text associated with each anchor element is extracted. Selecting the CSV or JSON export option includes both the target URL and its anchor text.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 space-y-1"
                            >
                                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3.5">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── JSON-LD Structured Data Schemas ── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "URL & Hyperlink Text Extractor",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports standard HTML5 browsers.",
                        description: "Free online client-side URL & Hyperlink Text Extractor tool. Parse URLs and anchor text instantly from HTML source code or raw text with deduplication and CSV, JSON, and TXT export options.",
                        featureList: [
                            "HTML anchor tag parsing using native DOMParser",
                            "Raw text URL matching with regex",
                            "Automatic Set-based duplicate URL removal",
                            "Real-time protocol filtering (HTTPS, HTTP, Relative, Mailto)",
                            "Export extracted data to CSV, JSON, or TXT",
                            "100% browser-based processing with full data privacy",
                        ],
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
                                name: "Is my input document transmitted or logged on external servers?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. The entire extraction pipeline operates locally within your web browser using JavaScript's native DOMParser API and Regular Expressions.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Does the tool support relative URLs and internal root paths?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. Relative paths starting with leading slashes or directory indicators are parsed and cataloged under the relative protocol filter.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How does URL deduplication function?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "When deduplication is enabled, a JavaScript Set store tracks unique path strings, ensuring repeated instances of previously recorded URLs are omitted.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I export anchor text along with the extracted links?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. In HTML Tag Parser mode, anchor text is extracted alongside URLs and exported via CSV or JSON formats.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}