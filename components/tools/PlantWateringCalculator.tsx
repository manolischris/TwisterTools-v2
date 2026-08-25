"use client";

import React, { useState, useMemo } from "react";
import {
    Sprout,
    Droplets,
    Cylinder,
    Sun,
    Calendar,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    AlertCircle,
    Lightbulb,
    Scale,
    ShieldAlert,
    Gauge,
    Search,
    SlidersHorizontal,
    Compass,
    Layers,
    Waves
} from "lucide-react";

type UnitSystem = "metric" | "imperial";
type PotShape = "cylinder" | "conical" | "rectangle" | "square";
type PlantCategory = "succulent" | "tropical" | "foliage" | "fern" | "herb" | "flowering" | "tree";
type SeasonType = "summer" | "spring" | "fall" | "winter";
type LightExposure = "direct" | "bright-indirect" | "medium" | "low";
type PotMaterial = "terracotta" | "ceramic-glazed" | "plastic" | "fabric" | "concrete";
type SoilBlend = "standard-potting" | "cactus-succulent" | "aroid-chunky" | "peat-heavy";

interface PlantPreset {
    name: string;
    category: PlantCategory;
    baseDays: number;
    waterVolumePct: number; // % of pot soil volume to deliver
    moistureTarget: string;
    lightPreference: string;
    notes: string;
}

