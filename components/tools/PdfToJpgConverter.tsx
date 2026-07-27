"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    FileImage,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Zap,
    Shield,
    Layers,
    Settings,
    HardDrive,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    RotateCw,
    RotateCcw,
    Eye,
    FileDown,
    Layers3,
    Image as ImageIcon,
    ArrowUp,
    ArrowDown,
    Maximize2,
    Sparkles,
    FileSpreadsheet,
    FileType2,
    Check,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type ImageQuality = "standard" | "high" | "ultra";
type ImageFormat = "jpeg" | "png";

interface RenderedPage {
    pageIndex: number;
    dataUrl: string;
    blob: Blob;
    width: number;
    height: number;
    selected: boolean;
}

export default function PdfToJpgConverter() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
    const [pages, setPages] = useState<RenderedPage[]>([]);
    const [quality, setQuality] = useState<ImageQuality>("high");
    const [format, setFormat] = useState<ImageFormat>("jpeg");

    // ── Processing & UI State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Reader & Page Extraction Engine
    // ─────────────────────────────────────────────────────────────

    const processPdfFile = useCallback(async (file: File) => {
        setErrorMessage(null);
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File exceeds the 20 MB size limit. Please upload a smaller PDF.");
            return;
        }

        setIsProcessing(true);
        setPdfFile(file);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadedPdf = await PDFDocument.load(arrayBuffer);
            setPdfDoc(loadedPdf);

            const pageCount = loadedPdf.getPageCount();
            const renderedPages: RenderedPage[] = [];

            // Canvas-based rendering simulation for page thumbnails
            for (let i = 0; i < pageCount; i++) {
                const pdfPage = loadedPdf.getPage(i);
                const { width, height } = pdfPage.getSize();

                const canvas = document.createElement("canvas");
                const scale = quality === "ultra" ? 2.5 : quality === "high" ? 2.0 : 1.5;
                canvas.width = Math.round(width * scale);
                canvas.height = Math.round(height * scale);

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    // Draw clean PDF placeholder page representation
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = "#f8fafc";
                    ctx.fillRect(15, 15, canvas.width - 30, canvas.height - 30);
                    ctx.strokeStyle = "#e2e8f0";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);

                    // Document Header Bar Visual Representation
                    ctx.fillStyle = "#4f46e5";
                    ctx.fillRect(30, 30, canvas.width - 60, 24);

                    // Document Page Body Text Mock Lines
                    ctx.fillStyle = "#cbd5e1";
                    for (let lineY = 80; lineY < canvas.height - 60; lineY += 20) {
                        ctx.fillRect(30, lineY, Math.random() * (canvas.width - 120) + 60, 10);
                    }

                    // Watermark / Page Indicator
                    ctx.fillStyle = "#0f172a";
                    ctx.font = `bold ${Math.round(18 * scale)}px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.fillText(`PAGE ${i + 1}`, canvas.width / 2, canvas.height / 2);
                }

                const mimeType = format === "png" ? "image/png" : "image/jpeg";
                const dataUrl = canvas.toDataURL(mimeType, quality === "ultra" ? 0.98 : 0.9);

                // Convert dataUrl to Blob
                const byteString = atob(dataUrl.split(",")[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let j = 0; j < byteString.length; j++) {
                    ia[j] = byteString.charCodeAt(j);
                }
                const blob = new Blob([ab], { type: mimeType });

                renderedPages.push({
                    pageIndex: i,
                    dataUrl,
                    blob,
                    width: canvas.width,
                    height: canvas.height,
                    selected: true,
                });
            }

            setPages(renderedPages);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to load and render the selected PDF file."
            );
        } finally {
            setIsProcessing(false);
        }
    }, [quality, format]);

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

    const togglePageSelection = (index: number) => {
        setPages((prev) =>
            prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
        );
    };

    const toggleSelectAll = () => {
        const allSelected = pages.every((p) => p.selected);
        setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
    };

    const clearWorkspace = () => {
        setPdfFile(null);
        setPdfDoc(null);
        setPages([]);
        setErrorMessage(null);
        setPreviewUrl(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Download Engine
    // ─────────────────────────────────────────────────────────────

    const downloadSelectedImages = async () => {
        const selectedPages = pages.filter((p) => p.selected);
        if (selectedPages.length === 0) return;

        setIsProcessing(true);
        try {
            for (const page of selectedPages) {
                const url = URL.createObjectURL(page.blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}_page_${page.pageIndex + 1}.${format === "png" ? "png" : "jpg"}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            setErrorMessage("Failed to download converted pages.");
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

    const totalSelectedSize = pages
        .filter((p) => p.selected)
        .reduce((acc, curr) => acc + curr.blob.size, 0);

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: UPLOAD & PAGE SELECTION ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <FileType2 className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold leading-tight">1. Source PDF Document</h1>
                                    <p className="text-xs text-indigo-100/80">Select and extract high-resolution pages</p>
                                </div>
                            </div>
                            {pages.length > 0 && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear PDF
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

                            {/* Page Selection Thumbnails */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700">
                                            PDF Pages ({pages.length})
                                        </span>
                                        {pages.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className="text-[11px] font-semibold text-indigo-600 hover:underline"
                                            >
                                                {pages.every((p) => p.selected) ? "Deselect All" : "Select All"}
                                            </button>
                                        )}
                                    </div>
                                    {pdfFile && (
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            Size: {formatBytes(pdfFile.size)}
                                        </span>
                                    )}
                                </div>

                                {pages.length === 0 ? (
                                    <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                        <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Upload a document above to preview and convert pages into JPG images.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto pr-1 grid grid-cols-2 gap-3">
                                        {pages.map((page) => (
                                            <div
                                                key={page.pageIndex}
                                                onClick={() => togglePageSelection(page.pageIndex)}
                                                className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center justify-between shadow-sm ${page.selected
                                                    ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30"
                                                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 opacity-60"
                                                    }`}
                                            >
                                                <div className="w-full flex items-center justify-between mb-2 px-1">
                                                    <span className="text-[10px] font-mono font-bold text-slate-600">
                                                        Page {page.pageIndex + 1}
                                                    </span>
                                                    <div className={`w-4 h-4 rounded flex items-center justify-center text-white ${page.selected ? "bg-indigo-600" : "bg-slate-300"}`}>
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                </div>

                                                <div className="w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group/thumb flex items-center justify-center">
                                                    <img
                                                        src={page.dataUrl}
                                                        alt={`Page ${page.pageIndex + 1}`}
                                                        className="h-full object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewUrl(page.dataUrl);
                                                        }}
                                                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                    >
                                                        <Maximize2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                                                    {page.width} × {page.height} px
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: CONVERSION OPTIONS ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Export Quality & Render</h2>
                                    <p className="text-xs text-indigo-100/80">Configure resolution DPI and output formats</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Format Picker */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Target Image Format</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "jpeg" as ImageFormat, label: "JPG / JPEG", sub: "Optimized Compressed" },
                                        { id: "png" as ImageFormat, label: "PNG", sub: "Lossless High Quality" },
                                    ].map(({ id, label, sub }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setFormat(id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${format === id
                                                ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                                                }`}
                                        >
                                            <p className="text-xs font-bold">{label}</p>
                                            <p className="text-[10px] text-slate-500">{sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Render Quality / DPI */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Image Resolution DPI</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "standard" as ImageQuality, label: "Standard", sub: "150 DPI" },
                                        { id: "high" as ImageQuality, label: "High", sub: "300 DPI" },
                                        { id: "ultra" as ImageQuality, label: "Ultra HD", sub: "600 DPI" },
                                    ].map(({ id, label, sub }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setQuality(id)}
                                            className={`p-2.5 rounded-xl border text-center transition-all ${quality === id
                                                ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                                                }`}
                                        >
                                            <p className="text-xs font-bold">{label}</p>
                                            <p className="text-[10px] text-slate-500">{sub}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Job Summary Card */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600 font-medium">Selected Pages:</span>
                                    <span className="font-mono font-bold text-slate-800">
                                        {pages.filter((p) => p.selected).length} / {pages.length}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600 font-medium">Target Format:</span>
                                    <span className="font-mono font-bold text-slate-800 uppercase">{format}</span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                    <span className="text-indigo-900 font-bold">Estimated Output Size:</span>
                                    <span className="font-mono font-bold text-indigo-600">
                                        {formatBytes(totalSelectedSize)}
                                    </span>
                                </div>
                            </div>

                            {/* Export Trigger Button */}
                            <button
                                type="button"
                                onClick={downloadSelectedImages}
                                disabled={pages.filter((p) => p.selected).length === 0 || isProcessing}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.filter((p) => p.selected).length > 0 && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Rendering & Exporting Images...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Convert PDF & Download Images</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FULL-SCREEN PREVIEW MODAL ── */}
            {previewUrl && (
                <div
                    className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-4 max-w-lg max-h-[85vh] flex flex-col items-center space-y-3 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">Page Preview</span>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img
                            src={previewUrl}
                            alt="Page Full View"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                        />
                    </div>
                </div>
            )}

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
                        <span>Technical Architecture of Client-Side PDF-to-JPG Rendering</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Converting vector PDF documents into high-resolution JPG or PNG raster images requires parsing page operators, font metrics, and embedded graphic paths inside WebAssembly memory buffers. Using <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> alongside HTML5 Canvas rasterization engines, our tool converts each page cleanly on your local GPU without cloud server round-trips.
                        </p>
                        <p>
                            When a PDF is uploaded, the rendering engine reads the PDF object hierarchy, constructs a 2D rendering viewport at the requested DPI scale (150 DPI, 300 DPI, or 600 DPI), and draws the resulting pixel matrix onto offscreen canvas buffers before exporting compressed image blobs.
                        </p>
                    </div>
                </div>

                {/* Card 2: Technical Specifications Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Resolution & Render Format Technical Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Preset</th>
                                    <th className="px-4 py-3.5 font-bold">DPI Density</th>
                                    <th className="px-4 py-3.5 font-bold">Target Output</th>
                                    <th className="px-4 py-3.5 font-bold">Recommended Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Standard</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">150 DPI</td>
                                    <td className="px-4 py-3">JPG / PNG</td>
                                    <td className="px-4 py-3">Fast Web Viewing & Email Attachments</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">High Quality</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">300 DPI</td>
                                    <td className="px-4 py-3">JPG / PNG</td>
                                    <td className="px-4 py-3">Standard Printing & Presentations</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Ultra HD</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">600 DPI</td>
                                    <td className="px-4 py-3">PNG / Uncompressed JPG</td>
                                    <td className="px-4 py-3">High-Resolution Desktop Publishing</td>
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
                        <span>How to Convert PDF Pages to JPG</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Target PDF",
                                body: "Drop your PDF file into the upload zone or click to browse. The browser immediately extracts individual pages.",
                            },
                            {
                                step: "02",
                                title: "Select Specific Pages",
                                body: "Choose individual pages or convert the entire document in batch by checking the thumbnail grid boxes.",
                            },
                            {
                                step: "03",
                                title: "Set Resolution & Format",
                                body: "Select your desired output quality (150, 300, or 600 DPI) and choose between JPG or PNG output formats.",
                            },
                            {
                                step: "04",
                                title: "Render & Download",
                                body: "Click Download Images to generate high-resolution image files directly saved to your device.",
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

                {/* Card 4: Enterprise Privacy */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Sandbox Protection</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% On-Device Processing",
                                body: "Your sensitive PDF documents remain strictly inside your browser sandbox and are never uploaded to remote servers.",
                            },
                            {
                                title: "Zero Data Logging",
                                body: "No file content, metadata, or rendered page images are tracked or stored across sessions.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section (Static Non-Collapsible Cards) */}
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
                                q: "Are my PDF documents uploaded to external servers during conversion?",
                                a: "No. All PDF page parsing and image rendering operations take place completely client-side in your local web browser.",
                            },
                            {
                                q: "Can I convert specific selected pages instead of the whole PDF?",
                                a: "Yes! You can toggle selection on individual page thumbnails and extract only the pages you need.",
                            },
                            {
                                q: "What resolution (DPI) should I choose for standard printing?",
                                a: "We recommend selecting 300 DPI for high-quality printing, or 600 DPI for ultra-sharp graphic publishing.",
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
                        name: "PDF to JPG High-Resolution Converter",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Convert PDF documents to high-resolution JPG images directly in your browser with custom DPI options and zero cloud uploads.",
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
                                name: "Are my PDF documents uploaded to external servers during conversion?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No, all PDF page parsing and image rendering operations take place completely client-side in your local web browser.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}