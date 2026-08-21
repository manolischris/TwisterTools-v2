"use client";

import React, { useState, useMemo } from "react";
import {
    ArrowRightLeft,
    Copy,
    Check,
    RotateCcw,
    Layers,
    BookOpen,
    HelpCircle,
    Download,
    FileCode,
    Sliders,
    Sparkles,
    ShieldCheck,
    Smartphone,
    Monitor,
    Hash,
    CheckCircle2,
    Eye,
    RefreshCw,
    FileType,
    Percent
} from "lucide-react";

interface ConversionRow {
    px: number;
    rem: string;
    em: string;
    percent: string;
    tailwindClass: string;
}

const COMMON_PX_VALUES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

const TAILWIND_SPACING_MAP: Record<number, string> = {
    0: "0",
    1: "0.5",
    2: "0.5",
    4: "1",
    6: "1.5",
    8: "2",
    10: "2.5",
    12: "3",
    14: "3.5",
    16: "4",
    20: "5",
    24: "6",
    28: "7",
    32: "8",
    36: "9",
    40: "10",
    44: "11",
    48: "12",
    56: "14",
    64: "16",
    72: "18",
    80: "20",
    96: "24",
};

export default function PxToRemConverter() {
    // Core state
    const [basePx, setBasePx] = useState<number>(16);
    const [precision, setPrecision] = useState<number>(4);

    // Single / Interactive input states
    const [pxInput, setPxInput] = useState<string>("16");
    const [remInput, setRemInput] = useState<string>("1");
    const [emInput, setEmInput] = useState<string>("1");
    const [activeSource, setActiveSource] = useState<"px" | "rem" | "em">("px");

    // Batch conversion state
    const [batchInput, setBatchInput] = useState<string>(
        `/* Paste raw CSS or list of values */\nfont-size: 24px;\nline-height: 32px;\nmargin: 16px 24px 32px 0px;\npadding: 8px 12px;\nborder-radius: 6px;\nwidth: 320px;\nmax-width: 1200px;`
    );
    const [activeTab, setActiveTab] = useState<"single" | "batch" | "table">("single");

    // Feedback states
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Number sanitation helper preventing stuck zero prefix
    const handleBasePxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw === "") {
            setBasePx(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseFloat(cleaned);
        setBasePx(isNaN(num) ? 0 : num);
    };

    // Calculate conversions for single input
    const formatNumber = (val: number, prec: number): string => {
        if (isNaN(val) || !isFinite(val)) return "0";
        const factor = Math.pow(10, prec);
        const rounded = Math.round(val * factor) / factor;
        return rounded.toString();
    };

    const handlePxChange = (valStr: string) => {
        setPxInput(valStr);
        setActiveSource("px");
        const val = parseFloat(valStr);
        if (!isNaN(val) && basePx > 0) {
            const calculatedRem = val / basePx;
            setRemInput(formatNumber(calculatedRem, precision));
            setEmInput(formatNumber(calculatedRem, precision));
        } else {
            setRemInput("");
            setEmInput("");
        }
    };

    const handleRemChange = (valStr: string) => {
        setRemInput(valStr);
        setActiveSource("rem");
        const val = parseFloat(valStr);
        if (!isNaN(val) && basePx > 0) {
            const calculatedPx = val * basePx;
            setPxInput(formatNumber(calculatedPx, precision));
            setEmInput(valStr);
        } else {
            setPxInput("");
            setEmInput("");
        }
    };

    const handleEmChange = (valStr: string) => {
        setEmInput(valStr);
        setActiveSource("em");
        const val = parseFloat(valStr);
        if (!isNaN(val) && basePx > 0) {
            const calculatedPx = val * basePx;
            setPxInput(formatNumber(calculatedPx, precision));
            setRemInput(valStr);
        } else {
            setPxInput("");
            setRemInput("");
        }
    };

    // Recalculate if basePx or precision changes
    useMemo(() => {
        if (basePx <= 0) return;
        if (activeSource === "px") {
            const val = parseFloat(pxInput);
            if (!isNaN(val)) {
                const calculated = val / basePx;
                setRemInput(formatNumber(calculated, precision));
                setEmInput(formatNumber(calculated, precision));
            }
        } else if (activeSource === "rem") {
            const val = parseFloat(remInput);
            if (!isNaN(val)) {
                const calculated = val * basePx;
                setPxInput(formatNumber(calculated, precision));
                setEmInput(formatNumber(val, precision));
            }
        } else if (activeSource === "em") {
            const val = parseFloat(emInput);
            if (!isNaN(val)) {
                const calculated = val * basePx;
                setPxInput(formatNumber(calculated, precision));
                setRemInput(formatNumber(val, precision));
            }
        }
    }, [basePx, precision]);

    // Batch CSS parser & replacement logic
    const batchConvertedCSS = useMemo(() => {
        if (!batchInput || basePx <= 0) return "";
        // Match numbers followed by px (e.g. 16px, -24.5px, 0px)
        const regex = /(-?\d*\.?\d+)px/g;
        return batchInput.replace(regex, (match, p1) => {
            const pxVal = parseFloat(p1);
            if (isNaN(pxVal)) return match;
            if (pxVal === 0) return "0";
            const remVal = pxVal / basePx;
            return `${formatNumber(remVal, precision)}rem`;
        });
    }, [batchInput, basePx, precision]);

    // Tailwind spacing resolver
    const resolveTailwind = (px: number): string => {
        if (TAILWIND_SPACING_MAP[px] !== undefined) {
            return `p-${TAILWIND_SPACING_MAP[px]} / text-[${px}px]`;
        }
        const remVal = formatNumber(px / (basePx || 16), precision);
        return `[${remVal}rem]`;
    };

    // Conversion lookup table generator
    const tableData: ConversionRow[] = useMemo(() => {
        const effectiveBase = basePx > 0 ? basePx : 16;
        return COMMON_PX_VALUES.map((px) => {
            const remNum = px / effectiveBase;
            const percentNum = remNum * 100;
            return {
                px,
                rem: `${formatNumber(remNum, precision)}rem`,
                em: `${formatNumber(remNum, precision)}em`,
                percent: `${formatNumber(percentNum, precision)}%`,
                tailwindClass: resolveTailwind(px),
            };
        });
    }, [basePx, precision]);

    // Copy Handler
    const triggerCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDownloadBatch = () => {
        const blob = new Blob([batchConvertedCSS], { type: "text/css;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `converted-styles-${basePx}px-base.css`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setBasePx(16);
        setPrecision(4);
        setPxInput("16");
        setRemInput("1");
        setEmInput("1");
        setActiveSource("px");
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pixels to REM & EM Converter",
        "url": "https://twistertools.com/tools/developer-tools/px-to-rem-converter",
        "description": "Interactive developer utility to convert Pixels (px) to REM, EM, Percent, and Tailwind CSS spacing units in real-time with batch CSS code processing.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "What is the exact formula to convert Pixels (PX) to REM?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The mathematical formula to convert pixels to REM is: REM = Pixels / Base Font Size. For example, with a standard browser root base of 16px, a 24px font size is calculated as 24 / 16 = 1.5rem."
                }
            },
            {
                "@type": "Question",
                "name": "What is the key difference between REM and EM in CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "REM (Root EM) is always relative to the font-size of the root <html> element (typically 16px by default). EM is relative to the font-size of its immediate parent container element. This means EM units compound in nested hierarchies, whereas REM units maintain a predictable scale across the entire DOM tree."
                }
            },
            {
                "@type": "Question",
                "name": "Why is using REM better than PX for web accessibility (a11y)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When users change their default browser font size or adjust OS accessibility zoom settings for vision impairment, layouts built with PX units stay hardcoded and fail to scale. Designs built with REM units automatically resize in proportion to user browser preferences, complying with WCAG 2.1 SC 1.4.4 (Resize text)."
                }
            },
            {
                "@type": "Question",
                "name": "Why do some frontend developers use a 62.5% font-size trick?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Setting 'html { font-size: 62.5%; }' sets the base root font size to 10px (62.5% of 16px). This allows developers to easily calculate REMs by dividing pixels by 10 (e.g., 14px = 1.4rem, 24px = 2.4rem). However, modern frontend workflows often prefer native 16px defaults or CSS clamp() fluid typography without altering the root element."
                }
            },
            {
                "@type": "Question",
                "name": "How does Tailwind CSS map REM values to utility classes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tailwind CSS uses a default 4-to-1 scale where 1 unit equals 0.25rem (4px). For instance, 'p-4' equals 1rem (16px), 'p-6' equals 1.5rem (24px), and 'p-8' equals 2rem (32px). Arbitrary values can be declared directly using 'text-[1.125rem]' or 'w-[18px]'."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            {/* Structured Data Scripts */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Global Settings Ribbon */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                        <Sliders className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                            Base Conversion Parameters
                        </h2>
                        <p className="text-xs text-slate-400">
                            Configure root HTML element base font size and float decimal rounding
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4">
                    {/* Root Base PX Input */}
                    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl">
                        <label htmlFor="root-base" className="text-xs font-bold text-slate-300">
                            Root Base:
                        </label>
                        <input
                            id="root-base"
                            type="number"
                            min="1"
                            max="128"
                            step="0.5"
                            value={basePx === 0 ? "" : basePx}
                            onChange={handleBasePxChange}
                            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-400 text-center outline-none focus:border-indigo-500"
                        />
                        <span className="text-xs font-mono text-slate-400">px</span>
                    </div>

                    {/* Quick Base Presets */}
                    <div className="flex items-center bg-slate-950/80 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => setBasePx(16)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${basePx === 16 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                                }`}
                        >
                            16px (Default)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBasePx(10)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${basePx === 10 ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
                                }`}
                        >
                            10px (62.5%)
                        </button>
                    </div>

                    {/* Precision Dropdown */}
                    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl">
                        <label htmlFor="precision-select" className="text-xs font-bold text-slate-300">
                            Decimals:
                        </label>
                        <select
                            id="precision-select"
                            value={precision}
                            onChange={(e) => setPrecision(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-700 text-indigo-400 text-xs font-mono font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                            <option value={2}>2 Decimals</option>
                            <option value={3}>3 Decimals</option>
                            <option value={4}>4 Decimals</option>
                            <option value={6}>6 Decimals</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <button
                        type="button"
                        onClick={handleReset}
                        title="Reset Default Values"
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 max-w-md mx-auto">
                <button
                    type="button"
                    onClick={() => setActiveTab("single")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "single"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Live Converter
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("batch")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "batch"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                >
                    <FileCode className="w-3.5 h-3.5" />
                    Batch CSS Code
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("table")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeTab === "table"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                        }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    Reference Chart
                </button>
            </div>

            {/* MODE 1: SINGLE LIVE CONVERTER (50/50 Workspace Grid) */}
            {activeTab === "single" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                    {/* Left Workspace Panel: Input Triggers */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Interactive Input Units
                                </h2>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Two-Way Sync
                                </span>
                            </div>

                            {/* Pixel Input Card */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="px-input-field" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Hash className="w-3.5 h-3.5 text-indigo-600" /> Pixels (PX)
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                                        Target Absolute Value
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="px-input-field"
                                        type="number"
                                        step="any"
                                        placeholder="16"
                                        value={pxInput}
                                        onChange={(e) => handlePxChange(e.target.value)}
                                        className="w-full text-2xl font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-base font-bold text-slate-500 font-mono w-10">px</span>
                                </div>
                            </div>

                            {/* REM Input Card */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="rem-input-field" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileType className="w-3.5 h-3.5 text-indigo-600" /> Root EM (REM)
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                                        Relative to {basePx}px Root
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="rem-input-field"
                                        type="number"
                                        step="any"
                                        placeholder="1"
                                        value={remInput}
                                        onChange={(e) => handleRemChange(e.target.value)}
                                        className="w-full text-2xl font-bold font-mono text-indigo-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-base font-bold text-indigo-600 font-mono w-10">rem</span>
                                </div>
                            </div>

                            {/* EM Input Card */}
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="em-input-field" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-indigo-600" /> Parent EM (EM)
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                                        Parent Contextual
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        id="em-input-field"
                                        type="number"
                                        step="any"
                                        placeholder="1"
                                        value={emInput}
                                        onChange={(e) => handleEmChange(e.target.value)}
                                        className="w-full text-2xl font-bold font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500"
                                    />
                                    <span className="text-base font-bold text-slate-600 font-mono w-10">em</span>
                                </div>
                            </div>

                            {/* Quick Preset Buttons */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Common Spacing Presets (PX)
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[12, 14, 16, 18, 20, 24, 32, 40, 48, 64].map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => handlePxChange(preset.toString())}
                                            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition cursor-pointer ${pxInput === preset.toString()
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {preset}px
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Instant Client-Side Math
                            </span>
                            <span>Standard CSS3 Specs</span>
                        </div>
                    </div>

                    {/* Right Workspace Panel: Output Cards & Real-Time Typography Visualizer */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    Generated Outputs & Preview
                                </h2>
                                <span className="text-xs font-mono text-slate-500">
                                    Base: {basePx}px
                                </span>
                            </div>

                            {/* Output Metric Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 mb-1">
                                        <span>REM Value</span>
                                        <button
                                            type="button"
                                            onClick={() => triggerCopy(`${remInput}rem`, "rem-val")}
                                            className="text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                            title="Copy REM"
                                        >
                                            {copiedKey === "rem-val" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700 truncate">
                                        {remInput || "0"}rem
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Tailwind Spacing</span>
                                        <button
                                            type="button"
                                            onClick={() => triggerCopy(resolveTailwind(parseFloat(pxInput) || 0), "tw-val")}
                                            className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                            title="Copy Tailwind"
                                        >
                                            {copiedKey === "tw-val" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="text-base sm:text-lg font-bold font-mono text-slate-900 truncate">
                                        {resolveTailwind(parseFloat(pxInput) || 0)}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>EM Value</span>
                                        <button
                                            type="button"
                                            onClick={() => triggerCopy(`${emInput}em`, "em-val")}
                                            className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                            title="Copy EM"
                                        >
                                            {copiedKey === "em-val" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 truncate">
                                        {emInput || "0"}em
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Percentage</span>
                                        <button
                                            type="button"
                                            onClick={() => triggerCopy(`${formatNumber((parseFloat(remInput) || 0) * 100, precision)}%`, "pct-val")}
                                            className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                            title="Copy Percent"
                                        >
                                            {copiedKey === "pct-val" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 truncate">
                                        {formatNumber((parseFloat(remInput) || 0) * 100, precision)}%
                                    </div>
                                </div>
                            </div>

                            {/* Live Interactive Typography Visualizer */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Live Render Scale & Box Dimension Stage
                                </label>
                                <div className="p-6 rounded-xl border border-slate-200 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex flex-col items-center justify-center min-h-[140px] text-center overflow-hidden">
                                    <div
                                        style={{ fontSize: `${Math.max(8, Math.min(120, parseFloat(pxInput) || 16))}px` }}
                                        className="font-bold text-slate-900 tracking-tight transition-all duration-150 break-all leading-none mb-3"
                                    >
                                        Aa Type Specimen
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-300/80 shadow-xs text-xs font-mono text-slate-600">
                                        <span>Size: <strong>{pxInput || "0"}px</strong></span>
                                        <span className="text-slate-300">|</span>
                                        <span>Computed: <strong className="text-indigo-600">{remInput || "0"}rem</strong></span>
                                    </div>
                                </div>
                            </div>

                            {/* CSS Snippet Declaration Output */}
                            <div className="relative">
                                <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                                    <code>
                                        {`/* CSS Utility Declarations */
.element-font {
  font-size: ${remInput || "1"}rem; /* ${pxInput || "16"}px */
}
.element-spacing {
  padding: ${remInput || "1"}rem;
  margin-bottom: ${remInput || "1"}rem;
}`}
                                    </code>
                                </pre>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => triggerCopy(`${remInput || "0"}rem`, "main-btn")}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                            >
                                {copiedKey === "main-btn" ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-300" /> Copied {remInput}rem!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" /> Copy {remInput || "0"}rem
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODE 2: BATCH CSS CODE CONVERTER */}
            {activeTab === "batch" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                    {/* Left Panel: Raw Input Code */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6 min-w-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                Input Raw CSS Code (PX)
                            </h2>
                            <button
                                type="button"
                                onClick={() => setBatchInput("")}
                                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition cursor-pointer"
                            >
                                Clear All
                            </button>
                        </div>

                        <p className="text-xs text-slate-600">
                            Paste full CSS stylesheets, style rules, or shorthand definitions. All pixel values (e.g., <code>16px</code>) will be automatically detected and converted to <code>rem</code> based on your <strong>{basePx}px</strong> root.
                        </p>

                        <textarea
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            rows={12}
                            placeholder="font-size: 16px;\npadding: 24px 32px;"
                            className="w-full h-80 bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                        />
                    </div>

                    {/* Right Panel: Converted REM Code */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 p-4 sm:p-6 min-w-0 flex flex-col justify-between h-full">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-600" />
                                    Converted Stylesheet (REM)
                                </h2>
                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    Ready to Paste
                                </span>
                            </div>

                            <textarea
                                readOnly
                                value={batchConvertedCSS}
                                rows={12}
                                className="w-full h-80 bg-slate-900 text-indigo-200 font-mono text-xs p-4 rounded-xl border border-slate-800 outline-none resize-none leading-relaxed select-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => triggerCopy(batchConvertedCSS, "batch-copy")}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                            >
                                {copiedKey === "batch-copy" ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-300" /> Copied Batch Code!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" /> Copy Converted CSS
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadBatch}
                                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition border border-slate-200 cursor-pointer"
                            >
                                <Download className="w-4 h-4" /> Download .css
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODE 3: QUICK CONVERSION MATRIX / REFERENCE TABLE */}
            {activeTab === "table" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-600" />
                                Comprehensive PX to REM / EM Quick Lookup Table
                            </h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Calculated against root font-size: <strong className="text-indigo-600 font-mono">{basePx}px</strong>. Click any row or cell to copy.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const csvRows = [
                                        "Pixels (PX),Root EM (REM),Parent EM (EM),Percentage (%),Tailwind Utility",
                                        ...tableData.map(r => `${r.px}px,${r.rem},${r.em},${r.percent},"${r.tailwindClass}"`)
                                    ].join("\n");
                                    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", url);
                                    link.setAttribute("download", `px-to-rem-conversion-table-${basePx}px.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                            >
                                <Download className="w-4 h-4" /> Export CSV Table
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5">Pixels (PX)</th>
                                    <th className="p-3.5">Root EM (REM)</th>
                                    <th className="p-3.5">Parent EM (EM)</th>
                                    <th className="p-3.5">Percentage (%)</th>
                                    <th className="p-3.5">Tailwind Equivalent</th>
                                    <th className="p-3.5 text-right">Quick Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-xs">
                                {tableData.map((row) => (
                                    <tr key={row.px} className="hover:bg-indigo-50/40 transition">
                                        <td className="p-3.5 font-bold text-slate-900">
                                            {row.px}px
                                        </td>
                                        <td className="p-3.5 font-bold text-indigo-600">
                                            {row.rem}
                                        </td>
                                        <td className="p-3.5 text-slate-700">
                                            {row.em}
                                        </td>
                                        <td className="p-3.5 text-slate-600">
                                            {row.percent}
                                        </td>
                                        <td className="p-3.5 text-slate-500 font-sans">
                                            <code className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-800">
                                                {row.tailwindClass}
                                            </code>
                                        </td>
                                        <td className="p-3.5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => triggerCopy(row.rem, `row-${row.px}`)}
                                                className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 hover:text-indigo-600 font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer font-sans"
                                            >
                                                {copiedKey === `row-${row.px}` ? (
                                                    <Check className="w-3 h-3 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3 h-3" />
                                                )}
                                                Copy
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Deep-Dive on CSS Units */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of CSS Typography Units: Pixels vs. REM vs. EM
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern responsive web design requires balancing pixel-perfect spatial control with dynamic accessibility scaling. Choosing the correct CSS dimension unit determines how gracefully your user interface adapts across diverse viewport resolutions, device pixel densities, and custom browser font preferences.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Hash className="w-4 h-4 text-indigo-600" /> Pixels (px) — Absolute Unit
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Pixels represent fixed, absolute CSS lengths tied directly to screen dots (1 CSS px = 1/96th of an inch). While simple to conceptualize, pixel values ignore user-configured browser font settings, which introduces major accessibility barriers for visually impaired visitors.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileType className="w-4 h-4 text-indigo-600" /> Root EM (rem) — Relative Unit
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                REM units compute relative to the font-size of the root <code>&lt;html&gt;</code> tag (defaulting to 16px). Because REM references a single universal root value throughout the document tree, it eliminates nested cascading bugs while respecting user browser zoom settings.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" /> Parent EM (em) — Contextual Unit
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                EM units calculate relative to the font-size of their direct parent container element. This makes EM ideal for self-contained components where icons, borders, and margins must scale proportionally when their local component font size changes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive CSS Sizing Architecture Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below highlights architectural trade-offs between PX, REM, and EM across accessibility, maintainability, and fluid responsive design:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Architectural Criteria</th>
                                    <th className="p-3">Pixels (px)</th>
                                    <th className="p-3">Root EM (rem)</th>
                                    <th className="p-3">Parent EM (em)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">WCAG 2.1 Accessibility (SC 1.4.4)</td>
                                    <td className="p-3 text-rose-600 font-bold">Fails Browser Scaling</td>
                                    <td className="p-3 text-emerald-700 font-bold">100% Compliant</td>
                                    <td className="p-3 text-emerald-700 font-bold">100% Compliant</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Compounding Risk in Nested Lists</td>
                                    <td className="p-3 text-emerald-700 font-bold">No Compounding</td>
                                    <td className="p-3 text-emerald-700 font-bold">No Compounding (Fixed Root)</td>
                                    <td className="p-3 text-rose-600 font-bold">Severe Compounding Risk</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Best Use Case</td>
                                    <td className="p-3 text-slate-700 font-semibold">1px hairline borders, box-shadows</td>
                                    <td className="p-3 text-indigo-700 font-bold">Global font-size, layout margins & padding</td>
                                    <td className="p-3 text-indigo-700 font-bold">Icon sizing, button internal padding</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Global Theming Flexibility</td>
                                    <td className="p-3 text-rose-600 font-bold">Rigid (Requires rewriting rules)</td>
                                    <td className="p-3 text-emerald-700 font-bold">Instant (Adjust single root variable)</td>
                                    <td className="p-3 text-amber-600 font-semibold">Context-dependent</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Mathematical Formulas and Calculations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Percent className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Exact Conversion Formulas & Mathematical Derivations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting between pixel measurements and relative CSS units involves simple proportional ratios against base font sizes:
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Dimension Calculation Equations
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">Pixels to REM:</span>
                                <strong className="text-indigo-300 text-sm">REM = PX / Root_Base_PX</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">REM to Pixels:</span>
                                <strong className="text-indigo-300 text-sm">PX = REM × Root_Base_PX</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">REM to Percentage (%):</span>
                                <strong className="text-indigo-300 text-sm">% = (PX / Root_Base_PX) × 100</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Production Code Recipes */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Recipes: Fluid Typography, CSS clamp(), and Tailwind Sizing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern CSS workflows frequently combine REM units with <code>clamp()</code> to construct fluid typography scales that automatically adjust smoothly between mobile and 4K desktop screens without media query breakpoints:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Recipe 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">1. Fluid REM Clamp Formula</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Modern CSS</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`/* Scales smoothly between 1.25rem (20px) and 2.5rem (40px) */
.fluid-headline {
  font-size: clamp(1.25rem, 0.95rem + 1.5vw, 2.5rem);
  line-height: 1.2;
  margin-bottom: 1.5rem;
}`}
                            </pre>
                        </div>

                        {/* Recipe 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">2. Scalable Component Button (EM Context)</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Self-Scaling</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`/* Padding scales automatically with parent font size */
.button-scalable {
  font-size: 1rem; /* 16px */
  padding: 0.5em 1.25em; /* 8px 20px */
  border-radius: 0.375em; /* 6px */
}`}
                            </pre>
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
                                What is the exact formula to convert Pixels (PX) to REM?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The mathematical formula to convert pixels to REM is: REM = Pixels / Base Font Size. For example, with a standard browser root base of 16px, a 24px font size is calculated as 24 / 16 = 1.5rem.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the key difference between REM and EM in CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"REM (Root EM) is always relative to the font-size of the root <html> element (typically 16px by default). EM is relative to the font-size of its immediate parent container element. This means EM units compound in nested hierarchies, whereas REM units maintain a predictable scale across the entire DOM tree."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is using REM better than PX for web accessibility (a11y)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"When users change their default browser font size or adjust OS accessibility zoom settings for vision impairment, layouts built with PX units stay hardcoded and fail to scale. Designs built with REM units automatically resize in proportion to user browser preferences, complying with WCAG 2.1 SC 1.4.4 (Resize text)."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do some frontend developers use a 62.5% font-size trick?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Setting 'html { font-size: 62.5%; }' sets the base root font size to 10px (62.5% of 16px). This allows developers to easily calculate REMs by dividing pixels by 10 (e.g., 14px = 1.4rem, 24px = 2.4rem). However, modern frontend workflows often prefer native 16px defaults or CSS clamp() fluid typography without altering the root element."}
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does Tailwind CSS map REM values to utility classes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"Tailwind CSS uses a default 4-to-1 scale where 1 unit equals 0.25rem (4px). For instance, 'p-4' equals 1rem (16px), 'p-6' equals 1.5rem (24px), and 'p-8' equals 2rem (32px). Arbitrary values can be declared directly using 'text-[1.125rem]' or 'w-[18px]'."}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}