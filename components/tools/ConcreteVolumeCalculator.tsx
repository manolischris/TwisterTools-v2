"use client";

import React, { useState, useMemo } from "react";
import {
    Boxes,
    Calculator,
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
    Scale,
    Building2,
    Truck,
    Percent,
    ArrowRight
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type StructureShape = "slab" | "footing" | "column" | "curb";

interface ProjectPreset {
    name: string;
    shape: StructureShape;
    thicknessInches: number;
    description: string;
    wasteDefault: number;
}

const PROJECT_PRESETS: ProjectPreset[] = [
    { name: "Standard Patio Slab (4\")", shape: "slab", thicknessInches: 4, description: "Residential walkways, patios, and sheds", wasteDefault: 10 },
    { name: "Heavy-Duty Driveway (6\")", shape: "slab", thicknessInches: 6, description: "Passenger vehicle and truck parking pads", wasteDefault: 10 },
    { name: "Structural Garage Slab (8\")", shape: "slab", thicknessInches: 8, description: "Heavy vehicle shops & machinery footers", wasteDefault: 10 },
    { name: "Standard Strip Footing (12\"×24\")", shape: "footing", thicknessInches: 12, description: "Continuous foundation wall bearing footing", wasteDefault: 12 },
    { name: "Round Deck Pier (12\" Sonotube)", shape: "column", thicknessInches: 48, description: "Post pier below frost line (4ft deep)", wasteDefault: 10 },
    { name: "Curb & Gutter Section", shape: "curb", thicknessInches: 6, description: "Landscape border and edge retention", wasteDefault: 10 },
];

const sanitizeNumberInput = (
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

export default function ConcreteVolumeCalculator() {
    // Core State
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [shape, setShape] = useState<StructureShape>("slab");

    // Dimensions (Internal values stored in standard Imperial: Feet / Inches / Quantity)
    const [length, setLength] = useState<number>(20); // Feet (or Meters in metric view)
    const [width, setWidth] = useState<number>(10);   // Feet (or Meters in metric view)
    const [thickness, setThickness] = useState<number>(4); // Inches (or Centimeters in metric view)
    const [diameter, setDiameter] = useState<number>(12); // Inches (or Centimeters in metric view) for columns
    const [height, setHeight] = useState<number>(4); // Feet (or Meters in metric view) for columns/footings
    const [quantity, setQuantity] = useState<number>(1);

    // Waste and Cost State
    const [wastePercent, setWastePercent] = useState<number>(10);
    const [costPerUnit, setCostPerUnit] = useState<number>(145); // USD per Cu Yd or Cu M

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Primary Volume Calculations
    const calculations = useMemo(() => {
        let rawCubicFeet = 0;

        if (unitSystem === "imperial") {
            if (shape === "slab") {
                // Length(ft) * Width(ft) * Thickness(ft) * Quantity
                const thicknessFt = thickness / 12;
                rawCubicFeet = length * width * thicknessFt * quantity;
            } else if (shape === "footing") {
                // Length(ft) * Width(ft) * Depth(ft) * Quantity
                const depthFt = thickness / 12;
                rawCubicFeet = length * width * depthFt * quantity;
            } else if (shape === "column") {
                // Cylinder: π * r^2 * h
                const radiusFt = (diameter / 2) / 12;
                rawCubicFeet = Math.PI * Math.pow(radiusFt, 2) * height * quantity;
            } else if (shape === "curb") {
                const depthFt = thickness / 12;
                rawCubicFeet = length * width * depthFt * quantity;
            }
        } else {
            // Metric Inputs (Meters and Centimeters)
            let rawCubicMeters = 0;
            if (shape === "slab" || shape === "footing" || shape === "curb") {
                const thicknessM = thickness / 100;
                rawCubicMeters = length * width * thicknessM * quantity;
            } else if (shape === "column") {
                const radiusM = (diameter / 2) / 100;
                rawCubicMeters = Math.PI * Math.pow(radiusM, 2) * height * quantity;
            }
            // 1 m³ = 35.3147 ft³
            rawCubicFeet = rawCubicMeters * 35.3146667;
        }

        const cubicYardsNet = rawCubicFeet / 27;
        const cubicMetersNet = rawCubicFeet * 0.0283168;

        // Waste Factor
        const wasteMultiplier = 1 + (wastePercent / 100);
        const cubicYardsGross = cubicYardsNet * wasteMultiplier;
        const cubicMetersGross = cubicMetersNet * wasteMultiplier;
        const cubicFeetGross = rawCubicFeet * wasteMultiplier;

        // Pre-mix Bag Estimation (Based on 1 Cu Yd = 27 cu ft)
        // 80 lb bag yields ~0.60 cu ft
        // 60 lb bag yields ~0.45 cu ft
        // 50 lb bag yields ~0.375 cu ft
        // 40 lb bag yields ~0.30 cu ft
        // Metric 25kg bag yields ~0.012 m³
        const bags80lb = Math.ceil(cubicFeetGross / 0.60);
        const bags60lb = Math.ceil(cubicFeetGross / 0.45);
        const bags50lb = Math.ceil(cubicFeetGross / 0.375);
        const bags40lb = Math.ceil(cubicFeetGross / 0.30);
        const bags25kg = Math.ceil(cubicMetersGross / 0.012);

        // Truckloads (Standard transit mixer is 9-10 cubic yards)
        const truckloads = Math.ceil(cubicYardsGross / 9);

        // Approximate weight (approx 145 lbs/cu ft or 2,322 kg/m³)
        const totalWeightLbs = Math.round(cubicFeetGross * 145);
        const totalWeightTons = (totalWeightLbs / 2000).toFixed(2);
        const totalWeightKg = Math.round(cubicMetersGross * 2322);

        // Cost Estimates
        const totalEstimatedCost = unitSystem === "imperial"
            ? cubicYardsGross * costPerUnit
            : cubicMetersGross * costPerUnit;

        return {
            netCubicYards: Number(cubicYardsNet.toFixed(2)),
            grossCubicYards: Number(cubicYardsGross.toFixed(2)),
            netCubicMeters: Number(cubicMetersNet.toFixed(2)),
            grossCubicMeters: Number(cubicMetersGross.toFixed(2)),
            grossCubicFeet: Number(cubicFeetGross.toFixed(1)),
            bags80lb,
            bags60lb,
            bags50lb,
            bags40lb,
            bags25kg,
            truckloads,
            totalWeightLbs,
            totalWeightTons,
            totalWeightKg,
            totalEstimatedCost: Number(totalEstimatedCost.toFixed(2))
        };
    }, [unitSystem, shape, length, width, thickness, diameter, height, quantity, wastePercent, costPerUnit]);

    const handlePresetSelect = (preset: ProjectPreset) => {
        setShape(preset.shape);
        setWastePercent(preset.wasteDefault);
        if (unitSystem === "imperial") {
            setThickness(preset.thicknessInches);
        } else {
            setThickness(Math.round(preset.thicknessInches * 2.54));
        }
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setShape("slab");
        setLength(20);
        setWidth(10);
        setThickness(4);
        setDiameter(12);
        setHeight(4);
        setQuantity(1);
        setWastePercent(10);
        setCostPerUnit(145);
    };

    const handleCopy = () => {
        const text = `Concrete Volume Estimate Summary:
----------------------------------------
Project Type: ${shape.toUpperCase()} (${quantity} unit${quantity > 1 ? "s" : ""})
Dimensions: ${shape === "column" ? `Dia: ${diameter}${unitSystem === "imperial" ? "in" : "cm"}, H: ${height}${unitSystem === "imperial" ? "ft" : "m"}` : `L: ${length}${unitSystem === "imperial" ? "ft" : "m"}, W: ${width}${unitSystem === "imperial" ? "ft" : "m"}, Depth: ${thickness}${unitSystem === "imperial" ? "in" : "cm"}`}
Safety Waste Buffer: +${wastePercent}%

REQUIRED TOTAL ORDER:
• Cubic Yards: ${calculations.grossCubicYards} yd³ (Net: ${calculations.netCubicYards} yd³)
• Cubic Meters: ${calculations.grossCubicMeters} m³ (Net: ${calculations.netCubicMeters} m³)
• Cubic Feet: ${calculations.grossCubicFeet} ft³

PRE-MIXED BAG REQUIREMENTS:
• 80 lb Bags: ${calculations.bags80lb} bags
• 60 lb Bags: ${calculations.bags60lb} bags
• 50 lb Bags: ${calculations.bags50lb} bags
• 25 kg Bags: ${calculations.bags25kg} bags

ESTIMATED WEIGHT & TRUCKS:
• Total Weight: ${calculations.totalWeightTons} Tons (${calculations.totalWeightKg} kg)
• Standard Ready-Mix Trucks (9 yd³): ${calculations.truckloads}
• Estimated Material Cost: $${calculations.totalEstimatedCost}
----------------------------------------
Calculated via twistertools.com/tools/home-tools/concrete-volume-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Concrete Slab & Footing Volume Estimator",
        "url": "https://twistertools.com/tools/home-tools/concrete-volume-calculator",
        "description": "Calculate exact concrete volume in cubic yards, cubic meters, and pre-mixed bag counts (80lb, 60lb, 50lb) for slabs, footings, post holes, and sonotube piers.",
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
                "name": "How do you calculate concrete volume for a rectangular slab?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Convert all dimensions to feet: Multiply Length (ft) × Width (ft) × Thickness in Feet (Inches ÷ 12) to get total Cubic Feet. Then divide total Cubic Feet by 27 to find Cubic Yards. Always add 10% for uneven sub-base excavation and spillage."
                }
            },
            {
                "@type": "Question",
                "name": "How many bags of concrete do I need for 1 cubic yard?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "One cubic yard equals 27 cubic feet. It requires forty-five (45) 80-pound bags, sixty (60) 60-pound bags, or seventy-two (72) 50-pound bags of pre-mixed concrete to pour exactly one cubic yard."
                }
            },
            {
                "@type": "Question",
                "name": "Why is adding a 10% to 15% waste margin necessary for concrete orders?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sub-grade excavation is rarely laser flat, sub-base gravel compacts unevenly, wooden form boards deflect under hydrostatic fluid concrete pressure, and residual material remains inside pump lines and mixer chutes. Under-ordering results in cold joints, compromising structural slab integrity."
                }
            },
            {
                "@type": "Question",
                "name": "What is the recommended minimum thickness for driveways and patios?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Patios, walkways, and shed pads require a minimum thickness of 4 inches (100 mm). Driveways and garage slabs handling passenger vehicles should be at least 5 to 6 inches thick, reinforced with #4 rebar or welded wire reinforcement over a 4-inch compacted crushed aggregate base."
                }
            },
            {
                "@type": "Question",
                "name": "When should I order a ready-mix truck instead of mixing bags?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If your project requires more than 1.5 to 2 cubic yards (60–90 eighty-pound bags), ordering a ready-mix transit delivery is strongly advised. Hand mixing large volumes causes fatigue, prolongs pouring time, and risks cold joints where subsequent batches fail to bond seamlessly."
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

                {/* Left Workspace Panel: Dimensions and Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Project Configuration & Shape
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit Scale & Shape Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                        Imperial (ft/in)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUnitSystem("metric")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Metric (m/cm)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Structure Geometry
                                </label>
                                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setShape("slab")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${shape === "slab" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Slab
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShape("footing")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${shape === "footing" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Footing
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShape("column")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${shape === "column" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Column / Pier
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dimensional Parameter Inputs */}
                        <div className="space-y-4">
                            {shape !== "column" ? (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Length ({unitSystem === "imperial" ? "Feet" : "Meters"})
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0.1}
                                                    step={0.5}
                                                    value={length === 0 ? "" : length}
                                                    onChange={(e) => sanitizeNumberInput(e, setLength)}
                                                    className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <span className="text-sm font-bold text-slate-500 min-w-[28px]">{unitSystem === "imperial" ? "ft" : "m"}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Width ({unitSystem === "imperial" ? "Feet" : "Meters"})
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={0.1}
                                                    step={0.5}
                                                    value={width === 0 ? "" : width}
                                                    onChange={(e) => sanitizeNumberInput(e, setWidth)}
                                                    className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <span className="text-sm font-bold text-slate-500 min-w-[28px]">{unitSystem === "imperial" ? "ft" : "m"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    {shape === "slab" ? "Slab Thickness" : "Footing Depth"} ({unitSystem === "imperial" ? "Inches" : "Centimeters"})
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={0.5}
                                                    value={thickness === 0 ? "" : thickness}
                                                    onChange={(e) => sanitizeNumberInput(e, setThickness)}
                                                    className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <span className="text-sm font-bold text-slate-500 min-w-[28px]">{unitSystem === "imperial" ? "in" : "cm"}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Number of Sections
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={quantity === 0 ? "" : quantity}
                                                    onChange={(e) => sanitizeNumberInput(e, setQuantity)}
                                                    className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <span className="text-sm font-bold text-slate-500 min-w-[28px]">qty</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Pier Diameter ({unitSystem === "imperial" ? "Inches" : "Centimeters"})
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={4}
                                                step={1}
                                                value={diameter === 0 ? "" : diameter}
                                                onChange={(e) => sanitizeNumberInput(e, setDiameter)}
                                                className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-sm font-bold text-slate-500">{unitSystem === "imperial" ? "in" : "cm"}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Pier Depth/Height ({unitSystem === "imperial" ? "Feet" : "Meters"})
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0.5}
                                                step={0.5}
                                                value={height === 0 ? "" : height}
                                                onChange={(e) => sanitizeNumberInput(e, setHeight)}
                                                className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-sm font-bold text-slate-500">{unitSystem === "imperial" ? "ft" : "m"}</span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Number of Piers
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                step={1}
                                                value={quantity === 0 ? "" : quantity}
                                                onChange={(e) => sanitizeNumberInput(e, setQuantity)}
                                                className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-sm font-bold text-slate-500">holes</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Waste Factor and Price Settings */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Percent className="w-3.5 h-3.5 text-indigo-600" />
                                        Waste & Over-Excavation Margin
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600">{wastePercent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={25}
                                    step={1}
                                    value={wastePercent}
                                    onChange={(e) => setWastePercent(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                    <span>0% (Exact)</span>
                                    <span>10% (Standard)</span>
                                    <span>20% (Rough Base)</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                                    Estimated Ready-Mix Cost ({unitSystem === "imperial" ? "$/yd³" : "$/m³"})
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step={5}
                                        value={costPerUnit === 0 ? "" : costPerUnit}
                                        onChange={(e) => sanitizeNumberInput(e, setCostPerUnit)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-xs font-bold text-slate-500">{unitSystem === "imperial" ? "USD/yd³" : "USD/m³"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Standard Construction Depth Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {PROJECT_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handlePresetSelect(preset)}
                                        className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs cursor-pointer group"
                                    >
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{preset.name}</p>
                                        <p className="text-[11px] text-slate-500 truncate">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Includes +{wastePercent}% safety & formwork deflection buffer
                        </span>
                        <span>Standard Density (145 lb/ft³)</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Summary & Ready-Mix / Bag Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Order & Volume Summary
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                                Ready to Order
                            </span>
                        </div>

                        {/* Primary Highlight Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Truck className="w-4 h-4 text-indigo-600" /> Total Ready-Mix Volume
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        +{wastePercent}% Buffer
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {calculations.grossCubicYards} <span className="text-lg font-bold text-slate-600">yd³</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Net exact: {calculations.netCubicYards} yd³ ({calculations.grossCubicMeters} m³)
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="w-4 h-4 text-indigo-600" /> Est. Material Cost
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-bold">
                                        @ ${costPerUnit}/{unitSystem === "imperial" ? "yd³" : "m³"}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    ${calculations.totalEstimatedCost.toLocaleString()}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Estimated weight: {calculations.totalWeightTons} US Tons
                                </p>
                            </div>
                        </div>

                        {/* Pre-Mix Bags Grid */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                <Boxes className="w-4 h-4 text-indigo-600" />
                                Pre-Mixed Dry Bag Equivalents (Includes {wastePercent}% Waste)
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 block uppercase">80 lb Bags</span>
                                    <span className="text-lg sm:text-xl font-black text-indigo-600">{calculations.bags80lb}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">0.60 cu ft/bag</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 block uppercase">60 lb Bags</span>
                                    <span className="text-lg sm:text-xl font-black text-indigo-600">{calculations.bags60lb}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">0.45 cu ft/bag</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 block uppercase">50 lb Bags</span>
                                    <span className="text-lg sm:text-xl font-black text-indigo-600">{calculations.bags50lb}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">0.375 cu ft/bag</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                    <span className="text-[11px] font-bold text-slate-500 block uppercase">25 kg Bags</span>
                                    <span className="text-lg sm:text-xl font-black text-indigo-600">{calculations.bags25kg}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">0.012 m³/bag</span>
                                </div>
                            </div>
                        </div>

                        {/* Logistics & Delivery Logistics Directive */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <Truck className="w-4 h-4 text-indigo-400" /> Delivery Logistics & Pour Method
                                </span>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                    {calculations.grossCubicYards >= 1.5 ? "Order Transit Mixer Truck" : "Bag Mixing Feasible"}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {calculations.grossCubicYards >= 1.5 ? (
                                    <>
                                        This project requires <strong>{calculations.grossCubicYards} cubic yards</strong> ({calculations.bags80lb} bags). Ordering a standard 9–10 yard ready-mix delivery truck ({calculations.truckloads} load{calculations.truckloads > 1 ? "s" : ""}) is strongly advised to prevent cold joints and physical fatigue.
                                    </>
                                ) : (
                                    <>
                                        This project requires small volume (<strong>{calculations.grossCubicYards} yd³</strong> / {calculations.bags80lb} bags of 80lb). Mixing on-site with a portable drum mixer or wheelbarrow is cost-effective and avoids ready-mix short-load fees.
                                    </>
                                )}
                            </p>
                        </div>

                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Estimate Copied to Clipboard!" : "Copy Order Summary"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD DETAILED CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Concrete Mix & Bag Coverage Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Concrete Bag Coverage & Cubic Yard Lookup Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Pre-packaged concrete bags (such as Quikrete or Sakrete) are formulated with dry Portland cement, sand, and coarse aggregate. Because pre-mix packaging is classified by total weight rather than fluid yield, refer to this benchmark coverage table to determine accurate purchasing ratios:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Bag Weight</th>
                                    <th className="p-3">Yield (Cubic Feet)</th>
                                    <th className="p-3">Yield (Cubic Meters)</th>
                                    <th className="p-3">Bags Needed per 1 yd³</th>
                                    <th className="p-3">Coverage (4\" Slab)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">80 lb (36.3 kg) Bag</td>
                                    <td className="p-3 font-mono">0.60 cu ft</td>
                                    <td className="p-3 font-mono">0.017 m³</td>
                                    <td className="p-3 font-bold text-indigo-600">45 Bags</td>
                                    <td className="p-3 text-xs">1.8 sq ft</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">60 lb (27.2 kg) Bag</td>
                                    <td className="p-3 font-mono">0.45 cu ft</td>
                                    <td className="p-3 font-mono">0.013 m³</td>
                                    <td className="p-3 font-bold text-indigo-600">60 Bags</td>
                                    <td className="p-3 text-xs">1.35 sq ft</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">50 lb (22.7 kg) Bag</td>
                                    <td className="p-3 font-mono">0.375 cu ft</td>
                                    <td className="p-3 font-mono">0.011 m³</td>
                                    <td className="p-3 font-bold text-indigo-600">72 Bags</td>
                                    <td className="p-3 text-xs">1.125 sq ft</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">40 lb (18.1 kg) Bag</td>
                                    <td className="p-3 font-mono">0.30 cu ft</td>
                                    <td className="p-3 font-mono">0.0085 m³</td>
                                    <td className="p-3 font-bold text-indigo-600">90 Bags</td>
                                    <td className="p-3 text-xs">0.90 sq ft</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-slate-900">25 kg (55.1 lb) Metric Bag</td>
                                    <td className="p-3 font-mono">0.424 cu ft</td>
                                    <td className="p-3 font-mono">0.012 m³</td>
                                    <td className="p-3 font-bold text-indigo-600">64 Bags (83 per m³)</td>
                                    <td className="p-3 text-xs">0.12 m² @ 10cm</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Engineering Formulas & Physics of Concrete Calculation */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Geometric Concrete Volume Formulas & Estimating Principles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating required wet concrete volume requires converting all dimensions into a uniform unit of measurement (feet or meters) prior to calculating three-dimensional volume:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Rectangular Slabs & Footings
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Slab volume is determined by multiplying surface area by thickness. Because thickness is recorded in inches, it must first be divided by 12:
                            </p>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                Cubic Yards = (Length(ft) × Width(ft) × (Thickness(in) / 12)) / 27
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Round Post Holes & Sonotube Piers
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Round piers are calculated as standard right cylinders. Radius is equal to half the diameter in inches divided by 12:
                            </p>
                            <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
                                Cubic Yards = (π × (Diameter(in) / 24)² × Depth(ft)) / 27
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-400" /> The 10% Safety Buffer Requirement
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Ordering exact theoretical volume invariably leads to short pours. Excavated soil naturally varies by ±0.5 inches in depth across rough sub-grade gravel, wooden 2×4 and 2×6 formwork bows outwards under hydraulic pressure, and mixed slurry clings to chutes and wheelbarrows. Adding a <strong>10% to 15% safety allowance</strong> is mandatory structural practice.
                        </p>
                    </div>
                </section>

                {/* Card 3: Ready-Mix Transit vs Bagged Concrete Decision Framework */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Truck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Ready-Mix Transit Delivery vs. Manual Bag Mixing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing between bagged pre-mix and ready-mix delivery depends on total volume, site accessibility, labor availability, and project timelines:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Bagged Pre-Mix (Quikrete / Sakrete)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">&lt; 1.5 yd³ (60 Bags)</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                                <li><strong>Best For:</strong> Deck post piers, small air conditioner pads, mailbox footings, fence posts.</li>
                                <li><strong>Advantages:</strong> Mix on your own schedule; no truck access needed; zero short-load penalty fees.</li>
                                <li><strong>Disadvantages:</strong> Physically exhausting; difficult to maintain consistent water-cement ratio; risk of cold joints.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Ready-Mix Transit Concrete Truck</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">&ge; 2.0 yd³+</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
                                <li><strong>Best For:</strong> Driveways, garage floors, structural home foundations, full patios.</li>
                                <li><strong>Advantages:</strong> Factory batch-plant precision (3,000 to 5,000 PSI); fast single pour ensures structural monolith.</li>
                                <li><strong>Disadvantages:</strong> Requires heavy truck driveway clearance; orders under 4–5 yards incur short-load surcharges ($100–$250).</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Practical Worked Construction Scenarios */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Practical Calculation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review these worked construction engineering examples to verify your project figures:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example A: 12ft × 20ft Patio (4\" Thick)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Slab</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Convert Depth:</strong> 4 inches ÷ 12 = 0.333 ft.</li>
                                <li><strong>Calculate Cubic Feet:</strong> 12 ft × 20 ft × 0.333 ft = 80 cu ft.</li>
                                <li><strong>Convert to Cubic Yards:</strong> 80 ÷ 27 = <strong>2.96 yd³</strong>.</li>
                                <li><strong>Apply 10% Waste:</strong> 2.96 × 1.10 = <strong>3.26 yd³</strong>.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Required: Order 3.5 yd³ ready-mix OR 147 eighty-pound bags.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example B: Eight (8) Deck Piers (12\" Dia × 4ft Deep)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Sonotube</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Radius:</strong> 12 inches ÷ 2 = 6 inches = 0.5 ft.</li>
                                <li><strong>Per-Pier Volume:</strong> π × (0.5)² × 4 ft = 3.14 cu ft.</li>
                                <li><strong>Total Net Volume (8 Piers):</strong> 3.14 × 8 = 25.13 cu ft (<strong>0.93 yd³</strong>).</li>
                                <li><strong>Apply 10% Waste:</strong> 25.13 × 1.10 = 27.64 cu ft (<strong>1.02 yd³</strong>).</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Required: 46 eighty-pound bags (approx. 6 bags per 4-ft tube).
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
                                How do you calculate concrete volume for a rectangular slab?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Convert all dimensions to feet: Multiply Length (ft) × Width (ft) × Thickness in Feet (Inches ÷ 12) to get total Cubic Feet. Then divide total Cubic Feet by 27 to find Cubic Yards. Always add 10% for uneven sub-base excavation and spillage.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many bags of concrete do I need for 1 cubic yard?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                One cubic yard equals 27 cubic feet. It requires forty-five (45) 80-pound bags, sixty (60) 60-pound bags, or seventy-two (72) 50-pound bags of pre-mixed concrete to pour exactly one cubic yard.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is adding a 10% to 15% waste margin necessary for concrete orders?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sub-grade excavation is rarely laser flat, sub-base gravel compacts unevenly, wooden form boards deflect under hydrostatic fluid concrete pressure, and residual material remains inside pump lines and mixer chutes. Under-ordering results in cold joints, compromising structural slab integrity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the recommended minimum thickness for driveways and patios?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Patios, walkways, and shed pads require a minimum thickness of 4 inches (100 mm). Driveways and garage slabs handling passenger vehicles should be at least 5 to 6 inches thick, reinforced with #4 rebar or welded wire reinforcement over a 4-inch compacted crushed aggregate base.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When should I order a ready-mix truck instead of mixing bags?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                If your project requires more than 1.5 to 2 cubic yards (60–90 eighty-pound bags), ordering a ready-mix transit delivery is strongly advised. Hand mixing large volumes causes fatigue, prolongs pouring time, and risks cold joints where subsequent batches fail to bond seamlessly.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}