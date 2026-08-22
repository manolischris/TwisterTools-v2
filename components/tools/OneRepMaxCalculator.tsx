"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Dumbbell,
    Flame,
    Calculator,
    Target,
    Activity,
    BarChart3,
    Sparkles,
    ShieldCheck,
    RefreshCw,
    Download,
    Copy,
    Check,
    BookOpen,
    HelpCircle,
    Info,
    Layers,
    Lightbulb,
    TrendingUp,
    Scale,
    Trophy,
    Percent,
    Sliders,
    Zap,
    AlertTriangle
} from "lucide-react";

type UnitSystem = "lbs" | "kg";
type LiftType = "bench" | "squat" | "deadlift" | "overhead" | "custom";
type FormulaKey = "epley" | "brzycki" | "lander" | "lombardi" | "mayhew" | "oconner" | "wathan";

interface FormulaConfig {
    id: FormulaKey;
    name: string;
    description: string;
    calculate: (weight: number, reps: number) => number;
}

const FORMULAS: Record<FormulaKey, FormulaConfig> = {
    epley: {
        id: "epley",
        name: "Epley",
        description: "Standard powerlifting formula, optimal for 1–10 reps.",
        calculate: (w, r) => (r === 1 ? w : w * (1 + r / 30)),
    },
    brzycki: {
        id: "brzycki",
        name: "Brzycki",
        description: "Widely used in strength conditioning, accurate up to 10 reps.",
        calculate: (w, r) => (r === 1 ? w : w * (36 / (37 - r))),
    },
    lander: {
        id: "lander",
        name: "Lander (McGlothin)",
        description: "Slightly more conservative at moderate rep ranges.",
        calculate: (w, r) => (r === 1 ? w : (100 * w) / (101.3 - 2.67123 * r)),
    },
    lombardi: {
        id: "lombardi",
        name: "Lombardi",
        description: "Nonlinear power curve formula designed for heavy loading.",
        calculate: (w, r) => (r === 1 ? w : w * Math.pow(r, 0.1)),
    },
    mayhew: {
        id: "mayhew",
        name: "Mayhew et al.",
        description: "Derived from college athletes, highly accurate for upper-body lifts.",
        calculate: (w, r) => (r === 1 ? w : (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))),
    },
    oconner: {
        id: "oconner",
        name: "O'Conner et al.",
        description: "Linear mathematical curve similar to Epley with higher submax scaling.",
        calculate: (w, r) => (r === 1 ? w : w * (1 + 0.025 * r)),
    },
    wathan: {
        id: "wathan",
        name: "Wathan",
        description: "Exponential curve equation standard in collegiate athletics.",
        calculate: (w, r) => (r === 1 ? w : (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))),
    },
};

interface Preset {
    id: string;
    label: string;
    lift: LiftType;
    weight: number;
    reps: number;
    unit: UnitSystem;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "bench-225", label: "Barbell Bench Press", lift: "bench", weight: 225, reps: 5, unit: "lbs", tag: "225 lbs × 5" },
    { id: "squat-140", label: "Back Squat (Metric)", lift: "squat", weight: 140, reps: 6, unit: "kg", tag: "140 kg × 6" },
    { id: "deadlift-315", label: "Conventional Deadlift", lift: "deadlift", weight: 315, reps: 4, unit: "lbs", tag: "315 lbs × 4" },
    { id: "ohp-60", label: "Overhead Press", lift: "overhead", weight: 60, reps: 8, unit: "kg", tag: "60 kg × 8" },
];

