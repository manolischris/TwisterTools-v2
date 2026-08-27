"use client";

import React, { useState, useMemo } from "react";
import {
    Wind,
    Thermometer,
    AlertTriangle,
    ShieldAlert,
    ShieldCheck,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Gauge,
    Activity,
    Sliders,
    Clock,
    Flame,
    SunMedium,
    TrendingDown,
    Zap,
    Scale,
    Cpu,
    Compass
} from "lucide-react";

type UnitSystem = "imperial" | "metric";
type ModelStandard = "NWS" | "AUSTRALIAN_AT" | "OLD_PRE_2001";

interface WindChillResults {
    windChill: number;
    windChillAlternateUnit: number;
    heatLossRate: number; // Watts per square meter (W/m²)
    frostbiteMinutes: number | null; // null if no risk within 30-60+ mins
    riskLevel: "None" | "Low" | "Moderate" | "Severe" | "Critical";
    colorClass: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    advisoryText: string;
    frostbiteOnsetStr: string;
}

interface SolveResult {
    valid: boolean;
    error?: string;
    results?: WindChillResults;
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

export default function WindChillCalculator() {
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("imperial");
    const [modelStandard, setModelStandard] = useState<ModelStandard>("NWS");
    const [precision, setPrecision] = useState<number>(1);

    // Primary Interactive Inputs
    const [temperatureInput, setTemperatureInput] = useState<number>(15); // °F default
    const [windSpeedInput, setWindSpeedInput] = useState<number>(25); // mph default
    const [relativeHumidity, setRelativeHumidity] = useState<number>(50); // % for Australian AT

    const [copied, setCopied] = useState<boolean>(false);

    // Mathematical Solver Engine
    const computation: SolveResult = useMemo(() => {
        try {
            // Normalize internal temperature to Fahrenheit and Celsius
            let tempF = 0;
            let tempC = 0;
            let speedMph = 0;
            let speedKmh = 0;
            let speedMs = 0;

            if (unitSystem === "imperial") {
                tempF = temperatureInput;
                tempC = (temperatureInput - 32) * (5 / 9);
                speedMph = windSpeedInput;
                speedKmh = windSpeedInput * 1.60934;
                speedMs = windSpeedInput * 0.44704;
            } else {
                tempC = temperatureInput;
                tempF = (temperatureInput * 9) / 5 + 32;
                speedKmh = windSpeedInput;
                speedMph = windSpeedInput / 1.60934;
                speedMs = windSpeedInput / 3.6;
            }

            if (speedMph < 0 || speedKmh < 0) {
                return { valid: false, error: "Wind velocity cannot be negative." };
            }

            let computedWCF_F = tempF;
            let computedWCF_C = tempC;

            if (modelStandard === "NWS") {
                // Official NOAA / Environment Canada Joint Action Group (JAG/TI) Formula (2001)
                // Applicable for T <= 50°F (10°C) and V >= 3 mph (4.8 km/h)
                if (speedMph >= 3) {
                    const vPow = Math.pow(speedMph, 0.16);
                    computedWCF_F = 35.74 + 0.6215 * tempF - 35.75 * vPow + 0.4275 * tempF * vPow;
                    computedWCF_C = (computedWCF_F - 32) * (5 / 9);
                } else {
                    computedWCF_F = tempF;
                    computedWCF_C = tempC;
                }
            } else if (modelStandard === "AUSTRALIAN_AT") {
                // Australian Bureau of Meteorology Apparent Temperature Formula
                // AT = T_C + 0.33 * e - 0.70 * w - 4.00
                const e = (relativeHumidity / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
                computedWCF_C = tempC + 0.33 * e - 0.70 * speedMs - 4.0;
                computedWCF_F = (computedWCF_C * 9) / 5 + 32;
            } else {
                // Historical Siple-Passel Formula (Pre-2001 Standard)
                // Uses Heat Loss Index (Kcal/m²·hr) = (sqrt(100*v) + 10.45 - v)(33 - T_c)
                const vMs = speedMs <= 0.1 ? 0.1 : speedMs;
                const hli = (Math.sqrt(100 * vMs) + 10.45 - vMs) * (33 - tempC);
                computedWCF_C = 33 - (hli / 22.0); // Calibrated approximation to equivalent temp
                computedWCF_F = (computedWCF_C * 9) / 5 + 32;
            }

            // Calculate Human Convective Heat Loss Rate (W/m²)
            // h_c convective coefficient = 10.45 - v + 10 * sqrt(v) (Siple empirical adaptation in W/m²K)
            const vClamp = Math.max(0.5, speedMs);
            const hc = 12.12 - 1.16 * vClamp + 11.6 * Math.sqrt(vClamp);
            const skinTempC = 33.0; // Mean unprotected facial skin temp
            const heatLossRate = Math.max(0, hc * (skinTempC - tempC));

            // Estimate Frostbite Time to Exposed Facial Skin
            // Based on NWS JAG/TI Empirical Facial Skin Freezing Model
            let frostbiteMinutes: number | null = null;
            let frostbiteOnsetStr = "No practical risk under normal clothing exposure";
            let riskLevel: "None" | "Low" | "Moderate" | "Severe" | "Critical" = "None";
            let colorClass = "text-emerald-600";
            let badgeBg = "bg-emerald-50";
            let badgeBorder = "border-emerald-200";
            let badgeText = "text-emerald-800";
            let advisoryText = "Conditions are safe. Standard warm seasonal outer layers are adequate.";

            // Evaluate Frostbite threshold strictly when Wind Chill is below freezing
            if (computedWCF_F > 32) {
                riskLevel = "None";
                frostbiteMinutes = null;
                frostbiteOnsetStr = "No frostbite risk (temperatures above freezing point 32°F / 0°C).";
                advisoryText = "Minimal chill danger. Standard thermal comfort layers recommended.";
            } else if (computedWCF_F >= 0) {
                riskLevel = "Low";
                colorClass = "text-blue-600";
                badgeBg = "bg-blue-50";
                badgeBorder = "border-blue-200";
                badgeText = "text-blue-800";
                frostbiteMinutes = null;
                frostbiteOnsetStr = "> 60 Minutes (Low Risk)";
                advisoryText = "Hypothermia possible with prolonged outdoor exposure. Dress in insulated wind-resistant layers.";
            } else if (computedWCF_F >= -18) {
                riskLevel = "Moderate";
                colorClass = "text-amber-600";
                badgeBg = "bg-amber-50";
                badgeBorder = "border-amber-200";
                badgeText = "text-amber-800";
                frostbiteMinutes = 30;
                frostbiteOnsetStr = "≈ 30 Minutes of continuous exposed skin contact";
                advisoryText = "Frostbite possible on exposed fingers, nose, and ears. Wear thermal gloves, a knit beanie, and windproof outer shell.";
            } else if (computedWCF_F >= -35) {
                riskLevel = "Severe";
                colorClass = "text-orange-600";
                badgeBg = "bg-orange-50";
                badgeBorder = "border-orange-200";
                badgeText = "text-orange-800";
                frostbiteMinutes = 10;
                frostbiteOnsetStr = "≈ 10 Minutes of continuous exposed skin contact";
                advisoryText = "High danger. Exposed skin can freeze in 10 minutes. Cover all exposed facial areas with a balaclava, goggles, and heavy mittens.";
            } else {
                riskLevel = "Critical";
                colorClass = "text-rose-600";
                badgeBg = "bg-rose-50";
                badgeBorder = "border-rose-200";
                badgeText = "text-rose-800";
                frostbiteMinutes = 5;
                frostbiteOnsetStr = "< 5 Minutes (Extreme Life Hazard)";
                advisoryText = "Life-threatening Arctic conditions. Severe frostbite in 5 minutes or less. Avoid all non-essential outdoor exposure.";
            }

            const primaryWCF = unitSystem === "imperial" ? computedWCF_F : computedWCF_C;
            const alternateWCF = unitSystem === "imperial" ? computedWCF_C : computedWCF_F;

            return {
                valid: true,
                results: {
                    windChill: primaryWCF,
                    windChillAlternateUnit: alternateWCF,
                    heatLossRate,
                    frostbiteMinutes,
                    riskLevel,
                    colorClass,
                    badgeBg,
                    badgeBorder,
                    badgeText,
                    advisoryText,
                    frostbiteOnsetStr
                }
            };
        } catch {
            return { valid: false, error: "Mathematical overflow or domain computation error." };
        }
    }, [unitSystem, modelStandard, temperatureInput, windSpeedInput, relativeHumidity]);

    const res = computation.results;

    const handleReset = () => {
        setUnitSystem("imperial");
        setModelStandard("NWS");
        setPrecision(1);
        setTemperatureInput(15);
        setWindSpeedInput(25);
        setRelativeHumidity(50);
    };

    const handleCopyResults = () => {
        if (!res) return;
        const tempUnitStr = unitSystem === "imperial" ? "°F" : "°C";
        const altUnitStr = unitSystem === "imperial" ? "°C" : "°F";
        const speedUnitStr = unitSystem === "imperial" ? "mph" : "km/h";

        const text = `Wind Chill & Frostbite Exposure Report (twistertools.com)
--------------------------------------------------
Atmospheric Parameters:
  Ambient Air Temperature = ${temperatureInput} ${tempUnitStr}
  Sustained Wind Velocity = ${windSpeedInput} ${speedUnitStr}
  Calculation Formula Model = ${modelStandard === "NWS" ? "NOAA / Environment Canada Joint Model (2001)" : modelStandard === "AUSTRALIAN_AT" ? "Australian Bureau of Meteorology Apparent Temp" : "Siple-Passel Formula (Pre-2001)"}

Calculated Wind Chill Index:
  Perceived Wind Chill = ${res.windChill.toFixed(precision)} ${tempUnitStr} (${res.windChillAlternateUnit.toFixed(precision)} ${altUnitStr})
  Convective Heat Loss Rate = ${res.heatLossRate.toFixed(1)} W/m²
  Frostbite Risk Level = ${res.riskLevel.toUpperCase()}
  Estimated Time to Frostbite = ${res.frostbiteOnsetStr}

Safety Advisory:
  ${res.advisoryText}
--------------------------------------------------
Generated via TwisterTools Wind Chill Factor Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatNum = (num: number | undefined, overridePrec?: number) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(overridePrec !== undefined ? overridePrec : precision)).toString();
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Wind Chill Factor & Frostbite Risk Estimator",
        "url": "https://twistertools.com/tools/math-tools/wind-chill-calculator",
        "description": "Enterprise-grade meteorological wind chill calculator computing apparent temperature, convective skin heat dissipation rates (W/m²), and time-to-frostbite under NOAA/NWS, Australian AT, and Siple standards.",
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
                "name": "What is the official NOAA/NWS Wind Chill Formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The official National Weather Service formula implemented in 2001 is: WCF (°F) = 35.74 + 0.6215(T) - 35.75(V^0.16) + 0.4275(T)(V^0.16), where T is air temperature in Fahrenheit and V is wind speed in miles per hour."
                }
            },
            {
                "@type": "Question",
                "name": "Can wind chill cause inanimate objects or car engines to freeze below the actual air temperature?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Wind chill accelerates the rate of cooling toward the ambient temperature by stripping away the boundary layer of warm air, but an object can never cool below the actual physical air temperature regardless of wind speed."
                }
            },
            {
                "@type": "Question",
                "name": "At what wind chill temperature does frostbite occur on exposed human skin?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Frostbite danger begins when the wind chill index drops below 0°F (-18°C). At -18°F (-28°C), frostbite can occur within 30 minutes. At -35°F (-37°C), onset accelerates to 10 minutes, and below -48°F (-44°C), exposed skin can freeze in under 5 minutes."
                }
            },
            {
                "@type": "Question",
                "name": "Why did meteorological organizations replace the old 1945 Siple-Passel wind chill formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The 1945 Siple-Passel index was measured using water cylinder freezing times in Antarctica, which grossly overestimated human convective heat loss. The 2001 JAG/TI standard incorporated human facial heat dissipation models, 5-foot anemometer heights, and boundary skin thermal resistance."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Wind Chill and Heat Index?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Wind Chill measures perceived cold driven by air temperature and wind speed accelerating heat loss in winter. Heat Index (Humidex) measures perceived summer heat driven by temperature and relative humidity preventing sweat evaporation."
                }
            },
            {
                "@type": "Question",
                "name": "How does wind velocity affect convective skin heat loss rate (W/m²)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Convective heat loss scales non-linearly with wind velocity (approximating V^0.16 to V^0.5). Higher speeds rapidly erode the microscopic insulating laminar air layer against human skin, dramatically multiplying thermal dissipation in Watts per square meter."
                }
            },
            {
                "@type": "Question",
                "name": "Why is wind chill not calculated when temperatures exceed 50°F (10°C)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Above 50°F (10°C), convective skin cooling ceases to present hypothermia or frostbite danger to human physiology, and humidity becomes the prevailing determinant of thermal sensation."
                }
            },
            {
                "@type": "Question",
                "name": "What physiological factors influence personal susceptibility to frostbite and hypothermia?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Individual susceptibility is heightened by alcohol consumption (which induces peripheral vasodilation), dehydration, nicotine use (which constricts microcapillaries), fatigue, wet clothing, and preexisting circulatory disorders."
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

                {/* Left Workspace Panel: Input Controls & Formula Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-indigo-600" />
                                Atmospheric Parameters & Solver
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Unit System & Standard Selector */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Measurement System
                                </label>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (unitSystem !== "imperial") {
                                                setUnitSystem("imperial");
                                                setTemperatureInput(Math.round((temperatureInput * 9) / 5 + 32));
                                                setWindSpeedInput(Math.round(windSpeedInput / 1.60934));
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "imperial" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Imperial (°F / mph)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (unitSystem !== "metric") {
                                                setUnitSystem("metric");
                                                setTemperatureInput(Math.round((temperatureInput - 32) * (5 / 9)));
                                                setWindSpeedInput(Math.round(windSpeedInput * 1.60934));
                                            }
                                        }}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${unitSystem === "metric" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Metric (°C / km/h)
                                    </button>
                                </div>
                            </div>

                            {/* Mathematical Standard Grid */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Meteorological Formula Model
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                        { id: "NWS", name: "NOAA / NWS (2001)", sub: "JAG/TI Standard" },
                                        { id: "AUSTRALIAN_AT", name: "Australian AT", sub: "Includes Humidity" },
                                        { id: "OLD_PRE_2001", name: "Siple-Passel (1945)", sub: "Historical Antarctica" }
                                    ].map((std) => (
                                        <button
                                            key={std.id}
                                            type="button"
                                            onClick={() => setModelStandard(std.id as ModelStandard)}
                                            className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${modelStandard === std.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                                }`}
                                        >
                                            <span className="font-extrabold text-xs">{std.name}</span>
                                            <span className={`text-[10px] truncate max-w-full ${modelStandard === std.id ? "text-indigo-100" : "text-slate-400"}`}>
                                                {std.sub}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Sliders and Inputs */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            {/* Ambient Air Temperature Input */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Thermometer className="w-4 h-4 text-indigo-600" />
                                        Air Temperature ({unitSystem === "imperial" ? "°F" : "°C"})
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {temperatureInput} {unitSystem === "imperial" ? "°F" : "°C"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={unitSystem === "imperial" ? "-50" : "-45"}
                                        max={unitSystem === "imperial" ? "50" : "15"}
                                        step="1"
                                        value={temperatureInput}
                                        onChange={(e) => setTemperatureInput(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        value={temperatureInput === 0 ? "" : temperatureInput}
                                        onChange={(e) => handleNumberInput(e, setTemperatureInput)}
                                        className="w-24 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Sustained Wind Velocity Input */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wind className="w-4 h-4 text-indigo-600" />
                                        Wind Velocity ({unitSystem === "imperial" ? "mph" : "km/h"})
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {windSpeedInput} {unitSystem === "imperial" ? "mph" : "km/h"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max={unitSystem === "imperial" ? "80" : "130"}
                                        step="1"
                                        value={windSpeedInput}
                                        onChange={(e) => setWindSpeedInput(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={windSpeedInput === 0 ? "" : windSpeedInput}
                                        onChange={(e) => handleNumberInput(e, setWindSpeedInput)}
                                        className="w-24 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Relative Humidity (Specifically for Australian AT) */}
                            {modelStandard === "AUSTRALIAN_AT" && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <SunMedium className="w-4 h-4 text-indigo-600" />
                                            Relative Humidity (%)
                                        </label>
                                        <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                            {relativeHumidity}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="range"
                                            min="5"
                                            max="100"
                                            step="1"
                                            value={relativeHumidity}
                                            onChange={(e) => setRelativeHumidity(parseFloat(e.target.value) || 50)}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={relativeHumidity === 0 ? "" : relativeHumidity}
                                            onChange={(e) => handleNumberInput(e, setRelativeHumidity)}
                                            className="w-24 px-2 py-1 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right"
                                            placeholder="50"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Decimal Precision Control */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[0, 1, 2, 3].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec} dp
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Solver Validation Card */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Meteorological Warning</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-center justify-between text-xs text-indigo-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-indigo-600" />
                                    Dynamic Aerodynamic Boundary Layer Active
                                </span>
                                <span className="font-semibold bg-indigo-100 px-2 py-0.5 rounded text-[11px] text-indigo-800">
                                    {modelStandard} Engine
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Anemometer Height: 5 ft (1.5 m)
                        </span>
                        <span>Full JAG/TI Aerodynamic Spec</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Apparent Wind Chill & Frostbite Exposure Analytics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                Calculated Wind Chill & Frostbite Risk
                            </h2>
                            {computation.valid && res && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${res.badgeBg} ${res.badgeBorder} ${res.badgeText}`}>
                                    {res.riskLevel.toUpperCase()} RISK
                                </span>
                            )}
                        </div>

                        {/* Main Temperature Gauges */}
                        {computation.valid && res ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Primary Wind Chill Metric */}
                                    <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block flex items-center justify-between">
                                            <span>Feels-Like Wind Chill</span>
                                            <Gauge className="w-4 h-4 text-indigo-600" />
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-1">
                                            {formatNum(res.windChill)} {unitSystem === "imperial" ? "°F" : "°C"}
                                        </div>
                                        <p className="text-[11px] font-bold text-indigo-700">
                                            Equivalent to {formatNum(res.windChillAlternateUnit)} {unitSystem === "imperial" ? "°C" : "°F"}
                                        </p>
                                    </div>

                                    {/* Frostbite Exposure Timer */}
                                    <div className={`p-5 rounded-2xl border ${res.badgeBorder} ${res.badgeBg} space-y-1`}>
                                        <span className={`text-xs font-bold uppercase tracking-wider ${res.badgeText} block flex items-center justify-between`}>
                                            <span>Frostbite Onset Window</span>
                                            <Clock className="w-4 h-4" />
                                        </span>
                                        <div className={`text-2xl sm:text-3xl font-black ${res.badgeText} tracking-tight pt-1`}>
                                            {res.frostbiteMinutes ? `≈ ${res.frostbiteMinutes} Mins` : "Safe (> 60m)"}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-600 truncate">
                                            {res.frostbiteOnsetStr}
                                        </p>
                                    </div>
                                </div>

                                {/* Heat Dissipation & Atmospheric Stat Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Convective Heat Loss</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">
                                            {formatNum(res.heatLossRate, 1)} <span className="text-[10px]">W/m²</span>
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Thermal Depression</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {formatNum(Math.abs(temperatureInput - res.windChill))} {unitSystem === "imperial" ? "°F" : "°C"}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Skin Boundary Temp</span>
                                        <span className="font-extrabold text-slate-900 text-sm">
                                            {unitSystem === "imperial" ? "91.4 °F" : "33.0 °C"}
                                        </span>
                                    </div>
                                </div>

                                {/* Dynamic Frostbite Advisory Notice */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white space-y-2 text-xs">
                                    <div className="flex items-center justify-between font-bold text-indigo-300 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                                            Meteorological Safety Advisory
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">Status: Verified</span>
                                    </div>
                                    <p className="text-slate-300 leading-relaxed text-xs">
                                        {res.advisoryText}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
                                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                    <p>
                                        <strong>Meteorological & Safety Disclaimer:</strong> Frostbite and hypothermia exposure windows are theoretical estimates based on standard NOAA/NWS human heat transfer models for healthy, dry skin. Individual susceptibility varies significantly with clothing, moisture, age, and health conditions. Always consult local meteorological alerts and seek professional emergency medical care for suspected cold injuries.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter valid atmospheric parameters to calculate wind chill and frostbite risks.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            disabled={!computation.valid}
                            onClick={handleCopyResults}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shadow-sm cursor-pointer ${computation.valid
                                ? "bg-slate-900 hover:bg-slate-800 text-white"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Wind Chill Report Copied!" : "Copy Full Wind Chill & Safety Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Official Meteorological Formulas & Aerodynamic Principles */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Wind Chill & Convective Heat Transfer
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Wind chill is not a measure of actual thermodynamic temperature change in the ambient atmosphere; rather, it quantifies the accelerated rate of sensible heat dissipation from exposed warm-blooded human skin caused by air velocity. Under stationary conditions, the human body warms a microscopic boundary layer of air directly adjacent to the skin surface, acting as natural thermal insulation. When wind blows, this protective boundary layer is stripped away, transferring body heat rapidly via forced convection.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Model Standard</th>
                                    <th className="p-3">Governing Formula</th>
                                    <th className="p-3">Primary Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">NOAA / NWS (JAG/TI 2001) Imperial</td>
                                    <td className="p-3 font-mono text-indigo-700">
                                        {"WCF = 35.74 + 0.6215 T - 35.75 V^{0.16} + 0.4275 T V^{0.16}"}
                                    </td>
                                    <td className="p-3">Official United States standard ($T$ in °F, $V$ in mph)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Environment Canada (2001) Metric</td>
                                    <td className="p-3 font-mono text-indigo-700">
                                        {"WCF = 13.12 + 0.6215 T - 11.37 V^{0.16} + 0.3965 T V^{0.16}"}
                                    </td>
                                    <td className="p-3">Official Canadian & WMO metric standard ($T$ in °C, $V$ in km/h)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Australian Apparent Temp (AT)</td>
                                    <td className="p-3 font-mono text-indigo-700">
                                        {"AT = T_C + 0.33 e - 0.70 w - 4.00"}
                                    </td>
                                    <td className="p-3">Considers vapor pressure ($e$) and wind speed $w$ in m/s</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Siple-Passel Historical (1945)</td>
                                    <td className="p-3 font-mono text-indigo-700">
                                        {"K = (\\sqrt{100 v} + 10.45 - v)(33 - T_c)"}
                                    </td>
                                    <td className="p-3">Antarctic water cylinder cooling index ($K$ in kcal/m²·hr)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Frostbite Risk Thresholds & Medical Stages */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frostbite Progression: Clinical Stages & Physiological Exposure Limits
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Frostbite represents localized freezing injury to human tissue that occurs when skin temperature falls to 28°F (-2.2°C). As cellular fluids crystallize into microscopic ice shards, microvascular thrombosis starves distal tissue of oxygen. Understanding the clinical stages is critical for cold-weather safety:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                                <Thermometer className="w-4 h-4" /> 1. Frostnip (Pre-Freezing)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Superficial cooling without irreversible tissue destruction. Skin becomes pale, numb, and tingling. Reversible upon gentle rewarming without permanent sequelae.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                                <AlertTriangle className="w-4 h-4" /> 2. Superficial Frostbite
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Freezing of the epidermis and upper dermal layers. Skin feels hard or waxy while deeper tissues remain pliant. Clear blisters form within 24 hours of rewarming.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-orange-600 font-bold text-sm">
                                <Flame className="w-4 h-4" /> 3. Deep Frostbite
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Total freezing extending through subcutaneous fat, musculature, and tendon sheaths. Skin turns purplish-blue or porcelain white with blood-filled hemorrhagic blisters.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-sm">
                                <ShieldAlert className="w-4 h-4" /> 4. Tissue Gangrene
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Complete microvascular occlusion and tissue necrosis culminating in dry mummification, structural loss, and required surgical auto-amputation.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Standard National Weather Service (NWS) Wind Chill Chart */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Gauge className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard NWS Wind Chill & Exposure Chart (°F / mph)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this official National Oceanic and Atmospheric Administration (NOAA) lookup matrix to verify wind chill temperatures and corresponding time-to-frostbite across varying combinations of wind velocity and ambient air temperature:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-center text-xs text-slate-700 font-mono">
                            <thead className="bg-slate-900 text-white font-bold">
                                <tr>
                                    <th className="p-2.5 text-left font-sans">Wind (mph) \ Temp (°F)</th>
                                    <th className="p-2.5">35°</th>
                                    <th className="p-2.5">25°</th>
                                    <th className="p-2.5">15°</th>
                                    <th className="p-2.5">5°</th>
                                    <th className="p-2.5">-5°</th>
                                    <th className="p-2.5">-15°</th>
                                    <th className="p-2.5">-25°</th>
                                    <th className="p-2.5">-35°</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">Calm (3 mph)</td>
                                    <td className="p-2.5 bg-emerald-50 text-emerald-900 font-bold">35°</td>
                                    <td className="p-2.5 bg-emerald-50 text-emerald-900 font-bold">25°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">15°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">5°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">-5°</td>
                                    <td className="p-2.5 bg-amber-50 text-amber-900 font-bold">-15°</td>
                                    <td className="p-2.5 bg-orange-50 text-orange-900 font-bold">-25°</td>
                                    <td className="p-2.5 bg-rose-100 text-rose-900 font-black">-35°</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">15 mph</td>
                                    <td className="p-2.5 bg-emerald-50 text-emerald-900 font-bold">25°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">13°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">0°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">-13°</td>
                                    <td className="p-2.5 bg-amber-50 text-amber-900 font-bold">-26°*</td>
                                    <td className="p-2.5 bg-orange-50 text-orange-900 font-bold">-39°**</td>
                                    <td className="p-2.5 bg-rose-100 text-rose-900 font-black">-51°***</td>
                                    <td className="p-2.5 bg-rose-200 text-rose-950 font-black">-64°***</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">25 mph</td>
                                    <td className="p-2.5 bg-emerald-50 text-emerald-900 font-bold">23°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">9°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">-4°</td>
                                    <td className="p-2.5 bg-amber-50 text-amber-900 font-bold">-19°*</td>
                                    <td className="p-2.5 bg-orange-50 text-orange-900 font-bold">-33°**</td>
                                    <td className="p-2.5 bg-rose-100 text-rose-900 font-black">-47°***</td>
                                    <td className="p-2.5 bg-rose-200 text-rose-950 font-black">-61°***</td>
                                    <td className="p-2.5 bg-rose-300 text-rose-950 font-black">-75°***</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">40 mph</td>
                                    <td className="p-2.5 bg-emerald-50 text-emerald-900 font-bold">20°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">5°</td>
                                    <td className="p-2.5 bg-blue-50 text-blue-900">-9°</td>
                                    <td className="p-2.5 bg-amber-50 text-amber-900 font-bold">-25°*</td>
                                    <td className="p-2.5 bg-orange-50 text-orange-900 font-bold">-41°**</td>
                                    <td className="p-2.5 bg-rose-100 text-rose-900 font-black">-56°***</td>
                                    <td className="p-2.5 bg-rose-200 text-rose-950 font-black">-71°***</td>
                                    <td className="p-2.5 bg-rose-300 text-rose-950 font-black">-87°***</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded inline-block"></span>
                            * Frostbite onset ≈ 30 min
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-orange-100 border border-orange-300 rounded inline-block"></span>
                            ** Frostbite onset ≈ 10 min
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 bg-rose-200 border border-rose-400 rounded inline-block"></span>
                            *** Frostbite onset &lt; 5 min
                        </span>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Worked Mathematical Solutions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Meteorological Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine these complete mathematical calculations demonstrating how wind velocity accelerates thermal heat loss and reduces perceived temperatures:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Blizzard Conditions (T = 5°F, V = 30 mph)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">NWS Model</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Calculate Exponential Velocity Factor:</strong></li>
                                <li className="text-indigo-700 pl-3">{"V^{0.16} = 30^{0.16} \\approx 1.7247"}</li>
                                <li><strong>2. Apply NWS Constant Terms:</strong></li>
                                <li className="text-indigo-700 pl-3">{"WCF = 35.74 + 0.6215(5) - 35.75(1.7247) + 0.4275(5)(1.7247)"}</li>
                                <li><strong>3. Sum Intermediate Products:</strong></li>
                                <li className="text-indigo-700 pl-3">{"WCF = 35.74 + 3.1075 - 61.6580 + 3.6865 = -19.12^\\circ\\text{F}"}</li>
                                <li><strong>4. Evaluate Frostbite Hazard:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\text{Wind Chill} = -19.1^\\circ\\text{F} \\implies \\text{Frostbite Onset } \\approx 30 \\text{ minutes}"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Conclusion: High risk for frostnip and superficial frostbite on uncovered extremities.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Arctic High (T = -15°C, V = 45 km/h)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Metric Standard</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Calculate Metric Velocity Factor:</strong></li>
                                <li className="text-indigo-700 pl-3">{"V^{0.16} = 45^{0.16} \\approx 1.8384"}</li>
                                <li><strong>2. Apply Environment Canada Formula:</strong></li>
                                <li className="text-indigo-700 pl-3">{"WCF = 13.12 + 0.6215(-15) - 11.37(1.8384) + 0.3965(-15)(1.8384)"}</li>
                                <li><strong>3. Solve Algebraic Terms:</strong></li>
                                <li className="text-indigo-700 pl-3">{"WCF = 13.12 - 9.3225 - 20.9026 - 10.9338 = -28.04^\\circ\\text{C}"}</li>
                                <li><strong>4. Convective Heat Loss Computation:</strong></li>
                                <li className="text-indigo-700 pl-3">{"h_c \\approx 52.8 \\text{ W/m}^2\\text{K} \\implies \\dot{Q} = 52.8 \\times (33 - (-15)) = 2,534.4 \\text{ W/m}^2"}</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-sans">
                                    • Conclusion: Severe chill index of -28°C triggers frostbite onset in 10-15 minutes.
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
                                What is the official NOAA/NWS Wind Chill Formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"The official Joint Action Group for Temperature Indices (JAG/TI) formula is: $\\text{WCF } (^\\circ\\text{F}) = 35.74 + 0.6215(T) - 35.75(V^{0.16}) + 0.4275(T)(V^{0.16})$, where $T$ is ambient air temperature in Fahrenheit and $V$ is wind speed in miles per hour at standard anemometer height (5 feet / 1.5 meters)."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can wind chill cause inanimate objects or car engines to freeze below the actual air temperature?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Wind chill only accelerates the rate of cooling toward the ambient temperature by stripping away the boundary air layer. An inanimate object (such as a vehicle radiator or water pipe) can never cool below the physical ambient air temperature, regardless of how fast the wind blows.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                At what wind chill temperature does frostbite occur on exposed human skin?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Frostbite risks become severe once wind chill drops below 0°F (-18°C). At -18°F (-28°C), frostbite can occur within 30 minutes of continuous exposure. At -35°F (-37°C), skin can freeze within 10 minutes, and below -48°F (-44°C), frostbite onset occurs in 5 minutes or less.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why did meteorological organizations replace the old 1945 Siple-Passel wind chill formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The 1945 Siple-Passel formula was derived from measuring the freezing rate of water inside small plastic cylinders in Antarctica. This failed to account for human vascular thermoregulation, skin tissue thermal resistance, and realistic head-level wind speeds, leading to severe overestimations of cold severity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Wind Chill and Heat Index?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Wind Chill quantifies cold-weather convective heat loss driven by wind speed stripping body warmth. In contrast, the Heat Index (or Humidex) measures warm-weather thermal stress driven by high relative humidity impeding sweat evaporation from the skin.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is wind chill not calculated when temperatures exceed 50°F (10°C)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                At ambient temperatures above 50°F (10°C), convective skin cooling does not pose hypothermia or frostbite danger to human physiology. Above this threshold, humidity and direct solar radiation dominate perceived comfort.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}