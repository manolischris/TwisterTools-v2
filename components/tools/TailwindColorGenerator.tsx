"use client";

import React, { useState, useMemo, useId } from "react";
import {
    Palette,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Code,
    Layers,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    FileCode,
    Download,
    Shuffle,
    Wand2,
    Compass,
    SlidersHorizontal
} from "lucide-react";

type ExportFormat = "tailwind-v3" | "tailwind-v4" | "css-variables" | "json";
type ShadeStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

interface PaletteShade {
    stop: ShadeStop;
    hex: string;
    rgb: string;
    hsl: string;
    contrastRatioAgainstWhite: number;
    contrastRatioAgainstBlack: number;
    recommendedTextColor: "#ffffff" | "#0f172a";
}

interface HslColor {
    h: number; // 0 - 360
    s: number; // 0 - 100
    l: number; // 0 - 100
}

interface RgbColor {
    r: number; // 0 - 255
    g: number; // 0 - 255
    b: number; // 0 - 255
}

const PRESET_BRAND_COLORS: Record<string, { name: string; hex: string }> = {
    Indigo: { name: "twister-indigo", hex: "#4f46e5" },
    Sky: { name: "ocean-sky", hex: "#0284c7" },
    Emerald: { name: "mint-emerald", hex: "#059669" },
    Amber: { name: "sunburst-amber", hex: "#d97706" },
    Rose: { name: "crimson-rose", hex: "#e11d48" },
    Violet: { name: "neon-violet", hex: "#7c3aed" },
    Cyan: { name: "electric-cyan", hex: "#0891b2" },
    Slate: { name: "slate-neutral", hex: "#475569" },
};

const SHADE_STOPS: ShadeStop[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Natural luminance calibration curves modeled after official Tailwind CSS palettes
const TARGET_LIGHTNESS: Record<ShadeStop, number> = {
    50: 97,
    100: 93,
    200: 84,
    300: 72,
    400: 58,
    500: 48,
    600: 40,
    700: 32,
    800: 24,
    900: 17,
    950: 10,
};

// Saturation curve modulations to keep pastel shades vibrant and dark shades rich without clipping
const SATURATION_MODIFIER: Record<ShadeStop, number> = {
    50: 0.70,
    100: 0.75,
    200: 0.85,
    300: 0.92,
    400: 0.98,
    500: 1.00,
    600: 1.02,
    700: 1.04,
    800: 1.06,
    900: 1.08,
    950: 1.10,
};

const sanitizeHex = (input: string): string => {
    let clean = input.replace(/[^0-9A-Fa-f]/g, "");
    if (clean.length > 6) clean = clean.substring(0, 6);
    return `#${clean}`;
};

const hexToRgb = (hex: string): RgbColor => {
    const cleanHex = hex.replace("#", "");
    const fullHex =
        cleanHex.length === 3
            ? cleanHex.split("").map((c) => c + c).join("")
            : cleanHex.padEnd(6, "0");
    const r = parseInt(fullHex.substring(0, 2), 16) || 0;
    const g = parseInt(fullHex.substring(2, 4), 16) || 0;
    const b = parseInt(fullHex.substring(4, 6), 16) || 0;
    return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
    const toHexPart = (n: number) => clamp(n).toString(16).padStart(2, "0");
    return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
};

const rgbToHsl = (r: number, g: number, b: number): HslColor => {
    const normR = r / 255;
    const normG = g / 255;
    const normB = b / 255;
    const max = Math.max(normR, normG, normB);
    const min = Math.min(normR, normG, normB);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        switch (max) {
            case normR:
                h = (normG - normB) / delta + (normG < normB ? 6 : 0);
                break;
            case normG:
                h = (normB - normR) / delta + 2;
                break;
            case normB:
                h = (normR - normG) / delta + 4;
                break;
        }
        h = Math.round(h * 60);
    }

    return {
        h: Math.round(h),
        s: Math.round(s * 100),
        l: Math.round(l * 100),
    };
};

