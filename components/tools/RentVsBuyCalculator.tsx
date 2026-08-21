"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Home,
    Key,
    DollarSign,
    Percent,
    Calendar,
    TrendingUp,
    RefreshCw,
    Download,
    Copy,
    Check,
    Layers,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Scale,
    AlertTriangle,
    BookOpen,
    Lightbulb,
    HelpCircle,
    Building,
    Coins,
    Calculator,
    PieChart
} from "lucide-react";

interface ScheduleRow {
    year: number;
    homeValue: number;
    remainingMortgage: number;
    homeEquity: number;
    cumulativeBuyingCost: number;
    cumulativeRentingCost: number;
    renterSavingsPortfolio: number;
    buyerNetWealth: number;
    renterNetWealth: number;
    wealthDifference: number; // Buyer Wealth - Renter Wealth
}

interface Preset {
    id: string;
    label: string;
    homePrice: number;
    downPaymentPercent: number;
    monthlyRent: number;
    mortgageRate: number;
    years: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "metro-hcol", label: "Metro / HCOL City", homePrice: 850000, downPaymentPercent: 20, monthlyRent: 3400, mortgageRate: 6.8, years: 10, tag: "High Cost" },
    { id: "suburban-starter", label: "Suburban Starter Home", homePrice: 425000, downPaymentPercent: 10, monthlyRent: 2100, mortgageRate: 6.5, years: 15, tag: "Standard" },
    { id: "low-cost-growth", label: "Emerging / LCOL Market", homePrice: 260000, downPaymentPercent: 5, monthlyRent: 1450, mortgageRate: 6.2, years: 7, tag: "Budget" },
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

