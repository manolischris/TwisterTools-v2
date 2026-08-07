"use client";

import React, { useState, useMemo } from "react";
import {
    Link2,
    Copy,
    Check,
    Trash2,
    Download,
    Info,
    HelpCircle,
    BookOpen,
    Sparkles,
    RefreshCw,
    FileText,
    Sliders,
    Layers,
    Code,
    ShieldCheck,
    CheckCircle2,
    Lightbulb,
    Zap,
    Cpu,
    Globe,
    Settings,
    ArrowRightLeft,
    Share2,
    Hash
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    separator: string;
    casing: "lower" | "upper" | "preserve";
    removeNumbers: boolean;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "standard-url", label: "Clean Web URL Slug", separator: "-", casing: "lower", removeNumbers: false, tag: "SEO" },
    { id: "database-key", label: "Database Snake Case", separator: "_", casing: "lower", removeNumbers: false, tag: "SQL" },
    { id: "const-variable", label: "CONST_UPPER_CASE", separator: "_", casing: "upper", removeNumbers: false, tag: "DEV" },
    { id: "dot-notation", label: "Dot Notation Path", separator: ".", casing: "lower", removeNumbers: false, tag: "PATH" },
    { id: "alpha-only", label: "Strict Alpha Slug", separator: "-", casing: "lower", removeNumbers: true, tag: "STRICT" }
];

