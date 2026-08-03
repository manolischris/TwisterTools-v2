"use client";

import React, { useState, useMemo } from "react";
import {
    Calculator,
    BarChart3,
    Copy,
    Check,
    Download,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Layers,
    Sparkles,
    ShieldCheck,
    Sliders,
    Table,
    TrendingUp,
    FileText,
    CheckCircle2,
    Sigma
} from "lucide-react";

type DatasetMode = "sample" | "population";

interface DatasetPreset {
    id: string;
    label: string;
    data: string;
    mode: DatasetMode;
    tag: string;
}

const PRESETS: DatasetPreset[] = [
    { id: "test-scores", label: "Exam Scores (Class Sample)", data: "78, 85, 92, 64, 88, 95, 72, 81, 90, 84", mode: "sample", tag: "Education" },
    { id: "daily-sales", label: "Daily Revenue ($)", data: "1250, 1400, 980, 1150, 1600, 1320, 1480", mode: "sample", tag: "Finance" },
    { id: "sensor-readings", label: "Sensor Temps (°C)", data: "22.1, 22.4, 21.9, 22.3, 22.0, 22.2, 22.5", mode: "population", tag: "Engineering" },
    { id: "small-set", label: "Simple Numbers (1 to 5)", data: "1, 2, 3, 4, 5", mode: "sample", tag: "Basic" },
];

