"use client";

import React, { useState, useMemo } from "react";
import {
    Droplets,
    Thermometer,
    Wind,
    Gauge,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Compass,
    Layers,
    ShieldAlert,
    Activity,
    Sliders,
    TrendingUp,
    Zap,
    Cpu,
    Scale,
    Flame,
    CloudRain,
    Sun,
    CheckCircle2
} from "lucide-react";

type UnitSystem = "METRIC" | "IMPERIAL";
type FormulaMethod = "MAGNUS_TETENS" | "ARDEN_BUCK";
type SolveMode = "DEW_POINT" | "RELATIVE_HUMIDITY" | "VAPOR_PRESSURE";

interface PsychrometricMetrics {
    dryBulbTempC: number;
    dryBulbTempF: number;
    dryBulbTempK: number;
    relativeHumidity: number;
    dewPointC: number;
    dewPointF: number;
    dewPointK: number;
    actualVaporPressureHPa: number;
    actualVaporPressureKPa: number;
    actualVaporPressurePsi: number;
    satVaporPressureHPa: number;
    satVaporPressureKPa: number;
    vaporPressureDeficitHPa: number;
    vaporPressureDeficitKPa: number;
    absoluteHumidityGM3: number;
    absoluteHumidityGrFt3: number;
    mixingRatioGKg: number;
    specificEnthalpyKjKg: number;
    specificEnthalpyBtuLb: number;
    comfortCategory: string;
    comfortDescription: string;
    condensationRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

interface CalculationResult {
    valid: boolean;
    error?: string;
    metrics?: PsychrometricMetrics;
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

export default function DewPointCalculator() {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("METRIC");
    const [solveMode, setSolveMode] = useState<SolveMode>("DEW_POINT");
    const [formulaMethod, setFormulaMethod] = useState<FormulaMethod>("ARDEN_BUCK");
    const [precision, setPrecision] = useState<number>(2);

    // Primary State Inputs
    const [airTempInput, setAirTempInput] = useState<number>(25); // 25°C or 77°F
    const [rhInput, setRhInput] = useState<number>(50); // 50%
    const [dewPointInput, setDewPointInput] = useState<number>(13.87); // 13.87°C
    const [vaporPressureInput, setVaporPressureInput] = useState<number>(15.84); // hPa

    // Atmospheric Pressure Input (Fixed standard sea-level default or custom)
    const [pressureHPa, setPressureHPa] = useState<number>(1013.25);

    const [copied, setCopied] = useState<boolean>(false);

    const handleUnitSystemChange = (system: UnitSystem) => {
        if (unitSystem === system) return;
        setUnitSystem(system);
        if (system === "IMPERIAL") {
            setAirTempInput(parseFloat((airTempInput * 1.8 + 32).toFixed(1)));
            setDewPointInput(parseFloat((dewPointInput * 1.8 + 32).toFixed(1)));
            setVaporPressureInput(parseFloat((vaporPressureInput * 0.0145038).toFixed(3)));
        } else {
            setAirTempInput(parseFloat(((airTempInput - 32) / 1.8).toFixed(1)));
            setDewPointInput(parseFloat(((dewPointInput - 32) / 1.8).toFixed(1)));
            setVaporPressureInput(parseFloat((vaporPressureInput / 0.0145038).toFixed(2)));
        }
    };

    // Psychrometric Equilibrium Calculation Engine
    const computation: CalculationResult = useMemo(() => {
        try {
            // Normalize Dry Bulb Temperature to Celsius
            let tempC = unitSystem === "METRIC" ? airTempInput : (airTempInput - 32) * (5 / 9);

            if (tempC < -80 || tempC > 100) {
                return {
                    valid: false,
                    error: "Air temperature must be between -80°C (-112°F) and 100°C (212°F) for valid thermodynamic equilibrium calculations."
                };
            }

            // Coefficients setup based on method
            // Arden Buck (1981/1996) vs Magnus-Tetens
            const calcSatVaporPressure = (t: number): number => {
                if (formulaMethod === "ARDEN_BUCK") {
                    if (t >= 0) {
                        return 6.1121 * Math.exp(((18.678 - t / 234.5) * t) / (257.14 + t));
                    } else {
                        return 6.1115 * Math.exp(((23.036 - t / 333.7) * t) / (279.82 + t));
                    }
                } else {
                    // Magnus-Tetens standard constants (Sonntag 1990)
                    const a = t >= 0 ? 17.27 : 21.875;
                    const b = t >= 0 ? 237.7 : 265.5;
                    return 6.1078 * Math.exp((a * t) / (b + t));
                }
            };

            const calcDewPointFromVaporPressure = (vp: number): number => {
                if (vp <= 0) return -80;
                if (formulaMethod === "ARDEN_BUCK") {
                    // Inversion for positive temperature regime
                    const d = Math.log(vp / 6.1121);
                    return (257.14 * d) / (18.678 - d);
                } else {
                    const a = 17.27;
                    const b = 237.7;
                    const alpha = Math.log(vp / 6.1078);
                    return (b * alpha) / (a - alpha);
                }
            };

            const satVp = calcSatVaporPressure(tempC); // in hPa

            let actualVp = 0;
            let rh = 0;
            let dpC = 0;

            if (solveMode === "DEW_POINT") {
                if (rhInput <= 0 || rhInput > 100) {
                    return { valid: false, error: "Relative Humidity must be between 0.1% and 100%." };
                }
                rh = rhInput;
                actualVp = (rh / 100) * satVp;
                dpC = calcDewPointFromVaporPressure(actualVp);
            } else if (solveMode === "RELATIVE_HUMIDITY") {
                let targetDpC = unitSystem === "METRIC" ? dewPointInput : (dewPointInput - 32) * (5 / 9);
                if (targetDpC > tempC + 0.05) {
                    return {
                        valid: false,
                        error: "Dew point temperature cannot exceed ambient dry-bulb temperature in standard atmospheric conditions."
                    };
                }
                dpC = targetDpC;
                actualVp = calcSatVaporPressure(dpC);
                rh = Math.min(100, Math.max(0.1, (actualVp / satVp) * 100));
            } else if (solveMode === "VAPOR_PRESSURE") {
                let vp = unitSystem === "METRIC" ? vaporPressureInput : vaporPressureInput * 68.9476; // convert psi to hPa
                if (vp <= 0 || vp > satVp * 1.5) {
                    return {
                        valid: false,
                        error: `Actual vapor pressure must be greater than 0 and less than saturation limit (~${satVp.toFixed(2)} hPa).`
                    };
                }
                actualVp = vp;
                rh = Math.min(100, (actualVp / satVp) * 100);
                dpC = calcDewPointFromVaporPressure(actualVp);
            }

            const tempF = (tempC * 9) / 5 + 32;
            const tempK = tempC + 273.15;
            const dpF = (dpC * 9) / 5 + 32;
            const dpK = dpC + 273.15;

            // Absolute Humidity (g/m3) = 216.7 * (Actual Vapor Pressure in hPa) / (T in Kelvin)
            const absHumidityGM3 = (216.7 * actualVp) / tempK;
            const absHumidityGrFt3 = absHumidityGM3 * 0.436996; // grains/ft³

            // Vapor Pressure Deficit (VPD) in hPa and kPa
            const vpdHPa = Math.max(0, satVp - actualVp);
            const vpdKPa = vpdHPa / 10;

            // Mixing ratio w (g water / kg dry air) = 621.9907 * actualVp / (P - actualVp)
            const safeP = Math.max(pressureHPa, actualVp + 10);
            const mixingRatio = (621.9907 * actualVp) / (safeP - actualVp);

            // Specific Enthalpy h = 1.006*T + w*(2501 + 1.86*T) in kJ/kg (w in kg/kg)
            const wKg = mixingRatio / 1000;
            const enthalpyKjKg = 1.006 * tempC + wKg * (2501 + 1.86 * tempC);
            const enthalpyBtuLb = enthalpyKjKg * 0.429923;

            // Comfort & Sensory Perception index based on Dew Point
            let comfortCat = "";
            let comfortDesc = "";
            let condensationRisk: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";

            if (dpC < 10) {
                comfortCat = "Dry / Crisp";
                comfortDesc = "A bit dry for some; ideal for high exertion and endurance activities.";
                condensationRisk = "LOW";
            } else if (dpC >= 10 && dpC < 13) {
                comfortCat = "Comfortable / Optimal";
                comfortDesc = "Optimal indoor and outdoor comfort. Refreshing and pleasant.";
                condensationRisk = "LOW";
            } else if (dpC >= 13 && dpC < 16) {
                comfortCat = "Pleasant / Mild";
                comfortDesc = "Comfortable conditions for most individuals with subtle moisture in the air.";
                condensationRisk = "LOW";
            } else if (dpC >= 16 && dpC < 18) {
                comfortCat = "Noticeably Humid";
                comfortDesc = "Noticeable stickiness; sweat evaporation slows during intense exertion.";
                condensationRisk = "MODERATE";
            } else if (dpC >= 18 && dpC < 21) {
                comfortCat = "Humid / Sticky";
                comfortDesc = "Muggy and oppressive; increased indoor mold risk and reduced thermal cooling.";
                condensationRisk = "HIGH";
            } else if (dpC >= 21 && dpC < 24) {
                comfortCat = "Very Uncomfortable";
                comfortDesc = "Oppressive moisture; severe heat stress potential during physical activity.";
                condensationRisk = "HIGH";
            } else {
                comfortCat = "Severely Oppressive / Dangerous";
                comfortDesc = "Tropical moisture overload; severe heat exhaustion and condensation hazard.";
                condensationRisk = "CRITICAL";
            }

            return {
                valid: true,
                metrics: {
                    dryBulbTempC: tempC,
                    dryBulbTempF: tempF,
                    dryBulbTempK: tempK,
                    relativeHumidity: rh,
                    dewPointC: dpC,
                    dewPointF: dpF,
                    dewPointK: dpK,
                    actualVaporPressureHPa: actualVp,
                    actualVaporPressureKPa: actualVp / 10,
                    actualVaporPressurePsi: actualVp * 0.0145038,
                    satVaporPressureHPa: satVp,
                    satVaporPressureKPa: satVp / 10,
                    vaporPressureDeficitHPa: vpdHPa,
                    vaporPressureDeficitKPa: vpdKPa,
                    absoluteHumidityGM3: absHumidityGM3,
                    absoluteHumidityGrFt3: absHumidityGrFt3,
                    mixingRatioGKg: mixingRatio,
                    specificEnthalpyKjKg: enthalpyKjKg,
                    specificEnthalpyBtuLb: enthalpyBtuLb,
                    comfortCategory: comfortCat,
                    comfortDescription: comfortDesc,
                    condensationRisk
                }
            };
        } catch {
            return {
                valid: false,
                error: "Psychrometric calculation exception occurred. Please verify your numerical inputs."
            };
        }
    }, [unitSystem, solveMode, formulaMethod, airTempInput, rhInput, dewPointInput, vaporPressureInput, pressureHPa]);

    const m = computation.metrics;

    const handleReset = () => {
        setUnitSystem("METRIC");
        setSolveMode("DEW_POINT");
        setFormulaMethod("ARDEN_BUCK");
        setPrecision(2);
        setAirTempInput(25);
        setRhInput(50);
        setDewPointInput(13.87);
        setVaporPressureInput(15.84);
        setPressureHPa(1013.25);
    };

    const handleCopyReport = () => {
        if (!m) return;
        const p = precision;
        const text = `Psychrometric Equilibrium & Dew Point Analysis (twistertools.com)
--------------------------------------------------
Thermodynamic Parameters:
  Ambient Air Temperature : ${m.dryBulbTempC.toFixed(p)} °C / ${m.dryBulbTempF.toFixed(p)} °F
  Relative Humidity (RH)  : ${m.relativeHumidity.toFixed(p)} %
  Equilibrium Dew Point   : ${m.dewPointC.toFixed(p)} °C / ${m.dewPointF.toFixed(p)} °F
Vapor Pressure Metrics:
  Actual Vapor Pressure   : ${m.actualVaporPressureHPa.toFixed(p)} hPa (${m.actualVaporPressureKPa.toFixed(p)} kPa)
  Saturation Vapor Press. : ${m.satVaporPressureHPa.toFixed(p)} hPa (${m.satVaporPressureKPa.toFixed(p)} kPa)
  Vapor Pressure Deficit  : ${m.vaporPressureDeficitKPa.toFixed(p)} kPa
Air Mass Properties:
  Absolute Humidity       : ${m.absoluteHumidityGM3.toFixed(p)} g/m³
  Humidity Mixing Ratio   : ${m.mixingRatioGKg.toFixed(p)} g/kg dry air
  Specific Air Enthalpy   : ${m.specificEnthalpyKjKg.toFixed(p)} kJ/kg
Environmental Status:
  Perceived Comfort Level : ${m.comfortCategory}
  Condensation Danger     : ${m.condensationRisk}
--------------------------------------------------
Generated via TwisterTools Dew Point & Psychrometric Equilibrium Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatVal = (val: number | undefined, customPrec?: number) => {
        if (val === undefined || isNaN(val)) return "0";
        return val.toFixed(customPrec !== undefined ? customPrec : precision);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Dew Point & Relative Humidity Equilibrium Calculator",
        "url": "https://twistertools.com/tools/math-tools/dew-point-calculator",
        "description": "Enterprise-grade thermodynamic psychrometric calculator computing dew point temperature, relative humidity equilibrium, vapor pressure deficit (VPD), absolute humidity, enthalpy, and surface condensation thresholds.",
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
                "name": "What is the dew point and why is it a superior measure of humidity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The dew point is the temperature to which air must be cooled at constant barometric pressure for water vapor to condense into liquid dew. Unlike relative humidity, which changes drastically as air heats or cools throughout the day, the dew point is an absolute measure of atmospheric moisture content and directly reflects how humid the air actually feels."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Arden Buck formula differ from the Magnus-Tetens equation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Magnus-Tetens formula is an empirical approximation that performs well near standard room temperatures. The Arden Buck equation (1981, modified 1996) is the modern meteorological and HVAC industry standard, incorporating higher-order polynomial terms to provide significantly higher accuracy across broad temperature spans from -80°C up to +100°C."
                }
            },
            {
                "@type": "Question",
                "name": "What is Vapor Pressure Deficit (VPD) and why is it critical for HVAC and botany?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Vapor Pressure Deficit (VPD) is the difference between the saturation vapor pressure at air temperature and the actual vapor pressure of the air. In horticultural greenhouses, VPD governs plant transpiration rates and nutrient uptake. In HVAC building science, VPD dictates the rate of structural drying, mold cultivation risk, and moisture migration through building envelopes."
                }
            },
            {
                "@type": "Question",
                "name": "How is surface condensation predicted using dew point calculations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Condensation occurs immediately when any solid surface (e.g., window panes, cold pipework, crawlspace foundations, or refrigerated chillers) drops below the surrounding air's dew point temperature. If surface temperature is less than or equal to the dew point, 100% relative humidity is reached locally, precipitating liquid moisture."
                }
            },
            {
                "@type": "Question",
                "name": "What dew point ranges correlate with human thermal comfort?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Below 10°C (50°F) feels dry and crisp; 10°C to 15°C (50°F to 59°F) is universally perceived as comfortable and optimal; 16°C to 18°C (61°F to 64°F) begins to feel noticeably sticky; 18°C to 21°C (64°F to 70°F) feels muggy and humid; above 21°C (70°F) feels oppressive with impeded evaporative cooling; and above 24°C (75°F) poses severe heat stress risks."
                }
            },
            {
                "@type": "Question",
                "name": "How does atmospheric barometric pressure affect dew point and psychrometrics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Saturation vapor pressure is an intrinsic property of water molecules and depends purely on temperature. However, the mixing ratio (grams of vapor per kilogram of dry air) and specific enthalpy depend inversely on total barometric pressure. At high altitudes (lower atmospheric pressure), air can hold more water vapor relative to total air mass for a given dew point."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Absolute Humidity and Relative Humidity?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolute humidity is the total physical mass of water vapor present in a fixed volume of air (expressed as grams per cubic meter, g/m³). Relative humidity is the percentage ratio of current vapor pressure relative to the maximum saturation vapor pressure the air could hold at that specific ambient temperature."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Schemas */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input Parameters & Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Unit Switcher Group (Reduced Spacing) */}
                        <div className="space-y-3 mb-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Environmental Parameters & Mode
                                </h2>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSystemChange("METRIC")}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "METRIC" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        Metric (°C)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleUnitSystemChange("IMPERIAL")}
                                        className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "IMPERIAL" ? "bg-white text-indigo-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        Imperial (°F)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Solving Target Mode */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Target Variable to Solve
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "DEW_POINT", label: "Dew Point (Td)", desc: "From Temp & RH" },
                                    { id: "RELATIVE_HUMIDITY", label: "Rel. Humidity (RH)", desc: "From Temp & Td" },
                                    { id: "VAPOR_PRESSURE", label: "Vapor Press. (e)", desc: "From Temp & Pres." }
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setSolveMode(mode.id as SolveMode)}
                                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${solveMode === mode.id
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                            : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="font-extrabold text-xs">{mode.label}</span>
                                        <span className={`text-[10px] truncate max-w-full ${solveMode === mode.id ? "text-indigo-100" : "text-slate-400"}`}>
                                            {mode.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parameter Controls */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">

                            {/* Ambient Dry-Bulb Temperature */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Thermometer className="w-4 h-4 text-indigo-600" />
                                        Dry-Bulb Air Temperature (T)
                                    </label>
                                    <span className="text-xs font-mono font-bold text-indigo-600">
                                        {airTempInput} {unitSystem === "METRIC" ? "°C" : "°F"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={unitSystem === "METRIC" ? -40 : -40}
                                        max={unitSystem === "METRIC" ? 60 : 140}
                                        step="0.5"
                                        value={airTempInput}
                                        onChange={(e) => setAirTempInput(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={airTempInput === 0 ? "" : airTempInput}
                                        onChange={(e) => handleNumberInput(e, setAirTempInput)}
                                        className="w-24 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                    />
                                </div>
                            </div>

                            {/* Mode Specific Second Variable */}
                            {solveMode === "DEW_POINT" && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <CloudRain className="w-4 h-4 text-indigo-600" />
                                            Relative Humidity (RH %)
                                        </label>
                                        <span className="text-xs font-mono font-bold text-indigo-600">
                                            {rhInput} %
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            step="1"
                                            value={rhInput}
                                            onChange={(e) => setRhInput(parseFloat(e.target.value) || 1)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="0.1"
                                            value={rhInput === 0 ? "" : rhInput}
                                            onChange={(e) => handleNumberInput(e, setRhInput)}
                                            className="w-24 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                        />
                                    </div>
                                </div>
                            )}

                            {solveMode === "RELATIVE_HUMIDITY" && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Droplets className="w-4 h-4 text-indigo-600" />
                                            Target Dew Point (Td)
                                        </label>
                                        <span className="text-xs font-mono font-bold text-indigo-600">
                                            {dewPointInput} {unitSystem === "METRIC" ? "°C" : "°F"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min={unitSystem === "METRIC" ? -50 : -58}
                                            max={unitSystem === "METRIC" ? 50 : 122}
                                            step="0.5"
                                            value={dewPointInput}
                                            onChange={(e) => setDewPointInput(parseFloat(e.target.value) || 0)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={dewPointInput === 0 ? "" : dewPointInput}
                                            onChange={(e) => handleNumberInput(e, setDewPointInput)}
                                            className="w-24 px-3 py-1.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                                        />
                                    </div>
                                </div>
                            )}

                            {solveMode === "VAPOR_PRESSURE" && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Gauge className="w-4 h-4 text-indigo-600" />
                                            Actual Vapor Pressure (e)
                                        </label>
                                        <span className="text-xs font-mono font-bold text-indigo-600">
                                            {vaporPressureInput} {unitSystem === "METRIC" ? "hPa" : "psi"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.1"
                                            value={vaporPressureInput === 0 ? "" : vaporPressureInput}
                                            onChange={(e) => handleNumberInput(e, setVaporPressureInput)}
                                            className="w-full px-3 py-2 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="e.g. 15.84"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Barometric Pressure Modifier */}
                            <div className="pt-2 border-t border-slate-200/80">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Wind className="w-3.5 h-3.5 text-indigo-600" />
                                        Barometric Pressure (P)
                                    </label>
                                    <span className="text-xs font-mono font-bold text-slate-600">
                                        {pressureHPa} hPa ({unitSystem === "IMPERIAL" ? (pressureHPa * 0.02953).toFixed(2) + " inHg" : (pressureHPa / 10).toFixed(1) + " kPa"})
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setPressureHPa(1013.25)}
                                        className={`px-2 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${pressureHPa === 1013.25
                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Sea Level (1013.25)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPressureHPa(950.0)}
                                        className={`px-2 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${pressureHPa === 950.0
                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        500m Alt (950.0)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPressureHPa(850.0)}
                                        className={`px-2 py-1.5 rounded-lg border font-semibold transition cursor-pointer ${pressureHPa === 850.0
                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        1500m Alt (850.0)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Formula Method & Precision */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                                    Psychrometric Model:
                                </span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setFormulaMethod("ARDEN_BUCK")}
                                        className={`w-1/2 py-1 text-xs font-bold rounded-md transition cursor-pointer ${formulaMethod === "ARDEN_BUCK"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        Arden Buck (1996)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormulaMethod("MAGNUS_TETENS")}
                                        className={`w-1/2 py-1 text-xs font-bold rounded-md transition cursor-pointer ${formulaMethod === "MAGNUS_TETENS"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        Magnus-Tetens
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                    Decimal Precision:
                                </span>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    {[1, 2, 3, 4].map((dec) => (
                                        <button
                                            key={dec}
                                            type="button"
                                            onClick={() => setPrecision(dec)}
                                            className={`w-1/4 py-1 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec
                                                ? "bg-white text-indigo-600 shadow-xs"
                                                : "text-slate-600"
                                                }`}
                                        >
                                            {dec}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Status Alert */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Thermodynamic Limit Error</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Psychrometric Equilibrium Solved
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    {formulaMethod === "ARDEN_BUCK" ? "Enhanced Arden Buck" : "Sonntag Magnus-Tetens"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Reference P: {pressureHPa} hPa
                        </span>
                        <span>ASHRAE Standard Thermodynamic Equations</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Psychrometric Dashboard */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Psychrometric & Humidity Results
                            </h2>
                            {computation.valid && m && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${m.condensationRisk === "CRITICAL"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : m.condensationRisk === "HIGH"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }`}>
                                    Condensation Risk: {m.condensationRisk}
                                </span>
                            )}
                        </div>

                        {computation.valid && m ? (
                            <div className="space-y-4">
                                {/* Primary Dual Hero KPI Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Equilibrium Dew Point (Td)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {unitSystem === "METRIC"
                                                ? `${formatVal(m.dewPointC)} °C`
                                                : `${formatVal(m.dewPointF)} °F`}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            {unitSystem === "METRIC"
                                                ? `(${formatVal(m.dewPointF)} °F / ${formatVal(m.dewPointK)} K)`
                                                : `(${formatVal(m.dewPointC)} °C / ${formatVal(m.dewPointK)} K)`}
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                                            Relative Humidity (RH)
                                        </span>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatVal(m.relativeHumidity)} %
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            VPD: {formatVal(m.vaporPressureDeficitKPa)} kPa ({formatVal(m.vaporPressureDeficitHPa)} hPa)
                                        </p>
                                    </div>
                                </div>

                                {/* Thermal Comfort & Sensory Meter */}
                                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-amber-500" />
                                            Human Comfort & Humidity Perception:
                                        </span>
                                        <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                                            {m.comfortCategory}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {m.comfortDescription}
                                    </p>

                                    {/* Sensory Dew Point Bar */}
                                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                                        <div className="bg-cyan-400 h-full" style={{ width: "25%" }} title="Crisp (< 10°C)" />
                                        <div className="bg-emerald-400 h-full" style={{ width: "25%" }} title="Optimal (10-15°C)" />
                                        <div className="bg-amber-400 h-full" style={{ width: "25%" }} title="Sticky (16-20°C)" />
                                        <div className="bg-rose-500 h-full" style={{ width: "25%" }} title="Oppressive (> 21°C)" />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                        <span>&lt;10°C Dry</span>
                                        <span>13°C Ideal</span>
                                        <span>18°C Muggy</span>
                                        <span>&gt;21°C Tropical</span>
                                    </div>
                                </div>

                                {/* Detailed Psychrometric Matrix */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center text-xs">
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Actual Vapor Press. (e)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {unitSystem === "METRIC"
                                                ? `${formatVal(m.actualVaporPressureHPa)} hPa`
                                                : `${formatVal(m.actualVaporPressurePsi, 3)} psi`}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Sat. Vapor Press. (es)</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {formatVal(m.satVaporPressureHPa)} hPa
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">VPD (Deficit)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {formatVal(m.vaporPressureDeficitKPa)} kPa
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Absolute Humidity</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {unitSystem === "METRIC"
                                                ? `${formatVal(m.absoluteHumidityGM3)} g/m³`
                                                : `${formatVal(m.absoluteHumidityGrFt3)} gr/ft³`}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Mixing Ratio (w)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {formatVal(m.mixingRatioGKg)} g/kg
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Specific Enthalpy (h)</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {unitSystem === "METRIC"
                                                ? `${formatVal(m.specificEnthalpyKjKg)} kJ/kg`
                                                : `${formatVal(m.specificEnthalpyBtuLb)} Btu/lb`}
                                        </span>
                                    </div>
                                </div>

                                {/* Air Mass Summary Box */}
                                <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2 text-xs">
                                    <div className="font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-between">
                                        <span>Thermodynamic State Vector</span>
                                        <span className="text-[10px] text-slate-400 font-mono">P = {pressureHPa} hPa</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                                        <div>T (Air): <strong className="text-white">{formatVal(m.dryBulbTempC)}°C</strong></div>
                                        <div>Td (Dew): <strong className="text-white">{formatVal(m.dewPointC)}°C</strong></div>
                                        <div>RH: <strong className="text-white">{formatVal(m.relativeHumidity)}%</strong></div>
                                        <div>e: <strong className="text-white">{formatVal(m.actualVaporPressureKPa)} kPa</strong></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 space-y-2">
                                <Droplets className="w-8 h-8 mx-auto text-slate-400" />
                                <p>Provide valid temperature and humidity parameters to view thermodynamic metrics.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!computation.valid}
                            onClick={handleCopyReport}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${computation.valid
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Psychrometric Report Copied!" : "Copy Psychrometric Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Thermodynamic & Psychrometric Equations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Master Thermodynamic Psychrometric Equations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Psychrometrics is the branch of engineering physics studying the thermodynamic properties of moist air. Because water vapor in our atmosphere behaves nearly as an ideal gas under normal barometric pressures, exact mathematical functions govern the relationship between ambient dry-bulb temperature, saturation vapor pressure, relative humidity, and dew point condensation equilibrium:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Psychrometric Property</th>
                                    <th className="p-3">Mathematical Equation</th>
                                    <th className="p-3">Standard Constants & Variables</th>
                                    <th className="p-3">Practical Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Arden Buck Saturation Vapor Pressure ($e_s$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"e_s(T) = 6.1121 \\exp\\left( \\frac{(18.678 - T/234.5)T}{257.14 + T} \\right)"}</td>
                                    <td className="p-3 text-xs">$T$ in °C, $e_s$ in hPa (Over Liquid Water)</td>
                                    <td className="p-3 text-xs">Meteorology, high-precision climate models</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Magnus-Tetens Saturation Pressure ($e_s$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"e_s(T) = 6.1078 \\exp\\left( \\frac{17.27 T}{237.7 + T} \\right)"}</td>
                                    <td className="p-3 text-xs">$a = 17.27, b = 237.7$ (Sonntag standard)</td>
                                    <td className="p-3 text-xs">HVAC controllers, quick IoT sensor firmware</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Relative Humidity ($RH$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"RH = \\left( \\frac{e}{e_s(T)} \\right) \\times 100\\%"}</td>
                                    <td className="p-3 text-xs">{"$e = \\text{actual vapor pressure}, e_s = \\text{sat.pressure}$"}</td>
                                    <td className="p-3 text-xs">Indoor air quality, hygrometer calibration</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Arden Buck Dew Point ($T_d$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"T_d = \\frac{257.14 \\cdot \\gamma(T, RH)}{18.678 - \\gamma(T, RH)}"}</td>
                                    <td className="p-3 text-xs">{"\\gamma = \\ln(RH/100) + \\frac{18.678 T}{257.14 + T}"}</td>
                                    <td className="p-3 text-xs">Industrial dry rooms, surface condensation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Vapor Pressure Deficit ($VPD$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"VPD = e_s(T) - e = e_s(T) \\cdot (1 - RH/100)"}</td>
                                    <td className="p-3 text-xs">Evaluated in kPa or hPa</td>
                                    <td className="p-3 text-xs">Greenhouse botany, crop transpiration control</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Absolute Humidity ($AH$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"AH = \\frac{216.7 \\cdot e}{T + 273.15}"}</td>
                                    <td className="p-3 text-xs">{"$AH$ in $\\text{g / m}^3$, $e$ in hPa, $T$ in °C"}</td>
                                    <td className="p-3 text-xs">Compressed air drying, drying chamber design</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Humidity Mixing Ratio ($w$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"w = 621.9907 \\cdot \\frac{e}{P_{atm} - e}"}</td>
                                    <td className="p-3 text-xs">{"Grams of $H_2O$ per kg of dry air, $P_{atm}$ in hPa"}</td>
                                    <td className="p-3 text-xs">Air handling unit (AHU) cooling coil loads</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Moist Air Enthalpy ($h$)</td>
                                    <td className="p-3 font-mono text-indigo-600 text-xs">{"h = 1.006 T + \\frac{w}{1000}(2501 + 1.86 T)"}</td>
                                    <td className="p-3 text-xs">$h$ in kJ/kg, $T$ in °C, $w$ in g/kg</td>
                                    <td className="p-3 text-xs">Chiller tonnage calculations, heat exchangers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Human Comfort & Sensory Perception Scale */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sun className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Dew Point Sensory Perception & Thermal Comfort Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Why does 80°F (26.7°C) feel pleasantly balmy in an arid desert at 20% RH, but suffocatingly sticky in Florida at 85% RH? The answer is dictated by the dew point temperature, which directly governs the thermodynamic rate of sweat evaporation from human skin:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-cyan-700">Dry / Crisp</span>
                                <span className="font-mono text-xs font-bold text-slate-700">&lt; 10°C (&lt; 50°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extremely rapid evaporative cooling. Air feels dry, crisp, and refreshing. High physical exertion is well-tolerated, though susceptible individuals may experience mild skin dryness or respiratory irritation below 0°C.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-emerald-700">Comfortable / Ideal</span>
                                <span className="font-mono text-xs font-bold text-slate-700">10°C to 15°C (50°F to 59°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Universally perceived as the golden standard for indoor and outdoor human comfort. Skin evaporates perspiration effortlessly without moisture build-up. Standard target range for commercial office HVAC systems.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-amber-700">Noticeably Humid</span>
                                <span className="font-mono text-xs font-bold text-slate-700">16°C to 18°C (60°F to 64°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Subtle moisture stickiness becomes apparent on the skin. Perspiration evaporation starts to slow down during intense aerobic exercise. Sensitive electronics and mold spores begin finding viable microclimates.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-orange-700">Muggy / Sticky</span>
                                <span className="font-mono text-xs font-bold text-slate-700">18°C to 21°C (65°F to 69°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Distinctly uncomfortable and clammy. Clothes cling to skin due to suppressed sweat evaporation. Air conditioning is actively required indoors to prevent humidity accumulation and musty odors.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-rose-700">Very Oppressive</span>
                                <span className="font-mono text-xs font-bold text-slate-700">21°C to 24°C (70°F to 75°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Heavy, tropical, and oppressive atmosphere. Severe heat stress risk during outdoor physical labor. High probability of condensation on cooled indoor building surfaces and basement walls.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-purple-700">Severely Hazardous</span>
                                <span className="font-mono text-xs font-bold text-slate-700">&gt; 24°C (&gt; 75°F)</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extreme tropical saturation. The human body struggles to maintain core thermal equilibrium via perspiration. High risk of heat stroke, hyperthermia, and rapid condensation pooling on uninsulated chilled pipes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Engineering Case Studies & Practical Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Industrial & Scientific Engineering Applications
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Precise dew point calculations are vital across industrial automation, building envelope science, greenhouse agriculture, and compressed gas handling:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-700">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 1. HVAC Building Envelope & Mold Prevention
                            </div>
                            <p className="leading-relaxed">
                                When warm, humid outdoor air infiltrates cooled indoor spaces, condensation instantly forms on any drywall, glass, or cold duct surface whose temperature sits below the dew point {"($T_{surface} \\le T_d$)"}. Maintaining indoor dew points below 13°C (55°F) permanently suppresses black mold (Stachybotrys) germination and drywall rot.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <CloudRain className="w-4 h-4 text-indigo-600" /> 2. Horticultural VPD Optimization
                            </div>
                            <p className="leading-relaxed">
                                In modern greenhouse cultivation, Vapor Pressure Deficit ($VPD$) dictates plant transpiration rates and nutrient transport through xylem vessels. An optimal vegetative VPD of 0.8 to 1.1 kPa prevents fungal powdery mildew (caused by low VPD &lt; 0.4 kPa) and foliar desiccation stress (caused by high VPD &gt; 1.5 kPa).
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
                                <Gauge className="w-4 h-4 text-indigo-600" /> 3. Industrial Compressed Air Drying
                            </div>
                            <p className="leading-relaxed">
                                In pneumatic automation and laser cutting systems, compressed air lines must be dried to pressure dew points between -40°C and -70°C (ISO 8573-1 Class 1/2) using desiccant dryers. This eliminates liquid droplet pooling, pneumatic valve corrosion, and freeze-ups in sub-zero delivery pipes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Worked Step-by-Step Mathematical Problems */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Psychrometric Worked Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review these complete worked numerical examples to understand how psychrometric equations solve real-world engineering challenges:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example 1: Solving Dew Point & VPD (T = 30°C, RH = 65%)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Forward Solver</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Compute Saturation Vapor Pressure ($e_s$):</strong></li>
                                <li className="text-indigo-700 pl-3">{"e_s = 6.1121 \\times \\exp\\left( \\frac{(18.678 - 30/234.5) \\times 30}{257.14 + 30} \\right) = 42.435 \\text{ hPa}"}</li>
                                <li><strong>2. Compute Actual Vapor Pressure ($e$):</strong></li>
                                <li className="text-indigo-700 pl-3">{"e = (65 / 100) \\times 42.435 = 27.583 \\text{ hPa} = 2.758 \\text{ kPa}"}</li>
                                <li><strong>3. Compute Vapor Pressure Deficit (VPD):</strong></li>
                                <li className="text-indigo-700 pl-3">{"VPD = 4.2435 - 2.7583 = 1.485 \\text{ kPa}"}</li>
                                <li><strong>4. Evaluate Arden Buck Inversion Parameter $\\gamma$:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\gamma = \\ln(0.65) + \\frac{18.678 \\times 30}{257.14 + 30} = -0.4308 + 1.9515 = 1.5207"}</li>
                                <li><strong>5. Calculate Dew Point ($T_d$):</strong></li>
                                <li className="text-indigo-700 pl-3">{"T_d = \\frac{257.14 \\times 1.5207}{18.678 - 1.5207} = \\frac{391.033}{17.157} = 22.79 ^\\circ\\text{C} (73.02 ^\\circ\\text{F})"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Diagnosis: {"$T_d = 22.8^\\circ\\text{C}$"} indicates very oppressive tropical moisture with severe condensation hazard on cooled ductwork.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Example 2: Surface Condensation Verification on Cold Pipe</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Chilled Water Pipe</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>Conditions: Room Air = 22°C (71.6°F), RH = 55%, Chilled Water Pipe Surface = 11°C (51.8°F).</strong></li>
                                <li><strong>1. Calculate Saturation Pressure at 22°C:</strong></li>
                                <li className="text-indigo-700 pl-3">{"e_s(22^\\circ\\text{C}) = 6.1121 \\times \\exp\\left( \\frac{18.584 \\times 22}{279.14} \\right) = 26.438 \\text{ hPa}"}</li>
                                <li><strong>2. Calculate Actual Vapor Pressure in Room:</strong></li>
                                <li className="text-indigo-700 pl-3">{"e = 0.55 \\times 26.438 = 14.541 \\text{ hPa}"}</li>
                                <li><strong>3. Solve for Room Dew Point ($T_d$):</strong></li>
                                <li className="text-indigo-700 pl-3">{"T_d = 12.56 ^\\circ\\text{C}"}</li>
                                <li><strong>4. Evaluate Surface Condensation Criterion:</strong></li>
                                <li className="text-rose-700 pl-3">{"T_{pipe} (11.00^\\circ\\text{C}) < T_d (12.56^\\circ\\text{C}) \\implies \\text{CONDENSATION OCCURS}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Corrective Action: Apply closed-cell elastomeric pipe insulation of at least 13 mm thickness to keep outer jacket surface above 12.6°C.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                                What is the dew point and why is it a superior measure of humidity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The dew point is the temperature to which ambient air must be cooled at constant barometric pressure for water vapor to condense into liquid dew. Unlike relative humidity, which fluctuates wildly as air warms or cools during diurnal temperature cycles, the dew point is an absolute measure of physical moisture content and accurately reflects human comfort and condensation risk.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Arden Buck formula differ from the Magnus-Tetens equation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Magnus-Tetens formula is an empirical approximation that performs well near standard room temperatures. The Arden Buck equation (1981, modified 1996) is the modern meteorological standard, incorporating higher-order temperature-dependent polynomial terms to deliver superior accuracy across extreme thermal ranges from -80°C up to +100°C.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Vapor Pressure Deficit (VPD) and why is it critical for HVAC and botany?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Vapor Pressure Deficit (VPD) is the difference between saturation vapor pressure at ambient air temperature and actual vapor pressure ($VPD = e_s - e$). In botanical greenhouses, VPD governs leaf stomatal conductance and water transpiration. In building physics, high VPD accelerates material drying, while low VPD promotes mold spore proliferation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is surface condensation predicted using dew point calculations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Condensation forms instantaneously whenever any solid surface temperature (e.g., window glass, foundation slabs, or chilled water pipework) drops equal to or below the ambient air&apos;s dew point temperature {"($T_{surface} \\le T_d$)"}. At that interface, air reaches 100% relative humidity, precipitating liquid water.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What dew point ranges correlate with human thermal comfort?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Below 10°C (50°F) feels dry and crisp; 10°C to 15°C (50°F to 59°F) is universally perceived as comfortable and optimal; 16°C to 18°C (61°F to 64°F) begins to feel noticeably sticky; 18°C to 21°C (64°F to 70°F) feels muggy; and above 21°C (70°F) feels severely oppressive with inhibited sweat evaporation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does atmospheric barometric pressure affect dew point and psychrometrics?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While saturation vapor pressure is an intrinsic thermal property of water molecules, the humidity mixing ratio (grams of water vapor per kilogram of dry air) and specific enthalpy depend inversely on total barometric pressure. At higher altitudes with lower atmospheric pressure, air can hold greater moisture per unit mass of dry air.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Absolute Humidity and Relative Humidity?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Absolute humidity is the actual physical mass of water vapor present in a unit volume of air (expressed in {"$\\text{g / m}^3$"}). Relative humidity is the percentage ratio of current vapor pressure relative to the maximum saturation pressure the air could hold at that specific ambient temperature.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}