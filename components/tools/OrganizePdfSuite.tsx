"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    FileText,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    Copy,
    Check,
    AlertTriangle,
    Zap,
    Shield,
    Layers,
    Settings,
    Sliders,
    HardDrive,
    HelpCircle,
    Cpu,
    Table,
    Sparkles,
    Info,
    CheckCircle2,
    ArrowRight,
    Workflow,
    BarChart3,
    Globe,
    FileCheck2,
    Grid,
    RotateCw,
    RotateCcw,
    Move,
    Scissors,
    Split,
    Eye,
    Plus,
    ArrowLeftRight,
    FileDown,
    Layers3,
    Lock,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface PDFPageItem {
    id: string; // Unique ID for key tracking
    originalIndex: number; // 0-based index in the master file
    rotation: number; // 0, 90, 180, 270
    thumbnailUrl: string; // Data URL of rendered page
    selected: boolean;
}

type SplitMode = "all" | "selected" | "range" | "extract";

export default function OrganizePdfSuite() {
    // ── Core File & Page State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<PDFPageItem[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Drag & Drop Reordering State ──
    const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
    const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);

    // ── Processing & UI State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [splitMode, setSplitMode] = useState<SplitMode>("all");
    const [rangeInput, setRangeInput] = useState<string>("");

    // ── Preview Modal State ──
    const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // File Loading & Thumbnail Rendering Pipeline
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
            // Set PDF.js worker source
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            // Slice the Uint8Array to store a safe copy in state, as pdfjsLib.getDocument
            // will neuter/transfer the underlying ArrayBuffer in its Web Worker thread.
            setPdfBytes(uint8Array.slice());

            // Load document via PDF.js for thumbnail rendering using another sliced copy
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
            const pdfDoc = await loadingTask.promise;
            const count = pdfDoc.numPages;
            setTotalPages(count);

            const pageItems: PDFPageItem[] = [];

            for (let i = 1; i <= count; i++) {
                setLoadingProgress(Math.round((i / count) * 90));
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail scale for performance

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
    // Page Manipulation Handlers
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

    const rotateAllSelected = (direction: "cw" | "ccw") => {
        setPages((prev) =>
            prev.map((page) => {
                if (!page.selected) return page;
                const delta = direction === "cw" ? 90 : -90;
                return { ...page, rotation: (page.rotation + delta + 360) % 360 };
            })
        );
    };

    const deleteSelectedPages = () => {
        setPages((prev) => prev.filter((page) => !page.selected));
    };

    // ─────────────────────────────────────────────────────────────
    // HTML5 Drag and Drop Reordering Handlers
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
    // Export & PDF Generation Pipeline (pdf-lib Engine)
    // ─────────────────────────────────────────────────────────────

    const handleExport = async () => {
        if (!pdfBytes || pages.length === 0) return;

        setIsExporting(true);
        setErrorMessage(null);

        try {
            const srcDoc = await PDFDocument.load(pdfBytes);
            const newDoc = await PDFDocument.create();

            let targetPagesToExport = [...pages];

            // Filter pages based on selected split mode
            if (splitMode === "selected") {
                targetPagesToExport = pages.filter((p) => p.selected);
                if (targetPagesToExport.length === 0) {
                    throw new Error("No pages selected for export. Please select at least one page.");
                }
            } else if (splitMode === "range") {
                if (!rangeInput.trim()) {
                    throw new Error("Please specify a valid page range (e.g. 1-3, 5).");
                }
                const indicesToKeep = parsePageRange(rangeInput, pages.length);
                if (indicesToKeep.length === 0) {
                    throw new Error("Invalid page range specified.");
                }
                targetPagesToExport = indicesToKeep.map((idx) => pages[idx]);
            }

            for (const pageItem of targetPagesToExport) {
                const [copiedPage] = await newDoc.copyPages(srcDoc, [pageItem.originalIndex]);

                // Apply accumulated rotation
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
                ? `${fileName.replace(/\.pdf$/i, "")}_organized.pdf`
                : "organized_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to generate export PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    // Helper: Parse range string (e.g., "1-3, 5, 7-9") into 0-based page array
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

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & VISUAL ORGANIZER ══════════════════ */}
                <div className="space-y-5">
                    {/* File Upload Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">1. Upload PDF Document</h2>
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
                                            {formatBytes(fileSize)} • {totalPages} Pages Loaded
                                        </p>
                                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Ready for Reordering & Extraction
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
                                    <span>Rendering Page Thumbnails...</span>
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

                    {/* Interactive Page Thumbnails Organizer */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    2. Visual Page Organizer ({pages.length})
                                </h2>
                            </div>
                            <p className="text-[11px] text-slate-500">Drag thumbnails to reorder pages</p>
                        </div>

                        {/* Batch Action Toolbar */}
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
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => rotateAllSelected("ccw")}
                                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all"
                                            title="Rotate Selected Counter-Clockwise"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => rotateAllSelected("cw")}
                                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-all"
                                            title="Rotate Selected Clockwise"
                                        >
                                            <RotateCw className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={deleteSelectedPages}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-all"
                                            title="Delete Selected Pages"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pages Grid Display */}
                        {pages.length === 0 ? (
                            <div className="h-[360px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload a PDF document above to display, reorder, rotate, and extract pages.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[360px] overflow-y-auto pr-1">
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
                                            {/* Page Header Bar */}
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

                                            {/* Thumbnail Image Container */}
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

                                            {/* Quick Page Action Overlay */}
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

                {/* ══════════════════ RIGHT PANEL: SPLIT OPTIONS & EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Split className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                3. Split Mode & Processing Settings
                            </h2>
                        </div>

                        {/* Split Mode Selection Radio Grid */}
                        <div className="space-y-2.5">
                            {[
                                {
                                    id: "all" as SplitMode,
                                    title: "Export Reordered PDF",
                                    desc: "Combines all remaining pages in their newly reordered and rotated layout.",
                                },
                                {
                                    id: "selected" as SplitMode,
                                    title: "Extract Selected Pages Only",
                                    desc: "Exports only the pages currently checked in the visual organizer.",
                                },
                                {
                                    id: "range" as SplitMode,
                                    title: "Custom Page Range Split",
                                    desc: "Specify exact page numbers or subsets (e.g. 1-3, 5, 8-10).",
                                },
                            ].map(({ id, title, desc }) => (
                                <label
                                    key={id}
                                    onClick={() => setSplitMode(id)}
                                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${splitMode === id
                                            ? "bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-500/30"
                                            : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="splitMode"
                                        checked={splitMode === id}
                                        onChange={() => setSplitMode(id)}
                                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800">{title}</p>
                                        <p className="text-[11px] text-slate-500 leading-normal">{desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Range Input Field */}
                        {splitMode === "range" && (
                            <div className="space-y-1.5 pt-1">
                                <label className="text-xs font-semibold text-slate-700">Enter Page Numbers / Ranges</label>
                                <input
                                    type="text"
                                    value={rangeInput}
                                    onChange={(e) => setRangeInput(e.target.value)}
                                    placeholder="e.g. 1-3, 5, 7-10"
                                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Total pages available in active sequence: {pages.length}
                                </p>
                            </div>
                        )}

                        {/* Export Summary Box */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Source Document Pages:</span>
                                <span className="font-mono font-bold text-slate-800">{totalPages}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Active Reordered Pages:</span>
                                <span className="font-mono font-bold text-slate-800">{pages.length}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                <span className="text-indigo-900 font-bold">Export Output Pages:</span>
                                <span className="font-mono font-bold text-indigo-600">
                                    {splitMode === "all"
                                        ? pages.length
                                        : splitMode === "selected"
                                            ? selectedCount
                                            : parsePageRange(rangeInput, pages.length).length}
                                </span>
                            </div>
                        </div>

                        {/* Export Trigger Button */}
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={pages.length === 0 || isExporting}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.length > 0 && !isExporting
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Processing & Compiling PDF...</span>
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    <span>Process & Download Organized PDF</span>
                                </>
                            )}
                        </button>
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
                            <span className="text-xs font-bold text-slate-800">Page Preview</span>
                            <button
                                onClick={() => setPreviewPageUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img src={previewPageUrl} alt="Page Expanded Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg border" />
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture & PDF Syntax */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of PDF Page Manipulation</span>
                        <span className="ml-auto hidden md:inline-flex px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-mono font-semibold text-indigo-600 flex-shrink-0">
                            ISO 32000-2 Compliant
                        </span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The Portable Document Format (PDF) specification (ISO 32000-2) treats pages as structured indirect object nodes in an acyclic page tree. Reordering, rotating, or extracting pages requires modifying the root catalog's <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Pages</code> dictionary, updating page object references, and resolving cross-reference stream locations without destroying downstream interactive elements such as form fields, bookmarks, or embedded font subsets.
                        </p>
                        <p>
                            Traditional web tools rely on server-side utilities like Ghostscript, Poppler, or ImageMagick, which require uploading sensitive files over external HTTP networks. Our suite shifts the entire compilation pipeline directly into your browser's WebAssembly and JavaScript engines using <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> and Mozilla's <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdfjs-dist</code>.
                        </p>
                        <p>
                            When a PDF is uploaded, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf.js</code> parses byte offsets to render hardware-accelerated HTML5 Canvas thumbnails. When you reorder pages or set rotation angles, our engine updates a virtual document tree in RAM. Upon export, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> constructs a new PDF binary structure from the source byte array, applying physical transformations while maintaining original vector objects, text layouts, and metadata integrity.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature & Operation Comparison Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Page Manipulation & Split Operation Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare target workflow requirements, split modes, and client-side processing operations supported by our engine:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Operation Mode</th>
                                    <th className="px-4 py-3.5 font-bold">Target Use Case</th>
                                    <th className="px-4 py-3.5 font-bold">Processing Logic</th>
                                    <th className="px-4 py-3.5 font-bold">Preserved Metadata</th>
                                    <th className="px-4 py-3.5 font-bold">Export Format</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Drag & Drop Reorder</td>
                                    <td className="px-4 py-3">Fixing mixed-up scans or presentation slides</td>
                                    <td className="px-4 py-3 font-mono text-xs">Re-indexes /Pages tree pointers</td>
                                    <td className="px-4 py-3">Vector shapes, text streams, links</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Single Organized .pdf</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Page Rotation (90°/180°)</td>
                                    <td className="px-4 py-3">Correcting landscape/portrait oriented pages</td>
                                    <td className="px-4 py-3 font-mono text-xs">Modifies /Rotate entry per page</td>
                                    <td className="px-4 py-3">Font subsets, annotations</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Rotated .pdf document</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Selective Extraction</td>
                                    <td className="px-4 py-3">Isolating key chapters, receipts, or invoices</td>
                                    <td className="px-4 py-3 font-mono text-xs">Filters checked page indices</td>
                                    <td className="px-4 py-3">Embedded images, color spaces</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Targeted Subset .pdf</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Custom Range Split</td>
                                    <td className="px-4 py-3">Splitting long documents into specific sets</td>
                                    <td className="px-4 py-3 font-mono text-xs">Parses range strings (e.g. 1-3, 5)</td>
                                    <td className="px-4 py-3">Document catalog structure</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Custom Range .pdf</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Organize & Split PDF Documents</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF File",
                                body: "Select or drag any PDF up to 20 MB into the secure upload zone. The engine renders instant canvas thumbnails for every page.",
                            },
                            {
                                step: "02",
                                title: "Reorder, Rotate, or Delete",
                                body: "Drag page thumbnails to adjust sequence order, click rotation buttons to align orientations, or delete unwanted pages.",
                            },
                            {
                                step: "03",
                                title: "Select Split or Export Mode",
                                body: "Choose whether to compile all active pages, extract checked items, or specify a custom range string (e.g. 1-4, 8).",
                            },
                            {
                                step: "04",
                                title: "Download Processed PDF",
                                body: "Click process to compile the new document in browser memory and automatically save the reorganized PDF to your device.",
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

                {/* Card 4: Enterprise Privacy & Client-Side Sandbox Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Client-Side Security & Data Privacy Guarantees</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero Server Uploads",
                                body: "Your PDF files are processed entirely inside browser memory using WebAssembly and client-side JavaScript. No file data is ever transmitted to remote servers.",
                            },
                            {
                                title: "Confidential Document Protection",
                                body: "Because files remain isolated inside your device's browser sandbox, sensitive financial statements, legal contracts, and medical records stay 100% private.",
                            },
                            {
                                title: "Instant Processing Speed",
                                body: "Client-side processing avoids network upload latencies, rendering thumbnails and compiling extracted PDFs instantly regardless of internet speed.",
                            },
                            {
                                title: "Automatic Memory Cleanup",
                                body: "Temporary binary buffers and thumbnail canvas objects are immediately cleared when you clear the workspace or refresh the page.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Frequently Asked Questions */}
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
                                q: "Can I reorder PDF pages by dragging and dropping them?",
                                a: "Yes! Click and hold any page thumbnail, then drag it to your preferred position in the grid. The sequence updates instantly.",
                            },
                            {
                                q: "Is there a file size limit for PDF processing?",
                                a: "Our suite supports PDF files up to 20 MB directly within your web browser. Larger files are limited only by your workstation's available RAM.",
                            },
                            {
                                q: "Does organizing or rotating PDF pages degrade text or image quality?",
                                a: "No. Our engine manipulates underlying PDF object trees without re-compressing pages or converting text into images. Vector quality and selectable text remain intact.",
                            },
                            {
                                q: "How does the custom page range split mode work?",
                                a: "You can specify individual pages or ranges separated by commas (for example, '1-3, 5, 8-10'). Only those specific pages will be included in the exported PDF file.",
                            },
                            {
                                q: "Are my uploaded PDF files safe?",
                                a: "Absolutely. All processing occurs locally on your device. Your files are never uploaded to any remote server or cloud service.",
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
                        name: "Organize & Split PDF Pages Suite",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Organize, reorder, rotate, split, and extract PDF pages directly in your browser with zero file uploads and complete data privacy.",
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
                                name: "Can I reorder PDF pages by dragging and dropping them?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes, you can drag and drop thumbnail previews to reorder pages in real-time.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Are my uploaded PDF files safe?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes. All operations run 100% client-side inside your browser sandbox using pdf-lib and PDF.js.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}