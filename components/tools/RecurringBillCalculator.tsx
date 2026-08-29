"use client";

import React, { useState, useMemo } from "react";
import {
    CalendarDays,
    DollarSign,
    Calculator,
    Clock,
    RotateCcw,
    Copy,
    CheckCircle2,
    Calendar,
    ArrowRight,
    TrendingUp,
    ShieldAlert,
    HelpCircle,
    Info,
    BookOpen,
    CreditCard,
    Zap,
    Sparkles,
    CheckSquare,
    Layers,
    ChevronRight,
    SlidersHorizontal,
    Compass
} from "lucide-react";

type RecurrenceFrequency =
    | "weekly"
    | "biweekly"
    | "semi-monthly"
    | "monthly"
    | "quarterly"
    | "semi-annually"
    | "annually";

type WeekendHandling = "exact" | "previous-friday" | "following-monday";

interface ScheduleItem {
    cycleNumber: number;
    billingDate: Date;
    formattedDate: string;
    adjustedDate: string;
    wasAdjusted: boolean;
    dayOfWeek: string;
    daysFromPrevious: number;
    cumulativeOutflow: number;
}

const FREQUENCY_LABELS: Record<RecurrenceFrequency, { title: string; desc: string; periodsPerYear: number }> = {
    weekly: { title: "Weekly", desc: "Every 7 days on the designated day of week", periodsPerYear: 52 },
    biweekly: { title: "Bi-Weekly (Every 2 Weeks)", desc: "Every 14 days; results in 26 billing cycles per year", periodsPerYear: 26 },
    "semi-monthly": { title: "Semi-Monthly (Twice / Month)", desc: "1st & 15th or 15th & End of Month (24 cycles/year)", periodsPerYear: 24 },
    monthly: { title: "Monthly", desc: "Once per month on a specific day (12 cycles/year)", periodsPerYear: 12 },
    quarterly: { title: "Quarterly", desc: "Every 3 months (4 billing cycles per year)", periodsPerYear: 4 },
    "semi-annually": { title: "Semi-Annually", desc: "Every 6 months (2 billing cycles per year)", periodsPerYear: 2 },
    annually: { title: "Annually", desc: "Once per calendar year (1 billing cycle)", periodsPerYear: 1 }
};

