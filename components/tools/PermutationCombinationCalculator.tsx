"use client";

import React, { useState, useMemo } from "react";
import {
    Calculator,
    Scale,
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
    TrendingUp,
    FileText,
    CheckCircle2,
    Binary,
    Layers,
    ListFilter,
    Lightbulb,
    Target
} from "lucide-react";

type CalcMode = "permutation" | "combination";

interface Preset {
    id: string;
    label: string;
    mode: CalcMode;
    n: string;
    r: string;
    repetition: boolean;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "lottery", label: "Lottery Pick (6 from 49)", mode: "combination", n: "49", r: "6", repetition: false, tag: "Lottery" },
    { id: "passcode", label: "4-Digit PIN Code", mode: "permutation", n: "10", r: "4", repetition: true, tag: "Security" },
    { id: "podium", label: "Podium Finishers (Top 3 of 8)", mode: "permutation", n: "8", r: "3", repetition: false, tag: "Sports" },
    { id: "committee", label: "Select Committee (3 from 10)", mode: "combination", n: "10", r: "3", repetition: false, tag: "Teams" },
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter("");
        return;
    }
    const cleaned = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
    setter(cleaned);
};

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_TWO = BigInt(2);
const MAX_N = BigInt(100);

// BigInt Factorial helper
function bigintFactorial(n: bigint): bigint {
    if (n < BIGINT_ZERO) return BIGINT_ZERO;
    if (n === BIGINT_ZERO || n === BIGINT_ONE) return BIGINT_ONE;
    let result = BIGINT_ONE;
    for (let i = BIGINT_TWO; i <= n; i++) {
        result *= i;
    }
    return result;
}

