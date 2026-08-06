"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    BarChart3,
    FileText,
    Copy,
    Check,
    Download,
    RefreshCw,
    Search,
    Filter,
    Layers,
    PieChart,
    HelpCircle,
    BookOpen,
    Sparkles,
    ShieldCheck,
    Calculator,
    Zap,
    Hash,
    AlignLeft,
    Type,
    ArrowUpDown
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    text: string;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "sample-article",
        label: "Sample Article",
        tag: "General English",
        text: "TwisterTools provides enterprise-grade, browser-native web utilities. Speed, security, and developer efficiency are core principles of our platform architecture."
    },
    {
        id: "code-snippet",
        label: "Code Snippet",
        tag: "TypeScript",
        text: "const analyzeFrequency = (text: string) => { return text.split('').reduce((acc, char) => { acc[char] = (acc[char] || 0) + 1; return acc; }, {}); };"
    },
    {
        id: "pangram",
        label: "English Pangram",
        tag: "A-Z Test",
        text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs."
    }
];

type SortKey = "count" | "percentage" | "char";
type SortOrder = "asc" | "desc";

export default function CharacterFrequencyCounter() {
    // Input & Configuration States
    const [inputText, setInputText] = useState<string>(PRESETS[0].text);
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [ignoreSpaces, setIgnoreSpaces] = useState<boolean>(false);
    const [ignorePunctuation, setIgnorePunctuation] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Sort States
    const [sortKey, setSortKey] = useState<SortKey>("count");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("sample-article");
    const exportRef = useRef<HTMLDivElement>(null);

    // Text Sanitization & Transformation
    const processedText = useMemo(() => {
        let text = inputText;
        if (!caseSensitive) {
            text = text.toLowerCase();
        }
        if (ignoreSpaces) {
            text = text.replace(/\s+/g, "");
        }
        if (ignorePunctuation) {
            // Strips standard ASCII and Unicode punctuation
            text = text.replace(/[^\w\s]|_/g, "");
        }
        return text;
    }, [inputText, caseSensitive, ignoreSpaces, ignorePunctuation]);

    // Summary Statistics
    const textStats = useMemo(() => {
        const rawLength = inputText.length;
        const processedLength = processedText.length;
        const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
        const lineCount = inputText ? inputText.split(/\r\n|\r|\n/).length : 0;
        const spaceCount = (inputText.match(/\s/g) || []).length;
        const punctuationCount = (inputText.match(/[^\w\s]|_/g) || []).length;

        return {
            rawLength,
            processedLength,
            wordCount,
            lineCount,
            spaceCount,
            punctuationCount
        };
    }, [inputText, processedText]);

    // Frequency Analysis Computation
    const frequencyData = useMemo(() => {
        if (!processedText) return [];

        const map = new Map<string, number>();
        for (const char of processedText) {
            map.set(char, (map.get(char) || 0) + 1);
        }

        const totalChars = processedText.length;
        const list = Array.from(map.entries()).map(([char, count]) => ({
            char,
            count,
            percentage: totalChars > 0 ? (count / totalChars) * 100 : 0
        }));

        // Filter by Search Query
        const filtered = list.filter((item) => {
            if (!searchQuery) return true;
            if (item.char === " " && "space".includes(searchQuery.toLowerCase())) return true;
            if (item.char === "\n" && "newline".includes(searchQuery.toLowerCase())) return true;
            if (item.char === "\t" && "tab".includes(searchQuery.toLowerCase())) return true;
            return item.char.toLowerCase().includes(searchQuery.toLowerCase());
        });

        // Sorting Logic
        return filtered.sort((a, b) => {
            let mult = sortOrder === "desc" ? -1 : 1;
            if (sortKey === "count" || sortKey === "percentage") {
                return (a.count - b.count) * mult;
            }
            return a.char.localeCompare(b.char) * mult;
        });
    }, [processedText, searchQuery, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    };

    const handleReset = () => {
        setInputText("");
        setCaseSensitive(false);
        setIgnoreSpaces(false);
        setIgnorePunctuation(false);
        setSearchQuery("");
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setInputText(preset.text);
        setActivePresetId(preset.id);
    };

    const handleCopySummary = () => {
        const top5 = frequencyData
            .slice(0, 5)
            .map((item) => {
                const label = item.char === " " ? "[Space]" : item.char === "\n" ? "[Newline]" : item.char;
                return `  - '${label}': ${item.count} (${item.percentage.toFixed(2)}%)`;
            })
            .join("\n");

        const summaryText = `Character Frequency & Density Analysis (TwisterTools):
----------------------------------------
Total Raw Characters: ${textStats.rawLength}
Processed Characters: ${textStats.processedLength}
Total Words: ${textStats.wordCount}
Total Lines: ${textStats.lineCount}
Unique Characters: ${frequencyData.length}
----------------------------------------
Top Character Densities:
${top5 || "  None"}
----------------------------------------
Calculated at twistertools.com/tools/text-tools/character-frequency-counter`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Character", "Display Label", "Frequency Count", "Density Percentage (%)"];
        const rows = frequencyData.map((item) => {
            let label = item.char;
            if (item.char === " ") label = "[Space]";
            else if (item.char === "\n") label = "[Newline]";
            else if (item.char === "\t") label = "[Tab]";

            // Escape quote marks for CSV format integrity
            const escapedChar = item.char === '"' ? '""' : item.char;
            return [`"${escapedChar}"`, `"${label}"`, item.count, item.percentage.toFixed(4)];
        });

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `character_frequency_analysis.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Character Frequency & Density Analyzer",
        "url": "https://twistertools.com/tools/text-tools/character-frequency-counter",
        "description": "Browser-native tool to analyze character frequency, letter occurrence counts, and density percentages in real time.",
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
                "name": "What is character frequency analysis?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Character frequency analysis is the study of the occurrence rates and density percentages of individual letters, numbers, spaces, and symbols within a body of text."
                }
            },
            {
                "@type": "Question",
                "name": "Why is character frequency useful for SEO and copywriting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "SEO specialists and copywriters use frequency statistics to detect unintended keyword or character repetition, optimize title tag lengths, and maintain readability balances."
                }
            },
            {
                "@type": "Question",
                "name": "Is my text uploaded to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates 100% client-side inside your browser. Your input text is processed entirely in memory and never sent across the internet."
                }
            },
            {
                "@type": "Question",
                "name": "What is the most common letter in the English language?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In standard written English, the letter 'E' is statistically the most frequent character, accounting for approximately 12.7% of all occurrences, followed by 'T' and 'A'."
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
                {/* Left Workspace Panel: Input Text & Sanitization Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <AlignLeft className="w-5 h-5 text-indigo-600" />
                                Input Document
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        </div>

                        {/* Textarea Input */}
                        <div className="space-y-2">
                            <textarea
                                value={inputText}
                                onChange={(e) => {
                                    setInputText(e.target.value);
                                    setActivePresetId(null);
                                }}
                                placeholder="Type or paste your content here to analyze character frequencies..."
                                className="w-full h-72 p-4 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50"
                            />
                        </div>

                        {/* Analysis Options & Sanitization Controls */}
                        <div className="mt-5 space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Filter & Normalization Rules
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${caseSensitive ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => setCaseSensitive(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Case Sensitive
                                </label>

                                <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${ignoreSpaces ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={ignoreSpaces}
                                        onChange={(e) => setIgnoreSpaces(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Ignore Spaces
                                </label>

                                <label className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${ignorePunctuation ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={ignorePunctuation}
                                        onChange={(e) => setIgnorePunctuation(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Strip Punctuation
                                </label>
                            </div>
                        </div>

                        {/* Reference Presets */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Test Samples
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Sample Loaded
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                }`}>
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Density Report"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Frequency Results Table & Metric Summaries */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Frequency Metrics
                            </h2>

                            {/* Search Filter input */}
                            <div className="relative w-full sm:w-48">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Filter char..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Top-line KPI Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Raw Chars</span>
                                <span className="text-lg font-extrabold text-slate-900">{textStats.rawLength}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed</span>
                                <span className="text-lg font-extrabold text-indigo-600">{textStats.processedLength}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Words</span>
                                <span className="text-lg font-extrabold text-slate-900">{textStats.wordCount}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique</span>
                                <span className="text-lg font-extrabold text-slate-900">{frequencyData.length}</span>
                            </div>
                        </div>

                        {/* Frequency Data Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-2.5 cursor-pointer hover:bg-slate-200/70 transition" onClick={() => handleSort("char")}>
                                                <div className="flex items-center gap-1">
                                                    Character
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="p-2.5 cursor-pointer hover:bg-slate-200/70 transition" onClick={() => handleSort("count")}>
                                                <div className="flex items-center gap-1">
                                                    Count
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="p-2.5 cursor-pointer hover:bg-slate-200/70 transition" onClick={() => handleSort("percentage")}>
                                                <div className="flex items-center gap-1">
                                                    Density %
                                                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                                                </div>
                                            </th>
                                            <th className="p-2.5 text-right">Visual Scale</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {frequencyData.length > 0 ? (
                                            frequencyData.map((item, idx) => {
                                                let displayChar = item.char;
                                                let badgeClass = "bg-slate-100 text-slate-800 font-mono";

                                                if (item.char === " ") {
                                                    displayChar = "Space";
                                                    badgeClass = "bg-amber-100 text-amber-800 italic";
                                                } else if (item.char === "\n") {
                                                    displayChar = "\\n (Newline)";
                                                    badgeClass = "bg-rose-100 text-rose-800 italic";
                                                } else if (item.char === "\t") {
                                                    displayChar = "\\t (Tab)";
                                                    badgeClass = "bg-purple-100 text-purple-800 italic";
                                                }

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition">
                                                        <td className="p-2.5">
                                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border border-slate-200/60 ${badgeClass}`}>
                                                                {displayChar}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 text-slate-900 font-bold">{item.count}</td>
                                                        <td className="p-2.5 text-indigo-600 font-semibold">{item.percentage.toFixed(2)}%</td>
                                                        <td className="p-2.5">
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-indigo-600 rounded-full"
                                                                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                                    No matching characters found. Type text into the document workspace.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Local Computation
                        </span>
                        <span>Unicode Standard Compliant</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Mechanics & Analytical Standard */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Character Frequency & Letter Density Analysis
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Character frequency analysis evaluates how often specific individual characters, digits, spaces, and punctuation marks appear inside a text document. From cryptographic analysis to copy editing and UI layout tuning, understanding letter density provides critical structural metrics for modern content strategies.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-indigo-600" /> Density Percentages vs Raw Counts
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                While raw character counts reveal absolute volume, density percentages normalize frequency against total document length, allowing accurate comparative analysis across texts of varying lengths.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Filter className="w-4 h-4 text-indigo-600" /> Case Sensitivity & Normalization
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Toggling case sensitivity allows content creators to evaluate upper-to-lower case ratios, ensuring proper capitalization distribution in formal documentation.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Frequency Mathematical Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            Engine formula implemented inside this web utility:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>Character Density (%):</strong> D(c) = ( Occurrences of Character c / Total Processed Characters ) × 100</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Standard English Letter Frequency Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard English Language Letter Frequency Benchmarks
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For reference, standard written English exhibits predictable statistical character frequencies across large text bodies:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Letter</th>
                                    <th className="p-3">Average English Frequency</th>
                                    <th className="p-3">Typical Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1</td>
                                    <td className="p-3 font-bold text-indigo-600">E</td>
                                    <td className="p-3 font-semibold text-slate-900">12.70%</td>
                                    <td className="p-3 text-slate-500">Most common vowel in English prose</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2</td>
                                    <td className="p-3 font-bold text-indigo-600">T</td>
                                    <td className="p-3 font-semibold text-slate-900">9.06%</td>
                                    <td className="p-3 text-slate-500">Most common consonant in English prose</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3</td>
                                    <td className="p-3 font-bold text-indigo-600">A</td>
                                    <td className="p-3 font-semibold text-slate-900">8.17%</td>
                                    <td className="p-3 text-slate-500">Second most common vowel</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4</td>
                                    <td className="p-3 font-bold text-indigo-600">O</td>
                                    <td className="p-3 font-semibold text-slate-900">7.51%</td>
                                    <td className="p-3 text-slate-500">High frequency in prepositions and articles</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">5</td>
                                    <td className="p-3 font-bold text-indigo-600">I</td>
                                    <td className="p-3 font-semibold text-slate-900">6.97%</td>
                                    <td className="p-3 text-slate-500">High frequency in technical copy</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Static FAQ Section */}
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
                                What is character frequency analysis?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Character frequency analysis is the systematic study of occurrence counts and density percentages of individual letters, numbers, spaces, and punctuation symbols within a document.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is character frequency useful for web developers and copywriters?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Developers use character frequency analysis to optimize compression algorithms and layout overflow rules, while copywriters use it to analyze letter density and prevent unintended repetitive patterns.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my text uploaded or stored on any server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates entirely client-side inside your browser. Your input text is processed locally in browser memory and is never transmitted over external networks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the most common letter in written English?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Statistically, the letter 'E' is the most frequent character in general English text, making up roughly 12.7% of all characters, followed by 'T' and 'A'.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}