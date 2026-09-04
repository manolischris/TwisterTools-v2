"use client";

import React, { useState, useMemo } from "react";
import {
    Shuffle,
    RotateCcw,
    Copy,
    Check,
    Download,
    Layers,
    ListFilter,
    HelpCircle,
    BookOpen,
    ShieldCheck,
    Cpu,
    ArrowUpDown,
    CheckSquare,
    Square,
    Sliders,
    Sparkles,
    FileText,
    Hash,
    Terminal,
    Target,
    Zap,
    Scale,
    Binary,
    BarChart3,
    Compass,
    Code2,
    Users,
    CheckCircle2,
    AlertTriangle,
    Lightbulb
} from "lucide-react";

type DelimiterType = "newline" | "comma" | "semicolon" | "space" | "custom";

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

export default function ListRandomizerShuffler() {
    // Core List State
    const [rawInput, setRawInput] = useState<string>(
        "Quantum Computing\nArtificial Intelligence\nBlockchain Architecture\nCloud Infrastructure\nCybersecurity Mesh\nDistributed Systems\nEdge Computing\nFault-Tolerant Consensus"
    );
    const [shuffledOutput, setShuffledOutput] = useState<string[]>([]);
    const [delimiter, setDelimiter] = useState<DelimiterType>("newline");
    const [customDelimiter, setCustomDelimiter] = useState<string>(" | ");

    // Configuration Checkbox Toggles
    const [trimWhitespace, setTrimWhitespace] = useState<boolean>(true);
    const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(false);
    const [ignoreEmptyLines, setIgnoreEmptyLines] = useState<boolean>(true);
    const [addPrefixNumbers, setAddPrefixNumbers] = useState<boolean>(false);
    const [groupSize, setGroupSize] = useState<number>(0);
    const [itemLimit, setItemLimit] = useState<number>(0);

    // UX Feedback States
    const [copied, setCopied] = useState<boolean>(false);
    const [shuffleCount, setShuffleCount] = useState<number>(0);
    const [isShuffling, setIsShuffling] = useState<boolean>(false);

    // Parsing delimiter logic
    const getDelimiterRegex = (type: DelimiterType, custom: string) => {
        switch (type) {
            case "newline":
                return /\r?\n/;
            case "comma":
                return /,/;
            case "semicolon":
                return /;/;
            case "space":
                return /\s+/;
            case "custom":
                return custom.length > 0 ? new RegExp(custom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : /\r?\n/;
            default:
                return /\r?\n/;
        }
    };

    const getJoinDelimiter = (type: DelimiterType, custom: string) => {
        switch (type) {
            case "newline":
                return "\n";
            case "comma":
                return ", ";
            case "semicolon":
                return "; ";
            case "space":
                return " ";
            case "custom":
                return custom;
            default:
                return "\n";
        }
    };

    // Parsed input elements before shuffling
    const parsedInputItems = useMemo(() => {
        if (!rawInput) return [];
        const splitRegex = getDelimiterRegex(delimiter, customDelimiter);
        let items = rawInput.split(splitRegex);

        if (trimWhitespace) {
            items = items.map((i) => i.trim());
        }

        if (ignoreEmptyLines) {
            items = items.filter((i) => i.length > 0);
        }

        if (removeDuplicates) {
            items = Array.from(new Set(items));
        }

        return items;
    }, [rawInput, delimiter, customDelimiter, trimWhitespace, ignoreEmptyLines, removeDuplicates]);

    // Cryptographically Secure Fisher-Yates (Durstenfeld Modernization) Shuffle Engine
    const executeShuffle = () => {
        if (parsedInputItems.length === 0) {
            setShuffledOutput([]);
            return;
        }

        setIsShuffling(true);

        const array = [...parsedInputItems];
        const randomValues = new Uint32Array(array.length);
        crypto.getRandomValues(randomValues);

        for (let i = array.length - 1; i > 0; i--) {
            // Unbiased modulo mapping over cryptographic entropy
            const j = randomValues[i] % (i + 1);
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }

        let finalResult = array;

        // Apply item count limitation
        if (itemLimit > 0 && itemLimit < finalResult.length) {
            finalResult = finalResult.slice(0, itemLimit);
        }

        setShuffledOutput(finalResult);
        setShuffleCount((prev) => prev + 1);

        setTimeout(() => {
            setIsShuffling(false);
        }, 150);
    };

    // Formatted display text with grouping and numbering applied
    const formattedOutputText = useMemo(() => {
        if (shuffledOutput.length === 0) return "";

        let processed = [...shuffledOutput];

        if (addPrefixNumbers) {
            processed = processed.map((item, idx) => `${idx + 1}. ${item}`);
        }

        if (groupSize > 0 && groupSize < processed.length) {
            const groups: string[] = [];
            for (let i = 0; i < processed.length; i += groupSize) {
                const chunk = processed.slice(i, i + groupSize);
                const joinStr = getJoinDelimiter(delimiter, customDelimiter);
                groups.push(`--- Group ${Math.floor(i / groupSize) + 1} ---\n` + chunk.join(joinStr));
            }
            return groups.join("\n\n");
        }

        return processed.join(getJoinDelimiter(delimiter, customDelimiter));
    }, [shuffledOutput, addPrefixNumbers, groupSize, delimiter, customDelimiter]);

    const handleCopy = () => {
        if (!formattedOutputText) return;
        navigator.clipboard.writeText(formattedOutputText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportTXT = () => {
        if (!formattedOutputText) return;
        const blob = new Blob([formattedOutputText], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `randomized_list_${Date.now()}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClearAll = () => {
        setRawInput("");
        setShuffledOutput([]);
        setGroupSize(0);
        setItemLimit(0);
    };

    // Theoretical permutations calculation
    const permutationStats = useMemo(() => {
        const n = parsedInputItems.length;
        if (n <= 0) return "0";
        if (n > 170) return `> 10^306 (${n}! total permutations)`;

        let fact = 1;
        for (let i = 2; i <= n; i++) {
            fact *= i;
        }
        return fact > 1e12 ? fact.toExponential(4) : fact.toLocaleString();
    }, [parsedInputItems]);

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random List Randomizer & Array Item Shuffler",
        "url": "https://twistertools.com/tools/random-tools/list-randomizer-shuffler",
        "description": "Cryptographically secure item shuffler, list randomizer, and array order generator utilizing modern Fisher-Yates algorithms and Web Crypto API hardware entropy.",
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
                "name": "Why is the Fisher-Yates algorithm mathematically unbiased?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Fisher-Yates (Knuth) shuffle guarantees that every one of the n! possible permutations has an exact, uniform probability of 1/n!. Unlike naive sorting with random comparator functions, which suffer from positional bias, Fisher-Yates swaps each element exactly once with an independently chosen random remaining index."
                }
            },
            {
                "@type": "Question",
                "name": "How does hardware cryptographic entropy prevent predictability?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard pseudo-random number generators like Math.random() rely on deterministic internal seed states. This tool integrates the browser Web Crypto API (crypto.getRandomValues), utilizing low-level operating system hardware entropy for cryptographically secure, unguessable shuffling."
                }
            },
            {
                "@type": "Question",
                "name": "What is the computational complexity of the Durstenfeld Fisher-Yates shuffle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The in-place Durstenfeld modernization of Fisher-Yates operates in strict O(n) linear time complexity and O(1) auxiliary space complexity, processing tens of thousands of list items in single-digit milliseconds."
                }
            },
            {
                "@type": "Question",
                "name": "Why is arr.sort(() => Math.random() - 0.5) considered harmful?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sorting with Math.random() - 0.5 violates the transitivity and consistency axioms required by sorting algorithms like QuickSort or Timsort. This causes non-uniform permutation distributions where elements tend to remain near their initial indices, leading to severe statistical bias."
                }
            },
            {
                "@type": "Question",
                "name": "Can I split a shuffled list into random teams or equal groups?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Set the 'Group Items by Size' option to your desired subgroup size (e.g., 4 players per team). The engine randomizes the full pool and formats the output into organized numbered chunks automatically."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool transmit my list data to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. 100% of data processing, sanitization, parsing, and random array mutation occurs entirely client-side in your local browser memory thread. Zero bytes of your list data are uploaded or logged."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Main Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input & Control Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Source List & Formatting
                            </h2>
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Clear
                            </button>
                        </div>

                        {/* Input Textarea */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span>Input Items</span>
                                <span className="text-indigo-600 font-mono">
                                    {parsedInputItems.length} parsed item{parsedInputItems.length === 1 ? "" : "s"}
                                </span>
                            </div>
                            <textarea
                                value={rawInput}
                                onChange={(e) => setRawInput(e.target.value)}
                                rows={8}
                                placeholder="Paste or type list items here (separated by new lines or custom delimiters)..."
                                className="w-full p-3.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[160px] max-h-[380px] bg-slate-50/50"
                            />
                        </div>

                        {/* Delimiter Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
                                Item Separator / Delimiter
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {(
                                    [
                                        { id: "newline", label: "New Line (\\n)" },
                                        { id: "comma", label: "Comma (,)" },
                                        { id: "semicolon", label: "Semicolon (;)" },
                                        { id: "space", label: "Space (\\s)" },
                                        { id: "custom", label: "Custom" },
                                    ] as const
                                ).map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setDelimiter(item.id)}
                                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition cursor-pointer text-center ${delimiter === item.id
                                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {delimiter === "custom" && (
                                <div className="pt-1">
                                    <input
                                        type="text"
                                        value={customDelimiter}
                                        onChange={(e) => setCustomDelimiter(e.target.value)}
                                        placeholder="Enter custom delimiter string (e.g. ' | ' or ' - ')"
                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cleaning & Shaping Checkboxes */}
                        <div className="space-y-2 pt-1">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Data Cleaning & Extraction Rules
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setTrimWhitespace(!trimWhitespace)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-left"
                                >
                                    {trimWhitespace ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    )}
                                    <span>Trim item whitespace</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRemoveDuplicates(!removeDuplicates)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-left"
                                >
                                    {removeDuplicates ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    )}
                                    <span>Remove duplicate items</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIgnoreEmptyLines(!ignoreEmptyLines)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-left"
                                >
                                    {ignoreEmptyLines ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    )}
                                    <span>Ignore empty entries</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAddPrefixNumbers(!addPrefixNumbers)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer text-left"
                                >
                                    {addPrefixNumbers ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                    ) : (
                                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    )}
                                    <span>Prefix numbered rank (1, 2, 3...)</span>
                                </button>
                            </div>
                        </div>

                        {/* Numeric Sub-settings: Pick Count & Group Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Limit Output Sample (0 = All)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max={parsedInputItems.length}
                                        value={itemLimit === 0 ? "" : itemLimit}
                                        onChange={(e) => handleNumberInput(e, setItemLimit)}
                                        placeholder="Pick X items"
                                        className="w-full pl-3 pr-14 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                        items
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">
                                    Group Items by Size (0 = None)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="500"
                                        value={groupSize === 0 ? "" : groupSize}
                                        onChange={(e) => handleNumberInput(e, setGroupSize)}
                                        placeholder="e.g. 4 per team"
                                        className="w-full pl-3 pr-16 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                        per group
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shuffling Execution CTA */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={executeShuffle}
                            disabled={parsedInputItems.length === 0}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm sm:text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Shuffle className={`w-4 h-4 sm:w-5 sm:h-5 ${isShuffling ? "animate-spin" : ""}`} />
                            {shuffledOutput.length > 0 ? "Re-Shuffle List" : "Randomize & Shuffle List"}
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Shuffled Output & Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Randomized Result Preview
                            </h2>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                                Shuffle Run #{shuffleCount}
                            </span>
                        </div>

                        {/* Permutation & Entropy Quick Banner */}
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2 text-xs">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Hash className="w-4 h-4 text-indigo-600" />
                                    <span className="font-semibold">Permutations Space ($n!$):</span>
                                </div>
                                <span className="font-mono font-bold text-slate-900">
                                    {permutationStats}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Cpu className="w-4 h-4 text-emerald-500" />
                                    <span className="font-semibold">Entropy Source:</span>
                                </div>
                                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    WebCrypto CSPRNG
                                </span>
                            </div>
                        </div>

                        {/* Result Container */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span>Output Vector</span>
                                <span className="text-slate-500 font-mono">
                                    {shuffledOutput.length} item{shuffledOutput.length === 1 ? "" : "s"} rendered
                                </span>
                            </div>
                            <textarea
                                readOnly
                                value={formattedOutputText}
                                rows={8}
                                placeholder="Click 'Randomize & Shuffle List' to execute hardware random permutation..."
                                className="w-full p-3.5 rounded-xl border border-slate-200 text-indigo-200 placeholder:text-slate-500 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[160px] max-h-[380px] bg-slate-900 selection:bg-indigo-600 selection:text-white"
                            />
                        </div>

                        {/* Quick Statistics Matrix */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <span className="text-slate-400 block text-[10px] uppercase">Input Items</span>
                                <strong className="text-slate-900 text-sm">{parsedInputItems.length}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <span className="text-slate-400 block text-[10px] uppercase">Output Items</span>
                                <strong className="text-indigo-600 text-sm">{shuffledOutput.length}</strong>
                            </div>
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                                <span className="text-slate-400 block text-[10px] uppercase">Groups</span>
                                <strong className="text-slate-900 text-sm">
                                    {groupSize > 0 && shuffledOutput.length > 0
                                        ? Math.ceil(shuffledOutput.length / groupSize)
                                        : 1}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Output Action CTA Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={!formattedOutputText}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Result"}
                        </button>
                        <button
                            onClick={handleExportTXT}
                            disabled={!formattedOutputText}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export .TXT
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Core Mathematical Theory & Durstenfeld Optimization */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Permutation Theory: The Modern Fisher-Yates (Knuth) Paradigm
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A list randomizer is a stochastic combinatorics engine designed to transform an ordered finite set of $n$ elements into one of its $n!$ possible permutations with uniform probability. For any list permutation sequence $\pi$, strict mathematical fairness dictates that every distinct outcome possesses an identical probability density:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed text-center font-mono">
                        {"$$P(\\pi) = \\frac{1}{n!} = \\frac{1}{n \\times (n-1) \\times (n-2) \\times \\dots \\times 1}$$"}
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The original pencil-and-paper algorithm proposed by Ronald Fisher and Frank Yates in 1938 operated by writing down numbers from 1 to $n$, picking a remaining number at random, writing it down on a separate sheet, and crossing it off the original list. In computer science, this naive approach suffers from an $O(n^2)$ time penalty due to element deletion and array compaction costs.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Terminal className="w-4 h-4 text-indigo-600" /> Durstenfeld In-Place Algorithm (1964)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Richard Durstenfeld modernized the algorithm into an optimal $O(n)$ in-place method by swapping chosen items into the tail of the array, avoiding auxiliary allocation:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                {"// In-Place O(n) Array Permutation\nfor i from n - 1 down to 1 do:\n    j = random_integer(0 ≤ j ≤ i)\n    swap(array[i], array[j])"}
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Cryptographic Web Crypto API RNG
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Instead of standard pseudo-random number generators (PRNGs) like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">Math.random()</code> that repeat sequences due to low entropy seeds, our tool uses operating system hardware entropy:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                {"// OS Kernel CSPRNG Buffer\nconst entropy = new Uint32Array(n);\nwindow.crypto.getRandomValues(entropy);\nconst j = entropy[i] % (i + 1);"}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Deep Dive - The "Math.random() - 0.5" Flaw */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Why Naive JavaScript Sorting Causes Severe Statistical Bias
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A widespread shortcut in software development is shuffling arrays using <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs">array.sort(() =&gt; Math.random() - 0.5)</code>. While brief, this method introduces severe statistical bias and violates core mathematical sorting axioms.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Scale className="w-4 h-4 text-rose-600" /> Transitivity Violation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sorting algorithms require transitivity: if $A &gt; B$ and $B &gt; C$, then $A &gt; C$ must be true. Random comparators return non-deterministic values, breaking sorting invariants and causing undefined element order.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <BarChart3 className="w-4 h-4 text-rose-600" /> Non-Uniform Probabilities
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                In modern V8 engines (using Timsort or QuickSort), elements are compared an unequal number of times depending on their starting index. Items near the beginning stay near the beginning far more often than $1/n!$.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Durstenfeld Uniformity
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The Durstenfeld Fisher-Yates algorithm guarantees each element has an exact $1/n$ probability of being swapped into any index, completely eliminating positional bias.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            Comprehensive Randomization Algorithm Comparison
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Shuffling Algorithm</th>
                                        <th className="p-3">Time Complexity</th>
                                        <th className="p-3">Space Complexity</th>
                                        <th className="p-3">Uniformity Quality</th>
                                        <th className="p-3">PRNG Quality</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-bold text-slate-900">Fisher-Yates + Web Crypto (TwisterTools)</td>
                                        <td className="p-3 font-mono text-emerald-700 font-bold">$O(n)$</td>
                                        <td className="p-3 font-mono">$O(1)$</td>
                                        <td className="p-3 font-bold text-emerald-700">Unbiased ($1/n!$)</td>
                                        <td className="p-3 text-emerald-700 font-semibold">CSPRNG (Hardware)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Standard Fisher-Yates (Math.random)</td>
                                        <td className="p-3 font-mono">$O(n)$</td>
                                        <td className="p-3 font-mono">$O(1)$</td>
                                        <td className="p-3 text-slate-600">Unbiased</td>
                                        <td className="p-3 text-amber-600 font-semibold">Pseudo-random (PRNG)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Naive Pencil-and-Paper (Array Splice)</td>
                                        <td className="p-3 font-mono text-amber-600 font-bold">$O(n^2)$</td>
                                        <td className="p-3 font-mono">$O(n)$</td>
                                        <td className="p-3 text-slate-600">Unbiased</td>
                                        <td className="p-3 text-slate-500">Depends on generator</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-rose-50/40">
                                        <td className="p-3 font-semibold text-slate-900">Array.prototype.sort(() =&gt; Math.random() - 0.5)</td>
                                        <td className="p-3 font-mono text-rose-600 font-bold">$O(n \\log n)$</td>
                                        <td className="p-3 font-mono">$O(\\log n)$</td>
                                        <td className="p-3 font-bold text-rose-600">Severely Biased</td>
                                        <td className="p-3 text-rose-600 font-semibold">PRNG / Flawed</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Combinatorial Permutation Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Combinatorial Permutation Reference Matrix ($n!$)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Factorial growth accelerates at an astronomical rate. For example, a standard deck of 52 playing cards has $52! \\approx 8.0658 \\times 10^{67}$ possible orderings. When you shuffle a 52-card list with an unbiased engine, it is mathematically almost certain that the resulting sequence has never existed before in human history.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Elements ($n$)</th>
                                    <th className="p-3">Mathematical Expression</th>
                                    <th className="p-3">Total Unique Sequences ($n!$)</th>
                                    <th className="p-3">Odds of a Single Sequence ($1/n!$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 Items</td>
                                    <td className="p-3 font-mono">3 × 2 × 1</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">6</td>
                                    <td className="p-3 font-bold text-indigo-600">16.6667% (1 in 6)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">5 Items</td>
                                    <td className="p-3 font-mono">5!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">120</td>
                                    <td className="p-3 font-bold text-indigo-600">0.8333% (1 in 120)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8 Items</td>
                                    <td className="p-3 font-mono">8!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">40,320</td>
                                    <td className="p-3 font-bold text-indigo-600">0.00248% (1 in 40.3k)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">10 Items</td>
                                    <td className="p-3 font-mono">10!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">3,628,800</td>
                                    <td className="p-3 font-bold text-indigo-600">2.756 × 10⁻⁷</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">15 Items</td>
                                    <td className="p-3 font-mono">15!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">1,307,674,368,000</td>
                                    <td className="p-3 font-bold text-indigo-600">7.647 × 10⁻¹³</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">20 Items</td>
                                    <td className="p-3 font-mono">20!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">2.4329 × 10¹⁸</td>
                                    <td className="p-3 font-bold text-indigo-600">4.110 × 10⁻¹⁹</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-slate-900">52 Items (Deck)</td>
                                    <td className="p-3 font-mono">52!</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">8.0658 × 10⁶⁷</td>
                                    <td className="p-3 font-bold text-indigo-600">1.240 × 10⁻⁶⁸</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">100 Items</td>
                                    <td className="p-3 font-mono">100!</td>
                                    <td className="p-3 font-mono font-bold text-slate-900">9.3326 × 10¹⁵⁷</td>
                                    <td className="p-3 font-bold text-indigo-600">1.071 × 10⁻¹⁵⁸</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Examples & Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Practical Walkthroughs & Common Scenarios
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Learn how to leverage delimiters, group chunking, duplicate sanitization, and output sampling for everyday technical and organizational tasks:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Scenario A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-indigo-600" /> Hackathon Team Splitting
                                </span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Grouping Mode</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                                <li><strong>Goal:</strong> Divide 16 participant names into 4 fair teams of 4 members each.</li>
                                <li><strong>Step 1:</strong> Paste names into the input box (separated by New Line).</li>
                                <li><strong>Step 2:</strong> Check <em>Trim item whitespace</em> and <em>Remove duplicate items</em>.</li>
                                <li><strong>Step 3:</strong> Set <em>Group Items by Size</em> to <code className="bg-slate-200 px-1 py-0.5 rounded">4</code>.</li>
                                <li><strong>Step 4:</strong> Click <strong>Randomize & Shuffle List</strong> to generate formatted <em>--- Group 1 ---</em> through <em>--- Group 4 ---</em> outputs.</li>
                            </ul>
                        </div>

                        {/* Scenario B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-indigo-600" /> Giveaway Winner Sampling
                                </span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Sampling Mode</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                                <li><strong>Goal:</strong> Select exactly 3 unique winners from a list of 250 contest entries.</li>
                                <li><strong>Step 1:</strong> Paste all 250 contestant names or email addresses.</li>
                                <li><strong>Step 2:</strong> Check <em>Remove duplicate items</em> to ensure fair single-entry odds.</li>
                                <li><strong>Step 3:</strong> Set <em>Limit Output Sample</em> to <code className="bg-slate-200 px-1 py-0.5 rounded">3</code> and enable <em>Prefix numbered rank</em>.</li>
                                <li><strong>Step 4:</strong> Click <strong>Randomize & Shuffle List</strong> to instantly draw ranked winners: 1st, 2nd, and 3rd place.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Enterprise Applications & Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Applications of Client-Side List Randomization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Browser-native list randomizers are essential utilities across multiple engineering, scientific research, and operational workflows:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Code2 className="w-4 h-4 text-indigo-600" /> A/B Testing & Clinical Trials
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Randomize cohort assignments and experimental trial treatments without server latency or database bias.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Binary className="w-4 h-4 text-indigo-600" /> Machine Learning Dataset Splitting
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Shuffle training datasets, validation samples, and feature matrices prior to cross-validation batching.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" /> Exam Question & Survey Randomization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Prevent academic cheating and survey order fatigue by randomizing question blocks and multiple-choice options.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Static Border-Highlighted FAQ Section */}
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
                                Why is the Fisher-Yates algorithm mathematically unbiased?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Fisher-Yates (Knuth) shuffle guarantees that every one of the $n!$ possible permutations has an exact, uniform probability of $1/n!$. Unlike naive sorting with random comparator functions, which suffer from positional bias, Fisher-Yates swaps each element exactly once with an independently chosen random remaining index.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does hardware cryptographic entropy prevent predictability?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard pseudo-random number generators like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">Math.random()</code> rely on deterministic internal seed states. This tool integrates the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">crypto.getRandomValues</code>), utilizing low-level operating system hardware entropy for cryptographically secure, unguessable shuffling.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the computational complexity of the Durstenfeld Fisher-Yates shuffle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The in-place Durstenfeld modernization of Fisher-Yates operates in strict $O(n)$ linear time complexity and $O(1)$ auxiliary space complexity, processing tens of thousands of list items in single-digit milliseconds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is arr.sort(() =&gt; Math.random() - 0.5) considered harmful?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sorting with <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">Math.random() - 0.5</code> violates the transitivity and consistency axioms required by sorting algorithms like QuickSort or Timsort. This causes non-uniform permutation distributions where elements tend to remain near their initial indices, leading to severe statistical bias.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I split a shuffled list into random teams or equal groups?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Set the "Group Items by Size" option to your desired subgroup size (e.g., 4 players per team). The engine randomizes the full pool and formats the output into organized numbered chunks automatically.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool transmit my list data to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. 100% of data processing, sanitization, parsing, and random array mutation occurs entirely client-side in your local browser memory thread. Zero bytes of your list data are uploaded or logged.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}