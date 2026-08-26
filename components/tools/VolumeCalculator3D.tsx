"use client";

import React, { useState, useMemo } from "react";
import {
    Box,
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
    GraduationCap,
    Grid,
    Scale,
    TrendingUp,
    Zap,
    Cpu,
    Cylinder,
    CircleDot
} from "lucide-react";

type SolidShape = "CYLINDER" | "CONE" | "SPHERE";
type DimensionMode = "RADIUS" | "DIAMETER";
type UnitType = "m" | "cm" | "mm" | "in" | "ft";

interface SolidMetrics {
    radius: number;
    diameter: number;
    height: number;
    slantHeight?: number;
    volume: number;
    totalSurfaceArea: number;
    lateralSurfaceArea: number;
    baseArea: number;
    topArea?: number;
    circumference: number;
    volumeLiters: number;
    volumeGallonsUS: number;
}

interface ComputationResult {
    valid: boolean;
    error?: string;
    metrics?: SolidMetrics;
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

export default function VolumeCalculator3D() {
    const [shape, setShape] = useState<SolidShape>("CYLINDER");
    const [dimMode, setDimMode] = useState<DimensionMode>("RADIUS");
    const [unit, setUnit] = useState<UnitType>("cm");
    const [precision, setPrecision] = useState<number>(4);

    // Primary Dimensions
    const [radiusInput, setRadiusInput] = useState<number>(5);
    const [diameterInput, setDiameterInput] = useState<number>(10);
    const [heightInput, setHeightInput] = useState<number>(12);

    const [copied, setCopied] = useState<boolean>(false);

    // Sync radius and diameter when switching mode
    const handleDimModeChange = (mode: DimensionMode) => {
        setDimMode(mode);
        if (mode === "RADIUS") {
            setRadiusInput(diameterInput / 2 || 5);
        } else {
            setDiameterInput(radiusInput * 2 || 10);
        }
    };

    // Math Computation Engine
    const computation: ComputationResult = useMemo(() => {
        const r = dimMode === "RADIUS" ? radiusInput : diameterInput / 2;
        const h = heightInput;

        if (r <= 0) {
            return { valid: false, error: "Radius and diameter must be positive real numbers greater than 0." };
        }

        if (shape !== "SPHERE" && h <= 0) {
            return { valid: false, error: "Height must be a positive real number greater than 0." };
        }

        const diameter = 2 * r;
        const circumference = 2 * Math.PI * r;
        const baseArea = Math.PI * r * r;

        let volume = 0;
        let lateralSurfaceArea = 0;
        let totalSurfaceArea = 0;
        let slantHeight: number | undefined = undefined;
        let topArea: number | undefined = undefined;

        if (shape === "CYLINDER") {
            volume = Math.PI * r * r * h;
            lateralSurfaceArea = 2 * Math.PI * r * h;
            topArea = baseArea;
            totalSurfaceArea = lateralSurfaceArea + (2 * baseArea);
        } else if (shape === "CONE") {
            slantHeight = Math.sqrt(r * r + h * h);
            volume = (1 / 3) * Math.PI * r * r * h;
            lateralSurfaceArea = Math.PI * r * slantHeight;
            totalSurfaceArea = lateralSurfaceArea + baseArea;
            topArea = 0;
        } else if (shape === "SPHERE") {
            volume = (4 / 3) * Math.PI * Math.pow(r, 3);
            lateralSurfaceArea = 4 * Math.PI * r * r; // Total surface area
            totalSurfaceArea = 4 * Math.PI * r * r;
            topArea = 0;
        }

        // Unit conversions to liquid capacity (Liters and Gallons)
        let volumeInCubicMeters = 0;
        if (unit === "m") volumeInCubicMeters = volume;
        else if (unit === "cm") volumeInCubicMeters = volume / 1e6;
        else if (unit === "mm") volumeInCubicMeters = volume / 1e9;
        else if (unit === "in") volumeInCubicMeters = volume * 0.000016387064;
        else if (unit === "ft") volumeInCubicMeters = volume * 0.028316846592;

        const volumeLiters = volumeInCubicMeters * 1000;
        const volumeGallonsUS = volumeInCubicMeters * 264.172052;

        return {
            valid: true,
            metrics: {
                radius: r,
                diameter,
                height: shape === "SPHERE" ? 2 * r : h,
                slantHeight,
                volume,
                totalSurfaceArea,
                lateralSurfaceArea,
                baseArea,
                topArea,
                circumference,
                volumeLiters,
                volumeGallonsUS
            }
        };
    }, [shape, dimMode, unit, radiusInput, diameterInput, heightInput]);

    const m = computation.metrics;

    const handleReset = () => {
        setShape("CYLINDER");
        setDimMode("RADIUS");
        setUnit("cm");
        setPrecision(4);
        setRadiusInput(5);
        setDiameterInput(10);
        setHeightInput(12);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toLocaleString("en-US", {
            maximumFractionDigits: precision
        });
    };

    const handleCopyResults = () => {
        if (!m) return;
        const format = (n: number) => n.toFixed(precision);
        const text = `3D Geometric Solid Report (${shape}) - twistertools.com
--------------------------------------------------
Shape: ${shape}
Measurement Unit: ${unit}

Input Dimensions:
  Radius (r) = ${format(m.radius)} ${unit}
  Diameter (d) = ${format(m.diameter)} ${unit}
  Height (h) = ${format(m.height)} ${unit}
  ${m.slantHeight ? `Slant Height (s) = ${format(m.slantHeight)} ${unit}\n` : ""}
Calculated Volumetric & Surface Metrics:
  Total Volume (V) = ${format(m.volume)} ${unit}³
  Total Surface Area (TSA) = ${format(m.totalSurfaceArea)} ${unit}²
  Lateral Surface Area (LSA) = ${format(m.lateralSurfaceArea)} ${unit}²
  Base Surface Area = ${format(m.baseArea)} ${unit}²
  Perimeter / Base Circumference = ${format(m.circumference)} ${unit}

Liquid Capacity Conversions:
  Volume in Liters = ${format(m.volumeLiters)} L
  Volume in US Liquid Gallons = ${format(m.volumeGallonsUS)} gal
--------------------------------------------------
Generated via TwisterTools 3D Volume and Surface Area Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Cylinder, Cone & Sphere Volume and Surface Area Calculator",
        "url": "https://twistertools.com/tools/math-tools/3d-volume-calculator",
        "description": "Enterprise-grade 3D geometry engine computing exact volume, lateral surface area, total surface area, slant height, base circumference, and liquid capacity for cylinders, cones, and spheres.",
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
                "name": "What is the formula for calculating the volume of a cylinder, cone, and sphere?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The volume formulas are: Cylinder: V = π·r²·h; Cone: V = (1/3)·π·r²·h; Sphere: V = (4/3)·π·r³. Notice that a cone occupies exactly one-third the volume of a cylinder with the same radius and height."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Lateral Surface Area (LSA) and Total Surface Area (TSA)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Lateral Surface Area measures only the curved side surface area of a 3D solid, excluding its flat circular top and base. Total Surface Area incorporates the curved lateral area plus the area of all flat end faces (bases)."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate the slant height of a right circular cone?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The slant height (s) represents the straight-line hypotenuse from the apex to the circular edge of the base. Using the Pythagorean Theorem, it is computed as s = √(r² + h²)."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the volume of a cone exactly one-third of a cylinder?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Through calculus integration using circular cross-sectional disks from 0 to h, the integrated cross-sectional area scaling factor yields 1/3. Geometrically, three identical cones of water can perfectly fill a cylinder having the same radius and perpendicular height."
                }
            },
            {
                "@type": "Question",
                "name": "How do you convert cubic centimeters (cm³) and cubic inches (in³) into liters and gallons?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "1 Liter equals 1,000 cm³ or 0.001 m³. 1 US Liquid Gallon equals 231 cubic inches or approximately 3,785.41 cm³. This calculator automatically evaluates exact metric and imperial volumetric fluid capacity in real time."
                }
            },
            {
                "@type": "Question",
                "name": "What is Archimedes' Hat-Box Theorem regarding spheres and cylinders?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Archimedes proved that a sphere inscribed inside a cylinder has exactly two-thirds of the volume and two-thirds of the total surface area of that circumscribed cylinder. The surface area of the sphere (4πr²) is equal to the lateral surface area of the cylinder (2πr·2r = 4πr²)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                3D Solid Geometry Configuration
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Shape Selector Tabs */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Select 3D Solid Body
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "CYLINDER", label: "Cylinder", icon: Cylinder, desc: "V = π·r²·h" },
                                    { id: "CONE", label: "Cone", icon: Compass, desc: "V = ⅓·π·r²·h" },
                                    { id: "SPHERE", label: "Sphere", icon: CircleDot, desc: "V = ⁴⁄₃·π·r³" }
                                ].map((item) => {
                                    const IconComponent = item.icon;
                                    const isSelected = shape === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setShape(item.id as SolidShape)}
                                            className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${isSelected
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <IconComponent className={`w-5 h-5 ${isSelected ? "text-white" : "text-indigo-600"}`} />
                                            <span className="font-extrabold text-xs">{item.label}</span>
                                            <span className={`text-[10px] font-mono ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                                                {item.desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Global Units & Measurement Mode */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Radial Input Type</label>
                                <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => handleDimModeChange("RADIUS")}
                                        className={`flex-1 py-1 text-xs font-bold rounded-md transition cursor-pointer ${dimMode === "RADIUS" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Radius (r)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDimModeChange("DIAMETER")}
                                        className={`flex-1 py-1 text-xs font-bold rounded-md transition cursor-pointer ${dimMode === "DIAMETER" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Diameter (d)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Length Unit</label>
                                <div className="grid grid-cols-5 bg-white p-0.5 rounded-lg border border-slate-200">
                                    {(["cm", "m", "mm", "in", "ft"] as UnitType[]).map((u) => (
                                        <button
                                            key={u}
                                            type="button"
                                            onClick={() => setUnit(u)}
                                            className={`py-1 text-xs font-bold rounded-md transition cursor-pointer text-center ${unit === u ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Dimension Sliders & Inputs */}
                        <div className="space-y-4">
                            {dimMode === "RADIUS" ? (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span>Base Radius (r)</span>
                                        <span className="text-indigo-600 font-mono">{radiusInput} {unit}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="100"
                                            step="0.5"
                                            value={radiusInput}
                                            onChange={(e) => setRadiusInput(parseFloat(e.target.value) || 0.5)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="relative w-28 flex-shrink-0">
                                            <input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={radiusInput === 0 ? "" : radiusInput}
                                                onChange={(e) => handleNumberInput(e, setRadiusInput)}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                                            />
                                            <span className="absolute right-2.5 top-1.5 text-xs font-semibold text-slate-400">{unit}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span>Base Diameter (d)</span>
                                        <span className="text-indigo-600 font-mono">{diameterInput} {unit}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="200"
                                            step="1"
                                            value={diameterInput}
                                            onChange={(e) => setDiameterInput(parseFloat(e.target.value) || 1)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="relative w-28 flex-shrink-0">
                                            <input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={diameterInput === 0 ? "" : diameterInput}
                                                onChange={(e) => handleNumberInput(e, setDiameterInput)}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                                            />
                                            <span className="absolute right-2.5 top-1.5 text-xs font-semibold text-slate-400">{unit}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {shape !== "SPHERE" && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span>Perpendicular Height (h)</span>
                                        <span className="text-indigo-600 font-mono">{heightInput} {unit}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="150"
                                            step="0.5"
                                            value={heightInput}
                                            onChange={(e) => setHeightInput(parseFloat(e.target.value) || 0.5)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="relative w-28 flex-shrink-0">
                                            <input
                                                type="number"
                                                min="0.001"
                                                step="any"
                                                value={heightInput === 0 ? "" : heightInput}
                                                onChange={(e) => handleNumberInput(e, setHeightInput)}
                                                className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 pr-8"
                                            />
                                            <span className="absolute right-2.5 top-1.5 text-xs font-semibold text-slate-400">{unit}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Precision Control */}
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

                        {/* Validation Feedback */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Invalid Geometric Input</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Exact 3D Solid Geometry Solved
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    π-Calculus Verified
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Constant: π ≈ 3.14159265
                        </span>
                        <span>Euclidean 3D Manifold</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time 3D SVG Projection & Analytical Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Volumetric Analytics & Vector Visualizer
                            </h2>
                            {computation.valid && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                    {shape} Solid
                                </span>
                            )}
                        </div>

                        {/* Real-time Dynamic 3D Solid SVG Visualizer */}
                        <div className="w-full bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-800 relative overflow-hidden min-h-[220px]">
                            <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" /> 3D Isometric Orthographic Wireframe
                            </div>

                            {computation.valid && m ? (
                                <svg viewBox="0 0 300 200" className="w-full h-44 overflow-visible">
                                    <defs>
                                        <linearGradient id="solidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                                            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
                                            <stop offset="100%" stopColor="#312e81" stopOpacity="0.5" />
                                        </linearGradient>
                                        <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                                            <stop offset="40%" stopColor="#4f46e5" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
                                        </radialGradient>
                                    </defs>

                                    {shape === "CYLINDER" && (
                                        <g>
                                            {/* Cylinder Side Body */}
                                            <path d="M 90 60 L 90 140 A 60 20 0 0 0 210 140 L 210 60 Z" fill="url(#solidGrad)" stroke="#6366f1" strokeWidth="2" />
                                            {/* Bottom Hidden Dashed Rim */}
                                            <ellipse cx="150" cy="140" rx="60" ry="20" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
                                            {/* Top Rim */}
                                            <ellipse cx="150" cy="60" rx="60" ry="20" fill="#6366f1" fillOpacity="0.3" stroke="#818cf8" strokeWidth="2" />
                                            {/* Height Annotation */}
                                            <line x1="225" y1="60" x2="225" y2="140" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="arrow" />
                                            <text x="235" y="105" fill="#cbd5e1" fontSize="11" fontWeight="bold">h = {formatNum(m.height)}</text>
                                            {/* Radius Annotation */}
                                            <line x1="150" y1="60" x2="210" y2="60" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
                                            <circle cx="150" cy="60" r="3" fill="#f43f5e" />
                                            <text x="175" y="52" fill="#f43f5e" fontSize="10" fontWeight="bold">r</text>
                                        </g>
                                    )}

                                    {shape === "CONE" && (
                                        <g>
                                            {/* Cone Body */}
                                            <path d="M 150 40 L 80 145 A 70 20 0 0 0 220 145 Z" fill="url(#solidGrad)" stroke="#6366f1" strokeWidth="2" />
                                            {/* Bottom Base */}
                                            <ellipse cx="150" cy="145" rx="70" ry="20" fill="rgba(99, 102, 241, 0.2)" stroke="#818cf8" strokeWidth="2" />
                                            <ellipse cx="150" cy="145" rx="70" ry="20" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" />
                                            {/* Center Height Line */}
                                            <line x1="150" y1="40" x2="150" y2="145" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
                                            <circle cx="150" cy="145" r="3" fill="#cbd5e1" />
                                            {/* Slant Height Annotation */}
                                            <text x="75" y="90" fill="#a5b4fc" fontSize="11" fontWeight="bold">s = {formatNum(m.slantHeight)}</text>
                                            {/* Base Radius Line */}
                                            <line x1="150" y1="145" x2="220" y2="145" stroke="#f43f5e" strokeWidth="1.5" />
                                            <text x="180" y="140" fill="#f43f5e" fontSize="10" fontWeight="bold">r</text>
                                            {/* Apex Dot */}
                                            <circle cx="150" cy="40" r="4" fill="#818cf8" />
                                        </g>
                                    )}

                                    {shape === "SPHERE" && (
                                        <g>
                                            {/* 3D Shaded Sphere */}
                                            <circle cx="150" cy="100" r="65" fill="url(#sphereGrad)" stroke="#818cf8" strokeWidth="2" />
                                            {/* Equatorial Ellipse */}
                                            <ellipse cx="150" cy="100" rx="65" ry="22" fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeDasharray="4 4" />
                                            {/* Radius Line */}
                                            <line x1="150" y1="100" x2="215" y2="100" stroke="#f43f5e" strokeWidth="2" />
                                            <circle cx="150" cy="100" r="3.5" fill="#f43f5e" />
                                            <text x="178" y="94" fill="#f43f5e" fontSize="11" fontWeight="bold">r = {formatNum(m.radius)}</text>
                                            <text x="142" y="116" fill="#cbd5e1" fontSize="10">O</text>
                                        </g>
                                    )}
                                </svg>
                            ) : (
                                <div className="text-center text-slate-500 text-xs py-8 space-y-2">
                                    <Box className="w-10 h-10 mx-auto text-slate-700 stroke-[1.5]" />
                                    <p>Enter positive real numbers to render 3D manifold</p>
                                </div>
                            )}
                        </div>

                        {/* Primary Calculated Metric Cards */}
                        {computation.valid && m ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Total Volume (V)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(m.volume)} <span className="text-sm font-bold text-indigo-600">{unit}³</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            {shape === "CYLINDER" && "π · r² · h"}
                                            {shape === "CONE" && "⅓ · π · r² · h"}
                                            {shape === "SPHERE" && "⁴⁄₃ · π · r³"}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Total Surface Area (TSA)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(m.totalSurfaceArea)} <span className="text-sm font-bold text-indigo-600">{unit}²</span>
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            {shape === "CYLINDER" && "2πrh + 2πr²"}
                                            {shape === "CONE" && "πr(r + s)"}
                                            {shape === "SPHERE" && "4 · π · r²"}
                                        </p>
                                    </div>
                                </div>

                                {/* Detailed Analytical Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Lateral Surface (LSA)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(m.lateralSurfaceArea)} {unit}²</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Base Area (A_base)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(m.baseArea)} {unit}²</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Base Circumference</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.circumference)} {unit}</span>
                                    </div>
                                    {m.slantHeight !== undefined && (
                                        <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                            <span className="text-[11px] font-bold text-slate-500 block">Slant Height (s)</span>
                                            <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.slantHeight)} {unit}</span>
                                        </div>
                                    )}
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Liquid Liters (L)</span>
                                        <span className="font-extrabold text-emerald-700 text-sm">{formatNum(m.volumeLiters)} L</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">US Liquid Gallons</span>
                                        <span className="font-extrabold text-emerald-700 text-sm">{formatNum(m.volumeGallonsUS)} gal</span>
                                    </div>
                                </div>

                                {/* Engineering Verification Box */}
                                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                                    <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>Geometric Dimensions Summary</span>
                                        <span className="text-[10px] text-slate-400 font-mono">Precision: {precision}dp</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                                        <div>Radius: <strong className="text-white">{formatNum(m.radius)} {unit}</strong></div>
                                        <div>Diameter: <strong className="text-white">{formatNum(m.diameter)} {unit}</strong></div>
                                        <div>Height: <strong className="text-white">{formatNum(m.height)} {unit}</strong></div>
                                        <div>Volume Ratio: <strong className="text-white">{shape === "CONE" ? "0.3333× Cyl" : shape === "SPHERE" ? "0.6667× Cyl" : "1.0000× Cyl"}</strong></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid geometric values to view full 3D analytics.
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
                            {copied ? "3D Solid Geometry Report Copied!" : "Copy Full Solid Geometry Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master 3D Formula Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master 3D Solid Formula Matrix: Cylinder, Cone & Sphere
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Three-dimensional solid geometry builds directly upon 2D circular cross-sections integrated across linear or curved vertical axes. In Euclidean spatial physics, the relationship between radial distance $r$, perpendicular height $h$, slant height $s$, volume $V$, and bounding surface areas ($LSA$ and $TSA$) are defined by exact mathematical constants:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Solid Shape</th>
                                    <th className="p-3">Total Volume ($V$)</th>
                                    <th className="p-3">Lateral Surface Area ($LSA$)</th>
                                    <th className="p-3">Total Surface Area ($TSA$)</th>
                                    <th className="p-3">Geometric Auxiliary Formula</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                        <Cylinder className="w-4 h-4 text-indigo-600" /> Right Cylinder
                                    </td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">V = \pi r^2 h</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">LSA = 2\pi r h</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">TSA = 2\pi r h + 2\pi r^2</td>
                                    <td className="p-3 text-xs">{"A_{base} = \\pi r^2, \\quad C = 2\\pi r"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                        <Compass className="w-4 h-4 text-indigo-600" /> Right Circular Cone
                                    </td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"V = \\frac{1}{3}\\pi r^2 h"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">LSA = \pi r s</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">TSA = \pi r s + \pi r^2</td>
                                    <td className="p-3 text-xs">{"s = \\sqrt{r^2 + h^2} \\text{ (Slant Height)}"}</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                        <CircleDot className="w-4 h-4 text-indigo-600" /> Solid Sphere
                                    </td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"V = \\frac{4}{3}\\pi r^3"}</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">LSA = 4\pi r^2</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">TSA = 4\pi r^2</td>
                                    <td className="p-3 text-xs">d = 2r, \quad C = 2\pi r</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Visual Anatomy & Dissection */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Anatomy of 3D Circular Solids
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To calculate fluid capacity, material weights, and thermal dissipation rates in structural engineering, 3D solids are dissected into primary structural components:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Cylinder className="w-4 h-4" /> 1. The Right Cylinder
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Formed by translating a circle of radius $r$ vertically through space along an orthogonal height axis $h$. It features two identical parallel flat circular disks (top and base) connected by a rectangular sheet rolled into a cylindrical lateral tube of area $2\pi rh$.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Compass className="w-4 h-4" /> 2. The Right Circular Cone
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"Formed by connecting every point on a circular base of radius $r$ to a singular apex point positioned at perpendicular height $h$. The straight distance from the apex to any base boundary point forms the slant height $s = \\sqrt{r ^ 2 + h ^ 2}$."}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <CircleDot className="w-4 h-4" /> 3. The Perfect Sphere
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Defined as the complete 3D locus of all points in Euclidean space situated at constant radius $r$ from an origin focus point $(0,0,0)$. A sphere has zero flat edges or vertices, maximizing volumetric containment per unit of enclosing surface area.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Calculus Derivations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Calculus Derivations: Disk Integration & Hat-Box Theorem
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Why does a cone possess exactly one-third the volume of a cylinder, and where does the sphere&apos;s $4/3$ fraction originate? The calculus of solids of revolution proves these relationships through definite integration:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 1. Cone Volume via Disk Integration
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"Place a cone of base radius $R$ and height $H$ along the x-axis with apex at the origin. The radius of a disk at distance $x$ is $r(x) = \\frac{R}{H}x$. The differential volume of each thin circular disk is $dV = \\pi [r(x)]^2 dx$. Integrating from $0$ to $H$:"}
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"V = \\int_{0}^{H} \\pi \\left(\\frac{R}{H}x\\right)^2 dx = \\pi \\frac{R^2}{H^2} \\int_{0}^{H} x^2 dx"}</p>
                                <p className="font-bold text-slate-900">{"V = \\pi \\frac{R^2}{H^2} \\left[ \\frac{x^3}{3} \\right]_{0}^{H} = \\frac{1}{3}\\pi R^2 H"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                This mathematically proves the exact $1/3$ ratio for all right circular cones.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> 2. Sphere Volume via Disk Slicing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"A sphere centered at $(0,0,0)$ obeys $x^2 + y^2 + z^2 = R^2$. A horizontal cross-sectional disk at height $z$ has radius $r(z) = \\sqrt{R ^ 2 - z ^ 2}$. Integrating disk area $A(z) = \\pi(R^2 - z^2)$ from $z = -R$ to $z = R$:"}
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"V = \\pi \\int_{-R}^{R} (R^2 - z^2) dz = 2\\pi \\left[ R^2 z - \\frac{z^3}{3} \\right]_{0}^{R}"}</p>
                                <p className="font-bold text-slate-900">{"V = 2\\pi \\left( R^3 - \\frac{R^3}{3} \\right) = 2\\pi \\left( \\frac{2R^3}{3} \\right) = \\frac{4}{3}\\pi R^3"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Differentiating volume with respect to radius yields surface area: $d/dr[(4/3)\pi r^3] = 4\pi r^2$.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Archimedes&apos; Celebrated Ratio: Sphere Inscribed in a Cylinder
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Archimedes considered his greatest discovery to be the geometric proof that a sphere inscribed within a cylinder whose height and diameter both equal $2r$ holds exactly $2/3$ of the cylinder&apos;s volume and total surface area:
                        </p>
                        <div className="font-mono text-xs text-indigo-200 bg-slate-950 p-3 rounded-lg space-y-1.5 border border-slate-800">
                            <p>{"V_{cylinder} = \\pi r^2 (2r) = 2\\pi r^3 \\implies V_{sphere} = \\frac{4}{3}\\pi r^3 = \\frac{2}{3} V_{cylinder}"}</p>
                            <p>{"TSA_{cylinder} = 2\\pi r(2r) + 2\\pi r^2 = 6\\pi r^2 \\implies TSA_{sphere} = 4\\pi r^2 = \\frac{2}{3} TSA_{cylinder}"}</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Volumetric Unit Conversion Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Grid className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Volumetric Capacity & Fluid Unit Conversion Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Convert calculated spatial volumes into practical industrial fluid storage capacities across standard international units:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Base Unit</th>
                                    <th className="p-3">Equivalent in Liters (L)</th>
                                    <th className="p-3">Equivalent in US Gallons (gal)</th>
                                    <th className="p-3">Equivalent in Cubic Meters (m³)</th>
                                    <th className="p-3">Primary Engineering Use</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1 Cubic Meter (m³)</td>
                                    <td className="p-3 text-indigo-600 font-bold">1,000.00 L</td>
                                    <td className="p-3">264.172 gal</td>
                                    <td className="p-3">1.000000 m³</td>
                                    <td className="p-3 font-sans">Municipal reservoirs, concrete pours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1,000 Cubic Centimeters (cm³)</td>
                                    <td className="p-3 text-indigo-600 font-bold">1.0000 L</td>
                                    <td className="p-3">0.264172 gal</td>
                                    <td className="p-3">0.001000 m³</td>
                                    <td className="p-3 font-sans">Engine cylinder displacement (cc), bottles</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1 Cubic Foot (ft³)</td>
                                    <td className="p-3 text-indigo-600 font-bold">28.3168 L</td>
                                    <td className="p-3">7.48052 gal</td>
                                    <td className="p-3">0.028317 m³</td>
                                    <td className="p-3 font-sans">HVAC air handling, natural gas storage</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1 Cubic Inch (in³)</td>
                                    <td className="p-3 text-indigo-600 font-bold">0.016387 L</td>
                                    <td className="p-3">0.004329 gal</td>
                                    <td className="p-3">0.000016 m³</td>
                                    <td className="p-3 font-sans">Hydraulic pump pistons, machinery cavities</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900 font-sans">1 US Liquid Gallon</td>
                                    <td className="p-3 text-indigo-600 font-bold">3.78541 L</td>
                                    <td className="p-3">1.000000 gal</td>
                                    <td className="p-3">0.003785 m³</td>
                                    <td className="p-3 font-sans">Fuel tanks, chemical barrels (55-gal drums)</td>
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
                            Industrial & Real-World Engineering Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurate 3D volume and surface area computations are vital for material estimation, mechanical thermal cooling, and aerodynamic modeling:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> 1. Storage Silos & Cylindrical Tanks
                            </div>
                            <p className="leading-relaxed">
                                Chemical plants store pressurized liquids and gases in cylindrical and spherical pressure vessels. Calculating the total surface area determines sheet metal sheet procurement and protective corrosion coating volume, while the inner volume dictates safe operational capacity.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Calculator className="w-4 h-4 text-indigo-600" /> 2. Industrial Hoppers & Conical Funnels
                            </div>
                            <p className="leading-relaxed">
                                In bulk material handling, grain silos and aggregate hoppers utilize conical discharge funnels to maintain uniform gravity mass flow. The slant height and lateral area determine the friction lining wear surface and fabrication pattern cutouts.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Scale className="w-4 h-4 text-indigo-600" /> 3. Thermal Radiation & Heat Exchangers
                            </div>
                            <p className="leading-relaxed">
                                Spherical tanks minimize thermal dissipation because the sphere has the lowest possible surface area per unit volume. Conversely, cylindrical piping arrays maximize lateral surface area to promote rapid heat exchange in refrigeration systems.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Step-by-Step Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review these complete worked examples demonstrating exact mathematical calculations for industrial solids:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">{"Case Study 1: Conical Hopper ($r = 6\\text{m}, h = 8\\text{m}$)"}</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Cone Solution</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Calculate Slant Height (s):</strong></li>
                                <li className="text-indigo-700 pl-3">{"s = \\sqrt{r^2 + h^2} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10.0000\\text{ m}"}</li>
                                <li><strong>2. Calculate Total Volume (V):</strong></li>
                                <li className="text-indigo-700 pl-3">{"V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi(36)(8) = 96\\pi \\approx 301.5929\\text{ m}^3"}</li>
                                <li><strong>3. Calculate Lateral Surface Area (LSA):</strong></li>
                                <li className="text-indigo-700 pl-3">{"LSA = \\pi r s = \\pi(6)(10) = 60\\pi \\approx 188.4956\\text{ m}^2"}</li>
                                <li><strong>4. Calculate Total Surface Area (TSA):</strong></li>
                                <li className="text-indigo-700 pl-3">{"TSA = LSA + \\pi r^2 = 188.4956 + 36\\pi = 96\\pi \\approx 301.5929\\text{ m}^2"}</li>
                                <li><strong>5. Liquid Storage Capacity:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\text{Capacity} = 301.5929 \\times 1000 = 301,592.9\\text{ Liters}"}</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">{"Case Study 2: Spherical Gas Tank ($d = 14\\text{m} \\implies r = 7\\text{m}$)"}</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Sphere Solution</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Determine Radius from Diameter:</strong></li>
                                <li className="text-indigo-700 pl-3">{"r = d / 2 = 14 / 2 = 7.0000\\text{ m}"}</li>
                                <li><strong>2. Calculate Enclosed Volume (V):</strong></li>
                                <li className="text-indigo-700 pl-3">{"V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3}\\pi(343) = \\frac{1372}{3}\\pi \\approx 1436.7550\\text{ m}^3"}</li>
                                <li><strong>3. Calculate Total Surface Area (TSA):</strong></li>
                                <li className="text-indigo-700 pl-3">{"TSA = 4\\pi r^2 = 4\\pi(49) = 196\\pi \\approx 615.7522\\text{ m}^2"}</li>
                                <li><strong>4. Circumference (Equatorial):</strong></li>
                                <li className="text-indigo-700 pl-3">{"C = 2\\pi r = 2\\pi(7) = 14\\pi \\approx 43.9823\\text{ m}"}</li>
                                <li><strong>5. Liquid Gallon Capacity:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\text{Capacity} = 1436.7550 \\times 264.172 = 379,550.6\\text{ Gallons}"}</li>
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
                                What is the formula for calculating the volume of a cylinder, cone, and sphere?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The volume formulas are: Cylinder: $V = \\pi r^2 h$; Cone: $V = \\frac{1}{3}\\pi r^2 h$; Sphere: $V = \\frac{4}{3}\\pi r^3$. A cone occupies exactly one-third of the volume of a cylinder having identical base radius and vertical height."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Lateral Surface Area (LSA) and Total Surface Area (TSA)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Lateral Surface Area (LSA) measures only the curved side wall of a solid, excluding any flat end bases. Total Surface Area (TSA) includes the lateral surface area plus the area of all circular base faces ($TSA = LSA + 2\\pi r^2$ for a cylinder; $TSA = LSA + \\pi r^2$ for a cone). For a sphere, lateral and total surface area are identical ($4\\pi r^2$)."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate the slant height of a right circular cone?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The slant height ($s$) represents the hypotenuse from the cone's apex to the outer circumference of its base. By applying the Pythagorean Theorem to the right triangle formed by radius $r$ and perpendicular height $h$, slant height is calculated as $s = \\sqrt{r^2 + h^2}$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the volume of a cone exactly one-third of a cylinder?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Through calculus integration, integrating circular disks with cross-sectional radii that scale linearly from 0 at the apex to $R$ at the base produces the integral $\\int x^2 dx = \\frac{x^3}{3}$. This introduces the exact mathematical factor of $1/3$ across all conical geometries."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you convert cubic units into liters and US gallons?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"1 Liter equals $1,000\\text{cm}^3$ or $0.001\\text{m}^3$. 1 US Liquid Gallon equals $231\\text{ in}^3$ or approximately $3,785.41\\text{cm}^3$. This tool automatically computes liquid storage capacity across metric liters and US gallons."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Archimedes&apos; Hat-Box Theorem?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Archimedes proved that a sphere inscribed within an enclosing cylinder has exactly two-thirds of the volume and two-thirds of the total surface area of that cylinder. Furthermore, any horizontal slice through both solids creates cylindrical and spherical zone bands with identical surface areas.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}