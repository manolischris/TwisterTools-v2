"use client";

import React, { useState, useMemo } from "react";
import {
    Shovel,
    Layers,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Scale,
    Truck,
    DollarSign,
    Calculator,
    Package,
    Plus,
    Trash2,
    CheckCircle2
} from "lucide-react";

type MaterialCategory = "mulch" | "topsoil" | "gravel" | "sand" | "compost" | "custom";
type MeasurementSystem = "imperial" | "metric";
type AreaShape = "rectangle" | "circle" | "triangle";
type BagSizeOption = 0.75 | 1.0 | 1.5 | 2.0 | 3.0;

interface LandscapingZone {
    id: string;
    name: string;
    shape: AreaShape;
    lengthFeet: number;
    widthFeet: number;
    diameterFeet: number;
    baseFeet: number;
    heightFeet: number;
    depthInches: number;
    // Metric equivalents
    lengthMeters: number;
    widthMeters: number;
    diameterMeters: number;
    baseMeters: number;
    heightMeters: number;
    depthCentimeters: number;
}

interface MaterialSpec {
    name: string;
    category: MaterialCategory;
    densityLbsPerCuYd: number; // For weight calculation
    recommendedDepthInches: number;
    compactionFactorPct: number; // e.g., 10-15% settling
    typicalCostPerCuYd: number;
    notes: string;
}

