"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Tv,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Maximize,
    Sliders,
    Layers,
    Code,
    Sparkles,
    BookOpen,
    HelpCircle,
    Copy,
    Check,
    RotateCcw,
    ShieldCheck,
    Cpu,
    Grid,
    Scale,
    Square,
    Eye,
    Percent,
    ArrowRightLeft,
    CheckCircle2
} from "lucide-react";

interface StandardPreset {
    name: string;
    width: number;
    height: number;
    category: "Desktop / 4K" | "Mobile" | "Tablet" | "Social Media" | "Cinema & UltraWide";
    standardRatio: string;
}

const RESOLUTION_PRESETS: StandardPreset[] = [
    { name: "4K UHD (2160p)", width: 3840, height: 2160, category: "Desktop / 4K", standardRatio: "16:9" },
    { name: "QHD / 2K (1440p)", width: 2560, height: 1440, category: "Desktop / 4K", standardRatio: "16:9" },
    { name: "Full HD (1080p)", width: 1920, height: 1080, category: "Desktop / 4K", standardRatio: "16:9" },
    { name: "HD (720p)", width: 1280, height: 720, category: "Desktop / 4K", standardRatio: "16:9" },
    { name: "UWQHD UltraWide", width: 3440, height: 1440, category: "Cinema & UltraWide", standardRatio: "21:9" },
    { name: "Dual QHD Super UltraWide", width: 5120, height: 1440, category: "Cinema & UltraWide", standardRatio: "32:9" },
    { name: "DCI 4K Cinema", width: 4096, height: 2160, category: "Cinema & UltraWide", standardRatio: "19:10" },
    { name: "Anamorphic Cinema Scope", width: 2048, height: 858, category: "Cinema & UltraWide", standardRatio: "2.39:1" },
    { name: "MacBook Pro 16\"", width: 3456, height: 2234, category: "Desktop / 4K", standardRatio: "15.5:10" },
    { name: "Apple iPad Pro 12.9\"", width: 2732, height: 2048, category: "Tablet", standardRatio: "4:3" },
    { name: "Apple iPad Air 10.9\"", width: 2360, height: 1640, category: "Tablet", standardRatio: "4.3:3" },
    { name: "Apple iPhone 16 Pro Max", width: 1320, height: 2868, category: "Mobile", standardRatio: "19.5:9" },
    { name: "Samsung Galaxy S24 Ultra", width: 1440, height: 3120, category: "Mobile", standardRatio: "19.5:9" },
    { name: "Instagram Post (Square)", width: 1080, height: 1080, category: "Social Media", standardRatio: "1:1" },
    { name: "Instagram / TikTok Story / Reel", width: 1080, height: 1920, category: "Social Media", standardRatio: "9:16" },
    { name: "Instagram Portrait (4:5)", width: 1080, height: 1350, category: "Social Media", standardRatio: "4:5" },
    { name: "YouTube / OpenGraph Thumbnail", width: 1200, height: 630, category: "Social Media", standardRatio: "1.91:1" },
    { name: "Twitter / X Post Header", width: 1500, height: 500, category: "Social Media", standardRatio: "3:1" }
];

// Helper: Greatest Common Divisor (Euclidean algorithm)
const calculateGCD = (a: number, b: number): number => {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y) {
        const t = y;
        y = x % y;
        x = t;
    }
    return x || 1;
};

