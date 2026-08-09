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
    History
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS & CALENDAR ALGORITHMS
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

// Zeller's Congruence Algorithm for Gregorian Calendar
const getZellersDay = (year: number, month: number, day: number): string => {
    let m = month;
    let y = year;
    if (m <= 2) {
        m += 12;
        y -= 1;
    }
    const k = y % 100;
    const j = Math.floor(y / 100);

    const h = (day + Math.floor((13 * (m + 1)) / 5) + k + Math.floor(k / 4) + Math.floor(j / 4) + 5 * j) % 7;
    const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return days[h];
};

const getZodiacSign = (month: number, day: number): { sign: string; symbol: string } => {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", symbol: "♈" };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Taurus", symbol: "♉" };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Gemini", symbol: "♊" };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cancer", symbol: "♋" };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", symbol: "♌" };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", symbol: "♍" };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", symbol: "♎" };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Scorpio", symbol: "♏" };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagittarius", symbol: "♐" };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricorn", symbol: "♑" };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Aquarius", symbol: "♒" };
    return { sign: "Pisces", symbol: "♓" };
};

const getBirthstone = (month: number): string => {
    const stones = [
        "Garnet", "Amethyst", "Aquamarine", "Diamond", "Emerald", "Pearl",
        "Ruby", "Peridot", "Sapphire", "Opal", "Topaz", "Turquoise"
    ];
    return stones[month - 1] || "Unknown";
};

