"use client";

import React, { useState, useMemo } from "react";
import {
    Volume2,
    VolumeX,
    Volume1,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Activity,
    Sliders,
    Maximize2,
    GraduationCap,
    Grid,
    TrendingUp,
    ShieldAlert,
    Zap,
    Radio,
    Layers,
    Flame,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

type EnvironmentType = "FREE_FIELD" | "HEMISPHERICAL" | "LINE_SOURCE";
type DistanceUnit = "m" | "ft";

interface DecibelCalculationResult {
    valid: boolean;
    error?: string;
    sourceSPL: number; // L1 in dB
    targetSPL: number; // L2 in dB
    r1: number; // reference distance in meters
    r2: number; // target distance in meters
    soundPressure1: number; // Pascals
    soundPressure2: number; // Pascals
    soundIntensity1: number; // W/m^2
    soundIntensity2: number; // W/m^2
    attenuationDB: number; // Drop in dB
    distanceRatio: number; // r2 / r1
    soundPowerLevel?: number; // Lw (dB SWL)
    safetyCategory: {
        label: string;
        color: string;
        maxExposure: string;
        desc: string;
    };
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

const getSafetyCategory = (spl: number) => {
    if (spl < 60) {
        return {
            label: "Safe & Quiet",
            color: "text-emerald-700 bg-emerald-50 border-emerald-200",
            maxExposure: "Safe indefinitely",
            desc: "Normal conversation, quiet office, or residential ambient levels."
        };
    }
    if (spl < 80) {
        return {
            label: "Moderate Sound",
            color: "text-blue-700 bg-blue-50 border-blue-200",
            maxExposure: "Safe indefinitely",
            desc: "Busy commercial interior, vacuum cleaner, or highway traffic at distance."
        };
    }
    if (spl < 85) {
        return {
            label: "Action Level Threshold",
            color: "text-amber-700 bg-amber-50 border-amber-200",
            maxExposure: "8 Hours (OSHA Action Level)",
            desc: "Hearing protection recommended for prolonged occupational exposure."
        };
    }
    if (spl < 100) {
        return {
            label: "Hazardous Noise Zone",
            color: "text-orange-700 bg-orange-50 border-orange-200",
            maxExposure: "15 min to 2 Hours",
            desc: "Lawnmower, factory machinery, power tools. Mandatory hearing PPE."
        };
    }
    if (spl < 120) {
        return {
            label: "High Danger Level",
            color: "text-rose-700 bg-rose-50 border-rose-200",
            maxExposure: "< 1 to 7 Minutes",
            desc: "Live rock concert, chainsaw, car horn at 1m. Severe risk of hearing damage."
        };
    }
    return {
        label: "Threshold of Pain & Trauma",
        color: "text-purple-700 bg-purple-50 border-purple-200",
        maxExposure: "Immediate Risk (0 sec)",
        desc: "Jet engine takeoff, gunshot, siren. Immediate eardrum acoustic trauma."
    };
};

export default function DecibelAttenuationCalculator() {
    const [envType, setEnvType] = useState<EnvironmentType>("FREE_FIELD");
    const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("m");
    const [precision, setPrecision] = useState<number>(2);

    // Input states
    const [l1Input, setL1Input] = useState<number>(90); // Initial SPL (dB)
    const [r1Input, setR1Input] = useState<number>(1); // Reference Distance
    const [r2Input, setR2Input] = useState<number>(10); // Target Distance
    const [includeAirAbs, setIncludeAirAbs] = useState<boolean>(false);
    const [airAbsCoeff, setAirAbsCoeff] = useState<number>(0.005); // dB/m (standard ~1kHz at 20°C, 50% RH)

    const [copied, setCopied] = useState<boolean>(false);

    // Convert distances internally to meters for physics formulas
    const r1Meters = distanceUnit === "ft" ? r1Input * 0.3048 : r1Input;
    const r2Meters = distanceUnit === "ft" ? r2Input * 0.3048 : r2Input;

    const computation: DecibelCalculationResult = useMemo(() => {
        try {
            if (r1Meters <= 0 || r2Meters <= 0) {
                return {
                    valid: false,
                    error: "Distances r₁ and r₂ must be positive real numbers greater than 0.",
                    sourceSPL: l1Input,
                    targetSPL: 0,
                    r1: r1Meters,
                    r2: r2Meters,
                    soundPressure1: 0,
                    soundPressure2: 0,
                    soundIntensity1: 0,
                    soundIntensity2: 0,
                    attenuationDB: 0,
                    distanceRatio: 0,
                    safetyCategory: getSafetyCategory(0)
                };
            }

            // Inverse Square Law: Free-field (point source) = -20*log10(r2/r1) [6 dB per doubling]
            // Line source (cylindrical) = -10*log10(r2/r1) [3 dB per doubling]
            let geometricLoss = 0;
            if (envType === "LINE_SOURCE") {
                geometricLoss = 10 * Math.log10(r2Meters / r1Meters);
            } else {
                geometricLoss = 20 * Math.log10(r2Meters / r1Meters);
            }

            // Atmospheric absorption loss
            const atmosphericLoss = includeAirAbs ? airAbsCoeff * (r2Meters - r1Meters) : 0;
            const totalLoss = geometricLoss + atmosphericLoss;
            const l2 = l1Input - totalLoss;

            // Reference physical thresholds:
            // P0 = 20 µPa = 20e-6 Pa
            // I0 = 10^-12 W/m^2 (0.000000000001 W/m^2)
            const p0 = 20e-6;
            const i0 = 1e-12;

            // Pressure: SPL = 20*log10(P / P0) => P = P0 * 10^(SPL / 20)
            const soundPressure1 = p0 * Math.pow(10, l1Input / 20);
            const soundPressure2 = p0 * Math.pow(10, l2 / 20);

            // Intensity: SIL = 10*log10(I / I0) => I = I0 * 10^(SIL / 10)
            const soundIntensity1 = i0 * Math.pow(10, l1Input / 10);
            const soundIntensity2 = i0 * Math.pow(10, l2 / 10);

            // Sound Power Level (Lw) calculation:
            // Free field: Lw = L1 + 20*log10(r1) + 11 (spherical)
            // Hemispherical: Lw = L1 + 20*log10(r1) + 8 (over reflective ground plane)
            let soundPowerLevel: number | undefined;
            if (envType === "FREE_FIELD") {
                soundPowerLevel = l1Input + 20 * Math.log10(r1Meters) + 10.99;
            } else if (envType === "HEMISPHERICAL") {
                soundPowerLevel = l1Input + 20 * Math.log10(r1Meters) + 7.98;
            }

            return {
                valid: true,
                sourceSPL: l1Input,
                targetSPL: l2,
                r1: r1Meters,
                r2: r2Meters,
                soundPressure1,
                soundPressure2,
                soundIntensity1,
                soundIntensity2,
                attenuationDB: totalLoss,
                distanceRatio: r2Meters / r1Meters,
                soundPowerLevel,
                safetyCategory: getSafetyCategory(l2)
            };
        } catch {
            return {
                valid: false,
                error: "Calculation domain error. Check input parameters.",
                sourceSPL: l1Input,
                targetSPL: 0,
                r1: r1Meters,
                r2: r2Meters,
                soundPressure1: 0,
                soundPressure2: 0,
                soundIntensity1: 0,
                soundIntensity2: 0,
                attenuationDB: 0,
                distanceRatio: 0,
                safetyCategory: getSafetyCategory(0)
            };
        }
    }, [l1Input, r1Meters, r2Meters, envType, includeAirAbs, airAbsCoeff]);

    const handleReset = () => {
        setEnvType("FREE_FIELD");
        setDistanceUnit("m");
        setPrecision(2);
        setL1Input(90);
        setR1Input(1);
        setR2Input(10);
        setIncludeAirAbs(false);
        setAirAbsCoeff(0.005);
    };

    const handlePreset = (presetL1: number, presetR1: number, presetR2: number, name: string) => {
        setL1Input(presetL1);
        setR1Input(presetR1);
        setR2Input(presetR2);
    };

    const handleCopyResults = () => {
        if (!computation.valid) return;
        const format = (n: number) => n.toFixed(precision);
        const text = `Sound Decibel (dB) Distance & Attenuation Report (twistertools.com)
----------------------------------------
Input Configuration:
  Propagation Model: ${envType === "FREE_FIELD" ? "Spherical Free-Field (Point Source)" : envType === "HEMISPHERICAL" ? "Hemispherical Surface (Ground Reflection)" : "Line Source (Cylindrical Propagation)"}
  Initial Sound Level (L₁): ${format(computation.sourceSPL)} dB SPL at ${r1Input} ${distanceUnit}
  Target Distance (r₂): ${r2Input} ${distanceUnit}
  Atmospheric Absorption: ${includeAirAbs ? `Active (${airAbsCoeff} dB/m)` : "Disabled"}

Acoustic Results at Distance:
  Target Sound Level (L₂): ${format(computation.targetSPL)} dB SPL
  Total Sound Attenuation (ΔL): ${format(computation.attenuationDB)} dB
  Distance Ratio (r₂ / r₁): ${format(computation.distanceRatio)}x
  Target Sound Pressure (P₂): ${computation.soundPressure2.toExponential(4)} Pa
  Target Sound Intensity (I₂): ${computation.soundIntensity2.toExponential(4)} W/m²
  ${computation.soundPowerLevel ? `Estimated Sound Power Level (Lw): ${format(computation.soundPowerLevel)} dB SWL` : ""}

Safety Evaluation:
  Category: ${computation.safetyCategory.label}
  Max Recommended Exposure: ${computation.safetyCategory.maxExposure}
----------------------------------------
Generated via TwisterTools Decibel Attenuation Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toString();
    };

    // Dynamic SVG Wave Propagation Visualizer coordinates
    const svgWaveData = useMemo(() => {
        if (!computation.valid) return null;
        const maxR = Math.max(r1Meters, r2Meters, 1);
        const scale = 110 / maxR;

        const r1Scaled = Math.min(Math.max(r1Meters * scale, 16), 55);
        const r2Scaled = Math.min(Math.max(r2Meters * scale, 30), 125);

        return {
            cx: 40,
            cy: 100,
            r1Scaled,
            r2Scaled
        };
    }, [computation.valid, r1Meters, r2Meters]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Sound Decibel (dB) Distance & Attenuation Calculator",
        "url": "https://twistertools.com/tools/math-tools/decibel-attenuation-calculator",
        "description": "Professional acoustic distance attenuation calculator. Computes sound pressure level (dB SPL), sound intensity, atmospheric absorption loss, and OSHA noise safety limits based on the inverse square law.",
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
                "name": "How does sound level (dB) decrease with distance according to the Inverse Square Law?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For a point sound source radiating uniformly in an ideal free field (spherical expansion), sound energy spreads over an area that scales with the square of the distance (4πr²). As distance doubles (r2 = 2r1), the sound intensity drops by a factor of 4, corresponding to an exact reduction of 20·log10(2) ≈ 6.02 dB SPL."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between point source and line source attenuation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A point source (like a loudspeaker, generator, or engine) radiates spherically and drops by 6 dB per doubling of distance. A line source (such as a continuous highway of traffic or long industrial conveyor) radiates cylindrical wave fronts, causing sound pressure level to drop by only 3 dB per doubling of distance (10·log10(r2/r1))."
                }
            },
            {
                "@type": "Question",
                "name": "What is the formula for decibel attenuation over distance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The fundamental formula is L2 = L1 - 20·log10(r2 / r1) - (α · Δr), where L1 is the known sound pressure level at distance r1, L2 is the sound level at target distance r2, and α is the atmospheric absorption coefficient in dB/meter."
                }
            },
            {
                "@type": "Question",
                "name": "What is the relationship between Sound Pressure (Pa), Sound Intensity (W/m²), and Decibels (dB)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sound Pressure Level (SPL) is a logarithmic ratio of acoustic pressure relative to the auditory threshold of 20 µPa (P0 = 2·10⁻⁵ Pa). Sound Intensity Level (SIL) measures sound power flow per unit area relative to I0 = 10⁻¹² W/m². In normal air, a doubling of sound pressure increases SPL by 6 dB, while a doubling of acoustic power/intensity increases SPL by 3 dB."
                }
            },
            {
                "@type": "Question",
                "name": "What are the OSHA and NIOSH maximum permissible noise exposure limits?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "OSHA establishes a Permissible Exposure Limit (PEL) of 90 dBA for an 8-hour shift with a 5 dB exchange rate (e.g., 95 dBA is limited to 4 hours). NIOSH provides a safer standard with an 85 dBA 8-hour limit and a strict 3 dB exchange rate (88 dBA for 4 hours, 91 dBA for 2 hours, and 100 dBA for just 15 minutes)."
                }
            },
            {
                "@type": "Question",
                "name": "How does atmospheric absorption affect high vs low audio frequencies?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atmospheric air absorption occurs due to molecular relaxation of oxygen and nitrogen molecules along with thermal conduction and viscosity. Higher frequencies (4 kHz – 10 kHz) attenuate substantially faster over long distances (up to 0.03–0.1 dB/m) than bass frequencies (63 Hz – 250 Hz, < 0.001 dB/m), which is why thunder or concert bass travels much farther than crisp treble."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate Sound Power Level (Lw) from Sound Pressure Level (Lp)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sound Power Level (Lw) is the total acoustic energy output of the source, independent of distance. For a spherical free-field source: Lw = Lp + 20·log10(r) + 11 dB. For hemispherical propagation over a rigid reflective ground plane: Lw = Lp + 20·log10(r) + 8 dB."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters & Acoustic Models */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Radio className="w-5 h-5 text-indigo-600" />
                                Acoustic Parameters & Propagation
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Propagation Field Selection */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Geometric Radiation Model
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500">Unit:</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setDistanceUnit("m")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${distanceUnit === "m" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Meters (m)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDistanceUnit("ft")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${distanceUnit === "ft" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Feet (ft)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mode Button Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                    {
                                        id: "FREE_FIELD",
                                        label: "Free Field (3D)",
                                        sub: "Point Source (-6 dB / 2x)",
                                        icon: Volume2
                                    },
                                    {
                                        id: "HEMISPHERICAL",
                                        label: "Hemispherical (2D)",
                                        sub: "Ground Plane (-6 dB / 2x)",
                                        icon: Layers
                                    },
                                    {
                                        id: "LINE_SOURCE",
                                        label: "Line Source (1D)",
                                        sub: "Cylindrical (-3 dB / 2x)",
                                        icon: Activity
                                    }
                                ].map((mode) => {
                                    const Icon = mode.icon;
                                    return (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setEnvType(mode.id as EnvironmentType)}
                                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${envType === mode.id
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Icon className={`w-4 h-4 ${envType === mode.id ? "text-indigo-200" : "text-indigo-600"}`} />
                                                <span className="font-extrabold text-xs">{mode.label}</span>
                                            </div>
                                            <span className={`text-[10px] ${envType === mode.id ? "text-indigo-100" : "text-slate-500"}`}>
                                                {mode.sub}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Benchmark Presets */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                Quick Real-World Presets
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { name: "Concert PA", l1: 110, r1: 1, r2: 30 },
                                    { name: "Industrial Plant", l1: 95, r1: 2, r2: 50 },
                                    { name: "Highway Traffic", l1: 85, r1: 5, r2: 100 },
                                    { name: "Lawn Mower", l1: 90, r1: 1, r2: 15 },
                                    { name: "Home Audio", l1: 75, r1: 1, r2: 4 }
                                ].map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        onClick={() => handlePreset(p.l1, p.r1, p.r2, p.name)}
                                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition cursor-pointer"
                                    >
                                        {p.name} ({p.l1}dB @ {p.r1}m)
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Dimension Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            {/* L1 Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Initial Sound Pressure Level (L₁)
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {l1Input} dB SPL
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="30"
                                        max="150"
                                        step="0.5"
                                        value={l1Input}
                                        onChange={(e) => setL1Input(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="200"
                                        step="any"
                                        value={l1Input === 0 ? "" : l1Input}
                                        onChange={(e) => handleNumberInput(e, setL1Input)}
                                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* r1 and r2 Distance Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Reference Distance (r₁)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={r1Input === 0 ? "" : r1Input}
                                            onChange={(e) => handleNumberInput(e, setR1Input)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                            placeholder="e.g. 1"
                                        />
                                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                                            {distanceUnit}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Target Distance (r₂)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="any"
                                            value={r2Input === 0 ? "" : r2Input}
                                            onChange={(e) => handleNumberInput(e, setR2Input)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                            placeholder="e.g. 10"
                                        />
                                        <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                                            {distanceUnit}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Atmospheric Absorption Toggle */}
                            <div className="pt-3 border-t border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                                        Include Atmospheric Air Absorption (ISO 9613-1)
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={includeAirAbs}
                                        onChange={(e) => setIncludeAirAbs(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>

                                {includeAirAbs && (
                                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 font-medium">Absorption Rate (α):</span>
                                            <span className="font-mono font-bold text-indigo-600">{airAbsCoeff} dB/m</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {[
                                                { label: "1 kHz (0.005 dB/m)", val: 0.005 },
                                                { label: "2 kHz (0.010 dB/m)", val: 0.01 },
                                                { label: "4 kHz (0.028 dB/m)", val: 0.028 }
                                            ].map((item) => (
                                                <button
                                                    key={item.label}
                                                    type="button"
                                                    onClick={() => setAirAbsCoeff(item.val)}
                                                    className={`p-1.5 text-[10px] font-bold rounded text-center border transition ${airAbsCoeff === item.val
                                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
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

                        {/* Solver Status Alert */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Acoustic Computation Error</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between text-xs text-indigo-950">
                                <span className="font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                    Inverse Square Law Applied (ISO 3744)
                                </span>
                                <span className="font-semibold bg-white border border-indigo-200 px-2 py-0.5 rounded text-[11px] text-indigo-700">
                                    {envType === "LINE_SOURCE" ? "Δ = -3 dB / 2x" : "Δ = -6.02 dB / 2x"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            P₀ = 20 µPa | I₀ = 10⁻¹² W/m²
                        </span>
                        <span>Acoustic Physics Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Analytics & Real-Time Wave Visualizer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Decibel Attenuation & Intensity Output
                            </h2>
                            {computation.valid && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                    Δ {formatNum(computation.attenuationDB)} dB
                                </span>
                            )}
                        </div>

                        {/* Wave Dispersion & Vector Propagation Graphic */}
                        <div className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden min-h-[220px]">
                            <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Sound Wave Energy Divergence (2D Projection)
                            </div>

                            {computation.valid && svgWaveData ? (
                                <svg viewBox="0 0 320 200" className="w-full h-44 overflow-visible mt-6">
                                    {/* Acoustic Sound Source */}
                                    <circle cx={svgWaveData.cx} cy={svgWaveData.cy} r="8" fill="#6366f1" />
                                    <text x={svgWaveData.cx - 15} y={svgWaveData.cy + 22} fill="#818cf8" fontSize="10" fontWeight="bold">
                                        Source (L₁)
                                    </text>

                                    {/* Reference Wavefront r1 */}
                                    <circle
                                        cx={svgWaveData.cx}
                                        cy={svgWaveData.cy}
                                        r={svgWaveData.r1Scaled}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2.5"
                                        strokeDasharray="4 2"
                                    />
                                    <text
                                        x={svgWaveData.cx + svgWaveData.r1Scaled - 10}
                                        y={svgWaveData.cy - 12}
                                        fill="#38bdf8"
                                        fontSize="10"
                                        fontWeight="bold"
                                    >
                                        r₁: {formatNum(computation.sourceSPL)} dB
                                    </text>

                                    {/* Target Wavefront r2 */}
                                    <circle
                                        cx={svgWaveData.cx}
                                        cy={svgWaveData.cy}
                                        r={svgWaveData.r2Scaled}
                                        fill="rgba(99, 102, 241, 0.12)"
                                        stroke="#818cf8"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={svgWaveData.cx + svgWaveData.r2Scaled - 12}
                                        y={svgWaveData.cy - 12}
                                        fill="#a5b4fc"
                                        fontSize="10"
                                        fontWeight="bold"
                                    >
                                        r₂: {formatNum(computation.targetSPL)} dB
                                    </text>

                                    {/* Ray Dispersion Cones */}
                                    <line
                                        x1={svgWaveData.cx}
                                        y1={svgWaveData.cy}
                                        x2={svgWaveData.cx + 260}
                                        y2={svgWaveData.cy - 70}
                                        stroke="#475569"
                                        strokeWidth="1"
                                        strokeDasharray="2 2"
                                    />
                                    <line
                                        x1={svgWaveData.cx}
                                        y1={svgWaveData.cy}
                                        x2={svgWaveData.cx + 260}
                                        y2={svgWaveData.cy + 70}
                                        stroke="#475569"
                                        strokeWidth="1"
                                        strokeDasharray="2 2"
                                    />
                                    <line
                                        x1={svgWaveData.cx}
                                        y1={svgWaveData.cy}
                                        x2={svgWaveData.cx + 270}
                                        y2={svgWaveData.cy}
                                        stroke="#64748b"
                                        strokeWidth="1.5"
                                    />

                                    {/* Listener Position Marker */}
                                    <circle
                                        cx={svgWaveData.cx + svgWaveData.r2Scaled}
                                        cy={svgWaveData.cy}
                                        r="4"
                                        fill="#f43f5e"
                                    />
                                    <text
                                        x={svgWaveData.cx + svgWaveData.r2Scaled - 15}
                                        y={svgWaveData.cy + 18}
                                        fill="#fda4af"
                                        fontSize="9"
                                        fontWeight="bold"
                                    >
                                        Target (r₂)
                                    </text>
                                </svg>
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8 space-y-2">
                                    <VolumeX className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                                    <p>Enter valid acoustic parameters to simulate sound wave attenuation</p>
                                </div>
                            )}
                        </div>

                        {/* Primary Highlight Metrics */}
                        {computation.valid ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Target Level (L₂ at r₂)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(computation.targetSPL)} <span className="text-base font-bold text-slate-600">dB SPL</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            Sound Level at {r2Input} {distanceUnit}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Total Drop (Attenuation)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            -{formatNum(computation.attenuationDB)} <span className="text-base font-bold text-slate-600">dB</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            Distance factor: {formatNum(computation.distanceRatio)}x
                                        </p>
                                    </div>
                                </div>

                                {/* Safety Badge */}
                                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${computation.safetyCategory.color}`}>
                                    <div>
                                        <span className="font-extrabold block text-sm">{computation.safetyCategory.label}</span>
                                        <span className="text-[11px] opacity-90">{computation.safetyCategory.desc}</span>
                                    </div>
                                    <div className="text-right flex-shrink-0 pl-2">
                                        <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">Max Safe Exposure</span>
                                        <span className="font-black text-xs">{computation.safetyCategory.maxExposure}</span>
                                    </div>
                                </div>

                                {/* Acoustic Physical Quantities Matrix */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 block">Pressure P₁</span>
                                        <span className="font-extrabold text-slate-800 font-mono text-[11px]">
                                            {computation.soundPressure1.toExponential(2)} Pa
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 block">Pressure P₂</span>
                                        <span className="font-extrabold text-indigo-700 font-mono text-[11px]">
                                            {computation.soundPressure2.toExponential(2)} Pa
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 block">Intensity I₁</span>
                                        <span className="font-extrabold text-slate-800 font-mono text-[11px]">
                                            {computation.soundIntensity1.toExponential(2)} W/m²
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-500 block">Intensity I₂</span>
                                        <span className="font-extrabold text-indigo-700 font-mono text-[11px]">
                                            {computation.soundIntensity2.toExponential(2)} W/m²
                                        </span>
                                    </div>
                                </div>

                                {/* Sound Power Level Estimation Card */}
                                {computation.soundPowerLevel && (
                                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 text-xs">
                                        <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                            <span>Sound Power Level (Lw / SWL)</span>
                                            <span className="text-[10px] text-slate-400 font-mono">Source Energy</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-slate-300 text-xs">
                                                Estimated acoustic source power (independent of distance):
                                            </span>
                                            <span className="font-mono font-black text-sm text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                                                {formatNum(computation.soundPowerLevel)} dB SWL
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid sound levels and distance parameters to view full acoustic attenuation report.
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
                            {copied ? "Decibel Attenuation Report Copied!" : "Copy Full Acoustic Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Acoustic Formula Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Decibel Attenuation & Acoustic Propagation Formulas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Sound wave propagation through air is governed by geometric wave expansion, sound energy conservation, and medium absorption. In free space, sound radiating from a point source expands outward in a sphere whose surface area grows proportionally to $4\pi r^2$. This causes acoustic intensity and pressure to decay strictly according to the classical inverse square law:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Acoustic Condition</th>
                                    <th className="p-3">Decibel Attenuation Equation</th>
                                    <th className="p-3">Rate of Drop per Distance Doubling</th>
                                    <th className="p-3">Primary Engineering Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Point Source (Free-Field Spherical)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"L_2 = L_1 - 20 \\log_{10}(r_2 / r_1)"}</td>
                                    <td className="p-3 font-bold text-emerald-700 text-xs">-6.02 dB per doubling</td>
                                    <td className="p-3 text-xs">Loudspeakers, sirens, generators, airborne drones</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Point Source (Hemispherical / Ground)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"L_2 = L_1 - 20 \\log_{10}(r_2 / r_1) + Q"}</td>
                                    <td className="p-3 font-bold text-emerald-700 text-xs">-6.02 dB (Directivity Q=2)</td>
                                    <td className="p-3 text-xs">Outdoor concert stages, heavy construction machinery</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Line Source (Cylindrical Wavefront)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"L_2 = L_1 - 10 \\log_{10}(r_2 / r_1)"}</td>
                                    <td className="p-3 font-bold text-blue-700 text-xs">-3.01 dB per doubling</td>
                                    <td className="p-3 text-xs">Multi-lane highways, rail transit corridors, line arrays</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Atmospheric Air Absorption (ISO 9613-1)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"\\Delta L_{atm} = \\alpha \\cdot (r_2 - r_1)"}</td>
                                    <td className="p-3 text-xs">Frequency & humidity dependent</td>
                                    <td className="p-3 text-xs">Long-range environmental acoustic noise impact studies</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Sound Pressure Level to Pascals</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"p = p_0 \\cdot 10^{(L_p / 20)} \\quad (p_0 = 20\\,\\mu\\text{Pa})"}</td>
                                    <td className="p-3 text-xs">Linear acoustic pressure</td>
                                    <td className="p-3 text-xs">Microphone sensitivity, acoustic structural loads</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Sound Intensity Level to W/m²</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"I = I_0 \\cdot 10^{(L_I / 10)} \\quad (I_0 = 10^{-12}\\,\\text{W/m}^2)"}</td>
                                    <td className="p-3 text-xs">Acoustic power vector</td>
                                    <td className="p-3 text-xs">Architectural room acoustics, acoustic enclosure design</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Sound Power Level (SWL / Lw)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"L_w = L_p + 20 \\log_{10}(r) + 11\\,\\text{dB}"}</td>
                                    <td className="p-3 text-xs">Distance-independent</td>
                                    <td className="p-3 text-xs">HVAC equipment rating, industrial machinery specs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Common Sound Levels & Decibel Benchmark Scale */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Sound Level Scale & Exposure Benchmarks
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The human ear perceives sound intensity logarithmically. An increase of 10 dB represents a tenfold increase in acoustic energy and is perceived by human hearing as roughly twice as loud. The benchmark reference table below demonstrates common acoustic environments:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">0 – 30 dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Very Faint</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Threshold of human hearing (0 dB), rustling leaves (10 dB), recording studio background, quiet bedroom or whisper at 1 meter (30 dB).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">40 – 60 dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Moderate</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Quiet residential library (40 dB), calm urban living room (50 dB), standard conversational speech at 1 meter distance (60 dB).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">70 – 85 dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Action Level</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Vacuum cleaner (70 dB), busy downtown intersection (75-80 dB), food blender (85 dB). OSHA hearing conservation programs start at 85 dBA.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">90 – 105 dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-orange-100 text-orange-800 rounded">Hazardous</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Lawn mower or diesel truck at 1m (90 dB), handheld angle grinder (95 dB), subway train passing platform (100 dB), gas chainsaw (105 dB).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">110 – 125 dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">Severe Danger</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Live rock concert or stadium PA front row (110-115 dB), pneumatic jackhammer (120 dB), emergency vehicle siren at 1m (120-125 dB).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-sm">130 – 160+ dB SPL</span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">Acoustic Trauma</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Human threshold of pain (130-140 dB), jet engine takeoff at 50m (140 dB), shotgun muzzle blast or airbag deployment (150-165 dB).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Calculus Derivations & Acoustic Inverse Square Law */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Derivation of the Inverse Square Law in Acoustics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Why does a doubling of distance reduce sound pressure level by exactly 6.02 dB for spherical radiation and 3.01 dB for line sources? The physics follows directly from energy flux conservation:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-indigo-600" /> 1. Point Source Spherical Energy Conservation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Consider an acoustic source emitting total acoustic power $W$ (Watts) uniformly in all directions. At distance $r$, this power is distributed over a sphere of surface area $A = 4\pi r^2$. Acoustic intensity $I$ is power per unit area:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"I_1 = \\frac{W}{4\\pi r_1^2} \\quad \\text{and} \\quad I_2 = \\frac{W}{4\\pi r_2^2}"}</p>
                                <p>{"\\frac{I_2}{I_1} = \\left( \\frac{r_1}{r_2} \\right)^2"}</p>
                                <p className="font-bold text-slate-900">{"L_2 - L_1 = 10 \\log_{10}\\left(\\frac{I_2}{I_1}\\right) = 10 \\log_{10}\\left[\\left(\\frac{r_1}{r_2}\\right)^2\\right] = -20 \\log_{10}\\left(\\frac{r_2}{r_1}\\right)"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                When $r_2 = 2r_1$, {"$\\Delta L = -20 \\log_{10}(2) = -20(0.30103) = -6.0206\\,\\text{dB}$"}.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> 2. Line Source Cylindrical Energy Conservation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For a continuous line source of length $L$ emitting sound power per unit length $W&apos;$, the wave radiates cylindrically over an expanding cylinder area $A = 2\pi r L$:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"I(r) = \\frac{W' \\cdot L}{2\\pi r L} = \\frac{W'}{2\\pi r}"}</p>
                                <p>{"\\frac{I_2}{I_1} = \\frac{r_1}{r_2}"}</p>
                                <p className="font-bold text-slate-900">{"L_2 - L_1 = 10 \\log_{10}\\left(\\frac{I_2}{I_1}\\right) = -10 \\log_{10}\\left(\\frac{r_2}{r_1}\\right)"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                When $r_2 = 2r_1$, {"$\\Delta L = -10 \\log_{10}(2) = -10(0.30103) = -3.0103\\,\\text{dB}$"}.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Root-Mean-Square (RMS) Sound Pressure Derivation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            In acoustic fluid dynamics, acoustic intensity is related to RMS sound pressure $p$ and air characteristic acoustic impedance {"$Z_0 = \\rho \\cdot c \\approx 415\\,\\text{Pa}\\cdot\\text{s / m}$"} (at {"$20^\\circ\\text{C}$"}):
                        </p>
                        <div className="font-mono text-xs text-indigo-200 bg-slate-950 p-3 rounded-lg space-y-1.5 border border-slate-800">
                            <p>{"I = \\frac{p^2}{\\rho c} = \\frac{p^2}{Z_0}"}</p>
                            <p>{"L_p = 10 \\log_{10}\\left(\\frac{I}{I_0}\\right) = 10 \\log_{10}\\left(\\frac{p^2 / Z_0}{p_0^2 / Z_0}\\right) = 10 \\log_{10}\\left(\\frac{p}{p_0}\\right)^2 = 20 \\log_{10}\\left(\\frac{p}{p_0}\\right)"}</p>
                            <p className="text-white font-bold text-sm">{"p = p_0 \\times 10^{\\frac{L_p}{20}} \\quad \\text{where } p_0 = 20\\,\\mu\\text{Pa} = 2 \\times 10^{-5}\\,\\text{Pa}"}</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Distance vs Decibel Attenuation Quick Lookup Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Grid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Decibel Distance Attenuation Matrix (Initial Level = 100 dB SPL at 1 m)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this standardized engineering lookup chart to analyze how a 100 dB source drops over increasing distance across point sources and line sources in air:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Distance ($r_2$)</th>
                                    <th className="p-3">Distance Ratio ($r_2 / r_1$)</th>
                                    <th className="p-3">Point Source Level (dB SPL)</th>
                                    <th className="p-3">Line Source Level (dB SPL)</th>
                                    <th className="p-3">RMS Sound Pressure ($p_2$)</th>
                                    <th className="p-3">Sound Intensity ($I_2$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1 meter (Ref)</td>
                                    <td className="p-3">1.0x</td>
                                    <td className="p-3 font-bold text-indigo-600">100.0 dB</td>
                                    <td className="p-3 font-bold text-indigo-600">100.0 dB</td>
                                    <td className="p-3">2.000 Pa</td>
                                    <td className="p-3">1.000 × 10⁻² W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">2 meters</td>
                                    <td className="p-3">2.0x (1st doubling)</td>
                                    <td className="p-3 text-slate-900">93.98 dB (-6.0 dB)</td>
                                    <td className="p-3 text-slate-900">96.99 dB (-3.0 dB)</td>
                                    <td className="p-3">1.000 Pa</td>
                                    <td className="p-3">2.500 × 10⁻³ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">4 meters</td>
                                    <td className="p-3">4.0x (2nd doubling)</td>
                                    <td className="p-3 text-slate-900">87.96 dB (-12.0 dB)</td>
                                    <td className="p-3 text-slate-900">93.98 dB (-6.0 dB)</td>
                                    <td className="p-3">0.500 Pa</td>
                                    <td className="p-3">6.250 × 10⁻⁴ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">8 meters</td>
                                    <td className="p-3">8.0x (3rd doubling)</td>
                                    <td className="p-3 text-slate-900">81.94 dB (-18.1 dB)</td>
                                    <td className="p-3 text-slate-900">90.97 dB (-9.0 dB)</td>
                                    <td className="p-3">0.250 Pa</td>
                                    <td className="p-3">1.563 × 10⁻⁴ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">10 meters</td>
                                    <td className="p-3">10.0x (1 decade)</td>
                                    <td className="p-3 font-bold text-amber-700">80.00 dB (-20.0 dB)</td>
                                    <td className="p-3 font-bold text-amber-700">90.00 dB (-10.0 dB)</td>
                                    <td className="p-3">0.200 Pa</td>
                                    <td className="p-3">1.000 × 10⁻⁴ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">20 meters</td>
                                    <td className="p-3">20.0x</td>
                                    <td className="p-3 text-slate-900">73.98 dB (-26.0 dB)</td>
                                    <td className="p-3 text-slate-900">86.99 dB (-13.0 dB)</td>
                                    <td className="p-3">0.100 Pa</td>
                                    <td className="p-3">2.500 × 10⁻⁵ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">50 meters</td>
                                    <td className="p-3">50.0x</td>
                                    <td className="p-3 text-slate-900">66.02 dB (-34.0 dB)</td>
                                    <td className="p-3 text-slate-900">83.01 dB (-17.0 dB)</td>
                                    <td className="p-3">0.040 Pa</td>
                                    <td className="p-3">4.000 × 10⁻⁶ W/m²</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">100 meters</td>
                                    <td className="p-3">100.0x (2 decades)</td>
                                    <td className="p-3 font-bold text-emerald-700">60.00 dB (-40.0 dB)</td>
                                    <td className="p-3 font-bold text-emerald-700">80.00 dB (-20.0 dB)</td>
                                    <td className="p-3">0.020 Pa</td>
                                    <td className="p-3">1.000 × 10⁻⁶ W/m²</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: OSHA vs NIOSH Noise Exposure Criteria */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Occupational Noise Exposure Limits: OSHA vs NIOSH Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Workplace safety agencies specify maximum permissible daily noise exposure durations before irreversible sensorineural hearing loss occurs. OSHA utilizes a 5 dB exchange rate, whereas NIOSH utilizes a strict 3 dB equal-energy exchange rate:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                                <span>OSHA Permissible Exposure Limits (PEL)</span>
                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">5 dB Exchange</span>
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>90 dBA:</span> <strong className="text-slate-900 font-sans">8 Hours (Max Permissible)</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>95 dBA:</span> <strong className="text-slate-900 font-sans">4 Hours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>100 dBA:</span> <strong className="text-slate-900 font-sans">2 Hours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>105 dBA:</span> <strong className="text-slate-900 font-sans">1 Hour</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>110 dBA:</span> <strong className="text-slate-900 font-sans">30 Minutes</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span>115 dBA:</span> <strong className="text-rose-700 font-sans">15 Minutes (Ceiling)</strong>
                                </li>
                            </ul>
                            <p className="text-[11px] text-slate-500 pt-1">
                                OSHA Action Level starts at 85 dBA 8-hr TWA (requires baseline audiograms and hearing protection availability).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                                <span>NIOSH Recommended Exposure Limits (REL)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">3 dB Exchange</span>
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>85 dBA:</span> <strong className="text-slate-900 font-sans">8 Hours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>88 dBA:</span> <strong className="text-slate-900 font-sans">4 Hours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>91 dBA:</span> <strong className="text-slate-900 font-sans">2 Hours</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>94 dBA:</span> <strong className="text-slate-900 font-sans">1 Hour</strong>
                                </li>
                                <li className="flex justify-between border-b border-slate-200 pb-1">
                                    <span>100 dBA:</span> <strong className="text-slate-900 font-sans">15 Minutes</strong>
                                </li>
                                <li className="flex justify-between">
                                    <span>106 dBA:</span> <strong className="text-rose-700 font-sans">&lt; 4 Minutes</strong>
                                </li>
                            </ul>
                            <p className="text-[11px] text-slate-500 pt-1">
                                NIOSH criteria reflect true acoustic energy doubling, offering superior preventive protection against permanent hearing loss.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Step-by-Step Worked Mathematical Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Acoustic Engineering Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Explore two comprehensive worked examples demonstrating forward distance attenuation and reverse boundary setback distance planning:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case 1: Concert Loudspeaker Attenuation</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Outdoor Stage</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Problem:</strong> PA emits 112 dB SPL at 1 m. Calculate level at mix desk (32 m).</li>
                                <li><strong>2. Compute Distance Ratio:</strong></li>
                                <li className="text-indigo-700 pl-3">{"r_2 / r_1 = 32 / 1 = 32.0"}</li>
                                <li><strong>3. Calculate Geometric Attenuation (Spherical):</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\Delta L_{geo} = 20 \\log_{10}(32) = 20 \\times 1.50515 = 30.103\\,\\text{dB}"}</li>
                                <li><strong>4. Calculate Atmospheric Loss (α = 0.005 dB/m):</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\Delta L_{atm} = 0.005 \\times (32 - 1) = 0.155\\,\\text{dB}"}</li>
                                <li><strong>5. Determine Final SPL at 32 Meters:</strong></li>
                                <li className="text-indigo-700 pl-3 font-bold text-slate-900">
                                    {"L_2 = 112 - (30.103 + 0.155) = 81.74\\,\\text{dB SPL}"}
                                </li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Result: Mix engineer experiences a safe ~82 dB SPL, compliant with 8-hour exposure limits.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case 2: Industrial Generator Setback Distance</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Property Boundary</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Problem:</strong> Generator produces 98 dB at 2 m. Property fence limit is 55 dB.</li>
                                <li><strong>2. Required Total Drop (ΔL):</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\Delta L = 98 - 55 = 43\\,\\text{dB}"}</li>
                                <li><strong>3. Solve for Target Distance (r₂):</strong></li>
                                <li className="text-indigo-700 pl-3">{"43 = 20 \\log_{10}(r_2 / 2) \\implies \\log_{10}(r_2 / 2) = 2.15"}</li>
                                <li className="text-indigo-700 pl-3">{"r_2 / 2 = 10^{2.15} = 141.25"}</li>
                                <li className="text-indigo-700 pl-3 font-bold text-slate-900">
                                    {"r_2 = 2 \\times 141.25 = 282.51\\,\\text{meters}"}
                                </li>
                                <li><strong>4. Acoustic Verification:</strong></li>
                                <li className="text-indigo-700 pl-3">{"L(282.51\\text{m}) = 98 - 20\\log_{10}(282.51/2) = 55.0\\,\\text{dB}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Conclusion: Minimum clear setback required is 283 meters without acoustic barrier walls.
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
                                How does sound level (dB) decrease with distance according to the Inverse Square Law?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For a point sound source radiating uniformly in an ideal free field (spherical expansion), sound energy spreads over an expanding sphere of area $4\pi r^2$. Because sound intensity drops by a factor of 4 whenever the distance doubles ($r_2 = 2r_1$), the sound pressure level drops by exactly {"$20 \\log_{10}(2) \\approx 6.02\\,\\text{dB SPL}$"}.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between point source and line source attenuation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A <strong>point source</strong> (such as a single speaker, standalone generator, or aircraft engine) expands spherically, attenuating at <strong>6 dB per distance doubling</strong> ({"$20\\log_{10}(r_2/r_1)$"}). A <strong>line source</strong> (such as a continuous highway of moving traffic, a train, or a professional line-array sound system) creates a cylindrical wavefront, dissipating energy at only <strong>3 dB per distance doubling</strong> ({"$10\\log_{10}(r_2/r_1)$"}).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the mathematical relationship between Sound Pressure (Pa) and Sound Pressure Level (dB)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Sound Pressure Level is defined as $L_p = 20 \\log_{10}\\left(\\frac{p}{p_0}\\right)$, where $p$ is the root-mean-square (RMS) acoustic pressure in Pascals, and $p_0 = 20\\,\\mu\\text{Pa} = 2 \\times 10^{-5}\\,\\text{Pa}$ is the standardized international threshold of human hearing at 1 kHz. An increase of 20 dB corresponds to an exact 10-fold increase in physical air pressure."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Sound Pressure Level (Lp) and Sound Power Level (Lw / SWL)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                <strong>Sound Power Level ($L_w$)</strong> represents the total acoustic energy emitted by a source per unit time (in Watts, referenced to {"$10^{-12}\\,\\text{W}$"}); it is an invariant property of the equipment that does not change with distance. <strong>Sound Pressure Level ($L_p$)</strong> is the sound intensity actually received at a specific listening coordinate, which continuously decreases as the observer moves further away.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do high frequencies attenuate faster than low frequencies over distance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In addition to geometric spreading, air molecules undergo vibrational relaxation and thermal viscosity losses when sound waves pass through them (ISO 9613-1). High frequencies (4 kHz to 10 kHz) oscillate air molecules thousands of times per second, producing rapid thermal friction losses of up to 0.03–0.1 dB per meter. Low bass frequencies (63 Hz to 125 Hz) experience minimal molecular friction (&lt;0.001 dB/m), allowing bass rumbles and thunder to travel miles.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the OSHA and NIOSH maximum permissible noise exposure limits?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                OSHA establishes a legal Permissible Exposure Limit of 90 dBA for 8 hours with a 5 dB exchange rate (e.g., 95 dBA for 4 hours, 100 dBA for 2 hours). NIOSH recommends a more conservative safety standard of 85 dBA for 8 hours with a true 3 dB energy-doubling exchange rate (88 dBA for 4 hours, 91 dBA for 2 hours, and 100 dBA for only 15 minutes).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does decibel addition work linearly when combining multiple sound sources?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"No. Decibels are logarithmic, so you cannot add values directly (e.g., $80\\,\\text{dB} + 80\\,\\text{dB} \\neq 160\\,\\text{dB}$). Combining two identical, uncorrelated sound sources of $80\\,\\text{dB}$ results in an acoustic power doubling: $L_{\\text{total}} = 10 \\log_{10}(10^{8.0} + 10^{8.0}) = 80 + 10 \\log_{10}(2) = 83.01\\,\\text{dB}$."}
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}