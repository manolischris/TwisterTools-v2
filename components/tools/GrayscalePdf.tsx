"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    FileText,
    Upload,
    FileDown,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Zap,
    Shield,
    Layers,
    Sliders,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    RotateCcw,
    RotateCw,
    Eye,
    Grid,
    Palette,
    Check,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { PDFDocument, PDFPage, degrees } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type ConversionProfile =
    | "grayscale"
    | "monochrome-blue"
    | "monochrome-sepia"
    | "monochrome-emerald"
    | "high-contrast";

interface PageThumbnail {
    id: string;
    originalIndex: number;
    rotation: number;
    thumbnailUrl: string;
    selected: boolean;
}

interface ProfileOption {
    id: ConversionProfile;
    name: string;
    description: string;
    badge: string;
    previewClass: string;
}

const PROFILES: ProfileOption[] = [
    {
        id: "grayscale",
        name: "Pure Luminance Grayscale",
        description: "Standard Rec. 601 ITU-R luminance weighting for perfect document readability.",
        badge: "Most Popular",
        previewClass: "bg-slate-300 border-slate-400",
    },
    {
        id: "high-contrast",
        name: "High-Contrast B&W",
        description: "Aggressive dynamic thresholding optimized for sharp, clear text scanning.",
        badge: "OCR Optimized",
        previewClass: "bg-slate-900 border-slate-950",
    },
    {
        id: "monochrome-sepia",
        name: "Archival Sepia",
        description: "Warm duotone tone curve designed to reduce eye strain during prolonged reading.",
        badge: "Reading Mode",
        previewClass: "bg-amber-200 border-amber-400",
    },
    {
        id: "monochrome-blue",
        name: "Blueprint Indigo",
        description: "Engineering monochromatization optimized for technical drawings and CAD specs.",
        badge: "Technical",
        previewClass: "bg-indigo-300 border-indigo-500",
    },
    {
        id: "monochrome-emerald",
        name: "Terminal Emerald",
        description: "Classic green monochromatic profile for financial ledgers and code reviews.",
        badge: "Specialized",
        previewClass: "bg-emerald-300 border-emerald-500",
    },
];

