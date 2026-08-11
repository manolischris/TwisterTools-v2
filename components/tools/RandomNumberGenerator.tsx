"use client";

import React, { useState, useMemo } from "react";
import {
    Dices,
    RotateCw,
    Copy,
    Check,
    Download,
    BarChart3,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Sparkles,
    Calculator,
    TrendingUp,
    Layers,
    List,
    RefreshCw,
    BrainCircuit,
    Lightbulb,
    FileText,
    ArrowUpDown,
    CheckSquare,
    Square
} from "lucide-react";

interface GenerationHistoryRecord {
    id: number;
    timestamp: string;
    min: number;
    max: number;
    count: number;
    allowDuplicates: boolean;
    sortOption: "none" | "asc" | "desc";
    results: number[];
}

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function RandomNumberGenerator() {
    // Range & Output Configuration States
    const [min, setMin] = useState<number>(1);
    const [max, setMax] = useState<number>(100);
    const [count, setCount] = useState<number>(1);
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(true);
    const [sortOption, setSortOption] = useState<"none" | "asc" | "desc">("none");
    const [delimiter, setDelimiter] = useState<"comma" | "space" | "newline" | "tab">("comma");

    // Execution States
    const [currentResults, setCurrentResults] = useState<number[]>([]);
    const [history, setHistory] = useState<GenerationHistoryRecord[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"results" | "history">("results");
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Cryptographically Secure Uniform Random Generator within Range [min, max]
    const generateRandomInt = (minVal: number, maxVal: number): number => {
        const range = maxVal - minVal + 1;
        const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
        const maxValid = Math.floor(Math.pow(256, bytesNeeded) / range) * range;
        const u8 = new Uint8Array(bytesNeeded);

        while (true) {
            crypto.getRandomValues(u8);
            let val = 0;
            for (let i = 0; i < bytesNeeded; i++) {
                val = (val << 8) + u8[i];
            }
            if (val < maxValid) {
                return minVal + (val % range);
            }
        }
    };

    // Main Generation Trigger
    const handleGenerate = () => {
        setErrorMessage("");

        if (min >= max) {
            setErrorMessage("Minimum bound must be strictly less than maximum bound.");
            return;
        }

        const rangeSize = max - min + 1;
        if (!allowDuplicates && count > rangeSize) {
            setErrorMessage(`Cannot generate ${count} unique numbers from a range of only ${rangeSize} values.`);
            return;
        }

        const results: number[] = [];

        if (!allowDuplicates) {
            const pool = new Set<number>();
            while (pool.size < count) {
                pool.add(generateRandomInt(min, max));
            }
            results.push(...Array.from(pool));
        } else {
            for (let i = 0; i < count; i++) {
                results.push(generateRandomInt(min, max));
            }
        }

        // Apply Sorting
        if (sortOption === "asc") {
            results.sort((a, b) => a - b);
        } else if (sortOption === "desc") {
            results.sort((a, b) => b - a);
        }

        setCurrentResults(results);

        // Add to Execution History Log
        const newRecord: GenerationHistoryRecord = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            min,
            max,
            count,
            allowDuplicates,
            sortOption,
            results,
        };

        setHistory((prev) => [newRecord, ...prev].slice(0, 50));
    };

    // Reset Engine State
    const handleReset = () => {
        setMin(1);
        setMax(100);
        setCount(1);
        setAllowDuplicates(true);
        setSortOption("none");
        setDelimiter("comma");
        setCurrentResults([]);
        setHistory([]);
        setErrorMessage("");
    };

    // Format Current Output
    const formattedResultsText = useMemo(() => {
        if (currentResults.length === 0) return "";
        switch (delimiter) {
            case "space":
                return currentResults.join(" ");
            case "newline":
                return currentResults.join("\n");
            case "tab":
                return currentResults.join("\t");
            case "comma":
            default:
                return currentResults.join(", ");
        }
    }, [currentResults, delimiter]);

    // Descriptive Summary Statistics of Current Sample Batch
    const stats = useMemo(() => {
        if (currentResults.length === 0) {
            return { sum: 0, mean: 0, median: 0, minVal: 0, maxVal: 0, evenCount: 0, oddCount: 0 };
        }

        const sum = currentResults.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / currentResults.length;
        const sorted = [...currentResults].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        const minVal = sorted[0];
        const maxVal = sorted[sorted.length - 1];
        const evenCount = currentResults.filter((n) => n % 2 === 0).length;
        const oddCount = currentResults.length - evenCount;

        return { sum, mean, median, minVal, maxVal, evenCount, oddCount };
    }, [currentResults]);

    const handleCopy = () => {
        if (!formattedResultsText) return;
        navigator.clipboard.writeText(formattedResultsText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportTXT = () => {
        if (!formattedResultsText) return;
        const blob = new Blob([formattedResultsText], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `random_numbers_${min}_to_${max}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Number Generator & Range Picker",
        "url": "https://twistertools.com/tools/random-tools/random-number-generator",
        "description": "Generate cryptographically secure random numbers within customizable ranges. Supports unique non-repeating picks, custom sorting, delimiter options, and statistical batch analyses.",
        "applicationCategory": "EducationalApplication",
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
                "name": "How does this random number generator guarantee true randomness?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This application utilizes the Web Crypto API (crypto.getRandomValues) rather than standard Math.random(). By retrieving raw hardware entropy from your browser, it eliminates algorithmic predictability and guarantees true uniform distribution across specified bounds."
                }
            },
            {
                "@type": "Question",
                "name": "Can I generate unique random numbers with no duplicates?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. By unchecking the 'Allow Duplicates' setting, the algorithm enforces set uniqueness across generated values, provided the total requested count does not exceed the total available integers in the selected range."
                }
            },
            {
                "@type": "Question",
                "name": "What is modulo bias in random number generation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modulo bias occurs when mapping a binary random integer range (e.g., 0 to 2^32 - 1) to a target interval using simple modulus arithmetic when the range length is not a power of two. Our generator implements rejection sampling to completely eliminate modulo bias."
                }
            },
            {
                "@type": "Question",
                "name": "Is there a limit on how many numbers I can generate at once?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can generate up to 10,000 random numbers in a single batch directly inside your local browser memory thread instantly."
                }
            },
            {
                "@type": "Question",
                "name": "How are custom delimiters formatted for export?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can format your generated number sets using commas, spaces, line breaks (newlines), or tab characters for instant copy-pasting into spreadsheets or CSV documents."
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
                {/* Left Workspace Panel: Config Inputs & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Range & Batch Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Form
                            </button>
                        </div>

                        {/* Error Message Alert */}
                        {errorMessage && (
                            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                                {errorMessage}
                            </div>
                        )}

                        {/* Min / Max Inputs Row */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Minimum (Lower Bound)
                                </label>
                                <input
                                    type="number"
                                    value={min === 0 ? "" : min}
                                    onChange={(e) => handleNumberInput(e, setMin)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Maximum (Upper Bound)
                                </label>
                                <input
                                    type="number"
                                    value={max === 0 ? "" : max}
                                    onChange={(e) => handleNumberInput(e, setMax)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition"
                                />
                            </div>
                        </div>

                        {/* Batch Count Input */}
                        <div className="space-y-1.5 mb-5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Quantity to Generate (Count)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10000"
                                value={count === 0 ? "" : count}
                                onChange={(e) => handleNumberInput(e, setCount)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 focus:bg-white transition"
                            />
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[1, 5, 10, 50, 100].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setCount(preset)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${count === preset
                                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {preset} {preset === 1 ? "Number" : "Numbers"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Primary Execute Button */}
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="w-full py-3.5 px-4 mb-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                            <RotateCw className="w-5 h-5" />
                            Generate Random {count > 1 ? `${count} Numbers` : "Number"}
                        </button>

                        {/* Options & Filters Grid */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            {/* Duplicates Toggle */}
                            <button
                                type="button"
                                onClick={() => setAllowDuplicates(!allowDuplicates)}
                                className="flex items-center gap-3 text-left w-full cursor-pointer select-none"
                            >
                                <div className="text-indigo-600">
                                    {allowDuplicates ? (
                                        <CheckSquare className="w-5 h-5" />
                                    ) : (
                                        <Square className="w-5 h-5 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <span className="block text-xs font-bold text-slate-900">Allow Duplicates</span>
                                    <span className="block text-[11px] text-slate-500">
                                        {allowDuplicates
                                            ? "Numbers can repeat in the output set."
                                            : "Enforce unique non-repeating numbers strictly."}
                                    </span>
                                </div>
                            </button>

                            {/* Sorting Selection */}
                            <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" /> Order Sorting
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["none", "asc", "desc"] as const).map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setSortOption(opt)}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer capitalize ${sortOption === opt
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {opt === "none" ? "Unsorted" : opt === "asc" ? "Ascending" : "Descending"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Delimiter Selection */}
                            <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <List className="w-3.5 h-3.5 text-indigo-600" /> Output Delimiter
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {(["comma", "space", "newline", "tab"] as const).map((del) => (
                                        <button
                                            key={del}
                                            type="button"
                                            onClick={() => setDelimiter(del)}
                                            className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer capitalize ${delimiter === del
                                                ? "bg-slate-900 text-white border-slate-900"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {del}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Web Crypto Entropy
                        </span>
                        <span>Rejection Sampling Enabled</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Generated Outputs & Batch Stats */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Output Results & Log
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("results")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "results" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Results ({currentResults.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    History ({history.length})
                                </button>
                            </div>
                        </div>

                        {activeTab === "results" ? (
                            <div className="space-y-4">
                                {/* Display Primary Value Box (Single or Grid View) */}
                                {currentResults.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                        <Dices className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-600">No Numbers Generated Yet</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Configure your min/max bounds and click Generate.
                                        </p>
                                    </div>
                                ) : currentResults.length === 1 ? (
                                    <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                                            Generated Result
                                        </span>
                                        <span className="text-6xl font-black text-indigo-600 tracking-tight">
                                            {currentResults[0].toLocaleString()}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Formatted Output Text
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {currentResults.length} Items
                                            </span>
                                        </div>
                                        <textarea
                                            readOnly
                                            value={formattedResultsText}
                                            rows={6}
                                            className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs sm:text-sm focus:outline-none resize-none"
                                        />
                                    </div>
                                )}

                                {/* Statistical Analysis Metric Cards */}
                                {currentResults.length > 1 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-[11px] font-bold text-slate-400 block">Mean</span>
                                            <span className="text-base font-extrabold text-slate-900">
                                                {stats.mean.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-[11px] font-bold text-slate-400 block">Median</span>
                                            <span className="text-base font-extrabold text-slate-900">
                                                {stats.median}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-[11px] font-bold text-slate-400 block">Min / Max</span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {stats.minVal} / {stats.maxVal}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                            <span className="text-[11px] font-bold text-slate-400 block">Even / Odd</span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {stats.evenCount} / {stats.oddCount}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* History Log List Tab */
                            <div className="max-h-[320px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {history.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-400">No prior generations recorded.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="p-3 text-xs space-y-1 hover:bg-slate-50">
                                            <div className="flex items-center justify-between text-slate-500 font-medium">
                                                <span>Range: [{item.min}, {item.max}]</span>
                                                <span>{item.timestamp}</span>
                                            </div>
                                            <div className="font-mono text-slate-900 truncate font-semibold">
                                                {item.results.join(", ")}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={currentResults.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Results"}
                        </button>
                        <button
                            type="button"
                            onClick={handleExportTXT}
                            disabled={currentResults.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export TXT
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Cryptographic Randomness vs Pseudo-Random Algorithms */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cryptographic Randomness vs. Pseudo-Random Number Generators (PRNGs)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In standard web applications, random numbers are generated using deterministic software routines like JavaScript's native <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">Math.random()</code>. These standard engines are classified as <strong>Pseudo-Random Number Generators (PRNGs)</strong>. While fast, PRNGs rely on mathematical formulas initialized by an internal state seed (typically the system microsecond clock). Given knowledge of the seed or a sufficiently long output sequence, future values can be predicted with 100% mathematical certainty.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <BrainCircuit className="w-4 h-4 text-indigo-600" /> Standard PRNG (Math.random)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Uses deterministic algorithms (e.g., xorshift128+ in V8). Suitable for casual animations, but vulnerable to pattern analysis and period repetition over large sample iterations.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> CSPRNG (Web Crypto API)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Leverages hardware entropy (e.g., thermal noise, CPU timing jitter). Provides true cryptographic unpredictability, ensuring every integer in your chosen range has an identical theoretical probability.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Rejection Sampling & Modulo Bias Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Eliminating Modulo Bias via Rejection Sampling
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A common flaw in custom range generators is naive modulo arithmetic: mapping a raw 32-bit unsigned integer $R \in [0, 2^{32}-1]$ to a target range $[0, M-1]$ using $R \pmod M$. When the total state space $2^{32}$ is not evenly divisible by $M$, lower numbers in the range receive a subtly higher statistical probability of selection—a flaw known as <strong>modulo bias</strong>.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To eliminate modulo bias entirely, our generator implements <strong>rejection sampling</strong>. The engine establishes an exact threshold cutoff $T$:
                    </p>

                    <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                        T = floor(2^32 / rangeSize) * rangeSize
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Any randomly drawn byte sequence evaluating to a value equal to or greater than $T$ is discarded immediately, and a fresh draw is executed. This guarantees absolute mathematical uniformity across every selected bound.
                    </p>
                </section>

                {/* Card 3: Probability Distribution Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Theoretical Probability Reference Matrix
                        </h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Range Span ($N$)</th>
                                    <th className="p-3">Single Pick Odds ($1/N$)</th>
                                    <th className="p-3">Probability %</th>
                                    <th className="p-3">Entropy (Bits)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 to 2 (Binary)</td>
                                    <td className="p-3">1 in 2</td>
                                    <td className="p-3 font-bold text-indigo-600">50.00%</td>
                                    <td className="p-3 font-mono">1.00 bit</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 to 6 (Standard Die)</td>
                                    <td className="p-3">1 in 6</td>
                                    <td className="p-3 font-bold text-indigo-600">16.67%</td>
                                    <td className="p-3 font-mono">2.58 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 to 10 (Decile)</td>
                                    <td className="p-3">1 in 10</td>
                                    <td className="p-3 font-bold text-indigo-600">10.00%</td>
                                    <td className="p-3 font-mono">3.32 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 to 100 (Percentage)</td>
                                    <td className="p-3">1 in 100</td>
                                    <td className="p-3 font-bold text-indigo-600">1.00%</td>
                                    <td className="p-3 font-mono">6.64 bits</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 to 1,000</td>
                                    <td className="p-3">1 in 1,000</td>
                                    <td className="p-3 font-bold text-indigo-600">0.10%</td>
                                    <td className="p-3 font-mono">9.97 bits</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Practical Use-Cases & Industry Benchmarks */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Use Cases & Application Workflows
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Raffles & Sweepstakes</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Select unique non-repeating winning ticket numbers from a ticket range (e.g., 1 to 5,000) with complete cryptographic auditability.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Data Sampling & Testing</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extract unbiased randomized database row IDs or sample subsets for statistical validation without sorting bias.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Classroom & Group Pickers</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Assign student numbers, tournament seeds, or order sequences fairly without manual paper draws.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
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
                                How does this random number generator guarantee true randomness?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This application utilizes the Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) rather than standard <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>. By retrieving raw hardware entropy from your browser, it eliminates algorithmic predictability and guarantees true uniform distribution across specified bounds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I generate unique random numbers with no duplicates?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. By unchecking the "Allow Duplicates" setting, the algorithm enforces set uniqueness across generated values, provided the total requested count does not exceed the total available integers in the selected range.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is modulo bias in random number generation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modulo bias occurs when mapping a binary random integer range (e.g., 0 to $2^{32}-1$) to a target interval using simple modulus arithmetic when the range length is not a power of two. Our generator implements rejection sampling to completely eliminate modulo bias.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is there a limit on how many numbers I can generate at once?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can generate up to 10,000 random numbers in a single batch directly inside your local browser memory thread instantly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are custom delimiters formatted for export?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can format your generated number sets using commas, spaces, line breaks (newlines), or tab characters for instant copy-pasting into spreadsheets or CSV documents.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}