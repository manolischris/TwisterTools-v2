"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Globe,
    Clock,
    Plus,
    Trash2,
    Copy,
    Check,
    Calendar,
    Share2,
    ArrowRightLeft,
    Sparkles,
    Search,
    Sliders,
    Sun,
    Moon,
    Info,
    HelpCircle,
    BookOpen,
    MapPin,
    Layers,
    Zap,
    CheckCircle2,
    ShieldCheck,
    BarChart3,
    RefreshCw,
    Compass,
    Cpu,
    FileSpreadsheet,
    Users,
    Briefcase,
    Eye,
    Maximize2
} from "lucide-react";

interface CityTimezone {
    id: string;
    cityName: string;
    country: string;
    ianaZone: string;
    flag: string;
}

const DEFAULT_CITIES: CityTimezone[] = [
    { id: "utc", cityName: "UTC / GMT", country: "Coordinated Universal Time", ianaZone: "UTC", flag: "🌐" },
    { id: "nyc", cityName: "New York", country: "United States (EDT/EST)", ianaZone: "America/New_York", flag: "🇺🇸" },
    { id: "lon", cityName: "London", country: "United Kingdom (BST/GMT)", ianaZone: "Europe/London", flag: "🇬🇧" },
    { id: "tok", cityName: "Tokyo", country: "Japan (JST)", ianaZone: "Asia/Tokyo", flag: "🇯🇵" },
    { id: "syd", cityName: "Sydney", country: "Australia (AEST/AEDT)", ianaZone: "Australia/Sydney", flag: "🇦🇺" },
];

const SEARCHABLE_TIMEZONES: CityTimezone[] = [
    ...DEFAULT_CITIES,
    { id: "lax", cityName: "Los Angeles", country: "United States (PDT/PST)", ianaZone: "America/Los_Angeles", flag: "🇺🇸" },
    { id: "chi", cityName: "Chicago", country: "United States (CDT/CST)", ianaZone: "America/Chicago", flag: "🇺🇸" },
    { id: "den", cityName: "Denver", country: "United States (MDT/MST)", ianaZone: "America/Denver", flag: "🇺🇸" },
    { id: "par", cityName: "Paris", country: "France (CEST/CET)", ianaZone: "Europe/Paris", flag: "🇫🇷" },
    { id: "ber", cityName: "Berlin", country: "Germany (CEST/CET)", ianaZone: "Europe/Berlin", flag: "🇩🇪" },
    { id: "dxb", cityName: "Dubai", country: "United Arab Emirates (GST)", ianaZone: "Asia/Dubai", flag: "🇦🇪" },
    { id: "sin", cityName: "Singapore", country: "Singapore (SGT)", ianaZone: "Asia/Singapore", flag: "🇸🇬" },
    { id: "hkg", cityName: "Hong Kong", country: "Hong Kong (HKT)", ianaZone: "Asia/Hong_Kong", flag: "🇭🇰" },
    { id: "bom", cityName: "Mumbai", country: "India (IST)", ianaZone: "Asia/Kolkata", flag: "🇮🇳" },
    { id: "sao", cityName: "São Paulo", country: "Brazil (BRT)", ianaZone: "America/Sao_Paulo", flag: "🇧🇷" },
    { id: "akl", cityName: "Auckland", country: "New Zealand (NZST/NZDT)", ianaZone: "Pacific/Auckland", flag: "🇳🇿" },
    { id: "cai", cityName: "Cairo", country: "Egypt (EEST/EET)", ianaZone: "Africa/Cairo", flag: "🇪🇬" },
    { id: "ath", cityName: "Athens", country: "Greece (EEST/EET)", ianaZone: "Europe/Athens", flag: "🇬🇷" },
];

