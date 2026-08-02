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
    FileCheck,
    ShieldCheck,
    Zap,
    Sliders,
    HardDrive,
    HelpCircle,
    BarChart3,
    Layers,
    Sparkles,
    Info,
    Lock,
    ArrowRight,
    Gauge,
    Settings,
    Shield,
    Table,
    Cpu,
    Database,
    FileCode,
    CheckCircle2,
    Workflow,
    Globe,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type CompressionLevel = "extreme" | "recommended" | "low";

interface CompressionProfile {
    id: CompressionLevel;
    name: string;
    description: string;
    scale: number;
    quality: number;
    estimatedReduction: string;
}

const COMPRESSION_PROFILES: Record<CompressionLevel, CompressionProfile> = {
    extreme: {
        id: "extreme",
        name: "Extreme Compression",
        description: "Maximum file size reduction with lower image resolution.",
        scale: 0.6,
        quality: 0.4,
        estimatedReduction: "~70% - 85%",
    },
    recommended: {
        id: "recommended",
        name: "Recommended Compression",
        description: "Optimal balance between visual quality and file size reduction.",
        scale: 0.8,
        quality: 0.65,
        estimatedReduction: "~40% - 65%",
    },
    low: {
        id: "low",
        name: "Low Compression",
        description: "High visual quality with mild file size reduction.",
        scale: 1.0,
        quality: 0.85,
        estimatedReduction: "~15% - 35%",
    },
};

interface ProcessedState {
    blob: Blob | null;
    downloadUrl: string | null;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    fileName: string;
    pageCount: number;
}

// ─────────────────────────────────────────────────────────────
// Pure Client-Side PDF Compression Engine (Canvas + pdf-lib)
// ─────────────────────────────────────────────────────────────

async function compressPdfEngine(
    file: File,
    profile: CompressionProfile,
    onProgress?: (progress: number) => void
): Promise<{ blob: Blob; pageCount: number }> {
    // Dynamically import pdfjs-dist on client side
    const pdfjsLib = await import("pdfjs-dist");

    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdfDoc.numPages;

    const outputPdf = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: profile.scale });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (!ctx) throw new Error("Failed to initialize HTML5 Canvas context.");

        await page.render({
            canvasContext: ctx,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        const jpegUrl = canvas.toDataURL("image/jpeg", profile.quality);
        const jpegBytes = await fetch(jpegUrl).then((res) => res.arrayBuffer());

        const embeddedImage = await outputPdf.embedJpg(jpegBytes);
        const newPage = outputPdf.addPage([viewport.width, viewport.height]);

        newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
        });

        if (onProgress) {
            onProgress(Math.round((i / numPages) * 100));
        }
    }

    const pdfBytes = await outputPdf.save();
    const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

    return { blob, pageCount: numPages };
}

