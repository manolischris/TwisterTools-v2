"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Timer,
    Flame,
    Zap,
    Trophy,
    TrendingUp,
    Compass,
    Target,
    Activity,
    Clock,
    Share2,
    Copy,
    Check,
    Download,
    RefreshCw,
    Info,
    HelpCircle,
    BookOpen,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Layers,
    Award,
    Milestone,
    SlidersHorizontal,
    Table as TableIcon
} from "lucide-react";

type UnitSystem = "km" | "miles";
type CalculationMode = "finish_time" | "required_pace" | "distance";
type PacingStrategy = "even" | "negative" | "positive";

interface RacePreset {
    id: string;
    label: string;
    distanceKm: number;
    distanceMiles: number;
    tag: string;
}

const RACE_PRESETS: RacePreset[] = [
    { id: "5k", label: "5K", distanceKm: 5.0, distanceMiles: 3.10686, tag: "Sprint" },
    { id: "10k", label: "10K", distanceKm: 10.0, distanceMiles: 6.21371, tag: "Standard" },
    { id: "half-marathon", label: "Half Marathon", distanceKm: 21.0975, distanceMiles: 13.1094, tag: "21.1 km" },
    { id: "marathon", label: "Marathon", distanceKm: 42.195, distanceMiles: 26.2188, tag: "42.2 km" },
    { id: "50k-ultra", label: "50K Ultra", distanceKm: 50.0, distanceMiles: 31.0686, tag: "Ultra" },
];

