"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Palette,
    RefreshCw,
    Copy,
    Check,
    Lock,
    Unlock,
    Download,
    Sliders,
    Eye,
    Shuffle,
    Sparkles,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Layers,
    Lightbulb,
    Target,
    Zap,
    Pipette,
    Share2,
    BarChart3,
    Compass,
    Plus,
    Trash2,
    CheckCircle2,
    XCircle,
    FileJson,
    FileCode,
    Cpu,
    CheckSquare,
    Contrast,
    Activity,
    SlidersHorizontal,
    Code2,
    Layers2,
    Monitor
} from "lucide-react";

// --- Color Space Conversion & Math Helpers ---

interface ColorItem {
    id: string;
    hex: string;
    locked: boolean;
}

type HarmonyMode =
    | "random"
    | "analogous"
    | "monochromatic"
    | "triadic"
    | "complementary"
    | "split-complementary"
    | "tetradic";

// Convert HEX to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const num = parseInt(cleanHex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

// Convert RGB to HEX
function rgbToHex(r: number, g: number, b: number): string {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return (
        "#" +
        [r, g, b]
            .map((x) => clamp(x).toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase()
    );
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;
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
        h /= 6;
    }
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = (h % 360 + 360) % 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
    };
}

// Relative Luminance per WCAG 2.1 specifications
function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Calculate Contrast Ratio between two HEX values
function getContrastRatio(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

// Cryptographically secure random integer
function getCryptoRandom(min: number, max: number): number {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
}

// Generate single random hex color
function generateRandomHex(): string {
    const r = getCryptoRandom(0, 255);
    const g = getCryptoRandom(0, 255);
    const b = getCryptoRandom(0, 255);
    return rgbToHex(r, g, b);
}

export default function RandomColorGenerator() {
    const [palette, setPalette] = useState<ColorItem[]>([
        { id: "1", hex: "#4F46E5", locked: false },
        { id: "2", hex: "#06B6D4", locked: false },
        { id: "3", hex: "#10B981", locked: false },
        { id: "4", hex: "#F59E0B", locked: false },
        { id: "5", hex: "#EC4899", locked: false },
    ]);

    const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>("random");
    const [copiedHex, setCopiedHex] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState<boolean>(false);
    const [activeColorIndex, setActiveColorIndex] = useState<number>(0);
    const [exportFormat, setExportFormat] = useState<"css" | "json" | "tailwind" | "url">("css");

    // Generate harmonized colors based on a base HSL
    const generateHarmonizedPalette = useCallback(
        (mode: HarmonyMode, currentList: ColorItem[]): ColorItem[] => {
            const unlockedIndices = currentList
                .map((item, idx) => (!item.locked ? idx : null))
                .filter((idx) => idx !== null) as number[];

            if (unlockedIndices.length === 0) return currentList;

            // Pick a seed color: either first locked color or generate new seed
            const seedColor = currentList.find((c) => c.locked) || currentList[0];
            const seedRgb = hexToRgb(seedColor.hex);
            const seedHsl = rgbToHsl(seedRgb.r, seedRgb.g, seedRgb.b);

            const baseHue = currentList.some((c) => c.locked)
                ? seedHsl.h
                : getCryptoRandom(0, 359);
            const baseSat = getCryptoRandom(55, 90);
            const baseLight = getCryptoRandom(40, 70);

            return currentList.map((item, index) => {
                if (item.locked) return item;

                let targetHue = baseHue;
                let targetSat = baseSat;
                let targetLight = baseLight;

                switch (mode) {
                    case "analogous":
                        targetHue = (baseHue + (index - 2) * 28 + 360) % 360;
                        targetLight = Math.max(25, Math.min(85, baseLight + (index - 2) * 6));
                        break;
                    case "monochromatic":
                        targetHue = baseHue;
                        targetSat = Math.max(20, Math.min(95, baseSat + (index - 2) * 12));
                        targetLight = Math.max(15, Math.min(90, 20 + index * 16));
                        break;
                    case "triadic": {
                        const offsets = [0, 120, 240, 60, 180];
                        targetHue = (baseHue + (offsets[index % offsets.length] || 0)) % 360;
                        targetLight = Math.max(30, Math.min(80, baseLight + (index % 2 === 0 ? 8 : -8)));
                        break;
                    }
                    case "complementary": {
                        const isOpposite = index >= Math.ceil(currentList.length / 2);
                        targetHue = isOpposite ? (baseHue + 180) % 360 : baseHue;
                        targetLight = Math.max(20, Math.min(85, 30 + (index % 3) * 22));
                        break;
                    }
                    case "split-complementary": {
                        const splitOffsets = [0, 150, 210, 30, 180];
                        targetHue = (baseHue + splitOffsets[index % splitOffsets.length]) % 360;
                        break;
                    }
                    case "tetradic": {
                        const tetradOffsets = [0, 90, 180, 270, 45];
                        targetHue = (baseHue + tetradOffsets[index % tetradOffsets.length]) % 360;
                        break;
                    }
                    case "random":
                    default:
                        return {
                            ...item,
                            hex: generateRandomHex(),
                        };
                }

                const rgb = hslToRgb(targetHue, targetSat, targetLight);
                return {
                    ...item,
                    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
                };
            });
        },
        []
    );

    // Primary palette regeneration handler
    const handleGenerate = useCallback(() => {
        setPalette((prev) => generateHarmonizedPalette(harmonyMode, prev));
    }, [harmonyMode, generateHarmonizedPalette]);

    // Spacebar listener for rapid palette generation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.code === "Space" &&
                e.target instanceof HTMLElement &&
                e.target.tagName !== "INPUT" &&
                e.target.tagName !== "TEXTAREA"
            ) {
                e.preventDefault();
                handleGenerate();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleGenerate]);

    // Toggle individual lock
    const toggleLock = (id: string) => {
        setPalette((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, locked: !item.locked } : item
            )
        );
    };

    // Update individual color value directly
    const updateColorHex = (id: string, newHex: string) => {
        setPalette((prev) =>
            prev.map((item) => (item.id === id ? { ...item, hex: newHex } : item))
        );
    };

    // Add color column
    const addColor = () => {
        if (palette.length >= 8) return;
        const newColor: ColorItem = {
            id: Date.now().toString(),
            hex: generateRandomHex(),
            locked: false,
        };
        setPalette((prev) => [...prev, newColor]);
    };

    // Remove color column
    const removeColor = (id: string) => {
        if (palette.length <= 2) return;
        setPalette((prev) => prev.filter((item) => item.id !== id));
        if (activeColorIndex >= palette.length - 1) {
            setActiveColorIndex(Math.max(0, palette.length - 2));
        }
    };

    // Copy single color
    const handleCopyColor = (hex: string) => {
        navigator.clipboard.writeText(hex);
        setCopiedHex(hex);
        setTimeout(() => setCopiedHex(null), 1800);
    };

    // Active color metrics
    const activeColor = palette[activeColorIndex] || palette[0];
    const activeRgb = useMemo(() => hexToRgb(activeColor.hex), [activeColor.hex]);
    const activeHsl = useMemo(
        () => rgbToHsl(activeRgb.r, activeRgb.g, activeRgb.b),
        [activeRgb]
    );
    const contrastWithWhite = useMemo(
        () => getContrastRatio(activeColor.hex, "#FFFFFF"),
        [activeColor.hex]
    );
    const contrastWithBlack = useMemo(
        () => getContrastRatio(activeColor.hex, "#000000"),
        [activeColor.hex]
    );

    // Export formats generator
    const exportCode = useMemo(() => {
        switch (exportFormat) {
            case "css":
                return `:root {\n${palette
                    .map((c, i) => `  --color-palette-${i + 1}: ${c.hex};`)
                    .join("\n")}\n}`;
            case "json":
                return JSON.stringify(
                    palette.map((c, i) => {
                        const rgb = hexToRgb(c.hex);
                        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
                        return {
                            index: i + 1,
                            hex: c.hex,
                            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
                            hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
                        };
                    }),
                    null,
                    2
                );
            case "tailwind":
                return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${palette
                    .map((c, i) => `        'brand-${i + 1}': '${c.hex}',`)
                    .join("\n")}\n      }\n    }\n  }\n}`;
            case "url":
                return `https://twistertools.com/tools/random-tools/random-color-generator?palette=${palette
                    .map((c) => c.hex.replace("#", ""))
                    .join("-")}`;
        }
    }, [palette, exportFormat]);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(exportCode);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleDownloadJSON = () => {
        const blob = new Blob([exportCode], { type: "text/plain;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `palette-${Date.now()}.${exportFormat === "json" ? "json" : "txt"}`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication & FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Random Color & Palette Generator",
        "url": "https://twistertools.com/tools/random-tools/random-color-generator",
        "description": "Generate harmonious color schemes, random HEX/RGB/HSL palettes, and evaluate WCAG contrast ratios with hardware cryptographic entropy.",
        "applicationCategory": "DesignApplication",
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
                "name": "How does the Color Harmony algorithm generate complementary and analogous palettes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The engine converts locked or seed HEX colors into the cylindrical HSL (Hue, Saturation, Lightness) color space. By shifting the angular Hue coordinate along the 360-degree color wheel (e.g., +180° for Complementary, ±30° for Analogous, and 120° intervals for Triadic), mathematical color harmony is preserved."
                }
            },
            {
                "@type": "Question",
                "name": "What are WCAG 2.1 contrast ratios and why are they critical?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Web Content Accessibility Guidelines (WCAG 2.1) require minimum contrast ratios between foreground text and background colors to ensure legibility for users with visual impairments. AA compliance mandates a 4.5:1 ratio for regular text and 3:1 for large text, while AAA requires 7:1."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between HEX, RGB, and HSL color representations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "HEX is a base-16 hexadecimal shorthand for Red, Green, and Blue channels. RGB represents color via digital light channel intensities from 0 to 255. HSL maps colors perceptually via Hue (0-360° on the color wheel), Saturation percentage (color purity), and Lightness percentage (luminance)."
                }
            },
            {
                "@type": "Question",
                "name": "How can I lock specific colors while randomizing others?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Click the Lock icon on any color card in the generator workspace. When you press the Spacebar or click 'Generate Palette', locked colors remain fixed while all unlocked columns recalculate harmoniously."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export these palettes to Tailwind CSS and CSS Custom Properties?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The Export Code panel lets you export your generated scheme instantly as standard CSS variables (:root), Tailwind CSS configuration code, raw JSON objects, or shareable URL tokens."
                }
            },
            {
                "@type": "Question",
                "name": "Why is hardware cryptographic entropy better than Math.random() for color generation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard Math.random() uses pseudo-random number generator (PRNG) algorithms that can suffer from periodic loops and statistical clustering. Web Crypto API uses system-level hardware entropy to ensure a completely uniform probability across the entire 16,777,216 RGB 24-bit color spectrum."
                }
            },
            {
                "@type": "Question",
                "name": "How does color temperature affect digital interface usability?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cool hues (blues, cyans, greens) evoke calmness, trust, and structural stability, making them dominant choices for financial, productivity, and SaaS applications. Warm hues (reds, oranges, ambers) stimulate eye movement and vigilance, which makes them ideal for primary calls-to-action, warnings, and time-sensitive alerts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* SEO Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Interactive Workspace Canvas */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-w-0">
                {/* Control Toolbar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={handleGenerate}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition cursor-pointer"
                        >
                            <Shuffle className="w-4 h-4" />
                            Generate Palette
                            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-indigo-500/40 text-[10px] uppercase font-mono tracking-wider">
                                Space
                            </span>
                        </button>

                        {/* Harmony Rule Selector */}
                        <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-indigo-600 hidden sm:inline-block" />
                            <select
                                value={harmonyMode}
                                onChange={(e) => setHarmonyMode(e.target.value as HarmonyMode)}
                                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="random">Mode: Pure Random</option>
                                <option value="analogous">Harmonized: Analogous</option>
                                <option value="monochromatic">Harmonized: Monochromatic</option>
                                <option value="triadic">Harmonized: Triadic</option>
                                <option value="complementary">Harmonized: Complementary</option>
                                <option value="split-complementary">Harmonized: Split-Comp</option>
                                <option value="tetradic">Harmonized: Tetradic</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={addColor}
                            disabled={palette.length >= 8}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Color
                        </button>
                        <button
                            onClick={() => {
                                setPalette((prev) =>
                                    prev.map((c) => ({ ...c, locked: false }))
                                );
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
                        >
                            <Unlock className="w-3.5 h-3.5" />
                            Unlock All
                        </button>
                    </div>
                </div>

                {/* Color Palette Columns Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-row divide-y sm:divide-y-0 sm:divide-x lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[360px]">
                    {palette.map((item, index) => {
                        const rgb = hexToRgb(item.hex);
                        const isLight = getLuminance(rgb.r, rgb.g, rgb.b) > 0.45;
                        const isSelected = activeColorIndex === index;

                        return (
                            <div
                                key={item.id}
                                onClick={() => setActiveColorIndex(index)}
                                className={`relative group flex flex-col justify-between p-5 transition-all cursor-pointer min-h-[160px] sm:min-h-[360px] lg:flex-1 lg:min-w-0 ${isSelected ? "ring-4 ring-indigo-600/40 z-10" : ""
                                    }`}
                                style={{ backgroundColor: item.hex }}
                            >
                                {/* Top Badges: Lock & Controls */}
                                <div className="flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLock(item.id);
                                        }}
                                        aria-label={item.locked ? "Unlock color column" : "Lock color column"}
                                        className={`p-2 rounded-xl backdrop-blur-md transition ${item.locked
                                            ? "bg-slate-900/80 text-white shadow-md"
                                            : isLight
                                                ? "bg-black/10 hover:bg-black/20 text-slate-900"
                                                : "bg-white/20 hover:bg-white/30 text-white"
                                            }`}
                                    >
                                        {item.locked ? (
                                            <Lock className="w-4 h-4" />
                                        ) : (
                                            <Unlock className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                        )}
                                    </button>

                                    {palette.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeColor(item.id);
                                            }}
                                            aria-label="Remove color column"
                                            className={`p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition ${isLight
                                                ? "bg-black/10 hover:bg-rose-600 hover:text-white text-slate-900"
                                                : "bg-white/20 hover:bg-rose-600 hover:text-white text-white"
                                                }`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Center Native Color Picker & Quick View */}
                                <div className="flex flex-col items-center justify-center my-4 space-y-2">
                                    <label
                                        onClick={(e) => e.stopPropagation()}
                                        className="relative cursor-pointer group/picker inline-block"
                                    >
                                        <input
                                            type="color"
                                            value={item.hex}
                                            onChange={(e) => updateColorHex(item.id, e.target.value.toUpperCase())}
                                            className="sr-only"
                                        />
                                        <div
                                            className={`p-2.5 rounded-2xl backdrop-blur-md shadow-sm border border-white/20 transition transform group-hover/picker:scale-110 flex items-center gap-1.5 ${isLight ? "bg-white/80 text-slate-900" : "bg-black/40 text-white"
                                                }`}
                                        >
                                            <Pipette className="w-4 h-4" />
                                            <span className="text-[11px] font-bold">Pick</span>
                                        </div>
                                    </label>
                                </div>

                                {/* Bottom Info Bar */}
                                <div
                                    className={`space-y-1.5 p-3 rounded-xl backdrop-blur-md transition ${isLight ? "bg-white/85 text-slate-900" : "bg-slate-950/75 text-white"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider">
                                            {item.hex}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyColor(item.hex);
                                            }}
                                            aria-label={`Copy color code ${item.hex}`}
                                            className="p-1 rounded hover:bg-indigo-50 hover:text-indigo-600 transition"
                                        >
                                            {copiedHex === item.hex ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-4 h-4 opacity-80" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-[11px] font-mono opacity-80">
                                        rgb({rgb.r}, {rgb.g}, {rgb.b})
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 50/50 Split Workspace Grid: Deep Inspector & Code Export */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Selected Color Inspector & WCAG Contrast Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Selected Color Inspector
                            </h2>
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-4 h-4 rounded-full border border-slate-300"
                                    style={{ backgroundColor: activeColor.hex }}
                                />
                                <span className="font-mono font-bold text-xs text-slate-700">
                                    {activeColor.hex}
                                </span>
                            </div>
                        </div>

                        {/* Color Space Matrix */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    HEX
                                </span>
                                <p className="font-mono font-bold text-sm text-slate-900">
                                    {activeColor.hex}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    RGB
                                </span>
                                <p className="font-mono font-bold text-xs text-slate-900 truncate">
                                    {activeRgb.r}, {activeRgb.g}, {activeRgb.b}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                    HSL
                                </span>
                                <p className="font-mono font-bold text-xs text-slate-900 truncate">
                                    {activeHsl.h}°, {activeHsl.s}%, {activeHsl.l}%
                                </p>
                            </div>
                        </div>

                        {/* Accessibility & WCAG Contrast Test Card */}
                        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                WCAG 2.1 Accessibility & Contrast Compliance
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Contrast on Pure White */}
                                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-600">On White (#FFF)</span>
                                        <span className="font-mono font-bold text-slate-900">
                                            {contrastWithWhite.toFixed(2)}:1
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-100">
                                        <span className="flex items-center gap-1">
                                            {contrastWithWhite >= 4.5 ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-500" />
                                            )}
                                            AA (4.5:1)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {contrastWithWhite >= 7.0 ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-500" />
                                            )}
                                            AAA (7.0:1)
                                        </span>
                                    </div>
                                </div>

                                {/* Contrast on Pure Black */}
                                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-slate-300">On Black (#000)</span>
                                        <span className="font-mono font-bold text-indigo-400">
                                            {contrastWithBlack.toFixed(2)}:1
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs pt-1 border-t border-slate-800">
                                        <span className="flex items-center gap-1">
                                            {contrastWithBlack >= 4.5 ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-400" />
                                            )}
                                            AA (4.5:1)
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {contrastWithBlack >= 7.0 ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-rose-400" />
                                            )}
                                            AAA (7.0:1)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Relative Luminance: {getLuminance(activeRgb.r, activeRgb.g, activeRgb.b).toFixed(4)}</span>
                        <span>Hardware Cryptographic RNG</span>
                    </div>
                </div>

                {/* Right Panel: Developer Export Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                Export Engine & Presets
                            </h2>
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                {(["css", "tailwind", "json", "url"] as const).map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition cursor-pointer ${exportFormat === fmt
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Formatted Code Block Preview */}
                        <div className="relative">
                            <pre className="w-full h-56 p-4 rounded-xl bg-slate-900 text-indigo-200 font-mono text-xs overflow-auto border border-slate-800 leading-relaxed">
                                {exportCode}
                            </pre>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyAll}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copiedAll ? "Copied Export Code" : "Copy Code to Clipboard"}
                        </button>
                        <button
                            onClick={handleDownloadJSON}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Download
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Foundations & Mathematical Color Wheel Formulas */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithmic Color Harmony: Mathematical Geometry on the 360° Color Wheel
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        In digital UI architecture and graphic design, color harmony is not an arbitrary aesthetic judgment; it is a deterministic mathematical science governed by trigonometric and geometric intervals across the cylindrical <strong>HSL (Hue, Saturation, Lightness)</strong> and <strong>HSV</strong> color spaces. By mapping the continuous visible spectrum onto a closed 360-degree polar coordinate circle, algorithms compute harmonic sets that maximize aesthetic balance, eliminate visual vibration, and direct user cognitive focus.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" /> Analogous Symmetry
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                {"Formed by selecting hues adjacent along the coordinate perimeter ($$H_n = H_{\\text{seed}} \\pm 30^\\circ$$). Creates serene, unified visuals with low chromatic tension, frequently deployed in modern dashboard backgrounds and brand gradients."}
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-[11px]">
                                H_i = (H_0 + (i - 2) * 28) % 360
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-indigo-600" /> Complementary Polar Pairs
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                {"Couples opposing chromatic coordinates ($$H_{\\text{comp}} = (H_{\\text{base}} + 180^\\circ) \\bmod 360^\\circ$$). Maximizes simultaneous contrast, making it the primary heuristic for Call-to-Action (CTA) buttons and critical system alerts."}
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-[11px]">
                                H_target = (H_seed + 180) % 360
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Triadic Equilateral Vertices
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Establishes an equilateral triangle on the hue wheel ($$H_0, H_0 + 120^\circ, H_0 + 240^\circ$$). Balances chromatic vibrancy with structured equilibrium, preventing visual dominance by any single spectrum band.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2.5 rounded-lg font-mono text-[11px]">
                                H_triad = [0°, 120°, 240°] + H_0
                            </div>
                        </div>
                    </div>

                    <div className="p-5 border border-slate-200 rounded-xl bg-indigo-50/40 space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Advanced Harmony Geometries: Split-Complementary & Tetradic Rectangles
                        </h3>
                        <p className="text-xs text-slate-700 leading-relaxed">
                            Beyond basic three-point triads, <strong>Split-Complementary</strong> schemes soften harsh direct opposites by selecting two adjacent flanking hues ($$H \pm 30^\circ$$ relative to the direct opposite $$H + 180^\circ$$, specifically $$H + 150^\circ$$ and $$H + 210^\circ$$). Meanwhile, <strong>Tetradic (Double-Complementary)</strong> arrangements utilize two intersecting complementary pairs arranged in a 90-degree square or 60/120-degree rectangle, creating multi-layered enterprise UI palettes with ample semantic states (info, warning, error, and success).
                        </p>
                    </div>
                </section>

                {/* Card 2: WCAG 2.1 Contrast Standards & Accessibility Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WCAG 2.1 Relative Luminance & Accessibility Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Accessibility compliance under the <strong>Web Content Accessibility Guidelines (WCAG 2.1 / 2.2)</strong>, <strong>Americans with Disabilities Act (ADA Title III)</strong>, and <strong>European Standard EN 301 549</strong> is mandatory for digital software. Contrast evaluation relies on Relative Luminance ($$L$$), which models human eye spectral sensitivity weighting (Green $$71.52\%$$, Red $$21.26\%$$, Blue $$7.22\%$$):
                    </p>

                    <div className="p-4 bg-slate-900 text-indigo-200 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
                        <p>{"// Step 1: Linearize 8-bit sRGB channels (v in range 0..1)"}</p>
                        <p>{"sRGB_to_linear(v) = (v <= 0.03928) ? (v / 12.92) : Math.pow((v + 0.055) / 1.055, 2.4)"}</p>
                        <p className="pt-2">{"// Step 2: Compute Photometric Relative Luminance"}</p>
                        <p>{"L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin"}</p>
                        <p className="pt-2">{"// Step 3: Compute Final Contrast Ratio"}</p>
                        <p>{"Contrast = (L_brightest + 0.05) / (L_darkest + 0.05)"}</p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                            Official WCAG Conformance Requirements Matrix
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                    <tr>
                                        <th className="p-3">Compliance Tier</th>
                                        <th className="p-3">Body Text (&lt; 18pt / 24px)</th>
                                        <th className="p-3">Large Text (&ge; 18pt or &ge; 14pt Bold)</th>
                                        <th className="p-3">UI Controls & Icons</th>
                                        <th className="p-3">Target Industry Standard</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 font-medium">
                                    <tr className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-900">Level AA (Legal Minimum)</td>
                                        <td className="p-3 font-mono font-bold text-indigo-600">4.50 : 1</td>
                                        <td className="p-3 font-mono font-semibold text-slate-800">3.00 : 1</td>
                                        <td className="p-3 font-mono font-semibold text-slate-800">3.00 : 1</td>
                                        <td className="p-3 text-xs">Standard SaaS, E-Commerce, Consumer Apps</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-emerald-50/40">
                                        <td className="p-3 font-bold text-slate-900">Level AAA (Enhanced)</td>
                                        <td className="p-3 font-mono font-bold text-emerald-700">7.00 : 1</td>
                                        <td className="p-3 font-mono font-bold text-emerald-700">4.50 : 1</td>
                                        <td className="p-3 font-mono font-semibold text-slate-800">4.50 : 1</td>
                                        <td className="p-3 text-xs">Government, Healthcare, Mission-Critical Tools</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 bg-rose-50/40">
                                        <td className="p-3 font-bold text-rose-900">Failing (&lt; 3.00 : 1)</td>
                                        <td className="p-3 font-mono text-rose-600">Non-Compliant</td>
                                        <td className="p-3 font-mono text-rose-600">Non-Compliant</td>
                                        <td className="p-3 font-mono text-rose-600">Non-Compliant</td>
                                        <td className="p-3 text-xs">Causes Accessibility Lawsuit Exposure</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Card 3: Color Models Technical Comparison */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comprehensive Digital Color Models: HEX vs RGB vs HSL vs OKLCH
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Modern front-end engineering frameworks (Next.js, Tailwind CSS, styled-components) interact with multiple color models depending on the rendering pipeline and browser gamut:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Code2 className="w-4 h-4 text-indigo-600" /> HEX (Hexadecimal Base-16)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                {"A 24-bit representation consisting of three 8-bit bytes in base-16 ($$00$$ to $$\\text{FF}$$). It allows for $$256^3 = 16,777,216$$ discrete color variations. It is the most universally supported format across CSS, SVG attributes, and design design-token systems (Figma, Sketch)."}
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2 rounded text-xs font-mono">
                                Example: #4F46E5 (Indigo 600)
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-indigo-600" /> RGB / RGBA (Additive Light)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Direct representation of hardware sub-pixel emitter intensity from $$0$$ to $$255$$. Ideal for canvas manipulations, WebGL shaders, and runtime CSS opacity modulations via the alpha channel parameter.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2 rounded text-xs font-mono">
                                Example: rgb(79, 70, 229) / rgba(79, 70, 229, 0.8)
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> HSL (Perceptual Cylindrical)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Formatted as Hue ($$0^\circ - 360^\circ$$), Saturation ($$0\% - 100\%$$), and Lightness ($$0\% - 100\%$$). HSL is human-friendly, making programmatic color variations (e.g. creating hover, active, and focus shades by altering $$L$$) straightforward.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2 rounded text-xs font-mono">
                                Example: hsl(243, 75%, 59%)
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> OKLCH (Perceptual Uniformity)
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Standardized in CSS Color Module Level 4, OKLCH ensures uniform perceived lightness across all hues, preventing yellow from looking unnaturally brighter than blue at identical lightness values, and supports wide-gamut Display P3 displays.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-2 rounded text-xs font-mono">
                                Example: oklch(0.55 0.22 278.4)
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Systematic UI Design & The 60-30-10 Rule */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Design System Heuristics: Practical Implementation of the 60-30-10 Rule
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        High-converting digital product interfaces maintain cognitive balance by allocating palette components according to the timeless <strong>60-30-10 Rule</strong>. This structure ensures clear visual hierarchy without overwhelming users:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    60% Canvas
                                </span>
                                <span className="text-xs font-bold text-slate-400">Dominant Base</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base">Background Architecture</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Neutral white (<code className="font-mono">#FFFFFF</code>), slate light (<code className="font-mono">#F8FAFC</code>), or dark charcoal (<code className="font-mono">#0F172A</code>). Defines negative space and establishes macro readability.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    30% Structure
                                </span>
                                <span className="text-xs font-bold text-slate-400">Secondary Hierarchy</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base">Cards, Navbars & Forms</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Subdued neutrals, bordered containers, dropdown drawers, and sidebars. Provides contrast boundaries that separate functional sections.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    10% Accent
                                </span>
                                <span className="text-xs font-bold text-slate-400">High-Impact Focal</span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-base">Primary Conversion & Alerts</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Saturated brand indigos, vibrant emeralds, or amber warnings. Reserved exclusively for primary buttons, active tabs, and checkout interactions.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-600" /> Psychology of Color Temperature in Product UX
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-700 pt-1">
                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                                <strong className="text-indigo-900 block font-bold text-sm">Cool Hues (Blues, Cyans, Teals)</strong>
                                <p className="leading-relaxed">
                                    Associated with security, precision, and enterprise stability. Standard palette choice for developer tooling, banking infrastructures, and cloud SaaS platforms.
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                                <strong className="text-amber-900 block font-bold text-sm">Warm Hues (Reds, Oranges, Ambers)</strong>
                                <p className="leading-relaxed">
                                    Trigger heightened sensory awareness and rapid decision making. Ideal for flash sales, live status indicators, and mission-critical actions.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Developer Workflows */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Developer Workflow: Integrating Palettes into Next.js & Tailwind CSS
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Follow these production integration patterns to configure your generated color palettes across modern front-end architectures:
                    </p>

                    <div className="space-y-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">1</span>
                                Export CSS Custom Properties to <code className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">globals.css</code>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Copy the CSS output directly into your application root stylesheets. This allows instant global theming and runtime dark-mode switching without re-compiling styles:
                            </p>
                            <pre className="p-3 rounded-lg bg-slate-900 text-indigo-200 font-mono text-xs overflow-x-auto">
                                {`:root {
  --color-brand-primary: #4F46E5;
  --color-brand-secondary: #06B6D4;
  --color-brand-accent: #10B981;
}`}
                            </pre>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">2</span>
                                Extend Tailwind CSS Config (<code className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded">tailwind.config.ts</code>)
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Link Tailwind utility classes directly to your design tokens for clean autocomplete support across your entire codebase:
                            </p>
                            <pre className="p-3 rounded-lg bg-slate-900 text-indigo-200 font-mono text-xs overflow-x-auto">
                                {`// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        }
      }
    }
  }
};`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 6: Extended Frequently Asked Questions (FAQ) */}
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
                                How does the Color Harmony algorithm generate complementary and analogous palettes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The engine converts locked or seed HEX colors into the cylindrical HSL (Hue, Saturation, Lightness) color space. By shifting the angular Hue coordinate along the 360-degree color wheel (e.g., +180° for Complementary, ±30° for Analogous, and 120° intervals for Triadic), mathematical color harmony is preserved.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What are WCAG 2.1 contrast ratios and why are they critical?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Web Content Accessibility Guidelines (WCAG 2.1) require minimum contrast ratios between foreground text and background colors to ensure legibility for users with visual impairments. AA compliance mandates a 4.5:1 ratio for regular text and 3:1 for large text, while AAA requires 7:1.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between HEX, RGB, and HSL color representations?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                HEX is a base-16 hexadecimal shorthand for Red, Green, and Blue channels. RGB represents color via digital light channel intensities from 0 to 255. HSL maps colors perceptually via Hue (0-360° on the color wheel), Saturation percentage (color purity), and Lightness percentage (luminance).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I lock specific colors while randomizing others?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Click the Lock icon on any color card in the generator workspace. When you press the Spacebar or click &quot;Generate Palette&quot;, locked colors remain fixed while all unlocked columns recalculate harmoniously.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export these palettes to Tailwind CSS and CSS Custom Properties?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The Export Code panel lets you export your generated scheme instantly as standard CSS variables (:root), Tailwind CSS configuration code, raw JSON objects, or shareable URL tokens.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is hardware cryptographic entropy better than Math.random() for color generation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">Math.random()</code> uses pseudo-random algorithms that can suffer from periodic loops and statistical clustering. The Web Crypto API uses system-level hardware entropy to ensure uniform probability across the entire 16,777,216 RGB 24-bit spectrum.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does color temperature affect digital interface usability?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Cool hues (blues, cyans, greens) evoke calmness, trust, and structural stability, making them dominant choices for financial, productivity, and SaaS applications. Warm hues (reds, oranges, ambers) stimulate eye movement and vigilance, which makes them ideal for primary calls-to-action, warnings, and time-sensitive alerts.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}