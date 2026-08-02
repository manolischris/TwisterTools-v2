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
} from "lucide-react";
import { PDFDocument, PageSizes, degrees } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type PageOrientation = "portrait" | "landscape";
type PageMargin = "none" | "small" | "large";
type PageSizeOption = "a4" | "letter" | "fit";

interface ImageItem {
    id: string;
    file: File;
    previewUrl: string;
    width: number;
    height: number;
    rotation: number; // 0, 90, 180, 270
}

export default function JpgToPdfConverter() {
    // ── Core State ──
    const [images, setImages] = useState<ImageItem[]>([]);
    const [pageSize, setPageSize] = useState<PageSizeOption>("a4");
    const [orientation, setOrientation] = useState<PageOrientation>("portrait");
    const [margin, setMargin] = useState<PageMargin>("small");

    // ── Processing & UI State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ── Drag & Drop Reordering State ──
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    // ── Preview Modal State ──
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // Image Loading & Ingestion Pipeline
    // ─────────────────────────────────────────────────────────────

    const processFiles = useCallback((files: FileList | File[]) => {
        setErrorMessage(null);
        const validFiles = Array.from(files).filter(
            (file) =>
                file.type === "image/jpeg" ||
                file.type === "image/png" ||
                file.type === "image/webp" ||
                file.name.match(/\.(jpg|jpeg|png|webp)$/i)
        );

        if (validFiles.length === 0) {
            setErrorMessage(
                "Invalid file format. Please upload JPG, JPEG, PNG, or WEBP image files."
            );
            return;
        }

        // Guardrail: Max 20MB per file check
        const oversized = validFiles.some((f) => f.size > 20 * 1024 * 1024);
        if (oversized) {
            setErrorMessage(
                "One or more images exceed the 20 MB size limit. Please select smaller files."
            );
            return;
        }

        const newItems: ImageItem[] = [];
        let pendingCount = validFiles.length;

        validFiles.forEach((file) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                newItems.push({
                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    file,
                    previewUrl: url,
                    width: img.width,
                    height: img.height,
                    rotation: 0,
                });
                pendingCount--;
                if (pendingCount === 0) {
                    setImages((prev) => [...prev, ...newItems]);
                }
            };
            img.onerror = () => {
                pendingCount--;
                if (pendingCount === 0 && newItems.length > 0) {
                    setImages((prev) => [...prev, ...newItems]);
                }
            };
            img.src = url;
        });
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFiles(e.dataTransfer.files);
            }
        },
        [processFiles]
    );

    const clearWorkspace = () => {
        images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
        setErrorMessage(null);
        setPreviewUrl(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Interactive Image Actions
    // ─────────────────────────────────────────────────────────────

    const rotateImage = (index: number, direction: "cw" | "ccw") => {
        setImages((prev) =>
            prev.map((item, i) => {
                if (i !== index) return item;
                const delta = direction === "cw" ? 90 : -90;
                return { ...item, rotation: (item.rotation + delta + 360) % 360 };
            })
        );
    };

    const removeImage = (index: number) => {
        setImages((prev) => {
            URL.revokeObjectURL(prev[index].previewUrl);
            return prev.filter((_, i) => i !== index);
        });
    };

    const moveImage = (index: number, direction: "up" | "down") => {
        if (
            (direction === "up" && index === 0) ||
            (direction === "down" && index === images.length - 1)
        ) {
            return;
        }
        const targetIdx = direction === "up" ? index - 1 : index + 1;
        setImages((prev) => {
            const updated = [...prev];
            const temp = updated[index];
            updated[index] = updated[targetIdx];
            updated[targetIdx] = temp;
            return updated;
        });
    };

    // Drag and drop reordering
    const handleDragStart = (index: number) => {
        setDraggedIdx(index);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;
        setDragOverIdx(index);
    };

    const handleDropReorder = (index: number) => {
        if (draggedIdx === null || draggedIdx === index) return;
        setImages((prev) => {
            const updated = [...prev];
            const [moved] = updated.splice(draggedIdx, 1);
            updated.splice(index, 0, moved);
            return updated;
        });
        setDraggedIdx(null);
        setDragOverIdx(null);
    };

    // ─────────────────────────────────────────────────────────────
    // PDF Compilation Engine (pdf-lib)
    // ─────────────────────────────────────────────────────────────

    const generatePdf = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const pdfDoc = await PDFDocument.create();

            // Determine margin size in points
            let marginPts = 0;
            if (margin === "small") marginPts = 20;
            if (margin === "large") marginPts = 40;

            for (const item of images) {
                const arrayBuffer = await item.file.arrayBuffer();
                let pdfImage;
                if (
                    item.file.type === "image/png" ||
                    item.file.name.toLowerCase().endsWith(".png")
                ) {
                    pdfImage = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    // Default to JPEG embedding for JPG/JPEG/WEBP converts
                    pdfImage = await pdfDoc.embedJpg(arrayBuffer);
                }

                let pWidth: number;
                let pHeight: number;

                // Determine Page Bounds
                if (pageSize === "a4") {
                    pWidth = PageSizes.A4[0];
                    pHeight = PageSizes.A4[1];
                } else if (pageSize === "letter") {
                    pWidth = PageSizes.Letter[0];
                    pHeight = PageSizes.Letter[1];
                } else {
                    // "fit" mode — match image natural dimensions
                    pWidth = item.width + marginPts * 2;
                    pHeight = item.height + marginPts * 2;
                }

                // Apply Landscape swap if user selected landscape and not auto-fit
                if (pageSize !== "fit" && orientation === "landscape") {
                    const temp = pWidth;
                    pWidth = pHeight;
                    pHeight = temp;
                }

                const page = pdfDoc.addPage([pWidth, pHeight]);

                // Calculate available drawing bounds taking margins into account
                const availWidth = pWidth - marginPts * 2;
                const availHeight = pHeight - marginPts * 2;

                // Fit image inside available bounds while preserving aspect ratio
                const imgAspect = item.width / item.height;
                const availAspect = availWidth / availHeight;

                let drawWidth: number;
                let drawHeight: number;

                if (imgAspect > availAspect) {
                    drawWidth = availWidth;
                    drawHeight = availWidth / imgAspect;
                } else {
                    drawHeight = availHeight;
                    drawWidth = availHeight * imgAspect;
                }

                // Center on page
                const x = marginPts + (availWidth - drawWidth) / 2;
                const y = marginPts + (availHeight - drawHeight) / 2;

                page.drawImage(pdfImage, {
                    x,
                    y,
                    width: drawWidth,
                    height: drawHeight,
                    rotate: degrees(item.rotation),
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `jpg_converted_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to compile PDF. Please ensure all uploaded files are valid images."
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

    const totalInputSize = images.reduce((acc, curr) => acc + curr.file.size, 0);

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: FILE UPLOAD & REORDER ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">1. Source Images</h2>
                                    <p className="text-xs text-indigo-100/80">Upload & arrange images for PDF conversion</p>
                                </div>
                            </div>
                            {images.length > 0 && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear All
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
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                                />
                                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-slate-800 mb-1">
                                    Drop JPG, PNG, or WEBP images here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-400">Maximum file size: 20 MB per image</p>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Image Reorder Thumbnail Grid */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">
                                        Uploaded Sequence ({images.length})
                                    </span>
                                    {images.length > 0 && (
                                        <span className="text-[11px] text-slate-500 font-mono">
                                            Total: {formatBytes(totalInputSize)}
                                        </span>
                                    )}
                                </div>

                                {images.length === 0 ? (
                                    <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                        <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Images Loaded</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Select or drop image files above to populate the PDF page queue.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto pr-1 space-y-2">
                                        {images.map((item, index) => (
                                            <div
                                                key={item.id}
                                                draggable
                                                onDragStart={() => handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDrop={() => handleDropReorder(index)}
                                                className={`group bg-white rounded-xl border p-2.5 transition-all flex items-center gap-3 shadow-sm ${dragOverIdx === index
                                                    ? "border-indigo-500 bg-indigo-50/30 scale-[1.01]"
                                                    : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                {/* Page Number Badge */}
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-mono font-bold text-slate-600 flex-shrink-0">
                                                    #{index + 1}
                                                </div>

                                                {/* Thumbnail Image */}
                                                <div
                                                    className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200 flex-shrink-0 cursor-pointer relative group/thumb"
                                                    onClick={() => setPreviewUrl(item.previewUrl)}
                                                >
                                                    <img
                                                        src={item.previewUrl}
                                                        alt={item.file.name}
                                                        className="w-full h-full object-cover transition-transform"
                                                        style={{ transform: `rotate(${item.rotation}deg)` }}
                                                    />
                                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Maximize2 className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>

                                                {/* Metadata */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">
                                                        {item.file.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        {item.width} × {item.height} px • {formatBytes(item.file.size)}
                                                    </p>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveImage(index, "up")}
                                                        disabled={index === 0}
                                                        className="p-1 hover:bg-slate-100 text-slate-600 rounded disabled:opacity-30"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveImage(index, "down")}
                                                        disabled={index === images.length - 1}
                                                        className="p-1 hover:bg-slate-100 text-slate-600 rounded disabled:opacity-30"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => rotateImage(index, "cw")}
                                                        className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                                                        title="Rotate Clockwise"
                                                    >
                                                        <RotateCw className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                                                        title="Remove Image"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PDF PAGE LAYOUT & CONVERT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Settings className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Layout Options & Compile</h2>
                                    <p className="text-xs text-indigo-100/80">Configure page geometry and dimensions</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Page Size Picker */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Page Size Standard</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "a4" as PageSizeOption, label: "A4", sub: "210 × 297 mm" },
                                        { id: "letter" as PageSizeOption, label: "US Letter", sub: "8.5 × 11 in" },
                                        { id: "fit" as PageSizeOption, label: "Auto Fit", sub: "Match Image Size" },
                                    ].map(({ id, label, sub }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setPageSize(id)}
                                            className={`p-2.5 rounded-xl border text-left transition-all ${pageSize === id
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

                            {/* Page Orientation */}
                            {pageSize !== "fit" && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-800">Page Orientation</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: "portrait" as PageOrientation, label: "Portrait (Vertical)" },
                                            { id: "landscape" as PageOrientation, label: "Landscape (Horizontal)" },
                                        ].map(({ id, label }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => setOrientation(id)}
                                                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${orientation === id
                                                    ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                    : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Margin Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800">Page Margin Spacing</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "none" as PageMargin, label: "No Margin" },
                                        { id: "small" as PageMargin, label: "Small Margin" },
                                        { id: "large" as PageMargin, label: "Big Margin" },
                                    ].map(({ id, label }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setMargin(id)}
                                            className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${margin === id
                                                ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dynamic Job Summary Card */}
                            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600 font-medium">Image Count:</span>
                                    <span className="font-mono font-bold text-slate-800">{images.length}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600 font-medium">Page Format:</span>
                                    <span className="font-mono font-bold text-slate-800 uppercase">
                                        {pageSize} {pageSize !== "fit" && `(${orientation})`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                    <span className="text-indigo-900 font-bold">Estimated Pages Output:</span>
                                    <span className="font-mono font-bold text-indigo-600">{images.length} Pages</span>
                                </div>
                            </div>

                            {/* Export Trigger Button */}
                            <button
                                type="button"
                                onClick={generatePdf}
                                disabled={images.length === 0 || isProcessing}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${images.length > 0 && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Compiling PDF Document...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Convert Images to PDF & Download</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FULL-SCREEN THUMBNAIL PREVIEW MODAL ── */}
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
                            <span className="text-xs font-bold text-slate-800">Full Image Preview</span>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img
                            src={previewUrl}
                            alt="Expanded Preview"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                        />
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture of Raster to PDF Rendering */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side Raster-to-PDF Conversion</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Converting raster images (JPEG, PNG, WEBP) into standard PDF documents requires wrapping individual pixel streams inside a vector page coordinate geometry defined by ISO 32000-2 standards. Instead of re-encoding or compressing images on external cloud servers, our converter embeds full binary image streams directly into the generated PDF catalog using browser WebAssembly memory buffers via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code>.
                        </p>
                        <p>
                            When an image is dropped into the canvas, HTML5 FileReaders calculate natural aspect ratios and pixel bounds. The converter maps these raw pixels directly onto target page dimensions (A4, Letter, or natural dimensions) while automatically preserving resolution scale factors.
                        </p>
                        <p>
                            By embedding native binary byte structures directly, zero generation latency is introduced, and original image detail remains 100% loss-free without lossy double compression.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix Table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Image Conversion & Page Geometry Technical Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Image Format</th>
                                    <th className="px-4 py-3.5 font-bold">Target Page Dimension</th>
                                    <th className="px-4 py-3.5 font-bold">Margin Padding</th>
                                    <th className="px-4 py-3.5 font-bold">Embedding Engine</th>
                                    <th className="px-4 py-3.5 font-bold">Output Quality</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">JPEG / JPG</td>
                                    <td className="px-4 py-3">A4 / Letter / Auto Fit</td>
                                    <td className="px-4 py-3">0px, 20px, 40px</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Direct DCT Stream</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Lossless Passthrough</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">PNG (Alpha Channel)</td>
                                    <td className="px-4 py-3">A4 / Letter / Auto Fit</td>
                                    <td className="px-4 py-3">0px, 20px, 40px</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PNG FlateDecoder</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">Alpha Preserved</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">WEBP</td>
                                    <td className="px-4 py-3">A4 / Letter / Auto Fit</td>
                                    <td className="px-4 py-3">0px, 20px, 40px</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Canvas Native Vector</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">100% Vector Bounds</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Convert JPG Images to PDF</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Image Files",
                                body: "Select or drag any JPG, PNG, or WEBP photos into the workspace. The tool renders real-time thumbnail previews.",
                            },
                            {
                                step: "02",
                                title: "Adjust Page Order & Angles",
                                body: "Drag images to adjust vertical page ordering, or rotate misaligned photos using the interactive orientation buttons.",
                            },
                            {
                                step: "03",
                                title: "Configure Geometry & Margins",
                                body: "Choose page sizes (A4, Letter, Auto Fit), orientation (Portrait/Landscape), and page border margin spacing.",
                            },
                            {
                                step: "04",
                                title: "Compile & Download PDF",
                                body: "Click Convert to compile the entire image gallery into a consolidated multi-page PDF saved directly to your device.",
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Client-Side Sandbox Security</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero Remote Uploads",
                                body: "All image-to-PDF binary compiling takes place directly inside browser RAM. Image bytes never cross external networks.",
                            },
                            {
                                title: "Sensitive Photo Protection",
                                body: "Private documents, passport scans, receipts, and personal photos stay completely isolated on your computer.",
                            },
                            {
                                title: "Instant Offline Capability",
                                body: "Because processing does not rely on cloud workers or server queues, compilation completes in milliseconds.",
                            },
                            {
                                title: "Automatic RAM Flushing",
                                body: "All object URLs and image memory buffers are automatically destroyed upon clearing or closing the tab.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Will converting my JPG images to PDF decrease picture quality?",
                                a: "No. Our conversion engine embeds raw JPEG binary byte streams directly into the PDF pages without re-compressing or resampling the images.",
                            },
                            {
                                q: "Can I combine multiple image formats into one PDF?",
                                a: "Yes! You can mix JPG, JPEG, PNG, and WEBP images together in the same upload batch and combine them into a single consolidated PDF document.",
                            },
                            {
                                q: "Is there a limit to how many images I can convert at once?",
                                a: "There is no set file count limit. The converter handles dozens of images smoothly in browser memory up to your workstation's RAM limits.",
                            },
                            {
                                q: "Are my personal uploaded photos private and safe?",
                                a: "Yes. All processing happens 100% locally on your device inside your web browser. No files or image data are ever uploaded to external cloud servers.",
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
                        name: "JPG to PDF Converter",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Convert JPG, PNG, and WEBP images to PDF documents instantly in your web browser with custom page sizes, margins, and zero file uploads.",
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
                                name: "Will converting my JPG images to PDF decrease picture quality?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No, raw JPEG binary byte streams are embedded directly into PDF pages without re-compression.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Are my personal uploaded photos private and safe?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, all conversion happens 100% locally inside your web browser.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}