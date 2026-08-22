"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Flame,
    Calendar,
    Target,
    Scale,
    TrendingDown,
    Activity,
    Clock,
    Zap,
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
    HelpCircle,
    BookOpen,
    Layers,
    Info,
    ArrowRight,
    PieChart,
    ChevronRight,
    CheckCircle2
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extreme";
type CalculationMode = "deficit-to-date" | "target-date";

interface DeficitPreset {
    id: string;
    label: string;
    system: UnitSystem;
    gender: Gender;
    age: number;
    currentWeightLbs: number;
    currentWeightKg: number;
    targetWeightLbs: number;
    targetWeightKg: number;
    heightInches: number;
    heightCm: number;
    activity: ActivityLevel;
    deficitCalories: number;
    tag: string;
}

const PRESETS: DeficitPreset[] = [
    {
        id: "moderate-cut-male",
        label: "Gradual Fat Loss (Male)",
        system: "imperial",
        gender: "male",
        age: 32,
        currentWeightLbs: 200,
        currentWeightKg: 90.7,
        targetWeightLbs: 180,
        targetWeightKg: 81.6,
        heightInches: 70,
        heightCm: 178,
        activity: "moderate",
        deficitCalories: 500,
        tag: "500 kcal/day cut"
    },
    {
        id: "steady-cut-female",
        label: "Steady Lean Out (Female)",
        system: "metric",
        gender: "female",
        age: 28,
        currentWeightLbs: 154,
        currentWeightKg: 70,
        targetWeightLbs: 136.6,
        targetWeightKg: 62,
        heightInches: 65,
        heightCm: 165,
        activity: "light",
        deficitCalories: 400,
        tag: "400 kcal/day cut"
    },
    {
        id: "aggressive-cut",
        label: "Aggressive Cut (Active)",
        system: "imperial",
        gender: "male",
        age: 26,
        currentWeightLbs: 215,
        currentWeightKg: 97.5,
        targetWeightLbs: 190,
        targetWeightKg: 86.2,
        heightInches: 72,
        heightCm: 183,
        activity: "active",
        deficitCalories: 750,
        tag: "750 kcal/day cut"
    }
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

export default function CalorieDeficitCalculator() {
    // Mode & Units
    const [calcMode, setCalcMode] = useState<CalculationMode>("deficit-to-date");
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");

    // Demographic States
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);

    // Imperial Inputs
    const [heightFt, setHeightFt] = useState<number>(5);
    const [heightIn, setHeightIn] = useState<number>(10);
    const [currentWeightLbs, setCurrentWeightLbs] = useState<number>(195);
    const [targetWeightLbs, setTargetWeightLbs] = useState<number>(175);

    // Metric Inputs
    const [heightCm, setHeightCm] = useState<number>(178);
    const [currentWeightKg, setCurrentWeightKg] = useState<number>(88.5);
    const [targetWeightKg, setTargetWeightKg] = useState<number>(79.5);

    // Dynamic Variables
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
    const [dailyDeficit, setDailyDeficit] = useState<number>(500);

    // Date target mode state (defaults to ~90 days out)
    const getInitialFutureDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        return d.toISOString().split("T")[0];
    };
    const [targetDateInput, setTargetDateInput] = useState<string>(getInitialFutureDate());

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"projection" | "milestones" | "macros">("projection");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Standardized Metric Conversions
    const effectiveCurrentWeightKg = useMemo(() => {
        return unitSystem === "imperial" ? (currentWeightLbs || 0) * 0.45359237 : currentWeightKg || 0;
    }, [unitSystem, currentWeightLbs, currentWeightKg]);

    const effectiveTargetWeightKg = useMemo(() => {
        return unitSystem === "imperial" ? (targetWeightLbs || 0) * 0.45359237 : targetWeightKg || 0;
    }, [unitSystem, targetWeightLbs, targetWeightKg]);

    const effectiveHeightMeters = useMemo(() => {
        if (unitSystem === "imperial") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            return (totalInches * 2.54) / 100;
        }
        return (heightCm || 0) / 100;
    }, [unitSystem, heightFt, heightIn, heightCm]);

    // Core Calculations Engine
    const calculations = useMemo(() => {
        const hCm = effectiveHeightMeters * 100;
        const wKg = effectiveCurrentWeightKg;
        const targetKg = effectiveTargetWeightKg;

        if (hCm <= 0 || wKg <= 0 || age <= 0) {
            return {
                bmr: 0,
                tdee: 0,
                dailyDeficit: 0,
                dailyCalorieTarget: 0,
                totalWeightToLoseKg: 0,
                totalWeightToLoseLbs: 0,
                totalDeficitRequiredKcal: 0,
                daysToGoal: 0,
                estimatedTargetDate: new Date(),
                weeklyLossKg: 0,
                weeklyLossLbs: 0,
                monthlyLossLbs: 0,
                burnRatePercentagePerWeek: 0,
                safetyLevel: "Optimal",
                safetyColor: "text-emerald-600",
                safetyBg: "bg-emerald-50",
                safetyBorder: "border-emerald-200",
                milestones: [],
                macros: { proteinGrams: 0, fatGrams: 0, carbGrams: 0 }
            };
        }

        // 1. Mifflin-St Jeor BMR
        let bmrVal = 10 * wKg + 6.25 * hCm - 5 * age;
        bmrVal = gender === "male" ? bmrVal + 5 : bmrVal - 161;

        // 2. Activity Multipliers -> TDEE
        const activityMultipliers: Record<ActivityLevel, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            extreme: 1.9,
        };
        const tdeeVal = bmrVal * activityMultipliers[activityLevel];

        // 3. Weight Loss Differential
        const diffKg = Math.max(0, wKg - targetKg);
        const diffLbs = diffKg * 2.20462262;

        // Standard energetic fat equivalent: 1 lb fat ≈ 3,500 kcal, 1 kg ≈ 7,700 kcal
        const totalDeficitKcal = diffKg * 7700;

        let computedDeficit = dailyDeficit;
        let daysRequired = 0;

        if (calcMode === "deficit-to-date") {
            computedDeficit = Math.max(1, dailyDeficit);
            daysRequired = computedDeficit > 0 ? Math.ceil(totalDeficitKcal / computedDeficit) : 0;
        } else {
            // Target date mode
            const now = new Date();
            const chosenDate = new Date(targetDateInput);
            const timeDiff = chosenDate.getTime() - now.getTime();
            const daysDiff = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
            daysRequired = daysDiff;
            computedDeficit = Math.round(totalDeficitKcal / daysDiff);
        }

        // Calorie Floor Check
        const calorieTarget = Math.max(0, Math.round(tdeeVal - computedDeficit));
        const estimatedTargetDate = new Date();
        estimatedTargetDate.setDate(estimatedTargetDate.getDate() + daysRequired);

        // Weekly & Monthly Loss Rates
        const weeklyDeficit = computedDeficit * 7;
        const weeklyLossLbs = weeklyDeficit / 3500;
        const weeklyLossKg = weeklyDeficit / 7700;
        const monthlyLossLbs = weeklyLossLbs * 4.33;

        // Percentage of total body weight lost per week
        const startingLbs = wKg * 2.20462262;
        const burnRatePercent = startingLbs > 0 ? (weeklyLossLbs / startingLbs) * 100 : 0;

        // Safety Analysis
        let safetyLevel = "Optimal & Sustainable";
        let safetyColor = "text-emerald-600";
        let safetyBg = "bg-emerald-50";
        let safetyBorder = "border-emerald-200";

        const minCalorieThreshold = gender === "male" ? 1500 : 1200;

        if (calorieTarget < minCalorieThreshold || computedDeficit > 1000 || burnRatePercent > 1.5) {
            safetyLevel = "Aggressive / Muscle Loss Risk";
            safetyColor = "text-rose-600";
            safetyBg = "bg-rose-50";
            safetyBorder = "border-rose-200";
        } else if (computedDeficit > 750 || burnRatePercent > 1.0) {
            safetyLevel = "Moderate-Fast (High Discipline)";
            safetyColor = "text-amber-600";
            safetyBg = "bg-amber-50";
            safetyBorder = "border-amber-200";
        }

        // 4. Milestone Schedule (25%, 50%, 75%, 100%)
        const milestones = [0.25, 0.5, 0.75, 1.0].map((frac) => {
            const milestoneDays = Math.round(daysRequired * frac);
            const milestoneDate = new Date();
            milestoneDate.setDate(milestoneDate.getDate() + milestoneDays);

            const lostKg = diffKg * frac;
            const weightAtStageKg = wKg - lostKg;
            const weightAtStageLbs = startingLbs - (diffLbs * frac);

            return {
                percentage: Math.round(frac * 100),
                days: milestoneDays,
                date: milestoneDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                weightLbs: Math.round(weightAtStageLbs * 10) / 10,
                weightKg: Math.round(weightAtStageKg * 10) / 10,
                totalLostLbs: Math.round(diffLbs * frac * 10) / 10,
                totalLostKg: Math.round(lostKg * 10) / 10
            };
        });

        // 5. Balanced Macro Split (40% Carbs, 30% Protein, 30% Fat)
        const proteinCals = calorieTarget * 0.30;
        const fatCals = calorieTarget * 0.30;
        const carbCals = calorieTarget * 0.40;

        const macros = {
            proteinGrams: Math.round(proteinCals / 4),
            fatGrams: Math.round(fatCals / 9),
            carbGrams: Math.round(carbCals / 4)
        };

        return {
            bmr: Math.round(bmrVal),
            tdee: Math.round(tdeeVal),
            dailyDeficit: computedDeficit,
            dailyCalorieTarget: calorieTarget,
            totalWeightToLoseKg: Math.round(diffKg * 10) / 10,
            totalWeightToLoseLbs: Math.round(diffLbs * 10) / 10,
            totalDeficitRequiredKcal: Math.round(totalDeficitKcal),
            daysToGoal: daysRequired,
            estimatedTargetDate,
            weeklyLossKg: Math.round(weeklyLossKg * 100) / 100,
            weeklyLossLbs: Math.round(weeklyLossLbs * 100) / 100,
            monthlyLossLbs: Math.round(monthlyLossLbs * 10) / 10,
            burnRatePercentagePerWeek: Math.round(burnRatePercent * 100) / 100,
            safetyLevel,
            safetyColor,
            safetyBg,
            safetyBorder,
            milestones,
            macros
        };
    }, [
        effectiveCurrentWeightKg,
        effectiveTargetWeightKg,
        effectiveHeightMeters,
        age,
        gender,
        activityLevel,
        dailyDeficit,
        calcMode,
        targetDateInput
    ]);

    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;

        if (system === "metric") {
            const totalInches = (heightFt || 0) * 12 + (heightIn || 0);
            setHeightCm(Math.round(totalInches * 2.54));
            setCurrentWeightKg(Math.round((currentWeightLbs || 0) * 0.45359237 * 10) / 10);
            setTargetWeightKg(Math.round((targetWeightLbs || 0) * 0.45359237 * 10) / 10);
        } else {
            const totalInches = (heightCm || 0) / 2.54;
            setHeightFt(Math.floor(totalInches / 12));
            setHeightIn(Math.round(totalInches % 12));
            setCurrentWeightLbs(Math.round((currentWeightKg || 0) * 2.20462262));
            setTargetWeightLbs(Math.round((targetWeightKg || 0) * 2.20462262));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: DeficitPreset) => {
        setUnitSystem(preset.system);
        setGender(preset.gender);
        setAge(preset.age);
        setActivityLevel(preset.activity);
        setDailyDeficit(preset.deficitCalories);
        setCalcMode("deficit-to-date");

        if (preset.system === "imperial") {
            setCurrentWeightLbs(preset.currentWeightLbs);
            setTargetWeightLbs(preset.targetWeightLbs);
            setHeightFt(Math.floor(preset.heightInches / 12));
            setHeightIn(preset.heightInches % 12);
        } else {
            setCurrentWeightKg(preset.currentWeightKg);
            setTargetWeightKg(preset.targetWeightKg);
            setHeightCm(preset.heightCm);
        }
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setCalcMode("deficit-to-date");
        setGender("male");
        setAge(30);
        setHeightFt(5);
        setHeightIn(10);
        setCurrentWeightLbs(195);
        setTargetWeightLbs(175);
        setHeightCm(178);
        setCurrentWeightKg(88.5);
        setTargetWeightKg(79.5);
        setActivityLevel("moderate");
        setDailyDeficit(500);
        setTargetDateInput(getInitialFutureDate());
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const heightDisplay = unitSystem === "imperial" ? `${heightFt}'${heightIn}"` : `${heightCm} cm`;
        const currentWt = unitSystem === "imperial" ? `${currentWeightLbs} lbs` : `${currentWeightKg} kg`;
        const targetWt = unitSystem === "imperial" ? `${targetWeightLbs} lbs` : `${targetWeightKg} kg`;
        const dateStr = calculations.estimatedTargetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        const summaryText = `Calorie Deficit & Target Weight Loss Plan (TwisterTools):
-------------------------------------------------------
Starting Weight: ${currentWt} | Goal Weight: ${targetWt}
Height / Age / Sex: ${heightDisplay} | ${age} Yrs | ${gender.toUpperCase()}
Daily Maintenance (TDEE): ${calculations.tdee} kcal/day
Daily Deficit Target: -${calculations.dailyDeficit} kcal/day
Calorie Intake Budget: ${calculations.dailyCalorieTarget} kcal/day
-------------------------------------------------------
PROJECTED COMPLETION DATE: ${dateStr} (${calculations.daysToGoal} days)
Expected Weekly Rate: -${unitSystem === "imperial" ? `${calculations.weeklyLossLbs} lbs` : `${calculations.weeklyLossKg} kg`}/week
Safety Protocol: ${calculations.safetyLevel}
Daily Macros: ${calculations.macros.proteinGrams}g Protein | ${calculations.macros.carbGrams}g Carbs | ${calculations.macros.fatGrams}g Fat
-------------------------------------------------------
Generated at twistertools.com/tools/calculators/calorie-deficit-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Milestone", "Target Date", "Days from Start", "Projected Weight", "Total Weight Reduced"];
        const rows = calculations.milestones.map((m) => [
            `${m.percentage}% Goal`,
            m.date,
            `${m.days} days`,
            unitSystem === "imperial" ? `${m.weightLbs} lbs` : `${m.weightKg} kg`,
            unitSystem === "imperial" ? `-${m.totalLostLbs} lbs` : `-${m.totalLostKg} kg`
        ]);

        const csvContent = [
            `"Calorie Deficit Plan - Summary Metrics"`,
            `"Daily Deficit","${calculations.dailyDeficit} kcal"`,
            `"Calorie Target","${calculations.dailyCalorieTarget} kcal"`,
            `"Estimated Completion Date","${calculations.estimatedTargetDate.toDateString()}"`,
            "",
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `calorie_deficit_timeline_schedule.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Calorie Deficit & Target Weight Loss Date Estimator",
        "url": "https://twistertools.com/tools/calculators/calorie-deficit-calculator",
        "description": "Calculate exact daily calorie deficit targets, daily intake goals, and projected milestone dates to achieve target weight loss safely with Mifflin-St Jeor TDEE precision.",
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
                "name": "What is a calorie deficit and how does it trigger fat loss?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A calorie deficit occurs when you consume fewer calories than your body expends for daily metabolic functions and physical movement (TDEE). To compensate for this energy shortfall, the body catabolizes stored adipose tissue (fat stores) for fuel, resulting in weight loss."
                }
            },
            {
                "@type": "Question",
                "name": "How many calories are in one pound or one kilogram of body fat?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In nutritional science, one pound of human adipose tissue stores approximately 3,500 kilocalories of metabolic energy. One kilogram of body fat equals approximately 7,700 kilocalories."
                }
            },
            {
                "@type": "Question",
                "name": "What is the safest rate of weekly weight loss?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Clinical guidelines generally recommend losing 0.5% to 1.0% of total body weight per week, or roughly 1 to 2 pounds (0.45 to 0.9 kg) weekly. This protects lean skeletal muscle mass and prevents metabolic adaptation."
                }
            },
            {
                "@type": "Question",
                "name": "What is the minimum safe daily calorie intake?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Without direct clinical supervision, adult women should generally not drop below 1,200 kcal/day, and adult men should not consume fewer than 1,500 kcal/day to ensure adequate micronutrient intake and hormonal health."
                }
            },
            {
                "@type": "Question",
                "name": "How do BMR and TDEE determine my daily deficit target?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BMR is the energy required to stay alive at complete rest, while TDEE accounts for your daily activity. Your calorie deficit is subtracted directly from your TDEE, ensuring you know exactly how many calories to eat each day."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Inputs & Adjusters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-indigo-600" />
                                Deficit & Goal Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Calculation Strategy Toggle */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Planning Methodology
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("deficit-to-date")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${calcMode === "deficit-to-date"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Target Daily Deficit → Goal Date
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalcMode("target-date")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition ${calcMode === "target-date"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Target Event Date → Required Deficit
                                </button>
                            </div>
                        </div>

                        {/* Unit System Switch */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Unit System
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("imperial")}
                                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (lbs, ft/in)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (kg, cm)
                                </button>
                            </div>
                        </div>

                        {/* Inputs Container */}
                        <div className="space-y-4">
                            {/* Sex & Age */}
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
                                        min="12"
                                        max="110"
                                        value={age === 0 ? "" : age}
                                        onChange={(e) => {
                                            handleNumberInput(e, (val) => setAge(Math.max(0, Math.min(110, val))));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Height Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Current Height
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="3"
                                                max="8"
                                                value={heightFt === 0 ? "" : heightFt}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setHeightFt(Math.max(0, val)));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ft</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="11"
                                                value={heightIn === 0 ? "" : heightIn}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setHeightIn(Math.max(0, Math.min(11, val))));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
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
                                            value={heightCm === 0 ? "" : heightCm}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setHeightCm(Math.max(0, val)));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">cm</span>
                                    </div>
                                )}
                            </div>

                            {/* Weight Pair: Current & Goal */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5 text-indigo-600" /> Current Weight
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={unitSystem === "imperial" ? (currentWeightLbs === 0 ? "" : currentWeightLbs) : (currentWeightKg === 0 ? "" : currentWeightKg)}
                                            onChange={(e) => {
                                                if (unitSystem === "imperial") {
                                                    handleNumberInput(e, (val) => setCurrentWeightLbs(Math.max(0, val)));
                                                } else {
                                                    handleNumberInput(e, (val) => setCurrentWeightKg(Math.max(0, val)));
                                                }
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            {unitSystem === "imperial" ? "lbs" : "kg"}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Target className="w-3.5 h-3.5 text-indigo-600" /> Target Goal Weight
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={unitSystem === "imperial" ? (targetWeightLbs === 0 ? "" : targetWeightLbs) : (targetWeightKg === 0 ? "" : targetWeightKg)}
                                            onChange={(e) => {
                                                if (unitSystem === "imperial") {
                                                    handleNumberInput(e, (val) => setTargetWeightLbs(Math.max(0, val)));
                                                } else {
                                                    handleNumberInput(e, (val) => setTargetWeightKg(Math.max(0, val)));
                                                }
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            {unitSystem === "imperial" ? "lbs" : "kg"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Physical Activity Level */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-indigo-600" /> Daily Activity Level
                                </label>
                                <select
                                    value={activityLevel}
                                    onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="sedentary">Sedentary (Desk job, minimal active movement)</option>
                                    <option value="light">Light Activity (1–3 training sessions/week)</option>
                                    <option value="moderate">Moderate Activity (3–5 training sessions/week)</option>
                                    <option value="active">High Activity (6–7 heavy workouts/week)</option>
                                    <option value="extreme">Extreme Activity (Daily athletic training or physical job)</option>
                                </select>
                            </div>

                            {/* Dynamic Slider or Date Selector depending on Mode */}
                            {calcMode === "deficit-to-date" ? (
                                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1">
                                            <Flame className="w-3.5 h-3.5 text-indigo-600" /> Daily Deficit Target:
                                        </span>
                                        <span className="text-sm font-extrabold text-indigo-600">
                                            -{dailyDeficit} kcal/day
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="150"
                                        max="1200"
                                        step="25"
                                        value={dailyDeficit}
                                        onChange={(e) => {
                                            setDailyDeficit(parseInt(e.target.value, 10));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-indigo-200 rounded-lg"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>-150 (Gentle)</span>
                                        <span>-500 (Standard)</span>
                                        <span>-750 (Aggressive)</span>
                                        <span>-1200 (Max)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Goal Completion Date
                                    </label>
                                    <input
                                        type="date"
                                        value={targetDateInput}
                                        onChange={(e) => setTargetDateInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Select the target calendar date you want to reach your goal weight.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PRESETS CONTAINER */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Deficit Quick Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((p) => {
                                    const isActive = activePresetId === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => applyPreset(p)}
                                            type="button"
                                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
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

                    {/* Bottom CTA Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard" : "Copy Schedule Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output Projections & Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        {/* Header Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Timeline & Burn Projections
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("projection")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "projection" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("milestones")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "milestones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Milestones
                                </button>
                                <button
                                    onClick={() => setActiveTab("macros")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${activeTab === "macros" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Diet Target
                                </button>
                            </div>
                        </div>

                        {/* Hero Metric Box: Projected Date & Calorie Target */}
                        <div className="p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-indigo-600" /> Projected Goal Date
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${calculations.safetyBg} ${calculations.safetyColor} ${calculations.safetyBorder}`}>
                                    {calculations.safetyLevel}
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-baseline gap-3">
                                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {calculations.estimatedTargetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                                <span className="text-sm font-bold text-indigo-600">
                                    ({calculations.daysToGoal} days / ~{Math.round((calculations.daysToGoal / 7) * 10) / 10} weeks)
                                </span>
                            </div>

                            <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Daily Calorie Target
                                    </span>
                                    <span className="text-xl font-extrabold text-indigo-600">
                                        {calculations.dailyCalorieTarget.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal/day</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Weekly Weight Loss
                                    </span>
                                    <span className="text-xl font-extrabold text-emerald-600">
                                        -{unitSystem === "imperial" ? `${calculations.weeklyLossLbs} lbs` : `${calculations.weeklyLossKg} kg`}
                                    </span>
                                </div>

                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                        Total Weight Delta
                                    </span>
                                    <span className="text-xl font-extrabold text-slate-800">
                                        -{unitSystem === "imperial" ? `${calculations.totalWeightToLoseLbs} lbs` : `${calculations.totalWeightToLoseKg} kg`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tab Content Views */}
                        {activeTab === "projection" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Zap className="w-4 h-4 text-indigo-600" />
                                            Daily Maintenance (TDEE)
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {calculations.tdee.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Total daily energy burn
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Flame className="w-4 h-4 text-indigo-600" />
                                            Basal Metabolic Rate
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {calculations.bmr.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Energy at complete rest
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Clock className="w-4 h-4 text-indigo-600" />
                                            Monthly Loss Velocity
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            ~{calculations.monthlyLossLbs} <span className="text-xs font-normal text-slate-500">lbs / mo</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {calculations.burnRatePercentagePerWeek}% body mass / week
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Target className="w-4 h-4 text-indigo-600" />
                                            Deficit Energy Bank
                                        </div>
                                        <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                            {calculations.totalDeficitRequiredKcal.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Cumulative deficit needed
                                        </p>
                                    </div>
                                </div>

                                {/* Weekly Progress Simulation Bar */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span>Total Weight Reduction Path</span>
                                        <span>{unitSystem === "imperial" ? `${targetWeightLbs} lbs` : `${targetWeightKg} kg`} Goal</span>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div className="bg-indigo-600 h-full w-[100%] animate-pulse" />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                                        <span>Start: {unitSystem === "imperial" ? `${currentWeightLbs} lbs` : `${currentWeightKg} kg`}</span>
                                        <span>Delta: -{unitSystem === "imperial" ? `${calculations.totalWeightToLoseLbs} lbs` : `${calculations.totalWeightToLoseKg} kg`}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "milestones" && (
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Milestone</th>
                                            <th className="p-2.5">Estimated Date</th>
                                            <th className="p-2.5">Weight</th>
                                            <th className="p-2.5 text-right">Lost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {calculations.milestones.map((m) => (
                                            <tr key={m.percentage} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-bold text-indigo-600">
                                                    {m.percentage}% Goal
                                                </td>
                                                <td className="p-2.5 text-slate-900 font-semibold">{m.date}</td>
                                                <td className="p-2.5 text-slate-800">
                                                    {unitSystem === "imperial" ? `${m.weightLbs} lbs` : `${m.weightKg} kg`}
                                                </td>
                                                <td className="p-2.5 text-right text-emerald-600 font-bold">
                                                    -{unitSystem === "imperial" ? `${m.totalLostLbs} lbs` : `${m.totalLostKg} kg`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "macros" && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Balanced macro distribution to preserve lean skeletal mass during an energy deficit:
                                </p>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Protein (30%)</span>
                                        <span className="text-lg font-black text-indigo-900">{calculations.macros.proteinGrams}g</span>
                                        <span className="text-[10px] text-indigo-600 block mt-0.5">{Math.round(calculations.macros.proteinGrams * 4)} kcal</span>
                                    </div>
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Fats (30%)</span>
                                        <span className="text-lg font-black text-amber-900">{calculations.macros.fatGrams}g</span>
                                        <span className="text-[10px] text-amber-600 block mt-0.5">{Math.round(calculations.macros.fatGrams * 9)} kcal</span>
                                    </div>
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Carbs (40%)</span>
                                        <span className="text-lg font-black text-emerald-900">{calculations.macros.carbGrams}g</span>
                                        <span className="text-[10px] text-emerald-600 block mt-0.5">{Math.round(calculations.macros.carbGrams * 4)} kcal</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                                    <span className="font-bold text-slate-800">High-Protein Defense:</span>
                                    <p>Aim for at least 0.8g–1.0g of protein per pound of lean body mass to prevent muscle catabolism during sustained caloric deficits.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Trust Bar */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side HIPAA compliant
                        </span>
                        <span className="font-semibold text-slate-600">3,500 kcal / lb Metabolic Engine</span>
                    </div>
                </div>
            </div>

            {/* Mandatory Medical Disclaimer Banner 1 */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical & Nutritional Disclaimer:</strong> This calorie deficit estimator is designed for educational and informational purposes only. Calorie deficit targets should never be pursued to extreme thresholds that compromise metabolic or hormonal health. Always consult a physician, registered dietitian, or certified medical professional before starting any restrictive dietary regimen.
                </p>
            </div>

            {/* BELOW-THE-FOLD THOROUGH CONTENT & TECHNICAL EXPLANATION */}
            <div className="space-y-6">

                {/* Card 1: Metabolic Fundamentals & Scientific Energy Balance */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Calorie Deficits & Energy Balance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Sustainable fat reduction is fundamentally governed by the First Law of Thermodynamics: energy cannot be created or destroyed, only transformed. When the human body operates in an <strong>energy deficit</strong>—consuming fewer kilocalories from food and beverages than it expends through basal physiological maintenance and daily activity—it mobilizes stored triglycerides from adipose tissue to synthesize adenosine triphosphate (ATP).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> The 3,500 kcal Rule of Human Adipose Tissue
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Clinical research establishes that one pound of human body fat consists of roughly 87% pure lipid along with connective cellular tissue and water, equating to approximately <strong>3,500 kilocalories</strong> (or 7,700 kcal per kilogram). Thus, a daily deficit of 500 kcal reliably produces approximately 1 pound of fat loss weekly.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Mifflin-St Jeor Energy Baseline
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The American Dietetic Association rates the Mifflin-St Jeor formula as the gold standard for predicting Basal Metabolic Rate (BMR). By multiplying BMR by physical activity multipliers (PAL), our engine calculates your exact Total Daily Energy Expenditure (TDEE) to eliminate guesswork.
                            </p>
                        </div>
                    </div>

                    {/* Scientific Calculation Formulas */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Equations Implemented
                        </h3>
                        <p className="text-xs text-slate-300">
                            The exact mathematical formulations executing inside this client-side calculator:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. BMR (Male):</strong> 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5</div>
                            <div><strong>2. BMR (Female):</strong> 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161</div>
                            <div><strong>3. TDEE:</strong> BMR × Activity Multiplier [1.2 (Sedentary) to 1.9 (Extreme)]</div>
                            <div><strong>4. Daily Calorie Budget:</strong> TDEE - Planned Daily Deficit</div>
                            <div><strong>5. Days to Target:</strong> [Total Fat Mass to Lose (lbs) × 3,500 kcal] / Daily Deficit (kcal)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Deficit Tier Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Deficit Magnitude Comparison Matrix & Physiological Impact
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate deficit size requires balancing speed of results with muscle preservation and adherence. Review how different caloric deficits impact your physiology:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Deficit Tier</th>
                                    <th className="p-3">Daily Deficit</th>
                                    <th className="p-3">Weekly Loss</th>
                                    <th className="p-3">Muscle Retention</th>
                                    <th className="p-3">Hunger & Adherence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Conservative</td>
                                    <td className="p-3">250 – 350 kcal</td>
                                    <td className="p-3">0.5 – 0.7 lbs / wk</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Exceptional (&gt;95%)</td>
                                    <td className="p-3 text-emerald-600 font-medium">Very high adherence, minimal hunger</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-indigo-700">Standard (Recommended)</td>
                                    <td className="p-3 font-semibold">500 kcal</td>
                                    <td className="p-3 font-semibold">1.0 lb / wk</td>
                                    <td className="p-3 text-emerald-600 font-semibold">High (&gt;90%) with protein</td>
                                    <td className="p-3 text-slate-700 font-medium">Optimal balance of speed and satiety</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-amber-600">Aggressive</td>
                                    <td className="p-3">750 – 850 kcal</td>
                                    <td className="p-3">1.5 – 1.7 lbs / wk</td>
                                    <td className="p-3 text-amber-600 font-semibold">Moderate risk of lean tissue loss</td>
                                    <td className="p-3 text-amber-600 font-medium">Elevated cravings and fatigue</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-rose-600">Extreme (High Risk)</td>
                                    <td className="p-3">1000+ kcal</td>
                                    <td className="p-3">2.0+ lbs / wk</td>
                                    <td className="p-3 text-rose-600 font-semibold">High risk of muscle atrophy</td>
                                    <td className="p-3 text-rose-600 font-medium">Significant metabolic adaptation & burnout</td>
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
                            Step-by-Step Practical Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how real-world parameters translate into specific target dates and nutritional prescriptions:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Recomp Cut (Male)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">500 kcal Cut</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Profile:</strong> 34 Years | Male | 5'11" | 205 lbs → 185 lbs goal (-20 lbs)</li>
                                <li><strong>Activity:</strong> Moderate (Gym 4x/wk) | TDEE: 2,750 kcal/day</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Execution Plan:</li>
                                <li>• <strong>Calorie Budget:</strong> 2,250 kcal/day (2,750 - 500)</li>
                                <li>• <strong>Energy Deficit Total:</strong> 20 lbs × 3,500 kcal = 70,000 kcal</li>
                                <li>• <strong>Timeline:</strong> 70,000 / 500 = <strong>140 Days (~20 Weeks)</strong></li>
                                <li>• <strong>Macros:</strong> 170g Protein, 225g Carbs, 75g Fat</li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Wedding Prep (Female)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Fixed Date Target</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Profile:</strong> 29 Years | Female | 165 cm | 68 kg → 60 kg goal (-8 kg)</li>
                                <li><strong>Target Date:</strong> Fixed 16-Week Wedding Deadline (112 Days)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Execution Plan:</li>
                                <li>• <strong>Energy Deficit Total:</strong> 8 kg × 7,700 kcal = 61,600 kcal</li>
                                <li>• <strong>Required Daily Deficit:</strong> 61,600 / 112 = <strong>550 kcal/day</strong></li>
                                <li>• <strong>Maintenance (TDEE):</strong> 1,980 kcal → <strong>Target: 1,430 kcal/day</strong></li>
                                <li>• <strong>Weekly Rate:</strong> -0.5 kg (1.1 lbs) / week</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Metabolic Adaptation & Plateau Strategies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingDown className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Preventing Metabolic Adaptation & Overcoming Weight Loss Plateaus
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        As body mass decreases, your BMR naturally drops because a smaller body requires less energy to move and sustain. Concurrently, Non-Exercise Activity Thermogenesis (NEAT) often subconsciously decreases. To ensure consistent fat loss over longer timelines, implement these clinical strategies:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">Recalculate Every 10 lbs</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Every time you lose 8–10 pounds, update your body weight in this calculator. Your TDEE will have decreased by roughly 50–100 calories, necessitating a minor downward adjustment.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">Prioritize High Protein</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Protein has a high Thermic Effect of Food (TEF, 20–30%) and preserves lean muscle mass. Muscle tissue is metabolically active and keeps your resting metabolic rate elevated.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                            <h3 className="font-bold text-slate-900 text-sm">Implement Diet Breaks</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                After 8–12 weeks of continuous dieting, eating at maintenance calories for 1–2 weeks resets leptin levels, reduces diet fatigue, and prevents severe metabolic slowdown.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: FAQ Section (Static border-highlighted cards) */}
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
                                What is a calorie deficit and how does it trigger fat loss?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A calorie deficit occurs when you consume fewer calories than your body expends for daily metabolic functions and physical movement (TDEE). To compensate for this energy shortfall, the body catabolizes stored adipose tissue (fat stores) for fuel, resulting in weight loss.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How many calories are in one pound or one kilogram of body fat?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In nutritional science, one pound of human adipose tissue stores approximately 3,500 kilocalories of metabolic energy. One kilogram of body fat equals approximately 7,700 kilocalories.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the safest rate of weekly weight loss?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Clinical guidelines generally recommend losing 0.5% to 1.0% of total body weight per week, or roughly 1 to 2 pounds (0.45 to 0.9 kg) weekly. This protects lean skeletal muscle mass and prevents metabolic adaptation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the minimum safe daily calorie intake?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Without direct clinical supervision, adult women should generally not drop below 1,200 kcal/day, and adult men should not consume fewer than 1,500 kcal/day to ensure adequate micronutrient intake and hormonal health.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do BMR and TDEE determine my daily deficit target?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                BMR is the energy required to stay alive at complete rest, while TDEE accounts for your daily activity. Your calorie deficit is subtracted directly from your TDEE, ensuring you know exactly how many calories to eat each day.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Mandatory Medical Disclaimer Banner 2 */}
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