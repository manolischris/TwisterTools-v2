"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Zap,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    ShieldAlert,
    Activity,
    Sliders,
    TrendingUp,
    Play,
    Square,
    Compass,
    Timer,
    CloudRain,
    Thermometer,
    Gauge,
    AlertTriangle,
    ShieldCheck,
    Flame,
    Waves,
    Volume2,
    VolumeX,
    Navigation,
    Layers,
    Clock,
    Scale,
    Cpu,
    CheckCircle2
} from "lucide-react";

type TempUnit = "C" | "F";
type DistanceUnit = "metric" | "imperial";

interface SoundSpeedMetrics {
    speedMps: number;
    speedFps: number;
    speedKmh: number;
    speedMph: number;
    mach1Mps: number;
}

interface StrikeCalculations {
    seconds: number;
    distanceMeters: number;
    distanceKm: number;
    distanceMiles: number;
    distanceFeet: number;
    distanceYards: number;
    soundSpeed: SoundSpeedMetrics;
    dangerLevel: "IMMINENT" | "SEVERE" | "MODERATE" | "CAUTION" | "SAFE";
    dangerTitle: string;
    dangerDescription: string;
    safetyRecommendation: string;
    rule3030Status: string;
    lightTravelTimeMicrosec: number;
    estimatedDecibelsAtSource: number;
    estimatedDecibelsAtObserver: number;
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

export default function LightningDistanceCalculator() {
    // Stopwatch & Primary Input State
    const [secondsInput, setSecondsInput] = useState<number>(5);
    const [temperature, setTemperature] = useState<number>(20);
    const [tempUnit, setTempUnit] = useState<TempUnit>("C");
    const [humidity, setHumidity] = useState<number>(50); // Relative humidity %
    const [altitude, setAltitude] = useState<number>(0); // Meters above sea level
    const [precision, setPrecision] = useState<number>(2);

    // Stopwatch internal state
    const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
    const [stopwatchTime, setStopwatchTime] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    // Flash animation trigger state
    const [isFlashing, setIsFlashing] = useState<boolean>(false);
    const [audioMuted, setAudioMuted] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Stopwatch ticker
    useEffect(() => {
        if (isStopwatchRunning) {
            startTimeRef.current = Date.now() - stopwatchTime * 1000;
            timerRef.current = setInterval(() => {
                const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
                setStopwatchTime(elapsedSec);
                setSecondsInput(parseFloat(elapsedSec.toFixed(2)));
            }, 50);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isStopwatchRunning]);

    const handleStartStopwatch = () => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 400);
        setStopwatchTime(0);
        setSecondsInput(0);
        setIsStopwatchRunning(true);
    };

    const handleStopStopwatch = () => {
        setIsStopwatchRunning(false);
    };

    const handleReset = () => {
        setIsStopwatchRunning(false);
        setStopwatchTime(0);
        setSecondsInput(5);
        setTemperature(20);
        setTempUnit("C");
        setHumidity(50);
        setAltitude(0);
        setPrecision(2);
    };

