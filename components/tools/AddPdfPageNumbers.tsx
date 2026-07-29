"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    FileText,
    Upload,
    FileDown,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Hash,
    Type,
    Bold,
    Italic,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Eye,
    Grid,
    Layers,
    HelpCircle,
    Palette,
    Check,
    ChevronDown,
    ChevronUp,
    X,
    Zap,
} from "lucide-react";
import { PDFDocument, PDFPage, StandardFonts, rgb, PDFFont, PDFName, PDFDict, PDFArray, PDFNumber, PDFHexString, PDFStream } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type PositionHorizontal = "left" | "center" | "right";
type PositionVertical = "top" | "middle" | "bottom";
type StampMode = "page-numbers" | "header" | "footer" | "custom";
type TextAlign = "left" | "center" | "right";

interface PageStampConfig {
    mode: StampMode;
    // Page number settings
    startNumber: number;
    showTotal: boolean;
    pageNumberFormat: string; // "Page {n}" | "{n} / {total}" | "— {n} —" | custom
    // Header/Footer text
    headerText: string;
    footerText: string;
    // Custom text
    customText: string;
    // Positioning
    horizontalPosition: PositionHorizontal;
    verticalPosition: PositionVertical;
    // Styling
    fontSize: number;
    fontFamily: "helvetica" | "times" | "courier";
    fontBold: boolean;
    fontItalic: boolean;
    textColor: string;
    opacity: number;
    marginX: number;
    marginY: number;
    // Preview
    previewPageIndex: number;
}

interface PageThumbnail {
    id: string;
    originalIndex: number;
    thumbnailUrl: string;
}

const DEFAULT_CONFIG: PageStampConfig = {
    mode: "page-numbers",
    startNumber: 1,
    showTotal: true,
    pageNumberFormat: "Page {n}",
    headerText: "",
    footerText: "",
    customText: "",
    horizontalPosition: "center",
    verticalPosition: "bottom",
    fontSize: 12,
    fontFamily: "helvetica",
    fontBold: false,
    fontItalic: false,
    textColor: "#000000",
    opacity: 1,
    marginX: 50,
    marginY: 40,
    previewPageIndex: 0,
};

// ─────────────────────────────────────────────────────────────
// Helper: hex to rgb
// ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const cleanHex = hex.replace("#", "");
    const num = parseInt(cleanHex, 16);
    return {
        r: ((num >> 16) & 255) / 255,
        g: ((num >> 8) & 255) / 255,
        b: (num & 255) / 255,
    };
}

// ─────────────────────────────────────────────────────────────
// Helper: format page number text
// ─────────────────────────────────────────────────────────────
function formatPageNumberText(
    format: string,
    current: number,
    total: number,
    showTotal: boolean
): string {
    const n = current;
    const t = showTotal ? total : 0;
    let result = format
        .replace(/\{n\}/g, String(n))
        .replace(/\{total\}/g, showTotal ? String(t) : "");
    if (!result.trim()) result = String(n);
    return result;
}

// ─────────────────────────────────────────────────────────────
// Helper: get font size for selected font
// ─────────────────────────────────────────────────────────────
function getFontFamily(config: PageStampConfig): StandardFonts {
    if (config.fontFamily === "times") {
        return config.fontBold && config.fontItalic
            ? StandardFonts.TimesRomanBoldItalic
            : config.fontBold
                ? StandardFonts.TimesRomanBold
                : config.fontItalic
                    ? StandardFonts.TimesRomanItalic
                    : StandardFonts.TimesRoman;
    }
    if (config.fontFamily === "courier") {
        return config.fontBold && config.fontItalic
            ? StandardFonts.CourierBoldOblique
            : config.fontBold
                ? StandardFonts.CourierBold
                : config.fontItalic
                    ? StandardFonts.CourierOblique
                    : StandardFonts.Courier;
    }
    // helvetica
    return config.fontBold && config.fontItalic
        ? StandardFonts.HelveticaBoldOblique
        : config.fontBold
            ? StandardFonts.HelveticaBold
            : config.fontItalic
                ? StandardFonts.HelveticaOblique
                : StandardFonts.Helvetica;
}

// ─────────────────────────────────────────────────────────────
// Helper: compute text alignment offset
// ─────────────────────────────────────────────────────────────
function getTextAlignmentOffset(
    align: TextAlign,
    textWidth: number,
    pageWidth: number,
    marginX: number
): number {
    switch (align) {
        case "left":
            return marginX;
        case "center":
            return (pageWidth - textWidth) / 2;
        case "right":
            return pageWidth - textWidth - marginX;
        default:
            return marginX;
    }
}

