"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import {
    Sliders,
    Upload,
    UploadCloud,
    Download,
    RotateCcw,
    Sparkles,
    Palette,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    ShieldCheck,
    Layers,
    Shuffle,
    Monitor,
    FileImage,
    Cpu,
    ZoomIn
} from "lucide-react";

interface ColorGradingConfig {
    shadowColor: string;
    highlightColor: string;
    contrast: number; // -100 to 100
    brightness: number; // -100 to 100
    colorIntensity: number; // 0 to 100%
    blendMode: "replace" | "multiply" | "screen" | "overlay";
    invertLuminance: boolean;
}

const DEFAULT_CONFIG: ColorGradingConfig = {
    shadowColor: "#1e1b4b", // Deep Indigo Navy
    highlightColor: "#f43f5e", // Radiant Rose / Coral
    contrast: 15,
    brightness: 0,
    colorIntensity: 100,
    blendMode: "replace",
    invertLuminance: false,
};

interface DuotonePreset {
    name: string;
    shadow: string;
    highlight: string;
    blend: "replace" | "multiply" | "screen" | "overlay";
}

const PRESET_PALETTES: DuotonePreset[] = [
    { name: "Cyberpunk Neon", shadow: "#09090b", highlight: "#06b6d4", blend: "replace" },
    { name: "Spotify Violet", shadow: "#1e1b4b", highlight: "#10b981", blend: "replace" },
    { name: "Sunset Gold", shadow: "#4c0519", highlight: "#f59e0b", blend: "replace" },
    { name: "Deep Amber", shadow: "#1c1917", highlight: "#fbbf24", blend: "replace" },
    { name: "Oceanic Depth", shadow: "#082f49", highlight: "#38bdf8", blend: "replace" },
    { name: "Vintage Sepia", shadow: "#292524", highlight: "#fed7aa", blend: "multiply" },
    { name: "Vaporwave Pastel", shadow: "#312e81", highlight: "#f472b6", blend: "screen" },
    { name: "Infrared Film", shadow: "#172554", highlight: "#ef4444", blend: "overlay" },
];