const PLANT_PRESETS: PlantPreset[] = [
    { name: "Monstera Deliciosa", category: "tropical", baseDays: 7, waterVolumePct: 25, moistureTarget: "Top 2-3 inches dry", lightPreference: "Bright Indirect", notes: "Prefers chunky aerated soil; sensitive to soggy bases" },
    { name: "Snake Plant (Sansevieria)", category: "succulent", baseDays: 16, waterVolumePct: 20, moistureTarget: "100% Completely dry", lightPreference: "Low to Direct", notes: "Thrives on drought neglect; highly prone to root rot" },
    { name: "Fiddle Leaf Fig (Ficus lyrata)", category: "tree", baseDays: 8, waterVolumePct: 30, moistureTarget: "Top 2 inches dry", lightPreference: "Bright Indirect", notes: "Dislikes drafty spots and inconsistent watering schedules" },
    { name: "Pothos (Epipremnum aureum)", category: "foliage", baseDays: 6, waterVolumePct: 25, moistureTarget: "Top 1-2 inches dry", lightPreference: "Medium to Low", notes: "Leaves droop slightly when thirsty; very resilient" },
    { name: "ZZ Plant (Zamioculcas zamiifolia)", category: "succulent", baseDays: 18, waterVolumePct: 20, moistureTarget: "100% Completely dry", lightPreference: "Low to Medium", notes: "Stores water in thick subterranean rhizomes" },
    { name: "Boston Fern", category: "fern", baseDays: 4, waterVolumePct: 30, moistureTarget: "Evenly moist (never soggy)", lightPreference: "Medium Filtered", notes: "Requires consistent moisture and higher ambient humidity" },
    { name: "Peace Lily (Spathiphyllum)", category: "flowering", baseDays: 5, waterVolumePct: 25, moistureTarget: "Top inch dry", lightPreference: "Low to Medium", notes: "Dramatic leaf droop signals water demand; sensitive to fluoride" },
    { name: "Sweet Basil (Potted)", category: "herb", baseDays: 3, waterVolumePct: 30, moistureTarget: "Surface dry", lightPreference: "Full Direct Sun", notes: "High transpiration rate under intense sunlight" },
    { name: "Aloe Vera", category: "succulent", baseDays: 14, waterVolumePct: 20, moistureTarget: "100% Completely dry", lightPreference: "Direct to Bright", notes: "Succulent leaves store gelatinous water reserves" },
    { name: "Calathea / Prayer Plant", category: "tropical", baseDays: 5, waterVolumePct: 25, moistureTarget: "Slightly damp continuously", lightPreference: "Medium Indirect", notes: "Needs distilled or rainwater to avoid crispy leaf margins" },
    { name: "Spider Plant (Chlorophytum)", category: "foliage", baseDays: 6, waterVolumePct: 25, moistureTarget: "Top 50% dry", lightPreference: "Bright Indirect", notes: "Tolerant of dry spells; produces vigorous runners" },
    { name: "Jade Plant (Crassula ovata)", category: "succulent", baseDays: 14, waterVolumePct: 20, moistureTarget: "100% Completely dry", lightPreference: "Direct Sun", notes: "Fleshy leaves shrivel slightly when water reserves deplete" }
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

export default function PlantWateringCalculator() {
    // Units and Plant Selection
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
    const [selectedPlantName, setSelectedPlantName] = useState<string>("Monstera Deliciosa");
    const [baseIntervalDays, setBaseIntervalDays] = useState<number>(7);
    const [waterVolumeRatioPct, setWaterVolumeRatioPct] = useState<number>(25);

    // Environmental Parameters
    const [season, setSeason] = useState<SeasonType>("summer");
    const [light, setLight] = useState<LightExposure>("bright-indirect");
    const [roomTempC, setRoomTempC] = useState<number>(22);
    const [humidityPct, setHumidityPct] = useState<number>(50);
    const [hasDrainageHole, setHasDrainageHole] = useState<boolean>(true);

    // Pot Geometry & Material
    const [potMaterial, setPotMaterial] = useState<PotMaterial>("plastic");
    const [soilBlend, setSoilBlend] = useState<SoilBlend>("standard-potting");
    const [potShape, setPotShape] = useState<PotShape>("cylinder");

    // Dimensions: Metric (cm) vs Imperial (inches)
    const [dimDiameterTop, setDimDiameterTop] = useState<number>(20);
    const [dimDiameterBottom, setDimDiameterBottom] = useState<number>(15);
    const [dimHeight, setDimHeight] = useState<number>(18);
    const [dimLength, setDimLength] = useState<number>(25);
    const [dimWidth, setDimWidth] = useState<number>(15);

    // Filter & Search for Master Plant Directory
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Copy State
    const [copied, setCopied] = useState<boolean>(false);

    // Calculations: Volume of Pot
    const volumeCalculations = useMemo(() => {
        // Normalize dimensions to cm
        const toCm = (val: number) => (unitSystem === "metric" ? val : val * 2.54);

        const hCm = toCm(dimHeight);
        const dTopCm = toCm(dimDiameterTop);
        const dBottomCm = toCm(dimDiameterBottom);
        const lCm = toCm(dimLength);
        const wCm = toCm(dimWidth);

        let volumeCubicCm = 0;

        if (potShape === "cylinder") {
            const radius = dTopCm / 2;
            volumeCubicCm = Math.PI * Math.pow(radius, 2) * hCm;
        } else if (potShape === "conical") {
            // Frustum of a cone
            const r1 = dTopCm / 2;
            const r2 = dBottomCm / 2;
            volumeCubicCm = (1 / 3) * Math.PI * hCm * (Math.pow(r1, 2) + Math.pow(r2, 2) + r1 * r2);
        } else if (potShape === "rectangle") {
            volumeCubicCm = lCm * wCm * hCm;
        } else if (potShape === "square") {
            volumeCubicCm = lCm * lCm * hCm;
        }

        const volumeLiters = volumeCubicCm / 1000;
        const volumeGallons = volumeLiters * 0.264172;
        const volumeQuarts = volumeLiters * 1.05669;
        const volumeCubicInches = volumeCubicCm / 16.3871;

        // Effective soil volume assuming 90% potting fill height
        const soilVolumeLiters = volumeLiters * 0.90;
        const soilWeightDryKg = soilVolumeLiters * 0.45; // ~0.45 kg/L for airy potting mix

        return {
            volumeLiters,
            volumeGallons,
            volumeQuarts,
            volumeCubicInches,
            soilVolumeLiters,
            soilWeightDryKg
        };
    }, [unitSystem, potShape, dimHeight, dimDiameterTop, dimDiameterBottom, dimLength, dimWidth]);

    // Environmental Modifier & Interval Calculation
    const intervalCalculations = useMemo(() => {
        // Season multiplier
        let seasonMult = 1.0;
        if (season === "summer") seasonMult = 0.80; // Dries 20% faster
        else if (season === "spring") seasonMult = 1.0;
        else if (season === "fall") seasonMult = 1.25;
        else if (season === "winter") seasonMult = 1.65; // Dormancy / low transpiration

        // Light multiplier
        let lightMult = 1.0;
        if (light === "direct") lightMult = 0.75;
        else if (light === "bright-indirect") lightMult = 1.0;
        else if (light === "medium") lightMult = 1.30;
        else if (light === "low") lightMult = 1.70;

        // Pot material evaporation multiplier
        let potMult = 1.0;
        if (potMaterial === "terracotta") potMult = 0.70; // Highly porous, dries very fast
        else if (potMaterial === "fabric") potMult = 0.75;
        else if (potMaterial === "ceramic-glazed") potMult = 1.10;
        else if (potMaterial === "plastic") potMult = 1.15; // Non-porous retains water
        else if (potMaterial === "concrete") potMult = 0.90;

        // Soil blend water retention multiplier
        let soilMult = 1.0;
        if (soilBlend === "cactus-succulent") soilMult = 0.75; // Fast drainage
        else if (soilBlend === "aroid-chunky") soilMult = 0.85;
        else if (soilBlend === "standard-potting") soilMult = 1.0;
        else if (soilBlend === "peat-heavy") soilMult = 1.30; // Dense retention

        // Pot volume buffering factor: larger pots dry out significantly slower
        let sizeMult = 1.0;
        if (volumeCalculations.volumeLiters < 1.5) sizeMult = 0.75; // Small pots dry quickly
        else if (volumeCalculations.volumeLiters < 4.0) sizeMult = 0.90;
        else if (volumeCalculations.volumeLiters < 12.0) sizeMult = 1.0;
        else if (volumeCalculations.volumeLiters < 25.0) sizeMult = 1.25;
        else sizeMult = 1.50; // Massive containers retain deep core moisture

        // Temperature & Humidity Multiplier
        const normTemp = unitSystem === "metric" ? roomTempC : ((roomTempC - 32) * 5) / 9;
        const tempFactor = normTemp > 24 ? 0.85 : normTemp < 18 ? 1.20 : 1.0;
        const humidFactor = humidityPct < 35 ? 0.85 : humidityPct > 65 ? 1.20 : 1.0;

        // Drainage factor
        const drainageMult = hasDrainageHole ? 1.0 : 1.40; // No drainage requires ultra-conservative schedule

        const totalMultiplier = seasonMult * lightMult * potMult * soilMult * sizeMult * tempFactor * humidFactor * drainageMult;
        const calculatedInterval = Math.max(1, Math.round(baseIntervalDays * totalMultiplier));

        // Recommended watering volume per session (approx 20-30% of pot volume to saturate root zone)
        const targetWaterLiters = (volumeCalculations.soilVolumeLiters * (waterVolumeRatioPct / 100));
        const targetWaterMl = Math.round(targetWaterLiters * 1000);
        const targetWaterFlOz = Math.round(targetWaterLiters * 33.814);
        const targetWaterCups = (targetWaterFlOz / 8).toFixed(1);

        // Next watering dates projection (next 3 intervals)
        const today = new Date();
        const nextDates: string[] = [];
        for (let i = 1; i <= 3; i++) {
            const nextDate = new Date();
            nextDate.setDate(today.getDate() + (calculatedInterval * i));
            nextDates.push(nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" }));
        }

        return {
            calculatedInterval,
            totalMultiplier: totalMultiplier.toFixed(2),
            targetWaterMl,
            targetWaterFlOz,
            targetWaterCups,
            nextDates
        };
    }, [
        baseIntervalDays,
        season,
        light,
        potMaterial,
        soilBlend,
        volumeCalculations.volumeLiters,
        volumeCalculations.soilVolumeLiters,
        unitSystem,
        roomTempC,
        humidityPct,
        hasDrainageHole,
        waterVolumeRatioPct
    ]);

    const handleSelectPreset = (plant: PlantPreset) => {
        setSelectedPlantName(plant.name);
        setBaseIntervalDays(plant.baseDays);
        setWaterVolumeRatioPct(plant.waterVolumePct);
    };

    const handleReset = () => {
        setUnitSystem("metric");
        setSelectedPlantName("Monstera Deliciosa");
        setBaseIntervalDays(7);
        setWaterVolumeRatioPct(25);
        setSeason("summer");
        setLight("bright-indirect");
        setRoomTempC(22);
        setHumidityPct(50);
        setHasDrainageHole(true);
        setPotMaterial("plastic");
        setSoilBlend("standard-potting");
        setPotShape("cylinder");
        setDimDiameterTop(20);
        setDimDiameterBottom(15);
        setDimHeight(18);
        setDimLength(25);
        setDimWidth(15);
        setSearchQuery("");
        setSelectedCategory("all");
    };

    const handleCopySummary = () => {
        const text = `Plant Hydration & Pot Volume Plan:
------------------------------------------------
Target Plant: ${selectedPlantName}
Calculated Watering Frequency: Every ${intervalCalculations.calculatedInterval} days
Recommended Water Volume: ${unitSystem === "metric" ? `${intervalCalculations.targetWaterMl} mL` : `${intervalCalculations.targetWaterFlOz} fl oz (${intervalCalculations.targetWaterCups} cups)`}
Estimated Pot Soil Volume: ${volumeCalculations.volumeLiters.toFixed(2)} Liters (${volumeCalculations.volumeGallons.toFixed(2)} Gallons)
Pot Setup: ${potMaterial} pot (${potShape}), ${hasDrainageHole ? "With drainage" : "NO drainage hole"}
Environment: ${season} season, ${light} lighting, ${unitSystem === "metric" ? `${roomTempC}°C` : `${roomTempC}°F`}, ${humidityPct}% RH
Next Suggested Waterings: ${intervalCalculations.nextDates.join(", ")}
------------------------------------------------
Calculated via twistertools.com/tools/home-tools/plant-watering-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filteredPresets = useMemo(() => {
        return PLANT_PRESETS.filter((item) => {
            const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.moistureTarget.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Plant Watering Interval & Pot Volume Estimator",
        "url": "https://twistertools.com/tools/home-tools/plant-watering-calculator",
        "description": "Calculate exact houseplant watering intervals and pot soil volume based on plant species, pot geometry, material porosity, sunlight levels, season, and indoor ambient humidity.",
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
                "name": "Why is watering on a fixed calendar schedule dangerous for houseplants?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Fixed calendar watering ignores dynamic environmental factors such as seasonal day-length shifts, ambient humidity, temperature changes, and pot material porosity. During winter dormancy or cloudy spells, transpiration slows by 50% or more; continuing summer watering routines suffocates roots in oxygen-deprived soggy soil, causing fungal root rot."
                }
            },
            {
                "@type": "Question",
                "name": "How does pot material (terracotta vs plastic) alter watering frequency?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Terracotta and unglazed ceramics are highly porous, wicking moisture out through the sidewalls and increasing root-zone aeration. Plants in terracotta dry out 30% to 50% faster than those in non-porous plastic, glazed ceramic, or metal containers, which trap moisture until absorbed by the plant or evaporated from the top soil surface."
                }
            },
            {
                "@type": "Question",
                "name": "How much water should I pour per watering session?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For pots with functional drainage holes, deliver approximately 20% to 30% of the total soil volume in water until roughly 10% to 20% drains freely into the saucer. Empty the drip tray after 15 to 30 minutes to prevent bottom-up saturation. For pots without drainage holes, restrict water volume to 10% of pot volume to prevent anaerobic standing water."
                }
            },
            {
                "@type": "Question",
                "name": "How do I measure tapered round pots to calculate soil volume accurately?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most standard round flowerpots are conical frustums (wider at the top rim than at the base). To calculate exact volume, measure top diameter (d1), bottom diameter (d2), and vertical height (h), then apply the frustum formula: V = (1/3) * π * h * ((d1/2)^2 + (d2/2)^2 + (d1/2)*(d2/2))."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between top-watering and bottom-watering?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Top-watering flushes accumulated mineral fertilizer salts down through the soil profile and rehydrates hydrophobic topsoil. Bottom-watering (placing the pot in a water tray for 20-30 minutes) relies on capillary action to saturate the root ball from below, keeping surface soil dry to deter fungus gnats."
                }
            },
            {
                "@type": "Question",
                "name": "What are the telltale symptoms of overwatering versus underwatering?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Underwatered plants show crispy, papery brown leaf tips, wilted limp stems, and dry, pulling soil edges. Overwatered plants exhibit yellowing lower leaves (chlorosis), soft mushy brown stems, black leaf patches, and persistently damp, sour-smelling soil despite drooping foliage."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Botanical & Environmental Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sprout className="w-5 h-5 text-indigo-600" />
                                Plant & Environment Setup
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Measurement System Selector */}
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">
                                Units of Measurement
                            </span>
                            <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("metric")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Metric (cm / mL / L)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUnitSystem("imperial")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                >
                                    Imperial (in / fl oz / Gal)
                                </button>
                            </div>
                        </div>

                        {/* Active Plant Selector & Presets */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Select Plant Species Preset
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {PLANT_PRESETS.slice(0, 6).map((plant) => (
                                    <button
                                        key={plant.name}
                                        type="button"
                                        onClick={() => handleSelectPreset(plant)}
                                        className={`p-2.5 text-left rounded-xl border transition text-xs cursor-pointer group ${selectedPlantName === plant.name
                                            ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500"
                                            : "border-slate-200 bg-slate-50/70 hover:bg-indigo-50/40 hover:border-indigo-200"
                                            }`}
                                    >
                                        <p className="font-bold text-slate-800 group-hover:text-indigo-600 truncate">{plant.name}</p>
                                        <p className="text-[11px] text-slate-500">Base: ~{plant.baseDays} days</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Environmental Conditions Grid */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sun className="w-4 h-4 text-indigo-600" />
                                Environmental Exposure & Season
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Current Season</label>
                                    <select
                                        value={season}
                                        onChange={(e) => setSeason(e.target.value as SeasonType)}
                                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="summer">Summer (Peak Transpiration -20% days)</option>
                                        <option value="spring">Spring (Active Growth - Baseline)</option>
                                        <option value="fall">Fall (Cooling / Slowing +25% days)</option>
                                        <option value="winter">Winter (Dormancy / Low Light +65% days)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Light Exposure</label>
                                    <select
                                        value={light}
                                        onChange={(e) => setLight(e.target.value as LightExposure)}
                                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="direct">Direct Sunlight (Window Sill / South)</option>
                                        <option value="bright-indirect">Bright Indirect (East / West)</option>
                                        <option value="medium">Medium Filtered Light (North / 6ft back)</option>
                                        <option value="low">Low Light / Office Shade</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-700">Ambient Temperature</label>
                                        <span className="text-xs font-bold text-slate-900">{roomTempC}°{unitSystem === "metric" ? "C" : "F"}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={unitSystem === "metric" ? 14 : 58}
                                        max={unitSystem === "metric" ? 34 : 94}
                                        step={1}
                                        value={roomTempC}
                                        onChange={(e) => setRoomTempC(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-semibold text-slate-700">Relative Humidity</label>
                                        <span className="text-xs font-bold text-slate-900">{humidityPct}% RH</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={20}
                                        max={85}
                                        step={5}
                                        value={humidityPct}
                                        onChange={(e) => setHumidityPct(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pot Material & Soil Type */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                Pot Substrate & Porosity
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Pot Material</label>
                                    <select
                                        value={potMaterial}
                                        onChange={(e) => setPotMaterial(e.target.value as PotMaterial)}
                                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="terracotta">Unglazed Terracotta (Porous - Dries 30% faster)</option>
                                        <option value="plastic">Plastic / Nursery Pot (Retentive)</option>
                                        <option value="ceramic-glazed">Glazed Ceramic (Non-Porous)</option>
                                        <option value="fabric">Fabric Grow Bag (High Aeration)</option>
                                        <option value="concrete">Concrete / Cement (Moderate Porosity)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-600">Potting Soil Blend</label>
                                    <select
                                        value={soilBlend}
                                        onChange={(e) => setSoilBlend(e.target.value as SoilBlend)}
                                        className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="standard-potting">Standard Indoor Peat/Perlite Mix</option>
                                        <option value="aroid-chunky">Chunky Aroid Bark & Perlite Mix</option>
                                        <option value="cactus-succulent">Gritty Cactus/Succulent Sand Blend</option>
                                        <option value="peat-heavy">Heavy Peat / Moisture-Retentive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Functional Drainage Hole Present?</p>
                                    <p className="text-[11px] text-slate-500">Pots without holes risk anaerobic water stagnation</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setHasDrainageHole(!hasDrainageHole)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${hasDrainageHole
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                        : "bg-rose-50 text-rose-700 border-rose-300"
                                        }`}
                                >
                                    {hasDrainageHole ? "Yes (Drainage Hole)" : "No (Cachepot / Sealed)"}
                                </button>
                            </div>
                        </div>

                        {/* Pot Dimensions & Shape Geometry */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Cylinder className="w-4 h-4 text-indigo-600" />
                                Pot Geometry & Physical Dimensions
                            </h3>

                            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl">
                                {(["cylinder", "conical", "rectangle", "square"] as PotShape[]).map((shape) => (
                                    <button
                                        key={shape}
                                        type="button"
                                        onClick={() => setPotShape(shape)}
                                        className={`py-1.5 text-xs font-bold rounded-lg transition capitalize cursor-pointer ${potShape === shape ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        {shape}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                                {(potShape === "cylinder" || potShape === "conical") && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Top Rim Diameter</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={5}
                                                max={100}
                                                value={dimDiameterTop === 0 ? "" : dimDiameterTop}
                                                onChange={(e) => handleNumberInput(e, setDimDiameterTop)}
                                                className="w-full px-2.5 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">{unitSystem === "metric" ? "cm" : "in"}</span>
                                        </div>
                                    </div>
                                )}

                                {potShape === "conical" && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Bottom Base Diameter</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={3}
                                                max={90}
                                                value={dimDiameterBottom === 0 ? "" : dimDiameterBottom}
                                                onChange={(e) => handleNumberInput(e, setDimDiameterBottom)}
                                                className="w-full px-2.5 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">{unitSystem === "metric" ? "cm" : "in"}</span>
                                        </div>
                                    </div>
                                )}

                                {(potShape === "rectangle" || potShape === "square") && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Length / Side</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={5}
                                                max={120}
                                                value={dimLength === 0 ? "" : dimLength}
                                                onChange={(e) => handleNumberInput(e, setDimLength)}
                                                className="w-full px-2.5 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">{unitSystem === "metric" ? "cm" : "in"}</span>
                                        </div>
                                    </div>
                                )}

                                {potShape === "rectangle" && (
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-bold text-slate-600 uppercase">Width</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={5}
                                                max={100}
                                                value={dimWidth === 0 ? "" : dimWidth}
                                                onChange={(e) => handleNumberInput(e, setDimWidth)}
                                                className="w-full px-2.5 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-xs font-semibold text-slate-500">{unitSystem === "metric" ? "cm" : "in"}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-600 uppercase">Pot Height / Depth</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min={5}
                                            max={120}
                                            value={dimHeight === 0 ? "" : dimHeight}
                                            onChange={(e) => handleNumberInput(e, setDimHeight)}
                                            className="w-full px-2.5 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-xs font-semibold text-slate-500">{unitSystem === "metric" ? "cm" : "in"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Soil Volume: {volumeCalculations.volumeLiters.toFixed(1)} L ({volumeCalculations.volumeGallons.toFixed(2)} gal)
                        </span>
                        <span>Multi-Variable Transpiration Model</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Schedule & Volume Output Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Droplets className="w-5 h-5 text-indigo-600" />
                                Custom Hydration Target
                            </h2>
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-200">
                                {selectedPlantName}
                            </span>
                        </div>

                        {/* Highlight Hero Output Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Calculated Frequency Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4 text-indigo-600" /> Watering Cadence
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        {season.toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    Every {intervalCalculations.calculatedInterval}
                                    <span className="text-lg font-bold text-slate-600 ml-1">Days</span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Base interval modified by {intervalCalculations.totalMultiplier}x
                                </p>
                            </div>

                            {/* Water Volume per Session Card */}
                            <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <span className="flex items-center gap-1">
                                        <Waves className="w-4 h-4 text-indigo-600" /> Target Dose
                                    </span>
                                    <span className="text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-bold">
                                        ~25% Soil Vol
                                    </span>
                                </div>
                                <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                    {unitSystem === "metric" ? (
                                        <>
                                            {intervalCalculations.targetWaterMl}
                                            <span className="text-lg font-bold text-slate-600 ml-1">mL</span>
                                        </>
                                    ) : (
                                        <>
                                            {intervalCalculations.targetWaterFlOz}
                                            <span className="text-lg font-bold text-slate-600 ml-1">fl oz</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs font-semibold text-slate-500">
                                    Approx. {intervalCalculations.targetWaterCups} Measuring Cups
                                </p>
                            </div>
                        </div>

                        {/* Projected Calendar Schedule */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    Upcoming Recommended Hydration Days
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                {intervalCalculations.nextDates.map((dateStr, idx) => (
                                    <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Session #{idx + 1}</span>
                                        <span className="text-xs font-extrabold text-indigo-950">{dateStr}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pot Volume & Substrate Analytics */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Pot Volume</span>
                                <span className="text-sm sm:text-base font-black text-slate-900">
                                    {unitSystem === "metric"
                                        ? `${volumeCalculations.volumeLiters.toFixed(2)} L`
                                        : `${volumeCalculations.volumeGallons.toFixed(2)} gal`}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Dry Soil Weight</span>
                                <span className="text-sm sm:text-base font-black text-slate-800">
                                    ~{unitSystem === "metric"
                                        ? `${volumeCalculations.soilWeightDryKg.toFixed(1)} kg`
                                        : `${(volumeCalculations.soilWeightDryKg * 2.20462).toFixed(1)} lbs`}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center space-y-1">
                                <span className="text-[11px] font-bold text-slate-500 block uppercase">Drainage Risk</span>
                                <span className={`text-sm sm:text-base font-black ${hasDrainageHole ? "text-emerald-600" : "text-rose-600"}`}>
                                    {hasDrainageHole ? "Optimal" : "High (Rot Risk)"}
                                </span>
                            </div>
                        </div>

                        {/* Botanical Care Directives */}
                        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                                <Lightbulb className="w-4 h-4 text-amber-400" />
                                Master Plant Care Protocols
                            </div>
                            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                                <li><strong>The Finger Moisture Test:</strong> Never water solely on time; insert a finger 2 inches into soil. If damp, delay by 2 days.</li>
                                <li><strong>Always Discard Runoff:</strong> Never allow the pot base to sit in stagnant drained saucer water for over 30 minutes.</li>
                                <li><strong>Room Temperature Water:</strong> Cold tap water shocks tropical root systems and triggers rapid root-hair dieback.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Watering Plan Copied!" : "Copy Plant Watering Plan"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Botanical Species Directory Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sprout className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Botanical Species & Hydration Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this botanical reference table to explore baseline watering intervals, target root-zone moisture criteria, and lighting preferences across major houseplant varieties.
                    </p>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search species (e.g., Monstera, Fern, Succulent, Pothos)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {["all", "tropical", "succulent", "foliage", "fern", "herb", "tree"].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${selectedCategory === cat
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {cat === "all" ? "All Varieties" : cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Species Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Plant Species</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Base Interval</th>
                                    <th className="p-3">Moisture Target</th>
                                    <th className="p-3">Light Level</th>
                                    <th className="p-3">Care Directives</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                {filteredPresets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-xs text-slate-400">
                                            No plant species matched your search query.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPresets.map((item) => (
                                        <tr key={item.name} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-900">{item.name}</td>
                                            <td className="p-3 capitalize">
                                                <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-indigo-700 font-mono">~{item.baseDays} days</td>
                                            <td className="p-3 text-xs text-slate-600">{item.moistureTarget}</td>
                                            <td className="p-3 text-xs text-slate-600">{item.lightPreference}</td>
                                            <td className="p-3 text-xs text-slate-500">{item.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Scientific Principles of Transpiration & Pot Porosity */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Soil Physics, Transpiration Thermodynamics & Evapotranspiration
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Plant water uptake is governed by the soil-plant-atmosphere continuum (SPAC). Water flows along a decreasing water potential gradient ($\psi$) driven by stomatal evaporation in the foliage and capillary tension in the substrate:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> Vapor Pressure Deficit (VPD)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Transpiration rate is directly determined by the difference between internal leaf vapor pressure and the saturation vapor pressure of ambient room air. High room temperatures combined with dry indoor heating create steep VPD gradients that accelerate water consumption.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> Root-Zone Aeration & Hypoxia
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Plant roots require continuous gas exchange to support cellular respiration. When potting mixes remain waterlogged beyond field capacity, pore spaces become anaerobic. Without oxygen, roots undergo cell lysis, inviting opportunist pathogens like *Pythium* and *Phytophthora* (Root Rot).
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Mathematical Formulas for Pot Geometry Volume
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Accurate hydration dosing requires calculating exact container volume. Our engine applies exact volumetric integrals:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Cylinder Flowerpot Volume:</span>
                                <strong className="text-indigo-300 text-sm">V = π × r² × h</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Tapered Round Pot (Frustum):</span>
                                <strong className="text-indigo-300 text-sm">V = (1/3) × π × h × (r₁² + r₂² + r₁r₂)</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 3: Material Porosity & Pot Selection Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Container Materials & Sidewall Porosity Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The physical material of your flowerpot dictates how much moisture escapes through the container walls versus evaporating purely from the top soil crust:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Container Material</th>
                                    <th className="p-3">Porosity Rating</th>
                                    <th className="p-3">Evaporation Profile</th>
                                    <th className="p-3">Ideal Plant Families</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Unglazed Terracotta</td>
                                    <td className="p-3 font-bold text-amber-600">Very High (Breathable)</td>
                                    <td className="p-3 font-mono text-xs">Rapid sidewall wicking; dries 35% faster</td>
                                    <td className="p-3 text-xs">Cacti, Succulents, Sansevieria, Hoyas</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Fabric Grow Bags</td>
                                    <td className="p-3 font-bold text-amber-600">Maximum (Air Pruning)</td>
                                    <td className="p-3 font-mono text-xs">Maximum oxygen diffusion; dries 30% faster</td>
                                    <td className="p-3 text-xs">Herbs, Vegetables, Fast-growing Ficus</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Plastic Nursery Pots</td>
                                    <td className="p-3 font-bold text-indigo-600">Zero (Impervious)</td>
                                    <td className="p-3 font-mono text-xs">Retains moisture; evaporation via topsoil only</td>
                                    <td className="p-3 text-xs">Calatheas, Ferns, Philodendrons, Pothos</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Glazed Ceramic Pots</td>
                                    <td className="p-3 font-bold text-indigo-600">Near Zero (Vitrified)</td>
                                    <td className="p-3 font-mono text-xs">Retains moisture; heavy thermal insulation</td>
                                    <td className="p-3 text-xs">Monsteras, Peace Lilies, Palms</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cast Concrete / Cement</td>
                                    <td className="p-3 font-bold text-emerald-600">Moderate</td>
                                    <td className="p-3 font-mono text-xs">Slow moisture absorption; slightly alkaline</td>
                                    <td className="p-3 text-xs">Large Indoor Trees, Snake Plants, ZZ Plants</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Practical Step-by-Step Calibration Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Hydration Calibration Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        See how multi-variable environmental modifiers adjust baseline watering frequencies in practical domestic plant keeping scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Summer Window Monstera</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">High Transpiration</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Base Rate:</strong> 7 days in standard 20cm container.</li>
                                <li><strong>Conditions:</strong> Summer season (0.8x), Bright direct window light (0.75x), Terracotta pot (0.70x).</li>
                                <li><strong>Formula Multiplier:</strong> 0.8 × 0.75 × 0.70 = <strong>0.42x</strong>.</li>
                                <li><strong>Adjusted Frequency:</strong> 7 days × 0.42 = <strong>Every 3 Days</strong>.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: High evaporative loss demands watering every 3 days.
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Winter Dark-Corner Snake Plant</span>
                                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">Dormant Conservation</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Base Rate:</strong> 16 days in glazed decorative container.</li>
                                <li><strong>Conditions:</strong> Winter season (1.65x), Low light (1.70x), Glazed ceramic (1.10x).</li>
                                <li><strong>Formula Multiplier:</strong> 1.65 × 1.70 × 1.10 = <strong>3.08x</strong>.</li>
                                <li><strong>Adjusted Frequency:</strong> 16 days × 3.08 = <strong>Every 49 Days (~7 Weeks)</strong>.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Outcome: Dormancy + zero wall porosity prevents root rot via ~7-week cadence.
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
                                Why is watering on a fixed calendar schedule dangerous for houseplants?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Fixed calendar watering ignores dynamic environmental factors such as seasonal day-length shifts, ambient humidity, temperature changes, and pot material porosity. During winter dormancy or cloudy spells, transpiration slows by 50% or more; continuing summer watering routines suffocates roots in oxygen-deprived soggy soil, causing fungal root rot.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does pot material (terracotta vs plastic) alter watering frequency?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Terracotta and unglazed ceramics are highly porous, wicking moisture out through the sidewalls and increasing root-zone aeration. Plants in terracotta dry out 30% to 50% faster than those in non-porous plastic, glazed ceramic, or metal containers, which trap moisture until absorbed by the plant or evaporated from the top soil surface.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How much water should I pour per watering session?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For pots with functional drainage holes, deliver approximately 20% to 30% of the total soil volume in water until roughly 10% to 20% drains freely into the saucer. Empty the drip tray after 15 to 30 minutes to prevent bottom-up saturation. For pots without drainage holes, restrict water volume to 10% of pot volume to prevent anaerobic standing water.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I measure tapered round pots to calculate soil volume accurately?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Most standard round flowerpots are conical frustums (wider at the top rim than at the base). To calculate exact volume, measure top diameter (d1), bottom diameter (d2), and vertical height (h), then apply the frustum formula: V = (1/3) * π * h * ((d1/2)^2 + (d2/2)^2 + (d1/2)*(d2/2)).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between top-watering and bottom-watering?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Top-watering flushes accumulated mineral fertilizer salts down through the soil profile and rehydrates hydrophobic topsoil. Bottom-watering (placing the pot in a water tray for 20-30 minutes) relies on capillary action to saturate the root ball from below, keeping surface soil dry to deter fungus gnats.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the telltale symptoms of overwatering versus underwatering?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Underwatered plants show crispy, papery brown leaf tips, wilted limp stems, and dry, pulling soil edges. Overwatered plants exhibit yellowing lower leaves (chlorosis), soft mushy brown stems, black leaf patches, and persistently damp, sour-smelling soil despite drooping foliage.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}