"use client";

import React, { useState, useMemo } from "react";
import {
    ScrollText,
    Calculator,
    Layers,
    Scissors,
    Ruler,
    DollarSign,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    AlertCircle,
    Plus,
    Trash2,
    CheckCircle2,
    Lightbulb,
    Boxes,
    Compass,
    Grid,
    Paintbrush
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type RollPresetKey = "us-double" | "euro-standard" | "commercial-54" | "custom";
type MatchType = "random" | "straight" | "drop";

interface WallItem {
    id: string;
    label: string;
    width: number;
    height: number;
}

interface DeductionItem {
    id: string;
    type: "window" | "door" | "custom";
    label: string;
    width: number;
    height: number;
}

const ROLL_PRESETS: Record<RollPresetKey, { name: string; widthInches: number; lengthFeet: number; widthCm: number; lengthM: number; description: string }> = {
    "us-double": {
        name: "US Double Roll (Standard)",
        widthInches: 20.5,
        lengthFeet: 33,
        widthCm: 52,
        lengthM: 10.05,
        description: "Standard residential wallpaper in North America (~56.4 sq ft / 5.23 sq m)"
    },
    "euro-standard": {
        name: "European Standard Metric Roll",
        widthInches: 20.87,
        lengthFeet: 32.8,
        widthCm: 53,
        lengthM: 10.05,
        description: "Standard British & European roll format (~57 sq ft / 5.33 sq m)"
    },
    "commercial-54": {
        name: "Commercial Vinyl (54\" Wide Yardage)",
        widthInches: 54,
        lengthFeet: 90,
        widthCm: 137.16,
        lengthM: 27.43,
        description: "Heavy-duty commercial bolt sold in 30-yard bolts (~405 sq ft / 37.6 sq m)"
    },
    "custom": {
        name: "Custom Roll Dimensions",
        widthInches: 27,
        lengthFeet: 27,
        widthCm: 68.58,
        lengthM: 8.23,
        description: "User-defined custom roll width, roll length, and bolt area"
    }
};

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

export default function WallpaperCalculator() {
    // Mode & Dimension Unit State
    const [unit, setUnit] = useState<UnitSystem>("imperial");
    const [rollPreset, setRollPreset] = useState<RollPresetKey>("us-double");

    // Custom Roll Dimensions
    const [customRollWidth, setCustomRollWidth] = useState<number>(27);
    const [customRollLength, setCustomRollLength] = useState<number>(27);

    // Pattern Repeat & Matching
    const [patternRepeat, setPatternRepeat] = useState<number>(0);
    const [matchType, setMatchType] = useState<MatchType>("straight");

    // Overlap / Trimming Margin State
    const [trimAllowance, setTrimAllowance] = useState<number>(unit === "imperial" ? 4 : 10);
    const [wasteBufferPct, setWasteBufferPct] = useState<number>(15);
    const [pricePerRoll, setPricePerRoll] = useState<number>(45);

    // Dynamic Wall & Deduction Structure
    const [walls, setWalls] = useState<WallItem[]>([
        { id: "wall-1", label: "Wall 1 (North)", width: 12, height: 9 },
        { id: "wall-2", label: "Wall 2 (East)", width: 10, height: 9 },
        { id: "wall-3", label: "Wall 3 (South)", width: 12, height: 9 },
        { id: "wall-4", label: "Wall 4 (West)", width: 10, height: 9 },
    ]);

    const [deductions, setDeductions] = useState<DeductionItem[]>([
        { id: "ded-1", type: "door", label: "Entry Door", width: 3, height: 7 },
        { id: "ded-2", type: "window", label: "Window Frame", width: 4, height: 5 },
    ]);

    const [copied, setCopied] = useState<boolean>(false);

    // Add / Remove Wall Handlers
    const handleAddWall = () => {
        const nextIdx = walls.length + 1;
        setWalls((prev) => [
            ...prev,
            { id: `wall-${Date.now()}`, label: `Wall ${nextIdx}`, width: unit === "imperial" ? 10 : 3, height: unit === "imperial" ? 9 : 2.7 }
        ]);
    };

    const handleRemoveWall = (id: string) => {
        if (walls.length <= 1) return;
        setWalls((prev) => prev.filter((w) => w.id !== id));
    };

    const handleUpdateWall = (id: string, field: "width" | "height" | "label", val: string | number) => {
        setWalls((prev) =>
            prev.map((w) => (w.id === id ? { ...w, [field]: val } : w))
        );
    };

    // Add / Remove Deductions
    const handleAddDeduction = () => {
        const nextIdx = deductions.length + 1;
        setDeductions((prev) => [
            ...prev,
            { id: `ded-${Date.now()}`, type: "custom", label: `Opening ${nextIdx}`, width: unit === "imperial" ? 3 : 1, height: unit === "imperial" ? 4 : 1.2 }
        ]);
    };

    const handleRemoveDeduction = (id: string) => {
        setDeductions((prev) => prev.filter((d) => d.id !== id));
    };

    const handleUpdateDeduction = (id: string, field: "width" | "height" | "label" | "type", val: string | number) => {
        setDeductions((prev) =>
            prev.map((d) => (d.id === id ? { ...d, [field]: val } : d))
        );
    };

    // Unit Conversion Toggle
    const handleUnitSwitch = (newUnit: UnitSystem) => {
        if (newUnit === unit) return;
        if (newUnit === "metric") {
            // Feet to Meters conversion
            setWalls((prev) =>
                prev.map((w) => ({
                    ...w,
                    width: parseFloat((w.width * 0.3048).toFixed(2)),
                    height: parseFloat((w.height * 0.3048).toFixed(2))
                }))
            );
            setDeductions((prev) =>
                prev.map((d) => ({
                    ...d,
                    width: parseFloat((d.width * 0.3048).toFixed(2)),
                    height: parseFloat((d.height * 0.3048).toFixed(2))
                }))
            );
            setPatternRepeat(parseFloat((patternRepeat * 2.54).toFixed(1)));
            setTrimAllowance(10); // 10 cm trim margin
        } else {
            // Meters to Feet conversion
            setWalls((prev) =>
                prev.map((w) => ({
                    ...w,
                    width: parseFloat((w.width / 0.3048).toFixed(2)),
                    height: parseFloat((w.height / 0.3048).toFixed(2))
                }))
            );
            setDeductions((prev) =>
                prev.map((d) => ({
                    ...d,
                    width: parseFloat((d.width / 0.3048).toFixed(2)),
                    height: parseFloat((d.height / 0.3048).toFixed(2))
                }))
            );
            setPatternRepeat(parseFloat((patternRepeat / 2.54).toFixed(1)));
            setTrimAllowance(4); // 4 inches trim margin
        }
        setUnit(newUnit);
    };

    const handleReset = () => {
        setUnit("imperial");
        setRollPreset("us-double");
        setCustomRollWidth(27);
        setCustomRollLength(27);
        setPatternRepeat(0);
        setMatchType("straight");
        setTrimAllowance(4);
        setWasteBufferPct(15);
        setPricePerRoll(45);
        setWalls([
            { id: "wall-1", label: "Wall 1 (North)", width: 12, height: 9 },
            { id: "wall-2", label: "Wall 2 (East)", width: 10, height: 9 },
            { id: "wall-3", label: "Wall 3 (South)", width: 12, height: 9 },
            { id: "wall-4", label: "Wall 4 (West)", width: 10, height: 9 },
        ]);
        setDeductions([
            { id: "ded-1", type: "door", label: "Entry Door", width: 3, height: 7 },
            { id: "ded-2", type: "window", label: "Window Frame", width: 4, height: 5 },
        ]);
    };

    // Calculation Engine
    const calculation = useMemo(() => {
        // 1. Determine active roll dimensions
        let rollWidthInches = 20.5;
        let rollLengthFeet = 33;
        let rollWidthCm = 52;
        let rollLengthM = 10.05;

        if (rollPreset === "custom") {
            if (unit === "imperial") {
                rollWidthInches = customRollWidth;
                rollLengthFeet = customRollLength;
                rollWidthCm = customRollWidth * 2.54;
                rollLengthM = customRollLength * 0.3048;
            } else {
                rollWidthCm = customRollWidth;
                rollLengthM = customRollLength;
                rollWidthInches = customRollWidth / 2.54;
                rollLengthFeet = customRollLength / 0.3048;
            }
        } else {
            const spec = ROLL_PRESETS[rollPreset];
            rollWidthInches = spec.widthInches;
            rollLengthFeet = spec.lengthFeet;
            rollWidthCm = spec.widthCm;
            rollLengthM = spec.lengthM;
        }

        // Active roll width and roll length normalized to current working unit
        const activeRollWidth = unit === "imperial" ? (rollWidthInches / 12) : (rollWidthCm / 100);
        const activeRollLength = unit === "imperial" ? rollLengthFeet : rollLengthM;
        const rollArea = activeRollWidth * activeRollLength;

        // 2. Gross and Net Wall Area Calculations
        let grossWallArea = 0;
        let totalPerimeter = 0;
        let maxHeight = 0;

        walls.forEach((w) => {
            const area = Math.max(0, w.width * w.height);
            grossWallArea += area;
            totalPerimeter += w.width;
            if (w.height > maxHeight) maxHeight = w.height;
        });

        let totalDeductionsArea = 0;
        deductions.forEach((d) => {
            totalDeductionsArea += Math.max(0, d.width * d.height);
        });

        const netWallArea = Math.max(0, grossWallArea - totalDeductionsArea);

        // 3. Strip-by-Strip Precise Calculation
        // Pattern repeat converted into same linear dimension unit
        const repeatInUnits = unit === "imperial" ? (patternRepeat / 12) : (patternRepeat / 100);
        const trimInUnits = unit === "imperial" ? (trimAllowance / 12) : (trimAllowance / 100);

        let totalStripsRequired = 0;
        let totalLinearMaterialRequired = 0;

        walls.forEach((w) => {
            if (activeRollWidth > 0 && w.width > 0 && w.height > 0) {
                const stripsForWall = Math.ceil(w.width / activeRollWidth);
                totalStripsRequired += stripsForWall;

                let effectiveCutHeight = w.height + trimInUnits;
                if (repeatInUnits > 0) {
                    const repeatMultiplier = Math.ceil(effectiveCutHeight / repeatInUnits);
                    effectiveCutHeight = repeatMultiplier * repeatInUnits;
                    if (matchType === "drop") {
                        // Half-drop match incurs additional drop adjustment per alternating strip
                        effectiveCutHeight += (repeatInUnits * 0.5);
                    }
                }
                totalLinearMaterialRequired += stripsForWall * effectiveCutHeight;
            }
        });

        // 4. Roll Count Calculation based on Cuts Per Roll
        let exactRollsByStripMethod = 0;
        walls.forEach((w) => {
            if (activeRollWidth > 0 && w.width > 0 && w.height > 0 && activeRollLength > 0) {
                let effectiveCutHeight = w.height + trimInUnits;
                if (repeatInUnits > 0) {
                    const repeatMultiplier = Math.ceil(effectiveCutHeight / repeatInUnits);
                    effectiveCutHeight = repeatMultiplier * repeatInUnits;
                    if (matchType === "drop") {
                        effectiveCutHeight += (repeatInUnits * 0.5);
                    }
                }

                const cutsPerRoll = Math.max(1, Math.floor(activeRollLength / effectiveCutHeight));
                const stripsForWall = Math.ceil(w.width / activeRollWidth);
                const rollsForThisWall = Math.ceil(stripsForWall / cutsPerRoll);
                exactRollsByStripMethod += rollsForThisWall;
            }
        });

        // Add user waste buffer safety margin
        const totalNetAreaWithBuffer = netWallArea * (1 + wasteBufferPct / 100);
        const rollsByAreaMethod = rollArea > 0 ? Math.ceil(totalNetAreaWithBuffer / rollArea) : 0;

        // Enterprise Final Recommended Rolls: Math.max between strip cut yield and buffered area
        const recommendedRolls = Math.max(exactRollsByStripMethod, rollsByAreaMethod, 1);
        const estimatedCost = recommendedRolls * pricePerRoll;
        const totalPurchasedCoverage = recommendedRolls * rollArea;
        const expectedWastePct = totalPurchasedCoverage > 0
            ? Math.round(((totalPurchasedCoverage - netWallArea) / totalPurchasedCoverage) * 100)
            : wasteBufferPct;

        return {
            grossWallArea: parseFloat(grossWallArea.toFixed(2)),
            totalDeductionsArea: parseFloat(totalDeductionsArea.toFixed(2)),
            netWallArea: parseFloat(netWallArea.toFixed(2)),
            totalStripsRequired,
            totalLinearMaterialRequired: parseFloat(totalLinearMaterialRequired.toFixed(2)),
            rollArea: parseFloat(rollArea.toFixed(2)),
            recommendedRolls,
            exactRollsByStripMethod,
            rollsByAreaMethod,
            estimatedCost: parseFloat(estimatedCost.toFixed(2)),
            totalPurchasedCoverage: parseFloat(totalPurchasedCoverage.toFixed(2)),
            expectedWastePct,
            activeRollWidth: parseFloat(activeRollWidth.toFixed(2)),
            activeRollLength: parseFloat(activeRollLength.toFixed(2)),
        };
    }, [
        walls,
        deductions,
        rollPreset,
        customRollWidth,
        customRollLength,
        patternRepeat,
        matchType,
        trimAllowance,
        wasteBufferPct,
        pricePerRoll,
        unit
    ]);

    const handleCopyResults = () => {
        const text = `Wallpaper Installation Estimate:
----------------------------------------
Unit System: ${unit === "imperial" ? "Imperial (ft / in)" : "Metric (m / cm)"}
Total Net Wall Area: ${calculation.netWallArea} ${unit === "imperial" ? "sq ft" : "sq m"}
Total Perimeter: ${walls.reduce((acc, w) => acc + w.width, 0).toFixed(1)} ${unit === "imperial" ? "ft" : "m"}
Roll Specification: ${ROLL_PRESETS[rollPreset].name}
Pattern Repeat: ${patternRepeat} ${unit === "imperial" ? "in" : "cm"} (${matchType} match)
Total Strips Required: ${calculation.totalStripsRequired} strips
Recommended Roll Quantity: ${calculation.recommendedRolls} rolls
Total Purchased Coverage: ${calculation.totalPurchasedCoverage} ${unit === "imperial" ? "sq ft" : "sq m"}
Est. Project Material Cost: $${calculation.estimatedCost}
----------------------------------------
Calculated via twistertools.com/tools/home-tools/wallpaper-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Wallpaper Roll Count & Pattern Repeat Calculator",
        "url": "https://twistertools.com/tools/home-tools/wallpaper-calculator",
        "description": "Calculate exact wallpaper roll requirements, pattern repeat waste margins, strip cut yields, and material budgets for residential and commercial spaces.",
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
                "name": "How do I calculate wallpaper rolls needed for a room?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Calculate the total wall area by multiplying wall width by ceiling height for each wall. Subtract window and door areas to find the net square footage. Divide the net wall area by the usable square footage of a wallpaper roll (accounting for pattern repeat drops), and add a 15% waste allowance."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between straight match, drop match, and random match wallpaper?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In a random match (textures/stripes), strips align without pattern tracking, yielding almost zero waste. In a straight match, the design elements match horizontally across adjacent strips at the same ceiling point. In a half-drop match, the pattern shifts vertically by half the repeat distance on alternating strips, requiring more trimming and up to 20% extra paper."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard size of a single roll vs a double roll of wallpaper?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In North America, wallpaper is priced by the single roll but almost universally packaged and shipped as a 'Double Roll' bolt measuring approximately 20.5 inches wide by 33 feet long (56.4 sq ft). European standard metric rolls measure 53 cm wide by 10.05 m long (5.33 sq m)."
                }
            },
            {
                "@type": "Question",
                "name": "Should I subtract doors and windows from my wallpaper calculation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For standard openings under 25 sq ft, professional paperhangers often recommend not subtracting them or subtracting only 50% of the opening. Because full vertical strips must still be hung around door and window headers, deducting full areas can lead to material shortfalls."
                }
            },
            {
                "@type": "Question",
                "name": "Why is lot number / run number matching critical when buying wallpaper?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wallpaper manufactured in different printing runs can have slight variances in ink color formulation and drying humidity. Always purchase all rolls from the exact same dye-lot run to ensure color consistency across continuous walls."
                }
            },
            {
                "@type": "Question",
                "name": "How much extra wallpaper should I order for overage and future repairs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Order a minimum of 15% extra for plain or random-match paper, and 20% to 25% extra for large-repeat drop patterns. Having one unopened spare roll from the same run guarantees seamless repairs if water damage or gouges occur years later."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Paintbrush className="w-5 h-5 text-indigo-600" />
                                Wall & Paper Dimensions
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Measurement Unit & Preset Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                        Imperial (ft / in)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSwitch("metric")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Metric (m / cm)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Roll Type Preset
                                </label>
                                <select
                                    value={rollPreset}
                                    onChange={(e) => setRollPreset(e.target.value as RollPresetKey)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="us-double">US Double Roll (20.5" × 33 ft)</option>
                                    <option value="euro-standard">Euro Standard (53 cm × 10.05 m)</option>
                                    <option value="commercial-54">Commercial 54" Bolt (30 Yards)</option>
                                    <option value="custom">Custom Roll Dimensions...</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom Roll Specs (if Custom Selected) */}
                        {rollPreset === "custom" && (
                            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-950 uppercase">
                                        Roll Width ({unit === "imperial" ? "inches" : "cm"})
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={customRollWidth === 0 ? "" : customRollWidth}
                                        onChange={(e) => handleNumberInput(e, setCustomRollWidth)}
                                        className="w-full mt-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-indigo-950 uppercase">
                                        Roll Length ({unit === "imperial" ? "feet" : "meters"})
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={customRollLength === 0 ? "" : customRollLength}
                                        onChange={(e) => handleNumberInput(e, setCustomRollLength)}
                                        className="w-full mt-1 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Pattern Repeat and Match Mode */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Grid className="w-4 h-4 text-indigo-600" />
                                    Pattern Repeat Interval
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        value={patternRepeat === 0 ? "" : patternRepeat}
                                        onChange={(e) => handleNumberInput(e, setPatternRepeat)}
                                        className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-xs font-bold text-slate-600">{unit === "imperial" ? "in" : "cm"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMatchType("random")}
                                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${matchType === "random" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Random Match
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMatchType("straight")}
                                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${matchType === "straight" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Straight Match
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMatchType("drop")}
                                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${matchType === "drop" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"}`}
                                >
                                    Drop Match (Half)
                                </button>
                            </div>
                        </div>

                        {/* Wall Dimensions List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Ruler className="w-4 h-4 text-indigo-600" />
                                    Wall Segment Dimensions ({unit === "imperial" ? "feet" : "meters"})
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddWall}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Wall
                                </button>
                            </div>

                            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {walls.map((wall, index) => (
                                    <div key={wall.id} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                        <span className="w-5 text-center font-bold text-slate-400">#{index + 1}</span>
                                        <input
                                            type="text"
                                            value={wall.label}
                                            onChange={(e) => handleUpdateWall(wall.id, "label", e.target.value)}
                                            className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-500 font-medium">W:</span>
                                            <input
                                                type="number"
                                                min={0.5}
                                                step={0.1}
                                                value={wall.width === 0 ? "" : wall.width}
                                                onChange={(e) => handleUpdateWall(wall.id, "width", parseFloat(e.target.value) || 0)}
                                                className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold text-slate-900"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-500 font-medium">H:</span>
                                            <input
                                                type="number"
                                                min={0.5}
                                                step={0.1}
                                                value={wall.height === 0 ? "" : wall.height}
                                                onChange={(e) => handleUpdateWall(wall.id, "height", parseFloat(e.target.value) || 0)}
                                                className="w-16 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold text-slate-900"
                                            />
                                        </div>
                                        {walls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveWall(wall.id)}
                                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deductions Openings */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Scissors className="w-4 h-4 text-indigo-600" />
                                    Deductions: Doors & Windows ({unit === "imperial" ? "ft" : "m"})
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddDeduction}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Opening
                                </button>
                            </div>

                            {deductions.length === 0 ? (
                                <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded-xl border border-slate-100">
                                    No window or door openings deducted (Full gross wall coverage).
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                    {deductions.map((ded) => (
                                        <div key={ded.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                            <input
                                                type="text"
                                                value={ded.label}
                                                onChange={(e) => handleUpdateDeduction(ded.id, "label", e.target.value)}
                                                className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                                            />
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-500 font-medium">W:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={ded.width === 0 ? "" : ded.width}
                                                    onChange={(e) => handleUpdateDeduction(ded.id, "width", parseFloat(e.target.value) || 0)}
                                                    className="w-14 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold text-slate-900"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-500 font-medium">H:</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step={0.1}
                                                    value={ded.height === 0 ? "" : ded.height}
                                                    onChange={(e) => handleUpdateDeduction(ded.id, "height", parseFloat(e.target.value) || 0)}
                                                    className="w-14 px-1.5 py-1 text-right bg-white border border-slate-300 rounded font-bold text-slate-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDeduction(ded.id)}
                                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Waste and Budget Variables */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                                    Waste / Overage Buffer (%)
                                </label>
                                <div className="flex items-center gap-1 mt-1">
                                    <input
                                        type="number"
                                        min={5}
                                        max={40}
                                        value={wasteBufferPct === 0 ? "" : wasteBufferPct}
                                        onChange={(e) => handleNumberInput(e, setWasteBufferPct)}
                                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs font-bold text-slate-600">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase">
                                    Price Per Roll ($)
                                </label>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs font-bold text-slate-600">$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={pricePerRoll === 0 ? "" : pricePerRoll}
                                        onChange={(e) => handleNumberInput(e, setPricePerRoll)}
                                        className="w-full px-2 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Trim Allowance: +{trimAllowance} {unit === "imperial" ? "in" : "cm"} top/bottom
                        </span>
                        <span>Multi-Wall Algorithm</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Matrix & Installation Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Wallpaper Order Requirements
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                Strip-Accurate
                            </span>
                        </div>

                        {/* Highlight Hero Output Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Total Rolls Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Boxes className="w-4 h-4 text-indigo-600" /> Rolls to Order
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        +{wasteBufferPct}% Buffer
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculation.recommendedRolls}
                                    <span className="text-lg font-bold text-slate-600 ml-1.5">Rolls</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Purchased: {calculation.totalPurchasedCoverage} {unit === "imperial" ? "sq ft" : "sq m"}
                                </p>
                            </div>

                            {/* Estimated Cost Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Material Budget
                                    </span>
                                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                                        ${pricePerRoll}/roll
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    ${calculation.estimatedCost}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Net Surface: {calculation.netWallArea} {unit === "imperial" ? "sq ft" : "sq m"}
                                </p>
                            </div>
                        </div>

                        {/* Material Specifications Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Vertical Strips</span>
                                <span className="text-base sm:text-lg font-black text-slate-800">{calculation.totalStripsRequired} Drops</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Roll Coverage</span>
                                <span className="text-base sm:text-lg font-black text-slate-800">{calculation.rollArea} {unit === "imperial" ? "sq ft" : "sq m"}</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Expected Waste</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600">~{calculation.expectedWastePct}%</span>
                            </div>
                        </div>

                        {/* Installation Summary Box */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-200 pb-2">
                                <span>Area Breakdown Metrics</span>
                                <span>Calculated Values</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Gross Wall Area (Total Surfaces):</span>
                                <span className="font-mono font-bold text-slate-800">{calculation.grossWallArea} {unit === "imperial" ? "sq ft" : "sq m"}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Total Deductions (Doors/Windows):</span>
                                <span className="font-mono font-bold text-slate-800">-{calculation.totalDeductionsArea} {unit === "imperial" ? "sq ft" : "sq m"}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Net Surface Requiring Paper:</span>
                                <span className="font-mono font-bold text-indigo-600">{calculation.netWallArea} {unit === "imperial" ? "sq ft" : "sq m"}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>Total Linear Paper Needed:</span>
                                <span className="font-mono font-bold text-slate-800">{calculation.totalLinearMaterialRequired} {unit === "imperial" ? "ft" : "m"}</span>
                            </div>
                        </div>

                        {/* Professional Paperhanger Directives */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4 text-amber-400" />
                                Master Paperhanger Guidelines
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li><strong>Single Dye-Lot Batch:</strong> Verify that all {calculation.recommendedRolls} rolls share the exact same lot/run number.</li>
                                <li><strong>Plumb Line First:</strong> Never hang your first strip aligned to an interior corner; always draw a laser or bubble plumb line.</li>
                                <li><strong>Keep 1 Attic Spare:</strong> Save remaining uncut rolls and offcuts for future patch repairs due to plumbing or scuffs.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Estimate Copied to Clipboard!" : "Copy Wallpaper Specification"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Standard Roll Specifications Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ScrollText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Wallpaper Roll Dimensions & Coverage Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Wallpaper manufacturing standards vary significantly between North American, European, and commercial architectural supply chains. Use this comprehensive reference guide to verify roll dimensions, nominal coverage, and usable yields before placing an order.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Roll Standard</th>
                                    <th className="p-3">Physical Dimensions</th>
                                    <th className="p-3">Nominal Area</th>
                                    <th className="p-3">Usable Area (8-9ft Walls)</th>
                                    <th className="p-3">Primary Geographic Region</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">US Double Roll (Standard)</td>
                                    <td className="p-3 font-mono">20.5 in × 33 ft</td>
                                    <td className="p-3 text-slate-600 font-mono">56.4 sq ft (5.24 m²)</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">48 – 50 sq ft</td>
                                    <td className="p-3 text-xs">United States, Canada</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">European Standard Metric</td>
                                    <td className="p-3 font-mono">53 cm × 10.05 m</td>
                                    <td className="p-3 text-slate-600 font-mono">57.3 sq ft (5.33 m²)</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">48 – 52 sq ft</td>
                                    <td className="p-3 text-xs">UK, European Union, Australia</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Wide-Format Residential</td>
                                    <td className="p-3 font-mono">27 in × 27 ft (9 yds)</td>
                                    <td className="p-3 text-slate-600 font-mono">60.75 sq ft (5.64 m²)</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">52 – 55 sq ft</td>
                                    <td className="p-3 text-xs">Designer & Boutique Brands</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Commercial 54" Vinyl Bolt</td>
                                    <td className="p-3 font-mono">54 in × 90 ft (30 yds)</td>
                                    <td className="p-3 text-slate-600 font-mono">405 sq ft (37.6 m²)</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">350 – 375 sq ft</td>
                                    <td className="p-3 text-xs">Hospitality, Corporate, Retail</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Pattern Repeat & Match Types Explained */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Pattern Repeats and Pattern Match Types Explained
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A pattern repeat is the vertical distance between identical design motifs on a roll. When wallpaper has a repeating visual element, each consecutive vertical strip must be aligned precisely to match the adjacent strip at eye level.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Random / Free Match
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Used for textures, grasscloths, and vertical stripes. Strips do not require vertical alignment; cuts are made directly at ceiling height plus trim allowances, resulting in zero pattern waste.
                            </p>
                            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded">
                                Waste: 5% - 10%
                            </span>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Grid className="w-4 h-4 text-indigo-600" /> Straight Match
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Design elements match horizontally across each strip at identical heights. Each strip cut must be rounded up to the nearest multiple of the repeat interval, leaving offcuts at the top or bottom.
                            </p>
                            <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-bold rounded">
                                Waste: 15% - 20%
                            </span>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-indigo-600" /> Half-Drop Match
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The pattern shifts vertically by 50% of the repeat height on alternating strips to create diagonal motion. Requires alternate cuts from multiple rolls simultaneously to prevent excessive offcut loss.
                            </p>
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                                Waste: 20% - 25%
                            </span>
                        </div>
                    </div>
                </section>

                {/* Card 3: Engineering Formulas & Step-by-Step Calculation Logic */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematical Formulas for Strip Yield & Roll Estimates
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rather than relying solely on coarse square footage division, professional estimators use strip-by-strip cut yield mathematics to model how physical rolls translate into wall drops:
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl space-y-4 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Core Estimation Equations
                        </h3>

                        <div className="space-y-3 text-xs font-mono text-slate-300">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">1. Strip Count Formula:</span>
                                <strong className="text-indigo-300 text-sm">Total Strips = ceil( Wall Width / Roll Width )</strong>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">2. Effective Cut Height (with Pattern Repeat):</span>
                                <strong className="text-indigo-300 text-sm">Cut Height = ceil( (Wall Height + Trim Margin) / Repeat ) × Repeat</strong>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">3. Usable Cuts Per Roll Bolt:</span>
                                <strong className="text-indigo-300 text-sm">Cuts Per Roll = floor( Total Roll Length / Effective Cut Height )</strong>
                            </div>

                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">4. Final Required Roll Quantity:</span>
                                <strong className="text-indigo-300 text-sm">Rolls Needed = ceil( Total Strips / Cuts Per Roll )</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Worked Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Wallpaper Project Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how these mathematical formulas are applied in real residential remodeling scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Accent Feature Wall</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Straight Match</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Wall Dimensions:</strong> 14 ft Wide × 9 ft High (126 sq ft).</li>
                                <li><strong>Paper Spec:</strong> US Double Roll (20.5" W × 33 ft L, 24" Repeat).</li>
                                <li><strong>Strip Count:</strong> 14 ft / 1.708 ft = 9 strips required.</li>
                                <li><strong>Effective Cut:</strong> 9 ft wall + 4 in trim = 112 in → ceil(112/24)*24 = <strong>120 in (10 ft)</strong>.</li>
                                <li><strong>Cuts Per Roll:</strong> 33 ft / 10 ft = 3 full drops per roll.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Total Rolls: 9 strips / 3 cuts = <strong>3 Double Rolls Required</strong>.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Full Powder Room (4 Walls)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Half-Drop Match</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Room Dimensions:</strong> 6 ft × 8 ft room with 8.5 ft ceiling (Perimeter: 28 ft).</li>
                                <li><strong>Deductions:</strong> 1 Door (21 sq ft) + 1 Mirror/Vanity (15 sq ft).</li>
                                <li><strong>Net Wall Area:</strong> (28 × 8.5) - 36 = 202 sq ft net.</li>
                                <li><strong>Paper Spec:</strong> Euro Standard (53 cm × 10.05 m, 53 cm repeat).</li>
                                <li><strong>Strips Needed:</strong> ~17 vertical drops around perimeter.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Total Rolls: 17 drops / 2.5 cuts per roll = <strong>7 European Rolls Required</strong>.
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
                                How do I calculate wallpaper rolls needed for a room?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Calculate the total wall area by multiplying wall width by ceiling height for each wall. Subtract window and door areas to find the net square footage. Divide the net wall area by the usable square footage of a wallpaper roll (accounting for pattern repeat drops), and add a 15% waste allowance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between straight match, drop match, and random match wallpaper?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In a random match (textures/stripes), strips align without pattern tracking, yielding almost zero waste. In a straight match, the design elements match horizontally across adjacent strips at the same ceiling point. In a half-drop match, the pattern shifts vertically by half the repeat distance on alternating strips, requiring more trimming and up to 20% extra paper.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard size of a single roll vs a double roll of wallpaper?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In North America, wallpaper is priced by the single roll but almost universally packaged and shipped as a 'Double Roll' bolt measuring approximately 20.5 inches wide by 33 feet long (56.4 sq ft). European standard metric rolls measure 53 cm wide by 10.05 m long (5.33 sq m).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I subtract doors and windows from my wallpaper calculation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For standard openings under 25 sq ft, professional paperhangers often recommend not subtracting them or subtracting only 50% of the opening. Because full vertical strips must still be hung around door and window headers, deducting full areas can lead to material shortfalls.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is lot number / run number matching critical when buying wallpaper?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Wallpaper manufactured in different printing runs can have slight variances in ink color formulation and drying humidity. Always purchase all rolls from the exact same dye-lot run to ensure color consistency across continuous walls.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much extra wallpaper should I order for overage and future repairs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Order a minimum of 15% extra for plain or random-match paper, and 20% to 25% extra for large-repeat drop patterns. Having one unopened spare roll from the same run guarantees seamless repairs if water damage or gouges occur years later.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}