// Helper: Find closest recognizable common aspect ratio
const findRecognizableRatio = (width: number, height: number): { ratio: string; name: string } => {
    if (width <= 0 || height <= 0) return { ratio: "1:1", name: "Square" };
    const decimal = width / height;

    const commonRatios: { val: number; str: string; name: string }[] = [
        { val: 1.0, str: "1:1", name: "Square (Instagram Post)" },
        { val: 1.25, str: "5:4", name: "Early Monitors & Photography" },
        { val: 1.333333, str: "4:3", name: "Standard Television / iPad" },
        { val: 1.5, str: "3:2", name: "35mm Photography / Classic Film" },
        { val: 1.6, str: "16:10", name: "Widescreen PC / MacBook" },
        { val: 1.618, str: "1.618:1", name: "Golden Ratio (Φ)" },
        { val: 1.777777, str: "16:9", name: "Modern HDTV / 4K / Streaming" },
        { val: 1.90476, str: "1.91:1", name: "OpenGraph / Social Card" },
        { val: 2.0, str: "18:9 (2:1)", name: "Univisium Cinema / Modern Mobile" },
        { val: 2.166666, str: "19.5:9", name: "Bezel-less Smartphone (iPhone/Galaxy)" },
        { val: 2.333333, str: "21:9", name: "UltraWide Monitor / CinemaScope" },
        { val: 2.39, str: "2.39:1", name: "Anamorphic Widescreen Cinema" },
        { val: 3.555555, str: "32:9", name: "Super UltraWide Monitor" },
        { val: 0.8, str: "4:5", name: "Vertical Portrait (Instagram)" },
        { val: 0.5625, str: "9:16", name: "Vertical Video (TikTok / Reels / Shorts)" }
    ];

    let closest = commonRatios[0];
    let minDiff = Math.abs(decimal - commonRatios[0].val);

    for (const r of commonRatios) {
        const diff = Math.abs(decimal - r.val);
        if (diff < minDiff) {
            minDiff = diff;
            closest = r;
        }
    }

    if (minDiff < 0.025) {
        return { ratio: closest.str, name: closest.name };
    }

    const gcd = calculateGCD(width, height);
    const reducedW = width / gcd;
    const reducedH = height / gcd;

    if (reducedW > 50 || reducedH > 50) {
        return { ratio: `${decimal.toFixed(2)}:1`, name: "Custom Ratio" };
    }

    return { ratio: `${reducedW}:${reducedH}`, name: "Custom Reduced Ratio" };
};

