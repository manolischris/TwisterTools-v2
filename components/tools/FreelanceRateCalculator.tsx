"use client";

import React, { useState, useMemo } from "react";
import {
    DollarSign,
    Clock,
    Percent,
    Briefcase,
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
    HelpCircle,
    BookOpen,
    TrendingUp,
    Receipt,
    Target,
    Scale,
    FileSpreadsheet
} from "lucide-react";

interface PresetTier {
    id: string;
    label: string;
    targetSalary: number;
    annualExpenses: number;
    billableHoursPerWeek: number;
    vacationWeeks: number;
    taxRate: number;
    profitMargin: number;
    tag: string;
}

const PRESET_TIERS: PresetTier[] = [
    {
        id: "starter",
        label: "Junior / Entry Freelancer",
        targetSalary: 55000,
        annualExpenses: 4800,
        billableHoursPerWeek: 22,
        vacationWeeks: 3,
        taxRate: 25,
        profitMargin: 10,
        tag: "$55k Base",
    },
    {
        id: "mid",
        label: "Mid-Level Specialist",
        targetSalary: 95000,
        annualExpenses: 9600,
        billableHoursPerWeek: 25,
        vacationWeeks: 4,
        taxRate: 30,
        profitMargin: 15,
        tag: "$95k Base",
    },
    {
        id: "senior",
        label: "Senior Consultant / Director",
        targetSalary: 160000,
        annualExpenses: 18000,
        billableHoursPerWeek: 20,
        vacationWeeks: 5,
        taxRate: 35,
        profitMargin: 20,
        tag: "$160k Base",
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

export default function FreelanceRateCalculator() {
    // Input States
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [targetSalary, setTargetSalary] = useState<number>(90000);
    const [annualExpenses, setAnnualExpenses] = useState<number>(8500);
    const [taxRate, setTaxRate] = useState<number>(28);
    const [profitMargin, setProfitMargin] = useState<number>(15);
    const [vacationWeeks, setVacationWeeks] = useState<number>(4);
    const [holidaysSickDays, setHolidaysSickDays] = useState<number>(15); // Days
    const [billableHoursPerWeek, setBillableHoursPerWeek] = useState<number>(24);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"breakdown" | "scenarios">("breakdown");

    const currencySymbol = currencySymbols[currency];

    // Mathematical Calculation Engine
    const calculations = useMemo(() => {
        // Time Calculations
        const totalWeeksInYear = 52;
        const workingWeeks = Math.max(1, totalWeeksInYear - vacationWeeks);
        const holidaySickWeeks = holidaysSickDays / 5;
        const netBillableWeeks = Math.max(1, workingWeeks - holidaySickWeeks);
        const annualBillableHours = Math.max(1, netBillableWeeks * billableHoursPerWeek);

        // Financial Baseline Calculations
        // Required gross income before tax to net target salary: Target / (1 - TaxRate)
        const effectiveTaxDecimal = Math.min(0.9, taxRate / 100);
        const grossSalaryRequired = effectiveTaxDecimal < 1 ? targetSalary / (1 - effectiveTaxDecimal) : targetSalary;
        const totalTaxAmount = grossSalaryRequired - targetSalary;

        // Total Cost of Doing Business (TCODB) = Gross Salary + Annual Overhead Expenses
        const baselineOperatingCost = grossSalaryRequired + annualExpenses;

        // Profit Buffer Addition: Total Revenue Goal = Baseline / (1 - ProfitMargin)
        const profitMarginDecimal = Math.min(0.8, profitMargin / 100);
        const annualRevenueGoal = profitMarginDecimal < 1
            ? baselineOperatingCost / (1 - profitMarginDecimal)
            : baselineOperatingCost;
        const profitBufferAmount = annualRevenueGoal - baselineOperatingCost;

        // Rates
        const hourlyRate = annualRevenueGoal / annualBillableHours;
        const dailyRate = hourlyRate * (billableHoursPerWeek / 5);
        const weeklyRate = hourlyRate * billableHoursPerWeek;
        const monthlyRetainer = annualRevenueGoal / 12;

        // Alternative Utilization Scenarios (Hours per week comparisons)
        const scenario20h = annualRevenueGoal / (netBillableWeeks * 20);
        const scenario30h = annualRevenueGoal / (netBillableWeeks * 30);
        const scenario15h = annualRevenueGoal / (netBillableWeeks * 15);

        // Revenue Breakdown Percentages
        const netSalaryPercent = (targetSalary / annualRevenueGoal) * 100;
        const taxPercent = (totalTaxAmount / annualRevenueGoal) * 100;
        const overheadPercent = (annualExpenses / annualRevenueGoal) * 100;
        const profitPercent = (profitBufferAmount / annualRevenueGoal) * 100;

        return {
            workingWeeks,
            netBillableWeeks,
            annualBillableHours,
            grossSalaryRequired,
            totalTaxAmount,
            baselineOperatingCost,
            profitBufferAmount,
            annualRevenueGoal,
            hourlyRate,
            dailyRate,
            weeklyRate,
            monthlyRetainer,
            netSalaryPercent,
            taxPercent,
            overheadPercent,
            profitPercent,
            scenario15h,
            scenario20h,
            scenario30h,
        };
    }, [
        targetSalary,
        annualExpenses,
        taxRate,
        profitMargin,
        vacationWeeks,
        holidaysSickDays,
        billableHoursPerWeek,
    ]);

    const applyPreset = (preset: PresetTier) => {
        setTargetSalary(preset.targetSalary);
        setAnnualExpenses(preset.annualExpenses);
        setBillableHoursPerWeek(preset.billableHoursPerWeek);
        setVacationWeeks(preset.vacationWeeks);
        setTaxRate(preset.taxRate);
        setProfitMargin(preset.profitMargin);
        setActivePresetId(preset.id);
    };

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
        setter(value);
        setActivePresetId(null);
    };

    const handleReset = () => {
        setCurrency("USD");
        setTargetSalary(90000);
        setAnnualExpenses(8500);
        setTaxRate(28);
        setProfitMargin(15);
        setVacationWeeks(4);
        setHolidaysSickDays(15);
        setBillableHoursPerWeek(24);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Freelance Billing Rate Breakdown (TwisterTools):
--------------------------------------------------
Target Net Take-Home: ${currencySymbol}${targetSalary.toLocaleString()}
Annual Overhead Expenses: ${currencySymbol}${annualExpenses.toLocaleString()}
Estimated Tax Provision (${taxRate}%): ${currencySymbol}${Math.round(calculations.totalTaxAmount).toLocaleString()}
Business Profit Margin (${profitMargin}%): ${currencySymbol}${Math.round(calculations.profitBufferAmount).toLocaleString()}
--------------------------------------------------
Gross Annual Revenue Goal: ${currencySymbol}${Math.round(calculations.annualRevenueGoal).toLocaleString()}
Annual Billable Hours: ${Math.round(calculations.annualBillableHours)} hrs/year (${billableHoursPerWeek} hrs/week)
--------------------------------------------------
RECOMMENDED BILLING RATES:
- Hourly Rate: ${currencySymbol}${Math.ceil(calculations.hourlyRate)} / hr
- Day Rate (8h equivalent): ${currencySymbol}${Math.ceil(calculations.dailyRate)} / day
- Monthly Retainer: ${currencySymbol}${Math.ceil(calculations.monthlyRetainer)} / month
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/freelance-rate-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Amount / Value"];
        const rows = [
            ["Target Take-Home Pay", `${currencySymbol}${targetSalary}`],
            ["Annual Overhead Expenses", `${currencySymbol}${annualExpenses}`],
            ["Estimated Taxes", `${currencySymbol}${Math.round(calculations.totalTaxAmount)}`],
            ["Profit & Growth Buffer", `${currencySymbol}${Math.round(calculations.profitBufferAmount)}`],
            ["Total Annual Revenue Target", `${currencySymbol}${Math.round(calculations.annualRevenueGoal)}`],
            ["Billable Weeks Per Year", `${calculations.netBillableWeeks.toFixed(1)}`],
            ["Billable Hours Per Week", `${billableHoursPerWeek}`],
            ["Total Annual Billable Hours", `${Math.round(calculations.annualBillableHours)}`],
            ["Calculated Hourly Rate", `${currencySymbol}${calculations.hourlyRate.toFixed(2)}`],
            ["Calculated Day Rate", `${currencySymbol}${calculations.dailyRate.toFixed(2)}`],
            ["Calculated Monthly Retainer", `${currencySymbol}${calculations.monthlyRetainer.toFixed(2)}`],
        ];

        const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `freelance_rate_model_${targetSalary}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Freelance Hourly Billing Rate & Overhead Calculator",
        "url": "https://twistertools.com/tools/calculators/freelance-rate-calculator",
        "description": "Calculate minimum hourly rates, day rates, retainer pricing, tax provisions, and overhead costs to hit take-home income goals.",
        "applicationCategory": "BusinessApplication",
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
                "name": "Why shouldn't freelancers divide their target salary by 2,080 hours?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard employee works roughly 2,080 hours a year (40 hours × 52 weeks), but freelancers must handle non-billable tasks such as sales, marketing, bookkeeping, and client communications. Most solo consultants realistically log only 20 to 25 billable hours per week over 46 to 48 working weeks. Using 2,080 hours drastically underprices your rate and creates cash-flow deficits."
                }
            },
            {
                "@type": "Question",
                "name": "How should self-employed professionals budget for income and self-employment taxes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In jurisdictions like the United States, independent contractors pay regular income tax plus the full 15.3% FICA self-employment tax (Social Security and Medicare). Setting aside 25% to 35% of net revenues into a dedicated tax reserve is recommended to cover quarterly estimated tax obligations."
                }
            },
            {
                "@type": "Question",
                "name": "What expenses should be categorized under freelance business overhead?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Overhead includes software subscriptions (Adobe Creative Cloud, Figma, GitHub, Notion), hardware depreciation, web hosting, professional liability insurance, legal and accounting retainers, office rent or co-working memberships, phone/internet, and continuing education."
                }
            },
            {
                "@type": "Question",
                "name": "Why is adding a business profit margin essential for freelancers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Your target salary pays you for client labor, but a business profit margin (typically 10% to 25%) provides capital reserves. This fund cushions seasonal downturns, late client payments, emergency equipment replacements, and capital investments without reducing your personal take-home pay."
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

                {/* Left Workspace Panel: Cost, Tax & Capacity Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Rate & Expense Parameters
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
                                <option value="INR">INR (₹)</option>
                                <option value="CAD/AUD">CAD/AUD ($)</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            {/* Target Net Take-Home Salary */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Desired Net Personal Salary
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {currencySymbol}{targetSalary.toLocaleString()} / year
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="2500"
                                        value={targetSalary === 0 ? "" : targetSalary}
                                        onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setTargetSalary, Math.max(0, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Clean take-home cash for living costs after all taxes and overheads.
                                </p>
                            </div>

                            {/* Annual Operating Overhead */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 text-indigo-600" /> Annual Business Overhead & Costs
                                    </label>
                                    <span className="text-sm font-bold text-slate-900">
                                        {currencySymbol}{annualExpenses.toLocaleString()} / year
                                    </span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="500"
                                        value={annualExpenses === 0 ? "" : annualExpenses}
                                        onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setAnnualExpenses, Math.max(0, val)))}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Subscriptions, hardware, web hosting, insurance, legal, accounting, and workspace.
                                </p>
                            </div>

                            {/* Tax Provision & Profit Margin Buffer */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 pt-1">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <Receipt className="w-4 h-4 text-indigo-600" /> Tax Provision Rate (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="70"
                                            step="1"
                                            value={taxRate === 0 ? "" : taxRate}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setTaxRate, Math.max(0, Math.min(70, val))))}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Income & self-employment taxes.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" /> Profit Buffer Margin (%)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            step="1"
                                            value={profitMargin === 0 ? "" : profitMargin}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setProfitMargin, Math.max(0, Math.min(50, val))))}
                                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">%</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">Business emergency reserves.</p>
                                </div>
                            </div>

                            {/* Working Time & Capacity Constraints */}
                            <div className="pt-3 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-500" /> Billable Capacity & Time Off
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Billable Hrs / Wk
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="60"
                                            value={billableHoursPerWeek === 0 ? "" : billableHoursPerWeek}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setBillableHoursPerWeek, Math.max(1, Math.min(60, val))))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">Excludes admin work</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Vacation Weeks
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="26"
                                            value={vacationWeeks === 0 ? "" : vacationWeeks}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setVacationWeeks, Math.max(0, Math.min(26, val))))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">Paid-off weeks</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Holidays & Sick
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={holidaysSickDays === 0 ? "" : holidaysSickDays}
                                            onChange={(e) => handleNumberInput(e, (val) => handleInputChange(setHolidaysSickDays, Math.max(0, Math.min(60, val))))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400">Days per year</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fast Career Preset Selectors */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Career Tier Benchmarks
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESET_TIERS.map((tier) => {
                                    const isActive = activePresetId === tier.id;
                                    return (
                                        <button
                                            key={tier.id}
                                            onClick={() => applyPreset(tier)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{tier.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {tier.tag}
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
                            {copied ? "Copied Summary" : "Copy Rate Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export Model
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Pricing Tiers, Visual Cost Distribution & Scenarios */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Recommended Billing Quotes
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Revenue Structure
                                </button>
                                <button
                                    onClick={() => setActiveTab("scenarios")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "scenarios" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Hours Scenarios
                                </button>
                            </div>
                        </div>

                        {/* Core Rate Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 relative overflow-hidden">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-200/60 px-2 py-0.5 rounded-full inline-block mb-1">
                                    Recommended Minimum
                                </span>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Target Hourly Rate</p>
                                <p className="text-3xl md:text-4xl font-extrabold text-indigo-600 mt-1">
                                    {currencySymbol}{Math.ceil(calculations.hourlyRate)}
                                    <span className="text-sm font-semibold text-slate-600"> / hr</span>
                                </p>
                                <p className="text-[11px] text-indigo-900/80 font-medium mt-1">
                                    Based on {Math.round(calculations.annualBillableHours)} billable hrs/yr
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full inline-block mb-1">
                                    Contractor Standard
                                </span>
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Equivalent Day Rate</p>
                                <p className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{Math.ceil(calculations.dailyRate)}
                                    <span className="text-sm font-semibold text-slate-600"> / day</span>
                                </p>
                                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                    Standard {(billableHoursPerWeek / 5).toFixed(1)} billable hrs/day model
                                </p>
                            </div>
                        </div>

                        {/* Secondary Pricing Equivalents */}
                        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <span className="text-xs font-medium text-slate-500 block">Weekly Client Rate</span>
                                <span className="text-base font-bold text-slate-800">
                                    {currencySymbol}{Math.ceil(calculations.weeklyRate).toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs font-medium text-slate-500 block">Monthly Retainer Baseline</span>
                                <span className="text-base font-bold text-slate-800">
                                    {currencySymbol}{Math.ceil(calculations.monthlyRetainer).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Dynamic Tabs Content */}
                        {activeTab === "breakdown" ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                                        <span>Annual Revenue Target</span>
                                        <span className="font-bold text-indigo-600">
                                            {currencySymbol}{Math.round(calculations.annualRevenueGoal).toLocaleString()} / year
                                        </span>
                                    </div>

                                    {/* Multi-Segment Stacked Bar */}
                                    <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                                        <div
                                            className="bg-indigo-600 h-full transition-all duration-500"
                                            style={{ width: `${calculations.netSalaryPercent}%` }}
                                            title={`Take-Home: ${calculations.netSalaryPercent.toFixed(1)}%`}
                                        />
                                        <div
                                            className="bg-amber-500 h-full transition-all duration-500"
                                            style={{ width: `${calculations.taxPercent}%` }}
                                            title={`Taxes: ${calculations.taxPercent.toFixed(1)}%`}
                                        />
                                        <div
                                            className="bg-slate-600 h-full transition-all duration-500"
                                            style={{ width: `${calculations.overheadPercent}%` }}
                                            title={`Overhead: ${calculations.overheadPercent.toFixed(1)}%`}
                                        />
                                        <div
                                            className="bg-emerald-500 h-full transition-all duration-500"
                                            style={{ width: `${calculations.profitPercent}%` }}
                                            title={`Profit Margin: ${calculations.profitPercent.toFixed(1)}%`}
                                        />
                                    </div>
                                </div>

                                {/* Stacked Legend Breakdown */}
                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                            Net Salary ({calculations.netSalaryPercent.toFixed(0)}%)
                                        </span>
                                        <span className="block font-bold text-slate-900 mt-1">
                                            {currencySymbol}{targetSalary.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                                            Estimated Tax ({calculations.taxPercent.toFixed(0)}%)
                                        </span>
                                        <span className="block font-bold text-slate-900 mt-1">
                                            {currencySymbol}{Math.round(calculations.totalTaxAmount).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
                                            Overhead Costs ({calculations.overheadPercent.toFixed(0)}%)
                                        </span>
                                        <span className="block font-bold text-slate-900 mt-1">
                                            {currencySymbol}{annualExpenses.toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                            Profit Buffer ({calculations.profitPercent.toFixed(0)}%)
                                        </span>
                                        <span className="block font-bold text-slate-900 mt-1">
                                            {currencySymbol}{Math.round(calculations.profitBufferAmount).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Alternate Utilization Scenarios */
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Rate Adjusted by Billable Hours / Week
                                </h3>
                                <div className="space-y-2 text-xs">
                                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-slate-900 block">15 Hours / Week</span>
                                            <span className="text-slate-500 text-[11px]">Heavy admin, sales, agency building</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">
                                            {currencySymbol}{Math.ceil(calculations.scenario15h)} / hr
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-indigo-950 block">20 Hours / Week</span>
                                            <span className="text-indigo-700 text-[11px]">Sustainable solo freelancing baseline</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">
                                            {currencySymbol}{Math.ceil(calculations.scenario20h)} / hr
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                                        <div>
                                            <span className="font-bold text-slate-900 block">30 Hours / Week</span>
                                            <span className="text-slate-500 text-[11px]">High utilization / embedded contractor</span>
                                        </div>
                                        <span className="text-sm font-bold text-indigo-600">
                                            {currencySymbol}{Math.ceil(calculations.scenario30h)} / hr
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side rate calculation
                        </span>
                        <span>Zero server latency</span>
                    </div>
                </div>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Notice:</strong> This calculator provides estimation models for independent contractor rate structuring. Taxes, insurance mandates, and overhead deductions vary significantly by state, country, and legal entity setup. Consult a qualified certified public accountant (CPA) for tax compliance.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: The Freelance Pricing Formula */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Calculate Your True Freelance Hourly Billing Rate
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Transitioning from full-time employment to independent contracting requires a fundamental shift in how you value your working hours. As an employee, your company covers payroll taxes, health insurance, paid vacation, paid sick leave, software licenses, and workplace hardware. As a solo entrepreneur, all of these operational obligations must be funded directly through client billings.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The most common pitfall for new freelancers is dividing an annual salary goal by 2,080 hours (40 hours × 52 weeks). This calculation overlooks unpaid business admin, marketing, client pitching, software subscriptions, self-employment taxes, and time off.
                    </p>

                    {/* Master Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Master Freelance Pricing Equation
                        </h3>
                        <p className="text-xs text-slate-300">
                            To ensure profitability, tax compliance, and sustainable income, use the full cost-of-doing-business formula:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800">
                            Hourly Rate = [ ( (Net Salary / (1 - Tax Rate)) + Overhead Expenses ) / (1 - Profit Margin) ] / (Billable Weeks × Billable Hours/Week)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-2">
                            <div><strong>Net Salary:</strong> Desired personal take-home earnings</div>
                            <div><strong>Tax Rate:</strong> Combined income & self-employment tax provision</div>
                            <div><strong>Overhead Expenses:</strong> Annual software, insurance, equipment, accounting</div>
                            <div><strong>Profit Margin:</strong> Reserve capital buffer for business growth</div>
                            <div><strong>Billable Weeks:</strong> 52 weeks minus vacation, sick days, and holidays</div>
                            <div><strong>Billable Hours:</strong> Real client time excluding unpaid business admin</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Step-by-Step Worked Example */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Example: $100k Take-Home Goal
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Let us walk through the exact financial model for a software engineer or designer aiming for a <strong>$100,000 net take-home salary</strong> with realistic freelance overhead and time constraints:
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <h3 className="font-bold text-slate-900 text-sm">Example Scenario Inputs:</h3>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                            <li><strong>Target Net Take-Home:</strong> $100,000</li>
                            <li><strong>Annual Overhead (SaaS, Hardware, Insurance):</strong> $12,000</li>
                            <li><strong>Estimated Tax Bracket:</strong> 30% (Effective federal + state + self-employment)</li>
                            <li><strong>Business Profit Reserve:</strong> 15%</li>
                            <li><strong>Time Off:</strong> 4 weeks vacation + 10 public holidays/sick days (2 weeks) = 46 working weeks</li>
                            <li><strong>Billable Weekly Capacity:</strong> 22 hours/week (remaining 18 hours devoted to sales, pitching, admin)</li>
                        </ul>
                    </div>

                    {/* Step-by-step table breakdown */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calculation Step</th>
                                    <th className="p-3">Formula Applied</th>
                                    <th className="p-3">Resulting Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1. Gross Pre-Tax Salary</td>
                                    <td className="p-3">$100,000 / (1 - 0.30)</td>
                                    <td className="p-3 font-bold text-slate-900">$142,857</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2. Baseline Operating Cost</td>
                                    <td className="p-3">$142,857 + $12,000 expenses</td>
                                    <td className="p-3 font-bold text-slate-900">$154,857</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3. Gross Revenue Target (with 15% profit)</td>
                                    <td className="p-3">$154,857 / (1 - 0.15)</td>
                                    <td className="p-3 font-bold text-indigo-600">$182,185</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4. Annual Billable Hours</td>
                                    <td className="p-3">46 billable weeks × 22 hours/week</td>
                                    <td className="p-3 font-bold text-slate-900">1,012 hours/year</td>
                                </tr>
                                <tr className="bg-indigo-50/60 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-950">5. Final Required Hourly Rate</td>
                                    <td className="p-3 font-medium text-slate-800">$182,185 / 1,012 hours</td>
                                    <td className="p-3 font-extrabold text-indigo-600 text-base">$180.02 / hour (~$180/hr)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To take home <strong>$100,000</strong> cleanly after overhead and taxes while maintaining a 15% emergency cash cushion, this contractor must bill at <strong>$180/hour</strong> or <strong>$792/day</strong>.
                    </p>
                </section>

                {/* Card 3: Hourly vs Daily vs Retainer vs Value Pricing Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Freelance Billing Models Compared: Which Structure Should You Choose?
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While your hourly baseline establishes your minimum financial threshold, how you package and invoice your services affects client perception and overall profitability:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Pricing Structure</th>
                                    <th className="p-3">Best Use Case</th>
                                    <th className="p-3">Key Advantage</th>
                                    <th className="p-3">Potential Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hourly Rate</td>
                                    <td className="p-3">Unclear scope, ongoing technical maintenance, ad-hoc advisory</td>
                                    <td className="p-3">You get compensated for every single hour of scope creep</td>
                                    <td className="p-3">Penalizes speed and efficiency as you become more experienced</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Day Rate</td>
                                    <td className="p-3">On-site workshops, dedicated agile sprints, short audits</td>
                                    <td className="p-3">Eliminates granular micro-time-tracking by the minute</td>
                                    <td className="p-3">Clients may expect 10-12 hour workdays without clear boundaries</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Monthly Retainer</td>
                                    <td className="p-3">Embedded contracting, fractional leadership (CTO/CMO), ongoing SEO</td>
                                    <td className="p-3">Predictable recurring monthly revenue (MRR) and cash flow</td>
                                    <td className="p-3">Unused retainer hours create disputes if agreements are vague</td>
                                </tr>
                                <tr className="bg-emerald-50/50 hover:bg-emerald-50">
                                    <td className="p-3 font-bold text-emerald-950">Fixed Project / Value-Based</td>
                                    <td className="p-3">Full web builds, brand redesigns, custom software systems</td>
                                    <td className="p-3">Maximum earning potential decoupled completely from time spent</td>
                                    <td className="p-3">Severe scope creep risk if requirements are poorly documented</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Standard Freelance Expense Checklist */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Typical Freelance Overhead Expense Checklist
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To accurately calculate your annual business overhead, include recurring professional expenses across these primary categories:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Receipt className="w-4 h-4 text-indigo-600" /> Software & Hosting
                            </h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                <li>Creative tools (Figma, Adobe)</li>
                                <li>Cloud hosting (AWS, Vercel)</li>
                                <li>CRM & Invoicing (QuickBooks, Stripe)</li>
                                <li>Project management (Notion, Jira)</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> Legal & Professional
                            </h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                <li>Errors & Omissions Insurance</li>
                                <li>CPA tax prep & annual filings</li>
                                <li>Contract lawyer reviews</li>
                                <li>LLC registration fees</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-indigo-600" /> Hardware & Office
                            </h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-1">
                                <li>Laptop depreciation (3-yr cycle)</li>
                                <li>Co-working or home office setup</li>
                                <li>High-speed internet & mobile</li>
                                <li>Conferences & education</li>
                            </ul>
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
                                Why shouldn't freelancers divide their target salary by 2,080 hours?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard employee works roughly 2,080 hours a year (40 hours × 52 weeks), but freelancers must handle non-billable tasks such as sales, marketing, bookkeeping, and client communications. Most solo consultants realistically log only 20 to 25 billable hours per week over 46 to 48 working weeks. Using 2,080 hours drastically underprices your rate and creates cash-flow deficits.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should self-employed professionals budget for income and self-employment taxes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In jurisdictions like the United States, independent contractors pay regular income tax plus the full 15.3% FICA self-employment tax (Social Security and Medicare). Setting aside 25% to 35% of net revenues into a dedicated tax reserve is recommended to cover quarterly estimated tax obligations.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What expenses should be categorized under freelance business overhead?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Overhead includes software subscriptions (Adobe Creative Cloud, Figma, GitHub, Notion), hardware depreciation, web hosting, professional liability insurance, legal and accounting retainers, office rent or co-working memberships, phone/internet, and continuing education.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is adding a business profit margin essential for freelancers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Your target salary pays you for client labor, but a business profit margin (typically 10% to 25%) provides capital reserves. This fund cushions seasonal downturns, late client payments, emergency equipment replacements, and capital investments without reducing your personal take-home pay.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Disclaimer Section */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-500 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-slate-500" /> Professional Financial Notice
                    </h3>
                    <p className="leading-relaxed">
                        Disclaimer: This calculator is provided for informational and financial planning purposes only and does not constitute formal accounting, legal, or tax advice. Individual tax liabilities and overhead deductions depend on jurisdiction, business entity classification, and actual revenue streams.
                    </p>
                </section>

            </div>
        </div>
    );
}