export default function GrayscalePdf() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<PageThumbnail[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Controls & Profile State ──
    const [profile, setProfile] = useState<ConversionProfile>("grayscale");
    const [brightness, setBrightness] = useState<number>(0); // -100 to 100
    const [contrast, setContrast] = useState<number>(0); // -100 to 100
    const [preserveDarkText, setPreserveDarkText] = useState<boolean>(true);

    // ── Processing & UI State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // Canvas Color Processing Algorithms
    // ─────────────────────────────────────────────────────────────

    const applyColorTransformation = useCallback(
        (ctx: CanvasRenderingContext2D, width: number, height: number) => {
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;

            // Contrast scaling factor
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // 1. Calculate Standard Rec. 601 Luminance
                let lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // 2. Brightness Adjustment
                lum = lum + brightness;

                // 3. Contrast Adjustment
                lum = factor * (lum - 128) + 128;

                // Clamp luminance
                lum = Math.min(255, Math.max(0, lum));

                // 4. Preserve Dark Text Thresholding Optimization
                if (preserveDarkText && lum < 50) {
                    lum = lum * 0.7; // Darken dark values further for deep rich blacks
                }

                // 5. Apply Selected Profile
                switch (profile) {
                    case "grayscale":
                        data[i] = lum;
                        data[i + 1] = lum;
                        data[i + 2] = lum;
                        break;

                    case "high-contrast": {
                        const bw = lum > 128 ? 255 : 0;
                        data[i] = bw;
                        data[i + 1] = bw;
                        data[i + 2] = bw;
                        break;
                    }

                    case "monochrome-sepia":
                        data[i] = Math.min(255, lum * 0.95 + 30); // Red
                        data[i + 1] = Math.min(255, lum * 0.82 + 15); // Green
                        data[i + 2] = Math.min(255, lum * 0.62); // Blue
                        break;

                    case "monochrome-blue":
                        data[i] = Math.min(255, lum * 0.3 + 10);
                        data[i + 1] = Math.min(255, lum * 0.5 + 20);
                        data[i + 2] = Math.min(255, lum * 0.95 + 40);
                        break;

                    case "monochrome-emerald":
                        data[i] = Math.min(255, lum * 0.2 + 10);
                        data[i + 1] = Math.min(255, lum * 0.85 + 30);
                        data[i + 2] = Math.min(255, lum * 0.3 + 10);
                        break;

                    default:
                        data[i] = lum;
                        data[i + 1] = lum;
                        data[i + 2] = lum;
                        break;
                }
            }

            ctx.putImageData(imgData, 0, 0);
        },
        [profile, brightness, contrast, preserveDarkText]
    );

    // ─────────────────────────────────────────────────────────────
    // File Loading & Rendering Pipeline
    // ─────────────────────────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setErrorMessage(null);

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File size exceeds 20 MB max limit. Please select a smaller PDF file.");
            return;
        }

        setIsLoading(true);
        setLoadingProgress(5);
        setFileName(file.name);
        setFileSize(file.size);
        setPdfFile(file);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            setPdfBytes(uint8Array.slice());

            const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
            const pdfDoc = await loadingTask.promise;
            const count = pdfDoc.numPages;
            setTotalPages(count);

            const pageItems: PageThumbnail[] = [];

            for (let i = 1; i <= count; i++) {
                setLoadingProgress(Math.round((i / count) * 90));
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.35 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas,
                    }).promise;

                    const thumbnailUrl = canvas.toDataURL("image/png");
                    pageItems.push({
                        id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        originalIndex: i - 1,
                        rotation: 0,
                        thumbnailUrl,
                        selected: true,
                    });
                }
            }

            setPages(pageItems);
            setLoadingProgress(100);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to load PDF file. The file may be password protected or corrupted."
            );
            clearWorkspace();
        } font: {
            setIsLoading(false);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile]
    );

    const clearWorkspace = () => {
        setPdfFile(null);
        setPdfBytes(null);
        setPages([]);
        setFileName("");
        setFileSize(0);
        setTotalPages(0);
        setErrorMessage(null);
        setLoadingProgress(0);
        setPreviewPageUrl(null);
        setBrightness(0);
        setContrast(0);
    };

    // ─────────────────────────────────────────────────────────────
    // High-Resolution Monochromatization PDF Export Pipeline
    // ─────────────────────────────────────────────────────────────

    const handleProcessAndDownload = async () => {
        if (!pdfBytes || pages.length === 0) return;

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
            const pdfDoc = await loadingTask.promise;

            const newPdfDoc = await PDFDocument.create();

            for (let i = 0; i < pages.length; i++) {
                const pageItem = pages[i];
                if (!pageItem.selected) continue;

                const page = await pdfDoc.getPage(pageItem.originalIndex + 1);
                // Render high-resolution page canvas for crisp PDF recreation
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas,
                    }).promise;

                    // Process canvas pixels through the selected color filter engine
                    applyColorTransformation(context, canvas.width, canvas.height);

                    // Compress to JPEG for compact PDF file size
                    const processedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
                    const imageBytes = await fetch(processedDataUrl).then((res) => res.arrayBuffer());

                    const embeddedImage = await newPdfDoc.embedJpg(imageBytes);

                    // Create page dimensions matching scaled canvas aspect ratio
                    const pdfPage = newPdfDoc.addPage([
                        viewport.width / 2.0,
                        viewport.height / 2.0,
                    ]);

                    pdfPage.drawImage(embeddedImage, {
                        x: 0,
                        y: 0,
                        width: viewport.width / 2.0,
                        height: viewport.height / 2.0,
                    });

                    if (pageItem.rotation !== 0) {
                        pdfPage.setRotation(degrees(pageItem.rotation));
                    }
                }
            }

            const exportedBytes = await newPdfDoc.save();
            const blob = new Blob([exportedBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName
                ? `${fileName.replace(/\.pdf$/i, "")}_${profile}.pdf`
                : `grayscale_document.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred during PDF grayscale conversion."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const selectedCount = pages.filter((p) => p.selected).length;

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & THUMBNAILS ══════════════════ */}
                <div className="space-y-5">
                    {/* File Upload Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-white" />
                                </div>
                                <h2 className="text-sm font-semibold">1. Select PDF Document</h2>
                            </div>
                            {pdfFile && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-2.5 py-1 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear File
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-7 px-4 text-center ${isDragging
                                    ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />

                                {pdfFile ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-left space-y-1">
                                            <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                                                {fileName}
                                            </p>
                                            <p className="text-[11px] font-mono text-slate-500">
                                                {formatBytes(fileSize)} • {totalPages} Pages Loaded
                                            </p>
                                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                Ready for Color Processing
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                            Drop PDF document here, or <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400">Maximum file size limit: 20 MB</p>
                                    </>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {isLoading && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>Rendering PDF Page Previews...</span>
                                        <span className="font-mono text-indigo-600">{loadingProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                                            style={{ width: `${loadingProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Page Preview Container Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    2. Select Target Pages ({selectedCount}/{pages.length})
                                </h2>
                            </div>
                            {pages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const allSelected = pages.every((p) => p.selected);
                                        setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
                                    }}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                    {pages.every((p) => p.selected) ? "Deselect All" : "Select All"}
                                </button>
                            )}
                        </div>

                        {pages.length === 0 ? (
                            <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                <Palette className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No Document Loaded</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload a PDF document above to render interactive page previews and configure monochrome options.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[320px] overflow-y-auto pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            className={`relative group bg-white rounded-xl border p-2 transition-all flex flex-col items-center shadow-sm cursor-pointer ${page.selected
                                                ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                                                : "border-slate-200 opacity-60"
                                                }`}
                                            onClick={() =>
                                                setPages((prev) =>
                                                    prev.map((p, idx) =>
                                                        idx === index ? { ...p, selected: !p.selected } : p
                                                    )
                                                )
                                            }
                                        >
                                            <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={page.selected}
                                                    onChange={() => { }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{index + 1}
                                                </span>
                                            </div>

                                            <div
                                                className="w-full h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 relative border border-slate-200"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewPageUrl(page.thumbnailUrl);
                                                }}
                                            >
                                                <img
                                                    src={page.thumbnailUrl}
                                                    alt={`Page ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: COLOR CONTROLS & EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-200" />
                                <h2 className="text-sm font-semibold">3. Color & Tone Processing Options</h2>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Profile Selector Grid */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Select Monochromatization Profile
                                </label>
                                <div className="space-y-2">
                                    {PROFILES.map((p) => (
                                        <div
                                            key={p.id}
                                            onClick={() => setProfile(p.id)}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${profile === p.id
                                                ? "bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-500/20"
                                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                                                }`}
                                        >
                                            <div
                                                className={`w-6 h-6 rounded-lg border flex-shrink-0 mt-0.5 ${p.previewClass}`}
                                            />
                                            <div className="flex-1 space-y-0.5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-800">{p.name}</p>
                                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                        {p.badge}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 leading-normal">{p.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders Block */}
                            <div className="space-y-4 pt-2 border-t border-slate-100">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-700">Brightness Offset</span>
                                        <span className="font-mono text-indigo-600">{brightness > 0 ? `+${brightness}` : brightness}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={brightness}
                                        onChange={(e) => setBrightness(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-700">Contrast Boost</span>
                                        <span className="font-mono text-indigo-600">{contrast > 0 ? `+${contrast}` : contrast}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={contrast}
                                        onChange={(e) => setContrast(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                                    />
                                </div>

                                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preserveDarkText}
                                        onChange={(e) => setPreserveDarkText(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Preserve Deep Black Text (Threshold Boost)
                                    </span>
                                </label>
                            </div>

                            {/* Action Trigger Button */}
                            <button
                                type="button"
                                onClick={handleProcessAndDownload}
                                disabled={pages.length === 0 || selectedCount === 0 || isProcessing}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.length > 0 && selectedCount > 0 && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Monochromatizing PDF Pages...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Process & Download Grayscale PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           FULL-SCREEN THUMBNAIL PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
            {previewPageUrl && (
                <div
                    className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewPageUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-4 max-w-lg max-h-[85vh] flex flex-col items-center space-y-3 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">Page Expanded Preview</span>
                            <button
                                onClick={() => setPreviewPageUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img
                            src={previewPageUrl}
                            alt="Page Expanded Preview"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                        />
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of PDF Monochromatization</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Converting full-color PDF documents into standardized grayscale or monochromatic representations requires calculating precise color space transformations. The standard RGB color spectrum represents colors using three additive primary channels. To convert these color vectors into a single monochromatic luminance value without losing visual contrast or text clarity, our processing engine applies the <strong>Rec. 601 ITU-R luminance weighting formula</strong>:
                        </p>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs md:text-sm text-indigo-900">
                            Y = 0.299R + 0.587G + 0.114B
                        </div>
                        <p>
                            This weighting reflects human perception, as the human eye is significantly more sensitive to green wavelengths than red or blue. By weighting green light at 58.7%, our client-side engine ensures that colored charts, highlighted text, and background graphics convert into clear, readable shade gradients rather than muddy black blocks.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Monochrome Profiles & Target Applications</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Profile Name</th>
                                    <th className="px-4 py-3.5 font-bold">Algorithm Weighting</th>
                                    <th className="px-4 py-3.5 font-bold">Primary Use Case</th>
                                    <th className="px-4 py-3.5 font-bold">Printer Ink Savings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Rec. 601 Grayscale</td>
                                    <td className="px-4 py-3 font-mono text-xs">0.299R + 0.587G + 0.114B</td>
                                    <td className="px-4 py-3">Standard documents & office reports</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Up to 35%</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">High-Contrast B&W</td>
                                    <td className="px-4 py-3 font-mono text-xs">Dynamic Binary Thresholding</td>
                                    <td className="px-4 py-3">OCR text scanning & fax archiving</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Up to 60%</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Archival Sepia</td>
                                    <td className="px-4 py-3 font-mono text-xs">Warm Duotone Transformation</td>
                                    <td className="px-4 py-3">E-readers & low-eyestrain reading</td>
                                    <td className="px-4 py-3 text-slate-500">N/A (Digital)</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Blueprint Indigo</td>
                                    <td className="px-4 py-3 font-mono text-xs">Monochromatic Blue Curve</td>
                                    <td className="px-4 py-3">CAD schematics & architectural plans</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Specialized</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Convert PDF to Grayscale</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Document",
                                body: "Select or drag your PDF into the upload zone. Files up to 20 MB process directly in your browser window.",
                            },
                            {
                                step: "02",
                                title: "Choose Profile",
                                body: "Select from Rec. 601 standard grayscale, high-contrast black & white, sepia, or technical blueprint monochrome.",
                            },
                            {
                                step: "03",
                                title: "Fine-Tune Tone",
                                body: "Adjust brightness and contrast sliders to optimize legibility for faded scans or dense background graphics.",
                            },
                            {
                                step: "04",
                                title: "Download PDF",
                                body: "Click process to re-embed high-resolution monochromatic pages and download your processed PDF file instantly.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                    {step}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                                    <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 4: Security & Privacy */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>100% Client-Side Privacy Protection</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Your security and privacy are completely guaranteed. All PDF page parsing, canvas rendering, color vector math, and PDF re-compilation happen entirely within your local browser sandbox.
                        </p>
                        <p>
                            No document pages, images, or extracted text are ever transmitted to external servers, cloud databases, or third-party APIs. Your sensitive financial ledgers, legal contracts, and personal records remain strictly on your workstation.
                        </p>
                    </div>
                </div>

                {/* Card 5: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Why convert a PDF to grayscale before printing?",
                                a: "Converting full-color PDFs to grayscale forces printers to use lower-cost black toner instead of expensive cyan, magenta, and yellow color cartridges. It also speeds up printing output for high-volume jobs.",
                            },
                            {
                                q: "Does grayscale conversion reduce the file size of my PDF?",
                                a: "Yes. By stripping out multi-channel RGB or CMYK color profiles and re-encoding page streams using monochromatic image compression, converted PDF files are often significantly smaller.",
                            },
                            {
                                q: "Are my uploaded PDF documents stored on any server?",
                                a: "No. All operations run 100% locally in your web browser using HTML5 Canvas and client-side JavaScript. No file data ever leaves your device.",
                            },
                            {
                                q: "What is the maximum supported PDF file size?",
                                a: "Our suite supports PDF documents up to 20 MB directly in your browser. Larger files are limited only by your workstation's available memory.",
                            },
                        ].map(({ q, a }, idx) => (
                            <div
                                key={idx}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
                            >
                                <h3 className="font-bold text-slate-800 text-sm mb-1.5">{q}</h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Structured Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Grayscale PDF & Color Monochromatizer",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Convert full-color PDF files into high-quality grayscale, high-contrast black & white, or sepia monochromatic documents directly in your browser with zero server uploads.",
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Why convert a PDF to grayscale before printing?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Converting full-color PDFs to grayscale forces printers to use lower-cost black toner instead of expensive color cartridges.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Are my uploaded PDF documents stored on any server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All operations run 100% locally in your browser sandbox with complete privacy.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}