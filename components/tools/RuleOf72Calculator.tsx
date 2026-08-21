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
    ShieldCheck,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    Flame,
    Scale,
    Clock,
    Zap,
    ArrowRight
} from "lucide-react";

interface DoublingMilestone {
    doublingNumber: number;
    yearsExact: number;
    yearsRule72: number;
    portfolioValue: number;
    purchasingPowerAdjusted: number;
    interestAccrued: number;
}

interface RateComparisonRow {
    rate: number;
    rule72Years: number;
    exactYears: number;
    variancePercent: number;
    valueIn10Yrs: number;
    valueIn20Yrs: number;
}

interface PresetScenario {
    id: string;
    label: string;
    rate: number;
    inflation: number;
    tag: string;
}

const PRESETS: PresetScenario[] = [
    { id: "sp500", label: "S&P 500 Historical", rate: 10, inflation: 2.8, tag: "10% Nominal" },
    { id: "balanced", label: "60/40 Portfolio", rate: 7.2, inflation: 2.5, tag: "7.2% Balanced" },
    { id: "hysa", label: "High-Yield Savings", rate: 4.5, inflation: 2.5, tag: "4.5% Cash" },
    { id: "reit", label: "Real Estate REITs", rate: 8.5, inflation: 3.0, tag: "8.5% Growth" },
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

export default function RuleOf72Calculator() {
    // Mode Selection: calculate doubling time from rate, or calculate required rate from target years
    const [calcMode, setCalcMode] = useState<"timeFromRate" | "rateFromYears">("timeFromRate");
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [initialPrincipal, setInitialPrincipal] = useState<number>(10000);
    const [annualRate, setAnnualRate] = useState<number>(8);
    const [targetYears, setTargetYears] = useState<number>(9);
    const [inflationRate, setInflationRate] = useState<number>(2.5);
    const [ruleVariant, setRuleVariant] = useState<number>(72); // 72, 70, or 69.3

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"milestones" | "comparisons">("milestones");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Primary Mathematical Computations
    const calculations = useMemo(() => {
        const principal = Math.max(1, initialPrincipal);
        const inflationDecimal = Math.max(0, inflationRate / 100);

        let effectiveRate = annualRate;
        let yearsEstimate = 0;
        let yearsExact = 0;
        let requiredRateEstimate = 0;
        let requiredRateExact = 0;

        if (calcMode === "timeFromRate") {
            effectiveRate = Math.max(0.01, annualRate);
            const rDecimal = effectiveRate / 100;
            yearsEstimate = ruleVariant / effectiveRate;
            yearsExact = Math.log(2) / Math.log(1 + rDecimal);
            requiredRateEstimate = effectiveRate;
            requiredRateExact = effectiveRate;
        } else {
            const validTargetYears = Math.max(0.1, targetYears);
            requiredRateEstimate = ruleVariant / validTargetYears;
            requiredRateExact = (Math.pow(2, 1 / validTargetYears) - 1) * 100;
            effectiveRate = requiredRateExact;
            yearsEstimate = validTargetYears;
            yearsExact = validTargetYears;
        }

        const realRateEstimate = Math.max(0.01, effectiveRate - inflationRate);
        const yearsRealEstimate = ruleVariant / realRateEstimate;
        const yearsRealExact = Math.log(2) / Math.log(1 + (effectiveRate - inflationRate) / 100);

        // Calculate 5 Doubling Milestones (up to 32x principal)
        const milestones: DoublingMilestone[] = [];
        for (let i = 1; i <= 5; i++) {
            const multiplier = Math.pow(2, i);
            const portfolioVal = principal * multiplier;
            const milestoneYearsExact = yearsExact * i;
            const milestoneYearsRule72 = yearsEstimate * i;
            const purchasingPower = portfolioVal / Math.pow(1 + inflationDecimal, milestoneYearsExact);
            milestones.push({
                doublingNumber: i,
                yearsExact: milestoneYearsExact,
                yearsRule72: milestoneYearsRule72,
                portfolioValue: portfolioVal,
                purchasingPowerAdjusted: purchasingPower,
                interestAccrued: portfolioVal - principal,
            });
        }

        // Benchmark Rates comparison matrix
        const benchmarkRates = [3, 4.5, 6, 7.2, 8, 10, 12, 15];
        const rateComparisons: RateComparisonRow[] = benchmarkRates.map((r) => {
            const ruleYears = ruleVariant / r;
            const exYears = Math.log(2) / Math.log(1 + r / 100);
            const variance = ((ruleYears - exYears) / exYears) * 100;
            const v10 = principal * Math.pow(1 + r / 100, 10);
            const v20 = principal * Math.pow(1 + r / 100, 20);
            return {
                rate: r,
                rule72Years: ruleYears,
                exactYears: exYears,
                variancePercent: variance,
                valueIn10Yrs: v10,
                valueIn20Yrs: v20,
            };
        });

        const timeDifferenceDays = Math.abs(yearsEstimate - yearsExact) * 365.25;

        return {
            effectiveRate,
            yearsEstimate,
            yearsExact,
            requiredRateEstimate,
            requiredRateExact,
            realRateEstimate,
            yearsRealEstimate,
            yearsRealExact,
            milestones,
            rateComparisons,
            timeDifferenceDays,
            doubledValue: principal * 2,
        };
    }, [calcMode, initialPrincipal, annualRate, targetYears, inflationRate, ruleVariant]);

    const applyPreset = (preset: PresetScenario) => {
        setAnnualRate(preset.rate);
        setInflationRate(preset.inflation);
        setCalcMode("timeFromRate");
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCalcMode("timeFromRate");
        setCurrency("USD");
        setInitialPrincipal(10000);
        setAnnualRate(8);
        setTargetYears(9);
        setInflationRate(2.5);
        setRuleVariant(72);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `TwisterTools Rule of 72 Doubling Projection:
----------------------------------------
Initial Principal: ${currencySymbol}${initialPrincipal.toLocaleString()}
Annual Interest Rate: ${calcMode === "timeFromRate" ? annualRate : calculations.requiredRateEstimate.toFixed(2)}%
Inflation Rate: ${inflationRate}%
Calculation Constant: Rule of ${ruleVariant}
----------------------------------------
Estimated Time to Double (Rule of ${ruleVariant}): ${calculations.yearsEstimate.toFixed(2)} Years (${(calculations.yearsEstimate * 12).toFixed(1)} Months)
Mathematically Exact Doubling Time: ${calculations.yearsExact.toFixed(2)} Years
Real Inflation-Adjusted Doubling Time: ${calculations.yearsRealExact.toFixed(2)} Years
Portfolio Value After 1st Doubling: ${currencySymbol}${Math.round(calculations.doubledValue).toLocaleString()}
5th Doubling (32x Principal Value): ${currencySymbol}${Math.round(calculations.milestones[4].portfolioValue).toLocaleString()} in ${calculations.milestones[4].yearsExact.toFixed(1)} Years
----------------------------------------
Computed at twistertools.com/tools/calculators/rule-of-72-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Milestone", "Nominal Value", "Out-of-Pocket Principal", "Total Growth Earned", "Years (Rule 72)", "Years (Exact Formula)", "Purchasing Power (Real Value)"];
        const rows = calculationResultsExport();
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rule_of_72_doubling_schedule_${annualRate}pct.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const calculationResultsExport = () => {
        return calculations.milestones.map((m) => [
            `Doubling #${m.doublingNumber} (${Math.pow(2, m.doublingNumber)}x)`,
            m.portfolioValue.toFixed(2),
            initialPrincipal.toFixed(2),
            m.interestAccrued.toFixed(2),
            m.yearsRule72.toFixed(2),
            m.yearsExact.toFixed(2),
            m.purchasingPowerAdjusted.toFixed(2),
        ]);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Rule of 72 Investment Doubling Time Calculator",
        "url": "https://twistertools.com/tools/calculators/rule-of-72-calculator",
        "description": "Calculate exact investment doubling times, compare Rule of 72 vs exact logarithmic formulas, simulate inflation drag, and determine required annual returns.",
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
                "name": "What is the Rule of 72 in financial planning?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Rule of 72 is a simplified mental math shortcut used to estimate how many years it will take for an investment to double at a fixed annual rate of compound interest. By dividing 72 by the expected annual interest rate (e.g., 72 / 8% = 9 years), investors can quickly project wealth accumulation timelines without complex logarithms."
                }
            },
            {
                "@type": "Question",
                "name": "How accurate is the Rule of 72 compared to the exact logarithmic formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Rule of 72 is remarkably accurate for interest rates between 6% and 10%, typically deviating by less than 1% to 2% from the exact mathematical formula (ln(2) / ln(1 + r)). For continuous compounding or lower interest rates (under 5%), the Rule of 69.3 or Rule of 70 provides slightly higher precision."
                }
            },
            {
                "@type": "Question",
                "name": "Can the Rule of 72 be used to calculate inflation's effect on purchasing power?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The Rule of 72 works in reverse for inflation to calculate purchasing power halving time. Dividing 72 by the annual inflation rate (e.g., 72 / 3% inflation = 24 years) determines how long it will take for the real purchasing power of uninvested cash to decrease by 50%."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the required annual interest rate to double money in a specific timeframe?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To calculate the required rate of return to double your capital in a fixed number of years, divide 72 by your target horizon in years. For example, to double your money in 6 years, you require an annual return of 12% (72 / 6 = 12%)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Configuration & Sliders */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Doubling Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Inputs
                            </button>
                        </div>

                        {/* Calculation Mode Toggle Switch */}
                        <div className="mb-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculation Target
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCalcMode("timeFromRate");
                                        setActivePresetId(null);
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${calcMode === "timeFromRate"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    Calculate Years to Double
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCalcMode("rateFromYears");
                                        setActivePresetId(null);
                                    }}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${calcMode === "rateFromYears"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Percent className="w-3.5 h-3.5" />
                                    Find Required Return
                                </button>
                            </div>
                        </div>

                        {/* Currency Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Currency Display
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
                            {/* Initial Capital Principal */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Starting Capital Principal
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{initialPrincipal.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="500"
                                        value={initialPrincipal === 0 ? "" : initialPrincipal}
                                        onChange={(e) => handleNumberInput(e, (val) => setInitialPrincipal(Math.max(1, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Input Based on Mode */}
                            {calcMode === "timeFromRate" ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Percent className="w-4 h-4 text-indigo-600" /> Expected Annual Return (ROI)
                                        </label>
                                        <span className="text-sm font-bold text-indigo-600">{annualRate}%</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0.1"
                                            max="100"
                                            step="0.1"
                                            value={annualRate === 0 ? "" : annualRate}
                                            onChange={(e) => handleNumberInput(e, (val) => {
                                                setAnnualRate(Math.max(0.1, Math.min(100, val)));
                                                setActivePresetId(null);
                                            })}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="25"
                                        step="0.25"
                                        value={annualRate}
                                        onChange={(e) => {
                                            setAnnualRate(Number(e.target.value));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full accent-indigo-600 cursor-pointer mt-2"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-indigo-600" /> Target Horizon (Years to Double)
                                        </label>
                                        <span className="text-sm font-bold text-indigo-600">{targetYears} Years</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0.5"
                                            max="50"
                                            step="0.5"
                                            value={targetYears === 0 ? "" : targetYears}
                                            onChange={(e) => handleNumberInput(e, (val) => setTargetYears(Math.max(0.5, Math.min(50, val))))}
                                            className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">Years</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={targetYears}
                                        onChange={(e) => setTargetYears(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer mt-2"
                                    />
                                </div>
                            )}

                            {/* Advanced Parameters: Inflation & Rule Variant */}
                            <div className="pt-2 border-t border-slate-100 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Flame className="w-3.5 h-3.5 text-amber-500" /> Inflation Drag Rate (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.1"
                                                value={inflationRate === 0 ? "" : inflationRate}
                                                onChange={(e) => handleNumberInput(e, (val) => setInflationRate(Math.max(0, val)))}
                                                className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Scale className="w-3.5 h-3.5 text-indigo-500" /> Rule Numerator
                                        </label>
                                        <select
                                            value={ruleVariant}
                                            onChange={(e) => setRuleVariant(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={72}>Rule of 72 (Standard & Broadest)</option>
                                            <option value={70}>Rule of 70 (Frequent Compounding)</option>
                                            <option value={69.3}>Rule of 69.3 (Continuous Compounding)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Strategy Presets */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Asset Class Presets
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
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Breakdown" : "Copy Doubling Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Metric Display, Timelines & Schedules */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Doubling Intelligence
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("milestones")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "milestones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Doubling Path
                                </button>
                                <button
                                    onClick={() => setActiveTab("comparisons")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "comparisons" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Rate Matrix
                                </button>
                            </div>
                        </div>

                        {/* Top Key Result Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                    {calcMode === "timeFromRate" ? `Rule of ${ruleVariant} Estimate` : "Estimated Required Rate"}
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {calcMode === "timeFromRate"
                                        ? `${calculations.yearsEstimate.toFixed(2)} Years`
                                        : `${calculations.requiredRateEstimate.toFixed(2)}% Annually`}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Exact Math: {calcMode === "timeFromRate" ? `${calculations.yearsExact.toFixed(2)} Years` : `${calculations.requiredRateExact.toFixed(2)}%`} (Δ {calculations.timeDifferenceDays.toFixed(0)} days)
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                                    1st Doubling Value
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculations.doubledValue).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                                    Real Purchasing Power: {currencySymbol}{Math.round(calculations.milestones[0].purchasingPowerAdjusted).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Dynamic Tab Body */}
                        {activeTab === "milestones" ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Exponential Doubling Trajectory (Up to 32x)
                                    </h3>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                        Rate: {calculations.effectiveRate.toFixed(1)}% | Inf: {inflationRate}%
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
                                    {calculations.milestones.map((m) => {
                                        const multiple = Math.pow(2, m.doublingNumber);
                                        const progressRatio = Math.min(100, (m.doublingNumber / 5) * 100);
                                        return (
                                            <div
                                                key={m.doublingNumber}
                                                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition space-y-2"
                                            >
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">
                                                            {multiple}x
                                                        </span>
                                                        Doubling #{m.doublingNumber}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-indigo-600">
                                                            {currencySymbol}{Math.round(m.portfolioValue).toLocaleString()}
                                                        </span>
                                                        <span className="text-slate-400 text-[10px] ml-1.5">
                                                            (@ {m.yearsExact.toFixed(1)} yrs)
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${progressRatio}%` }}
                                                    />
                                                </div>

                                                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                                                    <span>Growth Earned: {currencySymbol}{Math.round(m.interestAccrued).toLocaleString()}</span>
                                                    <span>Real Value: {currencySymbol}{Math.round(m.purchasingPowerAdjusted).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* Rate Comparison Table Matrix */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[310px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Annual ROI</th>
                                            <th className="p-2.5">Rule of 72</th>
                                            <th className="p-2.5">Exact Years</th>
                                            <th className="p-2.5">In 10 Years</th>
                                            <th className="p-2.5">In 20 Years</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculations.rateComparisons.map((row) => (
                                            <tr
                                                key={row.rate}
                                                className={`transition ${Math.abs(row.rate - annualRate) < 0.1
                                                        ? "bg-indigo-50/70 font-bold text-indigo-900"
                                                        : "hover:bg-slate-50"
                                                    }`}
                                            >
                                                <td className="p-2.5 font-bold">{row.rate}%</td>
                                                <td className="p-2.5">{row.rule72Years.toFixed(1)} yrs</td>
                                                <td className="p-2.5 text-slate-500">{row.exactYears.toFixed(2)} yrs</td>
                                                <td className="p-2.5 text-emerald-600">{currencySymbol}{Math.round(row.valueIn10Yrs).toLocaleString()}</td>
                                                <td className="p-2.5 font-semibold text-slate-900">{currencySymbol}{Math.round(row.valueIn20Yrs).toLocaleString()}</td>
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
                            Exact logarithmic comparison active
                        </span>
                        <span>Zero server latency</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Notification Card */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> The Rule of 72 provides simplified mathematical approximations of compound growth assuming constant nominal rates of return. Actual financial market returns vary year over year and are subject to market volatility, fees, taxes, and inflation. This tool is for educational purposes only.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Definition and Algebraic Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is the Rule of 72? Core Theory, Origin, and Mathematical Proof
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>Rule of 72</strong> is one of the most celebrated mental math shortcuts in personal finance and quantitative investing. It provides an immediate, highly accurate estimate of the number of years required for an investment to double in value at a fixed annual compound interest rate.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The rule derives from the continuous compound interest equation $P(t) = P_0 \cdot e^{"{rt}"}$. Setting the target value $P(t)$ equal to double the original principal ($2 \cdot P_0$) yields:
                    </p>

                    {/* Mathematical Formula Display */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Algebraic Derivation
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div>2 = (1 + r)^t  ⟹  ln(2) = t · ln(1 + r)</div>
                            <div>t = ln(2) / ln(1 + r) ≈ 0.69315 / r</div>
                            <div>For annual discrete compounding at moderate rates (6% - 10%), 72 serves as a highly divisible practical numerator:</div>
                            <div className="text-emerald-400 font-bold">Years to Double ≈ 72 / (r × 100)</div>
                        </div>
                        <p className="text-xs text-slate-300 pt-1">
                            The number 72 is mathematically convenient because it possesses numerous integer divisors (1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36), allowing investors to calculate doubling horizons in seconds without needing a calculator.
                        </p>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Case Study: The Multi-Doubling Path
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To witness the exponential velocity of compound doubling, consider an investor named Jordan who allocates a lump sum of <strong>$20,000</strong> into an equity index portfolio generating an <strong>8.0% average annual return</strong>:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Initial Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Initial Capital:</strong> $20,000</li>
                            <li><strong>Nominal Rate of Return:</strong> 8.0% annually</li>
                            <li><strong>Rule of 72 Estimate:</strong> 72 / 8 = <strong>9.00 Years per Doubling</strong></li>
                            <li><strong>Exact Natural Log Formula:</strong> ln(2) / ln(1.08) = <strong>9.006 Years per Doubling</strong></li>
                        </ul>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeline Milestone</th>
                                    <th className="p-3">Doubling Multiplier</th>
                                    <th className="p-3">Total Cumulative Gain</th>
                                    <th className="p-3">Ending Portfolio Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 0 (Kickoff)</td>
                                    <td className="p-3">1x Principal</td>
                                    <td className="p-3">$0</td>
                                    <td className="p-3 font-bold text-slate-900">$20,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 9 (1st Doubling)</td>
                                    <td className="p-3">2x Principal</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$20,000</td>
                                    <td className="p-3 font-bold text-slate-900">$40,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 18 (2nd Doubling)</td>
                                    <td className="p-3">4x Principal</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$60,000</td>
                                    <td className="p-3 font-bold text-slate-900">$80,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 27 (3rd Doubling)</td>
                                    <td className="p-3">8x Principal</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$140,000</td>
                                    <td className="p-3 font-bold text-slate-900">$160,000</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 36 (4th Doubling)</td>
                                    <td className="p-3 font-bold text-indigo-700">16x Principal</td>
                                    <td className="p-3 text-emerald-600 font-bold">+$300,000</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$320,000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Notice how the dollar increase accelerates. The first 9 years generated <strong>$20,000</strong> of profit, whereas the fourth 9-year cycle generated <strong>$160,000</strong> of profit in the exact same span of time without depositing any new capital.
                    </p>
                </section>

                {/* Card 3: Comparing Rule of 72, Rule of 70, and Rule of 69.3 */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Rule of 72 vs. Rule of 70 vs. Rule of 69.3: Accuracy Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Depending on the frequency of compounding and the magnitude of the interest rate, different numerators offer superior mathematical precision:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Rule Variant</th>
                                    <th className="p-3">Optimal Return Range</th>
                                    <th className="p-3">Best Used For</th>
                                    <th className="p-3">Precision Level</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Rule of 72</td>
                                    <td className="p-3">6% to 10% annual rates</td>
                                    <td className="p-3">Stock market indices, real estate, general mental math</td>
                                    <td className="p-3 text-emerald-600 font-semibold">High (Ideal integer divisibility)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Rule of 70</td>
                                    <td className="p-3">3% to 6% annual rates</td>
                                    <td className="p-3">Inflation projections, high-yield savings accounts, treasury bonds</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Very High for lower rates</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Rule of 69.3</td>
                                    <td className="p-3">Continuous compounding</td>
                                    <td className="p-3">Academic finance, institutional derivatives, forex compounding</td>
                                    <td className="p-3 text-purple-600 font-semibold">Exact theoretical continuous limit</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Inflation Drag and Purchasing Power Halving */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Reverse Rule of 72: How Inflation Halves Purchasing Power
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While the Rule of 72 measures the doubling speed of your capital, it works equally in reverse to demonstrate the insidious erosion of uninvested cash purchasing power under constant inflation.
                    </p>

                    <div className="bg-slate-100 border-l-4 border-amber-500 p-4 rounded-r-xl font-mono text-sm text-slate-900 font-bold">
                        Years to Halve Real Wealth = 72 / Annual Inflation Rate (%)
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">2% Inflation</span>
                            <span className="text-lg font-extrabold text-slate-900">36 Years to 50%</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">3% Inflation</span>
                            <span className="text-lg font-extrabold text-amber-600">24 Years to 50%</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">4% Inflation</span>
                            <span className="text-lg font-extrabold text-amber-700">18 Years to 50%</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-xs text-slate-500 font-bold uppercase">6% Inflation</span>
                            <span className="text-lg font-extrabold text-rose-600">12 Years to 50%</span>
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
                                What is the Rule of 72 in financial planning?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Rule of 72 is a simplified mental math shortcut used to estimate how many years it will take for an investment to double at a fixed annual rate of compound interest. By dividing 72 by the expected annual interest rate (e.g., 72 / 8% = 9 years), investors can quickly project wealth accumulation timelines without complex logarithms.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How accurate is the Rule of 72 compared to the exact logarithmic formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Rule of 72 is remarkably accurate for interest rates between 6% and 10%, typically deviating by less than 1% to 2% from the exact mathematical formula (ln(2) / ln(1 + r)). For continuous compounding or lower interest rates (under 5%), the Rule of 69.3 or Rule of 70 provides slightly higher precision.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can the Rule of 72 be used to calculate inflation's effect on purchasing power?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The Rule of 72 works in reverse for inflation to calculate purchasing power halving time. Dividing 72 by the annual inflation rate (e.g., 72 / 3% inflation = 24 years) determines how long it will take for the real purchasing power of uninvested cash to decrease by 50%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the required annual interest rate to double money in a specific timeframe?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To calculate the required rate of return to double your capital in a fixed number of years, divide 72 by your target horizon in years. For example, to double your money in 6 years, you require an annual return of 12% (72 / 6 = 12%).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Essential Financial Disclaimer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are mathematical estimates based on user inputs and assumed parameters. Realized market performance is subject to volatility, tax liabilities, and inflation variations.
                    </p>
                </section>
            </div>
        </div>
    );
}