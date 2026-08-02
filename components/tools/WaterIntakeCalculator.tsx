"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Droplets,
    Activity,
    Scale,
    Sun,
    Info,
    HelpCircle,
    BookOpen,
    Download,
    Copy,
    Check,
    BarChart3,
    Sparkles,
    ShieldCheck,
    Calculator,
    Lightbulb,
    AlertTriangle,
    RefreshCw,
    GlassWater,
    Target,
    Zap,
    Thermometer,
    HeartPulse,
    Coffee,
    Layers,
    Stethoscope,
    CheckCircle2,
    Gauge
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type ClimateType = "temperate" | "hot" | "humid" | "extreme";

interface Preset {
    id: string;
    label: string;
    system: UnitSystem;
    gender: Gender;
    age: number;
    weightLbs: number;
    weightKg: number;
    workoutMinutes: number;
    climate: ClimateType;
    isPregnant: boolean;
    isBreastfeeding: boolean;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "office-worker", label: "Office Worker", system: "imperial", gender: "female", age: 30, weightLbs: 140, weightKg: 63.5, workoutMinutes: 0, climate: "temperate", isPregnant: false, isBreastfeeding: false, tag: "Sedentary" },
    { id: "daily-runner", label: "Marathon Runner", system: "imperial", gender: "male", age: 28, weightLbs: 175, weightKg: 79.5, workoutMinutes: 75, climate: "hot", isPregnant: false, isBreastfeeding: false, tag: "High Active" },
    { id: "expecting-mother", label: "Pregnant & Active", system: "metric", gender: "female", age: 31, weightLbs: 154, weightKg: 70, workoutMinutes: 30, climate: "temperate", isPregnant: true, isBreastfeeding: false, tag: "Special Condition" },
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
    // Parse string, stripping undesirable leading zeros like "0100" -> 100
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function WaterIntakeCalculator() {
    // Unit & Demographic States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);

    // Weight States
    const [weightLbs, setWeightLbs] = useState<number>(160);
    const [weightKg, setWeightKg] = useState<number>(72.5);

    // Lifestyle & Environmental States
    const [workoutMinutes, setWorkoutMinutes] = useState<number>(45);
    const [climate, setClimate] = useState<ClimateType>("temperate");
    const [isPregnant, setIsPregnant] = useState<boolean>(false);
    const [isBreastfeeding, setIsBreastfeeding] = useState<boolean>(false);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "schedule" | "breakdown">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Calculate normalized weight in kg
    const effectiveWeightKg = useMemo(() => {
        if (unitSystem === "imperial") {
            return (weightLbs || 0) * 0.45359237;
        }
        return weightKg || 0;
    }, [unitSystem, weightLbs, weightKg]);

    // Calculation Engine
    const results = useMemo(() => {
        const wKg = effectiveWeightKg;

        if (wKg <= 0 || age <= 0) {
            return {
                totalLiters: 0,
                totalFlOz: 0,
                glasses8oz: 0,
                glasses250ml: 0,
                baseLiters: 0,
                exerciseLiters: 0,
                climateLiters: 0,
                specialLiters: 0,
                hourlyBreakdown: [],
            };
        }

        // 1. Base Hydration Needs (Mifflin/EFSA clinical baseline ~35ml/kg for adults, age calibrated)
        let baseMlPerKg = 35;
        if (age > 55) baseMlPerKg = 30;
        else if (age < 18) baseMlPerKg = 40;

        let baseWaterMl = wKg * baseMlPerKg;

        // Biological Sex Calibration
        if (gender === "male") {
            baseWaterMl *= 1.05; // Slightly higher average lean muscle mass
        }

        // 2. Exercise Sweat Loss Addition (~350ml per 30 minutes of exercise)
        const exerciseWaterMl = (workoutMinutes / 30) * 350;

        // 3. Environmental & Climate Adjustments
        const climateMultipliers: Record<ClimateType, number> = {
            temperate: 0,
            hot: 350,
            humid: 500,
            extreme: 750,
        };
        const climateWaterMl = climateMultipliers[climate];

        // 4. Pregnancy / Lactation Adjustments (ACOG standards)
        let specialConditionMl = 0;
        if (gender === "female") {
            if (isBreastfeeding) {
                specialConditionMl += 800; // ~700-800ml daily needed for milk production
            } else if (isPregnant) {
                specialConditionMl += 300; // Increased blood volume & amniotic fluid
            }
        }

        // Total Cumulative Fluid Volume
        const totalMl = baseWaterMl + exerciseWaterMl + climateWaterMl + specialConditionMl;
        const totalLiters = totalMl / 1000;
        const totalFlOz = totalMl * 0.033814;

        const glasses8oz = Math.round(totalFlOz / 8);
        const glasses250ml = Math.round(totalMl / 250);

        // Hourly Schedule Generator (14-hour awake period assumed: 7:00 AM - 9:00 PM)
        const hourlyMl = totalMl / 8; // 8 primary drink intervals
        const hourlyFlOz = totalFlOz / 8;

        const schedule = [
            { time: "07:00 AM", event: "Morning Wake Up", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "09:00 AM", event: "Mid-Morning Focus", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "11:00 AM", event: "Pre-Lunch Hydration", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "01:00 PM", event: "Post-Lunch Hydration", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "03:00 PM", event: "Afternoon Energy Boost", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "05:00 PM", event: "Workout / Activity Window", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "07:00 PM", event: "Dinner Hydration", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
            { time: "09:00 PM", event: "Nighttime Wind Down", ml: Math.round(hourlyMl), flOz: Math.round(hourlyFlOz) },
        ];

        return {
            totalLiters: Number(totalLiters.toFixed(2)),
            totalFlOz: Math.round(totalFlOz),
            glasses8oz,
            glasses250ml,
            baseLiters: Number((baseWaterMl / 1000).toFixed(2)),
            exerciseLiters: Number((exerciseWaterMl / 1000).toFixed(2)),
            climateLiters: Number((climateWaterMl / 1000).toFixed(2)),
            specialLiters: Number((specialConditionMl / 1000).toFixed(2)),
            hourlyBreakdown: schedule,
        };
    }, [effectiveWeightKg, age, gender, workoutMinutes, climate, isPregnant, isBreastfeeding]);

    // Handle Unit Switch & Data Sync
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            setWeightKg(Number(((weightLbs || 0) * 0.453592).toFixed(1)));
        } else {
            setWeightLbs(Math.round((weightKg || 0) * 2.20462));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnitSystem(preset.system);
        setGender(preset.gender);
        setAge(preset.age);
        setWorkoutMinutes(preset.workoutMinutes);
        setClimate(preset.climate);
        setIsPregnant(preset.isPregnant);
        setIsBreastfeeding(preset.isBreastfeeding);

        if (preset.system === "imperial") {
            setWeightLbs(preset.weightLbs);
        } else {
            setWeightKg(preset.weightKg);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setGender("male");
        setAge(30);
        setWeightLbs(160);
        setWeightKg(72.5);
        setWorkoutMinutes(45);
        setClimate("temperate");
        setIsPregnant(false);
        setIsBreastfeeding(false);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;

        const summaryText = `Daily Hydration & Water Intake Target (TwisterTools):
----------------------------------------
Age / Biological Sex: ${age} Yrs / ${gender.toUpperCase()}
Body Weight: ${weightDisplay}
Daily Workout Time: ${workoutMinutes} mins
Climate & Environment: ${climate.toUpperCase()}
----------------------------------------
Target Daily Fluid Intake:
• Total Volume (Imperial): ${results.totalFlOz} fl oz (~${results.glasses8oz} standard 8oz glasses)
• Total Volume (Metric): ${results.totalLiters} Liters (~${results.glasses250ml} 250ml glasses)
----------------------------------------
Water Requirement Components:
• Baseline Need: ${results.baseLiters} L
• Workout Sweat Loss: ${results.exerciseLiters} L
• Climate Adjustment: ${results.climateLiters} L
• Pregnancy/Lactation: ${results.specialLiters} L
----------------------------------------
Calculated at twistertools.com/tools/calculators/water-intake-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Hydration Parameter", "Value", "Unit / Context"];
        const rows = [
            ["Total Water Intake (Imperial)", `${results.totalFlOz}`, "Fluid Ounces (fl oz)"],
            ["Total Water Intake (Metric)", `${results.totalLiters}`, "Liters (L)"],
            ["8 oz Glasses Equivalent", `${results.glasses8oz}`, "Glasses"],
            ["250 ml Glasses Equivalent", `${results.glasses250ml}`, "Glasses"],
            ["Baseline Fluid Volume", `${results.baseLiters}`, "Liters"],
            ["Workout Sweat Replacement", `${results.exerciseLiters}`, "Liters"],
            ["Climate Adjustment Volume", `${results.climateLiters}`, "Liters"],
            ["Special Factors Volume", `${results.specialLiters}`, "Liters"],
            ["Biological Sex", gender, "Sex"],
            ["Age", `${age}`, "Years"],
            ["Daily Workout Duration", `${workoutMinutes}`, "Minutes"],
            ["Climate Zone", climate, "Environment"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `daily_water_intake_hydration_plan.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Water Intake & Daily Hydration Calculator",
        "url": "https://twistertools.com/tools/calculators/water-intake-calculator",
        "description": "Calculate your optimal daily water intake based on weight, activity level, age, biological sex, climate, and pregnancy factors.",
        "applicationCategory": "HealthApplication",
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
                "name": "How much water should I drink per day?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A general rule of thumb is approximately 0.5 to 1 ounce of water per pound of body weight daily (30-35 ml per kilogram). However, exact needs fluctuate based on workout intensity, heat, humidity, and biological conditions like pregnancy."
                }
            },
            {
                "@type": "Question",
                "name": "Does coffee or tea count toward my daily water intake?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Caffeinated beverages like coffee and tea contribute to your net total fluid intake. While caffeine has a mild diuretic effect, the fluid volume provided far outweighs fluid loss in regular consumers."
                }
            },
            {
                "@type": "Question",
                "name": "Can you drink too much water?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Excessive fluid consumption without adequate sodium replenishment can lead to hyponatremia (water intoxication), a medical condition where blood sodium levels drop dangerously low."
                }
            },
            {
                "@type": "Question",
                "name": "How much extra water do I need when exercising?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "It is recommended to drink an additional 12 to 20 fluid ounces (350–600 ml) for every 30 minutes of moderate-to-intense exercise to compensate for sweat and respiratory loss."
                }
            },
            {
                "@type": "Question",
                "name": "How does hot climate affect hydration requirements?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Hot or humid environments accelerate perspiration and metabolic cooling rates, increasing fluid needs by 12 oz to 25 oz (350–750 ml) per day to prevent dehydration."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Biological & Lifestyle Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Toggle Switch */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement System
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("imperial")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (lbs, fl oz)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (kg, Liters)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Gender & Age Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Biological Sex
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setGender("male");
                                                setIsPregnant(false);
                                                setIsBreastfeeding(false);
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition ${gender === "male"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Male
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender("female")}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition ${gender === "female"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Female
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Age (Years)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="110"
                                        value={age === 0 ? "" : age}
                                        onChange={(e) => { handleNumberInput(e, (val) => setAge(val === 0 ? 0 : Math.max(1, Math.min(110, val)))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Weight Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Body Weight
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="30"
                                            max="700"
                                            value={weightLbs === 0 ? "" : weightLbs}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWeightLbs(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">lbs</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="15"
                                            max="350"
                                            value={weightKg === 0 ? "" : weightKg}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWeightKg(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                    </div>
                                )}
                            </div>

                            {/* Daily Workout & Climate Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-600" /> Daily Exercise
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="360"
                                            value={workoutMinutes === 0 ? "" : workoutMinutes}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWorkoutMinutes(Math.max(0, Math.min(360, val)))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mins</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Sun className="w-3.5 h-3.5 text-indigo-600" /> Climate Zone
                                    </label>
                                    <select
                                        value={climate}
                                        onChange={(e) => setClimate(e.target.value as ClimateType)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        <option value="temperate">Temperate / Mild</option>
                                        <option value="hot">Hot Weather</option>
                                        <option value="humid">Hot & Humid</option>
                                        <option value="extreme">Extreme Heat / Altitude</option>
                                    </select>
                                </div>
                            </div>

                            {/* Female Specific Modifiers */}
                            {gender === "female" && (
                                <div className="p-3.5 border border-indigo-100 bg-indigo-50/40 rounded-xl space-y-2">
                                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                                        <HeartPulse className="w-3.5 h-3.5 text-indigo-600" /> Physiological Conditions
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={isPregnant}
                                                onChange={(e) => {
                                                    setIsPregnant(e.target.checked);
                                                    if (e.target.checked) setIsBreastfeeding(false);
                                                }}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            />
                                            Pregnant (+300 ml)
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={isBreastfeeding}
                                                onChange={(e) => {
                                                    setIsBreastfeeding(e.target.checked);
                                                    if (e.target.checked) setIsPregnant(false);
                                                }}
                                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                            />
                                            Lactating (+800 ml)
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Lifestyle Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {preset.tag}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Hydration Plan"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Data Schedule */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Hydration Output Target
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "schedule" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Schedule
                                </button>
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Components
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Droplets className="w-4 h-4 text-cyan-400 fill-cyan-400" /> Recommended Daily Water Intake
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    Optimal Target
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                {unitSystem === "imperial" ? (
                                    <>
                                        <span className="text-4xl md:text-5xl font-black text-white">
                                            {results.totalFlOz > 0 ? results.totalFlOz : "--"}
                                        </span>
                                        <span className="text-sm font-semibold text-indigo-200">fl oz / day</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-4xl md:text-5xl font-black text-white">
                                            {results.totalLiters > 0 ? results.totalLiters : "--"}
                                        </span>
                                        <span className="text-sm font-semibold text-indigo-200">Liters / day</span>
                                    </>
                                )}
                            </div>

                            <p className="mt-3 text-xs text-indigo-200/90 leading-relaxed border-t border-indigo-800/80 pt-3">
                                Equivalent to <strong>{results.glasses8oz} standard 8 oz glasses</strong> (or {results.glasses250ml} × 250ml glasses) spread throughout your wakeful hours.
                            </p>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 .5 pt-1">
                                {/* Metric Equivalent */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <GlassWater className="w-4 h-4 text-indigo-600" />
                                        Total Volume (Liters)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {results.totalLiters} <span className="text-xs font-normal text-slate-500">L</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        ~{results.glasses250ml} glasses of 250ml
                                    </p>
                                </div>

                                {/* Imperial Equivalent */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Droplets className="w-4 h-4 text-indigo-600" />
                                        Total Volume (Fluid Oz)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {results.totalFlOz} <span className="text-xs font-normal text-slate-500">fl oz</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        ~{results.glasses8oz} glasses of 8 fl oz
                                    </p>
                                </div>

                                {/* Baseline Fluid Need */}
                                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                        <Gauge className="w-4 h-4 text-indigo-600" />
                                        Basal Metabolic Requirement
                                    </div>
                                    <p className="text-xl font-extrabold text-indigo-900">
                                        {results.baseLiters} <span className="text-xs font-normal text-indigo-700">Liters</span>
                                    </p>
                                    <p className="text-[11px] text-indigo-700/80">
                                        Resting organ & metabolic maintenance
                                    </p>
                                </div>

                                {/* Exercise Fluid Replenishment */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                        <Activity className="w-4 h-4 text-emerald-600" />
                                        Exercise Sweat Loss
                                    </div>
                                    <p className="text-xl font-extrabold text-emerald-900">
                                        +{results.exerciseLiters} <span className="text-xs font-normal text-emerald-700">Liters</span>
                                    </p>
                                    <p className="text-[11px] text-emerald-700/80">
                                        Added for {workoutMinutes} mins exercise
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "schedule" && (
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    8-Step Hourly Intake Plan
                                </div>
                                {results.hourlyBreakdown.map((step, idx) => (
                                    <div key={idx} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                                {step.time}
                                            </span>
                                            <span className="font-semibold text-slate-800">{step.event}</span>
                                        </div>
                                        <div className="font-bold text-slate-900">
                                            {unitSystem === "imperial" ? `${step.flOz} fl oz` : `${step.ml} ml`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "breakdown" && (
                            <div className="space-y-3">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">1. Basal Weight Intake</div>
                                        <div className="text-sm text-slate-700 font-medium">35 ml per kg body weight</div>
                                    </div>
                                    <div className="text-lg font-black text-indigo-600">{results.baseLiters} L</div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">2. Workout Sweat Loss</div>
                                        <div className="text-sm text-slate-700 font-medium">{workoutMinutes} minutes workout</div>
                                    </div>
                                    <div className="text-lg font-black text-emerald-600">+{results.exerciseLiters} L</div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">3. Climate / Environment</div>
                                        <div className="text-sm text-slate-700 font-medium">{climate.toUpperCase()} zone adjustment</div>
                                    </div>
                                    <div className="text-lg font-black text-amber-600">+{results.climateLiters} L</div>
                                </div>

                                {results.specialLiters > 0 && (
                                    <div className="p-3.5 border border-indigo-200 rounded-xl bg-indigo-50/50 flex items-center justify-between">
                                        <div>
                                            <div className="text-xs font-bold text-indigo-700 uppercase">4. Pregnancy / Lactation</div>
                                            <div className="text-sm text-indigo-900 font-medium">Physiological volume expansion</div>
                                        </div>
                                        <div className="text-lg font-black text-indigo-700">+{results.specialLiters} L</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>ACOG & EFSA Clinical Standards</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Physiological Hydration Science */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Human Hydration & Physiological Fluid Balance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Water constitutes approximately <strong>60% of total adult human body weight</strong>, playing a paramount role in cellular metabolism, cognitive function, joint lubrication, nutrient transport, and internal thermoregulation. Maintaining optimal daily hydration prevents cellular dehydration, protects renal filtration capacity, and ensures peak cognitive focus throughout the day.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-indigo-600" /> Thermoregulation & Sweat Rate
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When core body temperature rises during physical exercise or ambient heat exposure, eccrine sweat glands produce liquid sweat. Evaporative cooling dissipates core heat, requiring corresponding fluid intake to maintain plasma volume.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-indigo-600" /> Renal Filtration & Electrolyte Homeostasis
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The kidneys filter approximately 120 to 150 quarts of blood daily to excrete waste products. Adequate fluid intake maintains optimal glomerular filtration rate (GFR) and prevents acute kidney stress.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Clinical Calculation Algorithm
                        </h3>
                        <p className="text-xs text-slate-300">
                            Our engine synthesizes European Food Safety Authority (EFSA) and American College of Sports Medicine (ACSM) fluid replacement parameters:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Base Intake (Ml):</strong> Body Weight (kg) × Baseline Coefficient (30–40 ml/kg)</div>
                            <div><strong>2. Sweat Loss Adjustment:</strong> +350 ml for every 30 minutes of intentional exercise</div>
                            <div><strong>3. Environmental Modifier:</strong> +350 ml (Hot) up to +750 ml (Extreme Heat/Humid)</div>
                            <div><strong>4. Total Hydration Target:</strong> Base Volume + Exercise Volume + Climate Volume + Special Condition Modifier</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Hydration Needs Across Activities & Conditions */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Hydration Coefficients Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to the clinical parameters below to understand how lifestyle and environmental factors scale daily fluid requirements:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Condition / Environment</th>
                                    <th className="p-3">Fluid Adjustment</th>
                                    <th className="p-3">Physiological Rationale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Sedentary Temperate</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">35 ml / kg</td>
                                    <td className="p-3">Standard baseline replacing insensible skin and respiratory water loss.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Moderate Exercise (30m)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">+350 ml (+12 fl oz)</td>
                                    <td className="p-3">Replaces thermoregulatory perspiration loss during aerobic movement.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Hot & Humid Climate</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">+500 ml (+17 fl oz)</td>
                                    <td className="p-3 font-medium text-slate-800">Humidity lowers evaporative sweat efficiency, increasing perspiration rate.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Pregnancy (ACOG)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">+300 ml (+10 fl oz)</td>
                                    <td className="p-3">Supports expanded maternal blood volume and amniotic fluid maintenance.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Lactation / Breastfeeding</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">+800 ml (+27 fl oz)</td>
                                    <td className="p-3">Provides liquid base for breast milk secretion (~87% water content).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Real-World Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Hydration Profiles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how daily water targets adapt to distinct lifestyle and demographic scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Office Worker</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 30 Years | Female | 140 lbs (63.5 kg)</li>
                                <li><strong>Activity & Climate:</strong> 0 mins workout | Temperate</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Hydration Targets:</li>
                                <li>• <strong>Total Intake:</strong> 75 fl oz (~2.2 Liters)</li>
                                <li>• <strong>8 oz Glasses:</strong> ~9 Glasses / day</li>
                                <li>• <strong>Hourly Pace:</strong> ~9.4 fl oz per 2-hour interval</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Outdoor Athlete</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 28 Years | Male | 79.5 kg (175 lbs)</li>
                                <li><strong>Activity & Climate:</strong> 75 mins workout | Hot Environment</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Hydration Targets:</li>
                                <li>• <strong>Total Intake:</strong> 4.15 Liters (~140 fl oz)</li>
                                <li>• <strong>250ml Glasses:</strong> ~17 Glasses / day</li>
                                <li>• <strong>Hourly Pace:</strong> ~520 ml per 2-hour interval</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Dehydration Symptoms & Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Best Practices & Dehydration Indicators
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Monitoring your body's physiological signals ensures you stay within healthy hydration thresholds:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Urine Color Indicator</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pale lemonade-colored urine indicates optimal hydration. Dark amber urine signals mild-to-severe dehydration, requiring immediate fluid intake.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Electrolyte Balance</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                During prolonged exercise (&gt;60 mins), pair high fluid intake with electrolyte beverages containing sodium and potassium to prevent hyponatremia.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Spread Intake Evenly</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Avoid chugging large fluid quantities at once. Drinking 8–12 oz every 1 to 2 hours maximizes cellular absorption and minimizes renal overflow excretion.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
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
                                How much water should I drink per day?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A general rule of thumb is approximately 0.5 to 1 ounce of water per pound of body weight daily (30-35 ml per kilogram). However, exact needs fluctuate based on workout intensity, heat, humidity, and biological conditions like pregnancy.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does coffee or tea count toward my daily water intake?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Caffeinated beverages like coffee and tea contribute to your net total fluid intake. While caffeine has a mild diuretic effect, the fluid volume provided far outweighs fluid loss in regular consumers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can you drink too much water?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Excessive fluid consumption without adequate sodium replenishment can lead to hyponatremia (water intoxication), a medical condition where blood sodium levels drop dangerously low.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much extra water do I need when exercising?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                It is recommended to drink an additional 12 to 20 fluid ounces (350–600 ml) for every 30 minutes of moderate-to-intense exercise to compensate for sweat and respiratory loss.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does hot climate affect hydration requirements?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Hot or humid environments accelerate perspiration and metabolic cooling rates, increasing fluid needs by 12 oz to 25 oz (350–750 ml) per day to prevent dehydration.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Medical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                    </p>
                </section>

            </div>
        </div>
    );
}