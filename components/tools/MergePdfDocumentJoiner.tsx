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
    Image as ImageIcon,
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
    Smartphone,
    AppWindow,
    FileCode,
    PackageCheck,
    LayoutGrid,
    Code2,
    CheckCircle,
    Lock,
    Layers3,
    FileCheck2,
    Grid,
    Plus,
    MoveUp,
    MoveDown,
    ArrowUpDown,
    Eye,
    FileCheck,
    Maximize2,
    X,
    Combine,
    AlignLeft,
    FileSearch,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface PDFFileItem {
    id: string;
    file: File;
    name: string;
    sizeBytes: number;
    pageCount: number;
    previewUrl: string | null;
}

export default function MergePdfDocumentJoiner() {
    // ── Workspace State ──
    const [pdfItems, setPdfItems] = useState<PDFFileItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
    const [mergedPdfBytes, setMergedPdfBytes] = useState<number>(0);
    const [previewModalItem, setPreviewModalItem] = useState<PDFFileItem | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup Blob URLs on unmount or file removal
    useEffect(() => {
        return () => {
            pdfItems.forEach((item) => {
                if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            });
            if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
        };
    }, [pdfItems, mergedPdfUrl]);

    // ── File Ingestion Engine ──
    const processFiles = useCallback(async (files: FileList | File[]) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        const validFiles: File[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                setErrorMessage("Only valid PDF documents are supported.");
                continue;
            }
            if (file.size > 20 * 1024 * 1024) {
                setErrorMessage(`File "${file.name}" exceeds the 20 MB size limit.`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length === 0) return;

        setIsProcessing(true);

        const newItems: PDFFileItem[] = [];

        for (const file of validFiles) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                const pageCount = pdfDoc.getPageCount();

                // Create object URL for preview/download reference
                const blob = new Blob([arrayBuffer], { type: "application/pdf" });
                const previewUrl = URL.createObjectURL(blob);

                newItems.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    name: file.name,
                    sizeBytes: file.size,
                    pageCount,
                    previewUrl,
                });
            } catch (err) {
                setErrorMessage(`Failed to parse PDF file "${file.name}". It may be corrupt or strongly encrypted.`);
            }
        }

        setPdfItems((prev) => [...prev, ...newItems]);
        setIsProcessing(false);
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

    // ── Sequence Management Handlers ──
    const moveItem = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= pdfItems.length) return;

        const updated = [...pdfItems];
        const [movedItem] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedItem);
        setPdfItems(updated);
    };

    const removeItem = (id: string) => {
        setPdfItems((prev) => {
            const itemToRemove = prev.find((item) => item.id === id);
            if (itemToRemove && itemToRemove.previewUrl) {
                URL.revokeObjectURL(itemToRemove.previewUrl);
            }
            return prev.filter((item) => item.id !== id);
        });
    };

    const clearWorkspace = () => {
        pdfItems.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
        setPdfItems([]);
        setMergedPdfUrl(null);
        setMergedPdfBytes(0);
        setErrorMessage(null);
        setSuccessMessage(null);
    };

    // ── PDF Merging Core Execution Engine ──
    const mergePDFs = async () => {
        if (pdfItems.length < 2) {
            setErrorMessage("Please add at least two PDF files to merge.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const mergedPdf = await PDFDocument.create();

            for (const item of pdfItems) {
                const fileBytes = await item.file.arrayBuffer();
                const srcPdf = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfFileBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfFileBytes as any], { type: "application/pdf" });

            if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);

            const url = URL.createObjectURL(blob);
            setMergedPdfUrl(url);
            setMergedPdfBytes(blob.size);
            setSuccessMessage("PDF documents merged successfully!");
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "An error occurred while merging PDFs.");
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

    const totalPages = pdfItems.reduce((acc, curr) => acc + curr.pageCount, 0);
    const totalSizeBytes = pdfItems.reduce((acc, curr) => acc + curr.sizeBytes, 0);

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: FILE INGESTION & LIST ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">1. Upload PDF Documents</h2>
                            </div>
                            {pdfItems.length > 0 && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Clear All
                                </button>
                            )}
                        </div>

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
                                multiple
                                accept=".pdf,application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files && processFiles(e.target.files)}
                            />

                            <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                <FileText className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                Drop PDF files here, or <span className="text-indigo-600">click to browse</span>
                            </p>
                            <p className="text-[11px] text-slate-400">Select multiple PDF documents (Max 20 MB per file)</p>
                        </div>

                        {errorMessage && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                <span>{successMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Sequence & Reordering Queue */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">2. Merge Queue & Order</h2>
                            </div>
                            <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {pdfItems.length} Files Selected
                            </span>
                        </div>

                        {pdfItems.length === 0 ? (
                            <div className="h-[280px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                <FileSearch className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">Queue is Empty</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload PDF documents using the drop area above to arrange merge sequence.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[280px] overflow-y-auto space-y-2 pr-1">
                                {pdfItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-indigo-200 transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                                                    {item.name}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                                    <span>{item.pageCount} {item.pageCount === 1 ? "page" : "pages"}</span>
                                                    <span>•</span>
                                                    <span>{formatBytes(item.sizeBytes)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => moveItem(index, "up")}
                                                disabled={index === 0}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                                title="Move Up"
                                            >
                                                <MoveUp className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => moveItem(index, "down")}
                                                disabled={index === pdfItems.length - 1}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-500"
                                                title="Move Down"
                                            >
                                                <MoveDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewModalItem(item)}
                                                className="p-1.5 text-slate-500 hover:text-indigo-600"
                                                title="Preview File"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                className="p-1.5 text-slate-500 hover:text-rose-600"
                                                title="Remove Document"
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

                {/* ══════════════════ RIGHT PANEL: MERGE & DOWNLOAD WORKSPACE ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Combine className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">3. Merge Processing Workspace</h2>
                            </div>
                            {isProcessing && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
                        </div>

                        {/* Document Statistics Card */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                    Combined Total Pages
                                </p>
                                <p className="text-base font-mono font-bold text-slate-800">{totalPages}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                                    Total Payload Size
                                </p>
                                <p className="text-base font-mono font-bold text-slate-800">{formatBytes(totalSizeBytes)}</p>
                            </div>
                        </div>

                        {/* Action Execution Button */}
                        <button
                            type="button"
                            onClick={mergePDFs}
                            disabled={pdfItems.length < 2 || isProcessing}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm ${pdfItems.length >= 2 && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Merging PDF Documents...
                                </>
                            ) : (
                                <>
                                    <Combine className="w-4 h-4" />
                                    Merge {pdfItems.length} PDF Documents
                                </>
                            )}
                        </button>

                        {/* Download Box Panel */}
                        {mergedPdfUrl && (
                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <FileCheck2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-900">Merged PDF Ready</p>
                                            <p className="text-[11px] font-mono text-emerald-700">{formatBytes(mergedPdfBytes)}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={mergedPdfUrl}
                                        download="merged-document.pdf"
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── PDF PREVIEW MODAL ── */}
            {previewModalItem && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-5 py-4 bg-slate-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-300" />
                                <h3 className="text-sm font-semibold truncate max-w-md">{previewModalItem.name}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewModalItem(null)}
                                className="text-slate-400 hover:text-white p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-100 flex-1 overflow-auto flex items-center justify-center">
                            {previewModalItem.previewUrl ? (
                                <iframe
                                    src={previewModalItem.previewUrl}
                                    className="w-full h-[500px] rounded-lg border border-slate-200"
                                    title={previewModalItem.name}
                                />
                            ) : (
                                <p className="text-xs text-slate-500">Preview not available.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture & In-Browser PDF Processing */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Merging</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Merging portable document format (PDF) files locally within the client web application requires direct manipulation of raw binary streams, object reference tables, and page tree hierarchies. Historical PDF manipulation tools relied on server-side rendering pipelines involving heavy headless utilities or remote microservices. Modern WebAssembly and optimized JavaScript rendering engines allow binary PDF restructuring directly inside local web browser memory.
                        </p>
                        <p>
                            Our client-side document processing suite leverages high-performance Web Assembly and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> algorithms. When documents are ingested into the queue, binary ArrayBuffers are decoded locally. Page indices are analyzed, extracted, and appended into a unified target document container without triggering remote data uploads.
                        </p>
                        <p>
                            Because page copying occurs through direct binary object re-mapping, font definitions, embedded vectors, image XObjects, and document metadata remain crisp, uncompressed, and fully preserved during consolidation.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix & Platform Capabilities */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Platform Specification & PDF Merging Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Review the technical parameters and feature capabilities supported by our client-side document engine:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Feature / Parameter</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Specification</th>
                                    <th className="px-4 py-3.5 font-bold">Technical Implementation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Execution Sandbox</td>
                                    <td className="px-4 py-3 font-mono text-xs">100% Client-Side Browser Memory</td>
                                    <td className="px-4 py-3">HTML5 File API & Web ArrayBuffers</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Maximum File Guardrail</td>
                                    <td className="px-4 py-3 font-mono text-xs">20 MB per individual file</td>
                                    <td className="px-4 py-3">Client validation guardrail preventing browser RAM exhaustion</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Sequence Reordering</td>
                                    <td className="px-4 py-3 font-mono text-xs">Unlimited queue reordering</td>
                                    <td className="px-4 py-3">Dynamic state-driven page copy index array manipulation</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Document Security</td>
                                    <td className="px-4 py-3 font-mono text-xs">Zero Server Data Storage</td>
                                    <td className="px-4 py-3">Files never leave workstation local network memory</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Operating Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Combine PDF Documents</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Target PDF Files",
                                body: "Drag and drop your PDF documents into the upload box or select files from your local storage drive.",
                            },
                            {
                                step: "02",
                                title: "Arrange Merge Queue Sequence",
                                body: "Use the move up and move down controls to arrange documents in your exact preferred reading order.",
                            },
                            {
                                step: "03",
                                title: "Execute PDF Consolidation",
                                body: "Click the merge button to combine page trees into a single, unified PDF document in memory.",
                            },
                            {
                                step: "04",
                                title: "Download Consolidated File",
                                body: "Save your merged document directly to your computer with zero server latency or data tracking.",
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

                {/* Card 4: Enterprise Privacy & Security Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Privacy & Client-Side Security Isolation</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Isolated Browser Execution Sandbox",
                                body: "Document merging logic runs strictly inside your local browser instance. Your sensitive legal contracts, financial reports, or personal files are never uploaded to any cloud server.",
                            },
                            {
                                title: "Zero Data Logging or Analytics Tracking",
                                body: "No analytics metrics, document contents, or metadata are logged, saved, or monitored during processing.",
                            },
                            {
                                title: "Instant RAM Cleanup",
                                body: "All object URLs and binary buffers are cleared upon clearing the workspace or closing the browser tab.",
                            },
                            {
                                title: "Enterprise Compliance Ready",
                                body: "Ideal for GDPR, HIPAA, and strict corporate environments where uploading sensitive documentation to third-party endpoints is prohibited.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Static FAQ Section */}
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
                                q: "Are my uploaded PDF documents stored on remote servers?",
                                a: "No. All PDF processing occurs completely inside your local web browser sandbox using client-side JavaScript APIs. Your documents never touch external servers or third-party networks.",
                            },
                            {
                                q: "Is there a file size or document limit for merging PDFs?",
                                a: "Our tool enforces a 20 MB size limit per file to maintain smooth browser memory performance. You can merge as many documents as your system's RAM can comfortably accommodate.",
                            },
                            {
                                q: "Will merging PDFs degrade image or text quality?",
                                a: "No. The document engine performs direct binary object copying without re-compressing embedded raster images or stripping vector typography.",
                            },
                            {
                                q: "Can I reorder PDF files before joining them?",
                                a: "Yes. Use the queue ordering buttons in the workspace panel to move documents up or down to set your exact target page sequence before clicking merge.",
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

            {/* Dynamic JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Merge PDF & Document Joiner",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript and HTML5 File API support.",
                        description:
                            "Combine and merge PDF files directly in your web browser with client-side security and fast local execution.",
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
                                name: "Are my uploaded PDF documents stored on remote servers?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All processing happens locally in your web browser.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Is there a file size limit for merging PDFs?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Each individual file has a 20 MB guardrail limit to ensure smooth memory performance.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}