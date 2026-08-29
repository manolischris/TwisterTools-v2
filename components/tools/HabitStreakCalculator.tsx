"use client";

import React, { useState, useMemo } from "react";
import {
    Flame,
    Target,
    Calendar,
    Sparkles,
    TrendingUp,
    Percent,
    SlidersHorizontal,
    CheckCircle2,
    Copy,
    Info,
    RotateCcw,
    Zap,
    Brain,
    HelpCircle,
    Activity,
    Workflow,
    BookOpen,
    Clock,
    Award,
    Dumbbell,
    Code,
    BookMarked,
    Smile,
    ShieldCheck
} from "lucide-react";

interface HabitPreset {
    name: string;
    habitType: string;
    currentStreak: number;
    targetDays: number;
    historicalRate: number;
    volatility: "low" | "medium" | "high";
    description: string;
}

const HABIT_PRESETS: HabitPreset[] = [
    {
        name: "Daily Deep Work / Coding",
        habitType: "Deep Work Sprint",
        currentStreak: 12,
        targetDays: 66,
        historicalRate: 85,
        volatility: "low",
        description: "Standard automaticity threshold for software architecture and deliberate practice"
    },
    {
        name: "Morning Fitness & Workout",
        habitType: "Exercise / Strength",
        currentStreak: 5,
        targetDays: 30,
        historicalRate: 75,
        volatility: "medium",
        description: "Physical conditioning target with moderate schedule disruption factors"
    },
    {
        name: "Daily Reading & Research",
        habitType: "Intellectual Growth",
        currentStreak: 21,
        targetDays: 100,
        historicalRate: 90,
        volatility: "low",
        description: "Low-friction habit with high baseline consistency and compounding benefits"
    },
    {
        name: "Meditation & Mindfulness",
        habitType: "Mental Well-being",
        currentStreak: 3,
        targetDays: 21,
        historicalRate: 65,
        volatility: "high",
        description: "Formative habit phase with high psychological inertia and initial friction"
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = 0,
    max = 3650
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(min);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

export default function HabitStreakCalculator() {
    const [habitName, setHabitName] = useState<string>("Daily Deep Coding Sprint");
    const [currentStreak, setCurrentStreak] = useState<number>(14);
    const [targetDays, setTargetDays] = useState<number>(66);
    const [historicalRate, setHistoricalRate] = useState<number>(85);
    const [skipAllowance, setSkipAllowance] = useState<number>(2);
    const [volatility, setVolatility] = useState<"low" | "medium" | "high">("medium");

    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    // Mathematical calculations for streak dynamics and probability
    const analytics = useMemo(() => {
        const remainingDays = Math.max(0, targetDays - currentStreak);
        const progressPct = targetDays > 0 ? Math.min(100, (currentStreak / targetDays) * 100) : 0;
        const pSuccess = Math.min(0.99, Math.max(0.01, historicalRate / 100));

        // Volatility damping factor
        const volatilityFactor = volatility === "low" ? 0.98 : volatility === "medium" ? 0.92 : 0.82;
        const adjustedP = pSuccess * volatilityFactor;

        // Cumulative probability model allowing for 'k' skips: P(X >= n - k)
        // Using Binomial approximation or cumulative product
        let streakProb = 0;
        if (remainingDays === 0) {
            streakProb = 100;
        } else {
            // Unbroken streak: p^n
            const unbrokenProb = Math.pow(adjustedP, remainingDays);

            // Streak with skip allowance (Binomial cumulative sum)
            let withSkipsProb = 0;
            const n = remainingDays;
            const k = Math.min(skipAllowance, remainingDays);

            for (let i = 0; i <= k; i++) {
                // Combination formula: n! / (i! * (n-i)!)
                let comb = 1;
                for (let c = 1; c <= i; c++) {
                    comb = (comb * (n - c + 1)) / c;
                }
                const termProb = comb * Math.pow(adjustedP, n - i) * Math.pow(1 - adjustedP, i);
                withSkipsProb += termProb;
            }

            streakProb = Math.min(99.9, Math.max(0.1, withSkipsProb * 100));
        }

        // Expected Days to Reach Target based on Expected Value: n / p
        const expectedTotalDays = remainingDays === 0
            ? currentStreak
            : currentStreak + Math.round(remainingDays / Math.max(0.1, adjustedP));

        // Habit Automaticity Score based on Lally et al. 66-day baseline
        const automaticityScore = Math.min(100, Math.round((currentStreak / 66) * 100));

        // Milestones
        const milestones = [
            { label: "7-Day Kickstart", days: 7, achieved: currentStreak >= 7 },
            { label: "21-Day Neural Imprint", days: 21, achieved: currentStreak >= 21 },
            { label: "66-Day Automaticity Standard", days: 66, achieved: currentStreak >= 66 },
            { label: "100-Day Mastery Crucible", days: 100, achieved: currentStreak >= 100 },
            { label: "365-Day Lifestyle Lock", days: 365, achieved: currentStreak >= 365 }
        ];

        return {
            remainingDays,
            progressPct,
            unbrokenProbability: remainingDays === 0 ? 100 : Math.min(99.9, Math.max(0.1, Math.pow(adjustedP, remainingDays) * 100)),
            resilientProbability: streakProb,
            expectedTotalDays,
            automaticityScore,
            milestones
        };
    }, [currentStreak, targetDays, historicalRate, skipAllowance, volatility]);

    const applyPreset = (preset: HabitPreset) => {
        setHabitName(preset.habitType);
        setCurrentStreak(preset.currentStreak);
        setTargetDays(preset.targetDays);
        setHistoricalRate(preset.historicalRate);
        setVolatility(preset.volatility);
    };

    const handleReset = () => {
        setHabitName("Daily Deep Coding Sprint");
        setCurrentStreak(0);
        setTargetDays(66);
        setHistoricalRate(85);
        setSkipAllowance(2);
        setVolatility("medium");
    };

    const copyReport = () => {
        const text = `Habit Streak & Goal Probability Forecast
------------------------------------------------
Habit: ${habitName}
Current Streak: ${currentStreak} days
Target Goal: ${targetDays} days (${analytics.remainingDays} days remaining)
Consistency Rate: ${historicalRate}%
Success Probability (with ${skipAllowance} skip buffer): ${analytics.resilientProbability.toFixed(1)}%
Unbroken Strict Streak Probability: ${analytics.unbrokenProbability.toFixed(1)}%
Habit Automaticity Index: ${analytics.automaticityScore}% (Based on UCL 66-Day Model)
Projected Completion Timeline: ~${analytics.expectedTotalDays} total elapsed days
------------------------------------------------
Calculated with TwisterTools Habit Streak & Target Goal Probability Engine`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Habit Tracker Streak & Target Goal Probability Calculator",
        "url": "https://twistertools.com/tools/date-tools/habit-streak-calculator",
        "description": "Scientific habit streak calculator and target goal probability engine based on UCL automaticity research and binomial consistency modeling.",
        "applicationCategory": "ProductivityApplication",
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
                "name": "How long does it actually take to form a permanent habit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While popular culture often quotes the 21-day myth from Dr. Maxwell Maltz, seminal research by Dr. Phillippa Lally at University College London (UCL) revealed that it takes an average of 66 days for a new behavior to reach automaticity. The realistic range spans from 18 to 254 days depending on cognitive complexity, environmental friction, and neurological rewards."
                }
            },
            {
                "@type": "Question",
                "name": "How does the probability calculator estimate goal success?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The calculator applies a binomial probability distribution adjusted for real-world environmental volatility and a user-defined skip allowance. It computes the compounding likelihood of completing the remaining required days given your historical consistency rate and risk profile."
                }
            },
            {
                "@type": "Question",
                "name": "Does missing a single day destroy habit automaticity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The landmark 2009 UCL habit study conclusively proved that missing a single day does not statistically affect the long-term rate of habit formation, provided the behavior resumes the next day. The famous 'Never Miss Twice' rule leverages this principle to prevent cognitive surrender."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a strict streak and an elastic streak?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A strict streak demands unbroken 100% daily execution without exception. An elastic streak incorporates deliberate buffer days or skip allowances (e.g., 2 emergency passes per month), which prevents the 'what-the-hell effect' where a minor lapse leads to complete behavioral abandonment."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the 66-day automaticity plateau significant?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 66-day mark represents the asymptotic plateau where behavioral self-control expenditure reaches its lowest steady state. Beyond this threshold, performing the habit requires minimal prefrontal executive effort and becomes an instinctual basal ganglia routine."
                }
            },
            {
                "@type": "Question",
                "name": "How can I improve my habit completion probability?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To increase completion probability, reduce initial behavioral friction (the 2-minute rule), utilize implementation intentions ('If X happens, then I will do Y'), anchor the new habit to an existing automated anchor routine (habit stacking), and track progress with immediate visual feedback."
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

                {/* Left Workspace Panel: Input Parameters & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Config Header */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                                Habit Model Configuration
                            </span>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200 cursor-pointer shadow-xs"
                                title="Reset all fields"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Reset</span>
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Quick Habit Presets
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {HABIT_PRESETS.map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/60 hover:border-indigo-300 text-left transition cursor-pointer group"
                                    >
                                        <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                                            {p.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 font-mono">
                                            {p.currentStreak}d / {p.targetDays}d &bull; {p.historicalRate}%
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Habit Title Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Habit or Target Behavioral Routine
                            </label>
                            <input
                                type="text"
                                value={habitName}
                                onChange={(e) => setHabitName(e.target.value)}
                                placeholder="e.g., Morning Workout, Deep Work, Reading..."
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            />
                        </div>

                        {/* Numerical Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Current Streak */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700">Current Streak (Days)</label>
                                    <span className="text-[11px] font-mono text-indigo-600 font-bold">{currentStreak} days</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={0}
                                        max={3650}
                                        value={currentStreak}
                                        onChange={(e) => handleNumberInput(e, setCurrentStreak, 0, 3650)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                    <Flame className="w-4 h-4 text-amber-500 absolute right-3 top-3 pointer-events-none" />
                                </div>
                            </div>

                            {/* Target Milestone */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-700">Target Goal (Days)</label>
                                    <span className="text-[11px] font-mono text-indigo-600 font-bold">{targetDays} days</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        max={3650}
                                        value={targetDays}
                                        onChange={(e) => handleNumberInput(e, setTargetDays, 1, 3650)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                    <Target className="w-4 h-4 text-indigo-500 absolute right-3 top-3 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Slider: Historical Consistency Rate */}
                        <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                    <Percent className="w-3.5 h-3.5 text-indigo-500" />
                                    Estimated Consistency Rate
                                </span>
                                <span className="font-mono text-indigo-600 font-black">{historicalRate}%</span>
                            </div>
                            <input
                                type="range"
                                min={30}
                                max={99}
                                step={1}
                                value={historicalRate}
                                onChange={(e) => setHistoricalRate(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                <span>30% (High Friction)</span>
                                <span>75% (Realistic)</span>
                                <span>99% (Machine Routine)</span>
                            </div>
                        </div>

                        {/* Modifiers: Skip Buffer & Schedule Volatility */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Skip Allowance Buffer */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Allowed Buffer Skips</span>
                                    <span className="font-mono text-indigo-600">{skipAllowance} days</span>
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={30}
                                    value={skipAllowance}
                                    onChange={(e) => handleNumberInput(e, setSkipAllowance, 0, 30)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                                <span className="text-[10px] text-slate-500 block">Emergency skips without breaking habit resolve</span>
                            </div>

                            {/* Environmental Volatility */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Schedule Volatility
                                </label>
                                <select
                                    value={volatility}
                                    onChange={(e) => setVolatility(e.target.value as "low" | "medium" | "high")}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                                >
                                    <option value="low">Low (Stable daily routine)</option>
                                    <option value="medium">Medium (Standard life variance)</option>
                                    <option value="high">High (Frequent travel & chaos)</option>
                                </select>
                                <span className="text-[10px] text-slate-500 block">Unpredictability of daily environment</span>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Model: UCL 66-Day Empirical Habit Algorithm
                        </span>
                        <span className="font-semibold text-emerald-600">Client-Side Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Statistical Projections & Automaticity Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Probability Visualizer Hero */}
                        <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl relative overflow-hidden shadow-md">
                            <div className="relative z-10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-amber-400" />
                                        Goal Achievement Probability
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                                        {analytics.remainingDays} days to target
                                    </span>
                                </div>

                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                                        {analytics.resilientProbability.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-indigo-200">
                                        chance with {skipAllowance} skip buffer
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between text-xs text-indigo-200 font-semibold">
                                        <span>Streak Progress ({currentStreak} / {targetDays}d)</span>
                                        <span>{analytics.progressPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${analytics.progressPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Core Analytical Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Unbroken Prob</span>
                                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                                    {analytics.unbrokenProbability.toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">0 skips allowed</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Automaticity</span>
                                <span className="text-lg sm:text-xl font-black text-indigo-600 font-mono">
                                    {analytics.automaticityScore}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">66-day baseline</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Expected Total</span>
                                <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
                                    ~{analytics.expectedTotalDays}d
                                </span>
                                <span className="text-[10px] text-slate-400 block">calendar span</span>
                            </div>
                        </div>

                        {/* Milestone Roadmap Ladder */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Award className="w-4 h-4 text-indigo-600" />
                                    Neurological Habit Milestones
                                </h3>
                                <span className="text-xs font-semibold text-slate-500">
                                    {analytics.milestones.filter(m => m.achieved).length}/{analytics.milestones.length} Reached
                                </span>
                            </div>

                            <div className="space-y-2">
                                {analytics.milestones.map((m) => (
                                    <div
                                        key={m.label}
                                        className={`p-2.5 rounded-xl border flex items-center justify-between transition ${m.achieved
                                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                                            : "bg-slate-50/70 border-slate-200 text-slate-600"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${m.achieved ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                                }`}>
                                                {m.achieved ? "✓" : "•"}
                                            </div>
                                            <span className="text-xs font-bold">{m.label}</span>
                                        </div>
                                        <div className="text-xs font-mono font-semibold">
                                            {m.days} days
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Copy Full Report Action Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={copyReport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "Habit Probability Report Copied!" : "Copy Habit Forecast & Analytics Report"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: The Mathematics and Neuroscience of Habit Formation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Habit Formation: Deconstructing the 66-Day Automaticity Curve
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For decades, popular self-help literature propagated the myth that a new habit requires exactly 21 days to form. This misconception originated from Dr. Maxwell Maltz&apos;s 1960 book <em>Psycho-Cybernetics</em>, which observed that amputee patients required approximately 21 days to adjust to the loss of a limb. However, modern behavioral neuroscience paints a far more rigorous, empirical picture.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In a landmark 2009 study conducted at University College London (UCL), Dr. Phillippa Lally and her research team tracked 96 participants performing newly chosen daily health and lifestyle habits over 84 days. The study determined that it takes an average of <strong>66 days</strong> for a new behavior to become an automated routine—defined as reaching the asymptote of the Self-Report Habit Index (SRHI) curve where mental effort reaches its minimal plateau.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Phase I: Initiation (Days 1–21)</span>
                            <h3 className="font-bold text-slate-900 text-sm">High Prefrontal Activation</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Requires active conscious override and maximum executive willpower. Vulnerability to friction and schedule interruptions is highest during this formative window.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Phase II: Consolidation (Days 22–65)</span>
                            <h3 className="font-bold text-slate-900 text-sm">Basal Ganglia Synaptic Wiring</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Repetition triggers long-term potentiation in the striatum. The behavioral trigger shifts from deliberate intention to contextual environmental cues.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Phase III: Automaticity (Days 66+)</span>
                            <h3 className="font-bold text-slate-900 text-sm">Autonomous Routine Plateau</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The habit becomes default cognitive programming. Performing the action requires minimal mental energy, and skipping it creates psychological friction.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Habit Archetypes & Automaticity Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Habit Complexity Matrix: Automaticity Timelines by Cognitive Demand
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The time required to lock in a habit correlates directly with its intrinsic friction, required physical exertion, and cognitive bandwidth. The matrix below benchmarks expected automaticity thresholds across common behavioral domains:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Habit Category</th>
                                    <th className="p-3">Example Action</th>
                                    <th className="p-3">Avg Days to Automaticity</th>
                                    <th className="p-3">Friction Level</th>
                                    <th className="p-3">Key Failure Mechanism</th>
                                    <th className="p-3">Primary Defense Strategy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hydration & Micro-habits</td>
                                    <td className="p-3 text-slate-700">Drinking 500ml water upon waking</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">18 – 25 Days</td>
                                    <td className="p-3 text-xs text-emerald-600 font-bold">Very Low</td>
                                    <td className="p-3 text-xs text-slate-600">Lack of visual cue</td>
                                    <td className="p-3 text-xs text-slate-600">Place water bottle on bedside table the night before</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Intellectual & Reading</td>
                                    <td className="p-3 text-slate-700">Reading 20 pages of non-fiction</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">45 – 60 Days</td>
                                    <td className="p-3 text-xs text-indigo-600 font-bold">Moderate</td>
                                    <td className="p-3 text-xs text-slate-600">Digital doomscrolling distraction</td>
                                    <td className="p-3 text-xs text-slate-600">Timebox during evening wind-down routine</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Deep Work & Coding</td>
                                    <td className="p-3 text-slate-700">60-minute uninterrupted coding sprint</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">66 – 90 Days</td>
                                    <td className="p-3 text-xs text-amber-600 font-bold">High</td>
                                    <td className="p-3 text-xs text-slate-600">Context switching & notifications</td>
                                    <td className="p-3 text-xs text-slate-600">Calendar blocking & app blocking shields</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">High-Intensity Fitness</td>
                                    <td className="p-3 text-slate-700">45-minute gym strength workout</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">90 – 180 Days</td>
                                    <td className="p-3 text-xs text-rose-600 font-bold">Very High</td>
                                    <td className="p-3 text-xs text-slate-600">Muscle soreness & fatigue inertia</td>
                                    <td className="p-3 text-xs text-slate-600">Pack workout bag and lay out clothing prior evening</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Mindfulness & Meditation</td>
                                    <td className="p-3 text-slate-700">15 minutes breathwork / Zazen</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">60 – 75 Days</td>
                                    <td className="p-3 text-xs text-amber-600 font-bold">Moderate-High</td>
                                    <td className="p-3 text-xs text-slate-600">Impatience & lack of tangible instant reward</td>
                                    <td className="p-3 text-xs text-slate-600">Habit stacking right after morning coffee</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: The Psychology of Streaks & The "Never Miss Twice" Rule */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Streak Psychology: Mitigating the &quot;What-the-Hell&quot; Effect and Elastic Habit Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While streak tracking is one of the most potent behavioral reinforcement mechanisms in psychology, rigid streaks carry an inherent psychological vulnerability: <strong>The What-the-Hell Effect</strong> (counter-regulatory eating / behavioral abandonment). When an individual strictly views success as a 100% unbroken chain, a single missed day causes psychological collapse, leading them to abandon the habit altogether.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Workflow className="w-4 h-4 text-indigo-600" /> The &quot;Never Miss Twice&quot; Heuristic
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Popularized by James Clear in <em>Atomic Habits</em> and backed by UCL empirical data, missing a single day does not impair long-term neurological automaticity if the behavior resumes immediately on day two. Missing twice, however, initiates the formation of a counter-habit.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Elastic Buffer Allowances
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Incorporating a predetermined skip buffer (such as 2 emergency passes per month) preserves intrinsic motivation and eliminates catastrophic cognitive framing, drastically increasing the cumulative mathematical probability of achieving multi-month goals.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Behavioral Engineering Framework */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Engineering Unbreakable Habits: The 4-Law Implementation Framework
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To optimize your habit completion probability and navigate the 66-day journey smoothly, structure your target behavior according to these four core behavioral engineering laws:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Cue Design & Implementation Intentions</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Eliminate ambiguity by formulating exact implementation intentions: &quot;I will [ACTION] at [TIME] in [LOCATION].&quot; Couple this with visual cues in your primary physical environment to trigger automatic cue detection.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Habit Stacking & Behavioral Anchoring</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Anchor your new target habit onto an already automated baseline routine. For instance: &quot;Immediately after pouring my morning coffee, I will open VS Code and review one pull request.&quot;
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">The 2-Minute Friction Minimization Rule</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    During the first 21 days, scale down the habit so that it can be initiated in less than 2 minutes (e.g., &quot;Read 1 page&quot; instead of &quot;Read for an hour&quot;). Master the art of showing up before optimizing the intensity of the workout.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Visual Streak Reinforcement & Immediate Rewards</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    The human brain prioritizes immediate neurological feedback over delayed future outcomes. Tracking your daily checkmark or updating this streak calculator provides instant dopamine reinforcement that sustains momentum until intrinsic automaticity takes over.
                                </p>
                            </div>
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
                                How long does it actually take to form a permanent habit?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While popular culture often quotes the 21-day myth from Dr. Maxwell Maltz, seminal research by Dr. Phillippa Lally at University College London (UCL) revealed that it takes an average of 66 days for a new behavior to reach automaticity. The realistic range spans from 18 to 254 days depending on cognitive complexity, environmental friction, and neurological rewards.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the probability calculator estimate goal success?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The calculator applies a binomial probability distribution adjusted for real-world environmental volatility and a user-defined skip allowance. It computes the compounding likelihood of completing the remaining required days given your historical consistency rate and risk profile.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does missing a single day destroy habit automaticity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The landmark 2009 UCL habit study conclusively proved that missing a single day does not statistically affect the long-term rate of habit formation, provided the behavior resumes the next day. The famous &quot;Never Miss Twice&quot; rule leverages this principle to prevent cognitive surrender.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a strict streak and an elastic streak?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A strict streak demands unbroken 100% daily execution without exception. An elastic streak incorporates deliberate buffer days or skip allowances (e.g., 2 emergency passes per month), which prevents the &quot;what-the-hell effect&quot; where a minor lapse leads to complete behavioral abandonment.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the 66-day automaticity plateau significant?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 66-day mark represents the asymptotic plateau where behavioral self-control expenditure reaches its lowest steady state. Beyond this threshold, performing the habit requires minimal prefrontal executive effort and becomes an instinctual basal ganglia routine.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I improve my habit completion probability?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To increase completion probability, reduce initial behavioral friction (the 2-minute rule), utilize implementation intentions (&quot;If X happens, then I will do Y&quot;), anchor the new habit to an existing automated anchor routine (habit stacking), and track progress with immediate visual feedback.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}