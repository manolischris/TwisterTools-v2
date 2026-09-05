"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Layers,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Code,
    Palette,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Monitor,
    Terminal,
    Cpu
} from "lucide-react";

type BackgroundPreset = "vibrant" | "sunset" | "mesh" | "dark" | "geometric";
type OutputFormat = "css" | "tailwind";

interface GlassConfig {
    blur: number; // 0 - 40 px
    opacity: number; // 0 - 100 %
    saturation: number; // 50 - 250 %
    borderWidth: number; // 0 - 8 px
    borderOpacity: number; // 0 - 100 %
    borderRadius: number; // 0 - 48 px
    shadowElevation: number; // 0 - 50 px
    shadowOpacity: number; // 0 - 100 %
    tintColor: string; // Hex color string
    borderColor: string; // Hex color string
}

const DEFAULT_CONFIG: GlassConfig = {
    blur: 16,
    opacity: 25,
    saturation: 180,
    borderWidth: 1,
    borderOpacity: 30,
    borderRadius: 20,
    shadowElevation: 12,
    shadowOpacity: 20,
    tintColor: "#ffffff",
    borderColor: "#ffffff",
};

const PRESET_TEMPLATES: Record<string, Partial<GlassConfig>> = {
    "Subtle Frost": {
        blur: 12,
        opacity: 15,
        saturation: 140,
        borderWidth: 1,
        borderOpacity: 25,
        borderRadius: 20,
        shadowElevation: 8,
        shadowOpacity: 15,
        tintColor: "#ffffff",
        borderColor: "#ffffff",
    },
    "Deep Translucent": {
        blur: 24,
        opacity: 35,
        saturation: 200,
        borderWidth: 1,
        borderOpacity: 45,
        borderRadius: 24,
        shadowElevation: 20,
        shadowOpacity: 25,
        tintColor: "#ffffff",
        borderColor: "#ffffff",
    },
    "Dark Obsidian": {
        blur: 20,
        opacity: 45,
        saturation: 160,
        borderWidth: 1,
        borderOpacity: 20,
        borderRadius: 20,
        shadowElevation: 16,
        shadowOpacity: 40,
        tintColor: "#0f172a",
        borderColor: "#334155",
    },
    "Neon Crystal": {
        blur: 18,
        opacity: 20,
        saturation: 220,
        borderWidth: 2,
        borderOpacity: 60,
        borderRadius: 22,
        shadowElevation: 24,
        shadowOpacity: 30,
        tintColor: "#6366f1",
        borderColor: "#818cf8",
    },
};

const hexToRgba = (hex: string, alphaPercent: number): string => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 255;
    const alpha = (alphaPercent / 100).toFixed(2);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number,
    max: number
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed)) {
        setter(min);
        return;
    }
    setter(Math.max(min, Math.min(max, parsed)));
};

