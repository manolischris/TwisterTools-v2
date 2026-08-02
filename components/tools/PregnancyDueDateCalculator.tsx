"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Calendar,
    Baby,
    Heart,
    Clock,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Download,
    Copy,
    Check,
    BookOpen,
    HelpCircle,
    Info,
    CheckCircle2,
    CalendarDays,
    Activity,
    Lightbulb,
    Stethoscope,
    Layers,
    Smile,
    Scale,
    TrendingUp,
    BarChart3,
    Microscope,
    Clock3
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type CalculationMethod = "lmp" | "conception" | "ultrasound" | "ivf";

interface Preset {
    id: string;
    label: string;
    method: CalculationMethod;
    cycleDays: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "std-28-day", label: "Standard 28-Day Cycle", method: "lmp", cycleDays: 28, tag: "Average" },
    { id: "short-24-day", label: "Short 24-Day Cycle", method: "lmp", cycleDays: 24, tag: "Short Cycle" },
    { id: "long-32-day", label: "Long 32-Day Cycle", method: "lmp", cycleDays: 32, tag: "Long Cycle" },
];

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

export default function PregnancyDueDateCalculator() {
    // Unit System State
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");

    // Calculation Method State
    const [method, setMethod] = useState<CalculationMethod>("lmp");

    // Dates & Inputs
    const [inputDate, setInputDate] = useState<string>(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    const [cycleLength, setCycleLength] = useState<number>(28);
    
    // Ultrasound specific state
    const [usGestationWeeks, setUsGestationWeeks] = useState<number>(8);
    const [usGestationDays, setUsGestationDays] = useState<number>(3);

    // IVF specific state
    const [ivfType, setIvfType] = useState<"day3" | "day5">("day5");

    // Active Preset
    const [activePresetId, setActivePresetId] = useState<string | null>("std-28-day");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"milestones" | "trimesters" | "details">("milestones");

    const exportRef = useRef<HTMLDivElement>(null);

    // Core Calculation Logic
    const results = useMemo(() => {
        if (!inputDate) {
            return null;
        }

        const baseDate = new Date(inputDate + "T00:00:00");
        if (isNaN(baseDate.getTime())) return null;

        let estimatedDueDate: Date;
        let estimatedConceptionDate: Date;

        if (method === "lmp") {
            // Naegele's rule adjusted for cycle length: LMP + 280 days + (cycleLength - 28)
            const cycleAdjustment = cycleLength - 28;
            estimatedDueDate = new Date(baseDate.getTime() + (280 + cycleAdjustment) * 24 * 60 * 60 * 1000);
            estimatedConceptionDate = new Date(baseDate.getTime() + (14 + cycleAdjustment) * 24 * 60 * 60 * 1000);
        } else if (method === "conception") {
            // Conception + 266 days
            estimatedConceptionDate = new Date(baseDate.getTime());
            estimatedDueDate = new Date(baseDate.getTime() + 266 * 24 * 60 * 60 * 1000);
        } else if (method === "ultrasound") {
            // Ultrasound Date + (280 - (weeks * 7 + days))
            const totalGestationDays = usGestationWeeks * 7 + usGestationDays;
            const remainingDays = 280 - totalGestationDays;
            estimatedDueDate = new Date(baseDate.getTime() + remainingDays * 24 * 60 * 60 * 1000);
            estimatedConceptionDate = new Date(estimatedDueDate.getTime() - 266 * 24 * 60 * 60 * 1000);
        } else {
            // IVF Transfer Date
            const transferAgeDays = ivfType === "day5" ? 5 : 3;
            // Due date = Transfer Date + 266 days - transfer age
            estimatedDueDate = new Date(baseDate.getTime() + (266 - transferAgeDays) * 24 * 60 * 60 * 1000);
            estimatedConceptionDate = new Date(baseDate.getTime() - transferAgeDays * 24 * 60 * 60 * 1000);
        }

        // Current Progress Calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Gestational age starts from 14 days before conception
        const lmpEquivalent = new Date(estimatedConceptionDate.getTime() - 14 * 24 * 60 * 60 * 1000);
        const diffMs = today.getTime() - lmpEquivalent.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const currentWeeks = Math.max(0, Math.floor(diffDays / 7));
        const currentDays = Math.max(0, diffDays % 7);
        const totalProgressDays = Math.min(280, Math.max(0, diffDays));
        const progressPercent = Math.min(100, Math.max(0, (totalProgressDays / 280) * 100));

        // Trimester Start / End Dates
        const trimester1End = new Date(lmpEquivalent.getTime() + 13 * 7 * 24 * 60 * 60 * 1000);
        const trimester2Start = new Date(trimester1End.getTime() + 1 * 24 * 60 * 60 * 1000);
        const trimester2End = new Date(lmpEquivalent.getTime() + 27 * 7 * 24 * 60 * 60 * 1000);
        const trimester3Start = new Date(trimester2End.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Milestones
        const heartBeatDate = new Date(lmpEquivalent.getTime() + 6 * 7 * 24 * 60 * 60 * 1000);
        const firstMovementDate = new Date(lmpEquivalent.getTime() + 18 * 7 * 24 * 60 * 60 * 1000);
        const viabilityDate = new Date(lmpEquivalent.getTime() + 24 * 7 * 24 * 60 * 60 * 1000);
        const fullTermDate = new Date(lmpEquivalent.getTime() + 37 * 7 * 24 * 60 * 60 * 1000);

        // Fetal Size Approximation (Imperial vs Metric)
        let fetalSizeName = "Poppy Seed";
        let fetalWeight = "";
        let fetalLength = "";

        if (currentWeeks < 4) {
            fetalSizeName = "Poppy Seed";
            fetalWeight = unitSystem === "imperial" ? "< 0.01 oz" : "< 0.1 g";
            fetalLength = unitSystem === "imperial" ? "0.04 in" : "1 mm";
        } else if (currentWeeks < 8) {
            fetalSizeName = "Raspberry";
            fetalWeight = unitSystem === "imperial" ? "0.04 oz" : "1 g";
            fetalLength = unitSystem === "imperial" ? "0.6 in" : "1.6 cm";
        } else if (currentWeeks < 12) {
            fetalSizeName = "Lime";
            fetalWeight = unitSystem === "imperial" ? "0.5 oz" : "14 g";
            fetalLength = unitSystem === "imperial" ? "2.1 in" : "5.4 cm";
        } else if (currentWeeks < 16) {
            fetalSizeName = "Avocado";
            fetalWeight = unitSystem === "imperial" ? "3.5 oz" : "100 g";
            fetalLength = unitSystem === "imperial" ? "4.6 in" : "11.6 cm";
        } else if (currentWeeks < 20) {
            fetalSizeName = "Banana";
            fetalWeight = unitSystem === "imperial" ? "10.6 oz" : "300 g";
            fetalLength = unitSystem === "imperial" ? "10.1 in" : "25.6 cm";
        } else if (currentWeeks < 24) {
            fetalSizeName = "Cantaloupe";
            fetalWeight = unitSystem === "imperial" ? "1.3 lbs" : "600 g";
            fetalLength = unitSystem === "imperial" ? "11.8 in" : "30 cm";
        } else if (currentWeeks < 28) {
            fetalSizeName = "Eggplant";
            fetalWeight = unitSystem === "imperial" ? "2.2 lbs" : "1 kg";
            fetalLength = unitSystem === "imperial" ? "14.8 in" : "37.5 cm";
        } else if (currentWeeks < 32) {
            fetalSizeName = "Squash";
            fetalWeight = unitSystem === "imperial" ? "3.75 lbs" : "1.7 kg";
            fetalLength = unitSystem === "imperial" ? "16.7 in" : "42.4 cm";
        } else if (currentWeeks < 36) {
            fetalSizeName = "Honeydew Melon";
            fetalWeight = unitSystem === "imperial" ? "5.8 lbs" : "2.6 kg";
            fetalLength = unitSystem === "imperial" ? "18.7 in" : "47.4 cm";
        } else {
            fetalSizeName = "Watermelon";
            fetalWeight = unitSystem === "imperial" ? "7.5 lbs" : "3.4 kg";
            fetalLength = unitSystem === "imperial" ? "20.2 in" : "51.3 cm";
        }

        return {
            dueDate: estimatedDueDate,
            conceptionDate: estimatedConceptionDate,
            currentWeeks,
            currentDays,
            progressPercent,
            daysRemaining: Math.max(0, Math.ceil((estimatedDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))),
            trimester1End,
            trimester2Start,
            trimester2End,
            trimester3Start,
            heartBeatDate,
            firstMovementDate,
            viabilityDate,
            fullTermDate,
            fetalSizeName,
            fetalWeight,
            fetalLength,
        };
    }, [inputDate, method, cycleLength, usGestationWeeks, usGestationDays, ivfType, unitSystem]);

    const formatDate = (date: Date | undefined) => {
        if (!date) return "--";
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleReset = () => {
        setMethod("lmp");
        setInputDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
        setCycleLength(28);
        setUsGestationWeeks(8);
        setUsGestationDays(3);
        setIvfType("day5");
        setActivePresetId("std-28-day");
    };

    const applyPreset = (preset: Preset) => {
        setMethod(preset.method);
        setCycleLength(preset.cycleDays);
        setActivePresetId(preset.id);
    };

    const handleCopySummary = () => {
        if (!results) return;

        const summaryText = `Pregnancy Timeline & Due Date Summary (TwisterTools):
----------------------------------------
Estimated Due Date: ${formatDate(results.dueDate)}
Estimated Conception: ${formatDate(results.conceptionDate)}
Current Gestational Age: ${results.currentWeeks} Weeks, ${results.currentDays} Days
Days Remaining: ${results.daysRemaining} Days
Estimated Fetal Size: ${results.fetalSizeName} (${results.fetalLength}, ${results.fetalWeight})
----------------------------------------
Key Milestones:
• First Heartbeat (Est.): ${formatDate(results.heartBeatDate)}
• Second Trimester Begins: ${formatDate(results.trimester2Start)}
• Viability Milestone (~24w): ${formatDate(results.viabilityDate)}
• Third Trimester Begins: ${formatDate(results.trimester3Start)}
• Full Term Horizon (37w): ${formatDate(results.fullTermDate)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/pregnancy-due-date-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!results) return;

        const headers = ["Milestone / Metric", "Date / Value", "Notes"];
        const rows = [
            ["Estimated Due Date", formatDate(results.dueDate), "40 Weeks Gestation"],
            ["Estimated Conception Date", formatDate(results.conceptionDate), "Ovulation / Fertilization Window"],
            ["Current Progress", `${results.currentWeeks}w ${results.currentDays}d`, `${results.progressPercent.toFixed(1)}% Complete`],
            ["Days Remaining", `${results.daysRemaining} Days`, "Until 40 Weeks"],
            ["Fetal Size Comparable", results.fetalSizeName, `${results.fetalLength} | ${results.fetalWeight}`],
            ["First Heartbeat Window", formatDate(results.heartBeatDate), "~6 Weeks"],
            ["Trimester 2 Start", formatDate(results.trimester2Start), "14 Weeks"],
            ["Fetal Viability Window", formatDate(results.viabilityDate), "~24 Weeks"],
            ["Trimester 3 Start", formatDate(results.trimester3Start), "28 Weeks"],
            ["Full Term Milestone", formatDate(results.fullTermDate), "37 Weeks"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pregnancy_due_date_timeline.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pregnancy Due Date & Conception Calculator",
        "url": "https://twistertools.com/tools/calculators/pregnancy-due-date-calculator",
        "description": "Calculate your estimated pregnancy due date, conception window, trimester milestones, and gestational age using LMP, ultrasound, or IVF transfer dates.",
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
                "name": "How is a pregnancy due date calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The standard due date calculation uses Naegele's Rule, which adds 280 days (40 weeks) to the first day of your last menstrual period (LMP), assuming a standard 28-day menstrual cycle."
                }
            },
            {
                "@type": "Question",
                "name": "How accurate is a pregnancy due date calculator?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Due date calculators provide an estimated delivery date (EDD). Only about 4% to 5% of babies are born on their exact due date, while over 90% are born within two weeks before or after."
                }
            },
            {
                "@type": "Question",
                "name": "What if my menstrual cycle is shorter or longer than 28 days?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If your cycle length differs from 28 days, the calculator adjusts the expected ovulation and conception date accordingly. Longer cycles delay estimated due dates, while shorter cycles move them earlier."
                }
            },
            {
                "@type": "Question",
                "name": "Why does my ultrasound due date differ from my LMP due date?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Early ultrasound measurements (crown-rump length) are highly accurate for gestational age. If an early ultrasound differs by more than 5 to 7 days from your LMP calculation, healthcare providers usually adjust your official due date to match the scan."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate a due date after IVF transfer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For IVF pregnancies, due dates are calculated from the exact embryo transfer date by adding 266 days minus the age of the embryo (e.g., subtracting 5 days for a Day-5 blastocyst)."
                }
            },
            {
                "@type": "Question",
                "name": "What is gestational age vs. fetal age?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Gestational age measures pregnancy from the first day of the last menstrual period (LMP), which is about two weeks before fertilization. Fetal age (conception age) measures from the actual day of conception."
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
                {/* Left Workspace Panel: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Baby className="w-5 h-5 text-indigo-600" />
                                Calculation Method & Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Toggle Switch */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement Units (Fetal Growth)
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("imperial")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (in, oz/lbs)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("metric")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (cm, g/kg)
                                </button>
                            </div>
                        </div>

                        {/* Method Selection Tabs */}
                        <div className="space-y-1.5 mb-5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Primary Calculation Base
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => { setMethod("lmp"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center ${method === "lmp"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Last Period
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMethod("conception"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center ${method === "conception"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Conception
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMethod("ultrasound"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center ${method === "ultrasound"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Ultrasound
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMethod("ivf"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center ${method === "ivf"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    IVF Transfer
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Input Fields Based on Method */}
                        <div className="space-y-5">
                            {method === "lmp" && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-600" /> First Day of Last Menstrual Period (LMP)
                                        </label>
                                        <input
                                            type="date"
                                            value={inputDate}
                                            onChange={(e) => setInputDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Average Menstrual Cycle Length
                                            </label>
                                            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {cycleLength} Days
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="20"
                                            max="45"
                                            value={cycleLength}
                                            onChange={(e) => { setCycleLength(parseInt(e.target.value)); setActivePresetId(null); }}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                                            <span>20 Days</span>
                                            <span>28 Days (Standard)</span>
                                            <span>45 Days</span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {method === "conception" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5 text-indigo-600" /> Known / Estimated Conception Date
                                    </label>
                                    <input
                                        type="date"
                                        value={inputDate}
                                        onChange={(e) => setInputDate(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                                        Note: Conception typically occurs within 24 hours of ovulation, usually around 14 days after the start of your last period in a 28-day cycle.
                                    </p>
                                </div>
                            )}

                            {method === "ultrasound" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Date of Ultrasound Scan
                                        </label>
                                        <input
                                            type="date"
                                            value={inputDate}
                                            onChange={(e) => setInputDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Gestational Age at Scan Time
                                        </label>
                                        <div className="grid grid-cols-2 gap-3 min-w-0">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="3"
                                                    max="42"
                                                    value={usGestationWeeks === 0 ? "" : usGestationWeeks}
                                                    onChange={(e) => handleNumberInput(e, setUsGestationWeeks)}
                                                    className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">weeks</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="6"
                                                    value={usGestationDays === 0 ? "" : usGestationDays}
                                                    onChange={(e) => handleNumberInput(e, setUsGestationDays)}
                                                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === "ivf" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> IVF Embryo Transfer Date
                                        </label>
                                        <input
                                            type="date"
                                            value={inputDate}
                                            onChange={(e) => setInputDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Embryo Age / Stage at Transfer
                                        </label>
                                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setIvfType("day3")}
                                                className={`py-2 text-xs font-bold rounded-lg transition ${ivfType === "day3"
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                            >
                                                Day 3 Embryo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIvfType("day5")}
                                                className={`py-2 text-xs font-bold rounded-lg transition ${ivfType === "day5"
                                                    ? "bg-indigo-600 text-white shadow-xs"
                                                    : "text-slate-600 hover:text-slate-900"
                                                    }`}
                                            >
                                                Day 5 Blastocyst
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Presets Component */}
                        {method === "lmp" && (
                            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Cycle Length Presets
                                    </span>
                                    {activePresetId && (
                                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                            Preset Loaded
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
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Timeline Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visual Progress & Milestones */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Baby className="w-5 h-5 text-indigo-600" />
                                Estimated Delivery Horizon
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("milestones")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "milestones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Milestones
                                </button>
                                <button
                                    onClick={() => setActiveTab("trimesters")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "trimesters" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Trimesters
                                </button>
                                <button
                                    onClick={() => setActiveTab("details")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "details" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Fetal Size
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-400" /> Estimated Due Date
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    40 Weeks Full Term
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                                    {results ? formatDate(results.dueDate) : "--"}
                                </span>
                            </div>

                            {/* Progress Bar Container */}
                            {results && (
                                <div className="mt-4 pt-3 border-t border-indigo-800/80 space-y-2">
                                    <div className="flex justify-between text-xs text-indigo-200 font-medium">
                                        <span>Current: <strong>{results.currentWeeks}w {results.currentDays}d</strong></span>
                                        <span><strong>{results.daysRemaining}</strong> Days Remaining</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-indigo-700/50">
                                        <div
                                            className="bg-gradient-to-r from-amber-400 to-indigo-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${results.progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-indigo-300/80">
                                        <span>Conception</span>
                                        <span>{results.progressPercent.toFixed(1)}% Complete</span>
                                        <span>Birth</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active Tab Content */}
                        {results && activeTab === "milestones" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Heart className="w-4 h-4 text-rose-500" />
                                        Est. Conception Window
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">
                                        {formatDate(results.conceptionDate)}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Fertilization horizon
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Activity className="w-4 h-4 text-indigo-600" />
                                        First Heartbeat Window
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">
                                        {formatDate(results.heartBeatDate)}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        ~6 Weeks Gestational Age
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                        Viability Milestone
                                    </div>
                                    <p className="text-sm font-extrabold text-slate-900">
                                        {formatDate(results.viabilityDate)}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        ~24 Weeks Gestational Age
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                        <Smile className="w-4 h-4 text-indigo-600" />
                                        Full Term Horizon
                                    </div>
                                    <p className="text-sm font-extrabold text-indigo-950">
                                        {formatDate(results.fullTermDate)}
                                    </p>
                                    <p className="text-[11px] text-indigo-700/80">
                                        37 Weeks Completed
                                    </p>
                                </div>
                            </div>
                        )}

                        {results && activeTab === "trimesters" && (
                            <div className="space-y-3">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-indigo-700 uppercase">First Trimester (Weeks 1 - 13)</div>
                                        <div className="text-xs text-slate-600 mt-0.5">Organogenesis & Early Development</div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                        Until {formatDate(results.trimester1End)}
                                    </div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-amber-700 uppercase">Second Trimester (Weeks 14 - 27)</div>
                                        <div className="text-xs text-slate-600 mt-0.5">Rapid Growth & Anatomical Scan</div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                        Starts {formatDate(results.trimester2Start)}
                                    </div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-emerald-700 uppercase">Third Trimester (Weeks 28 - 40+)</div>
                                        <div className="text-xs text-slate-600 mt-0.5">Final Maturation & Birth Preparation</div>
                                    </div>
                                    <div className="text-xs font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                        Starts {formatDate(results.trimester3Start)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {results && activeTab === "details" && (
                            <div className="space-y-3">
                                <div className="p-4 border border-indigo-100 bg-indigo-50/50 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Current Fetal Size Scale</span>
                                        <span className="text-xs font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">
                                            Week {results.currentWeeks}
                                        </span>
                                    </div>
                                    <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <Baby className="w-5 h-5 text-indigo-600" />
                                        Comparable to a {results.fetalSizeName}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100 text-xs text-slate-700">
                                        <div><strong>Est. Length:</strong> {results.fetalLength}</div>
                                        <div><strong>Est. Weight:</strong> {results.fetalWeight}</div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                                    <strong>Clinical Note:</strong> Fetal growth averages vary significantly between individual pregnancies, particularly in the third trimester. Clinical ultrasound measurements provide individualized measurements.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA Compliant
                        </span>
                        <span>Naegele's Engine</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Clinical Mechanics & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Gestational Age & Due Date Calculation Methods
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Determining an accurate estimated due date (EDD) is a foundational step in obstetric care. An accurate timeline ensures proper timing for screening tests, monitoring fetal growth milestones, and preparing for labor delivery. Clinical medicine uses several complementary formulas depending on the available baseline data.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Last Menstrual Period (LMP)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The traditional standard calculation assumes a 280-day (40-week) gestation measured from the first day of the last normal menstrual period, adjusting for individual cycle length deviations.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-indigo-600" /> Ultrasound Crown-Rump Length
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                First-trimester biometric scans measure embryological length. Because early fetal growth rate is uniform, ultrasound dating in early pregnancy offers the highest biological accuracy.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Standard Clinical Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            The core calculation rules implemented in this engine:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Extended Naegele's Rule:</strong> Due Date = LMP + 280 Days + (Cycle Length - 28 Days)</div>
                            <div><strong>2. Conception Method:</strong> Due Date = Conception Date + 266 Days</div>
                            <div><strong>3. IVF Transfer Rule:</strong> Due Date = Transfer Date + 266 Days - Embryo Age (3 or 5 Days)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Clinical Definitions & Terminology */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Microscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Essential Obstetric Definitions & Gestational Concepts
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Navigating prenatal timelines requires understanding key clinical terms used by obstetricians, midwives, and maternal-fetal health specialists:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Clock3 className="w-4 h-4 text-indigo-600" /> Gestational Age vs. Fetal Age
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Gestational Age</strong> is measured from the first day of your last menstrual period (LMP). <strong>Fetal Age</strong> (conception age) measures from actual fertilization, which typically occurs 2 weeks later. Standard medical care tracks pregnancy using Gestational Age.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Estimated Due Date (EDD)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The target date marking exactly 40 completed weeks (280 days) of gestational age. It serves as an anchor for clinical monitoring rather than an exact delivery guarantee.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Crown-Rump Length (CRL)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                An ultrasound measurement from the top of the embryo's head (crown) to the bottom of the buttocks (rump). CRL provides the gold standard for gestational dating in the 1st trimester.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Full Term Horizon
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pregnancies reaching between 39 weeks 0 days and 40 weeks 6 days are classified as <strong>Full Term</strong>. Delivery between 37 and 38 weeks is <strong>Early Term</strong>, while 41 weeks is <strong>Late Term</strong>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Trimester Milestones Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Pregnancy Trimester Breakdown & Developmental Milestones
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A typical full-term pregnancy spans approximately 40 weeks, categorized into three distinct trimesters of developmental progression:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Trimester Stage</th>
                                    <th className="p-3">Gestational Span</th>
                                    <th className="p-3">Key Anatomical & Physiological Milestones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">First Trimester</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Weeks 1 – 13</td>
                                    <td className="p-3">Fertilization, implantation, neural tube formation, early cardiac activity (~wk 6), organogenesis.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Second Trimester</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Weeks 14 – 27</td>
                                    <td className="p-3">Fetal movement felt ("quickening"), anatomy scan (~wk 20), viability threshold (~wk 24), hearing development.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Third Trimester</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">Weeks 28 – 40+</td>
                                    <td className="p-3">Rapid weight gain, lung surfactant production, brain development, positioning for birth, full term at 37 weeks.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Fetal Growth Reference Chart (Dual Units) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Fetal Development & Size Milestone Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Track standard fetal length and weight averages throughout gestational progression. Data updates automatically when toggling between Imperial and Metric units above:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Gestational Week</th>
                                    <th className="p-3">Size Analogy</th>
                                    <th className="p-3">Estimated Length ({unitSystem === "imperial" ? "in" : "cm"})</th>
                                    <th className="p-3">Estimated Weight ({unitSystem === "imperial" ? "oz / lbs" : "g / kg"})</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 4</td>
                                    <td className="p-3">Poppy Seed</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "0.04 in" : "1 mm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "< 0.01 oz" : "< 0.1 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 8</td>
                                    <td className="p-3">Raspberry</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "0.6 in" : "1.6 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "0.04 oz" : "1 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 12</td>
                                    <td className="p-3">Lime</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "2.1 in" : "5.4 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "0.5 oz" : "14 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 16</td>
                                    <td className="p-3">Avocado</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "4.6 in" : "11.6 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "3.5 oz" : "100 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 20</td>
                                    <td className="p-3">Banana</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "10.1 in" : "25.6 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "10.6 oz" : "300 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 24</td>
                                    <td className="p-3">Cantaloupe</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "11.8 in" : "30 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "1.3 lbs" : "600 g"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 28</td>
                                    <td className="p-3">Eggplant</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "14.8 in" : "37.5 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "2.2 lbs" : "1 kg"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 32</td>
                                    <td className="p-3">Squash</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "16.7 in" : "42.4 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "3.75 lbs" : "1.7 kg"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 36</td>
                                    <td className="p-3">Honeydew Melon</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "18.7 in" : "47.4 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "5.8 lbs" : "2.6 kg"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Week 40</td>
                                    <td className="p-3">Watermelon</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "20.2 in" : "51.3 cm"}</td>
                                    <td className="p-3 font-mono text-indigo-600 font-semibold">{unitSystem === "imperial" ? "7.5 lbs" : "3.4 kg"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: Real-World Case Scenarios */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Calculation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how different inputs and cycle parameters alter the estimated due date calculation:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario A: Irregular 32-Day Cycle</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">LMP Method</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>LMP Date:</strong> January 1st</li>
                                <li><strong>Cycle Length:</strong> 32 Days (+4 days above 28)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Timeline Output:</li>
                                <li>• <strong>Est. Conception:</strong> January 19th</li>
                                <li>• <strong>Est. Due Date:</strong> October 12th</li>
                                <li>• <strong>Key Adjustment:</strong> Due date shifted 4 days later due to longer follicular phase.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario B: IVF Day-5 Blastocyst</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">IVF Method</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Transfer Date:</strong> March 15th</li>
                                <li><strong>Embryo Stage:</strong> Day 5 Blastocyst</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Timeline Output:</li>
                                <li>• <strong>Est. Conception:</strong> March 10th</li>
                                <li>• <strong>Est. Due Date:</strong> December 1st</li>
                                <li>• <strong>Key Adjustment:</strong> Timeline fixed directly from laboratory transfer timestamp.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: FAQ Section */}
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
                                How is a pregnancy due date calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The standard due date calculation uses Naegele's Rule, which adds 280 days (40 weeks) to the first day of your last menstrual period (LMP), assuming a standard 28-day menstrual cycle.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How accurate is a pregnancy due date calculator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Due date calculators provide an estimated delivery date (EDD). Only about 4% to 5% of babies are born on their exact due date, while over 90% are born within two weeks before or after.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What if my menstrual cycle is shorter or longer than 28 days?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                If your cycle length differs from 28 days, the calculator adjusts the expected ovulation and conception date accordingly. Longer cycles delay estimated due dates, while shorter cycles move them earlier.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does my ultrasound due date differ from my LMP due date?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Early ultrasound measurements (crown-rump length) are highly accurate for gestational age. If an early ultrasound differs by more than 5 to 7 days from your LMP calculation, healthcare providers usually adjust your official due date to match the scan.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate a due date after IVF transfer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For IVF pregnancies, due dates are calculated from the exact embryo transfer date by adding 266 days minus the age of the embryo (e.g., subtracting 5 days for a Day-5 blastocyst).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is gestational age vs. fetal age?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Gestational age measures pregnancy from the first day of the last menstrual period (LMP), which is about two weeks before fertilization. Fetal age (conception age) measures from the actual day of conception.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Medical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                    </p>
                </section>

            </div>
        </div>
    );
}