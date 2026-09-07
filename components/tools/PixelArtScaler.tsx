"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import {
    Upload,
    Download,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Sliders,
    Eye,
    Sparkles,
    Layers,
    Monitor,
    Terminal,
    Cpu,
    CheckCircle2,
    AlertTriangle,
    HelpCircle,
    BookOpen,
    Maximize2,
    Grid,
    FileImage
} from "lucide-react";

type ScaleFactor = 1 | 2 | 3 | 4 | 8 | 16 | 32;
type ExportFormat = "png" | "webp";
type ScalingAlgorithm = "nearest" | "bilinear" | "crisp-edges";

interface ImageMeta {
    name: string;
    originalWidth: number;
    originalHeight: number;
    sizeBytes: number;
}

const SCALE_PRESETS: ScaleFactor[] = [1, 2, 3, 4, 8, 16, 32];

const SAMPLE_SPRITE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%231e293b"/><rect x="6" y="2" width="4" height="2" fill="%23f59e0b"/><rect x="4" y="4" width="8" height="2" fill="%23f59e0b"/><rect x="4" y="6" width="2" height="2" fill="%23ffffff"/><rect x="10" y="6" width="2" height="2" fill="%23ffffff"/><rect x="5" y="7" width="1" height="1" fill="%23000000"/><rect x="11" y="7" width="1" height="1" fill="%23000000"/><rect x="6" y="8" width="4" height="1" fill="%23ea580c"/><rect x="4" y="9" width="8" height="2" fill="%23dc2626"/><rect x="2" y="7" width="2" height="5" fill="%234f46e5"/><rect x="12" y="7" width="2" height="5" fill="%234f46e5"/><rect x="5" y="11" width="6" height="3" fill="%232563eb"/><rect x="4" y="14" width="3" height="2" fill="%237c3aed"/><rect x="9" y="14" width="3" height="2" fill="%237c3aed"/></svg>`;

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

