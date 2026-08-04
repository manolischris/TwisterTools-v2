"use client";

import React, { useState, useMemo } from "react";
import {
    Calculator,
    Copy,
    Check,
    Download,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Sparkles,
    ShieldCheck,
    Sliders,
    Table,
    FileText,
    CheckCircle2,
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Activity,
    Layers,
    Compass,
    Scale,
    BarChart3,
    Clock,
    Zap
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    type: "growth" | "decay";
    initialValue: string;
    rate: string;
    time: string;
    tag: string;
    desc: string;
}

const PRESETS: Preset[] = [
    {
        id: "pop-growth",
        label: "Population Growth",
        type: "growth",
        initialValue: "1000",
        rate: "5",
        time: "10",
        tag: "Biology",
        desc: "Initial: 1,000 | 5% growth over 10 periods"
    },
    {
        id: "radioactive-decay",
        label: "Radioactive Half-Life",
        type: "decay",
        initialValue: "500",
        rate: "12",
        time: "5",
        tag: "Physics",
        desc: "Initial: 500g | 12% decay over 5 periods"
    },
    {
        id: "investment-compound",
        label: "Compound Investment",
        type: "growth",
        initialValue: "5000",
        rate: "8",
        time: "15",
        tag: "Finance",
        desc: "Initial: $5,000 | 8% annual return over 15 years"
    },
    {
        id: "vehicle-depreciation",
        label: "Asset Depreciation",
        type: "decay",
        initialValue: "30000",
        rate: "15",
        time: "6",
        tag: "Economics",
        desc: "Initial: $30,000 | 15% annual loss over 6 years"
    }
];

interface ScheduleRow {
    period: number;
    value: number;
    change: number;
    accumulatedChange: number;
}

interface InvalidCalculation {
    valid: false;
    message: string;
}

interface ValidCalculation {
    valid: true;
    type: "growth" | "decay";
    isContinuous: boolean;
    initialValue: number;
    ratePercent: number;
    rateDecimal: number;
    time: number;
    finalValue: number;
    totalChange: number;
    percentageChange: number;
    halfLifeOrDoublingTime: number;
    derivationSteps: string[];
    schedule: ScheduleRow[];
    svgPathD: string;
    maxSvgX: number;
    maxSvgY: number;
}

type CalculationResult = InvalidCalculation | ValidCalculation;

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
        setter(raw);
        return;
    }
    if (/^-?\d*\.?\d*$/.test(raw)) {
        const cleaned = raw.replace(/^(-?)0+(?=\d)/, "$1");
        setter(cleaned);
    }
};

