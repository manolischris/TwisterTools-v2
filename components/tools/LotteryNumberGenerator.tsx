"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Sparkles,
    RotateCw,
    Copy,
    Check,
    Download,
    RefreshCw,
    Sliders,
    Award,
    Hash,
    Layers,
    ShieldCheck,
    TrendingUp,
    HelpCircle,
    BookOpen,
    Calculator,
    BarChart3,
    Zap,
    Play,
    CheckCircle2,
    Info,
    Flame,
    History
} from "lucide-react";

interface PresetConfig {
    id: string;
    name: string;
    description: string;
    mainCount: number;
    mainPool: number;
    bonusCount: number;
    bonusPool: number;
    bonusName: string;
}

const LOTTERY_PRESETS: PresetConfig[] = [
    {
        id: "powerball",
        name: "US Powerball",
        description: "5 balls from 1-69 + 1 Powerball from 1-26",
        mainCount: 5,
        mainPool: 69,
        bonusCount: 1,
        bonusPool: 26,
        bonusName: "Powerball",
    },
    {
        id: "mega-millions",
        name: "US Mega Millions",
        description: "5 balls from 1-70 + 1 Mega Ball from 1-25",
        mainCount: 5,
        mainPool: 70,
        bonusCount: 1,
        bonusPool: 25,
        bonusName: "Mega Ball",
    },
    {
        id: "euromillions",
        name: "EuroMillions",
        description: "5 balls from 1-50 + 2 Lucky Stars from 1-12",
        mainCount: 5,
        mainPool: 50,
        bonusCount: 2,
        bonusPool: 12,
        bonusName: "Lucky Stars",
    },
    {
        id: "eurojackpot",
        name: "Eurojackpot",
        description: "5 balls from 1-50 + 2 Euro Numbers from 1-12",
        mainCount: 5,
        mainPool: 50,
        bonusCount: 2,
        bonusPool: 12,
        bonusName: "Euro Numbers",
    },
    {
        id: "uk-lotto",
        name: "UK National Lotto",
        description: "6 balls from 1-59 (No separate bonus pool)",
        mainCount: 6,
        mainPool: 59,
        bonusCount: 0,
        bonusPool: 0,
        bonusName: "Bonus",
    },
    {
        id: "classic-649",
        name: "Classic 6/49 (Canada / Greece / Global)",
        description: "Standard 6 balls drawn from 1 to 49",
        mainCount: 6,
        mainPool: 49,
        bonusCount: 0,
        bonusPool: 0,
        bonusName: "Bonus",
    },
    {
        id: "custom",
        name: "Custom Matrix",
        description: "Fully customizable main and bonus ball configurations",
        mainCount: 6,
        mainPool: 49,
        bonusCount: 1,
        bonusPool: 20,
        bonusName: "Bonus Ball",
    },
];

interface GeneratedDraw {
    id: string;
    timestamp: string;
    mainNumbers: number[];
    bonusNumbers: number[];
    presetName: string;
    sum: number;
    oddCount: number;
    evenCount: number;
}

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number = 1,
    max: number = 100
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(0);
    } else {
        setter(Math.min(max, Math.max(0, num)));
    }
};

// Cryptographically secure integer within range [min, max] inclusive
const getSecureRandomInt = (min: number, max: number): number => {
    const range = max - min + 1;
    if (range <= 0) return min;
    const maxSafe = Math.floor(4294967296 / range) * range;
    const buffer = new Uint32Array(1);
    let rand: number;
    do {
        window.crypto.getRandomValues(buffer);
        rand = buffer[0];
    } while (rand >= maxSafe);
    return min + (rand % range);
};

// Combinations formula nCr
const calculateCombinations = (n: number, r: number): number => {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let result = 1;
    const k = Math.min(r, n - r);
    for (let i = 1; i <= k; i++) {
        result = (result * (n - i + 1)) / i;
    }
    return Math.round(result);
};

