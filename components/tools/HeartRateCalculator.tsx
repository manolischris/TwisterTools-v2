"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
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
    Zap,
    Gauge,
    Flame,
    Target,
    Layers,
    Stethoscope,
    Dumbbell,
    Sliders,
    Timer,
    Scale,
    PieChart,
    Award
} from "lucide-react";

type FormulaType = "tanaka" | "haskell" | "karvonen";
type Gender = "male" | "female";

interface Preset {
    id: string;
    label: string;
    age: number;
    restingHeartRate: number;
    formula: FormulaType;
    gender: Gender;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "active-runner", label: "Endurance Runner (30y)", age: 30, restingHeartRate: 52, formula: "karvonen", gender: "female", tag: "Karvonen Method" },
    { id: "general-fitness", label: "Fitness Enthusiast (42y)", age: 42, restingHeartRate: 68, formula: "tanaka", gender: "male", tag: "Tanaka Formula" },
    { id: "senior-active", label: "Active Senior (65y)", age: 65, restingHeartRate: 72, formula: "haskell", gender: "male", tag: "Standard Formula" },
];

interface HeartRateZone {
    zone: number;
    name: string;
    rangePct: string;
    minBpm: number;
    maxBpm: number;
    intensity: string;
    primaryBenefit: string;
    fuelSource: string;
    color: string;
    bgGradient: string;
    borderColor: string;
}

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

