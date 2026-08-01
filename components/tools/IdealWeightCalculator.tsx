"use client";

import React, { useState, useMemo } from "react";
import {
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
    Target,
    Heart,
    TrendingDown,
    TrendingUp,
    Award,
    Layers,
    Stethoscope,
    Activity,
    CheckCircle2,
    FileSpreadsheet,
    Zap,
    Globe,
    PieChart
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type FrameSize = "small" | "medium" | "large";

interface Preset {
    id: string;
    label: string;
    system: UnitSystem;
    gender: Gender;
    heightFt: number;
    heightIn: number;
    heightCm: number;
    frameSize: FrameSize;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "avg-male-us", label: "Average Male (5'10\")", system: "imperial", gender: "male", heightFt: 5, heightIn: 10, heightCm: 178, frameSize: "medium", tag: "Standard Male" },
    { id: "avg-female-us", label: "Average Female (5'4\")", system: "imperial", gender: "female", heightFt: 5, heightIn: 4, heightCm: 163, frameSize: "medium", tag: "Standard Female" },
    { id: "tall-athlete-male", label: "Tall Male (6'2\")", system: "imperial", gender: "male", heightFt: 6, heightIn: 2, heightCm: 188, frameSize: "large", tag: "Tall / Broad" },
    { id: "petite-female", label: "Petite Female (160cm)", system: "metric", gender: "female", heightFt: 5, heightIn: 3, heightCm: 160, frameSize: "small", tag: "Petite Frame" },
];