export default function PermutationCombinationCalculator() {
    // State
    const [mode, setMode] = useState<CalcMode>("combination");
    const [valN, setValN] = useState<string>("10");
    const [valR, setValR] = useState<string>("3");
    const [allowRepetition, setAllowRepetition] = useState<boolean>(false);

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Calculations
    const calculation = useMemo(() => {
        if (valN === "" || valR === "") {
            return { valid: false, message: "Please enter valid integers for both Total Items (n) and Sample Size (r)." };
        }

        const n = BigInt(valN);
        const r = BigInt(valR);

        if (n < BIGINT_ZERO || r < BIGINT_ZERO) {
            return { valid: false, message: "Values for n and r must be non-negative integers." };
        }

        if (!allowRepetition && r > n) {
            return { valid: false, message: "Sample size (r) cannot exceed total items (n) when repetition is not allowed." };
        }

        if (n > MAX_N) {
            return { valid: false, message: "To prevent browser memory overflow, total items (n) is capped at 100." };
        }

        let result = BIGINT_ZERO;
        let formulaStr = "";
        let steps: string[] = [];

        if (mode === "permutation") {
            if (allowRepetition) {
                // P_rep = n^r
                result = n ** r;
                formulaStr = "P_rep(n, r) = n^r";
                steps = [
                    `Formula: P_rep(n, r) = n^r`,
                    `Substitute: ${n}^${r}`,
                    `Calculation: ${n} multiplied by itself ${r} times`,
                    `Result = ${result.toLocaleString()}`
                ];
            } else {
                // P(n, r) = n! / (n - r)!
                const factN = bigintFactorial(n);
                const factNMinusR = bigintFactorial(n - r);
                result = factN / factNMinusR;
                formulaStr = "P(n, r) = n! / (n - r)!";
                steps = [
                    `Formula: P(n, r) = n! / (n - r)!`,
                    `Calculate Factorial n!: ${n}! = ${factN.toLocaleString()}`,
                    `Calculate Factorial (n - r)!: (${n} - ${r})! = ${n - r}! = ${factNMinusR.toLocaleString()}`,
                    `Divide: ${factN.toLocaleString()} / ${factNMinusR.toLocaleString()}`,
                    `Result = ${result.toLocaleString()}`
                ];
            }
        } else {
            // Combination
            if (allowRepetition) {
                // C_rep = (n + r - 1)! / (r! * (n - 1)!)
                const top = n + r - BIGINT_ONE;
                const factTop = bigintFactorial(top);
                const factR = bigintFactorial(r);
                const factNMinus1 = bigintFactorial(n - BIGINT_ONE);
                result = factTop / (factR * factNMinus1);
                formulaStr = "C_rep(n, r) = (n + r - 1)! / (r! × (n - 1)!)";
                steps = [
                    `Formula: C_rep(n, r) = (n + r - 1)! / (r! × (n - 1)!)`,
                    `Top Factorial (n + r - 1)!: (${n} + ${r} - 1)! = ${top}! = ${factTop.toLocaleString()}`,
                    `Bottom Factorial r!: ${r}! = ${factR.toLocaleString()}`,
                    `Bottom Factorial (n - 1)!: (${n} - 1)! = ${n - BIGINT_ONE}! = ${factNMinus1.toLocaleString()}`,
                    `Divide: ${factTop.toLocaleString()} / (${factR.toLocaleString()} × ${factNMinus1.toLocaleString()})`,
                    `Result = ${result.toLocaleString()}`
                ];
            } else {
                // C(n, r) = n! / (r! * (n - r)!)
                const factN = bigintFactorial(n);
                const factR = bigintFactorial(r);
                const factNMinusR = bigintFactorial(n - r);
                result = factN / (factR * factNMinusR);
                formulaStr = "C(n, r) = n! / (r! × (n - r)!)";
                steps = [
                    `Formula: C(n, r) = n! / (r! × (n - r)!)`,
                    `Factorial n!: ${n}! = ${factN.toLocaleString()}`,
                    `Factorial r!: ${r}! = ${factR.toLocaleString()}`,
                    `Factorial (n - r)!: (${n} - ${r})! = ${n - r}! = ${factNMinusR.toLocaleString()}`,
                    `Divide: ${factN.toLocaleString()} / (${factR.toLocaleString()} × ${factNMinusR.toLocaleString()})`,
                    `Result = ${result.toLocaleString()}`
                ];
            }
        }

        return {
            valid: true,
            n: valN,
            r: valR,
            result: result.toString(),
            formattedResult: result.toLocaleString(),
            formulaStr,
            steps
        };
    }, [mode, valN, valR, allowRepetition]);

    const applyPreset = (preset: Preset) => {
        setMode(preset.mode);
        setValN(preset.n);
        setValR(preset.r);
        setAllowRepetition(preset.repetition);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setMode("combination");
        setValN("10");
        setValR("3");
        setAllowRepetition(false);
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let summaryText = `Permutation & Combination Calculation Summary (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Type: ${mode.toUpperCase()}\n`;
        summaryText += `Total Items (n): ${valN}\n`;
        summaryText += `Sample Size (r): ${valR}\n`;
        summaryText += `Repetition Allowed: ${allowRepetition ? "Yes" : "No"}\n`;
        summaryText += `Formula: ${calculation.formulaStr}\n`;
        summaryText += `Total Possibilities: ${calculation.formattedResult}\n`;
        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/permutation-combination-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        const headers = ["Parameter", "Value"];
        const rows: string[][] = [
            ["Calculation Type", mode],
            ["Total Items (n)", valN],
            ["Sample Size (r)", valR],
            ["Repetition Allowed", allowRepetition ? "Yes" : "No"],
            ["Formula Used", calculation.formulaStr || ""],
            ["Total Combinations/Permutations", calculation.result || ""]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `permutation_combination_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Permutation & Combination Calculator",
        "url": "https://twistertools.com/tools/calculators/permutation-combination-calculator",
        "description": "Calculate permutations nPr and combinations nCr with or without repetition using exact BigInt mathematical precision.",
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
                "name": "What is the difference between permutations and combinations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The fundamental difference lies in sequence order. Permutations (nPr) require a specific order where arrangements matter (such as password PINs or race rankings). Combinations (nCr) count unique subsets where order is irrelevant (such as lottery draws or team selections)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the formula for Permutation nPr?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The formula for permutations without repetition is P(n, r) = n! / (n - r)!. When repetition is allowed, the formula simplifies to P_rep(n, r) = n^r."
                }
            },
            {
                "@type": "Question",
                "name": "What is the formula for Combination nCr?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The formula for combinations without repetition is C(n, r) = n! / (r! * (n - r)!). When repetition is allowed, the formula becomes C_rep(n, r) = (n + r - 1)! / (r! * (n - 1)!)."
                }
            },
            {
                "@type": "Question",
                "name": "Why do combinations yield smaller numbers than permutations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Combinations produce smaller totals because they eliminate duplicate arrangements of identical items. In permutations, selecting items A and B is distinct from B and A. In combinations, {A, B} counts as a single grouping."
                }
            },
            {
                "@type": "Question",
                "name": "How is factorial (n!) calculated in combinatorics?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A factorial (n!) is the product of all positive integers less than or equal to n. For example, 5! = 5 x 4 x 3 x 2 x 1 = 120. By mathematical convention, 0! is always equal to 1."
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
                {/* Left Workspace Panel: Controls & Inputs */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Combinatorics Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Calculation Type
                                </label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => { setMode("combination"); setActivePresetId(null); }}
                                        className={`py-2.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${mode === "combination"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Combination (nCr)
                                        <span className="block text-[10px] font-normal opacity-80 mt-0.5">Order DOES NOT matter</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode("permutation"); setActivePresetId(null); }}
                                        className={`py-2.5 px-3 text-xs font-bold rounded-lg transition cursor-pointer ${mode === "permutation"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Permutation (nPr)
                                        <span className="block text-[10px] font-normal opacity-80 mt-0.5">Order DOES matter</span>
                                    </button>
                                </div>
                            </div>

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Total Items (n)
                                    </label>
                                    <input
                                        type="text"
                                        value={valN}
                                        onChange={(e) => { handleNumberInput(e, setValN); setActivePresetId(null); }}
                                        placeholder="e.g. 10"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 block">Total pool size</span>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                        Sample Size (r)
                                    </label>
                                    <input
                                        type="text"
                                        value={valR}
                                        onChange={(e) => { handleNumberInput(e, setValR); setActivePresetId(null); }}
                                        placeholder="e.g. 3"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 block">Items selected</span>
                                </div>
                            </div>

                            {/* Repetition Checkbox */}
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="space-y-0.5">
                                    <label htmlFor="repetition-toggle" className="text-xs font-bold text-slate-800 cursor-pointer block">
                                        Allow Item Repetition / Replacement
                                    </label>
                                    <p className="text-[11px] text-slate-500">
                                        Can individual elements be chosen more than once?
                                    </p>
                                </div>
                                <input
                                    id="repetition-toggle"
                                    type="checkbox"
                                    checked={allowRepetition}
                                    onChange={(e) => { setAllowRepetition(e.target.checked); setActivePresetId(null); }}
                                    className="w-5 h-5 text-indigo-600 rounded-md focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                />
                            </div>

                            {/* Quick Presets */}
                            <div className="pt-2 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets & Use Cases
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
                                                className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-xs whitespace-nowrap cursor-pointer ${isActive
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

                {/* Right Workspace Panel: Results & Derivation */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Solution & Mathematical Breakdown
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {mode === "combination" ? "nCr" : "nPr"}
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
                                {/* Hero Result Display */}
                                <div className="p-5 rounded-2xl border bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Scale className="w-4 h-4 text-indigo-400" /> Total Possible Outcomes
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                            {allowRepetition ? "With Repetition" : "Without Repetition"}
                                        </span>
                                    </div>

                                    <div className="text-3xl sm:text-5xl font-black text-white wrap-break-word">
                                        {calculation.formattedResult}
                                    </div>

                                    <div className="pt-2 text-xs font-mono text-indigo-200 border-t border-indigo-800/80 flex justify-between items-center">
                                        <span>Formula: <strong>{calculation.formulaStr}</strong></span>
                                        <span>n={valN}, r={valR}</span>
                                    </div>
                                </div>

                                {/* Step-by-Step Mathematical Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Step-by-Step Derivation
                                    </h3>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs text-slate-800">
                                        {calculation.steps?.map((step, idx) => (
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
                            BigInt Exact Precision Engine
                        </span>
                        <span>TwisterTools Math Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Fundamental Mathematical Definitions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Core Principles of Permutations and Combinations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In discrete mathematics, probability theory, and computer science, <strong>permutations</strong> and <strong>combinations</strong> are foundational techniques used to calculate the size of sample spaces and evaluate total possibilities. The primary rule that governs which calculation to choose is whether the <strong>order of selection matters</strong>.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <ListFilter className="w-4 h-4 text-indigo-600" /> Permutations (nPr) — Order is Critical
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A permutation is an ordered arrangement of items. Changing the sequence creates a completely distinct outcome. For example, a security lock code set to 4-1-8 is entirely different from 8-1-4, even though both share the exact same digits.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-emerald-600" /> Combinations (nCr) — Order Does Not Matter
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A combination is an unordered selection or subset. Reordering the elements does not create a new outcome. For instance, choosing 3 fruit toppings for an ice cream sundae yields the exact same snack regardless of which fruit is added first.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Factorials (n!) and Mathematical Limits
                        </h3>
                        <p className="text-xs text-indigo-900 leading-relaxed">
                            Both formulas rely heavily on factorials. A factorial, denoted by <strong>n!</strong>, multiplies an integer by every positive integer below it down to 1 (e.g., 5! = 5 x 4 x 3 x 2 x 1 = 120). By standard mathematical definition, <strong>0! = 1</strong>. Standard JavaScript numeric types cap precision at 15 digits, but TwisterTools utilizes native JavaScript <strong>BigInt</strong> architecture to deliver 100% exact, unrounded calculations up to 100 factorial without scientific notation distortion.
                        </p>
                    </div>
                </section>

                {/* Card 2: Formulas Reference Matrix Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Combinatorics Formulas Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to the table below to select the appropriate mathematical formula based on sequence importance and whether items can be repeated or replaced during selection:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Repetition</th>
                                    <th className="p-3">Formula</th>
                                    <th className="p-3">Primary Use Cases</th>
                                    <th className="p-3">Sample Result (n=5, r=3)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Permutation (nPr)</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">No</span></td>
                                    <td className="p-3 font-mono text-xs">P(n, r) = n! / (n - r)!</td>
                                    <td className="p-3">Race podium positions, election seating order</td>
                                    <td className="p-3 font-bold text-slate-900">60</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">Permutation (nPr)</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Yes</span></td>
                                    <td className="p-3 font-mono text-xs">P_rep(n, r) = n^r</td>
                                    <td className="p-3">Digital lock PINs, password string permutations</td>
                                    <td className="p-3 font-bold text-slate-900">125</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">Combination (nCr)</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">No</span></td>
                                    <td className="p-3 font-mono text-xs">C(n, r) = n! / (r! × (n - r)!)</td>
                                    <td className="p-3">Lottery tickets, poker hand hands, committees</td>
                                    <td className="p-3 font-bold text-slate-900">10</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">Combination (nCr)</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Yes</span></td>
                                    <td className="p-3 font-mono text-xs">C_rep(n, r) = (n + r - 1)! / (r! × (n - 1)!)</td>
                                    <td className="p-3">Sampling with replacement, coin distribution</td>
                                    <td className="p-3 font-bold text-slate-900">35</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Real World Worked Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Real-World Step-by-Step Worked Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how permutations and combinations are applied across practical domains including cybersecurity, sports, and gaming:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 1: Security PIN Cracking Complexity</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Permutation with Repetition</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Calculate the total number of unique password possibilities for a 4-digit security PIN using digits 0 through 9 where numbers can be repeated.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>Total Digits (n) = 10</div>
                                <div>PIN Length (r) = 4</div>
                                <div>Formula = n^r = 10^4</div>
                                <div>Total Possibilities = <strong>10,000 PINs</strong></div>
                            </div>
                        </div>

                        {/* Example B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 2: Major Lottery Jackpot Odds</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Combination without Repetition</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Calculate the total combination count when choosing 6 winning numbers from a total pool of 49 numbers in a national lottery draw.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>Total Pool (n) = 49</div>
                                <div>Drawn Numbers (r) = 6</div>
                                <div>Formula = 49! / (6! × 43!)</div>
                                <div>Total Combinations = <strong>13,983,816 tickets</strong></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Instructions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Combinatorics Calculator
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Calculation Mode</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Choose Combination (nCr) if order is irrelevant, or Permutation (nPr) if arrangement sequence matters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Enter n and r Values</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Input the total pool size (n) and sample count (r). Inputs automatically sanitize invalid characters.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Toggle Item Repetition</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Check the repetition toggle if chosen elements can be selected multiple times in a single set.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Export & Review Math</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Review the full factorial derivation steps, copy the summary, or download a CSV report for spreadsheet analysis.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Frequently Asked Questions (FAQ) */}
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
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the fundamental difference between permutations and combinations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The fundamental difference lies in sequence order. Permutations (nPr) require a specific order where arrangements matter (such as password PINs or race rankings). Combinations (nCr) count unique subsets where order is irrelevant (such as lottery draws or team selections).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the formula for Permutation nPr?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The formula for permutations without repetition is P(n, r) = n! / (n - r)!. When repetition is allowed, the formula simplifies to P_rep(n, r) = n^r.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the formula for Combination nCr?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The formula for combinations without repetition is C(n, r) = n! / (r! * (n - r)!). When repetition is allowed, the formula becomes C_rep(n, r) = (n + r - 1)! / (r! * (n - 1)!).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do combinations yield smaller numbers than permutations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Combinations produce smaller totals because they eliminate duplicate arrangements of identical items. In permutations, selecting items A and B is distinct from B and A. In combinations, {"{A, B}"} counts as a single grouping.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is factorial (n!) calculated in combinatorics?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A factorial (n!) is the product of all positive integers less than or equal to n. For example, 5! = 5 x 4 x 3 x 2 x 1 = 120. By mathematical convention, 0! is always equal to 1.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}