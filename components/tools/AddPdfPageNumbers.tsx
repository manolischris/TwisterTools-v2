"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    Upload,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Settings,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    Shield,
    FileText,
    Check,
    Hash,
    Eye,
    Type,
    Layout,
    Palette,
    FileCheck,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type Position =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

type NumberFormat =
    | "page"
    | "page-of-total"
    | "custom-header"
    | "custom-footer";

interface PagePreview {
    pageIndex: number;
    dataUrl: string;
    width: number;
    height: number;
}

export default function AddPdfPageNumbers() {
    // ── File & Engine State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [previews, setPreviews] = useState<PagePreview[]>([]);
    const [selectedPreviewPage, setSelectedPreviewPage] = useState<number>(0);

    // ── Page Number Configuration Options ──
    const [position, setPosition] = useState<Position>("bottom-center");
    const [format, setFormat] = useState<NumberFormat>("page-of-total");
    const [customText, setCustomText] = useState<string>("Page {page} of {total}");
    const [startPage, setStartPage] = useState<number>(1);
    const [endPage, setEndPage] = useState<number>(1);
    const [startNumberingFrom, setStartNumberingFrom] = useState<number>(1);
    const [fontSize, setFontSize] = useState<number>(11);
    const [fontColor, setFontColor] = useState<string>("#0f172a");
    const [fontFamily, setFontFamily] = useState<"Helvetica" | "TimesRoman" | "Courier">("Helvetica");
    const [margin, setMargin] = useState<number>(25);

    // ── Processing & UI State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Loading & Thumbnail Generation Engine
    // ─────────────────────────────────────────────────────────────

    const renderThumbnails = useCallback(async (bytes: Uint8Array) => {
        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
            const pdfDocInstance = await loadingTask.promise;
            const count = pdfDocInstance.numPages;
            const renderedPreviews: PagePreview[] = [];

            for (let i = 1; i <= Math.min(count, 10); i++) {
                setProcessingStatus(`Rendering preview thumbnail ${i} of ${Math.min(count, 10)}...`);
                const page = await pdfDocInstance.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });

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

                    renderedPreviews.push({
                        pageIndex: i - 1,
                        dataUrl: canvas.toDataURL("image/jpeg", 0.8),
                        width: viewport.width,
                        height: viewport.height,
                    });
                }
            }

            setPreviews(renderedPreviews);
        } catch (err) {
            console.error("Thumbnail rendering error:", err);
        }
    }, []);

    const processPdfFile = useCallback(
        async (file: File) => {
            setErrorMessage(null);
            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                setErrorMessage("Invalid file format. Please upload a valid PDF document.");
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                setErrorMessage("File exceeds the maximum limit of 20 MB. Please choose a smaller PDF.");
                return;
            }

            setIsProcessing(true);
            setProcessingStatus("Loading PDF document structure...");
            setPdfFile(file);

            try {
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                setPdfBytes(uint8Array);

                const pdfDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: true });
                const count = pdfDoc.getPageCount();
                setTotalPages(count);
                setStartPage(1);
                setEndPage(count);

                await renderThumbnails(uint8Array);
            } catch (err) {
                setErrorMessage(
                    err instanceof Error
                        ? err.message
                        : "Failed to parse PDF file. Ensure the file is not password-protected."
                );
            } finally {
                setIsProcessing(false);
                setProcessingStatus(null);
            }
        },
        [renderThumbnails]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processPdfFile(e.dataTransfer.files[0]);
            }
        },
        [processPdfFile]
    );

    const clearWorkspace = () => {
        setPdfFile(null);
        setPdfBytes(null);
        setTotalPages(0);
        setPreviews([]);
        setErrorMessage(null);
        setSelectedPreviewPage(0);
    };

    // Hex Color to RGB helper
    const hexToRgb = (hex: string) => {
        const cleanHex = hex.replace("#", "");
        const bigint = parseInt(cleanHex, 16);
        const r = ((bigint >> 16) & 255) / 255;
        const g = ((bigint >> 8) & 255) / 255;
        const b = (bigint & 255) / 255;
        return rgb(r, g, b);
    };

    // Format String Builder
    const buildStampText = (pageNum: number, total: number) => {
        if (format === "page") return `${pageNum}`;
        if (format === "page-of-total") return `Page ${pageNum} of ${total}`;
        if (format === "custom-header" || format === "custom-footer") {
            return customText
                .replace("{page}", String(pageNum))
                .replace("{total}", String(total));
        }
        return `Page ${pageNum} of ${total}`;
    };

    // ─────────────────────────────────────────────────────────────
    // PDF Stamp Injection & Export Engine
    // ─────────────────────────────────────────────────────────────

    const applyPageNumbersAndDownload = async () => {
        if (!pdfBytes) return;

        setIsProcessing(true);
        setProcessingStatus("Injecting page numbers and headers/footers...");

        try {
            const pdfDoc = await PDFDocument.load(pdfBytes);
            let pdfFont;

            if (fontFamily === "TimesRoman") {
                pdfFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            } else if (fontFamily === "Courier") {
                pdfFont = await pdfDoc.embedFont(StandardFonts.Courier);
            } else {
                pdfFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            }

            const color = hexToRgb(fontColor);
            const pdfPages = pdfDoc.getPages();

            const startIndex = Math.max(0, startPage - 1);
            const endIndex = Math.min(totalPages - 1, endPage - 1);

            for (let i = startIndex; i <= endIndex; i++) {
                const page = pdfPages[i];
                const { width, height } = page.getSize();

                const currentDisplayNum = startNumberingFrom + (i - startIndex);
                const textToStamp = buildStampText(currentDisplayNum, totalPages);
                const textWidth = pdfFont.widthOfTextAtSize(textToStamp, fontSize);

                let x = margin;
                let y = margin;

                // X Coordinate calculation
                if (position.includes("center")) {
                    x = (width - textWidth) / 2;
                } else if (position.includes("right")) {
                    x = width - margin - textWidth;
                } else if (position.includes("left")) {
                    x = margin;
                }

                // Y Coordinate calculation
                if (position.includes("top")) {
                    y = height - margin - fontSize;
                } else if (position.includes("bottom")) {
                    y = margin;
                }

                page.drawText(textToStamp, {
                    x,
                    y,
                    size: fontSize,
                    font: pdfFont,
                    color,
                });
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const blob = new Blob([modifiedPdfBytes as BlobPart], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"
                }_numbered.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "An error occurred while stamping the PDF."
            );
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: PDF SOURCE & PREVIEW ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Hash className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold leading-tight">1. Source Document & Pages</h1>
                                    <p className="text-xs text-indigo-100/80">Upload PDF and inspect page layouts</p>
                                </div>
                            </div>
                            {pdfFile && (
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear File
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-8 px-4 text-center ${isDragging
                                        ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                        : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && processPdfFile(e.target.files[0])}
                                />
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-slate-800 mb-1">
                                    Drop your PDF file here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-400">Supports documents up to 20 MB</p>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Document Overview & Page Selection Preview */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">
                                        Page Preview {previews.length > 0 ? `(1 - ${previews.length} of ${totalPages})` : ""}
                                    </span>
                                    {pdfFile && (
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            File Size: {formatBytes(pdfFile.size)}
                                        </span>
                                    )}
                                </div>

                                {previews.length === 0 ? (
                                    <div className="h-[360px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                        <FileText className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Upload a document above to configure page numbering position, font, and custom stamp formats.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-[360px] border border-slate-200 rounded-xl bg-slate-100 p-4 overflow-y-auto space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {previews.map((preview) => (
                                                <div
                                                    key={preview.pageIndex}
                                                    onClick={() => setSelectedPreviewPage(preview.pageIndex)}
                                                    className={`relative border bg-white rounded-lg p-2 cursor-pointer transition-all flex flex-col items-center shadow-sm ${selectedPreviewPage === preview.pageIndex
                                                            ? "border-indigo-500 ring-2 ring-indigo-500/20"
                                                            : "border-slate-200 hover:border-slate-300"
                                                        }`}
                                                >
                                                    <div className="w-full flex justify-between items-center mb-1 px-1">
                                                        <span className="text-[10px] font-mono font-bold text-slate-600">
                                                            Page {preview.pageIndex + 1}
                                                        </span>
                                                        {preview.pageIndex + 1 >= startPage && preview.pageIndex + 1 <= endPage && (
                                                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="relative w-full h-36 bg-slate-50 rounded border border-slate-100 overflow-hidden flex items-center justify-center">
                                                        <img
                                                            src={preview.dataUrl}
                                                            alt={`Page ${preview.pageIndex + 1}`}
                                                            className="h-full object-contain"
                                                        />
                                                        {/* Visual Simulated Overlay */}
                                                        {preview.pageIndex + 1 >= startPage && preview.pageIndex + 1 <= endPage && (
                                                            <div
                                                                className={`absolute text-[9px] font-bold px-1 py-0.5 rounded bg-indigo-600 text-white shadow-sm pointer-events-none truncate max-w-[80%] ${position === "top-left"
                                                                        ? "top-1 left-1"
                                                                        : position === "top-center"
                                                                            ? "top-1 left-1/2 -translate-x-1/2"
                                                                            : position === "top-right"
                                                                                ? "top-1 right-1"
                                                                                : position === "bottom-left"
                                                                                    ? "bottom-1 left-1"
                                                                                    : position === "bottom-center"
                                                                                        ? "bottom-1 left-1/2 -translate-x-1/2"
                                                                                        : "bottom-1 right-1"
                                                                    }`}
                                                            >
                                                                {buildStampText(
                                                                    startNumberingFrom + (preview.pageIndex - (startPage - 1)),
                                                                    totalPages
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: NUMBERING CONFIGURATION ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Stamp & Layout Settings</h2>
                                    <p className="text-xs text-indigo-100/80">Customize positions, typography, and ranges</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Position Grid Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Layout className="w-3.5 h-3.5 text-indigo-600" />
                                    Stamp Position on Page
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            { id: "top-left", label: "Top Left" },
                                            { id: "top-center", label: "Top Center" },
                                            { id: "top-right", label: "Top Right" },
                                            { id: "bottom-left", label: "Bottom Left" },
                                            { id: "bottom-center", label: "Bottom Center" },
                                            { id: "bottom-right", label: "Bottom Right" },
                                        ] as const
                                    ).map((pos) => (
                                        <button
                                            key={pos.id}
                                            type="button"
                                            onClick={() => setPosition(pos.id)}
                                            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${position === pos.id
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            {pos.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Numbering Format Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                                    Numbering & Text Format
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            { id: "page", label: "Simple Number", sub: "e.g. 1" },
                                            { id: "page-of-total", label: "Page of Total", sub: "e.g. Page 1 of 10" },
                                            { id: "custom-header", label: "Custom Header", sub: "Top Custom Text" },
                                            { id: "custom-footer", label: "Custom Footer", sub: "Bottom Custom Text" },
                                        ] as const
                                    ).map((fmt) => (
                                        <button
                                            key={fmt.id}
                                            type="button"
                                            onClick={() => setFormat(fmt.id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${format === fmt.id
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                                }`}
                                        >
                                            <p className="text-xs font-bold">{fmt.label}</p>
                                            <p className="text-[10px] text-slate-500">{fmt.sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Text Template (if selected) */}
                            {(format === "custom-header" || format === "custom-footer") && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-800">
                                        Custom Template (<span className="text-indigo-600">{"{page}"}</span> and{" "}
                                        <span className="text-indigo-600">{"{total}"}</span> supported)
                                    </label>
                                    <input
                                        type="text"
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Doc ID: 409 | Page {page} of {total}"
                                    />
                                </div>
                            )}

                            {/* Page Range & Starting Index Controls */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">Start Page</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages || 1}
                                        value={startPage}
                                        onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">End Page</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages || 1}
                                        value={endPage}
                                        onChange={(e) =>
                                            setEndPage(Math.min(totalPages || 1, parseInt(e.target.value) || 1))
                                        }
                                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">First Number</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={startNumberingFrom}
                                        onChange={(e) =>
                                            setStartNumberingFrom(Math.max(1, parseInt(e.target.value) || 1))
                                        }
                                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Typography & Color Styling Controls */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">Font Family</label>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value as any)}
                                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
                                    >
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="TimesRoman">Times New Roman</option>
                                        <option value="Courier">Courier</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">Size (pt)</label>
                                    <input
                                        type="number"
                                        min={6}
                                        max={36}
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value) || 11)}
                                        className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">Font Color</label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="color"
                                            value={fontColor}
                                            onChange={(e) => setFontColor(e.target.value)}
                                            className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                                        />
                                        <span className="text-[10px] font-mono text-slate-500 uppercase">
                                            {fontColor}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Margin Offset */}
                            <div className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                    <label className="font-bold text-slate-800">Edge Offset Margin</label>
                                    <span className="font-mono text-slate-500">{margin} pt</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={60}
                                    value={margin}
                                    onChange={(e) => setMargin(parseInt(e.target.value))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>

                            {/* Action Trigger Button */}
                            <button
                                type="button"
                                onClick={applyPageNumbersAndDownload}
                                disabled={!pdfBytes || isProcessing}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pdfBytes && !isProcessing
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>{processingStatus || "Processing PDF..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Stamp PDF & Download Document</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Content Injection</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Stamping page numbers, headers, and footers onto standard PDF documents involves direct manipulation of the binary PDF Object Model without re-rasterizing document vectors. Utilizing local client-side WebAssembly rendering via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code>, our processor opens the target PDF file buffer, parses page dimension dictionaries, and embeds Standard Type-1 fonts (Helvetica, Times Roman, or Courier) directly into the file stream.
                        </p>
                        <p>
                            By evaluating explicit coordinate offsets relative to page boundaries (x, y coordinates calculated in points where 1 pt = 1/72 inch), the engine draws text operators onto page content streams while maintaining strict vector fidelity. Because operations run directly in browser memory, your confidential documents are processed with zero latency and complete cloud privacy.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Page Numbering & Header/Footer Specification Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Feature Option</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Modes</th>
                                    <th className="px-4 py-3.5 font-bold">Technical Range</th>
                                    <th className="px-4 py-3.5 font-bold">Enterprise Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Positions</td>
                                    <td className="px-4 py-3">Top/Bottom × Left/Center/Right</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">6 Alignment Targets</td>
                                    <td className="px-4 py-3">Legal Bate Stamping & Standard Pagination</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Typography</td>
                                    <td className="px-4 py-3">Helvetica, Times, Courier</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">6 pt to 36 pt Font Sizes</td>
                                    <td className="px-4 py-3">Brand Consistent Document Formatting</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Page Masking</td>
                                    <td className="px-4 py-3">Custom Start/End Range Selection</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">1 to Total Page Count</td>
                                    <td className="px-4 py-3">Suppressing Numbers on Cover Pages</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Custom Text</td>
                                    <td className="px-4 py-3">Dynamic Template Tokens</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">{"{page}"} and {"{total}"}</td>
                                    <td className="px-4 py-3">Document Identifiers & Header Stamps</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Add Page Numbers to PDF Files</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Document",
                                body: "Select or drop your target PDF file into the upload area. The processor analyzes the page count and dimensions.",
                            },
                            {
                                step: "02",
                                title: "Choose Position & Format",
                                body: "Select where the stamp appears (e.g. Bottom Center) and pick between simple numbers or Page X of Y formats.",
                            },
                            {
                                step: "03",
                                title: "Set Page Range & Style",
                                body: "Define specific page numbers (e.g. skip cover page) and customize the font family, font size, and color.",
                            },
                            {
                                step: "04",
                                title: "Stamp & Export",
                                body: "Click Stamp PDF & Download Document to generate and save your updated PDF file in seconds.",
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & In-Memory Execution</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Client-Side Processing",
                                body: "All PDF parsing, vector calculations, and text font embedding occur locally inside your web browser sandbox.",
                            },
                            {
                                title: "Zero Cloud File Transfers",
                                body: "Your confidential PDF files are never uploaded to remote servers or stored on external cloud infrastructure.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section (Static Cards) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Can I skip putting page numbers on the first page or cover sheet?",
                                a: "Yes! You can easily adjust the 'Start Page' setting to 2 or any desired page, ensuring cover pages remain clean.",
                            },
                            {
                                q: "Does adding page numbers decrease original PDF vector quality?",
                                a: "No. The underlying document content, vector graphics, and text streams remain completely unmodified. Page numbers are added directly as native text objects.",
                            },
                            {
                                q: "Are my files uploaded to any external server during processing?",
                                a: "No. All PDF operations run 100% locally in your web browser using WebAssembly and client-side JavaScript.",
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

            {/* ── JSON-LD Structured Data Schemas ── */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Add PDF Page Numbers & Header/Footer Stamps",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Add custom page numbers, headers, and footers to PDF documents securely inside your browser.",
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
                                name: "Can I skip putting page numbers on the first page or cover sheet?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, adjust the 'Start Page' setting to 2 or any desired page.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}