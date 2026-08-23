"use client";

import React, { useState, useMemo } from "react";
import {
    Droplets,
    Scale,
    Wheat,
    PieChart,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    SlidersHorizontal,
    Plus,
    Trash2,
    FlaskConical,
    Activity,
    Layers,
    Timer
} from "lucide-react";

type UnitMode = "g" | "oz";
type LeaveningType = "sourdough" | "commercial_yeast" | "hybrid";

interface FlourEntry {
    id: string;
    name: string;
    weight: number;
    proteinPct: number;
}

interface PresetFormula {
    name: string;
    description: string;
    targetHydration: number;
    flourBlend: { name: string; pct: number; protein: number }[];
    starterPct: number;
    starterHydration: number;
    saltPct: number;
    yeastPct: number;
    oilPct: number;
    sugarPct: number;
    doughCount: number;
    targetDoughWeight: number;
}

const PRESET_FORMULAS: PresetFormula[] = [
    {
        name: "Classic Country Sourdough (Tartine Style)",
        description: "Open crumb, blistered crust, balanced tang with high gluten structure.",
        targetHydration: 75,
        flourBlend: [
            { name: "Unbleached Bread Flour", pct: 90, protein: 12.7 },
            { name: "Whole Wheat Flour", pct: 10, protein: 14.0 },
        ],
        starterPct: 20,
        starterHydration: 100,
        saltPct: 2.0,
        yeastPct: 0,
        oilPct: 0,
        sugarPct: 0,
        doughCount: 2,
        targetDoughWeight: 900,
    },
    {
        name: "Artisan High-Hydration Ciabatta",
        description: "Super aerated honeycombed crumb with ultra-crisp, thin crust.",
        targetHydration: 82,
        flourBlend: [
            { name: "High-Protein Bread Flour (Type 00 / Strong)", pct: 100, protein: 13.5 },
        ],
        starterPct: 0,
        starterHydration: 100,
        saltPct: 2.2,
        yeastPct: 0.8,
        oilPct: 3.0,
        sugarPct: 0,
        doughCount: 4,
        targetDoughWeight: 350,
    },
    {
        name: "Neapolitan Pizza Dough (24-48h Ferment)",
        description: "Pliant, leoparded crust with gentle chew and tender cornicione.",
        targetHydration: 63,
        flourBlend: [
            { name: "Italian Tipo 00 Flour", pct: 100, protein: 12.0 },
        ],
        starterPct: 0,
        starterHydration: 100,
        saltPct: 3.0,
        yeastPct: 0.2,
        oilPct: 0,
        sugarPct: 0,
        doughCount: 4,
        targetDoughWeight: 260,
    },
    {
        name: "Rustic Sandwich Pan Loaf",
        description: "Soft, uniform crumb enriched with fat for soft slicing.",
        targetHydration: 66,
        flourBlend: [
            { name: "All-Purpose Flour", pct: 80, protein: 11.5 },
            { name: "Whole Spelt Flour", pct: 20, protein: 12.5 },
        ],
        starterPct: 15,
        starterHydration: 100,
        saltPct: 2.0,
        yeastPct: 0.4,
        oilPct: 5.0,
        sugarPct: 4.0,
        doughCount: 1,
        targetDoughWeight: 850,
    },
    {
        name: "Authentic New York Bagels",
        description: "Dense, chewy interior with shiny, blistered crust from stiff dough.",
        targetHydration: 54,
        flourBlend: [
            { name: "High-Gluten Flour", pct: 100, protein: 14.2 },
        ],
        starterPct: 0,
        starterHydration: 100,
        saltPct: 2.0,
        yeastPct: 1.0,
        oilPct: 0,
        sugarPct: 3.0,
        doughCount: 6,
        targetDoughWeight: 130,
    },
    {
        name: "100% Whole Wheat Sourdough",
        description: "Nutty, hearty rustic loaf requiring high hydration due to bran absorbency.",
        targetHydration: 85,
        flourBlend: [
            { name: "Hard Red Spring Whole Wheat", pct: 100, protein: 14.5 },
        ],
        starterPct: 20,
        starterHydration: 100,
        saltPct: 2.1,
        yeastPct: 0,
        oilPct: 0,
        sugarPct: 0,
        doughCount: 2,
        targetDoughWeight: 850,
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

export default function SourdoughHydrationCalculator() {
    // Mode States
    const [calcMode, setCalcMode] = useState<"bakers_pct" | "target_dough">("bakers_pct");
    const [unit, setUnit] = useState<UnitMode>("g");
    const [leavening, setLeavening] = useState<LeaveningType>("sourdough");

    // Multi-Flour State
    const [flours, setFlours] = useState<FlourEntry[]>([
        { id: "1", name: "Bread Flour", weight: 450, proteinPct: 12.7 },
        { id: "2", name: "Whole Wheat", weight: 50, proteinPct: 14.0 }
    ]);

    // Target Dough Mode State
    const [numberOfLoaves, setNumberOfLoaves] = useState<number>(2);
    const [targetLoafWeight, setTargetLoafWeight] = useState<number>(850);

    // Direct Baker's Percentages & Additions
    const [directWaterWeight, setDirectWaterWeight] = useState<number>(375);
    const [targetHydrationPct, setTargetHydrationPct] = useState<number>(76);

    // Leaven / Starter State
    const [starterWeight, setStarterWeight] = useState<number>(100);
    const [starterHydrationPct, setStarterHydrationPct] = useState<number>(100);

    // Additional Ingredients
    const [saltWeight, setSaltWeight] = useState<number>(10);
    const [yeastWeight, setYeastWeight] = useState<number>(0);
    const [oilWeight, setOilWeight] = useState<number>(0);
    const [sugarWeight, setSugarWeight] = useState<number>(0);

    // Baker's % Settings for Target Dough Mode
    const [targetStarterPct, setTargetStarterPct] = useState<number>(20);
    const [targetSaltPct, setTargetSaltPct] = useState<number>(2.0);
    const [targetYeastPct, setTargetYeastPct] = useState<number>(0);
    const [targetOilPct, setTargetOilPct] = useState<number>(0);
    const [targetSugarPct, setTargetSugarPct] = useState<number>(0);

    // UI state
    const [isAdvancedEnrichments, setIsAdvancedEnrichments] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    // Flour Handlers
    const addFlourRow = () => {
        const newId = (flours.length + 1).toString() + "_" + Date.now();
        setFlours([...flours, { id: newId, name: `Grain Blend #${flours.length + 1}`, weight: 50, proteinPct: 11.5 }]);
    };

    const removeFlourRow = (id: string) => {
        if (flours.length <= 1) return;
        setFlours(flours.filter((f) => f.id !== id));
    };

    const updateFlour = (id: string, field: keyof FlourEntry, value: string | number) => {
        setFlours(flours.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
    };

    // Calculations Engine
    const calculations = useMemo(() => {
        let totalFlourInRecipe = 0;
        let weightedProteinSum = 0;

        if (calcMode === "bakers_pct") {
            totalFlourInRecipe = flours.reduce((sum, f) => sum + (Number(f.weight) || 0), 0);
            flours.forEach((f) => {
                weightedProteinSum += (Number(f.weight) || 0) * (Number(f.proteinPct) || 0);
            });
        } else {
            // Target Dough Weight Mode
            // Total % = 100% (Flour) + Hydration% + Salt% + Oil% + Sugar% + Yeast% + Starter%(flour+water breakdown)
            const targetTotalBatch = numberOfLoaves * targetLoafWeight;

            // Starter contributes flour and water proportionally
            const starterWaterFraction = (starterHydrationPct / 100) / (1 + starterHydrationPct / 100);

            const activeStarterPct = leavening === "commercial_yeast" ? 0 : targetStarterPct;
            const activeYeastPct = leavening === "sourdough" ? 0 : targetYeastPct;

            const starterWaterPct = activeStarterPct * starterWaterFraction;
            const addedWaterPct = Math.max(0, targetHydrationPct - starterWaterPct);

            const totalBakerPctSum = 100 + addedWaterPct + activeStarterPct + targetSaltPct + activeYeastPct + targetOilPct + targetSugarPct;

            totalFlourInRecipe = (targetTotalBatch / totalBakerPctSum) * 100;
        }

        const safeTotalFlour = Math.max(totalFlourInRecipe, 0.001);
        const avgProteinPct = totalFlourInRecipe > 0 ? (weightedProteinSum / safeTotalFlour) : 12.5;

        // Effective Leavening Parameters
        let effectiveStarterWeight = 0;
        const effectiveStarterHydration = starterHydrationPct;
        let effectiveDirectWater = 0;
        let effectiveSalt = 0;
        let effectiveYeast = 0;
        let effectiveOil = 0;
        let effectiveSugar = 0;

        if (calcMode === "bakers_pct") {
            effectiveStarterWeight = leavening === "commercial_yeast" ? 0 : starterWeight;
            effectiveDirectWater = directWaterWeight;
            effectiveSalt = saltWeight;
            effectiveYeast = leavening === "sourdough" ? 0 : yeastWeight;
            effectiveOil = isAdvancedEnrichments ? oilWeight : 0;
            effectiveSugar = isAdvancedEnrichments ? sugarWeight : 0;
        } else {
            effectiveStarterWeight = leavening === "commercial_yeast" ? 0 : (safeTotalFlour * (targetStarterPct / 100));
            effectiveSalt = safeTotalFlour * (targetSaltPct / 100);
            effectiveYeast = leavening === "sourdough" ? 0 : (safeTotalFlour * (targetYeastPct / 100));
            effectiveOil = safeTotalFlour * (targetOilPct / 100);
            effectiveSugar = safeTotalFlour * (targetSugarPct / 100);

            // Calculate direct water needed to reach exact true hydration
            const starterFlour = effectiveStarterWeight / (1 + (effectiveStarterHydration / 100));
            const starterWater = effectiveStarterWeight - starterFlour;
            const totalTrueFlour = safeTotalFlour + starterFlour;
            const targetTotalWater = totalTrueFlour * (targetHydrationPct / 100);
            effectiveDirectWater = Math.max(0, targetTotalWater - starterWater);
        }

        // True Component Breakdown
        const starterFlour = effectiveStarterWeight / (1 + (effectiveStarterHydration / 100));
        const starterWater = effectiveStarterWeight - starterFlour;

        const totalFlourOverall = safeTotalFlour + starterFlour;
        const totalWaterOverall = effectiveDirectWater + starterWater;

        // Apparent vs True Hydration
        const apparentHydration = (effectiveDirectWater / safeTotalFlour) * 100;
        const trueHydration = (totalWaterOverall / totalFlourOverall) * 100;

        // Baker's % calculation
        const bakersWaterPct = (effectiveDirectWater / safeTotalFlour) * 100;
        const bakersStarterPct = (effectiveStarterWeight / safeTotalFlour) * 100;
        const bakersSaltPct = (effectiveSalt / safeTotalFlour) * 100;
        const bakersYeastPct = (effectiveYeast / safeTotalFlour) * 100;
        const bakersOilPct = (effectiveOil / safeTotalFlour) * 100;
        const bakersSugarPct = (effectiveSugar / safeTotalFlour) * 100;

        // Total Batch Weight & per Loaf Weight
        const totalDoughWeight = safeTotalFlour + effectiveDirectWater + effectiveStarterWeight + effectiveSalt + effectiveYeast + effectiveOil + effectiveSugar;
        const activeLoaves = calcMode === "target_dough" ? numberOfLoaves : 1;
        const individualLoafWeight = totalDoughWeight / Math.max(1, activeLoaves);

        // Dough Feel / Handling Characteristic Classification
        let handlingLevel = "Medium Hydration (Standard)";
        let handlingColor = "text-indigo-600 bg-indigo-50 border-indigo-200";
        let handlingDescription = "Balanced gluten development, standard autolyse and coil folds recommended.";

        if (trueHydration < 58) {
            handlingLevel = "Stiff / Low Hydration";
            handlingColor = "text-amber-700 bg-amber-50 border-amber-200";
            handlingDescription = "Dense, firm dough (Bagels, Pretzels). Requires intensive kneading; resistant to extensible stretching.";
        } else if (trueHydration >= 58 && trueHydration < 68) {
            handlingLevel = "Moderate / Beginner-Friendly";
            handlingColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
            handlingDescription = "Easy to shape by hand, holds structural tension cleanly without sticking. Ideal for sandwich bread & tin loaves.";
        } else if (trueHydration >= 68 && trueHydration < 78) {
            handlingLevel = "Artisan / High Hydration";
            handlingColor = "text-blue-700 bg-blue-50 border-blue-200";
            handlingDescription = "Supple and extensible (Classic Tartine). Requires autolyse, strength building folds, and high-protein flour.";
        } else if (trueHydration >= 78 && trueHydration < 86) {
            handlingLevel = "Very High / Ciabatta Style";
            handlingColor = "text-purple-700 bg-purple-50 border-purple-200";
            handlingDescription = "Very wet, slacker dough. Requires bassinage (delayed water addition), gentle coil folds, and high bench skill.";
        } else {
            handlingLevel = "Extreme / Pan Bread / Focaccia";
            handlingColor = "text-rose-700 bg-rose-50 border-rose-200";
            handlingDescription = "Liquid batter-like consistency. Best suited for well-oiled focaccia trays or structural tin pans.";
        }

        return {
            totalFlourInRecipe: safeTotalFlour,
            totalFlourOverall,
            totalWaterOverall,
            apparentHydration,
            trueHydration,
            effectiveDirectWater,
            effectiveStarterWeight,
            starterFlour,
            starterWater,
            effectiveSalt,
            effectiveYeast,
            effectiveOil,
            effectiveSugar,
            totalDoughWeight,
            individualLoafWeight,
            avgProteinPct,
            bakersWaterPct,
            bakersStarterPct,
            bakersSaltPct,
            bakersYeastPct,
            bakersOilPct,
            bakersSugarPct,
            handlingLevel,
            handlingColor,
            handlingDescription
        };
    }, [
        calcMode,
        flours,
        directWaterWeight,
        starterWeight,
        starterHydrationPct,
        saltWeight,
        yeastWeight,
        oilWeight,
        sugarWeight,
        leavening,
        numberOfLoaves,
        targetLoafWeight,
        targetHydrationPct,
        targetStarterPct,
        targetSaltPct,
        targetYeastPct,
        targetOilPct,
        targetSugarPct,
        isAdvancedEnrichments
    ]);

    // Apply Preset Formula
    const handleApplyPreset = (preset: PresetFormula) => {
        setTargetHydrationPct(preset.targetHydration);
        setDirectWaterWeight(Math.round(500 * (preset.targetHydration / 100)));
        setStarterHydrationPct(preset.starterHydration);
        setTargetStarterPct(preset.starterPct);
        setTargetSaltPct(preset.saltPct);
        setSaltWeight(Math.round(500 * (preset.saltPct / 100)));
        setTargetYeastPct(preset.yeastPct);
        setYeastWeight(Math.round(500 * (preset.yeastPct / 100)));
        setTargetOilPct(preset.oilPct);
        setOilWeight(Math.round(500 * (preset.oilPct / 100)));
        setTargetSugarPct(preset.sugarPct);
        setSugarWeight(Math.round(500 * (preset.sugarPct / 100)));
        setNumberOfLoaves(preset.doughCount);
        setTargetLoafWeight(preset.targetDoughWeight);

        if (preset.starterPct > 0 && preset.yeastPct > 0) {
            setLeavening("hybrid");
        } else if (preset.starterPct > 0) {
            setLeavening("sourdough");
        } else {
            setLeavening("commercial_yeast");
        }

        if (preset.oilPct > 0 || preset.sugarPct > 0) {
            setIsAdvancedEnrichments(true);
        }

        // Apply flour breakdown
        const baseFlourTotal = 500;
        const newFlours: FlourEntry[] = preset.flourBlend.map((item, idx) => ({
            id: (idx + 1).toString(),
            name: item.name,
            weight: Math.round(baseFlourTotal * (item.pct / 100)),
            proteinPct: item.protein
        }));
        setFlours(newFlours);
    };

    const handleReset = () => {
        setCalcMode("bakers_pct");
        setUnit("g");
        setLeavening("sourdough");
        setFlours([
            { id: "1", name: "Bread Flour", weight: 450, proteinPct: 12.7 },
            { id: "2", name: "Whole Wheat", weight: 50, proteinPct: 14.0 }
        ]);
        setDirectWaterWeight(375);
        setTargetHydrationPct(76);
        setStarterWeight(100);
        setStarterHydrationPct(100);
        setSaltWeight(10);
        setYeastWeight(0);
        setOilWeight(0);
        setSugarWeight(0);
        setTargetStarterPct(20);
        setTargetSaltPct(2.0);
        setTargetYeastPct(0);
        setTargetOilPct(0);
        setTargetSugarPct(0);
        setNumberOfLoaves(2);
        setTargetLoafWeight(850);
        setIsAdvancedEnrichments(false);
    };

    const handleCopyFormula = () => {
        const u = unit;
        const summary = `🥖 Sourdough & Baker's Formula
--------------------------------------------
True Hydration: ${calculations.trueHydration.toFixed(1)}% (Apparent: ${calculations.apparentHydration.toFixed(1)}%)
Total Batch Yield: ${calculations.totalDoughWeight.toFixed(0)}${u} (${calculations.individualLoafWeight.toFixed(0)}${u} × ${calcMode === "target_dough" ? numberOfLoaves : 1} loaves)

Formula Breakdown:
• Total Flour in Base: ${calculations.totalFlourInRecipe.toFixed(1)}${u} (100.0%)
• Added Water: ${calculations.effectiveDirectWater.toFixed(1)}${u} (${calculations.bakersWaterPct.toFixed(1)}%)
${leavening !== "commercial_yeast" ? `• Starter (Leaven @ ${starterHydrationPct}% hyd): ${calculations.effectiveStarterWeight.toFixed(1)}${u} (${calculations.bakersStarterPct.toFixed(1)}%)
  ↳ Included Starter Flour: ${calculations.starterFlour.toFixed(1)}${u}
  ↳ Included Starter Water: ${calculations.starterWater.toFixed(1)}${u}\n` : ""}${leavening !== "sourdough" ? `• Commercial Yeast: ${calculations.effectiveYeast.toFixed(1)}${u} (${calculations.bakersYeastPct.toFixed(2)}%)\n` : ""}• Salt: ${calculations.effectiveSalt.toFixed(1)}${u} (${calculations.bakersSaltPct.toFixed(1)}%)
${calculations.effectiveOil > 0 ? `• Oil / Fat: ${calculations.effectiveOil.toFixed(1)}${u} (${calculations.bakersOilPct.toFixed(1)}%)\n` : ""}${calculations.effectiveSugar > 0 ? `• Sugar / Honey: ${calculations.effectiveSugar.toFixed(1)}${u} (${calculations.bakersSugarPct.toFixed(1)}%)\n` : ""}
Total Overall Flour: ${calculations.totalFlourOverall.toFixed(1)}${u}
Total Overall Water: ${calculations.totalWaterOverall.toFixed(1)}${u}
Estimated Dough Character: ${calculations.handlingLevel}
--------------------------------------------
Calculated via twistertools.com/tools/home-tools/sourdough-hydration-calculator`;

        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // SEO Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Yeast & Sourdough Hydration Percentage Calculator",
        "url": "https://twistertools.com/tools/home-tools/sourdough-hydration-calculator",
        "description": "Enterprise-grade baker's percentage and sourdough hydration calculator. Calculates true hydration with levain flour-water splits, multi-flour blends, and target dough scaling.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What is the difference between Apparent Hydration and True Hydration?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Apparent hydration only divides the added water by the dry base flour. True hydration accounts for the flour and water already contained inside your sourdough starter (levain). For example, with 100g of 100% hydration starter added to 500g dry flour and 350g water, apparent hydration is 70%, but true hydration is (350+50)/(500+50) = 72.7%."
                }
            },
            {
                "@type": "Question",
                "name": "How do Baker's Percentages work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In professional baking, the total weight of all dry flour in the recipe is established as the 100% baseline. Every other ingredient (water, levain, salt, yeast, fats) is calculated and expressed as a direct percentage of that total flour weight, allowing recipes to scale perfectly to any batch size."
                }
            },
            {
                "@type": "Question",
                "name": "How does flour protein content affect hydration capacity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Flours with higher protein (glutenin and gliadin) content, such as hard spring wheat bread flour (12.5% to 14.5% protein), absorb significantly more water while maintaining structural gluten tension. Lower protein flours (All-Purpose at 10-11%) become sticky and slack if pushed above 72% hydration."
                }
            },
            {
                "@type": "Question",
                "name": "Why does whole grain flour require higher hydration?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Whole grain flours retain the bran and germ. Wheat bran contains high levels of pentosans and insoluble fiber that absorb large quantities of water like a sponge. Whole wheat recipes generally require 5% to 10% more water to achieve the same dough consistency as white flour."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard salt percentage in sourdough baking?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The golden standard is 2.0% to 2.2% of total flour weight. Salt does not just add flavor; it strengthens the gluten matrix by shielding ionic charges on protein strands, regulates enzymatic protease activity, and controls fermentation speed."
                }
            },
            {
                "@type": "Question",
                "name": "How do I calculate starter hydration when feeding my levain?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Starter hydration is calculated by dividing water weight by flour weight during feeding. A 100% hydration starter uses equal weights of flour and water (e.g., 50g flour + 50g water). A stiff levain (50-60% hydration) has less water and ferments with lower acidity, while a liquid levain (>100% hydration) encourages lactic acid production."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Bar Mode Switcher */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <Scale className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                            Sourdough & Yeast Hydration Matrix
                        </h1>
                        <p className="text-xs text-slate-500 font-medium">
                            True Levain Flour-Water Split • Baker&apos;s Percentages • Scaled Yields
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Unit Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setUnit("g")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "g" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Grams (g)
                        </button>
                        <button
                            type="button"
                            onClick={() => setUnit("oz")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${unit === "oz" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Ounces (oz)
                        </button>
                    </div>

                    {/* Calculation Mode */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setCalcMode("bakers_pct")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${calcMode === "bakers_pct" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Direct Weights
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalcMode("target_dough")}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${calcMode === "target_dough" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                        >
                            Target Loaf Yield
                        </button>
                    </div>
                </div>
            </div>

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* LEFT PANEL: Flour Blends, Water & Formula Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Section Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Wheat className="w-5 h-5 text-indigo-600" />
                                Recipe Formula & Flour Blend
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Leavening Method Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Leavening System
                            </label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setLeavening("sourdough")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${leavening === "sourdough" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Sourdough Starter
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeavening("commercial_yeast")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${leavening === "commercial_yeast" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Instant / Dry Yeast
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLeavening("hybrid")}
                                    className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${leavening === "hybrid" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Hybrid (Both)
                                </button>
                            </div>
                        </div>

                        {/* Target Loaf Mode Inputs */}
                        {calcMode === "target_dough" ? (
                            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                                    <Layers className="w-4 h-4 text-indigo-600" /> Target Batch Scaling
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Number of Loaves</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={numberOfLoaves === 0 ? "" : numberOfLoaves}
                                            onChange={(e) => handleNumberInput(e, setNumberOfLoaves)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Weight per Loaf ({unit})</label>
                                        <input
                                            type="number"
                                            min={50}
                                            max={5000}
                                            value={targetLoafWeight === 0 ? "" : targetLoafWeight}
                                            onChange={(e) => handleNumberInput(e, setTargetLoafWeight)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-indigo-100/60">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700">Target True Hydration:</span>
                                        <span className="font-black text-indigo-600 text-sm">{targetHydrationPct}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={50}
                                        max={95}
                                        step={1}
                                        value={targetHydrationPct}
                                        onChange={(e) => setTargetHydrationPct(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                        <span>55% (Stiff)</span>
                                        <span>75% (Tartine)</span>
                                        <span>90%+ (Ciabatta/Focaccia)</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Direct Weight Mode: Multi-Flour Blend Manager */
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wheat className="w-4 h-4 text-indigo-600" />
                                        Flour Components (100% Base)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addFlourRow}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Flour Type
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {flours.map((flour) => {
                                        const pctOfFlour = calculations.totalFlourInRecipe > 0
                                            ? ((Number(flour.weight) || 0) / calculations.totalFlourInRecipe) * 100
                                            : 0;

                                        return (
                                            <div key={flour.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={flour.name}
                                                        onChange={(e) => updateFlour(flour.id, "name", e.target.value)}
                                                        placeholder="Flour name"
                                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-24">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            value={flour.weight === 0 ? "" : flour.weight}
                                                            onChange={(e) => {
                                                                const raw = e.target.value;
                                                                const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                                const num = parseFloat(cleaned);
                                                                updateFlour(flour.id, "weight", isNaN(num) ? 0 : num);
                                                            }}
                                                            placeholder="0"
                                                            className="w-full pl-2 pr-6 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">{unit}</span>
                                                    </div>

                                                    <div className="relative w-20">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min={7}
                                                            max={20}
                                                            value={flour.proteinPct === 0 ? "" : flour.proteinPct}
                                                            onChange={(e) => {
                                                                const raw = e.target.value;
                                                                const cleaned = raw.replace(/^0+(?=\d)/, "");
                                                                const num = parseFloat(cleaned);
                                                                updateFlour(flour.id, "proteinPct", isNaN(num) ? 0 : num);
                                                            }}
                                                            placeholder="Protein %"
                                                            className="w-full pl-1.5 pr-5 py-1.5 text-right font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                                                        />
                                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%P</span>
                                                    </div>

                                                    <span className="text-[11px] font-bold text-indigo-600 w-12 text-right">
                                                        {pctOfFlour.toFixed(0)}%
                                                    </span>

                                                    {flours.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFlourRow(flour.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Direct Water and Starter Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Water Input */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Droplets className="w-4 h-4 text-blue-500" />
                                        {calcMode === "bakers_pct" ? "Added Water" : "Target Water %"}
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {calculations.bakersWaterPct.toFixed(1)}%
                                    </span>
                                </div>

                                {calcMode === "bakers_pct" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={0}
                                            value={directWaterWeight === 0 ? "" : directWaterWeight}
                                            onChange={(e) => handleNumberInput(e, setDirectWaterWeight)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
                                    </div>
                                ) : (
                                    <div className="p-2 bg-white rounded-lg border border-slate-200 text-center font-black text-slate-900 text-sm">
                                        {calculations.effectiveDirectWater.toFixed(1)} {unit}
                                    </div>
                                )}
                            </div>

                            {/* Salt Input */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <FlaskConical className="w-4 h-4 text-slate-500" />
                                        Salt {calcMode === "target_dough" ? "(%)" : `(${unit})`}
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {calculations.bakersSaltPct.toFixed(1)}%
                                    </span>
                                </div>

                                {calcMode === "bakers_pct" ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.5"
                                            min={0}
                                            value={saltWeight === 0 ? "" : saltWeight}
                                            onChange={(e) => handleNumberInput(e, setSaltWeight)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{unit}</span>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={targetSaltPct === 0 ? "" : targetSaltPct}
                                            onChange={(e) => handleNumberInput(e, setTargetSaltPct)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sourdough Starter Settings (If applicable) */}
                        {leavening !== "commercial_yeast" && (
                            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Activity className="w-4 h-4 text-amber-600" />
                                        Sourdough Starter (Levain)
                                    </label>
                                    <span className="text-xs font-bold text-amber-800">
                                        {calculations.bakersStarterPct.toFixed(1)}% of flour
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-600">
                                            {calcMode === "bakers_pct" ? `Starter Weight (${unit})` : "Starter Baker's %"}
                                        </span>
                                        {calcMode === "bakers_pct" ? (
                                            <input
                                                type="number"
                                                min={0}
                                                value={starterWeight === 0 ? "" : starterWeight}
                                                onChange={(e) => handleNumberInput(e, setStarterWeight)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={targetStarterPct === 0 ? "" : targetStarterPct}
                                                onChange={(e) => handleNumberInput(e, setTargetStarterPct)}
                                                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                                            />
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-600">Starter Feeding Hydration (%)</span>
                                        <input
                                            type="number"
                                            min={40}
                                            max={200}
                                            value={starterHydrationPct === 0 ? "" : starterHydrationPct}
                                            onChange={(e) => handleNumberInput(e, setStarterHydrationPct)}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-lg flex items-center justify-between">
                                    <span>Starter Flour Contribution: <strong>{calculations.starterFlour.toFixed(1)}{unit}</strong></span>
                                    <span>Starter Water Contribution: <strong>{calculations.starterWater.toFixed(1)}{unit}</strong></span>
                                </div>
                            </div>
                        )}

                        {/* Commercial Yeast Setting */}
                        {leavening !== "sourdough" && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Timer className="w-4 h-4 text-indigo-600" />
                                        Commercial Dry / Instant Yeast
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {calculations.bakersYeastPct.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="relative">
                                    {calcMode === "bakers_pct" ? (
                                        <input
                                            type="number"
                                            step="0.1"
                                            min={0}
                                            value={yeastWeight === 0 ? "" : yeastWeight}
                                            onChange={(e) => handleNumberInput(e, setYeastWeight)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none"
                                        />
                                    ) : (
                                        <input
                                            type="number"
                                            step="0.05"
                                            min={0}
                                            value={targetYeastPct === 0 ? "" : targetYeastPct}
                                            onChange={(e) => handleNumberInput(e, setTargetYeastPct)}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 outline-none"
                                        />
                                    )}
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        {calcMode === "bakers_pct" ? unit : "%"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Advanced Enrichments Toggle */}
                        <div className="pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsAdvancedEnrichments(!isAdvancedEnrichments)}
                                className="flex items-center justify-between w-full text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {isAdvancedEnrichments ? "Enrichments (Fats & Sugars Active)" : "Add Enrichments (Oil, Butter, Honey, Sugar)"}
                                </span>
                                <span>{isAdvancedEnrichments ? "Hide" : "Show"}</span>
                            </button>

                            {isAdvancedEnrichments && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-700">Oil / Fat ({calcMode === "bakers_pct" ? unit : "%"})</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={calcMode === "bakers_pct" ? (oilWeight === 0 ? "" : oilWeight) : (targetOilPct === 0 ? "" : targetOilPct)}
                                            onChange={(e) => handleNumberInput(e, calcMode === "bakers_pct" ? setOilWeight : setTargetOilPct)}
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[11px] font-bold text-slate-700">Sugar / Honey ({calcMode === "bakers_pct" ? unit : "%"})</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={calcMode === "bakers_pct" ? (sugarWeight === 0 ? "" : sugarWeight) : (targetSugarPct === 0 ? "" : targetSugarPct)}
                                            onChange={(e) => handleNumberInput(e, calcMode === "bakers_pct" ? setSugarWeight : setTargetSugarPct)}
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Quick Presets Grid */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Master Bread Formulas & Presets
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {PRESET_FORMULAS.slice(0, 4).map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="p-2.5 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-200 transition text-xs cursor-pointer group"
                                    >
                                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">{preset.name}</p>
                                        <p className="text-[11px] text-slate-500">{preset.targetHydration}% True Hydration • {preset.flourBlend[0].name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT PANEL: Hydration Matrix & Baker's Ledger Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-indigo-600" />
                                Hydration Ledger & Baker&apos;s Matrix
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                Verified Balance
                            </span>
                        </div>

                        {/* Hero Output Hydration Displays */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* True Hydration Card */}
                            <div className="p-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 shadow-sm transition hover:shadow-md duration-300 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-900">
                                    <span className="flex items-center gap-1">
                                        <Droplets className="w-4 h-4 text-emerald-600" /> True Hydration
                                    </span>
                                    <span className="text-[11px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md font-bold">
                                        Includes Levain
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight pt-1">
                                    {calculations.trueHydration.toFixed(1)}%
                                </div>
                                <p className="text-xs font-medium text-emerald-800/80">
                                    Apparent (Dry Base): <strong className="text-emerald-900">{calculations.apparentHydration.toFixed(1)}%</strong>
                                </p>
                            </div>

                            {/* Total Batch Yield Card */}
                            <div className="p-5 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/60 shadow-sm transition hover:shadow-md duration-300 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-900">
                                    <span className="flex items-center gap-1">
                                        <Scale className="w-4 h-4 text-amber-600" /> Total Dough Yield
                                    </span>
                                    <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md font-bold">
                                        {calcMode === "target_dough" ? `${numberOfLoaves} Loaves` : "Single Batch"}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-amber-950 tracking-tight pt-1">
                                    {calculations.totalDoughWeight.toFixed(0)}
                                    <span className="text-lg font-bold text-amber-600/80 ml-1">{unit}</span>
                                </div>
                                <p className="text-xs font-medium text-amber-800/80">
                                    Per Loaf: <strong className="text-amber-900">{calculations.individualLoafWeight.toFixed(0)} {unit}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Dough Texture & Handling Character Banner */}
                        <div className={`p-4 rounded-xl border ${calculations.handlingColor} space-y-1 text-xs`}>
                            <div className="flex items-center justify-between font-bold uppercase tracking-wider">
                                <span>Dough Classification: {calculations.handlingLevel}</span>
                                <span>Avg Protein: {calculations.avgProteinPct.toFixed(1)}%</span>
                            </div>
                            <p className="leading-relaxed font-medium">
                                {calculations.handlingDescription}
                            </p>
                        </div>

                        {/* Comprehensive Baker's Percentage Table */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Complete Formula Ledger
                            </span>
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-left text-xs text-slate-700">
                                    <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-2.5">Component</th>
                                            <th className="p-2.5 text-right">Scaled Weight</th>
                                            <th className="p-2.5 text-right">Baker&apos;s %</th>
                                            <th className="p-2.5 text-right">True %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium">
                                        {/* Flour Total */}
                                        <tr className="bg-slate-50/50">
                                            <td className="p-2.5 font-bold text-slate-900">Total Base Dry Flour</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{calculations.totalFlourInRecipe.toFixed(1)} {unit}</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-indigo-600">100.0%</td>
                                            <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.totalFlourInRecipe / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                        </tr>
                                        {/* Added Water */}
                                        <tr>
                                            <td className="p-2.5 text-slate-800">Added Water (Direct)</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.effectiveDirectWater.toFixed(1)} {unit}</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.bakersWaterPct.toFixed(1)}%</td>
                                            <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveDirectWater / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                        </tr>
                                        {/* Levain / Starter */}
                                        {leavening !== "commercial_yeast" && (
                                            <tr>
                                                <td className="p-2.5 text-amber-900">
                                                    Starter ({starterHydrationPct}% hyd.)
                                                </td>
                                                <td className="p-2.5 text-right font-mono font-bold text-amber-900">{calculations.effectiveStarterWeight.toFixed(1)} {unit}</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-amber-700">{calculations.bakersStarterPct.toFixed(1)}%</td>
                                                <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveStarterWeight / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                            </tr>
                                        )}
                                        {/* Commercial Yeast */}
                                        {leavening !== "sourdough" && (
                                            <tr>
                                                <td className="p-2.5 text-slate-800">Commercial Instant Yeast</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.effectiveYeast.toFixed(2)} {unit}</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.bakersYeastPct.toFixed(2)}%</td>
                                                <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveYeast / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                            </tr>
                                        )}
                                        {/* Salt */}
                                        <tr>
                                            <td className="p-2.5 text-slate-800">Fine Sea Salt</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.effectiveSalt.toFixed(1)} {unit}</td>
                                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.bakersSaltPct.toFixed(1)}%</td>
                                            <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveSalt / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                        </tr>
                                        {/* Enrichments */}
                                        {calculations.effectiveOil > 0 && (
                                            <tr>
                                                <td className="p-2.5 text-slate-800">Oil / Fat</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.effectiveOil.toFixed(1)} {unit}</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.bakersOilPct.toFixed(1)}%</td>
                                                <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveOil / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                            </tr>
                                        )}
                                        {calculations.effectiveSugar > 0 && (
                                            <tr>
                                                <td className="p-2.5 text-slate-800">Sugar / Honey</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.effectiveSugar.toFixed(1)} {unit}</td>
                                                <td className="p-2.5 text-right font-mono font-bold text-slate-800">{calculations.bakersSugarPct.toFixed(1)}%</td>
                                                <td className="p-2.5 text-right font-mono text-slate-500">{((calculations.effectiveSugar / calculations.totalDoughWeight) * 100).toFixed(1)}%</td>
                                            </tr>
                                        )}
                                        {/* True Net Sums */}
                                        <tr className="bg-indigo-50/50 font-bold text-indigo-950">
                                            <td className="p-2.5">Combined Total Water</td>
                                            <td className="p-2.5 text-right font-mono">{calculations.totalWaterOverall.toFixed(1)} {unit}</td>
                                            <td colSpan={2} className="p-2.5 text-right font-mono text-indigo-700">True Hyd: {calculations.trueHydration.toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Master Baker's Directive Card */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Info className="w-4 h-4 text-indigo-400" />
                                Professional Mixing Protocol
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                <li><strong>Autolyse Step:</strong> Mix flour and {calculations.effectiveDirectWater.toFixed(0)}{unit} water for 30–45 mins before adding starter/salt.</li>
                                <li><strong>Bassinage Method:</strong> If true hydration exceeds 78%, hold back 5% water and incorporate during slap & folds.</li>
                                <li><strong>Bulk Temp Target:</strong> Aim for final dough temperature (FDT) of 76°F – 78°F (24°C – 26°C).</li>
                            </ul>
                        </div>

                    </div>

                    {/* Copy Summary Action */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyFormula}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Formula Ledger Copied!" : "Copy Formula & Percentages"}
                        </button>
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD DETAILED PROSE & SEO CARD SYSTEM */}
            <div className="space-y-6">

                {/* Card 1: The Mathematics of Baker's Percentages & Levain Splits */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science & Mathematics of True Sourdough Hydration
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In home and commercial bread baking, hydration is the single most influential variable determining crumb openness, crust thickness, dough extensibility, and shelf life. However, many standard recipes miscalculate hydration by ignoring the flour and water pre-fermented inside the sourdough levain (starter).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-indigo-600" /> Apparent vs. True Hydration
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                <strong>Apparent Hydration</strong> considers only the water and flour mixed directly into the mixing bowl. <strong>True Hydration</strong> deconstructs the sourdough starter into its separate water and flour constituents and aggregates them with the base ingredients.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> The Baker&apos;s Percentage Baseline
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Rather than standard culinary percentages where all ingredients sum to 100%, baker&apos;s percentages define the combined dry flour weight as <strong>100%</strong>. This universal mathematical system allows instant scaling for 1 loaf or 10,000 loaves without changing dough behavior.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <FlaskConical className="w-4 h-4" /> The Exact True Hydration Formulation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {"For a starter fed at hydration $H_{starter}$ (where 100% means equal parts water and flour):"}
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Levain Flour Decomposition:</span>
                                <strong className="text-indigo-300 text-sm">Flour_levain = Weight_starter / (1 + H_starter)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">True Hydration Calculation:</span>
                                <strong className="text-indigo-300 text-sm">True Hydration = (Water_direct + Water_levain) / (Flour_dry + Flour_levain)</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Flour Types, Protein Levels & Absorption Capacity */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Wheat className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Flour Protein Absorption Spectrum & Hydration Limits
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Not all flours absorb water equally. Gluten proteins (gliadin and glutenin) absorb roughly 200% of their weight in water, while damaged starch and insoluble dietary fibers in whole grains absorb up to 300%. Attempting high hydration (78%+) on low-protein flour results in soup-like dough that collapses during baking.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Flour Classification</th>
                                    <th className="p-3">Protein %</th>
                                    <th className="p-3">Ideal Hydration Range</th>
                                    <th className="p-3">Dough Character & Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Italian Tipo 00 (Soft Wheat)</td>
                                    <td className="p-3 font-mono">11.0% - 12.0%</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">58% - 65%</td>
                                    <td className="p-3 text-xs">High extensibility, low elasticity. World benchmark for Neapolitan pizza and focaccia.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">All-Purpose Unbleached Flour</td>
                                    <td className="p-3 font-mono">10.5% - 11.7%</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">62% - 68%</td>
                                    <td className="p-3 text-xs">Moderate gluten development. Best suited for sandwich loaves, biscuits, and quick breads.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Hard Red Spring Bread Flour</td>
                                    <td className="p-3 font-mono">12.7% - 14.0%</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">72% - 82%</td>
                                    <td className="p-3 text-xs">High gas retention and strong tensile strength. Excellent for open-crumb artisan sourdough.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Whole Wheat / Spelt Flour</td>
                                    <td className="p-3 font-mono">13.5% - 15.0%</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">78% - 90%</td>
                                    <td className="p-3 text-xs">Bran fiber aggressively drinks water. Sharp bran edges cut gluten strands, needing gentle folds.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Dark Rye (Type 1150 / Whole)</td>
                                    <td className="p-3 font-mono">9.5% - 11.5%</td>
                                    <td className="p-3 font-bold text-indigo-700 font-mono">75% - 85%</td>
                                    <td className="p-3 text-xs">Contains pentosans instead of glutenin. Creates sticky, clay-like paste; best baked in pullman tins.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Master Hydration Matrix for Classic Bread Styles */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Hydration Matrix by Bread Style
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this master conversion reference when designing custom recipes or adjusting existing dough formulas to match specific world bread traditions:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">New York Bagels</span>
                                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">50 - 55%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Ultra-stiff dough. Requires high mechanical kneading to develop tough, dense crumb with blistered boiled crust.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">Neapolitan Pizza</span>
                                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">58 - 64%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                High heat (900°F/485°C) oven environment. Moderate hydration evaporates rapidly, creating a pillowy, leoparded rim.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">Enriched Sandwich Loaf</span>
                                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">64 - 68%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Enriched with milk, butter, or oil. Keeps crumb soft, tight, and resilient for uniform sandwich slicing.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">Tartine Country Loaf</span>
                                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">74 - 78%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                The gold standard artisan sourdough. Irregular honeycomb crumb, deep caramelized blistered crust, and rich acidity.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">Italian Ciabatta</span>
                                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">80 - 85%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                &quot;Slipper&quot; bread. Extremely wet, aerated dough requiring coil folds and olive oil bassinage to build tension.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-900">High-Hydration Focaccia</span>
                                <span className="text-xs font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">85 - 95%</span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Pourable pan dough. Ferments in heavily oiled sheet trays; dimpled with fingertips to lock in giant steam pockets.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Calculation Example */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FlaskConical className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Worked Step-by-Step Baker&apos;s Calculation Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this step-by-step mathematical walkthrough to see how our calculator isolates true hydration from raw mixing measurements:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                                Given Recipe Inputs:
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2 font-mono">
                                <li>• White Bread Flour: <strong>450g</strong></li>
                                <li>• Whole Wheat Flour: <strong>50g</strong> (Total Dry Flour = 500g)</li>
                                <li>• Water Added: <strong>360g</strong></li>
                                <li>• Levain Added (100% Hydration): <strong>100g</strong></li>
                                <li>• Sea Salt: <strong>10g</strong> (2.0% Baker&apos;s)</li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 border-b border-slate-200 pb-2">
                                Mathematical Resolution:
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li>1. Apparent Hydration = 360g / 500g = <strong>72.0%</strong></li>
                                <li>2. Levain Flour = 100g / 2 = <strong>50g</strong></li>
                                <li>3. Levain Water = 100g / 2 = <strong>50g</strong></li>
                                <li>4. Total True Flour = 500g + 50g = <strong>550g</strong></li>
                                <li>5. Total True Water = 360g + 50g = <strong>410g</strong></li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-700 font-bold text-sm">
                                    • True Hydration = 410g / 550g = 74.55%
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static Highlighted FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
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
                                What is the difference between Apparent Hydration and True Hydration?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Apparent hydration only divides the added water by the dry base flour. True hydration accounts for the flour and water already contained inside your sourdough starter (levain). For example, with 100g of 100% hydration starter added to 500g dry flour and 350g water, apparent hydration is 70%, but true hydration is (350+50)/(500+50) = 72.7%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do Baker&apos;s Percentages work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In professional baking, the total weight of all dry flour in the recipe is established as the 100% baseline. Every other ingredient (water, levain, salt, yeast, fats) is calculated and expressed as a direct percentage of that total flour weight, allowing recipes to scale perfectly to any batch size.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does flour protein content affect hydration capacity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Flours with higher protein (glutenin and gliadin) content, such as hard spring wheat bread flour (12.5% to 14.5% protein), absorb significantly more water while maintaining structural gluten tension. Lower protein flours (All-Purpose at 10-11%) become sticky and slack if pushed above 72% hydration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does whole grain flour require higher hydration?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Whole grain flours retain the bran and germ. Wheat bran contains high levels of pentosans and insoluble fiber that absorb large quantities of water like a sponge. Whole wheat recipes generally require 5% to 10% more water to achieve the same dough consistency as white flour.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard salt percentage in sourdough baking?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The golden standard is 2.0% to 2.2% of total flour weight. Salt does not just add flavor; it strengthens the gluten matrix by shielding ionic charges on protein strands, regulates enzymatic protease activity, and controls fermentation speed.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I calculate starter hydration when feeding my levain?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Starter hydration is calculated by dividing water weight by flour weight during feeding. A 100% hydration starter uses equal weights of flour and water (e.g., 50g flour + 50g water). A stiff levain (50-60% hydration) has less water and ferments with lower acidity, while a liquid levain (&gt;100% hydration) encourages lactic acid production.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}