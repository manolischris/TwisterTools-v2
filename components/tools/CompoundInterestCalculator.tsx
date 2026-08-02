"use client";

import React, { useState, useMemo } from "react";
import {
    TrendingUp,
    DollarSign,
    Calendar,
    Percent,
    PieChart,
    HelpCircle,
    CheckCircle,
    FileText,
    Copy,
    Download,
    RotateCcw,
    Sparkles,
    Layers,
    ShieldAlert,
    BarChart3,
    List,
    Scale,
    Flame,
    Calculator,
    ArrowUpRight,
    TrendingDown,
    Coins,
    ShieldCheck,
    Zap,
    AlertTriangle,
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

export default function CompoundInterestCalculator() {
    // --- STATE MANAGEMENT ---
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [initialInvestment, setInitialInvestment] = useState<number>(10000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [annualRate, setAnnualRate] = useState<number>(7);
    const [years, setYears] = useState<number>(10);
    const [compoundFrequency, setCompoundFrequency] = useState<number>(12); // 1, 4, 12, 365
    const [inflationRate, setInflationRate] = useState<number>(2.5);
    const [adjustForInflation, setAdjustForInflation] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"visual" | "table">("visual");

    const currencySymbol = currencySymbols[currency];

    // --- CALCULATION LOGIC ---
    const calculationResults = useMemo(() => {
        const totalMonths = years * 12;
        let currentBalance = initialInvestment;
        let totalDeposited = initialInvestment;
        let totalInterest = 0;
        const schedule: ScheduleRow[] = [];

        const effectiveAnnualRate = adjustForInflation
            ? ((1 + annualRate / 100) / (1 + inflationRate / 100) - 1) * 100
            : annualRate;

        const ratePerPeriod = effectiveAnnualRate / 100 / compoundFrequency;
        const periodsPerMonth = compoundFrequency / 12;

        let yearStartingBalance = currentBalance;
        let yearContributions = 0;
        let yearInterest = 0;

        for (let month = 1; month <= totalMonths; month++) {
            currentBalance += monthlyContribution;
            totalDeposited += monthlyContribution;
            yearContributions += monthlyContribution;

            let monthInterest = 0;
            if (compoundFrequency >= 12) {
                for (let p = 0; p < periodsPerMonth; p++) {
                    const interestPeriod = currentBalance * ratePerPeriod;
                    monthInterest += interestPeriod;
                    currentBalance += interestPeriod;
                }
            } else {
                const monthlyRate = Math.pow(1 + ratePerPeriod, periodsPerMonth) - 1;
                monthInterest = currentBalance * monthlyRate;
                currentBalance += monthInterest;
            }

            totalInterest += monthInterest;
            yearInterest += monthInterest;

            if (month % 12 === 0 || month === totalMonths) {
                const yearNumber = Math.ceil(month / 12);
                schedule.push({
                    year: yearNumber,
                    startingBalance: Math.round(yearStartingBalance),
                    contributions: Math.round(yearContributions),
                    interestEarned: Math.round(yearInterest),
                    endingBalance: Math.round(currentBalance),
                    totalContributions: Math.round(totalDeposited),
                    totalInterest: Math.round(totalInterest),
                });

                yearStartingBalance = currentBalance;
                yearContributions = 0;
                yearInterest = 0;
            }
        }

        const futureValue = currentBalance;
        const interestPercentage =
            futureValue > 0 ? (totalInterest / futureValue) * 100 : 0;
        const principalPercentage =
            futureValue > 0 ? (totalDeposited / futureValue) * 100 : 0;

        // APY Calculation: (1 + r/n)^n - 1
        const nominalDec = annualRate / 100;
        const apy = (Math.pow(1 + nominalDec / compoundFrequency, compoundFrequency) - 1) * 100;

        return {
            futureValue,
            totalDeposited,
            totalInterest,
            interestPercentage,
            principalPercentage,
            schedule,
            apy,
        };
    }, [
        initialInvestment,
        monthlyContribution,
        annualRate,
        years,
        compoundFrequency,
        inflationRate,
        adjustForInflation,
    ]);

    // --- HANDLERS ---
    const handleReset = () => {
        setCurrency("USD");
        setInitialInvestment(10000);
        setMonthlyContribution(500);
        setAnnualRate(7);
        setYears(10);
        setCompoundFrequency(12);
        setInflationRate(2.5);
        setAdjustForInflation(false);
    };

    const handleCopySummary = () => {
        const summaryText = `Compound Growth Summary (TwisterTools):
----------------------------------------
Initial Principal: ${currencySymbol}${initialInvestment.toLocaleString()}
Monthly Contribution: ${currencySymbol}${monthlyContribution.toLocaleString()}
Nominal Interest Rate: ${annualRate}%
Effective APY: ${calculationResults.apy.toFixed(2)}%
Compounding Frequency: ${compoundFrequency === 365
                ? "Daily"
                : compoundFrequency === 12
                    ? "Monthly"
                    : compoundFrequency === 4
                        ? "Quarterly"
                        : "Annually"
            }
Horizon: ${years} Years
Inflation Adjusted: ${adjustForInflation ? `${inflationRate}%` : "No"}
----------------------------------------
Total Principal Deposited: ${currencySymbol}${Math.round(
                calculationResults.totalDeposited
            ).toLocaleString()}
Total Compound Interest Earned: ${currencySymbol}${Math.round(
                calculationResults.totalInterest
            ).toLocaleString()}
Final Portfolio Value: ${currencySymbol}${Math.round(
                calculationResults.futureValue
            ).toLocaleString()}
----------------------------------------
Calculated at twistertools.com/tools/calculators/compound-interest-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadCSV = () => {
        const headers = [
            "Year",
            "Starting Balance",
            "Annual Contributions",
            "Interest Earned",
            "Ending Balance",
            "Cumulative Contributions",
            "Cumulative Interest",
        ];
        const rows = calculationResults.schedule.map((row) => [
            row.year,
            row.startingBalance,
            row.contributions,
            row.interestEarned,
            row.endingBalance,
            row.totalContributions,
            row.totalInterest,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `compound_interest_schedule_${years}yrs.csv`
        );
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
                "name": "Compound Interest & Capital Growth Calculator",
                "url": "https://twistertools.com/tools/calculators/compound-interest-calculator",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "description": "Simulate exponential capital accumulation with variable compounding frequencies, continuous yield calculations, inflation-adjustments, and downloadable schedule reports.",
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
                        "name": "What is the key difference between Nominal Interest Rate (APR) and Effective Annual Yield (APY)?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Nominal Interest Rate (APR) represents the stated annual return without taking compounding into account. Effective Annual Yield (APY) includes the effect of interest compounding over the course of a year. Because interest earns interest, APY is always higher than nominal APR when compounding happens more than once per year.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "How does daily compounding compare to monthly compounding?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Daily compounding calculates and adds earned interest to your balance every single day (365 times per year), whereas monthly compounding does so 12 times per year. Daily compounding results in a slightly higher effective annual yield because your capital base expands marginally faster.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "How does tax drag affect long-term compound growth?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Tax drag occurs when annual gains or interest payments are taxed each year in taxable accounts, reducing the total balance that remains to compound in subsequent years. Utilizing tax-advantaged accounts like IRAs or 401(k)s eliminates annual tax drag, enabling full exponential acceleration.",
                        },
                    },
                    {
                        "@type": "Question",
                        "name": "What is continuous compounding?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Continuous compounding is the theoretical mathematical limit where interest is compounded infinitely many times per period (represented by Euler's constant, 'e'). While rare in standard retail bank accounts, it serves as an essential baseline in modern derivative pricing and advanced quantitative finance.",
                        },
                    },
                ],
            },
        ],
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden font-sans antialiased text-slate-900">
            {/* JSON-LD Injection */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
            />

            {/* 50/50 WORKSPACE GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* LEFT PANEL: CONTROLS & INPUTS */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>Yield Parameters</span>
                        </h2>
                        <button
                            onClick={handleReset}
                            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-350 rounded-lg transition-all border border-slate-200 dark:border-slate-700"
                            title="Reset to Default Values"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                        </button>
                    </div>

                    {/* Currency Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Currency
                        </label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="CAD/AUD">CAD/AUD ($)</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {/* Initial Investment */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Initial Principal Balance ({currencySymbol})
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                    {currencySymbol}
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={initialInvestment === 0 ? "" : initialInvestment}
                                    onChange={(e) => handleNumberInput(e, (val) => setInitialInvestment(Math.max(0, val)))}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Monthly Contribution */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Monthly Contribution Deposit ({currencySymbol})
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                                    {currencySymbol}
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={monthlyContribution === 0 ? "" : monthlyContribution}
                                    onChange={(e) => handleNumberInput(e, (val) => setMonthlyContribution(Math.max(0, val)))}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Annual Return Rate & Duration Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Nominal Rate / APR (%)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Percent className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={annualRate === 0 ? "" : annualRate}
                                        onChange={(e) => handleNumberInput(e, (val) => setAnnualRate(Math.max(0, val)))}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Compounding Horizon (Yrs)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={years === 0 ? "" : years}
                                        onChange={(e) => handleNumberInput(e, (val) => setYears(val === 0 ? 0 : Math.max(1, Math.min(100, val))))}
                                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Compound Frequency Selector */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Compounding Frequency Interval
                            </label>
                            <select
                                value={compoundFrequency}
                                onChange={(e) => setCompoundFrequency(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                            >
                                <option value={365}>Daily Compounding (365/yr)</option>
                                <option value={12}>Monthly Compounding (12/yr)</option>
                                <option value={4}>Quarterly Compounding (4/yr)</option>
                                <option value={1}>Annual Compounding (1/yr)</option>
                            </select>
                        </div>

                        {/* Inflation Toggle & Rate */}
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Subtract Annual Inflation Rate
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setAdjustForInflation(!adjustForInflation)}
                                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${adjustForInflation ? "bg-indigo-600" : "bg-slate-200"
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${adjustForInflation ? "translate-x-5" : "translate-x-0"
                                            }`}
                                    />
                                </button>
                            </div>

                            {adjustForInflation && (
                                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center space-x-3">
                                    <div className="flex-grow">
                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                            Expected Annual Inflation Rate (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            step="0.1"
                                            value={inflationRate === 0 ? "" : inflationRate}
                                            onChange={(e) => handleNumberInput(e, setInflationRate)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: DISPLAY & BREAKDOWN */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    {/* Header Summary Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Accrued Balance
                            </span>
                            <span className="text-lg md:text-xl font-black text-indigo-600 tracking-tight">
                                {currencySymbol}{Math.round(calculationResults.futureValue).toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Total Principal
                            </span>
                            <span className="text-sm md:text-base font-bold text-slate-700">
                                {currencySymbol}{Math.round(calculationResults.totalDeposited).toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Compound Yield
                            </span>
                            <span className="text-sm md:text-base font-bold text-emerald-600">
                                {currencySymbol}{Math.round(calculationResults.totalInterest).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Visual Bar Indicator */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Deposited Principal: {calculationResults.principalPercentage.toFixed(1)}%</span>
                            <span>Compound Yield: {calculationResults.interestPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                                className="bg-slate-700 h-full transition-all duration-500"
                                style={{ width: `${calculationResults.principalPercentage}%` }}
                            />
                            <div
                                className="bg-indigo-600 h-full transition-all duration-500"
                                style={{ width: `${calculationResults.interestPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* View Toggle Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setActiveTab("visual")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "visual"
                                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                    : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Yield Summary</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("table")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "table"
                                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                    : "text-slate-500 hover:bg-slate-100"
                                    }`}
                            >
                                <List className="w-3.5 h-3.5" />
                                <span>Annual Schedule</span>
                            </button>
                        </div>

                        <div className="flex space-x-2">
                            <button
                                onClick={handleCopySummary}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Copy Calculation Summary"
                            >
                                {copied ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleDownloadCSV}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                                title="Download CSV Schedule"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* TAB CONTENT: VISUAL METRICS */}
                    {activeTab === "visual" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 flex items-start space-x-3">
                                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                        Effective Annual Yield (APY): {calculationResults.apy.toFixed(2)}%
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Due to compounding {compoundFrequency} times per year, your nominal {annualRate}% rate behaves like an effective annual return of{" "}
                                        <strong className="text-indigo-600">
                                            {calculationResults.apy.toFixed(2)}% APY
                                        </strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 text-xs">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                                    <span className="text-slate-400 font-medium">Growth Factor</span>
                                    <div className="text-slate-700 font-bold mt-0.5">
                                        {(
                                            calculationResults.futureValue /
                                            (calculationResults.totalDeposited || 1)
                                        ).toFixed(2)}x principal
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                                    <span className="text-slate-400 font-medium">Doubling Benchmark</span>
                                    <div className="text-slate-700 font-bold mt-0.5">
                                        ~{(72 / (calculationResults.apy || 1)).toFixed(1)} years (Rule of 72)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: SCHEDULE TABLE */}
                    {activeTab === "table" && (
                        <div className="overflow-x-auto max-h-[260px] overflow-y-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-2.5">Year</th>
                                        <th className="p-2.5">Cumulative Principal</th>
                                        <th className="p-2.5">Annual Interest</th>
                                        <th className="p-2.5">Ending Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {calculationResults.schedule.map((row) => (
                                        <tr key={row.year} className="hover:bg-slate-50">
                                            <td className="p-2.5 font-bold text-slate-800">Yr {row.year}</td>
                                            <td className="p-2.5">{currencySymbol}{row.totalContributions.toLocaleString()}</td>
                                            <td className="p-2.5 text-emerald-600">+{currencySymbol}{row.interestEarned.toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{row.endingBalance.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                </p>
            </div>

            {/* BELOW-THE-FOLD CONTENT */}
            <div className="space-y-6">

                {/* CARD 1: DEFINITIONS & MATHEMATICAL FOUNDATION */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mechanics of Capital Compounding: Definitions & Fundamentals
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Compound interest</strong> represents the process where earned returns are continuously added back to the starting principal, allowing subsequent interest to be calculated on both the original cash deposit and accumulated yields from prior periods. This fundamental financial mechanism converts linear saving into exponential wealth expansion over multi-year horizons.
                    </p>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike simple interest—which remains static because interest yields are distributed out of the account—compounding reinvests every dollar of earnings. Over time, the proportion of annual portfolio growth generated by interest rapidly eclipses the out-of-pocket contributions made by the investor.
                    </p>

                    <div className="p-5 bg-slate-900 text-white rounded-xl space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                            <Calculator className="w-4 h-4" /> Capital Accumulation Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            The mathematical modeling engine behind discrete compounding with monthly contributions uses the combined formula:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs md:text-sm text-indigo-300 border border-slate-800 overflow-x-auto">
                            A = P × (1 + r / n)^(n × t) + PMT × [ ((1 + r / n)^(n × t) - 1) / (r / n) ]
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                            <div><strong>A:</strong> Total Future Balance</div>
                            <div><strong>P:</strong> Starting Capital Principal</div>
                            <div><strong>PMT:</strong> Monthly Deposit Amount</div>
                            <div><strong>r:</strong> Stated Nominal Rate (APR)</div>
                            <div><strong>n:</strong> Compounding Intervals / Yr</div>
                            <div><strong>t:</strong> Horizon in Years</div>
                        </div>
                    </div>
                </div>

                {/* CARD 2: APY VS APR TABLE & COMPILATION */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Scale className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Annual Percentage Rate (APR) vs. Effective Annual Yield (APY)
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Financial institutions frequently quote both APR (nominal interest rate) and APY (effective yield). The difference stems entirely from the compounding frequency. The table below illustrates how a stated <strong>8.00% nominal rate (APR)</strong> transforms across different compounding frequencies on a static <strong>$25,000 balance over 15 years</strong> with zero extra deposits:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Compounding Schedule</th>
                                    <th className="p-3">Intervals / Year (n)</th>
                                    <th className="p-3">Effective Yield (APY)</th>
                                    <th className="p-3">15-Year Ending Balance</th>
                                    <th className="p-3">Net Gain vs. Annual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Annually</td>
                                    <td className="p-3">1</td>
                                    <td className="p-3">8.000%</td>
                                    <td className="p-3 font-bold text-slate-900">$79,304</td>
                                    <td className="p-3 text-slate-400">$0 (Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Quarterly</td>
                                    <td className="p-3">4</td>
                                    <td className="p-3">8.243%</td>
                                    <td className="p-3 font-bold text-slate-900">$82,025</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$2,721</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly</td>
                                    <td className="p-3">12</td>
                                    <td className="p-3">8.300%</td>
                                    <td className="p-3 font-bold text-slate-900">$82,672</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$3,368</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Daily</td>
                                    <td className="p-3 font-bold text-slate-900">365</td>
                                    <td className="p-3 font-bold text-indigo-700">8.328%</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$82,988</td>
                                    <td className="p-3 text-emerald-600 font-bold">+$3,684</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CARD 3: REAL-WORLD TAX DRAG & INFLATION ANALYSIS */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Flame className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Friction Factors: Inflation & Annual Tax Drag
                        </h2>
                    </div>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In unadjusted theoretical projections, growth curves look extraordinarily steep. However, real-world investors must account for two primary friction factors that suppress compounding momentum:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                                <TrendingDown className="w-4 h-4 text-amber-600" />
                                <span>Purchasing Power Inflation</span>
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Inflation steadily reduces what a dollar can buy. If an account yields 7.0% nominal return while inflation averages 2.5%, the real purchasing power of the account expands at approximately 4.39% per year.
                            </p>
                        </div>

                        <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                                <Coins className="w-4 h-4 text-rose-600" />
                                <span>Annual Tax Drag</span>
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                In standard taxable brokerage accounts, interest income and realized dividend yields are taxed annually. Paying 24% annual tax on interest distributions reduces the effective compound rate, emphasizing the value of tax-sheltered accounts.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 4: FAQS */}
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
                                What is the key difference between Nominal Interest Rate (APR) and Effective Annual Yield (APY)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Nominal Interest Rate (APR) represents the stated annual return without taking compounding into account. Effective Annual Yield (APY) includes the effect of interest compounding over the course of a year. Because interest earns interest, APY is always higher than nominal APR when compounding happens more than once per year.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                How does daily compounding compare to monthly compounding?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Daily compounding calculates and adds earned interest to your balance every single day (365 times per year), whereas monthly compounding does so 12 times per year. Daily compounding results in a slightly higher effective annual yield because your capital base expands marginally faster.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                How does tax drag affect long-term compound growth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Tax drag occurs when annual gains or interest payments are taxed each year in taxable accounts, reducing the total balance that remains to compound in subsequent years. Utilizing tax-advantaged accounts like IRAs or 401(k)s eliminates annual tax drag, enabling full exponential acceleration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-800 text-base mb-1">
                                What is continuous compounding?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Continuous compounding is the theoretical mathematical limit where interest is compounded infinitely many times per period (represented by Euler's constant, 'e'). While rare in standard retail bank accounts, it serves as an essential baseline in modern derivative pricing and advanced quantitative finance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CARD 5: FINANCIAL DISCLAIMER */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-4 p-4 sm:p-6">
                    <ShieldAlert className="w-6 h-6 text-slate-400 flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Financial & Mathematical Disclaimer
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, or investment advice. Results are estimates based on user inputs and assumed parameters.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}