    // Calculate thermodynamic speed of sound and distance metrics
    const calculation: StrikeCalculations = useMemo(() => {
        // Temperature normalized to Celsius
        const tempC = tempUnit === "C" ? temperature : (temperature - 32) * (5 / 9);

        // Thermodynamic Speed of Sound in Dry/Moist Air:
        // Standard dry air approximation: v = 331.3 * sqrt(1 + T_c / 273.15) m/s
        // Or simplified linear: v ≈ 331.3 + (0.606 * T_c)
        // With basic humidity correction factor: v ≈ 331.3 + (0.606 * T_c) + (0.0124 * RH)
        const baseSpeedMps = 331.3 * Math.sqrt(1 + tempC / 273.15);
        const humidityCorrection = (humidity / 100) * (0.0124 * tempC + 0.5);
        const altitudeLapse = -(altitude * 0.001); // Slight reduction with altitude/pressure
        const speedMps = Math.max(250, baseSpeedMps + humidityCorrection + altitudeLapse);

        const speedFps = speedMps * 3.28084;
        const speedKmh = speedMps * 3.6;
        const speedMph = speedMps * 2.23694;

        const soundSpeed: SoundSpeedMetrics = {
            speedMps,
            speedFps,
            speedKmh,
            speedMph,
            mach1Mps: speedMps
        };

        const sec = Math.max(0, secondsInput);
        const distanceMeters = sec * speedMps;
        const distanceKm = distanceMeters / 1000;
        const distanceMiles = distanceMeters / 1609.344;
        const distanceFeet = distanceMeters * 3.28084;
        const distanceYards = distanceMeters * 1.09361;

        // Light travel time in microseconds (c ≈ 299,792,458 m/s)
        const lightTravelTimeMicrosec = (distanceMeters / 299792458) * 1000000;

        // Acoustic Attenuation & Shockwave Decibel Estimation:
        // Lightning channel emits ~120-130 dB at 100m. Inverse square spherical drop + 5dB/km absorption
        const estimatedDecibelsAtSource = 130;
        let estimatedDecibelsAtObserver = 0;
        if (distanceMeters > 0) {
            const geometricDrop = 20 * Math.log10(Math.max(1, distanceMeters));
            const atmosphericAbsorption = (distanceKm * 4); // ~4 dB/km for low thunder frequencies
            estimatedDecibelsAtObserver = Math.max(0, Math.round(180 - geometricDrop - atmosphericAbsorption));
        }

        // Safety Matrix Classification (30/30 Lightning Safety Standard)
        let dangerLevel: "IMMINENT" | "SEVERE" | "MODERATE" | "CAUTION" | "SAFE" = "SAFE";
        let dangerTitle = "Safe Distance - Remain Weather-Vigilant";
        let dangerDescription = "The thunderstorm is far away. Monitor conditions if storm cells are approaching.";
        let safetyRecommendation = "No immediate shelter required, but track storm velocity and sky conditions.";
        let rule3030Status = "Condition Clear: Delay exceeds standard 30-second emergency threshold.";

        if (sec <= 0.5 && sec > 0) {
            dangerLevel = "IMMINENT";
            dangerTitle = "DIRECT STRIKE ZONE / GROUND ZERO";
            dangerDescription = "Lightning struck within a few hundred feet of your immediate location!";
            safetyRecommendation = "DROP TO GROUND OR SEEK ENCLOSED HARDTOP VEHICLE / SUBSTANTIAL SHELTER IMMEDIATELY. Avoid tall trees and open water.";
            rule3030Status = "CRITICAL EMERGENCY: Delay is nearly zero. You are inside the active plasma arc footprint.";
        } else if (sec < 5) {
            dangerLevel = "IMMINENT";
            dangerTitle = "IMMINENT DANGER (Under 1 Mile / 1.6 km)";
            dangerDescription = "Lightning is striking in your immediate vicinity. High risk of ground current and side-flash strikes.";
            safetyRecommendation = "Seek immediate enclosed shelter. Disconnect corded electronics and avoid plumbing/metal fixtures.";
            rule3030Status = "30/30 RULE VIOLATION: Danger is extreme. Seek shelter immediately.";
        } else if (sec < 15) {
            dangerLevel = "SEVERE";
            dangerTitle = "SEVERE DANGER (Under 3 Miles / 5 km)";
            dangerDescription = "You are well within reach of 'Bolt from the Blue' strikes which can jump up to 10 miles from rain clouds.";
            safetyRecommendation = "Move immediately inside a fully enclosed building with wiring/plumbing or a hardtop metal vehicle.";
            rule3030Status = "30/30 RULE ACTIVE: Suspend all outdoor recreation, sports, boating, and golf.";
        } else if (sec < 30) {
            dangerLevel = "MODERATE";
            dangerTitle = "MODERATE WARNING (Under 6 Miles / 10 km)";
            dangerDescription = "The storm is within strike range. Lightning frequently strikes 5 to 10 miles ahead of the rain core.";
            safetyRecommendation = "Begin packing up outdoor activities and head toward permanent indoor shelter.";
            rule3030Status = "30/30 RULE TRIGGERED: Delay is under 30 seconds. Stop outdoor activities.";
        } else if (sec <= 60) {
            dangerLevel = "CAUTION";
            dangerTitle = "CAUTION ZONE (6 to 12 Miles / 10 to 20 km)";
            dangerDescription = "Thunder is clearly audible. The storm is approaching or moving parallel to your location.";
            safetyRecommendation = "Identify nearest shelter. If thunder roars, prepare to go indoors.";
            rule3030Status = "Monitor Delay: If flash-to-bang time drops below 30 seconds, seek shelter.";
        }

        return {
            seconds: sec,
            distanceMeters,
            distanceKm,
            distanceMiles,
            distanceFeet,
            distanceYards,
            soundSpeed,
            dangerLevel,
            dangerTitle,
            dangerDescription,
            safetyRecommendation,
            rule3030Status,
            lightTravelTimeMicrosec,
            estimatedDecibelsAtSource,
            estimatedDecibelsAtObserver
        };
    }, [secondsInput, temperature, tempUnit, humidity, altitude]);

