"use client";

import React, { useState, useMemo } from "react";
import {
    Scale,
    RotateCcw,
    Copy,
    Check,
    ChefHat,
    Sparkles,
    BookOpen,
    HelpCircle,
    ArrowRightLeft,
    Layers,
    SlidersHorizontal,
    Maximize2,
    Info,
    CheckCircle2,
    Flame,
    Calculator
} from "lucide-react";

type UnitSystem = "in" | "cm";
type PanShape = "round" | "square" | "rectangular" | "bundt" | "springform";

interface PanDimensions {
    shape: PanShape;
    diameter: number;
    width: number;
    length: number;
    depth: number;
    volumeOverride?: number;
}

interface CommonPanPreset {
    name: string;
    shape: PanShape;
    dimsInches: { diameter?: number; width?: number; length?: number; depth: number };
    areaSqIn: number;
    volumeCups: number;
}

const COMMON_PRESETS: CommonPanPreset[] = [
    { name: '8" Round Cake Pan (2" Deep)', shape: "round", dimsInches: { diameter: 8, depth: 2 }, areaSqIn: 50.27, volumeCups: 6.0 },
    { name: '9" Round Cake Pan (2" Deep)', shape: "round", dimsInches: { diameter: 9, depth: 2 }, areaSqIn: 63.62, volumeCups: 8.0 },
    { name: '10" Round Cake Pan (2" Deep)', shape: "round", dimsInches: { diameter: 10, depth: 2 }, areaSqIn: 78.54, volumeCups: 10.0 },
    { name: '8" Square Pan (2" Deep)', shape: "square", dimsInches: { width: 8, length: 8, depth: 2 }, areaSqIn: 64.0, volumeCups: 8.0 },
    { name: '9" Square Pan (2" Deep)', shape: "square", dimsInches: { width: 9, length: 9, depth: 2 }, areaSqIn: 81.0, volumeCups: 10.0 },
    { name: '9x13" Quarter Sheet / Casserole', shape: "rectangular", dimsInches: { width: 9, length: 13, depth: 2 }, areaSqIn: 117.0, volumeCups: 14.0 },
    { name: '8.5x4.5" Standard Loaf Pan (1 lb)', shape: "rectangular", dimsInches: { width: 4.5, length: 8.5, depth: 2.75 }, areaSqIn: 38.25, volumeCups: 6.0 },
    { name: '9x5" Quick Bread Loaf Pan (1.25 lb)', shape: "rectangular", dimsInches: { width: 5, length: 9, depth: 2.75 }, areaSqIn: 45.0, volumeCups: 8.0 },
    { name: '10" Classic Bundt Pan (12-Cup)', shape: "bundt", dimsInches: { diameter: 10, depth: 3.5 }, areaSqIn: 62.83, volumeCups: 12.0 },
    { name: '9" Springform Pan (3" Deep)', shape: "springform", dimsInches: { diameter: 9, depth: 3 }, areaSqIn: 63.62, volumeCups: 10.5 },
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

export default function CakePanConverter() {
    const [unit, setUnit] = useState<UnitSystem>("in");

    // Original Recipe Pan State (Dimensions stored natively in inches)
    const [origShape, setOrigShape] = useState<PanShape>("round");
    const [origDiameter, setOrigDiameter] = useState<number>(9);
    const [origWidth, setOrigWidth] = useState<number>(9);
    const [origLength, setOrigLength] = useState<number>(13);
    const [origDepth, setOrigDepth] = useState<number>(2);

    // Target Destination Pan State (Dimensions stored natively in inches)
    const [targetShape, setTargetShape] = useState<PanShape>("square");
    const [targetDiameter, setTargetDiameter] = useState<number>(8);
    const [targetWidth, setTargetWidth] = useState<number>(8);
    const [targetLength, setTargetLength] = useState<number>(8);
    const [targetDepth, setTargetDepth] = useState<number>(2);

    // Sample ingredient scaling playground
    const [sampleFlourGrams, setSampleFlourGrams] = useState<number>(250);
    const [sampleSugarCups, setSampleSugarCups] = useState<number>(1);
    const [sampleEggs, setSampleEggs] = useState<number>(3);

    const [copied, setCopied] = useState<boolean>(false);

    // Helper conversion factor
    const lengthMultiplier = unit === "cm" ? 0.393701 : 1; // display to inches
    const displayMultiplier = unit === "cm" ? 2.54 : 1; // inches to display

    // Surface Area & Volume Computations (Always calculated in standard square inches & cubic inches)
    const calculateGeometry = (shape: PanShape, dia: number, w: number, l: number, d: number) => {
        let areaSqIn = 0;
        let volumeCuIn = 0;
        let volumeCups = 0;

        if (shape === "round" || shape === "springform") {
            const radius = dia / 2;
            areaSqIn = Math.PI * Math.pow(radius, 2);
            volumeCuIn = areaSqIn * d;
        } else if (shape === "square") {
            areaSqIn = Math.pow(w, 2);
            volumeCuIn = areaSqIn * d;
        } else if (shape === "rectangular") {
            areaSqIn = w * l;
            volumeCuIn = areaSqIn * d;
        } else if (shape === "bundt") {
            // Bundt pans have a hollow core cone (~25% reduced area compared to solid cylinder)
            const radius = dia / 2;
            areaSqIn = Math.PI * Math.pow(radius, 2) * 0.72;
            volumeCuIn = areaSqIn * d * 0.85;
        }

        // 1 US Cup = ~14.4375 cubic inches
        // 1 cubic inch = ~16.387 ml
        volumeCups = volumeCuIn / 14.4375;
        const volumeMl = volumeCuIn * 16.387;
        const areaSqCm = areaSqIn * 6.4516;

        return {
            areaSqIn,
            areaSqCm,
            volumeCuIn,
            volumeCups,
            volumeMl,
        };
    };

    const origGeometry = useMemo(() => {
        return calculateGeometry(origShape, origDiameter, origWidth, origLength, origDepth);
    }, [origShape, origDiameter, origWidth, origLength, origDepth]);

    const targetGeometry = useMemo(() => {
        return calculateGeometry(targetShape, targetDiameter, targetWidth, targetLength, targetDepth);
    }, [targetShape, targetDiameter, targetWidth, targetLength, targetDepth]);

    // Scaling Multiplier (Area ratio for shallow cakes, Volume ratio for deep breads/bundts)
    const scaleFactor = useMemo(() => {
        if (origGeometry.areaSqIn <= 0) return 1;
        // If pan depths are identical within 0.25", area ratio governs layer thickness directly
        const isStandardLayer = Math.abs(origDepth - targetDepth) <= 0.25;
        if (isStandardLayer) {
            return targetGeometry.areaSqIn / origGeometry.areaSqIn;
        }
        // If depths differ substantially (e.g. loaf pan vs shallow sheet), use 3D volume ratio
        return targetGeometry.volumeCuIn / origGeometry.volumeCuIn;
    }, [origGeometry, targetGeometry, origDepth, targetDepth]);

    // Baking Adjustments Guidance
    const bakingAdvice = useMemo(() => {
        const areaRatio = targetGeometry.areaSqIn / (origGeometry.areaSqIn || 1);
        const depthDiff = targetDepth - origDepth;

        if (Math.abs(areaRatio - 1.0) < 0.05 && Math.abs(depthDiff) < 0.25) {
            return {
                badge: "Direct 1:1 Match",
                tempAdjustment: "No temperature adjustment needed.",
                timeAdjustment: "Keep standard recipe baking time.",
                note: "These pan volumes and surface areas are practically identical.",
                badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
            };
        }

        if (areaRatio > 1.25) {
            return {
                badge: "Larger Pan / Thinner Batter",
                tempAdjustment: "Keep oven temperature identical or raise by 10°F (5°C) if un-scaled.",
                timeAdjustment: "Check for doneness 5 to 10 minutes earlier than stated.",
                note: "With a larger surface area, the batter spreads thinner and bakes through faster.",
                badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200"
            };
        }

        if (areaRatio < 0.8) {
            return {
                badge: "Smaller Pan / Deeper Batter",
                tempAdjustment: "Lower oven temperature by 15°F to 25°F (10°C to 15°C).",
                timeAdjustment: "Extend total baking time by 8 to 15 minutes.",
                note: "Deeper batter requires a lower temperature so the edges don't burn before the center bakes.",
                badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
            };
        }

        return {
            badge: "Moderate Adjustment",
            tempAdjustment: "Maintain prescribed recipe temperature.",
            timeAdjustment: "Begin checking doneness 3 to 5 minutes before the recipe target.",
            note: "Small adjustments to batter depth will slightly shift your target golden-brown window.",
            badgeColor: "bg-slate-100 text-slate-800 border-slate-200"
        };
    }, [origGeometry, targetGeometry, origDepth, targetDepth]);

    const handleSwapPans = () => {
        const tempShape = origShape;
        const tempDia = origDiameter;
        const tempW = origWidth;
        const tempL = origLength;
        const tempD = origDepth;

        setOrigShape(targetShape);
        setOrigDiameter(targetDiameter);
        setOrigWidth(targetWidth);
        setOrigLength(targetLength);
        setOrigDepth(targetDepth);

        setTargetShape(tempShape);
        setTargetDiameter(tempDia);
        setTargetWidth(tempW);
        setTargetLength(tempL);
        setTargetDepth(tempD);
    };

    const handleApplyPreset = (preset: CommonPanPreset, target: "orig" | "target") => {
        if (target === "orig") {
            setOrigShape(preset.shape);
            if (preset.dimsInches.diameter) setOrigDiameter(preset.dimsInches.diameter);
            if (preset.dimsInches.width) setOrigWidth(preset.dimsInches.width);
            if (preset.dimsInches.length) setOrigLength(preset.dimsInches.length);
            setOrigDepth(preset.dimsInches.depth);
        } else {
            setTargetShape(preset.shape);
            if (preset.dimsInches.diameter) setTargetDiameter(preset.dimsInches.diameter);
            if (preset.dimsInches.width) setTargetWidth(preset.dimsInches.width);
            if (preset.dimsInches.length) setTargetLength(preset.dimsInches.length);
            setTargetDepth(preset.dimsInches.depth);
        }
    };

    const handleCopyReport = () => {
        const report = `Baking Pan Conversion & Scaling Summary:
--------------------------------------------------
Original Recipe Pan: ${origShape.toUpperCase()} (${(origShape === "round" || origShape === "springform" || origShape === "bundt") ? `${(origDiameter * displayMultiplier).toFixed(1)}${unit} dia` : `${(origWidth * displayMultiplier).toFixed(1)}x${(origLength * displayMultiplier).toFixed(1)}${unit}`} x ${(origDepth * displayMultiplier).toFixed(1)}${unit})
Original Area: ${unit === "in" ? `${origGeometry.areaSqIn.toFixed(1)} sq in` : `${origGeometry.areaSqCm.toFixed(1)} cm²`} | Volume: ${origGeometry.volumeCups.toFixed(1)} cups (${origGeometry.volumeMl.toFixed(0)} ml)

Destination Pan: ${targetShape.toUpperCase()} (${(targetShape === "round" || targetShape === "springform" || targetShape === "bundt") ? `${(targetDiameter * displayMultiplier).toFixed(1)}${unit} dia` : `${(targetWidth * displayMultiplier).toFixed(1)}x${(targetLength * displayMultiplier).toFixed(1)}${unit}`} x ${(targetDepth * displayMultiplier).toFixed(1)}${unit})
Target Area: ${unit === "in" ? `${targetGeometry.areaSqIn.toFixed(1)} sq in` : `${targetGeometry.areaSqCm.toFixed(1)} cm²`} | Volume: ${targetGeometry.volumeCups.toFixed(1)} cups (${targetGeometry.volumeMl.toFixed(0)} ml)

EXACT RECIPE SCALING MULTIPLIER: ${scaleFactor.toFixed(2)}x
- Baking Temperature: ${bakingAdvice.tempAdjustment}
- Baking Time: ${bakingAdvice.timeAdjustment}
- Baking Guidance: ${bakingAdvice.note}
--------------------------------------------------
Calculated with twistertools.com/tools/home-tools/cake-pan-converter`;

        navigator.clipboard.writeText(report);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Baking Pan Size & Volume Ratio Converter",
        "url": "https://twistertools.com/tools/home-tools/cake-pan-converter",
        "description": "Accurately convert baking pan sizes, calculate surface area and 3D volume ratios, scale recipe ingredients, and adjust oven temperatures for round, square, rectangular, bundt, and springform pans.",
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
                "name": "How do you calculate the recipe scaling multiplier between two cake pans?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For standard cake layers of equal depth (typically 2 inches), recipe ingredients scale directly by the ratio of their surface areas: Target Area divided by Original Recipe Area. For pans with significantly different depths (such as converting a shallow sheet cake to a deep loaf pan), scale by total volume in cubic inches or liquid cups."
                }
            },
            {
                "@type": "Question",
                "name": "Can I substitute an 8-inch square pan for a 9-inch round pan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. A 9-inch round cake pan has an area of 63.6 square inches (holds ~8 cups), while an 8-inch square pan has an area of 64.0 square inches (holds ~8 cups). Their areas differ by less than 1%, making them a seamless 1:1 direct swap with zero ingredient scaling required."
                }
            },
            {
                "@type": "Question",
                "name": "How do I adjust oven temperature and baking time for a smaller or deeper pan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When baking batter deeper in a smaller pan, decrease oven temperature by 25°F (15°C) and increase bake time by 10 to 15 minutes. This gives the deep center enough time to bake thoroughly before the outer edges and crown over-brown or burn."
                }
            },
            {
                "@type": "Question",
                "name": "How do you measure the volume capacity of an irregular or Bundt pan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To measure an irregular baking pan experimentally, place the empty pan on a kitchen scale, tare to zero, and fill it to the brim with water. Every 236.6 grams (or ml) of water equals exactly 1 US cup of capacity. For safe baking without overflow, only fill batter to 2/3 of maximum capacity."
                }
            },
            {
                "@type": "Question",
                "name": "How many 8-inch round layers equal a 9x13-inch quarter sheet cake?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard 9x13-inch pan has a surface area of 117 square inches. One 8-inch round pan has an area of 50.3 square inches. Therefore, a 9x13-inch cake pan requires approximately 2.33 times a single 8-inch round layer recipe, or exactly matches a standard 2-layer 8-inch cake recipe (100.6 sq in total)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Recipe & Target Pan Configurator */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Pan Dimensions & Presets
                            </h2>
                            
                            <div className="flex items-center gap-2">
                                {/* Unit Switcher */}
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => setUnit("in")}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${unit === "in" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Inches (in)
                                    </button>
                                    <button
                                        onClick={() => setUnit("cm")}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${unit === "cm" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Metric (cm)
                                    </button>
                                </div>

                                <button
                                    onClick={handleSwapPans}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                    title="Swap original and target pans"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    Swap
                                </button>
                            </div>
                        </div>

                        {/* SECTION 1: Original Recipe Pan */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black tracking-wider uppercase text-slate-700 flex items-center gap-1.5">
                                    <ChefHat className="w-4 h-4 text-indigo-600" /> 1. Original Recipe Pan
                                </span>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {unit === "in" ? `${origGeometry.areaSqIn.toFixed(1)} sq in` : `${origGeometry.areaSqCm.toFixed(1)} cm²`} ({origGeometry.volumeCups.toFixed(1)} cups)
                                </span>
                            </div>

                            {/* Shape Selector */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                {(["round", "square", "rectangular", "bundt", "springform"] as PanShape[]).map((shape) => (
                                    <button
                                        key={shape}
                                        onClick={() => setOrigShape(shape)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg capitalize border transition cursor-pointer ${origShape === shape
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>

                            {/* Dimension Inputs */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(origShape === "round" || origShape === "springform" || origShape === "bundt") ? (
                                    <div className="col-span-2 sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Diameter ({unit})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="1"
                                            value={Number((origDiameter * displayMultiplier).toFixed(2)) || ""}
                                            onChange={(e) => handleNumberInput(e, (val) => setOrigDiameter(val * lengthMultiplier))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                Width ({unit})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.25"
                                                min="1"
                                                value={Number((origWidth * displayMultiplier).toFixed(2)) || ""}
                                                onChange={(e) => handleNumberInput(e, (val) => setOrigWidth(val * lengthMultiplier))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                        {origShape === "rectangular" && (
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Length ({unit})
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="1"
                                                    value={Number((origLength * displayMultiplier).toFixed(2)) || ""}
                                                    onChange={(e) => handleNumberInput(e, (val) => setOrigLength(val * lengthMultiplier))}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Depth ({unit})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        value={Number((origDepth * displayMultiplier).toFixed(2)) || ""}
                                        onChange={(e) => handleNumberInput(e, (val) => setOrigDepth(val * lengthMultiplier))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets for Original Pan */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 block">Quick Popular Presets:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMMON_PRESETS.slice(0, 4).map((p) => (
                                        <button
                                            key={p.name}
                                            onClick={() => handleApplyPreset(p, "orig")}
                                            className="px-2 py-1 text-[11px] rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer font-medium"
                                        >
                                            {p.name.split(" ")[0]} {p.name.split(" ")[1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Target Destination Pan */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black tracking-wider uppercase text-slate-700 flex items-center gap-1.5">
                                    <Maximize2 className="w-4 h-4 text-indigo-600" /> 2. Target Pan to Bake In
                                </span>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                    {unit === "in" ? `${targetGeometry.areaSqIn.toFixed(1)} sq in` : `${targetGeometry.areaSqCm.toFixed(1)} cm²`} ({targetGeometry.volumeCups.toFixed(1)} cups)
                                </span>
                            </div>

                            {/* Shape Selector */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                {(["round", "square", "rectangular", "bundt", "springform"] as PanShape[]).map((shape) => (
                                    <button
                                        key={shape}
                                        onClick={() => setTargetShape(shape)}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg capitalize border transition cursor-pointer ${targetShape === shape
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>

                            {/* Dimension Inputs */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(targetShape === "round" || targetShape === "springform" || targetShape === "bundt") ? (
                                    <div className="col-span-2 sm:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                            Diameter ({unit})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="1"
                                            value={Number((targetDiameter * displayMultiplier).toFixed(2)) || ""}
                                            onChange={(e) => handleNumberInput(e, (val) => setTargetDiameter(val * lengthMultiplier))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                Width ({unit})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.25"
                                                min="1"
                                                value={Number((targetWidth * displayMultiplier).toFixed(2)) || ""}
                                                onChange={(e) => handleNumberInput(e, (val) => setTargetWidth(val * lengthMultiplier))}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                        {targetShape === "rectangular" && (
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                    Length ({unit})
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="1"
                                                    value={Number((targetLength * displayMultiplier).toFixed(2)) || ""}
                                                    onChange={(e) => handleNumberInput(e, (val) => setTargetLength(val * lengthMultiplier))}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Depth ({unit})
                                    </label>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0.5"
                                        value={Number((targetDepth * displayMultiplier).toFixed(2)) || ""}
                                        onChange={(e) => handleNumberInput(e, (val) => setTargetDepth(val * lengthMultiplier))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                </div>
                            </div>

                            {/* Quick Presets for Target Pan */}
                            <div className="space-y-1.5">
                                <span className="text-[11px] font-semibold text-slate-500 block">Quick Popular Presets:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {COMMON_PRESETS.slice(4, 9).map((p) => (
                                        <button
                                            key={p.name}
                                            onClick={() => handleApplyPreset(p, "target")}
                                            className="px-2 py-1 text-[11px] rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition cursor-pointer font-medium"
                                        >
                                            {p.name.split(" ")[0]} {p.name.split(" ")[1]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <button
                            onClick={() => {
                                setOrigShape("round");
                                setOrigDiameter(9);
                                setOrigDepth(2);
                                setTargetShape("square");
                                setTargetWidth(8);
                                setTargetDepth(2);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                        </button>
                        <button
                            onClick={handleCopyReport}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Report Copied!" : "Copy Conversion Report"}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Scaling Multiplier, Baking Adjustments & Ingredient Playground */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Recipe Multiplier & Baking Dynamics
                            </h2>
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${bakingAdvice.badgeColor}`}>
                                {bakingAdvice.badge}
                            </span>
                        </div>

                        {/* Core Multiplier Highlight Box */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white space-y-4 shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                                    Ingredient Scaling Multiplier
                                </span>
                                <span className="text-xs font-mono text-slate-300">
                                    {targetGeometry.areaSqIn.toFixed(1)} ÷ {origGeometry.areaSqIn.toFixed(1)} sq in
                                </span>
                            </div>

                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl sm:text-5xl font-black text-indigo-300 font-mono tracking-tight">
                                    {scaleFactor.toFixed(2)}x
                                </span>
                                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                                    {scaleFactor > 1
                                        ? `Multiply all original ingredients by ${(scaleFactor).toFixed(2)} (+${Math.round((scaleFactor - 1) * 100)}%)`
                                        : scaleFactor < 1
                                            ? `Multiply all original ingredients by ${(scaleFactor).toFixed(2)} (-${Math.round((1 - scaleFactor) * 100)}%)`
                                            : "Exact 1:1 recipe match. No scaling required."}
                                </span>
                            </div>

                            {/* Comparative Area Bar */}
                            <div className="space-y-1.5 pt-2 border-t border-white/10">
                                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                                    <span>Original Area: {origGeometry.areaSqIn.toFixed(1)} in²</span>
                                    <span>Target Area: {targetGeometry.areaSqIn.toFixed(1)} in²</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-indigo-400 h-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, (targetGeometry.areaSqIn / (origGeometry.areaSqIn + targetGeometry.areaSqIn || 1)) * 100)}%` }}
                                    />
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-300"
                                        style={{ width: `${Math.max(0, 100 - (targetGeometry.areaSqIn / (origGeometry.areaSqIn + targetGeometry.areaSqIn || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Oven & Bake Time Adjustments */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-amber-500" /> Oven Temperature
                                </span>
                                <p className="text-sm font-extrabold text-slate-900">
                                    {bakingAdvice.tempAdjustment}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-indigo-600" /> Baking Duration
                                </span>
                                <p className="text-sm font-extrabold text-slate-900">
                                    {bakingAdvice.timeAdjustment}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Sample Ingredient Scaling Playground */}
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Live Recipe Ingredient Scaler
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">Type to preview scaled grams/cups</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-xs">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Flour (g)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={sampleFlourGrams || ""}
                                        onChange={(e) => handleNumberInput(e, setSampleFlourGrams)}
                                        className="w-full py-1 text-sm font-semibold text-slate-800 outline-none border-b border-slate-200 focus:border-indigo-500"
                                    />
                                    <span className="block mt-1 text-xs font-black text-indigo-600">
                                        → {Math.round(sampleFlourGrams * scaleFactor)} g
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-xs">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Sugar (Cups)</label>
                                    <input
                                        type="number"
                                        step="0.25"
                                        min="0"
                                        value={sampleSugarCups || ""}
                                        onChange={(e) => handleNumberInput(e, setSampleSugarCups)}
                                        className="w-full py-1 text-sm font-semibold text-slate-800 outline-none border-b border-slate-200 focus:border-indigo-500"
                                    />
                                    <span className="block mt-1 text-xs font-black text-indigo-600">
                                        → {(sampleSugarCups * scaleFactor).toFixed(2)} cups
                                    </span>
                                </div>

                                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 shadow-xs">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Whole Eggs</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        value={sampleEggs || ""}
                                        onChange={(e) => handleNumberInput(e, setSampleEggs)}
                                        className="w-full py-1 text-sm font-semibold text-slate-800 outline-none border-b border-slate-200 focus:border-indigo-500"
                                    />
                                    <span className="block mt-1 text-xs font-black text-indigo-600">
                                        → {(sampleEggs * scaleFactor).toFixed(1)} eggs
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Geometric Surface & 3D Volumetric Ratio
                        </span>
                        <span>Direct Batter Height Preservation</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Geometric Foundations & Ratio Mathematics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Surface Area vs. Volumetric Cake Pan Scaling
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting baking pan recipes requires understanding the critical distinction between <strong>surface area scaling</strong> and <strong>volumetric scaling</strong>. For standard layer cakes (where batter depth is kept constant between 1.5 and 2.0 inches), baking chemistry depends almost entirely on bottom surface area. Scaling ingredients proportionally to surface area ensures that the cake layer remains at the exact prescribed thickness, preserving the original baking time and moisture retention.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Circular Pan Formula (Round & Springform)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                For a round pan with diameter $d$ and radius $r = d / 2$:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                Area = π × r² = π × (d / 2)²
                                {"\n"}Volume = Area × depth
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Rectangular & Square Pan Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                For rectangular pans with width $w$, length $l$, and depth $h$:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                Area = width × length
                                {"\n"}Volume = width × length × depth
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Universal Recipe Scaling Factor ($S$)
                        </h3>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                            When converting between any two standard layer pans with equal depth, every ingredient weight (W_original) must be multiplied by the area ratio multiplier S:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300">
                            S = Area(Target Pan) / Area(Original Pan)
                            {"\n"}W_scaled = W_original × S
                        </div>
                    </div>
                </section>

                {/* Card 2: Comprehensive Pan Equivalence Master Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Baking Pan Size, Area, and Volume Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to this industry-standard conversion matrix to find direct 1:1 pan substitutes or exact area ratios across standard American and European bakeware:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Pan Name & Dimensions</th>
                                    <th className="p-3">Surface Area (in²)</th>
                                    <th className="p-3">Surface Area (cm²)</th>
                                    <th className="p-3">Total Volume (Cups)</th>
                                    <th className="p-3">Standard Direct Equivalents</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">8" Round Pan (2" Deep)</td>
                                    <td className="p-3 font-mono">50.3 in²</td>
                                    <td className="p-3 font-mono">324 cm²</td>
                                    <td className="p-3">6.0 Cups (1.4 L)</td>
                                    <td className="p-3">7" Square pan</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/30">
                                    <td className="p-3 font-bold text-slate-900">9" Round Pan (2" Deep)</td>
                                    <td className="p-3 font-mono">63.6 in²</td>
                                    <td className="p-3 font-mono">410 cm²</td>
                                    <td className="p-3 font-bold text-emerald-700">8.0 Cups (1.9 L)</td>
                                    <td className="p-3 font-semibold text-emerald-800">8" Square pan (Direct 1:1 Swap)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">10" Round Pan (2" Deep)</td>
                                    <td className="p-3 font-mono">78.5 in²</td>
                                    <td className="p-3 font-mono">507 cm²</td>
                                    <td className="p-3">10.0 Cups (2.4 L)</td>
                                    <td className="p-3">9" Square pan</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/30">
                                    <td className="p-3 font-bold text-slate-900">8" Square Pan (2" Deep)</td>
                                    <td className="p-3 font-mono">64.0 in²</td>
                                    <td className="p-3 font-mono">413 cm²</td>
                                    <td className="p-3 font-bold text-emerald-700">8.0 Cups (1.9 L)</td>
                                    <td className="p-3 font-semibold text-emerald-800">9" Round pan (Direct 1:1 Swap)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">9" Square Pan (2" Deep)</td>
                                    <td className="p-3 font-mono">81.0 in²</td>
                                    <td className="p-3 font-mono">523 cm²</td>
                                    <td className="p-3">10.0 Cups (2.4 L)</td>
                                    <td className="p-3">10" Round pan / 11x7" Rectangular</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">9x13" Quarter Sheet / Casserole</td>
                                    <td className="p-3 font-mono">117.0 in²</td>
                                    <td className="p-3 font-mono">755 cm²</td>
                                    <td className="p-3">14.0 Cups (3.3 L)</td>
                                    <td className="p-3">Two 8" Round or Two 9" Round pans</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">8.5x4.5" Standard Loaf Pan</td>
                                    <td className="p-3 font-mono">38.3 in²</td>
                                    <td className="p-3 font-mono">247 cm²</td>
                                    <td className="p-3">6.0 Cups (1.4 L)</td>
                                    <td className="p-3">8" Round pan (adjust baking time)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">10" Bundt Pan (12-Cup Capacity)</td>
                                    <td className="p-3 font-mono">62.8 in²</td>
                                    <td className="p-3 font-mono">405 cm²</td>
                                    <td className="p-3">12.0 Cups (2.8 L)</td>
                                    <td className="p-3">9x13" Pan or Two 9" Round pans</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Temperature Adjustments & Baking Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Thermal Physics: Oven Temperature & Doneness Adjustments
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When changing pan geometries without modifying total batter volume, the depth of the raw batter will shift. Batter depth fundamentally changes heat transfer through conductive and convective pathways:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Thicker / Deeper Batter</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When baking in a smaller or deeper pan (e.g., 9" recipe poured into an 8" pan), heat takes longer to reach the center. <strong>Lower oven temperature by 25°F (15°C)</strong> and extend bake time by 10–15 minutes to avoid burning the outer crust.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Thinner / Shallower Batter</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When baking in a larger pan (e.g., pouring an 8" recipe into a 9x13" pan), the increased surface area accelerates moisture evaporation. <strong>Keep temperature identical</strong>, but begin testing with a toothpick 5 to 10 minutes earlier.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">The 2/3 Capacity Safety Rule</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cake batters with chemical leaveners (baking powder/soda) expand by 50% to 100% during the oven-spring phase. Never fill any baking pan past <strong>two-thirds (66%) of its total volume depth</strong> to prevent batter from overflowing into your oven.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Recipe Conversion Walkthrough */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Conversion Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow these practical examples to understand how professional pastry chefs scale artisan formulas across disparate bakeware geometries:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: 9" Round to 9x13" Sheet Cake</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Upscaling</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Original Pan:</strong> 9" Round (Area = π × 4.5² = 63.62 in²).</li>
                                <li><strong>Target Pan:</strong> 9x13" Sheet (Area = 9 × 13 = 117.00 in²).</li>
                                <li><strong>Calculate Ratio:</strong> 117.00 / 63.62 = 1.839.</li>
                                <li><strong>Ingredient Multiplier:</strong> Multiply every recipe ingredient by <strong>1.84x</strong> (or roughly double).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Practical Result: If recipe called for 200g flour, use 200 × 1.84 = 368g flour.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: 9" Round to 8" Round Cake</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Downscaling</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Original Pan:</strong> 9" Round (Area = 63.62 in²).</li>
                                <li><strong>Target Pan:</strong> 8" Round (Area = π × 4² = 50.27 in²).</li>
                                <li><strong>Calculate Ratio:</strong> $50.27 / 63.62 = 0.790$.</li>
                                <li><strong>Ingredient Multiplier:</strong> Multiply all ingredients by <strong>0.79x</strong> (-21% reduction).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Egg Handling: For 2 original eggs ($2 \\times 0.79 = 1.58$), whisk 2 eggs and weigh out 79g of egg liquid.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                How do you calculate the recipe scaling multiplier between two cake pans?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For standard cake layers of equal depth (typically 2 inches), recipe ingredients scale directly by the ratio of their surface areas: <strong>Target Area divided by Original Recipe Area</strong>. For pans with significantly different depths (such as converting a shallow sheet cake to a deep loaf pan), scale by total volume in cubic inches or liquid cups.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I substitute an 8-inch square pan for a 9-inch round pan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. A 9-inch round cake pan has an area of 63.6 square inches (holds ~8 cups), while an 8-inch square pan has an area of 64.0 square inches (holds ~8 cups). Their areas differ by less than 1%, making them a seamless 1:1 direct swap with zero ingredient scaling required.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I adjust oven temperature and baking time for a smaller or deeper pan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When baking batter deeper in a smaller pan, decrease oven temperature by 25°F (15°C) and increase bake time by 10 to 15 minutes. This gives the deep center enough time to bake thoroughly before the outer edges and crown over-brown or burn.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you measure the volume capacity of an irregular or Bundt pan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To measure an irregular baking pan experimentally, place the empty pan on a kitchen scale, tare to zero, and fill it to the brim with water. Every 236.6 grams (or ml) of water equals exactly 1 US cup of capacity. For safe baking without overflow, only fill batter to 2/3 of maximum capacity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many 8-inch round layers equal a 9x13-inch quarter sheet cake?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard 9x13-inch pan has a surface area of 117 square inches. One 8-inch round pan has an area of 50.3 square inches. Therefore, a 9x13-inch cake pan requires approximately 2.33 times a single 8-inch round layer recipe, or exactly matches a standard 2-layer 8-inch cake recipe (100.6 sq in total).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}