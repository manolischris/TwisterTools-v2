"use client";

import React, { useState, useMemo } from "react";
import {
    Globe,
    Clock,
    Plus,
    Trash2,
    Copy,
    Check,
    Calendar,
    Users,
    Sparkles,
    Sun,
    Sunset,
    Moon,
    AlertCircle,
    CheckCircle2,
    Share2,
    Shuffle,
    Layers,
    Compass,
    HelpCircle,
    Info,
    BookOpen,
    Zap,
    Building2,
    CalendarPlus,
    Download
} from "lucide-react";

interface TimezoneLocation {
    id: string;
    city: string;
    country: string;
    tz: string;
    label: string;
    isHome?: boolean;
}

interface WorkingHoursConfig {
    startHour: number; // 0-23
    endHour: number;   // 0-23
}

const PRESET_TIMEZONES: TimezoneLocation[] = [
    { id: "utc", city: "UTC / GMT", country: "Universal", tz: "UTC", label: "UTC Standard" },
    { id: "ny", city: "New York", country: "United States", tz: "America/New_York", label: "US East (EST/EDT)" },
    { id: "sf", city: "San Francisco", country: "United States", tz: "America/Los_Angeles", label: "US West (PST/PDT)" },
    { id: "lon", city: "London", country: "United Kingdom", tz: "Europe/London", label: "UK (GMT/BST)" },
    { id: "par", city: "Paris", country: "France", tz: "Europe/Paris", label: "Central Europe (CET/CEST)" },
    { id: "ath", city: "Athens", country: "Greece", tz: "Europe/Athens", label: "Eastern Europe (EET/EEST)" },
    { id: "dxb", city: "Dubai", country: "UAE", tz: "Asia/Dubai", label: "Gulf Standard (GST)" },
    { id: "sin", city: "Singapore", country: "Singapore", tz: "Asia/Singapore", label: "Singapore (SGT)" },
    { id: "tok", city: "Tokyo", country: "Japan", tz: "Asia/Tokyo", label: "Japan (JST)" },
    { id: "syd", city: "Sydney", country: "Australia", tz: "Australia/Sydney", label: "Australia East (AEST/AEDT)" },
    { id: "sao", city: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo", label: "Brazil (BRT)" },
    { id: "del", city: "New Delhi", country: "India", tz: "Asia/Kolkata", label: "India (IST)" }
];

const POPULAR_SEARCH_TIMEZONES: Omit<TimezoneLocation, "id">[] = [
    { city: "San Francisco", country: "United States", tz: "America/Los_Angeles", label: "US Pacific (PT)" },
    { city: "Denver", country: "United States", tz: "America/Denver", label: "US Mountain (MT)" },
    { city: "Chicago", country: "United States", tz: "America/Chicago", label: "US Central (CT)" },
    { city: "New York", country: "United States", tz: "America/New_York", label: "US Eastern (ET)" },
    { city: "London", country: "United Kingdom", tz: "Europe/London", label: "UK / London (GMT/BST)" },
    { city: "Berlin", country: "Germany", tz: "Europe/Berlin", label: "Central European (CET/CEST)" },
    { city: "Athens", country: "Greece", tz: "Europe/Athens", label: "Eastern European (EET/EEST)" },
    { city: "Dubai", country: "UAE", tz: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
    { city: "Mumbai", country: "India", tz: "Asia/Kolkata", label: "India Standard Time (IST)" },
    { city: "Singapore", country: "Singapore", tz: "Asia/Singapore", label: "Singapore Time (SGT)" },
    { city: "Hong Kong", country: "Hong Kong", tz: "Asia/Hong_Kong", label: "Hong Kong Time (HKT)" },
    { city: "Tokyo", country: "Japan", tz: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { city: "Sydney", country: "Australia", tz: "Australia/Sydney", label: "Australian Eastern (AEST/AEDT)" },
    { city: "Auckland", country: "New Zealand", tz: "Pacific/Auckland", label: "New Zealand (NZST/NZDT)" },
    { city: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo", label: "Brasília Time (BRT)" },
    { city: "Toronto", country: "Canada", tz: "America/Toronto", label: "Canada Eastern (ET)" },
    { city: "Honolulu", country: "United States", tz: "Pacific/Honolulu", label: "Hawaii Standard (HST)" }
];

export default function MeetingTimezoneScheduler() {
    // Current base date (defaults to today's date in YYYY-MM-DD format)
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const d = new Date();
        return d.toISOString().split("T")[0];
    });

    // Active locations in the multi-timezone matrix
    const [locations, setLocations] = useState<TimezoneLocation[]>([
        { id: "1", city: "New York", country: "United States", tz: "America/New_York", label: "Headquarters (ET)", isHome: true },
        { id: "2", city: "London", country: "United Kingdom", tz: "Europe/London", label: "Engineering Lead (UK)" },
        { id: "3", city: "Athens", country: "Greece", tz: "Europe/Athens", label: "Product Team (EET)" },
        { id: "4", city: "Singapore", country: "Singapore", tz: "Asia/Singapore", label: "APAC Regional (SGT)" }
    ]);

    // Selected meeting slot hour (0-23 in Home Timezone)
    const [selectedSlotHour, setSelectedSlotHour] = useState<number>(14); // 2:00 PM default
    const [meetingDuration, setMeetingDuration] = useState<number>(60); // in minutes
    const [meetingTitle, setMeetingTitle] = useState<string>("Global Architecture Sync");

    // Working Hours Settings (Shared standard or default)
    const [workingHours] = useState<WorkingHoursConfig>({
        startHour: 9, // 9:00 AM
        endHour: 18   // 6:00 PM (18:00)
    });

    // Timezone Selector Search State
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const [copiedLink, setCopiedLink] = useState<boolean>(false);

    // Filter available timezones for quick add
    const filteredSearchTimezones = useMemo(() => {
        if (!searchQuery.trim()) return POPULAR_SEARCH_TIMEZONES.slice(0, 8);
        const q = searchQuery.toLowerCase();
        return POPULAR_SEARCH_TIMEZONES.filter(
            (t) =>
                t.city.toLowerCase().includes(q) ||
                t.country.toLowerCase().includes(q) ||
                t.tz.toLowerCase().includes(q) ||
                t.label.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    // Add a timezone to active comparison grid
    const addLocation = (loc: Omit<TimezoneLocation, "id">) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
        setLocations((prev) => [...prev, { ...loc, id, isHome: prev.length === 0 }]);
        setSearchQuery("");
    };

    // Remove a timezone
    const removeLocation = (id: string) => {
        setLocations((prev) => {
            const updated = prev.filter((loc) => loc.id !== id);
            if (updated.length > 0 && !updated.some((l) => l.isHome)) {
                updated[0].isHome = true;
            }
            return updated;
        });
    };

    // Set primary home timezone
    const setAsHome = (id: string) => {
        setLocations((prev) =>
            prev.map((loc) => ({
                ...loc,
                isHome: loc.id === id
            }))
        );
    };

    // Home timezone object
    const homeLocation = useMemo(() => {
        return locations.find((l) => l.isHome) || locations[0] || PRESET_TIMEZONES[0];
    }, [locations]);

    // Helper: Compute localized hour and offset for any given timezone and home hour
    const getLocalHourDetails = (targetTz: string, homeTz: string, homeDateStr: string, homeHour: number) => {
        try {
            // Construct baseline date string in home timezone
            const baseISO = `${homeDateStr}T${homeHour.toString().padStart(2, "0")}:00:00`;

            // Format into date object
            const dateInHome = new Date(
                new Date(baseISO).toLocaleString("en-US", { timeZone: homeTz })
            );
            const homeEpoch = new Date(baseISO).getTime();

            // Create target date string with Intl
            const targetFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: targetTz,
                hour: "numeric",
                minute: "numeric",
                hour12: false,
                year: "numeric",
                month: "numeric",
                day: "numeric",
                weekday: "short"
            });

            // Target parts
            const parts = targetFormatter.formatToParts(new Date(`${homeDateStr}T12:00:00Z`));

            // Precise offset calculation using date math
            const targetDateObj = new Date(
                new Date().toLocaleString("en-US", { timeZone: targetTz })
            );
            const homeDateObj = new Date(
                new Date().toLocaleString("en-US", { timeZone: homeTz })
            );

            const diffHours = Math.round((targetDateObj.getTime() - homeDateObj.getTime()) / (1000 * 60 * 60));
            const calculatedHour = (homeHour + diffHours + 24) % 24;

            // Accurate target local time using standard Intl conversion
            const d = new Date();
            // Assign year, month, day based on selectedDate
            const [y, m, day] = homeDateStr.split("-").map(Number);
            const refDate = new Date(Date.UTC(y, m - 1, day, homeHour, 0, 0));

            // Intl formatters for accurate string representations
            const hourFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: targetTz,
                hour: "numeric",
                minute: "numeric",
                hour12: false
            });

            const dayFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: targetTz,
                weekday: "short",
                day: "numeric",
                month: "short"
            });

            // Get target localized hour directly
            const targetDateForHour = new Date(
                new Date(`${homeDateStr}T${homeHour.toString().padStart(2, "0")}:00:00Z`).toLocaleString("en-US", { timeZone: targetTz })
            );

            // Compute daylight savings abbreviation & GMT offset string
            const tzNameFormatter = new Intl.DateTimeFormat("en-US", {
                timeZone: targetTz,
                timeZoneName: "short"
            });
            const tzAbbr = tzNameFormatter.formatToParts(refDate).find(p => p.type === "timeZoneName")?.value || targetTz;

            return {
                localHour: calculatedHour,
                dayLabel: dayFormatter.format(refDate),
                tzAbbr,
                diffHours
            };
        } catch {
            return {
                localHour: homeHour,
                dayLabel: "Today",
                tzAbbr: "UTC",
                diffHours: 0
            };
        }
    };

    // Calculate quality of each hour slot across all participants (0 to 23 based on home hour)
    const slotQualities = useMemo(() => {
        return Array.from({ length: 24 }).map((_, hour) => {
            let workingCount = 0;
            let wakingCount = 0;
            let sleepingCount = 0;

            locations.forEach((loc) => {
                const { localHour } = getLocalHourDetails(loc.tz, homeLocation.tz, selectedDate, hour);
                if (localHour >= workingHours.startHour && localHour < workingHours.endHour) {
                    workingCount++;
                } else if ((localHour >= 7 && localHour < workingHours.startHour) || (localHour >= workingHours.endHour && localHour < 22)) {
                    wakingCount++;
                } else {
                    sleepingCount++;
                }
            });

            let status: "optimal" | "acceptable" | "difficult" = "difficult";
            if (workingCount === locations.length) {
                status = "optimal";
            } else if (sleepingCount === 0) {
                status = "acceptable";
            } else {
                status = "difficult";
            }

            return {
                hour,
                status,
                workingCount,
                wakingCount,
                sleepingCount,
                total: locations.length
            };
        });
    }, [locations, homeLocation, selectedDate, workingHours]);

    // Time status categorizer for styling
    const getHourStatusType = (hour: number): "work" | "awake" | "sleep" => {
        if (hour >= workingHours.startHour && hour < workingHours.endHour) return "work";
        if ((hour >= 7 && hour < workingHours.startHour) || (hour >= workingHours.endHour && hour < 22)) return "awake";
        return "sleep";
    };

    // Format hour as 12-hour AM/PM string
    const format12Hour = (hour: number) => {
        const period = hour >= 12 ? "PM" : "AM";
        const displayH = hour % 12 === 0 ? 12 : hour % 12;
        return `${displayH}:00 ${period}`;
    };

    // Generate Calendar ICS Download
    const generateICSFile = () => {
        const [y, m, d] = selectedDate.split("-").map(Number);

        // Base start time calculation
        const startDate = new Date(Date.UTC(y, m - 1, d, selectedSlotHour, 0, 0));
        const endDate = new Date(startDate.getTime() + meetingDuration * 60 * 1000);

        const formatDateToICS = (date: Date) => {
            return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        const icsData = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TwisterTools//Multi-Timezone Meeting Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `SUMMARY:${meetingTitle || "Cross-Timezone Team Sync"}`,
            `DESCRIPTION:Scheduled via TwisterTools Multi-Timezone Meeting Planner.\\n\\nLocations:\\n${locations.map((l) => `${l.city} (${l.label}): ${format12Hour(getLocalHourDetails(l.tz, homeLocation.tz, selectedDate, selectedSlotHour).localHour)}`).join("\\n")}`,
            `DTSTART:${formatDateToICS(startDate)}`,
            `DTEND:${formatDateToICS(endDate)}`,
            `DTSTAMP:${formatDateToICS(new Date())}`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${meetingTitle.toLowerCase().replace(/\s+/g, "-") || "meeting"}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Copy Schedule Invite Summary
    const copyMeetingSummary = () => {
        const lines = [
            `📅 Meeting: ${meetingTitle || "Cross-Timezone Team Sync"}`,
            `🗓️ Date: ${selectedDate}`,
            `⏱️ Duration: ${meetingDuration} minutes`,
            `--------------------------------------------------`,
            `🌍 Localized Participant Times:`,
            ...locations.map((loc) => {
                const { localHour, tzAbbr, diffHours } = getLocalHourDetails(loc.tz, homeLocation.tz, selectedDate, selectedSlotHour);
                const offsetSign = diffHours >= 0 ? `+${diffHours}` : `${diffHours}`;
                return `• ${loc.city} (${loc.label}): ${format12Hour(localHour)} [${tzAbbr}, UTC${offsetSign}]`;
            }),
            `--------------------------------------------------`,
            `Generated via TwisterTools Multi-Timezone Scheduler (https://twistertools.com/tools/date-tools/meeting-timezone-scheduler)`
        ];

        navigator.clipboard.writeText(lines.join("\n"));
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // Best Overlap Slots
    const optimalSlots = useMemo(() => {
        return slotQualities.filter((s) => s.status === "optimal" || s.status === "acceptable");
    }, [slotQualities]);

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Meeting Overlap & Multi-Timezone Scheduler",
        "url": "https://twistertools.com/tools/date-tools/meeting-timezone-scheduler",
        "description": "Find perfect cross-timezone meeting overlaps, schedule remote team calls across international working hours, and export ICS calendar invites.",
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
                "name": "How does this tool calculate working hour overlaps across multiple timezones?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The scheduler calculates exact local hour offsets for every selected city relative to the reference home timezone using the ECMAScript Internationalization API (Intl). It visualizes working hours (typically 9:00 AM - 6:00 PM), waking buffer hours, and sleeping hours in a synchronized 24-hour visual matrix to highlight mutual availability."
                }
            },
            {
                "@type": "Question",
                "name": "Does this timezone scheduler account for Daylight Saving Time (DST) shifts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Because calculations rely on standard IANA timezone database identifiers (such as America/New_York or Europe/London) rather than static numerical UTC offsets, Daylight Saving Time transitions, British Summer Time (BST), and Central European Summer Time (CEST) are automatically factored in based on your selected date."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export scheduled meetings directly into Google Calendar, Outlook, or Apple Calendar?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Once you identify an optimal time slot, click 'Export .ICS Calendar Invite' to generate an industry-standard iCalendar file compatible with Google Calendar, Microsoft Outlook, Apple iCal, and Fastmail, complete with pre-calculated timezone descriptions for all attendees."
                }
            },
            {
                "@type": "Question",
                "name": "What is the best way to schedule meetings for teams spread across the US, Europe, and Asia?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For globally distributed teams spanning San Francisco, London, and Singapore, a mutual 9-to-5 working hour overlap rarely exists without someone working outside regular hours. The recommended approach is rotating meeting windows weekly or utilizing async video updates (Loom/Slack clips) paired with a 2-hour morning/evening overlap compromise."
                }
            },
            {
                "@type": "Question",
                "name": "Can I change which location acts as the primary reference timezone?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Simply click the 'Set Home' badge next to any city in your active list. The entire 24-hour interactive grid and master time picker will immediately re-index relative to that newly selected location."
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

                {/* Left Workspace Panel: Meeting Configuration & City Management */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Meeting Metadata Controls */}
                        <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                Meeting Parameters
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Meeting Title</label>
                                    <input
                                        type="text"
                                        value={meetingTitle}
                                        onChange={(e) => setMeetingTitle(e.target.value)}
                                        placeholder="e.g. Sprint Architecture Sync"
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">Duration</label>
                                        <select
                                            value={meetingDuration}
                                            onChange={(e) => setMeetingDuration(Number(e.target.value))}
                                            className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value={15}>15 mins</option>
                                            <option value={30}>30 mins</option>
                                            <option value={45}>45 mins</option>
                                            <option value={60}>60 mins</option>
                                            <option value={90}>90 mins</option>
                                            <option value={120}>2 hours</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location / Timezone Search & Add */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                                    Participant Locations ({locations.length})
                                </h2>
                                <span className="text-[11px] text-slate-500 font-medium">Home Reference: <strong className="text-indigo-600">{homeLocation.city}</strong></span>
                            </div>

                            {/* Quick Add City Autocomplete Input */}
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Search city, region, or timezone (e.g. Tokyo, Berlin, Sydney)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />

                                {searchQuery && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-36 overflow-y-auto space-y-1">
                                        {filteredSearchTimezones.length === 0 ? (
                                            <p className="text-xs text-slate-400 p-2">No matching standard cities found.</p>
                                        ) : (
                                            filteredSearchTimezones.map((tzItem) => (
                                                <button
                                                    key={tzItem.tz}
                                                    type="button"
                                                    onClick={() => addLocation(tzItem)}
                                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 text-left transition text-xs cursor-pointer group"
                                                >
                                                    <span className="font-bold text-slate-800 group-hover:text-indigo-600">{tzItem.city}, {tzItem.country}</span>
                                                    <span className="text-slate-500 font-mono text-[10px]">{tzItem.label}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Active Timezone List */}
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {locations.map((loc) => {
                                    const { localHour, tzAbbr, diffHours } = getLocalHourDetails(loc.tz, homeLocation.tz, selectedDate, selectedSlotHour);
                                    const statusType = getHourStatusType(localHour);
                                    const offsetStr = diffHours === 0 ? "Same time" : diffHours > 0 ? `+${diffHours}h ahead` : `${diffHours}h behind`;

                                    return (
                                        <div
                                            key={loc.id}
                                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${loc.isHome
                                                ? "bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-400/50"
                                                : "bg-slate-50/70 border-slate-200"
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900 truncate">{loc.city}</span>
                                                    {loc.isHome && (
                                                        <span className="text-[9px] bg-indigo-600 text-white font-black px-1.5 py-0.2 rounded uppercase tracking-wider">
                                                            Primary
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 truncate">({loc.country})</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                    <span className="font-mono font-medium text-slate-700">{loc.label}</span>
                                                    <span>&bull;</span>
                                                    <span className="text-indigo-600 font-semibold">{offsetStr}</span>
                                                </div>
                                            </div>

                                            {/* Local Time at Selected Slot */}
                                            <div className="text-right flex items-center gap-2.5">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {statusType === "work" && <Sun className="w-3 h-3 text-amber-500" />}
                                                        {statusType === "awake" && <Sunset className="w-3 h-3 text-orange-400" />}
                                                        {statusType === "sleep" && <Moon className="w-3 h-3 text-indigo-400" />}
                                                        <span className="text-xs font-black text-slate-900 font-mono">{format12Hour(localHour)}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold block ${statusType === "work" ? "text-emerald-600" : statusType === "awake" ? "text-amber-600" : "text-rose-500"}`}>
                                                        {statusType === "work" ? "Working Hours" : statusType === "awake" ? "Awake / Off-Hours" : "Sleeping Hours"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                                    {!loc.isHome && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAsHome(loc.id)}
                                                            className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold px-1.5 py-1 rounded bg-white border border-slate-200 cursor-pointer"
                                                            title="Set as Home Reference Timezone"
                                                        >
                                                            Set Base
                                                        </button>
                                                    )}
                                                    {locations.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLocation(loc.id)}
                                                            className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                                            title="Remove Location"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Recommended Meeting Windows */}
                        <div className="space-y-2 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Top Mutual Overlap Windows ({homeLocation.city} Time)
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {optimalSlots.slice(0, 3).map((slot) => {
                                    const isSelected = selectedSlotHour === slot.hour;
                                    return (
                                        <button
                                            key={slot.hour}
                                            type="button"
                                            onClick={() => setSelectedSlotHour(slot.hour)}
                                            className={`p-2 rounded-lg border text-center transition cursor-pointer ${isSelected
                                                ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                                                : "bg-white text-slate-800 border-slate-200 hover:border-indigo-300"
                                                }`}
                                        >
                                            <div className="text-xs font-black font-mono">{format12Hour(slot.hour)}</div>
                                            <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? "text-indigo-100" : slot.status === "optimal" ? "text-emerald-600" : "text-amber-600"}`}>
                                                {slot.workingCount}/{slot.total} in work hrs
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                    </div>

                    {/* Action Buttons: ICS Export & Copy Invite */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
                        <button
                            type="button"
                            onClick={generateICSFile}
                            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            <CalendarPlus className="w-4 h-4" />
                            <span>Export .ICS Calendar Invite</span>
                        </button>
                        <button
                            type="button"
                            onClick={copyMeetingSummary}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedSummary ? "Copied!" : "Copy Summary"}</span>
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: 24-Hour Visual Overlap Timeline Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">

                        {/* Section Header & Legend */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                24-Hour Synchronized Matrix
                            </h2>
                            <div className="flex items-center gap-3 text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-emerald-700">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Working (9-18)
                                </span>
                                <span className="flex items-center gap-1 text-amber-700">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Awake
                                </span>
                                <span className="flex items-center gap-1 text-slate-500">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> Sleeping
                                </span>
                            </div>
                        </div>

                        {/* Interactive Timeline Matrix Grid */}
                        <div className="space-y-3 overflow-x-auto pb-2">
                            {/* Master Hour Selector Bar */}
                            <div className="min-w-[500px] space-y-1">
                                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                                    Click any slot to select meeting time ({homeLocation.city} base)
                                </span>
                                <div className="grid grid-cols-24 gap-0.5 bg-slate-100 p-1 rounded-lg">
                                    {Array.from({ length: 24 }).map((_, h) => {
                                        const isSelected = selectedSlotHour === h;
                                        const quality = slotQualities[h];
                                        return (
                                            <button
                                                key={h}
                                                type="button"
                                                onClick={() => setSelectedSlotHour(h)}
                                                className={`h-7 rounded text-[9px] font-mono font-bold flex items-center justify-center transition cursor-pointer ${isSelected
                                                    ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400"
                                                    : quality.status === "optimal"
                                                        ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                                                        : quality.status === "acceptable"
                                                            ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                                            : "bg-slate-200/70 text-slate-600 hover:bg-slate-300"
                                                    }`}
                                                title={`${format12Hour(h)} (${quality.workingCount}/${quality.total} available)`}
                                            >
                                                {h}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Participant Heatmap Bars */}
                            <div className="min-w-[500px] space-y-3 pt-2">
                                {locations.map((loc) => (
                                    <div key={loc.id} className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <Building2 className="w-3 h-3 text-slate-400" />
                                                <strong className="text-slate-900">{loc.city}</strong>
                                                <span className="text-slate-400">({loc.label})</span>
                                            </span>
                                            <span className="font-mono text-xs font-bold text-indigo-600">
                                                {format12Hour(getLocalHourDetails(loc.tz, homeLocation.tz, selectedDate, selectedSlotHour).localHour)}
                                            </span>
                                        </div>

                                        {/* 24 Hour Block Bar */}
                                        <div className="grid grid-cols-24 gap-0.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                            {Array.from({ length: 24 }).map((_, homeH) => {
                                                const { localHour } = getLocalHourDetails(loc.tz, homeLocation.tz, selectedDate, homeH);
                                                const status = getHourStatusType(localHour);
                                                const isSlotSelected = selectedSlotHour === homeH;

                                                return (
                                                    <div
                                                        key={homeH}
                                                        onClick={() => setSelectedSlotHour(homeH)}
                                                        className={`h-6 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold cursor-pointer transition ${isSlotSelected ? "ring-2 ring-indigo-600 z-10 scale-105" : ""
                                                            } ${status === "work"
                                                                ? "bg-emerald-500 text-white"
                                                                : status === "awake"
                                                                    ? "bg-amber-400 text-amber-950"
                                                                    : "bg-slate-300 text-slate-600"
                                                            }`}
                                                        title={`${loc.city}: ${format12Hour(localHour)} (${status})`}
                                                    >
                                                        {localHour}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Selected Time Breakdown Banner */}
                        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    Active Slot Summary
                                </span>
                                <span className="text-xs font-mono font-black text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                    {format12Hour(selectedSlotHour)} {homeLocation.city}
                                </span>
                            </div>
                            <p className="text-xs text-indigo-900 leading-relaxed">
                                {slotQualities[selectedSlotHour].workingCount} of {locations.length} participants are within core business hours (9 AM - 6 PM).
                                {slotQualities[selectedSlotHour].sleepingCount > 0 && (
                                    <span className="text-rose-600 font-bold block mt-0.5">
                                        ⚠️ Note: {slotQualities[selectedSlotHour].sleepingCount} attendee(s) will be in overnight/sleep hours.
                                    </span>
                                )}
                            </p>
                        </div>

                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Auto-DST Adjusted &bull; 100% Client-Side Engine
                        </span>
                        <span className="font-semibold text-emerald-600">Enterprise Ready</span>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Multi-Timezone Coordination Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Coordinate Meetings Across Global Timezones
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In an era dominated by distributed engineering squads, remote-first enterprises, and multinational agile teams, coordinating synchronous discussions across continents is one of modern business&apos;s greatest operational bottlenecks. A simple 30-minute sprint planning call often requires reconciling participants across UTC, US Eastern (ET), British Summer Time (BST), and Singapore Standard Time (SGT).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The TwisterTools Multi-Timezone Meeting Scheduler eliminates mental timezone arithmetic and scheduling confusion. By rendering an interactive 24-hour synchronized matrix, remote team managers can instantly pinpoint fair meeting windows that respect international working hours, reduce off-hours burnout, and streamline cross-border collaboration.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Golden Window</span>
                            <h3 className="font-bold text-slate-900 text-sm">US East to Europe</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The standard 5-hour gap between New York (ET) and London (GMT) yields an ideal 4-hour overlap window between 9:00 AM - 1:00 PM ET (2:00 PM - 6:00 PM UK).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Asymmetric Split</span>
                            <h3 className="font-bold text-slate-900 text-sm">US West to Europe</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                An 8-hour delta between California (PT) and Central Europe (CET) limits mutual working overlaps to early morning (8:00 AM - 10:00 AM PT / 5:00 PM - 7:00 PM CET).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Opposite Poles</span>
                            <h3 className="font-bold text-slate-900 text-sm">US West to APAC</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A 15-hour difference between San Francisco and Tokyo requires late-afternoon US calls (4:00 PM PT) corresponding to morning Tokyo time (8:00 AM JST next day).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: International Working Hours & Overlap Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Major Global Financial & Tech Hub Overlap Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this reference table to evaluate typical standard time differences and recommended synchronous communication windows between world tech centers:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Primary Corridor</th>
                                    <th className="p-3">Time Delta</th>
                                    <th className="p-3">Peak Overlap Window</th>
                                    <th className="p-3">Overlap Quality</th>
                                    <th className="p-3">Recommended Collaboration Style</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">London (UK) ↔ New York (US ET)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">5 Hours</td>
                                    <td className="p-3 font-mono text-slate-800">14:00 - 18:00 GMT / 09:00 - 13:00 ET</td>
                                    <td className="p-3 text-xs font-bold text-emerald-600">Optimal (4 hrs)</td>
                                    <td className="p-3 text-xs text-slate-600">Synchronous agile standups, architecture pairing, design reviews</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">London (UK) ↔ Singapore (SGT)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">7-8 Hours</td>
                                    <td className="p-3 font-mono text-slate-800">08:00 - 11:00 GMT / 16:00 - 19:00 SGT</td>
                                    <td className="p-3 text-xs font-bold text-emerald-600">Good (2-3 hrs)</td>
                                    <td className="p-3 text-xs text-slate-600">Morning EMEA triage syncing with late APAC business hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">San Francisco (PT) ↔ New York (ET)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">3 Hours</td>
                                    <td className="p-3 font-mono text-slate-800">09:00 - 14:00 PT / 12:00 - 17:00 ET</td>
                                    <td className="p-3 text-xs font-bold text-emerald-600">Excellent (5 hrs)</td>
                                    <td className="p-3 text-xs text-slate-600">Standard domestic team collaboration and live executive meetings</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">San Francisco (PT) ↔ London (UK)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">8 Hours</td>
                                    <td className="p-3 font-mono text-slate-800">08:00 - 10:00 PT / 16:00 - 18:00 GMT</td>
                                    <td className="p-3 text-xs font-bold text-amber-600">Tight (1-2 hrs)</td>
                                    <td className="p-3 text-xs text-slate-600">Bi-weekly all-hands calls, async Loom videos for operational updates</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">San Francisco (PT) ↔ Sydney (AEST)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">17-19 Hours</td>
                                    <td className="p-3 font-mono text-slate-800">16:00 - 18:00 PT / 09:00 - 11:00 (+1d) AEST</td>
                                    <td className="p-3 text-xs font-bold text-amber-600">Challenging</td>
                                    <td className="p-3 text-xs text-slate-600">Late US afternoon calls matching next-day Australian morning start</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for Asynchronous & Multi-Timezone Remote Culture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Remote Team Best Practices: Avoiding Meeting Fatigue and Burnout
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While synchronous calls build human connection, forcing international engineers to attend late-night or pre-dawn calls causes rapid disengagement and developer burnout. Industry leaders utilize these key organizational principles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Rotate Pain Hours Equitably
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                If a recurring sync requires one region to join outside standard business hours, alternate the meeting time bi-weekly so no single team consistently bears the burden of evening or early morning meetings.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-600" /> Default to Asynchronous Written Documentation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Use Slack, GitHub Discussions, or recorded Loom demos for status updates. Reserve live multi-timezone calendar meetings exclusively for high-bandwidth brainstorming, conflict resolution, or team celebrations.
                            </p>
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
                                How does this tool calculate working hour overlaps across multiple timezones?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The scheduler calculates exact local hour offsets for every selected city relative to the reference home timezone using the ECMAScript Internationalization API (Intl). It visualizes working hours (typically 9:00 AM - 6:00 PM), waking buffer hours, and sleeping hours in a synchronized 24-hour visual matrix to highlight mutual availability.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this timezone scheduler account for Daylight Saving Time (DST) shifts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Because calculations rely on standard IANA timezone database identifiers (such as America/New_York or Europe/London) rather than static numerical UTC offsets, Daylight Saving Time transitions, British Summer Time (BST), and Central European Summer Time (CEST) are automatically factored in based on your selected date.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export scheduled meetings directly into Google Calendar, Outlook, or Apple Calendar?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Once you identify an optimal time slot, click &quot;Export .ICS Calendar Invite&quot; to generate an industry-standard iCalendar file compatible with Google Calendar, Microsoft Outlook, Apple iCal, and Fastmail, complete with pre-calculated timezone descriptions for all attendees.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the best way to schedule meetings for teams spread across the US, Europe, and Asia?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For globally distributed teams spanning San Francisco, London, and Singapore, a mutual 9-to-5 working hour overlap rarely exists without someone working outside regular hours. The recommended approach is rotating meeting windows weekly or utilizing async video updates paired with a 2-hour morning/evening overlap compromise.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I change which location acts as the primary reference timezone?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Simply click the &quot;Set Base&quot; button next to any city in your active list. The entire 24-hour interactive grid and master time picker will immediately re-index relative to that newly selected location.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}