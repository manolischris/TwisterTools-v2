"use client";

import React, { useState, useMemo, useRef } from "react";
import {
    Image as ImageIcon,
    FileCode,
    Download,
    Copy,
    Check,
    RefreshCw,
    Trash2,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    Maximize2,
    Layers,
    FileCheck2,
    Cpu,
    ExternalLink,
    Code2,
    AlertCircle,
    Info,
    Sparkles,
    ZoomIn,
    FileSpreadsheet
} from "lucide-react";

interface ImageMetadata {
    format: string;
    mimeType: string;
    width: number;
    height: number;
    rawChars: number;
    approxBytes: number;
    aspectRatio: string;
    hasPrefix: boolean;
}

const SAMPLE_BASE64_PNG =
    "data:image/png;base64,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";

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export default function Base64ToImageConverter() {
    const [rawInput, setRawInput] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [meta, setMeta] = useState<ImageMetadata | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [exportFormat, setExportFormat] = useState<"png" | "jpeg" | "webp">("png");
    const [jpegQuality, setJpegQuality] = useState<number>(92);
    const [copied, setCopied] = useState<boolean>(false);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [scaleMultiplier, setScaleMultiplier] = useState<number>(1);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Calculate approximate size in bytes from raw base64 string length
    const computeBase64Bytes = (str: string): number => {
        const base64Data = str.includes(",") ? str.split(",")[1] : str;
        const cleanStr = base64Data.replace(/[^A-Za-z0-9+/=]/g, "");
        const padding = (cleanStr.match(/=+$/) || [""])[0].length;
        return Math.max(0, Math.floor((cleanStr.length * 3) / 4) - padding);
    };

    // Robust Base64 normalizer and parser
    const processBase64 = (inputString: string) => {
        setParseError(null);
        const trimmed = inputString.trim();

        if (!trimmed) {
            setPreviewUrl(null);
            setMeta(null);
            return;
        }

        let mimeType = "image/png";
        let cleanBase64 = trimmed;
        const hasDataUriPrefix = trimmed.startsWith("data:");

        if (hasDataUriPrefix) {
            const matches = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
            if (matches) {
                mimeType = matches[1];
                cleanBase64 = matches[2].replace(/\s/g, "");
            } else {
                setParseError("Malformed Data URI scheme. Ensure it follows data:image/[type];base64,<payload>");
                setPreviewUrl(null);
                setMeta(null);
                return;
            }
        } else {
            cleanBase64 = trimmed.replace(/\s/g, "");
            // Detect MIME signatures from raw base64 headers
            if (cleanBase64.startsWith("iVBORw0KGgo")) {
                mimeType = "image/png";
            } else if (cleanBase64.startsWith("/9j/")) {
                mimeType = "image/jpeg";
            } else if (cleanBase64.startsWith("R0lGOD")) {
                mimeType = "image/gif";
            } else if (cleanBase64.startsWith("UklGR")) {
                mimeType = "image/webp";
            } else if (cleanBase64.startsWith("PHN2Zy") || cleanBase64.startsWith("PD94bWw")) {
                mimeType = "image/svg+xml";
            }
        }

        // Test base64 validity via atob
        try {
            atob(cleanBase64.slice(0, Math.min(cleanBase64.length, 1024)));
        } catch {
            setParseError("Invalid Base64 sequence detected. String contains non-conforming characters or incorrect padding.");
            setPreviewUrl(null);
            setMeta(null);
            return;
        }

        const fullDataUri = hasDataUriPrefix ? trimmed : `data:${mimeType};base64,${cleanBase64}`;
        setPreviewUrl(fullDataUri);

        // Load image off-screen to read natural dimensions & inspect validity
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth || 1;
            const h = img.naturalHeight || 1;
            const divisor = gcd(w, h);
            const ratioStr = `${w / divisor}:${h / divisor}`;
            const approxBytes = computeBase64Bytes(cleanBase64);

            setMeta({
                format: mimeType.split("/")[1]?.toUpperCase() || "UNKNOWN",
                mimeType,
                width: w,
                height: h,
                rawChars: trimmed.length,
                approxBytes,
                aspectRatio: ratioStr,
                hasPrefix: hasDataUriPrefix,
            });
            setParseError(null);
        };

        img.onerror = () => {
            setParseError("The decoded base64 string does not evaluate to a valid binary graphic payload.");
            setPreviewUrl(null);
            setMeta(null);
        };

        img.src = fullDataUri;
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setRawInput(val);
        processBase64(val);
    };

    const handleLoadSample = () => {
        setRawInput(SAMPLE_BASE64_PNG);
        processBase64(SAMPLE_BASE64_PNG);
    };

    const handleClear = () => {
        setRawInput("");
        setPreviewUrl(null);
        setMeta(null);
        setParseError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                setRawInput(result);
                processBase64(result);
            }
        };
        reader.readAsText(file);
    };

    const handleDownloadConverted = () => {
        if (!previewUrl || !meta) return;
        setIsConverting(true);

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const targetW = meta.width * scaleMultiplier;
            const targetH = meta.height * scaleMultiplier;
            canvas.width = targetW;
            canvas.height = targetH;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                setIsConverting(false);
                return;
            }

            // High-quality rendering interpolation
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // If JPEG, fill white background to prevent black alpha matte
            if (exportFormat === "jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, targetW, targetH);
            }

            ctx.drawImage(img, 0, 0, targetW, targetH);

            const mime = `image/${exportFormat}`;
            const quality = exportFormat === "jpeg" || exportFormat === "webp" ? jpegQuality / 100 : undefined;
            const dataUrl = canvas.toDataURL(mime, quality);

            const link = document.createElement("a");
            link.download = `twistertools-decoded-${Date.now()}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsConverting(false);
        };
        img.src = previewUrl;
    };

    const handleCopyHtmlTag = () => {
        if (!previewUrl) return;
        const tag = `<img src="${previewUrl}" alt="Base64 Embedded Image" />`;
        navigator.clipboard.writeText(tag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyCssRule = () => {
        if (!previewUrl) return;
        const css = `background-image: url("${previewUrl}");`;
        navigator.clipboard.writeText(css);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formattedBytes = useMemo(() => {
        if (!meta) return "0 B";
        const bytes = meta.approxBytes;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / 1048576).toFixed(2)} MB`;
    }, [meta]);

    // Structured SEO Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Base64 to Image Decoder & Instant PNG/JPG Exporter",
        "url": "https://twistertools.com/tools/image-tools/base64-to-image-converter",
        "description": "Decode base64 image strings, Data URIs, and raw RFC 4648 streams directly into previewable, full-resolution PNG, JPG, or WebP images with instant local client-side conversion.",
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
                "name": "Is my Base64 image data uploaded to any remote server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools operates on a strict zero-knowledge architecture. All Base64 decoding, rasterization, dimension extraction, and format conversions occur exclusively in your local browser sandbox via the Canvas API and FileReader API."
                }
            },
            {
                "@type": "Question",
                "name": "Does this decoder require the data:image prefix to work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The decoder features heuristic MIME signature detection. It accepts standard Data URIs (data:image/png;base64,...) as well as raw, unadorned Base64 strings. It inspects signature magic byte patterns like iVBORw0KGgo (PNG) or /9j/ (JPEG) to determine image MIME types automatically."
                }
            },
            {
                "@type": "Question",
                "name": "Why does Base64 make image payloads ~33% larger than original binaries?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Base64 encoding represents binary data using a 64-character ASCII alphabet. Each Base64 character carries 6 bits of data. Because standard binary bytes represent 8 bits, four Base64 characters are required to represent three 8-bit bytes (4:3 ratio), causing an inherent 33.3% computational storage expansion."
                }
            },
            {
                "@type": "Question",
                "name": "What causes the 'Invalid Base64 sequence detected' error?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "This error occurs when the input string contains non-ASCII characters outside the standard Base64 alphabet (A-Z, a-z, 0-9, +, /, =), broken padding sequences, or partial fragments caused by truncated copy-paste actions."
                }
            },
            {
                "@type": "Question",
                "name": "Can transparent PNGs be converted directly to JPG?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When exporting to JPEG (which lacks an alpha channel), our engine automatically applies an opaque solid white canvas backplate prior to rasterization, preventing black matte artifacts around transparent pixels."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* JSON-LD Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Split Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Base64 Input & Buffer Stream Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-5">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <FileCode className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Base64 String or Data URI Input
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
                                    title="Clear workspace"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* File Upload Trigger */}
                        <div className="mb-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.b64,.json"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="b64-file-upload"
                            />
                            <label
                                htmlFor="b64-file-upload"
                                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer transition"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Import text file (.txt, .b64)
                            </label>
                        </div>

                        {/* Textarea for String Input */}
                        <div className="relative">
                            <textarea
                                value={rawInput}
                                onChange={handleTextChange}
                                placeholder="Paste raw Base64 string or Data URI here (e.g., data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...)"
                                className="w-full h-72 sm:h-80 p-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-xs font-mono text-slate-800 bg-slate-50/60 leading-relaxed resize-none transition overflow-y-auto"
                            />
                            {rawInput && (
                                <span className="absolute bottom-3 right-3 text-[11px] font-mono bg-white/90 px-2 py-0.5 rounded border border-slate-200 text-slate-500 shadow-xs">
                                    {rawInput.length.toLocaleString()} chars
                                </span>
                            )}
                        </div>

                        {/* Security Badge Aligned Right */}
                        <div className="flex justify-end mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                100% Client-Side Sandbox
                            </span>
                        </div>

                        {/* Parse Error Notification */}
                        {parseError && (
                            <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
                                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Decoding Error: </span>
                                    {parseError}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Left Panel Footer / Quick Copy Actions */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleCopyHtmlTag}
                            disabled={!previewUrl}
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                            <Code2 className="w-3.5 h-3.5" />
                            Copy &lt;img&gt; Tag
                        </button>
                        <button
                            onClick={handleCopyCssRule}
                            disabled={!previewUrl}
                            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                            <Layers className="w-3.5 h-3.5" />
                            Copy CSS Rule
                        </button>
                    </div>
                </div>

                {/* Right Panel: Live Decoded Preview & Raster Exporter */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-5">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">
                                    Decoded Image Preview
                                </h2>
                            </div>
                            {meta && (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-emerald-100 text-emerald-800">
                                    {meta.format} Verified
                                </span>
                            )}
                        </div>

                        {/* Interactive Decoded Preview Box */}
                        <div
                            className="w-full h-72 sm:h-80 rounded-xl border border-slate-200 flex items-center justify-center p-4 relative overflow-hidden"
                            style={{
                                backgroundColor: "#f1f5f9",
                                backgroundImage: "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
                                backgroundSize: "20px 20px",
                                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
                            }}
                        >
                            {previewUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewUrl}
                                        alt="Decoded Base64 Preview"
                                        className="max-w-full max-h-full object-contain drop-shadow-md rounded transition image-rendering-pixelated"
                                        style={{
                                            minWidth: meta && meta.width < 100 ? "140px" : undefined,
                                            minHeight: meta && meta.height < 100 ? "140px" : undefined,
                                            imageRendering: "pixelated"
                                        }}
                                    />
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-slate-200 transition"
                                        title="Open full resolution in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            ) : (
                                <div className="text-center space-y-2 p-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center mx-auto">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600">
                                        No Base64 payload supplied
                                    </p>
                                    <p className="text-[11px] text-slate-400 max-w-xs">
                                        Paste an encoded RFC 4648 string or Data URI to inspect visual elements in real time.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Metadata Diagnostic Bar */}
                        {meta ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Dimensions
                                    </span>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                        {meta.width} × {meta.height} px
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Approx. Size
                                    </span>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                        {formattedBytes}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Aspect Ratio
                                    </span>
                                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                                        {meta.aspectRatio}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        MIME Detected
                                    </span>
                                    <p className="text-xs sm:text-sm font-black text-indigo-600 mt-0.5 truncate">
                                        {meta.mimeType.split("/")[1] || "auto"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
                                <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span>Diagnostics will populate automatically upon string parse.</span>
                            </div>
                        )}
                    </div>

                    {/* Raster Export Controls */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Output Format
                                </label>
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value as "png" | "jpeg" | "webp")}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="png">PNG (Lossless / Alpha)</option>
                                    <option value="jpeg">JPG (Compact Standard)</option>
                                    <option value="webp">WebP (Modern Web)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Scale Multiplier
                                </label>
                                <select
                                    value={scaleMultiplier}
                                    onChange={(e) => setScaleMultiplier(Number(e.target.value))}
                                    className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value={1}>1× (Original Native)</option>
                                    <option value={2}>2× (Retina Double)</option>
                                    <option value={3}>3× (High DPI Triple)</option>
                                </select>
                            </div>

                            {exportFormat !== "png" && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                                        Compression: {jpegQuality}%
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={jpegQuality}
                                        onChange={(e) => setJpegQuality(Number(e.target.value))}
                                        className="w-full accent-indigo-600 mt-2 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleDownloadConverted}
                            disabled={!previewUrl || isConverting}
                            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Download className={`w-4 h-4 ${isConverting ? "animate-bounce" : ""}`} />
                            {isConverting ? "Rasterizing..." : `Download ${exportFormat.toUpperCase()} Image`}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD THOROUGH SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Foundations of Base64 Binary Encoding */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Technical Architecture: RFC 4648 Base64 Encoding & Binary Decomposition
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Base64 is a binary-to-text encoding scheme defined under <strong>RFC 4648</strong>. It maps arbitrary binary streams (such as compiled image bytecodes) into a standardized set of 64 printable ASCII characters: uppercase letters (<code>A-Z</code>), lowercase letters (<code>a-z</code>), numerals (<code>0-9</code>), and two special transmission characters (typically <code>+</code> and <code>/</code>, with <code>=</code> reserved for parity padding).
                    </p>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The underlying mathematical mechanism aggregates three 8-bit octets (24 bits total) and splits them into four 6-bit sextets. Because $2^6 = 64$, every 6-bit chunk maps index-to-index against the RFC 4648 alphabet table:
                    </p>

                    <div className="p-4 bg-slate-900 rounded-xl text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed">
                        Binary Octets (3 bytes): [01001001] [01101101] [01100001] (24 bits total)
                        <br />
                        Base64 Sextets (4 units): [010010]  [010110]  [110101]  [100001]
                        <br />
                        Base64 Integer Indices:     18         22        53        33
                        <br />
                        ASCII Character Outputs:    "S"        "W"       "1"       "h"
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                <Cpu className="w-4 h-4 text-indigo-600" /> The 33.3% Overhead Mathematical Formula
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Because 3 raw binary bytes require 4 Base64 characters to render, Base64 encoding imposes a strict computational size inflation factor of:
                            </p>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                {"$$\\text{Size}_{\\text{Base64}} = \\left\\lceil \\frac{n}{3} \\right\\rceil \\times 4 \\approx 1.333 \\times n$$"}
                            </p>
                            <p className="text-xs text-slate-500">
                                A 100 KB raw image expands to roughly 133.3 KB of textual data when serialized into a Base64 stream.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                                <FileCheck2 className="w-4 h-4 text-indigo-600" /> Parity Padding Mechanics (=)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                If the input binary payload is not evenly divisible by 3 bytes, padding characters (<code>=</code>) are appended to preserve 4-character block alignment:
                            </p>
                            <ul className="text-xs text-slate-600 space-y-1 font-mono">
                                <li>• Remainder 1 byte: Encoded into 2 chars + "==" padding</li>
                                <li>• Remainder 2 bytes: Encoded into 3 chars + "=" padding</li>
                                <li>• Remainder 0 bytes: Clean 4-character boundary (no padding)</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 2: Magic Byte Signatures & Heuristic MIME Identification */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Magic Byte Fingerprints: How to Identify Raw Base64 Formats
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When users paste raw Base64 strings lacking the standard <code>data:image/[format];base64,</code> header prefix, the image format can still be deduced instantly by inspecting the opening characters. These characters represent the encoded hex signatures (magic numbers) found at the beginning of standard image headers:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">File Type</th>
                                    <th className="p-3">Binary Magic Bytes (Hex)</th>
                                    <th className="p-3">Base64 Signature Prefix</th>
                                    <th className="p-3">Standard MIME Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">PNG</td>
                                    <td className="p-3 font-mono text-xs">89 50 4E 47 0D 0A 1A 0A</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">iVBORw0KGgo</td>
                                    <td className="p-3 font-mono text-xs">image/png</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">JPEG / JPG</td>
                                    <td className="p-3 font-mono text-xs">FF D8 FF E0 / E1</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">/9j/</td>
                                    <td className="p-3 font-mono text-xs">image/jpeg</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">GIF 89a / 87a</td>
                                    <td className="p-3 font-mono text-xs">47 49 46 38 39 61</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">R0lGOD</td>
                                    <td className="p-3 font-mono text-xs">image/gif</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">WebP</td>
                                    <td className="p-3 font-mono text-xs">52 49 46 46 ... 57 45 42 50</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">UklGR</td>
                                    <td className="p-3 font-mono text-xs">image/webp</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">SVG (XML)</td>
                                    <td className="p-3 font-mono text-xs">3C 3F 78 6D 6C / 3C 73 76 67</td>
                                    <td className="p-3 font-mono font-bold text-indigo-600">PD94bWw / PHN2Zy</td>
                                    <td className="p-3 font-mono text-xs">image/svg+xml</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: When to Use Base64 Inlining vs External Asset Hosting */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Maximize2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Architecture Decisions: Base64 Data URIs vs External Static Assets
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Embedding images directly into HTML, CSS, or JSON payloads eliminates secondary HTTP request roundtrips, but it bypasses browser HTTP caching and inflates initial document parsing overhead. Review this architectural checklist prior to committing inline Data URIs in production:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-3">
                            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-600" /> Optimal Use Cases for Base64
                            </h3>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
                                <li>
                                    <strong>Micro-Icons & UI Glyphs (&lt; 2 KB):</strong> Prevents HTTP connection setup overhead on small vector or raster badges.
                                </li>
                                <li>
                                    <strong>Critical Above-the-Fold Placeholders:</strong> Inline Low-Quality Image Placeholders (LQIP) eliminate layout shifts (CLS) while progressive assets load.
                                </li>
                                <li>
                                    <strong>Standalone Single-File Bundles:</strong> Ideal for self-contained email HTML newsletters, automated PDF exports, and standalone documentation pages.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-rose-200 bg-rose-50/40 rounded-xl space-y-3">
                            <h3 className="font-bold text-rose-900 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" /> Poor Use Cases for Base64
                            </h3>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-2 leading-relaxed">
                                <li>
                                    <strong>High-Resolution Photography (&gt; 50 KB):</strong> Incurring a 33.3% size penalty on large assets wastes mobile bandwidth and slows parsing.
                                </li>
                                <li>
                                    <strong>Frequently Reused Brand Assets:</strong> Inlining logos in every HTML template prevents edge CDNs and browser caches from reusing the cached image.
                                </li>
                                <li>
                                    <strong>Render-Blocking CSS Files:</strong> Inlining heavy images into external CSS files blocks initial browser paint until the entire stylesheet downloads.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Step-by-Step Practical Implementation Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Developer Cheat Sheet: Decoding Base64 in JavaScript, Python & Node.js
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Integrate programmatic Base64 conversion directly into your backend pipelines or client scripts using these tested idioms:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Node.js (fs.writeFileSync)
                            </h3>
                            <div className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`const fs = require('fs');
const base64Data = rawUri.replace(/^data:image\\/\\w+;base64,/, '');
const buffer = Buffer.from(base64Data, 'base64');
fs.writeFileSync('output.png', buffer);`}
                            </div>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-500" /> Python 3 (base64 standard lib)
                            </h3>
                            <div className="bg-slate-900 text-indigo-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                {`import base64

