"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
    Heart,
    DollarSign,
    Calendar,
    Clock,
    Sparkles,
    ShieldCheck,
    Calculator,
    Lightbulb,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    Layers,
    BookOpen,
    HelpCircle,
    Copy,
    Check,
    Download,
    Flame,
    Award,
    Zap,
    TrendingDown,
    Hourglass,
    Target,
    BarChart3,
    Wind,
    Smile
} from "lucide-react";

type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";

interface CurrencyConfig {
    symbol: string;
    label: string;
    rate: number;
}

const CURRENCIES: Record<Currency, CurrencyConfig> = {
    USD: { symbol: "$", label: "USD ($)", rate: 1.0 },
    EUR: { symbol: "€", label: "EUR (€)", rate: 0.92 },
    GBP: { symbol: "£", label: "GBP (£)", rate: 0.79 },
    CAD: { symbol: "CA$", label: "CAD ($)", rate: 1.36 },
    AUD: { symbol: "AU$", label: "AUD ($)", rate: 1.52 }
};

interface PresetProfile {
    id: string;
    label: string;
    cigsPerDay: number;
    costPerPack: number;
    cigsPerPack: number;
    yearsSmoked: number;
    tag: string;
}

const PRESETS: PresetProfile[] = [
    { id: "pack-a-day", label: "Pack-a-Day (Average)", cigsPerDay: 20, costPerPack: 10, cigsPerPack: 20, yearsSmoked: 10, tag: "1 Pack / Day" },
    { id: "heavy-smoker", label: "Heavy Smoker", cigsPerDay: 40, costPerPack: 12, cigsPerPack: 20, yearsSmoked: 18, tag: "2 Packs / Day" },
    { id: "social-smoker", label: "Light / Social", cigsPerDay: 6, costPerPack: 10, cigsPerPack: 20, yearsSmoked: 5, tag: "6 Cigs / Day" },
];

interface Milestone {
    id: string;
    timeThresholdHours: number;
    displayTime: string;
    title: string;
    description: string;
    category: "cardio" | "respiratory" | "longterm" | "cellular";
    icon: React.ElementType;
}

