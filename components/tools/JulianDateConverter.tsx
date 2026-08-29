"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Calendar,
    Clock,
    Sun,
    Sparkles,
    Copy,
    Check,
    RotateCcw,
    Layers,
    Compass,
    BookOpen,
    HelpCircle,
    Info,
    ArrowRightLeft,
    Globe,
    Scale,
    Binary,
    Activity,
    Milestone
} from "lucide-react";

// Day of week strings
const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
];

// Astronomical Epoch Presets
interface AstronomicalPreset {
    name: string;
    description: string;
    jd: number;
    utcDate: string;
}

const EPOCH_PRESETS: AstronomicalPreset[] = [
    {
        name: "Standard J2000.0 Epoch",
        description: "Primary celestial reference epoch for star charts & solar ephemerides (Jan 1, 2000, 12:00 TT)",
        jd: 2451545.0,
        utcDate: "2000-01-01 12:00:00"
    },
    {
        name: "Standard B1950.0 Epoch",
        description: "Historic Besselian epoch used across 20th-century star catalogs (Dec 31, 1949, 22:09:15 UTC)",
        jd: 2433282.423,
        utcDate: "1949-12-31 22:09:15"
    },
    {
        name: "Unix Time Origin Epoch",
        description: "POSIX computing baseline standard (Jan 1, 1970, 00:00:00 UTC)",
        jd: 2440587.5,
        utcDate: "1970-01-01 00:00:00"
    },
    {
        name: "GPS Time Origin",
        description: "Satellite GPS constellation reference epoch (Jan 6, 1980, 00:00:00 UTC)",
        jd: 2444244.5,
        utcDate: "1980-01-06 00:00:00"
    },
    {
        name: "Apollo 11 Lunar Touchdown",
        description: "Historic Eagle LM lunar surface landing (July 20, 1969, 20:17:40 UTC)",
        jd: 2440423.3456,
        utcDate: "1969-07-20 20:17:40"
    },
    {
        name: "Julian Day Zero (JD 0.0)",
        description: "Theoretical origin of continuous Julian day numbering (Jan 1, 4713 BC, 12:00 UTC)",
        jd: 0.0,
        utcDate: "-4713-01-01 12:00:00"
    }
];

// Calculation Helpers
const julianDayFromCalendar = (
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    second: number
): number => {
    let y = year;
    let m = month;

    if (m <= 2) {
        y -= 1;
        m += 12;
    }

    const isGregorian =
        year > 1582 ||
        (year === 1582 && month > 10) ||
        (year === 1582 && month === 10 && day >= 15);

    let b = 0;
    if (isGregorian) {
        const a = Math.floor(y / 100);
        b = 2 - a + Math.floor(a / 4);
    }

    const dayFraction = (hour + minute / 60 + second / 3600) / 24;
    const jd =
        Math.floor(365.25 * (y + 4716)) +
        Math.floor(30.6001 * (m + 1)) +
        day +
        dayFraction +
        b -
        1524.5;

    return jd;
};

const calendarFromJulianDay = (
    jd: number
): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    isoString: string;
} => {
    const jdAdjusted = jd + 0.5;
    const z = Math.floor(jdAdjusted);
    const f = jdAdjusted - z;

    let a = z;
    if (z >= 2299161) {
        const alpha = Math.floor((z - 1867216.25) / 36524.25);
        a = z + 1 + alpha - Math.floor(alpha / 4);
    }

    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);

    const dayDecimal = b - d - Math.floor(30.6001 * e) + f;
    const day = Math.floor(dayDecimal);

    let month = e < 14 ? e - 1 : e - 13;
    let year = month > 2 ? c - 4716 : c - 4715;

    const timeFraction = dayDecimal - day;
    const totalSeconds = Math.round(timeFraction * 86400);

    let hour = Math.floor(totalSeconds / 3600);
    let minute = Math.floor((totalSeconds % 3600) / 60);
    let second = totalSeconds % 60;

    if (second >= 60) {
        second = 0;
        minute += 1;
    }
    if (minute >= 60) {
        minute = 0;
        hour += 1;
    }
    if (hour >= 24) {
        hour = 0;
    }

    const yStr = year < 0 ? `-${String(Math.abs(year)).padStart(4, "0")}` : String(year).padStart(4, "0");
    const mStr = String(month).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const hStr = String(hour).padStart(2, "0");
    const minStr = String(minute).padStart(2, "0");
    const sStr = String(second).padStart(2, "0");

    return {
        year,
        month,
        day,
        hour,
        minute,
        second,
        isoString: `${yStr}-${mStr}-${dStr}T${hStr}:${minStr}:${sStr}Z`
    };
};

