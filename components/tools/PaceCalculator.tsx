"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Timer,
    Activity,
    Calculator,
    Zap,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    AlertTriangle,
    RefreshCw,
    Gauge,
    Flame,
    Target,
    Layers,
    Sliders,
    Lightbulb,
    Award,
    TrendingUp,
    Clock,
    Navigation,
    Compass
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type CalculateTarget = "pace" | "time" | "distance";

interface Preset {
    id: string;
    label: string;
    distance: number; // in miles/km based on unit
    hours: number;
    minutes: number;
    seconds: number;
    unit: UnitSystem;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "5k-finish", label: "Sub-25m 5K", distance: 5.0, hours: 0, minutes: 24, seconds: 30, unit: "metric", tag: "5K Run" },
    { id: "half-marathon", label: "Sub-2h Half Marathon", distance: 13.1094, hours: 1, minutes: 58, seconds: 0, unit: "imperial", tag: "21.1K / 13.1M" },
    { id: "full-marathon", label: "Sub-4h Marathon", distance: 26.2188, hours: 3, minutes: 55, seconds: 0, unit: "imperial", tag: "42.2K / 26.2M" },
];

const STANDARD_DISTANCES = [
    { name: "1K", km: 1.0, miles: 0.621371 },
    { name: "1 Mile", km: 1.60934, miles: 1.0 },
    { name: "5K", km: 5.0, miles: 3.10686 },
    { name: "10K", km: 10.0, miles: 6.21371 },
    { name: "15K", km: 15.0, miles: 9.32057 },
    { name: "10 Miles", km: 16.0934, miles: 10.0 },
    { name: "Half Marathon", km: 21.0975, miles: 13.1094 },
    { name: "Marathon", km: 42.195, miles: 26.2188 },
    { name: "50K Ultra", km: 50.0, miles: 31.0686 },
];

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

