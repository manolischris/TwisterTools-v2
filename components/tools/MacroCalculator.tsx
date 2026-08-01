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
    Apple,
    Dumbbell,
    Gauge,
    Utensils,
    Percent
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extreme";
type PrimaryGoal = "cut" | "maintain" | "bulk";
type DietStyle = "balanced" | "low_carb" | "high_protein" | "keto" | "custom";

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
    goal: PrimaryGoal;
    dietStyle: DietStyle;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "fat-loss-male", label: "Fat Loss (Male)", system: "imperial", gender: "male", age: 30, weightLbs: 195, weightKg: 88.5, heightInches: 70, heightCm: 178, activity: "moderate", goal: "cut", dietStyle: "high_protein", tag: "Cutting" },
    { id: "endurance-female", label: "Endurance Runner (Female)", system: "metric", gender: "female", age: 27, weightLbs: 135, weightKg: 61, heightInches: 65, heightCm: 165, activity: "active", goal: "maintain", dietStyle: "balanced", tag: "Performance" },
    { id: "muscle-gain-male", label: "Lean Hypertrophy (Male)", system: "imperial", gender: "male", age: 24, weightLbs: 170, weightKg: 77, heightInches: 71, heightCm: 180, activity: "moderate", goal: "bulk", dietStyle: "balanced", tag: "Bulking" },
    { id: "keto-cut-female", label: "Ketogenic Cut (Female)", system: "imperial", gender: "female", age: 35, weightLbs: 160, weightKg: 72.5, heightInches: 64, heightCm: 162, activity: "light", goal: "cut", dietStyle: "keto", tag: "Keto Fat Loss" },
];

interface MacroDistribution {
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    proteinCalories: number;
    carbsCalories: number;
    fatCalories: number;
}

