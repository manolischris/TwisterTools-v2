"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Home,
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
    Calculator,
    AlertTriangle,
    Scale,
    PiggyBank,
    BookOpen,
    HelpCircle,
    Lightbulb,
    TrendingDown,
    Clock,
    FileSpreadsheet,
    ArrowRightLeft,
    CheckCircle2,
    XCircle,
    FileText
} from "lucide-react";

interface AmortizationPeriod {
    month: number;
    year: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
    cumulativeInterest: number;
}

interface RefinancePreset {
    id: string;
    label: string;
    tag: string;
    currBal: number;
    currRate: number;
    currYearsLeft: number;
    newRate: number;
    newYears: number;
    closingCosts: number;
    rollIntoLoan: boolean;
}

type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    "CAD/AUD": "$",
};

const PRESETS: RefinancePreset[] = [
    {
        id: "rate-and-term",
        label: "Rate & Term Drop (1% Lower)",
        tag: "-1.0% Rate",
        currBal: 350000,
        currRate: 6.75,
        currYearsLeft: 27,
        newRate: 5.75,
        newYears: 30,
        closingCosts: 5000,
        rollIntoLoan: false,
    },
    {
        id: "shorten-term",
        label: "30-Yr to 15-Yr Accelerator",
        tag: "15-Yr Payoff",
        currBal: 300000,
        currRate: 6.5,
        currYearsLeft: 25,
        newRate: 5.25,
        newYears: 15,
        closingCosts: 4500,
        rollIntoLoan: false,
    },
    {
        id: "aggressive-drop",
        label: "Large 2% Rate Reduction",
        tag: "-2.0% Rate",
        currBal: 420000,
        currRate: 7.25,
        currYearsLeft: 28,
        newRate: 5.25,
        newYears: 30,
        closingCosts: 6000,
        rollIntoLoan: true,
    },
];

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