interface TrainingPaceZone {
    name: string;
    description: string;
    paceFactor: number; // percentage adjustment from race pace
    heartRateZone: string;
    purpose: string;
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

// Convert total seconds into formatted HH:MM:SS or MM:SS
function formatDuration(totalSeconds: number, includeHoursAlways = false): string {
    if (!isFinite(totalSeconds) || totalSeconds <= 0) return "00:00";
    const rounded = Math.round(totalSeconds);
    const hrs = Math.floor(rounded / 3600);
    const mins = Math.floor((rounded % 3600) / 60);
    const secs = rounded % 60;

    const padM = String(mins).padStart(2, "0");
    const padS = String(secs).padStart(2, "0");

    if (hrs > 0 || includeHoursAlways) {
        const padH = String(hrs).padStart(2, "0");
        return `${padH}:${padM}:${padS}`;
    }
    return `${padM}:${padS}`;
}

export default function RaceSplitPaceCalculator() {
    // Mode & Setup State
    const [calcMode, setCalcMode] = useState<CalculationMode>("finish_time");
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("km");
    const [pacingStrategy, setPacingStrategy] = useState<PacingStrategy>("even");
    const [splitInterval, setSplitInterval] = useState<number>(1); // every 1 km or 1 mile, or 5km
    const [activePresetId, setActivePresetId] = useState<string | null>("marathon");

    // Distance Inputs
    const [distance, setDistance] = useState<number>(42.195);

    // Time Inputs (Hours, Minutes, Seconds)
    const [timeHours, setTimeHours] = useState<number>(3);
    const [timeMinutes, setTimeMinutes] = useState<number>(45);
    const [timeSeconds, setTimeSeconds] = useState<number>(0);

    // Pace Inputs (Minutes per unit, Seconds per unit)
    const [paceMinutes, setPaceMinutes] = useState<number>(5);
    const [paceSeconds, setPaceSeconds] = useState<number>(20);

    // Dynamic Splitting & UI State
    const [activeTab, setActiveTab] = useState<"splits" | "equivalents" | "zones">("splits");
    const [copied, setCopied] = useState<boolean>(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Normalize Distance based on Units
    const distanceInKm = useMemo(() => {
        return unitSystem === "km" ? distance : distance * 1.609344;
    }, [distance, unitSystem]);

    const distanceInMiles = useMemo(() => {
        return unitSystem === "miles" ? distance : distance / 1.609344;
    }, [distance, unitSystem]);

    // Core Computations
    const computedMetrics = useMemo(() => {
        let totalTimeSec = 0;
        let paceSecPerUnit = 0;
        let speedKmh = 0;
        let speedMph = 0;

        if (calcMode === "finish_time") {
            paceSecPerUnit = paceMinutes * 60 + paceSeconds;
            totalTimeSec = paceSecPerUnit * (distance || 0);
        } else if (calcMode === "required_pace") {
            totalTimeSec = timeHours * 3600 + timeMinutes * 60 + timeSeconds;
            paceSecPerUnit = distance > 0 ? totalTimeSec / distance : 0;
        } else if (calcMode === "distance") {
            totalTimeSec = timeHours * 3600 + timeMinutes * 60 + timeSeconds;
            paceSecPerUnit = paceMinutes * 60 + paceSeconds;
            // distance is derived
        }

        const effectiveDistance = calcMode === "distance"
            ? (paceSecPerUnit > 0 ? totalTimeSec / paceSecPerUnit : 0)
            : distance;

        // Unit Pace Converters
        const paceSecPerKm = unitSystem === "km" ? paceSecPerUnit : paceSecPerUnit / 1.609344;
        const paceSecPerMile = unitSystem === "miles" ? paceSecPerUnit : paceSecPerUnit * 1.609344;

        if (paceSecPerKm > 0) {
            speedKmh = 3600 / paceSecPerKm;
        }
        if (paceSecPerMile > 0) {
            speedMph = 3600 / paceSecPerMile;
        }

        // VO2 Max Equivalent approximation via Jack Daniels VDOT formula (empirical)
        let vdot = 0;
        if (effectiveDistance > 0 && totalTimeSec > 0) {
            const timeMinutesDecimal = totalTimeSec / 60;
            const velocityMetersPerMin = (effectiveDistance * (unitSystem === "km" ? 1000 : 1609.344)) / timeMinutesDecimal;
            const percentMax = 0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutesDecimal) + 0.2989558 * Math.exp(-0.1932605 * timeMinutesDecimal);
            const vo2Cost = -4.60 + 0.182258 * velocityMetersPerMin + 0.000104 * Math.pow(velocityMetersPerMin, 2);
            vdot = Math.max(10, Math.min(85, vo2Cost / percentMax));
        }

        // Estimated Calories (Rough MET approximation: 1.036 kcal per kg per km, assuming 70kg standard runner)
        const estCalories70kg = Math.round(effectiveDistance * (unitSystem === "km" ? 1 : 1.609344) * 70 * 1.036);

        return {
            totalTimeSec,
            paceSecPerUnit,
            paceSecPerKm,
            paceSecPerMile,
            speedKmh,
            speedMph,
            effectiveDistance,
            vdot,
            estCalories70kg
        };
    }, [calcMode, unitSystem, distance, timeHours, timeMinutes, timeSeconds, paceMinutes, paceSeconds]);

    // Generate Split Breakdown Rows
    const splitsTable = useMemo(() => {
        const splits: Array<{
            splitNumber: number;
            splitDistance: number;
            lapTimeFormatted: string;
            cumulativeTimeFormatted: string;
            splitPaceFormatted: string;
            isFinish: boolean;
        }> = [];

        const totalDist = computedMetrics.effectiveDistance;
        if (totalDist <= 0 || computedMetrics.paceSecPerUnit <= 0) return splits;

        const basePaceSec = computedMetrics.paceSecPerUnit;
        const interval = splitInterval;
        let accumulatedDistance = 0;
        let cumulativeSeconds = 0;
        let splitIndex = 1;

        // Negative Split: start ~3% slower, accelerate to ~3% faster
        // Positive Split: start ~3% faster, slow down to ~3% slower
        const numIntervals = Math.ceil(totalDist / interval);

        while (accumulatedDistance < totalDist) {
            const currentLapDist = Math.min(interval, totalDist - accumulatedDistance);
            accumulatedDistance += currentLapDist;

            let lapPaceSec = basePaceSec;
            if (pacingStrategy === "negative") {
                const progressRatio = splitIndex / numIntervals; // 0 to 1
                const paceMod = 1.03 - (progressRatio * 0.06); // 1.03 down to 0.97
                lapPaceSec = basePaceSec * paceMod;
            } else if (pacingStrategy === "positive") {
                const progressRatio = splitIndex / numIntervals;
                const paceMod = 0.97 + (progressRatio * 0.06); // 0.97 up to 1.03
                lapPaceSec = basePaceSec * paceMod;
            }

            const lapDurationSec = lapPaceSec * currentLapDist;
            cumulativeSeconds += lapDurationSec;

            splits.push({
                splitNumber: splitIndex,
                splitDistance: Number(accumulatedDistance.toFixed(2)),
                lapTimeFormatted: formatDuration(lapDurationSec),
                cumulativeTimeFormatted: formatDuration(cumulativeSeconds, true),
                splitPaceFormatted: `${formatDuration(lapPaceSec)} /${unitSystem}`,
                isFinish: accumulatedDistance >= totalDist
            });

            splitIndex++;
        }

        return splits;
    }, [computedMetrics, splitInterval, pacingStrategy, unitSystem]);

    // Equivalent Race Projections based on Peter Riegel's Formula: T2 = T1 * (D2 / D1)^1.06
    const raceEquivalents = useMemo(() => {
        const d1Km = unitSystem === "km" ? computedMetrics.effectiveDistance : computedMetrics.effectiveDistance * 1.609344;
        const t1 = computedMetrics.totalTimeSec;

        if (d1Km <= 0 || t1 <= 0) return [];

        const targets = [
            { name: "5K (5.00 km)", distKm: 5.0 },
            { name: "10K (10.00 km)", distKm: 10.0 },
            { name: "Half Marathon (21.10 km)", distKm: 21.0975 },
            { name: "Marathon (42.20 km)", distKm: 42.195 },
            { name: "50K Ultramarathon (50.00 km)", distKm: 50.0 },
        ];

        return targets.map((target) => {
            const predSec = t1 * Math.pow(target.distKm / d1Km, 1.06);
            const pacePerKmSec = predSec / target.distKm;
            const pacePerMileSec = pacePerKmSec * 1.609344;

            return {
                name: target.name,
                time: formatDuration(predSec, true),
                paceKm: `${formatDuration(pacePerKmSec)} /km`,
                paceMile: `${formatDuration(pacePerMileSec)} /mi`,
                speedKmh: (3600 / pacePerKmSec).toFixed(1),
            };
        });
    }, [computedMetrics, unitSystem]);

    // Training Pace Zones derived from baseline pace
    const trainingZones = useMemo(() => {
        const basePaceKm = computedMetrics.paceSecPerKm;
        if (basePaceKm <= 0) return [];

        const zones = [
            {
                name: "Zone 1: Recovery / Active Rest",
                description: "Effortless, conversational pace for clearing lactate and structural recovery.",
                factorMin: 1.30,
                factorMax: 1.45,
                hr: "< 65% Max HR",
                purpose: "Post-workout recovery and daily volume foundation."
            },
            {
                name: "Zone 2: Aerobic Endurance (Easy / Long)",
                description: "Builds mitochondrial capillary density and fat oxidation efficiency.",
                factorMin: 1.15,
                factorMax: 1.25,
                hr: "65% – 75% Max HR",
                purpose: "Cornerstone for long runs and marathon base conditioning."
            },
            {
                name: "Zone 3: Tempo / Aerobic Power",
                description: "Comfortably hard, controlled rhythm at steady marathon target pace.",
                factorMin: 1.00,
                factorMax: 1.08,
                hr: "76% – 85% Max HR",
                purpose: "Race simulation and aerobic threshold expansion."
            },
            {
                name: "Zone 4: Lactate Threshold (LT)",
                description: "Hard tempo at 1-hour sustained maximum capability (10K - Half Marathon pace).",
                factorMin: 0.90,
                factorMax: 0.96,
                hr: "86% – 92% Max HR",
                purpose: "Raises lactate threshold clearance and clearing velocity."
            },
            {
                name: "Zone 5: VO2 Max / High-Intensity Intervals",
                description: "Maximum oxygen uptake intervals (800m - 1500m repetitions).",
                factorMin: 0.80,
                factorMax: 0.88,
                hr: "93% – 100% Max HR",
                purpose: "Boosts stroke volume and cardiovascular capacity."
            },
        ];

        return zones.map(z => {
            const minPaceSec = basePaceKm * z.factorMin;
            const maxPaceSec = basePaceKm * z.factorMax;
            return {
                ...z,
                paceDisplayKm: `${formatDuration(maxPaceSec)} – ${formatDuration(minPaceSec)} /km`,
                paceDisplayMile: `${formatDuration(maxPaceSec * 1.609344)} – ${formatDuration(minPaceSec * 1.609344)} /mi`
            };
        });
    }, [computedMetrics.paceSecPerKm]);

    // Handle Unit System Switch
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "miles") {
            setDistance(Number((distance / 1.609344).toFixed(3)));
            const currentPaceSec = paceMinutes * 60 + paceSeconds;
            const newPaceSec = Math.round(currentPaceSec * 1.609344);
            setPaceMinutes(Math.floor(newPaceSec / 60));
            setPaceSeconds(newPaceSec % 60);
        } else {
            setDistance(Number((distance * 1.609344).toFixed(3)));
            const currentPaceSec = paceMinutes * 60 + paceSeconds;
            const newPaceSec = Math.round(currentPaceSec / 1.609344);
            setPaceMinutes(Math.floor(newPaceSec / 60));
            setPaceSeconds(newPaceSec % 60);
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    // Apply Preset Race
    const applyPreset = (preset: RacePreset) => {
        setActivePresetId(preset.id);
        const dist = unitSystem === "km" ? preset.distanceKm : preset.distanceMiles;
        setDistance(dist);
    };

    // Reset Defaults
    const handleReset = () => {
        setCalcMode("finish_time");
        setUnitSystem("km");
        setPacingStrategy("even");
        setSplitInterval(1);
        setDistance(42.195);
        setTimeHours(3);
        setTimeMinutes(45);
        setTimeSeconds(0);
        setPaceMinutes(5);
        setPaceSeconds(20);
        setActivePresetId("marathon");
    };

    // Copy Summary
    const handleCopySummary = () => {
        const finishTime = formatDuration(computedMetrics.totalTimeSec, true);
        const paceKm = `${formatDuration(computedMetrics.paceSecPerKm)} /km`;
        const paceMi = `${formatDuration(computedMetrics.paceSecPerMile)} /mi`;

        const summary = `Race Split & Pace Estimator Summary:
----------------------------------------
Target Distance: ${computedMetrics.effectiveDistance.toFixed(2)} ${unitSystem.toUpperCase()}
Calculated Finish Time: ${finishTime}
Average Pace (Metric): ${paceKm}
Average Pace (Imperial): ${paceMi}
Average Speed: ${computedMetrics.speedKmh.toFixed(2)} km/h (${computedMetrics.speedMph.toFixed(2)} mph)
Pacing Strategy: ${pacingStrategy.toUpperCase()}
Est. VDOT / VO2 Equivalent: ${computedMetrics.vdot > 0 ? computedMetrics.vdot.toFixed(1) : "--"}
Est. Caloric Expenditure: ~${computedMetrics.estCalories70kg.toLocaleString()} kcal (70kg standard)
----------------------------------------
Calculated at twistertools.com/tools/calculators/race-split-pace-calculator`;

        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Export CSV
    const handleExportCSV = () => {
        const headers = ["Split #", `Distance (${unitSystem})`, "Lap Time", "Cumulative Time", "Lap Pace"];
        const rows = splitsTable.map(s => [
            s.splitNumber,
            s.splitDistance,
            s.lapTimeFormatted,
            s.cumulativeTimeFormatted,
            s.splitPaceFormatted
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(v => `"${v}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `race_splits_${unitSystem}_${pacingStrategy}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Race Split Times & Pace Calculator",
        "url": "https://twistertools.com/tools/calculators/race-split-pace-calculator",
        "description": "Calculate exact race split times, finish projections, negative pacing strategies, training pace zones, and VDOT aerobic metrics.",
        "applicationCategory": "SportsApplication",
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
                "name": "What is a negative pacing split in distance running?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A negative split occurs when an athlete runs the second half of a race faster than the first half. This strategy conserves glycogen stores early, optimizes lactate threshold clearance, and represents the statistical blueprint for the majority of marathon world records."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Peter Riegel formula project equivalent race times?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Peter Riegel's endurance formula uses the equation T2 = T1 × (D2 / D1)^1.06, where T1 is the baseline race time, D1 is the baseline distance, and D2 is the target distance. The 1.06 exponent accounts for natural aerodynamic and muscular fatigue across increased distances."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate running pace per kilometer and mile?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pace is calculated by dividing total running time in minutes by the total distance covered. For kilometers: Pace (min/km) = Total Minutes / Total Kilometers. For miles: Pace (min/mi) = Total Minutes / Total Miles."
                }
            },
            {
                "@type": "Question",
                "name": "What are heart rate training zones relative to target race pace?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Training zones delineate cardiovascular intensities: Zone 1 (Recovery, <65% HR max), Zone 2 (Aerobic Base, 65-75% HR max), Zone 3 (Tempo/Marathon Pace, 76-85% HR max), Zone 4 (Lactate Threshold, 86-92% HR max), and Zone 5 (VO2 Max, 93-100% HR max)."
                }
            },
            {
                "@type": "Question",
                "name": "Why is pacing strategy critical in marathon and half-marathon events?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Running too aggressively in the opening 10 kilometers accelerates carbohydrate depletion and causes metabolic acidosis early in the race. Maintaining disciplined, even, or slightly negative splits protects muscle glycogen and prevents hitting the wall at kilometer 32."
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
                {/* Left Workspace Panel: Input Parameters & Strategy Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Race Parameters
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-slate-700">
                                    Riegel & Daniels Engine
                                </span>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Calculation Goal Selection */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculation Target
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("finish_time")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center truncate ${calcMode === "finish_time"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Finish Time
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("required_pace")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center truncate ${calcMode === "required_pace"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Required Pace
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("distance")}
                                    className={`py-2 px-2 text-xs font-bold rounded-lg transition text-center truncate ${calcMode === "distance"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Distance Run
                                </button>
                            </div>
                        </div>

                        {/* Unit System Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Distance Unit
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("km")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "km"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Kilometers (km / min/km)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("miles")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "miles"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Miles (mi / min/mi)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Race Distance Field */}
                            {calcMode !== "distance" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <Milestone className="w-3.5 h-3.5 text-indigo-600" /> Race Distance
                                        </span>
                                        <span className="text-[11px] text-slate-400 lowercase font-normal">
                                            {unitSystem === "km" ? "standard marathon: 42.195 km" : "standard marathon: 26.219 mi"}
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.001"
                                            min="0.1"
                                            max="1000"
                                            value={distance === 0 ? "" : distance}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setDistance(Math.max(0, val)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                                            {unitSystem}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Pace Input (When calculating Finish Time or Distance) */}
                            {calcMode !== "required_pace" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-indigo-600" /> Target Average Pace (per {unitSystem})
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 min-w-0">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="59"
                                                value={paceMinutes === 0 ? "" : paceMinutes}
                                                onChange={(e) => handleNumberInput(e, (val) => setPaceMinutes(Math.max(0, val)))}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">min</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={paceSeconds === 0 ? "" : paceSeconds}
                                                onChange={(e) => handleNumberInput(e, (val) => setPaceSeconds(Math.max(0, Math.min(59, val))))}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">sec</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Target Time Input (When calculating Required Pace or Distance) */}
                            {calcMode !== "finish_time" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Target Finish Time
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 min-w-0">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="99"
                                                value={timeHours === 0 ? "" : timeHours}
                                                onChange={(e) => handleNumberInput(e, (val) => setTimeHours(Math.max(0, val)))}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">hrs</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={timeMinutes === 0 ? "" : timeMinutes}
                                                onChange={(e) => handleNumberInput(e, (val) => setTimeMinutes(Math.max(0, Math.min(59, val))))}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">min</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={timeSeconds === 0 ? "" : timeSeconds}
                                                onChange={(e) => handleNumberInput(e, (val) => setTimeSeconds(Math.max(0, Math.min(59, val))))}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">sec</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Pacing Strategy & Split Intervals */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-indigo-600" /> Pacing Strategy
                                    </label>
                                    <select
                                        value={pacingStrategy}
                                        onChange={(e) => setPacingStrategy(e.target.value as PacingStrategy)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                                    >
                                        <option value="even">Even Pacing (Constant)</option>
                                        <option value="negative">Negative Split (~3% Faster 2nd Half)</option>
                                        <option value="positive">Positive Split (~3% Slower 2nd Half)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <TableIcon className="w-3.5 h-3.5 text-indigo-600" /> Split Increments
                                    </label>
                                    <select
                                        value={splitInterval}
                                        onChange={(e) => setSplitInterval(Number(e.target.value))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                                    >
                                        <option value={1}>Every 1 {unitSystem}</option>
                                        <option value={2}>Every 2 {unitSystem}</option>
                                        <option value={5}>Every 5 {unitSystem}</option>
                                        <option value={10}>Every 10 {unitSystem}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* REFERENCE PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Standard Race Distances
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Race Selected
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {RACE_PRESETS.map((preset) => {
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

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export Splits CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Split Schedule, Equivalence & Zones */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Race Performance Metrics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("splits")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "splits" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Splits
                                </button>
                                <button
                                    onClick={() => setActiveTab("equivalents")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "equivalents" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Projections
                                </button>
                                <button
                                    onClick={() => setActiveTab("zones")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "zones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Pace Zones
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Estimated Finish Duration
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
                                    {pacingStrategy === "even" ? "Even Split" : pacingStrategy === "negative" ? "Negative Split (Fast Finish)" : "Positive Split (Conservative)"}
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-indigo-600">
                                    {formatDuration(computedMetrics.totalTimeSec, true)}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    ({computedMetrics.effectiveDistance.toFixed(2)} {unitSystem})
                                </span>
                            </div>

                            {/* Pace Equivalents Dual Badge Row */}
                            <div className="mt-4 pt-3 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Metric Pace</span>
                                    <span className="font-extrabold text-slate-800">
                                        {formatDuration(computedMetrics.paceSecPerKm)} <span className="font-normal text-slate-500">/km</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Imperial Pace</span>
                                    <span className="font-extrabold text-slate-800">
                                        {formatDuration(computedMetrics.paceSecPerMile)} <span className="font-normal text-slate-500">/mi</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Speed</span>
                                    <span className="font-extrabold text-indigo-600">
                                        {computedMetrics.speedKmh.toFixed(1)} <span className="font-normal text-slate-500">km/h</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Speed (MPH)</span>
                                    <span className="font-extrabold text-indigo-600">
                                        {computedMetrics.speedMph.toFixed(1)} <span className="font-normal text-slate-500">mph</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* TAB 1: SPLIT SCHEDULE TABLE */}
                        {activeTab === "splits" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                                    <span>Detailed Split Milestones ({splitsTable.length} splits)</span>
                                    <span className="text-indigo-600">Interval: {splitInterval} {unitSystem}</span>
                                </div>
                                <div className="overflow-y-auto max-h-[300px] border border-slate-200 rounded-xl scrollbar-thin scrollbar-thumb-slate-200">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 z-10">
                                            <tr>
                                                <th className="p-2.5">Split</th>
                                                <th className="p-2.5">Distance</th>
                                                <th className="p-2.5">Lap Time</th>
                                                <th className="p-2.5">Elapsed Time</th>
                                                <th className="p-2.5 text-right">Pace</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {splitsTable.map((split) => (
                                                <tr
                                                    key={split.splitNumber}
                                                    className={`transition ${split.isFinish ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 text-slate-900 flex items-center gap-1">
                                                        {split.isFinish && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                                                        #{split.splitNumber}
                                                    </td>
                                                    <td className="p-2.5 text-slate-900">{split.splitDistance} {unitSystem}</td>
                                                    <td className="p-2.5 text-slate-600">{split.lapTimeFormatted}</td>
                                                    <td className="p-2.5 text-indigo-600 font-semibold">{split.cumulativeTimeFormatted}</td>
                                                    <td className="p-2.5 text-right text-slate-600">{split.splitPaceFormatted}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: EQUIVALENT RACE PROJECTIONS */}
                        {activeTab === "equivalents" && (
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-slate-700 px-1">
                                    Peter Riegel Formula Projections ($T_2 = T_1 \cdot (D_2 / D_1)^{1.06}$)
                                </div>
                                <div className="overflow-hidden border border-slate-200 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-2.5">Race Event</th>
                                                <th className="p-2.5">Projected Time</th>
                                                <th className="p-2.5">Pace /km</th>
                                                <th className="p-2.5">Pace /mi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                            {raceEquivalents.map((item) => (
                                                <tr key={item.name} className="hover:bg-slate-50">
                                                    <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                                                    <td className="p-2.5 font-bold text-indigo-600">{item.time}</td>
                                                    <td className="p-2.5 text-slate-600">{item.paceKm}</td>
                                                    <td className="p-2.5 text-slate-600">{item.paceMile}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: TRAINING PACE ZONES */}
                        {activeTab === "zones" && (
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-700 px-1">
                                    Cardiovascular Intensity Training Zones
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {trainingZones.map((zone) => (
                                        <div key={zone.name} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-slate-900">{zone.name}</span>
                                                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                    {zone.hr}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">{zone.description}</p>
                                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs font-bold">
                                                <span className="text-slate-500">Target Pace:</span>
                                                <span className="text-slate-900">{unitSystem === "km" ? zone.paceDisplayKm : zone.paceDisplayMile}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Summary Metrics Row */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Aerobic VDOT</span>
                                <span className="text-base font-extrabold text-slate-900">
                                    {computedMetrics.vdot > 0 ? computedMetrics.vdot.toFixed(1) : "--"}
                                </span>
                                <span className="text-[10px] text-slate-500 block">Jack Daniels VO2 index</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Caloric Expenditure</span>
                                <span className="text-base font-extrabold text-indigo-600">
                                    ~{computedMetrics.estCalories70kg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                </span>
                                <span className="text-[10px] text-slate-500 block">Based on 70 kg standard runner</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Native Math
                        </span>
                        <span>Official IAAF / USATF Standards</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT & KNOWLEDGE BASE */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Pacing Science & Mathematical Formulations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Biomechanics and Mathematics of Race Split Pacing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In endurance running, maintaining precise metabolic control through structured split pacing is the single greatest determinant of athletic success. Whether preparing for a first 5K fun run or chasing a Boston Marathon qualifying standard (BQ), calculating target splits prevents premature glycogen depletion, manages lactate accumulation, and optimizes cardiovascular cardiac output over grueling distances.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-4 h-4 text-indigo-600" /> Even Pacing Strategy
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Distributes metabolic work evenly per kilometer or mile. Ideal for flat courses with mild weather conditions, minimizing acceleration spikes and muscular fatigue.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> Negative Split Strategy
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Running the second half of the race 2% to 4% faster than the first. This method protects glycogen in the opening 10 kilometers and is utilized in almost every marathon world record.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Positive Pacing (Front-loading)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Starting faster and slowing down later. While natural for shorter 800m or 1500m events, excessive positive splitting in marathons leads to early muscle cramping and hitting the wall.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Display Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Compass className="w-4 h-4" /> Core Endurance Algorithms & Mathematical Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Mathematical frameworks executing in real-time inside this calculator:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Velocity Pace Equation:</strong> Pace (sec/unit) = Total Time (seconds) / Distance (units)</div>
                            <div><strong>2. Peter Riegel Prediction Formula:</strong> T2 = T1 × (D2 / D1)^1.06</div>
                            <div><strong>3. Jack Daniels VDOT Metric:</strong> VO2 = (-4.60 + 0.182258 × v + 0.000104 × v²) / (0.8 + 0.1894393 × e^(-0.012778 × t) + 0.2989558 × e^(-0.1932605 × t))</div>
                            <div><strong>4. Energy Cost:</strong> Calories (kcal) ≈ Distance (km) × Body Weight (kg) × 1.036</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Standard Benchmark Distance Times Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Official Benchmark Race Distances & Pace Thresholds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Reference standards across popular competitive distance events categorized by finishing tiers:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Distance</th>
                                    <th className="p-3">Metric / Imperial</th>
                                    <th className="p-3">World Class / Elite</th>
                                    <th className="p-3">Advanced Club Target</th>
                                    <th className="p-3">Recreational Average</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">5K</td>
                                    <td className="p-3">5.00 km / 3.11 mi</td>
                                    <td className="p-3 text-emerald-600 font-semibold">&lt; 13:00 (2:36 /km)</td>
                                    <td className="p-3 text-indigo-600 font-medium">18:00 (3:36 /km)</td>
                                    <td className="p-3 text-slate-600">28:00 – 35:00 (5:36 – 7:00 /km)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">10K</td>
                                    <td className="p-3">10.00 km / 6.21 mi</td>
                                    <td className="p-3 text-emerald-600 font-semibold">&lt; 27:00 (2:42 /km)</td>
                                    <td className="p-3 text-indigo-600 font-medium">38:00 (3:48 /km)</td>
                                    <td className="p-3 text-slate-600">55:00 – 1:10:00 (5:30 – 7:00 /km)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Half Marathon</td>
                                    <td className="p-3">21.10 km / 13.11 mi</td>
                                    <td className="p-3 text-emerald-600 font-semibold">&lt; 58:00 (2:45 /km)</td>
                                    <td className="p-3 text-indigo-600 font-medium">1:25:00 (4:02 /km)</td>
                                    <td className="p-3 text-slate-600">2:00:00 – 2:30:00 (5:41 – 7:07 /km)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-bold text-indigo-900">Full Marathon</td>
                                    <td className="p-3 font-medium">42.20 km / 26.22 mi</td>
                                    <td className="p-3 text-emerald-600 font-bold">&lt; 2:02:00 (2:53 /km)</td>
                                    <td className="p-3 text-indigo-600 font-bold">Sub-3:00:00 (4:16 /km)</td>
                                    <td className="p-3 text-slate-600">4:15:00 – 4:45:00 (6:02 – 6:45 /km)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">50K Ultramarathon</td>
                                    <td className="p-3">50.00 km / 31.07 mi</td>
                                    <td className="p-3 text-emerald-600 font-semibold">&lt; 2:40:00 (3:12 /km)</td>
                                    <td className="p-3 text-indigo-600 font-medium">3:45:00 (4:30 /km)</td>
                                    <td className="p-3 text-slate-600">5:15:00 – 6:30:00 (6:18 – 7:48 /km)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Worked Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how pacing strategy directly impacts marathon outcomes and split management:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A: Sub-3:30 Marathon Negative Split */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Sub-3:30 Marathon (Negative Split)</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Target 3:29:50</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Goal:</strong> Break 3 hours 30 minutes on a rolling course.</li>
                                <li><strong>Required Avg Pace:</strong> 4:58 /km (8:00 /mi)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Split Strategy Execution:</li>
                                <li>• <strong>First Half (0 to 21.1 km):</strong> 1:46:15 (5:02 /km average pace)</li>
                                <li>• <strong>Second Half (21.1 to 42.2 km):</strong> 1:43:35 (4:54 /km average pace)</li>
                                <li>• <strong>Result:</strong> 3:29:50 finish time with zero glycogen crash at KM 35.</li>
                            </ul>
                        </div>

                        {/* Case Study B: Sub-20 Minute 5K Even Split */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Sub-20 Minute 5K (Even Split)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Target 19:50</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Goal:</strong> Break 20:00 on a standard track or certified road 5K.</li>
                                <li><strong>Required Avg Pace:</strong> 3:58 /km (6:23 /mi)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Kilometer Milestone Breakdown:</li>
                                <li>• <strong>KM 1:</strong> 3:58 | <strong>KM 2:</strong> 7:56 | <strong>KM 3:</strong> 11:54</li>
                                <li>• <strong>KM 4:</strong> 15:52 | <strong>KM 5 Finish:</strong> 19:50</li>
                                <li>• <strong>Result:</strong> Smooth aerobic execution avoiding early lactate buildup.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is a negative split and why is it recommended?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A negative split occurs when you run the second half of a race faster than the first. Running conservatively early prevents lactate accumulation and preserves liver and muscular glycogen stores, which are vital for finishing strong in distance events.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How accurate are the race time predictions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Predictions utilize the industry-standard Peter Riegel formula ($T_2 = T_1 \cdot (D_2 / D_1)^{1.06}$). While highly reliable, actual race day results depend on course topography, temperature, wind, fueling strategy, and whether your aerobic weekly mileage supports the longer distance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is VDOT and how does it relate to running pace?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                VDOT is an aerobic fitness score formulated by legendary exercise physiologist Dr. Jack Daniels. It combines VO2 max with running economy, allowing athletes to derive customized training paces across easy runs, tempo intervals, and repetitions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I convert pace from min/km to min/mile?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To convert min/km to min/mile, multiply your total pace in seconds by 1.609344. For instance, a 5:00 min/km pace equals 300 seconds × 1.609344 = 482.8 seconds, which converts to 8:03 min/mile.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are calories estimated during a run?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Caloric burn is calculated using the standard metabolic equivalent equation for running: ~1.036 kcal per kilogram of body weight per kilometer covered, adjusted for pace intensity.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Training Disclaimer Card */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Athletic Training & Medical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Athletic Training Disclaimer: This tool provides mathematical pace calculations and physiological estimates for athletic training and informational purposes only. Individual cardiovascular response, hydration requirements, and recovery times vary. Consult a qualified sports physician or certified coach before undertaking strenuous distance race training programs.
                    </p>
                </section>

            </div>
        </div>
    );
}