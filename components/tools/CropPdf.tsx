"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    Crop,
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
    Layers3,
    Maximize2,
    FileDown,
    Check,
    RotateCcw,
    Sliders,
    Scissors,
    CheckSquare,
    Square,
    Zap,
} from "lucide-react";
import { PDFDocument, PDFPage, PageSizes } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface CropBox {
    x: number; // Crop box X offset in points
    y: number; // Crop box Y offset in points
    width: number; // Crop box width in points
    height: number; // Crop box height in points
}

interface PageData {
    pageIndex: number;
    dataUrl: string;
    originalWidth: number; // Original page width in points (72 DPI)
    originalHeight: number; // Original page height in points (72 DPI)
    cropBox: CropBox;
    selected: boolean;
}

type AspectRatioOption = "custom" | "a4" | "letter" | "1:1" | "4:3" | "16:9";

type DragHandle = "box" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | null;

export default function CropPdf() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
    const [applyToAll, setApplyToAll] = useState<boolean>(true);
    const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("custom");

    // ── Drag & Resize Box State (Normalized % of container) ──
    const [cropPercent, setCropPercent] = useState<{
        x: number;
        y: number;
        w: number;
        h: number;
    }>({
        x: 5,
        y: 5,
        w: 90,
        h: 90,
    });

    // Margin Controls (Points)
    const [marginTop, setMarginTop] = useState<number>(20);
    const [marginBottom, setMarginBottom] = useState<number>(20);
    const [marginLeft, setMarginLeft] = useState<number>(20);
    const [marginRight, setMarginRight] = useState<number>(20);

    // ── UI / Processing State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Active Drag / Resize state inside interactive canvas
    const [activeHandle, setActiveHandle] = useState<DragHandle>(null);
    const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [cropPercentStart, setCropPercentStart] = useState<{
        x: number;
        y: number;
        w: number;
        h: number;
    }>({ x: 5, y: 5, w: 90, h: 90 });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfBytesRef = useRef<Uint8Array | null>(null);
    const imageElementRef = useRef<HTMLImageElement>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Parsing Engine
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
        setProcessingStatus("Loading PDF document...");
        setPdfFile(file);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            pdfBytesRef.current = uint8Array;

            const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
            const pdfDocInstance = await loadingTask.promise;
            const pageCount = pdfDocInstance.numPages;
            const renderedPages: PageData[] = [];

            for (let i = 1; i <= pageCount; i++) {
                setProcessingStatus(`Rendering page ${i} of ${pageCount}...`);
                const page = await pdfDocInstance.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });

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

                    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

                    renderedPages.push({
                        pageIndex: i - 1,
                        dataUrl,
                        originalWidth: viewport.width,
                        originalHeight: viewport.height,
                        cropBox: {
                            x: 0,
                            y: 0,
                            width: viewport.width,
                            height: viewport.height,
                        },
                        selected: true,
                    });
                }
            }

            setPages(renderedPages);
            setSelectedPageIndex(0);
            setCropPercent({ x: 5, y: 5, w: 90, h: 90 });
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to load and render the selected PDF file."
            );
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDraggingFile(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processPdfFile(e.dataTransfer.files[0]);
            }
        },
        [processPdfFile]
    );

    const clearWorkspace = () => {
        setPdfFile(null);
        pdfBytesRef.current = null;
        setPages([]);
        setErrorMessage(null);
        setPreviewUrl(null);
        setSelectedPageIndex(0);
        setCropPercent({ x: 5, y: 5, w: 90, h: 90 });
    };

    // ─────────────────────────────────────────────────────────────
    // Interactive Canvas Mouse & Drag Event Handlers
    // ─────────────────────────────────────────────────────────────

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: DragHandle) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveHandle(handle);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setCropPercentStart({ ...cropPercent });
    };

    const handlePointerMove = useCallback(
        (e: PointerEvent) => {
            if (!activeHandle || !imageElementRef.current) return;

            const rect = imageElementRef.current.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            const deltaXPercent = ((e.clientX - dragStartPos.x) / rect.width) * 100;
            const deltaYPercent = ((e.clientY - dragStartPos.y) / rect.height) * 100;

            setCropPercent(() => {
                let { x, y, w, h } = cropPercentStart;

                if (activeHandle === "box") {
                    x = Math.max(0, Math.min(100 - w, x + deltaXPercent));
                    y = Math.max(0, Math.min(100 - h, y + deltaYPercent));
                } else if (activeHandle === "top-left") {
                    const newX = Math.max(0, Math.min(x + w - 5, x + deltaXPercent));
                    const newY = Math.max(0, Math.min(y + h - 5, y + deltaYPercent));
                    w = w + (x - newX);
                    h = h + (y - newY);
                    x = newX;
                    y = newY;
                } else if (activeHandle === "top-right") {
                    const newW = Math.max(5, Math.min(100 - x, w + deltaXPercent));
                    const newY = Math.max(0, Math.min(y + h - 5, y + deltaYPercent));
                    h = h + (y - newY);
                    y = newY;
                    w = newW;
                } else if (activeHandle === "bottom-left") {
                    const newX = Math.max(0, Math.min(x + w - 5, x + deltaXPercent));
                    const newH = Math.max(5, Math.min(100 - y, h + deltaYPercent));
                    w = w + (x - newX);
                    x = newX;
                    h = newH;
                } else if (activeHandle === "bottom-right") {
                    w = Math.max(5, Math.min(100 - x, w + deltaXPercent));
                    h = Math.max(5, Math.min(100 - y, h + deltaYPercent));
                }

                return { x, y, w, h };
            });
        },
        [activeHandle, dragStartPos, cropPercentStart]
    );

    const handlePointerUp = useCallback(() => {
        setActiveHandle(null);
    }, []);

    useEffect(() => {
        if (activeHandle) {
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        }
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [activeHandle, handlePointerMove, handlePointerUp]);

    // Sync crop calculations to pages array & update margin inputs
    useEffect(() => {
        if (pages.length === 0) return;

        const currentPage = pages[selectedPageIndex];
        if (!currentPage) return;

        const calcCropBoxFromPercent = (): CropBox => {
            const x = (cropPercent.x / 100) * currentPage.originalWidth;
            const y = (cropPercent.y / 100) * currentPage.originalHeight;
            const width = (cropPercent.w / 100) * currentPage.originalWidth;
            const height = (cropPercent.h / 100) * currentPage.originalHeight;

            return { x, y, width, height };
        };

        const newCropBox = calcCropBoxFromPercent();

        // Sync margin numeric input displays based on current percentage position
        const t = Math.round((cropPercent.y / 100) * currentPage.originalHeight);
        const b = Math.round(((100 - (cropPercent.y + cropPercent.h)) / 100) * currentPage.originalHeight);
        const l = Math.round((cropPercent.x / 100) * currentPage.originalWidth);
        const r = Math.round(((100 - (cropPercent.x + cropPercent.w)) / 100) * currentPage.originalWidth);

        setMarginTop(t);
        setMarginBottom(b);
        setMarginLeft(l);
        setMarginRight(r);

        setPages((prev) =>
            prev.map((p, idx) => {
                if (applyToAll || idx === selectedPageIndex) {
                    return { ...p, cropBox: newCropBox };
                }
                return p;
            })
        );
    }, [cropPercent, applyToAll, selectedPageIndex]);

    // Apply Uniform Margin Trimming Preset
    const applyMarginTrimming = (t: number, b: number, l: number, r: number) => {
        if (pages.length === 0) return;
        const currentPage = pages[selectedPageIndex];
        if (!currentPage) return;

        const newW = currentPage.originalWidth - (l + r);
        const newH = currentPage.originalHeight - (t + b);

        if (newW <= 10 || newH <= 10) {
            setErrorMessage("Trim margins exceed page dimensions.");
            return;
        }

        const xPct = (l / currentPage.originalWidth) * 100;
        const yPct = (t / currentPage.originalHeight) * 100;
        const wPct = (newW / currentPage.originalWidth) * 100;
        const hPct = (newH / currentPage.originalHeight) * 100;

        setCropPercent({
            x: Math.max(0, Math.min(100, xPct)),
            y: Math.max(0, Math.min(100, yPct)),
            w: Math.max(5, Math.min(100, wPct)),
            h: Math.max(5, Math.min(100, hPct)),
        });
    };

    // Aspect Ratio Preset Lock
    const handleAspectRatioChange = (ratio: AspectRatioOption) => {
        setAspectRatio(ratio);
        if (ratio === "custom") return;

        let targetRatio = 1.0;
        if (ratio === "1:1") targetRatio = 1.0;
        else if (ratio === "4:3") targetRatio = 4 / 3;
        else if (ratio === "16:9") targetRatio = 16 / 9;
        else if (ratio === "a4") targetRatio = PageSizes.A4[0] / PageSizes.A4[1];
        else if (ratio === "letter") targetRatio = PageSizes.Letter[0] / PageSizes.Letter[1];

        setCropPercent((prev) => {
            let newH = prev.w / targetRatio;
            if (prev.y + newH > 100) {
                newH = 100 - prev.y;
            }
            return { ...prev, h: newH };
        });
    };

    const togglePageSelection = (index: number) => {
        setPages((prev) =>
            prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
        );
    };

    const toggleSelectAll = () => {
        const allSelected = pages.every((p) => p.selected);
        setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
    };

    // ─────────────────────────────────────────────────────────────
    // PDF Crop Execution & Save Engine (pdf-lib)
    // ─────────────────────────────────────────────────────────────

    const executePdfCrop = async () => {
        if (!pdfBytesRef.current || pages.length === 0) return;

        setIsProcessing(true);
        setProcessingStatus("Applying crop boundaries to PDF pages...");

        try {
            const pdfDoc = await PDFDocument.load(pdfBytesRef.current.slice());
            const pdfPages = pdfDoc.getPages();

            pages.forEach((pageData, idx) => {
                if (!pageData.selected) return;

                const pdfPage = pdfPages[idx];
                if (!pdfPage) return;

                const { cropBox, originalHeight } = pageData;

                // Note: pdf-lib uses a lower-left coordinate origin (0,0 is bottom-left).
                // HTML5 Canvas / PDF.js viewports use top-left as origin (0,0 is top-left).
                const pdfX = cropBox.x;
                const pdfY = originalHeight - (cropBox.y + cropBox.height);

                pdfPage.setCropBox(pdfX, pdfY, cropBox.width, cropBox.height);
                pdfPage.setMediaBox(pdfX, pdfY, cropBox.width, cropBox.height);
            });

            setProcessingStatus("Encoding final PDF document...");
            const croppedPdfBytes = await pdfDoc.save();

            const blob = new Blob([croppedPdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}_cropped.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to execute PDF cropping operation."
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

    const activePage = pages[selectedPageIndex];

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
                                    <Crop className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold leading-tight">1. Source Document & Pages</h1>
                                    <p className="text-xs text-indigo-100/80">Select target PDF and configure pages</p>
                                </div>
                            </div>
                            {pages.length > 0 && (
                                <button
                                    type="button"
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
                                    setIsDraggingFile(true);
                                }}
                                onDragLeave={() => setIsDraggingFile(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-8 px-4 text-center ${isDraggingFile
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

                            {/* Page Selection Grid */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-700">
                                            Document Pages ({pages.length})
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
                                            File Size: {formatBytes(pdfFile.size)}
                                        </span>
                                    )}
                                </div>

                                {pages.length === 0 ? (
                                    <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                        <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Upload a PDF above to preview pages, trim margins, and crop custom areas.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-[320px] overflow-y-auto pr-1 grid grid-cols-2 gap-3">
                                        {pages.map((page) => (
                                            <div
                                                key={page.pageIndex}
                                                onClick={() => setSelectedPageIndex(page.pageIndex)}
                                                className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center justify-between shadow-sm ${selectedPageIndex === page.pageIndex
                                                        ? "border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-500/40"
                                                        : page.selected
                                                            ? "border-slate-200 bg-white hover:border-slate-300"
                                                            : "border-slate-200 bg-slate-50 opacity-60"
                                                    }`}
                                            >
                                                <div className="w-full flex items-center justify-between mb-2 px-1">
                                                    <span className="text-[10px] font-mono font-bold text-slate-600">
                                                        Page {page.pageIndex + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePageSelection(page.pageIndex);
                                                        }}
                                                        className={`w-4 h-4 rounded flex items-center justify-center text-white ${page.selected ? "bg-indigo-600" : "bg-slate-300"
                                                            }`}
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </button>
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

                                                <p className="text-[10px] text-slate-500 font-mono mt-1.5">
                                                    {Math.round(page.cropBox.width)} × {Math.round(page.cropBox.height)} pt
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: INTERACTIVE CROP & CONTROLS ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Scissors className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Interactive Crop & Margins</h2>
                                    <p className="text-xs text-indigo-100/80">Adjust crop boundaries and target trim boxes</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Interactive Canvas Workspace */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-800">
                                        Active Canvas: Page {selectedPageIndex + 1}
                                    </span>
                                    {activePage && (
                                        <span className="text-slate-500 font-mono text-[11px]">
                                            Original: {Math.round(activePage.originalWidth)} × {Math.round(activePage.originalHeight)} pt
                                        </span>
                                    )}
                                </div>

                                {!activePage ? (
                                    <div className="h-[280px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                                        <Crop className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Canvas Active</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Upload a PDF document to activate interactive visual cropping handles.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-[280px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-2 select-none">
                                        <div className="relative max-h-full max-w-full flex items-center justify-center">
                                            <img
                                                ref={imageElementRef}
                                                src={activePage.dataUrl}
                                                alt="Crop Canvas"
                                                className="max-h-[264px] max-w-full object-contain pointer-events-none select-none"
                                            />

                                            {/* Dynamic Interactive Crop Box */}
                                            <div
                                                onPointerDown={(e) => handlePointerDown(e, "box")}
                                                style={{
                                                    left: `${cropPercent.x}%`,
                                                    top: `${cropPercent.y}%`,
                                                    width: `${cropPercent.w}%`,
                                                    height: `${cropPercent.h}%`,
                                                }}
                                                className="absolute border-2 border-indigo-400 bg-indigo-500/20 shadow-2xl rounded-sm cursor-move flex items-center justify-center touch-none"
                                            >
                                                <div className="text-[10px] font-mono font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                                                    {Math.round(activePage.cropBox.width)} × {Math.round(activePage.cropBox.height)} pt
                                                </div>

                                                {/* Interactive Drag Handles */}
                                                <div
                                                    onPointerDown={(e) => handlePointerDown(e, "top-left")}
                                                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                                                />
                                                <div
                                                    onPointerDown={(e) => handlePointerDown(e, "top-right")}
                                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                                                />
                                                <div
                                                    onPointerDown={(e) => handlePointerDown(e, "bottom-left")}
                                                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                                                />
                                                <div
                                                    onPointerDown={(e) => handlePointerDown(e, "bottom-right")}
                                                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Scope & Aspect Ratio Settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-800">Apply Crop Scope</label>
                                    <button
                                        type="button"
                                        onClick={() => setApplyToAll((prev) => !prev)}
                                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${applyToAll
                                                ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                                                : "bg-slate-50/50 border-slate-200 text-slate-700"
                                            }`}
                                    >
                                        <span className="text-xs font-bold">
                                            {applyToAll ? "All Pages" : "Current Page Only"}
                                        </span>
                                        <div
                                            className={`w-4 h-4 rounded flex items-center justify-center text-white ${applyToAll ? "bg-indigo-600" : "bg-slate-300"
                                                }`}
                                        >
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-800">Aspect Ratio Preset</label>
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatioOption)}
                                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
                                    >
                                        <option value="custom">Custom (Freehand)</option>
                                        <option value="a4">Standard A4 Ratio</option>
                                        <option value="letter">US Letter Ratio</option>
                                        <option value="1:1">Square (1:1)</option>
                                        <option value="4:3">Standard (4:3)</option>
                                        <option value="16:9">Widescreen (16:9)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Margin Trimmer Numeric Controls */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800">
                                        Margin Trimmer (Points)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMarginTop(20);
                                            setMarginBottom(20);
                                            setMarginLeft(20);
                                            setMarginRight(20);
                                            applyMarginTrimming(20, 20, 20, 20);
                                        }}
                                        className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset 20pt
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: "Top", val: marginTop, setter: setMarginTop },
                                        { label: "Bottom", val: marginBottom, setter: setMarginBottom },
                                        { label: "Left", val: marginLeft, setter: setMarginLeft },
                                        { label: "Right", val: marginRight, setter: setMarginRight },
                                    ].map(({ label, val, setter }) => (
                                        <div key={label} className="space-y-1">
                                            <span className="text-[10px] font-semibold text-slate-500">{label}</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={val}
                                                onChange={(e) => {
                                                    const v = Math.max(0, parseInt(e.target.value) || 0);
                                                    setter(v);
                                                    applyMarginTrimming(
                                                        label === "Top" ? v : marginTop,
                                                        label === "Bottom" ? v : marginBottom,
                                                        label === "Left" ? v : marginLeft,
                                                        label === "Right" ? v : marginRight
                                                    );
                                                }}
                                                className="w-full text-xs font-mono p-2 rounded-lg border border-slate-200 bg-slate-50 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Export Trigger Button */}
                            <button
                                type="button"
                                onClick={executePdfCrop}
                                disabled={pages.filter((p) => p.selected).length === 0 || isProcessing}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.filter((p) => p.selected).length > 0 && !isProcessing
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>{processingStatus || "Processing PDF Crop..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Crop PDF & Download File</span>
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
                                type="button"
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
                        <span>Technical Architecture of Client-Side PDF Page Cropping</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Modifying the visual dimensions of a Portable Document Format (PDF) file without rasterizing vector text or degrading image resolution requires direct manipulation of the document&apos;s internal page geometry dictionary. Using <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> in combination with HTML5 Canvas viewport rendering, our engine adjusts the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/CropBox</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/MediaBox</code> coordinate arrays directly within client browser memory.
                        </p>
                        <p>
                            When a PDF is uploaded, PDF.js extracts rendered page thumbnails for interactive UI positioning, while <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> recalibrates the bottom-left coordinate origin vectors. This guarantees that vector text paths, embedded font glyphs, and high-DPI graphics remain 100% crisp and uncompressed after cropping.
                        </p>
                    </div>
                </div>

                {/* Card 2: PDF Geometry & Coordinate Box Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Geometry Box Specifications Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">PDF Box Name</th>
                                    <th className="px-4 py-3.5 font-bold">Coordinate Origin</th>
                                    <th className="px-4 py-3.5 font-bold">Function in Rendering</th>
                                    <th className="px-4 py-3.5 font-bold">Cropping Behavior</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">/MediaBox</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Bottom-Left (0,0)</td>
                                    <td className="px-4 py-3">Defines physical page medium size</td>
                                    <td className="px-4 py-3">Updated to match crop boundary</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">/CropBox</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Variable Offset</td>
                                    <td className="px-4 py-3">Defines visible display viewport area</td>
                                    <td className="px-4 py-3">Primary target for margin trimming</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">/TrimBox</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Print Margin Offset</td>
                                    <td className="px-4 py-3">Defines intended finished page dimensions</td>
                                    <td className="px-4 py-3">Adjusted for commercial printing compliance</td>
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
                        <span>How to Crop PDF Pages & Trim Margins</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Target PDF Document",
                                body: "Drop your PDF file into the secure workspace or select it from your device. Page visual previews generate automatically.",
                            },
                            {
                                step: "02",
                                title: "Adjust Crop Boundaries & Margins",
                                body: "Use the interactive canvas overlay or enter exact point measurements in the top, bottom, left, and right margin boxes.",
                            },
                            {
                                step: "03",
                                title: "Set Scope & Aspect Ratios",
                                body: "Choose whether to apply crop boundaries to all document pages or only the active selection, with support for standard aspect ratios.",
                            },
                            {
                                step: "04",
                                title: "Process & Download Cropped PDF",
                                body: "Click Crop PDF & Download File to output the updated document instantly with zero quality loss or server uploads.",
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

                {/* Card 4: Enterprise Privacy & Client Performance */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Sandbox Security</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% On-Device Processing",
                                body: "All PDF parsing, coordinate math, and document rewriting happen inside your browser sandbox. Confidential files never touch remote servers.",
                            },
                            {
                                title: "Zero Vector Quality Loss",
                                body: "Because page contents are re-bound rather than rasterized to bitmap images, text remains sharp, selectable, and fully searchable.",
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
                                q: "Does cropping a PDF reduce its visual clarity or compress images?",
                                a: "No. Cropping only adjusts the visible display boundaries (/CropBox and /MediaBox) inside the PDF metadata. All underlying vector text and original image layers remain entirely intact.",
                            },
                            {
                                q: "Can I trim unequal margins from different sides of a page?",
                                a: "Yes! You can specify independent numerical point measurements for Top, Bottom, Left, and Right margins to remove unwanted headers, footers, or blank borders.",
                            },
                            {
                                q: "Are my confidential PDF documents uploaded or stored anywhere?",
                                a: "Never. All cropping routines are computed locally on your device via client-side WebAssembly and JavaScript.",
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
                        name: "Crop PDF Pages & Margin Trimmer",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Crop PDF pages and trim white margins online with interactive handle previews and zero file uploads.",
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
                                name: "Does cropping a PDF reduce its visual clarity or compress images?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. Cropping only adjusts the visible display boundaries (/CropBox and /MediaBox) inside the PDF metadata.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}