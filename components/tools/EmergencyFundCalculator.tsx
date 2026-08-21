"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    ShieldCheck,
    DollarSign,
    Calendar,
    HelpCircle,
    BookOpen,
    RefreshCw,
    Download,
    Copy,
    Check,
    Layers,
    BarChart3,
    Sparkles,
    AlertTriangle,
    Home,
    ShoppingBag,
    Zap,
    HeartPulse,
    Car,
    CreditCard,
    Briefcase,
    PieChart,
    Lightbulb,
    Target,
    Scale,
    TrendingUp,
    ShieldAlert,
    Clock,
    PlusCircle,
    Trash2
} from "lucide-react";

interface ExpenseCategory {
    id: string;
    name: string;
    amount: number;
    icon: string;
}

interface RiskProfilePreset {
    id: string;
    label: string;
    months: number;
    tag: string;
    description: string;
    currentSavings: number;
    monthlyContribution: number;
    interestRate: number;
    categories: { name: string; amount: number }[];
}

const RISK_PRESETS: RiskProfilePreset[] = [
    {
        id: "dual-salaried",
        label: "Dual-Income Salaried",
        months: 3,
        tag: "3 Months (Low Risk)",
        description: "Stable corporate or dual-earner households with minimal income volatility.",
        currentSavings: 4500,
        monthlyContribution: 450,
        interestRate: 4.25,
        categories: [
            { name: "Housing (Rent / Mortgage)", amount: 1500 },
            { name: "Utilities & Internet", amount: 280 },
            { name: "Groceries & Essentials", amount: 600 },
            { name: "Healthcare & Insurance", amount: 320 },
            { name: "Transportation & Fuel", amount: 300 },
            { name: "Debt Minimum Payments", amount: 200 },
        ],
    },
    {
        id: "single-earner",
        label: "Single-Earner Household",
        months: 6,
        tag: "6 Months (Standard)",
        description: "Single-income households, families with dependents, or standard corporate roles.",
        currentSavings: 6000,
        monthlyContribution: 600,
        interestRate: 4.5,
        categories: [
            { name: "Housing (Rent / Mortgage)", amount: 1800 },
            { name: "Utilities & Internet", amount: 320 },
            { name: "Groceries & Essentials", amount: 750 },
            { name: "Healthcare & Insurance", amount: 450 },
            { name: "Transportation & Fuel", amount: 380 },
            { name: "Debt Minimum Payments", amount: 300 },
        ],
    },
    {
        id: "freelancer-commission",
        label: "Freelancer / Variable Income",
        months: 9,
        tag: "9 Months (Moderate Risk)",
        description: "Self-employed professionals, contractors, commission earners, or single specialized earners.",
        currentSavings: 8000,
        monthlyContribution: 750,
        interestRate: 4.5,
        categories: [
            { name: "Housing (Rent / Mortgage)", amount: 1600 },
            { name: "Utilities & Internet", amount: 300 },
            { name: "Groceries & Essentials", amount: 650 },
            { name: "Healthcare & Insurance", amount: 550 },
            { name: "Transportation & Fuel", amount: 320 },
            { name: "Debt Minimum Payments", amount: 180 },
        ],
    },
    {
        id: "high-volatility",
        label: "Solo Entrepreneur / High Volatility",
        months: 12,
        tag: "12 Months (Maximum Security)",
        description: "Founders, volatile niche specialists, sole providers with multiple dependents, or health constraints.",
        currentSavings: 10000,
        monthlyContribution: 900,
        interestRate: 4.75,
        categories: [
            { name: "Housing (Rent / Mortgage)", amount: 2200 },
            { name: "Utilities & Internet", amount: 400 },
            { name: "Groceries & Essentials", amount: 900 },
            { name: "Healthcare & Insurance", amount: 650 },
            { name: "Transportation & Fuel", amount: 450 },
            { name: "Debt Minimum Payments", amount: 400 },
        ],
    },
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

export default function EmergencyFundCalculator() {
    // Financial State Inputs
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [targetMonths, setTargetMonths] = useState<number>(6);
    const [currentSavings, setCurrentSavings] = useState<number>(5000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
    const [hysaApy, setHysaApy] = useState<number>(4.25);
    const [customExpenseAdjustment, setCustomExpenseAdjustment] = useState<number>(0);

    // Itemized Expense Categories
    const [housing, setHousing] = useState<number>(1600);
    const [utilities, setUtilities] = useState<number>(280);
    const [groceries, setGroceries] = useState<number>(650);
    const [healthcare, setHealthcare] = useState<number>(400);
    const [transportation, setTransportation] = useState<number>(350);
    const [debtPayments, setDebtPayments] = useState<number>(250);
    const [otherEssentials, setOtherEssentials] = useState<number>(170);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"summary" | "timeline">("summary");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Core Calculations
    const calculationResults = useMemo(() => {
        const monthlyBaseline =
            housing +
            utilities +
            groceries +
            healthcare +
            transportation +
            debtPayments +
            otherEssentials +
            customExpenseAdjustment;

        const effectiveMonthlyExpense = Math.max(0, monthlyBaseline);
        const targetEmergencyFund = effectiveMonthlyExpense * targetMonths;
        const shortfall = Math.max(0, targetEmergencyFund - currentSavings);
        const fundedPercentage = targetEmergencyFund > 0
            ? Math.min(100, (currentSavings / targetEmergencyFund) * 100)
            : 100;

        const currentRunwayMonths = effectiveMonthlyExpense > 0
            ? (currentSavings / effectiveMonthlyExpense)
            : 0;

        // Timeline Calculation (with HYSA compound monthly interest)
        const monthlyRate = (hysaApy / 100) / 12;
        let runningBalance = currentSavings;
        let monthsToReachTarget = 0;
        let cumulativeInterestEarned = 0;
        const monthlyTimeline: { month: number; balance: number; interest: number; contributions: number }[] = [];

        if (shortfall > 0 && monthlyContribution > 0) {
            let totalContributed = 0;
            while (runningBalance < targetEmergencyFund && monthsToReachTarget < 360) {
                monthsToReachTarget++;
                const interestThisMonth = runningBalance * monthlyRate;
                runningBalance += interestThisMonth + monthlyContribution;
                totalContributed += monthlyContribution;
                cumulativeInterestEarned += interestThisMonth;

                monthlyTimeline.push({
                    month: monthsToReachTarget,
                    balance: runningBalance,
                    interest: cumulativeInterestEarned,
                    contributions: totalContributed,
                });
            }
        } else if (shortfall === 0) {
            monthsToReachTarget = 0;
        } else {
            monthsToReachTarget = Infinity; // Zero contribution, will never reach
        }

        // Tiered Milestone Allocations (1 month, 3 months, 6 months, 9 months, 12 months)
        const milestoneTiers = [
            { label: "1 Month (Starter Buffer)", months: 1, amount: effectiveMonthlyExpense * 1 },
            { label: "3 Months (Low Risk / Dual Earner)", months: 3, amount: effectiveMonthlyExpense * 3 },
            { label: "6 Months (Standard Recommended)", months: 6, amount: effectiveMonthlyExpense * 6 },
            { label: "9 Months (Freelance / Variable)", months: 9, amount: effectiveMonthlyExpense * 9 },
            { label: "12 Months (Maximum Shield)", months: 12, amount: effectiveMonthlyExpense * 12 },
        ];

        // Annual Opportunity Yield in HYSA vs 0.01% Traditional Checking
        const annualHysaInterestAtFull = targetEmergencyFund * (hysaApy / 100);
        const traditionalInterestAtFull = targetEmergencyFund * 0.0001;
        const annualYieldAdvantage = Math.max(0, annualHysaInterestAtFull - traditionalInterestAtFull);

        return {
            effectiveMonthlyExpense,
            targetEmergencyFund,
            shortfall,
            fundedPercentage,
            currentRunwayMonths,
            monthsToReachTarget,
            cumulativeInterestEarned,
            monthlyTimeline,
            milestoneTiers,
            annualHysaInterestAtFull,
            annualYieldAdvantage,
        };
    }, [
        housing,
        utilities,
        groceries,
        healthcare,
        transportation,
        debtPayments,
        otherEssentials,
        customExpenseAdjustment,
        targetMonths,
        currentSavings,
        monthlyContribution,
        hysaApy,
    ]);

    const applyPreset = (preset: RiskProfilePreset) => {
        setTargetMonths(preset.months);
        setCurrentSavings(preset.currentSavings);
        setMonthlyContribution(preset.monthlyContribution);
        setHysaApy(preset.interestRate);
        setCustomExpenseAdjustment(0);

        if (preset.categories.length >= 6) {
            setHousing(preset.categories[0].amount);
            setUtilities(preset.categories[1].amount);
            setGroceries(preset.categories[2].amount);
            setHealthcare(preset.categories[3].amount);
            setTransportation(preset.categories[4].amount);
            setDebtPayments(preset.categories[5].amount);
            setOtherEssentials(0);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setTargetMonths(6);
        setCurrentSavings(5000);
        setMonthlyContribution(500);
        setHysaApy(4.25);
        setCustomExpenseAdjustment(0);
        setHousing(1600);
        setUtilities(280);
        setGroceries(650);
        setHealthcare(400);
        setTransportation(350);
        setDebtPayments(250);
        setOtherEssentials(170);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const timeEstimateStr = calculationResults.monthsToReachTarget === Infinity
            ? "Indefinite (requires monthly deposit)"
            : `${calculationResults.monthsToReachTarget} Months (${(calculationResults.monthsToReachTarget / 12).toFixed(1)} Years)`;

        const summaryText = `Emergency Fund & Expense Buffer Summary (TwisterTools):
----------------------------------------
Target Duration: ${targetMonths} Months
Monthly Bare-Bones Burn Rate: ${currencySymbol}${Math.round(calculationResults.effectiveMonthlyExpense).toLocaleString()}
Current Cash Reserve: ${currencySymbol}${currentSavings.toLocaleString()} (${calculationResults.fundedPercentage.toFixed(1)}% Funded)
Current Runway: ${calculationResults.currentRunwayMonths.toFixed(1)} Months
----------------------------------------
Target Emergency Fund Goal: ${currencySymbol}${Math.round(calculationResults.targetEmergencyFund).toLocaleString()}
Remaining Savings Gap (Shortfall): ${currencySymbol}${Math.round(calculationResults.shortfall).toLocaleString()}
Monthly Savings Commitment: ${currencySymbol}${monthlyContribution.toLocaleString()}/mo
Projected Time to Full Fund: ${timeEstimateStr}
HYSA APY Yield Growth: ${hysaApy}%
Est. Annual Interest Earned at Goal: ${currencySymbol}${Math.round(calculationResults.annualHysaInterestAtFull).toLocaleString()}/year
----------------------------------------
Calculated at twistertools.com/tools/calculators/emergency-fund-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Month", "Starting Capital", "Monthly Deposit", "HYSA Interest Accrued", "Projected Total Reserve", "Target Goal"];
        const rows = calculationResults.monthlyTimeline.slice(0, 60).map((row) => [
            row.month,
            (row.balance - row.interest - row.contributions).toFixed(2),
            monthlyContribution.toFixed(2),
            row.interest.toFixed(2),
            row.balance.toFixed(2),
            calculationResults.targetEmergencyFund.toFixed(2),
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `emergency_fund_plan_${targetMonths}months.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // SEO Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Emergency Fund & Monthly Expense Buffer Calculator",
        "url": "https://twistertools.com/tools/calculators/emergency-fund-calculator",
        "description": "Calculate your ideal emergency fund reserve, bare-bones survival budget, savings runway, and high-yield interest trajectory with real-time financial math.",
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
                "name": "How many months of living expenses should be in an emergency fund?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The general standard is 3 to 6 months of essential living expenses. Dual-income corporate employees with stable jobs often maintain 3 months, whereas single-income families, contractors, freelancers, or business owners should target 6 to 12 months due to higher revenue volatility."
                }
            },
            {
                "@type": "Question",
                "name": "What expenses should be included in an emergency fund calculation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Only include bare-bones non-negotiable living expenses: rent or mortgage payments, basic utilities, groceries, health insurance, minimum debt obligations, and essential transportation. Discretionary spending such as dining out, subscriptions, vacations, and luxury retail should be excluded."
                }
            },
            {
                "@type": "Question",
                "name": "Where should an emergency fund be stored for optimal safety and liquidity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An emergency fund should be held in liquid, FDIC-insured or NCUA-insured high-yield savings accounts (HYSA) or money market deposit accounts (MMDA). Avoid locking emergency cash in volatile stock equities, illiquid real estate, or long-term locked certificates of deposit (CDs)."
                }
            },
            {
                "@type": "Question",
                "name": "Should I build an emergency fund or pay off high-interest debt first?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial advisors recommend building a starter emergency buffer of at least 1 month of essential expenses (or $1,000 to $2,500) before aggressively attacking high-interest credit card debt. This prevents you from resorting to new debt when unexpected life expenses arise."
                }
            },
            {
                "@type": "Question",
                "name": "Does high inflation erode the value of an emergency cash buffer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Inflation reduces the purchasing power of idle cash. To mitigate this risk without compromising rapid liquidity, park emergency funds in competitive High-Yield Savings Accounts (HYSAs) or short-term Treasury bills that pay benchmark interest rates."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Expense Inputs & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Monthly Essentials & Parameters
                            </h2>
                            <div className="flex items-center gap-2">
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50 outline-none"
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="INR">INR (₹)</option>
                                    <option value="CAD/AUD">CAD/AUD ($)</option>
                                </select>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Target Duration Selector */}
                        <div className="mb-5 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-indigo-600" /> Target Safety Buffer Horizon
                                </label>
                                <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                    {targetMonths} Months
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {[1, 3, 6, 9, 12].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => {
                                            setTargetMonths(num);
                                            setActivePresetId(null);
                                        }}
                                        className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${targetMonths === num
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                            }`}
                                    >
                                        {num} {num === 1 ? "Mo" : "Mos"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Itemized Survival Expense Inputs */}
                        <div className="space-y-3.5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Non-Negotiable Monthly Living Expenses
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                {/* Housing */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <Home className="w-3.5 h-3.5 text-indigo-500" /> Rent or Mortgage
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={housing === 0 ? "" : housing}
                                            onChange={(e) => handleNumberInput(e, (val) => { setHousing(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Utilities */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <Zap className="w-3.5 h-3.5 text-indigo-500" /> Utilities, Water & Web
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={utilities === 0 ? "" : utilities}
                                            onChange={(e) => handleNumberInput(e, (val) => { setUtilities(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Groceries */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" /> Groceries & Basic Food
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={groceries === 0 ? "" : groceries}
                                            onChange={(e) => handleNumberInput(e, (val) => { setGroceries(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Healthcare */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <HeartPulse className="w-3.5 h-3.5 text-indigo-500" /> Health & Insurances
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={healthcare === 0 ? "" : healthcare}
                                            onChange={(e) => handleNumberInput(e, (val) => { setHealthcare(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Transportation */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <Car className="w-3.5 h-3.5 text-indigo-500" /> Transport & Fuel
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={transportation === 0 ? "" : transportation}
                                            onChange={(e) => handleNumberInput(e, (val) => { setTransportation(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Debt Payments */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-1">
                                        <CreditCard className="w-3.5 h-3.5 text-indigo-500" /> Min Debt Obligations
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={debtPayments === 0 ? "" : debtPayments}
                                            onChange={(e) => handleNumberInput(e, (val) => { setDebtPayments(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Balance & Savings Velocity */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Current Cash & Accumulation Velocity
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        Current Liquid Cash
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentSavings === 0 ? "" : currentSavings}
                                            onChange={(e) => handleNumberInput(e, (val) => { setCurrentSavings(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        Monthly Savings Add
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={monthlyContribution === 0 ? "" : monthlyContribution}
                                            onChange={(e) => handleNumberInput(e, (val) => { setMonthlyContribution(val); setActivePresetId(null); })}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                                        HYSA Rate (APY %)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="0.05"
                                            value={hysaApy === 0 ? "" : hysaApy}
                                            onChange={(e) => handleNumberInput(e, (val) => { setHysaApy(val); setActivePresetId(null); })}
                                            className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fast Risk Presets */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Household Risk Presets
                                </span>
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {RISK_PRESETS.map((preset) => {
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
                            {copied ? "Copied Reserve Plan" : "Copy Buffer Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Financial Runway & Milestone Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Reserve Analysis & Runway
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("summary")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "summary" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Buffer Status
                                </button>
                                <button
                                    onClick={() => setActiveTab("timeline")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "timeline" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Growth Timeline
                                </button>
                            </div>
                        </div>

                        {/* Highlight KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Required Target Goal</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.targetEmergencyFund).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Covers {targetMonths} months of bare survival expenses
                                </p>
                            </div>

                            <div className={`p-4 rounded-xl border ${calculationResults.shortfall === 0
                                ? "bg-emerald-50/70 border-emerald-200"
                                : "bg-amber-50/70 border-amber-200"
                                }`}>
                                <p className={`text-xs font-bold uppercase tracking-wider ${calculationResults.shortfall === 0 ? "text-emerald-700" : "text-amber-800"
                                    }`}>
                                    {calculationResults.shortfall === 0 ? "Fund Fully Funded" : "Remaining Savings Gap"}
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.shortfall).toLocaleString()}
                                </p>
                                <p className={`text-[11px] font-medium mt-1 ${calculationResults.shortfall === 0 ? "text-emerald-600" : "text-amber-700"
                                    }`}>
                                    {calculationResults.fundedPercentage.toFixed(1)}% funded ({calculationResults.currentRunwayMonths.toFixed(1)} mos saved)
                                </p>
                            </div>
                        </div>

                        {activeTab === "summary" ? (
                            <div className="space-y-5">
                                {/* Visual Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Current: {currencySymbol}{currentSavings.toLocaleString()}
                                        </span>
                                        <span className="text-slate-700 font-bold">
                                            Target: {currencySymbol}{Math.round(calculationResults.targetEmergencyFund).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                                            style={{ width: `${Math.min(100, calculationResults.fundedPercentage)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Monthly Burn Breakdown Summary */}
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Essential Monthly Burn Rate:</span>
                                        <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.effectiveMonthlyExpense).toLocaleString()}/mo</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Accumulation Time Required:</span>
                                        <span className="font-bold text-indigo-600">
                                            {calculationResults.monthsToReachTarget === 0
                                                ? "Target Reached!"
                                                : calculationResults.monthsToReachTarget === Infinity
                                                    ? "Add savings contribution to calculate"
                                                    : `${calculationResults.monthsToReachTarget} Months (~${(calculationResults.monthsToReachTarget / 12).toFixed(1)} Years)`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">HYSA Annual Interest Generated:</span>
                                        <span className="font-bold text-emerald-600">+{currencySymbol}{Math.round(calculationResults.annualHysaInterestAtFull).toLocaleString()}/year</span>
                                    </div>
                                </div>

                                {/* Tier Milestone Projections */}
                                <div className="space-y-2 pt-1">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Standard Safety Milestone Targets
                                    </h3>
                                    <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                                        {calculationResults.milestoneTiers.map((tier) => {
                                            const isAchieved = currentSavings >= tier.amount;
                                            return (
                                                <div
                                                    key={tier.months}
                                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${isAchieved
                                                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                                                        : "bg-slate-50 border-slate-200 text-slate-700"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isAchieved ? (
                                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                                        ) : (
                                                            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        )}
                                                        <span className="font-semibold">{tier.label}</span>
                                                    </div>
                                                    <span className="font-extrabold">
                                                        {currencySymbol}{Math.round(tier.amount).toLocaleString()}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Month by Month Growth Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Month</th>
                                            <th className="p-2.5">Deposits Added</th>
                                            <th className="p-2.5">HYSA Interest</th>
                                            <th className="p-2.5">Total Reserve</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.monthlyTimeline.slice(0, 48).map((row) => (
                                            <tr key={row.month} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Month {row.month}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.contributions).toLocaleString()}</td>
                                                <td className="p-2.5 text-emerald-600 font-semibold">+{currencySymbol}{Math.round(row.interest).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-indigo-600">{currencySymbol}{Math.round(row.balance).toLocaleString()}</td>
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
                            Deterministic client-side calculation
                        </span>
                        <span>Zero server transmission</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Alert */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator provides educational estimates based on user-provided expense figures and assumed interest parameters. It does not constitute personal financial, tax, or legal advice.
                </p>
            </div>

            {/* BELOW-THE-FOLD DETAILED CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics of Emergency Reserves */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is an Emergency Fund? Architecture & Survival Budgeting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An <strong>emergency fund</strong> is a dedicated cash reserve designated exclusively for unexpected life events, sudden financial disruptions, involuntary unemployment, or urgent medical emergencies. It functions as a financial shock absorber, preventing individuals and families from taking on high-interest credit card debt, taking out predatory payday loans, or liquidating long-term retirement investments during market downturns.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Unlike general personal savings or vacation funds, an emergency buffer is calculated strictly using your <strong>bare-bones monthly burn rate</strong>. This survival baseline includes only non-negotiable living expenses required to keep a roof over your head, food on the table, and essential debts in good standing.
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4" /> The Essential Burn Rate Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            Your baseline emergency target is established by isolating non-discretionary monthly expenditures and multiplying by your selected risk duration:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Target Fund = (Housing + Utilities + Groceries + Health + Min Debt + Transport) × Target Months
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Included:</strong> Rent, mortgage, groceries, health insurance, minimum loan dues.</div>
                            <div><strong>Excluded:</strong> Dining out, vacations, streaming services, shopping, lifestyle luxuries.</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Risk Assessment Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Many Months Do You Really Need? Risk Assessment Framework
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The standard "3 to 6 months" rule of thumb is a helpful starting point, but the optimal reserve size depends on income stability, household earner count, industry volatility, and dependent counts:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Profile Tier</th>
                                    <th className="p-3">Target Runway</th>
                                    <th className="p-3">Primary Household Characteristics</th>
                                    <th className="p-3">Recommended Vehicle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Low Risk Tier</td>
                                    <td className="p-3 text-indigo-600 font-bold">3 Months</td>
                                    <td className="p-3">Dual-income salaried households with no dependents, tenured civil servants, or high in-demand technical talent.</td>
                                    <td className="p-3">High-Yield Savings Account (HYSA)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Standard Tier</td>
                                    <td className="p-3 text-indigo-600 font-bold">6 Months</td>
                                    <td className="p-3">Single-income earners, corporate private-sector employees, or couples with children or a mortgage.</td>
                                    <td className="p-3">HYSA / Money Market Accounts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Moderate Risk</td>
                                    <td className="p-3 text-indigo-600 font-bold">9 Months</td>
                                    <td className="p-3">1099 contractors, freelancers, commission-based sales professionals, and niche consultants.</td>
                                    <td className="p-3">HYSA + Short-Term T-Bills</td>
                                </tr>
                                <tr className="bg-indigo-50/40 hover:bg-indigo-50/70">
                                    <td className="p-3 font-bold text-indigo-900">High Risk Tier</td>
                                    <td className="p-3 text-indigo-600 font-extrabold">12 Months</td>
                                    <td className="p-3">Startup founders, sole business owners, volatile industry professionals, or individuals with chronic health considerations.</td>
                                    <td className="p-3">Tiered HYSA + Ultra-Short Treasury Ladders</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Storage Strategies - HYSA vs CDs vs Checking */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Where to Store Your Buffer: Liquidity, Safety, and Yield
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An emergency fund must prioritize <strong>immediate liquidity</strong> and <strong>capital preservation</strong> above all else. Locking your safety reserve in high-volatility stock index funds or illiquid assets can force you to sell at a loss during a broader economic downturn.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Top Choice</span>
                            <h3 className="font-bold text-slate-900 text-sm">High-Yield Savings (HYSA)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Offers competitive yields (typically 4.0% to 5.0% APY) while maintaining FDIC or NCUA insurance protection and next-day electronic transfer access.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Viable Alternative</span>
                            <h3 className="font-bold text-slate-900 text-sm">Money Market Accounts (MMDA)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Provides check-writing and debit card access alongside competitive interest rates, offering the quickest physical liquidation in urgent crises.
                            </p>
                        </div>

                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Avoid For Buffer</span>
                            <h3 className="font-bold text-slate-900 text-sm">Equities, Crypto & Long CDs</h3>
                            <p className="text-xs text-rose-700 leading-relaxed">
                                Subject to severe market drawdowns or early withdrawal penalty fees. Never risk principal capital needed for immediate survival.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Capital Accumulation Blueprint */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            A Step-by-Step Blueprint to Fund Your Safety Net
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Building a multi-month cash cushion can feel intimidating if started from scratch. Follow this sequential order of operations to establish financial security systematically:
                    </p>

                    <div className="space-y-3 text-sm text-slate-700">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                            <div>
                                <strong className="text-slate-900 block">Establish the $1,000 to 1-Month Starter Cushion</strong>
                                Save a rapid 1-month starter reserve before aggressively prioritizing anything beyond essential living expenses.
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                            <div>
                                <strong className="text-slate-900 block">Capture Full Employer Retirement Matches</strong>
                                Contribute enough to your employer 401(k) or pension plan to capture the 100% immediate return on employer match.
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                            <div>
                                <strong className="text-slate-900 block">Pay Down Toxic High-Interest Debt</strong>
                                Eliminate credit cards and loans with double-digit interest rates (above 8–10%) using the avalanche or snowball method.
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                            <div>
                                <strong className="text-indigo-950 block">Scale to Full 3 to 6-Month Bare-Bones Fund</strong>
                                Redirect freed-up debt payments into your High-Yield Savings Account until your targeted runway is fully funded.
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: FAQ Section (Static highlight cards, No useState accordions) */}
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
                                How many months of living expenses should be in an emergency fund?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The general standard is 3 to 6 months of essential living expenses. Dual-income corporate employees with stable jobs often maintain 3 months, whereas single-income families, contractors, freelancers, or business owners should target 6 to 12 months due to higher revenue volatility.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What expenses should be included in an emergency fund calculation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Only include bare-bones non-negotiable living expenses: rent or mortgage payments, basic utilities, groceries, health insurance, minimum debt obligations, and essential transportation. Discretionary spending such as dining out, subscriptions, vacations, and luxury retail should be excluded.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Where should an emergency fund be stored for optimal safety and liquidity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An emergency fund should be held in liquid, FDIC-insured or NCUA-insured high-yield savings accounts (HYSA) or money market deposit accounts (MMDA). Avoid locking emergency cash in volatile stock equities, illiquid real estate, or long-term locked certificates of deposit (CDs).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I build an emergency fund or pay off high-interest debt first?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial advisors recommend building a starter emergency buffer of at least 1 month of essential expenses (or $1,000 to $2,500) before aggressively attacking high-interest credit card debt. This prevents you from resorting to new debt when unexpected life expenses arise.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does high inflation erode the value of an emergency cash buffer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Inflation reduces the purchasing power of idle cash. To mitigate this risk without compromising rapid liquidity, park emergency funds in competitive High-Yield Savings Accounts (HYSAs) or short-term Treasury bills that pay benchmark interest rates.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Mandatory Disclaimer */}
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