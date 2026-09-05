"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Sliders,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Code,
    Palette,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Monitor,
    Terminal,
    Cpu,
    Sun,
    Layers,
    ArrowUpLeft,
    ArrowUpRight,
    ArrowDownRight,
    ArrowDownLeft
} from "lucide-react";

type SurfaceShape = "flat" | "concave" | "convex" | "pressed";
type LightSourceDirection = "top-left" | "top-right" | "bottom-right" | "bottom-left";
type OutputFormat = "css" | "tailwind";

interface NeumorphismConfig {
    size: number; // 80 - 320 px
    radius: number; // 0 - 160 px
    distance: number; // 1 - 50 px
    blur: number; // 1 - 100 px
    intensity: number; // 5 - 60 % (light/dark shadow contrast)
    surfaceShape: SurfaceShape;
    lightDirection: LightSourceDirection;
    baseColor: string; // Hex color string
}

const DEFAULT_CONFIG: NeumorphismConfig = {
    size: 200,
    radius: 36,
    distance: 12,
    blur: 24,
    intensity: 15,
    surfaceShape: "flat",
    lightDirection: "top-left",
    baseColor: "#e0e5ec",
};

const PRESET_TEMPLATES: Record<string, Partial<NeumorphismConfig>> = {
    "Classic Soft": {
        size: 200,
        radius: 36,
        distance: 12,
        blur: 24,
        intensity: 15,
        surfaceShape: "flat",
        lightDirection: "top-left",
        baseColor: "#e0e5ec",
    },
    "Deep Extrusion": {
        size: 220,
        radius: 42,
        distance: 20,
        blur: 40,
        intensity: 22,
        surfaceShape: "convex",
        lightDirection: "top-left",
        baseColor: "#e2e8f0",
    },
    "Subtle Minimal": {
        size: 190,
        radius: 24,
        distance: 6,
        blur: 14,
        intensity: 10,
        surfaceShape: "flat",
        lightDirection: "top-left",
        baseColor: "#f1f5f9",
    },
    "Sunken Inset": {
        size: 200,
        radius: 32,
        distance: 10,
        blur: 20,
        intensity: 18,
        surfaceShape: "pressed",
        lightDirection: "top-left",
        baseColor: "#e8ecf2",
    },
    "Dark Slate": {
        size: 200,
        radius: 36,
        distance: 14,
        blur: 28,
        intensity: 28,
        surfaceShape: "flat",
        lightDirection: "top-left",
        baseColor: "#1e293b",
    },
};

// Color manipulation math helpers
interface RgbColor {
    r: number;
    g: number;
    b: number;
}

const hexToRgb = (hex: string): RgbColor => {
    const cleanHex = hex.replace("#", "");
    const parsed = parseInt(cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex, 16);
    return {
        r: (parsed >> 16) & 255,
        g: (parsed >> 8) & 255,
        b: parsed & 255,
    };
};

const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const compToHex = (c: number) => clamp(c).toString(16).padStart(2, "0");
    return `#${compToHex(r)}${compToHex(g)}${compToHex(b)}`;
};