export default function StandardDeviationCalculator() {
    // Input & Mode States
    const [rawInput, setRawInput] = useState<string>("12, 15, 18, 22, 25, 30, 35");
    const [datasetMode, setDatasetMode] = useState<DatasetMode>("sample");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Dynamic Calculation Engine
    const calculation = useMemo(() => {
        // Parse numbers from comma, space, or newline separated strings
        const tokens = rawInput
            .split(/[\s,\n]+/)
            .map((t) => t.trim())
            .filter((t) => t !== "");

        const numbers: number[] = [];
        const invalidTokens: string[] = [];

        for (const token of tokens) {
            const num = Number(token);
            if (!isNaN(num)) {
                numbers.push(num);
            } else {
                invalidTokens.push(token);
            }
        }

        const count = numbers.length;

        if (count < 2) {
            return {
                valid: false,
                message: "Please enter at least 2 valid numeric values to compute standard deviation and variance.",
                invalidTokens
            };
        }

        // 1. Mean (μ or x̄)
        const sum = numbers.reduce((acc, curr) => acc + curr, 0);
        const mean = sum / count;

        // 2. Deviations & Squared Deviations
        const rows = numbers.map((val) => {
            const deviation = val - mean;
            const squaredDev = deviation * deviation;
            return {
                val,
                deviation,
                squaredDev
            };
        });

        // 3. Sum of Squared Differences (SS)
        const sumOfSquares = rows.reduce((acc, r) => acc + r.squaredDev, 0);

        // 4. Variance (s² for Sample using N-1, σ² for Population using N)
        const divisor = datasetMode === "sample" ? count - 1 : count;
        const variance = sumOfSquares / divisor;

        // 5. Standard Deviation (s or σ)
        const stdDev = Math.sqrt(variance);

        // 6. Additional Descriptive Statistics
        const sorted = [...numbers].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const range = max - min;
        const marginOfError = datasetMode === "sample" ? (1.96 * (stdDev / Math.sqrt(count))) : null; // 95% CI
        const coefficientOfVariation = (stdDev / mean) * 100; // CV%

        // Step-by-step breakdown generator
        const steps: string[] = [
            `Count (N) = ${count} items.`,
            `Sum (∑x) = ${sum.toFixed(4)}.`,
            `Mean (${datasetMode === "sample" ? "x̄" : "μ"}) = ${sum.toFixed(4)} ÷ ${count} = ${mean.toFixed(4)}.`,
            `Sum of Squared Deviations (SS = ∑(x - mean)²) = ${sumOfSquares.toFixed(4)}.`,
            `Degrees of Freedom / Divisor = ${divisor} (${datasetMode === "sample" ? "N - 1 for Sample" : "N for Population"}).`,
            `Variance (${datasetMode === "sample" ? "s²" : "σ²"}) = ${sumOfSquares.toFixed(4)} ÷ ${divisor} = ${variance.toFixed(4)}.`,
            `Standard Deviation (${datasetMode === "sample" ? "s" : "σ"}) = √(${variance.toFixed(4)}) = ${stdDev.toFixed(4)}.`
        ];

        return {
            valid: true,
            count,
            sum: Number(sum.toFixed(4)),
            mean: Number(mean.toFixed(4)),
            sumOfSquares: Number(sumOfSquares.toFixed(4)),
            divisor,
            variance: Number(variance.toFixed(4)),
            stdDev: Number(stdDev.toFixed(4)),
            min,
            max,
            range: Number(range.toFixed(4)),
            marginOfError: marginOfError ? Number(marginOfError.toFixed(4)) : null,
            cv: Number(coefficientOfVariation.toFixed(2)),
            rows,
            steps,
            invalidTokens
        };
    }, [rawInput, datasetMode]);

    const applyPreset = (preset: DatasetPreset) => {
        setRawInput(preset.data);
        setDatasetMode(preset.mode);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setRawInput("12, 15, 18, 22, 25, 30, 35");
        setDatasetMode("sample");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let text = `Standard Deviation & Variance Report (TwisterTools)\n`;
        text += `--------------------------------------------------\n`;
        text += `Dataset Type: ${datasetMode.toUpperCase()}\n`;
        text += `Count (N): ${calculation.count}\n`;
        text += `Mean: ${calculation.mean}\n`;
        text += `Standard Deviation (${datasetMode === "sample" ? "s" : "σ"}): ${calculation.stdDev}\n`;
        text += `Variance (${datasetMode === "sample" ? "s²" : "σ²"}): ${calculation.variance}\n`;
        text += `Sum of Squares (SS): ${calculation.sumOfSquares}\n`;
        text += `Min / Max / Range: ${calculation.min} / ${calculation.max} / ${calculation.range}\n`;
        text += `Coeff. of Variation: ${calculation.cv}%\n`;
        text += `--------------------------------------------------\n`;
        text += `Calculated at twistertools.com/tools/calculators/standard-deviation-calculator`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        const headers = ["Value (x)", "Deviation (x - Mean)", "Squared Deviation (x - Mean)^2"];
        const dataRows = (calculation.rows ?? []).map((r) => [
            `"${r.val}"`,
            `"${r.deviation.toFixed(4)}"`,
            `"${r.squaredDev.toFixed(4)}"`
        ]);

        const summaryRows = [
            [],
            ["Summary Metric", "Value"],
            ["Dataset Mode", datasetMode],
            ["Count (N)", `${calculation.count}`],
            ["Mean", `${calculation.mean}`],
            ["Sum of Squares", `${calculation.sumOfSquares}`],
            ["Variance", `${calculation.variance}`],
            ["Standard Deviation", `${calculation.stdDev}`],
            ["Range", `${calculation.range}`],
            ["Coeff of Variation (%)", `${calculation.cv}%`]
        ];

        const csvContent = [
            headers.join(","),
            ...dataRows.map((r) => r.join(",")),
            ...summaryRows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `standard_deviation_analysis.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Standard Deviation & Variance Calculator",
        "url": "https://twistertools.com/tools/calculators/standard-deviation-calculator",
        "description": "Free online Standard Deviation Calculator. Computes sample and population standard deviation, variance, mean, sum of squares, and step-by-step statistical derivations.",
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
                "name": "What is the difference between Sample and Population Standard Deviation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sample standard deviation (s) estimates variability in a larger population using a representative subset, dividing the sum of squared differences by (N - 1) Bessel's correction. Population standard deviation (σ) is used when you have complete data for every member of the entire group, dividing by N."
                }
            },
            {
                "@type": "Question",
                "name": "Why do we divide by N - 1 for sample standard deviation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Dividing by N - 1 is known as Bessel's correction. It corrects the bias in the estimation of the population variance, compensating for the fact that sample values tend to be closer to the sample mean than to the true population mean."
                }
            },
            {
                "@type": "Question",
                "name": "What is the relationship between Variance and Standard Deviation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Variance measures the average squared deviation from the mean, expressed in squared units. Standard deviation is simply the square root of variance, returning the dispersion metric back into the original units of measurement."
                }
            },
            {
                "@type": "Question",
                "name": "What does a low vs high Standard Deviation indicate?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A low standard deviation indicates that data points cluster tightly around the mean, representing high consistency. A high standard deviation means data points are spread widely across a broad range of values."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Coefficient of Variation (CV)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Coefficient of Variation (CV) is the ratio of standard deviation to the mean expressed as a percentage. It measures relative variability, allowing you to compare dispersion between datasets with different units or scales."
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
                {/* Left Workspace Panel: Input & Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Data Input & Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Calculation Mode Selector */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Dataset Type / Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setDatasetMode("sample")}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition ${datasetMode === "sample"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Sample (s, s²) [N-1]
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDatasetMode("population")}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition ${datasetMode === "population"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Population (σ, σ²) [N]
                                    </button>
                                </div>
                            </div>

                            {/* Raw Data Input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Raw Dataset Values (Comma, space, or newline separated)
                                </label>
                                <textarea
                                    value={rawInput}
                                    onChange={(e) => {
                                        setRawInput(e.target.value);
                                        setActivePresetId(null);
                                    }}
                                    rows={7}
                                    placeholder="Enter numbers e.g. 10, 20, 30, 40..."
                                    className="w-full p-3.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 resize-y"
                                />
                                {calculation.invalidTokens && calculation.invalidTokens.length > 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        Ignored non-numeric tokens: {calculation.invalidTokens.join(", ")}
                                    </p>
                                )}
                            </div>

                            {/* Presets */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Sample Datasets
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
                                                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${isActive
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
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            disabled={!calculation.valid}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Report" : "Copy Report"}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={!calculation.valid}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm transition border border-indigo-200"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Dynamic Output & Detailed Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Statistical Results
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                Mode: {datasetMode}
                            </span>
                        </div>

                        {!calculation.valid ? (
                            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4 text-amber-600" /> Action Required
                                </h3>
                                <p className="text-xs leading-relaxed">{calculation.message}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Primary Result Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Standard Deviation Box */}
                                    <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                                <Sigma className="w-4 h-4 text-indigo-400" /> Standard Deviation ({datasetMode === "sample" ? "s" : "σ"})
                                            </span>
                                        </div>
                                        <div className="mt-3 text-4xl font-black text-white">
                                            {calculation.stdDev}
                                        </div>
                                        <p className="mt-2 text-[11px] text-indigo-200">
                                            Square root of variance in original units
                                        </p>
                                    </div>

                                    {/* Variance Box */}
                                    <div className="p-5 rounded-2xl border bg-slate-900 text-white shadow-md">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                                <BarChart3 className="w-4 h-4 text-emerald-400" /> Variance ({datasetMode === "sample" ? "s²" : "σ²"})
                                            </span>
                                        </div>
                                        <div className="mt-3 text-4xl font-black text-emerald-400">
                                            {calculation.variance}
                                        </div>
                                        <p className="mt-2 text-[11px] text-slate-300">
                                            Sum of Squares ÷ {calculation.divisor}
                                        </p>
                                    </div>
                                </div>

                                {/* Secondary Key Metrics Matrix */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Count (N)</span>
                                        <span className="text-lg font-bold text-slate-900">{calculation.count}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Mean ({datasetMode === "sample" ? "x̄" : "μ"})</span>
                                        <span className="text-lg font-bold text-slate-900">{calculation.mean}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Sum of Squares (SS)</span>
                                        <span className="text-lg font-bold text-slate-900">{calculation.sumOfSquares}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Coeff. of Var. (CV)</span>
                                        <span className="text-lg font-bold text-indigo-600">{calculation.cv}%</span>
                                    </div>
                                </div>

                                {/* Range & Extreme Values Bar */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                    <span className="text-slate-600">Minimum: <strong className="text-slate-900">{calculation.min}</strong></span>
                                    <span className="text-slate-600">Maximum: <strong className="text-slate-900">{calculation.max}</strong></span>
                                    <span className="text-slate-600">Range: <strong className="text-indigo-600">{calculation.range}</strong></span>
                                </div>

                                {/* Step-by-Step Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Calculation Step-by-Step
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-800">
                                        {calculation.steps?.map((step, idx) => (
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="font-bold text-indigo-600 select-none">[{idx + 1}]</span>
                                                <span>{step}</span>
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
                            Client-Side Calculation
                        </span>
                        <span>TwisterTools Stats Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT */}
            <div className="space-y-6">

                {/* Card 1: Core Mathematical Definitions & Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Standard Deviation and Variance
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In statistics, <strong>standard deviation</strong> and <strong>variance</strong> are fundamental measures of dispersion that quantify the spread of values in a dataset relative to their central mean. While the mean provides the central tendency, dispersion metrics reveal how tightly clustered or widely scattered individual observations are.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                        {/* Sample SD Formula Card */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Sigma className="w-4 h-4 text-indigo-600" /> Sample Standard Deviation Formula
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Applied when analyzing a representative subset of a larger population. Uses Bessel's correction ($N - 1$) to ensure an unbiased estimator.
                            </p>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-center text-indigo-900">
                                s = sqrt(sum((x_i - x̄)^2) / (N - 1))
                            </div>
                        </div>

                        {/* Population SD Formula Card */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <BarChart3 className="w-4 h-4 text-emerald-600" /> Population Standard Deviation Formula
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Applied when complete measurements are recorded for every single member of an entire target population ($N$).
                            </p>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-center text-emerald-900">
                                sigma = sqrt(sum((x_i - mu)^2) / N)
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Why Use Bessel's Correction ($N - 1$)?
                        </h3>
                        <p className="text-xs text-indigo-900 leading-relaxed">
                            When calculating sample variance, using $N$ as the denominator tends to systematically underestimate population variance because sample points are naturally drawn closer to the sample mean than to the true, unknown population mean. Replacing $N$ with $N - 1$ adjusts for this degrees-of-freedom constraint, producing an unbiased statistical estimate.
                        </p>
                    </div>
                </section>

                {/* Card 2: Empirical Rule (68-95-99.7) & Distribution Reference */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Empirical Rule (68-95-99.7 Rule) in Normal Distributions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        For standard bell-shaped (normal) distributions, standard deviation provides immediate probability boundaries for data spread:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-center">
                            <div className="text-2xl font-black text-indigo-600">68.27%</div>
                            <h3 className="font-bold text-slate-900 text-xs">Within ±1 Standard Deviation</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Approximately 68% of all data points fall within $\mu \pm 1\sigma$.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-center">
                            <div className="text-2xl font-black text-indigo-600">95.45%</div>
                            <h3 className="font-bold text-slate-900 text-xs">Within ±2 Standard Deviations</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Approximately 95% of observations fall within $\mu \pm 2\sigma$.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2 text-center">
                            <div className="text-2xl font-black text-indigo-600">99.73%</div>
                            <h3 className="font-bold text-slate-900 text-xs">Within ±3 Standard Deviations</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Over 99.7% of all sample data falls within $\mu \pm 3\sigma$.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Worked Example Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Calculation Breakdown Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To demonstrate the underlying algorithm, consider the dataset: <strong>[4, 8, 6, 5, 12]</strong>. Mean (x̄) = 35 / 5 = 7.0.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Data Point ($x_i$)</th>
                                    <th className="p-3">Mean (x̄)</th>
                                    <th className="p-3">Deviation (x_i - x̄)</th>
                                    <th className="p-3">Squared Deviation ((x_i - x̄)^2)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">4</td>
                                    <td className="p-3">7.0</td>
                                    <td className="p-3 font-mono">-3.0</td>
                                    <td className="p-3 font-mono">9.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">8</td>
                                    <td className="p-3">7.0</td>
                                    <td className="p-3 font-mono">+1.0</td>
                                    <td className="p-3 font-mono">1.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">6</td>
                                    <td className="p-3">7.0</td>
                                    <td className="p-3 font-mono">-1.0</td>
                                    <td className="p-3 font-mono">1.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">5</td>
                                    <td className="p-3">7.0</td>
                                    <td className="p-3 font-mono">-2.0</td>
                                    <td className="p-3 font-mono">4.0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">12</td>
                                    <td className="p-3">7.0</td>
                                    <td className="p-3 font-mono">+5.0</td>
                                    <td className="p-3 font-mono">25.0</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t border-slate-200">
                                <tr>
                                    <td className="p-3">Sum = 35.0</td>
                                    <td className="p-3">-</td>
                                    <td className="p-3">Sum = 0.0</td>
                                    <td className="p-3 font-mono text-indigo-600">SS = 40.0</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs text-slate-800">
                        <div>Sample Variance ($s^2$) = $40.0 \div (5 - 1) = 10.0$</div>
                        <div>Sample Standard Deviation (s) = sqrt(10.0) = 3.1623</div>
                    </div>
                </section>

                {/* Card 4: How to Use */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use This Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Dataset Type</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Toggle between Sample ($N-1$) and Population ($N$) mode depending on whether your dataset represents a subset or a complete population.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Input Numerical Data</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Paste or type values into the text area separated by commas, spaces, or line breaks. Or click one of the quick sample presets.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Review Results & Steps</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Instantly inspect the standard deviation, variance, mean, sum of squares, coefficient of variation, and complete step-by-step derivation.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Export Analysis</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Copy the plain-text summary report to your clipboard or export the detailed calculation matrix directly to a CSV spreadsheet.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static FAQ Cards (No Accordion State) */}
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
                                What is the difference between Sample and Population Standard Deviation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Sample standard deviation ($s$) estimates variability in a larger population using a representative subset, dividing the sum of squared differences by ($N - 1$) Bessel's correction. Population standard deviation ($\sigma$) is used when you have complete data for every member of the entire group, dividing by $N$.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do we divide by N - 1 for sample standard deviation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Dividing by $N - 1$ is known as Bessel's correction. It corrects the bias in the estimation of the population variance, compensating for the fact that sample values tend to be closer to the sample mean than to the true population mean.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the relationship between Variance and Standard Deviation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Variance measures the average squared deviation from the mean, expressed in squared units. Standard deviation is simply the square root of variance, returning the dispersion metric back into the original units of measurement.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does a low vs high Standard Deviation indicate?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A low standard deviation indicates that data points cluster tightly around the mean, representing high consistency. A high standard deviation means data points are spread widely across a broad range of values.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Coefficient of Variation (CV)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Coefficient of Variation (CV) is the ratio of standard deviation to the mean expressed as a percentage (CV = (s / x̄) x 100). It measures relative variability, allowing you to compare dispersion between datasets with different units or scales.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}