export default function HeartRateCalculator() {
    // Input States
    const [age, setAge] = useState<number>(35);
    const [restingHeartRate, setRestingHeartRate] = useState<number>(65);
    const [formula, setFormula] = useState<FormulaType>("karvonen");
    const [gender, setGender] = useState<Gender>("male");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"zones" | "formula" | "benefits">("zones");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Maximum Heart Rate (MHR) Calculations
    const maxHeartRate = useMemo(() => {
        if (!age || age <= 0) return 0;

        switch (formula) {
            case "tanaka":
                // Tanaka Formula: 208 - (0.7 * age)
                return Math.round(208 - (0.7 * age));
            case "haskell":
                // Standard Fox/Haskell Formula: 220 - age
                return Math.round(220 - age);
            case "karvonen":
            default:
                // Uses Tanaka baseline for MHR in Heart Rate Reserve calculations
                return Math.round(208 - (0.7 * age));
        }
    }, [age, formula]);

    // Heart Rate Reserve (HRR) for Karvonen Method
    const heartRateReserve = useMemo(() => {
        return Math.max(0, maxHeartRate - restingHeartRate);
    }, [maxHeartRate, restingHeartRate]);

    // Calculate 5 Target Heart Rate Zones
    const zones = useMemo<HeartRateZone[]>(() => {
        if (maxHeartRate <= 0) return [];

        const zoneSpecs = [
            {
                zone: 1,
                name: "Very Light (Active Recovery)",
                minPct: 0.50,
                maxPct: 0.60,
                rangePct: "50% - 60%",
                intensity: "Very Low (RPE 1–2)",
                primaryBenefit: "Active recovery, metabolic waste clearance, warm-up & cool-down",
                fuelSource: "85% Fats / 15% Carbs",
                color: "text-emerald-600",
                bgGradient: "from-emerald-50 to-teal-50/30",
                borderColor: "border-emerald-200"
            },
            {
                zone: 2,
                name: "Light (Aerobic Base / Fat Oxidation)",
                minPct: 0.60,
                maxPct: 0.70,
                rangePct: "60% - 70%",
                intensity: "Low / Moderate (RPE 3–4)",
                primaryBenefit: "Mitochondrial density, capillary growth & maximum fat metabolization",
                fuelSource: "70% Fats / 30% Carbs",
                color: "text-blue-600",
                bgGradient: "from-blue-50 to-indigo-50/30",
                borderColor: "border-blue-200"
            },
            {
                zone: 3,
                name: "Moderate (Aerobic Endurance)",
                minPct: 0.70,
                maxPct: 0.80,
                rangePct: "70% - 80%",
                intensity: "Moderate / High (RPE 5–6)",
                primaryBenefit: "Cardiovascular efficiency, stroke volume & aerobic stamina",
                fuelSource: "50% Fats / 50% Carbs",
                color: "text-amber-600",
                bgGradient: "from-amber-50 to-yellow-50/30",
                borderColor: "border-amber-200"
            },
            {
                zone: 4,
                name: "Hard (Anaerobic / Lactate Threshold)",
                minPct: 0.80,
                maxPct: 0.90,
                rangePct: "80% - 90%",
                intensity: "High / Intense (RPE 7–8)",
                primaryBenefit: "Lactate threshold buffering, speed endurance & anaerobic capacity",
                fuelSource: "20% Fats / 80% Carbs",
                color: "text-orange-600",
                bgGradient: "from-orange-50 to-red-50/30",
                borderColor: "border-orange-200"
            },
            {
                zone: 5,
                name: "Maximum (VO2 Max / Neuromuscular)",
                minPct: 0.90,
                maxPct: 1.00,
                rangePct: "90% - 100%",
                intensity: "Maximum Sprint (RPE 9–10)",
                primaryBenefit: "Peak power output, sprinting velocity & maximal oxygen uptake",
                fuelSource: "5% Fats / 95% Carbs",
                color: "text-rose-600",
                bgGradient: "from-rose-50 to-pink-50/30",
                borderColor: "border-rose-200"
            },
        ];

        return zoneSpecs.map((z) => {
            let minBpm = 0;
            let maxBpm = 0;

            if (formula === "karvonen") {
                // Karvonen Formula: Target HR = ((MHR - RestHR) * %Intensity) + RestHR
                minBpm = Math.round((heartRateReserve * z.minPct) + restingHeartRate);
                maxBpm = Math.round((heartRateReserve * z.maxPct) + restingHeartRate);
            } else {
                // Straight MHR Percentage: Target HR = MHR * %Intensity
                minBpm = Math.round(maxHeartRate * z.minPct);
                maxBpm = Math.round(maxHeartRate * z.maxPct);
            }

            return {
                ...z,
                minBpm,
                maxBpm
            };
        });
    }, [maxHeartRate, restingHeartRate, heartRateReserve, formula]);

    const applyPreset = (preset: Preset) => {
        setAge(preset.age);
        setRestingHeartRate(preset.restingHeartRate);
        setFormula(preset.formula);
        setGender(preset.gender);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setAge(35);
        setRestingHeartRate(65);
        setFormula("karvonen");
        setGender("male");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const formulaName = formula === "karvonen" ? "Karvonen (HRR)" : formula === "tanaka" ? "Tanaka (208 - 0.7×Age)" : "Haskell (220 - Age)";

        let zonesSummary = zones.map(z => `• Zone ${z.zone} (${z.name}): ${z.minBpm} - ${z.maxBpm} BPM (${z.rangePct})`).join("\n");

        const summaryText = `Target Heart Rate Zone Summary (TwisterTools):
----------------------------------------
Age: ${age} Years | Sex: ${gender.toUpperCase()}
Resting Heart Rate: ${restingHeartRate} BPM
Maximum Heart Rate (MHR): ${maxHeartRate} BPM
Formula Selected: ${formulaName}
----------------------------------------
CALCULATED TARGET HEART RATE ZONES:
${zonesSummary}
----------------------------------------
Calculated at twistertools.com/tools/calculators/heart-rate-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Zone Number", "Zone Name", "Intensity Range", "Min BPM", "Max BPM", "Primary Benefit", "Primary Fuel"];
        const rows = zones.map(z => [
            `Zone ${z.zone}`,
            z.name,
            z.rangePct,
            `${z.minBpm}`,
            `${z.maxBpm}`,
            z.primaryBenefit,
            z.fuelSource
        ]);

        const metaRows = [
            [],
            ["Metabolic Parameter", "Value"],
            ["Age", `${age}`],
            ["Resting Heart Rate", `${restingHeartRate} BPM`],
            ["Calculated Max Heart Rate", `${maxHeartRate} BPM`],
            ["Calculation Formula", formula]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
            ...metaRows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `heart_rate_zones_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Target Heart Rate Zone Calculator",
        "url": "https://twistertools.com/tools/calculators/heart-rate-calculator",
        "description": "Calculate personal target heart rate zones for fat loss, cardiovascular endurance, and athletic performance using Karvonen and Tanaka formulas.",
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
                "name": "What is the Karvonen formula and why is it preferred?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Karvonen formula factors in your resting heart rate (RHR) alongside your maximum heart rate (MHR) to calculate Heart Rate Reserve (HRR). This provides a significantly more personalized and accurate target zone structure compared to standard age-only formulas."
                }
            },
            {
                "@type": "Question",
                "name": "Which heart rate zone is best for burning fat?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Zone 2 (60% to 70% of Max Heart Rate) is widely recognized as the optimal fat-burning zone. At this light intensity, the body predominantly metabolizes fatty acids rather than muscle glycogen for substrate energy."
                }
            },
            {
                "@type": "Question",
                "name": "How do I measure my resting heart rate accurately?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Measure your resting heart rate immediately upon waking in the morning while remaining lying in bed. Count your radial pulse for 60 seconds or use a calibrated wearable device."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Tanaka and Haskell formulas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The traditional Haskell & Fox formula (220 - age) often underestimates maximum heart rate in active adults over 40. The Tanaka formula (208 - 0.7 × age) was clinically derived to provide greater accuracy across age demographics."
                }
            },
            {
                "@type": "Question",
                "name": "What is Cardiac Drift and how does it affect heart rate training?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cardiac drift refers to the progressive increase in heart rate during prolonged steady-state exercise despite maintaining a constant workload. It occurs due to dehydration and increased core thermal temperature, requiring slight intensity adjustments during long sessions."
                }
            },
            {
                "@type": "Question",
                "name": "How does Rate of Perceived Exertion (RPE) correlate with Heart Rate Zones?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "RPE is a subjective 1–10 scale measuring physical effort. Zone 1 matches RPE 1–2 (very easy), Zone 2 matches RPE 3–4 (comfortable light pace), Zone 3 matches RPE 5–6 (moderate effort), Zone 4 matches RPE 7–8 (hard/unsustainable), and Zone 5 matches RPE 9–10 (all-out sprint)."
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
                                Individual Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
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
                                        max="100"
                                        value={age === 0 ? "" : age}
                                        onChange={(e) => { handleNumberInput(e, (val) => setAge(val === 0 ? 0 : Math.max(1, Math.min(100, val)))); setActivePresetId(null); }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Resting Heart Rate Input */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Resting Heart Rate (RHR)
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        {restingHeartRate} BPM
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="35"
                                    max="110"
                                    value={restingHeartRate}
                                    onChange={(e) => {
                                        setRestingHeartRate(Number(e.target.value));
                                        setActivePresetId(null);
                                    }}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                                    <span>35 BPM (Athlete)</span>
                                    <span>70 BPM (Average)</span>
                                    <span>110 BPM (Elevated)</span>
                                </div>
                            </div>

                            {/* Formula Selection Switch */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Calculation Formula
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setFormula("karvonen")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${formula === "karvonen"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Karvonen (HRR)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormula("tanaka")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${formula === "tanaka"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Tanaka (208-0.7×A)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormula("haskell")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${formula === "haskell"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Standard (220-A)
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                                    {formula === "karvonen" && "Karvonen uses Heart Rate Reserve (HRR) factoring resting HR for maximal clinical precision."}
                                    {formula === "tanaka" && "Tanaka is medically validated for active adults over 30 to correct underestimation."}
                                    {formula === "haskell" && "Traditional Fox & Haskell formula used for basic rapid estimation."}
                                </p>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Archetype Presets
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
                            {copied ? "Copied" : "Copy Heart Rate Zones"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Heart Rate Zone Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Calculated Zone Ranges
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("zones")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "zones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    5 Zones
                                </button>
                                <button
                                    onClick={() => setActiveTab("formula")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "formula" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Metrics
                                </button>
                            </div>
                        </div>

                        {/* Primary Max HR Hero Box */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Calculated Maximum Heart Rate (MHR)
                                </span>
                                <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase">
                                    {formula} Mode
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {maxHeartRate > 0 ? maxHeartRate : "--"}
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">BPM (Beats / Min)</span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-indigo-800/80 pt-3 text-xs text-indigo-200">
                                <div>Resting HR: <strong className="text-white">{restingHeartRate} BPM</strong></div>
                                <div>Heart Rate Reserve: <strong className="text-white">{heartRateReserve} BPM</strong></div>
                            </div>
                        </div>

                        {/* Active Tab: 5 Heart Rate Zones */}
                        {activeTab === "zones" && (
                            <div className="space-y-2.5">
                                {zones.map((z) => (
                                    <div
                                        key={z.zone}
                                        className={`p-3.5 rounded-xl border bg-gradient-to-r ${z.bgGradient} ${z.borderColor} transition hover:shadow-xs`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-lg bg-white border ${z.borderColor} text-xs font-black flex items-center justify-center ${z.color}`}>
                                                    Z{z.zone}
                                                </span>
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-900">{z.name}</h3>
                                                    <span className="text-[10px] font-semibold text-slate-500">{z.rangePct} Intensity</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-base font-black ${z.color}`}>
                                                    {z.minBpm} - {z.maxBpm} <span className="text-xs font-medium text-slate-500">BPM</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[11px] text-slate-600 flex justify-between border-t border-slate-200/60 pt-1.5">
                                            <span><strong>Benefit:</strong> {z.primaryBenefit}</span>
                                            <span className="font-semibold text-slate-700">{z.fuelSource}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === "formula" && (
                            <div className="space-y-3 text-xs text-slate-700">
                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                    <div className="font-bold text-slate-900">Heart Rate Reserve (HRR)</div>
                                    <p className="text-slate-600">
                                        Calculated as MHR ({maxHeartRate}) minus Resting HR ({restingHeartRate}) = <strong>{heartRateReserve} BPM</strong>. Represents your total dynamic cardiorespiratory working spectrum.
                                    </p>
                                </div>

                                <div className="p-3.5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-1">
                                    <div className="font-bold text-indigo-900">Tanaka Formula Derivation</div>
                                    <p className="text-indigo-950">
                                        Formula: 208 - (0.7 × {age}) = <strong>{Math.round(208 - (0.7 * age))} BPM</strong>. Validated across 351 clinical studies to avoid underestimating MHR in aging athletes.
                                    </p>
                                </div>

                                <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-1">
                                    <div className="font-bold text-slate-900">Standard Haskell & Fox Derivation</div>
                                    <p className="text-slate-600">
                                        Formula: 220 - {age} = <strong>{220 - age} BPM</strong>. Traditional baseline estimation created in 1971.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span>Clinical Physiology Engine</span>
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

                {/* Card 1: Physiology of Heart Rate Zones */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Target Heart Rate Zones and Aerobic Physiology
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Target heart rate training uses specific cardiovascular exercise intensities—expressed as a percentage of your maximum heart rate—to trigger targeted physiological adaptations. Training in distinct heart rate zones allows athletes, runners, and fitness enthusiasts to optimize fat burning, build cardiovascular endurance, and increase VO2 max while preventing overtraining and burnout.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Heart className="w-4 h-4 text-rose-500" /> Heart Rate Reserve (HRR)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Heart Rate Reserve is the difference between your maximum heart rate and your resting heart rate. Using HRR via the Karvonen method accounts for individual aerobic conditioning, offering greater accuracy for endurance athletes.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Zap className="w-4 h-4 text-indigo-600" /> Lactate Threshold (LT)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The exercise intensity at which blood lactate accumulates faster than it can be cleared (typically Zone 4). Training near this boundary increases your body’s ability to sustain fast paces for longer durations.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-emerald-600" /> Aerobic Threshold (AeT)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The upper limit of Zone 2 training where exercise remains strictly aerobic. Below this threshold, blood lactate levels stay at baseline, maximizing fat oxidation and capillary density.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulas Applied
                        </h3>
                        <p className="text-xs text-slate-300">
                            This engine calculates target zones based on clinically validated mathematical models:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Karvonen Target HR:</strong> Target HR = ((Max HR - Resting HR) × %Intensity) + Resting HR</div>
                            <div><strong>2. Tanaka Max HR:</strong> Max HR = 208 - (0.7 × Age in years)</div>
                            <div><strong>3. Fox & Haskell Max HR:</strong> Max HR = 220 - Age in years</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comprehensive 5-Zone Breakdown & Fuel Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The 5 Cardiovascular Training Zones & Fuel Utilization Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Each target zone engages different energy systems, metabolic pathways, and subjective effort scales during physical training:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Zone</th>
                                    <th className="p-3">Intensity Range</th>
                                    <th className="p-3">RPE Scale (1–10)</th>
                                    <th className="p-3">Primary Fuel Substrate</th>
                                    <th className="p-3">Primary Adaptation Goal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-emerald-600">Zone 1</td>
                                    <td className="p-3 font-semibold">50% - 60% MHR</td>
                                    <td className="p-3">RPE 1–2 (Very Easy)</td>
                                    <td className="p-3">85% Fat / 15% Carbs</td>
                                    <td className="p-3">Active recovery, stress reduction, and blood circulation.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-blue-50/20">
                                    <td className="p-3 font-bold text-blue-600">Zone 2</td>
                                    <td className="p-3 font-semibold">60% - 70% MHR</td>
                                    <td className="p-3">RPE 3–4 (Light Pace)</td>
                                    <td className="p-3">70% Fat / 30% Carbs</td>
                                    <td className="p-3">Aerobic base, capillary density & mitochondrial biogenesis.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-amber-600">Zone 3</td>
                                    <td className="p-3 font-semibold">70% - 80% MHR</td>
                                    <td className="p-3">RPE 5–6 (Moderate Effort)</td>
                                    <td className="p-3">50% Fat / 50% Carbs</td>
                                    <td className="p-3">Cardiovascular efficiency, lung capacity & aerobic power.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-orange-600">Zone 4</td>
                                    <td className="p-3 font-semibold">80% - 90% MHR</td>
                                    <td className="p-3">RPE 7–8 (Hard Effort)</td>
                                    <td className="p-3">20% Fat / 80% Carbs</td>
                                    <td className="p-3">Lactate threshold buffering & high-intensity endurance.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-rose-600">Zone 5</td>
                                    <td className="p-3 font-semibold">90% - 100% MHR</td>
                                    <td className="p-3">RPE 9–10 (Maximal Sprint)</td>
                                    <td className="p-3">5% Fat / 95% Carbs</td>
                                    <td className="p-3">VO2 max expansion, peak velocity & neuromuscular power.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Training Distribution & Weekly Workout Design */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Weekly Heart Rate Zone Distribution Strategies (80/20 Rule)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To build optimal cardiovascular fitness without triggering chronic fatigue or injury, exercise physiologists recommend <strong>Polarized Training (the 80/20 Rule)</strong>:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" /> 80% Low-Intensity Training (Zones 1 & 2)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Approximately 80% of your weekly aerobic volume should be performed in Zone 1 and Zone 2. This low-intensity foundation stimulates mitochondrial biogenesis and capillary density while permitting muscular repair.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-rose-600" /> 20% High-Intensity Training (Zones 4 & 5)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The remaining 20% of weekly exercise should consist of high-intensity interval training (HIIT) or threshold workouts in Zones 4 and 5 to drive peak VO2 max improvements and anaerobic capacity.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Worked Case Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Target Heart Rate Zone Profile Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how resting heart rate directly adjusts target zone boundaries across different demographic profiles:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Profile A: Trained Female Runner</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Karvonen Method</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 30 Years | Female | Resting HR: 52 BPM</li>
                                <li><strong>Calculated Max HR:</strong> 187 BPM (Heart Rate Reserve: 135 BPM)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Target Zone Ranges:</li>
                                <li>• <strong>Zone 1 (Recovery):</strong> 120 - 133 BPM</li>
                                <li>• <strong>Zone 2 (Fat Burn / Base):</strong> 133 - 147 BPM</li>
                                <li>• <strong>Zone 3 (Aerobic Stamina):</strong> 147 - 160 BPM</li>
                                <li>• <strong>Zone 4 (Anaerobic Threshold):</strong> 160 - 174 BPM</li>
                                <li>• <strong>Zone 5 (VO2 Max Effort):</strong> 174 - 187 BPM</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Profile B: General Fitness Male</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Tanaka Formula</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Demographics:</strong> 42 Years | Male | Resting HR: 68 BPM</li>
                                <li><strong>Calculated Max HR:</strong> 179 BPM</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Target Zone Ranges:</li>
                                <li>• <strong>Zone 1 (Recovery):</strong> 90 - 107 BPM</li>
                                <li>• <strong>Zone 2 (Fat Burn / Base):</strong> 107 - 125 BPM</li>
                                <li>• <strong>Zone 3 (Aerobic Stamina):</strong> 125 - 143 BPM</li>
                                <li>• <strong>Zone 4 (Anaerobic Threshold):</strong> 143 - 161 BPM</li>
                                <li>• <strong>Zone 5 (VO2 Max Effort):</strong> 161 - 179 BPM</li>
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
                                What is the Karvonen formula and why is it preferred?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Karvonen formula factors in your resting heart rate (RHR) alongside your maximum heart rate (MHR) to calculate Heart Rate Reserve (HRR). This provides a significantly more personalized and accurate target zone structure compared to standard age-only formulas.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which heart rate zone is best for burning fat?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Zone 2 (60% to 70% of Max Heart Rate) is widely recognized as the optimal fat-burning zone. At this light intensity, the body predominantly metabolizes fatty acids rather than muscle glycogen for substrate energy.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I measure my resting heart rate accurately?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Measure your resting heart rate immediately upon waking in the morning while remaining lying in bed. Count your radial pulse for 60 seconds or use a calibrated wearable device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Tanaka and Haskell formulas?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The traditional Haskell & Fox formula (220 - age) often underestimates maximum heart rate in active adults over 40. The Tanaka formula (208 - 0.7 × age) was clinically derived to provide greater accuracy across age demographics.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Cardiac Drift and how does it affect heart rate training?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Cardiac drift refers to the progressive increase in heart rate during prolonged steady-state exercise despite maintaining a constant workload. It occurs due to dehydration and elevated body thermal core temperature, requiring minor workout pace adjustments during long sessions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Rate of Perceived Exertion (RPE) correlate with Heart Rate Zones?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                RPE is a subjective 1–10 scale measuring physical effort. Zone 1 matches RPE 1–2 (very easy), Zone 2 matches RPE 3–4 (comfortable light pace), Zone 3 matches RPE 5–6 (moderate effort), Zone 4 matches RPE 7–8 (hard/unsustainable), and Zone 5 matches RPE 9–10 (all-out sprint).
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