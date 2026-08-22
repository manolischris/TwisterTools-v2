"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Dog,
    Calculator,
    Activity,
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
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    Layers,
    Stethoscope,
    Calendar,
    Award,
    Dna,
    Clock,
    Scale
} from "lucide-react";

type BreedSize = "small" | "medium" | "large" | "giant";
type CalculationMethod = "epigenetic" | "avma" | "traditional";

interface BreedPreset {
    id: string;
    label: string;
    breedSize: BreedSize;
    chronologicalAge: number;
    chronologicalMonths: number;
    tag: string;
    description: string;
}

const BREED_PRESETS: BreedPreset[] = [
    { id: "puppy-lab", label: "Golden Retriever Puppy", breedSize: "large", chronologicalAge: 0, chronologicalMonths: 8, tag: "Large (8 mos)", description: "Rapid juvenile epigenetic remodeling phase" },
    { id: "adult-chihuahua", label: "Adult Chihuahua", breedSize: "small", chronologicalAge: 5, chronologicalMonths: 0, tag: "Small (5 yrs)", description: "Prime adult maintenance stage" },
    { id: "senior-shepherd", label: "Senior German Shepherd", breedSize: "large", chronologicalAge: 9, chronologicalMonths: 6, tag: "Large (9.5 yrs)", description: "Accelerated senior cellular phase" },
    { id: "mature-dane", label: "Mature Great Dane", breedSize: "giant", chronologicalAge: 6, chronologicalMonths: 0, tag: "Giant (6 yrs)", description: "Advanced geriatric giant life window" },
];

interface LifeStage {
    name: string;
    rangeDogYears: string;
    humanEquivalentRange: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    careFocus: string;
}

