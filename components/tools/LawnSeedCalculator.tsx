"use client";

import React, { useState, useMemo } from "react";
import {
    Sprout,
    Calculator,
    Scale,
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
    Calendar,
    Ruler,
    Compass,
    SlidersHorizontal,
    Trees,
    Activity
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type ShapeType = "rectangle" | "circle" | "triangle" | "custom";
type LawnGoal = "overseeding" | "new-lawn" | "bare-spots";
type GrassSpecies =
    | "kentucky-bluegrass"
    | "perennial-ryegrass"
    | "tall-fescue"
    | "fine-fescue"
    | "bermudagrass"
    | "zoysiagrass"
    | "st-augustine"
    | "bahiagrass"
    | "centipedegrass"
    | "custom";

interface GrassPreset {
    name: string;
    type: "cool-season" | "warm-season";
    newLawnRateLbsPer1k: number;
    overseedRateLbsPer1k: number;
    germinationDays: string;
    mowingHeightInches: string;
    sunRequirement: string;
}

const GRASS_DATABASE: Record<Exclude<GrassSpecies, "custom">, GrassPreset> = {
    "kentucky-bluegrass": {
        name: "Kentucky Bluegrass",
        type: "cool-season",
        newLawnRateLbsPer1k: 2.5,
        overseedRateLbsPer1k: 1.25,
        germinationDays: "14 - 30 days",
        mowingHeightInches: "2.5 - 3.5 in",
        sunRequirement: "Full Sun to Light Shade"
    },
    "perennial-ryegrass": {
        name: "Perennial Ryegrass",
        type: "cool-season",
        newLawnRateLbsPer1k: 7.0,
        overseedRateLbsPer1k: 4.0,
        germinationDays: "5 - 10 days",
        mowingHeightInches: "2.0 - 3.0 in",
        sunRequirement: "Full Sun to Moderate Shade"
    },
    "tall-fescue": {
        name: "Tall Fescue (TTTF)",
        type: "cool-season",
        newLawnRateLbsPer1k: 8.5,
        overseedRateLbsPer1k: 4.5,
        germinationDays: "7 - 14 days",
        mowingHeightInches: "3.0 - 4.0 in",
        sunRequirement: "Full Sun to Moderate Shade"
    },
    "fine-fescue": {
        name: "Fine Fescue (Creeping/Chewings)",
        type: "cool-season",
        newLawnRateLbsPer1k: 4.5,
        overseedRateLbsPer1k: 2.5,
        germinationDays: "10 - 18 days",
        mowingHeightInches: "2.5 - 3.5 in",
        sunRequirement: "Dense Shade to Partial Sun"
    },
    "bermudagrass": {
        name: "Bermudagrass (Common/Seeded)",
        type: "warm-season",
        newLawnRateLbsPer1k: 2.0,
        overseedRateLbsPer1k: 1.0,
        germinationDays: "7 - 14 days",
        mowingHeightInches: "1.0 - 2.0 in",
        sunRequirement: "Full Sun Only"
    },
    "zoysiagrass": {
        name: "Zoysiagrass",
        type: "warm-season",
        newLawnRateLbsPer1k: 2.0,
        overseedRateLbsPer1k: 1.0,
        germinationDays: "14 - 21 days",
        mowingHeightInches: "1.0 - 2.5 in",
        sunRequirement: "Full Sun to Light Shade"
    },
    "st-augustine": {
        name: "St. Augustine (Plugs/Sod only)",
        type: "warm-season",
        newLawnRateLbsPer1k: 0,
        overseedRateLbsPer1k: 0,
        germinationDays: "7 - 14 days (Roots)",
        mowingHeightInches: "3.0 - 4.0 in",
        sunRequirement: "Moderate Shade to Full Sun"
    },
    "bahiagrass": {
        name: "Bahiagrass",
        type: "warm-season",
        newLawnRateLbsPer1k: 7.5,
        overseedRateLbsPer1k: 4.0,
        germinationDays: "14 - 28 days",
        mowingHeightInches: "3.0 - 4.0 in",
        sunRequirement: "Full Sun"
    },
    "centipedegrass": {
        name: "Centipedegrass",
        type: "warm-season",
        newLawnRateLbsPer1k: 0.5,
        overseedRateLbsPer1k: 0.25,
        germinationDays: "14 - 28 days",
        mowingHeightInches: "1.5 - 2.0 in",
        sunRequirement: "Full Sun to Light Shade"
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

export default function LawnSeedCalculator() {
    // Units and Lawn Dimensions
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [shape, setShape] = useState<ShapeType>("rectangle");
    const [length, setLength] = useState<number>(80);
    const [width, setWidth] = useState<number>(50);
    const [radius, setRadius] = useState<number>(25);
    const [base, setBase] = useState<number>(60);
    const [height, setHeight] = useState<number>(40);
    const [manualArea, setManualArea] = useState<number>(4000);

    // Seeding & Grass Parameters
    const [species, setSpecies] = useState<GrassSpecies>("tall-fescue");
    const [goal, setGoal] = useState<LawnGoal>("overseeding");
    const [customSeedRate, setCustomSeedRate] = useState<number>(4.5);
    const [seedBagSize, setSeedBagSize] = useState<number>(25);
    const [seedBagCost, setSeedBagCost] = useState<number>(64.99);

    // Fertilizer & NPK Parameters
    const [includeFertilizer, setIncludeFertilizer] = useState<boolean>(true);
    const [targetNRate, setTargetNRate] = useState<number>(0.75); // lbs N per 1,000 sq ft
    const [npkN, setNpkN] = useState<number>(24);
    const [npkP, setNpkP] = useState<number>(0);
    const [npkK, setNpkK] = useState<number>(8);
    const [fertBagWeight, setFertBagWeight] = useState<number>(35);
    const [fertBagCost, setFertBagCost] = useState<number>(38.50);

    // Spreader Pass Technique
    const [applicationPasses, setApplicationPasses] = useState<number>(2);

    // Copy Notification State
    const [copied, setCopied] = useState<boolean>(false);

    // Area Calculation (in Square Feet internally)
    const areaSqFt = useMemo(() => {
        let sqft = 0;
        if (unitSystem === "imperial") {
            if (shape === "rectangle") sqft = length * width;
            else if (shape === "circle") sqft = Math.PI * radius * radius;
            else if (shape === "triangle") sqft = 0.5 * base * height;
            else sqft = manualArea;
        } else {
            // Metric inputs: Length/Width in meters, convert to sq ft
            if (shape === "rectangle") sqft = length * width * 10.7639;
            else if (shape === "circle") sqft = Math.PI * radius * radius * 10.7639;
            else if (shape === "triangle") sqft = 0.5 * base * height * 10.7639;
            else sqft = manualArea * 10.7639;
        }
        return Math.max(0, sqft);
    }, [unitSystem, shape, length, width, radius, base, height, manualArea]);

    const areaSqMeters = useMemo(() => areaSqFt / 10.7639, [areaSqFt]);

    // Effective Seeding Rate (lbs per 1,000 sq ft)
    const effectiveSeedRatePer1k = useMemo(() => {
        if (species === "custom") return customSeedRate;
        const preset = GRASS_DATABASE[species];
        if (goal === "new-lawn" || goal === "bare-spots") return preset.newLawnRateLbsPer1k;
        return preset.overseedRateLbsPer1k;
    }, [species, goal, customSeedRate]);

    // Seed Calculations
    const seedCalculations = useMemo(() => {
        const totalLbs = (areaSqFt / 1000) * effectiveSeedRatePer1k;
        const totalKg = totalLbs * 0.453592;
        const bagsNeeded = seedBagSize > 0 ? Math.ceil(totalLbs / seedBagSize) : 0;
        const totalCost = bagsNeeded * seedBagCost;
        const perPassLbsPer1k = applicationPasses > 1 ? effectiveSeedRatePer1k / applicationPasses : effectiveSeedRatePer1k;

        return {
            totalLbs: Math.round(totalLbs * 10) / 10,
            totalKg: Math.round(totalKg * 10) / 10,
            bagsNeeded,
            totalCost: Math.round(totalCost * 100) / 100,
            perPassLbsPer1k: Math.round(perPassLbsPer1k * 100) / 100
        };
    }, [areaSqFt, effectiveSeedRatePer1k, seedBagSize, seedBagCost, applicationPasses]);

    // Fertilizer Calculations
    const fertilizerCalculations = useMemo(() => {
        if (!includeFertilizer || npkN <= 0) {
            return {
                bulkRatePer1kLbs: 0,
                totalFertLbs: 0,
                totalFertKg: 0,
                bagsNeeded: 0,
                totalCost: 0,
                appliedPLbs: 0,
                appliedKLbs: 0,
                perPassFertPer1k: 0
            };
        }

        const bulkRatePer1kLbs = targetNRate / (npkN / 100);
        const totalFertLbs = (areaSqFt / 1000) * bulkRatePer1kLbs;
        const totalFertKg = totalFertLbs * 0.453592;
        const bagsNeeded = fertBagWeight > 0 ? Math.ceil(totalFertLbs / fertBagWeight) : 0;
        const totalCost = bagsNeeded * fertBagCost;
        const appliedPLbs = (totalFertLbs * (npkP / 100)) / (areaSqFt / 1000);
        const appliedKLbs = (totalFertLbs * (npkK / 100)) / (areaSqFt / 1000);
        const perPassFertPer1k = applicationPasses > 1 ? bulkRatePer1kLbs / applicationPasses : bulkRatePer1kLbs;

        return {
            bulkRatePer1kLbs: Math.round(bulkRatePer1kLbs * 100) / 100,
            totalFertLbs: Math.round(totalFertLbs * 10) / 10,
            totalFertKg: Math.round(totalFertKg * 10) / 10,
            bagsNeeded,
            totalCost: Math.round(totalCost * 100) / 100,
            appliedPLbs: Math.round(appliedPLbs * 100) / 100,
            appliedKLbs: Math.round(appliedKLbs * 100) / 100,
            perPassFertPer1k: Math.round(perPassFertPer1k * 100) / 100
        };
    }, [includeFertilizer, targetNRate, npkN, npkP, npkK, fertBagWeight, fertBagCost, areaSqFt, applicationPasses]);

    const totalProjectCost = seedCalculations.totalCost + (includeFertilizer ? fertilizerCalculations.totalCost : 0);

    const handleReset = () => {
        setUnitSystem("imperial");
        setShape("rectangle");
        setLength(80);
        setWidth(50);
        setRadius(25);
        setBase(60);
        setHeight(40);
        setManualArea(4000);
        setSpecies("tall-fescue");
        setGoal("overseeding");
        setCustomSeedRate(4.5);
        setSeedBagSize(25);
        setSeedBagCost(64.99);
        setIncludeFertilizer(true);
        setTargetNRate(0.75);
        setNpkN(24);
        setNpkP(0);
        setNpkK(8);
        setFertBagWeight(35);
        setFertBagCost(38.50);
        setApplicationPasses(2);
    };

    const handleCopyResults = () => {
        const text = `Lawn Grass Seed & Fertilizer Calculation Summary:
----------------------------------------
Total Lawn Area: ${Math.round(areaSqFt).toLocaleString()} sq ft (${Math.round(areaSqMeters).toLocaleString()} m²)
Grass Species / Project: ${species === "custom" ? "Custom Blend" : GRASS_DATABASE[species].name} (${goal.toUpperCase()})

SEED ESTIMATION:
- Application Rate: ${effectiveSeedRatePer1k} lbs / 1,000 sq ft
- Total Seed Required: ${seedCalculations.totalLbs} lbs (${seedCalculations.totalKg} kg)
- Bags Needed (${seedBagSize} lb bags): ${seedCalculations.bagsNeeded} bag(s) ($${seedCalculations.totalCost})
${applicationPasses > 1 ? `- Half-Rate Multi-Pass Spreader Rate: ${seedCalculations.perPassLbsPer1k} lbs / 1,000 sq ft per pass\n` : ""}${includeFertilizer ? `
FERTILIZER ESTIMATION:
- Fertilizer Grade: ${npkN}-${npkP}-${npkK} (Target: ${targetNRate} lbs N / 1,000 sq ft)
- Bulk Spreading Rate: ${fertilizerCalculations.bulkRatePer1kLbs} lbs / 1,000 sq ft
- Total Fertilizer Required: ${fertilizerCalculations.totalFertLbs} lbs (${fertilizerCalculations.totalFertKg} kg)
- Bags Needed (${fertBagWeight} lb bags): ${fertilizerCalculations.bagsNeeded} bag(s) ($${fertilizerCalculations.totalCost})
` : ""}
ESTIMATED TOTAL MATERIAL COST: $${totalProjectCost.toFixed(2)}
----------------------------------------
Calculated via twistertools.com/tools/home-tools/lawn-seed-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Lawn Grass Seed & Fertilizer Spreading Rate Calculator",
        "url": "https://twistertools.com/tools/home-tools/lawn-seed-calculator",
        "description": "Calculate exact grass seed pounds, N-P-K fertilizer spreading rates, bag quantities, and cross-hatch spreader calibrations for cool and warm season turfgrass.",
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
                "name": "What is the difference between seeding rates for a new lawn vs overseeding?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A new lawn starts from bare soil and requires double the seeding density (typically 6 to 9 lbs per 1,000 sq ft for tall fescue) to achieve thick canopy closure before weed emergence. Overseeding an existing, established lawn requires roughly half the rate (3 to 4.5 lbs per 1,000 sq ft) because existing grass crowns already occupy soil volume."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate bulk fertilizer spreading rate from N-P-K numbers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To apply a specific rate of elemental Nitrogen (such as 0.75 lbs N per 1,000 sq ft), divide the target Nitrogen rate by the decimal percentage of Nitrogen in the fertilizer bag. For example, with a 24-0-8 fertilizer: 0.75 / 0.24 = 3.125 lbs of bulk fertilizer per 1,000 sq ft."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I apply grass seed and fertilizer in a cross-hatch (Criss-Cross) pattern?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Applying at half the spreader setting in two perpendicular directions (North-South, then East-West) eliminates striping, missed swaths, and chemical scorching hot spots. It ensures 100% uniform seed distribution across irregular topography."
                }
            },
            {
                "@type": "Question",
                "name": "When is the optimal time of year to overseed cool-season vs warm-season grasses?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cool-season grasses (Kentucky Bluegrass, Tall Fescue, Perennial Ryegrass) should be seeded in late summer to early autumn (late August to late September) when soil temperatures are warm (55°F to 65°F) and weed pressure is minimal. Warm-season grasses (Bermuda, Zoysia, Bahia) should be seeded in late spring to early summer (May to June) when soil temperatures exceed 70°F."
                }
            },
            {
                "@type": "Question",
                "name": "Can I apply lawn starter fertilizer and grass seed on the exact same day?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, starter fertilizers formulated with high phosphorus (e.g., 10-18-10 or 24-25-4) or specialized starter fertilizer with mesotrione can be applied at the time of seeding. Avoid standard mature turf weed-and-feed products containing pre-emergent herbicides like prodiamine, which kill germinating grass seedlings."
                }
            },
            {
                "@type": "Question",
                "name": "How much water do newly seeded lawns need during germination?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Newly seeded turf requires light, frequent watering 2 to 4 times daily for 5 to 10 minutes per zone to keep the top 1/2 inch of soil consistently moist without puddling or seed wash-away. Once seedlings reach 2 inches tall, gradually reduce frequency to deep, infrequent watering."
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

                {/* Left Workspace Panel: Lawn Geometry & Project Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-indigo-600" />
                                Lawn & Seeding Parameters
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
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Units System
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setUnitSystem("imperial")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Imperial (ft/lbs)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUnitSystem("metric")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Metric (m/kg)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Lawn Geometry
                                </label>
                                <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl">
                                    {(["rectangle", "circle", "triangle", "custom"] as ShapeType[]).map((st) => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setShape(st)}
                                            className={`py-2 text-[11px] font-bold rounded-lg transition capitalize cursor-pointer ${shape === st ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                        >
                                            {st === "custom" ? "Direct" : st.slice(0, 4)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Dimensional Dimension Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Ruler className="w-4 h-4 text-indigo-600" />
                                    Yard Dimensions
                                </label>
                                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    {Math.round(areaSqFt).toLocaleString()} sq ft ({Math.round(areaSqMeters).toLocaleString()} m²)
                                </span>
                            </div>

                            {shape === "rectangle" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Length ({unitSystem === "imperial" ? "ft" : "m"})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={length === 0 ? "" : length}
                                            onChange={(e) => handleNumberInput(e, setLength)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Width ({unitSystem === "imperial" ? "ft" : "m"})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={width === 0 ? "" : width}
                                            onChange={(e) => handleNumberInput(e, setWidth)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {shape === "circle" && (
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Radius ({unitSystem === "imperial" ? "ft" : "m"})
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={radius === 0 ? "" : radius}
                                        onChange={(e) => handleNumberInput(e, setRadius)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}

                            {shape === "triangle" && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Base ({unitSystem === "imperial" ? "ft" : "m"})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={base === 0 ? "" : base}
                                            onChange={(e) => handleNumberInput(e, setBase)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                            Height ({unitSystem === "imperial" ? "ft" : "m"})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={height === 0 ? "" : height}
                                            onChange={(e) => handleNumberInput(e, setHeight)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {shape === "custom" && (
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Total Known Area ({unitSystem === "imperial" ? "sq ft" : "sq meters"})
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={manualArea === 0 ? "" : manualArea}
                                        onChange={(e) => handleNumberInput(e, setManualArea)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Grass Species and Seeding Goal */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Turf Species
                                    </label>
                                    <select
                                        value={species}
                                        onChange={(e) => setSpecies(e.target.value as GrassSpecies)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <optgroup label="Cool-Season Grasses">
                                            <option value="tall-fescue">Tall Fescue (TTTF)</option>
                                            <option value="kentucky-bluegrass">Kentucky Bluegrass</option>
                                            <option value="perennial-ryegrass">Perennial Ryegrass</option>
                                            <option value="fine-fescue">Fine Fescue</option>
                                        </optgroup>
                                        <optgroup label="Warm-Season Grasses">
                                            <option value="bermudagrass">Bermudagrass (Seeded)</option>
                                            <option value="zoysiagrass">Zoysiagrass</option>
                                            <option value="bahiagrass">Bahiagrass</option>
                                            <option value="centipedegrass">Centipedegrass</option>
                                            <option value="st-augustine">St. Augustine (Plugs/Info)</option>
                                        </optgroup>
                                        <optgroup label="Custom">
                                            <option value="custom">Custom Seeding Rate</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Project Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setGoal("overseeding")}
                                            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${goal === "overseeding" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                        >
                                            Overseed
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGoal("new-lawn")}
                                            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${goal === "new-lawn" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                        >
                                            New Lawn
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {species === "custom" && (
                                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
                                    <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                                        Custom Seeding Rate (lbs per 1,000 sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min={0.1}
                                        value={customSeedRate === 0 ? "" : customSeedRate}
                                        onChange={(e) => handleNumberInput(e, setCustomSeedRate)}
                                        className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-sm font-bold text-slate-900"
                                    />
                                </div>
                            )}

                            {/* Bag Size & Pricing Config */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Seed Bag Size (lbs)
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={seedBagSize === 0 ? "" : seedBagSize}
                                        onChange={(e) => handleNumberInput(e, setSeedBagSize)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                        Cost Per Bag ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={seedBagCost === 0 ? "" : seedBagCost}
                                        onChange={(e) => handleNumberInput(e, setSeedBagCost)}
                                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Optional Fertilizer Engine */}
                        <div className="pt-3 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Starter / Lawn Fertilizer
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIncludeFertilizer(!includeFertilizer)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${includeFertilizer ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
                                >
                                    {includeFertilizer ? "Enabled" : "Disabled"}
                                </button>
                            </div>

                            {includeFertilizer && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">N (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={npkN === 0 ? "" : npkN}
                                                onChange={(e) => handleNumberInput(e, setNpkN)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 text-center"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">P (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={npkP === 0 ? "" : npkP}
                                                onChange={(e) => handleNumberInput(e, setNpkP)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 text-center"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">K (%)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={npkK === 0 ? "" : npkK}
                                                onChange={(e) => handleNumberInput(e, setNpkK)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 text-center"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase">Target N</label>
                                            <input
                                                type="number"
                                                step="0.05"
                                                min={0.1}
                                                max={2.0}
                                                value={targetNRate === 0 ? "" : targetNRate}
                                                onChange={(e) => handleNumberInput(e, setTargetNRate)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-indigo-700 text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500">Fertilizer Bag Lbs</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={fertBagWeight === 0 ? "" : fertBagWeight}
                                                onChange={(e) => handleNumberInput(e, setFertBagWeight)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-500">Bag Price ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                value={fertBagCost === 0 ? "" : fertBagCost}
                                                onChange={(e) => handleNumberInput(e, setFertBagCost)}
                                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Spreader Pass Calibration Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" />
                                Spreader Pass Strategy
                            </span>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setApplicationPasses(1)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${applicationPasses === 1 ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                >
                                    Single Pass
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setApplicationPasses(2)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${applicationPasses === 2 ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"}`}
                                >
                                    Cross-Hatch (2x)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Rate: {effectiveSeedRatePer1k} lbs / 1,000 sq ft
                        </span>
                        <span>Agronomic Standard</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Target Output & Spreader Calibrations */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Material & Application Plan
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                                Calibrated
                            </span>
                        </div>

                        {/* Highlight Hero Output Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Grass Seed Total Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Sprout className="w-4 h-4 text-indigo-600" /> Total Seed
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {seedCalculations.bagsNeeded} bag{seedCalculations.bagsNeeded === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {seedCalculations.totalLbs}
                                    <span className="text-lg font-bold text-slate-600 ml-1">lbs</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Metric: {seedCalculations.totalKg} kg • Est. ${seedCalculations.totalCost.toFixed(2)}
                                </p>
                            </div>

                            {/* Fertilizer Total Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Layers className="w-4 h-4 text-indigo-600" /> Total Fertilizer
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {includeFertilizer ? `${fertilizerCalculations.bagsNeeded} bag${fertilizerCalculations.bagsNeeded === 1 ? "" : "s"}` : "N/A"}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {includeFertilizer ? fertilizerCalculations.totalFertLbs : 0}
                                    <span className="text-lg font-bold text-slate-600 ml-1">lbs</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    {includeFertilizer ? `Bulk: ${fertilizerCalculations.bulkRatePer1kLbs} lbs/1k sq ft • $${fertilizerCalculations.totalCost.toFixed(2)}` : "Fertilizer disabled"}
                                </p>
                            </div>
                        </div>

                        {/* Multi-Pass Spreader Calibration Banner */}
                        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                                <Compass className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 text-xs">
                                <p className="font-bold text-amber-900 uppercase tracking-wider">
                                    {applicationPasses > 1 ? "Cross-Hatch (Criss-Cross) Spreader Rate" : "Single Pass Spreader Rate"}
                                </p>
                                <p className="text-amber-800 leading-relaxed">
                                    {applicationPasses > 1
                                        ? `Calibrate your broadcast spreader to apply ${seedCalculations.perPassLbsPer1k} lbs seed/1k sq ft per pass. Walk entire lawn North-South, then complete second pass East-West to eliminate striping.`
                                        : `Calibrate your broadcast spreader to apply ${effectiveSeedRatePer1k} lbs seed/1k sq ft in a single continuous pass.`}
                                </p>
                            </div>
                        </div>

                        {/* Species Agronomic Profile Details */}
                        {species !== "custom" && (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                                    <span className="flex items-center gap-1 text-indigo-600 font-extrabold">
                                        <Trees className="w-4 h-4" />
                                        {GRASS_DATABASE[species].name} Profile
                                    </span>
                                    <span className="capitalize text-slate-500">{GRASS_DATABASE[species].type.replace("-", " ")}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                                    <div>
                                        <span className="text-slate-400 block font-semibold">Germination:</span>
                                        <span className="font-bold text-slate-800">{GRASS_DATABASE[species].germinationDays}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold">Mow Height:</span>
                                        <span className="font-bold text-slate-800">{GRASS_DATABASE[species].mowingHeightInches}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block font-semibold">Sunlight:</span>
                                        <span className="font-bold text-slate-800 truncate block">{GRASS_DATABASE[species].sunRequirement}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estimated Project Cost Summary */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-emerald-400" />
                                    Total Estimated Material Cost
                                </span>
                                <span className="text-base text-emerald-400 font-black">${totalProjectCost.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-slate-300 flex justify-between pt-1 border-t border-slate-800">
                                <span>Seed ({seedCalculations.bagsNeeded} bags): ${seedCalculations.totalCost.toFixed(2)}</span>
                                <span>Fertilizer ({includeFertilizer ? fertilizerCalculations.bagsNeeded : 0} bags): ${includeFertilizer ? fertilizerCalculations.totalCost.toFixed(2) : "0.00"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyResults}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Plan Copied to Clipboard!" : "Copy Full Seeding Plan"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Grass Seed Spreading Rate Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Scale className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Grass Seed Spreading & Overseeding Reference Table
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Seeding rates vary significantly based on seed count per pound. Tiny seeds such as Kentucky Bluegrass contain approximately 1,500,000 to 2,000,000 seeds per pound, requiring fewer pounds per square foot, whereas large seeds like Turf-Type Tall Fescue contain only 220,000 seeds per pound and require substantially higher mass.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Turfgrass Variety</th>
                                    <th className="p-3">Climate Zone</th>
                                    <th className="p-3">New Lawn Rate (1k sq ft)</th>
                                    <th className="p-3">Overseeding Rate (1k sq ft)</th>
                                    <th className="p-3">Germination Time</th>
                                    <th className="p-3">Target Mow Height</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Turf-Type Tall Fescue (TTTF)</td>
                                    <td className="p-3 text-slate-500">Cool / Transition</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">8.0 – 10.0 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">4.0 – 5.0 lbs</td>
                                    <td className="p-3 text-xs">7 – 14 days</td>
                                    <td className="p-3 text-xs font-mono">3.0 – 4.0 in</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Kentucky Bluegrass (KBG)</td>
                                    <td className="p-3 text-slate-500">Cool Season</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">2.0 – 3.0 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">1.0 – 1.5 lbs</td>
                                    <td className="p-3 text-xs">14 – 30 days</td>
                                    <td className="p-3 text-xs font-mono">2.5 – 3.5 in</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Perennial Ryegrass (PRG)</td>
                                    <td className="p-3 text-slate-500">Cool Season</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">6.0 – 8.0 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">3.0 – 5.0 lbs</td>
                                    <td className="p-3 text-xs">5 – 10 days</td>
                                    <td className="p-3 text-xs font-mono">2.0 – 3.0 in</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Fine Fescue Blend</td>
                                    <td className="p-3 text-slate-500">Cool / Shade</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">4.0 – 5.0 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">2.0 – 3.0 lbs</td>
                                    <td className="p-3 text-xs">10 – 18 days</td>
                                    <td className="p-3 text-xs font-mono">2.5 – 3.5 in</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Bermudagrass (Common/Unhulled)</td>
                                    <td className="p-3 text-slate-500">Warm Season</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">1.5 – 2.5 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">0.75 – 1.25 lbs</td>
                                    <td className="p-3 text-xs">7 – 14 days</td>
                                    <td className="p-3 text-xs font-mono">1.0 – 2.0 in</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Centipedegrass</td>
                                    <td className="p-3 text-slate-500">Warm / Acidic</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">0.25 – 0.5 lbs</td>
                                    <td className="p-3 font-bold text-emerald-700 font-mono">0.15 – 0.25 lbs</td>
                                    <td className="p-3 text-xs">14 – 28 days</td>
                                    <td className="p-3 text-xs font-mono">1.5 – 2.0 in</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Agronomic Principles & Spreader Math */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Formulations for Seeding & Fertilizer Calibration
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accurate lawn care calculations prevent fertilizer nitrogen burn, optimize seed-to-soil contact, and save money on wasted materials. Two primary formulas govern all turfgrass material applications:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Gross Seed Requirement Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {"Gross seed mass is computed by multiplying the total turf area by the species target rate per thousand square feet (R_seed):"}
                            </p>
                            <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 font-bold">
                                Total Seed (lbs) = (Area (sq ft) / 1,000) × R_seed
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Bulk Fertilizer Nitrogen Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {"Bulk fertilizer mass required per 1,000 sq ft (M_fert) is determined by dividing desired elemental Nitrogen (N_target) by the nitrogen percentage (N_pct):"}
                            </p>
                            <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-indigo-700 font-bold">
                                Bulk Fert (lbs/1k) = N_target / (N_pct / 100)
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Compass className="w-4 h-4" /> The Cross-Hatch (Criss-Cross) Calibration Rule
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Never apply the full rate in a single pass. Rotary spreaders throw uneven distributions (more concentrated near the center than edges). By dividing the target rate by 2 and making two passes at right angles (Pass 1 North-South, Pass 2 East-West), application variance drops by over 80%, completely preventing visible yellow fertilizer streaks and missed bare strips.
                        </p>
                    </div>
                </section>

                {/* Card 3: Seasonal Timeline & Seeding Window */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Optimal Seeding Windows & Soil Temperature Thresholds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Timing your seeding project according to soil temperature—rather than air temperature—is the single most vital factor in establishing deep, drought-tolerant root systems.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Grass Category</th>
                                    <th className="p-3">Best Seeding Window</th>
                                    <th className="p-3">Target Soil Temperature</th>
                                    <th className="p-3">Key Seasonal Advantages</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Cool-Season (Fescue, KBG, Rye)</td>
                                    <td className="p-3 font-bold text-indigo-700">Late Summer – Early Fall (Aug 15 – Oct 1)</td>
                                    <td className="p-3 font-mono font-bold text-emerald-600">55°F – 65°F (13°C – 18°C)</td>
                                    <td className="p-3 text-xs">Warm soil promotes rapid rooting; cool air reduces water stress; minimal crabgrass competition.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Cool-Season Spring Dormant</td>
                                    <td className="p-3 text-slate-600">Early Spring (March – April)</td>
                                    <td className="p-3 font-mono font-bold text-amber-600">50°F – 55°F (10°C – 13°C)</td>
                                    <td className="p-3 text-xs">Adequate rainfall, but requires pre-emergent herbicide compatible with seedlings (Mesotrione).</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Warm-Season (Bermuda, Zoysia)</td>
                                    <td className="p-3 font-bold text-indigo-700">Late Spring – Early Summer (May – June)</td>
                                    <td className="p-3 font-mono font-bold text-emerald-600">70°F – 80°F (21°C – 27°C)</td>
                                    <td className="p-3 text-xs">Long daylengths and high heat accelerate stolon and rhizome lateral expansion.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Lawn Renovation Protocol */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Professional 6-Step Lawn Overseeding Protocol
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this agronomist-proven execution workflow to guarantee 90%+ germination rates when renovating residential turf:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                                <h3 className="font-bold text-slate-900 text-sm">Low Scalp Mowing & Debris Removal</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cut existing lawn down to 1.5 to 2.0 inches and bag clippings. This permits sunlight to reach the soil canopy and reduces competition from existing blades.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                                <h3 className="font-bold text-slate-900 text-sm">Core Aeration or Power Raking</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Mechanically pull soil cores or scarify the top 1/4 inch of thatch. Core aeration relieves soil compaction and creates seed pockets with optimal seed-to-soil contact.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                                <h3 className="font-bold text-slate-900 text-sm">Cross-Hatch Seed Application</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Load calculated seed into a rotary spreader set to half-rate. Make two perpendicular passes (North-South, East-West) across the entire yard.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                                <h3 className="font-bold text-slate-900 text-sm">Starter Fertilizer Application</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Spread high-phosphorus starter fertilizer (e.g., 24-25-4 or 18-24-12) to deliver 0.75–1.0 lb Nitrogen and Phosphorus per 1,000 sq ft to fuel rapid root initiation.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">5</span>
                                <h3 className="font-bold text-slate-900 text-sm">Peat Moss / Compost Topdressing</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Spread a 1/8-inch light layer of screened peat moss or compost over bare patches. Peat moss acts as a natural moisture sponge and visual indicator of dryness.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">6</span>
                                <h3 className="font-bold text-slate-900 text-sm">Light & Frequent Irrigation</h3>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Water 2 to 4 times per day for 5–8 minutes per zone. Keep the top 1/2 inch of soil damp continuously until seedlings reach 2 inches tall, then transition to deep watering.
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
                                What is the difference between seeding rates for a new lawn vs overseeding?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A new lawn starts from bare soil and requires double the seeding density (typically 6 to 9 lbs per 1,000 sq ft for tall fescue) to achieve thick canopy closure before weed emergence. Overseeding an existing, established lawn requires roughly half the rate (3 to 4.5 lbs per 1,000 sq ft) because existing grass crowns already occupy soil volume.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate bulk fertilizer spreading rate from N-P-K numbers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To apply a specific rate of elemental Nitrogen (such as 0.75 lbs N per 1,000 sq ft), divide the target Nitrogen rate by the decimal percentage of Nitrogen in the fertilizer bag. For example, with a 24-0-8 fertilizer: 0.75 / 0.24 = 3.125 lbs of bulk fertilizer per 1,000 sq ft.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I apply grass seed and fertilizer in a cross-hatch (Criss-Cross) pattern?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Applying at half the spreader setting in two perpendicular directions (North-South, then East-West) eliminates striping, missed swaths, and chemical scorching hot spots. It ensures 100% uniform seed distribution across irregular topography.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is the optimal time of year to overseed cool-season vs warm-season grasses?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Cool-season grasses (Kentucky Bluegrass, Tall Fescue, Perennial Ryegrass) should be seeded in late summer to early autumn (late August to late September) when soil temperatures are warm (55°F to 65°F) and weed pressure is minimal. Warm-season grasses (Bermuda, Zoysia, Bahia) should be seeded in late spring to early summer (May to June) when soil temperatures exceed 70°F.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I apply lawn starter fertilizer and grass seed on the exact same day?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, starter fertilizers formulated with high phosphorus (e.g., 10-18-10 or 24-25-4) or specialized starter fertilizer with mesotrione can be applied at the time of seeding. Avoid standard mature turf weed-and-feed products containing pre-emergent herbicides like prodiamine, which kill germinating grass seedlings.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much water do newly seeded lawns need during germination?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Newly seeded turf requires light, frequent watering 2 to 4 times daily for 5 to 10 minutes per zone to keep the top 1/2 inch of soil consistently moist without puddling or seed wash-away. Once seedlings reach 2 inches tall, gradually reduce frequency to deep, infrequent watering.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}