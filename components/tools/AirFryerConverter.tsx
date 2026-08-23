"use client";

import React, { useState, useMemo } from "react";
import {
    Flame,
    Timer,
    Thermometer,
    ChefHat,
    Utensils,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    AlertCircle,
    ArrowRightLeft,
    Lightbulb,
    Scale,
    ShieldAlert,
    Gauge,
    SlidersHorizontal,
    Search
} from "lucide-react";

type TemperatureUnit = "F" | "C";
type SourceType = "conventional" | "fan";
type FoodCategory = "poultry" | "beef-pork" | "seafood" | "vegetables" | "frozen-snacks" | "baking";

interface PresetItem {
    name: string;
    category: FoodCategory;
    ovenTempF: number;
    ovenTimeMins: number;
    notes: string;
}

const PRESET_RECIPES: PresetItem[] = [
    { name: "French Fries (Frozen)", category: "frozen-snacks", ovenTempF: 400, ovenTimeMins: 22, notes: "Shake basket at 10 mins" },
    { name: "Chicken Wings (Raw)", category: "poultry", ovenTempF: 400, ovenTimeMins: 35, notes: "Pat dry for crispy skin; flip halfway" },
    { name: "Chicken Breast (Boneless)", category: "poultry", ovenTempF: 375, ovenTimeMins: 25, notes: "Internal temp target 165°F (74°C)" },
    { name: "Salmon Fillet (6 oz)", category: "seafood", ovenTempF: 400, ovenTimeMins: 16, notes: "Skin-side down; oil lightly" },
    { name: "Bacon Strips", category: "beef-pork", ovenTempF: 400, ovenTimeMins: 18, notes: "Lay flat in single layer; check at 8 mins" },
    { name: "Pork Chops (1-inch thick)", category: "beef-pork", ovenTempF: 375, ovenTimeMins: 22, notes: "Internal temp target 145°F (63°C)" },
    { name: "Brussels Sprouts (Halved)", category: "vegetables", ovenTempF: 400, ovenTimeMins: 25, notes: "Toss with 1 tsp olive oil and salt" },
    { name: "Broccoli Florets", category: "vegetables", ovenTempF: 400, ovenTimeMins: 18, notes: "Add 1 tbsp water to drip tray to prevent smoke" },
    { name: "Mozzarella Sticks (Frozen)", category: "frozen-snacks", ovenTempF: 425, ovenTimeMins: 12, notes: "Do not overcrowd; watch closely" },
    { name: "Chocolate Chip Cookies", category: "baking", ovenTempF: 350, ovenTimeMins: 12, notes: "Use perforated parchment liner" },
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
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function AirFryerConverter() {
    // Core Calculator State
    const [tempUnit, setTempUnit] = useState<TemperatureUnit>("F");
    const [sourceType, setSourceType] = useState<SourceType>("conventional");
    const [ovenTemp, setOvenTemp] = useState<number>(400);
    const [ovenMinutes, setOvenMinutes] = useState<number>(25);
    const [tempReductionOverride, setTempReductionOverride] = useState<number>(25);
    const [timeReductionPctOverride, setTimeReductionPctOverride] = useState<number>(20);
    const [isCustomRules, setIsCustomRules] = useState<boolean>(false);

    // Filter and Search State for Cheat Sheet
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Synchronize default reduction rules when source type changes
    const effectiveTempReduction = useMemo(() => {
        if (isCustomRules) return tempReductionOverride;
        if (sourceType === "conventional") {
            return tempUnit === "F" ? 25 : 15;
        } else {
            // Convection / Fan oven is already ~25°F cooler than conventional
            return tempUnit === "F" ? 15 : 10;
        }
    }, [isCustomRules, tempReductionOverride, sourceType, tempUnit]);

    const effectiveTimeReductionPct = useMemo(() => {
        if (isCustomRules) return timeReductionPctOverride;
        return sourceType === "conventional" ? 20 : 15;
    }, [isCustomRules, timeReductionPctOverride, sourceType]);

    // Conversion Calculations
    const conversionResult = useMemo(() => {
        // Temperature Conversion
        const airFryerTemp = Math.max(100, ovenTemp - effectiveTempReduction);

        // Converted alternate temperature
        let altTemp = 0;
        let altUnit: TemperatureUnit = "C";
        if (tempUnit === "F") {
            altTemp = Math.round(((airFryerTemp - 32) * 5) / 9);
            altUnit = "C";
        } else {
            altTemp = Math.round((airFryerTemp * 9) / 5 + 32);
            altUnit = "F";
        }

        // Time Conversion
        const calculatedMinutes = ovenMinutes * (1 - effectiveTimeReductionPct / 100);
        const airFryerTotalSeconds = Math.round(calculatedMinutes * 60);
        const finalMinutes = Math.floor(airFryerTotalSeconds / 60);
        const finalSeconds = airFryerTotalSeconds % 60;
        const checkHalfwayMinutes = Math.floor(finalMinutes / 2);
        const checkHalfwaySeconds = Math.round((finalMinutes % 2) * 30 + finalSeconds / 2);

        // Preheating Energy Savings Estimate (approx 1500W air fryer vs 3000W oven over time)
        const ovenKwh = (3.0 * (ovenMinutes + 15)) / 60;
        const airFryerKwh = (1.5 * (calculatedMinutes + 3)) / 60;
        const energySavedPct = Math.round(((ovenKwh - airFryerKwh) / ovenKwh) * 100);

        return {
            airFryerTemp,
            altTemp,
            altUnit,
            finalMinutes,
            finalSeconds,
            checkHalfwayMinutes,
            checkHalfwaySeconds,
            energySavedPct: Math.max(0, energySavedPct),
            timeSavedMinutes: Math.max(0, ovenMinutes - finalMinutes),
        };
    }, [ovenTemp, ovenMinutes, effectiveTempReduction, effectiveTimeReductionPct, tempUnit]);

    // Preset Selector Handler
    const handleSelectPreset = (preset: PresetItem) => {
        let temp = preset.ovenTempF;
        if (tempUnit === "C") {
            temp = Math.round(((temp - 32) * 5) / 9 / 5) * 5; // Round to nearest 5°C
        }
        setOvenTemp(temp);
        setOvenMinutes(preset.ovenTimeMins);
    };

    const handleUnitSwitch = (newUnit: TemperatureUnit) => {
        if (newUnit === tempUnit) return;
        if (newUnit === "C") {
            setOvenTemp(Math.round(((ovenTemp - 32) * 5) / 9 / 5) * 5);
        } else {
            setOvenTemp(Math.round((ovenTemp * 9) / 5 + 32));
        }
        setTempUnit(newUnit);
    };

    const handleReset = () => {
        setTempUnit("F");
        setSourceType("conventional");
        setOvenTemp(400);
        setOvenMinutes(25);
        setIsCustomRules(false);
        setTempReductionOverride(25);
        setTimeReductionPctOverride(20);
        setSearchQuery("");
        setSelectedCategory("all");
    };

    const handleCopyResults = () => {
        const text = `Air Fryer Recipe Conversion:
----------------------------------------
Original Oven Recipe: ${ovenTemp}°${tempUnit} for ${ovenMinutes} mins (${sourceType} oven)
Air Fryer Temperature: ${conversionResult.airFryerTemp}°${tempUnit} (${conversionResult.altTemp}°${conversionResult.altUnit})
Air Fryer Cook Time: ${conversionResult.finalMinutes}m ${conversionResult.finalSeconds > 0 ? `${conversionResult.finalSeconds}s` : ""}
First Shake/Check Point: At ${conversionResult.checkHalfwayMinutes}m ${conversionResult.checkHalfwaySeconds > 0 ? `${conversionResult.checkHalfwaySeconds}s` : ""}
Est. Energy Saved: ~${conversionResult.energySavedPct}%
----------------------------------------
Converted via twistertools.com/tools/home-tools/air-fryer-converter`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredPresets = useMemo(() => {
        return PRESET_RECIPES.filter((item) => {
            const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.notes.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Air Fryer Time & Oven Temperature Conversion Matrix",
        "url": "https://twistertools.com/tools/home-tools/air-fryer-converter",
        "description": "Convert conventional and convection oven cooking times and temperatures into precise air fryer settings with customized time reduction and halfway shake alerts.",
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
                "name": "What is the general golden rule for converting oven recipes to an air fryer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The industry standard formula is the 25/20 Rule: Reduce the conventional oven temperature by 25°F (approx 15°C) and reduce the total cook time by 20%. Because air fryers use concentrated high-velocity convection in a small cavity, heat transfer is significantly faster."
                }
            },
            {
                "@type": "Question",
                "name": "Should I convert differently if my recipe is already for a fan-assisted (convection) oven?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Fan-forced convection ovens have already lowered temperature expectations compared to conventional radiant ovens. When converting from a convection oven recipe to an air fryer, reduce the temperature by only 10°F to 15°F (5°C to 10°C) and decrease time by 15%."
                }
            },
            {
                "@type": "Question",
                "name": "Why is it critical to shake or flip food halfway through air frying?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most air fryer heating elements and high-speed fans are positioned directly above the basket. Shaking or flipping food halfway ensures uniform Maillard browning, prevents hot-spot burning, and redistributes moisture on the lower contact surfaces."
                }
            },
            {
                "@type": "Question",
                "name": "Do I need to preheat my air fryer before cooking?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While air fryers heat rapidly, preheating for 2 to 3 minutes is highly recommended for proteins, steaks, and breaded items to instantly sear the exterior and prevent soggy breading. For delicate baked goods or reheating pizza, preheating is optional."
                }
            },
            {
                "@type": "Question",
                "name": "Can I put aluminum foil or baking parchment paper in an air fryer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, but with strict safety precautions: Never place loose parchment paper or foil into the basket during preheating. The high-velocity airflow can blow light paper directly into the exposed heating element, creating an immediate fire hazard. Always weigh down liners with food."
                }
            },
            {
                "@type": "Question",
                "name": "How much energy does an air fryer save compared to a standard electric oven?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An average air fryer draws 1,400 to 1,800 watts and requires no long 15-minute warm-up, whereas a standard electric wall oven consumes 2,500 to 4,000 watts. Because air fryers cook roughly 20% faster in a tiny space, total electricity usage is reduced by 50% to 70% per meal."
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

                {/* Left Workspace Panel: Recipe Input & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-indigo-600" />
                                Oven Recipe Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit and Source Selection */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Temperature Scale
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSwitch("F")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${tempUnit === "F" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Fahrenheit (°F)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSwitch("C")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${tempUnit === "C" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Celsius (°C)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Source Oven Type
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setSourceType("conventional")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${sourceType === "conventional" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Conventional
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSourceType("fan")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${sourceType === "fan" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Fan / Convection
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Oven Temperature & Time Input Sliders / Numbers */}
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Thermometer className="w-4 h-4 text-indigo-600" />
                                        Original Recipe Temperature
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={tempUnit === "F" ? 150 : 70}
                                            max={tempUnit === "F" ? 550 : 290}
                                            value={ovenTemp === 0 ? "" : ovenTemp}
                                            onChange={(e) => handleNumberInput(e, setOvenTemp)}
                                            className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-sm font-bold text-slate-600">°{tempUnit}</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={tempUnit === "F" ? 250 : 120}
                                    max={tempUnit === "F" ? 475 : 245}
                                    step={tempUnit === "F" ? 5 : 5}
                                    value={ovenTemp}
                                    onChange={(e) => setOvenTemp(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                    <span>{tempUnit === "F" ? "250°F (Low Bake)" : "120°C (Low Bake)"}</span>
                                    <span>{tempUnit === "F" ? "375°F (Standard)" : "190°C (Standard)"}</span>
                                    <span>{tempUnit === "F" ? "475°F (High Roast)" : "245°C (High Roast)"}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Timer className="w-4 h-4 text-indigo-600" />
                                        Original Recipe Cooking Time
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={1}
                                            max={180}
                                            value={ovenMinutes === 0 ? "" : ovenMinutes}
                                            onChange={(e) => handleNumberInput(e, setOvenMinutes)}
                                            className="w-20 px-2 py-1 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-sm font-bold text-slate-600">min</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={90}
                                    step={1}
                                    value={ovenMinutes}
                                    onChange={(e) => setOvenMinutes(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                    <span>5 mins</span>
                                    <span>30 mins</span>
                                    <span>60 mins</span>
                                    <span>90 mins</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Preset Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Quick Recipe Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {PRESET_RECIPES.slice(0, 6).map((item) => (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => handleSelectPreset(item)}
                                        className="p-2 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs cursor-pointer group"
                                    >
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{item.name}</p>
                                        <p className="text-[11px] text-slate-500">{item.ovenTempF}°F • {item.ovenTimeMins}m</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Custom Reduction Rules (Toggleable) */}
                        <div className="pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsCustomRules(!isCustomRules)}
                                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {isCustomRules ? "Custom Conversion Modifiers (Active)" : "Customize Conversion Modifiers"}
                                </span>
                                <span>{isCustomRules ? "Hide" : "Show"}</span>
                            </button>

                            {isCustomRules && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-700">Temp Reduction:</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={0}
                                                max={50}
                                                value={tempReductionOverride}
                                                onChange={(e) => handleNumberInput(e, setTempReductionOverride)}
                                                className="w-16 px-1.5 py-0.5 text-right font-bold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                            />
                                            <span className="font-bold">°{tempUnit}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-700">Time Reduction:</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={0}
                                                max={50}
                                                value={timeReductionPctOverride}
                                                onChange={(e) => handleNumberInput(e, setTimeReductionPctOverride)}
                                                className="w-16 px-1.5 py-0.5 text-right font-bold text-slate-800 bg-white border border-slate-300 rounded text-xs"
                                            />
                                            <span className="font-bold">%</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Rule: -{effectiveTempReduction}°{tempUnit} & -{effectiveTimeReductionPct}% Time
                        </span>
                        <span>High-Velocity Convection</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Converted Air Fryer Matrix & Insights */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-indigo-600" />
                                Air Fryer Target Settings
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                                Ready to Cook
                            </span>
                        </div>

                        {/* Highlight Hero Output Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Converted Temp Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Thermometer className="w-4 h-4 text-indigo-600" /> Target Heat
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        -{effectiveTempReduction}°{tempUnit}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {conversionResult.airFryerTemp}°{tempUnit}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Equivalent: {conversionResult.altTemp}°{conversionResult.altUnit}
                                </p>
                            </div>

                            {/* Converted Time Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Timer className="w-4 h-4 text-indigo-600" /> Target Time
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        -{effectiveTimeReductionPct}%
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {conversionResult.finalMinutes}
                                    <span className="text-lg font-bold text-slate-600 ml-1">m</span>
                                    {conversionResult.finalSeconds > 0 && (
                                        <>
                                            {" "}
                                            {conversionResult.finalSeconds}
                                            <span className="text-lg font-bold text-slate-600 ml-0.5">s</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Saved: {conversionResult.timeSavedMinutes} mins vs oven
                                </p>
                            </div>
                        </div>

                        {/* Halfway Action Alert Banner */}
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                                <ArrowRightLeft className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold text-amber-900 uppercase tracking-wider">
                                    Halfway Shake & Turn Point: At {conversionResult.checkHalfwayMinutes}m {conversionResult.checkHalfwaySeconds > 0 ? `${conversionResult.checkHalfwaySeconds}s` : ""}
                                </p>
                                <p className="text-amber-800 leading-relaxed">
                                    Pull the basket to shake veggies or flip proteins. This redistributes airflow and ensures an evenly crisp, golden Maillard crust without hot spots.
                                </p>
                            </div>
                        </div>

                        {/* Analytical Comparison Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Est. Energy Saved</span>
                                <span className="text-base sm:text-lg font-black text-emerald-600">~{conversionResult.energySavedPct}%</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Preheat Time</span>
                                <span className="text-base sm:text-lg font-black text-slate-800">2 – 3 mins</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Basket Density</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600">Single Layer</span>
                            </div>
                        </div>

                        {/* Chef Air Frying Pro Tips */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4 text-amber-400" />
                                Chef Cooking Directives
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li><strong>Never Overcrowd:</strong> Air circulation is crucial; stacking causes soggy steaming.</li>
                                <li><strong>Oil Lightly:</strong> 1 teaspoon of high-smoke point oil (avocado/canola) maximizes crispness.</li>
                                <li><strong>Internal Temp:</strong> Always verify poultry reaches 165°F (74°C) with an instant-read thermometer.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Conversion Copied!" : "Copy Conversion Summary"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Interactive Cheat Sheet & Master Conversion Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Utensils className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Air Fryer Conversion Cheat Sheet & Food Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this master lookup table to convert traditional oven recipes for common foods. Filter by food category or search for specific ingredients to view recommended temperatures, cook times, and chef handling notes.
                    </p>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search food (e.g., wings, fries, salmon)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {["all", "poultry", "beef-pork", "seafood", "vegetables", "frozen-snacks", "baking"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${selectedCategory === cat
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {cat === "all" ? "All Foods" : cat.replace("-", " ").toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Food Item</th>
                                    <th className="p-3">Traditional Oven</th>
                                    <th className="p-3">Air Fryer Target</th>
                                    <th className="p-3">Cook Time</th>
                                    <th className="p-3">Chef Recommendation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {filteredPresets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-xs text-slate-400">
                                            No food items matched your query.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPresets.map((item) => {
                                        const airTempF = item.ovenTempF - 25;
                                        const airTempC = Math.round(((airTempF - 32) * 5) / 9);
                                        const airTime = Math.round(item.ovenTimeMins * 0.8);
                                        return (
                                            <tr key={item.name} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-900">{item.name}</td>
                                                <td className="p-3 text-slate-500 font-mono">{item.ovenTempF}°F ({Math.round(((item.ovenTempF - 32) * 5) / 9)}°C)</td>
                                                <td className="p-3 font-bold text-indigo-700 font-mono">{airTempF}°F ({airTempC}°C)</td>
                                                <td className="p-3 font-bold text-emerald-700 font-mono">{airTime} mins</td>
                                                <td className="p-3 text-xs text-slate-600">{item.notes}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Scientific Principles & Thermodynamics of Air Frying */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Thermodynamics of Air Frying vs Conventional Radiant Ovens
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An air fryer is not an actual fryer; it is an ultra-compact, high-intensity convection chamber. Understanding the physics of convective heat transfer explains why cooking parameters must be systematically reduced:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> The Thermal Boundary Layer
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                In static conventional ovens, evaporating water creates a cool, stagnant layer of humid air around food that slows heat penetration. The high-velocity fan of an air fryer strips away this boundary layer continuously, dramatically increasing the convective heat transfer coefficient ($h$).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Rapid Maillard Reaction
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Browning and crust crisping (the Maillard reaction between amino acids and reducing sugars) occur when surface moisture evaporates past 284°F (140°C). By combining rapid hot air circulation with perforated baskets, air fryers dehydrate the surface in minutes without drying out internal moisture.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4" /> The 25/20 Conversion Formula
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To replicate conventional oven results without scorching exteriors or leaving interiors raw:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Temperature Rule:</span>
                                <strong className="text-indigo-300 text-sm">T_airfryer = T_oven - 25°F (15°C)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Cook Time Rule:</span>
                                <strong className="text-indigo-300 text-sm">Time_airfryer = Time_oven × 0.80</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Crucial Safety & Smoke Point Guidelines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Cooking Oil Smoke Points & Fire Safety Protocol
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Because air fryer heating elements sit directly above the food basket, using aerosol cooking sprays or low-smoke-point fats can cause aerosolized smoking, resin buildup on non-stick coatings, or fire hazards.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Cooking Oil / Fat</th>
                                    <th className="p-3">Smoke Point</th>
                                    <th className="p-3">Air Fryer Suitability</th>
                                    <th className="p-3">Best Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Avocado Oil (Refined)</td>
                                    <td className="p-3 font-mono">520°F (271°C)</td>
                                    <td className="p-3 font-bold text-emerald-600">Exceptional</td>
                                    <td className="p-3 text-xs">High-heat searing, wings, roasting</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Ghee (Clarified Butter)</td>
                                    <td className="p-3 font-mono">485°F (252°C)</td>
                                    <td className="p-3 font-bold text-emerald-600">Excellent</td>
                                    <td className="p-3 text-xs">Steaks, rich browning, chops</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Canola / Vegetable Oil</td>
                                    <td className="p-3 font-mono">400°F (204°C)</td>
                                    <td className="p-3 font-bold text-indigo-600">Good</td>
                                    <td className="p-3 text-xs">General frying, frozen snacks</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Extra Virgin Olive Oil</td>
                                    <td className="p-3 font-mono">375°F (190°C)</td>
                                    <td className="p-3 font-bold text-amber-600">Moderate Only</td>
                                    <td className="p-3 text-xs">Vegetables under 375°F; smokes easily</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-rose-50/30">
                                    <td className="p-3 font-semibold text-slate-900">Aerosol Non-Stick Sprays (PAM)</td>
                                    <td className="p-3 font-mono">Variable</td>
                                    <td className="p-3 font-bold text-rose-600">Strictly Avoid</td>
                                    <td className="p-3 text-xs">Propellants erode non-stick Teflon coating</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Worked Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Conversion Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how the standard conversion formula translates classic baked dishes into rapid air-fried meals:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Crispy Chicken Thighs</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Poultry</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Oven Recipe:</strong> 425°F for 40 minutes in conventional oven.</li>
                                <li><strong>Temp Conversion:</strong> 425°F - 25°F = <strong>400°F (204°C)</strong>.</li>
                                <li><strong>Time Conversion:</strong> 40 mins × 0.80 = <strong>32 minutes</strong>.</li>
                                <li><strong>Checkpoint:</strong> Flip at 16 mins; skin-side up for final 10 mins.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: Crisp golden skin in 32 mins vs 40+ mins.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Roasted Cauliflower Florets</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Vegetables</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Oven Recipe:</strong> 400°F for 25 minutes on a sheet pan.</li>
                                <li><strong>Temp Conversion:</strong> 400°F - 25°F = <strong>375°F (190°C)</strong>.</li>
                                <li><strong>Time Conversion:</strong> 25 mins × 0.80 = <strong>20 minutes</strong>.</li>
                                <li><strong>Checkpoint:</strong> Shake basket vigorously at 10 mins.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: Tender core with charred edges in 20 mins.
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
                                What is the general golden rule for converting oven recipes to an air fryer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The industry standard formula is the 25/20 Rule: Reduce the conventional oven temperature by 25°F (approx 15°C) and reduce the total cook time by 20%. Because air fryers use concentrated high-velocity convection in a small cavity, heat transfer is significantly faster.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Should I convert differently if my recipe is already for a fan-assisted (convection) oven?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Fan-forced convection ovens have already lowered temperature expectations compared to conventional radiant ovens. When converting from a convection oven recipe to an air fryer, reduce the temperature by only 10°F to 15°F (5°C to 10°C) and decrease time by 15%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is it critical to shake or flip food halfway through air frying?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Most air fryer heating elements and high-speed fans are positioned directly above the basket. Shaking or flipping food halfway ensures uniform Maillard browning, prevents hot-spot burning, and redistributes moisture on the lower contact surfaces.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Do I need to preheat my air fryer before cooking?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While air fryers heat rapidly, preheating for 2 to 3 minutes is highly recommended for proteins, steaks, and breaded items to instantly sear the exterior and prevent soggy breading. For delicate baked goods or reheating pizza, preheating is optional.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I put aluminum foil or baking parchment paper in an air fryer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, but with strict safety precautions: Never place loose parchment paper or foil into the basket during preheating. The high-velocity airflow can blow light paper directly into the exposed heating element, creating an immediate fire hazard. Always weigh down liners with food.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much energy does an air fryer save compared to a standard electric oven?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An average air fryer draws 1,400 to 1,800 watts and requires no long 15-minute warm-up, whereas a standard electric wall oven consumes 2,500 to 4,000 watts. Because air fryers cook roughly 20% faster in a tiny space, total electricity usage is reduced by 50% to 70% per meal.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}