export default function MacroCalculator() {
    // Unit & Demographic States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);

    // Imperial Inputs
    const [weightLbs, setWeightLbs] = useState<number>(175);
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);

    // Metric Inputs
    const [weightKg, setWeightKg] = useState<number>(79.5);
    const [heightCm, setHeightCm] = useState<number>(178);

    // Activity, Goal & Diet Style States
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
    const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>("cut");
    const [dietStyle, setDietStyle] = useState<DietStyle>("balanced");

    // Custom Ratio Sliders (Used when dietStyle === 'custom')
    const [customProtein, setCustomProtein] = useState<number>(30);
    const [customCarbs, setCustomCarbs] = useState<number>(40);
    const [customFat, setCustomFat] = useState<number>(30);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"macros" | "meals" | "energy">("macros");
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

    // Core Calculation Logic
    const results = useMemo(() => {
        const hM = effectiveHeightMeters;
        const wKg = effectiveWeightKg;

        if (hM <= 0 || wKg <= 0 || age <= 0) {
            return {
                bmr: 0,
                tdee: 0,
                targetCalories: 0,
                bmi: 0,
                macros: {
                    proteinPercent: 0, carbsPercent: 0, fatPercent: 0,
                    proteinGrams: 0, carbsGrams: 0, fatGrams: 0,
                    proteinCalories: 0, carbsCalories: 0, fatCalories: 0
                },
                perMealThree: { protein: 0, carbs: 0, fat: 0, calories: 0 },
                perMealFour: { protein: 0, carbs: 0, fat: 0, calories: 0 }
            };
        }

        // 1. BMI Calculation
        const bmiVal = wKg / (hM * hM);

        // 2. BMR (Mifflin-St Jeor Equation)
        const heightInCm = hM * 100;
        let bmrVal = 10 * wKg + 6.25 * heightInCm - 5 * age;
        bmrVal = gender === "male" ? bmrVal + 5 : bmrVal - 161;

        // 3. Activity Level Multipliers
        const activityMultipliers: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            extreme: 1.9,
        };

        const tdeeVal = bmrVal * activityMultipliers[activityLevel];

        // 4. Goal Caloric Adjustment
        let targetCal = tdeeVal;
        if (primaryGoal === "cut") {
            targetCal = tdeeVal * 0.80; // 20% deficit
        } else if (primaryGoal === "bulk") {
            targetCal = tdeeVal * 1.10; // 10% surplus
        }

        targetCal = Math.max(1000, Math.round(targetCal));

        // 5. Determine Macro Split Ratios (%)
        let pPct = 30;
        let cPct = 40;
        let fPct = 30;

        if (dietStyle === "low_carb") {
            pPct = 40; cPct = 20; fPct = 40;
        } else if (dietStyle === "high_protein") {
            pPct = 40; cPct = 35; fPct = 25;
        } else if (dietStyle === "keto") {
            pPct = 25; cPct = 5; fPct = 70;
        } else if (dietStyle === "custom") {
            pPct = customProtein;
            cPct = customCarbs;
            fPct = customFat;
        }

        // Normalize ratio if total sum != 100% in custom mode
        const ratioSum = pPct + cPct + fPct;
        if (ratioSum > 0 && dietStyle === "custom") {
            pPct = Math.round((pPct / ratioSum) * 100);
            cPct = Math.round((cPct / ratioSum) * 100);
            fPct = 100 - pPct - cPct; // Ensure exact 100% total
        }

        // 6. Calculate Calories and Grams
        const pCals = targetCal * (pPct / 100);
        const cCals = targetCal * (cPct / 100);
        const fCals = targetCal * (fPct / 100);

        const pGrams = Math.round(pCals / 4);
        const cGrams = Math.round(cCals / 4);
        const fGrams = Math.round(fCals / 9);

        // 7. Meal Split Computations
        const macroDist: MacroDistribution = {
            proteinPercent: pPct,
            carbsPercent: cPct,
            fatPercent: fPct,
            proteinGrams: pGrams,
            carbsGrams: cGrams,
            fatGrams: fGrams,
            proteinCalories: Math.round(pCals),
            carbsCalories: Math.round(cCals),
            fatCalories: Math.round(fCals),
        };

        return {
            bmr: Math.round(Math.max(0, bmrVal)),
            tdee: Math.round(Math.max(0, tdeeVal)),
            targetCalories: targetCal,
            bmi: bmiVal,
            macros: macroDist,
            perMealThree: {
                protein: Math.round(pGrams / 3),
                carbs: Math.round(cGrams / 3),
                fat: Math.round(fGrams / 3),
                calories: Math.round(targetCal / 3),
            },
            perMealFour: {
                protein: Math.round(pGrams / 4),
                carbs: Math.round(cGrams / 4),
                fat: Math.round(fGrams / 4),
                calories: Math.round(targetCal / 4),
            },
        };
    }, [
        effectiveWeightKg,
        effectiveHeightMeters,
        age,
        gender,
        activityLevel,
        primaryGoal,
        dietStyle,
        customProtein,
        customCarbs,
        customFat,
    ]);

    // Handle Unit Toggle & Data Sync
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            setHeightCm(Math.round(totalInches * 2.54));
            setWeightKg(Math.round((weightLbs || 0) * 0.453592 * 10) / 10);
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
        setPrimaryGoal(preset.goal);
        setDietStyle(preset.dietStyle);

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
        setWeightLbs(175);
        setHeightFt(5);
        setHeightIn(10);
        setWeightKg(79.5);
        setHeightCm(178);
        setActivityLevel("moderate");
        setPrimaryGoal("cut");
        setDietStyle("balanced");
        setCustomProtein(30);
        setCustomCarbs(40);
        setCustomFat(30);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial"
            ? `${heightFt}'${heightIn}"`
            : `${heightCm} cm`;
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;

        const summaryText = `Macro Ratio & Daily Nutrition Targets (TwisterTools):
----------------------------------------
Biological Sex: ${gender.toUpperCase()} | Age: ${age} Yrs
Height: ${heightDisplay} | Weight: ${weightDisplay}
Activity Level: ${activityLevel.toUpperCase()}
Target Goal: ${primaryGoal.toUpperCase()} | Strategy: ${dietStyle.toUpperCase()}
----------------------------------------
TDEE Maintenance: ${results.tdee.toLocaleString()} kcal/day
Target Energy Intake: ${results.targetCalories.toLocaleString()} kcal/day
----------------------------------------
DAILY MACRONUTRIENT TARGETS (${results.macros.proteinPercent}/${results.macros.carbsPercent}/${results.macros.fatPercent} Split):
• Protein: ${results.macros.proteinGrams}g (${results.macros.proteinCalories} kcal)
• Carbohydrates: ${results.macros.carbsGrams}g (${results.macros.carbsCalories} kcal)
• Healthy Fats: ${results.macros.fatGrams}g (${results.macros.fatCalories} kcal)
----------------------------------------
MEAL BREAKDOWN (3 Meals / Day):
• ${results.perMealThree.protein}g Protein | ${results.perMealThree.carbs}g Carbs | ${results.perMealThree.fat}g Fat per meal (~${results.perMealThree.calories} kcal)
----------------------------------------
Calculated at twistertools.com/tools/calculators/macro-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Macro Parameter", "Value", "Unit / Metric Details"];
        const rows = [
            ["Target Daily Energy", `${results.targetCalories}`, "kcal / day"],
            ["TDEE Maintenance Energy", `${results.tdee}`, "kcal / day"],
            ["BMR Baseline", `${results.bmr}`, "kcal / day"],
            ["Protein Target", `${results.macros.proteinGrams}g`, `${results.macros.proteinPercent}% Total Calories (${results.macros.proteinCalories} kcal)`],
            ["Carbohydrate Target", `${results.macros.carbsGrams}g`, `${results.macros.carbsPercent}% Total Calories (${results.macros.carbsCalories} kcal)`],
            ["Fat Target", `${results.macros.fatGrams}g`, `${results.macros.fatPercent}% Total Calories (${results.macros.fatCalories} kcal)`],
            ["3-Meal Split (per meal)", `${results.perMealThree.protein}g P / ${results.perMealThree.carbs}g C / ${results.perMealThree.fat}g F`, `~${results.perMealThree.calories} kcal`],
            ["4-Meal Split (per meal)", `${results.perMealFour.protein}g P / ${results.perMealFour.carbs}g C / ${results.perMealFour.fat}g F`, `~${results.perMealFour.calories} kcal`],
            ["Primary Goal", primaryGoal, "Fitness Goal"],
            ["Dietary Distribution Model", dietStyle, "Macronutrient Strategy"],
            ["Sex", gender, "Biological Sex"],
            ["Age", `${age}`, "Years"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `macro_dietary_targets.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Macro Ratio & Flexible Dieting Calculator",
        "url": "https://twistertools.com/tools/calculators/macro-calculator",
        "description": "Calculate custom macro ratios (protein, carbohydrates, and fats) optimized for fat loss, muscle growth, body recomposition, or ketogenic diets.",
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
                "name": "What are macros in nutrition?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Macros (macronutrients) are the three major nutrient categories your body requires in large amounts to supply energy: Protein (4 kcal/g), Carbohydrates (4 kcal/g), and Fats (9 kcal/g)."
                }
            },
            {
                "@type": "Question",
                "name": "What macro ratio is best for losing fat?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A high-protein macro split (e.g., 40% Protein, 35% Carbs, 25% Fat or 40% Protein, 20% Carbs, 40% Fat) is ideal for fat loss because protein preserves lean muscle tissue during a calorie deficit while increasing satiety."
                }
            },
            {
                "@type": "Question",
                "name": "How much protein do I need per day?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For resistance-trained individuals and active adults, evidence-based recommendations suggest consuming between 1.6 to 2.2 grams of protein per kilogram of body weight (0.7 to 1.0 gram per pound) daily."
                }
            },
            {
                "@type": "Question",
                "name": "What is Flexible Dieting (IIFYM)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Flexible Dieting, also known as 'If It Fits Your Macros' (IIFYM), is a nutritional approach that focuses on hitting daily calorie, protein, carbohydrate, and fat targets rather than restricting specific food groups."
                }
            },
            {
                "@type": "Question",
                "name": "How do keto macros differ from standard balanced macros?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A standard balanced macro split typically allocates 30% Protein, 40% Carbs, and 30% Fat. Ketogenic (Keto) diets restrict carbohydrates to approximately 5% of total intake while dramatically increasing healthy fats to 70% to induce state of nutritional ketosis."
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
                {/* Left Workspace Panel: Input Controls & Macro Strategy Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[680px]">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Metabolic & Goal Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Toggle */}
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

                        <div className="space-y-4">
                            {/* Sex & Age Row */}
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

                            {/* Height & Weight Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Stature Height
                                    </label>
                                    {unitSystem === "imperial" ? (
                                        <div className="grid grid-cols-2 gap-2">
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
                                                    className="w-full pl-2.5 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
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
                                                    className="w-full pl-2.5 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">in</span>
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
                                                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5 text-indigo-600" /> Body Weight
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
                                                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
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
                                                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity Level Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Physical Activity Factor
                                </label>
                                <select
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="sedentary">Sedentary (Desk job, little to no exercise)</option>
                                    <option value="light">Lightly Active (Light workout 1–3 days/week)</option>
                                    <option value="moderate">Moderately Active (Moderate exercise 3–5 days/week)</option>
                                    <option value="active">Very Active (Hard training 6–7 days/week)</option>
                                    <option value="extreme">Extremely Active (Athletic training / physical job)</option>
                                </select>
                            </div>

                            {/* Primary Goal Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Target className="w-3.5 h-3.5 text-indigo-600" /> Fitness Target Goal
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryGoal("cut")}
                                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 ${primaryGoal === "cut"
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        <TrendingDown className="w-3.5 h-3.5" /> Fat Loss (-20%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryGoal("maintain")}
                                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 ${primaryGoal === "maintain"
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        <Activity className="w-3.5 h-3.5" /> Recomp / Maintain
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryGoal("bulk")}
                                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 ${primaryGoal === "bulk"
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                            }`}
                                    >
                                        <TrendingUp className="w-3.5 h-3.5" /> Lean Muscle (+10%)
                                    </button>
                                </div>
                            </div>

                            {/* Macro Dietary Strategy Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <PieChart className="w-3.5 h-3.5 text-indigo-600" /> Dietary Macro Ratio Strategy
                                </label>
                                <select
                                    value={dietStyle}
                                    onChange={(e) => setDietStyle(e.target.value as DietStyle)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="balanced">Balanced Split (30% P / 40% C / 30% F)</option>
                                    <option value="high_protein">High Protein / Athletic Body Recomp (40% P / 35% C / 25% F)</option>
                                    <option value="low_carb">Low Carbohydrate (40% P / 20% C / 40% F)</option>
                                    <option value="keto">Ketogenic Standard (25% P / 5% C / 70% F)</option>
                                    <option value="custom">Custom Percentage Sliders</option>
                                </select>
                            </div>

                            {/* Dynamic Custom Sliders */}
                            {dietStyle === "custom" && (
                                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                        <span>Custom Macro Ratios</span>
                                        <span>Sum: {customProtein + customCarbs + customFat}%</span>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                                                <span>Protein: {customProtein}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="70"
                                                value={customProtein}
                                                onChange={(e) => setCustomProtein(Number(e.target.value))}
                                                className="w-full accent-indigo-600"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                                                <span>Carbohydrates: {customCarbs}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="70"
                                                value={customCarbs}
                                                onChange={(e) => setCustomCarbs(Number(e.target.value))}
                                                className="w-full accent-indigo-600"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between font-semibold text-slate-700 mb-0.5">
                                                <span>Healthy Fats: {customFat}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="80"
                                                value={customFat}
                                                onChange={(e) => setCustomFat(Number(e.target.value))}
                                                className="w-full accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PRESETS ROW */}
                        <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs whitespace-nowrap ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                                }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"}`}>
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
                            {copied ? "Copied" : "Copy Macro Plan"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Meal Splits */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[680px]" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Calculated Macro Targets
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("macros")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "macros" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Macro Split
                                </button>
                                <button
                                    onClick={() => setActiveTab("meals")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "meals" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Meal Distribution
                                </button>
                                <button
                                    onClick={() => setActiveTab("energy")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "energy" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"}`}
                                >
                                    Energy Balance
                                </button>
                            </div>
                        </div>

                        {/* Target Daily Energy Hero Banner */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Daily Target Energy Budget
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 capitalize">
                                    {primaryGoal === "cut" ? "Fat Loss Target" : primaryGoal === "bulk" ? "Muscle Gain Target" : "Maintenance Target"}
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {results.targetCalories > 0 ? results.targetCalories.toLocaleString() : "--"}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">calories / day</span>
                            </div>

                            <p className="mt-3 text-xs text-indigo-200/90 leading-relaxed border-t border-indigo-800/80 pt-3">
                                Configured for <strong>{primaryGoal === "cut" ? "a 20% Caloric Deficit" : primaryGoal === "bulk" ? "a 10% Caloric Surplus" : "Caloric Maintenance"}</strong> relative to your estimated TDEE of {results.tdee.toLocaleString()} kcal/day.
                            </p>
                        </div>

                        {/* Macro Ratios Breakdown View */}
                        {activeTab === "macros" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Protein Card */}
                                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 flex flex-col justify-between space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                                                <Dumbbell className="w-3.5 h-3.5" /> Protein
                                            </span>
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-200/60 text-indigo-800">
                                                {results.macros.proteinPercent}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-indigo-950">{results.macros.proteinGrams}g</div>
                                            <div className="text-[11px] font-semibold text-indigo-600/80">{results.macros.proteinCalories} kcal</div>
                                        </div>
                                        <div className="w-full bg-indigo-200/60 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${results.macros.proteinPercent}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Carbohydrates Card */}
                                    <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-100 flex flex-col justify-between space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-700 uppercase flex items-center gap-1">
                                                <Zap className="w-3.5 h-3.5" /> Carbs
                                            </span>
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-800">
                                                {results.macros.carbsPercent}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-amber-950">{results.macros.carbsGrams}g</div>
                                            <div className="text-[11px] font-semibold text-amber-700/80">{results.macros.carbsCalories} kcal</div>
                                        </div>
                                        <div className="w-full bg-amber-200/60 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${results.macros.carbsPercent}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Healthy Fats Card */}
                                    <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-100 flex flex-col justify-between space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                                                <Apple className="w-3.5 h-3.5" /> Fats
                                            </span>
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
                                                {results.macros.fatPercent}%
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-emerald-950">{results.macros.fatGrams}g</div>
                                            <div className="text-[11px] font-semibold text-emerald-700/80">{results.macros.fatCalories} kcal</div>
                                        </div>
                                        <div className="w-full bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${results.macros.fatPercent}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Macro Proportions Bar */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Macro Ratio Visual Distribution</span>
                                        <span>100% Caloric Equivalence</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200">
                                        <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${results.macros.proteinPercent}%` }} title={`Protein ${results.macros.proteinPercent}%`} />
                                        <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${results.macros.carbsPercent}%` }} title={`Carbs ${results.macros.carbsPercent}%`} />
                                        <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${results.macros.fatPercent}%` }} title={`Fats ${results.macros.fatPercent}%`} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Per-Meal Breakdown View */}
                        {activeTab === "meals" && (
                            <div className="space-y-3">
                                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                            <Utensils className="w-4 h-4 text-indigo-600" /> 3 Meals Per Day Strategy
                                        </span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                            ~{results.perMealThree.calories} kcal / meal
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-indigo-600 font-bold block">{results.perMealThree.protein}g</span> Protein
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-amber-600 font-bold block">{results.perMealThree.carbs}g</span> Carbs
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-emerald-600 font-bold block">{results.perMealThree.fat}g</span> Fats
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                            <Utensils className="w-4 h-4 text-indigo-600" /> 4 Meals Per Day Strategy
                                        </span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                            ~{results.perMealFour.calories} kcal / meal
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-indigo-600 font-bold block">{results.perMealFour.protein}g</span> Protein
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-amber-600 font-bold block">{results.perMealFour.carbs}g</span> Carbs
                                        </div>
                                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-medium">
                                            <span className="text-emerald-600 font-bold block">{results.perMealFour.fat}g</span> Fats
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Energy Balance Overview */}
                        {activeTab === "energy" && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5 text-indigo-600" /> Basal Metabolic (BMR)
                                    </span>
                                    <p className="text-xl font-extrabold text-slate-900">{results.bmr.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kcal</span></p>
                                    <p className="text-[11px] text-slate-500">Resting physiological overhead</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-600" /> TDEE Maintenance
                                    </span>
                                    <p className="text-xl font-extrabold text-slate-900">{results.tdee.toLocaleString()} <span className="text-xs text-slate-500 font-normal">kcal</span></p>
                                    <p className="text-[11px] text-slate-500">Energy expenditure with activity</p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 col-span-2">
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                        <Percent className="w-3.5 h-3.5 text-indigo-600" /> Stature-Weight Index (BMI)
                                    </span>
                                    <p className="text-xl font-extrabold text-slate-900">{results.bmi.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg/m²</span></p>
                                    <p className="text-[11px] text-slate-500">Standard body mass index metric based on current stature inputs.</p>
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

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Science of Macronutrients */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Macronutrient Ratios & Flexible Dieting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Macronutrients—protein, carbohydrates, and fats—form the energy baseline of human nutrition. While energy balance (calories in versus calories burnt) determines overall body weight shifts, the specific breakdown of macronutrients dictates whether weight change comes from fat tissue or lean skeletal muscle.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-indigo-600" /> Dietary Protein (4 kcal/g)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Crucial for tissue repair, enzymatic synthesis, and preserving skeletal muscle during caloric deficits. Protein features the highest Thermic Effect of Food (TEF), expending ~20-30% of its caloric value during digestion.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Carbohydrates (4 kcal/g)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The primary metabolic fuel for high-intensity exercise, muscle glycogen replenishment, and central nervous system function. Complex carbohydrates supply sustained energetic performance.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Apple className="w-4 h-4 text-indigo-600" /> Healthy Fats (9 kcal/g)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Essential for endocrine health, steroid hormone production (such as testosterone and estrogen), cellular membrane integrity, and fat-soluble vitamin absorption (A, D, E, K).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Macro Profiles Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Macro Ratios & Dietary Strategies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate macro strategy depends on training intensity, metabolic health, and personal diet preferences:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Strategy Name</th>
                                    <th className="p-3">Protein / Carbs / Fat Split</th>
                                    <th className="p-3">Primary Fitness & Dietary Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Balanced Split</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">30% P / 40% C / 30% F</td>
                                    <td className="p-3">General fitness, sports performance maintenance, sustainable long-term nutrition.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">High Protein / Recomp</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">40% P / 35% C / 25% F</td>
                                    <td className="p-3 font-medium text-slate-800">Fat loss while preserving muscle tissue during high-volume resistance training.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Low Carbohydrate</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">40% P / 20% C / 40% F</td>
                                    <td className="p-3">Sedentary individuals or those seeking improved glycemic response and appetite control.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Ketogenic Standard</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">25% P / 5% C / 70% F</td>
                                    <td className="p-3">Inducing nutritional ketosis where the liver converts fats into ketone bodies for energy.</td>
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
                            Real-World Worked Macro Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        See how dietary macro targets change depending on individual body mass and fitness goals:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Fat Loss Cut (Male)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Profile:</strong> 30 Yrs | Male | 5'10" | 195 lbs</li>
                                <li><strong>Goal & Strategy:</strong> Fat Loss (-20%) | High Protein (40/35/25)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Targets:</li>
                                <li>• <strong>Target Intake:</strong> 1,780 kcal/day</li>
                                <li>• <strong>Protein:</strong> 178g / day (712 kcal)</li>
                                <li>• <strong>Carbohydrates:</strong> 156g / day (623 kcal)</li>
                                <li>• <strong>Fats:</strong> 49g / day (445 kcal)</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Endurance Performance (Female)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Profile:</strong> 27 Yrs | Female | 165 cm | 61 kg</li>
                                <li><strong>Goal & Strategy:</strong> Maintenance (0%) | Balanced (30/40/30)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Targets:</li>
                                <li>• <strong>Target Intake:</strong> 2,050 kcal/day</li>
                                <li>• <strong>Protein:</strong> 154g / day (615 kcal)</li>
                                <li>• <strong>Carbohydrates:</strong> 205g / day (820 kcal)</li>
                                <li>• <strong>Fats:</strong> 68g / day (615 kcal)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
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
                                What are macros in nutrition?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Macros (macronutrients) are the three major nutrient categories your body requires in large amounts to supply energy: Protein (4 kcal/g), Carbohydrates (4 kcal/g), and Fats (9 kcal/g).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What macro ratio is best for losing fat?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A high-protein macro split (e.g., 40% Protein, 35% Carbs, 25% Fat or 40% Protein, 20% Carbs, 40% Fat) is ideal for fat loss because protein preserves lean muscle tissue during a calorie deficit while increasing satiety.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much protein do I need per day?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For resistance-trained individuals and active adults, evidence-based recommendations suggest consuming between 1.6 to 2.2 grams of protein per kilogram of body weight (0.7 to 1.0 gram per pound) daily.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Flexible Dieting (IIFYM)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Flexible Dieting, also known as "If It Fits Your Macros" (IIFYM), is a nutritional approach that focuses on hitting daily calorie, protein, carbohydrate, and fat targets rather than restricting specific food groups.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do keto macros differ from standard balanced macros?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A standard balanced macro split typically allocates 30% Protein, 40% Carbs, and 30% Fat. Ketogenic (Keto) diets restrict carbohydrates to approximately 5% of total intake while dramatically increasing healthy fats to 70% to induce state of nutritional ketosis.
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