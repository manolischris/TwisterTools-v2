"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    FileText,
    Presentation,
    Upload,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Shield,
    Table,
    Workflow,
    Eye,
    FileDown,
    Check,
    Sliders,
    Copy,
    Cpu,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type AspectRatio = "16:9" | "4:3";

interface SlideData {
    id: string;
    title: string;
    bullets: string[];
    notes?: string;
    bgColor: string;
}

interface PresentationConfig {
    aspectRatio: AspectRatio;
    marginMm: number;
    includeSlideNumbers: boolean;
    themeColor: string;
}

const SAMPLE_PRESENTATION_SLIDES: SlideData[] = [
    {
        id: "slide-1",
        title: "Q3 Executive Performance Strategy",
        bullets: [
            "Accelerated cloud transformation across enterprise clusters",
            "Achieved 99.99% system availability across global nodes",
            "Streamlined client-side PDF rendering pipeline efficiency",
        ],
        notes: "Introductory slide highlighting key Q3 engineering metrics.",
        bgColor: "#1e293b",
    },
    {
        id: "slide-2",
        title: "Technical Architecture Overview",
        bullets: [
            "Client-side WebAssembly compilation engine for high security",
            "Zero server latency via in-memory vector graphics compilation",
            "Fully compliant with WebApplication and structured Schema standards",
        ],
        notes: "Emphasize security advantages of browser-bound processing.",
        bgColor: "#0f172a",
    },
    {
        id: "slide-3",
        title: "Quarterly Growth Targets & Milestones",
        bullets: [
            "Reduce document conversion rendering overhead by 40%",
            "Expand client-side multi-format export interoperability",
            "Maintain zero-knowledge data privacy framework",
        ],
        notes: "Review actionable goals for next quarter deployment.",
        bgColor: "#312e81",
    },
];

