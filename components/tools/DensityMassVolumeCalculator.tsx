"use client";

import React, { useState, useMemo } from "react";
import {
    Scale,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Layers,
    ShieldAlert,
    Activity,
    Sliders,
    TrendingUp,
    Zap,
    Cpu,
    Box,
    Database,
    Droplets,
    Anchor,
    Gauge,
    Flame
} from "lucide-react";

type SolveTarget = "DENSITY" | "MASS" | "VOLUME";
type DensityUnit = "kg/m3" | "g/cm3" | "g/mL" | "kg/L" | "lb/ft3" | "lb/in3" | "lb/gal_us";
type MassUnit = "kg" | "g" | "mg" | "t_metric" | "lb" | "oz" | "ton_us";
type VolumeUnit = "m3" | "cm3" | "L" | "mL" | "ft3" | "in3" | "gal_us" | "floz_us";

interface PresetMaterial {
    name: string;
    category: "Solid Elements & Metals" | "Liquids & Solutions" | "Gases (STP)" | "Common Materials & Woods";
    densityKgM3: number;
    specificGravity: number;
    state: "Solid" | "Liquid" | "Gas";
    tempC: number;
}

const PRESET_MATERIALS: PresetMaterial[] = [
    // Metals & Solids
    { name: "Gold (24K)", category: "Solid Elements & Metals", densityKgM3: 19320, specificGravity: 19.32, state: "Solid", tempC: 20 },
    { name: "Platinum", category: "Solid Elements & Metals", densityKgM3: 21450, specificGravity: 21.45, state: "Solid", tempC: 20 },
    { name: "Lead", category: "Solid Elements & Metals", densityKgM3: 11340, specificGravity: 11.34, state: "Solid", tempC: 20 },
    { name: "Silver", category: "Solid Elements & Metals", densityKgM3: 10490, specificGravity: 10.49, state: "Solid", tempC: 20 },
    { name: "Copper", category: "Solid Elements & Metals", densityKgM3: 8960, specificGravity: 8.96, state: "Solid", tempC: 20 },
    { name: "Brass (Yellow)", category: "Solid Elements & Metals", densityKgM3: 8470, specificGravity: 8.47, state: "Solid", tempC: 20 },
    { name: "Steel (Carbon/Mild)", category: "Solid Elements & Metals", densityKgM3: 7850, specificGravity: 7.85, state: "Solid", tempC: 20 },
    { name: "Stainless Steel (304)", category: "Solid Elements & Metals", densityKgM3: 8000, specificGravity: 8.00, state: "Solid", tempC: 20 },
    { name: "Cast Iron", category: "Solid Elements & Metals", densityKgM3: 7200, specificGravity: 7.20, state: "Solid", tempC: 20 },
    { name: "Titanium (Grade 5)", category: "Solid Elements & Metals", densityKgM3: 4430, specificGravity: 4.43, state: "Solid", tempC: 20 },
    { name: "Aluminum (6061-T6)", category: "Solid Elements & Metals", densityKgM3: 2700, specificGravity: 2.70, state: "Solid", tempC: 20 },
    { name: "Magnesium", category: "Solid Elements & Metals", densityKgM3: 1738, specificGravity: 1.738, state: "Solid", tempC: 20 },
    { name: "Tungsten", category: "Solid Elements & Metals", densityKgM3: 19250, specificGravity: 19.25, state: "Solid", tempC: 20 },
    { name: "Diamond", category: "Solid Elements & Metals", densityKgM3: 3515, specificGravity: 3.515, state: "Solid", tempC: 20 },

    // Liquids
    { name: "Water (Pure @ 4°C)", category: "Liquids & Solutions", densityKgM3: 1000, specificGravity: 1.00, state: "Liquid", tempC: 4 },
    { name: "Water (Pure @ 20°C)", category: "Liquids & Solutions", densityKgM3: 998.2, specificGravity: 0.9982, state: "Liquid", tempC: 20 },
    { name: "Sea Water (3.5% Salinity)", category: "Liquids & Solutions", densityKgM3: 1025, specificGravity: 1.025, state: "Liquid", tempC: 15 },
    { name: "Mercury", category: "Liquids & Solutions", densityKgM3: 13546, specificGravity: 13.546, state: "Liquid", tempC: 20 },
    { name: "Ethanol (Ethyl Alcohol)", category: "Liquids & Solutions", densityKgM3: 789, specificGravity: 0.789, state: "Liquid", tempC: 20 },
    { name: "Methanol", category: "Liquids & Solutions", densityKgM3: 792, specificGravity: 0.792, state: "Liquid", tempC: 20 },
    { name: "Acetone", category: "Liquids & Solutions", densityKgM3: 784, specificGravity: 0.784, state: "Liquid", tempC: 20 },
    { name: "Glycerol (Glycerin)", category: "Liquids & Solutions", densityKgM3: 1261, specificGravity: 1.261, state: "Liquid", tempC: 20 },
    { name: "Gasoline (Octane 87)", category: "Liquids & Solutions", densityKgM3: 740, specificGravity: 0.74, state: "Liquid", tempC: 15 },
    { name: "Diesel Fuel", category: "Liquids & Solutions", densityKgM3: 832, specificGravity: 0.832, state: "Liquid", tempC: 15 },
    { name: "Engine Oil (SAE 30)", category: "Liquids & Solutions", densityKgM3: 880, specificGravity: 0.88, state: "Liquid", tempC: 20 },
    { name: "Olive Oil", category: "Liquids & Solutions", densityKgM3: 918, specificGravity: 0.918, state: "Liquid", tempC: 20 },
    { name: "Honey", category: "Liquids & Solutions", densityKgM3: 1420, specificGravity: 1.42, state: "Liquid", tempC: 20 },
    { name: "Milk (Whole 3.5%)", category: "Liquids & Solutions", densityKgM3: 1030, specificGravity: 1.03, state: "Liquid", tempC: 20 },
    { name: "Blood (Human Whole)", category: "Liquids & Solutions", densityKgM3: 1060, specificGravity: 1.06, state: "Liquid", tempC: 37 },

    // Gases (STP: 0°C, 1 atm)
    { name: "Air (Dry @ STP 0°C)", category: "Gases (STP)", densityKgM3: 1.293, specificGravity: 0.001293, state: "Gas", tempC: 0 },
    { name: "Air (Dry @ 20°C, 1 atm)", category: "Gases (STP)", densityKgM3: 1.204, specificGravity: 0.001204, state: "Gas", tempC: 20 },
    { name: "Helium", category: "Gases (STP)", densityKgM3: 0.1786, specificGravity: 0.0001786, state: "Gas", tempC: 0 },
    { name: "Hydrogen", category: "Gases (STP)", densityKgM3: 0.08988, specificGravity: 0.00008988, state: "Gas", tempC: 0 },
    { name: "Oxygen", category: "Gases (STP)", densityKgM3: 1.429, specificGravity: 0.001429, state: "Gas", tempC: 0 },
    { name: "Nitrogen", category: "Gases (STP)", densityKgM3: 1.2506, specificGravity: 0.0012506, state: "Gas", tempC: 0 },
    { name: "Carbon Dioxide (CO2)", category: "Gases (STP)", densityKgM3: 1.977, specificGravity: 0.001977, state: "Gas", tempC: 0 },
    { name: "Natural Gas (Methane)", category: "Gases (STP)", densityKgM3: 0.717, specificGravity: 0.000717, state: "Gas", tempC: 0 },
    { name: "Propane (Gas)", category: "Gases (STP)", densityKgM3: 2.01, specificGravity: 0.00201, state: "Gas", tempC: 0 },
    { name: "Argon", category: "Gases (STP)", densityKgM3: 1.784, specificGravity: 0.001784, state: "Gas", tempC: 0 },

    // Common Materials & Woods
    { name: "Concrete (Reinforced)", category: "Common Materials & Woods", densityKgM3: 2400, specificGravity: 2.40, state: "Solid", tempC: 20 },
    { name: "Granite", category: "Common Materials & Woods", densityKgM3: 2690, specificGravity: 2.69, state: "Solid", tempC: 20 },
    { name: "Glass (Common Silica)", category: "Common Materials & Woods", densityKgM3: 2500, specificGravity: 2.50, state: "Solid", tempC: 20 },
    { name: "Ice (@ 0°C)", category: "Common Materials & Woods", densityKgM3: 917, specificGravity: 0.917, state: "Solid", tempC: 0 },
    { name: "Oak Wood (Dry)", category: "Common Materials & Woods", densityKgM3: 750, specificGravity: 0.75, state: "Solid", tempC: 20 },
    { name: "Pine Wood (Dry)", category: "Common Materials & Woods", densityKgM3: 500, specificGravity: 0.50, state: "Solid", tempC: 20 },
    { name: "Balsa Wood", category: "Common Materials & Woods", densityKgM3: 130, specificGravity: 0.13, state: "Solid", tempC: 20 },
    { name: "Cork", category: "Common Materials & Woods", densityKgM3: 240, specificGravity: 0.24, state: "Solid", tempC: 20 },
    { name: "Expanded Polystyrene (Styrofoam)", category: "Common Materials & Woods", densityKgM3: 30, specificGravity: 0.03, state: "Solid", tempC: 20 },
    { name: "Rubber (Hard Vulcanized)", category: "Common Materials & Woods", densityKgM3: 1150, specificGravity: 1.15, state: "Solid", tempC: 20 },
    { name: "Brick (Common Red)", category: "Common Materials & Woods", densityKgM3: 1920, specificGravity: 1.92, state: "Solid", tempC: 20 },
    { name: "Soil (Compacted Clay)", category: "Common Materials & Woods", densityKgM3: 1750, specificGravity: 1.75, state: "Solid", tempC: 20 }
];