const RECOVERY_MILESTONES: Milestone[] = [
    {
        id: "20m",
        timeThresholdHours: 0.333,
        displayTime: "20 Minutes",
        title: "Heart Rate & Blood Pressure Normalize",
        description: "Your pulse rate and blood pressure drop back toward normal physiological baseline levels, improving peripheral circulation in hands and feet.",
        category: "cardio",
        icon: Heart
    },
    {
        id: "8h",
        timeThresholdHours: 8,
        displayTime: "8 Hours",
        title: "Carbon Monoxide Drops 50%+",
        description: "Carbon monoxide in your bloodstream drops by more than half, allowing blood oxygen saturation to rise to standard healthy limits.",
        category: "cellular",
        icon: Wind
    },
    {
        id: "24h",
        timeThresholdHours: 24,
        displayTime: "24 Hours",
        title: "Acute Heart Attack Risk Drops",
        description: "Nicotine and carbon monoxide clearance significantly reduces coronary vasoconstriction, measurably decreasing the acute risk of myocardial infarction.",
        category: "cardio",
        icon: Activity
    },
    {
        id: "48h",
        timeThresholdHours: 48,
        displayTime: "48 Hours",
        title: "Nerve Endings Regrow & Senses Return",
        description: "Damaged olfactory and gustatory sensory nerve endings begin regeneration. Your ability to taste rich foods and smell subtle scents sharpens.",
        category: "cellular",
        icon: Sparkles
    },
    {
        id: "72h",
        timeThresholdHours: 72,
        displayTime: "72 Hours",
        title: "Bronchial Tubes Relax & Nicotine Gone",
        description: "Bronchial airways relax, expanding lung functional capacity. 100% of residual nicotine has cleared from the bloodstream, though behavioral cravings peak.",
        category: "respiratory",
        icon: Zap
    },
    {
        id: "2w",
        timeThresholdHours: 336, // 14 days
        displayTime: "2 Weeks",
        title: "Cardiovascular & Pulmonary Flow Surge",
        description: "Systemic circulation improves markedly. Walking, stair climbing, and cardiovascular exercise become noticeably easier with reduced breathlessness.",
        category: "cardio",
        icon: TrendingUp
    },
    {
        id: "1m",
        timeThresholdHours: 720, // 30 days
        displayTime: "1 Month",
        title: "Ciliary Clearance & Cough Reduction",
        description: "Lung cilia fully reactivate to clear mucus and clean airway lining. Sinus congestion, coughing spells, and general fatigue decline significantly.",
        category: "respiratory",
        icon: Wind
    },
    {
        id: "3m",
        timeThresholdHours: 2160, // 90 days
        displayTime: "3 Months",
        title: "Lung Capacity Expands up to 10%",
        description: "Spirometry testing shows measurable pulmonary improvement. Gas exchange efficiency improves and chronic inflammatory markers plummet.",
        category: "respiratory",
        icon: Target
    },
    {
        id: "1y",
        timeThresholdHours: 8760, // 365 days
        displayTime: "1 Year",
        title: "Coronary Heart Disease Risk Cut by 50%",
        description: "Your excess risk of ischemic coronary heart disease, angina, and heart attack drops to half that of a continuing smoker.",
        category: "longterm",
        icon: ShieldCheck
    },
    {
        id: "5y",
        timeThresholdHours: 43800, // 5 years
        displayTime: "5 Years",
        title: "Stroke Risk Parallels Non-Smokers",
        description: "Arterial stiffness reduces and risk of ischemic stroke and cerebral hemorrhage drops to levels comparable to a lifetime non-smoker in most studies.",
        category: "longterm",
        icon: Award
    },
    {
        id: "10y",
        timeThresholdHours: 87600, // 10 years
        displayTime: "10 Years",
        title: "Lung Cancer Mortality Halved",
        description: "Your risk of fatal lung cancer falls to approximately half that of an active smoker. Risk of mouth, throat, esophagus, bladder, and pancreas cancer plummets.",
        category: "longterm",
        icon: CheckCircle2
    },
    {
        id: "15y",
        timeThresholdHours: 131400, // 15 years
        displayTime: "15 Years",
        title: "Complete Cardiovascular Risk Parity",
        description: "Your risk of coronary heart disease and overall cardiovascular mortality matches someone who has never touched a cigarette in their entire life.",
        category: "longterm",
        icon: Heart
    }
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

export default function QuitSmokingSavingsCalculator() {
    // Mode State: "active-quit" (counting forward from quit date) vs "projection" (prospective savings)
    const [calcMode, setCalcMode] = useState<"active-quit" | "projection">("active-quit");

    // Input States
    const [currency, setCurrency] = useState<Currency>("USD");
    const [cigsPerDay, setCigsPerDay] = useState<number>(20);
    const [costPerPack, setCostPerPack] = useState<number>(10.0);
    const [cigsPerPack, setCigsPerPack] = useState<number>(20);
    const [yearsSmoked, setYearsSmoked] = useState<number>(10);
    const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(7.0);

    // Quit Date State (default to 7 days ago for immediate visualization)
    const [quitDateStr, setQuitDateStr] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split("T")[0];
    });

    // Time of day for precision
    const [quitTimeStr, setQuitTimeStr] = useState<string>("08:00");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"savings" | "health" | "investment">("savings");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);
    const curr = CURRENCIES[currency];

    // Core Calculations Engine
    const calculations = useMemo(() => {
        const safeCpd = Math.max(0, cigsPerDay || 0);
        const safeCpp = Math.max(1, cigsPerPack || 20);
        const safePrice = Math.max(0, costPerPack || 0);
        const safeYears = Math.max(0, yearsSmoked || 0);
        const safeRate = (investmentReturnRate || 0) / 100;

        const costPerCig = safeCpp > 0 ? safePrice / safeCpp : 0;
        const dailyCost = safeCpd * costPerCig;
        const weeklyCost = dailyCost * 7;
        const monthlyCost = dailyCost * 30.4375;
        const annualCost = dailyCost * 365.25;

        // Cumulative Historical Spending
        const historicalLifetimeCost = annualCost * safeYears;
        const historicalCigarettesCount = safeCpd * 365.25 * safeYears;
        // Each cigarette is estimated to rob ~11 minutes of life expectancy
        const historicalLifeLostDays = (historicalCigarettesCount * 11) / (60 * 24);

        // Time elapsed since quit date
        const quitDateTime = new Date(`${quitDateStr}T${quitTimeStr}:00`);
        const now = new Date();
        const diffMs = Math.max(0, now.getTime() - quitDateTime.getTime());
        const elapsedSeconds = diffMs / 1000;
        const elapsedMinutes = elapsedSeconds / 60;
        const elapsedHours = elapsedMinutes / 60;
        const elapsedDays = elapsedHours / 24;

        // Current Realized Benefits Since Quitting
        const cigarettesNotSmoked = (safeCpd / 24) * elapsedHours;
        const moneySavedSoFar = cigarettesNotSmoked * costPerCig;
        const lifeRegainedMinutes = cigarettesNotSmoked * 11;
        const lifeRegainedDays = lifeRegainedMinutes / (60 * 24);

        // Compound Growth Investment Projections (Annual compounding with monthly contributions: PMT = monthlyCost)
        const calculateCompoundFutureValue = (years: number) => {
            const monthlyRate = safeRate / 12;
            const totalMonths = years * 12;
            if (monthlyRate === 0) return monthlyCost * totalMonths;
            return monthlyCost * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
        };

        const fv1Year = calculateCompoundFutureValue(1);
        const fv3Years = calculateCompoundFutureValue(3);
        const fv5Years = calculateCompoundFutureValue(5);
        const fv10Years = calculateCompoundFutureValue(10);
        const fv20Years = calculateCompoundFutureValue(20);

        return {
            costPerCig,
            dailyCost,
            weeklyCost,
            monthlyCost,
            annualCost,
            historicalLifetimeCost,
            historicalCigarettesCount,
            historicalLifeLostDays,
            elapsedDays,
            elapsedHours,
            cigarettesNotSmoked: Math.floor(cigarettesNotSmoked),
            moneySavedSoFar,
            lifeRegainedDays,
            lifeRegainedMinutes: Math.round(lifeRegainedMinutes),
            fv1Year,
            fv3Years,
            fv5Years,
            fv10Years,
            fv20Years
        };
    }, [cigsPerDay, cigsPerPack, costPerPack, yearsSmoked, investmentReturnRate, quitDateStr, quitTimeStr]);

    const applyPreset = (preset: PresetProfile) => {
        setCigsPerDay(preset.cigsPerDay);
        setCostPerPack(preset.costPerPack);
        setCigsPerPack(preset.cigsPerPack);
        setYearsSmoked(preset.yearsSmoked);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCigsPerDay(20);
        setCostPerPack(10.0);
        setCigsPerPack(20);
        setYearsSmoked(10);
        setInvestmentReturnRate(7.0);
        setCurrency("USD");
        const d = new Date();
        d.setDate(d.getDate() - 7);
        setQuitDateStr(d.toISOString().split("T")[0]);
        setQuitTimeStr("08:00");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Smoke-Free Recovery & Financial Savings Summary (TwisterTools):
--------------------------------------------------
Smoking Profile: ${cigsPerDay} cigs/day @ ${curr.symbol}${costPerPack.toFixed(2)} / pack (${yearsSmoked} yrs)
Elapsed Smoke-Free Time: ${calculations.elapsedDays.toFixed(1)} Days (${Math.round(calculations.elapsedHours)} Hours)
--------------------------------------------------
REALIZED GAINS TO DATE:
• Money Saved: ${curr.symbol}${calculations.moneySavedSoFar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• Cigarettes Avoided: ${calculations.cigarettesNotSmoked.toLocaleString()} sticks
• Estimated Life Regained: ${calculations.lifeRegainedDays.toFixed(1)} Days (~${calculations.lifeRegainedMinutes.toLocaleString()} mins)

PROJECTED FUTURE CASH SAVINGS (Flat / Compound @ ${investmentReturnRate}%):
• 1 Year: ${curr.symbol}${calculations.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} | Invested: ${curr.symbol}${calculations.fv1Year.toLocaleString(undefined, { maximumFractionDigits: 0 })}
• 5 Years: ${curr.symbol}${(calculations.annualCost * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })} | Invested: ${curr.symbol}${calculations.fv5Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}
• 10 Years: ${curr.symbol}${(calculations.annualCost * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })} | Invested: ${curr.symbol}${calculations.fv10Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}
• 20 Years: ${curr.symbol}${(calculations.annualCost * 20).toLocaleString(undefined, { maximumFractionDigits: 0 })} | Invested: ${curr.symbol}${calculations.fv20Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}
--------------------------------------------------
Generated at twistertools.com/tools/calculators/quit-smoking-savings-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Timeframe / Metric", "Cigarettes Avoided", "Raw Direct Savings", `Invested Value @ ${investmentReturnRate}%`];
        const rows = [
            ["To Date (Elapsed)", calculations.cigarettesNotSmoked.toString(), `${curr.symbol}${calculations.moneySavedSoFar.toFixed(2)}`, "N/A"],
            ["1 Month", Math.round(cigsPerDay * 30.4375).toString(), `${curr.symbol}${calculations.monthlyCost.toFixed(2)}`, `${curr.symbol}${calculations.monthlyCost.toFixed(2)}`],
            ["1 Year", Math.round(cigsPerDay * 365.25).toString(), `${curr.symbol}${calculations.annualCost.toFixed(2)}`, `${curr.symbol}${calculations.fv1Year.toFixed(2)}`],
            ["3 Years", Math.round(cigsPerDay * 365.25 * 3).toString(), `${curr.symbol}${(calculations.annualCost * 3).toFixed(2)}`, `${curr.symbol}${calculations.fv3Years.toFixed(2)}`],
            ["5 Years", Math.round(cigsPerDay * 365.25 * 5).toString(), `${curr.symbol}${(calculations.annualCost * 5).toFixed(2)}`, `${curr.symbol}${calculations.fv5Years.toFixed(2)}`],
            ["10 Years", Math.round(cigsPerDay * 365.25 * 10).toString(), `${curr.symbol}${(calculations.annualCost * 10).toFixed(2)}`, `${curr.symbol}${calculations.fv10Years.toFixed(2)}`],
            ["20 Years", Math.round(cigsPerDay * 365.25 * 20).toString(), `${curr.symbol}${(calculations.annualCost * 20).toFixed(2)}`, `${curr.symbol}${calculations.fv20Years.toFixed(2)}`],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `smoke_free_savings_and_health_schedule.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Smoking Cost & Smoke-Free Health Recovery Timeline Calculator",
        "url": "https://twistertools.com/tools/calculators/quit-smoking-savings-calculator",
        "description": "Calculate personal money saved, cigarettes avoided, life expectancy regained, and WHO clinical health recovery milestones after quitting smoking.",
        "applicationCategory": "HealthAndFitnessApplication",
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
                "name": "How is money saved calculated when you quit smoking?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial savings are calculated by dividing the cost of a pack by the number of cigarettes per pack to determine cost per stick, multiplied by your daily cigarette consumption and the exact elapsed time since your quit timestamp."
                }
            },
            {
                "@type": "Question",
                "name": "How does the calculator determine life expectancy regained?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Based on landmark epidemiological research published in the British Medical Journal (BMJ), each cigarette smoked statistically reduces life expectancy by approximately 11 minutes. Avoiding cigarettes reverses this cumulative biological loss."
                }
            },
            {
                "@type": "Question",
                "name": "What physiological improvements happen within the first 72 hours of quitting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Within 20 minutes, blood pressure and pulse normalize. By 8 hours, carbon monoxide levels drop by 50%. At 48 hours, nerve endings begin regrowing to restore smell and taste. By 72 hours, all nicotine clears from the body and bronchial tubes relax."
                }
            },
            {
                "@type": "Question",
                "name": "How does compound interest amplify quit smoking savings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By redirecting daily cigarette expenditures into an index fund or savings vehicle earning an average 7% annual return, a pack-a-day smoker saving $10 daily can accumulate over $40,000 in 10 years and over $140,000 in 20 years."
                }
            },
            {
                "@type": "Question",
                "name": "When does cardiovascular risk return to that of a non-smoker?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cardiovascular risk drops sharply within the first year (50% reduction in coronary heart disease risk). At 5 years, stroke risk matches non-smokers, and by 15 years, overall cardiovascular mortality risk equals a lifetime non-smoker."
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
                {/* Left Workspace Panel: User Profile Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-indigo-600" />
                                Smoking & Quit Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculator Tracking Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("active-quit")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${calcMode === "active-quit"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    I Have Already Quit
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("projection")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${calcMode === "projection"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Prospective / Planning
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Quit Date & Time (Conditional display or highlighted) */}
                            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                                <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    {calcMode === "active-quit" ? "Quit Date & Time" : "Target Planned Quit Date"}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <input
                                            type="date"
                                            value={quitDateStr}
                                            onChange={(e) => setQuitDateStr(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="time"
                                            value={quitTimeStr}
                                            onChange={(e) => setQuitTimeStr(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Consumption & Pricing Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Wind className="w-3.5 h-3.5 text-indigo-600" /> Cigarettes Smoked / Day
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="150"
                                        value={cigsPerDay === 0 ? "" : cigsPerDay}
                                        onChange={(e) => { handleNumberInput(e, (val) => setCigsPerDay(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5 text-indigo-600" /> Pack Price ({curr.symbol})
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={costPerPack === 0 ? "" : costPerPack}
                                            onChange={(e) => { handleNumberInput(e, (val) => setCostPerPack(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{curr.symbol}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Secondary Parameters Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Cigs in a Pack
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={cigsPerPack === 0 ? "" : cigsPerPack}
                                        onChange={(e) => { handleNumberInput(e, (val) => setCigsPerPack(Math.max(1, val))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Years Smoked
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="70"
                                        value={yearsSmoked === 0 ? "" : yearsSmoked}
                                        onChange={(e) => { handleNumberInput(e, (val) => setYearsSmoked(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Currency
                                    </label>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as Currency)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        {Object.entries(CURRENCIES).map(([code, c]) => (
                                            <option key={code} value={code}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Investment Compound Growth Yield */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                                        Index Investment Return Rate
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600">{investmentReturnRate}% p.a.</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    step="0.5"
                                    value={investmentReturnRate}
                                    onChange={(e) => setInvestmentReturnRate(parseFloat(e.target.value))}
                                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                                    <span>0% (Cash Stash)</span>
                                    <span>7% (S&P 500 Avg)</span>
                                    <span>15% (Aggressive)</span>
                                </div>
                            </div>
                        </div>

                        {/* PRESET PROFILES */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Consumption Presets
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
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Full Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Data Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Smoke-Free Ledger & Health Status
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("savings")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "savings" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Cash Saved
                                </button>
                                <button
                                    onClick={() => setActiveTab("health")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "health" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Health Timeline
                                </button>
                                <button
                                    onClick={() => setActiveTab("investment")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "investment" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Compound S&P
                                </button>
                            </div>
                        </div>

                        {/* Primary Highlight Hero Box */}
                        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-emerald-600" />
                                    {calcMode === "active-quit" ? "Realized Cash Saved To Date" : "Projected Annual Financial Windfall"}
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                                    {calculations.elapsedDays >= 1 ? `${calculations.elapsedDays.toFixed(1)} Days Smoke-Free` : "Fresh Start"}
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-emerald-700">
                                    {curr.symbol}{calcMode === "active-quit"
                                        ? calculations.moneySavedSoFar.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                        : calculations.annualCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs font-semibold text-emerald-600">
                                    {calcMode === "active-quit" ? "in direct cash retained" : "saved per year"}
                                </span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-emerald-700 font-medium">Avoided Cigarettes:</span>
                                    <p className="text-base font-extrabold text-emerald-900 mt-0.5">
                                        {calculations.cigarettesNotSmoked.toLocaleString()} <span className="text-xs font-normal">sticks</span>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-emerald-700 font-medium">Life Expectancy Regained:</span>
                                    <p className="text-base font-extrabold text-emerald-900 mt-0.5">
                                        +{calculations.lifeRegainedDays.toFixed(1)} <span className="text-xs font-normal">days ({calculations.lifeRegainedMinutes.toLocaleString()} m)</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Sub-views */}
                        {activeTab === "savings" && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Weekly Burn</div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {curr.symbol}{calculations.weeklyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{Math.round(cigsPerDay * 7)} cigarettes</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Burn</div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {curr.symbol}{calculations.monthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">~30.4 days cycle</p>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                                        <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Annual Burn</div>
                                        <p className="text-lg font-extrabold text-indigo-700 mt-1">
                                            {curr.symbol}{calculations.annualCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-indigo-500 mt-0.5">{Math.round(cigsPerDay * 365.25)} cigarettes</p>
                                    </div>
                                </div>

                                {/* Historical Impact Breakdown */}
                                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-300">
                                        <span className="flex items-center gap-1.5 font-bold text-indigo-400">
                                            <Hourglass className="w-4 h-4" /> Lifetime Smoking Toll ({yearsSmoked} Years)
                                        </span>
                                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Cumulative Estimate</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                                        <div>
                                            <span className="text-slate-400">Total Money Spent:</span>
                                            <p className="text-base font-black text-rose-400 mt-0.5">
                                                {curr.symbol}{calculations.historicalLifetimeCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-slate-400">Est. Life Subtracted:</span>
                                            <p className="text-base font-black text-amber-400 mt-0.5">
                                                -{calculations.historicalLifeLostDays.toFixed(0)} days (~{(calculations.historicalLifeLostDays / 365.25).toFixed(1)} yrs)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "health" && (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {RECOVERY_MILESTONES.map((milestone) => {
                                    const isReached = calculations.elapsedHours >= milestone.timeThresholdHours;
                                    const IconComponent = milestone.icon;
                                    return (
                                        <div
                                            key={milestone.id}
                                            className={`p-3 rounded-xl border transition flex items-start gap-3 ${isReached
                                                ? "bg-emerald-50/80 border-emerald-200"
                                                : "bg-slate-50 border-slate-200 opacity-70"
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isReached ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                                }`}>
                                                {isReached ? <Check className="w-4 h-4" /> : <IconComponent className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className={`text-xs font-bold ${isReached ? "text-emerald-950" : "text-slate-700"}`}>
                                                        {milestone.title}
                                                    </h3>
                                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${isReached
                                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                        : "bg-slate-200 text-slate-600"
                                                        }`}>
                                                        {milestone.displayTime}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                                                    {milestone.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "investment" && (
                            <div className="space-y-3">
                                <div className="text-xs text-slate-600 font-medium">
                                    Redirecting your monthly smoking budget (<strong>{curr.symbol}{calculations.monthlyCost.toFixed(2)}/mo</strong>) into an asset compounding at <strong>{investmentReturnRate}% APR</strong>:
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                            <tr>
                                                <th className="p-2.5">Timeline</th>
                                                <th className="p-2.5">Cash Unspent</th>
                                                <th className="p-2.5 text-indigo-600">Invested Future Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-2.5 font-bold">1 Year</td>
                                                <td className="p-2.5">{curr.symbol}{calculations.annualCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="p-2.5 font-extrabold text-indigo-600">{curr.symbol}{calculations.fv1Year.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-2.5 font-bold">3 Years</td>
                                                <td className="p-2.5">{curr.symbol}${(calculations.annualCost * 3).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="p-2.5 font-extrabold text-indigo-600">{curr.symbol}{calculations.fv3Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50">
                                                <td className="p-2.5 font-bold">5 Years</td>
                                                <td className="p-2.5">{curr.symbol}${(calculations.annualCost * 5).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="p-2.5 font-extrabold text-indigo-600">{curr.symbol}{calculations.fv5Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                                <td className="p-2.5 font-bold">10 Years</td>
                                                <td className="p-2.5">{curr.symbol}${(calculations.annualCost * 10).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="p-2.5 font-extrabold text-indigo-700">{curr.symbol}{calculations.fv10Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50 bg-indigo-50/60">
                                                <td className="p-2.5 font-bold">20 Years</td>
                                                <td className="p-2.5">{curr.symbol}${(calculations.annualCost * 20).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                <td className="p-2.5 font-extrabold text-indigo-800">{curr.symbol}{calculations.fv20Years.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Private Calculation
                        </span>
                        <span>WHO & BMJ Medical Standards</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL & FINANCIAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical & Financial Disclaimer:</strong> This calculator provides estimated health recovery and financial savings metrics based on statistical models from the World Health Organization (WHO), the CDC, and medical literature. Individual recovery timelines vary based on genetics, lifestyle, and overall health status. This tool does not provide medical advice or guaranteed investment returns. Consult a licensed medical provider for smoking cessation protocols.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Medical Mechanics & Physiological Restoration Timeline */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Tobacco Cessation: Clinical Timelines & Physiology
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cigarette smoke contains over 7,000 chemicals, including carbon monoxide, hydrogen cyanide, formaldehyde, and at least 69 known human carcinogens. The moment you extinguish your final cigarette, the human body initiates an immediate, self-repairing cascade. Within hours, cellular oxygen delivery normalizes, and within weeks, pulmonary cilia re-establish bronchial clearing mechanisms.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-indigo-600" /> Carbon Monoxide & Oxygenation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Inhaled carbon monoxide binds to hemoglobin with 200 times greater affinity than oxygen, forming carboxyhemoglobin and starving tissues. Within 8 to 24 hours of cessation, carboxyhemoglobin breaks down, restoring full systemic oxygenation.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Wind className="w-4 h-4 text-indigo-600" /> Ciliary Regrowth & Mucociliary Escalator
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Acrolein and formaldehyde paralyze bronchial cilia, preventing the clearance of debris and pathogens. Between 1 and 9 months post-quit, respiratory cilia regenerate fully, dramatically reducing bronchial infection susceptibility.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Quantitative Savings & Life Expectancy Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Exact mathematical and statistical algorithms executed by this browser utility:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Direct Cash Saved:</strong> Savings = (Cigarettes Smoked Daily / Cigarettes Per Pack) × Cost Per Pack × Elapsed Days</div>
                            <div><strong>2. Life Regained (BMJ Standard):</strong> Life Regained (Hours) = (Cigarettes Avoided × 11 minutes) / 60</div>
                            <div><strong>3. Compounded Wealth Future Value:</strong> FV = PMT × [ ((1 + r/12)^(n*12) - 1) / (r/12) ] (where PMT = Monthly Smoking Cost, r = APR)</div>
                            <div><strong>4. Cumulative Historical Loss:</strong> Historical Cost = (Cigarettes Daily × 365.25 × Years Smoked × Cost Per Stick)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Detailed Recovery Benchmark Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive World Health Organization (WHO) Cessation Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Clinical milestones establish standard biological turning points after complete tobacco cessation:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeframe</th>
                                    <th className="p-3">Primary Physiological Reversal</th>
                                    <th className="p-3">Clinical Health Benefit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">20 Minutes</td>
                                    <td className="p-3">Heart rate and peripheral vascular tone normalize</td>
                                    <td className="p-3">Skin temperature in extremities returns to normal baseline</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">8 to 24 Hours</td>
                                    <td className="p-3">Serum carbon monoxide drops; arterial pO2 normalizes</td>
                                    <td className="p-3">Acute myocardial infarction probability begins dropping</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">48 to 72 Hours</td>
                                    <td className="p-3">Nicotine completely cleared; olfactory receptors regenerate</td>
                                    <td className="p-3">Heightened sense of smell and taste; bronchial relaxation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">2 to 12 Weeks</td>
                                    <td className="p-3">Arterial perfusion and systemic circulation improve</td>
                                    <td className="p-3">Walking distance and physical aerobic capacity surge</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">1 to 9 Months</td>
                                    <td className="p-3">Pulmonary ciliated epithelium regenerates fully</td>
                                    <td className="p-3">Significant reductions in cough, shortness of breath, and sinus infections</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                    <td className="p-3 font-bold text-emerald-700">1 Year</td>
                                    <td className="p-3">Endothelial function and coronary vasculature recover</td>
                                    <td className="p-3 font-semibold text-emerald-800">Excess risk of coronary heart disease cut by 50%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                    <td className="p-3 font-bold text-emerald-700">5 Years</td>
                                    <td className="p-3">Cerebrovascular resistance matches non-smokers</td>
                                    <td className="p-3 font-semibold text-emerald-800">Stroke risk plummets to lifetime non-smoker levels</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                    <td className="p-3 font-bold text-emerald-700">10 to 15 Years</td>
                                    <td className="p-3">DNA cellular mutations stabilized; arterial plaque stabilization</td>
                                    <td className="p-3 font-semibold text-emerald-800">Lung cancer mortality cut in half; heart disease risk equals non-smokers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Financial Windfall & Wealth Accumulation Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Financial Opportunity Cost: Flat Savings vs. S&P 500 Compounding
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Smoking represents one of the largest controllable drains on personal cash flow. When cigarette expenditures are redirected toward broad-market index funds, the power of compound interest turns former vice spending into substantial retirement capital:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: 1 Pack/Day ($10/pack)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">$304 / Month</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>1-Year Cash Stash:</strong> $3,652 saved</li>
                                <li>• <strong>5-Year Index Fund (7%):</strong> $21,984 ($18,260 cash + $3,724 interest)</li>
                                <li>• <strong>10-Year Index Fund (7%):</strong> $52,657 ($36,525 cash + $16,132 interest)</li>
                                <li>• <strong>20-Year Index Fund (7%):</strong> $158,421 ($73,050 cash + $85,371 interest)</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: 2 Packs/Day Heavy Smoker ($12/pack)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">$730 / Month</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>1-Year Cash Stash:</strong> $8,766 saved</li>
                                <li>• <strong>5-Year Index Fund (7%):</strong> $52,801 ($43,830 cash + $8,971 interest)</li>
                                <li>• <strong>10-Year Index Fund (7%):</strong> $126,458 ($87,660 cash + $38,798 interest)</li>
                                <li>• <strong>20-Year Index Fund (7%):</strong> $380,457 ($175,320 cash + $205,137 interest)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Practical Behavioral Tactics for Nicotine Withdrawal */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Evidence-Based Protocols for Overcoming Nicotine Cravings
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Physical nicotine withdrawal peaks within 48 to 72 hours and subsides over 2 to 4 weeks. Clinicians recommend applying the "4 D's" strategy during intense 3-to-5-minute dopamine craving spikes:
                    </p>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm">1. Delay</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Wait at least 5 minutes when a sudden urge strikes. Over 90% of acute craving spikes peak and dissipate within 300 seconds.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm">2. Deep Breathe</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Inhale slowly through your nose for 4 seconds, hold for 4 seconds, and exhale for 6 seconds to trigger parasympathetic vagal relaxation.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm">3. Drink Water</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sip ice-cold water slowly to satisfy the oral fixation habit while accelerating renal clearance of metabolic byproduct metabolites.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                            <h3 className="font-bold text-slate-900 text-sm">4. Distract</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Shift cognitive attention: take a brisk 5-minute walk, perform pushups, or engage in a quick mental game to reroute dopamine pathways.
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
                                How is money saved calculated when quitting smoking?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial savings are calculated by dividing pack cost by the number of cigarettes per pack to determine cost per stick, multiplied by your daily cigarette consumption and the exact elapsed time since your quit timestamp.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the calculator determine life expectancy regained?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Based on landmark epidemiological research published in the British Medical Journal (BMJ), each cigarette smoked statistically reduces life expectancy by approximately 11 minutes. Ceasing smoking immediately reverses this ongoing loss.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What physiological improvements happen within the first 72 hours?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Within 20 minutes, blood pressure and pulse normalize. By 8 hours, carbon monoxide levels drop by 50%. At 48 hours, nerve endings begin regrowing to restore smell and taste. By 72 hours, all nicotine clears from the bloodstream and bronchial airways relax.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does compound interest amplify quit smoking savings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Redirecting daily cigarette money into an index fund earning an average 7% annual return allows a pack-a-day smoker saving $10 daily to accumulate over $52,000 in 10 years and over $158,000 in 20 years.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When does cardiovascular risk match a lifetime non-smoker?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Coronary heart disease risk drops by 50% at 1 year. By 5 years, stroke risk reaches parity with non-smokers. At 15 years, overall cardiovascular disease mortality risk equals someone who has never smoked.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL & FINANCIAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical & Financial Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as formal medical advice, clinical diagnosis, or financial investment guarantee. Always consult a qualified healthcare provider for clinical smoking cessation support and a licensed financial advisor for investment planning.
                    </p>
                </section>

            </div>
        </div>
    );
}