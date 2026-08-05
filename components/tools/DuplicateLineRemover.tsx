"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Copy,
    Check,
    Download,
    Trash2,
    RefreshCw,
    Sliders,
    FileText,
    ListFilter,
    ArrowDownAZ,
    ArrowUpZA,
    Sparkles,
    CheckCircle2,
    HelpCircle,
    BookOpen,
    Layers,
    ShieldCheck,
    AlignLeft,
    Cpu,
    Zap,
    Code2,
    Database,
    FileCheck,
    Scale,
    Binary,
    BarChart3,
    Table,
    Terminal
} from "lucide-react";

type SortMode = "none" | "asc" | "desc" | "length-asc" | "length-desc";
type CaseSensitivity = "sensitive" | "insensitive";

interface Preset {
    id: string;
    label: string;
    description: string;
    text: string;
    caseSensitive: boolean;
    trimLines: boolean;
    removeEmpty: boolean;
    sortMode: SortMode;
}

const PRESETS: Preset[] = [
    {
        id: "email-list",
        label: "Email List Cleanup",
        description: "Removes duplicate emails, trims trailing whitespace, and ignores case.",
        text: "alex@example.com\n contact@company.org \nALEX@EXAMPLE.COM\nsales@company.org\ncontact@company.org\n\nsupport@company.org",
        caseSensitive: false,
        trimLines: true,
        removeEmpty: true,
        sortMode: "asc"
    },
    {
        id: "keywords-list",
        label: "SEO Keywords",
        description: "Deduplicates SEO target keywords and sorts alphabetically.",
        text: "react tutorial\nnextjs developer tools\nreact tutorial\nweb development tools\nReact Tutorial\nseo optimization",
        caseSensitive: false,
        trimLines: true,
        removeEmpty: true,
        sortMode: "asc"
    },
    {
        id: "code-imports",
        label: "Code Imports / URLs",
        description: "Cleans duplicate URLs or code imports maintaining case exactness.",
        text: "https://twistertools.com/tools/text-tools/duplicate-line-remover\nhttps://twistertools.com/tools/text-tools/duplicate-line-remover\nhttps://twistertools.com/tools/json-tools/json-formatter\nhttps://twistertools.com/tools/json-tools/json-formatter",
        caseSensitive: true,
        trimLines: true,
        removeEmpty: true,
        sortMode: "none"
    }
];

