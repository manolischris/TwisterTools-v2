"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    AlignLeft,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Trash2,
    FileText,
    ArrowRightLeft,
    SlidersHorizontal,
    Code2,
    CheckCircle2,
    HelpCircle,
    BookOpen,
    Cpu,
    ShieldCheck,
    Layers,
    Terminal,
    Zap,
    Download,
    Upload,
    Scissors,
    Quote
} from "lucide-react";

type DelimiterType = "space" | "comma" | "comma_space" | "semicolon" | "pipe" | "custom" | "none";
type QuoteType = "none" | "single" | "double" | "backtick";

export default function TextSingleLineConverter() {
    // Core state
    const [inputText, setInputText] = useState<string>(
        `SELECT\n    users.id,\n    users.name,\n    users.email,\n    orders.total_amount\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id\nWHERE orders.status = 'completed'\n  AND users.created_at >= '2026-01-01'\nORDER BY orders.total_amount DESC;`
    );

    // Transformation settings
    const [delimiterType, setDelimiterType] = useState<DelimiterType>("space");
    const [customDelimiter, setCustomDelimiter] = useState<string>(" | ");
    const [quoteType, setQuoteType] = useState<QuoteType>("none");
    const [collapseMultipleSpaces, setCollapseMultipleSpaces] = useState<boolean>(true);
    const [trimLineEdges, setTrimLineEdges] = useState<boolean>(true);
    const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
    const [escapeQuotes, setEscapeQuotes] = useState<boolean>(false);
    const [escapeBackslashes, setEscapeBackslashes] = useState<boolean>(false);
    const [wrapWithBrackets, setWrapWithBrackets] = useState<boolean>(false);

    // UI feedback state
    const [copied, setCopied] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dynamic minification engine
    const outputText = useMemo(() => {
        if (!inputText) return "";

        // Step 1: Split input into raw lines (handling \r\n and \n)
        let lines = inputText.split(/\r?\n/);

        // Step 2: Per-line trimming and empty-line filtering
        if (trimLineEdges) {
            lines = lines.map((line) => line.trim());
        }

        if (removeEmptyLines) {
            lines = lines.filter((line) => line.length > 0);
        }

        // Step 3: Per-item quoting or escaping if requested
        if (quoteType !== "none") {
            const q = quoteType === "single" ? "'" : quoteType === "double" ? '"' : "`";
            lines = lines.map((line) => {
                let processed = line;
                if (escapeBackslashes) {
                    processed = processed.replace(/\\/g, "\\\\");
                }
                if (escapeQuotes) {
                    const regex = new RegExp(q, "g");
                    processed = processed.replace(regex, `\\${q}`);
                }
                return `${q}${processed}${q}`;
            });
        }

        // Step 4: Resolve active delimiter string
        let sep = " ";
        switch (delimiterType) {
            case "space":
                sep = " ";
                break;
            case "comma":
                sep = ",";
                break;
            case "comma_space":
                sep = ", ";
                break;
            case "semicolon":
                sep = "; ";
                break;
            case "pipe":
                sep = " | ";
                break;
            case "none":
                sep = "";
                break;
            case "custom":
                sep = customDelimiter;
                break;
        }

        // Step 5: Join lines
        let result = lines.join(sep);

        // Step 6: Collapse consecutive whitespace sequences if enabled and delimiter isn't intentionally multi-space
        if (collapseMultipleSpaces && delimiterType !== "custom") {
            result = result.replace(/[ \t]+/g, " ");
        }

        // Step 7: Optional outer wrapper
        if (wrapWithBrackets) {
            result = `[ ${result} ]`;
        }

        return result;
    }, [
        inputText,
        delimiterType,
        customDelimiter,
        quoteType,
        collapseMultipleSpaces,
        trimLineEdges,
        removeEmptyLines,
        escapeQuotes,
        escapeBackslashes,
        wrapWithBrackets
    ]);

    // Metrics calculations
    const stats = useMemo(() => {
        const inputChars = inputText.length;
        const inputLines = inputText ? inputText.split(/\r?\n/).length : 0;
        const outputChars = outputText.length;
        const outputWords = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
        const savedBytes = inputChars - outputChars;
        const compressionRatio = inputChars > 0 ? (((inputChars - outputChars) / inputChars) * 100).toFixed(1) : "0.0";

        return {
            inputChars,
            inputLines,
            outputChars,
            outputWords,
            savedBytes,
            compressionRatio
        };
    }, [inputText, outputText]);

    // Handlers
    const handleCopy = () => {
        if (!outputText) return;
        navigator.clipboard.writeText(outputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInputText("");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const content = ev.target?.result;
            if (typeof content === "string") {
                setInputText(content);
            }
        };
        reader.readAsText(file);
        // Reset file input value
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownload = () => {
        if (!outputText) return;
        const blob = new Blob([outputText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "minified-single-line.txt";
        link.click();
        URL.revokeObjectURL(url);
    };

    const applyPreset = (type: "sql" | "csv" | "array" | "env" | "tight") => {
        switch (type) {
            case "sql":
                setDelimiterType("space");
                setQuoteType("none");
                setCollapseMultipleSpaces(true);
                setTrimLineEdges(true);
                setRemoveEmptyLines(true);
                setWrapWithBrackets(false);
                break;
            case "csv":
                setDelimiterType("comma_space");
                setQuoteType("none");
                setCollapseMultipleSpaces(true);
                setTrimLineEdges(true);
                setRemoveEmptyLines(true);
                setWrapWithBrackets(false);
                break;
            case "array":
                setDelimiterType("comma_space");
                setQuoteType("double");
                setEscapeQuotes(true);
                setTrimLineEdges(true);
                setRemoveEmptyLines(true);
                setWrapWithBrackets(true);
                break;
            case "env":
                setDelimiterType("none");
                setQuoteType("none");
                setEscapeBackslashes(true);
                setTrimLineEdges(true);
                setRemoveEmptyLines(true);
                setWrapWithBrackets(false);
                break;
            case "tight":
                setDelimiterType("none");
                setQuoteType("none");
                setCollapseMultipleSpaces(true);
                setTrimLineEdges(true);
                setRemoveEmptyLines(true);
                setWrapWithBrackets(false);
                break;
        }
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Plain Text to Single-Line Minifier",
        "url": "https://twistertools.com/tools/text-tools/text-single-line-converter",
        "description": "High-performance plain text to single-line minifier and line-break flattener. Convert multi-line strings, SQL queries, code snippets, CSV columns, and raw text into clean, single-line strings with custom delimiters.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "What does a plain text to single-line converter do?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A plain text to single-line converter strips newline characters (\\n, \\r\\n), carriage returns, and excessive tab indentation from multi-line text blocks. It condenses the entire content into an unbroken, one-line string separated by your choice of custom delimiter (spaces, commas, pipes, or semicolons)."
                }
            },
            {
                "@type": "Question",
                "name": "Why is line flattening essential for SQL queries and JSON payloads?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Many database CLI tools, API body builders, environment variable configs (.env), and logging daemons reject raw multi-line strings or misinterpret unescaped line breaks. Converting formatted SQL statements or multi-line strings into unified single-line payloads prevents parsing syntax errors while preserving semantic execution order."
                }
            },
            {
                "@type": "Question",
                "name": "How does the delimiter selection alter the minified text output?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The delimiter determines what replaces each newline boundary. A single space preserves natural sentence readability; a comma or comma-space transforms line lists into SQL 'IN (...)' clauses or programming arrays; and a pipe or custom delimiter is ideal for generating delimited log files and search regex patterns."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text data processed on an external server or stored anywhere?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates 100% locally in your web browser via client-side JavaScript. Your text, code snippets, proprietary database queries, and private tokens never leave your device or touch an external server."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool wrap items in quotation marks or brackets for code arrays?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The tool features advanced item-quoting modes (single quotes, double quotes, or JavaScript backticks) and automated array bracket encapsulation. It also includes automated quote escaping to prevent broken string literals when converting lists into programming arrays."
                }
            },
            {
                "@type": "Question",
                "name": "How does multi-space collapsing interact with custom delimiters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When 'Collapse Multiple Whitespaces' is active, repeated spaces and tab characters within each line are condensed into a single space. When combined with line-edge trimming, it guarantees maximum byte reduction and uniform spacing across your entire output string."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured JSON-LD Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Quick Preset Selection Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Quick Presets:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => applyPreset("sql")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                        SQL / CLI Command
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset("csv")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                        Comma-Separated List
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset("array")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                        Code Array &quot;[... ]&quot;
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset("env")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                        .env Payload String
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset("tight")}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                        Zero-Space Flatten
                    </button>
                </div>
            </div>

            {/* Granular Minifier Options Configurator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                        Minification & Delimiter Parameters
                    </span>
                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                        Configure delimiters, quotation wraps, and space rules
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Delimiter Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Line Delimiter</label>
                        <select
                            value={delimiterType}
                            onChange={(e) => setDelimiterType(e.target.value as DelimiterType)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="space">Single Space (&quot; &quot;)</option>
                            <option value="comma_space">Comma + Space (&quot;, &quot;)</option>
                            <option value="comma">Plain Comma (&quot;,&quot;)</option>
                            <option value="semicolon">Semicolon (&quot;; &quot;)</option>
                            <option value="pipe">Pipe Bar (&quot; | &quot;)</option>
                            <option value="none">No Separator (&quot;&quot;)</option>
                            <option value="custom">Custom String...</option>
                        </select>
                    </div>

                    {/* Custom Delimiter Input */}
                    {delimiterType === "custom" ? (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Custom Separator Value</label>
                            <input
                                type="text"
                                value={customDelimiter}
                                onChange={(e) => setCustomDelimiter(e.target.value)}
                                placeholder="e.g. -> or ---"
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Wrap Items in Quotes</label>
                            <select
                                value={quoteType}
                                onChange={(e) => setQuoteType(e.target.value as QuoteType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="none">None (No quotes)</option>
                                <option value="double">Double Quotes (&quot;item&quot;)</option>
                                <option value="single">Single Quotes (&apos;item&apos;)</option>
                                <option value="backtick">Backticks (`item`)</option>
                            </select>
                        </div>
                    )}

                    {/* Quotation Wrap (If custom was visible) */}
                    {delimiterType === "custom" && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">Wrap Items in Quotes</label>
                            <select
                                value={quoteType}
                                onChange={(e) => setQuoteType(e.target.value as QuoteType)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="none">None (No quotes)</option>
                                <option value="double">Double Quotes (&quot;item&quot;)</option>
                                <option value="single">Single Quotes (&apos;item&apos;)</option>
                                <option value="backtick">Backticks (`item`)</option>
                            </select>
                        </div>
                    )}

                    {/* Code Formatting Toggles */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                        <label className="text-xs font-bold text-slate-700 block">Formatting Cleaners</label>
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={trimLineEdges}
                                    onChange={(e) => setTrimLineEdges(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Trim Line Edges</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={removeEmptyLines}
                                    onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Remove Empty Lines</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={collapseMultipleSpaces}
                                    onChange={(e) => setCollapseMultipleSpaces(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Collapse Multiple Spaces</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={wrapWithBrackets}
                                    onChange={(e) => setWrapWithBrackets(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                <span>Wrap in [ Brackets ]</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Additional Escaping Options (Visible when quotes are active) */}
                {quoteType !== "none" && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                            <Code2 className="w-3.5 h-3.5 text-indigo-500" /> String Escaping:
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={escapeQuotes}
                                onChange={(e) => setEscapeQuotes(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span>Escape Internal Quotes (\&quot;)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={escapeBackslashes}
                                onChange={(e) => setEscapeBackslashes(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span>Escape Backslashes (\\)</span>
                        </label>
                    </div>
                )}
            </div>

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Multi-Line Input Editor */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                </div>
                                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Multi-Line Source Text
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.sql,.json,.csv,.js,.ts,.py,.md,.env"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Load local file"
                                >
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Upload</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Clear input"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Input Textarea Container */}
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste your multi-line code, SQL statements, lists, or text paragraphs here..."
                                className="w-full h-80 sm:h-96 p-4 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition leading-relaxed"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Input Metrics Readout */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 font-mono">
                        <span>Lines: <strong className="text-slate-800">{stats.inputLines}</strong></span>
                        <span>Characters: <strong className="text-slate-800">{stats.inputChars}</strong></span>
                        <span>Size: <strong className="text-slate-800">{new Blob([inputText]).size} B</strong></span>
                    </div>
                </div>

                {/* Right Workspace Panel: Minified Single-Line Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    Minified Single-Line Output
                                </h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownload}
                                    disabled={!outputText}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer"
                                    title="Download text file"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Download</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    disabled={!outputText}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer ${copied
                                            ? "bg-emerald-600 text-white"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                                        }`}
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copied ? "Copied!" : "Copy Result"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Output Textarea Container */}
                        <div className="relative">
                            <textarea
                                value={outputText}
                                readOnly
                                placeholder="Your flattened single-line string will generate here in real time..."
                                className="w-full h-80 sm:h-96 p-4 border border-slate-200 rounded-xl font-mono text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition leading-relaxed"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Output Efficiency Analytics */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 font-mono">
                        <span>Characters: <strong className="text-slate-800">{stats.outputChars}</strong></span>
                        <span>Words: <strong className="text-slate-800">{stats.outputWords}</strong></span>
                        <span className="text-emerald-600 font-bold">
                            Saved: {stats.savedBytes > 0 ? `${stats.savedBytes} B (${stats.compressionRatio}%)` : "0 B"}
                        </span>
                    </div>
                </div>

            </div>

            {/* Live Analytics Dashboard Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lines Condensed</span>
                    <div className="text-2xl font-black text-indigo-600 font-mono">
                        {stats.inputLines > 1 ? `${stats.inputLines} → 1` : stats.inputLines}
                    </div>
                    <span className="text-[10px] text-slate-400">Total lines flattened</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Byte Reduction</span>
                    <div className="text-2xl font-black text-emerald-600 font-mono">
                        {stats.savedBytes > 0 ? `-${stats.savedBytes} B` : "0 B"}
                    </div>
                    <span className="text-[10px] text-slate-400">Whitespace footprint removed</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delimiter Pattern</span>
                    <div className="text-base sm:text-lg font-bold text-slate-800 font-mono truncate px-1">
                        {delimiterType === "custom" ? customDelimiter : delimiterType === "comma_space" ? ", [space]" : delimiterType}
                    </div>
                    <span className="text-[10px] text-slate-400">Active line separator</span>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quotation Wrap</span>
                    <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                        {quoteType === "none" ? "None" : quoteType === "double" ? 'Double (")' : quoteType === "single" ? "Single (')" : "Backtick (`)"}
                    </div>
                    <span className="text-[10px] text-slate-400">Element wrapper mode</span>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Plain Text Minification Overview & Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Text to Single-Line Minification: Architecture and Purpose
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In modern software engineering, data serialization, and cloud infrastructure management, multi-line formatting is essential for human readability but frequently detrimental to programmatic parsers. Line breaks—encoded as Carriage Return Line Feeds (<code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700">\r\n</code> in Windows environments) or Line Feeds (<code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700">\n</code> in POSIX systems)—often break command-line shells, cause JSON payload truncation, and corrupt environment variable bindings.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>TwisterTools Plain Text to Single-Line Minifier</strong> systematically parses multi-line text buffers, purges non-semantic carriage returns, strips edge indentation tabs, collapses redundant internal whitespaces, and unifies fragmented string tokens into a pristine, contiguous one-line output string.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Deterministic Normalization</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Strips both LF and CRLF sequences uniformly, ensuring strict cross-platform compatibility across Linux, macOS, and Windows runtime hosts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Context-Aware Separators</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Swap newlines for custom delimiters like commas, semicolons, or pipe bars to immediately construct database IN clauses or delimited logs.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Pillar III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Zero-Latency Client Engine</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Executed exclusively inside your local V8 JavaScript sandbox. No server network hops, guaranteeing 100% data confidentiality for keys and tokens.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Delimiter Matrix & Operational Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scissors className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Delimiter Conversion Matrix & Technical Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate line-break substitute depends on the destination environment. The matrix below outlines standard delimiter configurations and their primary technical workflows:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Delimiter Type</th>
                                    <th className="p-3">Separator Token</th>
                                    <th className="p-3">Quotation Rule</th>
                                    <th className="p-3">Target Ecosystem</th>
                                    <th className="p-3">Typical Enterprise Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Single Space</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">&quot; &quot;</td>
                                    <td className="p-3 text-xs text-slate-600">None</td>
                                    <td className="p-3 text-xs font-semibold">SQL / CLI Terminals</td>
                                    <td className="p-3 text-xs text-slate-600">Minifying multi-line SELECT queries for inline shell execution and curl parameters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Comma + Space</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">&quot;, &quot;</td>
                                    <td className="p-3 text-xs text-slate-600">Single or Double</td>
                                    <td className="p-3 text-xs font-semibold">RDBMS / Python / JS</td>
                                    <td className="p-3 text-xs text-slate-600">Converting vertical spreadsheet lists into SQL &quot;WHERE id IN (&apos;a&apos;, &apos;b&apos;)&quot; filters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Array Wrapper</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">&quot;, &quot; + [ ... ]</td>
                                    <td className="p-3 text-xs text-slate-600">Double (&quot;)</td>
                                    <td className="p-3 text-xs font-semibold">TypeScript / JSON</td>
                                    <td className="p-3 text-xs text-slate-600">Transforming raw newline-separated lists directly into valid JSON or JS string arrays</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Pipe Bar</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">&quot; | &quot;</td>
                                    <td className="p-3 text-xs text-slate-600">None</td>
                                    <td className="p-3 text-xs font-semibold">RegEx / Logstash</td>
                                    <td className="p-3 text-xs text-slate-600">Building non-capturing regex match patterns: (error|warning|critical|fatal)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Zero Separator</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">&quot;&quot; (None)</td>
                                    <td className="p-3 text-xs text-slate-600">None</td>
                                    <td className="p-3 text-xs font-semibold">Base64 / PEM Keys</td>
                                    <td className="p-3 text-xs text-slate-600">Removing line wrapping from raw RSA public keys, SSH certs, or Base64 binary strings</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Deep Technical Use Cases in Engineering */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Terminal className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            High-Impact Engineering Use Cases & Workflow Automation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Condensing text across line boundaries solves recurring friction points across DevOps, database engineering, frontend development, and data pipelines:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> 1. Shell CLI and Docker Exec Commands
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Running complex SQL statements or script commands inside terminal emulators (<code className="px-1 py-0.5 bg-slate-200 text-xs font-mono rounded">docker exec</code>, <code className="px-1 py-0.5 bg-slate-200 text-xs font-mono rounded">psql -c</code>, or <code className="px-1 py-0.5 bg-slate-200 text-xs font-mono rounded">kubectl</code>) fails when unescaped newlines terminate the command prematurely. Converting queries to a single line guarantees flawless execution.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600" /> 2. JSON String Literal Compaction
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The JSON specification (RFC 8259) strictly forbids raw, unescaped literal line breaks inside string values. Minifying multi-line templates into single-line strings eliminates JSON parse syntax crashes during REST API transmission and webhook triggering.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> 3. Cloud .env & CI/CD Variable Injection
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Cloud providers (AWS Systems Manager, GitHub Actions Secrets, Vercel Environment Variables) frequently truncate multi-line private keys or configuration payloads. Single-line minification with backslash escaping preserves complex values without deployment failure.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 4. Spreadsheet Column to Query Translation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Data analysts copying a vertical column of thousands of customer IDs from Excel or Google Sheets can instantly convert them into a comma-delimited list wrapped in single quotes, ready to paste into PostgreSQL or Snowflake query clauses.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Optimization Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Guide: Compressing Multi-Line Text in 4 Simple Steps
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Paste or Upload Multi-Line Content</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Paste your multi-line SQL, code snippet, raw column list, or paragraph block into the left editor panel. Alternatively, click <strong>Upload</strong> to import any plain-text file (.txt, .sql, .csv, .json, .env).
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Select Your Line Delimiter Strategy</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Choose how line transitions are represented: single space for sentences and queries, comma-space for arrays, pipe for regular expressions, or custom string for proprietary protocol formats.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Fine-Tune Cleaning & Quoting Rules</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Toggle line-edge trimming, empty line filtering, space collapsing, or quotation wrapping (single, double, or backticks). Enable automated escape flags if your text contains nested quotation characters.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Copy or Export Minified String</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Click <strong>Copy Result</strong> for instantaneous clipboard transfer or <strong>Download</strong> to save the optimized single-line string as a local file.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Security & In-Browser Privacy Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Zero-Knowledge Client-Side Architecture & Data Privacy Guarantee
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Data privacy is paramount when dealing with proprietary database queries, production environment keys, and intellectual property. Unlike cloud-hosted text processors that send user input over HTTP to backend microservices, TwisterTools executes all minification algorithms 100% locally inside your browser runtime.
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-700 pt-1">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 block text-sm">No Server Transmissions</span>
                            <p className="text-slate-600 leading-relaxed">
                                Your source text never leaves your browser tab. Zero network requests or telemetry payloads are transmitted during processing.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 block text-sm">No Database Retention</span>
                            <p className="text-slate-600 leading-relaxed">
                                TwisterTools does not log, cache, or persist your text payloads. Closing the browser tab destroys all memory buffers immediately.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 block text-sm">Air-Gapped Operation</span>
                            <p className="text-slate-600 leading-relaxed">
                                Fully functional offline. Once loaded, you can disconnect your internet connection and convert unlimited multi-line strings securely.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                What does a plain text to single-line converter do?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A plain text to single-line converter strips newline characters (\n, \r\n), carriage returns, and excessive tab indentation from multi-line text blocks. It condenses the entire content into an unbroken, one-line string separated by your choice of custom delimiter (spaces, commas, pipes, or semicolons).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is line flattening essential for SQL queries and JSON payloads?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Many database CLI tools, API body builders, environment variable configs (.env), and logging daemons reject raw multi-line strings or misinterpret unescaped line breaks. Converting formatted SQL statements or multi-line strings into unified single-line payloads prevents parsing syntax errors while preserving semantic execution order.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the delimiter selection alter the minified text output?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The delimiter determines what replaces each newline boundary. A single space preserves natural sentence readability; a comma or comma-space transforms line lists into SQL &quot;IN (...)&quot; clauses or programming arrays; and a pipe or custom delimiter is ideal for generating delimited log files and search regex patterns.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text data processed on an external server or stored anywhere?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates 100% locally in your web browser via client-side JavaScript. Your text, code snippets, proprietary database queries, and private tokens never leave your device or touch an external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool wrap items in quotation marks or brackets for code arrays?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The tool features advanced item-quoting modes (single quotes, double quotes, or JavaScript backticks) and automated array bracket encapsulation. It also includes automated quote escaping to prevent broken string literals when converting lists into programming arrays.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does multi-space collapsing interact with custom delimiters?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When &quot;Collapse Multiple Whitespaces&quot; is active, repeated spaces and tab characters within each line are condensed into a single space. When combined with line-edge trimming, it guarantees maximum byte reduction and uniform spacing across your entire output string.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}