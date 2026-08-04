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
    Binary,
    Activity,
    Compass
} from "lucide-react";

interface Preset {
    id: string;
    label: string;
    a: string;
    b: string;
    c: string;
    tag: string;
    desc: string;
}

const PRESETS: Preset[] = [
    { id: "two-real", label: "Two Real Roots", a: "1", b: "-5", c: "6", tag: "Basic", desc: "x² - 5x + 6 = 0 (Roots: 2, 3)" },
    { id: "one-real", label: "One Repeated Root", a: "1", b: "-6", c: "9", tag: "Perfect Square", desc: "x² - 6x + 9 = 0 (Root: 3)" },
    { id: "complex", label: "Complex Roots", a: "1", b: "2", c: "5", tag: "Imaginary", desc: "x² + 2x + 5 = 0 (Roots: -1 ± 2i)" },
    { id: "inverted", label: "Inverted Parabola", a: "-2", b: "4", c: "1", tag: "Maximum", desc: "-2x² + 4x + 1 = 0" },
];

type RootType = "two-real" | "one-real" | "complex";

interface InvalidCalculation {
    valid: false;
    message: string;
}

interface ValidCalculation {
    valid: true;
    a: number;
    b: number;
    c: number;
    discriminant: number;
    rootType: RootType;
    root1Text: string;
    root2Text: string;
    vertexX: string;
    vertexY: string;
    yIntercept: string;
    isMax: boolean;
    derivationSteps: string[];
    svgPathD: string;
    vertexSvgX: number;
    vertexSvgY: number;
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
    // Allow valid decimal numbers including negative sign
    if (/^-?\d*\.?\d*$/.test(raw)) {
        // Sanitize redundant leading zeros like 05 unless it is 0.x
        const cleaned = raw.replace(/^(-?)0+(?=\d)/, "$1");
        setter(cleaned);
    }
};

