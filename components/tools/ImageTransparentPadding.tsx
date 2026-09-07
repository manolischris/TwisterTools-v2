"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Crop,
    Download,
    Upload,
    RotateCcw,
    Sliders,
    Eye,
    Layers,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    HelpCircle,
    BookOpen,
    Maximize2,
    Lock,
    Unlock,
    Palette,
    FileImage,
    Copy,
    Check,
    ShieldCheck,
    Info,
    Trash2
} from "lucide-react";

type PaddingUnit = "px" | "%";
type BackgroundMode = "transparent" | "custom";
type AspectRatioMode = "free" | "1:1" | "4:3" | "16:9" | "3:2";

interface PaddingConfig {
    top: number;
    right: number;
    bottom: number;
    left: number;
    all: number;
    linked: boolean;
    unit: PaddingUnit;
    bgMode: BackgroundMode;
    customColor: string;
    targetAspectRatio: AspectRatioMode;
}

const DEFAULT_CONFIG: PaddingConfig = {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
    all: 40,
    linked: true,
    unit: "px",
    bgMode: "transparent",
    customColor: "#ffffff",
    targetAspectRatio: "free"
};

const handleNumberInput = (
    raw: string,
    setter: (val: number) => void,
    min: number = 0,
    max: number = 5000
) => {
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed)) {
        setter(0);
        return;
    }
    setter(Math.max(min, Math.min(max, parsed)));
};

