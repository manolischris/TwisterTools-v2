"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Activity,
    Scale,
    Heart,
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
    Flame,
    Target,
    Zap,
    CheckCircle2,
    Layers,
    Dog,
    Cat,
    Utensils,
    PieChart,
    Stethoscope
} from "lucide-react";

type Species = "dog" | "cat";
type UnitSystem = "imperial" | "metric";
type BodyConditionScore = "1_very_thin" | "2_underweight" | "3_ideal" | "4_overweight" | "5_obese";

type DogLifeStageFactor =
    | "intact_adult"
    | "neutered_adult"
    | "inactive_obese_prone"
    | "weight_loss"
    | "weight_gain"
    | "light_work"
    | "moderate_work"
    | "heavy_work"
    | "puppy_0_4_months"
    | "puppy_4_months_adult"
    | "pregnancy_first_42"
    | "pregnancy_last_21"
    | "lactating";

type CatLifeStageFactor =
    | "intact_adult"
    | "neutered_adult"
    | "inactive_obese_prone"
    | "weight_loss"
    | "weight_gain"
    | "kitten_0_4_months"
    | "kitten_4_months_adult"
    | "pregnancy"
    | "lactating";

interface Preset {
    id: string;
    label: string;
    species: Species;
    system: UnitSystem;
    weightLbs: number;
    weightKg: number;
    dogFactor?: DogLifeStageFactor;
    catFactor?: CatLifeStageFactor;
    bcs: BodyConditionScore;
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "golden-retriever-neutered",
        label: "Neutered Golden Retriever",
        species: "dog",
        system: "imperial",
        weightLbs: 65,
        weightKg: 29.5,
        dogFactor: "neutered_adult",
        bcs: "3_ideal",
        tag: "65 lbs / Dog",
    },
    {
        id: "french-bulldog-diet",
        label: "Overweight Frenchie (Diet)",
        species: "dog",
        system: "imperial",
        weightLbs: 32,
        weightKg: 14.5,
        dogFactor: "weight_loss",
        bcs: "4_overweight",
        tag: "32 lbs / Weight Loss",
    },
    {
        id: "active-working-shepherd",
        label: "Working German Shepherd",
        species: "dog",
        system: "imperial",
        weightLbs: 75,
        weightKg: 34,
        dogFactor: "moderate_work",
        bcs: "3_ideal",
        tag: "75 lbs / Working",
    },
    {
        id: "indoor-neutered-cat",
        label: "Indoor Neutered Cat",
        species: "cat",
        system: "metric",
        weightLbs: 9.9,
        weightKg: 4.5,
        catFactor: "neutered_adult",
        bcs: "3_ideal",
        tag: "4.5 kg / Cat",
    },
    {
        id: "growing-kitten",
        label: "Growing Kitten (3 Mo)",
        species: "cat",
        system: "metric",
        weightLbs: 3.3,
        weightKg: 1.5,
        catFactor: "kitten_0_4_months",
        bcs: "3_ideal",
        tag: "1.5 kg / Kitten",
    },
];

const DOG_FACTORS: { id: DogLifeStageFactor; label: string; multiplier: number; description: string }[] = [
    { id: "neutered_adult", label: "Neutered / Spayed Adult", multiplier: 1.6, description: "Normal adult maintenance (Neutered)" },
    { id: "intact_adult", label: "Intact Adult Dog", multiplier: 1.8, description: "Normal adult maintenance (Intact)" },
    { id: "inactive_obese_prone", label: "Inactive / Obese Prone", multiplier: 1.4, description: "Sedentary or prone to weight gain" },
    { id: "weight_loss", label: "Weight Loss Protocol", multiplier: 1.0, description: "Caloric restriction for safe weight reduction" },
    { id: "weight_gain", label: "Weight Gain Protocol", multiplier: 1.4, description: "Safe caloric surplus for underweight dogs" },
    { id: "light_work", label: "Light Work (1–2 hrs/day)", multiplier: 2.0, description: "Walking, hiking, agility training" },
    { id: "moderate_work", label: "Moderate Work (3–4 hrs/day)", multiplier: 3.0, description: "Hunting, ranch, active field trials" },
    { id: "heavy_work", label: "Heavy / Extreme Work (Sled dog)", multiplier: 5.0, description: "Sled racing, sustained intense work" },
    { id: "puppy_0_4_months", label: "Puppy (< 4 months old)", multiplier: 3.0, description: "Rapid growth early puppy phase" },
    { id: "puppy_4_months_adult", label: "Puppy (> 4 months to adult)", multiplier: 2.0, description: "Developing juvenile puppy phase" },
    { id: "pregnancy_first_42", label: "Gestation (First 42 Days)", multiplier: 1.8, description: "Early to mid canine pregnancy" },
    { id: "pregnancy_last_21", label: "Gestation (Last 21 Days)", multiplier: 3.0, description: "Late term fetal growth support" },
    { id: "lactating", label: "Lactating Dam (Nursing)", multiplier: 4.0, description: "Peak milk production support" },
];