// ─────────────────────────────────────────────────────────────
// Formatting Utilities
// ─────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function PdfCompressorSuite() {
    const [file, setFile] = useState<File | null>(null);
    const [level, setLevel] = useState<CompressionLevel>("recommended");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ProcessedState | null>(null);
    const [copied, setCopied] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB Limit

    // Handle Drag & Drop / Selection
    const handleFileSelect = useCallback((selectedFile: File) => {
        setError(null);
        setResult(null);

        if (selectedFile.type !== "application/pdf") {
            setError("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(
                `File size exceeds the 20 MB limit (${formatBytes(
                    selectedFile.size
                )}). Please select a smaller PDF.`
            );
            return;
        }

        setFile(selectedFile);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile) handleFileSelect(droppedFile);
        },
        [handleFileSelect]
    );

    // Trigger PDF Compression Process
    const handleCompress = useCallback(async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const profile = COMPRESSION_PROFILES[level];
            const { blob, pageCount } = await compressPdfEngine(
                file,
                profile,
                (currentProgress) => {
                    setProgress(currentProgress);
                }
            );

            const downloadUrl = URL.createObjectURL(blob);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const ratio = Math.max(
                0,
                Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            setResult({
                blob,
                downloadUrl,
                originalSize,
                compressedSize,
                compressionRatio: ratio,
                fileName: file.name.replace(/\.pdf$/i, "-compressed.pdf"),
                pageCount,
            });
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "An error occurred while compressing the PDF document.";
            setError(msg);
        } finally {
            setIsProcessing(false);
        }
    }, [file, level]);

    const clearWorkspace = useCallback(() => {
        if (result?.downloadUrl) {
            URL.revokeObjectURL(result.downloadUrl);
        }
        setFile(null);
        setResult(null);
        setError(null);
        setProgress(0);
    }, [result]);

    return (
        <div className="w-full space-y-8">
            {/* 50/50 Workspace Grid Layout */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* Left Panel: Input & Options */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Upload className="w-4 h-4 text-indigo-600" />
                        </div>
                        1. Select Document & Settings
                    </h2>

                    {/* Drag & Drop Upload Zone */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragging
                                ? "border-indigo-500 bg-indigo-50/50"
                                : file
                                    ? "border-green-400 bg-green-50/30"
                                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-slate-100/50"
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const selected = e.target.files?.[0];
                                if (selected) handleFileSelect(selected);
                            }}
                        />

                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            {file ? (
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 break-all">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {formatBytes(file.size)}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-medium text-slate-700">
                                        Drag and drop your PDF here, or click to browse
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Maximum allowed size: 20 MB
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Compression Level Presets */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-indigo-600" />
                            Compression Preset
                        </label>
                        <div className="grid grid-cols-1 gap-2.5">
                            {(
                                Object.keys(COMPRESSION_PROFILES) as CompressionLevel[]
                            ).map((key) => {
                                const prof = COMPRESSION_PROFILES[key];
                                const isSelected = level === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setLevel(key)}
                                        className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${isSelected
                                                ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-slate-900">
                                                    {prof.name}
                                                </span>
                                                {key === "recommended" && (
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {prof.description}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono font-bold text-indigo-600 flex-shrink-0 ml-2">
                                            {prof.estimatedReduction}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error Notice */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-sm flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={handleCompress}
                            disabled={!file || isProcessing}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-md shadow-indigo-100 min-h-[44px]"
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Compressing ({progress}%)
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Compress PDF
                                </>
                            )}
                        </button>

                        <button
                            onClick={clearWorkspace}
                            disabled={!file && !result}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Workspace
                        </button>
                    </div>
                </div>

                {/* Right Panel: Output & Metrics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 h-full flex flex-col justify-between p-4 sm:p-6">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="w-4 h-4 text-indigo-600" />
                            </div>
                            2. Optimized Results
                        </h2>

                        {/* Processing State */}
                        {isProcessing && (
                            <div className="space-y-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center p-4 sm:p-6">
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-600 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm font-medium text-indigo-900">
                                    Rasterizing & Compressing Pages... {progress}%
                                </p>
                                <p className="text-xs text-slate-500">
                                    All rendering executes securely inside your web browser.
                                </p>
                            </div>
                        )}

                        {/* Compressed Result Display */}
                        {result && !isProcessing && (
                            <div className="space-y-5">
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                        <FileCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-bold text-emerald-900">
                                        PDF Compressed Successfully!
                                    </h3>
                                    <p className="text-xs text-emerald-700">
                                        Total reduction: {result.compressionRatio}% smaller
                                    </p>
                                </div>

                                {/* File Metrics Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Original Size
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {formatBytes(result.originalSize)}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Compressed Size
                                        </p>
                                        <p className="text-sm font-mono font-bold text-indigo-600">
                                            {formatBytes(result.compressedSize)}
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Total Pages
                                        </p>
                                        <p className="text-sm font-mono font-bold text-slate-800">
                                            {result.pageCount} Pages
                                        </p>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                            Savings
                                        </p>
                                        <p className="text-sm font-mono font-bold text-emerald-600">
                                            {result.compressionRatio}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!result && !isProcessing && (
                            <div className="text-center py-12 text-slate-400 space-y-2 border-2 border-dashed border-slate-100 rounded-xl">
                                <HardDrive className="w-8 h-8 mx-auto stroke-1" />
                                <p className="text-sm">
                                    Upload a PDF document and start compression to view output metrics.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Download Action */}
                    {result && !isProcessing && (
                        <a
                            href={result.downloadUrl!}
                            download={result.fileName}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 min-h-[44px] mt-4"
                        >
                            <Download className="w-4 h-4" />
                            Download Compressed PDF
                        </a>
                    )}
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 pt-6">
                {/* Card 1: Technical Architecture & Mechanics */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Optimization</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Portable Document Format (PDF) structures store visual data using a combination of vector geometries, font tables, structural metadata, and embedded binary object streams. Large PDF file size issues typically stem from high-resolution uncompressed raster images (PNG, uncompressed TIFF, or high-DPI raw bitmaps) inserted during document scanning or graphic design workflows.
                        </p>
                        <p>
                            Our <strong>PDF Compressor & File Size Optimizer</strong> utilizes a client-side execution pipeline combining <strong>PDF.js</strong> (for document structure parsing and canvas rendering) and <strong>pdf-lib</strong> (for PDF document reconstruction). Rather than sending your files to an external server queue, your browser local memory acts as an isolated processing sandbox.
                        </p>
                        <p>
                            During compression, each document page is rendered onto an off-screen HTML5 Canvas context using customized scaling factors. The rendered pixel array is re-encoded into optimized Discrete Cosine Transform (DCT) JPEG byte streams based on your selected compression preset. The re-encoded image streams are merged back into a newly initialized PDF structure, stripping redundant cross-reference tables and unused document metadata to deliver maximum file size reduction.
                        </p>
                    </div>
                </div>

                {/* Card 2: Strategic Processing Pipeline */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>The 4-Step Browser-Based Compression Pipeline</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "1",
                                title: "Local Binary Ingestion",
                                body: "The PDF binary payload is read directly into memory via HTML5 File and ArrayBuffer APIs. File size boundaries (20 MB max limit) and MIME signatures are validated locally before parsing begins.",
                            },
                            {
                                step: "2",
                                title: "Viewport & Canvas Rasterization",
                                body: "PDF.js initializes a dedicated worker thread to render page objects onto an isolated HTML5 Canvas. The viewport dimensions are scaled according to selected compression parameters (0.6x to 1.0x).",
                            },
                            {
                                step: "3",
                                title: "Discrete Cosine Re-Encoding",
                                body: "Canvas image data is converted into compressed JPEG byte buffers using variable quality quantization algorithms (40% to 85% quality settings) to optimize visual sharpness while minimizing byte footprint.",
                            },
                            {
                                step: "4",
                                title: "PDF Stream Reconstruction",
                                body: "An entirely new PDF document is constructed in memory via pdf-lib. Compressed image payloads are embedded as page background layers, and an optimized binary Blob is generated for instant download.",
                            },
                        ].map(({ step, title, body }) => (
                            <div
                                key={step}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                                        {step}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                                            {title}
                                        </h3>
                                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 3: Presets Comparison Matrix */}
                <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Compression Level Specification Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
                        Compare our compression presets to choose the right balance between file size reduction and visual clarity for your document requirements:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Compression Level</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Viewport Scale</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">JPEG Quality</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Est. Size Reduction</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold">Best Used For</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ["Extreme", "0.6x (60%)", "40% Quality", "~70% - 85%", "Email attachments, quick draft reviews, slow bandwidth networks"],
                                    ["Recommended", "0.8x (80%)", "65% Quality", "~40% - 65%", "General business reports, invoices, web uploads, portal submissions"],
                                    ["Low", "1.0x (100%)", "85% Quality", "~15% - 35%", "High-res presentations, portfolios, archived legal documentation"],
                                ].map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 font-mono"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 4: Real-World Use Cases */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HardDrive className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Industry Applications & Workflow Optimization</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "Email Attachment Limits",
                                body: "Most corporate email providers enforce strict 10 MB or 25 MB file size caps. Compress bulky scanned documents and slide decks down to lightweight PDFs that send instantly without bounce-backs.",
                            },
                            {
                                title: "Government & Job Portal Uploads",
                                body: "Online application systems for visas, university admissions, and job vacancies frequently enforce strict 2 MB or 5 MB upload limits. Shrink application packets and transcripts while preserving visual readability.",
                            },
                            {
                                title: "Legal & Corporate Privacy",
                                body: "Sensitive financial audits, non-disclosure agreements, and medical records cannot be riskily uploaded to external cloud conversion servers. Client-side browser processing keeps sensitive data on your hardware.",
                            },
                            {
                                title: "Web Speed & Mobile Bandwidth",
                                body: "Smaller PDF manuals and product catalogs hosted on web platforms download significantly faster on mobile devices, improving site performance metrics, conversion rates, and SEO user signals.",
                            },
                        ].map(({ title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 text-sm">
                                    {title}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                    {body}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Platform Advantages */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Engine Performance & Security Guarantees</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                icon: Shield,
                                title: "100% Client-Side Privacy",
                                body: "Your PDF files are never uploaded to remote cloud infrastructure, external APIs, or temporary server storage. Every byte remains inside your device browser runtime environment.",
                            },
                            {
                                icon: Zap,
                                title: "Zero Queue Times & Fast Processing",
                                body: "Eliminate network upload delay and server processing queues. Compression starts instantly upon click, leveraging your device's native CPU and Web Workers.",
                            },
                            {
                                icon: Cpu,
                                title: "Canvas & WebGL Acceleration",
                                body: "Off-screen HTML5 Canvas rendering uses hardware acceleration when available on your browser, speeding up image rasterization across long multi-page documents.",
                            },
                            {
                                icon: Sparkles,
                                title: "No Subscription or Usage Caps",
                                body: "Compress unlimited documents up to 20 MB per file without registration, email capture, daily limits, or watermarks placed on your finished output.",
                            },
                        ].map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                                            {title}
                                        </h3>
                                        <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                            {body}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 6: Frequently Asked Questions */}
                <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl md:p-10 shadow-sm p-4 sm:p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Is my confidential PDF uploaded to any external server?",
                                a: "No. The entire PDF compression process runs completely client-side in JavaScript using WebAssembly, Canvas APIs, and local memory. Your file never leaves your computer or browser.",
                            },
                            {
                                q: "Why does compression take longer on multi-page files?",
                                a: "Because processing happens directly on your device CPU, multi-page PDFs require rendering each page to canvas before re-encoding as an optimized JPEG image stream. Processing speed scales directly with your device CPU performance.",
                            },
                            {
                                q: "Will compression affect selectable text?",
                                a: "To achieve maximum file size reduction on scanned images and complex vector layers, full page rasterization is performed. Text embedded in high-compression mode will be re-encoded into visual page layers to keep file sizes as minimal as possible.",
                            },
                            {
                                q: "What is the maximum supported PDF file size limit?",
                                a: "Our workspace enforces a generous 20 MB maximum upload safeguard to ensure smooth in-browser browser memory allocation without crashing mobile or desktop tab memory limits.",
                            },
                            {
                                q: "Do I need to pay or create an account to download my file?",
                                a: "No account creation, email registration, or payment subscription is required. You can compress as many PDF documents as you need completely free of charge.",
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
                            >
                                <h3 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                                    {item.q}
                                </h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-3">
                                    {item.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* JSON-LD WebApplication Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "PDF Compressor & File Size Optimizer",
                        applicationCategory: "UtilityApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas and File API.",
                        description:
                            "Compress PDF files online for free using 100% client-side web browser rendering. Reduce document file size securely without uploading confidential data.",
                        featureList: [
                            "Extreme, Recommended, and Low compression presets",
                            "100% browser-based private client-side compression",
                            "HTML5 Canvas Discrete Cosine JPEG re-encoding engine",
                            "Dynamic progress bar and percentage tracking",
                            "Drag-and-drop ingestion with 20 MB file safeguard limit",
                            "Zero registration, zero subscription fees, and no file watermarks",
                        ],
                        offers: {
                            "@type": "Offer",
                            price: "0",
                            priceCurrency: "USD",
                        },
                    }),
                }}
            />

            {/* JSON-LD FAQPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: [
                            {
                                "@type": "Question",
                                name: "Is my confidential PDF uploaded to any external server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. The entire PDF compression process runs completely client-side in JavaScript using WebAssembly and Canvas APIs. Your file never leaves your device.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Why does compression take longer on multi-page files?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Multi-page PDFs require rendering each page locally to an HTML5 canvas context before re-encoding image streams.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Will compression affect selectable text?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "To achieve maximum file size reduction on scanned images, full page rasterization is performed during re-encoding.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What is the maximum supported PDF file size limit?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Our tool enforces a 20 MB maximum file limit to ensure stable browser memory performance across desktop and mobile devices.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}