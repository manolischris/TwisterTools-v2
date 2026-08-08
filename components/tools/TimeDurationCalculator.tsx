"use client";

import React, { useState, useMemo } from "react";
import {
    Clock,
    Play,
    RotateCcw,
    Calendar,
    Copy,
    Check,
    Download,
    Plus,
    Trash2,
    HelpCircle,
    BookOpen,
    Calculator,
    Sparkles,
    ShieldCheck,
    Layers,
    Lightbulb,
    ArrowRight
} from "lucide-react";

interface TimeEntry {
    id: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    description: string;
}

interface DurationResult {
    hours: number;
    minutes: number;
    seconds: number;
    totalMinutes: number;
    totalHoursDecimal: number;
    totalSeconds: number;
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
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function TimeDurationCalculator() {
    // Mode State: Single Range vs Multi-Shift Timesheet
    const [calcMode, setCalcMode] = useState<"single" | "timesheet">("single");

    // Mode 1: Single Duration Inputs
    const [startDate, setStartDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [endTime, setEndTime] = useState<string>("17:30");
    const [breakMinutes, setBreakMinutes] = useState<number>(30);

    // Mode 2: Multi-Shift Timesheet State
    const [hourlyRate, setHourlyRate] = useState<number>(25);
    const [entries, setEntries] = useState<TimeEntry[]>([
        { id: "1", startTime: "08:30", endTime: "12:00", breakMinutes: 0, description: "Morning Shift" },
        { id: "2", startTime: "12:30", endTime: "17:00", breakMinutes: 15, description: "Afternoon Shift" },
    ]);

    // UI Feedback States
    const [copied, setCopied] = useState(false);

    // --- CALCULATIONS: SINGLE DURATION MODE ---
    const singleResult = useMemo<DurationResult>(() => {
        if (!startDate || !startTime || !endDate || !endTime) {
            return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, totalHoursDecimal: 0, totalSeconds: 0 };
        }

        const startDT = new Date(`${startDate}T${startTime}:00`);
        const endDT = new Date(`${endDate}T${endTime}:00`);

        let diffMs = endDT.getTime() - startDT.getTime();
        if (isNaN(diffMs) || diffMs < 0) {
            return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0, totalHoursDecimal: 0, totalSeconds: 0 };
        }

        // Subtract break time in milliseconds
        const breakMs = (breakMinutes || 0) * 60 * 1000;
        diffMs = Math.max(0, diffMs - breakMs);

        const totalSeconds = Math.floor(diffMs / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHoursDecimal = totalMinutes / 60;

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = totalSeconds % 60;

        return {
            hours,
            minutes,
            seconds,
            totalMinutes,
            totalHoursDecimal,
            totalSeconds,
        };
    }, [startDate, startTime, endDate, endTime, breakMinutes]);

    // --- CALCULATIONS: TIMESHEET MODE ---
    const timesheetSummary = useMemo(() => {
        let totalMinutesAll = 0;

        const processedEntries = entries.map((entry) => {
            if (!entry.startTime || !entry.endTime) {
                return { ...entry, durationMinutes: 0, formattedDuration: "0h 0m", pay: 0 };
            }

            const [startH, startM] = entry.startTime.split(":").map(Number);
            const [endH, endM] = entry.endTime.split(":").map(Number);

            let startMin = startH * 60 + startM;
            let endMin = endH * 60 + endM;

            // Handle overnight shifts spanning past midnight
            if (endMin < startMin) {
                endMin += 24 * 60;
            }

            let netMinutes = endMin - startMin - (entry.breakMinutes || 0);
            netMinutes = Math.max(0, netMinutes);

            totalMinutesAll += netMinutes;

            const h = Math.floor(netMinutes / 60);
            const m = netMinutes % 60;
            const decimalHours = netMinutes / 60;
            const pay = decimalHours * hourlyRate;

            return {
                ...entry,
                durationMinutes: netMinutes,
                formattedDuration: `${h}h ${m}m`,
                pay,
            };
        });

        const totalHours = Math.floor(totalMinutesAll / 60);
        const totalMins = totalMinutesAll % 60;
        const totalDecimalHours = totalMinutesAll / 60;
        const totalGrossPay = totalDecimalHours * hourlyRate;

        return {
            entries: processedEntries,
            totalMinutesAll,
            totalHours,
            totalMins,
            totalDecimalHours,
            totalGrossPay,
        };
    }, [entries, hourlyRate]);

    // HANDLERS
    const handleAddEntry = () => {
        const newId = Date.now().toString();
        setEntries([
            ...entries,
            { id: newId, startTime: "09:00", endTime: "17:00", breakMinutes: 30, description: "New Time Block" },
        ]);
    };

    const handleRemoveEntry = (id: string) => {
        if (entries.length <= 1) return;
        setEntries(entries.filter((e) => e.id !== id));
    };

    const handleUpdateEntry = (id: string, field: keyof TimeEntry, value: string | number) => {
        setEntries(
            entries.map((e) => (e.id === id ? { ...e, [field]: value } : e))
        );
    };

    const handleReset = () => {
        const today = new Date().toISOString().split("T")[0];
        setStartDate(today);
        setEndDate(today);
        setStartTime("09:00");
        setEndTime("17:30");
        setBreakMinutes(30);
        setHourlyRate(25);
        setEntries([
            { id: "1", startTime: "08:30", endTime: "12:00", breakMinutes: 0, description: "Morning Shift" },
            { id: "2", startTime: "12:30", endTime: "17:00", breakMinutes: 15, description: "Afternoon Shift" },
        ]);
    };

    const handleCopySummary = () => {
        let text = "";
        if (calcMode === "single") {
            text = `Time Duration Summary (TwisterTools):
----------------------------------------
Start: ${startDate} ${startTime}
End:   ${endDate} ${endTime}
Break: ${breakMinutes} minutes
----------------------------------------
Duration: ${singleResult.hours} hours, ${singleResult.minutes} minutes
Decimal:  ${singleResult.totalHoursDecimal.toFixed(2)} hours
Total Mins: ${singleResult.totalMinutes} mins
Total Secs: ${singleResult.totalSeconds} secs
----------------------------------------
Calculated at twistertools.com/tools/date-tools/time-duration-calculator`;
        } else {
            text = `Timesheet & Work Hours Summary (TwisterTools):
----------------------------------------
Hourly Rate: $${hourlyRate.toFixed(2)} / hr
Total Shifts: ${entries.length}
----------------------------------------
Total Hours: ${timesheetSummary.totalHours}h ${timesheetSummary.totalMins}m (${timesheetSummary.totalDecimalHours.toFixed(2)} hrs)
Gross Earnings: $${timesheetSummary.totalGrossPay.toFixed(2)}
----------------------------------------
Calculated at twistertools.com/tools/date-tools/time-duration-calculator`;
        }

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        let csvContent = "";
        if (calcMode === "single") {
            const headers = ["Start Date", "Start Time", "End Date", "End Time", "Break (Mins)", "Hours", "Minutes", "Decimal Hours"];
            const row = [
                startDate,
                startTime,
                endDate,
                endTime,
                breakMinutes,
                singleResult.hours,
                singleResult.minutes,
                singleResult.totalHoursDecimal.toFixed(2),
            ];
            csvContent = [headers.join(","), row.map((v) => `"${v}"`).join(",")].join("\n");
        } else {
            const headers = ["Description", "Start Time", "End Time", "Break (Mins)", "Duration", "Gross Pay ($)"];
            const rows = timesheetSummary.entries.map((e) => [
                e.description,
                e.startTime,
                e.endTime,
                e.breakMinutes,
                e.formattedDuration,
                e.pay.toFixed(2),
            ]);
            csvContent = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `time_duration_export_${calcMode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Time Duration & Hour Counter",
        "url": "https://twistertools.com/tools/date-tools/time-duration-calculator",
        "description": "Calculate exact time elapsed between dates, total work hours, shift durations, breaks, and gross payroll earnings in real time.",
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
                "name": "How does the Time Duration Calculator compute elapsed time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The calculator parses start and end timestamps into Unix epoch milliseconds, subtracts allocated break durations, and converts the net result into standard hours, minutes, seconds, and decimal hour formats."
                }
            },
            {
                "@type": "Question",
                "name": "How do I convert worked minutes into decimal hours for payroll?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To convert minutes into decimal hours, divide the total number of minutes by 60. For example, 7 hours and 45 minutes equals 7 + (45 / 60) = 7.75 decimal hours."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool handle overnight work shifts past midnight?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, in multi-shift mode, if an end time is set earlier than a start time (e.g., 10:00 PM to 6:00 AM), the calculator automatically detects a 24-hour day rollover and accurately computes night shift duration."
                }
            },
            {
                "@type": "Question",
                "name": "Is my timesheet and hour data stored on external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All calculation algorithms run completely client-side inside your local browser runtime. Zero data is transmitted or stored externally."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* ── Mode Selection Navigation Tabs ── */}
            <div className="flex bg-slate-100 p-1.5 mb-5 rounded-xl border border-slate-200 max-w-md mx-auto w-full">
                <button
                    type="button"
                    onClick={() => setCalcMode("single")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${calcMode === "single"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Elapsed Time Calculator
                </button>
                <button
                    type="button"
                    onClick={() => setCalcMode("timesheet")}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${calcMode === "timesheet"
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    Multi-Shift Timesheet
                </button>
            </div>

            {/* WORKSPACE GRID (50/50 SPLIT) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT WORKSPACE PANEL: INPUT CONTROLS */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Play className="w-5 h-5 text-indigo-600" />
                                {calcMode === "single" ? "Duration Parameters" : "Shift Log Entries"}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                    title="Reset all inputs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                                <span className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {calcMode === "single" ? "Single Block" : `${entries.length} Shifts`}
                                </span>
                            </div>
                        </div>

                        {calcMode === "single" ? (
                            /* SINGLE DURATION MODE INPUTS */
                            <div className="space-y-5">
                                {/* Start Date & Time */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Start Date & Time
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>
                                </div>

                                {/* End Date & Time */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> End Date & Time
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                    </div>
                                </div>

                                {/* Break Duration Deductions */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Break Deduction (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1440"
                                        value={breakMinutes === 0 ? "" : breakMinutes}
                                        onChange={(e) => handleNumberInput(e, setBreakMinutes)}
                                        placeholder="e.g. 30"
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* MULTI-SHIFT TIMESHEET MODE INPUTS */
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Hourly Rate ($)
                                    </label>
                                    <div className="w-32 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={hourlyRate === 0 ? "" : hourlyRate}
                                            onChange={(e) => handleNumberInput(e, setHourlyRate)}
                                            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Shift Rows */}
                                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                    {entries.map((entry, idx) => (
                                        <div key={entry.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50 space-y-2 relative">
                                            <div className="flex items-center justify-between">
                                                <input
                                                    type="text"
                                                    value={entry.description}
                                                    onChange={(e) => handleUpdateEntry(entry.id, "description", e.target.value)}
                                                    className="text-xs font-bold text-slate-800 bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
                                                    placeholder={`Shift #${idx + 1}`}
                                                />
                                                {entries.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveEntry(entry.id)}
                                                        className="text-slate-400 hover:text-rose-600 transition p-1"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">Start</span>
                                                    <input
                                                        type="time"
                                                        value={entry.startTime}
                                                        onChange={(e) => handleUpdateEntry(entry.id, "startTime", e.target.value)}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">End</span>
                                                    <input
                                                        type="time"
                                                        value={entry.endTime}
                                                        onChange={(e) => handleUpdateEntry(entry.id, "endTime", e.target.value)}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-semibold text-slate-500 mb-0.5">Break (m)</span>
                                                    <input
                                                        type="number"
                                                        value={entry.breakMinutes === 0 ? "" : entry.breakMinutes}
                                                        onChange={(e) => handleNumberInput(e, (val) => handleUpdateEntry(entry.id, "breakMinutes", val))}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-medium bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddEntry}
                                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-dashed border-slate-300"
                                >
                                    <Plus className="w-4 h-4 text-indigo-600" />
                                    Add Shift Entry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* RIGHT WORKSPACE PANEL: RESULTS DISPLAY */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Calculated Time Breakdown
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">Live Real-time Math</span>
                        </div>

                        {calcMode === "single" ? (
                            /* SINGLE DURATION RESULTS */
                            <div className="space-y-4">
                                {/* Main Hero Output */}
                                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-3 shadow-md">
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                        Total Calculated Duration
                                    </span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black text-white">
                                            {singleResult.hours}h {singleResult.minutes}m
                                        </span>
                                        <span className="text-sm font-semibold text-indigo-200">
                                            {singleResult.seconds}s
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 border-t border-slate-800 pt-3">
                                        Net elapsed time (after {breakMinutes} mins break deduction).
                                    </p>
                                </div>

                                {/* Detailed Metric Breakdown Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 block">Decimal Hours</span>
                                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                                            {singleResult.totalHoursDecimal.toFixed(2)} hrs
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 block">Total Minutes</span>
                                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                                            {singleResult.totalMinutes.toLocaleString()} mins
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 block">Total Seconds</span>
                                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                                            {singleResult.totalSeconds.toLocaleString()} secs
                                        </span>
                                    </div>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 block">Deducted Break</span>
                                        <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
                                            {breakMinutes} mins
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* MULTI-SHIFT RESULTS TABLE */
                            <div className="space-y-4">
                                {/* Timesheet Hero Total */}
                                <div className="p-5 rounded-2xl bg-indigo-600 text-white flex items-center justify-between shadow-md">
                                    <div>
                                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider block">Total Work Duration</span>
                                        <span className="text-3xl font-black text-white">
                                            {timesheetSummary.totalHours}h {timesheetSummary.totalMins}m
                                        </span>
                                        <span className="text-xs text-indigo-200 block mt-0.5">
                                            ({timesheetSummary.totalDecimalHours.toFixed(2)} decimal hours)
                                        </span>
                                    </div>
                                    <div className="text-right border-l border-indigo-400/50 pl-4">
                                        <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider block">Estimated Pay</span>
                                        <span className="text-2xl font-extrabold text-emerald-300">
                                            ${timesheetSummary.totalGrossPay.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Shift Breakdown Table */}
                                <div className="overflow-hidden border border-slate-200 rounded-xl max-h-[260px] overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                                            <tr>
                                                <th className="p-2.5">Shift</th>
                                                <th className="p-2.5">Net Time</th>
                                                <th className="p-2.5 text-right">Pay</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {timesheetSummary.entries.map((e, idx) => (
                                                <tr key={e.id} className="hover:bg-slate-50">
                                                    <td className="p-2.5 font-semibold text-slate-900">{e.description || `Shift #${idx + 1}`}</td>
                                                    <td className="p-2.5 text-slate-600">{e.formattedDuration}</td>
                                                    <td className="p-2.5 text-right font-bold text-emerald-600">${e.pay.toFixed(2)}</td>
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
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Client-side Local Computing
                        </span>
                        <span>High-Precision ISO Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO CARDS */}
            <div className="space-y-6">

                {/* Card 1: Time Calculation Formulas & Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Time Duration Math & Work Hour Counting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating exact elapsed time between two timestamps requires converting standard sexagesimal time units (hours, minutes, seconds) into linear epoch time. Because standard clock arithmetic rolls over at 60 minutes and 24 hours, calculating work shift durations, billable client hours, or project timelines manually often introduces rounding errors.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> Converting Minutes to Decimal Hours
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Payroll systems require hours in decimal format rather than standard hours and minutes. To convert minutes to decimals, divide minutes by 60. For instance, 45 minutes equals 45 / 60 = 0.75 decimal hours.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Handling Overnight Rollover Shifts
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Night shifts starting in the evening and concluding after midnight span across two calendar days. The engine computes overnight intervals by detecting negative time deltas and adding a full 24-hour modulo (1,440 minutes).
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Core Duration Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Exact mathematical formulas implemented directly inside this client-side module:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Total Net Minutes:</strong> Net Minutes = [(End_Hour × 60 + End_Min) - (Start_Hour × 60 + Start_Min)] - Break_Min</div>
                            <div><strong>2. Decimal Hours Formula:</strong> Decimal Hours = Net Minutes / 60</div>
                            <div><strong>3. Gross Earnings Computation:</strong> Total Pay = Decimal Hours × Hourly Rate</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Standard Decimal Hours Conversion Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Minutes to Decimal Hours Payroll Reference Chart
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this standardized reference table to convert common minute increments into decimal hour equivalents for accurate payroll processing:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Minutes</th>
                                    <th className="p-3">Decimal Hours</th>
                                    <th className="p-3">Example Shift Time</th>
                                    <th className="p-3">Decimal Equivalent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">15 mins</td>
                                    <td className="p-3">0.25 hrs</td>
                                    <td className="p-3">8 hours 15 minutes</td>
                                    <td className="p-3 font-bold text-slate-900">8.25 hrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">30 mins</td>
                                    <td className="p-3">0.50 hrs</td>
                                    <td className="p-3">7 hours 30 minutes</td>
                                    <td className="p-3 font-bold text-slate-900">7.50 hrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">45 mins</td>
                                    <td className="p-3">0.75 hrs</td>
                                    <td className="p-3">8 hours 45 minutes</td>
                                    <td className="p-3 font-bold text-slate-900">8.75 hrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-indigo-600">60 mins</td>
                                    <td className="p-3">1.00 hr</td>
                                    <td className="p-3">9 hours 0 minutes</td>
                                    <td className="p-3 font-bold text-slate-900">9.00 hrs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Practical Industry Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Key Applications Across Professional Workflows
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Freelancers & Contractors</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Track client project work blocks down to the minute and convert total hours into exact billable decimal amounts for invoicing.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">HR & Payroll Managers</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Easily calculate weekly shift totals, deduct unpaid lunch breaks, and verify gross wage calculations prior to executing payroll.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Flight & Logistics Planners</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Calculate total elapsed flight times, travel layovers, and multi-leg transit schedules across distinct time zones.
                            </p>
                        </div>
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
                                How does the Time Duration Calculator compute elapsed time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The calculator converts start and end time inputs into Unix epoch timestamps or total minutes from midnight, subtracts allocated break durations, and converts the net result into standard hours, minutes, seconds, and decimal formats.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I convert worked minutes into decimal hours for payroll?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To convert minutes into decimal hours, divide the number of minutes by 60. For example, 7 hours and 45 minutes equals 7 + (45 / 60) = 7.75 decimal hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool handle overnight work shifts past midnight?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. If an end time is chronologically earlier than a start time (e.g., 10:00 PM to 6:00 AM), the shift calculator automatically accounts for a midnight rollover and yields the correct 8-hour total.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my time tracking data stored on external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All calculation algorithms run client-side in your web browser. No timesheet information or financial rates are ever sent to external databases.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}