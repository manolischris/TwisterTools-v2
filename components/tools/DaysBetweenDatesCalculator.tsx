"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Calendar,
    Clock,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    CalendarDays,
    Timer,
    Plus,
    HelpCircle,
    Info,
    ArrowRight,
    CheckCircle2,
    Briefcase,
    Layers,
    FileText,
    Calculator,
    BookOpen,
    Globe,
    Scale,
    TrendingUp,
    ShieldCheck,
    List,
    Percent
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS & DATE MATH
// ─────────────────────────────────────────────────────────────

const getTodayString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseInputDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
};

const formatDateString = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const isWeekend = (date: Date, weekendType: "sat-sun" | "sun-only" | "fri-sat"): boolean => {
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (weekendType === "sat-sun") {
        return day === 0 || day === 6;
    } else if (weekendType === "sun-only") {
        return day === 0;
    } else if (weekendType === "fri-sat") {
        return day === 5 || day === 6;
    }
    return false;
};

interface DetailedSpan {
    years: number;
    months: number;
    days: number;
}

const calculateDetailedSpan = (startDate: Date, endDate: Date): DetailedSpan => {
    let start = new Date(startDate.getTime());
    let end = new Date(endDate.getTime());
    if (start > end) {
        const temp = start;
        start = end;
        end = temp;
    }

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        // Previous month's days count
        const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return { years, months, days };
};