// Pure SVG Analog Clock Component
function AnalogClock({ timestamp, ianaZone }: { timestamp: number; ianaZone: string }) {
    const dateObj = new Date(timestamp);

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: ianaZone,
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false,
        }).formatToParts(dateObj);

        parts.forEach((p) => {
            if (p.type === "hour") hours = parseInt(p.value, 10) % 12;
            if (p.type === "minute") minutes = parseInt(p.value, 10);
            if (p.type === "second") seconds = parseInt(p.value, 10);
        });
    } catch {
        hours = 0;
        minutes = 0;
        seconds = 0;
    }

    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
    const hourDeg = ((hours + minutes / 60) / 12) * 360;

    return (
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-indigo-600 bg-slate-900 shadow-sm flex items-center justify-center flex-shrink-0">
            {/* Clock Hand Vectors */}
            <div
                className="absolute w-0.5 h-3 bg-indigo-300 rounded-full origin-bottom"
                style={{
                    transform: `rotate(${hourDeg}deg)`,
                    bottom: "50%",
                }}
            />
            <div
                className="absolute w-0.5 h-4 bg-indigo-100 rounded-full origin-bottom"
                style={{
                    transform: `rotate(${minuteDeg}deg)`,
                    bottom: "50%",
                }}
            />
            <div
                className="absolute w-0.5 h-4.5 bg-rose-500 rounded-full origin-bottom"
                style={{
                    transform: `rotate(${secondDeg}deg)`,
                    bottom: "50%",
                }}
            />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-white z-10" />
        </div>
    );
}

