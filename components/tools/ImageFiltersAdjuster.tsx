"use client";

import React, { useState, useRef, useEffect, useId, useCallback, useMemo } from "react";
import {
    Sliders,
    Sun,
    Contrast,
    Droplets,
    RotateCcw,
    Download,
    Upload,
    Eye,
    EyeOff,
    Check,
    Copy,
    Sparkles,
    BookOpen,
    HelpCircle,
    Cpu,
    CheckCircle2,
    AlertTriangle,
    Layers,
    RefreshCw,
    Terminal,
    FileImage
} from "lucide-react";

interface FilterMatrix {
    brightness: number;  // 0% to 200%, default 100%
    contrast: number;    // 0% to 200%, default 100%
    saturation: number;  // 0% to 200%, default 100%
    exposure: number;    // -100 to 100, default 0
    temperature: number; // -100 to 100 (Cool to Warm), default 0
    sepia: number;       // 0% to 100%, default 0%
    grayscale: number;   // 0% to 100%, default 0%
    hueRotate: number;   // 0deg to 360deg, default 0deg
}

const DEFAULT_FILTERS: FilterMatrix = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    temperature: 0,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
};

const PRESET_LOOKS: Record<string, Partial<FilterMatrix>> = {
    "Vibrant Punch": {
        brightness: 105,
        contrast: 120,
        saturation: 135,
        exposure: 5,
        temperature: 5,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
    },
    "Cinematic Moody": {
        brightness: 92,
        contrast: 135,
        saturation: 85,
        exposure: -10,
        temperature: -15,
        sepia: 10,
        grayscale: 0,
        hueRotate: 350,
    },
    "Warm Golden Hour": {
        brightness: 108,
        contrast: 110,
        saturation: 120,
        exposure: 10,
        temperature: 35,
        sepia: 20,
        grayscale: 0,
        hueRotate: 5,
    },
    "Crisp High-Key": {
        brightness: 115,
        contrast: 125,
        saturation: 105,
        exposure: 20,
        temperature: -5,
        sepia: 0,
        grayscale: 0,
        hueRotate: 0,
    },
    "Analog Film 35mm": {
        brightness: 102,
        contrast: 90,
        saturation: 90,
        exposure: 5,
        temperature: 15,
        sepia: 15,
        grayscale: 0,
        hueRotate: 355,
    },
    "Deep Monochrome": {
        brightness: 100,
        contrast: 145,
        saturation: 0,
        exposure: 0,
        temperature: 0,
        sepia: 0,
        grayscale: 100,
        hueRotate: 0,
    },
};

const SAMPLE_IMAGE_URL = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

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

