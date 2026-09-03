"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    Maximize2,
    Lock,
    Unlock,
    RotateCcw,
    Copy,
    Check,
    Download,
    Sparkles,
    Image as ImageIcon,
    Sliders,
    Monitor,
    Smartphone,
    Tv,
    FileCode,
    Camera,
    HelpCircle,
    BookOpen,
    Info,
    Percent,
    MoveRight,
    Ratio,
    ShieldCheck,
    Layers,
    Table
} from "lucide-react";

interface PresetRatio {
    label: string;
    ratioW: number;
    ratioH: number;
    description: string;
    tag: "Display" | "Social" | "Cinema" | "Print";
}

const COMMON_PRESETS: PresetRatio[] = [
    { label: "16:9", ratioW: 16, ratioH: 9, description: "Widescreen Displays, YouTube, TV", tag: "Display" },
    { label: "4:3", ratioW: 4, ratioH: 3, description: "Classic CRT, iPads, Standard Photos", tag: "Display" },
    { label: "1:1", ratioW: 1, ratioH: 1, description: "Square, Instagram Feed, Avatars", tag: "Social" },
    { label: "9:16", ratioW: 9, ratioH: 16, description: "Vertical Reels, TikTok, Shorts, Stories", tag: "Social" },
    { label: "4:5", ratioW: 4, ratioH: 5, description: "Instagram Portrait Post", tag: "Social" },
    { label: "21:9", ratioW: 21, ratioH: 9, description: "UltraWide Monitors, Cinematic Anamorphic", tag: "Cinema" },
    { label: "2.39:1", ratioW: 239, ratioH: 100, description: "Modern Panavision CinemaScope", tag: "Cinema" },
    { label: "3:2", ratioW: 3, ratioH: 2, description: "35mm Film & DSLR Sensors", tag: "Print" },
    { label: "5:4", ratioW: 5, ratioH: 4, description: "Large Format Photo & 1280x1024 LCDs", tag: "Print" },
    { label: "1.91:1", ratioW: 191, ratioH: 100, description: "Open Graph, X & LinkedIn Social Cards", tag: "Social" }
];

interface StandardResolutionPreset {
    name: string;
    width: number;
    height: number;
    ratioStr: string;
    category: string;
}

const STANDARD_RESOLUTIONS: StandardResolutionPreset[] = [
    { name: "Full HD (1080p)", width: 1920, height: 1080, ratioStr: "16:9", category: "Video & Displays" },
    { name: "2K Quad HD (1440p)", width: 2560, height: 1440, ratioStr: "16:9", category: "Video & Displays" },
    { name: "4K Ultra HD (2160p)", width: 3840, height: 2160, ratioStr: "16:9", category: "Video & Displays" },
    { name: "8K Ultra HD (4320p)", width: 7680, height: 4320, ratioStr: "16:9", category: "Video & Displays" },
    { name: "HD Standard (720p)", width: 1280, height: 720, ratioStr: "16:9", category: "Video & Displays" },
    { name: "Instagram Post (Square)", width: 1080, height: 1080, ratioStr: "1:1", category: "Social Media" },
    { name: "Instagram Portrait (4:5)", width: 1080, height: 1350, ratioStr: "4:5", category: "Social Media" },
    { name: "TikTok / Reels / Shorts", width: 1080, height: 1920, ratioStr: "9:16", category: "Social Media" },
    { name: "X (Twitter) Landscape Post", width: 1600, height: 900, ratioStr: "16:9", category: "Social Media" },
    { name: "Social Share / Open Graph (OG)", width: 1200, height: 630, ratioStr: "1.91:1", category: "Social Media" },
    { name: "YouTube Channel Banner", width: 2560, height: 1440, ratioStr: "16:9", category: "Social Media" },
    { name: "DCI 4K (Native Cinema)", width: 4096, height: 2160, ratioStr: "1.90:1", category: "Film & Cinema" },
    { name: "UltraWide QHD", width: 3440, height: 1440, ratioStr: "21:9", category: "Video & Displays" }
];

// Helper: Greatest Common Divisor
function calculateGCD(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) {
        const t = y;
        y = x % y;
        x = t;
    }
    return x || 1;
}

// Helper: Sanitize number inputs to allow smooth backspacing without sticky "0" prefixes
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

