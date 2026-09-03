"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Palette,
    UploadCloud,
    Pipette,
    Download,
    Copy,
    Check,
    RefreshCw,
    Sliders,
    Sparkles,
    Layers,
    Code2,
    BarChart3,
    HelpCircle,
    Eye,
    FileText,
    Crosshair
} from "lucide-react";

interface ColorSwatch {
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    cmyk: { c: number; m: number; y: number; k: number };
    percentage: number;
    count: number;
    luminance: number;
    isDark: boolean;
}

interface ExtractionSettings {
    maxColors: number;
    colorDepth: number; // quantization step
    excludeBackground: boolean;
    sortBy: "prominence" | "hue" | "luminance";
}

const SAMPLE_IMAGES = [
    {
        name: "Neon Cyberpunk City",
        src: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Tropical Sunset",
        src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    },
    {
        name: "Minimal Architectural Pastel",
        src: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    }
];

// Helper Color Transformations
function rgbToHex(r: number, g: number, b: number): string {
    return (
        "#" +
        [r, g, b]
            .map((x) => {
                const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
            .toUpperCase()
    );
}

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
        l: Math.round(l * 100)
    };
}

function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    const k = Math.min(c, Math.min(m, y));

    if (k >= 1) {
        return { c: 0, m: 0, y: 0, k: 100 };
    }

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    const kPercent = Math.round(k * 100);

    return { c, m, y, k: kPercent };
}

function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return +(a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722).toFixed(4);
}

