"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import {
    SlidersHorizontal,
    UploadCloud,
    Download,
    RotateCcw,
    Sparkles,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Image as ImageIcon,
    Sliders,
    Layers,
    Cpu,
    FileImage,
    Maximize2,
    Palette
} from "lucide-react";

type InvertMode = "full" | "luminance" | "red" | "green" | "blue" | "hue-rotate";
type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

interface InverterSettings {
    invertAmount: number; // 0 to 100%
    mode: InvertMode;
    preserveAlpha: boolean;
    brightness: number; // -100 to +100
    contrast: number; // -100 to +100
    solarizeThreshold: number; // 0 to 255 (0 = disabled)
}

const DEFAULT_SETTINGS: InverterSettings = {
    invertAmount: 100,
    mode: "full",
    preserveAlpha: true,
    brightness: 0,
    contrast: 0,
    solarizeThreshold: 0,
};

const SAMPLE_IMAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="50%" stop-color="%2306b6d4"/><stop offset="100%" stop-color="%23f59e0b"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g1)"/><circle cx="250" cy="220" r="120" fill="%23ffffff" opacity="0.85"/><circle cx="520" cy="360" r="160" fill="%23f43f5e" opacity="0.85"/><polygon points="400,100 480,260 320,260" fill="%2310b981"/><rect x="150" y="380" width="220" height="140" rx="20" fill="%230f172a" opacity="0.9"/><text x="400" y="550" font-family="sans-serif" font-size="28" font-weight="bold" fill="%23ffffff" text-anchor="middle">TwisterTools Color Inverter Test Pattern</text></svg>`;

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

