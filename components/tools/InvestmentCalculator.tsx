"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    TrendingUp,
    DollarSign,
    HelpCircle,
    BookOpen,
    Calendar,
    Percent,
    RefreshCw,
    Download,
    Copy,
    Check,
    Layers,
    BarChart3,
    Sparkles,
    ArrowUpRight,
    ShieldCheck,
    Target,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    Flame,
    Scale
} from "lucide-react";

interface ScheduleRow {
    year: number;
    startingBalance: number;
    contributions: number;
    interestEarned: number;
    endingBalance: number;
    totalContributions: number;
    totalInterest: number;
}

interface Preset {
  id: string;
  label: string;
  init: number;
  monthly: number;
  rate: number;
  years: number;
  tag: string;
}

const PRESETS: Preset[] = [
  { id: "moderate", label: "Moderate Builder", init: 5000, monthly: 250, rate: 8, years: 15, tag: "8% ROI" },
  { id: "aggressive", label: "Aggressive Wealth", init: 25000, monthly: 1000, rate: 10, years: 25, tag: "10% ROI" },
  { id: "conservative", label: "Conservative Starter", init: 1000, monthly: 100, rate: 5, years: 10, tag: "5% ROI" },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

export default function InvestmentCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [initialInvestment, setInitialInvestment] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [annualRate, setAnnualRate] = useState<number>(7.5);
    const [years, setYears] = useState<number>(20);
    const [compoundingFrequency, setCompoundingFrequency] = useState<number>(12); // 12 = Monthly, 1 = Annually, 4 = Quarterly, 365 = Daily
    const [contributionTiming, setContributionTiming] = useState<"end" | "beginning">("end");
    const [variance, setVariance] = useState<number>(0); // Target rate variance +/- %

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];

    // Ref for print/export container
    const exportRef = useRef<HTMLDivElement>(null);

    // Math & Schedule Calculation
    const calculationResults = useMemo(() => {
        const totalMonths = Math.max(1, Math.min(years * 12, 1200)); // Cap at 100 years
        const r = annualRate / 100;
        const n = compoundingFrequency;

        let currentBalance = initialInvestment;
        let totalContributed = initialInvestment;
        let totalInterestEarned = 0;

        const schedule: ScheduleRow[] = [];

        let yearlyStartingBalance = initialInvestment;
        let yearlyContributions = 0;
        let yearlyInterest = 0;

        for (let month = 1; month <= totalMonths; month++) {
            // Handle contribution at beginning of period if selected
            if (contributionTiming === "beginning") {
                currentBalance += monthlyContribution;
                totalContributed += monthlyContribution;
                yearlyContributions += monthlyContribution;
            }

            // Calculate monthly interest based on compounding frequency
            const monthlyRate = Math.pow(1 + r / n, n / 12) - 1;
            const interestForMonth = currentBalance * monthlyRate;

            currentBalance += interestForMonth;
            totalInterestEarned += interestForMonth;
            yearlyInterest += interestForMonth;

            // Handle contribution at end of period if selected
            if (contributionTiming === "end") {
                currentBalance += monthlyContribution;
                totalContributed += monthlyContribution;
                yearlyContributions += monthlyContribution;
            }

            // Record yearly milestone
            if (month % 12 === 0 || month === totalMonths) {
                const yearNum = Math.ceil(month / 12);
                schedule.push({
                    year: yearNum,
                    startingBalance: yearlyStartingBalance,
                    contributions: yearlyContributions,
                    interestEarned: yearlyInterest,
                    endingBalance: currentBalance,
                    totalContributions: totalContributed,
                    totalInterest: totalInterestEarned,
                });

                yearlyStartingBalance = currentBalance;
                yearlyContributions = 0;
                yearlyInterest = 0;
            }
        }

        // High and Low variance scenarios
        const calculateVarianceTotal = (rateOffset: number) => {
            const adjustedRate = Math.max(0, (annualRate + rateOffset) / 100);
            let bal = initialInvestment;
            for (let m = 1; m <= totalMonths; m++) {
                if (contributionTiming === "beginning") bal += monthlyContribution;
                const mRate = Math.pow(1 + adjustedRate / n, n / 12) - 1;
                bal += bal * mRate;
                if (contributionTiming === "end") bal += monthlyContribution;
            }
            return bal;
        };

        const upperResult = variance > 0 ? calculateVarianceTotal(variance) : currentBalance;
        const lowerResult = variance > 0 ? calculateVarianceTotal(-variance) : currentBalance;

        return {
            finalBalance: currentBalance,
            totalContributed,
            totalInterestEarned,
            schedule,
            upperResult,
            lowerResult,
            interestRatio: currentBalance > 0 ? (totalInterestEarned / currentBalance) * 100 : 0,
            principalRatio: currentBalance > 0 ? (totalContributed / currentBalance) * 100 : 0,
        };
    }, [initialInvestment, monthlyContribution, annualRate, years, compoundingFrequency, contributionTiming, variance]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setInitialInvestment(preset.init);
        setMonthlyContribution(preset.monthly);
        setAnnualRate(preset.rate);
        setYears(preset.years);
        setActivePresetId(preset.id);
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setInitialInvestment(10000);
        setMonthlyContribution(500);
        setAnnualRate(7.5);
        setYears(20);
        setCompoundingFrequency(12);
        setContributionTiming("end");
        setVariance(0);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Compound Investment Summary (TwisterTools):
----------------------------------------
Initial Principal: ${currencySymbol}${initialInvestment.toLocaleString()}
Monthly Deposit: ${currencySymbol}${monthlyContribution.toLocaleString()}
Est. Annual Return: ${annualRate}%
Investment Horizon: ${years} Years
Compounding Frequency: ${compoundingFrequency === 12 ? "Monthly" : compoundingFrequency === 1 ? "Annually" : compoundingFrequency === 4 ? "Quarterly" : "Daily"}
----------------------------------------
Total Contributions: ${currencySymbol}${Math.round(calculationResults.totalContributed).toLocaleString()}
Total Interest Earned: ${currencySymbol}${Math.round(calculationResults.totalInterestEarned).toLocaleString()}
Final Future Value: ${currencySymbol}${Math.round(calculationResults.finalBalance).toLocaleString()}
----------------------------------------
Calculated at twistertools.com/tools/calculators/investment-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Starting Balance", "Annual Contributions", "Interest Earned", "Ending Balance", "Total Principal", "Total Interest"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.year,
                    row.startingBalance.toFixed(2),
                    row.contributions.toFixed(2),
                    row.interestEarned.toFixed(2),
                    row.endingBalance.toFixed(2),
                    row.totalContributions.toFixed(2),
                    row.totalInterest.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `investment_breakdown_${years}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schema for SEO & GEO (Generative Engine Optimization)
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Compound Investment & Return Calculator",
        "url": "https://twistertools.com/tools/calculators/investment-calculator",
        "description": "Calculate long-term compound growth, recurring monthly contributions, inflation impact, and ROI schedules with an intuitive, browser-native finance calculator.",
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
                "name": "What is compound interest and how does it build long-term wealth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Compound interest is interest calculated on the initial principal sum plus all accumulated interest from previous compounding periods. Unlike simple interest, compound growth creates an accelerating curve where your reinvested earnings generate their own gains over time."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Rule of 72 in financial planning?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Rule of 72 is a mental math shortcut used to estimate the years required to double an investment at a fixed annual rate of interest. Divide 72 by the expected rate of return (e.g., 72 / 8% = 9 years to double)."
                }
            },
            {
                "@type": "Question",
                "name": "How does compounding frequency impact investment returns?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Compounding frequency determines how often interest is calculated and added to the balance. Daily compounding yields slightly more than monthly, and monthly yields more than annual compounding, due to the faster accumulation of interest-earning capital."
                }
            },
            {
                "@type": "Question",
                "name": "What is reasonable expected annual return for index fund investments?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Historically, broad market stock indices like the S&P 500 have generated long-term nominal average returns of roughly 9% to 10% annually before inflation. After inflation, real average annual returns average between 6% and 7%."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Investment Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Inputs
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

                        <div className="space-y-5">
                            {/* Initial Investment */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Initial Capital Principal
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{initialInvestment.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={initialInvestment}
                                        onChange={(e) => handleInputChange(setInitialInvestment, Math.max(0, Number(e.target.value)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Monthly Contribution */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Recurring Monthly Deposit
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{monthlyContribution.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="50"
                                        value={monthlyContribution}
                                        onChange={(e) => handleInputChange(setMonthlyContribution, Math.max(0, Number(e.target.value)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Rate & Horizon */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Expected Rate (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="0.1"
                                            value={annualRate}
                                            onChange={(e) => handleInputChange(setAnnualRate, Math.max(0, Number(e.target.value)))}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Duration (Years)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={years}
                                        onChange={(e) => handleInputChange(setYears, Math.max(1, Math.min(100, Number(e.target.value))))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Compound Frequency & Contribution Timing */}
                            <div className="pt-2 border-t border-slate-100 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Compounding Schedule
                                        </label>
                                        <select
                                            value={compoundingFrequency}
                                            onChange={(e) => setCompoundingFrequency(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={12}>Monthly</option>
                                            <option value={1}>Annually</option>
                                            <option value={4}>Quarterly</option>
                                            <option value={365}>Daily</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                                            Deposit Timing
                                        </label>
                                        <select
                                            value={contributionTiming}
                                            onChange={(e) => setContributionTiming(e.target.value as "end" | "beginning")}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="end">End of Month</option>
                                            <option value="beginning">Beginning of Month</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Return Rate Variance Slider */}
                                <div>
                                    <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                                        <span className="font-semibold">Simulated Rate Variance (+/-)</span>
                                        <span className="font-bold text-indigo-600">±{variance}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.5"
                                        value={variance}
                                        onChange={(e) => setVariance(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Evaluates upper and lower market return boundaries.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT: Fully scrollable pill bar on desktop & mobile */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Fast Strategy Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            {/* Scrollable Container Fix */}
                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${
                                                isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                            }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
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
                            {copied ? "Copied Summary" : "Copy Projection Summary"}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Growth Projection
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Visual Distribution
                                </button>
                                <button
                                    onClick={() => setActiveTab("table")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Annual Schedule
                                </button>
                            </div>
                        </div>

                        {/* Key Metric Highlight Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Future Value (FV)</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.finalBalance).toLocaleString()}
                                </p>
                                {variance > 0 && (
                                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                        Range: {currencySymbol}{Math.round(calculationResults.lowerResult).toLocaleString()} - {currencySymbol}{Math.round(calculationResults.upperResult).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Interest Yield</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalInterestEarned).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                    {calculationResults.interestRatio.toFixed(1)}% derived from compound interest
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-5">
                                {/* Visual Ratio Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                                            Deposited Principal: {currencySymbol}{Math.round(calculationResults.totalContributed).toLocaleString()} ({calculationResults.principalRatio.toFixed(0)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-indigo-600">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Compound Earnings: {currencySymbol}{Math.round(calculationResults.totalInterestEarned).toLocaleString()} ({calculationResults.interestRatio.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div
                                            className="bg-slate-700 h-full transition-all duration-500"
                                            style={{ width: `${calculationResults.principalRatio}%` }}
                                        />
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${calculationResults.interestRatio}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Milestone Progress Trajectory */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Milestone Growth Progression
                                    </h3>
                                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                        {calculationResults.schedule
                                            .filter((_, idx, arr) => {
                                                const step = Math.max(1, Math.floor(arr.length / 5));
                                                return idx % step === 0 || idx === arr.length - 1;
                                            })
                                            .map((item) => {
                                                const percentOfMax = (item.endingBalance / calculationResults.finalBalance) * 100;
                                                return (
                                                    <div key={item.year} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                                            <span>Year {item.year}</span>
                                                            <span>{currencySymbol}{Math.round(item.endingBalance).toLocaleString()}</span>
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
                            /* Schedule Table Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Total Deposits</th>
                                            <th className="p-2.5">Year Interest</th>
                                            <th className="p-2.5">Ending Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Year {row.year}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.totalContributions).toLocaleString()}</td>
                                                <td className="p-2.5 text-emerald-600 font-semibold">{currencySymbol}{Math.round(row.interestEarned).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{Math.round(row.endingBalance).toLocaleString()}</td>
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
                            Real-time local calculation
                        </span>
                        <span>Zero server latency</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6 pt-2">

                {/* Card 1: Comprehensive Financial Definitions & Core Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is Compound Interest? Comprehensive Guide & Core Concepts
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Compound interest</strong> (often referred to as compound growth) occurs when interest earned on a principal investment is added back to the original balance. In subsequent periods, interest accrues not only on your initial capital deposit but also on the cumulative total of previously earned returns. This compounding cycle creates an exponential curve over extended time frames.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        By contrast, <strong>simple interest</strong> pays returns strictly on the principal amount, generating linear growth. Over long horizons, compound interest dwarfs simple interest gains because your capital generates income independently of your ongoing personal savings.
                    </p>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Master Compounding Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            To calculate future wealth with recurring deposits and compound interest, financial analysts apply the following generalized mathematical equation:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            A = P(1 + r/n)^(nt) + PMT × [ ((1 + r/n)^(nt) - 1) / (r/n) ]
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>A:</strong> Total Future Value (Final Portfolio Balance)</div>
                            <div><strong>P:</strong> Initial Principal Deposit</div>
                            <div><strong>PMT:</strong> Recurring Monthly Contribution</div>
                            <div><strong>r:</strong> Nominal Annual Rate of Return (decimal)</div>
                            <div><strong>n:</strong> Compounding Periods Per Year (e.g., 12)</div>
                            <div><strong>t:</strong> Total Investment Horizon in Years</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Calculation Example: The Power of 20-Year Growth
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate the dramatic impact of compound growth, consider an investor named Alex who starts with an initial deposit and commits to consistent monthly contributions:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Example Case Study Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Initial Deposit:</strong> $10,000</li>
                            <li><strong>Monthly Addition:</strong> $500 per month ($6,000 yearly)</li>
                            <li><strong>Annual Expected Return:</strong> 8.0% nominal rate</li>
                            <li><strong>Compounding Interval:</strong> Monthly (n = 12)</li>
                            <li><strong>Investment Horizon:</strong> 20 Years</li>
                        </ul>
                    </div>

                    {/* Breakdown Comparison Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Milestone</th>
                                    <th className="p-3">Total Out-of-Pocket Deposits</th>
                                    <th className="p-3">Cumulative Interest Earned</th>
                                    <th className="p-3">Total Portfolio Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 5</td>
                                    <td className="p-3">$40,000</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$10,919</td>
                                    <td className="p-3 font-bold text-slate-900">$50,919</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 10</td>
                                    <td className="p-3">$70,000</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$41,858</td>
                                    <td className="p-3 font-bold text-slate-900">$111,858</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 15</td>
                                    <td className="p-3">$100,000</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$102,771</td>
                                    <td className="p-3 font-bold text-slate-900">$202,771</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 20 (Final)</td>
                                    <td className="p-3 font-bold text-slate-900">$130,000</td>
                                    <td className="p-3 text-emerald-600 font-bold">$208,016</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$338,016</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Insight:</strong> By Year 20, the cumulative interest earned (<strong>$208,016</strong>) far exceeds the total cash contributed by the investor (<strong>$130,000</strong>). Compound interest generated over 60% of the final total portfolio wealth.
                    </p>
                </section>

                {/* Card 3: Comparing Compounding Frequencies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Compounding Frequency Comparison: Daily vs Monthly vs Annual
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The frequency with which earned returns are calculated and credited back to your principal balance impacts your ultimate rate of return. The table below illustrates how different compounding schedules affect a <strong>$50,000 lump sum investment</strong> at an <strong>8% interest rate</strong> over <strong>25 years</strong> with zero additional contributions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Compounding Frequency</th>
                                    <th className="p-3">Periods / Year (n)</th>
                                    <th className="p-3">Effective Annual Yield (APY)</th>
                                    <th className="p-3">25-Year Future Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Annually</td>
                                    <td className="p-3">1</td>
                                    <td className="p-3">8.00%</td>
                                    <td className="p-3 font-bold text-slate-900">$342,424</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Quarterly</td>
                                    <td className="p-3">4</td>
                                    <td className="p-3">8.24%</td>
                                    <td className="p-3 font-bold text-slate-900">$362,028</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly</td>
                                    <td className="p-3">12</td>
                                    <td className="p-3">8.30%</td>
                                    <td className="p-3 font-bold text-slate-900">$367,008</td>
                                </tr>
                                <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-900">Daily</td>
                                    <td className="p-3 font-bold text-slate-900">365</td>
                                    <td className="p-3 font-bold text-emerald-700">8.33%</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$369,453</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Transitioning from annual to daily compounding yields an additional <strong>$27,029</strong> in pure growth on the same initial principal, demonstrating why shorter compounding intervals are favored in high-yield accounts.
                    </p>
                </section>

                {/* Card 4: Mental Math & The Rule of 72 */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Rule of 72: Quick Doubling Time Calculation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Rule of 72</strong> is a well-known financial formula used to estimate how many years it will take to double an investment at a fixed annual interest rate.
                    </p>

                    <div className="bg-slate-100 border-l-4 border-indigo-600 p-4 rounded-r-xl font-mono text-sm text-slate-900 font-bold">
                        Years to Double = 72 / Annual Interest Rate
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">4% Return</span>
                            <span className="text-lg font-extrabold text-slate-900">18 Years</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">6% Return</span>
                            <span className="text-lg font-extrabold text-slate-900">12 Years</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">8% Return</span>
                            <span className="text-lg font-extrabold text-indigo-600">9 Years</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">12% Return</span>
                            <span className="text-lg font-extrabold text-indigo-600">6 Years</span>
                        </div>
                    </div>
                </section>

                {/* Card 5: Inflation Adjustment & Real Rates of Return */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Inflation and Purchasing Power: Nominal vs. Real Returns
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When projecting long-term growth, it is crucial to distinguish between <strong>nominal returns</strong> (the face-value dollar gain) and <strong>real returns</strong> (purchasing power adjusted for inflation).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Historically, global economic inflation averages approximately 2.5% to 3.0% annually. If your investment portfolio generates a 9% nominal return while inflation averages 3%, your real rate of return is approximately 6%.
                    </p>

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm space-y-1">
                        <p className="font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" /> Inflation Rule of Thumb
                        </p>
                        <p>
                            To estimate inflation-adjusted wealth in today's currency, subtract an estimated inflation rate (e.g., 2.5%) from your expected rate of return before running calculations in this tool.
                        </p>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
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
                                What is compound interest and how does it build long-term wealth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Compound interest is interest calculated on the initial principal sum plus all accumulated interest from previous compounding periods. Unlike simple interest, compound growth creates an accelerating curve where your reinvested earnings generate their own gains over time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Rule of 72 in financial planning?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Rule of 72 is a mental math shortcut used to estimate the years required to double an investment at a fixed annual rate of interest. Divide 72 by the expected rate of return (e.g., 72 / 8% = 9 years to double).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does compounding frequency impact investment returns?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Compounding frequency determines how often interest is calculated and added to the balance. Daily compounding yields slightly more than monthly, and monthly yields more than annual compounding, due to the faster accumulation of interest-earning capital.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a reasonable expected annual return for index fund investments?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Historically, broad market stock indices like the S&P 500 have generated long-term nominal average returns of roughly 9% to 10% annually before inflation. After inflation, real average annual returns average between 6% and 7%.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs text-slate-500">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                    </p>
                </section>

            </div>
        </div>
    );
}
