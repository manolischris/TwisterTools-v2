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
    Dumbbell,
    Gauge,
    Percent,
    Award,
    Crosshair
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type CalculationMethod = "navy" | "bmi";

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
    waistInches: number;
    waistCm: number;
    neckInches: number;
    neckCm: number;
    hipInches: number;
    hipCm: number;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "athletic-male",
        label: "Athletic Male",
        system: "imperial",
        gender: "male",
        age: 28,
        weightLbs: 175,
        weightKg: 79.4,
        heightInches: 71, // 5'11"
        heightCm: 180,
        waistInches: 31,
        waistCm: 78.7,
        neckInches: 15.5,
        neckCm: 39.4,
        hipInches: 38,
        hipCm: 96.5,
        tag: "Lean & Active"
    },
    {
        id: "average-female",
        label: "Average Female",
        system: "metric",
        gender: "female",
        age: 34,
        weightLbs: 150,
        weightKg: 68,
        heightInches: 65, // 5'5"
        heightCm: 165,
        waistInches: 31.5,
        waistCm: 80,
        neckInches: 13.5,
        neckCm: 34,
        hipInches: 39.5,
        hipCm: 100,
        tag: "Moderate"
    },
    {
        id: "fitness-enthusiast-female",
        label: "Fit Female Athlete",
        system: "imperial",
        gender: "female",
        age: 26,
        weightLbs: 132,
        weightKg: 59.8,
        heightInches: 66, // 5'6"
        heightCm: 168,
        waistInches: 26,
        waistCm: 66,
        neckInches: 13,
        neckCm: 33,
        hipInches: 36,
        hipCm: 91.5,
        tag: "Low Body Fat"
    },
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

