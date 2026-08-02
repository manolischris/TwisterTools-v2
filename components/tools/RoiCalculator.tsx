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
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Scale,
    Coins,
    CheckCircle2,
    Briefcase
} from "lucide-react";

interface AnnualizedRow {
    year: number;
    value: number;
    gain: number;
    roi: number;
}

interface Preset {
    id: string;
    label: string;
    initialInvestment: number;
    finalValue: number;
    years: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "stock-tech", label: "Tech Stock Growth", initialInvestment: 10000, finalValue: 24000, years: 5, tag: "140% Total Gain" },
    { id: "real-estate", label: "Rental Property Flip", initialInvestment: 150000, finalValue: 225000, years: 3, tag: "50% Growth" },
    { id: "index-fund", label: "Index Fund (10 Yrs)", initialInvestment: 50000, finalValue: 129500, years: 10, tag: "Long-term Compound" },
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
    // Parse string, stripping undesirable leading zeros like "0100" -> 100
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function RoiCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [initialInvestment, setInitialInvestment] = useState<number>(10000);
    const [finalValue, setFinalValue] = useState<number>(15000);
    const [investmentLength, setInvestmentLength] = useState<number>(3); // Years
    const [additionalCosts, setAdditionalCosts] = useState<number>(500); // Maintenance, fees, taxes
    const [dividends, setDividends] = useState<number>(300); // Additional earnings/dividends

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Math & Schedule Calculation
    const calculationResults = useMemo(() => {
        const netCost = Math.max(0, initialInvestment + additionalCosts);
        const totalReturns = finalValue + dividends;
        const netProfit = totalReturns - netCost;

        // Simple ROI
        const roiPercent = netCost > 0 ? (netProfit / netCost) * 100 : 0;

        // Annualized ROI (CAGR) Formula: [(Total Return / Initial Investment) ^ (1 / Years)] - 1
        let annualizedRoi = 0;
        if (netCost > 0 && totalReturns > 0 && investmentLength > 0) {
            annualizedRoi = (Math.pow(totalReturns / netCost, 1 / investmentLength) - 1) * 100;
        }

        // Annual growth schedule (projected progression)
        const schedule: AnnualizedRow[] = [];
        if (investmentLength > 0 && netCost > 0) {
            const annualGrowthRate = annualizedRoi / 100;
            for (let yr = 1; yr <= Math.min(Math.ceil(investmentLength), 50); yr++) {
                const valueAtYear = netCost * Math.pow(1 + annualGrowthRate, yr);
                const gainAtYear = valueAtYear - netCost;
                const roiAtYear = (gainAtYear / netCost) * 100;

                schedule.push({
                    year: yr,
                    value: valueAtYear,
                    gain: gainAtYear,
                    roi: roiAtYear,
                });
            }
        }

        return {
            netCost,
            totalReturns,
            netProfit,
            roiPercent,
            annualizedRoi,
            schedule,
            isPositive: netProfit >= 0,
        };
    }, [initialInvestment, finalValue, investmentLength, additionalCosts, dividends]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setInitialInvestment(preset.initialInvestment);
        setFinalValue(preset.finalValue);
        setInvestmentLength(preset.years);
        setAdditionalCosts(0);
        setDividends(0);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setInitialInvestment(10000);
        setFinalValue(15000);
        setInvestmentLength(3);
        setAdditionalCosts(500);
        setDividends(300);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `ROI Calculation Summary (TwisterTools):
----------------------------------------
Initial Investment: ${currencySymbol}${initialInvestment.toLocaleString()}
Final Value: ${currencySymbol}${finalValue.toLocaleString()}
Holding Period: ${investmentLength} Years
Additional Costs: ${currencySymbol}${additionalCosts.toLocaleString()}
Dividends/Income: ${currencySymbol}${dividends.toLocaleString()}
----------------------------------------
Net Investment Cost: ${currencySymbol}${calculationResults.netCost.toLocaleString()}
Total Net Profit: ${currencySymbol}${calculationResults.netProfit.toLocaleString()}
Simple ROI: ${calculationResults.roiPercent.toFixed(2)}%
Annualized ROI (CAGR): ${calculationResults.annualizedRoi.toFixed(2)}%
----------------------------------------
Calculated at twistertools.com/tools/calculators/roi-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Estimated Value", "Net Profit/Gain", "Cumulative ROI (%)"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.year,
                    row.value.toFixed(2),
                    row.gain.toFixed(2),
                    row.roi.toFixed(2) + "%",
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `roi_growth_projection_${investmentLength}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Return on Investment (ROI) Calculator",
        "url": "https://twistertools.com/tools/calculators/roi-calculator",
        "description": "Calculate simple ROI, annualized return (CAGR), net profit, and investment performance across stocks, real estate, and business ventures.",
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
                "name": "What is Return on Investment (ROI)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Return on Investment (ROI) is a fundamental financial ratio used to measure the probability or efficiency of an investment. It measures the net return relative to the initial cost incurred."
                }
            },
            {
                "@type": "Question",
                "name": "How is simple ROI calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simple ROI is calculated by taking the net profit (Final Value + Income - Initial Cost - Fees) and dividing it by the total net cost, then multiplying by 100 to get a percentage."
                }
            },
            {
                "@type": "Question",
                "name": "What is Annualized ROI (CAGR) and why is it important?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Annualized ROI standardizes returns over a one-year time horizon. It compensates for the holding period, allowing accurate comparisons between short-term trades and long-term investments."
                }
            },
            {
                "@type": "Question",
                "name": "How do additional costs and dividends affect ROI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Additional costs (like maintenance, broker commissions, and taxes) increase the baseline capital cost, reducing overall ROI. Dividends and passive rental income add to total returns, increasing net ROI."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered a 'good' ROI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A good ROI depends on the asset class and risk profile. Historically, standard stock index funds yield roughly 7% to 10% annualized, while higher-risk venture investments or real estate flips may target 15% to 25%+."
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
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                                Investment Inputs
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

                        <div className="space-y-5">
                            {/* Initial Investment */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-indigo-600" /> Initial Amount Invested
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={initialInvestment === 0 ? "" : initialInvestment}
                                        onChange={(e) => { handleNumberInput(e, (val) => setInitialInvestment(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Final Value */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <Coins className="w-4 h-4 text-indigo-600" /> End Value / Sale Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={finalValue === 0 ? "" : finalValue}
                                        onChange={(e) => { handleNumberInput(e, (val) => setFinalValue(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Investment Length (Years) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-indigo-600" /> Time Horizon (Years)
                                </label>
                                <input
                                    type="number"
                                    min="0.1"
                                    max="50"
                                    step="0.5"
                                    value={investmentLength === 0 ? "" : investmentLength}
                                    onChange={(e) => { handleNumberInput(e, (val) => setInvestmentLength(val === 0 ? 0 : Math.max(0.1, val))); setActivePresetId(null); }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                />
                            </div>

                            {/* Additional Adjustments Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Costs & Secondary Income</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Expenses & Fees
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={additionalCosts === 0 ? "" : additionalCosts}
                                                onChange={(e) => handleNumberInput(e, (val) => setAdditionalCosts(Math.max(0, val)))}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Dividends / Income
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={dividends === 0 ? "" : dividends}
                                                onChange={(e) => handleNumberInput(e, (val) => setDividends(Math.max(0, val)))}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Pre-set Benchmarks
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

                {/* Right Workspace Panel: Results, Visualizations & Data Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                ROI Metrics & Breakdown
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className={`p-4 rounded-xl border col-span-2 sm:col-span-1 ${calculationResults.isPositive ? "bg-emerald-50/70 border-emerald-200" : "bg-rose-50/70 border-rose-200"}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider ${calculationResults.isPositive ? "text-emerald-800" : "text-rose-800"}`}>
                                    Total Return (ROI)
                                </p>
                                <p className={`text-3xl font-extrabold mt-1 flex items-center gap-1 ${calculationResults.isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                                    {calculationResults.isPositive ? <ArrowUpRight className="w-7 h-7" /> : <ArrowDownRight className="w-7 h-7" />}
                                    {calculationResults.roiPercent.toFixed(2)}%
                                </p>
                                <p className={`text-[11px] font-semibold mt-1 ${calculationResults.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                                    Net Profit: {currencySymbol}{Math.round(calculationResults.netProfit).toLocaleString()}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Annualized ROI (CAGR)</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {calculationResults.annualizedRoi.toFixed(2)}% / yr
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Compounded over {investmentLength} years
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-6">
                                {/* Capital vs Profit Ratio */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Total Return Structure
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                                Cost Basis: {currencySymbol}{Math.round(calculationResults.netCost).toLocaleString()}
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${calculationResults.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                                                <span className={`w-2.5 h-2.5 rounded-full inline-block ${calculationResults.isPositive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                                                Net Profit: {currencySymbol}{Math.round(calculationResults.netProfit).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                className="bg-slate-800 h-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(10, (calculationResults.netCost / (calculationResults.netCost + Math.abs(calculationResults.netProfit))) * 100))}%` }}
                                            />
                                            <div
                                                className={`${calculationResults.isPositive ? "bg-emerald-500" : "bg-rose-500"} h-full transition-all duration-500`}
                                                style={{ width: `${Math.min(100, Math.max(0, (Math.abs(calculationResults.netProfit) / (calculationResults.netCost + Math.abs(calculationResults.netProfit))) * 100))}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Detail List */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Detailed Capital Balance
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700">Initial Outlay</span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{initialInvestment.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700">Expenses & Fees</span>
                                            <span className="font-bold text-slate-900">+{currencySymbol}{additionalCosts.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700">Gross Exit / End Value</span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{finalValue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700">Dividends / Direct Earnings</span>
                                            <span className="font-bold text-emerald-600">+{currencySymbol}{dividends.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Schedule Table Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[360px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Est. Portfolio Value</th>
                                            <th className="p-2.5">Cumulative Profit</th>
                                            <th className="p-2.5">Cumulative ROI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Year {row.year}</td>
                                                <td className="p-2.5 text-slate-900 font-semibold">{currencySymbol}{Math.round(row.value).toLocaleString()}</td>
                                                <td className="p-2.5 text-emerald-600 font-semibold">{currencySymbol}{Math.round(row.gain).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-indigo-600">{row.roi.toFixed(1)}%</td>
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
                            Client-side real-time execution
                        </span>
                        <span>CAGR: {calculationResults.annualizedRoi.toFixed(2)}%</span>
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

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Financial Definitions & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Return on Investment (ROI) & Financial Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Return on Investment (ROI)</strong> is a universal, standardized financial metric used to evaluate the efficiency, profitability, and relative performance of an investment. By converting financial gains or losses into a percentage relative to capital invested, ROI allows investors to compare completely different asset classes—such as stocks, real estate, crypto, and enterprise capital—on an equal footing.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> Simple ROI Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Evaluates overall yield without factoring in holding time. Ideal for quick single-period performance checks across short trades or fixed-duration investments.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" /> Annualized ROI (CAGR)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Normalizes total return into an equivalent annual rate of growth. Essential for evaluating multi-year investments with compounding growth.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Equations Behind The Math
                        </h3>
                        <p className="text-xs text-slate-300">
                            Calculations factor initial principal, gross exit value, holding duration, expenses, and dividend yields:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Simple ROI (%):</strong> [ (Total End Value + Income - Net Expenses - Initial Principal) / Net Cost Basis ] × 100</div>
                            <div><strong>2. Annualized ROI (CAGR %):</strong> [ (Total End Value / Net Cost Basis) ^ (1 / Holding Years) - 1 ] × 100</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked ROI Example: Real Estate vs. Stock Market
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how holding periods affect true profitability, consider two distinct $20,000 investment scenarios:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Parameter</th>
                                    <th className="p-3">Scenario A: Stock Option Trade</th>
                                    <th className="p-3">Scenario B: Real Estate Rehab</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Initial Outlay</td>
                                    <td className="p-3">$20,000</td>
                                    <td className="p-3">$20,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Holding Duration</td>
                                    <td className="p-3 text-indigo-600 font-bold">1 Year</td>
                                    <td className="p-3 text-indigo-600 font-bold">5 Years</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Gross Return at Exit</td>
                                    <td className="p-3">$30,000</td>
                                    <td className="p-3">$40,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Simple ROI</td>
                                    <td className="p-3 font-bold text-emerald-600">50.00%</td>
                                    <td className="p-3 font-bold text-emerald-600">100.00%</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Annualized ROI (CAGR)</td>
                                    <td className="p-3 font-extrabold text-indigo-700">50.00% / yr</td>
                                    <td className="p-3 font-extrabold text-indigo-700">14.87% / yr</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Takeaway:</strong> While Scenario B yields double the absolute nominal profit, Scenario A achieves a far higher annualized rate of growth (50% vs 14.87%) because it produced gains in just 12 months rather than 60.
                    </p>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
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
                                What is Return on Investment (ROI)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Return on Investment (ROI) is a fundamental financial ratio used to measure the probability or efficiency of an investment. It measures the net return relative to the initial cost incurred.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is simple ROI calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Simple ROI is calculated by taking the net profit (Final Value + Income - Initial Cost - Fees) and dividing it by the total net cost, then multiplying by 100 to get a percentage.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Annualized ROI (CAGR) and why is it important?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Annualized ROI standardizes returns over a one-year time horizon. It compensates for the holding period, allowing accurate comparisons between short-term trades and long-term investments.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do additional costs and dividends affect ROI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Additional costs (like maintenance, broker commissions, and taxes) increase the baseline capital cost, reducing overall ROI. Dividends and passive rental income add to total returns, increasing net ROI.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is considered a 'good' ROI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A good ROI depends on the asset class and risk profile. Historically, standard stock index funds yield roughly 7% to 10% annualized, while higher-risk venture investments or real estate flips may target 15% to 25%+.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
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