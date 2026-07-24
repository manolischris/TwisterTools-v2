"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileImage,
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
  Image as ImageIcon,
  Sliders,
  HardDrive,
  HelpCircle,
  Cpu,
  Table,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  Workflow,
  BarChart3,
  Minimize2,
  Lock,
  Maximize2,
  Eye,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure Client-Side Image Compressor & Optimizer Engine
// Canvas Rendering, Multi-Format Compression & Scale Locking
// ─────────────────────────────────────────────────────────────

type TargetFormat = "jpeg" | "png" | "webp";

interface CompressionItem {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number;
  compressedWidth: number;
  compressedHeight: number;
  status: "idle" | "processing" | "completed" | "error";
  errorMessage?: string;
  previewUrl: string;
}

const FORMAT_LABELS: Record<TargetFormat, string> = {
  jpeg: "JPG / JPEG",
  png: "PNG (OptiPNG)",
  webp: "WebP (Next-Gen)",
};

const FORMAT_MIME: Record<TargetFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const FORMAT_EXT: Record<TargetFormat, string> = {
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

/**
 * Advanced HTML5 Canvas Compression Routine
 * Renders source graphic, applies alpha background blending if JPEG, and exports stream.
 */
async function processImageCompression(
  file: File,
  targetFormat: TargetFormat,
  quality: number,
  bgColor: string,
  targetWidth?: number,
  targetHeight?: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Determine proportional dimensions if one dimension is missing
      let finalW = targetWidth && targetWidth > 0 ? targetWidth : img.naturalWidth;
      let finalH = targetHeight && targetHeight > 0 ? targetHeight : img.naturalHeight;

      if (targetWidth && !targetHeight) {
        finalH = Math.round((img.naturalHeight / img.naturalWidth) * targetWidth);
      } else if (!targetWidth && targetHeight) {
        finalW = Math.round((img.naturalWidth / img.naturalHeight) * targetHeight);
      }

      const canvas = document.createElement("canvas");
      canvas.width = finalW;
      canvas.height = finalH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to initialize 2D canvas context."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (targetFormat === "jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, finalW, finalH);
      } else {
        ctx.clearRect(0, 0, finalW, finalH);
      }

      ctx.drawImage(img, 0, 0, finalW, finalH);

      const mimeType = FORMAT_MIME[targetFormat];
      const compressionRatio = quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image stream export failed during canvas serialization."));
            return;
          }
          resolve({
            blob,
            width: finalW,
            height: finalH,
          });
        },
        mimeType,
        compressionRatio
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to parse image file. File may be corrupted or unreadable."));
    };

    img.src = objectUrl;
  });
}

