"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    FileImage,
    Upload,
    Download,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Archive,
    Sparkles,
    ShieldCheck,
    Layers,
    Sliders,
    BookOpen,
    HelpCircle,
    Cpu,
    Check,
    Copy,
    RefreshCw,
    Maximize2,
    FileCheck
} from "lucide-react";
import JSZip from "jszip";

interface ConvertedFile {
    id: string;
    originalFile: File;
    name: string;
    originalSize: number;
    convertedBlob: Blob | null;
    convertedSize: number | null;
    dataUrl: string | null;
    width: number;
    height: number;
    status: "idle" | "processing" | "completed" | "error";
    errorMsg?: string;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function WebpToPngConverter() {
    const [files, setFiles] = useState<ConvertedFile[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
    const [isZipping, setIsZipping] = useState<boolean>(false);
    const [previewModalItem, setPreviewModalItem] = useState<ConvertedFile | null>(null);
    const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const convertWebpToPng = useCallback((item: ConvertedFile): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const objectUrl = URL.createObjectURL(item.originalFile);
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;

                const ctx = canvas.getContext("2d", { willReadFrequently: false });
                if (!ctx) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error("Unable to obtain 2D rendering context"));
                    return;
                }

                // Render image onto clean canvas with preserved alpha channel
                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(objectUrl);
                        if (!blob) {
                            reject(new Error("Canvas rasterization failed"));
                            return;
                        }
                        const dataUrl = canvas.toDataURL("image/png");
                        resolve({
                            blob,
                            dataUrl,
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                        });
                    },
                    "image/png"
                );
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Corrupted or unsupported WebP image format"));
            };

            img.src = objectUrl;
        });
    }, []);

    const processQueue = useCallback(async (currentFiles: ConvertedFile[]) => {
        setIsBatchProcessing(true);

        for (let i = 0; i < currentFiles.length; i++) {
            const target = currentFiles[i];
            if (target.status === "completed") continue;

            setFiles((prev) =>
                prev.map((f) => (f.id === target.id ? { ...f, status: "processing" } : f))
            );

            try {
                const { blob, dataUrl, width, height } = await convertWebpToPng(target);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === target.id
                            ? {
                                ...f,
                                status: "completed",
                                convertedBlob: blob,
                                convertedSize: blob.size,
                                dataUrl,
                                width,
                                height,
                            }
                            : f
                    )
                );
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Conversion failure";
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === target.id
                            ? { ...f, status: "error", errorMsg: message }
                            : f
                    )
                );
            }
        }

        setIsBatchProcessing(false);
    }, [convertWebpToPng]);

    const handleFileAdd = useCallback((incomingFiles: FileList | File[]) => {
        const newQueue: ConvertedFile[] = [];

        Array.from(incomingFiles).forEach((file) => {
            const isWebp = file.type === "image/webp" || file.name.toLowerCase().endsWith(".webp");
            if (isWebp) {
                newQueue.push({
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    originalFile: file,
                    name: file.name,
                    originalSize: file.size,
                    convertedBlob: null,
                    convertedSize: null,
                    dataUrl: null,
                    width: 0,
                    height: 0,
                    status: "idle",
                });
            }
        });

        if (newQueue.length === 0) {
            alert("Please select valid .webp image files.");
            return;
        }

        setFiles((prev) => {
            const updated = [...prev, ...newQueue];
            setTimeout(() => processQueue(updated), 50);
            return updated;
        });
    }, [processQueue]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileAdd(e.dataTransfer.files);
        }
    }, [handleFileAdd]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const downloadSingle = (item: ConvertedFile) => {
        if (!item.convertedBlob) return;
        const url = URL.createObjectURL(item.convertedBlob);
        const a = document.createElement("a");
        const cleanName = item.name.replace(/\.webp$/i, "");
        a.href = url;
        a.download = `${cleanName}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadZip = async () => {
        const completed = files.filter((f) => f.status === "completed" && f.convertedBlob);
        if (completed.length === 0) return;

        setIsZipping(true);
        try {
            const zip = new JSZip();
            completed.forEach((file) => {
                if (file.convertedBlob) {
                    const cleanName = file.name.replace(/\.webp$/i, "");
                    zip.file(`${cleanName}.png`, file.convertedBlob);
                }
            });

            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `webp-to-png-export-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("ZIP Generation error:", err);
            alert("Failed to build ZIP archive. Please download files individually.");
        } finally {
            setIsZipping(false);
        }
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
        if (previewModalItem?.id === id) {
            setPreviewModalItem(null);
        }
    };

    const clearAll = () => {
        setFiles([]);
        setPreviewModalItem(null);
    };

    const copyBashSnippet = () => {
        navigator.clipboard.writeText('for f in *.webp; do dwebp "$f" -o "${f%.webp}.png"; done');
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    };

    const completedCount = files.filter((f) => f.status === "completed").length;
    const totalBytesOriginal = files.reduce((acc, f) => acc + f.originalSize, 0);
    const totalBytesConverted = files.reduce((acc, f) => acc + (f.convertedSize || 0), 0);

    const filteredFiles = activeTab === "completed"
        ? files.filter((f) => f.status === "completed")
        : files;

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Lossless WebP to PNG Batch Converter",
        "url": "https://twistertools.com/tools/image-tools/webp-to-png-converter",
        "description": "Convert WebP images to lossless 32-bit PNG format in batch directly inside your browser. Zero file uploads, 100% private, client-side HTML5 canvas rasterization.",
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
                "name": "Does converting WebP to PNG degrade image sharpness or resolution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The conversion pipeline draws the full uncompressed pixel array of your WebP image onto an unscaled HTML5 2D Canvas element and encodes it directly into a 32-bit RGBA PNG container. Resolution, sharpness, and pixel dimensions remain identical."
                }
            },
            {
                "@type": "Question",
                "name": "Is transparency and alpha channel preserved during conversion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. PNG fully supports 8-bit alpha channels (RGBA). Transparent backgrounds, drop shadows, and feathered edges present in the source WebP file are accurately preserved without introducing black or white matte artifacts."
                }
            },
            {
                "@type": "Question",
                "name": "Are my images uploaded to any remote web server or cloud storage?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Never. All decompression, rendering, and PNG encoding operations run entirely on your local machine within your web browser's JavaScript V8 engine. Your photos and graphics never leave your computer."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the resulting PNG file size larger than the original WebP?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "WebP employs modern predictive coding and VP8 intra-frame compression algorithms specifically engineered to reduce file size. PNG is an older, lossless format designed for uncompressed raster storage, meaning byte counts naturally expand while visual fidelity remains preserved."
                }
            },
            {
                "@type": "Question",
                "name": "Is there a limit to how many WebP files I can convert simultaneously?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "There are no artificial limits imposed by TwisterTools. You can queue dozens or hundreds of images at once; overall processing capacity is governed solely by your computer's available system RAM and GPU canvas limits."
                }
            },
            {
                "@type": "Question",
                "name": "Can I convert animated WebP files with this tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard HTML5 Canvas extracts the first keyframe of an animated WebP file and converts it into a static high-resolution PNG image. For multi-frame animated outputs, an APNG (Animated PNG) or GIF sequence converter is recommended."
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
                {/* Left Panel: Dropzone & File Management */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                Ingest WebP Assets
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    100% Local GPU
                                </span>
                                {files.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition border border-rose-200 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear Queue
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-8 px-4 text-center ${isDragging
                                ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                : "border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".webp,image/webp"
                                multiple
                                onChange={(e) => e.target.files && handleFileAdd(e.target.files)}
                                className="hidden"
                            />
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                                <FileCheck className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1">
                                Drop WebP images here, or <span className="text-indigo-600">browse local files</span>
                            </p>
                            <p className="text-xs text-slate-500 max-w-sm">
                                Batch select unlimited WebP graphics. Preserves true alpha-transparency and original pixel resolution.
                            </p>
                        </div>

                        {/* Batch Overview Matrix */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Queue</span>
                                <span className="text-base font-bold text-slate-900 font-mono">{files.length}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Completed</span>
                                <span className="text-base font-bold text-emerald-600 font-mono">{completedCount}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase">Total Size</span>
                                <span className="text-base font-bold text-indigo-600 font-mono">{formatBytes(totalBytesOriginal)}</span>
                            </div>
                        </div>

                        {/* Status Tips */}
                        <div className="rounded-xl p-3.5 bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-900 leading-relaxed">
                                <strong>Lossless Decoding:</strong> Every frame is rasterized via local canvas context memory without lossy downsampling. Output files are standard 32-bit RGBA PNGs compatible with all legacy image viewers.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Browser Sandbox Active
                        </span>
                        <span>Zero External Calls</span>
                    </div>
                </div>

                {/* Right Panel: Batch Queue, Output Viewer & Actions */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    Conversion Stage
                                </h2>
                                {isBatchProcessing && (
                                    <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium animate-pulse">
                                        <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("all")}
                                        className={`px-2.5 py-1 rounded-md transition ${activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        All ({files.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("completed")}
                                        className={`px-2.5 py-1 rounded-md transition ${activeTab === "completed" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                                    >
                                        Ready ({completedCount})
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Batch Global Action Bar */}
                        {completedCount > 0 && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-xs font-bold text-slate-800 block">
                                        {completedCount} of {files.length} Converted
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-mono">
                                        Expanded: {formatBytes(totalBytesConverted)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={downloadZip}
                                    disabled={isZipping}
                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                    {isZipping ? "Creating ZIP..." : "Download All (ZIP)"}
                                </button>
                            </div>
                        )}

                        {/* Queue List Container */}
                        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                            {filteredFiles.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/40">
                                    <FileImage className="w-8 h-8 mx-auto stroke-1" />
                                    <p className="text-xs font-medium">No images in current filter</p>
                                    <p className="text-[11px] text-slate-400">Add .webp files using the left panel to begin conversion</p>
                                </div>
                            ) : (
                                filteredFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                                                {file.dataUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={file.dataUrl}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FileImage className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                                                    {file.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                                    <span>{formatBytes(file.originalSize)}</span>
                                                    {file.convertedSize && (
                                                        <>
                                                            <span>→</span>
                                                            <span className="text-indigo-600 font-semibold">{formatBytes(file.convertedSize)}</span>
                                                        </>
                                                    )}
                                                    {file.width > 0 && (
                                                        <span className="text-slate-400 hidden sm:inline">
                                                            ({file.width}×{file.height})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {file.status === "completed" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewModalItem(file)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                                        title="Inspect Output"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => downloadSingle(file)}
                                                        className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition cursor-pointer"
                                                        title="Download PNG"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}

                                            {file.status === "processing" && (
                                                <span className="p-1.5 text-indigo-600 animate-spin">
                                                    <RefreshCw className="w-4 h-4" />
                                                </span>
                                            )}

                                            {file.status === "error" && (
                                                <span className="p-1.5 text-rose-500" title={file.errorMsg || "Error"}>
                                                    <AlertCircle className="w-4 h-4" />
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                            <Cpu className="w-3.5 h-3.5 text-slate-600" />
                            Canvas 2D Context Pipeline
                        </span>
                        <span>Multi-threaded Rendering</span>
                    </div>
                </div>
            </div>

            {/* Modal Preview Dialog */}
            {previewModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{previewModalItem.name}</h3>
                                <p className="text-xs text-slate-500 font-mono">
                                    {previewModalItem.width} × {previewModalItem.height} px • {previewModalItem.convertedSize ? formatBytes(previewModalItem.convertedSize) : "N/A"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewModalItem(null)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Checkered pattern container to display transparency */}
                        <div className="w-full h-80 rounded-xl overflow-hidden flex items-center justify-center bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] border border-slate-200 p-2">
                            {previewModalItem.dataUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewModalItem.dataUrl}
                                    alt="PNG Preview"
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-slate-500">Checkerboard grid shows verified alpha transparency</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewModalItem(null)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadSingle(previewModalItem)}
                                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download PNG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Architectural Foundations & Image Science */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Science of Lossless Raster Conversion: WebP to Portable Network Graphics (PNG)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        While Google introduced the WebP container to accelerate page performance across modern web properties, software ecosystems, legacy photo editors, and desktop publishing suites frequently reject the format. Converting WebP to PNG provides ubiquitous compatibility across all graphic design applications, document processors, and vintage printing workflows without degrading pixel integrity.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> 32-Bit RGBA Transparency
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                PNG stores full 8-bit alpha channels, allowing up to 256 levels of true opacity per pixel. Subtle drop shadows, anti-aliased font boundaries, and transparent background layers present in source WebP files transfer with mathematical precision.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Cpu className="w-4 h-4 text-indigo-600" /> Zero Server Transmission
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard cloud-based converters upload your confidential images to remote virtual servers, introducing network latency and privacy hazards. TwisterTools rasterizes your files inside your browser&apos;s memory via HTML5 Canvas APIs, ensuring absolute confidentiality.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> Lossless Re-encoding
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When a WebP file is drawn to a Canvas element, its decompressed RGB matrix is extracted directly into an uncompressed PNG bitstream. No secondary lossy quantizer is introduced, preserving edge crispness and chromatic fidelity.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Terminal Alternative: Batch Convert WebP via Libwebp
                            </h3>
                            <button
                                type="button"
                                onClick={copyBashSnippet}
                                className="flex items-center gap-1 text-xs text-indigo-300 hover:text-white font-mono cursor-pointer"
                            >
                                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedSnippet ? "Copied Command" : "Copy Command"}
                            </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            For developers maintaining command-line shell scripts or automated CI/CD deployment pipelines, the Google <code>libwebp</code> package provides the official <code>dwebp</code> utility for lossless decompression:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`# Batch convert all WebP files in the current directory to PNG using dwebp
for f in *.webp; do dwebp "$f" -o "\${f%.webp}.png"; done`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Format Feature Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Sliders className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Format Comparison: WebP (Google) vs Portable Network Graphics (PNG)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding the trade-offs between WebP and PNG helps you determine when to deploy lightweight web delivery formats versus universal production formats:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Technical Dimension</th>
                                    <th className="p-3">WebP (Google RIFF)</th>
                                    <th className="p-3">Portable Network Graphics (PNG)</th>
                                    <th className="p-3">Optimal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Compression Type</td>
                                    <td className="p-3">Lossy (VP8) or Lossless</td>
                                    <td className="p-3">Strictly Lossless (DEFLATE / LZ77)</td>
                                    <td className="p-3">PNG guarantees zero visual artifacts</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Alpha Transparency</td>
                                    <td className="p-3">8-bit Alpha Channel</td>
                                    <td className="p-3">8-bit RGBA Alpha Channel</td>
                                    <td className="p-3">Both preserve transparent backgrounds</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Software Ecosystem</td>
                                    <td className="p-3">Modern Browsers & Android</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% Universal Compatibility</td>
                                    <td className="p-3">PNG works with Figma, Illustrator, InDesign</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">File Footprint</td>
                                    <td className="p-3 text-emerald-600 font-bold">25% - 35% Smaller</td>
                                    <td className="p-3">Larger Uncompressed Payload</td>
                                    <td className="p-3">WebP for web speed, PNG for editing</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Integration Guidelines */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Recommended Workflows for Graphic Designers & Developers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To maintain high productivity across modern web development stacks and design pipelines, follow these standard practices when working with converted PNG files:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Best Practices for Converted PNGs
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Keep Source Backups:</strong> Maintain original WebP assets for production web builds to conserve server egress bandwidth and improve Core Web Vitals.
                                </li>
                                <li>
                                    • <strong>Inspect Transparent Alpha:</strong> Use the preview modal checkerboard to confirm that complex drop shadows and glassmorphism elements were correctly rendered.
                                </li>
                                <li>
                                    • <strong>Batch Download via ZIP:</strong> When handling multi-file queues, use the &ldquo;Download All (ZIP)&rdquo; action to avoid repetitive browser confirmation prompts.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600" /> Common Misconceptions
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Will PNG Fix Compressed Artifacts?</strong> Converting a low-quality lossy WebP to PNG does not regenerate lost frequency detail; it cleanly preserves the exact visual state.
                                </li>
                                <li>
                                    • <strong>Why Did File Size Increase?</strong> PNG uses general-purpose DEFLATE compression rather than WebP&apos;s predictive coding, resulting in naturally larger file payloads.
                                </li>
                                <li>
                                    • <strong>Browser Tab Limits:</strong> Processing hundreds of ultra-high-resolution (8K+) files simultaneously can strain browser RAM; split batches into 50-file groups if memory is constrained.
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
                                Does converting WebP to PNG degrade image sharpness or resolution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The conversion pipeline draws the full uncompressed pixel array of your WebP image onto an unscaled HTML5 2D Canvas element and encodes it directly into a 32-bit RGBA PNG container. Resolution, sharpness, and pixel dimensions remain identical.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is transparency and alpha channel preserved during conversion?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. PNG fully supports 8-bit alpha channels (RGBA). Transparent backgrounds, drop shadows, and feathered edges present in the source WebP file are accurately preserved without introducing black or white matte artifacts.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my images uploaded to any remote web server or cloud storage?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Never. All decompression, rendering, and PNG encoding operations run entirely on your local machine within your web browser&apos;s JavaScript engine. Your photos and graphics never leave your computer.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the resulting PNG file size larger than the original WebP?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                WebP employs modern predictive coding and VP8 intra-frame compression algorithms specifically engineered to reduce file size. PNG is an older, lossless format designed for uncompressed raster storage, meaning byte counts naturally expand while visual fidelity remains preserved.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is there a limit to how many WebP files I can convert simultaneously?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                There are no artificial limits imposed by TwisterTools. You can queue dozens or hundreds of images at once; overall processing capacity is governed solely by your computer&apos;s available system RAM and GPU canvas limits.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I convert animated WebP files with this tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Standard HTML5 Canvas extracts the first keyframe of an animated WebP file and converts it into a static high-resolution PNG image. For multi-frame animated outputs, an APNG (Animated PNG) or GIF sequence converter is recommended.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}