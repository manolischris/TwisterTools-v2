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
    Layers,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    Scale,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    TrendingDown,
    Award,
    Clock,
    FileSpreadsheet
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    vehiclePrice: number;
    leaseTerm: number;
    leaseMonthly: number;
    leaseDown: number;
    buyTerm: number;
    buyApr: number;
    buyDown: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "sedan",
        label: "Midsize Sedan / EV",
        vehiclePrice: 38000,
        leaseTerm: 36,
        leaseMonthly: 440,
        leaseDown: 2500,
        buyTerm: 60,
        buyApr: 5.9,
        buyDown: 5000,
        tag: "$38k Sedan"
    },
    {
        id: "suv",
        label: "Family SUV / Crossover",
        vehiclePrice: 52000,
        leaseTerm: 36,
        leaseMonthly: 620,
        leaseDown: 3500,
        buyTerm: 60,
        buyApr: 6.2,
        buyDown: 7500,
        tag: "$52k SUV"
    },
    {
        id: "luxury",
        label: "Luxury Sport Sedan",
        vehiclePrice: 75000,
        leaseTerm: 36,
        leaseMonthly: 920,
        leaseDown: 5000,
        buyTerm: 48,
        buyApr: 5.2,
        buyDown: 12000,
        tag: "$75k Luxury"
    }
];

type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
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

