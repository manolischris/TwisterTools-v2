"use client";

import React, { useState, useMemo } from "react";
import {
    Flame,
    Timer,
    Thermometer,
    ChefHat,
    Utensils,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    AlertCircle,
    Scale,
    ShieldAlert,
    Gauge,
    SlidersHorizontal,
    Search,
    Clock,
    Hourglass,
    CheckCircle2
} from "lucide-react";

type WeightUnit = "lbs" | "kg";
type TempUnit = "F" | "C";
type DonenessLevel = "rare" | "medium-rare" | "medium" | "medium-well" | "well-done";

interface MeatCutProfile {
    id: string;
    name: string;
    category: "beef" | "poultry" | "pork" | "lamb" | "game";
    defaultOvenTempF: number;
    recommendedCookingMethod: string;
    boneInSupported: boolean;
    donenessOptions: {
        level: DonenessLevel;
        label: string;
        pullTempF: number;
        finalTempF: number;
        minsPerPound: number;
    }[];
    restingMinsPerPound: number;
    minRestMins: number;
    maxRestMins: number;
    usdaSafeTempF: number;
    notes: string;
}

const MEAT_PROFILES: MeatCutProfile[] = [
    {
        id: "beef-prime-rib",
        name: "Prime Rib / Standing Rib Roast",
        category: "beef",
        defaultOvenTempF: 325,
        recommendedCookingMethod: "Reverse Sear (225°F then 500°F sear) or Slow Roast (325°F)",
        boneInSupported: true,
        donenessOptions: [
            { level: "rare", label: "Rare (Cool Red Center)", pullTempF: 120, finalTempF: 125, minsPerPound: 14 },
            { level: "medium-rare", label: "Medium-Rare (Warm Red/Pink - Recommended)", pullTempF: 130, finalTempF: 135, minsPerPound: 16 },
            { level: "medium", label: "Medium (Warm Pink Center)", pullTempF: 140, finalTempF: 145, minsPerPound: 18 },
            { level: "medium-well", label: "Medium-Well (Slight Pink Center)", pullTempF: 150, finalTempF: 155, minsPerPound: 21 },
            { level: "well-done", label: "Well-Done (Uniform Brown)", pullTempF: 160, finalTempF: 165, minsPerPound: 24 }
        ],
        restingMinsPerPound: 4,
        minRestMins: 15,
        maxRestMins: 30,
        usdaSafeTempF: 145,
        notes: "Rest tented with foil. Carryover cooking will raise the core internal temp by 5°F to 10°F."
    },
    {
        id: "beef-tenderloin",
        name: "Beef Tenderloin / Chateaubriand",
        category: "beef",
        defaultOvenTempF: 425,
        recommendedCookingMethod: "High Heat Roast (425°F) or Sear-and-Roast",
        boneInSupported: false,
        donenessOptions: [
            { level: "rare", label: "Rare", pullTempF: 120, finalTempF: 125, minsPerPound: 10 },
            { level: "medium-rare", label: "Medium-Rare (Optimal Juiciness)", pullTempF: 130, finalTempF: 135, minsPerPound: 12 },
            { level: "medium", label: "Medium", pullTempF: 140, finalTempF: 145, minsPerPound: 15 },
            { level: "well-done", label: "Well-Done", pullTempF: 160, finalTempF: 165, minsPerPound: 19 }
        ],
        restingMinsPerPound: 3,
        minRestMins: 10,
        maxRestMins: 20,
        usdaSafeTempF: 145,
        notes: "Very lean cut. Overcooking beyond medium-rare leads to rapid drying and moisture loss."
    },
    {
        id: "beef-brisket",
        name: "Beef Brisket (Flat / Whole Packer)",
        category: "beef",
        defaultOvenTempF: 250,
        recommendedCookingMethod: "Low & Slow Braise or Smoker (225°F - 250°F)",
        boneInSupported: false,
        donenessOptions: [
            { level: "well-done", label: "Tender Collagen Breakdown (203°F)", pullTempF: 198, finalTempF: 203, minsPerPound: 75 }
        ],
        restingMinsPerPound: 6,
        minRestMins: 45,
        maxRestMins: 120,
        usdaSafeTempF: 145,
        notes: "High in connective tissue. Collagen melts into gelatin between 160°F and 200°F. Rest in a cooler wrapped in butcher paper."
    },
    {
        id: "whole-turkey",
        name: "Whole Turkey (Unstuffed)",
        category: "poultry",
        defaultOvenTempF: 325,
        recommendedCookingMethod: "Traditional Oven Roast (325°F) or Spatchcock (400°F)",
        boneInSupported: true,
        donenessOptions: [
            { level: "well-done", label: "USDA Food Safe Target (165°F / 74°C)", pullTempF: 160, finalTempF: 165, minsPerPound: 15 }
        ],
        restingMinsPerPound: 2.5,
        minRestMins: 20,
        maxRestMins: 45,
        usdaSafeTempF: 165,
        notes: "Probe in the thickest part of the inner thigh, avoiding bone. Breast pulls best at 155°F-160°F if spatchcocked."
    },
    {
        id: "whole-chicken",
        name: "Whole Roasting Chicken",
        category: "poultry",
        defaultOvenTempF: 375,
        recommendedCookingMethod: "High Heat Roast (375°F - 425°F)",
        boneInSupported: true,
        donenessOptions: [
            { level: "well-done", label: "USDA Food Safe Target (165°F / 74°C)", pullTempF: 160, finalTempF: 165, minsPerPound: 20 }
        ],
        restingMinsPerPound: 3,
        minRestMins: 15,
        maxRestMins: 25,
        usdaSafeTempF: 165,
        notes: "Check both thigh and breast. Thigh meat benefits from reaching 175°F for softer texture."
    },
    {
        id: "pork-loin-roast",
        name: "Pork Loin Roast (Boneless)",
        category: "pork",
        defaultOvenTempF: 350,
        recommendedCookingMethod: "Dry Heat Roasting (350°F)",
        boneInSupported: false,
        donenessOptions: [
            { level: "medium", label: "Medium (Juicy with slight blush - 145°F)", pullTempF: 140, finalTempF: 145, minsPerPound: 22 },
            { level: "medium-well", label: "Medium-Well (150°F)", pullTempF: 145, finalTempF: 150, minsPerPound: 25 },
            { level: "well-done", label: "Well-Done (160°F)", pullTempF: 155, finalTempF: 160, minsPerPound: 28 }
        ],
        restingMinsPerPound: 3,
        minRestMins: 10,
        maxRestMins: 20,
        usdaSafeTempF: 145,
        notes: "USDA lowered safe pork guideline to 145°F with a 3-minute rest in 2011. Do not overcook to dry leather."
    },
    {
        id: "pork-shoulder",
        name: "Pork Shoulder / Boston Butt (Pulled Pork)",
        category: "pork",
        defaultOvenTempF: 275,
        recommendedCookingMethod: "Low & Slow Braise or Smoke (250°F - 275°F)",
        boneInSupported: true,
        donenessOptions: [
            { level: "well-done", label: "Shred-Tender Pull Point (200°F - 205°F)", pullTempF: 198, finalTempF: 203, minsPerPound: 55 }
        ],
        restingMinsPerPound: 5,
        minRestMins: 30,
        maxRestMins: 90,
        usdaSafeTempF: 145,
        notes: "Requires deep thermal time to render intramuscular collagen fat into succulent shredded pork."
    },
    {
        id: "lamb-leg",
        name: "Leg of Lamb (Bone-In / Boneless)",
        category: "lamb",
        defaultOvenTempF: 350,
        recommendedCookingMethod: "Oven Roast (350°F)",
        boneInSupported: true,
        donenessOptions: [
            { level: "medium-rare", label: "Medium-Rare (Rose Pink - 135°F)", pullTempF: 130, finalTempF: 135, minsPerPound: 20 },
            { level: "medium", label: "Medium (Warm Pink - 145°F)", pullTempF: 140, finalTempF: 145, minsPerPound: 25 },
            { level: "well-done", label: "Well-Done (160°F)", pullTempF: 155, finalTempF: 160, minsPerPound: 30 }
        ],
        restingMinsPerPound: 4,
        minRestMins: 15,
        maxRestMins: 25,
        usdaSafeTempF: 145,
        notes: "Herb crusts (rosemary, garlic, olive oil) pair exceptionally well with high-temperature initial searing."
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

export default function MeatCookingCalculator() {
    // Core Calculator States
    const [selectedCutId, setSelectedCutId] = useState<string>("beef-prime-rib");
    const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
    const [tempUnit, setTempUnit] = useState<TempUnit>("F");
    const [rawWeight, setRawWeight] = useState<number>(5.0);
    const [isBoneIn, setIsBoneIn] = useState<boolean>(true);
    const [selectedDoneness, setSelectedDoneness] = useState<DonenessLevel>("medium-rare");

    // Customization & Timing Overrides
    const [ovenTempOverride, setOvenTempOverride] = useState<number>(325);
    const [isCustomOvenTemp, setIsCustomOvenTemp] = useState<boolean>(false);
    const [dinnerTargetTime, setDinnerTargetTime] = useState<string>("");

    // Cheat Sheet Filter / Search
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Copy Feedback State
    const [copied, setCopied] = useState<boolean>(false);

    // Selected Cut Resolution
    const currentCut = useMemo(() => {
        return MEAT_PROFILES.find((p) => p.id === selectedCutId) || MEAT_PROFILES[0];
    }, [selectedCutId]);

    // Handle Cut Selection and reset appropriate doneness
    const handleCutChange = (cutId: string) => {
        setSelectedCutId(cutId);
        const cut = MEAT_PROFILES.find((p) => p.id === cutId) || MEAT_PROFILES[0];
        const defaultDoneness = cut.donenessOptions[0].level;
        setSelectedDoneness(defaultDoneness);
        setOvenTempOverride(cut.defaultOvenTempF);
        setIsCustomOvenTemp(false);
    };

    // Calculate effective weight in lbs for mathematical calculation
    const effectiveWeightLbs = useMemo(() => {
        if (weightUnit === "kg") {
            return rawWeight * 2.20462;
        }
        return rawWeight;
    }, [rawWeight, weightUnit]);

    // Available Doneness Option for current cut
    const currentDonenessOption = useMemo(() => {
        const option = currentCut.donenessOptions.find((d) => d.level === selectedDoneness);
        return option || currentCut.donenessOptions[0];
    }, [currentCut, selectedDoneness]);

    // Dynamic Calculations
    const roastMath = useMemo(() => {
        let baseMinsPerLb = currentDonenessOption.minsPerPound;

        // Bone-in adjustment: Bones conduct heat slightly differently and add thermal mass (+10% time modifier)
        if (isBoneIn && currentCut.boneInSupported) {
            baseMinsPerLb = baseMinsPerLb * 1.08;
        }

        // Custom Oven Temp Compensation (Oven heat vs Cooking Duration ratio)
        if (isCustomOvenTemp && ovenTempOverride > 0 && ovenTempOverride !== currentCut.defaultOvenTempF) {
            const tempDiff = currentCut.defaultOvenTempF - ovenTempOverride;
            // Every 25°F cooler adds ~10% cook time; hotter reduces ~8%
            const modifier = 1 + (tempDiff / 25) * 0.09;
            baseMinsPerLb = baseMinsPerLb * Math.max(0.5, Math.min(2.0, modifier));
        }

        const totalCookMinutes = Math.round(effectiveWeightLbs * baseMinsPerLb);
        const cookHours = Math.floor(totalCookMinutes / 60);
        const cookMins = totalCookMinutes % 60;

        // Resting Math
        const calculatedRest = Math.round(effectiveWeightLbs * currentCut.restingMinsPerPound);
        const restMins = Math.min(Math.max(calculatedRest, currentCut.minRestMins), currentCut.maxRestMins);

        const totalProcessMinutes = totalCookMinutes + restMins;
        const totalProcessHours = Math.floor(totalProcessMinutes / 60);
        const totalProcessMinsRemaining = totalProcessMinutes % 60;

        // Temperature Conversions
        const toTemp = (f: number) => {
            if (tempUnit === "C") {
                return Math.round(((f - 32) * 5) / 9);
            }
            return f;
        };

        const pullTemp = toTemp(currentDonenessOption.pullTempF);
        const finalTemp = toTemp(currentDonenessOption.finalTempF);
        const usdaSafeTemp = toTemp(currentCut.usdaSafeTempF);
        const ovenTarget = toTemp(isCustomOvenTemp ? ovenTempOverride : currentCut.defaultOvenTempF);

        // Schedule Target Calculation (Start Time Countdown)
        let scheduledStartTimeStr = "";
        let scheduledPullTimeStr = "";
        if (dinnerTargetTime) {
            const [hours, minutes] = dinnerTargetTime.split(":").map(Number);
            const targetDate = new Date();
            targetDate.setHours(hours, minutes, 0, 0);

            // Pull Time (Target - Rest Time)
            const pullDate = new Date(targetDate.getTime() - restMins * 60000);
            scheduledPullTimeStr = pullDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Start Cooking Time (Pull Time - Cook Time)
            const startDate = new Date(targetDate.getTime() - totalProcessMinutes * 60000);
            scheduledStartTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return {
            totalCookMinutes,
            cookHours,
            cookMins,
            restMins,
            totalProcessHours,
            totalProcessMinsRemaining,
            pullTemp,
            finalTemp,
            usdaSafeTemp,
            ovenTarget,
            scheduledStartTimeStr,
            scheduledPullTimeStr,
            carryoverDegrees: currentDonenessOption.finalTempF - currentDonenessOption.pullTempF
        };
    }, [currentCut, currentDonenessOption, effectiveWeightLbs, isBoneIn, isCustomOvenTemp, ovenTempOverride, tempUnit, dinnerTargetTime]);

    const handleReset = () => {
        setSelectedCutId("beef-prime-rib");
        setWeightUnit("lbs");
        setTempUnit("F");
        setRawWeight(5.0);
        setIsBoneIn(true);
        setSelectedDoneness("medium-rare");
        setOvenTempOverride(325);
        setIsCustomOvenTemp(false);
        setDinnerTargetTime("");
    };

    const handleCopy = () => {
        const text = `Meat Roasting & Thermal Cooking Summary:
----------------------------------------
Cut: ${currentCut.name} (${rawWeight} ${weightUnit}${isBoneIn ? ", Bone-In" : ", Boneless"})
Target Doneness: ${currentDonenessOption.label}
Oven Roasting Temperature: ${roastMath.ovenTarget}°${tempUnit}
Estimated Active Roasting Time: ${roastMath.cookHours}h ${roastMath.cookMins}m
Thermometer Pull Target: ${roastMath.pullTemp}°${tempUnit} (Carryover: +${roastMath.carryoverDegrees}°${tempUnit})
Target Final Rested Temp: ${roastMath.finalTemp}°${tempUnit}
Essential Rest Time: ${roastMath.restMins} minutes
${dinnerTargetTime ? `Schedule Timeline: Start at ${roastMath.scheduledStartTimeStr} ➔ Pull at ${roastMath.scheduledPullTimeStr} ➔ Serve at ${dinnerTargetTime}` : ""}
----------------------------------------
Calculated via twistertools.com/tools/home-tools/meat-cooking-time-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredCatalog = useMemo(() => {
        return MEAT_PROFILES.filter((item) => {
            const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.recommendedCookingMethod.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [categoryFilter, searchQuery]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Meat Roasting & Internal Cooking Temperature Guide",
        "url": "https://twistertools.com/tools/home-tools/meat-cooking-time-calculator",
        "description": "Enterprise-grade meat roasting calculator, internal pull temperature matrix, carryover cooking predictor, and dinner serving countdown timer.",
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
                "name": "What is carryover cooking and why must I pull meat early?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Carryover cooking is the thermodynamic phenomenon where residual heat stored in the meat's exterior continues to conduct toward the center even after removal from the heat source. Roasts typically rise 5°F to 10°F (3°C to 6°C) while resting. Pulling early prevents overcooking."
                }
            },
            {
                "@type": "Question",
                "name": "Why is resting meat mandatory before carving?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "During roasting, muscle fibers contract and squeeze juices outward toward the surface. Resting relaxes muscle fibers, increases viscosity of cellular liquids, and redistributes moisture uniformly. Slicing immediately causes up to 40% more liquid loss onto the cutting board."
                }
            },
            {
                "@type": "Question",
                "name": "Where is the accurate spot to place a meat thermometer?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Insert the probe into the geometric center of the thickest muscle mass. Avoid touching bones, large fat pockets, or gristle, as bone conducts heat faster and fat insulates, leading to false temperature spikes."
                }
            },
            {
                "@type": "Question",
                "name": "What is the reverse sear method for large roasts?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Reverse searing involves slow-roasting large cuts (like prime rib or thick steaks) at low temperatures (200°F to 250°F) until internal core reaches within 10°F of target doneness, resting the roast, and finishing with a 500°F sear for 5-10 minutes to develop an edge-to-edge pink interior with a crusty Maillard bark."
                }
            },
            {
                "@type": "Question",
                "name": "Why did the USDA lower the safe pork internal temperature to 145°F?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern commercial pork is virtually free from trichinosis parasites. In 2011, the USDA officially updated recommendations for whole pork cuts to 145°F (63°C) with a mandatory 3-minute rest, ensuring juicy, tender pork with a light pink center."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Meat Selection & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-indigo-600" />
                                Meat Cut & Physical Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset Guide
                            </button>
                        </div>

                        {/* Cut Selector */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Select Meat Cut / Protein
                            </label>
                            <select
                                value={selectedCutId}
                                onChange={(e) => handleCutChange(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                {MEAT_PROFILES.map((cut) => (
                                    <option key={cut.id} value={cut.id}>
                                        {cut.name} ({cut.category.toUpperCase()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Weight and Units Configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Raw Meat Weight
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.5"
                                        max="50"
                                        value={rawWeight === 0 ? "" : rawWeight}
                                        onChange={(e) => handleNumberInput(e, setRawWeight)}
                                        className="w-full px-3 py-2 font-bold text-slate-900 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setWeightUnit("lbs")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${weightUnit === "lbs" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                        >
                                            lbs
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setWeightUnit("kg")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${weightUnit === "kg" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                        >
                                            kg
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Temperature Units */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Temperature Scale
                                </label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("F")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${tempUnit === "F" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Fahrenheit (°F)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("C")}
                                        className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${tempUnit === "C" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Celsius (°C)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bone Structure Option */}
                        {currentCut.boneInSupported && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 block">Bone-In Anatomy Modifier</span>
                                    <span className="text-[11px] text-slate-500">Bones add thermal mass and slightly extend roasting duration (+8-10%)</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isBoneIn}
                                        onChange={(e) => setIsBoneIn(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        )}

                        {/* Desired Doneness Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Thermometer className="w-4 h-4 text-indigo-600" />
                                Target Doneness Level
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {currentCut.donenessOptions.map((opt) => (
                                    <button
                                        key={opt.level}
                                        type="button"
                                        onClick={() => setSelectedDoneness(opt.level)}
                                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${selectedDoneness === opt.level
                                                ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-500"
                                                : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold">{opt.label}</span>
                                            {selectedDoneness === opt.level && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                                        </div>
                                        <span className="text-[11px] text-slate-500 mt-1 font-mono">
                                            Final: {tempUnit === "F" ? `${opt.finalTempF}°F` : `${Math.round(((opt.finalTempF - 32) * 5) / 9)}°C`}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Oven Temp & Schedule Target (Toggleable) */}
                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        Target Dinner Serving Time (Optional)
                                    </label>
                                    <input
                                        type="time"
                                        value={dinnerTargetTime}
                                        onChange={(e) => setDinnerTargetTime(e.target.value)}
                                        className="px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Set your dinner time to calculate the exact time to start roasting and pull from oven.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            USDA Recommended Safe Min: {roastMath.usdaSafeTemp}°{tempUnit}
                        </span>
                        <span>Calibrated Heat Curves</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Timing, Thermal Pull & Serving Timelines */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ChefHat className="w-5 h-5 text-indigo-600" />
                                Thermal Targets & Cooking Schedule
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                Precision Metrics
                            </span>
                        </div>

                        {/* Highlight Hero Output Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Pull Temperature Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Thermometer className="w-4 h-4 text-indigo-600" /> Oven Pull Point
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        Remove from Heat
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {roastMath.pullTemp}°{tempUnit}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Rises to {roastMath.finalTemp}°{tempUnit} during resting
                                </p>
                            </div>

                            {/* Estimated Roasting Time */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Timer className="w-4 h-4 text-indigo-600" /> Roasting Time
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        @ {roastMath.ovenTarget}°{tempUnit}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {roastMath.cookHours > 0 && `${roastMath.cookHours}h `}
                                    {roastMath.cookMins}
                                    <span className="text-lg font-bold text-slate-600 ml-1">m</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    + {roastMath.restMins} mins mandatory rest
                                </p>
                            </div>
                        </div>

                        {/* Serving Schedule Timeline Card (If dinner time set) */}
                        {dinnerTargetTime ? (
                            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                    <span className="flex items-center gap-1.5">
                                        <Hourglass className="w-4 h-4 text-emerald-600" />
                                        Serving Timeline Countdown
                                    </span>
                                    <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded text-[11px]">
                                        Serve @ {dinnerTargetTime}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Put in Oven</span>
                                        <span className="text-xs sm:text-sm font-black text-slate-900">{roastMath.scheduledStartTimeStr}</span>
                                    </div>
                                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Pull from Oven</span>
                                        <span className="text-xs sm:text-sm font-black text-indigo-700">{roastMath.scheduledPullTimeStr}</span>
                                    </div>
                                    <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Rest Period</span>
                                        <span className="text-xs sm:text-sm font-black text-emerald-700">{roastMath.restMins} mins</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Carryover Dynamics Banner */
                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <div className="space-y-1 text-xs">
                                    <p className="font-bold text-amber-900 uppercase tracking-wider">
                                        Carryover Cooking Delta: +{roastMath.carryoverDegrees}°{tempUnit}
                                    </p>
                                    <p className="text-amber-800 leading-relaxed">
                                        Residual surface energy conducts inward after removal. Rest for <strong>{roastMath.restMins} minutes</strong> tented loosely with foil before slicing.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Analytical Quick-Reference Metrics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Time</span>
                                <span className="text-sm sm:text-base font-black text-slate-800">
                                    {roastMath.totalProcessHours}h {roastMath.totalProcessMinsRemaining}m
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Resting Stage</span>
                                <span className="text-sm sm:text-base font-black text-indigo-600">{roastMath.restMins} mins</span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Probe Placement</span>
                                <span className="text-xs sm:text-xs font-bold text-slate-800">Center Core</span>
                            </div>
                        </div>

                        {/* Chef Roasting Directives */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Pitmaster & Chef Directives
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {currentCut.notes}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopy}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Roasting Plan Copied!" : "Copy Roasting Schedule"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Temperature Matrix & Cheat Sheet */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Thermometer className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Meat Internal Temperature & Roasting Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this culinary matrix to cross-reference ideal pull temperatures, carryover thresholds, and official USDA food safety minimums across standard butcher cuts. Filter by protein category or search for specific roasts.
                    </p>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search cuts (e.g. prime rib, brisket, pork loin)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {["all", "beef", "poultry", "pork", "lamb"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategoryFilter(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${categoryFilter === cat
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {cat === "all" ? "All Cuts" : cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Matrix Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Cut & Category</th>
                                    <th className="p-3">Oven Temp</th>
                                    <th className="p-3">Thermometer Pull Temp</th>
                                    <th className="p-3">Target Rested Temp</th>
                                    <th className="p-3">Rest Duration</th>
                                    <th className="p-3">USDA Minimum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {filteredCatalog.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-xs text-slate-400">
                                            No meat cuts matched your query.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCatalog.map((item) => {
                                        const primeOpt = item.donenessOptions[0];
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50">
                                                <td className="p-3">
                                                    <span className="font-bold text-slate-900 block">{item.name}</span>
                                                    <span className="text-[11px] text-slate-500 uppercase tracking-wider">{item.category}</span>
                                                </td>
                                                <td className="p-3 text-slate-600 font-mono">{item.defaultOvenTempF}°F</td>
                                                <td className="p-3 font-bold text-indigo-700 font-mono">{primeOpt.pullTempF}°F ({Math.round(((primeOpt.pullTempF - 32) * 5) / 9)}°C)</td>
                                                <td className="p-3 font-bold text-emerald-700 font-mono">{primeOpt.finalTempF}°F ({Math.round(((primeOpt.finalTempF - 32) * 5) / 9)}°C)</td>
                                                <td className="p-3 text-xs text-slate-600">{item.minRestMins} – {item.maxRestMins} mins</td>
                                                <td className="p-3 text-xs text-amber-700 font-bold">{item.usdaSafeTempF}°F</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Thermodynamic Principles of Roasting & Carryover */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Thermodynamics of Roasting, Heat Flux & Carryover Cooking
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Cooking meat is a heat transfer and protein chemistry challenge. Understanding internal temperature gradients and thermal conductivity ensures consistent tenderness without overcooked gray bands.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Thermal Equilibrium & Heat Transfer
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When roasting, the exterior crust reaches oven temperature while the thermal center lags significantly behind. Heat moves inward via conduction ($q = -k \nabla T$). When removed from the oven, this thermal energy gradient continues migrating toward the colder core, causing carryover temperature elevation of 5°F to 15°F.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Collagen Denaturation & Gelatinization
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Tough cuts (brisket, pork shoulder) are dense in insoluble collagen. While lean cuts dry out past 145°F, tough cuts must reach 195°F to 205°F for sustained intervals to melt triple-helix collagen fibrils into soft, gelatinous moisture.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4" /> Thermal Rest Rule Formula
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To calculate safe pull temperatures and prevent overcooking:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Thermometer Pull Target:</span>
                                <strong className="text-indigo-300 text-sm">T_pull = T_target - (0.05 to 0.10 × T_oven_gradient)</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Resting Duration:</span>
                                <strong className="text-indigo-300 text-sm">Time_rest = Weight_lbs × 3.5 mins (Min 10m, Max 30m)</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Reverse Sear vs Traditional Roasting Breakdown */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Flame className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Technique Comparison: Traditional Roasting vs. Reverse Sear
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct cooking technique depends on the thickness, fat distribution, and diameter of your cut:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Culinary Technique</th>
                                    <th className="p-3">Oven Temp Profile</th>
                                    <th className="p-3">Edge-to-Edge Pink Uniformity</th>
                                    <th className="p-3">Best Cut Applications</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Reverse Sear</td>
                                    <td className="p-3 font-mono text-xs">225°F Low Roast ➔ 500°F Flash Sear</td>
                                    <td className="p-3 font-bold text-emerald-600">95% (No Gray Band)</td>
                                    <td className="p-3 text-xs">Prime Rib, Thick Steaks (1.5"+), Chateaubriand</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">High-Heat Traditional</td>
                                    <td className="p-3 font-mono text-xs">375°F – 425°F Constant</td>
                                    <td className="p-3 font-bold text-amber-600">Moderate (Tapered Ring)</td>
                                    <td className="p-3 text-xs">Whole Chicken, Duck, Tenderloin</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Low & Slow Braising</td>
                                    <td className="p-3 font-mono text-xs">250°F – 275°F Enclosed</td>
                                    <td className="p-3 font-bold text-indigo-600">N/A (Fully Broken Down)</td>
                                    <td className="p-3 text-xs">Beef Brisket, Pork Butt, Lamb Shanks</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Worked Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Roasting Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how our thermal timeline model executes in real kitchen scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: 6 lb Bone-In Prime Rib (Medium-Rare)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Beef</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Oven Temperature:</strong> 325°F (163°C) convection roast.</li>
                                <li><strong>Cook Time:</strong> 6 lbs × 17.28 mins/lb = <strong>1 hour 44 mins</strong>.</li>
                                <li><strong>Thermometer Pull:</strong> Remove at <strong>130°F (54°C)</strong>.</li>
                                <li><strong>Resting Period:</strong> 24 minutes tented with aluminum foil.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: Core coasts up to exactly 135°F with edge-to-edge juiciness.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: 14 lb Holiday Whole Turkey</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Poultry</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Oven Temperature:</strong> 325°F (163°C) on lower oven rack.</li>
                                <li><strong>Cook Time:</strong> 14 lbs × 15 mins/lb = <strong>3 hours 30 mins</strong>.</li>
                                <li><strong>Thermometer Pull:</strong> Remove at <strong>160°F (71°C)</strong> in thigh.</li>
                                <li><strong>Resting Period:</strong> 35 minutes before carving.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: Safe 165°F final temperature without drying delicate breast meat.
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
                                What is carryover cooking and why must I pull meat early?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Carryover cooking is the thermodynamic phenomenon where residual heat stored in the meat&apos;s exterior continues to conduct toward the center even after removal from the heat source. Roasts typically rise 5°F to 10°F (3°C to 6°C) while resting. Pulling early prevents overcooking.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is resting meat mandatory before carving?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                During roasting, muscle fibers contract and squeeze juices outward toward the surface. Resting relaxes muscle fibers, increases viscosity of cellular liquids, and redistributes moisture uniformly. Slicing immediately causes up to 40% more liquid loss onto the cutting board.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Where is the accurate spot to place a meat thermometer?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Insert the probe into the geometric center of the thickest muscle mass. Avoid touching bones, large fat pockets, or gristle, as bone conducts heat faster and fat insulates, leading to false temperature spikes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the reverse sear method for large roasts?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Reverse searing involves slow-roasting large cuts (like prime rib or thick steaks) at low temperatures (200°F to 250°F) until internal core reaches within 10°F of target doneness, resting the roast, and finishing with a 500°F sear for 5-10 minutes to develop an edge-to-edge pink interior with a crusty Maillard bark.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why did the USDA lower the safe pork internal temperature to 145°F?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern commercial pork is virtually free from trichinosis parasites. In 2011, the USDA officially updated recommendations for whole pork cuts to 145°F (63°C) with a mandatory 3-minute rest, ensuring juicy, tender pork with a light pink center.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}