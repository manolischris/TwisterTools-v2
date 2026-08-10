"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
    Circle,
    RotateCw,
    TrendingUp,
    BarChart3,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Download,
    Copy,
    Check,
    Percent,
    Layers,
    RefreshCw,
    Award,
    Dices,
    Coins,
    Calculator,
    Lightbulb,
    BrainCircuit,
    Target
} from "lucide-react";

type CoinResult = "heads" | "tails";

interface CoinSkin {
    id: string;
    name: string;
    headsImg: string;
    tailsImg: string;
}

const COIN_SKINS: CoinSkin[] = [
    {
        id: "us-quarter",
        name: "US Quarter",
        headsImg: "/images/coins/us-quarter-heads.webp",
        tailsImg: "/images/coins/us-quarter-tails.webp",
    },
    {
        id: "euro-1",
        name: "1 Euro",
        headsImg: "/images/coins/euro-heads.webp",
        tailsImg: "/images/coins/euro-tails.webp",
    },
];

interface FlipRecord {
    id: number;
    result: CoinResult;
    timestamp: string;
    headsCountSoFar: number;
    tailsCountSoFar: number;
    headsRatioSoFar: number;
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

export default function CoinFlipper() {
    // Single & Multi-Flip States
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentSide, setCurrentSide] = useState<CoinResult>("heads");
    const [selectedSkin, setSelectedSkin] = useState<CoinSkin>(COIN_SKINS[0]);
    const [batchSize, setBatchSize] = useState<number>(100);
    const [history, setHistory] = useState<FlipRecord[]>([]);

    // Stat Totals
    const [totalHeads, setTotalHeads] = useState<number>(0);
    const [totalTails, setTotalTails] = useState<number>(0);

    // Visual animation states
    const [flipDeg, setFlipDeg] = useState<number>(0);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"chart" | "history">("chart");

    const totalFlips = totalHeads + totalTails;

    // Computed Probabilities and Deviations
    const stats = useMemo(() => {
        if (totalFlips === 0) {
            return {
                headsPct: 50.0,
                tailsPct: 50.0,
                expectedHeads: 0,
                expectedTails: 0,
                variance: 0,
                stdDev: 0,
                deviationFromMean: 0,
            };
        }

        const headsPct = (totalHeads / totalFlips) * 100;
        const tailsPct = (totalTails / totalFlips) * 100;
        const expected = totalFlips / 2;
        const deviationFromMean = totalHeads - expected;
        // Binomial Variance: n * p * (1 - p) where p = 0.5 -> n * 0.25
        const variance = totalFlips * 0.25;
        const stdDev = Math.sqrt(variance);

        return {
            headsPct,
            tailsPct,
            expectedHeads: expected,
            expectedTails: expected,
            variance,
            stdDev,
            deviationFromMean,
        };
    }, [totalHeads, totalTails, totalFlips]);

    // Execute single flip with guaranteed angular alignment
    const handleSingleFlip = () => {
        if (isFlipping) return;
        setIsFlipping(true);

        // Crypto-grade secure random boolean
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        const result: CoinResult = array[0] % 2 === 0 ? "heads" : "tails";

        // Calculate exact target rotation so result visual face ALWAYS matches:
        // 0 mod 360 = Heads face forward, 180 mod 360 = Tails face forward
        const desiredMod = result === "heads" ? 0 : 180;
        const extraRotations = (Math.floor(Math.random() * 5) + 5) * 360;

        let nextBaseDeg = Math.ceil(flipDeg / 360) * 360 + desiredMod;
        if (nextBaseDeg <= flipDeg) {
            nextBaseDeg += 360;
        }
        const targetDeg = nextBaseDeg + extraRotations;

        setFlipDeg(targetDeg);

        setTimeout(() => {
            setCurrentSide(result);
            setIsFlipping(false);

            setTotalHeads((prev) => (result === "heads" ? prev + 1 : prev));
            setTotalTails((prev) => (result === "tails" ? prev + 1 : prev));

            setHistory((prev) => {
                const newHeads = result === "heads" ? totalHeads + 1 : totalHeads;
                const newTails = result === "tails" ? totalTails + 1 : totalTails;
                const newTotal = newHeads + newTails;
                const record: FlipRecord = {
                    id: Date.now(),
                    result,
                    timestamp: new Date().toLocaleTimeString(),
                    headsCountSoFar: newHeads,
                    tailsCountSoFar: newTails,
                    headsRatioSoFar: (newHeads / newTotal) * 100,
                };
                return [record, ...prev].slice(0, 100);
            });
        }, 800);
    };