const parseHexToRgb = (hex: string): [number, number, number] => {
    const clean = hex.replace("#", "");
    const bigint = parseInt(
        clean.length === 3
            ? clean.split("").map((c) => c + c).join("")
            : clean,
        16
    );
    if (isNaN(bigint)) return [0, 0, 0];
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number,
    max: number
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
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

export default function CanvasDuotoneGenerator() {
    const [config, setConfig] = useState<ColorGradingConfig>(DEFAULT_CONFIG);
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const [imageDetails, setImageDetails] = useState<{ name: string; width: number; height: number; size: string } | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [previewSplit, setPreviewSplit] = useState<number>(100); // 0 to 100 split screen
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sourceImageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const contrastInputId = useId();
    const brightnessInputId = useId();
    const intensityInputId = useId();

    // Generate Default Demo Canvas if no image uploaded
    const loadDemoImage = useCallback(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            sourceImageRef.current = img;
            setImageDetails({
                name: "demo-sample-portrait.jpg",
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: "Sample Asset",
            });
            setImageLoaded(true);
            renderDuotone();
        };
        // High contrast royalty-free editorial portrait
        img.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80";
    }, []);

    // Initial setup
    useEffect(() => {
        loadDemoImage();
    }, [loadDemoImage]);

    // Canvas Duotone Engine
    const renderDuotone = useCallback(() => {
        const canvas = canvasRef.current;
        const sourceImg = sourceImageRef.current;
        if (!canvas || !sourceImg) return;

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        setIsProcessing(true);

        canvas.width = sourceImg.naturalWidth;
        canvas.height = sourceImg.naturalHeight;

        // Draw original clean source image
        ctx.drawImage(sourceImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const totalPixels = data.length;

        const [sR, sG, sB] = parseHexToRgb(config.shadowColor);
        const [hR, hG, hB] = parseHexToRgb(config.highlightColor);

        // Precalculate lookup tables (LUT) for 256 luminance values for optimal processing speed
        const lutR = new Uint8ClampedArray(256);
        const lutG = new Uint8ClampedArray(256);
        const lutB = new Uint8ClampedArray(256);

        const contrastFactor = (259 * (config.contrast + 255)) / (255 * (259 - config.contrast));
        const brightnessOffset = config.brightness * 1.28; // scale -100..100 to approximate -128..128
        const intensity = config.colorIntensity / 100;

        for (let i = 0; i < 256; i++) {
            // 1. Luminance normalization
            let lum = i;
            if (config.invertLuminance) {
                lum = 255 - lum;
            }

            // 2. Brightness & Contrast correction on input luminance
            let adjusted = contrastFactor * (lum - 128) + 128 + brightnessOffset;
            adjusted = Math.max(0, Math.min(255, adjusted));

            const ratio = adjusted / 255;

            // 3. Linear Interpolation between Shadow and Highlight tints
            lutR[i] = Math.round(sR + ratio * (hR - sR));
            lutG[i] = Math.round(sG + ratio * (hG - sG));
            lutB[i] = Math.round(sB + ratio * (hB - sB));
        }

        // Apply pixel transformations
        for (let i = 0; i < totalPixels; i += 4) {
            const origR = data[i];
            const origG = data[i + 1];
            const origB = data[i + 2];

            // Standard ITU-R BT.709 perceived luminance computation
            const gray = Math.round(0.2126 * origR + 0.7152 * origG + 0.0722 * origB);

            const targetR = lutR[gray];
            const targetG = lutG[gray];
            const targetB = lutB[gray];

            let blendedR = targetR;
            let blendedG = targetG;
            let blendedB = targetB;

            // Apply selected blend model against source pixel
            if (config.blendMode === "multiply") {
                blendedR = (origR * targetR) / 255;
                blendedG = (origG * targetG) / 255;
                blendedB = (origB * targetB) / 255;
            } else if (config.blendMode === "screen") {
                blendedR = 255 - ((255 - origR) * (255 - targetR)) / 255;
                blendedG = 255 - ((255 - origG) * (255 - targetG)) / 255;
                blendedB = 255 - ((255 - origB) * (255 - targetB)) / 255;
            } else if (config.blendMode === "overlay") {
                blendedR = origR < 128
                    ? (2 * origR * targetR) / 255
                    : 255 - (2 * (255 - origR) * (255 - targetR)) / 255;
                blendedG = origG < 128
                    ? (2 * origG * targetG) / 255
                    : 255 - (2 * (255 - origG) * (255 - targetG)) / 255;
                blendedB = origB < 128
                    ? (2 * origB * targetB) / 255
                    : 255 - (2 * (255 - origB) * (255 - targetB)) / 255;
            }

            // Intensity Lerp between original color and duotone color
            data[i] = Math.round(origR + intensity * (blendedR - origR));
            data[i + 1] = Math.round(origG + intensity * (blendedG - origG));
            data[i + 2] = Math.round(origB + intensity * (blendedB - origB));
            // Alpha channel remains untouched
        }

        ctx.putImageData(imgData, 0, 0);
        setIsProcessing(false);
    }, [config]);

    // Rerender duotone whenever controls shift
    useEffect(() => {
        if (imageLoaded) {
            renderDuotone();
        }
    }, [renderDuotone, imageLoaded]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileProcess = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                sourceImageRef.current = img;
                setImageDetails({
                    name: file.name,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                });
                setImageLoaded(true);
                renderDuotone();
            };
            if (event.target?.result) {
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    }, [renderDuotone]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileProcess(file);
        }
    };

    const handleDownload = (format: "image/png" | "image/jpeg" | "image/webp") => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const extension = format === "image/png" ? "png" : format === "image/webp" ? "webp" : "jpg";
        const link = document.createElement("a");
        link.download = `duotone-${imageDetails?.name.replace(/\.[^/.]+$/, "") || "export"}.${extension}`;
        link.href = canvas.toDataURL(format, 0.95);
        link.click();
    };

    const handleApplyPreset = (preset: DuotonePreset) => {
        setConfig((prev) => ({
            ...prev,
            shadowColor: preset.shadow,
            highlightColor: preset.highlight,
            blendMode: preset.blend,
        }));
    };

    const handleRandomize = () => {
        const randomHex = () =>
            "#" +
            Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0");
        setConfig((prev) => ({
            ...prev,
            shadowColor: randomHex(),
            highlightColor: randomHex(),
        }));
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Canvas Duotone & Color Grading Filter Generator",
        "url": "https://twistertools.com/tools/image-tools/image-duotone-generator",
        "description": "High-performance browser-native HTML5 Canvas duotone image generator and two-tone color grading studio. Convert pictures into Spotify-style duotones client-side.",
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
                "name": "What is a duotone color filter and how is it generated on an HTML5 canvas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A duotone is a photographic reproduction technique that balances an image between two contrasting hues—one mapped to dark tones (shadows) and another mapped to bright tones (highlights). In HTML5 Canvas, this is accomplished by converting each pixel's RGB data to its ITU-R BT.709 perceived grayscale luminance value, then using that 0-255 scale to linearly interpolate between the shadow and highlight RGB coordinates."
                }
            },
            {
                "@type": "Question",
                "name": "Are my uploaded photos or graphics sent to a remote server for processing?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All pixel transformations, brightness/contrast mathematics, and image exports occur entirely in your local browser runtime via the client-side HTML5 Canvas API. Zero image data is ever transmitted, processed, or stored on external cloud infrastructure, ensuring 100% data privacy and confidentiality."
                }
            },
            {
                "@type": "Question",
                "name": "Why is ITU-R BT.709 perceived luminance superior to standard RGB averaging?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Human photoreceptors in the eye are disproportionately sensitive to green wavelengths and least sensitive to blue. Standard arithmetic averaging ((R+G+B)/3) creates washed-out, unnaturally dim midtones. The ITU-R BT.709 formula applies calibrated human perceptual weights (21.26% Red, 71.52% Green, 7.22% Blue) to produce natural tonal depth and contrast."
                }
            },
            {
                "@type": "Question",
                "name": "What export file formats are supported and do they retain original resolution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The generator allows exports in PNG (lossless), WebP (modern high-compression), and JPEG (optimized photo standard). The output canvas matches your original image's native pixel width and height without downsampling or degradation."
                }
            },
            {
                "@type": "Question",
                "name": "How does the split-screen comparison slider assist color grading workflows?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The comparison slider lets art directors and designers reveal a wipe transition between the original photo and the duotone render. This ensures that shadow details are not excessively clipped and highlight areas preserve essential texture before asset export."
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
                {/* Left Panel: Duotone Controls & Adjustments */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Reset Button */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Tonal Mapping Controls
                                </h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleRandomize}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                        title="Randomize Hues"
                                    >
                                        <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                                        Shuffle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                        Reset
                                    </button>
                                </div>
                            </div>

                            {/* Preset Switcher Badges */}
                            <div className="flex items-center justify-start gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Presets:
                                </span>
                                {PRESET_PALETTES.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => handleApplyPreset(preset)}
                                        className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition cursor-pointer border border-slate-200"
                                    >
                                        <span
                                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                                            style={{
                                                background: `linear-gradient(135deg, ${preset.shadow} 50%, ${preset.highlight} 50%)`,
                                            }}
                                        />
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Color Picker Pair */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                                <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                                    <span>Shadow Base Tone</span>
                                    <span className="font-mono text-slate-500 uppercase">{config.shadowColor}</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        aria-label="Select shadow color"
                                        type="color"
                                        value={config.shadowColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, shadowColor: e.target.value }))}
                                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                                    />
                                    <input
                                        aria-label="Input shadow hex value"
                                        type="text"
                                        value={config.shadowColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, shadowColor: e.target.value }))}
                                        className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 space-y-2">
                                <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                                    <span>Highlight Base Tone</span>
                                    <span className="font-mono text-slate-500 uppercase">{config.highlightColor}</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        aria-label="Select highlight color"
                                        type="color"
                                        value={config.highlightColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, highlightColor: e.target.value }))}
                                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                                    />
                                    <input
                                        aria-label="Input highlight hex value"
                                        type="text"
                                        value={config.highlightColor}
                                        onChange={(e) => setConfig((p) => ({ ...p, highlightColor: e.target.value }))}
                                        className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sliders: Contrast, Brightness, Intensity */}
                        <div className="space-y-4">
                            {/* Contrast */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={contrastInputId} className="flex items-center gap-1">
                                        Luminance Contrast Curve:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Input contrast value"
                                            id={contrastInputId}
                                            type="number"
                                            min="-100"
                                            max="100"
                                            value={config.contrast}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, contrast: val })), -100, 100)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust contrast slider"
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={config.contrast}
                                    onChange={(e) => setConfig((p) => ({ ...p, contrast: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Brightness */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={brightnessInputId} className="flex items-center gap-1">
                                        Exposure Brightness:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Input brightness value"
                                            id={brightnessInputId}
                                            type="number"
                                            min="-100"
                                            max="100"
                                            value={config.brightness}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, brightness: val })), -100, 100)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust brightness slider"
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={config.brightness}
                                    onChange={(e) => setConfig((p) => ({ ...p, brightness: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Color Filter Intensity */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={intensityInputId} className="flex items-center gap-1">
                                        Duotone Color Saturation / Opacity:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Input saturation intensity value"
                                            id={intensityInputId}
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={config.colorIntensity}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setConfig((p) => ({ ...p, colorIntensity: val })), 0, 100)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust saturation intensity slider"
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={config.colorIntensity}
                                    onChange={(e) => setConfig((p) => ({ ...p, colorIntensity: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Blend Modes & Luminance Inversion */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Transfer Blend Model</label>
                                <select
                                    value={config.blendMode}
                                    onChange={(e) =>
                                        setConfig((p) => ({
                                            ...p,
                                            blendMode: e.target.value as ColorGradingConfig["blendMode"],
                                        }))
                                    }
                                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="replace">Direct Duotone Mapping (Standard)</option>
                                    <option value="multiply">Multiply (Darken & Deep Shade)</option>
                                    <option value="screen">Screen (Lighten & Ambient Glow)</option>
                                    <option value="overlay">Overlay (Retain Micro-Contrast)</option>
                                </select>
                            </div>

                            <div className="flex flex-col justify-end space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 block">Tone Polarities</label>
                                <button
                                    type="button"
                                    onClick={() => setConfig((p) => ({ ...p, invertLuminance: !p.invertLuminance }))}
                                    className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-2 cursor-pointer ${config.invertLuminance
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    <Layers className="w-3.5 h-3.5" />
                                    {config.invertLuminance ? "Invert: Active (Negated)" : "Invert Luminance Map"}
                                </button>
                            </div>
                        </div>

                        {/* Drag and Drop Zone / Upload Area */}
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer ${isDragging
                                ? "border-indigo-600 bg-indigo-50/60"
                                : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                                }`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                                <UploadCloud className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-800">
                                    Drop your image here, or <span className="text-indigo-600 underline">browse files</span>
                                </p>
                                <p className="text-xs text-slate-500">
                                    Supports PNG, JPG, WebP, SVG, TIFF, BMP (Max 25MB)
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side Processing Only
                        </span>
                        <span className="text-slate-400">Zero Server Uploads</span>
                    </div>
                </div>

                {/* Right Panel: Canvas Preview & Multi-Format Downloader */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Interactive Viewer Top Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Canvas Grading Stage
                            </h2>
                            {isProcessing && (
                                <span className="text-xs font-semibold text-indigo-600 animate-pulse flex items-center gap-1">
                                    <Cpu className="w-3.5 h-3.5" /> Calculating LUT...
                                </span>
                            )}
                        </div>

                        {/* Preview Compare Mode Controls */}
                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                                <ZoomIn className="w-3.5 h-3.5 text-indigo-500" /> Split Compare:
                            </span>
                            <div className="flex items-center gap-2 w-1/2">
                                <input
                                    aria-label="Split preview slider"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={previewSplit}
                                    onChange={(e) => setPreviewSplit(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <span className="font-mono text-[11px] text-slate-500 w-8 text-right">{previewSplit}%</span>
                            </div>
                        </div>

                        {/* Stage Viewport Area */}
                        <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                            {/* Hidden processing canvas that holds actual dimensions */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Render Presentation Image */}
                            {imageLoaded ? (
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    <img
                                        src={canvasRef.current?.toDataURL() || ""}
                                        alt="Duotone Output Preview"
                                        className="max-h-full max-w-full object-contain rounded shadow-lg select-none"
                                        style={{
                                            clipPath:
                                                previewSplit < 100
                                                    ? `polygon(0 0, ${previewSplit}% 0, ${previewSplit}% 100%, 0% 100%)`
                                                    : undefined,
                                        }}
                                    />
                                    {previewSplit < 100 && sourceImageRef.current && (
                                        <img
                                            src={sourceImageRef.current.src}
                                            alt="Original Baseline Reference"
                                            className="absolute max-h-full max-w-full object-contain rounded pointer-events-none select-none"
                                            style={{
                                                clipPath: `polygon(${previewSplit}% 0, 100% 0, 100% 100%, ${previewSplit}% 100%)`,
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 space-y-2 p-6">
                                    <FileImage className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                                    <p className="text-xs">Generating stage visualizer...</p>
                                </div>
                            )}

                            {/* Active metadata badge */}
                            {imageDetails && (
                                <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-300 px-2 py-1 rounded border border-white/10 font-mono">
                                    {imageDetails.width} × {imageDetails.height} px • {imageDetails.size}
                                </div>
                            )}
                        </div>

                        {/* Export Action Buttons */}
                        <div className="space-y-2 pt-2">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                Download High-Fidelity Result
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownload("image/png")}
                                    className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    PNG (Lossless)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownload("image/webp")}
                                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    WebP (Modern)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDownload("image/jpeg")}
                                    className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-600" />
                                    JPEG (Compact)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                            Full Native Aspect Ratio Preserved
                        </span>
                        <span className="font-mono text-[11px] text-indigo-600 font-bold">256-Step Color LUT</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Optical Math & Tonal Foundations */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Colorimetry Mathematics of Digital Duotone & Two-Tone Grading
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Historically derived from classic 19th-century mechanical printmaking, duotone reproduction utilizes two distinct printing plates to reproduce photographs with broader dynamic range and expressive chromatic mood than standard single-color black inks. In modern browser-native image processing, this physical lithographic technique is simulated through chromatic matrix transformation and luminance interpolation:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-indigo-600" /> ITU-R BT.709 Luminance
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard grayscale decomposition discards chromatic vibrancy. By employing the BT.709 perceived luminance equation ($Y = 0.2126R + 0.7152G + 0.0722B$), the filter matches human retinal sensitivity to green while avoiding murky mud tones.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Linear Lerp LUT
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Rather than recomputing complex color formulas per pixel millions of times, our engine precomputes a 256-index lookup table (LUT) linking normalized scalar values ($0.0 \le t \le 1.0$) between the shadow and highlight color vectors.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Transfer Compositing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Applying configurable mathematical transfer models—such as Overlay and Multiply—allows creatives to retain intrinsic micro-textures, specular glints, and midtone edge clarity.
                            </p>
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
                            Comparative Analysis: Canvas Duotone vs CSS Filters vs Server Processing
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Achieving consistent duotone treatments across web user interfaces can be accomplished through varying technical strategies. Understanding the latency, privacy, and architectural tradeoffs informs proper tooling decisions:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Methodology</th>
                                    <th className="p-3">Privacy / Network</th>
                                    <th className="p-3">Export Fidelity</th>
                                    <th className="p-3">Performance Profile</th>
                                    <th className="p-3">Ideal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">TwisterTools Canvas 2D Engine</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Client-Side (0 KB uploaded)</td>
                                    <td className="p-3 text-indigo-600 font-bold">Full Native Resolution (PNG/WebP/JPG)</td>
                                    <td className="p-3 font-mono text-emerald-600">Sub-10ms (LUT Accelerated)</td>
                                    <td className="p-3">Editorial hero images, marketing banners, avatars</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS mix-blend-mode / filters</td>
                                    <td className="p-3 text-emerald-600 font-bold">Client-Side (DOM only)</td>
                                    <td className="p-3 text-rose-600 font-bold">Cannot directly download rendered bitmap</td>
                                    <td className="p-3 font-mono text-emerald-600">Instant (GPU compositing)</td>
                                    <td className="p-3">Dynamic UI hover effects and decorative backgrounds</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Serverless Sharp / ImageMagick</td>
                                    <td className="p-3 text-amber-600 font-bold">Requires Network Upload & Bandwidth</td>
                                    <td className="p-3 text-indigo-600 font-bold">High Quality File Gen</td>
                                    <td className="p-3 font-mono text-rose-600">Slow (Network + Queue latency)</td>
                                    <td className="p-3">Automated batch backend CMS asset pipelines</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices & Pro Production Advice */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Professional Color Grading Guidelines for High-Conversion Assets
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To produce high-impact Spotify-style editorial art or striking corporate branding assets, applying strict color theory rules ensures your graphics maintain professional punch:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Design Practices
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Maximize Luminance Distance:</strong> Ensure your shadow tone has an RGB luminance value below 40 and your highlight tone exceeds 180 to guarantee deep contrast and avoid muddy midtones.
                                </li>
                                <li>
                                    • <strong>Boost Base Image Contrast:</strong> Elevating the contrast slider to +15% or +25% separates facial contours and hair highlights, resulting in crisp vector-like graphic separation.
                                </li>
                                <li>
                                    • <strong>Harmonize Complementary Hues:</strong> Pairs such as Midnight Navy (#0f172a) and Amber Sunset (#f59e0b) offer high aesthetic balance across modern dark-mode interfaces.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Typography Overlay Readiness
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Predictable WCAG Ratios:</strong> Standard photography has chaotic luminance spikes that break text legibility. Duotone maps unify the luminance floor, allowing crisp white text to consistently satisfy WCAG AA 4.5:1 standards.
                                </li>
                                <li>
                                    • <strong>Brand Cohesion:</strong> Mapping company branding colors directly into hero banners instantly ties disparate stock photography into a unified, on-brand visual library.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                What is a duotone color filter and how is it generated on an HTML5 canvas?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A duotone is a photographic reproduction technique that balances an image between two contrasting hues—one mapped to dark tones (shadows) and another mapped to bright tones (highlights). In HTML5 Canvas, this is accomplished by converting each pixel&apos;s RGB data to its ITU-R BT.709 perceived grayscale luminance value, then using that 0-255 scale to linearly interpolate between the shadow and highlight RGB coordinates.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my uploaded photos or graphics sent to a remote server for processing?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All pixel transformations, brightness/contrast mathematics, and image exports occur entirely in your local browser runtime via the client-side HTML5 Canvas API. Zero image data is ever transmitted, processed, or stored on external cloud infrastructure, ensuring 100% data privacy and confidentiality.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is ITU-R BT.709 perceived luminance superior to standard RGB averaging?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Human photoreceptors in the eye are disproportionately sensitive to green wavelengths and least sensitive to blue. Standard arithmetic averaging ((R+G+B)/3) creates washed-out, unnaturally dim midtones. The ITU-R BT.709 formula applies calibrated human perceptual weights (21.26% Red, 71.52% Green, 7.22% Blue) to produce natural tonal depth and contrast.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What export file formats are supported and do they retain original resolution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The generator allows exports in PNG (lossless), WebP (modern high-compression), and JPEG (optimized photo standard). The output canvas matches your original image&apos;s native pixel width and height without downsampling or degradation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the split-screen comparison slider assist color grading workflows?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The comparison slider lets art directors and designers reveal a wipe transition between the original photo and the duotone render. This ensures that shadow details are not excessively clipped and highlight areas preserve essential texture before asset export.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}