export default function MortgageRefinanceCalculator() {
    // Current Loan State
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [currentBalance, setCurrentBalance] = useState<number>(350000);
    const [currentRate, setCurrentRate] = useState<number>(6.75);
    const [currentYearsRemaining, setCurrentYearsRemaining] = useState<number>(27);

    // New Refinance Loan State
    const [newRate, setNewRate] = useState<number>(5.5);
    const [newLoanTermYears, setNewLoanTermYears] = useState<number>(30);
    const [closingCosts, setClosingCosts] = useState<number>(5000);
    const [rollCostsIntoLoan, setRollCostsIntoLoan] = useState<boolean>(false);
    const [monthlyExtraPrepayment, setMonthlyExtraPrepayment] = useState<number>(0);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"summary" | "schedule">("summary");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Calculation Engine
    const results = useMemo(() => {
        const calculateMonthlyPI = (principal: number, annualRatePct: number, totalMonths: number): number => {
            if (principal <= 0 || totalMonths <= 0) return 0;
            if (annualRatePct <= 0) return principal / totalMonths;
            const r = annualRatePct / 100 / 12;
            const factor = Math.pow(1 + r, totalMonths);
            return (principal * (r * factor)) / (factor - 1);
        };

        const currentMonthsRemaining = Math.max(1, currentYearsRemaining * 12);
        const currentMonthlyPI = calculateMonthlyPI(currentBalance, currentRate, currentMonthsRemaining);

        const newStartingBalance = rollCostsIntoLoan ? currentBalance + closingCosts : currentBalance;
        const newTotalMonths = Math.max(1, newLoanTermYears * 12);
        const newMonthlyPI = calculateMonthlyPI(newStartingBalance, newRate, newTotalMonths);

        // Amortization Schedule for Current Loan
        let currBal = currentBalance;
        const currR = currentRate / 100 / 12;
        let currentTotalInterestRemaining = 0;

        for (let m = 1; m <= currentMonthsRemaining; m++) {
            const interest = currBal * currR;
            const principal = Math.min(currBal, currentMonthlyPI - interest);
            currentTotalInterestRemaining += interest;
            currBal = Math.max(0, currBal - principal);
            if (currBal <= 0) break;
        }
        const currentTotalCostRemaining = currentMonthlyPI * currentMonthsRemaining;

        // Amortization Schedule for Refinanced Loan
        let newBal = newStartingBalance;
        const newR = newRate / 100 / 12;
        let newTotalInterest = 0;
        let newActualMonths = 0;
        const newSchedule: AmortizationPeriod[] = [];
        let cumInterest = 0;

        for (let m = 1; m <= newTotalMonths; m++) {
            const interest = newBal * newR;
            const basePrincipal = newMonthlyPI - interest;
            const totalPrincipal = Math.min(newBal, basePrincipal + monthlyExtraPrepayment);
            const totalPayment = interest + totalPrincipal;

            cumInterest += interest;
            newTotalInterest += interest;
            newBal = Math.max(0, newBal - totalPrincipal);
            newActualMonths = m;

            if (m % 12 === 0 || newBal <= 0 || m === newTotalMonths) {
                newSchedule.push({
                    month: m,
                    year: Math.ceil(m / 12),
                    payment: totalPayment,
                    principal: totalPrincipal,
                    interest: interest,
                    balance: newBal,
                    cumulativeInterest: cumInterest,
                });
            }

            if (newBal <= 0) break;
        }

        const effectiveClosingCost = closingCosts;
        const monthlySavings = currentMonthlyPI - newMonthlyPI;
        const upfrontPaidOutOfPocket = rollCostsIntoLoan ? 0 : closingCosts;

        // Break-Even Month Calculation
        let breakEvenMonths: number | null = null;
        if (monthlySavings > 0) {
            breakEvenMonths = Math.ceil(effectiveClosingCost / monthlySavings);
        }

        const newTotalLifetimeCost = (newMonthlyPI * newTotalMonths) + (rollCostsIntoLoan ? 0 : closingCosts);
        const lifetimeNetSavings = currentTotalCostRemaining - newTotalLifetimeCost;
        const lifetimeInterestSavings = currentTotalInterestRemaining - newTotalInterest;

        return {
            currentMonthlyPI,
            newMonthlyPI,
            monthlySavings,
            breakEvenMonths,
            currentTotalInterestRemaining,
            newTotalInterest,
            lifetimeInterestSavings,
            currentTotalCostRemaining,
            newTotalLifetimeCost,
            lifetimeNetSavings,
            newStartingBalance,
            newActualMonths,
            newSchedule,
            upfrontPaidOutOfPocket,
        };
    }, [currentBalance, currentRate, currentYearsRemaining, newRate, newLoanTermYears, closingCosts, rollCostsIntoLoan, monthlyExtraPrepayment]);

    const applyPreset = (preset: RefinancePreset) => {
        setCurrentBalance(preset.currBal);
        setCurrentRate(preset.currRate);
        setCurrentYearsRemaining(preset.currYearsLeft);
        setNewRate(preset.newRate);
        setNewLoanTermYears(preset.newYears);
        setClosingCosts(preset.closingCosts);
        setRollCostsIntoLoan(preset.rollIntoLoan);
        setMonthlyExtraPrepayment(0);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setCurrentBalance(350000);
        setCurrentRate(6.75);
        setCurrentYearsRemaining(27);
        setNewRate(5.5);
        setNewLoanTermYears(30);
        setClosingCosts(5000);
        setRollCostsIntoLoan(false);
        setMonthlyExtraPrepayment(0);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const breakEvenStr = results.breakEvenMonths !== null
            ? `${results.breakEvenMonths} Months (${(results.breakEvenMonths / 12).toFixed(1)} Years)`
            : "N/A (No monthly savings)";

        const summaryText = `Mortgage Refinance & Break-Even Analysis (TwisterTools):
------------------------------------------------------
Current Loan Balance: ${currencySymbol}${currentBalance.toLocaleString()}
Current Interest Rate: ${currentRate}% (${currentYearsRemaining} Years Left)
Current Monthly Payment: ${currencySymbol}${results.currentMonthlyPI.toFixed(2)}/mo
------------------------------------------------------
New Loan Amount: ${currencySymbol}${results.newStartingBalance.toLocaleString()}
New Interest Rate: ${newRate}% (${newLoanTermYears} Years)
New Monthly Payment: ${currencySymbol}${results.newMonthlyPI.toFixed(2)}/mo
Refinance Closing Costs: ${currencySymbol}${closingCosts.toLocaleString()} (${rollCostsIntoLoan ? "Rolled into loan" : "Paid out-of-pocket"})
------------------------------------------------------
Monthly Cashflow Difference: ${results.monthlySavings >= 0 ? "+" : ""}${currencySymbol}${results.monthlySavings.toFixed(2)}/mo
Break-Even Horizon: ${breakEvenStr}
Net Lifetime Savings: ${currencySymbol}${Math.round(results.lifetimeNetSavings).toLocaleString()}
Total Lifetime Interest Saved: ${currencySymbol}${Math.round(results.lifetimeInterestSavings).toLocaleString()}
------------------------------------------------------
Calculated at twistertools.com/tools/calculators/mortgage-refinance-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Month Milestone", "Estimated Payment", "Principal Portion", "Interest Portion", "Remaining Balance", "Cumulative Interest"];
        const csvRows = [
            headers.join(","),
            ...results.newSchedule.map((row) =>
                [
                    row.year,
                    row.month,
                    row.payment.toFixed(2),
                    row.principal.toFixed(2),
                    row.interest.toFixed(2),
                    row.balance.toFixed(2),
                    row.cumulativeInterest.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `mortgage_refinance_amortization_${newLoanTermYears}yr.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Refinance Break-Even & Interest Savings Calculator",
        "url": "https://twistertools.com/tools/calculators/mortgage-refinance-calculator",
        "description": "Calculate your mortgage refinance break-even point in months, evaluate monthly payment reductions, compare total lifetime interest savings, and download full amortization schedules.",
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
                "name": "How is the mortgage refinance break-even point calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The break-even point is calculated by dividing total closing costs by monthly payment savings (Break-Even in Months = Total Refinance Costs / Monthly Savings). For example, $6,000 in closing costs with a $200 monthly savings takes 30 months (2.5 years) to break even."
                }
            },
            {
                "@type": "Question",
                "name": "Is it worth refinancing for a 0.5% or 1% lower interest rate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Refinancing for a 0.5% to 1.0% interest rate reduction is generally worthwhile if you plan to stay in the property longer than the break-even period. On a $400,000 balance, a 1% rate reduction saves roughly $250 to $270 per month."
                }
            },
            {
                "@type": "Question",
                "name": "Should I pay closing costs upfront or roll them into the new loan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Paying closing costs out of pocket avoids paying interest on those fees over 15 to 30 years. Rolling closing costs into the loan balance conserves immediate liquid cash but increases the principal, resulting in higher monthly payments and extra interest over the loan duration."
                }
            },
            {
                "@type": "Question",
                "name": "What happens if I reset my 30-year mortgage after paying for 5 years?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Resetting to a new 30-year term stretches your debt over 35 total years. While this lowers your required monthly payment, it often increases the total lifetime interest paid unless you choose a shorter term (such as 20 or 15 years) or make voluntary principal prepayments."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Markup */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Current & New Mortgage Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Refinance Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Inputs
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
                            </select>
                        </div>

                        <div className="space-y-6">
                            {/* Section 1: Current Loan Profile */}
                            <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Home className="w-4 h-4 text-slate-500" /> Existing Mortgage Terms
                                </span>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-semibold text-slate-700">Remaining Balance</label>
                                        <span className="text-xs font-bold text-slate-900">{currencySymbol}{currentBalance.toLocaleString()}</span>
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="5000"
                                            value={currentBalance === 0 ? "" : currentBalance}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setCurrentBalance(Math.max(0, val)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Current Interest Rate (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="25"
                                                step="0.125"
                                                value={currentRate === 0 ? "" : currentRate}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setCurrentRate(Math.max(0, val)));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Years Remaining</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="40"
                                            value={currentYearsRemaining === 0 ? "" : currentYearsRemaining}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setCurrentYearsRemaining(Math.max(1, Math.min(40, val))));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Refinance Loan Terms */}
                            <div className="space-y-3.5 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100">
                                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-600" /> Proposed Refinance Terms
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">New Interest Rate (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                max="25"
                                                step="0.125"
                                                value={newRate === 0 ? "" : newRate}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setNewRate(Math.max(0, val)));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">New Term Length</label>
                                        <select
                                            value={newLoanTermYears}
                                            onChange={(e) => {
                                                setNewLoanTermYears(Number(e.target.value));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        >
                                            <option value={30}>30 Years (Fixed)</option>
                                            <option value={20}>20 Years (Fixed)</option>
                                            <option value={15}>15 Years (Fixed)</option>
                                            <option value={10}>10 Years (Fixed)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-semibold text-slate-700">Closing Costs</label>
                                            <span className="text-[11px] font-bold text-indigo-600">{currencySymbol}{closingCosts.toLocaleString()}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="250"
                                                value={closingCosts === 0 ? "" : closingCosts}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setClosingCosts(Math.max(0, val)));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Optional Monthly Prepayment</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={monthlyExtraPrepayment === 0 ? "" : monthlyExtraPrepayment}
                                                onChange={(e) => handleNumberInput(e, (val) => setMonthlyExtraPrepayment(Math.max(0, val)))}
                                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Financing Option Toggle */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 select-none">
                                        <input
                                            type="checkbox"
                                            checked={rollCostsIntoLoan}
                                            onChange={(e) => {
                                                setRollCostsIntoLoan(e.target.checked);
                                                setActivePresetId(null);
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Roll closing costs into new loan balance (Finance Fees)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Fast Scenario Presets */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Comparison Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Active Scenario
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
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
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
                            {copied ? "Copied Analysis" : "Copy Refinance Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Break-Even Metrics & Visual Schedules */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Refinance Evaluation
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("summary")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "summary" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Cost Comparison
                                </button>
                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "schedule" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    New Amortization
                                </button>
                            </div>
                        </div>

                        {/* Top Hero Highlight Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            {/* Card 1: Break-Even Period */}
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Break-Even Timeline
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {results.breakEvenMonths !== null ? `${results.breakEvenMonths} Mos` : "No Payoff"}
                                </p>
                                <p className="text-[11px] text-indigo-700 font-medium mt-1">
                                    {results.breakEvenMonths !== null
                                        ? `Takes ${(results.breakEvenMonths / 12).toFixed(1)} years to recover fees`
                                        : "Monthly cost is equal or higher"}
                                </p>
                            </div>

                            {/* Card 2: Monthly Cashflow Impact */}
                            <div className={`p-4 rounded-xl border ${results.monthlySavings >= 0 ? "bg-emerald-50/70 border-emerald-100" : "bg-rose-50/70 border-rose-100"}`}>
                                <p className={`text-xs font-bold uppercase tracking-wider ${results.monthlySavings >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                    Monthly Cashflow Delta
                                </p>
                                <p className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-1">
                                    {results.monthlySavings >= 0 ? "+" : ""}{currencySymbol}{Math.round(results.monthlySavings).toLocaleString()}
                                    <span className="text-xs font-semibold text-slate-500">/mo</span>
                                </p>
                                <p className={`text-[11px] font-medium mt-1 ${results.monthlySavings >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                    {results.monthlySavings >= 0 ? "Reduction in monthly P&I payment" : "Higher monthly payment (e.g. shorter term)"}
                                </p>
                            </div>
                        </div>

                        {/* View Content Switcher */}
                        {activeTab === "summary" ? (
                            <div className="space-y-5">
                                {/* Side-by-Side Comparison Metric Table */}
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Financial Metric</th>
                                                <th className="p-3">Current Loan</th>
                                                <th className="p-3 bg-indigo-50/50 text-indigo-950 font-bold">Refinanced Loan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                            <tr className="hover:bg-slate-50/80">
                                                <td className="p-3 font-semibold text-slate-900">Principal Starting Sum</td>
                                                <td className="p-3">{currencySymbol}{currentBalance.toLocaleString()}</td>
                                                <td className="p-3 bg-indigo-50/30 font-bold text-slate-900">{currencySymbol}{results.newStartingBalance.toLocaleString()}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/80">
                                                <td className="p-3 font-semibold text-slate-900">Interest Rate / Term</td>
                                                <td className="p-3">{currentRate}% ({currentYearsRemaining} yrs)</td>
                                                <td className="p-3 bg-indigo-50/30 font-bold text-indigo-700">{newRate}% ({newLoanTermYears} yrs)</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/80">
                                                <td className="p-3 font-semibold text-slate-900">Monthly P&I Payment</td>
                                                <td className="p-3 font-bold text-slate-900">{currencySymbol}{results.currentMonthlyPI.toFixed(2)}</td>
                                                <td className="p-3 bg-indigo-50/30 font-extrabold text-indigo-600">{currencySymbol}{results.newMonthlyPI.toFixed(2)}</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/80">
                                                <td className="p-3 font-semibold text-slate-900">Total Future Interest</td>
                                                <td className="p-3 text-slate-700">{currencySymbol}{Math.round(results.currentTotalInterestRemaining).toLocaleString()}</td>
                                                <td className="p-3 bg-indigo-50/30 font-bold text-slate-900">{currencySymbol}{Math.round(results.newTotalInterest).toLocaleString()}</td>
                                            </tr>
                                            <tr className="bg-slate-50 font-bold">
                                                <td className="p-3 text-slate-900">Net Lifetime Savings</td>
                                                <td className="p-3 text-slate-400">—</td>
                                                <td className={`p-3 ${results.lifetimeNetSavings >= 0 ? "text-emerald-600 font-extrabold" : "text-rose-600 font-extrabold"}`}>
                                                    {results.lifetimeNetSavings >= 0 ? "+" : ""}{currencySymbol}{Math.round(results.lifetimeNetSavings).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Break-Even Visual Progress Bar */}
                                {results.breakEvenMonths !== null && (
                                    <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span className="flex items-center gap-1.5">
                                                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                                                Closing Fee: {currencySymbol}{closingCosts.toLocaleString()}
                                            </span>
                                            <span className="text-indigo-600 font-bold">
                                                100% Recouped at Month {results.breakEvenMonths}
                                            </span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, Math.max(8, (12 / (results.breakEvenMonths || 1)) * 100))}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-500">
                                            <span>Month 0 (Closing)</span>
                                            <span>Year 1</span>
                                            <span>Break-Even ({results.breakEvenMonths} mo)</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* New Loan Amortization Schedule Table */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Month</th>
                                            <th className="p-2.5">Principal</th>
                                            <th className="p-2.5">Interest</th>
                                            <th className="p-2.5">Remaining Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {results.newSchedule.map((row) => (
                                            <tr key={row.month} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Yr {row.year}</td>
                                                <td className="p-2.5">Mo {row.month}</td>
                                                <td className="p-2.5 font-semibold text-indigo-700">{currencySymbol}{Math.round(row.principal).toLocaleString()}</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.interest).toLocaleString()}</td>
                                                <td className="p-2.5 font-bold text-slate-900">{currencySymbol}{Math.round(row.balance).toLocaleString()}</td>
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
                            Private browser calculation
                        </span>
                        <span>Full amortization simulation</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Disclaimer:</strong> This refinance calculator provides estimates for comparison and planning purposes only. It excludes localized property taxes, homeowner's insurance (HOI), private mortgage insurance (PMI), and lender escrow fluctuations. Consult a licensed mortgage professional or certified financial planner before executing loan modifications.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Core Financial Architecture of Mortgage Refinancing */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Mortgage Refinancing Works: Financial Mechanics & Objectives
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Mortgage refinancing</strong> is the process of replacing an existing home loan with a new mortgage structured under different interest rates, term lengths, or principal balances. The proceeds of the new loan pay off the outstanding balance of the original mortgage in full, leaving the homeowner with a single, restructured monthly payment obligation.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Borrowers generally pursue refinancing to achieve one of three primary financial outcomes:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-700 text-sm">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <TrendingDown className="w-4 h-4 text-emerald-600" /> Rate & Term Reduction
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Lowering the annual percentage rate (APR) to reduce monthly cash outflows and minimize cumulative lifetime interest payments.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-indigo-600" /> Term Acceleration
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Converting a 30-year mortgage into a 15-year or 20-year term to eliminate mortgage debt rapidly and save substantial interest over time.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                                <ArrowRightLeft className="w-4 h-4 text-amber-600" /> Adjustable-to-Fixed
                            </h3>
                            <p className="text-slate-600 text-xs leading-relaxed">
                                Transitioning an Adjustable-Rate Mortgage (ARM) into a predictable Fixed-Rate Mortgage to hedge against future interest rate volatility.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Break-Even Mathematical Equation & Worked Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Break-Even Formula: Step-by-Step Mathematical Calculation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The <strong>break-even horizon</strong> represents the exact duration (in months) required for monthly cashflow savings to fully offset the upfront closing costs and origination fees incurred during refinancing.
                    </p>

                    {/* Master Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Break-Even Equation
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Break-Even (Months) = Total Refinance Closing Costs / (Old Monthly P&I - New Monthly P&I)
                        </div>
                        <p className="text-xs text-slate-300">
                            Where Monthly Principal & Interest (P&I) is calculated using standard amortization mathematics:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
                            PMT = P × [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
                        </div>
                    </div>

                    {/* Step-by-Step Concrete Example */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" /> Real-World Worked Scenario:
                        </h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Current Remaining Balance:</strong> $350,000 at 6.75% (27 Years Left) = <strong>$2,398.24/month</strong></li>
                            <li><strong>New Proposed Loan:</strong> $350,000 at 5.50% (30-Year Fixed) = <strong>$1,987.26/month</strong></li>
                            <li><strong>Closing Costs & Origination Fees:</strong> $5,000</li>
                            <li><strong>Monthly Cashflow Savings:</strong> $2,398.24 - $1,987.26 = <strong>$410.98/month</strong></li>
                            <li><strong>Break-Even Calculation:</strong> $5,000 / $410.98 = <strong>12.16 Months (1.01 Years)</strong></li>
                        </ul>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In this scenario, after Month 13, the homeowner has fully recouped their closing costs and generates pure financial savings of <strong>$410.98 every month</strong> thereafter.
                    </p>
                </section>

                {/* Card 3: Comparing 30-Year vs 15-Year Refinance Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Strategic Trade-Off: 30-Year Reset vs. 15-Year Acceleration
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate loan term involves evaluating cashflow flexibility against cumulative lifetime interest expense:
                    </p>

                    {/* Term Comparison Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Mortgage Strategy</th>
                                    <th className="p-3">Monthly Cashflow Impact</th>
                                    <th className="p-3">Total Lifetime Interest</th>
                                    <th className="p-3">Best Suited For</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">30-Year Fixed Refinance</td>
                                    <td className="p-3 text-emerald-600 font-bold">Lowest Required Payment</td>
                                    <td className="p-3 text-slate-700 font-medium">Higher (Stretched over 360 months)</td>
                                    <td className="p-3 text-xs">Maximizing monthly budget buffer and cash reserves.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">20-Year Fixed Refinance</td>
                                    <td className="p-3 text-slate-700 font-bold">Moderate Payment</td>
                                    <td className="p-3 text-slate-700 font-medium">Balanced Interest Reduction</td>
                                    <td className="p-3 text-xs">Homeowners 5-10 years into an existing 30-year mortgage.</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">15-Year Fixed Refinance</td>
                                    <td className="p-3 text-slate-900 font-bold">Higher Monthly Payment</td>
                                    <td className="p-3 text-emerald-700 font-extrabold">Massive Interest Savings (50-65% less)</td>
                                    <td className="p-3 text-xs">High-income earners targeting debt-free homeownership.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Detailed Breakdown of Closing Costs */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Refinance Closing Costs & Hidden Fees
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refinance closing costs typically range between <strong>1.5% and 3.0% of the loan principal</strong>. Common fee categories include:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm text-slate-700">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <p className="font-bold text-slate-900">1. Lender Origination & Underwriting Fees</p>
                            <p className="text-slate-600 leading-relaxed">
                                Covers application processing, document preparation, and administrative underwriting (typically 0.5% - 1.0% of loan amount).
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <p className="font-bold text-slate-900">2. Home Appraisal & Inspection Fees</p>
                            <p className="text-slate-600 leading-relaxed">
                                An independent appraisal to confirm current property market value ($400 - $800 depending on location and property scale).
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <p className="font-bold text-slate-900">3. Title Search & Lender's Title Insurance</p>
                            <p className="text-slate-600 leading-relaxed">
                                Ensures clear property title records and protects the lender against undiscovered property liens ($700 - $1,500).
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <p className="font-bold text-slate-900">4. Recording, Transfer & Escrow Reserves</p>
                            <p className="text-slate-600 leading-relaxed">
                                Local county recording taxes, prepaid interest for the closing month, and initial escrow funding for property tax and insurance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (Static Border-Highlighted Cards) */}
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
                                How is the mortgage refinance break-even point calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The break-even point is calculated by dividing total closing costs by monthly payment savings (Break-Even in Months = Total Refinance Costs / Monthly Savings). For example, $6,000 in closing costs with a $200 monthly savings takes 30 months (2.5 years) to break even.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is it worth refinancing for a 0.5% or 1% lower interest rate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Refinancing for a 0.5% to 1.0% interest rate reduction is generally worthwhile if you plan to stay in the property longer than the break-even period. On a $400,000 balance, a 1% rate reduction saves roughly $250 to $270 per month.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I pay closing costs upfront or roll them into the new loan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Paying closing costs out of pocket avoids paying interest on those fees over 15 to 30 years. Rolling closing costs into the loan balance conserves immediate liquid cash but increases the principal, resulting in higher monthly payments and extra interest over the loan duration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What happens if I reset my 30-year mortgage after paying for 5 years?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Resetting to a new 30-year term stretches your debt over 35 total years. While this lowers your required monthly payment, it often increases the total lifetime interest paid unless you choose a shorter term (such as 20 or 15 years) or make voluntary principal prepayments.
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
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, mortgage, legal, or tax advice. Actual loan terms, closing costs, and savings vary based on credit score, loan-to-value (LTV) ratio, property location, and prevailing lender rates.
                    </p>
                </section>

            </div>
        </div>
    );
}