    // Fast Monte Carlo Batch Simulation
    const handleBatchFlip = () => {
        if (isFlipping || batchSize <= 0) return;

        const count = Math.min(1000000, Math.max(1, batchSize));
        const array = new Uint32Array(count);
        crypto.getRandomValues(array);

        let addedHeads = 0;
        let addedTails = 0;

        for (let i = 0; i < count; i++) {
            if (array[i] % 2 === 0) {
                addedHeads++;
            } else {
                addedTails++;
            }
        }

        const newHeads = totalHeads + addedHeads;
        const newTails = totalTails + addedTails;
        const lastResult: CoinResult = array[count - 1] % 2 === 0 ? "heads" : "tails";

        setTotalHeads(newHeads);
        setTotalTails(newTails);
        setCurrentSide(lastResult);

        // Align 3D visual rotation to match lastResult of the batch
        const desiredMod = lastResult === "heads" ? 0 : 180;
        let nextBaseDeg = Math.ceil(flipDeg / 360) * 360 + desiredMod;
        if (nextBaseDeg <= flipDeg) {
            nextBaseDeg += 360;
        }
        setFlipDeg(nextBaseDeg + 720);

        const newTotal = newHeads + newTails;
        const newRecord: FlipRecord = {
            id: Date.now(),
            result: lastResult,
            timestamp: `${count.toLocaleString()} Flips Batch`,
            headsCountSoFar: newHeads,
            tailsCountSoFar: newTails,
            headsRatioSoFar: (newHeads / newTotal) * 100,
        };

        setHistory((prev) => [newRecord, ...prev].slice(0, 100));
    };

    const handleReset = () => {
        setTotalHeads(0);
        setTotalTails(0);
        setHistory([]);
        setCurrentSide("heads");
        setFlipDeg(0);
    };

