"use client";

import React, { useState, useMemo } from "react";
import {
    Calculator,
    DollarSign,
    Percent,
    Calendar,
    PieChart,
    RefreshCw,
    Copy,
    Check,
    Download,
    BookOpen,
    HelpCircle,
    TrendingUp,
    FileText,
    ShieldCheck,
    Layers,
    ArrowRight,
    AlertTriangle
} from "lucide-react";

type TimePeriodUnit = "years" | "months" | "days";

interface AmortizationRow {
    period: number;
    label: string;
    interestPaid: number;
    principalPaid: number;
    remainingBalance: number;
    totalInterestToDate: number;
}

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

export default function SimpleInterestCalculator() {
    // Input states
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [principal, setPrincipal] = useState<number>(10000);
    const [rate, setRate] = useState<number>(5.5);
    const [timeValue, setTimeValue] = useState<number>(3);
    const [timeUnit, setTimeUnit] = useState<TimePeriodUnit>("years");
    const [copied, setCopied] = useState<boolean>(false);

    const currencySymbol = currencySymbols[currency];

    // Calculations
    const calculation = useMemo(() => {
        const P = Math.max(0, principal || 0);
        const R = Math.max(0, rate || 0) / 100;
        const TVal = Math.max(0, timeValue || 0);

        // Convert time to fractional years for simple interest formula: I = P * R * T
        let timeInYears = TVal;
        if (timeUnit === "months") {
            timeInYears = TVal / 12;
        } else if (timeUnit === "days") {
            timeInYears = TVal / 365;
        }

        const totalInterest = P * R * timeInYears;
        const totalAmount = P + totalInterest;

        // Monthly equivalent breakdown for visualization
        const totalMonths = Math.max(1, Math.round(timeInYears * 12));
        const monthlyInterest = totalMonths > 0 ? totalInterest / totalMonths : 0;
        const monthlyPayment = totalMonths > 0 ? totalAmount / totalMonths : 0;

        // Schedule generation
        const schedule: AmortizationRow[] = [];
        let currentBalance = P;
        let accumulatedInterest = 0;
        const periodCount = Math.min(totalMonths, 360); // Cap view at 360 periods for performance
        const principalPerPeriod = periodCount > 0 ? P / periodCount : 0;
        const interestPerPeriod = periodCount > 0 ? totalInterest / periodCount : 0;

        for (let i = 1; i <= periodCount; i++) {
            accumulatedInterest += interestPerPeriod;
            currentBalance = Math.max(0, P - principalPerPeriod * i);
            schedule.push({
                period: i,
                label: timeUnit === "days" ? `Day ${Math.round((TVal / periodCount) * i)}` : `Month ${i}`,
                interestPaid: interestPerPeriod,
                principalPaid: principalPerPeriod,
                remainingBalance: currentBalance,
                totalInterestToDate: accumulatedInterest,
            });
        }

        const principalPercentage = totalAmount > 0 ? (P / totalAmount) * 100 : 0;
        const interestPercentage = totalAmount > 0 ? (totalInterest / totalAmount) * 100 : 0;

        return {
            principal: P,
            annualRate: rate,
            timeInYears,
            totalInterest,
            totalAmount,
            monthlyInterest,
            monthlyPayment,
            principalPercentage,
            interestPercentage,
            schedule,
        };
    }, [principal, rate, timeValue, timeUnit]);

    const handleReset = () => {
        setCurrency("USD");
        setPrincipal(10000);
        setRate(5.5);
        setTimeValue(3);
        setTimeUnit("years");
    };

    const handleCopySummary = () => {
        const text = `Simple Interest Calculation Summary:
- Principal Amount: ${currencySymbol}${calculation.principal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Interest Rate: ${calculation.annualRate}% per annum
- Duration: ${timeValue} ${timeUnit}
- Total Interest Earned/Owed: ${currencySymbol}${calculation.totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total Balance (Principal + Interest): ${currencySymbol}${calculation.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Calculated via TwisterTools.com`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Period,Label,Interest Paid,Principal Repaid,Remaining Balance,Total Interest To Date\n"];
        const rows = calculation.schedule.map(
            (r) => `${r.period},"${r.label}",${r.interestPaid.toFixed(2)},${r.principalPaid.toFixed(2)},${r.remainingBalance.toFixed(2)},${r.totalInterestToDate.toFixed(2)}`
        );
        const blob = new Blob([...headers, rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `simple-interest-schedule-${principal}-principal.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Simple Interest & Loan Calculator",
        "url": "https://twistertools.com/tools/calculators/simple-interest-calculator",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "All",
        "description": "Free online browser-native simple interest calculator. Instantly compute interest accumulated, total loan repayment schedules, and printable breakdown reports with zero data collection.",
        "browserRequirements": "Requires JavaScript. Requires HTML5."
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What is simple interest and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simple interest is an easy method for calculating the interest charge on a loan or investment. It is determined exclusively on the original principal amount using the linear mathematical formula I = P × R × T, where P is Principal, R is Annual Rate, and T is Time in years."
                }
            },
            {
                "@type": "Question",
                "name": "How does simple interest differ from compound interest?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simple interest accrues calculated percentage strictly on the principal balance over time. Compound interest, by contrast, calculates interest on both the initial principal and the accumulated interest from previous compounding cycles (interest on interest)."
                }
            },
            {
                "@type": "Question",
                "name": "When is simple interest used in real life?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Simple interest is most commonly used in short-term personal loans, certain auto loans, private mortgages, interest-bearing certificates, consumer retail installment agreements, and simple promissory debt notes."
                }
            },
            {
                "@type": "Question",
                "name": "Is my financial calculation data private on TwisterTools?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, 100% private. All calculations run strictly client-side inside your local browser web engine. No financial numbers, interest rates, or loan terms are ever transmitted to or stored on external backend servers."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Input Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-indigo-600" />
                            Loan & Investment Parameters
                        </h2>
                        <button
                            onClick={handleReset}
                            className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>

                    {/* Currency Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="CAD/AUD">CAD/AUD ($)</option>
                        </select>
                    </div>

                    {/* Principal Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Principal Amount ({currencySymbol})
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                {currencySymbol}
                            </div>
                            <input
                                type="number"
                                min="0"
                                step="any"
                                value={principal || ""}
                                onChange={(e) => setPrincipal(parseFloat(e.target.value) || 0)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                placeholder="e.g. 10000"
                            />
                        </div>
                    </div>

                    {/* Annual Interest Rate Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Annual Interest Rate (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={rate || ""}
                                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                placeholder="e.g. 5.5"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                                <Percent className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Time Term Inputs */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                            Time Period / Loan Term
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={timeValue || ""}
                                    onChange={(e) => setTimeValue(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                    placeholder="Duration"
                                />
                            </div>
                            <div>
                                <select
                                    value={timeUnit}
                                    onChange={(e) => setTimeUnit(e.target.value as TimePeriodUnit)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm capitalize"
                                >
                                    <option value="years">Years</option>
                                    <option value="months">Months</option>
                                    <option value="days">Days</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Quick Slider Shortcuts */}
                    <div className="pt-2 border-t border-slate-100 space-y-4">
                        <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Principal Slider</span>
                                <span className="font-semibold text-slate-700">{currencySymbol}{principal.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="500"
                                max="200000"
                                step="500"
                                value={principal}
                                onChange={(e) => setPrincipal(Number(e.target.value))}
                                className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2 cursor-pointer"
                            />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Interest Rate Slider</span>
                                <span className="font-semibold text-slate-700">{rate}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="30"
                                step="0.25"
                                value={rate}
                                onChange={(e) => setRate(Number(e.target.value))}
                                className="w-full accent-indigo-600 bg-slate-200 rounded-lg h-2 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-full min-w-0">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-indigo-600" />
                                Calculation Breakdown
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopySummary}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                                    title="Copy Calculation Summary"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                                    title="Export Schedule to CSV"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Key Metric Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 my-6">
                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                                    Total Interest
                                </p>
                                <p className="text-2xl font-bold text-indigo-900 mt-1">
                                    {currencySymbol}{calculation.totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Total Final Amount
                                </p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">
                                    {currencySymbol}{calculation.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Sub Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 text-sm py-3 border-t border-b border-slate-100">
                            <div>
                                <span className="text-slate-500">Monthly Payment Eq.:</span>
                                <span className="font-semibold text-slate-800 block">
                                    {currencySymbol}{calculation.monthlyPayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Monthly Interest Eq.:</span>
                                <span className="font-semibold text-slate-800 block">
                                    {currencySymbol}{calculation.monthlyInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Visual Ratio Bar */}
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                <span>Principal: {calculation.principalPercentage.toFixed(1)}%</span>
                                <span>Interest: {calculation.interestPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                                <div
                                    className="bg-slate-800 h-full transition-all duration-300"
                                    style={{ width: `${calculation.principalPercentage}%` }}
                                />
                                <div
                                    className="bg-indigo-600 h-full transition-all duration-300"
                                    style={{ width: `${calculation.interestPercentage}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-slate-800 inline-block" /> Original Principal
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Total Accrued Interest
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Schedule Preview Container */}
                    <div className="mt-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Payment Breakdown Preview ({calculation.schedule.length} Periods)
                        </h3>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 text-xs">
                            <table className="w-full text-left">
                                <thead className="bg-slate-100 text-slate-600 sticky top-0 font-medium">
                                    <tr>
                                        <th className="p-2 pl-3">Period</th>
                                        <th className="p-2">Interest</th>
                                        <th className="p-2">Principal</th>
                                        <th className="p-2 pr-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200/60 text-slate-700">
                                    {calculation.schedule.slice(0, 12).map((row) => (
                                        <tr key={row.period} className="hover:bg-slate-100/50">
                                            <td className="p-2 pl-3 font-medium text-slate-900">{row.label}</td>
                                            <td className="p-2">{currencySymbol}{row.interestPaid.toFixed(2)}</td>
                                            <td className="p-2">{currencySymbol}{row.principalPaid.toFixed(2)}</td>
                                            <td className="p-2 pr-3 text-right font-mono">{currencySymbol}{row.remainingBalance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {calculation.schedule.length > 12 && (
                                <div className="p-2 text-center text-slate-500 italic bg-white border-t border-slate-200">
                                    + {calculation.schedule.length - 12} additional periods in CSV export...
                                </div>
                            )}
                        </div>
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

            {/* BELOW THE FOLD CONTENT CARDS */}

            {/* Card 1: Educational & Math Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6 min-w-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Understanding Simple Interest: Mechanics & Formulas
                    </h2>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Simple interest represents a fundamental financial mechanism used globally across personal banking, private loans, and commercial debt structures. Unlike complex financial instruments, simple interest calculates accrued financial charges strictly upon the initial original capital (the principal balance). It remains constant across all payment durations, offering clarity and predictability without exponential compounding effects.
                </p>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    The fundamental mathematical formula governing simple interest is:
                </p>
                <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-center text-sm md:text-base my-4 shadow-inner">
                    I = P × R × T
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Where:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                    <li><strong>I (Interest):</strong> The absolute amount of interest earned or charged over the duration.</li>
                    <li><strong>P (Principal):</strong> The initial sum of money deposited, invested, or borrowed.</li>
                    <li><strong>R (Rate):</strong> The nominal annual percentage interest rate expressed as a decimal (e.g., 5.5% = 0.055).</li>
                    <li><strong>T (Time):</strong> The time duration for which money is borrowed or invested, measured in years or fractional years.</li>
                </ul>
            </div>

            {/* Card 2: Simple vs Compound Interest */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6 min-w-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Simple Interest vs. Compound Interest
                    </h2>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Selecting between simple interest and compound interest models can dramatically alter financial obligations and investment earnings over time. Understanding key operational distinctions empowers consumers to structure borrowing and savings effectively.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                                <th className="p-3 font-semibold text-slate-800">Feature</th>
                                <th className="p-3 font-semibold text-indigo-700">Simple Interest</th>
                                <th className="p-3 font-semibold text-slate-800">Compound Interest</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            <tr>
                                <td className="p-3 font-medium text-slate-900">Interest Calculation Basis</td>
                                <td className="p-3 text-indigo-900 font-medium bg-indigo-50/30">Original Principal Only</td>
                                <td className="p-3">Principal + Accumulated Past Interest</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-900">Growth Rate</td>
                                <td className="p-3 text-indigo-900 font-medium bg-indigo-50/30">Linear (Constant amount per period)</td>
                                <td className="p-3">Exponential (Accelerating over time)</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-900">Common Applications</td>
                                <td className="p-3 text-indigo-900 font-medium bg-indigo-50/30">Short-term auto loans, personal debt notes</td>
                                <td className="p-3">Mortgages, credit cards, high-yield savings</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-900">Borrower Advantage</td>
                                <td className="p-3 text-indigo-900 font-medium bg-indigo-50/30">Lower total interest cost over long terms</td>
                                <td className="p-3">Higher debt accumulation if unpaid</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card 3: Practical Use Cases */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6 min-w-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <Layers className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Common Real-World Applications
                    </h2>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Simple interest models are widely utilized in transactions where predictability and straightforward calculation are required by both contract parties:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-600" /> Auto Loans & Short-Term Financing
                        </h3>
                        <p className="text-slate-600 text-sm">
                            Many auto lenders utilize simple interest loan agreements, where daily interest accrues directly based on the exact remaining principal balance.
                        </p>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-600" /> Private Promissory Notes
                        </h3>
                        <p className="text-slate-600 text-sm">
                            Peer-to-peer lending, family agreements, and private business promissory debt arrangements heavily rely on simple interest calculations for ease of auditing.
                        </p>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-600" /> Certificates of Deposit (CDs)
                        </h3>
                        <p className="text-slate-600 text-sm">
                            Certain short-term banking fixed-term deposit accounts offer simple interest payouts paid directly to the investor at predefined terms.
                        </p>
                    </div>
                    <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-indigo-600" /> Commercial Line Penalties
                        </h3>
                        <p className="text-slate-600 text-sm">
                            Late payment fee schedules and commercial late fee interest terms are structured using linear daily simple interest mechanics.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 4: Frequently Asked Questions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6 min-w-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="font-semibold text-slate-900 text-base">
                            What is simple interest and how is it calculated?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-2">
                            Simple interest is an easy method for calculating interest charges on a loan or investment. It is determined exclusively on the original principal amount using the linear mathematical formula <strong>I = P × R × T</strong>, where P is Principal, R is Annual Rate, and T is Time in years.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="font-semibold text-slate-900 text-base">
                            How does simple interest differ from compound interest?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-2">
                            Simple interest accrues calculated percentage strictly on the principal balance over time. Compound interest, by contrast, calculates interest on both the initial principal and the accumulated interest from previous compounding cycles (interest on interest).
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="font-semibold text-slate-900 text-base">
                            When is simple interest used in real life?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-2">
                            Simple interest is most commonly used in short-term personal loans, certain auto loans, private mortgages, interest-bearing certificates, consumer retail installment agreements, and simple promissory debt notes.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="font-semibold text-slate-900 text-base">
                            Is my financial calculation data private on TwisterTools?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed mt-2">
                            Yes, 100% private. All calculations run strictly client-side inside your local browser web engine. No financial numbers, interest rates, or loan terms are ever transmitted to or stored on external backend servers.
                        </p>
                    </div>
                </div>
            </div>

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
    );
}