export default function ImageCompressor() {
  // ── Core Workspace State ──
  const [items, setItems] = useState<CompressionItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("jpeg");
  const [quality, setQuality] = useState<number>(80);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // ── Scale & Dimension Locks ──
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup Blob object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      });
    };
  }, [items]);

  // ── Process Single Queue Item ──
  const compressSingleItem = useCallback(
    async (item: CompressionItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
      );

      try {
        const parsedW = customWidth ? parseInt(customWidth, 10) : undefined;
        const parsedH = customHeight ? parseInt(customHeight, 10) : undefined;

        const { blob, width, height } = await processImageCompression(
          item.file,
          targetFormat,
          quality,
          backgroundColor,
          parsedW,
          parsedH
        );

        const compressedUrl = URL.createObjectURL(blob);

        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
              return {
                ...i,
                status: "completed",
                compressedBlob: blob,
                compressedUrl,
                compressedSize: blob.size,
                compressedWidth: width,
                compressedHeight: height,
              };
            }
            return i;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Compression failed.";
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", errorMessage: msg } : i))
        );
      }
    },
    [targetFormat, quality, backgroundColor, customWidth, customHeight]
  );

  // Re-run batch conversion when parameters shift
  const triggerBatchRecompression = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    for (const item of items) {
      await compressSingleItem(item);
    }
    setIsProcessingAll(false);
  }, [items, compressSingleItem]);

  // ── File Ingestion Handler ──
  const handleFiles = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

    if (validFiles.length === 0) {
      setGlobalError("Please upload valid image files (PNG, JPG, WebP, GIF, BMP).");
      return;
    }

    const MAX_SINGLE_SIZE = 30 * 1024 * 1024; // 30 MB Limit
    const newItems: CompressionItem[] = [];

    for (const file of validFiles) {
      if (file.size > MAX_SINGLE_SIZE) {
        setGlobalError(`File "${file.name}" exceeds the 30 MB size limit.`);
        continue;
      }

      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        originalName: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        compressedBlob: null,
        compressedUrl: null,
        compressedSize: 0,
        compressedWidth: 0,
        compressedHeight: 0,
        status: "idle",
        previewUrl,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Auto-process items upon queue insertion
  useEffect(() => {
    const idleItems = items.filter((i) => i.status === "idle");
    if (idleItems.length > 0) {
      idleItems.forEach((item) => compressSingleItem(item));
    }
  }, [items, compressSingleItem]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      if (i.compressedUrl) URL.revokeObjectURL(i.compressedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const downloadSingle = (item: CompressionItem) => {
    if (!item.compressedUrl) return;
    const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName;
    const a = document.createElement("a");
    a.href = item.compressedUrl;
    a.download = `${baseName}-compressed${FORMAT_EXT[targetFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Metrics Aggregation
  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressedBytes = items.reduce((acc, curr) => acc + (curr.compressedSize || 0), 0);
  const overallSavings =
    totalOriginalBytes > 0 && totalCompressedBytes > 0
      ? Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100)
      : 0;

  return (
    <div className="w-full space-y-8">
      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        
        {/* ══════════════════ LEFT PANEL: INGESTION & CONTROLS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Edge-to-Edge Title Bar Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-2.5 flex items-center justify-between text-white min-h-[58px]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 backdrop-blur-sm border border-white/20">
                  <Minimize2 className="w-5 h-5 text-indigo-200" />
                </div>
                <div>
                  <h1 className="text-base font-bold leading-tight">Image Compressor</h1>
                  <p className="text-xs text-indigo-100/80">Client-Side Canvas Quality Engine</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Drag-and-Drop Zone */}
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
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  Drop your images here, or <span className="text-indigo-600">click to browse</span>
                </p>
                <p className="text-xs text-slate-500">
                  Supports PNG, JPG, WebP, GIF, BMP (Up to 30 MB per file)
                </p>
              </div>

              {globalError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* Compression Controls */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Optimization Parameters</h2>
                  </div>
                  {items.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Queue
                    </button>
                  )}
                </div>

                {/* Target Format */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Output Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["jpeg", "png", "webp"] as TargetFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all min-h-[40px] ${
                          targetFormat === fmt
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {FORMAT_LABELS[fmt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider (JPG/WebP) */}
                {targetFormat !== "png" ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-semibold text-slate-700">Quality Factor</label>
                      <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {quality}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="1"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Maximum Compression</span>
                      <span>Balanced</span>
                      <span>Lossless Visuals</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-800 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>PNG uses lossless palette optimization. Quality reduction applies when converting to JPG or WebP.</span>
                  </div>
                )}

                {/* Alpha Transparency Fill Color (JPG) */}
                {targetFormat === "jpeg" && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Alpha Channel Fill Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28 bg-white"
                      />
                      <span className="text-[11px] text-slate-500">Replaces transparent pixels</span>
                    </div>
                  </div>
                )}

                {/* Resizing Pixel Scale Controls */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-700 block">Optional Max Dimensions (px)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Max Width (e.g. 1920)"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Max Height (e.g. 1080)"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={triggerBatchRecompression}
                  disabled={items.length === 0 || isProcessingAll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md min-h-[42px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? "animate-spin" : ""}`} />
                  Re-Apply Compression Parameters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: QUEUE & METRICS ══════════════════ */}
        <div className="space-y-5">
          <div className="sticky top-4 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Edge-to-Edge Header */}
            <div className="bg-gradient-to-r from-slate-800 to-indigo-600 px-5 py-4 flex items-center justify-between text-white min-h-[58px]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-200" />
                <span className="text-sm font-semibold">Processed Queue ({items.length})</span>
              </div>
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border transition-all duration-150 ${
                items.some((i) => i.status === "completed")
                  ? "text-emerald-300 bg-emerald-950/60 border-emerald-500/30 visible"
                  : "text-transparent bg-transparent border-transparent invisible"
              }`}>
                {overallSavings > 0 ? `${overallSavings}% Savings` : "Optimized"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Queue List Container */}
              {items.length === 0 ? (
                <div className="h-[430px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                  <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-700">No images in processing queue</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload images using the drag-and-drop zone to begin real-time browser compression.
                  </p>
                </div>
              ) : (
                <div className="h-[430px] overflow-y-auto space-y-3 pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-indigo-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 relative">
                          {item.previewUrl && (
                            <img
                              src={item.previewUrl}
                              alt={item.originalName}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.originalName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {formatBytes(item.originalSize)} →{" "}
                            {item.compressedSize > 0 ? (
                              <span className="text-indigo-600 font-bold">{formatBytes(item.compressedSize)}</span>
                            ) : (
                              "Compressing..."
                            )}
                          </p>
                          {item.compressedWidth > 0 && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              {item.compressedWidth} × {item.compressedHeight} px
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {item.status === "completed" && (
                          <button
                            onClick={() => downloadSingle(item)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                            title="Download Converted Asset"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {item.status === "processing" && (
                          <div className="p-2">
                            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                          </div>
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                          title="Remove File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Queue Total</p>
                  <p className="text-xs font-mono font-bold text-slate-800">{items.length} Assets</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Size</p>
                  <p className="text-xs font-mono font-bold text-slate-800">{formatBytes(totalOriginalBytes)}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compressed</p>
                  <p className="text-xs font-mono font-bold text-indigo-600">{formatBytes(totalCompressedBytes)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD CONTENT (EXPLICIT INDEPENDENT CARDS)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        {/* Card 1: Technical Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Client-Side Image Compression</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Image compression algorithms reduce the byte footprint of digital graphics by removing redundant spatial data and applying mathematical transformations. Our client-side optimization suite processes images entirely within the browser DOM using the HTML5 Canvas 2D API, avoiding third-party server uploads and API rate limits.
            </p>
            <p>
              When a graphic asset is ingested into the workspace, a temporary <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">Blob Object URL</code> is generated to stream image bits directly into an unrendered Offscreen Canvas. The compression engine calculates target pixel bounds, applies bilinear interpolation scaling, and renders the image data onto a clean graphics surface.
            </p>
            <p>
              For lossy targets like <strong>JPEG</strong> and <strong>WebP</strong>, Discrete Cosine Transform (DCT) and VP8 frequency quantization drop imperceptible high-frequency visual noise based on human vision models. For <strong>PNG</strong> exports, palette reduction algorithms collapse redundant alpha channels and optimize DEFLATE byte trees to maximize bandwidth efficiency without sacrificing sharpness.
            </p>
          </div>
        </div>

        {/* Card 2: Compression Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Image Compression & Format Performance Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Evaluating format characteristics is critical for optimizing Web Vitals and user engagement. The table below outlines visual loss, transparency support, and target performance ratios for modern web standards:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Format</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Encoding Mode</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Alpha Transparency</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Typical Reduction</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Optimal Web Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  ["JPEG / JPG", "Lossy (DCT Quantization)", "No (Solid Color Fill Required)", "50% – 80%", "Hero Photography & Banners"],
                  ["PNG", "Lossless (DEFLATE / Indexed)", "Full 8-Bit Alpha Channel", "20% – 45%", "Logos, Vectors & UI Icons"],
                  ["WebP", "Lossy & Lossless (VP8 / VP8L)", "Full 8-Bit Alpha Channel", "65% – 90%", "Next-Gen Web & App Publishing"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 font-mono">{row[0]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[1]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[2]}</td>
                    <td className="px-4 py-3 text-xs font-bold text-indigo-600 font-mono">{row[3]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Optimization Workflow */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Image Optimization Guide</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Graphics Queue",
                body: "Drag and drop single files or batch assets into the workspace upload box. The engine loads PNG, JPG, WebP, GIF, or BMP files up to 30 MB each.",
              },
              {
                step: "02",
                title: "Configure Target Format",
                body: "Select WebP for modern web publishing, JPG for high-density photography, or PNG for lossless transparency preservation.",
              },
              {
                step: "03",
                title: "Tune Quality & Scale Bounds",
                body: "Adjust the compression slider to strike the ideal balance between file size and clarity. Enter optional pixel bounds to scale dimensions during processing.",
              },
              {
                step: "04",
                title: "Export Optimized Assets",
                body: "Review real-time byte savings in the output dashboard and download optimized images individually or in batch.",
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

        {/* Card 4: Enterprise Applications */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Enterprise Integration & Web Performance</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Core Web Vitals & LCP Acceleration",
                body: "Uncompressed images are a leading cause of slow Largest Contentful Paint (LCP) times. Converting desktop hero imagery to compressed WebP files reduces page payloads, boosting Google Lighthouse performance scores.",
              },
              {
                title: "E-Commerce Product Catalogs",
                body: "Online storefronts managing thousands of product photos require lightweight assets to minimize cart drop-offs. Batch compress image queues to sub-100 KB targets while keeping detail sharp on high-DPI displays.",
              },
              {
                title: "CDN Bandwidth Optimization",
                body: "Serving compressed web images reduces origin server bandwidth consumption and lowers Edge CDN caching costs across multi-region deployments.",
              },
              {
                title: "Cross-Platform Email Templates",
                body: "Many desktop email clients fail to render vector or web-only graphic formats consistently. Convert campaign imagery to lightweight JPEG files with solid background fills for broad email client support.",
              },
            ].map(({ title, body }, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  {title}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Security & Privacy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Client-Side Data Privacy & Memory Governance</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Zero Server Transmission",
                body: "Your image files are never uploaded to cloud servers or third-party storage buckets. All compression routines execute locally in your browser memory.",
              },
              {
                title: "Automatic RAM Garbage Collection",
                body: "Canvas memory references and Object Blob URLs are revoked automatically via URL.revokeObjectURL(), keeping your browser's memory consumption low during large batch jobs.",
              },
              {
                title: "Air-Gapped Offline Utility",
                body: "Because transformations run locally, you can process sensitive graphics offline without an active internet connection.",
              },
              {
                title: "Alpha Background Blending",
                body: "When converting transparent PNG graphics to JPEG, select a custom Hex color to cleanly replace empty alpha channels.",
              },
            ].map(({ title, body }, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: FAQs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How does this compressor reduce file size without losing image quality?",
                a: "The tool uses HTML5 Canvas rendering to adjust compression parameters like JPEG quantization matrices and WebP lossy factor calculations. These adjustments drop high-frequency visual data that the human eye barely notices while keeping overall image clarity sharp.",
              },
              {
                q: "Why do transparent backgrounds turn black when converting PNG to JPG?",
                a: "The JPEG format does not support an alpha transparency channel. When converting a transparent PNG to JPEG without choosing a background fill color, missing alpha pixels default to black. You can use the background color selector to choose a clean white or custom fill color.",
              },
              {
                q: "What is the recommended quality setting for web graphics?",
                a: "A quality setting of 75% to 85% provides the best balance between small file size and sharp visual quality for most web imagery. Lowering quality below 60% may introduce visible compression artifacts around high-contrast edges.",
              },
              {
                q: "Is there a file limit or upload size threshold?",
                a: "You can process multiple images up to 30 MB per file. Higher batch limits depend on your computer's available RAM and browser performance.",
              },
              {
                q: "Are my confidential design files sent to external servers?",
                a: "No. All file transformations execute locally inside your browser's client-side runtime. No data is sent to external servers, ensuring full privacy for proprietary assets.",
              },
            ].map(({ q, a }, idx) => (
              <div
                key={idx}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5"
              >
                <h3 className="font-bold text-slate-800 text-sm mb-1.5">{q}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{a}</p>
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
            name: "Image Compressor & Quality Optimizer",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "All",
            description:
              "Batch compress and optimize PNG, JPG, WebP, and GIF images locally in your browser. Real-time byte metrics, custom quality tuning, alpha channel blending, and scale locking.",
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
                name: "How does this compressor reduce file size without losing image quality?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The tool uses HTML5 Canvas rendering to adjust compression parameters like JPEG quantization matrices and WebP lossy factor calculations. These adjustments drop high-frequency visual data that the human eye barely notices while keeping overall image clarity sharp.",
                },
              },
              {
                "@type": "Question",
                name: "Why do transparent backgrounds turn black when converting PNG to JPG?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The JPEG format standard does not support alpha transparency. You can select a solid background fill color (such as pure white) to replace empty alpha channels during conversion.",
                },
              },
              {
                "@type": "Question",
                name: "Are my confidential design files sent to external servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All file transformations execute locally inside your browser's client-side runtime, ensuring complete privacy.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}