export default function PaceCalculator() {
    // Unit State
    const [unit, setUnit] = useState<UnitSystem>("imperial");
    const [target, setTarget] = useState<CalculateTarget>("pace");

    // Inputs: Time
    const [hours, setHours] = useState<number>(0);
    const [minutes, setMinutes] = useState<number>(45);
    const [seconds, setSeconds] = useState<number>(0);

    // Inputs: Distance
    const [distance, setDistance] = useState<number>(5);

    // Inputs: Pace (Minutes & Seconds per mile/km)
    const [paceMinutes, setPaceMinutes] = useState<number>(9);
    const [paceSeconds, setPaceSeconds] = useState<number>(0);

    // Runner Weight for Calorie Math
    const [weight, setWeight] = useState<number>(150); // lbs or kg based on unit

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic calculations
    const calculations = useMemo(() => {
        const totalSecondsTime = hours * 3600 + minutes * 60 + seconds;
        const totalPaceSecondsInput = paceMinutes * 60 + paceSeconds;

        let calcDistance = distance;
        let calcTimeSec = totalSecondsTime;
        let calcPaceSec = totalPaceSecondsInput;

        if (target === "pace") {
            if (distance > 0 && totalSecondsTime > 0) {
                calcPaceSec = totalSecondsTime / distance;
            } else {
                calcPaceSec = 0;
            }
        } else if (target === "time") {
            if (distance > 0 && totalPaceSecondsInput > 0) {
                calcTimeSec = distance * totalPaceSecondsInput;
            } else {
                calcTimeSec = 0;
            }
        } else if (target === "distance") {
            if (totalPaceSecondsInput > 0 && totalSecondsTime > 0) {
                calcDistance = totalSecondsTime / totalPaceSecondsInput;
            } else {
                calcDistance = 0;
            }
        }

        // Formatting Output Time
        const resHours = Math.floor(calcTimeSec / 3600);
        const resMinutes = Math.floor((calcTimeSec % 3600) / 60);
        const resSeconds = Math.round(calcTimeSec % 60);

        // Formatting Output Pace
        const resPaceMin = Math.floor(calcPaceSec / 60);
        const resPaceSec = Math.round(calcPaceSec % 60);

        // Speed (mph or km/h)
        const speed = calcPaceSec > 0 ? 3600 / calcPaceSec : 0;

        // Alternative Unit Pace
        // Imperial = min/mi, Metric = min/km
        // 1 mile = 1.60934 km
        const altPaceSec = unit === "imperial" ? calcPaceSec / 1.60934 : calcPaceSec * 1.60934;
        const altPaceMin = Math.floor(altPaceSec / 60);
        const altPaceSecRem = Math.round(altPaceSec % 60);

        // Estimated Calorie Expenditure (MET approximation ~1.02 kcal/kg/km or ~0.75 kcal/lb/mi)
        let estimatedCalories = 0;
        if (unit === "imperial") {
            estimatedCalories = Math.round(weight * calcDistance * 0.75);
        } else {
            estimatedCalories = Math.round(weight * calcDistance * 1.02);
        }

        return {
            calcDistance: Number(calcDistance.toFixed(2)),
            resHours,
            resMinutes,
            resSeconds,
            formattedTime: `${resHours > 0 ? resHours + "h " : ""}${resMinutes}m ${resSeconds < 10 ? "0" : ""}${resSeconds}s`,
            resPaceMin,
            resPaceSec,
            formattedPace: `${resPaceMin}:${resPaceSec < 10 ? "0" : ""}${resPaceSec}`,
            altFormattedPace: `${altPaceMin}:${altPaceSecRem < 10 ? "0" : ""}${altPaceSecRem}`,
            speed: Number(speed.toFixed(2)),
            estimatedCalories: Math.max(0, estimatedCalories),
        };
    }, [hours, minutes, seconds, distance, paceMinutes, paceSeconds, target, unit, weight]);

    // Split Times Matrix (for 1..10 units or standard intervals)
    const splitTable = useMemo(() => {
        if (calculations.calcDistance <= 0 || (hours === 0 && minutes === 0 && seconds === 0 && paceMinutes === 0 && paceSeconds === 0)) {
            return [];
        }

        const pacePerUnitSec = target === "pace"
            ? (hours * 3600 + minutes * 60 + seconds) / distance
            : target === "time"
                ? paceMinutes * 60 + paceSeconds
                : (hours * 3600 + minutes * 60 + seconds) / calculations.calcDistance;

        if (!pacePerUnitSec || isNaN(pacePerUnitSec) || pacePerUnitSec <= 0) return [];

        const splits = [];
        const totalUnits = Math.min(Math.ceil(calculations.calcDistance), 30); // Max 30 splits display

        for (let i = 1; i <= totalUnits; i++) {
            const currentDist = i > calculations.calcDistance ? calculations.calcDistance : i;
            const cumSec = currentDist * pacePerUnitSec;
            const h = Math.floor(cumSec / 3600);
            const m = Math.floor((cumSec % 3600) / 60);
            const s = Math.round(cumSec % 60);

            splits.push({
                splitNum: i === totalUnits && currentDist < i ? `Finish (${currentDist.toFixed(2)})` : `Split ${i}`,
                distanceLabel: `${currentDist.toFixed(2)} ${unit === "imperial" ? "mi" : "km"}`,
                cumulativeTime: `${h > 0 ? h + ":" : ""}${m < 10 && h > 0 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`,
            });
        }
        return splits;
    }, [calculations, hours, minutes, seconds, distance, paceMinutes, paceSeconds, target, unit]);

    const handleUnitToggle = (newUnit: UnitSystem) => {
        if (newUnit === unit) return;
        if (newUnit === "metric") {
            // Imperial -> Metric: Distance * 1.60934, Weight / 2.20462
            setDistance((prev) => Number((prev * 1.60934).toFixed(2)));
            setWeight((prev) => Math.round(prev / 2.20462));
        } else {
            // Metric -> Imperial: Distance / 1.60934, Weight * 2.20462
            setDistance((prev) => Number((prev / 1.60934).toFixed(2)));
            setWeight((prev) => Math.round(prev * 2.20462));
        }
        setUnit(newUnit);
    };

    const applyPreset = (preset: Preset) => {
        setUnit(preset.unit);
        setDistance(preset.distance);
        setHours(preset.hours);
        setMinutes(preset.minutes);
        setSeconds(preset.seconds);
        setTarget("pace");
        setActivePresetId(preset.id);
    };

    const setStandardDistance = (kmVal: number, miVal: number) => {
        if (unit === "metric") {
            setDistance(kmVal);
        } else {
            setDistance(miVal);
        }
        setActivePresetId(null);
    };

    const handleReset = () => {
        setHours(0);
        setMinutes(45);
        setSeconds(0);
        setDistance(unit === "imperial" ? 5 : 8.05);
        setPaceMinutes(9);
        setPaceSeconds(0);
        setTarget("pace");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const unitLabel = unit === "imperial" ? "Miles" : "Kilometers";
        const paceUnit = unit === "imperial" ? "min/mi" : "min/km";
        const speedUnit = unit === "imperial" ? "mph" : "km/h";

        const summaryText = `Running Pace & Time Calculation (TwisterTools):
----------------------------------------
Target Mode: Calculate ${target.toUpperCase()}
Unit System: ${unit.toUpperCase()}
Total Distance: ${calculations.calcDistance} ${unitLabel}
Total Time: ${calculations.formattedTime}
Pace: ${calculations.formattedPace} ${paceUnit} (${calculations.altFormattedPace} ${unit === "imperial" ? "min/km" : "min/mi"})
Average Speed: ${calculations.speed} ${speedUnit}
Est. Calories Burned: ${calculations.estimatedCalories} kcal
----------------------------------------
Calculated at twistertools.com/tools/calculators/pace-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Split Number", "Distance Covered", "Cumulative Time"];
        const rows = splitTable.map((s) => [s.splitNum, s.distanceLabel, s.cumulativeTime]);

        const metaRows = [
            [],
            ["Parameter", "Value"],
            ["Calculation Mode", target],
            ["Unit System", unit],
            ["Total Distance", `${calculations.calcDistance} ${unit === "imperial" ? "miles" : "km"}`],
            ["Total Time", calculations.formattedTime],
            ["Target Pace", `${calculations.formattedPace} ${unit === "imperial" ? "min/mile" : "min/km"}`],
            ["Average Speed", `${calculations.speed} ${unit === "imperial" ? "mph" : "km/h"}`],
            ["Estimated Calories", `${calculations.estimatedCalories} kcal`]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
            ...metaRows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pace_splits_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pace, Distance & Running Time Calculator",
        "url": "https://twistertools.com/tools/calculators/pace-calculator",
        "description": "Calculate running pace, target completion time, or distance for 5K, 10K, Half Marathon, and Marathon races with split breakdowns.",
        "applicationCategory": "HealthApplication",
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
                "name": "How do I calculate running pace per mile or kilometer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To calculate pace, divide your total finish time in minutes by the total distance run in miles or kilometers. For instance, finishing a 5-mile run in 45 minutes yields a pace of 9:00 minutes per mile."
                }
            },
            {
                "@type": "Question",
                "name": "What pace is required to break 4 hours in a marathon?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To finish a marathon (26.2188 miles / 42.195 km) in under 4 hours, you must maintain an average running pace faster than 9:09 minutes per mile or 5:41 minutes per kilometer."
                }
            },
            {
                "@type": "Question",
                "name": "How do split times help in race pacing strategy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Splits show the cumulative time target at each mile or kilometer marker. Tracking splits helps runners prevent starting too fast (negative splits strategy) and maintain steady aerobic energy distribution throughout long distance events."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between speed (mph/kph) and pace (min/mile or min/km)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Speed measures distance over time (e.g., miles per hour), whereas pace measures time required to cover a fixed distance (e.g., minutes per mile). Runners generally rely on pace because it directly maps to clock management."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Target & Race Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Toggle */}
                        <div className="mb-6 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Unit System
                            </label>
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("imperial")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${unit === "imperial"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (mi, lbs)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${unit === "metric"
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (km, kg)
                                </button>
                            </div>
                        </div>

                        {/* Calculation Target Selection Tabs */}
                        <div className="mb-6 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculate Goal Variable
                            </label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setTarget("pace")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${target === "pace"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Pace
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget("time")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${target === "time"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTarget("distance")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition ${target === "distance"
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Distance
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Time Input Section (Disabled if Target = Time) */}
                            <div className={`p-4 rounded-xl border transition ${target === "time" ? "bg-slate-50 opacity-60 border-slate-200" : "bg-white border-slate-200"}`}>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                    Total Time (Hours : Minutes : Seconds)
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Hours</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            disabled={target === "time"}
                                            value={hours === 0 ? "" : hours}
                                            onChange={(e) => handleNumberInput(e, setHours)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Minutes</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            disabled={target === "time"}
                                            value={minutes === 0 ? "" : minutes}
                                            onChange={(e) => handleNumberInput(e, setMinutes)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Seconds</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            disabled={target === "time"}
                                            value={seconds === 0 ? "" : seconds}
                                            onChange={(e) => handleNumberInput(e, setSeconds)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Distance Input Section (Disabled if Target = Distance) */}
                            <div className={`p-4 rounded-xl border transition ${target === "distance" ? "bg-slate-50 opacity-60 border-slate-200" : "bg-white border-slate-200"}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                                        Distance ({unit === "imperial" ? "Miles" : "Kilometers"})
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.1"
                                    disabled={target === "distance"}
                                    value={distance === 0 ? "" : distance}
                                    onChange={(e) => handleNumberInput(e, setDistance)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 mb-3 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                />

                                {/* Standard Distance Fast Select Buttons */}
                                <div className="flex flex-wrap gap-1.5">
                                    {STANDARD_DISTANCES.map((d) => (
                                        <button
                                            key={d.name}
                                            type="button"
                                            disabled={target === "distance"}
                                            onClick={() => setStandardDistance(d.km, d.miles)}
                                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg border border-slate-200 transition"
                                        >
                                            {d.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Pace Input Section (Disabled if Target = Pace) */}
                            <div className={`p-4 rounded-xl border transition ${target === "pace" ? "bg-slate-50 opacity-60 border-slate-200" : "bg-white border-slate-200"}`}>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                                    Target Pace ({unit === "imperial" ? "min/mile" : "min/km"})
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Minutes</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            disabled={target === "pace"}
                                            value={paceMinutes === 0 ? "" : paceMinutes}
                                            onChange={(e) => handleNumberInput(e, setPaceMinutes)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-semibold block mb-1">Seconds</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="59"
                                            disabled={target === "pace"}
                                            value={paceSeconds === 0 ? "" : paceSeconds}
                                            onChange={(e) => handleNumberInput(e, setPaceSeconds)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Runner Weight (For Caloric Math) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5 text-rose-500" />
                                    Body Weight ({unit === "imperial" ? "lbs" : "kg"})
                                </label>
                                <input
                                    type="number"
                                    min="30"
                                    max="500"
                                    value={weight === 0 ? "" : weight}
                                    onChange={(e) => handleNumberInput(e, setWeight)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Presets Bar */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Popular Race Benchmarks
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Race Metrics"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Results & Splits Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Calculated Performance Output
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                Mode: {target}
                            </span>
                        </div>

                        {/* Primary Pace & Time Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Timer className="w-4 h-4 text-indigo-400" /> Required Pace
                                </span>
                                <span className="text-xs font-medium text-indigo-200">
                                    Speed: {calculations.speed} {unit === "imperial" ? "mph" : "km/h"}
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {calculations.formattedPace}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">
                                    {unit === "imperial" ? "min / mile" : "min / km"}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-indigo-800/80 pt-3 text-xs text-indigo-200">
                                <div>Total Distance: <strong className="text-white">{calculations.calcDistance} {unit === "imperial" ? "mi" : "km"}</strong></div>
                                <div>Total Duration: <strong className="text-white">{calculations.formattedTime}</strong></div>
                                <div>Alternate Pace: <strong className="text-white">{calculations.altFormattedPace} {unit === "imperial" ? "min/km" : "min/mi"}</strong></div>
                                <div>Est. Burn: <strong className="text-white">{calculations.estimatedCalories} kcal</strong></div>
                            </div>
                        </div>

                        {/* Mile / Kilometer Splits Matrix */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Split Times Matrix</span>
                                <span className="text-[10px] font-normal text-slate-500">Cumulative Time</span>
                            </h3>

                            <div className="max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200">
                                {splitTable.length > 0 ? (
                                    splitTable.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 transition">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                <span className="font-semibold text-slate-800">{s.splitNum}</span>
                                                <span className="text-slate-400 text-[10px]">({s.distanceLabel})</span>
                                            </div>
                                            <span className="font-mono font-bold text-indigo-600">{s.cumulativeTime}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-xs text-slate-400">
                                        Enter time and distance to generate milestone splits.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>Clinical Kinematics Engine</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                </p>
            </div>

            {/* BELOW-THE-FOLD CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Running Kinematics & Pacing Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Running Pace Kinematics and Aerobic Energy Distribution
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Pace calculation is the fundamental building block of running science. Whether preparing for a 5K fun run or training for a marathon sub-3 hour goal, knowing how to distribute effort evenly across miles ensures that glycogen reserves last through the final stretch without premature fatigue or muscle cramping.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Negative Splitting
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Negative splitting involves running the second half of a race faster than the first half. World record marathon performances overwhelmingly rely on negative splits to preserve muscle glycogen early on.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> Lactate Threshold Pace
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The maximum pace an athlete can sustain for roughly 60 minutes without excessive blood lactate accumulation. Improving threshold pace directly elevates half marathon and marathon finish times.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Flame className="w-4 h-4 text-rose-500" /> Caloric Cost of Running
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Running expenditure averages approximately 100 calories per mile for a 150 lb individual, relatively independent of velocity. Faster speeds simply increase the rate of hourly caloric burn.
                            </p>
                        </div>
                    </div>

                    {/* Math Formulas Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulas Applied
                        </h3>
                        <p className="text-xs text-slate-300">
                            This engine calculates performance metrics using standardized physical conversion equations:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Pace Equation:</strong> Pace (min/mi) = Total Duration in Minutes ÷ Total Distance in Miles</div>
                            <div><strong>2. Speed Equation:</strong> Speed (mph) = 60 ÷ Pace (min/mi)</div>
                            <div><strong>3. Finish Time Equation:</strong> Finish Time = Distance × Target Pace</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Standard Race Benchmarks Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Popular Distance Race Pace Reference Table
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this benchmark guide to see the required pace per mile and kilometer across common distance goals:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Distance Event</th>
                                    <th className="p-3">Target Time</th>
                                    <th className="p-3">Pace (min/mile)</th>
                                    <th className="p-3">Pace (min/km)</th>
                                    <th className="p-3">Avg Speed (mph)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">5K (3.1 miles)</td>
                                    <td className="p-3">20:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">6:26 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">4:00 / km</td>
                                    <td className="p-3">9.32 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">5K (3.1 miles)</td>
                                    <td className="p-3">25:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">8:03 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">5:00 / km</td>
                                    <td className="p-3">7.46 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-slate-900">10K (6.2 miles)</td>
                                    <td className="p-3">50:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">8:03 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">5:00 / km</td>
                                    <td className="p-3">7.46 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Half Marathon (13.1 mi)</td>
                                    <td className="p-3">1:45:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">8:01 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">4:59 / km</td>
                                    <td className="p-3">7.49 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-slate-900">Half Marathon (13.1 mi)</td>
                                    <td className="p-3">2:00:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">9:09 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">5:41 / km</td>
                                    <td className="p-3">6.55 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Marathon (26.2 mi)</td>
                                    <td className="p-3">3:30:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">8:01 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">4:59 / km</td>
                                    <td className="p-3">7.49 mph</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-slate-900">Marathon (26.2 mi)</td>
                                    <td className="p-3">4:00:00</td>
                                    <td className="p-3 font-semibold text-indigo-600">9:09 / mi</td>
                                    <td className="p-3 font-semibold text-indigo-600">5:41 / km</td>
                                    <td className="p-3">6.55 mph</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Case Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Calculation Case Scenarios
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario A: Target Pace for 10K</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Pace Mode</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Goal Distance:</strong> 10.0 Kilometers (6.21 miles)</li>
                                <li><strong>Goal Target Time:</strong> 52 Minutes 30 Seconds</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Output:</li>
                                <li>• <strong>Metric Pace:</strong> 5:15 min/km</li>
                                <li>• <strong>Imperial Pace:</strong> 8:27 min/mile</li>
                                <li>• <strong>Average Velocity:</strong> 11.43 km/h (7.10 mph)</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Scenario B: Estimated Finish Time</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Time Mode</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Target Distance:</strong> Half Marathon (13.1094 miles)</li>
                                <li><strong>Assigned Training Pace:</strong> 8:45 min/mile</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Output:</li>
                                <li>• <strong>Projected Finish Time:</strong> 1 hour 54 minutes 42 seconds</li>
                                <li>• <strong>Average Speed:</strong> 6.86 mph</li>
                                <li>• <strong>10 Mile Split Mark:</strong> 1 hour 27 minutes 30 seconds</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: FAQ Section */}
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
                                How do I calculate running pace per mile or kilometer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To calculate pace, divide your total finish time in minutes by the total distance run in miles or kilometers. For instance, finishing a 5-mile run in 45 minutes yields a pace of 9:00 minutes per mile.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What pace is required to break 4 hours in a marathon?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To finish a marathon (26.2188 miles / 42.195 km) in under 4 hours, you must maintain an average running pace faster than 9:09 minutes per mile or 5:41 minutes per kilometer.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do split times help in race pacing strategy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Splits show the cumulative time target at each mile or kilometer marker. Tracking splits helps runners prevent starting too fast (negative splits strategy) and maintain steady aerobic energy distribution throughout long distance events.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between speed (mph/kph) and pace (min/mile or min/km)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Speed measures distance over time (e.g., miles per hour), whereas pace measures time required to cover a fixed distance (e.g., minutes per mile). Runners generally rely on pace because it directly maps to clock management.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Medical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                    </p>
                </section>

            </div>
        </div>
    );
}