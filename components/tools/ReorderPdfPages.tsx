"use client";

import React, { useState, useCallback, useRef } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import {
    FileText,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    RotateCw,
    RotateCcw,
    Maximize2,
    Check,
    ArrowLeftRight,
    Shield,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Layers,
    ListOrdered,
} from "lucide-react";

interface PDFPageItem {
    id: string;
    originalIndex: number;
    rotation: number;
    dataUrl: string;
    width: number;
    height: number;
}

export default function ReorderPdfPages() {
    // ── State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PDFPageItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfBytesRef = useRef<Uint8Array | null>(null);

    // ── Load & Render PDF Pages ──
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
            const renderedPages: PDFPageItem[] = [];

            for (let i = 1; i <= pageCount; i++) {
                setProcessingStatus(`Rendering page preview ${i} of ${pageCount}...`);
                const page = await pdfDocInstance.getPage(i);
                const viewport = page.getViewport({ scale: 0.8 });

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
                        id: `page-${i}-${Date.now()}`,
                        originalIndex: i - 1,
                        rotation: 0,
                        dataUrl,
                        width: viewport.width,
                        height: viewport.height,
                    });
                }
            }

            setPages(renderedPages);
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
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processPdfFile(e.dataTransfer.files[0]);
            }
        },
        [processPdfFile]
    );

    // ── Drag & Drop Reordering Logic ──
    const handleDragStart = (index: number) => {
        setDraggedPageIndex(index);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedPageIndex === null || draggedPageIndex === index) return;

        const newPages = [...pages];
        const draggedItem = newPages[draggedPageIndex];
        newPages.splice(draggedPageIndex, 1);
        newPages.splice(index, 0, draggedItem);
        setDraggedPageIndex(index);
        setPages(newPages);
    };

    const handleDragEnd = () => {
        setDraggedPageIndex(null);
    };

    // ── Manual Ordering Handlers ──
    const movePage = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= pages.length) return;

        const newPages = [...pages];
        const temp = newPages[index];
        newPages[index] = newPages[targetIndex];
        newPages[targetIndex] = temp;
        setPages(newPages);
    };

    const rotatePage = (index: number, angle: number) => {
        setPages((prev) =>
            prev.map((p, i) =>
                i === index ? { ...p, rotation: (p.rotation + angle + 360) % 360 } : p
            )
        );
    };

    const deletePage = (index: number) => {
        if (pages.length <= 1) {
            setErrorMessage("A PDF document must contain at least one page.");
            return;
        }
        setPages((prev) => prev.filter((_, i) => i !== index));
    };

    const reversePageOrder = () => {
        setPages((prev) => [...prev].reverse());
    };

    const clearWorkspace = () => {
        setPdfFile(null);
        pdfBytesRef.current = null;
        setPages([]);
        setErrorMessage(null);
        setPreviewUrl(null);
    };

    // ── PDF Export Engine ──
    const exportReorderedPdf = async () => {
        if (!pdfBytesRef.current || pages.length === 0) return;

        setIsProcessing(true);
        setProcessingStatus("Building reordered PDF file...");

        try {
            const srcDoc = await PDFDocument.load(pdfBytesRef.current);
            const newPdfDoc = await PDFDocument.create();

            for (let i = 0; i < pages.length; i++) {
                const item = pages[i];
                const [copiedPage] = await newPdfDoc.copyPages(srcDoc, [item.originalIndex]);

                if (item.rotation !== 0) {
                    const currentRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees((currentRotation + item.rotation) % 360));
                }

                newPdfDoc.addPage(copiedPage);
            }

            const pdfBytes = await newPdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}_reordered.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to generate the reordered PDF."
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
                {/* ══════════════════ LEFT PANEL: UPLOAD & CONTROLS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <ListOrdered className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">1. Target PDF Document</h2>
                                    <p className="text-xs text-indigo-100/80">Upload and configure page order</p>
                                </div>
                            </div>
                            {pages.length > 0 && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear Workspace
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
                                <p className="text-[11px] text-slate-400">Supports PDF documents up to 20 MB</p>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Quick Actions & Workspace Info */}
                            {pages.length > 0 && (
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">Quick Operations</span>
                                        <span className="text-[11px] font-mono text-slate-500">
                                            File Size: {pdfFile ? formatBytes(pdfFile.size) : "N/A"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={reversePageOrder}
                                            className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                        >
                                            <ArrowLeftRight className="w-4 h-4" />
                                            Reverse All Pages
                                        </button>
                                        <button
                                            onClick={() => setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })))}
                                            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                            Rotate All +90°
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: INTERACTIVE PAGE REORDERING ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Layers className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Rearrange & Export</h2>
                                    <p className="text-xs text-indigo-100/80">Drag thumbnails to organize PDF page sequence</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {pages.length === 0 ? (
                                <div className="h-[380px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                    <FileText className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                        Upload a PDF document on the left panel to preview, reorder, and rotate individual pages.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">
                                            Page Sequence ({pages.length} Pages)
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            Drag cards or use arrows
                                        </span>
                                    </div>

                                    <div className="h-[340px] overflow-y-auto pr-1 grid grid-cols-2 gap-3">
                                        {pages.map((page, idx) => (
                                            <div
                                                key={page.id}
                                                draggable
                                                onDragStart={() => handleDragStart(idx)}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDragEnd={handleDragEnd}
                                                className={`group relative rounded-xl border p-2 bg-slate-50/50 hover:bg-slate-100/50 transition-all flex flex-col justify-between shadow-sm cursor-grab active:cursor-grabbing ${draggedPageIndex === idx
                                                        ? "border-indigo-500 bg-indigo-50 opacity-40 scale-95"
                                                        : "border-slate-200 hover:border-slate-300"
                                                    }`}
                                            >
                                                {/* Header Box */}
                                                <div className="w-full flex items-center justify-between mb-1.5 px-1">
                                                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">
                                                        Page {idx + 1}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        (Orig #{page.originalIndex + 1})
                                                    </span>
                                                </div>

                                                {/* Thumbnail View */}
                                                <div className="w-full h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group/thumb flex items-center justify-center">
                                                    <img
                                                        src={page.dataUrl}
                                                        alt={`Page ${idx + 1}`}
                                                        style={{ transform: `rotate(${page.rotation}deg)` }}
                                                        className="h-full object-contain transition-transform duration-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewUrl(page.dataUrl)}
                                                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                    >
                                                        <Maximize2 className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Actions Toolbar */}
                                                <div className="w-full flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200/60">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => movePage(idx, "up")}
                                                            disabled={idx === 0}
                                                            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 border border-slate-200"
                                                            title="Move Left/Up"
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => movePage(idx, "down")}
                                                            disabled={idx === pages.length - 1}
                                                            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 disabled:opacity-30 border border-slate-200"
                                                            title="Move Right/Down"
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => rotatePage(idx, 90)}
                                                            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                                            title="Rotate Clockwise"
                                                        >
                                                            <RotateCw className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePage(idx)}
                                                        className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                                                        title="Delete Page"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Dynamic Job Summary Box */}
                                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-600 font-medium">Original Page Count:</span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {pdfBytesRef.current ? pages.length : 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                            <span className="text-indigo-900 font-bold">Configured Output Sequence:</span>
                                            <span className="font-mono font-bold text-indigo-600">
                                                {pages.length} Pages
                                            </span>
                                        </div>
                                    </div>

                                    {/* Export Trigger Button */}
                                    <button
                                        type="button"
                                        onClick={exportReorderedPdf}
                                        disabled={isProcessing || pages.length === 0}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pages.length > 0 && !isProcessing
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
                                                <span>Download Reordered PDF</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
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
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Reordering</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Modifying the interior sequence of a Portable Document Format (PDF) file requires precise manipulation of the binary object reference trees inside the document xref table. Traditional server-side reordering tools upload full binary blobs to cloud storage, risking sensitive corporate or legal content leaks. Our web-based toolkit uses <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> alongside WebAssembly canvas engines to process and rebuild page streams entirely within your client web browser memory sandbox.
                        </p>
                        <p>
                            When a PDF document is uploaded, our engine extracts binary object references for each page node, generates isolated rendered preview thumbnails via HTML5 canvas, and tracks drag-and-drop structural updates in dynamic state objects. Upon exporting, the original binary page objects are selectively copied into a newly constructed PDF structure according to your chosen page layout sequence, maintaining font mappings, image assets, and vector paths without compression degradation.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature & Configuration Specifications */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Reordering Capabilities Specifications</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Feature Operation</th>
                                    <th className="px-4 py-3.5 font-bold">Execution Engine</th>
                                    <th className="px-4 py-3.5 font-bold">Processing Limit</th>
                                    <th className="px-4 py-3.5 font-bold">Enterprise Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Drag-and-Drop Reordering</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">HTML5 Drag API</td>
                                    <td className="px-4 py-3">200+ Pages / 20 MB File Limit</td>
                                    <td className="px-4 py-3">Reorganizing scanned document binders and proposals</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Single-Click Reverse Order</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Array Index Reversal</td>
                                    <td className="px-4 py-3">Instant Batch Execution</td>
                                    <td className="px-4 py-3">Fixing reversed order duplex scanner outputs</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Per-Page Axis Rotation</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF Dictionary Modification</td>
                                    <td className="px-4 py-3">0°, 90°, 180°, 270° Increments</td>
                                    <td className="px-4 py-3">Correcting sideways or inverted scanned pages</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Reorder and Reverse PDF Pages</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Your PDF Document",
                                body: "Drag and drop your PDF into the upload zone or click to select a document from your local storage drive.",
                            },
                            {
                                step: "02",
                                title: "Rearrange Page Thumbnails",
                                body: "Click and drag any thumbnail card to move it to a new position, or use the arrow buttons to shift pages incrementally.",
                            },
                            {
                                step: "03",
                                title: "Apply Rotations or Reverse Sequence",
                                body: "Use quick action buttons to instantly reverse the full document page sequence or rotate specific pages.",
                            },
                            {
                                step: "04",
                                title: "Export Reordered PDF",
                                body: "Click Download Reordered PDF to generate a new binary PDF file with updated page indexes.",
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

                {/* Card 4: Enterprise Privacy & Sandbox Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Sandbox Protection</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Client-Side Processing",
                                body: "Document modifications are calculated directly in your browser JavaScript memory sandbox, ensuring zero server exposure.",
                            },
                            {
                                title: "Zero Server Persistence",
                                body: "Your PDF files are never uploaded, stored, or indexed on cloud servers or external analytics engines.",
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
                                q: "Are my confidential PDF documents uploaded to cloud servers?",
                                a: "No. All PDF page parsing, reordering, and rotation operations take place completely client-side inside your browser sandbox.",
                            },
                            {
                                q: "Can I delete specific unwanted pages from the PDF document?",
                                a: "Yes! Simply click the trash icon on any page card to remove that specific page from the final output export.",
                            },
                            {
                                q: "Does reordering PDF pages reduce image or font quality?",
                                a: "No. The reordering tool modifies the structural reference pointers of the original document object stream without re-compressing or degrading vector graphics and embedded fonts.",
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
                        name: "Reorder & Reverse PDF Pages Tool",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Reorder, reverse, rotate, and delete PDF pages directly inside your browser with enterprise client-side security and instant downloads.",
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
                                name: "Are my confidential PDF documents uploaded to cloud servers?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All PDF page parsing, reordering, and rotation operations take place completely client-side inside your browser sandbox.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can I delete specific unwanted pages from the PDF document?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Yes! Simply click the trash icon on any page card to remove that specific page from the final output export.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}