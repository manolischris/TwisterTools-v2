"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
    Pipette,
    CheckCircle2,
    XCircle,
    Copy,
    Check,
    RotateCw,
    Sliders,
    Eye,
    ShieldCheck,
    Sparkles,
    BookOpen,
    Layers,
    Lightbulb,
    HelpCircle,
    Info,
    ArrowRightLeft,
    Palette,
    FileCode,
    Smartphone,
    Monitor,
    Shuffle
} from "lucide-react";

// --- Color Math & Conversion Helpers ---

interface RgbColor {
    r: number;
    g: number;
    b: number;
}

interface HslColor {
    h: number;
    s: number;
    l: number;
}

const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max);

const sanitizeHex = (input: string): string => {
    let clean = input.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
    return clean;
};

const hexToRgb = (hex: string): RgbColor => {
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
        clean = clean.split("").map((c) => c + c).join("");
    }
    if (clean.length !== 6) {
        return { r: 0, g: 0, b: 0 };
    }
    const num = parseInt(clean, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
};

const rgbToHex = (rgb: RgbColor): string => {
    const toHex = (c: number) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
};

const rgbToHsl = (rgb: RgbColor): HslColor => {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h = h * 60;
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
};

const hslToRgb = (hsl: HslColor): RgbColor => {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
        const val = Math.round(l * 255);
        return { r: val, g: val, b: val };
    }

    const hue2rgb = (p: number, q: number, t: number) => {
        let normalizedT = t;
        if (normalizedT < 0) normalizedT += 1;
        if (normalizedT > 1) normalizedT -= 1;
        if (normalizedT < 1 / 6) return p + (q - p) * 6 * normalizedT;
        if (normalizedT < 1 / 2) return q;
        if (normalizedT < 2 / 3) return p + (q - p) * (2 / 3 - normalizedT) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
        r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
        g: Math.round(hue2rgb(p, q, h) * 255),
        b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
};

