"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
    Scale,
    Ruler,
    Heart,
    User,
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
    TrendingUp,
    TrendingDown,
    Flame,
    Target,
    Zap,
    CheckCircle2,
    PieChart,
    Layers,
    Stethoscope,
    Apple,
    Dumbbell,
    Gauge
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extreme";

interface Preset {
    id: string;
    label: string;
    system: UnitSystem;
    gender: Gender;
    age: number;
    weightLbs: number;
    weightKg: number;
    heightInches: number;
    heightCm: number;
    activity: ActivityLevel;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "desk-worker-male", label: "Desk Worker (Male)", system: "imperial", gender: "male", age: 32, weightLbs: 185, weightKg: 84, heightInches: 70, heightCm: 178, activity: "sedentary", tag: "Sedentary" },
    { id: "active-female-runner", label: "Active Female", system: "metric", gender: "female", age: 28, weightLbs: 138, weightKg: 62.5, heightInches: 66, heightCm: 168, activity: "active", tag: "Very Active" },
    { id: "gym-athlete-male", label: "Gym Lifter (Male)", system: "imperial", gender: "male", age: 25, weightLbs: 175, weightKg: 79.5, heightInches: 71, heightCm: 180, activity: "moderate", tag: "Moderate" },
];

interface MacroBreakdown {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
}

