"use client";

import React, { useState, useMemo } from "react";
import {
    Sparkles,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Layers,
    Code,
    Maximize2,
    BookOpen,
    HelpCircle,
    ShieldCheck,
    Cpu,
    Eye,
    Palette,
    FileText,
    Terminal,
    Compass,
    Shapes
} from "lucide-react";

type UnitType = "px" | "%" | "rem";
type GeneratorMode = "border-radius" | "8-point" | "clip-path";

interface ClipPathPreset {
    id: string;
    name: string;
    value: string;
    category: "Geom" | "Polygons" | "Arrows" | "Shapes";
}

const CLIP_PATH_PRESETS: ClipPathPreset[] = [
    { id: "circle", name: "Circle", value: "circle(50% at 50% 50%)", category: "Shapes" },
    { id: "ellipse", name: "Ellipse", value: "ellipse(50% 35% at 50% 50%)", category: "Shapes" },
    { id: "triangle", name: "Triangle", value: "polygon(50% 0%, 0% 100%, 100% 100%)", category: "Polygons" },
    { id: "rhombus", name: "Rhombus / Diamond", value: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", category: "Polygons" },
    { id: "pentagon", name: "Pentagon", value: "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)", category: "Polygons" },
    { id: "hexagon", name: "Hexagon", value: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)", category: "Polygons" },
    { id: "octagon", name: "Octagon", value: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)", category: "Polygons" },
    { id: "star-5", name: "5-Point Star", value: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)", category: "Shapes" },
    { id: "chevron-right", name: "Chevron Right", value: "polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)", category: "Arrows" },
    { id: "arrow-right", name: "Arrow Right", value: "polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)", category: "Arrows" },
    { id: "cross", name: "Cross / Plus", value: "polygon(10% 25%, 35% 25%, 35% 0%, 65% 0%, 65% 25%, 90% 25%, 90% 50%, 65% 50%, 65% 100%, 35% 100%, 35% 50%, 10% 50%)", category: "Polygons" },
    { id: "message-bubble", name: "Speech Bubble", value: "polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)", category: "Shapes" },
    { id: "bevel", name: "Beveled Corners", value: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)", category: "Geom" },
    { id: "rabbet", name: "Corner Cut (Rabbet)", value: "polygon(0% 15%, 15% 15%, 15% 0%, 85% 0%, 85% 15%, 100% 15%, 100% 85%, 85% 85%, 85% 100%, 15% 100%, 15% 85%, 0% 85%)", category: "Geom" },
    { id: "ticket", name: "Cinema Ticket Cut", value: "polygon(0% 0%, 100% 0%, 100% 40%, 90% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, 10% 50%, 0% 40%)", category: "Geom" },
];

interface BorderRadiusPreset {
    name: string;
    tl: number;
    tr: number;
    br: number;
    bl: number;
    unit: string;
}

const BORDER_RADIUS_PRESETS: BorderRadiusPreset[] = [
    { name: "Pill / Capsule", tl: 9999, tr: 9999, br: 9999, bl: 9999, unit: "px" },
    { name: "Soft Rounded Card", tl: 24, tr: 24, br: 24, bl: 24, unit: "px" },
    { name: "Leaf Shape", tl: 80, tr: 0, br: 80, bl: 0, unit: "%" },
    { name: "Teardrop", tl: 0, tr: 50, br: 50, bl: 50, unit: "%" },
    { name: "Asymmetric Badge", tl: 32, tr: 4, br: 32, bl: 4, unit: "px" },
    { name: "Standard iOS Icon", tl: 22, tr: 22, br: 22, bl: 22, unit: "%" },
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    maxVal: number = 1000
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(0);
    } else {
        setter(Math.min(maxVal, Math.max(0, num)));
    }
};

