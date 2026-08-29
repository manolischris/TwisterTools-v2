"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Sun,
    Moon,
    Globe,
    Calendar,
    Eye,
    Compass,
    Clock,
    Search,
    Filter,
    MapPin,
    Sparkles,
    CheckCircle2,
    Copy,
    Share2,
    Info,
    BookOpen,
    HelpCircle,
    Layers,
    ShieldCheck,
    ChevronRight,
    ArrowUpRight,
    Glasses,
    Camera,
    Flame,
    History
} from "lucide-react";

export type EclipseType = "Total Solar" | "Annular Solar" | "Partial Solar" | "Hybrid Solar" | "Total Lunar" | "Partial Lunar" | "Penumbral Lunar";
export type EclipseCategory = "solar" | "lunar" | "all";

export interface EclipseEvent {
    id: string;
    name: string;
    date: string; // ISO format: YYYY-MM-DD
    type: EclipseType;
    category: "solar" | "lunar";
    sarosSeries: number;
    gamma: number;
    magnitude: number;
    maxDuration: string;
    visibilityRegions: string[];
    pathLocations: string[];
    viewingAdvice: string;
    coordinatesApprox: string;
    description: string;
}

const ECLIPSE_DATABASE: EclipseEvent[] = [
    {
        id: "2026-08-12-solar",
        name: "Total Solar Eclipse of August 12, 2026",
        date: "2026-08-12",
        type: "Total Solar",
        category: "solar",
        sarosSeries: 126,
        gamma: 0.8977,
        magnitude: 1.0386,
        maxDuration: "2m 18s",
        visibilityRegions: ["Europe", "North America", "Arctic", "Greenland", "Iceland", "Spain"],
        pathLocations: ["Greenland", "Western Iceland (Reykjavik)", "Northern & Central Spain (A Coruña, Bilbao, Zaragoza, Valencia, Palma)"],
        viewingAdvice: "Certified ISO 12312-2 solar eclipse glasses strictly mandatory during partial phases; safe to view directly ONLY during 100% totality.",
        coordinatesApprox: "65.2° N, 25.2° W (Iceland / Arctic Sea)",
        description: "The first total solar eclipse visible from continental Europe since 1999. The track crosses Greenland, west Iceland, and sweeps across northern Spain just before sunset."
    },
    {
        id: "2026-08-28-lunar",
        name: "Partial Lunar Eclipse of August 28, 2026",
        date: "2026-08-28",
        type: "Partial Lunar",
        category: "lunar",
        sarosSeries: 138,
        gamma: -0.4964,
        magnitude: 0.930,
        maxDuration: "3h 18m (Umbral)",
        visibilityRegions: ["North America", "South America", "Pacific Ocean", "Australasia", "Eastern Asia"],
        pathLocations: ["Night hemisphere spanning the Americas and Pacific Rim"],
        viewingAdvice: "100% safe to observe directly with the naked eye, binoculars, or telescopes without protective filters.",
        coordinatesApprox: "Nightside Zenith: 10.4° S, 142.1° W",
        description: "A deep partial lunar eclipse where over 90% of the Moon's disk is submerged into Earth's dark umbral shadow, creating a deep coppery red gradient."
    },
    {
        id: "2027-02-06-solar",
        name: "Annular Solar Eclipse of February 6, 2027",
        date: "2027-02-06",
        type: "Annular Solar",
        category: "solar",
        sarosSeries: 131,
        gamma: -0.8516,
        magnitude: 0.9281,
        maxDuration: "7m 51s",
        visibilityRegions: ["South America", "West Africa", "Antarctica", "Atlantic Ocean"],
        pathLocations: ["Chile (Patagonia)", "Argentina", "Uruguay", "Cote d'Ivoire", "Ghana", "Nigeria", "Benin"],
        viewingAdvice: "Continuous eye protection (ISO 12312-2) required at ALL times; the Moon does not fully cover the Sun, forming a brilliant 'Ring of Fire'.",
        coordinatesApprox: "31.3° S, 48.5° W (South Atlantic)",
        description: "A spectacular 'Ring of Fire' annular eclipse slicing through southern South America before traversing the Atlantic into western equatorial Africa."
    },
    {
        id: "2027-02-20-lunar",
        name: "Penumbral Lunar Eclipse of February 20, 2027",
        date: "2027-02-20",
        type: "Penumbral Lunar",
        category: "lunar",
        sarosSeries: 143,
        gamma: 1.048,
        magnitude: 0.952,
        maxDuration: "4h 12m",
        visibilityRegions: ["Americas", "Europe", "Africa", "Asia", "Atlantic Ocean"],
        pathLocations: ["Americas, Europe, and western Africa during Moon transit"],
        viewingAdvice: "Safe for direct viewing; subtle shading visible on the Moon's northern limb around peak maximum.",
        coordinatesApprox: "Nightside Zenith: 11.2° N, 35.8° W",
        description: "A subtle penumbral event where the Moon traverses Earth's faint outer shadow, causing a soft photographic dimming across the northern lunar terrain."
    },
    {
        id: "2027-08-02-solar",
        name: "Total Solar Eclipse of August 2, 2027 ('Eclipse of the Century')",
        date: "2027-08-02",
        type: "Total Solar",
        category: "solar",
        sarosSeries: 136,
        gamma: 0.1421,
        magnitude: 1.0790,
        maxDuration: "6m 23s",
        visibilityRegions: ["Southern Europe", "North Africa", "Middle East", "Atlantic", "Indian Ocean"],
        pathLocations: ["Southern Spain (Cadiz, Malaga)", "Gibraltar", "Morocco", "Algeria", "Tunisia", "Libya", "Egypt (Luxor)", "Saudi Arabia", "Yemen", "Somalia"],
        viewingAdvice: "Extraordinary 6-minute totality window. ISO certified glasses required for partial phases, direct observation during totality.",
        coordinatesApprox: "25.5° N, 33.2° E (Upper Egypt / Luxor)",
        description: "One of the longest total eclipses of the 21st century with over 6 minutes of totality in Egypt. Clear desert skies make this a premier astronomical destination event."
    },
    {
        id: "2027-08-17-lunar",
        name: "Penumbral Lunar Eclipse of August 17, 2027",
        date: "2027-08-17",
        type: "Penumbral Lunar",
        category: "lunar",
        sarosSeries: 148,
        gamma: -1.279,
        magnitude: 0.551,
        maxDuration: "3h 39m",
        visibilityRegions: ["Pacific Ocean", "Australasia", "Eastern Asia", "Antarctica"],
        pathLocations: ["Pacific Rim, New Zealand, Australia, Eastern Asia"],
        viewingAdvice: "Safe for naked-eye viewing; very subtle gradient detectable with binoculars or astrophotography rigs.",
        coordinatesApprox: "Nightside Zenith: 13.5° S, 169.8° E",
        description: "A minor penumbral lunar eclipse grazing the outer edge of Earth's shadow cone over the Pacific basin."
    },
    {
        id: "2028-01-26-solar",
        name: "Annular Solar Eclipse of January 26, 2028",
        date: "2028-01-26",
        type: "Annular Solar",
        category: "solar",
        sarosSeries: 141,
        gamma: -0.3901,
        magnitude: 0.9208,
        maxDuration: "10m 27s",
        visibilityRegions: ["North America", "South America", "Western Europe", "Northwest Africa"],
        pathLocations: ["Ecuador", "Peru", "Colombia", "Brazil", "French Guiana", "Portugal", "Spain (Sunset Ring)"],
        viewingAdvice: "Continuous certified solar filtering required throughout the entire 10-minute maximum ring phase.",
        coordinatesApprox: "3.0° N, 51.5° W (Equatorial Atlantic)",
        description: "An exceptionally long 'Ring of Fire' lasting over 10 minutes at maximum point, concluding with a dramatic sunset annular horizon over the Iberian Peninsula."
    },
    {
        id: "2028-07-22-solar",
        name: "Total Solar Eclipse of July 22, 2028",
        date: "2028-07-22",
        type: "Total Solar",
        category: "solar",
        sarosSeries: 146,
        gamma: -0.4252,
        magnitude: 1.0560,
        maxDuration: "5m 10s",
        visibilityRegions: ["Australasia", "Southeast Asia", "Indian Ocean", "Pacific Ocean"],
        pathLocations: ["Australia (Kimberley, Northern Territory, Queensland, Sydney Harbour)", "New Zealand (South Island, Dunedin, Queenstown)"],
        viewingAdvice: "Totality cuts directly through Sydney Harbour and Dunedin. Direct viewing permitted only during totality.",
        coordinatesApprox: "15.6° S, 126.5° E (Kimberley, Australia)",
        description: "A landmark total solar eclipse spanning across the Australian continent from the Kimberley wilderness right through Sydney Harbour before crossing New Zealand."
    },
    {
        id: "2028-12-31-lunar",
        name: "Total Lunar Eclipse of December 31, 2028 (New Year's Blood Moon)",
        date: "2028-12-31",
        type: "Total Lunar",
        category: "lunar",
        sarosSeries: 135,
        gamma: -0.3258,
        magnitude: 1.252,
        maxDuration: "1h 11m (Totality)",
        visibilityRegions: ["Europe", "Africa", "Asia", "Australasia", "North America (Alaska, Northwest)"],
        pathLocations: ["Entire Eurasian continent, Africa, Indian Ocean, Australia"],
        viewingAdvice: "Completely safe to view directly. Watch the full moon turn deep copper-red across New Year's Eve midnight.",
        coordinatesApprox: "Nightside Zenith: 23.1° N, 78.4° E (Central Asia / India)",
        description: "A dramatic New Year's Eve Blood Moon. The entire lunar surface submerges deeply into Earth's central umbra for over 70 minutes of vivid red totality."
    },
    {
        id: "2029-06-26-lunar",
        name: "Total Lunar Eclipse of June 26, 2029",
        date: "2029-06-26",
        type: "Total Lunar",
        category: "lunar",
        sarosSeries: 130,
        gamma: 0.0124,
        magnitude: 1.843,
        maxDuration: "1h 42m (Totality)",
        visibilityRegions: ["Americas", "Europe", "Africa", "Middle East", "Atlantic & Pacific Oceans"],
        pathLocations: ["Central and South America, Western Europe, Western Africa"],
        viewingAdvice: "Completely safe for direct observation, telephoto lenses, and binoculars. Near-central transit provides deep coppery-black tones.",
        coordinatesApprox: "Nightside Zenith: 23.4° S, 41.2° W (South Atlantic)",
        description: "One of the longest and darkest total lunar eclipses of the decade, featuring an extraordinary 1 hour and 42 minutes of central totality."
    },
    {
        id: "2030-06-01-solar",
        name: "Annular Solar Eclipse of June 1, 2030",
        date: "2030-06-01",
        type: "Annular Solar",
        category: "solar",
        sarosSeries: 128,
        gamma: 0.8734,
        magnitude: 0.9443,
        maxDuration: "5m 21s",
        visibilityRegions: ["Europe", "North Africa", "Middle East", "Asia", "North America (Arctic)"],
        pathLocations: ["Algeria", "Tunisia", "Libya", "Greece (Peloponnese, Athens)", "Turkey", "Russia", "Northern China", "Japan (Hokkaido)"],
        viewingAdvice: "Requires certified solar safety glasses at all times. Annular ring cuts directly across the Mediterranean, Athens, and Aegean Sea.",
        coordinatesApprox: "56.5° N, 80.1° E (Siberian Russia)",
        description: "An annular 'Golden Ring' cutting straight across North Africa, Greece, Turkey, and across Russia into Hokkaido, Japan."
    },
    {
        id: "2030-11-25-solar",
        name: "Total Solar Eclipse of November 25, 2030",
        date: "2030-11-25",
        type: "Total Solar",
        category: "solar",
        sarosSeries: 133,
        gamma: -0.7367,
        magnitude: 1.0468,
        maxDuration: "3m 44s",
        visibilityRegions: ["Southern Africa", "Australasia", "Antarctica", "Indian Ocean"],
        pathLocations: ["Namibia", "Botswana", "South Africa (Durban)", "Lesotho", "Australia (South Australia, NSW, Queensland)"],
        viewingAdvice: "ISO-compliant solar filters for partial phases; direct unassisted viewing during totality only.",
        coordinatesApprox: "43.6° S, 71.2° E (Southern Indian Ocean)",
        description: "Path makes landfall over Namibia and South Africa at morning sunrise before crossing the Southern Indian Ocean and sweeping across the Australian outback at sunset."
    }
];

