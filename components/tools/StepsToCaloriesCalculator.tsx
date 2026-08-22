"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Footprints,
    Flame,
    Navigation,
    Clock,
    Scale,
    Ruler,
    Zap,
    Heart,
    Target,
    Activity,
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
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    Layers,
    Timer,
    Compass,
    Gauge
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type PaceLevel = "slow" | "moderate" | "brisk" | "running";

interface Preset {
    id: string;
    label: string;
    steps: number;
    pace: PaceLevel;
    system: UnitSystem;
    weightLbs: number;
    weightKg: number;
    heightInches: number;
    heightCm: number;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "daily-sedentary", label: "Light Daily", steps: 4000, pace: "slow", system: "imperial", weightLbs: 165, weightKg: 75, heightInches: 68, heightCm: 173, tag: "4,000 Steps" },
    { id: "standard-goal", label: "Active 10k Goal", steps: 10000, pace: "moderate", system: "imperial", weightLbs: 175, weightKg: 79.5, heightInches: 70, heightCm: 178, tag: "10,000 Steps" },
    { id: "power-walker", label: "Brisk Commute", steps: 12500, pace: "brisk", system: "metric", weightLbs: 150, weightKg: 68, heightInches: 66, heightCm: 168, tag: "12,500 Steps" },
    { id: "high-endurance", label: "Endurance Runner", steps: 20000, pace: "running", system: "imperial", weightLbs: 160, weightKg: 72.5, heightInches: 71, heightCm: 180, tag: "20,000 Steps" },
];

interface PaceData {
    name: string;
    description: string;
    met: number; // Metabolic Equivalent of Task
    speedMph: number;
    speedKmh: number;
    cadenceSpm: number; // steps per minute
    strideFactor: number; // fraction of height
}

