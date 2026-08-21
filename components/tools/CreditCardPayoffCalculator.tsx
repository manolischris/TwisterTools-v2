"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    CreditCard,
    DollarSign,
    Percent,
    Calendar,
    RefreshCw,
    Download,
    Copy,
    Check,
    Layers,
    BarChart3,
    Sparkles,
    ShieldCheck,
    AlertTriangle,
    Clock,
    Flame,
    Calculator,
    TrendingDown,
    HelpCircle,
    BookOpen,
    Scale,
    PieChart,
    ArrowRightCircle,
    Zap,
    CheckCircle2,
    XCircle,
    Info,
    Compass,
    FileSpreadsheet,
    Building2,
    TrendingUp,
    Receipt,
    Coins,
    Timer,
    Shuffle,
    ArrowDownRight,
    Milestone
} from "lucide-react";

interface ScheduleRow {
    month: number;
    startingBalance: number;
    payment: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
    cumulativeInterest: number;
    cumulativePaid: number;
}

interface PayoffPlan {
    months: number;
    totalInterest: number;
    totalPaid: number;
    schedule: ScheduleRow[];
    isNeverEnding?: boolean;
}

interface Preset {
    id: string;
    label: string;
    balance: number;
    rate: number;
    minPercent: number;
    minFloor: number;
    extraMonthly: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "avg-card",
        label: "US Average Balance",
        balance: 6500,
        rate: 21.5,
        minPercent: 2,
        minFloor: 35,
        extraMonthly: 100,
        tag: "21.5% APR"
    },
    {
        id: "high-balance",
        label: "High Balance Debt",
        balance: 15000,
        rate: 24.99,
        minPercent: 2.5,
        minFloor: 40,
        extraMonthly: 250,
        tag: "24.99% APR"
    },
    {
        id: "low-rate",
        label: "Consolidated Card",
        balance: 4000,
        rate: 13.99,
        minPercent: 1.5,
        minFloor: 25,
        extraMonthly: 50,
        tag: "13.99% APR"
    },
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD/AUD" | "INR";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    "CAD/AUD": "$",
    INR: "₹",
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