// ─────────────────────────────────────────────────────────────
// Helper: compute vertical offset
// ─────────────────────────────────────────────────────────────
function getVerticalOffset(
    position: PositionVertical,
    fontSize: number,
    pageHeight: number,
    marginY: number
): number {
    switch (position) {
        case "top":
            return pageHeight - marginY;
        case "middle":
            return pageHeight / 2 + fontSize / 4;
        case "bottom":
            return marginY + fontSize / 4;
        default:
            return marginY + fontSize / 4;
    }
}

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AddPdfPageNumbers() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
    const [pageCount, setPageCount] = useState<number>(0);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [pageThumbnails, setPageThumbnails] = useState<PageThumbnail[]>([]);

    // ── Config State ──
    const [config, setConfig] = useState<PageStampConfig>({ ...DEFAULT_CONFIG });

    // ── Processing & UI State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ─────────────────────────────────────────────────────────────
    // File Ingestion
    // ─────────────────────────────────────────────────────────────

    const handleFile = useCallback(async (file: File) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        setPreviewUrl(null);

        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > 30 * 1024 * 1024) {
            setErrorMessage("File size exceeds 30 MB limit. Please select a smaller PDF.");
            return;
        }

        setIsLoading(true);
        setLoadingProgress(10);
        setFileName(file.name);
        setFileSize(file.size);

        try {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);

            setLoadingProgress(30);

            const doc = await PDFDocument.load(bytes, {
                ignoreEncryption: true,
            });

            setLoadingProgress(60);

            setPdfBytes(bytes);
            setPdfDoc(doc);
            setPageCount(doc.getPageCount());
            setConfig(prev => ({ ...prev, startNumber: 1 }));

            // Generate basic thumbnails (page count info only, actual rendering not needed)
            const thumbs: PageThumbnail[] = [];
            for (let i = 0; i < doc.getPageCount(); i++) {
                thumbs.push({
                    id: `page-${i}`,
                    originalIndex: i,
                    thumbnailUrl: "",
                });
            }
            setPageThumbnails(thumbs);
            setLoadingProgress(100);

            // Generate preview
            await generatePreview(bytes, doc, config);

            setTimeout(() => {
                setIsLoading(false);
                setLoadingProgress(0);
            }, 300);
        } catch (err) {
            console.error("Failed to load PDF:", err);
            setErrorMessage("Failed to load PDF. The file may be corrupted or password-protected.");
            setIsLoading(false);
            setLoadingProgress(0);
        }
    }, [config]);

    // ─────────────────────────────────────────────────────────────
    // Generate Preview
    // ─────────────────────────────────────────────────────────────
    const generatePreview = useCallback(async (
        sourceBytes: Uint8Array,
        doc: PDFDocument,
        cfg: PageStampConfig
    ) => {
        try {
            // Clone the document for preview
            const previewDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
            const pages = previewDoc.getPages();
            if (pages.length === 0) return;

            // Use the configured preview page index (clamped)
            const pageIdx = Math.min(cfg.previewPageIndex, pages.length - 1);
            const page = pages[pageIdx];
            const { width, height } = page.getSize();

            // Embed font
            const fontType = getFontFamily(cfg);
            const font = await previewDoc.embedFont(fontType);
            const color = hexToRgb(cfg.textColor);

            // Determine text based on mode
            let text = "";
            if (cfg.mode === "page-numbers") {
                text = formatPageNumberText(
                    cfg.pageNumberFormat,
                    cfg.startNumber + pageIdx,
                    pages.length,
                    cfg.showTotal
                );
            } else if (cfg.mode === "header") {
                text = cfg.headerText || "";
            } else if (cfg.mode === "footer") {
                text = cfg.footerText || "";
            } else if (cfg.mode === "custom") {
                text = cfg.customText || "";
            }

            if (!text) {
                setPreviewUrl(null);
                return;
            }

            const textWidth = font.widthOfTextAtSize(text, cfg.fontSize);
            const xPos = getTextAlignmentOffset(
                cfg.horizontalPosition === "left" ? "left" : cfg.horizontalPosition === "center" ? "center" : "right",
                textWidth,
                width,
                cfg.marginX
            );
            const yPos = getVerticalOffset(cfg.verticalPosition, cfg.fontSize, height, cfg.marginY);

            page.drawText(text, {
                x: xPos,
                y: yPos,
                size: cfg.fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity: cfg.opacity,
            });

    const previewBytes = await previewDoc.save();
            const blob = new Blob([previewBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (err) {
            console.error("Preview generation failed:", err);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Update config and regenerate preview
    // ─────────────────────────────────────────────────────────────
    const updateConfig = useCallback((updates: Partial<PageStampConfig>) => {
        setConfig(prev => {
            const next = { ...prev, ...updates };
            return next;
        });
    }, []);

    // Regenerate preview when config changes
    useEffect(() => {
        if (!pdfBytes || !pdfDoc) return;
        const timer = setTimeout(() => {
            generatePreview(pdfBytes, pdfDoc, config);
        }, 300);
        return () => clearTimeout(timer);
    }, [config, pdfBytes, pdfDoc, generatePreview]);

    // ─────────────────────────────────────────────────────────────
    // Export PDF with stamps applied
    // ─────────────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        if (!pdfBytes || !pdfDoc || pageCount === 0) {
            setErrorMessage("Please upload a PDF first.");
            return;
        }

        setIsExporting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // Load a fresh copy of the document
            const exportDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const pages = exportDoc.getPages();

            // Embed font
            const fontType = getFontFamily(config);
            const font = await exportDoc.embedFont(fontType);
            const color = hexToRgb(config.textColor);

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const { width, height } = page.getSize();

                // Determine text
                let text = "";
                if (config.mode === "page-numbers") {
                    text = formatPageNumberText(
                        config.pageNumberFormat,
                        config.startNumber + i,
                        pages.length,
                        config.showTotal
                    );
                } else if (config.mode === "header") {
                    text = config.headerText || "";
                } else if (config.mode === "footer") {
                    text = config.footerText || "";
                } else if (config.mode === "custom") {
                    text = config.customText || "";
                }

                if (!text) continue;

                const textWidth = font.widthOfTextAtSize(text, config.fontSize);
                const xPos = getTextAlignmentOffset(
                    config.horizontalPosition === "left" ? "left" : config.horizontalPosition === "center" ? "center" : "right",
                    textWidth,
                    width,
                    config.marginX
                );
                const yPos = getVerticalOffset(config.verticalPosition, config.fontSize, height, config.marginY);

                page.drawText(text, {
                    x: xPos,
                    y: yPos,
                    size: config.fontSize,
                    font,
                    color: rgb(color.r, color.g, color.b),
                    opacity: config.opacity,
                });
            }

            const exportBytes = await exportDoc.save();
            const blob = new Blob([exportBytes as any], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            // Trigger download
            const link = document.createElement("a");
            link.href = url;
            const baseName = fileName.replace(/\.[^/.]+$/, "") || "document";
            link.download = `${baseName}-numbered.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccessMessage(`Stamps applied successfully — ${pages.length} page(s) processed.`);
        } catch (err) {
            console.error("Export failed:", err);
            setErrorMessage("Failed to apply stamps. The PDF may be corrupted or too complex.");
        } finally {
            setIsExporting(false);
        }
    }, [pdfBytes, pdfDoc, pageCount, config, fileName]);

    // ─────────────────────────────────────────────────────────────
    // Clear / Reset
    // ─────────────────────────────────────────────────────────────
    const handleClear = useCallback(() => {
        setPdfFile(null);
        setPdfBytes(null);
        setPdfDoc(null);
        setPageCount(0);
        setFileName("");
        setFileSize(0);
        setPageThumbnails([]);
        setConfig({ ...DEFAULT_CONFIG });
        setErrorMessage(null);
        setSuccessMessage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Drag & Drop Handlers
    // ─────────────────────────────────────────────────────────────
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // ─────────────────────────────────────────────────────────────
    // Helpers: format file size
    // ─────────────────────────────────────────────────────────────
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    // ─────────────────────────────────────────────────────────────
    // Presets
    // ─────────────────────────────────────────────────────────────
    const presets = [
        {
            label: "Page Numbers (Bottom Center)",
            apply: () => updateConfig({
                mode: "page-numbers",
                horizontalPosition: "center",
                verticalPosition: "bottom",
                pageNumberFormat: "Page {n}",
                showTotal: false,
                fontSize: 12,
            }),
        },
        {
            label: "Page X of Y (Bottom Center)",
            apply: () => updateConfig({
                mode: "page-numbers",
                horizontalPosition: "center",
                verticalPosition: "bottom",
                pageNumberFormat: "{n} / {total}",
                showTotal: true,
                fontSize: 11,
            }),
        },
        {
            label: "Header – Document Title",
            apply: () => updateConfig({
                mode: "header",
                headerText: "Confidential Document",
                horizontalPosition: "center",
                verticalPosition: "top",
                fontSize: 10,
                fontBold: true,
            }),
        },
        {
            label: "Footer – Page Numbers",
            apply: () => updateConfig({
                mode: "footer",
                footerText: "Page {n}",
                horizontalPosition: "right",
                verticalPosition: "bottom",
                fontSize: 10,
                showTotal: false,
            }),
        },
        {
            label: "Draft Watermark (Large Center)",
            apply: () => updateConfig({
                mode: "custom",
                customText: "DRAFT",
                horizontalPosition: "center",
                verticalPosition: "middle",
                fontSize: 48,
                fontBold: true,
                opacity: 0.15,
                textColor: "#FF0000",
            }),
        },
    ];

    // ─────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────
    return (
        <div className="w-full space-y-6">
            {/* Drop Zone or File Info */}
            {!pdfBytes ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-10 md:p-16 transition-all duration-200 text-center ${isDragging
                        ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-500"
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                                {isDragging ? "Drop your PDF here" : "Upload a PDF to add page numbers"}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Drag & drop or click to browse (max 30 MB)
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* File Info Bar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                                    {fileName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {pageCount} page{pageCount !== 1 ? "s" : ""} &middot; {formatFileSize(fileSize)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClear}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 transition-colors"
                            title="Remove file"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Presets */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Quick Presets</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={preset.apply}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Config Panel */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 md:p-6 space-y-5">
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            Stamp Configuration
                        </h3>

                        {/* Mode Selector */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {([
                                { value: "page-numbers", label: "Page Numbers", icon: Hash },
                                { value: "header", label: "Header", icon: Type },
                                { value: "footer", label: "Footer", icon: Type },
                                { value: "custom", label: "Custom Text", icon: FileText },
                            ] as const).map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => updateConfig({ mode: value as StampMode })}
                                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${config.mode === value
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Conditional Text Inputs */}
                        {config.mode === "page-numbers" && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        Page Number Format
                                    </label>
                                    <select
                                        value={config.pageNumberFormat}
                                        onChange={(e) => updateConfig({ pageNumberFormat: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="Page {n}">Page {config.startNumber}</option>
                                        <option value="{n} / {total}">{config.startNumber} / {pageCount}</option>
                                        <option value="— {n} —">— {config.startNumber} —</option>
                                        <option value="{n}">{config.startNumber}</option>
                                        <option value="custom">Custom format...</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        Start Number
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={config.startNumber}
                                        onChange={(e) => updateConfig({ startNumber: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        Show Total Pages
                                    </label>
                                    <div className="flex items-center h-10">
                                        <button
                                            onClick={() => updateConfig({ showTotal: !config.showTotal })}
                                            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${config.showTotal
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
                                                }`}
                                        >
                                            {config.showTotal ? "On" : "Off"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {config.mode === "page-numbers" && config.pageNumberFormat === "custom" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    Custom Format (use {'{n}'} for number, {'{total}'} for total)
                                </label>
                                <input
                                    type="text"
                                    value={config.pageNumberFormat}
                                    onChange={(e) => updateConfig({ pageNumberFormat: e.target.value })}
                                    placeholder="Page {n} of {total}"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {config.mode === "header" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    Header Text (use {'{n}'} for page number)
                                </label>
                                <input
                                    type="text"
                                    value={config.headerText}
                                    onChange={(e) => updateConfig({ headerText: e.target.value })}
                                    placeholder="Enter header text (e.g., Confidential - Page {n})"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {config.mode === "footer" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    Footer Text (use {'{n}'} for page number)
                                </label>
                                <input
                                    type="text"
                                    value={config.footerText}
                                    onChange={(e) => updateConfig({ footerText: e.target.value })}
                                    placeholder="Enter footer text (e.g., Page {n} of {total})"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {config.mode === "custom" && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    Custom Text
                                </label>
                                <input
                                    type="text"
                                    value={config.customText}
                                    onChange={(e) => updateConfig({ customText: e.target.value })}
                                    placeholder="Enter custom stamp text (e.g., DRAFT, CONFIDENTIAL, SAMPLE)"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Position Settings */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        Horizontal Position
                                    </label>
                                    <div className="flex gap-1">
                                        {([
                                            { value: "left", icon: AlignLeft },
                                            { value: "center", icon: AlignCenter },
                                            { value: "right", icon: AlignRight },
                                        ] as const).map(({ value, icon: Icon }) => (
                                            <button
                                                key={value}
                                                onClick={() => updateConfig({ horizontalPosition: value })}
                                                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${config.horizontalPosition === value
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                    }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {value.charAt(0).toUpperCase() + value.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        Vertical Position
                                    </label>
                                    <div className="flex gap-1">
                                        {(["top", "middle", "bottom"] as const).map((value) => (
                                            <button
                                                key={value}
                                                onClick={() => updateConfig({ verticalPosition: value })}
                                                className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium border transition-all ${config.verticalPosition === value
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                    }`}
                                            >
                                                {value.charAt(0).toUpperCase() + value.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                Advanced Settings
                            </button>

                            {showAdvanced && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                Font Family
                                            </label>
                                            <select
                                                value={config.fontFamily}
                                                onChange={(e) => updateConfig({ fontFamily: e.target.value as "helvetica" | "times" | "courier" })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="helvetica">Helvetica</option>
                                                <option value="times">Times Roman</option>
                                                <option value="courier">Courier</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                Font Size
                                            </label>
                                            <input
                                                type="number"
                                                min={6}
                                                max={120}
                                                value={config.fontSize}
                                                onChange={(e) => updateConfig({ fontSize: Math.max(6, Math.min(120, parseInt(e.target.value) || 12)) })}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                Opacity
                                            </label>
                                            <input
                                                type="range"
                                                min={0.05}
                                                max={1}
                                                step={0.05}
                                                value={config.opacity}
                                                onChange={(e) => updateConfig({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                                            />
                                            <span className="text-xs text-slate-500 mt-0.5 block">
                                                {Math.round(config.opacity * 100)}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                Font Style
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateConfig({ fontBold: !config.fontBold })}
                                                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${config.fontBold
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                        }`}
                                                >
                                                    <Bold className="w-3.5 h-3.5" />
                                                    Bold
                                                </button>
                                                <button
                                                    onClick={() => updateConfig({ fontItalic: !config.fontItalic })}
                                                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${config.fontItalic
                                                        ? "bg-indigo-600 text-white border-indigo-600"
                                                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                                                        }`}
                                                >
                                                    <Italic className="w-3.5 h-3.5" />
                                                    Italic
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                Text Color
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={config.textColor}
                                                    onChange={(e) => updateConfig({ textColor: e.target.value })}
                                                    className="w-10 h-10 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                                                />
                                                <span className="text-xs text-slate-500 font-mono">{config.textColor}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Margin X
                                                </label>
                                                <input
                                                    type="number"
                                                    min={10}
                                                    max={300}
                                                    value={config.marginX}
                                                    onChange={(e) => updateConfig({ marginX: Math.max(10, Math.min(300, parseInt(e.target.value) || 50)) })}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                                    Margin Y
                                                </label>
                                                <input
                                                    type="number"
                                                    min={10}
                                                    max={300}
                                                    value={config.marginY}
                                                    onChange={(e) => updateConfig({ marginY: Math.max(10, Math.min(300, parseInt(e.target.value) || 40)) })}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Page Selector */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                            Preview Page
                                        </label>
                                        <select
                                            value={config.previewPageIndex}
                                            onChange={(e) => updateConfig({ previewPageIndex: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            {Array.from({ length: pageCount }, (_, i) => (
                                                <option key={i} value={i}>
                                                    Page {i + 1} of {pageCount}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    Preview (Page {config.previewPageIndex + 1})
                                </h3>
                            </div>
                            <iframe
                                src={previewUrl}
                                className="w-full h-[300px] md:h-[400px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                title="PDF Preview"
                            />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors shadow-sm"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Applying Stamps...
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    Download Stamped PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClear}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Start Over
                        </button>
                    </div>

                    {/* Messages */}
                    {errorMessage && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {errorMessage}
                        </div>
                    )}
                    {successMessage && (
                        <div className="flex items-center gap-2 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-400">
                            <Check className="w-4 h-4 flex-shrink-0" />
                            {successMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Loading PDF... {loadingProgress}%
                        </p>
                        <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