export default function ScreenResolutionCalculator() {
    // Mode Selection: "resolution" (calculate aspect ratio & specs) vs "dimension-converter" (target new dimension) vs "ppi" (calculate density)
    const [activeEngine, setActiveEngine] = useState<"resolution" | "resizer" | "ppi">("resolution");

    // Primary Dimension State
    const [width, setWidth] = useState<number>(1920);
    const [height, setHeight] = useState<number>(1080);

    // Resizer / Scaler Tool State
    const [targetAspectW, setTargetAspectW] = useState<number>(16);
    const [targetAspectH, setTargetAspectH] = useState<number>(9);
    const [resizeLock, setResizeLock] = useState<"width" | "height">("width");
    const [scaledWidth, setScaledWidth] = useState<number>(1920);
    const [scaledHeight, setScaledHeight] = useState<number>(1080);

    // Physical PPI / DPI Calculation State
    const [diagonalInches, setDiagonalInches] = useState<number>(27);
    const [viewingDistanceInches, setViewingDistanceInches] = useState<number>(24);

    // UI Copy state
    const [copied, setCopied] = useState<boolean>(false);
    const [codeTab, setCodeTab] = useState<"css" | "tailwind" | "json">("css");

    // Sanitize Number Inputs
    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (v: number) => void
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const parsed = parseFloat(cleaned);
        setter(isNaN(parsed) ? 0 : parsed);
    };

    // Calculate Aspect Ratio and Metrics
    const metrics = useMemo(() => {
        const safeW = Math.max(1, width || 1);
        const safeH = Math.max(1, height || 1);
        const totalPixels = safeW * safeH;
        const megaPixels = (totalPixels / 1000000).toFixed(2);
        const decimalAspect = (safeW / safeH).toFixed(4);

        const gcd = calculateGCD(safeW, safeH);
        const reducedW = safeW / gcd;
        const reducedH = safeH / gcd;
        const exactRatio = `${reducedW}:${reducedH}`;

        const recognizable = findRecognizableRatio(safeW, safeH);

        // Aspect percentage for CSS padding-top hack
        const paddingBottomPercentage = ((safeH / safeW) * 100).toFixed(4);

        return {
            totalPixels: totalPixels.toLocaleString(),
            megaPixels,
            decimalAspect,
            exactRatio,
            commonRatio: recognizable.ratio,
            commonRatioName: recognizable.name,
            paddingBottomPercentage,
            isWidescreen: safeW > safeH,
            isPortrait: safeH > safeW,
            isSquare: safeW === safeH
        };
    }, [width, height]);

    // PPI / DPI Calculations
    const ppiMetrics = useMemo(() => {
        const safeW = Math.max(1, width || 1);
        const safeH = Math.max(1, height || 1);
        const safeDiag = Math.max(0.1, diagonalInches || 0.1);

        const diagonalPixels = Math.sqrt(safeW * safeW + safeH * safeH);
        const ppi = Math.round(diagonalPixels / safeDiag);
        const dotPitchMm = (25.4 / ppi).toFixed(4);

        // Visual Acuity Distance (Retina threshold: 20/20 vision resolves ~1 arcminute)
        // D_retina = 3438 / PPI (inches)
        const retinaDistanceInches = Math.round(3438 / Math.max(1, ppi));
        const retinaDistanceCm = Math.round(retinaDistanceInches * 2.54);

        // Physical screen dimensions in inches & cm
        const angle = Math.atan(safeH / safeW);
        const physWidthInches = (safeDiag * Math.cos(angle)).toFixed(1);
        const physHeightInches = (safeDiag * Math.sin(angle)).toFixed(1);
        const physWidthCm = (parseFloat(physWidthInches) * 2.54).toFixed(1);
        const physHeightCm = (parseFloat(physHeightInches) * 2.54).toFixed(1);

        return {
            ppi,
            dotPitchMm,
            diagonalPixels: Math.round(diagonalPixels).toLocaleString(),
            retinaDistanceInches,
            retinaDistanceCm,
            physWidthInches,
            physHeightInches,
            physWidthCm,
            physHeightCm
        };
    }, [width, height, diagonalInches]);

    // Recalculate Scaler Dimensions dynamically
    const handleResizeChange = (val: number, type: "w" | "h") => {
        const safeAspectW = Math.max(1, targetAspectW || 1);
        const safeAspectH = Math.max(1, targetAspectH || 1);

        if (type === "w") {
            setScaledWidth(val);
            setScaledHeight(Math.round((val * safeAspectH) / safeAspectW));
        } else {
            setScaledHeight(val);
            setScaledWidth(Math.round((val * safeAspectW) / safeAspectH));
        }
    };

    // Keep resizer in sync when custom target aspect changes
    useEffect(() => {
        const safeAspectW = Math.max(1, targetAspectW || 1);
        const safeAspectH = Math.max(1, targetAspectH || 1);
        if (resizeLock === "width") {
            setScaledHeight(Math.round((scaledWidth * safeAspectH) / safeAspectW));
        } else {
            setScaledWidth(Math.round((scaledHeight * safeAspectW) / safeAspectH));
        }
    }, [targetAspectW, targetAspectH]);

    // Preset Selection Handler
    const applyPreset = (preset: StandardPreset) => {
        setWidth(preset.width);
        setHeight(preset.height);
        const gcd = calculateGCD(preset.width, preset.height);
        setTargetAspectW(preset.width / gcd);
        setTargetAspectH(preset.height / gcd);
        setScaledWidth(preset.width);
        setScaledHeight(preset.height);
    };

    // Swap Orientation
    const swapOrientation = () => {
        const prevW = width;
        setWidth(height);
        setHeight(prevW);
    };

    // Generated Code Output
    const generatedSnippets = useMemo(() => {
        const cssAspect = `/* Modern CSS Aspect Ratio */
.responsive-media-container {
  width: 100%;
  max-width: ${width}px;
  aspect-ratio: ${metrics.exactRatio.replace(":", " / ")};
  object-fit: cover;
}

/* Legacy Aspect Ratio Padding-Top Fallback Hack */
.aspect-ratio-fallback {
  position: relative;
  width: 100%;
  padding-bottom: ${metrics.paddingBottomPercentage}%;
  height: 0;
  overflow: hidden;
}

.aspect-ratio-fallback > iframe,
.aspect-ratio-fallback > video,
.aspect-ratio-fallback > img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}`;

        const tailwind = `<!-- Modern Tailwind CSS v3 / v4 Aspect Ratio -->
<div class="w-full max-w-[${width}px] aspect-[${metrics.exactRatio.replace(":", "/")}] overflow-hidden rounded-xl shadow-lg">
  <img src="/media-asset.jpg" alt="Optimized Visual" class="w-full h-full object-cover" />
</div>

<!-- Legacy Tailwind Padding-Bottom Box -->
<div class="relative w-full pb-[${metrics.paddingBottomPercentage}%] h-0 overflow-hidden">
  <iframe src="https://www.youtube.com/embed/demo" class="absolute inset-0 w-full h-full border-0" allowfullscreen></iframe>
</div>`;

        const jsonExport = JSON.stringify(
            {
                resolution: {
                    width: width,
                    height: height,
                    totalPixels: width * height,
                    megapixels: parseFloat(metrics.megaPixels),
                    orientation: metrics.isWidescreen ? "landscape" : metrics.isPortrait ? "portrait" : "square"
                },
                aspectRatio: {
                    common: metrics.commonRatio,
                    exact: metrics.exactRatio,
                    decimal: parseFloat(metrics.decimalAspect),
                    cssAspectRatio: metrics.exactRatio.replace(":", " / "),
                    paddingTopPercent: `${metrics.paddingBottomPercentage}%`
                },
                ppiSpecs: {
                    diagonalInches: diagonalInches,
                    pixelsPerInch: ppiMetrics.ppi,
                    dotPitchMm: parseFloat(ppiMetrics.dotPitchMm),
                    retinaDistanceInches: ppiMetrics.retinaDistanceInches,
                    retinaDistanceCm: ppiMetrics.retinaDistanceCm
                }
            },
            null,
            2
        );

        return { cssAspect, tailwind, jsonExport };
    }, [width, height, metrics, diagonalInches, ppiMetrics]);

    const handleCopyCode = () => {
        const text =
            codeTab === "css"
                ? generatedSnippets.cssAspect
                : codeTab === "tailwind"
                    ? generatedSnippets.tailwind
                    : generatedSnippets.jsonExport;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Screen Resolution & Aspect Ratio Calculator",
        "url": "https://twistertools.com/tools/developer-tools/screen-resolution-calculator",
        "description": "Calculate screen resolutions, aspect ratios, responsive scaling dimensions, display PPI density, dot pitch, and Retina viewing distances with instant CSS and Tailwind exports.",
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
                "name": "What is the difference between aspect ratio and screen resolution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Screen resolution defines the exact count of horizontal and vertical pixels (such as 1920x1080 or 3840x2160). Aspect ratio describes the proportional relationship between the width and height (such as 16:9 or 21:9) reduced to its lowest common denominator using Euclidean Greatest Common Divisor (GCD) math."
                }
            },
            {
                "@type": "Question",
                "name": "How do you calculate Pixels Per Inch (PPI) and Retina distance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "PPI is calculated using the Pythagorean theorem: calculate the diagonal pixel count (sqrt(width^2 + height^2)) and divide it by the physical diagonal screen size in inches. The Apple Retina distance threshold is computed as 3438 / PPI in inches, representing the viewing distance at which standard 20/20 human vision cannot discern individual pixels."
                }
            },
            {
                "@type": "Question",
                "name": "How does the modern CSS aspect-ratio property compare to the padding-top trick?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The modern CSS aspect-ratio property (e.g., aspect-ratio: 16 / 9) allows any HTML element or responsive image to reserve proportional space natively during page layout, preventing Cumulative Layout Shift (CLS). The legacy padding-bottom trick uses a percentage based on (height / width * 100) inside an element with position: relative and height: 0."
                }
            },
            {
                "@type": "Question",
                "name": "What are the most popular aspect ratios used in modern media and gaming?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "16:9 is the universal standard for HDTV, YouTube, and PC gaming. 21:9 and 32:9 are UltraWide and Super UltraWide gaming and cinematic formats. 9:16 is the standard for mobile vertical video (TikTok, Instagram Reels, YouTube Shorts), while 4:3 is standard for classic TV and Apple iPads."
                }
            },
            {
                "@type": "Question",
                "name": "How does aspect ratio scaling prevent video and image distortion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Proportional scaling maintains the exact fraction (Width / Height = constant). When resizing video containers or graphic assets, multiplying the new width by the original aspect fraction guarantees that elements never suffer from horizontal stretching, squishing, or letterboxing."
                }
            }
        ]
    };

    return (
        <div className="w-full space-y-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace: Input Controls & Presets */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Screen Parameters & Presets
                            </h2>
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Real-Time Engine
                            </span>
                        </div>

                        {/* Engine Mode Switcher */}
                        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 mb-5">
                            <button
                                type="button"
                                onClick={() => setActiveEngine("resolution")}
                                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeEngine === "resolution"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <Maximize className="w-3.5 h-3.5" />
                                Dimensions
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveEngine("resizer")}
                                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeEngine === "resizer"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <Scale className="w-3.5 h-3.5" />
                                Proportional Scaler
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveEngine("ppi")}
                                className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${activeEngine === "ppi"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    }`}
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                PPI & Density
                            </button>
                        </div>

                        {/* Pixel Dimension Inputs */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Width (Pixels)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="32000"
                                            value={width}
                                            onChange={(e) => handleNumberChange(e, setWidth)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                            px
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Height (Pixels)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="32000"
                                            value={height}
                                            onChange={(e) => handleNumberChange(e, setHeight)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                            px
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons for quick resolution toggles */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={swapOrientation}
                                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    Swap Landscape / Portrait
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWidth(1920);
                                        setHeight(1080);
                                    }}
                                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                                    title="Reset to 1080p"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Mode Specific Configuration Sections */}
                        {activeEngine === "resizer" && (
                            <div className="mt-5 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                        <Scale className="w-4 h-4 text-indigo-600" />
                                        Target Scaler Calculator
                                    </span>
                                    <span className="text-[11px] font-semibold text-indigo-700">
                                        Locked: {targetAspectW}:{targetAspectH}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Ratio Numerator (W)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={targetAspectW}
                                            onChange={(e) => handleNumberChange(e, setTargetAspectW)}
                                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Ratio Denominator (H)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={targetAspectH}
                                            onChange={(e) => handleNumberChange(e, setTargetAspectH)}
                                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Scaled Width
                                        </label>
                                        <input
                                            type="number"
                                            value={scaledWidth}
                                            onChange={(e) => handleResizeChange(Number(e.target.value) || 0, "w")}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Scaled Height (Auto)
                                        </label>
                                        <input
                                            type="number"
                                            value={scaledHeight}
                                            onChange={(e) => handleResizeChange(Number(e.target.value) || 0, "h")}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeEngine === "ppi" && (
                            <div className="mt-5 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-4">
                                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                    <Monitor className="w-4 h-4 text-indigo-600" />
                                    Physical Screen Specs
                                </span>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Diagonal Size (Inches)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="1"
                                            max="120"
                                            value={diagonalInches}
                                            onChange={(e) => handleNumberChange(e, setDiagonalInches)}
                                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                                            Viewing Distance (Inches)
                                        </label>
                                        <input
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="200"
                                            value={viewingDistanceInches}
                                            onChange={(e) => handleNumberChange(e, setViewingDistanceInches)}
                                            className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold text-slate-900"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-white rounded-lg border border-indigo-100 flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-700">Calculated Pixel Density:</span>
                                    <span className="font-mono font-bold text-indigo-600 text-sm">
                                        {ppiMetrics.ppi} PPI ({ppiMetrics.dotPitchMm} mm pitch)
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Industry Standard Presets Grid */}
                        <div className="mt-5 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Industry Standard Presets
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                                {RESOLUTION_PRESETS.map((p, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => applyPreset(p)}
                                        className={`p-2 rounded-lg text-left transition border cursor-pointer ${width === p.width && height === p.height
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        <div className="font-bold text-[11px] truncate">{p.name}</div>
                                        <div
                                            className={`text-[10px] font-mono ${width === p.width && height === p.height ? "text-indigo-100" : "text-slate-500"
                                                }`}
                                        >
                                            {p.width} × {p.height} ({p.standardRatio})
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-700">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            Euclidean GCD Precision
                        </span>
                        <span>Zero External API Calls</span>
                    </div>
                </div>

                {/* Right Workspace: Visual Stage & Computed Technical Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Proportional Visual Preview Stage
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                                    {metrics.commonRatio}
                                </span>
                            </div>
                        </div>

                        {/* Interactive Dynamic Proportional Viewport Stage */}
                        <div className="w-full h-72 rounded-2xl border border-slate-200/80 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
                            {/* Visual Scaled Frame */}
                            <div
                                className="relative bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-xl shadow-xl flex flex-col items-center justify-center text-white border-2 border-indigo-400/40 transition-all duration-300 max-w-full max-h-full"
                                style={{
                                    aspectRatio: `${Math.max(1, width)} / ${Math.max(1, height)}`,
                                    width: width >= height ? "100%" : "auto",
                                    height: height > width ? "100%" : "auto",
                                    maxWidth: "100%",
                                    maxHeight: "100%"
                                }}
                            >
                                {/* Orientation Watermark Icon */}
                                <div className="opacity-15 absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {metrics.isWidescreen ? (
                                        <Monitor className="w-24 h-24" />
                                    ) : metrics.isPortrait ? (
                                        <Smartphone className="w-24 h-24" />
                                    ) : (
                                        <Square className="w-24 h-24" />
                                    )}
                                </div>

                                <div className="relative z-10 text-center px-3 py-2 space-y-1">
                                    <div className="text-sm sm:text-base font-extrabold tracking-tight">
                                        {metrics.commonRatio}
                                    </div>
                                    <div className="text-[11px] sm:text-xs font-mono opacity-90">
                                        {width} × {height} px
                                    </div>
                                    <div className="text-[10px] font-medium bg-indigo-500/40 px-2 py-0.5 rounded-full inline-block">
                                        {metrics.commonRatioName}
                                    </div>
                                </div>

                                {/* Dimension Edge Badges */}
                                <div className="absolute top-2 left-2 text-[10px] font-mono bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">
                                    {metrics.decimalAspect}:1
                                </div>
                                <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">
                                    {metrics.megaPixels} MP
                                </div>
                            </div>
                        </div>

                        {/* Calculated Metrics Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Exact Aspect
                                </span>
                                <div className="text-sm font-mono font-bold text-indigo-600 truncate">
                                    {metrics.exactRatio}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Decimal Ratio
                                </span>
                                <div className="text-sm font-mono font-bold text-slate-800">
                                    {metrics.decimalAspect}
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Total Megapixels
                                </span>
                                <div className="text-sm font-mono font-bold text-slate-800">
                                    {metrics.megaPixels} MP
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                    CSS Padding-Top
                                </span>
                                <div className="text-sm font-mono font-bold text-indigo-600">
                                    {metrics.paddingBottomPercentage}%
                                </div>
                            </div>
                        </div>

                        {/* Code Generation Tabs */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    {(["css", "tailwind", "json"] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setCodeTab(tab)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${codeTab === tab
                                                    ? "bg-white text-indigo-600 shadow-xs"
                                                    : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <span className="text-xs font-semibold text-slate-500 font-mono">
                                    W3C CSS Box Sizing Spec
                                </span>
                            </div>

                            <pre className="bg-slate-900 text-indigo-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-40">
                                <code>
                                    {codeTab === "css"
                                        ? generatedSnippets.cssAspect
                                        : codeTab === "tailwind"
                                            ? generatedSnippets.tailwind
                                            : generatedSnippets.jsonExport}
                                </code>
                            </pre>
                        </div>
                    </div>

                    {/* Copy Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : "Copy Implementation Snippet"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Deep Dive */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Screen Resolution, Aspect Ratio, and Display Geometry
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital display engineering and web performance architecture, <strong>screen resolution</strong> and <strong>aspect ratio</strong> form the fundamental coordinate blueprint for responsive layout rendering. While resolution specifies the raw matrix of horizontal and vertical picture elements (pixels), aspect ratio describes the mathematical ratio between width and height, simplified using the Euclidean <strong>Greatest Common Divisor (GCD)</strong>.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Maximize className="w-4 h-4 text-indigo-600" /> Pixel Matrix (W &times; H)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The total pixel budget determines visual fidelity and graphics buffer demands. Multiplying 3840 &times; 2160 yields 8,294,400 pixels (8.29 MP), requiring four times the rendering throughput of standard 1080p.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-indigo-600" /> Euclidean Proportions
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Aspect ratios are normalized by dividing width and height by their GCD: GCD(1920, 1080) = 120, resulting in the standard 16:9 fraction (1920/120 : 1080/120).
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-indigo-600" /> Pixel Density (PPI)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Pixels Per Inch defines physical sharpness by mapping the Pythagorean hypotenuse diagonal against physical screen inches: PPI = &radic;(W&sup2; + H&sup2;) / Diagonal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comprehensive Resolution Standards Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Resolution & Aspect Ratio Standards Reference Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Industry-standard display resolutions categorized by application domain, pixel density class, and optimal viewing contexts:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Standard / Industry Name</th>
                                    <th className="p-3">Dimensions ($W \times H$)</th>
                                    <th className="p-3">Aspect Ratio</th>
                                    <th className="p-3">Total Megapixels</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">8K UHD (4320p)</td>
                                    <td className="p-3 font-mono">7680 × 4320</td>
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3 font-mono">33.18 MP</td>
                                    <td className="p-3">Next-Gen Broadcast & Master Displays</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4K UHD (2160p)</td>
                                    <td className="p-3 font-mono">3840 × 2160</td>
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3 font-mono">8.29 MP</td>
                                    <td className="p-3">4K Television, Gaming & Video Streaming</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">UWQHD UltraWide</td>
                                    <td className="p-3 font-mono">3440 × 1440</td>
                                    <td className="p-3 font-bold text-indigo-600">21:9 (43:18)</td>
                                    <td className="p-3 font-mono">4.95 MP</td>
                                    <td className="p-3">Immersive PC Gaming & Productivity</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">QHD / 2K (1440p)</td>
                                    <td className="p-3 font-mono">2560 × 1440</td>
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3 font-mono">3.69 MP</td>
                                    <td className="p-3">High-Refresh Competitive Esports</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Full HD (1080p)</td>
                                    <td className="p-3 font-mono">1920 × 1080</td>
                                    <td className="p-3 font-bold text-indigo-600">16:9</td>
                                    <td className="p-3 font-mono">2.07 MP</td>
                                    <td className="p-3">Global Web Standard, YouTube & Monitors</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Vertical HD (Reels / Shorts)</td>
                                    <td className="p-3 font-mono">1080 × 1920</td>
                                    <td className="p-3 font-bold text-indigo-600">9:16</td>
                                    <td className="p-3 font-mono">2.07 MP</td>
                                    <td className="p-3">TikTok, Instagram Reels & YouTube Shorts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Social OpenGraph Card</td>
                                    <td className="p-3 font-mono">1200 × 630</td>
                                    <td className="p-3 font-bold text-indigo-600">1.91:1 (40:21)</td>
                                    <td className="p-3 font-mono">0.76 MP</td>
                                    <td className="p-3">SEO Rich Snippets & Social Sharing</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Modern CSS Layout Prevention of CLS */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Modern CSS aspect-ratio vs. Legacy Padding-Bottom Hack
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain responsive video embeds and prevent jarring <strong>Cumulative Layout Shift (CLS)</strong> during image loading, web engineers historically relied on the container padding-bottom trick. Modern browsers now natively support the W3C <code>aspect-ratio</code> CSS property:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Modern CSS (W3C Spec)</span>
                                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Recommended</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`/* Reserves box geometry prior to asset download */
.video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}`}
                            </pre>
                            <p className="text-xs text-slate-600">
                                Eliminates placeholder wrappers. Browsers immediately calculate the height during initial layout reflow.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3 min-w-0">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Legacy Padding-Bottom Hack</span>
                                <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Fallback</span>
                            </div>
                            <pre className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`/* Height calculated as (9 / 16) * 100 = 56.25% */
.iframe-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
}`}
                            </pre>
                            <p className="text-xs text-slate-600">
                                Required for legacy web browsers that do not support native CSS box aspect ratios.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is the difference between aspect ratio and screen resolution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Screen resolution defines the exact count of horizontal and vertical pixels (such as 1920x1080 or 3840x2160). Aspect ratio describes the proportional relationship between the width and height (such as 16:9 or 21:9) reduced to its lowest common denominator using Euclidean Greatest Common Divisor (GCD) math.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you calculate Pixels Per Inch (PPI) and Retina distance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                PPI is calculated using the Pythagorean theorem: calculate the diagonal pixel count (sqrt(width^2 + height^2)) and divide it by the physical diagonal screen size in inches. The Apple Retina distance threshold is computed as 3438 / PPI in inches, representing the viewing distance at which standard 20/20 human vision cannot discern individual pixels.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the modern CSS aspect-ratio property compare to the padding-top trick?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The modern CSS aspect-ratio property (e.g., aspect-ratio: 16 / 9) allows any HTML element or responsive image to reserve proportional space natively during page layout, preventing Cumulative Layout Shift (CLS). The legacy padding-bottom trick uses a percentage based on (height / width * 100) inside an element with position: relative and height: 0.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the most popular aspect ratios used in modern media and gaming?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                16:9 is the universal standard for HDTV, YouTube, and PC gaming. 21:9 and 32:9 are UltraWide and Super UltraWide gaming and cinematic formats. 9:16 is the standard for mobile vertical video (TikTok, Instagram Reels, YouTube Shorts), while 4:3 is standard for classic TV and Apple iPads.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does aspect ratio scaling prevent video and image distortion?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Proportional scaling maintains the exact fraction (Width / Height = constant). When resizing video containers or graphic assets, multiplying the new width by the original aspect fraction guarantees that elements never suffer from horizontal stretching, squishing, or letterboxing.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}