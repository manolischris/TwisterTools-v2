"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    Sun,
    Compass,
    MapPin,
    Calendar,
    Clock,
    Globe,
    Sunrise,
    Sunset,
    RotateCcw,
    Copy,
    CheckCircle2,
    SlidersHorizontal,
    Info,
    BookOpen,
    Layers,
    Activity,
    CheckSquare,
    HelpCircle,
    ArrowUpRight,
    Sparkles,
    ShieldCheck,
    Navigation
} from "lucide-react";

interface CityPreset {
    name: string;
    latitude: number;
    longitude: number;
    timezoneOffset: number; // in hours from UTC
}

const PRESET_CITIES: CityPreset[] = [
    { name: "Greenwich / London, UK", latitude: 51.48, longitude: 0.0, timezoneOffset: 0 },
    { name: "New York City, USA", latitude: 40.7128, longitude: -74.006, timezoneOffset: -5 },
    { name: "San Francisco, USA", latitude: 37.7749, longitude: -122.4194, timezoneOffset: -8 },
    { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503, timezoneOffset: 9 },
    { name: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093, timezoneOffset: 10 },
    { name: "Cairo, Egypt", latitude: 30.0444, longitude: 31.2357, timezoneOffset: 2 },
    { name: "São Paulo, Brazil", latitude: -23.5505, longitude: -46.6333, timezoneOffset: -3 },
    { name: "Reykjavik, Iceland", latitude: 64.1466, longitude: -21.9426, timezoneOffset: 0 },
    { name: "Quito (Equator), Ecuador", latitude: -0.1807, longitude: -78.4678, timezoneOffset: -5 },
    { name: "Dubai, UAE", latitude: 25.2048, longitude: 55.2708, timezoneOffset: 4 }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min = -180,
    max = 180,
    allowDecimals = true
) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(0);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

