"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
    Heart,
    Flame,
    Zap,
    Scale,
    Timer,
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
    Target,
    CheckCircle2,
    Layers,
    Stethoscope,
    Footprints,
    Wind
} from "lucide-react";

type UnitSystem = "metric" | "imperial";
type Gender = "male" | "female";
type CalculationMethod = "resting-hr" | "cooper" | "one-mile-walk" | "step-test";

interface MethodConfig {
    id: CalculationMethod;
    name: string;
    description: string;
    tag: string;
}

const METHODS: MethodConfig[] = [
    { id: "resting-hr", name: "Resting HR Ratio", description: "Uth–Sørensen–Overgaard–Pedersen formula based on resting heart rate", tag: "No Workout Needed" },
    { id: "cooper", name: "Cooper 12-Min Run", description: "Standard field aerobic test measuring distance covered in 12 minutes", tag: "Runners" },
    { id: "one-mile-walk", name: "Rockport 1-Mile Walk", description: "Submaximal walking protocol factoring walk duration and finishing HR", tag: "Low Impact" },
    { id: "step-test", name: "YMCA 3-Min Step Test", description: "Standard bench stepping recovery pulse rating", tag: "Indoor / Gym" },
];

interface FitnessNorm {
    gender: Gender;
    ageMin: number;
    ageMax: number;
    veryPoor: number;
    poor: number;
    fair: number;
    good: number;
    excellent: number;
    superior: number;
}

const VO2_NORMS: FitnessNorm[] = [
    // Males
    { gender: "male", ageMin: 18, ageMax: 29, veryPoor: 33.0, poor: 36.4, fair: 42.4, good: 46.4, excellent: 52.4, superior: 52.5 },
    { gender: "male", ageMin: 30, ageMax: 39, veryPoor: 31.5, poor: 35.4, fair: 40.9, good: 44.9, excellent: 49.4, superior: 49.5 },
    { gender: "male", ageMin: 40, ageMax: 49, veryPoor: 30.2, poor: 33.5, fair: 38.9, good: 43.7, excellent: 48.0, superior: 48.1 },
    { gender: "male", ageMin: 50, ageMax: 59, veryPoor: 26.1, poor: 30.9, fair: 35.7, good: 40.0, excellent: 45.3, superior: 45.4 },
    { gender: "male", ageMin: 60, ageMax: 99, veryPoor: 20.5, poor: 26.0, fair: 32.2, good: 36.4, excellent: 44.2, superior: 44.3 },
    // Females
    { gender: "female", ageMin: 18, ageMax: 29, veryPoor: 23.6, poor: 28.9, fair: 32.9, good: 36.9, excellent: 41.0, superior: 41.1 },
    { gender: "female", ageMin: 30, ageMax: 39, veryPoor: 22.8, poor: 26.9, fair: 31.4, good: 35.6, excellent: 40.0, superior: 40.1 },
    { gender: "female", ageMin: 40, ageMax: 49, veryPoor: 21.0, poor: 24.4, fair: 28.9, good: 32.8, excellent: 36.9, superior: 37.0 },
    { gender: "female", ageMin: 50, ageMax: 59, veryPoor: 20.2, poor: 22.7, fair: 26.9, good: 31.4, excellent: 35.7, superior: 35.8 },
    { gender: "female", ageMin: 60, ageMax: 99, veryPoor: 17.5, poor: 20.1, fair: 24.4, good: 30.2, excellent: 31.4, superior: 31.5 },
];

interface FitnessRating {
    level: string;
    color: string;
    bgColor: string;
    borderColor: string;
    percentile: string;
    description: string;
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
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseFloat(cleaned);
    setter(isNaN(num) ? 0 : num);
};

