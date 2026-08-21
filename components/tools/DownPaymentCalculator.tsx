"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Home,
    DollarSign,
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
    Target,
    Calculator,
    PieChart,
    Lightbulb,
    AlertTriangle,
    TrendingUp,
    Clock,
    PiggyBank,
    HelpCircle,
    BookOpen,
    Scale,
    Landmark,
    Coins,
    FileSpreadsheet,
    Compass,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

interface TimelineRow {
    month: number;
    year: number;
    startingBalance: number;
    contribution: number;
    interestEarned: number;
    endingBalance: number;
    targetProgressPct: number;
}

interface Preset {
    id: string;
    label: string;
    targetHomePrice: number;
    downPaymentPct: number;
    currentSavings: number;
    monthlyContribution: number;
    annualYield: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "starter-fha",
        label: "Starter Home (FHA 3.5%)",
        targetHomePrice: 350000,
        downPaymentPct: 3.5,
        currentSavings: 5000,
        monthlyContribution: 400,
        annualYield: 4.5,
        tag: "3.5% Down"
    },
    {
        id: "conventional-10",
        label: "Suburban Median (10%)",
        targetHomePrice: 450000,
        downPaymentPct: 10,
        currentSavings: 15000,
        monthlyContribution: 800,
        annualYield: 4.5,
        tag: "10% Down"
    },
    {
        id: "pmi-free-20",
        label: "PMI-Free Standard (20%)",
        targetHomePrice: 500000,
        downPaymentPct: 20,
        currentSavings: 25000,
        monthlyContribution: 1200,
        annualYield: 4.5,
        tag: "20% Down"
    },
    {
        id: "metro-luxury",
        label: "Urban Property (20%)",
        targetHomePrice: 850000,
        downPaymentPct: 20,
        currentSavings: 50000,
        monthlyContribution: 2500,
        annualYield: 5.0,
        tag: "High Value"
    }
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$"
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