export default function CssBorderRadiusGenerator() {
    const [mode, setMode] = useState<GeneratorMode>("border-radius");
    const [unit, setUnit] = useState<UnitType>("px");
    const [allLinked, setAllLinked] = useState<boolean>(true);

    // Standard 4-Corner Radius States
    const [allRadius, setAllRadius] = useState<number>(24);
    const [tlRadius, setTlRadius] = useState<number>(24);
    const [trRadius, setTrRadius] = useState<number>(24);
    const [brRadius, setBrRadius] = useState<number>(24);
    const [blRadius, setBlRadius] = useState<number>(24);

    // Advanced 8-Value Complex Elliptical Radius States (Horizontal / Vertical)
    const [hTl, setHTl] = useState<number>(60);
    const [hTr, setHTr] = useState<number>(40);
    const [hBr, setHBr] = useState<number>(30);
    const [hBl, setHBl] = useState<number>(70);
    const [vTl, setVTl] = useState<number>(60);
    const [vTr, setVTr] = useState<number>(30);
    const [vBr, setVBr] = useState<number>(70);
    const [vBl, setVBl] = useState<number>(40);

    // Clip-Path Generator States
    const [selectedClipPreset, setSelectedClipPreset] = useState<string>(CLIP_PATH_PRESETS[0].id);
    const [customClipPath, setCustomClipPath] = useState<string>(CLIP_PATH_PRESETS[0].value);

    // Visual Customizer
    const [previewBg, setPreviewBg] = useState<string>("indigo");
    const [showBorder, setShowBorder] = useState<boolean>(true);
    const [showShadow, setShowShadow] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);

    // Linked slider synchronization
    const handleAllRadiusChange = (val: number) => {
        setAllRadius(val);
        setTlRadius(val);
        setTrRadius(val);
        setBrRadius(val);
        setBlRadius(val);
    };

    // Calculate dynamic CSS string
    const computedCss = useMemo(() => {
        if (mode === "border-radius") {
            if (allLinked) {
                return `border-radius: ${allRadius}${unit};`;
            }
            if (tlRadius === trRadius && trRadius === brRadius && brRadius === blRadius) {
                return `border-radius: ${tlRadius}${unit};`;
            }
            if (tlRadius === brRadius && trRadius === blRadius) {
                return `border-radius: ${tlRadius}${unit} ${trRadius}${unit};`;
            }
            return `border-radius: ${tlRadius}${unit} ${trRadius}${unit} ${brRadius}${unit} ${blRadius}${unit};`;
        }

        if (mode === "8-point") {
            return `border-radius: ${hTl}% ${hTr}% ${hBr}% ${hBl}% / ${vTl}% ${vTr}% ${vBr}% ${vBl}%;`;
        }

        if (mode === "clip-path") {
            return `clip-path: ${customClipPath};\n-webkit-clip-path: ${customClipPath};`;
        }

        return "";
    }, [mode, unit, allLinked, allRadius, tlRadius, trRadius, brRadius, blRadius, hTl, hTr, hBr, hBl, vTl, vTr, vBr, vBl, customClipPath]);

    // Full style block export with vendor prefixes
    const fullCssOutput = useMemo(() => {
        if (mode === "border-radius" || mode === "8-point") {
            const rawRadius = computedCss.replace("border-radius: ", "").replace(";", "");
            return `/* CSS Border-Radius Output */\n-webkit-border-radius: ${rawRadius};\n-moz-border-radius: ${rawRadius};\nborder-radius: ${rawRadius};`;
        }
        return `/* CSS Clip-Path Output */\n-webkit-clip-path: ${customClipPath};\nclip-path: ${customClipPath};`;
    }, [computedCss, mode, customClipPath]);

    // Tailwind CSS equivalent output
    const tailwindOutput = useMemo(() => {
        if (mode === "border-radius") {
            if (allLinked) {
                return `rounded-[${allRadius}${unit}]`;
            }
            return `rounded-tl-[${tlRadius}${unit}] rounded-tr-[${trRadius}${unit}] rounded-br-[${brRadius}${unit}] rounded-bl-[${blRadius}${unit}]`;
        }
        if (mode === "8-point") {
            return `rounded-[${hTl}%_${hTr}%_${hBr}%_${hBl}%_/_${vTl}%_${vTr}%_${vBr}%_${vBl}%]`;
        }
        return `[clip-path:${customClipPath.replace(/\s+/g, "_")}]`;
    }, [mode, allLinked, allRadius, unit, tlRadius, trRadius, brRadius, blRadius, hTl, hTr, hBr, hBl, vTl, vTr, vBr, vBl, customClipPath]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setMode("border-radius");
        setUnit("px");
        setAllLinked(true);
        setAllRadius(24);
        setTlRadius(24);
        setTrRadius(24);
        setBrRadius(24);
        setBlRadius(24);
        setHTl(60);
        setHTr(40);
        setHBr(30);
        setHBl(70);
        setVTl(60);
        setVTr(30);
        setVBr(70);
        setVBl(40);
        setSelectedClipPreset(CLIP_PATH_PRESETS[0].id);
        setCustomClipPath(CLIP_PATH_PRESETS[0].value);
    };

    const handleSelectClipPreset = (preset: ClipPathPreset) => {
        setSelectedClipPreset(preset.id);
        setCustomClipPath(preset.value);
    };

    const handleRandomBlob = () => {
        setHTl(Math.floor(Math.random() * 60) + 20);
        setHTr(Math.floor(Math.random() * 60) + 20);
        setHBr(Math.floor(Math.random() * 60) + 20);
        setHBl(Math.floor(Math.random() * 60) + 20);
        setVTl(Math.floor(Math.random() * 60) + 20);
        setVTr(Math.floor(Math.random() * 60) + 20);
        setVBr(Math.floor(Math.random() * 60) + 20);
        setVBl(Math.floor(Math.random() * 60) + 20);
    };

    // Color theme dictionary
    const bgStyles: Record<string, string> = {
        indigo: "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white",
        emerald: "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white",
        amber: "bg-gradient-to-tr from-amber-500 to-rose-500 text-white",
        slate: "bg-gradient-to-tr from-slate-900 to-slate-700 text-white",
        mesh: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white",
        outline: "bg-indigo-50 border-2 border-dashed border-indigo-500 text-indigo-900",
    };

    // JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Border Radius & Clip-Path Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-border-radius-generator",
        "description": "Visual, interactive CSS border-radius and clip-path generator. Create 8-point organic blob shapes, complex polygon clip-paths, Tailwind utility classes, and vendor-prefixed cross-browser code in real-time.",
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
                "name": "What is the difference between CSS border-radius and clip-path?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "CSS border-radius rounds the geometric corners of an element's outer border box and supports background clipping and box-shadow styling. In contrast, CSS clip-path defines a precise clipping region (polygons, circles, ellipses, SVG paths) that cuts away both visible content and shadows, allowing for arbitrary non-rectangular geometric shapes."
                }
            },
            {
                "@type": "Question",
                "name": "How does the 8-value CSS border-radius slash syntax work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The slash '/' in border-radius separates horizontal radii from vertical radii. The syntax is: 'border-radius: [horizontal-tl] [horizontal-tr] [horizontal-br] [horizontal-bl] / [vertical-tl] [vertical-tr] [vertical-br] [vertical-bl];'. This allows creating asymmetrical, organic fluid blobs and smooth curved corners."
                }
            },
            {
                "@type": "Question",
                "name": "Why do CSS box-shadows disappear when using clip-path?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The CSS clip-path property masks out everything located outside the defined boundary coordinate polygon, including external CSS box-shadows. To preserve shadows on clip-pathed elements, apply a CSS filter: drop-shadow(x y blur color) to a parent wrapper container instead."
                }
            },
            {
                "@type": "Question",
                "name": "How do I use these generated shapes directly inside Tailwind CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For complex border-radii or clip-paths not present in default Tailwind utilities, wrap the generated CSS declaration inside Tailwind arbitrary value brackets: rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] or [clip-path:polygon(50%_0%,_0%_100%,_100%_100%)], replacing spaces with underscores."
                }
            },
            {
                "@type": "Question",
                "name": "Are modern CSS clip-path and 8-point border-radius properties fully cross-browser compatible?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. CSS border-radius (including 8-value elliptical syntax) enjoys 100% universal support across all modern web browsers. CSS clip-path: polygon(), circle(), and ellipse() are supported in all modern versions of Chrome, Edge, Safari, Firefox, and mobile engines, with vendor -webkit- prefixes included for maximum legacy compatibility."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Mode Switcher Navigation Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                    onClick={() => setMode("border-radius")}
                    className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${mode === "border-radius"
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Sliders className="w-4 h-4" />
                    <span>4-Corner Radius</span>
                </button>

                <button
                    onClick={() => setMode("8-point")}
                    className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${mode === "8-point"
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>8-Point Organic Blob</span>
                </button>

                <button
                    onClick={() => setMode("clip-path")}
                    className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${mode === "clip-path"
                            ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                >
                    <Maximize2 className="w-4 h-4" />
                    <span>Clip-Path Polygons</span>
                </button>
            </div>

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Interactive Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                {mode === "border-radius" && "Standard Corner Dimensions"}
                                {mode === "8-point" && "Elliptical / 8-Value Controls"}
                                {mode === "clip-path" && "Polygon & Shape Geometry"}
                            </h2>

                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                {mode === "border-radius" && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500 font-bold uppercase">Unit:</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                            {(["px", "%", "rem"] as UnitType[]).map((u) => (
                                                <button
                                                    key={u}
                                                    onClick={() => setUnit(u)}
                                                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition cursor-pointer ${unit === u ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                                        }`}
                                                >
                                                    {u}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mode === "8-point" && (
                                    <button
                                        onClick={handleRandomBlob}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Randomize
                                    </button>
                                )}

                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200 cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" /> Reset
                                </button>
                            </div>
                        </div>

                        {/* MODE 1: 4-Corner Radius Controls */}
                        {mode === "border-radius" && (
                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-indigo-600" />
                                        <span className="text-xs sm:text-sm font-bold text-slate-800">Synchronize All Corners</span>
                                    </div>
                                    <button
                                        onClick={() => setAllLinked(!allLinked)}
                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${allLinked ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                                            }`}
                                    >
                                        {allLinked ? "Linked (All Equal)" : "Independent Corners"}
                                    </button>
                                </div>

                                {allLinked ? (
                                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200/80">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span>Universal Corner Radius</span>
                                            <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {allRadius}{unit}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={unit === "%" ? 50 : unit === "rem" ? 10 : 250}
                                            step={unit === "rem" ? 0.1 : 1}
                                            value={allRadius}
                                            onChange={(e) => handleAllRadiusChange(Number(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Top-Left */}
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Top-Left (TL)</span>
                                                <span className="font-mono text-indigo-600">{tlRadius}{unit}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={unit === "%" ? 50 : unit === "rem" ? 10 : 250}
                                                step={unit === "rem" ? 0.1 : 1}
                                                value={tlRadius}
                                                onChange={(e) => setTlRadius(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>

                                        {/* Top-Right */}
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Top-Right (TR)</span>
                                                <span className="font-mono text-indigo-600">{trRadius}{unit}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={unit === "%" ? 50 : unit === "rem" ? 10 : 250}
                                                step={unit === "rem" ? 0.1 : 1}
                                                value={trRadius}
                                                onChange={(e) => setTrRadius(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>

                                        {/* Bottom-Right */}
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Bottom-Right (BR)</span>
                                                <span className="font-mono text-indigo-600">{brRadius}{unit}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={unit === "%" ? 50 : unit === "rem" ? 10 : 250}
                                                step={unit === "rem" ? 0.1 : 1}
                                                value={brRadius}
                                                onChange={(e) => setBrRadius(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>

                                        {/* Bottom-Left */}
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-slate-700">
                                                <span>Bottom-Left (BL)</span>
                                                <span className="font-mono text-indigo-600">{blRadius}{unit}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={unit === "%" ? 50 : unit === "rem" ? 10 : 250}
                                                step={unit === "rem" ? 0.1 : 1}
                                                value={blRadius}
                                                onChange={(e) => setBlRadius(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Preset Library */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Quick Radius Presets
                                    </label>
    <div className="flex flex-wrap gap-1.5">
                                        {BORDER_RADIUS_PRESETS.map((preset) => (
                                            <button
                                                key={preset.name}
                                                onClick={() => {
                                                    setUnit(preset.unit as UnitType);
                                                    setAllLinked(false);
                                                    setTlRadius(preset.tl);
                                                    setTrRadius(preset.tr);
                                                    setBrRadius(preset.br);
                                                    setBlRadius(preset.bl);
                                                }}
                                                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 border border-slate-200 transition cursor-pointer"
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 2: 8-Point Organic Blob Controls */}
                        {mode === "8-point" && (
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                        <Compass className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                                        <span>Horizontal Axes (First 4 Values before Slash &apos;/&apos;)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Horizontal TL</span>
                                                <span className="font-mono text-indigo-600">{hTl}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={hTl}
                                                onChange={(e) => setHTl(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Horizontal TR</span>
                                                <span className="font-mono text-indigo-600">{hTr}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={hTr}
                                                onChange={(e) => setHTr(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Horizontal BR</span>
                                                <span className="font-mono text-indigo-600">{hBr}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={hBr}
                                                onChange={(e) => setHBr(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Horizontal BL</span>
                                                <span className="font-mono text-indigo-600">{hBl}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={hBl}
                                                onChange={(e) => setHBl(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                        <Compass className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                        <span>Vertical Axes (Last 4 Values after Slash &apos;/&apos;)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Vertical TL</span>
                                                <span className="font-mono text-purple-600">{vTl}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={vTl}
                                                onChange={(e) => setVTl(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Vertical TR</span>
                                                <span className="font-mono text-purple-600">{vTr}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={vTr}
                                                onChange={(e) => setVTr(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Vertical BR</span>
                                                <span className="font-mono text-purple-600">{vBr}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={vBr}
                                                onChange={(e) => setVBr(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>Vertical BL</span>
                                                <span className="font-mono text-purple-600">{vBl}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={vBl}
                                                onChange={(e) => setVBl(Number(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 3: Clip-Path Controls */}
                        {mode === "clip-path" && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Preset Geometric Shapes ({CLIP_PATH_PRESETS.length})
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1 border border-slate-200 rounded-xl">
                                        {CLIP_PATH_PRESETS.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => handleSelectClipPreset(preset)}
                                                className={`p-2 rounded-lg text-left text-xs font-semibold transition border cursor-pointer ${selectedClipPreset === preset.id
                                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                                                    }`}
                                            >
                                                <span className="block truncate font-bold">{preset.name}</span>
                                                <span className="block text-[10px] text-slate-400 font-normal">{preset.category}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Custom Clip-Path Function (Editable)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={customClipPath}
                                        onChange={(e) => setCustomClipPath(e.target.value)}
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                                        placeholder="polygon(50% 0%, 0% 100%, 100% 100%)"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preview Appearance Settings */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                                Preview Canvas Skin
                            </label>
                            <div className="flex items-center gap-2 text-xs">
                                <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={showBorder}
                                        onChange={(e) => setShowBorder(e.target.checked)}
                                        className="rounded text-indigo-600 accent-indigo-600"
                                    />
                                    Border
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={showShadow}
                                        onChange={(e) => setShowShadow(e.target.checked)}
                                        className="rounded text-indigo-600 accent-indigo-600"
                                    />
                                    Shadow
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {Object.keys(bgStyles).map((skin) => (
                                <button
                                    key={skin}
                                    onClick={() => setPreviewBg(skin)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${previewBg === skin
                                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    {skin}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Preview & Generated Code */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Live Visual Canvas
                            </h2>
                            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-100">
                                {mode.toUpperCase()}
                            </span>
                        </div>

                        {/* Interactive Stage */}
                        <div className="w-full min-h-[280px] bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                            <div
                                className={`w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-center p-4 transition-all duration-300 transform select-none ${bgStyles[previewBg]} ${showShadow && mode !== "clip-path" ? "shadow-2xl shadow-indigo-500/25" : ""
                                    } ${showBorder && mode !== "clip-path" ? "border-2 border-white/40" : ""}`}
                                style={{
                                    borderRadius:
                                        mode === "border-radius"
                                            ? allLinked
                                                ? `${allRadius}${unit}`
                                                : `${tlRadius}${unit} ${trRadius}${unit} ${brRadius}${unit} ${blRadius}${unit}`
                                            : mode === "8-point"
                                                ? `${hTl}% ${hTr}% ${hBr}% ${hBl}% / ${vTl}% ${vTr}% ${vBr}% ${vBl}%`
                                                : undefined,
                                    clipPath: mode === "clip-path" ? customClipPath : undefined,
                                    WebkitClipPath: mode === "clip-path" ? customClipPath : undefined,
                                }}
                            >
                                <Shapes className="w-8 h-8 mb-2 opacity-90" />
                                <span className="font-bold text-sm tracking-wide">CSS Shape Canvas</span>
                                <span className="text-[11px] opacity-80 mt-1 font-mono">224 × 224 px</span>
                            </div>
                        </div>

                        {/* Code Outputs */}
                        <div className="space-y-4">
                            {/* Standard Pure CSS Output Box */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Code className="w-3.5 h-3.5 text-indigo-600" />
                                        Standard CSS Rule
                                    </span>
                                    <button
                                        onClick={() => handleCopy(fullCssOutput)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied" : "Copy CSS"}
                                    </button>
                                </div>
                                <div className="bg-slate-900 text-indigo-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                                    <pre>{fullCssOutput}</pre>
                                </div>
                            </div>

                            {/* Tailwind CSS Utility Output Box */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                                        Tailwind CSS Class
                                    </span>
                                    <button
                                        onClick={() => handleCopy(tailwindOutput)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Copy Class
                                    </button>
                                </div>
                                <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
                                    <code>{tailwindOutput}</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Hardware Accelerated Rendering
                        </span>
                        <span>Zero External CDN Bloat</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Mechanics & Slash Syntax */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Deep Dive: CSS Border Radius Anatomy & The 8-Value Slash Syntax
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The CSS <strong>border-radius</strong> property defines how the outer and inner borders of an element are rounded. While developers most frequently write single-value shorthand (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">border-radius: 16px;</code>) which renders symmetrical quarter-circles, the W3C CSS Backgrounds and Borders Module Level 3 specification supports full elliptical curvature via an eight-value syntax separated by a forward slash (<code className="bg-slate-100 px-1 py-0.5 rounded text-xs">/</code>).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Symmetrical 4-Value Clockwise Order
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Four values define the corner radii in standard clockwise orientation:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                border-radius: [top-left] [top-right] [bottom-right] [bottom-left];
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Asymmetrical 8-Value Elliptical Slash
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Values before the slash represent horizontal radii; values after the slash define vertical radii:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                border-radius: H-TL H-TR H-BR H-BL / V-TL V-TR V-BR V-BL;
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> CSS Corner Curve Rendering Logic
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            When the sum of two adjacent border radii exceeds the element width or height, the browser automatically applies the W3C <em>Overlapping Curves Reduction Formula</em>: it scales all radii down proportionally by a factor $f = \min(L_x / S_x, L_y / S_y)$ so that the corners never intersect or distort the interior layout engine.
                        </p>
                    </div>
                </section>

                {/* Card 2: Border Radius vs Clip-Path Feature Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Architectural Analysis: Border-Radius vs Clip-Path
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Choosing between <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">border-radius</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">clip-path</code> depends on whether you require box-shadow rendering, complex geometric vertices, or strict GPU boundary clipping.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3.5">Feature & Capability</th>
                                    <th className="p-3.5">CSS border-radius</th>
                                    <th className="p-3.5">CSS clip-path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-semibold text-slate-900">Supported Shapes</td>
                                    <td className="p-3.5">Rounded rectangles, pills, circles, smooth organic blobs</td>
                                    <td className="p-3.5 font-bold text-indigo-600">Arbitrary polygons, stars, chevrons, SVG paths</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-semibold text-slate-900">Native CSS box-shadow Support</td>
                                    <td className="p-3.5 text-emerald-700 font-bold">Yes (Curves naturally around borders)</td>
                                    <td className="p-3.5 text-rose-600 font-bold">No (Masks out outer shadows; requires drop-shadow filter)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-semibold text-slate-900">Child Element Clipping</td>
                                    <td className="p-3.5">Requires <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">overflow: hidden;</code></td>
                                    <td className="p-3.5 text-emerald-700 font-bold">Automatic hardware mask</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-semibold text-slate-900">Border Stroke Customization</td>
                                    <td className="p-3.5 text-emerald-700 font-bold">Native <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">border: 2px solid</code></td>
                                    <td className="p-3.5 text-amber-700 font-medium">Complex (requires pseudo-element or SVG stroke)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3.5 font-semibold text-slate-900">Animation Performance</td>
                                    <td className="p-3.5">High (GPU Composited)</td>
                                    <td className="p-3.5 font-bold text-indigo-600">High (Polygon vertex morphing in modern engines)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Code Implementation Cheat Sheet */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Implementation Cheat Sheet
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Copy these production-ready code patterns directly into your SCSS, Tailwind CSS, or CSS-in-JS architecture:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-600" /> Pure SCSS / CSS Mixin
                            </h3>
                            <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                {`.organic-blob {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #4f46e5, #06b6d4);
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  transition: border-radius 1s ease-in-out;
}`}
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Code className="w-4 h-4 text-indigo-600" /> Tailwind CSS Arbitrary Setup
                            </h3>
                            <div className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                {`<!-- Tailwind Arbitrary Values -->
<div className="w-72 h-72 bg-indigo-600 
  rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%] 
  hover:rounded-[30%_70%_70%_30%_/_30%_30%_70%_70%] 
  transition-all duration-700 shadow-xl">
</div>`}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended FAQ */}
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
                                What is the difference between CSS border-radius and clip-path?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                CSS border-radius rounds the geometric corners of an element&apos;s outer border box and supports background clipping and box-shadow styling. In contrast, CSS clip-path defines a precise clipping region (polygons, circles, ellipses, SVG paths) that cuts away both visible content and shadows, allowing for arbitrary non-rectangular geometric shapes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the 8-value CSS border-radius slash syntax work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The slash &apos;/&apos; in border-radius separates horizontal radii from vertical radii. The syntax is: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">border-radius: [horizontal-tl] [horizontal-tr] [horizontal-br] [horizontal-bl] / [vertical-tl] [vertical-tr] [vertical-br] [vertical-bl];</code>. This allows creating asymmetrical, organic fluid blobs and smooth curved corners.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do CSS box-shadows disappear when using clip-path?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The CSS clip-path property masks out everything located outside the defined boundary coordinate polygon, including external CSS box-shadows. To preserve shadows on clip-pathed elements, apply a CSS filter: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1))</code> to a parent wrapper container instead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I use these generated shapes directly inside Tailwind CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                For complex border-radii or clip-paths not present in default Tailwind utilities, wrap the generated CSS declaration inside Tailwind arbitrary value brackets: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">rounded-[60%_40%_30%_70%_/_60%_30%_70%_40%]</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">[clip-path:polygon(50%_0%,_0%_100%,_100%_100%)]</code>, replacing spaces with underscores.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are modern CSS clip-path and 8-point border-radius properties fully cross-browser compatible?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. CSS border-radius (including 8-value elliptical syntax) enjoys 100% universal support across all modern web browsers. CSS clip-path polygon(), circle(), and ellipse() are supported in all modern versions of Chrome, Edge, Safari, Firefox, and mobile engines, with vendor -webkit- prefixes included for maximum legacy compatibility.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}