export default function SolarLunarEclipseFinder() {
    // Dynamic Reference Date (Safe hydration across SSR/CSR)
    const [currentDate, setCurrentDate] = useState<Date>(() => new Date("2026-08-29"));

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    // Search, Filter & Selection State
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<EclipseCategory>("all");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [copiedInfo, setCopiedInfo] = useState<boolean>(false);

    // Dynamic Filter & Auto-Sort Pipeline (Upcoming first, then past archived)
    const filteredEclipses = useMemo(() => {
        const todayMid = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();

        const filtered = ECLIPSE_DATABASE.filter((item) => {
            const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
            const matchesType = selectedType === "all" || item.type === selectedType;
            const query = searchTerm.toLowerCase().trim();
            const matchesSearch =
                query === "" ||
                item.name.toLowerCase().includes(query) ||
                item.visibilityRegions.some((r) => r.toLowerCase().includes(query)) ||
                item.pathLocations.some((p) => p.toLowerCase().includes(query)) ||
                item.type.toLowerCase().includes(query) ||
                item.date.includes(query);

            return matchesCategory && matchesType && matchesSearch;
        });

        // Split into upcoming (future/today) and past (archived) groups
        const upcoming: EclipseEvent[] = [];
        const past: EclipseEvent[] = [];

        filtered.forEach((item) => {
            const itemTime = new Date(item.date).getTime();
            if (itemTime >= todayMid) {
                upcoming.push(item);
            } else {
                past.push(item);
            }
        });

        // Upcoming sorted ascending (soonest event first)
        upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Past sorted descending (most recently concluded first)
        past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return [...upcoming, ...past];
    }, [searchTerm, selectedCategory, selectedType, currentDate]);

    // Active Selected Event Object (Defaults to highest priority sorted item)
    const activeEvent = useMemo(() => {
        if (selectedEventId) {
            const matched = ECLIPSE_DATABASE.find((e) => e.id === selectedEventId);
            if (matched) return matched;
        }
        return filteredEclipses[0] || ECLIPSE_DATABASE[0];
    }, [selectedEventId, filteredEclipses]);

    // Calculate Days Remaining Countdown
    const countdownDetails = useMemo(() => {
        const targetDate = new Date(activeEvent.date);
        const todayMid = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const diffTime = targetDate.getTime() - todayMid.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isPast = diffDays < 0;
        return {
            diffDays: Math.abs(diffDays),
            isPast,
            isToday: diffDays === 0,
            formattedDate: targetDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            })
        };
    }, [activeEvent, currentDate]);

    // Copy Event Details
    const copyEventData = () => {
        const text = `Eclipse Event Dossier: ${activeEvent.name}
--------------------------------------------------
Date: ${activeEvent.date} (${countdownDetails.formattedDate})
Status: ${countdownDetails.isToday ? "Occurring Today!" : countdownDetails.isPast ? "Archived (Concluded)" : "Upcoming"}
Type: ${activeEvent.type} (${activeEvent.category.toUpperCase()})
Saros Series: ${activeEvent.sarosSeries} | Gamma: ${activeEvent.gamma} | Magnitude: ${activeEvent.magnitude}
Maximum Duration: ${activeEvent.maxDuration}
Key Visibility Regions: ${activeEvent.visibilityRegions.join(", ")}
Prime Path of Central Totality/Annularity: ${activeEvent.pathLocations.join(" -> ")}
Viewing & Safety Guidelines: ${activeEvent.viewingAdvice}
Coordinates / Zenith: ${activeEvent.coordinatesApprox}
Summary: ${activeEvent.description}
--------------------------------------------------
Curated via TwisterTools Eclipse Visibility Explorer`;

        navigator.clipboard.writeText(text);
        setCopiedInfo(true);
        setTimeout(() => setCopiedInfo(false), 2000);
    };

    // JSON-LD Structured Data for SEO
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Solar & Lunar Eclipse Visibility Explorer",
        "url": "https://twistertools.com/tools/date-tools/solar-lunar-eclipse-finder",
        "description": "Comprehensive astronomical database and interactive trajectory calculator for upcoming solar and lunar eclipses, totality paths, and visibility zones.",
        "applicationCategory": "EducationalApplication",
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
                "name": "What is the difference between a total, annular, and partial solar eclipse?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A total solar eclipse occurs when the Moon is close enough to Earth (perigee) that its apparent disk completely covers the Sun, exposing the solar corona. An annular solar eclipse happens when the Moon is farther away (apogee), appearing slightly smaller than the Sun and leaving a glowing 'Ring of Fire' around its silhouette. A partial solar eclipse occurs when the Sun, Moon, and Earth are not in perfect alignment, causing only a fraction of the solar disk to be obscured."
                }
            },
            {
                "@type": "Question",
                "name": "Why does the Moon turn reddish-orange during a total lunar eclipse?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "During a total lunar eclipse (commonly called a Blood Moon), Earth completely blocks direct sunlight from reaching the lunar surface. However, sunlight passes through Earth's atmosphere, which scatters shorter blue wavelengths and refracts longer red and orange wavelengths into Earth's shadow cone (the umbra). This filtered atmospheric light reflects off the lunar surface, projecting all of Earth's simultaneous sunrises and sunsets onto the Moon."
                }
            },
            {
                "@type": "Question",
                "name": "What are the essential eye safety rules for observing solar eclipses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You must NEVER look directly at the uneclipsed, partially eclipsed, or annular Sun without certified ISO 12312-2 compliant solar eclipse glasses or dedicated solar telescope filters. Standard sunglasses, polarized lenses, smoked glass, or unverified dark plastics do NOT block hazardous infrared and ultraviolet radiation. The only time direct unassisted viewing is safe is during the brief period of 100% totality in a total solar eclipse, immediately ceasing as soon as the diamond ring effect reappears."
                }
            },
            {
                "@type": "Question",
                "name": "What is a Saros Series in eclipse mechanics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Saros cycle is an astronomical periodicity of approximately 18 years, 11 days, and 8 hours (6,585.3 days) that governs the recurrence of eclipses. Eclipses belonging to the same Saros series share nearly identical orbital geometries, lunar distances, and durations, though Earth's rotation shifts each successive eclipse trajectory approximately 120 degrees westward."
                }
            },
            {
                "@type": "Question",
                "name": "When is the next major total solar eclipse visible from Europe?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The next major total solar eclipse across continental Europe occurs on August 12, 2026, traversing western Iceland and northern Spain. This is followed shortly by the August 2, 2027 'Eclipse of the Century' across southern Spain, Gibraltar, Morocco, and Egypt."
                }
            },
            {
                "@type": "Question",
                "name": "Do I need special protective filters to view a lunar eclipse?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Lunar eclipses are 100% safe to view directly with the naked eye, standard binoculars, or optical telescopes. Unlike the Sun, the Moon only reflects dim, refracted sunlight and emits no dangerous levels of radiation."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Explorer Engine, Filters & Interactive Directory */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Category Selector Tabs */}
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory("all"); setSelectedType("all"); }}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${selectedCategory === "all"
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Globe className="w-4 h-4 text-indigo-500" />
                                <span>All Eclipses</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory("solar"); setSelectedType("all"); }}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${selectedCategory === "solar"
                                    ? "bg-white text-amber-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Sun className="w-4 h-4 text-amber-500" />
                                <span>Solar ({ECLIPSE_DATABASE.filter(e => e.category === 'solar').length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory("lunar"); setSelectedType("all"); }}
                                className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${selectedCategory === "lunar"
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Moon className="w-4 h-4 text-indigo-500" />
                                <span>Lunar ({ECLIPSE_DATABASE.filter(e => e.category === 'lunar').length})</span>
                            </button>
                        </div>

                        {/* Search & Sub-Type Filtering Bar */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by country, city, continent, type, or year..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50"
                                />
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                                <span className="text-slate-500 font-bold flex items-center gap-1 flex-shrink-0">
                                    <Filter className="w-3.5 h-3.5 text-indigo-500" /> Filter:
                                </span>
                                {["all", "Total Solar", "Annular Solar", "Total Lunar", "Partial Lunar"].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSelectedType(type)}
                                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap transition cursor-pointer ${selectedType === type
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            }`}
                                    >
                                        {type === "all" ? "All Subtypes" : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Eclipses Chronological Master List */}
                        <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 p-1">
                            {filteredEclipses.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <p className="text-sm font-semibold text-slate-600">No matching eclipses found</p>
                                    <p className="text-xs text-slate-400">Try broadening your search query or switching category filters.</p>
                                </div>
                            ) : (
                                filteredEclipses.map((item) => {
                                    const isSelected = item.id === activeEvent.id;
                                    const isSolar = item.category === "solar";
                                    const itemTime = new Date(item.date).getTime();
                                    const todayMid = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
                                    const isPastEvent = itemTime < todayMid;

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedEventId(item.id)}
                                            className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${isSelected
                                                ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400"
                                                : isPastEvent
                                                    ? "bg-slate-50/40 border-slate-200/60 opacity-75 hover:opacity-100 hover:bg-slate-50"
                                                    : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`p-1.5 rounded-lg text-xs ${isSolar ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                                                        }`}>
                                                        {isSolar ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {isPastEvent && (
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <History className="w-3 h-3" /> Archived
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.type.includes("Total")
                                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                                        : item.type.includes("Annular")
                                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                                            : "bg-slate-100 text-slate-700 border-slate-200"
                                                        }`}>
                                                        {item.type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                                <span className="flex items-center gap-1 font-mono">
                                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                                    {item.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {item.maxDuration}
                                                </span>
                                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                                    {item.visibilityRegions[0]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                    </div>

                    {/* Left Footer System Summary Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Active Dataset: 2026–2030 Ephemeris
                        </span>
                        <span className="font-semibold text-indigo-600">Auto-Sorted Chronology</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Active Eclipse Dossier & Observational Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Header Badge & Title */}
                        <div className="space-y-2 border-b border-slate-100 pb-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${activeEvent.category === "solar"
                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                        : "bg-indigo-50 text-indigo-800 border-indigo-200"
                                        }`}>
                                        {activeEvent.category === "solar" ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                                        {activeEvent.type}
                                    </span>
                                    {countdownDetails.isPast && (
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                            <History className="w-3.5 h-3.5 text-slate-500" /> Concluded
                                        </span>
                                    )}
                                </div>

                                <span className="text-xs font-bold font-mono text-slate-500">
                                    Saros {activeEvent.sarosSeries}
                                </span>
                            </div>

                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                                {activeEvent.name}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                {activeEvent.description}
                            </p>
                        </div>

                        {/* Days Countdown & Status Display Box */}
                        <div className="p-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm space-y-3">
                            <div className="flex items-center justify-between text-xs text-indigo-200 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    Astronomical Calendar Horizon
                                </span>
                                <span>{countdownDetails.formattedDate}</span>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                                    {countdownDetails.diffDays}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-slate-300">
                                    {countdownDetails.isToday
                                        ? "maximum eclipse occurs today!"
                                        : countdownDetails.isPast
                                            ? "days elapsed since event"
                                            : "days until eclipse maximum"}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                                <div>
                                    <span className="text-slate-400 block">Peak Totality</span>
                                    <span className="font-bold text-amber-300 font-mono">{activeEvent.maxDuration}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Magnitude</span>
                                    <span className="font-bold text-indigo-300 font-mono">{activeEvent.magnitude.toFixed(4)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block">Gamma Val</span>
                                    <span className="font-bold text-slate-200 font-mono">{activeEvent.gamma.toFixed(4)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Visibility and Path Matrix */}
                        <div className="space-y-4">
                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    Central Path of Totality / Maximum Obscuration
                                </span>
                                <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5">
                                    {activeEvent.pathLocations.map((loc, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                                            <span className="font-medium">{loc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                    Broader Continental Visibility Zones
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeEvent.visibilityRegions.map((region, idx) => (
                                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                                            {region}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3.5 border border-indigo-100 rounded-xl bg-indigo-50/40 space-y-2">
                                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <Glasses className="w-3.5 h-3.5 text-indigo-600" />
                                    Observational Safety & Optical Protocol
                                </span>
                                <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
                                    {activeEvent.viewingAdvice}
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Copy and Export Action Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={copyEventData}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedInfo ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedInfo ? "Eclipse Dossier Copied to Clipboard!" : "Copy Full Eclipse Metadata & Coordinates"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Astronomical Mechanics & Eclipse Typology */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Solar and Lunar Eclipse Mechanics: Orbital Syzygy and Shadow Geometry
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An eclipse is an astronomical event occurring when three celestial bodies—the Sun, Earth, and Moon—align in a straight line, a configuration known mathematically as <strong>syzygy</strong>. Because the Moon&apos;s orbital plane around Earth is tilted by approximately 5.14 degrees relative to Earth&apos;s ecliptic plane around the Sun, eclipses do not happen every month. They occur exclusively during eclipse seasons (approximately every 173.3 days), when the Moon crosses the ecliptic nodes during either a New Moon (Solar Eclipse) or Full Moon (Lunar Eclipse).
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Classification I</span>
                            <h3 className="font-bold text-slate-900 text-sm">Total Solar Eclipse</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Occurs when the Moon is at perigee, completely obstructing the solar photosphere and unveiling the delicate solar corona in total midday darkness.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Classification II</span>
                            <h3 className="font-bold text-slate-900 text-sm">Annular Solar Eclipse</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Takes place when the Moon is near apogee. Its apparent diameter is smaller than the Sun, creating a radiant &quot;Ring of Fire&quot; or antumbra cone.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Classification III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Total Lunar (Blood Moon)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Earth passes directly between the Sun and Full Moon. Refracted atmospheric sunlight bathes the submerged lunar surface in rich coppery crimson hues.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Upcoming Major Eclipses (2026-2030) Comprehensive Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Global Eclipse Ephemeris Matrix: 2026 – 2030 Schedule
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below details confirmed astronomical ephemeris data for upcoming solar and lunar eclipses, including duration of totality, magnitude index, Saros series identifiers, and primary geographic visibility corridors.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Calendar Date</th>
                                    <th className="p-3">Eclipse Type</th>
                                    <th className="p-3">Saros / Gamma</th>
                                    <th className="p-3">Max Duration</th>
                                    <th className="p-3">Primary Path of Central Totality / Visibility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2026-08-12</td>
                                    <td className="p-3 text-amber-600 font-bold">Total Solar</td>
                                    <td className="p-3 font-mono text-xs">Saros 126 (0.898)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">2m 18s</td>
                                    <td className="p-3 text-xs text-slate-600">Greenland, Western Iceland (Reykjavik), Northern & Eastern Spain (Bilbao, Zaragoza, Valencia, Palma)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2026-08-28</td>
                                    <td className="p-3 text-indigo-600 font-bold">Partial Lunar</td>
                                    <td className="p-3 font-mono text-xs">Saros 138 (-0.496)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">3h 18m (Umbral)</td>
                                    <td className="p-3 text-xs text-slate-600">North & South America, Pacific Ocean, Australasia, Eastern Asia (93% disk immersion)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2027-02-06</td>
                                    <td className="p-3 text-amber-600 font-bold">Annular Solar</td>
                                    <td className="p-3 font-mono text-xs">Saros 131 (-0.852)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">7m 51s</td>
                                    <td className="p-3 text-xs text-slate-600">Patagonian Chile, Argentina, Uruguay, Cote d&apos;Ivoire, Ghana, Nigeria, Benin</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2027-08-02</td>
                                    <td className="p-3 text-rose-600 font-bold">Total Solar (Century Eclipse)</td>
                                    <td className="p-3 font-mono text-xs">Saros 136 (0.142)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">6m 23s</td>
                                    <td className="p-3 text-xs text-slate-600">Southern Spain (Cadiz, Malaga), Gibraltar, Morocco, Algeria, Tunisia, Libya, Egypt (Luxor), Saudi Arabia</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2028-01-26</td>
                                    <td className="p-3 text-amber-600 font-bold">Annular Solar</td>
                                    <td className="p-3 font-mono text-xs">Saros 141 (-0.390)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">10m 27s</td>
                                    <td className="p-3 text-xs text-slate-600">Ecuador, Peru, Colombia, Brazil, French Guiana, Portugal, Spain (Sunset Ring of Fire)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2028-07-22</td>
                                    <td className="p-3 text-amber-600 font-bold">Total Solar</td>
                                    <td className="p-3 font-mono text-xs">Saros 146 (-0.425)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">5m 10s</td>
                                    <td className="p-3 text-xs text-slate-600">Australia (Kimberley, Sydney Harbour, NSW), New Zealand (South Island, Dunedin, Queenstown)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-slate-900">2028-12-31</td>
                                    <td className="p-3 text-indigo-600 font-bold">Total Lunar (NYE Blood Moon)</td>
                                    <td className="p-3 font-mono text-xs">Saros 135 (-0.326)</td>
                                    <td className="p-3 font-mono text-indigo-600 font-bold">1h 11m (Totality)</td>
                                    <td className="p-3 text-xs text-slate-600">Europe, Africa, Asia, Australasia, Northwest North America (Midnight Lunar Totality)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Eye Safety, Optical Filters & Astrophotography Guidelines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Certified Safety Protocols & Astrophotography Best Practices
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Observing solar phenomena requires strict adherence to international optical standards to prevent irreversible retinal damage known as solar retinopathy.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Glasses className="w-4 h-4 text-indigo-600" /> ISO 12312-2 Standard Solar Filters
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Always ensure your solar eclipse glasses are manufactured to the ISO 12312-2 safety standard. Inspect the lenses for punctures, scratches, or separation before use. Regular sunglasses and polarization filters provide zero protection against harmful infrared wavelengths.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Camera className="w-4 h-4 text-indigo-600" /> Sensor & Lens Protection
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When photographing a solar eclipse with DSLRs, mirrorless bodies, or telephoto lenses, place a certified front-element solar filter over the outer optic. Never look through an unshielded optical viewfinder, as the concentrated focal beam will instantaneously cause severe eye injury.
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
                                What is the difference between a total, annular, and partial solar eclipse?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A total solar eclipse occurs when the Moon is close enough to Earth (perigee) that its apparent disk completely covers the Sun, exposing the solar corona. An annular solar eclipse happens when the Moon is farther away (apogee), appearing slightly smaller than the Sun and leaving a glowing &quot;Ring of Fire&quot; around its silhouette. A partial solar eclipse occurs when the Sun, Moon, and Earth are not in perfect alignment, causing only a fraction of the solar disk to be obscured.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does the Moon turn reddish-orange during a total lunar eclipse?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                During a total lunar eclipse (commonly called a Blood Moon), Earth completely blocks direct sunlight from reaching the lunar surface. However, sunlight passes through Earth&apos;s atmosphere, which scatters shorter blue wavelengths and refracts longer red and orange wavelengths into Earth&apos;s shadow cone (the umbra). This filtered atmospheric light reflects off the lunar surface, projecting all of Earth&apos;s simultaneous sunrises and sunsets onto the Moon.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the essential eye safety rules for observing solar eclipses?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You must NEVER look directly at the uneclipsed, partially eclipsed, or annular Sun without certified ISO 12312-2 compliant solar eclipse glasses or dedicated solar telescope filters. Standard sunglasses, polarized lenses, smoked glass, or unverified dark plastics do NOT block hazardous infrared and ultraviolet radiation. The only time direct unassisted viewing is safe is during the brief period of 100% totality in a total solar eclipse, immediately ceasing as soon as the diamond ring effect reappears.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a Saros Series in eclipse mechanics?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Saros cycle is an astronomical periodicity of approximately 18 years, 11 days, and 8 hours (6,585.3 days) that governs the recurrence of eclipses. Eclipses belonging to the same Saros series share nearly identical orbital geometries, lunar distances, and durations, though Earth&apos;s rotation shifts each successive eclipse trajectory approximately 120 degrees westward.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is the next major total solar eclipse visible from Europe?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The next major total solar eclipse across continental Europe occurs on August 12, 2026, traversing western Iceland and northern Spain. This is followed shortly by the August 2, 2027 &quot;Eclipse of the Century&quot; across southern Spain, Gibraltar, Morocco, and Egypt.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Do I need special protective filters to view a lunar eclipse?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Lunar eclipses are 100% safe to view directly with the naked eye, standard binoculars, or optical telescopes. Unlike the Sun, the Moon only reflects dim, refracted sunlight and emits no dangerous levels of radiation.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}