export default function GlassmorphismGenerator() {
    const [config, setConfig] = useState<GlassConfig>(DEFAULT_CONFIG);
    const [bgPreset, setBgPreset] = useState<BackgroundPreset>("vibrant");
    const [activeFormat, setActiveFormat] = useState<OutputFormat>("css");
    const [copied, setCopied] = useState<boolean>(false);

    const blurInputId = useId();
    const opacityInputId = useId();
    const saturationInputId = useId();
    const borderWidthInputId = useId();
    const borderOpacityInputId = useId();
    const radiusInputId = useId();
    const shadowElevationInputId = useId();
    const shadowOpacityInputId = useId();

    const rgbaBackground = useMemo(
        () => hexToRgba(config.tintColor, config.opacity),
        [config.tintColor, config.opacity]
    );

    const rgbaBorder = useMemo(
        () => hexToRgba(config.borderColor, config.borderOpacity),
        [config.borderColor, config.borderOpacity]
    );

    const boxShadowValue = useMemo(() => {
        if (config.shadowElevation === 0) return "none";
        const spread = Math.round(config.shadowElevation / 3);
        const blur = config.shadowElevation * 2;
        const alpha = (config.shadowOpacity / 100).toFixed(2);
        return `0 ${config.shadowElevation}px ${blur}px ${spread}px rgba(0, 0, 0, ${alpha})`;
    }, [config.shadowElevation, config.shadowOpacity]);

    const cssStyleObject: React.CSSProperties = useMemo(() => {
        return {
            background: rgbaBackground,
            backdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%)`,
            WebkitBackdropFilter: `blur(${config.blur}px) saturate(${config.saturation}%)`,
            borderRadius: `${config.borderRadius}px`,
            border: `${config.borderWidth}px solid ${rgbaBorder}`,
            boxShadow: boxShadowValue,
        };
    }, [rgbaBackground, config.blur, config.saturation, config.borderRadius, config.borderWidth, rgbaBorder, boxShadowValue]);

    const generatedCss = useMemo(() => {
        return `/* TwisterTools CSS Glassmorphism */
background: ${rgbaBackground};
backdrop-filter: blur(${config.blur}px) saturate(${config.saturation}%);
-webkit-backdrop-filter: blur(${config.blur}px) saturate(${config.saturation}%);
border-radius: ${config.borderRadius}px;
border: ${config.borderWidth}px solid ${rgbaBorder};
box-shadow: ${boxShadowValue};`;
    }, [rgbaBackground, config.blur, config.saturation, config.borderRadius, config.borderWidth, rgbaBorder, boxShadowValue]);

    const generatedTailwind = useMemo(() => {
        return `bg-[${rgbaBackground}] backdrop-blur-[${config.blur}px] backdrop-saturate-[${config.saturation}%] rounded-[${config.borderRadius}px] border-[${config.borderWidth}px] border-[${rgbaBorder}] shadow-[${boxShadowValue.replace(/\s+/g, "_")}]`;
    }, [rgbaBackground, config.blur, config.saturation, config.borderRadius, config.borderWidth, rgbaBorder, boxShadowValue]);

    const handleCopy = () => {
        const code = activeFormat === "css" ? generatedCss : generatedTailwind;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setBgPreset("vibrant");
    };

    const loadPreset = (name: string) => {
        const preset = PRESET_TEMPLATES[name];
        if (preset) {
            setConfig((prev) => ({ ...prev, ...preset }));
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Glassmorphism & Backdrop Blur Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-glassmorphism-generator",
        "description": "Interactive browser-native CSS Glassmorphism and Backdrop Blur Generator. Create ultra-modern frosted glass UI elements with pure CSS and Tailwind utility outputs.",
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
                "name": "How does CSS backdrop-filter achieve the glassmorphism effect?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The CSS backdrop-filter property applies graphical effects like blurring and color saturation to whatever content lies directly behind the element's background canvas. By combining backdrop-filter: blur() with a translucent RGBA or HSLA background layer and a delicate border highlight, developers can mimic physical optical refraction and light transmission."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the -webkit-backdrop-filter prefix necessary in production CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While modern Chromium and Firefox releases support the standard backdrop-filter property natively, Apple Safari (both macOS Desktop and iOS Mobile WebKit) continues to require the vendor prefix -webkit-backdrop-filter for hardware-accelerated surface rendering. Omitting it leaves Apple devices displaying flat, non-blurred translucent slabs."
                }
            },
            {
                "@type": "Question",
                "name": "What causes performance lag with heavy backdrop-filter blur on mobile devices?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Every pixel subjected to backdrop-filter requires a multi-pass 2D Gaussian blur calculation on the GPU during compositing. When large frosted surfaces overlap scrolling DOM nodes or high-frequency animations, rasterization overhead escalates rapidly. Keep blur radii under 25px on mobile viewports and apply translateZ(0) to promote elements to dedicated GPU layers."
                }
            },
            {
                "@type": "Question",
                "name": "How do you ensure accessibility and WCAG contrast compliance on glass surfaces?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Backdrop surfaces naturally inherit luminosity from fluctuating underlying DOM elements. To ensure compliance with WCAG 2.1 AA criteria (minimum 4.5:1 text contrast), evaluate text luminance against the darkest and lightest backdrop states. Increase tinted background opacity to at least 25-40% or supply a subtle dark inner gradient beneath foreground typography."
                }
            },
            {
                "@type": "Question",
                "name": "Can you animate CSS backdrop-filter smoothly without frame drops?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Animating blur values directly from 0px to 20px triggers continuous composite invalidations and can easily drop framerates below 60fps. The most performant pattern is to keep backdrop-filter constant and animate standard transform, opacity, or background-color values instead."
                }
            },
            {
                "@type": "Question",
                "name": "What is the recommended fallback for older browsers lacking backdrop-filter support?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use CSS Feature Queries (@supports). Provide a fallback with higher opacity (such as background: rgba(255, 255, 255, 0.9)) for unsupported environments, and nest the backdrop-filter rules inside @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Optical Parameters
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    Reset Defaults
                                </button>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium">Presets:</span>
                                {Object.keys(PRESET_TEMPLATES).map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => loadPreset(name)}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                                    >
                                        {name.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Backdrop Blur Radius */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={blurInputId} className="flex items-center gap-1">
                                    Backdrop Blur Radius:
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={blurInputId}
                                        type="number"
                                        min="0"
                                        max="40"
                                        value={config.blur}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setConfig((p) => ({ ...p, blur: val })), 0, 40)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">px</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                step="1"
                                value={config.blur}
                                onChange={(e) => setConfig((p) => ({ ...p, blur: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Background Transparency */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={opacityInputId} className="flex items-center gap-1">
                                    Surface Tint Opacity:
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={opacityInputId}
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={config.opacity}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setConfig((p) => ({ ...p, opacity: val })), 0, 100)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">%</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={config.opacity}
                                onChange={(e) => setConfig((p) => ({ ...p, opacity: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Backdrop Saturation */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={saturationInputId} className="flex items-center gap-1">
                                    Backdrop Color Saturation:
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={saturationInputId}
                                        type="number"
                                        min="50"
                                        max="250"
                                        value={config.saturation}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setConfig((p) => ({ ...p, saturation: val })), 50, 250)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">%</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="50"
                                max="250"
                                step="5"
                                value={config.saturation}
                                onChange={(e) => setConfig((p) => ({ ...p, saturation: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Colors Grid: Tint & Border */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 block">Tint Base Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={config.tintColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, tintColor: e.target.value }))}
                                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={config.tintColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, tintColor: e.target.value }))}
                                        className="flex-1 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 block">Border Base Color</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={config.borderColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, borderColor: e.target.value }))}
                                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                    />
                                    <input
                                        type="text"
                                        value={config.borderColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, borderColor: e.target.value }))}
                                        className="flex-1 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Border Width & Border Opacity */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={borderWidthInputId}>Border Width:</label>
                                    <span className="font-mono text-slate-600">{config.borderWidth}px</span>
                                </div>
                                <input
                                    id={borderWidthInputId}
                                    type="range"
                                    min="0"
                                    max="8"
                                    step="1"
                                    value={config.borderWidth}
                                    onChange={(e) => setConfig((p) => ({ ...p, borderWidth: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={borderOpacityInputId}>Border Opacity:</label>
                                    <span className="font-mono text-slate-600">{config.borderOpacity}%</span>
                                </div>
                                <input
                                    id={borderOpacityInputId}
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={config.borderOpacity}
                                    onChange={(e) => setConfig((p) => ({ ...p, borderOpacity: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Border Radius & Elevation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={radiusInputId}>Corner Radius:</label>
                                    <span className="font-mono text-slate-600">{config.borderRadius}px</span>
                                </div>
                                <input
                                    id={radiusInputId}
                                    type="range"
                                    min="0"
                                    max="48"
                                    step="1"
                                    value={config.borderRadius}
                                    onChange={(e) => setConfig((p) => ({ ...p, borderRadius: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={shadowElevationInputId}>Shadow Elevation:</label>
                                    <span className="font-mono text-slate-600">{config.shadowElevation}px</span>
                                </div>
                                <input
                                    id={shadowElevationInputId}
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="1"
                                    value={config.shadowElevation}
                                    onChange={(e) => setConfig((p) => ({ ...p, shadowElevation: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Shadow Opacity */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={shadowOpacityInputId}>Shadow Darkness (Opacity):</label>
                                <span className="font-mono text-slate-600">{config.shadowOpacity}%</span>
                            </div>
                            <input
                                id={shadowOpacityInputId}
                                type="range"
                                min="0"
                                max="100"
                                step="2"
                                value={config.shadowOpacity}
                                onChange={(e) => setConfig((p) => ({ ...p, shadowOpacity: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Hardware Compositing Ready
                        </span>
                        <span>Tailwind v3 & v4 Compatible</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Visualizer & Code Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Visualizer Header */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    Real-Time Refraction Stage
                                </h2>
                            </div>
                            {/* Background Preset Switcher */}
                            <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-slate-100 p-1.5 rounded-xl w-full">
                                {(["vibrant", "sunset", "mesh", "dark", "geometric"] as BackgroundPreset[]).map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => setBgPreset(preset)}
                                        className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer text-center ${bgPreset === preset
                                                ? "bg-white text-indigo-600 shadow-xs font-bold"
                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                                            }`}
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Simulated Stage Canvas */}
                        <div
                            className={`relative w-full h-80 rounded-xl overflow-hidden p-6 flex items-center justify-center transition-all duration-300 ${bgPreset === "vibrant"
                                    ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
                                    : bgPreset === "sunset"
                                        ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-700"
                                        : bgPreset === "mesh"
                                            ? "bg-[radial-gradient(at_top_left,#4f46e5,#06b6d4,#10b981,#f59e0b)]"
                                            : bgPreset === "dark"
                                                ? "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
                                                : "bg-slate-900 [background-image:radial-gradient(#6366f1_1.5px,transparent_1.5px)] [background-size:20px_20px]"
                                }`}
                        >
                            {/* Decorative Geometric Objects Beneath Glass to showcase blur */}
                            <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-400 rounded-full blur-xs opacity-80 animate-pulse pointer-events-none" />
                            <div className="absolute -bottom-8 -right-8 w-44 h-44 bg-cyan-400 rounded-full blur-xs opacity-75 pointer-events-none" />
                            <div className="absolute top-1/2 left-8 w-16 h-16 bg-white rounded-lg rotate-12 opacity-60 pointer-events-none" />

                            {/* Glass Element Itself */}
                            <div
                                style={cssStyleObject}
                                className="relative z-10 w-full max-w-sm p-6 text-center select-none transition-[border-radius,box-shadow] duration-150"
                            >
                                <div className="w-10 h-10 mx-auto rounded-xl bg-white/20 border border-white/30 flex items-center justify-center mb-3 shadow-sm">
                                    <Sparkles className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                                <h3 className="text-base font-bold text-white drop-shadow-sm">Glassmorphic Card</h3>
                                <p className="text-xs text-white/80 mt-1 leading-relaxed drop-shadow-xs">
                                    Inspect optical refraction, surface boundary highlights, and backdrop attenuation live.
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide border border-white/30">
                                        blur({config.blur}px)
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold tracking-wide border border-white/30">
                                        {config.opacity}% tint
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Generated Code Output Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Export Syntax</span>
                                </div>
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("css")}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeFormat === "css" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Raw CSS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("tailwind")}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeFormat === "tailwind" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Tailwind CSS
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[140px] max-h-[160px] border border-slate-800">
                                    {activeFormat === "css" ? generatedCss : generatedTailwind}
                                </pre>
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy Code"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            CSS Compositing Level 2 Spec
                        </span>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" /> Quick Copy
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Optical Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Architecture of CSS Glassmorphism: Refraction, Diffusion, and Layering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Glassmorphism is a contemporary UI design paradigm rooted in physical optics, simulating translucent materials such as frosted glass, acrylic, and polycarbonate. Unlike classic skeumorphism or pure flat design, glassmorphism relies on dynamic spatial depth, establishing a clear visual hierarchy while preserving contextual spatial awareness through three foundational pillars:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Multi-Pass Blur
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Applying a mathematical Gaussian blur filter to the backdrop raster layer breaks hard geometric edges, diffusing high-frequency luminance into a smooth gradient of color.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" /> Translucent Tint
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Layering a semi-transparent base color with an alpha channel between 0.15 and 0.40 binds the surface, guaranteeing sufficient contrast for foreground typographic rendering.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Beveled Edge Highlight
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                A delicate 1px semi-transparent border mimics the natural specular reflection and light refraction observed along the physical perimeter of machined glass.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> The Modern Production Glassmorphism Blueprint
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Standard production CSS implementations must strictly include the WebKit vendor prefix alongside standard rules to ensure seamless visual parity across Apple WebKit and Chromium engines:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`.glass-panel {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18);
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: Backdrop Filter vs Alternative Blur Techniques
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Developers often confuse standard CSS <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">filter: blur()</code> with <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">backdrop-filter: blur()</code>. Understanding how each approach behaves in the browser compositing pipeline is crucial for writing efficient, high-performance UI code:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Technique</th>
                                    <th className="p-3">Target Render Target</th>
                                    <th className="p-3">Child Content Blurred?</th>
                                    <th className="p-3">GPU Overhead</th>
                                    <th className="p-3">Best Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">backdrop-filter</td>
                                    <td className="p-3">Underlying canvas pixels only</td>
                                    <td className="p-3 text-emerald-600 font-bold">No (Crisp text)</td>
                                    <td className="p-3 font-mono text-amber-600">Moderate to High</td>
                                    <td className="p-3">Sticky navbars, modals, floating HUDs</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">filter: blur()</td>
                                    <td className="p-3">Entire element & nested DOM tree</td>
                                    <td className="p-3 text-rose-600 font-bold">Yes (All text blurred)</td>
                                    <td className="p-3 font-mono text-slate-600">Low to Moderate</td>
                                    <td className="p-3">Background artistic spheres, shadows</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">SVG feGaussianBlur</td>
                                    <td className="p-3">SVG filter graph pipeline</td>
                                    <td className="p-3 text-amber-600 font-bold">Depends on filter map</td>
                                    <td className="p-3 font-mono text-rose-600">High (CPU bound)</td>
                                    <td className="p-3">Complex vector distortions & liquid glass</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Canvas 2D / WebGL</td>
                                    <td className="p-3">Bitmap framebuffer</td>
                                    <td className="p-3 text-emerald-600 font-bold">No (Manual render)</td>
                                    <td className="p-3 font-mono text-indigo-600">High (Shader shader)</td>
                                    <td className="p-3">Interactive 3D games, real-time lenses</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Performance, Rendering Engines & Mobile Optimization */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Performance Optimization & Mobile GPU Compositing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While glassmorphism delivers an elegant aesthetic, improper utilization can introduce micro-stutters and frame drops, particularly on mobile hardware. Rendering a backdrop blur requires the browser to isolate the background layer, apply a 2-pass convolution kernel, and re-composite the result onto the frame:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for 60 FPS
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Cap Blur Radii:</strong> Maintain blur values between 8px and 20px. Values exceeding 30px exponentially increase GPU shader cycles without perceptible aesthetic gains.
                                </li>
                                <li>
                                    • <strong>Force Hardware Layers:</strong> Use <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">transform: translateZ(0);</code> or <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">will-change: transform;</code> on scrolling cards to keep them on independent compositor layers.
                                </li>
                                <li>
                                    • <strong>Avoid Multi-Layer Stacking:</strong> Never nest multiple glass panels within one another, which triggers nested rasterization loops.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Antipatterns to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Animating Blur Values:</strong> Transitioning <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">backdrop-filter: blur(0px) to blur(20px)</code> during hover states invalidates textures every frame. Animate opacity instead.
                                </li>
                                <li>
                                    • <strong>Full-Screen Blurs on Scroll:</strong> Pinning full-screen glass backdrops over content-heavy feeds will trigger thermal throttling on mobile devices.
                                </li>
                                <li>
                                    • <strong>Omitting Fallback Colors:</strong> Failing to specify a solid or high-opacity background leaves legacy browsers displaying invisible, unreadable content.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: WCAG Accessibility and Cross-Browser Fallbacks */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WCAG Accessibility Compliance & Graceful Degradation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The primary usability hazard of frosted glass is illegibility caused by fluctuating luminance in underlying content. When high-contrast patterns drift behind a translucent container, foreground text can fail WCAG 2.1 minimum contrast ratios (4.5:1 for standard text, 3:1 for large text).
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Bulletproof Progressive Enhancement Pattern</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Utilize CSS Feature Queries to supply an opaque, contrast-safe fallback for older browsers or low-power modes, layering the glass effects only when supported natively by the runtime client:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`/* Base safe fallback for legacy browsers */
.accessible-glass {
  background: rgba(15, 23, 42, 0.95);
  color: #ffffff;
}

