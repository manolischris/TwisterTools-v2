"use client";

import React, { useState, useCallback, useRef } from "react";
import {
    FileText,
    Upload,
    Copy,
    Download,
    Trash2,
    RefreshCw,
    AlertTriangle,
    Check,
    Cpu,
    Table,
    Workflow,
    Shield,
    HelpCircle,
    FileCode,
    Layers,
    Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface PageText {
    pageNumber: number;
    text: string;
}

export default function PdfToTextExtractor() {
    // ── Core State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [extractedPages, setExtractedPages] = useState<PageText[]>([]);
    const [fullText, setFullText] = useState<string>("");
    const [includePageHeaders, setIncludePageHeaders] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // Text Rebuild Engine
    // ─────────────────────────────────────────────────────────────

    const updateCombinedText = useCallback((pages: PageText[], headers: boolean) => {
        if (pages.length === 0) {
            setFullText("");
            return;
        }
        if (headers) {
            const combined = pages
                .map((p) => `--- PAGE ${p.pageNumber} ---\n\n${p.text}`)
                .join("\n\n");
            setFullText(combined);
        } else {
            const combined = pages.map((p) => p.text).join("\n\n");
            setFullText(combined);
        }
    }, []);

    // ─────────────────────────────────────────────────────────────
    // PDF Parsing & Extraction Engine
    // ─────────────────────────────────────────────────────────────

    const processPdfFile = useCallback(
        async (file: File) => {
            setErrorMessage(null);
            if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
                setErrorMessage("Invalid file type. Please upload a valid PDF document.");
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                setErrorMessage("File exceeds the 20 MB size limit. Please upload a smaller PDF.");
                return;
            }

            setIsProcessing(true);
            setProcessingStatus("Loading PDF document...");
            setPdfFile(file);

            try {
                const pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
                const pdfDoc = await loadingTask.promise;
                const totalPages = pdfDoc.numPages;
                const pageResults: PageText[] = [];

                for (let i = 1; i <= totalPages; i++) {
                    setProcessingStatus(`Extracting text from page ${i} of ${totalPages}...`);
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();

                    const pageText = textContent.items
                        .map((item) => {
                            if ("str" in item) {
                                return item.str;
                            }
                            return "";
                        })
                        .join(" ");

                    pageResults.push({
                        pageNumber: i,
                        text: pageText.trim(),
                    });
                }

                setExtractedPages(pageResults);
                updateCombinedText(pageResults, includePageHeaders);
            } catch (err) {
                setErrorMessage(
                    err instanceof Error
                        ? err.message
                        : "Failed to parse and extract text from the selected PDF document."
                );
            } finally {
                setIsProcessing(false);
                setProcessingStatus(null);
            }
        },
        [includePageHeaders, updateCombinedText]
    );

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

    const handleHeaderToggle = (checked: boolean) => {
        setIncludePageHeaders(checked);
        updateCombinedText(extractedPages, checked);
    };

    const clearWorkspace = () => {
        setPdfFile(null);
        setExtractedPages([]);
        setFullText("");
        setErrorMessage(null);
        setProcessingStatus(null);
    };

    const copyToClipboard = async () => {
        if (!fullText) return;
        try {
            await navigator.clipboard.writeText(fullText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback copy logic if needed
        }
    };

    const downloadTxtFile = () => {
        if (!fullText) return;
        const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}_extracted.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const totalWords = fullText
        ? fullText.trim().split(/\s+/).filter(Boolean).length
        : 0;

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: SOURCE PDF ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">1. Source PDF Document</h2>
                                    <p className="text-xs text-indigo-100/80">Upload document for text extraction</p>
                                </div>
                            </div>
                            {extractedPages.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Clear Workspace
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
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Extraction Options & Information */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="header-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                                        Include Page Headers in Output
                                    </label>
                                    <input
                                        id="header-toggle"
                                        type="checkbox"
                                        checked={includePageHeaders}
                                        onChange={(e) => handleHeaderToggle(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    When enabled, adds clean page separators (e.g. --- PAGE 1 ---) between page contents.
                                </p>
                            </div>

                            {/* Status Indicator */}
                            {isProcessing && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
                                    <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
                                    <span className="text-xs font-semibold text-indigo-900">
                                        {processingStatus || "Processing PDF..."}
                                    </span>
                                </div>
                            )}

                            {/* File Info Card */}
                            {pdfFile && (
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 font-medium">File Name:</span>
                                        <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">
                                            {pdfFile.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 font-medium">File Size:</span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {formatBytes(pdfFile.size)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 font-medium">Total Pages:</span>
                                        <span className="font-mono font-bold text-slate-800">
                                            {extractedPages.length}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: EXTRACTED TEXT OUTPUT ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <FileCode className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">2. Extracted Plain Text</h2>
                                    <p className="text-xs text-indigo-100/80">View and copy formatted plain text</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Text Output Area */}
                            <div className="relative">
                                <textarea
                                    value={fullText}
                                    readOnly
                                    placeholder="Extracted plain text from your PDF document will appear here..."
                                    className="font-mono text-sm h-[320px] focus:ring-2 focus:ring-indigo-600 outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none"
                                />
                            </div>

                            {/* Extraction Metrics Bar */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Characters</p>
                                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                                        {fullText.length.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Total Words</p>
                                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                                        {totalWords.toLocaleString()}
                                    </p>
                                </div>
                                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Extracted Pages</p>
                                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                                        {extractedPages.length}
                                    </p>
                                </div>
                            </div>

                            {/* Action Toolbar */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    disabled={!fullText}
                                    className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${fullText
                                        ? copied
                                            ? "bg-green-600 text-white shadow-green-200"
                                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        }`}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span>Copied to Clipboard!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy Text</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={downloadTxtFile}
                                    disabled={!fullText}
                                    className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${fullText
                                        ? "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-200 hover:-translate-y-0.5"
                                        : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        }`}
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Download TXT</span>
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
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Text Extraction</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Extracting textual data from Portable Document Format (PDF) files requires reading byte stream dictionaries, mapping character encodings, and reconstructing layout structures. Unlike standardized plain text or markup languages, PDF documents store text elements as absolute coordinates on a 2D canvas page buffer.
                        </p>
                        <p>
                            Our PDF to Plain Text Extractor relies entirely on modern browser capabilities using WebAssembly and client-side JavaScript worker pipelines. By parsing character glyph offsets directly in local memory, text streams are assembled into continuous plain text formats without sending confidential documents to external servers.
                        </p>
                    </div>
                </div>

                {/* Card 2: Features Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Plain Text Extraction Feature Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Extraction Capability</th>
                                    <th className="px-4 py-3.5 font-bold">Supported Standards</th>
                                    <th className="px-4 py-3.5 font-bold">Processing Engine</th>
                                    <th className="px-4 py-3.5 font-bold">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Vector Character Stream Parsing</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">PDF 1.0 - 2.0</td>
                                    <td className="px-4 py-3">In-Browser PDF.js Worker</td>
                                    <td className="px-4 py-3">Digital Document & E-Book Text Recovery</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Custom Page Boundary Tagging</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Plain Text Header Schema</td>
                                    <td className="px-4 py-3">Client-Side Array Mapping</td>
                                    <td className="px-4 py-3">Structured Content Staging & NLP Input</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Batch Character Metrics</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">UTF-8 Encoding</td>
                                    <td className="px-4 py-3">Native Memory RegEx Engines</td>
                                    <td className="px-4 py-3">Word Count Analysis & Document Statistics</td>
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
                        <span>How to Extract Plain Text from PDF Files</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload Target PDF Document",
                                body: "Drag and drop your PDF file into the designated upload zone, or click to select a file from your device local storage.",
                            },
                            {
                                step: "02",
                                title: "Configure Extracted Layout",
                                body: "Toggle page header demarcations depending on whether you require clean plain text or distinct page markers.",
                            },
                            {
                                step: "03",
                                title: "Inspect Character Metrics",
                                body: "Review real-time character counts, word statistics, and parsed page counts in the extraction metrics toolbar.",
                            },
                            {
                                step: "04",
                                title: "Copy or Save Plain Text",
                                body: "Copy the extracted text directly to your clipboard or download a clean .txt file to your local computer.",
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

                {/* Card 4: Security & Privacy */}
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Zero Server Transmission</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "100% On-Device Data Security",
                                body: "All extraction routines execute strictly inside your local web browser sandbox. Documents are never transmitted to cloud servers.",
                            },
                            {
                                title: "Zero Document Logging",
                                body: "Because your PDF file is parsed in local memory, no content or metadata is saved, stored, or indexed.",
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
                                q: "Are my confidential PDF documents uploaded to any remote server?",
                                a: "No. All text parsing happens completely client-side in your web browser. Your file contents never leave your device.",
                            },
                            {
                                q: "Can this tool extract text from scanned paper documents or images?",
                                a: "This extractor parses vector text streams embedded inside native PDF documents. Scanned images or flattened photos without an OCR text layer will require Optical Character Recognition.",
                            },
                            {
                                q: "Is there a limit on file size or maximum page count?",
                                a: "The tool supports files up to 20 MB. Since parsing relies on system memory, performance depends on your web browser capacity.",
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
                        name: "PDF to Plain Text Extractor",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 File API & Web Workers.",
                        description:
                            "Extract clean plain text from PDF files directly in your web browser with complete data privacy and zero server uploads.",
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
                                name: "Are my confidential PDF documents uploaded to any remote server?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All text parsing happens completely client-side in your web browser. Your file contents never leave your device.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "Can this tool extract text from scanned paper documents or images?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "This extractor parses vector text streams embedded inside native PDF documents. Scanned images or flattened photos without an OCR text layer will require Optical Character Recognition.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}