export default function RecurringBillCalculator() {
    // Input state
    const [billName, setBillName] = useState<string>("Cloud Hosting & SaaS Subscriptions");
    const [billAmount, setBillAmount] = useState<number>(149);
    const [firstDueDate, setFirstDueDate] = useState<string>(() => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    });
    const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
    const [projectionCycles, setProjectionCycles] = useState<number>(12);
    const [weekendRule, setWeekendRule] = useState<WeekendHandling>("previous-friday");
    const [gracePeriodDays, setGracePeriodDays] = useState<number>(0);

    // UI feedback
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

    // Safe number handler
    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min = 0,
        max = 10000000
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

    // Calculate dates and weekend adjustments
    const adjustForWeekend = (date: Date, rule: WeekendHandling): { date: Date; adjusted: boolean } => {
        const d = new Date(date.getTime());
        const day = d.getDay(); // 0 = Sun, 6 = Sat
        if (rule === "exact" || (day !== 0 && day !== 6)) {
            return { date: d, adjusted: false };
        }
        if (day === 6) {
            // Saturday
            if (rule === "previous-friday") {
                d.setDate(d.getDate() - 1);
                return { date: d, adjusted: true };
            }
            if (rule === "following-monday") {
                d.setDate(d.getDate() + 2);
                return { date: d, adjusted: true };
            }
        }
        if (day === 0) {
            // Sunday
            if (rule === "previous-friday") {
                d.setDate(d.getDate() - 2);
                return { date: d, adjusted: true };
            }
            if (rule === "following-monday") {
                d.setDate(d.getDate() + 1);
                return { date: d, adjusted: true };
            }
        }
        return { date: d, adjusted: false };
    };

    // Schedule generation engine
    const schedule = useMemo<ScheduleItem[]>(() => {
        const parts = firstDueDate.split("-");
        if (parts.length !== 3) return [];
        const startYear = parseInt(parts[0], 10);
        const startMonth = parseInt(parts[1], 10) - 1;
        const startDay = parseInt(parts[2], 10);

        if (isNaN(startYear) || isNaN(startMonth) || isNaN(startDay)) return [];

        const baseStartDate = new Date(startYear, startMonth, startDay);
        const list: ScheduleItem[] = [];

        let prevEffectiveDate: Date = baseStartDate;

        for (let i = 0; i < projectionCycles; i++) {
            let cycleDate: Date;

            if (frequency === "weekly") {
                cycleDate = new Date(baseStartDate.getTime());
                cycleDate.setDate(baseStartDate.getDate() + i * 7);
            } else if (frequency === "biweekly") {
                cycleDate = new Date(baseStartDate.getTime());
                cycleDate.setDate(baseStartDate.getDate() + i * 14);
            } else if (frequency === "semi-monthly") {
                // Alternating 1st/15th or startDay and startDay+15
                const monthsToAdd = Math.floor(i / 2);
                const isSecondHalf = i % 2 === 1;
                const targetMonth = startMonth + monthsToAdd;
                const tempYear = startYear + Math.floor(targetMonth / 12);
                const tempMonth = targetMonth % 12;

                if (!isSecondHalf) {
                    cycleDate = new Date(tempYear, tempMonth, startDay);
                } else {
                    const nextHalfDay = startDay <= 15 ? startDay + 14 : Math.max(1, startDay - 15);
                    cycleDate = new Date(tempYear, tempMonth, nextHalfDay);
                }
            } else if (frequency === "monthly") {
                const targetMonth = startMonth + i;
                const targetYear = startYear + Math.floor(targetMonth / 12);
                const actualMonth = targetMonth % 12;
                // Handle month end clipping (e.g. Jan 31 -> Feb 28)
                const lastDayOfTargetMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
                const safeDay = Math.min(startDay, lastDayOfTargetMonth);
                cycleDate = new Date(targetYear, actualMonth, safeDay);
            } else if (frequency === "quarterly") {
                const targetMonth = startMonth + i * 3;
                const targetYear = startYear + Math.floor(targetMonth / 12);
                const actualMonth = targetMonth % 12;
                const lastDayOfTargetMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
                const safeDay = Math.min(startDay, lastDayOfTargetMonth);
                cycleDate = new Date(targetYear, actualMonth, safeDay);
            } else if (frequency === "semi-annually") {
                const targetMonth = startMonth + i * 6;
                const targetYear = startYear + Math.floor(targetMonth / 12);
                const actualMonth = targetMonth % 12;
                const lastDayOfTargetMonth = new Date(targetYear, actualMonth + 1, 0).getDate();
                const safeDay = Math.min(startDay, lastDayOfTargetMonth);
                cycleDate = new Date(targetYear, actualMonth, safeDay);
            } else {
                // Annually
                const targetYear = startYear + i;
                const isLeap = (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
                let safeDay = startDay;
                if (startMonth === 1 && startDay === 29 && !isLeap) {
                    safeDay = 28;
                }
                cycleDate = new Date(targetYear, startMonth, safeDay);
            }

            // Apply grace period if configured
            if (gracePeriodDays > 0) {
                cycleDate.setDate(cycleDate.getDate() + gracePeriodDays);
            }

            // Apply weekend business day adjustment
            const { date: adjustedDateObj, adjusted } = adjustForWeekend(cycleDate, weekendRule);

            const daysFromPrevious =
                i === 0
                    ? 0
                    : Math.round((adjustedDateObj.getTime() - prevEffectiveDate.getTime()) / (1000 * 60 * 60 * 24));

            prevEffectiveDate = adjustedDateObj;

            list.push({
                cycleNumber: i + 1,
                billingDate: cycleDate,
                formattedDate: cycleDate.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }),
                adjustedDate: adjustedDateObj.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }),
                wasAdjusted: adjusted,
                dayOfWeek: adjustedDateObj.toLocaleDateString("en-US", { weekday: "short" }),
                daysFromPrevious,
                cumulativeOutflow: (i + 1) * billAmount
            });
        }

        return list;
    }, [firstDueDate, frequency, projectionCycles, weekendRule, gracePeriodDays, billAmount]);

    // Financial calculations & annualized cost
    const annualizedCost = useMemo(() => {
        const rate = FREQUENCY_LABELS[frequency].periodsPerYear;
        return billAmount * rate;
    }, [billAmount, frequency]);

    const totalProjectedSpend = useMemo(() => {
        return billAmount * projectionCycles;
    }, [billAmount, projectionCycles]);

    const nextPaymentDate = schedule.length > 0 ? schedule[0].adjustedDate : "N/A";
    const finalProjectedDate = schedule.length > 0 ? schedule[schedule.length - 1].adjustedDate : "N/A";

    // Copy to clipboard
    const copyScheduleToClipboard = () => {
        const header = `Recurring Bill Schedule: ${billName}\nAmount per Cycle: $${billAmount.toFixed(2)} | Frequency: ${FREQUENCY_LABELS[frequency].title}\nAnnualized Total: $${annualizedCost.toFixed(2)}\n------------------------------------------------------------\nCycle # | Scheduled Date | Adjusted Due Date | Weekday | Outflow\n------------------------------------------------------------\n`;
        const rows = schedule
            .map(
                (item) =>
                    `#${String(item.cycleNumber).padStart(2, "0")}     | ${item.formattedDate.padEnd(14, " ")} | ${item.adjustedDate.padEnd(17, " ")} | ${item.dayOfWeek.padEnd(7, " ")} | $${item.cumulativeOutflow.toFixed(2)}`
            )
            .join("\n");
        const footer = `\n------------------------------------------------------------\nGenerated with TwisterTools Bill Due Date & Recurring Cycle Schedule Calculator`;

        navigator.clipboard.writeText(header + rows + footer);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Bill Due Date & Recurring Cycle Schedule Calculator",
        "url": "https://twistertools.com/tools/date-tools/recurring-bill-calculator",
        "description": "Enterprise-grade recurring payment timeline calculator. Forecast monthly, bi-weekly, semi-monthly, and annual bill due dates with business-day weekend adjustments.",
        "applicationCategory": "FinancialApplication",
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
                "name": "What is the difference between bi-weekly and semi-monthly recurring billing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bi-weekly billing occurs every 14 days, resulting in 26 billing cycles per calendar year (with two months containing 3 payment dates). Semi-monthly billing occurs exactly twice per calendar month (e.g., on the 1st and 15th, or 15th and the final day of the month), resulting in exactly 24 billing cycles per year."
                }
            },
            {
                "@type": "Question",
                "name": "How does this calculator handle bill due dates that fall on weekends or bank holidays?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This utility offers three banking adjustment rules: Exact Date (no adjustment), Previous Business Day (shifts Saturday/Sunday due dates back to Friday to prevent late fees before non-clearing bank days), and Following Business Day (shifts to Monday, matching standard ACH debit processing rules)."
                }
            },
            {
                "@type": "Question",
                "name": "How are month-end dates handled for shorter months like February?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If a recurring monthly bill is set for the 29th, 30th, or 31st, the calculator automatically snaps to the last valid calendar day for shorter months (e.g., February 28th or 29th in a leap year, and April 30th) to ensure uninterrupted schedule forecasting."
                }
            },
            {
                "@type": "Question",
                "name": "Can I factor in a grace period for credit cards and utility bills?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can add a custom grace period offset (in days) to calculate the final deadline before statutory late payment fees or credit bureau default reporting occurs."
                }
            },
            {
                "@type": "Question",
                "name": "Why is annualized cost calculation crucial for SaaS subscriptions and recurring obligations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Recurring expenses frequently obscure cash flow burn when framed only as monthly or weekly amounts. Annualizing recurring expenses aggregates micro-transactions into total liability projections, allowing individuals and corporate finance teams to accurately budget working capital."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured JSON-LD Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input & Cycle Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Title Bar inside card */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                                Schedule Parameters
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setBillName("Cloud Hosting & SaaS Subscriptions");
                                    setBillAmount(149);
                                    setFrequency("monthly");
                                    setProjectionCycles(12);
                                    setWeekendRule("previous-friday");
                                    setGracePeriodDays(0);
                                }}
                                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Defaults
                            </button>
                        </div>

                        {/* Bill Title & Amount */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Bill / Subscription Title
                                </label>
                                <input
                                    type="text"
                                    value={billName}
                                    onChange={(e) => setBillName(e.target.value)}
                                    placeholder="e.g., Office Lease, AWS Cloud, Insurance"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Amount Per Cycle ($)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <DollarSign className="w-4 h-4" />
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={billAmount === 0 ? "" : billAmount}
                                            onChange={(e) => handleNumberChange(e, setBillAmount, 0, 10000000)}
                                            placeholder="0.00"
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        First Due / Anchor Date
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={firstDueDate}
                                            onChange={(e) => setFirstDueDate(e.target.value)}
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Frequency Selection */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Recurrence Cadence
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {(
                                    [
                                        "weekly",
                                        "biweekly",
                                        "semi-monthly",
                                        "monthly",
                                        "quarterly",
                                        "annually"
                                    ] as RecurrenceFrequency[]
                                ).map((freqKey) => {
                                    const isSelected = frequency === freqKey;
                                    return (
                                        <button
                                            key={freqKey}
                                            type="button"
                                            onClick={() => setFrequency(freqKey)}
                                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${isSelected
                                                ? "bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400 text-indigo-900"
                                                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                                                }`}
                                        >
                                            <div className="text-xs font-bold truncate">
                                                {FREQUENCY_LABELS[freqKey].title.split(" (")[0]}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-medium">
                                                {FREQUENCY_LABELS[freqKey].periodsPerYear}x / year
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Advanced Schedule Rules: Weekend Handling & Grace Period */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                                Banking Adjustment Rules
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Weekend Due Date Rule
                                    </label>
                                    <select
                                        value={weekendRule}
                                        onChange={(e) => setWeekendRule(e.target.value as WeekendHandling)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="previous-friday">Previous Friday (Conservative)</option>
                                        <option value="following-monday">Following Monday (ACH Standard)</option>
                                        <option value="exact">Exact Date (No Adjustment)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Grace Period (Days Offset)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={60}
                                            value={gracePeriodDays === 0 ? "" : gracePeriodDays}
                                            onChange={(e) => handleNumberChange(e, setGracePeriodDays, 0, 60)}
                                            placeholder="0"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-500 font-medium">days</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>Projection Scope ({projectionCycles} cycles)</span>
                                    <span className="font-mono text-indigo-600 font-bold">{projectionCycles} billing dates</span>
                                </div>
                                <input
                                    type="range"
                                    min={3}
                                    max={36}
                                    step={1}
                                    value={projectionCycles}
                                    onChange={(e) => setProjectionCycles(parseInt(e.target.value, 10))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Left Panel Footer Summary */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Active Cadence: {FREQUENCY_LABELS[frequency].title}
                        </span>
                        <span className="font-semibold text-emerald-600">Dynamic Auto-Recalculation</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Financial Forecast & Projected Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Financial Metric Badges */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Annualized Cost</span>
                                <span className="text-lg sm:text-2xl font-black text-indigo-600 font-mono">
                                    ${annualizedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{FREQUENCY_LABELS[frequency].periodsPerYear} cycles / yr</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Scope Total</span>
                                <span className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
                                    ${totalProjectedSpend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{projectionCycles} future payments</span>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-0.5">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Next Due Date</span>
                                <span className="text-xs sm:text-sm font-black text-emerald-600 block mt-1 truncate">
                                    {nextPaymentDate}
                                </span>
                                <span className="text-[10px] text-slate-400 block">Horizon: {finalProjectedDate}</span>
                            </div>
                        </div>

                        {/* Schedule Projection Table */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <CalendarDays className="w-4 h-4 text-indigo-600" />
                                    Upcoming Billing Schedule
                                </h3>
                                <span className="text-xs text-slate-500 font-medium">
                                    Showing next {projectionCycles} cycles
                                </span>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-2.5">#</th>
                                            <th className="p-2.5">Scheduled Due</th>
                                            <th className="p-2.5">Banking Due</th>
                                            <th className="p-2.5">Interval</th>
                                            <th className="p-2.5 text-right">Cumulative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {schedule.map((item) => (
                                            <tr key={item.cycleNumber} className="hover:bg-slate-50/80 transition">
                                                <td className="p-2.5 font-mono font-bold text-slate-400">
                                                    #{item.cycleNumber}
                                                </td>
                                                <td className="p-2.5 font-mono text-slate-600">
                                                    {item.formattedDate}
                                                </td>
                                                <td className="p-2.5 font-semibold text-slate-900">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{item.adjustedDate}</span>
                                                        <span className="text-[10px] font-mono text-slate-500">
                                                            ({item.dayOfWeek})
                                                        </span>
                                                        {item.wasAdjusted && (
                                                            <span
                                                                className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200"
                                                                title="Adjusted for weekend non-clearing bank day"
                                                            >
                                                                Shifted
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2.5 font-mono text-slate-500">
                                                    {item.cycleNumber === 1 ? "Anchor" : `+${item.daysFromPrevious}d`}
                                                </td>
                                                <td className="p-2.5 font-mono font-bold text-indigo-600 text-right">
                                                    ${item.cumulativeOutflow.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>

                    {/* Copy to Clipboard CTA */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={copyScheduleToClipboard}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "Schedule Copied to Clipboard!" : "Copy Full Billing Schedule & Breakdown"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Overview and Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Recurring Billing Cycles: Frequencies, Anchor Dates, and Cash Flow
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Managing recurring financial obligations—such as commercial leases, SaaS vendor agreements, utility accounts, and debt service amortization—requires precise forecasting of invoice schedules. A failure to anticipate due date intervals creates cash flow bottlenecks, overdraft fees, and friction in accounting reconciliation.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different financial institutions and service providers calculate recurrence on diverging temporal cadences. While standard monthly subscriptions bill twelve times per year, weekly and bi-weekly schedules create &quot;three-paycheck months&quot; and 26-cycle annual totals. This utility accurately projects exact calendar dates, incorporates banking holiday shifts, and annualizes liabilities to ensure precise liquidity management.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Anchor Date Drift</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When a recurring payment is set on the 29th, 30th, or 31st, non-31-day months (e.g., February and April) require automatic month-end snapping to prevent calendar calculation collapse.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept II</span>
                            <h3 className="font-bold text-slate-900 text-sm">ACH Clearing Delays</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Automated Clearing House (ACH) and wire transfers do not settle on federal banking holidays or weekends. Adjusting dates to the previous Friday guarantees capital clearance prior to due dates.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Cumulative Liability</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Tracking total multi-cycle outflow over customizable projection horizons provides visibility into vendor contract run rates and total subscription exposure.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Frequency Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Recurring Payment Frequency Matrix & Annualized Multipliers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct recurrence cadence is vital when comparing service terms or evaluating payroll vs vendor payment alignment. The table below details the mathematical conversion rates and cadence attributes across standard financial schedules:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Recurrence Type</th>
                                    <th className="p-3">Cycles / Year</th>
                                    <th className="p-3">Average Interval</th>
                                    <th className="p-3">Annualized Multiplier</th>
                                    <th className="p-3">Primary Financial Applications</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Weekly</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">52</td>
                                    <td className="p-3 font-mono text-slate-600">7 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 52</td>
                                    <td className="p-3 text-xs text-slate-600">Hourly payroll, contractor retainer payments, micro-leases</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Bi-Weekly</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">26</td>
                                    <td className="p-3 font-mono text-slate-600">14 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 26</td>
                                    <td className="p-3 text-xs text-slate-600">Standard corporate payroll, bi-weekly mortgage payment programs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Semi-Monthly</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">24</td>
                                    <td className="p-3 font-mono text-slate-600">15.2 days (1st &amp; 15th)</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 24</td>
                                    <td className="p-3 text-xs text-slate-600">Salaried executive payroll, commercial leases, vendor retainers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Monthly</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">12</td>
                                    <td className="p-3 font-mono text-slate-600">30.4 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 12</td>
                                    <td className="p-3 text-xs text-slate-600">Credit cards, residential rent, cloud SaaS subscriptions, utilities</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Quarterly</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">4</td>
                                    <td className="p-3 font-mono text-slate-600">91.3 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 4</td>
                                    <td className="p-3 text-xs text-slate-600">Estimated federal taxes (IRS 1040-ES), enterprise software licenses</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Semi-Annually</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">2</td>
                                    <td className="p-3 font-mono text-slate-600">182.5 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 2</td>
                                    <td className="p-3 text-xs text-slate-600">Commercial insurance premiums, municipal property tax installments</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Annually</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">1</td>
                                    <td className="p-3 font-mono text-slate-600">365 days</td>
                                    <td className="p-3 font-mono text-emerald-600 font-bold">Amount &times; 1</td>
                                    <td className="p-3 text-xs text-slate-600">Domain renewals, annual SaaS plans, vehicle registration, LLC filings</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Weekend Rules and ACH Settlement Dynamics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Banking Settlement Rules: Weekend Shifts, Grace Periods, and Late Fees
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In business accounting, payment initiation date is distinct from settlement date. Because clearinghouses like the Federal Reserve FedACH and the Clearing House Electronic Payments Network (EPN) pause standard batch settlements over weekends, payment schedules must accommodate business-day logic:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> The Previous Friday Rule (Payer-Safe)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                If an invoice is due on Saturday or Sunday and the vendor enforces strict on-or-before receipt criteria, initiating the payment on the preceding Friday prevents statutory default and avoids late administrative penalties.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> The Following Monday Rule (ACH Standard)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Most utility providers and automated credit card autopay systems shift weekend due dates to the subsequent Monday. Funds remain in your checking account throughout the weekend, executing on the next active banking day.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Practical Working Capital Takeaway
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">Bi-Weekly &ne; Semi-Monthly</span>
                                <p>Paying $1,000 bi-weekly costs $26,000/yr, whereas $1,000 semi-monthly costs $24,000/yr—a $2,000 difference.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">Grace Period Buffering</span>
                                <p>Credit card issuers provide a mandatory 21-day grace period between statement closing and payment due dates.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1 font-bold">Cash Flow Alignment</span>
                                <p>Sync bill due dates directly after your revenue deposit milestones to reduce short-term overdraft exposure.</p>
                            </div>
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
                                What is the difference between bi-weekly and semi-monthly recurring billing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Bi-weekly billing occurs every 14 days, resulting in 26 billing cycles per calendar year (with two months containing 3 payment dates). Semi-monthly billing occurs exactly twice per calendar month (e.g., on the 1st and 15th, or 15th and the final day of the month), resulting in exactly 24 billing cycles per year.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this calculator handle bill due dates that fall on weekends or bank holidays?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This utility offers three banking adjustment rules: Exact Date (no adjustment), Previous Business Day (shifts Saturday/Sunday due dates back to Friday to prevent late fees before non-clearing bank days), and Following Business Day (shifts to Monday, matching standard ACH debit processing rules).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are month-end dates handled for shorter months like February?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                If a recurring monthly bill is set for the 29th, 30th, or 31st, the calculator automatically snaps to the last valid calendar day for shorter months (e.g., February 28th or 29th in a leap year, and April 30th) to ensure uninterrupted schedule forecasting.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I factor in a grace period for credit cards and utility bills?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can add a custom grace period offset (in days) to calculate the final deadline before statutory late payment fees or credit bureau default reporting occurs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is annualized cost calculation crucial for SaaS subscriptions and recurring obligations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Recurring expenses frequently obscure cash flow burn when framed only as monthly or weekly amounts. Annualizing recurring expenses aggregates micro-transactions into total liability projections, allowing individuals and corporate finance teams to accurately budget working capital.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}