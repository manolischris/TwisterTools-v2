"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
    ScanText,
    UploadCloud,
    FileText,
    Copy,
    Check,
    Download,
    RotateCcw,
    Sliders,
    Sparkles,
    ShieldCheck,
    Cpu,
    Eye,
    Zap,
    Languages,
    HelpCircle,
    BookOpen,
    AlertTriangle,
    FileCheck2,
    ZoomIn,
    Layers,
    ListFilter
} from "lucide-react";

type LanguageCode = "eng" | "ell" | "spa" | "fra" | "deu" | "ita" | "por" | "chi_sim" | "jpn" | "rus" | "ara";

interface LanguageOption {
    code: LanguageCode;
    label: string;
    nativeLabel: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: "eng", label: "English", nativeLabel: "English" },
    { code: "ell", label: "Greek", nativeLabel: "Ελληνικά" },
    { code: "spa", label: "Spanish", nativeLabel: "Español" },
    { code: "fra", label: "French", nativeLabel: "Français" },
    { code: "deu", label: "German", nativeLabel: "Deutsch" },
    { code: "ita", label: "Italian", nativeLabel: "Italiano" },
    { code: "por", label: "Portuguese", nativeLabel: "Português" },
    { code: "chi_sim", label: "Chinese (Simplified)", nativeLabel: "简体中文" },
    { code: "jpn", label: "Japanese", nativeLabel: "日本語" },
    { code: "rus", label: "Russian", nativeLabel: "Русский" },
    { code: "ara", label: "Arabic", nativeLabel: "العربية" }
];

interface OcrStats {
    characterCount: number;
    wordCount: number;
    lineCount: number;
    confidence: number;
    processingTimeMs: number;
}

