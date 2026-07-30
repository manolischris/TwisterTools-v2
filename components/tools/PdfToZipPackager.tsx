"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Archive,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Settings,
  HelpCircle,
  Cpu,
  Table,
  Workflow,
  Shield,
  FileDown,
  Layers3,
  FileType2,
  Check,
  FolderArchive,
  Maximize2,
  Sliders,
  FileText,
  PackageCheck,
  Layers,
  Lock,
} from "lucide-react";

type ImageQuality = "standard" | "high" | "ultra";
type PackMode = "images" | "pages";
type ImageFormat = "jpeg" | "png";

interface RenderedPage {
  pageIndex: number;
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  selected: boolean;
}

export default function PdfToZipPackager() {
  // ── Core State ──
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [packMode, setPackMode] = useState<PackMode>("images");
  const [quality, setQuality] = useState<ImageQuality>("high");
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [zipFileName, setZipFileName] = useState<string>("extracted_pages");
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // ── Processing & UI State ──
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);

  // ─────────────────────────────────────────────────────────────
  // PDF Reader & Page Processing Engine
  // ─────────────────────────────────────────────────────────────

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
    setZipFileName(file.name.replace(/\.pdf$/i, "") + "_archive");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      pdfBytesRef.current = uint8Array;

      const loadingTask = pdfjsLib.getDocument({ data: uint8Array.slice() });
      const pdfDocInstance = await loadingTask.promise;
      const pageCount = pdfDocInstance.numPages;
      const renderedPages: RenderedPage[] = [];

      for (let i = 1; i <= pageCount; i++) {
        setProcessingStatus(`Rendering preview ${i} of ${pageCount}...`);
        const page = await pdfDocInstance.getPage(i);
        const viewport = page.getViewport({ scale: 1.0 });

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

          const byteString = atob(dataUrl.split(",")[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let j = 0; j < byteString.length; j++) {
            ia[j] = byteString.charCodeAt(j);
          }
          const blob = new Blob([ab], { type: "image/jpeg" });

          renderedPages.push({
            pageIndex: i - 1,
            dataUrl,
            blob,
            width: viewport.width,
            height: viewport.height,
            selected: true,
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
    setZipFileName("extracted_pages");
  };

  // ─────────────────────────────────────────────────────────────
  // ZIP Compression & Packaging Engine
  // ─────────────────────────────────────────────────────────────

  const generateAndDownloadZip = async () => {
    const selectedPages = pages.filter((p) => p.selected);
    if (selectedPages.length === 0 || !pdfBytesRef.current) return;

    setIsProcessing(true);
    try {
      const JSZip = (await import("jszip")).default;
      const { PDFDocument } = await import("pdf-lib");
      const zip = new JSZip();

      const baseName = zipFileName.trim() || "extracted_archive";

      if (packMode === "images") {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ data: pdfBytesRef.current.slice() });
        const pdfDocInstance = await loadingTask.promise;

        let scale = 2.0833;
        if (quality === "high") {
          scale = 4.1667;
        } else if (quality === "ultra") {
          scale = 8.3333;
        }

        const mimeType = format === "png" ? "image/png" : "image/jpeg";
        const extension = format === "png" ? "png" : "jpg";

        for (let idx = 0; idx < selectedPages.length; idx++) {
          const pageItem = selectedPages[idx];
          setProcessingStatus(`Rendering page ${idx + 1} of ${selectedPages.length} for ZIP...`);

          const page = await pdfDocInstance.getPage(pageItem.pageIndex + 1);
          const viewport = page.getViewport({ scale });

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

            const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), mimeType, quality === "ultra" ? 0.98 : 0.92);
            });

            if (blob) {
              const fileName = `page_${String(pageItem.pageIndex + 1).padStart(3, "0")}.${extension}`;
              zip.file(fileName, blob);
            }
          }
        }
      } else {
        // Individual PDF Mode
        const sourcePdfDoc = await PDFDocument.load(pdfBytesRef.current.slice());

        for (let idx = 0; idx < selectedPages.length; idx++) {
          const pageItem = selectedPages[idx];
          setProcessingStatus(`Splitting page ${idx + 1} of ${selectedPages.length} into PDF...`);

          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(sourcePdfDoc, [pageItem.pageIndex]);
          singlePageDoc.addPage(copiedPage);

          const pdfBytes = await singlePageDoc.save();
          const fileName = `page_${String(pageItem.pageIndex + 1).padStart(3, "0")}.pdf`;
          zip.file(fileName, pdfBytes);
        }
      }

      setProcessingStatus("Compressing ZIP archive...");
      const zipContent = await zip.generateAsync({ type: "blob" });

      const url = URL.createObjectURL(zipContent);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate ZIP archive.");
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

  const dpiScale = quality === "ultra" ? 8.3333 : quality === "high" ? 4.1667 : 2.0833;
  const formatMultiplier = format === "png" ? 3.5 : 0.8;
  const totalSelectedSizeEstimate = packMode === "images"
    ? pages.filter((p) => p.selected).reduce((acc, curr) => acc + curr.blob.size * Math.pow(dpiScale, 1.5) * formatMultiplier, 0)
    : (pdfFile ? (pdfFile.size / Math.max(1, pages.length)) * pages.filter((p) => p.selected).length : 0);

  return (
    <div className="w-full space-y-8">
      {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: UPLOAD & PAGE SELECTION ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Edge-to-Edge Title Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Archive className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">1. Source Document & Pages</h2>
                  <p className="text-xs text-indigo-100/80">Upload PDF and select target pages</p>
                </div>
              </div>
              {pages.length > 0 && (
                <button
                  onClick={clearWorkspace}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg transition-all flex items-center gap-1.5 border border-rose-400/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear PDF
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
                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-8 px-4 text-center ${
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

              {/* Page Selection Thumbnails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      PDF Pages ({pages.length})
                    </span>
                    {pages.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        {pages.every((p) => p.selected) ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>
                  {pdfFile && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      File Size: {formatBytes(pdfFile.size)}
                    </span>
                  )}
                </div>

                {pages.length === 0 ? (
                  <div className="h-[320px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                    <Layers3 className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No PDF Loaded</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Upload a document above to extract pages into a compressed ZIP package.
                    </p>
                  </div>
                ) : (
                  <div className="h-[320px] overflow-y-auto pr-1 grid grid-cols-2 gap-3">
                    {pages.map((page) => (
                      <div
                        key={page.pageIndex}
                        onClick={() => togglePageSelection(page.pageIndex)}
                        className={`group relative rounded-xl border p-2 cursor-pointer transition-all flex flex-col items-center justify-between shadow-sm ${
                          page.selected
                            ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500/30"
                            : "border-slate-200 bg-slate-50/50 hover:border-slate-300 opacity-60"
                        }`}
                      >
                        <div className="w-full flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            Page {page.pageIndex + 1}
                          </span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                              page.selected ? "bg-indigo-600" : "bg-slate-300"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group/thumb flex items-center justify-center">
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageIndex + 1}`}
                            className="h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewUrl(page.dataUrl);
                            }}
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <Maximize2 className="w-5 h-5" />
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                          {page.width} × {page.height} px
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: ZIP CONFIGURATION ══════════════════ */}
        <div className="space-y-5 sticky top-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Edge-to-Edge Title Bar */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Sliders className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight">2. ZIP Output Configuration</h2>
                  <p className="text-xs text-indigo-100/80">Configure archive structure and parameters</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Archive Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">ZIP File Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={zipFileName}
                    onChange={(e) => setZipFileName(e.target.value)}
                    placeholder="extracted_archive"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">.zip</span>
                </div>
              </div>

              {/* Extraction Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800">Archive Content Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "images" as PackMode, label: "Images Archive", sub: "JPG/PNG per page" },
                    { id: "pages" as PackMode, label: "PDF Archive", sub: "1-Page PDF per page" },
                  ].map(({ id, label, sub }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPackMode(id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        packMode === id
                          ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                          : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">{label}</p>
                      <p className="text-[10px] text-slate-500">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Format & DPI Options (Conditional for Images Mode) */}
              {packMode === "images" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">Target Image Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "jpeg" as ImageFormat, label: "JPG / JPEG", sub: "Compressed Image" },
                        { id: "png" as ImageFormat, label: "PNG", sub: "Lossless Crisp" },
                      ].map(({ id, label, sub }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setFormat(id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            format === id
                              ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                          }`}
                        >
                          <p className="text-xs font-bold">{label}</p>
                          <p className="text-[10px] text-slate-500">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800">Image Resolution DPI</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "standard" as ImageQuality, label: "Standard", sub: "150 DPI" },
                        { id: "high" as ImageQuality, label: "High", sub: "300 DPI" },
                        { id: "ultra" as ImageQuality, label: "Ultra HD", sub: "600 DPI" },
                      ].map(({ id, label, sub }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setQuality(id)}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            quality === id
                              ? "bg-indigo-50/60 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500/30"
                              : "bg-slate-50/50 border-slate-200 hover:bg-slate-100/50 text-slate-700"
                          }`}
                        >
                          <p className="text-xs font-bold">{label}</p>
                          <p className="text-[10px] text-slate-500">{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Job Summary Panel */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Selected Items:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {pages.filter((p) => p.selected).length} / {pages.length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Archive Format:</span>
                  <span className="font-mono font-bold text-slate-800 uppercase">
                    {packMode === "images" ? `${format} in ZIP` : "PDF in ZIP"}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200">
                  <span className="text-indigo-900 font-bold">Est. ZIP Archive Size:</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatBytes(totalSelectedSizeEstimate)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={generateAndDownloadZip}
                disabled={pages.filter((p) => p.selected).length === 0 || isProcessing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  pages.filter((p) => p.selected).length > 0 && !isProcessing
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{processingStatus || "Building ZIP Package..."}</span>
                  </>
                ) : (
                  <>
                    <FolderArchive className="w-4 h-4" />
                    <span>Build & Download ZIP Package</span>
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
      <section className="space-y-6 mt-12">
        {/* Card 1: Technical Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <span>Technical Architecture of Client-Side PDF ZIP Packaging</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Packaging individual PDF pages or extracted page graphics into a compressed archive is traditionally executed via server-side utilities like Imagemagick or Poppler. TwisterTools 2.0 re-architects this pipeline directly inside client memory utilizing high-performance WebAssembly and JavaScript binary processing. Combining <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdfjs-dist</code> for vector canvas rasterization, <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">pdf-lib</code> for PDF document manipulation, and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">JSZip</code> for DEFLATE archive compilation, your browser executes complete archive generation securely on-device.
          </p>
        </div>

        {/* Card 2: Packaging Specifications Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Table className="w-5 h-5" />
            </div>
            <span>Archive Content & Resolution Technical Matrix</span>
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold">Extraction Mode</th>
                  <th className="px-4 py-3.5 font-bold">DPI Density</th>
                  <th className="px-4 py-3.5 font-bold">ZIP Contents</th>
                  <th className="px-4 py-3.5 font-bold">Primary Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Images (JPG Standard)</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">150 DPI</td>
                  <td className="px-4 py-3">Compressed JPG per page</td>
                  <td className="px-4 py-3">Email distribution & web presentation previews</td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">Images (PNG Ultra)</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">600 DPI</td>
                  <td className="px-4 py-3">Lossless PNG per page</td>
                  <td className="px-4 py-3">Desktop publishing & archival image preservation</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Single-Page PDFs</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">Vector Native</td>
                  <td className="px-4 py-3">1-page standalone PDF files</td>
                  <td className="px-4 py-3">Batch document filing & individual record management</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Workflow className="w-5 h-5" />
            </div>
            <span>How to Package PDF Pages into a ZIP Archive</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Target PDF",
                body: "Drag and drop your PDF document into the dropzone. Page thumbnails auto-generate instantaneously.",
              },
              {
                step: "02",
                title: "Select Desired Pages",
                body: "Filter individual pages using visual checkbox overlays or choose Select All to package the full document.",
              },
              {
                step: "03",
                title: "Configure Packaging",
                body: "Specify your archive name, select between image or standalone PDF extraction modes, and set output DPI.",
              },
              {
                step: "04",
                title: "Build & Download",
                body: "Click Build & Download ZIP Package to compile compressed binary archives locally on your machine.",
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <span>Enterprise Privacy & Zero-Knowledge Architecture</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "100% On-Device Processing",
                body: "Your PDF documents and extracted page assets remain strictly inside your local browser memory space. No remote web servers receive your files.",
              },
              {
                title: "Ephemeral Memory Clearing",
                body: "All generated image buffers and zip binary blobs are released from browser memory immediately upon clearing or navigating away.",
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
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Are my PDF files uploaded to external servers during archive creation?",
                a: "No. PDF rendering, image conversion, and JSZip compression take place 100% inside your browser environment without sending data to any external server.",
              },
              {
                q: "What is the difference between Images Archive and PDF Archive mode?",
                a: "Images Archive extracts each selected PDF page as an individual JPG or PNG image inside the ZIP. PDF Archive splits each page into a separate 1-page PDF document file inside the ZIP.",
              },
              {
                q: "Is there a limit on how many pages I can package at once?",
                a: "There is no programmatic page count limit. Modern web browsers can comfortably process multi-hundred-page PDFs directly within system RAM.",
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
            name: "PDF to ZIP Archive Packager",
            applicationCategory: "UtilitiesApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & WebAssembly.",
            description:
              "Package PDF pages or extracted page graphics into a compressed ZIP archive directly in your browser with zero server uploads.",
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
                name: "Are my PDF files uploaded to external servers during archive creation?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All PDF rendering, image conversion, and JSZip compression take place 100% inside your browser environment.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}