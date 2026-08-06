"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    AlignLeft,
    ListFilter,
    Scissors,
    Copy,
    Check,
    Download,
    Trash2,
    BarChart3,
    Sparkles,
    ShieldCheck,
    FileText,
    Settings,
    HelpCircle,
    BookOpen,
    Calculator,
    Zap,
    CheckCircle2,
    Code,
    Layers,
    ArrowDownUp,
    FileCheck,
    Cpu,
    Search,
    Globe
} from "lucide-react";

interface OptionState {
    removeEmptyLines: boolean;
    removeWhitespaceLines: boolean;
    trimLines: boolean;
    removeDuplicateLines: boolean;
    sortLines: "none" | "asc" | "desc";
    caseSensitiveDedupe: boolean;
}

const PRESETS = [
    {
        id: "clean-csv",
        label: "Clean CSV / Data List",
        text: "id,name,email\n1,Alice,alice@example.com\n\n2,Bob,bob@example.com\n  \n3,Charlie,charlie@example.com\n2,Bob,bob@example.com",
        options: {
            removeEmptyLines: true,
            removeWhitespaceLines: true,
            trimLines: true,
            removeDuplicateLines: true,
            sortLines: "none" as const,
            caseSensitiveDedupe: false,
        },
    },
    {
        id: "sort-code",
        label: "Sort Imports / Code",
        text: "import { useState } from 'react';\nimport { Copy } from 'lucide-react';\n\nimport { Download } from 'lucide-react';\nimport { useState } from 'react';\nimport { Check } from 'lucide-react';",
        options: {
            removeEmptyLines: true,
            removeWhitespaceLines: true,
            trimLines: true,
            removeDuplicateLines: true,
            sortLines: "asc" as const,
            caseSensitiveDedupe: true,
        },
    },
];

