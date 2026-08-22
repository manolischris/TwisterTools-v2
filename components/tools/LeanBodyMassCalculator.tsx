"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
    Scale,
    Ruler,
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
    Flame,
    Target,
    Zap,
    CheckCircle2,
    Layers,
    Stethoscope,
    Dumbbell,
    HeartPulse,
    Percent
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type FormulaType = "boer" | "james" | "hume";

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
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "avg-male-imp", label: "Average Male", system: "imperial", gender: "male", age: 30, weightLbs: 180, weightKg: 81.6, heightInches: 70, heightCm: 178, tag: "5'10 / 180 lbs" },
    { id: "avg-female-met", label: "Average Female", system: "metric", gender: "female", age: 28, weightLbs: 137, weightKg: 62, heightInches: 65, heightCm: 165, tag: "165 cm / 62 kg" },
    { id: "muscular-athlete", label: "Trained Athlete", system: "imperial", gender: "male", age: 26, weightLbs: 200, weightKg: 90.7, heightInches: 72, heightCm: 183, tag: "6'0 / 200 lbs" },
    { id: "petite-female", label: "Petite Athlete", system: "metric", gender: "female", age: 24, weightLbs: 115, weightKg: 52, heightInches: 62, heightCm: 157, tag: "157 cm / 52 kg" }
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