export default function ImageAspectRatioScaler() {
    // Mode toggle: Dimension Resizer vs Missing Dimension Finder
    const [calcMode, setCalcMode] = useState<"scale" | "missing">("scale");

    // Scale Mode States (Original Width/Height -> Target Width or Height or Factor)
    const [origWidth, setOrigWidth] = useState<number>(1920);
    const [origHeight, setOrigHeight] = useState<number>(1080);
    const [targetWidth, setTargetWidth] = useState<number>(1280);
    const [targetHeight, setTargetHeight] = useState<number>(720);
    const [scalePercent, setScalePercent] = useState<number>(66.67);
    const [isProportionalLocked, setIsProportionalLocked] = useState<boolean>(true);

    // Missing Dimension Mode States (Ratio W:H + Known Dimension -> Compute Missing)
    const [ratioW, setRatioW] = useState<number>(16);
    const [ratioH, setRatioH] = useState<number>(9);
    const [knownType, setKnownType] = useState<"width" | "height">("width");
    const [knownValue, setKnownValue] = useState<number>(1920);

    // UX Feedback States
    const [copied, setCopied] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

    // Local file drop / dimension probe state
    const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mathematical Computations: Scale Mode
    const originalAspectData = useMemo(() => {
        const w = Math.max(1, origWidth);
        const h = Math.max(1, origHeight);
        const gcd = calculateGCD(w, h);
        const decimal = w / h;
        const simplifiedW = Math.round(w / gcd);
        const simplifiedH = Math.round(h / gcd);
        const totalMegapixels = (w * h) / 1_000_000;

        return {
            decimal,
            simplified: `${simplifiedW}:${simplifiedH}`,
            megapixels: totalMegapixels.toFixed(2),
            gcd
        };
    }, [origWidth, origHeight]);

    // Update target dimensions when target width changes
    const handleTargetWidthChange = (val: number) => {
        setTargetWidth(val);
        if (isProportionalLocked && origWidth > 0 && origHeight > 0) {
            const calculatedH = Math.round((val / origWidth) * origHeight);
            setTargetHeight(calculatedH);
            const calculatedPct = ((val / origWidth) * 100);
            setScalePercent(parseFloat(calculatedPct.toFixed(2)));
        }
    };

    // Update target dimensions when target height changes
    const handleTargetHeightChange = (val: number) => {
        setTargetHeight(val);
        if (isProportionalLocked && origWidth > 0 && origHeight > 0) {
            const calculatedW = Math.round((val / origHeight) * origWidth);
            setTargetWidth(calculatedW);
            const calculatedPct = ((val / origHeight) * 100);
            setScalePercent(parseFloat(calculatedPct.toFixed(2)));
        }
    };

    // Update dimensions based on scaling slider / percentage
    const handleScalePercentChange = (pct: number) => {
        const safePct = Math.max(1, pct);
        setScalePercent(safePct);
        if (origWidth > 0 && origHeight > 0) {
            const newW = Math.round((origWidth * safePct) / 100);
            const newH = Math.round((origHeight * safePct) / 100);
            setTargetWidth(newW);
            setTargetHeight(newH);
        }
    };

    // Missing Dimension Result Calculation
    const missingDimensionResult = useMemo(() => {
        const rw = Math.max(0.001, ratioW);
        const rh = Math.max(0.001, ratioH);
        const kv = Math.max(1, knownValue);

        if (knownType === "width") {
            // Known width, find height: H = W * (rh / rw)
            const calculatedHeight = Math.round(kv * (rh / rw));
            const decimal = rw / rh;
            return {
                width: kv,
                height: calculatedHeight,
                decimal,
                orientation: rw > rh ? "Landscape" : rw < rh ? "Portrait" : "Square",
                missingLabel: "Height",
                missingValue: calculatedHeight
            };
        } else {
            // Known height, find width: W = H * (rw / rh)
            const calculatedWidth = Math.round(kv * (rw / rh));
            const decimal = rw / rh;
            return {
                width: calculatedWidth,
                height: kv,
                decimal,
                orientation: rw > rh ? "Landscape" : rw < rh ? "Portrait" : "Square",
                missingLabel: "Width",
                missingValue: calculatedWidth
            };
        }
    }, [ratioW, ratioH, knownType, knownValue]);

    // Apply standard resolution preset directly
    const applyResolutionPreset = (res: StandardResolutionPreset) => {
        setOrigWidth(res.width);
        setOrigHeight(res.height);
        setTargetWidth(res.width);
        setTargetHeight(res.height);
        setScalePercent(100);
    };

    // Apply aspect ratio preset
    const applyRatioPreset = (preset: PresetRatio) => {
        if (calcMode === "missing") {
            setRatioW(preset.ratioW);
            setRatioH(preset.ratioH);
        } else {
            // Scale mode: retain width, calculate height to match preset ratio
            if (origWidth > 0) {
                const newHeight = Math.round(origWidth * (preset.ratioH / preset.ratioW));
                setOrigHeight(newHeight);
                setTargetWidth(origWidth);
                setTargetHeight(newHeight);
                setScalePercent(100);
            }
        }
    };

    // File inspection: Extract physical image dimensions automatically
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadedFileName(file.name);
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setOrigWidth(img.naturalWidth);
            setOrigHeight(img.naturalHeight);
            setTargetWidth(img.naturalWidth);
            setTargetHeight(img.naturalHeight);
            setScalePercent(100);
            URL.revokeObjectURL(img.src);
        };
    };

    // Reset Engine to 1080p defaults
    const handleReset = () => {
        setOrigWidth(1920);
        setOrigHeight(1080);
        setTargetWidth(1280);
        setTargetHeight(720);
        setScalePercent(66.67);
        setIsProportionalLocked(true);
        setRatioW(16);
        setRatioH(9);
        setKnownType("width");
        setKnownValue(1920);
        setLoadedFileName(null);
    };

    // Copy formatted dimensions summary to clipboard
    const handleCopySummary = () => {
        let summary = "";
        if (calcMode === "scale") {
            summary = `TwisterTools Aspect Ratio & Scale Report:
----------------------------------------
Original Dimensions: ${origWidth} × ${origHeight} px (${originalAspectData.simplified})
Decimal Ratio: ${originalAspectData.decimal.toFixed(4)}
Original Megapixels: ${originalAspectData.megapixels} MP
----------------------------------------
Target Scaled Dimensions: ${targetWidth} × ${targetHeight} px
Scaling Factor: ${scalePercent}%
Target Megapixels: ${((targetWidth * targetHeight) / 1_000_000).toFixed(2)} MP
Difference: ${targetWidth - origWidth >= 0 ? `+${targetWidth - origWidth}` : targetWidth - origWidth}px (W) | ${targetHeight - origHeight >= 0 ? `+${targetHeight - origHeight}` : targetHeight - origHeight}px (H)
----------------------------------------
Computed at: twistertools.com/tools/image-tools/image-aspect-ratio-scaler`;
        } else {
            summary = `TwisterTools Missing Dimension Report:
----------------------------------------
Target Ratio: ${ratioW}:${ratioH} (Decimal: ${missingDimensionResult.decimal.toFixed(4)})
Provided Dimension: ${knownType.toUpperCase()} = ${knownValue} px
Calculated ${missingDimensionResult.missingLabel}: ${missingDimensionResult.missingValue} px
Final Resolution: ${missingDimensionResult.width} × ${missingDimensionResult.height} px
Orientation: ${missingDimensionResult.orientation}
----------------------------------------
Computed at: twistertools.com/tools/image-tools/image-aspect-ratio-scaler`;
        }

        navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Active dimensions for visual preview canvas
    const previewWidth = calcMode === "scale" ? targetWidth : missingDimensionResult.width;
    const previewHeight = calcMode === "scale" ? targetHeight : missingDimensionResult.height;
    const previewDecimal = calcMode === "scale" ? originalAspectData.decimal : missingDimensionResult.decimal;

    // Constrain visual CSS aspect box inside preview viewport
    const previewBoxStyle = useMemo(() => {
        const maxStageDim = 200; // max box edge in px
        let boxW = maxStageDim;
        let boxH = maxStageDim;

        if (previewDecimal >= 1) {
            // Landscape or square
            boxW = maxStageDim;
            boxH = Math.max(30, Math.round(maxStageDim / previewDecimal));
        } else {
            // Portrait
            boxH = maxStageDim;
            boxW = Math.max(30, Math.round(maxStageDim * previewDecimal));
        }
        return { width: `${boxW}px`, height: `${boxH}px` };
    }, [previewDecimal]);

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Aspect Ratio Scaler & Missing Dimension Calculator",
        "url": "https://twistertools.com/tools/image-tools/image-aspect-ratio-scaler",
        "description": "Calculate missing image dimensions, resize aspect ratios proportionally without distortion, convert standard resolutions (16:9, 4:3, 1:1, 9:16), and export CSS/HTML aspect-ratio code.",
        "applicationCategory": "MultimediaApplication",
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
                "name": "What is an image aspect ratio and how is it calculated?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "An aspect ratio is the proportional relationship between an image's width and its height, represented as two numbers separated by a colon (W:H). It is calculated by dividing both width and height by their greatest common divisor (GCD). For example, 1920 divided by 120 and 1080 divided by 120 simplifies to 16:9."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate a missing dimension while preserving aspect ratio?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To find a missing height given width and aspect ratio (W:H), use the formula: Height = Width × (H / W). To find a missing width given height, use: Width = Height × (W / H). For example, with a 16:9 ratio and a width of 1280px, Height = 1280 × (9 / 16) = 720px."
                }
            },
            {
                "@type": "Question",
                "name": "What are the most common aspect ratios in digital media?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The most common aspect ratios include 16:9 (standard widescreen for YouTube, TV, and monitors), 9:16 (vertical mobile video for TikTok, Reels, and Shorts), 1:1 (square for Instagram feeds and profile pictures), 4:5 (Instagram portrait posts), 4:3 (classic displays and photography), and 1.91:1 (recommended for web Open Graph social sharing cards)."
                }
            },
            {
                "@type": "Question",
                "name": "Does scaling an image dimension change its file resolution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Changing an image's pixel dimensions proportionally alters its total pixel count (megapixels). Downscaling reduces file size and network loading times for web optimization, while upscaling beyond physical camera resolution requires interpolation algorithms that may produce softness."
                }
            },
            {
                "@type": "Question",
                "name": "How does CSS aspect-ratio property replace padding hacks?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern CSS supports the native 'aspect-ratio' property (e.g., aspect-ratio: 16 / 9;), eliminating the legacy 'padding-top percentage' hack. It allows elements to automatically compute their opposite dimension dynamically as layout viewports change."
                }
            },
            {
                "@type": "Question",
                "name": "Is my uploaded image sent to a server for dimension probing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. When you upload or drag an image into TwisterTools, it is probed 100% locally in your browser memory using HTML5 Image() objects and Object URLs. No files are uploaded to any external server."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Workspace Bar: Calculation Mode Selector */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode:</span>
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setCalcMode("scale")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${calcMode === "scale"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                            Proportional Dimension Scaler
                        </button>
                        <button
                            type="button"
                            onClick={() => setCalcMode("missing")}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${calcMode === "missing"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            <Ratio className="w-3.5 h-3.5" />
                            Missing Dimension Calculator
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                        title="Inspect physical image dimensions instantly"
                    >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                        {loadedFileName ? `Loaded: ${loadedFileName.slice(0, 14)}...` : "Probe Image File"}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                </div>
            </div>

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Input Fields */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                {calcMode === "scale" ? "Dimensions & Scaling Factor" : "Target Ratio & Known Side"}
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                                {calcMode === "scale" ? "Two-Way Link" : "Single Variable"}
                            </span>
                        </div>

                        {/* MODE 1: SCALE MODE */}
                        {calcMode === "scale" ? (
                            <div className="space-y-5">
                                {/* Original Dimension Inputs */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Original Dimensions (Width × Height)
                                        </label>
                                        <span className="text-xs text-slate-500">
                                            Ratio: <strong className="text-indigo-600">{originalAspectData.simplified}</strong> ({originalAspectData.decimal.toFixed(2)})
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={origWidth === 0 ? "" : origWidth}
                                                onChange={(e) => handleNumberInput(e, setOrigWidth)}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Width"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                W px
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={origHeight === 0 ? "" : origHeight}
                                                onChange={(e) => handleNumberInput(e, setOrigHeight)}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Height"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                H px
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Lock / Proportional Constraint Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsProportionalLocked(!isProportionalLocked)}
                                            className={`p-1.5 rounded-lg border transition cursor-pointer ${isProportionalLocked
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-500 border-slate-300 hover:bg-slate-100"
                                                }`}
                                            title="Toggle Proportional Aspect Ratio Lock"
                                        >
                                            {isProportionalLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </button>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {isProportionalLocked ? "Constrain Proportions Locked" : "Free Distortion Unlocked"}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {isProportionalLocked ? "Modifying width automatically adjusts height" : "Width and height scale independently"}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-600">
                                        {isProportionalLocked ? "100% Proportional" : "Manual"}
                                    </span>
                                </div>

                                {/* Target Scaled Dimensions */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Target Scaled Dimensions
                                        </label>
                                        <span className="text-xs text-slate-500">
                                            Scale: <strong className="text-indigo-600">{scalePercent}%</strong>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={targetWidth === 0 ? "" : targetWidth}
                                                onChange={(e) => handleNumberInput(e, handleTargetWidthChange)}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Target W"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                W px
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="100000"
                                                value={targetHeight === 0 ? "" : targetHeight}
                                                onChange={(e) => handleNumberInput(e, handleTargetHeightChange)}
                                                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Target H"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                H px
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Scale Percentage Slider */}
                                <div className="space-y-2 pt-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span>Scale Percentage Factor</span>
                                        <span className="text-indigo-600 font-mono text-sm">{scalePercent}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="400"
                                        step="1"
                                        value={scalePercent}
                                        onChange={(e) => handleScalePercentChange(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                        <span>25% (Thumbnail)</span>
                                        <span>50% (Half)</span>
                                        <span>100% (Native)</span>
                                        <span>200% (Retina 2x)</span>
                                        <span>400%</span>
                                    </div>
                                </div>

                                {/* Quick Percentage Preset Buttons */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {[25, 50, 75, 100, 150, 200].map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => handleScalePercentChange(pct)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${scalePercent === pct
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-300"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* MODE 2: MISSING DIMENSION MODE */
                            <div className="space-y-5">
                                {/* Ratio Input (W:H) */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Desired Aspect Ratio (Width : Height)
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 items-center">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="any"
                                                value={ratioW === 0 ? "" : ratioW}
                                                onChange={(e) => handleNumberInput(e, setRatioW)}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Ratio Width"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                W
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="any"
                                                value={ratioH === 0 ? "" : ratioH}
                                                onChange={(e) => handleNumberInput(e, setRatioH)}
                                                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                                placeholder="Ratio Height"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                H
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Known Dimension Selector */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        I Know The Exact:
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setKnownType("width")}
                                            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${knownType === "width"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Known Width (Find Height)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setKnownType("height")}
                                            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${knownType === "height"
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            Known Height (Find Width)
                                        </button>
                                    </div>
                                </div>

                                {/* Known Value Input */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Enter Known {knownType === "width" ? "Width" : "Height"} Value (Pixels)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100000"
                                            value={knownValue === 0 ? "" : knownValue}
                                            onChange={(e) => handleNumberInput(e, setKnownValue)}
                                            className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                                            placeholder={`Enter ${knownType} in pixels`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                            Pixels
                                        </span>
                                    </div>
                                </div>

                                {/* Calculated Missing Side Highlight Box */}
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-800">
                                        <span>Calculated Missing {missingDimensionResult.missingLabel}</span>
                                        <span className="bg-indigo-200/80 px-2 py-0.5 rounded text-indigo-900">
                                            Formula: {knownType === "width" ? "H = W × (H_r / W_r)" : "W = H × (W_r / H_r)"}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-indigo-900 font-mono">
                                        {missingDimensionResult.missingValue} <span className="text-sm font-bold">px</span>
                                    </p>
                                    <p className="text-xs text-indigo-700">
                                        Final Dimensions: <strong>{missingDimensionResult.width} × {missingDimensionResult.height} px</strong> ({missingDimensionResult.orientation})
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Aspect Ratio Presets Row */}
                        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Instant Aspect Ratio Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                {COMMON_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyRatioPreset(preset)}
                                        className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition text-left cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600">
                                                {preset.label}
                                            </span>
                                            <span className="text-[9px] font-semibold px-1 rounded bg-slate-100 text-slate-500">
                                                {preset.tag}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                            {preset.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopySummary}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied Report" : "Copy Dimension Report"}
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Visual Ratio Canvas & Code Snippets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Monitor className="w-5 h-5 text-indigo-600" />
                                Geometric Visualizer &amp; Code
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("preview")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "preview" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    Canvas Stage
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("code")}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "code" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600"
                                        }`}
                                >
                                    CSS / HTML Code
                                </button>
                            </div>
                        </div>

                        {activeTab === "preview" ? (
                            <div className="space-y-4">
                                {/* Visual Preview Box Stage */}
                                <div className="h-64 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative p-4 overflow-hidden">
                                    {/* Grid Texture Background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

                                    {/* Simulated Dynamic Ratio Box */}
                                    <div
                                        style={previewBoxStyle}
                                        className="relative z-10 border-2 border-indigo-400 bg-indigo-500/20 rounded-lg flex flex-col items-center justify-center shadow-lg transition-all duration-300 backdrop-blur-xs p-2 text-center"
                                    >
                                        <span className="text-xs font-black text-white font-mono drop-shadow-sm">
                                            {previewWidth} × {previewHeight}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-200 mt-0.5">
                                            {previewDecimal >= 1 ? `${previewDecimal.toFixed(2)}:1` : `1:${(1 / previewDecimal).toFixed(2)}`}
                                        </span>
                                    </div>

                                    {/* Overlay Dimension Tags */}
                                    <div className="absolute bottom-3 left-3 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                                        Stage: Scale-Normalized
                                    </div>
                                    <div className="absolute bottom-3 right-3 text-[11px] font-bold text-indigo-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                                        {previewDecimal > 1 ? "Landscape" : previewDecimal < 1 ? "Portrait" : "1:1 Square"}
                                    </div>
                                </div>

                                {/* Statistical Metrics Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Simplified Ratio
                                        </span>
                                        <p className="text-base font-black text-slate-900 mt-1">
                                            {calcMode === "scale" ? originalAspectData.simplified : `${ratioW}:${ratioH}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Decimal: {previewDecimal.toFixed(4)}
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Megapixel Count
                                        </span>
                                        <p className="text-base font-black text-slate-900 mt-1">
                                            {((previewWidth * previewHeight) / 1_000_000).toFixed(2)} MP
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Total: {(previewWidth * previewHeight).toLocaleString()} px
                                        </p>
                                    </div>

                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                            Diagonal Distance
                                        </span>
                                        <p className="text-base font-black text-indigo-600 mt-1">
                                            {Math.round(Math.sqrt(previewWidth ** 2 + previewHeight ** 2)).toLocaleString()} px
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            Pythagorean (√(W²+H²))
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Code Snippets Tab */
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                            <FileCode className="w-4 h-4 text-indigo-600" />
                                            Modern CSS Property
                                        </span>
                                        <span className="text-[10px] text-slate-400">Standard Spec</span>
                                    </div>
                                    <pre className="p-3 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800">
                                        <code>{`/* Native Responsive Aspect Ratio */
.responsive-media {
  width: 100%;
  aspect-ratio: ${previewWidth} / ${previewHeight};
  object-fit: cover;
}`}</code>
                                    </pre>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                            <Layers className="w-4 h-4 text-indigo-600" />
                                            Tailwind CSS Utility Class
                                        </span>
                                        <span className="text-[10px] text-slate-400">Tailwind 3.x / 4.x</span>
                                    </div>
                                    <pre className="p-3 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto border border-slate-800">
                                        <code>{`<div className="w-full aspect-[${previewWidth}/${previewHeight}] object-cover">
  {/* Content */}
</div>`}</code>
                                    </pre>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                            <Tv className="w-4 h-4 text-indigo-600" />
                                            HTML5 Embedded Image Attributes
                                        </span>
                                        <span className="text-[10px] text-slate-400">Prevents CLS Layout Shift</span>
                                    </div>
                                    <pre className="p-3 rounded-xl bg-slate-950 text-amber-300 font-mono text-xs overflow-x-auto border border-slate-800">
                                        <code>{`<img 
  src="/path-to-image.jpg" 
  width="${previewWidth}" 
  height="${previewHeight}" 
  alt="Scaled Media"
  loading="lazy" 
/>`}</code>
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Standard Popular Resolutions Quick Picker */}
                        <div className="space-y-2 pt-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Tv className="w-4 h-4 text-indigo-600" />
                                Load Standard Resolution Benchmark
                            </label>
                            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {STANDARD_RESOLUTIONS.map((res) => (
                                    <button
                                        key={res.name}
                                        type="button"
                                        onClick={() => applyResolutionPreset(res)}
                                        className="w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 group-hover:text-indigo-600">
                                                {res.name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                ({res.category})
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono text-slate-600 text-[11px]">
                                            <span>{res.width} × {res.height}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                {res.ratioStr}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            100% Client-Side Probing
                        </span>
                        <span>Zero Distortion Guarantee</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Mathematical Foundations of Scaling and Missing Dimensions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Proportions, Greatest Common Divisors &amp; Geometry
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital image processing and UI engineering, an <strong>aspect ratio</strong> defines the proportional geometric relationship between an asset’s horizontal width ($W$) and vertical height ($H$). When scaling a graphic proportionally without introducing skewing, stretching, or pixel compression artifacts, both dimensions must satisfy a strict linear equality:
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        {"$$\\frac{W_{target}}{H_{target}} = \\frac{W_{original}}{H_{original}} = r$$"}
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Here, $r$ represents the constant scalar ratio value. When solving for a missing dimension given a known target side and an intended aspect ratio ($W_r : H_r$), the algebraic derivation depends on which coordinate is locked:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MoveRight className="w-4 h-4 text-indigo-600" /> Finding Missing Height (H)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When horizontal container width ($W$) is fixed by responsive layout constraints, calculate the missing vertical height ($H$) using:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                H = W × (H_r / W_r) = W / (W_r / H_r)
                            </div>
                            <p className="text-xs text-slate-500">
                                {"Example: A 16:9 banner with a known 1200px width yields H = 1200 × (9 / 16) = 675px."}
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MoveRight className="w-4 h-4 text-indigo-600" /> Finding Missing Width (W)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                When vertical viewport height ($H$) is constrained by screen height or modal boundaries, calculate the missing horizontal width ($W$) using:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                W = H × (W_r / H_r) = H × r
                            </div>
                            <p className="text-xs text-slate-500">
                                {"Example: A 4:3 image with a known 768px height yields W = 768 × (4 / 3) = 1024px."}
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Euclidean Algorithm for Greatest Common Divisor (GCD)
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            {"To express raw pixel dimensions (such as 3840 × 2160) as irreducible integers (like 16:9), TwisterTools executes the Euclidean GCD algorithm in $O(\\log(\\min(a, b)))$ steps:"}
                        </p>
                        <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                            {"function calculateGCD(a, b) { while (b) { let t = b; b = a % b; a = t; } return a; }"}
                        </div>
                    </div>
                </section>

                {/* Card 2: Standard Aspect Ratio & Resolution Master Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Digital Media Aspect Ratio &amp; Resolution Master Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Refer to this industry-standard lookup table when provisioning image assets, setting up camera sensors, configuring video timelines, or programming responsive CSS media breakpoints:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Aspect Ratio</th>
                                    <th className="p-3">Decimal Value</th>
                                    <th className="p-3">Canonical Resolutions (Width × Height)</th>
                                    <th className="p-3">Dominant Use Cases &amp; Platforms</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3 font-mono">1.7778</td>
                                    <td className="p-3 font-mono text-xs">1920×1080 (FHD), 2560×1440 (2K), 3840×2160 (4K)</td>
                                    <td className="p-3">YouTube Videos, Desktop Monitors, HDTV broadcasts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">9:16</td>
                                    <td className="p-3 font-mono">0.5625</td>
                                    <td className="p-3 font-mono text-xs">1080×1920, 720×1280</td>
                                    <td className="p-3">TikTok, Instagram Reels, YouTube Shorts, Snapchat</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">1:1</td>
                                    <td className="p-3 font-mono">1.0000</td>
                                    <td className="p-3 font-mono text-xs">1080×1080, 800×800, 512×512</td>
                                    <td className="p-3">Instagram Grid, User Avatars, Product E-Commerce Carousels</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">4:5</td>
                                    <td className="p-3 font-mono">0.8000</td>
                                    <td className="p-3 font-mono text-xs">1080×1350, 864×1080</td>
                                    <td className="p-3">Instagram Portrait Feed Posts (Maximum Vertical Real Estate)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">1.91:1</td>
                                    <td className="p-3 font-mono">1.9100</td>
                                    <td className="p-3 font-mono text-xs">1200×630, 600×314</td>
                                    <td className="p-3">Open Graph (og:image), Twitter Card Summaries, LinkedIn Link Previews</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">4:3</td>
                                    <td className="p-3 font-mono">1.3333</td>
                                    <td className="p-3 font-mono text-xs">1024×768, 1600×1200, 2048×1536</td>
                                    <td className="p-3">Apple iPad Displays, Micro Four Thirds Cameras, Retro Gaming</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">3:2</td>
                                    <td className="p-3 font-mono">1.5000</td>
                                    <td className="p-3 font-mono text-xs">6000×4000, 3000×2000, 1080×720</td>
                                    <td className="p-3">35mm Film Still Photography, DSLR Full-Frame Sensors, Microsoft Surface</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">21:9</td>
                                    <td className="p-3 font-mono">2.3333</td>
                                    <td className="p-3 font-mono text-xs">2560×1080, 3440×1440, 5120×2160</td>
                                    <td className="p-3">UltraWide Gaming Displays, Cinematic Film Previews</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Modern Responsive Web Layouts & Cumulative Layout Shift (CLS) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Web Performance Optimization: Solving Cumulative Layout Shift (CLS)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Google Core Web Vitals heavily penalize websites exhibiting high <strong>Cumulative Layout Shift (CLS)</strong>. CLS occurs when images or videos load into the Document Object Model (DOM) without predetermined physical dimensions, causing text and neighboring UI components to violently jump downward.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-indigo-600" /> Always Supply Explicit Width & Height
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Modern browsers read explicit <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">width</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">height</code> attributes on HTML <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">&lt;img&gt;</code> tags to compute an internal aspect-ratio prior to fetching raw image bytes, reserving the exact layout box immediately.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Native CSS aspect-ratio Property
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Avoid legacy pseudo-element padding hacks (<code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">padding-top: 56.25%</code>). Native <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">aspect-ratio: 16 / 9;</code> is universally supported across Chromium, Safari, and Firefox.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Calculation Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step Practical Calculation Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Examine how professional graphic designers and front-end engineers calculate proportional dimensions in everyday production scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Resizing 4K Footage to 720p Mobile Video</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Proportional Downscale</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Scenario:</strong> You possess raw 4K UHD video at 3840 × 2160 pixels and need a 720p height asset.</li>
                                <li><strong>Step 1:</strong> Identify target height: H<sub>target</sub> = 720px.</li>
                                <li><strong>Step 2:</strong> Calculate scaling factor: 720 / 2160 = 0.3333 (33.33% scale).</li>
                                <li><strong>Step 3:</strong> Apply factor to width: 3840 × (720 / 2160) = 1280px.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: 1280 × 720 px (Maintains exact 16:9 widescreen ratio without black bars).
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Determining Height for Social Open Graph Cards</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Missing Dimension</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Scenario:</strong> A brand guidelines document mandates a 1.91:1 aspect ratio with a container width of 800px.</li>
                                <li><strong>Step 1:</strong> Ratio Width = 191, Ratio Height = 100, Known Width = 800px.</li>
                                <li><strong>Step 2:</strong> Formula: H = W × (H<sub>r</sub> / W<sub>r</sub>) = 800 × (100 / 191).</li>
                                <li><strong>Step 3:</strong> Evaluate math: 800 × 0.52356 = 418.85px.</li>
                                <li className="pt-2 border-t border-slate-200 text-indigo-900 font-bold">
                                    • Result: 800 × 419 px (Rounded to nearest discrete physical pixel).
                                </li>
                            </ul>
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
                                What is an image aspect ratio and how is it calculated?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                An aspect ratio is the proportional relationship between an image's width and its height, represented as two numbers separated by a colon (W:H). It is calculated by dividing both width and height by their greatest common divisor (GCD). For example, 1920 divided by 120 and 1080 divided by 120 simplifies to 16:9.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate a missing dimension while preserving aspect ratio?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To find a missing height given width and aspect ratio (W:H), use the formula: Height = Width × (H / W). To find a missing width given height, use: Width = Height × (W / H). For example, with a 16:9 ratio and a width of 1280px, Height = 1280 × (9 / 16) = 720px.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the most common aspect ratios in digital media?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The most common aspect ratios include 16:9 (standard widescreen for YouTube, TV, and monitors), 9:16 (vertical mobile video for TikTok, Reels, and Shorts), 1:1 (square for Instagram feeds and profile pictures), 4:5 (Instagram portrait posts), 4:3 (classic displays and photography), and 1.91:1 (recommended for web Open Graph social sharing cards).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does scaling an image dimension change its file resolution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Changing an image's pixel dimensions proportionally alters its total pixel count (megapixels). Downscaling reduces file size and network loading times for web optimization, while upscaling beyond physical camera resolution requires interpolation algorithms that may produce softness.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does CSS aspect-ratio property replace padding hacks?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern CSS supports the native 'aspect-ratio' property (e.g., aspect-ratio: 16 / 9;), eliminating the legacy 'padding-top percentage' hack. It allows elements to automatically compute their opposite dimension dynamically as layout viewports change.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my uploaded image sent to a server for dimension probing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. When you upload or drag an image into TwisterTools, it is probed 100% locally in your browser memory using HTML5 Image() objects and Object URLs. No files are uploaded to any external server.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}