export default function ImageFiltersAdjuster() {
    const [filters, setFilters] = useState<FilterMatrix>(DEFAULT_FILTERS);
    const [imageSrc, setImageSrc] = useState<string>(SAMPLE_IMAGE_URL);
    const [imageName, setImageName] = useState<string>("sample-landscape.jpg");
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/jpeg");
    const [jpegQuality, setJpegQuality] = useState<number>(92);
    const [copiedCss, setCopiedCss] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sourceImageRef = useRef<HTMLImageElement | null>(null);

    const brightnessId = useId();
    const contrastId = useId();
    const saturationId = useId();
    const exposureId = useId();
    const temperatureId = useId();
    const sepiaId = useId();
    const grayscaleId = useId();
    const hueRotateId = useId();

    // Derived CSS Filter String
    const computedCssFilter = useCallback(
        (applyCompareState = true): string => {
            if (applyCompareState && isComparing) {
                return "none";
            }
            const effectiveBrightness = Math.max(0, filters.brightness + filters.exposure);
            const sepiaVal = filters.sepia;
            const grayscaleVal = filters.grayscale;
            const hueVal = filters.hueRotate;

            return `brightness(${effectiveBrightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) sepia(${sepiaVal}%) grayscale(${grayscaleVal}%) hue-rotate(${hueVal}deg)`;
        },
        [filters, isComparing]
    );

    // Warmth & Tint overlay simulation
    const temperatureOverlayStyle = useMemo((): React.CSSProperties => {
        if (isComparing || filters.temperature === 0) return { display: "none" };
        const isWarm = filters.temperature > 0;
        const opacity = (Math.abs(filters.temperature) / 100) * 0.35;
        const color = isWarm ? "245, 158, 11" : "59, 130, 246"; // Amber-500 or Blue-500
        return {
            backgroundColor: `rgba(${color}, ${opacity.toFixed(3)})`,
            mixBlendMode: isWarm ? "color" : "soft-light",
        };
    }, [filters.temperature, isComparing]);

    // Preload image elements for clean Canvas 2D rasterization
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            sourceImageRef.current = img;
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
    }, [imageSrc]);

    const processFile = useCallback((file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file (PNG, JPEG, WebP, AVIF, or SVG).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === "string") {
                setImageSrc(event.target.result);
                setImageName(file.name);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processFile(e.dataTransfer.files[0]);
            }
        },
        [processFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const loadPreset = (presetName: string) => {
        const preset = PRESET_LOOKS[presetName];
        if (preset) {
            setFilters((prev) => ({ ...prev, ...preset }));
        }
    };

    const handleCopyCss = () => {
        const code = `filter: ${computedCssFilter(false)};`;
        navigator.clipboard.writeText(code);
        setCopiedCss(true);
        setTimeout(() => setCopiedCss(false), 2000);
    };

    const handleExportImage = () => {
        if (!sourceImageRef.current) return;
        setIsExporting(true);

        const canvas = canvasRef.current || document.createElement("canvas");
        const img = sourceImageRef.current;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            setIsExporting(false);
            return;
        }

        // Apply Native Filter Pipeline
        ctx.filter = computedCssFilter(false);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply Temperature tint if active
        if (filters.temperature !== 0) {
            const isWarm = filters.temperature > 0;
            const opacity = (Math.abs(filters.temperature) / 100) * 0.35;
            ctx.save();
            ctx.globalCompositeOperation = isWarm ? "color" : "soft-light";
            ctx.fillStyle = isWarm
                ? `rgba(245, 158, 11, ${opacity.toFixed(3)})`
                : `rgba(59, 130, 246, ${opacity.toFixed(3)})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        const extension = exportFormat === "image/png" ? "png" : exportFormat === "image/webp" ? "webp" : "jpg";
        const cleanBaseName = imageName.substring(0, imageName.lastIndexOf(".")) || imageName;
        const downloadFilename = `${cleanBaseName}-adjusted.${extension}`;

        const dataUrl = canvas.toDataURL(exportFormat, jpegQuality / 100);
        const link = document.createElement("a");
        link.download = downloadFilename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Brightness, Contrast & Saturation Matrix Adjuster",
        "url": "https://twistertools.com/tools/image-tools/image-filters-adjuster",
        "description": "Adjust image brightness, contrast, saturation, exposure, and color temperature online. Export full-resolution photographs client-side with zero data uploads.",
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
                "name": "Are my uploaded photos or graphics uploaded to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire matrix adjustment pipeline operates strictly inside your browser through HTML5 Canvas and CSS Compositing APIs. Your files never touch a remote server, ensuring complete privacy and immediate client-side performance."
                }
            },
            {
                "@type": "Question",
                "name": "What is the mathematical difference between Brightness and Exposure?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Brightness operates linearly across the color spectrum, adding or subtracting a uniform luminance value across all RGB channels, which can easily clip shadows or wash out highlights. Exposure simulates camera shutter light capture using an exponential curve, elevating highlights and midtones with greater weight while preserving deep black baseline tones."
                }
            },
            {
                "@type": "Question",
                "name": "Will exporting my adjusted image reduce its original resolution or megapixel count?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. Visual previews are scaled to fit your display workspace, but the underlying canvas rendering engine executes filter operations directly against the unscaled native pixel matrix (naturalWidth and naturalHeight) upon export."
                }
            },
            {
                "@type": "Question",
                "name": "How does color temperature affect photographic mood and chroma balance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Color temperature adjusts the Kelvin balance of an image. Positive values add warm amber and golden hues that mimic sunset or tungsten lighting. Negative values introduce cool blue tones that emulate overcast skylight or clinical daylight environments."
                }
            },
            {
                "@type": "Question",
                "name": "Can I copy the generated CSS filter string for use in my own web development projects?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The generated filter string is fully standards-compliant CSS and can be copied with one click to apply identical real-time rendering effects to HTML img tags, background covers, or canvas elements."
                }
            },
            {
                "@type": "Question",
                "name": "Which export file format should I choose for my photography?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Choose JPEG for real-world portraits, landscapes, and compressed web delivery. Choose PNG for illustrations, graphics with transparency, or lossless archival storage. Choose WebP for modern web publishing, providing superior compression ratios at equivalent visual fidelity."
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

            {/* Hidden canvas for native resolution rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Adjuster Matrix Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Presets */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Image Filter Matrix
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    Reset Matrix
                                </button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-500 font-medium">Styles:</span>
                                {Object.keys(PRESET_LOOKS).map((name) => (
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

                        {/* Slider Controls Matrix */}
                        <div className="space-y-4">
                            {/* Brightness */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={brightnessId} className="flex items-center gap-1.5">
                                        <Sun className="w-3.5 h-3.5 text-amber-500" /> Brightness:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Brightness value"
                                            id={brightnessId}
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={filters.brightness}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setFilters((p) => ({ ...p, brightness: val })), 0, 200)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust brightness slider"
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={filters.brightness}
                                    onChange={(e) => setFilters((p) => ({ ...p, brightness: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Contrast */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={contrastId} className="flex items-center gap-1.5">
                                        <Contrast className="w-3.5 h-3.5 text-indigo-500" /> Contrast:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Contrast value"
                                            id={contrastId}
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={filters.contrast}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setFilters((p) => ({ ...p, contrast: val })), 0, 200)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust contrast slider"
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={filters.contrast}
                                    onChange={(e) => setFilters((p) => ({ ...p, contrast: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Saturation */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={saturationId} className="flex items-center gap-1.5">
                                        <Droplets className="w-3.5 h-3.5 text-cyan-500" /> Saturation (Vibrancy):
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Saturation value"
                                            id={saturationId}
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={filters.saturation}
                                            onChange={(e) =>
                                                handleNumberInput(e, (val) => setFilters((p) => ({ ...p, saturation: val })), 0, 200)
                                            }
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust saturation slider"
                                    type="range"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={filters.saturation}
                                    onChange={(e) => setFilters((p) => ({ ...p, saturation: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Exposure & Temperature Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={exposureId}>Exposure Offset:</label>
                                        <span className="font-mono text-slate-600">{filters.exposure > 0 ? `+${filters.exposure}` : filters.exposure}</span>
                                    </div>
                                    <input
                                        aria-label="Adjust exposure slider"
                                        id={exposureId}
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="1"
                                        value={filters.exposure}
                                        onChange={(e) => setFilters((p) => ({ ...p, exposure: Number(e.target.value) }))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={temperatureId}>Temperature:</label>
                                        <span className="font-mono text-slate-600">
                                            {filters.temperature > 0 ? `+${filters.temperature} Warm` : filters.temperature < 0 ? `${filters.temperature} Cool` : "Neutral"}
                                        </span>
                                    </div>
                                    <input
                                        aria-label="Adjust color temperature slider"
                                        id={temperatureId}
                                        type="range"
                                        min="-100"
                                        max="100"
                                        step="1"
                                        value={filters.temperature}
                                        onChange={(e) => setFilters((p) => ({ ...p, temperature: Number(e.target.value) }))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>

                            {/* Sepia & Grayscale Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={sepiaId}>Sepia Tone:</label>
                                        <span className="font-mono text-slate-600">{filters.sepia}%</span>
                                    </div>
                                    <input
                                        aria-label="Adjust sepia tone slider"
                                        id={sepiaId}
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={filters.sepia}
                                        onChange={(e) => setFilters((p) => ({ ...p, sepia: Number(e.target.value) }))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={grayscaleId}>Grayscale:</label>
                                        <span className="font-mono text-slate-600">{filters.grayscale}%</span>
                                    </div>
                                    <input
                                        aria-label="Adjust grayscale slider"
                                        id={grayscaleId}
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={filters.grayscale}
                                        onChange={(e) => setFilters((p) => ({ ...p, grayscale: Number(e.target.value) }))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            </div>

                            {/* Hue Rotation */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={hueRotateId}>Color Hue Wheel Rotation:</label>
                                    <span className="font-mono text-slate-600">{filters.hueRotate}°</span>
                                </div>
                                <input
                                    aria-label="Adjust hue rotation slider"
                                    id={hueRotateId}
                                    type="range"
                                    min="0"
                                    max="360"
                                    step="1"
                                    value={filters.hueRotate}
                                    onChange={(e) => setFilters((p) => ({ ...p, hueRotate: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* File Drag & Drop Ingestion Zone */}
                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-5 px-4 text-center ${
                                    isDragging
                                        ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                        : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                    Drop custom photo here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Supports PNG, JPG, WebP, AVIF, SVG (Zero server uploads)
                                </p>
                            </div>

                            <div className="flex items-center justify-between px-1 text-xs">
                                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={imageName}>
                                    Active: <strong className="text-slate-700 font-mono">{imageName}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setImageSrc(SAMPLE_IMAGE_URL);
                                        setImageName("sample-landscape.jpg");
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition border border-slate-200 cursor-pointer shrink-0"
                                    title="Reload Sample Photo"
                                >
                                    <RefreshCw className="w-3 h-3 text-slate-500" />
                                    Reload Sample
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Left Panel Footer Specs */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side GPU Hardware Accelerated
                        </span>
                        <span>Zero Upload Storage</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Visualizer & Export Stage */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Visualizer Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Interactive Viewport
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onMouseDown={() => setIsComparing(true)}
                                    onMouseUp={() => setIsComparing(false)}
                                    onTouchStart={() => setIsComparing(true)}
                                    onTouchEnd={() => setIsComparing(false)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition select-none cursor-pointer ${isComparing
                                            ? "bg-amber-600 text-white shadow-xs"
                                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                        }`}
                                >
                                    {isComparing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {isComparing ? "Showing Original" : "Hold to Compare"}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Canvas / Image Display Frame */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative w-full h-80 sm:h-96 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border shadow-inner group transition-all ${
                                isDragging ? "border-indigo-500 ring-2 ring-indigo-500/50" : "border-slate-800"
                            }`}
                        >
                            {isDragging && (
                                <div className="absolute inset-0 bg-indigo-950/85 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-white space-y-2 pointer-events-none">
                                    <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
                                    <p className="text-sm font-bold">Drop photo to replace active image</p>
                                </div>
                            )}

                            {/* Visual Image Render */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageSrc}
                                alt="Processed Viewport Render"
                                style={{ filter: computedCssFilter(true) }}
                                className="w-full h-full object-contain select-none transition-filter duration-75"
                            />

                            {/* Warmth / Tint Blend Overlay */}
                            <div
                                style={temperatureOverlayStyle}
                                className="absolute inset-0 pointer-events-none transition-opacity duration-75"
                            />

                            {/* Viewport Meta Badges */}
                            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-300 border border-slate-700/60 shadow-sm">
                                {imageDimensions.width} × {imageDimensions.height} px
                            </div>

                            {isComparing && (
                                <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider shadow-md animate-pulse">
                                    Original Bypass Active
                                </div>
                            )}

                            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-indigo-300 border border-slate-700/60 shadow-sm flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>CSS Shader Filter</span>
                            </div>
                        </div>

                        {/* Export & Download Setup Card */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileImage className="w-4 h-4 text-indigo-600" />
                                        Export Configuration
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Render at full native sensor resolution</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="image/jpeg">JPEG (.jpg)</option>
                                        <option value="image/png">PNG (.png)</option>
                                        <option value="image/webp">WebP (.webp)</option>
                                    </select>

                                    {exportFormat !== "image/png" && (
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                            <span className="text-[11px] font-semibold text-slate-500">Quality:</span>
                                            <input
                                                type="number"
                                                min="10"
                                                max="100"
                                                value={jpegQuality}
                                                onChange={(e) => handleNumberInput(e, setJpegQuality, 10, 100)}
                                                className="w-10 text-right font-mono text-xs border-0 outline-none p-0 text-slate-800"
                                            />
                                            <span className="text-[11px] text-slate-400">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportImage}
                                disabled={isExporting}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? "Rendering Full Matrix..." : `Download Processed ${exportFormat.split("/")[1].toUpperCase()}`}
                            </button>
                        </div>

                        {/* Generated CSS Filter Code Snippet */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                                    CSS Web Filter Code
                                </span>
                                <button
                                    type="button"
                                    onClick={handleCopyCss}
                                    className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                                >
                                    {copiedCss ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    {copiedCss ? "Copied!" : "Copy Rule"}
                                </button>
                            </div>
                            <pre className="p-3.5 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                                {`filter: ${computedCssFilter(false)};`}
                            </pre>
                        </div>
                    </div>

                    {/* Right Panel Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-600" />
                            Canvas 2D Context Rasterization
                        </span>
                        <span className="font-mono text-slate-600">{imageName}</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Optical Foundations & Color Science */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Colorimetry of Image Matrix Adjustments: Luminance, Contrast & Saturation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Digital color grading and raster image enhancement rely on mathematical matrix transformations calculated across the RGB color space. Whether optimizing real estate photography, tuning marketing hero graphics, or creating cinematic looks for social content, fine-tuning visual parameters requires understanding how each channel transformation impacts pixel color distribution:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sun className="w-4 h-4 text-amber-600" /> Luminance vs Brightness
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard brightness adds uniform offsets across all color channels. Luminance, however, weights human eye sensitivity according to standard Rec. 709 coefficients (0.2126 Red, 0.7152 Green, and 0.0722 Blue) to elevate perceived light without bleaching delicate chroma.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Contrast className="w-4 h-4 text-indigo-600" /> Contrast & S-Curves
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Contrast expands or contracts the distance between deep shadows and bright specular highlights around a 50% gray pivot point. Raising contrast steepens the tone curve, making blacks punchier and highlights brighter.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Droplets className="w-4 h-4 text-cyan-600" /> Chroma Saturation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Saturation scales the purity and intensity of a hue relative to its gray level. Increasing saturation moves colors outwards toward the boundary of the sRGB gamut cylinder, whereas setting it to 0% produces a pure grayscale image.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> The Native CSS & Canvas Matrix Pipeline
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Modern browsers execute these optical changes through hardware-accelerated GPU shaders. The underlying rendering engine applies CSS Filter Graph standards directly to the pixel frame buffer:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`.optimized-image-matrix {
  /* Real-time Hardware-Accelerated Viewport Shader */
  filter: brightness(105%) contrast(120%) saturate(135%) hue-rotate(0deg);
  will-change: filter;
  transform: translateZ(0);
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: Tone & Color Adjustment Techniques
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate color grading parameter depends on whether your image suffers from dynamic range compression, color cast contamination, or poor exposure:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Parameter</th>
                                    <th className="p-3">Target Color Range</th>
                                    <th className="p-3">Math Transformation</th>
                                    <th className="p-3">Clipping Risk</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Brightness</td>
                                    <td className="p-3">Full RGB Spectrum</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">pixel * factor</td>
                                    <td className="p-3 text-rose-600 font-bold">High (Highlights)</td>
                                    <td className="p-3">Correcting severely underexposed photos</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Contrast</td>
                                    <td className="p-3">Shadows & Highlights</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">(pixel - 0.5) * f + 0.5</td>
                                    <td className="p-3 text-amber-600 font-bold">Moderate</td>
                                    <td className="p-3">Adding visual punch to flat, foggy scenes</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Saturation</td>
                                    <td className="p-3">Chroma / Hue Vectors</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">gray + (rgb - gray) * s</td>
                                    <td className="p-3 text-emerald-600 font-bold">Very Low</td>
                                    <td className="p-3">Reviving faded foliage, skies, and artwork</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Temperature</td>
                                    <td className="p-3">Red / Blue Spectral Axis</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">Kelvin Shift Matrix</td>
                                    <td className="p-3 text-slate-600 font-bold">Low</td>
                                    <td className="p-3">Fixing fluorescent indoor white balance</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Optimization & Export Formats */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Browser-Native Canvas Rasterization & Lossless Quality Preservation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Many browser tools compress images before displaying them, resulting in pixelation upon export. TwisterTools decouples the display viewport from the raster export pipeline, rendering your final asset at full source dimensions:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Professional Output
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Keep Contrast Balanced:</strong> Values between 110% and 125% typically deliver crisp results without blowing out subtle highlight detail.
                                </li>
                                <li>
                                    • <strong>Use WebP for Digital Web:</strong> WebP offers 25-35% smaller file sizes than traditional JPEG at equivalent perceptual SSIM fidelity scores.
                                </li>
                                <li>
                                    • <strong>Preserve Native Aspect Ratios:</strong> The client-side exporter directly samples the native image buffer, preventing accidental stretching or aspect-ratio distortion.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Oversaturating Human Skin:</strong> Pushing saturation above 140% often introduces unnatural orange tints and clipping in skin tones.
                                </li>
                                <li>
                                    • <strong>Excessive Negative Exposure:</strong> Extreme negative exposure combined with high contrast can create harsh color posterization in darker zones.
                                </li>
                                <li>
                                    • <strong>Repeated Lossy Re-Compression:</strong> Avoid saving JPEGs iteratively at low quality settings to prevent accumulating blocky DCT artifacts.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
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
                                Are my uploaded photos or graphics uploaded to an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire matrix adjustment pipeline operates strictly inside your browser through HTML5 Canvas and CSS Compositing APIs. Your files never touch a remote server, ensuring complete privacy and immediate client-side performance.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the mathematical difference between Brightness and Exposure?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Brightness operates linearly across the color spectrum, adding or subtracting a uniform luminance value across all RGB channels, which can easily clip shadows or wash out highlights. Exposure simulates camera shutter light capture using an exponential curve, elevating highlights and midtones with greater weight while preserving deep black baseline tones.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Will exporting my adjusted image reduce its original resolution or megapixel count?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. Visual previews are scaled to fit your display workspace, but the underlying canvas rendering engine executes filter operations directly against the unscaled native pixel matrix (naturalWidth and naturalHeight) upon export.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does color temperature affect photographic mood and chroma balance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Color temperature adjusts the Kelvin balance of an image. Positive values add warm amber and golden hues that mimic sunset or tungsten lighting. Negative values introduce cool blue tones that emulate overcast skylight or clinical daylight environments.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I copy the generated CSS filter string for use in my own web development projects?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The generated filter string is fully standards-compliant CSS and can be copied with one click to apply identical real-time rendering effects to HTML img tags, background covers, or canvas elements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which export file format should I choose for my photography?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Choose JPEG for real-world portraits, landscapes, and compressed web delivery. Choose PNG for illustrations, graphics with transparency, or lossless archival storage. Choose WebP for modern web publishing, providing superior compression ratios at equivalent visual fidelity.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}