export default function Vo2MaxCalculator() {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
    const [method, setMethod] = useState<CalculationMethod>("resting-hr");
    const [gender, setGender] = useState<Gender>("male");
    const [age, setAge] = useState<number>(30);
    const [restingHr, setRestingHr] = useState<number>(62);

    // Weight parameters
    const [weightKg, setWeightKg] = useState<number>(75);
    const [weightLbs, setWeightLbs] = useState<number>(165);

    // Method-specific inputs
    // Cooper (Distance covered in 12 mins)
    const [cooperMeters, setCooperMeters] = useState<number>(2400);
    const [cooperMiles, setCooperMiles] = useState<number>(1.5);

    // Rockport 1-mile walk (Time & Post HR)
    const [walkMinutes, setWalkMinutes] = useState<number>(14);
    const [walkSeconds, setWalkSeconds] = useState<number>(30);
    const [postWalkHr, setPostWalkHr] = useState<number>(128);

    // YMCA Step Test (1-min recovery pulse count)
    const [recoveryPulse1Min, setRecoveryPulse1Min] = useState<number>(92);

    // UI state
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"zones" | "norms">("zones");

    const exportRef = useRef<HTMLDivElement>(null);

    // Synchronize weights between systems
    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;
        if (system === "metric") {
            setWeightKg(Math.round((weightLbs || 0) * 0.453592));
            setCooperMeters(Math.round((cooperMiles || 0) * 1609.34));
        } else {
            setWeightLbs(Math.round((weightKg || 0) * 2.20462));
            setCooperMiles(Number(((cooperMeters || 0) / 1609.34).toFixed(2)));
        }
        setUnitSystem(system);
    };

    const effectiveWeightLbs = useMemo(() => {
        if (unitSystem === "imperial") return weightLbs || 0;
        return (weightKg || 0) * 2.20462;
    }, [unitSystem, weightKg, weightLbs]);

    const effectiveWeightKg = useMemo(() => {
        if (unitSystem === "metric") return weightKg || 0;
        return (weightLbs || 0) * 0.453592;
    }, [unitSystem, weightKg, weightLbs]);

    // Maximum Heart Rate (Tanaka formula: 208 - 0.7 * age)
    const maxHr = useMemo(() => {
        return Math.round(208 - (0.7 * (age || 30)));
    }, [age]);

    // Heart Rate Reserve (HRR) = Max HR - Resting HR
    const hrr = useMemo(() => {
        return Math.max(20, maxHr - (restingHr || 60));
    }, [maxHr, restingHr]);

    // Calculate VO2 Max based on chosen clinical methodology
    const calculatedVo2Max = useMemo(() => {
        if (age <= 0) return 0;

        let vo2 = 0;

        switch (method) {
            case "resting-hr": {
                // Uth–Sørensen–Overgaard–Pedersen formula: VO2 max = 15.3 × (HRmax / HRrest)
                if (restingHr > 30) {
                    vo2 = 15.3 * (maxHr / restingHr);
                }
                break;
            }
            case "cooper": {
                // Cooper test: VO2 max = (Distance in meters - 504.9) / 44.73
                const distM = unitSystem === "metric" ? cooperMeters : cooperMiles * 1609.34;
                if (distM > 504.9) {
                    vo2 = (distM - 504.9) / 44.73;
                }
                break;
            }
            case "one-mile-walk": {
                // Rockport 1-Mile Walk Test formula:
                // VO2 = 132.853 - (0.0769 × Weight_lbs) - (0.3877 × Age) + (6.315 × Gender) - (3.2649 × Time_min) - (0.1565 × HR)
                // Gender: Male = 1, Female = 0
                const genderVal = gender === "male" ? 1 : 0;
                const totalWalkTimeMin = (walkMinutes || 0) + (walkSeconds || 0) / 60;
                if (totalWalkTimeMin > 0 && postWalkHr > 0 && effectiveWeightLbs > 0) {
                    vo2 = 132.853
                        - (0.0769 * effectiveWeightLbs)
                        - (0.3877 * age)
                        + (6.315 * genderVal)
                        - (3.2649 * totalWalkTimeMin)
                        - (0.1565 * postWalkHr);
                }
                break;
            }
            case "step-test": {
                // YMCA 3-Minute Step Test (Recovery pulse correlation regression)
                // Men: VO2 = 111.33 - (0.42 × recovery HR)
                // Women: VO2 = 65.81 - (0.1847 × recovery HR)
                if (recoveryPulse1Min > 40) {
                    if (gender === "male") {
                        vo2 = 111.33 - (0.42 * recoveryPulse1Min);
                    } else {
                        vo2 = 65.81 - (0.1847 * recoveryPulse1Min);
                    }
                }
                break;
            }
        }

        return Math.max(10, Math.min(95, Number(vo2.toFixed(1))));
    }, [method, age, maxHr, restingHr, unitSystem, cooperMeters, cooperMiles, effectiveWeightLbs, gender, walkMinutes, walkSeconds, postWalkHr, recoveryPulse1Min]);

    // METs (Metabolic Equivalent of Task) = VO2 Max / 3.5
    const mets = useMemo(() => {
        return Number((calculatedVo2Max / 3.5).toFixed(1));
    }, [calculatedVo2Max]);

    // Fitness Classification Category
    const fitnessCategory = useMemo<FitnessRating>(() => {
        const norm = VO2_NORMS.find(
            (n) => n.gender === gender && age >= n.ageMin && age <= n.ageMax
        ) || VO2_NORMS[0];

        const score = calculatedVo2Max;

        if (score >= norm.superior) {
            return {
                level: "Superior",
                color: "text-purple-700",
                bgColor: "bg-purple-50",
                borderColor: "border-purple-200",
                percentile: "Top 5%",
                description: "Elite endurance capacity associated with maximum cardiovascular longevity and peak aerobic performance.",
            };
        }
        if (score >= norm.excellent) {
            return {
                level: "Excellent",
                color: "text-emerald-700",
                bgColor: "bg-emerald-50",
                borderColor: "border-emerald-200",
                percentile: "80th–95th Percentile",
                description: "Robust cardiorespiratory capacity, substantially lowering risks of metabolic and vascular diseases.",
            };
        }
        if (score >= norm.good) {
            return {
                level: "Good",
                color: "text-blue-700",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                percentile: "60th–79th Percentile",
                description: "Healthy baseline aerobic fitness exceeding standard sedentary population thresholds.",
            };
        }
        if (score >= norm.fair) {
            return {
                level: "Fair",
                color: "text-amber-700",
                bgColor: "bg-amber-50",
                borderColor: "border-amber-200",
                percentile: "40th–59th Percentile",
                description: "Moderate aerobic conditioning. Targeted zone 2 cardiovascular training is recommended.",
            };
        }
        if (score >= norm.poor) {
            return {
                level: "Poor",
                color: "text-orange-700",
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
                percentile: "20th–39th Percentile",
                description: "Below average cardiovascular capacity. Elevated risk for fatigue and cardiovascular stress.",
            };
        }
        return {
            level: "Very Poor",
            color: "text-rose-700",
            bgColor: "bg-rose-50",
            borderColor: "border-rose-200",
            percentile: "Bottom 20%",
            description: "Critically low aerobic reserve. Progressive aerobic conditioning under medical guidance is recommended.",
        };
    }, [calculatedVo2Max, gender, age]);

    // Karvonen Target Heart Rate Training Zones
    const heartRateZones = useMemo(() => {
        const calculateZoneBpm = (intensityMin: number, intensityMax: number) => {
            const minBpm = Math.round(restingHr + hrr * intensityMin);
            const maxBpm = Math.round(restingHr + hrr * intensityMax);
            return `${minBpm} – ${maxBpm} BPM`;
        };

        return [
            {
                zone: "Zone 1",
                name: "Active Recovery",
                intensity: "50% – 60% HRR",
                bpm: calculateZoneBpm(0.50, 0.60),
                benefit: "Promotes circulation, accelerates recovery, and builds baseline capillary beds.",
            },
            {
                zone: "Zone 2",
                name: "Aerobic Base / Fat Oxidation",
                intensity: "60% – 70% HRR",
                bpm: calculateZoneBpm(0.60, 0.70),
                benefit: "Maximizes mitochondrial density, fat metabolism, and sustained endurance volume.",
            },
            {
                zone: "Zone 3",
                name: "Tempo / Aerobic Endurance",
                intensity: "70% – 80% HRR",
                bpm: calculateZoneBpm(0.70, 0.80),
                benefit: "Improves cardiovascular efficiency and increases lung glycogen storage capacity.",
            },
            {
                zone: "Zone 4",
                name: "Lactate Threshold",
                intensity: "80% – 90% HRR",
                bpm: calculateZoneBpm(0.80, 0.90),
                benefit: "Raises anaerobic threshold, clearing blood lactate under sustained high output.",
            },
            {
                zone: "Zone 5",
                name: "VO2 Max / Anaerobic Peak",
                intensity: "90% – 100% HRR",
                bpm: calculateZoneBpm(0.90, 1.00),
                benefit: "Stimulates maximum oxygen consumption, cardiac stroke volume, and peak sprint speed.",
            },
        ];
    }, [restingHr, hrr]);

    // Estimated Fitness Age calculation
    const fitnessAge = useMemo(() => {
        const baseNorms = VO2_NORMS.filter((n) => n.gender === gender);
        for (const bracket of baseNorms) {
            if (calculatedVo2Max >= bracket.good) {
                return Math.round((bracket.ageMin + bracket.ageMax) / 2);
            }
        }
        return Math.min(80, age + 8);
    }, [calculatedVo2Max, gender, age]);

    const handleReset = () => {
        setUnitSystem("metric");
        setMethod("resting-hr");
        setGender("male");
        setAge(30);
        setRestingHr(62);
        setWeightKg(75);
        setWeightLbs(165);
        setCooperMeters(2400);
        setCooperMiles(1.5);
        setWalkMinutes(14);
        setWalkSeconds(30);
        setPostWalkHr(128);
        setRecoveryPulse1Min(92);
    };

    const handleCopySummary = () => {
        const summaryText = `Target VO2 Max & Cardiovascular Fitness Assessment (TwisterTools):
--------------------------------------------------
Demographics: ${age} Yrs | ${gender.toUpperCase()} | ${unitSystem === "metric" ? `${weightKg} kg` : `${weightLbs} lbs`}
Assessment Protocol: ${METHODS.find(m => m.id === method)?.name}
--------------------------------------------------
Estimated VO2 Max: ${calculatedVo2Max} mL/kg/min
Cardiovascular Rating: ${fitnessCategory.level} (${fitnessCategory.percentile})
Metabolic Equivalent (METs): ${mets} METs
Estimated Fitness Age: ~${fitnessAge} Years
Max Heart Rate: ${maxHr} BPM | Resting HR: ${restingHr} BPM
Target Zone 2 (Aerobic Base): ${heartRateZones[1].bpm}
Target Zone 5 (VO2 Max): ${heartRateZones[4].bpm}
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/vo2-max-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Cardiovascular Metric", "Value", "Unit / Classification"];
        const rows = [
            ["Estimated VO2 Max", `${calculatedVo2Max}`, "mL/kg/min"],
            ["Cardiovascular Rating", fitnessCategory.level, fitnessCategory.percentile],
            ["Metabolic Equivalent (METs)", `${mets}`, "METs"],
            ["Estimated Fitness Age", `~${fitnessAge}`, "Years"],
            ["Max Heart Rate (Tanaka)", `${maxHr}`, "BPM"],
            ["Resting Heart Rate", `${restingHr}`, "BPM"],
            ["Heart Rate Reserve (HRR)", `${hrr}`, "BPM"],
            ["Zone 1 (Active Recovery)", heartRateZones[0].bpm, "50-60% HRR"],
            ["Zone 2 (Aerobic Base)", heartRateZones[1].bpm, "60-70% HRR"],
            ["Zone 3 (Tempo)", heartRateZones[2].bpm, "70-80% HRR"],
            ["Zone 4 (Lactate Threshold)", heartRateZones[3].bpm, "80-90% HRR"],
            ["Zone 5 (VO2 Max Peak)", heartRateZones[4].bpm, "90-100% HRR"],
            ["Assessment Protocol", METHODS.find(m => m.id === method)?.name || method, "Clinical Protocol"],
            ["Biological Sex", gender, "Demographic"],
            ["Chronological Age", `${age}`, "Years"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `vo2_max_cardiovascular_assessment.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Target VO2 Max & Cardiovascular Fitness Estimator",
        "url": "https://twistertools.com/tools/calculators/vo2-max-calculator",
        "description": "Calculate VO2 max, METs score, estimated fitness age, and Karvonen heart rate training zones using resting heart rate, Cooper 12-min, or Rockport 1-mile protocols.",
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
                "name": "What is VO2 max and why is it considered the gold standard of fitness?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "VO2 max (maximal oxygen consumption) measures the maximum volume of oxygen your body can transport and utilize per minute per kilogram of body weight (mL/kg/min) during exhaustive aerobic exercise. It reflects the integrated functional capacity of the pulmonary, cardiovascular, and muscular systems."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Uth-Sørensen-Overgaard-Pedersen resting heart rate formula work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Uth formula estimates VO2 max without exhaustive exercise using the ratio of maximum heart rate to resting heart rate: VO2 max ≈ 15.3 × (HRmax / HRrest). It is based on the physiological relationship between resting cardiac stroke volume and maximal aerobic power."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between VO2 max and Metabolic Equivalent of Task (METs)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "1 MET represents resting metabolic oxygen consumption at standard conditions, defined as 3.5 mL of oxygen per kilogram of body weight per minute (3.5 mL/kg/min). Your VO2 max score divided by 3.5 yields your peak functional MET capacity."
                }
            },
            {
                "@type": "Question",
                "name": "How can I use Karvonen Heart Rate Reserve (HRR) zones to improve VO2 max?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Karvonen formula accounts for individual resting heart rates: Target HR = HRrest + (HRmax - HRrest) × %Intensity. A polarized training distribution combining 80% low-intensity Zone 2 volume with 20% high-intensity Zone 4/5 intervals produces optimal VO2 max adaptations."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered a good VO2 max for my age and biological sex?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "VO2 max naturally declines by approximately 1% per year after age 25–30. For males aged 20–29, an excellent score exceeds 52 mL/kg/min; for females of the same age, excellent is above 41 mL/kg/min. Elite endurance athletes often exceed 70–85 mL/kg/min."
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
                {/* Left Workspace Panel: Protocol Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-indigo-600" />
                                Protocol & Physiological Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System & Assessment Method Selectors */}
                        <div className="space-y-4 mb-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Measurement System
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitToggle("metric")}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Metric (kg, km, meters)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitToggle("imperial")}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Imperial (lbs, miles)
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <Wind className="w-3.5 h-3.5 text-indigo-600" /> Assessment Protocol
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {METHODS.map((m) => {
                                        const isActive = method === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setMethod(m.id)}
                                                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${isActive
                                                    ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500"
                                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-bold ${isActive ? "text-indigo-900" : "text-slate-900"}`}>
                                                        {m.name}
                                                    </span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${isActive ? "bg-indigo-200/80 text-indigo-800" : "bg-slate-200 text-slate-600"}`}>
                                                        {m.tag}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                                    {m.description}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Baseline Demographics */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Biological Sex
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setGender("male")}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${gender === "male"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Male
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender("female")}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${gender === "female"
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
                                        min="15"
                                        max="100"
                                        value={age === 0 ? "" : age}
                                        onChange={(e) => handleNumberInput(e, (val) => setAge(val === 0 ? 0 : Math.max(15, Math.min(100, val))))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Protocol-Specific Input Sets */}
                            {method === "resting-hr" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 pt-1">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Heart className="w-3.5 h-3.5 text-rose-500" /> Resting Heart Rate
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="35"
                                                max="120"
                                                value={restingHr === 0 ? "" : restingHr}
                                                onChange={(e) => handleNumberInput(e, (val) => setRestingHr(Math.max(30, Math.min(140, val))))}
                                                className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">BPM</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex flex-col justify-center">
                                        <span className="text-[11px] font-bold text-indigo-900 uppercase">Estimated Tanaka Max HR</span>
                                        <span className="text-lg font-black text-indigo-700">{maxHr} BPM</span>
                                        <span className="text-[10px] text-slate-500">Formula: 208 - (0.7 × Age)</span>
                                    </div>
                                </div>
                            )}

                            {method === "cooper" && (
                                <div className="space-y-3 pt-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Footprints className="w-3.5 h-3.5 text-indigo-600" /> 12-Minute Covered Distance
                                    </label>
                                    {unitSystem === "metric" ? (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="50"
                                                min="500"
                                                max="5000"
                                                value={cooperMeters === 0 ? "" : cooperMeters}
                                                onChange={(e) => handleNumberInput(e, (val) => setCooperMeters(Math.max(500, val)))}
                                                className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">meters</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.05"
                                                min="0.3"
                                                max="3.5"
                                                value={cooperMiles === 0 ? "" : cooperMiles}
                                                onChange={(e) => handleNumberInput(e, (val) => setCooperMiles(Math.max(0.3, val)))}
                                                className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">miles</span>
                                        </div>
                                    )}
                                    <p className="text-[11px] text-slate-500">Run or walk at maximum sustainable effort around a flat track for 12 continuous minutes.</p>
                                </div>
                            )}

                            {method === "one-mile-walk" && (
                                <div className="space-y-4 pt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                <Scale className="w-3.5 h-3.5 text-indigo-600" /> Body Weight
                                            </label>
                                            <div className="relative">
                                                {unitSystem === "metric" ? (
                                                    <input
                                                        type="number"
                                                        min="30"
                                                        max="250"
                                                        value={weightKg === 0 ? "" : weightKg}
                                                        onChange={(e) => handleNumberInput(e, (val) => setWeightKg(Math.max(30, val)))}
                                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    />
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="70"
                                                        max="550"
                                                        value={weightLbs === 0 ? "" : weightLbs}
                                                        onChange={(e) => handleNumberInput(e, (val) => setWeightLbs(Math.max(70, val)))}
                                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                    />
                                                )}
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                    {unitSystem === "metric" ? "kg" : "lbs"}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5 text-rose-500" /> Post-Walk HR (10s pulse × 6)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="60"
                                                    max="200"
                                                    value={postWalkHr === 0 ? "" : postWalkHr}
                                                    onChange={(e) => handleNumberInput(e, (val) => setPostWalkHr(Math.max(50, Math.min(220, val))))}
                                                    className="w-full pl-3 pr-12 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">BPM</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                            <Timer className="w-3.5 h-3.5 text-indigo-600" /> 1-Mile Walk Duration
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="8"
                                                    max="35"
                                                    value={walkMinutes === 0 ? "" : walkMinutes}
                                                    onChange={(e) => handleNumberInput(e, (val) => setWalkMinutes(Math.max(5, Math.min(60, val))))}
                                                    className="w-full pl-3 pr-12 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">min</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={walkSeconds === 0 ? "" : walkSeconds}
                                                    onChange={(e) => handleNumberInput(e, (val) => setWalkSeconds(Math.max(0, Math.min(59, val))))}
                                                    className="w-full pl-3 pr-12 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">sec</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === "step-test" && (
                                <div className="space-y-3 pt-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-600" /> 1-Minute Recovery Heart Rate
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="45"
                                            max="180"
                                            value={recoveryPulse1Min === 0 ? "" : recoveryPulse1Min}
                                            onChange={(e) => handleNumberInput(e, (val) => setRecoveryPulse1Min(Math.max(40, Math.min(200, val))))}
                                            className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">beats/min</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">Step up and down on a 12-inch bench at 24 steps/min for 3 minutes. Sit immediately and count total heartbeats for 1 full minute.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Assessment"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Karvonen Zones & Normative Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Aerobic Capacity Output
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("zones")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "zones" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Target Zones
                                </button>
                                <button
                                    onClick={() => setActiveTab("norms")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "norms" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Normative Table
                                </button>
                            </div>
                        </div>

                        {/* Hero Metric Box */}
                        <div className={`p-5 rounded-2xl border ${fitnessCategory.bgColor} ${fitnessCategory.borderColor} transition-all`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Estimated Maximal Oxygen Consumption
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${fitnessCategory.bgColor} ${fitnessCategory.color} ${fitnessCategory.borderColor}`}>
                                    {fitnessCategory.level} ({fitnessCategory.percentile})
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className={`text-4xl md:text-5xl font-black ${fitnessCategory.color}`}>
                                    {calculatedVo2Max > 0 ? calculatedVo2Max : "--"}
                                </span>
                                <span className="text-xs font-semibold text-slate-600">mL / kg / min</span>
                            </div>
                            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                                {fitnessCategory.description}
                            </p>

                            {/* Visual Spectrum Bar */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div className="bg-rose-500 h-full w-[20%]" title="Very Poor" />
                                    <div className="bg-orange-400 h-full w-[15%]" title="Poor" />
                                    <div className="bg-amber-400 h-full w-[15%]" title="Fair" />
                                    <div className="bg-blue-500 h-full w-[20%]" title="Good" />
                                    <div className="bg-emerald-500 h-full w-[15%]" title="Excellent" />
                                    <div className="bg-purple-600 h-full w-[15%]" title="Superior" />

                                    {calculatedVo2Max > 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border-x border-white shadow-md transform -translate-x-1/2 transition-all duration-500"
                                            style={{
                                                left: `${Math.min(100, Math.max(0, ((calculatedVo2Max - 15) / 60) * 100))}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>15</span>
                                    <span>30</span>
                                    <span>45</span>
                                    <span>60</span>
                                    <span>75+ mL/kg/min</span>
                                </div>
                            </div>
                        </div>

                        {/* Metric Sub-Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Zap className="w-4 h-4 text-indigo-600" />
                                    MET Capacity
                                </div>
                                <p className="text-lg font-extrabold text-slate-900 mt-1">
                                    {mets} <span className="text-xs font-normal text-slate-500">METs</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    VO2 / 3.5 baseline
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Flame className="w-4 h-4 text-indigo-600" />
                                    Fitness Age
                                </div>
                                <p className="text-lg font-extrabold text-indigo-600 mt-1">
                                    ~{fitnessAge} <span className="text-xs font-normal text-slate-500">Yrs</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Aerobic age match
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                    <Heart className="w-4 h-4 text-indigo-600" />
                                    Reserve (HRR)
                                </div>
                                <p className="text-lg font-extrabold text-slate-900 mt-1">
                                    {hrr} <span className="text-xs font-normal text-slate-500">BPM</span>
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Max HR - Rest HR
                                </p>
                            </div>
                        </div>

                        {/* Interactive Tab Panels */}
                        {activeTab === "zones" ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Karvonen Target Heart Rate Zones
                                    </span>
                                    <span className="text-[11px] text-slate-500">Rest HR: {restingHr} BPM | Max: {maxHr} BPM</span>
                                </div>
                                <div className="space-y-2">
                                    {heartRateZones.map((z, idx) => (
                                        <div
                                            key={z.zone}
                                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${idx === 1
                                                ? "bg-emerald-50/60 border-emerald-200"
                                                : idx === 4
                                                    ? "bg-purple-50/60 border-purple-200"
                                                    : "bg-slate-50 border-slate-200/80"
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900">{z.zone}: {z.name}</span>
                                                    <span className="text-[10px] font-semibold text-slate-500 px-1.5 py-0.5 bg-white rounded border border-slate-200">{z.intensity}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{z.benefit}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <span className="text-sm font-bold text-indigo-700 font-mono">{z.bpm}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Age Bracket</th>
                                            <th className="p-2.5">Poor</th>
                                            <th className="p-2.5">Fair</th>
                                            <th className="p-2.5">Good</th>
                                            <th className="p-2.5">Excellent</th>
                                            <th className="p-2.5">Superior</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {VO2_NORMS.filter(n => n.gender === gender).map((row) => {
                                            const isUserRow = age >= row.ageMin && age <= row.ageMax;
                                            return (
                                                <tr
                                                    key={`${row.gender}-${row.ageMin}`}
                                                    className={`transition ${isUserRow ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 flex items-center gap-1">
                                                        {isUserRow && <CheckCircle2 className="w-3 h-3 text-indigo-600" />}
                                                        <span>{row.ageMin}–{row.ageMax} yrs</span>
                                                    </td>
                                                    <td className="p-2.5 text-orange-600">&lt; {row.poor}</td>
                                                    <td className="p-2.5 text-amber-600">{row.poor}–{row.fair}</td>
                                                    <td className="p-2.5 text-blue-600">{row.fair}–{row.good}</td>
                                                    <td className="p-2.5 text-emerald-600">{row.good}–{row.excellent}</td>
                                                    <td className="p-2.5 text-purple-700">&gt; {row.superior}</td>
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
                            Client-Side Execution
                        </span>
                        <span>ACSM Standards</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated cardiovascular metrics for informational and educational purposes only. It is not intended as medical advice, clinical diagnosis, or prescription of high-intensity training regimens. Always consult a qualified physician or sports cardiologist prior to undertaking maximal physical testing or strenuous aerobic protocols.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Physiology & Clinical Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Physiological Principles & Clinical Estimation Formulas
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        <strong>VO2 max</strong>, or maximal oxygen uptake, is the internationally recognized gold standard for measuring cardiorespiratory fitness (CRF). It defines the maximum rate at which your pulmonary, cardiovascular, and muscular systems can uptake, transport, and utilize atmospheric oxygen during maximal incremental exercise. A higher VO2 max correlates strongly with improved athletic endurance, reduced cardiovascular disease incidence, and increased all-cause life expectancy.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-indigo-600" /> The Fick Principle
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Under the Fick Principle, VO2 max is the product of maximal cardiac output (Stroke Volume × HRmax) and maximal arteriovenous oxygen difference (a-vO2 diff). It reflects both central cardiac pumping efficiency and peripheral muscular capillary extraction.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> Karvonen HRR Integration
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Unlike basic percentage-of-max formulas, the Karvonen method accounts for individual resting heart rate differences, generating true metabolic training zones proportional to actual oxygen consumption percentages.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulas Executed by This Engine
                        </h3>
                        <p className="text-xs text-slate-300">
                            The following validated clinical formulas power this interactive estimator:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Tanaka Maximum HR:</strong> HRmax = 208 - (0.7 × Age)</div>
                            <div><strong>2. Uth-Sørensen Formula:</strong> VO2 max ≈ 15.3 × (HRmax / HRrest)</div>
                            <div><strong>3. Cooper 12-Min Test:</strong> VO2 max = (Distance in meters - 504.9) / 44.73</div>
                            <div><strong>4. Rockport 1-Mile Walk:</strong> VO2 max = 132.853 - (0.0769 × Weight_lbs) - (0.3877 × Age) + (6.315 × Gender) - (3.2649 × Time_min) - (0.1565 × HR) [Male=1, Female=0]</div>
                            <div><strong>5. YMCA Step Test:</strong> Men: 111.33 - (0.42 × RecHR) | Women: 65.81 - (0.1847 × RecHR)</div>
                            <div><strong>6. Karvonen Zone BPM:</strong> Target BPM = HRrest + (HRmax - HRrest) × %Intensity</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Normative Tables & Category Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            ACSM Cardiorespiratory Fitness Classification Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The American College of Sports Medicine (ACSM) and The Cooper Institute categorize aerobic fitness into normative percentile brackets across sex and age categories:
                    </p>

                    {/* Table: Comprehensive Normative Values */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Demographic Group</th>
                                    <th className="p-3">Very Poor</th>
                                    <th className="p-3">Fair</th>
                                    <th className="p-3">Good</th>
                                    <th className="p-3">Excellent</th>
                                    <th className="p-3">Superior (Elite)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Males (20–29 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 36.4</td>
                                    <td className="p-3 text-amber-600">36.5 – 42.4</td>
                                    <td className="p-3 text-blue-600">42.5 – 46.4</td>
                                    <td className="p-3 text-emerald-600">46.5 – 52.4</td>
                                    <td className="p-3 text-purple-700">&gt; 52.5 mL/kg/min</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Males (30–39 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 35.4</td>
                                    <td className="p-3 text-amber-600">35.5 – 40.9</td>
                                    <td className="p-3 text-blue-600">41.0 – 44.9</td>
                                    <td className="p-3 text-emerald-600">45.0 – 49.4</td>
                                    <td className="p-3 text-purple-700">&gt; 49.5 mL/kg/min</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Males (40–49 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 33.5</td>
                                    <td className="p-3 text-amber-600">33.6 – 38.9</td>
                                    <td className="p-3 text-blue-600">39.0 – 43.7</td>
                                    <td className="p-3 text-emerald-600">43.8 – 48.0</td>
                                    <td className="p-3 text-purple-700">&gt; 48.1 mL/kg/min</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-900">Females (20–29 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 28.9</td>
                                    <td className="p-3 text-amber-600">29.0 – 32.9</td>
                                    <td className="p-3 text-blue-600">33.0 – 36.9</td>
                                    <td className="p-3 text-emerald-600">37.0 – 41.0</td>
                                    <td className="p-3 text-purple-700">&gt; 41.1 mL/kg/min</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-900">Females (30–39 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 26.9</td>
                                    <td className="p-3 text-amber-600">27.0 – 31.4</td>
                                    <td className="p-3 text-blue-600">31.5 – 35.6</td>
                                    <td className="p-3 text-emerald-600">35.7 – 40.0</td>
                                    <td className="p-3 text-purple-700">&gt; 40.1 mL/kg/min</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-900">Females (40–49 yrs)</td>
                                    <td className="p-3 text-rose-600">&lt; 24.4</td>
                                    <td className="p-3 text-amber-600">24.5 – 28.9</td>
                                    <td className="p-3 text-blue-600">29.0 – 32.8</td>
                                    <td className="p-3 text-emerald-600">32.9 – 36.9</td>
                                    <td className="p-3 text-purple-700">&gt; 37.0 mL/kg/min</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Practical Scenarios */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Field Testing Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how varying athlete profiles translate across different assessment methods:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Distance Runner (Cooper 12-Min)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Field Test</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Subject:</strong> 28-Year-Old Male | 72 kg</li>
                                <li><strong>12-Min Distance:</strong> 2,850 meters (1.77 miles)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Results:</li>
                                <li>• <strong>VO2 Max:</strong> (2850 - 504.9) / 44.73 = <strong>52.4 mL/kg/min</strong></li>
                                <li>• <strong>Rating:</strong> Superior / Elite (Top 5% for age)</li>
                                <li>• <strong>MET Capacity:</strong> 15.0 METs</li>
                                <li>• <strong>Zone 2 Target:</strong> 138 – 152 BPM</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Sedentary Adult (Resting HR)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Non-Exercise</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Subject:</strong> 42-Year-Old Female | 68 kg</li>
                                <li><strong>Resting Heart Rate:</strong> 76 BPM | <strong>Max HR:</strong> 179 BPM</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Calculated Results:</li>
                                <li>• <strong>VO2 Max:</strong> 15.3 × (179 / 76) = <strong>36.0 mL/kg/min</strong></li>
                                <li>• <strong>Rating:</strong> Good (70th Percentile for age)</li>
                                <li>• <strong>MET Capacity:</strong> 10.3 METs</li>
                                <li>• <strong>Zone 2 Target:</strong> 138 – 148 BPM</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Scientific Training Strategies to Increase VO2 Max */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Evidence-Based Protocols for Increasing VO2 Max
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cardiovascular exercise physiology indicates that VO2 max gains require a dual-stimulus approach combining high-volume low-intensity base building with targeted high-intensity aerobic intervals:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-emerald-600" /> Zone 2 Aerobic Base
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                60–75% HRR. Sustained 45–90 minute sessions stimulate mitochondrial biogenesis, increase capillary bed density, and improve fat oxidation efficiency without taxing recovery systems.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-purple-600" /> 4×4 Norwegian Intervals
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                4 bouts of 4 minutes at 90–95% HRmax, interspersed with 3 minutes of active recovery. Clinically proven to be the most potent interval protocol for increasing stroke volume and VO2 max.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Timer className="w-4 h-4 text-indigo-600" /> Polarized Periodization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The 80/20 rule: Dedicate 80% of weekly training volume to low-intensity Zone 2 work and 20% to high-intensity threshold/VO2 intervals, avoiding excessive mid-zone fatigue.
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
                                What is VO2 max and why is it considered the gold standard of fitness?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                VO2 max (maximal oxygen consumption) measures the peak milliliters of oxygen your body can utilize per kilogram of body weight per minute (mL/kg/min). It serves as the primary clinical indicator of cardiorespiratory fitness, cardiovascular health reserve, and endurance capacity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How accurate are field tests compared to laboratory cardiopulmonary exercise testing (CPET)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While a laboratory metabolic cart with a face mask directly measures exact gas exchange ($O_2$ consumed and $CO_2$ exhaled), validated field formulas (Cooper, Rockport, Uth) correlate with CPET results within a 5%–12% standard error of estimate, offering a highly practical, non-invasive assessment.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the relationship between VO2 max and METs?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                One Metabolic Equivalent of Task (1 MET) represents resting oxygen consumption at rest (3.5 mL/kg/min). Dividing your total VO2 max by 3.5 computes your maximal functional capacity in METs. A capacity exceeding 10–12 METs is associated with significantly lower cardiac event rates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How quickly can training improve my VO2 max?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                With structured aerobic training (such as 3–4 sessions per week combining Zone 2 base and 4×4 intervals), noticeable adaptations in stroke volume and capillary density typically yield a 10% to 25% increase in VO2 max within 8 to 12 weeks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does resting heart rate correlate with VO2 max in the Uth equation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Aerobically conditioned hearts possess larger left ventricular stroke volumes, requiring fewer resting heartbeats to pump the same cardiac output. A lower resting heart rate paired with a high maximum heart rate reflects greater functional cardiac reserve.
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