export default function LeanBodyMassCalculator() {
    // Unit & Demographic States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);

    // Imperial Inputs
    const [weightLbs, setWeightLbs] = useState<number>(180);
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);

    // Metric Inputs
    const [weightKg, setWeightKg] = useState<number>(81.6);
    const [heightCm, setHeightCm] = useState<number>(178);

    // UI States
    const [primaryFormula, setPrimaryFormula] = useState<FormulaType>("boer");
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "comparison">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Convert inputs to metric standard for calculations
    const effectiveWeightKg = useMemo(() => {
        if (unitSystem === "imperial") {
            return (weightLbs || 0) * 0.45359237;
        }
        return weightKg || 0;
    }, [unitSystem, weightLbs, weightKg]);

    const effectiveHeightCm = useMemo(() => {
        if (unitSystem === "imperial") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            return totalInches * 2.54;
        }
        return heightCm || 0;
    }, [unitSystem, heightFt, heightIn, heightCm]);

    // Core Lean Body Mass Calculations
    const calculations = useMemo(() => {
        const W = effectiveWeightKg;
        const H = effectiveHeightCm;

        if (W <= 0 || H <= 0) {
            return {
                boerLBM: 0,
                jamesLBM: 0,
                humeLBM: 0,
                averageLBM: 0,
                selectedLBM: 0,
                fatMassKg: 0,
                bodyFatPercent: 0,
                bmi: 0,
                ffmi: 0,
                bmrKatch: 0
            };
        }

        const H_meters = H / 100;
        const bmi = W / (H_meters * H_meters);

        // 1. Boer Formula
        // Men: LBM = (0.407 × W) + (0.267 × H) - 19.2
        // Women: LBM = (0.252 × W) + (0.473 × H) - 48.3
        let boer = gender === "male"
            ? (0.407 * W) + (0.267 * H) - 19.2
            : (0.252 * W) + (0.473 * H) - 48.3;
        boer = Math.max(0, Math.min(W, boer));

        // 2. James Formula
        // Men: LBM = 1.1 × W - 128 × (W / H)^2
        // Women: LBM = 1.07 × W - 148 × (W / H)^2
        let james = gender === "male"
            ? (1.1 * W) - 128 * Math.pow(W / H, 2)
            : (1.07 * W) - 148 * Math.pow(W / H, 2);
        james = Math.max(0, Math.min(W, james));

        // 3. Hume Formula
        // Men: LBM = (0.32810 × W) + (0.33929 × H) - 29.5336
        // Women: LBM = (0.29569 × W) + (0.41813 × H) - 43.2933
        let hume = gender === "male"
            ? (0.32810 * W) + (0.33929 * H) - 29.5336
            : (0.29569 * W) + (0.41813 * H) - 43.2933;
        hume = Math.max(0, Math.min(W, hume));

        const avg = (boer + james + hume) / 3;

        let selected = boer;
        if (primaryFormula === "james") selected = james;
        if (primaryFormula === "hume") selected = hume;

        const fatMass = Math.max(0, W - selected);
        const fatPercent = (fatMass / W) * 100;

        // Normalized Fat-Free Mass Index (FFMI)
        // FFMI = LBM(kg) / (H(m))^2 + 6.1 × (1.8 - H(m))
        const ffmiRaw = selected / (H_meters * H_meters);
        const normalizedFfmi = ffmiRaw + (6.1 * (1.8 - H_meters));

        // Katch-McArdle Formula: BMR = 370 + (21.6 × LBM in kg)
        const bmrKatch = 370 + (21.6 * selected);

        return {
            boerLBM: boer,
            jamesLBM: james,
            humeLBM: hume,
            averageLBM: avg,
            selectedLBM: selected,
            fatMassKg: fatMass,
            bodyFatPercent: Math.max(2, Math.min(75, fatPercent)),
            bmi,
            ffmi: normalizedFfmi,
            bmrKatch: Math.round(bmrKatch)
        };
    }, [effectiveWeightKg, effectiveHeightCm, gender, primaryFormula]);

    // Unit toggle conversions
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            setHeightCm(Math.round(totalInches * 2.54));
            setWeightKg(parseFloat(((weightLbs || 0) * 0.453592).toFixed(1)));
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
        setWeightLbs(180);
        setHeightFt(5);
        setHeightIn(10);
        setWeightKg(81.6);
        setHeightCm(178);
        setPrimaryFormula("boer");
        setActivePresetId(null);
    };

    // Format display outputs
    const formatWeight = (kg: number) => {
        if (unitSystem === "imperial") {
            return `${(kg * 2.20462).toFixed(1)} lbs`;
        }
        return `${kg.toFixed(1)} kg`;
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial"
            ? `${heightFt}'${heightIn}"`
            : `${heightCm} cm`;
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;

        const summaryText = `Lean Body Mass (LBM) Assessment (TwisterTools):
----------------------------------------
Demographics: ${age} Yrs | ${gender.toUpperCase()}
Stature: ${heightDisplay} | Total Body Mass: ${weightDisplay}
Selected Formula: ${primaryFormula.toUpperCase()}
----------------------------------------
• Lean Body Mass (LBM): ${formatWeight(calculations.selectedLBM)}
• Est. Body Fat: ${calculations.bodyFatPercent.toFixed(1)}% (${formatWeight(calculations.fatMassKg)})
• Boer Formula LBM: ${formatWeight(calculations.boerLBM)}
• James Formula LBM: ${formatWeight(calculations.jamesLBM)}
• Hume Formula LBM: ${formatWeight(calculations.humeLBM)}
• Multi-Formula Average: ${formatWeight(calculations.averageLBM)}
• Normalized FFMI: ${calculations.ffmi.toFixed(1)} kg/m²
• BMR (Katch-McArdle): ${calculations.bmrKatch} kcal/day
----------------------------------------
Calculated at twistertools.com/tools/calculators/lean-body-mass-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric Name", "Imperial Value", "Metric Value", "Clinical Reference"];
        const rows = [
            ["Boer Formula LBM", `${(calculations.boerLBM * 2.20462).toFixed(1)} lbs`, `${calculations.boerLBM.toFixed(1)} kg`, "Preferred for clinical dosage"],
            ["James Formula LBM", `${(calculations.jamesLBM * 2.20462).toFixed(1)} lbs`, `${calculations.jamesLBM.toFixed(1)} kg`, "Standard pharmacokinetics reference"],
            ["Hume Formula LBM", `${(calculations.humeLBM * 2.20462).toFixed(1)} lbs`, `${calculations.humeLBM.toFixed(1)} kg`, "Alternative anthropometric baseline"],
            ["Formula Average LBM", `${(calculations.averageLBM * 2.20462).toFixed(1)} lbs`, `${calculations.averageLBM.toFixed(1)} kg`, "Tri-formula consensus"],
            ["Estimated Fat Mass", `${(calculations.fatMassKg * 2.20462).toFixed(1)} lbs`, `${calculations.fatMassKg.toFixed(1)} kg`, "Derived total adipose tissue"],
            ["Derived Body Fat %", `${calculations.bodyFatPercent.toFixed(1)}%`, `${calculations.bodyFatPercent.toFixed(1)}%`, "Total mass minus LBM ratio"],
            ["Normalized FFMI", `${calculations.ffmi.toFixed(1)}`, `${calculations.ffmi.toFixed(1)}`, "Fat-Free Mass Index (height-adjusted)"],
            ["BMR (Katch-McArdle)", `${calculations.bmrKatch} kcal`, `${calculations.bmrKatch} kcal`, "Metabolic baseline derived via LBM"]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `lean_body_mass_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Schema Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Lean Body Mass (LBM) Boer & James Formula Calculator",
        "url": "https://twistertools.com/tools/calculators/lean-body-mass-calculator",
        "description": "Calculate accurate Lean Body Mass (LBM), fat mass, Fat-Free Mass Index (FFMI), and Katch-McArdle BMR using clinical Boer, James, and Hume formulas.",
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
                "name": "What is Lean Body Mass (LBM)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Lean Body Mass (LBM) represents the entire weight of your body minus all adipose fat tissue. It includes skeletal muscle, bone, vital organs, body water, tendons, and connective tissue."
                }
            },
            {
                "@type": "Question",
                "name": "What is the clinical difference between the Boer, James, and Hume formulas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Boer formula is currently the clinical gold standard for drug dosage calibration in hospitals. The James formula was introduced in 1976 and is widely cited in pharmacokinetic literature, while Hume provides a linear anthropometric regression model."
                }
            },
            {
                "@type": "Question",
                "name": "Why is Lean Body Mass superior to Body Mass Index (BMI)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BMI only measures gross weight relative to height, failing to distinguish dense muscle tissue from body fat. Lean Body Mass accurately evaluates musculoskeletal development without falsely penalizing muscular athletes."
                }
            },
            {
                "@type": "Question",
                "name": "What is FFMI and why is it useful?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fat-Free Mass Index (FFMI) evaluates an individual's muscularity normalized to stature. It offers bodybuilders and clinicians an objective index of muscular development independent of total body fat."
                }
            },
            {
                "@type": "Question",
                "name": "How does Lean Body Mass affect daily calorie burn (BMR)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Metabolically active muscle tissue consumes substantially more resting energy than fat tissue. The Katch-McArdle equation uses your exact LBM to calculate baseline resting caloric burn with higher accuracy than total weight formulas."
                }
            }
        ]
    };

    const lbmPercentage = effectiveWeightKg > 0
        ? Math.min(100, Math.max(0, (calculations.selectedLBM / effectiveWeightKg) * 100))
        : 0;

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600" />
                                Patient Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Measurement Unit System */}
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
                            {/* Biological Sex & Age */}
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

                            {/* Stature / Height Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Height / Stature
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

                            {/* Total Body Mass Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Total Body Weight
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

                            {/* Primary Clinical Formula Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Calculator className="w-3.5 h-3.5 text-indigo-600" /> Primary Clinical Formula
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryFormula("boer")}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${primaryFormula === "boer"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Boer (1984)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryFormula("james")}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${primaryFormula === "james"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        James (1976)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPrimaryFormula("hume")}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${primaryFormula === "hume"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Hume (1966)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Reference Clinical Presets */}
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

                {/* Right Workspace Panel: Results & Analytical Views */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Lean Mass Composition
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
                                    onClick={() => setActiveTab("comparison")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "comparison" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Formulas
                                </button>
                            </div>
                        </div>

                        {/* Primary Lean Body Mass Hero Card */}
                        <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white shadow-xs transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                                    Lean Body Mass ({primaryFormula.toUpperCase()})
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-600 text-white shadow-xs">
                                    {lbmPercentage.toFixed(1)}% of Mass
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-indigo-950">
                                    {calculations.selectedLBM > 0 ? formatWeight(calculations.selectedLBM) : "--"}
                                </span>
                            </div>

                            {/* Composition Proportion Split Bar */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-500 rounded-l-full"
                                        style={{ width: `${lbmPercentage}%` }}
                                        title={`Lean Mass: ${lbmPercentage.toFixed(1)}%`}
                                    />
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-500 rounded-r-full"
                                        style={{ width: `${100 - lbmPercentage}%` }}
                                        title={`Body Fat Mass: ${(100 - lbmPercentage).toFixed(1)}%`}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-0.5">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Lean Mass ({lbmPercentage.toFixed(1)}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Fat Mass ({(100 - lbmPercentage).toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Sub-views */}
                        {activeTab === "overview" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                                {/* Fat Mass Weight */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Percent className="w-4 h-4 text-amber-500" />
                                        Est. Fat Mass
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {formatWeight(calculations.fatMassKg)}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {calculations.bodyFatPercent.toFixed(1)}% Total Adipose Ratio
                                    </p>
                                </div>

                                {/* Normalized FFMI */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Dumbbell className="w-4 h-4 text-indigo-600" />
                                        Normalized FFMI
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {calculations.ffmi.toFixed(1)} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Height-adjusted muscularity index
                                    </p>
                                </div>

                                {/* Katch-McArdle BMR */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Flame className="w-4 h-4 text-rose-500" />
                                        Katch-McArdle BMR
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {calculations.bmrKatch.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Metabolic rate derived via LBM
                                    </p>
                                </div>

                                {/* Multi-Formula Consensus */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Target className="w-4 h-4 text-indigo-600" />
                                        Consensus Average
                                    </div>
                                    <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                        {formatWeight(calculations.averageLBM)}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Tri-formula mean (Boer/James/Hume)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Formula Comparison Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Formula</th>
                                            <th className="p-2.5">Lean Mass</th>
                                            <th className="p-2.5">Body Fat %</th>
                                            <th className="p-2.5">Clinical Application</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        <tr className={`transition ${primaryFormula === "boer" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {primaryFormula === "boer" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>Boer (1984)</span>
                                            </td>
                                            <td className="p-2.5 text-slate-900">{formatWeight(calculations.boerLBM)}</td>
                                            <td className="p-2.5 text-slate-600">
                                                {effectiveWeightKg > 0 ? (((effectiveWeightKg - calculations.boerLBM) / effectiveWeightKg) * 100).toFixed(1) : "--"}%
                                            </td>
                                            <td className="p-2.5 text-slate-500">Clinical drug dosing gold standard</td>
                                        </tr>
                                        <tr className={`transition ${primaryFormula === "james" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {primaryFormula === "james" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>James (1976)</span>
                                            </td>
                                            <td className="p-2.5 text-slate-900">{formatWeight(calculations.jamesLBM)}</td>
                                            <td className="p-2.5 text-slate-600">
                                                {effectiveWeightKg > 0 ? (((effectiveWeightKg - calculations.jamesLBM) / effectiveWeightKg) * 100).toFixed(1) : "--"}%
                                            </td>
                                            <td className="p-2.5 text-slate-500">Classic pharmacokinetic standard</td>
                                        </tr>
                                        <tr className={`transition ${primaryFormula === "hume" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {primaryFormula === "hume" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>Hume (1966)</span>
                                            </td>
                                            <td className="p-2.5 text-slate-900">{formatWeight(calculations.humeLBM)}</td>
                                            <td className="p-2.5 text-slate-600">
                                                {effectiveWeightKg > 0 ? (((effectiveWeightKg - calculations.humeLBM) / effectiveWeightKg) * 100).toFixed(1) : "--"}%
                                            </td>
                                            <td className="p-2.5 text-slate-500">Anthropometric regression model</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Private Processing
                        </span>
                        <span>Clinical Anthropometric Engine</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                </p>
            </div>

            {/* BELOW-THE-FOLD DETAILED CLINICAL PROSE & SEO ARCHITECTURE */}
            <div className="space-y-6">

                {/* Card 1: Clinical Mechanics & Mathematical Formulations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Mechanics of Lean Body Mass (LBM) Equations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Lean Body Mass (LBM)</strong> encompasses the total mass of the human body minus essential and non-essential adipose tissue. It represents the structural and metabolic engine of the body, including skeletal muscle, vital internal organs, cortical and trabecular bone mineral content, connective fascia, and total extracellular and intracellular water. Unlike standard Body Mass Index (BMI), which fails to isolate muscle from fat, LBM formulas provide clinicians, pharmacologists, and sports scientists with an accurate baseline for therapeutic drug dosing and body recomposition analysis.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-indigo-600" /> Boer Formula (1984)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Formulated by P. Boer, this linear anthropometric equation is regarded across modern critical care and oncology units as the most accurate estimation tool for therapeutic drug titration and intravenous dosage planning.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-indigo-600" /> James Formula (1976)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Introduced by W.P.T. James in epidemiological research, this quadratic formulation is widely referenced in classic pharmacokinetic literature. It models non-linear mass distribution but may overestimate fat mass in severe obesity.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Hume Formula (1966)
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                Developed by R. Hume through total body water isotope dilution, this model provides an established linear anthropometric comparative index for evaluating muscular proportion against baseline stature.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Specification Card */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formula Breakdown
                        </h3>
                        <p className="text-xs text-slate-300">
                            Where <em>W</em> represents total body mass in kilograms (kg) and <em>H</em> represents total body height in centimeters (cm):
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2.5">
                            <div><strong>1. Boer Formula (Men):</strong> LBM = (0.407 × W) + (0.267 × H) - 19.2</div>
                            <div><strong>2. Boer Formula (Women):</strong> LBM = (0.252 × W) + (0.473 × H) - 48.3</div>
                            <div><strong>3. James Formula (Men):</strong> LBM = 1.10 × W - 128 × (W / H)²</div>
                            <div><strong>4. James Formula (Women):</strong> LBM = 1.07 × W - 148 × (W / H)²</div>
                            <div><strong>5. Hume Formula (Men):</strong> LBM = (0.32810 × W) + (0.33929 × H) - 29.5336</div>
                            <div><strong>6. Hume Formula (Women):</strong> LBM = (0.29569 × W) + (0.41813 × H) - 43.2933</div>
                            <div><strong>7. Normalized FFMI:</strong> [LBM (kg) / (H (m))²] + 6.1 × [1.8 - H (m)]</div>
                            <div><strong>8. Katch-McArdle BMR:</strong> 370 + (21.6 × LBM in kg)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Clinical Comparative Standards & Classifications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anthropometric Standards: LBM Percentage & FFMI Scales
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Evaluating lean mass requires assessing both the total proportion of lean tissue relative to body weight and the normalized <strong>Fat-Free Mass Index (FFMI)</strong>, which normalizes muscularity across various heights:
                    </p>

                    {/* Table 1: Lean Body Mass Proportions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Typical Population Lean Body Mass (% of Total Mass)
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Classification</th>
                                        <th className="p-3">Men (% Lean Mass)</th>
                                        <th className="p-3">Women (% Lean Mass)</th>
                                        <th className="p-3">Cardiometabolic Profile</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                        <td className="p-3 font-bold text-indigo-600">Elite / Athletic</td>
                                        <td className="p-3 font-semibold">87% – 94%</td>
                                        <td className="p-3 font-semibold">80% – 86%</td>
                                        <td className="p-3">High insulin sensitivity, superior athletic output</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/30">
                                        <td className="p-3 font-bold text-emerald-600">Fitness / Active</td>
                                        <td className="p-3 font-semibold">83% – 86%</td>
                                        <td className="p-3 font-semibold">76% – 79%</td>
                                        <td className="p-3">Optimal metabolic health and functional longevity</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Average Adult</td>
                                        <td className="p-3">76% – 82%</td>
                                        <td className="p-3">69% – 75%</td>
                                        <td className="p-3">Standard baseline; typical sedentary to light activity</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-rose-600">Low Lean Proportion</td>
                                        <td className="p-3">&lt; 75%</td>
                                        <td className="p-3">&lt; 68%</td>
                                        <td className="p-3">Elevated cardiometabolic and sarcopenic risk</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 2: Normalized Fat-Free Mass Index (FFMI) Scale */}
                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Normalized Fat-Free Mass Index (FFMI) Benchmarks
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Normalized FFMI Range</th>
                                        <th className="p-3">Men Description</th>
                                        <th className="p-3">Women Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-amber-600">&lt; 18.0 (Men) / &lt; 15.0 (Women)</td>
                                        <td className="p-3">Below average muscle density / Sarcopenic</td>
                                        <td className="p-3">Below average muscle density / Frail</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">18.0 – 20.0 (Men) / 15.0 – 17.0 (Women)</td>
                                        <td className="p-3">Average muscularity (Sedentary adult)</td>
                                        <td className="p-3">Average muscularity (Sedentary adult)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-emerald-600">20.0 – 22.0 (Men) / 17.0 – 19.0 (Women)</td>
                                        <td className="p-3">Above average (Consistent resistance training)</td>
                                        <td className="p-3">Above average (Athletic / Trained)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-indigo-600">22.0 – 25.0 (Men) / 19.0 – 22.0 (Women)</td>
                                        <td className="p-3">Excellent muscularity (Advanced athlete)</td>
                                        <td className="p-3">Elite muscularity (Advanced athlete)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-purple-600">&gt; 25.0 (Men) / &gt; 22.0 (Women)</td>
                                        <td className="p-3">Upper threshold of natural human genetics</td>
                                        <td className="p-3">Upper physiological limit of natural development</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Clinical & Practical Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical & Athletic Applications of Lean Mass
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Knowing exact Lean Body Mass transforms how healthcare providers, clinical nutritionists, and physical coaches design interventions:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-indigo-600" /> Pharmacokinetics & Dosing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Hydrophilic intravenous medications (such as aminoglycosides, neuromuscular blockers, and anesthetic agents) distribute strictly into lean tissue rather than adipose tissue. Calculating LBM prevents toxic overdosing in overweight patients.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-indigo-600" /> Katch-McArdle Energy Burn
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Resting metabolic expenditure is overwhelmingly driven by lean metabolic tissue. The Katch-McArdle equation bypasses age and height estimates by multiplying active lean mass directly to establish precise baseline caloric burn.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Dumbbell className="w-4 h-4 text-indigo-600" /> Hypertrophy Tracking
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                During body recomposition regimens, scale weight may remain static while fat mass decreases and muscular mass increases. Monitoring LBM confirms real tissue adaptation that standard scales conceal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Mathematical Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how clinical formulas evaluate two individuals across different physical conditioning paradigms:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Muscular Athlete (Male)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 28 Years | Male | 6'0" (182.88 cm) | 205 lbs (92.99 kg)</li>
                                <li><strong>BMI Reading:</strong> 27.8 kg/m² (Overweight by standard BMI)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Lean Body Mass:</li>
                                <li>• <strong>Boer LBM:</strong> 67.5 kg (148.8 lbs) | 72.6% Lean Mass</li>
                                <li>• <strong>James LBM:</strong> 69.1 kg (152.3 lbs)</li>
                                <li>• <strong>Normalized FFMI:</strong> 20.0 kg/m² (Athletic / Trained)</li>
                                <li>• <strong>Katch-McArdle BMR:</strong> 1,828 kcal/day</li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Active Adult (Female)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 32 Years | Female | 168 cm | 64 kg</li>
                                <li><strong>BMI Reading:</strong> 22.7 kg/m² (Normal Weight)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Lean Body Mass:</li>
                                <li>• <strong>Boer LBM:</strong> 47.3 kg (104.3 lbs) | 73.9% Lean Mass</li>
                                <li>• <strong>James LBM:</strong> 47.0 kg (103.6 lbs)</li>
                                <li>• <strong>Normalized FFMI:</strong> 17.5 kg/m² (Healthy Active Range)</li>
                                <li>• <strong>Katch-McArdle BMR:</strong> 1,392 kcal/day</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Section */}
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
                                What is Lean Body Mass (LBM)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Lean Body Mass (LBM) is the total weight of your body minus all adipose fat tissue. It accounts for skeletal muscle, bone structure, vital organs, body water, ligaments, and connective tissue.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which formula is better: Boer, James, or Hume?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Boer formula is considered the modern clinical gold standard, particularly for medication dosing and critical care. The James formula is historically valuable for non-obese populations, while Hume serves as an established anthropometric baseline.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is Lean Body Mass more informative than standard BMI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Body Mass Index (BMI) only evaluates total scale weight against height and cannot distinguish between dense muscle mass and adipose fat tissue. Lean Body Mass measures your actual metabolic and functional tissue without penalizing muscular builds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Fat-Free Mass Index (FFMI)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Fat-Free Mass Index (FFMI) is an anthropometric metric that evaluates your quantity of lean mass relative to your stature. It normalizes muscle mass across people of different heights, providing an objective benchmark for natural muscular potential.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Lean Body Mass calculate daily calorie needs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Katch-McArdle equation uses your Lean Body Mass to calculate Basal Metabolic Rate (BMR) directly: BMR = 370 + (21.6 × LBM in kg). Because muscle tissue is metabolically active, this provides a more precise caloric target than standard total-body-weight equations.
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