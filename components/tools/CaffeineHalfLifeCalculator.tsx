"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Coffee,
    Moon,
    Clock,
    Zap,
    AlertCircle,
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
    TrendingDown,
    Activity,
    Bed,
    Sun,
    Layers,
    Sliders,
    Brain,
    Flame
} from "lucide-react";

interface BeveragePreset {
    id: string;
    label: string;
    caffeineMg: number;
    servingSize: string;
    category: "coffee" | "tea" | "energy" | "soda" | "supplement";
}

const BEVERAGE_PRESETS: BeveragePreset[] = [
    { id: "espresso-single", label: "Espresso (Single Shot)", caffeineMg: 64, servingSize: "1 oz (30 ml)", category: "coffee" },
    { id: "espresso-double", label: "Double Espresso", caffeineMg: 128, servingSize: "2 oz (60 ml)", category: "coffee" },
    { id: "drip-coffee-8oz", label: "Brewed Drip Coffee", caffeineMg: 96, servingSize: "8 oz (240 ml)", category: "coffee" },
    { id: "starbucks-grande", label: "Medium Roast (Grande)", caffeineMg: 310, servingSize: "16 oz (480 ml)", category: "coffee" },
    { id: "cold-brew", label: "Cold Brew Coffee", caffeineMg: 205, servingSize: "12 oz (355 ml)", category: "coffee" },
    { id: "black-tea", label: "Black Tea (Steeped)", caffeineMg: 47, servingSize: "8 oz (240 ml)", category: "tea" },
    { id: "green-tea-matcha", label: "Matcha Green Tea", caffeineMg: 70, servingSize: "8 oz (240 ml)", category: "tea" },
    { id: "energy-drink-standard", label: "Standard Energy Drink", caffeineMg: 160, servingSize: "16 oz (473 ml)", category: "energy" },
    { id: "high-energy-drink", label: "High-Stim Energy Can", caffeineMg: 300, servingSize: "16 oz (473 ml)", category: "energy" },
    { id: "cola-soda", label: "Cola Soda Can", caffeineMg: 34, servingSize: "12 oz (355 ml)", category: "soda" },
    { id: "preworkout", label: "Pre-Workout Scoop", caffeineMg: 250, servingSize: "1 scoop (10 g)", category: "supplement" },
];

interface MetabolicFactor {
    id: string;
    label: string;
    halfLifeMultiplier: number;
    description: string;
}

