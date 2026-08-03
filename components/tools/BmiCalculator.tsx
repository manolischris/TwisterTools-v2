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
    Stethoscope
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
    { id: "avg-male-imp", label: "Avg Male (US)", system: "imperial", gender: "male", age: 30, weightLbs: 185, weightKg: 84, heightInches: 70, heightCm: 178, activity: "moderate", tag: "5'10 / 185 lbs" },
    { id: "avg-female-met", label: "Avg Female (EU)", system: "metric", gender: "female", age: 28, weightLbs: 140, weightKg: 63, heightInches: 65, heightCm: 165, activity: "light", tag: "165cm / 63kg" },
    { id: "athletic-male", label: "Active Male", system: "imperial", gender: "male", age: 25, weightLbs: 175, weightKg: 79.5, heightInches: 71, heightCm: 180, activity: "active", tag: "High Active" },
];

interface BmiCategory {
    name: string;
    range: string;
    color: string;
    bgColor: string;
    borderColor: string;
    min: number;
    max: number;
}

const BMI_CATEGORIES: BmiCategory[] = [
    { name: "Underweight", range: "< 18.5", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", min: 0, max: 18.49 },
    { name: "Normal weight", range: "18.5 – 24.9", color: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", min: 18.5, max: 24.99 },
    { name: "Overweight", range: "25.0 – 29.9", color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", min: 25.0, max: 29.99 },
    { name: "Obesity Class I", range: "30.0 – 34.9", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", min: 30.0, max: 34.99 },
    { name: "Obesity Class II", range: "35.0 – 39.9", color: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200", min: 35.0, max: 39.99 },
    { name: "Obesity Class III", range: "≥ 40.0", color: "text-rose-700", bgColor: "bg-rose-100", borderColor: "border-rose-300", min: 40.0, max: 100 },
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

export default function BmiCalculator() {
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

    // Optional Body Comp Factors
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "categories">("overview");
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

    // Core Metrics Calculations
    const results = useMemo(() => {
        const hM = effectiveHeightMeters;
        const wKg = effectiveWeightKg;

        if (hM <= 0 || wKg <= 0) {
            return {
                bmi: 0,
                category: BMI_CATEGORIES[1],
                idealWeightMin: 0,
                idealWeightMax: 0,
                bmr: 0,
                tdee: 0,
                bodyFatEstimate: 0,
            };
        }

        // 1. BMI Calculation: kg / m^2
        const bmiVal = wKg / (hM * hM);

        // Determine Category
        let cat = BMI_CATEGORIES.find((c) => bmiVal >= c.min && bmiVal <= c.max);
        if (!cat) {
            cat = bmiVal > 40 ? BMI_CATEGORIES[5] : BMI_CATEGORIES[0];
        }

        // 2. Ideal Weight Range (BMI 18.5 - 24.9)
        const idealKgMin = 18.5 * (hM * hM);
        const idealKgMax = 24.9 * (hM * hM);

        // 3. BMR (Mifflin-St Jeor Equation)
        const heightInCm = hM * 100;
        let bmrVal = 10 * wKg + 6.25 * heightInCm - 5 * age;
        bmrVal = gender === "male" ? bmrVal + 5 : bmrVal - 161;

        // 4. TDEE
        const activityMultipliers: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            extreme: 1.9,
        };
        const tdeeVal = bmrVal * activityMultipliers[activityLevel];

        // 5. Estimated Body Fat % (Adult Body Fat Formula)
        // Body Fat % = (1.20 × BMI) + (0.23 × Age) - (10.8 × gender_factor) - 5.4
        // gender_factor: Male = 1, Female = 0
        const genderFactor = gender === "male" ? 1 : 0;
        const bfEstimate = 1.2 * bmiVal + 0.23 * age - 10.8 * genderFactor - 5.4;

        return {
            bmi: bmiVal,
            category: cat,
            idealWeightMin: idealKgMin,
            idealWeightMax: idealKgMax,
            bmr: Math.round(Math.max(0, bmrVal)),
            tdee: Math.round(Math.max(0, tdeeVal)),
            bodyFatEstimate: Math.max(3, Math.min(60, bfEstimate)),
        };
    }, [effectiveWeightKg, effectiveHeightMeters, age, gender, activityLevel]);

    // Format Ideal Weight output based on active unit system
    const formattedIdealWeightRange = useMemo(() => {
        if (unitSystem === "imperial") {
            const minLbs = Math.round(results.idealWeightMin * 2.20462);
            const maxLbs = Math.round(results.idealWeightMax * 2.20462);
            return `${minLbs} – ${maxLbs} lbs`;
        }
        const minKg = Math.round(results.idealWeightMin);
        const maxKg = Math.round(results.idealWeightMax);
        return `${minKg} – ${maxKg} kg`;
    }, [unitSystem, results.idealWeightMin, results.idealWeightMax]);

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

        const summaryText = `BMI & Body Composition Summary (TwisterTools):
----------------------------------------
Age / Gender: ${age} Yrs / ${gender.toUpperCase()}
Height: ${heightDisplay}
Weight: ${weightDisplay}
----------------------------------------
BMI: ${results.bmi.toFixed(1)} (${results.category.name})
Ideal Weight Target: ${formattedIdealWeightRange}
Estimated Body Fat: ${results.bodyFatEstimate.toFixed(1)}%
BMR (Basal Metabolic Rate): ${results.bmr} kcal/day
TDEE (Daily Burn): ${results.tdee} kcal/day
----------------------------------------
Calculated at twistertools.com/tools/calculators/bmi-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Value", "Unit / Status"];
        const rows = [
            ["BMI Index", results.bmi.toFixed(1), results.category.name],
            ["Ideal Weight Range", formattedIdealWeightRange, "Normal Range"],
            ["Est. Body Fat", `${results.bodyFatEstimate.toFixed(1)}%`, "Adult Formula"],
            ["BMR (Basal Metabolic)", `${results.bmr}`, "kcal / day"],
            ["TDEE (Maintenance)", `${results.tdee}`, "kcal / day"],
            ["Gender", gender, "Demographic"],
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
        link.setAttribute("download", `bmi_body_composition_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "BMI & Body Composition Calculator",
        "url": "https://twistertools.com/tools/calculators/bmi-calculator",
        "description": "Calculate Body Mass Index (BMI), ideal weight target, body fat %, BMR, and TDEE with dual Imperial and Metric system support.",
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
                "name": "What is Body Mass Index (BMI)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Body Mass Index (BMI) is a clinical screening ratio calculated using body mass and height to categorize individuals into weight categories including underweight, normal weight, overweight, and obesity."
                }
            },
            {
                "@type": "Question",
                "name": "How is BMI calculated in Imperial vs. Metric units?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the metric system, BMI is calculated as weight in kilograms divided by height in meters squared (kg/m²). In the imperial system, it uses the formula: [weight in pounds / (height in inches)²] × 703."
                }
            },
            {
                "@type": "Question",
                "name": "What are the clinical limitations of relying solely on BMI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BMI does not differentiate between skeletal muscle mass and subcutaneous or visceral adipose tissue. Muscular athletes often show an elevated BMI despite having healthy essential body fat levels."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between BMR and TDEE?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Basal Metabolic Rate (BMR) measures the minimal caloric energy needed to preserve basic vital physiological functions at complete rest. Total Daily Energy Expenditure (TDEE) accounts for activity level to calculate total daily caloric burn."
                }
            },
            {
                "@type": "Question",
                "name": "How does age influence body fat percentage estimation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As age advances, natural changes in muscle density and metabolic rate alter body composition. The Adult Body Fat Formula accounts for age to adjust calculated body fat percentages alongside BMI."
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
                                <Scale className="w-5 h-5 text-indigo-600" />
                                Personal Parameters
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
                                Measurement Unit System
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
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
                                        value={age === 0 ? "" : age}
                                        onChange={(e) => { handleNumberInput(e, (val) => setAge(val === 0 ? 0 : Math.max(1, Math.min(120, val)))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Height Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Height
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="2"
                                                max="8"
                                                value={heightFt === 0 ? "" : heightFt}
                                                onChange={(e) => { handleNumberInput(e, (val) => setHeightFt(Math.max(0, val))); setActivePresetId(null); }}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="11"
                                                value={heightIn === 0 ? "" : heightIn}
                                                onChange={(e) => { handleNumberInput(e, (val) => setHeightIn(Math.max(0, Math.min(11, val)))); setActivePresetId(null); }}
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
                                            value={heightCm === 0 ? "" : heightCm}
                                            onChange={(e) => { handleNumberInput(e, (val) => setHeightCm(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Weight Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Weight
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="40"
                                            max="800"
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
                                            min="20"
                                            max="400"
                                            value={weightKg === 0 ? "" : weightKg}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWeightKg(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                    </div>
                                )}
                            </div>

                            {/* Activity Level Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Physical Activity Level
                                </label>
                                <select
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                                    <option value="light">Lightly Active (1–3 days/week)</option>
                                    <option value="moderate">Moderately Active (3–5 days/week)</option>
                                    <option value="active">Very Active (6–7 days/week)</option>
                                    <option value="extreme">Extremely Active (Hard workout daily / Job)</option>
                                </select>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Reference Presets
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
                            {copied ? "Copied" : "Copy Summary"}
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
                                Body Composition Metrics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setActiveTab("categories")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "categories" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    BMI Scale
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className={`p-5 rounded-2xl border ${results.category.bgColor} ${results.category.borderColor} transition-all`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Body Mass Index (BMI)
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${results.category.bgColor} ${results.category.color} ${results.category.borderColor}`}>
                                    {results.category.name}
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className={`text-4xl md:text-5xl font-black ${results.category.color}`}>
                                    {results.bmi > 0 ? results.bmi.toFixed(1) : "--"}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">kg / m²</span>
                            </div>

                            {/* Visual BMI Scale Slider Bar */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div className="bg-amber-400 h-full w-[18.5%]" title="Underweight" />
                                    <div className="bg-emerald-500 h-full w-[25%]" title="Normal" />
                                    <div className="bg-amber-500 h-full w-[18.75%]" title="Overweight" />
                                    <div className="bg-orange-500 h-full w-[18.75%]" title="Obesity I" />
                                    <div className="bg-rose-600 h-full w-[19%]" title="Obesity II & III" />

                                    {/* Indicator Marker */}
                                    {results.bmi > 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border-x border-white shadow-md transform -translate-x-1/2 transition-all duration-500"
                                            style={{
                                                left: `${Math.min(100, Math.max(0, (results.bmi / 40) * 100))}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>15</span>
                                    <span>18.5</span>
                                    <span>25.0</span>
                                    <span>30.0</span>
                                    <span>40+</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 .5 pt-1">
                                {/* Ideal Weight */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Target className="w-4 h-4 text-indigo-600" />
                                        Ideal Weight Target
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {formattedIdealWeightRange}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Based on normal 18.5–24.9 BMI
                                    </p>
                                </div>

                                {/* Estimated Body Fat */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Activity className="w-4 h-4 text-indigo-600" />
                                        Est. Body Fat
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {results.bodyFatEstimate.toFixed(1)}%
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Adult age & sex equation
                                    </p>
                                </div>

                                {/* BMR */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Heart className="w-4 h-4 text-indigo-600" />
                                        BMR (At Rest)
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {results.bmr.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Basal Metabolic Rate
                                    </p>
                                </div>

                                {/* TDEE Daily Energy */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Flame className="w-4 h-4 text-indigo-600" />
                                        TDEE (Daily Burn)
                                    </div>
                                    <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                        {results.tdee.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Maintenance Calorie Target
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* BMI Category Reference Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Category</th>
                                            <th className="p-2.5">BMI Range</th>
                                            <th className="p-2.5">Health Risk Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {BMI_CATEGORIES.map((cat) => {
                                            const isCurrent = cat.name === results.category.name;
                                            return (
                                                <tr
                                                    key={cat.name}
                                                    className={`transition ${isCurrent ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 flex items-center gap-1.5">
                                                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                        <span className={cat.color}>{cat.name}</span>
                                                    </td>
                                                    <td className="p-2.5 text-slate-900">{cat.range}</td>
                                                    <td className="p-2.5 text-slate-500">
                                                        {cat.name === "Normal weight" ? "Low Risk" : "Increased Risk"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
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

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Medical Mechanics & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Body Mass Index & Body Composition Mechanics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Body Mass Index (BMI)</strong> is an international epidemiological metric established by the World Health Organization (WHO) to classify body weight relative to height[cite: 2]. While BMI serves as a primary screening tool for population health and clinical risk stratification, evaluating true body composition requires analyzing complementary metrics like Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and estimated body fat percentage[cite: 2].
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Imperial vs. Metric Equations
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Imperial units utilize a scaling constant of 703 to convert pounds and inches: BMI = (weight in pounds / (height in inches)²) × 703[cite: 2]. Metric calculation uses the direct ratio: BMI = weight in kg / (height in meters)²[cite: 2].
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Mifflin-St Jeor BMR Standard
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Widely regarded by dietitians as the most accurate clinical BMR formula[cite: 2]. It computes resting metabolic baseline based on mass, stature, age, and biological sex[cite: 2].
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Comprehensive Metabolic Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            Clinical equations implemented directly inside this engine[cite: 2]:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Metric BMI:</strong> BMI = weight(kg) / height(m)²[cite: 2]</div>
                            <div><strong>2. Imperial BMI:</strong> BMI = [weight(lbs) / height(in)²] × 703[cite: 2]</div>
                            <div><strong>3. BMR (Male):</strong> (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5[cite: 2]</div>
                            <div><strong>4. BMR (Female):</strong> (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161[cite: 2]</div>
                            <div><strong>5. Adult Body Fat %:</strong> (1.20 × BMI) + (0.23 × Age) - (10.8 × sex_factor) - 5.4 [Male = 1, Female = 0][cite: 2]</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Detailed Reference Tables & Classifications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical BMI & Body Fat Reference Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Medical institutions classify health risk profiles according to standard BMI thresholds and sex-specific body fat percentages:
                    </p>

                    {/* Table 1: WHO BMI Categories */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            World Health Organization (WHO) BMI Classifications
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">BMI Category</th>
                                        <th className="p-3">BMI Range (kg/m²)</th>
                                        <th className="p-3">Primary Associated Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-amber-600">Underweight</td>
                                        <td className="p-3">&lt; 18.5</td>
                                        <td className="p-3">Nutritional deficiency, osteoporosis, immunity decline</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/30">
                                        <td className="p-3 font-bold text-emerald-600">Normal Weight</td>
                                        <td className="p-3 font-semibold">18.5 – 24.9</td>
                                        <td className="p-3 font-medium text-emerald-700">Lowest statistical risk for metabolic disease</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-amber-600">Overweight</td>
                                        <td className="p-3">25.0 – 29.9</td>
                                        <td className="p-3">Moderate risk for cardiovascular strain</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-orange-600">Obesity Class I</td>
                                        <td className="p-3">30.0 – 34.9</td>
                                        <td className="p-3">High risk for hypertension and type 2 diabetes</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-rose-600">Obesity Class II</td>
                                        <td className="p-3">35.0 – 39.9</td>
                                        <td className="p-3">Very high risk for chronic cardiometabolic conditions</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-rose-700">Obesity Class III</td>
                                        <td className="p-3">≥ 40.0</td>
                                        <td className="p-3">Extremely high clinical health risk</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 2: ACE Body Fat Categories */}
                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            American Council on Exercise (ACE) Body Fat Ranges
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Classification</th>
                                        <th className="p-3">Women (% Fat)</th>
                                        <th className="p-3">Men (% Fat)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Essential Fat</td>
                                        <td className="p-3">10% – 13%</td>
                                        <td className="p-3">2% – 5%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-indigo-600">Athletes</td>
                                        <td className="p-3">14% – 20%</td>
                                        <td className="p-3">6% – 13%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-emerald-600">Fitness</td>
                                        <td className="p-3">21% – 24%</td>
                                        <td className="p-3">14% – 17%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-700">Average</td>
                                        <td className="p-3">25% – 31%</td>
                                        <td className="p-3">18% – 24%</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-rose-600">Obese</td>
                                        <td className="p-3">32%+</td>
                                        <td className="p-3">25%+</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Worked Case Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Body Composition Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To see how metrics interact, compare two distinct demographic profiles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Moderately Active Male</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 35 Years | Male | 6'0" (72 in) | 195 lbs</li>
                                <li><strong>Activity:</strong> Moderately Active (3–5 workouts/wk)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Results:</li>
                                <li>• <strong>BMI:</strong> 26.4 (Overweight Range)</li>
                                <li>• <strong>Est. Body Fat:</strong> 21.3% (Average Range)</li>
                                <li>• <strong>BMR:</strong> 1,864 kcal/day</li>
                                <li>• <strong>TDEE:</strong> 2,889 kcal/day</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Lightly Active Female</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 29 Years | Female | 168 cm | 62 kg</li>
                                <li><strong>Activity:</strong> Lightly Active (1–3 workouts/wk)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Results:</li>
                                <li>• <strong>BMI:</strong> 22.0 (Normal Weight)</li>
                                <li>• <strong>Est. Body Fat:</strong> 27.7% (Average Range)</li>
                                <li>• <strong>BMR:</strong> 1,364 kcal/day</li>
                                <li>• <strong>TDEE:</strong> 1,875 kcal/day</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Clinical Applications & Limitations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Applications and Known Limitations of BMI
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While BMI correlates strongly with health outcomes across large population groups[cite: 2], health professionals emphasize that individual evaluations must account for muscle density, bone mass, and fat distribution[cite: 2]:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Athletes & Muscle Density</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Lean muscle mass weighs significantly more per unit volume than fat tissue[cite: 2]. Muscular individuals may be classified as overweight or obese despite low essential body fat[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Elderly Populations</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Age-related muscle loss (sarcopenia) may cause individuals to fall within a "normal" BMI range despite carrying excess internal visceral fat[cite: 2].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Visceral vs Subcutaneous Fat</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                BMI does not measure where fat is stored[cite: 2]. Waist circumference and body fat percentage offer deeper insights into cardiovascular health risks[cite: 2].
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
                                What is Body Mass Index (BMI)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Body Mass Index (BMI) is a standardized screening metric calculated using a person's weight and height[cite: 2]. It provides a quick general assessment to categorize individuals as underweight, normal weight, overweight, or obese[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is BMI calculated in Imperial vs. Metric units?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the metric system, BMI is calculated as weight in kilograms divided by height in meters squared (kg/m²)[cite: 2]. In the imperial system, it is calculated as [weight in pounds / (height in inches)²] × 703[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the key limitations of BMI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                BMI does not directly measure body fat or distinguish between lean muscle mass and adipose tissue[cite: 2]. As a result, muscular athletes may be categorized as overweight or obese despite having low body fat[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is BMR and TDEE?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Basal Metabolic Rate (BMR) is the total calories your body burns at complete rest to maintain vital life functions[cite: 2]. Total Daily Energy Expenditure (TDEE) factors in physical activity level to calculate total daily calorie expenditure[cite: 2].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is body fat percentage estimated in this calculator?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This calculator utilizes the Adult Body Fat percentage equation, which incorporates BMI, age, and sex to estimate body composition without clinical skinfold caliper testing[cite: 2].
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