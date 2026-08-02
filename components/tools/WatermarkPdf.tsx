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
    Stamp,
    Type,
    Image as ImageIcon,
    Eye,
    Grid,
    Lock,
    Maximize2,
    FileDown,
} from "lucide-react";
import { PDFDocument, rgb, degrees, StandardFonts, PDFPage } from "pdf-lib";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type WatermarkType = "text" | "image";
type WatermarkPosition =
    | "center"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "tile";

interface PDFPagePreview {
    id: string;
    pageIndex: number;
    thumbnailUrl: string;
}

export default function WatermarkPdf() {
    // ── Core PDF State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
    const [pages, setPages] = useState<PDFPagePreview[]>([]);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    // ── Watermark Settings State ──
    const [watermarkType, setWatermarkType] = useState<WatermarkType>("text");

    // Text Watermark Settings
    const [text, setText] = useState<string>("CONFIDENTIAL");
    const [fontSize, setFontSize] = useState<number>(48);
    const [textColor, setTextColor] = useState<string>("#ef4444"); // Red hex default
    const [fontFamily, setFontFamily] = useState<StandardFonts>(StandardFonts.HelveticaBold);

    // Image Watermark Settings
    const [stampImageFile, setStampImageFile] = useState<File | null>(null);
    const [stampImageBytes, setStampImageBytes] = useState<ArrayBuffer | null>(null);
    const [stampImageType, setStampImageType] = useState<"png" | "jpg" | null>(null);
    const [imageScale, setImageScale] = useState<number>(0.3);

    // Common Layout & Style Settings
    const [opacity, setOpacity] = useState<number>(0.35);
    const [rotation, setRotation] = useState<number>(45);
    const [position, setPosition] = useState<WatermarkPosition>("center");
    const [applyToRange, setApplyToRange] = useState<string>("all"); // "all" or specific range like "1-3, 5"

    // ── Processing & UI State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewPageUrl, setPreviewPageUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampImageInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Document Loading & Thumbnail Generation
    // ─────────────────────────────────────────────────────────────

    const handlePdfUpload = useCallback(async (file: File) => {
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
        setLoadingProgress(10);
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

            const pagePreviews: PDFPagePreview[] = [];

            for (let i = 1; i <= count; i++) {
                setLoadingProgress(Math.round(10 + (i / count) * 85));
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.25 });

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

                    pagePreviews.push({
                        id: `page-${i}-${Date.now()}`,
                        pageIndex: i - 1,
                        thumbnailUrl: canvas.toDataURL("image/png"),
                    });
                }
            }

            setPages(pagePreviews);
            setLoadingProgress(100);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to parse PDF document. It may be encrypted or corrupted."
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
            if (file) handlePdfUpload(file);
        },
        [handlePdfUpload]
    );

    const handleStampImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes("image/png") && !file.type.includes("image/jpeg")) {
            setErrorMessage("Stamp image must be a PNG or JPEG file.");
            return;
        }

        const isPng = file.type.includes("png");
        setStampImageType(isPng ? "png" : "jpg");
        setStampImageFile(file);

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setStampImageBytes(event.target.result as ArrayBuffer);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const clearWorkspace = () => {
        setPdfFile(null);
        setPdfBytes(null);
        setPages([]);
        setFileName("");
        setFileSize(0);
        setTotalPages(0);
        setErrorMessage(null);
        setLoadingProgress(0);
        setPreviewPageUrl(null);
    };

    // ─────────────────────────────────────────────────────────────
    // Helper Math & Color Parsing
    // ─────────────────────────────────────────────────────────────

    const hexToRgbColor = (hex: string) => {
        const cleanHex = hex.replace("#", "");
        const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
        const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
        const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
        return rgb(r, g, b);
    };

    const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
        if (!rangeStr.trim() || rangeStr.toLowerCase() === "all") {
            return Array.from({ length: maxPages }, (_, i) => i);
        }

        const indices = new Set<number>();
        const parts = rangeStr.split(",");

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes("-")) {
                const [start, end] = trimmed.split("-").map((n) => parseInt(n.trim(), 10));
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

    // ─────────────────────────────────────────────────────────────
    // Watermarking Core Engine (pdf-lib)
    // ─────────────────────────────────────────────────────────────

    const applyWatermarkAndDownload = async () => {
        if (!pdfBytes) return;

        if (watermarkType === "image" && !stampImageBytes) {
            setErrorMessage("Please upload a PNG or JPG stamp image first.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        try {
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const targetIndices = parsePageRange(applyToRange, pdfDoc.getPageCount());

            if (targetIndices.length === 0) {
                throw new Error("No valid pages selected for watermarking range.");
            }

            // Load Font for Text Watermark
            const embeddedFont = await pdfDoc.embedFont(fontFamily);

            // Embed Image for Stamp Watermark
            let embeddedImage: any = null;
            if (watermarkType === "image" && stampImageBytes) {
                embeddedImage =
                    stampImageType === "png"
                        ? await pdfDoc.embedPng(stampImageBytes)
                        : await pdfDoc.embedJpg(stampImageBytes);
            }

            for (const idx of targetIndices) {
                const page = pdfDoc.getPage(idx);
                const { width, height } = page.getSize();

                if (watermarkType === "text") {
                    const textWidth = embeddedFont.widthOfTextAtSize(text, fontSize);
                    const textHeight = embeddedFont.heightAtSize(fontSize);

                    if (position === "tile") {
                        // Grid Tiling Strategy
                        const stepX = textWidth + 100;
                        const stepY = textHeight + 100;

                        for (let x = 0; x < width + stepX; x += stepX) {
                            for (let y = 0; y < height + stepY; y += stepY) {
                                page.drawText(text, {
                                    x,
                                    y,
                                    size: fontSize,
                                    font: embeddedFont,
                                    color: hexToRgbColor(textColor),
                                    opacity: opacity,
                                    rotate: degrees(rotation),
                                });
                            }
                        }
                    } else {
                        // Coordinate Calculation for Fixed Positions
                        let posX = (width - textWidth) / 2;
                        let posY = (height - textHeight) / 2;

                        if (position === "top-left") {
                            posX = 40;
                            posY = height - textHeight - 40;
                        } else if (position === "top-right") {
                            posX = width - textWidth - 40;
                            posY = height - textHeight - 40;
                        } else if (position === "bottom-left") {
                            posX = 40;
                            posY = 40;
                        } else if (position === "bottom-right") {
                            posX = width - textWidth - 40;
                            posY = 40;
                        }

                        page.drawText(text, {
                            x: posX,
                            y: posY,
                            size: fontSize,
                            font: embeddedFont,
                            color: hexToRgbColor(textColor),
                            opacity: opacity,
                            rotate: degrees(rotation),
                        });
                    }
                } else if (watermarkType === "image" && embeddedImage) {
                    const imgDims = embeddedImage.scale(imageScale);

                    if (position === "tile") {
                        const stepX = imgDims.width + 80;
                        const stepY = imgDims.height + 80;

                        for (let x = 0; x < width + stepX; x += stepX) {
                            for (let y = 0; y < height + stepY; y += stepY) {
                                page.drawImage(embeddedImage, {
                                    x,
                                    y,
                                    width: imgDims.width,
                                    height: imgDims.height,
                                    opacity: opacity,
                                    rotate: degrees(rotation),
                                });
                            }
                        }
                    } else {
                        let posX = (width - imgDims.width) / 2;
                        let posY = (height - imgDims.height) / 2;

                        if (position === "top-left") {
                            posX = 40;
                            posY = height - imgDims.height - 40;
                        } else if (position === "top-right") {
                            posX = width - imgDims.width - 40;
                            posY = height - imgDims.height - 40;
                        } else if (position === "bottom-left") {
                            posX = 40;
                            posY = 40;
                        } else if (position === "bottom-right") {
                            posX = width - imgDims.width - 40;
                            posY = 40;
                        }

                        page.drawImage(embeddedImage, {
                            x: posX,
                            y: posY,
                            width: imgDims.width,
                            height: imgDims.height,
                            opacity: opacity,
                            rotate: degrees(rotation),
                        });
                    }
                }
            }

            const modifiedBytes = await pdfDoc.save();
            const blob = new Blob([modifiedBytes as any], { type: "application/pdf" });
            const downloadUrl = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileName
                ? `${fileName.replace(/\.pdf$/i, "")}_watermarked.pdf`
                : "watermarked_document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to apply watermark to PDF document."
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

    // ─────────────────────────────────────────────────────────────
    // Component Render
    // ─────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-8">

            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: INPUT & WATERMARK CONTROLS ══════════════════ */}
                <div className="space-y-5">
                    {/* File Upload Zone */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">1. Select Target PDF</h2>
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
                            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-6 px-4 text-center ${isDragging
                                ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
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
                                            {formatBytes(fileSize)} • {totalPages} Pages
                                        </p>
                                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                            Loaded & Ready
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
                                    <p className="text-[11px] text-slate-400">Maximum file size guardrail: 20 MB</p>
                                </>
                            )}
                        </div>

                        {isLoading && (
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-semibold text-slate-700">
                                    <span>Rendering PDF Pages...</span>
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

                    {/* Watermark Configuration Options */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Sliders className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-sm font-semibold text-slate-900">2. Custom Watermark Settings</h2>
                        </div>

                        {/* Mode Switcher */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setWatermarkType("text")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${watermarkType === "text"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <Type className="w-3.5 h-3.5" />
                                Text Watermark
                            </button>
                            <button
                                type="button"
                                onClick={() => setWatermarkType("image")}
                                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${watermarkType === "image"
                                    ? "bg-white text-indigo-600 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                Image / Logo Stamp
                            </button>
                        </div>

                        {/* TEXT WATERMARK CONTROLS */}
                        {watermarkType === "text" && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Watermark Text String</label>
                                    <input
                                        type="text"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="e.g. CONFIDENTIAL / DRAFT / APPROVED"
                                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">Font Size ({fontSize}px)</label>
                                        <input
                                            type="range"
                                            min={16}
                                            max={120}
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700">Color Overlay</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={textColor}
                                                onChange={(e) => setTextColor(e.target.value)}
                                                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                                            />
                                            <span className="text-xs font-mono text-slate-600 uppercase">{textColor}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Typography Font Family</label>
                                    <select
                                        value={fontFamily}
                                        onChange={(e) => setFontFamily(e.target.value as StandardFonts)}
                                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                    >
                                        <option value={StandardFonts.HelveticaBold}>Helvetica Bold (Standard)</option>
                                        <option value={StandardFonts.Helvetica}>Helvetica Regular</option>
                                        <option value={StandardFonts.TimesRomanBold}>Times New Roman Bold</option>
                                        <option value={StandardFonts.CourierBold}>Courier Monospace Bold</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* IMAGE WATERMARK CONTROLS */}
                        {watermarkType === "image" && (
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Upload Logo / Stamp (PNG or JPG)</label>
                                    <input
                                        ref={stampImageInputRef}
                                        type="file"
                                        accept="image/png, image/jpeg"
                                        onChange={handleStampImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => stampImageInputRef.current?.click()}
                                        className="w-full py-2.5 px-3 border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-all"
                                    >
                                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                                        {stampImageFile ? stampImageFile.name : "Select Stamp / Logo File"}
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Image Scale Factor ({Math.round(imageScale * 100)}%)
                                    </label>
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={1.0}
                                        step={0.05}
                                        value={imageScale}
                                        onChange={(e) => setImageScale(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* COMMON LAYOUT & POSITION CONTROLS */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Opacity Transparency ({Math.round(opacity * 100)}%)
                                    </label>
                                    <input
                                        type="range"
                                        min={0.05}
                                        max={1.0}
                                        step={0.05}
                                        value={opacity}
                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Rotation Angle ({rotation}°)
                                    </label>
                                    <input
                                        type="range"
                                        min={-90}
                                        max={90}
                                        step={5}
                                        value={rotation}
                                        onChange={(e) => setRotation(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Position & Layout Alignment</label>
                                <select
                                    value={position}
                                    onChange={(e) => setPosition(e.target.value as WatermarkPosition)}
                                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="center">Center Overlay</option>
                                    <option value="tile">Full Page Grid Tile (Pattern)</option>
                                    <option value="top-left">Top-Left Corner</option>
                                    <option value="top-right">Top-Right Corner</option>
                                    <option value="bottom-left">Bottom-Left Corner</option>
                                    <option value="bottom-right">Bottom-Right Corner</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Page Range Target</label>
                                <input
                                    type="text"
                                    value={applyToRange}
                                    onChange={(e) => setApplyToRange(e.target.value)}
                                    placeholder="e.g. all OR 1-3, 5"
                                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Type "all" to watermark entire PDF or enter specific ranges.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & PROCESS EXPORT ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <Grid className="w-4 h-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-slate-900">
                                    3. Document Page Thumbnails ({pages.length})
                                </h2>
                            </div>
                        </div>

                        {/* Page Thumbnails Display */}
                        {pages.length === 0 ? (
                            <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                <Stamp className="w-10 h-10 text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                    Upload a PDF document to preview pages and apply real-time watermarks.
                                </p>
                            </div>
                        ) : (
                            <div className="h-[320px] overflow-y-auto pr-1">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {pages.map((page) => (
                                        <div
                                            key={page.id}
                                            className="bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center shadow-sm relative group"
                                        >
                                            <div className="w-full flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    #{page.pageIndex + 1}
                                                </span>
                                            </div>
                                            <div
                                                className="w-full h-28 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative cursor-pointer border border-slate-200"
                                                onClick={() => setPreviewPageUrl(page.thumbnailUrl)}
                                            >
                                                <img
                                                    src={page.thumbnailUrl}
                                                    alt={`Page ${page.pageIndex + 1}`}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                                                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Export Summary & Action */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Watermark Format:</span>
                                <span className="font-semibold text-slate-800 uppercase">{watermarkType}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-600 font-medium">Layout Style:</span>
                                <span className="font-semibold text-slate-800 capitalize">{position}</span>
                            </div>
                            <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                                <span className="text-indigo-900 font-bold">Targeted Output Pages:</span>
                                <span className="font-mono font-bold text-indigo-600">
                                    {pdfBytes ? parsePageRange(applyToRange, totalPages).length : 0} of {totalPages}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={applyWatermarkAndDownload}
                            disabled={!pdfBytes || isProcessing}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${pdfBytes && !isProcessing
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Embedding Watermark & Saving PDF...</span>
                                </>
                            ) : (
                                <>
                                    <FileDown className="w-4 h-4" />
                                    <span>Download Watermarked PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── FULL-SCREEN PREVIEW MODAL ── */}
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
                            <span className="text-xs font-bold text-slate-800">Page Thumbnail Preview</span>
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
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-6 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Watermarking</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Digital document authentication requires modifying the underlying content stream of PDF page objects without corrupting existing graphics states, font dictionary subsets, or vector object references. ISO 32000 specifications define page content as compressed streams of operators, such as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">BT</code> (Begin Text) and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">ET</code> (End Text), operating within defined graphics matrices.
                        </p>
                        <p>
                            Our watermark engine utilizes <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> to inject vector text, custom logo rasters, or tiling patterns directly into the document's low-level byte structure. By appending drawing operators to target page content streams, the engine ensures that watermarks render as authentic PDF graphic layers rather than low-resolution flattened raster images.
                        </p>
                        <p>
                            Because processing runs entirely within WebAssembly and browser memory, confidential files stay 100% isolated on your device. The client-side approach eliminates network transmission latencies, rendering crisp, vector-sharp stamps and multi-page watermarks instantaneously.
                        </p>
                    </div>
                </div>

                {/* Card 2: Technical Comparison Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Table className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Watermark Method & Feature Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase">
                                    <th className="px-4 py-3.5 font-bold">Mode</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Formats</th>
                                    <th className="px-4 py-3.5 font-bold">Positioning Strategies</th>
                                    <th className="px-4 py-3.5 font-bold">Privacy Guarantee</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Custom Text String</td>
                                    <td className="px-4 py-3 font-mono text-xs">Standard Fonts (Helvetica, Times, Courier)</td>
                                    <td className="px-4 py-3">Center, Corners, Tiled Grid Pattern</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">100% In-Browser Memory</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Digital Logo / Stamp</td>
                                    <td className="px-4 py-3 font-mono text-xs">PNG (Alpha Transparency), JPG</td>
                                    <td className="px-4 py-3">Custom Scaled Overlay, Corner Align</td>
                                    <td className="px-4 py-3 font-semibold text-emerald-600">100% In-Browser Memory</td>
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
                        <span>How to Watermark PDF Files Online</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Target PDF",
                                body: "Drag and drop your PDF document into the upload container. The tool loads canvas page thumbnails instantly.",
                            },
                            {
                                step: "02",
                                title: "Configure Watermark or Stamp",
                                body: "Choose text or image stamp mode. Adjust opacity, text color, rotation angle, font size, and alignment options.",
                            },
                            {
                                step: "03",
                                title: "Set Page Range Rules",
                                body: "Select whether to apply the watermark pattern to all pages or specify range boundaries (e.g., 1-3, 5).",
                            },
                            {
                                step: "04",
                                title: "Process & Save PDF",
                                body: "Click download to compile the modified PDF binary directly in browser memory and save it to your local device.",
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

                {/* Card 4: Enterprise Privacy Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span>Client-Side Security & Data Privacy Guarantees</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero Remote Server Uploads",
                                body: "Your confidential PDF files remain inside browser RAM. Document content never gets transmitted over HTTP networks.",
                            },
                            {
                                title: "Support for Transparent PNG Stamps",
                                body: "Digital signature stamps and logos retain full opacity transparency layers without artifacts or background boxing.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Static FAQ Cards */}
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
                                q: "Is it possible to watermark specific pages instead of the whole PDF?",
                                a: "Yes! You can specify target page range strings, such as '1-3, 5', in the page range setting field to isolate specific pages.",
                            },
                            {
                                q: "Does watermarking degrade original PDF vector text quality?",
                                a: "No. The engine embeds watermarks directly into page stream dictionaries, keeping original text fonts vector-sharp.",
                            },
                            {
                                q: "Are transparent PNG digital stamps supported?",
                                a: "Yes, fully! PNG images with alpha channels embed smoothly as digital stamps over existing content.",
                            },
                            {
                                q: "Is my document uploaded to external servers?",
                                a: "No. All PDF operations run locally inside your web browser sandbox using pdf-lib.",
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
                        name: "Watermark PDF & Digital Stamp Tool",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Apply text watermarks, logo stamps, opacity overlays, and grid pattern tiles to PDF documents client-side with complete privacy.",
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
                                name: "Is my document uploaded to external servers?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All PDF watermarking processing runs locally inside your web browser sandbox using pdf-lib.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}