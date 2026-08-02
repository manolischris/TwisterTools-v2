"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    FileText,
    Upload,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Grid,
    RotateCw,
    RotateCcw,
    Eye,
    FileDown,
    Layers3,
    Cpu,
    Table,
    Workflow,
    Shield,
    HelpCircle,
    Scissors,
    Check,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

interface PDFPageItem {
    id: string;
    originalIndex: number;
    rotation: number;
    thumbnailUrl: string;
    selected: boolean;
}

export default function RemovePdfPages() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<PDFPageItem[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Processing & UI State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rangeInput, setRangeInput] = useState<string>("");

    // ── Drag & Drop Reordering State ──
    const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
    const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);

    // ── Preview Modal State ──
    const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // File Ingestion & Rendering Pipeline
    // ─────────────────────────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setErrorMessage(null);

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File size exceeds 20 MB limit. Please select a smaller PDF.");
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

            const pageItems: PDFPageItem[] = [];

            for (let i = 1; i <= count; i++) {
                setLoadingProgress(Math.round((i / count) * 90));
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 });

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
                        id: `page-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                        originalIndex: i - 1,
                        rotation: 0,
                        thumbnailUrl,
                        selected: false,
                    });
                }
            }

            setPages(pageItems);
            setLoadingProgress(100);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to load and render PDF file. The file may be corrupted or password-protected."
            );
            clearWorkspace();
        } finally {
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
        setRangeInput("");
        setPreviewPageUrl(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Page Operations
    // ─────────────────────────────────────────────────────────────

    const rotatePage = (index: number, direction: "cw" | "ccw") => {
        setPages((prev) =>
            prev.map((page, i) => {
                if (i !== index) return page;
                const delta = direction === "cw" ? 90 : -90;
                const newRotation = (page.rotation + delta + 360) % 360;
                return { ...page, rotation: newRotation };
            })
        );
    };

    const deletePage = (index: number) => {
        setPages((prev) => prev.filter((_, i) => i !== index));
    };

    const toggleSelectPage = (index: number) => {
        setPages((prev) =>
            prev.map((page, i) => (i === index ? { ...page, selected: !page.selected } : page))
        );
    };

    const selectAllPages = () => {
        const allSelected = pages.every((p) => p.selected);
        setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
    };

    const deleteSelectedPages = () => {
        setPages((prev) => prev.filter((page) => !page.selected));
    };

    const markPagesForDeletionFromRange = () => {
        if (!rangeInput.trim()) return;
        const indicesToDelete = new Set(parsePageRange(rangeInput, pages.length));
        setPages((prev) => prev.filter((_, idx) => !indicesToDelete.has(idx)));
        setRangeInput("");
    };

    // ─────────────────────────────────────────────────────────────
    // Drag & Drop Reordering
    // ─────────────────────────────────────────────────────────────

    const handleDragStart = (index: number) => {
        setDraggedPageIndex(index);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedPageIndex === null || draggedPageIndex === index) return;
        setDragOverPageIndex(index);
    };

    const handleDropReorder = (index: number) => {
        if (draggedPageIndex === null || draggedPageIndex === index) return;

        setPages((prev) => {
            const updated = [...prev];
            const [movedItem] = updated.splice(draggedPageIndex, 1);
            updated.splice(index, 0, movedItem);
            return updated;
        });

        setDraggedPageIndex(null);
        setDragOverPageIndex(null);
    };

    // ─────────────────────────────────────────────────────────────
    // PDF Compilation & Download Engine (pdf-lib)
    // ─────────────────────────────────────────────────────────────

    const handleExport = async () => {
        if (!pdfBytes || pages.length === 0) return;

        setIsExporting(true);
        setErrorMessage(null);

        try {
            const srcDoc = await PDFDocument.load(pdfBytes);
            const newDoc = await PDFDocument.create();

            for (const pageItem of pages) {
                const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex]);

                if (pageItem.rotation !== 0) {
                    const currentRot = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees((currentRot + pageItem.rotation) % 360));
                }

                newDoc.addPage(copiedPage);
            }

            const exportedBytes = await newDoc.save();
            const blob = new Blob([exportedBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName
                ? `${fileName.replace(/\.pdf$/i, "")}_modified.pdf`
                : "modified_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to export PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
        const indices = new Set<number>();
        const parts = rangeStr.split(",");

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes("-")) {
                const [start, end] = trimmed.split("-").map((num) => parseInt(num.trim(), 10));
                if (!isNaN(start) && !isNaN(end)) {
                    const min = Math.max(1, Math.min(start, end));
                    const max = Math.min(maxPages, Math.max(start, end));
                    for (let i = min; i <= max; i++) {
                        indices.add(i - 1);
                    }
                }
            } else {
                const pageNum = parseInt(trimmed, 10);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
                    indices.add(pageNum - 1);
                }
            }
        }

        return Array.from(indices).sort((a, b) => a - b);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const selectedCount = pages.filter((p) => p.selected).length;
    const removedCount = totalPages - pages.length;

    return (
        <div className="w-full space-y-8">

            {/* ── Workspace Grid (50/50 Split) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: UPLOAD & VISUAL CANVAS ══════════════════ */}
                <div className="space-y-5">
                    {/* File Upload Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">1. Upload Source PDF</h2>
                            </div>
                            {pdfFile && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Clear File
                                </button>
                            )}
                        </div>

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
                                : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
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
                                            {formatBytes(fileSize)} • {totalPages} Initial Pages
                                        </p>
                                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Ready for Page Deletion
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                        Drop PDF document here, or <span className="text-indigo-600">click to browse</span>
                                    </p>
                                    <p className="text-[11px] text-slate-400">Maximum file size limit: 20 MB</p>
                                </>
                            )}
                        </div>

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>Rendering Page Previews...</span>
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

                    {/* Interactive Page Canvas */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    2. Interactive Page Selector ({pages.length} Active)
                                </h2>
                            </div>
                            <p className="text-[11px] text-slate-500">Click dustbin icon to delete page</p>
                        </div>

                        {/* Batch Action Bar */}
                        {pages.length > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllPages}
                                        className="px-2.5 py-1 text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all"
                                    >
                                        {pages.every((p) => p.selected) ? "Deselect All" : "Select All"}
                                    </button>
                                    <span className="text-xs text-slate-500 font-mono">
                                        ({selectedCount} selected)
                                    </span>
                                </div>

                                {selectedCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={deleteSelectedPages}
                                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Selected ({selectedCount})
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Pages Grid Display */}
                        {pages.length === 0 ? (
                            <div className="h-[380px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No Pages Available</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload a PDF document above to render pages and manage page deletion.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[380px] overflow-y-auto pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {pages.map((page, index) => (
                                        <div
                                            key={page.id}
                                            draggable
                                            onDragStart={() => handleDragStart(index)}
                                            onDragOver={(e) => handleDragOver(e, index)}
                                            onDrop={() => handleDropReorder(index)}
                                            className={`relative group bg-white rounded-xl border p-2 transition-all flex flex-col items-center shadow-sm ${page.selected
                                                ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                                                : dragOverPageIndex === index
                                                    ? "border-indigo-400 border-2 scale-105"
                                                    : "border-slate-200 hover:border-slate-300"
                                                }`}
                                        >
                                            {/* Header Controls */}
                                            <div className="w-full flex items-center justify-between mb-1.5 px-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={page.selected}
                                                    onChange={() => toggleSelectPage(index)}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{index + 1}
                                                </span>
                                            </div>

                                            {/* Canvas Container */}
                                            <div
                                                className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 relative cursor-grab active:cursor-grabbing border border-slate-200"
                                                onClick={() => setPreviewPageUrl(page.thumbnailUrl)}
                                            >
                                                <img
                                                    src={page.thumbnailUrl}
                                                    alt={`Page ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                                                    style={{ transform: `rotate(${page.rotation}deg)` }}
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                </div>
                                            </div>

                                            {/* Quick Action Overlay */}
                                            <div className="w-full flex items-center justify-center gap-1 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => rotatePage(index, "ccw")}
                                                    className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-all"
                                                    title="Rotate Counter-Clockwise"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => rotatePage(index, "cw")}
                                                    className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-all"
                                                    title="Rotate Clockwise"
                                                >
                                                    <RotateCw className="w-3 h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deletePage(index)}
                                                    className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-all"
                                                    title="Delete Page"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: DELETION SETTINGS & EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Scissors className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                3. Page Range Deletion & Compilation
                            </h2>
                        </div>

                        {/* Quick Deletion by Range */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700">Delete Specific Page Numbers / Ranges</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={rangeInput}
                                    onChange={(e) => setRangeInput(e.target.value)}
                                    placeholder="e.g. 1-3, 5, 8-10"
                                    className="flex-1 text-xs font-mono border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={markPagesForDeletionFromRange}
                                    disabled={!rangeInput.trim() || pages.length === 0}
                                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl transition-all"
                                >
                                    Apply Range
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400">
                                Enter comma-separated single pages or hypenated ranges. Click apply to delete matching pages immediately.
                            </p>
                        </div>

                        {/* Metric Summary Panel */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Original Page Count:</span>
                                <span className="font-mono font-bold text-slate-800">{totalPages}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Total Pages Removed:</span>
                                <span className="font-mono font-bold text-rose-600">-{removedCount}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                                <span className="text-indigo-900 font-bold">Remaining Pages in Final PDF:</span>
                                <span className="font-mono font-bold text-indigo-600">{pages.length}</span>
                            </div>
                        </div>

                        {/* Export Action Button */}
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={pages.length === 0 || isExporting}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.length > 0 && !isExporting
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Rebuilding PDF Binary...</span>
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    <span>Export & Download Modified PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           FULL-SCREEN PREVIEW MODAL
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
                            <span className="text-xs font-bold text-slate-800">Page Expanded View</span>
                            <button
                                onClick={() => setPreviewPageUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img src={previewPageUrl} alt="Page Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg border" />
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6 mt-12">
                {/* Card 1: Technical Architecture of PDF Page Removal */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture of PDF Page Removal</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Removing pages from a PDF involves re-indexing the underlying document catalog and page object tree without corrupting shared resources. In the PDF specification (ISO 32000-2), a document is organized as a root indirect object leading to a hierarchical <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Pages</code> dictionary. Individual pages reference shared resources such as font subsets, vector graphic streams, and color spaces.
                    </p>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Our tool operates directly inside browser RAM using client-side JavaScript libraries <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdfjs-dist</code>. When you delete a page or specify a range, the underlying engine extracts only the retaining page objects and copies them into a brand-new PDF document binary structure. This guarantees that unused pages and unreferenced resources are completely stripped from the exported file, reducing file size and ensuring total structural security.
                    </p>
                </div>

                {/* Card 2: Feature Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Page Deletion & Optimization Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Deletion Method</th>
                                    <th className="px-4 py-3.5 font-bold">Primary Use Case</th>
                                    <th className="px-4 py-3.5 font-bold">Processing Logic</th>
                                    <th className="px-4 py-3.5 font-bold">Resulting File Impact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Single Page Deletion</td>
                                    <td className="px-4 py-3">Removing cover pages, blank pages, or specific mistakes</td>
                                    <td className="px-4 py-3 font-mono text-xs">Deletes selected /Page node pointer</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Reduced file size</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Batch Range Removal</td>
                                    <td className="px-4 py-3">Stripping whole chapters, appendices, or legal disclaimers</td>
                                    <td className="px-4 py-3 font-mono text-xs">Parses range arrays & slices document tree</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Targeted page count reduction</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Visual Grid Deletion</td>
                                    <td className="px-4 py-3">Interactive visual review and removal of scanned items</td>
                                    <td className="px-4 py-3 font-mono text-xs">Renders canvas preview before exclusion</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">100% accurate visual layout</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Step-by-Step Page Removal Workflow</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF File",
                                body: "Drag and drop your PDF document into the browser drop zone. Files up to 20 MB are supported with instant rendering.",
                            },
                            {
                                step: "02",
                                title: "Identify & Select Unwanted Pages",
                                body: "Hover over page thumbnails to view page numbers, or use the range input box to specify exact page sets (e.g. 2-4, 7).",
                            },
                            {
                                step: "03",
                                title: "Delete Selected Pages",
                                body: "Click the trash bin icon on individual thumbnails or click 'Delete Selected' to clear entire page ranges at once.",
                            },
                            {
                                step: "04",
                                title: "Download Clean PDF",
                                body: "Click 'Export & Download Modified PDF' to compile the remaining pages into a clean, brand-new PDF file.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                    {step}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 4: Security & Privacy */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>100% Client-Side Privacy & Security</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Privacy is critical when dealing with sensitive contracts, financial statements, or personal records. Unlike traditional online PDF utilities that require uploading your document to remote cloud servers, our tool processes everything locally in your web browser sandbox.
                    </p>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        No bytes are transmitted over the internet during the rendering, page deletion, or PDF compilation process. All temporary memory buffers are automatically wiped when you close or refresh the tab.
                    </p>
                </div>

                {/* Card 5: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Does deleting pages from a PDF reduce its file size?",
                                a: "Yes. When you remove pages using our engine, the underlying streams and unreferenced vector resources for those pages are omitted from the newly exported binary, resulting in a smaller overall file size.",
                            },
                            {
                                q: "Can I undo page deletions before exporting?",
                                a: "If you accidentally delete a page, you can click 'Clear File' and re-upload your source PDF to restore all original pages instantly.",
                            },
                            {
                                q: "Is there a limit on how many pages I can delete?",
                                a: "There is no limit to the number of pages you can remove, provided at least one active page remains to construct a valid output PDF.",
                            },
                            {
                                q: "Are my confidential files uploaded to any server?",
                                a: "No. The entire process runs locally inside your browser using JavaScript and WebAssembly. Your files never leave your computer.",
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
                        name: "Remove & Delete PDF Pages Tool",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Remove unwanted pages from PDF documents directly in your browser. Features visual grid deletion, custom page range stripping, and 100% client-side privacy.",
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
                                name: "Does deleting pages from a PDF reduce its file size?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, unreferenced page objects and streams are stripped, reducing file size.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Are my confidential files uploaded to any server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All operations run 100% client-side inside your browser sandbox.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}