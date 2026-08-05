"use client";

import React, { useState, useMemo } from "react";
import {
    ArrowUpDown,
    Copy,
    Check,
    Download,
    Trash2,
    RotateCcw,
    Sparkles,
    FileText,
    HelpCircle,
    Sliders,
    Zap,
    List,
    Filter,
    ShieldCheck,
    CheckCircle2,
    BookOpen,
    Cpu,
    Terminal,
    Code,
    Layers,
    Binary
} from "lucide-react";

type SortOrder = "asc" | "desc" | "length-asc" | "length-desc" | "reverse" | "shuffle";

interface Preset {
    id: string;
    label: string;
    description: string;
    content: string;
}

const SAMPLE_PRESETS: Preset[] = [
    {
        id: "fruits",
        label: "Fruit List",
        description: "Unsorted mixed list",
        content: "Banana\nApple\nCherry\nElderberry\nDate\nFig\nGrape"
    },
    {
        id: "emails-duplicates",
        label: "Emails with Duplicates",
        description: "Contains duplicates and trailing spaces",
        content: "user@example.com \nalice@domain.com\nbob@domain.com\nalice@domain.com\nCharlie@Domain.com\n user@example.com"
    },
    {
        id: "numbers",
        label: "Numeric Values",
        description: "Unsorted integers and decimals",
        content: "100\n2\n15\n1\n20.5\n3"
    }
];