const LIFE_STAGES: LifeStage[] = [
    {
        name: "Puppy / Juvenile",
        rangeDogYears: "0 – 1.0 Year",
        humanEquivalentRange: "0 – 15 Years",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        description: "Intense cellular division, skeletal elongation, and immune system calibration.",
        careFocus: "Core vaccinations, microchipping, social development, and high-protein growth nutrition."
    },
    {
        name: "Young Adult",
        rangeDogYears: "1.1 – 3.0 Years",
        humanEquivalentRange: "16 – 28 Years",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        description: "Peak physiological agility, hormonal stabilization, and musculoskeletal density.",
        careFocus: "Dental prophylaxis, behavioral reinforcement, baseline wellness diagnostics."
    },
    {
        name: "Mature Adult",
        rangeDogYears: "3.1 – 6.0 Years",
        humanEquivalentRange: "29 – 45 Years",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        description: "Metabolic plateau where caloric maintenance and weight stabilization are critical.",
        careFocus: "Weight monitoring, annual comprehensive blood biochemistry, joint support."
    },
    {
        name: "Senior",
        rangeDogYears: "6.1 – 10.0 Years",
        humanEquivalentRange: "46 – 70+ Years",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        description: "Onset of cellular senescence, reduced renal clearance, and articular wear.",
        careFocus: "Semi-annual veterinary exams, renal and liver function panels, mobility assistance."
    },
    {
        name: "Geriatric",
        rangeDogYears: "> 10.0 Years",
        humanEquivalentRange: "71 – 100+ Years",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        description: "Advanced longevity window requiring specialized palliative support.",
        careFocus: "Pain management, cognitive dysfunction screening, blood pressure monitoring."
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

export default function DogAgeCalculator() {
    // Inputs
    const [breedSize, setBreedSize] = useState<BreedSize>("medium");
    const [ageYears, setAgeYears] = useState<number>(4);
    const [ageMonths, setAgeMonths] = useState<number>(0);
    const [calculationMethod, setCalculationMethod] = useState<CalculationMethod>("epigenetic");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "matrix">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Total fractional years
    const totalDogYears = useMemo(() => {
        const y = Math.max(0, ageYears || 0);
        const m = Math.max(0, Math.min(11, ageMonths || 0));
        return y + (m / 12);
    }, [ageYears, ageMonths]);

    // Core Biological Conversions
    const results = useMemo(() => {
        const dogYears = totalDogYears;

        if (dogYears <= 0) {
            return {
                humanAge: 0,
                epigeneticAge: 0,
                avmaAge: 0,
                traditionalAge: 0,
                stage: LIFE_STAGES[0],
                expectedRemainingYears: 0,
                estimatedLifespanRange: "10 – 14 years",
                methylationRate: "0.0x baseline",
            };
        }

        // 1. UC San Diego Epigenetic DNA Methylation Formula: 16 * ln(dog_years) + 31
        let epigeneticVal = 0;
        if (dogYears > 0) {
            epigeneticVal = 16 * Math.log(dogYears) + 31;
            if (epigeneticVal < 0) epigeneticVal = 0;
        }

        // 2. AVMA Size-Adjusted Veterinary Standard
        let avmaVal = 0;
        if (dogYears <= 1) {
            avmaVal = dogYears * 15;
        } else if (dogYears <= 2) {
            avmaVal = 15 + (dogYears - 1) * 9; // 24 at year 2
        } else {
            const subsequentYears = dogYears - 2;
            const rates: Record<BreedSize, number> = {
                small: 4.0,   // Small: +4 yrs/yr
                medium: 4.8,  // Medium: +4.8 yrs/yr
                large: 6.2,   // Large: +6.2 yrs/yr
                giant: 7.8    // Giant: +7.8 yrs/yr
            };
            avmaVal = 24 + (subsequentYears * rates[breedSize]);
        }

        // 3. Traditional Rule of Thumb: 7x
        const traditionalVal = dogYears * 7;

        // Selected active human equivalent based on user choice
        let activeHumanAge = epigeneticVal;
        if (calculationMethod === "avma") activeHumanAge = avmaVal;
        if (calculationMethod === "traditional") activeHumanAge = traditionalVal;

        // Determine Life Stage
        let stage = LIFE_STAGES[0];
        if (dogYears <= 1.0) {
            stage = LIFE_STAGES[0];
        } else if (dogYears <= 3.0) {
            stage = LIFE_STAGES[1];
        } else if (dogYears <= 6.0) {
            stage = LIFE_STAGES[2];
        } else if (dogYears <= (breedSize === "giant" ? 8.0 : 10.0)) {
            stage = LIFE_STAGES[3];
        } else {
            stage = LIFE_STAGES[4];
        }

        // Average lifespan boundaries by size
        const lifespans: Record<BreedSize, { min: number; max: number; rangeText: string }> = {
            small: { min: 14, max: 17, rangeText: "14 – 17 years" },
            medium: { min: 11, max: 14, rangeText: "11 – 14 years" },
            large: { min: 9, max: 12, rangeText: "9 – 12 years" },
            giant: { min: 7, max: 9, rangeText: "7 – 9 years" },
        };

        const lifespanObj = lifespans[breedSize];
        const remaining = Math.max(0, lifespanObj.max - dogYears);

        // Relative Biological Methylation Rate
        let methylationRate = "1.0x baseline";
        if (dogYears < 1) methylationRate = "4.2x adult rate (Rapid Phase)";
        else if (dogYears < 3) methylationRate = "2.1x adult rate (Stabilizing)";
        else if (dogYears < 7) methylationRate = "1.0x adult rate (Linear Plateau)";
        else methylationRate = breedSize === "giant" || breedSize === "large" ? "1.8x adult rate (Accelerated Senescence)" : "1.2x adult rate (Slow Linear)";

        return {
            humanAge: Math.max(0, activeHumanAge),
            epigeneticAge: Math.max(0, epigeneticVal),
            avmaAge: Math.max(0, avmaVal),
            traditionalAge: Math.max(0, traditionalVal),
            stage,
            expectedRemainingYears: Number(remaining.toFixed(1)),
            estimatedLifespanRange: lifespanObj.rangeText,
            methylationRate,
        };
    }, [totalDogYears, breedSize, calculationMethod]);

    const applyPreset = (preset: BreedPreset) => {
        setBreedSize(preset.breedSize);
        setAgeYears(preset.chronologicalAge);
        setAgeMonths(preset.chronologicalMonths);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setBreedSize("medium");
        setAgeYears(4);
        setAgeMonths(0);
        setCalculationMethod("epigenetic");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Canine Biological Age Conversion Summary (TwisterTools):
--------------------------------------------------
Chronological Age: ${ageYears} Years, ${ageMonths} Months (${totalDogYears.toFixed(2)} Dog Years)
Breed Size Category: ${breedSize.toUpperCase()}
Life Stage: ${results.stage.name}
--------------------------------------------------
• UCSD Epigenetic Human Equivalent: ${results.epigeneticAge.toFixed(1)} human years
• AVMA Size-Adjusted Equivalent: ${results.avmaAge.toFixed(1)} human years
• Traditional (7x) Estimate: ${results.traditionalAge.toFixed(1)} human years
--------------------------------------------------
Selected Model (${calculationMethod.toUpperCase()}): ${results.humanAge.toFixed(1)} Human Years
Estimated Breed Lifespan: ${results.estimatedLifespanRange}
Methylation Velocity: ${results.methylationRate}
Primary Clinical Care Focus: ${results.stage.careFocus}
--------------------------------------------------
Calculated at twistertools.com/tools/calculators/dog-age-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Metric", "Value", "Notes / Model"];
        const rows = [
            ["Chronological Dog Age", `${totalDogYears.toFixed(2)} years`, `${ageYears}y ${ageMonths}m`],
            ["Breed Classification", breedSize.toUpperCase(), "Size Tier"],
            ["Epigenetic Human Equivalent (UCSD)", `${results.epigeneticAge.toFixed(1)} years`, "16 * ln(age) + 31"],
            ["AVMA Veterinary Equivalent", `${results.avmaAge.toFixed(1)} years`, "Size-weighted multi-tier"],
            ["Traditional Equivalent (7x)", `${results.traditionalAge.toFixed(1)} years`, "7:1 Simple Ratio"],
            ["Active Life Stage", results.stage.name, results.stage.humanEquivalentRange],
            ["Estimated Lifespan Range", results.estimatedLifespanRange, "Breed Size Average"],
            ["Epigenetic Rate", results.methylationRate, "Cellular aging velocity"],
            ["Clinical Care Recommendation", results.stage.careFocus, "Veterinary Protocol"],
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `canine_biological_age_analysis.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Dog Age to Human Years Biological Converter",
        "url": "https://twistertools.com/tools/calculators/dog-age-calculator",
        "description": "Accurately convert dog age to human years using UC San Diego Epigenetic DNA Methylation formulas, AVMA veterinary size-adjusted metrics, and life stage analytics.",
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
                "name": "Why is the 7-to-1 dog age rule scientifically inaccurate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The traditional 7-year rule assumes a constant, linear rate of aging throughout a canine's life. However, canine biological development is non-linear: dogs mature rapidly during their first two years, achieving human-equivalent early adulthood by age two, before their cellular aging rate decelerates significantly."
                }
            },
            {
                "@type": "Question",
                "name": "What is the UC San Diego Epigenetic DNA Methylation formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Developed by researchers at the UC San Diego School of Medicine (Wang et al., 2020), the formula [Human Age = 16 × ln(Dog Age) + 31] maps molecular epigenetic clocks by comparing chemical methylation changes on canine and human genomes across lifespans."
                }
            },
            {
                "@type": "Question",
                "name": "Why do large and giant breed dogs age faster than small dogs?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Large and giant dog breeds experience accelerated juvenile growth rates, resulting in increased physiological strain, higher rates of free radical generation, and heightened cellular turnover. This biological acceleration leads to earlier onset of age-related cellular senescence and chronic conditions."
                }
            },
            {
                "@type": "Question",
                "name": "How does the AVMA Size-Adjusted calculation work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The American Veterinary Medical Association (AVMA) standard calculates the first year of a dog's life as approximately 15 human years and the second year as 9 human years (totaling 24 human years at age 2). Each subsequent year is then weighted between 4 to 8 human years depending on the breed's size category."
                }
            },
            {
                "@type": "Question",
                "name": "When is a dog officially considered a 'senior' or 'geriatric'?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Senior status varies by breed size: giant breeds reach senior status around 5 to 6 years, large breeds at 6 to 7 years, medium breeds at 7 to 8 years, and small toy breeds at 9 to 10 years of age."
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
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-indigo-600" />
                                Canine Biological Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Calculation Engine Method Selector */}
                        <div className="mb-5 space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Scientific Conversion Model
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setCalculationMethod("epigenetic")}
                                    className={`py-2 px-2 text-center text-xs font-bold rounded-lg transition ${calculationMethod === "epigenetic"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    UCSD Epigenetic
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalculationMethod("avma")}
                                    className={`py-2 px-2 text-center text-xs font-bold rounded-lg transition ${calculationMethod === "avma"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    AVMA Size-Tier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalculationMethod("traditional")}
                                    className={`py-2 px-2 text-center text-xs font-bold rounded-lg transition ${calculationMethod === "traditional"
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                        }`}
                                >
                                    Traditional (7x)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Breed Size Tier Buttons */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Breed Size & Weight Category</span>
                                    <span className="text-[11px] font-medium text-slate-500 lowercase">Affects longevity decay</span>
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: "small", label: "Small", weight: "< 20 lbs (9 kg)" },
                                        { id: "medium", label: "Medium", weight: "21–50 lbs (10–23 kg)" },
                                        { id: "large", label: "Large", weight: "51–90 lbs (24–41 kg)" },
                                        { id: "giant", label: "Giant", weight: "> 90 lbs (41+ kg)" },
                                    ].map((tier) => (
                                        <button
                                            key={tier.id}
                                            type="button"
                                            onClick={() => { setBreedSize(tier.id as BreedSize); setActivePresetId(null); }}
                                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${breedSize === tier.id
                                                ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-500"
                                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <span className="text-xs font-bold">{tier.label}</span>
                                            <span className="text-[10px] text-slate-500 mt-1 leading-tight">{tier.weight}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chronological Age Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Chronological Years
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="25"
                                            value={ageYears === 0 && ageMonths > 0 ? 0 : ageYears === 0 ? "" : ageYears}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setAgeYears(Math.max(0, Math.min(25, val))));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                            placeholder="Years"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">years</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> Additional Months
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="11"
                                            value={ageMonths === 0 ? "" : ageMonths}
                                            onChange={(e) => {
                                                handleNumberInput(e, (val) => setAgeMonths(Math.max(0, Math.min(11, val))));
                                                setActivePresetId(null);
                                            }}
                                            className="w-full pl-3 pr-14 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                            placeholder="0–11"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">months</span>
                                    </div>
                                </div>
                            </div>

                            {/* Method Explanatory Callout */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                                    Active Model: {calculationMethod === "epigenetic" ? "UCSD Epigenetic Methylation (16 × ln(age) + 31)" : calculationMethod === "avma" ? "AVMA Pediatric/Geriatric Size Index" : "Traditional Linear Standard (7x)"}
                                </div>
                                <p className="leading-relaxed">
                                    {calculationMethod === "epigenetic" && "Evaluates biological age by tracking chromatin methyl groups across the genome. Puppies age rapidly in months 1–12, after which the aging curve levels off."}
                                    {calculationMethod === "avma" && "Veterinary standard accounting for breed mass differences. Large and giant dogs age more per calendar year after adulthood."}
                                    {calculationMethod === "traditional" && "Historical 7:1 ratio. Simple to compute, but overestimates young dogs and underestimates giant breed senior transitions."}
                                </p>
                            </div>
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Breed Profile Presets
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {BREED_PRESETS.map((preset) => {
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
                            {copied ? "Copied Summary" : "Copy Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Comparative Visualizations */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[640px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Biological Age Conversion
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 hidden sm:inline-flex">
                                    UCSD Epigenetic v2.6
                                </span>
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setActiveTab("overview")}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        Overview
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("matrix")}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "matrix" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                            }`}
                                    >
                                        Scientific Matrix
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className={`p-5 rounded-2xl border ${results.stage.bgColor} ${results.stage.borderColor} transition-all`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Human Equivalent Age
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${results.stage.bgColor} ${results.stage.color} ${results.stage.borderColor}`}>
                                    {results.stage.name}
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className={`text-4xl md:text-5xl font-black ${results.stage.color}`}>
                                    {totalDogYears > 0 ? results.humanAge.toFixed(1) : "--"}
                                </span>
                                <span className="text-sm font-semibold text-slate-600">Human Years Old</span>
                            </div>

                            {/* Visual Longevity Gauge */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div className="bg-amber-400 h-full w-[15%]" title="Puppy (0-15)" />
                                    <div className="bg-emerald-500 h-full w-[25%]" title="Young Adult (16-35)" />
                                    <div className="bg-indigo-500 h-full w-[25%]" title="Mature (36-55)" />
                                    <div className="bg-orange-500 h-full w-[20%]" title="Senior (56-75)" />
                                    <div className="bg-rose-600 h-full w-[15%]" title="Geriatric (76+)" />

                                    {/* Indicator Marker */}
                                    {results.humanAge > 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border-x border-white shadow-md transform -translate-x-1/2 transition-all duration-500"
                                            style={{
                                                left: `${Math.min(100, Math.max(0, (results.humanAge / 100) * 100))}%`,
                                            }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Puppy</span>
                                    <span>Young Adult</span>
                                    <span>Mature</span>
                                    <span>Senior</span>
                                    <span>Geriatric (100+)</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                                    {/* Estimated Lifespan Target */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Heart className="w-4 h-4 text-indigo-600" />
                                            Expected Breed Lifespan
                                        </div>
                                        <p className="text-lg font-extrabold text-slate-900 mt-1">
                                            {results.estimatedLifespanRange}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Based on {breedSize} breed category
                                        </p>
                                    </div>

                                    {/* Aging Velocity Rate */}
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Dna className="w-4 h-4 text-indigo-600" />
                                            Epigenetic Methylation Rate
                                        </div>
                                        <p className="text-sm font-extrabold text-slate-900 mt-1.5">
                                            {results.methylationRate}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            DNA chromatin remodeling rate
                                        </p>
                                    </div>
                                </div>

                                {/* Life Stage Clinical Focus Banner */}
                                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                                    <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                                        Veterinary Care Focus: {results.stage.name}
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {results.stage.careFocus}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Model Comparison Matrix Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Scientific Model</th>
                                            <th className="p-2.5">Equiv. Age</th>
                                            <th className="p-2.5">Mathematical Foundation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        <tr className={`transition ${calculationMethod === "epigenetic" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {calculationMethod === "epigenetic" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>UCSD Epigenetic</span>
                                            </td>
                                            <td className="p-2.5 text-indigo-700 font-bold">{results.epigeneticAge.toFixed(1)} yrs</td>
                                            <td className="p-2.5 text-slate-500">16 × ln(dog_years) + 31</td>
                                        </tr>
                                        <tr className={`transition ${calculationMethod === "avma" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {calculationMethod === "avma" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>AVMA Size-Tier</span>
                                            </td>
                                            <td className="p-2.5 text-indigo-700 font-bold">{results.avmaAge.toFixed(1)} yrs</td>
                                            <td className="p-2.5 text-slate-500">15 + 9 + (y - 2) * size_decay</td>
                                        </tr>
                                        <tr className={`transition ${calculationMethod === "traditional" ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"}`}>
                                            <td className="p-2.5 flex items-center gap-1.5">
                                                {calculationMethod === "traditional" && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                <span>Traditional 7x</span>
                                            </td>
                                            <td className="p-2.5 text-slate-900 font-bold">{results.traditionalAge.toFixed(1)} yrs</td>
                                            <td className="p-2.5 text-slate-500">dog_years × 7 (Linear)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-Side Native Engine
                        </span>
                        <span>UCSD Wang Lab / AVMA Protocol</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY VETERINARY DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Veterinary Health Disclaimer:</strong> This biological calculator provides estimates based on published epigenetic research and veterinary standards for educational and general wellness purposes. Individual canine longevity and biological health vary widely by genetic lineage, diet, reproductive status, body condition score, and environmental enrichment. Always consult a licensed veterinarian for clinical assessments and personalized care protocols.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SYSTEM ARCHITECTURE */}
            <div className="space-y-6">

                {/* Card 1: Epigenetic Biology & Mathematical Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Epigenetics of Canine Aging: Beyond the Traditional 7-Year Rule
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For decades, pet parents relied on the simplified rule of thumb that one dog year equals seven human years. However, modern comparative genomics and evolutionary biology have revealed that dogs and humans do not age at constant, parallel linear rates. Instead, canine physiological maturation follows a logarithmic curve characterized by rapid initial development during early puppyhood, followed by a gradual deceleration in adulthood.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Dna className="w-4 h-4 text-indigo-600" /> The UCSD Epigenetic Clock Model
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Pioneered by researchers at the University of California San Diego School of Medicine (Wang et al., <em>Cell Systems</em>), this model tracks DNA methylation—chemical modifications that regulate gene expression over time—demonstrating that an eight-week-old puppy matches a nine-month-old infant, while a one-year-old dog aligns closely with a thirty-year-old human.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> The AVMA Size-Tier Paradigm
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The American Veterinary Medical Association standard integrates breed size tiers. While giant breeds mature physically at comparable rates to smaller dogs during year one, their cellular senescence and oxidative stress rates accelerate sharply after maturity, leading to shorter lifespans.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formulations Implemented
                        </h3>
                        <p className="text-xs text-slate-300">
                            Exact computational formulas executed by this converter:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>1. Epigenetic Methylation Clock:</strong> Human_Age = 16 × ln(Canine_Years) + 31</div>
                            <div><strong>2. AVMA Small Tier (&lt;20 lbs):</strong> Age_1 = 15, Age_2 = 24, Subsequent = 24 + [(Age - 2) × 4.0]</div>
                            <div><strong>3. AVMA Medium Tier (21–50 lbs):</strong> Age_1 = 15, Age_2 = 24, Subsequent = 24 + [(Age - 2) × 4.8]</div>
                            <div><strong>4. AVMA Large Tier (51–90 lbs):</strong> Age_1 = 15, Age_2 = 24, Subsequent = 24 + [(Age - 2) × 6.2]</div>
                            <div><strong>5. AVMA Giant Tier (&gt;90 lbs):</strong> Age_1 = 15, Age_2 = 24, Subsequent = 24 + [(Age - 2) × 7.8]</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Breed Size vs Longevity Reference Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Canine Breed Size vs. Human Equivalent Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below illustrates the divergence in human-equivalent age across distinct canine weight categories over a 14-year chronological timeline:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Dog Age (Years)</th>
                                    <th className="p-3">UCSD Epigenetic</th>
                                    <th className="p-3">Small (&lt;20 lbs)</th>
                                    <th className="p-3">Medium (21–50 lbs)</th>
                                    <th className="p-3">Large (51–90 lbs)</th>
                                    <th className="p-3">Giant (&gt;90 lbs)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">1 Year</td>
                                    <td className="p-3 font-semibold text-indigo-600">31.0 yrs</td>
                                    <td className="p-3">15.0 yrs</td>
                                    <td className="p-3">15.0 yrs</td>
                                    <td className="p-3">15.0 yrs</td>
                                    <td className="p-3">15.0 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-emerald-50/20">
                                    <td className="p-3 font-bold text-slate-900">2 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">42.1 yrs</td>
                                    <td className="p-3">24.0 yrs</td>
                                    <td className="p-3">24.0 yrs</td>
                                    <td className="p-3">24.0 yrs</td>
                                    <td className="p-3">24.0 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">4 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">53.2 yrs</td>
                                    <td className="p-3">32.0 yrs</td>
                                    <td className="p-3">33.6 yrs</td>
                                    <td className="p-3">36.4 yrs</td>
                                    <td className="p-3">39.6 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">6 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">59.7 yrs</td>
                                    <td className="p-3">40.0 yrs</td>
                                    <td className="p-3">43.2 yrs</td>
                                    <td className="p-3">48.8 yrs</td>
                                    <td className="p-3 font-bold text-orange-600">55.2 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">8 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">64.3 yrs</td>
                                    <td className="p-3">48.0 yrs</td>
                                    <td className="p-3">52.8 yrs</td>
                                    <td className="p-3 font-bold text-orange-600">61.2 yrs</td>
                                    <td className="p-3 font-bold text-rose-600">70.8 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">10 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">67.8 yrs</td>
                                    <td className="p-3">56.0 yrs</td>
                                    <td className="p-3">62.4 yrs</td>
                                    <td className="p-3 font-bold text-rose-600">73.6 yrs</td>
                                    <td className="p-3 font-bold text-rose-700">86.4 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">12 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">70.8 yrs</td>
                                    <td className="p-3">64.0 yrs</td>
                                    <td className="p-3">72.0 yrs</td>
                                    <td className="p-3 font-bold text-rose-700">86.0 yrs</td>
                                    <td className="p-3 font-bold text-rose-800">102.0 yrs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">14 Years</td>
                                    <td className="p-3 font-semibold text-indigo-600">73.2 yrs</td>
                                    <td className="p-3">72.0 yrs</td>
                                    <td className="p-3">81.6 yrs</td>
                                    <td className="p-3 font-bold text-rose-800">98.4 yrs</td>
                                    <td className="p-3 font-bold text-rose-900">117.6 yrs</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Canine Life Stages & Veterinary Wellness Milestones */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Canine Life Stages & Proactive Healthcare Milestones
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Tailoring preventive veterinary care to your dog’s biological life stage supports long-term vitality, joint mobility, and organ function:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" /> Puppyhood (0 – 1 Year)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Requires structured core vaccine series (DHPP, Rabies), monthly parasite control, microchipping, puppy socialization, and calcium-to-phosphorus balanced diets to support musculoskeletal development.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-emerald-500" /> Adult Prime (2 – 6 Years)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Focuses on regular dental hygiene (brushing and professional cleanings to prevent periodontal bacteremia), weight maintenance, annual heartworm testing, and establishing baseline blood chemistry values.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-rose-500" /> Senior & Geriatric (7+ Years)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Transitions to semi-annual wellness examinations, complete blood count (CBC), full organ biochemistry panels (BUN, Creatinine, ALT), urinalysis, thyroid screening, arthritis management, and cognitive assessment.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                Why is the traditional 7-to-1 dog age rule inaccurate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The traditional 7-year rule assumes linear aging throughout a canine’s lifespan. In reality, canine maturation is non-linear: dogs develop rapidly during their first two years, achieving human-equivalent adulthood by age two, after which their biological aging curve flattens significantly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the scientific basis for the UCSD Epigenetic Clock?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The UC San Diego model measures DNA methylation patterns across genomes to align canine and human cellular clocks. Using the natural logarithm formula (16 × ln(dog_years) + 31), it demonstrates that a one-year-old dog aligns closely with a 31-year-old human, while a four-year-old dog corresponds to roughly 53 human years.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do large and giant dogs age faster than smaller breeds?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Large and giant breeds experience rapid juvenile growth rates, resulting in heightened cellular division, accelerated metabolic strain, and increased free radical generation. This biological load leads to earlier onset of age-related cellular senescence and chronic conditions compared to smaller toy breeds.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the AVMA Size-Adjusted calculation work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The American Veterinary Medical Association standard assigns 15 human years to a dog’s first year, 9 human years to the second year (totaling 24 human years at age two), and then adds between 4 to 8 human years per subsequent calendar year based on whether the dog is small, medium, large, or giant.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When is a dog officially considered a "senior"?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Senior onset varies by breed mass: giant breeds reach senior status around 5 to 6 years of age, large breeds at 6 to 7 years, medium breeds at 7 to 8 years, and small toy breeds at 9 to 10 years.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Second Veterinary Disclaimer Card */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm space-y-2 text-xs text-slate-600 p-4 sm:p-6">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Veterinary Wellness Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Veterinary Health Disclaimer: This biological calculator provides estimates based on published epigenetic research and veterinary standards for educational and general wellness purposes. Individual canine longevity and biological health vary widely by genetic lineage, diet, reproductive status, body condition score, and environmental enrichment. Always consult a licensed veterinarian for clinical assessments and personalized care protocols.
                    </p>
                </section>

            </div>
        </div>
    );
}