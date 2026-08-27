"use client";

import React, { useState, useMemo } from "react";
import {
    Flame,
    RotateCcw,
    Copy,
    Check,
    HelpCircle,
    BookOpen,
    Info,
    Sparkles,
    Calculator,
    Activity,
    Sliders,
    Thermometer,
    Droplets,
    ShieldAlert,
    AlertTriangle,
    Wind,
    Sun,
    Layers,
    TrendingUp,
    Scale,
    Cpu
} from "lucide-react";

type TempUnit = "C" | "F";
type HumidityInputMode = "RH" | "DEW_POINT";

interface HeatIndexMetrics {
    tempF: number;
    tempC: number;
    rh: number;
    dewPointF: number;
    dewPointC: number;
    heatIndexF: number;
    heatIndexC: number;
    humidex: number;
    vaporPressureHPa: number;
    apparentTempF: number;
    apparentTempC: number;
    category: "Safe" | "Caution" | "Extreme Caution" | "Danger" | "Extreme Danger";
    categoryColor: string;
    categoryBg: string;
    categoryBorder: string;
    recommendations: string[];
    heatStrokeRisk: string;
}

interface SolveResult {
    valid: boolean;
    error?: string;
    metrics?: HeatIndexMetrics;
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

// Rothfusz regression equation for NOAA Heat Index
function calculateNOAAHeatIndex(tempF: number, rh: number): number {
    // Steadman simple formulation check
    const simpleHI = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (rh * 0.094));
    if (simpleHI < 80) {
        return simpleHI;
    }

    // Full 9-term Rothfusz polynomial
    let hi = -42.379 +
        2.04901523 * tempF +
        10.14333127 * rh -
        0.22475541 * tempF * rh -
        0.00683783 * tempF * tempF -
        0.05481717 * rh * rh +
        0.00122874 * tempF * tempF * rh +
        0.00085282 * tempF * rh * rh -
        0.00000199 * tempF * tempF * rh * rh;

    // Adjustment for low relative humidity and high temperature
    if (rh < 13 && tempF >= 80 && tempF <= 112) {
        const adj = ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
        hi -= adj;
    }

    // Adjustment for high relative humidity and high temperature
    if (rh > 85 && tempF >= 80 && tempF <= 87) {
        const adj = ((rh - 85) / 10) * ((87 - tempF) / 5);
        hi += adj;
    }

    return hi;
}

// Magnus-Tetens approximation for Dew Point and Vapor Pressure
function calculateDewPointC(tempC: number, rh: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * tempC) / (b + tempC)) + Math.log(rh / 100.0);
    return (b * alpha) / (a - alpha);
}

function calculateVaporPressureHPa(tempC: number, rh: number): number {
    // Saturation vapor pressure in hPa
    const eSat = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
    return eSat * (rh / 100.0);
}

// Canadian Humidex calculation
function calculateHumidex(tempC: number, vaporPressureHPa: number): number {
    return tempC + (5 / 9) * (vaporPressureHPa - 10);
}

// Australian Bureau of Meteorology Apparent Temperature (AT) with ambient wind
function calculateApparentTempC(tempC: number, vaporPressureHPa: number, windSpeedMps: number = 0): number {
    return tempC + 0.33 * vaporPressureHPa - 0.70 * windSpeedMps - 4.0;
}