const PACE_CONFIG: Record<PaceLevel, PaceData> = {
    slow: {
        name: "Casual Stroll (< 2.5 mph)",
        description: "Relaxed window shopping or light office moving",
        met: 2.8,
        speedMph: 2.2,
        speedKmh: 3.5,
        cadenceSpm: 80,
        strideFactor: 0.413,
    },
    moderate: {
        name: "Moderate Walking (2.8 – 3.2 mph)",
        description: "Standard purposeful walking pace across level ground",
        met: 3.5,
        speedMph: 3.0,
        speedKmh: 4.8,
        cadenceSpm: 100,
        strideFactor: 0.415,
    },
    brisk: {
        name: "Brisk / Power Walk (3.5 – 4.2 mph)",
        description: "Elevated heart rate, fitness walking, slight arm swing",
        met: 4.5,
        speedMph: 3.8,
        speedKmh: 6.1,
        cadenceSpm: 125,
        strideFactor: 0.43,
    },
    running: {
        name: "Jogging / Running (5.5+ mph)",
        description: "Flight phase between steps, higher cardiovascular strain",
        met: 8.5,
        speedMph: 6.0,
        speedKmh: 9.6,
        cadenceSpm: 155,
        strideFactor: 0.48,
    },
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

export default function StepsToCaloriesCalculator() {
    // Unit System & Demographics
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [steps, setSteps] = useState<number>(10000);
    const [pace, setPace] = useState<PaceLevel>("moderate");

    // Height & Weight Inputs
    const [weightLbs, setWeightLbs] = useState<number>(170);
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);

    const [weightKg, setWeightKg] = useState<number>(77);
    const [heightCm, setHeightCm] = useState<number>(178);

    // Custom Stride Toggle
    const [isCustomStride, setIsCustomStride] = useState<boolean>(false);
    const [customStrideInches, setCustomStrideInches] = useState<number>(30);
    const [customStrideCm, setCustomStrideCm] = useState<number>(76);

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"metrics" | "breakdown">("metrics");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Convert inputs to metric standard internally
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

    // Calculate Stride Length in Meters
    const effectiveStrideMeters = useMemo(() => {
        if (isCustomStride) {
            if (unitSystem === "imperial") {
                return ((customStrideInches || 0) * 2.54) / 100;
            }
            return (customStrideCm || 0) / 100;
        }
        // Biometric Stride Length Estimation based on height and pace
        const paceConfig = PACE_CONFIG[pace];
        return effectiveHeightMeters * paceConfig.strideFactor;
    }, [isCustomStride, unitSystem, customStrideInches, customStrideCm, effectiveHeightMeters, pace]);

    // Primary Mathematical Outputs
    const results = useMemo(() => {
        const paceConfig = PACE_CONFIG[pace];
        const count = Math.max(0, steps);

        // 1. Total Distance
        const totalDistanceMeters = count * effectiveStrideMeters;
        const totalDistanceKm = totalDistanceMeters / 1000;
        const totalDistanceMiles = totalDistanceMeters / 1609.344;

        // 2. Active Time in Minutes & Hours
        const cadence = paceConfig.cadenceSpm;
        const totalMinutes = cadence > 0 ? count / cadence : 0;
        const totalHours = totalMinutes / 60;

        // 3. Calorie Burn Calculation (Compendium of Physical Activities MET Formula)
        // Energy Expenditure (kcal) = MET × weight_kg × duration_hours
        const burnedCalories = paceConfig.met * effectiveWeightKg * totalHours;

        // 4. Equivalent Metrics
        const caloriesPerStep = count > 0 ? burnedCalories / count : 0;
        const caloriesPerMile = totalDistanceMiles > 0 ? burnedCalories / totalDistanceMiles : 0;
        const caloriesPerKm = totalDistanceKm > 0 ? burnedCalories / totalDistanceKm : 0;
        const fatLossGrams = (burnedCalories / 7700) * 1000; // ~7700 kcal per kg of fat mass
        const fatLossLbs = burnedCalories / 3500; // ~3500 kcal per lb of fat mass

        return {
            distanceMiles: totalDistanceMiles,
            distanceKm: totalDistanceKm,
            calories: Math.round(burnedCalories),
            timeMinutes: Math.round(totalMinutes),
            timeHoursDecimal: totalHours,
            caloriesPerStep: caloriesPerStep,
            caloriesPerMile: Math.round(caloriesPerMile),
            caloriesPerKm: Math.round(caloriesPerKm),
            fatLossGrams: fatLossGrams,
            fatLossLbs: fatLossLbs,
            strideLengthDisplay: unitSystem === "imperial"
                ? `${(effectiveStrideMeters * 39.3701).toFixed(1)} in`
                : `${(effectiveStrideMeters * 100).toFixed(1)} cm`,
        };
    }, [steps, effectiveStrideMeters, pace, effectiveWeightKg, unitSystem]);

    // Handle Unit System Toggles
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            setHeightCm(Math.round(totalInches * 2.54));
            setWeightKg(Math.round((weightLbs || 0) * 0.453592));
            setCustomStrideCm(Math.round((customStrideInches || 0) * 2.54));
        } else {
            const totalInches = (heightCm || 0) / 2.54;
            setHeightFt(Math.floor(totalInches / 12));
            setHeightIn(Math.round(totalInches % 12));
            setWeightLbs(Math.round((weightKg || 0) * 2.20462));
            setCustomStrideInches(Math.round((customStrideCm || 0) / 2.54));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setUnitSystem(preset.system);
        setSteps(preset.steps);
        setPace(preset.pace);
        setIsCustomStride(false);

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
        setSteps(10000);
        setPace("moderate");
        setWeightLbs(170);
        setHeightFt(5);
        setHeightIn(10);
        setWeightKg(77);
        setHeightCm(178);
        setIsCustomStride(false);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial"
            ? `${heightFt}'${heightIn}"`
            : `${heightCm} cm`;
        const weightDisplay = unitSystem === "imperial"
            ? `${weightLbs} lbs`
            : `${weightKg} kg`;
        const distDisplay = unitSystem === "imperial"
            ? `${results.distanceMiles.toFixed(2)} Miles`
            : `${results.distanceKm.toFixed(2)} Kilometers`;

        const summaryText = `Daily Steps to Distance & Calories Summary (TwisterTools):
----------------------------------------
Total Steps: ${steps.toLocaleString()}
Pace Level: ${PACE_CONFIG[pace].name}
Body Specs: ${heightDisplay} / ${weightDisplay}
Calculated Stride: ${results.strideLengthDisplay}
----------------------------------------
Total Distance: ${distDisplay}
Calories Burned: ${results.calories.toLocaleString()} kcal
Active Walking Time: ${results.timeMinutes} minutes (~${results.timeHoursDecimal.toFixed(1)} hrs)
Burn Efficiency: ${results.caloriesPerMile} kcal/mile (${results.caloriesPerKm} kcal/km)
Potential Fat Oxidation: ~${results.fatLossLbs.toFixed(2)} lbs (~${Math.round(results.fatLossGrams)}g)
----------------------------------------
Calculated at twistertools.com/tools/calculators/steps-to-calories-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Calculated Value", "Measurement Unit"];
        const rows = [
            ["Daily Steps", `${steps}`, "Steps"],
            ["Total Distance (Miles)", results.distanceMiles.toFixed(3), "Miles"],
            ["Total Distance (Kilometers)", results.distanceKm.toFixed(3), "Kilometers"],
            ["Calorie Expenditure", `${results.calories}`, "kcal"],
            ["Estimated Active Duration", `${results.timeMinutes}`, "Minutes"],
            ["Estimated Stride Length", results.strideLengthDisplay, "Unit Stride"],
            ["Pace Category", PACE_CONFIG[pace].name, "MET Scale"],
            ["Burn Rate per Mile", `${results.caloriesPerMile}`, "kcal / mile"],
            ["Burn Rate per Km", `${results.caloriesPerKm}`, "kcal / km"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `steps_distance_calories_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Daily Steps to Distance, Miles & Calories Converter",
        "url": "https://twistertools.com/tools/calculators/steps-to-calories-calculator",
        "description": "Convert daily pedometer step counts into exact miles, kilometers, active walking duration, and burned calories using MET metabolic bio-energetics and dynamic stride calculation.",
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
                "name": "How many miles and kilometers is 10,000 steps?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For an average adult with a step length between 2.2 to 2.5 feet (0.67 to 0.76 meters), 10,000 steps equals approximately 4.5 to 5.0 miles, or roughly 7.2 to 8.0 kilometers."
                }
            },
            {
                "@type": "Question",
                "name": "How many calories are burned per 1,000 steps?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On average, a person burns between 30 and 50 calories per 1,000 steps. Caloric expenditure varies directly depending on body weight, walking pace, grade, and personal metabolic rate."
                }
            },
            {
                "@type": "Question",
                "name": "How does height affect distance calculated from steps?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Taller individuals have longer leg lengths and naturally larger stride lengths. A person measuring 6'2\" covers significantly more distance per step than someone measuring 5'2\", meaning fewer total steps are required to complete a mile."
                }
            },
            {
                "@type": "Question",
                "name": "What is the MET formula used for walking calorie calculation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The calculation relies on the clinical Compendium of Physical Activities formula: Calories Burned = MET × Body Weight in kg × Duration in Hours. Moderate walking corresponds to 3.5 METs, whereas brisk walking reaches 4.5 METs."
                }
            },
            {
                "@type": "Question",
                "name": "How do I accurately calculate my personal stride length?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Walk 10 measured steps in a straight line, measure the total distance in inches or centimeters with a tape measure, and divide the total by 10. Alternatively, multiplying your total height by 0.415 provides an accurate biological walking stride estimate."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Script Registrations */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Dual Workspace Interactive Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Step Parameters & Biometric Adjusters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Footprints className="w-5 h-5 text-indigo-600" />
                                Step & Body Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement Units
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
                                    Imperial (Miles, Lbs, Ft/In)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (Km, Kg, Cm)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Step Count Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Footprints className="w-3.5 h-3.5 text-indigo-600" /> Total Step Count
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-semibold lowercase">
                                        pedometer / fitness tracker
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="200000"
                                        value={steps === 0 ? "" : steps}
                                        onChange={(e) => { handleNumberInput(e, (val) => setSteps(Math.max(0, val))); setActivePresetId(null); }}
                                        className="w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-base bg-slate-50/50"
                                        placeholder="e.g. 10000"
                                    />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        steps
                                    </span>
                                </div>
                            </div>

                            {/* Pace / Cadence Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Gauge className="w-3.5 h-3.5 text-indigo-600" /> Walking Pace & Intensity
                                </label>
                                <select
                                    value={pace}
                                    onChange={(e) => { setPace(e.target.value as PaceLevel); setActivePresetId(null); }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="slow">Casual Stroll (&lt; 2.5 mph / 80 steps/min)</option>
                                    <option value="moderate">Moderate Walk (~3.0 mph / 100 steps/min)</option>
                                    <option value="brisk">Brisk Power Walk (~3.8 mph / 125 steps/min)</option>
                                    <option value="running">Jogging / Running (~6.0 mph / 155 steps/min)</option>
                                </select>
                            </div>

                            {/* Dynamic Height & Weight Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                {/* Weight */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5 text-indigo-600" /> Body Weight
                                    </label>
                                    {unitSystem === "imperial" ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="40"
                                                max="600"
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
                                                max="300"
                                                value={weightKg === 0 ? "" : weightKg}
                                                onChange={(e) => { handleNumberInput(e, (val) => setWeightKg(Math.max(0, val))); setActivePresetId(null); }}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                        </div>
                                    )}
                                </div>

                                {/* Height */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Ruler className="w-3.5 h-3.5 text-indigo-600" /> Stature / Height
                                    </label>
                                    {unitSystem === "imperial" ? (
                                        <div className="grid grid-cols-2 gap-2 min-w-0">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="3"
                                                    max="8"
                                                    value={heightFt === 0 ? "" : heightFt}
                                                    onChange={(e) => { handleNumberInput(e, (val) => setHeightFt(Math.max(0, val))); setActivePresetId(null); }}
                                                    className="w-full pl-2.5 pr-6 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="11"
                                                    value={heightIn === 0 ? "" : heightIn}
                                                    onChange={(e) => { handleNumberInput(e, (val) => setHeightIn(Math.max(0, Math.min(11, val)))); setActivePresetId(null); }}
                                                    className="w-full pl-2.5 pr-6 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">in</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="90"
                                                max="250"
                                                value={heightCm === 0 ? "" : heightCm}
                                                onChange={(e) => { handleNumberInput(e, (val) => setHeightCm(Math.max(0, val))); setActivePresetId(null); }}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Optional Custom Stride Override */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isCustomStride}
                                            onChange={(e) => setIsCustomStride(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                        />
                                        <span>Manual Custom Stride Override</span>
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        Auto: {results.strideLengthDisplay}
                                    </span>
                                </div>
                                {isCustomStride && (
                                    <div className="mt-2 relative">
                                        {unitSystem === "imperial" ? (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="12"
                                                    max="60"
                                                    value={customStrideInches === 0 ? "" : customStrideInches}
                                                    onChange={(e) => handleNumberInput(e, (val) => setCustomStrideInches(Math.max(0, val)))}
                                                    className="w-full pl-3 pr-14 py-2 rounded-xl border border-indigo-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-indigo-50/20"
                                                    placeholder="Custom stride length"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600">inches</span>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="30"
                                                    max="150"
                                                    value={customStrideCm === 0 ? "" : customStrideCm}
                                                    onChange={(e) => handleNumberInput(e, (val) => setCustomStrideCm(Math.max(0, val)))}
                                                    className="w-full pl-3 pr-14 py-2 rounded-xl border border-indigo-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-indigo-50/20"
                                                    placeholder="Custom stride length"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600">cm</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Benchmark Presets Toolbar */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Activity Presets
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

                {/* Right Panel: Distance, Calories, Time & Breakdown Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Output Calculations
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("metrics")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "metrics" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Milestones
                                </button>
                            </div>
                        </div>

                        {/* Dual Primary Hero Cards: Distance & Calories */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Distance Box */}
                            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                    <Navigation className="w-3.5 h-3.5" /> Total Distance
                                </span>
                                <div className="flex items-baseline gap-2 pt-1">
                                    <span className="text-3xl sm:text-4xl font-black text-indigo-950">
                                        {unitSystem === "imperial"
                                            ? results.distanceMiles.toFixed(2)
                                            : results.distanceKm.toFixed(2)}
                                    </span>
                                    <span className="text-sm font-bold text-indigo-700">
                                        {unitSystem === "imperial" ? "Miles" : "Km"}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 pt-1 font-medium">
                                    {unitSystem === "imperial"
                                        ? `(${results.distanceKm.toFixed(2)} Kilometers)`
                                        : `(${results.distanceMiles.toFixed(2)} Miles)`}
                                </p>
                            </div>

                            {/* Calories Burned Box */}
                            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                                    <Flame className="w-3.5 h-3.5" /> Energy Burned
                                </span>
                                <div className="flex items-baseline gap-2 pt-1">
                                    <span className="text-3xl sm:text-4xl font-black text-amber-950">
                                        {results.calories.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-amber-700">kcal</span>
                                </div>
                                <p className="text-[11px] text-slate-500 pt-1 font-medium">
                                    ~{results.caloriesPerMile} kcal/mi ({results.caloriesPerKm} kcal/km)
                                </p>
                            </div>
                        </div>

                        {/* Active Tab View */}
                        {activeTab === "metrics" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                                {/* Time Invested */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        Active Walking Time
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {results.timeMinutes} <span className="text-xs font-normal text-slate-500">minutes</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        ~{results.timeHoursDecimal.toFixed(1)} hrs at {PACE_CONFIG[pace].cadenceSpm} spm
                                    </p>
                                </div>

                                {/* Fat Oxidation Equivalent */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Target className="w-4 h-4 text-emerald-600" />
                                        Est. Fat Mass Equivalent
                                    </div>
                                    <p className="text-lg font-extrabold text-emerald-700 mt-1">
                                        {unitSystem === "imperial"
                                            ? `${results.fatLossLbs.toFixed(2)} lbs`
                                            : `${Math.round(results.fatLossGrams)} g`}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Based on caloric deficit standard
                                    </p>
                                </div>

                                {/* Calculated Stride Length */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Ruler className="w-4 h-4 text-indigo-600" />
                                        Effective Stride Length
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {results.strideLengthDisplay}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        {isCustomStride ? "Custom user value" : "Biometric height index"}
                                    </p>
                                </div>

                                {/* Caloric Burn Efficiency */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Zap className="w-4 h-4 text-indigo-600" />
                                        Per-Step Burn Rate
                                    </div>
                                    <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                        {(results.caloriesPerStep * 1000).toFixed(1)} <span className="text-xs font-normal text-slate-500">kcal / 1k</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        ~{results.caloriesPerStep.toFixed(3)} kcal per single step
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Step Milestones Schedule Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Milestone</th>
                                            <th className="p-2.5">Miles</th>
                                            <th className="p-2.5">Kilometers</th>
                                            <th className="p-2.5">Calories</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {[2500, 5000, 7500, 10000, 15000, 20000].map((milestone) => {
                                            const miles = (milestone * effectiveStrideMeters) / 1609.344;
                                            const km = (milestone * effectiveStrideMeters) / 1000;
                                            const hours = milestone / (PACE_CONFIG[pace].cadenceSpm * 60);
                                            const cal = Math.round(PACE_CONFIG[pace].met * effectiveWeightKg * hours);
                                            const isSelected = steps === milestone;

                                            return (
                                                <tr
                                                    key={milestone}
                                                    className={`transition ${isSelected ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 flex items-center gap-1.5">
                                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                        <span>{milestone.toLocaleString()} Steps</span>
                                                    </td>
                                                    <td className="p-2.5 text-slate-900">{miles.toFixed(2)} mi</td>
                                                    <td className="p-2.5 text-slate-900">{km.toFixed(2)} km</td>
                                                    <td className="p-2.5 text-indigo-600 font-bold">{cal} kcal</td>
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
                            Client-side computation
                        </span>
                        <span>Compendium MET Standard</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical & Fitness Disclaimer:</strong> Calorie expenditure and distance computations are physiological approximations derived from standardized MET equations and biometric height ratios. Individual metabolic rates, inclines, terrain variance, and resting heart rates will naturally alter actual metabolic expenditure. Always consult a qualified physician or exercise physiologist before initiating intense training regimens.
                </p>
            </div>

            {/* BELOW-THE-FOLD THOROUGH CONTENT & SEO CARDS */}
            <div className="space-y-6">

                {/* Card 1: Walking Bio-Energetics, MET Formulas & Stride Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Step Conversion: Stride Lengths, Cadence & MET Equations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting daily pedometer steps into precise distance and calorie burn requires integrating individual anthropometry (height and weight) with bio-energetic movement principles. Rather than applying generic static multipliers, this engine computes mechanical stride displacement and metabolic cost using the clinical <em>Compendium of Physical Activities</em>.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-indigo-600" /> Biometric Stride Estimation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Stride length directly correlates with leg inseam and total stature. On level ground, average walking stride measures approximately 41.5% of standing height (Height × 0.415). At faster speeds or running gaits, stride factor widens up to 48% due to longer aerial push-off.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> MET-Based Calorie Bio-Energetics
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                One Metabolic Equivalent of Task (1.0 MET) equals the resting energy consumed sitting quietly (1 kcal/kg/hour). Walking at a moderate 3.0 mph pace consumes 3.5 METs, scaling directly with body mass and cadence.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Display Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Physical Conversion Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            Mathematical formulation executing client-side inside this converter:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Stride Length (m):</strong> Stature(m) × Pace_Stride_Factor (Casual: 0.413, Mod: 0.415, Brisk: 0.430, Run: 0.480)</div>
                            <div><strong>2. Distance (Miles):</strong> (Step_Count × Stride_Length_Meters) / 1609.344</div>
                            <div><strong>3. Distance (Kilometers):</strong> (Step_Count × Stride_Length_Meters) / 1000</div>
                            <div><strong>4. Duration (Hours):</strong> Step_Count / (Cadence_Steps_Per_Minute × 60)</div>
                            <div><strong>5. Calories (kcal):</strong> MET × Body_Weight(kg) × Duration(Hours)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Reference Milestone & Speed Comparison Tables */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step Milestones, Cadence & Energy Burn Matrices
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to the structured matrices below to evaluate step benchmarks against distance and estimated caloric burn for an average 170 lb (77 kg) adult:
                    </p>

                    {/* Table 1: Standard Step Count Milestones */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Daily Step Milestones (170 lbs / 5'10" Individual at Moderate Pace)
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Step Count</th>
                                        <th className="p-3">Distance (Miles)</th>
                                        <th className="p-3">Distance (Km)</th>
                                        <th className="p-3">Active Time</th>
                                        <th className="p-3">Calories Burned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">2,500 Steps</td>
                                        <td className="p-3">1.15 mi</td>
                                        <td className="p-3">1.85 km</td>
                                        <td className="p-3">25 mins</td>
                                        <td className="p-3 font-semibold text-indigo-600">112 kcal</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">5,000 Steps</td>
                                        <td className="p-3">2.30 mi</td>
                                        <td className="p-3">3.69 km</td>
                                        <td className="p-3">50 mins</td>
                                        <td className="p-3 font-semibold text-indigo-600">225 kcal</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">7,500 Steps</td>
                                        <td className="p-3">3.44 mi</td>
                                        <td className="p-3">5.54 km</td>
                                        <td className="p-3">75 mins</td>
                                        <td className="p-3 font-semibold text-indigo-600">337 kcal</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                        <td className="p-3 font-bold text-indigo-700">10,000 Steps (Standard)</td>
                                        <td className="p-3 font-bold text-slate-900">4.59 mi</td>
                                        <td className="p-3 font-bold text-slate-900">7.39 km</td>
                                        <td className="p-3 font-bold">100 mins</td>
                                        <td className="p-3 font-extrabold text-indigo-700">449 kcal</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">12,500 Steps</td>
                                        <td className="p-3">5.74 mi</td>
                                        <td className="p-3">9.24 km</td>
                                        <td className="p-3">125 mins</td>
                                        <td className="p-3 font-semibold text-indigo-600">562 kcal</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">15,000 Steps</td>
                                        <td className="p-3">6.89 mi</td>
                                        <td className="p-3">11.08 km</td>
                                        <td className="p-3">150 mins</td>
                                        <td className="p-3 font-semibold text-indigo-600">674 kcal</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 2: Walking Intensity & Speed Classification */}
                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Pace Intensity & Metabolic Equivalent (MET) Breakdown
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Pace Level</th>
                                        <th className="p-3">Speed (mph / km/h)</th>
                                        <th className="p-3">Cadence (Steps/min)</th>
                                        <th className="p-3">MET Rating</th>
                                        <th className="p-3">Relative Burn Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Casual Strolling</td>
                                        <td className="p-3">&lt; 2.5 mph (3.5 km/h)</td>
                                        <td className="p-3">70 – 85 spm</td>
                                        <td className="p-3 font-semibold">2.8 METs</td>
                                        <td className="p-3 text-slate-600">Base active burn</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Moderate Walking</td>
                                        <td className="p-3">2.8 – 3.2 mph (4.8 km/h)</td>
                                        <td className="p-3">95 – 105 spm</td>
                                        <td className="p-3 font-semibold text-indigo-600">3.5 METs</td>
                                        <td className="p-3 text-slate-600">+25% above casual</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Brisk / Power Walk</td>
                                        <td className="p-3">3.5 – 4.2 mph (6.1 km/h)</td>
                                        <td className="p-3">120 – 130 spm</td>
                                        <td className="p-3 font-semibold text-indigo-600">4.5 METs</td>
                                        <td className="p-3 text-slate-600">+60% above casual</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Jogging / Running</td>
                                        <td className="p-3">5.5 – 6.5 mph (9.6 km/h)</td>
                                        <td className="p-3">150 – 165 spm</td>
                                        <td className="p-3 font-semibold text-amber-600">8.5 METs</td>
                                        <td className="p-3 text-slate-600">+200% above casual</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Worked Practical Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Target className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Step Transformation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To illustrate how body composition and pacing influence total distance and energy output, review these practical examples:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Urban Commuter</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Imperial Profile</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>User Profile:</strong> 185 lbs | 6'0" (72 in) | Moderate Pace (3.0 mph)</li>
                                <li><strong>Daily Step Count:</strong> 8,500 Steps</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Computed Output:</li>
                                <li>• <strong>Calculated Stride:</strong> 29.9 inches (0.76 m)</li>
                                <li>• <strong>Total Distance:</strong> 4.01 Miles (6.46 km)</li>
                                <li>• <strong>Active Walking Time:</strong> 85 Minutes</li>
                                <li>• <strong>Caloric Burn:</strong> 416 kcal (103 kcal/mile)</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Brisk Morning Walker</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric Profile</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>User Profile:</strong> 62 kg | 165 cm | Brisk Pace (3.8 mph)</li>
                                <li><strong>Daily Step Count:</strong> 12,000 Steps</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Computed Output:</li>
                                <li>• <strong>Calculated Stride:</strong> 71.0 cm (27.9 inches)</li>
                                <li>• <strong>Total Distance:</strong> 8.51 Kilometers (5.29 Miles)</li>
                                <li>• <strong>Active Walking Time:</strong> 96 Minutes</li>
                                <li>• <strong>Caloric Burn:</strong> 446 kcal (52 kcal/km)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Actionable Daily Walking Strategies & NEAT Optimization */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Maximizing NEAT & Cardiovascular Health Through Daily Steps
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Non-Exercise Activity Thermogenesis (NEAT) represents the energy expended for everything we do that is not sleeping, eating, or formal sports exercise. Consistent daily walking serves as the foundation of sustainable metabolic health:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Post-Meal Walking</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A 10-to-15 minute walk (approx. 1,200–1,800 steps) immediately following meals significantly blunts postprandial blood glucose spikes and improves insulin sensitivity.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Joint-Friendly Fat Burn</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Walking maintains a low systemic cortisol response while preserving joint cartilage and connective tissue integrity compared to high-impact running routines.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Step Accumulation Blocks</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Breaking daily goals into three manageable 20-minute walking sessions (approx. 2,500 steps each) makes achieving 8,000–10,000 steps effortless throughout busy workdays.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static Border-Highlighted FAQ Section */}
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
                                How many miles and kilometers is 10,000 steps?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For an individual with an average stride length between 2.2 and 2.5 feet, 10,000 steps converts to approximately 4.5 to 5.0 miles (7.2 to 8.0 kilometers). Taller individuals will cover slightly more distance, whereas shorter individuals will cover slightly less.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many calories do I burn for every 1,000 steps?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                On average, walking burns between 30 and 50 calories per 1,000 steps. A 140-lb person burns around 35 kcal per 1k steps, whereas a 200-lb person burns roughly 50 kcal per 1k steps at a moderate walking pace.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does walking speed impact total calories burned?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Faster walking increases the Metabolic Equivalent of Task (MET). While strolling casually at 2.0 mph burns around 2.8 METs, power walking briskly at 3.8 mph burns 4.5 METs, increasing calorie expenditure per minute by over 60%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I manually measure my exact stride length?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To measure your precise stride length, mark a starting line on the ground, walk 10 natural steps forward, and mark where your 10th step lands. Measure the total distance with a tape measure and divide by 10. Enter that number in the custom stride input for maximum accuracy.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is 10,000 steps necessary for optimal health?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Recent epidemiological studies indicate that the sharpest reductions in all-cause mortality occur between 7,500 and 8,500 daily steps. While 10,000 steps remains an excellent target for cardiovascular fitness and weight management, substantial health benefits begin at just 6,000 daily steps.
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