const adjustColorLuminance = (rgb: RgbColor, percentFactor: number): string => {
    const factor = percentFactor / 100;
    const r = factor >= 0 ? rgb.r + (255 - rgb.r) * factor : rgb.r * (1 + factor);
    const g = factor >= 0 ? rgb.g + (255 - rgb.g) * factor : rgb.g * (1 + factor);
    const b = factor >= 0 ? rgb.b + (255 - rgb.b) * factor : rgb.b * (1 + factor);
    return rgbToHex(r, g, b);
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

export default function CssNeumorphismGenerator() {
    const [config, setConfig] = useState<NeumorphismConfig>(DEFAULT_CONFIG);
    const [activeFormat, setActiveFormat] = useState<OutputFormat>("css");
    const [copied, setCopied] = useState<boolean>(false);

    const sizeInputId = useId();
    const radiusInputId = useId();
    const distanceInputId = useId();
    const blurInputId = useId();
    const intensityInputId = useId();

    const rgbBase = useMemo(() => hexToRgb(config.baseColor), [config.baseColor]);

    // Computed light and dark shadow colors based on base color & intensity factor
    const lightShadowColor = useMemo(
        () => adjustColorLuminance(rgbBase, config.intensity * 1.3),
        [rgbBase, config.intensity]
    );

    const darkShadowColor = useMemo(
        () => adjustColorLuminance(rgbBase, -config.intensity * 1.1),
        [rgbBase, config.intensity]
    );

    // Gradient highlights for concave and convex physical variations
    const gradientColors = useMemo(() => {
        const topHighlight = adjustColorLuminance(rgbBase, config.intensity * 0.75);
        const bottomShadow = adjustColorLuminance(rgbBase, -config.intensity * 0.75);
        return {
            topHighlight,
            bottomShadow,
        };
    }, [rgbBase, config.intensity]);

    // Directional coordinate offsets
    const offsets = useMemo(() => {
        const d = config.distance;
        switch (config.lightDirection) {
            case "top-left":
                return { lightX: -d, lightY: -d, darkX: d, darkY: d, angle: "145deg" };
            case "top-right":
                return { lightX: d, lightY: -d, darkX: -d, darkY: d, angle: "225deg" };
            case "bottom-right":
                return { lightX: d, lightY: d, darkX: -d, darkY: -d, angle: "315deg" };
            case "bottom-left":
                return { lightX: -d, lightY: d, darkX: d, darkY: -d, angle: "45deg" };
            default:
                return { lightX: -d, lightY: -d, darkX: d, darkY: d, angle: "145deg" };
        }
    }, [config.distance, config.lightDirection]);

    // Box shadow declaration string
    const boxShadowValue = useMemo(() => {
        const b = config.blur;
        const isInset = config.surfaceShape === "pressed";
        const prefix = isInset ? "inset " : "";

        return `${prefix}${offsets.darkX}px ${offsets.darkY}px ${b}px ${darkShadowColor}, ${prefix}${offsets.lightX}px ${offsets.lightY}px ${b}px ${lightShadowColor}`;
    }, [config.surfaceShape, config.blur, offsets, darkShadowColor, lightShadowColor]);

    // Background styling (solid vs linear gradients)
    const backgroundStyle = useMemo(() => {
        if (config.surfaceShape === "concave") {
            return `linear-gradient(${offsets.angle}, ${gradientColors.bottomShadow}, ${gradientColors.topHighlight})`;
        }
        if (config.surfaceShape === "convex") {
            return `linear-gradient(${offsets.angle}, ${gradientColors.topHighlight}, ${gradientColors.bottomShadow})`;
        }
        return config.baseColor;
    }, [config.surfaceShape, config.baseColor, offsets.angle, gradientColors]);

    const cssStyleObject: React.CSSProperties = useMemo(() => {
        return {
            width: `${config.size}px`,
            height: `${config.size}px`,
            borderRadius: `${config.radius}px`,
            background: backgroundStyle,
            boxShadow: boxShadowValue,
        };
    }, [config.size, config.radius, backgroundStyle, boxShadowValue]);

    const generatedCss = useMemo(() => {
        return `/* TwisterTools CSS Neumorphism */
border-radius: ${config.radius}px;
background: ${backgroundStyle};
box-shadow: ${boxShadowValue};`;
    }, [config.radius, backgroundStyle, boxShadowValue]);

    const generatedTailwind = useMemo(() => {
        const bgClass =
            config.surfaceShape === "flat" || config.surfaceShape === "pressed"
                ? `bg-[${config.baseColor}]`
                : `bg-[${backgroundStyle.replace(/\s+/g, "_")}]`;

        return `rounded-[${config.radius}px] ${bgClass} shadow-[${boxShadowValue.replace(/\s+/g, "_")}]`;
    }, [config.radius, config.surfaceShape, config.baseColor, backgroundStyle, boxShadowValue]);

    const handleCopy = () => {
        const code = activeFormat === "css" ? generatedCss : generatedTailwind;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
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
        "name": "CSS Neumorphism & Soft UI Code Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-neumorphism-generator",
        "description": "Enterprise-grade CSS Neumorphism and Soft UI generator. Calculate dual light-and-dark box shadows, shape convexities, and light sources with instant CSS and Tailwind utility outputs.",
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
                "name": "What is Neumorphism (Soft UI) in web and UI design?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Neumorphism—a portmanteau of 'new' and 'skeuomorphism'—is a minimal UI aesthetic that creates the illusion that UI controls are extruded from or debossed into the actual background surface. Instead of hovering above a canvas with floating drop shadows, neumorphic components seamlessly emerge from the surface using matching background colors accompanied by pairing complementary light and dark box-shadow coordinates."
                }
            },
            {
                "@type": "Question",
                "name": "How does the dual box-shadow math work in CSS neumorphism?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Physical neumorphism relies on a single directional virtual light source. A negative offset shadow produces a bright specular highlight tinted lighter than the canvas, while an opposing positive offset shadow produces a soft ambient occlusion shadow tinted darker than the canvas. When both shadows match the background luminosity within an 8-25% intensity range, the illusion of smooth continuous physical material emerges."
                }
            },
            {
                "@type": "Question",
                "name": "What are the primary accessibility (WCAG) challenges with neumorphic design?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Because neumorphism relies on low-contrast shadows and identical element-to-background surface colors, subtle button borders often fail the WCAG 2.1 Non-Text Contrast requirement of 3:1. To maintain strict accessibility compliance, always accompany neumorphic styling with high-contrast foreground icons, discernible inner focus outlines, distinct pressed states, and explicit ARIA roles."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Flat, Concave, Convex, and Pressed (Inset) neumorphism?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Flat surfaces employ a solid background color matching the canvas with outer drop shadows. Convex surfaces use a subtle directional linear gradient traveling from light to dark to simulate an outwardly bulging button. Concave surfaces invert that gradient to mimic an inwardly scooped indentation. Pressed (inset) surfaces swap outer box-shadows for inset box-shadows, creating the tactile impression that a button has been depressed into the substrate."
                }
            },
            {
                "@type": "Question",
                "name": "Can neumorphic box-shadows run on mobile GPUs without performance lag?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Unlike backdrop-filter which requires multi-pass rasterization of dynamic background content, CSS box-shadow and linear-gradient calculations are composited directly on the GPU during paint cycles. Ensure you avoid excessively high blur radii (above 80px) and refrain from animating box-shadow distances continuously during 60 FPS page scrolling."
                }
            },
            {
                "@type": "Question",
                "name": "How do you render neumorphism effectively on dark backgrounds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Dark mode neumorphism requires precise control over shade saturation. Pure pitch black (#000000) cannot generate darker ambient shadows; therefore, base dark mode surfaces must use dark slate or charcoal tones (such as #1e293b or #18181b). This leaves headroom for the positive shadow to fall into deep black while the opposing specular highlight illuminates with a muted slate tint."
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
                        {/* Header & Presets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Sliders className="w-5 h-5 text-indigo-600" />
                                        Surface Parameters
                                    </h2>
                                    <span className="text-[11px] font-semibold bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full text-indigo-700 hidden sm:inline-flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                        Interactive Shader Math
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    Reset
                                </button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center justify-start sm:justify-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium">Presets:</span>
                                {Object.keys(PRESET_TEMPLATES).map((name) => (
                                    <button
                                        key={name}
                                        type="button"
                                        onClick={() => loadPreset(name)}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer"
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Base Canvas Color Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">Substrate Base Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={config.baseColor}
                                    onChange={(e) => setConfig((p) => ({ ...p, baseColor: e.target.value }))}
                                    className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                                />
                                <input
                                    type="text"
                                    value={config.baseColor}
                                    onChange={(e) => setConfig((p) => ({ ...p, baseColor: e.target.value }))}
                                    className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <div className="flex items-center gap-1">
                                    {["#e0e5ec", "#f1f5f9", "#e2e8f0", "#1e293b"].map((col) => (
                                        <button
                                            key={col}
                                            type="button"
                                            onClick={() => setConfig((p) => ({ ...p, baseColor: col }))}
                                            style={{ backgroundColor: col }}
                                            className="w-6 h-6 rounded-md border border-slate-300 shadow-xs cursor-pointer"
                                            title={`Set ${col}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Surface Shape Mode Buttons */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">Surface Topography (Shape)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(
                                    [
                                        { key: "flat", label: "Flat" },
                                        { key: "convex", label: "Convex" },
                                        { key: "concave", label: "Concave" },
                                        { key: "pressed", label: "Pressed" },
                                    ] as const
                                ).map((shape) => (
                                    <button
                                        key={shape.key}
                                        type="button"
                                        onClick={() => setConfig((p) => ({ ...p, surfaceShape: shape.key }))}
                                        className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer capitalize text-center ${config.surfaceShape === shape.key
                                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        {shape.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Light Direction Buttons */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Virtual Light Source Direction
                                </span>
                                <span className="font-mono text-slate-500 text-[11px] capitalize">{config.lightDirection}</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(
                                    [
                                        { dir: "top-left", icon: ArrowUpLeft, label: "TL" },
                                        { dir: "top-right", icon: ArrowUpRight, label: "TR" },
                                        { dir: "bottom-right", icon: ArrowDownRight, label: "BR" },
                                        { dir: "bottom-left", icon: ArrowDownLeft, label: "BL" },
                                    ] as const
                                ).map(({ dir, icon: Icon, label }) => (
                                    <button
                                        key={dir}
                                        type="button"
                                        onClick={() => setConfig((p) => ({ ...p, lightDirection: dir }))}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${config.lightDirection === dir
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Distance & Blur Sliders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Distance */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={distanceInputId}>Extrusion Distance:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={distanceInputId}
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={config.distance}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, distance: val })), 1, 50)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-400 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    step="1"
                                    value={config.distance}
                                    onChange={(e) => setConfig((p) => ({ ...p, distance: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Blur */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={blurInputId}>Shadow Softness (Blur):</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={blurInputId}
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={config.blur}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, blur: val })), 1, 100)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-400 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={config.blur}
                                    onChange={(e) => setConfig((p) => ({ ...p, blur: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Radius & Size Sliders */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Radius */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={radiusInputId}>Corner Radius:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={radiusInputId}
                                            type="number"
                                            min="0"
                                            max="160"
                                            value={config.radius}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, radius: val })), 0, 160)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-400 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="160"
                                    step="1"
                                    value={config.radius}
                                    onChange={(e) => setConfig((p) => ({ ...p, radius: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Size */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={sizeInputId}>Element Scale:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            id={sizeInputId}
                                            type="number"
                                            min="80"
                                            max="320"
                                            value={config.size}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, size: val })), 80, 320)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-400 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="80"
                                    max="320"
                                    step="4"
                                    value={config.size}
                                    onChange={(e) => setConfig((p) => ({ ...p, size: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Intensity Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={intensityInputId} className="flex items-center gap-1">
                                    Shadow Intensity (Contrast):
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={intensityInputId}
                                        type="number"
                                        min="5"
                                        max="60"
                                        value={config.intensity}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setConfig((p) => ({ ...p, intensity: val })), 5, 60)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">%</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="60"
                                step="1"
                                value={config.intensity}
                                onChange={(e) => setConfig((p) => ({ ...p, intensity: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Calibrated Dual Occlusion
                        </span>
                        <span>CSS3 & Tailwind Ready</span>
                    </div>
                </div>

                {/* Right Panel: Real-Time Canvas & Output */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Interactive Soft UI Canvas
                            </h2>
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {config.baseColor}
                            </span>
                        </div>

                        {/* Interactive Canvas matching substrate color */}
                        <div
                            style={{ backgroundColor: config.baseColor }}
                            className="relative w-full h-80 rounded-xl overflow-hidden p-6 flex items-center justify-center transition-colors duration-200 border border-slate-200/50 shadow-inner"
                        >
                            {/* Neumorphic Shape Box */}
                            <div
                                style={cssStyleObject}
                                className="flex flex-col items-center justify-center p-4 text-center select-none transition-all duration-150 cursor-pointer active:scale-[0.99]"
                            >
                                <div className="p-2.5 rounded-full mb-2 bg-white/10 flex items-center justify-center">
                                    <Sparkles
                                        className={`w-5 h-5 ${rgbBase.r + rgbBase.g + rgbBase.b > 380 ? "text-slate-600" : "text-slate-200"
                                            }`}
                                    />
                                </div>
                                <span
                                    className={`text-xs font-bold uppercase tracking-wider ${rgbBase.r + rgbBase.g + rgbBase.b > 380 ? "text-slate-700" : "text-slate-200"
                                        }`}
                                >
                                    {config.surfaceShape}
                                </span>
                                <span
                                    className={`text-[10px] font-mono mt-0.5 ${rgbBase.r + rgbBase.g + rgbBase.b > 380 ? "text-slate-500" : "text-slate-400"
                                        }`}
                                >
                                    d:{config.distance}px | r:{config.radius}px
                                </span>
                            </div>
                        </div>

                        {/* Syntax Output Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Generated Syntax</span>
                                </div>
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("css")}
                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${activeFormat === "css" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Pure CSS
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
                            Calculated RGB Luminance Delta
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
                {/* Card 1: Architectural Foundations & Mathematical Model */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Physics of Neumorphism: Dual Occlusion, Photometry, and Extrusions
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Neumorphism (or Soft UI) is an interface design philosophy that treats digital canvases as continuous physical materials like clay, brushed aluminum, or high-density polymers. Unlike traditional flat design that relies on 2D planes, or material design which floats elevated surfaces with single directional drop shadows, neumorphic surfaces are physically fused to the canvas. The visual illusion is generated by pairing balanced complementary shadows:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sun className="w-4 h-4 text-amber-600" /> Specular Crest (Light Shadow)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Positioned opposite the light angle using negative coordinates. This shadow is assigned a higher luminance than the substrate to simulate a reflective bevel facing the virtual lamp.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Ambient Occlusion (Dark Shadow)
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Positioned directly aligned with light trajectory using positive coordinates. It absorbs ambient bounce light, grounding the extruded geometry into the substrate plane.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" /> Substrate Synchronicity
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The card element and the encompassing backdrop container must share an identical background color value. A mismatch instantly breaks the material continuity illusion.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Production Neumorphic CSS Dual-Shadow Formula
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            A production-ready soft UI implementation combines positive and negative offsets within a single comma-separated <code className="text-indigo-200 font-mono">box-shadow</code> property:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`.soft-ui-surface {
  background: #e0e5ec;
  border-radius: 2rem;
  /* Dual Box-Shadow: [dark ambient shadow], [light specular crest] */
  box-shadow: 12px 12px 24px #bec3c9,
              -12px -12px 24px #ffffff;
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Topography Modes (Flat vs Convex vs Concave vs Pressed) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Topography Matrix: Comparing Flat, Convex, Concave, and Inset Geometries
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To construct meaningful affordances, neumorphic interfaces employ distinct surface variations across state machines (default, hover, active, and selected):
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Topography</th>
                                    <th className="p-3">CSS Construction</th>
                                    <th className="p-3">Physical Illusion</th>
                                    <th className="p-3">Standard UX Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Flat</td>
                                    <td className="p-3 font-mono text-xs">Solid color + Outer Box-Shadow</td>
                                    <td className="p-3">Plateau extruded squarely from base</td>
                                    <td className="p-3">Card containers, panels, dashboard widgets</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Convex</td>
                                    <td className="p-3 font-mono text-xs">Linear Gradient (Light to Dark)</td>
                                    <td className="p-3">Bulging, rounded tactile dome</td>
                                    <td className="p-3">Primary clickable buttons, toggle switches</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Concave</td>
                                    <td className="p-3 font-mono text-xs">Linear Gradient (Dark to Light)</td>
                                    <td className="p-3">Scooped dish or depression</td>
                                    <td className="p-3">Slider thumbs, trackpad zones, dials</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Pressed (Inset)</td>
                                    <td className="p-3 font-mono text-xs">inset Box-Shadow (Negative/Positive)</td>
                                    <td className="p-3">Sunken indentation below surface plane</td>
                                    <td className="p-3">Active button states, text inputs, checkboxes</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Performance, Rendering Engines & Compositor Layers */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Rendering Performance & Browser Compositing Optimizations
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Dual box-shadows impose very light computing overhead compared to heavy graphical filters like <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">backdrop-filter</code>, but they still require careful hardware management when animating interactions:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Fluid UI
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Shadow Blur Capping:</strong> Keep blur values within 1.5x to 2x of extrusion distance (e.g., 12px distance with 24px blur). Excessively wide blurs cause paint invalidations over wide canvas regions.
                                </li>
                                <li>
                                    • <strong>Simulate Inset Transitions:</strong> Avoid animating between <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">outer box-shadow</code> and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">inset box-shadow</code> directly; browsers cannot smoothly interpolate outer-to-inner shadows. Instead, cross-fade two pre-rendered pseudo-elements via <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">opacity</code>.
                                </li>
                                <li>
                                    • <strong>Sub-Pixel Antialiasing:</strong> Apply <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">border-radius</code> thoughtfully to avoid jagged rasterization along soft diagonal light edges.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Critical Antipatterns
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Pitch Black (#000000) Base Canvases:</strong> Neumorphism cannot function on absolute pitch black backgrounds because positive shadow offsets cannot fall darker than #000000. Use deep slates (#1e293b) instead.
                                </li>
                                <li>
                                    • <strong>Pure White (#ffffff) Base Canvases:</strong> Similarly, a pure white background prevents the specular light crest from being rendered lighter than the substrate. Use soft off-whites (#f1f5f9 or #eef2f6).
                                </li>
                                <li>
                                    • <strong>Heavy Box-Shadow Repaints on Scroll:</strong> Rendering hundreds of soft UI cards in an unvirtualized infinite list causes composite stuttering on lower-tier mobile chips.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: WCAG Accessibility and Inclusive Design */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Solving the Neumorphic Accessibility Crisis (WCAG 2.1 Compliance)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The primary critique of neumorphism is poor visual accessibility. Because buttons share the exact same hue as the background, users with low visual acuity or viewing screens in high ambient sunlight cannot identify interactive boundaries. Here is how modern UI architects solve this:
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Three Pillars of Accessible Neumorphism</h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    1. <strong>Strict Foreground Icon & Text Contrast:</strong> Never rely on neumorphic shapes alone to communicate meaning. Ensure all inner typographic labels and SVG icons maintain a minimum 4.5:1 contrast ratio against the substrate.
                                </li>
                                <li>
                                    2. <strong>High-Visibility Focus Indicators:</strong> Ensure keyboard navigation displays an explicit 2px solid focus ring with high contrast (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">outline: 2px solid #4f46e5; outline-offset: 4px;</code>).
                                </li>
                                <li>
                                    3. <strong>Subtle Boundary Strokes:</strong> Add an ultra-fine 1px semi-transparent border (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">border: 1px solid rgba(0, 0, 0, 0.05);</code>) to delineate borders under low light settings.
                                </li>
                            </ul>
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
                                What is Neumorphism (Soft UI) in web and UI design?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Neumorphism—a portmanteau of &apos;new&apos; and &apos;skeuomorphism&apos;—is a minimal UI aesthetic that creates the illusion that UI controls are extruded from or debossed into the actual background surface. Instead of hovering above a canvas with floating drop shadows, neumorphic components seamlessly emerge from the surface using matching background colors accompanied by pairing complementary light and dark box-shadow coordinates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the dual box-shadow math work in CSS neumorphism?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Physical neumorphism relies on a single directional virtual light source. A negative offset shadow produces a bright specular highlight tinted lighter than the canvas, while an opposing positive offset shadow produces a soft ambient occlusion shadow tinted darker than the canvas. When both shadows match the background luminosity within an 8-25% intensity range, the illusion of smooth continuous physical material emerges.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are the primary accessibility (WCAG) challenges with neumorphic design?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Because neumorphism relies on low-contrast shadows and identical element-to-background surface colors, subtle button borders often fail the WCAG 2.1 Non-Text Contrast requirement of 3:1. To maintain strict accessibility compliance, always accompany neumorphic styling with high-contrast foreground icons, discernible inner focus outlines, distinct pressed states, and explicit ARIA roles.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Flat, Concave, Convex, and Pressed (Inset) neumorphism?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Flat surfaces employ a solid background color matching the canvas with outer drop shadows. Convex surfaces use a subtle directional linear gradient traveling from light to dark to simulate an outwardly bulging button. Concave surfaces invert that gradient to mimic an inwardly scooped indentation. Pressed (inset) surfaces swap outer box-shadows for inset box-shadows, creating the tactile impression that a button has been depressed into the substrate.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can neumorphic box-shadows run on mobile GPUs without performance lag?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Unlike backdrop-filter which requires multi-pass rasterization of dynamic background content, CSS box-shadow and linear-gradient calculations are composited directly on the GPU during paint cycles. Ensure you avoid excessively high blur radii (above 80px) and refrain from animating box-shadow distances continuously during 60 FPS page scrolling.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do you render neumorphism effectively on dark backgrounds?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Dark mode neumorphism requires precise control over shade saturation. Pure pitch black (#000000) cannot generate darker ambient shadows; therefore, base dark mode surfaces must use dark slate or charcoal tones (such as #1e293b or #18181b). This leaves headroom for the positive shadow to fall into deep black while the opposing specular highlight illuminates with a muted slate tint.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}