export default function ImageColorInverter() {
    const [settings, setSettings] = useState<InverterSettings>(DEFAULT_SETTINGS);
    const [imageSource, setImageSource] = useState<string>(SAMPLE_IMAGE_SVG);
    const [fileName, setFileName] = useState<string>("twister-test-pattern.svg");
    const [fileSize, setFileSize] = useState<string>("1.2 KB");
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
    const [quality, setQuality] = useState<number>(92);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [splitPosition, setSplitPosition] = useState<number>(50);
    const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

    const invertInputId = useId();
    const brightnessInputId = useId();
    const contrastInputId = useId();
    const solarizeInputId = useId();
    const qualityInputId = useId();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const processedCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const previewContainerRef = useRef<HTMLDivElement | null>(null);

    // Load Image onto In-Memory Canvas
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            const origCanvas = document.createElement("canvas");
            origCanvas.width = img.naturalWidth;
            origCanvas.height = img.naturalHeight;
            const ctx = origCanvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                originalCanvasRef.current = origCanvas;
                processImage();
            }
        };
        img.src = imageSource;
    }, [imageSource]);

    // Pixel Processing Pipeline
    const processImage = useCallback(() => {
        if (!originalCanvasRef.current) return;
        setIsProcessing(true);

        const origCanvas = originalCanvasRef.current;
        const width = origCanvas.width;
        const height = origCanvas.height;

        const origCtx = origCanvas.getContext("2d");
        if (!origCtx) return;

        const imgData = origCtx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const len = data.length;

        const invFactor = settings.invertAmount / 100;
        const mode = settings.mode;
        const preserveAlpha = settings.preserveAlpha;
        const brightnessOffset = (settings.brightness / 100) * 255;
        const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
        const solarizeThresh = settings.solarizeThreshold;

        for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            const a = data[i + 3];

            // 1. Solarization Pre-Pass (Sabattier effect)
            if (solarizeThresh > 0) {
                if (r < solarizeThresh) r = 255 - r;
                if (g < solarizeThresh) g = 255 - g;
                if (b < solarizeThresh) b = 255 - b;
            }

            // 2. Color Inversion Math
            let targetR = r;
            let targetG = g;
            let targetB = b;

            switch (mode) {
                case "full":
                    targetR = 255 - r;
                    targetG = 255 - g;
                    targetB = 255 - b;
                    break;
                case "luminance": {
                    // Photographic negative with preserved hue orientation
                    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    const invertedLum = 255 - lum;
                    const lumRatio = lum === 0 ? 1 : invertedLum / lum;
                    targetR = Math.min(255, r * lumRatio);
                    targetG = Math.min(255, g * lumRatio);
                    targetB = Math.min(255, b * lumRatio);
                    break;
                }
                case "red":
                    targetR = 255 - r;
                    break;
                case "green":
                    targetG = 255 - g;
                    break;
                case "blue":
                    targetB = 255 - b;
                    break;
                case "hue-rotate": {
                    // Complementary opposite colors via 180-deg RGB approximation
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    targetR = max + min - r;
                    targetG = max + min - g;
                    targetB = max + min - b;
                    break;
                }
            }

            // Linear Interpolation for Invert Percentage
            r = r + (targetR - r) * invFactor;
            g = g + (targetG - g) * invFactor;
            b = b + (targetB - b) * invFactor;

            // 3. Brightness Adjustment
            if (settings.brightness !== 0) {
                r += brightnessOffset;
                g += brightnessOffset;
                b += brightnessOffset;
            }

            // 4. Contrast Adjustment
            if (settings.contrast !== 0) {
                r = contrastFactor * (r - 128) + 128;
                g = contrastFactor * (g - 128) + 128;
                b = contrastFactor * (b - 128) + 128;
            }

            // Final Clamp 0-255
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
            if (!preserveAlpha) {
                data[i + 3] = 255;
            } else {
                data[i + 3] = a;
            }
        }

        const outCanvas = document.createElement("canvas");
        outCanvas.width = width;
        outCanvas.height = height;
        const outCtx = outCanvas.getContext("2d");
        if (outCtx) {
            outCtx.putImageData(imgData, 0, 0);
            processedCanvasRef.current = outCanvas;
        }

        setIsProcessing(false);
    }, [settings]);

    useEffect(() => {
        processImage();
    }, [processImage]);

    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Handle Drag & Drop Events
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

    const handleFileProcess = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file (PNG, JPG, WebP, SVG, BMP, TIFF).");
            return;
        }

        setFileName(file.name);
        setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
            if (uploadEvent.target?.result) {
                setImageSource(uploadEvent.target.result as string);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const loadSamplePattern = () => {
        setImageSource(SAMPLE_IMAGE_SVG);
        setFileName("twister-test-pattern.svg");
        setFileSize("1.2 KB");
        setSettings(DEFAULT_SETTINGS);
    };

    // Download Converted Image
    const handleDownload = () => {
        if (!processedCanvasRef.current) return;
        const canvas = processedCanvasRef.current;
        const extension = outputFormat.split("/")[1];
        const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
        const downloadName = `${baseName}-inverted.${extension}`;

        const dataUrl = canvas.toDataURL(outputFormat, quality / 100);
        const link = document.createElement("a");
        link.download = downloadName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setOutputFormat("image/png");
        setQuality(92);
    };

    // Split View Slider Mouse Handlers
    const handleSplitMove = (clientX: number) => {
        if (!previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const percentage = (offsetX / rect.width) * 100;
        setSplitPosition(percentage);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length > 0) {
            handleSplitMove(e.touches[0].clientX);
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image Color Inverter & Film Negative Photo Filter",
        "url": "https://twistertools.com/tools/image-tools/image-color-inverter",
        "description": "Free, browser-native image color inverter and negative film simulator. Invert colors, convert film negatives to digital, isolate RGB channels, and adjust curves client-side.",
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
                "name": "How does digital image color inversion calculate pixel values?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Digital color inversion works on 8-bit per channel RGB arrays (0 to 255). The inverted value of any given subpixel is calculated using the complement formula: Inverted = 255 - Original. For instance, pure black RGB(0,0,0) converts to pure white RGB(255,255,255), and deep red RGB(255,0,0) translates to cyan RGB(0,255,255)."
                }
            },
            {
                "@type": "Question",
                "name": "Are my uploaded photos or scanned film negatives uploaded to any external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools utilizes client-side HTML5 Canvas API and WebAssembly/JavaScript typed arrays. All pixel transformations, solarization algorithms, and exports execute locally within your device's browser memory, guaranteeing absolute privacy and instantaneous processing without data transmission."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool convert scanned 35mm film negatives into positive photos?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Scanned black-and-white negatives convert directly with the standard full invert mode. For color negatives, which incorporate an orange acetate base mask, using the Luminance Negative or Hue-Rotate inversion mode along with post-inversion brightness and contrast adjustments allows you to balance optical density and reveal the positive image."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Full Inversion and Luminance Inversion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Full Inversion calculates the mathematical additive complement across each individual RGB channel, transforming both tonal lightness and hue (e.g., green becomes magenta). Luminance Inversion inverts only the perceived photometric luminance (based on ITU-R BT.709 coefficients: 0.2126R + 0.7152G + 0.0722B) while scaling the existing color vectors to preserve original chromatic orientation."
                }
            },
            {
                "@type": "Question",
                "name": "What is the Sabattier (Solarization) effect included in this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Sabattier effect, historically discovered in darkrooms by Armand Sabattier and popularized by Man Ray, is pseudo-solarization produced by re-exposing a partially developed photographic emulsion. In digital processing, it selectively inverts pixels possessing values below a specified luminance threshold while preserving highlights, producing surreal metallic edge halos."
                }
            },
            {
                "@type": "Question",
                "name": "Does inverting high-resolution images result in loss of image quality or detail?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No loss of visual detail occurs during processing. Pixel math (255 - x) is a lossless, reversible 1:1 mathematical mapping. If you select PNG or WebP at 100% quality during final export, your output will retain the exact full-resolution bit depth and fidelity of the original source asset."
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
                {/* Left Panel: Calibration & Settings */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Inversion & Grading Matrix
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={loadSamplePattern}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                                >
                                    Try Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Image Drag & Drop Upload Zone */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                                    Source Image
                                </label>
                                <span className="text-[11px] font-mono text-slate-500">
                                    {imageDimensions.width} × {imageDimensions.height} px
                                </span>
                            </div>
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                                    isDragging
                                        ? "border-indigo-600 bg-indigo-50/60"
                                        : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                                }`}
                            >
                                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                                    <UploadCloud className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">
                                        Drop image here, or <span className="text-indigo-600 underline">browse files</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Supports PNG, JPG, WebP, SVG, TIFF, BMP
                                    </p>
                                </div>
                                <div className="flex items-center justify-between w-full text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 mt-1">
                                    <span className="truncate max-w-[180px] font-mono text-slate-700 font-medium">{fileName}</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono font-medium">{fileSize}</span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Inversion Algorithm Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                Chromatic Inversion Algorithm
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { id: "full", label: "Full RGB Invert" },
                                    { id: "luminance", label: "Luminance Only" },
                                    { id: "hue-rotate", label: "Hue Complement" },
                                    { id: "red", label: "Red Channel" },
                                    { id: "green", label: "Green Channel" },
                                    { id: "blue", label: "Blue Channel" },
                                ].map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setSettings((p) => ({ ...p, mode: mode.id as InvertMode }))}
                                        className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${settings.mode === mode.id
                                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Inversion Intensity Percentage Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={invertInputId}>Invert Intensity:</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={invertInputId}
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={settings.invertAmount}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setSettings((p) => ({ ...p, invertAmount: val })), 0, 100)
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
                                value={settings.invertAmount}
                                onChange={(e) => setSettings((p) => ({ ...p, invertAmount: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>

                        {/* Solarization (Sabattier Threshold) */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={solarizeInputId} className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                    Solarization Sabattier Threshold:
                                </label>
                                <div className="flex items-center gap-1">
                                    <input
                                        id={solarizeInputId}
                                        type="number"
                                        min="0"
                                        max="255"
                                        value={settings.solarizeThreshold}
                                        onChange={(e) =>
                                            handleNumberInput(e, (val) => setSettings((p) => ({ ...p, solarizeThreshold: val })), 0, 255)
                                        }
                                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="text-slate-400 font-normal">/255</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="255"
                                step="1"
                                value={settings.solarizeThreshold}
                                onChange={(e) => setSettings((p) => ({ ...p, solarizeThreshold: Number(e.target.value) }))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <p className="text-[11px] text-slate-500">Sets the luminance baseline below which pixels re-invert into surreal silver halide halos.</p>
                        </div>

                        {/* Brightness & Contrast Dual Adjustments */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={brightnessInputId}>Brightness Offset:</label>
                                    <span className="font-mono text-slate-600">{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span>
                                </div>
                                <input
                                    id={brightnessInputId}
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={settings.brightness}
                                    onChange={(e) => setSettings((p) => ({ ...p, brightness: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={contrastInputId}>Contrast Curve:</label>
                                    <span className="font-mono text-slate-600">{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}</span>
                                </div>
                                <input
                                    id={contrastInputId}
                                    type="range"
                                    min="-100"
                                    max="100"
                                    step="1"
                                    value={settings.contrast}
                                    onChange={(e) => setSettings((p) => ({ ...p, contrast: Number(e.target.value) }))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Alpha Preservation Checkbox */}
                        <div className="pt-2">
                            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={settings.preserveAlpha}
                                    onChange={(e) => setSettings((p) => ({ ...p, preserveAlpha: e.target.checked }))}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span>Preserve PNG Transparent Alpha Channel</span>
                            </label>
                            <p className="text-[11px] text-slate-500 mt-1 pl-6">
                                If unchecked, transparent voids will invert into solid white opaque pixels.
                            </p>
                        </div>
                    </div>

                    {/* Metadata & Diagnostics Footer */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side WebGL/Canvas Accelerated
                        </span>
                        <span>{fileSize}</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Split-Screen Visualizer & Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Split-Screen Comparison
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Drag divider to compare</span>
                            </div>
                        </div>

                        {/* Interactive Before/After Stage Container */}
                        <div
                            ref={previewContainerRef}
                            onMouseMove={(e) => isDraggingSplit && handleSplitMove(e.clientX)}
                            onMouseUp={() => setIsDraggingSplit(false)}
                            onMouseLeave={() => setIsDraggingSplit(false)}
                            onTouchMove={handleTouchMove}
                            className="relative w-full h-80 sm:h-96 rounded-xl overflow-hidden select-none bg-slate-900 border border-slate-800 cursor-ew-resize flex items-center justify-center"
                        >
                            {/* Inverted Canvas Render (Full Background) */}
                            {processedCanvasRef.current && (
                                <img
                                    src={processedCanvasRef.current.toDataURL()}
                                    alt="Inverted Negative View"
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                />
                            )}

                            {/* Original Image (Clipped overlay via split slider) */}
                            <div
                                style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                                className="absolute inset-0 w-full h-full pointer-events-none"
                            >
                                <img
                                    src={imageSource}
                                    alt="Original Positive View"
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Floating Labels */}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider pointer-events-none border border-white/20">
                                Original
                            </div>
                            <div className="absolute top-3 right-3 bg-indigo-900/80 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider pointer-events-none border border-indigo-400/30">
                                Inverted Negative
                            </div>

                            {/* Divider Bar & Handle */}
                            <div
                                style={{ left: `${splitPosition}%` }}
                                onMouseDown={() => setIsDraggingSplit(true)}
                                onTouchStart={() => setIsDraggingSplit(true)}
                                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 cursor-ew-resize"
                            >
                                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-white text-indigo-600 rounded-full shadow-lg border border-slate-300 flex items-center justify-center text-xs">
                                    <Sliders className="w-3.5 h-3.5 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Export Formulation Controls */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <FileImage className="w-4 h-4 text-indigo-600" />
                                    Export Format & Compression
                                </span>
                                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg">
                                    {(["image/png", "image/jpeg", "image/webp"] as OutputFormat[]).map((fmt) => (
                                        <button
                                            key={fmt}
                                            type="button"
                                            onClick={() => setOutputFormat(fmt)}
                                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${outputFormat === fmt ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                                }`}
                                        >
                                            {fmt.split("/")[1].toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {outputFormat !== "image/png" && (
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                        <label htmlFor={qualityInputId}>Encoding Quality:</label>
                                        <span className="font-mono">{quality}%</span>
                                    </div>
                                    <input
                                        id={qualityInputId}
                                        type="range"
                                        min="10"
                                        max="100"
                                        step="1"
                                        value={quality}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isProcessing}
                                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                Download Inverted Image
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-400" />
                            Hardware Accelerated Compositor
                        </span>
                        <span className="font-mono text-slate-600 truncate max-w-[180px]">{fileName}</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Optical Color Physics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Digital Color Inversion: Additive Complements and Film Chemistry
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Digital color inversion is an optical transformation operating within additive color models like sRGB. Every digital pixel contains red, green, and blue subpixel values quantized between 0 and 255. Inverting an image calculates the exact complementary opposite of each color coordinate along the 3D RGB color cube:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Additive Complements
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                In 8-bit color space, the mathematical inverse of value $C$ is calculated as $255 - C$. Red (255, 0, 0) shifts directly to Cyan (0, 255, 255), and Deep Blue (0, 0, 255) turns to Bright Yellow (255, 255, 0).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Photometric Luminance
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Human eyes perceive light non-linearly across green, red, and blue wavelengths. Luminance negative inversion applies ITU-R BT.709 coefficients to invert perceived tonality while keeping native hues intact.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Sabattier Pseudo-Solarization
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Originating in analog chemical darkrooms, selective threshold solarization re-inverts darker values while preserving specular highlights, generating metallic fringes along tonal transitions.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> The In-Memory Typed Array Pixel Inversion Algorithm
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            TwisterTools manipulates low-level Uint8ClampedArray pixel buffers directly via the browser&apos;s HTML5 2D Canvas context, bypassing server round-trips for instantaneous throughput:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Lossless Direct Linear Interpolation Inversion
const buffer = imageData.data;
const factor = invertPercent / 100;

for (let i = 0; i < buffer.length; i += 4) {
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];
    
    // Calculate 8-bit complement coordinates
    const invR = 255 - r;
    const invG = 255 - g;
    const invB = 255 - b;
    
    // Blend according to slider interpolation
    buffer[i]     = r + (invR - r) * factor;
    buffer[i + 1] = g + (invG - g) * factor;
    buffer[i + 2] = b + (invB - b) * factor;
}`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Analysis: Inversion Modes & Film Reversal Methods
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the appropriate inversion mode depends on your source media—whether working with scanned black-and-white negatives, color film strips with orange masking, technical blueprints, or graphic art:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Inversion Mode</th>
                                    <th className="p-3">Primary Formula</th>
                                    <th className="p-3">Color Shift</th>
                                    <th className="p-3">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Full RGB Invert</td>
                                    <td className="p-3 font-mono text-xs">C_inv = 255 - C</td>
                                    <td className="p-3 text-rose-600 font-semibold">180° Hue Flip + Inverted Tone</td>
                                    <td className="p-3">Standard photo negatives, dark mode blueprints</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Luminance Negative</td>
                                    <td className="p-3 font-mono text-xs">L_inv = 255 - Y(R,G,B)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Preserves Original Hues</td>
                                    <td className="p-3">Artistic night visions, preserving skin-tone color balance</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Channel Selective (R/G/B)</td>
                                    <td className="p-3 font-mono text-xs">R_inv = 255 - R (others static)</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Selective Color Shift</td>
                                    <td className="p-3">Infrared photography, astrophotography, scientific analysis</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Sabattier Solarization</td>
                                    <td className="p-3 font-mono text-xs">if (C &lt; Thresh) 255 - C</td>
                                    <td className="p-3 text-amber-600 font-semibold">Surreal Silver Metal Halos</td>
                                    <td className="p-3">Avant-garde portraits, Man Ray darkroom aesthetic</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Film Scanning, Density Curves & Reversal Workflow */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Maximize2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Practical Darkroom Workflow: Converting 35mm & 120 Film Negatives
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Digitizing analog film through flatbed scanners or DSLR scanning rigs captures physical density variations across silver halide or chromogenic dye layers. Converting them into vibrant digital positive photographs requires three systematic steps:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Black-and-White Film Processing
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Direct Linear Inversion:</strong> Apply 100% Full RGB Invert. Dark emulsion shadows will flip instantly into clean, high-contrast highlights.
                                </li>
                                <li>
                                    • <strong>Density Curve Compensation:</strong> Film base density creates fog. Adjust Brightness to -10 to deepen true black, then elevate Contrast by +15% to +25% to restore dynamic punch.
                                </li>
                                <li>
                                    • <strong>Lossless Export:</strong> Always export film scans as uncompressed PNG to prevent compression artifacting in subtle grain structures.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Color Negative Orange Masking
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>The Orange Acetate Challenge:</strong> Color films (Kodak Portra, Fuji Superia) include an integral orange dye base to correct dye impurities. Inverting directly creates a pervasive cyan cast.
                                </li>
                                <li>
                                    • <strong>Channel Balance:</strong> Use the Channel-Selective or Luminance inversion mode to balance the red-to-cyan shift before dialing in fine tonal grading.
                                </li>
                                <li>
                                    • <strong>Gamma Calibration:</strong> Negative films possess a shallow gamma slope (0.6 to 0.7). Elevating contrast curve sliders restores natural human eye dynamic range.
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
                                How does digital image color inversion calculate pixel values?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Digital color inversion works on 8-bit per channel RGB arrays (0 to 255). The inverted value of any given subpixel is calculated using the complement formula: Inverted = 255 - Original. For instance, pure black RGB(0,0,0) converts to pure white RGB(255,255,255), and deep red RGB(255,0,0) translates to cyan RGB(0,255,255).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my uploaded photos or scanned film negatives uploaded to any external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools utilizes client-side HTML5 Canvas API and WebAssembly/JavaScript typed arrays. All pixel transformations, solarization algorithms, and exports execute locally within your device&apos;s browser memory, guaranteeing absolute privacy and instantaneous processing without data transmission.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool convert scanned 35mm film negatives into positive photos?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Scanned black-and-white negatives convert directly with the standard full invert mode. For color negatives, which incorporate an orange acetate base mask, using the Luminance Negative or Hue-Rotate inversion mode along with post-inversion brightness and contrast adjustments allows you to balance optical density and reveal the positive image.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Full Inversion and Luminance Inversion?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Full Inversion calculates the mathematical additive complement across each individual RGB channel, transforming both tonal lightness and hue (e.g., green becomes magenta). Luminance Inversion inverts only the perceived photometric luminance (based on ITU-R BT.709 coefficients: 0.2126R + 0.7152G + 0.0722B) while scaling the existing color vectors to preserve original chromatic orientation.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the Sabattier (Solarization) effect included in this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Sabattier effect, historically discovered in darkrooms by Armand Sabattier and popularized by Man Ray, is pseudo-solarization produced by re-exposing a partially developed photographic emulsion. In digital processing, it selectively inverts pixels possessing values below a specified luminance threshold while preserving highlights, producing surreal metallic edge halos.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does inverting high-resolution images result in loss of image quality or detail?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No loss of visual detail occurs during processing. Pixel math (255 - x) is a lossless, reversible 1:1 mathematical mapping. If you select PNG or WebP at 100% quality during final export, your output will retain the exact full-resolution bit depth and fidelity of the original source asset.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}