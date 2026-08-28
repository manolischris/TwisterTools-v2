"use client";

import React, { useState, useMemo } from "react";
import {
    Calculator,
    Users,
    Clock,
    DollarSign,
    Briefcase,
    Building2,
    Calendar,
    Plus,
    Trash2,
    RotateCcw,
    Copy,
    CheckCircle2,
    Info,
    HelpCircle,
    TrendingUp,
    Scale,
    Layers,
    FileSpreadsheet,
    ShieldCheck,
    BarChart3,
    BookOpen,
    AlertCircle,
    Check
} from "lucide-react";

interface EmployeeRow {
    id: string;
    name: string;
    hoursPerWeek: number;
    headcount: number;
    hourlyWage: number;
    department: string;
}

const DEFAULT_STANDARD_HOURS = 40;
const DEFAULT_WEEKS_PER_YEAR = 52;

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = 0,
    max = 1000000
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) {
        setter(min);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

export default function FteCalculator() {
    // Mode Selection: "quick" for aggregated hours or "roster" for itemized staff tiering
    const [calcMode, setCalcMode] = useState<"quick" | "roster">("quick");

    // Global Standard Configuration
    const [standardWeeklyHours, setStandardWeeklyHours] = useState<number>(40);
    const [weeksPerYear, setWeeksPerYear] = useState<number>(52);
    const [averageHourlyRate, setAverageHourlyRate] = useState<number>(32);

    // Quick Mode State
    const [quickTotalHours, setQuickTotalHours] = useState<number>(320);
    const [quickTimeFrame, setQuickTimeFrame] = useState<"week" | "month" | "year">("week");
    const [quickFullTimeCount, setQuickFullTimeCount] = useState<number>(6);
    const [quickPartTimeHours, setQuickPartTimeHours] = useState<number>(80);

    // Roster / Department Mode State
    const [employees, setEmployees] = useState<EmployeeRow[]>([
        { id: "1", name: "Senior Engineering Staff", hoursPerWeek: 40, headcount: 4, hourlyWage: 55, department: "Engineering" },
        { id: "2", name: "Junior QA Engineers", hoursPerWeek: 20, headcount: 3, hourlyWage: 28, department: "Engineering" },
        { id: "3", name: "Support Specialists", hoursPerWeek: 30, headcount: 2, hourlyWage: 22, department: "Customer Ops" },
        { id: "4", name: "Weekend Operations Contractor", hoursPerWeek: 16, headcount: 2, hourlyWage: 25, department: "Operations" }
    ]);

    // Quick Roster Add State
    const [newTierName, setNewTierName] = useState<string>("");
    const [newTierHours, setNewTierHours] = useState<number>(20);
    const [newTierHeadcount, setNewTierHeadcount] = useState<number>(1);
    const [newTierWage, setNewTierWage] = useState<number>(30);
    const [newTierDept, setNewTierDept] = useState<string>("General");

    // UI Feedback
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    // Dynamic Benchmarks
    const standardAnnualHours = useMemo(() => {
        return standardWeeklyHours * weeksPerYear;
    }, [standardWeeklyHours, weeksPerYear]);

    const standardMonthlyHours = useMemo(() => {
        return standardAnnualHours / 12;
    }, [standardAnnualHours]);

    // Calculation Engine for Quick Mode
    const quickCalculations = useMemo(() => {
        let normalizedWeeklyHours = 0;

        if (quickTimeFrame === "week") {
            normalizedWeeklyHours = quickTotalHours;
        } else if (quickTimeFrame === "month") {
            normalizedWeeklyHours = (quickTotalHours * 12) / weeksPerYear;
        } else {
            normalizedWeeklyHours = quickTotalHours / weeksPerYear;
        }

        const totalFte = standardWeeklyHours > 0 ? normalizedWeeklyHours / standardWeeklyHours : 0;
        const estimatedAnnualCost = normalizedWeeklyHours * weeksPerYear * averageHourlyRate;
        const estimatedMonthlyCost = estimatedAnnualCost / 12;

        // ACA Full-Time Equivalent Headcount Calculation
        // Full-time = 30+ hrs/wk (1.0 FTE each) + (all PT monthly hours / 120)
        const acaPtFte = quickPartTimeHours > 0 ? (quickPartTimeHours * 4.333) / 120 : 0;
        const totalAcaFte = quickFullTimeCount + acaPtFte;

        return {
            normalizedWeeklyHours,
            totalFte,
            estimatedAnnualCost,
            estimatedMonthlyCost,
            totalAcaFte,
            isAleApplicable: totalAcaFte >= 50
        };
    }, [quickTotalHours, quickTimeFrame, standardWeeklyHours, weeksPerYear, averageHourlyRate, quickFullTimeCount, quickPartTimeHours]);

    // Calculation Engine for Roster Mode
    const rosterCalculations = useMemo(() => {
        let totalWeeklyHours = 0;
        let totalHeadcount = 0;
        let totalWeeklyPayroll = 0;
        const departmentMap: Record<string, { hours: number; fte: number; count: number; payroll: number }> = {};

        employees.forEach((emp) => {
            const rowWeeklyHours = emp.hoursPerWeek * emp.headcount;
            const rowWeeklyCost = rowWeeklyHours * emp.hourlyWage;
            const rowFte = standardWeeklyHours > 0 ? rowWeeklyHours / standardWeeklyHours : 0;

            totalWeeklyHours += rowWeeklyHours;
            totalHeadcount += emp.headcount;
            totalWeeklyPayroll += rowWeeklyCost;

            if (!departmentMap[emp.department]) {
                departmentMap[emp.department] = { hours: 0, fte: 0, count: 0, payroll: 0 };
            }
            departmentMap[emp.department].hours += rowWeeklyHours;
            departmentMap[emp.department].fte += rowFte;
            departmentMap[emp.department].count += emp.headcount;
            departmentMap[emp.department].payroll += rowWeeklyCost;
        });

        const totalFte = standardWeeklyHours > 0 ? totalWeeklyHours / standardWeeklyHours : 0;
        const annualPayroll = totalWeeklyPayroll * weeksPerYear;
        const monthlyPayroll = annualPayroll / 12;
        const averageFteWage = totalWeeklyHours > 0 ? totalWeeklyPayroll / totalWeeklyHours : 0;

        return {
            totalWeeklyHours,
            totalHeadcount,
            totalFte,
            totalWeeklyPayroll,
            annualPayroll,
            monthlyPayroll,
            averageFteWage,
            departmentMap
        };
    }, [employees, standardWeeklyHours, weeksPerYear]);

    // Active Display Aggregates based on Tab
    const activeSummary = useMemo(() => {
        if (calcMode === "quick") {
            return {
                fte: quickCalculations.totalFte,
                weeklyHours: quickCalculations.normalizedWeeklyHours,
                annualHours: quickCalculations.normalizedWeeklyHours * weeksPerYear,
                annualCost: quickCalculations.estimatedAnnualCost,
                monthlyCost: quickCalculations.estimatedMonthlyCost
            };
        }
        return {
            fte: rosterCalculations.totalFte,
            weeklyHours: rosterCalculations.totalWeeklyHours,
            annualHours: rosterCalculations.totalWeeklyHours * weeksPerYear,
            annualCost: rosterCalculations.annualPayroll,
            monthlyCost: rosterCalculations.monthlyPayroll
        };
    }, [calcMode, quickCalculations, rosterCalculations, weeksPerYear]);

    // Roster Handlers
    const handleAddRosterRow = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTierName.trim()) return;

        const newRow: EmployeeRow = {
            id: Date.now().toString(),
            name: newTierName.trim(),
            hoursPerWeek: newTierHours,
            headcount: newTierHeadcount,
            hourlyWage: newTierWage,
            department: newTierDept.trim() || "General"
        };

        setEmployees((prev) => [...prev, newRow]);
        setNewTierName("");
        setNewTierHours(20);
        setNewTierHeadcount(1);
    };

    const handleRemoveRosterRow = (id: string) => {
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    };

    const handleReset = () => {
        setStandardWeeklyHours(DEFAULT_STANDARD_HOURS);
        setWeeksPerYear(DEFAULT_WEEKS_PER_YEAR);
        setAverageHourlyRate(32);
        setQuickTotalHours(320);
        setQuickTimeFrame("week");
        setQuickFullTimeCount(6);
        setQuickPartTimeHours(80);
        setEmployees([
            { id: "1", name: "Senior Engineering Staff", hoursPerWeek: 40, headcount: 4, hourlyWage: 55, department: "Engineering" },
            { id: "2", name: "Junior QA Engineers", hoursPerWeek: 20, headcount: 3, hourlyWage: 28, department: "Engineering" },
            { id: "3", name: "Support Specialists", hoursPerWeek: 30, headcount: 2, hourlyWage: 22, department: "Customer Ops" }
        ]);
    };

    const copySummaryReport = () => {
        let text = `====================================================\n`;
        text += `WORK HOURS TO FULL-TIME EQUIVALENT (FTE) REPORT\n`;
        text += `Generated via TwisterTools FTE Calculator\n`;
        text += `====================================================\n\n`;
        text += `STANDARD WORK BASELINE:\n`;
        text += `  - Full-Time Weekly Standard: ${standardWeeklyHours} hrs/week\n`;
        text += `  - Annual Standard Baseline: ${standardAnnualHours.toLocaleString()} hrs/year (${weeksPerYear} weeks)\n\n`;

        if (calcMode === "quick") {
            text += `CALCULATION MODE: Quick Aggregate Batch\n`;
            text += `  - Total Weekly Hours: ${quickCalculations.normalizedWeeklyHours.toLocaleString()} hrs\n`;
            text += `  - Calculated Total FTE: ${quickCalculations.totalFte.toFixed(2)} FTE\n`;
            text += `  - Est. Annual Payroll: $${Math.round(quickCalculations.estimatedAnnualCost).toLocaleString()}\n`;
            text += `  - Est. Monthly Payroll: $${Math.round(quickCalculations.estimatedMonthlyCost).toLocaleString()}\n`;
            text += `  - ACA Metric (ALE Status): ${quickCalculations.totalAcaFte.toFixed(2)} ACA FTE (${quickCalculations.isAleApplicable ? "ALE Applicable (>=50)" : "Small Employer (<50)"})\n`;
        } else {
            text += `CALCULATION MODE: Itemized Staff & Department Roster\n`;
            text += `  - Total Physical Headcount: ${rosterCalculations.totalHeadcount} employees\n`;
            text += `  - Calculated Total FTE: ${rosterCalculations.totalFte.toFixed(2)} FTE\n`;
            text += `  - Total Weekly Hours: ${rosterCalculations.totalWeeklyHours.toLocaleString()} hrs/week\n`;
            text += `  - Total Annual Payroll: $${Math.round(rosterCalculations.annualPayroll).toLocaleString()}\n`;
            text += `  - Blended Average Wage: $${rosterCalculations.averageFteWage.toFixed(2)}/hr\n\n`;
            text += `DEPARTMENT BREAKDOWN:\n`;
            Object.entries(rosterCalculations.departmentMap).forEach(([dept, data]) => {
                text += `  * ${dept}: ${data.fte.toFixed(2)} FTE (${data.count} staff, ${data.hours} hrs/wk, $${Math.round(data.payroll * weeksPerYear).toLocaleString()}/yr)\n`;
            });
        }
        text += `\n====================================================\n`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Work Hours to Full-Time Equivalent (FTE) Calculator",
        "url": "https://twistertools.com/tools/date-tools/fte-calculator",
        "description": "Enterprise-grade FTE calculator converting part-time and full-time employee work hours into standardized Full-Time Equivalent (FTE) metrics, ACA employer compliance benchmarks, and departmental labor budgets.",
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
                "name": "What is a Full-Time Equivalent (FTE) and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Full-Time Equivalent (FTE) is a standardized metric representing the workload of an employed person in a way that makes workloads or headcounts comparable across contexts. One FTE is equivalent to one employee working full-time hours (typically 40 hours per week or 2,080 hours annually). The formula is: FTE = Total Worked Hours in Period / Standard Full-Time Hours in Period."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between physical headcount and FTE?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Headcount is the absolute number of individual people on a company payroll, regardless of whether they work 5 hours or 40 hours per week. FTE standardizes these hours into full-time equivalents. For instance, two part-time employees working 20 hours each count as a headcount of 2, but represent exactly 1.0 FTE."
                }
            },
            {
                "@type": "Question",
                "name": "How is FTE calculated for ACA (Affordable Care Act) compliance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under the Affordable Care Act (ACA), an Applicable Large Employer (ALE) is an employer with 50 or more full-time employees, including FTEs. For ACA calculations: 1) Count all full-time employees working 30+ hours/week as 1.0 FTE each. 2) Aggregate all monthly hours worked by part-time employees (capped at 120 hours per employee per month) and divide by 120. 3) Sum both figures together."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard full-time annual hours baseline (2,080 vs 1,950 vs 1,820)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the United States, 2,080 hours (40 hours/week * 52 weeks) is the universal annual benchmark. In contrast, many European, UK, and municipal organizations consider 37.5 hours per week (1,950 annual hours) or 35.0 hours per week (1,820 annual hours) as full-time status. This calculator allows you to adjust the baseline to match your local labor laws."
                }
            },
            {
                "@type": "Question",
                "name": "How do universities and academic institutions compute Student FTE (FTE-S)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Academic institutions measure Student Full-Time Equivalency based on credit hour enrollment rather than punch-clock work hours. For undergraduate programs, 1.0 Student FTE is commonly defined as 15 credit hours per semester (or 30 credits per academic year), whereas graduate FTE is typically measured at 9 to 12 credit hours per semester."
                }
            },
            {
                "@type": "Question",
                "name": "How does FTE impact labor cost budgeting and project management?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In project management and corporate budgeting, FTE decouples workload requirements from individual worker scheduling. If a software project demands 3.5 FTE for 6 months, project managers can allocate either 3 full-time engineers and one 20-hour part-time contractor, or 7 half-time engineers, while keeping capacity planning and cost modeling mathematically sound."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schema Injections */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Engine & Global Baselines */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Global Benchmark Configuration */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                    Standard Full-Time Baseline
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                        {standardAnnualHours.toLocaleString()} Annual Hours
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="p-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-800 transition border border-slate-200 flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                        title="Reset all fields to defaults"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset Defaults</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weekly Standard</label>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={1}
                                            max={80}
                                            value={standardWeeklyHours}
                                            onChange={(e) => handleNumberInput(e, setStandardWeeklyHours, 1, 80)}
                                            className="w-full text-xs sm:text-sm font-bold text-slate-800 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">hrs</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Weeks / Year</label>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={1}
                                            max={52}
                                            value={weeksPerYear}
                                            onChange={(e) => handleNumberInput(e, setWeeksPerYear, 1, 52)}
                                            className="w-full text-xs sm:text-sm font-bold text-slate-800 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">wks</span>
                                    </div>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Avg Hourly Wage</label>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <span className="text-xs text-slate-400 font-bold">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={1000}
                                            value={averageHourlyRate}
                                            onChange={(e) => handleNumberInput(e, setAverageHourlyRate, 0, 1000)}
                                            className="w-full text-xs sm:text-sm font-bold text-slate-800 outline-none"
                                        />
                                        <span className="text-[10px] text-slate-400 font-bold">/hr</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mode Selector Tabs */}
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setCalcMode("quick")}
                                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${calcMode === "quick"
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                <span>Quick Aggregate Batch</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCalcMode("roster")}
                                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${calcMode === "roster"
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Users className="w-4 h-4 text-indigo-500" />
                                <span>Itemized Staff Roster</span>
                            </button>
                        </div>

                        {/* WORKSPACE TAB 1: Quick Aggregate Mode */}
                        {calcMode === "quick" && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-800">Total Worked Hours in Target Period</label>
                                        <span className="text-[11px] text-slate-500">Select timeframe below</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                min={0}
                                                max={1000000}
                                                value={quickTotalHours}
                                                onChange={(e) => handleNumberInput(e, setQuickTotalHours, 0, 1000000)}
                                                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setQuickTimeFrame("week")}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${quickTimeFrame === "week" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                    }`}
                                            >
                                                Weekly
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickTimeFrame("month")}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${quickTimeFrame === "month" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                    }`}
                                            >
                                                Monthly
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuickTimeFrame("year")}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${quickTimeFrame === "year" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                    }`}
                                            >
                                                Annual
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ACA Employer Mandate Parameters */}
                                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                            ACA / ALE Mandate Split Inputs
                                        </span>
                                        <span className="text-[10px] text-slate-500">IRS 120-Hr PT Rule</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                Full-Time Staff (30+ hrs/wk)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10000}
                                                value={quickFullTimeCount}
                                                onChange={(e) => handleNumberInput(e, setQuickFullTimeCount, 0, 10000)}
                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                                Part-Time Hours / Wk (All PT)
                                            </label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100000}
                                                value={quickPartTimeHours}
                                                onChange={(e) => handleNumberInput(e, setQuickPartTimeHours, 0, 100000)}
                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* WORKSPACE TAB 2: Itemized Staff Roster */}
                        {calcMode === "roster" && (
                            <div className="space-y-4 animate-in fade-in duration-200">
                                {/* Add Employee / Tier Form */}
                                <form onSubmit={handleAddRosterRow} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Add Staff Role or Shift Tier</span>
                                        <span className="text-[10px] text-slate-500">Batch multiple staff</span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <div className="col-span-2 sm:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Role / Title (e.g. Support Associate)"
                                                value={newTierName}
                                                onChange={(e) => setNewTierName(e.target.value)}
                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hours/Wk per Person</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={newTierHours}
                                                onChange={(e) => handleNumberInput(e, setNewTierHours, 1, 100)}
                                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Staff Headcount</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={500}
                                                value={newTierHeadcount}
                                                onChange={(e) => handleNumberInput(e, setNewTierHeadcount, 1, 500)}
                                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hourly Wage ($)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={1000}
                                                value={newTierWage}
                                                onChange={(e) => handleNumberInput(e, setNewTierWage, 0, 1000)}
                                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Department (e.g. Sales, Support)"
                                            value={newTierDept}
                                            onChange={(e) => setNewTierDept(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Tier</span>
                                        </button>
                                    </div>
                                </form>

                                {/* Roster Table List */}
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {employees.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-4 italic">No staff tiers entered. Add roles above.</p>
                                    ) : (
                                        employees.map((emp) => {
                                            const tierFte = (emp.hoursPerWeek * emp.headcount) / standardWeeklyHours;
                                            return (
                                                <div
                                                    key={emp.id}
                                                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between gap-2 transition"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900 truncate">{emp.name}</span>
                                                            <span className="text-[10px] font-bold bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {emp.department}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                                            {emp.headcount} staff &times; {emp.hoursPerWeek}h/wk @ ${emp.hourlyWage}/hr
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <span className="text-xs font-mono font-black text-indigo-600 block">
                                                                {tierFte.toFixed(2)} FTE
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono block">
                                                                {emp.hoursPerWeek * emp.headcount} hrs/wk
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRosterRow(emp.id)}
                                                            className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                                            title="Delete Staff Tier"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Baseline: {standardWeeklyHours} hrs/wk ({standardAnnualHours.toLocaleString()} hrs/yr)
                        </span>
                        <span className="font-semibold text-emerald-600">Dynamic Precision</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time FTE Metrics & Financial Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Primary FTE Headline Result Card */}
                        <div className="p-5 bg-gradient-to-br from-indigo-50 via-slate-50 to-white border border-indigo-200 rounded-2xl text-center space-y-2 relative overflow-hidden">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-700 block">
                                Calculated Full-Time Equivalent (FTE)
                            </span>
                            <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                                {activeSummary.fte.toFixed(2)}
                                <span className="text-2xl sm:text-3xl text-indigo-600 ml-1 font-bold">FTE</span>
                            </div>
                            <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-1">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                    {Math.round(activeSummary.weeklyHours).toLocaleString()} Weekly Hours
                                </span>
                                <span>&bull;</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                    {Math.round(activeSummary.annualHours).toLocaleString()} Annual Hours
                                </span>
                            </div>
                        </div>

                        {/* Secondary Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Annual Payroll</span>
                                <span className="text-lg font-black text-slate-900 font-mono">
                                    ${Math.round(activeSummary.annualCost).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Based on ${averageHourlyRate}/hr avg</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Monthly Budget</span>
                                <span className="text-lg font-black text-slate-900 font-mono">
                                    ${Math.round(activeSummary.monthlyCost).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Monthly labor expense</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5 col-span-2 sm:col-span-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Workload Ratio</span>
                                <span className="text-lg font-black text-indigo-600 font-mono">
                                    {((activeSummary.fte / (calcMode === "roster" ? Math.max(1, rosterCalculations.totalHeadcount) : Math.max(1, quickFullTimeCount))) * 100).toFixed(0)}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">FTE vs Headcount density</span>
                            </div>
                        </div>

                        {/* ACA ALE Compliance Status Banner (Quick Mode) or Department Grid (Roster Mode) */}
                        {calcMode === "quick" ? (
                            <div className={`p-4 rounded-xl border space-y-2 ${quickCalculations.isAleApplicable
                                    ? "bg-amber-50/70 border-amber-300"
                                    : "bg-emerald-50/70 border-emerald-300"
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-800">
                                        <Building2 className="w-4 h-4 text-indigo-600" />
                                        ACA Employer Shared Responsibility (ALE)
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${quickCalculations.isAleApplicable ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"
                                        }`}>
                                        {quickCalculations.totalAcaFte.toFixed(1)} ACA FTE
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    {quickCalculations.isAleApplicable ? (
                                        <strong>Applicable Large Employer (ALE): Your workforce equals or exceeds 50 full-time equivalents. You are subject to ACA employer shared responsibility provisions and Form 1095-C filings.</strong>
                                    ) : (
                                        <span>Small Employer Status: Your workforce is under 50 full-time equivalents ({quickCalculations.totalAcaFte.toFixed(1)} / 50.0 FTE threshold). You are exempt from ACA employer shared responsibility penalties.</span>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                    Department FTE Allocation Breakdown
                                </span>
                                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                    {Object.entries(rosterCalculations.departmentMap).map(([dept, data]) => (
                                        <div key={dept} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                            <div>
                                                <span className="font-bold text-slate-900">{dept}</span>
                                                <span className="text-[10px] text-slate-500 ml-1.5">({data.count} staff, {data.hours} hrs/wk)</span>
                                            </div>
                                            <div className="text-right font-mono">
                                                <span className="font-bold text-indigo-600">{data.fte.toFixed(2)} FTE</span>
                                                <span className="text-[10px] text-slate-400 block">${Math.round(data.payroll * weeksPerYear).toLocaleString()}/yr</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Copy Full Report Action Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={copySummaryReport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "FTE Breakdown Copied to Clipboard!" : "Copy Full FTE & Payroll Audit Report"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive FTE Fundamentals & Mathematical Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is a Full-Time Equivalent (FTE)? Principles, Definitions, and Formulas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A Full-Time Equivalent (FTE), alternatively referred to as a Whole Time Equivalent (WTE) in the United Kingdom and Commonwealth nations, is a standardized unit of measurement that quantifies the workload of an employed individual or team in a format that makes varied shifts and headcounts directly comparable across organizations.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rather than tracking physical headcounts—where a worker contributing 4 hours per week appears identical on paper to a dedicated 40-hour full-time worker—FTE calculates the total cumulative hours worked divided by the standard baseline hours of a single full-time employee over that same timeframe.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Weekly FTE Equation</h3>
                            <div className="font-mono text-xs bg-white p-2 rounded border border-slate-200 text-slate-800 font-bold">
                                FTE = Total Weekly Hours / 40.0
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard United States baseline where 40 weekly hours equals 1.0 FTE.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Annual FTE Equation</h3>
                            <div className="font-mono text-xs bg-white p-2 rounded border border-slate-200 text-slate-800 font-bold">
                                FTE = Annual Hours / 2,080
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Based on a 52-week calendar year (40 hours/week &times; 52 weeks = 2,080 annual hours).
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Formula III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Monthly FTE Equation</h3>
                            <div className="font-mono text-xs bg-white p-2 rounded border border-slate-200 text-slate-800 font-bold">
                                FTE = Monthly Hours / 173.33
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Derived from 2,080 annual hours divided across 12 calendar months.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Headcount vs FTE Analytical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Headcount vs. Full-Time Equivalent (FTE): Architectural Differences
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Conflating physical employee headcount with FTE is one of the most common pitfalls in corporate financial modeling and resource allocation. The comparison table below illustrates how different staffing configurations alter workload capacity and financial liability:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Staffing Scenario</th>
                                    <th className="p-3">Physical Headcount</th>
                                    <th className="p-3">Total Weekly Hours</th>
                                    <th className="p-3">Calculated FTE (40h Baseline)</th>
                                    <th className="p-3">Organizational Implication</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Five 40-Hour Full-Time Staff</td>
                                    <td className="p-3 font-mono font-bold text-slate-800">5 Staff</td>
                                    <td className="p-3 font-mono">200 hrs/wk</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">5.00 FTE</td>
                                    <td className="p-3 text-xs text-slate-600">Standard core operational baseline with full corporate benefits.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Ten 20-Hour Part-Time Staff</td>
                                    <td className="p-3 font-mono font-bold text-amber-700">10 Staff</td>
                                    <td className="p-3 font-mono">200 hrs/wk</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">5.00 FTE</td>
                                    <td className="p-3 text-xs text-slate-600">Identical labor output to 5 full-time staff, but higher administrative onboarding overhead.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Twenty 10-Hour Weekend Contractors</td>
                                    <td className="p-3 font-mono font-bold text-rose-700">20 Staff</td>
                                    <td className="p-3 font-mono">200 hrs/wk</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">5.00 FTE</td>
                                    <td className="p-3 text-xs text-slate-600">High scheduling flexibility; minimizes fixed full-time benefit obligations.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Blended Engineering & Support Pod</td>
                                    <td className="p-3 font-mono font-bold text-indigo-700">8 Staff</td>
                                    <td className="p-3 font-mono">260 hrs/wk</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">6.50 FTE</td>
                                    <td className="p-3 text-xs text-slate-600">Typical agile pod with 4 full-time leads (160h) and 4 part-time support engineers (100h).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Affordable Care Act (ACA) Compliance & ALE Thresholds */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Affordable Care Act (ACA) Full-Time Equivalent Rules & ALE Compliance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Under the United States Affordable Care Act (ACA), determining whether an organization qualifies as an <strong>Applicable Large Employer (ALE)</strong> hinges entirely on a specialized FTE calculation. Employers that employed an average of at least <strong>50 full-time employees (including FTEs)</strong> during the prior calendar year are classified as ALEs and are subject to the Employer Shared Responsibility provisions under Internal Revenue Code &sect; 4980H.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-600" /> ACA Full-Time Employee Standard
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                For ACA purposes, an employee is considered full-time for a calendar month if they average at least <strong>30 hours of service per week</strong> or <strong>130 hours of service in the calendar month</strong>. Each of these employees counts as 1.0 toward the ALE count.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> The 120-Hour Part-Time Rule
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                To calculate part-time FTEs under ACA regulations: aggregate all hours worked by non-full-time employees in a month (capping any individual at 120 hours), and divide the total by <strong>120</strong>. Add this result to the full-time employee count to determine total ACA FTEs.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400" /> Regulatory Impact of Crossing the 50 FTE Threshold
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">Mandatory Coverage</span>
                                <p>Must offer Minimum Essential Coverage (MEC) providing Minimum Value to at least 95% of full-time staff and dependents.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">IRS Reporting Forms</span>
                                <p>Obligated to file annual Forms 1094-C (transmittal) and 1095-C (individual employee health coverage statements).</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">Penalty A & B Liabilities</span>
                                <p>Subject to non-offering or unaffordability excise taxes if any employee receives a Premium Tax Credit on an exchange.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Global Standards & International Baselines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Full-Time Baselines: United States, UK, Europe, and Australia
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While 40 hours per week (2,080 hours annually) represents the default commercial standard in the United States, statutory and customary full-time employment definitions vary significantly across global jurisdictions:
                    </p>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">United States</span>
                            <h3 className="font-bold text-slate-900 text-sm">40.0 Hours / Week</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                2,080 annual hours standard for federal labor audits; 30.0 hours/week for ACA healthcare mandate determinations.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">United Kingdom</span>
                            <h3 className="font-bold text-slate-900 text-sm">37.5 Hours / Week</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                1,950 annual hours standard (Whole Time Equivalent - WTE). NHS and civil service baseline commonly uses 37.5 hours.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">France (EU)</span>
                            <h3 className="font-bold text-slate-900 text-sm">35.0 Hours / Week</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                1,820 annual hours statutory baseline under French labor law, triggering mandatory overtime or RTT rest days above 35h.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Australia</span>
                            <h3 className="font-bold text-slate-900 text-sm">38.0 Hours / Week</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                1,976 annual hours under the National Employment Standards (NES) maximum ordinary weekly hours framework.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Role-Specific Use Cases & Practical Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Industry Applications: Engineering, Healthcare, Higher Ed, and Federal Grants
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        FTE metrics serve distinct operational functions depending on organizational domain:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Healthcare & Nursing</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">HPPD Metric</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Hospitals calculate nursing FTEs to establish Hours Per Patient Day (HPPD) ratios, ensuring intensive care units maintain legally mandated 1:1 or 1:2 nurse-to-patient staffing levels across 12-hour shifts.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Higher Education</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">FTE-S & Faculty</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Universities compute Student Full-Time Equivalents (FTE-S) by dividing total enrolled semester credit hours by 15 credits, establishing student-to-faculty ratios required for national accreditation.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Federal Grants & NIH</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Person Months</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Government grant applications (such as NIH and NSF research proposals) require Principal Investigators to allocate effort in &quot;Person Months,&quot; directly mapped from percentage FTE commitment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                What is a Full-Time Equivalent (FTE) and how is it calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Full-Time Equivalent (FTE) is a standardized metric representing the workload of an employed person in a way that makes workloads or headcounts comparable across contexts. One FTE is equivalent to one employee working full-time hours (typically 40 hours per week or 2,080 hours annually). The formula is: FTE = Total Worked Hours in Period / Standard Full-Time Hours in Period.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between physical headcount and FTE?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Headcount is the absolute number of individual people on a company payroll, regardless of whether they work 5 hours or 40 hours per week. FTE standardizes these hours into full-time equivalents. For instance, two part-time employees working 20 hours each count as a headcount of 2, but represent exactly 1.0 FTE.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is FTE calculated for ACA (Affordable Care Act) compliance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under the Affordable Care Act (ACA), an Applicable Large Employer (ALE) is an employer with 50 or more full-time employees, including FTEs. For ACA calculations: 1) Count all full-time employees working 30+ hours/week as 1.0 FTE each. 2) Aggregate all monthly hours worked by part-time employees (capped at 120 hours per employee per month) and divide by 120. 3) Sum both figures together.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard full-time annual hours baseline (2,080 vs 1,950 vs 1,820)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the United States, 2,080 hours (40 hours/week &times; 52 weeks) is the universal annual benchmark. In contrast, many European, UK, and municipal organizations consider 37.5 hours per week (1,950 annual hours) or 35.0 hours per week (1,820 annual hours) as full-time status. This calculator allows you to adjust the baseline to match your local labor laws.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do universities and academic institutions compute Student FTE (FTE-S)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Academic institutions measure Student Full-Time Equivalency based on credit hour enrollment rather than punch-clock work hours. For undergraduate programs, 1.0 Student FTE is commonly defined as 15 credit hours per semester (or 30 credits per academic year), whereas graduate FTE is typically measured at 9 to 12 credit hours per semester.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does FTE impact labor cost budgeting and project management?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In project management and corporate budgeting, FTE decouples workload requirements from individual worker scheduling. If a software project demands 3.5 FTE for 6 months, project managers can allocate either 3 full-time engineers and one 20-hour part-time contractor, or 7 half-time engineers, while keeping capacity planning and cost modeling mathematically sound.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}