export default function TdeeCalculator() {
    // Unit & Demographic States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);

    // Imperial Inputs
    const [weightLbs, setWeightLbs] = useState<number>(170);
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);

    // Metric Inputs
    const [weightKg, setWeightKg] = useState<number>(77);
    const [heightCm, setHeightCm] = useState<number>(178);

    // Activity & Goal States
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "goals" | "macros">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Convert inputs to metric standard for calculations
    const effectiveWeightKg = useMemo(() => {
        if (unitSystem === "imperial") {
            return (weightLbs || 0) * 0.45359237;
        }
        return weightKg || 0;
    }, [unitSystem, weightLbs, weightKg]);

    const effectiveHeightMeters = useMemo(() => {
        if (unitSystem === "imperial") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            return (totalInches * 2.54) / 100;
        }
        return (heightCm || 0) / 100;
    }, [unitSystem, heightFt, heightIn, heightCm]);

    // Core TDEE & Metabolic Calculations
    const results = useMemo(() => {
        const hM = effectiveHeightMeters;
        const wKg = effectiveWeightKg;

        if (hM <= 0 || wKg <= 0 || age <= 0) {
            return {
                bmr: 0,
                tdee: 0,
                bmi: 0,
                cutCalories: 0,
                extremeCutCalories: 0,
                bulkCalories: 0,
                aggressiveBulkCalories: 0,
                maintenanceMacros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
                cuttingMacros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
                bulkingMacros: { proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
            };
        }

        // 1. BMI Calculation: kg / m^2
        const bmiVal = wKg / (hM * hM);

        // 2. BMR (Mifflin-St Jeor Equation)
        const heightInCm = hM * 100;
        let bmrVal = 10 * wKg + 6.25 * heightInCm - 5 * age;
        bmrVal = gender === "male" ? bmrVal + 5 : bmrVal - 161;

        // 3. TDEE Multipliers
        const activityMultipliers: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            extreme: 1.9,
        };

        const tdeeVal = bmrVal * activityMultipliers[activityLevel];

        // Caloric Target Variations
        const cutVal = Math.round(tdeeVal * 0.80); // 20% deficit
        const extremeCutVal = Math.round(tdeeVal * 0.70); // 30% deficit
        const bulkVal = Math.round(tdeeVal * 1.10); // 10% surplus
        const aggressiveBulkVal = Math.round(tdeeVal * 1.20); // 20% surplus

        // Macro Calculations Helper (30% Protein / 40% Carbs / 30% Fat)
        const computeMacros = (calories: number): MacroBreakdown => {
            const proteinCals = calories * 0.30;
            const carbsCals = calories * 0.40;
            const fatCals = calories * 0.30;

            return {
                proteinGrams: Math.round(proteinCals / 4),
                carbsGrams: Math.round(carbsCals / 4),
                fatGrams: Math.round(fatCals / 9),
            };
        };

        return {
            bmr: Math.round(Math.max(0, bmrVal)),
            tdee: Math.round(Math.max(0, tdeeVal)),
            bmi: bmiVal,
            cutCalories: Math.max(1000, cutVal),
            extremeCutCalories: Math.max(800, extremeCutVal),
            bulkCalories: bulkVal,
            aggressiveBulkCalories: aggressiveBulkVal,
            maintenanceMacros: computeMacros(tdeeVal),
            cuttingMacros: computeMacros(cutVal),
            bulkingMacros: computeMacros(bulkVal),
        };
    }, [effectiveWeightKg, effectiveHeightMeters, age, gender, activityLevel]);

    // Handle Unit Toggle & Sync Data
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            setHeightCm(Math.round(totalInches * 2.54));
            setWeightKg(Math.round((weightLbs || 0) * 0.453592));
        } else {
            const totalInches = (heightCm || 0) / 2.54;
            setHeightFt(Math.floor(totalInches / 12));
            setHeightIn(Math.round(totalInches % 12));
            setWeightLbs(Math.round((weightKg || 0) * 2.20462));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnitSystem(preset.system);
        setGender(preset.gender);
        setAge(preset.age);
        setActivityLevel(preset.activity);

        if (preset.system === "imperial") {
            setWeightLbs(preset.weightLbs);
            setHeightFt(Math.floor(preset.heightInches / 12));
            setHeightIn(preset.heightInches % 12);
        } else {
            setWeightKg(preset.weightKg);
            setHeightCm(preset.heightCm);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setGender("male");
        setAge(30);
        setWeightLbs(170);
        setHeightFt(5);
        setHeightIn(10);
        setWeightKg(77);
        setHeightCm(178);
        setActivityLevel("moderate");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial"
            ? `${heightFt}'${heightIn}"`
            : `${heightCm} cm`;
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;

        const summaryText = `Daily Energy Expenditure (TDEE) Summary (TwisterTools):
----------------------------------------
Age / Gender: ${age} Yrs / ${gender.toUpperCase()}
Height: ${heightDisplay}
Weight: ${weightDisplay}
Activity Level: ${activityLevel.toUpperCase()}
----------------------------------------
BMR (Basal Metabolic Rate): ${results.bmr.toLocaleString()} kcal/day
TDEE (Maintenance Energy): ${results.tdee.toLocaleString()} kcal/day
Fat Loss Target (-20% Deficit): ${results.cutCalories.toLocaleString()} kcal/day
Muscle Building Target (+10% Surplus): ${results.bulkCalories.toLocaleString()} kcal/day
----------------------------------------
Daily Maintenance Macros (30/40/30 Ratio):
• Protein: ${results.maintenanceMacros.proteinGrams}g
• Carbohydrates: ${results.maintenanceMacros.carbsGrams}g
• Healthy Fats: ${results.maintenanceMacros.fatGrams}g
----------------------------------------
Calculated at twistertools.com/tools/calculators/tdee-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric Parameter", "Value", "Unit / Description"];
        const rows = [
            ["TDEE Maintenance Calories", `${results.tdee}`, "kcal / day"],
            ["BMR Resting Baseline", `${results.bmr}`, "kcal / day"],
            ["Fat Loss Deficit (20%)", `${results.cutCalories}`, "kcal / day"],
            ["Aggressive Deficit (30%)", `${results.extremeCutCalories}`, "kcal / day"],
            ["Muscle Gain Surplus (10%)", `${results.bulkCalories}`, "kcal / day"],
            ["Maintenance Protein Target", `${results.maintenanceMacros.proteinGrams}g`, "30% Energy Ratio"],
            ["Maintenance Carbs Target", `${results.maintenanceMacros.carbsGrams}g`, "40% Energy Ratio"],
            ["Maintenance Fat Target", `${results.maintenanceMacros.fatGrams}g`, "30% Energy Ratio"],
            ["Demographic Sex", gender, "Biological Sex"],
            ["Age", `${age}`, "Years"],
            ["Activity Level", activityLevel, "Multiplier"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tdee_energy_expenditure_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Calorie & Daily Energy Expenditure (TDEE) Calculator",
        "url": "https://twistertools.com/tools/calculators/tdee-calculator",
        "description": "Calculate Total Daily Energy Expenditure (TDEE), Basal Metabolic Rate (BMR), calorie deficit/surplus targets, and macro split distributions.",
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
                "name": "What is Total Daily Energy Expenditure (TDEE)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Total Daily Energy Expenditure (TDEE) is the estimated total number of calories your body burns in a 24-hour period. It accounts for your Basal Metabolic Rate (BMR) multiplied by an activity factor representing exercise and daily movement."
                }
            },
            {
                "@type": "Question",
                "name": "How does BMR differ from TDEE?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Basal Metabolic Rate (BMR) measures the minimum energy required to sustain vital metabolic functions (heartbeat, respiration, organ function) at absolute rest. TDEE adds the energy expended through daily physical activity, digestion (NEAT and EAT) on top of your BMR."
                }
            },
            {
                "@type": "Question",
                "name": "How many calories should I eat to lose weight?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To achieve sustainable fat loss, aim for a moderate caloric deficit of approximately 15% to 20% below your TDEE maintenance level. This typically produces a safe weight loss rate of 0.5 to 1.0 pound per week."
                }
            },
            {
                "@type": "Question",
                "name": "What formula is used to calculate BMR and TDEE?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This calculator utilizes the Mifflin-St Jeor formula, which is considered the gold standard in clinical dietetics for predicting resting metabolic rate based on body weight, height, age, and sex."
                }
            },
            {
                "@type": "Question",
                "name": "How often should I recalculate my TDEE?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You should recalculate your TDEE every time you experience a significant body weight change (e.g., losing or gaining 5 to 10 lbs / 2 to 5 kg) or when your weekly routine and exercise activity level changes."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Biological Parameters
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
                                Unit System
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
                                    Imperial (lbs, ft/in)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (kg, cm)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Gender & Age Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Biological Sex
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setGender("male")}
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
                                        min="10"
                                        max="120"
                                        value={age || ""}
                                        onChange={(e) => {
                                            setAge(Math.max(1, Math.min(120, Number(e.target.value))));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Height Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Stature Height
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="2"
                                                max="8"
                                                value={heightFt || ""}
                                                onChange={(e) => {
                                                    setHeightFt(Math.max(0, Number(e.target.value)));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="11"
                                                value={heightIn || ""}
                                                onChange={(e) => {
                                                    setHeightIn(Math.max(0, Math.min(11, Number(e.target.value))));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">in</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="80"
                                            max="250"
                                            value={heightCm || ""}
                                            onChange={(e) => {
                                                setHeightCm(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Weight Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Current Body Weight
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="40"
                                            max="800"
                                            value={weightLbs || ""}
                                            onChange={(e) => {
                                                setWeightLbs(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">lbs</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="20"
                                            max="400"
                                            value={weightKg || ""}
                                            onChange={(e) => {
                                                setWeightKg(Math.max(0, Number(e.target.value)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                    </div>
                                )}
                            </div>

                            {/* Activity Level Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Daily Exercise & Activity Level
                                </label>
                                <select
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="sedentary">Sedentary (Desk job, little to no exercise)</option>
                                    <option value="light">Lightly Active (Light exercise 1–3 days/week)</option>
                                    <option value="moderate">Moderately Active (Moderate exercise 3–5 days/week)</option>
                                    <option value="active">Very Active (Hard exercise 6–7 days/week)</option>
                                    <option value="extreme">Extremely Active (Athletic training / physical job)</option>
                                </select>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Demographic Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Loaded
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
                            {copied ? "Copied" : "Copy TDEE Summary"}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Energy Balance Output
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Burn Target
                                </button>
                                <button
                                    onClick={() => setActiveTab("goals")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "goals" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Goal Calories
                                </button>
                                <button
                                    onClick={() => setActiveTab("macros")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "macros" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Macros
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Total Daily Energy Expenditure (TDEE)
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    Maintenance Level
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {results.tdee > 0 ? results.tdee.toLocaleString() : "--"}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">calories / day</span>
                            </div>

                            <p className="mt-3 text-xs text-indigo-200/90 leading-relaxed border-t border-indigo-800/80 pt-3">
                                Consuming exactly <strong>{results.tdee.toLocaleString()} calories/day</strong> maintains your current body weight of {unitSystem === "imperial" ? `${weightLbs} lbs` : `${weightKg} kg`} under your current activity regimen.
                            </p>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" && (
                            <div className="grid grid-cols-2 gap-3.5 pt-1">
                                {/* Basal Metabolic Rate */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Heart className="w-4 h-4 text-indigo-600" />
                                        BMR (At Complete Rest)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {results.bmr.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Basic vital metabolic overhead
                                    </p>
                                </div>

                                {/* Body Mass Index */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Activity className="w-4 h-4 text-indigo-600" />
                                        Body Mass Index (BMI)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {results.bmi.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Current stature-weight index
                                    </p>
                                </div>

                                {/* Fat Loss Target */}
                                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                                        <TrendingDown className="w-4 h-4 text-amber-600" />
                                        Fat Loss (-20% Deficit)
                                    </div>
                                    <p className="text-xl font-extrabold text-amber-900">
                                        {results.cutCalories.toLocaleString()} <span className="text-xs font-normal text-amber-700">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-amber-700/80">
                                        Lose ~1 lb (0.45 kg) per week
                                    </p>
                                </div>

                                {/* Muscle Gain Target */}
                                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        Muscle Gain (+10% Surplus)
                                    </div>
                                    <p className="text-xl font-extrabold text-emerald-900">
                                        {results.bulkCalories.toLocaleString()} <span className="text-xs font-normal text-emerald-700">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-emerald-700/80">
                                        Lean bulking with minimal fat
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "goals" && (
                            <div className="space-y-3">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">Aggressive Cutting (-30%)</div>
                                        <div className="text-sm text-slate-700 font-medium">For rapid fat loss (~1.5 lbs/week)</div>
                                    </div>
                                    <div className="text-lg font-black text-rose-600">{results.extremeCutCalories.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kcal</span></div>
                                </div>

                                <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-amber-700 uppercase">Standard Weight Loss (-20%)</div>
                                        <div className="text-sm text-amber-900 font-medium">Sustainable weight loss (~1 lb/week)</div>
                                    </div>
                                    <div className="text-lg font-black text-amber-700">{results.cutCalories.toLocaleString()} <span className="text-xs text-amber-800 font-normal">kcal</span></div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-indigo-700 uppercase">Weight Maintenance (0%)</div>
                                        <div className="text-sm text-slate-700 font-medium">Maintain body weight & composition</div>
                                    </div>
                                    <div className="text-lg font-black text-indigo-600">{results.tdee.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kcal</span></div>
                                </div>

                                <div className="p-3.5 border border-emerald-200 rounded-xl bg-emerald-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-emerald-700 uppercase">Lean Bulking (+10%)</div>
                                        <div className="text-sm text-emerald-900 font-medium">Gradual muscle growth (+0.5 lb/week)</div>
                                    </div>
                                    <div className="text-lg font-black text-emerald-700">{results.bulkCalories.toLocaleString()} <span className="text-xs text-emerald-800 font-normal">kcal</span></div>
                                </div>
                            </div>
                        )}

                        {activeTab === "macros" && (
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                    <span>Daily Maintenance Macros (30/40/30 Split)</span>
                                    <span>{results.tdee} kcal</span>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center space-y-1">
                                        <span className="text-[11px] font-bold text-indigo-600 uppercase">Protein (30%)</span>
                                        <div className="text-xl font-black text-indigo-900">{results.maintenanceMacros.proteinGrams}g</div>
                                        <span className="text-[10px] text-indigo-500">4 kcal / gram</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center space-y-1">
                                        <span className="text-[11px] font-bold text-amber-600 uppercase">Carbs (40%)</span>
                                        <div className="text-xl font-black text-amber-900">{results.maintenanceMacros.carbsGrams}g</div>
                                        <span className="text-[10px] text-amber-500">4 kcal / gram</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center space-y-1">
                                        <span className="text-[11px] font-bold text-emerald-600 uppercase">Fats (30%)</span>
                                        <div className="text-xl font-black text-emerald-900">{results.maintenanceMacros.fatGrams}g</div>
                                        <span className="text-[10px] text-emerald-500">9 kcal / gram</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                                    <strong>Macro Guidance:</strong> Protein protects lean muscle during caloric deficits, carbohydrates optimize glycogen stores for workouts, and healthy fats maintain metabolic hormone production.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>Mifflin-St Jeor Engine</span>
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

                {/* Card 1: Comprehensive Medical Mechanics & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Total Daily Energy Expenditure (TDEE) Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Total Daily Energy Expenditure (TDEE)</strong> represents the total caloric energy your body expends during a complete 24-hour cycle. It combines your baseline basal physiology with the metabolic demands of daily bodily movement, physical exercise, and dietary digestion. Understanding your TDEE is essential for structuring evidence-based nutrition plans for body composition goals like fat loss, athletic maintenance, or hypertrophy.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-indigo-600" /> Basal Metabolic Rate (BMR)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The foundational energy required to sustain life-preserving autonomic functions—such as breathing, cell synthesis, thermoregulation, and cardiac output—while at complete rest.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Physical Activity Level (PAL) Multiplier
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A standardized numerical scalar (ranging from 1.2 to 1.9) applied to your BMR to account for deliberate workouts, workplace activity, and Non-Exercise Activity Thermogenesis (NEAT).
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Underlying Clinical Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            The Mifflin-St Jeor equation utilized in this engine calculates BMR as follows:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Male BMR:</strong> (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5</div>
                            <div><strong>2. Female BMR:</strong> (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161</div>
                            <div><strong>3. Final TDEE:</strong> BMR × Activity Level Multiplier</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Activity Multipliers Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Activity Level Standard Multipliers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct physical activity coefficient is crucial for precise TDEE estimations. Overestimating daily activity is one of the most common causes of unexpected plateauing during diet plans:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Activity Level</th>
                                    <th className="p-3">Multiplier Factor</th>
                                    <th className="p-3">Lifestyle & Exercise Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Sedentary</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">1.200</td>
                                    <td className="p-3">Desk job, minimal standing, little to no structured intentional exercise.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Lightly Active</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">1.375</td>
                                    <td className="p-3">Light walking, desk job with moderate movement, light workouts 1–3 days/week.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Moderately Active</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">1.550</td>
                                    <td className="p-3 font-medium text-slate-800">Moderate exercise or sports 3–5 days per week. Active daily routine.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Very Active</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">1.725</td>
                                    <td className="p-3">Heavy workouts or endurance training 6–7 days per week. Physical labor job.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Extremely Active</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">1.900</td>
                                    <td className="p-3">Very heavy professional sports training or highly strenuous physical construction work.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Case Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Energy Balance Profiles
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how daily energy expenditure changes between different physical profiles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Male Desk Worker</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 32 Years | Male | 5'10" (70 in) | 185 lbs</li>
                                <li><strong>Activity:</strong> Sedentary (Desk Job)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Energy Profile:</li>
                                <li>• <strong>BMR:</strong> 1,777 kcal/day</li>
                                <li>• <strong>TDEE Maintenance:</strong> 2,132 kcal/day</li>
                                <li>• <strong>Fat Loss Target (-20%):</strong> 1,706 kcal/day</li>
                                <li>• <strong>Muscle Gain Target (+10%):</strong> 2,345 kcal/day</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Active Female Athlete</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 28 Years | Female | 168 cm | 62.5 kg</li>
                                <li><strong>Activity:</strong> Very Active (6 workouts/week)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Energy Profile:</li>
                                <li>• <strong>BMR:</strong> 1,374 kcal/day</li>
                                <li>• <strong>TDEE Maintenance:</strong> 2,370 kcal/day</li>
                                <li>• <strong>Fat Loss Target (-20%):</strong> 1,896 kcal/day</li>
                                <li>• <strong>Muscle Gain Target (+10%):</strong> 2,607 kcal/day</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Clinical Guidance & Nutritional Principles */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Apple className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Nutritional Strategies for Energy Balance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To optimize metabolic adaptation and long-term health outcomes, follow these clinical dietary guidelines based on your calculated expenditure:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Avoid Severe Deficits</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Deficits greater than 30% below TDEE can trigger severe metabolic slowing, loss of lean muscle mass, and biological hunger signaling spikes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Prioritize Protein intake</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                During caloric deficits, aim for 1.6g to 2.2g of protein per kilogram of body weight to safeguard skeletal muscle from catabolism.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Track & Adjust Periodically</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                As body mass decreases, your BMR and TDEE naturally shift downward. Recalculate your energy targets every 5 to 10 lbs of body weight change.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
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
                                What is Total Daily Energy Expenditure (TDEE)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Total Daily Energy Expenditure (TDEE) is the estimated total number of calories your body burns in a 24-hour period. It accounts for your Basal Metabolic Rate (BMR) multiplied by an activity factor representing exercise and daily movement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does BMR differ from TDEE?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Basal Metabolic Rate (BMR) measures the minimum energy required to sustain vital metabolic functions (heartbeat, respiration, organ function) at absolute rest. TDEE adds the energy expended through daily physical activity and exercise on top of your BMR.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many calories should I eat to lose weight?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To achieve sustainable fat loss, aim for a moderate caloric deficit of approximately 15% to 20% below your TDEE maintenance level. This typically produces a safe weight loss rate of 0.5 to 1.0 pound per week.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What formula is used to calculate BMR and TDEE?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This calculator utilizes the Mifflin-St Jeor formula, which is considered the gold standard in clinical dietetics for predicting resting metabolic rate based on body weight, height, age, and sex.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How often should I recalculate my TDEE?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You should recalculate your TDEE every time you experience a significant body weight change (e.g., losing or gaining 5 to 10 lbs / 2 to 5 kg) or when your weekly routine and exercise activity level changes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2 text-xs text-slate-600">
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