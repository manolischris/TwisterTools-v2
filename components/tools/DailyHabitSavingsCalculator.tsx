"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Coffee,
    DollarSign,
    Sparkles,
    Calendar,
    Percent,
    TrendingUp,
    BarChart3,
    Layers,
    Download,
    Copy,
    Check,
    RefreshCw,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Calculator,
    PieChart,
    Lightbulb,
    Flame,
    Scale,
    AlertTriangle,
    Target,
    ArrowUpRight,
    Zap,
    Utensils,
    ShoppingBag,
    Tv,
    Cigarette
} from "lucide-react";

interface ScheduleRow {
    year: number;
    dailyExpense: number;
    yearlySaved: number;
    totalCashSaved: number;
    interestEarned: number;
    endingPortfolioBalance: number;
    purchasingPowerAdjusted: number;
}

interface HabitPreset {
    id: string;
    label: string;
    dailyCost: number;
    daysPerWeek: number;
    rate: number;
    horizonYears: number;
    iconName: string;
    description: string;
}

const HABIT_PRESETS: HabitPreset[] = [
    {
        id: "latte-factor",
        label: "Artisanal Coffee & Latte",
        dailyCost: 5.75,
        daysPerWeek: 5,
        rate: 8,
        horizonYears: 20,
        iconName: "coffee",
        description: "$5.75 workday coffee ritual",
    },
    {
        id: "daily-lunch",
        label: "Takeout Fast-Casual Lunch",
        dailyCost: 14.50,
        daysPerWeek: 5,
        rate: 8,
        horizonYears: 20,
        iconName: "lunch",
        description: "$14.50 daily restaurant takeout",
    },
    {
        id: "food-delivery",
        label: "Evening Meal Delivery Apps",
        dailyCost: 28.00,
        daysPerWeek: 3,
        rate: 8,
        horizonYears: 15,
        iconName: "delivery",
        description: "$28 app delivery 3x weekly",
    },
    {
        id: "subscriptions",
        label: "Unused App & Streaming Subscriptions",
        dailyCost: 2.20,
        daysPerWeek: 7,
        rate: 8,
        horizonYears: 10,
        iconName: "subs",
        description: "~$66 monthly recurring digital services",
    },
    {
        id: "vape-smoking",
        label: "Smoking or Vaping Pack",
        dailyCost: 9.00,
        daysPerWeek: 7,
        rate: 8,
        horizonYears: 25,
        iconName: "habits",
        description: "$9 daily tobacco or vape spending",
    },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

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

export default function DailyHabitSavingsCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [dailyCost, setDailyCost] = useState<number>(5.75);
    const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
    const [annualRate, setAnnualRate] = useState<number>(8.0);
    const [years, setYears] = useState<number>(20);
    const [compoundingFrequency, setCompoundingFrequency] = useState<number>(12); // Monthly default
    const [inflationRate, setInflationRate] = useState<number>(2.5);
    const [activePresetId, setActivePresetId] = useState<string | null>("latte-factor");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const exportRef = useRef<HTMLDivElement>(null);

    const currencySymbol = currencySymbols[currency];

    // Mathematical Engine & Growth Schedule
    const calculationResults = useMemo(() => {
        const validatedYears = Math.max(1, Math.min(years, 50));
        const weeklyCost = dailyCost * Math.min(7, Math.max(1, daysPerWeek));
        const yearlySavings = weeklyCost * 52;
        const monthlyDeposit = yearlySavings / 12;
        const totalMonths = validatedYears * 12;

        const nominalRate = annualRate / 100;
        const n = compoundingFrequency;

        let totalCashSaved = 0;
        let runningBalance = 0;
        let cumulativeInterest = 0;

        const schedule: ScheduleRow[] = [];

        for (let month = 1; month <= totalMonths; month++) {
            // Deposit monthly habit savings at beginning of compounding period
            runningBalance += monthlyDeposit;
            totalCashSaved += monthlyDeposit;

            // Monthly interest calculation matching compounding frequency
            const monthlyCompoundedRate = Math.pow(1 + nominalRate / n, n / 12) - 1;
            const interestThisMonth = runningBalance * monthlyCompoundedRate;

            runningBalance += interestThisMonth;
            cumulativeInterest += interestThisMonth;

            // Check if year boundary reached
            if (month % 12 === 0 || month === totalMonths) {
                const currentYear = Math.ceil(month / 12);

                // Real inflation-adjusted purchasing power: FV / (1 + i)^t
                const discountFactor = Math.pow(1 + inflationRate / 100, currentYear);
                const realPurchasingPower = runningBalance / discountFactor;

                schedule.push({
                    year: currentYear,
                    dailyExpense: dailyCost,
                    yearlySaved: yearlySavings,
                    totalCashSaved,
                    interestEarned: cumulativeInterest,
                    endingPortfolioBalance: runningBalance,
                    purchasingPowerAdjusted: realPurchasingPower,
                });
            }
        }

        const finalNominalWealth = runningBalance;
        const totalPrincipalSaved = totalCashSaved;
        const totalWealthGrowth = cumulativeInterest;
        const finalRealWealth = finalNominalWealth / Math.pow(1 + inflationRate / 100, validatedYears);

        const compoundShareRatio = finalNominalWealth > 0
            ? (totalWealthGrowth / finalNominalWealth) * 100
            : 0;
        const principalShareRatio = finalNominalWealth > 0
            ? (totalPrincipalSaved / finalNominalWealth) * 100
            : 0;

        return {
            weeklyCost,
            monthlyDeposit,
            yearlySavings,
            finalNominalWealth,
            totalPrincipalSaved,
            totalWealthGrowth,
            finalRealWealth,
            compoundShareRatio,
            principalShareRatio,
            schedule,
        };
    }, [dailyCost, daysPerWeek, annualRate, years, compoundingFrequency, inflationRate]);

    const applyPreset = (preset: HabitPreset) => {
        setDailyCost(preset.dailyCost);
        setDaysPerWeek(preset.daysPerWeek);
        setAnnualRate(preset.rate);
        setYears(preset.horizonYears);
        setActivePresetId(preset.id);
    };

    const handleCustomChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setDailyCost(5.75);
        setDaysPerWeek(5);
        setAnnualRate(8.0);
        setYears(20);
        setCompoundingFrequency(12);
        setInflationRate(2.5);
        setActivePresetId("latte-factor");
    };

    const handleCopySummary = () => {
        const summaryText = `Daily Habit Savings & Compounding Summary (TwisterTools):
--------------------------------------------------
Daily Habit Out-of-Pocket: ${currencySymbol}${dailyCost.toFixed(2)} (${daysPerWeek} days/wk)
Monthly Redirected Capital: ${currencySymbol}${Math.round(calculationResults.monthlyDeposit).toLocaleString()}
Annual Habit Spending: ${currencySymbol}${Math.round(calculationResults.yearlySavings).toLocaleString()}
Time Horizon: ${years} Years @ ${annualRate}% Nominal APY
Compounding Schedule: ${compoundingFrequency === 12 ? "Monthly" : compoundingFrequency === 365 ? "Daily" : compoundingFrequency === 4 ? "Quarterly" : "Annually"}
--------------------------------------------------
Cumulative Direct Cash Saved: ${currencySymbol}${Math.round(calculationResults.totalPrincipalSaved).toLocaleString()}
Compound Interest Multiplier: ${currencySymbol}${Math.round(calculationResults.totalWealthGrowth).toLocaleString()}
Projected Total Portfolio Value: ${currencySymbol}${Math.round(calculationResults.finalNominalWealth).toLocaleString()}
Inflation-Adjusted Purchasing Power (${inflationRate}%): ${currencySymbol}${Math.round(calculationResults.finalRealWealth).toLocaleString()}
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/daily-habit-savings-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = [
            "Year",
            "Yearly Habit Cash Saved",
            "Cumulative Cash Saved",
            "Cumulative Compounded Growth",
            "Nominal Portfolio Balance",
            `Real Balance (${inflationRate}% Inflation)`
        ];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.year,
                    row.yearlySaved.toFixed(2),
                    row.totalCashSaved.toFixed(2),
                    row.interestEarned.toFixed(2),
                    row.endingPortfolioBalance.toFixed(2),
                    row.purchasingPowerAdjusted.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `habit_savings_compounding_${years}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Coffee Savings & Compounding Habit Planner",
        "url": "https://twistertools.com/tools/calculators/daily-habit-savings-calculator",
        "description": "Calculate the true long-term compounding opportunity cost of small daily habits like takeout coffee, lunches, and subscriptions with inflation adjustments.",
        "applicationCategory": "FinanceApplication",
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
                "name": "What is the Latte Factor and how does small habit spending compound?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Latte Factor is a personal finance concept popularized by author David Bach. It illustrates how small, routine micro-expenses (such as a $5 daily coffee or snack), when redirected into an index fund compounding at 7% to 9% annual returns, can grow into hundreds of thousands of dollars over decades."
                }
            },
            {
                "@type": "Question",
                "name": "Does this habit calculator account for inflation and loss of purchasing power?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The calculator includes a real-time inflation discount parameter (defaulting to 2.5% per year). It displays both nominal future portfolio values and inflation-adjusted purchasing power in constant today-dollars."
                }
            },
            {
                "@type": "Question",
                "name": "Should someone completely cut out coffee and small pleasures to build wealth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Not necessarily. The objective is intentional spending. Understanding the true compounding opportunity cost empowers individuals to prioritize high-value life experiences while cutting frictionless, unrewarding micro-leaks."
                }
            },
            {
                "@type": "Question",
                "name": "How does compounding frequency impact recurring daily or monthly savings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "More frequent compounding intervals (daily or monthly vs. annually) allow newly deposited cash and accumulated returns to earn subsequent yields sooner, generating a higher effective annual percentage yield (APY)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* SEO & Search Knowledge Graph Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Inputs, Controls & Presets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Habit Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Currency Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-slate-50"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="CAD/AUD">CAD/AUD ($)</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            {/* Daily Habit Cost */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Daily Micro-Expense Amount
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{dailyCost.toFixed(2)} / occurrence
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.25"
                                        value={dailyCost === 0 ? "" : dailyCost}
                                        onChange={(e) => handleNumberInput(e, (val) => handleCustomChange(setDailyCost, Math.max(0, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Frequency per Week Slider */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Occurrences Per Week
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {daysPerWeek} {daysPerWeek === 1 ? "day" : "days"} / week
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="7"
                                    step="1"
                                    value={daysPerWeek}
                                    onChange={(e) => handleCustomChange(setDaysPerWeek, Number(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                                    <span>1 day (Occasional)</span>
                                    <span>5 days (Workdays)</span>
                                    <span>7 days (Daily)</span>
                                </div>
                            </div>

                            {/* Annual Return Rate & Duration */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Expected APY Return
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            step="0.5"
                                            value={annualRate === 0 ? "" : annualRate}
                                            onChange={(e) => handleNumberInput(e, (val) => handleCustomChange(setAnnualRate, Math.max(0, val)))}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> Horizon (Years)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={years === 0 ? "" : years}
                                        onChange={(e) => handleNumberInput(e, (val) => handleCustomChange(setYears, val === 0 ? 0 : Math.max(1, Math.min(50, val))))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Advanced Economics: Inflation & Compounding */}
                            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Compounding Frequency
                                    </label>
                                    <select
                                        value={compoundingFrequency}
                                        onChange={(e) => setCompoundingFrequency(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value={12}>Monthly (Standard)</option>
                                        <option value={365}>Daily (High Yield)</option>
                                        <option value={4}>Quarterly</option>
                                        <option value={1}>Annually</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                        Expected Inflation Rate (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="0.1"
                                            value={inflationRate === 0 ? "" : inflationRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setInflationRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fast Strategy Presets Bar */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Common Habit Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Active Preset
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {HABIT_PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {currencySymbol}{preset.dailyCost.toFixed(2)}
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
                            {copied ? "Copied Breakdown" : "Copy Savings Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Growth Visualizations & Summary Cards */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Compounding Wealth Outcome
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Visual Breakdown
                                </button>
                                <button
                                    onClick={() => setActiveTab("table")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Yearly Milestones
                                </button>
                            </div>
                        </div>

                        {/* Top Key Result Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    Total Future Portfolio
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.finalNominalWealth).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Real Purchasing Power: {currencySymbol}{Math.round(calculationResults.finalRealWealth).toLocaleString()}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    Pure Compounded Yield
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalWealthGrowth).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                    {calculationResults.compoundShareRatio.toFixed(1)}% generated purely from market returns
                                </p>
                            </div>
                        </div>

                        {/* Micro Out-of-Pocket Breakdown Row */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Weekly Cost</span>
                                <span className="text-xs md:text-sm font-bold text-slate-900">{currencySymbol}{calculationResults.weeklyCost.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Monthly Total</span>
                                <span className="text-xs md:text-sm font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.monthlyDeposit).toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase">Annual Drain</span>
                                <span className="text-xs md:text-sm font-bold text-rose-600">{currencySymbol}{Math.round(calculationResults.yearlySavings).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Visual Breakdown Tab vs Table Tab */}
                        {activeTab === "chart" ? (
                            <div className="space-y-5">
                                {/* Visual Distribution Ratio Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                                            Principal Saved: {currencySymbol}{Math.round(calculationResults.totalPrincipalSaved).toLocaleString()} ({calculationResults.principalShareRatio.toFixed(0)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-indigo-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Compound Growth: {currencySymbol}{Math.round(calculationResults.totalWealthGrowth).toLocaleString()} ({calculationResults.compoundShareRatio.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div
                                            className="bg-slate-700 h-full transition-all duration-500"
                                            style={{ width: `${calculationResults.principalShareRatio}%` }}
                                        />
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${calculationResults.compoundShareRatio}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Step Milestone Growth Trajectory */}
                                <div className="space-y-3 pt-1">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Cumulative Growth Trajectory
                                    </h3>
                                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                                        {calculationResults.schedule
                                            .filter((_, idx, arr) => {
                                                const step = Math.max(1, Math.floor(arr.length / 5));
                                                return idx % step === 0 || idx === arr.length - 1;
                                            })
                                            .map((item) => {
                                                const percentOfMax = (item.endingPortfolioBalance / calculationResults.finalNominalWealth) * 100;
                                                return (
                                                    <div key={item.year} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                            <span>Year {item.year}</span>
                                                            <span className="text-slate-900 font-bold">
                                                                {currencySymbol}{Math.round(item.endingPortfolioBalance).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.max(3, percentOfMax)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Schedule Breakdown Table */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[290px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Cash Saved</th>
                                            <th className="p-2.5">Interest Yield</th>
                                            <th className="p-2.5">Nominal Wealth</th>
                                            <th className="p-2.5">Real Purchasing Power</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Yr {row.year}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.totalCashSaved).toLocaleString()}</td>
                                                <td className="p-2.5 text-emerald-600 font-semibold">{currencySymbol}{Math.round(row.interestEarned).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{Math.round(row.endingPortfolioBalance).toLocaleString()}</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.purchasingPowerAdjusted).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side private calculation
                        </span>
                        <span>Zero data transmitted</span>
                    </div>
                </div>
            </div>

            {/* Educational Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Educational Disclaimer:</strong> This habit calculator illustrates the theoretical future opportunity cost of discretionary spending. It is designed for educational and financial modeling purposes and does not guarantee specific investment returns or constitute registered financial advice.
                </p>
            </div>

            {/* BELOW-THE-FOLD DEEP CONTENT & SEO SCATTER CARDS */}
            <div className="space-y-6">

                {/* Card 1: The Latte Factor Philosophy */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The "Latte Factor": Understanding the Opportunity Cost of Micro-Habits
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>"Latte Factor"</strong> is a foundational personal finance principle popularized by financial author David Bach. It demonstrates how seemingly inconsequential daily expenses—a morning cappuccino, convenience store snacks, premium delivery app surcharges, or unused subscriptions—silently compound into massive sums of lost wealth over decades.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When you spend <strong>$5.75 every workday</strong> on coffee, you are not merely spending $125 per month. The true economic cost is the <strong>opportunity cost</strong> of that capital: what that $125/month would have grown into if invested in a diversified low-cost index fund (such as the S&P 500 or total world market index) earning an average nominal rate of 8% to 10% annually.
                    </p>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Recurring Habit Future Value Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            The future compounding value of habitual cash flows deposited at regular intervals is calculated using the Future Value of an Annuity formula:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            FV = PMT × [ ((1 + r/n)^(n × t) - 1) / (r/n) ] × (1 + r/n)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>FV:</strong> Projected Future Wealth Balance</div>
                            <div><strong>PMT:</strong> Redirected Habit Savings per Month</div>
                            <div><strong>r:</strong> Annual Compounding Rate of Return</div>
                            <div><strong>n:</strong> Compounding Periods per Year (e.g., 12)</div>
                            <div><strong>t:</strong> Time Horizon in Years</div>
                            <div><strong>(1 + r/n):</strong> Beginning-of-period deposit annuity multiplier</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Real-World Habit Comparisons */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Habit Comparison: 10, 20, and 30-Year Compounding Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To visualize the compounding divergence between modest daily lifestyle habits, review the table below assuming an <strong>8.0% average annual market return</strong> compounded monthly:
                    </p>

                    {/* Comparison Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Habit Type</th>
                                    <th className="p-3">Daily Cost</th>
                                    <th className="p-3">Monthly Out-of-Pocket</th>
                                    <th className="p-3">10-Year Value</th>
                                    <th className="p-3">20-Year Value</th>
                                    <th className="p-3">30-Year Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Tv className="w-4 h-4 text-indigo-600" /> Digital Subscriptions
                                    </td>
                                    <td className="p-3">$2.20 (7 days/wk)</td>
                                    <td className="p-3">$66.86</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$12,306</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$39,634</td>
                                    <td className="p-3 font-bold text-indigo-600">$100,323</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Coffee className="w-4 h-4 text-amber-600" /> Workday Coffee
                                    </td>
                                    <td className="p-3">$5.75 (5 days/wk)</td>
                                    <td className="p-3">$124.58</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$22,930</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$73,889</td>
                                    <td className="p-3 font-bold text-indigo-600">$186,988</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                        <Utensils className="w-4 h-4 text-slate-600" /> Takeout Lunches
                                    </td>
                                    <td className="p-3">$14.50 (5 days/wk)</td>
                                    <td className="p-3">$314.17</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$57,823</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$186,324</td>
                                    <td className="p-3 font-bold text-indigo-600">$471,532</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900 flex items-center gap-1.5">
                                        <ShoppingBag className="w-4 h-4 text-indigo-700" /> Meal Delivery Apps
                                    </td>
                                    <td className="p-3 font-bold">$28.00 (3 days/wk)</td>
                                    <td className="p-3 font-bold">$364.00</td>
                                    <td className="p-3 text-emerald-700 font-bold">$66,993</td>
                                    <td className="p-3 text-emerald-700 font-bold">$215,876</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$546,323</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Redirecting just two takeout meals a week into automated index fund contributions over a 30-year career generates over <strong>half a million dollars</strong> in retirement assets.
                    </p>
                </section>

                {/* Card 3: Inflation & Real Purchasing Power Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Nominal Figures vs. Real Purchasing Power: Defeating Inflation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Financial projections frequently cite large nominal balances that can be deceiving if they ignore consumer price inflation. Over 20 or 30 years, inflation reduces what a dollar can buy at the grocery store or auto dealership.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To calculate your portfolio's <strong>Real Purchasing Power (PV in constant today-dollars)</strong>, we discount nominal wealth using the compound inflation formula:
                    </p>

                    <div className="bg-slate-100 border-l-4 border-indigo-600 p-4 rounded-r-xl font-mono text-sm text-slate-900 font-bold">
                        Real Purchasing Power = Nominal Future Balance / (1 + Inflation Rate)^Years
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For example, a nominal balance of <strong>$100,000 in 20 years</strong> at 2.5% annual inflation possesses the equivalent purchasing power of approximately <strong>$61,027 in today's currency</strong>. Even after adjusting for inflation, the wealth generated from compound investing significantly exceeds the original cash out-of-pocket savings.
                    </p>
                </section>

                {/* Card 4: Actionable Habit Optimization Framework */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            4-Step Blueprint to Convert Micro-Leaks into Automated Wealth
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-4 h-4" /> 1. Audit Frictionless Spending
                            </span>
                            <p className="text-sm text-slate-700">
                                Review your last 60 days of credit and debit card transactions. Categorize expenses into intentional joy vs. unconscious convenience spending (delivery surcharges, unused digital subscriptions, redundant food runs).
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Scale className="w-4 h-4" /> 2. Substitute Rather Than Deprive
                            </span>
                            <p className="text-sm text-slate-700">
                                Total austerity fails long-term. Instead of cutting coffee entirely, upgrade your home setup with high-grade whole beans and a quality espresso machine. You reduce your per-cup cost from $5.75 to $0.60 while preserving daily enjoyment.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <ArrowUpRight className="w-4 h-4" /> 3. Automate the Micro-Transfer
                            </span>
                            <p className="text-sm text-slate-700">
                                Every time you eliminate a $100/month recurring drain, configure an automated recurring transfer of that exact sum on payday into a low-cost index fund or high-yield account before you can spend it.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" /> 4. Track Milestone Compounding
                            </span>
                            <p className="text-sm text-slate-700">
                                Revisit your portfolio trajectory annually. Once your investments reach the "crossover point" (where annual compounding interest exceeds your yearly deposits), your money works harder than your daily budget cuts.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                What is the Latte Factor and how does small habit spending compound?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Latte Factor is a personal finance concept popularized by author David Bach. It illustrates how small, routine micro-expenses (such as a $5 daily coffee or snack), when redirected into an index fund compounding at 7% to 9% annual returns, can grow into hundreds of thousands of dollars over decades.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this habit calculator account for inflation and loss of purchasing power?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The calculator includes a real-time inflation discount parameter (defaulting to 2.5% per year). It displays both nominal future portfolio values and inflation-adjusted purchasing power in constant today-dollars.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should someone completely cut out coffee and small pleasures to build wealth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Not necessarily. The objective is intentional spending. Understanding the true compounding opportunity cost empowers individuals to prioritize high-value life experiences while cutting frictionless, unrewarding micro-leaks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does compounding frequency impact recurring daily or monthly savings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                More frequent compounding intervals (daily or monthly vs. annually) allow newly deposited cash and accumulated returns to earn subsequent yields sooner, generating a higher effective annual percentage yield (APY).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Disclaimer Footer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed compounding parameters.
                    </p>
                </section>

            </div>
        </div>
    );
}