export default function CarLeaseVsBuyCalculator() {
    // Currency & Common Vehicle Inputs
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [vehiclePrice, setVehiclePrice] = useState<number>(42000);
    const [salesTaxRate, setSalesTaxRate] = useState<number>(7.0);
    const [holdingPeriodYears, setHoldingPeriodYears] = useState<number>(5);
    const [opportunityCostRate, setOpportunityCostRate] = useState<number>(4.5);

    // Lease Specific Inputs
    const [leaseTermMonths, setLeaseTermMonths] = useState<number>(36);
    const [leaseDownPayment, setLeaseDownPayment] = useState<number>(3000);
    const [leaseMonthlyPayment, setLeaseMonthlyPayment] = useState<number>(480);
    const [leaseAcquisitionFee, setLeaseAcquisitionFee] = useState<number>(695);
    const [leaseDispositionFee, setLeaseDispositionFee] = useState<number>(395);
    const [leaseAnnualMileage, setLeaseAnnualMileage] = useState<number>(12000);
    const [leaseExcessMileageCost, setLeaseExcessMileageCost] = useState<number>(0.25);
    const [expectedAnnualMileage, setExpectedAnnualMileage] = useState<number>(12000);

    // Purchase / Loan Specific Inputs
    const [buyDownPayment, setBuyDownPayment] = useState<number>(5000);
    const [loanTermMonths, setLoanTermMonths] = useState<number>(60);
    const [loanInterestRate, setLoanInterestRate] = useState<number>(5.9);
    const [dealerDocFees, setDealerDocFees] = useState<number>(550);
    const [annualDepreciationRate, setAnnualDepreciationRate] = useState<number>(15);
    const [annualMaintenanceBuy, setAnnualMaintenanceBuy] = useState<number>(900);
    const [annualMaintenanceLease, setAnnualMaintenanceLease] = useState<number>(300);

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "cashflow">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Core Financial Calculations
    const results = useMemo(() => {
        const totalMonths = Math.max(12, holdingPeriodYears * 12);
        const numLeaseCycles = totalMonths / leaseTermMonths;

        // 1. BUYING CALCULATIONS
        const taxableAmount = vehiclePrice;
        const totalSalesTaxBuy = (taxableAmount * salesTaxRate) / 100;
        const initialPurchasePriceWithTax = vehiclePrice + totalSalesTaxBuy + dealerDocFees;
        const principalLoanAmount = Math.max(0, initialPurchasePriceWithTax - buyDownPayment);

        const monthlyLoanInterestRate = (loanInterestRate / 100) / 12;
        let monthlyLoanPayment = 0;
        let totalLoanInterest = 0;

        if (principalLoanAmount > 0) {
            if (monthlyLoanInterestRate > 0) {
                monthlyLoanPayment =
                    (principalLoanAmount *
                        (monthlyLoanInterestRate *
                            Math.pow(1 + monthlyLoanInterestRate, loanTermMonths))) /
                    (Math.pow(1 + monthlyLoanInterestRate, loanTermMonths) - 1);
            } else {
                monthlyLoanPayment = principalLoanAmount / loanTermMonths;
            }
            totalLoanInterest = (monthlyLoanPayment * loanTermMonths) - principalLoanAmount;
        }

        // Loan cash outflows within holding period
        const loanMonthsPaidInHorizon = Math.min(totalMonths, loanTermMonths);
        const loanPaymentsInHorizon = monthlyLoanPayment * loanMonthsPaidInHorizon;
        const totalOutofPocketBuy = buyDownPayment + loanPaymentsInHorizon;

        // Vehicle Residual Value at End of Holding Period (Depreciation)
        // Value = Price * (1 - depRate)^years
        const depFactor = 1 - Math.min(0.5, annualDepreciationRate / 100);
        const estimatedResaleValue = vehiclePrice * Math.pow(depFactor, holdingPeriodYears);

        // Remaining loan principal balance at holding period end (if sold before term ends)
        let remainingLoanBalance = 0;
        if (holdingPeriodYears * 12 < loanTermMonths && principalLoanAmount > 0) {
            const monthsRemaining = loanTermMonths - (holdingPeriodYears * 12);
            if (monthlyLoanInterestRate > 0) {
                remainingLoanBalance =
                    (monthlyLoanPayment / monthlyLoanInterestRate) *
                    (1 - Math.pow(1 + monthlyLoanInterestRate, -monthsRemaining));
            } else {
                remainingLoanBalance = principalLoanAmount * (monthsRemaining / loanTermMonths);
            }
        }

        const netEquityAtEnd = Math.max(0, estimatedResaleValue - remainingLoanBalance);
        const totalBuyMaintenance = annualMaintenanceBuy * holdingPeriodYears;
        const netCostToBuy = (totalOutofPocketBuy + totalBuyMaintenance) - netEquityAtEnd;

        // 2. LEASING CALCULATIONS
        // Single Lease Cycle Metrics
        const singleLeasePayments = leaseMonthlyPayment * leaseTermMonths;
        const excessAnnualMiles = Math.max(0, expectedAnnualMileage - leaseAnnualMileage);
        const singleLeaseMileagePenalty = (excessAnnualMiles * (leaseTermMonths / 12)) * leaseExcessMileageCost;
        const singleLeaseUpfront = leaseDownPayment + leaseAcquisitionFee;
        const singleLeaseCost = singleLeaseUpfront + singleLeasePayments + leaseDispositionFee + singleLeaseMileagePenalty;

        // Multi-cycle projection across the holding period
        const proratedLeaseUpfront = (singleLeaseUpfront + leaseDispositionFee) * numLeaseCycles;
        const totalLeasePaymentsInHorizon = leaseMonthlyPayment * totalMonths;
        const totalLeaseMileagePenalty = (excessAnnualMiles * holdingPeriodYears) * leaseExcessMileageCost;
        const totalLeaseMaintenance = annualMaintenanceLease * holdingPeriodYears;
        const netCostToLease = proratedLeaseUpfront + totalLeasePaymentsInHorizon + totalLeaseMileagePenalty + totalLeaseMaintenance;

        // 3. COMPARATIVE METRICS
        const netDifference = Math.abs(netCostToBuy - netCostToLease);
        const isBuyCheaper = netCostToBuy < netCostToLease;
        const percentageSaved =
            Math.max(netCostToBuy, netCostToLease) > 0
                ? (netDifference / Math.max(netCostToBuy, netCostToLease)) * 100
                : 0;

        // Opportunity Cost of Upfront Down Payment Difference
        const upfrontDelta = buyDownPayment - leaseDownPayment;
        const oppCostYield =
            upfrontDelta !== 0
                ? upfrontDelta * Math.pow(1 + opportunityCostRate / 100, holdingPeriodYears) - upfrontDelta
                : 0;

        // Year-by-year cashflow schedule
        const annualSchedule = [];
        let cumLease = 0;
        let cumBuy = 0;

        for (let yr = 1; yr <= holdingPeriodYears; yr++) {
            // Lease Year Flow
            const yearLeasePayments = leaseMonthlyPayment * 12;
            const yearLeaseMaint = annualMaintenanceLease;
            const cycleRenewalFee = (yr * 12) % leaseTermMonths === 0 ? leaseDispositionFee + leaseAcquisitionFee : 0;
            const yrLeaseCash = (yr === 1 ? leaseDownPayment + leaseAcquisitionFee : 0) + yearLeasePayments + yearLeaseMaint + cycleRenewalFee;
            cumLease += yrLeaseCash;

            // Buy Year Flow
            const yrMonthsPaid = Math.min(12, Math.max(0, loanTermMonths - (yr - 1) * 12));
            const yrBuyPayments = monthlyLoanPayment * yrMonthsPaid;
            const yrBuyMaint = annualMaintenanceBuy;
            const yrBuyCash = (yr === 1 ? buyDownPayment + totalSalesTaxBuy + dealerDocFees : 0) + yrBuyPayments + yrBuyMaint;
            cumBuy += yrBuyCash;

            // Resale equity value at end of year yr
            const yrResale = vehiclePrice * Math.pow(depFactor, yr);
            const yrMonthsRemaining = Math.max(0, loanTermMonths - (yr * 12));
            let yrBal = 0;
            if (yrMonthsRemaining > 0 && principalLoanAmount > 0) {
                if (monthlyLoanInterestRate > 0) {
                    yrBal = (monthlyLoanPayment / monthlyLoanInterestRate) * (1 - Math.pow(1 + monthlyLoanInterestRate, -yrMonthsRemaining));
                } else {
                    yrBal = principalLoanAmount * (yrMonthsRemaining / loanTermMonths);
                }
            }
            const yrNetBuyCost = cumBuy - Math.max(0, yrResale - yrBal);

            annualSchedule.push({
                year: yr,
                cumulativeLeasePaid: cumLease,
                cumulativeBuyPaid: cumBuy,
                estimatedCarValue: yrResale,
                loanBalance: yrBal,
                netBuyCost: yrNetBuyCost,
                netLeaseCost: cumLease
            });
        }

        return {
            monthlyLoanPayment,
            totalLoanInterest,
            principalLoanAmount,
            totalSalesTaxBuy,
            estimatedResaleValue,
            netEquityAtEnd,
            totalOutofPocketBuy,
            netCostToBuy,
            netCostToLease,
            isBuyCheaper,
            netDifference,
            percentageSaved,
            numLeaseCycles,
            totalLeasePaymentsInHorizon,
            totalBuyMaintenance,
            totalLeaseMaintenance,
            oppCostYield,
            annualSchedule
        };
    }, [
        vehiclePrice,
        salesTaxRate,
        holdingPeriodYears,
        opportunityCostRate,
        leaseTermMonths,
        leaseDownPayment,
        leaseMonthlyPayment,
        leaseAcquisitionFee,
        leaseDispositionFee,
        leaseAnnualMileage,
        leaseExcessMileageCost,
        expectedAnnualMileage,
        buyDownPayment,
        loanTermMonths,
        loanInterestRate,
        dealerDocFees,
        annualDepreciationRate,
        annualMaintenanceBuy,
        annualMaintenanceLease
    ]);

    const applyPreset = (preset: Preset) => {
        setVehiclePrice(preset.vehiclePrice);
        setLeaseTermMonths(preset.leaseTerm);
        setLeaseMonthlyPayment(preset.leaseMonthly);
        setLeaseDownPayment(preset.leaseDown);
        setLoanTermMonths(preset.buyTerm);
        setLoanInterestRate(preset.buyApr);
        setBuyDownPayment(preset.buyDown);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setVehiclePrice(42000);
        setSalesTaxRate(7.0);
        setHoldingPeriodYears(5);
        setOpportunityCostRate(4.5);
        setLeaseTermMonths(36);
        setLeaseDownPayment(3000);
        setLeaseMonthlyPayment(480);
        setLeaseAcquisitionFee(695);
        setLeaseDispositionFee(395);
        setLeaseAnnualMileage(12000);
        setLeaseExcessMileageCost(0.25);
        setExpectedAnnualMileage(12000);
        setBuyDownPayment(5000);
        setLoanTermMonths(60);
        setLoanInterestRate(5.9);
        setDealerDocFees(550);
        setAnnualDepreciationRate(15);
        setAnnualMaintenanceBuy(900);
        setAnnualMaintenanceLease(300);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const winner = results.isBuyCheaper ? "Buying (Loan Financing)" : "Leasing";
        const summaryText = `Car Lease vs Buy Financial Analysis (TwisterTools):
--------------------------------------------------
Vehicle MSRP / Agreed Price: ${currencySymbol}${vehiclePrice.toLocaleString()}
Comparison Time Horizon: ${holdingPeriodYears} Years (${holdingPeriodYears * 12} Months)
--------------------------------------------------
FINANCIAL VERDICT:
Most Cost-Effective Choice: ${winner}
Estimated Net Savings: ${currencySymbol}${Math.round(results.netDifference).toLocaleString()} (${results.percentageSaved.toFixed(1)}% savings)

PURCHASE / LOAN BREAKDOWN:
- Monthly Loan Payment: ${currencySymbol}${Math.round(results.monthlyLoanPayment).toLocaleString()}/mo (${loanTermMonths} mos @ ${loanInterestRate}% APR)
- Total Out-of-Pocket Cash: ${currencySymbol}${Math.round(results.totalOutofPocketBuy).toLocaleString()}
- Maintenance & Repairs: ${currencySymbol}${Math.round(results.totalBuyMaintenance).toLocaleString()}
- End-of-Period Asset Value: ${currencySymbol}${Math.round(results.estimatedResaleValue).toLocaleString()}
- NET COST TO BUY (Total Paid - Equity): ${currencySymbol}${Math.round(results.netCostToBuy).toLocaleString()}

LEASE BREAKDOWN:
- Monthly Lease Payment: ${currencySymbol}${Math.round(leaseMonthlyPayment).toLocaleString()}/mo (${leaseTermMonths} mos)
- Upfront Costs + Fees: ${currencySymbol}${Math.round(leaseDownPayment + leaseAcquisitionFee).toLocaleString()}
- Maintenance & Warranty: ${currencySymbol}${Math.round(results.totalLeaseMaintenance).toLocaleString()}
- Residual Value Retained: ${currencySymbol}0
- NET COST TO LEASE: ${currencySymbol}${Math.round(results.netCostToLease).toLocaleString()}
--------------------------------------------------
Calculate your personalized auto finance breakdown at twistertools.com/tools/calculators/car-lease-vs-buy-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = [
            "Year",
            "Cumulative Lease Paid",
            "Cumulative Buy Cash Paid",
            "Estimated Resale Value",
            "Remaining Loan Balance",
            "Net Cumulative Buy Cost",
            "Net Cumulative Lease Cost"
        ];
        const csvRows = [
            headers.join(","),
            ...results.annualSchedule.map((row) =>
                [
                    row.year,
                    row.cumulativeLeasePaid.toFixed(2),
                    row.cumulativeBuyPaid.toFixed(2),
                    row.estimatedCarValue.toFixed(2),
                    row.loanBalance.toFixed(2),
                    row.netBuyCost.toFixed(2),
                    row.netLeaseCost.toFixed(2)
                ].join(",")
            )
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `car_lease_vs_buy_${holdingPeriodYears}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Car Lease vs Buy Financial Comparison Calculator",
        "url": "https://twistertools.com/tools/calculators/car-lease-vs-buy-calculator",
        "description": "Calculate total cost of ownership, depreciation, loan amortization, mileage penalties, and net financial equity to decide whether to lease or finance your next vehicle.",
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
                "name": "Is it financially smarter to lease or buy a car?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financially, buying is almost always more cost-effective over a 5 to 10 year timeline because you build vehicle equity, eliminate debt once the loan is paid off, and avoid repetitive dealer acquisition fees. Leasing is advantageous if you want lower monthly payments, drive under 12,000 miles per year, deduct business expenses, or prefer driving a new vehicle under warranty every 36 months."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Money Factor in auto leasing and how do I convert it to APR?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Money Factor (also known as lease factor or rent charge) represents the finance charge on a lease. To convert a money factor to an approximate annual percentage rate (APR), multiply the decimal figure by 2,400. For example, a money factor of 0.0025 equates to an APR of 6.0% (0.0025 × 2400 = 6.0%)."
                }
            },
            {
                "@type": "Question",
                "name": "How does vehicle depreciation affect leasing versus buying?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When buying, depreciation reduces your future resale value directly. However, in a lease, you pay for the vehicle's anticipated depreciation during your term plus finance fees. New cars typically lose 20% of their value in the first year and approximately 15% annually thereafter."
                }
            },
            {
                "@type": "Question",
                "name": "Should I make a large down payment (cap cost reduction) on a lease?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Financial advisors generally recommend putting $0 or the minimum possible down payment on a lease. If the vehicle is totaled or stolen during the lease period, insurance pays the leasing bank, and your upfront capitalized cost reduction is usually lost entirely."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT WORKSPACE: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-w-0 p-4 sm:p-6 space-y-6">
                    <div className="space-y-5">

                        {/* Section Header & Currency */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                Vehicle & Financial Terms
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-500">Currency:</span>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 font-semibold text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD/AUD">CAD/AUD ($)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                    title="Reset calculator inputs"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Baseline Vehicle Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Vehicle Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={vehiclePrice === 0 ? "" : vehiclePrice}
                                        onChange={(e) => handleNumberInput(e, (val) => { setVehiclePrice(val); setActivePresetId(null); })}
                                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Sales Tax (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="30"
                                        step="0.1"
                                        value={salesTaxRate === 0 ? "" : salesTaxRate}
                                        onChange={(e) => handleNumberInput(e, setSalesTaxRate)}
                                        className="w-full pl-3 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                    />
                                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Horizon (Yrs)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={holdingPeriodYears === 0 ? "" : holdingPeriodYears}
                                    onChange={(e) => handleNumberInput(e, (val) => setHoldingPeriodYears(Math.max(1, Math.min(12, val))))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition"
                                />
                            </div>
                        </div>

                        {/* Dual Column: Lease Specifics vs Purchase Specifics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                            {/* LEASE PARAMETERS CARD */}
                            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-3">
                                <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs pb-1 border-b border-indigo-100">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                    Lease Contract Terms
                                </div>
                                <div className="space-y-2.5">
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-0.5">
                                            <span>Monthly Payment</span>
                                            <span className="text-indigo-600 font-bold">{currencySymbol}{leaseMonthlyPayment}</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            step="10"
                                            value={leaseMonthlyPayment === 0 ? "" : leaseMonthlyPayment}
                                            onChange={(e) => handleNumberInput(e, (val) => { setLeaseMonthlyPayment(val); setActivePresetId(null); })}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Down Payment</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="250"
                                                value={leaseDownPayment === 0 ? "" : leaseDownPayment}
                                                onChange={(e) => handleNumberInput(e, (val) => { setLeaseDownPayment(val); setActivePresetId(null); })}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Term (Months)</label>
                                            <select
                                                value={leaseTermMonths}
                                                onChange={(e) => setLeaseTermMonths(Number(e.target.value))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value={24}>24 Mos (2 Yrs)</option>
                                                <option value={36}>36 Mos (3 Yrs)</option>
                                                <option value={39}>39 Mos (3.25 Yrs)</option>
                                                <option value={48}>48 Mos (4 Yrs)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Acquisition Fee</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={leaseAcquisitionFee === 0 ? "" : leaseAcquisitionFee}
                                                onChange={(e) => handleNumberInput(e, setLeaseAcquisitionFee)}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Disposition Fee</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={leaseDispositionFee === 0 ? "" : leaseDispositionFee}
                                                onChange={(e) => handleNumberInput(e, setLeaseDispositionFee)}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BUY / FINANCING PARAMETERS CARD */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                                <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs pb-1 border-b border-slate-200">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    Loan Financing Terms
                                </div>
                                <div className="space-y-2.5">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Down Payment</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="500"
                                                value={buyDownPayment === 0 ? "" : buyDownPayment}
                                                onChange={(e) => handleNumberInput(e, (val) => { setBuyDownPayment(val); setActivePresetId(null); })}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Loan Term</label>
                                            <select
                                                value={loanTermMonths}
                                                onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value={36}>36 Mos (3 Yrs)</option>
                                                <option value={48}>48 Mos (4 Yrs)</option>
                                                <option value={60}>60 Mos (5 Yrs)</option>
                                                <option value={72}>72 Mos (6 Yrs)</option>
                                                <option value={84}>84 Mos (7 Yrs)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Loan APR (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="25"
                                                step="0.1"
                                                value={loanInterestRate === 0 ? "" : loanInterestRate}
                                                onChange={(e) => handleNumberInput(e, (val) => { setLoanInterestRate(val); setActivePresetId(null); })}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Dealer / Doc Fees</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={dealerDocFees === 0 ? "" : dealerDocFees}
                                                onChange={(e) => handleNumberInput(e, setDealerDocFees)}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-0.5">
                                            <span>Est. Annual Depreciation</span>
                                            <span className="text-slate-900 font-bold">{annualDepreciationRate}% / yr</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="8"
                                            max="25"
                                            step="1"
                                            value={annualDepreciationRate}
                                            onChange={(e) => setAnnualDepreciationRate(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Presets Horizontal Pill Selector */}
                        <div className="pt-3 border-t border-slate-100 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Fast Comparison Scenarios
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>
                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((p) => {
                                    const isActive = activePresetId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => applyPreset(p)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{p.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"}`}>
                                                {p.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs md:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Analysis" : "Copy Comparison Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs md:text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* RIGHT WORKSPACE: Visual Analytics, Verdict & Comparison Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm min-w-0 p-4 sm:p-6 space-y-6" ref={exportRef}>
                    <div className="space-y-5">

                        {/* Top Banner Verdict */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                                Financial Cost Verdict ({holdingPeriodYears} Yrs)
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Cost Matrix
                                </button>
                                <button
                                    onClick={() => setActiveTab("cashflow")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "cashflow" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Timeline
                                </button>
                            </div>
                        </div>

                        {/* Top Winner Card Highlight */}
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${results.isBuyCheaper
                                ? "bg-emerald-50/80 border-emerald-200"
                                : "bg-indigo-50/80 border-indigo-200"
                            }`}>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <Award className={`w-4 h-4 ${results.isBuyCheaper ? "text-emerald-700" : "text-indigo-700"}`} />
                                    <span className={`text-xs font-extrabold uppercase tracking-wider ${results.isBuyCheaper ? "text-emerald-800" : "text-indigo-800"
                                        }`}>
                                        Recommended Option: {results.isBuyCheaper ? "Buying / Financing" : "Leasing"}
                                    </span>
                                </div>
                                <p className="text-xl md:text-2xl font-black text-slate-900">
                                    Save {currencySymbol}{Math.round(results.netDifference).toLocaleString()}
                                    <span className="text-xs font-semibold text-slate-600 ml-2">
                                        ({results.percentageSaved.toFixed(1)}% total savings)
                                    </span>
                                </p>
                            </div>
                            <div className="text-right hidden sm:block">
                                <span className="text-[11px] font-semibold text-slate-500 block">Horizon Total</span>
                                <span className="text-xs font-bold text-slate-800">{holdingPeriodYears} Years ({holdingPeriodYears * 12} Mos)</span>
                            </div>
                        </div>

                        {/* Tab Content Display */}
                        {activeTab === "overview" && (
                            <div className="space-y-4">
                                {/* Dual Metric Comparison Boxes */}
                                <div className="grid grid-cols-2 gap-3 min-w-0">
                                    {/* Net Cost Buy */}
                                    <div className={`p-3.5 rounded-xl border ${results.isBuyCheaper ? "bg-emerald-50/50 border-emerald-200" : "bg-slate-50 border-slate-200"
                                        }`}>
                                        <p className="text-[11px] font-bold uppercase text-slate-500">Net Cost to Buy</p>
                                        <p className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                                            {currencySymbol}{Math.round(results.netCostToBuy).toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-600 mt-1">
                                            Monthly: <strong>{currencySymbol}{Math.round(results.monthlyLoanPayment).toLocaleString()}/mo</strong>
                                        </p>
                                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                                            Equity Retained: +{currencySymbol}{Math.round(results.netEquityAtEnd).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Net Cost Lease */}
                                    <div className={`p-3.5 rounded-xl border ${!results.isBuyCheaper ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-200"
                                        }`}>
                                        <p className="text-[11px] font-bold uppercase text-slate-500">Net Cost to Lease</p>
                                        <p className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                                            {currencySymbol}{Math.round(results.netCostToLease).toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-slate-600 mt-1">
                                            Monthly: <strong>{currencySymbol}{Math.round(leaseMonthlyPayment).toLocaleString()}/mo</strong>
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                            Equity Retained: {currencySymbol}0
                                        </p>
                                    </div>
                                </div>

                                {/* Visual Ratio Bar Comparison */}
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                                        <span>Cost Ratio Comparison</span>
                                        <span>
                                            Buy {((results.netCostToBuy / (results.netCostToBuy + results.netCostToLease)) * 100).toFixed(0)}% vs Lease {((results.netCostToLease / (results.netCostToBuy + results.netCostToLease)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex">
                                        <div
                                            className="bg-emerald-600 h-full transition-all duration-500"
                                            style={{ width: `${(results.netCostToBuy / (results.netCostToBuy + results.netCostToLease)) * 100}%` }}
                                        />
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${(results.netCostToLease / (results.netCostToBuy + results.netCostToLease)) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Qualitative Pros and Cons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Buying Advantages
                                        </p>
                                        <ul className="text-slate-600 space-y-1 list-disc list-inside">
                                            <li>100% asset ownership & resale equity</li>
                                            <li>Zero mileage caps or damage penalties</li>
                                            <li>Payments end completely when loan clears</li>
                                        </ul>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Leasing Advantages
                                        </p>
                                        <ul className="text-slate-600 space-y-1 list-disc list-inside">
                                            <li>Lower monthly out-of-pocket payment</li>
                                            <li>Drive newer cars with continuous warranty</li>
                                            <li>No vehicle resale or market loss risk</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "breakdown" && (
                            /* Cost Matrix Table Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[290px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Financial Metric</th>
                                            <th className="p-2.5 text-emerald-700">Buying / Financing</th>
                                            <th className="p-2.5 text-indigo-700">Leasing Option</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        <tr>
                                            <td className="p-2.5 font-semibold text-slate-900">Upfront Out-of-Pocket</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(buyDownPayment + results.totalSalesTaxBuy + dealerDocFees).toLocaleString()}</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(leaseDownPayment + leaseAcquisitionFee).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-semibold text-slate-900">Monthly Payment</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(results.monthlyLoanPayment).toLocaleString()}/mo</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(leaseMonthlyPayment).toLocaleString()}/mo</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-semibold text-slate-900">Total Payments in Period</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(results.totalOutofPocketBuy).toLocaleString()}</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(results.totalLeasePaymentsInHorizon).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-semibold text-slate-900">Maintenance & Repairs</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(results.totalBuyMaintenance).toLocaleString()}</td>
                                            <td className="p-2.5">{currencySymbol}{Math.round(results.totalLeaseMaintenance).toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2.5 font-semibold text-slate-900">End-of-Period Asset Value</td>
                                            <td className="p-2.5 text-emerald-600 font-bold">-{currencySymbol}{Math.round(results.estimatedResaleValue).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-slate-400">{currencySymbol}0</td>
                                        </tr>
                                        <tr className="bg-slate-50 font-bold">
                                            <td className="p-2.5 text-slate-900">Net Cost of Ownership</td>
                                            <td className="p-2.5 text-emerald-700">{currencySymbol}{Math.round(results.netCostToBuy).toLocaleString()}</td>
                                            <td className="p-2.5 text-indigo-700">{currencySymbol}{Math.round(results.netCostToLease).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "cashflow" && (
                            /* Timeline Schedule Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[290px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Cum. Lease Paid</th>
                                            <th className="p-2.5">Cum. Buy Paid</th>
                                            <th className="p-2.5">Vehicle Value</th>
                                            <th className="p-2.5 text-indigo-700">Net Lease Cost</th>
                                            <th className="p-2.5 text-emerald-700">Net Buy Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {results.annualSchedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Year {row.year}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.cumulativeLeasePaid).toLocaleString()}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.cumulativeBuyPaid).toLocaleString()}</td>
                                                <td className="p-2.5 text-slate-600">{currencySymbol}{Math.round(row.estimatedCarValue).toLocaleString()}</td>
                                                <td className="p-2.5 font-semibold text-indigo-700">{currencySymbol}{Math.round(row.netLeaseCost).toLocaleString()}</td>
                                                <td className="p-2.5 font-semibold text-emerald-700">{currencySymbol}{Math.round(row.netBuyCost).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                    {/* Bottom Status Footer */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Amortization & Depreciation Model
                        </span>
                        <span>Zero server transmission</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Financial Disclaimer:</strong> This calculator provides comparative estimates for informational and planning purposes only. Actual lease terms, loan interest rates, taxes, dealer fees, and vehicle depreciation curves vary based on creditworthiness, geographical tax jurisdiction, vehicle make/model, and market conditions.
                </p>
            </div>

            {/* BELOW-THE-FOLD THOROUGH CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Core Mechanics of Leasing vs Buying */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Car Lease vs Buy: Core Financial Mechanics Explained
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When acquiring a vehicle, the decision between <strong>leasing</strong> and <strong>financing a purchase</strong> comes down to a fundamental trade-off: paying strictly for the vehicle's temporary depreciation and utility versus financing full ownership to capture residual asset equity over time.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In an auto lease, you pay the difference between the vehicle's agreed initial sales price (Capitalized Cost) and its predicted residual value at the end of the term, plus a finance charge known as the <strong>Money Factor</strong>. In a purchase loan, you borrow the total purchase price (including full sales taxes and dealer fees) and amortize the principal over a fixed term, building equity with every monthly payment.
                    </p>

                    {/* Master Formulas Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulas for Auto Finance
                        </h3>
                        <p className="text-xs text-slate-300">
                            The essential equations governing monthly loan amortization, monthly lease depreciation, and lease finance rent charges:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono text-indigo-300">
                            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans font-bold">Loan Monthly Amortization:</span>
                                <code>PMT = P × [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]</code>
                            </div>
                            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans font-bold">Monthly Lease Base Payment:</span>
                                <code>Lease PMT = (Cap Cost - Residual) / Term + (Cap Cost + Residual) × MF</code>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>P (Principal):</strong> Vehicle Price + Taxes + Fees - Down Payment</div>
                            <div><strong>MF (Money Factor):</strong> Annual Lease APR ÷ 2,400</div>
                            <div><strong>Cap Cost:</strong> Agreed vehicle selling price after rebates</div>
                            <div><strong>Residual Value:</strong> Projected vehicle worth at lease end</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: 5-Year Case Study Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step 5-Year Case Study: $45,000 Vehicle Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate the long-term wealth divergence between leasing and buying, consider a consumer evaluating a <strong>$45,000 MSRP vehicle</strong> over a 5-year (60-month) horizon:
                    </p>

                    {/* Case Study Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Cost Component</th>
                                    <th className="p-3 text-emerald-800">Buy & Finance (60-Mo Loan @ 5.5%)</th>
                                    <th className="p-3 text-indigo-800">Lease (Two Sequential 36-Mo / 24-Mo Leases)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm">
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Upfront Down Payment + Fees</td>
                                    <td className="p-3">$5,000 + $3,150 (Tax) + $500 (Doc) = $8,650</td>
                                    <td className="p-3">$3,000 down + $700 acq fee × 2 cycles = $7,400</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Monthly Cash Payments</td>
                                    <td className="p-3">$764 / mo × 60 mos = $45,840</td>
                                    <td className="p-3">$510 / mo × 60 mos = $30,600</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Routine Maintenance & Repairs</td>
                                    <td className="p-3">$4,200 (Brakes, tires, post-warranty service)</td>
                                    <td className="p-3">$1,200 (Under continuous factory warranty)</td>
                                </tr>
                                <tr className="bg-slate-50 font-bold">
                                    <td className="p-3 text-slate-900">Gross Out-of-Pocket Outflow</td>
                                    <td className="p-3 text-slate-900">$58,690</td>
                                    <td className="p-3 text-slate-900">$39,200</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Asset Resale Value at Year 5</td>
                                    <td className="p-3 text-emerald-600 font-bold">+$20,250 (Vehicle Equity Retained)</td>
                                    <td className="p-3 text-slate-400 font-semibold">$0 (Vehicle returned to dealer)</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Net Cost of Ownership</td>
                                    <td className="p-3 font-extrabold text-emerald-700">$38,440 (Winner)</td>
                                    <td className="p-3 font-bold text-indigo-900">$39,200</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>The Tipping Point:</strong> Notice that while leasing saved <strong>$19,490 in raw monthly cash outflow</strong>, the buyer walked away with a fully paid-off asset worth <strong>$20,250</strong>. If the buyer keeps the vehicle into Years 6 through 10 with zero monthly payments, their financial lead expands rapidly by $6,000+ per year.
                    </p>
                </section>

                {/* Card 3: Deep Comparison Matrix: Pros, Cons, and Hidden Fees */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Feature Comparison: Lease vs Purchase
                        </h2>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Attribute</th>
                                    <th className="p-3">Financing to Own</th>
                                    <th className="p-3">Leasing Contract</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm">
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Vehicle Ownership</td>
                                    <td className="p-3">You own the title once the financing loan is satisfied.</td>
                                    <td className="p-3">The leasing finance company retains ownership and title.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Monthly Cash Commitment</td>
                                    <td className="p-3">Higher payments (financing entire purchase price + tax).</td>
                                    <td className="p-3">30% to 50% lower monthly out-of-pocket payments.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Mileage Limitations</td>
                                    <td className="p-3">Unlimited. Drive as many miles as you desire.</td>
                                    <td className="p-3">Strict limit (usually 10,000–15,000 mi/yr). Excess costs $0.15–$0.30/mi.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Wear and Tear Penalties</td>
                                    <td className="p-3">None. Dents and scratches only affect resale value.</td>
                                    <td className="p-3">End-of-lease inspection charges for excess wear or bald tires.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Customizations & Mods</td>
                                    <td className="p-3">Full freedom to tint, tune, lift, or add accessories.</td>
                                    <td className="p-3">Vehicle must be returned in original factory condition.</td>
                                </tr>
                                <tr>
                                    <td className="p-3 font-semibold text-slate-900">Tax Deductibility (Business)</td>
                                    <td className="p-3">Section 179 / MACRS depreciation deduction schedules.</td>
                                    <td className="p-3">Direct monthly payment write-off for business use percentage.</td>
                                </tr>
                            </tbody>
                        </table>
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
                                Is it financially smarter to lease or buy a car?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financially, buying is almost always more cost-effective over a 5 to 10 year timeline because you build vehicle equity, eliminate debt once the loan is paid off, and avoid repetitive dealer acquisition fees. Leasing is advantageous if you want lower monthly payments, drive under 12,000 miles per year, deduct business expenses, or prefer driving a new vehicle under warranty every 36 months.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Money Factor in auto leasing and how do I convert it to APR?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Money Factor (also known as lease factor or rent charge) represents the finance charge on a lease. To convert a money factor to an approximate annual percentage rate (APR), multiply the decimal figure by 2,400. For example, a money factor of 0.0025 equates to an APR of 6.0% (0.0025 × 2400 = 6.0%).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does vehicle depreciation affect leasing versus buying?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When buying, depreciation reduces your future resale value directly. However, in a lease, you pay for the vehicle's anticipated depreciation during your term plus finance fees. New cars typically lose 20% of their value in the first year and approximately 15% annually thereafter.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I make a large down payment (cap cost reduction) on a lease?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Financial advisors generally recommend putting $0 or the minimum possible down payment on a lease. If the vehicle is totaled or stolen during the lease period, insurance pays the leasing bank, and your upfront capitalized cost reduction is usually lost entirely.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Financial Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and educational purposes only and does not constitute financial, legal, tax, or investment advice. Actual loan APRs, leasing money factors, dealer documentation charges, and state/municipal sales taxes will vary based on individual credit standing and dealer agreements.
                    </p>
                </section>

            </div>
        </div>
    );
}