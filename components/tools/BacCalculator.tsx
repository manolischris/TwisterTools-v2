"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Wine,
    GlassWater,
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
    Lightbulb,
    AlertTriangle,
    RefreshCw,
    TrendingUp,
    Zap,
    Gauge,
    Scale,
    Timer,
    Clock,
    Flame,
    Award,
    Layers,
    Sliders,
    Trash2,
    Plus,
    FileSpreadsheet,
    AlertOctagon
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type Gender = "male" | "female";

interface DrinkItem {
    id: string;
    type: "beer" | "wine" | "spirits" | "custom";
    name: string;
    volume: number; // fl oz (imperial) or ml (metric)
    abv: number; // Percentage (e.g. 5.0)
    quantity: number;
}

interface Preset {
    id: string;
    label: string;
    gender: Gender;
    weight: number;
    hours: number;
    stomach: "empty" | "full";
    drinks: DrinkItem[];
    tag: string;
}

const PRESETS: Preset[] = [
    {
        id: "casual-dinner",
        label: "Casual Dinner (2 Glasses Wine)",
        gender: "female",
        weight: 140, // lbs
        hours: 2,
        stomach: "full",
        drinks: [
            { id: "1", type: "wine", name: "Wine (5 oz, 12% ABV)", volume: 5, abv: 12, quantity: 2 }
        ],
        tag: "Social Setting"
    },
    {
        id: "night-out",
        label: "Weekend Night Out (4 Beers)",
        gender: "male",
        weight: 180, // lbs
        hours: 3,
        stomach: "empty",
        drinks: [
            { id: "1", type: "beer", name: "Craft Beer (12 oz, 6% ABV)", volume: 12, abv: 6, quantity: 4 }
        ],
        tag: "Party / Bar"
    },
    {
        id: "cocktail-lounge",
        label: "Cocktail Lounge (3 Liquors)",
        gender: "male",
        weight: 165, // lbs
        hours: 2.5,
        stomach: "full",
        drinks: [
            { id: "1", type: "spirits", name: "Spirits / Shots (1.5 oz, 40% ABV)", volume: 1.5, abv: 40, quantity: 3 }
        ],
        tag: "High ABV"
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

export default function BacCalculator() {
    // Primary User Inputs
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [gender, setGender] = useState<Gender>("male");
    const [weight, setWeight] = useState<number>(170); // lbs or kg
    const [hours, setHours] = useState<number>(2); // time since first drink
    const [stomachFull, setStomachFull] = useState<boolean>(false);

    // Drinks Collection State
    const [drinks, setDrinks] = useState<DrinkItem[]>([
        { id: "init-1", type: "beer", name: "Standard Beer", volume: 12, abv: 5, quantity: 2 }
    ]);

    // UI States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"breakdown" | "timeline" | "impairment">("breakdown");
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    const exportRef = useRef<HTMLDivElement>(null);

    // Dynamic Unit Labels and Converters
    const weightUnitLabel = unitSystem === "imperial" ? "lbs" : "kg";
    const volumeUnitLabel = unitSystem === "imperial" ? "fl oz" : "ml";

    // Standardized Weight in Grams for Widmark Formula
    const weightInGrams = useMemo(() => {
        if (!weight || weight <= 0) return 0;
        // Imperial: lbs -> grams (1 lb = 453.592 g)
        // Metric: kg -> grams (1 kg = 1000 g)
        return unitSystem === "imperial" ? weight * 453.592 : weight * 1000;
    }, [weight, unitSystem]);

    // Total Pure Alcohol Consumed in Grams
    const totalAlcoholGrams = useMemo(() => {
        return drinks.reduce((acc, drink) => {
            if (drink.quantity <= 0 || drink.volume <= 0 || drink.abv <= 0) return acc;
            
            // Volume to Fluid Ounces for conversion
            const volumeInFlOz = unitSystem === "imperial" ? drink.volume : drink.volume * 0.033814;
            
            // Standard Formula: Vol (fl oz) * (ABV / 100) * 0.789 (density of ethanol) * 29.5735 (g per fl oz)
            // Combined constant: 0.789 * 29.5735 = 23.3334 g of pure alcohol per fl oz of 100% ethanol
            const gramsPerDrink = volumeInFlOz * (drink.abv / 100) * 23.3334;
            return acc + gramsPerDrink * drink.quantity;
        }, 0);
    }, [drinks, unitSystem]);

    // Total Standard Drinks (1 Standard Drink = 14 grams or 0.6 fl oz of pure alcohol)
    const totalStandardDrinks = useMemo(() => {
        return Math.round((totalAlcoholGrams / 14) * 10) / 10;
    }, [totalAlcoholGrams]);

    // Widmark Gender Constant (r)
    // Males: 0.68 | Females: 0.55
    const widmarkFactor = gender === "male" ? 0.68 : 0.55;

    // Metabolism Rate Adjustment (Average = 0.015% per hour, Full stomach absorbs slower)
    const metabolismRatePerHour = 0.015;

    // Estimated Peak BAC Calculation (Modified Widmark Formula)
    // BAC = [Alcohol consumed in grams / (Body Weight in grams x r)] x 100 - (Metabolic Rate x Hours)
    const peakBac = useMemo(() => {
        if (weightInGrams <= 0 || totalAlcoholGrams <= 0) return 0;
        
        let rawBac = (totalAlcoholGrams / (weightInGrams * widmarkFactor)) * 100;
        
        // Adjust peak absorption if stomach is full (delays/flattens peak absorption by ~15%)
        if (stomachFull) {
            rawBac *= 0.85;
        }

        const metabolicReduction = metabolismRatePerHour * hours;
        const currentBac = rawBac - metabolicReduction;

        return Math.max(0, Math.round(currentBac * 1000) / 1000);
    }, [totalAlcoholGrams, weightInGrams, widmarkFactor, hours, stomachFull]);

    // Time Remaining Until BAC Reaches 0.00% (Sober)
    const hoursToSober = useMemo(() => {
        if (peakBac <= 0) return 0;
        return Math.round((peakBac / metabolismRatePerHour) * 10) / 10;
    }, [peakBac]);

    // Time Remaining Until BAC Drops Below Legal Driving Limit (0.08% in US/UK/CAN)
    const hoursToDrivingLimit = useMemo(() => {
        if (peakBac <= 0.08) return 0;
        return Math.round(((peakBac - 0.08) / metabolismRatePerHour) * 10) / 10;
    }, [peakBac]);

    // Helper functions for Drink Management
    const addDrink = (type: "beer" | "wine" | "spirits" | "custom") => {
        const id = Date.now().toString();
        if (type === "beer") {
            const vol = unitSystem === "imperial" ? 12 : 355;
            setDrinks([...drinks, { id, type, name: "Standard Beer", volume: vol, abv: 5, quantity: 1 }]);
        } else if (type === "wine") {
            const vol = unitSystem === "imperial" ? 5 : 150;
            setDrinks([...drinks, { id, type, name: "Glass of Wine", volume: vol, abv: 12, quantity: 1 }]);
        } else if (type === "spirits") {
            const vol = unitSystem === "imperial" ? 1.5 : 44;
            setDrinks([...drinks, { id, type, name: "Liquor Shot", volume: vol, abv: 40, quantity: 1 }]);
        } else {
            const vol = unitSystem === "imperial" ? 12 : 355;
            setDrinks([...drinks, { id, type: "custom", name: "Custom Beverage", volume: vol, abv: 5, quantity: 1 }]);
        }
        setActivePresetId(null);
    };

    const updateDrink = (id: string, field: keyof DrinkItem, value: any) => {
        setDrinks(drinks.map(d => d.id === id ? { ...d, [field]: value } : d));
        setActivePresetId(null);
    };

    const removeDrink = (id: string) => {
        if (drinks.length === 1) return; // Maintain at least 1 row
        setDrinks(drinks.filter(d => d.id !== id));
        setActivePresetId(null);
    };

    const applyPreset = (preset: Preset) => {
        setGender(preset.gender);
        setHours(preset.hours);
        setStomachFull(preset.stomach === "full");
        
        if (unitSystem === "imperial") {
            setWeight(preset.weight);
        } else {
            setWeight(Math.round(preset.weight * 0.453592));
        }

        // Adjust preset drink volumes if in Metric
        const adjustedDrinks = preset.drinks.map((d) => ({
            ...d,
            volume: unitSystem === "imperial" ? d.volume : Math.round(d.volume * 29.5735)
        }));

        setDrinks(adjustedDrinks);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setUnitSystem("imperial");
        setGender("male");
        setWeight(170);
        setHours(2);
        setStomachFull(false);
        setDrinks([{ id: "init-1", type: "beer", name: "Standard Beer", volume: 12, abv: 5, quantity: 2 }]);
        setActivePresetId(null);
    };

    // Impairment Level Classifier
    const getImpairmentInfo = (bac: number) => {
        if (bac === 0) {
            return {
                level: "Sober / Normal",
                color: "text-emerald-600",
                badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
                description: "No impairment observed. Normal behavior and reaction times."
            };
        } else if (bac > 0 && bac < 0.04) {
            return {
                level: "Mild Relaxation",
                color: "text-blue-600",
                badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
                description: "Slight mood elevation, mild relaxation. Minor impairment of reasoning."
            };
        } else if (bac >= 0.04 && bac < 0.08) {
            return {
                level: "Moderate Impairment",
                color: "text-amber-600",
                badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
                description: "Lowered inhibition, altered depth perception, slight loss of muscle coordination."
            };
        } else if (bac >= 0.08 && bac < 0.15) {
            return {
                level: "Legally Intoxicated / Severe",
                color: "text-orange-600",
                badgeBg: "bg-orange-50 text-orange-700 border-orange-200",
                description: "Clear loss of balance, slurred speech, impaired vision, severe lack of coordination."
            };
        } else {
            return {
                level: "Very Severe / Dangerous Intoxication",
                color: "text-rose-600",
                badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
                description: "Severe motor impairment, confusion, nausea, risk of loss of consciousness and alcohol poisoning."
            };
        }
    };

    const currentImpairment = getImpairmentInfo(peakBac);

    const handleCopySummary = () => {
        const drinksList = drinks.map(d => `• ${d.quantity}x ${d.name} (${d.volume} ${volumeUnitLabel}, ${d.abv}% ABV)`).join("\n");

        const summaryText = `Blood Alcohol Content (BAC) Estimate Summary (TwisterTools):
----------------------------------------
Biological Sex: ${gender.toUpperCase()}
Body Weight: ${weight} ${weightUnitLabel}
Time Since First Drink: ${hours} Hours
Stomach Condition: ${stomachFull ? "Full Meal" : "Empty Stomach"}
----------------------------------------
DRINKS CONSUMED:
${drinksList}
----------------------------------------
RESULTS & CALCULATIONS:
Total Pure Alcohol: ${Math.round(totalAlcoholGrams)} grams (~${totalStandardDrinks} Standard Drinks)
Estimated Current BAC: ${peakBac.toFixed(3)}%
Impairment Classification: ${currentImpairment.level}
Estimated Time to 0.00% BAC: ${hoursToSober} Hours
Estimated Time to <0.08% Driving Limit: ${hoursToDrivingLimit} Hours
----------------------------------------
Calculated at twistertools.com/tools/calculators/bac-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ["Parameter", "Value"];
        const rows = [
            ["Biological Sex", gender],
            ["Weight", `${weight} ${weightUnitLabel}`],
            ["Elapsed Hours", `${hours} hrs`],
            ["Stomach Condition", stomachFull ? "Full" : "Empty"],
            ["Total Alcohol Consumed", `${Math.round(totalAlcoholGrams)} grams`],
            ["Total Standard Drinks", `${totalStandardDrinks}`],
            ["Estimated BAC", `${peakBac.toFixed(3)}%`],
            ["Impairment Status", currentImpairment.level],
            ["Hours Until 0.00% BAC", `${hoursToSober} hrs`],
            ["Hours Until <0.08% BAC", `${hoursToDrivingLimit} hrs`]
        ];

        const drinkHeaders = ["Drink Name", "Volume", "ABV %", "Quantity"];
        const drinkRows = drinks.map(d => [d.name, `${d.volume} ${volumeUnitLabel}`, `${d.abv}%`, `${d.quantity}`]);

        const csvContent = [
            "--- BAC CALCULATOR SUMMARY ---",
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(",")),
            "",
            "--- CONSUMED BEVERAGES ---",
            drinkHeaders.join(","),
            ...drinkRows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `bac_calculator_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Blood Alcohol Content (BAC) Calculator",
        "url": "https://twistertools.com/tools/calculators/bac-calculator",
        "description": "Calculate estimated Blood Alcohol Content (BAC) using the Widmark formula based on weight, gender, drink volume, ABV, and time elapsed.",
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
                "name": "What is the Widmark Formula for calculating BAC?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Widmark formula calculates BAC based on alcohol consumed in grams divided by body weight multiplied by a gender-specific distribution factor (0.68 for men, 0.55 for women), minus a constant rate of metabolic elimination (~0.015% per hour)."
                }
            },
            {
                "@type": "Question",
                "name": "How does biological sex affect Blood Alcohol Content?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Biological women typically have a higher percentage of body fat and less body water than men of equal weight, as well as lower concentrations of alcohol dehydrogenase (ADH) enzymes in the stomach, resulting in higher BAC levels for the same alcohol volume."
                }
            },
            {
                "@type": "Question",
                "name": "Does eating food lower your Blood Alcohol Content?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Eating food before or while drinking slows the gastric emptying rate into the small intestine, delaying alcohol absorption into the bloodstream. It does not eliminate alcohol already in your system, but flattens and lowers the peak BAC curve."
                }
            },
            {
                "@type": "Question",
                "name": "What is considered one Standard Drink?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the United States, one standard drink contains roughly 14 grams (0.6 fluid ounces) of pure alcohol. This equals 12 oz of standard 5% ABV beer, 5 oz of 12% ABV wine, or 1.5 oz of 40% ABV (80 proof) distilled spirits."
                }
            },
            {
                "@type": "Question",
                "name": "Can coffee, exercise, or cold showers sober you up faster?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Only time can lower your Blood Alcohol Content. The liver metabolizes alcohol at a fixed constant rate of approximately 0.015% BAC per hour (roughly 1 standard drink per hour). Coffee and cold showers may increase alertness but do not accelerate blood alcohol clearance."
                }
            },
            {
                "@type": "Question",
                "name": "What is the legal BAC limit for driving?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In the United States, Canada, and the United Kingdom, the legal BAC limit for drivers aged 21 and over is 0.08%. However, impairment begins well below 0.08%, and many countries enforce stricter limits ranging from 0.00% to 0.05%."
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
                
                {/* Left Workspace Panel: Inputs & Drink Logs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[680px] min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-5 h-5 text-indigo-600" />
                                Individual & Session Parameters
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
                            {/* Unit Switch & Gender */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Unit System
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 border border-slate-200 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (unitSystem === "metric") {
                                                    setWeight(Math.round(weight * 2.20462));
                                                }
                                                setUnitSystem("imperial");
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition ${unitSystem === "imperial"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Imperial (lbs, oz)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (unitSystem === "imperial") {
                                                    setWeight(Math.round(weight * 0.453592));
                                                }
                                                setUnitSystem("metric");
                                            }}
                                            className={`py-1.5 text-xs font-bold rounded-lg transition ${unitSystem === "metric"
                                                ? "bg-indigo-600 text-white shadow-xs"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Metric (kg, ml)
                                        </button>
                                    </div>
                                </div>

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
                            </div>

                            {/* Weight & Time Input Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Body Weight ({weightUnitLabel})
                                    </label>
                                    <input
                                        type="number"
                                        min="30"
                                        max="300"
                                        value={weight === 0 ? "" : weight}
                                        onChange={(e) => handleNumberInput(e, (val) => setWeight(val))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Hours Since First Drink
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="24"
                                        value={hours === 0 ? "" : hours}
                                        onChange={(e) => handleNumberInput(e, (val) => setHours(val))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Stomach State Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Stomach / Food Condition
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setStomachFull(false)}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition ${!stomachFull
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Empty Stomach
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStomachFull(true)}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition ${stomachFull
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Full Meal Eaten
                                    </button>
                                </div>
                            </div>

                            {/* Drinks Log Table Container */}
                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Alcohol Consumed
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => addDrink("beer")}
                                            className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[11px] font-bold transition flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Beer
                                        </button>
                                        <button
                                            onClick={() => addDrink("wine")}
                                            className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[11px] font-bold transition flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Wine
                                        </button>
                                        <button
                                            onClick={() => addDrink("spirits")}
                                            className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[11px] font-bold transition flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Shot
                                        </button>
                                    </div>
                                </div>

                                {/* Drink Rows */}
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {drinks.map((drink, index) => (
                                        <div key={drink.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    type="text"
                                                    value={drink.name}
                                                    onChange={(e) => updateDrink(drink.id, "name", e.target.value)}
                                                    className="text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none px-1 py-0.5 rounded transition w-full"
                                                />
                                                {drinks.length > 1 && (
                                                    <button
                                                        onClick={() => removeDrink(drink.id)}
                                                        className="text-slate-400 hover:text-rose-600 transition p-1"
                                                        title="Remove drink"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-500 font-semibold block">Volume ({volumeUnitLabel})</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={drink.volume === 0 ? "" : drink.volume}
                                                        onChange={(e) => handleNumberInput(e, (val) => updateDrink(drink.id, "volume", val))}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-slate-900 font-semibold bg-white"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-slate-500 font-semibold block">ABV %</span>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        min="0"
                                                        max="100"
                                                        value={drink.abv === 0 ? "" : drink.abv}
                                                        onChange={(e) => handleNumberInput(e, (val) => updateDrink(drink.id, "abv", val))}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-slate-900 font-semibold bg-white"
                                                    />
                                                </div>

                                                <div>
                                                    <span className="text-[10px] text-slate-500 font-semibold block">Quantity</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={drink.quantity === 0 ? "" : drink.quantity}
                                                        onChange={(e) => handleNumberInput(e, (val) => updateDrink(drink.id, "quantity", val))}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-slate-900 font-semibold bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Presets Row */}
                        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Drinking Scenarios
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
                            {copied ? "Copied" : "Copy BAC Summary"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results & Impairment Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-[680px] min-w-0 p-4 sm:p-6" ref={exportRef}>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                Estimated BAC & Clearance
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("breakdown")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "breakdown" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab("timeline")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${activeTab === "timeline" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Timeline
                                </button>
                            </div>
                        </div>

                        {/* BAC Primary Hero Display */}
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                    <Activity className="w-4 h-4 text-indigo-400" /> Estimated Blood Alcohol Concentration
                                </span>
                                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border uppercase ${currentImpairment.badgeBg}`}>
                                    {currentImpairment.level}
                                </span>
                            </div>
                            <div className="mt-3 flex items-baseline gap-3">
                                <span className="text-4xl md:text-5xl font-black text-white">
                                    {peakBac.toFixed(3)}%
                                </span>
                                <span className="text-sm font-semibold text-indigo-200">BAC (g/100 mL)</span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-indigo-800/80 pt-3 text-xs text-indigo-200">
                                <div>Total Pure Alcohol: <strong className="text-white">{Math.round(totalAlcoholGrams)}g</strong></div>
                                <div>Standard Drinks: <strong className="text-white">~{totalStandardDrinks} Drinks</strong></div>
                            </div>
                        </div>

                        {/* Active Tab Content */}
                        {activeTab === "breakdown" && (
                            <div className="space-y-3">
                                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                        <span className="flex items-center gap-1.5">
                                            <Timer className="w-4 h-4 text-indigo-600" /> Time to Sober (0.00% BAC)
                                        </span>
                                        <span className="text-sm text-indigo-600 font-extrabold">{hoursToSober} Hours</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-tight">
                                        At a standard metabolic decay rate of ~0.015% BAC per hour, your body will require roughly {hoursToSober} hours to fully process all remaining ethanol.
                                    </p>
                                </div>

                                <div className={`p-4 border rounded-xl space-y-2 ${peakBac >= 0.08 ? "border-rose-200 bg-rose-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                        <span className="flex items-center gap-1.5">
                                            <AlertOctagon className={`w-4 h-4 ${peakBac >= 0.08 ? "text-rose-600" : "text-emerald-600"}`} /> Time to Legal Driving Limit (&lt;0.08%)
                                        </span>
                                        <span className={`text-sm font-extrabold ${peakBac >= 0.08 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {hoursToDrivingLimit > 0 ? `${hoursToDrivingLimit} Hours` : "Below Limit"}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-tight">
                                        {peakBac >= 0.08
                                            ? `Your estimated BAC is currently above the 0.08% legal driving limit in most jurisdictions. Do not operate motor vehicles.`
                                            : `Your estimated BAC is below the 0.08% legal driving limit. Note that driving performance can still be impaired below 0.08%.`}
                                    </p>
                                </div>

                                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-1.5">
                                    <span className="text-xs font-bold text-slate-800 block">Physiological Impact Overview</span>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        {currentImpairment.description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div className="space-y-3">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                    Estimated Clearance Hourly Progression
                                </span>
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {[0, 1, 2, 3, 4, 5, 6].map((additionalHour) => {
                                        const futureBac = Math.max(0, peakBac - (metabolismRatePerHour * additionalHour));
                                        return (
                                            <div key={additionalHour} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                                                <span className="font-semibold text-slate-700">
                                                    {additionalHour === 0 ? "Current BAC" : `+${additionalHour} Hour${additionalHour > 1 ? "s" : ""}`}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className={`font-mono font-bold ${futureBac === 0 ? "text-emerald-600" : futureBac >= 0.08 ? "text-rose-600" : "text-amber-600"}`}>
                                                        {futureBac.toFixed(3)}% BAC
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Client-side execution only
                        </span>
                        <span>Widmark Science Engine</span>
                    </div>
                </div>
            </div>

            {/* FIRST MANDATORY MEDICAL DISCLAIMER BANNER */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Medical Disclaimer:</strong> This calculator provides estimated metrics for informational and educational purposes only. It is not intended as medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before making health, fitness, or dietary changes.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Science of Widmark Formula */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Blood Alcohol Content (BAC) & The Widmark Formula
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Blood Alcohol Content (BAC) measures the percentage of pure alcohol (ethanol) in a person's bloodstream. A BAC of 0.10% means that an individual's blood contains one part alcohol for every 1,000 parts blood. The foundational mathematical model for estimating BAC was developed by Swedish chemist Erik Widmark in 1932 and remains the clinical baseline used by toxicologists and forensic scientists worldwide.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Scale className="w-4 h-4 text-indigo-600" /> Total Body Water Ratio
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Alcohol is highly water-soluble and distributes almost entirely into body water. Because biological males average ~68% body water by mass and biological females average ~55%, women experience higher BAC levels per gram of alcohol consumed.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-rose-600" /> Metabolic Clearance
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The human liver metabolizes alcohol via alcohol dehydrogenase (ADH) enzymes at a fixed linear rate of roughly 0.015% BAC per hour (or ~14 grams of pure alcohol per hour), regardless of coffee consumption or physical activity.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Flame className="w-4 h-4 text-amber-600" /> Gastric Absorption Rate
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Consuming alcohol on an empty stomach allows rapid passage into the small intestine, accelerating absorption into the blood. Consuming alcohol alongside a meal delays gastric emptying, lowering the peak BAC concentration.
                            </p>
                        </div>
                    </div>

                    {/* Mathematical Formula Box */}
                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> Mathematical Formula Applied
                        </h3>
                        <p className="text-xs text-slate-300">
                            This engine calculates BAC using Erik Widmark's refined equation:
                        </p>
                        <div className="bg-slate-950 p-4 rounded-lg font-mono text-xs sm:text-sm text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><strong>BAC = [ (Dose in grams) / (Body Weight in grams × r) ] × 100 - (β × Hours)</strong></div>
                            <div className="text-slate-400 text-xs">Where: r = Gender constant (0.68 male, 0.55 female) | β = Metabolic elimination rate (0.015% / hour)</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Impairment Thresholds Table */}
                <section className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 min-w-0 p-4 sm:p-6 md:p-8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Blood Alcohol Concentration & Physical Impairment Thresholds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        As Blood Alcohol Content increases, Central Nervous System (CNS) function degrades progressively. Below is the standard physiological breakdown of BAC impairment ranges:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">BAC Range</th>
                                    <th className="p-3">Stage of Intoxication</th>
                                    <th className="p-3">Behavioral & Physical Symptoms</th>
                                    <th className="p-3">Driving Ability Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-emerald-600">0.02% - 0.03%</td>
                                    <td className="p-3 font-semibold">Mild Relaxation</td>
                                    <td className="p-3">Slight mood elevation, warm feeling, minimal muscle relaxation.</td>
                                    <td className="p-3">Slight decline in rapid tracking of moving objects.</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-blue-50/20">
                                    <td className="p-3 font-bold text-blue-600">0.04% - 0.06%</td>
                                    <td className="p-3 font-semibold">Lowered Inhibition</td>
                                    <td className="p-3">Exaggerated behavior, minor loss of reasoning, reduced alertness.</td>
                                    <td className="p-3">Reduced steering coordination and delayed emergency response.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-amber-600">0.07% - 0.09%</td>
                                    <td className="p-3 font-semibold">Legal Threshold</td>
                                    <td className="p-3">Slurred speech, impaired depth perception, slower reaction times.</td>
                                    <td className="p-3">Severe loss of speed control and visual perception (Illegal to drive).</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-orange-600">0.10% - 0.15%</td>
                                    <td className="p-3 font-semibold">Significant Intoxication</td>
                                    <td className="p-3">Loss of physical balance, blurred vision, gross motor control degradation.</td>
                                    <td className="p-3">Critical impairment of vehicle braking and lane control.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-rose-600">0.16% - 0.25%+</td>
                                    <td className="p-3 font-semibold">Severe Intoxication</td>
                                    <td className="p-3">Nausea, confusion, severe disorientation, risk of blackout.</td>
                                    <td className="p-3">Total incapacity to operate machinery or vehicles.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Frequently Asked Questions (FAQ) */}
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
                                What is the Widmark Formula for calculating BAC?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Widmark formula calculates BAC based on alcohol consumed in grams divided by body weight multiplied by a gender-specific distribution factor (0.68 for men, 0.55 for women), minus a constant rate of metabolic elimination (~0.015% per hour).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does biological sex affect Blood Alcohol Content?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Biological women typically have a higher percentage of body fat and less body water than men of equal weight, as well as lower concentrations of alcohol dehydrogenase (ADH) enzymes in the stomach, resulting in higher BAC levels for the same alcohol volume.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does eating food lower your Blood Alcohol Content?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Eating food before or while drinking slows the gastric emptying rate into the small intestine, delaying alcohol absorption into the bloodstream. It does not eliminate alcohol already in your system, but flattens and lowers the peak BAC curve.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is considered one Standard Drink?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the United States, one standard drink contains roughly 14 grams (0.6 fluid ounces) of pure alcohol. This equals 12 oz of standard 5% ABV beer, 5 oz of 12% ABV wine, or 1.5 oz of 40% ABV (80 proof) distilled spirits.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can coffee, exercise, or cold showers sober you up faster?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Only time can lower your Blood Alcohol Content. The liver metabolizes alcohol at a fixed constant rate of approximately 0.015% BAC per hour (roughly 1 standard drink per hour). Coffee and cold showers may increase alertness but do not accelerate blood alcohol clearance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the legal BAC limit for driving?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In the United States, Canada, and the United Kingdom, the legal BAC limit for drivers aged 21 and over is 0.08%. However, impairment begins well below 0.08%, and many countries enforce stricter limits ranging from 0.00% to 0.05%.
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