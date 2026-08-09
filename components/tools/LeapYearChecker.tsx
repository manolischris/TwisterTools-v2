"use client";

import React, { useState, useMemo } from "react";
import {
    Calendar,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Copy,
    Check,
    Download,
    HelpCircle,
    Info,
    BookOpen,
    Clock,
    Globe,
    FileSpreadsheet,
    CalendarDays,
    Layers,
    Search,
    ShieldCheck,
    Sparkles,
    CheckSquare,
    AlertCircle
} from "lucide-react";

interface PresetYear {
    id: string;
    year: number;
    label: string;
    tag: string;
}

const PRESET_YEARS: PresetYear[] = [
    { id: "current-year", year: 2024, label: "2024 (Leap Year)", tag: "Recent Leap" },
    { id: "century-non-leap", year: 1900, label: "1900 (Century Non-Leap)", tag: "100-Yr Rule" },
    { id: "quad-century-leap", year: 2000, label: "2000 (Century Leap)", tag: "400-Yr Rule" },
    { id: "next-leap", year: 2028, label: "2028 (Next Leap)", tag: "Upcoming" },
    { id: "gregorian-start", year: 1582, label: "1582 (Gregorian Reform)", tag: "Historical" },
];

interface LeapYearAudit {
    year: number;
    isLeapYear: boolean;
    ruleReason: string;
    divisibleBy4: boolean;
    divisibleBy100: boolean;
    divisibleBy400: boolean;
    totalDays: number;
    februaryDays: number;
    isCenturyYear: boolean;
    calendarEra: "Julian" | "Gregorian";
    dayOfWeekJan1: string;
    dayOfWeekDec31: string;
}

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
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function LeapYearChecker() {
    // Primary Input States
    const [targetYear, setTargetYear] = useState<number>(2024);
    const [rangeStart, setRangeStart] = useState<number>(2020);
    const [rangeEnd, setRangeEnd] = useState<number>(2040);

    // UI States
    const [activeTab, setActiveTab] = useState<"single" | "range">("single");
    const [activePresetId, setActivePresetId] = useState<string | null>("current-year");
    const [copied, setCopied] = useState(false);

    // Core Audit Math & Rules Logic
    const singleAudit = useMemo<LeapYearAudit>(() => {
        const yr = Math.abs(targetYear) || 1;
        const div4 = yr % 4 === 0;
        const div100 = yr % 100 === 0;
        const div400 = yr % 400 === 0;

        let isLeap = false;
        let ruleReason = "";

        if (yr < 1582) {
            // Julian Calendar Rule (Every 4 years)
            isLeap = div4;
            ruleReason = div4
                ? "Julian Rule: Divisible by 4 (Pre-Gregorian Reform of 1582)."
                : "Julian Rule: Not divisible by 4.";
        } else {
            // Gregorian Calendar Rule
            if (div400) {
                isLeap = true;
                ruleReason = "Gregorian Exception Rule: Divisible by 400 (Century Leap Year).";
            } else if (div100) {
                isLeap = false;
                ruleReason = "Gregorian Century Rule: Divisible by 100 but NOT by 400 (Common Century Year).";
            } else if (div4) {
                isLeap = true;
                ruleReason = "Standard Gregorian Rule: Divisible by 4 and not a century year.";
            } else {
                isLeap = false;
                ruleReason = "Standard Gregorian Rule: Not divisible by 4.";
            }
        }

        const totalDays = isLeap ? 366 : 365;
        const februaryDays = isLeap ? 29 : 28;
        const isCenturyYear = div100;
        const calendarEra = yr < 1582 ? "Julian" : "Gregorian";

        // Day of week calculation for Jan 1 and Dec 31
        const jan1Date = new Date(yr, 0, 1);
        const dec31Date = new Date(yr, 11, 31);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayOfWeekJan1 = days[jan1Date.getDay()];
        const dayOfWeekDec31 = days[dec31Date.getDay()];

        return {
            year: yr,
            isLeapYear: isLeap,
            ruleReason,
            divisibleBy4: div4,
            divisibleBy100: div100,
            divisibleBy400: div400,
            totalDays,
            februaryDays,
            isCenturyYear,
            calendarEra,
            dayOfWeekJan1,
            dayOfWeekDec31,
        };
    }, [targetYear]);

    // Range Computation Logic
    const rangeAudit = useMemo(() => {
        const start = Math.min(rangeStart, rangeEnd);
        const end = Math.max(rangeStart, rangeEnd);
        const maxRange = 200; // Limit rendering for smooth UX
        const boundedEnd = Math.min(end, start + maxRange);

        const list: { year: number; isLeap: boolean; febDays: number; era: string }[] = [];
        let leapCount = 0;

        for (let y = start; y <= boundedEnd; y++) {
            const div4 = y % 4 === 0;
            const div100 = y % 100 === 0;
            const div400 = y % 400 === 0;

            let isLeap = false;
            if (y < 1582) {
                isLeap = div4;
            } else {
                if (div400) isLeap = true;
                else if (div100) isLeap = false;
                else isLeap = div4;
            }

            if (isLeap) leapCount++;

            list.push({
                year: y,
                isLeap,
                febDays: isLeap ? 29 : 28,
                era: y < 1582 ? "Julian" : "Gregorian",
            });
        }

        return {
            start,
            end: boundedEnd,
            totalYears: list.length,
            leapCount,
            commonCount: list.length - leapCount,
            yearsList: list,
            isTruncated: end - start > maxRange,
        };
    }, [rangeStart, rangeEnd]);

    // Handlers
    const applyPreset = (preset: PresetYear) => {
        setTargetYear(preset.year);
        setActivePresetId(preset.id);
        setActiveTab("single");
    };

    const handleReset = () => {
        setTargetYear(2024);
        setRangeStart(2020);
        setRangeEnd(2040);
        setActivePresetId("current-year");
        setActiveTab("single");
    };

    const handleCopySummary = () => {
        let text = "";
        if (activeTab === "single") {
            text = `Leap Year & Calendar Audit Summary (TwisterTools):
----------------------------------------
Target Year: ${singleAudit.year}
Status: ${singleAudit.isLeapYear ? "LEAP YEAR (366 Days)" : "COMMON YEAR (365 Days)"}
Calendar Era: ${singleAudit.calendarEra} Standard
February Days: ${singleAudit.februaryDays} Days
Jan 1 Starts On: ${singleAudit.dayOfWeekJan1}
Dec 31 Ends On: ${singleAudit.dayOfWeekDec31}
----------------------------------------
Divisibility Check:
• Divisible by 4: ${singleAudit.divisibleBy4 ? "YES" : "NO"}
• Divisible by 100: ${singleAudit.divisibleBy100 ? "YES" : "NO"}
• Divisible by 400: ${singleAudit.divisibleBy400 ? "YES" : "NO"}
Rule Verdict: ${singleAudit.ruleReason}
----------------------------------------
Verified at twistertools.com/tools/date-tools/leap-year-checker`;
        } else {
            text = `Leap Year Range Audit (${rangeAudit.start} - ${rangeAudit.end}):
----------------------------------------
Total Years Scanned: ${rangeAudit.totalYears}
Leap Years Count: ${rangeAudit.leapCount}
Common Years Count: ${rangeAudit.commonCount}
----------------------------------------
Leap Years in Range: ${rangeAudit.yearsList.filter(y => y.isLeap).map(y => y.year).join(", ")}
----------------------------------------
Verified at twistertools.com/tools/date-tools/leap-year-checker`;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Year", "Status", "Total Days", "Feb Days", "Divisible By 4", "Divisible By 100", "Divisible By 400", "Calendar Era"];
        let rows: string[][] = [];

        if (activeTab === "single") {
            rows = [[
                `${singleAudit.year}`,
                singleAudit.isLeapYear ? "Leap Year" : "Common Year",
                `${singleAudit.totalDays}`,
                `${singleAudit.februaryDays}`,
                singleAudit.divisibleBy4 ? "TRUE" : "FALSE",
                singleAudit.divisibleBy100 ? "TRUE" : "FALSE",
                singleAudit.divisibleBy400 ? "TRUE" : "FALSE",
                singleAudit.calendarEra
            ]];
        } else {
            rows = rangeAudit.yearsList.map((item) => {
                const div4 = item.year % 4 === 0;
                const div100 = item.year % 100 === 0;
                const div400 = item.year % 400 === 0;
                return [
                    `${item.year}`,
                    item.isLeap ? "Leap Year" : "Common Year",
                    item.isLeap ? "366" : "365",
                    `${item.febDays}`,
                    div4 ? "TRUE" : "FALSE",
                    div100 ? "TRUE" : "FALSE",
                    div400 ? "TRUE" : "FALSE",
                    item.era
                ];
            });
        }

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `leap_year_audit_${activeTab === "single" ? singleAudit.year : `${rangeAudit.start}_${rangeAudit.end}`}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Leap Year Checker & Calendar Auditor",
        "url": "https://twistertools.com/tools/date-tools/leap-year-checker",
        "description": "Instantly verify leap years, century leap year rules, solar year deviations, and calendar range audits using Gregorian and Julian mathematical algorithms.",
        "applicationCategory": "UtilityApplication",
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
                "name": "What is the exact mathematical rule for a leap year in the Gregorian calendar?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A year is a leap year if it is divisible by 4, UNLESS it is divisible by 100. However, if a year is divisible by 400, it IS a leap year. For example, 1900 was not a leap year, but 2000 was."
                }
            },
            {
                "@type": "Question",
                "name": "Why do century years like 1900 not have 29 days in February?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Adding a leap day every 4 years overcorrects the calendar by about 11 minutes per year. To compensate, century years divisible by 100 are omitted as leap years unless they are also divisible by 400."
                }
            },
            {
                "@type": "Question",
                "name": "Why do leap years exist in human timekeeping?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Earth takes approximately 365.242189 days to complete one full orbit around the Sun. Leap days realign the calendar year with solar astronomical seasons to prevent seasonal drift over centuries."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Julian and Gregorian leap years?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Julian calendar implemented a leap year unconditionally every 4 years without century exceptions. The Gregorian reform in 1582 introduced the 100/400-year exclusion rule to achieve greater long-term solar alignment."
                }
            },
            {
                "@type": "Question",
                "name": "How many leap days occur in a 400-year Gregorian cycle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In a 400-year Gregorian cycle, there are exactly 97 leap years instead of 100 due to the exclusion of 3 century years (e.g., 1700, 1800, 1900)."
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
                {/* Left Workspace Panel: Mode Selector & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <div className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-slate-900">Audit Configuration</h2>
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Audit Mode Tab Switcher */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculation Mode
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("single")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${activeTab === "single"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Single Year Check
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("range")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${activeTab === "range"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Date Range Scan
                                </button>
                            </div>
                        </div>

                        {/* Mode 1: Single Year Direct Input */}
                        {activeTab === "single" ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5 text-indigo-600" /> Enter Target Year
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="9999"
                                            value={targetYear === 0 ? "" : targetYear}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setTargetYear(Math.max(1, Math.min(9999, val))));
                                                setActivePresetId(null);
                                            }}
                                            placeholder="e.g. 2024"
                                            className="w-full pl-3 pr-12 py-3 rounded-xl border border-slate-200 text-slate-900 text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            A.D. / CE
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Supports historical Gregorian and Julian years (1 AD – 9999 AD).
                                    </p>
                                </div>

                                {/* Reference Presets */}
                                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Milestone Benchmarks
                                        </span>
                                        {activePresetId && (
                                            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                Preset Selected
                                            </span>
                                        )}
                                    </div>

                                    <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                        {PRESET_YEARS.map((preset) => {
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
                        ) : (
                            /* Mode 2: Date Range Inputs */
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Start Year
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="9999"
                                            value={rangeStart === 0 ? "" : rangeStart}
                                            onChange={(e) => handleNumberInput(e, (val) => setRangeStart(Math.max(1, val)))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                            End Year
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="9999"
                                            value={rangeEnd === 0 ? "" : rangeEnd}
                                            onChange={(e) => handleNumberInput(e, (val) => setRangeEnd(Math.max(1, val)))}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Audits up to 200 consecutive years simultaneously for leap year distribution analysis.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Left Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Audit" : "Copy Audit Report"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Rules Matrix & Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                Calendar Audit Verdict
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {activeTab === "single" ? `${singleAudit.calendarEra} Standard` : `${rangeAudit.totalYears} Years Scanned`}
                            </span>
                        </div>

                        {activeTab === "single" ? (
                            /* Single Year Hero Verdict Box */
                            <div className="space-y-5">
                                <div
                                    className={`p-6 rounded-2xl border transition-all ${singleAudit.isLeapYear
                                        ? "bg-emerald-50/80 border-emerald-200"
                                        : "bg-slate-50 border-slate-200"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                            Status Classification
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {singleAudit.isLeapYear ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> LEAP YEAR
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                                                    <XCircle className="w-3.5 h-3.5 text-slate-500" /> COMMON YEAR
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-baseline gap-3">
                                        <span className={`text-5xl font-black ${singleAudit.isLeapYear ? "text-emerald-700" : "text-slate-900"}`}>
                                            {singleAudit.year}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500">
                                            ({singleAudit.totalDays} Days)
                                        </span>
                                    </div>

                                    <p className="text-xs sm:text-sm font-medium text-slate-700 mt-3 pt-3 border-t border-slate-200/60 leading-relaxed">
                                        <strong>Rule Logic:</strong> {singleAudit.ruleReason}
                                    </p>
                                </div>

                                {/* Divisibility & Calendar Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 block">Divisible by 4</span>
                                        <span className={`text-base font-extrabold ${singleAudit.divisibleBy4 ? "text-emerald-600" : "text-slate-400"}`}>
                                            {singleAudit.divisibleBy4 ? "YES (÷4)" : "NO"}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 block">Divisible by 100</span>
                                        <span className={`text-base font-extrabold ${singleAudit.divisibleBy100 ? "text-amber-600" : "text-slate-400"}`}>
                                            {singleAudit.divisibleBy100 ? "YES (Century)" : "NO"}
                                        </span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 block">Divisible by 400</span>
                                        <span className={`text-base font-extrabold ${singleAudit.divisibleBy400 ? "text-indigo-600" : "text-slate-400"}`}>
                                            {singleAudit.divisibleBy400 ? "YES (Quad-Cent)" : "NO"}
                                        </span>
                                    </div>
                                </div>

                                {/* Extra Metadata Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-600 block">February Days</span>
                                            <span className="text-lg font-black text-indigo-900">{singleAudit.februaryDays} Days</span>
                                        </div>
                                        <Calendar className="w-5 h-5 text-indigo-500 opacity-80" />
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                                        <div>
                                            <span className="text-xs font-bold text-slate-600 block">Year Start / End</span>
                                            <span className="text-xs font-extrabold text-indigo-900 block">{singleAudit.dayOfWeekJan1} → {singleAudit.dayOfWeekDec31}</span>
                                        </div>
                                        <Clock className="w-5 h-5 text-indigo-500 opacity-80" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Range Audit Output View */
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 block">Total Scanned</span>
                                        <span className="text-lg font-black text-slate-900">{rangeAudit.totalYears}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                                        <span className="text-[11px] font-bold text-emerald-700 block">Leap Years</span>
                                        <span className="text-lg font-black text-emerald-800">{rangeAudit.leapCount}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <span className="text-[11px] font-bold text-slate-500 block">Common Years</span>
                                        <span className="text-lg font-black text-slate-700">{rangeAudit.commonCount}</span>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                                            <tr>
                                                <th className="p-2.5">Year</th>
                                                <th className="p-2.5">Classification</th>
                                                <th className="p-2.5">Feb Days</th>
                                                <th className="p-2.5">Era</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium">
                                            {rangeAudit.yearsList.map((item) => (
                                                <tr key={item.year} className={item.isLeap ? "bg-emerald-50/50 font-semibold" : "hover:bg-slate-50"}>
                                                    <td className="p-2.5 text-slate-900 font-bold">{item.year}</td>
                                                    <td className="p-2.5">
                                                        {item.isLeap ? (
                                                            <span className="text-emerald-700 font-bold">Leap Year</span>
                                                        ) : (
                                                            <span className="text-slate-500">Common Year</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5 text-slate-700">{item.febDays} Days</td>
                                                    <td className="p-2.5 text-slate-400">{item.era}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Deterministic Gregorian Engine
                        </span>
                        <span>TwisterTools Date Architecture</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Astronomical Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Astronomical Mechanics: Why Human Timekeeping Demands Leap Years
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A standard calendar year is defined as 365 solar days. However, the exact astronomical duration required for Planet Earth to complete one full orbit around the Sun—known as a <strong>tropical solar year</strong>—is approximately <strong>365.242189 days</strong> (or 365 days, 5 hours, 48 minutes, and 45 seconds). Without calendar corrections, this fractional surplus of ~0.2422 days per year causes human calendar dates to slowly drift away from physical astronomical seasons at a rate of approximately 24 calendar days per century.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> The Julian Overcorrection
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Instituted by Julius Caesar in 45 BC, the Julian calendar added 1 leap day every 4 years. This assumed a solar year was exactly 365.25 days long. Overestimation by 11 minutes per year created a 10-day error by the 16th century.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-600" /> The Gregorian Reform (1582)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Commissioned by Pope Gregory XIII, the Gregorian calendar refined the leap rule by introducing century exclusions. Omitting 3 leap years every 400 years brought average calendar length to 365.2425 days.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Mathematical Algorithms & Flowchart */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Gregorian 3-Step Leap Year Decision Algorithm
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Software engineers, database managers, and calendar systems evaluate leap year status using a nested modulo 3-step branching logic:
                    </p>

                    {/* Algorithmic Flow Block */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4" /> Pseudocode Implementation (ISO 8601 Standard)
                        </h3>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-1.5">
                            <div><span className="text-purple-400">function</span> <span className="text-blue-400">isLeapYear</span>(year):</div>
                            <div className="pl-4"><span className="text-purple-400">if</span> (year % 400 === 0) <span className="text-purple-400">return</span> <span className="text-emerald-400">true</span>;</div>
                            <div className="pl-4"><span className="text-purple-400">if</span> (year % 100 === 0) <span className="text-purple-400">return</span> <span className="text-rose-400">false</span>;</div>
                            <div className="pl-4"><span className="text-purple-400">if</span> (year % 4 === 0) <span className="text-purple-400">return</span> <span className="text-emerald-400">true</span>;</div>
                            <div className="pl-4"><span className="text-purple-400">return</span> <span className="text-rose-400">false</span>;</div>
                        </div>
                    </div>

                    {/* Century Benchmark Table */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Historical & Future Century Leap Year Audit Matrix
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Century Year</th>
                                        <th className="p-3">Divisible by 100?</th>
                                        <th className="p-3">Divisible by 400?</th>
                                        <th className="p-3">Leap Year Status</th>
                                        <th className="p-3">Total Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900">1700</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-rose-600 font-semibold">No</td>
                                        <td className="p-3 font-semibold text-rose-600">Common Year</td>
                                        <td className="p-3 text-slate-600">365 Days</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900">1800</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-rose-600 font-semibold">No</td>
                                        <td className="p-3 font-semibold text-rose-600">Common Year</td>
                                        <td className="p-3 text-slate-600">365 Days</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900">1900</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-rose-600 font-semibold">No</td>
                                        <td className="p-3 font-semibold text-rose-600">Common Year</td>
                                        <td className="p-3 text-slate-600">365 Days</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-bold text-emerald-900">2000</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 font-bold text-emerald-700">Century Leap Year</td>
                                        <td className="p-3 font-bold text-emerald-800">366 Days</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900">2100</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-rose-600 font-semibold">No</td>
                                        <td className="p-3 font-semibold text-rose-600">Common Year</td>
                                        <td className="p-3 text-slate-600">365 Days</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-bold text-emerald-900">2400</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 text-emerald-600 font-semibold">Yes</td>
                                        <td className="p-3 font-bold text-emerald-700">Century Leap Year</td>
                                        <td className="p-3 font-bold text-emerald-800">366 Days</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
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
                                What is the exact rule for a leap year in the Gregorian calendar?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A year is a leap year if it is evenly divisible by 4, except for century years (ending in 00). Century years are ONLY leap years if they are also evenly divisible by 400. Thus, 1900 was a common year, but 2000 was a leap year.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why are century years like 1900 and 2100 excluded as leap years?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Adding a leap day every 4 years slightly overcompensates (adding 0.25 days per year instead of 0.2422). To correct for this 11-minute annual surplus, 3 leap days are removed every 400 years by skipping century years not divisible by 400.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is the next leap year?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Following 2024, the next leap years in sequence are 2028, 2032, 2036, and 2040.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many leap days occur in a complete 400-year cycle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Across any 400-year Gregorian cycle, there are exactly 97 leap years (100 quadrennial cycles minus 3 excluded century years), resulting in exactly 146,097 total calendar days.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}