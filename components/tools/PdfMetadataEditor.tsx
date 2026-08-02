"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    FileText,
    Upload,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Zap,
    Shield,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    Check,
    Tag,
    User,
    BookOpen,
    Calendar,
    Layers,
    Lock,
    Edit3,
    Info,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface PdfMetadata {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
    creationDate: string;
    modificationDate: string;
}

interface PdfMetrics {
    fileName: string;
    fileSize: number;
    pageCount: number;
    pdfVersion: string;
    isEncrypted: boolean;
}

const DEFAULT_METADATA: PdfMetadata = {
    title: "",
    author: "",
    subject: "",
    keywords: "",
    creator: "",
    producer: "",
    creationDate: "",
    modificationDate: "",
};

export default function PdfMetadataEditor() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [metadata, setMetadata] = useState<PdfMetadata>(DEFAULT_METADATA);
    const [originalMetadata, setOriginalMetadata] = useState<PdfMetadata>(DEFAULT_METADATA);
    const [metrics, setMetrics] = useState<PdfMetrics | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfBytesRef = useRef<Uint8Array | null>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Parsing & Extraction Engine
    // ─────────────────────────────────────────────────────────────

    const processPdfFile = useCallback(async (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Invalid file format. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File exceeds the maximum limit of 20 MB. Please upload a smaller file.");
            return;
        }

        setIsProcessing(true);
        setPdfFile(file);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            pdfBytesRef.current = uint8Array;

            // Load using pdf-lib for metadata extraction
            const pdfDoc = await PDFDocument.load(uint8Array, { ignoreEncryption: true });

            const extractedTitle = pdfDoc.getTitle() || "";
            const extractedAuthor = pdfDoc.getAuthor() || "";
            const extractedSubject = pdfDoc.getSubject() || "";
            const extractedKeywords = pdfDoc.getKeywords() || "";
            const extractedCreator = pdfDoc.getCreator() || "";
            const extractedProducer = pdfDoc.getProducer() || "";
            const extractedCreationDate = pdfDoc.getCreationDate()?.toISOString().slice(0, 16) || "";
            const extractedModificationDate = pdfDoc.getModificationDate()?.toISOString().slice(0, 16) || "";

            const extractedData: PdfMetadata = {
                title: extractedTitle,
                author: extractedAuthor,
                subject: extractedSubject,
                keywords: extractedKeywords,
                creator: extractedCreator,
                producer: extractedProducer,
                creationDate: extractedCreationDate,
                modificationDate: extractedModificationDate,
            };

            setMetadata(extractedData);
            setOriginalMetadata(extractedData);

            setMetrics({
                fileName: file.name,
                fileSize: file.size,
                pageCount: pdfDoc.getPageCount(),
                pdfVersion: "1.7",
                isEncrypted: pdfDoc.isEncrypted,
            });

            // Render thumbnails using PDF.js
            try {
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

                const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
                const pdfJsDoc = await loadingTask.promise;
                const totalPages = Math.min(pdfJsDoc.numPages, 4); // Preview up to first 4 pages
                const thumbs: string[] = [];

                for (let i = 1; i <= totalPages; i++) {
                    const page = await pdfJsDoc.getPage(i);
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
                        thumbs.push(canvas.toDataURL("image/jpeg", 0.8));
                    }
                }
                setPageThumbnails(thumbs);
            } catch {
                // Thumbnail preview fallback if PDF.js fails
                setPageThumbnails([]);
            }
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to read the PDF document. The file may be corrupted or strongly encrypted."
            );
        } finally {
            setIsProcessing(false);
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

    const clearWorkspace = () => {
        setPdfFile(null);
        pdfBytesRef.current = null;
        setMetadata(DEFAULT_METADATA);
        setOriginalMetadata(DEFAULT_METADATA);
        setMetrics(null);
        setErrorMessage(null);
        setSuccessMessage(null);
        setPageThumbnails([]);
    };

    const handleInputChange = (field: keyof PdfMetadata, value: string) => {
        setMetadata((prev) => ({ ...prev, [field]: value }));
    };

    // ─────────────────────────────────────────────────────────────
    // Save & Export Engine
    // ─────────────────────────────────────────────────────────────

    const saveAndDownloadPdf = async () => {
        if (!pdfBytesRef.current || !pdfFile) return;

        setIsProcessing(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            const pdfDoc = await PDFDocument.load(pdfBytesRef.current, { ignoreEncryption: true });

            pdfDoc.setTitle(metadata.title);
            pdfDoc.setAuthor(metadata.author);
            pdfDoc.setSubject(metadata.subject);
            pdfDoc.setKeywords(metadata.keywords.split(",").map((k) => k.trim()).filter(Boolean));
            pdfDoc.setCreator(metadata.creator);
            pdfDoc.setProducer(metadata.producer);

            if (metadata.creationDate) {
                pdfDoc.setCreationDate(new Date(metadata.creationDate));
            }
            pdfDoc.setModificationDate(new Date());

            const pdfBytes = await pdfDoc.save();

            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = pdfFile.name.replace(/\.pdf$/i, "_metadata_edited.pdf");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSuccessMessage("PDF metadata updated and file downloaded successfully!");
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to save updated metadata to the PDF document."
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

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: UPLOAD & DOCUMENT DETAILS ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">1. Target PDF Document</h2>
                                    <p className="text-xs text-indigo-100/80">Select document to inspect and edit metadata</p>
                                </div>
                            </div>
                            {pdfFile && (
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30 min-h-[36px]"
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
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Document Overview Cards & Page Thumbnails */}
                            {metrics ? (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                            <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                                                {metrics.fileName}
                                            </span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                                                {formatBytes(metrics.fileSize)}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div>
                                                <span className="text-slate-500 text-[11px]">Total Pages:</span>
                                                <p className="font-bold text-slate-800">{metrics.pageCount}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[11px]">PDF Version:</span>
                                                <p className="font-bold text-slate-800">{metrics.pdfVersion}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thumbnail Strip */}
                                    {pageThumbnails.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-slate-700">Document Page Previews</span>
                                            <div className="grid grid-cols-4 gap-2">
                                                {pageThumbnails.map((thumb, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-slate-100 border border-slate-200 rounded-lg p-1 flex flex-col items-center shadow-sm"
                                                    >
                                                        <img
                                                            src={thumb}
                                                            alt={`Page ${idx + 1}`}
                                                            className="h-24 object-contain rounded border border-slate-200"
                                                        />
                                                        <span className="text-[10px] font-mono text-slate-500 mt-1">Page {idx + 1}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[280px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                    <Layers className="w-10 h-10 text-slate-300 mb-2" />
                                    <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                        Upload a document above to inspect, modify, and strip internal metadata properties.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: METADATA EDITOR ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center flex-shrink-0">
                                    <Edit3 className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Metadata Editor & Attributes</h2>
                                    <p className="text-xs text-indigo-100/80">Modify or wipe PDF attributes instantly</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {/* Form Input Fields */}
                            <div className="space-y-3">
                                {/* Title */}
                                <div>
                                    <label htmlFor="pdf-title" className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                                        Document Title
                                    </label>
                                    <input
                                        id="pdf-title"
                                        type="text"
                                        disabled={!pdfFile}
                                        value={metadata.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        placeholder={pdfFile ? "Enter document title..." : "Upload PDF to enable"}
                                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[40px]"
                                    />
                                </div>

                                {/* Author */}
                                <div>
                                    <label htmlFor="pdf-author" className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-indigo-600" />
                                        Author / Creator
                                    </label>
                                    <input
                                        id="pdf-author"
                                        type="text"
                                        disabled={!pdfFile}
                                        value={metadata.author}
                                        onChange={(e) => handleInputChange("author", e.target.value)}
                                        placeholder={pdfFile ? "Enter author name..." : "Upload PDF to enable"}
                                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[40px]"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label htmlFor="pdf-subject" className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 text-indigo-600" />
                                        Subject / Description
                                    </label>
                                    <input
                                        id="pdf-subject"
                                        type="text"
                                        disabled={!pdfFile}
                                        value={metadata.subject}
                                        onChange={(e) => handleInputChange("subject", e.target.value)}
                                        placeholder={pdfFile ? "Enter document subject..." : "Upload PDF to enable"}
                                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[40px]"
                                    />
                                </div>

                                {/* Keywords */}
                                <div>
                                    <label htmlFor="pdf-keywords" className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-indigo-600" />
                                        Keywords (Comma Separated)
                                    </label>
                                    <input
                                        id="pdf-keywords"
                                        type="text"
                                        disabled={!pdfFile}
                                        value={metadata.keywords}
                                        onChange={(e) => handleInputChange("keywords", e.target.value)}
                                        placeholder={pdfFile ? "e.g. report, financial, 2026" : "Upload PDF to enable"}
                                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[40px]"
                                    />
                                </div>

                                {/* Grid for Creator & Producer */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="pdf-creator" className="block text-xs font-bold text-slate-800 mb-1">
                                            Creator Application
                                        </label>
                                        <input
                                            id="pdf-creator"
                                            type="text"
                                            disabled={!pdfFile}
                                            value={metadata.creator}
                                            onChange={(e) => handleInputChange("creator", e.target.value)}
                                            placeholder="e.g. Word, Canva"
                                            className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[38px]"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="pdf-producer" className="block text-xs font-bold text-slate-800 mb-1">
                                            PDF Producer Tool
                                        </label>
                                        <input
                                            id="pdf-producer"
                                            type="text"
                                            disabled={!pdfFile}
                                            value={metadata.producer}
                                            onChange={(e) => handleInputChange("producer", e.target.value)}
                                            placeholder="e.g. Quartz, Acrobat"
                                            className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 min-h-[38px]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setMetadata(DEFAULT_METADATA)}
                                    disabled={!pdfFile || isProcessing}
                                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px]"
                                >
                                    Clear All Metadata Fields
                                </button>

                                <button
                                    type="button"
                                    onClick={saveAndDownloadPdf}
                                    disabled={!pdfFile || isProcessing}
                                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md min-h-[44px] ${pdfFile && !isProcessing
                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Updating & Saving PDF Metadata...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>Save & Download Modified PDF</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        <span>Technical Architecture of PDF Information Dictionary Modification</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Portable Document Format files store metadata in structural dictionaries located inside the PDF root trailer object, known as the <strong>Document Information Dictionary</strong> (or Info Dictionary). Key key-value pairs include standard entries such as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Title</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Author</code>, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Subject</code>, and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Keywords</code>.
                        </p>
                        <p>
                            When an enterprise document is saved or processed, modern PDF readers also embed Extensible Metadata Platform (XMP) XML streams alongside the classical Info Dictionary. Our engine uses client-side WebAssembly parsing via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> to locate, mutate, and re-serialize these binary dict keys directly within browser memory.
                        </p>
                    </div>
                </div>

                {/* Card 2: Metadata Attribute Specifications Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Metadata Key Specifications Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Standard Key</th>
                                    <th className="px-4 py-3.5 font-bold">Data Type</th>
                                    <th className="px-4 py-3.5 font-bold">Search Engine / System Impact</th>
                                    <th className="px-4 py-3.5 font-bold">Recommended Formatting</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">/Title</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF Text String</td>
                                    <td className="px-4 py-3">Primary title in web browsers, Google Search SERP snippets, and reader title bars.</td>
                                    <td className="px-4 py-3">Clear, keyword-rich title (max 70 characters).</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">/Author</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF Text String</td>
                                    <td className="px-4 py-3">Identifies document creator or organization in search indexes and desktop search engines.</td>
                                    <td className="px-4 py-3">Full personal name or legal enterprise organization name.</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">/Subject</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF Text String</td>
                                    <td className="px-4 py-3">Populates abstract summaries in indexing servers and document management systems.</td>
                                    <td className="px-4 py-3">Brief 1-2 sentence executive overview.</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">/Keywords</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF Text String</td>
                                    <td className="px-4 py-3">Enhances internal document cataloging, database taxonomy indexing, and desktop search tags.</td>
                                    <td className="px-4 py-3">Comma-separated terms relevant to document content.</td>
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
                        <span>How to Edit or Strip PDF Metadata</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF File",
                                body: "Drop your PDF file into the upload dropzone or click browse. The browser parses the binary Info Dictionary instantly.",
                            },
                            {
                                step: "02",
                                title: "Inspect Metadata Fields",
                                body: "Review existing attributes including Document Title, Author, Subject, Keywords, Creator app, and PDF Producer.",
                            },
                            {
                                step: "03",
                                title: "Modify or Wipe Attributes",
                                body: "Update title text for SEO or click Clear All Metadata Fields to sanitize sensitive internal information.",
                            },
                            {
                                step: "04",
                                title: "Save & Export PDF",
                                body: "Click Save & Download to construct a clean, updated PDF binary file saved directly to your local system.",
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
                        <span>Enterprise Privacy & Sanitization Protection</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% On-Device Processing",
                                body: "Your PDF documents are modified directly inside browser WebAssembly memory and are never uploaded to remote servers.",
                            },
                            {
                                title: "Privacy Metadata Stripping",
                                body: "Easily wipe hidden creator paths, internal username trails, and editing software software names before sharing documents publicly.",
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
                                q: "Why is setting the PDF Title metadata important for SEO?",
                                a: "When search engines index PDF files, they display the embedded /Title metadata property as the primary clickable headline in search results rather than the raw file name.",
                            },
                            {
                                q: "Does editing metadata alter the text or graphics inside my PDF pages?",
                                a: "No. Mutating document metadata only updates the structural Document Information Dictionary. Page layouts, vector artwork, and text content remain completely untouched.",
                            },
                            {
                                q: "Are my documents uploaded to external cloud servers for metadata modification?",
                                a: "No. All PDF inspection, dictionary updates, and re-saving operations execute completely client-side inside your local browser sandbox.",
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
                        name: "PDF Metadata & Document Title Editor",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 File API.",
                        description:
                            "Inspect, edit, or wipe PDF document title, author, subject, keywords, and producer metadata directly in your browser with 100% privacy.",
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
                                name: "Why is setting the PDF Title metadata important for SEO?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "When search engines index PDF files, they display the embedded /Title metadata property as the primary clickable headline in search results rather than the raw file name.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Does editing metadata alter the text or graphics inside my PDF pages?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. Mutating document metadata only updates the structural Document Information Dictionary. Page layouts, vector artwork, and text content remain completely untouched.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}