export default function QuadraticSolver() {
    // Inputs
    const [valA, setValA] = useState<string>("1");
    const [valB, setValB] = useState<string>("-5");
    const [valC, setValC] = useState<string>("6");

    // UI States
    const [copied, setCopied] = useState(false);
    const [activePresetId, setActivePresetId] = useState<string | null>("two-real");

    // Calculation Engine
    const calculation = useMemo<CalculationResult>(() => {
        if (valA === "" || valB === "" || valC === "") {
            return { valid: false, message: "Please provide valid numerical coefficients for a, b, and c." };
        }

        const a = parseFloat(valA);
        const b = parseFloat(valB);
        const c = parseFloat(valC);

        if (isNaN(a) || isNaN(b) || isNaN(c)) {
            return { valid: false, message: "Invalid numerical format detected. Please check your inputs." };
        }

        if (a === 0) {
            return { valid: false, message: "Coefficient 'a' cannot equal 0. If a = 0, the equation becomes linear (bx + c = 0)." };
        }

        // Discriminant: Δ = b² - 4ac
        const discriminant = b * b - 4 * a * c;
        const vertexX = -b / (2 * a);
        const vertexY = a * (vertexX * vertexX) + b * vertexX + c;
        const yIntercept = c;

        let root1Text = "";
        let root2Text = "";
        let rootType: RootType = "two-real";
        let derivationSteps: string[] = [];

        derivationSteps.push(`Standard Form: ${a}x² ${b >= 0 ? "+ " + b : "- " + Math.abs(b)}x ${c >= 0 ? "+ " + c : "- " + Math.abs(c)} = 0`);
        derivationSteps.push(`Identify Coefficients: a = ${a}, b = ${b}, c = ${c}`);
        derivationSteps.push(`Calculate Discriminant: Δ = b² - 4ac = (${b})² - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${discriminant}`);

        if (discriminant > 0) {
            rootType = "two-real";
            const sqrtD = Math.sqrt(discriminant);
            const r1 = (-b + sqrtD) / (2 * a);
            const r2 = (-b - sqrtD) / (2 * a);
            root1Text = r1 % 1 === 0 ? r1.toString() : r1.toFixed(4);
            root2Text = r2 % 1 === 0 ? r2.toString() : r2.toFixed(4);

            derivationSteps.push(`Since Δ > 0, there are two distinct real roots.`);
            derivationSteps.push(`Apply Quadratic Formula: x = (-b ± √Δ) / 2a`);
            derivationSteps.push(`x₁ = (-(${b}) + √${discriminant}) / (2 × ${a}) = (${-b} + ${sqrtD.toFixed(4)}) / ${2 * a} = ${root1Text}`);
            derivationSteps.push(`x₂ = (-(${b}) - √${discriminant}) / (2 × ${a}) = (${-b} - ${sqrtD.toFixed(4)}) / ${2 * a} = ${root2Text}`);
        } else if (discriminant === 0) {
            rootType = "one-real";
            const r = -b / (2 * a);
            root1Text = r % 1 === 0 ? r.toString() : r.toFixed(4);
            root2Text = root1Text;

            derivationSteps.push(`Since Δ = 0, there is exactly one repeated real root.`);
            derivationSteps.push(`Apply Quadratic Formula: x = -b / 2a`);
            derivationSteps.push(`x = -(${b}) / (2 × ${a}) = ${root1Text}`);
        } else {
            rootType = "complex";
            const realPart = -b / (2 * a);
            const imagPart = Math.sqrt(Math.abs(discriminant)) / (2 * a);
            const realFormatted = realPart % 1 === 0 ? realPart.toString() : realPart.toFixed(4);
            const imagFormatted = Math.abs(imagPart) % 1 === 0 ? Math.abs(imagPart).toString() : Math.abs(imagPart).toFixed(4);

            root1Text = `${realFormatted} + ${imagFormatted}i`;
            root2Text = `${realFormatted} - ${imagFormatted}i`;

            derivationSteps.push(`Since Δ < 0, there are two complex conjugate roots.`);
            derivationSteps.push(`Apply Quadratic Formula: x = (-b ± i√|Δ|) / 2a`);
            derivationSteps.push(`Real Part = -b / 2a = ${realFormatted}`);
            derivationSteps.push(`Imaginary Part = √|${discriminant}| / 2a = ${imagFormatted}i`);
            derivationSteps.push(`x₁ = ${root1Text}, x₂ = ${root2Text}`);
        }

        // Generate SVG Path for Parabola Visualizer
        // Plot within a normalized coordinate system (Width: 400, Height: 200)
        let plotPoints: { x: number; y: number }[] = [];
        const span = Math.max(Math.abs(vertexX) * 2, 10);
        const minX = vertexX - span;
        const maxX = vertexX + span;

        let maxY = -Infinity;
        let minY = Infinity;

        // Sample points
        for (let i = 0; i <= 50; i++) {
            const x = minX + (i / 50) * (maxX - minX);
            const y = a * x * x + b * x + c;
            if (y > maxY) maxY = y;
            if (y < minY) minY = y;
            plotPoints.push({ x, y });
        }

        const yRange = maxY - minY === 0 ? 1 : maxY - minY;
        const svgWidth = 400;
        const svgHeight = 180;
        const padding = 20;

        const mappedPoints = plotPoints.map((pt) => {
            const svgX = padding + ((pt.x - minX) / (maxX - minX)) * (svgWidth - 2 * padding);
            // Flip Y axis for SVG rendering
            const svgY = (svgHeight - padding) - ((pt.y - minY) / yRange) * (svgHeight - 2 * padding);
            return `${svgX.toFixed(1)},${svgY.toFixed(1)}`;
        });

        const svgPathD = `M ${mappedPoints.join(" L ")}`;

        // Map Vertex to SVG coordinates
        const vertexSvgX = padding + ((vertexX - minX) / (maxX - minX)) * (svgWidth - 2 * padding);
        const vertexSvgY = (svgHeight - padding) - ((vertexY - minY) / yRange) * (svgHeight - 2 * padding);

        return {
            valid: true,
            a,
            b,
            c,
            discriminant,
            rootType,
            root1Text,
            root2Text,
            vertexX: vertexX % 1 === 0 ? vertexX.toString() : vertexX.toFixed(4),
            vertexY: vertexY % 1 === 0 ? vertexY.toString() : vertexY.toFixed(4),
            yIntercept: yIntercept % 1 === 0 ? yIntercept.toString() : yIntercept.toFixed(4),
            isMax: a < 0,
            derivationSteps,
            svgPathD,
            vertexSvgX,
            vertexSvgY
        };
    }, [valA, valB, valC]);

    const applyPreset = (preset: Preset) => {
        setValA(preset.a);
        setValB(preset.b);
        setValC(preset.c);
        setActivePresetId(preset.id);
    };

    const handleReset = () => {
        setValA("1");
        setValB("-5");
        setValC("6");
        setActivePresetId("two-real");
    };

    const handleCopySummary = () => {
        if (!calculation.valid) return;

        let summaryText = `Quadratic Equation Solution (TwisterTools):\n----------------------------------------\n`;
        summaryText += `Equation: ${calculation.a}x² + ${calculation.b}x + ${calculation.c} = 0\n`;
        summaryText += `Discriminant (Δ): ${calculation.discriminant}\n`;
        summaryText += `Root Type: ${calculation.rootType}\n`;
        summaryText += `Root 1 (x₁): ${calculation.root1Text}\n`;
        summaryText += `Root 2 (x₂): ${calculation.root2Text}\n`;
        summaryText += `Vertex (h, k): (${calculation.vertexX}, ${calculation.vertexY})\n`;
        summaryText += `Y-Intercept: (0, ${calculation.yIntercept})\n`;
        summaryText += `----------------------------------------\nCalculated at twistertools.com/tools/calculators/quadratic-solver`;

        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        if (!calculation.valid) return;

        const headers = ["Parameter", "Value"];
        const rows: string[][] = [
            ["Coefficient a", calculation.a.toString()],
            ["Coefficient b", calculation.b.toString()],
            ["Coefficient c", calculation.c.toString()],
            ["Discriminant (Δ)", calculation.discriminant.toString()],
            ["Root Type", calculation.rootType],
            ["Root 1 (x1)", calculation.root1Text],
            ["Root 2 (x2)", calculation.root2Text],
            ["Vertex X (h)", calculation.vertexX],
            ["Vertex Y (k)", calculation.vertexY],
            ["Y-Intercept", calculation.yIntercept]
        ];

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.map((val) => `"${val}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `quadratic_equation_solution.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Structured Data Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Quadratic Equation Solver & Visualizer",
        "url": "https://twistertools.com/tools/calculators/quadratic-solver",
        "description": "Solve quadratic equations instantly with real and complex roots, discriminant analysis, vertex details, and interactive 2D parabola graph visualization.",
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
                "name": "What is the Quadratic Formula?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The quadratic formula is x = (-b ± √(b² - 4ac)) / (2a). It is used to find the roots or zeros of any second-order polynomial equation in standard form ax² + bx + c = 0."
                }
            },
            {
                "@type": "Question",
                "name": "What does the discriminant (b² - 4ac) tell you?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The discriminant determines the nature of the roots: if Δ > 0, there are two distinct real roots; if Δ = 0, there is one repeated real root; if Δ < 0, there are two complex conjugate roots."
                }
            },
            {
                "@type": "Question",
                "name": "How do you find the vertex of a parabola?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The x-coordinate of the vertex (h) is given by -b / (2a). To find the y-coordinate (k), substitute h back into the original quadratic equation: k = a(h)² + b(h) + c."
                }
            },
            {
                "@type": "Question",
                "name": "Can coefficient 'a' equal zero in a quadratic equation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. If coefficient 'a' equals zero, the x² term disappears, reducing the expression to a linear equation (bx + c = 0) rather than a quadratic equation."
                }
            },
            {
                "@type": "Question",
                "name": "How are complex numbers represented in quadratic roots?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When the discriminant is negative, taking the square root requires the imaginary unit i (where i = √-1). Complex roots take the form of conjugate pairs: real ± imaginary * i."
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
                                Equation Parameters
                            </h2>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        </div>

                        {/* Standard Form Display */}
                        <div className="bg-slate-900 text-white rounded-xl p-4 text-center mb-6 shadow-inner space-y-1">
                            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">Standard Quadratic Form</span>
                            <div className="text-xl sm:text-2xl font-mono font-black text-indigo-100">
                                <span className="text-indigo-400">{valA || "a"}</span>x² + <span className="text-indigo-400">{valB || "b"}</span>x + <span className="text-indigo-400">{valC || "c"}</span> = 0
                            </div>
                        </div>

                        {/* Coefficients Inputs Grid */}
                        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Coeff (a)
                                </label>
                                <input
                                    type="text"
                                    value={valA}
                                    onChange={(e) => { handleNumberInput(e, setValA); setActivePresetId(null); }}
                                    placeholder="1"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">x² term (a ≠ 0)</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Coeff (b)
                                </label>
                                <input
                                    type="text"
                                    value={valB}
                                    onChange={(e) => { handleNumberInput(e, setValB); setActivePresetId(null); }}
                                    placeholder="-5"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">x term</span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Coeff (c)
                                </label>
                                <input
                                    type="text"
                                    value={valC}
                                    onChange={(e) => { handleNumberInput(e, setValC); setActivePresetId(null); }}
                                    placeholder="6"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-mono"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">Constant</span>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets & Sample Equations
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

                {/* Right Workspace Panel: Results, Parabola Graph & Derivation */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-h-160 min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-indigo-600" />
                                Solution & Parabola Plot
                            </h2>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                {calculation.valid ? calculation.rootType : "Invalid"}
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
                                {/* Roots Summary Header */}
                                <div className="p-5 rounded-2xl border bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                            <Binary className="w-4 h-4 text-indigo-400" /> Quadratic Roots (Zeros)
                                        </span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${calculation.discriminant > 0
                                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                            : calculation.discriminant === 0
                                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                                : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                            }`}>
                                            Δ = {calculation.discriminant}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Root 1 (x₁)</span>
                                            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
                                                {calculation.root1Text}
                                            </span>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Root 2 (x₂)</span>
                                            <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono">
                                                {calculation.root2Text}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 text-xs font-mono text-indigo-200 border-t border-indigo-800/80 flex justify-between items-center">
                                        <span>Vertex: <strong>({calculation.vertexX}, {calculation.vertexY})</strong></span>
                                        <span>Y-Intercept: <strong>(0, {calculation.yIntercept})</strong></span>
                                    </div>
                                </div>

                                {/* Parabola SVG Graph */}
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-indigo-600" /> Parabola Curve Graph
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            {calculation.isMax ? "Concave Down (Max Vertex)" : "Concave Up (Min Vertex)"}
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-900 rounded-lg p-2 overflow-hidden flex items-center justify-center">
                                        <svg viewBox="0 0 400 180" className="w-full h-auto max-h-44">
                                            {/* Grid background lines */}
                                            <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                                            <line x1="200" y1="0" x2="200" y2="180" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

                                            {/* Parabola Path */}
                                            <path d={calculation.svgPathD} fill="none" stroke="#818cf8" strokeWidth="3" />

                                            {/* Vertex Marker */}
                                            <circle cx={calculation.vertexSvgX} cy={calculation.vertexSvgY} r="5" fill="#f43f5e" />
                                            <text
                                                x={calculation.vertexSvgX > 200 ? calculation.vertexSvgX - 45 : calculation.vertexSvgX + 10}
                                                y={calculation.vertexSvgY > 90 ? calculation.vertexSvgY - 10 : calculation.vertexSvgY + 15}
                                                fill="#fb7185"
                                                fontSize="10"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                V({calculation.vertexX}, {calculation.vertexY})
                                            </text>
                                        </svg>
                                    </div>
                                </div>

                                {/* Step-by-Step Derivation */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-600" /> Step-by-Step Derivation
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
                            Exact Quadratic Formula Engine
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
                            Understanding Quadratic Equations and the Quadratic Formula
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A <strong>quadratic equation</strong> is a second-order polynomial equation in a single variable <em>x</em>, expressed in standard form as <strong>ax² + bx + c = 0</strong>, where <strong>a ≠ 0</strong>. Quadratic equations play a fundamental role in physics, engineering, financial modeling, and computer graphics to describe parabolic trajectories, optimization points, and acceleration curves.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Compass className="w-4 h-4 text-indigo-600" /> The Quadratic Formula
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The universal algebraic solution for finding roots of any quadratic polynomial is given by: <strong>x = (-b ± √(b² - 4ac)) / (2a)</strong>. It accounts for both real and complex root conditions cleanly.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Activity className="w-4 h-4 text-emerald-600" /> The Discriminant (Δ)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The term under the square root, <strong>Δ = b² - 4ac</strong>, is called the <strong>discriminant</strong>. It dictates whether the parabola intersects the x-axis twice, touches it once, or floats entirely above/below it without real x-intercepts.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-indigo-100 rounded-xl bg-indigo-50/50 space-y-3">
                        <h3 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Parabola Geometry & Vertex Form
                        </h3>
                        <p className="text-xs text-indigo-900 leading-relaxed">
                            Graphically, every quadratic function represents a parabola. The turning point of the curve is its <strong>vertex (h, k)</strong>, calculated via <strong>h = -b / (2a)</strong> and <strong>k = c - (b² / 4a)</strong>. If coefficient <em>a &gt; 0</em>, the parabola opens upward and the vertex is a minimum point. If <em>a &lt; 0</em>, it opens downward with a maximum vertex.
                        </p>
                    </div>
                </section>

                {/* Card 2: Discriminant & Root Classification Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Discriminant Classification & Geometric Properties
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below illustrates how the discriminant value determines root classification and geometric characteristics on a Cartesian coordinate plane:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Discriminant (Δ)</th>
                                    <th className="p-3">Root Classification</th>
                                    <th className="p-3">Graphical X-Intercepts</th>
                                    <th className="p-3">Root Formula</th>
                                    <th className="p-3">Example Equation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-emerald-600">Δ &gt; 0</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Two Real Roots</span></td>
                                    <td className="p-3">Intersects x-axis at 2 points</td>
                                    <td className="p-3 font-mono text-xs">(-b ± √Δ) / 2a</td>
                                    <td className="p-3 font-mono text-xs">x² - 5x + 6 = 0</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-slate-50/50">
                                    <td className="p-3 font-bold text-amber-600">Δ = 0</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">One Repeated Root</span></td>
                                    <td className="p-3">Vertex touches x-axis at 1 point</td>
                                    <td className="p-3 font-mono text-xs">-b / 2a</td>
                                    <td className="p-3 font-mono text-xs">x² - 6x + 9 = 0</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-purple-600">Δ &lt; 0</td>
                                    <td className="p-3"><span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Two Complex Conjugates</span></td>
                                    <td className="p-3">Does not intersect x-axis</td>
                                    <td className="p-3 font-mono text-xs">(-b ± i√|Δ|) / 2a</td>
                                    <td className="p-3 font-mono text-xs">x² + 2x + 5 = 0</td>
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
                            Real-World Applications & Worked Examples
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        See how quadratic solutions are calculated step-by-step across modern physics and engineering scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Example A */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 1: Projectile Trajectory Flight Time</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Physics Modeling</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Calculate the ground impact time for an object launched with equation h(t) = -5t² + 20t + 15 = 0.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>a = -5, b = 20, c = 15</div>
                                <div>Δ = (20)² - 4(-5)(15) = 400 + 300 = 700</div>
                                <div>t = (-20 ± √700) / (-10)</div>
                                <div>Flight Time = <strong>t ≈ 4.646 seconds</strong></div>
                            </div>
                        </div>

                        {/* Example B */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900 text-sm">Example 2: Complex Impedance in AC Circuits</span>
                                <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Electrical Engineering</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Determine characteristic system roots for an RLC oscillator circuit modeled by s² + 4s + 13 = 0.
                            </p>
                            <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1 text-slate-800">
                                <div>a = 1, b = 4, c = 13</div>
                                <div>Δ = (4)² - 4(1)(13) = 16 - 52 = -36</div>
                                <div>s = (-4 ± √-36) / 2 = (-4 ± 6i) / 2</div>
                                <div>Complex Roots = <strong>s = -2 ± 3i</strong></div>
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
                            How to Use the Quadratic Equation Visualizer
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                            <h3 className="font-bold text-slate-900 text-xs">Enter Coefficients</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Input values for a, b, and c into the designated input fields or select one of the built-in preset equations.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                            <h3 className="font-bold text-slate-900 text-xs">Review Zeros & Discriminant</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Instantly inspect root values (real or complex) and view the calculated discriminant value.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                            <h3 className="font-bold text-slate-900 text-xs">Analyze Parabola Plot</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Examine the dynamically rendered 2D parabola curve graph displaying the vertex point coordinate.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">4</span>
                            <h3 className="font-bold text-slate-900 text-xs">Export Solution Data</h3>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                Copy formatted calculation steps to your clipboard or export full numerical parameters as a CSV file.
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
                                What is the Quadratic Formula?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The quadratic formula is x = (-b ± √(b² - 4ac)) / (2a). It is used to find the roots or zeros of any second-order polynomial equation in standard form ax² + bx + c = 0.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What does the discriminant (b² - 4ac) tell you?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The discriminant determines the nature of the roots: if Δ &gt; 0, there are two distinct real roots; if Δ = 0, there is one repeated real root; if Δ &lt; 0, there are two complex conjugate roots.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you find the vertex of a parabola?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The x-coordinate of the vertex (h) is given by -b / (2a). To find the y-coordinate (k), substitute h back into the original quadratic equation: k = a(h)² + b(h) + c.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can coefficient 'a' equal zero in a quadratic equation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. If coefficient 'a' equals zero, the x² term disappears, reducing the expression to a linear equation (bx + c = 0) rather than a quadratic equation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-linear-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How are complex numbers represented in quadratic roots?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When the discriminant is negative, taking the square root requires the imaginary unit i (where i = √-1). Complex roots take the form of conjugate pairs: real ± imaginary * i.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}