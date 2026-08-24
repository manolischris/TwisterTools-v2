"use client";

import React, { useState, useMemo } from "react";
import {
    Paintbrush,
    Layers,
    DollarSign,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    ShieldAlert,
    Gauge,
    SlidersHorizontal,
    Maximize2,
    DoorClosed,
    Square,
    CheckCircle2,
    AlertCircle,
    TrendingDown,
    Droplets,
    PaintBucket,
    Ruler
} from "lucide-react";

type MeasurementUnit = "imperial" | "metric";
type SurfacePorosity = "smooth" | "standard" | "rough" | "unprimed";
type PaintSheen = "flat" | "eggshell" | "satin" | "semi-gloss" | "high-gloss";

interface RoomDimensionPreset {
    name: string;
    length: number;
    width: number;
    height: number;
    doors: number;
    windows: number;
    description: string;
}

const ROOM_PRESETS: RoomDimensionPreset[] = [
    { name: "Small Bedroom / Nursery", length: 10, width: 10, height: 8, doors: 1, windows: 1, description: "100 sq ft floor, 8 ft ceiling" },
    { name: "Standard Master Bedroom", length: 14, width: 16, height: 9, doors: 2, windows: 2, description: "224 sq ft floor, 9 ft ceiling" },
    { name: "Living Room / Great Room", length: 18, width: 22, height: 10, doors: 2, windows: 4, description: "396 sq ft floor, 10 ft ceiling" },
    { name: "Powder Room / Half Bath", length: 5, width: 7, height: 8, doors: 1, windows: 0, description: "35 sq ft floor, standard bath" },
    { name: "Double Garage Interior", length: 20, width: 22, height: 9, doors: 3, windows: 1, description: "440 sq ft drywall & trim" },
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

export default function PaintCoverageCalculator() {
    // Unit system
    const [unit, setUnit] = useState<MeasurementUnit>("imperial");

    // Room Dimensions
    const [length, setLength] = useState<number>(14);
    const [width, setWidth] = useState<number>(16);
    const [height, setHeight] = useState<number>(9);

    // Openings & Deductions
    const [doorsCount, setDoorsCount] = useState<number>(2);
    const [doorWidth, setDoorWidth] = useState<number>(3);
    const [doorHeight, setDoorHeight] = useState<number>(7);

    const [windowsCount, setWindowsCount] = useState<number>(2);
    const [windowWidth, setWindowWidth] = useState<number>(3);
    const [windowHeight, setWindowHeight] = useState<number>(4);

    // Paint Options
    const [coats, setCoats] = useState<number>(2);
    const [includeCeiling, setIncludeCeiling] = useState<boolean>(false);
    const [ceilingCoats, setCeilingCoats] = useState<number>(1);
    const [surfaceTexture, setSurfaceTexture] = useState<SurfacePorosity>("standard");
    const [sheen, setSheen] = useState<PaintSheen>("satin");
    const [pricePerGallon, setPricePerGallon] = useState<number>(45);

    // Custom Coverage Override
    const [isCustomCoverage, setIsCustomCoverage] = useState<boolean>(false);
    const [customSpreadRate, setCustomSpreadRate] = useState<number>(350);

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Baseline Spread Rate Calculation (sq ft per gallon or m² per liter)
    const effectiveSpreadRate = useMemo(() => {
        if (isCustomCoverage) return customSpreadRate;

        // Base rate in Imperial (sq ft / gallon)
        let base = 350;
        if (surfaceTexture === "smooth") base = 400;
        if (surfaceTexture === "standard") base = 350;
        if (surfaceTexture === "rough") base = 275;
        if (surfaceTexture === "unprimed") base = 250;

        // Metric conversion: 1 gallon = 3.78541 L, 1 sq m = 10.7639 sq ft
        // ~350 sq ft/gal = 8.59 sq m/L
        return unit === "imperial" ? base : +(base * 0.02454).toFixed(2);
    }, [isCustomCoverage, customSpreadRate, surfaceTexture, unit]);

    // Quantitative Calculation Matrix
    const calculation = useMemo(() => {
        // Wall Gross Area
        const wallPerimeter = 2 * (length + width);
        const grossWallArea = wallPerimeter * height;

        // Openings Deductions
        const singleDoorArea = doorWidth * doorHeight;
        const singleWindowArea = windowWidth * windowHeight;
        const totalDoorArea = doorsCount * singleDoorArea;
        const totalWindowArea = windowsCount * singleWindowArea;
        const totalDeductionArea = totalDoorArea + totalWindowArea;

        // Net Wall Area
        const netWallArea = Math.max(0, grossWallArea - totalDeductionArea);
        const wallAreaWithCoats = netWallArea * coats;

        // Ceiling Area
        const ceilingArea = includeCeiling ? length * width : 0;
        const ceilingAreaWithCoats = ceilingArea * ceilingCoats;

        // Combined Total Paintable Surface
        const totalPaintArea = wallAreaWithCoats + ceilingAreaWithCoats;

        // 10% Waste & Cut-in Safety Margin
        const wasteFactor = 1.10;
        const totalAreaWithWaste = totalPaintArea * wasteFactor;

        // Liquid Volume Calculation
        let rawGallons = 0;
        let rawLiters = 0;

        if (unit === "imperial") {
            rawGallons = totalAreaWithWaste / effectiveSpreadRate;
            rawLiters = rawGallons * 3.78541;
        } else {
            rawLiters = totalAreaWithWaste / effectiveSpreadRate;
            rawGallons = rawLiters / 3.78541;
        }

        // Purchasing Breakdown (Gallons vs Quarts / 5-Gal Pails)
        const wholeGallonsToBuy = Math.ceil(rawGallons);
        const fiveGallonPails = Math.floor(rawGallons / 5);
        const remainingGallons = rawGallons % 5;
        const individualGallons = Math.ceil(remainingGallons);

        // Quarts breakdown for small touch-ups
        const wholeQuarts = Math.ceil(rawGallons * 4);

        // Cost Estimates
        const estimatedPaintCost = wholeGallonsToBuy * pricePerGallon;
        const primerNeededGallons = Math.ceil((netWallArea + ceilingArea) / (unit === "imperial" ? 300 : 7.36));
        const estimatedPrimerCost = primerNeededGallons * (pricePerGallon * 0.65);

        return {
            grossWallArea,
            totalDeductionArea,
            netWallArea,
            ceilingArea,
            totalPaintArea,
            totalAreaWithWaste,
            rawGallons,
            rawLiters,
            wholeGallonsToBuy,
            fiveGallonPails,
            individualGallons,
            wholeQuarts,
            estimatedPaintCost,
            primerNeededGallons,
            estimatedPrimerCost,
        };
    }, [
        length,
        width,
        height,
        doorsCount,
        doorWidth,
        doorHeight,
        windowsCount,
        windowWidth,
        windowHeight,
        coats,
        includeCeiling,
        ceilingCoats,
        effectiveSpreadRate,
        pricePerGallon,
        unit,
    ]);

    const handleApplyPreset = (preset: RoomDimensionPreset) => {
        if (unit === "imperial") {
            setLength(preset.length);
            setWidth(preset.width);
            setHeight(preset.height);
            setDoorWidth(3);
            setDoorHeight(7);
            setWindowWidth(3);
            setWindowHeight(4);
        } else {
            // Convert feet to meters
            setLength(+(preset.length * 0.3048).toFixed(1));
            setWidth(+(preset.width * 0.3048).toFixed(1));
            setHeight(+(preset.height * 0.3048).toFixed(1));
            setDoorWidth(0.9);
            setDoorHeight(2.1);
            setWindowWidth(0.9);
            setWindowHeight(1.2);
        }
        setDoorsCount(preset.doors);
        setWindowsCount(preset.windows);
    };

    const handleUnitSwitch = (newUnit: MeasurementUnit) => {
        if (newUnit === unit) return;
        if (newUnit === "metric") {
            setLength(+(length * 0.3048).toFixed(2));
            setWidth(+(width * 0.3048).toFixed(2));
            setHeight(+(height * 0.3048).toFixed(2));
            setDoorWidth(+(doorWidth * 0.3048).toFixed(2));
            setDoorHeight(+(doorHeight * 0.3048).toFixed(2));
            setWindowWidth(+(windowWidth * 0.3048).toFixed(2));
            setWindowHeight(+(windowHeight * 0.3048).toFixed(2));
            setCustomSpreadRate(+(customSpreadRate * 0.02454).toFixed(2));
        } else {
            setLength(+(length / 0.3048).toFixed(1));
            setWidth(+(width / 0.3048).toFixed(1));
            setHeight(+(height / 0.3048).toFixed(1));
            setDoorWidth(+(doorWidth / 0.3048).toFixed(1));
            setDoorHeight(+(doorHeight / 0.3048).toFixed(1));
            setWindowWidth(+(windowWidth / 0.3048).toFixed(1));
            setWindowHeight(+(windowHeight / 0.3048).toFixed(1));
            setCustomSpreadRate(+(customSpreadRate / 0.02454).toFixed(0));
        }
        setUnit(newUnit);
    };

    const handleReset = () => {
        setUnit("imperial");
        setLength(14);
        setWidth(16);
        setHeight(9);
        setDoorsCount(2);
        setDoorWidth(3);
        setDoorHeight(7);
        setWindowsCount(2);
        setWindowWidth(3);
        setWindowHeight(4);
        setCoats(2);
        setIncludeCeiling(false);
        setCeilingCoats(1);
        setSurfaceTexture("standard");
        setSheen("satin");
        setPricePerGallon(45);
        setIsCustomCoverage(false);
        setCustomSpreadRate(350);
    };

    const handleCopySummary = () => {
        const text = `TwisterTools Paint Coverage Calculation:
---------------------------------------------
Room Dimensions: ${length} x ${width} x ${height} ${unit === "imperial" ? "ft" : "m"}
Surface Area (Net Walls): ${calculation.netWallArea.toFixed(1)} ${unit === "imperial" ? "sq ft" : "m²"}
${includeCeiling ? `Ceiling Area: ${calculation.ceilingArea.toFixed(1)} ${unit === "imperial" ? "sq ft" : "m²"}\n` : ""}Total Paint Surface (${coats} coats + 10% reserve): ${calculation.totalAreaWithWaste.toFixed(1)} ${unit === "imperial" ? "sq ft" : "m²"}
Recommended Paint Purchase:
- US Gallons: ${calculation.wholeGallonsToBuy} gal (${calculation.rawGallons.toFixed(2)} exact)
- Liters: ${calculation.rawLiters.toFixed(2)} L
- 5-Gal Pails + Gallons: ${calculation.fiveGallonPails > 0 ? `${calculation.fiveGallonPails}x 5-gal bucket + ` : ""}${calculation.individualGallons}x 1-gal cans
- Estimated Paint Cost: $${calculation.estimatedPaintCost.toFixed(2)} (at $${pricePerGallon}/gal)
---------------------------------------------
Generated via twistertools.com/tools/home-tools/paint-coverage-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const areaUnitLabel = unit === "imperial" ? "sq ft" : "m²";
    const dimUnitLabel = unit === "imperial" ? "ft" : "m";

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Wall Paint Coverage & Gallon Volume Estimator",
        "url": "https://twistertools.com/tools/home-tools/paint-coverage-calculator",
        "description": "Calculate precise paint gallons, liters, wall surface square footage, and project material costs with custom window and door cutouts.",
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
                "name": "How many square feet does one gallon of paint cover?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As an industry standard, one gallon of interior architectural paint covers approximately 350 to 400 square feet on smooth, primed drywall. Unprimed, textured, or porous surfaces (like stucco or raw wood) reduce spread rates down to 250 to 300 square feet per gallon."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I always apply two coats of paint instead of one?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Even with premium 'one-coat guarantee' paints, applying two coats ensures uniform film thickness, hides roller lap marks, creates true color saturation, and significantly improves washability and scuff resistance over time."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate paint deductions for doors and windows?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard interior door measures 3 ft by 7 ft (21 sq ft) and a standard window averages 3 ft by 4 ft (12 sq ft). Multiply the height by width of each opening and subtract the total area from the gross room wall perimeter area."
                }
            },
            {
                "@type": "Question",
                "name": "How much extra paint should I factor in for waste and cut-ins?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Professional painters include a 10% contingency buffer. This accounts for roller nap absorption, brush cut-in overlap along baseboards and crowns, surface texture absorption, and leaves a small amount for future wall touch-ups."
                }
            },
            {
                "@type": "Question",
                "name": "When is a dedicated primer coat required before painting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Primer is essential when painting over raw unprimed drywall, fresh plaster patches, glossy enamel sheens, smoke or water stains, bare wood, or when making extreme color transitions (e.g., dark navy to white)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between paint sheens (Flat, Eggshell, Satin, Semi-Gloss)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sheen dictates light reflectivity and durability. Flat/Matte hides drywall imperfections best (ideal for ceilings and master bedrooms). Eggshell and Satin provide a soft balance of durability and low shine (ideal for living rooms and hallways). Semi-Gloss and High-Gloss resist moisture and scrubbing (ideal for bathrooms, kitchens, and baseboards)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Dimensions & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Reset */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-indigo-600" />
                                Room Dimensions & Specs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Measurement System Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement System
                            </label>
                            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitSwitch("imperial")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Imperial (Feet, Gallons, Sq Ft)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitSwitch("metric")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Metric (Meters, Liters, M²)
                                </button>
                            </div>
                        </div>

                        {/* Room Dimensions Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Maximize2 className="w-4 h-4 text-indigo-600" />
                                Wall Perimeter & Ceiling Height
                            </span>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Length ({dimUnitLabel})</label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={unit === "imperial" ? 1 : 0.1}
                                        value={length === 0 ? "" : length}
                                        onChange={(e) => handleNumberInput(e, setLength)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Width ({dimUnitLabel})</label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={unit === "imperial" ? 1 : 0.1}
                                        value={width === 0 ? "" : width}
                                        onChange={(e) => handleNumberInput(e, setWidth)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Height ({dimUnitLabel})</label>
                                    <input
                                        type="number"
                                        min={1}
                                        step={unit === "imperial" ? 1 : 0.1}
                                        value={height === 0 ? "" : height}
                                        onChange={(e) => handleNumberInput(e, setHeight)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Doors & Windows Deductions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Doors */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <DoorClosed className="w-4 h-4 text-indigo-600" />
                                        Doors Deductions
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={doorsCount === 0 ? "" : doorsCount}
                                            onChange={(e) => handleNumberInput(e, setDoorsCount)}
                                            className="w-14 px-2 py-1 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-500 font-semibold">doors</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-0.5">Width ({dimUnitLabel})</span>
                                        <input
                                            type="number"
                                            value={doorWidth === 0 ? "" : doorWidth}
                                            onChange={(e) => handleNumberInput(e, setDoorWidth)}
                                            className="w-full px-2 py-1 font-semibold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-0.5">Height ({dimUnitLabel})</span>
                                        <input
                                            type="number"
                                            value={doorHeight === 0 ? "" : doorHeight}
                                            onChange={(e) => handleNumberInput(e, setDoorHeight)}
                                            className="w-full px-2 py-1 font-semibold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Windows */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Square className="w-4 h-4 text-indigo-600" />
                                        Windows Deductions
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            value={windowsCount === 0 ? "" : windowsCount}
                                            onChange={(e) => handleNumberInput(e, setWindowsCount)}
                                            className="w-14 px-2 py-1 text-center font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-xs text-slate-500 font-semibold">windows</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-0.5">Width ({dimUnitLabel})</span>
                                        <input
                                            type="number"
                                            value={windowWidth === 0 ? "" : windowWidth}
                                            onChange={(e) => handleNumberInput(e, setWindowWidth)}
                                            className="w-full px-2 py-1 font-semibold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[11px] text-slate-500 block mb-0.5">Height ({dimUnitLabel})</span>
                                        <input
                                            type="number"
                                            value={windowHeight === 0 ? "" : windowHeight}
                                            onChange={(e) => handleNumberInput(e, setWindowHeight)}
                                            className="w-full px-2 py-1 font-semibold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Room Size Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Instant Room Template Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {ROOM_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-2 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs cursor-pointer group"
                                    >
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{preset.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Paint Coats, Ceiling & Surface Texture */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                        <span>Wall Paint Coats</span>
                                        <span className="text-indigo-600 font-extrabold">{coats} Coats</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg">
                                        {[1, 2, 3].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setCoats(num)}
                                                className={`py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${coats === num ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                            >
                                                {num} {num === 1 ? "Coat" : "Coats"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Wall Texture / Porosity
                                    </label>
                                    <select
                                        value={surfaceTexture}
                                        onChange={(e) => setSurfaceTexture(e.target.value as SurfacePorosity)}
                                        className="w-full px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="smooth">Smooth Drywall (400 sq ft/gal)</option>
                                        <option value="standard">Standard Eggshell/Drywall (350 sq ft/gal)</option>
                                        <option value="rough">Textured / Orange Peel (275 sq ft/gal)</option>
                                        <option value="unprimed">Raw Unprimed Masonry / Drywall (250 sq ft/gal)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Ceiling Toggle */}
                            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={includeCeiling}
                                        onChange={(e) => setIncludeCeiling(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    Include Ceiling in Paint Volume
                                </label>
                                {includeCeiling && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 font-semibold">Ceiling Coats:</span>
                                        <select
                                            value={ceilingCoats}
                                            onChange={(e) => setCeilingCoats(Number(e.target.value))}
                                            className="px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-md"
                                        >
                                            <option value={1}>1 Coat</option>
                                            <option value={2}>2 Coats</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pricing & Custom Spread Rate */}
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <button
                                type="button"
                                onClick={() => setIsCustomCoverage(!isCustomCoverage)}
                                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {isCustomCoverage ? "Custom Paint Spread Rate (Active)" : "Customize Coverage Spread Rate & Gallon Price"}
                                </span>
                                <span>{isCustomCoverage ? "Hide" : "Show"}</span>
                            </button>

                            {isCustomCoverage && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span className="font-semibold text-slate-700 block mb-1">Spread Rate ({areaUnitLabel}/{unit === "imperial" ? "gal" : "L"}):</span>
                                        <input
                                            type="number"
                                            value={customSpreadRate === 0 ? "" : customSpreadRate}
                                            onChange={(e) => handleNumberInput(e, setCustomSpreadRate)}
                                            className="w-full px-2 py-1 font-bold text-slate-800 bg-white border border-slate-300 rounded"
                                        />
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-700 block mb-1">Cost Per Gallon ($):</span>
                                        <input
                                            type="number"
                                            value={pricePerGallon === 0 ? "" : pricePerGallon}
                                            onChange={(e) => handleNumberInput(e, setPricePerGallon)}
                                            className="w-full px-2 py-1 font-bold text-slate-800 bg-white border border-slate-300 rounded"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Spread: {effectiveSpreadRate} {areaUnitLabel}/{unit === "imperial" ? "gal" : "L"} (incl. 10% reserve)
                        </span>
                        <span>Architectural Formula</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Paint Volume Estimation Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PaintBucket className="w-5 h-5 text-indigo-600" />
                                Recommended Paint Purchase
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                                Exact Math
                            </span>
                        </div>

                        {/* Big Hero Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Gallons Container */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <PaintBucket className="w-4 h-4 text-indigo-600" /> US Gallons Needed
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {calculation.rawGallons.toFixed(2)} Exact
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculation.wholeGallonsToBuy} <span className="text-lg font-bold text-slate-600">Gallons</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Or approx. {calculation.wholeQuarts} Quarts total
                                </p>
                            </div>

                            {/* Liters Container */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Droplets className="w-4 h-4 text-indigo-600" /> Metric Volume
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        Metric Equiv
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculation.rawLiters.toFixed(1)} <span className="text-lg font-bold text-slate-600">Liters</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    ≈ {Math.ceil(calculation.rawLiters / 2.5)} standard 2.5L cans
                                </p>
                            </div>
                        </div>

                        {/* Store Purchasing Recommendation Breakdown */}
                        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block">
                                Recommended Hardware Store Order
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1">
                                    <span className="text-slate-500 font-semibold block">Retail Container Strategy:</span>
                                    <p className="font-extrabold text-slate-900 text-sm">
                                        {calculation.fiveGallonPails > 0 ? (
                                            <>
                                                {calculation.fiveGallonPails}x 5-Gallon Pail{calculation.fiveGallonPails > 1 ? "s" : ""}
                                                {calculation.individualGallons > 0 && ` + ${calculation.individualGallons}x 1-Gallon Can${calculation.individualGallons > 1 ? "s" : ""}`}
                                            </>
                                        ) : (
                                            `${calculation.wholeGallonsToBuy}x 1-Gallon Can${calculation.wholeGallonsToBuy > 1 ? "s" : ""}`
                                        )}
                                    </p>
                                </div>

                                <div className="p-3 bg-white border border-indigo-100 rounded-lg space-y-1">
                                    <span className="text-slate-500 font-semibold block">Est. Material Cost:</span>
                                    <p className="font-extrabold text-emerald-700 text-sm">
                                        ${calculation.estimatedPaintCost.toFixed(2)}
                                        <span className="text-xs text-slate-400 font-normal ml-1">(@${pricePerGallon}/gal)</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Surface Area Calculation Transparency Breakdown */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Surface Breakdown & Geometric Deductions
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Gross Walls</span>
                                    <strong className="text-slate-800">{calculation.grossWallArea.toFixed(1)}</strong>
                                    <span className="text-[10px] text-slate-400 block">{areaUnitLabel}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Cutout Deductions</span>
                                    <strong className="text-rose-600">-{calculation.totalDeductionArea.toFixed(1)}</strong>
                                    <span className="text-[10px] text-slate-400 block">{areaUnitLabel}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Net Paint Wall</span>
                                    <strong className="text-indigo-600">{calculation.netWallArea.toFixed(1)}</strong>
                                    <span className="text-[10px] text-slate-400 block">{areaUnitLabel}</span>
                                </div>
                                <div className="p-2 bg-white rounded-lg border border-slate-200">
                                    <span className="text-slate-400 text-[10px] block uppercase font-bold">Total With {coats} Coats</span>
                                    <strong className="text-emerald-700">{calculation.totalAreaWithWaste.toFixed(1)}</strong>
                                    <span className="text-[10px] text-slate-400 block">{areaUnitLabel}</span>
                                </div>
                            </div>
                        </div>

                        {/* Professional Primer Advisory Banner */}
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                                <Layers className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold text-amber-900 uppercase tracking-wider">
                                    Primer Recommendation ({calculation.primerNeededGallons} Gal needed if unprimed)
                                </p>
                                <p className="text-amber-800 leading-relaxed">
                                    If painting over fresh drywall patches, drastic color transitions, or stained drywall, apply 1 coat of sealing PVA primer prior to your 2 finish coats to avoid uneven roller flashing.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Copy Action Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Paint Estimate Copied!" : "Copy Full Project Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Sheen Guide Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Paintbrush className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Paint Sheen & Finish Selection Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct paint sheen is just as important as calculating your gallon volume. Sheen directly dictates light reflectivity, durability against scrubbing, moisture resistance, and how easily surface drywall imperfections are concealed.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Sheen Level</th>
                                    <th className="p-3">Reflectivity</th>
                                    <th className="p-3">Durability & Washability</th>
                                    <th className="p-3">Best Room Application</th>
                                    <th className="p-3">Imperfection Hiding</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Flat / Matte</td>
                                    <td className="p-3 text-slate-500">0% – 5%</td>
                                    <td className="p-3 text-amber-600 font-semibold">Low (Clean with dry cloth)</td>
                                    <td className="p-3 text-xs">Ceilings, master bedrooms, low-traffic formal rooms</td>
                                    <td className="p-3 font-bold text-emerald-600">Highest (Flawless)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Eggshell</td>
                                    <td className="p-3 text-slate-500">10% – 25%</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Moderate (Wipeable)</td>
                                    <td className="p-3 text-xs">Living rooms, dining rooms, guest bedrooms</td>
                                    <td className="p-3 font-bold text-emerald-600">Very High</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Satin</td>
                                    <td className="p-3 text-slate-500">25% – 35%</td>
                                    <td className="p-3 text-emerald-600 font-semibold">High (Resists stains & moisture)</td>
                                    <td className="p-3 text-xs">Hallways, kids' rooms, family rooms, foyers</td>
                                    <td className="p-3 font-bold text-amber-600">Moderate</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Semi-Gloss</td>
                                    <td className="p-3 text-slate-500">35% – 60%</td>
                                    <td className="p-3 text-emerald-700 font-semibold">Very High (Scrubbable)</td>
                                    <td className="p-3 text-xs">Kitchens, bathrooms, baseboards, doors, window trim</td>
                                    <td className="p-3 font-bold text-rose-600">Low (Shows dents)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">High-Gloss</td>
                                    <td className="p-3 text-slate-500">70%+</td>
                                    <td className="p-3 text-emerald-800 font-semibold">Extreme (Commercial grade)</td>
                                    <td className="p-3 text-xs">Cabinets, architectural moldings, exterior front doors</td>
                                    <td className="p-3 font-bold text-rose-700">Lowest (Reflects all flaws)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Paint Coverage Mathematics & Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematics of Paint Spread Rates & Film Thickness
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Professional architectural coatings rely on wet film thickness (WFT) and dry film thickness (DFT) to establish proper coverage. Understanding the underlying arithmetic ensures you purchase the exact quantity without stalling your project midway:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Wet Film Thickness (WFT)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Standard latex wall paint is applied at a wet film thickness of approximately 4.0 mils (0.004 inches). One US gallon contains 231 cubic inches ({"$0.1337\\text{ ft}^3$"}). Spreading 1 gallon at 4 mils yields theoretically {"$400.9\\text{ sq ft}$"} of flawless coverage.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-indigo-600" /> Dry Film Solids & Volume Loss
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Premium acrylic paints consist of 35% to 45% solids by volume; the remaining water and solvents evaporate during the curing cycle. A 4.0 mil wet application cures into a durable 1.4 to 1.8 mil dry protective film barrier.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Ruler className="w-4 h-4" /> The Master Wall Surface Equation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To calculate net paintable wall surface area:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300">
                            {"$$\\text{Net Area} = \\left[ 2 \\times (\\text{Length} + \\text{Width}) \\times \\text{Height} \\right] - \\sum (\\text{Door Area} + \\text{Window Area})$$"}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            Then, factor the 10% contingency and apply coats:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300">
                            {"$$\\text{Gallons Needed} = \\frac{\\left( \\text{Net Area} \\times \\text{Coats} \\right) \\times 1.10}{\\text{Spread Rate (sq ft / gal)}}$$"}
                        </div>
                    </div>
                </section>

                {/* Card 3: Professional Step-by-Step Room Walkthroughs */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Estimation Examples: Real-World Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how these calculations play out in two standard residential remodeling scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Master Bedroom (14' x 16' x 9')</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">2 Coats Walls</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Perimeter:</strong> {"$2 \\times (14 + 16) = 60\\text{ ft}$"}.</li>
                                <li><strong>Gross Wall Area:</strong> {"$60\\text{ ft} \\times 9\\text{ ft} = 540\\text{ sq ft}$"}.</li>
                                <li><strong>Deductions:</strong> 2 Doors (42 sq ft) + 2 Windows (24 sq ft) = <strong>-66 sq ft</strong>.</li>
                                <li><strong>Net Wall Area:</strong> {"$540 - 66 = 474\\text{ sq ft}$"}.</li>
                                <li><strong>Total with 2 Coats + 10%:</strong> {"$474 \\times 2 \\times 1.10 = \\mathbf{1,042.8\\text{ sq ft}}$"}.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Purchase Target: 3 Gallons (Exact: 2.98 gal at 350 sq ft/gal).
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Powder Bathroom (5' x 7' x 8')</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Walls + Ceiling</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Gross Walls:</strong> {"$2 \\times (5 + 7) \\times 8 = 192\\text{ sq ft}$"}.</li>
                                <li><strong>Deductions:</strong> 1 Door (21 sq ft) = <strong>-21 sq ft</strong>.</li>
                                <li><strong>Net Walls (2 Coats):</strong> {"$171 \\times 2 = 342\\text{ sq ft}$"}.</li>
                                <li><strong>Ceiling (1 Coat):</strong> {"$5 \\times 7 = 35\\text{ sq ft}$"}.</li>
                                <li><strong>Total with 10% Reserve:</strong> {"$(342 + 35) \\times 1.10 = \\mathbf{414.7\\text{ sq ft}}$"}.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Purchase Target: 2 Gallons (or 1 Gal Wall Paint + 1 Qt Ceiling Paint).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Equipment, Rollers & Prep Essentials */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Roller Nap Thickness & Tool Checklist
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Matching the roller sleeve nap (thickness of the woven cover) to your wall substrate is essential to achieving rated manufacturer spread rates without excessive spatter:
                    </p>

                    <div className="grid sm:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">1/4" to 3/8" Nap</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Substrate:</strong> Smooth drywall, doors, ceilings, and metal trim. Delivers the smoothest, stipple-free finish.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">1/2" Nap (Most Popular)</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Substrate:</strong> Standard residential drywall with light orange peel or knockdown texture. Holds ample paint.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <span className="font-bold text-slate-900 text-sm block">3/4" to 1" Nap</span>
                            <p className="text-slate-600 leading-relaxed">
                                <strong>Substrate:</strong> Heavy masonry, unprimed brick, cinder block, and exterior stucco surfaces.
                            </p>
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
                                How many square feet does one gallon of paint cover?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As an industry standard, one gallon of interior architectural paint covers approximately 350 to 400 square feet on smooth, primed drywall. Unprimed, textured, or porous surfaces (like stucco or raw wood) reduce spread rates down to 250 to 300 square feet per gallon.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I always apply two coats of paint instead of one?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Even with premium "one-coat guarantee" paints, applying two coats ensures uniform film thickness, hides roller lap marks, creates true color saturation, and significantly improves washability and scuff resistance over time.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate paint deductions for doors and windows?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard interior door measures 3 ft by 7 ft (21 sq ft) and a standard window averages 3 ft by 4 ft (12 sq ft). Multiply the height by width of each opening and subtract the total area from the gross room wall perimeter area.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much extra paint should I factor in for waste and cut-ins?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Professional painters include a 10% contingency buffer. This accounts for roller nap absorption, brush cut-in overlap along baseboards and crowns, surface texture absorption, and leaves a small amount for future wall touch-ups.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is a dedicated primer coat required before painting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Primer is essential when painting over raw unprimed drywall, fresh plaster patches, glossy enamel sheens, smoke or water stains, bare wood, or when making extreme color transitions (e.g., dark navy to white).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between paint sheens (Flat, Eggshell, Satin, Semi-Gloss)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sheen dictates light reflectivity and durability. Flat/Matte hides drywall imperfections best (ideal for ceilings and master bedrooms). Eggshell and Satin provide a soft balance of durability and low shine (ideal for living rooms and hallways). Semi-Gloss and High-Gloss resist moisture and scrubbing (ideal for bathrooms, kitchens, and baseboards).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}