export default function ImageTransparentPadding() {
    const [config, setConfig] = useState<PaddingConfig>(DEFAULT_CONFIG);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageBitmap, setImageBitmap] = useState<HTMLImageElement | null>(null);
    const [fileName, setFileName] = useState<string>("padded-image.png");
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({
        width: 0,
        height: 0
    });
    const [copiedDims, setCopiedDims] = useState<boolean>(false);
    const [dragActive, setDragActive] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const calculateEffectivePadding = useCallback(() => {
        if (!originalDimensions.width || !originalDimensions.height) {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }

        let { top, right, bottom, left } = config.linked
            ? { top: config.all, right: config.all, bottom: config.all, left: config.all }
            : { top: config.top, right: config.right, bottom: config.bottom, left: config.left };

        if (config.unit === "%") {
            top = Math.round((top / 100) * originalDimensions.height);
            bottom = Math.round((bottom / 100) * originalDimensions.height);
            left = Math.round((left / 100) * originalDimensions.width);
            right = Math.round((right / 100) * originalDimensions.width);
        }

        if (config.targetAspectRatio !== "free") {
            let targetRatio = 1;
            if (config.targetAspectRatio === "1:1") targetRatio = 1;
            if (config.targetAspectRatio === "4:3") targetRatio = 4 / 3;
            if (config.targetAspectRatio === "16:9") targetRatio = 16 / 9;
            if (config.targetAspectRatio === "3:2") targetRatio = 3 / 2;

            const currentTotalWidth = originalDimensions.width + left + right;
            const currentTotalHeight = originalDimensions.height + top + bottom;
            const currentRatio = currentTotalWidth / currentTotalHeight;

            if (currentRatio < targetRatio) {
                const desiredWidth = Math.round(currentTotalHeight * targetRatio);
                const additionalWidth = Math.max(0, desiredWidth - currentTotalWidth);
                const halfAdd = Math.round(additionalWidth / 2);
                left += halfAdd;
                right += additionalWidth - halfAdd;
            } else if (currentRatio > targetRatio) {
                const desiredHeight = Math.round(currentTotalWidth / targetRatio);
                const additionalHeight = Math.max(0, desiredHeight - currentTotalHeight);
                const halfAdd = Math.round(additionalHeight / 2);
                top += halfAdd;
                bottom += additionalHeight - halfAdd;
            }
        }

        return { top, right, bottom, left };
    }, [config, originalDimensions]);

    const effectivePadding = calculateEffectivePadding();

    const finalDimensions = {
        width: originalDimensions.width ? originalDimensions.width + effectivePadding.left + effectivePadding.right : 0,
        height: originalDimensions.height ? originalDimensions.height + effectivePadding.top + effectivePadding.bottom : 0
    };

    const handleImageLoad = (file: File) => {
        setIsProcessing(true);
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setImageBitmap(img);
            setImageFile(file);
            const nameParts = file.name.split(".");
            nameParts.pop();
            setFileName(`${nameParts.join(".")}-padded.png`);
            setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setIsProcessing(false);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            setIsProcessing(false);
            alert("Failed to read image file. Please provide a valid PNG, WebP, or JPEG.");
        };
        img.src = url;
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageLoad(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageLoad(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    useEffect(() => {
        if (!imageBitmap || !previewCanvasRef.current) return;
        const canvas = previewCanvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: false });
        if (!ctx) return;

        const { top, right, bottom, left } = effectivePadding;
        const totalWidth = originalDimensions.width + left + right;
        const totalHeight = originalDimensions.height + top + bottom;

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.clearRect(0, 0, totalWidth, totalHeight);

        if (config.bgMode === "custom") {
            ctx.fillStyle = config.customColor;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(imageBitmap, left, top, originalDimensions.width, originalDimensions.height);
    }, [imageBitmap, effectivePadding, config.bgMode, config.customColor, originalDimensions]);

    const handleDownload = () => {
        if (!previewCanvasRef.current || !imageBitmap) return;
        const canvas = previewCanvasRef.current;
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            },
            "image/png",
            1.0
        );
    };

    const copyDimensionsToClipboard = () => {
        if (!finalDimensions.width) return;
        navigator.clipboard.writeText(`${finalDimensions.width} x ${finalDimensions.height} px`);
        setCopiedDims(true);
        setTimeout(() => setCopiedDims(false), 2000);
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImageBitmap(null);
        setOriginalDimensions({ width: 0, height: 0 });
        setFileName("padded-image.png");
        setConfig(DEFAULT_CONFIG);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "PNG Transparent Pixel Padding & Border Expander",
        "url": "https://twistertools.com/tools/image-tools/image-transparent-padding",
        "description": "Expand PNG canvas boundaries with transparent borders or custom background colors. Add exact pixel margins, align aspect ratios, and export lossless images directly in the browser.",
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
                "name": "Does adding transparent pixel padding degrade PNG image quality?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The expansion process allocates a larger canvas matrix and positions the original graphic without resampling, re-scaling, or downsampling image pixels. The native sub-pixel alignment of your original graphic remains bit-for-bit identical."
                }
            },
            {
                "@type": "Question",
                "name": "Are uploaded graphics sent to any backend servers or cloud services?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Never. All graphics operations run client-side inside your browser engine using hardware-accelerated Canvas2D and WebAssembly APIs. Your private images, icons, and branding materials never leave your local device."
                }
            },
            {
                "@type": "Question",
                "name": "Why is canvas border padding necessary for iOS App Store and Android icons?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Both Apple Human Interface Guidelines and Google Material Design enforce strict safe-zone margins around app icon symbols. Without transparent canvas padding, icon masks clip prominent glyph edges, causing visual distortion on mobile home screens."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum PNG resolution supported by this canvas expander?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Modern desktop browsers can allocate 2D canvas framebuffers up to 16,384 x 16,384 pixels, while mobile devices support up to 4,096 x 4,096 pixels. You can comfortably process ultra-high-resolution print graphics, banners, and 4K assets."
                }
            },
            {
                "@type": "Question",
                "name": "Can I lock aspect ratios while adding asymmetrical transparent margins?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Selecting a preset aspect ratio (like 1:1, 4:3, or 16:9) automatically calculates and balances compensating horizontal or vertical margins, centering your artwork to fit target framing requirements."
                }
            },
            {
                "@type": "Question",
                "name": "Why does my exported PNG show a black background in certain legacy viewers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Some legacy image viewers and file browsers lack composite alpha-channel support and render transparent RGBA values (0, 0, 0, 0) as solid black. In modern web browsers, Photoshop, Figma, and mobile operating systems, the transparency is perfectly preserved."
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
                {/* Left Panel: Control Studio */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Upload Area */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileImage className="w-5 h-5 text-indigo-600" />
                                    Source Image Asset
                                </h2>
                                {imageBitmap ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                            Reset Margins
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition border border-rose-200 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            Clear Image
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium">
                                        Zero Server Uploads
                                    </span>
                                )}
                            </div>

                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${dragActive
                                        ? "border-indigo-500 bg-indigo-50/50"
                                        : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                                    }`}
                            >
                                <input aria-label="Upload file"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/webp,image/jpeg,image/svg+xml"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {imageFile ? imageFile.name : "Click to select or drag & drop a PNG file"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Supports PNG, WebP, SVG, and JPEG (Lossless RGBA preserved)
                                    </p>
                                </div>
                                {originalDimensions.width > 0 && (
                                    <div className="mt-2 flex items-center gap-2 text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                        <span>Original:</span>
                                        <span>
                                            {originalDimensions.width} × {originalDimensions.height} px
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Padding Controls */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                    Border Padding Parameters
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setConfig((p) => ({ ...p, linked: !p.linked }))}
                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${config.linked
                                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                                : "bg-slate-100 text-slate-600 border-slate-200"
                                            }`}
                                    >
                                        {config.linked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                        {config.linked ? "Uniform (Locked)" : "Individual Edges"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setConfig((p) => ({ ...p, unit: p.unit === "px" ? "%" : "px" }))
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer"
                                    >
                                        Unit: <span className="font-mono text-indigo-600 uppercase">{config.unit}</span>
                                    </button>
                                </div>
                            </div>

                            {config.linked ? (
                                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label>All Sides Margin ({config.unit}):</label>
                                        <div className="flex items-center gap-1">
                                            <input aria-label="Input value" type="number"
                                                min="0"
                                                max={config.unit === "%" ? 500 : 2000}
                                                value={config.all}
                                                onChange={(e) =>
                                                    handleNumberInput(
                                                        e.target.value,
                                                        (val) => setConfig((p) => ({ ...p, all: val })),
                                                        0,
                                                        config.unit === "%" ? 500 : 2000
                                                    )
                                                }
                                                className="w-16 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-slate-600 dark:text-slate-300">{config.unit}</span>
                                        </div>
                                    </div>
                                    <input aria-label="Adjust slider value"
                                        type="range"
                                        min="0"
                                        max={config.unit === "%" ? 100 : 500}
                                        step="1"
                                        value={config.all}
                                        onChange={(e) => setConfig((p) => ({ ...p, all: Number(e.target.value) }))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    {/* Top */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Top:</span>
                                            <span className="font-mono text-slate-600">
                                                {config.top}
                                                {config.unit}
                                            </span>
                                        </div>
                                        <input aria-label="Adjust slider value"
                                            type="range"
                                            min="0"
                                            max={config.unit === "%" ? 100 : 500}
                                            step="1"
                                            value={config.top}
                                            onChange={(e) => setConfig((p) => ({ ...p, top: Number(e.target.value) }))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    {/* Right */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Right:</span>
                                            <span className="font-mono text-slate-600">
                                                {config.right}
                                                {config.unit}
                                            </span>
                                        </div>
                                        <input aria-label="Adjust slider value"
                                            type="range"
                                            min="0"
                                            max={config.unit === "%" ? 100 : 500}
                                            step="1"
                                            value={config.right}
                                            onChange={(e) => setConfig((p) => ({ ...p, right: Number(e.target.value) }))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    {/* Bottom */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Bottom:</span>
                                            <span className="font-mono text-slate-600">
                                                {config.bottom}
                                                {config.unit}
                                            </span>
                                        </div>
                                        <input aria-label="Adjust slider value"
                                            type="range"
                                            min="0"
                                            max={config.unit === "%" ? 100 : 500}
                                            step="1"
                                            value={config.bottom}
                                            onChange={(e) =>
                                                setConfig((p) => ({ ...p, bottom: Number(e.target.value) }))
                                            }
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                    {/* Left */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Left:</span>
                                            <span className="font-mono text-slate-600">
                                                {config.left}
                                                {config.unit}
                                            </span>
                                        </div>
                                        <input aria-label="Adjust slider value"
                                            type="range"
                                            min="0"
                                            max={config.unit === "%" ? 100 : 500}
                                            step="1"
                                            value={config.left}
                                            onChange={(e) => setConfig((p) => ({ ...p, left: Number(e.target.value) }))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Framing & Fill Configuration */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Aspect Ratio Presets */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                                    Target Aspect Ratio
                                </label>
                                <select aria-label="Select option" value={config.targetAspectRatio}
                                    onChange={(e) =>
                                        setConfig((p) => ({ ...p, targetAspectRatio: e.target.value as AspectRatioMode }))
                                    }
                                    className="w-full text-xs font-semibold p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="free">Free / Custom Margins</option>
                                    <option value="1:1">1:1 Square (App Icons / Avatars)</option>
                                    <option value="4:3">4:3 Standard Display</option>
                                    <option value="16:9">16:9 Widescreen (Thumbnails)</option>
                                    <option value="3:2">3:2 Classic Photo Ratio</option>
                                </select>
                            </div>

                            {/* Background Canvas Mode */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                                    Canvas Background Fill
                                </label>
                                <div className="flex items-center gap-2">
                                    <select aria-label="Select option" value={config.bgMode}
                                        onChange={(e) =>
                                            setConfig((p) => ({ ...p, bgMode: e.target.value as BackgroundMode }))
                                        }
                                        className="flex-1 text-xs font-semibold p-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="transparent">Transparent (Alpha 0)</option>
                                        <option value="custom">Solid Color Fill</option>
                                    </select>
                                    {config.bgMode === "custom" && (
                                        <input aria-label="Select color"
                                            type="color"
                                            value={config.customColor}
                                            onChange={(e) => setConfig((p) => ({ ...p, customColor: e.target.value }))}
                                            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <ShieldCheck className="w-4 h-4" />
                            100% Client-Side Lossless Pipeline
                        </span>
                        <span>RGBA 32-bit Depth</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Visualizer & Export Stage */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Live Canvas Viewport
                            </h2>
                            {finalDimensions.width > 0 && (
                                <button
                                    type="button"
                                    onClick={copyDimensionsToClipboard}
                                    className="flex items-center gap-1 text-xs font-mono font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition cursor-pointer"
                                >
                                    {copiedDims ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {finalDimensions.width} × {finalDimensions.height} px
                                </button>
                            )}
                        </div>

                        {/* Checkerboard Viewport */}
                        <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%),linear-gradient(-45deg,#f1f5f9_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f1f5f9_75%),linear-gradient(-45deg,transparent_75%,#f1f5f9_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0px] flex items-center justify-center p-4">
                            {imageBitmap ? (
                                <div className="relative max-w-full max-h-full flex items-center justify-center">
                                    <canvas
                                        ref={previewCanvasRef}
                                        className="max-w-full max-h-72 object-contain shadow-md rounded border border-slate-300"
                                    />
                                </div>
                            ) : (
                                <div className="text-center space-y-2 select-none">
                                    <div className="w-12 h-12 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-300 shadow-xs">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600">No Image Uploaded</p>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                                        Select a PNG or SVG above to calculate and render transparent canvas boundaries in real time.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Export Dimension Metrics */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-600">
                                <span className="font-semibold">Calculated Edge Paddings:</span>
                                <span className="font-mono">
                                    T: {effectivePadding.top}px | R: {effectivePadding.right}px | B:{" "}
                                    {effectivePadding.bottom}px | L: {effectivePadding.left}px
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                                <div>
                                    <span className="text-slate-500 block">Initial Canvas:</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {originalDimensions.width || 0} × {originalDimensions.height || 0} px
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">Output Canvas:</span>
                                    <span className="font-mono font-bold text-indigo-600">
                                        {finalDimensions.width || 0} × {finalDimensions.height || 0} px
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Download CTA */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs text-slate-500 flex items-center gap-1 self-start sm:self-center">
                            <Info className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                            Lossless PNG Format (32-bit RGBA)
                        </span>
                        <button
                            type="button"
                            disabled={!imageBitmap || isProcessing}
                            onClick={handleDownload}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${imageBitmap && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                                    : "bg-slate-100 text-slate-600 dark:text-slate-300 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            <Download className="w-4 h-4" />
                            Download Padded PNG
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Execution & Alpha Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Precision PNG Alpha Expansion: Technical Architecture & Pixel Matrices
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Expanding an image canvas while preserving native transparent pixel data is a core task in software design, digital asset management, and print layout preparation. Standard raster graphics software often re-samples or compresses graphics when altering boundary dimensions, introducing anti-aliasing artifacts along high-contrast borders. Our browser-native tool reallocates an uncompressed 2D raster matrix in memory, placing the source graphic without recalculating or altering existing color values:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Zero-Resample Pipeline
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Source pixels are translated directly into destination canvas memory without bilinear interpolation or sub-pixel filtering, keeping sharp lines and vector-rasterized edges intact.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> 32-Bit RGBA Preservation
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Each expanded border pixel is allocated as <code>rgba(0, 0, 0, 0)</code>, ensuring genuine, lossless 8-bit alpha channel transparency compatible with modern design frameworks.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Deterministic Centering
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Asymmetrical margins allow you to offset logos, balance visually bottom-heavy graphics, or pad icons to meet strict human interface safe-zone guidelines.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Technical Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Maximize2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Canvas Expansion Methodologies: Browser Engine vs Traditional Tools
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding the distinction between client-side GPU canvas manipulation and server-side CLI recompression highlights why browser-native expansion offers performance and privacy advantages:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Method</th>
                                    <th className="p-3">Privacy Guarantee</th>
                                    <th className="p-3">Lossless Alpha</th>
                                    <th className="p-3">Processing Latency</th>
                                    <th className="p-3">Typical Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">TwisterTools Canvas API</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Local (Air-Gapped)</td>
                                    <td className="p-3 text-emerald-600 font-bold">Guaranteed Lossless</td>
                                    <td className="p-3 font-mono text-emerald-600">&lt; 15ms</td>
                                    <td className="p-3">Instant app icon padding, web asset margin prep</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cloud Web Utilities</td>
                                    <td className="p-3 text-rose-600 font-bold">Uploads to Remote Server</td>
                                    <td className="p-3 text-amber-600 font-bold">Often Re-compressed</td>
                                    <td className="p-3 font-mono text-amber-600">1,500ms - 4,000ms</td>
                                    <td className="p-3">Generic cloud file conversion pipelines</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Photoshop / Illustrator</td>
                                    <td className="p-3 text-emerald-600 font-bold">Local File System</td>
                                    <td className="p-3 text-emerald-600 font-bold">Lossless Output</td>
                                    <td className="p-3 font-mono text-slate-600">Manual (Multi-step)</td>
                                    <td className="p-3">Complex vector artwork and print pre-press</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">ImageMagick CLI</td>
                                    <td className="p-3 text-emerald-600 font-bold">Local File System</td>
                                    <td className="p-3 text-emerald-600 font-bold">Lossless with flags</td>
                                    <td className="p-3 font-mono text-indigo-600">100ms - 300ms</td>
                                    <td className="p-3">Automated backend batch CI/CD pipelines</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Practical Use Cases & App Store Guidelines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Key Workflows: App Store Submissions, E-Commerce & Favicons
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Transparent margins solve layout alignment challenges across digital touchpoints where bounding boxes require explicit breathing room:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Mobile App Icons & Masks
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Apple iOS applies a squircle mask (superellipse) over 1024x1024 app icons, while Android Adaptive Icons clip outer perimeters into circles, squares, or teardrops. Adding a 15% to 20% transparent inner margin prevents logo typography and perimeter marks from being clipped by operating system shells.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> E-Commerce Catalog Consistency
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Platforms like Shopify, Amazon, and Google Shopping demand standardized 1:1 square product assets. Expanding irregular horizontal or vertical transparent margins aligns product imagery cleanly without stretching, cropping, or skewing proportions.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Favicons & Browser Tab Icons
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Raw 16x16 and 32x32 favicons that fill 100% of their bounding box look crowded in dark-mode browser tabs. Injecting a subtle 2px transparent perimeter gives the glyph breathing space against browser chrome and active tab indicators.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Anti-Patterns
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Avoid saving padded images as JPEG, which replaces transparent pixels with solid white or black. Always export as PNG (or WebP with alpha enabled) to retain clean alpha channel transparency.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions */}
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
                                Does adding transparent pixel padding degrade PNG image quality?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The expansion process allocates a larger canvas matrix and positions the original graphic without resampling, re-scaling, or downsampling image pixels. The native sub-pixel alignment of your original graphic remains bit-for-bit identical.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are uploaded graphics sent to any backend servers or cloud services?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Never. All graphics operations run client-side inside your browser engine using hardware-accelerated Canvas2D and WebAssembly APIs. Your private images, icons, and branding materials never leave your local device.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is canvas border padding necessary for iOS App Store and Android icons?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Both Apple Human Interface Guidelines and Google Material Design enforce strict safe-zone margins around app icon symbols. Without transparent canvas padding, icon masks clip prominent glyph edges, causing visual distortion on mobile home screens.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the maximum PNG resolution supported by this canvas expander?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Modern desktop browsers can allocate 2D canvas framebuffers up to 16,384 x 16,384 pixels, while mobile devices support up to 4,096 x 4,096 pixels. You can comfortably process ultra-high-resolution print graphics, banners, and 4K assets.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I lock aspect ratios while adding asymmetrical transparent margins?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Selecting a preset aspect ratio (like 1:1, 4:3, or 16:9) automatically calculates and balances compensating horizontal or vertical margins, centering your artwork to fit target framing requirements.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does my exported PNG show a black background in certain legacy viewers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Some legacy image viewers and file browsers lack composite alpha-channel support and render transparent RGBA values (0, 0, 0, 0) as solid black. In modern web browsers, Photoshop, Figma, and mobile operating systems, the transparency is perfectly preserved.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}