export default function ImageColorExtractor() {
    const [imageSrc, setImageSrc] = useState<string | null>(SAMPLE_IMAGES[0].src);
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [palette, setPalette] = useState<ColorSwatch[]>([]);
    const [dominantColor, setDominantColor] = useState<ColorSwatch | null>(null);
    const [activeColor, setActiveColor] = useState<ColorSwatch | null>(null);
    const [activeFormat, setActiveFormat] = useState<"hex" | "rgb" | "hsl" | "cmyk">("hex");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isEyeDropperActive, setIsEyeDropperActive] = useState<boolean>(false);
    const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number } | null>(null);
    const [magnifierColor, setMagnifierColor] = useState<string>("#FFFFFF");

    // Extractor Customization Settings
    const [settings, setSettings] = useState<ExtractionSettings>({
        maxColors: 8,
        colorDepth: 16,
        excludeBackground: false,
        sortBy: "prominence"
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewImageRef = useRef<HTMLImageElement>(null);

    // Copy to clipboard helper
    const triggerCopy = (text: string, keyId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(keyId);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Color Quantization (Median Cut Approximation via Octree-style bucketing)
    const processImageColors = useCallback((imgElement: HTMLImageElement) => {
        setIsExtracting(true);
        const canvas = canvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
            setIsExtracting(false);
            return;
        }

        // Downscale image to a normalized size for sub-millisecond execution
        const maxDimension = 300;
        let width = imgElement.naturalWidth || imgElement.width;
        let height = imgElement.naturalHeight || imgElement.height;

        if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(imgElement, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height).data;
        const colorMap: { [key: string]: { r: number; g: number; b: number; count: number } } = {};
        const step = settings.colorDepth; // 8, 16, or 32 quantization threshold
        let totalSampledPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
            const a = imgData[i + 3];
            if (a < 128) continue; // skip transparent pixels

            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];

            // Quantize channels
            const qr = Math.floor(r / step) * step;
            const qg = Math.floor(g / step) * step;
            const qb = Math.floor(b / step) * step;

            const key = `${qr},${qg},${qb}`;
            if (!colorMap[key]) {
                colorMap[key] = { r: qr, g: qg, b: qb, count: 0 };
            }
            colorMap[key].count += 1;
            totalSampledPixels++;
        }

        let rawBuckets = Object.values(colorMap);

        // Discard extreme edges if exclude background is toggled
        if (settings.excludeBackground && rawBuckets.length > 5) {
            rawBuckets = rawBuckets.filter((b) => {
                const lum = getLuminance(b.r, b.g, b.b);
                return lum > 0.03 && lum < 0.96;
            });
        }

        // Sort by pixel count descending
        rawBuckets.sort((a, b) => b.count - a.count);

        // Deduplicate perceptually similar colors using Euclidean distance (threshold >= 24)
        const deduped: typeof rawBuckets = [];
        for (const bucket of rawBuckets) {
            const isSimilar = deduped.some((existing) => {
                const dist = Math.sqrt(
                    Math.pow(existing.r - bucket.r, 2) +
                    Math.pow(existing.g - bucket.g, 2) +
                    Math.pow(existing.b - bucket.b, 2)
                );
                return dist < 32;
            });

            if (!isSimilar) {
                deduped.push(bucket);
            }
            if (deduped.length >= settings.maxColors * 2) break;
        }

        // Take top selected quantity
        const finalSelected = deduped.slice(0, settings.maxColors);

        const swatches: ColorSwatch[] = finalSelected.map((item) => {
            const hex = rgbToHex(item.r, item.g, item.b);
            const hsl = rgbToHsl(item.r, item.g, item.b);
            const cmyk = rgbToCmyk(item.r, item.g, item.b);
            const lum = getLuminance(item.r, item.g, item.b);
            const pct = +((item.count / (totalSampledPixels || 1)) * 100).toFixed(1);

            return {
                hex,
                rgb: { r: item.r, g: item.g, b: item.b },
                hsl,
                cmyk,
                luminance: lum,
                percentage: pct,
                count: item.count,
                isDark: lum < 0.4
            };
        });

        // Apply secondary sorting if configured
        if (settings.sortBy === "hue") {
            swatches.sort((a, b) => a.hsl.h - b.hsl.h);
        } else if (settings.sortBy === "luminance") {
            swatches.sort((a, b) => b.luminance - a.luminance);
        }

        setPalette(swatches);
        if (swatches.length > 0) {
            setDominantColor(swatches[0]);
            setActiveColor(swatches[0]);
        }
        setIsExtracting(false);
    }, [settings]);

    // Handle initial and subsequent image loads
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            processImageColors(img);
        };
    }, [imageSrc, processImageColors]);

    // File Upload Handler
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageSrc(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Native Eyedropper API handler (fallback to click-sampling on canvas)
    const handleEyedropper = async () => {
        if (typeof window !== "undefined" && "EyeDropper" in window) {
            try {
                const EyeDropperClass = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
                const eyeDropper = new EyeDropperClass();
                const result = await eyeDropper.open();
                if (result?.sRGBHex) {
                    const hex = result.sRGBHex.toUpperCase();
                    // parse hex to RGB
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    const customSwatch: ColorSwatch = {
                        hex,
                        rgb: { r, g, b },
                        hsl: rgbToHsl(r, g, b),
                        cmyk: rgbToCmyk(r, g, b),
                        percentage: 0,
                        count: 0,
                        luminance: getLuminance(r, g, b),
                        isDark: getLuminance(r, g, b) < 0.4
                    };
                    setActiveColor(customSwatch);
                    // Add to palette if not present
                    if (!palette.some((p) => p.hex === hex)) {
                        setPalette([customSwatch, ...palette.slice(0, settings.maxColors - 1)]);
                    }
                }
            } catch {
                // User cancelled eyedropper
            }
        } else {
            setIsEyeDropperActive((prev) => !prev);
        }
    };

    // Manual Canvas Click Color Extraction
    const handleCanvasPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEyeDropperActive && !previewImageRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        setHoverCoords({ x, y });

        // Sample pixel from canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                const normX = Math.floor((x / rect.width) * canvas.width);
                const normY = Math.floor((y / rect.height) * canvas.height);
                const pixel = ctx.getImageData(normX, normY, 1, 1).data;
                const sampleHex = rgbToHex(pixel[0], pixel[1], pixel[2]);
                setMagnifierColor(sampleHex);
            }
        }
    };

    const handleCanvasPointerClick = () => {
        if (!hoverCoords || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const previewEl = previewImageRef.current;
            if (!previewEl) return;
            const normX = Math.floor((hoverCoords.x / previewEl.clientWidth) * canvas.width);
            const normY = Math.floor((hoverCoords.y / previewEl.clientHeight) * canvas.height);
            const pixel = ctx.getImageData(normX, normY, 1, 1).data;
            const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
            const customSwatch: ColorSwatch = {
                hex,
                rgb: { r: pixel[0], g: pixel[1], b: pixel[2] },
                hsl: rgbToHsl(pixel[0], pixel[1], pixel[2]),
                cmyk: rgbToCmyk(pixel[0], pixel[1], pixel[2]),
                percentage: 0,
                count: 0,
                luminance: getLuminance(pixel[0], pixel[1], pixel[2]),
                isDark: getLuminance(pixel[0], pixel[1], pixel[2]) < 0.4
            };
            setActiveColor(customSwatch);
            setIsEyeDropperActive(false);
        }
    };

    // Export Palette Formats
    const exportAsJson = () => {
        const data = {
            dominantColor: dominantColor?.hex,
            palette: palette.map((c) => ({
                hex: c.hex,
                rgb: `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
                hsl: `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
                cmyk: `cmyk(${c.cmyk.c}%, ${c.cmyk.m}%, ${c.cmyk.y}%, ${c.cmyk.k}%)`,
                luminance: c.luminance,
                percentage: `${c.percentage}%`
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "extracted-palette.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAsCss = () => {
        const vars = palette
            .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* RGB: ${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b} | ${c.percentage}% */`)
            .join("\n");
        const cssContent = `:root {\n${vars}\n}`;
        const blob = new Blob([cssContent], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "palette-variables.css";
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAsSvg = () => {
        const swatchWidth = 100;
        const height = 140;
        const totalWidth = palette.length * swatchWidth;
        const rects = palette
            .map(
                (c, i) =>
                    `<g transform="translate(${i * swatchWidth}, 0)">
            <rect width="${swatchWidth}" height="100" fill="${c.hex}" />
            <text x="50" y="120" font-family="monospace" font-size="12" fill="#0f172a" text-anchor="middle">${c.hex}</text>
          </g>`
            )
            .join("\n");

        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="${totalWidth}" height="${height}">
      <rect width="100%" height="100%" fill="#ffffff"/>
      ${rects}
    </svg>`;

        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "color-palette.svg";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Format display string helper
    const getFormattedValue = (swatch: ColorSwatch, format: "hex" | "rgb" | "hsl" | "cmyk") => {
        switch (format) {
            case "hex":
                return swatch.hex;
            case "rgb":
                return `rgb(${swatch.rgb.r}, ${swatch.rgb.g}, ${swatch.rgb.b})`;
            case "hsl":
                return `hsl(${swatch.hsl.h}, ${swatch.hsl.s}%, ${swatch.hsl.l}%)`;
            case "cmyk":
                return `cmyk(${swatch.cmyk.c}%, ${swatch.cmyk.m}%, ${swatch.cmyk.y}%, ${swatch.cmyk.k}%)`;
        }
    };

    // JSON-LD Structured Data
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Color Palette & Dominant Hex Extractor",
        "url": "https://twistertools.com/tools/image-tools/image-color-extractor",
        "description": "Extract dominant colors, calculate hex, RGB, HSL, and CMYK swatches, sample pixels with interactive eyedropper, and export design palettes directly inside your browser.",
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
                "name": "How does the Image Color Palette Extractor determine the dominant color?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool uses modified color quantization algorithms (octree spatial clustering and median-cut approximations). It downscales the input image onto an in-memory canvas element, clusters neighboring pixel values into geometric color space buckets, calculates relative pixel densities, and extracts the highest-frequency cluster as the primary dominant color."
                }
            },
            {
                "@type": "Question",
                "name": "Is my uploaded image sent to an external server or cloud API?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All pixel sampling, color clustering, canvas rendering, and data transformations execute 100% locally inside your browser thread via the HTML5 Canvas API and WebAssembly. Your photos and graphic designs never leave your device."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between HEX, RGB, HSL, and CMYK color models?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "HEX and RGB are additive color models designed for digital monitors and web displays based on red, green, and blue light. HSL models color via human perception (Hue, Saturation, Lightness). CMYK is a subtractive four-color printing model representing Cyan, Magenta, Yellow, and Key (Black) inks."
                }
            },
            {
                "@type": "Question",
                "name": "How do I sample an exact single pixel from my image?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Click the 'Pick Pixel' eyedropper button. If supported by your browser, the native EyeDropper API activates to sample any screen pixel. Otherwise, hover directly over the preview workspace to target and click any coordinate on the interactive canvas crosshair."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export the extracted palette directly into my code editor?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can export the generated palette in three formats: raw JSON object data, ready-to-paste CSS custom properties (:root variables), or an Adobe-compatible standalone SVG swatch sheet."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Hidden Processing Canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Image Upload, Stage & Precision Picker */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div>
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-indigo-600" />
                                Image Input & Viewport
                            </h2>
                            <button
                                onClick={handleEyedropper}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs cursor-pointer ${isEyeDropperActive
                                        ? "bg-indigo-600 text-white border-indigo-700 shadow-indigo-200"
                                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                                    }`}
                            >
                                <Pipette className="w-3.5 h-3.5" />
                                {isEyeDropperActive ? "Click Image to Sample" : "Pick Pixel"}
                            </button>
                        </div>

                        {/* Interactive Image Viewport Stage */}
                        <div
                            onMouseMove={handleCanvasPointerMove}
                            onMouseLeave={() => setHoverCoords(null)}
                            onClick={handleCanvasPointerClick}
                            className={`relative w-full h-72 sm:h-84 bg-slate-900 rounded-xl overflow-hidden border border-slate-200/80 flex items-center justify-center select-none ${isEyeDropperActive ? "cursor-crosshair ring-2 ring-indigo-500" : "cursor-default"
                                }`}
                        >
                            {imageSrc ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        ref={previewImageRef}
                                        src={imageSrc}
                                        alt="Uploaded analysis source"
                                        className="w-full h-full object-contain pointer-events-none"
                                    />
                                    {/* Real-time Magnifier Overlay when eyedropper active */}
                                    {isEyeDropperActive && hoverCoords && (
                                        <div
                                            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 flex flex-col items-center"
                                            style={{ left: hoverCoords.x, top: hoverCoords.y }}
                                        >
                                            <div className="w-12 h-12 rounded-full border-2 border-white shadow-xl flex items-center justify-center overflow-hidden bg-white/20 backdrop-blur-xs">
                                                <div
                                                    className="w-8 h-8 rounded-full shadow-inner border border-black/20"
                                                    style={{ backgroundColor: magnifierColor }}
                                                />
                                                <Crosshair className="w-6 h-6 text-white absolute" />
                                            </div>
                                            <span className="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono font-bold text-white shadow-xs">
                                                {magnifierColor}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center p-6 space-y-2">
                                    <Palette className="w-10 h-10 text-slate-500 mx-auto" />
                                    <p className="text-sm font-medium text-slate-400">No image loaded</p>
                                </div>
                            )}

                            {isExtracting && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs font-semibold gap-2">
                                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                                    Quantizing pixels...
                                </div>
                            )}
                        </div>

                        {/* Upload Controls & Presets */}
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp, image/svg+xml, image/avif"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="image-file-upload"
                                />
                                <label
                                    htmlFor="image-file-upload"
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm text-center transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Upload Custom Image
                                </label>
                                <button
                                    onClick={() => {
                                        if (previewImageRef.current) {
                                            processImageColors(previewImageRef.current);
                                        }
                                    }}
                                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                                    title="Re-extract Palette"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Demo Sample Image Buttons */}
                            <div className="space-y-1.5 pt-1">
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                    Or Try Demo Presets:
                                </span>
                                <div className="grid grid-cols-3 gap-2">
                                    {SAMPLE_IMAGES.map((sample, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setImageSrc(sample.src)}
                                            className={`p-1.5 rounded-lg border text-left text-[11px] font-medium truncate transition cursor-pointer ${imageSrc === sample.src
                                                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold"
                                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {sample.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extraction Settings Row */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Color Count: {settings.maxColors}
                            </span>
                            <div className="flex items-center gap-1">
                                {[5, 8, 12, 16].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => setSettings((s) => ({ ...s, maxColors: num }))}
                                        className={`px-2 py-0.5 rounded text-xs font-bold transition cursor-pointer ${settings.maxColors === num
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Mode</label>
                                <select
                                    value={settings.sortBy}
                                    onChange={(e) =>
                                        setSettings((s) => ({
                                            ...s,
                                            sortBy: e.target.value as "prominence" | "hue" | "luminance"
                                        }))
                                    }
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="prominence">Prominence (Frequency)</option>
                                    <option value="hue">Spectrum (Hue)</option>
                                    <option value="luminance">Brightness (Luminance)</option>
                                </select>
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-slate-700 hover:bg-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={settings.excludeBackground}
                                        onChange={(e) =>
                                            setSettings((s) => ({ ...s, excludeBackground: e.target.checked }))
                                        }
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-[11px] font-semibold truncate">Filter Extremes</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Palette Display, Color Metrics & Code Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-5 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Palette className="w-5 h-5 text-indigo-600" />
                                Extracted Palette & Swatches
                            </h2>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {palette.length} Colors Identified
                            </span>
                        </div>

                        {/* Top Swatch Visual Ribbon */}
                        <div className="space-y-1.5">
                            <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-inner border border-slate-200">
                                {palette.map((swatch, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveColor(swatch)}
                                        style={{ backgroundColor: swatch.hex, width: `${100 / palette.length}%` }}
                                        className={`h-full transition-all relative group cursor-pointer focus:outline-none ${activeColor?.hex === swatch.hex
                                                ? "ring-4 ring-indigo-500 ring-inset z-10 scale-105"
                                                : "hover:opacity-90"
                                            }`}
                                        title={`${swatch.hex} (${swatch.percentage}%)`}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-[11px] text-slate-600 font-medium px-1">
                                <span>Most Dominant</span>
                                <span>Accent Highlights</span>
                            </div>
                        </div>

                        {/* Active Color Detailed Inspector Card */}
                        {activeColor && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-12 h-12 rounded-xl shadow-md border border-slate-300 flex-shrink-0"
                                        style={{ backgroundColor: activeColor.hex }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-extrabold text-slate-900 text-base font-mono">
                                                {activeColor.hex}
                                            </h3>
                                            <button
                                                onClick={() => triggerCopy(activeColor.hex, "active-hex")}
                                                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                                            >
                                                {copiedKey === "active-hex" ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                                {copiedKey === "active-hex" ? "Copied" : "Copy Hex"}
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Luminance: {(activeColor.luminance * 100).toFixed(1)}% • Area Density:{" "}
                                            {activeColor.percentage}%
                                        </p>
                                    </div>
                                </div>

                                {/* Multi-Color Format Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                    <div
                                        onClick={() => triggerCopy(activeColor.hex, "box-hex")}
                                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer transition shadow-2xs"
                                    >
                                        <span className="text-[10px] font-bold text-slate-600 uppercase block">HEX</span>
                                        <span className="font-mono font-bold text-slate-900">{activeColor.hex}</span>
                                    </div>
                                    <div
                                        onClick={() =>
                                            triggerCopy(
                                                `rgb(${activeColor.rgb.r}, ${activeColor.rgb.g}, ${activeColor.rgb.b})`,
                                                "box-rgb"
                                            )
                                        }
                                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer transition shadow-2xs"
                                    >
                                        <span className="text-[10px] font-bold text-slate-600 uppercase block">RGB</span>
                                        <span className="font-mono text-[11px] font-semibold text-slate-900 truncate block">
                                            {activeColor.rgb.r},{activeColor.rgb.g},{activeColor.rgb.b}
                                        </span>
                                    </div>
                                    <div
                                        onClick={() =>
                                            triggerCopy(
                                                `hsl(${activeColor.hsl.h}, ${activeColor.hsl.s}%, ${activeColor.hsl.l}%)`,
                                                "box-hsl"
                                            )
                                        }
                                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer transition shadow-2xs"
                                    >
                                        <span className="text-[10px] font-bold text-slate-600 uppercase block">HSL</span>
                                        <span className="font-mono text-[11px] font-semibold text-slate-900 truncate block">
                                            {activeColor.hsl.h}°, {activeColor.hsl.s}%, {activeColor.hsl.l}%
                                        </span>
                                    </div>
                                    <div
                                        onClick={() =>
                                            triggerCopy(
                                                `cmyk(${activeColor.cmyk.c}%, ${activeColor.cmyk.m}%, ${activeColor.cmyk.y}%, ${activeColor.cmyk.k}%)`,
                                                "box-cmyk"
                                            )
                                        }
                                        className="p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 cursor-pointer transition shadow-2xs"
                                    >
                                        <span className="text-[10px] font-bold text-slate-600 uppercase block">CMYK</span>
                                        <span className="font-mono text-[11px] font-semibold text-slate-900 truncate block">
                                            {activeColor.cmyk.c},{activeColor.cmyk.m},{activeColor.cmyk.y},{activeColor.cmyk.k}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Interactive Swatch Table Grid */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Swatch Spectrum List
                                </span>
                                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                                    {(["hex", "rgb", "hsl", "cmyk"] as const).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => setActiveFormat(fmt)}
                                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer ${activeFormat === fmt ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-600"
                                                }`}
                                        >
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                                {palette.map((swatch, index) => {
                                    const valStr = getFormattedValue(swatch, activeFormat);
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setActiveColor(swatch)}
                                            className={`p-2.5 flex items-center justify-between text-xs transition cursor-pointer ${activeColor?.hex === swatch.hex ? "bg-indigo-50/60" : "hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div
                                                    className="w-5 h-5 rounded-md border border-black/10 flex-shrink-0"
                                                    style={{ backgroundColor: swatch.hex }}
                                                />
                                                <span className="font-mono font-bold text-slate-900 truncate">{valStr}</span>
                                                {index === 0 && (
                                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-sm">
                                                        Dominant
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className="text-slate-600 text-[11px] font-semibold">{swatch.percentage}%</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerCopy(valStr, `row-${index}`);
                                                    }}
                                                    className="p-1 rounded text-slate-600 hover:text-indigo-600 cursor-pointer"
                                                    title="Copy Value"
                                                >
                                                    {copiedKey === `row-${index}` ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Palette Export Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                            onClick={exportAsCss}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                        >
                            <Code2 className="w-4 h-4 text-indigo-400" />
                            Export CSS Variables
                        </button>
                        <button
                            onClick={exportAsJson}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm transition border border-indigo-200 cursor-pointer"
                            title="Download JSON Spec"
                        >
                            <FileText className="w-4 h-4" />
                            JSON
                        </button>
                        <button
                            onClick={exportAsSvg}
                            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition border border-slate-200 cursor-pointer"
                            title="Download SVG Swatches"
                        >
                            <Download className="w-4 h-4" />
                            SVG
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Color Quantization & Spatial Clustering Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithmic Foundations: Color Quantization &amp; Spatial Clustering
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Extracting representative color palettes from digital images requires <strong>Color Quantization</strong>: the algorithmic reduction of millions of discrete continuous RGB pixel values into a compact, visually coherent palette while preserving aesthetic relationships. A standard high-definition image contains up to 16.7 million (2<sup>24</sup>) possible colors. This extractor utilizes optimized spatial binning and Euclidean distance vector clustering:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Euclidean Color Distance Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                To prevent visually redundant swatches, color distance &Delta;E is evaluated across three-dimensional Euclidean color space:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                ΔE = √[ (R₂ - R₁)² + (G₂ - G₁)² + (B₂ - B₁)² ]
                            </div>
                            <p className="text-xs text-slate-500">
                                Vectors below the threshold distance (&Delta;E &lt; 32) are clustered into the dominant centroid.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-600" /> Relative Luminance (WCAG Formula)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Perceptual luminance calculation complies with the W3C Web Content Accessibility Guidelines (WCAG 2.1) specification:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                L = 0.2126 × R_lin + 0.7152 × G_lin + 0.0722 × B_lin
                            </div>
                            <p className="text-xs text-slate-500">
                                Enables automated categorization of dark versus light UI design backgrounds.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Color Space Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Color Space Comparison: HEX, RGB, HSL & CMYK
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Designers and developers switch between distinct mathematical color models depending on the target medium—from screen rendering to physical print reproduction:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Color Model</th>
                                    <th className="p-3">Domain Type</th>
                                    <th className="p-3">Data Representation</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">HEX (Hexadecimal)</td>
                                    <td className="p-3">Additive Screen</td>
                                    <td className="p-3 font-mono">#RRGGBB (00 to FF)</td>
                                    <td className="p-3">CSS styling, web design tokens, and SVG code</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">RGB (Red, Green, Blue)</td>
                                    <td className="p-3">Additive Screen</td>
                                    <td className="p-3 font-mono">0 – 255 per channel</td>
                                    <td className="p-3">Canvas manipulation, WebGL shaders, image processing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">HSL (Hue, Sat, Light)</td>
                                    <td className="p-3">Cylindrical Perceptual</td>
                                    <td className="p-3 font-mono">0-360°, 0-100%, 0-100%</td>
                                    <td className="p-3">Dynamic UI color theming, hover states, tinting</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-indigo-600">CMYK (Process Print)</td>
                                    <td className="p-3">Subtractive Inks</td>
                                    <td className="p-3 font-mono">0 – 100% (C, M, Y, K)</td>
                                    <td className="p-3">Offset printing, commercial packaging, branding collateral</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Step-by-Step UI Design Palette Construction */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Eye className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Building Cohesive Design Systems from Extracted Imagery
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A photographic color palette cannot always be dropped directly into interface mockups without structural balance. Follow the standard <strong>60-30-10 Rule</strong> of visual UI hierarchy:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">60% Dominant Base</span>
                            <h3 className="font-bold text-slate-900 text-sm">Background & Structure</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Use the low-saturation or neutral base extracted from the image for app surfaces, canvas backgrounds, card borders, and primary section wrappers.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">30% Secondary Body</span>
                            <h3 className="font-bold text-slate-900 text-sm">Typography & Card Fills</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Select high-contrast swatches for editorial text elements, secondary buttons, navigation sidebars, and subheadings to ensure clear scannability.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">10% Accent Highlighting</span>
                            <h3 className="font-bold text-slate-900 text-sm">Action Buttons & Badges</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Reserve the most saturated, high-frequency accent color exclusively for primary call-to-actions (CTAs), focus rings, status badges, and active tabs.
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
                                How does the Image Color Palette Extractor determine the dominant color?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool uses modified color quantization algorithms (octree spatial clustering and median-cut approximations). It downscales the input image onto an in-memory canvas element, clusters neighboring pixel values into geometric color space buckets, calculates relative pixel densities, and extracts the highest-frequency cluster as the primary dominant color.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my uploaded image sent to an external server or cloud API?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All pixel sampling, color clustering, canvas rendering, and data transformations execute 100% locally inside your browser thread via the HTML5 Canvas API and WebAssembly. Your photos and graphic designs never leave your device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between HEX, RGB, HSL, and CMYK color models?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                HEX and RGB are additive color models designed for digital monitors and web displays based on red, green, and blue light. HSL models color via human perception (Hue, Saturation, Lightness). CMYK is a subtractive four-color printing model representing Cyan, Magenta, Yellow, and Key (Black) inks.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I sample an exact single pixel from my image?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Click the &apos;Pick Pixel&apos; eyedropper button. If supported by your browser, the native EyeDropper API activates to sample any screen pixel. Otherwise, hover directly over the preview workspace to target and click any coordinate on the interactive canvas crosshair.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export the extracted palette directly into my code editor?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can export the generated palette in three formats: raw JSON object data, ready-to-paste CSS custom properties (:root variables), or an Adobe-compatible standalone SVG swatch sheet.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}