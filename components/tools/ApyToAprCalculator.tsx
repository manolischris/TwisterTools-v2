"use client";

import React, { useState, useMemo } from "react";
import {
    Percent,
    ArrowRightLeft,
    RefreshCw,
    Copy,
    CheckCircle,
    Download,
    Layers,
    Calculator,
    Scale,
    TrendingUp,
    Zap,
    Coins,
    FileText,
    HelpCircle,
    ShieldAlert,
    Clock,
    DollarSign,
    ArrowUpRight,
    Sparkles,
    BarChart3,
    Table as TableIcon,
    AlertTriangle,
    BookOpen,
    CheckSquare,
    TrendingDown,
    Building2,
    Landmark,
    CreditCard,
    PieChart,
    ChevronRight,
} from "lucide-react";

type Mode = "apy-to-apr" | "apr-to-apy";
type CompoundingFreqKey = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannually" | "annually" | "continuous";

interface FreqOption {
    label: string;
    periods: number;
    description: string;
}

const FREQUENCY_MAP: Record<CompoundingFreqKey, FreqOption> = {
    daily: { label: "Daily", periods: 365, description: "Compounded 365 times per year" },
    weekly: { label: "Weekly", periods: 52, description: "Compounded 52 times per year" },
    biweekly: { label: "Bi-Weekly", periods: 26, description: "Compounded 26 times per year" },
    monthly: { label: "Monthly", periods: 12, description: "Compounded 12 times per year" },
    quarterly: { label: "Quarterly", periods: 4, description: "Compounded 4 times per year" },
    semiannually: { label: "Semi-Annually", periods: 2, description: "Compounded twice per year" },
    annually: { label: "Annually", periods: 1, description: "Compounded once per year" },
    continuous: { label: "Continuous", periods: Infinity, description: "Compounded infinitely (Euler's e)" },
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

export default function ApyToAprCalculator() {
    // --- STATE MANAGEMENT ---
    const [mode, setMode] = useState<Mode>("apy-to-apr");
    const [rateInput, setRateInput] = useState<number>(5.5);
    const [frequency, setFrequency] = useState<CompoundingFreqKey>("monthly");
    const [principal, setPrincipal] = useState<number>(10000);
    const [tenorYears, setTenorYears] = useState<number>(1);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"rates" | "yield">("rates");

    // --- CONVERSION & YIELD CALCULATIONS ---
    const calculations = useMemo(() => {
        const rInput = rateInput / 100;
        const periods = FREQUENCY_MAP[frequency].periods;

        let calculatedApr = 0;
        let calculatedApy = 0;

        if (mode === "apy-to-apr") {
            calculatedApy = rateInput;
            if (frequency === "continuous") {
                calculatedApr = Math.log(1 + rInput) * 100;
            } else {
                calculatedApr = (periods * (Math.pow(1 + rInput, 1 / periods) - 1)) * 100;
            }
        } else {
            calculatedApr = rateInput;
            if (frequency === "continuous") {
                calculatedApy = (Math.exp(rInput) - 1) * 100;
            } else {
                calculatedApy = (Math.pow(1 + rInput / periods, periods) - 1) * 100;
            }
        }

        const effectiveAprDec = calculatedApr / 100;
        const effectiveApyDec = calculatedApy / 100;

        // Future Value Calculations
        let futureValueCompound = 0;
        if (frequency === "continuous") {
            futureValueCompound = principal * Math.exp(effectiveAprDec * tenorYears);
        } else {
            futureValueCompound = principal * Math.pow(1 + effectiveAprDec / periods, periods * tenorYears);
        }

        const futureValueSimple = principal * (1 + effectiveAprDec * tenorYears);
        const compoundInterestEarned = Math.max(0, futureValueCompound - principal);
        const simpleInterestEarned = Math.max(0, futureValueSimple - principal);
        const compoundBonus = Math.max(0, futureValueCompound - futureValueSimple);

        // All Frequencies Comparison Grid
        const comparisonRows = (Object.keys(FREQUENCY_MAP) as CompoundingFreqKey[]).map((key) => {
            const opt = FREQUENCY_MAP[key];
            let itemApy = 0;
            let itemApr = 0;

            if (mode === "apy-to-apr") {
                itemApy = rateInput;
                if (key === "continuous") {
                    itemApr = Math.log(1 + rInput) * 100;
                } else {
                    itemApr = (opt.periods * (Math.pow(1 + rInput, 1 / opt.periods) - 1)) * 100;
                }
            } else {
                itemApr = rateInput;
                if (key === "continuous") {
                    itemApy = (Math.exp(rInput) - 1) * 100;
                } else {
                    itemApy = (Math.pow(1 + rInput / opt.periods, opt.periods) - 1) * 100;
                }
            }

            let finalBalance = 0;
            if (key === "continuous") {
                finalBalance = principal * Math.exp((itemApr / 100) * tenorYears);
            } else {
                finalBalance = principal * Math.pow(1 + (itemApr / 100) / opt.periods, opt.periods * tenorYears);
            }

            return {
                key,
                label: opt.label,
                periods: opt.periods === Infinity ? "Continuous (e)" : `${opt.periods}/yr`,
                apr: itemApr,
                apy: itemApy,
                spread: Math.abs(itemApy - itemApr),
                endingBalance: finalBalance,
            };
        });

        return {
            calculatedApr,
            calculatedApy,
            spread: Math.abs(calculatedApy - calculatedApr),
            futureValueCompound,
            futureValueSimple,
            compoundInterestEarned,
            simpleInterestEarned,
            compoundBonus,
            comparisonRows,
        };
    }, [mode, rateInput, frequency, principal, tenorYears]);

    // --- HANDLERS ---
    const handleReset = () => {
        setMode("apy-to-apr");
        setRateInput(5.5);
        setFrequency("monthly");
        setPrincipal(10000);
        setTenorYears(1);
    };

    const handleCopySummary = () => {
        const summaryText = `TwisterTools - APY to APR Rate Conversion Summary
--------------------------------------------------
Calculation Mode: ${mode === "apy-to-apr" ? "APY to Nominal APR" : "APR to Effective APY"}
Input Yield: ${rateInput.toFixed(4)}%
Compounding Frequency: ${FREQUENCY_MAP[frequency].label} (${FREQUENCY_MAP[frequency].periods === Infinity ? "Continuous" : `${FREQUENCY_MAP[frequency].periods}/yr`})
--------------------------------------------------
Resulting APR (Nominal): ${calculations.calculatedApr.toFixed(4)}%
Resulting APY (Effective Yield): ${calculations.calculatedApy.toFixed(4)}%
Yield Spread Difference: ${calculations.spread.toFixed(4)}%
--------------------------------------------------
Principal Investment: $${principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Investment Horizon: ${tenorYears} Year(s)
Final Compounded Value: $${calculations.futureValueCompound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Total Compounded Interest: $${calculations.compoundInterestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Compound Extra Yield Bonus: +$${calculations.compoundBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/apy-to-apr-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCSV = () => {
        const headers = ["Compounding Interval", "Periods Per Year", "Nominal APR (%)", "Effective APY (%)", "Spread Difference (%)", `Ending Balance ($${tenorYears} Yrs)`];
        const rows = calculations.comparisonRows.map((r) => [
            r.label,
            r.periods,
            r.apr.toFixed(4),
            r.apy.toFixed(4),
            r.spread.toFixed(4),
            r.endingBalance.toFixed(2),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `apy_apr_conversion_table_${frequency}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- JSON-LD SCHEMAS ---
    const jsonLdSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebApplication",
                "name": "APY to APR & Compound Yield Calculator",
                "url": "https://twistertools.com/tools/calculators/apy-to-apr-calculator",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "description": "Convert APY to APR and APR to APY instantaneously across daily, weekly, monthly, quarterly, and continuous compounding schedules with comprehensive future yield modeling and side-by-side lending analyses.",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                },
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is the primary mathematical formula used to convert APY to APR?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "The exact mathematical formula to convert Annual Percentage Yield (APY) to nominal Annual Percentage Rate (APR) is: APR = n * [ (1 + APY)^(1 / n) - 1 ], where 'n' is the number of compounding periods per calendar year. In the limit of continuous compounding, the formula simplifies to APR = ln(1 + APY).",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Why is APY consistently higher than APR for compounding interest?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "APY reflects the effective annual return factoring in compound interest—earning returns upon previously credited returns throughout the year. APR only measures the simple nominal baseline rate without reinvestment benefits. Whenever interest compounds more than once per year (n > 1), APY will mathematically exceed APR.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "Why do credit card lenders advertise APR while banks advertise APY on savings?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Financial institutions leverage marketing psychology within federal disclosure frameworks like TILA and TISA. Lenders advertise APR because the nominal number appears lower, minimizing the borrower's perceived debt cost. Conversely, banks and credit unions advertise APY on high-yield savings, money market funds, and CDs because the higher compounding number attracts depositors.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "How does compounding frequency impact the spread between APR and APY?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Higher compounding frequencies widen the yield spread between APR and APY. For instance, daily compounding (365 periods/year) creates a significantly larger yield delta than annual or semi-annual compounding because interest is credited and reinvested immediately, maximizing exponential capital acceleration.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "What is continuous compounding and what is its upper limit?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Continuous compounding represents the mathematical asymptotic ceiling where interest compounds over infinitely small intervals using Euler's constant (e ≈ 2.71828). Its conversion is governed by APY = e^(APR) - 1 and APR = ln(1 + APY), representing the maximum yield achievable from nominal rates.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "How do daily 360-day commercial bank conventions differ from 365-day conventions?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Commercial banks and money markets frequently use the '360-day commercial year' (Exact/360) convention rather than a strict 365-day Gregorian calendar. This slight variance charges or credits 1/360th of the nominal interest rate over 365 physical days, increasing the effective annual borrower cost or depositor yield by roughly 1.39%.",
                        },
                    },
                ],
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden font-sans antialiased text-slate-900">
            {/* JSON-LD Header Script */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
            />

            {/* 50/50 WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* LEFT WORKSPACE: PARAMETERS & CONTROLS */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Conversion Setup</span>
                        </h2>
                        <button
                            onClick={handleReset}
                            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-lg transition-all border border-slate-200"
                            title="Reset calculator to standard defaults"
                        >
                            <RefreshCw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    </div>

                    {/* Mode Toggle Switch */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Conversion Direction
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setMode("apy-to-apr")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${mode === "apy-to-apr"
                                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>APY → APR</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("apr-to-apy")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${mode === "apr-to-apy"
                                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                                <span>APR → APY</span>
                            </button>
                        </div>
                    </div>

                    {/* Primary Yield Rate Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            {mode === "apy-to-apr" ? "Effective APY Input Rate (%)" : "Nominal APR Input Rate (%)"}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                                <Percent className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                step="0.01"
                                value={rateInput === 0 ? "" : rateInput}
                                onChange={(e) => handleNumberInput(e, (val) => setRateInput(Math.max(0, val)))}
                                placeholder="5.50"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500">
                            {mode === "apy-to-apr"
                                ? "Enter the advertised APY from high-yield savings, DeFi staking, or certificates of deposit."
                                : "Enter the nominal APR stated by lenders, credit card agreements, or auto loan contracts."}
                        </p>
                    </div>

                    {/* Compounding Frequency Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Compounding Schedule Frequency
                        </label>
                        <select
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as CompoundingFreqKey)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                        >
                            <option value="daily">Daily Compounding (365/year)</option>
                            <option value="weekly">Weekly Compounding (52/year)</option>
                            <option value="biweekly">Bi-Weekly Compounding (26/year)</option>
                            <option value="monthly">Monthly Compounding (12/year)</option>
                            <option value="quarterly">Quarterly Compounding (4/year)</option>
                            <option value="semiannually">Semi-Annually Compounding (2/year)</option>
                            <option value="annually">Annually Compounding (1/year)</option>
                            <option value="continuous">Continuous Compounding (e^rt)</option>
                        </select>
                        <p className="text-[11px] text-slate-500">
                            {FREQUENCY_MAP[frequency].description}
                        </p>
                    </div>

                    {/* Principal & Term Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Principal Balance ($)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                    <DollarSign className="w-4 h-4" />
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={principal === 0 ? "" : principal}
                                    onChange={(e) => handleNumberInput(e, (val) => setPrincipal(Math.max(0, val)))}
                                    placeholder="10000"
                                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Investment Horizon (Yrs)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={tenorYears === 0 ? "" : tenorYears}
                                    onChange={(e) => handleNumberInput(e, (val) => setTenorYears(val === 0 ? 0 : Math.max(1, Math.min(50, val))))}
                                    placeholder="1"
                                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT WORKSPACE: CONVERSION RESULTS & SPREAD */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    {/* Primary Output Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`border rounded-xl p-4 text-center transition-all ${mode === "apy-to-apr"
                                ? "bg-indigo-50/70 border-indigo-200"
                                : "bg-slate-50 border-slate-200/80"
                            }`}>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                                Nominal APR (Stated)
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {calculations.calculatedApr.toFixed(4)}%
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                                Simple annual baseline
                            </span>
                        </div>

                        <div className={`border rounded-xl p-4 text-center transition-all ${mode === "apr-to-apy"
                                ? "bg-indigo-50/70 border-indigo-200"
                                : "bg-slate-50 border-slate-200/80"
                            }`}>
                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 mb-1">
                                Effective APY (Yield)
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-indigo-600 tracking-tight">
                                {calculations.calculatedApy.toFixed(4)}%
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                                True compounding return
                            </span>
                        </div>
                    </div>

                    {/* Rate Spread Indicator */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-slate-700">Compounding Delta Spread:</span>
                        </div>
                        <div className="text-sm font-black text-slate-900 font-mono">
                            +{(calculations.spread).toFixed(4)}%
                        </div>
                    </div>

                    {/* View Selection & Action Toolbar */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab("rates")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "rates"
                                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                        : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span>Schedule Matrix</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("yield")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "yield"
                                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                        : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Dollar Yield Analysis</span>
                            </button>
                        </div>

                        <div className="flex space-x-1.5">
                            <button
                                onClick={handleCopySummary}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                                title="Copy yield summary to clipboard"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownloadCSV}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                                title="Download frequency matrix CSV"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* TAB 1: ALL FREQUENCIES MATRIX */}
                    {activeTab === "rates" && (
                        <div className="overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-2.5">Interval</th>
                                        <th className="p-2.5">Periods</th>
                                        <th className="p-2.5">APR</th>
                                        <th className="p-2.5">APY</th>
                                        <th className="p-2.5 text-right">Future Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {calculations.comparisonRows.map((row) => {
                                        const isSelected = row.key === frequency;
                                        return (
                                            <tr
                                                key={row.key}
                                                className={`transition-colors ${isSelected ? "bg-indigo-50/70 font-bold text-indigo-950" : "hover:bg-slate-50"
                                                    }`}
                                            >
                                                <td className="p-2.5">
                                                    {row.label}
                                                    {isSelected && <span className="ml-1 text-[10px] text-indigo-600">(Active)</span>}
                                                </td>
                                                <td className="p-2.5 text-slate-500">{row.periods}</td>
                                                <td className="p-2.5">{row.apr.toFixed(3)}%</td>
                                                <td className="p-2.5 text-indigo-600 font-semibold">{row.apy.toFixed(3)}%</td>
                                                <td className="p-2.5 text-right font-mono">
                                                    ${row.endingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB 2: DOLLAR YIELD BREAKDOWN */}
                    {activeTab === "yield" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Future Compounded Balance</span>
                                    <div className="text-slate-900 text-lg font-black mt-1">
                                        ${calculations.futureValueCompound.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <span className="text-emerald-600 font-semibold mt-0.5 block text-[11px]">
                                        +${calculations.compoundInterestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total interest
                                    </span>
                                </div>

                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Non-Compounded (Simple APR)</span>
                                    <div className="text-slate-700 text-lg font-bold mt-1">
                                        ${calculations.futureValueSimple.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <span className="text-slate-500 font-semibold mt-0.5 block text-[11px]">
                                        +${calculations.simpleInterestEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} simple interest
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="text-xs font-bold text-emerald-900">Compound Reinvestment Bonus:</span>
                                </div>
                                <span className="text-sm font-black text-emerald-700 font-mono">
                                    +${calculations.compoundBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Regulatory Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This APY to APR conversion utility is provided strictly for educational, analytical, and comparative purposes. Actual lending charges, APR disclosures under the Truth in Lending Act (TILA), and APY calculations under the Truth in Savings Act (TISA) can vary depending on institutional day-count conventions (such as 360 vs. 365-day schedules), loan origination fees, closing costs, leap years, and specific creditor compounding policies.
                </p>
            </div>

            {/* BELOW-THE-FOLD CONTENT */}
            <div className="space-y-6">

                {/* CARD 1: DEFINITIONS & MATHEMATICAL FOUNDATION */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematical Mechanics of APY and APR Conversion
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Navigating commercial banking, investment products, mortgage terms, and consumer debt requires a rigorous understanding of the difference between <strong>Annual Percentage Rate (APR)</strong> and <strong>Annual Percentage Yield (APY)</strong>. While both metrics express annualized interest as a percentage, they measure two fundamentally different financial realities.
                    </p>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>APR (Nominal Annual Rate)</strong> represents the simple annual contractual interest rate charged or earned without accounting for intra-year interest reinvestment. In contrast, <strong>APY (Effective Annual Yield)</strong> reflects the true mathematical rate of return or borrowing cost by incorporating the compounding effect—earning or paying interest on top of accumulated interest across defined periodic intervals.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Formula 1: APY to APR */}
                        <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                                <ArrowRightLeft className="w-4 h-4" /> Converting APY to Nominal APR
                            </h3>
                            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs md:text-sm text-indigo-300 border border-slate-800 overflow-x-auto">
                                APR = n × [ (1 + APY)^(1 / n) - 1 ]
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Used to unmask the contractual nominal interest rate embedded inside high-yield savings accounts, staking reward protocols, or certificate of deposit (CD) yield tiers with <em>n</em> compounding periods per year.
                            </p>
                        </div>

                        {/* Formula 2: APR to APY */}
                        <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
                            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                                <ArrowRightLeft className="w-4 h-4" /> Converting APR to Effective APY
                            </h3>
                            <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs md:text-sm text-indigo-300 border border-slate-800 overflow-x-auto">
                                APY = (1 + APR / n)^n - 1
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Used by borrowers to determine the true effective annual cost of debt on credit cards, revolving lines of credit, or personal loans that compound interest daily or monthly.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 2: SIDE-BY-SIDE CORE COMPARISON TABLE */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Scale className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Comparison: APR vs. APY at a Glance
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To quickly identify whether a financial quote works in your favor or costs you money, examine how APR and APY operate across institutional contexts:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5">Key Characteristic</th>
                                    <th className="p-3.5">Annual Percentage Rate (APR)</th>
                                    <th className="p-3.5">Annual Percentage Yield (APY)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Core Definition</td>
                                    <td className="p-3.5">Simple nominal annualized interest rate</td>
                                    <td className="p-3.5 text-indigo-700 font-semibold">Effective annual return including compounding</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Compounding Effect</td>
                                    <td className="p-3.5 text-slate-500">Excluded (Assumes zero reinvestment)</td>
                                    <td className="p-3.5 text-emerald-600 font-semibold">Fully included and calculated</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Primary Commercial Use</td>
                                    <td className="p-3.5">Loans, mortgages, credit cards, auto financing</td>
                                    <td className="p-3.5">High-yield savings, money market accounts, CDs, bonds</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Regulatory Framework</td>
                                    <td className="p-3.5">Truth in Lending Act (TILA / Regulation Z)</td>
                                    <td className="p-3.5">Truth in Savings Act (TISA / Regulation DD)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Relative Magnitude</td>
                                    <td className="p-3.5">Always lower than APY (when n &gt; 1)</td>
                                    <td className="p-3.5 text-indigo-700 font-bold">Always higher than APR (when n &gt; 1)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-bold text-slate-900">Consumer Benefit</td>
                                    <td className="p-3.5">Identifies base contractual borrowing fee</td>
                                    <td className="p-3.5 text-emerald-600 font-bold">Reveals true total wealth accumulation</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CARD 3: STEP-BY-STEP WORKED CALCULATION EXAMPLES */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Examples
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow these detailed mathematical demonstrations showing exact manual calculations for both conversion directions:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example 1: APY to APR */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-800 text-sm">Example 1: APY to APR</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">Daily Compounding</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Scenario:</strong> A high-yield savings account advertises an <strong>APY of 6.00%</strong> with daily compounding (n = 365). What is the nominal APR?
                            </p>
                            <div className="space-y-1.5 font-mono text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
                                <div>1. APY decimal = 0.06</div>
                                <div>2. (1 + 0.06)^(1 / 365) = 1.06^(0.0027397) = 1.00015965</div>
                                <div>3. Subtract 1 = 0.00015965</div>
                                <div>4. Multiply by 365 = 0.058273</div>
                                <div className="text-indigo-600 font-bold pt-1 border-t border-slate-100">Result: Nominal APR = 5.827%</div>
                            </div>
                            <p className="text-xs text-slate-500">
                                The bank only needs to pay a base rate of 5.827% to generate an effective 6.00% annual depositor yield.
                            </p>
                        </div>

                        {/* Example 2: APR to APY */}
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-800 text-sm">Example 2: APR to APY</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">Daily Compounding</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Scenario:</strong> A credit card charges a nominal <strong>APR of 24.99%</strong> compounding on a daily basis (n = 365). What is the real effective APY?
                            </p>
                            <div className="space-y-1.5 font-mono text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-800">
                                <div>1. APR decimal = 0.2499</div>
                                <div>2. Daily rate = 0.2499 / 365 = 0.000684657</div>
                                <div>3. Add 1 = 1.000684657</div>
                                <div>4. Raise to 365th power = (1.000684657)^365 = 1.28359</div>
                                <div className="text-rose-600 font-bold pt-1 border-t border-slate-100">Result: Effective APY = 28.36%</div>
                            </div>
                            <p className="text-xs text-slate-500">
                                Carrying a revolving balance results in an actual compounding interest charge <strong>3.37% higher</strong> than the advertised APR.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 4: COMPOUNDING FREQUENCIES & CONTINUOUS LIMIT */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Compounding Frequencies & The Euler Continuous Limit
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compounding frequency determines how often accrued interest is credited back to the principal. As frequency increases, the interval between compounding events shrinks, accelerating growth. When intervals become infinitesimal, compounding reaches the continuous limit governed by Euler's constant ($e \approx 2.7182818$).
                    </p>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below demonstrates how a <strong>12.00% Nominal APR</strong> expands across compounding schedules on a <strong>$10,000 balance over 5 years</strong>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Compounding Schedule</th>
                                    <th className="p-3">Intervals / Yr (n)</th>
                                    <th className="p-3">Effective APY (%)</th>
                                    <th className="p-3">5-Year Ending Balance</th>
                                    <th className="p-3">Net Compounding Gain</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Annually</td>
                                    <td className="p-3">1</td>
                                    <td className="p-3">12.0000%</td>
                                    <td className="p-3 font-bold text-slate-900">$17,623.42</td>
                                    <td className="p-3 text-slate-400">$0.00 (Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Semi-Annually</td>
                                    <td className="p-3">2</td>
                                    <td className="p-3">12.3600%</td>
                                    <td className="p-3 font-bold text-slate-900">$17,908.48</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$285.06</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Quarterly</td>
                                    <td className="p-3">4</td>
                                    <td className="p-3">12.5509%</td>
                                    <td className="p-3 font-bold text-slate-900">$18,061.11</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$437.69</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly</td>
                                    <td className="p-3">12</td>
                                    <td className="p-3">12.6825%</td>
                                    <td className="p-3 font-bold text-slate-900">$18,166.97</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$543.55</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Daily (365)</td>
                                    <td className="p-3">365</td>
                                    <td className="p-3">12.7475%</td>
                                    <td className="p-3 font-bold text-slate-900">$18,219.39</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$595.97</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Continuous ($e^{'{rt}'}$)</td>
                                    <td className="p-3 font-bold text-slate-900">$\infty$</td>
                                    <td className="p-3 font-extrabold text-indigo-700">12.7497%</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$18,221.19</td>
                                    <td className="p-3 text-emerald-600 font-bold">+$597.77</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CARD 5: COMMERCIAL MARKETING & CONSUMER PSYCHOLOGY */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Banking Psychology & Financial Marketing Disclosures
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Financial institutions carefully select whether to display APR or APY based on behavioral psychology, product positioning, and legal requirements:
                    </p>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mb-2">
                                <Landmark className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">High-Yield Savings & CDs</h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Advertised in <strong>APY</strong> because the higher yield number looks more attractive to savers. Federal Truth in Savings Act (Regulation DD) rules require APY to be displayed prominently in promotional headings.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold mb-2">
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Credit Cards & Lines of Credit</h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Advertised in <strong>APR</strong> because a nominal 19.99% rate looks substantially lower than its true 22.11% compounding APY. The Truth in Lending Act (Regulation Z) requires clear APR statement disclosures.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold mb-2">
                                <Coins className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">DeFi Yields & Crypto Staking</h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Crypto protocols often state triple-digit <strong>APYs</strong> that assume continuous auto-compounding. If rewards are not automatically restaked, investors only receive the lower underlying nominal APR.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 6: PRACTICAL DECISION CHECKLIST */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Investor & Borrower Evaluation Checklist
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this essential decision checklist when comparing banking offers, personal loans, or investment yields:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 text-slate-700 text-sm">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                            <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block">Always Compare Apples to Apples</strong>
                                <span className="text-slate-600 text-xs">Never evaluate one bank’s APY directly against another bank’s APR. Convert both rates to the same standard using this tool.</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                            <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block">Verify Compounding Frequency</strong>
                                <span className="text-slate-600 text-xs">Two savings accounts quoting the same 5.00% APR will produce different returns if one compounds daily and the other compounds quarterly.</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                            <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block">Account for Mandatory Fees</strong>
                                <span className="text-slate-600 text-xs">Mortgage and loan APRs often include origination and lender fees, making loan APR higher than the base contract interest rate.</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                            <ChevronRight className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-slate-900 block">Factor in Tax and Inflation Drag</strong>
                                <span className="text-slate-600 text-xs">Interest income from high-yield accounts is taxed annually as ordinary income, reducing your net real-world APY.</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 7: FAQS */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                What is the primary mathematical formula used to convert APY to APR?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The exact mathematical formula to convert Annual Percentage Yield (APY) to nominal Annual Percentage Rate (APR) is: APR = n * [ (1 + APY)^(1 / n) - 1 ], where 'n' is the number of compounding periods per calendar year. In the limit of continuous compounding, the formula simplifies to APR = ln(1 + APY).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                Why is APY consistently higher than APR for compounding interest?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                APY reflects the effective annual return factoring in compound interest—earning returns upon previously credited returns throughout the year. APR only measures the simple nominal baseline rate without reinvestment benefits. Whenever interest compounds more than once per year (n &gt; 1), APY will mathematically exceed APR.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                Why do credit card lenders advertise APR while banks advertise APY on savings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial institutions leverage marketing psychology within federal disclosure frameworks like TILA and TISA. Lenders advertise APR because the nominal number appears lower, minimizing the borrower's perceived debt cost. Conversely, banks and credit unions advertise APY on high-yield savings, money market funds, and CDs because the higher compounding number attracts depositors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                How does compounding frequency impact the spread between APR and APY?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Higher compounding frequencies widen the yield spread between APR and APY. For instance, daily compounding (365 periods/year) creates a significantly larger yield delta than annual or semi-annual compounding because interest is credited and reinvested immediately, maximizing exponential capital acceleration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                What is continuous compounding and what is its upper limit?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Continuous compounding represents the mathematical asymptotic ceiling where interest compounds over infinitely small intervals using Euler's constant (e ≈ 2.71828). Its conversion is governed by APY = e^(APR) - 1 and APR = ln(1 + APY), representing the maximum yield achievable from nominal rates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                How do daily 360-day commercial bank conventions differ from 365-day conventions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Commercial banks and money markets frequently use the "360-day commercial year" (Exact/360) convention rather than a strict 365-day Gregorian calendar. This slight variance charges or credits 1/360th of the nominal interest rate over 365 physical days, increasing the effective annual borrower cost or depositor yield by roughly 1.39%.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 8: STATUTORY & FINANCIAL DISCLAIMER */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-4 p-4 sm:p-6">
                    <ShieldAlert className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Financial & Legal Disclaimer
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Disclaimer: This tool provides computational mathematical conversions based on standard discrete and continuous compounding equations. Actual interest charges and investment yields are governed by individual banking agreements, periodic statement cycles, loan closing costs, and statutory disclosure conventions. This calculator does not constitute financial, legal, or investment advice.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}