const MATERIAL_PRESETS: MaterialSpec[] = [
    {
        name: "Shredded Hardwood Mulch",
        category: "mulch",
        densityLbsPerCuYd: 700,
        recommendedDepthInches: 3,
        compactionFactorPct: 15,
        typicalCostPerCuYd: 38,
        notes: "Ideal for weed prevention and soil moisture retention; replenish every 1-2 years."
    },
    {
        name: "Bark Nuggets / Pine Bark",
        category: "mulch",
        densityLbsPerCuYd: 550,
        recommendedDepthInches: 3,
        compactionFactorPct: 10,
        typicalCostPerCuYd: 45,
        notes: "Longer lasting than shredded mulch; excellent for large garden beds and trees."
    },
    {
        name: "Screened Topsoil / Loam",
        category: "topsoil",
        densityLbsPerCuYd: 2200,
        recommendedDepthInches: 4,
        compactionFactorPct: 20,
        typicalCostPerCuYd: 35,
        notes: "Essential foundation for lawn grading, seed beds, and filling depressions."
    },
    {
        name: "Garden Soil Blend (50/50 Soil + Compost)",
        category: "topsoil",
        densityLbsPerCuYd: 1800,
        recommendedDepthInches: 6,
        compactionFactorPct: 15,
        typicalCostPerCuYd: 48,
        notes: "Optimal nutrient-rich blend for raised garden vegetable boxes and perennials."
    },
    {
        name: "Crushed Stone / Pea Gravel (#57 Gravel)",
        category: "gravel",
        densityLbsPerCuYd: 2700,
        recommendedDepthInches: 2.5,
        compactionFactorPct: 5,
        typicalCostPerCuYd: 55,
        notes: "Great for walkways, driveways, french drains, and fire pit ground cover."
    },
    {
        name: "Decomposed Granite (DG)",
        category: "gravel",
        densityLbsPerCuYd: 2900,
        recommendedDepthInches: 3,
        compactionFactorPct: 15,
        typicalCostPerCuYd: 65,
        notes: "Tamps down into a natural, firm patio or pathway surface."
    },
    {
        name: "Mason Sand / Coarse Sand",
        category: "sand",
        densityLbsPerCuYd: 2600,
        recommendedDepthInches: 2,
        compactionFactorPct: 10,
        typicalCostPerCuYd: 42,
        notes: "Ideal bedding layer under pavers, flagstones, or sandbox applications."
    },
    {
        name: "Organic Mushroom Compost",
        category: "compost",
        densityLbsPerCuYd: 1300,
        recommendedDepthInches: 2,
        compactionFactorPct: 20,
        typicalCostPerCuYd: 40,
        notes: "Rich soil conditioner to till into depleted ground before spring planting."
    }
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

export default function SoilMulchCalculator() {
    // Core Configuration State
    const [unitSystem, setUnitSystem] = useState<MeasurementSystem>("imperial");
    const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
    const [selectedBagSizeCuFt, setSelectedBagSizeCuFt] = useState<BagSizeOption>(2.0);
    const [costPerUnitBulk, setCostPerUnitBulk] = useState<number>(38);
    const [costPerBag, setCostPerBag] = useState<number>(4.5);
    const [compactionBufferPct, setCompactionBufferPct] = useState<number>(10);
    const [materialDensityLbs, setMaterialDensityLbs] = useState<number>(700);

    // Multi-Zone Management State
    const [zones, setZones] = useState<LandscapingZone[]>([
        {
            id: "1",
            name: "Front Flower Bed",
            shape: "rectangle",
            lengthFeet: 25,
            widthFeet: 6,
            diameterFeet: 0,
            baseFeet: 0,
            heightFeet: 0,
            depthInches: 3,
            lengthMeters: 7.6,
            widthMeters: 1.8,
            diameterMeters: 0,
            baseMeters: 0,
            heightMeters: 0,
            depthCentimeters: 7.5
        }
    ]);

    const [copied, setCopied] = useState<boolean>(false);

    // Select Material Preset and sync default pricing & density
    const handleSelectMaterial = (index: number) => {
        setSelectedPresetIndex(index);
        const preset = MATERIAL_PRESETS[index];
        setMaterialDensityLbs(preset.densityLbsPerCuYd);
        setCompactionBufferPct(preset.compactionFactorPct);
        setCostPerUnitBulk(preset.typicalCostPerCuYd);
    };

    // Zone operations
    const handleAddZone = () => {
        const newId = (zones.length + 1).toString();
        const newZone: LandscapingZone = {
            id: newId,
            name: `Zone ${zones.length + 1}`,
            shape: "rectangle",
            lengthFeet: 10,
            widthFeet: 10,
            diameterFeet: 0,
            baseFeet: 0,
            heightFeet: 0,
            depthInches: 3,
            lengthMeters: 3.0,
            widthMeters: 3.0,
            diameterMeters: 0,
            baseMeters: 0,
            heightMeters: 0,
            depthCentimeters: 7.5
        };
        setZones([...zones, newZone]);
    };

    const handleRemoveZone = (id: string) => {
        if (zones.length <= 1) return;
        setZones(zones.filter((z) => z.id !== id));
    };

    const handleUpdateZone = (id: string, field: keyof LandscapingZone, value: any) => {
        setZones((prev) =>
            prev.map((zone) => {
                if (zone.id === id) {
                    return { ...zone, [field]: value };
                }
                return zone;
            })
        );
    };

    // Calculate Total Area, Volume, and Weights
    const calculations = useMemo(() => {
        let totalSqFt = 0;
        let totalNetCuYards = 0;

        zones.forEach((z) => {
            let zoneSqFt = 0;
            let depthFeet = 0;

            if (unitSystem === "imperial") {
                depthFeet = (z.depthInches || 0) / 12;
                if (z.shape === "rectangle") {
                    zoneSqFt = (z.lengthFeet || 0) * (z.widthFeet || 0);
                } else if (z.shape === "circle") {
                    const radius = (z.diameterFeet || 0) / 2;
                    zoneSqFt = Math.PI * Math.pow(radius, 2);
                } else if (z.shape === "triangle") {
                    zoneSqFt = 0.5 * (z.baseFeet || 0) * (z.heightFeet || 0);
                }
            } else {
                // Metric conversion
                depthFeet = ((z.depthCentimeters || 0) / 100) * 3.28084;
                let zoneSqMeters = 0;
                if (z.shape === "rectangle") {
                    zoneSqMeters = (z.lengthMeters || 0) * (z.widthMeters || 0);
                } else if (z.shape === "circle") {
                    const radius = (z.diameterMeters || 0) / 2;
                    zoneSqMeters = Math.PI * Math.pow(radius, 2);
                } else if (z.shape === "triangle") {
                    zoneSqMeters = 0.5 * (z.baseMeters || 0) * (z.heightMeters || 0);
                }
                zoneSqFt = zoneSqMeters * 10.7639;
            }

            const zoneCuFt = zoneSqFt * depthFeet;
            const zoneCuYd = zoneCuFt / 27;

            totalSqFt += zoneSqFt;
            totalNetCuYards += zoneCuYd;
        });

        // Add Compaction / Waste Buffer factor
        const totalGrossCuYards = totalNetCuYards * (1 + compactionBufferPct / 100);
        const totalCuFt = totalGrossCuYards * 27;
        const totalCubicMeters = totalGrossCuYards * 0.764555;
        const totalSquareMeters = totalSqFt * 0.092903;

        // Weight calculations
        const totalWeightLbs = totalGrossCuYards * materialDensityLbs;
        const totalWeightTons = totalWeightLbs / 2000;
        const totalWeightTonnes = totalWeightLbs * 0.000453592;

        // Bagged equivalents
        const bagsRequired = Math.ceil(totalCuFt / selectedBagSizeCuFt);

        // Financial comparison
        const bulkMaterialCost = totalGrossCuYards * costPerUnitBulk;
        const baggedTotalCost = bagsRequired * costPerBag;
        const estimatedDeliveryFee = totalGrossCuYards > 0 ? 55 : 0;
        const bulkTotalWithDelivery = bulkMaterialCost + estimatedDeliveryFee;

        // Pickup truck load approximation (standard 6-foot bed holds approx 1.5 - 2.0 cu yds or ~1500 lbs payload limit)
        const pickupTruckLoadsByVol = Math.ceil(totalGrossCuYards / 1.5);
        const pickupTruckLoadsByWeight = Math.ceil(totalWeightLbs / 1500);
        const estimatedTruckTrips = Math.max(pickupTruckLoadsByVol, pickupTruckLoadsByWeight);

        return {
            totalSqFt: Math.round(totalSqFt * 10) / 10,
            totalSquareMeters: Math.round(totalSquareMeters * 10) / 10,
            netCuYards: Math.round(totalNetCuYards * 100) / 100,
            grossCuYards: Math.round(totalGrossCuYards * 100) / 100,
            totalCuFt: Math.round(totalCuFt * 10) / 10,
            totalCubicMeters: Math.round(totalCubicMeters * 100) / 100,
            totalWeightLbs: Math.round(totalWeightLbs),
            totalWeightTons: Math.round(totalWeightTons * 100) / 100,
            totalWeightTonnes: Math.round(totalWeightTonnes * 100) / 100,
            bagsRequired,
            bulkMaterialCost: Math.round(bulkMaterialCost * 100) / 100,
            bulkTotalWithDelivery: Math.round(bulkTotalWithDelivery * 100) / 100,
            baggedTotalCost: Math.round(baggedTotalCost * 100) / 100,
            costDifference: Math.round(Math.abs(baggedTotalCost - bulkTotalWithDelivery) * 100) / 100,
            isBulkCheaper: bulkTotalWithDelivery <= baggedTotalCost,
            estimatedTruckTrips
        };
    }, [
        zones,
        unitSystem,
        compactionBufferPct,
        materialDensityLbs,
        selectedBagSizeCuFt,
        costPerUnitBulk,
        costPerBag
    ]);

    const handleReset = () => {
        setUnitSystem("imperial");
        setSelectedPresetIndex(0);
        setSelectedBagSizeCuFt(2.0);
        setCostPerUnitBulk(38);
        setCostPerBag(4.5);
        setCompactionBufferPct(10);
        setMaterialDensityLbs(700);
        setZones([
            {
                id: "1",
                name: "Front Flower Bed",
                shape: "rectangle",
                lengthFeet: 25,
                widthFeet: 6,
                diameterFeet: 0,
                baseFeet: 0,
                heightFeet: 0,
                depthInches: 3,
                lengthMeters: 7.6,
                widthMeters: 1.8,
                diameterMeters: 0,
                baseMeters: 0,
                heightMeters: 0,
                depthCentimeters: 7.5
            }
        ]);
    };

    const handleCopyResults = () => {
        const activeMaterial = MATERIAL_PRESETS[selectedPresetIndex]?.name || "Custom Material";
        const text = `Landscaping Material Estimate (${activeMaterial}):
----------------------------------------
Coverage Area: ${calculations.totalSqFt} sq ft (${calculations.totalSquareMeters} m²)
Total Volume Required: ${calculations.grossCuYards} Cubic Yards (${calculations.totalCuFt} cu ft / ${calculations.totalCubicMeters} m³)
Compaction/Waste Buffer Included: +${compactionBufferPct}%
Estimated Material Weight: ${calculations.totalWeightTons} Tons (${calculations.totalWeightLbs} lbs)
----------------------------------------
Bagged Option (${selectedBagSizeCuFt} cu ft bags): ${calculations.bagsRequired} Bags (~$${calculations.baggedTotalCost.toFixed(2)})
Bulk Option (Cubic Yards): ${calculations.grossCuYards} yd³ (~$${calculations.bulkTotalWithDelivery.toFixed(2)} w/ delivery)
Recommended Buying Mode: ${calculations.isBulkCheaper ? "Bulk Delivery" : "Individual Store Bags"} (Saves ~$${calculations.costDifference.toFixed(2)})
Pickup DIY Loads: ~${calculations.estimatedTruckTrips} standard truck beds
----------------------------------------
Calculated at twistertools.com/tools/home-tools/soil-mulch-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Mulch, Soil & Gravel Cubic Yard Estimator",
        "url": "https://twistertools.com/tools/home-tools/soil-mulch-calculator",
        "description": "Calculate exact cubic yards, tons, and bagged quantities for mulch, topsoil, gravel, sand, and compost with multi-zone coverage, compaction adjustments, and bulk vs. bagged cost comparison.",
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
                "name": "How do you calculate cubic yards for mulch, topsoil, or gravel?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The standard landscaping formula is: Area (Square Feet) multiplied by Desired Depth (in Inches), divided by 324. This equals Cubic Yards. Alternatively, calculate Volume in cubic feet (Length × Width × Depth in feet) and divide by 27."
                }
            },
            {
                "@type": "Question",
                "name": "How many bags of mulch or soil make one cubic yard?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "One cubic yard contains 27 cubic feet. Therefore, you need 13.5 bags of standard 2.0 cubic foot mulch, 18 bags of 1.5 cu ft soil, or 27 bags of 1.0 cu ft topsoil/compost to equal one cubic yard."
                }
            },
            {
                "@type": "Question",
                "name": "When is it cheaper to buy bulk cubic yards instead of bagged materials?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bulk delivery is typically more cost-effective whenever your project requires 2.5 to 3 or more cubic yards (roughly 35 to 40+ bags of 2 cu ft mulch). Below 2 cubic yards, local hardware store bags are often cheaper once supplier bulk delivery fees ($40-$80) are factored in."
                }
            },
            {
                "@type": "Question",
                "name": "How deep should I apply mulch, topsoil, and gravel?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard recommended depths are: Shredded hardwood mulch: 3 inches (7.5 cm); New lawn topsoil seedbed: 4 to 6 inches (10-15 cm); Garden bed amendment: 2 to 3 inches of compost; Pea gravel or decorative stone: 2.5 to 3 inches (6-8 cm); Driveway base aggregate: 4 to 6 inches compacted."
                }
            },
            {
                "@type": "Question",
                "name": "Why do I need to add a compaction and waste buffer factor?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Loose organic materials like topsoil and compost settle and compact by 15% to 20% after watering and tamping. Shredded mulch settles by 10% to 15%. Gravel and crushed stone pack together tightly when rolled. Adding a 10% to 15% buffer ensures you do not run short midway through grading."
                }
            },
            {
                "@type": "Question",
                "name": "How much does a cubic yard of gravel, soil, or mulch weigh?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Dry shredded mulch weighs approximately 600 to 800 lbs per cubic yard. Screened topsoil weighs between 2,000 and 2,400 lbs (approx 1.1 tons). Crushed rock and gravel weigh between 2,600 and 2,900 lbs (approx 1.35 to 1.45 tons) per cubic yard."
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

                {/* Left Workspace Panel: Dimensions & Material Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Project Parameters & Zones
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
                                    onClick={() => setUnitSystem("imperial")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Imperial (Feet / Inches)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("metric")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Metric (Meters / cm)
                                </button>
                            </div>
                        </div>

                        {/* Landscaping Material Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Select Material Type
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {MATERIAL_PRESETS.map((preset, idx) => {
                                    const isSelected = selectedPresetIndex === idx;
                                    return (
                                        <button
                                            key={preset.name}
                                            type="button"
                                            onClick={() => handleSelectMaterial(idx)}
                                            className={`p-2.5 text-left rounded-xl border transition text-xs cursor-pointer flex flex-col justify-between ${isSelected
                                                ? "bg-indigo-50/80 border-indigo-400 ring-1 ring-indigo-400"
                                                : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            <span className={`font-bold line-clamp-2 ${isSelected ? "text-indigo-900" : "text-slate-800"}`}>
                                                {preset.name}
                                            </span>
                                            <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                                ~{preset.densityLbsPerCuYd} lbs/yd³
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Coverage Zones List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shovel className="w-4 h-4 text-indigo-600" />
                                    Landscaping Coverage Zones
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddZone}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Zone
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                                {zones.map((zone, zIdx) => (
                                    <div
                                        key={zone.id}
                                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <input
                                                type="text"
                                                value={zone.name}
                                                onChange={(e) => handleUpdateZone(zone.id, "name", e.target.value)}
                                                className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-0.5"
                                            />
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={zone.shape}
                                                    onChange={(e) => handleUpdateZone(zone.id, "shape", e.target.value as AreaShape)}
                                                    className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none"
                                                >
                                                    <option value="rectangle">Rectangle</option>
                                                    <option value="circle">Circular / Ring</option>
                                                    <option value="triangle">Triangle</option>
                                                </select>
                                                {zones.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveZone(zone.id)}
                                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                                                        title="Remove Zone"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dynamic Dimension Inputs */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                            {zone.shape === "rectangle" && (
                                                <>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                            Length ({unitSystem === "imperial" ? "ft" : "m"})
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={unitSystem === "imperial" ? 1 : 0.1}
                                                            value={unitSystem === "imperial" ? (zone.lengthFeet || "") : (zone.lengthMeters || "")}
                                                            onChange={(e) =>
                                                                handleNumberInput(e, (val) =>
                                                                    handleUpdateZone(zone.id, unitSystem === "imperial" ? "lengthFeet" : "lengthMeters", val)
                                                                )
                                                            }
                                                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                            Width ({unitSystem === "imperial" ? "ft" : "m"})
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={unitSystem === "imperial" ? 1 : 0.1}
                                                            value={unitSystem === "imperial" ? (zone.widthFeet || "") : (zone.widthMeters || "")}
                                                            onChange={(e) =>
                                                                handleNumberInput(e, (val) =>
                                                                    handleUpdateZone(zone.id, unitSystem === "imperial" ? "widthFeet" : "widthMeters", val)
                                                                )
                                                            }
                                                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {zone.shape === "circle" && (
                                                <div className="col-span-2">
                                                    <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                        Diameter ({unitSystem === "imperial" ? "ft" : "m"})
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={unitSystem === "imperial" ? 1 : 0.1}
                                                        value={unitSystem === "imperial" ? (zone.diameterFeet || "") : (zone.diameterMeters || "")}
                                                        onChange={(e) =>
                                                            handleNumberInput(e, (val) =>
                                                                handleUpdateZone(zone.id, unitSystem === "imperial" ? "diameterFeet" : "diameterMeters", val)
                                                            )
                                                        }
                                                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </div>
                                            )}

                                            {zone.shape === "triangle" && (
                                                <>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                            Base ({unitSystem === "imperial" ? "ft" : "m"})
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={unitSystem === "imperial" ? 1 : 0.1}
                                                            value={unitSystem === "imperial" ? (zone.baseFeet || "") : (zone.baseMeters || "")}
                                                            onChange={(e) =>
                                                                handleNumberInput(e, (val) =>
                                                                    handleUpdateZone(zone.id, unitSystem === "imperial" ? "baseFeet" : "baseMeters", val)
                                                                )
                                                            }
                                                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                            Height ({unitSystem === "imperial" ? "ft" : "m"})
                                                        </span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step={unitSystem === "imperial" ? 1 : 0.1}
                                                            value={unitSystem === "imperial" ? (zone.heightFeet || "") : (zone.heightMeters || "")}
                                                            onChange={(e) =>
                                                                handleNumberInput(e, (val) =>
                                                                    handleUpdateZone(zone.id, unitSystem === "imperial" ? "heightFeet" : "heightMeters", val)
                                                                )
                                                            }
                                                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <div>
                                                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                                    Depth ({unitSystem === "imperial" ? "in" : "cm"})
                                                </span>
                                                <input
                                                    type="number"
                                                    min={0.5}
                                                    step={unitSystem === "imperial" ? 0.5 : 1}
                                                    value={unitSystem === "imperial" ? (zone.depthInches || "") : (zone.depthCentimeters || "")}
                                                    onChange={(e) =>
                                                        handleNumberInput(e, (val) =>
                                                            handleUpdateZone(zone.id, unitSystem === "imperial" ? "depthInches" : "depthCentimeters", val)
                                                        )
                                                    }
                                                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Compaction & Settling Buffer */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Scale className="w-4 h-4 text-indigo-600" />
                                    Compaction & Waste Buffer
                                </label>
                                <span className="font-bold text-indigo-600 text-sm font-mono">+{compactionBufferPct}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={25}
                                step={5}
                                value={compactionBufferPct}
                                onChange={(e) => setCompactionBufferPct(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                <span>0% (Exact)</span>
                                <span>10% (Mulch/Gravel)</span>
                                <span>15% (Topsoil)</span>
                                <span>20%+ (Compost)</span>
                            </div>
                        </div>

                        {/* Material Pricing & Bag Customization */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Bag Size
                                </label>
                                <select
                                    value={selectedBagSizeCuFt}
                                    onChange={(e) => setSelectedBagSizeCuFt(parseFloat(e.target.value) as BagSizeOption)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value={0.75}>0.75 cu ft (Small/Dense)</option>
                                    <option value={1.0}>1.0 cu ft (Topsoil/Sand)</option>
                                    <option value={1.5}>1.5 cu ft (Standard Soil)</option>
                                    <option value={2.0}>2.0 cu ft (Standard Mulch)</option>
                                    <option value={3.0}>3.0 cu ft (Compressed Bark)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Bulk Cost / yd³ ($)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        value={costPerUnitBulk === 0 ? "" : costPerUnitBulk}
                                        onChange={(e) => handleNumberInput(e, setCostPerUnitBulk)}
                                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Price / Bag ($)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.1}
                                        value={costPerBag === 0 ? "" : costPerBag}
                                        onChange={(e) => handleNumberInput(e, setCostPerBag)}
                                        className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Density: ~{materialDensityLbs} lbs per cu yd
                        </span>
                        <span>{zones.length} Active Zone{zones.length > 1 ? "s" : ""}</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Estimates & Buy Strategy */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Material Requirement Matrix
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                {calculations.totalSqFt} sq ft Total
                            </span>
                        </div>

                        {/* Highlight Hero Output Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Cubic Yards Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-4 h-4 text-indigo-600" /> Bulk Volume
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        +{compactionBufferPct}% Settling
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculations.grossCuYards}
                                    <span className="text-lg font-bold text-slate-600 ml-1.5">yd³</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    {calculations.totalCuFt} cu ft ({calculations.totalCubicMeters} m³)
                                </p>
                            </div>

                            {/* Bagged Requirement Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Package className="w-4 h-4 text-indigo-600" /> Bagged Count
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {selectedBagSizeCuFt} cu ft
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculations.bagsRequired}
                                    <span className="text-lg font-bold text-slate-600 ml-1.5">Bags</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Est. Cost: ${calculations.baggedTotalCost.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Strategic Buying Recommendation Banner */}
                        <div className={`p-4 rounded-xl border flex items-start gap-3 ${calculations.isBulkCheaper
                            ? "bg-emerald-50/80 border-emerald-200"
                            : "bg-amber-50/80 border-amber-200"
                            }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${calculations.isBulkCheaper ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}>
                                {calculations.isBulkCheaper ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className={`font-bold uppercase tracking-wider ${calculations.isBulkCheaper ? "text-emerald-900" : "text-amber-900"
                                    }`}>
                                    Recommended: {calculations.isBulkCheaper ? "Order Bulk Delivery" : "Buy Bagged from Local Store"}
                                </p>
                                <p className={`leading-relaxed ${calculations.isBulkCheaper ? "text-emerald-800" : "text-amber-800"
                                    }`}>
                                    {calculations.isBulkCheaper
                                        ? `Bulk delivery saves you approximately $${calculations.costDifference.toFixed(2)} over buying ${calculations.bagsRequired} bags, even after factoring an estimated $55 local delivery fee.`
                                        : `For smaller projects under 2.5 yd³, buying ${calculations.bagsRequired} bags from your local hardware store is ~$${calculations.costDifference.toFixed(2)} cheaper than paying minimum supplier bulk truck delivery surcharges.`}
                                </p>
                            </div>
                        </div>

                        {/* Weight, Logistics & Hauling Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Est. Total Weight</span>
                                <span className="text-base sm:text-lg font-black text-slate-900">{calculations.totalWeightTons} Tons</span>
                                <span className="text-[10px] text-slate-400 block">({calculations.totalWeightLbs.toLocaleString()} lbs)</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">DIY Pickup Trips</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600">~{calculations.estimatedTruckTrips} Loads</span>
                                <span className="text-[10px] text-slate-400 block">(Standard 6-ft Bed)</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Metric Volume</span>
                                <span className="text-base sm:text-lg font-black text-emerald-600">{calculations.totalCubicMeters} m³</span>
                                <span className="text-[10px] text-slate-400 block">({calculations.totalSquareMeters} m² area)</span>
                            </div>
                        </div>

                        {/* Cost Comparison Breakdown */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                                <span className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    Cost Comparison Matrix
                                </span>
                                <span className="text-slate-400 font-mono">Side-by-Side</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div className="space-y-1 border-r border-slate-800 pr-2">
                                    <span className="text-slate-400 block">Bulk Delivery Estimate:</span>
                                    <span className="text-lg font-black text-white">${calculations.bulkTotalWithDelivery.toFixed(2)}</span>
                                    <p className="text-[11px] text-slate-400 leading-tight">
                                        Material: ${calculations.bulkMaterialCost.toFixed(2)} + ~$55 freight
                                    </p>
                                </div>
                                <div className="space-y-1 pl-2">
                                    <span className="text-slate-400 block">Store Bagged Total:</span>
                                    <span className="text-lg font-black text-white">${calculations.baggedTotalCost.toFixed(2)}</span>
                                    <p className="text-[11px] text-slate-400 leading-tight">
                                        {calculations.bagsRequired} bags @ ${costPerBag.toFixed(2)}/ea
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                            {copied ? "Estimate Copied to Clipboard!" : "Copy Landscape Estimate"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Material Coverage & Weight Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Landscape Material Coverage & Weight Density Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Different landscaping aggregates and organic mulches have drastically distinct bulk densities and settling factors. Use this reference chart to plan hauling logistics, pickup truck load limits, and depth targets.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Material Type</th>
                                    <th className="p-3">Weight / yd³</th>
                                    <th className="p-3">1 yd³ Coverage @ 2"</th>
                                    <th className="p-3">1 yd³ Coverage @ 3"</th>
                                    <th className="p-3">Compaction Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Shredded Bark / Hardwood Mulch</td>
                                    <td className="p-3 font-mono">600 – 800 lbs</td>
                                    <td className="p-3 font-mono">162 sq ft</td>
                                    <td className="p-3 font-mono text-indigo-700 font-bold">108 sq ft</td>
                                    <td className="p-3 text-xs text-slate-600">10% – 15%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Screened Topsoil / Loam</td>
                                    <td className="p-3 font-mono">2,000 – 2,400 lbs (1.1 T)</td>
                                    <td className="p-3 font-mono">162 sq ft</td>
                                    <td className="p-3 font-mono text-indigo-700 font-bold">108 sq ft</td>
                                    <td className="p-3 text-xs text-slate-600">15% – 20%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">#57 Crushed Stone & Pea Gravel</td>
                                    <td className="p-3 font-mono">2,600 – 2,800 lbs (1.35 T)</td>
                                    <td className="p-3 font-mono">162 sq ft</td>
                                    <td className="p-3 font-mono text-indigo-700 font-bold">108 sq ft</td>
                                    <td className="p-3 text-xs text-slate-600">5%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Mason & Coarse Sand</td>
                                    <td className="p-3 font-mono">2,500 – 2,700 lbs (1.3 T)</td>
                                    <td className="p-3 font-mono">162 sq ft</td>
                                    <td className="p-3 font-mono text-indigo-700 font-bold">108 sq ft</td>
                                    <td className="p-3 text-xs text-slate-600">10%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Organic Mushroom Compost</td>
                                    <td className="p-3 font-mono">1,200 – 1,400 lbs</td>
                                    <td className="p-3 font-mono">162 sq ft</td>
                                    <td className="p-3 font-mono text-indigo-700 font-bold">108 sq ft</td>
                                    <td className="p-3 text-xs text-slate-600">20% – 25%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Mathematical Formulas & Geometric Calculations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Calculate Cubic Yards & Bagged Quantities
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cubic volume measures three-dimensional space ($Length \times Width \times Depth$). Because landscape materials are sold in cubic yards while garden bed dimensions are measured in feet and inches, the units must be systematically converted.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> The Master "Rule of 324" Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                To convert square footage directly into cubic yards when depth is in inches:
                                <br />
                                {"$$\\text{Cubic Yards} = \\frac{\\text{Area(sq ft)} \\times \\text{Depth(inches)}}{324}$$"}
                                <em>(Where {"$324 = 27 \\text{cu ft/yd}^3 \\times 12 \\text{inches / ft}$"}).</em>
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-indigo-600" /> Bagged Multiplier Formulas
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Since 1 cubic yard contains precisely 27 cubic feet:
                            </p>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• <strong>2.0 cu ft Bags:</strong> {"$\\text{Cubic Yards} \\times 13.5$"}</li>
                                <li>• <strong>1.5 cu ft Bags:</strong> {"$\\text{Cubic Yards} \\times 18.0$"}</li>
                                <li>• <strong>1.0 cu ft Bags:</strong> {"$\\text{Cubic Yards} \\times 27.0$"}</li>
                            </ul>
                        </div>
                    </div>

                    {/* Non-rectangular area formulas */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Formulas for Irregular Landscaping Beds
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Circular Bed / Tree Ring:</span>
                                <strong className="text-indigo-300">Area = π × (Diameter / 2)²</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Corner Triangle Bed:</span>
                                <strong className="text-indigo-300">Area = 0.5 × Base × Height</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Curved Kidney Bed:</span>
                                <strong className="text-indigo-300">Area ≈ 0.45 × (A + B) × Length</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Bulk Delivery vs Store Bags Cost Analysis */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Bulk Dump Truck Delivery vs Bagged Retail Logistics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Deciding between picking up bagged material or hiring a bulk dump truck involves weighing total square footage, delivery fees, and labor logistics.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Option 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Option A: Bagged Store Pickups</span>
                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Best Under 2.5 yd³</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                                <li><strong>Advantages:</strong> Clean to transport in car trunks/SUVs; store unopened bags indefinitely; easy to carry directly to backyards.</li>
                                <li><strong>Disadvantages:</strong> Generating 30–50 heavy plastic bags produces landfill waste and costs 40% to 60% more per volume.</li>
                                <li><strong>Weight Warning:</strong> 30 bags of wet soil weigh ~1,500 lbs, exceeding standard passenger sedan payload capacities.</li>
                            </ul>
                        </div>

                        {/* Option 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Option B: Bulk Yard Dump Truck</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Best for 3.0+ yd³</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
                                <li><strong>Advantages:</strong> Drastically cheaper per cubic yard; zero plastic waste; fast single-drop delivery.</li>
                                <li><strong>Disadvantages:</strong> Minimum $40–$80 delivery freight charge; dumps a large pile in your driveway that must be moved promptly to prevent lawn kill.</li>
                                <li><strong>Driveway Tip:</strong> Lay a heavy tarp before the truck unloads to ensure easy shovel cleanup.</li>
                            </ul>
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
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate cubic yards for mulch, topsoil, or gravel?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The standard landscaping formula is: Area (Square Feet) multiplied by Desired Depth (in Inches), divided by 324. This equals Cubic Yards. Alternatively, calculate Volume in cubic feet (Length × Width × Depth in feet) and divide by 27.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many bags of mulch or soil make one cubic yard?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                One cubic yard contains 27 cubic feet. Therefore, you need 13.5 bags of standard 2.0 cubic foot mulch, 18 bags of 1.5 cu ft soil, or 27 bags of 1.0 cu ft topsoil/compost to equal one cubic yard.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is it cheaper to buy bulk cubic yards instead of bagged materials?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Bulk delivery is typically more cost-effective whenever your project requires 2.5 to 3 or more cubic yards (roughly 35 to 40+ bags of 2 cu ft mulch). Below 2 cubic yards, local hardware store bags are often cheaper once supplier bulk delivery fees ($40-$80) are factored in.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How deep should I apply mulch, topsoil, and gravel?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard recommended depths are: Shredded hardwood mulch: 3 inches (7.5 cm); New lawn topsoil seedbed: 4 to 6 inches (10-15 cm); Garden bed amendment: 2 to 3 inches of compost; Pea gravel or decorative stone: 2.5 to 3 inches (6-8 cm); Driveway base aggregate: 4 to 6 inches compacted.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do I need to add a compaction and waste buffer factor?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Loose organic materials like topsoil and compost settle and compact by 15% to 20% after watering and tamping. Shredded mulch settles by 10% to 15%. Gravel and crushed stone pack together tightly when rolled. Adding a 10% to 15% buffer ensures you do not run short midway through grading.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much does a cubic yard of gravel, soil, or mulch weigh?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Dry shredded mulch weighs approximately 600 to 800 lbs per cubic yard. Screened topsoil weighs between 2,000 and 2,400 lbs (approx 1.1 tons). Crushed rock and gravel weigh between 2,600 and 2,900 lbs (approx 1.35 to 1.45 tons) per cubic yard.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}