export default function LineSorter() {
    // Input/Output State
    const [inputText, setInputText] = useState<string>(SAMPLE_PRESETS[0].content);

    // Sorting & Processing Controls
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [naturalSort, setNaturalSort] = useState<boolean>(true);
    const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
    const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
    const [removeEmptyLines, setRemoveEmptyLines] = useState<boolean>(true);
    const [prefixText, setPrefixText] = useState<string>("");
    const [suffixText, setSuffixText] = useState<string>("");

    // UI Feedback
    const [copied, setCopied] = useState<boolean>(false);

    // Seed state for repeatable shuffling
    const [shuffleSeed, setShuffleSeed] = useState<number>(1);

    // Compute original line count metrics
    const originalMetrics = useMemo(() => {
        const rawLines = inputText.split(/\r?\n/);
        return {
            totalLines: inputText ? rawLines.length : 0,
            characters: inputText.length,
        };
    }, [inputText]);

    // Perform processing and sorting
    const processedText = useMemo(() => {
        if (!inputText) return "";

        let lines = inputText.split(/\r?\n/);

        // 1. Trim whitespace
        if (trimWhitespace) {
            lines = lines.map((line) => line.trim());
        }

        // 2. Remove empty lines
        if (removeEmptyLines) {
            lines = lines.filter((line) => line.length > 0);
        }

        // 3. Remove duplicates
        if (removeDuplicates) {
            if (caseSensitive) {
                lines = Array.from(new Set(lines));
            } else {
                const seen = new Set<string>();
                lines = lines.filter((line) => {
                    const lower = line.toLowerCase();
                    if (seen.has(lower)) return false;
                    seen.add(lower);
                    return true;
                });
            }
        }

        // 4. Sort lines
        const arrayToSort = [...lines];

        if (sortOrder === "asc" || sortOrder === "desc") {
            const direction = sortOrder === "asc" ? 1 : -1;

            arrayToSort.sort((a, b) => {
                let valA = caseSensitive ? a : a.toLowerCase();
                let valB = caseSensitive ? b : b.toLowerCase();

                if (naturalSort) {
                    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: caseSensitive ? "variant" : "base" }) * direction;
                }
                return valA.localeCompare(valB, undefined, { sensitivity: caseSensitive ? "variant" : "base" }) * direction;
            });
        } else if (sortOrder === "length-asc") {
            arrayToSort.sort((a, b) => a.length - b.length || a.localeCompare(b));
        } else if (sortOrder === "length-desc") {
            arrayToSort.sort((a, b) => b.length - a.length || a.localeCompare(b));
        } else if (sortOrder === "reverse") {
            arrayToSort.reverse();
        } else if (sortOrder === "shuffle") {
            // Simple deterministic shuffle using seed
            let seed = shuffleSeed;
            const pseudoRandom = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            for (let i = arrayToSort.length - 1; i > 0; i--) {
                const j = Math.floor(pseudoRandom() * (i + 1));
                [arrayToSort[i], arrayToSort[j]] = [arrayToSort[j], arrayToSort[i]];
            }
        }

        // 5. Apply Prefix and Suffix
        if (prefixText || suffixText) {
            return arrayToSort.map((line) => `${prefixText}${line}${suffixText}`).join("\n");
        }

        return arrayToSort.join("\n");
    }, [
        inputText,
        sortOrder,
        caseSensitive,
        naturalSort,
        removeDuplicates,
        trimWhitespace,
        removeEmptyLines,
        prefixText,
        suffixText,
        shuffleSeed
    ]);

    // Computed metrics for processed text
    const processedMetrics = useMemo(() => {
        const lines = processedText ? processedText.split("\n") : [];
        return {
            totalLines: processedText ? lines.length : 0,
            characters: processedText.length,
            linesRemoved: originalMetrics.totalLines - lines.length
        };
    }, [processedText, originalMetrics.totalLines]);

    const handleCopy = () => {
        if (!processedText) return;
        navigator.clipboard.writeText(processedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!processedText) return;
        const blob = new Blob([processedText], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "sorted_lines.txt");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setInputText("");
    };

    const handleShuffleAgain = () => {
        setSortOrder("shuffle");
        setShuffleSeed((prev) => prev + 1);
    };

    // Expanded Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Line Alphabetizer & Sort Suite",
        "url": "https://twistertools.com/tools/text-tools/line-sorter",
        "description": "Enterprise-grade online line sorter and text alphabetizer. Instantly deduplicate lines, sort numerically with natural ordering, reverse lists, trim whitespace, and format line items with client-side privacy.",
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
                "name": "How does natural numerical sorting differ from traditional ASCII sorting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard ASCII sorting evaluates text character-by-character based on character codes, placing 'file10.txt' before 'file2.txt'. Natural numerical sorting parses embedded numbers as multi-digit numeric quantities, correctly ordering 'file2.txt' before 'file10.txt'."
                }
            },
            {
                "@type": "Question",
                "name": "Is my confidential list or data safe when using this sorter?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Processing takes place 100% locally in your web browser using client-side JavaScript execution. No text strings, server calls, or telemetry data are ever transmitted to external servers."
                }
            },
            {
                "@type": "Question",
                "name": "Can I remove duplicate lines case-insensitively?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When 'Case-Sensitive Sorting' is unchecked and 'Deduplicate Lines' is active, entries like 'Admin' and 'admin' are treated as identical duplicates and consolidated down to a single line."
                }
            },
            {
                "@type": "Question",
                "name": "How do I add quotation marks or bullets to every sorted line?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use the Prefix and Suffix input fields inside the control panel. Entering a double quote (\") in both fields automatically wraps each sorted line in quotes, ideal for formatting SQL queries or JSON arrays."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum line threshold for this online alphabetizer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Because the tool utilizes optimized V8 JavaScript engine memory structures, it easily processes, sorts, and deduplicates datasets containing over 100,000 lines in fractions of a second."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[600px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Source Text Lines
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleClear}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Clear
                                </button>
                            </div>
                        </div>

                        {/* Presets Row */}
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Samples
                            </span>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                {SAMPLE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setInputText(preset.content)}
                                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium transition border border-slate-200 whitespace-nowrap"
                                        title={preset.description}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Text Area */}
                        <div className="relative">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Paste or type text lines here..."
                                className="w-full h-56 p-3.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-y transition text-slate-800"
                            />
                        </div>

                        {/* Sorting Options & Rules */}
                        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Sorting Mode
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSortOrder("asc")}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition ${sortOrder === "asc" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    A → Z (Asc)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortOrder("desc")}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition ${sortOrder === "desc" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Z → A (Desc)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortOrder("length-asc")}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition ${sortOrder === "length-asc" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Length (Short→Long)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortOrder("length-desc")}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition ${sortOrder === "length-desc" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Length (Long→Short)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSortOrder("reverse")}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition ${sortOrder === "reverse" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Reverse Lines
                                </button>
                                <button
                                    type="button"
                                    onClick={handleShuffleAgain}
                                    className={`py-1.5 px-2.5 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 ${sortOrder === "shuffle" ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    <Zap className="w-3 h-3" /> Random Shuffle
                                </button>
                            </div>

                            {/* Checkbox Toggles */}
                            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={removeDuplicates}
                                        onChange={(e) => setRemoveDuplicates(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Deduplicate Lines
                                </label>
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={naturalSort}
                                        onChange={(e) => setNaturalSort(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Natural Sort (1, 2, 10)
                                </label>
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={trimWhitespace}
                                        onChange={(e) => setTrimWhitespace(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Trim Space Surrounding Lines
                                </label>
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={removeEmptyLines}
                                        onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Remove Empty Blank Lines
                                </label>
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => setCaseSensitive(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    Case-Sensitive Sorting
                                </label>
                            </div>

                            {/* Prefix / Suffix Section */}
                            <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Prefix Each Line</label>
                                    <input
                                        type="text"
                                        value={prefixText}
                                        onChange={(e) => setPrefixText(e.target.value)}
                                        placeholder="e.g. - "
                                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Suffix Each Line</label>
                                    <input
                                        type="text"
                                        value={suffixText}
                                        onChange={(e) => setSuffixText(e.target.value)}
                                        placeholder="e.g. ,"
                                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Footer Metrics */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Original Lines: <strong className="text-slate-800">{originalMetrics.totalLines}</strong></span>
                        <span>Original Chars: <strong className="text-slate-800">{originalMetrics.characters}</strong></span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-h-[600px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                                <List className="w-4 h-4 text-indigo-600" />
                                Sorted Output
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    disabled={!processedText}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs disabled:opacity-50"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy Result"}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={!processedText}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                            </div>
                        </div>

                        {/* Result Output Textarea */}
                        <div className="relative">
                            <textarea
                                readOnly
                                value={processedText}
                                placeholder="Sorted output will appear here automatically..."
                                className="w-full h-[380px] p-3.5 text-sm font-mono bg-slate-900 text-indigo-100 border border-slate-800 rounded-xl outline-none resize-y transition"
                            />
                        </div>
                    </div>

                    {/* Right Output Metrics Bar */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-center text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Final Lines</span>
                            <strong className="text-slate-900 text-sm">{processedMetrics.totalLines}</strong>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Lines Removed</span>
                            <strong className="text-emerald-600 text-sm">{processedMetrics.linesRemoved}</strong>
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Final Chars</span>
                            <strong className="text-slate-900 text-sm">{processedMetrics.characters}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Technical Explanation & Natural Sorting Engine */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Line Alphabetization & Natural Sorting Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Line Alphabetizer & Sort Suite</strong> provides a browser-native text processing engine designed for software engineers, data analysts, database administrators, and content editors. Whether organizing raw server log entries, consolidating duplicate email lists, or ordering code variables, this utility combines high-speed sorting algorithms with real-time text transformation controls.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Traditional sorting routines in standard text editors rely strictly on ASCII or Unicode character code values. Under standard ASCII evaluation, strings containing numbers sort unpredictably (for example, placing <code>item10.txt</code> before <code>item2.txt</code> because the character <code>"1"</code> precedes <code>"2"</code>). Our utility implements an integrated <strong>Natural Sorting Engine</strong> using JavaScript's <code>Intl.Collator</code> API, which intelligently parses multi-digit numeric segments into coherent numbers while evaluating surrounding text alphabetically.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Filter className="w-4 h-4 text-indigo-600" /> Deduplication & Space Normalization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Dirty datasets frequently harbor invisible trailing spaces, carriage returns, and duplicate entries. The deduplication layer eliminates redundant items (case-sensitively or case-insensitively) while stripping excess whitespace before sorting occurs.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Local Client-Side Execution Guarantee
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Data privacy is paramount. All string parsing, regex filtering, and sorting routines execute 100% locally within your client browser memory using JavaScript Web APIs. Confidential customer records, API keys, or proprietary code lists never leave your device or travel over HTTP connections.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Visual Transformation Benchmarks & Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Binary className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Sorting Algorithm Benchmark Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare how different processing rules transform messy input data into clean, structured outputs:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1 */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Natural Numerical Sort</span>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Natural Active</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="block text-[10px] font-sans font-bold text-slate-400 mb-1">Standard ASCII Input:</span>
                                    <div className="text-rose-600 space-y-0.5">
                                        <div>release-v10.0</div>
                                        <div>release-v2.0</div>
                                        <div>release-v1.5</div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                    <span className="block text-[10px] font-sans font-bold text-indigo-400 mb-1">Natural Sorted Output:</span>
                                    <div className="text-emerald-400 space-y-0.5">
                                        <div>release-v1.5</div>
                                        <div>release-v2.0</div>
                                        <div>release-v10.0</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Example 2 */}
                        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Deduplication & Prefix Formatting</span>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Formatted</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                                    <span className="block text-[10px] font-sans font-bold text-slate-400 mb-1">Dirty Input:</span>
                                    <div className="text-rose-600 space-y-0.5">
                                        <div>admin</div>
                                        <div> user </div>
                                        <div>admin</div>
                                    </div>
                                </div>
                                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                                    <span className="block text-[10px] font-sans font-bold text-indigo-400 mb-1">Clean Output (Prefix: `"`, Suffix: `",`):</span>
                                    <div className="text-emerald-400 space-y-0.5">
                                        <div>&quot;admin&quot;,</div>
                                        <div>&quot;user&quot;,</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Feature Matrix Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Sorting Modes Comparison & Technical Specifications
                        </h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Sorting Mode</th>
                                    <th className="p-3">Algorithm Mechanics</th>
                                    <th className="p-3">Primary Professional Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">A → Z (Alphabetical)</td>
                                    <td className="p-3">Lexicographical ascending evaluation (Unicode locale comparison)</td>
                                    <td className="p-3">Alphabetizing glossaries, user rosters, CSV columns</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Z → A (Reverse Alphabetic)</td>
                                    <td className="p-3">Lexicographical descending evaluation</td>
                                    <td className="p-3">Prioritizing inverse alphabetical records, ranking lists</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Length (Short → Long)</td>
                                    <td className="p-3">Evaluates total string <code>.length</code> value in ascending order</td>
                                    <td className="p-3">SEO keyword research, domain length analysis</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Length (Long → Short)</td>
                                    <td className="p-3">Evaluates total string <code>.length</code> value in descending order</td>
                                    <td className="p-3">Identifying long tail phrases, debugging bloated log lines</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Natural Numerical</td>
                                    <td className="p-3">Parses embedded numbers as multi-digit numeric quantities</td>
                                    <td className="p-3">Version tags, numbered log files, invoice references</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">Random Shuffle</td>
                                    <td className="p-3">Fisher-Yates style deterministic pseudo-random shuffling algorithm</td>
                                    <td className="p-3">A/B testing samples, randomized raffles, task assignments</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Detailed Workflow Step-by-Step */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Data Sorting & Cleaning Pipeline
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-sm">Paste Input Data</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Copy line-delimited text, lists, or code from spreadsheets, log files, or code editors into the source panel.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-sm">Select Sort Direction</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Choose A–Z, Z–A, character length ordering, or random shuffle according to your analytical goals.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-sm">Apply Filters & Padding</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enable deduplication, trim surrounding whitespace, strip empty lines, or add custom line prefixes and suffixes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-sm">Copy or Export</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Instantly copy formatted results to your clipboard or download the output directly as a clean <code>.txt</code> file.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                How does natural numerical sorting differ from traditional ASCII sorting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard ASCII sorting evaluates text character-by-character based on character codes, placing <code>file10.txt</code> before <code>file2.txt</code>. Natural numerical sorting parses embedded numbers as multi-digit numeric quantities, correctly ordering <code>file2.txt</code> before <code>file10.txt</code>.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my confidential list or data safe when using this sorter?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Processing takes place 100% locally in your web browser using client-side JavaScript execution. No text strings, server calls, or telemetry data are ever transmitted to external servers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I remove duplicate lines case-insensitively?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When &quot;Case-Sensitive Sorting&quot; is unchecked and &quot;Deduplicate Lines&quot; is active, entries like &quot;Admin&quot; and &quot;admin&quot; are treated as identical duplicates and consolidated down to a single line.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I add quotation marks or bullets to every sorted line?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Use the Prefix and Suffix input fields inside the control panel. Entering a double quote (<code>&quot;</code>) in both fields automatically wraps each sorted line in quotes, ideal for formatting SQL queries or JSON arrays.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum line threshold for this online alphabetizer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Because the tool utilizes optimized V8 JavaScript engine memory structures, it easily processes, sorts, and deduplicates datasets containing over 100,000 lines in fractions of a second.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}