export default function RentVsBuyCalculator() {
    // Universal & Comparison Parameters
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [horizonYears, setHorizonYears] = useState<number>(10);
    const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(7.0);
    const [inflationRate, setInflationRate] = useState<number>(2.5);

    // Buying Parameters
    const [homePrice, setHomePrice] = useState<number>(450000);
    const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
    const [mortgageRate, setMortgageRate] = useState<number>(6.5);
    const [loanTermYears, setLoanTermYears] = useState<number>(30);
    const [homeAppreciationRate, setHomeAppreciationRate] = useState<number>(4.0);
    const [propertyTaxRate, setPropertyTaxRate] = useState<number>(1.2);
    const [annualHomeInsurance, setAnnualHomeInsurance] = useState<number>(1800);
    const [annualMaintenanceRate, setAnnualMaintenanceRate] = useState<number>(1.0);
    const [buyingClosingCostPercent, setBuyingClosingCostPercent] = useState<number>(3.0);
    const [sellingClosingCostPercent, setSellingClosingCostPercent] = useState<number>(6.0);
    const [monthlyHoa, setMonthlyHoa] = useState<number>(150);

    // Renting Parameters
    const [monthlyRent, setMonthlyRent] = useState<number>(2200);
    const [annualRentIncrease, setAnnualRentIncrease] = useState<number>(3.5);
    const [monthlyRentersInsurance, setMonthlyRentersInsurance] = useState<number>(25);
    const [securityDeposit, setSecurityDeposit] = useState<number>(2200);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"visual" | "schedule">("visual");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Calculations
    const calculations = useMemo(() => {
        const principal = Math.max(0, homePrice * (1 - downPaymentPercent / 100));
        const downPaymentAmount = homePrice * (downPaymentPercent / 100);
        const upfrontBuyingCosts = downPaymentAmount + homePrice * (buyingClosingCostPercent / 100);

        // Fixed Monthly Mortgage Payment (P&I)
        const monthlyRate = mortgageRate / 100 / 12;
        const totalMonths = Math.max(1, loanTermYears * 12);
        let monthlyPI = 0;
        if (monthlyRate > 0 && principal > 0) {
            monthlyPI = (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        } else if (principal > 0) {
            monthlyPI = principal / totalMonths;
        }

        // Initial Year 1 Monthly Breakdown for Buyer
        const initialMonthlyTax = (homePrice * (propertyTaxRate / 100)) / 12;
        const initialMonthlyInsurance = annualHomeInsurance / 12;
        const initialMonthlyMaint = (homePrice * (annualMaintenanceRate / 100)) / 12;
        const initialTotalMonthlyBuy = monthlyPI + initialMonthlyTax + initialMonthlyInsurance + initialMonthlyMaint + monthlyHoa;

        // Initial Monthly Breakdown for Renter
        const initialTotalMonthlyRent = monthlyRent + monthlyRentersInsurance;

        // Amortization & Growth Simulation Schedule
        const schedule: ScheduleRow[] = [];
        let currentHomeVal = homePrice;
        let remainingLoan = principal;
        let cumBuyingCost = upfrontBuyingCosts;
        let cumRentingCost = securityDeposit;

        // Renter opportunity fund starts with buying upfront cash minus rental security deposit
        let renterInvestmentPortfolio = Math.max(0, upfrontBuyingCosts - securityDeposit);
        const monthlyReturn = investmentReturnRate / 100 / 12;

        let breakEvenYear: number | null = null;

        const maxYears = Math.min(40, Math.max(1, horizonYears));

        for (let y = 1; y <= maxYears; y++) {
            let yearBuyerPaid = 0;
            let yearRenterPaid = 0;

            const yearRentMonthly = monthlyRent * Math.pow(1 + annualRentIncrease / 100, y - 1);

            for (let m = 1; m <= 12; m++) {
                // Buyer monthly costs
                const monthlyInterest = remainingLoan * monthlyRate;
                const monthlyPrincipalPaid = Math.min(remainingLoan, monthlyPI - monthlyInterest);
                remainingLoan = Math.max(0, remainingLoan - monthlyPrincipalPaid);

                const currentTax = (currentHomeVal * (propertyTaxRate / 100)) / 12;
                const currentIns = (annualHomeInsurance * Math.pow(1 + inflationRate / 100, y - 1)) / 12;
                const currentMaint = (currentHomeVal * (annualMaintenanceRate / 100)) / 12;
                const buyerMonthOutflow = monthlyPI + currentTax + currentIns + currentMaint + monthlyHoa;
                yearBuyerPaid += buyerMonthOutflow;

                // Renter monthly costs
                const renterMonthOutflow = yearRentMonthly + monthlyRentersInsurance;
                yearRenterPaid += renterMonthOutflow;

                // Portfolio growth & monthly delta cash flow
                renterInvestmentPortfolio = renterInvestmentPortfolio * (1 + monthlyReturn);
                const cashFlowDiff = buyerMonthOutflow - renterMonthOutflow;
                if (cashFlowDiff > 0) {
                    // Buyer spent more out of pocket; renter invests the difference
                    renterInvestmentPortfolio += cashFlowDiff;
                } else {
                    // Renter spent more; drawn from savings portfolio
                    renterInvestmentPortfolio += cashFlowDiff; // Decreases
                }
            }

            // Year-end adjustments
            currentHomeVal = currentHomeVal * (1 + homeAppreciationRate / 100);
            cumBuyingCost += yearBuyerPaid;
            cumRentingCost += yearRenterPaid;

            // Liquid Net Wealth calculations
            const sellingFee = currentHomeVal * (sellingClosingCostPercent / 100);
            const homeEquity = Math.max(0, currentHomeVal - remainingLoan);
            const buyerNetWealth = homeEquity - sellingFee;
            const renterNetWealth = renterInvestmentPortfolio + securityDeposit;
            const wealthDifference = buyerNetWealth - renterNetWealth;

            if (breakEvenYear === null && wealthDifference >= 0) {
                breakEvenYear = y;
            }

            schedule.push({
                year: y,
                homeValue: currentHomeVal,
                remainingMortgage: remainingLoan,
                homeEquity,
                cumulativeBuyingCost: cumBuyingCost,
                cumulativeRentingCost: cumRentingCost,
                renterSavingsPortfolio: renterInvestmentPortfolio,
                buyerNetWealth,
                renterNetWealth,
                wealthDifference,
            });
        }

        const horizonIndex = schedule.length - 1;
        const finalYearData = schedule[horizonIndex] || {
            buyerNetWealth: 0,
            renterNetWealth: 0,
            wealthDifference: 0,
            homeValue: 0,
            remainingMortgage: 0,
            homeEquity: 0,
            cumulativeBuyingCost: 0,
            cumulativeRentingCost: 0,
            renterSavingsPortfolio: 0,
        };

        const isBuyingWinner = finalYearData.wealthDifference >= 0;
        const netDifference = Math.abs(finalYearData.wealthDifference);

        return {
            principal,
            downPaymentAmount,
            upfrontBuyingCosts,
            monthlyPI,
            initialTotalMonthlyBuy,
            initialTotalMonthlyRent,
            schedule,
            breakEvenYear,
            finalYearData,
            isBuyingWinner,
            netDifference,
        };
    }, [
        homePrice,
        downPaymentPercent,
        mortgageRate,
        loanTermYears,
        homeAppreciationRate,
        propertyTaxRate,
        annualHomeInsurance,
        annualMaintenanceRate,
        buyingClosingCostPercent,
        sellingClosingCostPercent,
        monthlyHoa,
        monthlyRent,
        annualRentIncrease,
        monthlyRentersInsurance,
        securityDeposit,
        horizonYears,
        investmentReturnRate,
        inflationRate,
    ]);

    const applyPreset = (preset: Preset) => {
        setHomePrice(preset.homePrice);
        setDownPaymentPercent(preset.downPaymentPercent);
        setMonthlyRent(preset.monthlyRent);
        setMortgageRate(preset.mortgageRate);
        setHorizonYears(preset.years);
        setActivePresetId(preset.id);
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setHorizonYears(10);
        setInvestmentReturnRate(7.0);
        setInflationRate(2.5);
        setHomePrice(450000);
        setDownPaymentPercent(20);
        setMortgageRate(6.5);
        setLoanTermYears(30);
        setHomeAppreciationRate(4.0);
        setPropertyTaxRate(1.2);
        setAnnualHomeInsurance(1800);
        setAnnualMaintenanceRate(1.0);
        setBuyingClosingCostPercent(3.0);
        setSellingClosingCostPercent(6.0);
        setMonthlyHoa(150);
        setMonthlyRent(2200);
        setAnnualRentIncrease(3.5);
        setMonthlyRentersInsurance(25);
        setSecurityDeposit(2200);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Rent vs Buy Break-Even Analysis (TwisterTools):
--------------------------------------------------
Time Horizon: ${horizonYears} Years
Target Property Price: ${currencySymbol}${homePrice.toLocaleString()} (Down: ${downPaymentPercent}%)
Starting Monthly Rent: ${currencySymbol}${monthlyRent.toLocaleString()}/mo
Break-Even Point: ${calculations.breakEvenYear ? `Year ${calculations.breakEvenYear}` : `Beyond ${horizonYears} Years`}
--------------------------------------------------
After ${horizonYears} Years:
• Buyer Estimated Liquid Net Wealth: ${currencySymbol}${Math.round(calculations.finalYearData.buyerNetWealth).toLocaleString()}
• Renter Estimated Investment Wealth: ${currencySymbol}${Math.round(calculations.finalYearData.renterNetWealth).toLocaleString()}
• Financial Verdict: ${calculations.isBuyingWinner ? "Buying builds" : "Renting saves"} ${currencySymbol}${Math.round(calculations.netDifference).toLocaleString()} more wealth.
--------------------------------------------------
Run your custom real estate simulation at twistertools.com/tools/calculators/rent-vs-buy-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = [
            "Year",
            "Home Value",
            "Remaining Mortgage",
            "Home Equity",
            "Buyer Liquid Net Wealth",
            "Renter Investment Portfolio",
            "Cumulative Buying Cost",
            "Cumulative Renting Cost",
            "Wealth Advantage (Buyer - Renter)"
        ];

        const csvRows = [
            headers.join(","),
            ...calculations.schedule.map((r) =>
                [
                    r.year,
                    r.homeValue.toFixed(2),
                    r.remainingMortgage.toFixed(2),
                    r.homeEquity.toFixed(2),
                    r.buyerNetWealth.toFixed(2),
                    r.renterNetWealth.toFixed(2),
                    r.cumulativeBuyingCost.toFixed(2),
                    r.cumulativeRentingCost.toFixed(2),
                    r.wealthDifference.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rent_vs_buy_breakeven_${horizonYears}yrs.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Home Rent vs Buy Break-Even Calculator",
        "url": "https://twistertools.com/tools/calculators/rent-vs-buy-calculator",
        "description": "Calculate exact real estate break-even timelines, opportunity costs, mortgage amortization, and net wealth accumulation comparing homeownership against renting.",
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
                "name": "How is the rent vs buy break-even year calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The break-even year is the exact milestone where the total net wealth of buying (home equity minus transaction and selling costs) surpasses the total net wealth of renting (where down payment savings and monthly cash flow differences are compounded in an alternative investment portfolio)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the 5% rule when deciding whether to rent or buy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 5% rule is a quick heuristic stating that annual unrecoverable costs of homeownership total roughly 5% of property value: ~1% for property taxes, ~1% for home maintenance, and ~3% for the cost of capital (mortgage interest or equity opportunity cost). If equivalent annual rent is less than 5% of the purchase price, renting is often financially advantageous."
                }
            },
            {
                "@type": "Question",
                "name": "Why do transaction closing costs make short-term homeownership expensive?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Home buyers pay 2% to 5% in upfront loan origination, title, and escrow fees, followed by 5% to 8% in real estate agent commissions and transfer fees when selling. Selling within 3 to 5 years rarely allows sufficient appreciation to overcome these heavy sunk costs."
                }
            },
            {
                "@type": "Question",
                "name": "How does investing the down payment difference impact renters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Renters keep upfront capital that would otherwise be tied up in home equity. When invested into diversified index funds yielding 6% to 8% annually, this compounding capital portfolio can match or exceed real estate equity gains, especially in high interest rate climates."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Model Assumptions
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Currency:</span>
                                    <select
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="CAD/AUD">CAD/AUD ($)</option>
                                    </select>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>Reset</span>
                                </button>
                            </div>
                        </div>

                        {/* Presets Horizontal Pill Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Market Scenarios
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
                                            type="button"
                                            onClick={() => applyPreset(preset)}
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section 1: Buying Inputs */}
                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Home className="w-4 h-4 text-indigo-600" /> Home Purchase & Financing
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Home Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="10000"
                                            value={homePrice === 0 ? "" : homePrice}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setHomePrice, Math.max(0, val)))}
                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Down Payment (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={downPaymentPercent === 0 ? "" : downPaymentPercent}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setDownPaymentPercent, Math.min(100, Math.max(0, val))))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mortgage Interest Rate (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="25"
                                            step="0.1"
                                            value={mortgageRate === 0 ? "" : mortgageRate}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setMortgageRate, Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Term</label>
                                    <select
                                        value={loanTermYears}
                                        onChange={(e) => setLoanTermYears(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value={15}>15 Years Fixed</option>
                                        <option value={20}>20 Years Fixed</option>
                                        <option value={30}>30 Years Fixed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Property Tax Rate (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={propertyTaxRate === 0 ? "" : propertyTaxRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setPropertyTaxRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Maintenance (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            value={annualMaintenanceRate === 0 ? "" : annualMaintenanceRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setAnnualMaintenanceRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Renting Inputs */}
                        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Building className="w-4 h-4 text-indigo-600" /> Rental & Alternative Growth
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rent</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            value={monthlyRent === 0 ? "" : monthlyRent}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setMonthlyRent, Math.max(0, val)))}
                                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Rent Increase (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={annualRentIncrease === 0 ? "" : annualRentIncrease}
                                            onChange={(e) => handleNumberInput(e, (val) => setAnnualRentIncrease(Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Renter Investment ROI (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="25"
                                            step="0.5"
                                            value={investmentReturnRate === 0 ? "" : investmentReturnRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setInvestmentReturnRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Home Appreciation Rate (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={homeAppreciationRate === 0 ? "" : homeAppreciationRate}
                                            onChange={(e) => handleNumberInput(e, (val) => setHomeAppreciationRate(Math.max(0, val)))}
                                            className="w-full pl-3 pr-7 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Horizon Slider */}
                        <div>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                                <span>Comparison Horizon</span>
                                <span className="font-bold text-indigo-600">{horizonYears} Years</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                value={horizonYears}
                                onChange={(e) => handleInputChange(setHorizonYears, Number(e.target.value))}
                                className="w-full accent-indigo-600 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Verdict"}
                        </button>
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Results & Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Financial Comparison
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("visual")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "visual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("schedule")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "schedule" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Yearly Schedule
                                </button>
                            </div>
                        </div>

                        {/* Top Verdict Highlight */}
                        <div className={`p-4 rounded-xl border ${calculations.isBuyingWinner
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                : "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                            }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4" />
                                    {horizonYears}-Year Financial Winner: {calculations.isBuyingWinner ? "Buying Home" : "Renting Property"}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-800">
                                    Break-Even: {calculations.breakEvenYear ? `Year ${calculations.breakEvenYear}` : `> ${horizonYears} Yrs`}
                                </span>
                            </div>
                            <p className="text-2xl md:text-3xl font-black mt-2">
                                +{currencySymbol}{Math.round(calculations.netDifference).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                                {calculations.isBuyingWinner
                                    ? `Buying creates ${currencySymbol}${Math.round(calculations.netDifference).toLocaleString()} more liquid net equity than renting and investing over ${horizonYears} years.`
                                    : `Renting and compounding the savings creates ${currencySymbol}${Math.round(calculations.netDifference).toLocaleString()} more liquid portfolio wealth over ${horizonYears} years.`
                                }
                            </p>
                        </div>

                        {/* Monthly Initial Outflow Comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Initial Buyer Outflow</span>
                                <p className="text-xl font-bold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculations.initialTotalMonthlyBuy).toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    P&I: {currencySymbol}{Math.round(calculations.monthlyPI).toLocaleString()} | Tax/Ins/HOA: {currencySymbol}{Math.round(calculations.initialTotalMonthlyBuy - calculations.monthlyPI).toLocaleString()}
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Initial Renter Outflow</span>
                                <p className="text-xl font-bold text-slate-900 mt-1">
                                    {currencySymbol}{Math.round(calculations.initialTotalMonthlyRent).toLocaleString()}<span className="text-xs text-slate-500 font-normal">/mo</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Rent: {currencySymbol}{Math.round(monthlyRent).toLocaleString()} | Ins: {currencySymbol}{monthlyRentersInsurance}
                                </p>
                            </div>
                        </div>

                        {activeTab === "visual" ? (
                            <div className="space-y-4">
                                {/* Visual Wealth Comparison Cards */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Net Liquid Wealth Accumulated in Year {horizonYears}
                                    </h3>

                                    {/* Buyer Equity Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-slate-800">
                                            <span className="flex items-center gap-1.5">
                                                <Home className="w-3.5 h-3.5 text-emerald-600" /> Buyer Realized Equity
                                            </span>
                                            <span className="font-bold">{currencySymbol}{Math.round(calculations.finalYearData.buyerNetWealth).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            5,
                                                            (calculations.finalYearData.buyerNetWealth /
                                                                Math.max(calculations.finalYearData.buyerNetWealth, calculations.finalYearData.renterNetWealth, 1)) *
                                                            100
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Renter Portfolio Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-slate-800">
                                            <span className="flex items-center gap-1.5">
                                                <Coins className="w-3.5 h-3.5 text-indigo-600" /> Renter Investment Fund
                                            </span>
                                            <span className="font-bold">{currencySymbol}{Math.round(calculations.finalYearData.renterNetWealth).toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            5,
                                                            (calculations.finalYearData.renterNetWealth /
                                                                Math.max(calculations.finalYearData.buyerNetWealth, calculations.finalYearData.renterNetWealth, 1)) *
                                                            100
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Upfront Cost Breakdown */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                                    <span className="font-bold text-slate-700 block">Upfront Capital Committed:</span>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Buyer Initial Sunk & Down Payment:</span>
                                        <span className="font-semibold text-slate-900">{currencySymbol}{Math.round(calculations.upfrontBuyingCosts).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Renter Initial Deposit:</span>
                                        <span className="font-semibold text-slate-900">{currencySymbol}{Math.round(securityDeposit).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Yearly Amortization & Growth Schedule */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[300px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Year</th>
                                            <th className="p-2.5">Home Value</th>
                                            <th className="p-2.5">Buyer Equity</th>
                                            <th className="p-2.5">Renter Portfolio</th>
                                            <th className="p-2.5">Advantage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        {calculations.schedule.map((row) => (
                                            <tr key={row.year} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-bold text-slate-900">Yr {row.year}</td>
                                                <td className="p-2.5">{currencySymbol}{Math.round(row.homeValue).toLocaleString()}</td>
                                                <td className="p-2.5 font-semibold text-emerald-700">{currencySymbol}{Math.round(row.buyerNetWealth).toLocaleString()}</td>
                                                <td className="p-2.5 font-semibold text-indigo-700">{currencySymbol}{Math.round(row.renterNetWealth).toLocaleString()}</td>
                                                <td className={`p-2.5 font-bold ${row.wealthDifference >= 0 ? "text-emerald-600" : "text-indigo-600"}`}>
                                                    {row.wealthDifference >= 0 ? `Buy +${currencySymbol}${Math.round(row.wealthDifference).toLocaleString()}` : `Rent +${currencySymbol}${Math.round(Math.abs(row.wealthDifference)).toLocaleString()}`}
                                                </td>
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
                            Deterministic Real-Time Simulation
                        </span>
                        <span>Zero server latency</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Alert */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Real Estate & Investment Disclaimer:</strong> This calculator provides simulated financial modeling based on theoretical inputs. Property tax reassessments, HOA special assessments, capital gains tax rules, regional market fluctuations, and stock market volatility will impact actual real-world outcomes. Consult a certified financial planner and tax advisor before executing major real estate transactions.
                </p>
            </div>

            {/* Below-The-Fold SEO Scaffolding Cards */}
            <div className="space-y-6">
                {/* Card 1: Core Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Financial Mechanics: How Rent vs. Buy Break-Even Works
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Comparing renting and buying is far more complex than contrasting a monthly rent payment against a monthly mortgage payment. A mathematically rigorous comparison accounts for <strong>unrecoverable transaction costs</strong>, <strong>equity principal paydown</strong>, <strong>property appreciation</strong>, and the critical <strong>opportunity cost of capital</strong>.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When you buy a home, substantial funds are frozen in the down payment, loan origination fees, appraisal costs, and transfer taxes. Furthermore, ongoing maintenance, HOA fees, and property taxes represent unrecoverable outflows. Conversely, a renter avoids these upfront sunk costs and maintenance expenses, freeing up excess cash that can be deployed into diversified, liquid capital markets (such as low-cost broad-market index funds).
                    </p>

                    {/* Unrecoverable Cost Equation Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The 5% Rule of Unrecoverable Real Estate Costs
                        </h3>
                        <p className="text-xs text-slate-300">
                            Financial economists evaluate housing decisions by comparing unrecoverable costs between renting and owning:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Annual Unrecoverable Cost ≈ Property Value × (Property Tax % + Maintenance % + Cost of Capital %)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Property Taxes:</strong> ~1.0% to 1.5%</div>
                            <div><strong>Maintenance & Repairs:</strong> ~1.0% to 2.0%</div>
                            <div><strong>Capital Opportunity Cost:</strong> ~3.0%</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Case Study: 10-Year Comparison Breakdown
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To visualize the wealth paths of both choices, consider two professionals evaluating a $450,000 property versus renting an equivalent condo for $2,200/month:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Baseline Simulation Inputs:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Purchase Price:</strong> $450,000 with 20% down ($90,000) at 6.5% 30-year fixed rate.</li>
                            <li><strong>Buying Upfront Closing Costs:</strong> $13,500 (3%).</li>
                            <li><strong>Starting Rent:</strong> $2,200/month escalating at 3.5% annually.</li>
                            <li><strong>Renter Reinvestment Rate:</strong> 7.0% compounded nominal return on down payment and monthly differences.</li>
                            <li><strong>Home Appreciation:</strong> 4.0% compound annual growth.</li>
                        </ul>
                    </div>

                    {/* Milestone Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Timeline</th>
                                    <th className="p-3">Buyer Estimated Liquid Net Worth</th>
                                    <th className="p-3">Renter Compounded Investment Fund</th>
                                    <th className="p-3">Financial Leader</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 1</td>
                                    <td className="p-3">$71,450 (due to closing & selling fees)</td>
                                    <td className="p-3 font-semibold">$108,400</td>
                                    <td className="p-3 text-indigo-600 font-bold">Renting (+ $36,950)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 3</td>
                                    <td className="p-3">$116,200</td>
                                    <td className="p-3 font-semibold">$134,800</td>
                                    <td className="p-3 text-indigo-600 font-bold">Renting (+ $18,600)</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">Year 5 (Break-Even)</td>
                                    <td className="p-3 font-bold text-emerald-700">$172,100</td>
                                    <td className="p-3 font-bold text-indigo-700">$168,900</td>
                                    <td className="p-3 text-emerald-600 font-bold">Buying (+ $3,200)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Year 10</td>
                                    <td className="p-3 font-bold text-emerald-700">$364,500</td>
                                    <td className="p-3 font-semibold text-indigo-700">$279,800</td>
                                    <td className="p-3 text-emerald-600 font-bold">Buying (+ $84,700)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Takeaway:</strong> During the initial 3 years, high upfront purchase fees and mortgage interest make renting significantly more profitable. By Year 5, property appreciation and principal amortization overtake rental costs, creating a decisive long-term wealth advantage for the buyer.
                    </p>
                </section>

                {/* Card 3: Opportunity Cost & Sunk Costs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Coins className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Sunk Costs of Homeownership: Interest, Taxes, and HOA
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A common misconception in personal finance is that "renting is throwing money away." In reality, buyers incur several irreversible sunk costs that build zero equity:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 text-sm block">Mortgage Interest</span>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                In the first 7 to 10 years of a 30-year amortization schedule, over 65% of your monthly mortgage payment goes directly toward bank interest, not home equity.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 text-sm block">Property Taxes & Insurance</span>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Municipal taxes and hazard insurance represent 1.5% to 3.0% of a home's full market value annually, increasing alongside municipal reassessments.
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="font-bold text-slate-900 text-sm block">Maintenance & CapEx</span>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Roof replacements, HVAC units, plumbing emergencies, and routine upkeep cost on average 1% to 2% of total property value every single year.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                How is the rent vs buy break-even year calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The break-even year is the exact milestone where the total net wealth of buying (home equity minus transaction and selling costs) surpasses the total net wealth of renting (where down payment savings and monthly cash flow differences are compounded in an alternative investment portfolio).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the 5% rule when deciding whether to rent or buy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 5% rule is a quick heuristic stating that annual unrecoverable costs of homeownership total roughly 5% of property value: ~1% for property taxes, ~1% for home maintenance, and ~3% for the cost of capital (mortgage interest or equity opportunity cost). If equivalent annual rent is less than 5% of the purchase price, renting is often financially advantageous.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do transaction closing costs make short-term homeownership expensive?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Home buyers pay 2% to 5% in upfront loan origination, title, and escrow fees, followed by 5% to 8% in real estate agent commissions and transfer fees when selling. Selling within 3 to 5 years rarely allows sufficient appreciation to overcome these heavy sunk costs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does investing the down payment difference impact renters?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Renters keep upfront capital that would otherwise be tied up in home equity. When invested into diversified index funds yielding 6% to 8% annually, this compounding capital portfolio can match or exceed real estate equity gains, especially in high interest rate climates.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final Regulatory Disclaimer Card */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-2 text-xs text-slate-500">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Essential Real Estate Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is intended strictly for educational and financial modeling purposes. Real estate markets vary widely by municipality, tax jurisdiction, and macroeconomic condition. None of the calculations generated herein constitute licensed mortgage lending, real estate brokerage, tax, or legal advice.
                    </p>
                </section>
            </div>
        </div>
    );
}