    const handleCopyResults = () => {
        const text = `Thunderstorm Lightning Distance Report (twistertools.com)
----------------------------------------
Flash-to-Bang Time: ${calculation.seconds.toFixed(precision)} seconds
Calculated Distance:
  • Kilometers: ${calculation.distanceKm.toFixed(precision)} km
  • Miles: ${calculation.distanceMiles.toFixed(precision)} miles
  • Meters: ${calculation.distanceMeters.toFixed(precision)} m
  • Feet: ${calculation.distanceFeet.toFixed(precision)} ft

Atmospheric Sound Speed:
  • Speed of Sound: ${calculation.soundSpeed.speedMps.toFixed(1)} m/s (${calculation.soundSpeed.speedKmh.toFixed(1)} km/h / ${calculation.soundSpeed.speedMph.toFixed(1)} mph)
  • Temperature: ${temperature}°${tempUnit}
  • Relative Humidity: ${humidity}%
  • Altitude: ${altitude} m

Safety Status:
  • Threat Level: ${calculation.dangerLevel} - ${calculation.dangerTitle}
  • 30/30 Rule Status: ${calculation.rule3030Status}
  • Safety Action: ${calculation.safetyRecommendation}
----------------------------------------
Generated via TwisterTools Lightning Distance & Thunder Delay Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getThreatBadgeColor = (level: string) => {
        switch (level) {
            case "IMMINENT":
                return "bg-rose-500 text-white border-rose-600 animate-pulse";
            case "SEVERE":
                return "bg-rose-100 text-rose-800 border-rose-300";
            case "MODERATE":
                return "bg-amber-100 text-amber-800 border-amber-300";
            case "CAUTION":
                return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "SAFE":
            default:
                return "bg-emerald-100 text-emerald-800 border-emerald-300";
        }
    };

    const getThreatBarWidth = (sec: number) => {
        if (sec <= 0) return "0%";
        if (sec >= 45) return "10%";
        if (sec >= 30) return "25%";
        if (sec >= 15) return "50%";
        if (sec >= 5) return "75%";
        return "100%";
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Lightning Distance & Thunder Storm Delay Calculator",
        "url": "https://twistertools.com/tools/math-tools/lightning-distance-calculator",
        "description": "Calculate exact lightning strike distance from thunder delay using thermodynamic speed of sound adjustments, live interactive stopwatch, and 30/30 storm safety analysis.",
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
                "name": "How does the flash-to-bang method calculate lightning distance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Light travels at roughly 299,792 km/s (instantaneous for terrestrial observation), while thunder travels at the speed of sound (~343 m/s or 1,125 ft/s at 20°C). By multiplying the elapsed delay in seconds between seeing lightning and hearing thunder by the speed of sound, you calculate the precise distance to the strike."
                }
            },
            {
                "@type": "Question",
                "name": "What is the 5-seconds-per-mile rule of thumb?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sound takes approximately 4.69 to 5 seconds to travel one standard mile in air (or about 3 seconds per kilometer). Dividing the flash-to-bang seconds by 5 provides an accurate imperial mileage estimate, while dividing by 3 provides metric kilometers."
                }
            },
            {
                "@type": "Question",
                "name": "What is the official 30/30 Lightning Safety Rule?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 30/30 Rule states that if the flash-to-bang count is 30 seconds or less (indicating lightning is within 6 miles / 10 km), you must immediately seek substantial indoor shelter. After the last audible clap of thunder, you must remain in shelter for at least 30 continuous minutes before resuming outdoor activities."
                }
            },
            {
                "@type": "Question",
                "name": "How does ambient temperature affect the speed of sound and calculation accuracy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sound travels faster in warmer air because kinetic molecular energy is higher. At 0°C (32°F), sound travels at 331.3 m/s, whereas at 35°C (95°F), it accelerates to ~351.9 m/s. Factoring in temperature eliminates distance errors of up to 6% to 8%."
                }
            },
            {
                "@type": "Question",
                "name": "What is a 'Bolt from the Blue' and how far can it strike?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A 'Bolt from the Blue' is a cloud-to-ground positive lightning stroke originating from the upper anvil of a thunderstorm that travels horizontally through clear sky before striking ground up to 10 to 25 miles away from the rain core."
                }
            },
            {
                "@type": "Question",
                "name": "Are rubber shoes or tires effective protection against lightning strikes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, rubber soles and tires provide zero electrical insulation against lightning, which has already jumped through thousands of feet of air at hundreds of millions of volts. Metal-roofed cars protect occupants through the Faraday cage effect by channeling current around the exterior frame."
                }
            },
            {
                "@type": "Question",
                "name": "Why does thunder sometimes rumble for several seconds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A lightning channel can stretch across several miles of atmosphere. Sound emitted from the closest section of the channel reaches your ears first as a sharp crack, followed by continuous rumbling acoustic reflections arriving progressively later from distant channel sections and cloud surfaces."
                }
            },
            {
                "@type": "Question",
                "name": "What are ground currents and why are they dangerous during a thunderstorm?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When lightning strikes the earth, electrical current radiates outward along the ground surface. Ground currents cause more than 50% of all lightning-related casualties and livestock deaths due to step potential voltage across wide stances."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Visual Flash Effect Overlay */}
            {isFlashing && (
                <div className="fixed inset-0 bg-white/70 z-50 pointer-events-none transition-opacity duration-300 animate-pulse" />
            )}

            {/* 50/50 Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Interactive Inputs & Precision Stopwatch */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Timer className="w-5 h-5 text-indigo-600" />
                                Flash-to-Bang Input & Live Stopwatch
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Interactive Stopwatch Box */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md border border-slate-800 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    Live Thunder Delay Stopwatch
                                </span>
                                <span className="text-[11px] font-mono bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-200 border border-indigo-700/50">
                                    {isStopwatchRunning ? "RECORDING DELAY..." : "READY"}
                                </span>
                            </div>

                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                                    {stopwatchTime.toFixed(2)}
                                    <span className="text-lg font-normal text-indigo-300 ml-1.5">sec</span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1">
                                    Click <strong>Flash Seen</strong> when you see lightning, then <strong>Thunder Heard</strong> when you hear thunder.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {!isStopwatchRunning ? (
                                    <button
                                        type="button"
                                        onClick={handleStartStopwatch}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide transition shadow-lg cursor-pointer"
                                    >
                                        <Zap className="w-4 h-4 fill-slate-950" />
                                        1. FLASH SEEN (START)
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleStopStopwatch}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm tracking-wide transition shadow-lg animate-pulse cursor-pointer"
                                    >
                                        <Square className="w-4 h-4 fill-white" />
                                        2. THUNDER HEARD (STOP)
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsStopwatchRunning(false);
                                        setStopwatchTime(0);
                                        setSecondsInput(0);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Clear Timer
                                </button>
                            </div>
                        </div>

                        {/* Manual Second Input & Preset Buttons */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Flash-To-Bang Delay (Seconds)
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {secondsInput.toFixed(1)} s
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="60"
                                        step="0.1"
                                        value={secondsInput}
                                        onChange={(e) => setSecondsInput(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="300"
                                        step="any"
                                        value={secondsInput === 0 ? "" : secondsInput}
                                        onChange={(e) => handleNumberInput(e, setSecondsInput)}
                                        className="w-24 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                        placeholder="5.0"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                                    Quick Scenario Presets:
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {[
                                        { label: "Direct (1s)", sec: 1 },
                                        { label: "Close (5s)", sec: 5 },
                                        { label: "30s Limit", sec: 30 },
                                        { label: "Distant (45s)", sec: 45 }
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                setSecondsInput(preset.sec);
                                                setStopwatchTime(preset.sec);
                                                setIsStopwatchRunning(false);
                                            }}
                                            className={`px-2 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${secondsInput === preset.sec
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Atmospheric Correction Modifiers */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Thermometer className="w-4 h-4 text-indigo-600" />
                                    Atmospheric Environment Adjustments
                                </span>
                                <div className="flex bg-slate-200 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("C")}
                                        className={`px-2 py-0.5 text-xs font-bold rounded transition cursor-pointer ${tempUnit === "C" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        °C
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("F")}
                                        className={`px-2 py-0.5 text-xs font-bold rounded transition cursor-pointer ${tempUnit === "F" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        °F
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Air Temp (°{tempUnit})
                                    </label>
                                    <input
                                        type="number"
                                        value={temperature}
                                        onChange={(e) => handleNumberInput(e, setTemperature)}
                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Humidity (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={humidity}
                                        onChange={(e) => handleNumberInput(e, setHumidity)}
                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Altitude (Meters)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="8000"
                                        value={altitude}
                                        onChange={(e) => handleNumberInput(e, setAltitude)}
                                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                                <span>Calibrated Speed: <strong>{calculation.soundSpeed.speedMps.toFixed(1)} m/s</strong></span>
                                <span>({calculation.soundSpeed.speedFps.toFixed(0)} ft/s • Mach 1.0)</span>
                            </div>
                        </div>

                        {/* Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[1, 2, 3, 4].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Rule of Thumb: 5 sec = 1 Mile / 3 sec = 1 km
                        </span>
                        <span>Atmospheric Physics Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Distance Cards & Safety Analysis */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Strike Distance & Hazard Analysis
                            </h2>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${getThreatBadgeColor(calculation.dangerLevel)}`}>
                                {calculation.dangerLevel}
                            </span>
                        </div>

                        {/* Primary Distance Display Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                    Distance (Kilometers)
                                </span>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {calculation.distanceKm.toFixed(precision)}
                                    <span className="text-base font-semibold text-slate-500 ml-1">km</span>
                                </div>
                                <p className="text-[11px] font-semibold text-indigo-700">
                                    {calculation.distanceMeters.toFixed(0)} meters
                                </p>
                            </div>

                            <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                    Distance (Miles)
                                </span>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {calculation.distanceMiles.toFixed(precision)}
                                    <span className="text-base font-semibold text-slate-500 ml-1">mi</span>
                                </div>
                                <p className="text-[11px] font-semibold text-indigo-700">
                                    {calculation.distanceFeet.toFixed(0)} feet ({calculation.distanceYards.toFixed(0)} yd)
                                </p>
                            </div>
                        </div>

                        {/* Dynamic Storm Threat Assessment Card */}
                        <div className={`p-5 rounded-2xl border space-y-3 ${calculation.dangerLevel === "IMMINENT"
                            ? "bg-rose-50/90 border-rose-200 text-rose-950"
                            : calculation.dangerLevel === "SEVERE"
                                ? "bg-orange-50 border-orange-200 text-orange-950"
                                : calculation.dangerLevel === "MODERATE"
                                    ? "bg-amber-50 border-amber-200 text-amber-950"
                                    : calculation.dangerLevel === "CAUTION"
                                        ? "bg-yellow-50 border-yellow-200 text-yellow-950"
                                        : "bg-emerald-50 border-emerald-200 text-emerald-950"
                            }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <h3 className="text-sm font-black uppercase tracking-wide">
                                    {calculation.dangerTitle}
                                </h3>
                            </div>
                            <p className="text-xs leading-relaxed font-medium">
                                {calculation.dangerDescription}
                            </p>
                            <div className="p-3 bg-white/80 rounded-xl border border-black/5 text-xs font-semibold space-y-1">
                                <div className="text-[11px] uppercase tracking-wider text-slate-500">
                                    Recommended Safety Protocol:
                                </div>
                                <div>{calculation.safetyRecommendation}</div>
                            </div>
                        </div>

                        {/* Proximity Gauge & Acoustic Analysis */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 text-xs">
                            <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                <span>Acoustic & Shockwave Metrics</span>
                                <span className="text-[10px] text-slate-400 font-mono">30/30 Threshold: 30s</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                                <div>Delay: <strong className="text-white">{calculation.seconds}s</strong></div>
                                <div>Sound: <strong className="text-white">{calculation.soundSpeed.speedMps.toFixed(0)} m/s</strong></div>
                                <div>Est. dB: <strong className="text-white">~{calculation.estimatedDecibelsAtObserver} dB</strong></div>
                                <div>Light Lag: <strong className="text-white">{calculation.lightTravelTimeMicrosec.toFixed(1)} µs</strong></div>
                            </div>

                            {/* Threat Progress Bar */}
                            <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                                    <span>Danger Proximity Scale</span>
                                    <span>{calculation.seconds <= 30 ? "⚠️ Inside Threat Perimeter" : "Outside Immediate Threat"}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${calculation.dangerLevel === "IMMINENT"
                                            ? "bg-rose-500"
                                            : calculation.dangerLevel === "SEVERE"
                                                ? "bg-orange-500"
                                                : calculation.dangerLevel === "MODERATE"
                                                    ? "bg-amber-500"
                                                    : "bg-emerald-500"
                                            }`}
                                        style={{ width: getThreatBarWidth(calculation.seconds) }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 30/30 Rule Status Pill */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                30/30 National Weather Service Rule Status:
                            </div>
                            <p className="text-slate-600 text-[11px]">
                                {calculation.rule3030Status}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Storm Report Copied to Clipboard!" : "Copy Storm & Distance Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Physics & Speed of Sound Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Physics of Lightning Distance: Flash-to-Bang Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating how far away a lightning strike occurred relies on the colossal difference in propagation speed between electromagnetic radiation (visible light) and mechanical acoustic pressure waves (thunder). When an atmospheric dielectric breakdown occurs, a lightning stepped leader completes a circuit with an upward streamer, unleashing an electrical current between 20,000 to 200,000 amperes. This instantaneous plasma channel heats surrounding air to nearly 30,000 kelvins (approximately 53,500°F)—five times hotter than the surface of the sun.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This explosive thermal expansion superheats the adjacent air in less than a microsecond, producing a supersonic cylindrical shockwave that quickly decays into the acoustic sound wave known as thunder. Because light travels through the atmosphere at approximately 299,792 km/s (186,282 miles per second), the visual flash reaches your retina almost instantaneously (with only microseconds of lag). Sound, however, travels at a much slower speed of approximately 343 meters per second (1,125 feet per second) in standard sea-level atmosphere at 20°C (68°F).
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Physical Medium / Property</th>
                                    <th className="p-3">Speed of Light ($c$)</th>
                                    <th className="p-3">Speed of Sound ($v_s$ at 20°C)</th>
                                    <th className="p-3">Time to Travel 1 Mile</th>
                                    <th className="p-3">Time to Travel 1 Kilometer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Atmospheric Propagation</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">299,792,458 m/s</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">343.2 m/s</td>
                                    <td className="p-3 text-xs">Light: 5.37 µs | Sound: ~4.69 s</td>
                                    <td className="p-3 text-xs">Light: 3.34 µs | Sound: ~2.91 s</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Physical Wave Type</td>
                                    <td className="p-3 text-xs">Electromagnetic photon radiation</td>
                                    <td className="p-3 text-xs">Acoustic longitudinal pressure wave</td>
                                    <td className="p-3 text-xs">Requires no medium (vacuo)</td>
                                    <td className="p-3 text-xs">Requires gaseous molecular collisions</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Practical Rule of Thumb</td>
                                    <td className="p-3 text-xs font-bold text-emerald-700">Instantaneous (0 sec)</td>
                                    <td className="p-3 text-xs font-bold text-indigo-700">5 seconds = 1 mile</td>
                                    <td className="p-3 text-xs font-bold text-indigo-700">Divide delay by 5</td>
                                    <td className="p-3 text-xs font-bold text-indigo-700">Divide delay by 3</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Temperature & Thermodynamic Speed of Sound Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Gauge className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Thermodynamic Speed of Sound: Temperature & Environmental Corrections
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Many common calculators assume sound always travels at a constant 340 m/s. However, in real thunderstorm conditions, the speed of sound depends directly on the absolute temperature of the air mass, which governs molecular kinetic energy:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Exact Ideal Gas Formula
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The theoretical speed of sound in an ideal gas depends on the heat capacity ratio ($\gamma \approx 1.4$ for diatomic air), the specific gas constant {"($R = 287.058 \\text{J / (kg}\\cdot\\text{K)}$)"}, and absolute thermodynamic temperature ($T$ in kelvins):
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"v = \\sqrt{\\gamma \\cdot R \\cdot T} = \\sqrt{1.4 \\cdot 287.058 \\cdot (T_C + 273.15)}"}</p>
                                <p className="font-bold text-slate-900">{"v \\approx 331.3 \\cdot \\sqrt{1 + \\frac{T_C}{273.15}} \\text{ m/s}"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                This formula is exact across wide tropospheric temperature variations from -40°C to +50°C.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-indigo-600" /> Linear Taylor Approximation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For quick calculations near standard sea-level temperatures, the first-order Taylor expansion provides an accurate estimation within 0.1% error:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"v \\approx 331.3 + (0.606 \\cdot T_C) \\text{ m/s}"}</p>
                                <p>{"v \\approx 1052 + (1.106 \\cdot T_F) \\text{ ft/s}"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                For example, on a hot 35°C (95°F) summer afternoon, thunder travels at 352.5 m/s, traveling 1 mile in just 4.56 seconds instead of 5.0 seconds.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Air Temperature</th>
                                    <th className="p-3">Speed (m/s)</th>
                                    <th className="p-3">Speed (ft/s)</th>
                                    <th className="p-3">Speed (km/h)</th>
                                    <th className="p-3">Speed (mph)</th>
                                    <th className="p-3">Seconds Per Mile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">-10°C (14°F) - Winter Freeze</td>
                                    <td className="p-3 text-indigo-600">325.2 m/s</td>
                                    <td className="p-3">1,066.9 ft/s</td>
                                    <td className="p-3">1,170.7 km/h</td>
                                    <td className="p-3">727.4 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.95 s/mi</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">0°C (32°F) - Freezing Point</td>
                                    <td className="p-3 text-indigo-600">331.3 m/s</td>
                                    <td className="p-3">1,086.9 ft/s</td>
                                    <td className="p-3">1,192.7 km/h</td>
                                    <td className="p-3">741.1 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.86 s/mi</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">15°C (59°F) - ISA Standard</td>
                                    <td className="p-3 text-indigo-600">340.3 m/s</td>
                                    <td className="p-3">1,116.4 ft/s</td>
                                    <td className="p-3">1,225.1 km/h</td>
                                    <td className="p-3">761.2 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.73 s/mi</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">20°C (68°F) - Room Temp</td>
                                    <td className="p-3 text-indigo-600">343.2 m/s</td>
                                    <td className="p-3">1,126.0 ft/s</td>
                                    <td className="p-3">1,235.5 km/h</td>
                                    <td className="p-3">767.7 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.69 s/mi</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">30°C (86°F) - Warm Storm</td>
                                    <td className="p-3 text-indigo-600">349.0 m/s</td>
                                    <td className="p-3">1,145.0 ft/s</td>
                                    <td className="p-3">1,256.4 km/h</td>
                                    <td className="p-3">780.7 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.61 s/mi</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">38°C (100°F) - Severe Heat</td>
                                    <td className="p-3 text-indigo-600">353.6 m/s</td>
                                    <td className="p-3">1,160.1 ft/s</td>
                                    <td className="p-3">1,273.0 km/h</td>
                                    <td className="p-3">791.0 mph</td>
                                    <td className="p-3 font-bold text-slate-900">4.55 s/mi</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: The Official 30/30 Lightning Safety Standard */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Official 30/30 Lightning Safety Standard & Hazard Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Endorsed by the National Weather Service (NWS), NOAA, and emergency management organizations worldwide, the <strong>30/30 Lightning Safety Rule</strong> establishes clear thresholds for assessing thunderstorm risk:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border-l-4 border-rose-500 bg-rose-50/70 rounded-r-xl space-y-2">
                            <h3 className="font-bold text-rose-950 text-base flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-rose-600" />
                                Rule 1: The 30-Second Flash-to-Bang Threshold
                            </h3>
                            <p className="text-xs text-rose-900 leading-relaxed">
                                If the time between seeing lightning and hearing thunder is <strong>30 seconds or less</strong>, the lightning strike is within <strong>6 miles (10 km)</strong> of your position. At this proximity, you are in immediate danger of being struck by the next discharge. Cease all outdoor activities, athletic events, swimming, and construction immediately and seek substantial indoor shelter.
                            </p>
                        </div>

                        <div className="p-5 border-l-4 border-indigo-500 bg-indigo-50/70 rounded-r-xl space-y-2">
                            <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                Rule 2: The 30-Minute Post-Storm Clearance
                            </h3>
                            <p className="text-xs text-indigo-900 leading-relaxed">
                                Once the thunderstorm has passed and you hear the last clap of thunder, <strong>remain inside your safe shelter for at least 30 continuous minutes</strong>. Statistical casualty tracking indicates that over 30% of lightning injuries occur after the storm appears to have passed, caused by lingering rear-flank trailing stratiform discharges.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Flame className="w-4 h-4 text-rose-600" /> 1. Direct Strikes & Side Flashes
                            </div>
                            <p className="leading-relaxed">
                                Direct strikes deliver the full discharge through the body. Side flashes occur when current jumps from a taller struck object (like a tree or flagpole) across air to an individual standing nearby.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Waves className="w-4 h-4 text-amber-600" /> 2. Ground Current (Step Potential)
                            </div>
                            <p className="leading-relaxed">
                                Ground currents account for over 50% of all lightning fatalities. When lightning enters earth, voltage radiates spherically. A wide stance creates a voltage differential between feet, causing lethal current to course through the heart.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> 3. Upward Streamers & Conduction
                            </div>
                            <p className="leading-relaxed">
                                Unconnected upward streamers develop from hair, clothing, and metal objects before strike completion, capable of causing cardiac arrest even if the main channel attaches elsewhere.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Lightning Types & Bolt From the Blue Phenomena */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Lightning Types: Negative vs. Positive Discharges & &apos;Bolts from the Blue&apos;
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Not all lightning strokes exhibit identical physical characteristics. Meteorologists classify lightning based on polarity and electrical path trajectory:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Zap className="w-4 h-4" /> 1. Negative CG Lightning (-CG)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Accounts for ~90% of all cloud-to-ground strikes. Originates from the negatively charged base of a cumulonimbus cloud (usually around -15°C level). Typically carries 20,000 to 30,000 amperes.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                                <Flame className="w-4 h-4" /> 2. Positive CG Lightning (+CG)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Represents only ~5% to 10% of strikes but carries up to <strong>300,000 amperes</strong>—ten times stronger than negative strikes. Originates in upper positive anvil regions and carries a continuous current that ignites major wildfires.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                                <Navigation className="w-4 h-4" /> 3. Bolt from the Blue
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A positive lightning discharge that travels horizontally out of the storm anvil through clear blue sky for <strong>up to 15 to 25 miles</strong> before turning vertically downward to strike earth, catching victims unaware under clear skies.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <CloudRain className="w-4 h-4" /> 4. Intra-Cloud (IC) & CC
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Discharges occurring entirely within a single cloud mass (Intra-Cloud) or between two separate clouds (Cloud-to-Cloud). These account for over 75% of total global lightning activity and present no direct ground hazard.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Layers className="w-4 h-4" /> 5. Cloud-to-Air (CA)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Discharges that jump from a charged cloud region into uncharged surrounding atmospheric air without making contact with the ground surface, often appearing as branching fingers.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Activity className="w-4 h-4" /> 6. Transient Luminous Events
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                High-altitude upper atmospheric electrical discharges occurring above thunderstorms between 50 to 90 km altitude, including Red Sprites, Blue Jets, and ELVES.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Safe vs. Unsafe Shelters & Emergency Protocol */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Safe vs. Unsafe Shelters: Myths Debunked & Emergency Protocols
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Knowing where to seek refuge during a severe thunderstorm can be the difference between safety and severe injury. Common misconceptions regarding rubber tires, open sheds, and outdoor postures persist:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-emerald-200 bg-emerald-50/70 rounded-xl space-y-3">
                            <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Safe Shelter Locations
                            </h3>
                            <ul className="text-xs text-emerald-900 space-y-2 leading-relaxed">
                                <li>• <strong>Substantial Enclosed Buildings:</strong> Structures with complete electrical wiring and plumbing provide a grounded conductive path into the earth. Keep windows and doors closed.</li>
                                <li>• <strong>Enclosed Hardtop Metal Vehicles:</strong> Cars, vans, and buses with metal roofs protect occupants via the <em>Faraday cage effect</em>—current travels around the exterior metal shell into the ground.</li>
                                <li>• <strong>Indoor Safety Measures:</strong> Stay off corded landlines, avoid running water/plumbing fixtures, and stay away from concrete basement walls and floors (which contain conductive rebar).</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-rose-200 bg-rose-50/70 rounded-xl space-y-3">
                            <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-600" /> Dangerous & Unsafe Shelters
                            </h3>
                            <ul className="text-xs text-rose-900 space-y-2 leading-relaxed">
                                <li>• <strong>Open Pavilions & Dugouts:</strong> Picnic shelters, carports, gazebos, and golf shelters offer zero protection and attract side flashes.</li>
                                <li>• <strong>Tall Isolated Trees:</strong> Seeking shelter under a tree is the second leading cause of lightning fatalities due to explosive steam expansion and ground currents.</li>
                                <li>• <strong>Convertibles & Soft-Top Vehicles:</strong> Fiberglass bodies and fabric roofs offer no Faraday shielding against electrical flow.</li>
                                <li>• <strong>Open Water & Metal Fences:</strong> Water and chain-link fences conduct ground currents across long distances.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: Step-by-Step Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Mathematical Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine these real-world worked solutions calculating lightning strike distance, environmental adjustments, and safety responses:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Summer Storm (Delay = 8.5 s, Temp = 25°C)</span>
                                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Severe Danger Zone</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Calculate Atmospheric Speed of Sound:</strong></li>
                                <li className="text-indigo-700 pl-3">{"v = 331.3 \\cdot \\sqrt{1 + \\frac{25}{273.15}} = 331.3 \\cdot \\sqrt{1.09152} = 346.13 \\text{ m/s}"}</li>
                                <li><strong>2. Calculate Total Distance in Meters:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d = v \\cdot t = 346.13 \\text{ m/s} \\times 8.5 \\text{ s} = 2,942.11 \\text{ meters}"}</li>
                                <li><strong>3. Convert to Kilometers:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{km} = \\frac{2,942.11}{1000} = 2.94 \\text{ km}"}</li>
                                <li><strong>4. Convert to Statute Miles:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{mi} = \\frac{2,942.11}{1609.344} = 1.83 \\text{ miles}"}</li>
                                <li><strong>5. Safety Protocol Evaluation:</strong></li>
                                <li className="text-rose-700 pl-3 font-bold font-sans">
                                    • Delay is under 30 seconds (8.5s &lt; 30s). Threat level is SEVERE. Move indoors immediately.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Approaching Cell (Delay = 22.0 s, Temp = 18°C)</span>
                                <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Moderate Alert Zone</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Calculate Atmospheric Speed of Sound:</strong></li>
                                <li className="text-indigo-700 pl-3">{"v = 331.3 \\cdot \\sqrt{1 + \\frac{18}{273.15}} = 331.3 \\cdot \\sqrt{1.06590} = 342.06 \\text{ m/s}"}</li>
                                <li><strong>2. Calculate Total Distance in Meters:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d = v \\cdot t = 342.06 \\text{ m/s} \\times 22.0 \\text{ s} = 7,525.32 \\text{ meters}"}</li>
                                <li><strong>3. Convert to Kilometers:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{km} = \\frac{7,525.32}{1000} = 7.53 \\text{ km}"}</li>
                                <li><strong>4. Convert to Statute Miles:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{mi} = \\frac{7,525.32}{1609.344} = 4.68 \\text{ miles}"}</li>
                                <li><strong>5. Safety Protocol Evaluation:</strong></li>
                                <li className="text-amber-700 pl-3 font-bold font-sans">
                                    • Strike is within the 6-mile radius (&lt; 30s). Storm is actively encroaching. Suspend outdoor sports.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
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
                                How does the flash-to-bang method calculate lightning distance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Visible light travels at roughly 299,792 km/s (instantaneous for terrestrial observation), while thunder travels at the speed of sound (~343 m/s or 1,125 ft/s at 20°C). By multiplying the elapsed delay in seconds between seeing lightning and hearing thunder by the speed of sound, you calculate the precise distance to the strike.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the 5-seconds-per-mile rule of thumb?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sound takes approximately 4.69 to 5 seconds to travel one standard mile in air (or about 3 seconds per kilometer). Dividing the flash-to-bang seconds by 5 provides an accurate imperial mileage estimate, while dividing by 3 provides metric kilometers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the official 30/30 Lightning Safety Rule?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 30/30 Rule states that if the flash-to-bang count is 30 seconds or less (indicating lightning is within 6 miles / 10 km), you must immediately seek substantial indoor shelter. After the last audible clap of thunder, you must remain in shelter for at least 30 continuous minutes before resuming outdoor activities.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does ambient temperature affect the speed of sound and calculation accuracy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sound travels faster in warmer air because kinetic molecular energy is higher. At 0°C (32°F), sound travels at 331.3 m/s, whereas at 35°C (95°F), it accelerates to ~351.9 m/s. Factoring in temperature eliminates distance errors of up to 6% to 8%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is a &apos;Bolt from the Blue&apos; and how far can it strike?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A &apos;Bolt from the Blue&apos; is a cloud-to-ground positive lightning stroke originating from the upper anvil of a thunderstorm that travels horizontally through clear sky before striking ground up to 10 to 25 miles away from the rain core.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are rubber shoes or tires effective protection against lightning strikes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No, rubber soles and tires provide zero electrical insulation against lightning, which has already jumped through thousands of feet of air at hundreds of millions of volts. Metal-roofed cars protect occupants through the Faraday cage effect by channeling current around the exterior frame.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does thunder sometimes rumble for several seconds?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A lightning channel can stretch across several miles of atmosphere. Sound emitted from the closest section of the channel reaches your ears first as a sharp crack, followed by continuous rumbling acoustic reflections arriving progressively later from distant channel sections and cloud surfaces.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are ground currents and why are they dangerous during a thunderstorm?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When lightning strikes the earth, electrical current radiates outward along the ground surface. Ground currents cause more than 50% of all lightning-related casualties and livestock deaths due to step potential voltage across wide stances.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}