export default function CreditCardPayoffCalculator() {
    // Core Financial States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [balance, setBalance] = useState<number>(6500);
    const [apr, setApr] = useState<number>(21.99);
    const [minPaymentPercent, setMinPaymentPercent] = useState<number>(2.0);
    const [minPaymentFloor, setMinPaymentFloor] = useState<number>(35);
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(100);
    const [fixedMonthlyBudget, setFixedMonthlyBudget] = useState<number>(0);

    // UI View States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"comparison" | "table">("comparison");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Engine: Calculate Dynamic Minimum Payment Schedule & Fixed Payment Schedule
    const calculationResults = useMemo(() => {
        const monthlyRate = (apr / 100) / 12;
        const maxMonthsCap = 1200; // 100 years max loop ceiling

        // 1. Dynamic Minimum Payment Only
        const computeMinOnly = (): PayoffPlan => {
            let currBal = balance;
            let totalInterest = 0;
            let totalPaid = 0;
            const schedule: ScheduleRow[] = [];
            let month = 0;

            while (currBal > 0.01 && month < maxMonthsCap) {
                month++;
                const startingBal = currBal;
                const monthlyInterest = startingBal * monthlyRate;

                let calculatedMin = Math.max(
                    startingBal * (minPaymentPercent / 100),
                    monthlyInterest + startingBal * 0.01,
                    minPaymentFloor
                );

                // If calculated payment cannot even cover monthly interest, it will never pay off
                if (calculatedMin <= monthlyInterest && startingBal > minPaymentFloor) {
                    return {
                        months: Infinity,
                        totalInterest: Infinity,
                        totalPaid: Infinity,
                        schedule: [],
                        isNeverEnding: true,
                    };
                }

                let payment = Math.min(currBal + monthlyInterest, calculatedMin);
                let principal = payment - monthlyInterest;

                if (principal < 0) principal = 0;

                currBal = startingBal + monthlyInterest - payment;
                if (currBal < 0.01) currBal = 0;

                totalInterest += monthlyInterest;
                totalPaid += payment;

                schedule.push({
                    month,
                    startingBalance: startingBal,
                    payment,
                    principalPaid: principal,
                    interestPaid: monthlyInterest,
                    endingBalance: currBal,
                    cumulativeInterest: totalInterest,
                    cumulativePaid: totalPaid,
                });
            }

            return {
                months: month,
                totalInterest,
                totalPaid,
                schedule,
                isNeverEnding: month >= maxMonthsCap,
            };
        };

        // 2. Accelerated Strategy (Dynamic Minimum + Extra Fixed Monthly Addition)
        const computeAccelerated = (): PayoffPlan => {
            let currBal = balance;
            let totalInterest = 0;
            let totalPaid = 0;
            const schedule: ScheduleRow[] = [];
            let month = 0;

            while (currBal > 0.01 && month < maxMonthsCap) {
                month++;
                const startingBal = currBal;
                const monthlyInterest = startingBal * monthlyRate;

                let calculatedMin = Math.max(
                    startingBal * (minPaymentPercent / 100),
                    monthlyInterest + startingBal * 0.01,
                    minPaymentFloor
                );

                let targetPayment = calculatedMin + extraMonthlyPayment;
                let payment = Math.min(currBal + monthlyInterest, targetPayment);
                let principal = Math.max(0, payment - monthlyInterest);

                currBal = startingBal + monthlyInterest - payment;
                if (currBal < 0.01) currBal = 0;

                totalInterest += monthlyInterest;
                totalPaid += payment;

                schedule.push({
                    month,
                    startingBalance: startingBal,
                    payment,
                    principalPaid: principal,
                    interestPaid: monthlyInterest,
                    endingBalance: currBal,
                    cumulativeInterest: totalInterest,
                    cumulativePaid: totalPaid,
                });
            }

            return {
                months: month,
                totalInterest,
                totalPaid,
                schedule,
                isNeverEnding: month >= maxMonthsCap,
            };
        };

        // 3. Fixed Monthly Payment Plan (If user sets a dedicated budget)
        const computeFixedPlan = (monthlyFixed: number): PayoffPlan => {
            if (monthlyFixed <= 0) return { months: 0, totalInterest: 0, totalPaid: 0, schedule: [] };

            let currBal = balance;
            let totalInterest = 0;
            let totalPaid = 0;
            const schedule: ScheduleRow[] = [];
            let month = 0;

            const initialInterest = currBal * monthlyRate;
            if (monthlyFixed <= initialInterest) {
                return {
                    months: Infinity,
                    totalInterest: Infinity,
                    totalPaid: Infinity,
                    schedule: [],
                    isNeverEnding: true,
                };
            }

            while (currBal > 0.01 && month < maxMonthsCap) {
                month++;
                const startingBal = currBal;
                const monthlyInterest = startingBal * monthlyRate;

                let payment = Math.min(currBal + monthlyInterest, monthlyFixed);
                let principal = payment - monthlyInterest;

                currBal = startingBal + monthlyInterest - payment;
                if (currBal < 0.01) currBal = 0;

                totalInterest += monthlyInterest;
                totalPaid += payment;

                schedule.push({
                    month,
                    startingBalance: startingBal,
                    payment,
                    principalPaid: principal,
                    interestPaid: monthlyInterest,
                    endingBalance: currBal,
                    cumulativeInterest: totalInterest,
                    cumulativePaid: totalPaid,
                });
            }

            return {
                months: month,
                totalInterest,
                totalPaid,
                schedule,
                isNeverEnding: month >= maxMonthsCap,
            };
        };

        const minOnly = computeMinOnly();
        const accelerated = computeAccelerated();
        const fixedPlan = fixedMonthlyBudget > 0 ? computeFixedPlan(fixedMonthlyBudget) : null;

        const interestSaved = minOnly.totalInterest !== Infinity && accelerated.totalInterest !== Infinity
            ? Math.max(0, minOnly.totalInterest - accelerated.totalInterest)
            : 0;

        const monthsSaved = minOnly.months !== Infinity && accelerated.months !== Infinity
            ? Math.max(0, minOnly.months - accelerated.months)
            : 0;

        return {
            minOnly,
            accelerated,
            fixedPlan,
            interestSaved,
            monthsSaved,
        };
    }, [balance, apr, minPaymentPercent, minPaymentFloor, extraMonthlyPayment, fixedMonthlyBudget]);

    // Presets handler
    const applyPreset = (preset: Preset) => {
        setBalance(preset.balance);
        setApr(preset.rate);
        setMinPaymentPercent(preset.minPercent);
        setMinPaymentFloor(preset.minFloor);
        setExtraMonthlyPayment(preset.extraMonthly);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setBalance(6500);
        setApr(21.99);
        setMinPaymentPercent(2.0);
        setMinPaymentFloor(35);
        setExtraMonthlyPayment(100);
        setFixedMonthlyBudget(0);
        setActivePresetId(null);
    };

    const formatYearsMonths = (totalMonths: number) => {
        if (totalMonths === Infinity) return "Infinite (Payment too low)";
        const y = Math.floor(totalMonths / 12);
        const m = totalMonths % 12;
        if (y === 0) return `${m} mo`;
        if (m === 0) return `${y} yrs`;
        return `${y} yr ${m} mo`;
    };

    const handleCopySummary = () => {
        const minTime = formatYearsMonths(calculationResults.minOnly.months);
        const accTime = formatYearsMonths(calculationResults.accelerated.months);
        const text = `Credit Card Payoff Breakdown (TwisterTools):
----------------------------------------
Current Card Balance: ${currencySymbol}${balance.toLocaleString()}
Annual Interest APR: ${apr}%
Minimum Payment Rule: ${minPaymentPercent}% or ${currencySymbol}${minPaymentFloor} floor
Extra Monthly Contribution: ${currencySymbol}${extraMonthlyPayment}
----------------------------------------
MINIMUM PAYMENTS ONLY:
Payoff Duration: ${minTime} (${calculationResults.minOnly.months} months)
Total Interest Paid: ${currencySymbol}${Math.round(calculationResults.minOnly.totalInterest).toLocaleString()}
Total Out-of-Pocket Cost: ${currencySymbol}${Math.round(calculationResults.minOnly.totalPaid).toLocaleString()}
----------------------------------------
ACCELERATED STRATEGY (+${currencySymbol}${extraMonthlyPayment}/mo):
Payoff Duration: ${accTime} (${calculationResults.accelerated.months} months)
Total Interest Paid: ${currencySymbol}${Math.round(calculationResults.accelerated.totalInterest).toLocaleString()}
Total Out-of-Pocket Cost: ${currencySymbol}${Math.round(calculationResults.accelerated.totalPaid).toLocaleString()}
----------------------------------------
TOTAL SAVINGS WITH ACCELERATED PLAN:
Money Saved: ${currencySymbol}${Math.round(calculationResults.interestSaved).toLocaleString()}
Time Saved: ${formatYearsMonths(calculationResults.monthsSaved)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/credit-card-payoff-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = [
            "Month",
            "Starting Balance",
            "Payment",
            "Principal Paid",
            "Interest Paid",
            "Ending Balance",
            "Cumulative Interest",
            "Cumulative Total Paid"
        ];

        const targetSchedule = calculationResults.accelerated.schedule;
        const csvRows = [
            headers.join(","),
            ...targetSchedule.map((row) =>
                [
                    row.month,
                    row.startingBalance.toFixed(2),
                    row.payment.toFixed(2),
                    row.principalPaid.toFixed(2),
                    row.interestPaid.toFixed(2),
                    row.endingBalance.toFixed(2),
                    row.cumulativeInterest.toFixed(2),
                    row.cumulativePaid.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `credit_card_payoff_schedule_${balance}bal.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Comprehensive JSON-LD Schemas for Rich Snippets, SGE & Generative Engine Indexing
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Credit Card Minimum Payment & Interest Payoff Calculator",
        "url": "https://twistertools.com/tools/calculators/credit-card-payoff-calculator",
        "description": "Calculate exact credit card payoff timelines, compare minimum payment traps against accelerated debt repayment strategies, and quantify total interest savings.",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
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
                "name": "How is a credit card minimum payment calculated by issuing banks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most financial institutions use one of two primary formulas: a percentage-based method (typically 1% to 3% of the total statement balance) or a cost-plus formula (all monthly accrued interest plus 1% of the principal balance), subject to an absolute minimum floor dollar amount (usually $25 to $40)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the credit card minimum payment trap and why is it dangerous?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The minimum payment trap occurs because minimum payment requirements scale down as your debt balance decreases. Consequently, early payments go almost entirely toward compounding interest charges rather than paying down the principal loan, keeping borrowers in revolving debt for decades and multiplying total repayment costs."
                }
            },
            {
                "@type": "Question",
                "name": "How does adding $100 extra per month accelerate credit card payoff?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every dollar paid above the required minimum payment is applied directly to the principal balance. Because revolving credit card interest accrues daily on the remaining balance, reducing principal immediately slashes subsequent interest charges, shortening repayment horizons by years and saving thousands in cumulative finance fees."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between the Debt Avalanche and Debt Snowball payoff strategies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Debt Avalanche strategy allocates extra funds to the balance with the highest Annual Percentage Rate (APR) first, maximizing mathematical savings. The Debt Snowball strategy directs extra payments toward the smallest balance first to secure fast behavioral wins and reduce the number of open accounts."
                }
            },
            {
                "@type": "Question",
                "name": "How does daily compounding interest work on credit card balances?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Credit card issuers calculate interest daily by dividing the nominal APR by 365 to determine the Daily Periodic Rate (DPR). This rate is multiplied by the cardholder's Average Daily Balance (ADB) across the billing cycle, meaning interest compounds continuously if a statement balance is not paid in full before the grace period ends."
                }
            },
            {
                "@type": "Question",
                "name": "Does carrying a balance on my credit card build a better credit score?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, carrying a revolving credit card balance does not build credit. In fact, high credit utilization (revolving balances exceeding 30% of your credit limit) can significantly harm credit scores. Paying your balance in full every month avoids all interest charges while still building a strong on-time payment history."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Debt Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Credit Card Parameters
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
                                <option value="CAD/AUD">CAD/AUD ($)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                        </div>

                        <div className="space-y-5">
                            {/* Current Balance */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Current Card Balance
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{balance.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="250"
                                        value={balance === 0 ? "" : balance}
                                        onChange={(e) => handleNumberInput(e, (val) => {
                                            setBalance(Math.max(0, val));
                                            setActivePresetId(null);
                                        })}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Interest Rate APR */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Annual Percentage Rate (APR)
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">{apr}%</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0.1"
                                        max="99.9"
                                        step="0.1"
                                        value={apr === 0 ? "" : apr}
                                        onChange={(e) => handleNumberInput(e, (val) => {
                                            setApr(Math.max(0.1, val));
                                            setActivePresetId(null);
                                        })}
                                        className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                </div>
                            </div>

                            {/* Minimum Payment Formulas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Min Payment (% of Balance)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            value={minPaymentPercent === 0 ? "" : minPaymentPercent}
                                            onChange={(e) => handleNumberInput(e, (val) => {
                                                setMinPaymentPercent(Math.max(1, val));
                                                setActivePresetId(null);
                                            })}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Minimum Floor Amount ({currencySymbol})
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="10"
                                            step="5"
                                            value={minPaymentFloor === 0 ? "" : minPaymentFloor}
                                            onChange={(e) => handleNumberInput(e, (val) => {
                                                setMinPaymentFloor(Math.max(0, val));
                                                setActivePresetId(null);
                                            })}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Accelerated Extra Payment */}
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                            <Zap className="w-4 h-4 text-emerald-600" /> Extra Monthly Payment Boost
                                        </label>
                                        <span className="text-sm font-extrabold text-emerald-600">
                                            +{currencySymbol}{extraMonthlyPayment.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">
                                        Additional cash applied directly to the principal on top of your required minimum payment.
                                    </p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="25"
                                            value={extraMonthlyPayment === 0 ? "" : extraMonthlyPayment}
                                            onChange={(e) => handleNumberInput(e, (val) => {
                                                setExtraMonthlyPayment(Math.max(0, val));
                                                setActivePresetId(null);
                                            })}
                                            className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/20 text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presets Bar */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Card Scenarios
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
                            {copied ? "Copied" : "Copy Payoff Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Comparison & Amortization Data */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Payoff Comparison
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("comparison")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "comparison" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Side-by-Side
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

                        {/* Top Highlights: Savings Callouts */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5" /> Total Interest Saved
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-emerald-700 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.interestSaved).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-800 font-medium mt-1">
                                    By paying +{currencySymbol}{extraMonthlyPayment}/mo extra
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200">
                                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Time Cut Off Debt
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-indigo-700 mt-1">
                                    {formatYearsMonths(calculationResults.monthsSaved)}
                                </p>
                                <p className="text-[11px] text-indigo-800 font-medium mt-1">
                                    Accelerated freedom timeline
                                </p>
                            </div>
                        </div>

                        {/* Tab 1: Detailed Strategy Comparison */}
                        {activeTab === "comparison" ? (
                            <div className="space-y-4">
                                {/* Minimum Payments Only Card */}
                                <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                                            <Flame className="w-3.5 h-3.5" /> Minimum Payments Only (The Trap)
                                        </span>
                                        <span className="text-xs font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                                            {formatYearsMonths(calculationResults.minOnly.months)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Total Interest:</span>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {calculationResults.minOnly.isNeverEnding
                                                    ? "Infinite"
                                                    : `${currencySymbol}${Math.round(calculationResults.minOnly.totalInterest).toLocaleString()}`}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Total Out-of-Pocket:</span>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {calculationResults.minOnly.isNeverEnding
                                                    ? "Infinite"
                                                    : `${currencySymbol}${Math.round(calculationResults.minOnly.totalPaid).toLocaleString()}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Accelerated Strategy Card */}
                                <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                                            <Zap className="w-3.5 h-3.5" /> Accelerated (+{currencySymbol}{extraMonthlyPayment}/mo)
                                        </span>
                                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                                            {formatYearsMonths(calculationResults.accelerated.months)}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div>
                                            <span className="text-slate-500 block">Total Interest:</span>
                                            <span className="font-bold text-emerald-600 text-sm">
                                                {currencySymbol}{Math.round(calculationResults.accelerated.totalInterest).toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Total Out-of-Pocket:</span>
                                            <span className="font-bold text-slate-900 text-sm">
                                                {currencySymbol}{Math.round(calculationResults.accelerated.totalPaid).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Comparison Visual Ratio Bar */}
                                <div className="space-y-1.5 pt-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                                        <span>Principal: {currencySymbol}{balance.toLocaleString()}</span>
                                        <span className="text-indigo-600">
                                            Interest Cost: {currencySymbol}{Math.round(calculationResults.accelerated.totalInterest).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{
                                                width: `${(balance / Math.max(1, balance + calculationResults.accelerated.totalInterest)) * 100}%`
                                            }}
                                        />
                                        <div
                                            className="bg-rose-500 h-full transition-all duration-500"
                                            style={{
                                                width: `${(calculationResults.accelerated.totalInterest / Math.max(1, balance + calculationResults.accelerated.totalInterest)) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-400">
                                        <span>Original Balance</span>
                                        <span>Total Finance Charges</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Tab 2: Accelerated Schedule Table */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[340px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Mo</th>
                                            <th className="p-2.5">Payment</th>
                                            <th className="p-2.5">Principal</th>
                                            <th className="p-2.5">Interest</th>
                                            <th className="p-2.5">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.accelerated.schedule.map((row) => (
                                            <tr key={row.month} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">M{row.month}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.payment)}</td>
                                                <td className="p-2.5 text-indigo-600">{currencySymbol}{Math.round(row.principalPaid)}</td>
                                                <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(row.interestPaid)}</td>
                                                <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{Math.round(row.endingBalance)}</td>
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
                            Client-Side Amortization Engine
                        </span>
                        <span>Zero Data Sent to Server</span>
                    </div>
                </div>
            </div>

            {/* Advisory Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Notice:</strong> This calculator models standard revolving debt amortization using fixed APR rates and typical minimum payment algorithms. Actual credit card statement totals may vary slightly due to daily balance shifts, promotional grace periods, cash advance rates, annual card fees, or changes in variable prime benchmark rates.
                </p>
            </div>

            {/* HIGH-VALUE BELOW-THE-FOLD CONTENT ENGINE (ADSENSE & GEO/SEO OPTIMIZED) */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Guide & The Minimum Payment Trap */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Credit Card Interest & Minimum Payments Actually Work
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A credit card <strong>minimum monthly payment</strong> is the lowest monetary amount that a financial institution legally allows you to pay toward an outstanding statement balance without incurring late penalty charges or damaging your credit report. While minimum payments provide temporary financial flexibility during tight months, relying on them as a long-term debt strategy creates a mathematical cycle known as the <strong>Minimum Payment Trap</strong>.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike fixed installment loans (such as 30-year mortgages or auto financing) where monthly payments remain steady and principal paydown accelerates over time, credit cards operate on revolving credit terms. As your balance decreases, the card issuer automatically lowers your required monthly minimum payment. This intentional design feature ensures that the vast majority of every monthly payment covers only interest charges, extending a modest balance into decades of revolving obligations.
                    </p>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Credit Card Daily Interest & Payment Mechanics
                        </h3>
                        <p className="text-xs text-slate-300">
                            Credit card companies compute interest charges on a continuous daily basis utilizing the Daily Periodic Rate (DPR) applied across your Average Daily Balance (ADB):
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Monthly Finance Charge = ADB × (APR / 365) × Billing Cycle Days
                        </div>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-emerald-300 overflow-x-auto border border-slate-800">
                            Minimum Payment = Max( Floor Amount, Balance × Rate %, Accrued Interest + 1% Principal )
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>APR:</strong> Annual Percentage Rate (e.g., 22.49%)</div>
                            <div><strong>ADB:</strong> Sum of daily closing balances divided by total cycle days</div>
                            <div><strong>Floor Amount:</strong> Statutory minimum payment amount ($25 to $40)</div>
                            <div><strong>Grace Period:</strong> 21–25 days where no interest is billed if paid in full</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Deep Comparative Analysis (Worked Case Studies) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Repayment Case Study: Minimum Payment vs. Fixed Accelerators
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate the exponential cost of compounding interest, the table below compares four distinct payment strategies for an average consumer credit card balance of <strong>$8,000</strong> with a standard <strong>22.5% APR</strong>:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Strategy Framework</th>
                                    <th className="p-3">Initial Monthly Outlay</th>
                                    <th className="p-3">Payoff Duration</th>
                                    <th className="p-3">Total Finance Interest</th>
                                    <th className="p-3">Total Cash Paid</th>
                                    <th className="p-3">Net Interest Saved</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-rose-700">1. Dynamic Minimum Only (2% / $35)</td>
                                    <td className="p-3">$160 / mo</td>
                                    <td className="p-3 font-bold text-slate-900">24 Years, 2 Months</td>
                                    <td className="p-3 text-rose-600 font-bold">$12,185</td>
                                    <td className="p-3 font-bold text-slate-900">$20,185</td>
                                    <td className="p-3 text-slate-400 font-medium">$0 (Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-800">2. Fixed Initial Minimum ($160/mo)</td>
                                    <td className="p-3">$160 / mo</td>
                                    <td className="p-3 font-bold text-slate-900">9 Years, 11 Months</td>
                                    <td className="p-3 text-slate-800 font-bold">$10,940</td>
                                    <td className="p-3 font-bold text-slate-900">$18,940</td>
                                    <td className="p-3 text-emerald-600 font-semibold">$1,245</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-700">3. Minimum + $100 Extra Boost</td>
                                    <td className="p-3">$260 / mo</td>
                                    <td className="p-3 font-bold text-indigo-700">3 Years, 9 Months</td>
                                    <td className="p-3 text-indigo-700 font-bold">$3,840</td>
                                    <td className="p-3 font-bold text-slate-900">$11,840</td>
                                    <td className="p-3 text-emerald-600 font-bold">$8,345</td>
                                </tr>
                                <tr className="bg-emerald-50/60 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-800">4. Aggressive Payoff ($350 Fixed)</td>
                                    <td className="p-3">$350 / mo</td>
                                    <td className="p-3 font-bold text-emerald-700">2 Years, 7 Months</td>
                                    <td className="p-3 text-emerald-600 font-bold">$2,560</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$10,560</td>
                                    <td className="p-3 text-emerald-700 font-extrabold">$9,625</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>The Mathematical Takeaway:</strong> By paying only the minimum, the cardholder repays <strong>$20,185</strong> over nearly a quarter-century—paying 150% more in interest fees than the original principal borrowed. In contrast, an aggressive fixed strategy saves <strong>$9,625 in cold hard cash</strong> and frees up personal cash flow 21 years sooner.
                    </p>
                </section>

                {/* Card 3: Debt Payoff Strategies (Avalanche vs. Snowball vs. Consolidation) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparing Strategic Debt Elimination Frameworks
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When managing multiple balances across different credit cards, selecting an organized mathematical framework prevents decision fatigue and optimizes repayment speed. Below is a breakdown of the three industry-standard strategies:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Avalanche */}
                        <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/30 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <ArrowRightCircle className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-slate-900 text-base">Debt Avalanche</h3>
                                </div>
                                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                                    Lowest Total Interest
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Maintain minimum payments on all cards, directing all excess debt allocation to the card with the highest APR. Once cleared, roll the entire payment amount into the next highest APR account.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-indigo-100 text-xs text-slate-700 space-y-1">
                                <div><strong>Best For:</strong> Disciplined, analytical individuals seeking maximum dollar savings.</div>
                                <div><strong>Risk:</strong> Slower initial milestone gratification on high balances.</div>
                            </div>
                        </div>

                        {/* Snowball */}
                        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    <h3 className="font-bold text-slate-900 text-base">Debt Snowball</h3>
                                </div>
                                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                    Maximum Psychological Wins
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Pay minimums across all debts, directing all extra cash to the card with the smallest nominal balance. Eliminating whole accounts quickly triggers neurological dopamine hits and reduces monthly billing clutter.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-emerald-100 text-xs text-slate-700 space-y-1">
                                <div><strong>Best For:</strong> Borrowers who thrive on fast tangible progress and motivation.</div>
                                <div><strong>Risk:</strong> May cost slightly more interest if high-APR cards linger.</div>
                            </div>
                        </div>

                        {/* Consolidation */}
                        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Shuffle className="w-5 h-5 text-amber-600" />
                                    <h3 className="font-bold text-slate-900 text-base">Balance Consolidation</h3>
                                </div>
                                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                    Single Monthly Payment
                                </span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Transfer balances to a 0% introductory APR credit card (12–21 months) or refinance via a low-rate fixed personal loan. All monthly capital goes straight to principal reduction without compounding interest.
                                </p>
                            </div>
                            <div className="pt-3 border-t border-amber-100 text-xs text-slate-700 space-y-1">
                                <div><strong>Best For:</strong> Borrowers with good credit ratings (670+ FICO).</div>
                                <div><strong>Risk:</strong> Transfer fees (3–5%) and severe interest spikes post-promo.</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Actionable 5-Step Debt Payoff Blueprint */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            5 Actionable Steps to Eliminate Revolving Credit Card Debt
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Transitioning from chronic revolving debt to financial independence requires a systematic execution framework. Follow this 5-step roadmap:
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                01
                            </div>
                            <div className="space-y-1 text-sm">
                                <h3 className="font-bold text-slate-900">Freeze Further Credit Card Spending</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Remove credit cards from digital wallets (Apple Pay, Google Wallet) and autofill browsers. You cannot empty a flooded basement while the faucet remains fully open. Switch everyday purchases strictly to debit or cash until debt reaches zero.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                02
                            </div>
                            <div className="space-y-1 text-sm">
                                <h3 className="font-bold text-slate-900">Negotiate Your APR with Card Issuers</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Call the customer retention number on the back of your card. Politely mention competitor 0% balance transfer offers or financial hardship. Cardholders with consistent on-time payment records frequently receive rate concessions of 2% to 6% APR.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                03
                            </div>
                            <div className="space-y-1 text-sm">
                                <h3 className="font-bold text-slate-900">Switch to Bi-Weekly Payment Schedules</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Instead of making one monthly payment of $400, make a bi-weekly payment of $200 every 14 days. Because there are 52 weeks in a calendar year, you will make 26 half-payments (equivalent to 13 full payments), reducing principal faster and cutting daily interest accrual without noticeable budget stress.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                04
                            </div>
                            <div className="space-y-1 text-sm">
                                <h3 className="font-bold text-slate-900">Apply the "Fixed-Payment" Anchor Technique</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Never decrease your payment as your balance falls. If your original minimum payment was $200, commit to paying $200 every single month until the balance hits $0. Converting a declining minimum into a fixed monthly payment cuts years off the payoff timeline automatically.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                05
                            </div>
                            <div className="space-y-1 text-sm">
                                <h3 className="font-bold text-slate-900">Funnel Financial Windfalls to Principal</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Direct non-recurring liquidity injections—such as annual tax refunds, performance work bonuses, cashback rewards, or selling unwanted household items—directly toward your target debt account to bypass compounding interest cycles entirely.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Credit Score Impact & Utilization Dynamics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Credit Card Payoff Supercharges Your FICO Score
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Paying down credit card debt is the single fastest and most effective way to raise your credit score. In credit scoring algorithms like FICO and VantageScore, <strong>Amounts Owed (Credit Utilization)</strong> accounts for roughly <strong>30% of your total credit score</strong>—second only to payment history.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-center space-y-1">
                            <span className="block text-xs font-bold uppercase text-rose-800 tracking-wider">Danger Zone</span>
                            <span className="text-xl font-extrabold text-rose-600">&gt; 50% Utilization</span>
                            <p className="text-xs text-rose-700">Significant negative impact on FICO score ratings.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-center space-y-1">
                            <span className="block text-xs font-bold uppercase text-amber-800 tracking-wider">Acceptable</span>
                            <span className="text-xl font-extrabold text-amber-600">10% – 30% Utilization</span>
                            <p className="text-xs text-amber-700">Standard financial benchmark; minimal score penalties.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center space-y-1">
                            <span className="block text-xs font-bold uppercase text-emerald-800 tracking-wider">Optimal Tier</span>
                            <span className="text-xl font-extrabold text-emerald-600">&lt; 10% Utilization</span>
                            <p className="text-xs text-emerald-700">Maximizes credit rating points and tier qualification.</p>
                        </div>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Myth Debunked:</strong> You do NOT need to carry a monthly balance or pay credit card interest to build credit. Card issuers report your statement balance to credit bureaus before interest is assessed. Paying your balance in full within the grace period builds a flawless on-time payment track record while paying exactly $0 in finance charges.
                    </p>
                </section>

                {/* Card 6: Comprehensive FAQ Section (Static, Highlighted, High-Scannability) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
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
                                How is a credit card minimum payment calculated by issuing banks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Most financial institutions use one of two primary formulas: a percentage-based method (typically 1% to 3% of the total statement balance) or a cost-plus formula (all monthly accrued interest plus 1% of the principal balance), subject to an absolute minimum floor dollar amount (usually $25 to $40).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the credit card minimum payment trap and why is it dangerous?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The minimum payment trap occurs because minimum payment requirements scale down as your debt balance decreases. Consequently, early payments go almost entirely toward compounding interest charges rather than paying down the principal loan, keeping borrowers in revolving debt for decades and multiplying total repayment costs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does adding $100 extra per month accelerate credit card payoff?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Every dollar paid above the required minimum payment is applied directly to the principal balance. Because revolving credit card interest accrues daily on the remaining balance, reducing principal immediately slashes subsequent interest charges, shortening repayment horizons by years and saving thousands in cumulative finance fees.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between the Debt Avalanche and Debt Snowball payoff strategies?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Debt Avalanche strategy allocates extra funds to the balance with the highest Annual Percentage Rate (APR) first, maximizing mathematical savings. The Debt Snowball strategy directs extra payments toward the smallest balance first to secure fast behavioral wins and reduce the number of open accounts.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does daily compounding interest work on credit card balances?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Credit card issuers calculate interest daily by dividing the nominal APR by 365 to determine the Daily Periodic Rate (DPR). This rate is multiplied by the cardholder's Average Daily Balance (ADB) across the billing cycle, meaning interest compounds continuously if a statement balance is not paid in full before the grace period ends.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does carrying a balance on my credit card build a better credit score?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No, carrying a revolving credit card balance does not build credit. In fact, high credit utilization (revolving balances exceeding 30% of your credit limit) can significantly harm credit scores. Paying your balance in full every month avoids all interest charges while still building a strong on-time payment history.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 7: Regulatory Compliance & Financial Disclaimer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-2 text-xs text-slate-500">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This credit card payoff calculator is provided for informational, illustrative, and educational purposes only and does not constitute financial, legal, tax, or investment advice. Results are mathematical estimates based on user inputs and standard revolving credit formulas. Exact payment calculations, daily finance charges, fee structures, and credit terms vary depending on your credit card issuer agreement and local financial regulations.
                    </p>
                </section>

            </div>
        </div>
    );
}