// Conversion Constants relative to Base SI (kg, m3, kg/m3)
const DENSITY_TO_SI: Record<DensityUnit, number> = {
    "kg/m3": 1,
    "g/cm3": 1000,
    "g/mL": 1000,
    "kg/L": 1000,
    "lb/ft3": 16.018463,
    "lb/in3": 27679.904,
    "lb/gal_us": 119.826427
};

const MASS_TO_SI: Record<MassUnit, number> = {
    "kg": 1,
    "g": 0.001,
    "mg": 0.000001,
    "t_metric": 1000,
    "lb": 0.45359237,
    "oz": 0.028349523125,
    "ton_us": 907.18474
};

const VOLUME_TO_SI: Record<VolumeUnit, number> = {
    "m3": 1,
    "cm3": 0.000001,
    "L": 0.001,
    "mL": 0.000001,
    "ft3": 0.028316846592,
    "in3": 0.000016387064,
    "gal_us": 0.003785411784,
    "floz_us": 0.0000295735295625
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

export default function DensityMassVolumeCalculator() {
    const [solveTarget, setSolveTarget] = useState<SolveTarget>("DENSITY");
    const [precision, setPrecision] = useState<number>(4);

    // Inputs
    const [densityVal, setDensityVal] = useState<number>(7850);
    const [densityUnit, setDensityUnit] = useState<DensityUnit>("kg/m3");

    const [massVal, setMassVal] = useState<number>(1570);
    const [massUnit, setMassUnit] = useState<MassUnit>("kg");

    const [volumeVal, setVolumeVal] = useState<number>(0.2);
    const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>("m3");

    // Reference Material Picker State
    const [selectedPreset, setSelectedPreset] = useState<string>("Steel (Carbon/Mild)");

    const [copied, setCopied] = useState<boolean>(false);

    // Synchronize Preset Picker Selection
    const handlePresetChange = (matName: string) => {
        setSelectedPreset(matName);
        const found = PRESET_MATERIALS.find((m) => m.name === matName);
        if (!found) return;

        // Convert base SI density (kg/m3) into the active density unit
        const inActiveUnit = found.densityKgM3 / DENSITY_TO_SI[densityUnit];
        setDensityVal(parseFloat(inActiveUnit.toFixed(precision + 2)));

        // If solving mass or volume, recalculate dynamically
        if (solveTarget === "MASS") {
            const volSi = volumeVal * VOLUME_TO_SI[volumeUnit];
            const newMassSi = found.densityKgM3 * volSi;
            setMassVal(parseFloat((newMassSi / MASS_TO_SI[massUnit]).toFixed(precision + 2)));
        } else if (solveTarget === "VOLUME") {
            const massSi = massVal * MASS_TO_SI[massUnit];
            const newVolSi = massSi / found.densityKgM3;
            setVolumeVal(parseFloat((newVolSi / VOLUME_TO_SI[volumeUnit]).toFixed(precision + 2)));
        }
    };

    // Computation Solver
    const calculation = useMemo(() => {
        try {
            let rhoSi = 0; // kg/m3
            let mSi = 0;   // kg
            let vSi = 0;   // m3

            if (solveTarget === "DENSITY") {
                mSi = massVal * MASS_TO_SI[massUnit];
                vSi = volumeVal * VOLUME_TO_SI[volumeUnit];

                if (mSi <= 0 || vSi <= 0) {
                    return { valid: false, error: "Mass and Volume must be positive non-zero values." };
                }
                rhoSi = mSi / vSi;
            } else if (solveTarget === "MASS") {
                rhoSi = densityVal * DENSITY_TO_SI[densityUnit];
                vSi = volumeVal * VOLUME_TO_SI[volumeUnit];

                if (rhoSi <= 0 || vSi <= 0) {
                    return { valid: false, error: "Density and Volume must be positive non-zero values." };
                }
                mSi = rhoSi * vSi;
            } else if (solveTarget === "VOLUME") {
                rhoSi = densityVal * DENSITY_TO_SI[densityUnit];
                mSi = massVal * MASS_TO_SI[massUnit];

                if (rhoSi <= 0 || mSi <= 0) {
                    return { valid: false, error: "Density and Mass must be positive non-zero values." };
                }
                vSi = mSi / rhoSi;
            }

            if (!isFinite(rhoSi) || !isFinite(mSi) || !isFinite(vSi) || rhoSi <= 0 || mSi <= 0 || vSi <= 0) {
                return { valid: false, error: "Calculation resulted in an undefined or out-of-bounds physical quantity." };
            }

            // Secondary Derived Physical Properties
            const specificGravityWater4C = rhoSi / 1000;
            const specificGravityAir0C = rhoSi / 1.293;
            const specificWeightKnM3 = (rhoSi * 9.80665) / 1000; // kN/m³ (Standard Earth Gravity)
            const specificVolumeM3Kg = 1 / rhoSi; // m³/kg

            // Buoyancy in Pure Water @ 20°C (ρ ≈ 998.2 kg/m³)
            const waterDensity20C = 998.2;
            const buoyantForceN = waterDensity20C * vSi * 9.80665;
            const objectWeightN = mSi * 9.80665;
            const netSubmergedForceN = objectWeightN - buoyantForceN; // > 0 sinks, < 0 floats
            const floatsInWater = rhoSi < waterDensity20C;
            const submergedFractionPercent = floatsInWater ? Math.min(100, (rhoSi / waterDensity20C) * 100) : 100;

            // Unit Conversions for Outputs
            const densityAllUnits = {
                "kg/m3": rhoSi,
                "g/cm3": rhoSi / DENSITY_TO_SI["g/cm3"],
                "g/mL": rhoSi / DENSITY_TO_SI["g/mL"],
                "kg/L": rhoSi / DENSITY_TO_SI["kg/L"],
                "lb/ft3": rhoSi / DENSITY_TO_SI["lb/ft3"],
                "lb/in3": rhoSi / DENSITY_TO_SI["lb/in3"],
                "lb/gal_us": rhoSi / DENSITY_TO_SI["lb/gal_us"]
            };

            const massAllUnits = {
                "kg": mSi,
                "g": mSi / MASS_TO_SI["g"],
                "mg": mSi / MASS_TO_SI["mg"],
                "t_metric": mSi / MASS_TO_SI["t_metric"],
                "lb": mSi / MASS_TO_SI["lb"],
                "oz": mSi / MASS_TO_SI["oz"],
                "ton_us": mSi / MASS_TO_SI["ton_us"]
            };

            const volumeAllUnits = {
                "m3": vSi,
                "cm3": vSi / VOLUME_TO_SI["cm3"],
                "L": vSi / VOLUME_TO_SI["L"],
                "mL": vSi / VOLUME_TO_SI["mL"],
                "ft3": vSi / VOLUME_TO_SI["ft3"],
                "in3": vSi / VOLUME_TO_SI["in3"],
                "gal_us": vSi / VOLUME_TO_SI["gal_us"],
                "floz_us": vSi / VOLUME_TO_SI["floz_us"]
            };

            return {
                valid: true,
                rhoSi,
                mSi,
                vSi,
                specificGravityWater4C,
                specificGravityAir0C,
                specificWeightKnM3,
                specificVolumeM3Kg,
                buoyantForceN,
                objectWeightN,
                netSubmergedForceN,
                floatsInWater,
                submergedFractionPercent,
                densityAllUnits,
                massAllUnits,
                volumeAllUnits
            };
        } catch {
            return { valid: false, error: "Mathematical domain or floating point error during calculation." };
        }
    }, [solveTarget, densityVal, densityUnit, massVal, massUnit, volumeVal, volumeUnit]);

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        if (Math.abs(num) >= 1e7 || (Math.abs(num) < 1e-4 && num !== 0)) {
            return num.toExponential(precision);
        }
        return Number(num.toFixed(precision)).toString();
    };

    const handleReset = () => {
        setSolveTarget("DENSITY");
        setPrecision(4);
        setDensityUnit("kg/m3");
        setMassUnit("kg");
        setVolumeUnit("m3");
        setDensityVal(7850);
        setMassVal(1570);
        setVolumeVal(0.2);
        setSelectedPreset("Steel (Carbon/Mild)");
    };

    const handleCopyResults = () => {
        if (!calculation.valid || !calculation.rhoSi) return;
        const text = `Density, Mass & Volume Physical State Analysis (twistertools.com)
----------------------------------------
Primary Solved Quantities (SI Base Units):
  Density (ρ) = ${formatNum(calculation.rhoSi)} kg/m³ (${formatNum(calculation.densityAllUnits?.["g/cm3"])} g/cm³)
  Mass (m)    = ${formatNum(calculation.mSi)} kg (${formatNum(calculation.massAllUnits?.["lb"])} lb)
  Volume (V)  = ${formatNum(calculation.vSi)} m³ (${formatNum(calculation.volumeAllUnits?.["L"])} L)
Hydrostatic & Physical Metrics:
  Specific Gravity (vs Water @ 4°C) = ${formatNum(calculation.specificGravityWater4C)}
  Specific Weight (γ @ 9.807 m/s²)   = ${formatNum(calculation.specificWeightKnM3)} kN/m³
  Specific Volume (v)               = ${formatNum(calculation.specificVolumeM3Kg)} m³/kg
  Water Buoyancy State              = ${calculation.floatsInWater ? "Floats in Pure Water" : "Sinks in Pure Water"}
  Submerged Equilibrium Volume      = ${formatNum(calculation.submergedFractionPercent)}%
----------------------------------------
Generated via TwisterTools Physical State Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Density, Mass & Volume Physical State Calculator",
        "url": "https://twistertools.com/tools/math-tools/density-mass-volume-calculator",
        "description": "Scientific density, mass, and volume calculator with interactive material preset lookup, specific gravity calculation, unit conversions, and hydrostatic buoyancy modeling.",
        "applicationCategory": "EducationalApplication",
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
                "name": "What is the fundamental mathematical relationship between density, mass, and volume?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Density (ρ) is the measure of mass (m) contained per unit volume (V), expressed by the equation ρ = m / V. Rearranging this relationship allows calculating mass as m = ρ · V, or volume as V = m / ρ."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between density and specific gravity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Density is an absolute physical dimension with units (e.g., kg/m³ or g/cm³). Specific gravity (relative density) is a dimensionless ratio comparing the density of a substance to a reference substance—typically pure water at 4°C (1000 kg/m³) for solids and liquids, or dry air at STP for gases."
                }
            },
            {
                "@type": "Question",
                "name": "How does temperature affect material density?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As temperature increases, thermal kinetic energy causes atomic lattices and molecular structures to expand (thermal expansion). Because mass remains constant while volume increases, density almost universally decreases with increasing temperature, with water between 0°C and 4°C being a notable density anomaly."
                }
            },
            {
                "@type": "Question",
                "name": "How does Archimedes' principle predict whether an object floats or sinks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Archimedes' principle states that an object immersed in a fluid experiences an upward buoyant force equal to the weight of fluid it displaces. If the average density of the object is less than the fluid density (Specific Gravity < 1.0 in water), the object floats in static equilibrium with a submerged fraction equal to ρ_object / ρ_fluid."
                }
            },
            {
                "@type": "Question",
                "name": "Why is 1 g/cm³ equal to 1000 kg/m³?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Converting 1 gram to kilograms divides by 1000 (10⁻³ kg), while converting 1 cubic centimeter (cm³) to cubic meters divides by 1,000,000 (10⁻⁶ m³). Dividing 10⁻³ kg by 10⁻⁶ m³ yields 10³ = 1000 kg/m³."
                }
            },
            {
                "@type": "Question",
                "name": "What is specific weight and how does it relate to density?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Specific weight (γ) is the weight per unit volume of a substance, calculated as γ = ρ · g, where g is local gravitational acceleration (approximately 9.80665 m/s² on Earth). While density represents intrinsic mass concentration, specific weight represents gravitational force concentration."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Mode, Presets & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Solver Target & Physical Inputs
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Target Selection Pills */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Choose Variable to Solve For
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "DENSITY", label: "Solve Density (ρ)", formula: "ρ = m / V" },
                                    { id: "MASS", label: "Solve Mass (m)", formula: "m = ρ · V" },
                                    { id: "VOLUME", label: "Solve Volume (V)", formula: "V = m / ρ" }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSolveTarget(tab.id as SolveTarget)}
                                        className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${solveTarget === tab.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="font-extrabold text-xs">{tab.label}</span>
                                        <span className={`text-[10px] mt-0.5 font-mono ${solveTarget === tab.id ? "text-indigo-100" : "text-slate-400"}`}>
                                            {tab.formula}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Material Preset Library Selector */}
                        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                                    Load Verified Material Density Preset
                                </label>
                                <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                                    40+ Standard Elements
                                </span>
                            </div>
                            <select
                                value={selectedPreset}
                                onChange={(e) => handlePresetChange(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <optgroup label="Solid Elements & Structural Metals">
                                    {PRESET_MATERIALS.filter((m) => m.category === "Solid Elements & Metals").map((m) => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} ({m.densityKgM3} kg/m³ | SG: {m.specificGravity})
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Liquids & Solutions">
                                    {PRESET_MATERIALS.filter((m) => m.category === "Liquids & Solutions").map((m) => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} ({m.densityKgM3} kg/m³ | SG: {m.specificGravity})
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Gases & Vapors (STP)">
                                    {PRESET_MATERIALS.filter((m) => m.category === "Gases (STP)").map((m) => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} ({m.densityKgM3} kg/m³)
                                        </option>
                                    ))}
                                </optgroup>
                                <optgroup label="Common Engineering Materials & Woods">
                                    {PRESET_MATERIALS.filter((m) => m.category === "Common Materials & Woods").map((m) => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} ({m.densityKgM3} kg/m³ | SG: {m.specificGravity})
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Parameter Input Fields */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">

                            {/* Density Field */}
                            {solveTarget !== "DENSITY" ? (
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Substance Density (ρ)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={densityVal === 0 ? "" : densityVal}
                                                onChange={(e) => handleNumberInput(e, setDensityVal)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="e.g. 7850"
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={densityUnit}
                                                onChange={(e) => setDensityUnit(e.target.value as DensityUnit)}
                                                className="w-full px-2 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                            >
                                                <option value="kg/m3">kg/m³</option>
                                                <option value="g/cm3">g/cm³</option>
                                                <option value="g/mL">g/mL</option>
                                                <option value="kg/L">kg/L</option>
                                                <option value="lb/ft3">lb/ft³</option>
                                                <option value="lb/in3">lb/in³</option>
                                                <option value="lb/gal_us">lb/gal (US)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Mass Field */}
                            {solveTarget !== "MASS" ? (
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Total Mass (m)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={massVal === 0 ? "" : massVal}
                                                onChange={(e) => handleNumberInput(e, setMassVal)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="e.g. 1570"
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={massUnit}
                                                onChange={(e) => setMassUnit(e.target.value as MassUnit)}
                                                className="w-full px-2 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                            >
                                                <option value="kg">kg</option>
                                                <option value="g">grams (g)</option>
                                                <option value="mg">mg</option>
                                                <option value="t_metric">tonnes (t)</option>
                                                <option value="lb">pounds (lb)</option>
                                                <option value="oz">ounces (oz)</option>
                                                <option value="ton_us">tons (US)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {/* Volume Field */}
                            {solveTarget !== "VOLUME" ? (
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Displaced / Enclosed Volume (V)
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={volumeVal === 0 ? "" : volumeVal}
                                                onChange={(e) => handleNumberInput(e, setVolumeVal)}
                                                className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="e.g. 0.2"
                                            />
                                        </div>
                                        <div>
                                            <select
                                                value={volumeUnit}
                                                onChange={(e) => setVolumeUnit(e.target.value as VolumeUnit)}
                                                className="w-full px-2 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                            >
                                                <option value="m3">m³</option>
                                                <option value="cm3">cm³ (cc)</option>
                                                <option value="L">liters (L)</option>
                                                <option value="mL">milliliters (mL)</option>
                                                <option value="ft3">cubic feet (ft³)</option>
                                                <option value="in3">cubic inches (in³)</option>
                                                <option value="gal_us">gallons (US)</option>
                                                <option value="floz_us">fl oz (US)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Display Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[2, 4, 6, 8].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Solver Status Alert */}
                        {!calculation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Computation Error</p>
                                    <p>{calculation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Physical State Balanced & Consistent
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    SI Compliant (NIST)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Reference Water: 1000 kg/m³ @ 4°C
                        </span>
                        <span>Gravity: g = 9.80665 m/s²</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Output Analytics & Hydrostatic Visualization */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Solved Properties & Hydrostatic State
                            </h2>
                            {calculation.valid && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${calculation.floatsInWater
                                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}>
                                    {calculation.floatsInWater ? "Buoyant (Floats in Water)" : "Dense (Sinks in Water)"}
                                </span>
                            )}
                        </div>

                        {/* Primary Highlight Metrics */}
                        {calculation.valid && calculation.rhoSi ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className={`p-4 rounded-2xl border space-y-1 ${solveTarget === "DENSITY"
                                        ? "border-indigo-300 bg-indigo-50/80 shadow-xs"
                                        : "border-slate-200 bg-slate-50"
                                        }`}>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                                            Density (ρ)
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {formatNum(calculation.rhoSi)}
                                        </div>
                                        <p className="text-[10px] font-semibold text-indigo-600">kg/m³ (SI Base)</p>
                                    </div>

                                    <div className={`p-4 rounded-2xl border space-y-1 ${solveTarget === "MASS"
                                        ? "border-indigo-300 bg-indigo-50/80 shadow-xs"
                                        : "border-slate-200 bg-slate-50"
                                        }`}>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                                            Total Mass (m)
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {formatNum(calculation.mSi)}
                                        </div>
                                        <p className="text-[10px] font-semibold text-indigo-600">kg ({formatNum(calculation.massAllUnits?.["lb"])} lb)</p>
                                    </div>

                                    <div className={`p-4 rounded-2xl border space-y-1 ${solveTarget === "VOLUME"
                                        ? "border-indigo-300 bg-indigo-50/80 shadow-xs"
                                        : "border-slate-200 bg-slate-50"
                                        }`}>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                                            Volume (V)
                                        </span>
                                        <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {formatNum(calculation.vSi)}
                                        </div>
                                        <p className="text-[10px] font-semibold text-indigo-600">m³ ({formatNum(calculation.volumeAllUnits?.["L"])} L)</p>
                                    </div>
                                </div>

                                {/* Hydrostatic Buoyancy & Equilibrium Simulation Bar */}
                                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <Anchor className="w-4 h-4 text-cyan-400" />
                                            Archimedes Pure Water Immersion Simulation
                                        </span>
                                        <span className="font-mono text-cyan-300 font-bold">
                                            {formatNum(calculation.submergedFractionPercent)}% Submerged
                                        </span>
                                    </div>

                                    {/* Tank Water Level Representation */}
                                    <div className="w-full h-8 bg-slate-800 rounded-xl overflow-hidden relative border border-slate-700 flex">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-600 to-indigo-500 transition-all duration-300 flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
                                            style={{ width: `${Math.min(100, Math.max(0, calculation.submergedFractionPercent || 0))}%` }}
                                        >
                                            {calculation.submergedFractionPercent && calculation.submergedFractionPercent > 15 ? "Displaced Water Column" : ""}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300 border-t border-slate-800">
                                        <div>Specific Gravity: <strong className="text-white">{formatNum(calculation.specificGravityWater4C)}</strong></div>
                                        <div>Specific Weight: <strong className="text-white">{formatNum(calculation.specificWeightKnM3)} kN/m³</strong></div>
                                        <div>Weight (N): <strong className="text-white">{formatNum(calculation.objectWeightN)} N</strong></div>
                                        <div>Buoyancy (N): <strong className="text-white">{formatNum(calculation.buoyantForceN)} N</strong></div>
                                    </div>
                                </div>

                                {/* Comprehensive Unit Conversion Multi-Matrix */}
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-200">
                                        <span className="flex items-center gap-1.5">
                                            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                                            Multi-Unit Equivalence Matrix
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">Precision: {precision}dp</span>
                                    </div>
                                    <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Density (g/cm³ | g/mL)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.densityAllUnits?.["g/cm3"])}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Density (lb/ft³)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.densityAllUnits?.["lb/ft3"])}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Density (lb/gal US)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.densityAllUnits?.["lb/gal_us"])}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Mass (Ounces oz)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.massAllUnits?.["oz"])}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Volume (Gallons US)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.volumeAllUnits?.["gal_us"])}</span>
                                        </div>
                                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-500 block">Specific Volume (v)</span>
                                            <span className="font-extrabold text-slate-900 font-mono">{formatNum(calculation.specificVolumeM3Kg)} m³/kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-2">
                                <Box className="w-8 h-8 mx-auto text-slate-400" />
                                <p>Enter valid positive mass, density, and volume inputs to generate full physical profiles.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!calculation.valid}
                            onClick={handleCopyResults}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${calculation.valid
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Physical State Report Copied!" : "Copy Full State & Buoyancy Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Formula Reference & Algebraic Triangle */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Density, Mass & Volume Formula System
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In classical continuum mechanics and fluid dynamics, density ($\rho$) is an intensive thermodynamic property that quantifies the spatial concentration of mass ($m$) within a three-dimensional volume ($V$). Because mass is an extensive quantity conserved across closed systems, the relationship between these three variables forms the cornerstone of material science, hydraulic engineering, and quantitative chemistry:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Scale className="w-4 h-4" /> 1. Density Formula ($\rho$)
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-indigo-700 font-bold">
                                {"\\rho = \\frac{m}{V}"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Used when mass and physical volume are measured via laboratory balances and geometric displacements to identify unknown materials or alloy purity.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Box className="w-4 h-4" /> 2. Mass Formula ($m$)
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-indigo-700 font-bold">
                                {"m = \\rho \\cdot V"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Used in structural engineering and logistics to compute the dead load of concrete slabs, steel girders, or cargo freight before manufacturing.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Droplets className="w-4 h-4" /> 3. Volume Formula ($V$)
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-indigo-700 font-bold">
                                {"V = \\frac{m}{\\rho}"}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Used in chemical storage and tank sizing to determine the cubic capacity required to store a specific commercial tonnage of liquid fuel or chemical reactant.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Density of Common Materials Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Database className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Density & Specific Gravity Reference Matrix (STP & 20°C)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Material density varies based on atomic mass packing, crystal lattice structures, temperature, and pressure. The reference table below details verified standard densities across common engineering alloys, fluids, and gases:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Material Name</th>
                                    <th className="p-3">State of Matter</th>
                                    <th className="p-3">Density (kg/m³)</th>
                                    <th className="p-3">Density (g/cm³)</th>
                                    <th className="p-3">Density (lb/ft³)</th>
                                    <th className="p-3">Specific Gravity (SG)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium font-mono text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Platinum</td>
                                    <td className="p-3 font-sans">Solid (Metal)</td>
                                    <td className="p-3 text-indigo-600">21,450</td>
                                    <td className="p-3">21.45</td>
                                    <td className="p-3">1,339.1</td>
                                    <td className="p-3 font-bold text-slate-900">21.45</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Gold (24K Pure)</td>
                                    <td className="p-3 font-sans">Solid (Metal)</td>
                                    <td className="p-3 text-indigo-600">19,320</td>
                                    <td className="p-3">19.32</td>
                                    <td className="p-3">1,206.1</td>
                                    <td className="p-3 font-bold text-slate-900">19.32</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Mercury (@ 20°C)</td>
                                    <td className="p-3 font-sans">Liquid (Metal)</td>
                                    <td className="p-3 text-indigo-600">13,546</td>
                                    <td className="p-3">13.55</td>
                                    <td className="p-3">845.6</td>
                                    <td className="p-3 font-bold text-slate-900">13.55</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Lead</td>
                                    <td className="p-3 font-sans">Solid (Metal)</td>
                                    <td className="p-3 text-indigo-600">11,340</td>
                                    <td className="p-3">11.34</td>
                                    <td className="p-3">707.9</td>
                                    <td className="p-3 font-bold text-slate-900">11.34</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Copper (Pure)</td>
                                    <td className="p-3 font-sans">Solid (Metal)</td>
                                    <td className="p-3 text-indigo-600">8,960</td>
                                    <td className="p-3">8.96</td>
                                    <td className="p-3">559.4</td>
                                    <td className="p-3 font-bold text-slate-900">8.96</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Carbon Steel (Structural)</td>
                                    <td className="p-3 font-sans">Solid (Alloy)</td>
                                    <td className="p-3 text-indigo-600">7,850</td>
                                    <td className="p-3">7.85</td>
                                    <td className="p-3">490.1</td>
                                    <td className="p-3 font-bold text-slate-900">7.85</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Titanium (Grade 5)</td>
                                    <td className="p-3 font-sans">Solid (Alloy)</td>
                                    <td className="p-3 text-indigo-600">4,430</td>
                                    <td className="p-3">4.43</td>
                                    <td className="p-3">276.6</td>
                                    <td className="p-3 font-bold text-slate-900">4.43</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Aluminum (6061-T6)</td>
                                    <td className="p-3 font-sans">Solid (Alloy)</td>
                                    <td className="p-3 text-indigo-600">2,700</td>
                                    <td className="p-3">2.70</td>
                                    <td className="p-3">168.6</td>
                                    <td className="p-3 font-bold text-slate-900">2.70</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Concrete (Reinforced)</td>
                                    <td className="p-3 font-sans">Solid (Composite)</td>
                                    <td className="p-3 text-indigo-600">2,400</td>
                                    <td className="p-3">2.40</td>
                                    <td className="p-3">149.8</td>
                                    <td className="p-3 font-bold text-slate-900">2.40</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Pure Water (@ 4°C)</td>
                                    <td className="p-3 font-sans">Liquid (Reference)</td>
                                    <td className="p-3 text-indigo-600 font-bold">1,000</td>
                                    <td className="p-3 font-bold">1.00</td>
                                    <td className="p-3">62.43</td>
                                    <td className="p-3 font-bold text-emerald-600">1.000 (Base)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Ice (@ 0°C)</td>
                                    <td className="p-3 font-sans">Solid (Water)</td>
                                    <td className="p-3 text-indigo-600">917</td>
                                    <td className="p-3">0.917</td>
                                    <td className="p-3">57.25</td>
                                    <td className="p-3 font-bold text-cyan-600">0.917 (Floats)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Diesel Fuel (@ 15°C)</td>
                                    <td className="p-3 font-sans">Liquid (Hydrocarbon)</td>
                                    <td className="p-3 text-indigo-600">832</td>
                                    <td className="p-3">0.832</td>
                                    <td className="p-3">51.94</td>
                                    <td className="p-3 font-bold text-cyan-600">0.832 (Floats)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Oak Wood (Seasoned)</td>
                                    <td className="p-3 font-sans">Solid (Organic)</td>
                                    <td className="p-3 text-indigo-600">750</td>
                                    <td className="p-3">0.75</td>
                                    <td className="p-3">46.82</td>
                                    <td className="p-3 font-bold text-cyan-600">0.750 (Floats)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold font-sans text-slate-900">Air (Dry @ STP 0°C)</td>
                                    <td className="p-3 font-sans">Gas (Atmosphere)</td>
                                    <td className="p-3 text-indigo-600">1.293</td>
                                    <td className="p-3">0.001293</td>
                                    <td className="p-3">0.0807</td>
                                    <td className="p-3 font-bold text-slate-900">0.001293</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Archimedes' Principle, Buoyancy & Hydrostatic Equilibrium */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Anchor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Archimedes&apos; Principle, Flotation & Specific Gravity
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Archimedes&apos; principle governs the behavior of bodies submerged in fluids. It states that any object, wholly or partially immersed in a static fluid, is buoyed up by a force equal to the weight of the fluid displaced by the body:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-indigo-600" /> 1. Buoyant Force Equation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The magnitude of upward hydrostatic buoyant force (Fb) depends exclusively on fluid density (ρf), the submerged volume (V_submerged), and local gravitational acceleration (g):
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p className="font-bold">{"F_b = \\rho_{\\text{fluid}} \\cdot V_{\\text{submerged}} \\cdot g"}</p>
                                <p className="text-[11px] text-slate-500">{"Where: g \\approx 9.80665 \\text{ m/s}^2"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                If $F_b &gt; F_g$ (weight), the object accelerates upward until reaching surface flotation equilibrium. If $F_b &lt; F_g$, the object sinks to the floor.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Gauge className="w-4 h-4 text-indigo-600" /> 2. Equilibrium Submerged Ratio
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                For a floating body in static equilibrium, upward buoyancy exactly matches downward gravitational weight ($F_b = m g$). This reveals that the submerged volume percentage equals the density ratio:
                            </p>
                            <div className="font-mono text-xs text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p className="font-bold">{"\\frac{V_{\\text{submerged}}}{V_{\\text{total}}} = \\frac{\\rho_{\\text{object}}}{\\rho_{\\text{fluid}}} = \\text{Specific Gravity}"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Example: Glacial ice (ρ = 917 kg/m³) floating in sea water (ρ = 1025 kg/m³) has 917/1025 ≈ 89.5% of its mass hidden beneath the water line.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Unit Conversion Equations & Dimensional Analysis */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Dimensional Analysis & Unit Conversion Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting between Metric SI, CGS, and Imperial/US Customary systems requires strict adherence to dimensional exponents. Below are the exact conversion factors used across industrial quality control:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 font-mono">
                            <span className="font-bold font-sans text-slate-900 text-xs block">1 g/cm³ (CGS Base)</span>
                            <p className="text-indigo-700 font-bold">= 1,000 kg/m³</p>
                            <p className="text-slate-600">= 1.000 g/mL</p>
                            <p className="text-slate-600">= 62.42796 lb/ft³</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 font-mono">
                            <span className="font-bold font-sans text-slate-900 text-xs block">1 lb/ft³ (Imperial)</span>
                            <p className="text-indigo-700 font-bold">= 16.01846 kg/m³</p>
                            <p className="text-slate-600">= 0.016018 g/cm³</p>
                            <p className="text-slate-600">= 0.13368 lb/gal (US)</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 font-mono">
                            <span className="font-bold font-sans text-slate-900 text-xs block">1 lb/in³ (Aerospace)</span>
                            <p className="text-indigo-700 font-bold">= 27,679.9 kg/m³</p>
                            <p className="text-slate-600">= 27.6799 g/cm³</p>
                            <p className="text-slate-600">= 1,728 lb/ft³</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 font-mono">
                            <span className="font-bold font-sans text-slate-900 text-xs block">1 lb/gal (US Liquid)</span>
                            <p className="text-indigo-700 font-bold">= 119.826 kg/m³</p>
                            <p className="text-slate-600">= 0.11983 g/cm³</p>
                            <p className="text-slate-600">= 7.4805 lb/ft³</p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Real-World Industry Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Industrial & Real-World Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Explore these step-by-step engineering case studies demonstrating forward and reverse density, mass, and volume computations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Structural Steel I-Beam Dead Load</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Mass Solver</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Cross-Sectional Area & Length:</strong></li>
                                <li className="text-indigo-700 pl-3">{"A = 0.015 \\text{ m}^2, \\quad L = 12.0 \\text{ m}"}</li>
                                <li><strong>2. Compute Total Geometric Volume:</strong></li>
                                <li className="text-indigo-700 pl-3">{"V = A \\cdot L = 0.015 \\times 12.0 = 0.180 \\text{ m}^3"}</li>
                                <li><strong>3. Retrieve Structural Steel Density:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\rho = 7,850 \\text{ kg/m}^3"}</li>
                                <li><strong>4. Compute Total Static Mass:</strong></li>
                                <li className="text-indigo-700 pl-3">{"m = \\rho \\cdot V = 7,850 \\times 0.180 = 1,413.00 \\text{ kg}"}</li>
                                <li><strong>5. Convert to Imperial Crane Tonnage:</strong></li>
                                <li className="text-indigo-700 pl-3">{"m_{\\text{lb}} = 1,413.00 \\times 2.20462 = 3,115.13 \\text{ lb} \\approx 1.558 \\text{ US tons}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Verification: Crane rigging capacity must exceed 1.56 tons with a 2.5 safety factor.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Precious Metal Alloy Verification</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Density Solver</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Measure Ingot Mass on Digital Balance:</strong></li>
                                <li className="text-indigo-700 pl-3">{"m = 386.40 \\text{ grams}"}</li>
                                <li><strong>2. Measure Submerged Water Displacement Volume:</strong></li>
                                <li className="text-indigo-700 pl-3">{"V = 25.00 \\text{ mL} = 25.00 \\text{ cm}^3"}</li>
                                <li><strong>3. Calculate Ingot Density:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\rho = \\frac{m}{V} = \\frac{386.40}{25.00} = 15.456 \\text{ g/cm}^3"}</li>
                                <li><strong>4. Compare Against 24K Gold Reference (19.32 g/cm³):</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\Delta\\rho = 19.32 - 15.456 = 3.864 \\text{ g/cm}^3 \\text{ deficit}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-rose-700 font-bold font-sans">
                                    • Conclusion: Ingot is NOT 24K pure gold; matches 14K gold alloy density (15.5 g/cm³).
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 6: Frequently Asked Questions (FAQ) */}
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
                                What is the fundamental mathematical relationship between density, mass, and volume?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Density ($\rho$) is the quantity of mass ($m$) contained within a given unit volume ($V$), expressed algebraically as $\rho = m / V$. Rearranging this fundamental formula allows you to solve for mass as $m = \rho \cdot V$, or solve for required volume as $V = m / \rho$.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between density and specific gravity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Density is an absolute physical dimension with associated units (such as kg/m³ or g/cm³). Specific gravity (also termed relative density) is a dimensionless ratio comparing the density of a substance to a standard reference fluid—typically pure water at 4°C (1000 kg/m³) for liquids/solids, or dry air at STP (1.293 kg/m³) for gases.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does temperature affect material density?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                As temperature rises, molecular thermal kinetic energy increases, causing volumetric thermal expansion. Because total mass is conserved, expanding volume causes density to decrease. Water exhibits a rare anomalous expansion between 0°C and 4°C, reaching its maximum liquid density at exactly 3.98°C (1000 kg/m³).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Archimedes&apos; principle predict whether an object floats or sinks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Archimedes&apos; principle dictates that any object submerged in a fluid experiences an upward buoyant force equal to the weight of fluid displaced. If an object&apos;s overall density is less than the fluid&apos;s density (Specific Gravity &lt; 1.0 in pure water), the object will float in static equilibrium with a submerged volume fraction exactly equal to {"\\rho_{\\text{object}} / \\rho_{\\text{fluid}}."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is 1 g/cm³ equal to 1000 kg/m³?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Converting 1 gram to kilograms divides by 1,000 (10⁻³ kg), while converting 1 cubic centimeter (cm³) to cubic meters divides by 1,000,000 (10⁻⁶ m³). Dividing 10⁻³ kg by 10⁻⁶ m³ yields 10³ = 1,000 kg/m³.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is specific weight and how does it relate to density?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Specific weight (γ) represents the gravitational force exerted per unit volume of a material, calculated as γ = ρ · g, where g is standard gravitational acceleration (9.80665 m/s²). While density measures mass concentration independently of gravity, specific weight measures actual weight force per cubic meter (expressed in kN/m³ or lbf/ft³).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}