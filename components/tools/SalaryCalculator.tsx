"use client";

import React, { useState, useMemo, useRef } from "react";
import {
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
    PieChart,
    Lightbulb,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    Clock,
    Briefcase,
    Building2,
    Wallet,
    Coins,
    Receipt,
    CheckCircle2
} from "lucide-react";

type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "CAD/AUD";

const currencySymbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹",
    "CAD/AUD": "$",
};

interface PaycheckPreset {
    id: string;
    label: string;
    wageType: "annual" | "hourly";
    wageValue: number;
    hoursPerWeek: number;
    taxRate: number;
    tag: string;
}

const PRESETS: PaycheckPreset[] = [
    { id: "us-median", label: "US Median Salary", wageType: "annual", wageValue: 60000, hoursPerWeek: 40, taxRate: 22, tag: "$60k / yr" },
    { id: "tech-engineer", label: "Senior Tech Engineer", wageType: "annual", wageValue: 140000, hoursPerWeek: 40, taxRate: 28, tag: "$140k / yr" },
    { id: "hourly-freelance", label: "Hourly Freelancer", wageType: "hourly", wageValue: 45, hoursPerWeek: 35, taxRate: 20, tag: "$45 / hr" },
];

export default function SalaryCalculator() {
    // Primary State
    const [currency, setCurrency] = useState<CurrencyCode>("USD");
    const [wageType, setWageType] = useState<"annual" | "hourly">("annual");
    const [wageValue, setWageValue] = useState<number>(75000);
    const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
    const [weeksPerYear, setWeeksPerYear] = useState<number>(52);
    const [overtimeHours, setOvertimeHours] = useState<number>(0);
    const [overtimeRate, setOvertimeRate] = useState<number>(1.5);

    // Deductions & Tax Adjustments
    const [taxRate, setTaxRate] = useState<number>(20); // Effective tax %
    const [preTaxDeductions, setPreTaxDeductions] = useState<number>(300); // Monthly 401k, Health Insurance, etc.
    const [postTaxDeductions, setPostTaxDeductions] = useState<number>(50); // Monthly Roth IRA, Union Dues, etc.

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"breakdown" | "schedule">("breakdown");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const currencySymbol = currencySymbols[currency];
    const exportRef = useRef<HTMLDivElement>(null);

    // Core Paycheck Mathematics
    const calculationResults = useMemo(() => {
        // 1. Calculate Gross Base & Annual Equivalent
        let annualGross = 0;
        let hourlyBaseRate = 0;

        if (wageType === "annual") {
            annualGross = wageValue;
            const totalRegularHours = hoursPerWeek * weeksPerYear;
            hourlyBaseRate = totalRegularHours > 0 ? annualGross / totalRegularHours : 0;
        } else {
            hourlyBaseRate = wageValue;
            annualGross = hourlyBaseRate * hoursPerWeek * weeksPerYear;
        }

        // Overtime calculation
        const annualOvertimeHours = overtimeHours * weeksPerYear;
        const overtimeHourlyRate = hourlyBaseRate * overtimeRate;
        const annualOvertimePay = annualOvertimeHours * overtimeHourlyRate;

        const totalAnnualGross = annualGross + annualOvertimePay;

        // Deductions calculated annually
        const annualPreTaxDeductions = preTaxDeductions * 12;
        const annualPostTaxDeductions = postTaxDeductions * 12;

        // Taxable Income Base
        const taxableIncome = Math.max(0, totalAnnualGross - annualPreTaxDeductions);
        const annualTaxes = taxableIncome * (taxRate / 100);

        // Final Net Take-Home Pay
        const totalAnnualNet = Math.max(0, taxableIncome - annualTaxes - annualPostTaxDeductions);

        // Breakdown conversions
        const breakdown = {
            annual: {
                gross: totalAnnualGross,
                preTax: annualPreTaxDeductions,
                tax: annualTaxes,
                postTax: annualPostTaxDeductions,
                net: totalAnnualNet,
            },
            monthly: {
                gross: totalAnnualGross / 12,
                preTax: annualPreTaxDeductions / 12,
                tax: annualTaxes / 12,
                postTax: annualPostTaxDeductions / 12,
                net: totalAnnualNet / 12,
            },
            biweekly: {
                gross: totalAnnualGross / 26,
                preTax: annualPreTaxDeductions / 26,
                tax: annualTaxes / 26,
                postTax: annualPostTaxDeductions / 26,
                net: totalAnnualNet / 26,
            },
            weekly: {
                gross: totalAnnualGross / 52,
                preTax: annualPreTaxDeductions / 52,
                tax: annualTaxes / 52,
                postTax: annualPostTaxDeductions / 52,
                net: totalAnnualNet / 52,
            },
            daily: {
                gross: totalAnnualGross / (weeksPerYear * 5),
                preTax: annualPreTaxDeductions / (weeksPerYear * 5),
                tax: annualTaxes / (weeksPerYear * 5),
                postTax: annualPostTaxDeductions / (weeksPerYear * 5),
                net: totalAnnualNet / (weeksPerYear * 5),
            },
            hourly: {
                gross: hourlyBaseRate,
                net: (totalAnnualNet / (hoursPerWeek * weeksPerYear + annualOvertimeHours)) || 0,
            },
        };

        return {
            hourlyBaseRate,
            overtimeHourlyRate,
            annualOvertimePay,
            totalAnnualGross,
            annualPreTaxDeductions,
            taxableIncome,
            annualTaxes,
            annualPostTaxDeductions,
            totalAnnualNet,
            breakdown,
        };
    }, [wageType, wageValue, hoursPerWeek, weeksPerYear, overtimeHours, overtimeRate, taxRate, preTaxDeductions, postTaxDeductions]);

    // Handle Preset Quick-Fills
    const applyPreset = (preset: PaycheckPreset) => {
        setWageType(preset.wageType);
        setWageValue(preset.wageValue);
        setHoursPerWeek(preset.hoursPerWeek);
        setTaxRate(preset.taxRate);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCurrency("USD");
        setWageType("annual");
        setWageValue(75000);
        setHoursPerWeek(40);
        setWeeksPerYear(52);
        setOvertimeHours(0);
        setOvertimeRate(1.5);
        setTaxRate(20);
        setPreTaxDeductions(300);
        setPostTaxDeductions(50);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Salary & Paycheck Calculation Breakdown (TwisterTools):
----------------------------------------
Base Rate / Salary: ${wageType === "annual" ? `${currencySymbol}${wageValue.toLocaleString()}/yr` : `${currencySymbol}${wageValue}/hr`}
Work Schedule: ${hoursPerWeek} hrs/week (${weeksPerYear} weeks/yr)
Estimated Tax Rate: ${taxRate}%
----------------------------------------
Gross Annual Income: ${currencySymbol}${Math.round(calculationResults.totalAnnualGross).toLocaleString()}
Annual Pre-Tax Deductions: ${currencySymbol}${Math.round(calculationResults.annualPreTaxDeductions).toLocaleString()}
Annual Taxes Paid: ${currencySymbol}${Math.round(calculationResults.annualTaxes).toLocaleString()}
----------------------------------------
NET TAKE-HOME PAY:
• Annual: ${currencySymbol}${Math.round(calculationResults.breakdown.annual.net).toLocaleString()}
• Monthly: ${currencySymbol}${Math.round(calculationResults.breakdown.monthly.net).toLocaleString()}
• Bi-Weekly (26x): ${currencySymbol}${Math.round(calculationResults.breakdown.biweekly.net).toLocaleString()}
• Weekly: ${currencySymbol}${Math.round(calculationResults.breakdown.weekly.net).toLocaleString()}
• Effective Hourly: ${currencySymbol}${calculationResults.breakdown.hourly.net.toFixed(2)}/hr
----------------------------------------
Calculated at twistertools.com/tools/calculators/salary-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Frequency", "Gross Pay", "Pre-Tax Deductions", "Est. Taxes", "Post-Tax Deductions", "Net Take-Home Pay"];
        const frequencies = [
            { name: "Annual", data: calculationResults.breakdown.annual },
            { name: "Monthly", data: calculationResults.breakdown.monthly },
            { name: "Bi-Weekly (26x)", data: calculationResults.breakdown.biweekly },
            { name: "Weekly (52x)", data: calculationResults.breakdown.weekly },
            { name: "Daily (5 days/wk)", data: calculationResults.breakdown.daily },
        ];

        const csvRows = [
            headers.join(","),
            ...frequencies.map((freq) =>
                [
                    freq.name,
                    freq.data.gross.toFixed(2),
                    freq.data.preTax.toFixed(2),
                    freq.data.tax.toFixed(2),
                    freq.data.postTax.toFixed(2),
                    freq.data.net.toFixed(2),
                ].join(",")
            ),
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `paycheck_breakdown_${wageType}_${wageValue}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Salary & Hourly Paycheck Converter",
        "url": "https://twistertools.com/tools/calculators/salary-calculator",
        "description": "Convert annual salaries to hourly rates and calculate exact net take-home pay across monthly, bi-weekly, weekly, and daily frequencies.",
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
                "name": "How do I convert an annual salary to an hourly wage rate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To convert an annual salary into an hourly rate for a standard full-time position, divide the gross annual salary by 2,080 hours (40 hours per week multiplied by 52 weeks). For instance, a $60,000 annual salary equals approximately $28.85 per hour."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Gross Pay and Net Take-Home Pay?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Gross pay represents total total earnings prior to any payroll subtractions. Net take-home pay is the actual dollar amount deposited into your bank account after deducting taxes, health insurance premiums, 401(k) contributions, and other mandatory withholdings."
                }
            },
            {
                "@type": "Question",
                "name": "How many working hours are in a standard working year?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A traditional full-time work year consists of 2,080 working hours (40 hours per week across 52 weeks). If you take two weeks of unpaid vacation, the working year consists of 2,000 hours (50 weeks)."
                }
            },
            {
                "@type": "Question",
                "name": "How do pre-tax deductions lower my total tax burden?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pre-tax deductions (such as traditional 401(k) retirement contributions, HSA/FSA plans, and health insurance) are subtracted from your gross income BEFORE income taxes are calculated. This reduces your overall taxable income base."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Bi-Weekly and Semi-Monthly pay schedules?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bi-weekly pay occurs every two weeks resulting in 26 paychecks per year (with two months containing 3 paychecks). Semi-monthly pay occurs twice per month (typically on the 1st and 15th) resulting in exactly 24 paychecks per year."
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
                {/* Left Workspace Panel: Inputs & Adjustments */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                                Income & Compensation Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Currency Selector & Pay Type Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Currency Symbol
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

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Compensation Model
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => { setWageType("annual"); setActivePresetId(null); }}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition ${wageType === "annual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                    >
                                        Annual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setWageType("hourly"); setActivePresetId(null); }}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition ${wageType === "hourly" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                    >
                                        Hourly
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Gross Rate Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-indigo-600" />
                                    {wageType === "annual" ? "Gross Annual Salary" : "Hourly Base Pay Rate"}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">{currencySymbol}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step={wageType === "annual" ? "1000" : "0.5"}
                                        value={wageValue || ""}
                                        onChange={(e) => {
                                            setWageValue(Math.max(0, Number(e.target.value)));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            {/* Working Schedule Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Weekly Hours
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="168"
                                        value={hoursPerWeek || ""}
                                        onChange={(e) => setHoursPerWeek(Math.max(1, Number(e.target.value)))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Weeks / Year
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={weeksPerYear || ""}
                                        onChange={(e) => setWeeksPerYear(Math.max(1, Math.min(52, Number(e.target.value))))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            {/* Overtime Controls */}
                            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                                    Overtime Parameters (Optional)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Overtime Hrs / Wk</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={overtimeHours || ""}
                                            onChange={(e) => setOvertimeHours(Math.max(0, Number(e.target.value)))}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">OT Multiplier Rate</label>
                                        <select
                                            value={overtimeRate}
                                            onChange={(e) => setOvertimeRate(Number(e.target.value))}
                                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value={1.5}>1.5x (Standard 1.5x)</option>
                                            <option value={2.0}>2.0x (Double Time)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Deductions & Taxes Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxes & Deductions</h3>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Effective Tax Rate (%)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={taxRate || ""}
                                                onChange={(e) => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                                                className="w-full pl-3 pr-6 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Pre-Tax / Mo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={preTaxDeductions || ""}
                                                onChange={(e) => setPreTaxDeductions(Math.max(0, Number(e.target.value)))}
                                                className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Post-Tax / Mo
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={postTaxDeductions || ""}
                                                onChange={(e) => setPostTaxDeductions(Math.max(0, Number(e.target.value)))}
                                                className="w-full pl-6 pr-2 py-2 rounded-lg border border-slate-200 text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Benchmark Presets
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
                            {copied ? "Copied" : "Copy Paycheck Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Take-Home Results & Frequency Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Paycheck & Take-Home Analysis
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Pay Cards
                                </button>
                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "schedule" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Schedule Table
                                </button>
                            </div>
                        </div>

                        {/* Key Take-Home Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                    Bi-Weekly Take-Home
                                </p>
                                <p className="text-3xl font-extrabold text-emerald-700 mt-1 flex items-center gap-1">
                                    {currencySymbol}{Math.round(calculationResults.breakdown.biweekly.net).toLocaleString()}
                                </p>
                                <p className="text-[11px] font-semibold text-emerald-600 mt-1">
                                    26 Paychecks / Year
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 col-span-2 sm:col-span-1">
                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Equivalent Hourly Rate</p>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">
                                    {currencySymbol}{calculationResults.hourlyBaseRate.toFixed(2)} / hr
                                </p>
                                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                                    Net: {currencySymbol}{calculationResults.breakdown.hourly.net.toFixed(2)} / hr after tax
                                </p>
                            </div>
                        </div>

                        {/* Content Tabs */}
                        {activeTab === "breakdown" ? (
                            <div className="space-y-6">
                                {/* Visual Distribution Bar */}
                                <div className="space-y-3 pt-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Gross Income Allocation
                                    </h3>
                                    <div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                                Net Pay: {currencySymbol}{Math.round(calculationResults.totalAnnualNet).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-rose-600">
                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                                Taxes: {currencySymbol}{Math.round(calculationResults.annualTaxes).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex">
                                            <div
                                                className="bg-emerald-500 h-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(0, (calculationResults.totalAnnualNet / calculationResults.totalAnnualGross) * 100)
                                                    )}%`,
                                                }}
                                            />
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            ((calculationResults.annualPreTaxDeductions + calculationResults.annualPostTaxDeductions) /
                                                                calculationResults.totalAnnualGross) *
                                                            100
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                            <div
                                                className="bg-rose-500 h-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(0, (calculationResults.annualTaxes / calculationResults.totalAnnualGross) * 100)
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Frequency Take-Home Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-2">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Monthly Net</span>
                                        <p className="text-lg font-bold text-slate-900">
                                            {currencySymbol}{Math.round(calculationResults.breakdown.monthly.net).toLocaleString()}
                                        </p>
                                        <span className="text-[10px] text-slate-400">Gross: {currencySymbol}{Math.round(calculationResults.breakdown.monthly.gross).toLocaleString()}</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Weekly Net</span>
                                        <p className="text-lg font-bold text-slate-900">
                                            {currencySymbol}{Math.round(calculationResults.breakdown.weekly.net).toLocaleString()}
                                        </p>
                                        <span className="text-[10px] text-slate-400">Gross: {currencySymbol}{Math.round(calculationResults.breakdown.weekly.gross).toLocaleString()}</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Daily Take-Home</span>
                                        <p className="text-lg font-bold text-slate-900">
                                            {currencySymbol}{Math.round(calculationResults.breakdown.daily.net).toLocaleString()}
                                        </p>
                                        <span className="text-[10px] text-slate-400">Based on 5-day work week</span>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Annual Net</span>
                                        <p className="text-lg font-bold text-emerald-700">
                                            {currencySymbol}{Math.round(calculationResults.totalAnnualNet).toLocaleString()}
                                        </p>
                                        <span className="text-[10px] text-slate-400">Gross: {currencySymbol}{Math.round(calculationResults.totalAnnualGross).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Schedule Table Tab */
                            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[360px] overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200 z-10">
                                        <tr>
                                            <th className="p-2.5">Frequency</th>
                                            <th className="p-2.5">Gross Pay</th>
                                            <th className="p-2.5">Taxes</th>
                                            <th className="p-2.5">Net Take-Home</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        <tr className="hover:bg-slate-50 transition">
                                            <td className="p-2.5 font-bold text-slate-900">Annual (1x)</td>
                                            <td className="p-2.5 text-slate-900">{currencySymbol}{Math.round(calculationResults.breakdown.annual.gross).toLocaleString()}</td>
                                            <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(calculationResults.breakdown.annual.tax).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-emerald-600">{currencySymbol}{Math.round(calculationResults.breakdown.annual.net).toLocaleString()}</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition">
                                            <td className="p-2.5 font-bold text-slate-900">Monthly (12x)</td>
                                            <td className="p-2.5 text-slate-900">{currencySymbol}{Math.round(calculationResults.breakdown.monthly.gross).toLocaleString()}</td>
                                            <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(calculationResults.breakdown.monthly.tax).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-emerald-600">{currencySymbol}{Math.round(calculationResults.breakdown.monthly.net).toLocaleString()}</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition bg-indigo-50/30">
                                            <td className="p-2.5 font-bold text-indigo-900">Bi-Weekly (26x)</td>
                                            <td className="p-2.5 text-slate-900">{currencySymbol}{Math.round(calculationResults.breakdown.biweekly.gross).toLocaleString()}</td>
                                            <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(calculationResults.breakdown.biweekly.tax).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-indigo-700">{currencySymbol}{Math.round(calculationResults.breakdown.biweekly.net).toLocaleString()}</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition">
                                            <td className="p-2.5 font-bold text-slate-900">Weekly (52x)</td>
                                            <td className="p-2.5 text-slate-900">{currencySymbol}{Math.round(calculationResults.breakdown.weekly.gross).toLocaleString()}</td>
                                            <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(calculationResults.breakdown.weekly.tax).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-emerald-600">{currencySymbol}{Math.round(calculationResults.breakdown.weekly.net).toLocaleString()}</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition">
                                            <td className="p-2.5 font-bold text-slate-900">Daily (260x)</td>
                                            <td className="p-2.5 text-slate-900">{currencySymbol}{Math.round(calculationResults.breakdown.daily.gross).toLocaleString()}</td>
                                            <td className="p-2.5 text-rose-600">{currencySymbol}{Math.round(calculationResults.breakdown.daily.tax).toLocaleString()}</td>
                                            <td className="p-2.5 font-bold text-emerald-600">{currencySymbol}{Math.round(calculationResults.breakdown.daily.net).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side instant compilation
                        </span>
                        <span>Effective Tax: {taxRate}%</span>
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

                {/* Card 1: Comprehensive Financial Definitions & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Salary Mechanics & Paycheck Deductions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding the gap between your gross salary quote and the actual funds deposited into your checking account is essential for sound personal budgeting. <strong>Gross Compensation</strong> represents the aggregate headline number promised by an employer, whereas <strong>Net Take-Home Pay</strong> reflects the funds remaining after Federal, State, and local taxes, social security contributions, healthcare premiums, and retirement contributions are subtracted.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-indigo-600" /> Pre-Tax Deductions
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Subtractions made before income taxes are levied (e.g., traditional 401(k), 403(b), health insurance, HSA/FSA). These reduce your total taxable income base.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-indigo-600" /> Post-Tax Deductions
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Subtractions applied after taxes are calculated (e.g., Roth 401(k) contributions, wage garnishments, union dues). These do not alter your tax burden.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> The Equations Behind The Conversion
                        </h3>
                        <p className="text-xs text-slate-300">
                            Our conversion matrix computes pay across every common business frequency:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Hourly to Annual Gross:</strong> Hourly Rate × Weekly Hours × Annual Weeks Worked</div>
                            <div><strong>2. Annual to Hourly Rate:</strong> Annual Gross / (Weekly Hours × Annual Weeks Worked)</div>
                            <div><strong>3. Net Bi-Weekly Paycheck:</strong> [ (Annual Gross - Pre-Tax Deductions) × (1 - Tax Rate) - Post-Tax Deductions ] / 26</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Concrete Worked Mathematical Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Conversion Example: $75,000 Annual Salary
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Let's analyze an employee earning a <strong>$75,000 annual salary</strong> working 40 hours per week across 52 weeks per year with an estimated combined tax rate of 20%, $300/month in pre-tax benefits, and $50/month in post-tax deductions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calculation Step</th>
                                    <th className="p-3">Formula / Operation</th>
                                    <th className="p-3">Resulting Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1. Base Hourly Rate</td>
                                    <td className="p-3">$75,000 / (40 hrs × 52 wks)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">$36.06 / hr</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2. Pre-Tax Deductions</td>
                                    <td className="p-3">$300 / mo × 12 mos</td>
                                    <td className="p-3 font-mono">$3,600 / yr</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3. Taxable Base</td>
                                    <td className="p-3">$75,000 - $3,600</td>
                                    <td className="p-3 font-mono">$71,400 / yr</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4. Estimated Taxes (20%)</td>
                                    <td className="p-3">$71,400 × 0.20</td>
                                    <td className="p-3 font-mono text-rose-600">$14,280 / yr</td>
                                </tr>
                                <tr className="bg-indigo-50/50 hover:bg-indigo-50">
                                    <td className="p-3 font-bold text-indigo-900">5. Final Net Bi-Weekly Paycheck</td>
                                    <td className="p-3 font-medium">($71,400 - $14,280 - $600) / 26</td>
                                    <td className="p-3 font-extrabold text-emerald-700 font-mono text-base">$2,173.85 / pay period</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Key Insight:</strong> Although the gross bi-weekly paycheck appears to be $2,884.62 ($75,000 / 26), actual take-home income is $2,173.85 after accounting for taxes and pre-tax benefit deductions.
                    </p>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
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
                                How do I convert an annual salary to an hourly wage rate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To convert an annual salary into an hourly rate for a standard full-time position, divide the gross annual salary by 2,080 hours (40 hours per week multiplied by 52 weeks). For instance, a $60,000 annual salary equals approximately $28.85 per hour.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Gross Pay and Net Take-Home Pay?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Gross pay represents total earnings prior to any payroll subtractions. Net take-home pay is the actual dollar amount deposited into your bank account after deducting taxes, health insurance premiums, 401(k) contributions, and other mandatory withholdings.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many working hours are in a standard working year?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A traditional full-time work year consists of 2,080 working hours (40 hours per week across 52 weeks). If you take two weeks of unpaid vacation, the working year consists of 2,000 hours (50 weeks).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do pre-tax deductions lower my total tax burden?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Pre-tax deductions (such as traditional 401(k) retirement contributions, HSA/FSA plans, and health insurance) are subtracted from your gross income BEFORE income taxes are calculated. This reduces your overall taxable income base.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Bi-Weekly and Semi-Monthly pay schedules?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Bi-weekly pay occurs every two weeks resulting in 26 paychecks per year (with two months containing 3 paychecks). Semi-monthly pay occurs twice per month (typically on the 1st and 15th) resulting in exactly 24 paychecks per year.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Financial Disclaimer Section */}
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