export default function ImageToTextOcr() {
    // Image & Processing States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<string>("");
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progressStatus, setProgressStatus] = useState<string>("");
    const [progressPercentage, setProgressPercentage] = useState<number>(0);
    const [extractedText, setExtractedText] = useState<string>("");

    // Engine Configurations
    const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("eng");
    const [autoBinarize, setAutoBinarize] = useState<boolean>(true);
    const [contrastBoost, setContrastBoost] = useState<number>(115);
    const [preserveFormatting, setPreserveFormatting] = useState<boolean>(true);
    const [stripLineBreaks, setStripLineBreaks] = useState<boolean>(false);

    // Extraction Analytics
    const [ocrStats, setOcrStats] = useState<OcrStats | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Dynamic stats computation for output text area
    const currentStats = useMemo(() => {
        const text = extractedText.trim();
        const chars = extractedText.length;
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        const lines = text ? text.split("\n").filter((l) => l.trim().length > 0).length : 0;
        return { chars, words, lines };
    }, [extractedText]);

    // Handle Drag & Drop Events
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileProcess = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Please upload a valid image file (PNG, JPG, WebP, BMP, or TIFF).");
            return;
        }

        setErrorMessage(null);
        setFileName(file.name);
        setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setSelectedImage(dataUrl);
            setExtractedText("");
            setOcrStats(null);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileProcess(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileProcess(e.target.files[0]);
        }
    };

    // Preprocessing on canvas (Grayscale, Threshold Binarization, Contrast Boost)
    const preprocessImage = useCallback(async (sourceUrl: string): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = sourceUrl;
            img.onload = () => {
                const canvas = canvasRef.current || document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(sourceUrl);
                    return;
                }

                // Draw Base Image
                ctx.drawImage(img, 0, 0);

                if (!autoBinarize && contrastBoost === 100) {
                    resolve(canvas.toDataURL("image/png"));
                    return;
                }

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const d = imgData.data;
                const contrastFactor = (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost));

                for (let i = 0; i < d.length; i += 4) {
                    // Grayscale conversion using luminance coefficients
                    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

                    // Contrast Adjustment
                    let contrasted = contrastFactor * (gray - 128) + 128;
                    contrasted = Math.max(0, Math.min(255, contrasted));

                    if (autoBinarize) {
                        // Adaptive thresholding approximation
                        const threshold = 135;
                        const bin = contrasted > threshold ? 255 : 0;
                        d[i] = bin;
                        d[i + 1] = bin;
                        d[i + 2] = bin;
                    } else {
                        d[i] = contrasted;
                        d[i + 1] = contrasted;
                        d[i + 2] = contrasted;
                    }
                }

                ctx.putImageData(imgData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => resolve(sourceUrl);
        });
    }, [autoBinarize, contrastBoost]);

    // Primary Execution Function Using Tesseract.js Worker
    const executeOcr = async () => {
        if (!selectedImage) return;

        setIsProcessing(true);
        setProgressStatus("Initializing Neural Optical Engine...");
        setProgressPercentage(10);
        setErrorMessage(null);
        const startTime = performance.now();

        try {
            setProgressStatus("Enhancing document contrast & clarity...");
            setProgressPercentage(25);
            const processedImageData = await preprocessImage(selectedImage);

            setProgressStatus("Loading language dictionary & models...");
            setProgressPercentage(40);

            // Dynamically import tesseract.js client-side
            const { createWorker } = await import("tesseract.js");
            const worker = await createWorker(selectedLanguage, 1, {
                logger: (m) => {
                    if (m.status === "recognizing text") {
                        setProgressStatus(`Extracting text patterns...`);
                        setProgressPercentage(Math.round(40 + (m.progress || 0) * 55));
                    }
                }
            });

            setProgressStatus("Synthesizing characters & paragraphs...");
            const { data } = await worker.recognize(processedImageData);

            let resultText = data.text;
            if (stripLineBreaks) {
                resultText = resultText.replace(/(\r\n|\n|\r)/gm, " ");
            }

            setExtractedText(resultText);

            const duration = Math.round(performance.now() - startTime);
            setOcrStats({
                characterCount: resultText.length,
                wordCount: resultText.trim().split(/\s+/).filter(Boolean).length,
                lineCount: resultText.trim().split("\n").filter((l) => l.trim().length > 0).length,
                confidence: Math.round(data.confidence),
                processingTimeMs: duration
            });

            setProgressPercentage(100);
            setProgressStatus("Recognition complete!");
            await worker.terminate();
        } catch (err: any) {
            console.error("OCR Extraction Error:", err);
            setErrorMessage("Recognition failed: " + (err?.message || "Ensure the image contains legible text."));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCopy = () => {
        if (!extractedText) return;
        navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadTxt = () => {
        if (!extractedText) return;
        const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName ? fileName.replace(/\.[^/.]+$/, "") : "ocr-extracted"}-text.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setSelectedImage(null);
        setFileName("");
        setFileSize("");
        setExtractedText("");
        setOcrStats(null);
        setErrorMessage(null);
        setProgressPercentage(0);
        setProgressStatus("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const loadSampleReceipt = () => {
        // High contrast sample SVG generated into data url
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420" fill="#ffffff">
            <rect width="600" height="420" fill="#ffffff"/>
            <text x="40" y="55" font-family="monospace" font-weight="bold" font-size="20" fill="#000000">COMMERCIAL TAX INVOICE #8921</text>
            <text x="40" y="85" font-family="monospace" font-size="14" fill="#333333">Client: Global Logistics Partners LLC</text>
            <text x="40" y="110" font-family="monospace" font-size="14" fill="#333333">Date: October 14, 2026</text>
            <text x="40" y="145" font-family="monospace" font-weight="bold" font-size="15" fill="#000000">------------------------------------------------</text>
            <text x="40" y="175" font-family="monospace" font-size="14" fill="#000000">Line Item 1: Cloud Orchestration Cluster     $1,420.00</text>
            <text x="40" y="205" font-family="monospace" font-size="14" fill="#000000">Line Item 2: Optical Pipeline Neural Rig      $850.00</text>
            <text x="40" y="235" font-family="monospace" font-size="14" fill="#000000">Line Item 3: Managed Secure Storage (2TB)     $180.00</text>
            <text x="40" y="270" font-family="monospace" font-weight="bold" font-size="15" fill="#000000">------------------------------------------------</text>
            <text x="40" y="300" font-family="monospace" font-weight="bold" font-size="16" fill="#000000">SUBTOTAL:                                   $2,450.00</text>
            <text x="40" y="330" font-family="monospace" font-size="14" fill="#333333">Estimated State Tax (8.25%):                  $202.12</text>
            <text x="40" y="365" font-family="monospace" font-weight="bold" font-size="18" fill="#000000">TOTAL DUE NET 30:                           $2,652.12</text>
            <text x="40" y="395" font-family="monospace" font-size="11" fill="#666666">Authentication Token: 4F91-C8A2-990B-LOCAL-BROWSER</text>
        </svg>
        `;
        const encoded = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        setSelectedImage(encoded);
        setFileName("sample-invoice-document.png");
        setFileSize("0.12 MB");
        setExtractedText("");
        setOcrStats(null);
        setErrorMessage(null);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Optical Character Recognition (OCR) Image to Text Extractor",
        "url": "https://twistertools.com/tools/image-tools/image-to-text-ocr",
        "description": "Extract text from scanned images, screenshots, invoices, documents, and receipts instantly in your browser using secure client-side OCR. No data uploads.",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Are my images or private documents uploaded to an external server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire Optical Character Recognition engine runs natively in your browser using WebAssembly and Web Workers. Your documents, photos, invoices, and sensitive receipts never leave your computer or transmit across any third-party network."
                }
            },
            {
                "@type": "Question",
                "name": "How can I improve character recognition accuracy on difficult images?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Ensure high resolution (at least 300 DPI for scanned documents), adequate lighting without glare, and keep text horizontal. Activating the Auto Binarization toggle converts low-contrast color backgrounds into sharp monochrome, significantly helping the neural recognition algorithm detect letter boundaries."
                }
            },
            {
                "@type": "Question",
                "name": "Which image formats are supported by the OCR tool?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The tool accepts PNG, JPG, JPEG, WebP, SVG, BMP, and uncompressed TIFF images. Scanned PDFs can be extracted by converting the respective PDF pages to high-resolution PNGs before uploading."
                }
            },
            {
                "@type": "Question",
                "name": "Can this tool read handwriting or cursive script?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The primary model is optimized for printed, typed, and digital fonts. While it can detect neat block-letter handwriting, freeform cursive script or physician notes will have reduced confidence scores compared to standard mechanical typography."
                }
            },
            {
                "@type": "Question",
                "name": "Why is the first OCR extraction taking a few seconds to load?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "On your initial run, your browser automatically caches the lightweight WebAssembly optical models and language trained dictionaries locally. Subsequent extractions run significantly faster without needing to re-fetch model weights."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* SEO Structured Data */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Hidden Canvas for High-Performance Canvas Image Preprocessing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 50/50 Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Image Upload, Settings, and Preprocessing */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Title Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <ScanText className="w-5 h-5 text-indigo-600" />
                                Source Document & Preprocessing
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={loadSampleReceipt}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                                >
                                    Try Sample
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {/* Drag and Drop Zone / Image Display */}
                        {!selectedImage ? (
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3 transition cursor-pointer min-h-[260px] ${isDragging
                                        ? "border-indigo-600 bg-indigo-50/60"
                                        : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                                    <UploadCloud className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        Drop your image here, or <span className="text-indigo-600 underline">browse files</span>
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Supports PNG, JPG, WebP, SVG, TIFF, BMP (Max 25MB)
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    100% Client-Side • Local Memory Sandbox
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                                    <img
                                        src={selectedImage}
                                        alt="Document preview"
                                        className="w-full h-64 object-contain mx-auto bg-slate-950/60"
                                    />
                                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-white text-xs font-mono flex items-center gap-2">
                                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                        <span className="truncate max-w-[180px]">{fileName}</span>
                                        <span className="text-slate-400">({fileSize})</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
                                    >
                                        Replace Image
                                    </button>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Language Selection & Engine Config */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Languages className="w-4 h-4 text-indigo-600" />
                                    Recognition Language
                                </label>
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.label} ({lang.nativeLabel})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                    Text Pre-Filter Contrast
                                </label>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                                    <input
                                        type="range"
                                        min="50"
                                        max="180"
                                        value={contrastBoost}
                                        onChange={(e) => setContrastBoost(Number(e.target.value))}
                                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right">
                                        {contrastBoost}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Preprocessing Toggles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    checked={autoBinarize}
                                    onChange={(e) => setAutoBinarize(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <div className="text-xs">
                                    <p className="font-bold text-slate-800">Adaptive Binarization</p>
                                    <p className="text-slate-500 text-[11px]">Monochrome threshold filtering</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
                                <input
                                    type="checkbox"
                                    checked={stripLineBreaks}
                                    onChange={(e) => setStripLineBreaks(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <div className="text-xs">
                                    <p className="font-bold text-slate-800">Merge Paragraph Breaks</p>
                                    <p className="text-slate-500 text-[11px]">Unify text into single flow</p>
                                </div>
                            </label>
                        </div>

                        {/* Error Alert Display */}
                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Progress Display Bar */}
                        {isProcessing && (
                            <div className="space-y-2 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                                <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                                    <span className="flex items-center gap-1.5">
                                        <Cpu className="w-4 h-4 animate-spin text-indigo-600" />
                                        {progressStatus}
                                    </span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-indigo-200/80 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Execution Button */}
                    <div className="pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            disabled={!selectedImage || isProcessing}
                            onClick={executeOcr}
                            className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${!selectedImage || isProcessing
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300"
                                }`}
                        >
                            <Zap className="w-4 h-4 fill-current" />
                            {isProcessing ? "Processing Document Patterns..." : "Extract Text with OCR"}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Extracted OCR Text, Analytics, & Export Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                                Extracted OCR Results
                            </h2>
                            {ocrStats && (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    {ocrStats.confidence}% Confidence
                                </span>
                            )}
                        </div>

                        {/* Extracted Text Area */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Raw Text Output
                                </span>
                                <div className="text-[11px] font-mono text-slate-500 space-x-2">
                                    <span>{currentStats.chars} characters</span>
                                    <span>•</span>
                                    <span>{currentStats.words} words</span>
                                    <span>•</span>
                                    <span>{currentStats.lines} lines</span>
                                </div>
                            </div>
                            <textarea
                                value={extractedText}
                                onChange={(e) => setExtractedText(e.target.value)}
                                placeholder="Extracted text will appear here once the OCR analysis executes. You can also paste, edit, or format the text directly in this area..."
                                rows={13}
                                className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 font-mono text-xs sm:text-sm text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none min-w-0"
                            />
                        </div>

                        {/* Analytic Stats Matrix */}
                        {ocrStats ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Speed</p>
                                    <p className="text-sm font-black text-slate-900 font-mono">
                                        {(ocrStats.processingTimeMs / 1000).toFixed(2)}s
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Words</p>
                                    <p className="text-sm font-black text-indigo-600 font-mono">
                                        {ocrStats.wordCount}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Chars</p>
                                    <p className="text-sm font-black text-slate-900 font-mono">
                                        {ocrStats.characterCount}
                                    </p>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Engine Score</p>
                                    <p className="text-sm font-black text-emerald-600 font-mono">
                                        {ocrStats.confidence}%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-600">
                                <Eye className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                <span>
                                    No extraction completed yet. Select or drop an image and click <strong>Extract Text with OCR</strong> to trigger client-side optical character decoding.
                                </span>
                            </div>
                        )}

                        {/* Privacy & Zero Server Transmit Guarantee Banner */}
                        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                <strong>Complete Client Privacy:</strong> No images or transcripts are transmitted over HTTP/S. The WebAssembly model processes pixel tensors directly inside your browser cache.
                            </p>
                        </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            type="button"
                            disabled={!extractedText}
                            onClick={handleCopy}
                            className={`flex-1 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${!extractedText
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                }`}
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : "Copy Extracted Text"}
                        </button>
                        <button
                            type="button"
                            disabled={!extractedText}
                            onClick={handleDownloadTxt}
                            className={`flex-1 w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${!extractedText
                                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs"
                                }`}
                        >
                            <Download className="w-4 h-4 text-indigo-600" />
                            Download Plain Text (.txt)
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Master OCR Format Compatibility & Recognition Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Document Class Matrix & Recognition Optimization Guide
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Optical Character Recognition performance depends on baseline image resolution, contrast ratios, and structural layout. Use this guide to optimize recognition fidelity across various media types:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Document Category</th>
                                    <th className="p-3">Target DPI / Res</th>
                                    <th className="p-3">Recommended Filter</th>
                                    <th className="p-3">Typical Accuracy</th>
                                    <th className="p-3">Key Preprocessing Strategy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Financial Invoices & Receipts</td>
                                    <td className="p-3 font-mono text-slate-600">300 DPI (1080p+)</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Adaptive Binarization</td>
                                    <td className="p-3 font-bold text-emerald-600">98% – 99.5%</td>
                                    <td className="p-3 text-xs">Eliminates receipt thermal paper creases and watermarks.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Book Pages & Printed Novels</td>
                                    <td className="p-3 font-mono text-slate-600">400 DPI</td>
                                    <td className="p-3 text-indigo-600 font-semibold">120% Contrast Boost</td>
                                    <td className="p-3 font-bold text-emerald-600">97% – 99%</td>
                                    <td className="p-3 text-xs">Flattens gutter curvature; preserves standard paragraph indentation.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Software UI Screenshots</td>
                                    <td className="p-3 font-mono text-slate-600">Native 72–144 DPI</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Standard RGB (No Filter)</td>
                                    <td className="p-3 font-bold text-emerald-600">99% – 100%</td>
                                    <td className="p-3 text-xs">Digital native raster rendering requires no thresholding.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">ID Cards & Passports</td>
                                    <td className="p-3 font-mono text-slate-600">600 DPI</td>
                                    <td className="p-3 text-indigo-600 font-semibold">High Contrast Monochrome</td>
                                    <td className="p-3 font-bold text-amber-600">92% – 96%</td>
                                    <td className="p-3 text-xs">Strips holographic anti-counterfeit foils and security micro-patterns.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Handwritten Notes (Block Text)</td>
                                    <td className="p-3 font-mono text-slate-600">300+ DPI</td>
                                    <td className="p-3 text-indigo-600 font-semibold">Adaptive Binarization</td>
                                    <td className="p-3 font-bold text-amber-600">80% – 88%</td>
                                    <td className="p-3 text-xs">Separates dark ink strokes from paper grain and lined backgrounds.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Neural Recognition Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Under the Hood: Client-Side WebAssembly OCR Architecture
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Traditional OCR utilities upload your sensitive scans to cloud servers, exposing internal company documents and invoices to remote storage risks. TwisterTools implements an in-browser WebAssembly neural pipeline:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Sliders className="w-4 h-4 text-indigo-600" /> 1. Canvas Pre-Filtering
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The HTML5 Canvas API extracts raw pixel buffers, executing per-pixel luminance conversions to eliminate colored backgrounds, shadows, and low-contrast artifacts before neural parsing.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Cpu className="w-4 h-4 text-indigo-600" /> 2. LSTM Neural Networks
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                A Long Short-Term Memory (LSTM) recurrent neural network evaluates character sequences, baseline word alignments, and font geometries to predict multi-language vocabulary tokens.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> 3. Sandboxed Privacy
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Web Workers isolate heavy execution from your main browser thread. Data structures are flushed from temporary RAM when the browser tab closes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Best Practices for 100% OCR Accuracy */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            How to Achieve Maximum OCR Recognition Accuracy
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To eliminate typographical errors and hallucinated symbols when converting scans into digital strings, observe these capture standards:
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Zero Skew & Horizontal Orientation</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Keep the baseline text angle within ±3 degrees of true horizontal. Rotated or perspective-warped images force the neural scanner to misinterpret letter ascenders and descenders.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Even Lighting Without Flash Glare</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Direct camera flashes produce specular reflection hot spots that wash out character strokes. Use diffused, ambient illumination to maintain consistent glyph edge contrast.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">High Character Resolution</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Lowercase characters such as 'e', 'a', and 'o' require at least 20 to 30 vertical pixels to differentiate enclosed loops from solid punctuation marks.
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Match Target Language Model</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Accented characters (e.g., é, ü, ç, ñ) require selecting the corresponding language dictionary to avoid being parsed as random punctuation or erroneous symbols.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my images or private documents uploaded to an external server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire Optical Character Recognition engine runs natively in your browser using WebAssembly and Web Workers. Your documents, photos, invoices, and sensitive receipts never leave your computer or transmit across any third-party network.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How can I improve character recognition accuracy on difficult images?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Ensure high resolution (at least 300 DPI for scanned documents), adequate lighting without glare, and keep text horizontal. Activating the Auto Binarization toggle converts low-contrast color backgrounds into sharp monochrome, significantly helping the neural recognition algorithm detect letter boundaries.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Which image formats are supported by the OCR tool?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The tool accepts PNG, JPG, JPEG, WebP, SVG, BMP, and uncompressed TIFF images. Scanned PDFs can be extracted by converting the respective PDF pages to high-resolution PNGs before uploading.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can this tool read handwriting or cursive script?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The primary model is optimized for printed, typed, and digital fonts. While it can detect neat block-letter handwriting, freeform cursive script or physician notes will have reduced confidence scores compared to standard mechanical typography.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is the first OCR extraction taking a few seconds to load?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                On your initial run, your browser automatically caches the lightweight WebAssembly optical models and language trained dictionaries locally. Subsequent extractions run significantly faster without needing to re-fetch model weights.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}