const calculateGMST = (jd: number): string => {
    const t = (jd - 2451545.0) / 36525.0;
    let gmstSeconds =
        24110.54841 +
        8640184.812866 * t +
        0.093104 * Math.pow(t, 2) -
        0.0000062 * Math.pow(t, 3);

    gmstSeconds = ((gmstSeconds % 86400) + 86400) % 86400;

    const hours = Math.floor(gmstSeconds / 3600);
    const minutes = Math.floor((gmstSeconds % 3600) / 60);
    const seconds = Math.floor(gmstSeconds % 60);

    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
};

export default function JulianDateConverter() {
    // Mode selection: 'calendarToJulian' | 'julianToCalendar'
    const [conversionMode, setConversionMode] = useState<"calendarToJulian" | "julianToCalendar">("calendarToJulian");

    // Calendar Date inputs
    const [inputDate, setInputDate] = useState<string>("2026-08-29");
    const [inputTime, setInputTime] = useState<string>("12:00:00");
    const [inputTimezoneOffset, setInputTimezoneOffset] = useState<number>(0);

    // Julian Number inputs
    const [inputJd, setInputJd] = useState<string>("2461282.0");

    // Copy alert toast state
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Set Initial Current Date
    useEffect(() => {
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, "0");
        const d = String(now.getUTCDate()).padStart(2, "0");
        const h = String(now.getUTCHours()).padStart(2, "0");
        const min = String(now.getUTCMinutes()).padStart(2, "0");
        const sec = String(now.getUTCSeconds()).padStart(2, "0");

        setInputDate(`${y}-${m}-${d}`);
        setInputTime(`${h}:${min}:${sec}`);
    }, []);

    // Primary Computed Core: JD Value
    const activeJulianDay = useMemo(() => {
        if (conversionMode === "calendarToJulian") {
            const [yStr, mStr, dStr] = inputDate.split("-");
            const [hStr, minStr, sStr] = inputTime.split(":");

            const year = parseInt(yStr || "2000", 10);
            const month = parseInt(mStr || "1", 10);
            const day = parseInt(dStr || "1", 10);
            let hour = parseInt(hStr || "0", 10);
            const minute = parseInt(minStr || "0", 10);
            const second = parseInt(sStr || "0", 10);

            // Apply timezone offset to convert local time back to UTC
            hour -= inputTimezoneOffset;

            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                return 2451545.0;
            }

            return julianDayFromCalendar(year, month, day, hour, minute, second);
        } else {
            const parsed = parseFloat(inputJd);
            return isNaN(parsed) ? 2451545.0 : parsed;
        }
    }, [conversionMode, inputDate, inputTime, inputTimezoneOffset, inputJd]);

    // Derived Astronomical Epoch Values
    const astronomicalCalculations = useMemo(() => {
        const jd = activeJulianDay;
        const mjd = jd - 2400000.5;
        const rjd = jd - 2400000.0;
        const tjd = (jd - 2440000.5) % 10000;
        const cjd = Math.floor(jd + 0.5);
        const unixTimestamp = (jd - 2440587.5) * 86400;
        const julianCenturyJ2000 = (jd - 2451545.0) / 36525.0;
        const julianEpochYear = 2000.0 + (jd - 2451545.0) / 365.25;
        const besselianEpochYear = 1900.0 + (jd - 2415020.31352) / 365.242198781;
        const dayOfWeekIndex = Math.floor(jd + 0.5) % 7;
        const dayOfWeek = DAYS_OF_WEEK[dayOfWeekIndex];
        const calendarResult = calendarFromJulianDay(jd);
        const gmst = calculateGMST(jd);

        return {
            jd: jd.toFixed(6),
            mjd: mjd.toFixed(6),
            rjd: rjd.toFixed(6),
            tjd: tjd.toFixed(6),
            cjd: cjd.toString(),
            unixTimestamp: Math.round(unixTimestamp).toString(),
            julianCenturyJ2000: julianCenturyJ2000.toFixed(8),
            julianEpochYear: julianEpochYear.toFixed(4),
            besselianEpochYear: besselianEpochYear.toFixed(4),
            dayOfWeek,
            calendarResult,
            gmst
        };
    }, [activeJulianDay]);

    // Set to Current UTC Time
    const handleSetToCurrentUTC = () => {
        const now = new Date();
        const y = now.getUTCFullYear();
        const m = String(now.getUTCMonth() + 1).padStart(2, "0");
        const d = String(now.getUTCDate()).padStart(2, "0");
        const h = String(now.getUTCHours()).padStart(2, "0");
        const min = String(now.getUTCMinutes()).padStart(2, "0");
        const sec = String(now.getUTCSeconds()).padStart(2, "0");

        setConversionMode("calendarToJulian");
        setInputDate(`${y}-${m}-${d}`);
        setInputTime(`${h}:${min}:${sec}`);
        setInputTimezoneOffset(0);
    };

    // Apply Preset Handler
    const handleApplyPreset = (preset: AstronomicalPreset) => {
        if (conversionMode === "calendarToJulian") {
            const cal = calendarFromJulianDay(preset.jd);
            const mStr = String(cal.month).padStart(2, "0");
            const dStr = String(cal.day).padStart(2, "0");
            const yStr = cal.year < 0 ? `-${String(Math.abs(cal.year)).padStart(4, "0")}` : String(cal.year).padStart(4, "0");
            const hStr = String(cal.hour).padStart(2, "0");
            const minStr = String(cal.minute).padStart(2, "0");
            const sStr = String(cal.second).padStart(2, "0");

            setInputDate(`${yStr}-${mStr}-${dStr}`);
            setInputTime(`${hStr}:${minStr}:${sStr}`);
            setInputTimezoneOffset(0);
        } else {
            setInputJd(preset.jd.toString());
        }
    };

    // Copy to clipboard helper
    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Julian Day & Astronomical Modified Julian Date Converter",
        "url": "https://twistertools.com/tools/date-tools/julian-date-converter",
        "description": "Enterprise-grade Julian Day (JD), Modified Julian Date (MJD), and astronomical epoch converter with Greenwich Mean Sidereal Time (GMST) and UTC calculations.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What is a Julian Day Number (JD) and why is it used in astronomy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Julian Day (JD) is a continuous scientific count of days elapsed since Greenwich mean noon on January 1, 4713 BC (in the proleptic Julian calendar). Astronomers use Julian Day numbering because it eliminates the complications of irregular calendar month lengths, leap years, time zones, and daylight saving shifts when calculating planetary motions and variable star periods."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Julian Day (JD) and Modified Julian Date (MJD)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Modified Julian Date (MJD) was introduced by the Smithsonian Astrophysical Observatory in 1957. It simplifies calculations by subtracting 2,400,000.5 days from the standard Julian Day (MJD = JD - 2400000.5). This shifts the day start from noon (12:00 UTC) to standard civil midnight (00:00 UTC) and reduces large numerical values for contemporary dates."
                }
            },
            {
                "@type": "Question",
                "name": "Why does the astronomical Julian Day start at 12:00 (Noon) UTC instead of Midnight?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Historically, astronomical observations took place at night. Starting the Julian Day at Greenwich mean noon ensured that an astronomer's entire nighttime observation session fell under a single, continuous Julian Day number without incrementing dates halfway through the night."
                }
            },
            {
                "@type": "Question",
                "name": "What is the J2000.0 Epoch and why is it critical in celestial mechanics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "J2000.0 corresponds precisely to Julian Day 2451545.0, which was January 1, 2000, at 12:00:00 Terrestrial Time (TT). Because Earth's rotational axis slowly wobbles due to precession, star catalogs and planetary ephemerides require a standard fixed epoch reference coordinate system to specify celestial right ascension and declination."
                }
            },
            {
                "@type": "Question",
                "name": "How does Julian Day relate to Unix timestamp and GPS time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Julian Day has a linear relationship with Unix timestamps and GPS time. The Unix epoch (January 1, 1970, 00:00:00 UTC) corresponds exactly to Julian Day 2440587.5, meaning Unix Time = (JD - 2440587.5) * 86400. The GPS epoch (January 6, 1980) corresponds to Julian Day 2444244.5."
                }
            },
            {
                "@type": "Question",
                "name": "How does the converter handle the 1582 Gregorian Calendar transition?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This converter uses the standard astronomical Meeus algorithm. Dates on or after October 15, 1582, are calculated using the Gregorian solar calendar rules, while dates prior to October 15, 1582, are computed using the proleptic Julian calendar."
                }
            },
            {
                "@type": "Question",
                "name": "What is Greenwich Mean Sidereal Time (GMST)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Greenwich Mean Sidereal Time represents the hour angle of the vernal equinox at the Greenwich meridian. Unlike civil solar time based on the Sun's position, sidereal time measures Earth's rotation relative to distant fixed stars, making it essential for pointing optical telescopes."
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

                {/* Left Workspace Panel: Input Parameters & Epoch Selection */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Panel Header with Current UTC Action */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Date &amp; Time Input
                            </span>
                            <button
                                type="button"
                                onClick={handleSetToCurrentUTC}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                                title="Reset inputs to current UTC time"
                            >
                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Current UTC</span>
                            </button>
                        </div>

                        {/* Conversion Mode Switcher Tabs */}
                        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => setConversionMode("calendarToJulian")}
                                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${conversionMode === "calendarToJulian"
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                <span>Calendar &rarr; Julian Day</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setConversionMode("julianToCalendar")}
                                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${conversionMode === "julianToCalendar"
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Binary className="w-4 h-4 text-indigo-500" />
                                <span>Julian Day &rarr; Calendar</span>
                            </button>
                        </div>

                        {/* Mode 1: Calendar Date to Julian Day */}
                        {conversionMode === "calendarToJulian" ? (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                        Calendar Date (YYYY-MM-DD)
                                    </label>
                                    <input
                                        type="text"
                                        value={inputDate}
                                        onChange={(e) => setInputDate(e.target.value)}
                                        placeholder="2026-08-29 or -4713-01-01"
                                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-[11px] text-slate-500">Supports negative astronomical years (e.g. -4713 for 4713 BC).</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                            Time (HH:MM:SS)
                                        </label>
                                        <input
                                            type="text"
                                            value={inputTime}
                                            onChange={(e) => setInputTime(e.target.value)}
                                            placeholder="12:00:00"
                                            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5 text-indigo-500" />
                                            Timezone Offset (Hours)
                                        </label>
                                        <select
                                            value={inputTimezoneOffset}
                                            onChange={(e) => setInputTimezoneOffset(parseFloat(e.target.value))}
                                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={0}>UTC (GMT +0)</option>
                                            <option value={1}>UTC +1 (CET)</option>
                                            <option value={2}>UTC +2 (EET)</option>
                                            <option value={3}>UTC +3 (MSK)</option>
                                            <option value={5.5}>UTC +5:30 (IST)</option>
                                            <option value={8}>UTC +8 (CST / SGT)</option>
                                            <option value={9}>UTC +9 (JST / KST)</option>
                                            <option value={10}>UTC +10 (AEST)</option>
                                            <option value={-5}>UTC -5 (EST)</option>
                                            <option value={-6}>UTC -6 (CST)</option>
                                            <option value={-7}>UTC -7 (MST)</option>
                                            <option value={-8}>UTC -8 (PST)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Mode 2: Julian Day to Calendar */
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                        <Binary className="w-3.5 h-3.5 text-indigo-500" />
                                        Julian Day Number (JD)
                                    </label>
                                    <input
                                        type="text"
                                        value={inputJd}
                                        onChange={(e) => setInputJd(e.target.value)}
                                        placeholder="e.g. 2451545.0"
                                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
                                    />
                                    <span className="text-[11px] text-slate-500">Enter a decimal Julian Day (e.g., 2451545.0 for J2000.0).</span>
                                </div>
                            </div>
                        )}

                        {/* Standard Astronomical Epoch Presets */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Astronomical & Historical Reference Epochs
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {EPOCH_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-left transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">
                                                {preset.name}
                                            </span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 font-bold border border-slate-200">
                                                JD {preset.jd}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 line-clamp-1">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Quick Ergonomics Insight Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Calculation Model: Jean Meeus Astronomical Formula
                        </span>
                        <span className="font-semibold text-emerald-600">Continuous Precision</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Astronomical Conversions & Outputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Header Output Highlights */}
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Primary Astronomical Julian Day (JD)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(astronomicalCalculations.jd, "primary_jd")}
                                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-lg border border-indigo-200 shadow-xs"
                                >
                                    {copiedKey === "primary_jd" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedKey === "primary_jd" ? "Copied" : "Copy JD"}</span>
                                </button>
                            </div>
                            <div className="text-3xl sm:text-4xl font-black text-indigo-950 font-mono tracking-tight">
                                {astronomicalCalculations.jd}
                            </div>
                            <div className="text-xs text-indigo-800 font-medium flex items-center gap-2">
                                <span>Weekday: <strong>{astronomicalCalculations.dayOfWeek}</strong></span>
                                <span>&bull;</span>
                                <span>UTC: <strong>{astronomicalCalculations.calendarResult.isoString}</strong></span>
                            </div>
                        </div>

                        {/* Numerical Output Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                            {/* Modified Julian Date (MJD) */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Modified Julian Date (MJD)</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(astronomicalCalculations.mjd, "mjd")}
                                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                                        title="Copy MJD"
                                    >
                                        {copiedKey === "mjd" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="text-lg font-mono font-black text-slate-900">{astronomicalCalculations.mjd}</div>
                                <span className="text-[10px] text-slate-500 block">JD - 2400000.5 (Starts at 00:00 UTC)</span>
                            </div>

                            {/* Reduced Julian Date (RJD) */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reduced Julian Date (RJD)</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(astronomicalCalculations.rjd, "rjd")}
                                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                                        title="Copy RJD"
                                    >
                                        {copiedKey === "rjd" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="text-lg font-mono font-black text-slate-900">{astronomicalCalculations.rjd}</div>
                                <span className="text-[10px] text-slate-500 block">JD - 2400000.0 (Starts at 12:00 UTC)</span>
                            </div>

                            {/* Greenwich Mean Sidereal Time (GMST) */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sidereal Time (GMST)</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(astronomicalCalculations.gmst, "gmst")}
                                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                                        title="Copy GMST"
                                    >
                                        {copiedKey === "gmst" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="text-lg font-mono font-black text-indigo-600">{astronomicalCalculations.gmst}</div>
                                <span className="text-[10px] text-slate-500 block">Greenwich Mean Sidereal Angle</span>
                            </div>

                            {/* Unix POSIX Timestamp */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unix Epoch Timestamp</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(astronomicalCalculations.unixTimestamp, "unix")}
                                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                                        title="Copy Unix Timestamp"
                                    >
                                        {copiedKey === "unix" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="text-lg font-mono font-black text-slate-900">{astronomicalCalculations.unixTimestamp}</div>
                                <span className="text-[10px] text-slate-500 block">Seconds elapsed since 1970-01-01</span>
                            </div>

                            {/* Julian Century (T) relative to J2000.0 */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Julian Centuries (T)</span>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(astronomicalCalculations.julianCenturyJ2000, "t_century")}
                                        className="text-slate-400 hover:text-indigo-600 p-1 cursor-pointer"
                                        title="Copy Julian Centuries"
                                    >
                                        {copiedKey === "t_century" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="text-lg font-mono font-black text-slate-900">{astronomicalCalculations.julianCenturyJ2000}</div>
                                <span className="text-[10px] text-slate-500 block">Centuries of 36,525 days from J2000.0</span>
                            </div>

                            {/* Julian & Besselian Epoch Years */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 relative group">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Julian / Besselian Epoch</span>
                                </div>
                                <div className="text-sm font-mono font-bold text-slate-900">
                                    J{astronomicalCalculations.julianEpochYear} &bull; B{astronomicalCalculations.besselianEpochYear}
                                </div>
                                <span className="text-[10px] text-slate-500 block">Astronomical Coordinate Reference Years</span>
                            </div>

                        </div>

                    </div>

                    {/* Copy All Data Summary Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => {
                                const summary = `Astronomical Julian Day Conversion Summary:
--------------------------------------------------
Julian Day (JD): ${astronomicalCalculations.jd}
Modified Julian Date (MJD): ${astronomicalCalculations.mjd}
Reduced Julian Date (RJD): ${astronomicalCalculations.rjd}
Chronological JD (CJD): ${astronomicalCalculations.cjd}
Greenwich Sidereal Time (GMST): ${astronomicalCalculations.gmst}
UTC ISO-8601: ${astronomicalCalculations.calendarResult.isoString}
Day of the Week: ${astronomicalCalculations.dayOfWeek}
Unix Timestamp: ${astronomicalCalculations.unixTimestamp}
Julian Centuries (J2000): ${astronomicalCalculations.julianCenturyJ2000}
Julian Epoch: J${astronomicalCalculations.julianEpochYear}
Besselian Epoch: B${astronomicalCalculations.besselianEpochYear}
--------------------------------------------------
Generated by TwisterTools Julian Day Converter`;
                                handleCopy(summary, "full_summary");
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedKey === "full_summary" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedKey === "full_summary" ? "Complete Astronomical Dataset Copied!" : "Copy Full Astronomical Dataset"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: What is a Julian Day and Why is it Used */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            What is a Julian Day (JD)? Origins, Astronomical Principles, and Day-Count Logic
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Julian Day system is a continuous count of days and fractional days elapsed since a standardized scientific origin. Formulated in 1583 by the French classical scholar Joseph Justus Scaliger, the system was named in tribute to his father, Julius Caesar Scaliger, rather than the Julian Calendar introduced by Julius Caesar.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In standard civil calendars, calculating elapsed time across historical centuries is fraught with irregular month lengths (28, 29, 30, or 31 days), variable leap year intercalations, and the abrupt deletion of 10 to 11 days during national transitions from the Julian to the Gregorian calendar in 1582 and 1752. By assigning every single moment a continuous scalar decimal number, astronomers, astrophysicists, and satellite geodesists can calculate exact temporal intervals between celestial events through simple arithmetic subtraction.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Principle I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Greenwich Noon Origin</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Julian Day begins at 12:00:00 UTC (noon), ensuring entire nighttime telescope observation sessions fall within a single calendar day number.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Principle II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Scalar Decimal Continuity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Hours, minutes, and seconds are expressed as continuous base-10 day fractions (e.g., 6 hours = 0.25 days, 18 hours = 0.75 days).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Principle III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Scaliger Period Triad</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Origin date (Jan 1, 4713 BC) coincides with the simultaneous cycle alignment of the 28-year Solar Cycle, 19-year Metonic Cycle, and 15-year Indiction Cycle.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Julian Day System Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Julian Date Variants & Epoch Systems Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Over centuries of scientific computing, several specialized variants of the Julian Day number have emerged to streamline data processing across astrodynamics, satellite tracking, and variable star astronomy:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">System Name</th>
                                    <th className="p-3">Abbreviation</th>
                                    <th className="p-3">Mathematical Formula</th>
                                    <th className="p-3">Day Start Time</th>
                                    <th className="p-3">Primary Field of Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Julian Day</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">JD</td>
                                    <td className="p-3 font-mono text-slate-700">Standard Continuous Count</td>
                                    <td className="p-3 text-xs">12:00:00 UTC (Noon)</td>
                                    <td className="p-3 text-xs text-slate-600">Ephemeris astronomy, solar system dynamics, variable star photometry</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Modified Julian Date</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">MJD</td>
                                    <td className="p-3 font-mono text-slate-700">JD - 2,400,000.5</td>
                                    <td className="p-3 text-xs">00:00:00 UTC (Midnight)</td>
                                    <td className="p-3 text-xs text-slate-600">Spacecraft tracking, geodesy, GPS constellations, Smithsonian astrophysics</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Reduced Julian Date</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">RJD</td>
                                    <td className="p-3 font-mono text-slate-700">JD - 2,400,000.0</td>
                                    <td className="p-3 text-xs">12:00:00 UTC (Noon)</td>
                                    <td className="p-3 text-xs text-slate-600">Historical stellar brightness measurements, European astronomical archives</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Truncated Julian Day</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">TJD</td>
                                    <td className="p-3 font-mono text-slate-700">(JD - 2,440,000.5) mod 10000</td>
                                    <td className="p-3 text-xs">00:00:00 UTC (Midnight)</td>
                                    <td className="p-3 text-xs text-slate-600">NASA GSFC telemetry, high-energy astrophysics, Compton GRO mission</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Chronological Julian Date</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">CJD</td>
                                    <td className="p-3 font-mono text-slate-700">floor(JD + 0.5)</td>
                                    <td className="p-3 text-xs">00:00:00 UTC (Midnight)</td>
                                    <td className="p-3 text-xs text-slate-600">Civil calendar historical chronology and weekday alignment algorithms</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Mathematical Conversion Algorithms (Jean Meeus Method) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Conversion Algorithm (Jean Meeus Astronomical Formula)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To compute the exact Julian Day number from any year ($Y$), month ($M$), day ($D$), and decimal time hour ($UT$), modern astronomical software utilizes the validated algorithmic method authored by Belgian astronomer Jean Meeus:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Binary className="w-4 h-4 text-indigo-600" /> Month & Year Normalization
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                If month $M \leq 2$, January and February are treated as the 13th and 14th months of the preceding year:
                            </p>
                            <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-indigo-700">
                                Y = Y - 1, &nbsp; M = M + 12
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> Gregorian Leap Intercalation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                For Gregorian dates on or after October 15, 1582, correction coefficient $B$ is derived as:
                            </p>
                            <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-xs text-indigo-700">
                                A = floor(Y / 100), &nbsp; B = 2 - A + floor(A / 4)
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                            The Fundamental Julian Day Equation
                        </span>
                        <div className="font-mono text-sm sm:text-base text-amber-300 py-1">
                            JD = floor(365.25 &times; (Y + 4716)) + floor(30.6001 &times; (M + 1)) + D + DayFraction + B - 1524.5
                        </div>
                        <p className="text-xs text-slate-300">
                            Where <code>DayFraction = (Hours + Minutes/60 + Seconds/3600) / 24</code>.
                        </p>
                    </div>
                </section>

                {/* Card 4: Astronomical Epochs & Sidereal Time Science */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Astronomical Epochs, Axial Precession, and Sidereal Time
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Because planet Earth is not a perfect sphere, gravitational torques exerted by the Sun and Moon cause Earth&apos;s rotational axis to gyrate in a 25,772-year cycle known as <strong>axial precession</strong>. Consequently, celestial reference frames (Right Ascension and Declination) continuously drift relative to background stars.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Milestone className="w-4 h-4 text-indigo-600" /> The J2000.0 Fundamental Standard
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The International Astronomical Union (IAU) designated <strong>J2000.0</strong> (Julian Day 2451545.0 = January 1, 2000, at 12:00 TT) as the universal reference epoch. All modern sky surveys, Hubble coordinates, and James Webb Space Telescope targets are indexed against J2000.0.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> Greenwich Mean Sidereal Time (GMST)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                While standard civil clocks track the 24-hour solar day, astronomers measure time against distant stars (the 23 hour, 56 minute, 4.09 second sidereal day). Greenwich Mean Sidereal Time denotes the exact hour angle of the vernal equinox at the Greenwich meridian.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Practical Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Globe className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Engineering & Scientific Applications of Julian Dates
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Julian Day calculations underpin diverse contemporary technological systems beyond pure academic astrophysics:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Satellite Orbital Tracking</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">SGP4 / TLE</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Two-Line Element sets (TLEs) issued by NORAD and space agencies utilize fractional Julian Day epochs to propagate satellite orbits and predict orbital collision trajectories.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Historical Chronology</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Archaeology</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Historians determine exact solar eclipse alignments recorded in ancient Babylonian, Chinese, and Mayan manuscripts by mapping dates to continuous Julian numbers.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="font-bold text-slate-900 text-sm">Financial Time Series</h3>
                                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Quantitative</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                High-frequency algorithmic backtesting software converts calendar dates into decimal Julian continuous days to evaluate long-term macroeconomic trends without calendar bias.
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
                                What is a Julian Day Number (JD) and why is it used in astronomy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Julian Day (JD) is a continuous scientific count of days elapsed since Greenwich mean noon on January 1, 4713 BC (in the proleptic Julian calendar). Astronomers use Julian Day numbering because it eliminates the complications of irregular calendar month lengths, leap years, time zones, and daylight saving shifts when calculating planetary motions and variable star periods.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Julian Day (JD) and Modified Julian Date (MJD)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Modified Julian Date (MJD) was introduced by the Smithsonian Astrophysical Observatory in 1957. It simplifies calculations by subtracting 2,400,000.5 days from the standard Julian Day (MJD = JD - 2400000.5). This shifts the day start from noon (12:00 UTC) to standard civil midnight (00:00 UTC) and reduces large numerical values for contemporary dates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does the astronomical Julian Day start at 12:00 (Noon) UTC instead of Midnight?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Historically, astronomical observations took place at night. Starting the Julian Day at Greenwich mean noon ensured that an astronomer&apos;s entire nighttime observation session fell under a single, continuous Julian Day number without incrementing dates halfway through the night.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the J2000.0 Epoch and why is it critical in celestial mechanics?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                J2000.0 corresponds precisely to Julian Day 2451545.0, which was January 1, 2000, at 12:00:00 Terrestrial Time (TT). Because Earth&apos;s rotational axis slowly wobbles due to precession, star catalogs and planetary ephemerides require a standard fixed epoch reference coordinate system to specify celestial right ascension and declination.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Julian Day relate to Unix timestamp and GPS time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Julian Day has a linear relationship with Unix timestamps and GPS time. The Unix epoch (January 1, 1970, 00:00:00 UTC) corresponds exactly to Julian Day 2440587.5, meaning Unix Time = (JD - 2440587.5) &times; 86400. The GPS epoch (January 6, 1980) corresponds to Julian Day 2444244.5.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the converter handle the 1582 Gregorian Calendar transition?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This converter uses the standard astronomical Meeus algorithm. Dates on or after October 15, 1582, are calculated using the Gregorian solar calendar rules, while dates prior to October 15, 1582, are computed using the proleptic Julian calendar.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Greenwich Mean Sidereal Time (GMST)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Greenwich Mean Sidereal Time represents the hour angle of the vernal equinox at the Greenwich meridian. Unlike civil solar time based on the Sun&apos;s position, sidereal time measures Earth&apos;s rotation relative to distant fixed stars, making it essential for pointing optical telescopes.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}