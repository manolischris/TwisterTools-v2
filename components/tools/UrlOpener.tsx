"use client";

import React, { useState, useCallback, useId, useEffect } from "react";
import {
    ExternalLink,
    Play,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    ShieldCheck,
    Zap,
    Filter,
    Code2,
    Layers,
    HelpCircle,
    AlertCircle,
    ListOrdered,
    Search,
    Lock,
    BarChart3,
    CheckCircle2,
    Table,
    Download,
    Settings2,
    Globe,
    AlertTriangle,
    Eye,
    ListFilter,
} from "lucide-react";

type ExportFormat = "txt" | "csv" | "json";
type URLProtocol = "all" | "https" | "http";

interface ParsedUrlItem {
    id: string;
    rawInput: string;
    sanitizedUrl: string;
    protocol: "https" | "http" | "invalid";
    domain: string;
    isValid: boolean;
}

const SAMPLE_URLS = `https://twistertools.com/tools/text-tools/json-csv-converter
https://twistertools.com/tools/seo-tools/meta-tag-generator
http://example.org/test-page?version=2.0
https://github.com
invalid-url-entry
https://developer.mozilla.org`;

export default function UrlOpener() {
    const [rawInput, setRawInput] = useState("");
    const [parsedUrls, setParsedUrls] = useState<ParsedUrlItem[]>([]);
    const [openDelay, setOpenDelay] = useState<number>(1);
    const [deduplicate, setDeduplicate] = useState(true);
    const [protocolFilter, setProtocolFilter] = useState<URLProtocol>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [copied, setCopied] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchProgress, setLaunchProgress] = useState(0);
    const [popupBlockedWarning, setPopupBlockedWarning] = useState(false);

    const searchInputId = useId();
    const delayInputId = useId();
    const filterSelectId = useId();

    // Sanitize and parse URLs from raw input
    const processUrls = useCallback(() => {
        if (!rawInput.trim()) {
            setParsedUrls([]);
            return;
        }

        const lines = rawInput.split(/\r?\n/);
        const list: ParsedUrlItem[] = [];
        const seenUrls = new Set<string>();

        lines.forEach((line, idx) => {
            let trimmed = line.trim();
            if (!trimmed) return;

            // Prepend https:// if no protocol is present
            if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes("://")) {
                trimmed = `https://${trimmed}`;
            }

            if (deduplicate && seenUrls.has(trimmed.toLowerCase())) return;
            seenUrls.add(trimmed.toLowerCase());

            let isValid = false;
            let protocol: "https" | "http" | "invalid" = "invalid";
            let domain = "";

            try {
                const parsed = new URL(trimmed);
                isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
                protocol = parsed.protocol === "https:" ? "https" : parsed.protocol === "http:" ? "http" : "invalid";
                domain = parsed.hostname;
            } catch {
                isValid = false;
                protocol = "invalid";
                domain = "invalid domain";
            }

            list.push({
                id: `url-${idx}-${Date.now()}`,
                rawInput: line,
                sanitizedUrl: trimmed,
                protocol,
                domain,
                isValid,
            });
        });

        setParsedUrls(list);
    }, [rawInput, deduplicate]);

    useEffect(() => {
        processUrls();
    }, [processUrls]);

    const filteredUrls = parsedUrls.filter((item) => {
        if (!item.isValid) return false;
        const matchesProtocol =
            protocolFilter === "all" ? true : item.protocol === protocolFilter;
        const matchesSearch =
            item.sanitizedUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.domain.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesProtocol && matchesSearch;
    });

    const validUrlsCount = parsedUrls.filter((u) => u.isValid).length;
    const invalidUrlsCount = parsedUrls.filter((u) => !u.isValid).length;

    // Bulk Launch Execution
    const handleLaunchAll = async () => {
        if (filteredUrls.length === 0 || isLaunching) return;

        setIsLaunching(true);
        setLaunchProgress(0);
        setPopupBlockedWarning(false);

        let blocked = false;

        for (let i = 0; i < filteredUrls.length; i++) {
            const urlItem = filteredUrls[i];
            const newWindow = window.open(urlItem.sanitizedUrl, "_blank", "noopener,noreferrer");

            if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
                blocked = true;
            }

            setLaunchProgress(Math.round(((i + 1) / filteredUrls.length) * 100));

            if (i < filteredUrls.length - 1 && openDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, openDelay * 1000));
            }
        }

        if (blocked) {
            setPopupBlockedWarning(true);
        }

        setIsLaunching(false);
    };

    const handleCopy = async () => {
        if (filteredUrls.length === 0) return;
        const textToCopy = filteredUrls.map((u) => u.sanitizedUrl).join("\n");
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (format: ExportFormat) => {
        if (filteredUrls.length === 0) return;
        let content = "";
        let mimeType = "text/plain";
        let extension = "txt";

        if (format === "txt") {
            content = filteredUrls.map((u) => u.sanitizedUrl).join("\n");
        } else if (format === "csv") {
            mimeType = "text/csv";
            extension = "csv";
            content =
                "URL,Domain,Protocol,Is Valid\n" +
                filteredUrls
                    .map(
                        (u) =>
                            `"${u.sanitizedUrl.replace(/"/g, '""')}","${u.domain.replace(/"/g, '""')}","${u.protocol}","${u.isValid}"`
                    )
                    .join("\n");
        } else if (format === "json") {
            mimeType = "application/json";
            extension = "json";
            content = JSON.stringify(filteredUrls, null, 2);
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `bulk-urls.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadSample = () => {
        setRawInput(SAMPLE_URLS);
    };

    const clearWorkspace = () => {
        setRawInput("");
        setParsedUrls([]);
        setSearchQuery("");
        setPopupBlockedWarning(false);
    };

    // Delay Input Handler preventing stuck leading zeros
    const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/^0+(?=\d)/, "");
        if (val === "") {
            setOpenDelay(0);
            return;
        }
        const num = parseFloat(val);
        setOpenDelay(isNaN(num) ? 0 : Math.max(0, num));
    };

    return (
        <div className="w-full space-y-8">
            {/* ── 50/50 Workspace Grid ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* LEFT PANEL: Input & Launch Settings */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-900">URL Input & Sandbox Settings</span>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                {parsedUrls.length} Line{parsedUrls.length === 1 ? "" : "s"} Detected
                            </span>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Raw Textarea Input */}
                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                placeholder="Enter or paste URLs (one per line)...&#10;https://example.com&#10;twistertools.com&#10;https://github.com"
                                className="font-mono text-sm h-[260px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-white text-slate-800 border border-slate-200 rounded-xl resize-none"
                            />

                            {/* Options Grid */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                {/* Deduplication Toggle */}
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-0">
                                    <label className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-2 truncate">
                                        <Filter className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        <span>Deduplicate URLs</span>
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

                                {/* Open Delay Config */}
                                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl min-w-0">
                                    <label
                                        htmlFor={delayInputId}
                                        className="text-xs font-medium text-slate-700 flex items-center gap-2 truncate"
                                    >
                                        <Settings2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        <span>Delay (seconds)</span>
                                    </label>
                                    <input
                                        id={delayInputId}
                                        type="number"
                                        min="0"
                                        max="60"
                                        step="0.5"
                                        value={openDelay === 0 ? "" : openDelay}
                                        onChange={handleDelayChange}
                                        className="w-16 px-2 py-1 text-xs text-right border border-slate-200 rounded-lg bg-white font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Toolbar Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={loadSample}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 min-h-[44px]"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Load Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    disabled={!rawInput}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear Workspace
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Verified URL Preview & Launch Engine */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-semibold text-slate-900">Verified Launch Queue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    {validUrlsCount} Ready
                                </span>
                                {invalidUrlsCount > 0 && (
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                        {invalidUrlsCount} Invalid
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Filter Controls Bar */}
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="relative">
                                    <label htmlFor={searchInputId} className="sr-only">
                                        Search URL or Domain
                                    </label>
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        id={searchInputId}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search queue domains..."
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={filterSelectId} className="sr-only">
                                        Filter Protocol
                                    </label>
                                    <select
                                        id={filterSelectId}
                                        value={protocolFilter}
                                        onChange={(e) => setProtocolFilter(e.target.value as URLProtocol)}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[38px]"
                                    >
                                        <option value="all">All Protocols (HTTP/HTTPS)</option>
                                        <option value="https">HTTPS Only</option>
                                        <option value="http">HTTP Only</option>
                                    </select>
                                </div>
                            </div>

                            {/* Queue Display Box */}
                            <div className="h-[210px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-3 space-y-2">
                                {filteredUrls.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                                        <AlertCircle className="w-8 h-8 opacity-50" />
                                        <p className="text-xs">No valid URLs ready to launch.</p>
                                    </div>
                                ) : (
                                    filteredUrls.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between gap-2 shadow-sm hover:border-indigo-300 transition-colors"
                                        >
                                            <a
                                                href={item.sanitizedUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-mono text-indigo-600 font-medium truncate hover:underline flex items-center gap-1.5"
                                            >
                                                {item.sanitizedUrl}
                                                <ExternalLink className="w-3 h-3 flex-shrink-0 text-slate-400" />
                                            </a>
                                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                                                {item.protocol}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Popup Blocked Warning Message */}
                            {popupBlockedWarning && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
                                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="font-semibold">Pop-up Blocker Triggered:</strong> Browser blocked subsequent windows. Please allow pop-ups for twistertools.com in your browser address bar and click launch again.
                                    </div>
                                </div>
                            )}

                            {/* Launch Button & Progress Indicator */}
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={handleLaunchAll}
                                    disabled={filteredUrls.length === 0 || isLaunching}
                                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 shadow-md min-h-[48px] ${filteredUrls.length > 0 && !isLaunching
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                                            : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                        }`}
                                >
                                    <Play className="w-4 h-4 fill-current" />
                                    {isLaunching
                                        ? `Launching URLs (${launchProgress}%)...`
                                        : `Open ${filteredUrls.length} URL${filteredUrls.length === 1 ? "" : "s"} Now`}
                                </button>

                                {/* Export & Utility Buttons */}
                                <div className="grid grid-cols-4 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        disabled={filteredUrls.length === 0}
                                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("txt")}
                                        disabled={filteredUrls.length === 0}
                                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        <Download className="w-3.5 h-3.5" /> TXT
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("csv")}
                                        disabled={filteredUrls.length === 0}
                                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
                                    >
                                        <Download className="w-3.5 h-3.5" /> CSV
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload("json")}
                                        disabled={filteredUrls.length === 0}
                                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 min-h-[38px]"
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
                        <span>Technical Architecture of Client-Side Bulk URL Launching</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Opening multiple web pages simultaneously is a standard operational requirement for search engine optimization (SEO) professionals, digital marketers, cybersecurity researchers, and QA automation engineers. Our browser-native <strong>Bulk Multi-URL Opener & Launch Sandbox</strong> provides an enterprise-grade solution designed to parse, sanitize, delay, and launch large batches of links seamlessly within client memory.
                        </p>
                        <p>
                            The underlying engine executes a strict multi-step sanitization sequence upon input ingestion. When unformatted strings lacking explicit protocol handlers (e.g., <code>twistertools.com</code>) are processed, the parser dynamically prepends secure HTTPS scheme prefixes. Input lines are subsequently evaluated using JavaScript's native <code>URL</code> API to extract valid network destinations and isolate malformed entries before triggering tab launches.
                        </p>
                        <p>
                            To prevent browser resource exhaustion and bypass aggressive pop-up blocker restrictions, the sandbox integrates a customizable asynchronous delay pipeline. By utilizing staggered window creation via non-blocking JavaScript promises, each tab is launched in controlled intervals without freezing the browser's main UI thread.
                        </p>
                    </div>
                </div>

                {/* SEO Card 2: Four-Stage Launch Pipeline */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ListOrdered className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>The Four-Stage URL Processing Pipeline</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Raw Input Ingestion & Sanitization",
                                body: "Line-break separated string inputs are read and evaluated. Missing protocol prefixes are automatically prepended with default HTTPS handlers.",
                            },
                            {
                                step: "2",
                                title: "URL Validation & Parsing",
                                body: "Each candidate entry is passed through the browser URL API. Target hostname, protocol, and structural validity are verified in real time.",
                            },
                            {
                                step: "3",
                                title: "Set-Based Hash Deduplication",
                                body: "An active JavaScript Set data structure tracks normalized URLs to strip repeated instances across the launch array instantly.",
                            },
                            {
                                step: "4",
                                title: "Staggered Sandbox Dispatch",
                                body: "Target destinations are dispatched sequentially into isolated browser contexts using configurable asynchronous delay timers.",
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

                {/* SEO Card 3: Feature Matrix */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-8 shadow-sm p-4 sm:p-6 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Bulk Opener Capability Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Comparing native browser behavior against our client-side launch sandbox highlights key performance advantages during batch link execution.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Functional Feature</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Native Browser Tab Opening</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">TwisterTools Launch Sandbox</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Auto Protocol Prepending", "No (Returns invalid address error)", "Yes (Appends https:// automatically)"],
                                    ["Throttled Opening Delay", "No (Opens simultaneously / crashes)", "Yes (Configurable 0-60s async delay)"],
                                    ["Set-Based Deduplication", "No (Opens duplicate links)", "Yes (Removes duplicates automatically)"],
                                    ["Domain & Protocol Filtering", "No (No batch preview capability)", "Yes (Real-time search and protocol filters)"],
                                    ["Queue Export (CSV/JSON)", "No (Not available)", "Yes (Instant download options)"],
                                    ["Data Security", "Varies by third-party extension", "100% Client-Side Sandbox (Zero server logs)"],
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

                {/* SEO Card 4: Enterprise Applications */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Enterprise Workflows & Operational Use Cases</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "SEO Backlink & Indexing Inspections",
                                body: "Rapidly open dozens of target link URLs during backlink prospect reviews, site audits, and indexing status verification across search engines.",
                            },
                            {
                                title: "Affiliate & PPC Campaign Audits",
                                body: "Verify redirect chains, landing page availability, and UTM parameter configurations across multi-domain ad campaigns in seconds.",
                            },
                            {
                                title: "Cybersecurity Link Analysis",
                                body: "Inspect suspicious domain arrays, phishing report logs, and threat intelligence link feeds in controlled, isolated browser environments.",
                            },
                            {
                                title: "E-Commerce Competitor Tracking",
                                body: "Launch batch product listing URLs across major retail marketplaces to compare pricing, inventory status, and promotional messaging.",
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

                {/* SEO Card 5: Core Benefits */}
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
                                title: "Zero Data Ingestion Server-Side",
                                body: "All parsing, sanitization, and window creation routines execute exclusively inside local browser memory. No destination URLs are stored or logged.",
                            },
                            {
                                icon: Zap,
                                title: "Asynchronous Non-Blocking Engine",
                                body: "Built using modern JavaScript timing routines to prevent tab freezing and optimize CPU performance when handling multi-hundred URL batches.",
                            },
                            {
                                icon: Download,
                                title: "Complete Data Export Options",
                                body: "Export sanitized launch queues into structured CSV, JSON, or plain text files with single-click actions for seamless integration into downstream tools.",
                            },
                            {
                                icon: Lock,
                                title: "Pop-Up Mitigation Guidance",
                                body: "Includes integrated warning detectors that alert users if browser security settings block background window creation.",
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

                {/* SEO Card 6: FAQ Section */}
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
                                q: "Why did my browser only open one or two tabs?",
                                a: "Modern web browsers enable pop-up blockers by default to prevent unwanted windows. To allow batch launching, click the pop-up blocker icon in your browser's address bar and select 'Always allow pop-ups from twistertools.com'.",
                            },
                            {
                                q: "Do I need to include 'https://' before every domain?",
                                a: "No. The utility automatically detects plain domain names (such as example.com) and prepends the standard secure HTTPS protocol prefix automatically before processing.",
                            },
                            {
                                q: "Why should I configure a launch delay between tabs?",
                                a: "Setting a 1 to 2 second delay between window dispatches prevents high CPU memory spikes and prevents web security systems from flagging your IP for automated request floods.",
                            },
                            {
                                q: "Is there a limit on how many URLs I can open at once?",
                                a: "While the tool has no hardcoded limit, most modern desktop browsers operate efficiently with batches up to 50–100 tabs depending on available system RAM.",
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
                        name: "Bulk Multi-URL Opener & Launch Sandbox",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports standard HTML5 browsers.",
                        description: "Free online client-side Bulk Multi-URL Opener & Launch Sandbox. Parse, sanitize, deduplicate, delay, and launch multiple website URLs simultaneously in isolated browser tabs.",
                        featureList: [
                            "Automatic HTTPS scheme prepending",
                            "Configurable staggered delay timer",
                            "Set-based URL deduplication",
                            "Real-time domain and protocol filtering",
                            "Export launch queue to CSV, JSON, and TXT",
                            "100% browser-side client processing",
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
                                name: "Why did my browser only open one or two tabs?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Modern browsers block pop-ups by default. Allow pop-ups for twistertools.com in your browser address bar to launch full URL lists.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Do I need to include 'https://' before every domain?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. Plain domain names are automatically prepended with default HTTPS handlers.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why should I configure a launch delay between tabs?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Setting a delay prevents CPU memory spikes and prevents IP rate-limiting from target servers.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is there a limit on how many URLs I can open at once?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The tool has no hardcoded limit, though system RAM typically handles batches of 50 to 100 tabs smoothly.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}