clean_data = raw_str.split(',')[-1]
image_bytes = base64.b64decode(clean_data)
with open('output.png', 'wb') as f:
    f.write(image_bytes)`}
                            </div>
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
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my Base64 image data uploaded to any remote server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. TwisterTools operates on a strict zero-knowledge architecture. All Base64 decoding, rasterization, dimension extraction, and format conversions occur exclusively in your local browser sandbox via the Canvas API and FileReader API.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this decoder require the data:image prefix to work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The decoder features heuristic MIME signature detection. It accepts standard Data URIs (<code>data:image/png;base64,...</code>) as well as raw, unadorned Base64 strings. It inspects signature magic byte patterns like <code>iVBORw0KGgo</code> (PNG) or <code>/9j/</code> (JPEG) to determine image MIME types automatically.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why does Base64 make image payloads ~33% larger than original binaries?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Base64 encoding represents binary data using a 64-character ASCII alphabet. Each Base64 character carries 6 bits of data. Because standard binary bytes represent 8 bits, four Base64 characters are required to represent three 8-bit bytes (4:3 ratio), causing an inherent 33.3% computational storage expansion.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What causes the "Invalid Base64 sequence detected" error?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                This error occurs when the input string contains non-ASCII characters outside the standard Base64 alphabet (A-Z, a-z, 0-9, +, /, =), broken padding sequences, or partial fragments caused by truncated copy-paste actions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can transparent PNGs be converted directly to JPG?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When exporting to JPEG (which lacks an alpha channel), our engine automatically applies an opaque solid white canvas backplate prior to rasterization, preventing black matte artifacts around transparent pixels.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}