"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Cat,
    Calendar,
    Clock,
    Sparkles,
    ShieldCheck,
    RefreshCw,
    Copy,
    Check,
    Download,
    BookOpen,
    HelpCircle,
    Info,
    AlertTriangle,
    HeartPulse,
    Activity,
    Stethoscope,
    Layers,
    Lightbulb,
    CheckCircle2,
    Smile,
    ShieldAlert
} from "lucide-react";

type LifeStageId = "kitten" | "junior" | "prime" | "mature" | "senior" | "geriatric";
type Lifestyle = "indoor" | "outdoor" | "mixed";

interface LifeStage {
    id: LifeStageId;
    name: string;
    felineRange: string;
    humanRange: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    careFocus: string;
}

const LIFE_STAGES: LifeStage[] = [
    {
        id: "kitten",
        name: "Kitten",
        felineRange: "0 – 6 months",
        humanRange: "0 – 10 years",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        description: "Rapid growth, socialization, primary vaccinations, and high energy development.",
        careFocus: "Kitten-formulated nutrition, initial deworming, vaccine schedule, and litter box training."
    },
    {
        id: "junior",
        name: "Junior",
        felineRange: "7 months – 2 years",
        humanRange: "12 – 24 years",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        description: "Reaching physical maturity, adult size, sexual maturity, and establishing personality.",
        careFocus: "Spaying/neutering, transitioning to adult food, dental checkups, and behavioral stimulation."
    },
    {
        id: "prime",
        name: "Prime (Adult)",
        felineRange: "3 – 6 years",
        humanRange: "28 – 40 years",
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        description: "Peak physical condition, stable metabolism, and active cognitive health.",
        careFocus: "Weight monitoring, annual wellness screening, interactive play, and preventative dental hygiene."
    },
    {
        id: "mature",
        name: "Mature Adult",
        felineRange: "7 – 10 years",
        humanRange: "44 – 56 years",
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        borderColor: "border-cyan-200",
        description: "Early metabolic slowdown, subtle joint changes, and higher susceptibility to kidney stress.",
        careFocus: "Bi-annual vet exams, baseline blood panels, joint support, and moisture-rich hydration."
    },
    {
        id: "senior",
        name: "Senior",
        felineRange: "11 – 14 years",
        humanRange: "60 – 72 years",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        description: "Noticeable slowing down, sensory changes, arthritis, and common endocrine disorders.",
        careFocus: "Kidney and thyroid testing, accessible low-entry litter boxes, orthopedic bedding, and gentle grooming."
    },
    {
        id: "geriatric",
        name: "Geriatric / Super Senior",
        felineRange: "15+ years",
        humanRange: "76 – 100+ years",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
        description: "Vulnerable life stage requiring attentive comfort care, environmental adaptations, and frequent veterinary oversight.",
        careFocus: "Comprehensive geriatric screening every 6 months, pain management, tailored hydration, and warm resting zones."
    }
];

interface PresetCat {
    id: string;
    label: string;
    years: number;
    months: number;
    lifestyle: Lifestyle;
    tag: string;
}