export default function SolarNoonCalculator() {
    // Inputs: Date, Latitude, Longitude, UTC Offset, Evaluation Time (HH:mm)
    const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
    const [latitude, setLatitude] = useState<number>(40.7128);
    const [longitude, setLongitude] = useState<number>(-74.006);
    const [utcOffset, setUtcOffset] = useState<number>(-5);
    const [timeString, setTimeString] = useState<string>("12:00");
    const [useCurrentTime, setUseCurrentTime] = useState<boolean>(true);

    // Feedback States
    const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
    const [geoLocating, setGeoLocating] = useState<boolean>(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    // Keep current time updated if active
    useEffect(() => {
        if (!useCurrentTime) return;
        const updateNow = () => {
            const d = new Date();
            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            setTimeString(`${hours}:${minutes}`);
        };
        updateNow();
        const interval = setInterval(updateNow, 60000);
        return () => clearInterval(interval);
    }, [useCurrentTime]);

    // Handle Geolocation API
    const handleUseMyLocation = () => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser.");
            return;
        }
        setGeoLocating(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
                setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
                const offsetHours = -new Date().getTimezoneOffset() / 60;
                setUtcOffset(offsetHours);
                setGeoLocating(false);
            },
            (err) => {
                setGeoError(`Location access denied: ${err.message}`);
                setGeoLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Preset selection handler
    const applyCityPreset = (city: CityPreset) => {
        setLatitude(city.latitude);
        setLongitude(city.longitude);
        setUtcOffset(city.timezoneOffset);
    };

    // Astronomy Calculations (NOAA Solar Position Algorithm Approximation)
    const solarCalculations = useMemo(() => {
        const dateObj = new Date(selectedDate + "T12:00:00Z");
        const startOfYear = new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 1));
        const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const year = dateObj.getUTCFullYear();
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const totalDaysInYear = isLeap ? 366 : 365;

        // Fractional year in radians (gamma)
        const gamma = (2 * Math.PI / totalDaysInYear) * (dayOfYear - 1 + ((12 - 12) / 24));

        // Equation of Time (EoT) in minutes (Spencer 1971 / NOAA)
        const eqtime = 229.18 * (
            0.000075 +
            0.001868 * Math.cos(gamma) -
            0.032077 * Math.sin(gamma) -
            0.014615 * Math.cos(2 * gamma) -
            0.040849 * Math.sin(2 * gamma)
        );

        // Solar Declination (delta) in radians & degrees
        const decl = 0.006918 -
            0.399912 * Math.cos(gamma) +
            0.070257 * Math.sin(gamma) -
            0.006758 * Math.cos(2 * gamma) +
            0.000907 * Math.sin(2 * gamma) -
            0.002697 * Math.cos(3 * gamma) +
            0.00148 * Math.sin(3 * gamma);
        const declDeg = decl * (180 / Math.PI);

        // Solar Noon in minutes from local midnight
        // Solar Noon = 720 - 4*longitude - eqtime + utcOffset*60
        const solarNoonMinutes = 720 - (4 * longitude) - eqtime + (utcOffset * 60);

        const formatMinutesToTime = (totalMin: number) => {
            let normalized = (totalMin % 1440 + 1440) % 1440;
            const hrs = Math.floor(normalized / 60);
            const mins = Math.floor(normalized % 60);
            const secs = Math.floor((normalized * 60) % 60);
            const period = hrs >= 12 ? "PM" : "AM";
            const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
            const str24 = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
            const str12 = `${displayHrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} ${period}`;
            return { str24, str12, rawMinutes: totalMin };
        };

        const solarNoonFormatted = formatMinutesToTime(solarNoonMinutes);

        // Solar Noon Altitude and Zenith at local culmination
        const latRad = latitude * (Math.PI / 180);
        const solarNoonZenithAngle = Math.abs(latitude - declDeg);
        const solarNoonElevation = Math.max(0, 90 - solarNoonZenithAngle);

        // Sunrise and Sunset calculation (Standard atmospheric refraction: zenith = 90.833 deg)
        const zenithRad = 90.833 * (Math.PI / 180);
        const cosHourAngle = (Math.cos(zenithRad) - (Math.sin(latRad) * Math.sin(decl))) / (Math.cos(latRad) * Math.cos(decl));

        let sunriseMinutes: number | null = null;
        let sunsetMinutes: number | null = null;
        let daylightMinutes = 0;
        let polarCondition: "none" | "polar_day" | "polar_night" = "none";

        if (cosHourAngle > 1) {
            polarCondition = "polar_night"; // Sun never rises
        } else if (cosHourAngle < -1) {
            polarCondition = "polar_day"; // Sun never sets (Midnight Sun)
            daylightMinutes = 1440;
        } else {
            const hourAngleDeg = Math.acos(cosHourAngle) * (180 / Math.PI);
            const hourAngleMinutes = hourAngleDeg * 4;
            sunriseMinutes = solarNoonMinutes - hourAngleMinutes;
            sunsetMinutes = solarNoonMinutes + hourAngleMinutes;
            daylightMinutes = hourAngleMinutes * 2;
        }

        const sunriseFormatted = sunriseMinutes !== null ? formatMinutesToTime(sunriseMinutes) : null;
        const sunsetFormatted = sunsetMinutes !== null ? formatMinutesToTime(sunsetMinutes) : null;

        const daylightHours = Math.floor(daylightMinutes / 60);
        const daylightRemMinutes = Math.floor(daylightMinutes % 60);

        // Instantaneous Position for Selected Evaluation Time
        const [evalH, evalM] = timeString.split(":").map(Number);
        const currentLocalMinutes = (evalH || 0) * 60 + (evalM || 0);

        // True Solar Time (TST) in minutes
        // TST = LocalTime + EoT + 4*Longitude - 60*utcOffset
        const trueSolarTimeMinutes = currentLocalMinutes + eqtime + (4 * longitude) - (60 * utcOffset);
        const trueSolarTimeFormatted = formatMinutesToTime(trueSolarTimeMinutes);

        // Hour Angle (H) in degrees: H = (TST / 4) - 180
        const hourAngleInstantDeg = (trueSolarTimeMinutes / 4) - 180;
        const hourAngleInstantRad = hourAngleInstantDeg * (Math.PI / 180);

        // Solar Zenith Angle (theta)
        const cosZenith = (Math.sin(latRad) * Math.sin(decl)) + (Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngleInstantRad));
        const clampedCosZenith = Math.min(1, Math.max(-1, cosZenith));
        const instantZenithRad = Math.acos(clampedCosZenith);
        const instantZenithDeg = instantZenithRad * (180 / Math.PI);

        // Solar Elevation / Altitude Angle (alpha = 90 - theta)
        const instantElevationDeg = 90 - instantZenithDeg;

        // Solar Azimuth Angle (phi)
        // Measured from North (0° = North, 90° = East, 180° = South, 270° = West)
        const sinElevation = Math.sin(instantElevationDeg * (Math.PI / 180));
        const cosElevation = Math.cos(instantElevationDeg * (Math.PI / 180));

        let instantAzimuthDeg = 180;
        if (cosElevation > 0.0001) {
            const cosAzimuth = (Math.sin(decl) - (Math.sin(latRad) * sinElevation)) / (Math.cos(latRad) * cosElevation);
            const clampedCosAz = Math.min(1, Math.max(-1, cosAzimuth));
            const rawAzimuth = Math.acos(clampedCosAz) * (180 / Math.PI);

            if (hourAngleInstantDeg > 0) {
                instantAzimuthDeg = (360 - rawAzimuth) % 360;
            } else {
                instantAzimuthDeg = rawAzimuth % 360;
            }
        }

        // Compass Cardinal Direction Helper
        const getCompassDirection = (deg: number) => {
            const cardinals = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            const index = Math.round(deg / 22.5) % 16;
            return cardinals[index];
        };

        // Shadow Length Ratio: Shadow Length / Object Height = cot(elevation) = 1 / tan(elevation)
        const shadowRatio = instantElevationDeg > 0 ? 1 / Math.tan(instantElevationDeg * (Math.PI / 180)) : null;

        // Optimal Fixed PV Solar Tilt (approx = latitude - (declination / 2))
        const recommendedFixedPvTilt = Math.max(0, Math.min(90, Math.abs(latitude) * 0.87));

        return {
            dayOfYear,
            equationOfTimeMin: eqtime,
            solarDeclinationDeg: declDeg,
            solarNoon: solarNoonFormatted,
            solarNoonZenithAngle,
            solarNoonElevation,
            sunrise: sunriseFormatted,
            sunset: sunsetFormatted,
            daylightHours,
            daylightRemMinutes,
            polarCondition,
            trueSolarTime: trueSolarTimeFormatted,
            instantElevationDeg,
            instantZenithDeg,
            instantAzimuthDeg,
            instantCompass: getCompassDirection(instantAzimuthDeg),
            shadowRatio,
            recommendedFixedPvTilt
        };
    }, [selectedDate, latitude, longitude, utcOffset, timeString]);

    // Copy formatted report to clipboard
    const copyCalculationReport = () => {
        const text = `Solar Noon, Zenith & Sun Path Calculations
--------------------------------------------------
Target Location: Lat ${latitude.toFixed(4)}°, Lon ${longitude.toFixed(4)}° (UTC ${utcOffset >= 0 ? `+${utcOffset}` : utcOffset})
Date of Observation: ${selectedDate} (Day of Year: ${solarCalculations.dayOfYear})
Local Time Evaluated: ${timeString} (True Solar Time: ${solarCalculations.trueSolarTime.str12})
--------------------------------------------------
Solar Culmination & Path Metrics:
 - Exact Solar Noon: ${solarCalculations.solarNoon.str12} (${solarCalculations.solarNoon.str24})
 - Solar Noon Max Elevation: ${solarCalculations.solarNoonElevation.toFixed(2)}°
 - Solar Noon Zenith Angle: ${solarCalculations.solarNoonZenithAngle.toFixed(2)}°
 - Equation of Time (EoT): ${solarCalculations.equationOfTimeMin.toFixed(2)} minutes
 - Solar Declination (δ): ${solarCalculations.solarDeclinationDeg.toFixed(2)}°

Sunrise & Day Length:
 - Sunrise: ${solarCalculations.sunrise ? solarCalculations.sunrise.str12 : solarCalculations.polarCondition}
 - Sunset: ${solarCalculations.sunset ? solarCalculations.sunset.str12 : solarCalculations.polarCondition}
 - Total Daylight Window: ${solarCalculations.daylightHours}h ${solarCalculations.daylightRemMinutes}m

Instantaneous Sun Angles (at ${timeString}):
 - Solar Altitude / Elevation: ${solarCalculations.instantElevationDeg.toFixed(2)}° (${solarCalculations.instantElevationDeg > 0 ? "Sun Above Horizon" : "Sun Below Horizon"})
 - Solar Zenith Angle: ${solarCalculations.instantZenithDeg.toFixed(2)}°
 - Solar Azimuth Angle: ${solarCalculations.instantAzimuthDeg.toFixed(2)}° (${solarCalculations.instantCompass})
 - Shadow Multiplier (L/H): ${solarCalculations.shadowRatio !== null ? `${solarCalculations.shadowRatio.toFixed(2)}x object height` : "N/A (Night)"}
 - Optimal Fixed PV Panel Tilt: ~${solarCalculations.recommendedFixedPvTilt.toFixed(1)}°
--------------------------------------------------
Generated by TwisterTools Solar Noon & Sun Path Estimator`;

        navigator.clipboard.writeText(text);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
    };

    // Structured JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Solar Noon, Solar Zenith & Sun Path Angle Estimator",
        "url": "https://twistertools.com/tools/date-tools/solar-noon-angle-calculator",
        "description": "High-precision solar position, solar noon culmination, solar zenith angle, azimuth, and sun path calculator using standard NOAA astronomical algorithms.",
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
                "name": "What is Solar Noon and why does it rarely match 12:00 PM on a clock?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Solar noon (solar culmination) is the exact moment the sun crosses the local celestial meridian and reaches its highest elevation in the sky for the day. It rarely matches 12:00 PM on standard clocks due to two main factors: your geographic distance from your time zone's central meridian, and the Equation of Time (orbital eccentricity and Earth's 23.44° axial tilt)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Solar Zenith Angle and Solar Elevation (Altitude)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Solar Elevation (Altitude) is the angular height of the sun measured upwards from the true horizon (0° at horizon, 90° straight up). The Solar Zenith Angle is the angular distance from directly overhead (the zenith, 0°) down to the sun. They are complementary angles: Zenith Angle = 90° - Solar Elevation."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Equation of Time (EoT) affect solar time calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Equation of Time accounts for Earth's elliptical orbit around the sun (varying orbital velocity) and the obliquity of the ecliptic. It causes apparent solar time to drift ahead of or behind mean clock time by up to +16 minutes (in early November) to -14 minutes (in mid-February)."
                }
            },
            {
                "@type": "Question",
                "name": "How do solar azimuth and elevation angles impact solar PV panel placement?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Solar panels generate maximum electrical power when sunlight strikes the photovoltaic cells perpendicularly (at a 90° angle of incidence). Calculating seasonal solar noon zenith and daily azimuth paths allows engineers to determine the ideal fixed tilt angle (typically close to local latitude) and orientation (true South in Northern Hemisphere, true North in Southern Hemisphere)."
                }
            },
            {
                "@type": "Question",
                "name": "How is shadow length calculated from the solar elevation angle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Shadow length is calculated using the cotangent of the solar elevation angle: Shadow Length = Object Height / tan(Solar Elevation). When the sun is at 45° elevation, shadow length equals object height (1.0x). At low sun angles (e.g., 10°), shadows stretch to over 5.67 times the object's height."
                }
            },
            {
                "@type": "Question",
                "name": "What causes the solar declination angle to change throughout the year?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Earth rotates on an axis tilted by 23.44° relative to its orbital plane around the Sun. As Earth orbits the Sun, the subsolar point migrates between +23.44° (Tropic of Cancer during June Solstice) and -23.44° (Tropic of Capricorn during December Solstice), passing 0° at the equinoxes."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Structured Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Location, Date & Solar Parameter Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Panel Header */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                                Astronomical Observer Settings
                            </span>
                            <button
                                type="button"
                                onClick={handleUseMyLocation}
                                disabled={geoLocating}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center gap-1.5 transition border border-indigo-200 cursor-pointer disabled:opacity-50"
                            >
                                <Navigation className="w-3.5 h-3.5" />
                                <span>{geoLocating ? "Locating..." : "Use My GPS Coordinates"}</span>
                            </button>
                        </div>

                        {geoError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                                {geoError}
                            </div>
                        )}

                        {/* City Quick Select Presets */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Quick Geographic Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {PRESET_CITIES.map((c) => {
                                    const isSelected = Math.abs(latitude - c.latitude) < 0.01 && Math.abs(longitude - c.longitude) < 0.01;
                                    return (
                                        <button
                                            key={c.name}
                                            type="button"
                                            onClick={() => applyCityPreset(c)}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition border cursor-pointer truncate ${isSelected
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            {c.name.split(",")[0]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Date & Time Configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                    Observation Date
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                        Local Evaluation Time
                                    </label>
                                    <label className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useCurrentTime}
                                            onChange={(e) => setUseCurrentTime(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-indigo-600"
                                        />
                                        Live Clock
                                    </label>
                                </div>
                                <input
                                    type="time"
                                    value={timeString}
                                    disabled={useCurrentTime}
                                    onChange={(e) => setTimeString(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                                />
                            </div>
                        </div>

                        {/* Coordinates & Timezone Offset */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Latitude (°N/S)</span>
                                    <span className="text-[10px] text-slate-400 font-mono">-90 to +90</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={latitude}
                                    onChange={(e) => handleNumberInput(e, setLatitude, -90, 90, true)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>Longitude (°E/W)</span>
                                    <span className="text-[10px] text-slate-400 font-mono">-180 to +180</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={longitude}
                                    onChange={(e) => handleNumberInput(e, setLongitude, -180, 180, true)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                                    <span>UTC Offset (hrs)</span>
                                    <span className="text-[10px] text-slate-400 font-mono">-12 to +14</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={utcOffset}
                                    onChange={(e) => handleNumberInput(e, setUtcOffset, -12, 14, true)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Astronomical Constants Readout */}
                        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Orbital & Solar Ephemeris Constants
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Day of Year:</span>
                                    <span className="font-mono font-bold text-slate-900">Day {solarCalculations.dayOfYear} of 365</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Equation of Time (EoT):</span>
                                    <span className="font-mono font-bold text-indigo-600">
                                        {solarCalculations.equationOfTimeMin > 0 ? "+" : ""}
                                        {solarCalculations.equationOfTimeMin.toFixed(2)} min
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Solar Declination (δ):</span>
                                    <span className="font-mono font-bold text-slate-900">{solarCalculations.solarDeclinationDeg.toFixed(2)}°</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Reset Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDate(new Date().toISOString().split("T")[0]);
                                setLatitude(40.7128);
                                setLongitude(-74.006);
                                setUtcOffset(-5);
                                setUseCurrentTime(true);
                            }}
                            className="text-slate-600 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset to Default (NYC Equinox)
                        </button>
                        <span className="font-semibold text-emerald-600">NOAA Algorithm Standard</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-time Solar Angle Gauges & Calculations */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Solar Noon Culmination Hero Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                    <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: "20s" }} />
                                    <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                                        Solar Noon (Culmination)
                                    </span>
                                </div>
                                <span className="text-xs font-mono bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700/50">
                                    True Local Transit
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                                        {solarCalculations.solarNoon.str12.split(" ")[0]}
                                    </span>
                                    <span className="text-sm font-bold text-amber-400 ml-1.5">
                                        {solarCalculations.solarNoon.str12.split(" ")[1]}
                                    </span>
                                    <span className="text-[11px] text-indigo-300 block font-mono mt-0.5">
                                        {solarCalculations.solarNoon.str24} (24h Clock)
                                    </span>
                                </div>

                                <div className="space-y-1 text-right">
                                    <div className="text-xs text-indigo-200">
                                        Peak Altitude: <span className="font-mono font-bold text-white text-sm">{solarCalculations.solarNoonElevation.toFixed(2)}°</span>
                                    </div>
                                    <div className="text-xs text-indigo-200">
                                        Min Zenith: <span className="font-mono font-bold text-white text-sm">{solarCalculations.solarNoonZenithAngle.toFixed(2)}°</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Real-time Angular Matrix Gauges */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Solar Elevation */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Solar Altitude / Elevation (α)
                                </span>
                                <div className="text-2xl font-black text-indigo-600 font-mono">
                                    {solarCalculations.instantElevationDeg.toFixed(1)}°
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 block truncate">
                                    {solarCalculations.instantElevationDeg > 0 ? "Above Horizon" : "Below Horizon (Night)"}
                                </span>
                            </div>

                            {/* Solar Zenith */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Solar Zenith Angle (θ)
                                </span>
                                <div className="text-2xl font-black text-slate-800 font-mono">
                                    {solarCalculations.instantZenithDeg.toFixed(1)}°
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 block truncate">
                                    From Direct Overhead
                                </span>
                            </div>

                            {/* Solar Azimuth */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-center col-span-2 sm:col-span-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Solar Azimuth Angle (Φ)
                                </span>
                                <div className="text-2xl font-black text-amber-600 font-mono">
                                    {solarCalculations.instantAzimuthDeg.toFixed(1)}°
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 block truncate">
                                    Heading: {solarCalculations.instantCompass} (from North)
                                </span>
                            </div>
                        </div>

                        {/* Sunlight Window & Sunrise / Sunset Times */}
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sunrise className="w-4 h-4 text-amber-500" />
                                    Diurnal Solar Cycle
                                </span>
                                <span className="text-xs font-mono font-bold text-indigo-600">
                                    {solarCalculations.daylightHours}h {solarCalculations.daylightRemMinutes}m Daylight
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5">
                                    <Sunrise className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Sunrise</span>
                                        <span className="font-mono font-bold text-slate-900">
                                            {solarCalculations.sunrise ? solarCalculations.sunrise.str12 : "Polar Condition"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5">
                                    <Sunset className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <div>
                                        <span className="text-slate-400 block text-[10px]">Sunset</span>
                                        <span className="font-mono font-bold text-slate-900">
                                            {solarCalculations.sunset ? solarCalculations.sunset.str12 : "Polar Condition"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Engineering & Photovoltaic Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide block">
                                    Shadow Multiplier (L/H)
                                </span>
                                <div className="text-lg font-black text-indigo-700 font-mono">
                                    {solarCalculations.shadowRatio !== null ? `${solarCalculations.shadowRatio.toFixed(2)}x` : "N/A (Night)"}
                                </div>
                                <span className="text-[10px] text-slate-600 block">
                                    Shadow Length ÷ Height
                                </span>
                            </div>

                            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide block">
                                    Optimal Fixed PV Tilt
                                </span>
                                <div className="text-lg font-black text-indigo-700 font-mono">
                                    ~{solarCalculations.recommendedFixedPvTilt.toFixed(1)}°
                                </div>
                                <span className="text-[10px] text-slate-600 block">
                                    Facing {latitude >= 0 ? "South (180°)" : "North (0°)"}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Copy Full Report Action Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={copyCalculationReport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedSummary ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedSummary ? "Solar Angles Copied to Clipboard!" : "Copy Full Solar Ephemeris Report"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Solar Noon Mechanics & Ephemeris Science */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sun className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Solar Noon, Solar Zenith, and True Solar Time
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Solar noon, also referred to as solar culmination or midday transit, is the exact astronomical moment when the Sun crosses the observer&apos;s local celestial meridian. At this precise point in time, the Sun reaches its maximum daily elevation angle above the horizon, casts the shortest shadow of the daylight cycle, and indicates true astronomical South (in the Northern Hemisphere) or true North (in the Southern Hemisphere).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Contrary to common belief, solar noon almost never coincides exactly with 12:00:00 PM on a standard civil clock. Civil standard time divides the globe into standardized 15-degree longitudinal bands (time zones) and frequently enforces Daylight Saving Time (DST). Consequently, an observer situated on the eastern or western perimeter of a time zone can experience solar noon up to 45 to 60 minutes before or after 12:00 PM clock time.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept I</span>
                            <h3 className="font-bold text-slate-900 text-sm">The Local Meridian</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The imaginary great circle passing through the celestial poles and the observer&apos;s zenith. When the subsolar point crosses this line, solar noon occurs.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept II</span>
                            <h3 className="font-bold text-slate-900 text-sm">The Zenith Angle</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The angle measured from directly overhead (90° vertical) down to the sun. At solar culmination, the zenith angle reaches its minimum daily value.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">Concept III</span>
                            <h3 className="font-bold text-slate-900 text-sm">Solar Declination (δ)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The latitude on Earth where the Sun is directly overhead at noon, oscillating between +23.44° (summer solstice) and -23.44° (winter solstice).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Mathematical Formulations & Algorithms Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Astronomical Formulas & NOAA Solar Position Calculations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This calculator implements standard astronomical equations developed by the National Oceanic and Atmospheric Administration (NOAA) and Jean Meeus to determine solar coordinates with sub-minute precision:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Variable</th>
                                    <th className="p-3">Standard Mathematical Formula</th>
                                    <th className="p-3">Astronomical Meaning</th>
                                    <th className="p-3">Practical Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Equation of Time (EoT)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">EoT = 229.18 &times; (0.000075 + 0.001868 cos γ - 0.032077 sin γ - ...)</td>
                                    <td className="p-3 text-xs">Difference between apparent solar time and mean clock time</td>
                                    <td className="p-3 text-xs text-slate-600">Calibrating sundials and precision solar trackers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Solar Elevation (α)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">sin(α) = sin(Lat) sin(δ) + cos(Lat) cos(δ) cos(H)</td>
                                    <td className="p-3 text-xs">Angular height of the sun above the true horizon (0° to 90°)</td>
                                    <td className="p-3 text-xs text-slate-600">Photovoltaic panel output, architectural shading design</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Solar Zenith Angle (θ)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">θ = 90° - α</td>
                                    <td className="p-3 text-xs">Angular distance from vertical zenith straight down to sun</td>
                                    <td className="p-3 text-xs text-slate-600">Atmospheric air mass calculation ($AM = 1 / \cos \theta$)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Solar Azimuth Angle (Φ)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">cos(Φ) = (sin δ - sin Lat sin α) / (cos Lat cos α)</td>
                                    <td className="p-3 text-xs">Compass direction of the sun relative to True North (0°-360°)</td>
                                    <td className="p-3 text-xs text-slate-600">Building orientation, passive solar heating layout</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Shadow Multiplier</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Shadow Ratio = 1 / tan(α) = cot(α)</td>
                                    <td className="p-3 text-xs">Ratio of shadow cast length relative to vertical object height</td>
                                    <td className="p-3 text-xs text-slate-600">Solar array row spacing, urban planning setback codes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: The Equation of Time & The Analemma */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Activity className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Equation of Time and the Figure-8 Analemma
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        If you photograph the Sun from the exact same location at the exact same civil clock time every day across an entire year, the Sun will not trace a static point. Instead, it traces a characteristic figure-8 curve in the sky known as an <strong>Analemma</strong>. This phenomenon is driven by two astronomical mechanics that create the Equation of Time (EoT):
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-600" /> 1. Earth&apos;s Elliptical Orbit (Eccentricity)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                In accordance with Kepler&apos;s Second Law of Planetary Motion, Earth moves faster in its orbit when closest to the Sun (perihelion in early January) and slower when furthest away (aphelion in early July). This velocity variation causes apparent solar time to drift relative to uniform mechanical clocks.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> 2. Axial Tilt (Obliquity of the Ecliptic)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Earth&apos;s rotational axis is tilted by 23.44° with respect to its orbital plane. Because the Sun moves along the ecliptic rather than the celestial equator, its apparent projection along the equator varies periodically, generating the four annual zero-crossings of the EoT curve.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400" /> Key Equation of Time Milestones Throughout the Year
                        </h3>
                        <div className="grid sm:grid-cols-4 gap-3 text-xs text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-amber-400 block mb-1 font-bold">Mid-February (~Feb 11)</span>
                                <p>Sun runs ~14.2 minutes slow relative to civil clock midday.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-emerald-400 block mb-1 font-bold">Mid-May (~May 14)</span>
                                <p>Sun runs ~3.7 minutes fast relative to civil clock midday.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-amber-400 block mb-1 font-bold">Late July (~July 26)</span>
                                <p>Sun runs ~6.5 minutes slow relative to civil clock midday.</p>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-emerald-400 block mb-1 font-bold">Early Nov (~Nov 3)</span>
                                <p>Sun runs ~16.4 minutes fast relative to civil clock midday.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Industrial, Engineering & Architectural Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Applications: Solar PV Design, Architecture & Agriculture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurate computation of solar elevation, zenith, and azimuth angles is foundational across multiple industrial disciplines:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                1
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Photovoltaic (PV) Array Tilt & Orientation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Fixed solar panel installations capture maximum annual kilowatt-hours when tilted at an angle approximately equal to the installation&apos;s latitude (with a slight 5° to 10° reduction for summer-biased production). Panels are oriented due South in the Northern Hemisphere and due North in the Southern Hemisphere to align with solar culmination.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                2
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Inter-Row Solar Array Shading Calculations</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Commercial ground-mount solar arrays must space parallel module rows sufficiently far apart to prevent winter inter-row shading. By evaluating the minimum solar elevation angle at solar noon on the winter solstice (December 21 in the North), engineers calculate the exact minimum pitch distance between racking structures.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                3
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Bioclimatic Architecture & Overhang Sizing</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Architects design roof overhangs and passive solar brise-soleil slats using solar altitude angles. A properly proportioned window overhang blocks high-angle summer sun (high elevation) to lower air conditioning loads while admitting low-angle winter sunlight (low elevation) deep into building interiors for natural passive heating.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-start gap-3.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                                4
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-slate-900 text-sm">Precision Agriculture & Greenhouse Orientation</h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    Crop canopy photosynthesis and commercial greenhouse light transmission depend heavily on seasonal sun path angles. Orienting crop rows and greenhouse ridge axes along optimal solar azimuth trajectories maximizes photosynthetic active radiation (PAR) absorption throughout the growing season.
                                </p>
                            </div>
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
                                What is Solar Noon and why does it rarely match 12:00 PM on a clock?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Solar noon (solar culmination) is the exact moment the sun crosses the local celestial meridian and reaches its highest elevation in the sky for the day. It rarely matches 12:00 PM on standard clocks due to two main factors: your geographic distance from your time zone&apos;s central meridian, and the Equation of Time (orbital eccentricity and Earth&apos;s 23.44° axial tilt).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Solar Zenith Angle and Solar Elevation (Altitude)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Solar Elevation (Altitude) is the angular height of the sun measured upwards from the true horizon (0° at horizon, 90° straight up). The Solar Zenith Angle is the angular distance from directly overhead (the zenith, 0°) down to the sun. They are complementary angles: Zenith Angle = 90° - Solar Elevation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Equation of Time (EoT) affect solar time calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Equation of Time accounts for Earth&apos;s elliptical orbit around the sun (varying orbital velocity) and the obliquity of the ecliptic. It causes apparent solar time to drift ahead of or behind mean clock time by up to +16 minutes (in early November) to -14 minutes (in mid-February).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do solar azimuth and elevation angles impact solar PV panel placement?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Solar panels generate maximum electrical power when sunlight strikes the photovoltaic cells perpendicularly (at a 90° angle of incidence). Calculating seasonal solar noon zenith and daily azimuth paths allows engineers to determine the ideal fixed tilt angle (typically close to local latitude) and orientation (true South in Northern Hemisphere, true North in Southern Hemisphere).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is shadow length calculated from the solar elevation angle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Shadow length is calculated using the cotangent of the solar elevation angle: Shadow Length = Object Height / tan(Solar Elevation). When the sun is at 45° elevation, shadow length equals object height (1.0x). At low sun angles (e.g., 10°), shadows stretch to over 5.67 times the object&apos;s height.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What causes the solar declination angle to change throughout the year?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Earth rotates on an axis tilted by 23.44° relative to its orbital plane around the Sun. As Earth orbits the Sun, the subsolar point migrates between +23.44° (Tropic of Cancer during June Solstice) and -23.44° (Tropic of Capricorn during December Solstice), passing 0° at the equinoxes.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}