"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    Clock,
    RefreshCw,
    Copy,
    Check,
    Download,
    Shuffle,
    Sliders,
    Calendar,
    Globe,
    CheckSquare,
    Square,
    Trash2,
    ShieldCheck,
    BookOpen,
    HelpCircle,
    BarChart3,
    Sparkles,
    ArrowDownUp,
    ListFilter,
    Layers,
    Cpu
} from "lucide-react";

export type TimeFormat = "12h" | "24h" | "military" | "iso" | "epoch" | "minutes_from_midnight";
export type SortOrder = "none" | "asc" | "desc";
export type OutputDelimiter = "newline" | "comma" | "semicolon" | "json";

interface GeneratedTimeItem {
    id: string;
    totalSeconds: number;
    hours24: number;
    minutes: number;
    seconds: number;
    formatted: string;
    epochTimestamp?: number;
}

const COMMON_TIMEZONES = [
    { label: "Local Device Time", value: "local" },
    { label: "UTC (Coordinated Universal Time)", value: "UTC" },
    { label: "America/New_York (EST/EDT)", value: "America/New_York" },
    { label: "America/Chicago (CST/CDT)", value: "America/Chicago" },
    { label: "America/Denver (MST/MDT)", value: "America/Denver" },
    { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
    { label: "Europe/London (GMT/BST)", value: "Europe/London" },
    { label: "Europe/Paris (CET/CEST)", value: "Europe/Paris" },
    { label: "Europe/Athens (EET/EEST)", value: "Europe/Athens" },
    { label: "Asia/Dubai (GST)", value: "Asia/Dubai" },
    { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
    { label: "Asia/Tokyo (JST)", value: "Asia/Tokyo" },
    { label: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" }
];

const PRESETS = [
    { label: "Standard Business Hours (09:00 - 17:00)", start: "09:00", end: "17:00", step: 15 },
    { label: "Morning Shift (06:00 - 14:00)", start: "06:00", end: "14:00", step: 30 },
    { label: "Evening Shift (17:00 - 23:00)", start: "17:00", end: "23:00", step: 10 },
    { label: "Night Owl / Graveyard (22:00 - 06:00)", start: "22:00", end: "06:00", step: 60 },
    { label: "Full 24-Hour Range (00:00 - 23:59)", start: "00:00", end: "23:59", step: 1 }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number = 1,
    max: number = 1000
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(min);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

export default function RandomTimeGenerator() {
    // Configuration states
    const [count, setCount] = useState<number>(10);
    const [startTime, setStartTime] = useState<string>("09:00");
    const [endTime, setEndTime] = useState<string>("17:00");
    const [timeFormat, setTimeFormat] = useState<TimeFormat>("12h");
    const [includeSeconds, setIncludeSeconds] = useState<boolean>(true);
    const [stepMinutes, setStepMinutes] = useState<number>(1);
    const [uniqueOnly, setUniqueOnly] = useState<boolean>(true);
    const [sortOrder, setSortOrder] = useState<SortOrder>("none");
    const [selectedTimezone, setSelectedTimezone] = useState<string>("local");
    const [targetDate, setTargetDate] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().split("T")[0];
    });
    const [delimiter, setDelimiter] = useState<OutputDelimiter>("newline");

    // Output & Interaction states
    const [results, setResults] = useState<GeneratedTimeItem[]>([]);
    const [copied, setCopied] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Convert time string "HH:MM" to seconds from midnight
    const parseTimeToSeconds = (t: string): number => {
        const [h, m] = t.split(":").map(Number);
        return (h || 0) * 3600 + (m || 0) * 60;
    };

    // Cryptographic uniform random integer between min and max inclusive
    const getSecureRandomInt = (min: number, max: number): number => {
        const range = max - min + 1;
        if (range <= 0) return min;
        const maxUint32 = 0xffffffff;
        const bucketLimit = Math.floor(maxUint32 / range) * range;
        const array = new Uint32Array(1);

        let randVal: number;
        do {
            crypto.getRandomValues(array);
            randVal = array[0];
        } while (randVal >= bucketLimit);

        return min + (randVal % range);
    };

    // Format seconds into formatted string based on user options
    const formatTimeSlot = useCallback((totalSecs: number, dateStr: string, tz: string, fmt: TimeFormat, incSec: boolean): { formatted: string; epoch?: number } => {
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        const [y, mo, d] = dateStr.split("-").map(Number);
        const refDate = new Date(y, mo - 1, d, hours, mins, incSec ? secs : 0);
        const epoch = Math.floor(refDate.getTime() / 1000);

        if (fmt === "epoch") {
            return { formatted: epoch.toString(), epoch };
        }
        if (fmt === "minutes_from_midnight") {
            return { formatted: (hours * 60 + mins).toString(), epoch };
        }

        if (tz !== "local") {
            try {
                const tzOptions: Intl.DateTimeFormatOptions = {
                    timeZone: tz,
                    hour12: fmt === "12h",
                    hour: fmt === "military" ? "2-digit" : "numeric",
                    minute: "2-digit",
                    ...(incSec ? { second: "2-digit" } : {})
                };
                if (fmt === "iso") {
                    return { formatted: refDate.toISOString(), epoch };
                }
                const localized = new Intl.DateTimeFormat("en-US", tzOptions).format(refDate);
                return { formatted: localized, epoch };
            } catch {
                // Fallback to standard conversion if timezone invalid
            }
        }

        if (fmt === "iso") {
            return { formatted: refDate.toISOString(), epoch };
        }

        if (fmt === "military") {
            const hh = String(hours).padStart(2, "0");
            const mm = String(mins).padStart(2, "0");
            const ss = incSec ? String(secs).padStart(2, "0") : "";
            return { formatted: `${hh}${mm}${ss ? `:${ss}` : ""}`, epoch };
        }

        if (fmt === "24h") {
            const hh = String(hours).padStart(2, "0");
            const mm = String(mins).padStart(2, "0");
            const ss = incSec ? `:${String(secs).padStart(2, "0")}` : "";
            return { formatted: `${hh}:${mm}${ss}`, epoch };
        }

        // 12h format
        const period = hours >= 12 ? "PM" : "AM";
        const h12 = hours % 12 === 0 ? 12 : hours % 12;
        const mm = String(mins).padStart(2, "0");
        const ss = incSec ? `:${String(secs).padStart(2, "0")}` : "";
        return { formatted: `${h12}:${mm}${ss} ${period}`, epoch };
    }, []);

    // Generation Core Engine
    const generateTimes = useCallback(() => {
        let startSec = parseTimeToSeconds(startTime);
        let endSec = parseTimeToSeconds(endTime);

        let spansMidnight = false;
        let totalSpanSeconds = endSec - startSec;

        if (endSec < startSec) {
            spansMidnight = true;
            totalSpanSeconds = (86400 - startSec) + endSec;
        } else if (endSec === startSec) {
            totalSpanSeconds = 86400; // Whole day
        }

        const stepSec = Math.max(1, stepMinutes * 60);
        const discreteSlots = Math.floor(totalSpanSeconds / stepSec) + 1;

        const effectiveCount = uniqueOnly ? Math.min(count, discreteSlots) : count;
        const generatedPool: number[] = [];
        const chosenIndices = new Set<number>();

        if (uniqueOnly && discreteSlots <= effectiveCount * 2 && discreteSlots < 50000) {
            // Reservoir/Fisher-Yates style index sampling for high-density unique ranges
            const indices = Array.from({ length: discreteSlots }, (_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = getSecureRandomInt(0, i);
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            for (let i = 0; i < effectiveCount; i++) {
                chosenIndices.add(indices[i]);
            }
        } else {
            // Rejection sampling with safeguard
            let attempts = 0;
            const maxAttempts = effectiveCount * 25;
            while (generatedPool.length < effectiveCount && attempts < maxAttempts) {
                attempts++;
                const randomSlotIndex = getSecureRandomInt(0, discreteSlots - 1);
                if (uniqueOnly) {
                    if (chosenIndices.has(randomSlotIndex)) continue;
                    chosenIndices.add(randomSlotIndex);
                }
                generatedPool.push(randomSlotIndex);
            }
        }

        const rawIndices = uniqueOnly ? Array.from(chosenIndices) : generatedPool;

        let items: GeneratedTimeItem[] = rawIndices.map((slotIdx) => {
            const addedSec = slotIdx * stepSec;
            let actualSec = (startSec + addedSec) % 86400;
            if (!includeSeconds) {
                actualSec = Math.floor(actualSec / 60) * 60;
            } else if (stepMinutes === 1) {
                // Add natural random seconds within that minute if step is 1 min and includeSeconds is checked
                const secOffset = getSecureRandomInt(0, 59);
                actualSec = (Math.floor(actualSec / 60) * 60 + secOffset) % 86400;
            }

            const h24 = Math.floor(actualSec / 3600);
            const m = Math.floor((actualSec % 3600) / 60);
            const s = actualSec % 60;
            const { formatted, epoch } = formatTimeSlot(actualSec, targetDate, selectedTimezone, timeFormat, includeSeconds);

            return {
                id: `${actualSec}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)}`,
                totalSeconds: actualSec,
                hours24: h24,
                minutes: m,
                seconds: s,
                formatted,
                epochTimestamp: epoch
            };
        });

        // Sorting
        if (sortOrder === "asc") {
            items.sort((a, b) => a.totalSeconds - b.totalSeconds);
        } else if (sortOrder === "desc") {
            items.sort((a, b) => b.totalSeconds - a.totalSeconds);
        }

        setResults(items);
        setSelectedItems(new Set());
    }, [count, startTime, endTime, timeFormat, includeSeconds, stepMinutes, uniqueOnly, sortOrder, selectedTimezone, targetDate, formatTimeSlot]);

    // Initial load auto-generation
    React.useEffect(() => {
        generateTimes();
    }, [generateTimes]);

    // Summary statistics calculated on results
    const summaryStats = useMemo(() => {
        if (results.length === 0) return { meanSec: 0, earliestSec: 0, latestSec: 0, medianSec: 0 };
        const secondsArr = results.map((r) => r.totalSeconds).sort((a, b) => a - b);
        const sum = secondsArr.reduce((acc, curr) => acc + curr, 0);
        const meanSec = Math.round(sum / secondsArr.length);
        const earliestSec = secondsArr[0];
        const latestSec = secondsArr[secondsArr.length - 1];
        const mid = Math.floor(secondsArr.length / 2);
        const medianSec = secondsArr.length % 2 !== 0 ? secondsArr[mid] : Math.round((secondsArr[mid - 1] + secondsArr[mid]) / 2);

        const formatSecSimple = (sec: number) => {
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}${includeSeconds ? `:${String(s).padStart(2, "0")}` : ""}`;
        };

        return {
            mean: formatSecSimple(meanSec),
            earliest: formatSecSimple(earliestSec),
            latest: formatSecSimple(latestSec),
            median: formatSecSimple(medianSec)
        };
    }, [results, includeSeconds]);

    // Formatted export string based on chosen delimiter
    const exportString = useMemo(() => {
        const activeList = selectedItems.size > 0
            ? results.filter((r) => selectedItems.has(r.id)).map((r) => r.formatted)
            : results.map((r) => r.formatted);

        if (delimiter === "json") {
            return JSON.stringify(activeList, null, 2);
        }
        if (delimiter === "comma") {
            return activeList.join(", ");
        }
        if (delimiter === "semicolon") {
            return activeList.join("; ");
        }
        return activeList.join("\n");
    }, [results, selectedItems, delimiter]);

    const handleCopy = () => {
        navigator.clipboard.writeText(exportString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extension = delimiter === "json" ? "json" : "txt";
        const mimeType = delimiter === "json" ? "application/json" : "text/plain";
        const blob = new Blob([exportString], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `random_times_${Date.now()}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === results.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(results.map((r) => r.id)));
        }
    };

    const toggleItemSelection = (id: string) => {
        const next = new Set(selectedItems);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedItems(next);
    };

    const deleteSelected = () => {
        if (selectedItems.size === 0) return;
        setResults((prev) => prev.filter((item) => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Time & Hour Generator",
        "url": "https://twistertools.com/tools/random-tools/random-time-generator",
        "description": "Generate cryptographically secure random times, clock hours, and timestamps within customized intervals, specific timezones, 12-hour or 24-hour formats, and discrete step intervals.",
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
                "name": "How does this random time generator ensure authentic randomness?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This tool utilizes the browser native Web Crypto API (crypto.getRandomValues). Unlike Math.random(), which uses deterministic pseudo-random seed algorithms, Web Crypto pulls entropy directly from your operating system and hardware noise, preventing statistical clustering and predictable sampling."
                }
            },
            {
                "@type": "Question",
                "name": "Can I generate random times that span past midnight into the next day?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. If your Start Time is 22:00 and End Time is 06:00, the generation engine automatically treats the range as cross-midnight, sampling uniformly across the evening and subsequent morning hours."
                }
            },
            {
                "@type": "Question",
                "name": "How do step intervals affect the generated times?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Setting a step interval (e.g., 15 minutes) snaps all random generations to discrete clock intervals (like 09:00, 09:15, 09:30, 09:45). Setting the step to 1 minute enables natural single-minute or single-second granularity."
                }
            },
            {
                "@type": "Question",
                "name": "What export options are available for developers and data analysts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can export the generated timestamps formatted in standard 12-Hour AM/PM, 24-Hour digital, Military, ISO 8601 strings, UNIX epoch seconds, or minutes from midnight. Output can be copied or downloaded as line-by-line TXT, CSV, semicolon-delimited, or clean JSON arrays."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            {/* SEO Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Workspace 50/50 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Generation Parameters
                            </h2>
                            <button
                                onClick={generateTimes}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                            </button>
                        </div>

                        {/* Presets Row */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Quick Range Presets
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESETS.map((preset) => {
                                    const isActive = startTime === preset.start && endTime === preset.end && stepMinutes === preset.step;
                                    return (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                setStartTime(preset.start);
                                                setEndTime(preset.end);
                                                setStepMinutes(preset.step);
                                            }}
                                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {preset.label.split(" (")[0]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Start & End Time Limits */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    Start Boundary (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    End Boundary (HH:MM)
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                />
                            </div>
                        </div>

                        {/* Quantity and Step Interval */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Total Items to Generate
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={count === 0 ? "" : count}
                                    onChange={(e) => handleNumberInput(e, setCount, 1, 500)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    placeholder="e.g. 10"
                                />
                                <span className="text-[11px] text-slate-500">Max 500 records per run</span>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Step Precision Interval
                                </label>
                                <select
                                    value={stepMinutes}
                                    onChange={(e) => setStepMinutes(Number(e.target.value))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                >
                                    <option value={1}>Continuous (1 Minute)</option>
                                    <option value={5}>Every 5 Minutes (:00, :05, :10...)</option>
                                    <option value={10}>Every 10 Minutes</option>
                                    <option value={15}>Quarter Hour (:00, :15, :30, :45)</option>
                                    <option value={30}>Half Hour (:00, :30)</option>
                                    <option value={60}>Top of the Hour Only (:00)</option>
                                </select>
                                <span className="text-[11px] text-slate-500">Discrete time quantization</span>
                            </div>
                        </div>

                        {/* Display Format & Timezone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Output Format
                                </label>
                                <select
                                    value={timeFormat}
                                    onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                >
                                    <option value="12h">12-Hour (02:30 PM)</option>
                                    <option value="24h">24-Hour Digital (14:30)</option>
                                    <option value="military">Military (1430 Hours)</option>
                                    <option value="iso">Full ISO 8601 Timestamp</option>
                                    <option value="epoch">UNIX Epoch Seconds</option>
                                    <option value="minutes_from_midnight">Minutes from Midnight</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5 text-indigo-600" /> Timezone Context
                                </label>
                                <select
                                    value={selectedTimezone}
                                    onChange={(e) => setSelectedTimezone(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white truncate"
                                >
                                    {COMMON_TIMEZONES.map((tz) => (
                                        <option key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reference Date & Sorting */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Reference Calendar Date
                                </label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <ArrowDownUp className="w-3.5 h-3.5 text-indigo-600" /> Sort Order
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                >
                                    <option value="none">Pure Random Order (Unsorted)</option>
                                    <option value="asc">Chronological (Earliest to Latest)</option>
                                    <option value="desc">Reverse Chronological (Latest to Earliest)</option>
                                </select>
                            </div>
                        </div>

                        {/* Checkbox Toggles */}
                        <div className="pt-2 flex flex-col sm:flex-row gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                <input
                                    type="checkbox"
                                    checked={includeSeconds}
                                    onChange={(e) => setIncludeSeconds(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                Include Seconds (:SS)
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                                <input
                                    type="checkbox"
                                    checked={uniqueOnly}
                                    onChange={(e) => setUniqueOnly(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                Enforce Unique Values (No Duplicates)
                            </label>
                        </div>
                    </div>

                    {/* Action Execution Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={generateTimes}
                            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Shuffle className="w-5 h-5" />
                            Generate Random Times
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output, Results & Batch Actions */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ListFilter className="w-5 h-5 text-indigo-600" />
                                Generated Results ({results.length})
                            </h2>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={toggleSelectAll}
                                    className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1"
                                >
                                    {selectedItems.size === results.length && results.length > 0 ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                                    ) : (
                                        <Square className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                    Select All
                                </button>
                                {selectedItems.size > 0 && (
                                    <button
                                        onClick={deleteSelected}
                                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete ({selectedItems.size})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Summary Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Earliest</span>
                                <span className="text-xs font-extrabold text-slate-800 font-mono">{summaryStats.earliest || "--:--"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Latest</span>
                                <span className="text-xs font-extrabold text-slate-800 font-mono">{summaryStats.latest || "--:--"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Mean Time</span>
                                <span className="text-xs font-extrabold text-indigo-600 font-mono">{summaryStats.mean || "--:--"}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Median</span>
                                <span className="text-xs font-extrabold text-slate-800 font-mono">{summaryStats.median || "--:--"}</span>
                            </div>
                        </div>

                        {/* Interactive Generated Times Display Box */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 p-1">
                                {results.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                        No time entries generated. Adjust parameters and click Generate.
                                    </div>
                                ) : (
                                    results.map((item, index) => {
                                        const isChecked = selectedItems.has(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleItemSelection(item.id)}
                                                className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition select-none ${isChecked
                                                    ? "bg-indigo-50/80 border border-indigo-200"
                                                    : "hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-slate-400 font-mono text-[11px] w-6">
                                                        #{index + 1}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${item.hours24 < 12 ? "bg-amber-400" : "bg-indigo-500"}`} />
                                                        <span className="font-mono font-bold text-slate-900 text-sm">
                                                            {item.formatted}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                                                    <span className="hidden sm:inline-block font-mono">
                                                        {item.totalSeconds}s from 00:00
                                                    </span>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        readOnly
                                                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 pointer-events-none"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Export Delimiter Configuration */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700">Delimiter Syntax:</span>
                            <div className="flex gap-1">
                                {(["newline", "comma", "semicolon", "json"] as OutputDelimiter[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setDelimiter(mode)}
                                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer capitalize ${delimiter === mode
                                            ? "bg-white text-indigo-600 shadow-xs border border-slate-200 font-bold"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {mode === "newline" ? "New Lines" : mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={handleCopy}
                            disabled={results.length === 0}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : selectedItems.size > 0 ? `Copy Selected (${selectedItems.size})` : "Copy All Results"}
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={results.length === 0}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Download ({delimiter.toUpperCase()})
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Technical & Mathematical Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Cryptographic Entropy & Uniform Distribution
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Generating an authentic random moment within a designated diurnal span requires mapping a continuous or discrete temporal interval {"$[T_{\\text{start}}, T_{\\text{end}}]$"} onto a uniform probability distribution. Standard software generators rely on algorithmic pseudo-random number generators (PRNGs) like the Linear Congruential Generator (LCG) or Mersenne Twister. While computationally inexpensive, pseudo-random generators seeded by standard epoch timestamps frequently exhibit phase spaces and periodic clustering flaws that render them unsuitable for scientific simulations or synthetic security data generation.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Cryptographic Web API Sampling
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Our generator relies directly on the browser-native Web Cryptography interface:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                window.crypto.getRandomValues(new Uint32Array(1))
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                This captures true platform-level entropy derived from hardware driver interrupt timings, thermal fluctuations, and microkernel execution jitter, guaranteeing unpredictable random sequences.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Modulo Bias Elimination
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Standard implementations that compute raw random integers via simplistic modulo math <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">rand % range</code> inadvertently favor lower interval numbers because {"$2^{32}$"} is rarely evenly divisible by the desired slot span. This utility utilizes <strong>rejection sampling</strong> to discard results falling into incomplete fractional ranges, preserving a perfectly uniform probability density function (PDF).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Enterprise Use Cases */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Enterprise Applications & Industry Workflows
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Deterministic schedules introduce security vulnerabilities and artificial sampling distortions. High-frequency random temporal modeling is critical across diverse enterprise disciplines:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Database Seeding & QA Testing</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Software engineers use random times to populate realistic audit trails, transaction records, server telemetry logs, and customer access events across relational databases without repetitive timestamps.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Workplace Shift Simulations</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Operations managers model complex retail traffic, healthcare patient check-in queues, and call center load distribution curves across 8-hour or 12-hour rotating roster shifts.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Statistical Monte Carlo Audits</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Auditors select unannounced inspection moments throughout working hours, mitigating predictive employee behavior and ensuring strict compliance with safety regulations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Formats & Compatibility Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Output Format Reference & International Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Depending on your programming stack or operational requirements, timestamps must conform to distinct lexical and machine-readable conventions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Standard Format</th>
                                    <th className="p-3">Sample Output</th>
                                    <th className="p-3">Primary Standard</th>
                                    <th className="p-3">Ideal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">12-Hour AM/PM</td>
                                    <td className="p-3 font-mono text-indigo-600">03:45:12 PM</td>
                                    <td className="p-3">North American Standard</td>
                                    <td className="p-3">Public-facing schedules, appointment booking UI</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">24-Hour Digital</td>
                                    <td className="p-3 font-mono text-indigo-600">15:45:12</td>
                                    <td className="p-3">ISO 8601 Time Part</td>
                                    <td className="p-3">European business, transport, and flight timetables</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Military Time</td>
                                    <td className="p-3 font-mono text-indigo-600">1545:12</td>
                                    <td className="p-3">NATO / Military Telecommunications</td>
                                    <td className="p-3">Emergency services, aviation dispatch, military logs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Full ISO 8601</td>
                                    <td className="p-3 font-mono text-indigo-600">2026-09-02T15:45:12.000Z</td>
                                    <td className="p-3">RFC 3339 / ISO 8601</td>
                                    <td className="p-3">REST APIs, JSON payloads, microservice synchronization</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">UNIX Epoch Seconds</td>
                                    <td className="p-3 font-mono text-indigo-600">1788363912</td>
                                    <td className="p-3">POSIX Standard</td>
                                    <td className="p-3">High-speed numeric database indexing and timestamp math</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this random time generator ensure authentic randomness?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This tool utilizes the browser native Web Crypto API (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">crypto.getRandomValues</code>). Unlike <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code>, which uses deterministic pseudo-random seed algorithms, Web Crypto pulls entropy directly from your operating system and hardware noise, preventing statistical clustering and predictable sampling.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I generate random times that span past midnight into the next day?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. If your Start Time is 22:00 and End Time is 06:00, the generation engine automatically treats the range as cross-midnight, sampling uniformly across the evening and subsequent morning hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do step intervals affect the generated times?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Setting a step interval (e.g., 15 minutes) snaps all random generations to discrete clock intervals (like 09:00, 09:15, 09:30, 09:45). Setting the step to 1 minute enables natural single-minute or single-second granularity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What export options are available for developers and data analysts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can export the generated timestamps formatted in standard 12-Hour AM/PM, 24-Hour digital, Military, ISO 8601 strings, UNIX epoch seconds, or minutes from midnight. Output can be copied or downloaded as line-by-line TXT, CSV, semicolon-delimited, or clean JSON arrays.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}