/* Progressive enhancement for modern display engines */
@supports (backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px)) {
  .accessible-glass {
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
}`}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
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
                                How does CSS backdrop-filter achieve the glassmorphism effect?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The CSS backdrop-filter property applies graphical effects like blurring and color saturation to whatever content lies directly behind the element&apos;s background canvas. By combining backdrop-filter: blur() with a translucent RGBA or HSLA background layer and a delicate border highlight, developers can mimic physical optical refraction and light transmission.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the -webkit-backdrop-filter prefix necessary in production CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                While modern Chromium and Firefox releases support the standard backdrop-filter property natively, Apple Safari (both macOS Desktop and iOS Mobile WebKit) continues to require the vendor prefix -webkit-backdrop-filter for hardware-accelerated surface rendering. Omitting it leaves Apple devices displaying flat, non-blurred translucent slabs.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What causes performance lag with heavy backdrop-filter blur on mobile devices?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Every pixel subjected to backdrop-filter requires a multi-pass 2D Gaussian blur calculation on the GPU during compositing. When large frosted surfaces overlap scrolling DOM nodes or high-frequency animations, rasterization overhead escalates rapidly. Keep blur radii under 25px on mobile viewports and apply translateZ(0) to promote elements to dedicated GPU layers.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you ensure accessibility and WCAG contrast compliance on glass surfaces?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Backdrop surfaces naturally inherit luminosity from fluctuating underlying DOM elements. To ensure compliance with WCAG 2.1 AA criteria (minimum 4.5:1 text contrast), evaluate text luminance against the darkest and lightest backdrop states. Increase tinted background opacity to at least 25-40% or supply a subtle dark inner gradient beneath foreground typography.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can you animate CSS backdrop-filter smoothly without frame drops?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Animating blur values directly from 0px to 20px triggers continuous composite invalidations and can easily drop framerates below 60fps. The most performant pattern is to keep backdrop-filter constant and animate standard transform, opacity, or background-color values instead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the recommended fallback for older browsers lacking backdrop-filter support?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Use CSS Feature Queries (@supports). Provide a fallback with higher opacity (such as background: rgba(255, 255, 255, 0.9)) for unsupported environments, and nest the backdrop-filter rules inside @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)).
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}