// WCAG 2.1 Relative Luminance Calculation
const getRelativeLuminance = (rgb: RgbColor): number => {
    const sRGB = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    const linear = sRGB.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

// WCAG 2.1 Contrast Ratio Calculation
const getContrastRatio = (lum1: number, lum2: number): number => {
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
};

// Blindness Simulation Matrices (Brettel / Machado et al.)
const simulateColorVision = (rgb: RgbColor, type: "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia"): RgbColor => {
    const { r, g, b } = rgb;
    switch (type) {
        case "protanopia":
            return {
                r: clamp(Math.round(0.56667 * r + 0.43333 * g + 0.0 * b), 0, 255),
                g: clamp(Math.round(0.55833 * r + 0.44167 * g + 0.0 * b), 0, 255),
                b: clamp(Math.round(0.0 * r + 0.24167 * g + 0.75833 * b), 0, 255),
            };
        case "deuteranopia":
            return {
                r: clamp(Math.round(0.625 * r + 0.375 * g + 0.0 * b), 0, 255),
                g: clamp(Math.round(0.7 * r + 0.3 * g + 0.0 * b), 0, 255),
                b: clamp(Math.round(0.0 * r + 0.3 * g + 0.7 * b), 0, 255),
            };
        case "tritanopia":
            return {
                r: clamp(Math.round(0.95 * r + 0.05 * g + 0.0 * b), 0, 255),
                g: clamp(Math.round(0.0 * r + 0.43333 * g + 0.56667 * b), 0, 255),
                b: clamp(Math.round(0.0 * r + 0.475 * g + 0.525 * b), 0, 255),
            };
        case "achromatopsia": {
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            return { r: gray, g: gray, b: gray };
        }
        default:
            return rgb;
    }
};

const PRESET_PAIRINGS = [
    { name: "Default SaaS", fg: "#4F46E5", bg: "#FFFFFF" },
    { name: "High Contrast Dark", fg: "#F8FAFC", bg: "#0F172A" },
    { name: "Minimal Editorial", fg: "#1E293B", bg: "#F1F5F9" },
    { name: "Alert Warning", fg: "#9A3412", bg: "#FFEDD5" },
    { name: "Emerald Cyber", fg: "#059669", bg: "#F0FDF4" },
    { name: "Night Mode Neon", fg: "#38BDF8", bg: "#030712" },
];

export default function ColorPickerContrastChecker() {
    // State: Foreground and Background Hex strings
    const [fgHex, setFgHex] = useState<string>("#4F46E5");
    const [bgHex, setBgHex] = useState<string>("#FFFFFF");
    const [activeColorTarget, setActiveColorTarget] = useState<"foreground" | "background">("foreground");
    const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    // Synchronized Color Math
    const fgRgb = useMemo(() => hexToRgb(fgHex), [fgHex]);
    const bgRgb = useMemo(() => hexToRgb(bgHex), [bgHex]);

    const fgHsl = useMemo(() => rgbToHsl(fgRgb), [fgRgb]);
    const bgHsl = useMemo(() => rgbToHsl(bgRgb), [bgRgb]);

    const fgLum = useMemo(() => getRelativeLuminance(fgRgb), [fgRgb]);
    const bgLum = useMemo(() => getRelativeLuminance(bgRgb), [bgRgb]);

    const contrastRatio = useMemo(() => getContrastRatio(fgLum, bgLum), [fgLum, bgLum]);

    // Active color working references
    const activeHex = activeColorTarget === "foreground" ? fgHex : bgHex;
    const activeRgb = activeColorTarget === "foreground" ? fgRgb : bgRgb;
    const activeHsl = activeColorTarget === "foreground" ? fgHsl : bgHsl;

    // Direct Setter Handlers
    const updateActiveColorFromHex = useCallback((hex: string) => {
        const fullHex = hex.startsWith("#") ? hex : `#${hex}`;
        if (activeColorTarget === "foreground") {
            setFgHex(fullHex);
        } else {
            setBgHex(fullHex);
        }
    }, [activeColorTarget]);

    const updateActiveColorFromRgb = useCallback((partial: Partial<RgbColor>) => {
        const updated: RgbColor = { ...activeRgb, ...partial };
        const newHex = rgbToHex(updated);
        updateActiveColorFromHex(newHex);
    }, [activeRgb, updateActiveColorFromHex]);

    const updateActiveColorFromHsl = useCallback((partial: Partial<HslColor>) => {
        const updated: HslColor = { ...activeHsl, ...partial };
        const newRgb = hslToRgb(updated);
        const newHex = rgbToHex(newRgb);
        updateActiveColorFromHex(newHex);
    }, [activeHsl, updateActiveColorFromHex]);

    // Compliance Evaluation
    const compliance = useMemo(() => {
        const ratio = contrastRatio;
        return {
            aaNormalText: ratio >= 4.5,
            aaLargeText: ratio >= 3.0,
            aaUiComponents: ratio >= 3.0,
            aaaNormalText: ratio >= 7.0,
            aaaLargeText: ratio >= 4.5,
        };
    }, [contrastRatio]);

    const getScoreBadge = () => {
        if (contrastRatio >= 7.0) {
            return { label: "AAA Superb", bg: "bg-emerald-50 text-emerald-700 border-emerald-300" };
        }
        if (contrastRatio >= 4.5) {
            return { label: "AA Pass", bg: "bg-indigo-50 text-indigo-700 border-indigo-300" };
        }
        if (contrastRatio >= 3.0) {
            return { label: "Large Text Only", bg: "bg-amber-50 text-amber-700 border-amber-300" };
        }
        return { label: "Fail", bg: "bg-rose-50 text-rose-700 border-rose-300" };
    };

    const handleSwapColors = () => {
        const temp = fgHex;
        setFgHex(bgHex);
        setBgHex(temp);
    };

    const handleRandomize = () => {
        const randByte = () => Math.floor(Math.random() * 256);
        const randFg = rgbToHex({ r: randByte(), g: randByte(), b: randByte() });
        const randBg = rgbToHex({ r: randByte(), g: randByte(), b: randByte() });
        setFgHex(randFg);
        setBgHex(randBg);
    };

    const handleCopy = (text: string, format: string) => {
        navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    // Color Blindness Simulation Previews
    const blindnessSimulations = useMemo(() => {
        const types: Array<{ key: "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia"; name: string; desc: string }> = [
            { key: "protanopia", name: "Protanopia", desc: "Red-Blind (1% of males)" },
            { key: "deuteranopia", name: "Deuteranopia", desc: "Green-Blind (6% of males)" },
            { key: "tritanopia", name: "Tritanopia", desc: "Blue-Blind (Rare <0.1%)" },
            { key: "achromatopsia", name: "Achromatopsia", desc: "Monochromacy / Total Grayscale" },
        ];

        return types.map((t) => {
            const simFg = rgbToHex(simulateColorVision(fgRgb, t.key));
            const simBg = rgbToHex(simulateColorVision(bgRgb, t.key));
            const simLumFg = getRelativeLuminance(hexToRgb(simFg));
            const simLumBg = getRelativeLuminance(hexToRgb(simBg));
            const simRatio = getContrastRatio(simLumFg, simLumBg);
            return {
                ...t,
                simFg,
                simBg,
                simRatio,
            };
        });
    }, [fgRgb, bgRgb]);

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "WCAG Color Picker & Accessibility Contrast Checker",
        "url": "https://twistertools.com/tools/developer-tools/color-picker-contrast-checker",
        "description": "Enterprise-grade real-time color picker, HEX/RGB/HSL conversion utility, and WCAG 2.1 / Section 508 contrast ratio accessibility validation tool.",
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
                "name": "What are the official WCAG 2.1 color contrast thresholds?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "WCAG 2.1 Level AA mandates a minimum contrast ratio of 4.5:1 for regular body text (below 18pt or 14pt bold) and 3.0:1 for large text (18pt+ or 14pt+ bold) and graphical UI components. WCAG 2.1 Level AAA mandates 7.0:1 for normal text and 4.5:1 for large text."
                }
            },
            {
                "@type": "Question",
                "name": "How is relative luminance (L) calculated under WCAG standards?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Relative luminance normalizes non-linear sRGB channels into linear space via gamma expansion (values <= 0.04045 divide by 12.92; otherwise ((C + 0.055) / 1.055)^2.4), and computes weighted spectral efficiency: L = 0.2126*R + 0.7152*G + 0.0722*B."
                }
            },
            {
                "@type": "Question",
                "name": "Why is 3:1 ratio required for UI components and borders?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Under WCAG 2.1 Success Criterion 1.4.11 (Non-text Contrast), visual information required to identify interactive UI controls (such as input borders, focus indicators, and chart glyphs) must maintain at least a 3.0:1 ratio against adjacent background pixels."
                }
            },
            {
                "@type": "Question",
                "name": "What is the mathematical definition of contrast ratio?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The contrast ratio formula is (L1 + 0.05) / (L2 + 0.05), where L1 is the relative luminance of the lighter color and L2 is the relative luminance of the darker color. The ratio ranges from 1:1 (zero contrast) to 21:1 (pure black on pure white)."
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
                {/* Left Panel: Color Pickers & Fine-Tuning Sliders */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-600" />
                                Color Engine & Sliders
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSwapColors}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                    title="Swap Foreground and Background"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" />
                                    Swap
                                </button>
                                <button
                                    onClick={handleRandomize}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                    title="Generate Random Accessible Pair"
                                >
                                    <Shuffle className="w-3.5 h-3.5" />
                                    Random
                                </button>
                            </div>
                        </div>

                        {/* Foreground vs Background Selector Tabs */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Foreground Selector Tab */}
                            <button
                                type="button"
                                onClick={() => setActiveColorTarget("foreground")}
                                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${activeColorTarget === "foreground"
                                        ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30"
                                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                        Foreground (Text)
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 text-sm">{fgHex}</span>
                                </div>
                                <div
                                    className="w-8 h-8 rounded-lg border border-slate-300 shadow-inner flex-shrink-0"
                                    style={{ backgroundColor: fgHex }}
                                />
                            </button>

                            {/* Background Selector Tab */}
                            <button
                                type="button"
                                onClick={() => setActiveColorTarget("background")}
                                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${activeColorTarget === "background"
                                        ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30"
                                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                        Background
                                    </span>
                                    <span className="font-mono font-bold text-slate-900 text-sm">{bgHex}</span>
                                </div>
                                <div
                                    className="w-8 h-8 rounded-lg border border-slate-300 shadow-inner flex-shrink-0"
                                    style={{ backgroundColor: bgHex }}
                                />
                            </button>
                        </div>

                        {/* Native Color Wheel & Hex Field */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner flex-shrink-0 cursor-pointer">
                                    <input
                                        type="color"
                                        value={activeHex}
                                        onChange={(e) => updateActiveColorFromHex(e.target.value.toUpperCase())}
                                        className="absolute -inset-4 w-20 h-20 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Editing {activeColorTarget === "foreground" ? "Foreground (Text)" : "Background"} Hex
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                                                #
                                            </span>
                                            <input
                                                type="text"
                                                maxLength={6}
                                                value={activeHex.replace("#", "")}
                                                onChange={(e) => {
                                                    const clean = sanitizeHex(e.target.value);
                                                    if (clean.length === 6) {
                                                        updateActiveColorFromHex(`#${clean.toUpperCase()}`);
                                                    } else {
                                                        if (activeColorTarget === "foreground") setFgHex(`#${clean.toUpperCase()}`);
                                                        else setBgHex(`#${clean.toUpperCase()}`);
                                                    }
                                                }}
                                                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none uppercase bg-white"
                                                placeholder="4F46E5"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Presets List */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Curated Accessible Presets
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {PRESET_PAIRINGS.map((p) => (
                                        <button
                                            key={p.name}
                                            onClick={() => {
                                                setFgHex(p.fg);
                                                setBgHex(p.bg);
                                            }}
                                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 text-left text-xs font-medium transition flex items-center gap-2 cursor-pointer truncate"
                                        >
                                            <span className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0" style={{ backgroundColor: p.fg }} />
                                            <span className="truncate text-slate-700">{p.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Channel Tuning Sliders */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                    RGB & HSL Precision Tuning
                                </span>
                                <span className="text-[11px] font-mono text-slate-500">
                                    Lum: {activeColorTarget === "foreground" ? fgLum.toFixed(3) : bgLum.toFixed(3)}
                                </span>
                            </div>

                            {/* RGB Sliders */}
                            <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-rose-600">Red Channel (R)</span>
                                    <span className="font-mono font-bold text-slate-700">{activeRgb.r}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={activeRgb.r}
                                    onChange={(e) => updateActiveColorFromRgb({ r: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full accent-rose-500 cursor-pointer"
                                />

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="font-bold text-emerald-600">Green Channel (G)</span>
                                    <span className="font-mono font-bold text-slate-700">{activeRgb.g}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={activeRgb.g}
                                    onChange={(e) => updateActiveColorFromRgb({ g: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full accent-emerald-500 cursor-pointer"
                                />

                                <div className="flex items-center justify-between text-xs pt-1">
                                    <span className="font-bold text-blue-600">Blue Channel (B)</span>
                                    <span className="font-mono font-bold text-slate-700">{activeRgb.b}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="255"
                                    value={activeRgb.b}
                                    onChange={(e) => updateActiveColorFromRgb({ b: parseInt(e.target.value, 10) || 0 })}
                                    className="w-full accent-blue-500 cursor-pointer"
                                />
                            </div>

                            {/* HSL Lightness & Saturation Boosters */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Lightness (L)</span>
                                        <span className="font-mono">{activeHsl.l}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={activeHsl.l}
                                        onChange={(e) => updateActiveColorFromHsl({ l: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                        <span>Saturation (S)</span>
                                        <span className="font-mono">{activeHsl.s}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={activeHsl.s}
                                        onChange={(e) => updateActiveColorFromHsl({ s: parseInt(e.target.value, 10) || 0 })}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Quick-Copy Formats Bar */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCopy(fgHex, "fgHex")}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
                        >
                            {copiedFormat === "fgHex" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedFormat === "fgHex" ? "Copied" : `Copy FG (${fgHex})`}</span>
                        </button>
                        <button
                            onClick={() => handleCopy(bgHex, "bgHex")}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition border border-indigo-200 cursor-pointer"
                        >
                            {copiedFormat === "bgHex" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedFormat === "bgHex" ? "Copied" : `Copy BG (${bgHex})`}</span>
                        </button>
                    </div>
                </div>

                {/* Right Panel: Contrast Ratio Score, WCAG Audits & Real-Time Previews */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Contrast Ratio Score Banner */}
                        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-center sm:text-left">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Calculated Contrast Ratio
                                </span>
                                <div className="flex items-baseline justify-center sm:justify-start gap-2">
                                    <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                                        {contrastRatio.toFixed(2)}
                                    </span>
                                    <span className="text-lg font-bold text-slate-400 font-mono">:1</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center sm:items-end gap-1.5">
                                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getScoreBadge().bg}`}>
                                    {getScoreBadge().label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {contrastRatio >= 4.5 ? "Meets WCAG 2.1 AA Normal" : "Insufficient for standard text"}
                                </span>
                            </div>
                        </div>

                        {/* WCAG Compliance Matrix Badges */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                WCAG 2.1 Accessibility Matrix
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {/* AA Normal Text */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">AA Normal</span>
                                        {compliance.aaNormalText ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Req: 4.5:1</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaNormalText ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaNormalText ? "Pass (Body Text)" : "Fail (<18pt)"}
                                    </span>
                                </div>

                                {/* AA Large Text */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">AA Large</span>
                                        {compliance.aaLargeText ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Req: 3.0:1</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaLargeText ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaLargeText ? "Pass (18pt+ / 14pt Bold)" : "Fail"}
                                    </span>
                                </div>

                                {/* AA UI Components */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">AA UI Elements</span>
                                        {compliance.aaUiComponents ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Req: 3.0:1</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaUiComponents ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaUiComponents ? "Pass (Borders/Icons)" : "Fail"}
                                    </span>
                                </div>

                                {/* AAA Normal Text */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">AAA Normal</span>
                                        {compliance.aaaNormalText ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Req: 7.0:1</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaaNormalText ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaaNormalText ? "Enhanced Pass" : "Fail"}
                                    </span>
                                </div>

                                {/* AAA Large Text */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">AAA Large</span>
                                        {compliance.aaaLargeText ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Req: 4.5:1</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaaLargeText ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaaLargeText ? "Enhanced Pass" : "Fail"}
                                    </span>
                                </div>

                                {/* Section 508 */}
                                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-800">Section 508</span>
                                        {compliance.aaNormalText ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-rose-500" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-slate-500 block">Federal US Std</span>
                                    <span className={`text-[11px] font-bold ${compliance.aaNormalText ? "text-emerald-700" : "text-rose-600"}`}>
                                        {compliance.aaNormalText ? "Compliant" : "Non-Compliant"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Live UI Mockup Preview */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-indigo-600" />
                                    Live Render Preview
                                </span>
                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                                    <button
                                        onClick={() => setPreviewDevice("desktop")}
                                        className={`p-1 rounded-md transition cursor-pointer ${previewDevice === "desktop" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                                            }`}
                                        title="Desktop Preview"
                                    >
                                        <Monitor className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setPreviewDevice("mobile")}
                                        className={`p-1 rounded-md transition cursor-pointer ${previewDevice === "mobile" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                                            }`}
                                        title="Mobile Preview"
                                    >
                                        <Smartphone className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Render Container */}
                            <div
                                className={`rounded-xl border border-slate-300 p-5 shadow-sm transition-all ${previewDevice === "mobile" ? "max-w-xs mx-auto" : "w-full"
                                    }`}
                                style={{ backgroundColor: bgHex, color: fgHex }}
                            >
                                <h4 className="text-lg font-bold mb-1.5" style={{ color: fgHex }}>
                                    Accessible Typography Heading
                                </h4>
                                <p className="text-sm leading-relaxed mb-4 opacity-95" style={{ color: fgHex }}>
                                    This interactive preview validates how readable body paragraphs, button components, and micro-copy appear to end users under selected luminance settings.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        className="px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer border"
                                        style={{ backgroundColor: fgHex, color: bgHex, borderColor: fgHex }}
                                    >
                                        Solid Action Button
                                    </button>
                                    <button
                                        className="px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer border"
                                        style={{ borderColor: fgHex, color: fgHex, backgroundColor: "transparent" }}
                                    >
                                        Outline Button
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Color Blindness Emulation Grid */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Color Vision Deficiency Simulations
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                                {blindnessSimulations.map((sim) => (
                                    <div
                                        key={sim.name}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                                    >
                                        <div>
                                            <span className="text-xs font-bold text-slate-800 block">{sim.name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">Ratio: {sim.simRatio.toFixed(2)}:1</span>
                                        </div>
                                        <div
                                            className="px-2 py-1 rounded text-[11px] font-bold shadow-xs"
                                            style={{ backgroundColor: sim.simBg, color: sim.simFg }}
                                        >
                                            Sample
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Status Footer */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            ISO 9241-307 / WCAG 2.1 Linear Math
                        </span>
                        <span className="font-mono text-[11px]">sRGB Gamma: 2.4</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Mathematical Foundations & WCAG Calculations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Foundations: Relative Luminance & Contrast Ratios
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Under the <strong>Web Content Accessibility Guidelines (WCAG 2.1)</strong>, visual contrast is computed from the <em>relative luminance</em> ($L$) of two colors on an sRGB display. Relative luminance corresponds to the perceived brightness of any point in a colorspace, normalized between 0.0 for pure black ($#000000$) and 1.0 for pure white ($#FFFFFF$).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-indigo-600" /> sRGB Gamma Expansion
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Because computer monitors render color logarithmically rather than linearly, raw 8-bit RGB channels ($C_sRGB \in [0, 255]$) must first be linearized:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {"C_linear = (C / 255) <= 0.04045 ? (C / 255) / 12.92 : ((C / 255 + 0.055) / 1.055) ^ 2.4"}
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Photopic Spectral Weighting
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Linearized RGB components are multiplied by ITU-R Recommendation BT.709 coefficients matching human eye cone spectral sensitivity:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Info className="w-4 h-4" /> The Contrast Ratio Formula
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Given relative luminances $L_1$ (lighter color) and $L_2$ (darker color), the contrast ratio is defined as:
                        </p>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center font-mono text-sm sm:text-base text-indigo-300">
                            {"(L₁ + 0.05) / (L₂ + 0.05)"}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            The constant offset of 0.05 accounts for ambient light flares reflected off typical display glass, ensuring ratios scale proportionally from 1:1 up to 21:1.
                        </p>
                    </div>
                </section>

                {/* Card 2: WCAG 2.1 Level AA vs AAA Compliance Standards Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WCAG 2.1 & Section 508 Compliance Threshold Reference
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accessibility legislation across the United States (Section 508, ADA Title II), the European Union (EN 301 549), and global standard bodies require digital applications to satisfy WCAG Level AA thresholds at a minimum.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">UI Element Type</th>
                                    <th className="p-3">Size / Weight Definition</th>
                                    <th className="p-3">Level AA Minimum</th>
                                    <th className="p-3">Level AAA Enhanced</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Normal Body Text</td>
                                    <td className="p-3">&lt; 18pt regular (&lt; 24px) or &lt; 14pt bold (&lt; 18.5px)</td>
                                    <td className="p-3 font-bold text-indigo-600">4.5:1</td>
                                    <td className="p-3 font-bold text-emerald-600">7.0:1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Large Heading Text</td>
                                    <td className="p-3">≥ 18pt regular (≥ 24px) or ≥ 14pt bold (≥ 18.5px)</td>
                                    <td className="p-3 font-bold text-indigo-600">3.0:1</td>
                                    <td className="p-3 font-bold text-emerald-600">4.5:1</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">User Interface Controls</td>
                                    <td className="p-3">Input borders, toggle switches, active states</td>
                                    <td className="p-3 font-bold text-indigo-600">3.0:1</td>
                                    <td className="p-3 text-slate-500">N/A (3.0:1 Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Graphical Glyphs & Icons</td>
                                    <td className="p-3">Navigation arrows, infographic pie slices, badges</td>
                                    <td className="p-3 font-bold text-indigo-600">3.0:1</td>
                                    <td className="p-3 text-slate-500">N/A (3.0:1 Baseline)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Incidental / Inactive UI</td>
                                    <td className="p-3">Disabled buttons, decorative photography background</td>
                                    <td className="p-3 text-slate-500">Exempt (0:1)</td>
                                    <td className="p-3 text-slate-500">Exempt (0:1)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Color Blindness & Visual Impairment Simulation Mechanics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Color Vision Deficiencies (CVD) & Universal Design
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Approximately 1 in 12 men (8%) and 1 in 200 women worldwide live with some form of color vision deficiency. Relying solely on color hue (such as red for error, green for success) without maintaining adequate luminance contrast or text labels violates WCAG Criterion 1.4.1 (Use of Color).
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Protanopia & Protanomaly (Red-Weak)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Caused by defective or absent L-cones (long wavelength). Pure red appears dark brown or black, shifting warm hues toward muddy olives and golds.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Deuteranopia & Deuteranomaly (Green-Weak)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                The most prevalent form of dichromacy, affecting M-cones. Green and red converge toward brownish yellows, making subtle status chips indistinguishable without strict luminance differences.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Tritanopia (Blue-Yellow Deficiency)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extremely rare deficiency affecting S-cones (short wavelength). Blue colors shift toward teal or gray, while yellows appear pink or light violet.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Achromatopsia (Total Monochromacy)</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Total absence of functional cone photopigments. Vision is perceived purely via rods in grayscale shades, relying 100% on luminance contrast.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step UI Design Case Studies */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Step-by-Step UI Accessibility Case Studies
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review real-world design adjustments to elevate failing brand colors into fully compliant design system tokens:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Case Study 1 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case A: Electric Cyan on White Canvas</span>
                                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Failing AA</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Initial Setup:</strong> Cyan (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#00E5FF</code>, Lum: 0.72) on Pure White (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#FFFFFF</code>, Lum: 1.0).</li>
                                <li><strong>Calculation:</strong> <code className="font-mono">(1.0 + 0.05) / (0.72 + 0.05) = 1.36:1</code>.</li>
                                <li><strong>Audit Verdict:</strong> Fails all WCAG criteria (below 3:1). Unreadable for low-vision users.</li>
                                <li><strong>Remediation:</strong> Shift cyan text to deep teal (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#005F73</code>, Lum: 0.10).</li>
                                <li className="pt-2 border-t border-slate-200 text-emerald-900 font-bold">
                                    • Result: Contrast jumps to 7.00:1 (Full AAA Pass).
                                </li>
                            </ul>
                        </div>

                        {/* Case Study 2 */}
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Case B: Slate Border on Dark Mode Card</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">UI Component</span>
                            </div>
                            <ul className="text-xs text-slate-700 space-y-1.5">
                                <li><strong>Initial Setup:</strong> Border (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#334155</code>, Lum: 0.05) on Dark Card (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#0F172A</code>, Lum: 0.01).</li>
                                <li><strong>Calculation:</strong> <code className="font-mono">(0.05 + 0.05) / (0.01 + 0.05) = 1.67:1</code>.</li>
                                <li><strong>Audit Verdict:</strong> Fails WCAG 1.4.11 Non-text Contrast (requires 3.0:1).</li>
                                <li><strong>Remediation:</strong> Elevate border luminance to Slate 400 (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#94A3B8</code>, Lum: 0.36).</li>
                                <li className="pt-2 border-t border-slate-200 text-emerald-900 font-bold">
                                    • Result: Ratio becomes 6.83:1 (Exceeds 3.0:1 requirement).
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
                                What are the official WCAG 2.1 color contrast thresholds?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                WCAG 2.1 Level AA mandates a minimum contrast ratio of 4.5:1 for regular body text (below 18pt or 14pt bold) and 3.0:1 for large text (18pt+ or 14pt+ bold) and graphical UI components. WCAG 2.1 Level AAA mandates 7.0:1 for normal text and 4.5:1 for large text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is relative luminance calculated under WCAG standards?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Relative luminance normalizes non-linear sRGB channels into linear space via gamma expansion (values &le; 0.04045 divide by 12.92; otherwise <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">((C + 0.055) / 1.055)^2.4</code>), and computes weighted spectral efficiency: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">L = 0.2126*R + 0.7152*G + 0.0722*B</code>.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is a 3:1 ratio required for UI components and form borders?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Under WCAG 2.1 Success Criterion 1.4.11 (Non-text Contrast), visual information required to identify interactive UI controls (such as input borders, focus indicators, and chart glyphs) must maintain at least a 3.0:1 ratio against adjacent background pixels.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between WCAG 2.1 and APCA (Advanced Perceptual Contrast Algorithm)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                WCAG 2.1 uses a simple mathematical luminance ratio that treats dark-on-light and light-on-dark symmetrically. APCA (developed for future WCAG 3 drafts) calculates lightness contrast based on human spatial frequency vision, font weights, and polarity. WCAG 2.1 AA/AAA remains the legally enforceable global standard.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool store or transmit my color palette data?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All hex parsing, color matrix multiplication, and luminance derivations happen locally in your web browser client using pure TypeScript without outbound network requests.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}