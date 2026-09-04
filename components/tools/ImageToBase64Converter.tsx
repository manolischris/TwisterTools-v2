"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
    Image as ImageIcon,
    UploadCloud,
    FileCode,
    Copy,
    Check,
    Download,
    Trash2,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Code2,
    Sliders,
    Layers,
    Cpu,
    Sparkles,
    AlertCircle,
    Info,
    FileCheck2,
    Maximize2,
    ExternalLink
} from "lucide-react";

interface EncodedImageMeta {
    fileName: string;
    originalMime: string;
    targetMime: string;
    originalSizeBytes: number;
    base64Chars: number;
    approxBase64Bytes: number;
    inflationPercent: number;
    width: number;
    height: number;
    aspectRatio: string;
}

const SAMPLE_TINY_SVG =
    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%234f46e5%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%2306b6d4%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20rx%3D%2220%22%20fill%3D%22url(%23g)%22%2F%3E%3Cpath%20d%3D%22M30%2050%20L45%2065%20L70%2035%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%228%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
}

export default function ImageToBase64Converter() {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [rawBase64Payload, setRawBase64Payload] = useState<string>("");
    const [activeMime, setActiveMime] = useState<string>("image/png");
    const [includePrefix, setIncludePrefix] = useState<boolean>(true);
    const [targetOutputFormat, setTargetOutputFormat] = useState<"original" | "image/png" | "image/jpeg" | "image/webp">("original");
    const [quality, setQuality] = useState<number>(90);
    const [maxDimension, setMaxDimension] = useState<number>(0);
    const [sourceImageMeta, setSourceImageMeta] = useState<EncodedImageMeta | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const rawImageSourceRef = useRef<HTMLImageElement | null>(null);

    const constructFinalOutput = useCallback(
        (base64Payload: string, mime: string, prefix: boolean): string => {
            if (!base64Payload) return "";
            return prefix ? `data:${mime};base64,${base64Payload}` : base64Payload;
        },
        []
    );

    const encodeFileToPayload = useCallback(
        (img: HTMLImageElement, fileMeta: { name: string; size: number; originalMime: string }) => {
            try {
                const canvas = document.createElement("canvas");
                let targetWidth = img.naturalWidth || img.width || 1;
                let targetHeight = img.naturalHeight || img.height || 1;

                if (maxDimension > 0 && (targetWidth > maxDimension || targetHeight > maxDimension)) {
                    if (targetWidth > targetHeight) {
                        targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
                        targetWidth = maxDimension;
                    } else {
                        targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
                        targetHeight = maxDimension;
                    }
                }

                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    setErrorMessage("Browser 2D Context could not be initialized for base64 encoding.");
                    setIsProcessing(false);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                const resolvedMime = targetOutputFormat === "original" ? fileMeta.originalMime : targetOutputFormat;

                if (resolvedMime === "image/jpeg") {
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                }

                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                const dataUri = canvas.toDataURL(
                    resolvedMime,
                    resolvedMime === "image/jpeg" || resolvedMime === "image/webp" ? quality / 100 : undefined
                );

                const base64Only = dataUri.split(",")[1] || "";
                const divisor = gcd(targetWidth, targetHeight);
                const aspectRatio = `${targetWidth / divisor}:${targetHeight / divisor}`;
                const base64Bytes = Math.floor((base64Only.length * 3) / 4);
                const inflation = fileMeta.size > 0 ? ((base64Bytes - fileMeta.size) / fileMeta.size) * 100 : 33.3;

                setActiveMime(resolvedMime);
                setRawBase64Payload(base64Only);
                setPreviewUrl(dataUri);
                setSourceImageMeta({
                    fileName: fileMeta.name,
                    originalMime: fileMeta.originalMime,
                    targetMime: resolvedMime,
                    originalSizeBytes: fileMeta.size,
                    base64Chars: base64Only.length,
                    approxBase64Bytes: base64Bytes,
                    inflationPercent: inflation,
                    width: targetWidth,
                    height: targetHeight,
                    aspectRatio
                });
                setErrorMessage(null);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Canvas base64 transformation failed.";
                setErrorMessage(message);
            } finally {
                setIsProcessing(false);
            }
        },
        [maxDimension, targetOutputFormat, quality]
    );

    const handleProcessImageFile = useCallback(
        (file: File) => {
            if (!file.type.startsWith("image/")) {
                setErrorMessage("Unsupported file type. Please supply a valid PNG, JPG, WebP, SVG, or GIF image.");
                return;
            }

            setIsProcessing(true);
            setErrorMessage(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                if (!result) {
                    setErrorMessage("Could not parse file data.");
                    setIsProcessing(false);
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    rawImageSourceRef.current = img;
                    encodeFileToPayload(img, {
                        name: file.name,
                        size: file.size,
                        originalMime: file.type || "image/png"
                    });
                };
                img.onerror = () => {
                    setErrorMessage("Decoded graphics binary is invalid or corrupt.");
                    setIsProcessing(false);
                };
                img.src = result;
            };

            reader.onerror = () => {
                setErrorMessage("Local file reading error occurred.");
                setIsProcessing(false);
            };

            reader.readAsDataURL(file);
        },
        [encodeFileToPayload]
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleProcessImageFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleProcessImageFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleLoadSample = () => {
        setIsProcessing(true);
        setErrorMessage(null);

        const img = new Image();
        img.onload = () => {
            rawImageSourceRef.current = img;
            encodeFileToPayload(img, {
                name: "twister-sample-badge.svg",
                size: 612,
                originalMime: "image/svg+xml"
            });
        };
        img.src = SAMPLE_TINY_SVG;
    };

    const handleClear = () => {
        setPreviewUrl(null);
        setRawBase64Payload("");
        setSourceImageMeta(null);
        setErrorMessage(null);
        rawImageSourceRef.current = null;
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleApplySettings = () => {
        if (!rawImageSourceRef.current || !sourceImageMeta) return;
        setIsProcessing(true);
        encodeFileToPayload(rawImageSourceRef.current, {
            name: sourceImageMeta.fileName,
            size: sourceImageMeta.originalSizeBytes,
            originalMime: sourceImageMeta.originalMime
        });
    };

    const renderedOutputString = useMemo(() => {
        return constructFinalOutput(rawBase64Payload, activeMime, includePrefix);
    }, [rawBase64Payload, activeMime, includePrefix, constructFinalOutput]);

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDownloadTxt = () => {
        if (!renderedOutputString) return;
        const blob = new Blob([renderedOutputString], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `base64-${sourceImageMeta?.fileName || "export"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const htmlImgSnippet = useMemo(() => {
        if (!renderedOutputString) return "";
        return `<img src="${renderedOutputString}" alt="${sourceImageMeta?.fileName || "Embedded Image"}" />`;
    }, [renderedOutputString, sourceImageMeta]);

    const cssBgSnippet = useMemo(() => {
        if (!renderedOutputString) return "";
        return `background-image: url("${renderedOutputString}");`;
    }, [renderedOutputString]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Image to Base64 String Data URI Encoder",
        "url": "https://twistertools.com/tools/image-tools/image-to-base64-converter",
        "description": "Convert local PNG, JPEG, SVG, WebP, and GIF images into RFC 4648 Base64 strings and Data URIs entirely inside your browser with instant zero-knowledge client-side processing.",
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
                "name": "Does this tool upload my images to any server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates under a strictly local client-side sandbox. The HTML5 Canvas API and FileReader API serialize your visual files into ASCII base64 streams directly within your browser's private JavaScript runtime."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between a Data URI and a raw Base64 string?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A raw Base64 string contains only the encoded 64-character alphabet sequence without metadata headers. A Data URI prefixes the string with schema information (such as data:image/png;base64,), enabling web browsers, CSS rules, and HTML elements to parse and render the byte stream directly."
                }
            },
            {
                "@type": "Question",
                "name": "Why does my image file become larger after Base64 encoding?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Base64 represents 8-bit binary octets using 6-bit ASCII sextets. Because 4 ASCII characters are needed to encode every 3 binary bytes, Base64 introduces a constant ~33.3% computational size overhead."
                }
            },
            {
                "@type": "Question",
                "name": "When should I use Base64 images instead of hosting files on an edge CDN?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Base64 is optimal for micro-assets (< 2 KB), email newsletters requiring self-contained templates, low-quality image placeholders (LQIP) to avoid Cumulative Layout Shift (CLS), and offline-first Single Page Applications. External CDN URLs should be used for large photography to take advantage of browser HTTP caching."
                }
            },
            {
                "@type": "Question",
                "name": "Can transparent PNGs be encoded into Base64 JPEG strings?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When converting transparent images to JPEG (which does not support alpha channels), our canvas engine automatically applies a solid white background backplate to eliminate black alpha artifacts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Image Upload, Pipeline Settings, & Preview */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-5">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Source Image & Input Settings
                                </h2>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={handleLoadSample}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                                >
                                    Load Sample
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition border border-slate-200 cursor-pointer"
                                    title="Reset workspace"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${isDragging
                                ? "border-indigo-600 bg-indigo-50/60"
                                : "border-slate-300 hover:border-indigo-400 bg-slate-50/50"
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                    Click to browse or drop an image here
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Supports PNG, JPG, WebP, SVG, or GIF (up to 20 MB local parsing)
                                </p>
                            </div>
                        </div>

                        {/* Error Alert Box */}
                        {errorMessage && (
                            <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Error: </span>
                                    {errorMessage}
                                </div>
                            </div>
                        )}

                        {/* Image Preview Canvas */}
                        <div className="mt-4">
                            <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Source Image Visual
                            </span>
                            <div
                                className="w-full h-44 sm:h-52 rounded-xl border border-slate-200 flex items-center justify-center p-3 relative overflow-hidden"
                                style={{
                                    backgroundColor: "#f1f5f9",
                                    backgroundImage:
                                        "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                                    backgroundSize: "20px 20px",
                                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                                }}
                            >
                                {previewUrl ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={previewUrl}
                                            alt="Source preview"
                                            className="max-w-full max-h-full object-contain drop-shadow-md rounded"
                                        />
                                        <a
                                            href={previewUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 transition"
                                            title="Open in new tab"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-xs text-slate-500 font-medium">
                                            No image currently loaded in canvas buffer
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Input Transform Controls */}
                        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Pipeline Options
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Convert Output Format
                                    </label>
                                    <select
                                        value={targetOutputFormat}
                                        onChange={(e) => {
                                            setTargetOutputFormat(e.target.value as "original" | "image/png" | "image/jpeg" | "image/webp");
                                        }}
                                        className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="original">Preserve Original Format</option>
                                        <option value="image/png">PNG (Lossless / Alpha)</option>
                                        <option value="image/jpeg">JPEG (Opaque Solid)</option>
                                        <option value="image/webp">WebP (Modern Optimized)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                        Max Constraint (Width/Height)
                                    </label>
                                    <select
                                        value={maxDimension}
                                        onChange={(e) => setMaxDimension(Number(e.target.value))}
                                        className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value={0}>Original Dimensions</option>
                                        <option value={256}>Max 256 px (Thumbnail)</option>
                                        <option value={512}>Max 512 px (Avatar)</option>
                                        <option value={1024}>Max 1024 px (Card Hero)</option>
                                        <option value={1920}>Max 1920 px (Full HD)</option>
                                    </select>
                                </div>
                            </div>

                            {(targetOutputFormat === "image/jpeg" || targetOutputFormat === "image/webp") && (
                                <div>
                                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1">
                                        <span>Compression Quality</span>
                                        <span className="text-indigo-600">{quality}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={quality}
                                        onChange={(e) => setQuality(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleApplySettings}
                                disabled={!previewUrl || isProcessing}
                                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                {isProcessing ? "Recalculating..." : "Apply Pipeline Settings"}
                            </button>
                        </div>
                    </div>

                    {/* Metadata Diagnostics Bar */}
                    {sourceImageMeta ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Dimensions
                                </span>
                                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                    {sourceImageMeta.width} × {sourceImageMeta.height} px
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Original Size
                                </span>
                                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                    {formatBytes(sourceImageMeta.originalSizeBytes)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Base64 Size
                                </span>
                                <p className="text-xs sm:text-sm font-black text-indigo-600 mt-0.5">
                                    {formatBytes(sourceImageMeta.approxBase64Bytes)}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Inflation Overhead
                                </span>
                                <p className="text-xs sm:text-sm font-black text-amber-600 mt-0.5">
                                    +{sourceImageMeta.inflationPercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
                            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>Select or drop an image above to calculate dimension metrics.</span>
                        </div>
                    )}
                </div>

                {/* Right Workspace Panel: Generated Base64 String & Code Export */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-5">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Generated Base64 String
                                </h2>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={includePrefix}
                                        onChange={(e) => setIncludePrefix(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    Include Data URI Prefix
                                </label>
                            </div>
                        </div>

                        {/* Textarea Viewport */}
                        <div className="relative">
                            <textarea
                                readOnly
                                value={renderedOutputString}
                                placeholder="Base64 encoded string output will appear here..."
                                className="w-full h-64 sm:h-72 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 bg-slate-50/70 leading-relaxed resize-none outline-none overflow-y-auto"
                            />
                            {renderedOutputString && (
                                <span className="absolute bottom-3 right-3 text-[11px] font-mono bg-white/95 px-2 py-0.5 rounded border border-slate-200 text-slate-500 shadow-xs">
                                    {renderedOutputString.length.toLocaleString()} characters
                                </span>
                            )}
                        </div>

                        {/* Primary Copy / Export Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            <button
                                onClick={() => handleCopy(renderedOutputString, "raw")}
                                disabled={!renderedOutputString}
                                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                {copiedKey === "raw" ? (
                                    <>
                                        <Check className="w-4 h-4" /> Copied Base64 String!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" /> Copy Base64 String
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleDownloadTxt}
                                disabled={!renderedOutputString}
                                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold text-xs transition border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download className="w-4 h-4" /> Download .txt File
                            </button>
                        </div>
                    </div>

                    {/* Developer Integration Snippets */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Ready-to-Use Developer Snippets
                        </span>

                        <div className="space-y-2">
                            {/* HTML <img> Snippet */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="min-w-0 pr-2">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        HTML &lt;img&gt; Element
                                    </span>
                                    <code className="text-xs text-indigo-700 font-mono truncate block">
                                        {htmlImgSnippet ? `${htmlImgSnippet.slice(0, 50)}... />` : '<img src="data:image/..." />'}
                                    </code>
                                </div>
                                <button
                                    onClick={() => handleCopy(htmlImgSnippet, "html")}
                                    disabled={!htmlImgSnippet}
                                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 text-xs font-semibold transition flex-shrink-0 cursor-pointer"
                                >
                                    {copiedKey === "html" ? "Copied" : "Copy Tag"}
                                </button>
                            </div>

                            {/* CSS background-image Snippet */}
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="min-w-0 pr-2">
                                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        CSS background-image Property
                                    </span>
                                    <code className="text-xs text-indigo-700 font-mono truncate block">
                                        {cssBgSnippet ? `${cssBgSnippet.slice(0, 48)}...");` : 'background-image: url("data:...");'}
                                    </code>
                                </div>
                                <button
                                    onClick={() => handleCopy(cssBgSnippet, "css")}
                                    disabled={!cssBgSnippet}
                                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 text-xs font-semibold transition flex-shrink-0 cursor-pointer"
                                >
                                    {copiedKey === "css" ? "Copied" : "Copy CSS"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD THOROUGH SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: What is Image to Base64 Conversion */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Understanding Image to Base64 Encoding: RFC 4648 Specification
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting an image to Base64 involves serializing raw binary byte streams (PNG, JPEG, WebP, SVG, or GIF) into a continuous sequence of 64 standard ASCII characters defined by the <strong>RFC 4648</strong> standard. The encoding character set consists of uppercase Latin characters (<code>A-Z</code>), lowercase characters (<code>a-z</code>), numerals (<code>0-9</code>), and two special transmission characters (<code>+</code> and <code>/</code>), with the equals sign (<code>=</code>) serving as parity padding.
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When an image is converted into a <strong>Data URI</strong> (Uniform Resource Identifier), it receives a standard media header:
                    </p>

                    <div className="p-4 bg-slate-900 rounded-xl text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed">
                        data:[&lt;mediatype&gt;][;base64],&lt;data&gt;
                        <br />
                        Example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9h...
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Mathematical Bit Alignment
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Base64 groups binary data into 24-bit segments by concatenating three 8-bit octets. These 24 bits are subsequently subdivided into four 6-bit sextets ($2^6 = 64$). Because every 6 bits index directly into the Base64 alphabet table, every three bytes of binary data yield exactly four ASCII characters.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                <FileCheck2 className="w-4 h-4 text-indigo-600" /> The 33.3% Payload Overhead
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                The ratio of 4 output characters to 3 input bytes introduces an inherent mathematical storage expansion factor:
                            </p>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"$$\\text{Size}_{\\text{Base64}} = \\left\\lceil \\frac{\\text{Binary Bytes}}{3} \\right\\rceil \\times 4 \\approx 1.333 \\times \\text{Binary Bytes}$$"}
                            </p>
                            <p className="text-xs text-slate-500">
                                A 15 KB icon will expand to approximately 20 KB of Base64 text.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Strategic Tradeoffs: When to Inline vs When to Host */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architectural Blueprint: Inline Data URIs vs CDN Hosted Assets
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Embedding Base64 images directly within HTML, CSS, and JSON removes additional HTTP request roundtrips, reducing DNS lookup and TCP handshakes. However, inlined images cannot be cached independently by browser caches or Edge CDNs. Choosing the right delivery strategy is critical for Core Web Vitals and network efficiency:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600" /> Recommended Scenarios for Base64
                            </h3>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
                                <li>
                                    <strong>Micro UI Badges & Icons (&lt; 2 KB):</strong> Inlining tiny SVG and PNG icons eliminates individual HTTP requests where protocol overhead exceeds payload size.
                                </li>
                                <li>
                                    <strong>Low-Quality Image Placeholders (LQIP):</strong> Tiny, blurred 10×10 Base64 previews render immediately, eliminating Cumulative Layout Shift (CLS) while hero images load.
                                </li>
                                <li>
                                    <strong>Self-Contained Email Templates:</strong> Email clients frequently block external remote images; embedding Base64 ensures logos render even under strict privacy filters.
                                </li>
                                <li>
                                    <strong>Client-Side Document Export (PDFs/Canvas):</strong> Generating offline reports or PDF canvas exports requires embedded assets to avoid CORS taint restrictions.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-rose-200 bg-rose-50/40 rounded-xl space-y-3">
                            <h3 className="font-bold text-rose-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" /> Unfavorable Scenarios for Base64
                            </h3>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
                                <li>
                                    <strong>Hero Banners & Large Photos (&gt; 50 KB):</strong> Incurring a 33% payload expansion on large images wastes mobile bandwidth and slows First Contentful Paint (FCP).
                                </li>
                                <li>
                                    <strong>Site-Wide Shared Brand Logos:</strong> Inlining a header logo into every individual HTML template prevents browsers from caching the asset across navigation events.
                                </li>
                                <li>
                                    <strong>Render-Blocking External Stylesheets:</strong> Heavy Base64 strings embedded in critical CSS block DOM rendering until the entire stylesheet has downloaded and parsed.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 3: Magic Bytes & Format Identification Table */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Maximize2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Binary Signatures: Identifying Formats from Base64 Headers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Every image format starts with unique binary magic numbers. When converted into Base64, these magic numbers generate recognizable prefix patterns:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Graphic Format</th>
                                    <th className="p-3">Magic Hex Header</th>
                                    <th className="p-3">Base64 Signature String</th>
                                    <th className="p-3">Standard Data URI Scheme</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">PNG</td>
                                    <td className="p-3 font-mono text-xs">89 50 4E 47 0D 0A 1A 0A</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">iVBORw0KGgo</td>
                                    <td className="p-3 font-mono text-xs">data:image/png;base64,...</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">JPEG / JPG</td>
                                    <td className="p-3 font-mono text-xs">FF D8 FF E0 / E1</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">/9j/</td>
                                    <td className="p-3 font-mono text-xs">data:image/jpeg;base64,...</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">GIF 89a</td>
                                    <td className="p-3 font-mono text-xs">47 49 46 38 39 61</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">R0lGODlh</td>
                                    <td className="p-3 font-mono text-xs">data:image/gif;base64,...</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">WebP</td>
                                    <td className="p-3 font-mono text-xs">52 49 46 46 (RIFF...WEBP)</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">UklGR</td>
                                    <td className="p-3 font-mono text-xs">data:image/webp;base64,...</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">SVG (XML)</td>
                                    <td className="p-3 font-mono text-xs">3C 73 76 67 / 3C 3F 78</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">PHN2Zy / PD94b</td>
                                    <td className="p-3 font-mono text-xs">data:image/svg+xml;base64,...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 4: Developer Implementation Code Recipes */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Programmatic Encoding Recipes: Node.js, Python, & Modern Browser API
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Automate Base64 conversions within backend build pipelines, serverless functions, or client-side scripts:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Node.js Buffer Encoding
                            </h3>
                            <div className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`import fs from 'node:fs';

const imageBuffer = fs.readFileSync('icon.png');
const base64Str = imageBuffer.toString('base64');
const dataUri = \`data:image/png;base64,\${base64Str}\`;`}
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-500" /> Python 3 base64 Module
                            </h3>
                            <div className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`import base64

with open("icon.png", "rb") as image_file:
    encoded_bytes = base64.b64encode(image_file.read())
    base64_str = encoded_bytes.decode('utf-8')
    data_uri = f"data:image/png;base64,{base64_str}"`}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool upload my images to any server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates under a strictly local client-side sandbox. The HTML5 Canvas API and FileReader API serialize your visual files into ASCII base64 streams directly within your browser&apos;s private JavaScript runtime.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between a Data URI and a raw Base64 string?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A raw Base64 string contains only the encoded 64-character alphabet sequence without metadata headers. A Data URI prefixes the string with schema information (such as <code>data:image/png;base64,</code>), enabling web browsers, CSS rules, and HTML elements to parse and render the byte stream directly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does my image file become larger after Base64 encoding?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Base64 represents 8-bit binary octets using 6-bit ASCII sextets. Because 4 ASCII characters are needed to encode every 3 binary bytes, Base64 introduces a constant ~33.3% computational size overhead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                When should I use Base64 images instead of hosting files on an edge CDN?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Base64 is optimal for micro-assets (&lt; 2 KB), email newsletters requiring self-contained templates, low-quality image placeholders (LQIP) to avoid Cumulative Layout Shift (CLS), and offline-first Single Page Applications. External CDN URLs should be used for large photography to take advantage of browser HTTP caching.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can transparent PNGs be encoded into Base64 JPEG strings?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When converting transparent images to JPEG (which does not support alpha channels), our canvas engine automatically applies a solid white background backplate to eliminate black alpha artifacts.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}