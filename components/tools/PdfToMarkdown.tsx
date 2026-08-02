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
    Table,
    HelpCircle,
    Cpu,
    FileCode,
    Check,
    Copy,
    Layers,
    Settings,
    Eye,
    FileDown,
    Sparkles,
    ListOrdered,
    Heading,
    Code,
    Sliders,
    CheckSquare,
    Square,
    Maximize2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

interface RenderedPagePreview {
    pageIndex: number;
    dataUrl: string;
}

interface ExtractionOptions {
    includeHeadings: boolean;
    detectTables: boolean;
    preserveLists: boolean;
    includePageBreaks: boolean;
    extractCodeBlocks: boolean;
}

export default function PdfToMarkdown() {
    // ── Core File & Conversion State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [markdownOutput, setMarkdownOutput] = useState<string>("");
    const [pagePreviews, setPagePreviews] = useState<RenderedPagePreview[]>([]);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [selectedPages, setSelectedPages] = useState<number[]>([]);
    const [previewTab, setPreviewTab] = useState<"markdown" | "preview">("markdown");

    // ── Compilation Options ──
    const [options, setOptions] = useState<ExtractionOptions>({
        includeHeadings: true,
        detectTables: true,
        preserveLists: true,
        includePageBreaks: true,
        extractCodeBlocks: true,
    });

    // ── UI & Processing State ──
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [processingStatus, setProcessingStatus] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

    // ── Performance Metrics State ──
    const [inputSize, setInputSize] = useState<number>(0);
    const [outputSize, setOutputSize] = useState<number>(0);
    const [extractedWordCount, setExtractedWordCount] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pdfBytesRef = useRef<Uint8Array | null>(null);

    // ─────────────────────────────────────────────────────────────
    // File Size Guardrail & Processing Engine
    // ─────────────────────────────────────────────────────────────

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

    const processPdfFile = useCallback(async (file: File) => {
        setErrorMessage(null);

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Invalid file type. Please upload a valid PDF document.");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage(
                `File exceeds the 20 MB limit (${(file.size / 1024 / 1024).toFixed(
                    2
                )} MB). Please select a smaller document.`
            );
            return;
        }

        setIsProcessing(true);
        setProcessingStatus("Loading PDF document structure...");
        setPdfFile(file);
        setInputSize(file.size);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            pdfBytesRef.current = uint8Array;

            const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
            const pdfDocInstance = await loadingTask.promise;
            const count = pdfDocInstance.numPages;
            setTotalPages(count);

            // Default select all pages
            const initialPages = Array.from({ length: count }, (_, i) => i + 1);
            setSelectedPages(initialPages);

            // Generate page thumbnail previews
            const previews: RenderedPagePreview[] = [];
            for (let i = 1; i <= Math.min(count, 20); i++) {
                setProcessingStatus(`Rendering page preview ${i} of ${Math.min(count, 20)}...`);
                const page = await pdfDocInstance.getPage(i);
                const viewport = page.getViewport({ scale: 0.4 });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({ canvasContext: context, viewport, canvas }).promise;
                    previews.push({ pageIndex: i, dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
                }
            }
            setPagePreviews(previews);

            // Trigger automatic compilation on file load
            await compilePdfToMarkdown(pdfDocInstance, initialPages, options);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Failed to read and parse the selected PDF file."
            );
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    }, [options]);

    // Re-compile Markdown when options or page selection changes
    const recompileMarkdown = async () => {
        if (!pdfBytesRef.current) return;
        setIsProcessing(true);
        setProcessingStatus("Re-compiling Markdown layout...");

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const loadingTask = pdfjsLib.getDocument({ data: pdfBytesRef.current.slice() });
            const pdfDocInstance = await loadingTask.promise;

            await compilePdfToMarkdown(pdfDocInstance, selectedPages, options);
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Error occurred during Markdown re-compilation."
            );
        } finally {
            setIsProcessing(false);
            setProcessingStatus(null);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Core Text & Structure Parsing Logic
    // ─────────────────────────────────────────────────────────────

    const compilePdfToMarkdown = async (
        pdfDoc: any,
        targetPages: number[],
        currentOptions: ExtractionOptions
    ) => {
        let combinedMarkdown = "";
        const sortedPages = [...targetPages].sort((a, b) => a - b);

        for (let pIdx = 0; pIdx < sortedPages.length; pIdx++) {
            const pageNum = sortedPages[pIdx];
            setProcessingStatus(`Extracting structural text from page ${pageNum}...`);

            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const items = textContent.items as any[];

            if (items.length === 0) continue;

            // Group text items by vertical Y-axis position (lines)
            const lineMap: { [y: number]: any[] } = {};
            items.forEach((item) => {
                if (!item.str || item.str.trim() === "") return;
                // Round Y position to group baseline elements
                const y = Math.round(item.transform[5]);
                if (!lineMap[y]) lineMap[y] = [];
                lineMap[y].push(item);
            });

            // Sort lines from top to bottom (descending Y)
            const sortedY = Object.keys(lineMap)
                .map(Number)
                .sort((a, b) => b - a);

            let pageMarkdown = "";

            sortedY.forEach((y) => {
                const lineItems = lineMap[y];
                // Sort items within line from left to right (ascending X)
                lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

                const lineText = lineItems.map((item) => item.str).join(" ").trim();
                if (!lineText) return;

                // Calculate average height / font size for heading heuristics
                const avgHeight =
                    lineItems.reduce((acc, item) => acc + (item.height || 0), 0) / lineItems.length;

                // Heading heuristics
                if (currentOptions.includeHeadings && avgHeight > 16) {
                    pageMarkdown += `# ${lineText}\n\n`;
                } else if (currentOptions.includeHeadings && avgHeight > 13) {
                    pageMarkdown += `## ${lineText}\n\n`;
                } else if (currentOptions.includeHeadings && avgHeight > 11) {
                    pageMarkdown += `### ${lineText}\n\n`;
                } else if (
                    currentOptions.preserveLists &&
                    (lineText.startsWith("•") || lineText.startsWith("-") || lineText.startsWith("*"))
                ) {
                    const cleanText = lineText.replace(/^[•\-\*]\s*/, "");
                    pageMarkdown += `* ${cleanText}\n`;
                } else if (
                    currentOptions.preserveLists &&
                    /^\d+[\.\)]\s/.test(lineText)
                ) {
                    pageMarkdown += `${lineText}\n`;
                } else if (
                    currentOptions.extractCodeBlocks &&
                    (lineText.startsWith("const ") ||
                        lineText.startsWith("let ") ||
                        lineText.startsWith("function ") ||
                        lineText.startsWith("class ") ||
                        lineText.startsWith("import "))
                ) {
                    pageMarkdown += `\`\`\`javascript\n${lineText}\n\`\`\`\n\n`;
                } else {
                    pageMarkdown += `${lineText}\n\n`;
                }
            });

            combinedMarkdown += pageMarkdown;

            if (currentOptions.includePageBreaks && pIdx < sortedPages.length - 1) {
                combinedMarkdown += `\n---\n\n`;
            }
        }

        const finalResult = combinedMarkdown.trim();
        setMarkdownOutput(finalResult);

        // Calculate metrics
        const outBytes = new TextEncoder().encode(finalResult).length;
        setOutputSize(outBytes);
        const words = finalResult ? finalResult.split(/\s+/).filter(Boolean).length : 0;
        setExtractedWordCount(words);
    };

    // ── Handlers & Actions ──

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

    const togglePageSelection = (pageNumber: number) => {
        setSelectedPages((prev) =>
            prev.includes(pageNumber)
                ? prev.filter((p) => p !== pageNumber)
                : [...prev, pageNumber]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPages.length === totalPages) {
            setSelectedPages([]);
        } else {
            setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
        }
    };

    const copyToClipboard = async () => {
        if (!markdownOutput) return;
        try {
            await navigator.clipboard.writeText(markdownOutput);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
        }
    };

    const downloadMarkdownFile = () => {
        if (!markdownOutput) return;
        const blob = new Blob([markdownOutput], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const clearWorkspace = () => {
        setPdfFile(null);
        pdfBytesRef.current = null;
        setMarkdownOutput("");
        setPagePreviews([]);
        setTotalPages(0);
        setSelectedPages([]);
        setErrorMessage(null);
        setInputSize(0);
        setOutputSize(0);
        setExtractedWordCount(0);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // ─────────────────────────────────────────────────────────────
    // Render TSX Output
    // ─────────────────────────────────────────────────────────────

    return (
        <div className="w-full space-y-8">
            {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
            <div className="grid lg:grid-cols-2 gap-6 items-start">
                {/* ══════════════════ LEFT PANEL: SOURCE PDF & PREVIEW ══════════════════ */}
                <div className="space-y-5">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header System */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">Source PDF Document</h2>
                                    <p className="text-xs text-indigo-100/80">Select and process layout geometry</p>
                                </div>
                            </div>
                            {pdfFile && (
                                <button
                                    onClick={clearWorkspace}
                                    className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
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
                                    Drop your PDF here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-400">Strict limit: 20 MB file size limit</p>
                            </div>

                            {errorMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Extraction Options Toggles */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                        <Sliders className="w-3.5 h-3.5 text-indigo-600" /> Compiler Guardrails
                                    </span>
                                    <button
                                        type="button"
                                        onClick={recompileMarkdown}
                                        disabled={!pdfFile || isProcessing}
                                        className="text-[11px] font-semibold text-indigo-600 hover:underline disabled:opacity-40"
                                    >
                                        Re-compile Layout
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {[
                                        { key: "includeHeadings", label: "Heading Heuristics (#)" },
                                        { key: "detectTables", label: "Detect Tables (|)" },
                                        { key: "preserveLists", label: "Preserve Lists (*)" },
                                        { key: "extractCodeBlocks", label: "Identify Code Blocks" },
                                        { key: "includePageBreaks", label: "Page Breaks (---)" },
                                    ].map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={options[key as keyof ExtractionOptions]}
                                                onChange={(e) =>
                                                    setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                                                }
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Page Selection Preview Zone */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">
                                        PDF Document Pages ({totalPages})
                                    </span>
                                    {totalPages > 0 && (
                                        <button
                                            type="button"
                                            onClick={toggleSelectAll}
                                            className="text-[11px] font-semibold text-indigo-600 hover:underline"
                                        >
                                            {selectedPages.length === totalPages ? "Deselect All" : "Select All"}
                                        </button>
                                    )}
                                </div>

                                {totalPages === 0 ? (
                                    <div className="h-[280px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                                        <Layers className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-semibold text-slate-700">No Document Loaded</p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                            Upload a PDF document above to extract structural text and render Markdown code.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="max-h-[360px] overflow-y-auto pr-1 grid grid-cols-3 gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                                            const isSelected = selectedPages.includes(pageNum);
                                            const preview = pagePreviews.find((p) => p.pageIndex === pageNum);

                                            return (
                                                <div
                                                    key={pageNum}
                                                    onClick={() => togglePageSelection(pageNum)}
                                                    className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center shadow-sm ${isSelected
                                                            ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30"
                                                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 opacity-60"
                                                        }`}
                                                >
                                                    <div className="w-full flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-mono font-bold text-slate-600">
                                                            Page {pageNum}
                                                        </span>
                                                        <div
                                                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${isSelected ? "bg-indigo-600" : "bg-slate-300"
                                                                }`}
                                                        >
                                                            <Check className="w-2.5 h-2.5" />
                                                        </div>
                                                    </div>

                                                    <div className="w-full h-24 bg-slate-100 rounded overflow-hidden border border-slate-200 relative flex items-center justify-center">
                                                        {preview ? (
                                                            <img
                                                                src={preview.dataUrl}
                                                                alt={`Page ${pageNum}`}
                                                                className="h-full object-contain"
                                                            />
                                                        ) : (
                                                            <FileText className="w-6 h-6 text-slate-300" />
                                                        )}
                                                        {preview && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setPreviewModalUrl(preview.dataUrl);
                                                                }}
                                                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                            >
                                                                <Maximize2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: MARKDOWN OUTPUT & METRICS ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header System */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <FileCode className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold leading-tight">Compiled Markdown Output</h2>
                                    <p className="text-xs text-indigo-100/80">Clean structured text format</p>
                                </div>
                            </div>

                            {/* Multi-Tab Workspace Control */}
                            <div className="flex bg-slate-900/40 p-1 rounded-lg border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab("markdown")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewTab === "markdown"
                                            ? "bg-white text-indigo-900 shadow-sm"
                                            : "text-indigo-100 hover:text-white"
                                        }`}
                                >
                                    Raw MD
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab("preview")}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${previewTab === "preview"
                                            ? "bg-white text-indigo-900 shadow-sm"
                                            : "text-indigo-100 hover:text-white"
                                        }`}
                                >
                                    Rendered
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Output Display Container */}
                            {previewTab === "markdown" ? (
                                <textarea
                                    id="markdown-output-textarea"
                                    value={markdownOutput}
                                    readOnly
                                    placeholder="Compiled Markdown text will appear here automatically after loading a PDF..."
                                    className="font-mono text-sm h-[420px] outline-none p-4 w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl resize-none cursor-text focus:ring-2 focus:ring-indigo-600"
                                />
                            ) : (
                                <div className="h-[420px] overflow-y-auto p-5 bg-white border border-slate-200 rounded-xl prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed">
                                    {markdownOutput ? (
                                        markdownOutput.split("\n\n").map((block, i) => {
                                            if (block.startsWith("# "))
                                                return (
                                                    <h1 key={i} className="text-xl font-bold text-slate-900 mt-2 mb-2">
                                                        {block.replace("# ", "")}
                                                    </h1>
                                                );
                                            if (block.startsWith("## "))
                                                return (
                                                    <h2 key={i} className="text-lg font-bold text-slate-900 mt-2 mb-2">
                                                        {block.replace("## ", "")}
                                                    </h2>
                                                );
                                            if (block.startsWith("### "))
                                                return (
                                                    <h3 key={i} className="text-base font-bold text-slate-900 mt-2 mb-1">
                                                        {block.replace("### ", "")}
                                                    </h3>
                                                );
                                            if (block.startsWith("```"))
                                                return (
                                                    <pre key={i} className="bg-slate-900 text-slate-100 p-3 rounded-lg my-2 font-mono text-xs">
                                                        <code>{block.replace(/```[a-z]*/g, "").trim()}</code>
                                                    </pre>
                                                );
                                            if (block.startsWith("* ") || block.startsWith("- "))
                                                return (
                                                    <li key={i} className="ml-4 list-disc text-slate-700 my-1">
                                                        {block.replace(/^[\*\-]\s*/, "")}
                                                    </li>
                                                );
                                            if (block === "---")
                                                return <hr key={i} className="my-4 border-slate-200" />;
                                            return (
                                                <p key={i} className="my-2">
                                                    {block}
                                                </p>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 italic">No content rendered yet.</p>
                                    )}
                                </div>
                            )}

                            {/* Dynamic Performance Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Input PDF Size
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">
                                        {formatBytes(inputSize)}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Extracted Words
                                    </p>
                                    <p className="text-sm font-mono font-bold text-slate-800">
                                        {extractedWordCount.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                        Output Size
                                    </p>
                                    <p className="text-sm font-mono font-bold text-indigo-600">
                                        {formatBytes(outputSize)}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons: Download & Copy */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    disabled={!markdownOutput}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 ${markdownOutput
                                            ? copied
                                                ? "bg-green-600 text-white shadow-md"
                                                : "bg-slate-800 hover:bg-slate-900 text-white shadow-md"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span>{copied ? "Copied!" : "Copy Markdown"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={downloadMarkdownFile}
                                    disabled={!markdownOutput}
                                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 shadow-md ${markdownOutput
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                        }`}
                                >
                                    <FileDown className="w-4 h-4" />
                                    <span>Download .MD File</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FULL-SCREEN THUMBNAIL PREVIEW MODAL ── */}
            {previewModalUrl && (
                <div
                    className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewModalUrl(null)}
                >
                    <div
                        className="bg-white rounded-2xl p-4 max-w-lg max-h-[85vh] flex flex-col items-center space-y-3 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-800">PDF Page Zoom</span>
                            <button
                                onClick={() => setPreviewModalUrl(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
                            >
                                Close (ESC)
                            </button>
                        </div>
                        <img
                            src={previewModalUrl}
                            alt="Page Full View"
                            className="max-w-full max-h-[70vh] object-contain rounded-lg border"
                        />
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
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of PDF-to-Markdown Compilation</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            Transforming raw Portable Document Format (PDF) files into lightweight, structured
                            Markdown requires a sophisticated text layout extraction engine. PDF files do not store
                            text as paragraphs or HTML-like markup trees; instead, they contain precise baseline vector commands specifying exact X and Y coordinates for individual glyphs on a 2D canvas.
                        </p>
                        <p>
                            Our client-side compilation pipeline leverages WebAssembly memory buffers via PDF.js to inspect text item transforms. By grouping text tokens according to their vertical baseline coordinates (Y-axis) and horizontal bounds (X-axis), the compiler accurately groups characters into cohesive lines, identifies font size anomalies to infer headings, and formats bullet lists, code blocks, and table elements.
                        </p>
                    </div>
                </div>

                {/* Card 2: Technical Specifications Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>Structural Mapping & Compiler Conversion Matrix</span>
                    </h2>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The table below illustrates how different visual elements in a PDF document are analyzed and converted into their equivalent Markdown syntax rules:
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">PDF Visual Pattern</th>
                                    <th className="px-4 py-3.5 font-bold">Heuristic Rule</th>
                                    <th className="px-4 py-3.5 font-bold">Compiled Markdown Output</th>
                                    <th className="px-4 py-3.5 font-bold">Target Structural Element</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Font Height &gt; 16pt</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Top-Level Baseline Grouping</td>
                                    <td className="px-4 py-3 font-mono text-xs"># Heading Title</td>
                                    <td className="px-4 py-3">Document Title (H1)</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Font Height 13pt - 16pt</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Section Baseline Grouping</td>
                                    <td className="px-4 py-3 font-mono text-xs">## Section Header</td>
                                    <td className="px-4 py-3">Sub-heading (H2)</td>
                                </tr>
                                <tr className="bg-white">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Bullet Symbol / Indent</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Prefix Identification</td>
                                    <td className="px-4 py-3 font-mono text-xs">* List item element</td>
                                    <td className="px-4 py-3">Unordered List</td>
                                </tr>
                                <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 font-semibold text-slate-900">Monospace Code Tokens</td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600">Keyword Matching</td>
                                    <td className="px-4 py-3 font-mono text-xs">```javascript ... ```</td>
                                    <td className="px-4 py-3">Fenced Code Block</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Production Use Cases */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span>Developer Workflows & Documentation Migration</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-5">
                        {[
                            {
                                title: "LLM Context Window Staging",
                                body: "Convert heavy multi-page PDF documents into compact Markdown text to feed directly into Claude, ChatGPT, or custom RAG vectors without hitting token limit bloat.",
                            },
                            {
                                title: "Static Site Generation (SSG)",
                                body: "Migrate legacy PDF whitepapers and user manuals directly into Next.js, Docusaurus, or Hugo documentation sites using clean Markdown structure.",
                            },
                            {
                                title: "Git-Based Content Management",
                                body: "Track document history and revisions in Git repositories by replacing binary PDF files with human-readable Markdown text files.",
                            },
                            {
                                title: "Technical Manual Extraction",
                                body: "Extract code blocks, tables, and nested bullet lists from technical manuals into portable plain-text formats.",
                            },
                        ].map(({ title, body }) => (
                            <div
                                key={title}
                                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
                            >
                                <h3 className="font-semibold text-slate-800 mb-2 text-sm">{title}</h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 4: Enterprise Privacy Guarantee */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Client-Side Security & Data Privacy</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                            <h3 className="text-sm font-bold text-slate-800">Zero Server Processing</h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Your PDF documents never leave your browser window. All extraction and compilation routines take place locally within WebAssembly and JavaScript engines.
                            </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                            <h3 className="text-sm font-bold text-slate-800">Compliance & Confidentiality</h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Ideal for processing sensitive legal contracts, NDA-protected technical specifications, and internal enterprise documentation without cloud leakage.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card 5: FAQ Section (Static non-collapsible cards) */}
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
                                q: "Does this compiler support scanned image-only PDF documents?",
                                a: "This tool extracts embedded vector text directly from PDF layer objects. For scanned document images that lack a text layer, OCR (Optical Character Recognition) preprocessing is required prior to Markdown conversion.",
                            },
                            {
                                q: "Is there a limit on how many pages or files I can process?",
                                a: "There are no artificial usage limits. The tool operates client-side with a strict 20 MB file size limit to prevent web browser memory exhaustion.",
                            },
                            {
                                q: "Can I choose specific pages to compile instead of the whole document?",
                                a: "Yes! Use the page preview grid in the left workspace panel to toggle individual page selections and compile only desired sections.",
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
                        name: "PDF to Markdown Compiler",
                        applicationCategory: "DeveloperApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 & WebAssembly.",
                        description:
                            "Convert PDF documents into clean, structured Markdown text directly in your browser. Preserves headings, lists, code blocks, and document tables with zero server uploads.",
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
                                name: "Does this compiler support scanned image-only PDF documents?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "This tool extracts embedded vector text directly from PDF layer objects. For scanned document images that lack a text layer, OCR preprocessing is required.",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}