    const handleCopySummary = () => {
        const text = `Coin Flipper & Probability Simulation Results:
----------------------------------------
Coin Selected: ${selectedSkin.name}
Total Flips: ${totalFlips.toLocaleString()}
Heads: ${totalHeads.toLocaleString()} (${stats.headsPct.toFixed(2)}%)
Tails: ${totalTails.toLocaleString()} (${stats.tailsPct.toFixed(2)}%)
----------------------------------------
Expected Mean (Each): ${stats.expectedHeads.toLocaleString()}
Standard Deviation: ±${stats.stdDev.toFixed(2)}
Deviation from Expected: ${stats.deviationFromMean > 0 ? `+${stats.deviationFromMean}` : stats.deviationFromMean}
----------------------------------------
Simulated via twistertools.com/tools/random-tools/coin-flipper`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (history.length === 0) return;
        const headers = ["Index", "Result", "Timestamp", "Total Heads", "Total Tails", "Heads Ratio %"];
        const rows = history.map((item, idx) => [
            history.length - idx,
            item.result,
            item.timestamp,
            item.headsCountSoFar,
            item.tailsCountSoFar,
            item.headsRatioSoFar.toFixed(2),
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "coin_flip_simulation_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Coin Flipper & Probability Simulator",
        "url": "https://twistertools.com/tools/random-tools/coin-flipper",
        "description": "Simulate 3D coin flips with real currency skins and execute high-speed Monte Carlo probability simulations up to 1,000,000 flips using cryptographically secure random values.",
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
                "name": "Is this online coin flipper truly fair and random?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This simulator bypasses standard pseudo-random algorithms like Math.random() in favor of the browser Web Crypto API (crypto.getRandomValues). This generates hardware-level cryptographic entropy to guarantee an exact 50/50 uniform probability distribution."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Law of Large Numbers in probability theory?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Law of Large Numbers (LLN) states that as the sample size of independent trials increases, the empirical relative frequency of an outcome approaches its theoretical expected probability. In coin flipping, running 1,000,000 flips brings the Heads/Tails ratio remarkably close to 50.00%."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Gambler's Fallacy and how does it apply to coin flips?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Gambler's Fallacy is the mistaken belief that past independent outcomes influence future trials. Because coin flips are memoryless, flipping 10 Heads in a row does not increase the odds of landing Tails on the 11th flip; it remains exactly 50%."
                }
            },
            {
                "@type": "Question",
                "name": "Are physical coin flips genuinely 50/50 fair?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Not quite. Research led by Stanford mathematician Persi Diaconis revealed that physical coin flips exhibit a slight 'same-side bias' of approximately 51% toward landing on whichever face was facing upward prior to being tossed, due to precessional rotation dynamics."
                }
            },
            {
                "@type": "Question",
                "name": "How fast is the Monte Carlo batch simulation engine?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Monte Carlo engine processes up to 1,000,000 coin flips in milliseconds inside your local browser memory thread using fast 32-bit typed unsigned integer arrays."
                }
            },
            {
                "@type": "Question",
                "name": "How is the Binomial Standard Deviation calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For n independent flips with success probability p = 0.5, variance is σ² = n × 0.25. The standard deviation is the square root of variance: σ = 0.5 × √n."
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
                {/* Left Workspace Panel: Interactive Coin & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Dices className="w-5 h-5 text-indigo-600" />
                                Flip Engine & Controls
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Engine
                            </button>
                        </div>

                        {/* Coin Skin Selector Row */}
                        <div className="mb-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Coins className="w-4 h-4 text-indigo-600" />
                                Select Coin Design
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                {COIN_SKINS.map((skin) => {
                                    const isSelected = selectedSkin.id === skin.id;
                                    return (
                                        <button
                                            key={skin.id}
                                            type="button"
                                            onClick={() => setSelectedSkin(skin)}
                                            className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${isSelected
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            <div className="relative w-4 h-4 rounded-full overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={skin.headsImg}
                                                    alt={skin.name}
                                                    fill
                                                    sizes="16px"
                                                    className="object-cover"
                                                />
                                            </div>
                                            <span>{skin.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Interactive 3D Real-View Coin Stage */}
                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-2xl border border-slate-200/80 mb-6 relative overflow-hidden">
                            <div className="perspective-1000 w-40 h-40 relative flex items-center justify-center">
                                <div
                                    className="w-36 h-36 rounded-full transition-transform duration-700 ease-out transform-gpu relative shadow-2xl"
                                    style={{
                                        transform: `rotateY(${flipDeg}deg)`,
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    {/* Heads Side (Front) */}
                                    <div
                                        className="absolute inset-0 w-full h-full rounded-full overflow-hidden"
                                        style={{ backfaceVisibility: "hidden" }}
                                    >
                                        <Image
                                            src={selectedSkin.headsImg}
                                            alt={`${selectedSkin.name} Heads`}
                                            fill
                                            sizes="144px"
                                            className="object-contain"
                                            priority
                                        />
                                    </div>

                                    {/* Tails Side (Back - Rotated 180 deg) */}
                                    <div
                                        className="absolute inset-0 w-full h-full rounded-full overflow-hidden"
                                        style={{
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)",
                                        }}
                                    >
                                        <Image
                                            src={selectedSkin.tailsImg}
                                            alt={`${selectedSkin.name} Tails`}
                                            fill
                                            sizes="144px"
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                            </div>

                            <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {isFlipping ? "Flipping..." : `Current Side: ${currentSide.toUpperCase()}`}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={handleSingleFlip}
                                disabled={isFlipping}
                                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <RotateCw className={`w-5 h-5 ${isFlipping ? "animate-spin" : ""}`} />
                                Flip Single Coin
                            </button>

                            {/* Multi-Flip Batch Section */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Monte Carlo Batch Simulation
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max="1000000"
                                            value={batchSize === 0 ? "" : batchSize}
                                            onChange={(e) => handleNumberInput(e, setBatchSize)}
                                            className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="Count"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Flips
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleBatchFlip}
                                        disabled={isFlipping || batchSize <= 0}
                                        className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap"
                                    >
                                        Run Batch
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[10, 100, 1000, 10000, 100000].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => setBatchSize(preset)}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${batchSize === preset
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            +{preset.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Statistics"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Statistical Analytics & Logs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Probability Analytics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Distribution
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    History Log ({history.length})
                                </button>
                            </div>
                        </div>

                        {/* Top Primary Stat Metric Box */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600">
                                <span>Total Sample Flips</span>
                                <span className="text-indigo-600 font-extrabold">{totalFlips.toLocaleString()}</span>
                            </div>

                            {/* Comparative Progress Visual Bar */}
                            <div className="space-y-1.5">
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-300"
                                        style={{ width: `${stats.headsPct}%` }}
                                        title={`Heads: ${stats.headsPct.toFixed(1)}%`}
                                    />
                                    <div
                                        className="bg-amber-500 h-full transition-all duration-300"
                                        style={{ width: `${stats.tailsPct}%` }}
                                        title={`Tails: ${stats.tailsPct.toFixed(1)}%`}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-indigo-600">Heads: {stats.headsPct.toFixed(2)}%</span>
                                    <span className="text-amber-600">Tails: {stats.tailsPct.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>

                        {activeTab === "chart" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                {/* Heads Count */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Award className="w-4 h-4 text-indigo-600" />
                                        Total Heads
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {totalHeads.toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Expected: {Math.round(stats.expectedHeads).toLocaleString()}
                                    </p>
                                </div>

                                {/* Tails Count */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Circle className="w-4 h-4 text-amber-500" />
                                        Total Tails
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 mt-1">
                                        {totalTails.toLocaleString()}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Expected: {Math.round(stats.expectedTails).toLocaleString()}
                                    </p>
                                </div>

                                {/* Standard Deviation */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                                        Standard Deviation (σ)
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        ±{stats.stdDev.toFixed(2)}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Binomial: √(n × 0.25)
                                    </p>
                                </div>

                                {/* Deviation from Expected Mean */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Percent className="w-4 h-4 text-indigo-600" />
                                        Mean Difference
                                    </div>
                                    <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                        {stats.deviationFromMean > 0 ? `+${stats.deviationFromMean}` : stats.deviationFromMean}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Heads - Expected
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* History Log List Tab */
                            <div className="max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {history.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-400">No flips executed yet.</p>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${item.result === "heads" ? "bg-indigo-600" : "bg-amber-500"}`} />
                                                <span className="font-bold uppercase text-slate-900">{item.result}</span>
                                                <span className="text-[11px] text-slate-400">({item.timestamp})</span>
                                            </div>
                                            <div className="text-right font-medium text-slate-600">
                                                <span>Ratio: {item.headsRatioSoFar.toFixed(1)}% H</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Web Crypto API RNG
                        </span>
                        <span>Monte Carlo Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Statistical Foundations & Mathematical Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Bernoulli Trials & Probability Theory
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A fair coin flip represents a canonical <strong>Bernoulli trial</strong> in probability theory: a discrete stochastic experiment with exactly two mutually exclusive, exhaustive outcomes—conventionally designated as <em>Heads</em> ($H = 1$) and <em>Tails</em> ($T = 0$). For an ideal, unbiased coin, the theoretical probability of landing on either face remains strictly equal across every independent trial:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$P(H) = P(T) = 0.5 = \\frac{1}{2}$$"}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Binomial Distribution PMF
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When tossing a coin $n$ independent times, the total number of Heads $k$ follows a Binomial distribution $B(n, p)$. The exact probability of observing $k$ heads in $n$ flips is calculated via the Probability Mass Function (PMF):
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                P(X = k) = (n! / (k!(n - k)!)) × p^k × (1 - p)^(n - k)
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Cryptographic Hardware Entropy
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Most web tools rely on standard software PRNGs like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>, which are deterministic algorithms seeded by system clocks. This simulator executes hardware-backed entropy via the Web Crypto API:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                window.crypto.getRandomValues(new Uint32Array(1))
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Expected Values & Standard Deviation Summary
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Expected Mean E(X):</span>
                                <strong className="text-indigo-300 text-sm">0.5 × n</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Variance (σ²):</span>
                                <strong className="text-indigo-300 text-sm">0.25 × n</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Standard Deviation (σ):</span>
                                <strong className="text-indigo-300 text-sm">0.5 × √n</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Empirical Convergence & The Law of Large Numbers */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Monte Carlo Simulations & The Law of Large Numbers (LLN)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"The Law of Large Numbers (LLN) states that as the total number of independent trials $n$ grows, the sample mean $\\bar{X}_n$ converges almost surely toward the theoretical expected value $\\mu = 0.5$. In small sample sizes (such as 10 flips), variance dominates, yielding outcomes like 70% Heads or 30% Tails. As sample sizes enter Monte Carlo scales (100,000+ flips), the margin of error collapses toward zero."}
                    </p>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Monte Carlo Sample Size vs Confidence Intervals (95% CI)
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Sample Flips ($n$)</th>
                                        <th className="p-3">Expected Heads Range (95% CI)</th>
                                        <th className="p-3">Expected Heads Ratio Range</th>
                                        <th className="p-3">Margin of Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">10 Flips</td>
                                        <td className="p-3">1.90 – 8.10</td>
                                        <td className="p-3 font-mono">19.0% – 81.0%</td>
                                        <td className="p-3 font-bold text-amber-600">±31.00%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">100 Flips</td>
                                        <td className="p-3">40.2 – 59.8</td>
                                        <td className="p-3 font-mono">40.2% – 59.8%</td>
                                        <td className="p-3 font-bold text-amber-600">±9.80%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">1,000 Flips</td>
                                        <td className="p-3">469 – 531</td>
                                        <td className="p-3 font-mono">46.9% – 53.1%</td>
                                        <td className="p-3 font-bold text-indigo-600">±3.10%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">10,000 Flips</td>
                                        <td className="p-3">4,902 – 5,098</td>
                                        <td className="p-3 font-mono">49.02% – 50.98%</td>
                                        <td className="p-3 font-bold text-indigo-600">±0.98%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/30">
                                        <td className="p-3 font-bold text-slate-900">100,000 Flips</td>
                                        <td className="p-3 font-semibold">49,690 – 50,310</td>
                                        <td className="p-3 font-mono font-bold text-emerald-700">49.69% – 50.31%</td>
                                        <td className="p-3 font-bold text-emerald-600">±0.31%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                        <td className="p-3 font-bold text-slate-900">1,000,000 Flips</td>
                                        <td className="p-3 font-semibold">499,020 – 500,980</td>
                                        <td className="p-3 font-mono font-bold text-indigo-700">49.90% – 50.10%</td>
                                        <td className="p-3 font-bold text-indigo-600">±0.10%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Consecutive Streak Probability Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Consecutive Streak Probability Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The likelihood of flipping a specific outcome (e.g., all Heads) consecutively across $n$ consecutive independent trials decreases exponentially according to the power function $(1/2)^n$:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Streak Count ($n$)</th>
                                    <th className="p-3">Power Formula</th>
                                    <th className="p-3">Fraction Odds</th>
                                    <th className="p-3">Percentage Probability</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 Flip</td>
                                    <td className="p-3 font-mono">(1/2)¹</td>
                                    <td className="p-3">1 in 2</td>
                                    <td className="p-3 font-bold text-indigo-600">50.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)²</td>
                                    <td className="p-3">1 in 4</td>
                                    <td className="p-3 font-bold text-indigo-600">25.00%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)³</td>
                                    <td className="p-3">1 in 8</td>
                                    <td className="p-3 font-bold text-indigo-600">12.50%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">5 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)⁵</td>
                                    <td className="p-3">1 in 32</td>
                                    <td className="p-3 font-bold text-indigo-600">3.125%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)⁸</td>
                                    <td className="p-3">1 in 256</td>
                                    <td className="p-3 font-bold text-indigo-600">0.3906%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">10 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)¹⁰</td>
                                    <td className="p-3">1 in 1,024</td>
                                    <td className="p-3 font-bold text-indigo-600">0.09765%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">12 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)¹²</td>
                                    <td className="p-3">1 in 4,096</td>
                                    <td className="p-3 font-bold text-indigo-600">0.02441%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">15 Consecutive</td>
                                    <td className="p-3 font-mono">(1/2)¹⁵</td>
                                    <td className="p-3">1 in 32,768</td>
                                    <td className="p-3 font-bold text-indigo-600">0.00305%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Cognitive Biases & Physical vs Algorithmic Coin Flips */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Physical Physics vs Digital Simulation & Cognitive Fallacies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Human intuition frequently stumbles when evaluating true randomness. Understanding the difference between physical dynamics and digital cryptographic generation helps eliminate common cognitive errors:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">The Gambler's Fallacy</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The false expectation that independent random events self-correct in the short run. If a coin lands Heads 5 times consecutively, the probability of Tails on flip 6 remains strictly 50%.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Physical "Same-Side Bias"</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Stanford research by Persi Diaconis proved physical coin tosses are not purely 50/50. Due to precessional wobble, hand-flipped physical coins land on their starting face ~51% of the time.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Digital Uniformity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Unlike physical coins affected by air resistance or thumb impulse angle, our Web Crypto API engine guarantees zero mechanical bias, ensuring exact 50.00% theoretical fairness.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Worked Probability Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Probability Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Explore these practical mathematical calculations to master binomial probability in real-world scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Exactly 5 Heads in 10 Flips</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Combinatorics</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Question:</strong> What is the exact probability of landing exactly 5 Heads in 10 flips?</li>
                                <li><strong>Step 1:</strong> {"Calculate combinations $\\binom{10}{5} = \\frac{10!}{5!5!} = 252$."}</li>
                                <li><strong>Step 2:</strong> {"Total possible 10-flip outcomes = $2^{10} = 1,024$."}</li>
                                <li><strong>Step 3:</strong> {"Divide favorable outcomes: $252 / 1,024 = 0.24609$."}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: Exactly 24.61% chance.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Margin of Error for 10,000 Flips</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Statistics</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Question:</strong> What is the 95% confidence interval for $n = 10,000$?</li>
                                <li><strong>Step 1:</strong> {"$\\sigma = 0.5 \\times \\sqrt{10,000} = 0.5 \\times 100 = 50$."}</li>
                                <li><strong>Step 2:</strong> {"95% confidence interval uses $1.96 \\times \\sigma = 1.96 \\times 50 = 98$."}</li>
                                <li><strong>Step 3:</strong> {"Expected range = $5,000 \\pm 98$ Heads."}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: 4,902 to 5,098 Heads (49.02% – 50.98%).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: Extended Frequently Asked Questions (FAQ) */}
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
                                Is this online coin flipper truly fair and random?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. This simulator bypasses standard pseudo-random algorithms like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code> in favor of the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>). This generates hardware-level cryptographic entropy to guarantee an exact 50/50 uniform probability distribution.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Law of Large Numbers in probability theory?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Law of Large Numbers (LLN) states that as the sample size of independent trials increases, the empirical relative frequency of an outcome approaches its theoretical expected probability. In coin flipping, running 1,000,000 flips brings the Heads/Tails ratio remarkably close to 50.00%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Gambler's Fallacy and how does it apply to coin flips?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Gambler's Fallacy is the mistaken belief that past independent outcomes influence future trials. Because coin flips are memoryless, flipping 10 Heads in a row does not increase the odds of landing Tails on the 11th flip; it remains exactly 50%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are physical coin flips genuinely 50/50 fair?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Not quite. Research led by Stanford mathematician Persi Diaconis revealed that physical coin flips exhibit a slight "same-side bias" of approximately 51% toward landing on whichever face was facing upward prior to being tossed, due to precessional rotation dynamics.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How fast is the Monte Carlo batch simulation engine?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Monte Carlo engine processes up to 1,000,000 coin flips in milliseconds inside your local browser memory thread using fast 32-bit typed unsigned integer arrays.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the Binomial Standard Deviation calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"For $n$ independent flips with success probability $p = 0.5$, variance is $\\sigma^2 = n \\times 0.25$. The standard deviation is the square root of variance: $\\sigma = 0.5 \\times \\sqrt{n}$."}
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}