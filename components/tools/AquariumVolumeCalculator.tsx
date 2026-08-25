"use client";

import React, { useState, useMemo } from "react";
import {
    Fish,
    Waves,
    Scale,
    ShieldAlert,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    SlidersHorizontal,
    Box,
    Layers,
    Activity,
    Droplets,
    Gauge,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type TankShape = "rectangular" | "bowfront" | "cylinder" | "hexagonal" | "corner_pentagon";
type WaterType = "freshwater" | "saltwater";
type GlassType = "standard" | "rimless_acrylic";

interface StandardPreset {
    name: string;
    shape: TankShape;
    length: number;
    width: number;
    height: number;
    nominalGal: number;
    description: string;
}

const STANDARD_PRESETS: StandardPreset[] = [
    { name: "10 Gallon Standard", shape: "rectangular", length: 20, width: 10, height: 12, nominalGal: 10, description: "Quarantine / Nano planted tank" },
    { name: "20 Gallon Long", shape: "rectangular", length: 30, width: 12, height: 12, nominalGal: 20, description: "Ideal footprint for schooling fish" },
    { name: "29 Gallon Standard", shape: "rectangular", length: 30, width: 12, height: 18, nominalGal: 29, description: "Popular beginner community aquarium" },
    { name: "40 Gallon Breeder", shape: "rectangular", length: 36, width: 18, height: 16, nominalGal: 40, description: "Optimal surface area for planted tanks & cichlids" },
    { name: "55 Gallon Standard", shape: "rectangular", length: 48, width: 13, height: 21, nominalGal: 55, description: "Classic 4-foot display tank" },
    { name: "75 Gallon Standard", shape: "rectangular", length: 48, width: 18, height: 21, nominalGal: 75, description: "Large community / African cichlid setup" },
    { name: "125 Gallon Standard", shape: "rectangular", length: 72, width: 18, height: 22, nominalGal: 125, description: "6-foot large freshwater or reef display" },
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

export default function AquariumVolumeCalculator() {
    // Core Parameters
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [shape, setShape] = useState<TankShape>("rectangular");
    const [waterType, setWaterType] = useState<WaterType>("freshwater");
    const [glassType, setGlassType] = useState<GlassType>("standard");

    // Dimensions (stored in current active unit: inches or cm)
    const [length, setLength] = useState<number>(36);
    const [width, setWidth] = useState<number>(18);
    const [height, setHeight] = useState<number>(16);
    const [fullWidth, setFullWidth] = useState<number>(22); // Bowfront max depth
    const [diameter, setDiameter] = useState<number>(24);   // Cylinder diameter

    // Substrate, Hardscape, & Top Water Gap Adjustments
    const [waterGap, setWaterGap] = useState<number>(1.5); // Inches or cm below top rim
    const [substrateDepth, setSubstrateDepth] = useState<number>(2); // Avg thickness
    const [hardscapeDisplacementPct, setHardscapeDisplacementPct] = useState<number>(10); // Rocks & Driftwood %
    const [isCustomAdjustments, setIsCustomAdjustments] = useState<boolean>(false);

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Unit Conversion Helpers
    const isImperial = unitSystem === "imperial";
    const dimUnit = isImperial ? "in" : "cm";
    const volUnitMain = isImperial ? "US Gallons" : "Liters";
    const volUnitAlt = isImperial ? "Liters" : "US Gallons";
    const weightUnitMain = isImperial ? "lbs" : "kg";
    const weightUnitAlt = isImperial ? "kg" : "lbs";

    // Switch Unit System
    const handleUnitSwitch = (newUnit: UnitSystem) => {
        if (newUnit === unitSystem) return;
        if (newUnit === "metric") {
            // Convert inches to cm
            setLength(Math.round(length * 2.54));
            setWidth(Math.round(width * 2.54));
            setHeight(Math.round(height * 2.54));
            setFullWidth(Math.round(fullWidth * 2.54));
            setDiameter(Math.round(diameter * 2.54));
            setWaterGap(Math.round(waterGap * 2.54 * 10) / 10);
            setSubstrateDepth(Math.round(substrateDepth * 2.54 * 10) / 10);
        } else {
            // Convert cm to inches
            setLength(Math.round((length / 2.54) * 10) / 10);
            setWidth(Math.round((width / 2.54) * 10) / 10);
            setHeight(Math.round((height / 2.54) * 10) / 10);
            setFullWidth(Math.round((fullWidth / 2.54) * 10) / 10);
            setDiameter(Math.round((diameter / 2.54) * 10) / 10);
            setWaterGap(Math.round((waterGap / 2.54) * 10) / 10);
            setSubstrateDepth(Math.round((substrateDepth / 2.54) * 10) / 10);
        }
        setUnitSystem(newUnit);
    };

    // Standard Preset Selection
    const handleSelectPreset = (preset: StandardPreset) => {
        setShape(preset.shape);
        if (unitSystem === "imperial") {
            setLength(preset.length);
            setWidth(preset.width);
            setHeight(preset.height);
        } else {
            setLength(Math.round(preset.length * 2.54));
            setWidth(Math.round(preset.width * 2.54));
            setHeight(Math.round(preset.height * 2.54));
        }
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setShape("rectangular");
        setWaterType("freshwater");
        setGlassType("standard");
        setLength(36);
        setWidth(18);
        setHeight(16);
        setFullWidth(22);
        setDiameter(24);
        setWaterGap(1.5);
        setSubstrateDepth(2);
        setHardscapeDisplacementPct(10);
        setIsCustomAdjustments(false);
    };

    // Calculate Volume and Weight Metrics
    const calculations = useMemo(() => {
        // Convert active dimensions to standard inches for mathematical baseline
        const lInches = isImperial ? length : length / 2.54;
        const wInches = isImperial ? width : width / 2.54;
        const hInches = isImperial ? height : height / 2.54;
        const bowWidthInches = isImperial ? fullWidth : fullWidth / 2.54;
        const diamInches = isImperial ? diameter : diameter / 2.54;
        const gapInches = isImperial ? waterGap : waterGap / 2.54;
        const subInches = isImperial ? substrateDepth : substrateDepth / 2.54;

        // 1. Gross External Tank Volume Calculation (in cubic inches)
        let grossCubicInches = 0;
        let baseAreaSqInches = 0;

        switch (shape) {
            case "rectangular":
                grossCubicInches = lInches * wInches * hInches;
                baseAreaSqInches = lInches * wInches;
                break;
            case "bowfront": {
                // Rectangular base portion + circular segment portion
                const rectVol = lInches * wInches * hInches;
                const bowDiff = Math.max(0, bowWidthInches - wInches);
                // Approximate bow arc segment volume as (2/3 * length * bowDiff) * height
                const bowVol = (2 / 3) * lInches * bowDiff * hInches;
                grossCubicInches = rectVol + bowVol;
                baseAreaSqInches = lInches * wInches + (2 / 3) * lInches * bowDiff;
                break;
            }
            case "cylinder": {
                const radius = diamInches / 2;
                baseAreaSqInches = Math.PI * Math.pow(radius, 2);
                grossCubicInches = baseAreaSqInches * hInches;
                break;
            }
            case "hexagonal": {
                // Regular hexagon area = (3 * sqrt(3) / 2) * side^2 where diameter = 2 * side
                const side = diamInches / 2;
                baseAreaSqInches = ((3 * Math.sqrt(3)) / 2) * Math.pow(side, 2);
                grossCubicInches = baseAreaSqInches * hInches;
                break;
            }
            case "corner_pentagon": {
                // Corner tank: square of length x length minus outer cut corners
                baseAreaSqInches = Math.pow(lInches, 2) * 0.75;
                grossCubicInches = baseAreaSqInches * hInches;
                break;
            }
        }

        // Gross Gallons & Liters (1 US Gallon = 231 cubic inches, 1 Gallon = 3.78541 Liters)
        const grossGallons = grossCubicInches / 231;
        const grossLiters = grossGallons * 3.785411784;

        // 2. Net Water Height & Substrate Displacement
        const effectiveWaterHeight = Math.max(0, hInches - gapInches - subInches);
        const effectiveWaterFraction = hInches > 0 ? effectiveWaterHeight / hInches : 0;
        let netWaterGallons = grossGallons * effectiveWaterFraction;

        // Displace hardscape (rocks/wood)
        const hardscapeDisplacementFrac = Math.max(0, Math.min(50, hardscapeDisplacementPct)) / 100;
        netWaterGallons = netWaterGallons * (1 - hardscapeDisplacementFrac);
        const netWaterLiters = netWaterGallons * 3.785411784;

        // 3. Weight Modeling
        // Water density: Fresh = 8.34 lbs/gal (1.00 kg/L), Saltwater = 8.55 lbs/gal (~1.025 kg/L)
        const waterDensityLbsPerGal = waterType === "freshwater" ? 8.34 : 8.55;
        const netWaterWeightLbs = netWaterGallons * waterDensityLbsPerGal;
        const netWaterWeightKg = netWaterWeightLbs * 0.45359237;

        // Substrate Weight: ~10 lbs per gallon of substrate volume (~100 lbs/cu.ft)
        const substrateCubicInches = baseAreaSqInches * subInches;
        const substrateGallons = substrateCubicInches / 231;
        const substrateWeightLbs = substrateGallons * 12.5; // Gravel / Sand density
        const substrateWeightKg = substrateWeightLbs * 0.45359237;

        // Hardscape Weight Estimate: ~15 lbs per 1% displaced of a 50 gal tank scale
        const hardscapeWeightLbs = grossGallons * hardscapeDisplacementFrac * 16.5;
        const hardscapeWeightKg = hardscapeWeightLbs * 0.45359237;

        // Empty Glass / Acrylic Tank Weight Estimate
        // Standard framed glass: ~1.25 lbs per gross gallon; Rimless heavy glass: ~1.75 lbs/gal; Acrylic: ~0.65 lbs/gal
        let glassMultiplier = glassType === "standard" ? 1.35 : 1.75;
        const emptyTankWeightLbs = grossGallons * glassMultiplier;
        const emptyTankWeightKg = emptyTankWeightLbs * 0.45359237;

        // Total System Weight
        const totalSystemWeightLbs = netWaterWeightLbs + substrateWeightLbs + hardscapeWeightLbs + emptyTankWeightLbs;
        const totalSystemWeightKg = totalSystemWeightLbs * 0.45359237;

        // Floor Load Pressure (lbs per square foot / kg per m2)
        const baseAreaSqFeet = Math.max(0.1, baseAreaSqInches / 144);
        const floorLoadLbsSqFt = totalSystemWeightLbs / baseAreaSqFeet;
        const floorLoadKgSqM = (totalSystemWeightKg) / (baseAreaSqFeet * 0.092903);

        // 4. Recommended Filtration Turnover Rates
        const minFilterGph = netWaterGallons * 4; // 4x turnover (gentle planted/community)
        const maxFilterGph = netWaterGallons * 10; // 10x turnover (high bio-load / reef / cichlid)
        const minFilterLph = minFilterGph * 3.78541;
        const maxFilterLph = maxFilterGph * 3.78541;

        // 5. Recommended Heater Wattage (approx 3 to 5 watts per gallon)
        const minHeaterWatts = Math.round(netWaterGallons * 3);
        const maxHeaterWatts = Math.round(netWaterGallons * 5);

        // 6. Surface Area Gas Exchange Rating
        const surfaceAreaSqInches = baseAreaSqInches;
        const surfaceAreaSqCm = surfaceAreaSqInches * 6.4516;

        return {
            grossGallons: Math.round(grossGallons * 10) / 10,
            grossLiters: Math.round(grossLiters * 10) / 10,
            netWaterGallons: Math.round(netWaterGallons * 10) / 10,
            netWaterLiters: Math.round(netWaterLiters * 10) / 10,
            waterWeightLbs: Math.round(netWaterWeightLbs),
            waterWeightKg: Math.round(netWaterWeightKg),
            emptyTankWeightLbs: Math.round(emptyTankWeightLbs),
            emptyTankWeightKg: Math.round(emptyTankWeightKg),
            substrateWeightLbs: Math.round(substrateWeightLbs),
            substrateWeightKg: Math.round(substrateWeightKg),
            hardscapeWeightLbs: Math.round(hardscapeWeightLbs),
            hardscapeWeightKg: Math.round(hardscapeWeightKg),
            totalSystemWeightLbs: Math.round(totalSystemWeightLbs),
            totalSystemWeightKg: Math.round(totalSystemWeightKg),
            floorLoadLbsSqFt: Math.round(floorLoadLbsSqFt),
            floorLoadKgSqM: Math.round(floorLoadKgSqM),
            minFilterGph: Math.round(minFilterGph),
            maxFilterGph: Math.round(maxFilterGph),
            minFilterLph: Math.round(minFilterLph),
            maxFilterLph: Math.round(maxFilterLph),
            minHeaterWatts,
            maxHeaterWatts,
            surfaceAreaSqInches: Math.round(surfaceAreaSqInches),
            surfaceAreaSqCm: Math.round(surfaceAreaSqCm),
        };
    }, [
        shape,
        length,
        width,
        height,
        fullWidth,
        diameter,
        waterGap,
        substrateDepth,
        hardscapeDisplacementPct,
        unitSystem,
        waterType,
        glassType,
        isImperial
    ]);

    const handleCopyResults = () => {
        const text = `Aquarium Volume & System Weight Breakdown:
----------------------------------------
Tank Shape & Dimensions: ${shape.toUpperCase()} (${length}x${width}x${height} ${dimUnit})
Gross Tank Capacity: ${calculations.grossGallons} US Gal (${calculations.grossLiters} L)
True Net Water Volume: ${calculations.netWaterGallons} US Gal (${calculations.netWaterLiters} L)
Water Type: ${waterType.toUpperCase()}
Total Filled System Weight: ${calculations.totalSystemWeightLbs} lbs (${calculations.totalSystemWeightKg} kg)
Estimated Floor Load Pressure: ${calculations.floorLoadLbsSqFt} lbs/sq.ft (${calculations.floorLoadKgSqM} kg/m²)
Recommended Filter Flow Rate: ${calculations.minFilterGph} - ${calculations.maxFilterGph} GPH (${calculations.minFilterLph} - ${calculations.maxFilterLph} L/h)
Recommended Heater Sizing: ${calculations.minHeaterWatts}W - ${calculations.maxHeaterWatts}W
----------------------------------------
Calculated via twistertools.com/tools/home-tools/aquarium-volume-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Aquarium Volume & Total Filled Water Weight Calculator",
        "url": "https://twistertools.com/tools/home-tools/aquarium-volume-calculator",
        "description": "Calculate true net aquarium volume, filled water weight, glass weight, substrate displacement, floor load pressure, and heater/filter requirements for all standard and custom fish tank shapes.",
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
                "name": "How much does a gallon of aquarium water weigh?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pure freshwater weighs approximately 8.34 pounds per US Gallon (1.00 kg per liter). Marine saltwater is denser due to dissolved sea salts (specific gravity 1.025) and weighs approximately 8.55 pounds per US Gallon (1.025 kg per liter)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between gross nominal volume and true net water volume?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Gross volume measures the outer dimensions of the glass box. True net water volume accounts for the 1-2 inch water gap below the upper rim, the space displaced by gravel or sand substrate (typically 10-15%), glass wall thickness, and hardscape rocks or driftwood. Most 55-gallon tanks actually hold only 44 to 47 gallons of liquid water."
                }
            },
            {
                "@type": "Question",
                "name": "How do I know if my floor can hold a large fish tank?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern residential buildings are engineered for uniform live loads of 30 to 40 lbs/sq.ft. Aquariums over 55 gallons easily concentrate 150 to 250+ lbs/sq.ft over a compact footprint. For tanks 75 gallons and larger, position the stand perpendicular to load-bearing floor joists and directly against an exterior support wall or install floor jack posts in the crawlspace/basement."
                }
            },
            {
                "@type": "Question",
                "name": "How much filter flow rate (GPH / LPH) does my aquarium need?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As a rule of thumb, low-bioload planted aquariums need 4x to 5x tank volume turnover per hour. Heavily stocked community tanks, African cichlid setups, and saltwater reef tanks require 8x to 10x total volume turnover per hour."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate heater wattage for my aquarium volume?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The standard rule is 3 to 5 watts per net gallon of water. If your room is kept cold (more than 10°F / 5.5°C below target water temperature), use 5 watts per gallon or divide the required wattage across two smaller redundant heaters to protect against failure."
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

                {/* Left Workspace Panel: Dimensions & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Box className="w-5 h-5 text-indigo-600" />
                                Tank Dimensions & Specifications
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System & Water Type Selectors */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Measurement Units
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSwitch("imperial")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Inches / Gal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSwitch("metric")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        CM / Liters
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Aquarium Ecosystem
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setWaterType("freshwater")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${waterType === "freshwater" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Freshwater
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setWaterType("saltwater")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${waterType === "saltwater" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Reef / Salt
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tank Geometry Shape Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Aquarium Tank Shape
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                {[
                                    { id: "rectangular", label: "Rectangle" },
                                    { id: "bowfront", label: "Bowfront" },
                                    { id: "cylinder", label: "Cylinder" },
                                    { id: "hexagonal", label: "Hexagon" },
                                    { id: "corner_pentagon", label: "Corner" },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setShape(item.id as TankShape)}
                                        className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${shape === item.id
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dimension Input Controls */}
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            {shape === "cylinder" || shape === "hexagonal" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Outer Diameter ({dimUnit})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={diameter === 0 ? "" : diameter}
                                            onChange={(e) => handleNumberInput(e, setDiameter)}
                                            className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Tank Height ({dimUnit})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={height === 0 ? "" : height}
                                            onChange={(e) => handleNumberInput(e, setHeight)}
                                            className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Length / Front ({dimUnit})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={length === 0 ? "" : length}
                                            onChange={(e) => handleNumberInput(e, setLength)}
                                            className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Side Width / Depth ({dimUnit})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={width === 0 ? "" : width}
                                            onChange={(e) => handleNumberInput(e, setWidth)}
                                            className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Height ({dimUnit})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={500}
                                            value={height === 0 ? "" : height}
                                            onChange={(e) => handleNumberInput(e, setHeight)}
                                            className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {shape === "bowfront" && (
                                <div className="pt-2 border-t border-slate-200">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Center Bulge Depth ({dimUnit})
                                    </label>
                                    <input
                                        type="number"
                                        min={width}
                                        max={500}
                                        value={fullWidth === 0 ? "" : fullWidth}
                                        onChange={(e) => handleNumberInput(e, setFullWidth)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder={`Greater than side width (${width} ${dimUnit})`}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Standard Popular Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Industry Standard Tank Sizes
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {STANDARD_PRESETS.slice(0, 6).map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className="p-2 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs cursor-pointer group"
                                    >
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{preset.name}</p>
                                        <p className="text-[11px] text-slate-500">{preset.length}&quot;×{preset.width}&quot;×{preset.height}&quot; • {preset.nominalGal}G</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Real-World Adjustments (Substrate, Hardscape, Water Level) */}
                        <div className="pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsCustomAdjustments(!isCustomAdjustments)}
                                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {isCustomAdjustments ? "Hide Water & Substrate Modifiers" : "Adjust Substrate, Hardscape & Rim Gap"}
                                </span>
                                <span>{isCustomAdjustments ? "Close" : "Expand"}</span>
                            </button>

                            {isCustomAdjustments && (
                                <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                                <span>Water Rim Gap ({dimUnit})</span>
                                                <span className="font-bold text-indigo-600">{waterGap} {dimUnit}</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={isImperial ? 4 : 10}
                                                step={0.25}
                                                value={waterGap}
                                                onChange={(e) => setWaterGap(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                                <span>Substrate Depth ({dimUnit})</span>
                                                <span className="font-bold text-indigo-600">{substrateDepth} {dimUnit}</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={0}
                                                max={isImperial ? 5 : 12}
                                                step={0.25}
                                                value={substrateDepth}
                                                onChange={(e) => setSubstrateDepth(parseFloat(e.target.value))}
                                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1 pt-1">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                            <span>Hardscape Displacement (Rock / Driftwood)</span>
                                            <span className="font-bold text-indigo-600">{hardscapeDisplacementPct}% of volume</span>
                                        </label>
                                        <input
                                            type="range"
                                            min={0}
                                            max={30}
                                            step={1}
                                            value={hardscapeDisplacementPct}
                                            onChange={(e) => setHardscapeDisplacementPct(parseInt(e.target.value, 10))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Density: {waterType === "freshwater" ? "8.34 lbs/gal (1.00 SG)" : "8.55 lbs/gal (1.025 SG)"}
                        </span>
                        <span className="font-semibold text-slate-700">Engineering Grade</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Analytics & Load Calculations */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Waves className="w-5 h-5 text-indigo-600" />
                                Volume & System Weight Breakdown
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                Real-Time Calculations
                            </span>
                        </div>

                        {/* Top Dual Hero Cards: True Volume vs Total Weight */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Net Water Volume */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Droplets className="w-4 h-4 text-indigo-600" /> Net Water Volume
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        Active Fluid
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {isImperial ? calculations.netWaterGallons : calculations.netWaterLiters}
                                    <span className="text-base font-bold text-slate-600 ml-1">
                                        {isImperial ? "US Gal" : "L"}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Gross Tank Box: {isImperial ? `${calculations.grossGallons} Gal` : `${calculations.grossLiters} L`} ({isImperial ? `${calculations.grossLiters} L` : `${calculations.grossGallons} Gal`})
                                </p>
                            </div>

                            {/* Total Filled Weight */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Scale className="w-4 h-4 text-indigo-600" /> Total Filled Weight
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        Full Load
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {isImperial ? calculations.totalSystemWeightLbs : calculations.totalSystemWeightKg}
                                    <span className="text-base font-bold text-slate-600 ml-1">
                                        {weightUnitMain}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Equivalent: {isImperial ? `${calculations.totalSystemWeightKg} kg` : `${calculations.totalSystemWeightLbs} lbs`}
                                </p>
                            </div>
                        </div>

                        {/* Detailed Mass Distribution Stack */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                Component Mass Distribution
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Water Weight</span>
                                    <span className="text-sm font-black text-slate-800">
                                        {isImperial ? `${calculations.waterWeightLbs} lbs` : `${calculations.waterWeightKg} kg`}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Glass/Structure</span>
                                    <span className="text-sm font-black text-slate-800">
                                        {isImperial ? `${calculations.emptyTankWeightLbs} lbs` : `${calculations.emptyTankWeightKg} kg`}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Substrate</span>
                                    <span className="text-sm font-black text-slate-800">
                                        {isImperial ? `${calculations.substrateWeightLbs} lbs` : `${calculations.substrateWeightKg} kg`}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Hardscape</span>
                                    <span className="text-sm font-black text-slate-800">
                                        {isImperial ? `${calculations.hardscapeWeightLbs} lbs` : `${calculations.hardscapeWeightKg} kg`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Structural & Floor Load Safety Warning */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${calculations.totalSystemWeightLbs > 600
                            ? "border-amber-200 bg-amber-50/70 text-amber-900"
                            : "border-slate-200 bg-slate-50 text-slate-800"
                            }`}>
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold uppercase tracking-wider">
                                    Floor Pressure: {calculations.floorLoadLbsSqFt} lbs/sq.ft ({calculations.floorLoadKgSqM} kg/m²)
                                </p>
                                <p className="leading-relaxed">
                                    {calculations.totalSystemWeightLbs > 600
                                        ? "This setup exceeds 600 lbs. Position the aquarium perpendicular across floor joists against a load-bearing exterior wall to eliminate floor sagging."
                                        : "Standard residential flooring handles this weight safely without requiring specialized structural sub-floor reinforcement."}
                                </p>
                            </div>
                        </div>

                        {/* Equipment Sizing Specifications */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5" /> Filter Flow Target
                                </span>
                                <span className="text-base font-black text-white block">
                                    {isImperial ? `${calculations.minFilterGph} - ${calculations.maxFilterGph} GPH` : `${calculations.minFilterLph} - ${calculations.maxFilterLph} L/h`}
                                </span>
                                <span className="text-[10px] text-slate-400">4x to 10x hourly turnover</span>
                            </div>

                            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                    <Gauge className="w-3.5 h-3.5" /> Heater Sizing
                                </span>
                                <span className="text-base font-black text-white block">
                                    {calculations.minHeaterWatts}W – {calculations.maxHeaterWatts}W
                                </span>
                                <span className="text-[10px] text-slate-400">3 to 5 watts per gallon</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Aquarium Specs Copied!" : "Copy Full Aquarium Specs"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Standard Aquarium Dimensions & Weight Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Fish className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Aquarium Sizes, Water Capacities & Filled Weights
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Aquarium manufacturing adheres to standard rim dimensions. Use this quick reference chart to compare nominal tank volumes against their true dry glass weight and complete filled system mass.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Standard Tank Size</th>
                                    <th className="p-3">Dimensions (L × W × H)</th>
                                    <th className="p-3">Dry Tank Weight</th>
                                    <th className="p-3">Filled Water Weight</th>
                                    <th className="p-3">Total System Mass</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">5.5 Gallon Nano</td>
                                    <td className="p-3 font-mono">16&quot; × 8&quot; × 10&quot;</td>
                                    <td className="p-3">7 lbs (3.2 kg)</td>
                                    <td className="p-3">46 lbs (21 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">62 lbs (28 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">10 Gallon Standard</td>
                                    <td className="p-3 font-mono">20&quot; × 10&quot; × 12&quot;</td>
                                    <td className="p-3">11 lbs (5.0 kg)</td>
                                    <td className="p-3">83 lbs (38 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">110 lbs (50 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">20 Gallon Long</td>
                                    <td className="p-3 font-mono">30&quot; × 12&quot; × 12&quot;</td>
                                    <td className="p-3">25 lbs (11.3 kg)</td>
                                    <td className="p-3">167 lbs (76 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">225 lbs (102 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">29 Gallon Standard</td>
                                    <td className="p-3 font-mono">30&quot; × 12&quot; × 18&quot;</td>
                                    <td className="p-3">40 lbs (18.1 kg)</td>
                                    <td className="p-3">242 lbs (110 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">330 lbs (150 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">40 Gallon Breeder</td>
                                    <td className="p-3 font-mono">36&quot; × 18&quot; × 16&quot;</td>
                                    <td className="p-3">58 lbs (26.3 kg)</td>
                                    <td className="p-3">334 lbs (151 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">458 lbs (208 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">55 Gallon Standard</td>
                                    <td className="p-3 font-mono">48&quot; × 13&quot; × 21&quot;</td>
                                    <td className="p-3">78 lbs (35.4 kg)</td>
                                    <td className="p-3">459 lbs (208 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">625 lbs (283 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">75 Gallon Standard</td>
                                    <td className="p-3 font-mono">48&quot; × 18&quot; × 21&quot;</td>
                                    <td className="p-3">140 lbs (63.5 kg)</td>
                                    <td className="p-3">626 lbs (284 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">850 lbs (385 kg)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">125 Gallon Long</td>
                                    <td className="p-3 font-mono">72&quot; × 18&quot; × 22&quot;</td>
                                    <td className="p-3">206 lbs (93.4 kg)</td>
                                    <td className="p-3">1,043 lbs (473 kg)</td>
                                    <td className="p-3 font-bold text-indigo-600">1,400 lbs (635 kg)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Mathematical Formulas & Physics of Aquarium Sizing */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Physics of Aquarium Hydrodynamics & Weight
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating aquarium water volume requires geometric volume integration combined with fluid density physics and structural displacement principles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-indigo-600" /> Volumetric Conversion Math
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                One US Liquid Gallon equals exactly <strong>231 cubic inches</strong>. To determine rectangular tank volume in US Gallons, multiply length, width, and height in inches, then divide by 231. For liters, divide cubic centimeters by 1,000.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Fluid Density & Specific Gravity
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Pure freshwater holds a density of <strong>8.34 lbs/gal (1.000 g/cm³)</strong> at 77°F (25°C). Marine reef aquariums mixed to 35 ppt salinity (1.025 SG) have a higher density of <strong>8.55 lbs/gal (1.025 g/cm³)</strong>, adding significant deadweight to reef systems.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Box className="w-4 h-4" /> Core Volumetric Formulas by Shape
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans">Rectangular Prism:</span>
                                <strong className="text-indigo-300 text-sm">V = (Length × Width × Height) / 231</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans">Cylinder / Column:</span>
                                <strong className="text-indigo-300 text-sm">V = (π × (Diameter/2)² × Height) / 231</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans">Hexagonal Tank:</span>
                                <strong className="text-indigo-300 text-sm">V = ((3√3 / 2) × Side² × Height) / 231</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                                <span className="text-slate-400 block font-sans">Bowfront Prism:</span>
                                <strong className="text-indigo-300 text-sm">V = (L×W + 0.667×L×(Bow - W)) × H / 231</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Structural Floor Load & Safety Engineering */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Structural Floor Load Limits & Stand Placement Engineering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Aquarists frequently underestimate the extreme localized point-load that filled glass tanks place upon residential framing. Follow these civil engineering guidelines prior to installing aquariums exceeding 40 gallons:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Perpendicular to Joists
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Always position long aquariums across multiple floor joists (perpendicular) rather than parallel on top of a single joist to distribute mass across 3 to 4 timber beams.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Exterior Load Walls
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Place large tanks directly adjacent to exterior foundation walls or central structural load-bearing walls where joist deflection and bounce are minimal.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Crawlspace Jack Posts
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For display systems exceeding 100 gallons (1,000+ lbs), install adjustable screw jack posts with concrete footers beneath the floor framing in basements or crawlspaces.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Aquarium Capacity & Water Weight FAQ
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much does a gallon of aquarium water weigh?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Pure freshwater weighs approximately 8.34 pounds per US Gallon (1.00 kg per liter). Marine saltwater is denser due to dissolved sea salts (specific gravity 1.025) and weighs approximately 8.55 pounds per US Gallon (1.025 kg per liter).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between gross nominal volume and true net water volume?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Gross volume measures the outer dimensions of the glass box. True net water volume accounts for the 1-2 inch water gap below the upper rim, the space displaced by gravel or sand substrate (typically 10-15%), glass wall thickness, and hardscape rocks or driftwood. Most 55-gallon tanks actually hold only 44 to 47 gallons of liquid water.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I know if my floor can hold a large fish tank?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern residential buildings are engineered for uniform live loads of 30 to 40 lbs/sq.ft. Aquariums over 55 gallons easily concentrate 150 to 250+ lbs/sq.ft over a compact footprint. For tanks 75 gallons and larger, position the stand perpendicular to load-bearing floor joists and directly against an exterior support wall or install floor jack posts in the crawlspace/basement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much filter flow rate (GPH / LPH) does my aquarium need?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As a rule of thumb, low-bioload planted aquariums need 4x to 5x tank volume turnover per hour. Heavily stocked community tanks, African cichlid setups, and saltwater reef tanks require 8x to 10x total volume turnover per hour.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate heater wattage for my aquarium volume?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The standard rule is 3 to 5 watts per net gallon of water. If your room is kept cold (more than 10°F / 5.5°C below target water temperature), use 5 watts per gallon or divide the required wattage across two smaller redundant heaters to protect against failure.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}