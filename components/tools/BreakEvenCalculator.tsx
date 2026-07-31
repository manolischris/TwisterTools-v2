"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Scale,
    DollarSign,
    HelpCircle,
    BookOpen,
    RefreshCw,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    Lightbulb,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    TrendingDown,
    Building2,
    PieChart,
    Layers,
    Percent,
    Target,
    Coins,
    CheckCircle2
} from "lucide-react";

interface BreakEvenScheduleRow {
    units: number;
    revenue: number;
    totalCosts: number;
    profit: number;
}

interface Preset {
    id: string;
    label: string;
    fixedCosts: number;
    pricePerUnit: number;
    costPerUnit: number;
    targetProfit: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "saas", label: "SaaS Subscription", fixedCosts: 25000, pricePerUnit: 99, costPerUnit: 15, targetProfit: 10000, tag: "84.8% Margin" },
    { id: "ecom", label: "E-Commerce Physical Product", fixedCosts: 12000, pricePerUnit: 45, costPerUnit: 18, targetProfit: 5000, tag: "60.0% Margin" },
    { id: "consulting", label: "Consulting / Agency", fixedCosts: 8000, pricePerUnit: 150, costPerUnit: 30, targetProfit: 15000, tag: "80.0% Margin" },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

export default function BreakEvenCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [fixedCosts, setFixedCosts] = useState<number>(15000);
    const [pricePerUnit, setPricePerUnit] = useState<number>(50);
    const [costPerUnit, setCostPerUnit] = useState<number>(20);
    const [targetProfit, setTargetProfit] = useState<number>(5000);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Math & Break-Even Calculation
    const calculationResults = useMemo(() => {
        const cmPerUnit = pricePerUnit - costPerUnit;
        const cmRatio = pricePerUnit > 0 ? (cmPerUnit / pricePerUnit) * 100 : 0;

        // Break-Even Point in Units: Fixed Costs / Contribution Margin Per Unit
        const breakEvenUnits = cmPerUnit > 0 ? Math.ceil(fixedCosts / cmPerUnit) : 0;

        // Break-Even Point in Revenue: Fixed Costs / Contribution Margin Ratio
        const breakEvenRevenue = cmRatio > 0 ? (fixedCosts / (cmRatio / 100)) : 0;

        // Target Profit Units: (Fixed Costs + Target Profit) / Contribution Margin Per Unit
        const targetProfitUnits = cmPerUnit > 0 ? Math.ceil((fixedCosts + Math.max(0, targetProfit)) / cmPerUnit) : 0;
        const targetProfitRevenue = targetProfitUnits * pricePerUnit;

        // Sensitivity Schedule (0% to 200% of Break-Even Units)
        const schedule: BreakEvenScheduleRow[] = [];
        const baseStep = breakEvenUnits > 0 ? Math.ceil(breakEvenUnits / 5) : 50;
        const maxUnits = breakEvenUnits > 0 ? Math.ceil(breakEvenUnits * 2) : 500;

        for (let u = 0; u <= maxUnits; u += Math.max(1, baseStep)) {
            const revenue = u * pricePerUnit;
            const variableCosts = u * costPerUnit;
            const totalCosts = fixedCosts + variableCosts;
            const profit = revenue - totalCosts;

            schedule.push({
                units: u,
                revenue,
                totalCosts,
                profit,
            });
        }

        return {
            cmPerUnit,
            cmRatio,
            breakEvenUnits,
            breakEvenRevenue,
            targetProfitUnits,
            targetProfitRevenue,
            schedule,
            isValid: cmPerUnit > 0,
        };
    }, [fixedCosts, pricePerUnit, costPerUnit, targetProfit]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setFixedCosts(preset.fixedCosts);
        setPricePerUnit(preset.pricePerUnit);
        setCostPerUnit(preset.costPerUnit);
        setTargetProfit(preset.targetProfit);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setFixedCosts(15000);
        setPricePerUnit(50);
        setCostPerUnit(20);
        setTargetProfit(5000);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Break-Even Point & Profitability Summary (TwisterTools):
----------------------------------------
Fixed Costs: ${currencySymbol}${fixedCosts.toLocaleString()}
Price Per Unit: ${currencySymbol}${pricePerUnit.toLocaleString()}
Variable Cost Per Unit: ${currencySymbol}${costPerUnit.toLocaleString()}
Target Monthly Profit: ${currencySymbol}${targetProfit.toLocaleString()}
----------------------------------------
Contribution Margin / Unit: ${currencySymbol}${calculationResults.cmPerUnit.toFixed(2)} (${calculationResults.cmRatio.toFixed(2)}%)
Break-Even Point (Units): ${calculationResults.breakEvenUnits.toLocaleString()} units
Break-Even Revenue: ${currencySymbol}${Math.round(calculationResults.breakEvenRevenue).toLocaleString()}
Target Profit Point (Units): ${calculationResults.targetProfitUnits.toLocaleString()} units
Target Profit Revenue: ${currencySymbol}${Math.round(calculationResults.targetProfitRevenue).toLocaleString()}
----------------------------------------
Calculated at twistertools.com/tools/calculators/break-even-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Units Sold", "Total Revenue", "Total Costs (Fixed + Variable)", "Net Profit / Loss"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.units,
                    row.revenue.toFixed(2),
                    row.totalCosts.toFixed(2),
                    row.profit.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `break_even_analysis_${calculationResults.breakEvenUnits}_units.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Break-Even Point & Profitability Calculator",
        "url": "https://twistertools.com/tools/calculators/break-even-calculator",
        "description": "Calculate unit break-even points, contribution margin ratios, target profit sales volume, and fixed vs. variable cost structures.",
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
                "name": "What is a Break-Even Point?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The break-even point is the exact production or sales volume at which total revenue equals total costs (fixed costs plus variable costs), resulting in zero net profit or loss."
                }
            },
            {
                "@type": "Question",
                "name": "What is Contribution Margin and why does it matter?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Contribution Margin is the revenue remaining per unit after deducting variable costs. It represents the proportion of sales revenue available to cover fixed costs and generate profit."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the Break-Even Point in units?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The break-even point in units is calculated by dividing Total Fixed Costs by the Contribution Margin Per Unit (Price Per Unit minus Variable Cost Per Unit)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Fixed and Variable Costs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fixed costs (e.g., rent, salaries, software subscriptions) remain constant regardless of production volume. Variable costs (e.g., raw materials, packaging, payment fees) scale directly with unit volume."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate volume required for a target profit?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To find sales volume for a target profit, add the desired profit amount to total fixed costs, then divide that sum by the contribution margin per unit."
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
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                Business Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
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

                        <div className="space-y-5">
                            {/* Fixed Costs */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" /> Total Fixed Costs (Per Period)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={fixedCosts || ""}
                                        onChange={(e) => {
                                            setFixedCosts(Math.max(0, Number(e.target.value)));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Rent, salaries, insurance, platform subscriptions, equipment leasing.</p>
                            </div>

                            {/* Price Per Unit & Variable Cost Per Unit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Price Per Unit
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="5"
                                            value={pricePerUnit || ""}
                                            onChange={(e) => {
                                                setPricePerUnit(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-indigo-600" /> Variable Cost / Unit
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="5"
                                            value={costPerUnit || ""}
                                            onChange={(e) => {
                                                setCostPerUnit(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Target Profit */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-indigo-600" /> Target Net Profit Goal (Optional)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={targetProfit || ""}
                                        onChange={(e) => {
                                            setTargetProfit(Math.max(0, Number(e.target.value)));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Preset Business Models
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
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
                                Profitability Metrics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("table")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Sensitivity Schedule
                                </button>
                            </div>
                        </div>

                        {!calculationResults.isValid ? (
                            <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                Invalid unit economics: Price per unit must be greater than variable cost per unit to achieve break-even.
                            </div>
                        ) : (
                            <>
                                {/* Key Metric Highlight Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border bg-indigo-50/70 border-indigo-100 col-span-2 sm:col-span-1">
                                        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                            Break-Even Volume
                                        </p>
                                        <p className="text-3xl font-extrabold text-indigo-950 mt-1 flex items-center gap-1">
                                            {calculationResults.breakEvenUnits.toLocaleString()}
                                            <span className="text-xs font-semibold text-indigo-600">units</span>
                                        </p>
                                        <p className="text-[11px] font-semibold text-indigo-700 mt-1">
                                            Gross Revenue: {currencySymbol}{Math.round(calculationResults.breakEvenRevenue).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 col-span-2 sm:col-span-1">
                                        <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Target Profit Volume</p>
                                        <p className="text-2xl font-extrabold text-emerald-950 mt-1">
                                            {calculationResults.targetProfitUnits.toLocaleString()} units
                                        </p>
                                        <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                                            Target Revenue: {currencySymbol}{Math.round(calculationResults.targetProfitRevenue).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Content Tabs */}
                                {activeTab === "chart" ? (
                                    <div className="space-y-6">
                                        {/* Margin & Unit Economics */}
                                        <div className="space-y-3 pt-2">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Unit Margin & Economics Breakdown
                                            </h3>
                                            <div>
                                                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                                        Variable Cost ({currencySymbol}{costPerUnit})
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                                        Margin ({currencySymbol}{calculationResults.cmPerUnit.toFixed(2)} / {calculationResults.cmRatio.toFixed(1)}%)
                                                    </span>
                                                </div>
                                                <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                                    <div
                                                        className="bg-slate-800 h-full transition-all duration-500"
                                                        style={{ width: `${pricePerUnit > 0 ? (costPerUnit / pricePerUnit) * 100 : 0}%` }}
                                                    />
                                                    <div
                                                        className="bg-indigo-600 h-full transition-all duration-500"
                                                        style={{ width: `${Math.max(0, calculationResults.cmRatio)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detail Breakdown List */}
                                        <div className="space-y-3 pt-4 border-t border-slate-100">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                Financial Summary
                                            </h3>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                    <span className="text-sm font-semibold text-slate-700">Fixed Overhead Costs</span>
                                                    <span className="font-bold text-slate-900">{currencySymbol}{fixedCosts.toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                    <span className="text-sm font-semibold text-slate-700">Contribution Margin / Unit</span>
                                                    <span className="font-bold text-indigo-600">{currencySymbol}{calculationResults.cmPerUnit.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                    <span className="text-sm font-semibold text-slate-700">Contribution Margin Ratio</span>
                                                    <span className="font-bold text-slate-900">{calculationResults.cmRatio.toFixed(2)}%</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                    <span className="text-sm font-semibold text-slate-700">Target Profit Goal</span>
                                                    <span className="font-bold text-emerald-600">+{currencySymbol}{targetProfit.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Sensitivity Schedule Table Tab */
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[360px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200 z-10">
                                                <tr>
                                                    <th className="p-2.5">Units</th>
                                                    <th className="p-2.5">Total Revenue</th>
                                                    <th className="p-2.5">Total Costs</th>
                                                    <th className="p-2.5">Net Profit/Loss</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                                {calculationResults.schedule.map((row) => (
                                                    <tr key={row.units} className={`hover:bg-slate-50/80 transition ${row.units >= calculationResults.breakEvenUnits ? "bg-emerald-50/30" : ""}`}>
                                                        <td className="p-2.5 font-bold text-slate-900">{row.units.toLocaleString()} units</td>
                                                        <td className="p-2.5 text-slate-900 font-semibold">{currencySymbol}{Math.round(row.revenue).toLocaleString()}</td>
                                                        <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.totalCosts).toLocaleString()}</td>
                                                        <td className={`p-2.5 font-bold ${row.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                            {row.profit >= 0 ? `+${currencySymbol}` : `-${currencySymbol}`}{Math.abs(Math.round(row.profit)).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side real-time calculation
                        </span>
                        <span>CM Margin: {calculationResults.cmRatio.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            {/* Financial Disclaimer Banner Alert */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Financial Definitions & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Break-Even Analysis & Unit Economics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Break-Even Analysis</strong> is a foundational financial planning tool used by founders, finance directors, and product managers to identify the minimum sales volume required to cover all operational overheads. Reaching the break-even point signifies that a enterprise has transitioned from losing money to generating positive net profits.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> Fixed Costs
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Overhead expenditures that remain static regardless of unit volume. Examples include property leases, administrative salaries, insurance premiums, software licenses, and equipment depreciation.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Coins className="w-4 h-4 text-indigo-600" /> Variable Costs
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Production costs that scale directly with output volume. Examples include raw materials, direct labor per unit, packaging, shipping, payment gateway processing fees, and sales commissions.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Formulas & Calculations
                        </h3>
                        <p className="text-xs text-slate-300">
                            The exact formulas used by financial analysts to evaluate break-even points and profit goals:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Contribution Margin Per Unit ($):</strong> Price Per Unit - Variable Cost Per Unit</div>
                            <div><strong>2. Break-Even Point (Units):</strong> Total Fixed Costs / Contribution Margin Per Unit</div>
                            <div><strong>3. Break-Even Point (Revenue):</strong> Total Fixed Costs / (Contribution Margin / Unit Price)</div>
                            <div><strong>4. Sales Volume for Target Profit (Units):</strong> (Total Fixed Costs + Target Profit) / Contribution Margin Per Unit</div>
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
                            Step-by-Step Worked Break-Even Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Consider a coffee roasting business planning to launch a new specialty bean line. The financial parameters are structured as follows:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Parameter</th>
                                    <th className="p-3">Value</th>
                                    <th className="p-3">Calculation Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly Fixed Costs</td>
                                    <td className="p-3 font-bold">$10,000</td>
                                    <td className="p-3 text-xs text-slate-600">Rent, roaster lease, marketing & staff</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Retail Price Per Bag</td>
                                    <td className="p-3 font-bold">$25.00</td>
                                    <td className="p-3 text-xs text-slate-600">Selling price per 12oz bag</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Variable Cost Per Bag</td>
                                    <td className="p-3 font-bold">$10.00</td>
                                    <td className="p-3 text-xs text-slate-600">Green coffee beans, packaging & shipping</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Contribution Margin / Unit</td>
                                    <td className="p-3 font-bold text-indigo-600">$15.00</td>
                                    <td className="p-3 text-xs text-slate-600">$25.00 - $10.00 = $15.00 (60% margin)</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Break-Even Volume</td>
                                    <td className="p-3 font-extrabold text-indigo-700">667 Bags</td>
                                    <td className="p-3 text-xs font-semibold text-indigo-900">$10,000 / $15.00 = 666.67 units ($16,675 revenue)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Strategic Insight:</strong> If the roaster targets a net monthly profit of $5,000, the required sales volume becomes ($10,000 + $5,000) / $15.00 = 1,000 bags per month ($25,000 in total gross revenue).
                    </p>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
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
                                What is a Break-Even Point?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The break-even point is the exact production or sales volume at which total revenue equals total costs (fixed costs plus variable costs), resulting in zero net profit or loss.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Contribution Margin and why does it matter?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Contribution Margin is the revenue remaining per unit after deducting variable costs. It represents the proportion of sales revenue available to cover fixed costs and generate profit.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the Break-Even Point in units?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The break-even point in units is calculated by dividing Total Fixed Costs by the Contribution Margin Per Unit (Price Per Unit minus Variable Cost Per Unit).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Fixed and Variable Costs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Fixed costs (e.g., rent, salaries, software subscriptions) remain constant regardless of production volume. Variable costs (e.g., raw materials, packaging, payment fees) scale directly with unit volume.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate volume required for a target profit?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To find sales volume for a target profit, add the desired profit amount to total fixed costs, then divide that sum by the contribution margin per unit.
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