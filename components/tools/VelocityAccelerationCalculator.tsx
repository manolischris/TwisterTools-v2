"use client";

import React, { useState, useMemo } from "react";
import {
    Activity,
    Gauge,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    ShieldAlert,
    Sliders,
    TrendingUp,
    Zap,
    Scale,
    Timer,
    Compass,
    CheckCircle2,
    BarChart3,
    Car,
    Fuel,
    Layers,
    MoveRight
} from "lucide-react";

type UnitSystem = "metric" | "imperial";
type FrictionPresetKey = "dry_asphalt" | "wet_asphalt" | "snow" | "ice" | "gravel" | "custom";

interface KinematicMetrics {
    initialVelocityMs: number;
    initialVelocityKmh: number;
    initialVelocityMph: number;
    initialVelocityFps: number;
    finalVelocityMs: number;
    finalVelocityKmh: number;
    finalVelocityMph: number;
    finalVelocityFps: number;
    accelerationMs2: number;
    accelerationG: number;
    timeSeconds: number;
    distanceMeters: number;
    distanceFeet: number;
    reactionTimeSec: number;
    reactionDistanceMeters: number;
    reactionDistanceFeet: number;
    brakingDistanceMeters: number;
    brakingDistanceFeet: number;
    totalStoppingDistanceMeters: number;
    totalStoppingDistanceFeet: number;
    totalStoppingTimeSeconds: number;
    kineticEnergyJoules: number;
    kineticEnergyFtLbs: number;
    frictionCoefficient: number;
    gradePercent: number;
}

