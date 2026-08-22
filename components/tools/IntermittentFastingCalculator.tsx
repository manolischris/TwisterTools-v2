"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Clock,
    Calendar,
    Utensils,
    Sparkles,
    Copy,
    Check,
    Download,
    RefreshCw,
    ShieldCheck,
    AlertTriangle,
    Zap,
    Flame,
    Activity,
    BookOpen,
    HelpCircle,
    Info,
    CheckCircle2,
    Layers,
    Timer,
    Moon,
    Sun,
    ChevronRight,
    Coffee,
    Scale,
    HeartPulse,
    Droplet,
    Dna,
    FileSpreadsheet,
    Gauge,
    BrainCircuit,
    Salad
} from "lucide-react";

type FastingProtocolKey = "16-8" | "18-6" | "20-4" | "14-10" | "12-12" | "omad" | "custom";
type MealFrequency = "2" | "3" | "4" | "omad";

interface ProtocolDetail {
    id: FastingProtocolKey;
    label: string;
    fastingHours: number;
    eatingHours: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
    description: string;
    badgeColor: string;
}

const PROTOCOLS: Record<FastingProtocolKey, ProtocolDetail> = {
    "16-8": {
        id: "16-8",
        label: "16:8 LeanGains",
        fastingHours: 16,
        eatingHours: 8,
        difficulty: "Intermediate",
        description: "The gold standard for sustainable fat loss, metabolic flexibility, and consistent circadian compliance.",
        badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
    },
    "18-6": {
        id: "18-6",
        label: "18:6 Deep Fast",
        fastingHours: 18,
        eatingHours: 6,
        difficulty: "Intermediate",
        description: "Extended ketosis transition with accelerated autophagy induction and moderate eating buffer.",
        badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
    },
    "20-4": {
        id: "20-4",
        label: "20:4 Warrior Diet",
        fastingHours: 20,
        eatingHours: 4,
        difficulty: "Advanced",
        description: "Compact 4-hour eating window maximizing daily cellular autophagy and basal insulin reduction.",
        badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
    },
    "14-10": {
        id: "14-10",
        label: "14:10 Gentle",
        fastingHours: 14,
        eatingHours: 10,
        difficulty: "Beginner",
        description: "Ideal introductory protocol for circadian rhythm alignment and gentle metabolic resetting.",
        badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
    },
    "12-12": {
        id: "12-12",
        label: "12:12 Circadian",
        fastingHours: 12,
        eatingHours: 12,
        difficulty: "Beginner",
        description: "Synchronized with natural daylight cycles to optimize overnight digestion and sleep architecture.",
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
    },
    "omad": {
        id: "omad",
        label: "23:1 OMAD",
        fastingHours: 23,
        eatingHours: 1,
        difficulty: "Expert",
        description: "One Meal A Day: Peak daily autophagy induction and potent caloric deficit management.",
        badgeColor: "bg-rose-50 text-rose-700 border-rose-200"
    },
    "custom": {
        id: "custom",
        label: "Custom Schedule",
        fastingHours: 15,
        eatingHours: 9,
        difficulty: "Intermediate",
        description: "Tailor your exact fasting and feeding ratios to match shift work or workout timing.",
        badgeColor: "bg-slate-100 text-slate-700 border-slate-200"
    }
};

interface FastingPreset {
    id: string;
    label: string;
    protocol: FastingProtocolKey;
    startTime: string;
    meals: MealFrequency;
    tag: string;
}

const PRESETS: FastingPreset[] = [
    { id: "lunch-skip", label: "Standard Afternoon", protocol: "16-8", startTime: "12:00", meals: "2", tag: "12 PM - 8 PM" },
    { id: "early-bird", label: "Circadian Morning", protocol: "16-8", startTime: "08:00", meals: "3", tag: "8 AM - 4 PM" },
    { id: "warrior-eve", label: "Evening Warrior", protocol: "20-4", startTime: "16:00", meals: "2", tag: "4 PM - 8 PM" },
    { id: "beginner-reset", label: "Introductory 14:10", protocol: "14-10", startTime: "09:00", meals: "3", tag: "9 AM - 7 PM" },
    { id: "omad-dinner", label: "Dinner OMAD", protocol: "omad", startTime: "18:00", meals: "omad", tag: "6 PM - 7 PM" }
];

interface FastingStage {
    hours: number;
    title: string;
    desc: string;
    color: string;
    barColor: string;
}

