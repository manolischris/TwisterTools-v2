"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Calculator,
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
    Lightbulb,
    AlertTriangle,
    TrendingDown,
    Scale,
    Flame,
    ArrowRightLeft,
    CheckCircle2,
    Layers,
    PieChart,
    Zap,
    CreditCard,
    Target,
    PiggyBank
} from "lucide-react";

interface ScheduleRow {
    year: number;
    startingBalance: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
    totalInterest: number;
    totalPrincipal: number;
}

interface Preset {
    id: string;
    label: string;
    balance: number;
    rate: number;
    years: number;
    extra: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "credit-card-payoff", label: "Credit Card Debt", balance: 15000, rate: 21.5, years: 5, extra: 150, tag: "High Interest" },
    { id: "auto-loan-accelerator", label: "Auto Loan Payoff", balance: 28000, rate: 7.2, years: 5, extra: 100, tag: "Vehicle Debt" },
    { id: "personal-loan-snowball", label: "Personal Loan", balance: 45000, rate: 11.5, years: 7, extra: 250, tag: "Accelerated" },
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

export default function LoanPayoffCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [currentBalance, setCurrentBalance] = useState<number>(35000);
    const [annualRate, setAnnualRate] = useState<number>(9.5);
    const [remainingYears, setRemainingYears] = useState<number>(5);
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(150);
    const [oneTimeLumpSum, setOneTimeLumpSum] = useState<number>(0);
    const [lumpSumMonth, setLumpSumMonth] = useState<number>(1);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];

    // Math & Amortization Schedule Calculation
    const calculationResults = useMemo(() => {
        const principal = Math.max(0, currentBalance);
        const monthlyRate = annualRate / 100 / 12;
        const totalContractMonths = remainingYears * 12;

        let baseMonthlyPayment = 0;
        if (monthlyRate > 0 && totalContractMonths > 0) {
            baseMonthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalContractMonths)) / (Math.pow(1 + monthlyRate, totalContractMonths) - 1);
        } else if (totalContractMonths > 0) {
            baseMonthlyPayment = principal / totalContractMonths;
        }

        // Standard Schedule (No Extra Payments)
        let standardBalance = principal;
        let standardTotalInterest = 0;
        let standardMonths = 0;

        for (let month = 1; month <= totalContractMonths && standardBalance > 0; month++) {
            standardMonths++;
            const interest = standardBalance * monthlyRate;
            let pPayment = baseMonthlyPayment - interest;
            if (standardBalance - pPayment < 0) {
                pPayment = standardBalance;
            }
            standardBalance -= pPayment;
            standardTotalInterest += interest;
        }

        // Accelerated Schedule (With Extra Monthly & Lump Sum)
        let acceleratedBalance = principal;
        let acceleratedTotalInterest = 0;
        let acceleratedMonths = 0;
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;

        const schedule: ScheduleRow[] = [];
        let yearlyStartingBalance = principal;
        let yearlyPrincipalPaid = 0;
        let yearlyInterestPaid = 0;

        for (let month = 1; month <= 600 && acceleratedBalance > 0; month++) {
            acceleratedMonths++;
            const interestForMonth = acceleratedBalance * monthlyRate;

            let extraThisMonth = extraMonthlyPayment;
            if (month === lumpSumMonth && oneTimeLumpSum > 0) {
                extraThisMonth += oneTimeLumpSum;
            }

            let totalPaymentForMonth = baseMonthlyPayment + extraThisMonth;
            let principalForMonth = totalPaymentForMonth - interestForMonth;

            if (acceleratedBalance - principalForMonth < 0) {
                principalForMonth = acceleratedBalance;
            }

            acceleratedBalance -= principalForMonth;
            acceleratedTotalInterest += interestForMonth;
            cumulativeInterest += interestForMonth;
            cumulativePrincipal += principalForMonth;

            yearlyInterestPaid += interestForMonth;
            yearlyPrincipalPaid += principalForMonth;

            if (month % 12 === 0 || acceleratedBalance <= 0) {
                const yearNum = Math.ceil(month / 12);
                schedule.push({
                    year: yearNum,
                    startingBalance: yearlyStartingBalance,
                    principalPaid: yearlyPrincipalPaid,
                    interestPaid: yearlyInterestPaid,
                    endingBalance: Math.max(0, acceleratedBalance),
                    totalInterest: cumulativeInterest,
                    totalPrincipal: cumulativePrincipal,
                });

                yearlyStartingBalance = acceleratedBalance;
                yearlyPrincipalPaid = 0;
                yearlyInterestPaid = 0;
            }
        }

        const interestSavings = Math.max(0, standardTotalInterest - acceleratedTotalInterest);
        const standardPayoffYears = standardMonths / 12;
        const acceleratedPayoffYears = acceleratedMonths / 12;
        const timeSavedYears = Math.max(0, standardPayoffYears - acceleratedPayoffYears);
        const totalCostOfLoan = principal + acceleratedTotalInterest;

        return {
            principal,
            baseMonthlyPayment,
            actualMonthlyPayment: baseMonthlyPayment + extraMonthlyPayment,
            standardTotalInterest,
            acceleratedTotalInterest,
            interestSavings,
            standardPayoffYears,
            acceleratedPayoffYears,
            timeSavedYears,
            totalCostOfLoan,
            schedule,
            interestRatio: totalCostOfLoan > 0 ? (acceleratedTotalInterest / totalCostOfLoan) * 100 : 0,
            principalRatio: totalCostOfLoan > 0 ? (principal / totalCostOfLoan) * 100 : 0,
        };
    }, [currentBalance, annualRate, remainingYears, extraMonthlyPayment, oneTimeLumpSum, lumpSumMonth]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setCurrentBalance(preset.balance);
        setAnnualRate(preset.rate);
        setRemainingYears(preset.years);
        setExtraMonthlyPayment(preset.extra);
        setOneTimeLumpSum(0);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setCurrentBalance(35000);
        setAnnualRate(9.5);
        setRemainingYears(5);
        setExtraMonthlyPayment(150);
        setOneTimeLumpSum(0);
        setLumpSumMonth(1);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Loan Payoff & Debt Reduction Summary (TwisterTools):