export default function ExponentialCalculator() {
    // Inputs
    const [calcType, setCalcType] = useState<"growth" | "decay">("growth");
    const [isContinuous, setIsContinuous] = useState<boolean>(false);
    const [initialValue, setInitialValue] = useState<string>("1000");
    const [rate, setRate] = useState<string>("5");
    const [time, setTime] = useState<string>("10");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("pop-growth");

    // Calculation Engine
    const calculation = useMemo<CalculationResult>(() => {
        if (initialValue === "" || rate === "" || time === "") {
            return { valid: false, message: "Please enter valid numbers for Initial Value, Rate, and Time." };
        }

        const a = parseFloat(initialValue);
        const rPct = parseFloat(rate);
        const t = parseFloat(time);

        if (isNaN(a) || isNaN(rPct) || isNaN(t)) {
            return { valid: false, message: "Invalid numerical input detected. Please re-check your entries." };
        }

        if (a < 0) {
            return { valid: false, message: "Initial value (a) must be a positive number." };
        }

        if (rPct < 0) {
            return { valid: false, message: "Percentage rate must be a non-negative number. Select 'Decay' mode for negative trends." };
        }

        if (t < 0) {
            return { valid: false, message: "Time period (t) cannot be negative." };
        }

        const r = rPct / 100;
        let finalVal = 0;
        let derivationSteps: string[] = [];

        if (isContinuous) {
            // Continuous Exponential Formula: N(t) = N0 * e^(k * t)
            const k = calcType === "growth" ? r : -r;
            finalVal = a * Math.exp(k * t);

            derivationSteps.push(`Model: Continuous Exponential ${calcType === "growth" ? "Growth" : "Decay"}`);
            derivationSteps.push(`Formula: N(t) = N₀ × e^(k × t)`);
            derivationSteps.push(`Identify Variables: N₀ = ${a}, k = ${calcType === "growth" ? r : -r} (${calcType === "growth" ? "" : "-"}${rPct}%), t = ${t}`);
            derivationSteps.push(`Substitute Values: N(${t}) = ${a} × e^(${k} × ${t})`);
            derivationSteps.push(`Calculate Exponent: e^(${(k * t).toFixed(6)}) ≈ ${Math.exp(k * t).toFixed(6)}`);
            derivationSteps.push(`Final Calculated Value: N(${t}) = ${a} × ${Math.exp(k * t).toFixed(6)} = ${finalVal.toFixed(4)}`);
        } else {
            // Discrete Exponential Formula: N(t) = N0 * (1 ± r)^t
            const multiplier = calcType === "growth" ? (1 + r) : (1 - r);
            finalVal = a * Math.pow(multiplier, t);

            derivationSteps.push(`Model: Discrete Period-Based Exponential ${calcType === "growth" ? "Growth" : "Decay"}`);
            derivationSteps.push(`Formula: N(t) = N₀ × (1 ${calcType === "growth" ? "+" : "-"} r)ᵗ`);
            derivationSteps.push(`Identify Variables: N₀ = ${a}, r = ${r} (${rPct}%), t = ${t}`);
            derivationSteps.push(`Growth/Decay Factor: (1 ${calcType === "growth" ? "+" : "-"} ${r}) = ${multiplier.toFixed(4)}`);
            derivationSteps.push(`Raise Factor to Power (t=${t}): (${multiplier.toFixed(4)})^${t} ≈ ${Math.pow(multiplier, t).toFixed(6)}`);
            derivationSteps.push(`Final Calculated Value: N(${t}) = ${a} × ${Math.pow(multiplier, t).toFixed(6)} = ${finalVal.toFixed(4)}`);
        }

        const totalChange = finalVal - a;
        const percentageChange = a !== 0 ? (totalChange / a) * 100 : 0;

        // Doubling Time or Half-Life calculation
        let halfLifeOrDoublingTime = 0;
        if (r > 0) {
            if (isContinuous) {
                halfLifeOrDoublingTime = Math.LN2 / r;
            } else {
                if (calcType === "growth") {
                    halfLifeOrDoublingTime = Math.log(2) / Math.log(1 + r);
                } else {
                    halfLifeOrDoublingTime = Math.log(0.5) / Math.log(1 - r);
                }
            }
        }

        // Generate Time Series Schedule
        const stepsCount = Math.min(Math.max(Math.ceil(t), 1), 50);
        const schedule: ScheduleRow[] = [];

        for (let i = 0; i <= stepsCount; i++) {
            const currentT = (i / stepsCount) * t;
            let val = 0;
            if (isContinuous) {
                const k = calcType === "growth" ? r : -r;
                val = a * Math.exp(k * currentT);
            } else {
                const multiplier = calcType === "growth" ? (1 + r) : (1 - r);
                val = a * Math.pow(multiplier, currentT);
            }
            const change = val - a;
            schedule.push({
                period: parseFloat(currentT.toFixed(2)),
                value: val,
                change: change,
                accumulatedChange: a !== 0 ? (change / a) * 100 : 0
            });
        }

        // Generate Plot Path for Visualizer
        const svgWidth = 400;
        const svgHeight = 180;
        const padding = 20;

        let maxY = Math.max(...schedule.map((s) => s.value), a);
        let minY = Math.min(...schedule.map((s) => s.value), a);
        if (maxY === minY) maxY += 1;

        const mappedPoints = schedule.map((pt, idx) => {
            const svgX = padding + (idx / (schedule.length - 1)) * (svgWidth - 2 * padding);
            const svgY = (svgHeight - padding) - ((pt.value - minY) / (maxY - minY)) * (svgHeight - 2 * padding);
            return `${svgX.toFixed(1)},${svgY.toFixed(1)}`;
        });

        const svgPathD = `M ${mappedPoints.join(" L ")}`;

        return {
            valid: true,
            type: calcType,
            isContinuous,
            initialValue: a,
            ratePercent: rPct,
            rateDecimal: r,
            time: t,
            finalValue: finalVal,
            totalChange,
            percentageChange,
            halfLifeOrDoublingTime,
            derivationSteps,
            schedule,
            svgPathD,
            maxSvgX: svgWidth - padding,
            maxSvgY: (svgHeight - padding) - ((finalVal - minY) / (maxY - minY)) * (svgHeight - 2 * padding)
        };
    }, [calcType, isContinuous, initialValue, rate, time]);

    const applyPreset = (preset: Preset) => {
        setCalcType(preset.type);
        setInitialValue(preset.initialValue);
        setRate(preset.rate);
        setTime(preset.time);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setCalcType("growth");
        setIsContinuous(false);
        setInitialValue("1000");
        setRate("5");
        setTime("10");
        setActivePresetId("pop-growth");
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let summaryText = `Exponential Growth & Decay Solution (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Calculation Mode: ${calculation.type.toUpperCase()} (${calculation.isContinuous ? "Continuous e^kt" : "Discrete (1±r)^t"})\n`;
        summaryText += `Initial Value (N₀): ${calculation.initialValue}\n`;
        summaryText += `Rate (r): ${calculation.ratePercent}%\n`;
        summaryText += `Time (t): ${calculation.time} periods\n`;
        summaryText += `Final Amount N(t): ${calculation.finalValue.toFixed(4)}\n`;
        summaryText += `Total Absolute Change: ${calculation.totalChange.toFixed(4)}\n`;
        summaryText += `Percentage Change: ${calculation.percentageChange.toFixed(2)}%\n`;
        summaryText += `${calculation.type === "growth" ? "Doubling Time" : "Half-Life"}: ${calculation.halfLifeOrDoublingTime.toFixed(4)} periods\n`;
        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/exponential-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        const headers = ["Time Period (t)", "Calculated Value N(t)", "Absolute Change", "Percentage Change (%)"];
        const rows = calculation.schedule.map((row) => [
            row.period.toString(),
            row.value.toFixed(4),
            row.change.toFixed(4),
            row.accumulatedChange.toFixed(2)
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `exponential_${calculation.type}_schedule.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Exponential Growth & Decay Calculator",
        "url": "https://twistertools.com/tools/calculators/exponential-calculator",
        "description": "Calculate discrete and continuous exponential growth, decay, doubling time, half-life, and timeline trajectories with interactive graphical visualization.",
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
                "name": "What is the difference between discrete and continuous exponential growth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Discrete exponential growth applies compounding at distinct intervals using N(t) = N₀(1 + r)ᵗ. Continuous exponential growth assumes constant, unbroken compounding at every instant using Euler's number N(t) = N₀e^(kt)."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate doubling time in exponential growth?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Doubling time is the duration required for a quantity to double. For continuous growth, doubling time t = ln(2) / k. For discrete growth, t = log(2) / log(1 + r)."
                }
            },
            {
                "@type": "Question",
                "name": "What is half-life and how is it derived?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Half-life is the time required for a decaying quantity to decrease to half its initial value. For continuous decay, half-life t = ln(2) / k. For discrete decay, t = log(0.5) / log(1 - r)."
                }
            },
            {
                "@type": "Question",
                "name": "Where is continuous exponential growth used in real life?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Continuous exponential models are widely used in nuclear physics (radioactive decay), epidemiology (unconstrained viral spread), finance (continuously compounded interest), and biology (bacterial population growth)."
                }
            },
            {
                "@type": "Question",
                "name": "How does the Rule of 72 approximate doubling time?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Rule of 72 is a mental math mental shortcut that estimates doubling time by dividing 72 by the annual interest percentage rate (t ≈ 72 / r). It closely matches discrete compound interest calculations for annual interest rates between 4% and 12%."
                }
            },
            {
                "@type": "Question",
                "name": "Can an exponential model grow infinitely in real life?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Mathematically yes, but in physical systems exponential growth eventually hits natural constraints such as resource limits, leading to an S-shaped logistic growth curve."
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
                
                {/* Left Workspace Panel: Inputs & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Model Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Selector Toggle */}
                        <div className="grid grid-cols-2 gap-3 mb-5 p-1.5 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => { setCalcType("growth"); setActivePresetId(null); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    calcType === "growth"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <TrendingUp className="w-4 h-4" /> Exponential Growth
                            </button>
                            <button
                                type="button"
                                onClick={() => { setCalcType("decay"); setActivePresetId(null); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    calcType === "decay"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <TrendingDown className="w-4 h-4" /> Exponential Decay
                            </button>
                        </div>

                        {/* Formula Type Toggle */}
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-900 block">Compounding Model</span>
                                <span className="text-[11px] text-slate-500 block">
                                    {isContinuous ? "Continuous Euler model N₀e^(kt)" : "Discrete periodic model N₀(1 ± r)ᵗ"}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsContinuous(!isContinuous)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                    isContinuous ? "bg-indigo-600" : "bg-slate-300"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isContinuous ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Dynamic Formula Display */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 text-center mb-6 shadow-inner space-y-1">
                            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                                Active Equation
                            </span>
                            <div className="text-lg sm:text-xl font-mono font-black text-indigo-100">
                                {isContinuous ? (
                                    <>N(t) = {initialValue || "N₀"} × e^({calcType === "growth" ? "" : "-"}{(parseFloat(rate) / 100 || 0).toFixed(4)} × {time || "t"})</>
                                ) : (
                                    <>N(t) = {initialValue || "N₀"} × (1 {calcType === "growth" ? "+" : "-"} {(parseFloat(rate) / 100 || 0).toFixed(4)})^{time || "t"}</>
                                )}
                            </div>
                        </div>

                        {/* Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Initial Value (N₀)
                                </label>
                                <input
                                    type="text"
                                    value={initialValue}
                                    onChange={(e) => { handleNumberInput(e, setInitialValue); setActivePresetId(null); }}
                                    placeholder="1000"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">Starting amount</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Rate (%)
                                </label>
                                <input
                                    type="text"
                                    value={rate}
                                    onChange={(e) => { handleNumberInput(e, setRate); setActivePresetId(null); }}
                                    placeholder="5"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">Percent per period</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Time (t)
                                </label>
                                <input
                                    type="text"
                                    value={time}
                                    onChange={(e) => { handleNumberInput(e, setTime); setActivePresetId(null); }}
                                    placeholder="10"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">Number of periods</span>
                            </div>
                        </div>

                        {/* Presets Bar */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets & Examples
                                </span>
                                {activePresetId && (
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        Preset Active
                                    </span>
                                )}
                            </div>

                            <div className="w-full overflow-x-auto pb-1 flex items-center gap-2 scrollbar-thin scrollbar-thumb-slate-200">
                                {PRESETS.map((preset) => {
                                    const isActive = activePresetId === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPreset(preset)}
                                            type="button"
                                            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${
                                                isActive
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-indigo-200"
                                            }`}
                                        >
                                            <span>{preset.label}</span>
                                            <span
                                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                                                    isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
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
                            disabled={!calculation.valid}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Solution"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={!calculation.valid}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Results, Curve Graph & Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Solution & Curve Plot
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {calculation.valid ? `${calculation.type.toUpperCase()} MODEL` : "Invalid"}
                            </span>
                        </div>

                        {!calculation.valid ? (
                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-amber-600" /> Input Required
                                </h3>
                                <p className="text-xs leading-relaxed">{calculation.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Result Summary Box */}
                                <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-indigo-400" /> Final Calculated Value N(t)
                                        </span>
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                            {calculation.isContinuous ? "Continuous" : "Discrete"}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Final Value N({calculation.time})</span>
                                            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
                                                {calculation.finalValue.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                            </span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                                {calculation.type === "growth" ? "Doubling Time" : "Half-Life"}
                                            </span>
                                            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                                                {calculation.halfLifeOrDoublingTime.toFixed(2)} <span className="text-xs font-normal text-slate-300">periods</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 text-xs font-mono text-indigo-200 border-t border-indigo-800/80 flex justify-between items-center">
                                        <span>Total Net Delta: <strong>{calculation.totalChange >= 0 ? "+" : ""}{calculation.totalChange.toFixed(2)}</strong></span>
                                        <span>Change: <strong>{calculation.percentageChange >= 0 ? "+" : ""}{calculation.percentageChange.toFixed(2)}%</strong></span>
                                    </div>
                                </div>

                                {/* Dynamic Exponential SVG Graph */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Layers className="w-4 h-4 text-indigo-600" /> Exponential Trajectory Curve
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            {calculation.type === "growth" ? "Accelerating Upward" : "Decaying Downward"}
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-900 rounded-lg p-2 overflow-hidden flex items-center justify-center">
                                        <svg viewBox="0 0 400 180" className="w-full h-auto max-h-44">
                                            {/* Grid background lines */}
                                            <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                            <line x1="200" y1="0" x2="200" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                                            {/* Exponential Curve */}
                                            <path d={calculation.svgPathD} fill="none" stroke="#818cf8" strokeWidth="3" />

                                            {/* End Point Marker */}
                                            <circle cx={calculation.maxSvgX} cy={calculation.maxSvgY} r="5" fill="#10b981" />
                                            <text
                                                x={320}
                                                y={calculation.maxSvgY > 90 ? calculation.maxSvgY - 10 : calculation.maxSvgY + 15}
                                                fill="#34d399"
                                                fontSize="10"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                N({calculation.time})
                                            </text>
                                        </svg>
                                    </div>
                                </div>

                                {/* Derivation Steps */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Mathematical Derivation
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-800">
                                        {calculation.derivationSteps.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="font-bold text-indigo-600 select-none">[{idx + 1}]</span>
                                                <span className="break-all">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Precision Mathematics Engine
                        </span>
                        <span>TwisterTools Math Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Comprehensive Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Foundations of Exponential Growth and Decay
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        An <strong>exponential growth or decay model</strong> applies whenever the rate of change of a quantity is directly proportional to its current magnitude. In simple terms, as the quantity grows larger, its speed of growth accelerates; conversely, as a decaying substance shrinks, its absolute loss rate slows down over time.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-indigo-600" /> Discrete Compounding Model
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Modeled as <strong>N(t) = N₀(1 ± r)ᵗ</strong>, this formula calculates growth or loss occurring at fixed periodic intervals (such as annual compound interest, annual inflation rate adjustments, or monthly asset depreciation schedules).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-emerald-600" /> Continuous Compounding Model
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Expressed via Euler's number as <strong>N(t) = N₀e^(kt)</strong>, where <strong>e ≈ 2.71828</strong>. This accounts for unconstrained physical systems compounding at every infinitely small increment of time (e.g., radioactive isotope decay or cellular division).
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Defining Key Parameters in Exponential Mathematics
                        </h3>
                        <ul className="text-xs text-indigo-900 leading-relaxed space-y-2 list-disc list-inside">
                            <li><strong>Initial Quantity (N₀):</strong> The starting magnitude at time t = 0.</li>
                            <li><strong>Growth/Decay Rate (r or k):</strong> The percentage rate expressed as a decimal (e.g., 5% = 0.05).</li>
                            <li><strong>Time Horizon (t):</strong> The total duration or number of compounding steps evaluated.</li>
                            <li><strong>Growth/Decay Factor (1 ± r):</strong> The base multiplier per step in discrete calculations.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 2: Mathematical Proofs & Derivations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Derivations: Doubling Time & Half-Life
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding how to derive doubling time and half-life formulas is vital for advanced mathematics, physics, and financial modeling:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Proof 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" /> Continuous Doubling Time Derivation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                To find the exact time duration <em>t</em> required for an initial population <em>N₀</em> to double to <em>2N₀</em>:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. Set target value: 2N₀ = N₀ × e^(kt)</div>
                                <div>2. Divide by N₀: 2 = e^(kt)</div>
                                <div>3. Take natural log (ln): ln(2) = kt</div>
                                <div>4. Solve for t: <strong>t = ln(2) / k ≈ 0.6931 / k</strong></div>
                            </div>
                        </div>

                        {/* Proof 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 text-purple-600" /> Continuous Half-Life Derivation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                To determine the half-life <em>t</em> when a decaying mass reduces from <em>N₀</em> to <em>0.5N₀</em>:
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1.5 text-slate-800">
                                <div>1. Set target value: 0.5N₀ = N₀ × e^(-kt)</div>
                                <div>2. Divide by N₀: 0.5 = e^(-kt)</div>
                                <div>3. Take natural log (ln): ln(0.5) = -kt</div>
                                <div>4. Since ln(0.5) = -ln(2): -ln(2) = -kt</div>
                                <div>5. Simplify for t: <strong>t = ln(2) / k ≈ 0.6931 / k</strong></div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border border-amber-200 rounded-xl bg-amber-50 text-amber-900 space-y-1">
                        <h4 className="font-bold text-xs flex items-center gap-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600" /> The Rule of 72 Approximation
                        </h4>
                        <p className="text-xs leading-relaxed">
                            In finance, the <strong>Rule of 72</strong> provides a mental math shortcut for estimating discrete doubling time. By dividing 72 by the annual interest percentage rate (<em>t ≈ 72 / r</em>), investors quickly approximate doubling intervals without requiring natural logarithms.
                        </p>
                    </div>
                </section>

                {/* Card 3: Detailed Multi-Model Comparison Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Exponential & Compounding Model Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        This reference table highlights mathematical behaviors across growth, decay, discrete, and continuous models:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Model Type</th>
                                    <th className="p-3">Primary Equation</th>
                                    <th className="p-3">Base Factor Range</th>
                                    <th className="p-3">Doubling Time / Half-Life</th>
                                    <th className="p-3">Core Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Discrete Growth</td>
                                    <td className="p-3 font-mono text-xs">N(t) = N₀(1 + r)ᵗ</td>
                                    <td className="p-3 font-mono text-xs">Base &gt; 1</td>
                                    <td className="p-3 font-mono text-xs">t = log(2) / log(1 + r)</td>
                                    <td className="p-3">Stock Portfolio Returns, Inflation Rates</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-emerald-600">Continuous Growth</td>
                                    <td className="p-3 font-mono text-xs">N(t) = N₀e^(kt)</td>
                                    <td className="p-3 font-mono text-xs">Exponent k &gt; 0</td>
                                    <td className="p-3 font-mono text-xs">t = ln(2) / k</td>
                                    <td className="p-3">Bacterial Multiplication, Viral Spread</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-amber-600">Discrete Decay</td>
                                    <td className="p-3 font-mono text-xs">N(t) = N₀(1 - r)ᵗ</td>
                                    <td className="p-3 font-mono text-xs">0 &lt; Base &lt; 1</td>
                                    <td className="p-3 font-mono text-xs">t = log(0.5) / log(1 - r)</td>
                                    <td className="p-3">Vehicle Depreciation, Resale Valuation</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-purple-600">Continuous Decay</td>
                                    <td className="p-3 font-mono text-xs">N(t) = N₀e^(-kt)</td>
                                    <td className="p-3 font-mono text-xs">Exponent k &lt; 0</td>
                                    <td className="p-3 font-mono text-xs">t = ln(2) / k</td>
                                    <td className="p-3">Radioactive Carbon Dating, Drug Elimination</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Domain-Specific Real World Applications */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Domain-Specific Applications Across Disciplines
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Scale className="w-4 h-4 text-indigo-600" /> Economics & Finance
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Compound interest calculation, mortgage debt growth, inflation adjustments, and long-term asset value erosion utilize discrete exponential formulas.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-emerald-600" /> Medicine & Biology
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pharmacokinetics tracks blood concentration half-life for drug dosing, while microbiology models unconstrained bacterial colony growth.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-purple-600" /> Nuclear Physics
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Radiometric age estimation (such as Carbon-14 dating) measures remaining radioactive isotopes using continuous decay calculations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Step-by-Step User Instructions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Exponential Growth & Decay Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Mode</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Choose Growth or Decay, then toggle between Discrete or Continuous compounding models.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Enter Values</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Input Initial Value (N₀), Percentage Rate (%), and Number of Time Periods (t).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Analyze Curve</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Inspect final values, doubling time / half-life metrics, and the visual trajectory curve.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Export Data</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Copy formatted derivation text or export the calculated time-series schedule as CSV.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 6: Extended FAQ */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between discrete and continuous exponential growth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Discrete exponential growth applies compounding at distinct intervals using N(t) = N₀(1 + r)ᵗ. Continuous exponential growth assumes constant, unbroken compounding at every instant using Euler's number N(t) = N₀e^(kt).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate doubling time in exponential growth?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Doubling time is the duration required for a quantity to double. For continuous growth, doubling time t = ln(2) / k. For discrete growth, t = log(2) / log(1 + r).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is half-life and how is it derived?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Half-life is the time required for a decaying quantity to decrease to half its initial value. For continuous decay, half-life t = ln(2) / k. For discrete decay, t = log(0.5) / log(1 - r).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the Rule of 72 approximate doubling time?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Rule of 72 is a mental math shortcut that estimates doubling time by dividing 72 by the annual interest percentage rate (t ≈ 72 / r). It closely matches discrete compound interest calculations for annual interest rates between 4% and 12%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can an exponential model grow infinitely in real life?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Mathematically yes, but in physical systems exponential growth eventually hits natural constraints such as resource limits, leading to an S-shaped logistic growth curve.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}