export default function DownPaymentCalculator() {
    // Core Parameters
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [targetHomePrice, setTargetHomePrice] = useState<number>(450000);
    const [downPaymentPct, setDownPaymentPct] = useState<number>(10);
    const [currentSavings, setCurrentSavings] = useState<number>(15000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(800);
    const [annualYield, setAnnualYield] = useState<number>(4.5);
    const [includeClosingCosts, setIncludeClosingCosts] = useState<boolean>(true);
    const [closingCostPct, setClosingCostPct] = useState<number>(3.0);
    const [lumpSumWindfall, setLumpSumWindfall] = useState<number>(0);
    const [windfallMonth, setWindfallMonth] = useState<number>(12);

    // UI State
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"visual" | "table">("visual");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Math Engine
    const calculations = useMemo(() => {
        const pureDownPaymentGoal = (targetHomePrice * (downPaymentPct / 100));
        const estimatedClosingCosts = includeClosingCosts ? (targetHomePrice * (closingCostPct / 100)) : 0;
        const totalCashRequired = pureDownPaymentGoal + estimatedClosingCosts;
        const remainingToSave = Math.max(0, totalCashRequired - currentSavings);

        const monthlyRate = (annualYield / 100) / 12;
        let runningBalance = currentSavings;
        let totalDeposited = currentSavings;
        let totalInterestEarned = 0;
        let monthsElapsed = 0;
        const maxMonthsCap = 480; // 40 year maximum bounds

        const monthlyTimeline: TimelineRow[] = [];

        while (runningBalance < totalCashRequired && monthsElapsed < maxMonthsCap) {
            monthsElapsed++;

            if (lumpSumWindfall > 0 && monthsElapsed === windfallMonth) {
                runningBalance += lumpSumWindfall;
                totalDeposited += lumpSumWindfall;
            }

            const monthStartBal = runningBalance;
            const interestThisMonth = runningBalance * monthlyRate;
            runningBalance += interestThisMonth + monthlyContribution;
            totalInterestEarned += interestThisMonth;
            totalDeposited += monthlyContribution;

            const progressPct = Math.min(100, (runningBalance / totalCashRequired) * 100);

            monthlyTimeline.push({
                month: monthsElapsed,
                year: Math.ceil(monthsElapsed / 12),
                startingBalance: monthStartBal,
                contribution: monthlyContribution + (lumpSumWindfall > 0 && monthsElapsed === windfallMonth ? lumpSumWindfall : 0),
                interestEarned: interestThisMonth,
                endingBalance: runningBalance,
                targetProgressPct: progressPct
            });
        }

        const yearsNeeded = Math.floor(monthsElapsed / 12);
        const remainingMonths = monthsElapsed % 12;

        const projectedTargetDate = new Date();
        projectedTargetDate.setMonth(projectedTargetDate.getMonth() + monthsElapsed);
        const targetDateFormatted = projectedTargetDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric"
        });

        const computeMonthsForMonthlyAmount = (customMonthly: number) => {
            if (customMonthly <= 0 && monthlyRate <= 0) return 999;
            let bal = currentSavings;
            let m = 0;
            while (bal < totalCashRequired && m < maxMonthsCap) {
                m++;
                if (lumpSumWindfall > 0 && m === windfallMonth) bal += lumpSumWindfall;
                bal += (bal * monthlyRate) + customMonthly;
            }
            return m;
        };

        const monthsWithExtra100 = computeMonthsForMonthlyAmount(monthlyContribution + 100);
        const monthsWithExtra250 = computeMonthsForMonthlyAmount(monthlyContribution + 250);
        const monthsWithExtra500 = computeMonthsForMonthlyAmount(monthlyContribution + 500);

        const currentCoveragePct = totalCashRequired > 0
            ? Math.min(100, (currentSavings / totalCashRequired) * 100)
            : 100;
        const interestSharePct = runningBalance > 0
            ? Math.min(100, (totalInterestEarned / runningBalance) * 100)
            : 0;

        return {
            pureDownPaymentGoal,
            estimatedClosingCosts,
            totalCashRequired,
            remainingToSave,
            monthsElapsed,
            yearsNeeded,
            remainingMonths,
            targetDateFormatted,
            totalDeposited,
            totalInterestEarned,
            monthlyTimeline,
            currentCoveragePct,
            interestSharePct,
            acceleratedOptions: {
                plus100MonthsSaved: Math.max(0, monthsElapsed - monthsWithExtra100),
                plus250MonthsSaved: Math.max(0, monthsElapsed - monthsWithExtra250),
                plus500MonthsSaved: Math.max(0, monthsElapsed - monthsWithExtra500),
            }
        };
    }, [
        targetHomePrice,
        downPaymentPct,
        currentSavings,
        monthlyContribution,
        annualYield,
        includeClosingCosts,
        closingCostPct,
        lumpSumWindfall,
        windfallMonth
    ]);

    const applyPreset = (preset: Preset) => {
        setTargetHomePrice(preset.targetHomePrice);
        setDownPaymentPct(preset.downPaymentPct);
        setCurrentSavings(preset.currentSavings);
        setMonthlyContribution(preset.monthlyContribution);
        setAnnualYield(preset.annualYield);
        setActivePresetId(preset.id);
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setTargetHomePrice(450000);
        setDownPaymentPct(10);
        setCurrentSavings(15000);
        setMonthlyContribution(800);
        setAnnualYield(4.5);
        setIncludeClosingCosts(true);
        setClosingCostPct(3.0);
        setLumpSumWindfall(0);
        setWindfallMonth(12);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summary = `Down Payment & Timeline Plan (TwisterTools):
--------------------------------------------------
Target Home Price: ${currencySymbol}${targetHomePrice.toLocaleString()}
Down Payment (${downPaymentPct}%): ${currencySymbol}${Math.round(calculations.pureDownPaymentGoal).toLocaleString()}
${includeClosingCosts ? `Estimated Closing Costs (${closingCostPct}%): ${currencySymbol}${Math.round(calculations.estimatedClosingCosts).toLocaleString()}\n` : ""}Total Target Cash: ${currencySymbol}${Math.round(calculations.totalCashRequired).toLocaleString()}
Current Capital Saved: ${currencySymbol}${currentSavings.toLocaleString()}
Monthly Contribution: ${currencySymbol}${monthlyContribution.toLocaleString()}
Expected HYSA Yield: ${annualYield}%
--------------------------------------------------
Projected Timeline: ${calculations.yearsNeeded} yrs ${calculations.remainingMonths} mos (Ready by ${calculations.targetDateFormatted})
Total Out-of-Pocket Deposits: ${currencySymbol}${Math.round(calculations.totalDeposited).toLocaleString()}
Total Compound Interest Earned: ${currencySymbol}${Math.round(calculations.totalInterestEarned).toLocaleString()}
--------------------------------------------------
Plan generated at twistertools.com/tools/calculators/down-payment-calculator`;

        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Month", "Year", "Starting Balance", "Deposit", "Interest Earned", "Ending Balance", "Progress Pct"];
        const csvRows = [
            headers.join(","),
            ...calculations.monthlyTimeline.map((row) =>
                [
                    row.month,
                    row.year,
                    row.startingBalance.toFixed(2),
                    row.contribution.toFixed(2),
                    row.interestEarned.toFixed(2),
                    row.endingBalance.toFixed(2),
                    `${row.targetProgressPct.toFixed(1)}%`
                ].join(",")
            )
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `down_payment_savings_schedule_${targetHomePrice}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Down Payment Savings & Timeline Planner",
        "url": "https://twistertools.com/tools/calculators/down-payment-calculator",
        "description": "Calculate exact home down payment targets, projected monthly savings timelines, high-yield compound interest, closing costs, and mortgage readiness.",
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
                "name": "How much down payment do I actually need to buy a home?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While 20% down eliminates Private Mortgage Insurance (PMI), conventional mortgages frequently permit as low as 3% down for qualified first-time buyers, FHA loans require 3.5%, and VA or USDA loans often permit 0% down."
                }
            },
            {
                "@type": "Question",
                "name": "What are closing costs and why should they be budgeted alongside a down payment?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Closing costs comprise lender origination fees, home appraisal charges, title insurance, attorney fees, escrow property taxes, and homeowners insurance prepayments. They typically total between 2% and 5% of the total loan amount and must be paid in cash at settlement."
                }
            },
            {
                "@type": "Question",
                "name": "Where should I keep my down payment savings while working toward my goal?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Down payment funds targeted for use within 1 to 5 years should generally be kept in low-risk, liquid vehicles such as FDIC-insured High-Yield Savings Accounts (HYSA), short-term Certificates of Deposit (CDs), or Treasury bills to protect principal from market fluctuations while earning yield."
                }
            },
            {
                "@type": "Question",
                "name": "How does Private Mortgage Insurance (PMI) work if I put down less than 20%?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PMI is an insurance premium that protects the lender in case of loan default. It typically costs between 0.5% and 1.5% of the initial loan balance per year. Once your home equity reaches 20% on a conventional mortgage, PMI can be cancelled upon request."
                }
            },
            {
                "@type": "Question",
                "name": "Should I put 20% down or opt for a smaller down payment and invest the rest?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Putting 20% down eliminates monthly PMI fees and reduces your ongoing mortgage payment and total lifetime interest. However, a smaller down payment (5% to 10%) preserves liquidity for emergency reserves, home maintenance, or higher-yielding long-term index investments. The right choice depends on your prevailing mortgage interest rate versus market expected returns."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use gifted money or retirement accounts for my down payment?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Most conventional and FHA loan programs permit down payment gift funds from immediate family members, provided you submit an official gift letter stating no repayment is expected. Additionally, first-time home buyers may withdraw up to $10,000 penalty-free from traditional or Roth IRAs under IRS qualified first-time homebuyer exemptions."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Data Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Inputs & Planner Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Target Home & Savings Parameters
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
                                <option value="CAD/AUD">CAD / AUD ($)</option>
                                <option value="INR">INR (₹)</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            {/* Target Home Price */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Home className="w-4 h-4 text-indigo-600" /> Target Home Price
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{targetHomePrice.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="5000"
                                        value={targetHomePrice === 0 ? "" : targetHomePrice}
                                        onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setTargetHomePrice, Math.max(0, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Down Payment Percentage */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Down Payment Target
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {downPaymentPct}% ({currencySymbol}{Math.round(calculations.pureDownPaymentGoal).toLocaleString()})
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        step="0.5"
                                        value={downPaymentPct}
                                        onChange={(e) => handleInputChange(setDownPaymentPct, parseFloat(e.target.value))}
                                        className="flex-1 accent-indigo-600 cursor-pointer"
                                    />
                                    <div className="w-20 relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="0.5"
                                            value={downPaymentPct === 0 ? "" : downPaymentPct}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setDownPaymentPct, Math.max(0.5, Math.min(100, val))))}
                                            className="w-full pr-6 pl-2.5 py-1.5 text-right rounded-lg border border-slate-200 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Savings & Monthly Deposit Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <PiggyBank className="w-4 h-4 text-indigo-600" /> Current Savings Saved
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={currentSavings === 0 ? "" : currentSavings}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setCurrentSavings, Math.max(0, val)))}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Monthly Savings Contribution
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={monthlyContribution === 0 ? "" : monthlyContribution}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setMonthlyContribution, Math.max(0, val)))}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* HYSA Annual Interest Rate & Closing Cost Checkbox */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 pt-2 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> HYSA Yield Rate (APY)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.1"
                                            value={annualYield === 0 ? "" : annualYield}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setAnnualYield, Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                                            <Landmark className="w-4 h-4 text-indigo-600" /> Closing Costs
                                        </label>
                                        <input
                                            type="checkbox"
                                            checked={includeClosingCosts}
                                            onChange={(e) => setIncludeClosingCosts(e.target.checked)}
                                            className="accent-indigo-600 rounded cursor-pointer"
                                        />
                                    </div>
                                    {includeClosingCosts ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.5"
                                                max="10"
                                                step="0.5"
                                                value={closingCostPct}
                                                onChange={(e) => handleNumberInput(e, (val) => setClosingCostPct(Math.max(0, val)))}
                                                className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 py-1.5">Excluded from target.</p>
                                    )}
                                </div>
                            </div>

                            {/* Optional One-Time Windfall Bonus Deposit */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex justify-between items-center text-xs text-slate-700 font-semibold mb-1.5">
                                    <span className="flex items-center gap-1">
                                        <Coins className="w-3.5 h-3.5 text-indigo-500" /> Scheduled Windfall / Tax Refund (Optional)
                                    </span>
                                    <span className="text-indigo-600 font-bold">
                                        {currencySymbol}{lumpSumWindfall.toLocaleString()}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            placeholder="Lump Sum"
                                            value={lumpSumWindfall === 0 ? "" : lumpSumWindfall}
                                            onChange={(e) => handleNumberInput(e, (val) => setLumpSumWindfall(Math.max(0, val)))}
                                            className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={windfallMonth}
                                            onChange={(e) => setWindfallMonth(Number(e.target.value))}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={3}>At Month 3</option>
                                            <option value={6}>At Month 6</option>
                                            <option value={12}>At Month 12 (Year 1)</option>
                                            <option value={24}>At Month 24 (Year 2)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presets Horizontal Pill Bar */}
                        <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Down Payment Scenarios
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Scenario Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
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
                            {copied ? "Copied Summary" : "Copy Savings Plan"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results Dashboard & Visual Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Goal Timeline & Cash Analysis
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("visual")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "visual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Visual Progress
                                </button>
                                <button
                                    onClick={() => setActiveTab("table")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Monthly Schedule
                                </button>
                            </div>
                        </div>

                        {/* Top Key Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Estimated Timeline</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {calculations.yearsNeeded > 0 ? `${calculations.yearsNeeded}y ` : ""}
                                    {calculations.remainingMonths}m
                                </p>
                                <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Target Ready: {calculations.targetDateFormatted}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Cash Goal</p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculations.totalCashRequired).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                    Down: {currencySymbol}{Math.round(calculations.pureDownPaymentGoal).toLocaleString()} | Closing: {currencySymbol}{Math.round(calculations.estimatedClosingCosts).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "visual" ? (
                            <div className="space-y-5">
                                {/* Current Savings Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Current Savings: {currencySymbol}{currentSavings.toLocaleString()} ({calculations.currentCoveragePct.toFixed(0)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5 text-slate-500">
                                            Target: {currencySymbol}{Math.round(calculations.totalCashRequired).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                                            style={{ width: `${Math.min(100, calculations.currentCoveragePct)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Financial Capital Breakdown */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                                    <h3 className="font-bold text-slate-800 uppercase tracking-wider">
                                        Source of Down Payment Funds
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                                            <span className="block text-slate-400 text-[10px] uppercase font-bold">Initial Principal</span>
                                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{currencySymbol}{currentSavings.toLocaleString()}</span>
                                        </div>
                                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                                            <span className="block text-slate-400 text-[10px] uppercase font-bold">Future Deposits</span>
                                            <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{currencySymbol}{Math.max(0, Math.round(calculations.totalDeposited - currentSavings)).toLocaleString()}</span>
                                        </div>
                                        <div className="p-2 bg-white border border-slate-200 rounded-lg">
                                            <span className="block text-emerald-600 text-[10px] uppercase font-bold">HYSA Interest</span>
                                            <span className="font-extrabold text-emerald-600 text-xs sm:text-sm">+{currencySymbol}{Math.round(calculations.totalInterestEarned).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Acceleration Strategies Showcase */}
                                <div className="space-y-2 pt-1">
                                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> Timeline Acceleration Boosters
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-center">
                                            <span className="block text-[11px] font-semibold text-slate-700">+$100 / mo</span>
                                            <span className="text-xs font-bold text-indigo-700">Save {calculations.acceleratedOptions.plus100MonthsSaved} mo</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-center">
                                            <span className="block text-[11px] font-semibold text-slate-700">+$250 / mo</span>
                                            <span className="text-xs font-bold text-indigo-700">Save {calculations.acceleratedOptions.plus250MonthsSaved} mo</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-center">
                                            <span className="block text-[11px] font-semibold text-slate-700">+$500 / mo</span>
                                            <span className="text-xs font-bold text-indigo-700">Save {calculations.acceleratedOptions.plus500MonthsSaved} mo</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Monthly Schedule Table */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Mo</th>
                                            <th className="p-2.5">Start Bal</th>
                                            <th className="p-2.5">Deposit</th>
                                            <th className="p-2.5">Interest</th>
                                            <th className="p-2.5">End Bal</th>
                                            <th className="p-2.5">Goal %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculations.monthlyTimeline.map((row) => (
                                            <tr key={row.month} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">M{row.month}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.startingBalance).toLocaleString()}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.contribution).toLocaleString()}</td>
                                                <td className="p-2.5 text-emerald-600 font-semibold">+{currencySymbol}{Math.round(row.interestEarned).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{Math.round(row.endingBalance).toLocaleString()}</td>
                                                <td className="p-2.5 text-indigo-600 font-bold">{row.targetProgressPct.toFixed(0)}%</td>
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
                            Client-side encrypted math
                        </span>
                        <span>Zero server latency</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Callout */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This calculator provides planning estimates for budgeting and savings goals. It does not constitute formal financial, lending, or mortgage advisory. Actual closing costs, interest yields, and loan qualification criteria will vary by lender and jurisdiction.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO/SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Understanding Down Payments & Loan Programs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Down Payments Work: Minimum Requirements by Mortgage Type
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A home down payment is the upfront cash portion of a property purchase that the buyer pays out of pocket, with the remainder funded through a mortgage loan. The amount you put down directly dictates your loan-to-value (LTV) ratio, monthly mortgage payment, interest rate terms, and whether you must pay mandatory mortgage insurance. While putting 20% down has long been regarded as the benchmark to bypass private mortgage insurance, modern home buyers have access to a broad array of loan programs requiring as little as 0% to 3.5% down.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Mortgage Program</th>
                                    <th className="p-3">Minimum Down Payment</th>
                                    <th className="p-3">Mortgage Insurance (PMI / MIP)</th>
                                    <th className="p-3">Credit Score Minimum</th>
                                    <th className="p-3">Primary Target Buyer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Conventional (First-Time Buyer)</td>
                                    <td className="p-3 font-bold text-indigo-600">3.0%</td>
                                    <td className="p-3">PMI required until 20% equity is established</td>
                                    <td className="p-3">620+</td>
                                    <td className="p-3">First-time buyers with strong credit scores</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">FHA Loan (Federal Housing Admin)</td>
                                    <td className="p-3 font-bold text-indigo-600">3.5%</td>
                                    <td className="p-3">Upfront MIP (1.75%) + Annual MIP (0.55%)</td>
                                    <td className="p-3">580+ (500 with 10% down)</td>
                                    <td className="p-3">Buyers with lower credit or moderate savings</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">VA Loan (Veterans Affairs)</td>
                                    <td className="p-3 font-bold text-emerald-600">0.0%</td>
                                    <td className="p-3">No monthly PMI (One-time VA Funding Fee applies)</td>
                                    <td className="p-3">No strict statutory min (typically 620)</td>
                                    <td className="p-3">Eligible US military service members & veterans</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">USDA Loan (Rural Development)</td>
                                    <td className="p-3 font-bold text-emerald-600">0.0%</td>
                                    <td className="p-3">Upfront Guarantee (1.0%) + Annual Fee (0.35%)</td>
                                    <td className="p-3">640+</td>
                                    <td className="p-3">Low-to-moderate income buyers in designated rural zones</td>
                                </tr>
                                <tr className="bg-indigo-50/40 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Standard Conventional (PMI-Free)</td>
                                    <td className="p-3 font-bold text-slate-900">20.0%</td>
                                    <td className="p-3 font-bold text-emerald-700">Zero PMI required</td>
                                    <td className="p-3">620+</td>
                                    <td className="p-3">Buyers seeking the lowest monthly payment & maximum equity</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Financial Trade-off Analysis: 5% vs 10% vs 20% Down */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Down Payment Trade-Off: Comparing 5%, 10%, and 20% Down
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the optimal down payment percentage requires balancing upfront liquidity against ongoing monthly debt service. To illustrate the long-term mathematical trade-offs, the table below examines a <strong>$450,000 home purchase</strong> financed on a 30-year fixed mortgage at a <strong>6.5% interest rate</strong> with standard property tax, insurance, and PMI estimates.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Metric / Parameter</th>
                                    <th className="p-3">5% Down Payment</th>
                                    <th className="p-3">10% Down Payment</th>
                                    <th className="p-3">20% Down Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Upfront Down Payment Cash</td>
                                    <td className="p-3 font-bold text-indigo-600">$22,500</td>
                                    <td className="p-3 font-bold text-indigo-600">$45,000</td>
                                    <td className="p-3 font-bold text-indigo-600">$90,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Financed Loan Balance</td>
                                    <td className="p-3">$427,500</td>
                                    <td className="p-3">$405,000</td>
                                    <td className="p-3">$360,000</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly Principal & Interest (P&I)</td>
                                    <td className="p-3">$2,702 / mo</td>
                                    <td className="p-3">$2,560 / mo</td>
                                    <td className="p-3 font-bold text-emerald-700">$2,275 / mo</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Estimated Monthly PMI</td>
                                    <td className="p-3 text-amber-700">$215 / mo (until Yr 8)</td>
                                    <td className="p-3 text-amber-700">$135 / mo (until Yr 5)</td>
                                    <td className="p-3 font-bold text-emerald-700">$0 / mo (None)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Estimated Total Monthly Mortgage</td>
                                    <td className="p-3 font-bold text-slate-900">$3,417 / mo</td>
                                    <td className="p-3 font-bold text-slate-900">$3,195 / mo</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$2,775 / mo</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">30-Year Total Lifetime Interest</td>
                                    <td className="p-3">$545,280</td>
                                    <td className="p-3">$516,581</td>
                                    <td className="p-3 font-bold text-emerald-700">$459,183</td>
                                </tr>
                                <tr className="bg-emerald-50/40">
                                    <td className="p-3 font-semibold text-slate-900">Total Lifetime Savings vs 5% Down</td>
                                    <td className="p-3 text-slate-400">Baseline</td>
                                    <td className="p-3 text-slate-700 font-semibold">+$36,799</td>
                                    <td className="p-3 font-extrabold text-emerald-700">+$106,737</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Closing Costs Demystified */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Landmark className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Closing Costs Breakdown: Essential Cash Due at Settlement
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A frequent pitfall for prospective buyers is saving solely for the down payment while neglecting mandatory <strong>closing costs</strong>. Closing costs encompass administrative, legal, lender, and prepaid escrow expenses required to convey property title and originate the mortgage. Closing costs typically range from <strong>2.0% to 5.0% of the loan amount</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Non-Recurring Settlement Fees
                            </h3>
                            <ul className="list-disc list-inside space-y-1.5">
                                <li><strong>Loan Origination & Underwriting:</strong> 0.5% - 1.0% of loan balance ($2,000 - $4,500)</li>
                                <li><strong>Lender & Owner Title Insurance:</strong> Comprehensive title search and defect guarantee ($1,200 - $2,500)</li>
                                <li><strong>Professional Appraisal & Home Inspection:</strong> Independent property valuation & structural check ($500 - $1,000)</li>
                                <li><strong>Settlement & Recording Fees:</strong> Legal closing attorney fees and county deed recording ($600 - $1,400)</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-indigo-600" /> Prepaid Escrows & Recurring Reserves
                            </h3>
                            <ul className="list-disc list-inside space-y-1.5">
                                <li><strong>Property Tax Escrow Reserves:</strong> 2 to 6 months of local municipal taxes placed in escrow upfront ($1,500 - $4,500)</li>
                                <li><strong>Homeowners Insurance Premium:</strong> 1 full annual policy year prepaid at closing ($1,200 - $2,400)</li>
                                <li><strong>Prepaid Daily Mortgage Interest:</strong> Daily per-diem interest spanning settlement day to month-end ($400 - $1,200)</li>
                                <li><strong>HOA Transfer Fees & Capital Contribution:</strong> Association setup charges where applicable ($250 - $800)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Mathematical Calculation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Example: Compound Growth in an HYSA
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how high-yield savings interest accelerates your home purchase timeline, consider an aspiring buyer targeting a <strong>$450,000 median home</strong> with a <strong>10% down payment</strong> and <strong>3.0% closing costs</strong>:
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Timeline Formula With Monthly Compounding
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Total Goal = (Price × Down%) + (Price × Closing%) = ($450,000 × 0.10) + ($450,000 × 0.03) = $58,500
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            With an initial savings balance of $15,000, recurring monthly deposits of $800, and a 4.5% annual HYSA yield (monthly rate $r/12 = 0.375\%$), the balance reaches $58,500 in <strong>47 months (3 years, 11 months)</strong>. Compounding interest yields <strong>$5,900+</strong> in passive growth, shaving over 7 months off a non-interest-bearing checking account plan.
                        </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Milestone Year</th>
                                    <th className="p-3">Starting Balance</th>
                                    <th className="p-3">Annual Contributions</th>
                                    <th className="p-3">HYSA Interest Earned</th>
                                    <th className="p-3">Ending Balance</th>
                                    <th className="p-3">Target Progress</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 1 (Month 12)</td>
                                    <td className="p-3">$15,000</td>
                                    <td className="p-3">$9,600</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$913</td>
                                    <td className="p-3 font-bold text-slate-900">$25,513</td>
                                    <td className="p-3 text-indigo-600 font-bold">43.6%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 2 (Month 24)</td>
                                    <td className="p-3">$25,513</td>
                                    <td className="p-3">$9,600</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$1,398</td>
                                    <td className="p-3 font-bold text-slate-900">$36,511</td>
                                    <td className="p-3 text-indigo-600 font-bold">62.4%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 3 (Month 36)</td>
                                    <td className="p-3">$36,511</td>
                                    <td className="p-3">$9,600</td>
                                    <td className="p-3 text-emerald-600 font-semibold">+$1,906</td>
                                    <td className="p-3 font-bold text-slate-900">$48,017</td>
                                    <td className="p-3 text-indigo-600 font-bold">82.1%</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 4 (Month 47 - Target Reached)</td>
                                    <td className="p-3 font-semibold text-slate-900">$48,017</td>
                                    <td className="p-3">$8,800 (11 mos)</td>
                                    <td className="p-3 text-emerald-600 font-bold">+$1,732</td>
                                    <td className="p-3 font-extrabold text-indigo-600">$58,549</td>
                                    <td className="p-3 font-extrabold text-emerald-600">100.0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: Actionable Strategies to Fast-Track Your Down Payment */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Strategic Framework: 5 Ways to Accelerate Your Buying Timeline
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> 1. Maximize High-Yield Savings Accounts (HYSA)
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Traditional bank checking accounts yield near 0.01% APY. A dedicated FDIC-insured HYSA yielding 4.0% to 5.0% APY allows your principal to generate risk-free compound interest while preserving 100% liquidity.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> 2. Automate Direct-Deposit Payday Splits
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Configure your employer payroll direct deposit to route a fixed percentage (e.g., $400 per bi-weekly paycheck) directly into your house fund before it hits your checking account, eliminating lifestyle spending creep.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> 3. Investigate State & Municipal DPA Grants
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Many state housing finance agencies (HFAs) provide first-time homebuyer Down Payment Assistance (DPA) programs that offer forgivable second loans or direct cash grants covering 2% to 5% of purchase prices.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> 4. Allocate 100% of Windfalls & Tax Refunds
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Channel lump-sum windfalls including annual employer bonuses, federal tax refunds, side-hustle revenue, or cash gifts directly into your down payment balance to eliminate months of waiting.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 md:col-span-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> 5. Optimize Debt-to-Income (DTI) to Unlock Lower Mortgage Rates
                            </h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                                Paying down high-interest credit card debt and auto loans before applying for a mortgage lowers your Debt-to-Income ratio (target below 36%), which can qualify you for tier-1 interest rates and save tens of thousands in lifetime interest.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Where to Park Down Payment Savings */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Where to Keep Your Down Payment: Cash vs CDs vs Index Funds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The optimal vehicle for your down payment fund depends on your target buying horizon. Short-term funds must prioritize principal preservation over volatile market returns.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Savings Vehicle</th>
                                    <th className="p-3">Timeline Horizon</th>
                                    <th className="p-3">Principal Risk</th>
                                    <th className="p-3">Liquidity Access</th>
                                    <th className="p-3">Best Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">High-Yield Savings (HYSA)</td>
                                    <td className="p-3 font-bold text-indigo-600">0 to 3 Years</td>
                                    <td className="p-3 font-bold text-emerald-700">Zero (FDIC Insured to $250k)</td>
                                    <td className="p-3">Immediate (1-2 business days)</td>
                                    <td className="p-3">Active buyers and monthly savers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Certificates of Deposit (CDs)</td>
                                    <td className="p-3 font-bold text-indigo-600">1 to 2 Years</td>
                                    <td className="p-3 font-bold text-emerald-700">Zero (FDIC Insured)</td>
                                    <td className="p-3">Locked until maturity (early penalty)</td>
                                    <td className="p-3">Lump sum capital locking in guaranteed yield</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Treasury Bills (T-Bills)</td>
                                    <td className="p-3 font-bold text-indigo-600">3 to 12 Months</td>
                                    <td className="p-3 font-bold text-emerald-700">Zero (US Govt Backed)</td>
                                    <td className="p-3">High secondary market liquidity</td>
                                    <td className="p-3">State-tax-exempt short-term yield optimization</td>
                                </tr>
                                <tr className="bg-amber-50/40 hover:bg-amber-50">
                                    <td className="p-3 font-semibold text-slate-900">Stock Index Funds (S&P 500)</td>
                                    <td className="p-3 font-bold text-amber-700">5+ Years Only</td>
                                    <td className="p-3 font-bold text-rose-600">High Short-Term Volatility</td>
                                    <td className="p-3">Immediate (subject to tax/loss)</td>
                                    <td className="p-3">Long-range planners willing to delay home purchase in downturns</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 7: Home Buyer Readiness Checklist */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete Homebuyer Readiness & Financial Verification Checklist
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-indigo-700">
                                <ArrowRight className="w-4 h-4" /> 1. Credit & Debt Health
                            </h3>
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>Check credit reports across all 3 bureaus for errors.</li>
                                <li>Aim for a 740+ credit score for optimal mortgage interest rates.</li>
                                <li>Keep credit card utilization below 10% on all revolving lines.</li>
                                <li>Avoid opening new auto loans or credit lines before settlement.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-indigo-700">
                                <ArrowRight className="w-4 h-4" /> 2. Cash Reserves & Escrow
                            </h3>
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>Full target down payment saved and seasoned in HYSA.</li>
                                <li>2% to 5% closing cost reserve allocated separately.</li>
                                <li>3 to 6 months of separate emergency living expenses retained.</li>
                                <li>Gift funds accompanied by an official non-repayable gift letter.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-indigo-700">
                                <ArrowRight className="w-4 h-4" /> 3. Documentation & Pre-Approval
                            </h3>
                            <ul className="space-y-1.5 list-disc list-inside">
                                <li>2 years of federal W-2s / 1099 tax returns compiled.</li>
                                <li>Last 60 days of consecutive checking and savings statements.</li>
                                <li>Last 30 days of standard pay stubs ready for underwriters.</li>
                                <li>Full Verified Pre-Approval letter obtained from lender.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 8: Static Border-Highlighted FAQ */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 min-w-0">
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
                                How much down payment do I actually need to buy a home?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While 20% down eliminates Private Mortgage Insurance (PMI), conventional mortgages frequently permit as low as 3% down for qualified first-time buyers, FHA loans require 3.5%, and VA or USDA loans often permit 0% down.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are closing costs and why should they be budgeted alongside a down payment?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Closing costs comprise lender origination fees, home appraisal charges, title insurance, attorney fees, escrow property taxes, and homeowners insurance prepayments. They typically total between 2% and 5% of the total loan amount and must be paid in cash at settlement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Where should I keep my down payment savings while working toward my goal?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Down payment funds targeted for use within 1 to 5 years should generally be kept in low-risk, liquid vehicles such as FDIC-insured High-Yield Savings Accounts (HYSA), short-term Certificates of Deposit (CDs), or Treasury bills to protect principal from market fluctuations while earning yield.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Private Mortgage Insurance (PMI) work if I put down less than 20%?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                PMI is an insurance premium that protects the lender in case of loan default. It typically costs between 0.5% and 1.5% of the initial loan balance per year. Once your home equity reaches 20% on a conventional mortgage, PMI can be cancelled upon request.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I put 20% down or opt for a smaller down payment and invest the rest?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Putting 20% down eliminates monthly PMI fees and reduces your ongoing mortgage payment and total lifetime interest. However, a smaller down payment (5% to 10%) preserves liquidity for emergency reserves, home maintenance, or higher-yielding long-term index investments. The right choice depends on your prevailing mortgage interest rate versus market expected returns.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use gifted money or retirement accounts for my down payment?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Most conventional and FHA loan programs permit down payment gift funds from immediate family members, provided you submit an official gift letter stating no repayment is expected. Additionally, first-time home buyers may withdraw up to $10,000 penalty-free from traditional or Roth IRAs under IRS qualified first-time homebuyer exemptions.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 9: Essential Legal Disclaimer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, lending, legal, or investment advice. Results are estimates based on user inputs and assumed parameters. Consult with a licensed mortgage loan officer or financial advisor for personalized loan pre-approval.
                    </p>
                </section>

            </div>
        </div>
    );
}