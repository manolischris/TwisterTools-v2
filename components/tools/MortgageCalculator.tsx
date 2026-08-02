"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Home,
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
    Building,
    PiggyBank,
    TrendingDown,
    Scale,
    Flame,
    ArrowRightLeft,
    CheckCircle2
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
    price: number;
    downPayment: number;
    rate: number;
    years: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "standard-30", label: "Standard 30-Year", price: 400000, downPayment: 80000, rate: 6.5, years: 30, tag: "20% Down" },
    { id: "fha-30", label: "FHA First-Time", price: 300000, downPayment: 10500, rate: 6.8, years: 30, tag: "3.5% Down" },
    { id: "aggressive-15", label: "15-Year Aggressive", price: 350000, downPayment: 70000, rate: 5.9, years: 15, tag: "Low Interest" },
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

export default function MortgageCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [homePrice, setHomePrice] = useState<number>(400000);
    const [downPayment, setDownPayment] = useState<number>(80000);
    const [annualRate, setAnnualRate] = useState<number>(6.5);
    const [years, setYears] = useState<number>(30);
    const [propertyTax, setPropertyTax] = useState<number>(4800); // Annual
    const [homeInsurance, setHomeInsurance] = useState<number>(1200); // Annual
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];

    // Ref for print/export container
    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Down Payment % Calculation
    const downPaymentPercent = homePrice > 0 ? (downPayment / homePrice) * 100 : 0;

    // Math & Schedule Calculation
    const calculationResults = useMemo(() => {
        const principal = Math.max(0, homePrice - downPayment);
        const monthlyRate = annualRate / 100 / 12;
        const totalMonths = years * 12;

        let baseMonthlyPI = 0;
        if (monthlyRate > 0) {
            baseMonthlyPI = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else if (totalMonths > 0) {
            baseMonthlyPI = principal / totalMonths;
        }

        const actualMonthlyPayment = baseMonthlyPI + extraMonthlyPayment;
        const monthlyTaxes = propertyTax / 12;
        const monthlyInsurance = homeInsurance / 12;
        const totalMonthlyPayment = actualMonthlyPayment + monthlyTaxes + monthlyInsurance;

        let currentBalance = principal;
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;

        const schedule: ScheduleRow[] = [];
        let yearlyStartingBalance = principal;
        let yearlyPrincipalPaid = 0;
        let yearlyInterestPaid = 0;

        let actualMonths = 0;

        for (let month = 1; month <= totalMonths && currentBalance > 0; month++) {
            actualMonths++;
            const interestForMonth = currentBalance * monthlyRate;
            let principalForMonth = actualMonthlyPayment - interestForMonth;

            // Handle final payment
            if (currentBalance - principalForMonth < 0) {
                principalForMonth = currentBalance;
            }

            currentBalance -= principalForMonth;
            cumulativeInterest += interestForMonth;
            cumulativePrincipal += principalForMonth;

            yearlyInterestPaid += interestForMonth;
            yearlyPrincipalPaid += principalForMonth;

            // Record yearly milestone
            if (month % 12 === 0 || currentBalance <= 0) {
                const yearNum = Math.ceil(month / 12);
                schedule.push({
                    year: yearNum,
                    startingBalance: yearlyStartingBalance,
                    principalPaid: yearlyPrincipalPaid,
                    interestPaid: yearlyInterestPaid,
                    endingBalance: Math.max(0, currentBalance),
                    totalInterest: cumulativeInterest,
                    totalPrincipal: cumulativePrincipal,
                });

                yearlyStartingBalance = currentBalance;
                yearlyPrincipalPaid = 0;
                yearlyInterestPaid = 0;
            }
        }

        const totalCostOfLoan = cumulativePrincipal + cumulativeInterest;
        const payoffYears = actualMonths / 12;
        const timeSaved = years - payoffYears;

        return {
            principal,
            baseMonthlyPI,
            totalMonthlyPayment,
            monthlyTaxes,
            monthlyInsurance,
            totalInterestPaid: cumulativeInterest,
            totalCostOfLoan,
            payoffYears,
            timeSaved,
            schedule,
            interestRatio: totalCostOfLoan > 0 ? (cumulativeInterest / totalCostOfLoan) * 100 : 0,
            principalRatio: totalCostOfLoan > 0 ? (cumulativePrincipal / totalCostOfLoan) * 100 : 0,
        };
    }, [homePrice, downPayment, annualRate, years, propertyTax, homeInsurance, extraMonthlyPayment]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setHomePrice(preset.price);
        setDownPayment(preset.downPayment);
        setAnnualRate(preset.rate);
        setYears(preset.years);
        setPropertyTax(preset.price * 0.012); // Approximate 1.2% property tax
        setHomeInsurance(preset.price * 0.003); // Approximate 0.3% insurance
        setExtraMonthlyPayment(0);
        setActivePresetId(preset.id);
    };

    const handleHomePriceChange = (val: number) => {
        setHomePrice(val);
        // Maintain the same down payment percentage when price changes
        if (downPaymentPercent > 0) {
            setDownPayment(val * (downPaymentPercent / 100));
        }
        setActivePresetId(null);
    };

    const handleDownPaymentChange = (val: number) => {
        setDownPayment(Math.min(val, homePrice));
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setHomePrice(400000);
        setDownPayment(80000);
        setAnnualRate(6.5);
        setYears(30);
        setPropertyTax(4800);
        setHomeInsurance(1200);
        setExtraMonthlyPayment(0);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Mortgage Projection Summary (TwisterTools):
----------------------------------------
Home Price: ${currencySymbol}${homePrice.toLocaleString()}
Down Payment: ${currencySymbol}${downPayment.toLocaleString()} (${downPaymentPercent.toFixed(1)}%)
Loan Amount: ${currencySymbol}${calculationResults.principal.toLocaleString()}
Interest Rate: ${annualRate}%
Loan Term: ${years} Years
----------------------------------------
Monthly P&I: ${currencySymbol}${Math.round(calculationResults.baseMonthlyPI).toLocaleString()}
Monthly Taxes & Ins: ${currencySymbol}${Math.round(calculationResults.monthlyTaxes + calculationResults.monthlyInsurance).toLocaleString()}
Total Est. Monthly Payment: ${currencySymbol}${Math.round(calculationResults.totalMonthlyPayment).toLocaleString()}
----------------------------------------
Total Interest to be Paid: ${currencySymbol}${Math.round(calculationResults.totalInterestPaid).toLocaleString()}
Calculated at twistertools.com/tools/calculators/mortgage-calculator`;

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
        link.setAttribute("download", `amortization_schedule_${calculationResults.payoffYears.toFixed(1)}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schema for SEO & GEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Mortgage Payment & Amortization Schedule Calculator",
        "url": "https://twistertools.com/tools/calculators/mortgage-calculator",
        "description": "Calculate exact monthly mortgage payments, generate detailed amortization schedules, and evaluate the impact of extra payments with our browser-native property finance tool.",
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
                "name": "What is a mortgage amortization schedule?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An amortization schedule is a complete table detailing periodic loan payments. It explicitly breaks down each payment into principal reduction and interest charges, demonstrating how the loan balance reaches zero over its contractual term."
                }
            },
            {
                "@type": "Question",
                "name": "How does making extra mortgage payments save money?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Extra payments are applied directly to the principal balance. Because mortgage interest is calculated monthly on the remaining balance, reducing the principal earlier dramatically lowers total interest compounding and shortens the loan term."
                }
            },
            {
                "@type": "Question",
                "name": "What does PITI stand for in mortgage planning?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PITI stands for Principal, Interest, Taxes, and Insurance. It represents the complete monthly housing liability collected by lenders, comprising core debt service, municipal property taxes, and homeowners hazard insurance."
                }
            },
            {
                "@type": "Question",
                "name": "Why are mortgage payments interest-heavy during early years?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Mortgage interest is calculated based on the outstanding principal balance. Since the balance is highest at the beginning of the loan, the initial calculated interest is at its peak, requiring most of the fixed payment to satisfy interest obligations."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a 15-year and 30-year fixed mortgage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A 15-year mortgage features higher monthly payments but charges significantly less interest over time and builds equity faster. A 30-year mortgage offers lower monthly obligations, providing greater cash flow flexibility at the expense of higher cumulative interest cost."
                }
            },
            {
                "@type": "Question",
                "name": "What is Private Mortgage Insurance (PMI) and when can it be removed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PMI is insurance protecting the lender if a buyer defaults, typically required when down payments are under 20%. Under federal law, PMI can generally be canceled once loan-to-value (LTV) reaches 80% of original property value."
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
                                <Building className="w-5 h-5 text-indigo-600" />
                                Loan Parameters
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
                            {/* Home Price */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Home className="w-4 h-4 text-indigo-600" /> Property Price
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{homePrice.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={homePrice === 0 ? "" : homePrice}
                                        onChange={(e) => handleNumberInput(e, (val) => handleHomePriceChange(Math.max(0, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Down Payment */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <PiggyBank className="w-4 h-4 text-indigo-600" /> Down Payment
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {downPaymentPercent.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={homePrice}
                                        step="1000"
                                        value={downPayment === 0 ? "" : downPayment}
                                        onChange={(e) => handleNumberInput(e, (val) => handleDownPaymentChange(Math.max(0, val)))}
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
                                            max="30"
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
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Loan Term
                                    </label>
                                    <select
                                        value={years}
                                        onChange={(e) => {
                                            setYears(Number(e.target.value));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition bg-white"
                                    >
                                        <option value={10}>10 Years</option>
                                        <option value={15}>15 Years</option>
                                        <option value={20}>20 Years</option>
                                        <option value={30}>30 Years</option>
                                        <option value={40}>40 Years</option>
                                    </select>
                                </div>
                            </div>

                            {/* Taxes, Insurance, and Extra Payments */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxes & Additional Options</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Annual Prop Tax
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                value={propertyTax === 0 ? "" : propertyTax}
                                                onChange={(e) => handleNumberInput(e, (val) => setPropertyTax(Math.max(0, val)))}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Annual Insurance
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                value={homeInsurance === 0 ? "" : homeInsurance}
                                                onChange={(e) => handleNumberInput(e, (val) => setHomeInsurance(Math.max(0, val)))}
                                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                                        <TrendingDown className="w-3.5 h-3.5 text-indigo-500" /> Extra Monthly Payment
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={extraMonthlyPayment === 0 ? "" : extraMonthlyPayment}
                                            onChange={(e) => handleNumberInput(e, (val) => setExtraMonthlyPayment(Math.max(0, val)))}
                                            placeholder="Optional..."
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
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Popular Scenarios
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Payment & Schedule
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

                        {/* Key Metric Highlight Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Est. Monthly Payment</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalMonthlyPayment).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    P&I: {currencySymbol}{Math.round(calculationResults.baseMonthlyPI).toLocaleString()} /mo
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Interest Paid</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalInterestPaid).toLocaleString()}
                                </p>
                                {calculationResults.timeSaved > 0 && (
                                    <p className="text-[11px] text-emerald-600 font-bold mt-1 bg-emerald-100/50 inline-block px-1.5 py-0.5 rounded">
                                        Saved {calculationResults.timeSaved.toFixed(1)} years!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "chart" ? (
                            <div className="space-y-6">
                                {/* Visual Ratio Bar */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Lifetime Loan Cost Breakdown
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block"></span>
                                                Principal: {currencySymbol}{Math.round(calculationResults.principal).toLocaleString()} ({calculationResults.principalRatio.toFixed(1)}%)
                                            </span>
                                            <span className="flex items-center gap-1.5 text-indigo-600">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                                                Interest: {currencySymbol}{Math.round(calculationResults.totalInterestPaid).toLocaleString()} ({calculationResults.interestRatio.toFixed(1)}%)
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

                                {/* Monthly Payment Breakdown */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Monthly Payment Components
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Principal & Interest
                                            </span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.baseMonthlyPI).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-sky-500"></div> Property Taxes
                                            </span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.monthlyTaxes).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-500"></div> Home Insurance
                                            </span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{Math.round(calculationResults.monthlyInsurance).toLocaleString()}</span>
                                        </div>
                                        {extraMonthlyPayment > 0 && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                                <span className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Extra Principal
                                                </span>
                                                <span className="font-bold text-emerald-900">{currencySymbol}{Math.round(extraMonthlyPayment).toLocaleString()}</span>
                                            </div>
                                        )}
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
                                            <th className="p-2.5">Remaining Balance</th>
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
                            Secure local browser calculation
                        </span>
                        <span>Payoff in {calculationResults.payoffYears.toFixed(1)} yrs</span>
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
                            Understanding Your Mortgage Payment Structure & PITI Breakdown
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A standard residential mortgage payment encompasses far more than simply returning borrowed capital. Lenders collect a composite monthly sum commonly abbreviated as <strong>PITI</strong> (Principal, Interest, Taxes, and Insurance). Understanding how these four financial pillars interact is critical for establishing homeownership affordability and long-term solvency.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-indigo-600" /> Principal Reduction
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The direct reduction of the original debt amount borrowed from the bank. Each dollar allocated toward principal directly builds home equity, increasing your net worth.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-indigo-600" /> Loan Interest Charge
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The fee charged by the mortgage lender for extending credit. Calculated as a monthly fraction of your remaining principal balance, interest dominates payments during early loan years.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Building className="w-4 h-4 text-indigo-600" /> Real Estate Property Taxes
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Municipal or county taxes levied based on the assessed value of your property. Lenders usually collect 1/12th of your annual tax bill monthly into an escrow account.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Homeowners Insurance & PMI
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Hazard insurance required by financial institutions to protect structural assets. If down payments are under 20%, Private Mortgage Insurance (PMI) is added to mitigate lender risk.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Standard Amortized Payment Equation
                        </h3>
                        <p className="text-xs text-slate-300">
                            Financial analysts and underwriting algorithms determine monthly fixed mortgage payments (P&I) using the standard amortization formula:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            M = P × [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>M:</strong> Total Monthly Principal & Interest Payment</div>
                            <div><strong>P:</strong> Principal Loan Amount (Home Price - Down Payment)</div>
                            <div><strong>r:</strong> Monthly Interest Rate (Annual Rate ÷ 12 ÷ 100)</div>
                            <div><strong>n:</strong> Total Number of Monthly Payments (Years × 12)</div>
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
                            Step-by-Step Amortization Example: $400,000 Purchase Case Study
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To visualize how amortization shifts cash flow allocation over three decades, review this scenario of a typical homebuyer securing a conventional fixed mortgage:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Case Study Baseline Parameters:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Home Purchase Price:</strong> $400,000</li>
                            <li><strong>Down Payment (20%):</strong> $80,000</li>
                            <li><strong>Net Principal Debt (P):</strong> $320,000</li>
                            <li><strong>Fixed Interest Rate:</strong> 6.5% Annual (0.5416% Monthly)</li>
                            <li><strong>Contract Term:</strong> 30 Years (360 Months)</li>
                        </ul>
                    </div>

                    {/* Breakdown Milestone Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeline Milestone</th>
                                    <th className="p-3">Monthly Payment (P&I)</th>
                                    <th className="p-3">Principal Portion</th>
                                    <th className="p-3">Interest Portion</th>
                                    <th className="p-3">Remaining Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Month 1</td>
                                    <td className="p-3">$2,022.62</td>
                                    <td className="p-3 text-slate-600 font-semibold">$289.29 (14%)</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$1,733.33 (86%)</td>
                                    <td className="p-3 font-bold text-slate-900">$319,710.71</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 10 (Month 120)</td>
                                    <td className="p-3">$2,022.62</td>
                                    <td className="p-3 text-slate-600 font-semibold">$553.11 (27%)</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$1,469.51 (73%)</td>
                                    <td className="p-3 font-bold text-slate-900">$270,757.20</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 20 (Month 240)</td>
                                    <td className="p-3">$2,022.62</td>
                                    <td className="p-3 text-slate-600 font-semibold">$1,057.63 (52%)</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$964.99 (48%)</td>
                                    <td className="p-3 font-bold text-slate-900">$177,088.15</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 30 (Month 360)</td>
                                    <td className="p-3 font-bold text-slate-900">$2,022.62</td>
                                    <td className="p-3 text-slate-900 font-bold">$2,011.68 (99%)</td>
                                    <td className="p-3 text-indigo-600 font-bold">$10.94 (1%)</td>
                                    <td className="p-3 font-extrabold text-emerald-600">$0.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Critical Insight:</strong> Over the full 30-year span, total interest paid equals <strong>$408,144</strong> on a <strong>$320,000</strong> loan—meaning interest exceeds the principal balance borrowed. The tipping point where monthly payments contribute more to principal than interest occurs in <strong>Year 19</strong>.
                    </p>
                </section>

                {/* Card 3: Comparing Loan Terms (15-Year vs 30-Year) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: 15-Year vs. 30-Year Fixed Mortgages
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate loan horizon is one of the most significant decisions home buyers make. While 30-year terms dominate consumer adoption due to lower mandatory monthly outlays, 15-year terms offer dramatic long-term savings:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Metric ($300,000 Principal)</th>
                                    <th className="p-3">30-Year Fixed (6.5%)</th>
                                    <th className="p-3">15-Year Fixed (5.8%)</th>
                                    <th className="p-3">Difference / Savings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Est. Interest Rate</td>
                                    <td className="p-3">6.50%</td>
                                    <td className="p-3 text-emerald-700 font-semibold">5.80% (-0.70%)</td>
                                    <td className="p-3 font-medium text-slate-600">Lower rate for shorter term</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Monthly P&I Payment</td>
                                    <td className="p-3 text-indigo-600 font-bold">$1,896</td>
                                    <td className="p-3 text-slate-900 font-bold">$2,500</td>
                                    <td className="p-3 text-amber-700 font-semibold">+$604 / month (+31%)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Total Interest Lifetime</td>
                                    <td className="p-3">$382,633</td>
                                    <td className="p-3 text-emerald-600 font-bold">$150,035</td>
                                    <td className="p-3 font-extrabold text-emerald-600">-$232,598 Saved!</td>
                                </tr>
                                <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-900">Total Cost of Loan</td>
                                    <td className="p-3 font-bold text-slate-900">$682,633</td>
                                    <td className="p-3 font-bold text-emerald-900">$450,035</td>
                                    <td className="p-3 font-extrabold text-emerald-700">34% Overall Cost Reduction</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Payoff Strategies & Bi-Weekly Accelerated Schedules */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Strategies to Accelerate Mortgage Payoff & Build Equity Fast
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Borrowers do not have to remain locked into standard 30-year schedules. Utilizing strategic extra principal contributions allows homeowners to eliminate mortgage debt years ahead of schedule:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ArrowRightLeft className="w-4 h-4" /> Bi-Weekly Payments
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Pay half your monthly payment every two weeks. With 52 weeks in a year, you make 26 half-payments—equaling 13 full payments per year (one extra full payment annually).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Flame className="w-4 h-4" /> Recurring Extra Principal
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Adding a fixed extra amount ($100 to $300) directly to monthly payments reduces the principal baseline continuously, compounding interest savings every single month.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <PiggyBank className="w-4 h-4" /> Lump-Sum Principal Drops
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Applying annual tax refunds, work bonuses, or windfalls directly to your loan balance instantly re-amortizes interest growth down for the remaining life of the loan.
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
                                What is a mortgage amortization schedule?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An amortization schedule is a complete table detailing periodic loan payments. It explicitly breaks down each payment into principal reduction and interest charges, demonstrating how the loan balance reaches zero over its contractual term.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does making extra mortgage payments save money?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Extra payments are applied directly to the principal balance. Because mortgage interest is calculated monthly on the remaining balance, reducing the principal earlier dramatically lowers total interest compounding and shortens the loan term.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does PITI stand for in mortgage planning?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                PITI stands for Principal, Interest, Taxes, and Insurance. It represents the complete monthly housing liability collected by lenders, comprising core debt service, municipal property taxes, and homeowners hazard insurance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are mortgage payments interest-heavy during early years?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Mortgage interest is calculated based on the outstanding principal balance. Since the balance is highest at the beginning of the loan, the initial calculated interest is at its peak, requiring most of the fixed payment to satisfy interest obligations.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a 15-year and 30-year fixed mortgage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A 15-year mortgage features higher monthly payments but charges significantly less interest over time and builds equity faster. A 30-year mortgage offers lower monthly obligations, providing greater cash flow flexibility at the expense of higher cumulative interest cost.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Private Mortgage Insurance (PMI) and when can it be removed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                PMI is insurance protecting the lender if a buyer defaults, typically required when down payments are under 20%. Under federal law, PMI can generally be canceled once loan-to-value (LTV) reaches 80% of original property value.
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