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
    Workflow,
    Eye,
    FileDown,
    Type,
    Palette,
    Maximize2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type PageSize = "a4" | "letter" | "legal";
type Orientation = "portrait" | "landscape";
type Alignment = "left" | "center" | "right" | "justify";
type FontFamily = "Helvetica" | "Times-Roman" | "Courier";

interface PreviewPage {
    pageNumber: number;
    lines: string[];
}

export default function TextToPdfConverter() {
    // ── Core Input & Config State ──
    const [inputText, setInputText] = useState<string>("");
    const [fileName, setFileName] = useState<string>("document.pdf");
    const [pageSize, setPageSize] = useState<PageSize>("a4");
    const [orientation, setOrientation] = useState<Orientation>("portrait");
    const [fontFamily, setFontFamily] = useState<FontFamily>("Helvetica");
    const [fontSize, setFontSize] = useState<number>(12);
    const [lineSpacing, setLineSpacing] = useState<number>(1.4);
    const [margin, setMargin] = useState<number>(40);
    const [textColor, setTextColor] = useState<string>("#0f172a");
    const [alignment, setAlignment] = useState<Alignment>("left");

    // ── Engine & Processing State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [previewPages, setPreviewPages] = useState<PreviewPage[]>([]);
    const [pageCount, setPageCount] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);
    const [charCount, setCharCount] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Page Size Dimensions (Points: 72 points per inch) ──
    const getPageDimensions = useCallback(() => {
        let width = 595.28; // A4 default
        let height = 841.89;

        if (pageSize === "letter") {
            width = 612;
            height = 792;
        } else if (pageSize === "legal") {
            width = 612;
            height = 1008;
        }

        if (orientation === "landscape") {
            return { width: height, height: width };
        }
        return { width, height };
    }, [pageSize, orientation]);

    // ── Real-Time Pagination & Line Wrapping Engine ──
    const updatePaginationPreview = useCallback(() => {
        if (!inputText.trim()) {
            setPreviewPages([]);
            setPageCount(0);
            setWordCount(0);
            setCharCount(0);
            return;
        }

        const sanitizedText = inputText.replace(/\r/g, "");
        const words = sanitizedText.trim().split(/\s+/).filter(Boolean);
        setWordCount(words.length);
        setCharCount(sanitizedText.length);

        const { width, height } = getPageDimensions();
        const contentWidth = width - margin * 2;
        const contentHeight = height - margin * 2;

        const approxCharWidth = fontSize * 0.52;
        const maxCharsPerLine = Math.max(10, Math.floor(contentWidth / approxCharWidth));
        const lineHeight = fontSize * lineSpacing;
        const maxLinesPerPage = Math.max(1, Math.floor(contentHeight / lineHeight));

        const rawLines = sanitizedText.split("\n");
        const wrappedLines: string[] = [];

        for (const rawLine of rawLines) {
            if (rawLine.length === 0) {
                wrappedLines.push("");
                continue;
            }

            const lineWords = rawLine.split(" ");
            let currentLine = "";

            for (const word of lineWords) {
                if ((currentLine + (currentLine ? " " : "") + word).length <= maxCharsPerLine) {
                    currentLine += (currentLine ? " " : "") + word;
                } else {
                    if (currentLine) wrappedLines.push(currentLine);
                    if (word.length > maxCharsPerLine) {
                        let remainingWord = word;
                        while (remainingWord.length > maxCharsPerLine) {
                            wrappedLines.push(remainingWord.slice(0, maxCharsPerLine));
                            remainingWord = remainingWord.slice(maxCharsPerLine);
                        }
                        currentLine = remainingWord;
                    } else {
                        currentLine = word;
                    }
                }
            }
            if (currentLine) wrappedLines.push(currentLine);
        }

        const pages: PreviewPage[] = [];
        for (let i = 0; i < wrappedLines.length; i += maxLinesPerPage) {
            pages.push({
                pageNumber: pages.length + 1,
                lines: wrappedLines.slice(i, i + maxLinesPerPage),
            });
        }

        setPreviewPages(pages);
        setPageCount(pages.length);
    }, [inputText, getPageDimensions, margin, fontSize, lineSpacing]);

    useEffect(() => {
        updatePaginationPreview();
    }, [updatePaginationPreview]);

    // ── Sample Loader & Clear ──
    const loadSampleText = () => {
        const sample = `Text to PDF Conversion Engine
=====================================

Overview:
This professional utility converts plain text documents into standard ISO 32000-2 compliant Portable Document Format (PDF) files entirely inside your web browser.

Key Specifications:
• 100% Client-Side Processing for Total Privacy
• Customizable Page Dimensions (A4, Letter, Legal)
• Custom Margins, Line Spacing, and Typography Controls
• Real-time Paginated Canvas Preview
• Supports Dynamic Color Palettes and Text Alignment

Security Guarantee:
Your document content remains strictly in browser RAM. Zero network requests, zero server logging, and maximum enterprise data safety.`;

        setInputText(sample);
        setErrorMessage(null);
    };

    const clearWorkspace = () => {
        setInputText("");
        setPreviewPages([]);
        setPageCount(0);
        setWordCount(0);
        setCharCount(0);
        setErrorMessage(null);
    };

    // ── Drag & Drop Text File Handler ──
    const handleFile = useCallback((file: File) => {
        setErrorMessage(null);
        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage("File exceeds 20 MB limit. Please select a smaller text file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content === "string") {
                setInputText(content);
                setFileName(file.name.replace(/\.[^/.]+$/, "") + ".pdf");
            }
        };
        reader.onerror = () => {
            setErrorMessage("Failed to read text file. Please try again.");
        };
        reader.readAsText(file);
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

    // ── Clipboard Copy ──
    const copyText = async () => {
        if (!inputText) return;
        try {
            await navigator.clipboard.writeText(inputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent */
        }
    };

    // ── Helper: Hex Color to RGB ──
    const hexToRgb = (hex: string) => {
        const cleanHex = hex.replace("#", "");
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
        return rgb(r, g, b);
    };

    // ── Complete PDF Compilation Engine ──
    const generateAndDownloadPdf = async () => {
        if (!inputText.trim()) {
            setErrorMessage("Please enter or paste text content before generating PDF.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const pdfDoc = await PDFDocument.create();
            let selectedStandardFont = StandardFonts.Helvetica;
            if (fontFamily === "Times-Roman") selectedStandardFont = StandardFonts.TimesRoman;
            if (fontFamily === "Courier") selectedStandardFont = StandardFonts.Courier;

            const embedFont = await pdfDoc.embedFont(selectedStandardFont);
            const textColorRgb = hexToRgb(textColor);

            const { width, height } = getPageDimensions();
            const contentWidth = width - margin * 2;
            const contentHeight = height - margin * 2;
            const lineHeight = fontSize * lineSpacing;

            const paragraphs = inputText.replace(/\r/g, "").split("\n");
            const wrappedLines: string[] = [];

            for (const paragraph of paragraphs) {
                if (paragraph.length === 0) {
                    wrappedLines.push("");
                    continue;
                }

                const words = paragraph.split(" ");
                let currentLine = "";

                for (const word of words) {
                    const testLine = currentLine ? `${currentLine} ${word}` : word;
                    const textWidth = embedFont.widthOfTextAtSize(testLine, fontSize);

                    if (textWidth <= contentWidth) {
                        currentLine = testLine;
                    } else {
                        if (currentLine) wrappedLines.push(currentLine);
                        if (embedFont.widthOfTextAtSize(word, fontSize) > contentWidth) {
                            let chunk = "";
                            for (const char of word) {
                                if (embedFont.widthOfTextAtSize(chunk + char, fontSize) <= contentWidth) {
                                    chunk += char;
                                } else {
                                    wrappedLines.push(chunk);
                                    chunk = char;
                                }
                            }
                            currentLine = chunk;
                        } else {
                            currentLine = word;
                        }
                    }
                }
                if (currentLine) wrappedLines.push(currentLine);
            }

            let currentPage = pdfDoc.addPage([width, height]);
            let currentY = height - margin - fontSize;

            for (let i = 0; i < wrappedLines.length; i++) {
                const line = wrappedLines[i];

                if (currentY < margin) {
                    currentPage = pdfDoc.addPage([width, height]);
                    currentY = height - margin - fontSize;
                }

                if (line) {
                    const textWidth = embedFont.widthOfTextAtSize(line, fontSize);
                    let xPosition = margin;

                    if (alignment === "center") {
                        xPosition = margin + (contentWidth - textWidth) / 2;
                    } else if (alignment === "right") {
                        xPosition = width - margin - textWidth;
                    }

                    currentPage.drawText(line, {
                        x: xPosition,
                        y: currentY,
                        size: fontSize,
                        font: embedFont,
                        color: textColorRgb,
                    });
                }

                currentY -= lineHeight;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "An error occurred while building the PDF document."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full space-y-8">

            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & SETTINGS ══════════════════ */}
                <div className="space-y-5">
                    {/* Main Text Editor Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <Type className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">1. Input Text Content</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={loadSampleText}
                                    className="px-2.5 py-1 text-xs font-semibold bg-white/25 hover:bg-white/25 text-white rounded-lg transition-all flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    disabled={!inputText}
                                    className="px-2.5 py-1 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 disabled:hover:bg-rose-500/20 text-rose-100 rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Drag & Drop Import Banner */}
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`rounded-xl border-2 border-dashed p-3 text-center cursor-pointer transition-all ${isDragging
                                    ? "border-indigo-500 bg-indigo-50/60"
                                    : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.md,.log,.csv"
                                    className="hidden"
                                    onChange={(e) =>
                                        e.target.files?.[0] && handleFile(e.target.files[0])
                                    }
                                />
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                                    <Upload className="w-4 h-4 text-indigo-600" />
                                    <span>
                                        Drop a <strong>.txt</strong> file here or click to import
                                        (Max 20 MB)
                                    </span>
                                </div>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type or paste plain text content here..."
                                className="w-full h-[320px] font-mono text-sm p-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none resize-none transition-all"
                            />

                            {/* Character & Word Counter Footer */}
                            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1 border-t border-slate-100">
                                <span>Words: {wordCount.toLocaleString()}</span>
                                <span>Characters: {charCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Document Formatting Controls */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Sliders className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-slate-900">
                                2. Layout & Typography Controls
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Output File Name */}
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    PDF Filename
                                </label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Page Size */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Page Size
                                </label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(e.target.value as PageSize)}
                                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="a4">A4 (210 × 297 mm)</option>
                                    <option value="letter">Letter (8.5 × 11 in)</option>
                                    <option value="legal">Legal (8.5 × 14 in)</option>
                                </select>
                            </div>

                            {/* Orientation */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Orientation
                                </label>
                                <select
                                    value={orientation}
                                    onChange={(e) => setOrientation(e.target.value as Orientation)}
                                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>

                            {/* Font Family */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Font Family
                                </label>
                                <select
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="Helvetica">Helvetica (Sans-Serif)</option>
                                    <option value="Times-Roman">Times Roman (Serif)</option>
                                    <option value="Courier">Courier (Monospace)</option>
                                </select>
                            </div>

                            {/* Font Size */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Font Size ({fontSize} pt)
                                </label>
                                <input
                                    type="range"
                                    min={8}
                                    max={24}
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            {/* Line Spacing */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Line Spacing ({lineSpacing}x)
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={2.5}
                                    step={0.1}
                                    value={lineSpacing}
                                    onChange={(e) => setLineSpacing(Number(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            {/* Margins */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Page Margin ({margin} pt)
                                </label>
                                <input
                                    type="range"
                                    min={20}
                                    max={80}
                                    step={5}
                                    value={margin}
                                    onChange={(e) => setMargin(Number(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            {/* Text Color Selector */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Text Color
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                                    />
                                    <span className="text-xs font-mono text-slate-600">
                                        {textColor}
                                    </span>
                                </div>
                            </div>

                            {/* Text Alignment */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-700">
                                    Alignment
                                </label>
                                <div className="flex items-center rounded-xl bg-slate-100 p-1">
                                    {[
                                        { id: "left", icon: AlignLeft },
                                        { id: "center", icon: AlignCenter },
                                        { id: "right", icon: AlignRight },
                                    ].map(({ id, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setAlignment(id as Alignment)}
                                            className={`flex-1 py-1 flex items-center justify-center rounded-lg transition-all ${alignment === id
                                                ? "bg-white text-indigo-600 shadow-sm"
                                                : "text-slate-500 hover:text-slate-800"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: REAL-TIME PREVIEW & EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <Eye className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">3. Real-Time Document Preview</span>
                            </div>
                            <span className="text-xs font-mono font-bold text-indigo-100 bg-white/10 px-2.5 py-0.5 rounded-lg">
                                {pageCount} Page{pageCount !== 1 ? "s" : ""}
                            </span>
                        </div>

                        <div className="p-5 space-y-4">

                            {/* Pagination Visualizer Display */}
                            <div className="h-[480px] overflow-y-auto bg-slate-100/70 border border-slate-200 rounded-xl p-4 space-y-4">
                                {previewPages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                        <FileText className="w-12 h-12 mb-2 text-slate-300" />
                                        <p className="text-sm font-semibold text-slate-600">
                                            No Text Content Entered
                                        </p>
                                        <p className="text-xs text-slate-400 max-w-xs mt-1">
                                            Enter or paste plain text in the input area to view live paginated document preview.
                                        </p>
                                    </div>
                                ) : (
                                    previewPages.map((page) => (
                                        <div
                                            key={page.pageNumber}
                                            className="bg-white rounded-lg shadow-md border border-slate-200 p-6 space-y-2 relative transition-transform hover:shadow-lg"
                                            style={{
                                                fontFamily:
                                                    fontFamily === "Courier"
                                                        ? "monospace"
                                                        : fontFamily === "Times-Roman"
                                                            ? "serif"
                                                            : "sans-serif",
                                            }}
                                        >
                                            <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                Page {page.pageNumber}
                                            </div>

                                            <div
                                                className="text-xs leading-relaxed space-y-1 pt-2"
                                                style={{
                                                    color: textColor,
                                                    textAlign: alignment,
                                                }}
                                            >
                                                {page.lines.map((line, idx) => (
                                                    <div key={idx} className="min-h-[1.2em]">
                                                        {line || "\u00A0"}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Error Banner */}
                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Export Trigger Button */}
                            <button
                                type="button"
                                onClick={generateAndDownloadPdf}
                                disabled={!inputText.trim() || isProcessing}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${inputText.trim() && !isProcessing
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
                                        <span>Convert & Download PDF Document</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture of Text-to-PDF Compilation</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            The Portable Document Format (PDF) specification requires text content to be placed on a two-dimensional coordinate system using explicitly embedded fonts and byte stream instructions. Unlike standard HTML or text editors that flow automatically within liquid containers, PDF documents maintain absolute structural positions measured in PostScript points ($1/72$ inch).
                        </p>
                        <p>
                            Our conversion suite leverages client-side WebAssembly and JavaScript engines driven by <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code>. When text is supplied, the engine calculates glyph widths against standard PDF fonts (Helvetica, Times Roman, or Courier). It performs line-wrapping calculations based on selected margin widths, font sizes, and orientation parameters before writing text streams to page dictionary objects.
                        </p>
                        <p>
                            Because compilation happens directly in memory using browser JavaScript execution contexts, source text and generated PDF binaries are never transmitted across remote servers. This eliminates security vulnerabilities associated with cloud processing.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Text-to-PDF Configuration Capabilities</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Compare layout and formatting configurations supported by our client-side conversion engine:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Parameter</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Options</th>
                                    <th className="px-4 py-3.5 font-bold">PDF Engine Processing Logic</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Page Dimensions</td>
                                    <td className="px-4 py-3 font-mono text-xs">A4, Letter, Legal</td>
                                    <td className="px-4 py-3">Sets media box boundaries in points</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Orientation</td>
                                    <td className="px-4 py-3 font-mono text-xs">Portrait, Landscape</td>
                                    <td className="px-4 py-3">Swaps width and height dimensions dynamically</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Typography</td>
                                    <td className="px-4 py-3 font-mono text-xs">Helvetica, Times, Courier</td>
                                    <td className="px-4 py-3">Embeds standard Type 1 font references</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Text Alignment</td>
                                    <td className="px-4 py-3 font-mono text-xs">Left, Center, Right</td>
                                    <td className="px-4 py-3">Calculates horizontal X offset per wrapped line</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Workflow className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>How to Convert Plain Text to PDF</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Enter or Import Text",
                                body: "Paste text directly into the editor or drag and drop a .txt file up to 20 MB into the workspace.",
                            },
                            {
                                step: "02",
                                title: "Customize Page Formatting",
                                body: "Select target page dimensions (A4/Letter), orientation, typography family, line spacing, margins, and text color.",
                            },
                            {
                                step: "03",
                                title: "Verify Real-Time Preview",
                                body: "Review the paginated thumbnail preview panel to verify page breaks and line wrapping.",
                            },
                            {
                                step: "04",
                                title: "Generate and Download",
                                body: "Click convert to compile the PDF binary in browser RAM and save the document instantly to your local system.",
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

                {/* Card 4: Security Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Enterprise Data Security & Privacy Controls</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% In-Browser Execution",
                                body: "Processing runs inside your workstation browser. No text data or converted files leave your machine.",
                            },
                            {
                                title: "Zero Cloud Logging",
                                body: "Because conversions do not use external cloud servers, sensitive documentation stays completely confidential.",
                            },
                            {
                                title: "Instant RAM Disposal",
                                body: "Memory buffers are flushed automatically when clearing the workspace or refreshing the browser tab.",
                            },
                            {
                                title: "No Account Required",
                                body: "Full conversion functionality is accessible without login credentials, tracking scripts, or subscriptions.",
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Are my uploaded text files uploaded to any external server?",
                                a: "No. The entire conversion pipeline runs 100% client-side inside your browser memory using pdf-lib. Your data never touches an external server.",
                            },
                            {
                                q: "What file size limit applies to text conversions?",
                                a: "The tool supports files up to 20 MB directly within your web browser memory.",
                            },
                            {
                                q: "Can I adjust fonts, margins, and page orientations?",
                                a: "Yes. You can customize page sizes (A4, Letter, Legal), font families (Helvetica, Times Roman, Courier), line spacing, margin sizes, colors, and text alignment.",
                            },
                            {
                                q: "Is there any cost or conversion limit for this utility?",
                                a: "No. The tool is entirely free to use with zero daily limits or hidden paywalls.",
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

            {/* JSON-LD Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "Text to PDF Converter",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Convert plain text documents to PDF format directly inside your browser with zero file uploads and complete data privacy.",
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
                                name: "Are my uploaded text files uploaded to any external server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. The entire conversion pipeline runs 100% client-side inside your browser memory using pdf-lib.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What file size limit applies to text conversions?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "The tool supports files up to 20 MB directly within your web browser memory.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}