const FASTING_STAGES: FastingStage[] = [
    { hours: 4, title: "Blood Sugar Stabilization & Digestion", desc: "Insulin levels begin dropping as the gastrointestinal tract finishes nutrient absorption.", color: "text-blue-600", barColor: "bg-blue-500" },
    { hours: 8, title: "Glycogen Depletion Phase", desc: "Liver glycogen levels drop significantly; gluconeogenesis and lipolysis ramp up.", color: "text-emerald-600", barColor: "bg-emerald-500" },
    { hours: 12, title: "Metabolic Switch & Early Ketosis", desc: "Fatty acids are oxidized into ketone bodies; fat burning accelerates.", color: "text-amber-600", barColor: "bg-amber-500" },
    { hours: 16, title: "Autophagy Induction & HGH Surge", desc: "Cellular recycling pathways activate via AMPK; natural growth hormone increases.", color: "text-indigo-600", barColor: "bg-indigo-500" },
    { hours: 20, title: "Deep Ketosis & Peak Cellular Renewal", desc: "Systemic inflammation markers decline; intracellular clean-up reaches high velocity.", color: "text-purple-600", barColor: "bg-purple-500" },
    { hours: 24, title: "Comprehensive Metabolic Reset", desc: "Maximum insulin sensitization, stem cell regeneration triggers, and BDNF elevation.", color: "text-rose-600", barColor: "bg-rose-500" }
];

const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(":")) return 720;
    const [h, m] = timeStr.split(":").map(Number);
    return ((h || 0) * 60 + (m || 0)) % 1440;
};