const PERCENTAGE_BRACKETS = [
    { pct: 100, repsEstimate: 1, trainingZone: "Maximal Strength & Neural Peaking" },
    { pct: 95, repsEstimate: 2, trainingZone: "Maximal Strength & Power" },
    { pct: 90, repsEstimate: 3, trainingZone: "Heavy Strength Development" },
    { pct: 85, repsEstimate: 5, trainingZone: "Functional Hypertrophy & Strength" },
    { pct: 80, repsEstimate: 8, trainingZone: "Hypertrophy / Muscular Mass" },
    { pct: 75, repsEstimate: 10, trainingZone: "Hypertrophy & Work Capacity" },
    { pct: 70, repsEstimate: 12, trainingZone: "Endurance-Hypertrophy Continuum" },
    { pct: 65, repsEstimate: 15, trainingZone: "Dynamic Effort & Speed Strength" },
    { pct: 60, repsEstimate: 20, trainingZone: "Local Muscular Endurance & Warmup" },
    { pct: 50, repsEstimate: 25, trainingZone: "Active Recovery & Technique Deload" },
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

export default function OneRepMaxCalculator() {
    // Inputs & Options
    const [unit, setUnit] = useState<UnitSystem>("lbs");
    const [liftType, setLiftType] = useState<LiftType>("bench");
    const [weight, setWeight] = useState<number>(225);
    const [reps, setReps] = useState<number>(5);
    const [bodyweight, setBodyweight] = useState<number>(185);
    const [rpe, setRpe] = useState<number>(10);
    const [selectedFormula, setSelectedFormula] = useState<FormulaKey>("epley");
    const [activePresetId, setActivePresetId] = useState<string | null>("bench-225");

    // UI States
    const [activeTab, setActiveTab] = useState<"percentages" | "formulas" | "repmaxes">("percentages");
    const [copied, setCopied] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Effective Reps Calculation considering RPE (Reps in Reserve adjustment)
    const effectiveReps = useMemo(() => {
        const rir = 10 - (rpe || 10);
        return Math.max(1, (reps || 1) + Math.max(0, rir));
    }, [reps, rpe]);

    // Core Calculations for all formulas
    const calculatedFormulas = useMemo(() => {
        const w = weight > 0 ? weight : 0;
        const r = effectiveReps;

        return {
            epley: Math.round(FORMULAS.epley.calculate(w, r) * 10) / 10,
            brzycki: Math.round(FORMULAS.brzycki.calculate(w, r) * 10) / 10,
            lander: Math.round(FORMULAS.lander.calculate(w, r) * 10) / 10,
            lombardi: Math.round(FORMULAS.lombardi.calculate(w, r) * 10) / 10,
            mayhew: Math.round(FORMULAS.mayhew.calculate(w, r) * 10) / 10,
            oconner: Math.round(FORMULAS.oconner.calculate(w, r) * 10) / 10,
            wathan: Math.round(FORMULAS.wathan.calculate(w, r) * 10) / 10,
        };
    }, [weight, effectiveReps]);

    // Average 1RM & Selected Formula 1RM
    const calculated1RM = useMemo(() => {
        return calculatedFormulas[selectedFormula] || 0;
    }, [calculatedFormulas, selectedFormula]);

    const average1RM = useMemo(() => {
        const vals = Object.values(calculatedFormulas);
        const sum = vals.reduce((acc, curr) => acc + curr, 0);
        return Math.round((sum / vals.length) * 10) / 10;
    }, [calculatedFormulas]);

    // Strength to Weight Ratio
    const strengthRatio = useMemo(() => {
        if (!bodyweight || bodyweight <= 0 || calculated1RM <= 0) return 0;
        return Math.round((calculated1RM / bodyweight) * 100) / 100;
    }, [calculated1RM, bodyweight]);

    // Classification based on strength ratio & lift type
    const strengthClassification = useMemo(() => {
        if (strengthRatio <= 0) return { label: "Untrained", color: "text-slate-600", bg: "bg-slate-100" };

        if (liftType === "bench") {
            if (strengthRatio < 0.8) return { label: "Novice", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
            if (strengthRatio < 1.2) return { label: "Intermediate", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
            if (strengthRatio < 1.6) return { label: "Advanced", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
            return { label: "Elite", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
        } else if (liftType === "squat") {
            if (strengthRatio < 1.1) return { label: "Novice", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
            if (strengthRatio < 1.6) return { label: "Intermediate", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
            if (strengthRatio < 2.1) return { label: "Advanced", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
            return { label: "Elite", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
        } else if (liftType === "deadlift") {
            if (strengthRatio < 1.3) return { label: "Novice", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
            if (strengthRatio < 1.9) return { label: "Intermediate", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
            if (strengthRatio < 2.5) return { label: "Advanced", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
            return { label: "Elite", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
        } else {
            if (strengthRatio < 0.6) return { label: "Novice", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
            if (strengthRatio < 0.9) return { label: "Intermediate", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
            if (strengthRatio < 1.2) return { label: "Advanced", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" };
            return { label: "Elite", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
        }
    }, [strengthRatio, liftType]);

    // Percentage Breakdown Table
    const percentageBreakdown = useMemo(() => {
        return PERCENTAGE_BRACKETS.map((bracket) => {
            const trainingWeight = Math.round((calculated1RM * (bracket.pct / 100)) * 10) / 10;
            return {
                ...bracket,
                weight: trainingWeight,
            };
        });
    }, [calculated1RM]);

    // Estimated Rep Maxes (1RM down to 12RM) using selected formula
    const repMaxTable = useMemo(() => {
        const rows = [];
        for (let r = 1; r <= 12; r++) {
            // Invert the formula to find the weight that gives the calculated 1RM for r reps
            // For Epley: 1RM = W * (1 + r/30) => W = 1RM / (1 + r/30)
            let estimatedWeight = 0;
            if (r === 1) {
                estimatedWeight = calculated1RM;
            } else if (selectedFormula === "epley") {
                estimatedWeight = calculated1RM / (1 + r / 30);
            } else if (selectedFormula === "brzycki") {
                estimatedWeight = calculated1RM / (36 / (37 - r));
            } else if (selectedFormula === "lander") {
                estimatedWeight = (calculated1RM * (101.3 - 2.67123 * r)) / 100;
            } else if (selectedFormula === "lombardi") {
                estimatedWeight = calculated1RM / Math.pow(r, 0.1);
            } else if (selectedFormula === "mayhew") {
                estimatedWeight = (calculated1RM * (52.2 + 41.9 * Math.exp(-0.055 * r))) / 100;
            } else if (selectedFormula === "oconner") {
                estimatedWeight = calculated1RM / (1 + 0.025 * r);
            } else {
                estimatedWeight = (calculated1RM * (48.8 + 53.8 * Math.exp(-0.075 * r))) / 100;
            }
            rows.push({
                rep: r,
                weight: Math.max(0, Math.round(estimatedWeight * 10) / 10),
                percentage: Math.round((estimatedWeight / (calculated1RM || 1)) * 1000) / 10,
            });
        }
        return rows;
    }, [calculated1RM, selectedFormula]);

    // Unit toggle handler with direct mathematical conversion
    const handleUnitToggle = (newUnit: UnitSystem) => {
        if (newUnit === unit) return;
        if (newUnit === "kg") {
            setWeight(Math.round((weight * 0.45359237) * 10) / 10);
            setBodyweight(Math.round((bodyweight * 0.45359237) * 10) / 10);
        } else {
            setWeight(Math.round((weight * 2.20462262) * 10) / 10);
            setBodyweight(Math.round((bodyweight * 2.20462262) * 10) / 10);
        }
        setUnit(newUnit);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnit(preset.unit);
        setLiftType(preset.lift);
        setWeight(preset.weight);
        setReps(preset.reps);
        setRpe(10);
        if (preset.unit === "lbs") {
            setBodyweight(185);
        } else {
            setBodyweight(84);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnit("lbs");
        setLiftType("bench");
        setWeight(225);
        setReps(5);
        setBodyweight(185);
        setRpe(10);
        setSelectedFormula("epley");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const liftName = liftType === "custom" ? "Lift" : liftType.toUpperCase();
        const text = `One Rep Max (1RM) Performance Analysis (TwisterTools):
--------------------------------------------------
Lift: ${liftName}
Input Performance: ${weight} ${unit} × ${reps} reps (RPE ${rpe})
Active Formula: ${FORMULAS[selectedFormula].name}
--------------------------------------------------
Estimated 1RM: ${calculated1RM} ${unit}
Formula Ensemble Average: ${average1RM} ${unit}
Bodyweight: ${bodyweight} ${unit}
Strength-to-Bodyweight Ratio: ${strengthRatio}x (${strengthClassification.label})
--------------------------------------------------
Submaximal Training Loads:
• 90% (Heavy Doubles/Triples): ${percentageBreakdown.find(p => p.pct === 90)?.weight} ${unit}
• 80% (Hypertrophy Sets): ${percentageBreakdown.find(p => p.pct === 80)?.weight} ${unit}
• 70% (Work Capacity): ${percentageBreakdown.find(p => p.pct === 70)?.weight} ${unit}
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/one-rep-max-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Rep Max / Training Zone", "Load Percentage", `Target Weight (${unit})`, "Estimated Rep Target"];
        const rows = percentageBreakdown.map((row) => [
            `"${row.trainingZone}"`,
            `"${row.pct}%"`,
            `"${row.weight}"`,
            `"~${row.repsEstimate} reps"`,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `1RM_Training_Matrix_${liftType}_${weight}${unit}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "One Rep Max (1RM) Strength & Submax Weight Estimator",
        "url": "https://twistertools.com/tools/calculators/one-rep-max-calculator",
        "description": "Calculate your 1RM, strength-to-bodyweight ratio, and complete percentage training zones across 7 scientific formulas including Epley, Brzycki, and Lombardi.",
        "applicationCategory": "HealthAndFitnessApplication",
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
                "name": "What is a One Rep Max (1RM) in strength training?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A One Rep Max (1RM) is the maximum amount of weight an athlete can lift for a single repetition of a given exercise through a complete, standard range of motion with sound biomechanical form."
                }
            },
            {
                "@type": "Question",
                "name": "Which 1RM formula is the most accurate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Epley and Brzycki formulas are the gold standards for repetition ranges between 1 and 10 reps. For upper-body lifts like bench press, the Mayhew formula is highly accurate, while the Lombardi power formula excels at lower repetition sets."
                }
            },
            {
                "@type": "Question",
                "name": "How does RPE (Rate of Perceived Exertion) affect 1RM estimation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RPE accounts for Reps in Reserve (RIR). For example, completing 5 reps at an RPE of 8 means you could have performed 2 additional reps (7 total reps to technical failure). Factoring in RIR provides a much more accurate true maximum without requiring dangerous maximal testing."
                }
            },
            {
                "@type": "Question",
                "name": "Why is testing submaximal repetitions safer than true 1RM testing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "True 1RM testing imposes acute neural fatigue and higher risk of connective tissue trauma. Submaximal estimation using 3 to 6 reps allows powerlifters and athletes to program training cycles accurately without the injury risks of true maximal attempts."
                }
            },
            {
                "@type": "Question",
                "name": "How should percentage training zones be used in powerlifting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Submaximal percentages direct specific physiological adaptations: 85-100% develops neuromuscular strength and maximal motor unit recruitment, 70-85% triggers optimal muscular hypertrophy, and 50-65% develops dynamic speed strength and active recovery."
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
                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Lifting Parameters
                                </h2>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold border border-indigo-100 dark:border-slate-700">
                                    <Zap className="w-3 h-3 text-amber-500" /> NSCA & ACSM Compliant
                                </span>
                            </div>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Toggle Switch */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Weight Unit System
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("lbs")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unit === "lbs"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Pounds (lbs)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("kg")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unit === "kg"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Kilograms (kg)
                                </button>
                            </div>
                        </div>

                        {/* Lift Selection & Formula Choice */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Exercise Discipline
                                </label>
                                <select
                                    value={liftType}
                                    onChange={(e) => { setLiftType(e.target.value as LiftType); setActivePresetId(null); }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="bench">Barbell Bench Press</option>
                                    <option value="squat">Barbell Back Squat</option>
                                    <option value="deadlift">Conventional Deadlift</option>
                                    <option value="overhead">Overhead Shoulder Press</option>
                                    <option value="custom">Custom / General Movement</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Primary 1RM Formula
                                </label>
                                <select
                                    value={selectedFormula}
                                    onChange={(e) => setSelectedFormula(e.target.value as FormulaKey)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    {Object.values(FORMULAS).map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} Formula
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Weight Lifted & Repetitions Completed */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Weight Lifted ({unit})
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="2000"
                                        step="0.5"
                                        value={weight === 0 ? "" : weight}
                                        onChange={(e) => { handleNumberInput(e, (val) => setWeight(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="e.g. 225"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-indigo-600" /> Reps Performed (1–20)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={reps === 0 ? "" : reps}
                                        onChange={(e) => { handleNumberInput(e, (val) => setReps(Math.max(1, Math.min(20, val)))); setActivePresetId(null); }}
                                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="e.g. 5"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">reps</span>
                                </div>
                            </div>
                        </div>

                        {/* RPE and Bodyweight Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Flame className="w-3.5 h-3.5 text-amber-500" /> RPE (Exertion Rating)
                                    </span>
                                    <span className="text-[11px] font-extrabold text-indigo-600">
                                        RPE {rpe} ({10 - rpe === 0 ? "Max Effort" : `${10 - rpe} RIR`})
                                    </span>
                                </label>
                                <select
                                    value={rpe}
                                    onChange={(e) => setRpe(parseFloat(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="10">RPE 10 (0 Reps in Reserve - Max Effort)</option>
                                    <option value="9.5">RPE 9.5 (Maybe 1 rep left, definitely no more)</option>
                                    <option value="9">RPE 9 (1 Rep in Reserve)</option>
                                    <option value="8.5">RPE 8.5 (1–2 Reps in Reserve)</option>
                                    <option value="8">RPE 8 (2 Reps in Reserve)</option>
                                    <option value="7.5">RPE 7.5 (2–3 Reps in Reserve)</option>
                                    <option value="7">RPE 7 (3 Reps in Reserve - Fast Bar Speed)</option>
                                    <option value="6.5">RPE 6.5 (3–4 Reps in Reserve)</option>
                                    <option value="6">RPE 6 (4 Reps in Reserve - Warmup/Deload)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" /> Bodyweight ({unit})
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="40"
                                        max="600"
                                        step="0.5"
                                        value={bodyweight === 0 ? "" : bodyweight}
                                        onChange={(e) => { handleNumberInput(e, (val) => setBodyweight(Math.max(0, val))); }}
                                        className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="e.g. 185"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
                                </div>
                            </div>
                        </div>

                        {/* Reference Presets Carousel */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Benchmark Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((p) => {
                                    const isActive = activePresetId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => applyPreset(p)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition border shadow-xs whitespace-nowrap cursor-pointer ${isActive
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                                }`}
                                        >
                                            <span>{p.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                                                    }`}
                                            >
                                                {p.tag}
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
                            {copied ? "Copied Summary" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export Matrix
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Visualizations & Data Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Strength Output Analytics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("percentages")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "percentages" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Training %
                                </button>
                                <button
                                    onClick={() => setActiveTab("repmaxes")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "repmaxes" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Rep Schedule
                                </button>
                                <button
                                    onClick={() => setActiveTab("formulas")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "formulas" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Formulas
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Card */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-50/60 to-slate-50 border-indigo-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <Trophy className="w-4 h-4 text-indigo-600" /> Estimated 1RM ({FORMULAS[selectedFormula].name})
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${strengthClassification.bg} ${strengthClassification.color}`}>
                                    {strengthClassification.label} Standard
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-indigo-600">
                                    {calculated1RM > 0 ? calculated1RM : "--"}
                                </span>
                                <span className="text-base font-bold text-slate-500">{unit}</span>
                            </div>

                            {/* Secondary Stat Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-indigo-100/70">
                                <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ensemble Average</span>
                                    <span className="text-sm font-extrabold text-slate-800">{average1RM} {unit}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Strength / BW</span>
                                    <span className="text-sm font-extrabold text-slate-800">{strengthRatio > 0 ? `${strengthRatio}x` : "--"}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-white border border-slate-200/80 col-span-2 sm:col-span-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Calculated Effort</span>
                                    <span className="text-sm font-extrabold text-indigo-700">{effectiveReps} Virtual Reps</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Tabbed Content Views */}
                        {activeTab === "percentages" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                                    <span>Intensity Bracket</span>
                                    <span>Submaximal Load</span>
                                </div>
                                <div className="max-h-[290px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                    {percentageBreakdown.map((b) => (
                                        <div
                                            key={b.pct}
                                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-indigo-50/50 transition text-xs"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="w-11 font-black text-indigo-600 text-xs px-1.5 py-0.5 bg-indigo-100 rounded text-center">
                                                    {b.pct}%
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-900">{b.trainingZone}</p>
                                                    <p className="text-[10px] text-slate-500">~{b.repsEstimate} max reps capacity</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-900">{b.weight}</span>
                                                <span className="text-[10px] font-bold text-slate-400 ml-1">{unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === "repmaxes" && (
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Rep Target</th>
                                            <th className="p-2.5">Target Weight</th>
                                            <th className="p-2.5">% of 1RM</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {repMaxTable.map((row) => (
                                            <tr key={row.rep} className={row.rep === reps ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}>
                                                <td className="p-2.5 font-bold text-slate-900">{row.rep} RM</td>
                                                <td className="p-2.5 font-bold text-indigo-600">{row.weight} {unit}</td>
                                                <td className="p-2.5 text-slate-500">{row.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "formulas" && (
                            <div className="max-h-[290px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                                {Object.values(FORMULAS).map((f) => {
                                    const val = calculatedFormulas[f.id];
                                    const isSelected = selectedFormula === f.id;
                                    return (
                                        <div
                                            key={f.id}
                                            onClick={() => setSelectedFormula(f.id)}
                                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${isSelected
                                                ? "border-indigo-500 bg-indigo-50/60 shadow-xs"
                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 text-xs">{f.name}</span>
                                                    {isSelected && (
                                                        <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5">{f.description}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-3">
                                                <span className="text-sm font-black text-slate-900">{val}</span>
                                                <span className="text-[10px] text-slate-400 font-bold ml-1">{unit}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            100% Client-side Execution
                        </span>
                        <span>Multi-Formula Matrix Engine</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY SAFETY & MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Safety & Physical Disclaimer:</strong> This calculator provides mathematical estimations for programming and informational purposes only. Direct maximal single-rep lifting carries risk of injury. Never attempt true 1RM testing without qualified spotters, safety pins, and appropriate warmups.
                </p>
            </div>

            {/* BELOW-THE-FOLD CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Powerlifting Mechanics & Mathematical Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of 1RM Strength Estimation & Submaximal Formulas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In athletic conditioning and powerlifting, a <strong>One Rep Max (1RM)</strong> is the maximum poundage or kilogram load an individual can successfully hoist for a single complete repetition with sound biomechanical technique. While direct maximal testing yields true baseline values, it places immense strain on the central nervous system (CNS) and joint structures. Consequently, sport scientists have established empirical regression formulas to accurately deduce 1RM capacity from submaximal sets.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Dumbbell className="w-4 h-4 text-indigo-600" /> Linear vs Exponential Curvature
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Formulas like Epley and Brzycki treat fatigue accumulation as linear across low repetitions (1 to 8 reps). Equations like Mayhew and Wathan utilize exponential curves to maintain higher predictive accuracy for upper-body compound lifts and higher repetition counts.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> RPE & Autoregulation Adjustment
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Integrating Rate of Perceived Exertion (RPE) and Reps in Reserve (RIR) transforms standard formulas into autoregulated performance tools. Factoring left-over capacity prevents underestimating true baseline capacity on sub-failure working sets.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Specification Card */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> 7 Recognized Scientific Strength Formulas
                        </h3>
                        <p className="text-xs text-slate-300">
                            Where <em>W</em> = weight lifted and <em>r</em> = total completed repetitions:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Epley:</strong> 1RM = W × (1 + r / 30)</div>
                            <div><strong>2. Brzycki:</strong> 1RM = W × (36 / (37 - r))</div>
                            <div><strong>3. Lander (McGlothin):</strong> 1RM = (100 × W) / (101.3 - 2.67123 × r)</div>
                            <div><strong>4. Lombardi:</strong> 1RM = W × r^0.1</div>
                            <div><strong>5. Mayhew et al.:</strong> 1RM = (100 × W) / (52.2 + 41.9 × e^(-0.055 × r))</div>
                            <div><strong>6. O&apos;Conner et al.:</strong> 1RM = W × (1 + 0.025 × r)</div>
                            <div><strong>7. Wathan:</strong> 1RM = (100 × W) / (48.8 + 53.8 × e^(-0.075 × r))</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Training Zone Standards & Periodization Percentages */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Percentage-Based Training Zones & Periodization Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern periodization frameworks (such as Conjugate, Daily Undulating Periodization, and 5/3/1) assign training loads as strict percentages of a calculated 1RM to target specific neurological and muscular adaptations:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">% of 1RM</th>
                                    <th className="p-3">Primary Training Objective</th>
                                    <th className="p-3">Optimal Rep Range</th>
                                    <th className="p-3">Target Adaptation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">90% – 100%</td>
                                    <td className="p-3 font-semibold text-slate-900">Absolute Max Strength</td>
                                    <td className="p-3">1 – 3 Reps</td>
                                    <td className="p-3">High-threshold motor unit recruitment & neural drive</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-bold text-indigo-600">80% – 89%</td>
                                    <td className="p-3 font-semibold text-slate-900">Heavy Hypertrophy & Power</td>
                                    <td className="p-3">4 – 6 Reps</td>
                                    <td className="p-3">Myofibrillar hypertrophy & intra-muscular coordination</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">70% – 79%</td>
                                    <td className="p-3 font-semibold text-slate-900">Sarcoplasmic Hypertrophy</td>
                                    <td className="p-3">8 – 12 Reps</td>
                                    <td className="p-3">Muscular cross-sectional area & metabolic stress</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">55% – 69%</td>
                                    <td className="p-3 font-semibold text-slate-900">Speed-Strength / Dynamic Effort</td>
                                    <td className="p-3">2 – 5 Reps (Fast)</td>
                                    <td className="p-3">Rate of force development (RFD) and bar velocity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">&lt; 55%</td>
                                    <td className="p-3 font-semibold text-slate-900">Technique & Active Deload</td>
                                    <td className="p-3">15 – 25 Reps</td>
                                    <td className="p-3">Capillarization, blood flow, and motor pattern groove</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Strength Programming Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how lifters translate submaximal test sets into actionable training cycles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Intermediate Bench Presser</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Input Set:</strong> 225 lbs × 5 reps @ RPE 9 (1 RIR)</li>
                                <li><strong>Bodyweight:</strong> 180 lbs</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Estimated Outputs:</li>
                                <li>• <strong>Effective Reps:</strong> 6 reps to technical failure</li>
                                <li>• <strong>Calculated 1RM:</strong> 270.0 lbs (Epley)</li>
                                <li>• <strong>Strength Ratio:</strong> 1.50x Bodyweight (Advanced)</li>
                                <li>• <strong>75% Hypertrophy Load:</strong> 202.5 lbs × 10 reps</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Competitive Squat Athlete</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Input Set:</strong> 150 kg × 4 reps @ RPE 10 (Max Effort)</li>
                                <li><strong>Bodyweight:</strong> 78 kg</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Estimated Outputs:</li>
                                <li>• <strong>Calculated 1RM:</strong> 170.0 kg (Epley)</li>
                                <li>• <strong>Strength Ratio:</strong> 2.18x Bodyweight (Elite)</li>
                                <li>• <strong>85% Peaking Load:</strong> 144.5 kg × 5 reps</li>
                                <li>• <strong>65% Speed Load:</strong> 110.5 kg × 3 reps (Dynamic)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Strength Ratio Benchmarks & Classifications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Strength-to-Bodyweight Classification Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Relative strength (weight lifted relative to total body mass) is the ultimate metric for powerlifters and athletes across weight classes. Use these industry benchmarks to evaluate your current standing:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Bench Press</h3>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• <strong>Novice:</strong> &lt; 0.8× BW</li>
                                <li>• <strong>Intermediate:</strong> 0.8× – 1.2× BW</li>
                                <li>• <strong>Advanced:</strong> 1.2× – 1.6× BW</li>
                                <li>• <strong>Elite:</strong> &gt; 1.6× BW</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Back Squat</h3>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• <strong>Novice:</strong> &lt; 1.1× BW</li>
                                <li>• <strong>Intermediate:</strong> 1.1× – 1.6× BW</li>
                                <li>• <strong>Advanced:</strong> 1.6× – 2.1× BW</li>
                                <li>• <strong>Elite:</strong> &gt; 2.1× BW</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Deadlift</h3>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• <strong>Novice:</strong> &lt; 1.3× BW</li>
                                <li>• <strong>Intermediate:</strong> 1.3× – 1.9× BW</li>
                                <li>• <strong>Advanced:</strong> 1.9× – 2.5× BW</li>
                                <li>• <strong>Elite:</strong> &gt; 2.5× BW</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Overhead Press</h3>
                            <ul className="text-xs text-slate-600 space-y-1">
                                <li>• <strong>Novice:</strong> &lt; 0.6× BW</li>
                                <li>• <strong>Intermediate:</strong> 0.6× – 0.9× BW</li>
                                <li>• <strong>Advanced:</strong> 0.9× – 1.2× BW</li>
                                <li>• <strong>Elite:</strong> &gt; 1.2× BW</li>
                            </ul>
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
                                What is a One Rep Max (1RM) in strength training?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A One Rep Max (1RM) is the maximum amount of weight an athlete can lift for a single repetition of a given exercise through a complete, standard range of motion with sound biomechanical form.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which 1RM formula is the most accurate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Epley and Brzycki formulas are the gold standards for repetition ranges between 1 and 10 reps. For upper-body lifts like bench press, the Mayhew formula is highly accurate, while the Lombardi power formula excels at lower repetition sets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does RPE (Rate of Perceived Exertion) affect 1RM estimation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                RPE accounts for Reps in Reserve (RIR). For example, completing 5 reps at an RPE of 8 means you could have performed 2 additional reps (7 total reps to technical failure). Factoring in RIR provides a much more accurate true maximum without requiring dangerous maximal testing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is testing submaximal repetitions safer than true 1RM testing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                True 1RM testing imposes acute neural fatigue and higher risk of connective tissue trauma. Submaximal estimation using 3 to 6 reps allows powerlifters and athletes to program training cycles accurately without the injury risks of true maximal attempts.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should percentage training zones be used in powerlifting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Submaximal percentages direct specific physiological adaptations: 85-100% develops neuromuscular strength and maximal motor unit recruitment, 70-85% triggers optimal muscular hypertrophy, and 50-65% develops dynamic speed strength and active recovery.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY SAFETY & PHYSICAL DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Physical Safety Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Physical Training Disclaimer: Strength training and maximal load estimation involve physical risks. Warm up adequately, utilize spotters and barbell safety catches, and consult a certified strength and conditioning coach or medical provider before engaging in high-intensity resistance training.
                    </p>
                </section>

            </div>
        </div>
    );
}