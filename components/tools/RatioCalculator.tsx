"use client";

import React, { useState, useMemo } from "react";
import {
    Percent,
    Calculator,
    Scale,
    Copy,
    Check,
    Download,
    RefreshCw,
    HelpCircle,
    BookOpen,
    Layers,
    Lightbulb,
    Sparkles,
    ShieldCheck,
    ArrowRightLeft,
    Sliders,
    PieChart,
    Maximize2,
    Minimize2,
    Table,
    TrendingUp,
    FileText,
    CheckCircle2
} from "lucide-react";

type ProportionMode = "find-x" | "simplify" | "scale" | "share";

interface Preset {
    id: string;
    label: string;
    mode: ProportionMode;
    valA: string;
    valB: string;
    valC: string;
    valD: string;
    totalShare: string;
    tag: string;
}

const PRESETS: Preset[] = [
    { id: "aspect-16-9", label: "Aspect Ratio 16:9 -> 1080p", mode: "find-x", valA: "16", valB: "9", valC: "1920", valD: "", totalShare: "100", tag: "Aspect Ratio" },
    { id: "simplify-fraction", label: "Simplify 24:36 Ratio", mode: "simplify", valA: "24", valB: "36", valC: "", valD: "", totalShare: "100", tag: "Simplify" },
    { id: "scale-recipe", label: "Scale Recipe 2:3 (Batch 5x)", mode: "scale", valA: "2", valB: "3", valC: "5", valD: "", totalShare: "100", tag: "Scaling" },
    { id: "profit-share", label: "Share $1,500 in 3:2 Ratio", mode: "share", valA: "3", valB: "2", valC: "", valD: "", totalShare: "1500", tag: "Sharing" },
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
    // Allow digits and a single decimal point, removing leading zeros
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    setter(cleaned);
};