const formatMinutesTo12Hour = (totalMinutes: number): string => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${period}`;
};

export default function IntermittentFastingCalculator() {
    const [protocol, setProtocol] = useState<FastingProtocolKey>("16-8");
    const [customFastingHours, setCustomFastingHours] = useState<number>(15);
    const [windowStartTime, setWindowStartTime] = useState<string>("12:00");
    const [mealCount, setMealCount] = useState<MealFrequency>("2");
    const [targetWaterGoalLiters, setTargetWaterGoalLiters] = useState<number>(3.0);
    const [activeTab, setActiveTab] = useState<"schedule" | "stages" | "protocolInfo">("schedule");
    const [activePresetId, setActivePresetId] = useState<string | null>("lunch-skip");
    const [copied, setCopied] = useState(false);
    const [nowTimeMinutes, setNowTimeMinutes] = useState<number>(720);

    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateNow = () => {
            const date = new Date();
            setNowTimeMinutes(date.getHours() * 60 + date.getMinutes());
        };
        updateNow();
        const interval = setInterval(updateNow, 60000);
        return () => clearInterval(interval);
    }, []);

    const activeFastingHours = useMemo(() => {
        if (protocol === "custom") return Math.min(23, Math.max(1, customFastingHours));
        return PROTOCOLS[protocol].fastingHours;
    }, [protocol, customFastingHours]);

    const activeEatingHours = useMemo(() => {
        return 24 - activeFastingHours;
    }, [activeFastingHours]);

    const timingCalculations = useMemo(() => {
        const eatingStartMin = parseTimeToMinutes(windowStartTime);
        const eatingEndMin = (eatingStartMin + activeEatingHours * 60) % 1440;
        const fastingStartMin = eatingEndMin;
        const fastingEndMin = eatingStartMin;

        let isEatingNow = false;
        if (eatingStartMin < eatingEndMin) {
            isEatingNow = nowTimeMinutes >= eatingStartMin && nowTimeMinutes < eatingEndMin;
        } else {
            isEatingNow = nowTimeMinutes >= eatingStartMin || nowTimeMinutes < eatingEndMin;
        }

        const mealsList: Array<{ title: string; time: string; minutes: number; tag: string }> = [];

        if (protocol === "omad" || mealCount === "omad" || activeEatingHours <= 1) {
            mealsList.push({
                title: "One Main Nourishment Feast",
                time: formatMinutesTo12Hour(eatingStartMin),
                minutes: eatingStartMin,
                tag: "Main Feast"
            });
        } else {
            const numMeals = parseInt(mealCount, 10);
            if (numMeals === 2) {
                mealsList.push({
                    title: "First Meal (Break-Fast)",
                    time: formatMinutesTo12Hour(eatingStartMin),
                    minutes: eatingStartMin,
                    tag: "Window Open"
                });
                mealsList.push({
                    title: "Last Meal (Dinner)",
                    time: formatMinutesTo12Hour((eatingStartMin + (activeEatingHours * 60) - 30) % 1440),
                    minutes: (eatingStartMin + (activeEatingHours * 60) - 30) % 1440,
                    tag: "Window Close"
                });
            } else if (numMeals === 3) {
                const interval = (activeEatingHours * 60) / 2;
                mealsList.push({
                    title: "First Meal (Break-Fast)",
                    time: formatMinutesTo12Hour(eatingStartMin),
                    minutes: eatingStartMin,
                    tag: "Window Open"
                });
                mealsList.push({
                    title: "Mid-Window Fueling Snack",
                    time: formatMinutesTo12Hour((eatingStartMin + interval) % 1440),
                    minutes: (eatingStartMin + interval) % 1440,
                    tag: "Mid-Day Fuel"
                });
                mealsList.push({
                    title: "Final Meal (Window Close)",
                    time: formatMinutesTo12Hour((eatingStartMin + (activeEatingHours * 60) - 30) % 1440),
                    minutes: (eatingStartMin + (activeEatingHours * 60) - 30) % 1440,
                    tag: "Window Close"
                });
            } else {
                const step = (activeEatingHours * 60) / 3;
                mealsList.push({
                    title: "First Meal (Break-Fast)",
                    time: formatMinutesTo12Hour(eatingStartMin),
                    minutes: eatingStartMin,
                    tag: "Meal 1"
                });
                mealsList.push({
                    title: "High-Protein Snack",
                    time: formatMinutesTo12Hour((eatingStartMin + step) % 1440),
                    minutes: (eatingStartMin + step) % 1440,
                    tag: "Meal 2"
                });
                mealsList.push({
                    title: "Secondary Whole Food Meal",
                    time: formatMinutesTo12Hour((eatingStartMin + step * 2) % 1440),
                    minutes: (eatingStartMin + step * 2) % 1440,
                    tag: "Meal 3"
                });
                mealsList.push({
                    title: "Final Nighttime Sustenance",
                    time: formatMinutesTo12Hour((eatingStartMin + (activeEatingHours * 60) - 20) % 1440),
                    minutes: (eatingStartMin + (activeEatingHours * 60) - 20) % 1440,
                    tag: "Meal 4"
                });
            }
        }

        return {
            eatingStartMin,
            eatingEndMin,
            fastingStartMin,
            fastingEndMin,
            isEatingNow,
            mealsList,
            eatingWindowDisplay: `${formatMinutesTo12Hour(eatingStartMin)} – ${formatMinutesTo12Hour(eatingEndMin)}`,
            fastingWindowDisplay: `${formatMinutesTo12Hour(fastingStartMin)} – ${formatMinutesTo12Hour(fastingEndMin)}`,
            eatingRatioPercent: Math.round((activeEatingHours / 24) * 100),
            fastingRatioPercent: Math.round((activeFastingHours / 24) * 100)
        };
    }, [windowStartTime, activeEatingHours, activeFastingHours, mealCount, protocol, nowTimeMinutes]);

    const handleWaterGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setTargetWaterGoalLiters(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const val = parseFloat(cleaned);
        setTargetWaterGoalLiters(isNaN(val) ? 0 : Math.min(10, Math.max(0.5, val)));
    };

    const applyPreset = (preset: FastingPreset) => {
        setProtocol(preset.protocol);
        setWindowStartTime(preset.startTime);
        setMealCount(preset.meals);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setProtocol("16-8");
        setCustomFastingHours(15);
        setWindowStartTime("12:00");
        setMealCount("2");
        setTargetWaterGoalLiters(3.0);
        setActivePresetId("lunch-skip");
    };

    const handleCopySchedule = () => {
        const scheduleText = `Intermittent Fasting & Meal Plan Schedule (TwisterTools):
