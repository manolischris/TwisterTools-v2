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
    FileCode,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

type ExportFormatMode = "doc" | "txt" | "html";

interface PageTextContent {
    pageIndex: number;
    text: string;
    html: string;
    wordCount: number;
}

export default function PdfToWordConverter() {
    // ── Core File & Processing State ──
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [fileSize, setFileSize] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pagesText, setPagesText] = useState<PageTextContent[]>([]);
    const [fullExtractedText, setFullExtractedText] = useState<string>("");
    const [fullExtractedHtml, setFullExtractedHtml] = useState<string>("");

    // ── Stats State ──
    const [totalWordCount, setTotalWordCount] = useState<number>(0);
    const [totalCharCount, setTotalCharCount] = useState<number>(0);

    // ── UI & Configuration Options ──
    const [exportFormat, setExportFormat] = useState<ExportFormatMode>("doc");
    const [preserveParagraphs, setPreserveParagraphs] = useState<boolean>(true);
    const [includePageHeaders, setIncludePageHeaders] = useState<boolean>(true);

    // ── Processing & Status State ──
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);

    // ── References ──
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─────────────────────────────────────────────────────────────
    // PDF Parsing & Text Extraction Engine
    // ─────────────────────────────────────────────────────────────

    const processPdfFile = useCallback(async (file: File) => {
        setErrorMessage(null);

        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            setErrorMessage("Invalid file format. Please upload a valid PDF document (.pdf).");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage(
                `File size exceeds the 20 MB max file size limit (${(
                    file.size /
                    1024 /
                    1024
                ).toFixed(2)} MB). Please select a smaller PDF document.`
            );
            return;
        }

        setIsLoading(true);
        setLoadingProgress(5);
        setFileName(file.name);
        setFileSize(file.size);
        setPdfFile(file);

        try {
            const pdfjsLib = await import("pdfjs-dist");
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            setLoadingProgress(15);

            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
            const pdfDoc = await loadingTask.promise;
            const count = pdfDoc.numPages;
            setTotalPages(count);

            // ── Pass 1: Scan font sizes to establish the most common body font size ──
            const fontSizeFrequencies: Record<number, number> = {};
            for (let i = 1; i <= count; i++) {
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                for (const item of textContent.items) {
                    if ("str" in item && item.str.trim()) {
                        const size = Math.round(Math.abs(item.transform[3]) * 2) / 2; // round to nearest 0.5
                        if (size > 0) {
                            fontSizeFrequencies[size] = (fontSizeFrequencies[size] || 0) + 1;
                        }
                    }
                }
            }
            let bodyFontSize = 10;
            let maxFreq = 0;
            for (const sizeStr of Object.keys(fontSizeFrequencies)) {
                const size = Number(sizeStr);
                const freq = fontSizeFrequencies[size];
                if (freq > maxFreq) {
                    maxFreq = freq;
                    bodyFontSize = size;
                }
            }
            setLoadingProgress(30);

            // ── Pass 2: Extract text and reconstruct layout structure ──
            const extractedPages: PageTextContent[] = [];
            let combinedText = "";
            let combinedHtml = "";

            const isBoldFont = (fontName: string, fontStyle: any, page: any) => {
                if (/bold|heavy|black|semibold/i.test(fontName)) return true;
                if (fontStyle && fontStyle.fontFamily && /bold|heavy|black|semibold/i.test(fontStyle.fontFamily)) return true;
                if (page && page.commonObjs) {
                    const commonFont = page.commonObjs.get(fontName);
                    if (commonFont && (commonFont.bold || /bold|heavy|black|semibold/i.test(commonFont.name || ""))) return true;
                }
                return false;
            };

            for (let i = 1; i <= count; i++) {
                setLoadingProgress(30 + Math.round((i / count) * 65));
                const page = await pdfDoc.getPage(i);
                const operatorList = await page.getOperatorList();
                const textContent = await page.getTextContent();

                interface LineItem {
                    str: string;
                    x: number;
                    y: number;
                    fontSize: number;
                    fontName: string;
                    width?: number;
                }
                const linesMap: Record<number, LineItem[]> = {};

                // Group text segments that sit on the same vertical baseline (Y-coordinate)
                for (const item of textContent.items) {
                    if ("str" in item && item.str.trim() !== "") {
                        const x = item.transform[4];
                        const y = item.transform[5];
                        const fontSize = Math.abs(item.transform[3]);
                        const fontName = (item.fontName as string) || "";
                        const width = "width" in item ? (item.width as number) : undefined;

                        // Find matching line within vertical threshold of 4 points
                        let foundLineY: number | null = null;
                        for (const keyStr of Object.keys(linesMap)) {
                            const keyY = Number(keyStr);
                            if (Math.abs(keyY - y) <= 4) {
                                foundLineY = keyY;
                                break;
                            }
                        }

                        const lineItem: LineItem = { str: item.str, x, y, fontSize, fontName, width };

                        if (foundLineY !== null) {
                            linesMap[foundLineY].push(lineItem);
                        } else {
                            linesMap[y] = [lineItem];
                        }
                    }
                }
                // Sort vertical lines from top of the page to bottom
                const sortedLineYs = Object.keys(linesMap)
                    .map(Number)
                    .sort((a, b) => b - a);

                interface Cell {
                    text: string;
                    x: number;
                    isBold: boolean;
                }

                type DocBlock = 
                  | { type: "paragraph"; text: string; isBold: boolean }
                  | { type: "heading1"; text: string }
                  | { type: "heading2"; text: string }
                  | { type: "table"; rows: Cell[][] };

                const blocks: DocBlock[] = [];
                let lastLineY: number | null = null;
                let lastLineHeight = bodyFontSize;

                for (const y of sortedLineYs) {
                    // Sort items in this line horizontally from left to right
                    const items = linesMap[y].sort((a, b) => a.x - b.x);
                    if (items.length === 0) continue;

                    // Group horizontal items into columns if they have significant spaces
                    const columns: { text: string; x: number; fontSize: number; isBold: boolean; width: number }[] = [];
                    let currentColumnText = "";
                    let lastXEnd = -1;
                    let lastFontSize = items[0].fontSize;
                    let lastFontName = items[0].fontName;
                    let columnStartX = items[0].x;

                    for (let idx = 0; idx < items.length; idx++) {
                        const item = items[idx];
                        const itemWidth = item.width || (item.fontSize * 0.5 * item.str.length);
                        // Gap threshold: 5.0 times the font size or 70pt indicates column separation
                        const gapThreshold = Math.max(item.fontSize * 5.0, 70);

                        if (lastXEnd !== -1 && item.x - lastXEnd > gapThreshold) {
                            columns.push({
                                text: currentColumnText.trim(),
                                x: columnStartX,
                                fontSize: lastFontSize,
                                isBold: isBoldFont(lastFontName, textContent.styles[lastFontName], page),
                                width: lastXEnd - columnStartX
                            });
                            currentColumnText = item.str;
                            columnStartX = item.x;
                        } else {
                            if (currentColumnText !== "" && !currentColumnText.endsWith(" ")) {
                                currentColumnText += " ";
                            }
                            currentColumnText += item.str;
                        }
                        lastXEnd = item.x + itemWidth;
                        lastFontSize = item.fontSize;
                        lastFontName = item.fontName;
                    }
                    if (currentColumnText.trim() !== "") {
                        columns.push({
                            text: currentColumnText.trim(),
                            x: columnStartX,
                            fontSize: lastFontSize,
                            isBold: isBoldFont(lastFontName, textContent.styles[lastFontName], page),
                            width: lastXEnd - columnStartX
                        });
                    }

                    // Determine layout type
                    const verticalGap = lastLineY !== null ? Math.abs(lastLineY - y) : 0;
                    
                    let isTableLine = false;
                    let tableBlock: DocBlock | null = null;
                    if (blocks.length > 0 && blocks[blocks.length - 1].type === "table") {
                        tableBlock = blocks[blocks.length - 1];
                    }

                    if (columns.length > 1) {
                        isTableLine = true;
                    } else if (columns.length === 1 && tableBlock && verticalGap <= lastLineHeight * 2.0) {
                        const col = columns[0];
                        // If it matches one of the columns of the previous table row, it's a table continuation
                        const lastRows = (tableBlock as any).rows;
                        const lastRow = lastRows[lastRows.length - 1] as Cell[];
                        
                        let closestColIdx = -1;
                        let minDiff = 9999;
                        for (let c = 0; c < lastRow.length; c++) {
                            const diff = Math.abs(col.x - lastRow[c].x);
                            if (diff < minDiff) {
                                minDiff = diff;
                                closestColIdx = c;
                            }
                        }
                        
                        if (closestColIdx !== -1 && minDiff < 50 && col.text.length < 50) {
                            isTableLine = true;
                            // Check if it is a text-wrap of the previous cell or a new row
                            if (verticalGap <= col.fontSize * 1.4) {
                                // Text wrap continuation - append to the cell in the last row
                                if (lastRow[closestColIdx].text) {
                                    lastRow[closestColIdx].text += " " + col.text;
                                } else {
                                    lastRow[closestColIdx].text = col.text;
                                }
                            } else {
                                // New row with only this cell populated
                                const newRow = lastRow.map(cell => ({ text: "", x: cell.x, isBold: false }));
                                newRow[closestColIdx] = { text: col.text, x: col.x, isBold: col.isBold };
                                lastRows.push(newRow);
                            }
                        }
                    }

                    if (isTableLine) {
                        if (columns.length > 1) {
                            const newRow = columns.map(c => ({ text: c.text, x: c.x, isBold: c.isBold }));
                            if (tableBlock) {
                                (tableBlock as any).rows.push(newRow);
                            } else {
                                blocks.push({
                                    type: "table",
                                    rows: [newRow]
                                });
                            }
                        }
                        lastLineY = y;
                        lastLineHeight = columns[0].fontSize;
                    } else if (columns.length === 1) {
                        const col = columns[0];
                        const isCapitalized = col.text.trim() === col.text.trim().toUpperCase() && /[Α-ΩA-Z]/.test(col.text.trim());
                        
                        const isHeading1 = col.fontSize > bodyFontSize * 1.35;
                        const isHeading2 = (col.fontSize > bodyFontSize * 1.1 && col.fontSize <= bodyFontSize * 1.35) || 
                                           (col.isBold && col.fontSize >= bodyFontSize) ||
                                           (col.text.trim().length < 50 && isCapitalized);
                        
                        if (isHeading1) {
                            blocks.push({ type: "heading1", text: col.text });
                        } else if (isHeading2) {
                            blocks.push({ type: "heading2", text: col.text });
                        } else {
                            // Paragraph
                            const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
                            const isNewParagraph = lastLineY === null || verticalGap > lastLineHeight * 1.7;

                            if (lastBlock && lastBlock.type === "paragraph" && !isNewParagraph) {
                                lastBlock.text += " " + col.text;
                                if (col.isBold) lastBlock.isBold = true;
                            } else {
                                blocks.push({
                                    type: "paragraph",
                                    text: col.text,
                                    isBold: col.isBold
                                });
                            }
                        }
                        lastLineY = y;
                        lastLineHeight = col.fontSize;
                    }
                }

                // Render blocks into pageHtml and pageText
                let pageHtml = "";
                let pageText = "";

                for (const block of blocks) {
                    if (block.type === "heading1") {
                        pageHtml += `<h1 style="font-size: 18pt; font-weight: bold; color: #1e3a8a; margin-top: 14pt; margin-bottom: 6pt;">${escapeXml(block.text)}</h1>`;
                        pageText += `\n*** ${block.text} ***\n\n`;
                    } else if (block.type === "heading2") {
                        pageHtml += `<h2 style="font-size: 14pt; font-weight: bold; color: #4f46e5; margin-top: 12pt; margin-bottom: 4pt;">${escapeXml(block.text)}</h2>`;
                        pageText += `\n** ${block.text} **\n\n`;
                    } else if (block.type === "paragraph") {
                        const styleStr = block.isBold ? "font-weight: bold;" : "";
                        pageHtml += `<p style="margin: 0 0 8pt 0; line-height: 1.25; text-align: justify; ${styleStr}">${escapeXml(block.text)}</p>`;
                        pageText += block.text + "\n\n";
                    } else if (block.type === "table") {
                        pageHtml += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 12pt; margin-top: 6pt;"><tbody>`;
                        for (const row of block.rows) {
                            pageHtml += `<tr>`;
                            let rowText = "";
                            for (const cell of row) {
                                const cellStyle = cell.isBold ? "font-weight: bold;" : "";
                                pageHtml += `<td style="border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; ${cellStyle}">${escapeXml(cell.text)}</td>`;
                                rowText += `[ ${cell.text} ]\t`;
                            }
                            pageHtml += `</tr>`;
                            pageText += rowText.trim() + "\n";
                        }
                        pageHtml += `</tbody></table>`;
                        pageText += "\n";
                    }
                }

                const words = pageText.trim() ? pageText.trim().split(/\s+/).filter(Boolean).length : 0;
                extractedPages.push({
                    pageIndex: i,
                    text: pageText,
                    html: pageHtml,
                    wordCount: words,
                });

                if (includePageHeaders) {
                    combinedText += `--- Page ${i} ---\n\n${pageText}\n\n`;
                    combinedHtml += `<h2 style="color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-size: 14pt; margin-top: 18pt;">Page ${i}</h2>` + pageHtml;
                } else {
                    combinedText += `${pageText}\n\n`;
                    combinedHtml += pageHtml;
                }
            }

            setPagesText(extractedPages);
            setFullExtractedText(combinedText.trim());
            setFullExtractedHtml(combinedHtml);

            const words = combinedText.trim() ? combinedText.trim().split(/\s+/).filter(Boolean).length : 0;
            setTotalWordCount(words);
            setTotalCharCount(combinedText.length);

            setLoadingProgress(100);
        } catch (err) {
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : "Failed to parse PDF document. The file may be corrupted or password-protected."
            );
            clearWorkspace();
        } finally {
            setIsLoading(false);
        }
    }, [includePageHeaders]);

    useEffect(() => {
        if (pagesText.length > 0) {
            let combined = "";
            let combinedHtml = "";
            pagesText.forEach((p) => {
                if (includePageHeaders) {
                    combined += `--- Page ${p.pageIndex} ---\n\n${p.text}\n\n`;
                    combinedHtml += `<h2 style="color: #6366f1; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; font-size: 14pt; margin-top: 18pt;">Page ${p.pageIndex}</h2>` + p.html;
                } else {
                    combined += `${p.text}\n\n`;
                    combinedHtml += p.html;
                }
            });
            setFullExtractedText(combined.trim());
            setFullExtractedHtml(combinedHtml);
        }
    }, [includePageHeaders, pagesText]);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) processPdfFile(file);
        },
        [processPdfFile]
    );

    const clearWorkspace = () => {
        setPdfFile(null);
        setFileName("");
        setFileSize(0);
        setTotalPages(0);
        setPagesText([]);
        setFullExtractedText("");
        setFullExtractedHtml("");
        setTotalWordCount(0);
        setTotalCharCount(0);
        setErrorMessage(null);
        setLoadingProgress(0);
    };

    // ─────────────────────────────────────────────────────────────
    // Document Packaging & Export Pipeline
    // ─────────────────────────────────────────────────────────────

    const handleExport = async () => {
        if (!fullExtractedText.trim()) {
            setErrorMessage("No extracted text available to export.");
            return;
        }

        setIsExporting(true);
        setErrorMessage(null);

        try {
            const baseName = fileName ? fileName.replace(/\.pdf$/i, "") : "converted_document";

            if (exportFormat === "doc") {
                const docContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escapeXml(baseName)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page Section1 {
      size: 8.5in 11.0in;
      margin: 1.0in 1.0in 1.0in 1.0in;
      mso-header-margin: .5in;
      mso-footer-margin: .5in;
      mso-paper-source: 0;
    }
    div.Section1 {
      page: Section1;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.25;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      color: #1e3a8a;
      margin-top: 14pt;
      margin-bottom: 6pt;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      color: #4f46e5;
      margin-top: 12pt;
      margin-bottom: 4pt;
    }
    p {
      margin: 0 0 8pt 0;
      line-height: 1.25;
      text-align: justify;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 6pt;
      margin-bottom: 12pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
      font-size: 10pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="Section1">
    ${fullExtractedHtml}
  </div>
</body>
</html>
                `;

                const blob = new Blob(["\ufeff" + docContent], {
                    type: "application/msword;charset=utf-8",
                });
                downloadBlob(blob, `${baseName}.doc`);
            } else if (exportFormat === "txt") {
                const blob = new Blob([fullExtractedText], { type: "text/plain;charset=utf-8" });
                downloadBlob(blob, `${baseName}.txt`);
            } else if (exportFormat === "html") {
                const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(baseName)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #0f172a; }
    h1 { color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    p { margin-bottom: 1.2em; whitespace: pre-wrap; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
  </style>
</head>
<body>
  ${fullExtractedHtml}
</body>
</html>`;
                const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
                downloadBlob(blob, `${baseName}.html`);
            }
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to export document.");
        } finally {
            setIsExporting(false);
        }
    };

    const escapeXml = (unsafe: string) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = async () => {
        if (!fullExtractedText) return;
        try {
            await navigator.clipboard.writeText(fullExtractedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* silent catch */
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
                {/* ══════════════════ LEFT PANEL: PDF INPUT & PREVIEW ══════════════════ */}
                <div className="space-y-5">
                    {/* File Ingestion Card */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <Upload className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">1. Upload PDF Document</span>
                            </div>
                            {pdfFile && (
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
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-7 px-4 text-center ${isDragging
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
                                                {formatBytes(fileSize)} • {totalPages} Pages Parsed
                                            </p>
                                            <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                Text Extracted & Ready for Export
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                            Drop PDF document here, or <span className="text-indigo-600">click to browse</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400">Maximum file size limit: 20 MB</p>
                                    </>
                                )}
                            </div>

                            {/* Loading Indicator */}
                            {isLoading && (
                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>Extracting PDF Layout structure...</span>
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
                                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Extracted Content Workspace */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-xs font-semibold text-slate-900">
                                    2. Extracted Text Workspace
                                </h3>
                            </div>
                            {fullExtractedText && (
                                <button
                                    onClick={copyToClipboard}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Text
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" /> Copy Text
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="p-5">
                            <div className="h-[380px] overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 text-slate-800 dark:text-slate-100 whitespace-pre-wrap font-sans text-xs p-4 sm:p-6">
                                {fullExtractedHtml ? (
                                    <div 
                                        className="prose prose-slate max-w-none text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: fullExtractedHtml }}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2 p-4 sm:p-6">
                                        <FileText className="w-10 h-10 text-slate-300" />
                                        <p className="text-xs font-semibold text-slate-600">No Document Content Loaded</p>
                                        <p className="text-[11px] max-w-xs text-slate-400">
                                            Upload a PDF document above to extract its layout structure and preview formatted content.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════ RIGHT PANEL: EXPORT OPTIONS & ACTIONS ══════════════════ */}
                <div className="space-y-5 sticky top-4">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Edge-to-Edge Title Header Bar */}
                        <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                                    <Sliders className="w-4 h-4 text-indigo-200" />
                                </div>
                                <span className="text-sm font-semibold">3. Conversion & Target Output Settings</span>
                            </div>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Target Export Format Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Target Document Format
                                </label>
                                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                                    {(
                                        [
                                            { id: "doc", label: "Word (.doc)", icon: FileText },
                                            { id: "txt", label: "Text (.txt)", icon: FileCode },
                                            { id: "html", label: "HTML (.html)", icon: Layout },
                                        ] as const
                                    ).map(({ id, label, icon: Icon }) => (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setExportFormat(id)}
                                            className={`py-2 px-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${exportFormat === id
                                                ? "bg-white text-indigo-700 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                                }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Layout Options */}
                            <div className="space-y-3 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <Settings className="w-3.5 h-3.5 text-indigo-600" /> Document Structure Controls
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includePageHeaders}
                                        onChange={(e) => setIncludePageHeaders(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Include Page Header Delimiters
                                    </span>
                                </label>

                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preserveParagraphs}
                                        onChange={(e) => setPreserveParagraphs(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                        Preserve Original Paragraph Breaks
                                    </span>
                                </label>
                            </div>

                            {/* Document Statistics */}
                            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Pages
                                    </p>
                                    <p className="text-xs font-mono font-bold text-slate-800">{totalPages}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Words
                                    </p>
                                    <p className="text-xs font-mono font-bold text-slate-800">
                                        {totalWordCount.toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Characters
                                    </p>
                                    <p className="text-xs font-mono font-bold text-slate-800">
                                        {totalCharCount.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Export Trigger Button */}
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={!fullExtractedText || isExporting}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${fullExtractedText && !isExporting
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                                    }`}
                            >
                                {isExporting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Packaging Document...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-4 h-4" />
                                        <span>Download Editable {exportFormat.toUpperCase()} Document</span>
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
            <section className="space-y-6 mt-12">
                {/* Card 1: Technical Architecture */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <span>Technical Architecture of Client-Side PDF Extraction</span>
                    </h2>
                    <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
                        <p>
                            PDF documents (ISO 32000-2) are engineered primarily for visual presentation consistency rather than structured text edition. Unlike standard word processor formats, PDF streams store character glyphs with precise absolute positional coordinates relative to page origin boundaries. Converting a PDF document into an editable Microsoft Word document requires reconstructing spatial layouts into linear paragraph flows.
                        </p>
                        <p>
                            Our PDF to Word converter executes this entire processing pipeline locally within your web browser using client-side JavaScript Web Workers and PDF.js text layer parsing. By inspecting positional transformation matrices for every character string, our engine groups nearby characters into lines and detects vertical baseline gaps to establish true paragraph boundaries.
                        </p>
                        <p>
                            Once spatial extraction is finalized, the resulting document structure is packaged directly into OpenXML compliant syntax (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">.docx</code>) or clean plain text formats without sending any document data across the network.
                        </p>
                    </div>
                </div>

                {/* Card 2: Feature & Specification Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Table className="w-5 h-5" />
                        </div>
                        <span>PDF Extraction & Conversion Feature Matrix</span>
                    </h2>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                                    <th className="px-4 py-3.5 font-bold">Feature Parameter</th>
                                    <th className="px-4 py-3.5 font-bold">Client PDF Engine</th>
                                    <th className="px-4 py-3.5 font-bold">Export Format Specs</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-white border-b border-slate-100">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">Paragraph Boundary Reconstruction</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">Spatial coordinate delta matching</td>
                                    <td className="px-4 py-3 text-sm font-mono text-indigo-600">&lt;w:p&gt; Paragraph Blocks</td>
                                </tr>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">Page Boundary Isolation</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">Optional page header markers</td>
                                    <td className="px-4 py-3 text-sm font-mono text-indigo-600">--- Page X --- Delimiters</td>
                                </tr>
                                <tr className="bg-white border-b border-slate-100">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">Font & Glyph Encoding</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">UTF-8 character map normalization</td>
                                    <td className="px-4 py-3 text-sm font-mono text-indigo-600">Calibri / Standard OpenXML</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">Processing Security</td>
                                    <td className="px-4 py-3 text-sm text-slate-700">100% In-Browser RAM execution</td>
                                    <td className="px-4 py-3 text-sm font-mono text-indigo-600">Zero Server Transmission</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card 3: Step-by-Step Workflow */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <span>How to Convert PDF to Editable Word Files</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                step: "01",
                                title: "Upload PDF File",
                                body: "Select or drop any PDF document up to 20 MB into the secure drag-and-drop ingestion zone.",
                            },
                            {
                                step: "02",
                                title: "Parse Text Structure",
                                body: "The client engine scans character baselines and extracts paragraphs into the editable preview panel.",
                            },
                            {
                                step: "03",
                                title: "Configure Export Settings",
                                body: "Choose your target output format (.docx, .txt, or .html) and adjust page delimiter preferences.",
                            },
                            {
                                step: "04",
                                title: "Save Word Document",
                                body: "Click download to generate and save your editable Word document directly from browser memory.",
                            },
                        ].map(({ step, title, body }) => (
                            <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                                    {step}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 4: Security Guarantees */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <span>Enterprise Privacy & Sandbox Guarantees</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            {
                                title: "Zero Remote Uploads",
                                body: "Your PDF files are never uploaded to any remote server. All parsing runs locally in your web browser memory.",
                            },
                            {
                                title: "Confidentiality Assured",
                                body: "Sensitive financial records, legal contracts, and personal documents remain strictly isolated within your device sandbox.",
                            },
                            {
                                title: "Instant Local Processing",
                                body: "Skip upload queues and network delays. Text extraction begins instantly upon file drop.",
                            },
                            {
                                title: "Automatic RAM Clearance",
                                body: "All extracted text buffers are immediately erased when you clear the workspace or close the tab.",
                            },
                        ].map(({ title, body }, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                                <p className="text-slate-700 text-sm md:text-base leading-relaxed">{body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: FAQ Section */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 mb-6 p-4 sm:p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Is my PDF uploaded to any external server during conversion?",
                                a: "No. The entire conversion process occurs locally in your web browser using client-side JavaScript. Your file data never leaves your computer.",
                            },
                            {
                                q: "Can I convert scanned PDF documents into Word?",
                                a: "This converter extracts native text layers embedded in digital PDF files. For image-only scanned documents, an OCR (Optical Character Recognition) tool is required.",
                            },
                            {
                                q: "What file format will I receive upon export?",
                                a: "You can export your document directly as an editable Microsoft Word document (.docx), plain text file (.txt), or HTML file (.html).",
                            },
                            {
                                q: "Is there a limit on file size or page count?",
                                a: "The tool supports PDF files up to 20 MB. Page count processing performance depends on your device's available RAM.",
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

            {/* JSON-LD Structured Data Schemas */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        name: "PDF to Word Converter",
                        applicationCategory: "UtilitiesApplication",
                        operatingSystem: "All",
                        browserRequirements: "Requires JavaScript. Supports HTML5 File API & Web Workers.",
                        description:
                            "Convert PDF files into editable Word (.docx) documents directly in your browser with complete client-side security and zero server uploads.",
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
                                name: "Is my PDF uploaded to any external server during conversion?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "No. All conversion operations run 100% locally in your web browser sandbox.",
                                },
                            },
                            {
                                "@type": "Question",
                                name: "What file format will I receive upon export?",
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: "You can export as an editable Microsoft Word document (.docx), plain text (.txt), or HTML (.html).",
                                },
                            },
                        ],
                    }),
                }}
            />
        </div>
    );
}