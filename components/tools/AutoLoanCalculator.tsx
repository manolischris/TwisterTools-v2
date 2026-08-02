"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Car,
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
    PiggyBank,
    TrendingDown,
    Scale,
    Flame,
    ArrowRightLeft,
    Tag,
    ShieldAlert
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
    tradeIn: number;
    rate: number;
    months: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "new-car-60", label: "New Car (60 Mo)", price: 38000, downPayment: 5000, tradeIn: 3000, rate: 5.9, months: 60, tag: "Standard New" },
    { id: "used-car-48", label: "Used Car (48 Mo)", price: 22000, downPayment: 3000, tradeIn: 0, rate: 7.5, months: 48, tag: "Used Rate" },
    { id: "budget-36", label: "Budget (36 Mo)", price: 15000, downPayment: 2500, tradeIn: 1500, rate: 6.2, months: 36, tag: "Fast Payoff" },
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

export default function AutoLoanCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [vehiclePrice, setVehiclePrice] = useState<number>(35000);
    const [downPayment, setDownPayment] = useState<number>(5000);
    const [tradeInValue, setTradeInValue] = useState<number>(2000);
    const [annualRate, setAnnualRate] = useState<number>(6.5);
    const [loanMonths, setLoanMonths] = useState<number>(60);
    const [salesTaxRate, setSalesTaxRate] = useState<number>(7.0); // Percentage
    const [titleFees, setTitleFees] = useState<number>(400); // Fixed dealer/doc fees
    const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"chart" | "table">("chart");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Calculations
    const salesTaxAmount = useMemo(() => {
        const taxableAmount = Math.max(0, vehiclePrice - tradeInValue);
        return taxableAmount * (salesTaxRate / 100);
    }, [vehiclePrice, tradeInValue, salesTaxRate]);

    const netLoanPrincipal = useMemo(() => {
        const totalPriceWithFees = vehiclePrice + salesTaxAmount + titleFees;
        const totalCredits = downPayment + tradeInValue;
        return Math.max(0, totalPriceWithFees - totalCredits);
    }, [vehiclePrice, salesTaxAmount, titleFees, downPayment, tradeInValue]);

    // Math & Schedule Calculation
    const calculationResults = useMemo(() => {
        const principal = netLoanPrincipal;
        const monthlyRate = annualRate / 100 / 12;
        const totalMonths = loanMonths;

        let baseMonthlyPI = 0;
        if (monthlyRate > 0) {
            baseMonthlyPI = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else if (totalMonths > 0) {
            baseMonthlyPI = principal / totalMonths;
        }

        const actualMonthlyPayment = baseMonthlyPI + extraMonthlyPayment;

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

            if (currentBalance - principalForMonth < 0) {
                principalForMonth = currentBalance;
            }

            currentBalance -= principalForMonth;
            cumulativeInterest += interestForMonth;
            cumulativePrincipal += principalForMonth;

            yearlyInterestPaid += interestForMonth;
            yearlyPrincipalPaid += principalForMonth;

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
        const monthsSaved = totalMonths - actualMonths;

        return {
            principal,
            baseMonthlyPI,
            actualMonthlyPayment,
            totalInterestPaid: cumulativeInterest,
            totalCostOfLoan,
            payoffYears,
            monthsSaved,
            schedule,
            interestRatio: totalCostOfLoan > 0 ? (cumulativeInterest / totalCostOfLoan) * 100 : 0,
            principalRatio: totalCostOfLoan > 0 ? (cumulativePrincipal / totalCostOfLoan) * 100 : 0,
        };
    }, [netLoanPrincipal, annualRate, loanMonths, extraMonthlyPayment]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: Preset) => {
        setVehiclePrice(preset.price);
        setDownPayment(preset.downPayment);
        setTradeInValue(preset.tradeIn);
        setAnnualRate(preset.rate);
        setLoanMonths(preset.months);
        setExtraMonthlyPayment(0);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setVehiclePrice(35000);
        setDownPayment(5000);
        setTradeInValue(2000);
        setAnnualRate(6.5);
        setLoanMonths(60);
        setSalesTaxRate(7.0);
        setTitleFees(400);
        setExtraMonthlyPayment(0);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Auto Loan Projection Summary (TwisterTools):
----------------------------------------
Vehicle Price: ${currencySymbol}${vehiclePrice.toLocaleString()}
Down Payment: ${currencySymbol}${downPayment.toLocaleString()}
Trade-In Allowance: ${currencySymbol}${tradeInValue.toLocaleString()}
Est. Sales Tax & Fees: ${currencySymbol}${Math.round(salesTaxAmount + titleFees).toLocaleString()}
Total Loan Amount: ${currencySymbol}${Math.round(calculationResults.principal).toLocaleString()}
Interest Rate: ${annualRate}%
Loan Term: ${loanMonths} Months (${(loanMonths / 12).toFixed(1)} Years)
----------------------------------------
Est. Monthly Payment: ${currencySymbol}${Math.round(calculationResults.actualMonthlyPayment).toLocaleString()}
Total Interest Paid: ${currencySymbol}${Math.round(calculationResults.totalInterestPaid).toLocaleString()}
Total Overall Financing Cost: ${currencySymbol}${Math.round(calculationResults.totalCostOfLoan).toLocaleString()}
----------------------------------------
Calculated at twistertools.com/tools/calculators/auto-loan-calculator`;

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
        link.setAttribute("download", `auto_loan_amortization_${loanMonths}mo.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Auto Loan & Monthly Payment Estimator",
        "url": "https://twistertools.com/tools/calculators/auto-loan-calculator",
        "description": "Calculate auto loan monthly payments, trade-in equity, sales taxes, and full amortization schedules using our browser-native vehicle financing tool.",
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
                "name": "How is sales tax calculated on a vehicle purchase with a trade-in?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In most jurisdictions, sales tax is applied only to the net purchase price after deducting your trade-in credit (Vehicle Price - Trade-In Value = Taxable Base). This significantly lowers state and local sales tax liability."
                }
            },
            {
                "@type": "Question",
                "name": "Is a 72-month or 84-month auto loan a good idea?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While extended terms lower monthly payments, they dramatically increase overall interest cost and increase the risk of negative equity (being underwater), where your car depreciates faster than your loan principal decreases."
                }
            },
            {
                "@type": "Question",
                "name": "What is the recommended down payment for a car purchase?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial advisors generally recommend putting down at least 20% on a new car and 10% on a used car. A larger down payment shields you from rapid early depreciation and reduces total interest costs."
                }
            },
            {
                "@type": "Question",
                "name": "Can I pay off my auto loan early without penalty?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most modern auto loans allow penalty-free early payoff. Making extra monthly principal payments reduces your remaining principal balance, cutting total interest compound and shortening your loan duration."
                }
            },
            {
                "@type": "Question",
                "name": "What fees are included in auto financing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Auto financing typically bundles vehicle purchase price, state sales tax, dealer documentation fees, title and registration costs, and optional extended warranties into the final loan principal."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Car className="w-5 h-5 text-indigo-600" />
                                Financing Parameters
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

                        <div className="space-y-4">
                            {/* Vehicle Price */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Tag className="w-4 h-4 text-indigo-600" /> Vehicle Sticker Price
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{vehiclePrice.toLocaleString()}
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={vehiclePrice === 0 ? "" : vehiclePrice}
                                        onChange={(e) => { handleNumberInput(e, (val) => setVehiclePrice(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Down Payment & Trade-In Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                                        <PiggyBank className="w-3.5 h-3.5 text-indigo-600" /> Down Payment
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={downPayment === 0 ? "" : downPayment}
                                            onChange={(e) => { handleNumberInput(e, (val) => setDownPayment(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                                        <Car className="w-3.5 h-3.5 text-indigo-600" /> Trade-In Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={tradeInValue === 0 ? "" : tradeInValue}
                                            onChange={(e) => { handleNumberInput(e, (val) => setTradeInValue(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Rate & Term */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                                        <Percent className="w-3.5 h-3.5 text-indigo-600" /> Interest Rate (APR)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="30"
                                            step="0.1"
                                            value={annualRate === 0 ? "" : annualRate}
                                            onChange={(e) => { handleNumberInput(e, (val) => setAnnualRate(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Loan Term
                                    </label>
                                    <select
                                        value={loanMonths}
                                        onChange={(e) => {
                                            setLoanMonths(Number(e.target.value));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition bg-white"
                                    >
                                        <option value={24}>24 Months (2 Yrs)</option>
                                        <option value={36}>36 Months (3 Yrs)</option>
                                        <option value={48}>48 Months (4 Yrs)</option>
                                        <option value={60}>60 Months (5 Yrs)</option>
                                        <option value={72}>72 Months (6 Yrs)</option>
                                        <option value={84}>84 Months (7 Yrs)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Taxes, Fees & Extra Payment */}
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taxes & Dealer Fees</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Sales Tax Rate
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="25"
                                                step="0.1"
                                                value={salesTaxRate === 0 ? "" : salesTaxRate}
                                                onChange={(e) => handleNumberInput(e, (val) => setSalesTaxRate(Math.max(0, val)))}
                                                className="w-full pl-3 pr-6 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Doc / Title Fees
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="50"
                                                value={titleFees === 0 ? "" : titleFees}
                                                onChange={(e) => handleNumberInput(e, (val) => setTitleFees(Math.max(0, val)))}
                                                className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                                        <TrendingDown className="w-3.5 h-3.5 text-indigo-500" /> Extra Monthly Principal Payment
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="25"
                                            value={extraMonthlyPayment === 0 ? "" : extraMonthlyPayment}
                                            onChange={(e) => handleNumberInput(e, (val) => setExtraMonthlyPayment(Math.max(0, val)))}
                                            placeholder="Optional extra payment..."
                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presets Bar */}
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Popular Financing Scenarios
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
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
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs cursor-pointer ${isActive
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

                {/* Right Workspace Panel: Dynamic Results & Visualizations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Payment & Cost Breakdown
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

                        {/* Key Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Est. Monthly Payment</p>
                                <p className="text-3xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.actualMonthlyPayment).toLocaleString()}
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Base P&I: {currencySymbol}{Math.round(calculationResults.baseMonthlyPI).toLocaleString()} /mo
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total Interest Paid</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculationResults.totalInterestPaid).toLocaleString()}
                                </p>
                                {calculationResults.monthsSaved > 0 && (
                                    <p className="text-[11px] text-emerald-600 font-bold mt-1 bg-emerald-100/50 inline-block px-1.5 py-0.5 rounded">
                                        Saved {calculationResults.monthsSaved} months early!
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
                                        Total Loan Financing Split
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

                                {/* Upfront Summary Breakdown */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Upfront Cost & Loan Basis
                                    </h3>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                            <span className="font-semibold text-slate-700">Vehicle Purchase Price</span>
                                            <span className="font-bold text-slate-900">{currencySymbol}{vehiclePrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                                            <span className="font-semibold text-slate-700">Sales Tax ({salesTaxRate}%) & Doc Fees</span>
                                            <span className="font-bold text-slate-900">+{currencySymbol}{Math.round(salesTaxAmount + titleFees).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                                            <span className="font-semibold text-emerald-800">Down Payment & Trade-In Credit</span>
                                            <span className="font-bold text-emerald-900">-{currencySymbol}{(downPayment + tradeInValue).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold">
                                            <span className="text-indigo-900">Net Amount Financed (Principal)</span>
                                            <span className="text-indigo-900">{currencySymbol}{Math.round(calculationResults.principal).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Amortization Table Tab */
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
                            Secure browser-native calculation
                        </span>
                        <span>Term: {loanMonths} Months</span>
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

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics of Auto Loan Financing */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Auto Loans Work: Deciphering Principal, Interest & Dealer Fees
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An auto loan is a simple interest installment loan secured by the vehicle you purchase. Unlike real estate mortgages, auto loans typically run across shorter terms ranging from 24 to 84 months. Understanding how dealership fees, state sales taxes, interest rates, and trade-in allowances combine is vital to negotiating the best overall purchase price.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-indigo-600" /> Net Financed Principal
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The total loan amount borrowed from your lender. It equals the vehicle price plus state sales taxes and dealer documentation fees, minus your down payment and vehicle trade-in allowance.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-indigo-600" /> Annual Percentage Rate (APR)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The cost of credit expressed as a yearly rate. Simple interest accrues daily or monthly on the outstanding principal balance, meaning principal reduction lowers future interest accumulation.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Car className="w-4 h-4 text-indigo-600" /> Trade-In Tax Credit Benefit
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                In most US states and international regions, trading in a vehicle reduces your taxable purchase baseline. State sales tax is calculated only on the remaining net vehicle price.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Documentation & Title Fees
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Mandatory fees charged by dealerships to process vehicle registration, license plates, and legal title transfers. These costs are often rolled directly into your loan balance.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Auto Amortization Formula
                        </h3>
                        <p className="text-xs text-slate-300">
                            Auto lenders calculate monthly installment payments using the standard fixed installment amortization equation:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Monthly Payment (M) = P × [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>P:</strong> Net Financed Principal (Price + Tax + Fees - Down - Trade-In)</div>
                            <div><strong>r:</strong> Monthly Interest Rate (APR ÷ 12 ÷ 100)</div>
                            <div><strong>n:</strong> Total Loan Term in Months (e.g., 60 Months)</div>
                            <div><strong>M:</strong> Fixed Monthly Installment Payment</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Case Study */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Auto Loan Calculation Case Study ($35,000 Vehicle)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how taxes, trade-in credits, and interest rates combine into a final monthly commitment, consider this detailed scenario:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Example Financing Profile:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Sticker Price:</strong> $35,000</li>
                            <li><strong>Trade-In Credit:</strong> $3,000</li>
                            <li><strong>Net Taxable Base:</strong> $32,000 ($35,000 - $3,000)</li>
                            <li><strong>Sales Tax (7%):</strong> $2,240 ($32,000 × 0.07)</li>
                            <li><strong>Doc/Title Fees:</strong> $360</li>
                            <li><strong>Cash Down Payment:</strong> $5,000</li>
                            <li><strong>Total Financed Principal:</strong> $29,600 ($35,000 + $2,240 + $360 - $3,000 - $5,000)</li>
                            <li><strong>Interest Rate:</strong> 6.5% APR | <strong>Term:</strong> 60 Months (5 Years)</li>
                        </ul>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Year</th>
                                    <th className="p-3">Monthly Payment</th>
                                    <th className="p-3">Principal Paid</th>
                                    <th className="p-3">Interest Paid</th>
                                    <th className="p-3">Remaining Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 1</td>
                                    <td className="p-3">$579.03</td>
                                    <td className="p-3 text-slate-600 font-semibold">$5,212.18</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$1,736.18</td>
                                    <td className="p-3 font-bold text-slate-900">$24,387.82</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 2</td>
                                    <td className="p-3">$579.03</td>
                                    <td className="p-3 text-slate-600 font-semibold">$5,561.34 font-semibold</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$1,387.02</td>
                                    <td className="p-3 font-bold text-slate-900">$18,826.48</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 3</td>
                                    <td className="p-3">$579.03</td>
                                    <td className="p-3 text-slate-600 font-semibold">$5,934.00</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$1,014.36</td>
                                    <td className="p-3 font-bold text-slate-900">$12,892.48</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 4</td>
                                    <td className="p-3">$579.03</td>
                                    <td className="p-3 text-slate-600 font-semibold">$6,331.62</td>
                                    <td className="p-3 text-indigo-600 font-semibold">$616.74</td>
                                    <td className="p-3 font-bold text-slate-900">$6,560.86</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 5</td>
                                    <td className="p-3 font-bold text-slate-900">$579.03</td>
                                    <td className="p-3 text-slate-900 font-bold">$6,560.86</td>
                                    <td className="p-3 text-indigo-600 font-bold">$192.50</td>
                                    <td className="p-3 font-extrabold text-emerald-600">$0.00</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Outcome:</strong> Monthly payment is <strong>$579.03</strong>. Over 5 years, total interest paid amounts to <strong>$5,141.80</strong> on a <strong>$29,600</strong> loan, resulting in a total cost of <strong>$34,741.80</strong>.
                    </p>
                </section>

                {/* Card 3: Comparing Short vs Long Term Auto Loans & Negative Equity */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Danger of Long-Term Auto Loans (72 & 84 Month Risk)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Extended term auto loans (72 or 84 months) have gained popularity because they lower required monthly outlays. However, because cars depreciate rapidly, extended terms create high risk of <strong>negative equity</strong> (being "underwater" on your loan):
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Loan Term ($30,000 Principal @ 7% APR)</th>
                                    <th className="p-3">Monthly Payment</th>
                                    <th className="p-3">Total Interest</th>
                                    <th className="p-3">Risk Assessment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">36 Months (3 Yrs)</td>
                                    <td className="p-3 font-bold text-slate-900">$926</td>
                                    <td className="p-3 text-emerald-600 font-bold">$3,346</td>
                                    <td className="p-3 text-emerald-700 font-medium">Lowest interest, rapid equity growth</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">60 Months (5 Yrs)</td>
                                    <td className="p-3 font-bold text-indigo-600">$594</td>
                                    <td className="p-3 text-slate-700 font-bold">$5,643</td>
                                    <td className="p-3 text-slate-600 font-medium">Standard baseline balance</td>
                                </tr>
                                <tr className="bg-amber-50/50 hover:bg-amber-50">
                                    <td className="p-3 font-bold text-amber-900">84 Months (7 Yrs)</td>
                                    <td className="p-3 font-bold text-amber-900">$453</td>
                                    <td className="p-3 text-rose-600 font-bold">$8,088</td>
                                    <td className="p-3 text-rose-700 font-semibold">High risk of negative equity / underwater loan</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Strategies to Pay Off Auto Debt Faster */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Actionable Strategies to Reduce Interest & Pay Off Your Car Early
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ArrowRightLeft className="w-4 h-4" /> Round Up Monthly Payments
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Rounding up your calculated monthly payment (e.g., paying $600 instead of $542) applies 100% of the excess directly to principal, shaving months off your term.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <Flame className="w-4 h-4" /> Bi-Weekly Payment Schedule
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Split your monthly payment in half and pay every two weeks. You make 26 half-payments per year—equaling 13 full payments and cutting total interest.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                <ShieldAlert className="w-4 h-4" /> Refinance High APR Loans
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                If your credit score improves after purchase, refinancing your auto loan with a credit union can drop interest rates significantly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
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
                                How is sales tax calculated on a vehicle purchase with a trade-in?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In most jurisdictions, sales tax is applied only to the net purchase price after deducting your trade-in credit (Vehicle Price - Trade-In Value = Taxable Base). This significantly lowers state and local sales tax liability.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is a 72-month or 84-month auto loan a good idea?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While extended terms lower monthly payments, they dramatically increase overall interest cost and increase the risk of negative equity (being underwater), where your car depreciates faster than your loan principal decreases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the recommended down payment for a car purchase?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial advisors generally recommend putting down at least 20% on a new car and 10% on a used car. A larger down payment shields you from rapid early depreciation and reduces total interest costs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I pay off my auto loan early without penalty?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Most modern auto loans allow penalty-free early payoff. Making extra monthly principal payments reduces your remaining principal balance, cutting total interest compound and shortening your loan duration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What fees are included in auto financing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Auto financing typically bundles vehicle purchase price, state sales tax, dealer documentation fees, title and registration costs, and optional extended warranties into the final loan principal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer Card */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs text-slate-500">
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