"use client";

import React, { useState, useMemo } from "react";
import {
    Circle,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Compass,
    Layers,
    ShieldAlert,
    Activity,
    Sliders,
    Maximize2,
    CircleDot,
    GraduationCap,
    Grid,
    Scale,
    FileText,
    TrendingUp,
    PieChart,
    Target,
    Zap,
    Cpu,
    CheckCircle2
} from "lucide-react";

type CalculationMode = "RADIUS" | "DIAMETER" | "CIRCUMFERENCE" | "AREA" | "ARC_SECTOR";
type AngleUnit = "deg" | "rad";

interface CircleMetrics {
    radius: number;
    diameter: number;
    circumference: number;
    area: number;
    centralAngleDeg: number;
    centralAngleRad: number;
    arcLength: number;
    sectorArea: number;
    chordLength: number;
    segmentArea: number;
    sagitta: number;
    apothem: number;
}

interface SolveResult {
    valid: boolean;
    error?: string;
    metrics?: CircleMetrics;
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

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export default function CircleGeometryCalculator() {
    const [calcMode, setCalcMode] = useState<CalculationMode>("RADIUS");
    const [angleUnit, setAngleUnit] = useState<AngleUnit>("deg");
    const [precision, setPrecision] = useState<number>(4);

    // Primary Dimension Inputs
    const [radiusInput, setRadiusInput] = useState<number>(10);
    const [diameterInput, setDiameterInput] = useState<number>(20);
    const [circumferenceInput, setCircumferenceInput] = useState<number>(62.8319);
    const [areaInput, setAreaInput] = useState<number>(314.1593);

    // Sub-arc & Sector Specific Inputs
    const [angleInput, setAngleInput] = useState<number>(60);
    const [arcLengthInput, setArcLengthInput] = useState<number>(10.472);

    const [copied, setCopied] = useState<boolean>(false);

    // Math Computation Solver
    const computation: SolveResult = useMemo(() => {
        let r = 0;
        let thetaDeg = angleUnit === "deg" ? angleInput : toDeg(angleInput);

        try {
            if (calcMode === "RADIUS") {
                if (radiusInput <= 0) return { valid: false, error: "Radius must be a positive number greater than 0." };
                r = radiusInput;
            } else if (calcMode === "DIAMETER") {
                if (diameterInput <= 0) return { valid: false, error: "Diameter must be a positive number greater than 0." };
                r = diameterInput / 2;
            } else if (calcMode === "CIRCUMFERENCE") {
                if (circumferenceInput <= 0) return { valid: false, error: "Circumference must be a positive number greater than 0." };
                r = circumferenceInput / (2 * Math.PI);
            } else if (calcMode === "AREA") {
                if (areaInput <= 0) return { valid: false, error: "Circle Area must be a positive number greater than 0." };
                r = Math.sqrt(areaInput / Math.PI);
            } else if (calcMode === "ARC_SECTOR") {
                if (radiusInput <= 0) return { valid: false, error: "Radius must be a positive number greater than 0." };
                if (arcLengthInput > 0 && angleInput <= 0) {
                    r = radiusInput;
                    const thetaRad = arcLengthInput / r;
                    thetaDeg = toDeg(thetaRad);
                } else {
                    r = radiusInput;
                }
            }

            if (r <= 0 || !isFinite(r)) {
                return { valid: false, error: "Invalid radial dimensions. Enter positive real numbers." };
            }

            // Central Angle Normalization (0° to 360°)
            if (thetaDeg <= 0) thetaDeg = 60;
            if (thetaDeg > 360) thetaDeg = 360;

            const thetaRad = toRad(thetaDeg);
            const diameter = 2 * r;
            const circumference = 2 * Math.PI * r;
            const area = Math.PI * r * r;

            // Arc & Sector Geometry
            const arcLength = r * thetaRad;
            const sectorArea = 0.5 * r * r * thetaRad;
            const chordLength = 2 * r * Math.sin(thetaRad / 2);
            const segmentArea = 0.5 * r * r * (thetaRad - Math.sin(thetaRad));
            const sagitta = r * (1 - Math.cos(thetaRad / 2));
            const apothem = r * Math.cos(thetaRad / 2);

            return {
                valid: true,
                metrics: {
                    radius: r,
                    diameter,
                    circumference,
                    area,
                    centralAngleDeg: thetaDeg,
                    centralAngleRad: thetaRad,
                    arcLength,
                    sectorArea,
                    chordLength,
                    segmentArea,
                    sagitta,
                    apothem
                }
            };
        } catch {
            return { valid: false, error: "Mathematical domain or overflow error during calculation." };
        }
    }, [calcMode, angleUnit, radiusInput, diameterInput, circumferenceInput, areaInput, angleInput, arcLengthInput]);

    const m = computation.metrics;

    const handleReset = () => {
        setCalcMode("RADIUS");
        setAngleUnit("deg");
        setPrecision(4);
        setRadiusInput(10);
        setDiameterInput(20);
        setCircumferenceInput(62.8319);
        setAreaInput(314.1593);
        setAngleInput(60);
        setArcLengthInput(10.472);
    };

    const handleCopyResults = () => {
        if (!m) return;
        const format = (n: number) => n.toFixed(precision);
        const text = `Circle Geometry & Sector Report (twistertools.com)
----------------------------------------
Primary Circle Dimensions:
  Radius (r) = ${format(m.radius)}
  Diameter (d) = ${format(m.diameter)}
  Circumference (C) = ${format(m.circumference)}
  Enclosed Area (A) = ${format(m.area)}
Arc & Sector Metrics:
  Central Angle (θ) = ${format(angleUnit === "deg" ? m.centralAngleDeg : m.centralAngleRad)}°${angleUnit}
  Arc Length (s) = ${format(m.arcLength)}
  Sector Area = ${format(m.sectorArea)}
  Chord Length (c) = ${format(m.chordLength)}
  Circular Segment Area = ${format(m.segmentArea)}
  Sagitta (Height) = ${format(m.sagitta)}
  Apothem (Distance to Chord) = ${format(m.apothem)}
----------------------------------------
Generated via TwisterTools Circle Geometry Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toString();
    };

    // Vector SVG Visualizer Coordinates
    const svgVisualData = useMemo(() => {
        if (!m) return null;
        const cx = 150;
        const cy = 150;
        const displayRadius = 100;
        const angleRad = m.centralAngleRad;

        // Sector arc start and end coordinates
        const startX = cx + displayRadius;
        const startY = cy;
        const endX = cx + displayRadius * Math.cos(-angleRad);
        const endY = cy + displayRadius * Math.sin(-angleRad);

        const largeArcFlag = angleRad > Math.PI ? 1 : 0;
        const sectorPath = `M ${cx} ${cy} L ${startX} ${startY} A ${displayRadius} ${displayRadius} 0 ${largeArcFlag} 0 ${endX} ${endY} Z`;
        const chordPath = `M ${startX} ${startY} L ${endX} ${endY}`;

        return { cx, cy, displayRadius, startX, startY, endX, endY, sectorPath, chordPath };
    }, [m]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Circle Circumference, Arc Length & Sector Area Calculator",
        "url": "https://twistertools.com/tools/math-tools/circle-geometry-calculator",
        "description": "Comprehensive circle geometry solver computing circumference, area, arc length, sector area, chord length, sagitta, and segment area with dynamic real-time SVG vector rendering.",
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
                "name": "What is the mathematical relationship between radius, diameter, and circumference?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The diameter is exactly twice the radius (d = 2r). The circumference is the distance around the outer boundary, given by C = 2πr = πd. This establishes that pi (π) is the constant ratio of any circle's circumference to its diameter."
                }
            },
            {
                "@type": "Question",
                "name": "How is arc length calculated for degrees versus radians?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When central angle θ is in radians, the formula is s = r · θ. When θ is expressed in degrees, the formula scales by the circular fraction: s = 2πr · (θ / 360°) = (πrθ) / 180°."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a circular sector and a circular segment?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A circular sector is a pie-slice region bounded by two radii and an arc. A circular segment is the smaller region enclosed strictly between a straight chord line and the circular arc connecting its endpoints."
                }
            },
            {
                "@type": "Question",
                "name": "How is the area of a circular segment computed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The area of a segment is obtained by subtracting the area of the isosceles triangle formed by the two radii and chord from the total sector area: Segment Area = Sector Area - Triangle Area = 0.5 · r² · (θ - sin(θ)), with θ in radians."
                }
            },
            {
                "@type": "Question",
                "name": "What are the sagitta and apothem of a circle?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The apothem is the perpendicular distance from the circle center to a chord line (r·cos(θ/2)). The sagitta is the perpendicular distance from the midpoint of the chord to the arc peak, calculated as r - apothem = r(1 - cos(θ/2))."
                }
            },
            {
                "@type": "Question",
                "name": "Why is pi (π) fundamental in circle geometry calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pi (approximately 3.14159265359) is the invariant mathematical constant defining the ratio of a Euclidean circle's circumference to its diameter. It connects linear radial metrics directly to 2D curvature and surface area."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the radius of a circle if only the chord length and sagitta are known?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "By the Intersecting Chords Theorem, the radius r can be reconstructed from chord c and sagitta s using the formula: r = (s / 2) + (c² / (8s))."
                }
            },
            {
                "@type": "Question",
                "name": "How does circle geometry calculate partial volume in horizontal cylindrical tanks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The volume of liquid in a partially filled horizontal cylinder equals the circular segment area multiplied by the cylinder length: V = A_segment · L. The liquid depth corresponds directly to the sagitta."
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

                {/* Left Workspace Panel: Mode & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Circle Parameters & Solver Mode
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Calculation Input Modes */}
                        <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Primary Known Dimension
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-500">Angle Unit:</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setAngleUnit("deg")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${angleUnit === "deg" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Degrees (°)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAngleUnit("rad")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${angleUnit === "rad" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Radians (rad)
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mode Button Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {[
                                    { id: "RADIUS", label: "Radius", desc: "r Input" },
                                    { id: "DIAMETER", label: "Diameter", desc: "d = 2r" },
                                    { id: "CIRCUMFERENCE", label: "Circumference", desc: "C = 2πr" },
                                    { id: "AREA", label: "Area", desc: "A = πr²" },
                                    { id: "ARC_SECTOR", label: "Arc & Sector", desc: "r + θ / s" }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setCalcMode(mode.id as CalculationMode)}
                                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${calcMode === mode.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="font-extrabold text-xs">{mode.label}</span>
                                        <span className={`text-[10px] truncate max-w-full ${calcMode === mode.id ? "text-indigo-100" : "text-slate-400"}`}>
                                            {mode.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Dimension Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            {calcMode === "RADIUS" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Circle Radius (r)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={radiusInput === 0 ? "" : radiusInput}
                                        onChange={(e) => handleNumberInput(e, setRadiusInput)}
                                        className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. 10"
                                    />
                                </div>
                            )}

                            {calcMode === "DIAMETER" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Circle Diameter (d)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={diameterInput === 0 ? "" : diameterInput}
                                        onChange={(e) => handleNumberInput(e, setDiameterInput)}
                                        className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. 20"
                                    />
                                </div>
                            )}

                            {calcMode === "CIRCUMFERENCE" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Circumference (C = 2πr)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={circumferenceInput === 0 ? "" : circumferenceInput}
                                        onChange={(e) => handleNumberInput(e, setCircumferenceInput)}
                                        className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. 62.8319"
                                    />
                                </div>
                            )}

                            {calcMode === "AREA" && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Enclosed Circle Area (A = πr²)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={areaInput === 0 ? "" : areaInput}
                                        onChange={(e) => handleNumberInput(e, setAreaInput)}
                                        className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="e.g. 314.1593"
                                    />
                                </div>
                            )}

                            {calcMode === "ARC_SECTOR" && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Radius (r)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={radiusInput === 0 ? "" : radiusInput}
                                                onChange={(e) => handleNumberInput(e, setRadiusInput)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Arc Length (s)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={arcLengthInput === 0 ? "" : arcLengthInput}
                                                onChange={(e) => handleNumberInput(e, setArcLengthInput)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sub-angle Modifier for Sector Calculations */}
                            <div className="pt-2 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700">Central Angle (θ)</label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {angleInput} {angleUnit === "deg" ? "°" : "rad"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max={angleUnit === "deg" ? "360" : "6.28318"}
                                        step={angleUnit === "deg" ? "1" : "0.01"}
                                        value={angleInput}
                                        onChange={(e) => setAngleInput(parseFloat(e.target.value) || 1)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0.1"
                                        max={angleUnit === "deg" ? "360" : "6.28318"}
                                        step="any"
                                        value={angleInput === 0 ? "" : angleInput}
                                        onChange={(e) => handleNumberInput(e, setAngleInput)}
                                        className="w-24 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[2, 4, 6, 8].map((dec) => (
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
                                    <p className="font-bold uppercase tracking-wider">Geometric Warning</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Valid Circular Geometry Solved
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    Exact Euclidean 2D
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Constant: π ≈ 3.14159265
                        </span>
                        <span>Full Radii & Trigonometric Engine</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Analytics & Real-Time SVG Renderer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Calculated Metrics & Dynamic Vector SVG
                            </h2>
                            {computation.valid && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                    θ = {formatNum(m?.centralAngleDeg)}°
                                </span>
                            )}
                        </div>

                        {/* Real-time Dynamic Circle & Sector SVG Visualizer */}
                        <div className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden min-h-[220px]">
                            <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> Dynamic 2D Vector Projection
                            </div>

                            {computation.valid && svgVisualData ? (
                                <svg viewBox="0 0 300 300" className="w-full h-44 overflow-visible">
                                    {/* Outer Circle Perimeter */}
                                    <circle
                                        cx={svgVisualData.cx}
                                        cy={svgVisualData.cy}
                                        r={svgVisualData.displayRadius}
                                        fill="none"
                                        stroke="#334155"
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                    />

                                    {/* Shaded Sector Slice */}
                                    <path
                                        d={svgVisualData.sectorPath}
                                        fill="rgba(99, 102, 241, 0.25)"
                                        stroke="#6366f1"
                                        strokeWidth="2.5"
                                    />

                                    {/* Straight Chord Line */}
                                    <line
                                        x1={svgVisualData.startX}
                                        y1={svgVisualData.startY}
                                        x2={svgVisualData.endX}
                                        y2={svgVisualData.endY}
                                        stroke="#f43f5e"
                                        strokeWidth="2"
                                        strokeDasharray="2 2"
                                    />

                                    {/* Center Point */}
                                    <circle cx={svgVisualData.cx} cy={svgVisualData.cy} r="4" fill="#818cf8" />

                                    {/* Radius Line */}
                                    <line
                                        x1={svgVisualData.cx}
                                        y1={svgVisualData.cy}
                                        x2={svgVisualData.startX}
                                        y2={svgVisualData.startY}
                                        stroke="#cbd5e1"
                                        strokeWidth="1.5"
                                    />

                                    {/* Center Label */}
                                    <text x={svgVisualData.cx - 10} y={svgVisualData.cy + 15} fill="#94a3b8" fontSize="10" fontWeight="bold">O</text>
                                    <text x={svgVisualData.cx + 45} y={svgVisualData.cy - 6} fill="#cbd5e1" fontSize="11" fontWeight="bold">r</text>
                                </svg>
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8 space-y-2">
                                    <Circle className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                                    <p>Awaiting valid parameters to render SVG</p>
                                </div>
                            )}
                        </div>

                        {/* Primary Highlight Metrics */}
                        {computation.valid && m ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Circumference (C)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(m.circumference)}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">2 · π · r</p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Circle Area (A)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(m.area)}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">π · r² (Square Units)</p>
                                    </div>
                                </div>

                                {/* Sector & Arc Analytical Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Arc Length (s)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(m.arcLength)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Sector Area</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(m.sectorArea)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Chord Length (c)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.chordLength)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Segment Area</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.segmentArea)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Sagitta (Height)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.sagitta)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Apothem</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.apothem)}</span>
                                    </div>
                                </div>

                                {/* Advanced Sub-radii Dimensions */}
                                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                                    <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>Fundamental Dimensions</span>
                                        <span className="text-[10px] text-slate-400 font-mono">Precision: {precision}dp</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                                        <div>Radius: <strong className="text-white">{formatNum(m.radius)}</strong></div>
                                        <div>Diameter: <strong className="text-white">{formatNum(m.diameter)}</strong></div>
                                        <div>Angle (Deg): <strong className="text-white">{formatNum(m.centralAngleDeg)}°</strong></div>
                                        <div>Angle (Rad): <strong className="text-white">{formatNum(m.centralAngleRad)}</strong></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid geometric values to view full circle analytics.
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
                            {copied ? "Circle Geometry Report Copied!" : "Copy Full Circle Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Formula Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Circle, Arc & Sector Formula Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In Euclidean plane geometry, a circle is defined as the locus of all coplanar points equidistant from a single central focus point. Every geometric property—from outer boundary circumference to subtended chords and partial segments—originates from the fundamental circular constant $\pi \approx 3.141592653589793$. The table below presents the exact analytical relationships governing 2D circular parameters in both radian and degree systems:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Geometric Property</th>
                                    <th className="p-3">Radian Formula ($\theta$ in rad)</th>
                                    <th className="p-3">Degree Formula ($\theta$ in °)</th>
                                    <th className="p-3">Core Engineering Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Diameter ($d$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">d = 2r</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">d = 2r</td>
                                    <td className="p-3 text-xs">Shaft sizing, borehole clearance, pipe sizing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Circumference ($C$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">C = 2\pi r</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">C = \pi d</td>
                                    <td className="p-3 text-xs">Perimeter fencing, track length, gasket seals</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Circle Area ($A$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">A = \pi r^2</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{\\pi}{4}d^2"}</td>
                                    <td className="p-3 text-xs">Hydraulic pipe cross-sections, piston surface force</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Arc Length ($s$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">s = r \cdot \theta</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"s = \\frac{\\pi r \\theta}{180 ^\\circ}"}</td>
                                    <td className="p-3 text-xs">Belt drive contact wrap, road curve transitions</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">{"Sector Area ($A_{sec}$)"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{1}{2}r^2\\theta"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{\\pi r^2 \\theta}{360 ^\\circ}"}</td>
                                    <td className="p-3 text-xs">Irrigation spray zones, pie chart visualization</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Chord Length ($c$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">c = 2r \sin(\theta/2)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">c = 2r \sin(\theta/2)</td>
                                    <td className="p-3 text-xs">Bridge arch framing, chord cutting in carpentry</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">{"Segment Area ($A_{seg}$)"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = \\frac{1}{2}r^2(\\theta - \\sin\\theta)"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"A = A_{sec} - \\frac{1}{2}r^2\\sin\\theta"}</td>
                                    <td className="p-3 text-xs">Horizontal tank liquid gauging, culvert drainage</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Sagitta ($h$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">h = r(1 - \cos(\theta/2))</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"h = r - \\sqrt{r ^ 2 - (c / 2) ^ 2}"}</td>
                                    <td className="p-3 text-xs">Optical lens curvature, camber height verification</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Apothem ($a$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">a = r \cos(\theta/2)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"a = \\sqrt{r ^ 2 - (c / 2) ^ 2}"}</td>
                                    <td className="p-3 text-xs">Regular polygon inscribed radii, structural clearances</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Visual Anatomy & Interactive Component Dissection */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CircleDot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anatomy of a Circle: Definitive Architectural Breakdown
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To navigate circular geometry with mathematical precision, engineers and designers classify circle elements into distinct 1D linear distances, angular spans, and 2D enclosed partitions:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Compass className="w-4 h-4" /> 1. Radius & Diameter
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The <strong>radius ($r$)</strong> is the linear segment connecting the circle center to any point on its boundary. The <strong>diameter ($d = 2r$)</strong> is the longest possible straight line passing completely through the center connecting two boundary points.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Circle className="w-4 h-4" /> 2. Circumference & Arc
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The <strong>circumference ($C$)</strong> represents the continuous 1D perimeter of the circle. An <strong>arc ($s$)</strong> is any bounded curve segment of the circumference defined by a central sweep angle $\theta$.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <PieChart className="w-4 h-4" /> 3. Sector & Segment
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A <strong>sector</strong> is the pie-shaped area bounded by two radii and an arc. A <strong>circular segment</strong> is the region bounded solely between a chord line and the arc connecting its endpoints.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Target className="w-4 h-4" /> 4. Chord & Apothem
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A <strong>chord ($c$)</strong> is any line segment whose endpoints both lie on the circle. The <strong>apothem ($a$)</strong> is the shortest perpendicular line connecting the origin to the chord midpoint.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Maximize2 className="w-4 h-4" /> 5. Sagitta (Arch Camber)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The <strong>sagitta ($h$)</strong> is the perpendicular distance measured from the chord midpoint straight to the highest point of the arc ($h = r - a$). In masonry and civil drafting, it is known as the arch camber.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Layers className="w-4 h-4" /> 6. Tangent & Secant
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A <strong>tangent</strong> touches the circle boundary at exactly one point, always perpendicular to the radius at that contact point. A <strong>secant</strong> is an extended line that cuts through the circle at two distinct coordinates.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Calculus Derivations & Sector Integration */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Calculus Derivations: From Archimedes to Modern Integration
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Why does a circle&apos;s surface area equal $\pi r^2$, and how does integrating infinitesimal radial wedges yield sector and segment areas? Examining the fundamental calculus behind circular geometry proves why these equations hold true across all scales:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 1. Area of a Circle via Concentric Rings
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Imagine decomposing a circle of radius $R$ into an infinite series of infinitely thin concentric rings of radius $r$ and thickness $dr$. The area of each thin ring is its circumference multiplied by thickness: $dA = 2\pi r \, dr$. Integrating from $r = 0$ to $r = R$:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"A = \\int_{0}^{R} 2\\pi r \\, dr = 2\\pi \\left[ \\frac{r ^ 2}{2} \\right]_{0}^{R}"}</p>
                                <p className="font-bold text-slate-900">{"A = 2\\pi \\left( \\frac{R ^ 2}{2} - 0 \\right) = \\pi R^2"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {"This proves that the derivative of area with respect to radius equals the circumference ($\\frac{dA}{dr} = 2\\pi r$)."}
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <PieChart className="w-4 h-4 text-indigo-600" /> 2. Sector Area via Polar Coordinate Integration
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"In polar coordinates $(r, \\theta)$, an infinitesimal area element is represented by $dA = \\frac{1}{2} r^2 \\, d\\theta$. Integrating over a central sweep angle from $0$ to $\\theta$ (where $\\theta$ is in radians):"}
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"A_{sec} = \\int_{0}^{\\theta} \\frac{1}{2} r^2 \\, d\\phi = \\frac{1}{2} r^2 \\int_{0}^{\\theta} d\\phi"}</p>
                                <p className="font-bold text-slate-900">{"A_{sec} = \\frac{1}{2} r^2 \\theta"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                For a complete rotation of $\theta = 2\pi$ radians, this simplifies immediately back to $A = \frac{1}{2} r^2 (2\pi) = \pi r^2$.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Analytical Derivation of Circular Segment Area
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            A circular segment is defined as the area between an arc and its bounding chord. To derive its formula geometrically, subtract the area of the central isosceles triangle formed by radii $(r, r)$ and angle $\theta$ from the total sector area:
                        </p>
                        <div className="font-mono text-xs text-indigo-200 bg-slate-950 p-3 rounded-lg space-y-1.5 border border-slate-800">
                            <p>{"A_{segment} = A_{sector} - A_{\\triangle}"}</p>
                            <p>{"A_{sector} = \\frac{1}{2} r^2 \\theta \\quad (\\text{with } \\theta \\text{ in radians})"}</p>
                            <p>{"A_{\\triangle} = \\frac{1}{2} \\cdot a \\cdot b \\cdot \\sin(\\theta) = \\frac{1}{2} \\cdot r \\cdot r \\cdot \\sin(\\theta) = \\frac{1}{2} r^2 \\sin(\\theta)"}</p>
                            <p className="text-white font-bold text-sm">{"A_{segment} = \\frac{1}{2} r^2 (\\theta - \\sin\theta)"}</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Standard Radians vs Degrees Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Grid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Circle Geometry Reference Chart (Unit Radius $r = 1$)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this standardized lookup table to verify common trigonometric divisions of a circle, arc lengths, sector areas, and chord metrics on a normalized unit circle ($r = 1$):
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Degrees (°)</th>
                                    <th className="p-3">Radians (rad)</th>
                                    <th className="p-3">Circle Fraction</th>
                                    <th className="p-3">Arc Length ($r=1$)</th>
                                    <th className="p-3">Sector Area ($r=1$)</th>
                                    <th className="p-3">Chord Length ($r=1$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">30°</td>
                                    <td className="p-3 text-indigo-600">\pi / 6 \approx 0.5236</td>
                                    <td className="p-3">1/12</td>
                                    <td className="p-3">0.5236</td>
                                    <td className="p-3">0.2618</td>
                                    <td className="p-3">0.5176</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">45°</td>
                                    <td className="p-3 text-indigo-600">\pi / 4 \approx 0.7854</td>
                                    <td className="p-3">1/8</td>
                                    <td className="p-3">0.7854</td>
                                    <td className="p-3">0.3927</td>
                                    <td className="p-3">0.7654</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">60°</td>
                                    <td className="p-3 text-indigo-600">\pi / 3 \approx 1.0472</td>
                                    <td className="p-3">1/6</td>
                                    <td className="p-3">1.0472</td>
                                    <td className="p-3">0.5236</td>
                                    <td className="p-3 font-bold text-emerald-700">1.0000 (= r)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">90° (Quadrant)</td>
                                    <td className="p-3 text-indigo-600">\pi / 2 \approx 1.5708</td>
                                    <td className="p-3">1/4</td>
                                    <td className="p-3">1.5708</td>
                                    <td className="p-3">0.7854</td>
                                    <td className="p-3">\sqrt{2} \approx 1.4142</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">120°</td>
                                    <td className="p-3 text-indigo-600">2\pi / 3 \approx 2.0944</td>
                                    <td className="p-3">1/3</td>
                                    <td className="p-3">2.0944</td>
                                    <td className="p-3">1.0472</td>
                                    <td className="p-3">\sqrt{3} \approx 1.7321</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">180° (Semicircle)</td>
                                    <td className="p-3 text-indigo-600">\pi \approx 3.1416</td>
                                    <td className="p-3">1/2</td>
                                    <td className="p-3">3.1416</td>
                                    <td className="p-3">1.5708</td>
                                    <td className="p-3 font-bold text-emerald-700">2.0000 (= d)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">270°</td>
                                    <td className="p-3 text-indigo-600">3\pi / 2 \approx 4.7124</td>
                                    <td className="p-3">3/4</td>
                                    <td className="p-3">4.7124</td>
                                    <td className="p-3">2.3562</td>
                                    <td className="p-3">\sqrt{2} \approx 1.4142</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">360° (Full Circle)</td>
                                    <td className="p-3 text-indigo-600">2\pi \approx 6.2832</td>
                                    <td className="p-3">1</td>
                                    <td className="p-3 font-bold text-indigo-900">2\pi \approx 6.2832</td>
                                    <td className="p-3 font-bold text-indigo-900">\pi \approx 3.1416</td>
                                    <td className="p-3">0.0000</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: Real-World Industry Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Engineering & Industrial Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Circle trigonometry is integral to structural integrity, mechanical efficiency, and fluid containment across critical engineering domains:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> 1. Mechanical Pulleys & Belt Wraps
                            </div>
                            <p className="leading-relaxed">
                                In power transmission engineering, the torque transferred between driving and driven pulleys depends directly on the <strong>arc of contact (wrap angle)</strong>. The belt length is calculated using combined straight tangents and circular arc lengths across two pulleys:
                            </p>
                            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-indigo-700">
                                {"L = 2C + \\frac{\\pi(D+d)}{2} + \\frac{(D - d) ^ 2}{4C}"}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Calculator className="w-4 h-4 text-indigo-600" /> 2. Horizontal Tank Fluid Gauging
                            </div>
                            <p className="leading-relaxed">
                                Cylindrical storage tanks lying horizontally do not exhibit linear depth-to-volume relationships. The fluid volume at dipstick height $h$ equals the <strong>circular segment area</strong> multiplied by cylinder length $L$:
                            </p>
                            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-indigo-700">
                                {"V(h) = L \\cdot \\left[ r^2 \\arccos\\left(\\frac{r - h}{r}\\right) - (r-h)\\sqrt{2rh - h^2} \\right]"}
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Scale className="w-4 h-4 text-indigo-600" /> 3. Highway & Railway Curve Design
                            </div>
                            <p className="leading-relaxed">
                                Transportation engineers design circular horizontal curves to safely transition high-speed vehicles between tangents. The <strong>chord length</strong> and <strong>sagitta (middle ordinate)</strong> dictate line-of-sight clearing distances and track superelevation banking:
                            </p>
                            <div className="p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-indigo-700">
                                {"R = \\frac{c ^ 2}{8M} + \\frac{M}{2} \\quad (M = \\text{Middle Ordinate})"}
                            </div>
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
                            Step-by-Step Geometric Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Walk through these real-world worked solutions to master forward and reverse circle dimension calculations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Architectural Arch (r = 15 m, θ = 80°)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Forward Solver</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Convert Angle to Radians:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\theta = 80^\\circ \\times \\frac{\\pi}{180 ^\\circ} = \\frac{4\\pi}{9} \\approx 1.396263 \\text{rad}"}</li>
                                <li><strong>2. Calculate Outer Arc Length (s):</strong></li>
                                <li className="text-indigo-700 pl-3">{"s = r \\cdot \\theta = 15 \\times 1.396263 = 20.9440 \\text{m}"}</li>
                                <li><strong>3. Calculate Total Sector Surface Area:</strong></li>
                                <li className="text-indigo-700 pl-3">{"A_{sec} = \\frac{1}{2} r^2 \\theta = 0.5 \\times 225 \\times 1.396263 = 157.0796 \\text{m}^2"}</li>
                                <li><strong>4. Calculate Horizontal Span (Chord c):</strong></li>
                                <li className="text-indigo-700 pl-3">{"c = 2(15)\\sin(40^\\circ) = 30 \\times 0.642788 = 19.2836 \\text{m}"}</li>
                                <li><strong>5. Calculate Vertical Arch Rise (Sagitta h):</strong></li>
                                <li className="text-indigo-700 pl-3">{"h = 15(1 - \\cos(40^\\circ)) = 15(1 - 0.766044) = 3.5093 \\text{m}"}</li>
                                <li><strong>6. Enclosed Segment Area:</strong></li>
                                <li className="text-indigo-700 pl-3">{"A_{seg} = 157.0796 - 0.5(225)\\sin(80^\\circ) = 157.08 - 110.79 = 46.2870 \\text{m}^2"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Verification: All arch parameters balanced with zero residual variance.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Reverse Radial Reconstruction (c = 24 cm, h = 6 cm)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Intersecting Chords Theorem</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Apply Intersecting Chords Theorem:</strong></li>
                                <li className="text-indigo-700 pl-3">{"r = \\frac{h}{2} + \\frac{c ^ 2}{8h} = \\frac{6}{2} + \\frac{24 ^ 2}{8(6)} = 3 + \\frac{576}{48} = 3 + 12 = 15.0000 \\text{cm}"}</li>
                                <li><strong>2. Compute Derived Diameter:</strong></li>
                                <li className="text-indigo-700 pl-3">{"d = 2r = 30.0000 \\text{cm}"}</li>
                                <li><strong>3. Solve for Central Angle (\\theta):</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\sin(\\theta/2) = \\frac{c}{2r} = \\frac{24}{30} = 0.8000 \\implies \\theta/2 = 53.1301^\\circ"}</li>
                                <li className="text-indigo-700 pl-3">{"\\theta = 106.2602^\\circ \\approx 1.85459 \\text{rad}"}</li>
                                <li><strong>4. Calculate Subtended Arc Length:</strong></li>
                                <li className="text-indigo-700 pl-3">{"s = r \\cdot \\theta = 15 \\times 1.85459 = 27.8189 \\text{cm}"}</li>
                                <li><strong>5. Calculate Enclosed Segment Area:</strong></li>
                                <li className="text-indigo-700 pl-3">{"A_{seg} = 0.5(15^2)(1.85459 - \\sin(106.2602^\\circ)) = 112.5(1.85459 - 0.9600) = 100.6414 \\text{cm}^2"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Verification: Full inverse circle radius derived from chord and sagitta.
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
                                What is the mathematical relationship between radius, diameter, and circumference?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The diameter is exactly twice the radius ($d = 2r$). The circumference represents the continuous 1D boundary perimeter around the circle, defined by $C = 2\pi r = \pi d$. This means $\pi$ is the invariant geometric ratio of any Euclidean circle&apos;s circumference to its diameter ($C/d = \pi \approx 3.14159265$).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is arc length calculated for degrees versus radians?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"When the central angle $\\theta$ is in radians, the formula is directly $s = r \\cdot \\theta$. When $\\theta$ is measured in degrees, the angle is scaled by the total angular circle fraction: $s = 2\\pi r \\cdot \\left(\\frac{\\theta}{360 ^\\circ}\\right) = \\frac{\\pi r \\theta}{180 ^\\circ}$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a circular sector and a circular segment?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A <strong>circular sector</strong> is a pie-shaped portion bounded by two straight radii extending from the center and connected by an outer arc. A <strong>circular segment</strong> is the smaller region enclosed entirely between a straight chord line and the subtended arc between its endpoints, completely excluding the central origin.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is the area of a circular segment computed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The area of a segment is computed by subtracting the isosceles triangle formed by the two radii from the total sector area: $A_{segment} = A_{sector} - A_{triangle} = \\frac{1}{2}r^2(\\theta - \\sin\\theta)$, where central angle $\\theta$ must be evaluated in radians."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the sagitta and apothem of a circle?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The <strong>apothem ($a$)</strong> is the perpendicular distance from the center of the circle to a chord line ($a = r\cos(\theta/2)$). The <strong>sagitta ($h$)</strong> is the perpendicular height measured from the midpoint of the chord straight to the arc peak, calculated as $h = r - a = r(1 - \cos(\theta/2))$.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the radius of a circle if only the chord length and sagitta are known?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Using the Intersecting Chords Theorem, the circle radius $r$ can be reconstructed without knowing the central origin or angle by evaluating: $r = \\frac{h}{2} + \\frac{c ^ 2}{8h}$, where $c$ is the chord length and $h$ is the sagitta height."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does circle geometry calculate partial volume in horizontal cylindrical tanks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The volume of liquid in a partially filled horizontal cylinder equals the cross-sectional circular segment area multiplied by the total tank length ($V = A_{segment} \\times L$). The measured liquid dipstick depth corresponds directly to the sagitta $h$ of that segment."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is pi ($\pi$) fundamental in circle geometry calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Pi ($\pi \approx 3.14159265359$) is the universal mathematical constant defining the ratio of circumference to diameter in Euclidean 2D space. It directly scales 1D linear radial metrics into 2D circular curvature and enclosed surface area.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}