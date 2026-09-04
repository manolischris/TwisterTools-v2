"use client";

import React, { useState, useMemo } from "react";
import {
    Maximize2,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Monitor,
    Smartphone,
    Code,
    Sparkles,
    BookOpen,
    HelpCircle,
    Layers,
    Lightbulb,
    FileCode2,
    Terminal,
    Eye,
    Percent,
    ArrowRightLeft,
    CheckCircle2
} from "lucide-react";

type UnitType = "rem" | "px";

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

export default function CssClampCalculator() {
    // Core parameters
    const [minViewport, setMinViewport] = useState<number>(360);
    const [maxViewport, setMaxViewport] = useState<number>(1200);
    const [minSize, setMinSize] = useState<number>(16);
    const [maxSize, setMaxSize] = useState<number>(32);
    const [rootFontSize, setRootFontSize] = useState<number>(16);
    const [cssUnit, setCssUnit] = useState<UnitType>("rem");
    const [cssProperty, setCssProperty] = useState<string>("font-size");
    const [previewWidth, setPreviewWidth] = useState<number>(768);
    const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
    const [copiedFormula, setCopiedFormula] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"css" | "tailwind" | "tokens">("css");

    // Math calculations for linear clamp interpolation
    const calculations = useMemo(() => {
        const root = rootFontSize > 0 ? rootFontSize : 16;
        const vMin = minViewport;
        const vMax = maxViewport;
        const sMin = minSize;
        const sMax = maxSize;

        const viewportDiff = vMax - vMin;
        const sizeDiff = sMax - sMin;

        // Guard against division by zero
        if (viewportDiff === 0) {
            return {
                slope: 0,
                slopeVw: 0,
                interceptPx: sMin,
                interceptRem: sMin / root,
                minRem: sMin / root,
                maxRem: sMax / root,
                clampRem: `clamp(${(sMin / root).toFixed(4)}rem, ${(sMin / root).toFixed(4)}rem, ${(sMax / root).toFixed(4)}rem)`,
                clampPx: `clamp(${sMin}px, ${sMin}px, ${sMax}px)`,
                currentCalculatedPx: sMin,
                currentCalculatedRem: sMin / root
            };
        }

        // Slope = (maxFontSize - minFontSize) / (maxViewport - minViewport)
        const slope = sizeDiff / viewportDiff;
        const slopeVw = slope * 100;

        // y-intercept = minFontSize - (slope * minViewport)
        const interceptPx = sMin - slope * vMin;
        const interceptRem = interceptPx / root;

        const minRem = sMin / root;
        const maxRem = sMax / root;

        // Sign handling for intercept
        const signPx = interceptPx >= 0 ? "+" : "-";
        const signRem = interceptRem >= 0 ? "+" : "-";
        const absInterceptPx = Math.abs(interceptPx);
        const absInterceptRem = Math.abs(interceptRem);

        const clampRem = `clamp(${minRem.toFixed(4)}rem, ${slopeVw.toFixed(4)}vw ${signRem} ${absInterceptRem.toFixed(4)}rem, ${maxRem.toFixed(4)}rem)`;
        const clampPx = `clamp(${sMin}px, ${slopeVw.toFixed(4)}vw ${signPx} ${absInterceptPx.toFixed(2)}px, ${sMax}px)`;

        // Fluid size at previewWidth
        let dynamicPx: number;
        if (previewWidth <= vMin) {
            dynamicPx = sMin;
        } else if (previewWidth >= vMax) {
            dynamicPx = sMax;
        } else {
            dynamicPx = (previewWidth * slopeVw) / 100 + interceptPx;
        }
        const dynamicRem = dynamicPx / root;

        return {
            slope,
            slopeVw,
            interceptPx,
            interceptRem,
            minRem,
            maxRem,
            clampRem,
            clampPx,
            currentCalculatedPx: dynamicPx,
            currentCalculatedRem: dynamicRem
        };
    }, [minViewport, maxViewport, minSize, maxSize, rootFontSize, previewWidth]);

    const activeClampRule = cssUnit === "rem" ? calculations.clampRem : calculations.clampPx;

    const copyToClipboard = (text: string, isFormula: boolean = false) => {
        navigator.clipboard.writeText(text);
        if (isFormula) {
            setCopiedFormula(true);
            setTimeout(() => setCopiedFormula(false), 2000);
        } else {
            setCopiedSnippet(true);
            setTimeout(() => setCopiedSnippet(false), 2000);
        }
    };

    const handleReset = () => {
        setMinViewport(360);
        setMaxViewport(1200);
        setMinSize(16);
        setMaxSize(32);
        setRootFontSize(16);
        setCssUnit("rem");
        setCssProperty("font-size");
        setPreviewWidth(768);
    };

    const getTailwindArbitrary = () => {
        return `${cssProperty === "font-size" ? "text" : cssProperty}-[${activeClampRule.replace(/\s+/g, "")}]`;
    };

    const getDesignTokenJson = () => {
        return JSON.stringify(
            {
                name: "fluid-typography-scale",
                property: cssProperty,
                unit: cssUnit,
                clamp: activeClampRule,
                parameters: {
                    minViewport: `${minViewport}px`,
                    maxViewport: `${maxViewport}px`,
                    minSize: `${minSize}px`,
                    maxSize: `${maxSize}px`,
                    rootFontSize: `${rootFontSize}px`
                }
            },
            null,
            2
        );
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Responsive CSS Clamp() & Fluid Typography Calculator",
        "url": "https://twistertools.com/tools/developer-tools/css-clamp-calculator",
        "description": "Calculate precision fluid typography and dynamic CSS clamp() rules with real-time responsive viewport simulation, REM/PX conversions, and Tailwind export.",
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
                "name": "How does the CSS clamp() mathematical formula work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The CSS clamp() function takes three parameters: a minimum bound, a preferred dynamic value, and a maximum bound clamp(MIN, VAL, MAX). The preferred dynamic value uses linear interpolation (y = mx + b), where the slope (m) is calculated as (maxSize - minSize) / (maxViewport - minViewport), rendered as viewport width units (vw), and the y-intercept (b) is converted to rem or px."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I use REM units instead of PX inside clamp() for typography?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Using REM for the y-intercept and min/max boundaries ensures accessibility compliance (WCAG SC 1.4.4). If pure PX or VW is applied without REM anchors, users who increase their default browser font size for visual impairments will see no magnification, breaking accessibility."
                }
            },
            {
                "@type": "Question",
                "name": "Can CSS clamp() be used for properties other than font-size?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The clamp() formula functions identically for line-height, padding, margins, gaps, widths, and border-radii, creating an entirely fluid component layout that scales seamlessly without requiring multiple CSS media query breakpoints."
                }
            },
            {
                "@type": "Question",
                "name": "What happens when the viewport falls below min-width or exceeds max-width?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "When the screen is narrower than your minimum viewport setting, clamp() locks strictly to your minimum size. When the viewport exceeds your maximum viewport limit, clamp() locks strictly to your maximum size, preventing typography from shrinking to microscopic sizes on small phones or expanding indefinitely on ultra-wide 4K monitors."
                }
            },
            {
                "@type": "Question",
                "name": "How do I implement this fluid clamp rule in Tailwind CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In Tailwind CSS v3 and v4, you can apply arbitrary values using bracket syntax, such as text-[clamp(1rem,2.5vw+0.5rem,2rem)], or map it inside your tailwind.config.js theme.extend.fontSize object as a reusable token."
                }
            },
            {
                "@type": "Question",
                "name": "What is the standard browser support for CSS clamp()?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS clamp() is supported in all modern browsers including Chrome, Edge, Firefox, Safari, and iOS Safari since 2020, representing over 98% global browser support."
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
                {/* Left Workspace Panel: Formula Inputs & Tuning */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap sm:flex-nowrap">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                            Clamp Parameter Controls
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setCssUnit("rem")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${cssUnit === "rem" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    REM
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCssUnit("px")}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${cssUnit === "px" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                        }`}
                                >
                                    PX
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer shadow-xs"
                                title="Reset parameters to defaults"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Viewport Range Configuration */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Monitor className="w-4 h-4 text-indigo-600" />
                            Screen Viewport Thresholds (PX)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs font-medium text-slate-500 mb-1">Min Viewport Width</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="240"
                                        max="3840"
                                        value={minViewport === 0 ? "" : minViewport}
                                        onChange={(e) => handleNumberInput(e, setMinViewport)}
                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-slate-500 mb-1">Max Viewport Width</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="240"
                                        max="3840"
                                        value={maxViewport === 0 ? "" : maxViewport}
                                        onChange={(e) => handleNumberInput(e, setMaxViewport)}
                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
                                </div>
                            </div>
                        </div>
                        {/* Quick Viewport Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-slate-400 self-center mr-1">Presets:</span>
                            {[
                                { label: "Mobile to Laptop", min: 375, max: 1280 },
                                { label: "Standard Web", min: 360, max: 1200 },
                                { label: "Ultra-Wide", min: 480, max: 1920 }
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        setMinViewport(preset.min);
                                        setMaxViewport(preset.max);
                                    }}
                                    className="px-2 py-1 rounded-md text-[11px] font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                >
                                    {preset.label} ({preset.min}-{preset.max})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Value Range Configuration */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Maximize2 className="w-4 h-4 text-indigo-600" />
                            Size Bounds (Font Size / Dimension in PX)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs font-medium text-slate-500 mb-1">Minimum Size</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={minSize === 0 ? "" : minSize}
                                        onChange={(e) => handleNumberInput(e, setMinSize)}
                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
                                </div>
                                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                                    ≈ {(minSize / (rootFontSize || 16)).toFixed(3)} rem
                                </span>
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-slate-500 mb-1">Maximum Size</span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="500"
                                        value={maxSize === 0 ? "" : maxSize}
                                        onChange={(e) => handleNumberInput(e, setMaxSize)}
                                        className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
                                </div>
                                <span className="block text-[11px] text-slate-400 mt-1 font-mono">
                                    ≈ {(maxSize / (rootFontSize || 16)).toFixed(3)} rem
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Environment Config: Root Font Size & CSS Property */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Browser Root Size
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="8"
                                    max="64"
                                    value={rootFontSize === 0 ? "" : rootFontSize}
                                    onChange={(e) => handleNumberInput(e, setRootFontSize)}
                                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">px</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">Default: 16px (1rem = 16px)</span>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                Target CSS Property
                            </label>
                            <select
                                value={cssProperty}
                                onChange={(e) => setCssProperty(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white cursor-pointer"
                            >
                                <option value="font-size">font-size</option>
                                <option value="padding">padding</option>
                                <option value="margin">margin</option>
                                <option value="gap">gap</option>
                                <option value="line-height">line-height</option>
                                <option value="width">width</option>
                            </select>
                            <span className="text-[11px] text-slate-400 mt-1 block">Used for code snippet exports</span>
                        </div>
                    </div>

                    {/* Mathematical Derivation Summary Box */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="flex items-center gap-1">
                                <Percent className="w-3.5 h-3.5 text-indigo-600" /> Linear Curve Parameters
                            </span>
                            <span className="text-indigo-600 font-mono">y = mx + b</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 pt-1">
                            <div>Slope (m): <strong className="text-slate-900">{calculations.slopeVw.toFixed(4)}vw</strong></div>
                            <div>Intercept (b): <strong className="text-slate-900">{calculations.interceptRem.toFixed(4)}rem</strong></div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-time Output & Interactive Canvas Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-600" />
                            Generated Formula & Output
                        </h2>
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setActiveTab("css")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "css" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                    }`}
                            >
                                CSS
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("tailwind")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "tailwind" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                    }`}
                            >
                                Tailwind
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("tokens")}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "tokens" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                    }`}
                            >
                                Tokens
                            </button>
                        </div>
                    </div>

                    {/* Primary Output Display Box */}
                    <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm space-y-3 relative group border border-slate-800">
                        <div className="flex items-center justify-between text-slate-400 text-xs border-b border-slate-800 pb-2">
                            <span className="font-sans font-semibold text-indigo-400 flex items-center gap-1.5">
                                <FileCode2 className="w-4 h-4" />
                                {activeTab === "css" && "Pure CSS Declaration"}
                                {activeTab === "tailwind" && "Tailwind CSS Arbitrary Class"}
                                {activeTab === "tokens" && "Design Token JSON"}
                            </span>
                            <span className="text-[11px] text-slate-500 uppercase">{cssUnit} mode</span>
                        </div>

                        <div className="overflow-x-auto py-2 text-indigo-300 font-bold selection:bg-indigo-600 selection:text-white">
                            {activeTab === "css" && `${cssProperty}: ${activeClampRule};`}
                            {activeTab === "tailwind" && getTailwindArbitrary()}
                            {activeTab === "tokens" && (
                                <pre className="text-slate-300 text-xs">{getDesignTokenJson()}</pre>
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() =>
                                    copyToClipboard(
                                        activeTab === "css"
                                            ? `${cssProperty}: ${activeClampRule};`
                                            : activeTab === "tailwind"
                                                ? getTailwindArbitrary()
                                                : getDesignTokenJson()
                                    )
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer shadow-sm"
                            >
                                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedSnippet ? "Copied Snippet!" : "Copy Snippet"}
                            </button>

                            <button
                                type="button"
                                onClick={() => copyToClipboard(activeClampRule, true)}
                                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                            >
                                {copiedFormula ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedFormula ? "Copied Raw clamp()!" : "Copy clamp() only"}
                            </button>
                        </div>
                    </div>

                    {/* Interactive Live Viewport Simulation Slider */}
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                Simulated Viewport Scaler
                            </label>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                {previewWidth}px width
                            </span>
                        </div>

                        <div className="space-y-1">
                            <input
                                type="range"
                                min="280"
                                max="1600"
                                step="1"
                                value={previewWidth}
                                onChange={(e) => setPreviewWidth(parseInt(e.target.value, 10))}
                                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                            />
                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                <span>280px (Mobile)</span>
                                <span>768px (Tablet)</span>
                                <span>1200px (Desktop)</span>
                                <span>1600px (Wide)</span>
                            </div>
                        </div>

                        {/* Visual Typography Canvas Preview */}
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden relative min-h-[160px] flex flex-col justify-between">
                            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-200">
                                <span className="font-semibold text-slate-700">Dynamic Computed Output</span>
                                <div className="font-mono text-indigo-600 font-bold">
                                    {calculations.currentCalculatedPx.toFixed(1)}px (
                                    {calculations.currentCalculatedRem.toFixed(3)}rem)
                                </div>
                            </div>

                            <div className="py-4 flex items-center justify-center overflow-x-auto">
                                <div
                                    style={{
                                        [cssProperty === "font-size" ? "fontSize" : "lineHeight"]: `${calculations.currentCalculatedPx}px`,
                                        ...(cssProperty === "padding" && { padding: `${calculations.currentCalculatedPx}px` }),
                                        ...(cssProperty === "margin" && { margin: `${calculations.currentCalculatedPx}px` })
                                    }}
                                    className="font-bold text-slate-900 tracking-tight transition-all duration-75 text-center select-none"
                                >
                                    Fluid Typography
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                                <span>Min: {minSize}px</span>
                                <span className="font-medium text-slate-600">
                                    {previewWidth <= minViewport && "Clamped to Minimum"}
                                    {previewWidth >= maxViewport && "Clamped to Maximum"}
                                    {previewWidth > minViewport && previewWidth < maxViewport && "Linear Scaling Active"}
                                </span>
                                <span>Max: {maxSize}px</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Foundations & Mathematical Formula */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations of Linear Interpolation with CSS clamp()
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In modern responsive web development, fluid typography replaces brittle, tiered <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">@media</code> queries with a single mathematical equation. By leveraging the CSS <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">clamp(MIN, VAL, MAX)</code> function, front-end engineers can smoothly scale font sizes, element padding, layout gaps, and component widths along an exact linear slope between two explicit screen viewport bounds.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> The Linear Equation: y = mx + b
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Fluid scaling is governed by elementary Cartesian linear geometry. The rate of change between font bounds and screen bounds represents the slope ($m$), while the baseline starting offset represents the vertical intercept ($b$):
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
                                <div>Slope (m) = (MaxSize - MinSize) / (MaxViewport - MinViewport)</div>
                                <div>Preferred Vw = Slope × 100vw</div>
                                <div>Intercept (b) = MinSize - (Slope × MinViewport)</div>
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Accessibility & WCAG Compliance
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Relying solely on viewport units (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs">vw</code>) violates <strong>WCAG 2.1 Success Criterion 1.4.4 (Resize Text)</strong>. Users zooming their browsers to 200% will see no magnification if text is locked to viewport width alone. Our calculator converts the intercept to <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">rem</code> units, preserving zoom accessibility.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                clamp(minRem, slopeVw + interceptRem, maxRem)
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Three Anatomical Phases of clamp()
                        </h3>
                        <div className="grid sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300 pt-1">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">1. Minimum Floor:</span>
                                <strong className="text-indigo-300 text-sm">Active when screen &lt; MinViewport</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">2. Fluid Curve:</span>
                                <strong className="text-indigo-300 text-sm">Active inside viewport bounds</strong>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-slate-400 block mb-1">3. Maximum Ceiling:</span>
                                <strong className="text-indigo-300 text-sm">Active when screen &gt; MaxViewport</strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Industry Benchmark Fluid Type Scale Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Fluid Typography Scale Matrix (360px → 1200px Viewport)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To construct a harmonious typographical hierarchy across all responsive device viewports, front-end design systems apply standardized typographic ratios (Major Second 1.125 or Minor Third 1.200). The table below outlines standard fluid sizing formulas optimized for modern responsive production environments:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Typography Token</th>
                                    <th className="p-3">Mobile (360px)</th>
                                    <th className="p-3">Desktop (1200px)</th>
                                    <th className="p-3">Calculated CSS clamp() Formula (16px Root)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Body Small (caption)</td>
                                    <td className="p-3">12px (0.75rem)</td>
                                    <td className="p-3">14px (0.875rem)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">clamp(0.75rem, 0.2381vw + 0.6964rem, 0.875rem)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Body Regular (base)</td>
                                    <td className="p-3">15px (0.9375rem)</td>
                                    <td className="p-3">17px (1.0625rem)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">clamp(0.9375rem, 0.2381vw + 0.8839rem, 1.0625rem)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">H4 Subheading</td>
                                    <td className="p-3">18px (1.125rem)</td>
                                    <td className="p-3">22px (1.375rem)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">clamp(1.125rem, 0.4762vw + 1.0179rem, 1.375rem)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">H3 Section Title</td>
                                    <td className="p-3">22px (1.375rem)</td>
                                    <td className="p-3">28px (1.75rem)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">clamp(1.375rem, 0.7143vw + 1.2143rem, 1.75rem)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">H2 Major Heading</td>
                                    <td className="p-3">28px (1.75rem)</td>
                                    <td className="p-3">40px (2.5rem)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-700">clamp(1.75rem, 1.4286vw + 1.4286rem, 2.5rem)</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/40">
                                    <td className="p-3 font-bold text-slate-900">H1 Display Hero</td>
                                    <td className="p-3 font-semibold">36px (2.25rem)</td>
                                    <td className="p-3 font-semibold">64px (4.0rem)</td>
                                    <td className="p-3 font-mono text-xs font-bold text-indigo-800">clamp(2.25rem, 3.3333vw + 1.5000rem, 4.0rem)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Tailwind CSS Integration & CSS Variables Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileCode2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Architecture: Tailwind CSS, CSS Modules & Design Systems
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rather than hand-writing raw arbitrary values repeatedly inside components, enterprise engineering teams abstract clamp formulas into CSS Custom Properties (Variables) or Tailwind theme configurations:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-indigo-600" /> Tailwind CSS Config (tailwind.config.js)
                            </h3>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`module.exports = {
  theme: {
    extend: {
      fontSize: {
        'fluid-h1': 'clamp(2.25rem, 3.33vw + 1.5rem, 4rem)',
        'fluid-body': 'clamp(1rem, 0.47vw + 0.89rem, 1.25rem)',
      },
      spacing: {
        'fluid-gap': 'clamp(1rem, 2vw + 0.5rem, 3rem)',
      }
    }
  }
}`}
                            </pre>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-indigo-600" /> Global CSS Tokens (:root)
                            </h3>
                            <pre className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`:root {
  --fluid-min-width: 360;
  --fluid-max-width: 1200;
  --fluid-h1: clamp(2.25rem, 3.33vw + 1.5rem, 4rem);
  --fluid-pad: clamp(1rem, 1.5vw + 0.75rem, 2.5rem);
}

.hero-title {
  font-size: var(--fluid-h1);
  padding-block: var(--fluid-pad);
}`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Mathematical Walkthrough */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Worked Calculation Example
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow this manual step-by-step arithmetic proof to understand precisely how the linear interpolation clamp is calculated:
                    </p>

                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <span className="font-bold text-slate-900">Case Study: 16px to 32px Font Across 360px to 1200px Viewports</span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Manual Derivation</span>
                        </div>
                        <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                            <li><strong>Step 1: Calculate Viewport & Size Deltas:</strong> Viewport Range = 1200px - 360px = 840px. Font Range = 32px - 16px = 16px.</li>
                            <li><strong>Step 2: Calculate Slope ($m$):</strong> $16 / 840 = 0.0190476$. Multiplied by 100 for viewport units: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">1.9048vw</code>.</li>
                            <li><strong>Step 3: Calculate y-intercept ($b$):</strong> $16 - (0.0190476 \times 360) = 16 - 6.8571 = 9.1429px$.</li>
                            <li><strong>Step 4: Convert Pixel Values to REM (16px Root):</strong> Min = $16 / 16 = 1.0rem$. Max = $32 / 16 = 2.0rem$. Intercept = $9.1429 / 16 = 0.5714rem$.</li>
                            <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold font-mono">
                                • Final CSS Declaration: font-size: clamp(1.0000rem, 1.9048vw + 0.5714rem, 2.0000rem);
                            </li>
                        </ul>
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
                                How does the CSS clamp() mathematical formula work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The CSS clamp() function takes three parameters: a minimum bound, a preferred dynamic value, and a maximum bound <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">clamp(MIN, VAL, MAX)</code>. The preferred dynamic value uses linear interpolation ($y = mx + b$), where the slope ($m$) is calculated as <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">(maxSize - minSize) / (maxViewport - minViewport)</code>, rendered as viewport width units (vw), and the y-intercept ($b$) is converted to rem or px.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I use REM units instead of PX inside clamp() for typography?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Using REM for the y-intercept and min/max boundaries ensures accessibility compliance (WCAG SC 1.4.4). If pure PX or VW is applied without REM anchors, users who increase their default browser font size for visual impairments will see no magnification, breaking accessibility.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can CSS clamp() be used for properties other than font-size?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The clamp() formula functions identically for line-height, padding, margins, gaps, widths, and border-radii, creating an entirely fluid component layout that scales seamlessly without requiring multiple CSS media query breakpoints.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What happens when the viewport falls below min-width or exceeds max-width?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                When the screen is narrower than your minimum viewport setting, clamp() locks strictly to your minimum size. When the viewport exceeds your maximum viewport limit, clamp() locks strictly to your maximum size, preventing typography from shrinking to microscopic sizes on small phones or expanding indefinitely on ultra-wide 4K monitors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I implement this fluid clamp rule in Tailwind CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In Tailwind CSS v3 and v4, you can apply arbitrary values using bracket syntax, such as <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">text-[clamp(1rem,2.5vw+0.5rem,2rem)]</code>, or map it inside your <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">tailwind.config.js</code> theme.extend.fontSize object as a reusable token.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the standard browser support for CSS clamp()?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS clamp() is supported in all modern browsers including Chrome, Edge, Firefox, Safari, and iOS Safari since 2020, representing over 98% global browser support.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}