export default function SlugGenerator() {
    // Core States
    const [inputText, setInputText] = useState<string>(
        "🚀 Introducing TwisterTools 2.0: Next-Gen Online Developer Utilities & SEO Optimization Tools!"
    );
    const [separator, setSeparator] = useState<string>("-");
    const [casing, setCasing] = useState<"lower" | "upper" | "preserve">("lower");

    // Advanced Options
    const [stripAccents, setStripAccents] = useState<boolean>(true);
    const [removeStopWords, setRemoveStopWords] = useState<boolean>(false);
    const [removeNumbers, setRemoveNumbers] = useState<boolean>(false);
    const [customBaseUrl, setCustomBaseUrl] = useState<string>("https://twistertools.com/blog/");

    // UI States
    const [copiedSlug, setCopiedSlug] = useState<boolean>(false);
    const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("standard-url");

    // Common English Stop Words for SEO cleanup
    const STOP_WORDS = useMemo(
        () => new Set([
            "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
            "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
            "their", "then", "there", "these", "they", "this", "to", "was", "will", "with"
        ]),
        []
    );

    // Transformation Logic
    const transformedSlug = useMemo(() => {
        if (!inputText) return "";

        let str = inputText;

        // 1. Strip Accents / Diacritics (Normalize Unicode NFD)
        if (stripAccents) {
            str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }

        // 2. Casing transformation before word filtering
        if (casing === "lower") {
            str = str.toLowerCase();
        } else if (casing === "upper") {
            str = str.toUpperCase();
        }

        // 3. Remove non-alphanumeric or special characters (keep spaces temporarily)
        str = str.replace(/[^\w\s-]/g, "");

        // 4. Remove Numbers if enabled
        if (removeNumbers) {
            str = str.replace(/\d+/g, "");
        }

        // 5. Split into words to filter stop words or multiple spaces
        let words = str.trim().split(/\s+/).filter(Boolean);

        if (removeStopWords) {
            words = words.filter((word) => !STOP_WORDS.has(word.toLowerCase()));
        }

        // 6. Join with configured separator
        let slug = words.join(separator);

        // Clean double separators
        if (separator) {
            const escapedSep = separator.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
            const sepRegex = new RegExp(`${escapedSep}+`, "g");
            slug = slug.replace(sepRegex, separator);
        }

        return slug;
    }, [inputText, separator, casing, stripAccents, removeStopWords, removeNumbers, STOP_WORDS]);

    const fullUrlPreview = useMemo(() => {
        if (!transformedSlug) return "";
        const base = customBaseUrl.endsWith("/") ? customBaseUrl : `${customBaseUrl}/`;
        return `${base}${transformedSlug}`;
    }, [customBaseUrl, transformedSlug]);

    // Statistics
    const stats = useMemo(() => {
        const charCount = transformedSlug.length;
        const wordCount = transformedSlug ? transformedSlug.split(separator || " ").filter(Boolean).length : 0;
        const rawCharCount = inputText.length;
        const reductionRatio = rawCharCount > 0 ? Math.round(((rawCharCount - charCount) / rawCharCount) * 100) : 0;

        return {
            charCount,
            wordCount,
            rawCharCount,
            reductionRatio
        };
    }, [transformedSlug, inputText, separator]);

    const handleCopySlug = () => {
        if (!transformedSlug) return;
        navigator.clipboard.writeText(transformedSlug);
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
    };

    const handleCopyUrl = () => {
        if (!fullUrlPreview) return;
        navigator.clipboard.writeText(fullUrlPreview);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleDownload = () => {
        if (!transformedSlug) return;
        const content = `Target Slug:\n${transformedSlug}\n\nFull URL:\n${fullUrlPreview}`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${transformedSlug || "slug"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setInputText("");
        setSeparator("-");
        setCasing("lower");
        setStripAccents(true);
        setRemoveStopWords(false);
        setRemoveNumbers(false);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setSeparator(preset.separator);
        setCasing(preset.casing);
        setRemoveNumbers(preset.removeNumbers);
        setActivePresetId(preset.id);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Slugify & URL Slug Generator",
        "url": "https://twistertools.com/tools/text-tools/slug-generator",
        "description": "Convert headlines, text titles, and non-latin strings into clean, SEO-friendly, URL-safe slugs with customizable separators and casing.",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is a URL slug and why is it important for SEO?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A URL slug is the human-readable portion of a web address that comes after the domain name. Clean, descriptive slugs containing targeted keywords help search engines understand page context and significantly improve click-through rates (CTR) from search results."
                }
            },
            {
                "@type": "Question",
                "name": "How does this generator handle special accented characters and emojis?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses Unicode Normalization (NFD) to strip diacritics and accents (e.g. converting 'é' to 'e' or 'ñ' to 'n') and strips out non-standard symbols and emojis to yield 100% clean, web-safe ASCII output."
                }
            },
            {
                "@type": "Question",
                "name": "Should I strip stop words (like 'and', 'the', 'is') from URL slugs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Stripping stop words reduces URL length and focuses keyword density on primary terms, which is often preferred for concise permalinks. However, keeping stop words is fine if removing them changes the natural context or user comprehension."
                }
            },
            {
                "@type": "Question",
                "name": "Does this URL Slug Generator run client-side?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. All string parsing, normalization, and URL formatting occur locally inside your web browser. Zero text inputs or generated URLs are sent over the network or logged on external servers."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto flex flex-col gap-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Control Configuration Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" /> Slugify Rules & Settings
                    </h2>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200"
                        title="Reset all settings"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reset Defaults
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Separator Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Word Separator
                        </label>
                        <div className="flex items-center gap-2">
                            <select
                                value={separator}
                                onChange={(e) => {
                                    setSeparator(e.target.value);
                                    setActivePresetId(null);
                                }}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                            >
                                <option value="-">Hyphen (-) [Standard Web]</option>
                                <option value="_">Underscore (_) [Snake Case]</option>
                                <option value=".">Dot (.) [Notation Path]</option>
                                <option value="">None [Concatenated]</option>
                            </select>
                        </div>
                    </div>

                    {/* Casing Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Letter Casing
                        </label>
                        <select
                            value={casing}
                            onChange={(e) => {
                                setCasing(e.target.value as "lower" | "upper" | "preserve");
                                setActivePresetId(null);
                            }}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        >
                            <option value="lower">lowercase (Standard URL)</option>
                            <option value="upper">UPPERCASE (CONST_VAR)</option>
                            <option value="preserve">Preserve Original Case</option>
                        </select>
                    </div>

                    {/* Custom Base URL */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Domain / Base Path Preview
                        </label>
                        <input
                            type="text"
                            value={customBaseUrl}
                            onChange={(e) => setCustomBaseUrl(e.target.value)}
                            placeholder="e.g. https://example.com/blog/"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                        />
                    </div>
                </div>

                {/* Preset Chips */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Output Target Presets
                        </span>
                        {activePresetId && (
                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                Preset Active
                            </span>
                        )}
                    </div>
                    <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {PRESETS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => applyPreset(p)}
                                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${activePresetId === p.id
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                            >
                                <span>{p.label}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${activePresetId === p.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                                    }`}>
                                    {p.tag}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Granular Option Toggles */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={stripAccents}
                            onChange={(e) => setStripAccents(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Normalize Diacritics (é → e)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={removeStopWords}
                            onChange={(e) => setRemoveStopWords(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Strip Stop Words (and, the, is)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={removeNumbers}
                            onChange={(e) => {
                                setRemoveNumbers(e.target.checked);
                                setActivePresetId(null);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>Remove Numeric Digits</span>
                    </label>
                </div>
            </div>

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[480px] min-w-0 p-4 sm:p-6">
                    <div className="flex flex-col h-full space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Title or Headline Input
                            </h2>
                            <button
                                onClick={() => setInputText("")}
                                className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold transition"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Clear
                            </button>
                        </div>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type or paste your article title, product name, or headline here..."
                            className="w-full flex-1 p-3.5 rounded-xl border border-slate-200 font-sans text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50/50 leading-relaxed"
                        />

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>Input Length: <strong>{stats.rawCharCount}</strong> characters</span>
                            <span className="text-slate-400">Pasting automatically cleans non-latin symbols</span>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Slug & URL Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[480px] min-w-0 p-4 sm:p-6">
                    <div className="flex flex-col h-full space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Link2 className="w-4 h-4 text-indigo-600" /> Generated URL Slug
                            </h2>
                            {stats.reductionRatio > 0 && (
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                    -{stats.reductionRatio}% Character Reduction
                                </span>
                            )}
                        </div>

                        {/* Direct Slug Output Box */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clean Slug</label>
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-sm text-indigo-300 break-all min-h-[64px] flex items-center justify-between gap-2">
                                <span>{transformedSlug || <span className="text-slate-600 italic">Slug preview will appear here...</span>}</span>
                                <button
                                    onClick={handleCopySlug}
                                    disabled={!transformedSlug}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 flex-shrink-0 transition disabled:opacity-50"
                                >
                                    {copiedSlug ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copiedSlug ? "Copied" : "Copy"}
                                </button>
                            </div>
                        </div>

                        {/* Full URL Preview Box */}
                        <div className="space-y-1 pt-1">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Address Preview</label>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 break-all flex items-center justify-between gap-2">
                                <span className="truncate">{fullUrlPreview}</span>
                                <button
                                    onClick={handleCopyUrl}
                                    disabled={!fullUrlPreview}
                                    className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 transition disabled:opacity-50"
                                >
                                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3" />}
                                    {copiedUrl ? "Copied URL" : "Copy URL"}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                            <span>Slug Words: <strong>{stats.wordCount}</strong></span>
                            <span>Slug Length: <strong>{stats.charCount}</strong> characters</span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySlug}
                            disabled={!transformedSlug}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
                        >
                            {copiedSlug ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSlug ? "Slug Copied to Clipboard" : "Copy Clean Slug"}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!transformedSlug}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="flex flex-col gap-6">

                {/* Card 1: Technical Overview & Definitions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mastering Web Permalinks & URL Slugification
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A <strong>URL slug</strong> is the exact string segment located at the end of a web address that explicitly identifies a specific page or article resource in a human-readable format. Derived originally from newsroom jargon where short editorial titles were assigned to draft stories, modern web architecture relies on slugs to create clean permalinks instead of unreadable numeric query strings like <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-indigo-600 font-mono">?p=8921</code>.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting arbitrary titles, blog headlines, or product names into web-safe slugs requires removing punctuation, stripping non-ASCII characters, replacing whitespace with uniform separators (hyphens or underscores), and normalizing casing to lower-case. The <strong>TwisterTools Slug Generator</strong> executes this transformation client-side in sub-milliseconds while offering advanced options like stop-word filtering and diacritic stripping.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> RFC 3986 Compliance
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Ensures generated slugs adhere strictly to Uniform Resource Identifier (URI) generic syntax standards, avoiding unsafe URL parameters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Diacritic Normalization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Converts international characters (accented vowels, umlauts, cedillas) into readable Latin equivalents without dropping letters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Client-Side Privacy
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Operates completely inside browser memory space. Titles, proprietary product handles, or draft headlines are never transmitted externally.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Feature Matrix & Separator Guidelines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            URL Naming Standards & Best Practices
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing the right separator and casing strategy is critical depending on whether you are optimizing web page URLs, database keys, or codebase constants:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Target Standard</th>
                                    <th className="p-3">Separator</th>
                                    <th className="p-3">Casing</th>
                                    <th className="p-3">Primary Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Standard Web Slug</td>
                                    <td className="p-3"><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">-</code> (Hyphen)</td>
                                    <td className="p-3">lowercase</td>
                                    <td className="p-3">Search engine permalinks, blog post URLs, e-commerce product pages (Google recommended).</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Snake Case Identifier</td>
                                    <td className="p-3"><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">_</code> (Underscore)</td>
                                    <td className="p-3">lowercase</td>
                                    <td className="p-3">PostgreSQL/MySQL column names, Python variable names, REST API payload attributes.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Constant Declaration</td>
                                    <td className="p-3"><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">_</code> (Underscore)</td>
                                    <td className="p-3">UPPERCASE</td>
                                    <td className="p-3">Global environment variables, C-style macros, React/TypeScript configuration keys.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Object Path / Tag</td>
                                    <td className="p-3"><code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">.</code> (Dot)</td>
                                    <td className="p-3">lowercase</td>
                                    <td className="p-3">Config namespaces, S3 bucket folder hierarchies, Java/Kotlin package structures.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: SEO Optimization Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            4 Key Rules for High-Ranking URL Slugs
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Prefer Hyphens Over Underscores
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Search engines specifically treat hyphens as space separators between words. Underscores are often interpreted as word joiners (<code className="bg-slate-200 px-1 rounded font-mono">first_second</code> is seen as <code className="bg-slate-200 px-1 rounded font-mono">firstsecond</code>). Always choose hyphens for web permalinks.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. Keep Slugs Short & Keyword-Focused
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Target 3 to 5 primary keywords. Short URLs rank higher in search results, are easier for users to share on social media, and do not get truncated in search snippet displays.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. Strip Filler & Stop Words
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enable the "Strip Stop Words" toggle to automatically remove unnecessary words like <code className="bg-slate-200 px-1 rounded font-mono">and</code>, <code className="bg-slate-200 px-1 rounded font-mono">in</code>, <code className="bg-slate-200 px-1 rounded font-mono">the</code>, or <code className="bg-slate-200 px-1 rounded font-mono">for</code> to maximize keyword density.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. Maintain Universal Lowercase
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Linux web servers (Apache, Nginx) are strictly case-sensitive. Mixed casing leads to duplicate content issues or 404 errors if links are shared with modified capitalization.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a URL slug and why is it important for SEO?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A URL slug is the human-readable portion of a web address that comes after the domain name. Clean, descriptive slugs containing targeted keywords help search engines understand page context and significantly improve click-through rates (CTR) from search results.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this generator handle special accented characters and emojis?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses Unicode Normalization (NFD) to strip diacritics and accents (e.g. converting "é" to "e" or "ñ" to "n") and strips out non-standard symbols and emojis to yield 100% clean, web-safe ASCII output.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I strip stop words (like "and", "the", "is") from URL slugs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Stripping stop words reduces URL length and focuses keyword density on primary terms, which is often preferred for concise permalinks. However, keeping stop words is fine if removing them changes the natural context or user comprehension.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this URL Slug Generator run client-side?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. All string parsing, normalization, and URL formatting occur locally inside your web browser. Zero text inputs or generated URLs are sent over the network or logged on external servers.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}