const CAT_FACTORS: { id: CatLifeStageFactor; label: string; multiplier: number; description: string }[] = [
    { id: "neutered_adult", label: "Neutered / Spayed Adult", multiplier: 1.2, description: "Normal adult feline maintenance" },
    { id: "intact_adult", label: "Intact Adult Cat", multiplier: 1.4, description: "Intact adult metabolic maintenance" },
    { id: "inactive_obese_prone", label: "Inactive / Obese Prone", multiplier: 1.0, description: "Sedentary indoor cat" },
    { id: "weight_loss", label: "Weight Loss Protocol", multiplier: 0.8, description: "Controlled feline safe weight loss" },
    { id: "weight_gain", label: "Weight Gain Protocol", multiplier: 1.2, description: "Caloric density for convalescence" },
    { id: "kitten_0_4_months", label: "Kitten (< 4 months old)", multiplier: 2.5, description: "Rapid initial kitten growth" },
    { id: "kitten_4_months_adult", label: "Kitten (> 4 months to adult)", multiplier: 2.0, description: "Later kitten skeletal growth" },
    { id: "pregnancy", label: "Gestation / Pregnancy", multiplier: 2.0, description: "Queen gestation energy requirements" },
    { id: "lactating", label: "Lactating Queen (Nursing)", multiplier: 3.0, description: "Active nursing and lactation" },
];

