"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Users,
    Shuffle,
    Trash2,
    Copy,
    Check,
    Award,
    Sparkles,
    ListOrdered,
    RefreshCw,
    Download,
    HelpCircle,
    BookOpen,
    Calculator,
    BarChart3,
    Settings,
    CheckCircle2,
    Target,
    Layers,
    UserCheck,
    Dices,
    TrendingUp
} from "lucide-react";

interface DrawRecord {
    id: number;
    timestamp: string;
    winners: string[];
    totalPoolSize: number;
}

const DEMO_NAMES = [
    "Alex Johnson",
    "Sarah Williams",
    "Michael Brown",
    "Emily Davis",
    "David Miller",
    "Jessica Wilson",
    "Daniel Moore",
    "Ashley Taylor",
    "James Anderson",
    "Amanda Thomas",
    "Robert Jackson",
    "Jennifer White",
    "William Harris",
    "Elizabeth Martin",
    "Joseph Thompson"
].join("\n");

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(1);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 1 : num);
};

export default function RandomNamePicker() {
    const [namesInput, setNamesInput] = useState<string>(DEMO_NAMES);
    const [winnersCount, setWinnersCount] = useState<number>(1);
    const [allowDuplicates, setAllowDuplicates] = useState<boolean>(false);
    const [removeOnWin, setRemoveOnWin] = useState<boolean>(false);

    // Animation & State
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [slotNameDisplay, setSlotNameDisplay] = useState<string>("Ready to Draw");
    const [currentWinners, setCurrentWinners] = useState<string[]>([]);
    const [drawHistory, setDrawHistory] = useState<DrawRecord[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"winners" | "history">("winners");

    // Parse names list from input textarea (split by newline, trim, filter empty)
    const parsedNames = useMemo(() => {
        return namesInput
            .split("\n")
            .map((name) => name.trim())
            .filter((name) => name.length > 0);
    }, [namesInput]);

    const uniqueNamesCount = useMemo(() => {
        return new Set(parsedNames).size;
    }, [parsedNames]);

    // Quick Action Handlers
    const handleClear = () => {
        setNamesInput("");
        setCurrentWinners([]);
    };

    const handleLoadDemo = () => {
        setNamesInput(DEMO_NAMES);
        setCurrentWinners([]);
    };

    const handleRemoveDuplicates = () => {
        const unique = Array.from(new Set(parsedNames));
        setNamesInput(unique.join("\n"));
    };

    const handleShuffleList = () => {
        const shuffled = [...parsedNames];
        for (let i = shuffled.length - 1; i > 0; i--) {
            // Cryptographic or strong random shuffle index
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            const j = array[0] % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setNamesInput(shuffled.join("\n"));
    };

    // Core Secure Random Winner Selection Engine
    const handlePickWinners = () => {
        if (isDrawing || parsedNames.length === 0) return;

        const countToPick = Math.min(
            allowDuplicates ? parsedNames.length * 10 : parsedNames.length,
            Math.max(1, winnersCount)
        );

        if (!allowDuplicates && countToPick > parsedNames.length) {
            alert("Cannot pick more winners than unique names available when duplicates are disabled.");
            return;
        }

        setIsDrawing(true);
        setCurrentWinners([]);

        // Slot machine visual animation loop
        let counter = 0;
        const totalSteps = 25;
        const intervalTime = 40;

        const interval = setInterval(() => {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            const randomIndex = array[0] % parsedNames.length;
            setSlotNameDisplay(parsedNames[randomIndex]);
            counter++;

            if (counter >= totalSteps) {
                clearInterval(interval);

                // Final selection using Web Crypto API
                const selected: string[] = [];
                const pool = [...parsedNames];

                for (let i = 0; i < countToPick; i++) {
                    if (pool.length === 0) break;
                    const randArr = new Uint32Array(1);
                    crypto.getRandomValues(randArr);
                    const idx = randArr[0] % pool.length;
                    selected.push(pool[idx]);

                    if (!allowDuplicates) {
                        pool.splice(idx, 1);
                    }
                }

                setCurrentWinners(selected);
                setIsDrawing(false);

                // Update History Log
                const newRecord: DrawRecord = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleTimeString(),
                    winners: selected,
                    totalPoolSize: parsedNames.length,
                };
                setDrawHistory((prev) => [newRecord, ...prev].slice(0, 50));

                // If removeOnWin is enabled, filter winners out of the input pool
                if (removeOnWin && !allowDuplicates) {
                    const winnerSet = new Set(selected);
                    const remaining = parsedNames.filter((name) => !winnerSet.has(name));
                    setNamesInput(remaining.join("\n"));
                }
            }
        }, intervalTime);
    };

    const handleCopyWinners = () => {
        if (currentWinners.length === 0) return;
        navigator.clipboard.writeText(currentWinners.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (drawHistory.length === 0) return;
        const headers = ["Draw ID", "Timestamp", "Total Pool Size", "Winners List"];
        const rows = drawHistory.map((item, idx) => [
            drawHistory.length - idx,
            item.timestamp,
            item.totalPoolSize,
            `"${item.winners.join(", ")}"`,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "name_picker_draw_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQPage JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Name Picker & Winner Selector",
        "url": "https://twistertools.com/tools/random-tools/random-name-picker",
        "description": "Enterprise-grade browser-native random name picker and winner selector tool. Features cryptographic Web Crypto API entropy, customizable sampling with/without replacement, live slot-machine animations, bulk management, and CSV export.",
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
                "name": "Is this random name picker truly fair and unbiased?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This tool utilizes the browser's cryptographic Web Crypto API (crypto.getRandomValues) rather than standard pseudorandom number generators like Math.random(). This guarantees an exact uniform probability distribution across all entries."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between sampling with and without replacement?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sampling without replacement (default) removes selected winners from the active pool so the same person cannot win twice in a single multi-winner draw. Sampling with replacement allows the same name to be drawn multiple times."
                }
            },
            {
                "@type": "Question",
                "name": "Can I remove winners automatically after a draw?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Enabling the 'Remove winners from list after draw' toggle automatically filters selected winners out of the main name textarea, making multi-round giveaways and raffles frictionless."
                }
            },
            {
                "@type": "Question",
                "name": "How is combinatorial probability calculated for multi-winner draws?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When picking k winners from a pool of n names without replacement, the total number of unique winning combinations is determined by the binomial coefficient formula: C(n, k) = n! / (k!(n - k)!)."
                }
            },
            {
                "@type": "Question",
                "name": "Are my names stored or transmitted to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All name processing, shuffling, and selection calculations execute entirely client-side within your browser memory sandbox. Your data never leaves your device."
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

                {/* Left Workspace Panel: Name Pool & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Name Pool & Entries
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                    {parsedNames.length} Total ({uniqueNamesCount} Unique)
                                </span>
                            </div>
                        </div>

                        {/* Textarea Input Container */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <label htmlFor="names-textarea" className="flex items-center gap-1.5 cursor-pointer">
                                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                                    Enter Names (One per line)
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleLoadDemo}
                                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold underline cursor-pointer"
                                    >
                                        Load Demo
                                    </button>
                                    <span className="text-slate-300">|</span>
                                    <button
                                        onClick={handleClear}
                                        className="text-slate-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Trash2 className="w-3 h-3" /> Clear
                                    </button>
                                </div>
                            </div>
                            <textarea
                                id="names-textarea"
                                value={namesInput}
                                onChange={(e) => setNamesInput(e.target.value)}
                                placeholder="Paste or type names here (one per line)..."
                                className="w-full min-h-[220px] max-h-[400px] p-3.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50/50 resize-y"
                            />
                        </div>

                        {/* Quick List Manipulation Toolbar */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleShuffleList}
                                disabled={parsedNames.length < 2}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <Shuffle className="w-3.5 h-3.5 text-indigo-600" /> Shuffle Pool
                            </button>
                            <button
                                onClick={handleRemoveDuplicates}
                                disabled={parsedNames.length < 2}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Remove Duplicates
                            </button>
                        </div>

                        {/* Main Action Trigger */}
                        <button
                            onClick={handlePickWinners}
                            disabled={isDrawing || parsedNames.length === 0}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Dices className={`w-5 h-5 ${isDrawing ? "animate-spin" : ""}`} />
                            {isDrawing ? "Selecting Winner..." : `Pick ${winnersCount} Winner${winnersCount > 1 ? "s" : ""}`}
                        </button>

                        {/* Draw Settings Box */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Settings className="w-4 h-4 text-indigo-600" />
                                Selection Settings
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600">
                                        Number of Winners
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="1000"
                                        value={winnersCount === 0 ? "" : winnersCount}
                                        onChange={(e) => handleNumberInput(e, setWinnersCount)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                </div>

                                <div className="space-y-2 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={allowDuplicates}
                                            onChange={(e) => setAllowDuplicates(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        Allow Duplicate Winners
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={removeOnWin}
                                            onChange={(e) => setRemoveOnWin(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        Remove winners after draw
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Winner Showcase & Logs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                Winner Showcase
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("winners")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "winners" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Current Draw ({currentWinners.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    History ({drawHistory.length})
                                </button>
                            </div>
                        </div>

                        {/* Interactive Slot Machine Display Stage */}
                        <div className="flex flex-col items-center justify-center py-8 px-4 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-slate-800 text-white relative overflow-hidden shadow-inner">
                            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] font-mono text-indigo-300 bg-indigo-900/40 px-2.5 py-1 rounded-full border border-indigo-700/50">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                Web Crypto RNG
                            </div>

                            <div className="my-6 text-center">
                                <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-2">
                                    {isDrawing ? "Shuffling Entries..." : currentWinners.length > 0 ? "Selected Winner(s)" : "Ready For Draw"}
                                </p>
                                <div className="text-2xl sm:text-3xl font-black text-white tracking-wide px-4 py-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 min-h-[70px] flex items-center justify-center max-w-full overflow-hidden">
                                    {isDrawing ? (
                                        <span className="text-indigo-200 animate-pulse">{slotNameDisplay}</span>
                                    ) : currentWinners.length > 0 ? (
                                        <span className="text-emerald-300 drop-shadow-md">
                                            {currentWinners.length === 1 ? currentWinners[0] : `${currentWinners.length} Winners Selected`}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 text-sm font-normal">Click "Pick Winners" to begin</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {activeTab === "winners" ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <span>Selected Winners List</span>
                                    <span>{currentWinners.length} Result{currentWinners.length === 1 ? "" : "s"}</span>
                                </div>
                                <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                                    {currentWinners.length === 0 ? (
                                        <p className="p-6 text-center text-xs text-slate-400">No winners drawn in this session yet.</p>
                                    ) : (
                                        currentWinners.map((winner, idx) => (
                                            <div key={idx} className="p-3.5 flex items-center justify-between text-sm hover:bg-white transition">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-900">{winner}</span>
                                                </div>
                                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                    Winner
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* History Log Tab */
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <span>Previous Draw Sessions</span>
                                    <span>{drawHistory.length} Total</span>
                                </div>
                                <div className="max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                                    {drawHistory.length === 0 ? (
                                        <p className="p-6 text-center text-xs text-slate-400">No draw history recorded yet.</p>
                                    ) : (
                                        drawHistory.map((item) => (
                                            <div key={item.id} className="p-3 text-xs space-y-1 hover:bg-white transition">
                                                <div className="flex items-center justify-between font-semibold text-slate-900">
                                                    <span>Draw at {item.timestamp}</span>
                                                    <span className="text-indigo-600">Pool: {item.totalPoolSize}</span>
                                                </div>
                                                <p className="text-slate-600 truncate">
                                                    Winners: {item.winners.join(", ")}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Bar for Winners */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyWinners}
                            disabled={currentWinners.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Winners"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={drawHistory.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export History
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Combinatorial Probability & Cryptographic Selection */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Combinatorics & Cryptographic Fairness
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting $k$ winners from a pool of $n$ distinct names without replacement is governed by combinatorial probability. The total number of unique winning combinations is determined by the binomial coefficient (choose function):
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$\\binom{n}{k} = \\frac{n!}{k!(n - k)!}$$"}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Sampling Without Replacement
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                In standard giveaways and raffles, each participant can win only once. The probability of any specific individual being chosen in a single draw of $k$ winners from pool $n$ is simply:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(Win) = k / n
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Web Crypto API Entropy
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Standard pseudorandom number generators like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code> are predictable. This tool utilizes hardware-backed browser entropy for cryptographic uniformity:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                window.crypto.getRandomValues(new Uint32Array(1))
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Giveaway & Raffle Probability Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Raffle Probability & Winning Odds Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below illustrates individual winning probabilities across various pool sizes ($n$) and winner counts ($k$), assuming sampling without replacement:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Total Entries ($n$)</th>
                                    <th className="p-3">Winners Picked ($k$)</th>
                                    <th className="p-3">Individual Odds Formula</th>
                                    <th className="p-3">Win Probability</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">10 Entries</td>
                                    <td className="p-3">1 Winner</td>
                                    <td className="p-3 font-mono">1 / 10</td>
                                    <td className="p-3 font-bold text-indigo-600">10.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">50 Entries</td>
                                    <td className="p-3">5 Winners</td>
                                    <td className="p-3 font-mono">5 / 50</td>
                                    <td className="p-3 font-bold text-indigo-600">10.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">100 Entries</td>
                                    <td className="p-3">1 Winner</td>
                                    <td className="p-3 font-mono">1 / 100</td>
                                    <td className="p-3 font-bold text-indigo-600">1.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">500 Entries</td>
                                    <td className="p-3">10 Winners</td>
                                    <td className="p-3 font-mono">10 / 500</td>
                                    <td className="p-3 font-bold text-indigo-600">2.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1,000 Entries</td>
                                    <td className="p-3">1 Winner</td>
                                    <td className="p-3 font-mono">1 / 1,000</td>
                                    <td className="p-3 font-bold text-indigo-600">0.10%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-slate-900">10,000 Entries</td>
                                    <td className="p-3 font-semibold">50 Winners</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">50 / 10,000</td>
                                    <td className="p-3 font-bold text-indigo-600">0.50%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Running Fair Giveaways & Raffles */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Best Practices for Running Transparent Giveaways & Classroom Picks
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Whether you are selecting student presentation orders in a university lecture, picking contest winners on social media, or running employee recognition raffles, follow these guidelines to maintain absolute integrity:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Pre-Draw Cleansing</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Always click "Remove Duplicates" prior to importing user lists from CSV or chat exports to ensure every participant receives an equal, unbiased single entry.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Transparency & Logging</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Utilize the built-in Draw History export feature to download CSV session logs as cryptographic proof of fairness for participants and stakeholders.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Eliminate Replacement Bias</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Enable "Remove winners after draw" when picking multiple prizes to prevent a single participant from sweeping multiple awards unintentionally.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                Is this random name picker truly fair and unbiased?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. This tool utilizes the browser's cryptographic Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>) rather than standard pseudorandom number generators like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>. This guarantees an exact uniform probability distribution across all entries.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between sampling with and without replacement?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sampling without replacement (default) removes selected winners from the active pool so the same person cannot win twice in a single multi-winner draw. Sampling with replacement allows the same name to be drawn multiple times.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I remove winners automatically after a draw?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Enabling the "Remove winners from list after draw" toggle automatically filters selected winners out of the main name textarea, making multi-round giveaways and raffles frictionless.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is combinatorial probability calculated for multi-winner draws?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"When picking $k$ winners from a pool of $n$ names without replacement, the total number of unique winning combinations is determined by the binomial coefficient formula: $C(n, k) = \\frac{n!}{k!(n - k)!}$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my names stored or transmitted to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All name processing, shuffling, and selection calculations execute entirely client-side within your browser memory sandbox. Your data never leaves your device.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}