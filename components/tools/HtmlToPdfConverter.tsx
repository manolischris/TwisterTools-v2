"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    Code,
    FileCode,
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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type PageFormat = "a4" | "letter" | "legal";
type Orientation = "portrait" | "landscape";

interface CompilerConfig {
    format: PageFormat;
    orientation: Orientation;
    marginMm: number;
    printBackground: boolean;
}

const SAMPLE_HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      padding: 24px;
      margin: 0;
      background-color: #ffffff;
    }
    .header {
      border-bottom: 2px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .badge {
      background-color: #e0e7ff;
      color: #4338ca;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 9999px;
      display: inline-block;
    }
    .grid {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      background-color: #f8fafc;
    }
    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
    }
    table.data-table th {
      background-color: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    .footer {
      margin-top: 32px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">Quarterly Performance Audit</h1>
    <div>
      <span class="badge">CONFIDENTIAL</span>
    </div>
  </div>

  <p>This report summarizes web compiling metrics, execution speed, and payload optimization efficiency for Q3.</p>

  <div class="grid">
    <div class="card">
      <p class="card-title">Total Compiled Documents</p>
      <p class="card-value">14,892</p>
    </div>
    <div class="card">
      <p class="card-title">Average Render Time</p>
      <p class="card-value">184 ms</p>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th>Module ID</th>
        <th>Input Syntax</th>
        <th>Target Canvas</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>MOD-0102</td>
        <td>HTML5 / CSS3</td>
        <td>PDF Stream</td>
        <td>Verified</td>
      </tr>
      <tr>
        <td>MOD-0103</td>
        <td>DOM Template</td>
        <td>Vector Graphics</td>
        <td>Verified</td>
      </tr>
      <tr>
        <td>MOD-0104</td>
        <td>Inline CSS</td>
        <td>Print Raster</td>
        <td>Verified</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Generated automatically via TwisterTools HTML to PDF Webpage Compiler • Client-Side Processing
  </div>
</body>
</html>`;

export default function HtmlToPdfConverter() {
    // ── Core State (Starts strictly empty) ──
    const [htmlCode, setHtmlCode] = useState<string>("");
    const [config, setConfig] = useState<CompilerConfig>({
        format: "a4",
        orientation: "portrait",
        marginMm: 10,
        printBackground: true,
    });

    // ── Processing & UI State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [previewSrcDoc, setPreviewSrcDoc] = useState<string>("");
    const [estimatedSizeMb, setEstimatedSizeMb] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sync preview source document with htmlCode
    useEffect(() => {
        setPreviewSrcDoc(htmlCode);
        const codeBytes = new TextEncoder().encode(htmlCode).length;
        const estimated = codeBytes > 0 ? (codeBytes * 8.5) / (1024 * 1024) + 0.12 : 0;
        setEstimatedSizeMb(parseFloat(estimated.toFixed(2)));
    }, [htmlCode]);

    // ── File Handling ──
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB Limit

    const processHtmlFile = useCallback((file: File) => {
        setErrorMessage(null);
        if (!file.name.match(/\.(html|htm|txt|xhtml)$/i) && file.type !== "text/html") {
            setErrorMessage("Invalid file format. Please select an HTML or HTM file.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage(`File exceeds 20 MB size limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                setHtmlCode(content);
            }
        };
        reader.onerror = () => {
            setErrorMessage("Failed to read the selected file.");
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processHtmlFile(e.dataTransfer.files[0]);
            }
        },
        [processHtmlFile]
    );

    const clearWorkspace = () => {
        setHtmlCode("");
        setErrorMessage(null);
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(htmlCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent */
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Off-Screen Sandboxed HTML to PDF Compiler Engine
    // ─────────────────────────────────────────────────────────────

    const compileHtmlToPdf = async () => {
        if (!htmlCode.trim()) {
            setErrorMessage("Please enter or upload valid HTML source code.");
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);
        setProcessingStatus("Initializing PDF engine...");

        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            // Paper Dimensions in mm
            const paperWidthMm = config.orientation === "portrait"
                ? (config.format === "a4" ? 210 : config.format === "letter" ? 215.9 : 215.9)
                : (config.format === "a4" ? 297 : config.format === "letter" ? 279.4 : 355.6);
            const paperHeightMm = config.orientation === "portrait"
                ? (config.format === "a4" ? 297 : config.format === "letter" ? 279.4 : 355.6)
                : (config.format === "a4" ? 210 : config.format === "letter" ? 215.9 : 215.9);

            // Render much wider to prevent flexboxes/tables/grids from overflowing
            const targetPixelWidth = config.orientation === "portrait" ? 1200 : 1600;

            let fullHtml = htmlCode.trim();
            if (!fullHtml.toLowerCase().includes("<html")) {
                fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${fullHtml}</body></html>`;
            }

            // Injected styles: avoid global box-sizing overrides to prevent altering uploaded markup styles
            const printStyleOverrides = `
<style>
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html {
    background-color: #ffffff !important;
  }
  body {
    margin: 0 !important;
    padding: 0 8px 0 0 !important; /* Add 8px right padding to ensure content doesn't touch the right edge of the layout */
  }
  html, body {
    min-width: ${targetPixelWidth}px;
    width: auto;
    overflow: visible;
  }
</style>`;

            fullHtml = fullHtml.toLowerCase().includes("</head>")
                ? fullHtml.replace(/(<\/head>)/i, printStyleOverrides + "$1")
                : fullHtml.replace(/(<html[^>]*>)/i, "$1" + printStyleOverrides) || printStyleOverrides + fullHtml;

            setProcessingStatus("Rendering DOM offscreen...");

            // Create offscreen iframe (avoids screen flickering completely)
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.left = "-9999px";
            iframe.style.top = "0";
            iframe.style.width = `${targetPixelWidth}px`;
            iframe.style.height = "1px"; // Collapse height initially to measure scroll height accurately
            iframe.style.border = "none";
            iframe.style.zIndex = "-9999";
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) throw new Error("Could not construct render sandbox.");

            iframeDoc.open();
            iframeDoc.write(fullHtml);
            iframeDoc.close();

            // Wait for styles/fonts to settle
            await new Promise((r) => setTimeout(r, 350));
            const iframeFonts = (iframeDoc as Document & { fonts?: FontFaceSet }).fonts;
            if (iframeFonts) {
                try {
                    await iframeFonts.ready;
                } catch {
                    /* fonts API unsupported or blocked — fixed delay above still applies */
                }
            }

            // Compute actual content dimensions + add 8px padding safety margin
            const contentWidth = Math.max(
                iframeDoc.body.scrollWidth,
                iframeDoc.documentElement.scrollWidth,
                targetPixelWidth
            ) + 8;

            const contentHeight = Math.max(
                iframeDoc.body.scrollHeight,
                iframeDoc.documentElement.scrollHeight
            );

            // Resize frame dimensions to match content exactly before capture
            iframe.style.width = `${contentWidth}px`;
            iframe.style.height = `${contentHeight}px`;

            setProcessingStatus("Capturing crisp document canvas...");

            // Capture from documentElement instead of body for better reliability
            const canvas = await html2canvas(iframeDoc.documentElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                foreignObjectRendering: true, // let browser native text renderer draw text
                width: contentWidth,
                height: contentHeight,
                windowWidth: contentWidth,
                windowHeight: contentHeight,
                x: 0,
                y: 0,
                scrollX: 0, // pin capture origin — prevents host page scroll position
                scrollY: 0, // from offsetting/cropping the captured region
                backgroundColor: config.printBackground ? "#ffffff" : null,
                document: iframeDoc,
                window: iframe.contentWindow || window,
            } as any);

            // Clean up offscreen iframe immediately
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }

            setProcessingStatus("Generating PDF binary...");

            const pdf = new jsPDF({
                orientation: config.orientation,
                unit: "mm",
                format: config.format,
                compress: true,
            });

            const marginMm = config.marginMm;
            const printableWidthMm = paperWidthMm - (marginMm * 2);
            const printableHeightMm = paperHeightMm - (marginMm * 2);

            const imgWidthPx = canvas.width;
            const imgHeightPx = canvas.height;

            // Page height in pixels based on the aspect ratio of the page printable region
            const pxPageHeight = Math.floor((imgWidthPx * printableHeightMm) / printableWidthMm);

            // Slicing the canvas itself avoids repeating large image embeds and cumulative offset shifts
            const totalPages = Math.ceil(imgHeightPx / pxPageHeight) || 1;

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                // Create a temporary canvas for this page slice
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = imgWidthPx;
                tempCanvas.height = pxPageHeight;

                const ctx = tempCanvas.getContext("2d");
                if (ctx) {
                    if (config.printBackground) {
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, imgWidthPx, pxPageHeight);
                    }

                    const srcY = i * pxPageHeight;
                    const srcHeight = Math.min(pxPageHeight, imgHeightPx - srcY);

                    ctx.drawImage(
                        canvas,
                        0,
                        srcY,
                        imgWidthPx,
                        srcHeight,
                        0,
                        0,
                        imgWidthPx,
                        srcHeight
                    );
                }

                const pageImgData = tempCanvas.toDataURL("image/png");
                pdf.addImage(
                    pageImgData,
                    "PNG",
                    marginMm,
                    marginMm,
                    printableWidthMm,
                    printableHeightMm
                );
            }

            setProcessingStatus("Downloading PDF...");
            pdf.save("compiled_document.pdf");

        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Compilation failed. Ensure your HTML does not contain broken external resources."
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
                {/* ══════════════════ LEFT PANEL: HTML CODE & CONFIG ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Code className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h1 className="text-base font-bold leading-tight">1. Source HTML & Code Editor</h1>
                                    <p className="text-xs text-indigo-100/80">Input raw HTML5, inline CSS, or load file</p>
                                </div>
                            </div>
                            {htmlCode && (
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
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-5 px-4 text-center ${isDragging
                                    ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                    : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".html,.htm,.txt"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && processHtmlFile(e.target.files[0])}
                                />
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Upload className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-slate-800">
                                            Drop .html file here, or <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400">Max size 20 MB limit</p>
                                    </div>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                                        HTML Document Source
                                    </label>
                                    <button
                                        onClick={copyToClipboard}
                                        disabled={!htmlCode}
                                        className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 disabled:opacity-40"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                        {copied ? "Copied" : "Copy Source"}
                                    </button>
                                </div>
                                <textarea
                                    value={htmlCode}
                                    onChange={(e) => setHtmlCode(e.target.value)}
                                    placeholder="Paste your HTML code here or drop a file above..."
                                    rows={14}
                                    className="w-full font-mono text-xs p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none shadow-inner"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setHtmlCode(SAMPLE_HTML_CODE)}
                                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all flex items-center gap-1.5 border border-indigo-200"
                                >
                                    <RefreshCw className="w-3 h-3 text-indigo-500" />
                                    Load Sample HTML Template
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: PREVIEW & COMPILER CONFIG ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <Sliders className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Compiler Layout & PDF Output</h2>
                                    <p className="text-xs text-indigo-100/80">Configure page geometry, margins, and preview</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Page Size</label>
                                    <select
                                        value={config.format}
                                        onChange={(e) => setConfig({ ...config, format: e.target.value as PageFormat })}
                                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="a4">A4 (210 x 297 mm)</option>
                                        <option value="letter">Letter (8.5 x 11 in)</option>
                                        <option value="legal">Legal (8.5 x 14 in)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Orientation</label>
                                    <select
                                        value={config.orientation}
                                        onChange={(e) => setConfig({ ...config, orientation: e.target.value as Orientation })}
                                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Margin (mm)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={config.marginMm}
                                        onChange={(e) => setConfig({ ...config, marginMm: Number(e.target.value) })}
                                        className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={config.printBackground}
                                        onChange={(e) => setConfig({ ...config, printBackground: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    Print Background Colors & CSS Graphics
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                        DOM Render Live Preview
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                        Estimated PDF: ~{estimatedSizeMb} MB
                                    </span>
                                </div>
                                <div className="w-full h-[260px] bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden relative">
                                    {htmlCode ? (
                                        <iframe
                                            ref={iframeRef}
                                            srcDoc={previewSrcDoc}
                                            title="HTML Preview"
                                            className="w-full h-full border-0 pointer-events-auto"
                                            sandbox="allow-same-origin"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                                            <Code className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-xs font-medium text-slate-500">Live preview will appear here</p>
                                            <p className="text-[11px] text-slate-400">Paste HTML or click "Load Sample HTML Template"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={compileHtmlToPdf}
                                disabled={!htmlCode.trim() || isProcessing}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${htmlCode.trim() && !isProcessing
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>{processingStatus || "Compiling HTML to PDF..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-4 h-4" />
                                        <span>Compile HTML & Download PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK (UPDATED)
      ───────────────────────────────────────────────────────────── */}
            <section className="space-y-8 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side HTML-to-PDF DOM Compilation</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Compiling raw HTML documents and CSS stylesheets into standard PDF pages requires executing a browser layout engine in memory. Our client-side compilation engine parses structural HTML tags, computes inline styles, constructs CSSOM trees within an offscreen sandboxed frame, and captures high-resolution canvas snapshots directly into a strict PDF wrapper.
                        </p>
                        <p>
                            Unlike server-based solutions that rely on remote headless browsers or third-party APIs, our engine performs all page layout calculations directly on your device. This eliminates network latency, removes upload file size bottlenecks, and ensures total data privacy for sensitive corporate documents.
                        </p>
                    </div>
                </div>

                {/* Card 2: Technical Specifications Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Page Layout & CSS Support Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Feature Category</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Standards</th>
                                    <th className="px-4 py-3.5 font-bold">Rendering Precision</th>
                                    <th className="px-4 py-3.5 font-bold">Optimization Protocol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Layout Engines</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">CSS Grid, Flexbox, Tables</td>
                                    <td className="px-4 py-3">Pixel-Exact High-DPI Canvas</td>
                                    <td className="px-4 py-3">Offscreen Sandboxed Isolation</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Media Assets</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Base64, Data URLs, Inline SVG</td>
                                    <td className="px-4 py-3">Lossless Graphic Rasterization</td>
                                    <td className="px-4 py-3">CORS Canvas Resource Inspection</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Typography</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Web Fonts, System Fonts</td>
                                    <td className="px-4 py-3">Subpixel Kerning Preservation</td>
                                    <td className="px-4 py-3">FontFace Loading Verification</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Guide */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Compile Webpages & HTML into PDF</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Provide HTML Source Code",
                                body: "Paste raw HTML string into the code editor or drop an .html file directly into the upload dropzone.",
                            },
                            {
                                step: "02",
                                title: "Configure Geometry & Margins",
                                body: "Set target page dimensions (A4, Letter, Legal), orientation, print background color toggles, and margins.",
                            },
                            {
                                step: "03",
                                title: "Review DOM Live Preview",
                                body: "Verify how your CSS layout, table grids, and typography look in the interactive real-time preview canvas.",
                            },
                            {
                                step: "04",
                                title: "Compile & Download PDF",
                                body: "Click Compile HTML to stream the compiled PDF binary file directly onto your hard drive.",
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
                        <span>Enterprise-Grade Privacy & Security Safeguards</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% Client-Side DOM Processing",
                                body: "Your source HTML, corporate templates, and embedded image assets never leave your browser memory sandbox.",
                            },
                            {
                                title: "Zero Remote Server Transmission",
                                body: "No API calls or external backend servers process your document streams, guaranteeing total compliance with enterprise security requirements.",
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
                                q: "Are my HTML files or compiled PDFs uploaded to any remote server?",
                                a: "No. All HTML compilation, DOM layout rendering, and PDF byte generation take place 100% client-side within your browser JavaScript engine.",
                            },
                            {
                                q: "Does the compiler support custom CSS fonts and embedded images?",
                                a: "Yes! Web fonts, inline SVG elements, and standard base64 data URIs or accessible image links are fully rendered into the final output PDF.",
                            },
                            {
                                q: "What file size limit applies to imported HTML documents?",
                                a: "You can load HTML documents up to 20 MB directly in your browser without performance degradation.",
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

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "HTML to PDF Webpage Compiler",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
                        description:
                            "Compile web pages, HTML source code, and CSS into high-resolution PDF documents client-side with full privacy and custom page geometry.",
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
                                name: "Are my HTML files or compiled PDFs uploaded to any remote server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All HTML compilation, DOM layout rendering, and PDF byte generation take place 100% client-side within your browser JavaScript engine.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}