const PRESET_CATS: PresetCat[] = [
    { id: "kitten-preset", label: "Playful Kitten", years: 0, months: 4, lifestyle: "indoor", tag: "4 Mos" },
    { id: "young-adult", label: "Young Adult", years: 2, months: 0, lifestyle: "indoor", tag: "2 Yrs" },
    { id: "prime-cat", label: "Prime Adult", years: 5, months: 6, lifestyle: "mixed", tag: "5.5 Yrs" },
    { id: "senior-cat", label: "Senior Cat", years: 12, months: 0, lifestyle: "indoor", tag: "12 Yrs" },
    { id: "geriatric-legend", label: "Geriatric Legend", years: 17, months: 0, lifestyle: "indoor", tag: "17 Yrs" }
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

export default function CatAgeCalculator() {
    const [years, setYears] = useState<number>(3);
    const [months, setMonths] = useState<number>(0);
    const [lifestyle, setLifestyle] = useState<Lifestyle>("indoor");
    const [activeTab, setActiveTab] = useState<"overview" | "chart">("overview");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    const exportRef = useRef<HTMLDivElement>(null);

    // Precise AAFP / ISFM Feline Life Stage Guideline Calculation
    const results = useMemo(() => {
        const totalMonths = Math.max(0, (years || 0) * 12 + (months || 0));
        const totalYears = totalMonths / 12;

        let humanYears = 0;

        if (totalMonths <= 0) {
            humanYears = 0;
        } else if (totalMonths <= 1) {
            humanYears = 1;
        } else if (totalMonths <= 2) {
            humanYears = 2.5;
        } else if (totalMonths <= 3) {
            humanYears = 4;
        } else if (totalMonths <= 6) {
            humanYears = 10;
        } else if (totalMonths < 12) {
            // Interpolation between 6 months (10 human yrs) and 12 months (15 human yrs)
            const diffMonths = totalMonths - 6;
            humanYears = 10 + (diffMonths / 6) * 5;
        } else if (totalMonths === 12) {
            humanYears = 15;
        } else if (totalMonths < 24) {
            // Interpolation between 1 yr (15 human yrs) and 2 yrs (24 human yrs)
            const diffMonths = totalMonths - 12;
            humanYears = 15 + (diffMonths / 12) * 9;
        } else if (totalMonths === 24) {
            humanYears = 24;
        } else {
            // Beyond 2 years: each feline year adds 4 human years
            const beyondTwo = totalYears - 2;
            humanYears = 24 + beyondTwo * 4;
        }

        // Determine Life Stage
        let stage: LifeStage;
        if (totalMonths <= 6) {
            stage = LIFE_STAGES[0]; // Kitten
        } else if (totalMonths <= 24) {
            stage = LIFE_STAGES[1]; // Junior
        } else if (totalYears <= 6) {
            stage = LIFE_STAGES[2]; // Prime
        } else if (totalYears <= 10) {
            stage = LIFE_STAGES[3]; // Mature
        } else if (totalYears <= 14) {
            stage = LIFE_STAGES[4]; // Senior
        } else {
            stage = LIFE_STAGES[5]; // Geriatric
        }

        // Veterinary Checkup Frequency Recommendation
        let vetFrequency = "Annual Comprehensive Wellness Exam (Once every 12 months)";
        if (totalYears >= 7 && totalYears < 11) {
            vetFrequency = "Bi-Annual Wellness Checkup (Every 6 to 12 months with baseline bloodwork)";
        } else if (totalYears >= 11) {
            vetFrequency = "Senior Feline Screening (Every 6 months with full renal and thyroid panel)";
        } else if (totalMonths <= 6) {
            vetFrequency = "Monthly Kitten Booster & Deworming Protocol (Every 3–4 weeks until 16 weeks)";
        }

        // Milestones
        const nextMilestoneAge = Math.ceil(totalYears) === totalYears ? totalYears + 1 : Math.ceil(totalYears);
        const nextMilestoneHuman = nextMilestoneAge <= 1 ? 15 : nextMilestoneAge === 2 ? 24 : 24 + (nextMilestoneAge - 2) * 4;

        return {
            totalMonths,
            totalYears,
            humanYears: Number(humanYears.toFixed(1)),
            humanYearsDisplay: humanYears < 10 ? humanYears.toFixed(1) : Math.round(humanYears).toString(),
            stage,
            vetFrequency,
            nextMilestoneAge,
            nextMilestoneHuman
        };
    }, [years, months]);

    const applyPreset = (preset: PresetCat) => {
        setYears(preset.years);
        setMonths(preset.months);
        setLifestyle(preset.lifestyle);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setYears(3);
        setMonths(0);
        setLifestyle("indoor");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        const summaryText = `Cat Age to Human Years Conversion (TwisterTools):
----------------------------------------
Feline Age: ${years} Years, ${months} Months (Total: ${results.totalYears.toFixed(1)} Years)
Equivalent Human Age: ~${results.humanYearsDisplay} Years Old
Life Stage: ${results.stage.name} (${results.stage.felineRange})
Lifestyle: ${lifestyle.toUpperCase()}
Care Focus: ${results.stage.careFocus}
Recommended Vet Schedule: ${results.vetFrequency}
----------------------------------------
Calculated at twistertools.com/tools/calculators/cat-age-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Feline Metric", "Value", "Clinical Detail"];
        const rows = [
            ["Feline Chronological Age", `${years} Years, ${months} Months`, `${results.totalMonths} Total Months`],
            ["Equivalent Human Age", `${results.humanYearsDisplay} Human Years`, "AAFP / ISFM Standard"],
            ["Life Stage Category", results.stage.name, results.stage.felineRange],
            ["Human Comparison Range", results.stage.humanRange, "Maturity Equivalence"],
            ["Lifestyle Category", lifestyle.toUpperCase(), "Environmental Profile"],
            ["Veterinary Visit Schedule", results.vetFrequency, "Clinical Guideline"],
            ["Primary Care Focus", results.stage.careFocus, "Recommended Action"]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `cat_age_feline_maturity_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Cat Age to Human Years Feline Maturity Estimator",
        "url": "https://twistertools.com/tools/calculators/cat-age-calculator",
        "description": "Calculate your cat's exact equivalent human age, feline life stage classification, and veterinary wellness schedule based on standard AAFP and ISFM clinical guidelines.",
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
                "name": "Why is the simple 1 cat year = 7 human years rule inaccurate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cats mature at an exponential rate during their first two years of life. A one-year-old cat is physiologically comparable to a 15-year-old human adolescent, and a two-year-old cat is equivalent to a 24-year-old young adult. After age two, each feline year equals approximately four human years."
                }
            },
            {
                "@type": "Question",
                "name": "What formula does this cat age calculator use?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This calculator adheres to veterinary standards established by the American Animal Hospital Association (AAHA), the American Association of Feline Practitioners (AAFP), and the International Society of Feline Medicine (ISFM): Year 1 = 15 human years, Year 2 = +9 human years (reaching 24), and each subsequent year = +4 human years."
                }
            },
            {
                "@type": "Question",
                "name": "What are the recognized feline life stages?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern veterinary medicine recognizes six distinct feline life stages: Kitten (0–6 months), Junior (7 months–2 years), Prime (3–6 years), Mature (7–10 years), Senior (11–14 years), and Geriatric (15+ years)."
                }
            },
            {
                "@type": "Question",
                "name": "How does an indoor lifestyle affect a cat's lifespan?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Indoor cats generally enjoy significantly longer lifespans (averaging 12 to 18+ years) compared to outdoor cats (averaging 2 to 5 years). Indoor environments eliminate major mortality vectors including vehicular trauma, infectious contagions like FeLV and FIV, animal attacks, and severe weather exposure."
                }
            },
            {
                "@type": "Question",
                "name": "When does a cat require senior veterinary wellness screenings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Veterinarians recommend transitioning to bi-annual wellness exams starting around age 7 (Mature stage) and comprehensive senior blood, urine, and blood pressure screening by age 11 to detect chronic kidney disease, hyperthyroidism, hypertension, and arthritis early."
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[620px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Feline Age Parameters
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
                            {/* Age Inputs (Years & Months) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Cat's Chronological Age
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                            Years
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="35"
                                                value={years === 0 && months === 0 ? "" : years}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setYears(Math.max(0, Math.min(35, val))));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                yrs
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                            Additional Months
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="11"
                                                value={months === 0 ? "" : months}
                                                onChange={(e) => {
                                                    handleNumberInput(e, (val) => setMonths(Math.max(0, Math.min(11, val))));
                                                    setActivePresetId(null);
                                                }}
                                                className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                mos
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Age Slider */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-600">Quick Age Slider</span>
                                    <span className="font-bold text-indigo-600">{results.totalYears.toFixed(1)} Feline Years</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="25"
                                    step="0.5"
                                    value={results.totalYears}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const y = Math.floor(val);
                                        const m = Math.round((val - y) * 12);
                                        setYears(y);
                                        setMonths(m);
                                        setActivePresetId(null);
                                    }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                    <span>0y (Kitten)</span>
                                    <span>5y (Prime)</span>
                                    <span>10y (Mature)</span>
                                    <span>15y (Senior)</span>
                                    <span>20y+ (Geriatric)</span>
                                </div>
                            </div>

                            {/* Lifestyle Profile */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Lifestyle & Living Environment
                                </label>
                                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setLifestyle("indoor")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${lifestyle === "indoor"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Indoor Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLifestyle("mixed")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${lifestyle === "mixed"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Indoor / Outdoor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLifestyle("outdoor")}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${lifestyle === "outdoor"
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Outdoor Only
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Reference Life Stages
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-2 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESET_CATS.map((preset) => {
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

                {/* Right Workspace Panel: Results, Visualizations & Data Schedule */}
                <div
                    className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[620px] min-w-0 p-4 sm:p-6"
                    ref={exportRef}
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Biological Equivalence
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "overview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Summary
                                </button>
                                <button
                                    onClick={() => setActiveTab("chart")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "chart" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Life Stages
                                </button>
                            </div>
                        </div>

                        {/* Primary Result Hero Box */}
                        <div className={`p-5 rounded-2xl border ${results.stage.bgColor} ${results.stage.borderColor} transition-all`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Equivalent Human Age
                                </span>
                                <span
                                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${results.stage.bgColor} ${results.stage.color} ${results.stage.borderColor}`}
                                >
                                    {results.stage.name} Stage
                                </span>
                            </div>
                            <div className="mt-2 flex items-baseline gap-3">
                                <span className={`text-4xl md:text-5xl font-black ${results.stage.color}`}>
                                    ~{results.humanYearsDisplay}
                                </span>
                                <span className="text-sm font-bold text-slate-600">Human Years Old</span>
                            </div>
                            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                                At <strong>{results.totalYears.toFixed(1)} feline years</strong> ({results.totalMonths} months), your cat matches the physiological maturity of a {results.humanYearsDisplay}-year-old person.
                            </p>

                            {/* Visual Life Stage Scale Progress */}
                            <div className="mt-4 space-y-1.5">
                                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex relative">
                                    <div className="bg-amber-400 h-full w-[10%]" title="Kitten (0–6 mos)" />
                                    <div className="bg-emerald-500 h-full w-[15%]" title="Junior (7 mos–2 yrs)" />
                                    <div className="bg-indigo-500 h-full w-[25%]" title="Prime (3–6 yrs)" />
                                    <div className="bg-cyan-500 h-full w-[20%]" title="Mature (7–10 yrs)" />
                                    <div className="bg-orange-500 h-full w-[15%]" title="Senior (11–14 yrs)" />
                                    <div className="bg-rose-600 h-full w-[15%]" title="Geriatric (15+ yrs)" />

                                    {/* Indicator Marker */}
                                    <div
                                        className="absolute top-0 bottom-0 w-2 bg-slate-900 border-x border-white shadow-md transform -translate-x-1/2 transition-all duration-500"
                                        style={{
                                            left: `${Math.min(100, Math.max(2, (results.totalYears / 20) * 100))}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                    <span>Kitten</span>
                                    <span>Junior</span>
                                    <span>Prime</span>
                                    <span>Mature</span>
                                    <span>Senior</span>
                                    <span>Geriatric</span>
                                </div>
                            </div>
                        </div>

                        {/* Active Tab Views */}
                        {activeTab === "overview" ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 pt-1">
                                {/* Care Focus */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 sm:col-span-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <HeartPulse className="w-4 h-4 text-indigo-600" />
                                        Primary Stage Care Focus
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                                        {results.stage.careFocus}
                                    </p>
                                </div>

                                {/* Veterinary Schedule */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                                        Veterinary Protocol
                                    </div>
                                    <p className="text-xs text-slate-800 font-semibold mt-1">
                                        {results.vetFrequency}
                                    </p>
                                </div>

                                {/* Next Milestone */}
                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <Clock className="w-4 h-4 text-indigo-600" />
                                        Next Birthday Milestone
                                    </div>
                                    <p className="text-xs text-slate-800 font-semibold mt-1">
                                        Age {results.nextMilestoneAge} Feline Years ≈ {results.nextMilestoneHuman} Human Years
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* Life Stage Reference Table Tab */
                            <div className="overflow-hidden border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Life Stage</th>
                                            <th className="p-2.5">Cat Age</th>
                                            <th className="p-2.5">Human Equiv.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {LIFE_STAGES.map((stg) => {
                                            const isCurrent = stg.id === results.stage.id;
                                            return (
                                                <tr
                                                    key={stg.id}
                                                    className={`transition ${isCurrent ? "bg-indigo-50/80 font-bold" : "hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <td className="p-2.5 flex items-center gap-1.5">
                                                        {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                                        <span className={stg.color}>{stg.name}</span>
                                                    </td>
                                                    <td className="p-2.5 text-slate-900">{stg.felineRange}</td>
                                                    <td className="p-2.5 text-slate-600">{stg.humanRange}</td>
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
                            AAFP & ISFM Clinical Framework
                        </span>
                        <span>Client-side instant math</span>
                    </div>
                </div>
            </div>

            {/* MANDATORY VETERINARY ADVISORY BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Veterinary Note:</strong> This feline age estimator calculates chronological and physiological equivalence based on veterinary consensus. Individual aging varies based on genetics, breed (e.g., Maine Coons mature slower), nutrition, indoor versus outdoor lifestyle, and preventative medical care. Consult your licensed veterinarian for diagnostic health evaluations.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO KNOWLEDGE BASE */}
            <div className="space-y-6">
                {/* Card 1: The Mathematics & Biology of Feline Aging */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How Feline Age Conversion Works: Debunking the "Rule of 7"
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For decades, pet owners relied on the simplistic folklore rule that one cat year equals seven human years. Modern veterinary science published by the <strong>American Animal Hospital Association (AAHA)</strong> and the <strong>American Association of Feline Practitioners (AAFP)</strong> has thoroughly disproven this linear model. Felines undergo extraordinarily rapid physiological, skeletal, and sexual maturation during their initial 24 months, followed by a steady, predictable linear aging curve thereafter.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-indigo-600" /> Year 1: 15 Human Years
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A kitten reaches full sexual maturity, permanent adult dentition, and primary skeletal growth within its first 12 months, equaling a 15-year-old human teenager.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Smile className="w-4 h-4 text-indigo-600" /> Year 2: +9 Human Years (24 Total)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                During the second year, behavioral consolidation and final muscular development occur, bringing a 2-year-old cat to the physiological state of a 24-year-old human adult.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-indigo-600" /> Year 3+: +4 Human Years / Year
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                For each consecutive calendar year beyond age two, feline cellular metabolism advances at a rate of approximately 4 human calendar years.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" /> AAFP / ISFM Feline Aging Algorithm
                        </h3>
                        <p className="text-xs text-slate-300">
                            Mathematical formulation implemented in this client-side engine:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-1.5">
                            <div><strong>• Age &le; 1 Year:</strong> Human Years = Feline Age (Years) &times; 15</div>
                            <div><strong>• 1 &lt; Age &le; 2 Years:</strong> Human Years = 15 + ((Feline Age - 1) &times; 9)</div>
                            <div><strong>• Age &gt; 2 Years:</strong> Human Years = 24 + ((Feline Age - 2) &times; 4)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Complete Feline Age Conversion Master Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Complete Cat-to-Human Age Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this comprehensive reference guide to assess feline physical milestones, biological stages, and corresponding human developmental equivalents from kittenhood to geriatric longevity:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Cat Age</th>
                                    <th className="p-3">Human Age Equivalent</th>
                                    <th className="p-3">Feline Life Stage</th>
                                    <th className="p-3">Key Physiological Milestones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 Month</td>
                                    <td className="p-3">1 Year</td>
                                    <td className="p-3 font-medium text-amber-600">Kitten</td>
                                    <td className="p-3 text-xs">Deciduous teeth eruption, weaning begins, sensory exploration.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 Months</td>
                                    <td className="p-3">4 Years</td>
                                    <td className="p-3 font-medium text-amber-600">Kitten</td>
                                    <td className="p-3 text-xs">High agility, primary vaccine series (FVRCP), socialization window.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">6 Months</td>
                                    <td className="p-3">10 Years</td>
                                    <td className="p-3 font-medium text-amber-600">Kitten</td>
                                    <td className="p-3 text-xs">Sexual maturity onset, permanent teeth emergence; spaying/neutering.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">1 Year</td>
                                    <td className="p-3 font-bold text-indigo-600">15 Years</td>
                                    <td className="p-3 font-medium text-emerald-600">Junior</td>
                                    <td className="p-3 text-xs">Skeletal maturity reached, transition to adult maintenance diet.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Years</td>
                                    <td className="p-3 font-bold text-indigo-600">24 Years</td>
                                    <td className="p-3 font-medium text-emerald-600">Junior</td>
                                    <td className="p-3 text-xs">Full behavioral and physical maturity; established adult weight.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/20">
                                    <td className="p-3 font-semibold text-slate-900">4 Years</td>
                                    <td className="p-3">32 Years</td>
                                    <td className="p-3 font-medium text-indigo-600">Prime Adult</td>
                                    <td className="p-3 text-xs">Peak athletic vigor; dental prophylaxis and weight management essential.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">6 Years</td>
                                    <td className="p-3">40 Years</td>
                                    <td className="p-3 font-medium text-indigo-600">Prime Adult</td>
                                    <td className="p-3 text-xs">Optimal metabolic baseline; regular preventative health monitoring.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8 Years</td>
                                    <td className="p-3">48 Years</td>
                                    <td className="p-3 font-medium text-cyan-600">Mature Adult</td>
                                    <td className="p-3 text-xs">Metabolic shift; baseline blood chemistry and renal monitoring recommended.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">10 Years</td>
                                    <td className="p-3">56 Years</td>
                                    <td className="p-3 font-medium text-cyan-600">Mature Adult</td>
                                    <td className="p-3 text-xs">Joint stiffness emergence; bi-annual veterinary wellness evaluations.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">12 Years</td>
                                    <td className="p-3 font-bold text-orange-600">64 Years</td>
                                    <td className="p-3 font-medium text-orange-600">Senior</td>
                                    <td className="p-3 text-xs">Increased screening for hyperthyroidism, hypertension, and CKD.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">14 Years</td>
                                    <td className="p-3 font-bold text-orange-600">72 Years</td>
                                    <td className="p-3 font-medium text-orange-600">Senior</td>
                                    <td className="p-3 text-xs">Cognitive changes possible; orthopedic accommodations and wet diet focus.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-rose-50/20">
                                    <td className="p-3 font-semibold text-slate-900">16 Years</td>
                                    <td className="p-3 font-bold text-rose-600">80 Years</td>
                                    <td className="p-3 font-medium text-rose-600">Geriatric</td>
                                    <td className="p-3 text-xs">Super-senior palliative care; intensive kidney, cardiac, and pain management.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-rose-50/30">
                                    <td className="p-3 font-semibold text-slate-900">20 Years</td>
                                    <td className="p-3 font-bold text-rose-700">96 Years</td>
                                    <td className="p-3 font-medium text-rose-600">Geriatric</td>
                                    <td className="p-3 text-xs">Centenarian equivalent; delicate environmental heating, hydration, and assisted living.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Indoor vs. Outdoor Lifespan Dynamics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Environmental Impact on Longevity: Indoor vs. Outdoor Living
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A cat's living environment is the single greatest determinant of life expectancy. Veterinary epidemiology data demonstrates a dramatic divergence in median lifespan based on lifestyle:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-emerald-50/50 space-y-3">
                            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                <span className="font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Indoor Lifestyle
                                </span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    12 – 18+ Years Average
                                </span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>• <strong>Zero Trauma Risk:</strong> Protected from automobile collisions, toxic plant ingestion, and territorial fights.</li>
                                <li>• <strong>Disease Shield:</strong> Significantly lower exposure to infectious pathogens including FeLV, FIV, and feline infectious peritonitis (FIP).</li>
                                <li>• <strong>Parasite Control:</strong> Minimal risk of tick-borne hemoparasites, heavy flea infestations, and tapeworms.</li>
                                <li>• <strong>Care Requirement:</strong> Requires intentional environmental enrichment, climbing towers, and puzzle feeders to prevent sedentary obesity.</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-amber-50/50 space-y-3">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                <span className="font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-amber-600" /> Outdoor / Unsupervised Lifestyle
                                </span>
                                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                    2 – 5 Years Average
                                </span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>• <strong>Severe Mortality Vectors:</strong> High statistical incidence of vehicular trauma, canine/coyote predation, and intentional poisoning.</li>
                                <li>• <strong>Contagious Transmission:</strong> Frequent exposure to bite wounds, infectious abscesses, and incurable viral diseases.</li>
                                <li>• <strong>Weather Extremes:</strong> Exposure to hypothermia in winter and severe heat stroke or dehydration in summer.</li>
                                <li>• <strong>Veterinary Need:</strong> Requires strict annual booster vaccinations, monthly multi-parasite spot-ons, and frequent wound care checks.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Clinical Health Markers Across Life Stages */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6 min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Clinical Health Markers & Senior Wellness Screening Protocols
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cats are notorious for hiding subtle symptoms of disease. Recognizing the primary geriatric health conditions before clinical crises develop is crucial for senior feline longevity:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Chronic Kidney Disease (CKD)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Affects over 30% of cats over 12 years. Early markers include increased thirst (polydipsia), increased urination (polyuria), weight loss, and elevated SDMA levels on early blood panels.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Feline Hyperthyroidism</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Common endocrine disorder in cats aged 8+. Characterized by ravenous appetite paired with weight loss, hyperactivity, vocalization, and elevated total T4 hormones.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm mb-1">Feline Osteoarthritis (DJD)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Affects upwards of 90% of cats over age 12. Symptoms rarely include limping; look instead for hesitation jumping onto counters, missed litter boxes, or reduced self-grooming.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6 min-w-0">
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
                                Why is the simple 1 cat year = 7 human years rule inaccurate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Cats mature at an exponential rate during their first two years of life. A one-year-old cat is physiologically comparable to a 15-year-old human adolescent, and a two-year-old cat is equivalent to a 24-year-old young adult. After age two, each feline year equals approximately four human years.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What formula does this cat age calculator use?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This calculator adheres to veterinary standards established by the American Animal Hospital Association (AAHA), the American Association of Feline Practitioners (AAFP), and the International Society of Feline Medicine (ISFM): Year 1 = 15 human years, Year 2 = +9 human years (reaching 24), and each subsequent year = +4 human years.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the recognized feline life stages?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern veterinary medicine recognizes six distinct feline life stages: Kitten (0–6 months), Junior (7 months–2 years), Prime (3–6 years), Mature (7–10 years), Senior (11–14 years), and Geriatric (15+ years).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does an indoor lifestyle affect a cat's lifespan?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Indoor cats generally enjoy significantly longer lifespans (averaging 12 to 18+ years) compared to outdoor cats (averaging 2 to 5 years). Indoor environments eliminate major mortality vectors including vehicular trauma, infectious contagions like FeLV and FIV, animal attacks, and severe weather exposure.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When does a cat require senior veterinary wellness screenings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Veterinarians recommend transitioning to bi-annual wellness exams starting around age 7 (Mature stage) and comprehensive senior blood, urine, and blood pressure screening by age 11 to detect chronic kidney disease, hyperthyroidism, hypertension, and arthritis early.
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECOND MANDATORY VETERINARY ADVISORY CARD */}
                <section className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-2 text-xs text-slate-600">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Mandatory Veterinary Health Disclaimer
                    </h3>
                    <p className="leading-relaxed">
                        Medical & Veterinary Disclaimer: This feline age calculator and its associated maturity guidance are provided strictly for educational and informational purposes. This tool does not constitute veterinary medical diagnosis, prognosis, or customized treatment advice. Always consult a licensed veterinary physician for individualized clinical care and health assessments.
                    </p>
                </section>
            </div>
        </div>
    );
}