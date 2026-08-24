"use client";

import React, { useState, useMemo } from "react";
import {
    Grid3X3,
    Layers,
    DollarSign,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Plus,
    Trash2,
    Calculator,
    PackageCheck,
    Ruler,
    TrendingUp,
    ShieldCheck,
    Boxes,
    FileSpreadsheet,
    Lightbulb
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type PatternComplexity = "straight" | "diagonal" | "herringbone" | "intricate";

interface RoomSection {
    id: string;
    name: string;
    length: number;
    width: number;
}

interface TilePreset {
    label: string;
    widthInches: number;
    heightInches: number;
    widthCm: number;
    heightCm: number;
    coverageSqFt: number;
}

const TILE_PRESETS: TilePreset[] = [
    { label: 'Subway (3" × 6")', widthInches: 3, heightInches: 6, widthCm: 7.6, heightCm: 15.2, coverageSqFt: 0.125 },
    { label: 'Square (12" × 12")', widthInches: 12, heightInches: 12, widthCm: 30.5, heightCm: 30.5, coverageSqFt: 1.0 },
    { label: 'Large Format (12" × 24")', widthInches: 12, heightInches: 24, widthCm: 30.5, heightCm: 61.0, coverageSqFt: 2.0 },
    { label: 'Plank Wood-Look (6" × 36")', widthInches: 6, heightInches: 36, widthCm: 15.2, heightCm: 91.4, coverageSqFt: 1.5 },
    { label: 'XL Porcelain (24" × 24")', widthInches: 24, heightInches: 24, widthCm: 61.0, heightCm: 61.0, coverageSqFt: 4.0 },
    { label: 'Hexagon Mosaic (2" sheet)', widthInches: 12, heightInches: 12, widthCm: 30.5, heightCm: 30.5, coverageSqFt: 1.0 },
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

export default function TileFlooringCalculator() {
    // Unit system
    const [unit, setUnit] = useState<UnitSystem>("imperial");

    // Room sections
    const [rooms, setRooms] = useState<RoomSection[]>([
        { id: "room-1", name: "Main Area", length: 15, width: 12 }
    ]);

    // Tile sizing & packaging
    const [tileWidth, setTileWidth] = useState<number>(12); // inches or cm
    const [tileHeight, setTileHeight] = useState<number>(24); // inches or cm
    const [boxCoverage, setBoxCoverage] = useState<number>(16); // sq ft or sq m per box
    const [useBoxByCount, setUseBoxByCount] = useState<boolean>(false);
    const [tilesPerBox, setTilesPerBox] = useState<number>(8);

    // Waste and Layout
    const [pattern, setPattern] = useState<PatternComplexity>("straight");
    const [customWastePct, setCustomWastePct] = useState<number>(10);
    const [isCustomWaste, setIsCustomWaste] = useState<boolean>(false);

    // Cost Estimation
    const [materialCostPerUnit, setMaterialCostPerUnit] = useState<number>(3.50); // per sq ft or sq m
    const [installationCostPerUnit, setInstallationCostPerUnit] = useState<number>(6.00); // per sq ft or sq m

    // State notification
    const [copied, setCopied] = useState<boolean>(false);

    // Pattern-based waste recommendations
    const patternWasteRates: Record<PatternComplexity, { rate: number; label: string }> = {
        straight: { rate: 10, label: "Straight / Offset (10%)" },
        diagonal: { rate: 15, label: "Diagonal / 45° Angle (15%)" },
        herringbone: { rate: 18, label: "Herringbone / Chevron (18%)" },
        intricate: { rate: 20, label: "Mosaic / Intricate Curves (20%)" },
    };

    const effectiveWastePct = useMemo(() => {
        if (isCustomWaste) return customWastePct;
        return patternWasteRates[pattern].rate;
    }, [isCustomWaste, customWastePct, pattern]);

    // Room Area Management
    const addRoom = () => {
        const newId = `room-${Date.now()}`;
        setRooms((prev) => [...prev, { id: newId, name: `Section ${prev.length + 1}`, length: 10, width: 10 }]);
    };

    const removeRoom = (id: string) => {
        if (rooms.length <= 1) return;
        setRooms((prev) => prev.filter((r) => r.id !== id));
    };

    const updateRoom = (id: string, field: "name" | "length" | "width", val: string | number) => {
        setRooms((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                return { ...r, [field]: val };
            })
        );
    };

    // Calculate core metrics
    const calculation = useMemo(() => {
        const rawNetArea = rooms.reduce((acc, r) => acc + (r.length * r.width), 0);
        const wasteMultiplier = 1 + effectiveWastePct / 100;
        const totalAreaWithWaste = rawNetArea * wasteMultiplier;
        const wasteArea = totalAreaWithWaste - rawNetArea;

        // Individual tile area
        let singleTileArea = 0;
        if (unit === "imperial") {
            // tile dims in inches -> sq ft
            singleTileArea = (tileWidth * tileHeight) / 144;
        } else {
            // tile dims in cm -> sq meters
            singleTileArea = (tileWidth * tileHeight) / 10000;
        }

        const safeSingleTileArea = singleTileArea > 0 ? singleTileArea : 1;
        const totalIndividualTiles = Math.ceil(totalAreaWithWaste / safeSingleTileArea);
        const netIndividualTiles = Math.ceil(rawNetArea / safeSingleTileArea);
        const wasteIndividualTiles = totalIndividualTiles - netIndividualTiles;

        // Box requirements
        let calculatedBoxes = 0;
        let effectiveBoxCoverage = boxCoverage;

        if (useBoxByCount && tilesPerBox > 0) {
            effectiveBoxCoverage = singleTileArea * tilesPerBox;
            calculatedBoxes = Math.ceil(totalIndividualTiles / tilesPerBox);
        } else if (boxCoverage > 0) {
            calculatedBoxes = Math.ceil(totalAreaWithWaste / boxCoverage);
        }

        // Cost modeling
        const totalMaterialCost = totalAreaWithWaste * materialCostPerUnit;
        const totalLaborCost = rawNetArea * installationCostPerUnit;
        const grandTotalCost = totalMaterialCost + totalLaborCost;

        // Alternate Unit Breakdown
        const altNetArea = unit === "imperial" ? rawNetArea * 0.092903 : rawNetArea * 10.7639;
        const altGrossArea = unit === "imperial" ? totalAreaWithWaste * 0.092903 : totalAreaWithWaste * 10.7639;

        return {
            netArea: rawNetArea,
            grossArea: totalAreaWithWaste,
            wasteArea,
            altNetArea,
            altGrossArea,
            singleTileArea,
            totalIndividualTiles,
            netIndividualTiles,
            wasteIndividualTiles,
            boxesNeeded: calculatedBoxes,
            effectiveBoxCoverage,
            materialCost: totalMaterialCost,
            laborCost: totalLaborCost,
            grandTotalCost
        };
    }, [
        rooms,
        effectiveWastePct,
        unit,
        tileWidth,
        tileHeight,
        boxCoverage,
        useBoxByCount,
        tilesPerBox,
        materialCostPerUnit,
        installationCostPerUnit
    ]);

    const handleApplyPreset = (preset: TilePreset) => {
        if (unit === "imperial") {
            setTileWidth(preset.widthInches);
            setTileHeight(preset.heightInches);
            if (!useBoxByCount) {
                setBoxCoverage(parseFloat((preset.coverageSqFt * 10).toFixed(2)));
            }
        } else {
            setTileWidth(preset.widthCm);
            setTileHeight(preset.heightCm);
            if (!useBoxByCount) {
                setBoxCoverage(parseFloat((preset.coverageSqFt * 10 * 0.092903).toFixed(2)));
            }
        }
    };

    const handleReset = () => {
        setUnit("imperial");
        setRooms([{ id: "room-1", name: "Main Area", length: 15, width: 12 }]);
        setTileWidth(12);
        setTileHeight(24);
        setBoxCoverage(16);
        setUseBoxByCount(false);
        setTilesPerBox(8);
        setPattern("straight");
        setIsCustomWaste(false);
        setCustomWastePct(10);
        setMaterialCostPerUnit(3.50);
        setInstallationCostPerUnit(6.00);
    };

    const handleCopySummary = () => {
        const unitSymbol = unit === "imperial" ? "sq ft" : "sq m";
        const lenUnit = unit === "imperial" ? "ft" : "m";
        const tileUnit = unit === "imperial" ? "in" : "cm";

        const roomBreakdown = rooms
            .map((r) => `  - ${r.name}: ${r.length}${lenUnit} × ${r.width}${lenUnit} = ${(r.length * r.width).toFixed(2)} ${unitSymbol}`)
            .join("\n");

        const text = `Flooring & Tile Estimate Breakdown
--------------------------------------------------
Project Net Coverage: ${calculation.netArea.toFixed(2)} ${unitSymbol}
Waste Allowance: +${effectiveWastePct}% (${calculation.wasteArea.toFixed(2)} ${unitSymbol})
Total Material Required: ${calculation.grossArea.toFixed(2)} ${unitSymbol}

Tile Specifications:
- Size: ${tileWidth}${tileUnit} × ${tileHeight}${tileUnit}
- Total Individual Tiles: ${calculation.totalIndividualTiles} units
- Boxes to Order: ${calculation.boxesNeeded} boxes (${calculation.effectiveBoxCoverage.toFixed(2)} ${unitSymbol}/box)

Room Measurements:
${roomBreakdown}

Financial Forecast:
- Material Cost: $${calculation.materialCost.toFixed(2)}
- Labor Estimate: $${calculation.laborCost.toFixed(2)}
- Combined Project Cost: $${calculation.grandTotalCost.toFixed(2)}
--------------------------------------------------
Calculated via twistertools.com/tools/home-tools/tile-flooring-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Flooring & Tile Area Square Footage Estimator",
        "url": "https://twistertools.com/tools/home-tools/tile-flooring-calculator",
        "description": "Calculate exact square footage, dynamic cut waste factors, total tiles, box counts, and material budget estimates for tile, hardwood, and laminate installations.",
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
                "name": "How much tile waste percentage should I calculate for my project?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The industry standard waste factor is 10% for basic straight or offset grid installations. For diagonal (45-degree) layouts, allow 15%. For herringbone or chevron patterns, use 18% to 20%. Intricate mosaic borders, rooms with irregular alcoves, or natural stone with natural shade variation require up to 20% extra to compensate for edge cuts and sorting."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate square footage from room dimensions?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Measure the room length and width in feet. Multiply Length × Width to determine net square footage. For multi-section or L-shaped rooms, split the area into separate rectangular segments, calculate the area of each segment individually, and sum the results."
                }
            },
            {
                "@type": "Question",
                "name": "How do I convert square footage into the total number of boxes to buy?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "First, calculate gross square footage by multiplying your net area by the waste factor (e.g., net sq ft × 1.10). Next, find the square footage coverage specified on the tile box packaging. Divide the gross square footage by the box coverage and always round UP to the nearest whole integer."
                }
            },
            {
                "@type": "Question",
                "name": "Should I keep leftover tile boxes after installation is complete?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Industry professionals strongly recommend retaining at least one full, unopened box (or 10 to 15 spare tiles) from the original manufacturing dye lot. If plumbing repairs or cracked tiles require replacement in the future, matching identical dye lots and kiln calibers from newer batches is virtually impossible."
                }
            },
            {
                "@type": "Question",
                "name": "Does grout joint width affect the number of tiles needed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For standard tile installations with 1/16-inch to 1/8-inch grout joints, the dimensional impact on total tile count is negligible and naturally absorbed by the 10% safety margin. For ultra-wide grout joints (3/8-inch or greater on rustic pavers), grout accounts for 3% to 5% of total surface area, but maintaining standard waste margins remains vital for cut errors."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between net area and gross order area?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Net area is the exact, physical square footage of your floor or wall surface. Gross order area includes the mandatory cut-waste percentage, pattern alignment loss, and breakage contingency needed to successfully finish the job without running short mid-installation."
                }
            }
        ]
    };

    const unitLabel = unit === "imperial" ? "sq ft" : "sq m";
    const dimUnit = unit === "imperial" ? "ft" : "m";
    const tileDimUnit = unit === "imperial" ? "in" : "cm";

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Inputs & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Ruler className="w-5 h-5 text-indigo-600" />
                                Project Dimensions & Layout
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
                                    onClick={() => {
                                        if (unit !== "imperial") {
                                            setUnit("imperial");
                                            setTileWidth(12);
                                            setTileHeight(24);
                                            setBoxCoverage(16);
                                        }
                                    }}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Imperial (Feet & Inches)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (unit !== "metric") {
                                            setUnit("metric");
                                            setTileWidth(30);
                                            setTileHeight(60);
                                            setBoxCoverage(1.5);
                                        }
                                    }}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Metric (Meters & CM)
                                </button>
                            </div>
                        </div>

                        {/* Dynamic Room Sections */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Room Sections & Sub-Areas
                                </label>
                                <button
                                    type="button"
                                    onClick={addRoom}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Section
                                </button>
                            </div>

                            <div className="space-y-3">
                                {rooms.map((room, idx) => (
                                    <div key={room.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <input
                                                type="text"
                                                value={room.name}
                                                onChange={(e) => updateRoom(room.id, "name", e.target.value)}
                                                className="text-xs font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none pb-0.5"
                                            />
                                            {rooms.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoom(room.id)}
                                                    className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                                                    title="Remove section"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Length ({dimUnit})</span>
                                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                                    <input
                                                        type="number"
                                                        min={0.1}
                                                        step={0.5}
                                                        value={room.length === 0 ? "" : room.length}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (raw === "") {
                                                                updateRoom(room.id, "length", 0);
                                                                return;
                                                            }
                                                            const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                            updateRoom(room.id, "length", parseFloat(cleaned) || 0);
                                                        }}
                                                        className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                                    />
                                                    <span className="text-xs font-bold text-slate-400">{dimUnit}</span>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="block text-[11px] font-semibold text-slate-500 mb-1">Width ({dimUnit})</span>
                                                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                                    <input
                                                        type="number"
                                                        min={0.1}
                                                        step={0.5}
                                                        value={room.width === 0 ? "" : room.width}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            if (raw === "") {
                                                                updateRoom(room.id, "width", 0);
                                                                return;
                                                            }
                                                            const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                            updateRoom(room.id, "width", parseFloat(cleaned) || 0);
                                                        }}
                                                        className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                                    />
                                                    <span className="text-xs font-bold text-slate-400">{dimUnit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 pt-1">
                                            <span>Subtotal:</span>
                                            <span className="font-bold text-slate-800">
                                                {(room.length * room.width).toFixed(2)} {unitLabel}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Installation Pattern & Waste Factor */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                <span>Installation Pattern & Waste Factor</span>
                                <span className="text-indigo-600 font-extrabold">{effectiveWastePct}% Contingency</span>
                            </label>

                            <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(patternWasteRates) as PatternComplexity[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setPattern(key);
                                            setIsCustomWaste(false);
                                        }}
                                        className={`p-2.5 text-left rounded-xl border transition text-xs cursor-pointer ${pattern === key && !isCustomWaste
                                            ? "border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-1 ring-indigo-500"
                                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="capitalize font-bold">{key}</div>
                                        <div className="text-[11px] text-slate-500">{patternWasteRates[key].rate}% extra</div>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Waste Override */}
                            <div className="pt-1 flex items-center justify-between text-xs">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                                    <input
                                        type="checkbox"
                                        checked={isCustomWaste}
                                        onChange={(e) => setIsCustomWaste(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Custom waste percentage
                                </label>
                                {isCustomWaste && (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={0}
                                            max={50}
                                            value={customWastePct === 0 ? "" : customWastePct}
                                            onChange={(e) => handleNumberInput(e, setCustomWastePct)}
                                            className="w-16 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="font-bold text-slate-600">%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tile Dimension Specifications */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Grid3X3 className="w-4 h-4 text-indigo-600" />
                                Individual Tile Sizing
                            </label>

                            {/* Quick Presets */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {TILE_PRESETS.slice(0, 6).map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-2 text-left rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 transition text-[11px] cursor-pointer"
                                    >
                                        <p className="font-bold text-slate-800 truncate">{preset.label}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Dimensions */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Tile Width ({tileDimUnit})</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={1}
                                            value={tileWidth === 0 ? "" : tileWidth}
                                            onChange={(e) => handleNumberInput(e, setTileWidth)}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-slate-400">{tileDimUnit}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Tile Length ({tileDimUnit})</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={1}
                                            value={tileHeight === 0 ? "" : tileHeight}
                                            onChange={(e) => handleNumberInput(e, setTileHeight)}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-slate-400">{tileDimUnit}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Packaging and Box Specifications */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Boxes className="w-4 h-4 text-indigo-600" />
                                    Carton / Box Packaging
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setUseBoxByCount(!useBoxByCount)}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                    {useBoxByCount ? "Switch to Sq Area/Box" : "Switch to Tiles/Box"}
                                </button>
                            </div>

                            {useBoxByCount ? (
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Number of Tiles per Box</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={1}
                                            value={tilesPerBox === 0 ? "" : tilesPerBox}
                                            onChange={(e) => handleNumberInput(e, setTilesPerBox)}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-slate-400">tiles/ctn</span>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Coverage Area per Box ({unitLabel})</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <input
                                            type="number"
                                            min={0.1}
                                            step={0.5}
                                            value={boxCoverage === 0 ? "" : boxCoverage}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                    setBoxCoverage(0);
                                                    return;
                                                }
                                                const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                setBoxCoverage(parseFloat(cleaned) || 0);
                                            }}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                        <span className="text-xs font-bold text-slate-400">{unitLabel}/box</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pricing and Labor Modeling */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-indigo-600" />
                                Material & Labor Budget (Optional)
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Tile Price / {unitLabel}</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <span className="text-xs font-bold text-slate-400">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.25}
                                            value={materialCostPerUnit === 0 ? "" : materialCostPerUnit}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                    setMaterialCostPerUnit(0);
                                                    return;
                                                }
                                                const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                setMaterialCostPerUnit(parseFloat(cleaned) || 0);
                                            }}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Labor / {unitLabel}</span>
                                    <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
                                        <span className="text-xs font-bold text-slate-400">$</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.50}
                                            value={installationCostPerUnit === 0 ? "" : installationCostPerUnit}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                if (raw === "") {
                                                    setInstallationCostPerUnit(0);
                                                    return;
                                                }
                                                const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                setInstallationCostPerUnit(parseFloat(cleaned) || 0);
                                            }}
                                            className="w-full text-right font-bold text-slate-900 text-sm outline-none bg-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Includes {effectiveWastePct}% overage calculation
                        </span>
                        <span>Multi-room aggregator</span>
                    </div>
                </div>

                {/* Right Panel: Output Estimation & Bill of Materials */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PackageCheck className="w-5 h-5 text-indigo-600" />
                                Material Order Summary
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                Order Estimate
                            </span>
                        </div>

                        {/* Top Dual Hero Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Total Gross Area */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-4 h-4 text-indigo-600" /> Gross Area
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        +{effectiveWastePct}% Waste
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculation.grossArea.toFixed(1)}
                                    <span className="text-lg font-bold text-slate-600 ml-1">{unitLabel}</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Net Physical: {calculation.netArea.toFixed(1)} {unitLabel} ({calculation.altNetArea.toFixed(1)} {unit === "imperial" ? "sq m" : "sq ft"})
                                </p>
                            </div>

                            {/* Total Boxes to Order */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Boxes className="w-4 h-4 text-indigo-600" /> Boxes to Buy
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        Rounded Up
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculation.boxesNeeded}
                                    <span className="text-lg font-bold text-slate-600 ml-1">boxes</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Covers {calculation.effectiveBoxCoverage.toFixed(1)} {unitLabel}/box
                                </p>
                            </div>
                        </div>

                        {/* Individual Tile Breakdown Banner */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Grid3X3 className="w-4 h-4 text-indigo-600" />
                                    Total Individual Units
                                </span>
                                <span className="text-indigo-600 font-extrabold">{calculation.totalIndividualTiles} Pieces Total</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Net Cut Field</span>
                                    <span className="text-sm font-bold text-slate-800">{calculation.netIndividualTiles}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Waste & Attic</span>
                                    <span className="text-sm font-bold text-amber-600">+{calculation.wasteIndividualTiles}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Single Area</span>
                                    <span className="text-sm font-bold text-slate-800">{calculation.singleTileArea.toFixed(2)} {unitLabel}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Projection Table */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                                <span className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    Estimated Project Budget
                                </span>
                                <span className="text-emerald-600 text-sm font-black">
                                    ${calculation.grandTotalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Material Cost ({calculation.grossArea.toFixed(1)} {unitLabel} @ ${materialCostPerUnit.toFixed(2)}):</span>
                                    <span className="font-semibold text-slate-900">${calculation.materialCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Labor Cost ({calculation.netArea.toFixed(1)} {unitLabel} @ ${installationCostPerUnit.toFixed(2)}):</span>
                                    <span className="font-semibold text-slate-900">${calculation.laborCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5">
                                    <span className="font-bold text-slate-800">Combined Project Total:</span>
                                    <span className="font-bold text-indigo-600">${calculation.grandTotalCost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Professional Tile Setter Directives */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                Contractor Ordering Guidelines
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li><strong>Keep Attic Stock:</strong> Save 1 unopened box of matching dye lots for future tile repairs.</li>
                                <li><strong>Inspect Dye Lot Calibers:</strong> Ensure all purchased boxes share the exact same shade lot ID.</li>
                                <li><strong>Perimeter Expansion:</strong> Maintain a 1/4-inch perimeter gap under baseboards for seasonal expansion.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Copy Summary Action */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            onClick={handleCopySummary}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Estimate Copied to Clipboard!" : "Copy Full Material Estimate"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Pattern Waste Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Recommended Tile Cut Waste Factors by Pattern Layout
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Every tile installation requires cutting full-size pieces along walls, pipes, cabinets, and corners. Because perimeter off-cuts can rarely be reused, applying the correct waste factor ensures you do not run short mid-job.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Layout Pattern</th>
                                    <th className="p-3">Waste %</th>
                                    <th className="p-3">Cut Complexity</th>
                                    <th className="p-3">Best Recommended Use</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Straight / Grid Stack</td>
                                    <td className="p-3 text-emerald-700 font-mono font-bold">10%</td>
                                    <td className="p-3 text-xs text-slate-600">Low (90° cuts only)</td>
                                    <td className="p-3 text-xs">Square rooms, standard ceramic floors</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Running Bond / 1/3 Offset</td>
                                    <td className="p-3 text-emerald-700 font-mono font-bold">10% – 12%</td>
                                    <td className="p-3 text-xs text-slate-600">Low-to-Medium</td>
                                    <td className="p-3 text-xs">Wood-look planks, subway backsplash</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Diagonal (45° Angle)</td>
                                    <td className="p-3 text-indigo-700 font-mono font-bold">15%</td>
                                    <td className="p-3 text-xs text-slate-600">High (Angled triangular cuts)</td>
                                    <td className="p-3 text-xs">Expanding visual space in compact rooms</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Herringbone / Chevron</td>
                                    <td className="p-3 text-indigo-700 font-mono font-bold">18% – 20%</td>
                                    <td className="p-3 text-xs text-slate-600">Very High (Double mitered ends)</td>
                                    <td className="p-3 text-xs">Plank flooring, accent shower walls</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Curved / Irregular Rooms</td>
                                    <td className="p-3 text-rose-700 font-mono font-bold">20%+</td>
                                    <td className="p-3 text-xs text-slate-600">Expert (Pillars, curves, niches)</td>
                                    <td className="p-3 text-xs">Bathrooms with freestanding tubs, turrets</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Mathematical Formulas & Calculation Logic */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Complete Square Footage & Box Estimating Formula
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To accurately calculate your complete material procurement list without falling short or massively over-ordering, contractors rely on a systematic three-stage mathematical sequence:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> 1. Net Room Square Footage
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                For any rectangular room: {"$\\text{Area (sq ft)} = \\text{Length (ft)} \\times \\text{Width (ft)}$"}. For non-rectangular or L-shaped spaces, subdivide the floor plan into individual rectangles ({"$A_1, A_2, \\dots, A_n$"}) and sum them: {"$\\text{Net Area} = \\sum A_i$"}.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> 2. Gross Cut Overage
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Multiply the physical net area by the pattern waste coefficient: {"$\\text{Gross Area} = \\text{Net Area} \\times (1 + \\frac{\\text{Waste \\%}}{100})$"}. For a 200 sq ft room with 15% diagonal waste: {"$200 \\times 1.15 = 230\\text{ sq ft}$"}.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Boxes className="w-4 h-4" /> 3. Carton / Box Rounding Formula
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Tile manufacturers distribute products in sealed cartons of fixed area. Always apply the ceiling function to ensure full carton integrity:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300">
                            {"$$\\text{Boxes to Purchase} = \\left\\lceil \\frac{\\text{Gross Area (sq ft)}}{\\text{Box Coverage (sq ft)}} \\right\\rceil$$"}
                        </div>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Practical Worked Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Worked Project Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how these exact formulas apply to common home renovation scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Master Bathroom Floor (12" × 24" Porcelain)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Diagonal</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Room Dimensions:</strong> 12 ft length × 10 ft width = <strong>120 sq ft</strong> net.</li>
                                <li><strong>Pattern Waste:</strong> Diagonal layout requires <strong>15% waste</strong>.</li>
                                <li><strong>Gross Requirement:</strong> 120 × 1.15 = <strong>138 sq ft</strong>.</li>
                                <li><strong>Packaging:</strong> 16 sq ft per box → 138 / 16 = 8.625 boxes.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Final Order: <strong>9 full boxes</strong> (144 sq ft total) gives 6 sq ft attic spare.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Open Concept Kitchen (6" × 36" Planks)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Herringbone</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Room Dimensions:</strong> 20 ft length × 15 ft width = <strong>300 sq ft</strong> net.</li>
                                <li><strong>Pattern Waste:</strong> Herringbone layout requires <strong>18% waste</strong>.</li>
                                <li><strong>Gross Requirement:</strong> 300 × 1.18 = <strong>354 sq ft</strong>.</li>
                                <li><strong>Packaging:</strong> 18 sq ft per carton → 354 / 18 = 19.66 cartons.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Final Order: <strong>20 full cartons</strong> (360 sq ft total).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Static FAQ Section */}
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
                                How much tile waste percentage should I calculate for my project?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The industry standard waste factor is 10% for basic straight or offset grid installations. For diagonal (45-degree) layouts, allow 15%. For herringbone or chevron patterns, use 18% to 20%. Intricate mosaic borders, rooms with irregular alcoves, or natural stone with natural shade variation require up to 20% extra to compensate for edge cuts and sorting.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate square footage from room dimensions?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Measure the room length and width in feet. Multiply Length × Width to determine net square footage. For multi-section or L-shaped rooms, split the area into separate rectangular segments, calculate the area of each segment individually, and sum the results.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I convert square footage into the total number of boxes to buy?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                First, calculate gross square footage by multiplying your net area by the waste factor (e.g., net sq ft × 1.10). Next, find the square footage coverage specified on the tile box packaging. Divide the gross square footage by the box coverage and always round UP to the nearest whole integer.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I keep leftover tile boxes after installation is complete?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Industry professionals strongly recommend retaining at least one full, unopened box (or 10 to 15 spare tiles) from the original manufacturing dye lot. If plumbing repairs or cracked tiles require replacement in the future, matching identical dye lots and kiln calibers from newer batches is virtually impossible.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does grout joint width affect the number of tiles needed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For standard tile installations with 1/16-inch to 1/8-inch grout joints, the dimensional impact on total tile count is negligible and naturally absorbed by the 10% safety margin. For ultra-wide grout joints (3/8-inch or greater on rustic pavers), grout accounts for 3% to 5% of total surface area, but maintaining standard waste margins remains vital for cut errors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between net area and gross order area?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Net area is the exact, physical square footage of your floor or wall surface. Gross order area includes the mandatory cut-waste percentage, pattern alignment loss, and breakage contingency needed to successfully finish the job without running short mid-installation.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}