const BCS_INFO: Record<BodyConditionScore, { label: string; score: string; color: string; bg: string; border: string; desc: string }> = {
    "1_very_thin": { label: "Very Thin / Emaciated", score: "1–2 / 9", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", desc: "Ribs, spine, and pelvic bones easily visible. No palpable body fat." },
    "2_underweight": { label: "Underweight", score: "3 / 9", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", desc: "Ribs easily felt with minimal fat cover. Prominent waistline and abdominal tuck." },
    "3_ideal": { label: "Ideal Body Condition", score: "4–5 / 9", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", desc: "Ribs palpable without excess fat. Waist observed behind ribs when viewed from above." },
    "4_overweight": { label: "Overweight", score: "6–7 / 9", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", desc: "Ribs difficult to palpate beneath fat layer. Abdominal tuck diminished or absent." },
    "5_obese": { label: "Severely Obese", score: "8–9 / 9", color: "text-rose-700", bg: "bg-rose-100", border: "border-rose-300", desc: "Heavy fat deposits over spine, neck, and limbs. Broad, flat back and distended abdomen." },
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

export default function PetCalorieCalculator() {
    const [species, setSpecies] = useState<Species>("dog");
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [weightLbs, setWeightLbs] = useState<number>(45);
    const [weightKg, setWeightKg] = useState<number>(20.4);
    const [dogFactorId, setDogFactorId] = useState<DogLifeStageFactor>("neutered_adult");
    const [catFactorId, setCatFactorId] = useState<CatLifeStageFactor>("neutered_adult");
    const [bcs, setBcs] = useState<BodyConditionScore>("3_ideal");
    const [foodCalorieDensity, setFoodCalorieDensity] = useState<number>(360); // kcal per cup or can
    const [feedingsPerDay, setFeedingsPerDay] = useState<number>(2);

    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "guidelines">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Compute effective Weight in Kilograms
    const effectiveWeightKg = useMemo(() => {
        if (unitSystem === "imperial") {
            return (weightLbs || 0) * 0.45359237;
        }
        return weightKg || 0;
    }, [unitSystem, weightLbs, weightKg]);

    // Active multiplier
    const activeMultiplier = useMemo(() => {
        if (species === "dog") {
            const item = DOG_FACTORS.find((f) => f.id === dogFactorId);
            return item ? item.multiplier : 1.6;
        } else {
            const item = CAT_FACTORS.find((f) => f.id === catFactorId);
            return item ? item.multiplier : 1.2;
        }
    }, [species, dogFactorId, catFactorId]);

    // Core Veterinary Calculations (WSAVA / AAHA standards)
    const calculation = useMemo(() => {
        const wKg = effectiveWeightKg;
        if (wKg <= 0) {
            return {
                rer: 0,
                mer: 0,
                foodPortionTotal: 0,
                foodPortionPerMeal: 0,
                treatAllowanceCal: 0,
                mainDietCal: 0,
            };
        }

        // Standard Scientific Allometric Formula: RER = 70 * (weight_kg)^0.75
        const rer = 70 * Math.pow(wKg, 0.75);
        const mer = rer * activeMultiplier;

        // 90/10 Rule for Veterinary Nutrition
        const treatAllowanceCal = mer * 0.10;
        const mainDietCal = mer * 0.90;

        // Food Portions
        const foodPortionTotal = foodCalorieDensity > 0 ? mer / foodCalorieDensity : 0;
        const foodPortionPerMeal = feedingsPerDay > 0 ? foodPortionTotal / feedingsPerDay : 0;

        return {
            rer: Math.round(rer),
            mer: Math.round(mer),
            foodPortionTotal: parseFloat(foodPortionTotal.toFixed(2)),
            foodPortionPerMeal: parseFloat(foodPortionPerMeal.toFixed(2)),
            treatAllowanceCal: Math.round(treatAllowanceCal),
            mainDietCal: Math.round(mainDietCal),
        };
    }, [effectiveWeightKg, activeMultiplier, foodCalorieDensity, feedingsPerDay]);

    const handleUnitToggle = (system: UnitSystem) => {
        if (system === unitSystem) return;
        if (system === "metric") {
            setWeightKg(parseFloat(((weightLbs || 0) * 0.45359237).toFixed(1)));
        } else {
            setWeightLbs(parseFloat(((weightKg || 0) * 2.20462).toFixed(1)));
        }
        setUnitSystem(system);
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setSpecies(preset.species);
        setUnitSystem(preset.system);
        if (preset.system === "imperial") {
            setWeightLbs(preset.weightLbs);
            setWeightKg(parseFloat((preset.weightLbs * 0.45359237).toFixed(1)));
        } else {
            setWeightKg(preset.weightKg);
            setWeightLbs(parseFloat((preset.weightKg * 2.20462).toFixed(1)));
        }
        if (preset.species === "dog" && preset.dogFactor) {
            setDogFactorId(preset.dogFactor);
        } else if (preset.species === "cat" && preset.catFactor) {
            setCatFactorId(preset.catFactor);
        }
        setBcs(preset.bcs);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setSpecies("dog");
        setUnitSystem("imperial");
        setWeightLbs(45);
        setWeightKg(20.4);
        setDogFactorId("neutered_adult");
        setCatFactorId("neutered_adult");
        setBcs("3_ideal");
        setFoodCalorieDensity(360);
        setFeedingsPerDay(2);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const weightDisplay = unitSystem === "imperial" ? `${weightLbs} lbs` : `${weightKg} kg`;
        const factorLabel = species === "dog"
            ? DOG_FACTORS.find((f) => f.id === dogFactorId)?.label
            : CAT_FACTORS.find((f) => f.id === catFactorId)?.label;

        const summaryText = `Pet Daily Calorie Requirement (TwisterTools):
----------------------------------------
Species: ${species.toUpperCase()}
Weight: ${weightDisplay} (${effectiveWeightKg.toFixed(1)} kg)
Life Stage & Activity: ${factorLabel} (Multiplier: ${activeMultiplier}x)
Body Condition Score: ${BCS_INFO[bcs].label} (${BCS_INFO[bcs].score})
----------------------------------------
Resting Energy Requirement (RER): ${calculation.rer} kcal/day
Maintenance Energy Requirement (MER): ${calculation.mer} kcal/day
Primary Diet Calorie Target (90%): ${calculation.mainDietCal} kcal/day
Max Treat Allowance (10% Cap): ${calculation.treatAllowanceCal} kcal/day
Daily Food Portions (@ ${foodCalorieDensity} kcal/unit): ${calculation.foodPortionTotal} units (${calculation.foodPortionPerMeal} units per meal × ${feedingsPerDay} meals)
----------------------------------------
Calculated at twistertools.com/tools/health-tools/pet-calorie-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Value", "Notes / Unit"];
        const factorLabel = species === "dog"
            ? DOG_FACTORS.find((f) => f.id === dogFactorId)?.label
            : CAT_FACTORS.find((f) => f.id === catFactorId)?.label;

        const rows = [
            ["Species", species.toUpperCase(), "Target Pet Type"],
            ["Weight (kg)", effectiveWeightKg.toFixed(2), "kg"],
            ["Life Stage Factor", factorLabel || "", `${activeMultiplier}x multiplier`],
            ["Body Condition Score", BCS_INFO[bcs].label, BCS_INFO[bcs].score],
            ["Resting Energy Requirement (RER)", `${calculation.rer}`, "kcal / day"],
            ["Maintenance Energy Requirement (MER)", `${calculation.mer}`, "kcal / day"],
            ["Main Diet Target (90%)", `${calculation.mainDietCal}`, "kcal / day"],
            ["Max Daily Treat Allowance (10%)", `${calculation.treatAllowanceCal}`, "kcal / day"],
            ["Food Density", `${foodCalorieDensity}`, "kcal / cup or can"],
            ["Total Daily Food Units", `${calculation.foodPortionTotal}`, "cups or cans / day"],
            ["Portion per Feeding", `${calculation.foodPortionPerMeal}`, `split over ${feedingsPerDay} meals`],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `pet_caloric_requirement_${species}_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pet Daily Caloric Requirement (RER/MER) Calculator",
        "url": "https://twistertools.com/tools/health-tools/pet-calorie-calculator",
        "description": "Calculate clinical Resting Energy Requirements (RER) and Daily Maintenance Energy Requirements (MER) for dogs and cats using WSAVA and AAHA veterinary standards.",
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
                "name": "What is the difference between RER and MER in veterinary nutrition?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Resting Energy Requirement (RER) is the basal energy required by a pet at rest in a thermoneutral environment to maintain vital cellular functions. Maintenance Energy Requirement (MER) multiplies the RER by a life-stage or activity factor to account for exercise, growth, neutering status, gestation, or weight loss."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard scientific allometric formula for pet RER?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The international veterinary standard allometric equation recognized by WSAVA and AAHA is RER = 70 × (Body Weight in kg)^0.75. This metabolic power equation applies accurately across all body weights, from tiny kittens to giant-breed dogs."
                }
            },
            {
                "@type": "Question",
                "name": "Why do spayed and neutered pets require fewer daily calories?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Surgical gonadectomy eliminates reproductive sex hormones, which naturally lowers a pet's basal metabolic rate by 20% to 30% and often decreases physical activity levels, making them prone to obesity if fed intact maintenance rations."
                }
            },
            {
                "@type": "Question",
                "name": "What is the veterinary 10% treat rule?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Veterinary nutritionists recommend that treats, dental chews, and table foods should never exceed 10% of your pet's total daily MER calories. The remaining 90% must come from a complete and nutritionally balanced commercial or veterinary-formulated diet to prevent micronutrient deficiencies."
                }
            },
            {
                "@type": "Question",
                "name": "How does Body Condition Score (BCS) affect feeding calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If a pet is overweight or obese (BCS 6–9/9), MER should be calculated using the target ideal body weight rather than current mass, using a dedicated weight loss multiplier (1.0 for dogs, 0.8 for cats) to ensure steady, safe fat reduction without metabolic complications."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600" />
                                Pet Clinical Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Species Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Animal Species
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => { setSpecies("dog"); setActivePresetId(null); }}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${species === "dog"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Dog className="w-4 h-4" /> Canine (Dog)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSpecies("cat"); setActivePresetId(null); }}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${species === "cat"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    <Cat className="w-4 h-4" /> Feline (Cat)
                                </button>
                            </div>
                        </div>

                        {/* Unit System Toggle */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Measurement Unit System
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("imperial")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "imperial"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Imperial (lbs)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUnitToggle("metric")}
                                    className={`py-2 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${unitSystem === "metric"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Metric (kg)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Body Weight Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Scale className="w-3.5 h-3.5 text-indigo-600" /> Current / Target Body Weight
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-500 lowercase">
                                        {unitSystem === "imperial" ? `≈ ${effectiveWeightKg.toFixed(1)} kg` : `≈ ${(effectiveWeightKg * 2.20462).toFixed(1)} lbs`}
                                    </span>
                                </label>
                                {unitSystem === "imperial" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.5"
                                            max="300"
                                            value={weightLbs === 0 ? "" : weightLbs}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWeightLbs(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">lbs</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.2"
                                            max="150"
                                            value={weightKg === 0 ? "" : weightKg}
                                            onChange={(e) => { handleNumberInput(e, (val) => setWeightKg(Math.max(0, val))); setActivePresetId(null); }}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
                                    </div>
                                )}
                            </div>

                            {/* Life Stage & Activity Factor Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-3.5 h-3.5 text-indigo-600" /> Life Stage & Activity Factor
                                    </span>
                                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                        {activeMultiplier}x RER
                                    </span>
                                </label>
                                {species === "dog" ? (
                                    <select
                                        value={dogFactorId}
                                        onChange={(e) => { setDogFactorId(e.target.value as DogLifeStageFactor); setActivePresetId(null); }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        {DOG_FACTORS.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.label} ({f.multiplier}x RER)
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <select
                                        value={catFactorId}
                                        onChange={(e) => { setCatFactorId(e.target.value as CatLifeStageFactor); setActivePresetId(null); }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        {CAT_FACTORS.map((f) => (
                                            <option key={f.id} value={f.id}>
                                                {f.label} ({f.multiplier}x RER)
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Body Condition Score (BCS 1-9 Scale) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                        <Activity className="w-3.5 h-3.5 text-indigo-600" /> Body Condition Score (WSAVA 9-Point)
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-500">
                                        {BCS_INFO[bcs].score}
                                    </span>
                                </label>
                                <select
                                    value={bcs}
                                    onChange={(e) => { setBcs(e.target.value as BodyConditionScore); setActivePresetId(null); }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                >
                                    <option value="1_very_thin">Score 1–2: Very Thin / Emaciated</option>
                                    <option value="2_underweight">Score 3: Underweight</option>
                                    <option value="3_ideal">Score 4–5: Ideal Body Condition</option>
                                    <option value="4_overweight">Score 6–7: Overweight</option>
                                    <option value="5_obese">Score 8–9: Severely Obese</option>
                                </select>
                            </div>

                            {/* Diet Density & Meal Partitioning */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Utensils className="w-3.5 h-3.5 text-indigo-600" /> Food Energy Density
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="50"
                                            max="1500"
                                            value={foodCalorieDensity === 0 ? "" : foodCalorieDensity}
                                            onChange={(e) => handleNumberInput(e, (val) => setFoodCalorieDensity(Math.max(1, val)))}
                                            className="w-full pl-3 pr-20 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">kcal/unit</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-1 block">Per cup (kibble) or can (wet)</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Layers className="w-3.5 h-3.5 text-indigo-600" /> Daily Feedings
                                    </label>
                                    <select
                                        value={feedingsPerDay}
                                        onChange={(e) => setFeedingsPerDay(parseInt(e.target.value, 10))}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    >
                                        <option value={1}>1 Meal / Day</option>
                                        <option value={2}>2 Meals / Day (Standard)</option>
                                        <option value={3}>3 Meals / Day (Puppy/Kitten)</option>
                                        <option value={4}>4 Meals / Day (Frequent)</option>
                                    </select>
                                    <span className="text-[10px] text-slate-500 mt-1 block">Automatic portion split</span>
                                </div>
                            </div>
                        </div>

                        {/* Reference Presets */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Clinical Presets
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Feeding Plan"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Caloric Partitioning & Nutrition Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Energy & Portion Breakdown
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Target Diet
                                </button>
                                <button
                                    onClick={() => setActiveTab("guidelines")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "guidelines" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Multipliers
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Daily Maintenance Energy (MER)
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${BCS_INFO[bcs].bg} ${BCS_INFO[bcs].color} ${BCS_INFO[bcs].border}`}>
                                    BCS: {BCS_INFO[bcs].score} ({BCS_INFO[bcs].label.split("/")[0]})
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-indigo-600">
                                    {calculation.mer > 0 ? calculation.mer.toLocaleString() : "--"}
                                </span>
                                <span className="text-sm font-bold text-slate-500">kcal / day</span>
                            </div>

                            {/* Visual Daily Portion Scale */}
                            <div className="mt-4 pt-4 border-t border-indigo-100/80 grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Daily Food Volume</span>
                                    <span className="text-xl font-extrabold text-slate-900">
                                        {calculation.foodPortionTotal} <span className="text-xs font-normal text-slate-500">units/day</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Per Meal ({feedingsPerDay}x/day)</span>
                                    <span className="text-xl font-extrabold text-indigo-700">
                                        {calculation.foodPortionPerMeal} <span className="text-xs font-normal text-slate-500">units/meal</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    {/* RER Box */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Heart className="w-4 h-4 text-rose-500" />
                                            Resting Energy (RER)
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {calculation.rer.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal/day</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            70 × ({effectiveWeightKg.toFixed(1)}kg)<sup>0.75</sup>
                                        </p>
                                    </div>

                                    {/* Life Stage Factor */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Zap className="w-4 h-4 text-indigo-600" />
                                            Life Stage Multiplier
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {activeMultiplier}× <span className="text-xs font-normal text-slate-500">factor</span>
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                            {species === "dog" ? DOG_FACTORS.find((f) => f.id === dogFactorId)?.label : CAT_FACTORS.find((f) => f.id === catFactorId)?.label}
                                        </p>
                                    </div>
                                </div>

                                {/* 90/10 Caloric Partitioning Box */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <PieChart className="w-4 h-4 text-indigo-600" />
                                            90/10 Veterinary Nutritional Budget
                                        </span>
                                        <span className="text-[11px] font-semibold text-slate-500">AAHA Standard</span>
                                    </div>

                                    <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                                        <div className="bg-indigo-600 h-full w-[90%]" title="Complete & Balanced Food (90%)" />
                                        <div className="bg-amber-400 h-full w-[10%]" title="Treats & Extras (10%)" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 flex-shrink-0" />
                                            <div>
                                                <div className="font-bold text-slate-900">{calculation.mainDietCal} kcal</div>
                                                <div className="text-[10px] text-slate-500">Primary Diet (90%)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <div>
                                                <div className="font-bold text-amber-700">{calculation.treatAllowanceCal} kcal</div>
                                                <div className="text-[10px] text-slate-500">Treat Max Limit (10%)</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Life Stage Reference Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Classification</th>
                                            <th className="p-2.5">Multiplier</th>
                                            <th className="p-2.5">Clinical Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {(species === "dog" ? DOG_FACTORS : CAT_FACTORS).map((item) => {
                                            const isCurrent = species === "dog" ? item.id === dogFactorId : item.id === catFactorId;
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className={`transition ${isCurrent ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}
                                                >
                                                    <td className="p-2.5 flex items-center gap-1.5">
                                                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                                                        <span className={isCurrent ? "text-indigo-900" : "text-slate-800"}>{item.label}</span>
                                                    </td>
                                                    <td className="p-2.5 font-mono text-indigo-600">{item.multiplier}x RER</td>
                                                    <td className="p-2.5 text-slate-500">{item.description}</td>
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
                            WSAVA / AAHA Standard
                        </span>
                        <span>Allometric Power Model</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY VETERINARY DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Veterinary Medical Disclaimer:</strong> This calculator provides estimated daily caloric energy requirements for educational and baseline planning purposes only. Individual metabolic rates vary widely by genetics, environmental temperature, coat density, and underlying clinical conditions. Always consult your licensed veterinarian or a board-certified veterinary nutritionist (ACVN) before modifying your pet's feeding program or instituting weight loss protocols.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & GEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Veterinary Mechanics & Mathematical Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Resting & Maintenance Energy Requirements in Companion Animals
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Precision pet nutrition begins with calculating basal metabolic energy needs through allometric scaling. The <strong>Resting Energy Requirement (RER)</strong> defines the exact caloric intake an animal requires to sustain vital physiological homeostasis, cellular respiration, cardiac output, and body temperature regulation at complete physical rest in a climate-controlled environment. The <strong>Maintenance Energy Requirement (MER)</strong> scales this baseline by specific physiological factors including age, reproductive hormone status, physical exertion, pregnancy, and thermal workload.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> Standard Allometric Power Law
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The international consensus formula recommended by the World Small Animal Veterinary Association (WSAVA) and American Animal Hospital Association (AAHA) applies the exponential power equation: <strong>RER = 70 × (Body Weight in kg)<sup>0.75</sup></strong>. This accounts for non-linear metabolic scaling across diverse body sizes.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-indigo-600" /> The Linear Approximation Limitation
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The older linear equation [30 × kg + 70] is only valid for pets between 2 kg and 20 kg. Outside this narrow range, linear math severely overestimates caloric needs in small pets and underestimates calories in giant-breed dogs. This engine utilizes the true 0.75 power curve exclusively.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Official Veterinary Nutritional Equations
                        </h3>
                        <p className="text-xs text-slate-300">
                            The exact mathematical formulations executed client-side in this calculator:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. RER (Allometric Baseline):</strong> RER (kcal/day) = 70 × (Weight_kg)<sup>0.75</sup></div>
                            <div><strong>2. MER (Total Daily Intake):</strong> MER (kcal/day) = RER × Life_Stage_Multiplier</div>
                            <div><strong>3. Primary Complete Diet (90%):</strong> Diet_Calories = MER × 0.90</div>
                            <div><strong>4. Maximum Treat Budget (10%):</strong> Treat_Calories = MER × 0.10</div>
                            <div><strong>5. Daily Food Portion:</strong> Total_Portion = MER ÷ Food_Calorie_Density (kcal/cup or can)</div>
                            <div><strong>6. Meal Partition:</strong> Portion_Per_Feeding = Total_Portion ÷ Feedings_Per_Day</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Detailed Reference Tables & Multiplier Classifications */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical RER Multipliers and Life-Stage Classifications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Veterinary nutritionists assign distinct energy coefficient multipliers based on species-specific physiological states, reproductive surgery, and physical activity levels:
                    </p>

                    {/* Table 1: Canine Multipliers */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Dog className="w-4 h-4 text-indigo-600" /> Canine (Dog) Energy Multiplier Schedule
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Canine Life Stage & Activity</th>
                                        <th className="p-3">Multiplier (× RER)</th>
                                        <th className="p-3">Clinical Rationale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Neutered Adult</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">1.6 × RER</td>
                                        <td className="p-3">Standard baseline for surgically altered domestic dogs</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Intact Adult</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">1.8 × RER</td>
                                        <td className="p-3">Higher baseline metabolic expenditure due to sex hormones</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-amber-50/40">
                                        <td className="p-3 font-semibold text-amber-800">Inactive / Obese Prone</td>
                                        <td className="p-3 font-mono text-amber-700 font-bold">1.4 × RER</td>
                                        <td className="p-3">Low-activity or predisposed breeds (e.g., Labs, Bulldogs)</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-rose-50/40">
                                        <td className="p-3 font-semibold text-rose-800">Weight Loss Protocol</td>
                                        <td className="p-3 font-mono text-rose-700 font-bold">1.0 × RER</td>
                                        <td className="p-3">Strict caloric deficit calculated on target ideal body weight</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Active / Light Work</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">2.0 × RER</td>
                                        <td className="p-3">Daily obedience, agility, or 1–2 hours continuous hiking</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Working / Heavy Work</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">3.0 – 5.0 × RER</td>
                                        <td className="p-3">Field hunting trials, livestock herding, and arctic sledding</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-semibold text-emerald-800">Puppy (&lt; 4 Months)</td>
                                        <td className="p-3 font-mono text-emerald-700 font-bold">3.0 × RER</td>
                                        <td className="p-3">Critical growth phase demanding high skeletal mineral density</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-semibold text-emerald-800">Puppy (&gt; 4 Months)</td>
                                        <td className="p-3 font-mono text-emerald-700 font-bold">2.0 × RER</td>
                                        <td className="p-3">Sustained juvenile development up to skeletal maturity</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table 2: Feline Multipliers */}
                    <div className="space-y-3 pt-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Cat className="w-4 h-4 text-indigo-600" /> Feline (Cat) Energy Multiplier Schedule
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Feline Life Stage & Activity</th>
                                        <th className="p-3">Multiplier (× RER)</th>
                                        <th className="p-3">Clinical Rationale</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Neutered Adult Cat</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">1.2 × RER</td>
                                        <td className="p-3">Standard indoor companion feline maintenance</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">Intact Adult Cat</td>
                                        <td className="p-3 font-mono text-indigo-600 font-bold">1.4 × RER</td>
                                        <td className="p-3">Breeding queens and toms maintenance baseline</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-amber-50/40">
                                        <td className="p-3 font-semibold text-amber-800">Inactive / Obese Prone</td>
                                        <td className="p-3 font-mono text-amber-700 font-bold">1.0 × RER</td>
                                        <td className="p-3">Sedentary indoor domestic cats with low play drive</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-rose-50/40">
                                        <td className="p-3 font-semibold text-rose-800">Feline Weight Loss</td>
                                        <td className="p-3 font-mono text-rose-700 font-bold">0.8 × RER</td>
                                        <td className="p-3">Strict caloric control to avoid hepatic lipidosis risk</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-semibold text-emerald-800">Kitten (&lt; 4 Months)</td>
                                        <td className="p-3 font-mono text-emerald-700 font-bold">2.5 × RER</td>
                                        <td className="p-3">Intense post-weaning muscle and neural development</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-semibold text-emerald-800">Kitten (&gt; 4 Months)</td>
                                        <td className="p-3 font-mono text-emerald-700 font-bold">2.0 × RER</td>
                                        <td className="p-3">Adolescent development until adulthood (approx. 10–12 months)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Body Condition Scoring & Clinical Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Feeding Case Studies & Body Condition Scoring
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To understand how RER and MER formulas translate into real-world feeding plans, evaluate two clinical patient scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Adult Neutered Labrador</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Dog / 70 lbs</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Weight & Status:</strong> 70 lbs (31.75 kg) | Neutered Adult | BCS 5/9</li>
                                <li><strong>Food Density:</strong> 375 kcal / cup (Commercial kibble)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Mathematical Results:</li>
                                <li>• <strong>RER:</strong> 70 × (31.75)<sup>0.75</sup> = 936 kcal/day</li>
                                <li>• <strong>MER:</strong> 936 × 1.6 = <strong>1,498 kcal/day</strong></li>
                                <li>• <strong>Diet Portion:</strong> 1,498 ÷ 375 = <strong>4.0 cups/day</strong> (2.0 cups AM / 2.0 cups PM)</li>
                                <li>• <strong>10% Treat Limit:</strong> Max 150 kcal/day from healthy training treats</li>
                            </ul>
                        </div>

                        {/* Case Study B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Obese Indoor Domestic Cat</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Cat / 14 lbs</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Current Weight:</strong> 14 lbs (6.35 kg) | Target Ideal Weight: 10 lbs (4.54 kg) | BCS 8/9</li>
                                <li><strong>Diet Type:</strong> Prescription Satiety Wet Canned (140 kcal / 5.5 oz can)</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">Safe Weight Reduction Math:</li>
                                <li>• <strong>Target RER:</strong> 70 × (4.54)<sup>0.75</sup> = 218 kcal/day (Calculated on ideal weight)</li>
                                <li>• <strong>Feline Loss MER:</strong> 218 × 0.8 = <strong>174 kcal/day</strong></li>
                                <li>• <strong>Prescription Food Portion:</strong> 174 ÷ 140 = <strong>1.24 cans/day</strong></li>
                                <li>• <strong>Safety Clinical Rule:</strong> Limit feline weight loss to 1–2% of body mass weekly</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Clinical Nutritional Rules & Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Essential Veterinary Nutrition Guidelines for Pet Owners
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Proper portion management involves more than raw mathematics. Veterinary nutritionists emphasize strict adherence to feeding hygiene and weight monitoring protocols:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <Scale className="w-4 h-4 text-indigo-600" /> Gram Scale Weighing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Measuring cups have an error margin of up to 20% due to kibble settling. Weighing food in grams on a digital kitchen scale prevents accidental overfeeding.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <PieChart className="w-4 h-4 text-indigo-600" /> The 10% Treat Ceiling
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Unbalanced snacks, dental sticks, and table scraps must not exceed 10% of total MER calories to avoid diluting essential vitamins, minerals, and taurine.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Feline Lipidosis Warning
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Rapid fasting or severe calorie restriction in overweight cats can trigger fatal Hepatic Lipidosis (fatty liver syndrome). Feline weight loss must always be gradual.
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
                                What is the difference between RER and MER in veterinary medicine?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                <strong>Resting Energy Requirement (RER)</strong> is the baseline caloric energy a pet burns at complete rest to sustain vital cellular and organ functions. <strong>Maintenance Energy Requirement (MER)</strong> multiplies the RER by a life-stage or physiological factor to determine the actual total daily calories needed based on activity, neuter status, and growth.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is RER calculated for dogs and cats?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This calculator utilizes the gold-standard allometric exponential formula endorsed by WSAVA and AAHA: <code>RER = 70 × (Body Weight in kg)^0.75</code>. This non-linear curve accurately calculates energy expenditure across all sizes, from a 1 kg kitten to an 80 kg Mastiff.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do spayed and neutered pets require fewer calories?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Surgical sterilization removes reproductive sex hormones, which naturally reduces a dog or cat's metabolic rate by 20% to 30% while often decreasing overall physical activity. Neutered adult maintenance multipliers (1.6x for dogs, 1.2x for cats) reflect this lower energy requirement to prevent post-operative obesity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the 10% treat rule and why is it important?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Treats, chews, and human food additions should never exceed 10% of a pet's total daily MER calories. The remaining 90% of calories must come from a complete and balanced veterinary or AAFCO-compliant diet to guarantee the pet receives necessary micronutrients, vitamins, amino acids, and minerals.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How should I calculate feeding portions for an overweight pet?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For pets with a Body Condition Score above 5/9, calculate RER using the pet's <em>target ideal body weight</em> rather than their current heavy mass. Apply the dedicated weight loss multiplier (1.0x RER for canines, 0.8x RER for felines) under veterinary guidance.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY VETERINARY DISCLAIMER CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Veterinary Medical Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical Disclaimer: This calculator provides estimated metrics for informational and educational purposes only. It is not intended as veterinary medical advice, clinical diagnosis, or nutritional prescription. Always consult a licensed veterinarian before making health, exercise, or dietary changes for your pet.
                    </p>
                </section>

            </div>
        </div>
    );
}