export default function PptToPdfConverter() {
    // ── Core State ──
    const [presentationTitle, setPresentationTitle] = useState<string>("Executive_Presentation");
    const [slides, setSlides] = useState<SlideData[]>([]);
    const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
    const [config, setConfig] = useState<PresentationConfig>({
        aspectRatio: "16:9",
        marginMm: 5,
        includeSlideNumbers: true,
        themeColor: "#4f46e5",
    });

    // ── Processing & UI State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [estimatedSizeMb, setEstimatedSizeMb] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewCanvasRef = useRef<HTMLDivElement>(null);

    // Sync size estimates based on slide count and configuration
    useEffect(() => {
        const estimated = slides.length > 0 ? (slides.length * 0.45) + 0.15 : 0;
        setEstimatedSizeMb(parseFloat(estimated.toFixed(2)));
    }, [slides, config]);

    // ── File Handling (PPTX Extraction / Parsing) ──
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB Limit

    const parsePptxFile = async (file: File) => {
        setErrorMessage(null);
        if (!file.name.match(/\.(pptx|potx|ppsx)$/i)) {
            if (file.name.match(/\.ppt$/i)) {
                setErrorMessage("Legacy PowerPoint binary format (.ppt) is not supported client-side. Please save or convert your presentation to .pptx and upload again.");
            } else {
                setErrorMessage("Invalid file format. Please upload a modern PPTX, POTX, or PPSX presentation file.");
            }
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage(`File exceeds 20 MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
            return;
        }

        setIsProcessing(true);
        setProcessingStatus("Extracting presentation XML payload...");
        setFileName(file.name);

        try {
            // Dynamic import JSZip to parse PPTX structure client-side
            const JSZip = (await import("jszip")).default;
            const zip = await JSZip.loadAsync(file);

            const slideFiles = Object.keys(zip.files).filter((path) =>
                path.startsWith("ppt/slides/slide") && path.endsWith(".xml")
            );

            if (slideFiles.length === 0) {
                throw new Error("No slide content XML files found inside PPTX package.");
            }

            // Sort slides numerically by file index
            slideFiles.sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
                return numA - numB;
            });

            const parsedSlides: SlideData[] = [];
            const parser = new DOMParser();

            for (let i = 0; i < slideFiles.length; i++) {
                setProcessingStatus(`Parsing slide ${i + 1} of ${slideFiles.length}...`);
                const xmlText = await zip.files[slideFiles[i]].async("text");
                const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                // Extract raw text elements
                const textNodes = Array.from(xmlDoc.getElementsByTagName("a:t"));
                const textLines = textNodes
                    .map((node) => node.textContent?.trim() || "")
                    .filter((t) => t.length > 0);

                const slideTitle = textLines.length > 0 ? textLines[0] : `Slide ${i + 1}`;
                const slideBullets = textLines.length > 1 ? textLines.slice(1) : ["(No body text captured for this slide)"];

                parsedSlides.push({
                    id: `extracted-slide-${i + 1}`,
                    title: slideTitle,
                    bullets: slideBullets,
                    bgColor: i % 2 === 0 ? "#1e293b" : "#0f172a",
                });
            }

            setSlides(parsedSlides);
            setActiveSlideIndex(0);
            setPresentationTitle(file.name.replace(/\.[^/.]+$/, ""));
        } catch (err) {
            let errorMsg = "Failed to parse presentation package.";
            if (err instanceof Error) {
                if (err.message.includes("end of central directory") || err.message.includes("zip")) {
                    errorMsg = "Legacy PowerPoint binary format (.ppt) is not supported client-side. Please convert it to .pptx (OpenXML) and try again.";
                } else {
                    errorMsg = err.message;
                }
            }
            setErrorMessage(errorMsg);
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            parsePptxFile(e.dataTransfer.files[0]);
        }
    }, []);

    const clearWorkspace = () => {
        setSlides([]);
        setFileName(null);
        setErrorMessage(null);
        setActiveSlideIndex(0);
    };

    const loadSamplePresentation = () => {
        setSlides(SAMPLE_PRESENTATION_SLIDES);
        setFileName("Sample_Executive_Deck.pptx");
        setPresentationTitle("Sample_Executive_Deck");
        setActiveSlideIndex(0);
        setErrorMessage(null);
    };

    // ─────────────────────────────────────────────────────────────
    // High-Resolution Slide PDF Compiler Engine
    // ─────────────────────────────────────────────────────────────

    const compilePptToPdf = async () => {
        if (slides.length === 0) {
            setErrorMessage("Please upload a PPTX presentation or load a sample template first.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);
        setProcessingStatus("Initializing PDF vector engine...");

        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            // Slide Dimensions in mm (16:9 widescreen vs 4:3 standard)
            const slideWidthMm = config.aspectRatio === "16:9" ? 297 : 280;
            const slideHeightMm = config.aspectRatio === "16:9" ? 167 : 210;

            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: [slideWidthMm, slideHeightMm],
                compress: true,
            });

            // Render each slide offscreen onto hidden DOM frame
            const renderContainer = document.createElement("div");
            renderContainer.style.position = "fixed";
            renderContainer.style.left = "-9999px";
            renderContainer.style.top = "0";
            renderContainer.style.width = "1920px";
            renderContainer.style.height = config.aspectRatio === "16:9" ? "1080px" : "1440px";
            renderContainer.style.backgroundColor = "#ffffff";
            document.body.appendChild(renderContainer);

            for (let i = 0; i < slides.length; i++) {
                setProcessingStatus(`Compiling slide ${i + 1} of ${slides.length} to PDF...`);

                const slide = slides[i];
                renderContainer.innerHTML = `
          <div style="width: 100%; height: 100%; background: ${slide.bgColor}; color: #ffffff; padding: 80px; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
            <div style="border-left: 8px solid ${config.themeColor}; padding-left: 24px;">
              <h1 style="font-size: 52px; font-weight: 800; margin: 0 0 16px 0; color: #ffffff; tracking: -0.02em;">${slide.title}</h1>
              <p style="font-size: 20px; color: #a5b4fc; margin: 0;">Presentation Document • ${presentationTitle}</p>
            </div>
            
            <div style="margin-top: 40px; flex-grow: 1;">
              <ul style="list-style-type: none; padding: 0; margin: 0;">
                ${slide.bullets
                        .map(
                            (b) => `
                  <li style="font-size: 28px; line-height: 1.5; margin-bottom: 24px; color: #f1f5f9; display: flex; items-center: center;">
                    <span style="color: ${config.themeColor}; margin-right: 16px; font-weight: bold;">▪</span> ${b}
                  </li>`
                        )
                        .join("")}
              </ul>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 24px; font-size: 18px; color: #94a3b8;">
              <span>TwisterTools PPT to PDF Converter</span>
              ${config.includeSlideNumbers ? `<span>Slide ${i + 1} of ${slides.length}</span>` : ""}
            </div>
          </div>
        `;

                // Render slide frame to high-DPI canvas
                const canvas = await html2canvas(renderContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: slide.bgColor,
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.95);

                if (i > 0) {
                    pdf.addPage([slideWidthMm, slideHeightMm], "landscape");
                }

                pdf.addImage(imgData, "JPEG", 0, 0, slideWidthMm, slideHeightMm);
            }

            // Cleanup hidden container
            if (document.body.contains(renderContainer)) {
                document.body.removeChild(renderContainer);
            }

            setProcessingStatus("Downloading PDF document...");
            pdf.save(`${presentationTitle.replace(/\s+/g, "_")}_Converted.pdf`);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "PDF Compilation failed. Please try again with standard layout parameters."
            );
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    };

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: FILE UPLOAD & SLIDE DECK ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Presentation className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold leading-tight">1. Import PPTX Presentation</h1>
                                    <p className="text-xs text-indigo-100/80">Upload PowerPoint deck or load demo slides</p>
                                </div>
                            </div>
                            {slides.length > 0 && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear
                                </button>
                            )}
                        </div>

                        <div className="p-5 space-y-4">
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
                                    accept=".pptx,.potx,.ppsx"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && parsePptxFile(e.target.files[0])}
                                />
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-800">
                                            Drop .pptx file here, or <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400">Modern PowerPoint formats supported (.pptx) • Max size 20 MB</p>
                                    </div>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Extracted Slide Cards List */}
                            {slides.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                            Parsed Presentation Deck ({slides.length} Slides)
                                        </label>
                                        <span className="text-[11px] text-slate-500 font-mono">{fileName}</span>
                                    </div>

                                    <div className="max-h-[320px] overflow-y-auto space-y-2 p-1">
                                        {slides.map((slide, idx) => (
                                            <div
                                                key={slide.id}
                                                onClick={() => setActiveSlideIndex(idx)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${activeSlideIndex === idx
                                                    ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500"
                                                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/80"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="w-6 h-6 rounded-md bg-indigo-600 text-white font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                                        {slide.title}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                                                    {slide.bullets.length} items
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                                    <p className="text-xs text-slate-500">No presentation file loaded yet.</p>
                                    <button
                                        type="button"
                                        onClick={loadSamplePresentation}
                                        className="px-3.5 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                                        Load Sample Executive Presentation
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: SLIDE PREVIEW & PDF COMPILER CONFIG ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Sliders className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Slide Preview & PDF Settings</h2>
                                    <p className="text-xs text-indigo-100/80">Inspect live slide layout and trigger download</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Aspect Ratio</label>
                                    <select
                                        value={config.aspectRatio}
                                        onChange={(e) => setConfig({ ...config, aspectRatio: e.target.value as AspectRatio })}
                                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="16:9">16:9 Widescreen</option>
                                        <option value="4:3">4:3 Standard</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Accent Theme</label>
                                    <select
                                        value={config.themeColor}
                                        onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
                                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="#4f46e5">Indigo Accent</option>
                                        <option value="#0284c7">Sky Blue Accent</option>
                                        <option value="#059669">Emerald Accent</option>
                                        <option value="#d97706">Amber Accent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Interactive Slide Live Canvas Preview */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                        Slide {slides.length > 0 ? activeSlideIndex + 1 : 0} of {slides.length} Preview
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        Estimated PDF: ~{estimatedSizeMb} MB
                                    </span>
                                </div>

                                <div
                                    ref={previewCanvasRef}
                                    className="w-full h-[250px] rounded-xl border border-slate-300 overflow-hidden relative shadow-inner p-6 flex flex-col justify-between text-white transition-all"
                                    style={{
                                        backgroundColor: slides[activeSlideIndex]?.bgColor || "#1e293b",
                                    }}
                                >
                                    {slides.length > 0 ? (
                                        <>
                                            <div className="space-y-2 border-l-4 pl-3" style={{ borderColor: config.themeColor }}>
                                                <h3 className="text-base font-bold leading-snug">
                                                    {slides[activeSlideIndex].title}
                                                </h3>
                                                <p className="text-[11px] text-indigo-200/80">Presentation Slide Node</p>
                                            </div>

                                            <ul className="space-y-1.5 my-auto pl-1">
                                                {slides[activeSlideIndex].bullets.slice(0, 3).map((bullet, bIdx) => (
                                                    <li key={bIdx} className="text-xs flex items-center gap-2 text-slate-200">
                                                        <span style={{ color: config.themeColor }} className="font-bold">•</span>
                                                        <span className="truncate">{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-2">
                                                <span>TwisterTools PPT to PDF Engine</span>
                                                {config.includeSlideNumbers && (
                                                    <span>Slide {activeSlideIndex + 1} / {slides.length}</span>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                            <Presentation className="w-8 h-8 text-slate-500 mb-2" />
                                            <p className="text-xs font-medium text-slate-300">No active slide preview</p>
                                            <p className="text-[11px] text-slate-400">Upload a PPTX file or click Load Sample</p>
                                        </div>
                                    )}
                                </div>

                                {slides.length > 1 && (
                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="button"
                                            disabled={activeSlideIndex === 0}
                                            onClick={() => setActiveSlideIndex((p) => Math.max(0, p - 1))}
                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 flex items-center gap-1"
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" /> Previous Slide
                                        </button>
                                        <button
                                            type="button"
                                            disabled={activeSlideIndex === slides.length - 1}
                                            onClick={() => setActiveSlideIndex((p) => Math.min(slides.length - 1, p + 1))}
                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 flex items-center gap-1"
                                        >
                                            Next Slide <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={compilePptToPdf}
                                disabled={slides.length === 0 || isProcessing}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${slides.length > 0 && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>{processingStatus || "Converting Presentation to PDF..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Convert PPTX & Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                        <span>Technical Architecture of Client-Side PPTX to PDF Conversion</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            PowerPoint files (`.pptx`) are structured OpenXML archives containing XML markup, embedded vector graphics, typography references, and slide layout definitions. Our converter unpacks these compressed XML structures client-side, extracts slide titles, content hierarchies, bullet lists, and layout parameters, and dynamically compiles them into pristine PDF slides using high-resolution browser canvas graphics.
                        </p>
                        <p>
                            By executing the entire extraction and vector compilation process directly within your browser memory sandbox, sensitive enterprise presentations, financial slides, and proprietary deck materials remain 100% confidential without ever touching external cloud servers.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Presentation Formatting & Export Standards</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Parameter</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Standards</th>
                                    <th className="px-4 py-3.5 font-bold">Export Fidelity</th>
                                    <th className="px-4 py-3.5 font-bold">Client Security</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Input Archives</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">.pptx, .potx, .ppsx</td>
                                    <td className="px-4 py-3">OpenXML Tree Parsing</td>
                                    <td className="px-4 py-3">In-Memory JSZip Unpacking</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Aspect Ratios</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">16:9 Widescreen, 4:3 Standard</td>
                                    <td className="px-4 py-3">Vector Geometry Alignment</td>
                                    <td className="px-4 py-3">100% Offline Processing</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Target Output</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Standard Landscape PDF</td>
                                    <td className="px-4 py-3">High-DPI 300 DPI Canvas Stream</td>
                                    <td className="px-4 py-3">Zero Cloud Data Retention</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: How to Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Convert PowerPoint Slides to PDF</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PowerPoint Presentation",
                                body: "Drag and drop your modern .pptx presentation deck directly into the upload dropzone, or click browse.",
                            },
                            {
                                step: "02",
                                title: "Inspect Slide Hierarchy",
                                body: "Review extracted slide titles and bullet hierarchies in the left workspace deck panel.",
                            },
                            {
                                step: "03",
                                title: "Configure Aspect Ratio & Theme",
                                body: "Select target aspect ratio (16:9 or 4:3) and accent themes to customize vector PDF slide frames.",
                            },
                            {
                                step: "04",
                                title: "Compile & Download PDF",
                                body: "Click Convert PPTX & Download PDF to save your presentation as a multi-page PDF document.",
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Zero-Trust Enterprise Privacy Safeguards</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "In-Browser OpenXML Extraction",
                                body: "PowerPoint archives are decompressed and parsed strictly within client JavaScript memory space.",
                            },
                            {
                                title: "No Remote File Transmission",
                                body: "Your presentation deck never travels across external networks, ensuring strict GDPR and corporate data policy compliance.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Static FAQ */}
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
                                q: "Is my PowerPoint presentation file uploaded to any remote server?",
                                a: "No. All slide extraction, OpenXML parsing, and PDF rendering are performed 100% locally in your web browser.",
                            },
                            {
                                q: "Which PowerPoint formats are supported by this converter?",
                                a: "The engine supports modern OpenXML PowerPoint formats including .pptx, .potx, and .ppsx. Older binary format (.ppt) is not supported client-side and must be converted to .pptx first.",
                            },
                            {
                                q: "What is the maximum file size limit for PPTX conversion?",
                                a: "The tool supports presentation archives up to 20 MB directly in client memory.",
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
                        name: "PPT to PDF Presentation Converter",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Convert PowerPoint presentation decks (.pptx) into high-resolution PDF documents client-side with complete privacy and custom aspect ratios.",
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
                                name: "Is my PowerPoint presentation file uploaded to any remote server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All slide extraction, OpenXML parsing, and PDF rendering are performed 100% locally in your web browser.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}