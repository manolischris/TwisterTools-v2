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
    HardDrive,
    HelpCircle,
    Cpu,
    Table,
    Workflow,
    Eye,
    FileCheck2,
    Lock,
    FileType,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    ShieldCheck,
    Layout,
    Sliders,
    Info,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { renderAsync } from "docx-preview";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type PageOrientation = "portrait" | "landscape";
type PageMargin = "normal" | "compact" | "wide";

interface MarginValues {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

const MARGIN_PRESETS: Record<PageMargin, MarginValues> = {
    normal: { top: 54, bottom: 54, left: 54, right: 54 }, // 0.75 in (54 pt)
    compact: { top: 36, bottom: 36, left: 36, right: 36 }, // 0.5 in (36 pt)
    wide: { top: 72, bottom: 72, left: 72, right: 72 }, // 1.0 in (72 pt)
};

export default function WordToPdf() {
    // ── Core File & Conversion State ──
    const [docFile, setDocFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [extractedText, setExtractedText] = useState<string>("");
    const [wordCount, setWordCount] = useState<number>(0);
    const [characterCount, setCharacterCount] = useState<number>(0);
    const [paragraphCount, setParagraphCount] = useState<number>(0);

    // ── Configuration Options ──
    const [orientation, setOrientation] = useState<PageOrientation>("portrait");
    const [marginPreset, setMarginPreset] = useState<PageMargin>("normal");
    const [fontSize, setFontSize] = useState<number>(11);
    const [lineSpacing, setLineSpacing] = useState<number>(1.25);
    const [includePageNumbers, setIncludePageNumbers] = useState<boolean>(true);
    const [exportMode, setExportMode] = useState<"high-fidelity" | "reflowable">("high-fidelity");

    // ── UI & Processing State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    // ── References ──
    const fileInputRef = useRef<HTMLInputElement>(null);
    const docxPreviewContainerRef = useRef<HTMLDivElement>(null);

    // ─────────────────────────────────────────────────────────────
    // DOCX Extraction & In-Browser Preview Pipeline
    // ─────────────────────────────────────────────────────────────

    const processDocxFile = useCallback(async (file: File) => {
        setErrorMessage(null);

        const isDocx =
            file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.toLowerCase().endsWith(".docx");

        if (!isDocx) {
            setErrorMessage(
                "Invalid file format. Please upload a standard Microsoft Word (.docx) document."
            );
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage(
                `File exceeds the 20 MB max file size limit (${(
                    file.size /
                    1024 /
                    1024
                ).toFixed(2)} MB). Please select a smaller Word document.`
            );
            return;
        }

        setIsLoading(true);
        setLoadingProgress(15);
        setFileName(file.name);
        setFileSize(file.size);
        setDocFile(file);

        try {
            // 1. Render Visual HTML Preview using docx-preview
            const arrayBuffer = await file.arrayBuffer();
            setLoadingProgress(45);

            if (docxPreviewContainerRef.current) {
                docxPreviewContainerRef.current.innerHTML = "";
                await renderAsync(arrayBuffer, docxPreviewContainerRef.current, undefined, {
                    className: "docx",
                    inWrapper: false,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    ignoreFonts: false,
                    breakPages: true,
                    experimental: false,
                });
            }

            setLoadingProgress(75);

            // 2. Extract Plain Text Content from rendered DOM container
            const container = docxPreviewContainerRef.current;
            const rawText = container ? container.innerText || container.textContent || "" : "";

            const cleanedText = rawText
                .replace(/\r\n/g, "\n")
                .replace(/\r/g, "\n")
                .trim();

            setExtractedText(cleanedText);

            // Calculate Document Statistics
            const words = cleanedText ? cleanedText.trim().split(/\s+/).filter(Boolean).length : 0;
            const chars = cleanedText.length;
            const paragraphs = cleanedText ? cleanedText.split(/\n+/).filter(Boolean).length : 0;

            setWordCount(words);
            setCharacterCount(chars);
            setParagraphCount(paragraphs);

            setLoadingProgress(100);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to parse Word document. Please ensure the file is not corrupted or password protected."
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
            if (file) processDocxFile(file);
        },
        [processDocxFile]
    );

    const clearWorkspace = () => {
        setDocFile(null);
        setFileName("");
        setFileSize(0);
        setExtractedText("");
        setWordCount(0);
        setCharacterCount(0);
        setParagraphCount(0);
        setErrorMessage(null);
        setLoadingProgress(0);
        if (docxPreviewContainerRef.current) {
            docxPreviewContainerRef.current.innerHTML = "";
        }
    };

    // ─────────────────────────────────────────────────────────────
    // PDF Generation Pipeline (pdf-lib Engine)
    // ─────────────────────────────────────────────────────────────

    const generateAndDownloadPdf = async () => {
        const container = docxPreviewContainerRef.current;
        if (!container) {
            setErrorMessage("No document visual preview available to export.");
            return;
        }

        setIsExporting(true);
        setErrorMessage(null);

        try {
            if (exportMode === "high-fidelity") {
                // Create a hidden iframe for printing (preserves styles and tables exactly)
                const iframe = document.createElement("iframe");
                iframe.style.position = "fixed";
                iframe.style.right = "0";
                iframe.style.bottom = "0";
                iframe.style.width = "0px";
                iframe.style.height = "0px";
                iframe.style.border = "none";
                document.body.appendChild(iframe);

                const doc = iframe.contentWindow?.document;
                if (!doc) {
                    throw new Error("Failed to initialize print frame.");
                }

                // Copy all styles from the parent document to ensure docx-preview styling carries over
                const styleSheets = Array.from(document.styleSheets);
                for (const sheet of styleSheets) {
                    try {
                        let cssRules = "";
                        for (const rule of Array.from(sheet.cssRules)) {
                            cssRules += rule.cssText + "\n";
                        }
                        const style = doc.createElement("style");
                        style.textContent = cssRules;
                        doc.head.appendChild(style);
                    } catch {
                        if (sheet.href) {
                            const link = doc.createElement("link");
                            link.rel = "stylesheet";
                            link.href = sheet.href;
                            doc.head.appendChild(link);
                        }
                    }
                }

                // Append print styles to optimize PDF pages, ensure background colors and formatting fit
                const printStyle = doc.createElement("style");
                printStyle.textContent = `
                    @media print {
                        @page {
                            margin: 0;
                        }
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #ffffff !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .docx-wrapper {
                            background: #ffffff !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                        }
                        section.docx {
                            margin: 0 auto !important;
                            box-shadow: none !important;
                            page-break-after: always;
                            page-break-inside: avoid;
                        }
                    }
                `;
                doc.head.appendChild(printStyle);

                // Copy the HTML content of the rendered word document into the iframe
                doc.body.innerHTML = container.innerHTML;

                // Wait a short time for iframe content rendering to settle, then open print dialog
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();

                    // Remove the iframe after a short delay
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 2000);
                }, 500);
            } else {
                // Reflowable Text Mode (instantly compiles plain text and triggers direct file download)
                if (!extractedText.trim()) {
                    throw new Error("No text content available to export.");
                }

                const pdfDoc = await PDFDocument.create();
                pdfDoc.registerFontkit(fontkit);

                // Fetch and embed the local Roboto fonts supporting Greek/Latin characters
                const [regularBytes, boldBytes] = await Promise.all([
                    fetch("/fonts/Roboto-Regular.ttf").then((res) => {
                        if (!res.ok) throw new Error("Failed to load Roboto-Regular font.");
                        return res.arrayBuffer();
                    }),
                    fetch("/fonts/Roboto-Bold.ttf").then((res) => {
                        if (!res.ok) throw new Error("Failed to load Roboto-Bold font.");
                        return res.arrayBuffer();
                    }),
                ]);

                const font = await pdfDoc.embedFont(regularBytes);
                const fontBold = await pdfDoc.embedFont(boldBytes);

                // Page Setup Dimensions (Standard Letter: 612 x 792 pt)
                let pageWidth = 612;
                let pageHeight = 792;

                if (orientation === "landscape") {
                    pageWidth = 792;
                    pageHeight = 612;
                }

                const activeMargins = MARGIN_PRESETS[marginPreset];
                const usableWidth = pageWidth - activeMargins.left - activeMargins.right;
                const usableHeight = pageHeight - activeMargins.top - activeMargins.bottom;

                const lineHeightPt = fontSize * lineSpacing;

                // Text Wrapping Helper Engine
                const paragraphs = extractedText.split(/\n+/);
                const wrappedLines: string[] = [];

                for (const para of paragraphs) {
                    if (!para.trim()) {
                        wrappedLines.push("");
                        continue;
                    }

                    const words = para.split(" ");
                    let currentLine = "";

                    for (const word of words) {
                        const testLine = currentLine ? `${currentLine} ${word}` : word;
                        const textWidth = font.widthOfTextAtSize(testLine, fontSize);

                        if (textWidth <= usableWidth) {
                            currentLine = testLine;
                        } else {
                            if (currentLine) wrappedLines.push(currentLine);
                            currentLine = word;
                        }
                    }
                    if (currentLine) wrappedLines.push(currentLine);
                    wrappedLines.push(""); // Paragraph gap
                }

                // Calculate Lines Per Page
                const maxLinesPerPage = Math.floor(usableHeight / lineHeightPt);
                let page = pdfDoc.addPage([pageWidth, pageHeight]);
                let currentLineInPage = 0;
                let totalPages = 1;

                // Draw Lines onto PDF Document Pages
                for (let i = 0; i < wrappedLines.length; i++) {
                    if (currentLineInPage >= maxLinesPerPage) {
                        page = pdfDoc.addPage([pageWidth, pageHeight]);
                        currentLineInPage = 0;
                        totalPages++;
                    }

                    const line = wrappedLines[i];
                    if (line) {
                        const yPosition =
                            pageHeight - activeMargins.top - (currentLineInPage + 1) * lineHeightPt;

                        page.drawText(line, {
                            x: activeMargins.left,
                            y: yPosition,
                            size: fontSize,
                            font: font,
                            color: rgb(0.06, 0.09, 0.16), // #0f172a
                        });
                    }

                    currentLineInPage++;
                }

                // Add Page Numbers (if enabled)
                if (includePageNumbers) {
                    const pages = pdfDoc.getPages();
                    for (let idx = 0; idx < pages.length; idx++) {
                        const p = pages[idx];
                        const pageNumStr = `Page ${idx + 1} of ${pages.length}`;
                        const numWidth = font.widthOfTextAtSize(pageNumStr, 9);

                        p.drawText(pageNumStr, {
                            x: (pageWidth - numWidth) / 2,
                            y: activeMargins.bottom / 2,
                            size: 9,
                            font: font,
                            color: rgb(0.4, 0.45, 0.55),
                        });
                    }
                }

                // Compile and Save Binary
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
                const downloadUrl = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = fileName
                    ? `${fileName.replace(/\.docx$/i, "")}.pdf`
                    : "converted_document.pdf";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            }
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to generate PDF document."
            );
        } finally {
            setIsExporting(false);
        }
    };

    // ── Clipboard Copy Helper ──
    const copyExtractedText = async () => {
        if (!extractedText) return;
        try {
            await navigator.clipboard.writeText(extractedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    // ── Utility Formatting ──
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
                {/* ══════════════════ LEFT PANEL: FILE UPLOAD & PREVIEW ══════════════════ */}
                <div className="space-y-5">
                    {/* File Ingestion Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <FileType className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">1. Select Word Document</span>
                            </div>
                            {docFile && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear File
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Drag & Drop Zone */}
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
                                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="hidden"
                                    onChange={(e) =>
                                        e.target.files?.[0] && processDocxFile(e.target.files[0])
                                    }
                                />

                                {docFile ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="text-left space-y-1">
                                            <p className="text-xs font-bold text-slate-800 truncate max-w-[220px]">
                                                {fileName}
                                            </p>
                                            <p className="text-[11px] font-mono text-slate-500">
                                                {formatBytes(fileSize)} • Ready to Convert
                                            </p>
                                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                Document Loaded & Processed
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                            Drop Word (.docx) file here, or{" "}
                                            <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Maximum file size limit: 20 MB
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Progress Indicator */}
                            {isLoading && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>Extracting Word Document Layout...</span>
                                        <span className="font-mono text-indigo-600">
                                            {loadingProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                                            style={{ width: `${loadingProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Banner */}
                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Document Preview Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-semibold text-slate-900">
                                    2. Document Visual Preview
                                </h3>
                            </div>
                            {extractedText && (
                                <button
                                    onClick={copyExtractedText}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-600" /> Copied Text
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" /> Copy Raw Text
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="p-4">
                            <div className="h-[380px] overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-4 font-sans text-xs text-slate-800">
                                {/* Hidden/Active Container for DOCX Rendering Engine */}
                                <div
                                    ref={docxPreviewContainerRef}
                                    className="docx-render-wrapper space-y-2"
                                />

                                {!docFile && !isLoading && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                                        <FileText className="w-10 h-10 text-slate-300" />
                                        <p className="text-xs font-semibold text-slate-600">
                                            No Word Document Loaded
                                        </p>
                                        <p className="text-[11px] max-w-xs text-slate-400">
                                            Upload a .docx file above to generate a real-time layout
                                            preview and statistics summary.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PDF OPTIONS & CONVERSION ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <Sliders className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">
                                    3. Export Settings & PDF Layout
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Export Mode Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Export Engine Mode
                                </label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setExportMode("high-fidelity")}
                                        className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all ${exportMode === "high-fidelity"
                                            ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        High-Fidelity Layout
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportMode("reflowable")}
                                        className={`py-2 px-3 text-[11px] font-bold rounded-lg transition-all ${exportMode === "reflowable"
                                            ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                                            }`}
                                    >
                                        Reflowable Text
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                                    {exportMode === "high-fidelity"
                                        ? "Preserves original margins, styles, tables, and colors perfectly. Uses your browser's Print engine (Save as PDF)."
                                        : "Extracts plain text and lets you customize orientation, margins, font size, and line spacing. Downloads instantly."}
                                </p>
                            </div>

                            {exportMode === "reflowable" ? (
                                <>
                                    {/* Orientation Setting */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Layout className="w-3.5 h-3.5 text-indigo-600" /> Page Orientation
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(
                                                [
                                                    { id: "portrait", label: "Portrait (Standard)" },
                                                    { id: "landscape", label: "Landscape" },
                                                ] as const
                                            ).map(({ id, label }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setOrientation(id)}
                                                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${orientation === id
                                                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Margin Preset Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Settings className="w-3.5 h-3.5 text-indigo-600" /> Document Margins
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(
                                                [
                                                    { id: "normal", label: "Normal (0.75 in)" },
                                                    { id: "compact", label: "Compact (0.5 in)" },
                                                    { id: "wide", label: "Wide (1.0 in)" },
                                                ] as const
                                            ).map(({ id, label }) => (
                                                <button
                                                    key={id}
                                                    type="button"
                                                    onClick={() => setMarginPreset(id)}
                                                    className={`py-2 px-2 text-[11px] font-semibold rounded-xl border transition-all ${marginPreset === id
                                                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Typography Adjustments Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-800">
                                                Font Size ({fontSize} pt)
                                            </label>
                                            <input
                                                type="range"
                                                min={9}
                                                max={16}
                                                step={1}
                                                value={fontSize}
                                                onChange={(e) => setFontSize(Number(e.target.value))}
                                                className="w-full accent-indigo-600 cursor-pointer"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-800">
                                                Line Spacing ({lineSpacing}x)
                                            </label>
                                            <input
                                                type="range"
                                                min={1.0}
                                                max={2.0}
                                                step={0.25}
                                                value={lineSpacing}
                                                onChange={(e) => setLineSpacing(Number(e.target.value))}
                                                className="w-full accent-indigo-600 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Checkbox Options */}
                                    <div className="pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includePageNumbers}
                                                onChange={(e) => setIncludePageNumbers(e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                            />
                                            <span className="text-xs font-medium text-slate-700">
                                                Include Page Numbers in Footer
                                            </span>
                                        </label>
                                    </div>

                                    {/* Dynamic Document Statistics Summary */}
                                    <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Words
                                            </p>
                                            <p className="text-xs font-mono font-bold text-slate-800">
                                                {wordCount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Characters
                                            </p>
                                            <p className="text-xs font-mono font-bold text-slate-800">
                                                {characterCount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Paragraphs
                                            </p>
                                            <p className="text-xs font-mono font-bold text-slate-800">
                                                {paragraphCount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl p-4 space-y-2.5">
                                    <div className="flex gap-2.5">
                                        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-800 dark:text-indigo-300">
                                                High-Fidelity Mode Guide:
                                            </p>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                To download, click <strong>Convert & Save as PDF</strong> below to open the browser print window. Under <strong>Destination</strong>, select <strong>Save as PDF</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Download / Process Action Button */}
                            <button
                                type="button"
                                onClick={generateAndDownloadPdf}
                                disabled={!extractedText || isExporting}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${extractedText && !isExporting
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isExporting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Preparing PDF Document...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Convert & Save as PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side DOCX Conversion</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Microsoft Word documents (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">.docx</code>) are structured OpenXML zip archives containing XML documents, media assets, relationships, and formatting styles. Translating these proprietary document structures into Portable Document Format (PDF / ISO 32000-2) requires resolving document trees, parsing style inheritance, and calculating exact text boundaries across multi-page coordinates.
                        </p>
                        <p>
                            Unlike legacy online conversion utilities that upload confidential files to external servers running headless instances of Microsoft Office or LibreOffice, our web suite executes the complete conversion pipeline directly inside your web browser. Using client-side WebAssembly and JavaScript engines, the application parses the binary XML stream locally.
                        </p>
                        <p>
                            Our conversion pipeline leverages <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">docx-preview</code> for DOM layout extraction and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> for low-level vector PDF compilation. By computing line wrapping, font dimensions, margin boundaries, and footer offsets directly in client memory, your sensitive business documents never touch remote servers or third-party cloud storage.
                        </p>
                    </div>
                </div>

                {/* Card 2: Technical Feature & Specification Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Document Conversion & Formatting Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare target parameters, supported page setups, and PDF compilation specifications provided by our client-side engine:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Document Parameter</th>
                                    <th className="px-4 py-3.5 font-bold">Word (.docx) Source</th>
                                    <th className="px-4 py-3.5 font-bold">Client Processing Engine</th>
                                    <th className="px-4 py-3.5 font-bold">PDF Output Specification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Page Orientation</td>
                                    <td className="px-4 py-3">Portrait / Landscape</td>
                                    <td className="px-4 py-3 font-mono text-xs">Dynamic Viewport Calculation</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">612x792 / 792x612 pt</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Document Margins</td>
                                    <td className="px-4 py-3">XML Section Properties</td>
                                    <td className="px-4 py-3 font-mono text-xs">Normal, Compact, Wide Presets</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">36pt to 72pt Guardrails</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Font Embeddings</td>
                                    <td className="px-4 py-3">System TrueType Fonts</td>
                                    <td className="px-4 py-3 font-mono text-xs">Helvetica / Helvetica-Bold</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Standard PostScript Vector Fonts</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Pagination & Footer</td>
                                    <td className="px-4 py-3">Header/Footer XML Streams</td>
                                    <td className="px-4 py-3 font-mono text-xs">Automated Page Counter Engine</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Dynamic "Page X of Y" Footer</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Convert Word Documents to PDF Online</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload DOCX Document",
                                body: "Select or drag any Microsoft Word (.docx) file up to 20 MB into the secure upload drop zone. The engine parses the document immediately.",
                            },
                            {
                                step: "02",
                                title: "Verify Visual Preview",
                                body: "Review the rendered HTML document layout preview and automatic statistics summary (words, characters, and paragraphs) in real-time.",
                            },
                            {
                                step: "03",
                                title: "Configure Export Settings",
                                body: "Adjust page orientation (portrait/landscape), margin guardrails, font sizing, and line spacing to customize your final PDF document layout.",
                            },
                            {
                                step: "04",
                                title: "Download PDF Document",
                                body: "Click Convert & Download PDF to compile the vector PDF binary inside your browser memory and instantly save it to your device.",
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise-Grade Client Security & Privacy Guarantees</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% In-Browser Execution",
                                body: "All OpenXML parsing and PDF rendering take place directly inside your web browser sandbox using JavaScript and WebAssembly. No files are uploaded to external cloud servers.",
                            },
                            {
                                title: "Confidentiality Safeguards",
                                body: "Because your files never leave your device, sensitive financial reports, legal contracts, executive summaries, and medical records remain completely private.",
                            },
                            {
                                title: "Zero Latency Processing",
                                body: "By avoiding upload and download bandwidth overheads, conversions execute instantly regardless of network speed or file size.",
                            },
                            {
                                title: "Automatic Buffer Disposal",
                                body: "Temporary text buffers and DOM canvas nodes are automatically destroyed when you clear the workspace or close your browser tab.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section (Static Highlighted Cards) */}
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
                                q: "Is my Word document uploaded to any external server during conversion?",
                                a: "No. The entire conversion pipeline runs 100% locally in your web browser. Your file is read into client RAM, processed using WebAssembly, and saved as a PDF without transmitting data anywhere.",
                            },
                            {
                                q: "What Microsoft Word file formats are supported?",
                                a: "Our converter specifically supports standard XML-based Word documents (.docx format). For older binary .doc files, save them as .docx in Word before converting.",
                            },
                            {
                                q: "Can I customize the margin sizes and orientation of the output PDF?",
                                a: "Yes! You can toggle between Portrait and Landscape orientation, and choose between Normal (0.75 in), Compact (0.5 in), or Wide (1.0 in) margin presets.",
                            },
                            {
                                q: "Does this converter require software installation or subscription?",
                                a: "Not at all. TwisterTools provides browser-native tools that run instantly without account sign-ups, plugins, or software installations.",
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
                        name: "Word to PDF Converter",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 File API & WebAssembly.",
                        description:
                            "Convert Microsoft Word (.docx) documents to PDF format directly in your browser with complete privacy, custom margins, page numbering, and real-time layout preview.",
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
                                name: "Is my Word document uploaded to any external server during conversion?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. The entire conversion pipeline runs 100% locally in your web browser with zero server uploads.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What Microsoft Word file formats are supported?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "Our converter supports standard XML-based Word documents (.docx format).",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}