----------------------------------------
Current Loan Balance: ${currencySymbol}${currentBalance.toLocaleString()}
Interest Rate: ${annualRate}%
Contractual Remaining Term: ${remainingYears} Years
----------------------------------------
Base Monthly Payment: ${currencySymbol}${Math.round(calculationResults.baseMonthlyPayment).toLocaleString()}
Extra Monthly Payment: ${currencySymbol}${extraMonthlyPayment.toLocaleString()}
Accelerated Payoff Time: ${calculationResults.acceleratedPayoffYears.toFixed(1)} Years
----------------------------------------
Total Interest Paid: ${currencySymbol}${Math.round(calculationResults.acceleratedTotalInterest).toLocaleString()}
Total Interest Savings: ${currencySymbol}${Math.round(calculationResults.interestSavings).toLocaleString()}
Time Saved: ${calculationResults.timeSavedYears.toFixed(1)} Years
Calculated at twistertools.com/tools/calculators/loan-payoff-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Starting Balance", "Principal Paid", "Interest Paid", "Ending Balance", "Total Principal", "Total Interest"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.year,
                    row.startingBalance.toFixed(2),
                    row.principalPaid.toFixed(2),
                    row.interestPaid.toFixed(2),
                    row.endingBalance.toFixed(2),
                    row.totalPrincipal.toFixed(2),
                    row.totalInterest.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `loan_payoff_schedule_${calculationResults.acceleratedPayoffYears.toFixed(1)}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schema for SEO & GEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Loan Payoff & Debt Reduction Calculator",
        "url": "https://twistertools.com/tools/calculators/loan-payoff-calculator",
        "description": "Calculate debt payoff timelines, extra monthly contribution savings, and lump-sum impact to eliminate loans early with interactive amortization schedules.",
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
                "name": "How does adding extra monthly payments shorten a loan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Extra monthly payments are applied directly toward the principal debt balance. Lowering the balance earlier reduces the amount of interest accrued in subsequent months, compounding your payoff speed."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between debt avalanche and debt snowball strategies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The debt avalanche strategy prioritizes paying off debts with the highest interest rates first to minimize total interest cost. The debt snowball strategy focuses on paying off the smallest balances first to build psychological momentum."
                }
            },
            {
                "@type": "Question",
                "name": "Are there prepayment penalties for paying off loans early?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Some lenders charge prepayment penalties if you pay off personal, auto, or mortgage debt ahead of schedule. Always review your loan terms or contact your lender to confirm prepayment clauses before making large lump-sum payments."
                }
            },
            {
                "@type": "Question",
                "name": "How does a lump-sum payment affect my loan payoff schedule?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A one-time lump-sum payment instantly knocks down the core debt balance, permanently reducing future monthly interest accrual and immediately slashing months or years off the remaining payoff timeline."
                }
            },
            {
                "@type": "Question",
                "name": "Is it better to make extra principal payments monthly or as an annual lump sum?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Making monthly extra payments is generally more efficient because interest compounds monthly on the remaining balance. Paying earlier reduces the principal balance for every subsequent month, yielding higher cumulative interest savings compared to delaying until an annual lump sum."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use this calculator for credit card debt payoff?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, by entering your total credit card balance, average APR interest rate, and a target payoff timeframe, you can calculate the exact monthly payment required and evaluate how additional monthly contributions accelerate payoff."
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
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                Loan & Extra Payment Inputs
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
                            {/* Outstanding Loan Balance */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Current Loan Balance
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{currentBalance.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={currentBalance === 0 ? "" : currentBalance}
                                        onChange={(e) => { handleNumberInput(e, (val) => setCurrentBalance(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Rate & Term */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Interest Rate
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="0.1"
                                            value={annualRate === 0 ? "" : annualRate}
                                            onChange={(e) => { handleNumberInput(e, (val) => setAnnualRate(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Remaining Term
                                    </label>
                                    <select
                                        value={remainingYears}
                                        onChange={(e) => {
                                            setRemainingYears(Number(e.target.value));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-white"
                                    >
                                        <option value={1}>1 Year</option>
                                        <option value={2}>2 Years</option>
                                        <option value={3}>3 Years</option>
                                        <option value={5}>5 Years</option>
                                        <option value={7}>7 Years</option>
                                        <option value={10}>10 Years</option>
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                    </select>
                                </div>
                            </div>

                            {/* Extra Payments Options */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Accelerated Payoff Options
                                </h3>

                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                                        <TrendingDown className="w-3.5 h-3.5 text-indigo-500" /> Extra Monthly Contribution
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="25"
                                            value={extraMonthlyPayment === 0 ? "" : extraMonthlyPayment}
                                            onChange={(e) => handleNumberInput(e, (val) => setExtraMonthlyPayment(Math.max(0, val)))}
                                            placeholder="0"
                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            One-Time Lump Sum
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500"
                                                value={oneTimeLumpSum === 0 ? "" : oneTimeLumpSum}
                                                onChange={(e) => handleNumberInput(e, (val) => setOneTimeLumpSum(Math.max(0, val)))}
                                                placeholder="0"
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Apply in Month #
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="360"
                                            value={lumpSumMonth === 0 ? "" : lumpSumMonth}
                                            onChange={(e) => handleNumberInput(e, (val) => setLumpSumMonth(val === 0 ? 0 : Math.max(1, val)))}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Common Debt Presets
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

                {/* Right Workspace Panel: Results, Visualizations & Amortization */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Reduction & Payoff Impact
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
                                    Amortization Table
                                </button>
                            </div>
                        </div>

                        {/* Key Savings Highlight Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Interest Savings</p>
                                <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.interestSavings).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-800 font-medium mt-1">
                                    Total Interest: {currencySymbol}{Math.round(calculationResults.acceleratedTotalInterest).toLocaleString()}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Time Saved</p>
                                <p className="text-3xl font-extrabold text-indigo-700 mt-1">
                                    {calculationResults.timeSavedYears.toFixed(1)} <span className="text-base font-semibold">Yrs</span>
                                </p>
                                <p className="text-[11px] text-indigo-800 font-medium mt-1">
                                    Debt Free In: {calculationResults.acceleratedPayoffYears.toFixed(1)} Years
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-6">
                                {/* Visual Ratio Bar */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Lifetime Cost Breakdown (Principal vs Interest)
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                                Principal: {currencySymbol}{Math.round(calculationResults.principal).toLocaleString()} ({calculationResults.principalRatio.toFixed(1)}%)
                                            </span>
                                            <span className="flex items-center gap-1.5 text-indigo-600">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                                Interest: {currencySymbol}{Math.round(calculationResults.acceleratedTotalInterest).toLocaleString()} ({calculationResults.interestRatio.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                className="bg-slate-800 h-full transition-all duration-500"
                                                style={{ width: `${calculationResults.principalRatio}%` }}
                                            />
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-500"
                                                style={{ width: `${calculationResults.interestRatio}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Breakdown Table */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Standard vs. Accelerated Payoff
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                            <span className="font-semibold text-slate-700">Contractual Monthly Payment</span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.baseMonthlyPayment).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                                            <span className="font-semibold text-indigo-900">Total Monthly Payment</span>
                                            <span className="font-bold text-indigo-700">{currencySymbol}{Math.round(calculationResults.actualMonthlyPayment).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                            <span className="font-semibold text-slate-700">Standard Interest Paid</span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.standardTotalInterest).toLocaleString()}</span>
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
                                            <th className="p-2.5">Principal Paid</th>
                                            <th className="p-2.5">Interest Paid</th>
                                            <th className="p-2.5">Ending Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Year {row.year}</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.principalPaid).toLocaleString()}</td>
                                                <td className="p-2.5 text-indigo-600 font-semibold">{currencySymbol}{Math.round(row.interestPaid).toLocaleString()}</td>
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
                            Client-side calculation engine
                        </span>
                        <span>Payoff in {calculationResults.acceleratedPayoffYears.toFixed(1)} yrs</span>
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

                {/* Card 1: Core Mechanics & Mathematical Amortization Formula */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Loan Amortization Mechanics & The Power of Principal Reduction
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When you take out an amortized installment loan—such as a personal loan, auto financing, or mortgage—every required monthly payment is partitioned into two distinct components: the interest fee charged by the lender and the principal reduction that lowers your total balance. Early in the loan life cycle, a substantial portion of your fixed monthly payment goes toward satisfying interest charges.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        By making <strong>extra principal contributions</strong>, 100% of the additional funds directly reduce your remaining balance. Because monthly interest is calculated as a direct percentage of the outstanding principal balance, reducing that balance early prevents compounding interest from accumulating in future payment cycles.
                    </p>

                    {/* Mathematical Formula Display */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Amortized Monthly Payment Calculation Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            Financial institutions use the standard annuity equation to calculate contractual monthly debt service:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            {"$$PMT = P \\times \\frac{r(1 + r) ^ n}{(1 + r) ^ n - 1}$$"}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>PMT:</strong> Contractual Monthly Payment</div>
                            <div><strong>P:</strong> Outstanding Principal Balance</div>
                            <div><strong>r:</strong> Monthly Interest Rate (Annual Rate ÷ 12)</div>
                            <div><strong>n:</strong> Total Number of Remaining Months</div>
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
                            Step-by-Step Worked Case Study: $35,000 Personal Debt Reduction
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To demonstrate how small monthly additions translate into thousands in interest savings and years saved, examine the baseline scenario below compared against an accelerated strategy adding <strong>$150/month</strong>:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Baseline Debt Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Starting Loan Balance:</strong> $35,000</li>
                            <li><strong>Annual Interest Rate (APR):</strong> 9.5%</li>
                            <li><strong>Contractual Term:</strong> 5 Years (60 Months)</li>
                            <li><strong>Contractual Base Monthly Payment:</strong> $735.00</li>
                        </ul>
                    </div>

                    {/* Breakdown Milestone Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Strategy Metric</th>
                                    <th className="p-3">Standard Schedule ($0 Extra)</th>
                                    <th className="p-3">Accelerated (+ $150 / Mo)</th>
                                    <th className="p-3">Net Advantage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Total Monthly Payment</td>
                                    <td className="p-3">$735.00</td>
                                    <td className="p-3 font-bold text-indigo-600">$885.00</td>
                                    <td className="p-3 text-slate-600">+$150.00 / month</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Total Payoff Time</td>
                                    <td className="p-3">60 Months (5.0 Yrs)</td>
                                    <td className="p-3 font-bold text-emerald-600">48 Months (4.0 Yrs)</td>
                                    <td className="p-3 font-bold text-emerald-600">1.0 Year Saved!</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Total Interest Paid</td>
                                    <td className="p-3 text-slate-900">$9,091.00</td>
                                    <td className="p-3 font-bold text-emerald-600">$7,132.00</td>
                                    <td className="p-3 font-bold text-emerald-600">$1,959.00 Saved</td>
                                </tr>
                                <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-900">Total Out-of-Pocket Cost</td>
                                    <td className="p-3 font-bold text-slate-900">$44,091.00</td>
                                    <td className="p-3 font-bold text-emerald-900">$42,132.00</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$1,959 Net Savings</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Debt Strategy Comparison (Avalanche vs Snowball) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparing Debt Elimination Strategies: Avalanche vs. Snowball
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When managing multiple personal loans, auto debts, or revolving balances, choosing an systematic acceleration framework ensures structured progress:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Flame className="w-5 h-5" /> The Debt Avalanche Framework
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Under the Debt Avalanche method, you order your debts by <strong>interest rate (APR) from highest to lowest</strong>. You pay minimum balances on all accounts while deploying all remaining surplus cash flow to the loan charging the highest interest rate.
                            </p>
                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                                <li><strong>Key Benefit:</strong> Mathematically minimizes total interest paid across all liabilities.</li>
                                <li><strong>Best Suited For:</strong> Financial optimizers seeking maximum financial efficiency.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Sparkles className="w-5 h-5" /> The Debt Snowball Framework
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Under the Debt Snowball method, you order your debts by <strong>outstanding principal balance from smallest to largest</strong>, ignoring interest rates. Surplus funds are directed to wipe out the smallest balance completely.
                            </p>
                            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                                <li><strong>Key Benefit:</strong> Provides rapid psychological wins by quickly reducing total account count.</li>
                                <li><strong>Best Suited For:</strong> Borrowers who benefit from behavioral reinforcement.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                How does adding extra monthly payments shorten a loan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Extra monthly payments are applied directly toward the principal debt balance. Lowering the balance earlier reduces the amount of interest accrued in subsequent months, compounding your payoff speed.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between debt avalanche and debt snowball strategies?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The debt avalanche strategy prioritizes paying off debts with the highest interest rates first to minimize total interest cost. The debt snowball strategy focuses on paying off the smallest balances first to build psychological momentum.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are there prepayment penalties for paying off loans early?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Some lenders charge prepayment penalties if you pay off personal, auto, or mortgage debt ahead of schedule. Always review your loan terms or contact your lender to confirm prepayment clauses before making large lump-sum payments.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does a lump-sum payment affect my loan payoff schedule?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A one-time lump-sum payment instantly knocks down the core debt balance, permanently reducing future monthly interest accrual and immediately slashing months or years off the remaining payoff timeline.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is it better to make extra principal payments monthly or as an annual lump sum?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Making monthly extra payments is generally more efficient because interest compounds monthly on the remaining balance. Paying earlier reduces the principal balance for every subsequent month, yielding higher cumulative interest savings compared to delaying until an annual lump sum.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use this calculator for credit card debt payoff?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, by entering your total credit card balance, average APR interest rate, and a target payoff timeframe, you can calculate the exact monthly payment required and evaluate how additional monthly contributions accelerate payoff.
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