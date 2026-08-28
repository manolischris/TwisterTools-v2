"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Clock,
    DollarSign,
    Calendar,
    Plus,
    Trash2,
    RotateCcw,
    Copy,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    ShieldCheck,
    HelpCircle,
    Info,
    TrendingUp,
    Briefcase,
    Building2,
    AlertCircle,
    Percent,
    Calculator,
    Coffee,
    ArrowRight,
    Users,
    ChevronDown,
    Check,
    SlidersHorizontal,
    FileText
} from "lucide-react";

interface ShiftEntry {
    id: string;
    day: string;
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    hourlyRateOverride: number | null;
}

type OvertimeRule = "weekly_40" | "daily_8" | "daily_8_and_weekly_40" | "california_standard" | "none";
type PayPeriodType = "weekly" | "biweekly" | "custom";

const DEFAULT_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
};

const formatMinutesToHoursDec = (minutes: number): number => {
    return Math.round((minutes / 60) * 100) / 100;
};

const formatCurrency = (amount: number, currency = "$"): string => {
    return `${currency}${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = 0,
    max = 10000
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

export default function EmployeeTimesheetCalculator() {
    // Global Timesheet Parameters
    const [baseHourlyRate, setBaseHourlyRate] = useState<number>(25.0);
    const [currencySymbol, setCurrencySymbol] = useState<string>("$");
    const [overtimeRule, setOvertimeRule] = useState<OvertimeRule>("daily_8_and_weekly_40");
    const [overtimeMultiplier, setOvertimeMultiplier] = useState<number>(1.5);
    const [doubleTimeMultiplier, setDoubleTimeMultiplier] = useState<number>(2.0);
    const [autoDeductBreak, setAutoDeductBreak] = useState<number>(30);
    const [taxWithholdingRate, setTaxWithholdingRate] = useState<number>(18.0);
    const [employeeName, setEmployeeName] = useState<string>("Jane Doe");
    const [payPeriodEnding, setPayPeriodEnding] = useState<string>("2026-09-05");

    // Shift Rows State
    const [shifts, setShifts] = useState<ShiftEntry[]>([
        { id: "1", day: "Monday", date: "2026-08-31", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
        { id: "2", day: "Tuesday", date: "2026-09-01", startTime: "08:30", endTime: "17:30", breakMinutes: 30, hourlyRateOverride: null },
        { id: "3", day: "Wednesday", date: "2026-09-02", startTime: "08:30", endTime: "18:00", breakMinutes: 30, hourlyRateOverride: null },
        { id: "4", day: "Thursday", date: "2026-09-03", startTime: "08:30", endTime: "19:00", breakMinutes: 45, hourlyRateOverride: null },
        { id: "5", day: "Friday", date: "2026-09-04", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
        { id: "6", day: "Saturday", date: "2026-09-05", startTime: "09:00", endTime: "14:00", breakMinutes: 0, hourlyRateOverride: null },
        { id: "7", day: "Sunday", date: "2026-09-06", startTime: "", endTime: "", breakMinutes: 0, hourlyRateOverride: null }
    ]);

    // UI Feedback States
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

    // Calculated shifts with per-day breakdown
    const calculatedShifts = useMemo(() => {
        return shifts.map((shift) => {
            const startMins = parseTimeToMinutes(shift.startTime);
            const endMins = parseTimeToMinutes(shift.endTime);

            let totalMinutes = 0;
            if (shift.startTime && shift.endTime) {
                if (endMins >= startMins) {
                    totalMinutes = endMins - startMins;
                } else {
                    // Overnight shift cross midnight
                    totalMinutes = 24 * 60 - startMins + endMins;
                }
                totalMinutes = Math.max(0, totalMinutes - (shift.breakMinutes || 0));
            }

            const totalHours = formatMinutesToHoursDec(totalMinutes);
            const effectiveRate = shift.hourlyRateOverride !== null && shift.hourlyRateOverride > 0
                ? shift.hourlyRateOverride
                : baseHourlyRate;

            return {
                ...shift,
                totalMinutes,
                totalHours,
                effectiveRate
            };
        });
    }, [shifts, baseHourlyRate]);

    // Aggregate Calculations & Overtime Allocations
    const payrollMetrics = useMemo(() => {
        let regularHours = 0;
        let overtimeHours = 0;
        let doubleTimeHours = 0;
        let regularGrossPay = 0;
        let overtimeGrossPay = 0;
        let doubleTimeGrossPay = 0;

        if (overtimeRule === "none") {
            calculatedShifts.forEach((s) => {
                regularHours += s.totalHours;
                regularGrossPay += s.totalHours * s.effectiveRate;
            });
        } else if (overtimeRule === "daily_8") {
            calculatedShifts.forEach((s) => {
                const dayReg = Math.min(8, s.totalHours);
                const dayOt = Math.max(0, s.totalHours - 8);

                regularHours += dayReg;
                overtimeHours += dayOt;

                regularGrossPay += dayReg * s.effectiveRate;
                overtimeGrossPay += dayOt * (s.effectiveRate * overtimeMultiplier);
            });
        } else if (overtimeRule === "weekly_40") {
            let accumulatedWeekHours = 0;
            calculatedShifts.forEach((s) => {
                const priorHours = accumulatedWeekHours;
                accumulatedWeekHours += s.totalHours;

                if (accumulatedWeekHours <= 40) {
                    regularHours += s.totalHours;
                    regularGrossPay += s.totalHours * s.effectiveRate;
                } else if (priorHours >= 40) {
                    overtimeHours += s.totalHours;
                    overtimeGrossPay += s.totalHours * (s.effectiveRate * overtimeMultiplier);
                } else {
                    const remainingRegular = 40 - priorHours;
                    const otInShift = s.totalHours - remainingRegular;

                    regularHours += remainingRegular;
                    regularGrossPay += remainingRegular * s.effectiveRate;

                    overtimeHours += otInShift;
                    overtimeGrossPay += otInShift * (s.effectiveRate * overtimeMultiplier);
                }
            });
        } else if (overtimeRule === "daily_8_and_weekly_40") {
            // Standard US Combined Threshold
            let accumulatedWeekRegular = 0;

            calculatedShifts.forEach((s) => {
                const dayRegularPotential = Math.min(8, s.totalHours);
                const dayOt = Math.max(0, s.totalHours - 8);

                overtimeHours += dayOt;
                overtimeGrossPay += dayOt * (s.effectiveRate * overtimeMultiplier);

                if (accumulatedWeekRegular + dayRegularPotential <= 40) {
                    regularHours += dayRegularPotential;
                    regularGrossPay += dayRegularPotential * s.effectiveRate;
                    accumulatedWeekRegular += dayRegularPotential;
                } else {
                    const remainingReg = Math.max(0, 40 - accumulatedWeekRegular);
                    const weeklyOtExceeded = dayRegularPotential - remainingReg;

                    regularHours += remainingReg;
                    regularGrossPay += remainingReg * s.effectiveRate;
                    accumulatedWeekRegular += remainingReg;

                    overtimeHours += weeklyOtExceeded;
                    overtimeGrossPay += weeklyOtExceeded * (s.effectiveRate * overtimeMultiplier);
                }
            });
        } else if (overtimeRule === "california_standard") {
            // California Daily Overtime & Double Time Rules
            let accumulatedWeekRegular = 0;

            calculatedShifts.forEach((s, dayIdx) => {
                const isSeventhDay = dayIdx === 6; // 7th consecutive day scenario

                if (!isSeventhDay) {
                    const dayReg = Math.min(8, s.totalHours);
                    const dayOt = Math.min(4, Math.max(0, s.totalHours - 8)); // 8 to 12 hrs
                    const dayDt = Math.max(0, s.totalHours - 12); // Over 12 hrs

                    doubleTimeHours += dayDt;
                    doubleTimeGrossPay += dayDt * (s.effectiveRate * doubleTimeMultiplier);

                    overtimeHours += dayOt;
                    overtimeGrossPay += dayOt * (s.effectiveRate * overtimeMultiplier);

                    if (accumulatedWeekRegular + dayReg <= 40) {
                        regularHours += dayReg;
                        regularGrossPay += dayReg * s.effectiveRate;
                        accumulatedWeekRegular += dayReg;
                    } else {
                        const remainingReg = Math.max(0, 40 - accumulatedWeekRegular);
                        const weeklyOtExceeded = dayReg - remainingReg;

                        regularHours += remainingReg;
                        regularGrossPay += remainingReg * s.effectiveRate;
                        accumulatedWeekRegular += remainingReg;

                        overtimeHours += weeklyOtExceeded;
                        overtimeGrossPay += weeklyOtExceeded * (s.effectiveRate * overtimeMultiplier);
                    }
                } else {
                    // 7th consecutive day: first 8 hrs OT, over 8 hrs DT
                    const seventhOt = Math.min(8, s.totalHours);
                    const seventhDt = Math.max(0, s.totalHours - 8);

                    overtimeHours += seventhOt;
                    overtimeGrossPay += seventhOt * (s.effectiveRate * overtimeMultiplier);

                    doubleTimeHours += seventhDt;
                    doubleTimeGrossPay += seventhDt * (s.effectiveRate * doubleTimeMultiplier);
                }
            });
        }

        const totalHoursWorked = regularHours + overtimeHours + doubleTimeHours;
        const totalGrossPay = regularGrossPay + overtimeGrossPay + doubleTimeGrossPay;
        const estimatedTaxWithheld = totalGrossPay * (taxWithholdingRate / 100);
        const estimatedNetPay = totalGrossPay - estimatedTaxWithheld;
        const effectiveHourlyRate = totalHoursWorked > 0 ? totalGrossPay / totalHoursWorked : 0;

        return {
            totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
            regularHours: Math.round(regularHours * 100) / 100,
            overtimeHours: Math.round(overtimeHours * 100) / 100,
            doubleTimeHours: Math.round(doubleTimeHours * 100) / 100,
            regularGrossPay,
            overtimeGrossPay,
            doubleTimeGrossPay,
            totalGrossPay,
            estimatedTaxWithheld,
            estimatedNetPay,
            effectiveHourlyRate
        };
    }, [
        calculatedShifts,
        overtimeRule,
        overtimeMultiplier,
        doubleTimeMultiplier,
        taxWithholdingRate
    ]);

    // Shift Handlers
    const updateShift = (id: string, field: keyof ShiftEntry, value: string | number | null) => {
        setShifts((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const addShift = () => {
        const newId = (shifts.length + 1).toString();
        const nextDayName = DEFAULT_DAYS[shifts.length % 7] || `Day ${shifts.length + 1}`;
        setShifts((prev) => [
            ...prev,
            {
                id: newId,
                day: nextDayName,
                date: "",
                startTime: "09:00",
                endTime: "17:00",
                breakMinutes: autoDeductBreak,
                hourlyRateOverride: null
            }
        ]);
    };

    const removeShift = (id: string) => {
        if (shifts.length <= 1) return;
        setShifts((prev) => prev.filter((s) => s.id !== id));
    };

    const resetToStandardWorkWeek = () => {
        setShifts([
            { id: "1", day: "Monday", date: "2026-08-31", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
            { id: "2", day: "Tuesday", date: "2026-09-01", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
            { id: "3", day: "Wednesday", date: "2026-09-02", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
            { id: "4", day: "Thursday", date: "2026-09-03", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
            { id: "5", day: "Friday", date: "2026-09-04", startTime: "08:30", endTime: "17:00", breakMinutes: 30, hourlyRateOverride: null },
            { id: "6", day: "Saturday", date: "2026-09-05", startTime: "", endTime: "", breakMinutes: 0, hourlyRateOverride: null },
            { id: "7", day: "Sunday", date: "2026-09-06", startTime: "", endTime: "", breakMinutes: 0, hourlyRateOverride: null }
        ]);
    };

    // Export CSV Timesheet
    const exportCSV = () => {
        const headers = ["Day", "Date", "Start Time", "End Time", "Break (mins)", "Total Hours", "Hourly Rate", "Shift Pay"];
        const rows = calculatedShifts.map((s) => [
            s.day,
            s.date || "N/A",
            s.startTime || "Off",
            s.endTime || "Off",
            s.breakMinutes.toString(),
            s.totalHours.toFixed(2),
            `${currencySymbol}${s.effectiveRate.toFixed(2)}`,
            `${currencySymbol}${(s.totalHours * s.effectiveRate).toFixed(2)}`
        ]);

        const summaryRows = [
            [],
            ["Employee Name", employeeName],
            ["Pay Period Ending", payPeriodEnding],
            ["Regular Hours", payrollMetrics.regularHours.toFixed(2)],
            ["Overtime Hours", payrollMetrics.overtimeHours.toFixed(2)],
            ["Double Time Hours", payrollMetrics.doubleTimeHours.toFixed(2)],
            ["Total Hours", payrollMetrics.totalHoursWorked.toFixed(2)],
            ["Gross Pay", `${currencySymbol}${payrollMetrics.totalGrossPay.toFixed(2)}`],
            ["Estimated Withholding Tax", `${currencySymbol}${payrollMetrics.estimatedTaxWithheld.toFixed(2)}`],
            ["Estimated Net Pay", `${currencySymbol}${payrollMetrics.estimatedNetPay.toFixed(2)}`]
        ];

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((r) => r.map((field) => `"${field}"`).join(",")), ...summaryRows.map((r) => r.map((field) => `"${field}"`).join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Timesheet_${employeeName.replace(/\s+/g, "_")}_${payPeriodEnding}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy Text Summary to Clipboard
    const copyTimesheetSummary = () => {
        const text = `TIMESHEET & PAYROLL SUMMARY
========================================
Employee: ${employeeName}
Period Ending: ${payPeriodEnding}
Base Hourly Rate: ${currencySymbol}${baseHourlyRate.toFixed(2)}/hr
Overtime Rule: ${overtimeRule.replace(/_/g, " ").toUpperCase()}

SHIFT DETAILS:
${calculatedShifts.map((s) => `${s.day.padEnd(10)} | ${s.date || "N/A"} | ${s.startTime || "OFF"} - ${s.endTime || "OFF"} | Break: ${s.breakMinutes}m | Hours: ${s.totalHours.toFixed(2)}`).join("\n")}

PAYROLL TOTALS:
----------------------------------------
Regular Hours Worked:     ${payrollMetrics.regularHours.toFixed(2)} hrs (${formatCurrency(payrollMetrics.regularGrossPay, currencySymbol)})
Overtime Hours (1.5x):    ${payrollMetrics.overtimeHours.toFixed(2)} hrs (${formatCurrency(payrollMetrics.overtimeGrossPay, currencySymbol)})
Double Time Hours (2.0x):  ${payrollMetrics.doubleTimeHours.toFixed(2)} hrs (${formatCurrency(payrollMetrics.doubleTimeGrossPay, currencySymbol)})
Total Hours Worked:       ${payrollMetrics.totalHoursWorked.toFixed(2)} hrs

GROSS TOTAL EARNINGS:     ${formatCurrency(payrollMetrics.totalGrossPay, currencySymbol)}
Estimated Tax (${taxWithholdingRate}%):   -${formatCurrency(payrollMetrics.estimatedTaxWithheld, currencySymbol)}
ESTIMATED NET PAYCHECK:   ${formatCurrency(payrollMetrics.estimatedNetPay, currencySymbol)}
========================================
Generated with TwisterTools Timesheet & Overtime Pay Calculator`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Employee Timesheet & Overtime Pay Calculator",
        "url": "https://twistertools.com/tools/date-tools/employee-timesheet-calculator",
        "description": "Enterprise-grade employee timesheet calculator with automated daily and weekly overtime, California double-time rules, meal break deductions, and CSV export.",
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
                "name": "How is daily vs. weekly overtime calculated under Fair Labor Standards Act (FLSA) regulations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under federal US FLSA standards, non-exempt hourly employees receive overtime pay at 1.5 times their regular hourly rate for all hours worked over 40 hours during a designated 7-day workweek. Federal law does not require daily overtime pay after 8 hours; however, specific states like California, Nevada, Alaska, and Colorado enforce statutory daily overtime after 8 or 12 hours worked in a single day."
                }
            },
            {
                "@type": "Question",
                "name": "What are California's specific daily overtime and double-time rules?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In California, non-exempt employees earn 1.5x regular pay for hours worked beyond 8 up to 12 in a single workday, and for the first 8 hours on the 7th consecutive day of work in a single workweek. Double time (2.0x regular pay) applies to all hours worked beyond 12 hours in a single workday and for all hours worked beyond 8 hours on the 7th consecutive day."
                }
            },
            {
                "@type": "Question",
                "name": "How does unpaid lunch and meal break deduction work on a timesheet?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bona fide meal breaks of 30 minutes or longer where the employee is completely relieved of all duty are legally non-compensable under FLSA guidelines. The calculator automatically subtracts entered lunch break minutes from the span between shift start and end times to calculate accurate compensable working hours."
                }
            },
            {
                "@type": "Question",
                "name": "Can I calculate overnight shifts that cross past midnight?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. If a shift begins in the evening (e.g., 20:00) and ends the following morning (e.g., 04:30), the calculator detects the overnight boundary and correctly totals the elapsed work hours without requiring manual day splitting."
                }
            },
            {
                "@type": "Question",
                "name": "How is the blended effective hourly rate calculated for overtime shifts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The effective hourly rate is computed by dividing total gross pay (regular pay + overtime pay + double-time pay) by the total cumulative hours worked. This metric provides employees and payroll managers with an accurate picture of the true average hourly wage earned across an entire pay period."
                }
            },
            {
                "@type": "Question",
                "name": "Is my timesheet and employee wage data stored on external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All calculations, wage totals, shift logs, and CSV exports are computed 100% locally within your web browser. No employee payroll data or hourly wages are transmitted or retained on any remote cloud database, ensuring total privacy."
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

                {/* Left Workspace Panel: Timesheet Roster & Shift Entry Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Global Parameter Bar */}
                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Base Hourly Rate
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                                            {currencySymbol}
                                        </span>
                                        <input
                                            type="number"
                                            step="0.25"
                                            min={0}
                                            max={500}
                                            value={baseHourlyRate}
                                            onChange={(e) => handleNumberInput(e, setBaseHourlyRate, 0, 500)}
                                            className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Currency Symbol
                                    </label>
                                    <select
                                        value={currencySymbol}
                                        onChange={(e) => setCurrencySymbol(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="$">USD ($)</option>
                                        <option value="€">EUR (€)</option>
                                        <option value="£">GBP (£)</option>
                                        <option value="CA$">CAD (CA$)</option>
                                        <option value="AU$">AUD (AU$)</option>
                                        <option value="¥">JPY/CNY (¥)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 block mb-1">
                                        Overtime Rule
                                    </label>
                                    <select
                                        value={overtimeRule}
                                        onChange={(e) => setOvertimeRule(e.target.value as OvertimeRule)}
                                        className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none truncate"
                                    >
                                        <option value="daily_8_and_weekly_40">US Standard (&gt;8h/day or &gt;40h/wk)</option>
                                        <option value="weekly_40">Weekly Overtime Only (&gt;40h/wk)</option>
                                        <option value="daily_8">Daily Overtime Only (&gt;8h/day)</option>
                                        <option value="california_standard">California (&gt;8h OT, &gt;12h DT, 7th Day)</option>
                                        <option value="none">No Overtime (Straight Time)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Collapsible Advanced Parameters */}
                            <div className="pt-2 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <span>{showAdvancedSettings ? "Hide Advanced Payroll Settings" : "Configure Multipliers, Taxes & Metadata"}</span>
                                </button>

                                {showAdvancedSettings && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 animate-in fade-in duration-150">
                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                Employee Name
                                            </label>
                                            <input
                                                type="text"
                                                value={employeeName}
                                                onChange={(e) => setEmployeeName(e.target.value)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                Period Ending
                                            </label>
                                            <input
                                                type="date"
                                                value={payPeriodEnding}
                                                onChange={(e) => setPayPeriodEnding(e.target.value)}
                                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                OT Rate Multiplier
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min={1}
                                                max={5}
                                                value={overtimeMultiplier}
                                                onChange={(e) => handleNumberInput(e, setOvertimeMultiplier, 1, 5)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                                Est. Tax Withhold (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min={0}
                                                max={60}
                                                value={taxWithholdingRate}
                                                onChange={(e) => handleNumberInput(e, setTaxWithholdingRate, 0, 60)}
                                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Shift Rows Management */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    Daily Shift Log ({shifts.length} Shifts)
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={resetToStandardWorkWeek}
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition"
                                        title="Reset to Monday-Friday Standard"
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        <span>Reset Week</span>
                                    </button>
                                </div>
                            </div>

                            {/* Responsive Shifts Container */}
                            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                                {calculatedShifts.map((shift, idx) => (
                                    <div
                                        key={shift.id}
                                        className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2 hover:border-indigo-300 transition"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={shift.day}
                                                    onChange={(e) => updateShift(shift.id, "day", e.target.value)}
                                                    className="w-24 sm:w-28 font-bold text-xs bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    placeholder="Day"
                                                />
                                                <input
                                                    type="date"
                                                    value={shift.date}
                                                    onChange={(e) => updateShift(shift.id, "date", e.target.value)}
                                                    className="w-28 sm:w-32 text-[11px] bg-white border border-slate-300 rounded-md px-1.5 py-1 text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                                    {shift.totalHours.toFixed(2)}h
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeShift(shift.id)}
                                                    disabled={shifts.length <= 1}
                                                    className={`p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer ${shifts.length <= 1 ? "opacity-30 cursor-not-allowed" : ""}`}
                                                    title="Delete Shift"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Shift Times Grid */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={shift.startTime}
                                                    onChange={(e) => updateShift(shift.id, "startTime", e.target.value)}
                                                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                                                    End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={shift.endTime}
                                                    onChange={(e) => updateShift(shift.id, "endTime", e.target.value)}
                                                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5 flex items-center justify-between">
                                                    <span>Break (mins)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={240}
                                                    step={5}
                                                    value={shift.breakMinutes}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/^0+(?=\d)/, "");
                                                        const val = raw === "" ? 0 : parseInt(raw, 10);
                                                        updateShift(shift.id, "breakMinutes", isNaN(val) ? 0 : val);
                                                    }}
                                                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add Shift Action */}
                            <button
                                type="button"
                                onClick={addShift}
                                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-indigo-600" />
                                <span>Add Another Shift / Work Day</span>
                            </button>
                        </div>

                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Overnight cross-midnight shifts calculated automatically
                        </span>
                        <span className="font-bold text-emerald-600">Client-Side Secure</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Gross Pay Summary, Overtime Breakdown & Net Paycheck Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Top Hero Result: Net & Gross Paycheck */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 space-y-4 shadow-md">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 block">
                                        Estimated Total Gross Pay
                                    </span>
                                    <h3 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5">
                                        {formatCurrency(payrollMetrics.totalGrossPay, currencySymbol)}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                        Total Cumulative Hours
                                    </span>
                                    <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                                        {payrollMetrics.totalHoursWorked.toFixed(2)}h
                                    </span>
                                </div>
                            </div>

                            {/* Net Take-Home Calculation Preview */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Estimated Net Pay</span>
                                    <span className="text-lg font-black font-mono text-emerald-400">
                                        {formatCurrency(payrollMetrics.estimatedNetPay, currencySymbol)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">after {taxWithholdingRate}% tax</span>
                                </div>

                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Effective Rate</span>
                                    <span className="text-lg font-black font-mono text-indigo-300">
                                        {formatCurrency(payrollMetrics.effectiveHourlyRate, currencySymbol)}/h
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">blended average</span>
                                </div>

                                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Tax Withheld</span>
                                    <span className="text-lg font-black font-mono text-amber-300">
                                        -{formatCurrency(payrollMetrics.estimatedTaxWithheld, currencySymbol)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">estimated total</span>
                                </div>
                            </div>
                        </div>

                        {/* Overtime Tier Breakdown Matrix */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                Hours Tier Allocation & Compensation Matrix
                            </h3>

                            <div className="space-y-2">
                                {/* Regular Hours Tier */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                            <span className="text-xs font-bold text-slate-900">Regular Straight Time (1.0x)</span>
                                        </div>
                                        <span className="text-[11px] text-slate-500 block">
                                            Base rate of {formatCurrency(baseHourlyRate, currencySymbol)}/hr
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-bold text-slate-800 block">
                                            {payrollMetrics.regularHours.toFixed(2)} hrs
                                        </span>
                                        <span className="text-xs font-mono font-bold text-slate-600">
                                            {formatCurrency(payrollMetrics.regularGrossPay, currencySymbol)}
                                        </span>
                                    </div>
                                </div>

                                {/* Overtime 1.5x Tier */}
                                <div className="p-3 bg-indigo-50/50 border border-indigo-200/80 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                            <span className="text-xs font-bold text-indigo-950">Overtime Time & Half ({overtimeMultiplier}x)</span>
                                        </div>
                                        <span className="text-[11px] text-indigo-600 block">
                                            OT rate of {formatCurrency(baseHourlyRate * overtimeMultiplier, currencySymbol)}/hr
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-bold text-indigo-950 block">
                                            {payrollMetrics.overtimeHours.toFixed(2)} hrs
                                        </span>
                                        <span className="text-xs font-mono font-bold text-indigo-600">
                                            {formatCurrency(payrollMetrics.overtimeGrossPay, currencySymbol)}
                                        </span>
                                    </div>
                                </div>

                                {/* Double Time 2.0x Tier */}
                                <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-950">Double Time ({doubleTimeMultiplier}x)</span>
                                        </div>
                                        <span className="text-[11px] text-emerald-600 block">
                                            DT rate of {formatCurrency(baseHourlyRate * doubleTimeMultiplier, currencySymbol)}/hr
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-mono font-bold text-emerald-950 block">
                                            {payrollMetrics.doubleTimeHours.toFixed(2)} hrs
                                        </span>
                                        <span className="text-xs font-mono font-bold text-emerald-600">
                                            {formatCurrency(payrollMetrics.doubleTimeGrossPay, currencySymbol)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pay Period & Employee Summary Card */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-700">
                                <span className="font-semibold">Employee:</span>
                                <span className="font-bold text-slate-900">{employeeName || "Unassigned"}</span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                                <span className="font-semibold">Pay Period Ending:</span>
                                <span className="font-bold text-slate-900">{payPeriodEnding || "N/A"}</span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                                <span className="font-semibold">Active Regulatory Rule:</span>
                                <span className="font-mono font-bold text-indigo-600 uppercase text-[11px]">
                                    {overtimeRule.replace(/_/g, " ")}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Export and Clipboard Actions */}
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={exportCSV}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>Export CSV Timesheet</span>
                        </button>

                        <button
                            type="button"
                            onClick={copyTimesheetSummary}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedSummary ? "Summary Copied!" : "Copy Payroll Text"}</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Timesheet & Overtime Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Employee Timesheet & Overtime Pay Calculations: Complete Regulatory Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurate employee time tracking and payroll computation form the bedrock of transparent, legally compliant labor operations. Under modern labor standards—such as the United States Fair Labor Standards Act (FLSA), state-specific labor codes, and European Working Time Directives—employers must maintain accurate daily records of hours worked by non-exempt personnel.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating payroll involves much more than multiplying total elapsed hours by an agreed wage. It requires converting wall-clock hours into decimal work units, subtracting non-compensable meal breaks, handling overnight cross-midnight shifts, segregating regular straight-time from statutory overtime tiers (1.5x and 2.0x), and factoring in preliminary tax withholding obligations.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Metric 1</span>
                            <h3 className="font-bold text-slate-900 text-sm">Decimal Time Conversion</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Payroll systems require converting minutes to hundredths of an hour (e.g., 8 hours 15 minutes = 8.25 hours) to ensure fractional arithmetic precision.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Metric 2</span>
                            <h3 className="font-bold text-slate-900 text-sm">Meal Break Exclusion</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Unpaid lunch periods of 30 minutes or more must be automatically deducted from total shift span to prevent inflating compensable hours.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Metric 3</span>
                            <h3 className="font-bold text-slate-900 text-sm">Tiered Overtime Multipliers</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Applying 1.5x (time-and-a-half) and 2.0x (double-time) multipliers to statutory daily or weekly surplus hours guarantees compliance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Regulatory Comparison Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Overtime Law Comparison: Federal FLSA vs. State Jurisdictions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different jurisdictions enforce varying statutory thresholds before overtime compensation activates. The reference matrix below summarizes the primary standards across major legal jurisdictions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Jurisdiction / Rule</th>
                                    <th className="p-3">Daily Overtime (1.5x)</th>
                                    <th className="p-3">Daily Double Time (2.0x)</th>
                                    <th className="p-3">Weekly Threshold (1.5x)</th>
                                    <th className="p-3">7th Consecutive Day Rule</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">US Federal (FLSA)</td>
                                    <td className="p-3 text-slate-500">None required</td>
                                    <td className="p-3 text-slate-500">None required</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 40 hours in 7 days</td>
                                    <td className="p-3 text-slate-500">Standard weekly calculation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">California (IWC Orders)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 8 hours up to 12 hours</td>
                                    <td className="p-3 font-mono font-bold text-emerald-600">&gt; 12 hours in a workday</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 40 regular hours</td>
                                    <td className="p-3 text-xs text-slate-700">First 8h at 1.5x; &gt;8h at 2.0x</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Nevada Labor Code</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 8 hours (if wage &lt; 1.5x min)</td>
                                    <td className="p-3 text-slate-500">None required</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 40 hours in 7 days</td>
                                    <td className="p-3 text-slate-500">Standard weekly calculation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Colorado (COMPS Order)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 12 hours in a single day</td>
                                    <td className="p-3 text-slate-500">None required</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">&gt; 40 hours in a workweek</td>
                                    <td className="p-3 text-slate-500">Standard weekly calculation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">European Standard (EWTD)</td>
                                    <td className="p-3 text-slate-500">Per national collective treaty</td>
                                    <td className="p-3 text-slate-500">Per national collective treaty</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">48h maximum ceiling (avg)</td>
                                    <td className="p-3 text-xs text-slate-700">Mandatory 24h rest per 7 days</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Mathematical Computation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Timesheet Math Works: Step-by-Step Formula & Worked Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To calculate employee gross earnings from raw shift timestamps, our calculation engine follows this four-stage mathematical progression:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Shift Span & Break Subtraction</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Calculate elapsed minutes between start and end times, handle midnight transitions if end time is before start time, and subtract unpaid meal breaks:
                                </p>
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                    {"$\\text{Net Working Hours} = \\frac{(\\text{End Time Minutes} - \\text{Start Time Minutes}) - \\text{Break Minutes}}{60}$"}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Overtime Tier Classification</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {"Allocate total hours into Regular ($H_{\\text{reg}}$), Overtime ($H_{\\text{ot}}$), and Double Time ($H_{\\text{dt}}$) based on the selected legal framework."}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Gross Payroll Summation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Multiply each hour tier by its respective rate multiplier:
                                </p>
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                    {"$\\text{Gross Pay} = (H_{\\text{reg}} \\times R) + (H_{\\text{ot}} \\times R \\times 1.5) + (H_{\\text{dt}} \\times R \\times 2.0)$"}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Net Paycheck Estimation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {"Deduct estimated federal, state, and statutory payroll tax withholdings ($T_{\\%}$):"}
                                </p>
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                    {"$\\text{Net Pay} = \\text{Gross Pay} \\times \\left(1 - \\frac{T_{\\%}}{100}\\right)$"}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Best Practices for Employers & Small Businesses */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Payroll Auditing: Best Practices for Businesses & Contractors
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain pristine record-keeping, prevent wage disputes, and pass labor compliance audits, incorporate the following operational protocols into your weekly payroll pipeline:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" /> Exact Timestamp Logging
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Never round start or end times arbitrarily against employee favor. The US Department of Labor enforces the 7-minute rounding rule (rounding to the nearest 15-minute increment only if applied neutrally in both directions).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Coffee className="w-4 h-4 text-indigo-600" /> Meal vs. Rest Break Compliance
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Short rest breaks of 5 to 20 minutes must legally be paid as compensable working time. Only designated meal periods of 30 minutes or greater where employees are fully relieved of duties should be deducted.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Download className="w-4 h-4 text-indigo-600" /> Weekly CSV Archive Retention
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                FLSA guidelines mandate retaining employee payroll records for a minimum of 3 years and timesheets for 2 years. Exporting and backing up weekly CSV files ensures an organized, auditable paper trail.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-600" /> Clear Overtime Authorization
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                While employers may implement internal policies requiring pre-approval for overtime work, legally, all overtime hours actually worked by non-exempt staff must still be paid, regardless of whether prior authorization was granted.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                How is daily vs. weekly overtime calculated under Fair Labor Standards Act (FLSA) regulations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under federal US FLSA standards, non-exempt hourly employees receive overtime pay at 1.5 times their regular hourly rate for all hours worked over 40 hours during a designated 7-day workweek. Federal law does not require daily overtime pay after 8 hours; however, specific states like California, Nevada, Alaska, and Colorado enforce statutory daily overtime after 8 or 12 hours worked in a single day.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are California&apos;s specific daily overtime and double-time rules?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In California, non-exempt employees earn 1.5x regular pay for hours worked beyond 8 up to 12 in a single workday, and for the first 8 hours on the 7th consecutive day of work in a single workweek. Double time (2.0x regular pay) applies to all hours worked beyond 12 hours in a single workday and for all hours worked beyond 8 hours on the 7th consecutive day.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does unpaid lunch and meal break deduction work on a timesheet?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Bona fide meal breaks of 30 minutes or longer where the employee is completely relieved of all duty are legally non-compensable under FLSA guidelines. The calculator automatically subtracts entered lunch break minutes from the span between shift start and end times to calculate accurate compensable working hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I calculate overnight shifts that cross past midnight?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. If a shift begins in the evening (e.g., 20:00) and ends the following morning (e.g., 04:30), the calculator detects the overnight boundary and correctly totals the elapsed work hours without requiring manual day splitting.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the blended effective hourly rate calculated for overtime shifts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The effective hourly rate is computed by dividing total gross pay (regular pay + overtime pay + double-time pay) by the total cumulative hours worked. This metric provides employees and payroll managers with an accurate picture of the true average hourly wage earned across an entire pay period.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my timesheet and employee wage data stored on external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All calculations, wage totals, shift logs, and CSV exports are computed 100% locally within your web browser. No employee payroll data or hourly wages are transmitted or retained on any remote cloud database, ensuring total privacy.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}