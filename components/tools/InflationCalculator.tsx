"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    TrendingUp,
    TrendingDown,
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
    Lightbulb,
    AlertTriangle,
    Scale,
    Flame,
    PieChart,
    Building2,
    Coins,
    ArrowRightLeft,
    Clock,
    ShoppingBag
} from "lucide-react";

interface TimelineRow {
    year: number;
    nominalValue: number;
    purchasingPower: number;
    cumulativeInflation: number;
    lossPercentage: number;
}

interface Preset {
    id: string;
    label: string;
    amount: number;
    rate: number;
    years: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "us-historical", label: "US Historical Avg", amount: 10000, rate: 3.2, years: 20, tag: "3.2% Rate" },
    { id: "modest-decade", label: "Modest Decade", amount: 50000, rate: 2.5, years: 10, tag: "2.5% Rate" },
    { id: "high-inflation", label: "High Inflation Era", amount: 25000, rate: 6.0, years: 15, tag: "6.0% Rate" },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

export default function InflationCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [initialAmount, setInitialAmount] = useState<number>(10000);
    const [inflationRate, setInflationRate] = useState<number>(3.5);
    const [years, setYears] = useState<number>(10);
    const [investmentReturn, setInvestmentReturn] = useState<number>(0);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];

    // Ref for export container
    const exportRef = useRef<HTMLDivElement>(null);

    // Calculation Math
    const calculationResults = useMemo(() => {
        const safeAmount = Math.max(0, initialAmount);
        const safeRate = Math.max(0, inflationRate) / 100;
        const safeReturn = Math.max(0, investmentReturn) / 100;
        const safeYears = Math.max(1, Math.min(100, years));

        // Future Nominal Amount needed to maintain baseline purchasing power
        const futureAmountNeeded = safeAmount * Math.pow(1 + safeRate, safeYears);

        // Real purchasing power of the static initial sum after N years
        const realPurchasingPower = safeAmount / Math.pow(1 + safeRate, safeYears);

        // Value of initial sum if invested at investmentReturn
        const investedFutureValue = safeAmount * Math.pow(1 + safeReturn, safeYears);
        const realInvestedValue = investedFutureValue / Math.pow(1 + safeRate, safeYears);

        // Cumulative Inflation % over N years
        const cumulativeInflationPercent = (Math.pow(1 + safeRate, safeYears) - 1) * 100;

        // Purchasing power loss %
        const purchasingPowerLossPercent = safeAmount > 0 ? ((safeAmount - realPurchasingPower) / safeAmount) * 100 : 0;

        // Years to halve purchasing power (Rule of 72 adaptation: 72 / rate)
        const yearsToHalve = safeRate > 0 ? 72 / (safeRate * 100) : 0;

        // Timeline Schedule Generation
        const timeline: TimelineRow[] = [];
        for (let y = 1; y <= safeYears; y++) {
            const power = safeAmount / Math.pow(1 + safeRate, y);
            const cumInf = (Math.pow(1 + safeRate, y) - 1) * 100;
            const lossPct = ((safeAmount - power) / safeAmount) * 100;
            const nom = safeAmount * Math.pow(1 + safeRate, y);

            timeline.push({
                year: y,
                nominalValue: nom,
                purchasingPower: power,
                cumulativeInflation: cumInf,
                lossPercentage: lossPct,
            });
        }

        return {
            futureAmountNeeded,
            realPurchasingPower,
            investedFutureValue,
            realInvestedValue,
            cumulativeInflationPercent,
            purchasingPowerLossPercent,
            yearsToHalve,
            timeline,
        };
    }, [initialAmount, inflationRate, years, investmentReturn]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setInitialAmount(preset.amount);
        setInflationRate(preset.rate);
        setYears(preset.years);
        setInvestmentReturn(0);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setInitialAmount(10000);
        setInflationRate(3.5);
        setYears(10);
        setInvestmentReturn(0);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Inflation & Purchasing Power Projection (TwisterTools):
----------------------------------------
Initial Principal Amount: ${currencySymbol}${initialAmount.toLocaleString()}
Annual Inflation Rate: ${inflationRate}%
Time Horizon: ${years} Years
----------------------------------------
Future Equivalent Cost: ${currencySymbol}${Math.round(calculationResults.futureAmountNeeded).toLocaleString()}
Future Purchasing Power of Cash: ${currencySymbol}${Math.round(calculationResults.realPurchasingPower).toLocaleString()}
Purchasing Power Loss: ${calculationResults.purchasingPowerLossPercent.toFixed(1)}%
Cumulative Inflation: ${calculationResults.cumulativeInflationPercent.toFixed(1)}%
----------------------------------------
Calculated at twistertools.com/tools/calculators/inflation-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Future Cost Needed", "Real Purchasing Power", "Cumulative Inflation %", "Purchasing Power Loss %"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.timeline.map((row) =>
                [
                    row.year,
                    row.nominalValue.toFixed(2),
                    row.purchasingPower.toFixed(2),
                    row.cumulativeInflation.toFixed(2) + "%",
                    row.lossPercentage.toFixed(2) + "%",
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `inflation_purchasing_power_${years}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schema for SEO & GEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Inflation Rate & Purchasing Power Calculator",
        "url": "https://twistertools.com/tools/calculators/inflation-calculator",
        "description": "Calculate future money value, historical CPI erosion, purchasing power decay, and real investment returns with our browser-native monetary inflation calculator.",
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
                "name": "What is purchasing power and how does inflation erode it?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Purchasing power represents the real volume of goods or services that one unit of money can buy. Inflation raises the general price index, which directly reduces the quantity of goods your money can acquire over time."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Consumer Price Index (CPI)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Consumer Price Index (CPI) measures the average change over time in prices paid by urban consumers for a market basket of consumer goods and services, serving as the benchmark metric for macro inflation."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Rule of 72 apply to inflation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By dividing 72 by the annual inflation rate, you estimate how many years it will take for your money's purchasing power to cut in half. For example, at a 4% inflation rate, purchasing power halves in 18 years (72 ÷ 4)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between nominal interest rate and real rate of return?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nominal interest rate is the raw percentage return stated on an investment. The real rate of return adjusts the nominal gain for inflation using Fisher's equation, showing true purchasing power growth."
                }
            },
            {
                "@type": "Question",
                "name": "Which asset classes historically hedge best against inflation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Equities, real estate, commodities, TIPS (Treasuries Inflation-Protected Securities), and infrastructure assets historically outpace CPI inflation over multi-decade compounding cycles."
                }
            },
            {
                "@type": "Question",
                "name": "Why is mild inflation considered beneficial for macro economies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Central banks target around 2% inflation to discourage cash hoarding, incentivize productive investment, facilitate nominal wage flexibility, and reduce the burden of fixed real debt."
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
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Inflation Parameters
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
                                Currency Symbol
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
                            {/* Initial Starting Amount */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-indigo-600" /> Starting Amount
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{initialAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={initialAmount || ""}
                                        onChange={(e) => {
                                            setInitialAmount(Math.max(0, Number(e.target.value)));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Annual Inflation Rate & Time Horizon */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Inflation Rate (CPI)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="0.1"
                                            value={inflationRate || ""}
                                            onChange={(e) => {
                                                setInflationRate(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Time Horizon
                                    </label>
                                    <select
                                        value={years}
                                        onChange={(e) => {
                                            setYears(Number(e.target.value));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-white"
                                    >
                                        <option value={5}>5 Years</option>
                                        <option value={10}>10 Years</option>
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                        <option value={50}>50 Years</option>
                                    </select>
                                </div>
                            </div>

                            {/* Optional: Nominal Investment Return Comparison */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Investment Hedge Growth (Optional)
                                </h3>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Expected Annual Return %
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="0.5"
                                            value={investmentReturn || ""}
                                            onChange={(e) => setInvestmentReturn(Math.max(0, Number(e.target.value)))}
                                            placeholder="e.g. 7.0% stock portfolio"
                                            className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Simulate how your capital fares against inflation when invested.</p>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Preset Scenarios
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Applied
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Future Value & Purchasing Power
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
                                    Yearly Timeline
                                </button>
                            </div>
                        </div>

                        {/* Key Metric Highlight Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Future Cost Needed</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.futureAmountNeeded).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    To buy what {currencySymbol}{initialAmount.toLocaleString()} buys today
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Real Purchasing Power</p>
                                <p className="text-2xl font-extrabold text-rose-600 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.realPurchasingPower).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-rose-700 font-bold mt-1 bg-rose-100/60 inline-block px-1.5 py-0.5 rounded">
                                    -{calculationResults.purchasingPowerLossPercent.toFixed(1)}% Real Value Loss
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-6">
                                {/* Visual Purchasing Power Decay Bar */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Value Retained vs. Purchasing Power Erosion
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                                Retained Power: {currencySymbol}{Math.round(calculationResults.realPurchasingPower).toLocaleString()} ({(100 - calculationResults.purchasingPowerLossPercent).toFixed(1)}%)
                                            </span>
                                            <span className="flex items-center gap-1.5 text-rose-600">
                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                                Lost Power: {currencySymbol}{Math.round(initialAmount - calculationResults.realPurchasingPower).toLocaleString()} ({calculationResults.purchasingPowerLossPercent.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                className="bg-indigo-600 h-full transition-all duration-500"
                                                style={{ width: `${Math.max(0, 100 - calculationResults.purchasingPowerLossPercent)}%` }}
                                            />
                                            <div
                                                className="bg-rose-500 h-full transition-all duration-500"
                                                style={{ width: `${calculationResults.purchasingPowerLossPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Macro Summary Metrics */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Inflation Impact Metrics
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Cumulative CPI Inflation
                                            </span>
                                            <span className="font-bold text-slate-900">+{calculationResults.cumulativeInflationPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Value Halving Timeline (Rule of 72)
                                            </span>
                                            <span className="font-bold text-amber-700">
                                                {calculationResults.yearsToHalve > 0 ? `~${calculationResults.yearsToHalve.toFixed(1)} Years` : "N/A"}
                                            </span>
                                        </div>
                                        {investmentReturn > 0 && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                                <span className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Real Invested Value (After Inflation)
                                                </span>
                                                <span className="font-bold text-emerald-900">{currencySymbol}{Math.round(calculationResults.realInvestedValue).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Timeline Table Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[360px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Future Cost Needed</th>
                                            <th className="p-2.5">Real Purchasing Power</th>
                                            <th className="p-2.5">Cumulative Inflation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.timeline.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Year {row.year}</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.nominalValue).toLocaleString()}</td>
                                                <td className="p-2.5 text-rose-600 font-semibold">{currencySymbol}{Math.round(row.purchasingPower).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-slate-900">+{row.cumulativeInflation.toFixed(1)}%</td>
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
                            Client-side computation engine
                        </span>
                        <span>{years}-Year Horizon</span>
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

                {/* Card 1: Monetary Economics & Inflation Fundamentals */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Inflation Rate & Purchasing Power Decay
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Inflation represents the progressive loss of purchasing power over time, measured by the general increase in prices for goods and services across an economy. When annual inflation rates rise, each individual unit of currency purchases a smaller fraction of a basket of goods. Understanding how money value degrades is foundational to long-term wealth preservation and retirement planning.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-indigo-600" /> Consumer Price Index (CPI)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The Consumer Price Index monitors statistical price shifts across key category baskets—housing, food, energy, transport, and healthcare—reflecting everyday cost changes.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-indigo-600" /> Real vs. Nominal Value
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Nominal value is the raw numerical face value printed on cash or account statements. Real value adjusts that number for price inflation to show actual goods executable.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Demand-Pull Inflation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Occurs when aggregate consumer demand for goods and services outpaces production capacity, driving competitive price increases across markets.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> Cost-Push Inflation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Driven by supply chain disruptions or rising raw material and labor costs, forcing manufacturers to pass elevated expenses down to end consumers.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Core Purchasing Power & Future Cost Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            Financial analysts determine future equivalent cost and real purchasing power decay using exponential compounding models:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div>Future Cost Needed = P × (1 + i)^n</div>
                            <div>Real Purchasing Power = P / (1 + i)^n</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>P:</strong> Present Starting Amount</div>
                            <div><strong>i:</strong> Annual Inflation Rate (Percentage ÷ 100)</div>
                            <div><strong>n:</strong> Number of Compounding Years</div>
                            <div><strong>(1 + i)^n:</strong> Cumulative Price Multiplier Factor</div>
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
                            Step-by-Step Purchasing Power Erosion Example ($50,000 Case Study)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To visualize how uninvested cash loses purchasing strength over two decades, consider a saver holding $50,000 in a zero-interest account under a 3.5% steady inflation environment:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Case Study Baseline Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Initial Cash Savings:</strong> $50,000</li>
                            <li><strong>Annual Inflation Rate (CPI):</strong> 3.5% per annum</li>
                            <li><strong>Duration:</strong> 20 Years</li>
                        </ul>
                    </div>

                    {/* Breakdown Milestone Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeline Milestone</th>
                                    <th className="p-3">Future Cost of $50k Basket</th>
                                    <th className="p-3">Real Purchasing Power of $50k Cash</th>
                                    <th className="p-3">Cumulative Inflation %</th>
                                    <th className="p-3">Purchasing Power Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 1</td>
                                    <td className="p-3">$51,750</td>
                                    <td className="p-3 text-slate-600 font-semibold">$48,309</td>
                                    <td className="p-3 text-indigo-600 font-semibold">+3.5%</td>
                                    <td className="p-3 text-rose-600 font-semibold">-3.4%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 5</td>
                                    <td className="p-3">$59,384</td>
                                    <td className="p-3 text-slate-600 font-semibold">$42,098</td>
                                    <td className="p-3 text-indigo-600 font-semibold">+18.8%</td>
                                    <td className="p-3 text-rose-600 font-semibold">-15.8%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 10</td>
                                    <td className="p-3">$70,530</td>
                                    <td className="p-3 text-slate-600 font-semibold">$35,457</td>
                                    <td className="p-3 text-indigo-600 font-semibold">+41.1%</td>
                                    <td className="p-3 text-rose-600 font-semibold">-29.1%</td>
                                </tr>
                                <tr className="bg-rose-50/50 hover:bg-rose-50">
                                    <td className="p-3 font-bold text-rose-900">Year 20</td>
                                    <td className="p-3 font-bold text-slate-900">$99,489</td>
                                    <td className="p-3 text-rose-700 font-bold">$25,128</td>
                                    <td className="p-3 text-indigo-600 font-bold">+99.0%</td>
                                    <td className="p-3 font-extrabold text-rose-700">-49.7% (Halved!)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Critical Takeaway:</strong> In 20 years, a goods basket that costs <strong>$50,000</strong> today will require <strong>$99,489</strong>. Conversely, static bank cash loses nearly 50% of its real purchasing power, leaving the saver capable of purchasing only half of what they could originally afford.
                    </p>
                </section>

                {/* Card 3: Comparing Asset Hedges Against Inflation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Performance: Asset Classes vs. Inflation Decay
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Holding uninvested cash exposes wealth to steady baseline erosion. Selecting inflation-resistant asset vehicles is essential to preserving real purchasing power across market cycles:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Asset Class</th>
                                    <th className="p-3">Hist. Nominal Return</th>
                                    <th className="p-3">Real Return (Post-3% CPI)</th>
                                    <th className="p-3">Inflation Protection Profile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Broad Equities (S&P 500)</td>
                                    <td className="p-3 text-emerald-700 font-semibold">~10.0%</td>
                                    <td className="p-3 font-bold text-emerald-600">+7.0%</td>
                                    <td className="p-3 text-slate-600">High: Corporate revenue increases with pricing power</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Residential Real Estate</td>
                                    <td className="p-3 font-semibold text-slate-800">~6.0% - 8.0%</td>
                                    <td className="p-3 font-bold text-emerald-600">+3.0% - +5.0%</td>
                                    <td className="p-3 text-slate-600">High: Property prices and rental yields rise with CPI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">TIPS (Inflation Bonds)</td>
                                    <td className="p-3 font-semibold text-slate-800">CPI + fixed spread</td>
                                    <td className="p-3 font-bold text-indigo-600">+1.0% - +2.5%</td>
                                    <td className="p-3 text-slate-600">Direct: Principal scales automatically with official CPI</td>
                                </tr>
                                <tr className="bg-rose-50/50 hover:bg-rose-50">
                                    <td className="p-3 font-bold text-rose-900">Standard Savings / Cash</td>
                                    <td className="p-3 font-bold text-rose-700">0.5% - 1.5%</td>
                                    <td className="p-3 font-extrabold text-rose-600">-1.5% to -2.5% (Negative)</td>
                                    <td className="p-3 text-rose-800 font-semibold">Zero: Guaranteed purchasing power destruction</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Actionable Strategies to Hedge Personal Purchasing Power */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Tactical Wealth Strategies to Outpace Inflation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Defending capital against monetary debasement requires proactive asset allocation. Key financial strategies employed by portfolio managers include:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <TrendingUp className="w-4 h-4" /> Growth Equity Allocation
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Maintain ownership in high-margin businesses capable of adjusting end-user prices ahead of producer input cost increases.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ArrowRightLeft className="w-4 h-4" /> Fixed-Debt Refinancing
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Holding long-term fixed debt (such as a 30-year mortgage) allows borrowers to pay back loans with inflated, less valuable currency units over time.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Coins className="w-4 h-4" /> High-Yield Cash Sweeps
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Avoid holding excess emergency reserves in standard low-yield accounts. Utilize Treasury bills or high-yield money market funds to narrow real return deficits.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                What is purchasing power and how does inflation erode it?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Purchasing power represents the real volume of goods or services that one unit of money can buy. Inflation raises the general price index, which directly reduces the quantity of goods your money can acquire over time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Consumer Price Index (CPI)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Consumer Price Index (CPI) measures the average change over time in prices paid by urban consumers for a market basket of consumer goods and services, serving as the benchmark metric for macro inflation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Rule of 72 apply to inflation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                By dividing 72 by the annual inflation rate, you estimate how many years it will take for your money's purchasing power to cut in half. For example, at a 4% inflation rate, purchasing power halves in 18 years (72 ÷ 4).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between nominal interest rate and real rate of return?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Nominal interest rate is the raw percentage return stated on an investment. The real rate of return adjusts the nominal gain for inflation using Fisher's equation, showing true purchasing power growth.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which asset classes historically hedge best against inflation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Equities, real estate, commodities, TIPS (Treasuries Inflation-Protected Securities), and infrastructure assets historically outpace CPI inflation over multi-decade compounding cycles.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is mild inflation considered beneficial for macro economies?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Central banks target around 2% inflation to discourage cash hoarding, incentivize productive investment, facilitate nominal wage flexibility, and reduce the burden of fixed real debt.
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