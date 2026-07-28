"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  FileType2,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  RotateCw,
  RotateCcw,
  Check,
  Maximize2,
  Shield,
  HelpCircle,
  Cpu,
  Table,
  Workflow,
  Layers3,
  Undo,
  FileDown,
  CheckSquare,
  Square,
  ArrowRightLeft,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

interface PdfPageItem {
  pageIndex: number;
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
  selected: boolean;
  width: number;
  height: number;
}

export default function RotatePdf() {
  // ── Core State ──
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);

  // ── PDF Loader & Page Preview Renderer ──
  const processPdfFile = useCallback(async (file: File) => {
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
      const uint8Array = new Uint8Array(arrayBuffer);
      pdfBytesRef.current = uint8Array;

      const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
      const pdfDocInstance = await loadingTask.promise;
      const pageCount = pdfDocInstance.numPages;
      const renderedPages: PdfPageItem[] = [];

      for (let i = 1; i <= pageCount; i++) {
        setProcessingStatus(`Rendering page preview ${i} of ${pageCount}...`);
        const page = await pdfDocInstance.getPage(i);
        const initialRotation = page.rotate || 0;
        const viewport = page.getViewport({ scale: 0.8 });

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

          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

          renderedPages.push({
            pageIndex: i - 1,
            dataUrl,
            rotation: 0, // Delta rotation added by user
            selected: true,
            width: viewport.width,
            height: viewport.height,
          });
        }
      }

      setPages(renderedPages);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load and render the selected PDF file."
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  }, []);

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

  // ── Rotation Logic ──
  const rotateSinglePage = (index: number, angleDelta: number) => {
    setPages((prev) =>
      prev.map((p, i) => {
        if (i === index) {
          const newRotation = (p.rotation + angleDelta + 360) % 360;
          return { ...p, rotation: newRotation };
        }
        return p;
      })
    );
  };

  const rotateSelectedPages = (angleDelta: number) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.selected) {
          const newRotation = (p.rotation + angleDelta + 360) % 360;
          return { ...p, rotation: newRotation };
        }
        return p;
      })
    );
  };

  const resetAllRotations = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: 0 })));
  };

  const togglePageSelection = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = pages.every((p) => p.selected);
    setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const clearWorkspace = () => {
    setPdfFile(null);
    pdfBytesRef.current = null;
    setPages([]);
    setErrorMessage(null);
    setPreviewUrl(null);
  };

  // ── PDF Export Engine (Using pdf-lib) ──
  const downloadRotatedPdf = async () => {
    if (!pdfBytesRef.current || pages.length === 0) return;

    setIsProcessing(true);
    setProcessingStatus("Applying rotations and compiling PDF...");

    try {
      const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
      const pdfPages = pdfDoc.getPages();

      pages.forEach((pageItem) => {
        if (pageItem.rotation !== 0) {
          const existingPage = pdfPages[pageItem.pageIndex];
          const currentAngle = existingPage.getRotation().angle;
          const finalAngle = (currentAngle + pageItem.rotation) % 360;
          existingPage.setRotation(degrees(finalAngle));
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pdfFile?.name.replace(/\.pdf$/i, "") || "document"}_rotated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate rotated PDF file."
      );
    } finally {
      setIsProcessing(false);
      setProcessingStatus(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalRotatedPages = pages.filter((p) => p.rotation !== 0).length;

  return (
    <div className="w-full space-y-8">
      {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: UPLOAD & THUMBNAILS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-800 border-b border-slate-700 px-5 py-3 min-h-[56px] flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <FileType2 className="w-4 h-4 text-indigo-300" />
                <span className="text-sm font-semibold">1. Page View & Selector</span>
              </div>
              <div className="flex items-center gap-2">
                {pages.length > 0 ? (
                  <button
                    onClick={clearWorkspace}
                    className="px-2.5 py-1.5 text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                ) : (
                  <span className="inline-block px-2.5 py-1.5 text-[11px] opacity-0 pointer-events-none select-none">
                    <Trash2 className="w-3 h-3 inline" /> Clear
                  </span>
                )}
                {pdfFile && (
                  <span className="text-xs font-mono text-indigo-200">
                    {formatBytes(pdfFile.size)}
                  </span>
                )}
              </div>
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
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-7 px-4 text-center ${
                  isDragging
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
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 mb-0.5">
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

              {/* Page Selection Controls Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-slate-700">
                  Document Pages ({pages.length})
                </span>
                {pages.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {pages.every((p) => p.selected) ? (
                      <>
                        <Square className="w-3 h-3" /> Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-3 h-3" /> Select All
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Grid Preview Container with Fixed Height */}
              {pages.length === 0 ? (
                <div className="h-[360px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                  <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload a PDF document to preview, select, and adjust page orientations.
                  </p>
                </div>
              ) : (
                <div className="h-[360px] overflow-y-auto pr-1 grid grid-cols-2 gap-3">
                  {pages.map((page) => (
                    <div
                      key={page.pageIndex}
                      className={`group relative rounded-xl border p-2 transition-all flex flex-col items-center justify-between shadow-sm ${
                        page.selected
                          ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30"
                          : "border-slate-200 bg-slate-50/50 opacity-60"
                      }`}
                    >
                      {/* Top Action Bar */}
                      <div className="w-full flex items-center justify-between mb-1.5 px-1">
                        <button
                          type="button"
                          onClick={() => togglePageSelection(page.pageIndex)}
                          className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-700 hover:text-indigo-600"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${
                              page.selected ? "bg-indigo-600" : "bg-slate-300"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          Page {page.pageIndex + 1}
                        </button>
                        {page.rotation !== 0 && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            +{page.rotation}°
                          </span>
                        )}
                      </div>

                      {/* Canvas Render with Dynamic Rotation Preview */}
                      <div className="w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group/thumb flex items-center justify-center p-2">
                        <div
                          className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
                          style={{ transform: `rotate(${page.rotation}deg)` }}
                        >
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageIndex + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewUrl(page.dataUrl)}
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quick Single Page Rotate Controls */}
                      <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-slate-100 px-1">
                        <button
                          type="button"
                          onClick={() => rotateSinglePage(page.pageIndex, -90)}
                          className="p-1 rounded hover:bg-slate-200/80 text-slate-600 transition-colors"
                          title="Rotate 90° Counter-Clockwise"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {page.width} × {page.height}
                        </span>
                        <button
                          type="button"
                          onClick={() => rotateSinglePage(page.pageIndex, 90)}
                          className="p-1 rounded hover:bg-slate-200/80 text-slate-600 transition-colors"
                          title="Rotate 90° Clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: ROTATION CONTROLS & EXPORT ══════════════════ */}
        <div className="space-y-5 sticky top-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-3 min-h-[56px] flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <RotateCw className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">2. Batch Rotation & Output</span>
              </div>
              <div className="w-[68px]" />
            </div>

            <div className="p-5 space-y-5">
              {/* Batch Controls for Selected Pages */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">
                  Batch Rotate Selected Pages ({pages.filter((p) => p.selected).length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={pages.filter((p) => p.selected).length === 0}
                    onClick={() => rotateSelectedPages(-90)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-700 flex flex-col items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold">90° Left</span>
                  </button>
                  <button
                    type="button"
                    disabled={pages.filter((p) => p.selected).length === 0}
                    onClick={() => rotateSelectedPages(180)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-700 flex flex-col items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold">180° Flip</span>
                  </button>
                  <button
                    type="button"
                    disabled={pages.filter((p) => p.selected).length === 0}
                    onClick={() => rotateSelectedPages(90)}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 text-slate-700 flex flex-col items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RotateCw className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold">90° Right</span>
                  </button>
                </div>
              </div>

              {/* Reset Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={totalRotatedPages === 0}
                  onClick={resetAllRotations}
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo className="w-3.5 h-3.5" />
                  Reset All Rotations
                </button>
              </div>

              {/* Status Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Total Document Pages:</span>
                  <span className="font-mono font-bold text-slate-800">{pages.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Selected for Action:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {pages.filter((p) => p.selected).length}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
                  <span className="text-indigo-900 font-bold">Pages Modified:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {totalRotatedPages} page{totalRotatedPages !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Export Download Button */}
              <button
                type="button"
                onClick={downloadRotatedPdf}
                disabled={pages.length === 0 || isProcessing}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  pages.length > 0 && !isProcessing
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{processingStatus || "Processing PDF..."}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Save & Download Rotated PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL-SCREEN PREVIEW MODAL ── */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-lg max-h-[85vh] flex flex-col items-center space-y-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">Page Preview</span>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 bg-slate-100 rounded-lg"
              >
                Close (ESC)
              </button>
            </div>
            <img
              src={previewUrl}
              alt="Page Full View"
              className="max-w-full max-h-[70vh] object-contain rounded-lg border"
            />
          </div>
        </div>
      )}

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
            <span>Technical Architecture of Client-Side PDF Orientation Fixing</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Rotating pages within a PDF requires modifying the internal page object dictionary's <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">/Rotate</code> attribute key. Traditional desktop tools re-encode or re-compress document pages, which leads to generational loss in quality or bloated file sizes. Our tool executes client-side page orientation transforms using pure WebAssembly binary manipulators.
            </p>
            <p>
              Powered by <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> and HTML5 rendering pipelines, rotated PDF metadata is written directly to the document object model in your browser memory. Vector paths, embedded fonts, layers, and form fields remain 100% untouched and crisp.
            </p>
          </div>
        </div>

        {/* Card 2: Rotation Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Table className="w-5 h-5" />
            </div>
            <span>Rotation Matrix & Orientation Options</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold">Transformation</th>
                  <th className="px-4 py-3.5 font-bold">Angle Delta</th>
                  <th className="px-4 py-3.5 font-bold">Internal PDF Spec Operator</th>
                  <th className="px-4 py-3.5 font-bold">Primary Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Clockwise 90°</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">+90 Deg</td>
                  <td className="px-4 py-3 font-mono text-xs">/Rotate 90</td>
                  <td className="px-4 py-3">Fix sidewall scans & landscape tables</td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">Counter-Clockwise 90°</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">-90 / 270 Deg</td>
                  <td className="px-4 py-3 font-mono text-xs">/Rotate 270</td>
                  <td className="px-4 py-3">Fix inverted mobi-scans & mobile uploads</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">180° Inversion</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">+180 Deg</td>
                  <td className="px-4 py-3 font-mono text-xs">/Rotate 180</td>
                  <td className="px-4 py-3">Fix upside-down feeder scan batches</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: How To Step-by-Step */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Workflow className="w-5 h-5" />
            </div>
            <span>How to Rotate PDF Pages Online</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Target PDF",
                body: "Drag and drop your document into the upload area or select it from your device storage.",
              },
              {
                step: "02",
                title: "Select & Inspect Pages",
                body: "Choose individual pages using the checkmarks or click Select All to batch-modify the document.",
              },
              {
                step: "03",
                title: "Apply Rotation Angle",
                body: "Click 90° Clockwise, Counter-Clockwise, or 180° Flip buttons to fix page orientation.",
              },
              {
                step: "04",
                title: "Export Rotated PDF",
                body: "Click Save & Download Rotated PDF to export your re-oriented file instantaneously.",
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
            <span>Enterprise-Grade Privacy & Security Sandbox</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Client-Side Processing",
                body: "Your PDF document is never transmitted to an external server or saved on cloud infrastructure.",
              },
              {
                title: "Metadata & Content Integrity",
                body: "Only orientation metadata markers are updated. Font definitions, images, and text streams remain untouched.",
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
                q: "Does rotating PDF pages degrade text or image quality?",
                a: "No. Rotating PDF pages via our tool updates internal orientation metadata flags. Vector art, raster graphics, and text retain 100% original quality.",
              },
              {
                q: "Can I rotate individual pages instead of the whole document?",
                a: "Yes. You can rotate single pages individually using the quick controls on each thumbnail or select specific pages to apply batch rotations.",
              },
              {
                q: "Is there a file size limit for rotating PDFs?",
                a: "Our browser processing engine supports documents up to 20 MB directly in local memory.",
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
            name: "Rotate PDF Pages & Orientation Fixer",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
            description:
              "Rotate individual or batch PDF pages online directly in your browser. Lossless orientation correction with zero cloud uploads.",
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
                name: "Does rotating PDF pages degrade text or image quality?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Rotating PDF pages via our tool updates internal orientation metadata flags. Vector art, raster graphics, and text retain 100% original quality.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}