// Greatest Common Divisor helper function
function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export default function RatioCalculator() {
    // Mode State
    const [mode, setMode] = useState<ProportionMode>("find-x");

    // Input States
    const [valA, setValA] = useState<string>("16");
    const [valB, setValB] = useState<string>("9");
    const [valC, setValC] = useState<string>("1920");
    const [valD, setValD] = useState<string>("");
    const [totalShare, setTotalShare] = useState<string>("1000");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);

    // Dynamic Proportion Calculation Logic
    const calculation = useMemo(() => {
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const numC = parseFloat(valC);
        const numD = parseFloat(valD);
        const numTotal = parseFloat(totalShare);

        if (mode === "find-x") {
            // Formula A/B = C/D
            const countProvided = [valA, valB, valC, valD].filter((v) => v !== "" && !isNaN(parseFloat(v))).length;
            if (countProvided !== 3) {
                return { valid: false, message: "Provide exactly 3 values to solve for the missing variable X." };
            }

            let solvedValue = 0;
            let missingVar = "";
            let steps: string[] = [];

            if (valA === "") {
                missingVar = "A";
                solvedValue = (numB * numC) / numD;
                steps = [`Formula: A / B = C / D`, `A = (B × C) / D`, `A = (${numB} × ${numC}) / ${numD}`, `A = ${solvedValue}`];
            } else if (valB === "") {
                missingVar = "B";
                solvedValue = (numA * numD) / numC;
                steps = [`Formula: A / B = C / D`, `B = (A × D) / C`, `B = (${numA} × ${numD}) / ${numC}`, `B = ${solvedValue}`];
            } else if (valC === "") {
                missingVar = "C";
                solvedValue = (numA * numD) / numB;
                steps = [`Formula: A / B = C / D`, `C = (A × D) / B`, `C = (${numA} × ${numD}) / ${numB}`, `C = ${solvedValue}`];
            } else {
                missingVar = "D";
                solvedValue = (numB * numC) / numA;
                steps = [`Formula: A / B = C / D`, `D = (B × C) / A`, `D = (${numB} × ${numC}) / ${numA}`, `D = ${solvedValue}`];
            }

            const finalA = valA === "" ? solvedValue : numA;
            const finalB = valB === "" ? solvedValue : numB;
            const finalC = valC === "" ? solvedValue : numC;
            const finalD = valD === "" ? solvedValue : numD;

            return {
                valid: true,
                missingVar,
                solvedValue: Number(solvedValue.toFixed(4)),
                finalA: Number(finalA.toFixed(4)),
                finalB: Number(finalB.toFixed(4)),
                finalC: Number(finalC.toFixed(4)),
                finalD: Number(finalD.toFixed(4)),
                steps
            };
        } else if (mode === "simplify") {
            if (isNaN(numA) || isNaN(numB) || numA <= 0 || numB <= 0) {
                return { valid: false, message: "Enter positive numbers for both Term A and Term B." };
            }

            // Handle integer decimal conversion for GCD
            const precision = 10000;
            const intA = Math.round(numA * precision);
            const intB = Math.round(numB * precision);
            const commonDivisor = gcd(intA, intB);

            const simpleA = (intA / commonDivisor);
            const simpleB = (intB / commonDivisor);
            const decimalVal = numA / numB;

            return {
                valid: true,
                simpleA,
                simpleB,
                decimalVal: Number(decimalVal.toFixed(6)),
                gcd: commonDivisor / precision,
                steps: [
                    `Input Ratio: ${numA} : ${numB}`,
                    `Divide both terms by Greatest Common Divisor (${commonDivisor / precision})`,
                    `Simplified Ratio: ${simpleA} : ${simpleB}`,
                    `Decimal Equivalent: ${decimalVal.toFixed(6)}`
                ]
            };
        } else if (mode === "scale") {
            const factor = parseFloat(valC);
            if (isNaN(numA) || isNaN(numB) || isNaN(factor)) {
                return { valid: false, message: "Enter valid numbers for Ratio Terms (A, B) and Scale Factor." };
            }

            const scaledA = numA * factor;
            const scaledB = numB * factor;

            return {
                valid: true,
                factor,
                scaledA: Number(scaledA.toFixed(4)),
                scaledB: Number(scaledB.toFixed(4)),
                steps: [
                    `Original Ratio: ${numA} : ${numB}`,
                    `Multiplier Scale Factor: ${factor}`,
                    `Term A Scaled: ${numA} × ${factor} = ${scaledA}`,
                    `Term B Scaled: ${numB} × ${factor} = ${scaledB}`,
                    `New Ratio: ${scaledA} : ${scaledB}`
                ]
            };
        } else {
            // Share / Partitioning Mode
            if (isNaN(numA) || isNaN(numB) || isNaN(numTotal) || numA <= 0 || numB <= 0 || numTotal <= 0) {
                return { valid: false, message: "Enter positive numbers for Ratio parts (A, B) and Total Amount." };
            }

            const totalParts = numA + numB;
            const partValue = numTotal / totalParts;
            const shareA = numA * partValue;
            const shareB = numB * partValue;
            const pctA = (numA / totalParts) * 100;
            const pctB = (numB / totalParts) * 100;

            return {
                valid: true,
                totalParts,
                partValue: Number(partValue.toFixed(4)),
                shareA: Number(shareA.toFixed(2)),
                shareB: Number(shareB.toFixed(2)),
                pctA: Number(pctA.toFixed(2)),
                pctB: Number(pctB.toFixed(2)),
                steps: [
                    `Ratio Parts: ${numA} + ${numB} = ${totalParts} Total Parts`,
                    `Value per Part: ${numTotal} ÷ ${totalParts} = ${partValue.toFixed(4)}`,
                    `Share A (${numA} parts): ${numA} × ${partValue.toFixed(4)} = ${shareA.toFixed(2)} (${pctA.toFixed(1)}%)`,
                    `Share B (${numB} parts): ${numB} × ${partValue.toFixed(4)} = ${shareB.toFixed(2)} (${pctB.toFixed(1)}%)`
                ]
            };
        }
    }, [mode, valA, valB, valC, valD, totalShare]);

    const applyPreset = (preset: Preset) => {
        setMode(preset.mode);
        setValA(preset.valA);
        setValB(preset.valB);
        setValC(preset.valC);
        setValD(preset.valD);
        setTotalShare(preset.totalShare);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setMode("find-x");
        setValA("16");
        setValB("9");
        setValC("1920");
        setValD("");
        setTotalShare("1000");
        setActivePresetId(null);
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let summaryText = `Ratio & Proportion Calculation Summary (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Mode: ${mode.toUpperCase()}\n`;

        if (mode === "find-x") {
            summaryText += `Proportion Equation: ${valA || "X"} / ${valB || "X"} = ${valC || "X"} / ${valD || "X"}\n`;
            summaryText += `Solved Variable (${calculation.missingVar}): ${calculation.solvedValue}\n`;
            summaryText += `Complete Proportion: ${calculation.finalA} / ${calculation.finalB} = ${calculation.finalC} / ${calculation.finalD}\n`;
        } else if (mode === "simplify") {
            summaryText += `Original Ratio: ${valA} : ${valB}\n`;
            summaryText += `Simplified Ratio: ${calculation.simpleA} : ${calculation.simpleB}\n`;
            summaryText += `Decimal Value: ${calculation.decimalVal}\n`;
        } else if (mode === "scale") {
            summaryText += `Original Ratio: ${valA} : ${valB}\n`;
            summaryText += `Scale Factor: ${calculation.factor}x\n`;
            summaryText += `Scaled Result: ${calculation.scaledA} : ${calculation.scaledB}\n`;
        } else {
            summaryText += `Total Amount: $${totalShare}\n`;
            summaryText += `Ratio Split: ${valA} : ${valB}\n`;
            summaryText += `Share A: $${calculation.shareA} (${calculation.pctA}%)\n`;
            summaryText += `Share B: $${calculation.shareB} (${calculation.pctB}%)\n`;
        }

        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/ratio-calculator`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        const headers = ["Parameter", "Value"];
        let rows: string[][] = [["Mode", mode]];

        if (mode === "find-x") {
            rows.push(["Solved Variable", calculation.missingVar || "N/A"]);
            rows.push(["Solved Value", `${calculation.solvedValue}`]);
            rows.push(["Term A", `${calculation.finalA}`]);
            rows.push(["Term B", `${calculation.finalB}`]);
            rows.push(["Term C", `${calculation.finalC}`]);
            rows.push(["Term D", `${calculation.finalD}`]);
        } else if (mode === "simplify") {
            rows.push(["Original Ratio", `${valA}:${valB}`]);
            rows.push(["Simplified Ratio", `${calculation.simpleA}:${calculation.simpleB}`]);
            rows.push(["Decimal Value", `${calculation.decimalVal}`]);
        } else if (mode === "scale") {
            rows.push(["Original Ratio", `${valA}:${valB}`]);
            rows.push(["Scale Factor", `${calculation.factor}`]);
            rows.push(["Scaled A", `${calculation.scaledA}`]);
            rows.push(["Scaled B", `${calculation.scaledB}`]);
        } else {
            rows.push(["Total Amount", `${totalShare}`]);
            rows.push(["Share A Amount", `${calculation.shareA}`]);
            rows.push(["Share A Percentage", `${calculation.pctA}%`]);
            rows.push(["Share B Amount", `${calculation.shareB}`]);
            rows.push(["Share B Percentage", `${calculation.pctB}%`]);
        }

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ratio_proportion_summary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Ratio & Proportion Calculator",
        "url": "https://twistertools.com/tools/calculators/ratio-calculator",
        "description": "Solve ratios, find missing proportion values (X), simplify ratios, scale recipes, and partition total amounts into ratio shares.",
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
                "name": "How do you solve for X in a proportion equation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To solve for X in a proportion equation (A/B = C/D), cross-multiply the known diagonal terms and divide by the remaining term. For example, to solve A/B = C/X, calculate X = (B × C) / A."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a ratio and a proportion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A ratio is a quantitative comparison showing how much of one quantity exists relative to another (e.g., 3:2). A proportion is a mathematical statement asserting that two ratios are equal (e.g., 3/2 = 6/4)."
                }
            },
            {
                "@type": "Question",
                "name": "How do you simplify a ratio to its lowest terms?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To simplify a ratio, find the Greatest Common Divisor (GCD) of all numbers in the ratio and divide each term by that GCD. For example, 24:36 simplifies to 2:3 by dividing both sides by 12."
                }
            },
            {
                "@type": "Question",
                "name": "How do you divide an amount into a specific ratio split?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Add the ratio parts together to find the total number of parts, divide the total monetary or physical amount by this sum to find the value per part, and multiply that single part value by each individual ratio term."
                }
            },
            {
                "@type": "Question",
                "name": "Can ratios contain decimal numbers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, ratios can contain decimal numbers. To simplify a decimal ratio, multiply both terms by 10, 100, or 1000 to convert them into whole integers before reducing with the Greatest Common Divisor."
                }
            },
            {
                "@type": "Question",
                "name": "How are aspect ratios calculated for digital images and video displays?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Digital aspect ratios represent width relative to height. For instance, a 16:9 aspect ratio at 1080p height (9 parts = 1080) yields a width of 1920 pixels (16 × 120 = 1920) through direct proportional scaling."
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
                                Proportion Engine Controls
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Mode Selector */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Calculation Mode
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => { setMode("find-x"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${mode === "find-x"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Solve For X
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode("simplify"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${mode === "simplify"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Simplify
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode("scale"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${mode === "scale"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Scale Ratio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode("share"); setActivePresetId(null); }}
                                        className={`py-2 px-2 text-xs font-bold rounded-lg transition ${mode === "share"
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        Share Total
                                    </button>
                                </div>
                            </div>

                            {/* Dynamic Inputs Based on Mode */}
                            {mode === "find-x" && (
                                <div className="space-y-4 pt-2">
                                    <p className="text-xs text-slate-500 leading-tight">
                                        Enter any 3 values to solve for the missing term (leave exactly one input blank):
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        {/* Fraction 1 */}
                                        <div className="space-y-3 text-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Ratio 1 (A / B)</span>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="A (e.g. 16)"
                                                    value={valA}
                                                    onChange={(e) => { handleNumberInput(e, setValA); setActivePresetId(null); }}
                                                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                            <div className="border-b-2 border-slate-300 my-1 w-3/4 mx-auto"></div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="B (e.g. 9)"
                                                    value={valB}
                                                    onChange={(e) => { handleNumberInput(e, setValB); setActivePresetId(null); }}
                                                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                        </div>

                                        {/* Equals Sign */}
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <span className="text-2xl font-black text-indigo-600">=</span>
                                            <ArrowRightLeft className="w-5 h-5 text-slate-400" />
                                        </div>

                                        {/* Fraction 2 */}
                                        <div className="col-span-2 sm:col-span-1 space-y-3 text-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Ratio 2 (C / D)</span>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="C (e.g. 1920)"
                                                    value={valC}
                                                    onChange={(e) => { handleNumberInput(e, setValC); setActivePresetId(null); }}
                                                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                            <div className="border-b-2 border-slate-300 my-1 w-3/4 mx-auto"></div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="D (Leave blank)"
                                                    value={valD}
                                                    onChange={(e) => { handleNumberInput(e, setValD); setActivePresetId(null); }}
                                                    className="w-full text-center px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(mode === "simplify" || mode === "scale" || mode === "share") && (
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                Term A
                                            </label>
                                            <input
                                                type="text"
                                                value={valA}
                                                onChange={(e) => { handleNumberInput(e, setValA); setActivePresetId(null); }}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                Term B
                                            </label>
                                            <input
                                                type="text"
                                                value={valB}
                                                onChange={(e) => { handleNumberInput(e, setValB); setActivePresetId(null); }}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            />
                                        </div>
                                    </div>

                                    {mode === "scale" && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Scale Multiplier / Factor
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 2.5 or 5"
                                                value={valC}
                                                onChange={(e) => { handleNumberInput(e, setValC); setActivePresetId(null); }}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                            />
                                        </div>
                                    )}

                                    {mode === "share" && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                                Total Amount to Partition ($ / Units)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 1000"
                                                value={totalShare}
                                                onChange={(e) => { handleNumberInput(e, setTotalShare); setActivePresetId(null); }}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PRESETS COMPONENT */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Preset Use Cases
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

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopySummary}
                            disabled={!calculation.valid}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied" : "Copy Solution"}
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

                {/* Right Workspace Panel: Dynamic Output & Calculation Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Solution & Breakdown
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                Mode: {mode}
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
                                {/* Hero Solved Result Box */}
                                <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Scale className="w-4 h-4 text-indigo-400" /> Primary Solved Result
                                        </span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                                            Verified
                                        </span>
                                    </div>

                                    {mode === "find-x" && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs text-indigo-300">Missing Variable <strong>({calculation.missingVar})</strong> Solved Value:</div>
                                            <div className="text-4xl sm:text-5xl font-black text-white">{calculation.solvedValue}</div>
                                            <div className="pt-2 text-xs font-mono text-indigo-200 border-t border-indigo-800/80">
                                                Complete Proportion: {calculation.finalA} / {calculation.finalB} = {calculation.finalC} / {calculation.finalD}
                                            </div>
                                        </div>
                                    )}

                                    {mode === "simplify" && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs text-indigo-300">Simplified Ratio:</div>
                                            <div className="text-4xl sm:text-5xl font-black text-white">
                                                {calculation.simpleA} : {calculation.simpleB}
                                            </div>
                                            <div className="pt-2 text-xs text-indigo-200 border-t border-indigo-800/80 flex justify-between">
                                                <span>Decimal Value: <strong>{calculation.decimalVal}</strong></span>
                                                <span>GCD: <strong>{calculation.gcd}</strong></span>
                                            </div>
                                        </div>
                                    )}

                                    {mode === "scale" && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs text-indigo-300">Scaled Ratio ({calculation.factor}x Multiplier):</div>
                                            <div className="text-4xl sm:text-5xl font-black text-white">
                                                {calculation.scaledA} : {calculation.scaledB}
                                            </div>
                                            <div className="pt-2 text-xs text-indigo-200 border-t border-indigo-800/80">
                                                Original Ratio: {valA} : {valB}
                                            </div>
                                        </div>
                                    )}

                                    {mode === "share" && (
                                        <div className="mt-4 space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-xs text-indigo-300">Share A ({valA} parts):</span>
                                                    <div className="text-2xl sm:text-3xl font-black text-white">${calculation.shareA}</div>
                                                    <span className="text-[10px] text-indigo-200">{calculation.pctA}% of total</span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-indigo-300">Share B ({valB} parts):</span>
                                                    <div className="text-2xl sm:text-3xl font-black text-white">${calculation.shareB}</div>
                                                    <span className="text-[10px] text-indigo-200">{calculation.pctB}% of total</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Dynamic Visual Proportion Bar Chart (Share Mode) */}
                                {mode === "share" && calculation.valid && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                            <span>Visual Partition Split</span>
                                            <span>Total: ${totalShare}</span>
                                        </div>
                                        <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                                            <div
                                                style={{ width: `${calculation.pctA}%` }}
                                                className="h-full bg-indigo-600 transition-all duration-300"
                                                title={`Share A: ${calculation.pctA}%`}
                                            />
                                            <div
                                                style={{ width: `${calculation.pctB}%` }}
                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                title={`Share B: ${calculation.pctB}%`}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                            <span className="flex items-center gap-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                                                Part A: {calculation.pctA}% (${calculation.shareA})
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                                                Part B: {calculation.pctB}% (${calculation.shareB})
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Step-by-Step Mathematical Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Step-by-Step Derivation
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
                            Client-Side Calculations
                        </span>
                        <span>TwisterTools Math Engine</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE CONTENT & SEO OPTIMIZATION */}
            <div className="space-y-6">

                {/* Card 1: Fundamental Mathematical Definitions & Core Rules */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations of Ratios, Rates, and Proportions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In classical arithmetic and algebraic modeling, understanding the distinction between a <strong>ratio</strong>, a <strong>rate</strong>, and a <strong>proportion</strong> is fundamental to solving quantitative problems across science, finance, and engineering.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Scale className="w-4 h-4 text-indigo-600" /> Ratio Definition
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A quantitative relationship between two numbers showing how many times one value contains another, commonly written as A:B or A/B. Ratios compare quantities measured in the same units.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <TrendingUp className="w-4 h-4 text-emerald-600" /> Rate Definition
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A specialized ratio that compares two different metrics measured in distinct units (e.g., miles per hour, price per square foot, or interest rate per annum).
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <ArrowRightLeft className="w-4 h-4 text-amber-600" /> Proportion Definition
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                An algebraic equation stating that two individual ratios are mathematically equivalent, such as A/B = C/D. Proportions form the basis of cross-multiplication.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Core Algebraic Rules of Proportions
                        </h3>
                        <ul className="text-xs text-indigo-900 space-y-1.5 list-disc list-inside">
                            <li><strong>Cross-Product Property:</strong> In any valid proportion A/B = C/D, the product of the extremes equals the product of the means, so A x D = B x C.</li>
                            <li><strong>Reciprocal Property:</strong> If two ratios are equal, their inverses are also equal, so B/A = D/C.</li>
                            <li><strong>Inversion Property:</strong> Swapping the means or extremes maintains mathematical equality, so A/C = B/D.</li>
                        </ul>
                    </div>
                </section>

                {/* Card 2: Industry Comparison Table & Standard Aspect Ratios */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Digital & Industry Ratio Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Ratios are standardized across digital media, screen manufacturing, photography, and financial valuation. Below is a detailed reference guide for common industry aspect ratios and split proportions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Standard Ratio</th>
                                    <th className="p-3">Category / Use Case</th>
                                    <th className="p-3">Decimal Value</th>
                                    <th className="p-3">Common Resolution Examples</th>
                                    <th className="p-3">Percentage Split</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3">Widescreen Video / HD Displays</td>
                                    <td className="p-3 font-mono">1.7778</td>
                                    <td className="p-3">1920×1080 (1080p), 3840×2160 (4K UHD)</td>
                                    <td className="p-3">64.0% / 36.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">4:3</td>
                                    <td className="p-3">Legacy TV / iPad Display</td>
                                    <td className="p-3 font-mono">1.3333</td>
                                    <td className="p-3">1024×768, 1600×1200, 2048×1536</td>
                                    <td className="p-3">57.1% / 42.9%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">1:1</td>
                                    <td className="p-3">Square Media (Instagram / Icons)</td>
                                    <td className="p-3 font-mono">1.0000</td>
                                    <td className="p-3">1080×1080, 512×512, 1200×1200</td>
                                    <td className="p-3">50.0% / 50.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">21:9</td>
                                    <td className="p-3">Ultrawide Monitors / Cinematic Video</td>
                                    <td className="p-3 font-mono">2.3333</td>
                                    <td className="p-3">2560×1080, 3440×1440 (UW-QHD)</td>
                                    <td className="p-3">70.0% / 30.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">3:2</td>
                                    <td className="p-3">DSLR Photography / Surface Laptops</td>
                                    <td className="p-3 font-mono">1.5000</td>
                                    <td className="p-3">3000×2000, 2160×1440</td>
                                    <td className="p-3">60.0% / 40.0%</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-indigo-600">1.618:1</td>
                                    <td className="p-3">Golden Ratio ($\Phi$ - Architecture/Design)</td>
                                    <td className="p-3 font-mono">1.6180</td>
                                    <td className="p-3">Proportional design layout framing</td>
                                    <td className="p-3">61.8% / 38.2%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Worked Practical Examples Across Disciplines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Examples Across Different Disciplines
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review detailed mathematical derivations for common real-world scenarios to see how ratio algorithms solve practical problems:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 1: Culinary Recipe Batch Scaling</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Scaling Mode</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A pastry recipe requires 2.5 cups of flour for every 1.5 cups of sugar ($2.5 : 1.5$). How much flour is needed if you scale the batch by a factor of 4.5 for catering?
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>Original Ratio: 2.5 : 1.5</div>
                                <div>Scale Factor: 4.5</div>
                                <div>Flour Required = 2.5 × 4.5 = <strong>11.25 cups</strong></div>
                                <div>Sugar Required = 1.5 × 4.5 = <strong>6.75 cups</strong></div>
                            </div>
                        </div>

                        {/* Example B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 2: Business Partnership Profit Distribution</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Share Mode</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Two partners agree to split a quarterly net profit of $45,000 in a $5:3$ ratio based on capital equity investment. Calculate each partner's share.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>Total Ratio Parts = 5 + 3 = 8 parts</div>
                                <div>Value per Part = $45,000 ÷ 8 = $5,625</div>
                                <div>Partner A (5 parts) = 5 × $5,625 = <strong>$28,125</strong> (62.5%)</div>
                                <div>Partner B (3 parts) = 3 × $5,625 = <strong>$16,875</strong> (37.5%)</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Detailed Step-by-Step Instructions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Use the Multi-Mode Proportion Engine
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Select Calculation Mode</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Choose between "Solve for X", "Simplify Ratio", "Scale Ratio", or "Share Total" depending on your target problem.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Input Numerical Parameters</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Enter your known ratio terms or total values. The engine automatically strips invalid inputs and zero-prefixes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Analyze Derivation Steps</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Review the complete step-by-step mathematical proof, decimal values, and visual partition charts instantly.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Export or Copy Results</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Copy the full formatted calculation summary to your clipboard or download a structured CSV data report.
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
                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you solve for X in a proportion equation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To solve for X in a proportion equation such as A/B = C/D, cross-multiply the known diagonal terms and divide by the remaining term. For example, if A/B = C/X, then X = (B x C) / A.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a ratio and a proportion?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A ratio is a quantitative comparison showing how much of one quantity exists relative to another, for example 3:2. A proportion is a mathematical statement asserting that two ratios are equal, for example 3/2 = 6/4.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you simplify a ratio to its lowest terms?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To simplify a ratio, find the Greatest Common Divisor (GCD) of all numbers in the ratio and divide each term by that GCD. For example, 24:36 simplifies to 2:3 by dividing both sides by 12.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you divide an amount into a specific ratio split?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Add the ratio parts together to find the total number of parts, divide the total monetary or physical amount by this sum to find the value per part, and multiply that single part value by each individual ratio term.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can ratios contain decimal numbers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, ratios can contain decimal numbers. To simplify a decimal ratio, multiply both terms by 10, 100, or 1000 to convert them into whole integers before reducing with the Greatest Common Divisor.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are aspect ratios calculated for digital images and video displays?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Digital aspect ratios represent width relative to height. For instance, a 16:9 aspect ratio at 1080p height means 9 parts equals 1080, so each part is 120 and the proportional width is $16 \times 120 = 1920$ pixels.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}