--------------------------------------------------
Protocol: ${PROTOCOLS[protocol].label} (${activeFastingHours}h Fast / ${activeEatingHours}h Feed)
Eating Window: ${timingCalculations.eatingWindowDisplay} (${activeEatingHours} Hours)
Fasting Window: ${timingCalculations.fastingWindowDisplay} (${activeFastingHours} Hours)
Hydration Target: ${targetWaterGoalLiters.toFixed(1)} L/day (Zero-Calorie Fluids)
--------------------------------------------------
Calculated Meal Timing Schedule:
${timingCalculations.mealsList.map((m, idx) => `${idx + 1}. ${m.title} @ ${m.time} [${m.tag}]`).join("\n")}
--------------------------------------------------
Generate your personalized schedule at: twistertools.com/tools/calculators/intermittent-fasting-calculator`;

        navigator.clipboard.writeText(scheduleText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Event / Block", "Time / Range", "Type", "Details"];
        const rows = [
            ["Eating Window", timingCalculations.eatingWindowDisplay, "Feeding", `${activeEatingHours} Hours Total`],
            ["Fasting Window", timingCalculations.fastingWindowDisplay, "Fasting", `${activeFastingHours} Hours Total`],
            ...timingCalculations.mealsList.map((m) => [m.title, m.time, "Meal Checkpoint", m.tag]),
            ["Target Daily Hydration", `${targetWaterGoalLiters} Liters`, "Hydration", "Water, Black Coffee, Unsweetened Tea"]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `fasting_schedule_${protocol}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Intermittent Fasting Window & Meal Schedule Tracker",
        "url": "https://twistertools.com/tools/calculators/intermittent-fasting-calculator",
        "description": "Calculate precision fasting and eating windows, meal timing checkpoints, hydration targets, and metabolic autophagy stages across 16:8, 18:6, 20:4 Warrior, and OMAD protocols.",
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
                "name": "What is the 16:8 intermittent fasting protocol?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 16:8 method is a time-restricted eating pattern where you fast for 16 consecutive hours and consume your daily calories within an 8-hour window, such as from 12:00 PM to 8:00 PM."
                }
            },
            {
                "@type": "Question",
                "name": "What breaks a fast during the fasting window?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Any caloric intake containing carbohydrates, proteins, fats, milk, creamers, sugar, or branched-chain amino acids (BCAAs) that elevates insulin or stimulates digestive enzymes breaks a fast. Pure water, black coffee, and unsweetened teas maintain the fasting state."
                }
            },
            {
                "@type": "Question",
                "name": "When does autophagy begin during intermittent fasting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Autophagy—the body's cellular cleanup and organelle recycling system—begins activating around 14 to 16 hours of fasting as liver glycogen depletes, accelerating significantly around 18 to 24 hours."
                }
            },
            {
                "@type": "Question",
                "name": "Can I drink coffee or tea while fasting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, black coffee, unflavored green tea, and plain herbal teas contain zero net macronutrients and do not stimulate insulin, making them excellent tools for appetite control during fasting."
                }
            },
            {
                "@type": "Question",
                "name": "How should I structure workouts during intermittent fasting?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fasted light-to-moderate cardio can be performed in the morning to maximize fatty acid oxidation. For heavy resistance training, scheduling sessions near the end of your fast allows immediate post-workout nutrition for optimal muscle protein synthesis."
                }
            },
            {
                "@type": "Question",
                "name": "Will intermittent fasting slow down my basal metabolic rate (BMR)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Short-term intermittent fasting (under 48 hours) does not decrease basal metabolic rate. Epinephrine and norepinephrine surges during fasting actually help maintain or slightly elevate resting energy expenditure."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Fasting Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Timer className="w-5 h-5 text-indigo-600" />
                                Fasting Protocol & Timing Setup
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Fasting Protocol Grid */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Select Fasting Protocol
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(Object.keys(PROTOCOLS) as FastingProtocolKey[]).map((key) => {
                                        const p = PROTOCOLS[key];
                                        const isSelected = protocol === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => {
                                                    setProtocol(key);
                                                    setActivePresetId(null);
                                                }}
                                                className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${isSelected
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                                                    }`}
                                            >
                                                <span className="text-xs font-bold block">{p.label}</span>
                                                <span className={`text-[10px] mt-1 font-semibold ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                                                    {p.fastingHours}h Fast / {p.eatingHours}h Feed
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Protocol Slider */}
                            {protocol === "custom" && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span>Custom Fasting Duration</span>
                                        <span className="text-indigo-600 font-extrabold text-sm">{activeFastingHours}h Fasting / {24 - activeFastingHours}h Feeding</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="23"
                                        value={customFastingHours}
                                        onChange={(e) => {
                                            setCustomFastingHours(parseInt(e.target.value, 10));
                                            setActivePresetId(null);
                                        }}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                        <span>1 hr (Gentle)</span>
                                        <span>16 hrs (Standard)</span>
                                        <span>23 hrs (OMAD)</span>
                                    </div>
                                </div>
                            )}

                            {/* Feeding Window Start & Meal Partitioning */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Feeding Window Starts
                                    </label>
                                    <input
                                        type="time"
                                        value={windowStartTime}
                                        onChange={(e) => {
                                            setWindowStartTime(e.target.value);
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Local time you break your fast
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Utensils className="w-3.5 h-3.5 text-indigo-600" /> Meal Frequency
                                    </label>
                                    <select
                                        value={mealCount}
                                        onChange={(e) => {
                                            setMealCount(e.target.value as MealFrequency);
                                            setActivePresetId(null);
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        <option value="2">2 Main Meals (Standard)</option>
                                        <option value="3">3 Structured Feedings</option>
                                        <option value="4">4 Frequent Small Meals</option>
                                        <option value="omad">1 Feast (OMAD Protocol)</option>
                                    </select>
                                    <span className="text-[11px] text-slate-400 mt-1 block">
                                        Evenly partitioned across window
                                    </span>
                                </div>
                            </div>

                            {/* Hydration Goal Slider */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Droplet className="w-3.5 h-3.5 text-indigo-600" /> Target Hydration (Zero-Calorie Fluids)
                                    </span>
                                    <span className="text-indigo-600 font-bold">{targetWaterGoalLiters.toFixed(1)} Liters / Day</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1.0"
                                    max="8.0"
                                    value={targetWaterGoalLiters === 0 ? "" : targetWaterGoalLiters}
                                    onChange={handleWaterGoalChange}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Presets Row */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Popular Routine Presets
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

                    {/* Actions Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySchedule}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Schedule Copied" : "Copy Fasting Schedule"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Timeline & Visualization */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Window Timeline & Breakdown
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("schedule")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "schedule" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Meals
                                </button>
                                <button
                                    onClick={() => setActiveTab("stages")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "stages" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Autophagy
                                </button>
                                <button
                                    onClick={() => setActiveTab("protocolInfo")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "protocolInfo" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Guide
                                </button>
                            </div>
                        </div>

                        {/* Current Status Hero Banner */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 transition-all shadow-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {PROTOCOLS[protocol].label} Breakdown
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${timingCalculations.isEatingNow ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                                    {timingCalculations.isEatingNow ? "Feeding Window Active" : "Fasting State Active"}
                                </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Sun className="w-4 h-4 text-amber-500" />
                                        Eating Window ({activeEatingHours}h)
                                    </div>
                                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                                        {timingCalculations.eatingWindowDisplay}
                                    </p>
                                </div>

                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Moon className="w-4 h-4 text-indigo-600" />
                                        Fasting Window ({activeFastingHours}h)
                                    </div>
                                    <p className="text-lg font-extrabold text-indigo-700 mt-1">
                                        {timingCalculations.fastingWindowDisplay}
                                    </p>
                                </div>
                            </div>

                            {/* 24-Hour Linear Timeline */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-300"
                                        style={{ width: `${timingCalculations.fastingRatioPercent}%` }}
                                        title={`Fasting: ${activeFastingHours} hours`}
                                    />
                                    <div
                                        className="bg-amber-400 h-full transition-all duration-300"
                                        style={{ width: `${timingCalculations.eatingRatioPercent}%` }}
                                        title={`Feeding: ${activeEatingHours} hours`}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" /> Fasting: {activeFastingHours} hrs ({timingCalculations.fastingRatioPercent}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Feeding: {activeEatingHours} hrs ({timingCalculations.eatingRatioPercent}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sub-Tab Views */}
                        {activeTab === "schedule" && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                    Optimized Nutrition Checkpoints
                                </h3>

                                <div className="space-y-2">
                                    {timingCalculations.mealsList.map((meal, index) => (
                                        <div key={index} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:bg-slate-100/80 transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{meal.title}</p>
                                                    <p className="text-[11px] text-slate-500">{meal.tag}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                                    {meal.time}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                                    <Coffee className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                    <span><strong>Fasting Fluid Rule:</strong> Water, black coffee, and unflavored green tea are permitted without breaking your fast.</span>
                                </div>
                            </div>
                        )}

                        {activeTab === "stages" && (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                                    Metabolic & Autophagy Biomarkers
                                </h3>

                                {FASTING_STAGES.map((stage) => {
                                    const isReached = activeFastingHours >= stage.hours;
                                    return (
                                        <div
                                            key={stage.hours}
                                            className={`p-3 rounded-xl border transition ${isReached ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50/60 border-slate-100 opacity-60"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${stage.barColor}`} />
                                                    <span className="text-xs font-bold text-slate-900">
                                                        Hour {stage.hours}: {stage.title}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isReached ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}>
                                                    {isReached ? "Achieved" : "Requires Longer Fast"}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                                {stage.desc}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === "protocolInfo" && (
                            <div className="space-y-3 text-xs text-slate-700">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-sm">{PROTOCOLS[protocol].label}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PROTOCOLS[protocol].badgeColor}`}>
                                            {PROTOCOLS[protocol].difficulty}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">
                                        {PROTOCOLS[protocol].description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-slate-400 font-semibold block text-[10px]">Autophagy Trigger</span>
                                        <span className="font-bold text-slate-900">{activeFastingHours >= 16 ? "High (16h+ Active)" : "Mild Early Phase"}</span>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl">
                                        <span className="text-slate-400 font-semibold block text-[10px]">Glycogen Depletion</span>
                                        <span className="font-bold text-slate-900">{activeFastingHours >= 12 ? "Complete (12h+)" : "Partial Phase"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Private & Secure
                        </span>
                        <span>Circadian Engine 2.0</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This intermittent fasting planner is intended solely for educational, routine-structuring, and informational purposes. Fasting is not suitable for everyone, including pregnant or nursing women, individuals with a history of eating disorders, children, or those with specific medical conditions like Type 1 diabetes. Always consult a licensed healthcare practitioner or registered dietitian before beginning an intermittent fasting regimen.
                </p>
            </div>

            {/* EXPANDED HIGH-VALUE CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Fasting Biology & Cellular Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Cellular Biology and Metabolic Science of Intermittent Fasting
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Intermittent Fasting (IF) is an evidence-backed nutritional timing strategy that cycles between deliberate periods of voluntary abstinence from food and structured feeding windows. Rather than prescribing specific food restrictions, intermittent fasting modifies the <em>timing</em> of caloric intake, activating evolutionarily conserved cellular pathways that enhance metabolic flexibility, trigger intracellular cleansing, and optimize hormonal balance.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> The Metabolic Switch (Ketosis Shift)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                After 10 to 14 hours of continuous fasting, circulating liver glycogen reserves deplete. The body switches from glucose-dependent glycolysis to fatty acid oxidation, mobilizing stored triglycerides into free fatty acids and ketone bodies (acetoacetate and beta-hydroxybutyrate) for sustained ATP production.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <HeartPulse className="w-4 h-4 text-indigo-600" /> Autophagy & Cellular Quality Control
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Pioneered by Nobel laureate Yoshinori Ohsumi, autophagy is the lysosome-mediated degradation process where cells recycle damaged organelles, misfolded proteins, and intracellular pathogens. Fasting downregulates mTOR and activates AMPK, stimulating full systemic autophagy.
                            </p>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Insulin Sensitivity
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extended pauses in feeding lower baseline insulin levels, allowing insulin receptors on muscle and adipose tissue to resensitize effectively.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <BrainCircuit className="w-4 h-4 text-indigo-600" /> BDNF Production
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Fasting elevates Brain-Derived Neurotrophic Factor (BDNF), supporting neuroplasticity, memory formation, and cognitive resilience.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
                            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Flame className="w-4 h-4 text-indigo-600" /> Growth Hormone (HGH)
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Acute fasting induces surges in human growth hormone, protecting lean muscle mass from catabolism during active fat oxidation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Detailed Protocol Breakdown & Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Intermittent Fasting Protocol Breakdown
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct fasting protocol depends on personal lifestyle, circadian rhythm preferences, metabolic goals, and physical training demands:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Protocol</th>
                                    <th className="p-3">Fasting / Feeding</th>
                                    <th className="p-3">Primary Benefit</th>
                                    <th className="p-3">Best Suited For</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-700">16:8 (LeanGains)</td>
                                    <td className="p-3 font-semibold">16h Fast / 8h Feed</td>
                                    <td className="p-3">Optimal fat loss & muscle retention balance</td>
                                    <td className="p-3">Most adults, professionals, and strength athletes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">18:6 Deep Fast</td>
                                    <td className="p-3">18h Fast / 6h Feed</td>
                                    <td className="p-3">Accelerated ketosis and elevated daily autophagy</td>
                                    <td className="p-3">Intermediate fasters breaking weight plateaus</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-amber-700">20:4 (Warrior Diet)</td>
                                    <td className="p-3">20h Fast / 4h Feed</td>
                                    <td className="p-3">Maximum sympathetic nervous system alertness</td>
                                    <td className="p-3">Experienced practitioners seeking intense focus</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-emerald-700">14:10 Gentle</td>
                                    <td className="p-3">14h Fast / 10h Feed</td>
                                    <td className="p-3">Circadian digestion reset with zero fatigue</td>
                                    <td className="p-3">Complete beginners and hormonal sensitive groups</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-blue-700">12:12 Circadian</td>
                                    <td className="p-3">12h Fast / 12h Feed</td>
                                    <td className="p-3">Overnight gastrointestinal rest and sleep optimization</td>
                                    <td className="p-3">Introductory adaptation and healthy lifestyle maintenance</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-rose-700">23:1 (OMAD)</td>
                                    <td className="p-3">23h Fast / 1h Feed</td>
                                    <td className="p-3">Extreme caloric restriction and peak daily ketone depth</td>
                                    <td className="p-3">Advanced practitioners with strict micronutrient plans</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Hour-by-Hour Timeline Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Metabolic Stages: What Happens Hour-by-Hour During a Fast
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The human body undergoes distinct physiological adaptations as fasting progresses from the fed state to extended cellular repair:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Time Range</th>
                                    <th className="p-3">Metabolic Stage</th>
                                    <th className="p-3">Key Hormonal & Cellular Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">0 – 4 Hours</td>
                                    <td className="p-3 font-semibold text-blue-600">Fed State</td>
                                    <td className="p-3">Blood glucose and insulin rise; nutrients are stored as glycogen and triglycerides.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">4 – 8 Hours</td>
                                    <td className="p-3 font-semibold text-emerald-600">Early Post-Absorptive</td>
                                    <td className="p-3">Insulin declines to baseline; stomach empties; liver releases stored glycogen into the bloodstream.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">8 – 12 Hours</td>
                                    <td className="p-3 font-semibold text-amber-600">Glycogen Depletion</td>
                                    <td className="p-3">Liver glycogen reserves deplete; lipolysis accelerates, mobilizing fatty acids from adipose tissue.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-bold text-slate-900">12 – 16 Hours</td>
                                    <td className="p-3 font-semibold text-indigo-600">Ketosis & Autophagy Switch</td>
                                    <td className="p-3">Beta-hydroxybutyrate ketones appear; AMPK activates and mTOR downregulates, initiating autophagy.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">16 – 20 Hours</td>
                                    <td className="p-3 font-semibold text-purple-600">Deep Autophagy</td>
                                    <td className="p-3">Intracellular cleansing peaks; damaged mitochondria and misfolded proteins are degraded and recycled.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">20 – 24 Hours</td>
                                    <td className="p-3 font-semibold text-rose-600">Peak Autophagy & Reset</td>
                                    <td className="p-3">Systemic inflammation markers drop sharply; cellular resilience and stem cell signaling activate.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Nutritional Structuring & Meal Execution */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Utensils className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Nutritional Structuring: How to Break and Close Your Fast
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        What you consume during your eating window determines your energy levels, muscle protein synthesis, and metabolic health. Breaking a fast improperly can lead to gastrointestinal distress and insulin spikes.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> The Break-Fast Meal
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Prioritize high-bioavailability protein (eggs, poultry, fish, whey) and soluble fiber. Avoid high-glycemic carbohydrates combined with heavy saturated fats to prevent acute postprandial fatigue.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> The Mid-Window Snack
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Incorporate micronutrient-dense superfoods, leafy greens, avocado, nuts, and complex slow-burning carbohydrates to replenish muscle glycogen without spiking blood glucose.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Moon className="w-4 h-4 text-indigo-600" /> The Window-Closing Meal
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Focus on casein or slow-digesting protein sources, healthy monounsaturated fats, and magnesium-rich vegetables to sustain nighttime amino acid levels and promote deep restorative sleep.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Fasting Fluid Guide & Electrolyte Strategy */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Coffee className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Fasting Fluid Guidelines & Electrolyte Management
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Maintaining hydration and electrolyte balance is critical during fasting. When insulin drops, the kidneys excrete sodium at higher rates (natriuresis of fasting), making electrolyte intake essential for preventing headaches and fatigue.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                            <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" /> Allowed Drinks (Fast Maintained)
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>Filtered Water:</strong> Plain, chilled, or hot with a pinch of sea salt.</li>
                                <li>• <strong>Mineral / Sparkling Water:</strong> Unflavored carbonated water rich in naturally occurring minerals.</li>
                                <li>• <strong>Black Coffee:</strong> Plain coffee with no creamers, sugars, milk, or butter.</li>
                                <li>• <strong>Unsweetened Tea:</strong> Green tea, black tea, yerba mate, and herbal infusions (chamomile, peppermint).</li>
                                <li>• <strong>Electrolyte Water:</strong> Calorie-free electrolytes containing pure sodium, potassium, and magnesium.</li>
                            </ul>
                        </div>

                        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                            <h3 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Drinks That Break a Fast
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li>• <strong>Dairy & Plant Milks:</strong> Milk, almond milk, oat milk, or half-and-half creamers.</li>
                                <li>• <strong>Fruit Juices & Smoothies:</strong> Fructose and glucose trigger immediate insulin release.</li>
                                <li>• <strong>BCAA / EAA Supplements:</strong> Free-form amino acids activate the mTOR pathway and stop autophagy.</li>
                                <li>• <strong>Bone Broth (during strict fasts):</strong> Contains collagen proteins that halt cellular autophagy.</li>
                                <li>• <strong>Sugary Sodas & Energy Drinks:</strong> High caloric content that terminates the fasting state immediately.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: Worked Practical Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Intermittent Fasting Schedules
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how daily schedules are structured across different lifestyle and work scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Office Professional (16:8 Protocol)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">16:8 Schedule</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>07:00 AM:</strong> Black coffee or green tea + 500 ml mineral water (Fasting)</li>
                                <li><strong>12:00 PM:</strong> <strong>Meal 1 (Break-Fast):</strong> Grilled chicken salad with olive oil, avocado, and quinoa</li>
                                <li><strong>03:30 PM:</strong> <strong>Snack:</strong> Greek yogurt with walnuts and blueberries</li>
                                <li><strong>07:30 PM:</strong> <strong>Meal 2 (Window Close):</strong> Baked salmon with sweet potato and steamed broccoli</li>
                                <li><strong>08:00 PM:</strong> <strong>Fasting Window Begins:</strong> Water and herbal chamomile tea until next noon</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Strength Athlete (18:6 Protocol)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">18:6 Schedule</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>11:30 AM:</strong> Fasted resistance training session with electrolytes</li>
                                <li><strong>01:00 PM:</strong> <strong>Meal 1 (Break-Fast):</strong> Whey isolate shake, 4 scrambled eggs, oatmeal with berries</li>
                                <li><strong>04:00 PM:</strong> <strong>Meal 2 (Mid-Day):</strong> Lean ground turkey bowl with white rice, spinach, and avocado</li>
                                <li><strong>06:45 PM:</strong> <strong>Meal 3 (Window Close):</strong> Sirloin steak, roasted asparagus, cottage cheese</li>
                                <li><strong>07:00 PM:</strong> <strong>Fasting Window Begins:</strong> Fasted state maintained for 18 hours</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 7: Frequently Asked Questions (FAQ) */}
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
                                What is the 16:8 intermittent fasting method?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 16:8 method involves fasting for 16 consecutive hours each day and restricting your daily nutritional intake to an 8-hour eating window. A common approach is skipping breakfast and eating between 12:00 PM and 8:00 PM.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What beverages break a fast during the fasting window?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Any substance containing calories, sugars, milk, creamers, or BCAAs that initiates digestive enzyme secretion or an insulin response breaks a physiological fast. Pure water, mineral water, unsweetened black coffee, and plain green or herbal tea do not break a fast.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When does autophagy start during fasting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Autophagy pathways begin activating around hour 14 to 16 of continuous fasting as hepatic glycogen depletes, reaching significant cellular cleanup rates between 18 and 24 hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I exercise while fasting?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Fasted cardiovascular exercise stimulates enhanced fat oxidation. For resistance training, many athletes prefer scheduling workouts immediately prior to opening their eating window to optimize immediate post-workout nutrient timing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Will intermittent fasting cause muscle loss?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As long as total daily caloric and protein requirements (1.6g to 2.2g per kg of lean mass) are met within your eating window and progressive resistance training is maintained, intermittent fasting preserves lean muscle tissue effectively.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does intermittent fasting slow down resting metabolic rate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Short-term intermittent fasting does not reduce basal metabolic rate. Hormonal increases in norepinephrine during short fasts help maintain or slightly elevate resting energy expenditure.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY MEDICAL CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Health & Medical Safety Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical Disclaimer: This intermittent fasting tracker is an informational calculation tool and does not provide clinical or prescriptive advice. Fasting may cause adverse effects in individuals with underlying metabolic, adrenal, or electrolyte disorders. Always seek guidance from a licensed physician or medical professional prior to starting fasting routines.
                    </p>
                </section>
            </div>
        </div>
    );
}