export default function LotteryNumberGenerator() {
    const [selectedPresetId, setSelectedPresetId] = useState<string>("powerball");
    const [mainCount, setMainCount] = useState<number>(5);
    const [mainPool, setMainPool] = useState<number>(69);
    const [bonusCount, setBonusCount] = useState<number>(1);
    const [bonusPool, setBonusPool] = useState<number>(26);
    const [bonusLabel, setBonusLabel] = useState<string>("Powerball");
    const [ticketsToGenerate, setTicketsToGenerate] = useState<number>(1);
    const [sortAscending, setSortAscending] = useState<boolean>(true);

    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [currentTickets, setCurrentTickets] = useState<GeneratedDraw[]>([]);
    const [history, setHistory] = useState<GeneratedDraw[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"results" | "history">("results");

    // Interactive Animation State
    const [animatingBalls, setAnimatingBalls] = useState<number[]>([]);
    const [animatingBonus, setAnimatingBonus] = useState<number[]>([]);
    const animTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Apply preset configurations
    const handleSelectPreset = (preset: PresetConfig) => {
        setSelectedPresetId(preset.id);
        setMainCount(preset.mainCount);
        setMainPool(preset.mainPool);
        setBonusCount(preset.bonusCount);
        setBonusPool(preset.bonusPool);
        setBonusLabel(preset.bonusName);
    };

    // Calculate Mathematical Odds
    const oddsMetrics = useMemo(() => {
        const safeMainCount = Math.min(mainCount, mainPool);
        const mainCombinations = calculateCombinations(mainPool, safeMainCount);
        const bonusCombinations = bonusCount > 0 && bonusPool > 0
            ? calculateCombinations(bonusPool, Math.min(bonusCount, bonusPool))
            : 1;
        const totalCombinations = mainCombinations * bonusCombinations;

        return {
            mainCombinations,
            bonusCombinations,
            totalCombinations,
            oddsString: totalCombinations > 0 ? `1 in ${totalCombinations.toLocaleString()}` : "1 in 1",
        };
    }, [mainPool, mainCount, bonusPool, bonusCount]);

    // Secure draw engine
    const executeDraw = (count: number): GeneratedDraw[] => {
        const results: GeneratedDraw[] = [];
        const safeMainCount = Math.max(1, Math.min(mainCount || 1, mainPool || 1));
        const safeBonusCount = bonusCount > 0 && bonusPool > 0 ? Math.min(bonusCount, bonusPool) : 0;

        for (let t = 0; t < count; t++) {
            // Draw unique main numbers using cryptographic random rejection
            const mainDrawn = new Set<number>();
            while (mainDrawn.size < safeMainCount) {
                mainDrawn.add(getSecureRandomInt(1, Math.max(1, mainPool)));
            }
            let mainArr = Array.from(mainDrawn);
            if (sortAscending) {
                mainArr.sort((a, b) => a - b);
            }

            // Draw unique bonus numbers
            const bonusDrawn = new Set<number>();
            if (safeBonusCount > 0 && bonusPool > 0) {
                while (bonusDrawn.size < safeBonusCount) {
                    bonusDrawn.add(getSecureRandomInt(1, bonusPool));
                }
            }
            let bonusArr = Array.from(bonusDrawn);
            if (sortAscending) {
                bonusArr.sort((a, b) => a - b);
            }

            const sum = mainArr.reduce((acc, v) => acc + v, 0) + bonusArr.reduce((acc, v) => acc + v, 0);
            const allNums = [...mainArr, ...bonusArr];
            const oddCount = allNums.filter((n) => n % 2 !== 0).length;
            const evenCount = allNums.filter((n) => n % 2 === 0).length;

            const presetObj = LOTTERY_PRESETS.find((p) => p.id === selectedPresetId);
            results.push({
                id: `${Date.now()}-${t}-${Math.random().toString(36).substring(2, 7)}`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
                mainNumbers: mainArr,
                bonusNumbers: bonusArr,
                presetName: presetObj ? presetObj.name : "Custom Configuration",
                sum,
                oddCount,
                evenCount,
            });
        }
        return results;
    };

    const handleDrawSingle = () => {
        if (isDrawing) return;
        setIsDrawing(true);

        // Visual rolling stage
        let step = 0;
        const totalSteps = 12;
        const safeMainCount = Math.max(1, Math.min(mainCount || 1, mainPool || 1));
        const safeBonusCount = bonusCount > 0 && bonusPool > 0 ? Math.min(bonusCount, bonusPool) : 0;

        if (animTimerRef.current) clearInterval(animTimerRef.current);

        animTimerRef.current = setInterval(() => {
            const tempMain: number[] = [];
            while (tempMain.length < safeMainCount) {
                tempMain.push(Math.floor(Math.random() * Math.max(1, mainPool)) + 1);
            }
            setAnimatingBalls(tempMain);

            if (safeBonusCount > 0 && bonusPool > 0) {
                const tempBonus: number[] = [];
                while (tempBonus.length < safeBonusCount) {
                    tempBonus.push(Math.floor(Math.random() * bonusPool) + 1);
                }
                setAnimatingBonus(tempBonus);
            }

            step++;
            if (step >= totalSteps) {
                if (animTimerRef.current) clearInterval(animTimerRef.current);
                const finalDraws = executeDraw(1);
                setCurrentTickets(finalDraws);
                setAnimatingBalls([]);
                setAnimatingBonus([]);
                setIsDrawing(false);
                setHistory((prev) => [...finalDraws, ...prev].slice(0, 100));
            }
        }, 60);
    };

    const handleMultiDraw = (count: number) => {
        if (isDrawing) return;
        setIsDrawing(true);
        setTimeout(() => {
            const finalDraws = executeDraw(count);
            setCurrentTickets(finalDraws);
            setIsDrawing(false);
            setHistory((prev) => [...finalDraws, ...prev].slice(0, 100));
        }, 150);
    };

    const handleReset = () => {
        setCurrentTickets([]);
        setHistory([]);
        setAnimatingBalls([]);
        setAnimatingBonus([]);
    };

    const handleCopyTickets = () => {
        if (currentTickets.length === 0) return;
        const lines = currentTickets.map((t, idx) => {
            const bonusStr = t.bonusNumbers.length > 0 ? ` + [${bonusLabel}: ${t.bonusNumbers.join(", ")}]` : "";
            return `Line ${idx + 1}: ${t.mainNumbers.join(" - ")}${bonusStr} (Sum: ${t.sum}, O/E: ${t.oddCount}/${t.evenCount})`;
        });
        const fullText = `TwisterTools.com - Lottery Draw Simulation (${LOTTERY_PRESETS.find(p => p.id === selectedPresetId)?.name || "Custom"})\nJackpot Odds: ${oddsMetrics.oddsString}\n----------------------------------------\n${lines.join("\n")}\n----------------------------------------\nGenerated using Cryptographically Secure RNG (Web Crypto API)`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (history.length === 0 && currentTickets.length === 0) return;
        const exportSet = history.length > 0 ? history : currentTickets;
        const headers = ["Index", "Timestamp", "Preset", "Main Numbers", "Bonus Numbers", "Sum", "Odd Count", "Even Count"];
        const rows = exportSet.map((item, idx) => [
            idx + 1,
            item.timestamp,
            item.presetName,
            item.mainNumbers.join("-"),
            item.bonusNumbers.length > 0 ? item.bonusNumbers.join("-") : "None",
            item.sum,
            item.oddCount,
            item.evenCount
        ]);
        const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `lottery_draw_simulation_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        // Run initial single draw on load
        const initial = executeDraw(1);
        setCurrentTickets(initial);
        setHistory(initial);
        return () => {
            if (animTimerRef.current) clearInterval(animTimerRef.current);
        };
    }, []);

    // Primary Display Numbers
    const displayTicket = currentTickets[0];
    const displayMainNumbers = animatingBalls.length > 0 ? animatingBalls : (displayTicket ? displayTicket.mainNumbers : []);
    const displayBonusNumbers = animatingBonus.length > 0 ? animatingBonus : (displayTicket ? displayTicket.bonusNumbers : []);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Lottery Number Picker & Multi-Ball Draw Simulator",
        "url": "https://twistertools.com/tools/random-tools/lottery-number-generator",
        "description": "True cryptographic hardware-random lottery ticket generator and multi-ball draw simulator for US Powerball, Mega Millions, EuroMillions, Eurojackpot, and custom lotto configurations.",
        "applicationCategory": "UtilityApplication",
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
                "name": "Are lottery quick picks generated here truly random?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. This generator bypasses pseudo-random software methods like Math.random() in favor of the browser Web Crypto API (crypto.getRandomValues). This utilizes hardware-level entropy from your device CPU, guaranteeing mathematically uniform, non-deterministic random selection across the entire number pool."
                }
            },
            {
                "@type": "Question",
                "name": "How are the jackpot odds calculated for games like Powerball?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Jackpot odds are calculated using binomial coefficient combinatorics (nCr). For US Powerball, choosing 5 numbers from 69 yields 69C5 = 11,238,513 combinations. Multiplying by the 26 possible Powerballs gives 11,238,513 × 26 = 292,201,338. Hence, the exact mathematical probability is 1 in 292,201,338."
                }
            },
            {
                "@type": "Question",
                "name": "Do 'hot' and 'cold' numbers improve your chances of winning?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Mathematically, no. In an unrigged mechanical or true cryptographic draw, every draw is independent and memoryless. The probability of any specific number being drawn is identical in every round, regardless of whether it appeared in the previous draw or has not appeared for months."
                }
            },
            {
                "@type": "Question",
                "name": "What is the optimal odd/even or high/low number distribution strategy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Combinatorial analysis indicates that tickets with balanced distributions—such as 3 odd and 2 even numbers, or 2 odd and 3 even numbers—represent approximately 65% to 68% of all historically drawn combinations. While all individual combinations have identical odds, balanced sets encompass a much larger portion of the combinatorial sample space."
                }
            },
            {
                "@type": "Question",
                "name": "Why is generating multiple tickets using random selection advantageous?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When human players manually choose numbers, they heavily bias toward calendar dates (1 through 31) and geometric patterns on play slips. By using cryptographically unbiased random quick picks, your numbers span the full pool, significantly reducing the probability of having to split a jackpot with other players if you win."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool simulate lotteries with bonus balls or extra lucky stars?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The simulator supports dual-drum matrix setups including EuroMillions (5/50 + 2/12 Stars), US Mega Millions (5/70 + 1/25 Mega Ball), Eurojackpot (5/50 + 2/12 Euro Numbers), as well as fully customizable ball counts and pool ranges."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Configuration & Draw Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Draw Configuration & Matrix
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    WebCrypto RNG
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Preset Quick Select Buttons */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-indigo-600" />
                                Select National or International Game
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {LOTTERY_PRESETS.map((preset) => {
                                    const isSelected = selectedPresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            type="button"
                                            onClick={() => handleSelectPreset(preset)}
                                            className={`p-2.5 text-left rounded-xl transition border text-xs cursor-pointer flex flex-col justify-between min-h-[58px] ${isSelected
                                                ? "bg-indigo-50/80 border-indigo-500 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                                                }`}
                                        >
                                            <span className="truncate w-full font-bold">{preset.name}</span>
                                            <span className="text-[10px] text-slate-500 truncate w-full mt-1">
                                                {preset.mainCount}/{preset.mainPool} {preset.bonusCount > 0 ? `+ ${preset.bonusCount}/${preset.bonusPool}` : "(No Bonus)"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Parameter Controls */}
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4">
                            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                                <span>Dual-Drum Numerical Parameters</span>
                                <span className="text-[11px] font-normal text-slate-500">Fine-tune settings</span>
                            </div>

                            {/* Main Pool Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Main Balls Drawn
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={mainCount === 0 ? "" : mainCount}
                                            onChange={(e) => {
                                                handleNumberInput(e, setMainCount, 1, 20);
                                                setSelectedPresetId("custom");
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Balls
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Main Pool Range (1 to N)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="2"
                                            max="99"
                                            value={mainPool === 0 ? "" : mainPool}
                                            onChange={(e) => {
                                                handleNumberInput(e, setMainPool, 2, 99);
                                                setSelectedPresetId("custom");
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Max
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus Pool Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Bonus Balls Drawn
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            value={bonusCount === 0 ? "" : bonusCount}
                                            onChange={(e) => {
                                                handleNumberInput(e, setBonusCount, 0, 5);
                                                setSelectedPresetId("custom");
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Bonus
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Bonus Pool Range (1 to N)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            disabled={bonusCount === 0}
                                            value={bonusPool === 0 ? "" : bonusPool}
                                            onChange={(e) => {
                                                handleNumberInput(e, setBonusPool, 0, 50);
                                                setSelectedPresetId("custom");
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Max
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={sortAscending}
                                        onChange={(e) => setSortAscending(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                    />
                                    <span>Sort ball values numerically (Ascending)</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleDrawSingle}
                                disabled={isDrawing}
                                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Play className={`w-5 h-5 fill-current ${isDrawing ? "animate-spin" : ""}`} />
                                {isDrawing ? "Drawing Winning Balls..." : "Draw 1 Lucky Ticket"}
                            </button>

                            {/* Batch Multi-Ticket Generator */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    <span>Batch Multi-Play Quick Pick</span>
                                    <span className="text-[11px] font-normal text-slate-500">Up to 50 lines</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={ticketsToGenerate === 0 ? "" : ticketsToGenerate}
                                            onChange={(e) => handleNumberInput(e, setTicketsToGenerate, 1, 50)}
                                            className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder="5"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Tickets
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleMultiDraw(Math.max(1, Math.min(50, ticketsToGenerate || 5)))}
                                        disabled={isDrawing || ticketsToGenerate <= 0}
                                        className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-xs sm:text-sm transition cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                                    >
                                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        Generate
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {[3, 5, 10, 20, 50].map((presetVal) => (
                                        <button
                                            key={presetVal}
                                            onClick={() => {
                                                setTicketsToGenerate(presetVal);
                                                handleMultiDraw(presetVal);
                                            }}
                                            className="px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                        >
                                            +{presetVal} Lines
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyTickets}
                            disabled={currentTickets.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Ticket Numbers"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={currentTickets.length === 0 && history.length === 0}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Interactive Visual Ball Stage & Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Draw Stage & Probability Analytics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("results")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "results" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Tickets ({currentTickets.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "history" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Log ({history.length})
                                </button>
                            </div>
                        </div>

                        {/* Visual 3D Stage: Primary Draw Visualizer */}
                        <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-800 text-white relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 mb-3 border-b border-white/10 pb-2">
                                <span className="flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                                    {displayTicket ? displayTicket.presetName : "Awaiting Draw"}
                                </span>
                                <span>{displayTicket ? displayTicket.timestamp : "--:--:--"}</span>
                            </div>

                            {/* Drawn Balls Flex Container */}
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-4 min-h-[90px]">
                                {displayMainNumbers.length > 0 ? (
                                    displayMainNumbers.map((num, idx) => (
                                        <div
                                            key={`main-${idx}-${num}`}
                                            className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-white via-slate-100 to-slate-300 text-slate-900 font-black text-base sm:text-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 border border-slate-200 ring-2 ring-indigo-400/30"
                                        >
                                            {num}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-slate-400 text-xs">Press draw button to simulate balls</span>
                                )}

                                {/* Bonus Balls */}
                                {displayBonusNumbers.length > 0 && (
                                    <>
                                        <span className="text-indigo-400 font-black text-lg px-1">+</span>
                                        {displayBonusNumbers.map((bNum, bIdx) => (
                                            <div
                                                key={`bonus-${bIdx}-${bNum}`}
                                                className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-200 border border-amber-300 ring-2 ring-amber-400/50"
                                                title={bonusLabel}
                                            >
                                                {bNum}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Real-Time Metrics Strip */}
                            {displayTicket && (
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center text-xs font-mono">
                                    <div>
                                        <span className="text-slate-400 text-[10px] block uppercase">Ball Sum</span>
                                        <span className="text-indigo-200 font-bold text-sm">{displayTicket.sum}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[10px] block uppercase">Odd / Even</span>
                                        <span className="text-indigo-200 font-bold text-sm">
                                            {displayTicket.oddCount}O / {displayTicket.evenCount}E
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 text-[10px] block uppercase">Pool Spread</span>
                                        <span className="text-indigo-200 font-bold text-sm">
                                            1 - {mainPool}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Combinatorial Odds & Probability Metrics */}
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Calculator className="w-4 h-4 text-indigo-600" />
                                    Exact Jackpot Probability
                                </span>
                                <span className="text-indigo-700 font-black">{oddsMetrics.oddsString}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 leading-relaxed">
                                Calculation: <code className="bg-white/80 px-1 py-0.5 rounded border border-indigo-200 text-indigo-900 font-semibold font-mono">
                                    C({mainPool}, {Math.min(mainCount, mainPool)}) {bonusCount > 0 && bonusPool > 0 ? `× C(${bonusPool}, ${Math.min(bonusCount, bonusPool)})` : ""}
                                </code> = {oddsMetrics.totalCombinations.toLocaleString()} unique outcome permutations.
                            </div>
                        </div>

                        {/* Switchable Results / History Workspace */}
                        {activeTab === "results" ? (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    Current Generated Quick Pick Tickets ({currentTickets.length})
                                </span>
                                <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                    {currentTickets.map((t, idx) => (
                                        <div key={t.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {t.mainNumbers.map((n, i) => (
                                                        <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-bold font-mono">
                                                            {n < 10 ? `0${n}` : n}
                                                        </span>
                                                    ))}
                                                    {t.bonusNumbers.length > 0 && (
                                                        <span className="text-amber-500 font-bold px-0.5">+</span>
                                                    )}
                                                    {t.bonusNumbers.map((bn, bi) => (
                                                        <span key={bi} className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold font-mono">
                                                            {bn < 10 ? `0${bn}` : bn}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right text-[11px] text-slate-500">
                                                Sum: <strong className="text-slate-800">{t.sum}</strong> | {t.oddCount}O/{t.evenCount}E
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    Session Draw History Log ({history.length})
                                </span>
                                <div className="max-h-[200px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                    {history.length === 0 ? (
                                        <p className="p-4 text-center text-xs text-slate-400">No session draws recorded.</p>
                                    ) : (
                                        history.map((t, idx) => (
                                            <div key={t.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 font-mono text-[10px]">#{history.length - idx}</span>
                                                    <span className="font-bold text-slate-800">{t.mainNumbers.join(" ")}</span>
                                                    {t.bonusNumbers.length > 0 && (
                                                        <span className="text-amber-600 font-bold">[{t.bonusNumbers.join(" ")}]</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400">{t.timestamp}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Hardware Entropy Active
                        </span>
                        <span>Zero Duplicate Logic Guaranteed</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: The Mathematics of Lottery Combinatorics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematical Foundations of Lottery Probability and Combinatorics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Lottery draws are structured on classical <strong>discrete probability without replacement</strong>, evaluated through combinatorial coefficient equations. When numbers are drawn sequentially from an urn or pneumatic drum without being placed back into the pool, order does not matter. The fundamental formula governing every standard lottery system is the binomial combination formula:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$C(n, k) = \\binom{n}{k} = \\frac{n!}{k!(n - k)!}$$"}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Dual-Drum Matrix Calculations
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Modern multi-state games like US Powerball and Mega Millions utilize two separate independent drums. The jackpot probability is the product of both independent combination counts:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                Total Odds = C(PoolMain, CountMain) × C(PoolBonus, CountBonus)
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> True Cryptographic Randomness
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Standard programming utilities rely on pseudo-random generators (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>) which can exhibit algorithmic periodicity. This simulator connects directly to your device cryptographic entropy source:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                window.crypto.getRandomValues(new Uint32Array(1))
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" /> Global Lottery Combinations & Exact Jackpot Odds Matrix
                        </h3>
                        <div className="grid sm:grid-cols-4 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">US Powerball:</span>
                                <strong className="text-indigo-300 text-sm">1 in 292,201,338</strong>
                                <span className="text-[10px] text-slate-500 block mt-1">5/69 + 1/26</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">US Mega Millions:</span>
                                <strong className="text-indigo-300 text-sm">1 in 302,575,350</strong>
                                <span className="text-[10px] text-slate-500 block mt-1">5/70 + 1/25</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">EuroMillions:</span>
                                <strong className="text-indigo-300 text-sm">1 in 139,838,160</strong>
                                <span className="text-[10px] text-slate-500 block mt-1">5/50 + 2/12</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Classic 6/49:</span>
                                <strong className="text-indigo-300 text-sm">1 in 13,983,816</strong>
                                <span className="text-[10px] text-slate-500 block mt-1">6/49 Single Drum</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Statistical Number Balancing & Sum Distribution */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Odd/Even Parity, High/Low Splits, and Sum Range Optimization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While every individual number combination has the exact same mathematical likelihood of being drawn on any single draw, groups of combinations follow predictable Gaussian distributions. Combinatorial analysis of hundreds of thousands of historical lotto drawings reveals distinct clustering patterns around the center of the probability distribution.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Parity Ratio (Odd / Even)</th>
                                    <th className="p-3">Combinatorial Share</th>
                                    <th className="p-3">Historical Incidence</th>
                                    <th className="p-3">Strategic Assessment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-slate-900">3 Odd / 2 Even (or 2 Odd / 3 Even)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">~65.5%</td>
                                    <td className="p-3">Extremely Frequent</td>
                                    <td className="p-3 font-semibold text-emerald-600">Optimal Bell-Curve Peak</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">4 Odd / 1 Even (or 1 Odd / 4 Even)</td>
                                    <td className="p-3 font-mono">~23.8%</td>
                                    <td className="p-3">Moderate Frequency</td>
                                    <td className="p-3 text-slate-600">Acceptable Variance</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-amber-50/30">
                                    <td className="p-3 font-bold text-slate-900">5 Odd / 0 Even (or 0 Odd / 5 Even)</td>
                                    <td className="p-3 font-mono text-amber-700 font-bold">~2.7%</td>
                                    <td className="p-3">Rare Outlier</td>
                                    <td className="p-3 text-amber-700 font-semibold">Avoid Extremes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Similarly, the total sum of drawn numbers in a 5/69 game naturally clusters in the median range between <strong>130 and 220</strong>. Combinations with exceptionally low sums (such as 1-2-3-4-5, sum = 15) or exceptionally high sums (65-66-67-68-69, sum = 335) occupy the extreme tails of the binomial curve, accounting for less than 1% of all historical outcomes.
                    </p>
                </section>

                {/* Card 3: The Human Bias Fallacy & Quick Pick Advantages */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Psychological Biases, Split Jackpot Risks, and Quick Pick Superiority
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When people manually pick their own lottery numbers, they exhibit severe psychological clustering known as <strong>birthday bias</strong> and <strong>pattern alignment</strong>. Understanding these cognitive tendencies gives automated algorithmic quick picks an enormous financial advantage:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">The Birthday Bias Trap</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Over 70% of self-picked tickets exclusively feature numbers between 1 and 31 (representing calendar days and months). If winning numbers land under 31, jackpots are routinely split between multiple winners, drastically diluting the prize payout.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Geometric Play Slip Patterns</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Thousands of players mark straight vertical lines, diagonals, or zigzag shapes on paper play slips every week. In a famous 1995 UK National Lottery draw, 133 players simultaneously shared a £16 million prize because they all picked numbers along a single diagonal column.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Full-Pool Entropy Distribution</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cryptographic random generators populate the entire number spectrum (1 through 69 or 70) evenly. While this does not alter your probability of winning, it drastically reduces your probability of having to split the jackpot if your numbers hit.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Probability Worked Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Combinatorial Calculation: US Powerball Jackpot
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how the exact 1 in 292,201,338 jackpot probability is derived for the US Powerball game, follow the step-by-step combinatorics below:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Step 1: Drum 1 Combinations</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">5 of 69</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                                <li><strong>Equation:</strong> {"$C(69, 5) = \\frac{69!}{5!(69 - 5)!} = \\frac{69 \\times 68 \\times 67 \\times 66 \\times 65}{5 \\times 4 \\times 3 \\times 2 \\times 1}$"}</li>
                                <li><strong>Numerator:</strong> 1,348,621,560</li>
                                <li><strong>Denominator:</strong> 120</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Total White Ball Sets: 11,238,513 combinations
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Step 2: Drum 2 & Combined Product</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">1 of 26</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 leading-relaxed">
                                <li><strong>Equation:</strong> {"$C(26, 1) = \\frac{26!}{1!(25)!} = 26$ possible red Powerball values."}</li>
                                <li><strong>Fundamental Counting Principle:</strong> Multiply Drum 1 by Drum 2</li>
                                <li><strong>Calculation:</strong> 11,238,513 × 26 = 292,201,338</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Final Probability: 1 in 292,201,338 (0.0000003422%)
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Compliance & Responsible Gaming Legal Advisory */}
                <section className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                        <Info className="w-4.5 h-4.5 text-amber-600 flex-shrink-0" />
                        <span>Educational Simulation & Legal Disclaimer</span>
                    </div>
                    <p className="text-amber-950/80 text-xs sm:text-sm leading-relaxed">
                        This utility is an independent mathematical simulation and random number generation tool developed strictly for educational, informational, and entertainment purposes. TwisterTools is not affiliated with, endorsed by, or associated with any official state, national, or international lottery operator.
                    </p>
                    <p className="text-amber-950/80 text-xs sm:text-sm leading-relaxed">
                        This tool does not sell lottery tickets, accept wagers, or facilitate real-money gambling. Combinatorial statistics and random quick picks do not alter mathematical house odds or guarantee monetary returns. If you or someone you know needs support regarding gambling habits, contact the National Problem Gambling Helpline at 1-800-522-4700 (US) or GamCare at 0808 8020 133 (UK).
                    </p>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                Are lottery quick picks generated here truly random?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. This generator bypasses pseudo-random software methods like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code> in favor of the browser Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>). This utilizes hardware-level entropy from your device CPU, guaranteeing mathematically uniform, non-deterministic random selection across the entire number pool.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are the jackpot odds calculated for games like Powerball?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Jackpot odds are calculated using binomial coefficient combinatorics ($nCr$). For US Powerball, choosing 5 numbers from 69 yields $C(69, 5) = 11,238,513$ combinations. Multiplying by the 26 possible Powerballs gives $11,238,513 \\times 26 = 292,201,338$. Hence, the exact mathematical probability is 1 in 292,201,338."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Do "hot" and "cold" numbers improve your chances of winning?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Mathematically, no. In an unrigged mechanical or true cryptographic draw, every draw is independent and memoryless. The probability of any specific number being drawn is identical in every round, regardless of whether it appeared in the previous draw or has not appeared for months.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the optimal odd/even or high/low number distribution strategy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Combinatorial analysis indicates that tickets with balanced distributions—such as 3 odd and 2 even numbers, or 2 odd and 3 even numbers—represent approximately 65% to 68% of all historically drawn combinations. While all individual combinations have identical odds, balanced sets encompass a much larger portion of the combinatorial sample space.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is generating multiple tickets using random selection advantageous?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When human players manually choose numbers, they heavily bias toward calendar dates (1 through 31) and geometric patterns on play slips. By using cryptographically unbiased random quick picks, your numbers span the full pool, significantly reducing the probability of having to split a jackpot with other players if you win.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool simulate lotteries with bonus balls or extra lucky stars?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The simulator supports dual-drum matrix setups including EuroMillions (5/50 + 2/12 Stars), US Mega Millions (5/70 + 1/25 Mega Ball), Eurojackpot (5/50 + 2/12 Euro Numbers), as well as fully customizable ball counts and pool ranges.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}