const METABOLIC_MODIFIERS: MetabolicFactor[] = [
    { id: "standard", label: "Standard CYP1A2 (Average)", halfLifeMultiplier: 1.0, description: "Normal baseline hepatic clearance rate." },
    { id: "fast-metabolizer", label: "Fast Metabolizer (CYP1A2*1A)", halfLifeMultiplier: 0.75, description: "Accelerated liver enzyme degradation." },
    { id: "slow-metabolizer", label: "Slow Metabolizer (CYP1A2*1F)", halfLifeMultiplier: 1.45, description: "Prolonged retention and heightened sensitivity." },
    { id: "smoker", label: "Active Nicotine / Smoker", halfLifeMultiplier: 0.65, description: "Smoking induces CYP1A2, shortening half-life." },
    { id: "oral-contraceptives", label: "Oral Contraceptives / Estrogen", halfLifeMultiplier: 1.70, description: "Inhibits hepatic enzyme breakdown rate." },
    { id: "pregnancy", label: "Pregnancy (3rd Trimester)", halfLifeMultiplier: 2.10, description: "Substantially extended retention window." },
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

export default function CaffeineHalfLifeCalculator() {
    // Core Parameters State
    const [caffeineDoseMg, setCaffeineDoseMg] = useState<number>(200);
    const [consumptionTime, setConsumptionTime] = useState<string>("14:00");
    const [targetBedtime, setTargetBedtime] = useState<string>("23:00");
    const [baseHalfLifeHours, setBaseHalfLifeHours] = useState<number>(5.0);
    const [metabolicModifierId, setMetabolicModifierId] = useState<string>("standard");
    const [sleepDisruptionThresholdMg, setSleepDisruptionThresholdMg] = useState<number>(25);

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"curve" | "table">("curve");
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Effective Half-Life with CYP1A2 Metabolic Modifiers
    const effectiveHalfLifeHours = useMemo(() => {
        const modifier = METABOLIC_MODIFIERS.find((m) => m.id === metabolicModifierId);
        const mult = modifier ? modifier.halfLifeMultiplier : 1.0;
        return Number((baseHalfLifeHours * mult).toFixed(2));
    }, [baseHalfLifeHours, metabolicModifierId]);

    // Calculate time differences in fractional hours
    const parsedTimeData = useMemo(() => {
        const [cHour, cMin] = consumptionTime.split(":").map(Number);
        const [bHour, bMin] = targetBedtime.split(":").map(Number);

        const consumptionDate = new Date(2026, 0, 1, cHour || 0, cMin || 0, 0);
        let bedtimeDate = new Date(2026, 0, 1, bHour || 0, bMin || 0, 0);

        // If bedtime is earlier than consumption, assume it is bedtime on the following calendar day
        if (bedtimeDate <= consumptionDate) {
            bedtimeDate = new Date(2026, 0, 2, bHour || 0, bMin || 0, 0);
        }

        const hoursUntilBedtime = (bedtimeDate.getTime() - consumptionDate.getTime()) / (1000 * 60 * 60);

        return {
            consumptionHour: cHour || 0,
            consumptionMin: cMin || 0,
            bedtimeHour: bHour || 0,
            bedtimeMin: bMin || 0,
            hoursUntilBedtime: Math.max(0, hoursUntilBedtime),
        };
    }, [consumptionTime, targetBedtime]);

    // Core Kinetics Calculation Model
    const kineticsResults = useMemo(() => {
        const dose = Math.max(0, caffeineDoseMg);
        const hl = effectiveHalfLifeHours > 0 ? effectiveHalfLifeHours : 5.0;
        const decayConstantK = Math.LN2 / hl; // k = ln(2) / t_1/2

        // Amount at Bedtime: C(t) = C0 * e^(-k * t)
        const bedtimeRemainingMg = dose * Math.exp(-decayConstantK * parsedTimeData.hoursUntilBedtime);

        // Hours to reach specific thresholds
        // t = -ln(target / C0) / k = (ln(C0) - ln(target)) / k
        const calculateHoursToThreshold = (thresholdMg: number) => {
            if (dose <= thresholdMg) return 0;
            return Math.max(0, (Math.log(dose) - Math.log(thresholdMg)) / decayConstantK);
        };

        const hoursToSleepThreshold = calculateHoursToThreshold(sleepDisruptionThresholdMg);
        const hoursToQuarterDose = calculateHoursToThreshold(dose * 0.25); // 2 half-lives
        const hoursToCleared = calculateHoursToThreshold(5); // 5mg residual clearance

        // Recommended cutoff time before targeted bedtime to stay below disruption threshold
        // Cutoff Time = Bedtime - hoursToSleepThreshold
        const [bHour, bMin] = targetBedtime.split(":").map(Number);
        const baseBedtimeMs = (bHour * 60 + bMin) * 60 * 1000;
        const cutoffOffsetMs = hoursToSleepThreshold * 60 * 60 * 1000;
        let recommendedCutoffMinutesTotal = Math.round((baseBedtimeMs - cutoffOffsetMs) / (60 * 1000));

        while (recommendedCutoffMinutesTotal < 0) {
            recommendedCutoffMinutesTotal += 24 * 60;
        }
        recommendedCutoffMinutesTotal %= (24 * 60);

        const cutoffHrs = Math.floor(recommendedCutoffMinutesTotal / 60);
        const cutoffMins = recommendedCutoffMinutesTotal % 60;
        const formattedCutoffTime = `${String(cutoffHrs).padStart(2, "0")}:${String(cutoffMins).padStart(2, "0")}`;

        // Sleep Disruption Risk Classification
        let disruptionRiskLevel: "Low" | "Moderate" | "Elevated" | "Severe" = "Low";
        let riskColor = "text-emerald-600";
        let riskBg = "bg-emerald-50";
        let riskBorder = "border-emerald-200";

        if (bedtimeRemainingMg > 100) {
            disruptionRiskLevel = "Severe";
            riskColor = "text-rose-700";
            riskBg = "bg-rose-100";
            riskBorder = "border-rose-300";
        } else if (bedtimeRemainingMg > 50) {
            disruptionRiskLevel = "Elevated";
            riskColor = "text-rose-600";
            riskBg = "bg-rose-50";
            riskBorder = "border-rose-200";
        } else if (bedtimeRemainingMg > sleepDisruptionThresholdMg) {
            disruptionRiskLevel = "Moderate";
            riskColor = "text-amber-600";
            riskBg = "bg-amber-50";
            riskBorder = "border-amber-200";
        }

        // Generate 24-hour decay schedule (hourly data points)
        const decaySchedule: Array<{ hourOffset: number; clockTime: string; remainingMg: number; pct: number }> = [];
        for (let h = 0; h <= 24; h += 2) {
            const remaining = dose * Math.exp(-decayConstantK * h);
            const totalMin = (parsedTimeData.consumptionHour * 60 + parsedTimeData.consumptionMin + h * 60) % (24 * 60);
            const dispHr = String(Math.floor(totalMin / 60)).padStart(2, "0");
            const dispMin = String(totalMin % 60).padStart(2, "0");

            decaySchedule.push({
                hourOffset: h,
                clockTime: `${dispHr}:${dispMin}`,
                remainingMg: Number(remaining.toFixed(1)),
                pct: Number(((remaining / (dose || 1)) * 100).toFixed(1)),
            });
        }

        return {
            doseMg: dose,
            decayConstantK,
            bedtimeRemainingMg: Number(bedtimeRemainingMg.toFixed(1)),
            bedtimeRemainingPct: dose > 0 ? Number(((bedtimeRemainingMg / dose) * 100).toFixed(1)) : 0,
            hoursToSleepThreshold: Number(hoursToSleepThreshold.toFixed(1)),
            hoursToQuarterDose: Number(hoursToQuarterDose.toFixed(1)),
            hoursToCleared: Number(hoursToCleared.toFixed(1)),
            formattedCutoffTime,
            disruptionRiskLevel,
            riskColor,
            riskBg,
            riskBorder,
            decaySchedule,
        };
    }, [caffeineDoseMg, effectiveHalfLifeHours, parsedTimeData, sleepDisruptionThresholdMg, targetBedtime]);

    const applyPreset = (preset: BeveragePreset) => {
        setCaffeineDoseMg(preset.caffeineMg);
        setSelectedPresetId(preset.id);
    };

    const handleReset = () => {
        setCaffeineDoseMg(200);
        setConsumptionTime("14:00");
        setTargetBedtime("23:00");
        setBaseHalfLifeHours(5.0);
        setMetabolicModifierId("standard");
        setSleepDisruptionThresholdMg(25);
        setSelectedPresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Caffeine Half-Life & Sleep Disruption Analysis (TwisterTools):
--------------------------------------------------
Initial Caffeine Dose: ${kineticsResults.doseMg} mg
Consumption Time: ${consumptionTime} | Target Bedtime: ${targetBedtime}
Calculated Elimination Half-Life: ${effectiveHalfLifeHours} hrs (${metabolicModifierId})
--------------------------------------------------
Active Caffeine at Bedtime: ${kineticsResults.bedtimeRemainingMg} mg (${kineticsResults.bedtimeRemainingPct}% remaining)
Sleep Disruption Risk Level: ${kineticsResults.disruptionRiskLevel}
Recommended Daily Caffeine Cutoff: ${kineticsResults.formattedCutoffTime}
Time to Reach Sleep Safe Level (<${sleepDisruptionThresholdMg}mg): ${kineticsResults.hoursToSleepThreshold} hrs
Time to Complete Physiological Clearance (<5mg): ${kineticsResults.hoursToCleared} hrs
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/caffeine-half-life-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Hour Offset", "Clock Time", "Remaining Caffeine (mg)", "Original Dose Retained (%)"];
        const rows = kineticsResults.decaySchedule.map((pt) => [
            `+${pt.hourOffset} hrs`,
            pt.clockTime,
            `${pt.remainingMg} mg`,
            `${pt.pct}%`
        ]);

        const metaHeaders = [
            ["Metric", "Value"],
            ["Initial Dose", `${kineticsResults.doseMg} mg`],
            ["Effective Half-Life", `${effectiveHalfLifeHours} hrs`],
            ["Consumption Time", consumptionTime],
            ["Target Bedtime", targetBedtime],
            ["Remaining at Bedtime", `${kineticsResults.bedtimeRemainingMg} mg`],
            ["Sleep Cutoff Recommendation", kineticsResults.formattedCutoffTime],
            ["", ""],
        ];

        const csvContent = [
            ...metaHeaders.map((r) => r.map((val) => `"${val}"`).join(",")),
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `caffeine_decay_kinetics_analysis.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Caffeine Half-Life & Sleep Disruption Calculator",
        "url": "https://twistertools.com/tools/calculators/caffeine-half-life-calculator",
        "description": "Calculate caffeine elimination half-life, bloodstream retention at bedtime, adenosine receptor blockage, and ideal sleep cutoff times based on CYP1A2 metabolic rate.",
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
                "name": "What is the biological elimination half-life of caffeine?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For healthy adults, the biological half-life of caffeine averages 4 to 6 hours (with a median of 5 hours). This means that 5 hours after consuming 200 mg of caffeine, approximately 100 mg remains active in your bloodstream."
                }
            },
            {
                "@type": "Question",
                "name": "How does caffeine in the bloodstream disrupt sleep architecture?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Caffeine acts as a competitive antagonist against adenosine A1 and A2A receptors in the central nervous system. By blocking adenosine from binding, caffeine inhibits homeostatic sleep pressure, suppresses slow-wave deep sleep (NREM stage 3), and delays sleep onset."
                }
            },
            {
                "@type": "Question",
                "name": "What factors influence individual caffeine metabolic speed?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Caffeine is metabolized primarily by the cytochrome P450 1A2 (CYP1A2) enzyme in the liver. Metabolic rate is altered by genetic polymorphisms (fast vs. slow CYP1A2 alleles), cigarette smoking (which accelerates breakdown), oral contraceptives, and pregnancy (which significantly prolong clearance)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum amount of caffeine safe to have in your system at bedtime?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Clinical sleep medicine research suggests maintaining residual caffeine levels below 25 mg to 30 mg at bedtime to minimize suppression of slow-wave deep sleep and reduce nighttime awakenings."
                }
            },
            {
                "@type": "Question",
                "name": "What is the recommended caffeine cutoff time before sleep?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most sleep specialists recommend stopping caffeine consumption at least 8 to 10 hours before your scheduled bedtime. For slow metabolizers or high doses (>300 mg), a cutoff window of 12 to 14 hours may be required."
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Consumption & Kinetics Parameters
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
                            {/* Caffeine Dose Input */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Coffee className="w-3.5 h-3.5 text-indigo-600" /> Caffeine Ingested (mg)
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                        {caffeineDoseMg} mg
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="2000"
                                        step="5"
                                        value={caffeineDoseMg === 0 ? "" : caffeineDoseMg}
                                        onChange={(e) => {
                                            handleNumberInput(e, (val) => setCaffeineDoseMg(Math.max(0, val)));
                                            setSelectedPresetId(null);
                                        }}
                                        className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        placeholder="e.g. 200"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mg</span>
                                </div>
                            </div>

                            {/* Time Controls: Consumption & Bedtime */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Sun className="w-3.5 h-3.5 text-amber-500" /> Intake Time
                                    </label>
                                    <input
                                        type="time"
                                        value={consumptionTime}
                                        onChange={(e) => setConsumptionTime(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Moon className="w-3.5 h-3.5 text-indigo-600" /> Target Bedtime
                                    </label>
                                    <input
                                        type="time"
                                        value={targetBedtime}
                                        onChange={(e) => setTargetBedtime(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Liver Enzyme & Physiological Modifier */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Activity className="w-3.5 h-3.5 text-indigo-600" /> CYP1A2 Metabolic Profile
                                </label>
                                <select
                                    value={metabolicModifierId}
                                    onChange={(e) => setMetabolicModifierId(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    {METABOLIC_MODIFIERS.map((mod) => (
                                        <option key={mod.id} value={mod.id}>
                                            {mod.label} ({mod.halfLifeMultiplier}x half-life)
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {METABOLIC_MODIFIERS.find((m) => m.id === metabolicModifierId)?.description}
                                </p>
                            </div>

                            {/* Base Half-Life & Sleep Disruption Threshold */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Baseline Half-Life
                                        </label>
                                        <span className="text-xs font-bold text-slate-600">{baseHalfLifeHours} hrs</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="3.0"
                                        max="8.0"
                                        step="0.5"
                                        value={baseHalfLifeHours}
                                        onChange={(e) => setBaseHalfLifeHours(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-0.5">
                                        <span>3.0h (Fast)</span>
                                        <span>5.0h (Avg)</span>
                                        <span>8.0h (Slow)</span>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Sleep Threshold
                                        </label>
                                        <span className="text-xs font-bold text-indigo-600">{sleepDisruptionThresholdMg} mg</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="60"
                                        step="5"
                                        value={sleepDisruptionThresholdMg}
                                        onChange={(e) => setSleepDisruptionThresholdMg(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-0.5">
                                        <span>10mg (Strict)</span>
                                        <span>25mg (Rec)</span>
                                        <span>60mg (Tolerant)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BEVERAGE PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Beverage Quick Select
                                </span>
                                {selectedPresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {BEVERAGE_PRESETS.map((preset) => {
                                    const isActive = selectedPresetId === preset.id;
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
                                                {preset.caffeineMg} mg
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Analysis"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Kinetics Engine & Sleep Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[660px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Pharmacokinetic Elimination Metrics
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("curve")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "curve" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Decay Curve
                                </button>
                                <button
                                    onClick={() => setActiveTab("table")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Hourly Schedule
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className={`p-5 rounded-2xl border ${kineticsResults.riskBg} ${kineticsResults.riskBorder} transition-all`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Active Caffeine at Bedtime ({targetBedtime})
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${kineticsResults.riskBg} ${kineticsResults.riskColor} ${kineticsResults.riskBorder}`}>
                                    {kineticsResults.disruptionRiskLevel} Sleep Risk
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className={`text-4xl md:text-5xl font-black ${kineticsResults.riskColor}`}>
                                    {kineticsResults.bedtimeRemainingMg}
                                </span>
                                <span className="text-sm font-semibold text-slate-500">
                                    mg active ({kineticsResults.bedtimeRemainingPct}% of initial dose)
                                </span>
                            </div>

                            {/* Visual Retention Bar */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div
                                        className={`h-full transition-all duration-500 ${kineticsResults.bedtimeRemainingMg > 50
                                            ? "bg-rose-500"
                                            : kineticsResults.bedtimeRemainingMg > sleepDisruptionThresholdMg
                                                ? "bg-amber-500"
                                                : "bg-emerald-500"
                                            }`}
                                        style={{
                                            width: `${Math.min(100, Math.max(0, kineticsResults.bedtimeRemainingPct))}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                    <span>0 mg (Cleared)</span>
                                    <span>Target Safe Limit: &le; {sleepDisruptionThresholdMg} mg</span>
                                    <span>{kineticsResults.doseMg} mg (Ingested)</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "curve" ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    {/* Recommended Cutoff Time */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Clock className="w-4 h-4 text-indigo-600" />
                                            Optimal Intake Cutoff
                                        </div>
                                        <p className="text-xl font-extrabold text-indigo-600 mt-1">
                                            {kineticsResults.formattedCutoffTime}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            To reach &lt;{sleepDisruptionThresholdMg} mg by {targetBedtime}
                                        </p>
                                    </div>

                                    {/* Effective Half-Life */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Activity className="w-4 h-4 text-indigo-600" />
                                            Biological Half-Life
                                        </div>
                                        <p className="text-xl font-extrabold text-slate-900 mt-1">
                                            {effectiveHalfLifeHours} <span className="text-xs font-normal text-slate-500">hours</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            CYP1A2 clearance velocity
                                        </p>
                                    </div>

                                    {/* Time to Sleep Safe Threshold */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Bed className="w-4 h-4 text-indigo-600" />
                                            Time to Sleep-Safe
                                        </div>
                                        <p className="text-xl font-extrabold text-slate-900 mt-1">
                                            {kineticsResults.hoursToSleepThreshold} <span className="text-xs font-normal text-slate-500">hours</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Until blood level &le; {sleepDisruptionThresholdMg} mg
                                        </p>
                                    </div>

                                    {/* Complete Clearance Time */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <TrendingDown className="w-4 h-4 text-indigo-600" />
                                            Complete Elimination
                                        </div>
                                        <p className="text-xl font-extrabold text-slate-900 mt-1">
                                            {kineticsResults.hoursToCleared} <span className="text-xs font-normal text-slate-500">hours</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Residual trace &lt; 5 mg
                                        </p>
                                    </div>
                                </div>

                                {/* Adenosine Antagonism Impact Note */}
                                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5">
                                    <Brain className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        <strong>Neurochemical Note:</strong> At bedtime, {kineticsResults.bedtimeRemainingMg} mg of caffeine continues to occupy adenosine receptors. Levels over 25–30 mg significantly truncate restorative Stage 3 Slow-Wave Deep Sleep and alter REM architecture.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Hourly Elimination Schedule Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Time Elapsed</th>
                                            <th className="p-2.5">Clock Time</th>
                                            <th className="p-2.5">Active Caffeine</th>
                                            <th className="p-2.5">Dose Retained</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {kineticsResults.decaySchedule.map((row) => {
                                            const isPastBedtime = row.hourOffset >= parsedTimeData.hoursUntilBedtime;
                                            return (
                                                <tr
                                                    key={row.hourOffset}
                                                    className={`transition ${isPastBedtime ? "bg-indigo-50/30" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 text-slate-900 font-semibold">+{row.hourOffset} hrs</td>
                                                    <td className="p-2.5 text-slate-600">{row.clockTime}</td>
                                                    <td className="p-2.5 font-bold text-slate-900">
                                                        {row.remainingMg} mg
                                                    </td>
                                                    <td className="p-2.5 text-slate-500">{row.pct}%</td>
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
                            Client-side Pharmacokinetics
                        </span>
                        <span>CYP1A2 First-Order Kinetics</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical & Pharmacokinetic Disclaimer:</strong> This calculator generates mathematical estimates based on first-order pharmacokinetic clearance equations. Individual metabolic rates vary widely due to genetics, liver function, medications, and age. This tool is intended solely for educational purposes and should not be used as medical advice or clinical diagnostic guidance.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO SECTIONS */}
            <div className="space-y-6">

                {/* Card 1: Pharmacokinetics & The Mathematics of Caffeine Elimination */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Caffeine Pharmacokinetics & Elimination Curves
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Caffeine (1,3,7-trimethylxanthine) is one of the most widely consumed central nervous system stimulants in the world. Upon oral ingestion, caffeine is rapidly and completely absorbed through the gastrointestinal tract, achieving peak plasma concentration ({"$C_{\\max}$"}) within 30 to 60 minutes.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The clearance of caffeine follows <strong>first-order elimination kinetics</strong>, meaning a constant fraction of the drug is eliminated per unit of time rather than a fixed milligram quantity. Because of this exponential decay, a portion of every dose remains active in your bloodstream for many hours after its perceptible stimulating effects have subsided.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-600" /> Biological Half-Life ({"$t_{1/2}$"})
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The biological half-life represents the duration required for the total plasma concentration to decrease by exactly 50%. In healthy non-smoking adults, this duration averages 5.0 hours (ranging clinically between 3.0 and 7.0 hours).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-indigo-600" /> Quarter-Life Dynamics ({"$t_{1/4}$"})
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Two consecutive half-lives represent the quarter-life (typically 10 to 12 hours). Consuming 300 mg of caffeine at 1:00 PM means approximately 75 mg remains circulating at 11:00 PM—equivalent to drinking a full cup of black tea right before bed.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> First-Order Elimination Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            Mathematical models powering this simulation engine:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Elimination Rate Constant:</strong> {"$k = \\frac{\\ln(2)}{t_{1 / 2}} \\approx \\frac{0.69315}{t_{1 / 2}}$"}</div>
                            <div><strong>2. Blood Concentration at Time $t$:</strong> {"$C(t) = C_0 \\cdot e^{-k \\cdot t}$"}</div>
                            <div><strong>3. Time Required to Reach Target Level {"$C_{\\text{target}}$"}:</strong> {"$t = \\frac{\\ln(C_0) - \\ln(C_{\\text{target}})}{k}$"}</div>
                            <div><strong>4. Recommended Bedtime Intake Cutoff:</strong> {"$\\text{Cutoff Time} = \\text{Bedtime} - t_{\\text{sleep\\_safe}}$"}</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Adenosine Receptors & Sleep Disruption Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Neurobiology: How Residual Caffeine Disrupts Sleep Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand why caffeine taken in the afternoon disrupts nighttime sleep, one must examine <strong>adenosine homeostasis</strong>. Throughout waking hours, brain neurons break down adenosine triphosphate (ATP) for energy, releasing free adenosine. Adenosine accumulates continuously in the basal forebrain, binding to {"$A_1$"} and {"$A_{2A}$"} receptors to generate biological "sleep pressure" (the natural urge to sleep).
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Moon className="w-4 h-4 text-indigo-600" /> Competitive Antagonism
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Caffeine shares a molecular structure nearly identical to adenosine. It fits into adenosine receptors without activating them, acting as a competitive inhibitor that blocks your brain from sensing fatigue.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Bed className="w-4 h-4 text-indigo-600" /> Truncation of Slow-Wave Sleep
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Polysomnography studies prove that bedtime caffeine reduces Stage 3 Non-REM (Slow-Wave Deep Sleep) by up to 20–30%, depriving the brain of restorative cellular repair and memory consolidation.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4 text-indigo-600" /> Sleep Latency & Fragmentation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Even in individuals who claim they can "fall asleep instantly after coffee", circulating caffeine increases micro-arousals, elevates resting heart rate, and causes premature morning awakenings.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Common Beverages & Caffeine Content Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Caffeine Content & Sleep Disruption Reference Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Caffeine dosage varies substantially across popular beverages and supplements. Use the reference matrix below to assess typical caffeine loads and their estimated minimum clearance requirements:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Beverage / Source</th>
                                    <th className="p-3">Serving Size</th>
                                    <th className="p-3">Avg Caffeine</th>
                                    <th className="p-3">Time to &lt;25mg (Sleep-Safe)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Espresso (Single Shot)</td>
                                    <td className="p-3">1 oz (30 ml)</td>
                                    <td className="p-3 font-bold text-indigo-600">64 mg</td>
                                    <td className="p-3">~6.8 hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Standard Drip Coffee</td>
                                    <td className="p-3">8 oz (240 ml)</td>
                                    <td className="p-3 font-bold text-indigo-600">96 mg</td>
                                    <td className="p-3">~9.7 hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Matcha Green Tea</td>
                                    <td className="p-3">8 oz (240 ml)</td>
                                    <td className="p-3 font-bold text-indigo-600">70 mg</td>
                                    <td className="p-3">~7.4 hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cold Brew Coffee</td>
                                    <td className="p-3">12 oz (355 ml)</td>
                                    <td className="p-3 font-bold text-indigo-600">205 mg</td>
                                    <td className="p-3">~15.1 hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Coffeehouse Medium Roast (16oz)</td>
                                    <td className="p-3">16 oz (480 ml)</td>
                                    <td className="p-3 font-bold text-rose-600">310 mg</td>
                                    <td className="p-3">~18.1 hours</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Pre-Workout Supplement</td>
                                    <td className="p-3">1 scoop (10 g)</td>
                                    <td className="p-3 font-bold text-rose-600">250–350 mg</td>
                                    <td className="p-3">~16.5–19.0 hours</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Factors Modifying Hepatic CYP1A2 Clearance */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Genetic & Lifestyle Factors That Alter Your Half-Life
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Over 95% of caffeine clearance is handled by the <strong>cytochrome P450 1A2 (CYP1A2)</strong> enzyme in the liver. Individual variation in caffeine half-life can range from 2.5 hours to more than 12 hours depending on specific biological variables:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Flame className="w-4 h-4 text-indigo-600" /> Factors That Accelerate Clearance (Shorter Half-Life)
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                                <li><strong>CYP1A2*1A "Fast" Allele:</strong> Homozygous carriers breakdown caffeine up to 30% faster than average individuals.</li>
                                <li><strong>Cigarette & Nicotine Use:</strong> Polycyclic aromatic hydrocarbons induce CYP1A2 activity, reducing half-life by 30–50%.</li>
                                <li><strong>Cruciferous Vegetables:</strong> High consumption of broccoli and Brussels sprouts mildly upregulates hepatic CYP1A2 enzymes.</li>
                            </ul>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Factors That Slow Clearance (Extended Half-Life)
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                                <li><strong>CYP1A2*1F "Slow" Allele:</strong> Decreased enzyme transcription prolongs caffeine retention significantly.</li>
                                <li><strong>Oral Contraceptives / Estrogen:</strong> Birth control pills inhibit CYP1A2, increasing half-life from 5 hours to 8–10 hours.</li>
                                <li><strong>Pregnancy (3rd Trimester):</strong> Clearance slows drastically, with half-lives frequently exceeding 10 to 15 hours.</li>
                                <li><strong>Selective Serotonin Reuptake Inhibitors:</strong> Medications like fluvoxamine strongly inhibit CYP1A2 metabolism.</li>
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
                                What is caffeine half-life?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Caffeine half-life is the time required for your body to metabolize and eliminate 50% of the ingested caffeine from your bloodstream. For an average healthy adult, this ranges between 4 and 6 hours.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does coffee in the afternoon ruin sleep even if I fall asleep easily?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While caffeine tolerance may allow you to fall asleep, residual caffeine molecules continue blocking adenosine receptors throughout the night. This suppresses Stage 3 Slow-Wave Deep Sleep, leads to frequent micro-arousals, and causes you to wake up feeling unrefreshed.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the recommended caffeine cutoff time before bed?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sleep physicians recommend ceasing all caffeine consumption at least 8 to 10 hours before sleep. If you consume large doses (&gt;250 mg) or are a slow metabolizer, a cutoff window of 12 to 14 hours is optimal.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much caffeine is considered safe to have at bedtime?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Clinical studies suggest aiming for less than 25 mg to 30 mg of active caffeine at bedtime. Keeping levels below this threshold prevents significant disruption to deep sleep and REM cycles.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can drinking water flush caffeine out of your system faster?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Drinking water helps prevent dehydration caused by caffeine's mild diuretic effect, but it does not accelerate the enzymatic clearance rate in your liver. Caffeine must be processed by CYP1A2 enzymes at its fixed biochemical rate.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final Mandatory Medical Disclaimer */}
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