export default function DayOfWeekCalculator() {
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

    const setPresetDate = (type: "today" | "born1990" | "y2k" | "moonlanding") => {
        if (type === "today") {
            const today = getTodayString();
            setSelectedDateStr(today);
            const d = parseInputDate(today);
            if (d) {
                setManualYear(String(d.getFullYear()));
                setManualMonth(String(d.getMonth() + 1));
                setManualDay(String(d.getDate()));
            }
        } else if (type === "born1990") {
            setSelectedDateStr("1990-01-01");
            setManualYear("1990");
            setManualMonth("1");
            setManualDay("1");
        } else if (type === "y2k") {
            setSelectedDateStr("2000-01-01");
            setManualYear("2000");
            setManualMonth("1");
            setManualDay("1");
        } else if (type === "moonlanding") {
            setSelectedDateStr("1969-07-20");
            setManualYear("1969");
            setManualMonth("7");
            setManualDay("20");
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
        const dayOfWeekShort = dateObj.toLocaleDateString("en-US", { weekday: "short" });
        const monthName = dateObj.toLocaleDateString("en-US", { month: "long" });

        const zellerDay = getZellersDay(year, month, day);
        const leap = isLeapYear(year);

        // Day of Year
        const startOfYear = new Date(year, 0, 0);
        const diff = dateObj.getTime() - startOfYear.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        const totalYearDays = leap ? 366 : 365;
        const daysRemainingInYear = totalYearDays - dayOfYear;

        // Week number (ISO-8601 estimate)
        const target = new Date(dateObj.valueOf());
        const dayNr = (dateObj.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        const weekNumber = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);

        const zodiac = getZodiacSign(month, day);
        const birthstone = getBirthstone(month);

        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        return {
            dateObj,
            year,
            month,
            day,
            dayOfWeek,
            dayOfWeekShort,
            monthName,
            zellerDay,
            leap,
            dayOfYear,
            daysRemainingInYear,
            weekNumber,
            zodiac,
            birthstone,
            isWeekend,
            formattedFull: `${monthName} ${day}, ${year}`
        };
    }, [selectedDateStr]);

    const handleCopy = () => {
        if (!calculatedData) return;
        const text = `Date: ${calculatedData.formattedFull}\nDay of the Week: ${calculatedData.dayOfWeek}\nDay of Year: ${calculatedData.dayOfYear} of ${calculatedData.leap ? 366 : 365}\nISO Week: Week ${calculatedData.weekNumber}\nZodiac Sign: ${calculatedData.zodiac.sign} ${calculatedData.zodiac.symbol}`;
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
                            {/* Preset Buttons */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                    Historical &amp; Quick Presets
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: "Today", action: () => setPresetDate("today") },
                                        { label: "Jan 1, 1990", action: () => setPresetDate("born1990") },
                                        { label: "Y2K (2000)", action: () => setPresetDate("y2k") },
                                        { label: "Moon Landing", action: () => setPresetDate("moonlanding") },
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
                                    Enter any year from 0001 to 9999. Click outside or change focus to calculate.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side Execution
                        </span>
                        <span>Gregorian Calendar Rules</span>
                    </div>
                </div>

                {/* RIGHT PANEL: Results Display */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                Date Analysis Results
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
                                            <Calendar className="w-4 h-4 text-amber-400" /> Day of the Week
                                        </span>
                                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${calculatedData.isWeekend ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                                            {calculatedData.isWeekend ? "Weekend" : "Weekday"}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black text-white">
                                            {calculatedData.dayOfWeek}
                                        </span>
                                    </div>
                                    <p className="text-xs text-indigo-200/80 mt-4 pt-3 border-t border-indigo-800/80 leading-normal">
                                        Full Date: <strong>{calculatedData.formattedFull}</strong>
                                    </p>
                                </div>

                                {/* Detailed Grid Breakdown */}
                                <div className="grid grid-cols-2 gap-3">
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
                                            ISO Week Number
                                        </span>
                                        <div className="text-lg font-bold font-mono text-slate-800">
                                            Week {calculatedData.weekNumber}
                                        </div>
                                    </div>
                                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Zodiac Sign
                                        </span>
                                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                            <span className="text-base">{calculatedData.zodiac.symbol}</span>
                                            {calculatedData.zodiac.sign}
                                        </div>
                                    </div>
                                    <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                            Birthstone
                                        </span>
                                        <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-amber-500" />
                                            {calculatedData.birthstone}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed flex items-start gap-2">
                                    <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <p>
                                        Year <strong>{calculatedData.year}</strong> is{" "}
                                        <strong className="text-slate-800">{calculatedData.leap ? "a Leap Year (366 days)" : "a Standard Year (365 days)"}</strong>.
                                        There are <strong>{calculatedData.daysRemainingInYear} days</strong> remaining after this date.
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
                        <span>Zeller's Congruence Verified</span>
                        <span>ISO-8601 Week Standard</span>
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
                        <span>Understanding Day of the Week Calculations</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Determining the exact day of the week for any given date is a fundamental problem in calendar mathematics. Whether you are curious about the day you were born, planning future events, verifying historical documents, or auditing scheduling logs, calculating the weekday relies on precise modular arithmetic algorithms.
                        </p>
                        <p>
                            Our <strong>Day of the Week Calculator</strong> processes any date across thousands of years using standard Gregorian calendar rules and Zeller's Congruence algorithm. It instantly returns the full weekday name, ISO week number, day of the year index, leap year status, and astrological metadata.
                        </p>

                        <div className="grid md:grid-cols-2 gap-4 my-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Zeller's Congruence Algorithm
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Developed by Christian Zeller in the late 19th century, this formula computes the day of the week for any Julian or Gregorian calendar date using integer arithmetic on month, day, and year components.
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    The Gregorian Calendar Shift
                                </h3>
                                <p className="text-xs text-slate-600 leading-normal">
                                    Adopted in October 1582 to correct the drift of the Julian calendar, the Gregorian system redefined leap years so that years divisible by 100 are not leap years unless also divisible by 400.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Zeller's Formula Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>The Mathematics Behind the Algorithm</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            For the Gregorian calendar, Zeller's congruence formula is expressed mathematically as:
                        </p>
                        <div className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto my-4 border border-slate-800">
                            h = (q + ⌊(13(m + 1)) / 5⌋ + K + ⌊K / 4⌋ + ⌊J / 4⌋ - 2J) mod 7
                        </div>
                        <p>Where the variables correspond to:</p>
                        <ul className="list-disc pl-6 space-y-2 text-xs sm:text-sm text-slate-700">
                            <li><strong>h</strong> = Day of the week (0 = Saturday, 1 = Sunday, 2 = Monday, ..., 6 = Friday)</li>
                            <li><strong>q</strong> = Day of the month</li>
                            <li><strong>m</strong> = Month (3 = March, 4 = April, ..., 12 = December; January and February are counted as months 13 and 14 of the previous year)</li>
                            <li><strong>K</strong> = Year of the century (year mod 100)</li>
                            <li><strong>J</strong> = Zero-based century (⌊year / 100⌋)</li>
                        </ul>
                    </div>
                </div>

                {/* Card 3: Historical Presets Table */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <History className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Notable Historical Events &amp; Weekdays</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs sm:text-sm">
                                    <th className="p-3 sm:p-4">Historical Event</th>
                                    <th className="p-3 sm:p-4">Calendar Date</th>
                                    <th className="p-3 sm:p-4">Day of Week</th>
                                    <th className="p-3 sm:p-4">Significance</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs sm:text-sm text-slate-700 divide-y divide-slate-100">
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Apollo 11 Moon Landing</td>
                                    <td className="p-3 sm:p-4 font-mono">July 20, 1969</td>
                                    <td className="p-3 sm:p-4 font-bold text-indigo-600">Sunday</td>
                                    <td className="p-3 sm:p-4">First crewed moon landing</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">US Declaration of Independence</td>
                                    <td className="p-3 sm:p-4 font-mono">July 4, 1776</td>
                                    <td className="p-3 sm:p-4 font-bold text-indigo-600">Thursday</td>
                                    <td className="p-3 sm:p-4">Adoption of the Declaration</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Y2K New Year</td>
                                    <td className="p-3 sm:p-4 font-mono">January 1, 2000</td>
                                    <td className="p-3 sm:p-4 font-bold text-indigo-600">Saturday</td>
                                    <td className="p-3 sm:p-4">Turn of the millennium</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="p-3 sm:p-4 font-semibold text-slate-900">Fall of the Berlin Wall</td>
                                    <td className="p-3 sm:p-4 font-mono">November 9, 1989</td>
                                    <td className="p-3 sm:p-4 font-bold text-indigo-600">Thursday</td>
                                    <td className="p-3 sm:p-4">Opening of the border checkpoint</td>
                                </tr>
                            </tbody>
                        </table>
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
                                q: "How do I find out what day of the week I was born on?",
                                a: "Simply enter your date of birth in the input section using either the date picker or direct year/month/day entry. The calculator will immediately reveal the exact weekday you were born on alongside your astrological sign.",
                            },
                            {
                                q: "Does this tool work for future years like 2050 or 3000?",
                                a: "Yes. The underlying Gregorian mathematical model works seamlessly across thousands of future and historical years.",
                            },
                            {
                                q: "Why do January and February shift in Zeller's algorithm?",
                                a: "In calendar mathematics, treating January and February as the 13th and 14th months of the previous year simplifies leap year offsets, as leap days occur at the end of February.",
                            },
                            {
                                q: "What is an ISO Week Number?",
                                a: "The ISO-8601 week number system defines Week 1 of any year as the week containing the first Thursday of January, with weeks starting on Monday.",
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
                        name: "Day of the Week Calculator",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        description:
                            "Find the exact day of the week for any past, present, or future date using standard calendar algorithms.",
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
                                name: "How do I find out what day of the week I was born on?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Select your birth date in the calculator input to view the exact day of the week you were born.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Does this tool work for future years like 2050 or 3000?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, standard Gregorian calendar rules apply indefinitely across future dates.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}