export default function DaysBetweenDatesCalculator() {
    // ── Mode Switcher ──
    const [mode, setMode] = useState<"duration" | "add-subtract">("duration");

    // ── Mode 1: Duration States ──
    const [startDateStr, setStartDateStr] = useState<string>(getTodayString());
    const [endDateStr, setEndDateStr] = useState<string>("2026-12-31");
    const [includeEndDay, setIncludeEndDay] = useState<boolean>(false);
    const [weekendType, setWeekendType] = useState<"sat-sun" | "sun-only" | "fri-sat">("sat-sun");

    // ── Mode 2: Add/Subtract States ──
    const [baseDateStr, setBaseDateStr] = useState<string>(getTodayString());
    const [operation, setOperation] = useState<"add" | "subtract">("add");
    const [amountYears, setAmountYears] = useState<string>("0");
    const [amountMonths, setAmountMonths] = useState<string>("0");
    const [amountWeeks, setAmountWeeks] = useState<string>("0");
    const [amountDays, setAmountDays] = useState<string>("30");

    // ── Feedback UI States ──
    const [copied, setCopied] = useState<boolean>(false);

    // ── Quick Date Adjusters for Mode 1 ──
    const setQuickDate = (type: "today" | "eoy" | "plus30" | "plus90" | "plus365") => {
        const today = new Date();
        setStartDateStr(getTodayString());

        if (type === "today") {
            setEndDateStr(getTodayString());
        } else if (type === "eoy") {
            setEndDateStr(`${today.getFullYear()}-12-31`);
        } else {
            const target = new Date();
            if (type === "plus30") target.setDate(today.getDate() + 30);
            if (type === "plus90") target.setDate(today.getDate() + 90);
            if (type === "plus365") target.setDate(today.getDate() + 365);

            const y = target.getFullYear();
            const m = String(target.getMonth() + 1).padStart(2, "0");
            const d = String(target.getDate()).padStart(2, "0");
            setEndDateStr(`${y}-${m}-${d}`);
        }
    };

    // ── Safe Numeric Input Handlers (Anti-Pattern Compliance) ──
    const handleNumberInputChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const sanitized = value.replace(/^0+(?=\d)/, "");
        if (sanitized === "" || /^\d+$/.test(sanitized)) {
            setter(sanitized);
        }
    };

    // ── Mode 1 Calculations ──
    const durationResults = useMemo(() => {
        const d1 = parseInputDate(startDateStr);
        const d2 = parseInputDate(endDateStr);

        if (!d1 || !d2) return null;

        const isReversed = d1 > d2;
        const start = isReversed ? d2 : d1;
        const end = isReversed ? d1 : d2;

        const msPerDay = 1000 * 60 * 60 * 24;
        let totalDays = Math.round((end.getTime() - start.getTime()) / msPerDay);

        if (includeEndDay) {
            totalDays += 1;
        }

        // Calculate Business Days vs Weekend Days
        let businessDays = 0;
        let weekendDays = 0;

        const curr = new Date(start.getTime());
        const lastDay = new Date(end.getTime());

        if (!includeEndDay) {
            lastDay.setDate(lastDay.getDate() - 1);
        }

        if (start <= lastDay) {
            while (curr <= lastDay) {
                if (isWeekend(curr, weekendType)) {
                    weekendDays++;
                } else {
                    businessDays++;
                }
                curr.setDate(curr.getDate() + 1);
            }
        }

        const totalWeeks = Math.floor(totalDays / 7);
        const remainingDays = totalDays % 7;

        const totalHours = totalDays * 24;
        const totalMinutes = totalHours * 60;
        const totalSeconds = totalMinutes * 60;

        const detailedSpan = calculateDetailedSpan(start, end);

        // Percentage of current year
        const yearDays = isLeapYear(start.getFullYear()) ? 366 : 365;
        const yearPercentage = ((totalDays / yearDays) * 100).toFixed(2);

        return {
            totalDays,
            businessDays,
            weekendDays,
            totalWeeks,
            remainingDays,
            totalHours,
            totalMinutes,
            totalSeconds,
            detailedSpan,
            isReversed,
            yearPercentage,
            formattedStart: formatDateString(d1),
            formattedEnd: formatDateString(d2)
        };
    }, [startDateStr, endDateStr, includeEndDay, weekendType]);

    // ── Mode 2 Calculations ──
    const addSubtractResults = useMemo(() => {
        const base = parseInputDate(baseDateStr);
        if (!base) return null;

        const years = parseInt(amountYears || "0", 10);
        const months = parseInt(amountMonths || "0", 10);
        const weeks = parseInt(amountWeeks || "0", 10);
        const days = parseInt(amountDays || "0", 10);

        const target = new Date(base.getTime());
        const sign = operation === "add" ? 1 : -1;

        if (years !== 0) target.setFullYear(target.getFullYear() + sign * years);
        if (months !== 0) target.setMonth(target.getMonth() + sign * months);

        const totalDaysOffset = (weeks * 7) + days;
        if (totalDaysOffset !== 0) target.setDate(target.getDate() + sign * totalDaysOffset);

        return {
            targetDate: target,
            formattedTarget: formatDateString(target),
            targetIso: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`,
            dayOfWeek: target.toLocaleDateString("en-US", { weekday: "long" }),
            isLeap: isLeapYear(target.getFullYear()),
            dayOfYear: Math.floor((target.getTime() - new Date(target.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
        };
    }, [baseDateStr, operation, amountYears, amountMonths, amountWeeks, amountDays]);

    // ── Copy Result Summary ──
    const handleCopy = () => {
        let summaryText = "";
        if (mode === "duration" && durationResults) {
            summaryText = `Date Span Summary:\nFrom: ${durationResults.formattedStart}\nTo: ${durationResults.formattedEnd}\nTotal Days: ${durationResults.totalDays} days\nBusiness Days: ${durationResults.businessDays}\nWeekend Days: ${durationResults.weekendDays}\nSpan: ${durationResults.detailedSpan.years} Years, ${durationResults.detailedSpan.months} Months, ${durationResults.detailedSpan.days} Days`;
        } else if (mode === "add-subtract" && addSubtractResults) {
            summaryText = `Date Math Result:\nBase Date: ${baseDateStr}\nOperation: ${operation.toUpperCase()} ${amountYears}y ${amountMonths}m ${amountWeeks}w ${amountDays}d\nResulting Date: ${addSubtractResults.formattedTarget} (${addSubtractResults.dayOfWeek})`;
        }

        if (!summaryText) return;
        navigator.clipboard.writeText(summaryText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="w-full space-y-8">

            {/* ── Mode Selection Navigation Tabs ── */}
            <div className="flex bg-slate-100 p-1.5 mb-5 rounded-xl border border-slate-200 max-w-md mx-auto">
                <button
                    onClick={() => setMode("duration")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === "duration"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <CalendarDays className="w-4 h-4" />
                    Days Between Dates
                </button>
                <button
                    onClick={() => setMode("add-subtract")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mode === "add-subtract"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Plus className="w-4 h-4" />
                    Add / Subtract Days
                </button>
            </div>

            {/* ── 50/50 Split Workspace Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* ══════════════════ LEFT PANEL: INPUT CONTROLS ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                {mode === "duration" ? "Date Duration Parameters" : "Date Addition & Subtraction"}
                            </h2>
                            <button
                                onClick={() => {
                                    setStartDateStr(getTodayString());
                                    setEndDateStr("2026-12-31");
                                    setBaseDateStr(getTodayString());
                                    setAmountYears("0");
                                    setAmountMonths("0");
                                    setAmountWeeks("0");
                                    setAmountDays("30");
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        <div className="space-y-5">
                            {mode === "duration" ? (
                                <>
                                    {/* Quick Date Presets */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                            Quick Range Presets
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { label: "Today", action: () => setQuickDate("today") },
                                                { label: "+30 Days", action: () => setQuickDate("plus30") },
                                                { label: "+90 Days", action: () => setQuickDate("plus90") },
                                                { label: "End of Year", action: () => setQuickDate("eoy") },
                                            ].map((btn, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={btn.action}
                                                    className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all min-h-[38px] cursor-pointer"
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date Pickers */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5 min-w-0">
                                            <label htmlFor="start-date" className="text-xs font-bold text-slate-700 block">
                                                Start Date
                                            </label>
                                            <input
                                                id="start-date"
                                                type="date"
                                                value={startDateStr}
                                                onChange={(e) => setStartDateStr(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                                            />
                                        </div>
                                        <div className="space-y-1.5 min-w-0">
                                            <label htmlFor="end-date" className="text-xs font-bold text-slate-700 block">
                                                End Date
                                            </label>
                                            <input
                                                id="end-date"
                                                type="date"
                                                value={endDateStr}
                                                onChange={(e) => setEndDateStr(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                                            />
                                        </div>
                                    </div>

                                    {/* Options & Weekend Filters */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                                        <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeEndDay}
                                                onChange={(e) => setIncludeEndDay(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            Include End Day in Calculation (Adds +1 Day)
                                        </label>

                                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                            <label htmlFor="weekend-type" className="text-xs font-bold text-slate-600 block">
                                                Weekend Definition (for Business Days)
                                            </label>
                                            <select
                                                id="weekend-type"
                                                value={weekendType}
                                                onChange={(e) => setWeekendType(e.target.value as any)}
                                                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none font-semibold"
                                            >
                                                <option value="sat-sun">Saturday &amp; Sunday (Western Standard)</option>
                                                <option value="fri-sat">Friday &amp; Saturday (Middle East Standard)</option>
                                                <option value="sun-only">Sunday Only (Single Day Weekend)</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Base Date Picker */}
                                    <div className="space-y-1.5 min-w-0">
                                        <label htmlFor="base-date" className="text-xs font-bold text-slate-700 block">
                                            Starting Base Date
                                        </label>
                                        <input
                                            id="base-date"
                                            type="date"
                                            value={baseDateStr}
                                            onChange={(e) => setBaseDateStr(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                                        />
                                    </div>

                                    {/* Add/Subtract Operation Toggle */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setOperation("add")}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all min-h-[42px] cursor-pointer ${operation === "add"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            + Add Time
                                        </button>
                                        <button
                                            onClick={() => setOperation("subtract")}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all min-h-[42px] cursor-pointer ${operation === "subtract"
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            - Subtract Time
                                        </button>
                                    </div>

                                    {/* Input Time Span Fields */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label htmlFor="amount-years" className="text-xs font-bold text-slate-600 block">
                                                Years
                                            </label>
                                            <input
                                                id="amount-years"
                                                type="text"
                                                inputMode="numeric"
                                                value={amountYears}
                                                onChange={(e) => handleNumberInputChange(e.target.value, setAmountYears)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="amount-months" className="text-xs font-bold text-slate-600 block">
                                                Months
                                            </label>
                                            <input
                                                id="amount-months"
                                                type="text"
                                                inputMode="numeric"
                                                value={amountMonths}
                                                onChange={(e) => handleNumberInputChange(e.target.value, setAmountMonths)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="amount-weeks" className="text-xs font-bold text-slate-600 block">
                                                Weeks
                                            </label>
                                            <input
                                                id="amount-weeks"
                                                type="text"
                                                inputMode="numeric"
                                                value={amountWeeks}
                                                onChange={(e) => handleNumberInputChange(e.target.value, setAmountWeeks)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label htmlFor="amount-days" className="text-xs font-bold text-slate-600 block">
                                                Days
                                            </label>
                                            <input
                                                id="amount-days"
                                                type="text"
                                                inputMode="numeric"
                                                value={amountDays}
                                                onChange={(e) => handleNumberInputChange(e.target.value, setAmountDays)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: RESULTS DISPLAY ══════════════════ */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Calculated Result Metrics
                            </h2>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied" : "Copy Results"}
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Primary Result Hero Box: premium dark gradient */}
                            <div className="p-5 rounded-2xl border border-indigo-950 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                                {mode === "duration" ? (
                                    durationResults ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-amber-400" /> Total Duration
                                                </span>
                                                <span className="text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                                    Range: {durationResults.formattedStart} – {durationResults.formattedEnd}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex items-baseline gap-2">
                                                <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                                                    {durationResults.totalDays.toLocaleString()}
                                                </span>
                                                <span className="text-lg font-semibold text-indigo-200">days</span>
                                            </div>
                                            <p className="text-xs text-indigo-200/80 mt-4 pt-3 border-t border-indigo-800/80 leading-normal">
                                                Equivalent to <strong>{durationResults.totalWeeks}</strong> weeks and <strong>{durationResults.remainingDays}</strong> days.
                                                <span className="block text-[11px] text-indigo-300 mt-1">
                                                    ({durationResults.yearPercentage}% of a standard year)
                                                </span>
                                            </p>
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-indigo-200 text-sm">
                                            Please select valid start and end dates.
                                        </div>
                                    )
                                ) : (
                                    addSubtractResults ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                                    <Sparkles className="w-4 h-4 text-amber-400" /> Target Date
                                                </span>
                                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                                    {operation === "add" ? "Date Addition" : "Date Subtraction"}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-1">
                                                <span className="text-2xl sm:text-3xl font-black text-white">
                                                    {addSubtractResults.formattedTarget}
                                                </span>
                                                <span className="text-sm font-bold text-amber-400">
                                                    {addSubtractResults.dayOfWeek}
                                                </span>
                                            </div>
                                            <p className="text-xs text-indigo-200/80 mt-4 pt-3 border-t border-indigo-800/80 leading-normal">
                                                Calculated from base date: <strong>{baseDateStr}</strong>
                                            </p>
                                        </>
                                    ) : (
                                        <div className="text-center py-6 text-indigo-200 text-sm">
                                            Please select a base date and enter amounts.
                                        </div>
                                    )
                                )}
                            </div>

                            {mode === "duration" ? (
                                durationResults && (
                                    <>
                                        {/* Detailed Year/Month/Day Breakdown */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                Calendar Span Breakdown
                                            </span>
                                            <div className="text-base sm:text-lg font-bold text-slate-800 font-mono">
                                                {durationResults.detailedSpan.years} Years, {durationResults.detailedSpan.months} Months, {durationResults.detailedSpan.days} Days
                                            </div>
                                            <p className="text-[11px] text-slate-500">
                                                Exact age/span representation considering variable month lengths.
                                            </p>
                                        </div>

                                        {/* Business vs Weekend Days Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                                    <Briefcase className="w-4 h-4 text-emerald-600" />
                                                    Working Days
                                                </div>
                                                <p className="text-2xl font-bold font-mono text-emerald-950">
                                                    {durationResults.businessDays.toLocaleString()}
                                                </p>
                                                <p className="text-[11px] text-emerald-700/80 font-medium">
                                                    Mon-Fri (or selected)
                                                </p>
                                            </div>
                                            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                                                    <Clock className="w-4 h-4 text-amber-600" />
                                                    Weekend Days
                                                </div>
                                                <p className="text-2xl font-bold font-mono text-amber-950">
                                                    {durationResults.weekendDays.toLocaleString()}
                                                </p>
                                                <p className="text-[11px] text-amber-700/80 font-medium">
                                                    Non-working days
                                                </p>
                                            </div>
                                        </div>

                                        {/* Conversions Table */}
                                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                            <table className="w-full text-left text-sm text-slate-700">
                                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="p-2.5">Time Unit</th>
                                                        <th className="p-2.5 text-right">Conversion Equivalent</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 text-xs font-mono">
                                                    <tr className="hover:bg-slate-50">
                                                        <td className="p-2.5 font-semibold text-slate-700 font-sans">Hours</td>
                                                        <td className="p-2.5 text-right font-bold text-slate-800">{durationResults.totalHours.toLocaleString()} hrs</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 bg-slate-50/50">
                                                        <td className="p-2.5 font-semibold text-slate-700 font-sans">Minutes</td>
                                                        <td className="p-2.5 text-right font-bold text-slate-800">{durationResults.totalMinutes.toLocaleString()} mins</td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50">
                                                        <td className="p-2.5 font-semibold text-slate-700 font-sans">Seconds</td>
                                                        <td className="p-2.5 text-right font-bold text-slate-800">{durationResults.totalSeconds.toLocaleString()} secs</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )
                            ) : (
                                addSubtractResults && (
                                    <>
                                        {/* Metadata Breakdown */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                    ISO Date String
                                                </span>
                                                <div className="text-sm font-bold font-mono text-slate-800">
                                                    {addSubtractResults.targetIso}
                                                </div>
                                            </div>
                                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                                    Day of the Year
                                                </span>
                                                <div className="text-sm font-bold font-mono text-slate-800">
                                                    Day {addSubtractResults.dayOfYear}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                                            <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                            <p>
                                                Target year ({addSubtractResults.targetDate.getFullYear()}) is{" "}
                                                <strong className="text-slate-800">{addSubtractResults.isLeap ? "a Leap Year (366 days)" : "a Standard Year (365 days)"}</strong>.
                                            </p>
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side Offline Execution
                        </span>
                        <span>Standard Gregorian Engine</span>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                BELOW-THE-FOLD SEO CONTENT (TOP-TIER, INFO-RICH, ADSENSE-READY)
            ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6">
                {/* Card 1: Technical Overview & Definitions */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Comprehensive Guide to Date Duration &amp; Calendar Math</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Determining the temporal distance between two points in time seems simple at first glance, but standard calendar systems introduce significant mathematical complexity. Because months vary in length (ranging from 28 to 31 days), years fluctuate due to leap years, and global business models observe different non-working days, computing exact durations requires rigorous programmatic algorithms.
                        </p>
                        <p>
                            Our <strong>Days Between Dates &amp; Span Calculator</strong> provides dual computing engines: one for measuring exact durations, working days, and time breakdowns, and another for performing direct arithmetic operations (adding or subtracting precise periods) from any anchor date.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Julian vs. Gregorian Calendar Mechanics
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    The modern Gregorian calendar introduced leap years every four years, except for years divisible by 100 unless also divisible by 400. This maintains alignment with the astronomical solar year (approximately 365.2422 days).
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Inclusive vs. Exclusive Boundary Counting
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Standard date subtraction measures elapsed full days between two timestamps (exclusive counting). Adding the end day (inclusive counting) is essential for rental agreements, leave tracking, and legal notice spans.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Key Mathematical Definitions & Reference Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Standard Calendar Units &amp; Conversion Constants</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            When performing high-precision time calculations for legal contracts, financial interest accrual, or software project timelines, standardizing unit conversions is necessary. The table below outlines the universal reference constants used in modern calendar math:
                        </p>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                        <th className="p-3 sm:p-4">Time Measurement Unit</th>
                                        <th className="p-3 sm:p-4">Equivalent in Days</th>
                                        <th className="p-3 sm:p-4">Equivalent in Hours</th>
                                        <th className="p-3 sm:p-4">Standard Operational Definition</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Standard Day</td>
                                        <td className="p-3 sm:p-4 font-mono">1.0 Day</td>
                                        <td className="p-3 sm:p-4 font-mono">24 Hours</td>
                                        <td className="p-3 sm:p-4">86,400 SI Seconds (Solar rotation benchmark)</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Standard Week</td>
                                        <td className="p-3 sm:p-4 font-mono">7.0 Days</td>
                                        <td className="p-3 sm:p-4 font-mono">168 Hours</td>
                                        <td className="p-3 sm:p-4">Uniform 7-day cycle across all global calendars</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Average Calendar Month</td>
                                        <td className="p-3 sm:p-4 font-mono">30.4375 Days</td>
                                        <td className="p-3 sm:p-4 font-mono">730.5 Hours</td>
                                        <td className="p-3 sm:p-4">Mean length of a month over a 4-year cycle (365.25 / 12)</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Common Year</td>
                                        <td className="p-3 sm:p-4 font-mono">365.0 Days</td>
                                        <td className="p-3 sm:p-4 font-mono">8,760 Hours</td>
                                        <td className="p-3 sm:p-4">52 Weeks + 1 Day (Non-leap year cycle)</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="p-3 sm:p-4 font-semibold text-slate-900">Leap Year</td>
                                        <td className="p-3 sm:p-4 font-mono">366.0 Days</td>
                                        <td className="p-3 sm:p-4 font-mono">8,784 Hours</td>
                                        <td className="p-3 sm:p-4">Includes February 29 (Intercalary day)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Card 3: Working Business Days & Regional Variations */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>International Workweeks &amp; Working Day Calculations</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            In corporate project management, Service Level Agreements (SLAs), and international shipping, counting raw calendar days is often misleading. Business operations require filtering out non-working days. However, the definition of a weekend varies globally based on regional regulations and cultural traditions:
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 my-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                                    Western Standard (Sat/Sun)
                                </span>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Used across North America, Europe, South America, and Asia-Pacific. Defines Monday through Friday as the standard 5-day business week.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                                    Middle East Standard (Fri/Sat)
                                </span>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Observed in several MENA region countries where Friday serves as a primary day of communal gathering, shifting the working week to Sunday through Thursday.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                                    Single-Day Weekend (Sun Only)
                                </span>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Utilized in 6-day workweek sectors, logistics hubs, and countries like Mexico or India for specific industrial manufacturing shifts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 4: Detailed Step-by-Step Worked Calculation Examples */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <List className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Practical Worked Examples &amp; Step-by-Step Logic</span>
                    </h2>
                    <div className="space-y-6 text-slate-700 text-sm md:text-base leading-relaxed">
                        {/* Example 1 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                                Example 1: Measuring Duration Between March 15 and August 20
                            </h3>
                            <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-mono bg-white p-3.5 rounded-lg border border-slate-200">
                                <p><strong>Start Date:</strong> March 15, 2026 | <strong>End Date:</strong> August 20, 2026</p>
                                <p>1. Remaining days in March: 31 - 15 = 16 days</p>
                                <p>2. Days in intermediate months: April (30) + May (31) + June (30) + July (31) = 122 days</p>
                                <p>3. Days in August: 20 days</p>
                                <p><strong>Total Duration:</strong> 16 + 122 + 20 = <strong>158 Total Days</strong> (22 Weeks and 4 Days)</p>
                                <p><strong>Span Breakdown:</strong> 5 Months, 5 Days</p>
                            </div>
                        </div>

                        {/* Example 2 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-mono">2</span>
                                Example 2: Adding 90 Days to a Contract Base Date (Month Overflow)
                            </h3>
                            <div className="text-xs text-slate-600 space-y-2 leading-relaxed font-mono bg-white p-3.5 rounded-lg border border-slate-200">
                                <p><strong>Base Date:</strong> January 15, 2026 | <strong>Add Target:</strong> 90 Days</p>
                                <p>1. January remaining days: 31 - 15 = 16 days left (74 days remaining)</p>
                                <p>2. Subtract February 2026 (28 days): 74 - 28 = 46 days remaining</p>
                                <p>3. Subtract March 2026 (31 days): 46 - 31 = 15 days remaining in April</p>
                                <p><strong>Resulting Date:</strong> <strong>April 15, 2026</strong> (Thursday)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 5: Industry Application Use Cases Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Cross-Industry Applications &amp; Standards</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Industry / Field</th>
                                    <th className="p-3 sm:p-4">Key Calculation Objective</th>
                                    <th className="p-3 sm:p-4">Standard Metric Used</th>
                                    <th className="p-3 sm:p-4">Critical Consideration</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Legal &amp; Compliance</td>
                                    <td className="p-3 sm:p-4">Filing deadlines, notice periods, contract expiration</td>
                                    <td className="p-3 sm:p-4">Calendar Days (Inclusive)</td>
                                    <td className="p-3 sm:p-4">Statutory deadlines rolling over to next business day if falling on weekends</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Software &amp; IT</td>
                                    <td className="p-3 sm:p-4">Agile sprint planning, release cycles, SLA tracking</td>
                                    <td className="p-3 sm:p-4">Working Business Days</td>
                                    <td className="p-3 sm:p-4">Excludes regional holidays and weekend team downtime</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Finance &amp; Banking</td>
                                    <td className="p-3 sm:p-4">Interest calculations, bond yields, loan maturity</td>
                                    <td className="p-3 sm:p-4">Actual/365 or 30/360 Spans</td>
                                    <td className="p-3 sm:p-4">Compounding frequency depends on exact day count conventions</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">HR &amp; Payroll</td>
                                    <td className="p-3 sm:p-4">Tenure accumulation, vacation accrual, leave entitlement</td>
                                    <td className="p-3 sm:p-4">Exact Y/M/D Span</td>
                                    <td className="p-3 sm:p-4">Vesting schedules tied to exact employment anniversary dates</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 6: Static Border-Highlighted FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions (FAQ)</span>
                    </h2>
                    <div className="space-y-5">
                        {[
                            {
                                q: "Does this calculator account for leap years?",
                                a: "Yes. Leap years (containing February 29) are fully integrated into the calculation engine. Any span crossing a leap year automatically incorporates the extra 366th day, ensuring 100% mathematical precision.",
                            },
                            {
                                q: "What is the difference between 'Include End Day' and standard count?",
                                a: "Standard date subtraction (End Date minus Start Date) measures elapsed time between two points (exclusive of the end day). Checking 'Include End Day' turns the calculation into an inclusive range (e.g., Friday through Sunday counts as 3 full days instead of 2).",
                            },
                            {
                                q: "How are months handled when adding time to dates near month ends?",
                                a: "When adding months to dates such as January 31, standard calendar algorithms roll over if the target month has fewer days (e.g., adding 1 month to Jan 31 in a non-leap year yields March 3 or Feb 28 depending on standard date overflow rules).",
                            },
                            {
                                q: "Can I calculate business days across different regional workweeks?",
                                a: "Yes. Use the 'Weekend Definition' dropdown to select between Western standard (Sat/Sun), Middle East standard (Fri/Sat), or single-day weekend models (Sun only).",
                            },
                            {
                                q: "How do I calculate age in years, months, and days?",
                                a: "Select the 'Days Between Dates' mode, enter your birth date as the Start Date, and set today's date as the End Date. The 'Calendar Span Breakdown' box will display your exact age in years, months, and days.",
                            },
                        ].map(({ q, a }) => (
                            <div
                                key={q}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">
                                    {a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Days Between Dates & Span Calculator",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Calculate exact days between two dates, net business days, and perform date addition or subtraction in real-time.",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Does this calculator account for leap years?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. Leap years containing February 29 are fully integrated into all duration and date addition math.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What is the difference between 'Include End Day' and standard count?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Standard duration measures elapsed time between dates. Including the end day turns it into an inclusive calendar range.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I calculate business days across different regional workweeks?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. The tool supports standard Saturday/Sunday, Friday/Saturday, and Sunday-only weekend configurations.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "How do I calculate age in years, months, and days?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Set your birth date as the start date and today's date as the end date to get your exact age in years, months, and days.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}