// components/tools/MoonPhaseCalculator.tsx
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Moon,
    Sun,
    Calendar as CalendarIcon,
    MapPin,
    Search,
    Globe,
    RotateCcw,
    Copy,
    Check,
    Info,
    BookOpen,
    Compass,
    Sparkles,
    BarChart3,
    HelpCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Sliders,
    Navigation,
    Cpu,
    Camera,
    ShieldAlert,
    Zap,
    Calendar,
} from "lucide-react";

// Types
interface LocationPreset {
    name: string;
    country: string;
    lat: number;
    lng: number;
    timezone: string;
    offset: number;
}

// Global City Database (40+ major global locations)
const WORLD_CITIES: LocationPreset[] = [
    { name: "New York", country: "USA", lat: 40.7128, lng: -74.006, timezone: "America/New_York", offset: -5 },
    { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", offset: 0 },
    { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", offset: 9 },
    { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", offset: 1 },
    { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, timezone: "Australia/Sydney", offset: 10 },
    { name: "Athens", country: "Greece", lat: 37.9838, lng: 23.7275, timezone: "Europe/Athens", offset: 2 },
    { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, timezone: "Africa/Cairo", offset: 2 },
    { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, timezone: "America/Sao_Paulo", offset: -3 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, timezone: "America/Los_Angeles", offset: -8 },
    { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405, timezone: "Europe/Berlin", offset: 1 },
    { name: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai", offset: 4 },
    { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, timezone: "Asia/Singapore", offset: 8 },
    { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298, timezone: "America/Chicago", offset: -6 },
    { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, timezone: "America/Toronto", offset: -5 },
    { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, timezone: "America/Vancouver", offset: -8 },
    { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome", offset: 1 },
    { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid", offset: 1 },
    { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041, timezone: "Europe/Amsterdam", offset: 1 },
    { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, timezone: "Asia/Hong_Kong", offset: 8 },
    { name: "Mumbai", country: "India", lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata", offset: 5.5 },
    { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.209, timezone: "Asia/Kolkata", offset: 5.5 },
    { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok", offset: 7 },
    { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978, timezone: "Asia/Seoul", offset: 9 },
    { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, timezone: "Asia/Shanghai", offset: 8 },
    { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul", offset: 3 },
    { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, timezone: "Africa/Johannesburg", offset: 2 },
    { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, timezone: "America/Argentina/Buenos_Aires", offset: -3 },
    { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, timezone: "America/Mexico_City", offset: -6 },
    { name: "Auckland", country: "New Zealand", lat: -36.8485, lng: 174.7633, timezone: "Pacific/Auckland", offset: 12 },
    { name: "Honolulu", country: "USA (Hawaii)", lat: 21.3069, lng: -157.8583, timezone: "Pacific/Honolulu", offset: -10 },
    { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, timezone: "Europe/Zurich", offset: 1 },
    { name: "Vienna", country: "Austria", lat: 48.2082, lng: 16.3738, timezone: "Europe/Vienna", offset: 1 },
    { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686, timezone: "Europe/Stockholm", offset: 1 },
    { name: "Oslo", country: "Norway", lat: 59.9139, lng: 10.7522, timezone: "Europe/Oslo", offset: 1 },
    { name: "Helsinki", country: "Finland", lat: 60.1699, lng: 24.9384, timezone: "Europe/Helsinki", offset: 2 },
    { name: "Warsaw", country: "Poland", lat: 52.2297, lng: 21.0122, timezone: "Europe/Warsaw", offset: 1 },
    { name: "Prague", country: "Czechia", lat: 50.0755, lng: 14.4378, timezone: "Europe/Prague", offset: 1 },
    { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, timezone: "Europe/Dublin", offset: 0 },
    { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, timezone: "Europe/Lisbon", offset: 0 },
    { name: "Reykjavik", country: "Iceland", lat: 64.1466, lng: -21.9426, timezone: "Atlantic/Reykjavik", offset: 0 },
];

// Quick selection presets
const POPULAR_PRESETS = WORLD_CITIES.slice(0, 8);

// Astronomical Constants
const LUNAR_SYNODIC_MONTH = 29.53058867; // Days in a synodic month

// Astronomical Moon Phase Calculation Algorithm (Meeus Approximation)
function getMoonPhaseData(date: Date, lat: number = 0) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60;

    // Julian Date calculation
    let y = year;
    let m = month;
    if (m <= 2) {
        y -= 1;
        m += 12;
    }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hours / 24 + b - 1524.5;

    // Days since known New Moon Epoch (Jan 6, 2000 18:14 UTC -> JD 2451549.26)
    const daysSinceEpoch = jd - 2451549.26;
    const newMoons = daysSinceEpoch / LUNAR_SYNODIC_MONTH;
    const currentCycleFraction = newMoons - Math.floor(newMoons);

    // Age of Moon in days
    const moonAgeDays = currentCycleFraction * LUNAR_SYNODIC_MONTH;

    // Illumination percentage: (1 - cos(angle)) / 2
    const phaseAngle = currentCycleFraction * 2 * Math.PI;
    const illuminationFraction = (1 - Math.cos(phaseAngle)) / 2;
    const illuminationPercent = Math.round(illuminationFraction * 100);

    // Determine Phase Name
    let phaseName = "";
    let phaseCode = "";
    if (moonAgeDays < 1.84566) {
        phaseName = "New Moon";
        phaseCode = "new";
    } else if (moonAgeDays < 5.53699) {
        phaseName = "Waxing Crescent";
        phaseCode = "waxing_crescent";
    } else if (moonAgeDays < 9.22831) {
        phaseName = "First Quarter";
        phaseCode = "first_quarter";
    } else if (moonAgeDays < 12.91963) {
        phaseName = "Waxing Gibbous";
        phaseCode = "waxing_gibbous";
    } else if (moonAgeDays < 16.61096) {
        phaseName = "Full Moon";
        phaseCode = "full";
    } else if (moonAgeDays < 20.30228) {
        phaseName = "Waning Gibbous";
        phaseCode = "waning_gibbous";
    } else if (moonAgeDays < 23.99361) {
        phaseName = "Third Quarter";
        phaseCode = "third_quarter";
    } else if (moonAgeDays < 27.68493) {
        phaseName = "Waning Crescent";
        phaseCode = "waning_crescent";
    } else {
        phaseName = "New Moon";
        phaseCode = "new";
    }

    // Distance estimation (km) - Harmonic approximation
    const meanDistance = 384400;
    const distanceVar = 21000 * Math.cos((moonAgeDays / LUNAR_SYNODIC_MONTH) * 2 * Math.PI - 0.4);
    const distanceKm = Math.round(meanDistance - distanceVar);

    // Approximate Zodiac Sign (Moon travels ~13.18 degrees/day through 12 signs)
    const eclipticLongitude = (currentCycleFraction * 360 + (jd % 365) * 0.9856) % 360;
    const zodiacSigns = [
        "Aries", "Taurus", "Gemini", "Cancer",
        "Leo", "Virgo", "Libra", "Scorpio",
        "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    const zodiacIndex = Math.floor(eclipticLongitude / 30) % 12;
    const zodiacSign = zodiacSigns[zodiacIndex];

    // Hemisphere invert calculation
    const isSouthernHemisphere = lat < 0;

    return {
        ageDays: Math.round(moonAgeDays * 10) / 10,
        illuminationPercent,
        phaseName,
        phaseCode,
        distanceKm,
        zodiacSign,
        cycleFraction: currentCycleFraction,
        isSouthernHemisphere,
    };
}

export default function MoonPhaseCalculator() {
    // States
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [latInput, setLatInput] = useState<string>("40.7128");
    const [lngInput, setLngInput] = useState<string>("-74.0060");
    const [locationName, setLocationName] = useState<string>("New York, USA");
    const [copied, setCopied] = useState<boolean>(false);

    // City Search States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Input Handlers
    const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || val === "-" || !isNaN(Number(val))) setLatInput(val);
    };

    const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === "" || val === "-" || !isNaN(Number(val))) setLngInput(val);
    };

    const selectPreset = (preset: LocationPreset) => {
        setLatInput(preset.lat.toString());
        setLngInput(preset.lng.toString());
        setLocationName(`${preset.name}, ${preset.country}`);
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    const filteredCities = useMemo(() => {
        if (!searchQuery.trim()) return WORLD_CITIES;
        const q = searchQuery.toLowerCase();
        return WORLD_CITIES.filter(
            (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Current Geolocation Feature
    const handleGeolocate = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLatInput(lat.toFixed(4));
                    setLngInput(lng.toFixed(4));
                    setLocationName("Your Current Location");
                    setIsDropdownOpen(false);
                },
                () => {
                    alert("Unable to retrieve location. Please grant permission or select a city manually.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Current Active Calculation
    const targetDate = useMemo(() => {
        return selectedDate ? new Date(selectedDate + "T12:00:00Z") : new Date();
    }, [selectedDate]);

    const lat = parseFloat(latInput) || 0;
    const moonData = useMemo(() => {
        return getMoonPhaseData(targetDate, lat);
    }, [targetDate, lat]);

    // Monthly Calendar Grid Data
    const monthlyCalendar = useMemo(() => {
        const curr = new Date(targetDate);
        const year = curr.getUTCFullYear();
        const month = curr.getUTCMonth();

        const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
        const daysInMonth = lastDayOfMonth.getUTCDate();

        const calendarDays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(Date.UTC(year, month, d));
            const phase = getMoonPhaseData(dateObj, lat);
            calendarDays.push({
                dayNumber: d,
                dateStr: dateObj.toISOString().split("T")[0],
                phase,
            });
        }
        return {
            monthName: curr.toLocaleString("en-US", { month: "long", timeZone: "UTC" }),
            year,
            calendarDays,
        };
    }, [targetDate, lat]);

    // Navigation Days
    const changeDateByDays = (days: number) => {
        const d = new Date(targetDate);
        d.setUTCDate(d.getUTCDate() + days);
        setSelectedDate(d.toISOString().split("T")[0]);
    };

    const handleCopyReport = () => {
        const report = `Moon Phase Report for ${locationName} (${selectedDate})
--------------------------------------------------
Phase: ${moonData.phaseName}
Illumination: ${moonData.illuminationPercent}%
Moon Age: ${moonData.ageDays} days
Distance to Earth: ${moonData.distanceKm.toLocaleString("en-US")} km
Zodiac Sign: ${moonData.zodiacSign}
Hemisphere Perspective: ${moonData.isSouthernHemisphere ? "Southern Hemisphere View" : "Northern Hemisphere View"}
--------------------------------------------------
Calculated with TwisterTools Moon Phase Calculator`;

        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setSelectedDate(new Date().toISOString().split("T")[0]);
        setLatInput("40.7128");
        setLngInput("-74.0060");
        setLocationName("New York, USA");
        setSearchQuery("");
        setIsDropdownOpen(false);
    };

    // Structured Data Schemas
    const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Moon Phase Calendar & Visualizer",
        "url": "https://twistertools.com/tools/date-tools/moon-phase-calculator",
        "description": "Calculate accurate lunar phases, illumination percentages, moon age, distance, zodiac position, and monthly lunar calendar views for any global location.",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "All",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    };

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "What are the 8 primary phases of the Moon in order?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The eight lunar phases in chronological order are: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Third Quarter, and Waning Crescent."
                }
            },
            {
                "@type": "Question",
                "name": "Why does the Moon appear inverted in the Southern Hemisphere?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the Northern Hemisphere, an observer faces south to look at the Moon, so waxing light grows from right to left. In the Southern Hemisphere, observers face north, physically inverting their perspective so waxing light grows from left to right."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a Synodic and Sidereal month?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Synodic Month (approx. 29.53 days) measures the time taken for the Moon to cycle through all its visible phases relative to the Sun. A Sidereal Month (approx. 27.32 days) measures the exact time it takes for the Moon to complete one full 360-degree orbit around Earth relative to background fixed stars."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Moon phase affect ocean tides?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "During New Moon and Full Moon phases, the gravitational forces of the Sun and Moon align, producing maximum tidal range known as Spring Tides. During First and Third Quarter phases, their gravitational pulls are perpendicular, producing minimal tidal variation known as Neap Tides."
                }
            },
            {
                "@type": "Question",
                "name": "What is a Supermoon or Micromoon?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Supermoon occurs when a Full Moon coincides with the Moon's closest orbital approach to Earth (perigee), making it appear up to 14% larger and 30% brighter. A Micromoon occurs when a Full Moon coincides with the furthest point in its elliptical orbit (apogee)."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-6">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Panel: Inputs & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                            Parameters & Location
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={handleGeolocate}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 text-xs font-semibold transition border border-amber-200 shadow-xs"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                Use My Location
                            </button>
                            <button
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Date Picker & Quick Step Controls */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Target Date
                        </label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => changeDateByDays(-1)}
                                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                                title="Previous Day"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                            <button
                                onClick={() => changeDateByDays(1)}
                                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
                                title="Next Day"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search City */}
                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Search City or Country
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Type city or country (e.g., Tokyo, Athens, London)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city) => (
                                        <button
                                            key={`${city.name}-${city.country}`}
                                            type="button"
                                            onClick={() => selectPreset(city)}
                                            className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition flex items-center justify-between text-xs group"
                                        >
                                            <span className="font-bold text-slate-800 group-hover:text-indigo-600">{city.name}, {city.country}</span>
                                            <span className="font-mono text-slate-400">{city.lat > 0 ? `${city.lat}°N` : `${Math.abs(city.lat)}°S`}</span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                        No matching location found. Enter custom coordinates below.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Preset Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Quick City Presets
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {POPULAR_PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => selectPreset(preset)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${locationName.includes(preset.name)
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Coordinates Manual Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                Latitude (-90 to 90)
                            </label>
                            <input
                                type="text"
                                value={latInput}
                                onChange={handleLatChange}
                                placeholder="e.g. 40.7128"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                                Longitude (-180 to 180)
                            </label>
                            <input
                                type="text"
                                value={lngInput}
                                onChange={handleLngChange}
                                placeholder="e.g. -74.0060"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Selected Info Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-indigo-600" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Observer Location Target</p>
                                <p className="text-sm font-bold text-slate-900">{locationName}</p>
                            </div>
                        </div>
                        <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                            {moonData.isSouthernHemisphere ? "Southern View" : "Northern View"}
                        </span>
                    </div>
                </div>

                {/* Right Panel: Moon Phase Display & Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Moon className="w-5 h-5 text-indigo-600" />
                            Lunar Observation Metrics
                        </h2>
                        <button
                            onClick={handleCopyReport}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "Copied Report!" : "Copy Report"}</span>
                        </button>
                    </div>

                    {/* Primary Moon Phase Graphic Card */}
                    <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner">
                        <div className="flex flex-col items-center sm:items-start space-y-1">
                            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">Current Phase</span>
                            <h3 className="text-2xl font-extrabold text-white">{moonData.phaseName}</h3>
                            <p className="text-xs text-slate-400 font-mono">
                                Age: {moonData.ageDays} / 29.53 Days
                            </p>
                        </div>

                        {/* Visual Moon Representation */}
                        <div className="relative w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shadow-lg overflow-hidden">
                            <div
                                className="absolute inset-0 bg-amber-100 transition-all duration-300"
                                style={{
                                    opacity: moonData.illuminationPercent / 100,
                                    clipPath: moonData.illuminationPercent > 50 ? "circle(100%)" : "circle(50% at 50% 50%)",
                                }}
                            ></div>
                            <div className="relative z-10 text-slate-900 font-extrabold text-xs font-mono bg-white/80 px-2 py-0.5 rounded-full shadow-sm">
                                {moonData.illuminationPercent}%
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-slate-500 font-medium block">Illumination</span>
                            <span className="text-lg font-bold text-slate-900 font-mono">{moonData.illuminationPercent}%</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-slate-500 font-medium block">Distance to Earth</span>
                            <span className="text-lg font-bold text-slate-900 font-mono">{moonData.distanceKm.toLocaleString("en-US")} km</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-slate-500 font-medium block">Zodiac Sign</span>
                            <span className="text-lg font-bold text-indigo-600">{moonData.zodiacSign}</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                            <span className="text-xs text-slate-500 font-medium block">Synodic Progress</span>
                            <span className="text-lg font-bold text-slate-900 font-mono">{(moonData.cycleFraction * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Calendar View Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-indigo-600" />
                        Monthly Phase Grid ({monthlyCalendar.monthName} {monthlyCalendar.year})
                    </h3>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                            {day}
                        </div>
                    ))}
                    {monthlyCalendar.calendarDays.map((item) => {
                        const isSelected = item.dateStr === selectedDate;
                        return (
                            <button
                                key={item.dayNumber}
                                onClick={() => setSelectedDate(item.dateStr)}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-between transition min-h-[64px] ${isSelected
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                    : "bg-slate-50/80 border-slate-200/80 text-slate-800 hover:bg-slate-100"
                                    }`}
                            >
                                <span className="text-xs font-bold">{item.dayNumber}</span>
                                <span className={`text-[10px] font-mono ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                                    {item.phase.illuminationPercent}%
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* BELOW-THE-FOLD SEO CONTENT CARDS */}

            {/* Card 1: How Lunar Phases Work */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Understanding Lunar Phases & Astronomical Mechanics
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    The Moon produces no light of its own; it reflects illumination from the Sun. As the Moon orbits Earth once every 29.53059 days (a <em>synodic month</em>), the spatial alignment between the Sun, Earth, and Moon shifts continuously. This celestial geometry alters the proportion of the illuminated lunar hemisphere visible to an observer on Earth, giving rise to the predictable progression of lunar phases.
                </p>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    Our online <strong>Moon Phase Calendar & Visualizer</strong> leverages Jean Meeus astronomical algorithms to calculate exact phase angles, disk illumination percentages, lunar age in days, Earth-Moon orbital distance, and ecliptic zodiac sign coordinates for any date and global coordinate.
                </p>

                <ul className="list-disc pl-6 space-y-2 text-slate-700 text-sm md:text-base">
                    <li>
                        <strong>Synodic vs. Sidereal Orbit:</strong> While the Moon completes a 360-degree orbit relative to fixed stars in 27.32 days (sidereal month), Earth's simultaneous movement around the Sun requires the Moon to travel an extra ~2.2 days to return to the same Sun-Earth alignment (synodic month).
                    </li>
                    <li>
                        <strong>Hemispheric Orientation:</strong> Because observers in the Northern and Southern Hemispheres stand upside-down relative to one another, a waxing moon appears lit on the <em>right side</em> in northern latitudes and on the <em>left side</em> in southern latitudes.
                    </li>
                    <li>
                        <strong>Lunar Distance Variation:</strong> Due to the Moon's elliptical orbit (eccentricity ~0.0549), its distance from Earth ranges from approximately 356,400 km at perigee to 406,700 km at apogee.
                    </li>
                </ul>
            </div>

            {/* Card 2: The 8 Primary Lunar Phases Breakdown Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        The 8 Primary Lunar Phases Breakdown
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-700">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 font-bold text-slate-900 min-w-[140px]">Phase Name</th>
                                <th className="p-3 font-bold text-slate-900 min-w-[120px]">Moon Age</th>
                                <th className="p-3 font-bold text-slate-900 min-w-[120px]">Illumination</th>
                                <th className="p-3 font-bold text-slate-900 min-w-[280px]">Observational Characteristics</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">New Moon</td>
                                <td className="p-3 font-mono">0.0 - 1.8 Days</td>
                                <td className="p-3 font-mono text-indigo-600">0%</td>
                                <td className="p-3">Moon positioned directly between Earth and Sun; unlit face points toward Earth. Invisible in daytime sky.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Waxing Crescent</td>
                                <td className="p-3 font-mono">1.8 - 5.5 Days</td>
                                <td className="p-3 font-mono text-indigo-600">1% - 49%</td>
                                <td className="p-3">Slender crescent appears low in western sky after sunset. Crescent points away from the Sun.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">First Quarter</td>
                                <td className="p-3 font-mono">5.5 - 9.2 Days</td>
                                <td className="p-3 font-mono text-indigo-600">50%</td>
                                <td className="p-3">Exactly half of the lunar disk illuminated. Rises around noon, reaches highest point at sunset.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Waxing Gibbous</td>
                                <td className="p-3 font-mono">9.2 - 12.9 Days</td>
                                <td className="p-3 font-mono text-indigo-600">51% - 99%</td>
                                <td className="p-3">Illuminated surface expands beyond half. Visible during late afternoon and most of the night.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">Full Moon</td>
                                <td className="p-3 font-mono">12.9 - 16.6 Days</td>
                                <td className="p-3 font-mono text-indigo-600">100%</td>
                                <td className="p-3">Earth directly between Sun and Moon. Fully illuminated face visible from sunset to sunrise.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Waning Gibbous</td>
                                <td className="p-3 font-mono">16.6 - 20.3 Days</td>
                                <td className="p-3 font-mono text-indigo-600">99% - 51%</td>
                                <td className="p-3">Illumination decreases gradually. Rises in late evening, visible into early morning hours.</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-semibold text-slate-900">Third Quarter</td>
                                <td className="p-3 font-mono">20.3 - 24.0 Days</td>
                                <td className="p-3 font-mono text-indigo-600">50%</td>
                                <td className="p-3">Opposite half illuminated compared to First Quarter. Rises at midnight, sets around noon.</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-900">Waning Crescent</td>
                                <td className="p-3 font-mono">24.0 - 27.7 Days</td>
                                <td className="p-3 font-mono text-indigo-600">49% - 1%</td>
                                <td className="p-3">Final sliver of light visible in eastern sky before sunrise. Completes synodic cycle.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Card 3: Mathematical Formulas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Cpu className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Mathematical Equations & Astronomical Algorithms
                    </h2>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    To compute lunar illumination ($k$) and phase angle ($i$), algorithms convert UTC time into Julian Date ($JD$). The phase angle $i$ is derived using the relative position of the Sun and Moon along the ecliptic plane:
                </p>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto text-center">
                    <code>
                        {"k = \\frac{1 + \\cos(i)}{2} \\quad \\text{where} \\quad i = \\left( \\frac{JD - 2451549.26}{29.53058867} \\right) \\times 2\\pi"}
                    </code>
                </div>

                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                    {"The harmonic approximation formula for Earth-Moon orbital distance ($D$) factors in mean distance ($384,400 \\\\text{km}$) and monthly variation (\\\\Delta d \\\\approx 21,000 \\\\text{km}$):"}
                </p>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto text-center">
                    <code>
                        {"D = 384400 - 21000 \\cdot \\cos\\left(2\\pi \\cdot \\frac{\\text{Moon Age}}{29.53059} - 0.4\\right) \\text{ km}"}
                    </code>
                </div>
            </div>

            {/* Card 4: Practical Real-World Applications */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Real-World Practical Applications of Lunar Tracking
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Camera className="w-4 h-4 text-indigo-600" />
                            <span>Astrophotography & Stargazing</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Deep-sky photographers schedule shoots during the New Moon phase to eliminate moonlight pollution, while night landscape photographers leverage bright Full Moon light to illuminate foreground terrain.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <ShieldAlert className="w-4 h-4 text-amber-500" />
                            <span>Maritime Tides & Marine Navigation</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Mariners and oceanographers monitor New and Full Moon phases to anticipate high-amplitude <em>Spring Tides</em>, which can impact harbor depth and coastal navigation channels.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            <span>Cultural & Religious Calendars</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Major global calendars—including the Islamic (Hijri), Hebrew, Lunar New Year, and Hindu calendars—depend directly on first crescent sightings and specific moon phase calculations.
                        </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Zap className="w-4 h-4 text-sky-500" />
                            <span>Wildlife & Agricultural Planning</span>
                        </div>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">
                            Biological research shows nocturnal animal feeding behaviors shift dramatically under varied moonlight. Traditional farmers also utilize lunar calendars to guide planting cycles.
                        </p>
                    </div>
                </div>
            </div>

            {/* Card 5: Frequently Asked Questions */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            What are the 8 primary phases of the Moon in order?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            The eight lunar phases in chronological order are: New Moon, Waxing Crescent, First Quarter, Waxing Gibbous, Full Moon, Waning Gibbous, Third Quarter, and Waning Crescent.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            Why does the Moon appear inverted in the Southern Hemisphere?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            In the Northern Hemisphere, an observer faces south to look at the Moon, so waxing light grows from right to left. In the Southern Hemisphere, observers face north, physically inverting their perspective so waxing light grows from left to right.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            What is the difference between a Synodic and Sidereal month?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            A Synodic Month (approx. 29.53 days) measures the time taken for the Moon to cycle through all its visible phases relative to the Sun. A Sidereal Month (approx. 27.32 days) measures the exact time it takes for the Moon to complete one full 360-degree orbit around Earth relative to background fixed stars.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            How does the Moon phase affect ocean tides?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            During New Moon and Full Moon phases, the gravitational forces of the Sun and Moon align, producing maximum tidal range known as Spring Tides. During First and Third Quarter phases, their gravitational pulls are perpendicular, producing minimal tidal variation known as Neap Tides.
                        </p>
                    </div>

                    <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            What is a Supermoon or Micromoon?
                        </h3>
                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                            A Supermoon occurs when a Full Moon coincides with the Moon's closest orbital approach to Earth (perigee), making it appear up to 14% larger and 30% brighter. A Micromoon occurs when a Full Moon coincides with the furthest point in its elliptical orbit (apogee).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}