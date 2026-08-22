"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Moon,
    Sun,
    Clock,
    BedDouble,
    Sparkles,
    Copy,
    Check,
    Download,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    BookOpen,
    HelpCircle,
    Layers,
    Lightbulb,
    Target,
    Zap,
    Coffee,
    Activity,
    CheckCircle2,
    CalendarCheck
} from "lucide-react";

type CalculationMode = "wake_up" | "fall_asleep" | "sleep_now" | "power_nap";

interface PresetTarget {
    id: string;
    label: string;
    mode: CalculationMode;
    time: string;
    latency: number;
    tag: string;
}

const PRESETS: PresetTarget[] = [
    { id: "workday-wake", label: "Workday Wakeup (6:30 AM)", mode: "wake_up", time: "06:30", latency: 15, tag: "Early Riser" },
    { id: "student-wake", label: "Campus Schedule (8:00 AM)", mode: "wake_up", time: "08:00", latency: 15, tag: "Standard" },
    { id: "standard-bed", label: "Fixed Bedtime (10:30 PM)", mode: "fall_asleep", time: "22:30", latency: 15, tag: "Night Routine" },
    { id: "nap-boost", label: "Power Nap Now", mode: "sleep_now", time: "", latency: 10, tag: "Midday Reset" }
];

interface SleepCycleResult {
    cycles: number;
    bedtimeDisplay: string;
    wakeDisplay: string;
    totalSleepMinutes: number;
    sleepHoursFormatted: string;
    stageQuality: "Optimal (5-6 cycles)" | "Adequate (4 cycles)" | "Short Rest (3 cycles)" | "Power Nap (1-2 cycles)";
    efficiencyScore: number;
    recommended: boolean;
    description: string;
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
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

const formatTime12h = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesStr} ${ampm}`;
};

export default function SleepCycleCalculator() {
    // Mode States
    const [mode, setMode] = useState<CalculationMode>("wake_up");
    const [targetTime, setTargetTime] = useState<string>("07:00");
    const [sleepLatency, setSleepLatency] = useState<number>(14); // Average onset is ~14 min
    const [cycleDuration, setCycleDuration] = useState<number>(90); // 90 min ultradian cycle standard
    const [activeTab, setActiveTab] = useState<"cycles" | "architecture">("cycles");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Compute Target Results based on Ultradian 90-min Sleep Cycles
    const calculatedCycles = useMemo<SleepCycleResult[]>(() => {
        const results: SleepCycleResult[] = [];
        const baseCycleMinutes = cycleDuration || 90;
        const latency = sleepLatency || 0;

        let baseDate = new Date();

        if (mode === "sleep_now") {
            baseDate = new Date();
        } else {
            const [hoursStr, minutesStr] = targetTime.split(":");
            const hours = parseInt(hoursStr, 10) || 0;
            const minutes = parseInt(minutesStr, 10) || 0;
            baseDate.setHours(hours, minutes, 0, 0);
        }

        // Standard cycle iterations: 6 cycles down to 1 cycle
        const cycleCounts = [6, 5, 4, 3, 2, 1];

        cycleCounts.forEach((cycles) => {
            const cycleSleepMinutes = cycles * baseCycleMinutes;
            const totalRequiredMinutes = cycleSleepMinutes + latency;

            let resultBedtime: Date;
            let resultWakeTime: Date;

            if (mode === "wake_up") {
                // Working backwards: Target is wake up time
                resultWakeTime = new Date(baseDate);
                resultBedtime = new Date(baseDate.getTime() - totalRequiredMinutes * 60 * 1000);
            } else {
                // Working forwards: Target is bedtime or current time
                resultBedtime = new Date(baseDate);
                resultWakeTime = new Date(baseDate.getTime() + totalRequiredMinutes * 60 * 1000);
            }

            const hours = Math.floor(cycleSleepMinutes / 60);
            const mins = cycleSleepMinutes % 60;
            const hoursFormatted = mins > 0 ? `${hours}h ${mins}m` : `${hours}h 00m`;

            let stageQuality: SleepCycleResult["stageQuality"] = "Short Rest (3 cycles)";
            let score = 65;
            let recommended = false;
            let description = "Minimum restorative rest; suitable only for occasional recovery.";

            if (cycles >= 5) {
                stageQuality = "Optimal (5-6 cycles)";
                score = cycles === 5 ? 98 : 95;
                recommended = cycles === 5;
                description = cycles === 5
                    ? "Peak recovery balance: 7.5 hours of core sleep + full REM and SWS cycles."
                    : "Complete 9-hour restorative duration recommended for athletes and adolescents.";
            } else if (cycles === 4) {
                stageQuality = "Adequate (4 cycles)";
                score = 82;
                recommended = false;
                description = "Viable 6-hour sleep baseline; sufficient for maintenance without severe sleep inertia.";
            } else if (cycles <= 2) {
                stageQuality = "Power Nap (1-2 cycles)";
                score = cycles === 1 ? 75 : 70;
                recommended = false;
                description = "Ultradian midday reset to purge adenosine without entering groggy deep sleep.";
            }

            results.push({
                cycles,
                bedtimeDisplay: formatTime12h(resultBedtime),
                wakeDisplay: formatTime12h(resultWakeTime),
                totalSleepMinutes: cycleSleepMinutes,
                sleepHoursFormatted: hoursFormatted,
                stageQuality,
                efficiencyScore: score,
                recommended,
                description
            });
        });

        return results;
    }, [mode, targetTime, sleepLatency, cycleDuration]);

    if (!mounted) {
        return null;
    }

    const handlePresetClick = (preset: PresetTarget) => {
        setMode(preset.mode);
        if (preset.time) setTargetTime(preset.time);
        setSleepLatency(preset.latency);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setMode("wake_up");
        setTargetTime("07:00");
        setSleepLatency(14);
        setCycleDuration(90);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const topPick = calculatedCycles.find((c) => c.recommended) || calculatedCycles[1];
        const summaryText = `Sleep Cycle & Optimal Bedtime Schedule (TwisterTools):