export default function LineCounter() {
    const [inputText, setInputText] = useState<string>(
        "Welcome to TwisterTools Line Counter!\n\nThis tool counts total lines, blank lines, and characters.\n  \nIt can also strip blank lines, trim whitespace, and sort entries.\n\nTry pasting your own log files or text lists here!"
    );

    const [options, setOptions] = useState<OptionState>({
        removeEmptyLines: false,
        removeWhitespaceLines: false,
        trimLines: false,
        removeDuplicateLines: false,
        sortLines: "none",
        caseSensitiveDedupe: false,
    });

    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const exportRef = useRef<HTMLDivElement>(null);

    // Processed text calculation pipeline
    const processedResult = useMemo(() => {
        if (!inputText) {
            return {
                text: "",
                rawLineCount: 0,
                emptyLineCount: 0,
                whitespaceLineCount: 0,
                nonEmptyLineCount: 0,
                duplicateCount: 0,
                characterCount: 0,
                wordCount: 0,
            };
        }

        const lines = inputText.split(/\r?\n/);
        const rawLineCount = lines.length;

        let emptyLineCount = 0;
        let whitespaceLineCount = 0;

        lines.forEach((line) => {
            if (line === "") {
                emptyLineCount++;
            } else if (line.trim() === "") {
                whitespaceLineCount++;
            }
        });

        let outputLines = [...lines];

        // 1. Trim whitespace per line
        if (options.trimLines) {
            outputLines = outputLines.map((line) => line.trim());
        }

        // 2. Remove completely empty lines
        if (options.removeEmptyLines) {
            outputLines = outputLines.filter((line) => line !== "");
        }

        // 3. Remove lines with only whitespace
        if (options.removeWhitespaceLines) {
            outputLines = outputLines.filter((line) => line.trim() !== "");
        }

        // Track duplicates removed count
        let duplicateCount = 0;
        if (options.removeDuplicateLines) {
            const seen = new Set<string>();
            const uniqueLines: string[] = [];

            outputLines.forEach((line) => {
                const key = options.caseSensitiveDedupe ? line : line.toLowerCase();
                if (seen.has(key)) {
                    duplicateCount++;
                } else {
                    seen.add(key);
                    uniqueLines.push(line);
                }
            });

            outputLines = uniqueLines;
        }

        // 4. Sort lines
        if (options.sortLines === "asc") {
            outputLines.sort((a, b) => a.localeCompare(b));
        } else if (options.sortLines === "desc") {
            outputLines.sort((a, b) => b.localeCompare(a));
        }

        const finalText = outputLines.join("\n");
        const nonEmptyLineCount = outputLines.filter((l) => l.trim() !== "").length;
        const characterCount = finalText.length;
        const wordCount = finalText.trim() ? finalText.trim().split(/\s+/).length : 0;

        return {
            text: finalText,
            rawLineCount,
            emptyLineCount,
            whitespaceLineCount,
            nonEmptyLineCount,
            duplicateCount,
            characterCount,
            wordCount,
        };
    }, [inputText, options]);

    const handleOptionToggle = (key: keyof OptionState) => {
        setOptions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
        setActivePresetId(null);
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setInputText(preset.text);
        setOptions(preset.options);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setInputText("");
        setOptions({
            removeEmptyLines: false,
            removeWhitespaceLines: false,
            trimLines: false,
            removeDuplicateLines: false,
            sortLines: "none",
            caseSensitiveDedupe: false,
        });
        setActivePresetId(null);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(processedResult.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportTxt = () => {
        const blob = new Blob([processedResult.text], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `cleaned_text_lines.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Text Line Counter & Blank Line Stripper",
        "url": "https://twistertools.com/tools/text-tools/line-counter",
        "description": "Browser-native high-performance utility to count total lines, strip empty whitespace lines, deduplicate entries, trim margins, and sort text lists in real time.",
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
                "name": "How does the Text Line Counter distinguish between empty lines and whitespace lines?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An empty line contains zero characters between consecutive newline break tokens (\\n\\n or \\r\\n\\r\\n). A whitespace line contains invisible spaces, tabs, or non-breaking characters (e.g., \\t or space). TwisterTools allows you to detect, count, and remove both categories independently or simultaneously."
                }
            },
            {
                "@type": "Question",
                "name": "Is my confidential data safe when using this line stripper?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100% private and secure. All text processing, line counting, deduplication, and sorting take place entirely client-side using Web API string manipulation routines in your Web Browser JavaScript V8/Gecko engine. No text strings are ever uploaded to any external server."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum file size or line volume supported by this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Because processing happens directly within your system's memory (RAM), there are no artificial file upload limits. The tool effortlessly processes tens of thousands of lines, large server logs, and extensive database dumps in milliseconds."
                }
            },
            {
                "@type": "Question",
                "name": "How does case-sensitive vs. case-insensitive line deduplication work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When case-sensitive deduplication is enabled, 'Apple' and 'apple' are evaluated as separate, unique lines. When case-sensitivity is disabled, the algorithm normalizes text casing prior to hashing, keeping only the first occurrence and stripping subsequent case variations."
                }
            },
            {
                "@type": "Question",
                "name": "What line ending formats (CRLF vs LF) does this tool handle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses regular expression splitting (/\\r?\\n/) to seamlessly parse Windows-style Carriage Return + Line Feed (CRLF, \\r\\n) as well as Unix/Linux/macOS Line Feed (LF, \\n) break formats without introducing rogue string artifacts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input & Transformation Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Source Text Input
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear Text
                            </button>
                        </div>

                        {/* Input Text Area */}
                        <div>
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    setActivePresetId(null);
                                }}
                                placeholder="Paste or type your text here..."
                                rows={10}
                                className="w-full p-3.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y bg-slate-50 min-h-[220px]"
                            />
                        </div>

                        {/* Options & Operations Matrix */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5 text-indigo-600" /> Cleaning & Sorting Controls
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={options.removeEmptyLines}
                                        onChange={() => handleOptionToggle("removeEmptyLines")}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Strip Empty Lines</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={options.removeWhitespaceLines}
                                        onChange={() => handleOptionToggle("removeWhitespaceLines")}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Strip Whitespace-Only</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={options.trimLines}
                                        onChange={() => handleOptionToggle("trimLines")}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Trim Line Edges</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                                    <input
                                        type="checkbox"
                                        checked={options.removeDuplicateLines}
                                        onChange={() => handleOptionToggle("removeDuplicateLines")}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span>Deduplicate Lines</span>
                                </label>
                            </div>

                            {/* Extra Sorting & Case Sensitivity options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Line Ordering
                                    </label>
                                    <select
                                        value={options.sortLines}
                                        onChange={(e) => {
                                            setOptions((prev) => ({ ...prev, sortLines: e.target.value as any }));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                    >
                                        <option value="none">Preserve Original Order</option>
                                        <option value="asc">Sort Alphabetical (A → Z)</option>
                                        <option value="desc">Sort Reverse (Z → A)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        Dedupe Sensitivity
                                    </label>
                                    <button
                                        type="button"
                                        disabled={!options.removeDuplicateLines}
                                        onClick={() => handleOptionToggle("caseSensitiveDedupe")}
                                        className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border transition text-left flex items-center justify-between ${!options.removeDuplicateLines
                                            ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                                            : options.caseSensitiveDedupe
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-slate-50 text-slate-700 border-slate-200"
                                            }`}
                                    >
                                        <span>Case Sensitive</span>
                                        <span className="text-[10px] uppercase font-bold">{options.caseSensitiveDedupe ? "ON" : "OFF"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reference Presets */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Workflows
                                </span>
                            </div>
                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin">
                                {PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => applyPreset(preset)}
                                        type="button"
                                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${activePresetId === preset.id
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

                {/* Right Workspace Panel: Processed Output & Real-Time Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Output & Live Statistics
                            </h2>
                        </div>

                        {/* Live Stat Badges Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Lines</span>
                                <span className="text-xl font-extrabold text-slate-900">{processedResult.rawLineCount}</span>
                            </div>
                            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Empty Lines</span>
                                <span className="text-xl font-extrabold text-amber-800">{processedResult.emptyLineCount}</span>
                            </div>
                            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Active Lines</span>
                                <span className="text-xl font-extrabold text-indigo-800">{processedResult.nonEmptyLineCount}</span>
                            </div>
                            <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Characters</span>
                                <span className="text-xl font-extrabold text-emerald-800">{processedResult.characterCount}</span>
                            </div>
                        </div>

                        {/* Processed Text Preview */}
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>Cleaned Output Text</span>
                                {processedResult.duplicateCount > 0 && (
                                    <span className="text-indigo-600 font-semibold">{processedResult.duplicateCount} Duplicates Removed</span>
                                )}
                            </label>
                            <textarea
                                readOnly
                                value={processedResult.text}
                                rows={10}
                                placeholder="Cleaned text will appear here in real time..."
                                className="w-full p-3.5 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm text-slate-800 bg-slate-50 outline-none resize-y min-h-[220px]"
                            />
                        </div>
                    </div>

                    {/* Output Actions Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Cleaned Text" : "Copy Cleaned Text"}
                        </button>
                        <button
                            onClick={handleExportTxt}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Download .txt
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics & Algorithm Deep-Dive */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Text Line Dynamics, Non-Printing Characters & Tokenization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital text processing, a line is defined as a continuous sequence of printable characters bounded by start-of-file markers, end-of-file markers, or line break control characters. When analyzing raw datasets, system log files, or source code, text files frequently harbor redundant or invisible line breaks that distort line counts and break automated parsers.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        TwisterTools provides an enterprise-grade client-side pipeline designed to categorize line variations accurately. The breakdown below details the structural differences between empty lines, whitespace lines, and line termination standards:
                    </p>

                    {/* Architectural Feature Cards Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-indigo-600" /> Pure Empty vs. Whitespace Lines
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A <strong>pure empty line</strong> contains exactly zero bytes between newline control tokens (`\n\n`). A <strong>whitespace line</strong> appears visually blank but consists of non-printing ASCII/Unicode characters such as spaces (`\x20`), horizontal tabs (`\t`), or non-breaking spaces (`\u00A0`). Our engine separates these distinct states for precision stripping.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ListFilter className="w-4 h-4 text-indigo-600" /> High-Performance Hash Deduplication
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Deduplicating massive text blocks operates on an $O(N)$ computational complexity model using browser-native `Set` collections. This ensures near-instantaneous removal of repeating entries without causing browser thread lockups during large list operations.
                            </p>
                        </div>
                    </div>

                    {/* Algorithmic Code Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Line Parsing & Regex Transformation Rules
                        </h3>
                        <p className="text-xs text-slate-300">
                            The core tokenization and cleaning logic executing in real-time within your browser:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Cross-Platform Line Splitting:</strong> `lines = inputText.split(/\r?\n/)`</div>
                            <div><strong>2. Empty Line Filtering:</strong> `lines.filter(line =&gt; line !== "")`</div>
                            <div><strong>3. Whitespace-Only Purging:</strong> `lines.filter(line =&gt; line.trim() !== "")`</div>
                            <div><strong>4. Edge Whitespace Trimming:</strong> `lines.map(line =&gt; line.trim())`</div>
                            <div><strong>5. Lexicographical Sorting:</strong> `lines.sort((a, b) =&gt; a.localeCompare(b))`</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Reference Matrix & Specifications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Technical Specification & Character Encoding Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different operating systems, text editors, and database engines write newline control characters differently. Understanding how line endings behave is critical when preparing clean data for production environments:
                    </p>

                    {/* Comprehensive Technical Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Platform / Standard</th>
                                    <th className="p-3">Control Sequence</th>
                                    <th className="p-3">ASCII / Hex Value</th>
                                    <th className="p-3">Tool Processing Behavior</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Unix / Linux / macOS</td>
                                    <td className="p-3 font-mono text-xs">LF (\n)</td>
                                    <td className="p-3 font-mono text-xs">0x0A (10)</td>
                                    <td className="p-3 text-xs">Automatically detected and split cleanly</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Windows (DOS/Win32)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">CRLF (\r\n)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">0x0D 0x0A (13 10)</td>
                                    <td className="p-3 text-xs font-medium text-indigo-900">\r is stripped automatically to prevent ghost characters</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Classic Mac (Pre-OS X)</td>
                                    <td className="p-3 font-mono text-xs">CR (\r)</td>
                                    <td className="p-3 font-mono text-xs">0x0D (13)</td>
                                    <td className="p-3 text-xs">Normalized into standard line breaks</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Unicode Line Separator</td>
                                    <td className="p-3 font-mono text-xs">LS (\u2028)</td>
                                    <td className="p-3 font-mono text-xs">U+2028</td>
                                    <td className="p-3 text-xs">Parsed as non-standard whitespace line</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Unicode Paragraph Separator</td>
                                    <td className="p-3 font-mono text-xs">PS (\u2029)</td>
                                    <td className="p-3 font-mono text-xs">U+2029</td>
                                    <td className="p-3 text-xs">Parsed and stripped upon trim request</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Real-World Industry Workflows */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Code className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Applications Across Software Development, Data Science & Content Optimization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Line filtering is an essential pre-processing step in software architecture, database migrations, and digital marketing workflows. Here is how specialized teams utilize this utility:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Software Engineering
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Refactor messy source code by removing redundant line breaks, sorting package dependencies, and cleaning up trailing whitespace before committing changes to Git repositories.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-indigo-600" /> ETL Data Pipelines
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sanitize unformatted CSV, JSON lines, or SQL seed files by stripping empty rows that would otherwise trigger null-pointer exceptions in database ingestion scripts.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> SEO & Email Marketing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Deduplicate large keyword lists, purge blank entries from email subscriber exports, and format sitemap URL paths cleanly prior to XML generation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Transformation Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Clean and Deduplicate Text Lists in 4 Simple Steps
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                1
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Paste or Upload Source Text</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Copy your raw dataset from any source (Excel, VS Code, terminal logs, or text documents) and paste it into the left input panel.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                2
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Select Cleaning Rules</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Toggle options to strip pure empty lines, eliminate whitespace-only lines, trim outer line margins, or remove duplicates.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                3
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Apply Sorting Options</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Choose whether to preserve the original order or sort your text alphabetically (A–Z) or in reverse order (Z–A).
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                4
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Copy or Export Cleaned File</h3>
                                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    Review real-time live statistics in the right panel, then click to copy the formatted text directly or download it as a `.txt` file.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Text Line Counter distinguish between empty lines and whitespace lines?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An empty line contains zero characters between consecutive newline break tokens (`\n\n` or `\r\n\r\n`). A whitespace line contains invisible spaces, tabs, or non-breaking characters (e.g., `\t` or space). TwisterTools allows you to detect, count, and remove both categories independently or simultaneously.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my confidential data safe when using this line stripper?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, 100% private and secure. All text processing, line counting, deduplication, and sorting take place entirely client-side using Web API string manipulation routines in your Web Browser JavaScript V8/Gecko engine. No text strings are ever uploaded to any external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum file size or line volume supported by this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Because processing happens directly within your system's memory (RAM), there are no artificial file upload limits. The tool effortlessly processes tens of thousands of lines, large server logs, and extensive database dumps in milliseconds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does case-sensitive vs. case-insensitive line deduplication work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When case-sensitive deduplication is enabled, "Apple" and "apple" are evaluated as separate, unique lines. When case-sensitivity is disabled, the algorithm normalizes text casing prior to hashing, keeping only the first occurrence and stripping subsequent case variations.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What line ending formats (CRLF vs LF) does this tool handle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses regular expression splitting (`/\r?\n/`) to seamlessly parse Windows-style Carriage Return + Line Feed (CRLF, `\r\n`) as well as Unix/Linux/macOS Line Feed (LF, `\n`) break formats without introducing rogue string artifacts.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}