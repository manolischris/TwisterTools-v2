"use client";

import React, { useState, useMemo } from "react";
import {
    Calendar,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Clock,
    HelpCircle,
    Info,
    BookOpen,
    Calculator,
    Globe,
    CheckCircle2,
    Briefcase,
    List,
    ShieldCheck,
    CalendarDays,
    Star,
    Layers,
    History,
    Hash
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS & ISO-8601 ALGORITHMS
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

const isLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

// ISO-8601 Week Calculation (Week starts on Monday, Week 1 contains Jan 4th / first Thursday)
const getISOWeekDetails = (date: Date) => {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    target.setDate(target.getDate() - dayNumber + 3); // Nearest Thursday
    const firstThursday = target.valueOf();

    // ISO Year
    const isoYear = target.getFullYear();

    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }

    const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);

    // Calculate Monday and Sunday of the calculated ISO week
    const monday = new Date(date.valueOf());
    monday.setDate(date.getDate() - dayNumber);

    const sunday = new Date(monday.valueOf());
    sunday.setDate(monday.getDate() + 6);

    return {
        weekNumber,
        isoYear,
        weekStartDate: monday,
        weekEndDate: sunday
    };
};

export default function WeekNumberCalculator() {
    const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayString());
    const [copied, setCopied] = useState<boolean>(false);

    // Manual input fields for precision adjustment
    const [manualYear, setManualYear] = useState<string>("2026");
    const [manualMonth, setManualMonth] = useState<string>("8");
    const [manualDay, setManualDay] = useState<string>("9");

    const handleNumberInputChange = (
        value: string,
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const sanitized = value.replace(/^0+(?=\d)/, "");
        if (sanitized === "" || /^\d+$/.test(sanitized)) {
            setter(sanitized);
        }
    };

    const setPresetDate = (type: "today" | "jan1" | "midyear" | "dec31") => {
        const d = parseInputDate(selectedDateStr) || new Date();
        const currentYear = d.getFullYear();

        if (type === "today") {
            const today = getTodayString();
            setSelectedDateStr(today);
            const todayObj = parseInputDate(today);
            if (todayObj) {
                setManualYear(String(todayObj.getFullYear()));
                setManualMonth(String(todayObj.getMonth() + 1));
                setManualDay(String(todayObj.getDate()));
            }
        } else if (type === "jan1") {
            const target = `${currentYear}-01-01`;
            setSelectedDateStr(target);
            setManualYear(String(currentYear));
            setManualMonth("1");
            setManualDay("1");
        } else if (type === "midyear") {
            const target = `${currentYear}-07-01`;
            setSelectedDateStr(target);
            setManualYear(String(currentYear));
            setManualMonth("7");
            setManualDay("1");
        } else if (type === "dec31") {
            const target = `${currentYear}-12-31`;
            setSelectedDateStr(target);
            setManualYear(String(currentYear));
            setManualMonth("12");
            setManualDay("31");
        }
    };

    const syncFromManual = () => {
        const y = parseInt(manualYear || "0", 10);
        const m = parseInt(manualMonth || "1", 10);
        const d = parseInt(manualDay || "1", 10);
        if (y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
            const formatted = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            setSelectedDateStr(formatted);
        }
    };

    const calculatedData = useMemo(() => {
        const dateObj = parseInputDate(selectedDateStr);
        if (!dateObj) return null;

        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;
        const day = dateObj.getDate();

        const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
        const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });

        const isoDetails = getISOWeekDetails(dateObj);
        const leap = isLeapYear(year);

        // Day of Year
        const startOfYear = new Date(year, 0, 0);
        const diff = dateObj.getTime() - startOfYear.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const totalYearDays = leap ? 366 : 365;
        const daysRemainingInYear = totalYearDays - dayOfYear;

        // Total weeks in this year (52 or 53)
        const dec31 = new Date(year, 11, 31);
        const totalWeeksInYear = getISOWeekDetails(dec31).weekNumber === 1 ? 52 : getISOWeekDetails(dec31).weekNumber;

        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        return {
            dateObj,
            year,
            month,
            day,
            dayOfWeek,
            monthName,
            leap,
            dayOfYear,
            daysRemainingInYear,
            weekNumber: isoDetails.weekNumber,
            isoYear: isoDetails.isoYear,
            weekStartDate: isoDetails.weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            weekEndDate: isoDetails.weekEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            totalWeeksInYear,
            isWeekend,
            formattedFull: `${monthName} ${day}, ${year}`
        };
    }, [selectedDateStr]);

    const handleCopy = () => {
        if (!calculatedData) return;
        const text = `Date: ${calculatedData.formattedFull}\nISO-8601 Week Number: Week ${calculatedData.weekNumber} of ${calculatedData.isoYear}\nWeek Span: ${calculatedData.weekStartDate} to ${calculatedData.weekEndDate}\nDay of Year: Day ${calculatedData.dayOfYear} of ${calculatedData.leap ? 366 : 365}`;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="w-full space-y-8">

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* LEFT PANEL: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-indigo-600" />
                                Date Selection
                            </h2>
                            <button
                                onClick={() => setPresetDate("today")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Today
                            </button>
                        </div>

                        <div className="space-y-5">
                            {/* Quick Presets */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                    Quick Year Presets
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: "Today", action: () => setPresetDate("today") },
                                        { label: "Jan 1st", action: () => setPresetDate("jan1") },
                                        { label: "Mid Year", action: () => setPresetDate("midyear") },
                                        { label: "Dec 31st", action: () => setPresetDate("dec31") },
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

                            {/* Native Date Picker */}
                            <div className="space-y-1.5 min-w-0">
                                <label htmlFor="calendar-picker" className="text-xs font-bold text-slate-700 block">
                                    Select Date (Picker)
                                </label>
                                <input
                                    id="calendar-picker"
                                    type="date"
                                    value={selectedDateStr}
                                    onChange={(e) => {
                                        setSelectedDateStr(e.target.value);
                                        const d = parseInputDate(e.target.value);
                                        if (d) {
                                            setManualYear(String(d.getFullYear()));
                                            setManualMonth(String(d.getMonth() + 1));
                                            setManualDay(String(d.getDate()));
                                        }
                                    }}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-w-0"
                                />
                            </div>

                            {/* Manual Numeric Input Fields */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Direct Numerical Entry (Year / Month / Day)
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label htmlFor="manual-year" className="text-[11px] font-bold text-slate-500 uppercase block">
                                            Year
                                        </label>
                                        <input
                                            id="manual-year"
                                            type="text"
                                            inputMode="numeric"
                                            value={manualYear}
                                            onChange={(e) => handleNumberInputChange(e.target.value, setManualYear)}
                                            onBlur={syncFromManual}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            placeholder="YYYY"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="manual-month" className="text-[11px] font-bold text-slate-500 uppercase block">
                                            Month
                                        </label>
                                        <input
                                            id="manual-month"
                                            type="text"
                                            inputMode="numeric"
                                            value={manualMonth}
                                            onChange={(e) => handleNumberInputChange(e.target.value, setManualMonth)}
                                            onBlur={syncFromManual}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            placeholder="MM"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="manual-day" className="text-[11px] font-bold text-slate-500 uppercase block">
                                            Day
                                        </label>
                                        <input
                                            id="manual-day"
                                            type="text"
                                            inputMode="numeric"
                                            value={manualDay}
                                            onChange={(e) => handleNumberInputChange(e.target.value, setManualDay)}
                                            onBlur={syncFromManual}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none"
                                            placeholder="DD"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Supports ISO-8601 formatting. Click outside or change focus to apply manual values.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Execution
                        </span>
                        <span>ISO-8601 Standard Compliant</span>
                    </div>
                </div>

                {/* RIGHT PANEL: Results Display */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Calculated ISO Week
                            </h2>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? "Copied" : "Copy Results"}
                            </button>
                        </div>

                        {calculatedData ? (
                            <>
                                {/* Hero Result Card */}
                                <div className="p-5 rounded-2xl border border-indigo-950 bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Hash className="w-4 h-4 text-amber-400" /> ISO-8601 Week Number
                                        </span>
                                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300">
                                            Year {calculatedData.isoYear}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black text-white">
                                            Week {calculatedData.weekNumber}
                                        </span>
                                        <span className="text-indigo-300 text-sm font-medium">
                                            / {calculatedData.totalWeeksInYear} weeks
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-200/80 mt-4 pt-3 border-t border-indigo-800/80 leading-normal">
                                        Date: <strong>{calculatedData.formattedFull}</strong> ({calculatedData.dayOfWeek})
                                    </p>
                                </div>

                                {/* Detailed Grid Breakdown */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1 col-span-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Week Date Span (Mon – Sun)
                                        </span>
                                        <div className="text-sm font-bold text-slate-800">
                                            {calculatedData.weekStartDate} — {calculatedData.weekEndDate}
                                        </div>
                                    </div>
                                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Day of Year
                                        </span>
                                        <div className="text-lg font-bold font-mono text-slate-800">
                                            Day {calculatedData.dayOfYear} <span className="text-xs text-slate-500 font-sans">/ {calculatedData.leap ? 366 : 365}</span>
                                        </div>
                                    </div>
                                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Days Remaining
                                        </span>
                                        <div className="text-lg font-bold font-mono text-slate-800">
                                            {calculatedData.daysRemainingInYear} Days
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                                    <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <p>
                                        In ISO-8601, weeks begin on <strong>Monday</strong>. The first week of any calendar year is defined as the week containing the <strong>first Thursday</strong> of January.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                Please select or enter a valid calendar date.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span>ISO-8601 Algorithm Verified</span>
                        <span>Zero Data Transmission</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD SEO CONTENT */}
            <section className="space-y-6">
                {/* Card 1: Overview */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Understanding the ISO-8601 Week Number System</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The <strong>ISO-8601 Week Number System</strong> is the internationally recognized standard for representing weeks, dates, and time intervals in enterprise software, logistics, international business, and financial reporting. Standardized by the International Organization for Standardization (ISO), it provides an unambiguous method for identifying specific calendar weeks regardless of regional variations.
                        </p>
                        <p>
                            Unlike traditional North American calendar systems that start weeks on Sunday, ISO-8601 strictly defines <strong>Monday as the first day of the week</strong> (Day 1) and <strong>Sunday as the last day</strong> (Day 7). Our online calculator determines the exact week number, date range, and year allocation for any past, present, or future date.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    First Thursday Rule
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Under ISO-8601, Week 1 of any given year is defined as the week that contains the first Thursday of January. Equivalently, it is the week that contains January 4th.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    52 vs. 53 Week Years
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Most standard Gregorian calendar years contain exactly 52 ISO weeks (364 days). However, leap years or years starting on a Thursday contain 53 ISO weeks.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Business & Enterprise Applications */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Why ISO Week Numbers Matter in Business</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            In global corporate environments, referring to dates using ISO week numbers (e.g., <strong>2026-W32</strong>) avoids regional misunderstandings that stem from conflicting date formats like MM/DD/YYYY versus DD/MM/YYYY. Key enterprise applications include:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-700">
                            <li><strong>Supply Chain &amp; Logistics:</strong> Production schedules, shipping deadlines, and manufacturing sprints are regularly structured around target ISO weeks.</li>
                            <li><strong>Software Engineering &amp; Agile Development:</strong> Development teams align sprint backlogs and quarterly release dates using ISO week indices.</li>
                            <li><strong>Payroll &amp; HR Planning:</strong> Bi-weekly and weekly payroll accounting rely on standardized week boundary rules to calculate pay periods.</li>
                            <li><strong>Financial &amp; Retail Reporting:</strong> Retail chains use ISO weeks for year-over-year sales comparisons to align identical trading days.</li>
                        </ul>
                    </div>
                </div>

                {/* Card 3: Technical Formula Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Mathematical ISO-8601 Calculation Method</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The mathematical algorithm to determine the ISO week number from a target date follows these deterministic steps:
                        </p>
                        <div className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto my-4 border border-slate-800">
                            Week = 1 + ⌊(Thursday_nearest - Thursday_first) / 604800000⌋
                        </div>
                        <ol className="list-decimal pl-6 space-y-2 text-xs sm:text-sm text-slate-700">
                            <li>Find the nearest Thursday to the given date (adding or subtracting days so the date shifts to its weekly Thursday).</li>
                            <li>Determine the ISO year of that nearest Thursday (this represents the year to which the week belongs).</li>
                            <li>Locate the first Thursday of that ISO year (January 4th is always in Week 1).</li>
                            <li>Calculate the exact difference in milliseconds between the nearest Thursday and the first Thursday, divide by $604,800,000$ (ms in a week), and add 1.</li>
                        </ol>
                    </div>
                </div>

                {/* Card 4: FAQ Section */}
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
                                q: "What is the first day of the week according to ISO-8601?",
                                a: "ISO-8601 strictly defines Monday as the first day of the week. Sunday is considered the seventh and final day of the week.",
                            },
                            {
                                q: "Why can January 1st belong to Week 52 or 53 of the previous year?",
                                a: "If January 1st falls on a Friday, Saturday, or Sunday, it lacks a Thursday in that week. Consequently, those days belong to the final week (Week 52 or 53) of the preceding year.",
                            },
                            {
                                q: "How many weeks are in an ISO calendar year?",
                                a: "An ISO calendar year has either 52 or 53 full weeks (364 or 371 days). Years with 53 weeks are called leap weeks and occur approximately every 5 to 6 years.",
                            },
                            {
                                q: "Does this calculator process dates in the far future or past?",
                                a: "Yes. The client-side mathematical logic calculates standard ISO-8601 week metrics for any valid calendar date across thousands of years.",
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

            {/* Structured JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Week Number Calculator (ISO-8601)",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Calculate international ISO week numbers, week date spans, and day metrics for any date.",
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
                                name: "What is the first day of the week according to ISO-8601?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "ISO-8601 strictly defines Monday as the first day of the week.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why can January 1st belong to Week 52 or 53 of the previous year?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "If January 1st falls on Friday, Saturday, or Sunday, its week lacks a Thursday in the new year, placing it in the final week of the preceding year.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}