export default function IdealWeightCalculator() {
    // Primary Input States
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);
    const [heightCm, setHeightCm] = useState<number>(178);
    const [frameSize, setFrameSize] = useState<FrameSize>("medium");

    // UI Interactive States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"formulas" | "ranges" | "frame">("formulas");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Compute Total Inches & Meters
    const totalInches = useMemo(() => {
        if (unitSystem === "imperial") {
            return (heightFt || 0) * 12 + (heightIn || 0);
        }
        return (heightCm || 0) / 2.54;
    }, [unitSystem, heightFt, heightIn, heightCm]);

    const effectiveCm = useMemo(() => {
        if (unitSystem === "imperial") {
            return totalInches * 2.54;
        }
        return heightCm || 0;
    }, [unitSystem, totalInches, heightCm]);

    // Calculations across clinical IBW formulas
    const results = useMemo(() => {
        const inchesOver60 = Math.max(0, totalInches - 60);

        if (totalInches <= 0) {
            return {
                devineKg: 0, devineLbs: 0,
                robinsonKg: 0, robinsonLbs: 0,
                millerKg: 0, millerLbs: 0,
                hamwiKg: 0, hamwiLbs: 0,
                bmiMinKg: 0, bmiMinLbs: 0,
                bmiMaxKg: 0, bmiMaxLbs: 0,
                averageKg: 0, averageLbs: 0,
                adjustedKg: 0, adjustedLbs: 0,
            };
        }

        // 1. Devine Formula (1974)
        let devineKgVal = gender === "male" ? 50 + 2.3 * inchesOver60 : 45.5 + 2.3 * inchesOver60;

        // 2. Robinson Formula (1983)
        let robinsonKgVal = gender === "male" ? 52 + 1.9 * inchesOver60 : 49 + 1.7 * inchesOver60;

        // 3. Miller Formula (1983)
        let millerKgVal = gender === "male" ? 56.2 + 1.41 * inchesOver60 : 53.1 + 1.36 * inchesOver60;

        // 4. Hamwi Formula (1964)
        let hamwiKgVal = gender === "male" ? 48 + 2.7 * inchesOver60 : 45.5 + 2.2 * inchesOver60;

        // Apply Frame Size Modifiers (Small: -10%, Large: +10%)
        const frameMultiplier = frameSize === "small" ? 0.9 : frameSize === "large" ? 1.1 : 1.0;

        devineKgVal *= frameMultiplier;
        robinsonKgVal *= frameMultiplier;
        millerKgVal *= frameMultiplier;
        hamwiKgVal *= frameMultiplier;

        // Healthy BMI Range Target (18.5 - 24.9 kg/m²)
        const heightMeters = effectiveCm / 100;
        const bmiMinKgVal = 18.5 * (heightMeters * heightMeters);
        const bmiMaxKgVal = 24.9 * (heightMeters * heightMeters);

        // Average IBW Across Formulas
        const avgKgVal = (devineKgVal + robinsonKgVal + millerKgVal + hamwiKgVal) / 4;

        const kgToLbs = (kg: number) => kg * 2.2046226218;

        return {
            devineKg: devineKgVal,
            devineLbs: kgToLbs(devineKgVal),
            robinsonKg: robinsonKgVal,
            robinsonLbs: kgToLbs(robinsonKgVal),
            millerKg: millerKgVal,
            millerLbs: kgToLbs(millerKgVal),
            hamwiKg: hamwiKgVal,
            hamwiLbs: kgToLbs(hamwiKgVal),
            bmiMinKg: bmiMinKgVal,
            bmiMinLbs: kgToLbs(bmiMinKgVal),
            bmiMaxKg: bmiMaxKgVal,
            bmiMaxLbs: kgToLbs(bmiMaxKgVal),
            averageKg: avgKgVal,
            averageLbs: kgToLbs(avgKgVal),
        };
    }, [totalInches, effectiveCm, gender, frameSize]);

    // Unit Toggle Sync
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const computedCm = Math.round(totalInches * 2.54);
            setHeightCm(computedCm);
        } else {
            const computedInches = heightCm / 2.54;
            setHeightFt(Math.floor(computedInches / 12));
            setHeightIn(Math.round(computedInches % 12));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnitSystem(preset.system);
        setGender(preset.gender);
        setFrameSize(preset.frameSize);
        if (preset.system === "imperial") {
            setHeightFt(preset.heightFt);
            setHeightIn(preset.heightIn);
        } else {
            setHeightCm(preset.heightCm);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setGender("male");
        setHeightFt(5);
        setHeightIn(10);
        setHeightCm(178);
        setFrameSize("medium");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightStr = unitSystem === "imperial" ? `${heightFt}'${heightIn}"` : `${heightCm} cm`;
        const formatWeight = (kg: number, lbs: number) =>
            unitSystem === "imperial" ? `${lbs.toFixed(1)} lbs` : `${kg.toFixed(1)} kg`;

        const summaryText = `Ideal Body Weight (IBW) Estimate (TwisterTools):
----------------------------------------
Biological Sex: ${gender.toUpperCase()}
Stature Height: ${heightStr}
Body Frame Size: ${frameSize.toUpperCase()}
----------------------------------------
Average IBW Baseline: ${formatWeight(results.averageKg, results.averageLbs)}
Healthy BMI Range (18.5 - 24.9): ${formatWeight(results.bmiMinKg, results.bmiMinLbs)} - ${formatWeight(results.bmiMaxKg, results.bmiMaxLbs)}
----------------------------------------
Clinical Formula Breakdown:
• Devine Formula (1974): ${formatWeight(results.devineKg, results.devineLbs)}
• Robinson Formula (1983): ${formatWeight(results.robinsonKg, results.robinsonLbs)}
• Miller Formula (1983): ${formatWeight(results.millerKg, results.millerLbs)}
• Hamwi Formula (1964): ${formatWeight(results.hamwiKg, results.hamwiLbs)}
----------------------------------------
Calculated at twistertools.com/tools/calculators/ideal-weight-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Formula / Reference Metric", "Estimated Weight (kg)", "Estimated Weight (lbs)"];
        const rows = [
            ["Average IBW Target", results.averageKg.toFixed(2), results.averageLbs.toFixed(2)],
            ["Devine Formula (1974)", results.devineKg.toFixed(2), results.devineLbs.toFixed(2)],
            ["Robinson Formula (1983)", results.robinsonKg.toFixed(2), results.robinsonLbs.toFixed(2)],
            ["Miller Formula (1983)", results.millerKg.toFixed(2), results.millerLbs.toFixed(2)],
            ["Hamwi Formula (1964)", results.hamwiKg.toFixed(2), results.hamwiLbs.toFixed(2)],
            ["Healthy BMI Minimum (18.5)", results.bmiMinKg.toFixed(2), results.bmiMinLbs.toFixed(2)],
            ["Healthy BMI Maximum (24.9)", results.bmiMaxKg.toFixed(2), results.bmiMaxLbs.toFixed(2)],
            ["Sex Parameter", gender, gender],
            ["Frame Size Multiplier", frameSize, frameSize],
        ];

        const csvContent = [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ideal_body_weight_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Ideal Body Weight (IBW) Calculator",
        "url": "https://twistertools.com/tools/calculators/ideal-weight-calculator",
        "description": "Calculate clinical ideal body weight using Devine, Robinson, Miller, Hamwi formulas, and healthy BMI ranges based on stature height, sex, and frame size.",
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
                "name": "What is Ideal Body Weight (IBW)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ideal Body Weight (IBW) is an estimated clinical baseline weight associated with maximal life expectancy and optimal health parameters for a given height, biological sex, and bone structure frame size."
                }
            },
            {
                "@type": "Question",
                "name": "Which formula is most accurate for calculating IBW?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Devine formula (1974) is the standard clinical benchmark used globally, particularly for medical dosage estimations and ventilator settings. However, averaging across Devine, Robinson, Miller, and Hamwi provides a more balanced target range."
                }
            },
            {
                "@type": "Question",
                "name": "How does frame size affect ideal weight calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Skeletal structure directly alters total weight capacity. A small frame subtracts 10% from standard baseline formulas, while a large frame adds 10% to accommodate higher bone density and muscle anchor size."
                }
            },
            {
                "@type": "Question",
                "name": "Is IBW suitable for bodybuilders or muscular athletes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No, standard IBW equations do not account for muscular hypertrophy or low body fat percentages. Highly muscular individuals may exceed IBW recommendations without carrying unhealthy visceral or subcutaneous fat."
                }
            },
            {
                "@type": "Question",
                "name": "What is the key difference between IBW and BMI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Body Mass Index (BMI) provides a broad population-level category based on height-to-weight ratios, whereas Ideal Body Weight (IBW) calculates a specific target body weight value using empirical clinical formulas."
                }
            },
            {
                "@type": "Question",
                "name": "How is Ideal Body Weight used in clinical medicine?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Healthcare professionals use IBW to calculate narrow therapeutic drug dosages (like chemotherapy, aminoglycosides, and clearance-sensitive medications), determine mechanical ventilation tidal volumes, and set nutrition targets."
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
                                <User className="w-5 h-5 text-indigo-600" />
                                Physical Parameters
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
                            {/* Biological Sex Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Biological Sex
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => { setGender("male"); setActivePresetId(null); }}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${gender === "male"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setGender("female"); setActivePresetId(null); }}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${gender === "female"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Female
                                    </button>
                                </div>
                            </div>

                            {/* Stature Height Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Stature Height
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="3"
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
                                            min="90"
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

                            {/* Frame Size Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Skeletal Frame Size
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => { setFrameSize("small"); setActivePresetId(null); }}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${frameSize === "small" ? "bg-white text-indigo-600 border border-slate-200 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Small (-10%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setFrameSize("medium"); setActivePresetId(null); }}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${frameSize === "medium" ? "bg-white text-indigo-600 border border-slate-200 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Medium (Base)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setFrameSize("large"); setActivePresetId(null); }}
                                        className={`py-2 text-xs font-bold rounded-lg transition ${frameSize === "large" ? "bg-white text-indigo-600 border border-slate-200 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Large (+10%)
                                    </button>
                                </div>
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
                            {copied ? "Copied" : "Copy IBW Summary"}
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
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[640px]">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Target Weight Output
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("formulas")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "formulas" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Formulas
                                </button>
                                <button
                                    onClick={() => setActiveTab("ranges")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "ranges" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    BMI Range
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Target className="w-4 h-4 text-emerald-400" /> Average Ideal Weight Baseline
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                    Devine / Robinson / Miller / Hamwi
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {unitSystem === "imperial"
                                        ? `${results.averageLbs.toFixed(1)}`
                                        : `${results.averageKg.toFixed(1)}`}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">
                                    {unitSystem === "imperial" ? "lbs" : "kg"}
                                </span>
                            </div>

                            <p className="mt-3 text-xs text-indigo-200/90 leading-relaxed border-t border-indigo-800/80 pt-3">
                                Based on a height of <strong>{unitSystem === "imperial" ? `${heightFt}'${heightIn}"` : `${heightCm} cm`}</strong> ({gender}, {frameSize} frame). Healthy BMI targets range from <strong>{unitSystem === "imperial" ? `${results.bmiMinLbs.toFixed(1)} - ${results.bmiMaxLbs.toFixed(1)} lbs` : `${results.bmiMinKg.toFixed(1)} - ${results.bmiMaxKg.toFixed(1)} kg`}</strong>.
                            </p>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "formulas" && (
                            <div className="grid grid-cols-2 gap-3.5 pt-1">
                                {/* Devine Formula */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Award className="w-4 h-4 text-indigo-600" />
                                        Devine (1974)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {unitSystem === "imperial" ? `${results.devineLbs.toFixed(1)} lbs` : `${results.devineKg.toFixed(1)} kg`}
                                    </p>
                                    <p className="text-[11px] text-slate-500">Clinical Gold Standard</p>
                                </div>

                                {/* Robinson Formula */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Calculator className="w-4 h-4 text-indigo-600" />
                                        Robinson (1983)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {unitSystem === "imperial" ? `${results.robinsonLbs.toFixed(1)} lbs` : `${results.robinsonKg.toFixed(1)} kg`}
                                    </p>
                                    <p className="text-[11px] text-slate-500">Devine Revision Model</p>
                                </div>

                                {/* Miller Formula */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Calculator className="w-4 h-4 text-indigo-600" />
                                        Miller (1983)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {unitSystem === "imperial" ? `${results.millerLbs.toFixed(1)} lbs` : `${results.millerKg.toFixed(1)} kg`}
                                    </p>
                                    <p className="text-[11px] text-slate-500">Modified Rate Curve</p>
                                </div>

                                {/* Hamwi Formula */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Calculator className="w-4 h-4 text-indigo-600" />
                                        Hamwi (1964)
                                    </div>
                                    <p className="text-xl font-extrabold text-slate-900">
                                        {unitSystem === "imperial" ? `${results.hamwiLbs.toFixed(1)} lbs` : `${results.hamwiKg.toFixed(1)} kg`}
                                    </p>
                                    <p className="text-[11px] text-slate-500">Medicinal Dosage Origin</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "ranges" && (
                            <div className="space-y-3">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">BMI 18.5 Baseline (Underweight Threshold)</div>
                                        <div className="text-sm text-slate-700 font-medium">Lower physiological bound</div>
                                    </div>
                                    <div className="text-lg font-black text-slate-900">
                                        {unitSystem === "imperial" ? `${results.bmiMinLbs.toFixed(1)} lbs` : `${results.bmiMinKg.toFixed(1)} kg`}
                                    </div>
                                </div>

                                <div className="p-3.5 border border-emerald-200 rounded-xl bg-emerald-50/50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-emerald-700 uppercase">BMI 22.0 Ideal Midpoint</div>
                                        <div className="text-sm text-emerald-900 font-medium">Optimal epidemiological reference</div>
                                    </div>
                                    <div className="text-lg font-black text-emerald-700">
                                        {unitSystem === "imperial"
                                            ? `${((results.bmiMinLbs + results.bmiMaxLbs) / 2).toFixed(1)} lbs`
                                            : `${((results.bmiMinKg + results.bmiMaxKg) / 2).toFixed(1)} kg`}
                                    </div>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase">BMI 24.9 Upper Boundary</div>
                                        <div className="text-sm text-slate-700 font-medium">Upper normal range threshold</div>
                                    </div>
                                    <div className="text-lg font-black text-slate-900">
                                        {unitSystem === "imperial" ? `${results.bmiMaxLbs.toFixed(1)} lbs` : `${results.bmiMaxKg.toFixed(1)} kg`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>Clinical Formula Suite</span>
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

                {/* Card 1: Clinical Mechanics & Definition */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Fundamentals of Ideal Body Weight (IBW)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>Ideal Body Weight (IBW)</strong> is a clinically computed weight metric initially formulated to guide medical treatments, pharmacokinetic dosing schedules, and respiratory therapy parameters. Unlike generic scales or simple BMI tables, IBW calculations determine the optimal physiological lean body mass target for an individual based primarily on biological sex, stature height, and frame size.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In hospital settings, dosing medications strictly according to total body weight (TBW) in patients carrying elevated body fat can lead to accidental drug toxicity. Because lipophilic and hydrophilic drugs distribute differently throughout adipose tissue compared to vascular lean tissue, medical personnel rely on IBW to establish safe baseline thresholds for narrow-therapeutic-index drugs.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 text-indigo-600" /> Pharmacokinetic Dosing
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Adipose fat tissue exhibits lower blood perfusion rates per unit mass than organs and muscle tissue. IBW prevents drug overdose during antibiotic administration, chemotherapy, and anesthetic dosing.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-600" /> Ventilator Tidal Volume
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Lung capacity correlates strongly with stature height and biological sex rather than total body weight. Critical care units set mechanical ventilation parameters (6–8 mL/kg of IBW) using Devine formula targets to prevent barotrauma.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl p-6 space-y-3">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Underlying Clinical Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            Where height ($H$) is calculated in inches above 60 inches (5 feet):
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>Devine Formula (1974):</strong> Male = 50.0 kg + 2.3 kg/in | Female = 45.5 kg + 2.3 kg/in</div>
                            <div><strong>Robinson Formula (1983):</strong> Male = 52.0 kg + 1.9 kg/in | Female = 49.0 kg + 1.7 kg/in</div>
                            <div><strong>Miller Formula (1983):</strong> Male = 56.2 kg + 1.41 kg/in | Female = 53.1 kg + 1.36 kg/in</div>
                            <div><strong>Hamwi Formula (1964):</strong> Male = 48.0 kg + 2.7 kg/in | Female = 45.5 kg + 2.2 kg/in</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Formula Matrix Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Comparison of Clinical IBW Equations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Four primary formulas dominate medical and epidemiological literature. While all models share a baseline stature anchor of 5 feet (60 inches), each uses different incremental scalar multipliers based on their respective research cohorts:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Formula</th>
                                    <th className="p-3">Origin Year</th>
                                    <th className="p-3">Primary Medical / Scientific Focus</th>
                                    <th className="p-3">Formula Characteristics & Nuances</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-900">Devine Formula</td>
                                    <td className="p-3 font-mono font-semibold">1974</td>
                                    <td className="p-3">Medicinal Dosing (Theophylline, Aminoglycosides) & Mechanical Ventilation.</td>
                                    <td className="p-3">The universally adopted global clinical benchmark across healthcare facilities.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Robinson Formula</td>
                                    <td className="p-3 font-mono font-semibold">1983</td>
                                    <td className="p-3">Population Health Assessment & General Nutritional Guidance.</td>
                                    <td className="p-3">Modifies Devine baseline to smooth data variance in average-height individuals.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Miller Formula</td>
                                    <td className="p-3 font-mono font-semibold">1983</td>
                                    <td className="p-3">Mathematical Curve Modeling & Weight Range Smoothing.</td>
                                    <td className="p-3">Yields slightly higher baseline weights for shorter stature demographics.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Hamwi Formula</td>
                                    <td className="p-3 font-mono font-semibold">1964</td>
                                    <td className="p-3">Diabetic Dietary Planning & Clinical Nutrition Thumb Rules.</td>
                                    <td className="p-3">Oldest standardized rule of thumb (50 kg base for men, 45.5 kg for women).</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Frame Size & Wrist Measurement Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Ruler className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Determining Skeletal Frame Size via Wrist & Elbow Metrics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Standard clinical formulas assume a medium skeletal frame size. However, bone density and skeletal structure vary significantly across individuals. A person with a larger frame naturally carries more skeletal and muscular mass at optimal health.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Small Frame (-10% Multiplier)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Men &gt; 5'5":</strong> Wrist &lt; 6.5 in (&lt; 16.5 cm)<br />
                                <strong>Women 5'2"–5 me'5":</strong> Wrist &lt; 6.0 in (&lt; 15.2 cm)<br />
                                <strong>Women &lt; 5'2":</strong> Wrist &lt; 5.5 in (&lt; 14.0 cm)
                            </p>
                        </div>
                        <div className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/40 space-y-2">
                            <h3 className="font-bold text-indigo-900 text-sm">Medium Frame (Baseline 1.0x)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Men &gt; 5'5":</strong> Wrist 6.5–7.5 in (16.5–19.0 cm)<br />
                                <strong>Women 5'2"–5'5":</strong> Wrist 6.0–6.25 in (15.2–15.8 cm)<br />
                                <strong>Women &lt; 5'2":</strong> Wrist 5.5–5.75 in (14.0–14.6 cm)
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Large Frame (+10% Multiplier)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <strong>Men &gt; 5'5":</strong> Wrist &gt; 7.5 in (&gt; 19.0 cm)<br />
                                <strong>Women 5'2"–5'5":</strong> Wrist &gt; 6.25 in (&gt; 15.8 cm)<br />
                                <strong>Women &lt; 5'2":</strong> Wrist &gt; 5.75 in (&gt; 14.6 cm)
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Worked Case Studies / Real World Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Clinical Calculation Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how different demographic profiles calculate across all four clinical IBW models and healthy BMI boundaries:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Example 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example A: Male Stature 5'10" (178 cm)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Medium Frame</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>Devine Target:</strong> 160.9 lbs (73.0 kg)</li>
                                <li>• <strong>Robinson Target:</strong> 156.5 lbs (71.0 kg)</li>
                                <li>• <strong>Miller Target:</strong> 154.5 lbs (70.1 kg)</li>
                                <li>• <strong>Hamwi Target:</strong> 165.3 lbs (75.0 kg)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    Average IBW Baseline: 159.3 lbs (72.3 kg)
                                </li>
                                <li>Healthy BMI Range (18.5 - 24.9): 128.9 lbs – 173.5 lbs</li>
                            </ul>
                        </div>

                        {/* Case Example 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example B: Female Stature 5'4" (163 cm)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Petite / Small Frame</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>Devine Target (-10%):</strong> 108.5 lbs (49.2 kg)</li>
                                <li>• <strong>Robinson Target (-10%):</strong> 110.8 bg (50.2 kg)</li>
                                <li>• <strong>Miller Target (-10%):</strong> 116.1 lbs (52.7 kg)</li>
                                <li>• <strong>Hamwi Target (-10%):</strong> 107.7 lbs (48.9 kg)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    Average IBW Baseline: 110.8 lbs (50.3 kg)
                                </li>
                                <li>Healthy BMI Range (18.5 - 24.9): 108.0 lbs – 145.4 lbs</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: IBW vs BMI vs Body Fat Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparing IBW, BMI, and Body Composition Analysis
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding how IBW differs from other health metrics helps put your total body weight target into proper clinical perspective:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Ideal Body Weight (IBW)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Computes a specific, point-estimate target weight tailored to biological sex, height, and bone frame. Best used for clinical dosing and baseline targets.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Body Mass Index (BMI)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Provides a broad epidemiological weight category (Underweight, Normal, Overweight, Obese) calculated solely as kg/m².
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Body Composition (% Fat)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Measures the exact ratio of adipose fat mass to lean muscle and bone mass (DEXA scan or calipers). Gold standard for athletic performance tracking.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                What is Ideal Body Weight (IBW)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Ideal Body Weight (IBW) is an estimated clinical baseline weight associated with maximal life expectancy and optimal health parameters for a given height, biological sex, and bone structure frame size.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which formula is most accurate for calculating IBW?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Devine formula (1974) is the standard clinical benchmark used globally, particularly for medical dosage estimations and ventilator settings. However, averaging across Devine, Robinson, Miller, and Hamwi provides a more balanced target range.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does frame size affect ideal weight calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Skeletal structure directly alters total weight capacity. A small frame subtracts 10% from standard baseline formulas, while a large frame adds 10% to accommodate higher bone density and muscle anchor size.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is IBW suitable for bodybuilders or muscular athletes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No, standard IBW equations do not account for muscular hypertrophy or low body fat percentages. Highly muscular individuals may exceed IBW recommendations without carrying unhealthy visceral or subcutaneous fat.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the key difference between IBW and BMI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Body Mass Index (BMI) provides a broad population-level category based on height-to-weight ratios, whereas Ideal Body Weight (IBW) calculates a specific target body weight value using empirical clinical formulas.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is Ideal Body Weight used in clinical medicine?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Healthcare professionals use IBW to calculate narrow therapeutic drug dosages (like chemotherapy, aminoglycosides, and clearance-sensitive medications), determine mechanical ventilation tidal volumes, and set nutrition targets.
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