--------------------------------------------------
Calculation Mode: ${mode.replace("_", " ").toUpperCase()}
Selected Target Time: ${mode === "sleep_now" ? "Immediate Fall-Asleep" : targetTime}
Average Sleep Latency: ${sleepLatency} Minutes
Cycle Duration: ${cycleDuration} Minutes
--------------------------------------------------
Optimal Target (5 Cycles / 7.5h):
• Bedtime: ${topPick.bedtimeDisplay}
• Wake Time: ${topPick.wakeDisplay}
• Total Sleep Duration: ${topPick.sleepHoursFormatted}
• Sleep Efficiency Score: ${topPick.efficiencyScore}/100
--------------------------------------------------
All Calculated Windows:
${calculatedCycles.map(c => `• ${c.cycles} Cycles (${c.sleepHoursFormatted}): Bed at ${c.bedtimeDisplay} -> Wake at ${c.wakeDisplay}`).join("\n")}
--------------------------------------------------
Calculate at twistertools.com/tools/calculators/sleep-cycle-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Cycles", "Bedtime", "Wake Time", "Sleep Duration", "Quality Stage", "Efficiency Score"];
        const rows = calculatedCycles.map((c) => [
            `${c.cycles} Cycles`,
            c.bedtimeDisplay,
            c.wakeDisplay,
            c.sleepHoursFormatted,
            c.stageQuality,
            `${c.efficiencyScore}/100`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `sleep_cycle_schedule.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Sleep Cycle & Optimal Bedtime REM Calculator",
        "url": "https://twistertools.com/tools/calculators/sleep-cycle-calculator",
        "description": "Calculate optimal bedtimes, wake-up schedules, and REM sleep cycles based on 90-minute ultradian rhythms and personal sleep latency.",
        "applicationCategory": "HealthApplication",
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
                "name": "How long is a human sleep cycle on average?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard human sleep cycle lasts approximately 90 to 110 minutes (averaging 90 minutes). During this time, the brain transitions through Light Sleep (NREM 1 & 2), Slow-Wave Deep Sleep (NREM 3), and Rapid Eye Movement (REM) sleep."
                }
            },
            {
                "@type": "Question",
                "name": "Why is waking up at the end of a sleep cycle important?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Waking up midway through deep Slow-Wave Sleep causes intense sleep inertia, grogginess, and cognitive haze. Waking at the end of a 90-minute cycle ensures awakening during lighter sleep phases, promoting alert mornings."
                }
            },
            {
                "@type": "Question",
                "name": "What is sleep latency, and why should it be factored in?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sleep latency is the time it takes to transition from full wakefulness to light sleep. The clinical average for healthy adults is 10 to 20 minutes. Calculating sleep cycles without factoring latency causes misaligned awakenings."
                }
            },
            {
                "@type": "Question",
                "name": "How many sleep cycles are recommended per night?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most healthy adults require 5 complete sleep cycles (7.5 hours) or 6 cycles (9.0 hours) per night to achieve cellular repair, memory consolidation, and hormonal stabilization."
                }
            },
            {
                "@type": "Question",
                "name": "How does a 90-minute cycle calculator differ from standard 8-hour rule?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An arbitrary 8-hour sleep duration (480 minutes) equals 5.33 cycles. This often forces an alarm to interrupt deep Stage 3 NREM sleep, leaving you feeling exhausted despite technically clocking eight hours in bed."
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
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5 flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
                                    Sleep Timing Controls
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                                    Circadian Engine 2.0
                                </span>
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Calculation Goal Mode */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculation Target Strategy
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => { setMode("wake_up"); setActivePresetId(null); }}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${mode === "wake_up"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Sun className="w-3.5 h-3.5" />
                                    I have to wake at
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode("fall_asleep"); setActivePresetId(null); }}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${mode === "fall_asleep"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <BedDouble className="w-3.5 h-3.5" />
                                    I plan to sleep at
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode("sleep_now"); setActivePresetId(null); }}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${mode === "sleep_now"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Moon className="w-3.5 h-3.5" />
                                    Sleep Right Now
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Target Time Picker (if not Sleep Right Now) */}
                            {mode !== "sleep_now" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <CalendarCheck className="w-4 h-4 text-indigo-600" />
                                        {mode === "wake_up" ? "Target Wake Up Time" : "Scheduled Bedtime"}
                                    </label>
                                    <input
                                        type="time"
                                        value={targetTime}
                                        onChange={(e) => { setTargetTime(e.target.value); setActivePresetId(null); }}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 shadow-inner"
                                    />
                                </div>
                            )}

                            {/* Sleep Latency (Minutes to Fall Asleep) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Activity className="w-4 h-4 text-indigo-600" />
                                        Sleep Latency (Time to Fall Asleep)
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        {sleepLatency} Minutes
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max="90"
                                        value={sleepLatency === 0 ? "" : sleepLatency}
                                        onChange={(e) => { handleNumberInput(e, (val) => setSleepLatency(Math.max(0, Math.min(90, val)))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="e.g. 14"
                                    />
                                    <div className="flex items-center gap-1.5">
                                        {[10, 15, 20].map((quickVal) => (
                                            <button
                                                key={quickVal}
                                                type="button"
                                                onClick={() => setSleepLatency(quickVal)}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${sleepLatency === quickVal
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {quickVal}m
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    Clinical average is 14 minutes. Set higher if you experience prolonged onset latency.
                                </p>
                            </div>

                            {/* Cycle Duration Fine-Tuning */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Zap className="w-4 h-4 text-indigo-600" />
                                        Ultradian Cycle Length
                                    </label>
                                    <span className="text-xs font-bold text-slate-700">
                                        {cycleDuration} min/cycle
                                    </span>
                                </div>
                                <select
                                    value={cycleDuration}
                                    onChange={(e) => setCycleDuration(parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value={85}>85 Minutes (Short Cycle Profile)</option>
                                    <option value={90}>90 Minutes (Standard Scientific Default)</option>
                                    <option value={95}>95 Minutes (Extended Deep NREM Profile)</option>
                                    <option value={100}>100 Minutes (Longer Sleep Cycle Window)</option>
                                </select>
                            </div>
                        </div>

                        {/* Presets Row */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Routine Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => handlePresetClick(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Routine" : "Copy Sleep Routine"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Windows */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-600" />
                                Calculated Optimal Windows
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("cycles")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "cycles" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Target Windows
                                </button>
                                <button
                                    onClick={() => setActiveTab("architecture")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "architecture" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Sleep Stages
                                </button>
                            </div>
                        </div>

                        {/* Top Recommended Hero Card */}
                        {calculatedCycles.length > 0 && (
                            <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 shadow-xs relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-indigo-600" />
                                        Primary Recommendation (5 Cycles)
                                    </span>
                                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        98% Quality Score
                                    </span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-4 items-center">
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                            {mode === "wake_up" ? "Target Bedtime" : "Target Wake Time"}
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-indigo-950 mt-0.5">
                                            {mode === "wake_up" ? calculatedCycles[1].bedtimeDisplay : calculatedCycles[1].wakeDisplay}
                                        </div>
                                    </div>
                                    <div className="border-l border-indigo-100 pl-4 space-y-1">
                                        <div className="text-xs font-semibold text-slate-700">
                                            <strong>Duration:</strong> {calculatedCycles[1].sleepHoursFormatted}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-700">
                                            <strong>Includes:</strong> {sleepLatency}m latency
                                        </div>
                                        <div className="text-[11px] text-indigo-600 font-bold">
                                            Zero Grogginess Awakening
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Tab View */}
                        {activeTab === "cycles" ? (
                            <div className="space-y-2.5">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                    All Calculated Sleep Cycles:
                                </span>
                                <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {calculatedCycles.map((cycle) => {
                                        const isHighlight = cycle.cycles === 5 || cycle.cycles === 6;
                                        return (
                                            <div
                                                key={cycle.cycles}
                                                className={`p-3.5 rounded-xl border transition flex items-center justify-between ${isHighlight
                                                    ? "bg-slate-50 border-indigo-200 hover:border-indigo-300"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-extrabold text-sm text-slate-900">
                                                            {mode === "wake_up" ? cycle.bedtimeDisplay : cycle.wakeDisplay}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700">
                                                            {cycle.cycles} Cycles ({cycle.sleepHoursFormatted})
                                                        </span>
                                                        {cycle.recommended && (
                                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                                                Recommended
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-tight">
                                                        {cycle.description}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0 pl-2">
                                                    <span className={`text-xs font-bold ${cycle.efficiencyScore >= 90 ? "text-emerald-600" : cycle.efficiencyScore >= 80 ? "text-indigo-600" : "text-amber-600"}`}>
                                                        {cycle.efficiencyScore}%
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* Sleep Architecture Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Sleep Stage</th>
                                            <th className="p-2.5">Portion</th>
                                            <th className="p-2.5">Primary Biological Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-2.5 font-bold text-slate-900">N1 (Light Sleep)</td>
                                            <td className="p-2.5">5%</td>
                                            <td className="p-2.5 text-slate-500">Hypnagogic transition into rest</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="p-2.5 font-bold text-indigo-700">N2 (True Sleep)</td>
                                            <td className="p-2.5">45% – 55%</td>
                                            <td className="p-2.5 text-slate-500">Sleep spindles, motor skill memory</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                            <td className="p-2.5 font-bold text-indigo-900">N3 (Slow-Wave Sleep)</td>
                                            <td className="p-2.5">15% – 25%</td>
                                            <td className="p-2.5 text-indigo-800">Physical repair, growth hormone release</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 bg-purple-50/40">
                                            <td className="p-2.5 font-bold text-purple-900">REM (Dream Stage)</td>
                                            <td className="p-2.5">20% – 25%</td>
                                            <td className="p-2.5 text-purple-800">Cognitive synthesis, emotional balance</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Circadian Rhythm Compliant
                        </span>
                        <span>Ultradian 90-Min Model</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY MEDICAL / SLEEP HEALTH DISCLAIMER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Sleep Health Notice:</strong> This calculator provides mathematical estimates based on average ultradian human sleep cycle durations. It does not replace clinical polysomnography or medical consultation. If you suffer from chronic insomnia, obstructive sleep apnea, or severe daytime sleepiness, consult a board-certified sleep specialist.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Ultradian Biology & Science */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of 90-Minute Ultradian Sleep Cycles and REM Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Human sleep is not a uniform period of unconsciousness. Instead, the brain cycles through distinct architectural stages known as <strong>ultradian cycles</strong>. Every complete cycle spans approximately 90 minutes (ranging clinically from 80 to 110 minutes), progressing through light Non-Rapid Eye Movement (NREM), restorative Slow-Wave Deep Sleep (N3), and high-frequency Rapid Eye Movement (REM) dreaming sleep.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <BedDouble className="w-4 h-4 text-indigo-600" /> Slow-Wave Sleep (SWS) Priority
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Early nightly cycles feature heavy concentrations of Stage 3 NREM sleep. This slow-wave phase facilitates cellular repair, tissue regeneration, immune strengthening, and human growth hormone secretion.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Late-Night REM Elongation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                As sleep progresses into cycles 4, 5, and 6, Slow-Wave Sleep diminishes and REM periods elongate drastically. Waking up prematurely cuts off vital cognitive consolidation, emotional processing, and creative problem-solving.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Cycle Progression Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Sleep Calculation Logic
                        </h3>
                        <p className="text-xs text-slate-300">
                            Mathematical algorithm powering this sleep calculator:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Wake-Up Goal:</strong> Bedtime = Target_Wake_Time - [(Cycles × 90 min) + Sleep_Latency]</div>
                            <div><strong>2. Fall-Asleep Goal:</strong> Wake_Time = Scheduled_Bedtime + [(Cycles × 90 min) + Sleep_Latency]</div>
                            <div><strong>3. Sleep Now Goal:</strong> Wake_Time = Current_Timestamp + [(Cycles × 90 min) + Sleep_Latency]</div>
                            <div><strong>4. Power Nap Reset:</strong> Wake_Time = Current_Timestamp + 20 min OR 90 min (Bypasses intermediate N3 inertia)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Sleep Architecture Classification Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Breakdown of Sleep Stages & Brain Wave Patterns
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Every 90-minute sleep cycle transitions through precise electroencephalogram (EEG) frequency patterns that regulate physical restoration and mental acuity:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Stage Name</th>
                                    <th className="p-3">Dominant EEG Waves</th>
                                    <th className="p-3">Duration per Cycle</th>
                                    <th className="p-3">Core Physiological Purpose</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">N1 (Light Drowse)</td>
                                    <td className="p-3">Alpha to Theta (4–8 Hz)</td>
                                    <td className="p-3">1 to 7 minutes</td>
                                    <td className="p-3">Muscular relaxation, reduction in core body temperature.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">N2 (True Sleep)</td>
                                    <td className="p-3">Theta with Sleep Spindles & K-Complexes</td>
                                    <td className="p-3">30 to 45 minutes</td>
                                    <td className="p-3">Motor skill encoding, heart rate stabilization, sensory isolation.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">N3 (Slow-Wave Sleep)</td>
                                    <td className="p-3 font-bold text-indigo-900">High-amplitude Delta (0.5–2 Hz)</td>
                                    <td className="p-3">20 to 40 minutes</td>
                                    <td className="p-3">Glymphatic waste clearance, tissue recovery, immune activation.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-purple-50/30">
                                    <td className="p-3 font-bold text-purple-900">REM (Rapid Eye Movement)</td>
                                    <td className="p-3 font-bold text-purple-900">Beta-like Mixed Desynchronized</td>
                                    <td className="p-3">10 to 60 minutes</td>
                                    <td className="p-3">Vivid dreaming, muscle atonia, episodic memory crystallization.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Practical Case Schedules */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Sleep Schedule Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        See how calculating ultradian timing eliminates morning grogginess across typical lifestyle profiles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario A: 6:00 AM Corporate Professional</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">5 Cycles</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Wake-Up Target:</strong> Exactly 06:00 AM</li>
                                <li><strong>Average Sleep Latency:</strong> 15 minutes</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Bedtimes:</li>
                                <li>• <strong>Optimal (5 Cycles / 7.5h):</strong> Bed at <strong>10:15 PM</strong> (Wake at 6:00 AM)</li>
                                <li>• <strong>Secondary (6 Cycles / 9.0h):</strong> Bed at <strong>8:45 PM</strong> (Wake at 6:00 AM)</li>
                                <li>• <strong>Minimum Safe (4 Cycles / 6.0h):</strong> Bed at <strong>11:45 PM</strong> (Wake at 6:00 AM)</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario B: 2:00 PM Midday Slump Reset</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Nap Strategy</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Nap Initiation Time:</strong> 02:00 PM</li>
                                <li><strong>Average Sleep Latency:</strong> 10 minutes</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Recommended Nap Targets:</li>
                                <li>• <strong>20-Minute Power Nap:</strong> Alarm set for <strong>2:30 PM</strong> (Awaken prior to N3 deep sleep)</li>
                                <li>• <strong>Full 90-Minute Cycle:</strong> Alarm set for <strong>3:40 PM</strong> (Includes 10m latency + 1 full cycle)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Overcoming Sleep Inertia & Circadian Protocols */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Eliminate Sleep Inertia and Optimize Circadian Alignment
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Sleep inertia</strong> is the feeling of cognitive grogginess, disorientation, and reduced motor dexterity experienced upon waking. It occurs when an alarm sounds while your brain is generating high-voltage Delta waves during Stage 3 NREM deep sleep. Implementing these scientific protocols ensures frictionless morning transitions:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Morning Lux Exposure</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Expose eyes to 10,000+ lux natural sunlight within 30 minutes of waking to trigger cortisol release and halt melatonin synthesis.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Adenosine Clearance</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Delay morning caffeine consumption by 90 minutes upon awakening. This allows natural adenosine clearance and prevents afternoon energy crashes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Consistent Wake Times</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Anchor your wake-up time within a ±30 minute window even on weekends to reinforce master suprachiasmatic nucleus (SCN) circadian timing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                How long is a human sleep cycle on average?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard human sleep cycle lasts approximately 90 minutes, though it can vary between 80 and 110 minutes based on genetics, age, and prior sleep debt. During each cycle, the brain navigates through light sleep, deep Slow-Wave Sleep, and Rapid Eye Movement (REM) sleep.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is waking up at the end of a sleep cycle important?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Waking up midway through deep Stage 3 Slow-Wave Sleep triggers severe sleep inertia, leaving you feeling exhausted and groggy regardless of total hours slept. Waking at the conclusion of a 90-minute cycle ensures your alarm sounds during light N1 or REM sleep, making wakefulness effortless.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is sleep latency and why does it matter?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sleep latency is the duration between getting into bed and actually falling asleep. The clinical average for healthy adults is 10 to 20 minutes (14-minute benchmark). If a calculator doesn't add your sleep latency to the bedtime target, your alarm will wake you up mid-cycle rather than at the end.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is 6 hours (4 cycles) of sleep enough for adults?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Four cycles (6 hours) is generally considered the minimum viable threshold for cognitive maintenance. While it prevents waking up in deep sleep, chronic adherence to 6 hours leads to cumulative REM deprivation and reduced immune resilience compared to 5 complete cycles (7.5 hours).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should I time naps to avoid waking up tired?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To avoid sleep inertia, aim for either a 20-minute power nap (which keeps you strictly in light N1/N2 sleep) or commit to a full 90-minute cycle. Avoid 45-to-60-minute naps because you will wake up directly in the middle of deep Slow-Wave Sleep.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final Medical & Clinical Disclaimer Card */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Clinical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        This tool is provided for educational and optimization purposes only. Sleep timing calculations are mathematical estimates and should not replace clinical medical advice. Individuals suffering from narcolepsy, chronic insomnia, or circadian rhythm sleep-wake disorders should consult their primary physician or sleep medicine clinic.
                    </p>
                </section>

            </div>
        </div>
    );
}