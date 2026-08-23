"use client";

import React, { useState, useMemo } from "react";
import {
    Scale,
    Utensils,
    Plus,
    Trash2,
    Copy,
    Check,
    Download,
    RefreshCw,
    Percent,
    PieChart,
    ChefHat,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    Flame,
    Calculator,
    Wheat
} from "lucide-react";

type UnitType = "g" | "kg" | "oz" | "lb" | "ml" | "cup" | "tbsp" | "tsp";
type ModeType = "servings" | "bakers" | "pan";
type PanShape = "round" | "square" | "rectangular";

interface Ingredient {
    id: string;
    name: string;
    amount: number;
    unit: UnitType;
    isFlour?: boolean;
}

interface PanDimension {
    shape: PanShape;
    diameterOrWidth: number;
    length: number;
    depth: number;
}

const UNIT_CONVERSIONS_TO_GRAMS: Record<UnitType, number> = {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
    ml: 1,
    cup: 240,
    tbsp: 15,
    tsp: 5,
};

const INITIAL_INGREDIENTS: Ingredient[] = [
    { id: "1", name: "Bread Flour", amount: 500, unit: "g", isFlour: true },
    { id: "2", name: "Whole Wheat Flour", amount: 100, unit: "g", isFlour: true },
    { id: "3", name: "Water", amount: 450, unit: "ml", isFlour: false },
    { id: "4", name: "Fine Sea Salt", amount: 12, unit: "g", isFlour: false },
    { id: "5", name: "Active Dry Yeast", amount: 7, unit: "g", isFlour: false },
    { id: "6", name: "Olive Oil", amount: 15, unit: "ml", isFlour: false },
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

export default function RecipeScaler() {
    const [mode, setMode] = useState<ModeType>("servings");
    const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);

    // Servings Mode State
    const [baseServings, setBaseServings] = useState<number>(4);
    const [targetServings, setTargetServings] = useState<number>(8);
    const [customMultiplier, setCustomMultiplier] = useState<number>(1);
    const [useDirectMultiplier, setUseDirectMultiplier] = useState<boolean>(false);

    // Pan Size Adjustment State
    const [sourcePan, setSourcePan] = useState<PanDimension>({ shape: "round", diameterOrWidth: 8, length: 8, depth: 2 });
    const [targetPan, setTargetPan] = useState<PanDimension>({ shape: "round", diameterOrWidth: 10, length: 10, depth: 2 });

    // Target Flour Weight for Baker's Percentage scaling
    const [targetFlourTotal, setTargetFlourTotal] = useState<number>(1000);

    // UI Feedback
    const [copied, setCopied] = useState<boolean>(false);

    // Dynamic Multiplier Engine
    const scaleFactor = useMemo(() => {
        if (mode === "servings") {
            if (useDirectMultiplier) return Math.max(0.001, customMultiplier);
            if (baseServings <= 0) return 1;
            return Math.max(0.001, targetServings / baseServings);
        }

        if (mode === "pan") {
            const calculateVolume = (pan: PanDimension): number => {
                if (pan.shape === "round") {
                    const radius = pan.diameterOrWidth / 2;
                    return Math.PI * Math.pow(radius, 2) * pan.depth;
                }
                if (pan.shape === "square") {
                    return Math.pow(pan.diameterOrWidth, 2) * pan.depth;
                }
                return pan.diameterOrWidth * pan.length * pan.depth;
            };

            const srcVol = calculateVolume(sourcePan);
            const tgtVol = calculateVolume(targetPan);
            if (srcVol <= 0) return 1;
            return tgtVol / srcVol;
        }

        return 1;
    }, [mode, useDirectMultiplier, customMultiplier, baseServings, targetServings, sourcePan, targetPan]);

    // Total Flour Calculation for Baker's Percentages
    const totalFlourGrams = useMemo(() => {
        return ingredients.reduce((sum, item) => {
            if (item.isFlour) {
                const inGrams = item.amount * UNIT_CONVERSIONS_TO_GRAMS[item.unit];
                return sum + inGrams;
            }
            return sum;
        }, 0);
    }, [ingredients]);

    // Computed Scaled Ingredients Table
    const scaledIngredients = useMemo(() => {
        return ingredients.map((item) => {
            const currentGrams = item.amount * UNIT_CONVERSIONS_TO_GRAMS[item.unit];
            const bakersPct = totalFlourGrams > 0 ? (currentGrams / totalFlourGrams) * 100 : 0;

            let scaledAmount = 0;
            if (mode === "bakers" && totalFlourGrams > 0) {
                // Scale according to target total flour weight
                const targetGrams = (bakersPct / 100) * targetFlourTotal;
                scaledAmount = targetGrams / UNIT_CONVERSIONS_TO_GRAMS[item.unit];
            } else {
                scaledAmount = item.amount * scaleFactor;
            }

            return {
                ...item,
                scaledAmount: Number(scaledAmount.toFixed(2)),
                bakersPct: Number(bakersPct.toFixed(1)),
            };
        });
    }, [ingredients, scaleFactor, mode, totalFlourGrams, targetFlourTotal]);

    // Aggregated Metrics
    const totalDoughWeight = useMemo(() => {
        return scaledIngredients.reduce((sum, item) => {
            return sum + (item.scaledAmount * UNIT_CONVERSIONS_TO_GRAMS[item.unit]);
        }, 0);
    }, [scaledIngredients]);

    const hydrationPercentage = useMemo(() => {
        if (totalFlourGrams <= 0) return 0;
        const totalScaledFlour = scaledIngredients
            .filter((i) => i.isFlour)
            .reduce((sum, i) => sum + (i.scaledAmount * UNIT_CONVERSIONS_TO_GRAMS[i.unit]), 0);

        const totalScaledLiquid = scaledIngredients
            .filter((i) => !i.isFlour && (i.unit === "ml" || i.name.toLowerCase().includes("water") || i.name.toLowerCase().includes("milk")))
            .reduce((sum, i) => sum + (i.scaledAmount * UNIT_CONVERSIONS_TO_GRAMS[i.unit]), 0);

        if (totalScaledFlour <= 0) return 0;
        return (totalScaledLiquid / totalScaledFlour) * 100;
    }, [scaledIngredients, totalFlourGrams]);

    // CRUD Handlers
    const addIngredient = () => {
        const newId = (ingredients.length + 1).toString() + "_" + Date.now();
        setIngredients([
            ...ingredients,
            { id: newId, name: "New Ingredient", amount: 100, unit: "g", isFlour: false },
        ]);
    };

    const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
        setIngredients(
            ingredients.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const removeIngredient = (id: string) => {
        if (ingredients.length <= 1) return;
        setIngredients(ingredients.filter((item) => item.id !== id));
    };

    const resetToDefault = () => {
        setIngredients(INITIAL_INGREDIENTS);
        setBaseServings(4);
        setTargetServings(8);
        setCustomMultiplier(1);
        setUseDirectMultiplier(false);
        setTargetFlourTotal(1000);
        setSourcePan({ shape: "round", diameterOrWidth: 8, length: 8, depth: 2 });
        setTargetPan({ shape: "round", diameterOrWidth: 10, length: 10, depth: 2 });
    };

    const handleCopy = () => {
        const formatted = scaledIngredients
            .map((i) => `• ${i.name}: ${i.scaledAmount} ${i.unit} ${mode === "bakers" ? `(${i.bakersPct}%)` : ""}`)
            .join("\n");

        const text = `Recipe Scaled via TwisterTools.com:
Mode: ${mode.toUpperCase()} ${mode === "servings" ? `(${baseServings} -> ${targetServings} Servings | Factor: ${scaleFactor.toFixed(2)}x)` : ""}
--------------------------------------------
${formatted}
--------------------------------------------
Total Batch Weight: ${(totalDoughWeight >= 1000 ? (totalDoughWeight / 1000).toFixed(2) + " kg" : totalDoughWeight.toFixed(0) + " g")}
${hydrationPercentage > 0 ? `Calculated Hydration: ${hydrationPercentage.toFixed(1)}%` : ""}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Ingredient", "Original Amount", "Original Unit", "Scaled Amount", "Unit", "Baker's %", "Is Flour"];
        const rows = scaledIngredients.map((i) => [
            `"${i.name}"`,
            i.amount,
            i.unit,
            i.scaledAmount,
            i.unit,
            `${i.bakersPct}%`,
            i.isFlour ? "Yes" : "No"
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "scaled_recipe_formula.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Recipe Ingredient Scaler & Baker's Percentage Calculator",
        "url": "https://twistertools.com/tools/home-tools/recipe-converter-scaler",
        "description": "Enterprise-grade recipe conversion utility. Scale formulas by serving sizes, baker's percentages, or baking pan volume adjustments with real-time hydration calculations.",
        "applicationCategory": "KitchenUtility",
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
                "name": "What is Baker's Percentage and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Baker's Percentage expresses every ingredient as a percentage of the total flour weight in the formula, with total flour always equaling exactly 100%. Formula: (Ingredient Weight / Total Flour Weight) × 100%."
                }
            },
            {
                "@type": "Question",
                "name": "How does scaling recipes by baking pan size work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Pan scaling calculates the internal volume of the source pan versus the target pan (Area × Depth). The multiplier is determined by dividing the target volume by the source volume so your batter fills the new tin to the identical relative depth."
                }
            },
            {
                "@type": "Question",
                "name": "Why shouldn't cooking spices and leaveners scale linearly?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While mass ingredients (flour, sugar, liquids) scale linearly (1:1), potent chemical leaveners (baking soda, baking powder), strong spices (chili, nutmeg), and alcohol typically scale at a sub-linear rate (~0.8x of the multiplier for large batches) to prevent overwhelming flavor or over-aeration."
                }
            },
            {
                "@type": "Question",
                "name": "What is dough hydration percentage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Dough hydration is the ratio of total liquid weight to total flour weight in a bread formula, expressed as a percentage. For example, 700g of water with 1,000g of flour yields a 70% hydration dough."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Formulation Builder & Inputs (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-indigo-600" />
                                Recipe Formulation
                            </h2>
                            <button
                                onClick={resetToDefault}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset Default
                            </button>
                        </div>

                        {/* Scaling Mode Selector Tabs */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setMode("servings")}
                                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${mode === "servings" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Scale className="w-4 h-4" />
                                Servings / Factor
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("bakers")}
                                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${mode === "bakers" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Wheat className="w-4 h-4" />
                                Baker&apos;s %
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("pan")}
                                className={`py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${mode === "pan" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <PieChart className="w-4 h-4" />
                                Pan Dimensions
                            </button>
                        </div>

                        {/* Dynamic Mode Controls */}
                        {mode === "servings" && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Scaling Method
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setUseDirectMultiplier(false)}
                                            className={`text-xs font-semibold px-2 py-1 rounded ${!useDirectMultiplier ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
                                        >
                                            Yield Ratio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUseDirectMultiplier(true)}
                                            className={`text-xs font-semibold px-2 py-1 rounded ${useDirectMultiplier ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
                                        >
                                            Direct Multiplier (X)
                                        </button>
                                    </div>
                                </div>

                                {!useDirectMultiplier ? (
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Base Servings / Yield</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={baseServings === 0 ? "" : baseServings}
                                                onChange={(e) => handleNumberInput(e, setBaseServings)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 mb-1">Target Servings / Yield</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={targetServings === 0 ? "" : targetServings}
                                                onChange={(e) => handleNumberInput(e, setTargetServings)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 mb-1">Multiplier Factor (e.g. 0.5x, 2x, 3.5x)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.01"
                                            value={customMultiplier === 0 ? "" : customMultiplier}
                                            onChange={(e) => handleNumberInput(e, setCustomMultiplier)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === "bakers" && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wheat className="w-4 h-4 text-indigo-600" />
                                        Target Total Flour Weight (Grams)
                                    </label>
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                        Flour Basis = 100%
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={targetFlourTotal === 0 ? "" : targetFlourTotal}
                                        onChange={(e) => handleNumberInput(e, setTargetFlourTotal)}
                                        className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Target grams"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                        Grams
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Check the <strong>Flour?</strong> checkbox next to any ingredient that forms your flour base. All other items will scale proportional to this weight.
                                </p>
                            </div>
                        )}

                        {mode === "pan" && (
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Source Pan */}
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                                        <span className="text-xs font-bold text-slate-700 block">Original Recipe Pan</span>
                                        <select
                                            value={sourcePan.shape}
                                            onChange={(e) => setSourcePan({ ...sourcePan, shape: e.target.value as PanShape })}
                                            className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                                        >
                                            <option value="round">Round Cake Tin</option>
                                            <option value="square">Square Pan</option>
                                            <option value="rectangular">Rectangular Pan</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Dia/Width (in)</span>
                                                <input
                                                    type="number"
                                                    value={sourcePan.diameterOrWidth}
                                                    onChange={(e) => handleNumberInput(e, (v) => setSourcePan({ ...sourcePan, diameterOrWidth: v }))}
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                />
                                            </div>
                                            {sourcePan.shape === "rectangular" && (
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Length (in)</span>
                                                    <input
                                                        type="number"
                                                        value={sourcePan.length}
                                                        onChange={(e) => handleNumberInput(e, (v) => setSourcePan({ ...sourcePan, length: v }))}
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Depth (in)</span>
                                                <input
                                                    type="number"
                                                    value={sourcePan.depth}
                                                    onChange={(e) => handleNumberInput(e, (v) => setSourcePan({ ...sourcePan, depth: v }))}
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Target Pan */}
                                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                                        <span className="text-xs font-bold text-indigo-700 block">Target Desired Pan</span>
                                        <select
                                            value={targetPan.shape}
                                            onChange={(e) => setTargetPan({ ...targetPan, shape: e.target.value as PanShape })}
                                            className="w-full text-xs font-semibold p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                                        >
                                            <option value="round">Round Cake Tin</option>
                                            <option value="square">Square Pan</option>
                                            <option value="rectangular">Rectangular Pan</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Dia/Width (in)</span>
                                                <input
                                                    type="number"
                                                    value={targetPan.diameterOrWidth}
                                                    onChange={(e) => handleNumberInput(e, (v) => setTargetPan({ ...targetPan, diameterOrWidth: v }))}
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                />
                                            </div>
                                            {targetPan.shape === "rectangular" && (
                                                <div>
                                                    <span className="text-[10px] text-slate-500 block">Length (in)</span>
                                                    <input
                                                        type="number"
                                                        value={targetPan.length}
                                                        onChange={(e) => handleNumberInput(e, (v) => setTargetPan({ ...targetPan, length: v }))}
                                                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-[10px] text-slate-500 block">Depth (in)</span>
                                                <input
                                                    type="number"
                                                    value={targetPan.depth}
                                                    onChange={(e) => handleNumberInput(e, (v) => setTargetPan({ ...targetPan, depth: v }))}
                                                    className="w-full text-xs p-1.5 border border-slate-200 rounded font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Ingredients Table Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Base Ingredients List
                                </label>
                                <button
                                    type="button"
                                    onClick={addIngredient}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                {ingredients.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition"
                                    >
                                        <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateIngredient(item.id, "name", e.target.value)}
                                            placeholder="Ingredient name"
                                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />

                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            value={item.amount === 0 ? "" : item.amount}
                                            onChange={(e) => handleNumberInput(e, (val) => updateIngredient(item.id, "amount", val))}
                                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                                        />

                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateIngredient(item.id, "unit", e.target.value as UnitType)}
                                            className="w-18 px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="oz">oz</option>
                                            <option value="lb">lb</option>
                                            <option value="ml">ml</option>
                                            <option value="cup">cup</option>
                                            <option value="tbsp">tbsp</option>
                                            <option value="tsp">tsp</option>
                                        </select>

                                        {mode === "bakers" && (
                                            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={!!item.isFlour}
                                                    onChange={(e) => updateIngredient(item.id, "isFlour", e.target.checked)}
                                                    className="w-3.5 h-3.5 text-indigo-600 rounded"
                                                />
                                                Flour?
                                            </label>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(item.id)}
                                            disabled={ingredients.length <= 1}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition cursor-pointer"
                                            title="Remove ingredient"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Items: <strong>{ingredients.length}</strong></span>
                        <span>Total Input Weight: <strong>{ingredients.reduce((s, i) => s + (i.amount * UNIT_CONVERSIONS_TO_GRAMS[i.unit]), 0).toFixed(0)}g</strong></span>
                    </div>
                </div>

                {/* Right Workspace Panel: Scaled Formula & Professional Metrics (5 cols) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-indigo-600" />
                                Scaled Production Output
                            </h2>
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                                {mode === "bakers" ? "Baker's Formula" : `${scaleFactor.toFixed(2)}x Scale`}
                            </span>
                        </div>

                        {/* Top Metric Highlight Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                                    Total Dough/Batch
                                </span>
                                <p className="text-xl font-black text-slate-900 mt-1">
                                    {totalDoughWeight >= 1000
                                        ? `${(totalDoughWeight / 1000).toFixed(2)} kg`
                                        : `${totalDoughWeight.toFixed(0)} g`}
                                </p>
                                <span className="text-[10px] text-slate-400">Total batch yield weight</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                                    Hydration Ratio
                                </span>
                                <p className="text-xl font-black text-indigo-600 mt-1">
                                    {hydrationPercentage > 0 ? `${hydrationPercentage.toFixed(1)}%` : "N/A"}
                                </p>
                                <span className="text-[10px] text-slate-400">Liquid / Flour Ratio</span>
                            </div>
                        </div>

                        {/* Scaled Output Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                            <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700">
                                <span>Ingredient</span>
                                <div className="flex gap-4">
                                    {mode === "bakers" && <span>Baker %</span>}
                                    <span>Target Amount</span>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                                {scaledIngredients.map((item) => (
                                    <div key={item.id} className="px-3 py-2.5 flex justify-between items-center text-xs hover:bg-slate-50">
                                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                            {item.isFlour && <Wheat className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
                                            <span className="font-semibold text-slate-900 truncate">{item.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            {mode === "bakers" && (
                                                <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                                    {item.bakersPct}%
                                                </span>
                                            )}
                                            <span className="font-bold text-indigo-600 font-mono text-sm">
                                                {item.scaledAmount} <span className="text-slate-600 text-xs">{item.unit}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Recipe" : "Copy Scaled Recipe"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> CSV Formula
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Culinary Math & Baker's Percentage Explained */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations of Recipe Scaling & Baker&apos;s Percentages
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In professional baking and commercial culinary production, recipes are formulated as mathematical ratios rather than static volume measurements. Standard kitchen volume units (such as cups, tablespoons, and fluid ounces) introduce volumetric variance exceeding 20% due to packing density, humidity, and particle size. By contrast, weight-based scaling and <strong>Baker&apos;s Percentages (Bakers Notation)</strong> establish exact thermodynamic and textural consistency regardless of whether you prepare 1 loaf or 1,000 loaves.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Wheat className="w-4 h-4 text-indigo-600" /> Baker&apos;s Percentage Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                In Baker&apos;s Percentages, the cumulative weight of all flour represents exactly 100%. Every other ingredient is mathematically calculated as a direct percentage of that total flour weight:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                Ingredient % = (Weight of Ingredient / Total Flour Weight) × 100%
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Linear Conversion Factor
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When adjusting culinary dishes by portion counts, the scaling factor (F) is the quotient of the target serving yield (Y_target) divided by the base recipe yield (Y_base):
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                Multiplier (F) = Target Servings / Base Servings
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Standard Artisan Bread Baker&apos;s Ratio Blueprint
                        </h3>
                        <div className="grid sm:grid-cols-4 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Total Flour:</span>
                                <strong className="text-indigo-300 text-sm">100.0% (Base)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Water (Hydration):</span>
                                <strong className="text-indigo-300 text-sm">65.0% – 78.0%</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Fine Salt:</span>
                                <strong className="text-indigo-300 text-sm">2.0% – 2.2%</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Yeast / Starter:</span>
                                <strong className="text-indigo-300 text-sm">0.8% – 20.0%</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Pan Size & Volume Scaling Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Baking Pan Geometry & Surface Area Conversion Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Switching cake pans, tart rings, or casserole dishes requires volumetric scaling rather than simple linear multipliers. For circular pans, volume scales quadratically with the radius (π × r² × h). Doubling the diameter of a round cake tin from 8 inches to 16 inches increases batter volume by <strong>400%</strong> (4x), not 2x.
                    </p>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Common Cake Pan Volume & Scaling Multipliers (Reference: 8&quot; × 2&quot; Round Base)
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Pan Dimensions</th>
                                        <th className="p-3">Geometry Shape</th>
                                        <th className="p-3">Calculated Volume (in³)</th>
                                        <th className="p-3">Scale Multiplier (from 8&quot; Round)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">6&quot; × 2&quot; Round</td>
                                        <td className="p-3">Circle (π × 3² × 2)</td>
                                        <td className="p-3 font-mono">56.55 cu in</td>
                                        <td className="p-3 font-bold text-amber-600">0.56x</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                        <td className="p-3 font-bold text-slate-900">8&quot; × 2&quot; Round (Baseline)</td>
                                        <td className="p-3">Circle (π × 4² × 2)</td>
                                        <td className="p-3 font-mono font-bold">100.53 cu in</td>
                                        <td className="p-3 font-bold text-indigo-600">1.00x</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">9&quot; × 2&quot; Round</td>
                                        <td className="p-3">Circle (π × 4.5² × 2)</td>
                                        <td className="p-3 font-mono">127.23 cu in</td>
                                        <td className="p-3 font-bold text-indigo-600">1.26x</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">10&quot; × 2&quot; Round</td>
                                        <td className="p-3">Circle (π × 5² × 2)</td>
                                        <td className="p-3 font-mono">157.08 cu in</td>
                                        <td className="p-3 font-bold text-indigo-600">1.56x</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">8&quot; × 8&quot; × 2&quot; Square</td>
                                        <td className="p-3">Square (8 × 8 × 2)</td>
                                        <td className="p-3 font-mono">128.00 cu in</td>
                                        <td className="p-3 font-bold text-indigo-600">1.27x</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-semibold text-slate-900">9&quot; × 13&quot; × 2&quot; Sheet Pan</td>
                                        <td className="p-3">Rectangle (9 × 13 × 2)</td>
                                        <td className="p-3 font-mono">234.00 cu in</td>
                                        <td className="p-3 font-bold text-emerald-600">2.33x</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Non-Linear Scaling Anomalies & Culinary Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Non-Linear Scaling Anomalies in Professional Kitchens
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When multiplying a formulation beyond 4x, direct 1:1 linear scaling can result in recipe failure due to distinct physical, chemical, and evaporative behaviors:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Leaveners & Baking Powder
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Chemical leaveners release gas volumetrically. In massive batches, excessive CO₂ production weakens gluten matrices, causing cake collapse. Scale baking powder/soda by F^0.85 for batches exceeding 4x.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Evaporation & Liquid Surface Area
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Simmering liquids evaporate proportional to pot surface area, not fluid volume. When scaling stocks and braises up, reduce total added water/stock by 10%–15% to avoid over-diluted sauces.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Pungent Spices & Extracts
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Capsaicin in chili peppers, pure vanilla extract, and intense spices (clove, nutmeg) exhibit cumulative sensory potency. Increase these at 75%–80% of the standard multiplier and adjust to taste.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Calculation Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Calculator className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Conversion Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review how professional bakeries convert base formulas into large-scale production runs using exact arithmetic:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Sourdough from 700g to 2.5kg Target Flour</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Baker&apos;s %</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Original:</strong> 700g Flour, 525g Water (75%), 14g Salt (2%), 140g Starter (20%).</li>
                                <li><strong>Target Flour:</strong> 2,500g (2.5 kg).</li>
                                <li><strong>Step 1 (Water):</strong> 2,500g × 75% = 1,875g Water.</li>
                                <li><strong>Step 2 (Salt):</strong> 2,500g × 2% = 50g Salt.</li>
                                <li><strong>Step 3 (Starter):</strong> 2,500g × 20% = 500g Sourdough Starter.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Total Scaled Batch Weight = 4,925 grams (4.93 kg).
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: 8-inch Round to 9x13-inch Sheet Cake</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Pan Scaling</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Source 8&quot; Round:</strong> Volume = π × 4² × 2 = 100.53 cubic inches.</li>
                                <li><strong>Target 9&quot;×13&quot; Sheet:</strong> Volume = 9 × 13 × 2 = 234.00 cubic inches.</li>
                                <li><strong>Scaling Factor:</strong> 234.00 / 100.53 = 2.33x.</li>
                                <li><strong>Application:</strong> Multiply all original ingredients (eggs, flour, butter) by exactly 2.33x.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: Perfect pan fill depth without batter overflow.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                What is Baker&apos;s Percentage and how is it calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Baker&apos;s Percentage expresses every ingredient as a percentage of the total flour weight in the formula, with total flour always equaling exactly 100%. For example, if a bread formula contains 1,000g of flour and 750g of water, the hydration percentage is calculated as (750 / 1000) × 100 = 75%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does scaling recipes by baking pan size work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Pan scaling calculates the internal volume of the source pan versus the target pan (Surface Area × Depth). The multiplier is determined by dividing the target volume by the source volume so your cake or brownie batter fills the new tin to the identical relative depth.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why shouldn&apos;t cooking spices and leaveners scale linearly?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While bulk ingredients (flour, sugar, liquids) scale linearly (1:1), potent chemical leaveners (baking soda, baking powder), strong spices (chili, nutmeg), and alcohol typically scale at a sub-linear rate (~0.8x of the multiplier for large batches) to prevent overwhelming flavor or over-aeration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is dough hydration percentage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Dough hydration is the ratio of total liquid weight to total flour weight in a bread formula, expressed as a percentage. For example, 700g of water with 1,000g of flour yields a 70% hydration dough. Higher hydration produces an open, airy crumb with a crisp crust.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}