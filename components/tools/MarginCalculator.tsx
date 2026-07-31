"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    TrendingUp,
    DollarSign,
    HelpCircle,
    BookOpen,
    Percent,
    RefreshCw,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    Scale,
    Coins,
    CheckCircle2,
    Briefcase,
    Tag,
    Receipt,
    Target
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    cost: number;
    marginOrMarkup: number;
    calcMode: "margin" | "markup";
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "ecom-retail", label: "E-Commerce Standard", cost: 25, marginOrMarkup: 50, calcMode: "margin", tag: "50% Margin" },
    { id: "wholesale", label: "Wholesale Distribution", cost: 100, marginOrMarkup: 30, calcMode: "markup", tag: "30% Markup" },
    { id: "saas-digital", label: "Digital Product / SaaS", cost: 15, marginOrMarkup: 80, calcMode: "margin", tag: "80% Margin" },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

export default function MarginCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [cost, setCost] = useState<number>(50);
    const [revenueOrPrice, setRevenueOrPrice] = useState<number>(100);
    const [inputMode, setInputMode] = useState<"cost-revenue" | "cost-margin" | "cost-markup">("cost-revenue");
    const [targetMargin, setTargetMargin] = useState<number>(50);
    const [targetMarkup, setTargetMarkup] = useState<number>(100);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Math & Calculated Financial Metrics
    const calculationResults = useMemo(() => {
        let currentCost = Math.max(0, cost);
        let currentRevenue = 0;
        let currentProfit = 0;
        let currentMargin = 0;
        let currentMarkup = 0;

        if (inputMode === "cost-revenue") {
            currentRevenue = Math.max(0, revenueOrPrice);
            currentProfit = currentRevenue - currentCost;
            currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
            currentMarkup = currentCost > 0 ? (currentProfit / currentCost) * 100 : 0;
        } else if (inputMode === "cost-margin") {
            const marginDec = Math.min(99.99, Math.max(0, targetMargin)) / 100;
            currentRevenue = marginDec < 1 ? currentCost / (1 - marginDec) : 0;
            currentProfit = currentRevenue - currentCost;
            currentMargin = targetMargin;
            currentMarkup = currentCost > 0 ? (currentProfit / currentCost) * 100 : 0;
        } else if (inputMode === "cost-markup") {
            const markupDec = Math.max(0, targetMarkup) / 100;
            currentRevenue = currentCost * (1 + markupDec);
            currentProfit = currentRevenue - currentCost;
            currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
            currentMarkup = targetMarkup;
        }

        // Tiered pricing comparisons
        const tierPercentages = [10, 20, 30, 40, 50, 60, 70, 80];
        const sensitivityTable = tierPercentages.map((m) => {
            const mDec = m / 100;
            const rev = currentCost / (1 - mDec);
            const prof = rev - currentCost;
            const mark = currentCost > 0 ? (prof / currentCost) * 100 : 0;
            return {
                targetMargin: m,
                price: rev,
                profit: prof,
                equivalentMarkup: mark
            };
        });

        return {
            cost: currentCost,
            revenue: currentRevenue,
            profit: currentProfit,
            margin: currentMargin,
            markup: currentMarkup,
            sensitivityTable,
            isPositive: currentProfit >= 0
        };
    }, [cost, revenueOrPrice, inputMode, targetMargin, targetMarkup]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setCost(preset.cost);
        if (preset.calcMode === "margin") {
            setInputMode("cost-margin");
            setTargetMargin(preset.marginOrMarkup);
        } else {
            setInputMode("cost-markup");
            setTargetMarkup(preset.marginOrMarkup);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setCost(50);
        setRevenueOrPrice(100);
        setInputMode("cost-revenue");
        setTargetMargin(50);
        setTargetMarkup(100);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Margin & Markup Calculation Summary (TwisterTools):
----------------------------------------
Cost of Goods Sold (COGS): ${currencySymbol}${calculationResults.cost.toFixed(2)}
Gross Selling Price / Revenue: ${currencySymbol}${calculationResults.revenue.toFixed(2)}
Gross Profit: ${currencySymbol}${calculationResults.profit.toFixed(2)}
----------------------------------------
Profit Margin: ${calculationResults.margin.toFixed(2)}%
Markup Percentage: ${calculationResults.markup.toFixed(2)}%
----------------------------------------
Calculated at twistertools.com/tools/calculators/margin-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Target Margin (%)", "Required Selling Price", "Gross Profit", "Equivalent Markup (%)"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.sensitivityTable.map((row) =>
                [
                    row.targetMargin + "%",
                    row.price.toFixed(2),
                    row.profit.toFixed(2),
                    row.equivalentMarkup.toFixed(2) + "%",
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `margin_markup_pricing_table.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Margin & Markup Calculator",
        "url": "https://twistertools.com/tools/calculators/margin-calculator",
        "description": "Calculate profit margin, markup percentage, gross selling price, and gross profit instantly for e-commerce, retail, wholesale, and services.",
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
                "name": "What is the difference between Profit Margin and Markup?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Profit Margin expresses gross profit as a percentage of total selling price (revenue), whereas Markup expresses gross profit as a percentage of cost of goods sold (COGS)."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate profit margin from cost and price?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Profit Margin is calculated as: [(Selling Price - Cost) / Selling Price] × 100."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate selling price using target margin?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To achieve a desired profit margin, calculate the selling price as: Cost / (1 - Target Margin Decimal)."
                }
            },
            {
                "@type": "Question",
                "name": "Why is Markup percentage always higher than Margin percentage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Markup percentage is calculated on a smaller base number (the cost), whereas Margin is calculated on a larger base number (the revenue). For example, a 100% markup equals a 50% profit margin."
                }
            },
            {
                "@type": "Question",
                "name": "What is a healthy profit margin for retail or e-commerce?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Average gross profit margins vary by industry: e-commerce typically targets 40% to 60%, retail standard is around 50% (keystone markup), while SaaS and digital goods often achieve 70% to 90%."
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
                                <Receipt className="w-5 h-5 text-indigo-600" />
                                Product & Cost Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Selector Toggle */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculation Mode
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => { setInputMode("cost-revenue"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${inputMode === "cost-revenue" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Cost + Price
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setInputMode("cost-margin"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${inputMode === "cost-margin" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Cost + Target Margin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setInputMode("cost-markup"); setActivePresetId(null); }}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${inputMode === "cost-markup" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Cost + Target Markup
                                </button>
                            </div>
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
                            {/* Item Cost (COGS) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-indigo-600" /> Cost of Goods Sold (COGS)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={cost || ""}
                                        onChange={(e) => {
                                            setCost(Math.max(0, Number(e.target.value)));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Conditional Mode Inputs */}
                            {inputMode === "cost-revenue" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <Tag className="w-4 h-4 text-indigo-600" /> Gross Selling Price / Revenue
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={revenueOrPrice || ""}
                                            onChange={(e) => {
                                                setRevenueOrPrice(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                            )}

                            {inputMode === "cost-margin" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Target Profit Margin (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="99.9"
                                            step="1"
                                            value={targetMargin || ""}
                                            onChange={(e) => {
                                                setTargetMargin(Math.min(99.9, Math.max(0, Number(e.target.value))));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>
                            )}

                            {inputMode === "cost-markup" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> Target Markup (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={targetMarkup || ""}
                                            onChange={(e) => {
                                                setTargetMarkup(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pr-8 pl-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Industry Benchmarks
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
                            {copied ? "Copied" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Profit & Margin Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Financial Summary & Metrics
                            </h2>
                        </div>

                        {/* Dual Key Metrics Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Profit Margin</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                                    {calculationResults.margin.toFixed(2)}%
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Profit share of total selling price
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Markup Percentage</p>
                                <p className="text-3xl font-extrabold text-indigo-600 mt-1">
                                    {calculationResults.markup.toFixed(2)}%
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium mt-1">
                                    Profit markup applied onto cost
                                </p>
                            </div>
                        </div>

                        {/* Visual Breakdown Bar */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Price Composition Breakdown
                            </h3>
                            <div>
                                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                        Cost Basis: {currencySymbol}{calculationResults.cost.toFixed(2)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-600">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                        Gross Profit: {currencySymbol}{calculationResults.profit.toFixed(2)}
                                    </span>
                                </div>
                                <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                    <div
                                        className="bg-slate-800 h-full transition-all duration-500"
                                        style={{ width: `${calculationResults.revenue > 0 ? Math.min(100, Math.max(0, (calculationResults.cost / calculationResults.revenue) * 100)) : 100}%` }}
                                    />
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-500"
                                        style={{ width: `${calculationResults.revenue > 0 ? Math.min(100, Math.max(0, (calculationResults.profit / calculationResults.revenue) * 100)) : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Key Financial Totals Grid */}
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Calculated Pricing Totals
                            </h3>
                            <div className="grid grid-cols-1 gap-2.5">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <span className="text-sm font-semibold text-slate-700">Cost of Goods (COGS)</span>
                                    <span className="font-bold text-slate-900">{currencySymbol}{calculationResults.cost.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <span className="text-sm font-semibold text-slate-700">Gross Selling Price</span>
                                    <span className="font-bold text-indigo-600">{currencySymbol}{calculationResults.revenue.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                                    <span className="text-sm font-semibold text-emerald-900">Gross Profit Margin</span>
                                    <span className="font-bold text-emerald-700">+{currencySymbol}{calculationResults.profit.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side real-time calculation
                        </span>
                        <span>Ratio: 1:{calculationResults.cost > 0 ? (calculationResults.revenue / calculationResults.cost).toFixed(2) : "0"}</span>
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

            {/* BELOW-THE-FOLD CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Core Concepts & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Margin vs. Markup in Retail & E-Commerce
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While <strong>profit margin</strong> and <strong>markup</strong> both measure profitability, they use different baselines and cannot be used interchangeably. Confusing these two numbers is one of the most common pricing mistakes in retail, leading to unexpected revenue deficits and underpriced inventory.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-indigo-600" /> Profit Margin
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Profit Margin compares gross profit to the <strong>total selling price</strong> (revenue). It represents the percentage of each sales dollar that remains as profit after covering product costs.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> Markup Percentage
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Markup compares gross profit to the <strong>cost of goods sold (COGS)</strong>. It represents the percentage added on top of the wholesale cost to establish a retail price.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Core equations used by financial planners and inventory controllers:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Profit Margin (%):</strong> [ (Selling Price - Cost) / Selling Price ] × 100</div>
                            <div><strong>2. Markup (%):</strong> [ (Selling Price - Cost) / Cost ] × 100</div>
                            <div><strong>3. Required Price for Target Margin:</strong> Cost / (1 - Margin Decimal)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Conversion Matrix & Worked Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Margin vs. Markup Conversion Table ($100 Cost Basis)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below demonstrates how equivalent profit margins require significantly higher markup percentages as target margins increase:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Target Margin (%)</th>
                                    <th className="p-3">Required Selling Price ($100 Cost)</th>
                                    <th className="p-3">Gross Profit</th>
                                    <th className="p-3">Equivalent Markup (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">20% Margin</td>
                                    <td className="p-3">$125.00</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$25.00</td>
                                    <td className="p-3 font-bold text-indigo-600">25.00% Markup</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">33.3% Margin</td>
                                    <td className="p-3">$150.00</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$50.00</td>
                                    <td className="p-3 font-bold text-indigo-600">50.00% Markup</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">50.0% Margin (Keystone)</td>
                                    <td className="p-3 font-bold">$200.00</td>
                                    <td className="p-3 text-emerald-600 font-bold">$100.00</td>
                                    <td className="p-3 font-extrabold text-indigo-700">100.00% Markup</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">75.0% Margin</td>
                                    <td className="p-3">$400.00</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$300.00</td>
                                    <td className="p-3 font-bold text-indigo-600">300.00% Markup</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
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
                                What is the difference between Profit Margin and Markup?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Profit Margin expresses gross profit as a percentage of total selling price (revenue), whereas Markup expresses gross profit as a percentage of cost of goods sold (COGS).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate profit margin from cost and price?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Profit Margin is calculated as: [(Selling Price - Cost) / Selling Price] × 100.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate selling price using target margin?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To achieve a desired profit margin, calculate the selling price as: Cost / (1 - Target Margin Decimal).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is Markup percentage always higher than Margin percentage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Markup percentage is calculated on a smaller base number (the cost), whereas Margin is calculated on a larger base number (the revenue). For example, a 100% markup equals a 50% profit margin.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a healthy profit margin for retail or e-commerce?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Average gross profit margins vary by industry: e-commerce typically targets 40% to 60%, retail standard is around 50% (keystone markup), while SaaS and digital goods often achieve 70% to 90%.
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