export default function DuplicateLineRemover() {
    // Primary Input & Control States
    const [inputText, setInputText] = useState<string>(
        "Apple\nbanana\nApple\n\ncherry\nBanana\napple\ndate\n\ncherry"
    );
    const [caseSensitivity, setCaseSensitivity] = useState<CaseSensitivity>("insensitive");
    const [trimLines, setTrimLines] = useState<boolean>(true);
    const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
    const [sortMode, setSortMode] = useState<SortMode>("none");
    const [prefixLineNumbers, setPrefixLineNumbers] = useState<boolean>(false);

    // Custom Find & Replace States
    const [findPattern, setFindPattern] = useState<string>("");
    const [replacePattern, setReplacePattern] = useState<string>("");

    // UI Feedback States
    const [copied, setCopied] = useState<boolean>(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Deduplication Processing Engine
    const processingResults = useMemo(() => {
        if (!inputText) {
            return {
                cleanedText: "",
                originalLineCount: 0,
                uniqueLineCount: 0,
                removedLineCount: 0,
                charCountOriginal: 0,
                charCountCleaned: 0,
                reductionPercentage: 0
            };
        }

        let rawLines = inputText.split(/\r?\n/);
        const originalLineCount = rawLines.length;
        const charCountOriginal = inputText.length;

        // Step 1: Optional Custom Replacement / Clean
        if (findPattern) {
            try {
                const regex = new RegExp(findPattern, caseSensitivity === "insensitive" ? "gi" : "g");
                rawLines = rawLines.map(line => line.replace(regex, replacePattern));
            } catch {
                // If regex invalid, fallback to literal replacement
                rawLines = rawLines.map(line => line.split(findPattern).join(replacePattern));
            }
        }

        // Step 2: Line Trimming
        if (trimLines) {
            rawLines = rawLines.map(line => line.trim());
        }

        // Step 3: Remove Empty Lines
        if (removeEmptyLines) {
            rawLines = rawLines.filter(line => line.length > 0);
        }

        // Step 4: Deduplication Logic using Set / HashMap tracking
        const uniqueLines: string[] = [];
        const seenKeys = new Set<string>();

        for (const line of rawLines) {
            const key = caseSensitivity === "insensitive" ? line.toLowerCase() : line;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueLines.push(line);
            }
        }

        // Step 5: Sorting Options
        if (sortMode === "asc") {
            uniqueLines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        } else if (sortMode === "desc") {
            uniqueLines.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: "base" }));
        } else if (sortMode === "length-asc") {
            uniqueLines.sort((a, b) => a.length - b.length || a.localeCompare(b));
        } else if (sortMode === "length-desc") {
            uniqueLines.sort((a, b) => b.length - a.length || a.localeCompare(b));
        }

        // Step 6: Line Numbering Prefix
        let outputLines = uniqueLines;
        if (prefixLineNumbers) {
            outputLines = uniqueLines.map((line, idx) => `${idx + 1}. ${line}`);
        }

        const cleanedText = outputLines.join("\n");
        const uniqueLineCount = uniqueLines.length;
        const removedLineCount = Math.max(0, originalLineCount - uniqueLineCount);
        const charCountCleaned = cleanedText.length;
        const reductionPercentage = originalLineCount > 0
            ? Math.round((removedLineCount / originalLineCount) * 100)
            : 0;

        return {
            cleanedText,
            originalLineCount,
            uniqueLineCount,
            removedLineCount,
            charCountOriginal,
            charCountCleaned,
            reductionPercentage
        };
    }, [
        inputText,
        caseSensitivity,
        trimLines,
        removeEmptyLines,
        sortMode,
        prefixLineNumbers,
        findPattern,
        replacePattern
    ]);

    // Handlers
    const handleCopy = () => {
        if (!processingResults.cleanedText) return;
        navigator.clipboard.writeText(processingResults.cleanedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInputText("");
        setFindPattern("");
        setReplacePattern("");
        setActivePresetId(null);
    };

    const handleExportTxt = () => {
        if (!processingResults.cleanedText) return;
        const blob = new Blob([processingResults.cleanedText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "deduplicated-text.txt";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
                setInputText(content);
                setActivePresetId(null);
            }
        };
        reader.readAsText(file);
    };

    const applyPreset = (preset: Preset) => {
        setInputText(preset.text);
        setCaseSensitivity(preset.caseSensitive ? "sensitive" : "insensitive");
        setTrimLines(preset.trimLines);
        setRemoveEmptyLines(preset.removeEmpty);
        setSortMode(preset.sortMode);
        setActivePresetId(preset.id);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Duplicate Line Remover & Deduplicator",
        "url": "https://twistertools.com/tools/text-tools/duplicate-line-remover",
        "description": "Enterprise-grade browser-native client-side text deduplication engine. Remove duplicate lines, trim whitespace, filter empty lines, sort datasets, and perform regex cleaning safely.",
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
                "name": "Is my text data uploaded to any server during deduplication?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All text processing and duplicate line removal occur entirely in your local browser runtime using JavaScript Web APIs. Your inputs, sensitive lists, and files never cross a network interface or reach external servers."
                }
            },
            {
                "@type": "Question",
                "name": "What algorithmic complexity does this deduplication tool use?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses an O(N) linear-time hash set data structure for duplicate checking, followed by an optional O(N log N) sorting step. This guarantees instant processing even for massive datasets with hundreds of thousands of lines."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between case-sensitive and case-insensitive deduplication?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Case-sensitive deduplication preserves 'Apple' and 'apple' as unique entries. Case-insensitive mode normalizes strings prior to hash key evaluation, treating them as identical duplicates."
                }
            },
            {
                "@type": "Question",
                "name": "How does whitespace trimming impact duplicate line identification?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Trimming removes invisible leading/trailing space, tab, and carriage return characters. This prevents visually identical strings with trailing spaces from bypassing duplicate detection filters."
                }
            },
            {
                "@type": "Question",
                "name": "Can I perform regex find-and-replace during deduplication?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can supply custom Regular Expressions or literal text patterns in the Find & Replace fields to sanitize strings prior to deduplication."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Input Area */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-indigo-600" />
                                Original Text Input
                            </h2>
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".txt,.csv,.log,.md,.json"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200"
                                >
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 flex items-center gap-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Textarea Input */}
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    setActivePresetId(null);
                                }}
                                placeholder="Paste or type your text list here..."
                                rows={10}
                                className="w-full h-64 p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900"
                            />
                        </div>

                        {/* Deduplication Settings Controls */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Options & Filters
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-slate-700">
                                {/* Case Sensitivity */}
                                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={caseSensitivity === "insensitive"}
                                        onChange={(e) => setCaseSensitivity(e.target.checked ? "insensitive" : "sensitive")}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Ignore Case Differences</span>
                                </label>

                                {/* Trim Lines */}
                                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={trimLines}
                                        onChange={(e) => setTrimLines(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Trim Leading / Trailing Spaces</span>
                                </label>

                                {/* Remove Empty Lines */}
                                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={removeEmptyLines}
                                        onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Remove Empty Lines</span>
                                </label>

                                {/* Add Line Numbers */}
                                <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={prefixLineNumbers}
                                        onChange={(e) => setPrefixLineNumbers(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Prefix Line Numbers</span>
                                </label>
                            </div>

                            {/* Sort Mode Select */}
                            <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-700">
                                    Sort Output Order:
                                </label>
                                <select
                                    value={sortMode}
                                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="none">Original Sequence (No Sorting)</option>
                                    <option value="asc">Alphabetical (A → Z)</option>
                                    <option value="desc">Reverse Alphabetical (Z → A)</option>
                                    <option value="length-asc">Length (Shortest First)</option>
                                    <option value="length-desc">Length (Longest First)</option>
                                </select>
                            </div>

                            {/* Find & Replace Controls */}
                            <div className="pt-2 border-t border-slate-200/60 space-y-2">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Optional Find & Replace:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Find text / pattern..."
                                        value={findPattern}
                                        onChange={(e) => setFindPattern(e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Replace with..."
                                        value={replacePattern}
                                        onChange={(e) => setReplacePattern(e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Reference Presets */}
                        <div className="pt-2 space-y-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Presets
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${activePresetId === preset.id
                                            ? "bg-indigo-600 text-white border-indigo-600"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Deduplicated Result & Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Deduplicated Result
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    disabled={!processingResults.cleanedText}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy Result"}
                                </button>
                                <button
                                    onClick={handleExportTxt}
                                    disabled={!processingResults.cleanedText}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-semibold transition border border-indigo-200 flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export .TXT
                                </button>
                            </div>
                        </div>

                        {/* Statistics Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Original Lines</span>
                                <span className="text-lg font-black text-slate-800">{processingResults.originalLineCount}</span>
                            </div>
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Unique Lines</span>
                                <span className="text-lg font-black text-emerald-700">{processingResults.uniqueLineCount}</span>
                            </div>
                            <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl">
                                <span className="text-[10px] font-bold text-rose-600 uppercase block">Duplicates Removed</span>
                                <span className="text-lg font-black text-rose-700">{processingResults.removedLineCount}</span>
                            </div>
                            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase block">Reduction</span>
                                <span className="text-lg font-black text-indigo-700">{processingResults.reductionPercentage}%</span>
                            </div>
                        </div>

                        {/* Deduplicated Textarea Output */}
                        <div className="relative">
                            <textarea
                                readOnly
                                value={processingResults.cleanedText}
                                placeholder="Cleaned output will appear here automatically..."
                                rows={10}
                                className="w-full h-[310px] p-3.5 text-xs sm:text-sm font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl outline-none resize-none"
                            />
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            100% Secure Local Processing
                        </span>
                        <span>{processingResults.charCountCleaned} characters</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT */}
            <div className="space-y-6">
                {/* Card 1: Tool Mechanics & Algorithmic Analysis */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithmic Architecture & Data Processing Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Text deduplication is a fundamental operations task across data engineering, digital marketing, software development, and database administration. While standard text editors often crash or stutter when evaluating multi-megabyte files, the <strong>TwisterTools Duplicate Line Remover</strong> leverages modern V8 engine optimization via an memory-efficient $O(N)$ Hash Set pipeline.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Hash Set Lookup ($O(N)$)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Instead of performing pairwise array comparisons ($O(N^2)$ algorithmic cost), each line is hashed and stored inside a native JavaScript <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">Set</code>. Member checking operates in $O(1)$ constant time, allowing 100,000+ line documents to be processed in under 50 milliseconds.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Binary className="w-4 h-4 text-indigo-600" /> Memory Isolation & Zero-Server Trust
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Conventional online text tools send payload data to remote cloud microservices via POST requests, creating security vulnerabilities for private database credentials or customer emails. This architecture runs completely in your client browser's sandboxed JavaScript memory pool.
                            </p>
                        </div>
                    </div>

                    {/* Step-by-Step Execution Diagram */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Sequential Deduplication Pipeline
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><span className="text-slate-500">1. INPUT STREAM:</span> Raw String Payload &rarr; Split via <code className="text-emerald-400">/\r?\n/</code> delimiter</div>
                            <div><span className="text-slate-500">2. REGEX CLEAN:</span> Apply optional Find & Replace patterns across line items</div>
                            <div><span className="text-slate-500">3. SANITIZATION:</span> Strip leading/trailing ASCII whitespace if enabled</div>
                            <div><span className="text-slate-500">4. EMPTY FILTER:</span> Omit 0-length strings from candidate array</div>
                            <div><span className="text-slate-500">5. HASH LOOKUP:</span> Evaluate <code className="text-emerald-400">seenKeys.has(normalizedKey)</code> in O(1) time</div>
                            <div><span className="text-slate-500">6. SORT & FORMAT:</span> Apply optional Lexicographical or Length-based sorting</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Feature Matrix & Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Deduplication Methods & Tool Comparison Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding how different text utilities handle string matching helps you choose the correct approach for your workload requirements:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Processing Method</th>
                                    <th className="p-3">Time Complexity</th>
                                    <th className="p-3">Privacy Profile</th>
                                    <th className="p-3">Maximum Recommended Scale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">TwisterTools (Client JS Hash Set)</td>
                                    <td className="p-3 font-mono text-xs">$O(N)$ Linear</td>
                                    <td className="p-3 text-emerald-600 font-semibold">100% Client-Side (Zero Server)</td>
                                    <td className="p-3">500,000+ Lines</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-800">Linux CLI (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">sort | uniq</code>)</td>
                                    <td className="p-3 font-mono text-xs">$O(N \log N)$ Sorting</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Local Terminal</td>
                                    <td className="p-3">10,000,000+ Lines</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-800">Spreadsheet Apps (Excel / Sheets)</td>
                                    <td className="p-3 font-mono text-xs">$O(N^2)$ Memory Heavy</td>
                                    <td className="p-3 text-amber-600 font-semibold">Cloud Sync / Proprietary</td>
                                    <td className="p-3">~100,000 Lines (Lag prone)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-800">Standard Online Web Form Tools</td>
                                    <td className="p-3 font-mono text-xs">Variable (Network bound)</td>
                                    <td className="p-3 text-rose-600 font-semibold">Server Upload Risk</td>
                                    <td className="p-3">10,000 Lines</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Deep Industry Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Applications & Practical Integration Workflows
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Use Case 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <FileCheck className="w-4 h-4" /> Marketing & CRM Hygiene
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sending duplicate newsletters ruins sender reputation scores and increases SMTP provider billing tiers. Cleaning email lists with case-insensitive filtering strips out capitalization variants like <code className="text-slate-800">User@Domain.com</code> and <code className="text-slate-800">user@domain.com</code> automatically.
                            </p>
                        </div>

                        {/* Use Case 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Code2 className="w-4 h-4" /> Software Engineering
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When refactoring monolithic codebases or combining CSS class lists, developers frequently accumulate duplicate imports, environment variable keys, or SQL seed values. This tool cleans raw lists so they can be copy-pasted directly into IDE configuration files.
                            </p>
                        </div>

                        {/* Use Case 3 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Database className="w-4 h-4" /> SEO & Web Archiving
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Crawling engines produce sitemap lists with trailing slashes, duplicate query parameters, or mixed cases. Cleaning target URL seeds before running bulk indexing or competitor audits eliminates redundant server requests.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Detailed Worked Step-by-Step Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Transformation Examples
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example A: Mixed Case & Whitespace Cleanup</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Email List</span>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="font-bold text-slate-700 block">Raw Input:</span>
                                    <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800 mt-1">
                                        {"  John@Example.com  \njohn@example.com\n\nADMIN@SITE.ORG\nadmin@site.org"}
                                    </pre>
                                </div>
                                <div>
                                    <span className="font-bold text-emerald-700 block">Cleaned Output (Ignore Case + Trim):</span>
                                    <pre className="bg-slate-900 text-emerald-400 p-2 rounded font-mono mt-1">
                                        {"John@Example.com\nADMIN@SITE.ORG"}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Example B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example B: Key Deduplication with Alphabetical Sort</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">SEO Target Keywords</span>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="font-bold text-slate-700 block">Raw Input:</span>
                                    <pre className="bg-white p-2 rounded border border-slate-200 font-mono text-slate-800 mt-1">
                                        {"react hooks\nnextjs speed\nreact hooks\nanalytics setup"}
                                    </pre>
                                </div>
                                <div>
                                    <span className="font-bold text-emerald-700 block">Cleaned Output (Sorted A → Z):</span>
                                    <pre className="bg-slate-900 text-emerald-400 p-2 rounded font-mono mt-1">
                                        {"analytics setup\nnextjs speed\nreact hooks"}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
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
                                Is my text uploaded to any server during processing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All text processing and duplicate line removal occur entirely in your local web browser using client-side JavaScript. Your inputs, proprietary data, customer lists, and file uploads never cross a network or reach an external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does case-insensitive deduplication work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When "Ignore Case Differences" is checked, the engine converts every line string to lowercase internally when evaluating uniqueness in its Hash Set, while retaining the original text capitalization for the first encountered item.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum line limit this tool can process?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Because the engine utilizes an $O(N)$ hash set algorithm, it can easily deduplicate lists containing 100,000+ lines in seconds. The primary limit is your device's available system RAM.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I clean text using Regular Expressions (Regex)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Enter a regex pattern (such as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 text-xs">\s+</code> or custom replacement strings) into the Find & Replace fields to sanitize text before duplicate line filters execute.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}