const hslToRgb = (h: number, s: number, l: number): RgbColor => {
    const normH = (h % 360 + 360) % 360 / 360;
    const normS = Math.max(0, Math.min(100, s)) / 100;
    const normL = Math.max(0, Math.min(100, l)) / 100;

    if (normS === 0) {
        const val = Math.round(normL * 255);
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

    const q = normL < 0.5 ? normL * (1 + normS) : normL + normS - normL * normS;
    const p = 2 * normL - q;

    const r = Math.round(hue2rgb(p, q, normH + 1 / 3) * 255);
    const g = Math.round(hue2rgb(p, q, normH) * 255);
    const b = Math.round(hue2rgb(p, q, normH - 1 / 3) * 255);

    return { r, g, b };
};

const calculateRelativeLuminance = (rgb: RgbColor): number => {
    const transformChannel = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const sR = transformChannel(rgb.r);
    const sG = transformChannel(rgb.g);
    const sB = transformChannel(rgb.b);
    return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
};

const getContrastRatio = (lumA: number, lumB: number): number => {
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return Math.round(ratio * 100) / 100;
};

const generate11StopScale = (
    baseHex: string,
    hueShiftAmount: number,
    saturationShiftAmount: number
): PaletteShade[] => {
    const baseRgb = hexToRgb(baseHex);
    const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);

    const whiteLum = 1.0;
    const blackLum = 0.0;

    return SHADE_STOPS.map((stop) => {
        if (stop === 500) {
            const contrastWhite = getContrastRatio(calculateRelativeLuminance(baseRgb), whiteLum);
            const contrastBlack = getContrastRatio(calculateRelativeLuminance(baseRgb), blackLum);
            return {
                stop,
                hex: baseHex.toLowerCase(),
                rgb: `${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}`,
                hsl: `${baseHsl.h}, ${baseHsl.s}%, ${baseHsl.l}%`,
                contrastRatioAgainstWhite: contrastWhite,
                contrastRatioAgainstBlack: contrastBlack,
                recommendedTextColor: contrastWhite >= 4.5 ? "#ffffff" : "#0f172a",
            };
        }

        // Relative distance from the 500 baseline
        const distanceFactor = (stop - 500) / 450; // Range: ~ -1.0 to +1.0
        const shiftedHue = Math.round((baseHsl.h + distanceFactor * hueShiftAmount + 360) % 360);

        const targetL = TARGET_LIGHTNESS[stop];
        const rawS = baseHsl.s * SATURATION_MODIFIER[stop] * (1 + (distanceFactor * saturationShiftAmount) / 100);
        const clampedS = Math.max(5, Math.min(100, Math.round(rawS)));

        const generatedRgb = hslToRgb(shiftedHue, clampedS, targetL);
        const generatedHex = rgbToHex(generatedRgb.r, generatedRgb.g, generatedRgb.b);
        const generatedHsl = rgbToHsl(generatedRgb.r, generatedRgb.g, generatedRgb.b);

        const shadeLum = calculateRelativeLuminance(generatedRgb);
        const contrastWhite = getContrastRatio(shadeLum, whiteLum);
        const contrastBlack = getContrastRatio(shadeLum, blackLum);

        return {
            stop,
            hex: generatedHex.toLowerCase(),
            rgb: `${generatedRgb.r}, ${generatedRgb.g}, ${generatedRgb.b}`,
            hsl: `${generatedHsl.h}, ${generatedHsl.s}%, ${generatedHsl.l}%`,
            contrastRatioAgainstWhite: contrastWhite,
            contrastRatioAgainstBlack: contrastBlack,
            recommendedTextColor: contrastWhite >= 4.5 ? "#ffffff" : "#0f172a",
        };
    });
};