interface ComputationResult {
    valid: boolean;
    error?: string;
    metrics?: KinematicMetrics;
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

const FRICTION_PRESETS: Record<FrictionPresetKey, { label: string; mu: number }> = {
    dry_asphalt: { label: "Dry Clean Asphalt / Concrete (μ = 0.80)", mu: 0.80 },
    wet_asphalt: { label: "Wet Asphalt (μ = 0.50)", mu: 0.50 },
    gravel: { label: "Packed Gravel / Hard Dirt (μ = 0.35)", mu: 0.35 },
    snow: { label: "Packed Snow (μ = 0.20)", mu: 0.20 },
    ice: { label: "Wet Glare Ice (μ = 0.10)", mu: 0.10 },
    custom: { label: "Custom Friction Coefficient", mu: 0.70 }
};

const GRAVITY_MS2 = 9.80665;

export default function VelocityAccelerationCalculator() {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
    const [speedInput, setSpeedInput] = useState<number>(100); // km/h or mph
    const [reactionTimeInput, setReactionTimeInput] = useState<number>(1.5); // seconds (AASHTO standard: 1.5 - 2.5s)
    const [frictionPreset, setFrictionPreset] = useState<FrictionPresetKey>("dry_asphalt");
    const [customMu, setCustomMu] = useState<number>(0.80);
    const [gradeInput, setGradeInput] = useState<number>(0); // % incline/decline (-30 to +30)
    const [massInput, setMassInput] = useState<number>(1500); // kg or lbs
    const [targetAccelerationG, setTargetAccelerationG] = useState<number>(0); // 0 = use friction default
    const [precision, setPrecision] = useState<number>(2);
    const [copied, setCopied] = useState<boolean>(false);

    // Dynamic Kinematic & Braking Computation Engine
    const computation: ComputationResult = useMemo(() => {
        try {
            if (speedInput < 0) {
                return { valid: false, error: "Initial velocity cannot be negative." };
            }
            if (reactionTimeInput < 0) {
                return { valid: false, error: "Perception-reaction time cannot be negative." };
            }
            if (massInput <= 0) {
                return { valid: false, error: "Vehicle mass must be greater than 0." };
            }

            const activeMu = frictionPreset === "custom" ? customMu : FRICTION_PRESETS[frictionPreset].mu;
            if (activeMu <= 0 || activeMu > 2.0) {
                return { valid: false, error: "Friction coefficient (μ) must be between 0.01 and 2.00." };
            }

            // Convert input speed to m/s
            let v0_ms = 0;
            if (unitSystem === "metric") {
                v0_ms = (speedInput * 1000) / 3600; // km/h to m/s
            } else {
                v0_ms = speedInput * 0.44704; // mph to m/s
            }

            // Convert vehicle mass to kg for energy calculations
            const massKg = unitSystem === "metric" ? massInput : massInput * 0.45359237;

            // Longitudinal Grade adjustment: G = grade% / 100
            const gradeDecimal = gradeInput / 100;

            // Deceleration rate calculation: a = g * (μ + G)
            // If user manually set G-force override, use that; else derive from road friction & slope
            let effectiveDecelMs2 = 0;
            if (targetAccelerationG > 0) {
                effectiveDecelMs2 = targetAccelerationG * GRAVITY_MS2;
            } else {
                const combinedFrictionGrade = activeMu + gradeDecimal;
                if (combinedFrictionGrade <= 0) {
                    return { valid: false, error: "Severe downgrade causes net acceleration under current friction. Vehicle cannot stop." };
                }
                effectiveDecelMs2 = GRAVITY_MS2 * combinedFrictionGrade;
            }

            // 1. Perception-Reaction Phase
            const reactionDistanceMeters = v0_ms * reactionTimeInput;
            const reactionDistanceFeet = reactionDistanceMeters * 3.28084;

            // 2. Active Braking Phase: d = v^2 / (2a)
            const brakingDistanceMeters = (v0_ms * v0_ms) / (2 * effectiveDecelMs2);
            const brakingDistanceFeet = brakingDistanceMeters * 3.28084;
            const brakingTimeSeconds = v0_ms / effectiveDecelMs2;

            // 3. Totals
            const totalStoppingDistanceMeters = reactionDistanceMeters + brakingDistanceMeters;
            const totalStoppingDistanceFeet = totalStoppingDistanceMeters * 3.28084;
            const totalStoppingTimeSeconds = reactionTimeInput + brakingTimeSeconds;

            // 4. Kinetic Energy Dissipation: E_k = 1/2 * m * v^2
            const kineticEnergyJoules = 0.5 * massKg * (v0_ms * v0_ms);
            const kineticEnergyFtLbs = kineticEnergyJoules * 0.737562;

            // Speed unit conversions
            const v0_kmh = v0_ms * 3.6;
            const v0_mph = v0_ms / 0.44704;
            const v0_fps = v0_ms * 3.28084;

            return {
                valid: true,
                metrics: {
                    initialVelocityMs: v0_ms,
                    initialVelocityKmh: v0_kmh,
                    initialVelocityMph: v0_mph,
                    initialVelocityFps: v0_fps,
                    finalVelocityMs: 0,
                    finalVelocityKmh: 0,
                    finalVelocityMph: 0,
                    finalVelocityFps: 0,
                    accelerationMs2: effectiveDecelMs2,
                    accelerationG: effectiveDecelMs2 / GRAVITY_MS2,
                    timeSeconds: brakingTimeSeconds,
                    distanceMeters: totalStoppingDistanceMeters,
                    distanceFeet: totalStoppingDistanceFeet,
                    reactionTimeSec: reactionTimeInput,
                    reactionDistanceMeters,
                    reactionDistanceFeet,
                    brakingDistanceMeters,
                    brakingDistanceFeet,
                    totalStoppingDistanceMeters,
                    totalStoppingDistanceFeet,
                    totalStoppingTimeSeconds,
                    kineticEnergyJoules,
                    kineticEnergyFtLbs,
                    frictionCoefficient: activeMu,
                    gradePercent: gradeInput
                }
            };
        } catch {
            return { valid: false, error: "Mathematical calculation overflow or domain error." };
        }
    }, [speedInput, reactionTimeInput, frictionPreset, customMu, gradeInput, massInput, targetAccelerationG, unitSystem]);

    const m = computation.metrics;

    const handlePresetChange = (preset: FrictionPresetKey) => {
        setFrictionPreset(preset);
        if (preset !== "custom") {
            setCustomMu(FRICTION_PRESETS[preset].mu);
        }
    };

    const handleReset = () => {
        setUnitSystem("metric");
        setSpeedInput(100);
        setReactionTimeInput(1.5);
        setFrictionPreset("dry_asphalt");
        setCustomMu(0.80);
        setGradeInput(0);
        setMassInput(1500);
        setTargetAccelerationG(0);
        setPrecision(2);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: precision
        });
    };

    const handleCopyResults = () => {
        if (!m) return;
        const text = `TwisterTools Kinematic Velocity & Stopping Distance Report
--------------------------------------------------
Initial Speed:
  ${formatNum(m.initialVelocityKmh)} km/h | ${formatNum(m.initialVelocityMph)} mph | ${formatNum(m.initialVelocityMs)} m/s (${formatNum(m.initialVelocityFps)} ft/s)
Deceleration & Road Conditions:
  Friction Coefficient (μ): ${m.frictionCoefficient.toFixed(2)}
  Road Incline / Grade: ${m.gradePercent}%
  Deceleration Rate: ${formatNum(m.accelerationMs2)} m/s² (${formatNum(m.accelerationG)} G)
Perception-Reaction Breakdown:
  Reaction Time: ${formatNum(m.reactionTimeSec)} s
  Reaction Distance: ${formatNum(m.reactionDistanceMeters)} m (${formatNum(m.reactionDistanceFeet)} ft)
Braking Phase Breakdown:
  Active Braking Time: ${formatNum(m.timeSeconds)} s
  Active Braking Distance: ${formatNum(m.brakingDistanceMeters)} m (${formatNum(m.brakingDistanceFeet)} ft)
Total Stopping Performance:
  TOTAL STOPPING DISTANCE = ${formatNum(m.totalStoppingDistanceMeters)} m (${formatNum(m.totalStoppingDistanceFeet)} ft)
  TOTAL STOPPING TIME = ${formatNum(m.totalStoppingTimeSeconds)} s
Kinetic Energy Dissipated:
  ${formatNum(m.kineticEnergyJoules)} Joules (${formatNum(m.kineticEnergyFtLbs)} ft-lbs)
--------------------------------------------------
Generated via twistertools.com/tools/math-tools/velocity-acceleration-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Calculate percentage width for visual bar chart
    const reactionPct = m && m.totalStoppingDistanceMeters > 0
        ? Math.max(5, Math.min(95, (m.reactionDistanceMeters / m.totalStoppingDistanceMeters) * 100))
        : 35;
    const brakingPct = 100 - reactionPct;

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Velocity, Acceleration & Stopping Distance Calculator",
        "url": "https://twistertools.com/tools/math-tools/velocity-acceleration-calculator",
        "description": "Enterprise-grade kinematic physics and AASHTO vehicle stopping distance calculator. Computes reaction distance, braking distance, deceleration G-force, kinetic energy dissipation, and grade slope adjustments.",
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
                "name": "What is the standard formula for total vehicle stopping distance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Total stopping distance equals Perception-Reaction Distance plus Braking Distance: d_total = (v0 · t_reaction) + (v0² / [2g(μ + G)]), where v0 is initial speed in m/s, t_reaction is human perception time in seconds, g is gravitational acceleration (9.80665 m/s²), μ is tire-road friction coefficient, and G is longitudinal roadway grade slope."
                }
            },
            {
                "@type": "Question",
                "name": "Why does braking distance increase with the square of speed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Braking distance is governed by kinetic energy (Ek = 0.5 · m · v²). Because kinetic energy is proportional to velocity squared, doubling your speed quadruples (4x) the kinetic energy your vehicle's brakes and tire friction must dissipate to reach zero velocity."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard driver perception-reaction time recommended by AASHTO?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The American Association of State Highway and Transportation Officials (AASHTO) recommends a design perception-reaction time (PRT) of 2.5 seconds for highway engineering to accommodate 90% of drivers. Alert drivers in daylight test conditions typically exhibit reaction times between 0.75 and 1.5 seconds."
                }
            },
            {
                "@type": "Question",
                "name": "How does road surface friction coefficient (μ) affect deceleration?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The friction coefficient μ dictates the maximum longitudinal shear force between tires and pavement. Dry clean asphalt yields μ ≈ 0.70 to 0.85, whereas wet asphalt drops to 0.40 to 0.55, packed snow drops to 0.15 to 0.25, and glare ice plummets to 0.08 to 0.12, dramatically lengthening stopping distances by up to 800%."
                }
            },
            {
                "@type": "Question",
                "name": "How does hill grade or roadway slope influence braking distance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Road grade adds or subtracts gravitational force along the travel plane. An uphill incline (+G) helps decelerate the vehicle, shortening stopping distance. A downhill downgrade (-G) opposes braking friction, substantially increasing the required braking distance."
                }
            },
            {
                "@type": "Question",
                "name": "How do you convert deceleration from m/s² to G-force?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To convert deceleration in m/s² to G-force, divide the deceleration rate by standard Earth gravity (g = 9.80665 m/s²). For instance, a hard emergency brake stop of 7.84 m/s² corresponds to 7.84 / 9.80665 ≈ 0.80 G."
                }
            },
            {
                "@type": "Question",
                "name": "What are the four primary kinematic equations of motion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The four standard kinematic equations for constant acceleration are: 1) v = v0 + at, 2) d = v0·t + 0.5·a·t², 3) v² = v0² + 2ad, and 4) d = ((v0 + v)/2)·t."
                }
            },
            {
                "@type": "Question",
                "name": "Does vehicle weight or mass affect stopping distance on flat dry road?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In idealized physics where tire friction force is Coulombic (F_fric = μ · m · g), mass cancels out in deceleration: a = (μ · m · g) / m = μ · g. However, in real heavy vehicles, heavier mass drastically increases thermal brake fade, tire deformation limits, and kinetic energy load."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Kinematic & Friction Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Defaults
                            </button>
                        </div>

                        {/* Unit System Toggle */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement Unit System
                            </span>
                            <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-350">
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("metric")}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric" ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (km/h, m)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("imperial")}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial" ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (mph, ft)
                                </button>
                            </div>
                        </div>

                        {/* Speed & Reaction Time Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Initial Speed ({unitSystem === "metric" ? "km/h" : "mph"})
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {speedInput} {unitSystem === "metric" ? "km/h" : "mph"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max={unitSystem === "metric" ? "250" : "160"}
                                        step="1"
                                        value={speedInput}
                                        onChange={(e) => setSpeedInput(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="400"
                                        step="any"
                                        value={speedInput === 0 ? "" : speedInput}
                                        onChange={(e) => handleNumberInput(e, setSpeedInput)}
                                        className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Driver Perception-Reaction Time (PRT)
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {reactionTimeInput} s
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0.2"
                                        max="4.0"
                                        step="0.1"
                                        value={reactionTimeInput}
                                        onChange={(e) => setReactionTimeInput(parseFloat(e.target.value) || 0.2)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.05"
                                        value={reactionTimeInput === 0 ? "" : reactionTimeInput}
                                        onChange={(e) => handleNumberInput(e, setReactionTimeInput)}
                                        className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    AASHTO standard design: 1.5s (alert urban) to 2.5s (highway conservative).
                                </p>
                            </div>
                        </div>

                        {/* Road Surface & Friction Presets */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Surface Friction Coefficient (μ)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(Object.keys(FRICTION_PRESETS) as FrictionPresetKey[]).map((key) => {
                                    const preset = FRICTION_PRESETS[key];
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handlePresetChange(key)}
                                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between text-xs ${frictionPreset === key
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium"
                                                }`}
                                        >
                                            <span className="truncate">{preset.label}</span>
                                            {frictionPreset === key && <Check className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {frictionPreset === "custom" && (
                                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
                                    <label className="text-xs font-bold text-indigo-900 block">
                                        Custom Friction Coefficient (μ: 0.05 - 1.50)
                                    </label>
                                    <input
                                        type="number"
                                        min="0.05"
                                        max="2.00"
                                        step="0.01"
                                        value={customMu === 0 ? "" : customMu}
                                        onChange={(e) => handleNumberInput(e, setCustomMu)}
                                        className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Road Grade & Vehicle Mass Modifiers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700">Road Grade (%)</label>
                                    <span className={`text-xs font-bold font-mono ${gradeInput < 0 ? "text-rose-600" : gradeInput > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                                        {gradeInput > 0 ? `+${gradeInput}% (Uphill)` : gradeInput < 0 ? `${gradeInput}% (Downhill)` : "0% (Flat)"}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="-20"
                                    max="20"
                                    step="1"
                                    value={gradeInput}
                                    onChange={(e) => setGradeInput(parseFloat(e.target.value) || 0)}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700">
                                        Vehicle Mass ({unitSystem === "metric" ? "kg" : "lbs"})
                                    </label>
                                    <span className="text-xs font-mono font-bold text-slate-700">{massInput}</span>
                                </div>
                                <input
                                    type="number"
                                    min="100"
                                    step="50"
                                    value={massInput === 0 ? "" : massInput}
                                    onChange={(e) => handleNumberInput(e, setMassInput)}
                                    className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Decimal Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[2, 3, 4].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec} dp
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Handling Alert */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Kinematic Warning</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Physics Equilibrium Verified
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    g = 9.80665 m/s²
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            AASHTO Stopping Sight Distance Model
                        </span>
                        <span>Newtonian Mechanics</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Stopping Distance Metrics & Visual Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Calculated Stopping Profile & Deceleration
                            </h2>
                            {computation.valid && m && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200 font-mono">
                                    Decel: {formatNum(m.accelerationG)} G
                                </span>
                            )}
                        </div>

                        {/* Primary Output Hero Cards */}
                        {computation.valid && m ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Total Stopping Distance
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5 font-mono">
                                            {unitSystem === "metric"
                                                ? `${formatNum(m.totalStoppingDistanceMeters)} m`
                                                : `${formatNum(m.totalStoppingDistanceFeet)} ft`}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            {unitSystem === "metric"
                                                ? `≈ ${formatNum(m.totalStoppingDistanceFeet)} feet`
                                                : `≈ ${formatNum(m.totalStoppingDistanceMeters)} meters`}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Total Stopping Time
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5 font-mono">
                                            {formatNum(m.totalStoppingTimeSeconds)} s
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            Reaction: {formatNum(m.reactionTimeSec)}s + Braking: {formatNum(m.timeSeconds)}s
                                        </p>
                                    </div>
                                </div>

                                {/* Visual Distance Allocation Strip */}
                                <div className="space-y-2 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold flex items-center gap-1.5 text-indigo-300">
                                            <Car className="w-4 h-4 text-indigo-400" />
                                            Stopping Distance Split Proportion
                                        </span>
                                        <span className="font-mono text-[11px] text-slate-400">
                                            Total: {unitSystem === "metric" ? `${formatNum(m.totalStoppingDistanceMeters)}m` : `${formatNum(m.totalStoppingDistanceFeet)}ft`}
                                        </span>
                                    </div>

                                    {/* Segment Bar */}
                                    <div className="w-full h-7 bg-slate-800 rounded-lg overflow-hidden flex p-1 gap-1">
                                        <div
                                            style={{ width: `${reactionPct}%` }}
                                            className="bg-amber-500 rounded flex items-center justify-center text-[10px] font-bold text-amber-950 truncate transition-all duration-300"
                                            title="Reaction Distance"
                                        >
                                            Reaction ({formatNum(reactionPct)}%)
                                        </div>
                                        <div
                                            style={{ width: `${brakingPct}%` }}
                                            className="bg-indigo-500 rounded flex items-center justify-center text-[10px] font-bold text-white truncate transition-all duration-300"
                                            title="Active Braking Distance"
                                        >
                                            Active Braking ({formatNum(brakingPct)}%)
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-mono">
                                        <div className="text-amber-300">
                                            • Reaction Dist: {unitSystem === "metric" ? `${formatNum(m.reactionDistanceMeters)} m` : `${formatNum(m.reactionDistanceFeet)} ft`}
                                        </div>
                                        <div className="text-indigo-300 text-right">
                                            • Braking Dist: {unitSystem === "metric" ? `${formatNum(m.brakingDistanceMeters)} m` : `${formatNum(m.brakingDistanceFeet)} ft`}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Kinematic Metric Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Deceleration (a)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm font-mono">
                                            {formatNum(m.accelerationMs2)} m/s²
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Deceleration (G)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm font-mono">
                                            {formatNum(m.accelerationG)} G
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Velocity (m/s)</span>
                                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                                            {formatNum(m.initialVelocityMs)} m/s
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Velocity (ft/s)</span>
                                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                                            {formatNum(m.initialVelocityFps)} ft/s
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Kinetic Energy (J)</span>
                                        <span className="font-extrabold text-slate-900 text-xs font-mono">
                                            {formatNum(m.kineticEnergyJoules / 1000)} kJ
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Kinetic Energy (ft-lb)</span>
                                        <span className="font-extrabold text-slate-900 text-xs font-mono">
                                            {formatNum(m.kineticEnergyFtLbs / 1000)} k ft-lb
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid speed and reaction parameters to compute kinematic stopping metrics.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!computation.valid}
                            onClick={handleCopyResults}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${computation.valid
                                    ? "bg-slate-900 hover:bg-slate-800 text-white"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Stopping Distance Report Copied!" : "Copy Full Kinematic Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Kinematic & Stopping Distance Formula Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Kinematic & Vehicle Stopping Distance Formula Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Vehicle stopping dynamics are governed by classical Newtonian mechanics coupled with empirical transportation engineering principles established by AASHTO (American Association of State Highway and Transportation Officials). Total stopping sight distance comprises two distinct physical phases: the human cognitive perception-reaction distance and the mechanical tire-pavement friction braking distance.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Physical Variable</th>
                                    <th className="p-3">Formula / Equation</th>
                                    <th className="p-3">Standard SI Units</th>
                                    <th className="p-3">Engineering Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Reaction Distance ($d_r$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">d_r = v_0 \cdot t_r</td>
                                    <td className="p-3 text-xs">Meters ($m$)</td>
                                    <td className="p-3 text-xs">Distance traveled during driver cognitive perception and foot transfer</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Braking Distance ($d_b$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d_b = \\frac{v_0^2}{2g(\\mu \\pm G)}"}</td>
                                    <td className="p-3 text-xs">Meters ($m$)</td>
                                    <td className="p-3 text-xs">Distance covered from brake pad bite until zero velocity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">{"Total Stopping Distance ($d_{total}$)"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"d_{total} = d_r + d_b"}</td>
                                    <td className="p-3 text-xs">Meters ($m$) or Feet ($ft$)</td>
                                    <td className="p-3 text-xs">Complete physical distance required to bring vehicle to a dead stop</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Deceleration Rate ($a$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">a = g(\mu \pm G)</td>
                                    <td className="p-3 text-xs">m/s²</td>
                                    <td className="p-3 text-xs">Linear deceleration generated by tire friction and grade slope</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Deceleration G-Force ($a_g$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"a_g = \\frac{a}{g} = \\mu \\pm G"}</td>
                                    <td className="p-3 text-xs">Dimensionless ($G$)</td>
                                    <td className="p-3 text-xs">Effective braking force expressed relative to standard Earth gravity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Kinetic Energy Dissipated ($E_k$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"E_k = \\frac{1}{2} m v_0^2"}</td>
                                    <td className="p-3 text-xs">Joules ($J$) or ft-lbs</td>
                                    <td className="p-3 text-xs">Total mechanical thermal energy dissipated by the braking friction system</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Road Surface Friction Coefficient & Stopping Performance Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Road Friction Coefficients ($\mu$) & Weather Impact Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The coefficient of friction ($\mu$) between tire tread and roadway surface is the primary limiting factor for maximum braking deceleration. Wetness, ice, and loose gravel severely restrict longitudinal shear force transmission, as quantified below:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Pavement & Condition</th>
                                    <th className="p-3">Nominal $\mu$ Range</th>
                                    <th className="p-3">Peak Deceleration ($G$)</th>
                                    <th className="p-3">Stop Distance (60 mph / 97 km/h)</th>
                                    <th className="p-3">Stopping Factor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">Dry Asphalt / Concrete</td>
                                    <td className="p-3 text-indigo-600">0.75 – 0.90</td>
                                    <td className="p-3">0.80 G (~7.85 m/s²)</td>
                                    <td className="p-3">45.2 m (148 ft)</td>
                                    <td className="p-3 font-bold text-emerald-700 font-sans">1.0x (Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">Wet Asphalt (Moderate Rain)</td>
                                    <td className="p-3 text-indigo-600">0.45 – 0.60</td>
                                    <td className="p-3">0.50 G (~4.90 m/s²)</td>
                                    <td className="p-3">72.4 m (238 ft)</td>
                                    <td className="p-3 font-bold text-amber-700 font-sans">1.6x Longer</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">Packed Gravel / Hard Dirt</td>
                                    <td className="p-3 text-indigo-600">0.30 – 0.40</td>
                                    <td className="p-3">0.35 G (~3.43 m/s²)</td>
                                    <td className="p-3">103.5 m (340 ft)</td>
                                    <td className="p-3 font-bold text-orange-700 font-sans">2.3x Longer</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">Packed Hard Snow</td>
                                    <td className="p-3 text-indigo-600">0.15 – 0.25</td>
                                    <td className="p-3">0.20 G (~1.96 m/s²)</td>
                                    <td className="p-3">181.1 m (594 ft)</td>
                                    <td className="p-3 font-bold text-rose-700 font-sans">4.0x Longer</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">Glare Ice / Black Ice</td>
                                    <td className="p-3 text-indigo-600">0.08 – 0.12</td>
                                    <td className="p-3">0.10 G (~0.98 m/s²)</td>
                                    <td className="p-3">362.2 m (1,188 ft)</td>
                                    <td className="p-3 font-bold text-rose-900 font-sans">8.0x Longer</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: The Velocity-Squared Phenomenon & Kinetic Energy */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Velocity-Squared Principle & Kinetic Energy Dissipation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Why does an increase in vehicle speed from 50 km/h to 100 km/h not simply double the stopping distance, but quadruple it? The physical explanation lies in the Work-Energy Theorem ($W = \Delta E_k$).
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> 1. Quadratic Velocity Scaling
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"Kinetic energy is defined as $E_k = \\frac{1}{2}mv^2$. Work done by braking friction over distance $d_b$ equals $W = F_{friction} \\cdot d_b = (\\mu m g) \\cdot d_b$. Equating work to kinetic energy:"}
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"\\mu m g \\cdot d_b = \\frac{1}{2} m v_0^2"}</p>
                                <p className="font-bold text-slate-900">{"d_b = \\frac{v_0^2}{2 \\mu g}"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Because $v_0$ is squared, driving at 2x the speed demands 4x the braking distance. Driving at 3x the speed demands 9x the braking distance.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <MoveRight className="w-4 h-4 text-indigo-600" /> 2. AASHTO Perception-Reaction Anatomy
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Human reaction time is divided into four distinct neurological sub-stages (PIEV model):
                            </p>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                <li><strong>Perception:</strong> Eye detects an obstacle or brake light (~0.3s).</li>
                                <li><strong>Identification:</strong> Brain recognizes hazard severity (~0.5s).</li>
                                <li><strong>Emotion / Decision:</strong> Brain decides to execute emergency stop (~0.4s).</li>
                                <li><strong>Volition / Action:</strong> Foot shifts from accelerator to brake (~0.3s).</li>
                            </ul>
                            <p className="text-[11px] text-slate-500 pt-1">
                                At 100 km/h (27.8 m/s), a standard 1.5-second reaction delay covers 41.7 meters of blind travel before deceleration begins.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Mathematical Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Kinematic Stopping Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine these complete mathematical derivations for typical highway driving scenarios on dry and wet pavement:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Highway Emergency Stop (100 km/h, Dry Asphalt)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Dry Flat μ=0.80</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Convert Speed to SI Units:</strong></li>
                                <li className="text-indigo-700 pl-3">{"v_0 = 100 \\times \\frac{1000}{3600} = 27.78 \\text{ m/s}"}</li>
                                <li><strong>2. Compute Reaction Distance (t_r = 1.5 s):</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_r = 27.78 \\times 1.5 = 41.67 \\text{ m}"}</li>
                                <li><strong>3. Compute Deceleration Rate (μ = 0.80):</strong></li>
                                <li className="text-indigo-700 pl-3">{"a = 9.80665 \\times 0.80 = 7.845 \\text{ m/s}^2 \\ (0.80\\text{ G})"}</li>
                                <li><strong>4. Compute Active Braking Distance:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_b = \\frac{27.78^2}{2 \\times 7.845} = \\frac{771.73}{15.69} = 49.19 \\text{ m}"}</li>
                                <li><strong>5. Calculate Total Stopping Distance:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{total} = 41.67 + 49.19 = 90.86 \\text{ m (298.1 ft)}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Total Stopping Time: 1.5s + (27.78 / 7.845) = 5.04 seconds.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Wet Downgrade Stop (100 km/h, μ = 0.50, -5% Grade)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Wet Slope G = -0.05</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Initial Speed:</strong></li>
                                <li className="text-indigo-700 pl-3">{"v_0 = 27.78 \\text{ m/s}"}</li>
                                <li><strong>2. Reaction Distance (t_r = 1.5 s):</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_r = 27.78 \\times 1.5 = 41.67 \\text{ m}"}</li>
                                <li><strong>3. Combined Deceleration on Downgrade:</strong></li>
                                <li className="text-indigo-700 pl-3">{"a = 9.80665 \\times (0.50 - 0.05) = 9.80665 \\times 0.45 = 4.413 \\text{ m/s}^2"}</li>
                                <li><strong>4. Active Braking Distance on Wet Slope:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_b = \\frac{27.78^2}{2 \\times 4.413} = \\frac{771.73}{8.826} = 87.44 \\text{ m}"}</li>
                                <li><strong>5. Total Required Stopping Distance:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d_{total} = 41.67 + 87.44 = 129.11 \\text{ m (423.6 ft)}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-rose-900 font-bold font-sans">
                                    • Wet downgrade extends stopping distance by +38.25 m (+42.1%).
                                </li>
                            </ul>
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
                                What is the standard formula for total vehicle stopping distance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Total stopping distance is calculated by summing Perception-Reaction Distance and Active Braking Distance: $d_{total} = (v_0 \\cdot t_r) + \\frac{v_0^2}{2g(\\mu \\pm G)}$. Here, $v_0$ is the vehicle speed in m/s, $t_r$ is driver reaction time, $g = 9.80665 \\text{ m/s}^2$, $\\mu$ is the tire-pavement friction coefficient, and $G$ is the fractional road grade slope."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does braking distance increase with the square of speed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Braking distance is governed by kinetic energy ($E_k = \\frac{1}{2}mv^2$). Because energy increases quadratically with speed, doubling your velocity from 50 km/h to 100 km/h quadruples the mechanical heat energy that must be absorbed by brakes and tire friction to achieve zero velocity."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard driver perception-reaction time recommended by AASHTO?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The American Association of State Highway and Transportation Officials (AASHTO) mandates a design perception-reaction time (PRT) of 2.5 seconds for roadway sight-distance design to safely accommodate 90% of all drivers across diverse age groups and lighting conditions. Alert drivers in daylight test situations typically react between 0.75 and 1.5 seconds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does road surface friction coefficient ($\mu$) affect deceleration?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The friction coefficient $\mu$ represents the maximum tractive shear force tires can generate without spinning or skidding. Dry asphalt provides $\mu \approx 0.75 - 0.85$ (~0.80 G), wet asphalt drops to $0.45 - 0.55$ (~0.50 G), packed snow yields $0.20$, and glare ice drops to $0.10$, increasing braking distances up to 8x over dry conditions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does road grade or hill slope influence stopping distance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Road grade introduces an additional gravitational component along the direction of travel. An uphill incline ($+G$) assists braking friction, shortening braking distance. A downhill downgrade ($-G$) acts in the direction of motion, opposing tire friction and substantially increasing stopping distance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you convert deceleration from m/s² to G-force?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Divide linear deceleration in $\\text{m/s}^2$ by standard gravitational acceleration ($g = 9.80665 \\text{ m/s}^2$). For example, a severe emergency stop generating $7.85 \\text{ m/s}^2$ of deceleration corresponds to $7.85 / 9.80665 \\approx 0.80\\text{ G}$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does vehicle weight affect stopping distance on dry flat asphalt?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under idealized classical Coulomb friction, vehicle mass cancels out because normal friction force scales proportionally with mass ($F = \mu mg \implies a = F/m = \mu g$). However, on real heavy trucks, additional mass leads to significant tire contact shear limits, suspension weight transfer, and severe brake thermal fading.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the four core kinematic equations for constant acceleration?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The four fundamental kinematic equations are: 1) $v = v_0 + at$, 2) $d = v_0 t + \\frac{1}{2}at^2$, 3) $v^2 = v_0^2 + 2ad$, and 4) $d = \\left(\\frac{v_0 + v}{2}\\right)t$."}
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}