export default function PixelArtScaler() {
    const [scaleFactor, setScaleFactor] = useState<ScaleFactor>(4);
    const [algorithm, setAlgorithm] = useState<ScalingAlgorithm>("nearest");
    const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
    const [customWidth, setCustomWidth] = useState<number>(64);
    const [customHeight, setCustomHeight] = useState<number>(64);
    const [useCustomDimensions, setUseCustomDimensions] = useState<boolean>(false);
    const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
    const [showPixelGrid, setShowPixelGrid] = useState<boolean>(true);
    const [previewZoom, setPreviewZoom] = useState<number>(100); // percentage

    const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
    const [imageMeta, setImageMeta] = useState<ImageMeta>({
        name: "pixel-sprite-sample.png",
        originalWidth: 16,
        originalHeight: 16,
        sizeBytes: 1024,
    });
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const customWidthId = useId();
    const customHeightId = useId();
    const zoomInputId = useId();

    const targetWidth = useCustomDimensions
        ? customWidth
        : (imageMeta.originalWidth || 16) * scaleFactor;
    const targetHeight = useCustomDimensions
        ? customHeight
        : (imageMeta.originalHeight || 16) * scaleFactor;

    const processLoadedSource = useCallback((img: HTMLImageElement, name: string, size: number) => {
        setLoadedImage(img);
        setImageMeta({
            name,
            originalWidth: img.naturalWidth || img.width,
            originalHeight: img.naturalHeight || img.height,
            sizeBytes: size,
        });
        setCustomWidth((img.naturalWidth || img.width) * 4);
        setCustomHeight((img.naturalHeight || img.height) * 4);
    }, []);

    useEffect(() => {
        const sampleImg = new Image();
        sampleImg.crossOrigin = "anonymous";
        sampleImg.onload = () => {
            processLoadedSource(sampleImg, "pixel-sprite-sample.png", 1024);
        };
        sampleImg.src = SAMPLE_SPRITE_SVG;
    }, [processLoadedSource]);

    useEffect(() => {
        if (!loadedImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        if (algorithm === "nearest") {
            ctx.imageSmoothingEnabled = false;
        } else {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
        }

        ctx.clearRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(loadedImage, 0, 0, targetWidth, targetHeight);
    }, [loadedImage, targetWidth, targetHeight, algorithm]);

    const handleFileUpload = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
                const img = new Image();
                img.onload = () => {
                    processLoadedSource(img, file.name, file.size);
                };
                img.src = result;
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCustomWidthChange = (val: number) => {
        setCustomWidth(val);
        if (lockAspectRatio && imageMeta.originalWidth > 0) {
            const ratio = imageMeta.originalHeight / imageMeta.originalWidth;
            setCustomHeight(Math.max(1, Math.round(val * ratio)));
        }
    };

    const handleCustomHeightChange = (val: number) => {
        setCustomHeight(val);
        if (lockAspectRatio && imageMeta.originalHeight > 0) {
            const ratio = imageMeta.originalWidth / imageMeta.originalHeight;
            setCustomWidth(Math.max(1, Math.round(val * ratio)));
        }
    };

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const mimeType = exportFormat === "webp" ? "image/webp" : "image/png";
        const extension = exportFormat === "webp" ? "webp" : "png";

        const dataUrl = canvas.toDataURL(mimeType, 1.0);
        const link = document.createElement("a");
        const baseName = imageMeta.name.replace(/\.[^/.]+$/, "");
        link.download = `${baseName}-${targetWidth}x${targetHeight}-${algorithm}.${extension}`;
        link.href = dataUrl;
        link.click();
    };

    const handleReset = () => {
        setScaleFactor(4);
        setAlgorithm("nearest");
        setExportFormat("png");
        setUseCustomDimensions(false);
        setLockAspectRatio(true);
        setShowPixelGrid(true);
        setPreviewZoom(100);

        const sampleImg = new Image();
        sampleImg.crossOrigin = "anonymous";
        sampleImg.onload = () => {
            processLoadedSource(sampleImg, "pixel-sprite-sample.png", 1024);
        };
        sampleImg.src = SAMPLE_SPRITE_SVG;
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Pixel Art Sprite Scaler & Nearest-Neighbor Resizer",
        "url": "https://twistertools.com/tools/image-tools/pixel-art-scaler",
        "description": "Browser-native pixel art sprite scaler and nearest-neighbor resizer. Upscale retro sprites and game pixel art to 4K without blur, bilinear bleeding, or loss of clarity.",
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
                "name": "What is Nearest-Neighbor interpolation and why is it essential for pixel art?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nearest-Neighbor interpolation is an image resampling algorithm that maps each target pixel directly to the color of the closest original source pixel without calculating mathematical weighted averages. Standard image scalers use bilinear or bicubic filtering, which interpolates surrounding color gradients, causing crisp, hard-edged pixel sprites to appear blurry and smudged. Nearest-neighbor preserves 100% hard-edged crispness."
                }
            },
            {
                "@type": "Question",
                "name": "Why do classic image editors blur low-resolution pixel art when enlarging?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Most photo viewers and browsers optimize for natural continuous-tone photography by defaulting to multi-tap bilinear, bicubic, or Lanczos filtering. These algorithms assume color transitions represent real-world optical blurs, creating unwanted intermediary anti-aliased gradient fringes around 8-bit and 16-bit sprites."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I upscale pixel art sprites using integer scale multipliers (2x, 4x, 8x)?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Non-integer scaling factors (such as 1.5x or 2.7x) create uneven pixel grid distributions because fractional pixels cannot exist on a physical display matrix. This introduces uneven sprite lines, visual jitter, and 'shimmering' artifacts. Integer scaling ensures that every single source texel converts into an exact, uniform square block of 2x2, 4x4, or 8x8 pixels."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool upload my proprietary game sprites or graphics to a cloud server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates 100% client-side inside your browser sandbox using HTML5 Canvas 2D contexts and zero-copy ArrayBuffers. Your sprites, game assets, and artwork are never transferred to an external server or saved remotely."
                }
            },
            {
                "@type": "Question",
                "name": "How does CSS image-rendering: pixelated interact with scaled sprite assets?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The CSS rule 'image-rendering: pixelated' instructs the client browser GPU to apply nearest-neighbor filtering in real time when rendering an HTML img or canvas element larger than its native geometry. However, exporting a genuinely upscaled bitmap file via this tool guarantees crisp fidelity in game engines, print media, and social platforms that lack CSS rendering control."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between PNG and WebP exports for pixel art?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Both formats offer lossless compression modes ideal for palette-based pixel art. Lossless PNG offers ubiquitous compatibility across all retro game engines, Unity, Godot, and legacy systems. Lossless WebP can yield 15% to 30% smaller file payloads for modern web deployment while maintaining absolute pixel purity."
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

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Source Upload */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Panel Header & Reset */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Scaler Engine Controls
                            </h2>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                Reset
                            </button>
                        </div>

                        {/* Drag & Drop Upload Zone */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleFileUpload(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${isDragging
                                ? "border-indigo-600 bg-indigo-50/50"
                                : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                                }`}
                        >
                            <input aria-label="Upload file"
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/gif,image/webp,image/jpeg,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileUpload(e.target.files[0]);
                                    }
                                }}
                            />
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Upload className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                    Click to load sprite or drag & drop
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Supports PNG, GIF, WebP, SVG (Lossless pixel extraction)
                                </p>
                            </div>
                            <div className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                Current: {imageMeta.name} ({imageMeta.originalWidth}×{imageMeta.originalHeight}px)
                            </div>
                        </div>

                        {/* Resampling Algorithm Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Resampling Interpolation Algorithm:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAlgorithm("nearest")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${algorithm === "nearest"
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Nearest-Neighbor (Zero Blur)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAlgorithm("bilinear")}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${algorithm === "bilinear"
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <Layers className="w-4 h-4" />
                                    Bilinear Smooth (Filtered)
                                </button>
                            </div>
                        </div>

                        {/* Scaling Mode Selection: Presets vs Custom */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700">Scaling Multiplier</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setUseCustomDimensions(false)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${!useCustomDimensions
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        Integer Steps
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseCustomDimensions(true)}
                                        className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer transition ${useCustomDimensions
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "text-slate-500 hover:text-slate-800"
                                            }`}
                                    >
                                        Custom Geometry
                                    </button>
                                </div>
                            </div>

                            {!useCustomDimensions ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                                        {SCALE_PRESETS.map((factor) => (
                                            <button
                                                key={factor}
                                                type="button"
                                                onClick={() => setScaleFactor(factor)}
                                                className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer border ${scaleFactor === factor
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {factor}x
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-600 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                        <span>Target Dimensions:</span>
                                        <span className="font-bold text-indigo-600">
                                            {targetWidth} × {targetHeight} px
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={customWidthId}
                                                className="text-xs font-bold text-slate-700 block"
                                            >
                                                Target Width (px)
                                            </label>
                                            <input aria-label="Input value" id={customWidthId}
                                                type="number"
                                                min="1"
                                                max="8192"
                                                value={customWidth}
                                                onChange={(e) =>
                                                    handleNumberInput(e, handleCustomWidthChange, 1, 8192)
                                                }
                                                className="w-full px-3 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label
                                                htmlFor={customHeightId}
                                                className="text-xs font-bold text-slate-700 block"
                                            >
                                                Target Height (px)
                                            </label>
                                            <input aria-label="Input value" id={customHeightId}
                                                type="number"
                                                min="1"
                                                max="8192"
                                                value={customHeight}
                                                onChange={(e) =>
                                                    handleNumberInput(e, handleCustomHeightChange, 1, 8192)
                                                }
                                                className="w-full px-3 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                                        <input aria-label="Lock Aspect Ratio"
                                            type="checkbox"
                                            checked={lockAspectRatio}
                                            onChange={(e) => setLockAspectRatio(e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                        />
                                        <span>Constrain Proportions (Lock Native Aspect Ratio)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Export Format Settings */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className="text-xs font-bold text-slate-700 block">Export Target Container:</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setExportFormat("png")}
                                    className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer border flex items-center justify-center gap-1.5 ${exportFormat === "png"
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <FileImage className="w-4 h-4" />
                                    PNG (Lossless 32-bit Alpha)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExportFormat("webp")}
                                    className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer border flex items-center justify-center gap-1.5 ${exportFormat === "webp"
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                        }`}
                                >
                                    <FileImage className="w-4 h-4" />
                                    WebP (Lossless Web Payload)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Left Panel Footer Action */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Download Scaled Sprite ({targetWidth}×{targetHeight}px)
                        </button>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 100% In-Browser Execution
                            </span>
                            <span>Direct Canvas2D Buffer Export</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Interactive Canvas Visualizer */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        {/* Visualizer Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Real-Time Sprite Canvas
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPixelGrid(!showPixelGrid)}
                                    className={`px-2 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition cursor-pointer ${showPixelGrid
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                        : "bg-slate-50 border-slate-200 text-slate-600"
                                        }`}
                                    title="Toggle pixel grid backdrop"
                                >
                                    <Grid className="w-3.5 h-3.5" />
                                    Grid
                                </button>
                            </div>
                        </div>

                        {/* Canvas Viewport Box */}
                        <div
                            className={`relative w-full h-80 rounded-xl overflow-auto p-4 flex items-center justify-center border border-slate-200 ${showPixelGrid
                                ? "bg-slate-900 [background-image:linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] [background-size:16px_16px]"
                                : "bg-slate-950"
                                }`}
                        >
                            <canvas
                                ref={canvasRef}
                                style={{
                                    imageRendering: algorithm === "nearest" ? "pixelated" : "auto",
                                    transform: `scale(${previewZoom / 100})`,
                                    transformOrigin: "center center",
                                }}
                                className="max-w-none shadow-2xl transition-transform duration-150 rounded border border-white/10"
                            />
                        </div>

                        {/* Interactive Viewport Zoom Slider */}
                        <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <label htmlFor={zoomInputId} className="flex items-center gap-1">
                                    <ZoomIn className="w-3.5 h-3.5 text-indigo-600" />
                                    Stage Viewport Zoom:
                                </label>
                                <span className="font-mono text-slate-600">{previewZoom}%</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPreviewZoom((z) => Math.max(25, z - 25))}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <input aria-label="Adjust slider value"
                                    id={zoomInputId}
                                    type="range"
                                    min="25"
                                    max="400"
                                    step="25"
                                    value={previewZoom}
                                    onChange={(e) => setPreviewZoom(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPreviewZoom((z) => Math.min(400, z + 25))}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Technical Metadata Matrix */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Original</span>
                                <span className="font-mono text-xs font-bold text-slate-800">
                                    {imageMeta.originalWidth}×{imageMeta.originalHeight}
                                </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Output</span>
                                <span className="font-mono text-xs font-bold text-indigo-600">
                                    {targetWidth}×{targetHeight}
                                </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Scale</span>
                                <span className="font-mono text-xs font-bold text-slate-800">
                                    {useCustomDimensions
                                        ? `${(targetWidth / (imageMeta.originalWidth || 1)).toFixed(2)}x`
                                        : `${scaleFactor}x`}
                                </span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Filtering</span>
                                <span className="font-mono text-xs font-bold text-slate-800 capitalize">
                                    {algorithm}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            Hardware Accelerated Canvas Compositing
                        </span>
                        <span className="font-mono text-indigo-600 font-semibold uppercase">{exportFormat} Output</span>
                    </div>
                </div>
            </div>

            {/* Below-The-Fold High-Value SEO Content Cards */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Resampling Mathematics */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematics of Nearest-Neighbor Interpolation vs Bilinear Blurring
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Digital image scaling requires a mathematical strategy to populate pixels when magnifying a source grid onto a larger target frame. In continuous photography, surrounding color values blend naturally. In pixel art, however, intentional single-pixel precision defines the entire aesthetic. Resampling pixel art with standard bilinear or bicubic filtering destroys this fidelity by averaging edge values into blurred gradients.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Nearest-Neighbor
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Evaluates the exact Euclidean coordinate in the source bitmap and maps it without modification: {"$P(x, y) = P_{\\\\text{src}}(\\\\lfloor x / s \\\\rfloor, \\\\lfloor y / s \\\\rfloor)$"}. This produces crisp, un-feathered square edges.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Bilinear Filtering
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Computes a weighted average across the four closest adjacent pixels. While optimal for organic high-resolution photography, it creates muddy color bleeding around high-contrast sprite borders.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Integer Scaling
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Multiplying source geometry by whole integers {"($2\\\\times, 3\\\\times, 4\\\\times, 8\\\\times$)"} guarantees that each original sprite pixel becomes a perfect, uniform square grid with zero shimmering or pixel distortion.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Client-Side Canvas 2D Nearest-Neighbor Blueprint
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            To achieve mathematically pure nearest-neighbor magnification in modern web browsers, modern Canvas 2D contexts require disabling internal smoothing before rendering:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// Disable bilinear antialiasing on the canvas rasterizer
ctx.imageSmoothingEnabled = false;

// Scale and blit source pixels onto target coordinates
canvas.width = sourceImage.width * scaleMultiplier;
canvas.height = sourceImage.height * scaleMultiplier;
ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Analysis Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Comparative Matrix: Upscaling Algorithms & Formats
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the correct upscaling pipeline and container file format ensures maximum visual fidelity and compatibility across game engines like Godot, Unity, and Unreal Engine:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Method / Format</th>
                                    <th className="p-3">Edge Clarity</th>
                                    <th className="p-3">Color Purity</th>
                                    <th className="p-3">Transparency (Alpha)</th>
                                    <th className="p-3">Best Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Nearest-Neighbor (PNG)</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Crisp / Razor-Sharp</td>
                                    <td className="p-3 text-emerald-600 font-bold">Exact Palette Preserved</td>
                                    <td className="p-3 font-semibold text-slate-900">Lossless 32-bit</td>
                                    <td className="p-3">Game sprites, UI sheets, high-res prints</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Nearest-Neighbor (WebP)</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Crisp / Razor-Sharp</td>
                                    <td className="p-3 text-emerald-600 font-bold">Exact Palette Preserved</td>
                                    <td className="p-3 font-semibold text-slate-900">Lossless 32-bit</td>
                                    <td className="p-3">Web games, web graphics, small downloads</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Bilinear Filtering</td>
                                    <td className="p-3 text-rose-600 font-bold">Blurred / Fuzzy Edges</td>
                                    <td className="p-3 text-amber-600 font-bold">Averaged / Gradient Bleed</td>
                                    <td className="p-3 font-semibold text-slate-900">Fringed Alpha Boundary</td>
                                    <td className="p-3">Continuous-tone photographs, soft shadows</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS image-rendering</td>
                                    <td className="p-3 text-emerald-600 font-bold">Crisp On-Screen Only</td>
                                    <td className="p-3 text-emerald-600 font-bold">Depends on client browser</td>
                                    <td className="p-3 font-semibold text-slate-900">Display Only (No File)</td>
                                    <td className="p-3">Real-time DOM scaling without file re-export</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices & Game Engine Workflows */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Workflow Optimization for Game Developers & Digital Artists
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Exporting pixel art for external software, online portfolios, and print packaging requires balancing file size against resolution limits:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Production Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Always Prefer Integer Multipliers:</strong> Use {"$2\\\\times, 4\\\\times, 8\\\\times,$ or $16\\\\times$"}. Non-integer scales force uneven pixel rounding, creating asymmetrical characters and misaligned eyes.
                                </li>
                                <li>
                                    • <strong>Upscale for Social Previews:</strong> Modern social media algorithms compress low-resolution images into low-bitrate JPEGs. Upscaling a {"$16\\\\times 16$"} sprite to {"$1024\\\\times 1024$"} before sharing prevents blurry compression artifacts.
                                </li>
                                <li>
                                    • <strong>Retain Master Files at 1x:</strong> Keep your canonical raw master sprite sheets at {"$1\\\\times$"} native resolution in your source control, generating upscaled assets programmatically or on-demand.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Pitfalls
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Lossy JPEG Compression:</strong> Never save pixel art as standard JPEG. Discrete Cosine Transform (DCT) block coding introduces ringing artifacts around high-contrast pixel boundaries.
                                </li>
                                <li>
                                    • <strong>Unconstrained Custom Aspect Ratios:</strong> Manually entering mismatched width and height values warps sprite proportions and stretches circular pixel clusters into uneven ovals.
                                </li>
                                <li>
                                    • <strong>Ignoring Engine Texture Filter Settings:</strong> In Unity and Godot, ensure texture import settings specify Filter Mode: Point (No Filter) to maintain nearest-neighbor rendering inside your scene.
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
                                What is Nearest-Neighbor interpolation and why is it essential for pixel art?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Nearest-Neighbor interpolation is an image resampling algorithm that maps each target pixel directly to the color of the closest original source pixel without calculating mathematical weighted averages. Standard image scalers use bilinear or bicubic filtering, which interpolates surrounding color gradients, causing crisp, hard-edged pixel sprites to appear blurry and smudged. Nearest-neighbor preserves 100% hard-edged crispness.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why do classic image editors blur low-resolution pixel art when enlarging?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Most photo viewers and browsers optimize for natural continuous-tone photography by defaulting to multi-tap bilinear, bicubic, or Lanczos filtering. These algorithms assume color transitions represent real-world optical blurs, creating unwanted intermediary anti-aliased gradient fringes around 8-bit and 16-bit sprites.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I upscale pixel art sprites using integer scale multipliers (2x, 4x, 8x)?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Non-integer scaling factors (such as 1.5x or 2.7x) create uneven pixel grid distributions because fractional pixels cannot exist on a physical display matrix. This introduces uneven sprite lines, visual jitter, and &quot;shimmering&quot; artifacts. Integer scaling ensures that every single source texel converts into an exact, uniform square block of 2x2, 4x4, or 8x8 pixels.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool upload my proprietary game sprites or graphics to a cloud server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates 100% client-side inside your browser sandbox using HTML5 Canvas 2D contexts and zero-copy ArrayBuffers. Your sprites, game assets, and artwork are never transferred to an external server or saved remotely.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does CSS image-rendering: pixelated interact with scaled sprite assets?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The CSS rule &quot;image-rendering: pixelated&quot; instructs the client browser GPU to apply nearest-neighbor filtering in real time when rendering an HTML img or canvas element larger than its native geometry. However, exporting a genuinely upscaled bitmap file via this tool guarantees crisp fidelity in game engines, print media, and social platforms that lack CSS rendering control.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between PNG and WebP exports for pixel art?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Both formats offer lossless compression modes ideal for palette-based pixel art. Lossless PNG offers ubiquitous compatibility across all retro game engines, Unity, Godot, and legacy systems. Lossless WebP can yield 15% to 30% smaller file payloads for modern web deployment while maintaining absolute pixel purity.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}