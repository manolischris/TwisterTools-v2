"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    PiggyBank,
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
    TrendingUp,
    Scale,
    Flame,
    ArrowUpRight,
    Briefcase,
    Target,
    Layers,
    PieChart,
    Wallet,
    Award
} from "lucide-react";

interface YearlyScheduleRow {
    age: number;
    year: number;
    startingBalance: number;
    annualContribution: number;
    employerMatch: number;
    investmentGrowth: number;
    endingBalance: number;
    totalContributions: number;
    totalGrowth: number;
}

interface Preset {
    id: string;
    label: string;
    currentAge: number;
    retirementAge: number;
    savings: number;
    monthlyContribution: number;
    annualReturn: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "early-career-25",
        label: "Early Career (Age 25)",
        currentAge: 25,
        retirementAge: 65,
        savings: 15000,
        monthlyContribution: 500,
        annualReturn: 7.5,
        tag: "High Growth Horizon"
    },
    {
        id: "mid-career-40",
        label: "Mid-Career Catch Up (Age 40)",
        currentAge: 40,
        retirementAge: 67,
        savings: 120000,
        monthlyContribution: 1200,
        annualReturn: 7.0,
        tag: "Moderate Aggressive"
    },
    {
        id: "fire-30",
        label: "F.I.R.E. Track (Age 30)",
        currentAge: 30,
        retirementAge: 50,
        savings: 75000,
        monthlyContribution: 2500,
        annualReturn: 8.0,
        tag: "Early Retirement"
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
    // Parse string, stripping undesirable leading zeros like "0100" -> 100
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function RetirementCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [currentAge, setCurrentAge] = useState<number>(30);
    const [retirementAge, setRetirementAge] = useState<number>(65);
    const [currentSavings, setCurrentSavings] = useState<number>(50000);
    const [monthlyContribution, setMonthlyContribution] = useState<number>(800);
    const [annualReturn, setAnnualReturn] = useState<number>(7.0);
    const [annualSalary, setAnnualSalary] = useState<number>(85000);
    const [employerMatchPercent, setEmployerMatchPercent] = useState<number>(4.0); // % of salary matched
    const [inflationRate, setInflationRate] = useState<number>(2.5);
    const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(5000); // Post-retirement goal

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Math Calculation Engine
    const calculationResults = useMemo(() => {
        const yearsToRetire = Math.max(0, retirementAge - currentAge);
        const totalMonths = yearsToRetire * 12;

        // Effective annual return after inflation adjustments
        const nominalMonthlyRate = annualReturn / 100 / 12;
        const inflationMonthlyRate = inflationRate / 100 / 12;

        // Employer match dollar amount
        const annualEmployerMatch = (annualSalary * (employerMatchPercent / 100));
        const monthlyEmployerMatch = annualEmployerMatch / 12;
        const totalMonthlyAddition = monthlyContribution + monthlyEmployerMatch;

        let currentNominalBalance = currentSavings;
        let cumulativeUserContributions = currentSavings;
        let cumulativeEmployerMatch = 0;
        let cumulativeGrowth = 0;

        const schedule: YearlyScheduleRow[] = [];
        const currentYear = new Date().getFullYear();

        let yearlyStartingBalance = currentSavings;
        let yearlyUserContrib = 0;
        let yearlyEmployerContrib = 0;
        let yearlyGrowth = 0;

        for (let month = 1; month <= totalMonths; month++) {
            const monthlyGrowth = currentNominalBalance * nominalMonthlyRate;
            currentNominalBalance += monthlyGrowth + totalMonthlyAddition;

            yearlyGrowth += monthlyGrowth;
            yearlyUserContrib += monthlyContribution;
            yearlyEmployerContrib += monthlyEmployerMatch;

            cumulativeGrowth += monthlyGrowth;
            cumulativeUserContributions += monthlyContribution;
            cumulativeEmployerMatch += monthlyEmployerMatch;

            // Record Annual Milestones
            if (month % 12 === 0 || month === totalMonths) {
                const yearIndex = Math.ceil(month / 12);
                schedule.push({
                    age: currentAge + yearIndex,
                    year: currentYear + yearIndex,
                    startingBalance: yearlyStartingBalance,
                    annualContribution: yearlyUserContrib,
                    employerMatch: yearlyEmployerContrib,
                    investmentGrowth: yearlyGrowth,
                    endingBalance: currentNominalBalance,
                    totalContributions: cumulativeUserContributions,
                    totalGrowth: cumulativeGrowth + cumulativeEmployerMatch,
                });

                yearlyStartingBalance = currentNominalBalance;
                yearlyUserContrib = 0;
                yearlyEmployerContrib = 0;
                yearlyGrowth = 0;
            }
        }

        const totalNominalNestEgg = currentNominalBalance;

        // Inflation adjusted balance formula: Balance / (1 + i)^n
        const inflationAdjustmentFactor = Math.pow(1 + inflationRate / 100, yearsToRetire);
        const totalRealPurchasingPower = totalNominalNestEgg / (inflationAdjustmentFactor || 1);

        // Standard 4% Safe Withdrawal Rate (SWR) Annual & Monthly Income
        const safeWithdrawalRate = 0.04;
        const annualSafeIncomeNominal = totalNominalNestEgg * safeWithdrawalRate;
        const monthlySafeIncomeNominal = annualSafeIncomeNominal / 12;

        const monthlySafeIncomeReal = totalRealPurchasingPower * safeWithdrawalRate / 12;

        // Target Nest Egg needed for desired income at 4% SWR
        const targetNestEggNeeded = (desiredMonthlyIncome * 12) / safeWithdrawalRate;
        const goalProgressPercent = targetNestEggNeeded > 0 ? Math.min(100, (totalNominalNestEgg / targetNestEggNeeded) * 100) : 0;

        const totalPrincipalInjected = cumulativeUserContributions + cumulativeEmployerMatch;
        const growthRatio = totalNominalNestEgg > 0 ? (cumulativeGrowth / totalNominalNestEgg) * 100 : 0;
        const contributionRatio = totalNominalNestEgg > 0 ? (totalPrincipalInjected / totalNominalNestEgg) * 100 : 0;

        return {
            yearsToRetire,
            totalNominalNestEgg,
            totalRealPurchasingPower,
            monthlySafeIncomeNominal,
            monthlySafeIncomeReal,
            cumulativeUserContributions,
            cumulativeEmployerMatch,
            cumulativeGrowth,
            targetNestEggNeeded,
            goalProgressPercent,
            schedule,
            growthRatio,
            contributionRatio,
        };
    }, [
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        annualReturn,
        annualSalary,
        employerMatchPercent,
        inflationRate,
        desiredMonthlyIncome
    ]);

    // Handle Presets Quick-Fills
    const applyPreset = (preset: Preset) => {
        setCurrentAge(preset.currentAge);
        setRetirementAge(preset.retirementAge);
        setCurrentSavings(preset.savings);
        setMonthlyContribution(preset.monthlyContribution);
        setAnnualReturn(preset.annualReturn);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setCurrentAge(30);
        setRetirementAge(65);
        setCurrentSavings(50000);
        setMonthlyContribution(800);
        setAnnualReturn(7.0);
        setAnnualSalary(85000);
        setEmployerMatchPercent(4.0);
        setInflationRate(2.5);
        setDesiredMonthlyIncome(5000);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Retirement Savings Projection (TwisterTools):
----------------------------------------
Current Age: ${currentAge} | Target Retirement Age: ${retirementAge} (${calculationResults.yearsToRetire} years horizon)
Current Savings: ${currencySymbol}${currentSavings.toLocaleString()}
Monthly Contribution: ${currencySymbol}${monthlyContribution.toLocaleString()}
Expected Return: ${annualReturn}% | Inflation Rate: ${inflationRate}%
----------------------------------------
Projected Nest Egg (Nominal): ${currencySymbol}${Math.round(calculationResults.totalNominalNestEgg).toLocaleString()}
Purchasing Power (Inflation-Adjusted): ${currencySymbol}${Math.round(calculationResults.totalRealPurchasingPower).toLocaleString()}
Est. Safe Monthly Retirement Income (4% Rule): ${currencySymbol}${Math.round(calculationResults.monthlySafeIncomeNominal).toLocaleString()} /mo
Goal Progress vs ${currencySymbol}${desiredMonthlyIncome.toLocaleString()}/mo Target: ${calculationResults.goalProgressPercent.toFixed(1)}%
----------------------------------------
Calculated at twistertools.com/tools/calculators/retirement-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Age", "Year", "Starting Balance", "User Contribution", "Employer Match", "Investment Growth", "Ending Balance", "Total Contributions", "Total Growth"];
        const csvRows = [
            headers.join(","),
            ...calculationResults.schedule.map((row) =>
                [
                    row.age,
                    row.year,
                    row.startingBalance.toFixed(2),
                    row.annualContribution.toFixed(2),
                    row.employerMatch.toFixed(2),
                    row.investmentGrowth.toFixed(2),
                    row.endingBalance.toFixed(2),
                    row.totalContributions.toFixed(2),
                    row.totalGrowth.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `retirement_projection_age_${currentAge}_to_${retirementAge}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Retirement Savings & Nest Egg Planner Calculator",
        "url": "https://twistertools.com/tools/calculators/retirement-calculator",
        "description": "Project your retirement nest egg, model compound growth with 401(k) employer matches, account for inflation, and plan safe 4% monthly withdrawals with our browser-native retirement planner.",
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
                "name": "What is the 4% Safe Withdrawal Rate (SWR) in retirement planning?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 4% Safe Withdrawal Rate originates from the Trinity Study. It suggests that retirees can withdraw 4% of their initial portfolio value in year one, adjusted annually for inflation, with a high probability that the portfolio will last at least 30 years without running out of money."
                }
            },
            {
                "@type": "Question",
                "name": "How does inflation affect my retirement nest egg over time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Inflation reduces the future purchasing power of money. A nominal nest egg of $1,000,000 in 30 years at a 2.5% inflation rate will only buy approximately $475,000 worth of goods in today's currency. Financial planners model real purchasing power to set realistic savings targets."
                }
            },
            {
                "@type": "Question",
                "name": "How does employer 401(k) matching accelerate compound growth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Employer matching acts as an immediate, guaranteed return on your contributions (often 50% or 100% up to a salary percentage). This extra principal expands the base sum on which market compound interest accumulates every single month."
                }
            },
            {
                "@type": "Question",
                "name": "What is the sequence of returns risk in early retirement?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sequence of returns risk refers to the order in which investment returns occur. Experiencing severe market downturns early in retirement while actively withdrawing capital can permanently deplete a portfolio much faster than experiencing downturns later in retirement."
                }
            },
            {
                "@type": "Question",
                "name": "What rate of return should I assume for retirement calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Historically, a diversified S&P 500 index portfolio has delivered roughly 9% to 10% average nominal annual returns over long periods. To remain conservative, most planners assume a nominal return of 6.0% to 7.5% depending on asset allocation."
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PiggyBank className="w-5 h-5 text-indigo-600" />
                                Planning Parameters
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
                            {/* Age Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Current Age
                                    </label>
                                    <input
                                        type="number"
                                        min="18"
                                        max="90"
                                        value={currentAge === 0 ? "" : currentAge}
                                        onChange={(e) => handleNumberInput(e, (val) => {
                                            const cleanVal = val === 0 ? 0 : Math.max(1, val);
                                            setCurrentAge(cleanVal);
                                            if (cleanVal >= retirementAge) setRetirementAge(cleanVal + 5);
                                            setActivePresetId(null);
                                        })}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Target className="w-4 h-4 text-indigo-600" /> Target Retire Age
                                    </label>
                                    <input
                                        type="number"
                                        min={currentAge + 1}
                                        max="100"
                                        value={retirementAge === 0 ? "" : retirementAge}
                                        onChange={(e) => { handleNumberInput(e, (val) => setRetirementAge(val === 0 ? 0 : Math.max(currentAge + 1, val))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Current Savings & Monthly Contribution */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Wallet className="w-4 h-4 text-indigo-600" /> Current Savings
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            value={currentSavings === 0 ? "" : currentSavings}
                                            onChange={(e) => { handleNumberInput(e, (val) => setCurrentSavings(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> Monthly Save
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={monthlyContribution === 0 ? "" : monthlyContribution}
                                            onChange={(e) => { handleNumberInput(e, (val) => setMonthlyContribution(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Expected Annual Return & Inflation Rate */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Percent className="w-4 h-4 text-indigo-600" /> Expected Return
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="25"
                                            step="0.1"
                                            value={annualReturn === 0 ? "" : annualReturn}
                                            onChange={(e) => { handleNumberInput(e, (val) => setAnnualReturn(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Flame className="w-4 h-4 text-indigo-600" /> Est. Inflation
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            step="0.1"
                                            value={inflationRate === 0 ? "" : inflationRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setInflationRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employer 401(k) Match & Target Goal Options */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Employer Match & Income Goal
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                            <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Annual Salary
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={annualSalary === 0 ? "" : annualSalary}
                                                onChange={(e) => handleNumberInput(e, (val) => setAnnualSalary(Math.max(0, val)))}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Employer Match %
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="15"
                                                step="0.5"
                                                value={employerMatchPercent === 0 ? "" : employerMatchPercent}
                                                onChange={(e) => handleNumberInput(e, (val) => setEmployerMatchPercent(Math.max(0, val)))}
                                                className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5 text-indigo-500" /> Desired Monthly Retirement Income
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={desiredMonthlyIncome === 0 ? "" : desiredMonthlyIncome}
                                            onChange={(e) => handleNumberInput(e, (val) => setDesiredMonthlyIncome(Math.max(0, val)))}
                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Sample Career Paths
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Nest Egg & Income Projection
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
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Projected Nest Egg</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalNominalNestEgg).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                                    <span>Purchasing Power:</span>
                                    <span className="font-bold">{currencySymbol}{Math.round(calculationResults.totalRealPurchasingPower).toLocaleString()}</span>
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Safe Monthly Income (4%)</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.monthlySafeIncomeNominal).toLocaleString()}
                                    <span className="text-xs font-normal text-slate-500"> /mo</span>
                                </p>
                                <p className="text-[11px] text-emerald-600 font-bold mt-1 bg-emerald-100/50 inline-block px-1.5 py-0.5 rounded">
                                    {calculationResults.goalProgressPercent.toFixed(1)}% of {currencySymbol}{desiredMonthlyIncome.toLocaleString()}/mo Goal
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-6">
                                {/* Visual Ratio Bar */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Nest Egg Composition (Contributions vs Compound Growth)
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                                Contributions: {currencySymbol}{Math.round(calculationResults.cumulativeUserContributions + calculationResults.cumulativeEmployerMatch).toLocaleString()} ({calculationResults.contributionRatio.toFixed(1)}%)
                                            </span>
                                            <span className="flex items-center gap-1.5 text-indigo-600">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                                Growth: {currencySymbol}{Math.round(calculationResults.cumulativeGrowth).toLocaleString()} ({calculationResults.growthRatio.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                className="bg-slate-800 h-full transition-all duration-500"
                                                style={{ width: `${calculationResults.contributionRatio}%` }}
                                            />
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-500"
                                                style={{ width: `${calculationResults.growthRatio}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Goal Progress Bar */}
                                <div className="space-y-2 pt-3 border-t border-slate-100">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700 uppercase tracking-wider">Income Goal Progress</span>
                                        <span className="font-bold text-indigo-600">{calculationResults.goalProgressPercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, calculationResults.goalProgressPercent)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                                        <span>Required Goal: {currencySymbol}{Math.round(calculationResults.targetNestEggNeeded).toLocaleString()}</span>
                                        <span>Current Horizon: {calculationResults.yearsToRetire} Years</span>
                                    </div>
                                </div>

                                {/* Component Breakdown */}
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Lifetime Capital Contributions
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-800"></div> User Direct Deposits
                                            </span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.cumulativeUserContributions).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500"></div> Employer 401(k) Match
                                            </span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.cumulativeEmployerMatch).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/60 border border-indigo-100">
                                            <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Compound Market Growth
                                            </span>
                                            <span className="font-extrabold text-indigo-900">{currencySymbol}{Math.round(calculationResults.cumulativeGrowth).toLocaleString()}</span>
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
                                            <th className="p-2.5">Age (Year)</th>
                                            <th className="p-2.5">User Contrib</th>
                                            <th className="p-2.5">Employer Match</th>
                                            <th className="p-2.5">Growth</th>
                                            <th className="p-2.5">End Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculationResults.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Age {row.age} ({row.year})</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.annualContribution).toLocaleString()}</td>
                                                <td className="p-2.5 text-sky-600 font-semibold">{currencySymbol}{Math.round(row.employerMatch).toLocaleString()}</td>
                                                <td className="p-2.5 text-indigo-600 font-semibold">{currencySymbol}{Math.round(row.investmentGrowth).toLocaleString()}</td>
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
                            Client-side browser calculation
                        </span>
                        <span>{calculationResults.yearsToRetire} Years to Horizon</span>
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

                {/* Card 1: Comprehensive Financial Definitions & Core Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Your Nest Egg & The Mathematics of Compound Wealth
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Planning for retirement requires understanding how recurring contributions combined with compound growth transform modest savings into financial independence. Rather than relying solely on wage growth, long-term wealth accumulation relies on exponential market interest compounding over multi-decade horizons.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-indigo-600" /> The 4% Safe Withdrawal Rule (SWR)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Based on historic financial market analysis (the Trinity Study), withdrawing 4% of your total portfolio balance in year one of retirement, adjusted annually for inflation, gives your nest egg an overwhelmingly high statistical chance of lasting 30+ years.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> Employer 401(k) Match Synergy
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                An employer match provides an immediate 50% to 100% return on invested salary fractions. Capturing full employer matches accelerates compound interest baselines without reducing additional personal take-home pay.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Nominal vs. Real Purchasing Power
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Nominal figures show the future dollar total on account statements, whereas real purchasing power reflects what those dollars will actually buy after subtracting historical cumulative inflation (typically 2% to 3% annually).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> The Rule of 72
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A quick mental math formula to estimate doubling time: Divide 72 by your expected annual interest rate. At a 7.2% expected annual return, your invested portfolio doubles approximately every 10 years.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Compound Interest & Future Value Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            Financial algorithms project total future nest egg accumulation using the standard Future Value of an Annuity formula with monthly compound periods:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            FV = P × (1 + r/n)^(n×t) + PMT × [ ((1 + r/n)^(n×t) - 1) / (r/n) ]
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>FV:</strong> Total Projected Future Nest Egg</div>
                            <div><strong>P:</strong> Current Starting Savings Balance</div>
                            <div><strong>PMT:</strong> Total Monthly Contribution (User + Match)</div>
                            <div><strong>r:</strong> Expected Annual Nominal Rate of Return</div>
                            <div><strong>n:</strong> Compounding Periods per Year (12)</div>
                            <div><strong>t:</strong> Investment Time Horizon in Years</div>
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
                            Step-by-Step Worked Example: 30-Year Retirement Projection
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To demonstrate how compound interest shifts wealth creation from active salary deposits to passive capital returns, examine this case study of an investor planning over 30 years:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Case Study Baseline Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Current Age / Target Retirement:</strong> Age 35 to Age 65 (30 Years)</li>
                            <li><strong>Starting Capital Balance:</strong> $50,000</li>
                            <li><strong>Monthly Personal Savings:</strong> $800 / month</li>
                            <li><strong>Employer 401(k) Match:</strong> $250 / month ($3,000 / year)</li>
                            <li><strong>Expected Annual Return:</strong> 7.0% (Compounded Monthly)</li>
                            <li><strong>Assumed Inflation Rate:</strong> 2.5% Annual</li>
                        </ul>
                    </div>

                    {/* Breakdown Milestone Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeline Milestone</th>
                                    <th className="p-3">Total User Outlay</th>
                                    <th className="p-3">Total Employer Match</th>
                                    <th className="p-3">Compound Growth</th>
                                    <th className="p-3">Projected Nest Egg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 5 (Age 40)</td>
                                    <td className="p-3">$98,000</td>
                                    <td className="p-3 text-slate-600 font-semibold">$15,000</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$29,384</td>
                                    <td className="p-3 font-bold text-slate-900">$142,384</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 15 (Age 50)</td>
                                    <td className="p-3">$194,000</td>
                                    <td className="p-3 text-slate-600 font-semibold">$45,000</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$176,211</td>
                                    <td className="p-3 font-bold text-slate-900">$415,211</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 25 (Age 60)</td>
                                    <td className="p-3">$290,000</td>
                                    <td className="p-3 text-slate-600 font-semibold">$75,000</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$588,623</td>
                                    <td className="p-3 font-bold text-slate-900">$953,623</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 30 (Age 65)</td>
                                    <td className="p-3 font-bold text-slate-900">$338,000</td>
                                    <td className="p-3 text-slate-900 font-bold">$90,000</td>
                                    <td className="p-3 text-indigo-600 font-bold">$997,831</td>
                                    <td className="p-3 font-extrabold text-emerald-600">$1,425,831</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Critical Insight:</strong> Out of the final <strong>$1,425,831</strong> nest egg, direct user contributions account for only <strong>$338,000</strong> (23.7%). Compound investment growth generated a massive <strong>$997,831</strong> (70.0%), while employer matching provided an additional <strong>$90,000</strong>. At a 4% SWR, this portfolio supports <strong>$4,752 / month</strong> in sustainable lifetime income.
                    </p>
                </section>

                {/* Card 3: Comparing Early Savings vs Late Catch-Up */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Cost of Delay: Early Investor vs. Late Catch-Up
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Time is the most potent factor in compound mathematics. Starting early allows market returns to work exponentially, requiring far less out-of-pocket savings than attempting to catch up later in life:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Strategy Scenario</th>
                                    <th className="p-3">Monthly Outlay</th>
                                    <th className="p-3">Years Investing</th>
                                    <th className="p-3">Total Saved Out-of-Pocket</th>
                                    <th className="p-3">Nest Egg at Age 65 (7% Return)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Early Starter (Ages 25–65)</td>
                                    <td className="p-3">$400 / month</td>
                                    <td className="p-3 font-bold text-indigo-600">40 Years</td>
                                    <td className="p-3 font-semibold text-slate-900">$192,000</td>
                                    <td className="p-3 text-emerald-600 font-bold">$1,049,828</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Mid Starter (Ages 35–65)</td>
                                    <td className="p-3">$800 / month</td>
                                    <td className="p-3 font-bold text-indigo-600">30 Years</td>
                                    <td className="p-3 font-semibold text-slate-900">$288,000</td>
                                    <td className="p-3 text-slate-900 font-bold">$975,992</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Late Catch-Up (Ages 45–65)</td>
                                    <td className="p-3">$1,800 / month</td>
                                    <td className="p-3 font-bold text-indigo-600">20 Years</td>
                                    <td className="p-3 font-semibold text-amber-700">$432,000</td>
                                    <td className="p-3 text-slate-900 font-bold">$937,600</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Optimization Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            4 Core Strategies to Maximize Your Retirement Nest Egg
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ArrowUpRight className="w-4 h-4" /> Automate Annual Contribution Increases
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Set your retirement plan to automatically increase contributions by 1% each year aligned with annual performance raises. This gradually scales your savings rate without noticeably reducing monthly discretionary cash flow.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <PieChart className="w-4 h-4" /> Leverage Tax-Advantaged Vehicles
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Utilize a mix of traditional pre-tax accounts (401k, Traditional IRA) for immediate tax deductions and Roth accounts (Roth IRA, Roth 401k) for completely tax-free withdrawals during retirement.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ShieldCheck className="w-4 h-4" /> Keep Investment Expenses Low
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                High mutual fund management fees (expense ratios above 1%) can eat up to 25% to 30% of your ultimate compound growth over 30 years. Opt for low-cost broad market index funds with expense ratios under 0.10%.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Layers className="w-4 h-4" /> Maintain Asset Allocation Discipline
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Maintain aggressive equity allocations (80%+ stocks) in early career stages to maximize long-term growth, then gradually shift toward fixed income and bonds as you approach your target retirement age to safeguard capital.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                What is the 4% Safe Withdrawal Rate (SWR) in retirement planning?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 4% Safe Withdrawal Rate originates from the Trinity Study. It suggests that retirees can withdraw 4% of their initial portfolio value in year one, adjusted annually for inflation, with a high probability that the portfolio will last at least 30 years without running out of money.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does inflation affect my retirement nest egg over time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Inflation reduces the future purchasing power of money. A nominal nest egg of $1,000,000 in 30 years at a 2.5% inflation rate will only buy approximately $475,000 worth of goods in today's currency. Financial planners model real purchasing power to set realistic savings targets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does employer 401(k) matching accelerate compound growth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Employer matching acts as an immediate, guaranteed return on your contributions (often 50% or 100% up to a salary percentage). This extra principal expands the base sum on which market compound interest accumulates every single month.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the sequence of returns risk in early retirement?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sequence of returns risk refers to the order in which investment returns occur. Experiencing severe market downturns early in retirement while actively withdrawing capital can permanently deplete a portfolio much faster than experiencing downturns later in retirement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What rate of return should I assume for retirement calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Historically, a diversified S&P 500 index portfolio has delivered roughly 9% to 10% average nominal annual returns over long periods. To remain conservative, most planners assume a nominal return of 6.0% to 7.5% depending on asset allocation.
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