export default function TimezoneConverter() {
    const [selectedCities, setSelectedCities] = useState<CityTimezone[]>(DEFAULT_CITIES);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLiveMode, setIsLiveMode] = useState(true);
    const [clockDisplayMode, setClockDisplayMode] = useState<"digital" | "analog">("digital");

    const [isMounted, setIsMounted] = useState(false);

    // Auto-detected client browser timezone
    const [userLocalZone, setUserLocalZone] = useState<string>("UTC");

    const [customDate, setCustomDate] = useState("2026-08-09");
    const [customTime, setCustomTime] = useState("12:00");
    const [copied, setCopied] = useState(false);
    const [nowDate, setNowDate] = useState<Date | null>(null);

    useEffect(() => {
        setIsMounted(true);
        try {
            const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (detected) setUserLocalZone(detected);
        } catch {
            setUserLocalZone("UTC");
        }

        const now = new Date();
        setCustomDate(now.toISOString().slice(0, 10));
        setCustomTime(now.toTimeString().slice(0, 5));
        setNowDate(now);

        const timer = setInterval(() => {
            setNowDate(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const baseTimestamp = useMemo(() => {
        if (isLiveMode || !nowDate) {
            return nowDate ? nowDate.getTime() : 1767225600000;
        }
        const combined = new Date(`${customDate}T${customTime}:00`);
        return isNaN(combined.getTime()) ? 1767225600000 : combined.getTime();
    }, [isLiveMode, customDate, customTime, nowDate]);

    const localTimeData = useMemo(() => {
        if (!isMounted) {
            return { timeStr: "--:--:--", dateStr: "--" };
        }
        try {
            const dateObj = new Date(baseTimestamp);
            const timeStr = new Intl.DateTimeFormat("en-US", {
                timeZone: userLocalZone,
                hour: "2-digit",
                minute: "2-digit",
                second: isLiveMode ? "2-digit" : undefined,
                hour12: true,
            }).format(dateObj);

            const dateStr = new Intl.DateTimeFormat("en-US", {
                timeZone: userLocalZone,
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            }).format(dateObj);

            return { timeStr, dateStr };
        } catch {
            return { timeStr: "--:--:--", dateStr: "--" };
        }
    }, [baseTimestamp, userLocalZone, isLiveMode, isMounted]);

    const addCity = (city: CityTimezone) => {
        if (!selectedCities.some((c) => c.id === city.id)) {
            setSelectedCities([...selectedCities, city]);
        }
        setSearchQuery("");
    };

    const removeCity = (id: string) => {
        if (selectedCities.length > 1) {
            setSelectedCities(selectedCities.filter((c) => c.id !== id));
        }
    };

    const filteredSearchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return SEARCHABLE_TIMEZONES.filter(
            (c) =>
                !selectedCities.some((sc) => sc.id === c.id) &&
                (c.cityName.toLowerCase().includes(q) ||
                    c.country.toLowerCase().includes(q) ||
                    c.ianaZone.toLowerCase().includes(q))
        );
    }, [searchQuery, selectedCities]);

    const getCityFormattedData = (ianaZone: string) => {
        if (!isMounted) {
            return { timeStr: "--:--:--", dateStr: "--", hour24: 12, isDaytime: true };
        }
        try {
            const dateObj = new Date(baseTimestamp);
            const timeFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: ianaZone,
                hour: "2-digit",
                minute: "2-digit",
                second: isLiveMode ? "2-digit" : undefined,
                hour12: true,
            });
            const dateFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: ianaZone,
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
            const hour24Formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: ianaZone,
                hour: "numeric",
                hour12: false,
            });

            const timeStr = timeFormatter.format(dateObj);
            const dateStr = dateFormatter.format(dateObj);
            const hour24 = parseInt(hour24Formatter.format(dateObj), 10);

            const isDaytime = hour24 >= 6 && hour24 < 18;

            return { timeStr, dateStr, hour24, isDaytime };
        } catch {
            return { timeStr: "Invalid Time", dateStr: "--", hour24: 12, isDaytime: true };
        }
    };

    const handleCopyMatrix = () => {
        const lines = selectedCities.map((city) => {
            const { timeStr, dateStr } = getCityFormattedData(city.ianaZone);
            return `${city.flag} ${city.cityName} (${city.ianaZone}): ${timeStr} - ${dateStr}`;
        });

        const output = `World Clock & Timezone Matrix Conversion:\nDetected Local Zone: ${userLocalZone}\nBase Target: ${isLiveMode ? "LIVE CURRENT TIME" : `${customDate} ${customTime}`}\n\n` + lines.join("\n");
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "World Clock & Timezone Converter Matrix",
        "url": "https://twistertools.com/tools/date-tools/timezone-converter",
        "description": "Convert live and target time across global time zones simultaneously with detected local clock, analog/digital displays, daylight tracking, and matrix export.",
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
                "name": "Is local time detection compliant with GDPR and privacy standards?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, completely. Local time detection is computed entirely client-side using native browser ECMAScript APIs (Intl.DateTimeFormat). No IP addresses, location data, or personal identifying information is transmitted to any server."
                }
            },
            {
                "@type": "Question",
                "name": "How does the World Clock Matrix handle Daylight Saving Time (DST)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine uses standard IANA time zone identifiers processed natively through JavaScript Intl.DateTimeFormat, which automatically accounts for historical and active Daylight Saving Time shifts across global jurisdictions."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert future or historical dates using this timezone matrix?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, toggle off Live Mode and specify any custom target date and time. The matrix calculates precise local times for all selected cities simultaneously."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Digital and Analog clock display modes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Digital mode provides numeric digital standard time readings, while Analog mode renders real-time vector SVG clock faces with hour, minute, and second hands for quick visual spatial alignment."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* HERO BANNER: DETECTED LOCAL SYSTEM CLOCK */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {clockDisplayMode === "analog" ? (
                        <AnalogClock timestamp={baseTimestamp} ianaZone={userLocalZone} />
                    ) : (
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                            <MapPin className="w-3.5 h-3.5" /> Detected Local System Clock
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                            {localTimeData.timeStr}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                            {localTimeData.dateStr} • Zone: <span className="text-indigo-300 font-mono">{userLocalZone}</span>
                        </div>
                    </div>
                </div>

                {/* Clock Display Mode Selector */}
                <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl w-full md:w-auto justify-center">
                    <button
                        onClick={() => setClockDisplayMode("digital")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${clockDisplayMode === "digital"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        Digital Clock
                    </button>
                    <button
                        onClick={() => setClockDisplayMode("analog")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${clockDisplayMode === "analog"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        Analog Clock
                    </button>
                </div>
            </div>

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Controls & Custom Inputs */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Target Schedule Controls
                            </h2>
                            <button
                                onClick={() => {
                                    setIsLiveMode(true);
                                    const now = new Date();
                                    setCustomDate(now.toISOString().slice(0, 10));
                                    setCustomTime(now.toTimeString().slice(0, 5));
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200"
                            >
                                <RefreshCw className="w-3 h-3" /> Reset
                            </button>
                        </div>

                        {/* Live Toggle Box */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                    Time Baseline Mode
                                </span>
                                <span className="text-xs text-indigo-600 font-semibold">
                                    {isLiveMode ? "Real-time clock" : "Manual timestamp"}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLiveMode(true)}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${isLiveMode ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                                        }`}
                                >
                                    Live System Time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLiveMode(false)}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${!isLiveMode ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200"
                                        }`}
                                >
                                    Set Custom Date/Time
                                </button>
                            </div>
                        </div>

                        {/* Custom Input Fields */}
                        {!isLiveMode && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Target Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Target Time
                                    </label>
                                    <input
                                        type="time"
                                        value={customTime}
                                        onChange={(e) => setCustomTime(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Add Timezone Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                <Search className="w-3.5 h-3.5 text-indigo-600" /> Add City / Timezone
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search city (e.g. London, Tokyo, Dubai)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>

                            {filteredSearchResults.length > 0 && (
                                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white shadow-lg">
                                    {filteredSearchResults.map((city) => (
                                        <button
                                            key={city.id}
                                            onClick={() => addCity(city)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 flex items-center justify-between transition"
                                        >
                                            <span className="font-semibold text-slate-800">
                                                {city.flag} {city.cityName} ({city.ianaZone})
                                            </span>
                                            <Plus className="w-3.5 h-3.5 text-indigo-600" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={handleCopyMatrix}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Matrix Copied to Clipboard" : "Export Matrix Text"}
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-time Matrix Cards */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 min-w-0 p-4 sm:p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Converted Timezone Matrix
                        </h2>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            {selectedCities.length} Cities
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {selectedCities.map((city) => {
                            const { timeStr, dateStr, isDaytime } = getCityFormattedData(city.ianaZone);
                            return (
                                <div
                                    key={city.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3 min-w-0"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {clockDisplayMode === "analog" ? (
                                            <AnalogClock timestamp={baseTimestamp} ianaZone={city.ianaZone} />
                                        ) : (
                                            <div className="text-2xl flex-shrink-0">{city.flag}</div>
                                        )}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm truncate">
                                                    {city.cityName}
                                                </span>
                                                {isDaytime ? (
                                                    <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                                ) : (
                                                    <Moon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate">{city.country}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                                        <div>
                                            <div className="text-base sm:text-lg font-black text-indigo-600 tracking-tight">
                                                {timeStr}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase">{dateStr}</div>
                                        </div>
                                        {selectedCities.length > 1 && (
                                            <button
                                                onClick={() => removeCity(city.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                                                title="Remove city"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Technical Engineering & IANA Database Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Cross-Timezone Conversion Engineering & Database Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting timestamps accurately across international borders requires evaluating Coordinated Universal Time (UTC) offsets alongside dynamic, jurisdiction-specific Daylight Saving Time (DST) definitions. Simple mathematical additions (e.g., adding +5 hours) are prone to error because political entities regularly modify DST start/end dates, introduce leap seconds, or transition across historical standard offsets.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This matrix relies on the standard <strong>IANA Time Zone Database</strong> (tzdb/zoneinfo) exposed directly through JavaScript's native <code>Intl.DateTimeFormat</code> API. Rather than relying on static offset values, every location key (such as <code>America/New_York</code> or <code>Europe/London</code>) points to a maintained historical and forward-looking ruleset.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Client-Side Execution & Privacy
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                All date parsing, local clock detection, and time conversions occur client-side in real time. Your detected system timezone and schedule choices remain inside your browser memory, ensuring full GDPR compliance without transmitting personal location data.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> Analog & Digital Rendering Engine
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Seamlessly toggle between digital timestamps and rendered SVG analog clock faces. Vector-rendered clock hands update dynamically based on converted local hour, minute, and second vectors.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Key Global Timezones & Offset Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Major Global Time Zones & UTC Offset Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Below is a reference guide detailing the primary business hub time zones, their IANA designations, standard abbreviations, and base offsets from UTC:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Location / Region</th>
                                    <th className="p-3">Abbr.</th>
                                    <th className="p-3">IANA Identification Zone</th>
                                    <th className="p-3">Standard Offset</th>
                                    <th className="p-3">DST Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Coordinated Universal Time</td>
                                    <td className="p-3">UTC / GMT</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">UTC</td>
                                    <td className="p-3">UTC+00:00</td>
                                    <td className="p-3 text-slate-500">None</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">New York / US Eastern</td>
                                    <td className="p-3">EST / EDT</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">America/New_York</td>
                                    <td className="p-3">UTC-05:00 / UTC-04:00</td>
                                    <td className="p-3 text-emerald-600 font-medium">Observed</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">London / United Kingdom</td>
                                    <td className="p-3">GMT / BST</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Europe/London</td>
                                    <td className="p-3">UTC+00:00 / UTC+01:00</td>
                                    <td className="p-3 text-emerald-600 font-medium">Observed</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tokyo / Japan</td>
                                    <td className="p-3">JST</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Asia/Tokyo</td>
                                    <td className="p-3">UTC+09:00</td>
                                    <td className="p-3 text-slate-500">None</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Sydney / Australia</td>
                                    <td className="p-3">AEST / AEDT</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Australia/Sydney</td>
                                    <td className="p-3">UTC+10:00 / UTC+11:00</td>
                                    <td className="p-3 text-emerald-600 font-medium">Observed (Southern)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Dubai / United Arab Emirates</td>
                                    <td className="p-3">GST</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Asia/Dubai</td>
                                    <td className="p-3">UTC+04:00</td>
                                    <td className="p-3 text-slate-500">None</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Mumbai / India</td>
                                    <td className="p-3">IST</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Asia/Kolkata</td>
                                    <td className="p-3">UTC+05:30</td>
                                    <td className="p-3 text-slate-500">None</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Practical Scheduling & Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Best Practices for Global Meeting & Distributed Team Coordination
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Managing teams across multiple continents requires strategic schedule alignment to prevent fatigue and ensure operational coverage:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-600" /> Identify Overlap Windows
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Utilize daytime indicators (Sun/Moon icons) and analog clock alignments to identify shared business hours between remote team members.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-indigo-600" /> Standardize on UTC Baselines
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When issuing calendar invites across global teams, always reference UTC alongside local regional times to avoid ambiguity.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <FileSpreadsheet className="w-4 h-4 text-indigo-600" /> Export Matrix Summaries
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Use the built-in <strong>Export Matrix Text</strong> feature to instantly copy standard plaintext schedules into Slack, Microsoft Teams, or email threads.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
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
                                Is local time detection compliant with GDPR and privacy standards?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, completely. Local time detection is computed entirely client-side using native browser ECMAScript APIs (<code>Intl.DateTimeFormat</code>). No IP addresses, location data, or personal identifying information is transmitted to any server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool handle Daylight Saving Time (DST)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The matrix relies on browser-native IANA time zone keys. This automatically applies seasonal daylight shifts for any selected location worldwide without manual offset math.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I schedule future global meetings with this matrix?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, simply disable Live Mode in the control panel, choose your target date and time, and review the converted time across all added locations simultaneously.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Digital and Analog clock display modes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Digital mode provides numeric digital standard time readings, while Analog mode renders real-time vector SVG clock faces with hour, minute, and second hands for quick visual spatial alignment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Footer Assurance Banner */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Precision & Compliance Note
                    </h3>
                    <p className="leading-relaxed">
                        Time zone calculations are computed client-side using JavaScript's native ECMAScript Internationalization API (Intl.DateTimeFormat) mapped against local system time zone database registries.
                    </p>
                </section>

            </div>
        </div>
    );
}