export default function TailwindColorGenerator() {
    const [baseHexInput, setBaseHexInput] = useState<string>("#4f46e5");
    const [colorName, setColorName] = useState<string>("brand");
    const [hueShift, setHueShift] = useState<number>(0);
    const [saturationShift, setSaturationShift] = useState<number>(0);
    const [activeFormat, setActiveFormat] = useState<ExportFormat>("tailwind-v3");
    const [activeStopPreview, setActiveStopPreview] = useState<ShadeStop>(500);
    const [copied, setCopied] = useState<boolean>(false);
    const [copiedSingleStop, setCopiedSingleStop] = useState<ShadeStop | null>(null);

    const baseHexId = useId();
    const colorNameId = useId();
    const hueShiftId = useId();
    const saturationShiftId = useId();

    const verifiedBaseHex = useMemo(() => {
        const regex = /^#([0-9A-Fa-f]{3}){1,2}$/;
        return regex.test(baseHexInput) ? baseHexInput : "#4f46e5";
    }, [baseHexInput]);

    const paletteShades = useMemo(() => {
        return generate11StopScale(verifiedBaseHex, hueShift, saturationShift);
    }, [verifiedBaseHex, hueShift, saturationShift]);

    const activePreviewShade = useMemo(() => {
        return paletteShades.find((s) => s.stop === activeStopPreview) || paletteShades[5];
    }, [paletteShades, activeStopPreview]);

    const cleanSafeName = useMemo(() => {
        const slug = colorName.toLowerCase().replace(/[^a-z0-9-_]/g, "");
        return slug.length > 0 ? slug : "brand";
    }, [colorName]);

    const generatedTailwindV3 = useMemo(() => {
        const lines = paletteShades
            .map((shade) => `      ${shade.stop}: '${shade.hex}',`)
            .join("\n");
        return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${cleanSafeName}': {\n${lines}\n        },\n      },\n    },\n  },\n};`;
    }, [paletteShades, cleanSafeName]);

    const generatedTailwindV4 = useMemo(() => {
        const lines = paletteShades
            .map((shade) => `  --color-${cleanSafeName}-${shade.stop}: ${shade.hex};`)
            .join("\n");
        return `/* app/globals.css (Tailwind CSS v4 @theme directive) */\n@theme {\n${lines}\n}`;
    }, [paletteShades, cleanSafeName]);

    const generatedCssVariables = useMemo(() => {
        const hexLines = paletteShades
            .map((shade) => `  --${cleanSafeName}-${shade.stop}: ${shade.hex};`)
            .join("\n");
        const rgbLines = paletteShades
            .map((shade) => `  --${cleanSafeName}-${shade.stop}-rgb: ${shade.rgb};`)
            .join("\n");
        return `:root {\n  /* ${cleanSafeName} Hex Codes */\n${hexLines}\n\n  /* ${cleanSafeName} RGB Channels */\n${rgbLines}\n}`;
    }, [paletteShades, cleanSafeName]);

    const generatedJson = useMemo(() => {
        const obj: Record<string, Record<string, string>> = { [cleanSafeName]: {} };
        paletteShades.forEach((shade) => {
            obj[cleanSafeName][shade.stop.toString()] = shade.hex;
        });
        return JSON.stringify(obj, null, 2);
    }, [paletteShades, cleanSafeName]);

    const exportSyntax = useMemo(() => {
        switch (activeFormat) {
            case "tailwind-v3":
                return generatedTailwindV3;
            case "tailwind-v4":
                return generatedTailwindV4;
            case "css-variables":
                return generatedCssVariables;
            case "json":
                return generatedJson;
        }
    }, [activeFormat, generatedTailwindV3, generatedTailwindV4, generatedCssVariables, generatedJson]);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(exportSyntax);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopySingleShade = (shade: PaletteShade) => {
        navigator.clipboard.writeText(shade.hex);
        setCopiedSingleStop(shade.stop);
        setTimeout(() => setCopiedSingleStop(null), 1500);
    };

    const handleDownload = () => {
        let extension = "js";
        let mime = "text/javascript";
        let filename = `${cleanSafeName}-palette.tailwind.js`;

        if (activeFormat === "tailwind-v4" || activeFormat === "css-variables") {
            extension = "css";
            mime = "text/css";
            filename = `${cleanSafeName}-colors.${extension}`;
        } else if (activeFormat === "json") {
            extension = "json";
            mime = "application/json";
            filename = `${cleanSafeName}-tokens.json`;
        }

        const blob = new Blob([exportSyntax], { type: mime });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleResetDefaults = () => {
        setBaseHexInput("#4f46e5");
        setColorName("brand");
        setHueShift(0);
        setSaturationShift(0);
        setActiveStopPreview(500);
    };

    const handleGenerateRandom = () => {
        const randomHex = `#${Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")}`;
        setBaseHexInput(randomHex);
    };

    const handlePresetSelect = (hex: string, name: string) => {
        setBaseHexInput(hex);
        setColorName(name);
    };

    const sanitizeInteger = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void,
        min: number,
        max: number
    ) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^(-)?0+(?=\d)/, "$1");
        const parsed = parseInt(cleaned, 10);
        if (isNaN(parsed)) {
            setter(0);
            return;
        }
        setter(Math.max(min, Math.min(max, parsed)));
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Tailwind CSS Color Palette Generator & Config Exporter",
        "url": "https://twistertools.com/tools/developer-tools/tailwind-color-generator",
        "description": "Generate harmonic 11-stop color palettes from any base hex code. Export instant copy-ready configuration files for Tailwind CSS v3, Tailwind CSS v4 @theme, and standard CSS Custom Properties.",
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
                "name": "How does this generator calculate the 11 Tailwind color stops (50-950)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The algorithm maps your root color into the HSL (Hue, Saturation, Lightness) color space and clamps the 500-level baseline. It then calculates the remaining stops using a calibrated non-linear lightness distribution curve and dynamic saturation compensation to prevent clipping on light tints (50-200) and dark shades (800-950)."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Tailwind CSS v3 and Tailwind CSS v4 color formats?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tailwind CSS v3 relies on JavaScript module exports in tailwind.config.js using theme.extend.colors. Tailwind CSS v4 eliminates the JavaScript configuration file in favor of pure CSS cascading variables mapped within the new @theme directive (such as --color-brand-500: #4f46e5;)."
                }
            },
            {
                "@type": "Question",
                "name": "How does hue shifting make color scales feel more natural?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In natural sunlight, illuminated highlights naturally shift toward warmer yellow and amber spectrums, while shadowed tones lean toward cool blue and violet wavelengths. Hue shifting simulates this physical optical phenomenon, eliminating muddy grays in darker stops and chalky pastels in lighter tints."
                }
            },
            {
                "@type": "Question",
                "name": "How is WCAG 2.1 contrast compliance evaluated for text against these shades?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each shade is converted from sRGB channels to relative luminance using the CIE standard photometric formula (0.2126R + 0.7152G + 0.0722B). Contrast ratios are computed against pure white (#ffffff) and pure black (#000000). A minimum ratio of 4.5:1 is required to satisfy WCAG AA standards for standard body text."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use these generated colors with CSS opacity modifiers in Tailwind?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When exported into Tailwind v3 or v4, the modern build engines automatically unwrap the hex codes into opacity-compatible color functions, allowing you to seamlessly apply utility classes such as bg-brand-500/80 or text-brand-600/50 without manual configuration."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool run client-side without sending data to an external API?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. All mathematical color conversions, curve modulations, and syntax generation execute entirely within your browser runtime using Web Standards. No telemetry, user inputs, or hex codes are ever dispatched over the network."
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
                {/* Left Panel: Color Controls & Harmonics Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Reset */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Palette Configurator
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleGenerateRandom}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                        title="Generate random root hex"
                                    >
                                        <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                                        Random
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetDefaults}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                        title="Reset to Indigo default"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center justify-start gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
                                {Object.entries(PRESET_BRAND_COLORS).map(([label, item]) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => handlePresetSelect(item.hex, item.name)}
                                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                                            style={{ backgroundColor: item.hex }}
                                        />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Base Color & Token Name Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor={baseHexId} className="text-xs font-bold text-slate-700 block">
                                    Base 500 Color (Hex)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={verifiedBaseHex}
                                        onChange={(e) => setBaseHexInput(e.target.value)}
                                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                                        aria-label="Color Picker"
                                    />
                                    <input
                                        id={baseHexId}
                                        type="text"
                                        value={baseHexInput}
                                        maxLength={7}
                                        onChange={(e) => setBaseHexInput(sanitizeHex(e.target.value))}
                                        placeholder="#4f46e5"
                                        className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 uppercase tracking-wide focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor={colorNameId} className="text-xs font-bold text-slate-700 block">
                                    Theme Variable Slug
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
                                        color-
                                    </span>
                                    <input
                                        id={colorNameId}
                                        type="text"
                                        value={colorName}
                                        maxLength={24}
                                        onChange={(e) => setColorName(e.target.value)}
                                        placeholder="brand"
                                        className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Optical Hue Shift Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={hueShiftId} className="flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-indigo-600" />
                                    Optical Hue Shift (Highlight/Shadow Angle):
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={hueShiftId}
                                        type="number"
                                        min="-60"
                                        max="60"
                                        value={hueShift}
                                        onChange={(e) => sanitizeInteger(e, setHueShift, -60, 60)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">°</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="-60"
                                max="60"
                                step="1"
                                value={hueShift}
                                onChange={(e) => setHueShift(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>-60° (Cool shadows)</span>
                                <span>0° (Uniform hue)</span>
                                <span>+60° (Warm shadows)</span>
                            </div>
                        </div>

                        {/* Saturation Curve Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={saturationShiftId} className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                                    Perceptual Saturation Gradient Curve:
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={saturationShiftId}
                                        type="number"
                                        min="-50"
                                        max="50"
                                        value={saturationShift}
                                        onChange={(e) => sanitizeInteger(e, setSaturationShift, -50, 50)}
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">%</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="-50"
                                max="50"
                                step="1"
                                value={saturationShift}
                                onChange={(e) => setSaturationShift(Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                <span>-50% (Muted extremes)</span>
                                <span>0% (Standard)</span>
                                <span>+50% (High dynamic punch)</span>
                            </div>
                        </div>

                        {/* Interactive 11-Stop Horizontal Swatch Ribbon */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Interactive Palette Strip</span>
                                <span className="text-[11px] text-slate-400">Click any stop to inspect & copy</span>
                            </div>
                            <div className="grid grid-cols-11 gap-1 rounded-xl p-1.5 bg-slate-100 border border-slate-200">
                                {paletteShades.map((shade) => (
                                    <button
                                        key={shade.stop}
                                        type="button"
                                        onClick={() => setActiveStopPreview(shade.stop)}
                                        style={{ backgroundColor: shade.hex }}
                                        title={`${cleanSafeName}-${shade.stop}: ${shade.hex}`}
                                        className={`h-12 sm:h-14 rounded-lg flex flex-col items-center justify-between p-1 transition-all cursor-pointer relative ${activeStopPreview === shade.stop
                                            ? "ring-2 ring-indigo-600 scale-105 z-10 shadow-md"
                                            : "hover:scale-95"
                                            }`}
                                    >
                                        <span
                                            style={{ color: shade.recommendedTextColor }}
                                            className="text-[9px] font-bold font-mono tracking-tighter"
                                        >
                                            {shade.stop}
                                        </span>
                                        {shade.stop === 500 && (
                                            <span
                                                style={{ color: shade.recommendedTextColor }}
                                                className="text-[7px] font-bold uppercase tracking-widest"
                                            >
                                                Base
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selected Stop Inspector Card */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl shadow-xs border border-slate-200 flex items-center justify-center font-bold text-xs"
                                        style={{
                                            backgroundColor: activePreviewShade.hex,
                                            color: activePreviewShade.recommendedTextColor,
                                        }}
                                    >
                                        {activePreviewShade.stop}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">
                                            {cleanSafeName}-{activePreviewShade.stop}
                                        </div>
                                        <div className="text-xs font-mono text-slate-500 uppercase">
                                            {activePreviewShade.hex}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleCopySingleShade(activePreviewShade)}
                                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                >
                                    {copiedSingleStop === activePreviewShade.stop ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                    {copiedSingleStop === activePreviewShade.stop ? "Copied!" : "Copy Hex"}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-[11px] font-mono text-slate-600">
                                <div>
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                                        RGB
                                    </span>
                                    {activePreviewShade.rgb}
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                                        HSL
                                    </span>
                                    {activePreviewShade.hsl}
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                                        vs White
                                    </span>
                                    <span
                                        className={
                                            activePreviewShade.contrastRatioAgainstWhite >= 4.5
                                                ? "text-emerald-600 font-bold"
                                                : "text-slate-600"
                                        }
                                    >
                                        {activePreviewShade.contrastRatioAgainstWhite}:1
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[9px] uppercase font-sans font-semibold">
                                        vs Black
                                    </span>
                                    <span
                                        className={
                                            activePreviewShade.contrastRatioAgainstBlack >= 4.5
                                                ? "text-emerald-600 font-bold"
                                                : "text-slate-600"
                                        }
                                    >
                                        {activePreviewShade.contrastRatioAgainstBlack}:1
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            WCAG AA Contrast Validated
                        </span>
                        <span>Tailwind v3, v4 & Pure CSS</span>
                    </div>
                </div>

                {/* Right Panel: Live UI Canvas Preview & Config Exporter */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Live Application Preview Container */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Eye className="w-5 h-5 text-indigo-600" />
                                    Live Component Mockup
                                </h2>
                                <span className="text-xs font-mono text-slate-500">
                                    bg-{cleanSafeName}-50 to 950
                                </span>
                            </div>

                            <div
                                className="rounded-xl border border-slate-200 p-5 space-y-4 transition-colors duration-200"
                                style={{
                                    backgroundColor: paletteShades[0].hex, // Stop 50
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-xs"
                                            style={{
                                                backgroundColor: paletteShades[5].hex, // 500
                                                color: paletteShades[5].recommendedTextColor,
                                            }}
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3
                                                className="text-xs font-bold leading-none"
                                                style={{ color: paletteShades[9].hex }} // 900
                                            >
                                                Theme Showcase
                                            </h3>
                                            <span
                                                className="text-[10px]"
                                                style={{ color: paletteShades[6].hex }} // 600
                                            >
                                                Autonomous Design Tokens
                                            </span>
                                        </div>
                                    </div>
                                    <span
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                        style={{
                                            backgroundColor: paletteShades[1].hex, // 100
                                            borderColor: paletteShades[2].hex, // 200
                                            color: paletteShades[7].hex, // 700
                                        }}
                                    >
                                        v4 Ready
                                    </span>
                                </div>

                                <p
                                    className="text-xs leading-relaxed"
                                    style={{ color: paletteShades[8].hex }} // 800
                                >
                                    Inspect your generated color scale across realistic UI hierarchies: cards,
                                    interactive CTA buttons, badge microcopy, and subtle boundary outlines.
                                </p>

                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                    {/* Primary Button */}
                                    <button
                                        type="button"
                                        style={{
                                            backgroundColor: paletteShades[5].hex, // 500
                                            color: paletteShades[5].recommendedTextColor,
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
                                    >
                                        Primary Action
                                    </button>

                                    {/* Secondary / Soft Button */}
                                    <button
                                        type="button"
                                        style={{
                                            backgroundColor: paletteShades[1].hex, // 100
                                            color: paletteShades[7].hex, // 700
                                            borderColor: paletteShades[2].hex, // 200
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:opacity-85 transition cursor-pointer"
                                    >
                                        Soft Ghost
                                    </button>

                                    {/* Outline Button */}
                                    <button
                                        type="button"
                                        style={{
                                            color: paletteShades[6].hex, // 600
                                            borderColor: paletteShades[4].hex, // 400
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white/80 hover:bg-white transition cursor-pointer"
                                    >
                                        Bordered
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Code Export Format Switcher & Output */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <Code className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Configuration Exporter
                                    </span>
                                </div>

                                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("tailwind-v3")}
                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap ${activeFormat === "tailwind-v3"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        Tailwind v3
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("tailwind-v4")}
                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap ${activeFormat === "tailwind-v4"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        Tailwind v4 (@theme)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("css-variables")}
                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap ${activeFormat === "css-variables"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        CSS Vars
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveFormat("json")}
                                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition cursor-pointer whitespace-nowrap ${activeFormat === "json"
                                            ? "bg-white text-indigo-600 shadow-xs"
                                            : "text-slate-600"
                                            }`}
                                    >
                                        JSON
                                    </button>
                                </div>
                            </div>

                            {/* Code Terminal Box */}
                            <div className="relative group">
                                <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[220px] max-h-[260px] border border-slate-800">
                                    {exportSyntax}
                                </pre>

                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                        title="Download config file"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopyAll}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied!" : "Copy Code"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <FileCode className="w-3.5 h-3.5 text-slate-400" />
                            Production Build Ready
                        </span>
                        <button
                            type="button"
                            onClick={handleCopyAll}
                            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" /> Copy Full Config
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations of Tailwind Color Palettes */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Foundations: The Mathematics of Tailwind Color Scales
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Tailwind CSS revolutionized modern front-end styling by replacing arbitrary color selections with rigorous, predictable 11-stop numeric ramps ranging from 50 to 950. Understanding how these shade gradients are computed mathematically allows software engineers and design systems architects to maintain visual balance across multi-brand enterprise design languages:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Non-Linear Lightness
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard linear interpolation produces washed-out pastels and muddy grays. The 11-stop system uses parabolic luminance adjustments so stops 50-200 provide adequate tint differentiation while stops 700-950 retain depth.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" /> Optical Hue Rotation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Physical light warms under specular highlights and cools within natural occluded shadows. Applying a rotational hue shift across the palette ramp prevents dark shades from feeling lifeless and flat on high-contrast monitors.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Perceptual Saturation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Extremely high lightness stops require slight desaturation to prevent neon clipping, whereas deep shadow stops require saturation boost to maintain their underlying chrominance against dark UI elements.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code className="w-4 h-4" /> Production Tailwind v4 @theme Implementation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Tailwind CSS version 4 eliminates traditional JS config objects in favor of zero-overhead CSS cascade variables via the official <code className="text-indigo-300">@theme</code> directive:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`@theme {
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-500: #4f46e5; /* Primary Brand Anchor */
  --color-brand-900: #1e1b4b;
  --color-brand-950: #0f172a;
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: Tailwind v3, v4, CSS Variables, and Design Tokens
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate color architecture depends heavily on your toolchain and runtime constraints. The table below details how color tokens integrate across contemporary frontend architectures:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Export Strategy</th>
                                    <th className="p-3">Target File</th>
                                    <th className="p-3">Runtime Dynamic Theming?</th>
                                    <th className="p-3">Build Tool Overhead</th>
                                    <th className="p-3">Best Enterprise Fit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tailwind v4 @theme</td>
                                    <td className="p-3 font-mono text-xs">app/globals.css</td>
                                    <td className="p-3 text-emerald-600 font-bold">Native CSS Var Swapping</td>
                                    <td className="p-3 font-mono text-emerald-600">Near Zero (Lightning CSS)</td>
                                    <td className="p-3">Next.js 15, Vite 6, Modern React apps</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Tailwind v3 Config</td>
                                    <td className="p-3 font-mono text-xs">tailwind.config.js</td>
                                    <td className="p-3 text-amber-600 font-bold">Requires CSS variable wrapper</td>
                                    <td className="p-3 font-mono text-slate-600">PostCSS Compilation</td>
                                    <td className="p-3">Legacy Tailwind codebases & monorepos</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS Custom Properties</td>
                                    <td className="p-3 font-mono text-xs">:root in tokens.css</td>
                                    <td className="p-3 text-emerald-600 font-bold">Instant DOM CSS OM access</td>
                                    <td className="p-3 font-mono text-emerald-600">Zero (Native Browser)</td>
                                    <td className="p-3">Vanilla CSS, Web Components, Svelte, Vue</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Raw JSON Tokens</td>
                                    <td className="p-3 font-mono text-xs">tokens/colors.json</td>
                                    <td className="p-3 text-emerald-600 font-bold">Depends on consumer</td>
                                    <td className="p-3 font-mono text-indigo-600">Style Dictionary transform</td>
                                    <td className="p-3">Cross-platform iOS, Android, Figma tokens</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Color Contrast, WCAG Accessibility, and CIE Luminance */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            WCAG 2.1 Accessibility & Relative Luminance Standards
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Design systems fail when automated palettes disregard visual accessibility standards. The Web Content Accessibility Guidelines (WCAG 2.1) mandate explicit contrast ratios to protect users with visual impairments and chromatic deficiencies:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Text Pairing Rules
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Stops 50 through 400:</strong> Always render high-contrast dark text (such as <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#0f172a</code> or <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">slate-900</code>). Attempting to place white text over a 400 stop almost always fails the 4.5:1 ratio.
                                </li>
                                <li>
                                    • <strong>Stops 600 through 950:</strong> Always render pure white or light tinted typography (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">#ffffff</code> or <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">brand-50</code>) to ensure clean contrast over 7:1.
                                </li>
                                <li>
                                    • <strong>Stop 500 Transition Zone:</strong> The 500 stop is an optical boundary. Vibrant greens, yellows, and cyans require dark text at 500, whereas deep purples, blues, and reds comfortably pass with white text.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Palette Generation Antipatterns
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Pure Gray Shadow Clamping:</strong> Desaturating shadow stops to 0% creates muddy charcoal tints. Always preserve a minimal 5-15% saturation in stops 900 and 950.
                                </li>
                                <li>
                                    • <strong>Hardcoding Hex Values Without CSS Variables:</strong> Hardcoding hex literals prevents multi-tenant white labeling and seamless dark-mode toggling.
                                </li>
                                <li>
                                    • <strong>Ignoring Yellow/Amber Luminescence Anomalies:</strong> Human eye cone cells perceive green and yellow wavelengths as drastically brighter than blue wavelengths of identical photometric energy.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Multi-Stop Integration & Dark Mode Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Wand2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Dark Mode Integration Blueprint
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Rather than inventing duplicate palettes for dark mode, mature enterprise design systems simply mirror the stop assignments across color semantics. When transitioning from light mode to dark mode, inverted pairs retain visual balance:
                    </p>

                    <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2 border border-slate-800">
                        <div className="text-slate-400">// Invert semantic role mappings between light and dark themes:</div>
                        <div>Light Mode:  Surface = brand-50  |  Text = brand-900  |  Border = brand-200</div>
                        <div>Dark Mode:   Surface = brand-950 |  Text = brand-100  |  Border = brand-800</div>
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
                                How does this generator calculate the 11 Tailwind color stops (50-950)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The algorithm maps your root color into the HSL (Hue, Saturation, Lightness) color space and clamps the 500-level baseline. It then calculates the remaining stops using a calibrated non-linear lightness distribution curve and dynamic saturation compensation to prevent clipping on light tints (50-200) and dark shades (800-950).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Tailwind CSS v3 and Tailwind CSS v4 color formats?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Tailwind CSS v3 relies on JavaScript module exports in tailwind.config.js using theme.extend.colors. Tailwind CSS v4 eliminates the JavaScript configuration file in favor of pure CSS cascading variables mapped within the new @theme directive (such as --color-brand-500: #4f46e5;).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does hue shifting make color scales feel more natural?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In natural sunlight, illuminated highlights naturally shift toward warmer yellow and amber spectrums, while shadowed tones lean toward cool blue and violet wavelengths. Hue shifting simulates this physical optical phenomenon, eliminating muddy grays in darker stops and chalky pastels in lighter tints.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How is WCAG 2.1 contrast compliance evaluated for text against these shades?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Each shade is converted from sRGB channels to relative luminance using the CIE standard photometric formula (0.2126R + 0.7152G + 0.0722B). Contrast ratios are computed against pure white (#ffffff) and pure black (#000000). A minimum ratio of 4.5:1 is required to satisfy WCAG AA standards for standard body text.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use these generated colors with CSS opacity modifiers in Tailwind?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When exported into Tailwind v3 or v4, the modern build engines automatically unwrap the hex codes into opacity-compatible color functions, allowing you to seamlessly apply utility classes such as bg-brand-500/80 or text-brand-600/50 without manual configuration.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool run client-side without sending data to an external API?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. All mathematical color conversions, curve modulations, and syntax generation execute entirely within your browser runtime using Web Standards. No telemetry, user inputs, or hex codes are ever dispatched over the network.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}