export default function HeatIndexCalculator() {
    const [tempUnit, setTempUnit] = useState<TempUnit>("C");
    const [humidityMode, setHumidityMode] = useState<HumidityInputMode>("RH");
    const [precision, setPrecision] = useState<number>(1);

    // Temperature input
    const [temperatureInput, setTemperatureInput] = useState<number>(32);
    // Relative Humidity input (%)
    const [rhInput, setRhInput] = useState<number>(65);
    // Dew point input (in active temp unit)
    const [dewPointInput, setDewPointInput] = useState<number>(24);
    // Wind Speed input (m/s or mph toggleable via ambient)
    const [windSpeedMps, setWindSpeedMps] = useState<number>(1.5);

    const [copied, setCopied] = useState<boolean>(false);

    // Mathematical Solver
    const computation: SolveResult = useMemo(() => {
        try {
            let tempC = tempUnit === "C" ? temperatureInput : (temperatureInput - 32) * (5 / 9);
            let tempF = tempUnit === "F" ? temperatureInput : (temperatureInput * (9 / 5)) + 32;

            if (tempC < -50 || tempC > 70) {
                return { valid: false, error: "Temperature is outside realistic meteorological bounds (-50°C to 70°C / -58°F to 158°F)." };
            }

            let calculatedRH = rhInput;
            let derivedDewPointC = 0;

            if (humidityMode === "RH") {
                if (rhInput < 0 || rhInput > 100) {
                    return { valid: false, error: "Relative humidity must range between 0% and 100%." };
                }
                derivedDewPointC = calculateDewPointC(tempC, rhInput);
            } else {
                const dpC = tempUnit === "C" ? dewPointInput : (dewPointInput - 32) * (5 / 9);
                if (dpC > tempC) {
                    return { valid: false, error: "Dew point cannot exceed ambient temperature under normal atmospheric conditions." };
                }
                derivedDewPointC = dpC;
                // Reverse Magnus formula to solve for RH
                const a = 17.27;
                const b = 237.7;
                const gammaT = (a * tempC) / (b + tempC);
                const gammaTd = (a * dpC) / (b + dpC);
                calculatedRH = Math.min(100, Math.max(0, Math.exp(gammaTd - gammaT) * 100));
            }

            const dewPointF = (derivedDewPointC * (9 / 5)) + 32;
            const heatIndexF = calculateNOAAHeatIndex(tempF, calculatedRH);
            const heatIndexC = (heatIndexF - 32) * (5 / 9);

            const vaporPressureHPa = calculateVaporPressureHPa(tempC, calculatedRH);
            const humidex = calculateHumidex(tempC, vaporPressureHPa);
            const apparentTempC = calculateApparentTempC(tempC, vaporPressureHPa, windSpeedMps);
            const apparentTempF = (apparentTempC * (9 / 5)) + 32;

            // NOAA Danger Classification
            let category: HeatIndexMetrics["category"] = "Safe";
            let categoryColor = "text-emerald-700";
            let categoryBg = "bg-emerald-50";
            let categoryBorder = "border-emerald-200";
            let heatStrokeRisk = "Low risk of thermal stress under standard activity levels.";
            let recommendations = [
                "Normal physical activity permissible.",
                "Maintain standard baseline hydration.",
                "Ensure standard ventilation in indoor work environments."
            ];

            if (heatIndexF >= 80 && heatIndexF < 90) {
                category = "Caution";
                categoryColor = "text-amber-700";
                categoryBg = "bg-amber-50";
                categoryBorder = "border-amber-200";
                heatStrokeRisk = "Fatigue possible with prolonged exposure and physical exertion.";
                recommendations = [
                    "Increase fluid and electrolyte intake.",
                    "Take regular shade or cooling breaks during strenuous exertion.",
                    "Monitor vulnerable individuals and outdoor workers."
                ];
            } else if (heatIndexF >= 90 && heatIndexF < 103) {
                category = "Extreme Caution";
                categoryColor = "text-orange-700";
                categoryBg = "bg-orange-50";
                categoryBorder = "border-orange-200";
                heatStrokeRisk = "Heat cramps and heat exhaustion possible with prolonged exposure and activity.";
                recommendations = [
                    "Limit heavy outdoor physical labor between 11:00 AM and 4:00 PM.",
                    "Drink water every 15-20 minutes regardless of thirst.",
                    "Wear lightweight, loose-fitting, light-colored clothing."
                ];
            } else if (heatIndexF >= 103 && heatIndexF < 125) {
                category = "Danger";
                categoryColor = "text-rose-700";
                categoryBg = "bg-rose-50";
                categoryBorder = "border-rose-200";
                heatStrokeRisk = "Heat cramps or heat exhaustion likely; heat stroke possible with continued exposure.";
                recommendations = [
                    "Reschedule non-essential strenuous outdoor tasks.",
                    "Mandate frequent rest cycles in shaded or air-conditioned zones.",
                    "Implement buddy system to identify early symptoms of heat exhaustion."
                ];
            } else if (heatIndexF >= 125) {
                category = "Extreme Danger";
                categoryColor = "text-purple-700";
                categoryBg = "bg-purple-50";
                categoryBorder = "border-purple-200";
                heatStrokeRisk = "Heat stroke imminent with rapid onset; life-threatening emergency threshold.";
                recommendations = [
                    "Halt all unconditioned outdoor manual labor and athletic training.",
                    "Stay in air-conditioned environments with emergency cooling ready.",
                    "Seek immediate emergency medical intervention if confusion or fainting occurs."
                ];
            }

            return {
                valid: true,
                metrics: {
                    tempF,
                    tempC,
                    rh: calculatedRH,
                    dewPointF,
                    dewPointC: derivedDewPointC,
                    heatIndexF,
                    heatIndexC,
                    humidex,
                    vaporPressureHPa,
                    apparentTempF,
                    apparentTempC,
                    category,
                    categoryColor,
                    categoryBg,
                    categoryBorder,
                    recommendations,
                    heatStrokeRisk
                }
            };
        } catch {
            return { valid: false, error: "Mathematical domain or overflow error during heat index computation." };
        }
    }, [tempUnit, humidityMode, temperatureInput, rhInput, dewPointInput, windSpeedMps]);

    const m = computation.metrics;

    const handleReset = () => {
        setTempUnit("C");
        setHumidityMode("RH");
        setPrecision(1);
        setTemperatureInput(32);
        setRhInput(65);
        setDewPointInput(24);
        setWindSpeedMps(1.5);
    };

    const handleCopyResults = () => {
        if (!m) return;
        const format = (n: number) => n.toFixed(precision);
        const text = `Heat Index & Biometeorological Assessment Report (twistertools.com)
----------------------------------------
Input Atmospheric Conditions:
  Ambient Temperature = ${format(tempUnit === "C" ? m.tempC : m.tempF)}°${tempUnit} (${format(tempUnit === "C" ? m.tempF : m.tempC)}°${tempUnit === "C" ? "F" : "C"})
  Relative Humidity = ${format(m.rh)}%
  Dew Point = ${format(tempUnit === "C" ? m.dewPointC : m.dewPointF)}°${tempUnit}
  Vapor Pressure = ${format(m.vaporPressureHPa)} hPa
Calculated Real-Feel & Thermal Stress:
  NOAA Heat Index = ${format(tempUnit === "C" ? m.heatIndexC : m.heatIndexF)}°${tempUnit} (${format(tempUnit === "C" ? m.heatIndexF : m.heatIndexC)}°${tempUnit === "C" ? "F" : "C"})
  Canadian Humidex = ${format(m.humidex)}
  Australian Apparent Temp = ${format(tempUnit === "C" ? m.apparentTempC : m.apparentTempF)}°${tempUnit}
  Safety Danger Category = ${m.category}
  Clinical Risk Level = ${m.heatStrokeRisk}
----------------------------------------
Generated via TwisterTools Heat Index Calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatNum = (num: number | undefined) => {
        if (num === undefined || isNaN(num)) return "0";
        return Number(num.toFixed(precision)).toString();
    };

    // Dynamic Gauge Bar Percentage (Heat Index from 70°F to 135°F)
    const gaugePercentage = useMemo(() => {
        if (!m) return 0;
        const minF = 70;
        const maxF = 135;
        const clamped = Math.min(maxF, Math.max(minF, m.heatIndexF));
        return ((clamped - minF) / (maxF - minF)) * 100;
    }, [m]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Heat Index, Humidity & Real-Feel Temperature Estimator",
        "url": "https://twistertools.com/tools/math-tools/heat-index-calculator",
        "description": "Scientific heat index and apparent real-feel temperature calculator utilizing NOAA Rothfusz regression algorithms, Magnus-Tetens dew point modeling, and Canadian Humidex analytics.",
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
                "name": "What is the Heat Index and how does it differ from actual air temperature?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Heat Index (also called apparent temperature) combines ambient air temperature and relative humidity to measure how hot the weather actually feels to the human body. Because high atmospheric moisture prevents sweat from evaporating efficiently, the human body cannot dissipate metabolic heat, making conditions feel significantly hotter than the thermometer reads."
                }
            },
            {
                "@type": "Question",
                "name": "What mathematical formula does NOAA use to compute Heat Index?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The National Oceanic and Atmospheric Administration (NOAA) calculates heat index using the Rothfusz regression equation—a multi-variable 9-term second-order polynomial fitted to Robert Steadman's human biometeorological model, with adjustments for extreme dry or humid heat conditions."
                }
            },
            {
                "@type": "Question",
                "name": "Why does high relative humidity inhibit the body's natural evaporative cooling?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Evaporative cooling relies on a water vapor pressure gradient between moist human skin and surrounding ambient air. When ambient relative humidity is elevated, the air is closer to moisture saturation, which drastically slows the evaporation rate of perspiration and traps latent heat within human tissues."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Relative Humidity and Dew Point?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Relative Humidity (RH) is the percentage of moisture in the air relative to the maximum saturation capacity at that specific temperature. Dew Point is the absolute temperature to which air must be cooled at constant pressure to become fully saturated (100% RH), making it a more reliable metric for human comfort."
                }
            },
            {
                "@type": "Question",
                "name": "What are the official NOAA Heat Index danger categories?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "NOAA defines four major risk tiers: Caution (80°F-90°F / 27°C-32°C), Extreme Caution (90°F-103°F / 32°C-39°C), Danger (103°F-124°F / 39°C-51°C), and Extreme Danger (125°F+ / 52°C+), each corresponding to progressive risks of heat fatigue, heat cramps, heat exhaustion, and fatal heat stroke."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Canadian Humidex differ from the US Heat Index?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While the US Heat Index uses empirical regression on dry-bulb temperature and relative humidity, the Canadian Humidex calculates thermal discomfort directly by adding ambient temperature in Celsius to a factor derived from atmospheric vapor pressure in millibars (e): Humidex = T + (5/9)*(e - 10)."
                }
            },
            {
                "@type": "Question",
                "name": "Does exposure to direct sunlight increase the apparent Heat Index?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Standard NOAA Heat Index values are calculated for shaded conditions with light winds. Direct exposure to full solar radiation can add up to 15°F (8.3°C) to the calculated apparent heat index."
                }
            },
            {
                "@type": "Question",
                "name": "At what Heat Index does outdoor athletic activity become dangerous?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Athletic and occupational safety guidelines recommend mandatory rest cycles and strict hydration protocols when the Heat Index reaches 90°F (32°C). High-intensity physical training should generally be curtailed or moved to conditioned environments when the index exceeds 104°F (40°C)."
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

                {/* Left Workspace Panel: Input Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Thermometer className="w-5 h-5 text-indigo-600" />
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

                        {/* Unit & Mode Switchers */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Temperature Scale
                                </span>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("C")}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${tempUnit === "C" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Celsius (°C)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTempUnit("F")}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${tempUnit === "F" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Fahrenheit (°F)
                                    </button>
                                </div>
                            </div>

                            {/* Primary Temperature Input */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Ambient Air Temperature ({tempUnit === "C" ? "°C" : "°F"})
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {temperatureInput} °{tempUnit}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={tempUnit === "C" ? 15 : 60}
                                        max={tempUnit === "C" ? 55 : 130}
                                        step="0.5"
                                        value={temperatureInput}
                                        onChange={(e) => setTemperatureInput(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        step="any"
                                        value={temperatureInput === 0 ? "" : temperatureInput}
                                        onChange={(e) => handleNumberInput(e, setTemperatureInput)}
                                        className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Moisture Input Selector: RH or Dew Point */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Humidity Measurement Mode
                                    </label>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setHumidityMode("RH")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${humidityMode === "RH" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Relative Humidity (%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setHumidityMode("DEW_POINT")}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${humidityMode === "DEW_POINT" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                }`}
                                        >
                                            Dew Point (°{tempUnit})
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    {humidityMode === "RH" ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Relative Humidity (%)
                                                </label>
                                                <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                                    {rhInput} %
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min="5"
                                                    max="100"
                                                    step="1"
                                                    value={rhInput}
                                                    onChange={(e) => setRhInput(parseFloat(e.target.value) || 0)}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="any"
                                                    value={rhInput === 0 ? "" : rhInput}
                                                    onChange={(e) => handleNumberInput(e, setRhInput)}
                                                    className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                    Dew Point Temperature ({tempUnit === "C" ? "°C" : "°F"})
                                                </label>
                                                <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                                    {dewPointInput} °{tempUnit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min={tempUnit === "C" ? 0 : 32}
                                                    max={tempUnit === "C" ? 35 : 95}
                                                    step="0.5"
                                                    value={dewPointInput}
                                                    onChange={(e) => setDewPointInput(parseFloat(e.target.value) || 0)}
                                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={dewPointInput === 0 ? "" : dewPointInput}
                                                    onChange={(e) => handleNumberInput(e, setDewPointInput)}
                                                    className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Ambient Wind Speed Modifier */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Wind className="w-4 h-4 text-indigo-600" />
                                        Light Ambient Wind Speed (m/s)
                                    </label>
                                    <span className="text-xs font-extrabold text-indigo-600 font-mono">
                                        {windSpeedMps} m/s
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="0.5"
                                        value={windSpeedMps}
                                        onChange={(e) => setWindSpeedMps(parseFloat(e.target.value) || 0)}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        step="any"
                                        value={windSpeedMps === 0 ? "" : windSpeedMps}
                                        onChange={(e) => handleNumberInput(e, setWindSpeedMps)}
                                        className="w-24 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-none text-right focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Precision Selector */}
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Decimal Precision:
                            </span>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                {[1, 2, 3].map((dec) => (
                                    <button
                                        key={dec}
                                        type="button"
                                        onClick={() => setPrecision(dec)}
                                        className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition cursor-pointer ${precision === dec ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        {dec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status Alert */}
                        {!computation.valid ? (
                            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-rose-800 space-y-1">
                                    <p className="font-bold uppercase tracking-wider">Meteorological Warning</p>
                                    <p>{computation.error}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between text-xs text-emerald-900">
                                <span className="font-bold flex items-center gap-1.5">
                                    <Check className="w-4 h-4 text-emerald-600" />
                                    Atmospheric Thermodynamics Solved
                                </span>
                                <span className="font-semibold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800">
                                    NOAA Rothfusz + Magnus Model
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Info className="w-4 h-4 text-indigo-500" />
                            Standard Pressure: 1013.25 hPa
                        </span>
                        <span>Biometeorological Model</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Feel Analytics & Danger Category */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-indigo-600" />
                                Real-Feel Analytics & Thermal Stress
                            </h2>
                            {computation.valid && m && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${m.categoryBg} ${m.categoryColor} ${m.categoryBorder}`}>
                                    {m.category}
                                </span>
                            )}
                        </div>

                        {/* Highlight Card: Heat Index & Humidex */}
                        {computation.valid && m ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                            <Flame className="w-4 h-4 text-rose-500" />
                                            NOAA Heat Index
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(tempUnit === "C" ? m.heatIndexC : m.heatIndexF)}°{tempUnit}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            {formatNum(tempUnit === "C" ? m.heatIndexF : m.heatIndexC)}°{tempUnit === "C" ? "F" : "C"} Real-Feel
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 space-y-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                                            <Droplets className="w-4 h-4 text-sky-500" />
                                            Dew Point
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight pt-0.5">
                                            {formatNum(tempUnit === "C" ? m.dewPointC : m.dewPointF)}°{tempUnit}
                                        </div>
                                        <p className="text-[11px] font-semibold text-slate-500">
                                            RH: {formatNum(m.rh)}% Saturation
                                        </p>
                                    </div>
                                </div>

                                {/* Danger Spectrum Visual Bar */}
                                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-indigo-300 uppercase tracking-wider">
                                            Thermal Discomfort Meter
                                        </span>
                                        <span className="font-mono text-[11px] text-slate-400">
                                            Index: {formatNum(m.heatIndexF)}°F
                                        </span>
                                    </div>

                                    {/* Multi-segmented Heat Bar */}
                                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 transition-all duration-300 rounded-full"
                                            style={{ width: `${Math.min(100, Math.max(5, gaugePercentage))}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-0.5">
                                        <span className="text-emerald-400">Safe (80°F)</span>
                                        <span className="text-amber-400">Caution (90°F)</span>
                                        <span className="text-orange-400">Ex. Caution (103°F)</span>
                                        <span className="text-rose-400">Danger (125°F+)</span>
                                    </div>
                                </div>

                                {/* Multi-Index Comparison Matrix */}
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Canadian Humidex</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(m.humidex)}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Apparent Temp</span>
                                        <span className="font-extrabold text-indigo-700 text-sm">{formatNum(tempUnit === "C" ? m.apparentTempC : m.apparentTempF)}°{tempUnit}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-0.5">
                                        <span className="text-[11px] font-bold text-slate-500 block">Vapor Pressure</span>
                                        <span className="font-extrabold text-slate-900 text-sm">{formatNum(m.vaporPressureHPa)} hPa</span>
                                    </div>
                                </div>

                                {/* Health Risk & Actionable Safety Recommendations */}
                                <div className={`p-4 rounded-xl border ${m.categoryBorder} ${m.categoryBg} space-y-2`}>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className={`w-4 h-4 ${m.categoryColor}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${m.categoryColor}`}>
                                            Clinical Advisory: {m.category}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800">
                                        {m.heatStrokeRisk}
                                    </p>
                                    <ul className="text-xs text-slate-700 space-y-1 pt-1 list-disc list-inside">
                                        {m.recommendations.map((rec, idx) => (
                                            <li key={idx}>{rec}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                Enter temperature and humidity parameters to calculate thermal stress.
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
                            {copied ? "Heat Index Report Copied!" : "Copy Full Heat Index Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master Heat Index Danger Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            NOAA Heat Index Classification & Clinical Danger Thresholds
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The National Oceanic and Atmospheric Administration (NOAA) and the National Weather Service (NWS) classify apparent thermal stress into four standardized physiological danger tiers. When heat index values cross into elevated zones, the human body loses its ability to shed endogenous heat through perspiration evaporation, substantially escalating the risk of acute heat-related illnesses:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Danger Category</th>
                                    <th className="p-3">Heat Index Range (°F)</th>
                                    <th className="p-3">Heat Index Range (°C)</th>
                                    <th className="p-3">Physiological Symptoms & Clinical Risk Profile</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-emerald-700">Safe / Baseline</td>
                                    <td className="p-3 font-mono text-xs text-slate-900">&lt; 80°F</td>
                                    <td className="p-3 font-mono text-xs text-slate-900">&lt; 26.7°C</td>
                                    <td className="p-3 text-xs">Standard thermoregulation; negligible clinical stress under regular metabolic workloads.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-amber-600">Caution</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">80°F – 90°F</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">26.7°C – 32.2°C</td>
                                    <td className="p-3 text-xs">Fatigue and lethargy possible with prolonged outdoor exposure and strenuous physical activity.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-orange-600">Extreme Caution</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">90°F – 103°F</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">32.2°C – 39.4°C</td>
                                    <td className="p-3 text-xs">Heat cramps and muscle spasms likely; onset of heat exhaustion possible with continuous activity.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-rose-600">Danger</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">103°F – 124°F</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">39.4°C – 51.1°C</td>
                                    <td className="p-3 text-xs">Heat exhaustion highly probable; heat stroke imminent if rigorous physical labor continues without cooling.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-purple-700">Extreme Danger</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">&ge; 125°F</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">&ge; 51.7°C</td>
                                    <td className="p-3 text-xs">Life-threatening medical emergency; rapid core hyperthermia and fatal heat stroke can occur within minutes.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Biophysics of Perspiration & Evaporative Cooling */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Droplets className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Biophysics of Human Thermoregulation & Evaporative Failure
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The human core body temperature is strictly regulated by the hypothalamus around 37°C (98.6°F). Under hot ambient conditions, the body relies on four primary heat dissipation mechanisms: radiation, conduction, convection, and evaporative cooling:
                    </p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Droplets className="w-4 h-4" /> 1. Latent Heat of Vaporization
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Evaporation of 1 gram of sweat carries away approximately 2,427 Joules (580 calories) of thermal energy from the subcutaneous capillary beds, cooling the blood circulating back to vital organs.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Layers className="w-4 h-4" /> 2. Vapor Pressure Gradients
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Perspiration evaporation is driven by the differential between skin saturation vapor pressure (approx. 56 hPa at 35°C skin temp) and the partial pressure of ambient moisture in the surrounding air.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <ShieldAlert className="w-4 h-4" /> 3. Evaporative Stagnation
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                As relative humidity approaches 100%, ambient vapor pressure matches skin surface pressure. Perspiration rolls off without evaporating, halting latent heat transfer and trapping core metabolic heat.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Activity className="w-4 h-4" /> 4. Cutaneous Vasodilation
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The cardiovascular system diverts up to 60% of cardiac output to peripheral skin vessels to maximize cooling, placing heavy strain on blood pressure and heart rate.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Wind className="w-4 h-4" /> 5. The Boundary Layer Effect
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Still air creates a microclimate of hot, humid air immediately surrounding the epidermis. Light ambient air movement strips this boundary layer, restoring the local evaporative gradient.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                                <Sun className="w-4 h-4" /> 6. Direct Solar Radiation Load
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard heat indices assume shaded conditions. Full direct sun exposure adds a mean radiant temperature load that increases perceived real-feel by up to 15°F (8.3°C).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Mathematical Derivations: Rothfusz, Magnus & Humidex */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Derivations: Rothfusz Regression & Magnus-Tetens Equations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To compute accurate thermal stress without requiring complex biophysical human subject chambers, meteorologists use validated empirical regressions and thermodynamic saturation models:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-600" /> 1. The NOAA Rothfusz 9-Term Polynomial
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Developed in 1990 as a computational fit for Robert Steadman&apos;s biometeorological model ($T$ in °F, $RH$ in %):
                            </p>
                            <div className="font-mono text-[11px] text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1 overflow-x-auto">
                                <p>{"HI = -42.379 + 2.04901523(T) + 10.14333127(RH)"}</p>
                                <p>{"- 0.22475541(T * RH) - 0.00683783(T^2)"}</p>
                                <p>{"- 0.05481717(RH^2) + 0.00122874(T^2 * RH)"}</p>
                                <p>{"- 0.00085282(T * RH^2) - 0.00000199(T^2 * RH^2)"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {"Applies adjustment offsets for $RH < 13\\%$ when $T \\in [80, 112]^\\circ\\text{F}$ and for $RH > 85\\%$ when $T \\in [80, 87]^\\circ\\text{F}$."}
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Droplets className="w-4 h-4 text-indigo-600" /> 2. Magnus-Tetens Dew Point Modeling
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {"Dew point $T_d$ represents the exact saturation temperature calculated via water vapor pressure approximations ($a = 17.27, b = 237.7^\\circ\\text{C}$):"}
                            </p>
                            <div className="font-mono text-[11px] text-indigo-800 bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                                <p>{"\\alpha(T, RH) = \\frac{a \\cdot T}{b + T} + \\ln\\left(\\frac{RH}{100}\\right)"}</p>
                                <p className="font-bold text-slate-900">{"T_d = \\frac{b \\cdot \\alpha(T, RH)}{a - \\alpha(T, RH)}"}</p>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                {"Provides an analytical accuracy within $\\pm 0.4^\\circ\\text{C}$ over the entire meteorological temperature range from $0^\\circ\\text{C}$ to $60^\\circ\\text{C}$."}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Scale className="w-4 h-4" /> Canadian Humidex Formulation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Formulated by J.M. Masterton and F.A. Richardson in 1979 for Environment Canada, the Humidex combines temperature with absolute vapor pressure:
                        </p>
                        <div className="font-mono text-xs text-indigo-200 bg-slate-950 p-3 rounded-lg space-y-1 border border-slate-800">
                            <p>{"\\text{Humidex} = T_{^\\circ\\text{C}} + \\frac{5}{9} (e - 10)"}</p>
                            <p>{"e = 6.112 \\times 10^{\\left(\\frac{7.5 \\cdot T_d}{237.3 + T_d}\\right)} \\quad (\\text{Vapor Pressure in hPa / mbar})"}</p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Standard Temperature & Humidity Lookup Chart */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Temperature vs. Humidity Heat Index Lookup Grid
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Use this lookup matrix to check apparent real-feel temperatures (°F) across combinations of ambient dry-bulb temperature and relative humidity:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-center text-xs text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-2.5 text-left">Air Temp (°F / °C)</th>
                                    <th className="p-2.5">40% RH</th>
                                    <th className="p-2.5">50% RH</th>
                                    <th className="p-2.5">60% RH</th>
                                    <th className="p-2.5">70% RH</th>
                                    <th className="p-2.5">80% RH</th>
                                    <th className="p-2.5">90% RH</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-mono font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">80°F (26.7°C)</td>
                                    <td className="p-2.5 text-emerald-700">80°F</td>
                                    <td className="p-2.5 text-emerald-700">81°F</td>
                                    <td className="p-2.5 text-amber-700">82°F</td>
                                    <td className="p-2.5 text-amber-700">83°F</td>
                                    <td className="p-2.5 text-amber-700">84°F</td>
                                    <td className="p-2.5 text-amber-700">86°F</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">85°F (29.4°C)</td>
                                    <td className="p-2.5 text-amber-700">84°F</td>
                                    <td className="p-2.5 text-amber-700">86°F</td>
                                    <td className="p-2.5 text-orange-700">90°F</td>
                                    <td className="p-2.5 text-orange-700">93°F</td>
                                    <td className="p-2.5 text-orange-700">97°F</td>
                                    <td className="p-2.5 text-rose-700">102°F</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">90°F (32.2°C)</td>
                                    <td className="p-2.5 text-orange-700">91°F</td>
                                    <td className="p-2.5 text-orange-700">95°F</td>
                                    <td className="p-2.5 text-rose-700">100°F</td>
                                    <td className="p-2.5 text-rose-700">106°F</td>
                                    <td className="p-2.5 text-rose-700">113°F</td>
                                    <td className="p-2.5 text-purple-700">122°F</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">95°F (35.0°C)</td>
                                    <td className="p-2.5 text-rose-700">101°F</td>
                                    <td className="p-2.5 text-rose-700">107°F</td>
                                    <td className="p-2.5 text-rose-700">114°F</td>
                                    <td className="p-2.5 text-purple-700">124°F</td>
                                    <td className="p-2.5 text-purple-700">136°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">150°F</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">100°F (37.8°C)</td>
                                    <td className="p-2.5 text-rose-700">109°F</td>
                                    <td className="p-2.5 text-rose-700">118°F</td>
                                    <td className="p-2.5 text-purple-700">129°F</td>
                                    <td className="p-2.5 text-purple-700">144°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">&gt;155°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">&gt;165°F</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-2.5 font-bold text-slate-900 text-left font-sans">105°F (40.6°C)</td>
                                    <td className="p-2.5 text-rose-700">119°F</td>
                                    <td className="p-2.5 text-purple-700">133°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">149°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">&gt;160°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">&gt;175°F</td>
                                    <td className="p-2.5 text-purple-700 font-bold">&gt;185°F</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Worked Mathematical Calculations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Atmospheric Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review these worked practical examples to understand the step-by-step arithmetic used to derive apparent temperatures:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 1: Humid Summer Afternoon (T = 32°C / 89.6°F, RH = 70%)</span>
                                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">High Heat Stress</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Convert Temperature to Fahrenheit:</strong></li>
                                <li className="text-indigo-700 pl-3">{"T = (32 \\times 1.8) + 32 = 89.60^\\circ\\text{F}"}</li>
                                <li><strong>2. Apply Rothfusz Polynomial:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\text{HI} = -42.379 + 2.049(89.6) + 10.143(70) - 0.2247(89.6)(70) \\dots"}</li>
                                <li className="text-indigo-700 pl-3">{"\\text{HI} = 105.82^\\circ\\text{F} \\implies 41.01^\\circ\\text{C}"}</li>
                                <li><strong>3. Solve Magnus Dew Point:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\alpha = \\frac{17.27(32)}{237.7 + 32} + \\ln(0.70) = 2.049 - 0.3567 = 1.6923"}</li>
                                <li className="text-indigo-700 pl-3">{"T_d = \\frac{237.7(1.6923)}{17.27 - 1.6923} = 25.84^\\circ\\text{C} \\;(78.5^\\circ\\text{F})"}</li>
                                <li><strong>4. Calculate Vapor Pressure & Humidex:</strong></li>
                                <li className="text-indigo-700 pl-3">{"e = 33.32 \\text{ hPa} \\implies \\text{Humidex} = 32 + \\frac{5}{9}(33.32 - 10) = 44.96"}</li>
                                <li className="pt-2 border-t border-slate-200 text-rose-800 font-bold font-sans">
                                    • Risk Tier: DANGER. High probability of heat cramps and exhaustion.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case Study 2: Arid Desert Heat (T = 42°C / 107.6°F, RH = 15%)</span>
                                <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">Dry Climate Model</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5 font-mono">
                                <li><strong>1. Convert Temperature to Fahrenheit:</strong></li>
                                <li className="text-indigo-700 pl-3">{"T = (42 \\times 1.8) + 32 = 107.60^\\circ\\text{F}"}</li>
                                <li><strong>2. Apply Polynomial with Low-RH Offset:</strong></li>
                                <li className="text-indigo-700 pl-3">{"\\text{HI}_{raw} = 104.22^\\circ\\text{F}"}</li>
                                <li className="text-indigo-700 pl-3">{"\\text{Offset} = 0.00 \\implies \\text{HI} = 104.22^\\circ\\text{F} \\;(40.12^\\circ\\text{C})"}</li>
                                <li><strong>3. Solve Magnus Dew Point:</strong></li>
                                <li className="text-indigo-700 pl-3">{"T_d = 11.51^\\circ\\text{C} \\;(52.72^\\circ\\text{F})"}</li>
                                <li><strong>4. Calculate Vapor Pressure:</strong></li>
                                <li className="text-indigo-700 pl-3">{"e = 12.31 \\text{ hPa} \\implies \\text{Humidex} = 42 + \\frac{5}{9}(12.31 - 10) = 43.28"}</li>
                                <li className="pt-2 border-t border-slate-200 text-orange-800 font-bold font-sans">
                                    • Result: High evaporation rate maintains Heat Index lower than dry-bulb ambient.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card: Medical & Occupational Safety Disclaimer */}
                <section className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="w-5 h-5 text-amber-700" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Medical & Biometeorological Advisory Disclaimer
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The heat index values, apparent temperatures, and associated safety tiers generated by this tool are calculated using standard meteorological models (such as the NOAA Rothfusz regression and Canadian Humidex) for informational and educational planning purposes only.
                    </p>

                    <div className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        <p>
                            • <strong>Individual Variability:</strong> Actual physiological strain varies significantly based on individual age, baseline hydration, body mass, metabolic rate, acclimatization, medication usage, and protective clothing.
                        </p>
                        <p>
                            • <strong>Direct Sun & Wind Exposure:</strong> Standard heat index models assume shaded conditions with light winds. Direct sunlight can increase apparent heat indices by up to 15°F (8.3°C).
                        </p>
                        <p>
                            • <strong>Not Medical Advice:</strong> This tool does not provide medical diagnoses or customized occupational safety clearances. If you or someone around you exhibits signs of heat exhaustion or heat stroke (such as confusion, dizziness, cessation of sweating, nausea, or loss of consciousness), seek immediate emergency medical services (e.g., call 911/112).
                        </p>
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
                                What is the Heat Index and how does it differ from actual air temperature?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Heat Index (apparent temperature) represents how hot weather actually feels to the human body by combining ambient temperature with relative humidity. When humidity is high, perspiration evaporates slower, trapping metabolic heat and making conditions feel substantially hotter than the thermometer indicates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What mathematical formula does NOAA use to compute Heat Index?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                NOAA uses the Rothfusz regression equation—a multi-variable 9-term second-order polynomial fitted to Robert Steadman&apos;s human biometeorological model. It evaluates dry-bulb temperature and relative humidity alongside conditional low-humidity and high-humidity adjustment factors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does high relative humidity inhibit the body&apos;s natural evaporative cooling?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Perspiration evaporation relies on a vapor pressure gradient between moisture on human skin and the air. Elevated humidity means ambient air is near saturation, drastically slowing perspiration evaporation and retaining latent heat within body tissues.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Relative Humidity and Dew Point?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Relative Humidity (RH) measures current moisture as a percentage of maximum capacity at that specific temperature. Dew Point is the exact temperature to which air must cool to reach 100% saturation, providing an absolute measure of moisture independent of fluctuating temperatures.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the official NOAA Heat Index danger categories?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                NOAA classifies thermal stress into four tiers: Caution (80°F–90°F / 27°C–32°C), Extreme Caution (90°F–103°F / 32°C–39°C), Danger (103°F–124°F / 39°C–51°C), and Extreme Danger (≥125°F / ≥52°C), marking progressive risks from fatigue to fatal heat stroke.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Canadian Humidex differ from the US Heat Index?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While the US Heat Index uses polynomial regression on dry-bulb temperature and relative humidity, the Canadian Humidex directly adds ambient Celsius temperature to an absolute vapor pressure factor derived from the dew point: {"$\\text{Humidex} = T + \\frac{5}{9}(e - 10)$."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does exposure to direct sunlight increase the apparent Heat Index?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Standard Heat Index values are formulated for shaded conditions with light winds. Direct exposure to solar radiation adds radiant thermal loading that can increase perceived real-feel temperatures by up to 15°F (8.3°C).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                At what Heat Index does outdoor athletic activity become dangerous?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sports medicine guidelines recommend mandatory rest cycles and hydration protocols when the Heat Index exceeds 90°F (32°C). High-intensity physical conditioning and heavy outdoor labor should be altered, postponed, or moved indoors once the index reaches 104°F (40°C).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}