export default function BodyFatCalculator() {
    // Unit & Demographic States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [method, setMethod] = useState<CalculationMethod>("navy");
    const [age, setAge] = useState<number>(30);

    // Imperial Inputs
    const [weightLbs, setWeightLbs] = useState<number>(170);
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);
    const [waistIn, setWaistIn] = useState<number>(33);
    const [neckIn, setNeckIn] = useState<number>(15);
    const [hipIn, setHipIn] = useState<number>(38); // Required for female Navy method

    // Metric Inputs
    const [weightKg, setWeightKg] = useState<number>(77);
    const [heightCm, setHeightCm] = useState<number>(178);
    const [waistCm, setWaistCm] = useState<number>(84);
    const [neckCm, setNeckCm] = useState<number>(38);
    const [hipCm, setHipCm] = useState<number>(96.5);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"composition" | "categories" | "fatloss">("composition");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic conversions to imperial inches & metric kg/cm for math engines
    const totalHeightInches = useMemo(() => {
        if (unitSystem === "imperial") {
            return (heightFt || 0) * 12 + (heightIn || 0);
        }
        return (heightCm || 0) / 2.54;
    }, [unitSystem, heightFt, heightIn, heightCm]);

    const effectiveWeightLbs = useMemo(() => {
        if (unitSystem === "imperial") {
            return weightLbs || 0;
        }
        return (weightKg || 0) * 2.20462;
    }, [unitSystem, weightLbs, weightKg]);

    const effectiveWaistIn = useMemo(() => {
        if (unitSystem === "imperial") {
            return waistIn || 0;
        }
        return (waistCm || 0) / 2.54;
    }, [unitSystem, waistIn, waistCm]);

    const effectiveNeckIn = useMemo(() => {
        if (unitSystem === "imperial") {
            return neckIn || 0;
        }
        return (neckCm || 0) / 2.54;
    }, [unitSystem, neckIn, neckCm]);

    const effectiveHipIn = useMemo(() => {
        if (unitSystem === "imperial") {
            return hipIn || 0;
        }
        return (hipCm || 0) / 2.54;
    }, [unitSystem, hipIn, hipCm]);

    // Core Body Composition Calculations
    const results = useMemo(() => {
        const hIn = totalHeightInches;
        const wLbs = effectiveWeightLbs;
        const waist = effectiveWaistIn;
        const neck = effectiveNeckIn;
        const hip = effectiveHipIn;

        if (hIn <= 0 || wLbs <= 0 || age <= 0) {
            return {
                bodyFatPercentage: 0,
                fatMassLbs: 0,
                fatMassKg: 0,
                leanMassLbs: 0,
                leanMassKg: 0,
                bmi: 0,
                category: "Unknown",
                idealFatMin: 0,
                idealFatMax: 0,
                fatToLose5Pct: 0,
                fatToLose10Pct: 0
            };
        }

        // Height in Meters & Weight in Kg for BMI
        const hMeters = (hIn * 2.54) / 100;
        const wKg = wLbs / 2.20462;
        const bmiVal = wKg / (hMeters * hMeters);

        let bodyFatPct = 0;

        if (method === "navy") {
            // U.S. Navy Method Formula
            if (gender === "male") {
                const diff = waist - neck;
                if (diff > 0 && hIn > 0) {
                    bodyFatPct = 86.010 * Math.log10(diff) - 70.041 * Math.log10(hIn) + 36.76;
                }
            } else {
                const diff = waist + hip - neck;
                if (diff > 0 && hIn > 0) {
                    bodyFatPct = 163.205 * Math.log10(diff) - 97.684 * Math.log10(hIn) - 78.387;
                }
            }
        } else {
            // BMI Estimation Method (Deurenberg Formula)
            const genderFactor = gender === "male" ? 1 : 0;
            bodyFatPct = (1.20 * bmiVal) + (0.23 * age) - (10.8 * genderFactor) - 5.4;
        }

        // Sanitize Body Fat % bounds
        bodyFatPct = Math.max(2, Math.min(60, bodyFatPct));

        // Mass Calculations
        const fatMassLbsVal = wLbs * (bodyFatPct / 100);
        const leanMassLbsVal = wLbs - fatMassLbsVal;
        const fatMassKgVal = fatMassLbsVal / 2.20462;
        const leanMassKgVal = leanMassLbsVal / 2.20462;

        // Categorization based on ACE (American Council on Exercise) standards
        let cat = "Average";
        let idealMin = 14;
        let idealMax = 17;

        if (gender === "male") {
            idealMin = 10;
            idealMax = 17;
            if (bodyFatPct < 6) cat = "Essential Fat";
            else if (bodyFatPct < 14) cat = "Athletes";
            else if (bodyFatPct < 18) cat = "Fitness";
            else if (bodyFatPct < 25) cat = "Average";
            else cat = "Obese";
        } else {
            idealMin = 18;
            idealMax = 24;
            if (bodyFatPct < 14) cat = "Essential Fat";
            else if (bodyFatPct < 21) cat = "Athletes";
            else if (bodyFatPct < 25) cat = "Fitness";
            else if (bodyFatPct < 32) cat = "Average";
            else cat = "Obese";
        }

        // Target Loss Calculations to reach specific BF% goals
        const target5PctWeight = leanMassLbsVal / (1 - Math.max(0.05, (bodyFatPct - 5) / 100));
        const target10PctWeight = leanMassLbsVal / (1 - Math.max(0.05, (bodyFatPct - 10) / 100));

        const fatToLose5 = Math.max(0, wLbs - target5PctWeight);
        const fatToLose10 = Math.max(0, wLbs - target10PctWeight);

        return {
            bodyFatPercentage: Math.round(bodyFatPct * 10) / 10,
            fatMassLbs: Math.round(fatMassLbsVal * 10) / 10,
            fatMassKg: Math.round(fatMassKgVal * 10) / 10,
            leanMassLbs: Math.round(leanMassLbsVal * 10) / 10,
            leanMassKg: Math.round(leanMassKgVal * 10) / 10,
            bmi: Math.round(bmiVal * 10) / 10,
            category: cat,
            idealFatMin: idealMin,
            idealFatMax: idealMax,
            fatToLose5Pct: Math.round(fatToLose5 * 10) / 10,
            fatToLose10Pct: Math.round(fatToLose10 * 10) / 10
        };
    }, [totalHeightInches, effectiveWeightLbs, effectiveWaistIn, effectiveNeckIn, effectiveHipIn, age, gender, method]);

    // Handle Unit Toggle & Sync Data
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            setHeightCm(Math.round(totalHeightInches * 2.54));
            setWeightKg(Math.round((weightLbs || 0) * 0.453592 * 10) / 10);
            setWaistCm(Math.round((waistIn || 0) * 2.54 * 10) / 10);
            setNeckCm(Math.round((neckIn || 0) * 2.54 * 10) / 10);
            setHipCm(Math.round((hipIn || 0) * 2.54 * 10) / 10);
        } else {
            const totIn = (heightCm || 0) / 2.54;
            setHeightFt(Math.floor(totIn / 12));
            setHeightIn(Math.round(totIn % 12));
            setWeightLbs(Math.round((weightKg || 0) * 2.20462));
            setWaistIn(Math.round(((waistCm || 0) / 2.54) * 10) / 10);
            setNeckIn(Math.round(((neckCm || 0) / 2.54) * 10) / 10);
            setHipIn(Math.round(((hipCm || 0) / 2.54) * 10) / 10);
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnitSystem(preset.system);
        setGender(preset.gender);
        setAge(preset.age);

        if (preset.system === "imperial") {
            setWeightLbs(preset.weightLbs);
            setHeightFt(Math.floor(preset.heightInches / 12));
            setHeightIn(preset.heightInches % 12);
            setWaistIn(preset.waistInches);
            setNeckIn(preset.neckInches);
            setHipIn(preset.hipInches);
        } else {
            setWeightKg(preset.weightKg);
            setHeightCm(preset.heightCm);
            setWaistCm(preset.waistCm);
            setNeckCm(preset.neckCm);
            setHipCm(preset.hipCm);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setGender("male");
        setMethod("navy");
        setAge(30);
        setWeightLbs(170);
        setHeightFt(5);
        setHeightIn(10);
        setWaistIn(33);
        setNeckIn(15);
        setHipIn(38);
        setWeightKg(77);
        setHeightCm(178);
        setWaistCm(84);
        setNeckCm(38);
        setHipCm(96.5);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial"
            ? `${heightFt}'${heightIn}"`
            : `${heightCm} cm`;
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;

        const fatMassDisplay = unitSystem === "imperial"
            ? `${results.fatMassLbs} lbs`
            : `${results.fatMassKg} kg`;

        const leanMassDisplay = unitSystem === "imperial"
            ? `${results.leanMassLbs} lbs`
            : `${results.leanMassKg} kg`;

        const summaryText = `Body Composition Analysis Summary (TwisterTools):
----------------------------------------
Age / Biological Sex: ${age} Yrs / ${gender.toUpperCase()}
Height: ${heightDisplay} | Total Weight: ${weightDisplay}
Calculation Method: ${method === "navy" ? "U.S. Navy Circumference" : "BMI Deurenberg Estimate"}
----------------------------------------
Body Fat Percentage: ${results.bodyFatPercentage}%
Fitness Category: ${results.category}
Fat Mass: ${fatMassDisplay}
Lean Mass: ${leanMassDisplay}
Body Mass Index (BMI): ${results.bmi} kg/m²
----------------------------------------
Ideal Healthy Range for Sex: ${results.idealFatMin}% - ${results.idealFatMax}%
----------------------------------------
Calculated at twistertools.com/tools/calculators/body-fat-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Body Metric Parameter", "Value", "Unit / Classification"];
        const rows = [
            ["Body Fat Percentage", `${results.bodyFatPercentage}`, "%"],
            ["ACE Fitness Category", results.category, "Category"],
            ["Fat Mass (Lbs)", `${results.fatMassLbs}`, "lbs"],
            ["Fat Mass (Kg)", `${results.fatMassKg}`, "kg"],
            ["Lean Body Mass (Lbs)", `${results.leanMassLbs}`, "lbs"],
            ["Lean Body Mass (Kg)", `${results.leanMassKg}`, "kg"],
            ["Body Mass Index (BMI)", `${results.bmi}`, "kg/m²"],
            ["Biological Sex", gender, "Sex"],
            ["Age", `${age}`, "Years"],
            ["Calculation Method", method === "navy" ? "US Navy Method" : "BMI Method", "Algorithm"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `body_fat_composition_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Web Application & FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Body Fat Percentage & Lean Mass Calculator",
        "url": "https://twistertools.com/tools/calculators/body-fat-calculator",
        "description": "Calculate accurate body fat percentage, total lean body mass, fat mass, and healthy fitness category ranges using the U.S. Navy circumference method.",
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
                "name": "How accurate is the U.S. Navy body fat formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The U.S. Navy circumference method is widely regarded as one of the most accurate non-invasive body composition tools available. When measured correctly with a standard tape measure, it typically correlates within 3% to 4% of clinical DEXA scan measurements."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Fat Mass and Lean Body Mass?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fat Mass is the total weight of essential fat reserves and subcutaneous or visceral adipose tissue in your body. Lean Body Mass (LBM) includes the combined mass of muscle, bone structures, organs, cellular water, and connective tissues."
                }
            },
            {
                "@type": "Question",
                "name": "Why is hip circumference required for women but not men?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Biological differences cause women to store a higher proportion of essential subcutaneous adipose fat around the pelvic and hip region (gynoid fat distribution). Including hip measurements in female calculations ensures proper mathematical precision."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered an ideal or healthy body fat percentage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "According to the American Council on Exercise (ACE), healthy 'Fitness' ranges are 14% to 17% for men and 21% to 24% for women. 'Average' healthy ranges are 18% to 24% for men and 25% to 31% for women."
                }
            },
            {
                "@type": "Question",
                "name": "How should I measure my waist, neck, and hips accurately?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Measure your neck around the narrowest point below the larynx. Measure your waist horizontally at the navel for men, or at the narrowest natural waistline for women. Measure hips at the widest point around the buttocks."
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Body Measurements & Method
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System & Algorithm Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Unit System
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitToggle("imperial")}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Imperial (in/lbs)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitToggle("metric")}
                                        className={`py-1.5 px-2 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Metric (cm/kg)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Calculation Method
                                </label>
                                <select
                                    value={method}
                                    onChange={(e) => setMethod(e.target.value as CalculationMethod)}
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-slate-50"
                                >
                                    <option value="navy">U.S. Navy Method (Accurate)</option>
                                    <option value="bmi">BMI Estimate Method</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
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

                            {/* Height & Weight Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Height
                                    </label>
                                    {unitSystem === "imperial" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="2"
                                                    max="8"
                                                    value={heightFt === 0 ? "" : heightFt}
                                                    onChange={(e) => { handleNumberInput(e, (val) => setHeightFt(Math.max(0, val))); setActivePresetId(null); }}
                                                    className="w-full pl-2.5 pr-7 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="11"
                                                    value={heightIn === 0 ? "" : heightIn}
                                                    onChange={(e) => { handleNumberInput(e, (val) => setHeightIn(Math.max(0, Math.min(11, val)))); setActivePresetId(null); }}
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
                                                value={heightCm === 0 ? "" : heightCm}
                                                onChange={(e) => { handleNumberInput(e, (val) => setHeightCm(Math.max(0, val))); setActivePresetId(null); }}
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
                                                value={weightLbs === 0 ? "" : weightLbs}
                                                onChange={(e) => { handleNumberInput(e, (val) => setWeightLbs(Math.max(0, val))); setActivePresetId(null); }}
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
                                                value={weightKg === 0 ? "" : weightKg}
                                                onChange={(e) => { handleNumberInput(e, (val) => setWeightKg(Math.max(0, val))); setActivePresetId(null); }}
                                                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Circumference Measurements (U.S. Navy Method) */}
                            {method === "navy" && (
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                                    <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                                        <Crosshair className="w-3.5 h-3.5 text-indigo-600" /> Tape Circumferences (Navy Formula)
                                    </div>

                                    <div className={`grid gap-3 ${gender === "female" ? "grid-cols-3" : "grid-cols-2"}`}>
                                        {/* Waist */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Waist {gender === "male" ? "(Navel)" : "(Narrowest)"}
                                            </label>
                                            {unitSystem === "imperial" ? (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="15"
                                                        max="100"
                                                        value={waistIn === 0 ? "" : waistIn}
                                                        onChange={(e) => { handleNumberInput(e, setWaistIn); setActivePresetId(null); }}
                                                        className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">in</span>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="40"
                                                        max="250"
                                                        value={waistCm === 0 ? "" : waistCm}
                                                        onChange={(e) => { handleNumberInput(e, setWaistCm); setActivePresetId(null); }}
                                                        className="w-full pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Neck */}
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Neck (Below Larynx)
                                            </label>
                                            {unitSystem === "imperial" ? (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="8"
                                                        max="40"
                                                        value={neckIn === 0 ? "" : neckIn}
                                                        onChange={(e) => { handleNumberInput(e, setNeckIn); setActivePresetId(null); }}
                                                        className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">in</span>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="20"
                                                        max="100"
                                                        value={neckCm === 0 ? "" : neckCm}
                                                        onChange={(e) => { handleNumberInput(e, setNeckCm); setActivePresetId(null); }}
                                                        className="w-full pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hip (Females Only) */}
                                        {gender === "female" && (
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    Hips (Widest Point)
                                                </label>
                                                {unitSystem === "imperial" ? (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="20"
                                                            max="120"
                                                            value={hipIn === 0 ? "" : hipIn}
                                                            onChange={(e) => { handleNumberInput(e, setHipIn); setActivePresetId(null); }}
                                                            className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">in</span>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="50"
                                                            max="300"
                                                            value={hipCm === 0 ? "" : hipCm}
                                                            onChange={(e) => { handleNumberInput(e, setHipCm); setActivePresetId(null); }}
                                                            className="w-full pl-2.5 pr-8 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-xs bg-white"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">cm</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Demographic Presets
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
                            {copied ? "Copied to Clipboard" : "Copy Body Composition Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Composition Results
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("composition")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "composition" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Mass Split
                                </button>
                                <button
                                    onClick={() => setActiveTab("categories")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "categories" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Fitness Category
                                </button>
                                <button
                                    onClick={() => setActiveTab("fatloss")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "fatloss" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Target Fat Loss
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Percent className="w-4 h-4 text-amber-400" /> Body Fat Percentage
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    {results.category}
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {results.bodyFatPercentage > 0 ? `${results.bodyFatPercentage}%` : "--"}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">Total Adipose Ratio</span>
                            </div>

                            <div className="mt-4 pt-3 border-t border-indigo-800/80 grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-indigo-300 block text-[10px] uppercase font-bold">Fat Mass Weight</span>
                                    <span className="font-extrabold text-white text-sm">
                                        {unitSystem === "imperial" ? `${results.fatMassLbs} lbs` : `${results.fatMassKg} kg`}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-indigo-300 block text-[10px] uppercase font-bold">Lean Body Mass</span>
                                    <span className="font-extrabold text-white text-sm">
                                        {unitSystem === "imperial" ? `${results.leanMassLbs} lbs` : `${results.leanMassKg} kg`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "composition" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 .5">
                                    {/* Fat Mass Card */}
                                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                            <Flame className="w-4 h-4 text-amber-600" />
                                            Total Fat Mass
                                        </div>
                                        <p className="text-xl font-extrabold text-amber-950">
                                            {unitSystem === "imperial" ? `${results.fatMassLbs} lbs` : `${results.fatMassKg} kg`}
                                        </p>
                                        <p className="text-[11px] text-amber-800/80">
                                            {results.bodyFatPercentage}% of total weight
                                        </p>
                                    </div>

                                    {/* Lean Mass Card */}
                                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                            <Dumbbell className="w-4 h-4 text-emerald-600" />
                                            Lean Body Mass (LBM)
                                        </div>
                                        <p className="text-xl font-extrabold text-emerald-950">
                                            {unitSystem === "imperial" ? `${results.leanMassLbs} lbs` : `${results.leanMassKg} kg`}
                                        </p>
                                        <p className="text-[11px] text-emerald-800/80">
                                            {Math.round((100 - results.bodyFatPercentage) * 10) / 10}% muscle, bone, organ
                                        </p>
                                    </div>
                                </div>

                                {/* Body Composition Proportion Bar */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                        <span>Lean Mass ({Math.round((100 - results.bodyFatPercentage) * 10) / 10}%)</span>
                                        <span>Fat Mass ({results.bodyFatPercentage}%)</span>
                                    </div>
                                    <div className="w-full h-4 bg-amber-200 rounded-full overflow-hidden flex shadow-inner">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${Math.max(0, 100 - results.bodyFatPercentage)}%` }}
                                        />
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-500"
                                            style={{ width: `${Math.min(100, results.bodyFatPercentage)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                                    <strong>Ideal Healthy Range:</strong> Healthy recommended body fat levels for a {age}-year-old {gender} are between <strong>{results.idealFatMin}%</strong> and <strong>{results.idealFatMax}%</strong>.
                                </div>
                            </div>
                        )}

                        {activeTab === "categories" && (
                            <div className="space-y-2.5">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    ACE Fitness Category Standards ({gender.toUpperCase()})
                                </div>

                                {[
                                    { name: "Essential Fat", range: gender === "male" ? "2 - 5%" : "10 - 13%", desc: "Minimum for physiological function" },
                                    { name: "Athletes", range: gender === "male" ? "6 - 13%" : "14 - 20%", desc: "Optimal athletic performance" },
                                    { name: "Fitness", range: gender === "male" ? "14 - 17%" : "21 - 24%", desc: "Lean, muscular definition" },
                                    { name: "Average", range: gender === "male" ? "18 - 24%" : "25 - 31%", desc: "Standard healthy lifestyle range" },
                                    { name: "Obese", range: gender === "male" ? "25%+" : "32%+", desc: "Elevated health risk threshold" },
                                ].map((catItem) => {
                                    const isCurrentCategory = results.category === catItem.name;
                                    return (
                                        <div
                                            key={catItem.name}
                                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${isCurrentCategory
                                                ? "bg-indigo-50 border-indigo-300 font-bold text-indigo-900 shadow-xs"
                                                : "bg-slate-50/60 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <div>
                                                <span className="block font-bold">{catItem.name}</span>
                                                <span className="text-[11px] font-normal text-slate-500">{catItem.desc}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-bold text-indigo-600">{catItem.range}</span>
                                                {isCurrentCategory && (
                                                    <span className="block text-[10px] uppercase font-extrabold text-indigo-600">You Are Here</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "fatloss" && (
                            <div className="space-y-3">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Target Fat Loss Projections (Preserving Lean Mass)
                                </div>

                                <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-amber-900 uppercase">To Reduce BF% by 5%</div>
                                        <div className="text-xs text-amber-700">Target Body Fat: {Math.max(3, results.bodyFatPercentage - 5)}%</div>
                                    </div>
                                    <div className="text-lg font-black text-amber-800">
                                        -{results.fatToLose5Pct} <span className="text-xs font-normal text-amber-700">{unitSystem === "imperial" ? "lbs fat" : "kg fat"}</span>
                                    </div>
                                </div>

                                <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-amber-900 uppercase">To Reduce BF% by 10%</div>
                                        <div className="text-xs text-amber-700">Target Body Fat: {Math.max(3, results.bodyFatPercentage - 10)}%</div>
                                    </div>
                                    <div className="text-lg font-black text-amber-800">
                                        -{results.fatToLose10Pct} <span className="text-xs font-normal text-amber-700">{unitSystem === "imperial" ? "lbs fat" : "kg fat"}</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                                    <strong>Caloric Strategy:</strong> Losing purely fat mass requires maintaining a moderate caloric deficit (-20%) paired with high protein intake (1.6-2.2g/kg) and resistance training.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>U.S. Navy Algorithm</span>
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

                {/* Card 1: Comprehensive Body Fat Mechanics & U.S. Navy Method */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Body Composition and the U.S. Navy Method
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Body Fat Percentage</strong> is defined as the total mass of adipose fat divided by total body weight, expressed as a percentage. Unlike simple weight or Body Mass Index (BMI)—which treats muscle, bone, fluid, and fat as identical mass—body fat percentage provides an accurate picture of your actual body composition and metabolic health profile.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Essential Adipose Tissue
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Essential fat is required for normal physiological survival, internal organ cushioning, central nervous system signaling, and reproductive hormone production. Essential fat ranges are roughly 2–5% in men and 10–13% in women.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-indigo-600" /> Lean Body Mass (LBM)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Lean body mass encompasses everything in your body that is not adipose fat. This includes skeletal muscle tissue, bone mineral density, internal organs, blood volume, extracellular fluid, and glycogen reserves.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Underlying U.S. Navy Circumference Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            The U.S. Navy body composition algorithm calculates density using logarithmic tape ratios:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>Male Body Fat %:</strong> 86.010 × log₁₀(Waist - Neck) - 70.041 × log₁₀(Height) + 36.76</div>
                            <div><strong>Female Body Fat %:</strong> 163.205 × log₁₀(Waist + Hip - Neck) - 97.684 × log₁₀(Height) - 78.387</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: ACE Fitness Standards Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            American Council on Exercise (ACE) Body Fat Categorization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Reference standards established by the American Council on Exercise categorize body fat percentages into target fitness brackets based on biological sex:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Classification</th>
                                    <th className="p-3">Male Range (%)</th>
                                    <th className="p-3">Female Range (%)</th>
                                    <th className="p-3">Physiological Context</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Essential Fat</td>
                                    <td className="p-3 font-mono font-bold text-amber-600">2% – 5%</td>
                                    <td className="p-3 font-mono font-bold text-amber-600">10% – 13%</td>
                                    <td className="p-3">Minimum necessary fat mass for metabolic survival and organ protection.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Athletes</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">6% – 13%</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">14% – 20%</td>
                                    <td className="p-3">High lean muscle mass with minimal subcutaneous adipose tissue.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Fitness</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">14% – 17%</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">21% – 24%</td>
                                    <td className="p-3 font-medium text-slate-800">Optimal healthy range for active individuals and physical stamina.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Average</td>
                                    <td className="p-3 font-mono font-bold text-slate-700">18% – 24%</td>
                                    <td className="p-3 font-mono font-bold text-slate-700">25% – 31%</td>
                                    <td className="p-3">Standard healthy baseline for sedentary or moderately active adults.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Obese</td>
                                    <td className="p-3 font-mono font-bold text-rose-600">25%+</td>
                                    <td className="p-3 font-mono font-bold text-rose-600">32%+</td>
                                    <td className="p-3">Elevated metabolic risk factor threshold for cardiovascular illness.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step Measurement Protocol */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Crosshair className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Measurement Technique Guidelines
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain high mathematical accuracy with circumference-based body composition models, adhere to the following standard measurement techniques using a flexible fiberglass tape measure:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Neck Measurement
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Wrap the measuring tape horizontally around the neck, starting directly below the larynx (Adam's apple). Keep tape level without compressing skin tissue.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Waist Measurement
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For men, measure horizontally at the level of the navel. For women, measure at the narrowest point of the natural waistline between ribs and hips.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Hips (Women Only)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Wrap the measuring tape around the maximum circumference of the hips and gluteal buttocks region while standing with feet together.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
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
                                How accurate is the U.S. Navy body fat formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The U.S. Navy circumference method is widely regarded as one of the most accurate non-invasive body composition tools available. When measured correctly with a standard tape measure, it typically correlates within 3% to 4% of clinical DEXA scan measurements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Fat Mass and Lean Body Mass?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Fat Mass is the total weight of essential fat reserves and subcutaneous or visceral adipose tissue in your body. Lean Body Mass (LBM) includes the combined mass of muscle, bone structures, organs, cellular water, and connective tissues.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is hip circumference required for women but not men?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Biological differences cause women to store a higher proportion of essential subcutaneous adipose fat around the pelvic and hip region (gynoid fat distribution). Including hip measurements in female calculations ensures proper mathematical precision.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is considered an ideal or healthy body fat percentage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                According to the American Council on Exercise (ACE), healthy 'Fitness' ranges are 14% to 17% for men and 21% to 24% for women. 'Average' healthy ranges are 18% to 24% for men and 25% to 31% for women.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should I measure my waist, neck, and hips accurately?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Measure your neck around the narrowest point below the larynx. Measure your waist horizontally at the navel for men, or at the narrowest natural waistline for women. Measure hips at the widest point around the buttocks.
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