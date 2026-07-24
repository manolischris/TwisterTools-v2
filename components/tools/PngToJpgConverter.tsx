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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure TypeScript Client-Side Image Converter Engine
// Handles Canvas Rendering, Color Blending & Format Compression
// ─────────────────────────────────────────────────────────────

type TargetFormat = "jpeg" | "png" | "webp";

interface ConversionItem {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number;
  status: "idle" | "processing" | "completed" | "error";
  errorMessage?: string;
  previewUrl: string;
}

const FORMAT_LABELS: Record<TargetFormat, string> = {
  jpeg: "JPG / JPEG",
  png: "PNG (Lossless)",
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
 * High-performance Canvas rendering routine.
 * Handles transparency replacement with custom background color.
 */
async function processImageCanvas(
  file: File,
  targetFormat: TargetFormat,
  quality: number,
  bgColor: string,
  resizeWidth?: number,
  resizeHeight?: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const targetW = resizeWidth && resizeWidth > 0 ? resizeWidth : img.naturalWidth;
      const targetH = resizeHeight && resizeHeight > 0 ? resizeHeight : img.naturalHeight;

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to acquire 2D canvas rendering context."));
        return;
      }

      // Smooth scaling quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Fill background color for formats that do not support transparency (like JPG)
      if (targetFormat === "jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);

      const mimeType = FORMAT_MIME[targetFormat];
      const compressionQuality = quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image encoding failed. Canvas exported an empty stream."));
            return;
          }
          resolve({
            blob,
            width: targetW,
            height: targetH,
          });
        },
        mimeType,
        compressionQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load source image. File may be corrupted or unreadable."));
    };

    img.src = objectUrl;
  });
}

export default function PngToJpgConverter() {
  // ── Core State ──
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("jpeg");
  const [quality, setQuality] = useState<number>(85);
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
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
  }, [items]);

  // ── Process Single Item ──
  const convertSingleItem = useCallback(
    async (item: ConversionItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
      );

      try {
        const parsedW = customWidth ? parseInt(customWidth, 10) : undefined;
        const parsedH = customHeight ? parseInt(customHeight, 10) : undefined;

        const { blob, width, height } = await processImageCanvas(
          item.file,
          targetFormat,
          quality,
          backgroundColor,
          parsedW,
          parsedH
        );

        const convertedUrl = URL.createObjectURL(blob);

        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              if (i.convertedUrl) URL.revokeObjectURL(i.convertedUrl);
              return {
                ...i,
                status: "completed",
                convertedBlob: blob,
                convertedUrl,
                convertedSize: blob.size,
                originalWidth: width,
                originalHeight: height,
              };
            }
            return i;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failed.";
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", errorMessage: msg } : i))
        );
      }
    },
    [targetFormat, quality, backgroundColor, customWidth, customHeight]
  );

  // Re-run batch conversion when critical settings shift
  const triggerBatchReconversion = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    for (const item of items) {
      await convertSingleItem(item);
    }
    setIsProcessingAll(false);
  }, [items, convertSingleItem]);

  // ── File Ingestion Handler ──
  const handleFiles = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

    if (validFiles.length === 0) {
      setGlobalError("Please upload valid image files (PNG, JPG, WebP, GIF, BMP).");
      return;
    }

    const MAX_SINGLE_SIZE = 25 * 1024 * 1024; // 25 MB
    const newItems: ConversionItem[] = [];

    for (const file of validFiles) {
      if (file.size > MAX_SINGLE_SIZE) {
        setGlobalError(`File "${file.name}" exceeds the 25 MB size limit.`);
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
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: 0,
        status: "idle",
        previewUrl,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Auto-process items as they are added
  useEffect(() => {
    const idleItems = items.filter((i) => i.status === "idle");
    if (idleItems.length > 0) {
      idleItems.forEach((item) => convertSingleItem(item));
    }
  }, [items, convertSingleItem]);

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
        if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      if (i.convertedUrl) URL.revokeObjectURL(i.convertedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const downloadSingle = (item: ConversionItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName;
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = `${baseName}-converted${FORMAT_EXT[targetFormat]}`;
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

  // Metrics Summary
  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalConvertedBytes = items.reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);
  const overallSavings =
    totalOriginalBytes > 0 && totalConvertedBytes > 0
      ? Math.round(((totalOriginalBytes - totalConvertedBytes) / totalOriginalBytes) * 100)
      : 0;

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: INGESTION & PARAMS ══════════════════ */}
        <div className="space-y-5">
          {/* Upload Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
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
                Drop your image files here, or <span className="text-indigo-600">click to browse</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports PNG, JPG, WebP, GIF, BMP, TIFF (Up to 25 MB per image)
              </p>
            </div>

            {globalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          {/* Engine Settings Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Conversion Parameters</h2>
              </div>
              {items.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Target Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Target Output Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["jpeg", "png", "webp"] as TargetFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTargetFormat(fmt)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all min-h-[40px] ${
                      targetFormat === fmt
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (JPG/WebP) */}
            {targetFormat !== "png" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">Compression Quality</label>
                  <span className="font-mono font-bold text-indigo-600">{quality}%</span>
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
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Smaller File</span>
                  <span>Balanced</span>
                  <span>Best Quality</span>
                </div>
              </div>
            )}

            {/* Background Color Picker for JPG */}
            {targetFormat === "jpeg" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 block">
                  Alpha Channel / Transparency Fill Color
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
                    className="text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
                  />
                  <span className="text-xs text-slate-500">Replaces transparent PNG backgrounds</span>
                </div>
              </div>
            )}

            {/* Optional Resizing Control */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-700 block">Optional Pixel Resizing (px)</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    placeholder="Width (e.g. 1920)"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Height (e.g. 1080)"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={triggerBatchReconversion}
              disabled={items.length === 0 || isProcessingAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all min-h-[42px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? "animate-spin" : ""}`} />
              Re-Apply Parameters to Queue
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: CONVERSION QUEUE & METRICS ══════════════════ */}
        <div className="space-y-5">
          {/* Output Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Conversion Queue ({items.length})</h2>
              </div>
              {items.some((i) => i.status === "completed") && (
                <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {overallSavings > 0 ? `${overallSavings}% Total Reduction` : "Lossless Export"}
                </span>
              )}
            </div>

            {/* Queue List */}
            {items.length === 0 ? (
              <div className="h-[380px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No images in queue</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload images on the left panel to begin instant canvas re-encoding.
                </p>
              </div>
            ) : (
              <div className="h-[380px] overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300">
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
                          {item.convertedSize > 0 ? (
                            <span className="text-indigo-600 font-bold">{formatBytes(item.convertedSize)}</span>
                          ) : (
                            "Processing..."
                          )}
                        </p>
                        {item.originalWidth > 0 && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {item.originalWidth} × {item.originalHeight} px
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === "completed" && (
                        <button
                          onClick={() => downloadSingle(item)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                          title="Download Converted Image"
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
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Operational Summary Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Queue Total</p>
                <p className="text-xs font-mono font-bold text-slate-800">{items.length} Files</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Original Mass</p>
                <p className="text-xs font-mono font-bold text-slate-800">{formatBytes(totalOriginalBytes)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Export Mass</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{formatBytes(totalConvertedBytes)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO & TECHNICAL DEEP CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 mt-12">
        {/* Card 1: Technical Architecture & Browser Rendering Mechanics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Client-Side Image Transformation</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Digital graphics formats differ significantly in how they handle compression, transparency, and pixel data representation. 
              Converting complex image assets requires a clear understanding of the underlying algorithms:
            </p>
            <p>
              <strong>PNG (Portable Network Graphics)</strong> uses lossless <strong>DEFLATE compression</strong> with 8-bit or 24-bit color depths and an integrated 8-bit alpha channel for smooth variable transparency. This makes PNG ideal for UI components, software icons, vector logos, and text screenshots. However, this lossless structure can lead to large file sizes for photographic imagery with complex color gradients.
            </p>
            <p>
              <strong>JPG / JPEG (Joint Photographic Experts Group)</strong> uses lossy <strong>Discrete Cosine Transform (DCT) compression</strong>. JPG strips out visually redundant color data using perceptual human vision models, shrinking image file sizes by 60% to 80% compared to raw or lossless formats. Since the JPG format standard does not support an alpha transparency channel, converting transparent PNGs directly into JPG without background handling can cause missing color channels to fill with solid black.
            </p>
            <p>
              Our conversion engine processes images directly in your browser using the <strong>HTML5 Canvas API</strong>. When you upload a PNG, the file is parsed into memory via an asynchronous <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">Blob Object URL</code>, rendered to a hidden 2D canvas context, and composite-blended against your chosen Hex color fill. The engine then exports the image stream using <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">HTMLCanvasElement.toBlob()</code>. This keeps all file operations local to your machine, ensuring zero server latency and maximum data privacy.
            </p>
          </div>
        </div>

        {/* Card 2: Feature & Format Comparison Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Comprehensive Web Format Comparison Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Selecting the right image format involves trade-offs between file size, visual quality, transparency support, and platform compatibility. Use this reference matrix to pick the right format for your project:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Format Property</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">PNG Format</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">JPG / JPEG Format</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">WebP Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  ["Compression Type", "Lossless (DEFLATE)", "Lossy (DCT Quantization)", "Lossy & Lossless (VP8/VP8L)"],
                  ["Transparency Support", "Full 8-bit Alpha Channel", "No Alpha Channel (Solid Fill)", "Full 8-bit Alpha Channel"],
                  ["Color Depth Support", "Up to 48-bit True Color", "24-bit RGB (8-bit per channel)", "24-bit RGB + 8-bit Alpha"],
                  ["Average Relative Size", "Large (100% baseline)", "Medium (reduced 50–70%)", "Ultra Small (reduced 70–85%)"],
                  ["Browser Support", "100% (Universal)", "100% (Universal)", "97.8% Modern Browsers"],
                  ["Best Recommended Use", "Logos, Text, Icons, Screenshots", "High-res Photos, Banners, Prints", "Next-Gen Web Apps, Mobile Apps"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">{row[0]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[1]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[2]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Conversion Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Convert PNG to JPG and WebP Formats</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Source Image Files",
                body: "Drag and drop your images into the uploader zone or click to select files from your storage device. You can add up to 25 MB per file in batch mode.",
              },
              {
                step: "02",
                title: "Choose Target Output Format",
                body: "Select JPG for compressed photographs, PNG for crisp graphics, or WebP for next-generation web publishing.",
              },
              {
                step: "03",
                title: "Configure Quality & Background Fill",
                body: "Adjust the quality slider to balance visual clarity and file size. When converting transparent PNGs to JPG, choose a custom fill color to replace alpha channels cleanly.",
              },
              {
                step: "04",
                title: "Apply Resizing & Export Assets",
                body: "Enter custom pixel dimensions to scale your images during conversion. Download converted files individually or process entire queues in seconds.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {step}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Enterprise Workflows & Industry Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Workflows & Practical Use Cases</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "E-Commerce Catalog Optimization",
                body: "Online stores often handle product photography uploaded as heavy uncompressed PNG files. Converting product images to balanced 85% JPG or WebP shrinks catalog image sizes, improving page load speeds and overall SEO rankings.",
              },
              {
                title: "Web Publishing & Core Web Vitals",
                body: "High Largest Contentful Paint (LCP) scores are often caused by oversized web images. Converting desktop banners and editorial graphics to WebP reduces total page payloads while preserving visual sharpness.",
              },
              {
                title: "Email Marketing Templates",
                body: "Many email clients struggle to render complex PNG graphics or web-only formats reliably. Converting promotional images to standardized JPG files ensures consistent rendering across platforms like Outlook, Gmail, and Apple Mail.",
              },
              {
                title: "Print & Graphic Asset Preparation",
                body: "Graphic designers frequently convert digital PNG assets to JPG with explicit background fills to preview print layouts, create PDF proofs, or prepare files for legacy CMYK raster pipelines.",
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

        {/* Card 5: Security, Local Sandbox & Performance Guarantee */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Privacy-First Execution & Browser Memory Management</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "100% Client-Side Processing",
                body: "Your image files stay on your machine throughout the conversion process. File transformations run entirely inside your browser sandbox, protecting confidential documents, personal photos, and unreleased designs.",
              },
              {
                title: "Automated Garbage Collection",
                body: "Temporary Blob URLs generated during processing are cleaned up automatically via URL.revokeObjectURL(), keeping your browser's memory consumption low even when processing large image queues.",
              },
              {
                title: "Zero Network Bandwidth Overhead",
                body: "Because transformations happen locally without server uploads or API requests, conversions run at native hardware speeds—making it easy to convert large file sets offline or on slow internet connections.",
              },
              {
                title: "Transparent Background Fill Control",
                body: "Converting transparent PNGs to JPG without specifying a background color can result in unexpected black boxes. Our tool lets you choose a precise background Hex fill to keep your graphics looking clean.",
              },
            ].map(({ title, body }, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Frequently Asked Questions (Static FAQ) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Why do transparent PNG backgrounds turn black when converting to JPG?",
                a: "The JPG image standard does not support an alpha channel for transparency. When converting a transparent PNG without a designated background fill color, the uninitialized alpha pixels render as black. Our tool avoids this by letting you choose a solid color (defaulting to white) to fill transparent regions cleanly.",
              },
              {
                q: "Will converting PNG to JPG reduce my file size?",
                a: "Yes. PNG uses lossless compression, which preserves every pixel but produces larger file sizes for photographic imagery. JPG uses lossy Discrete Cosine Transform compression, which can shrink file sizes by 50% to 80% while maintaining high visual quality.",
              },
              {
                q: "What is WebP and should I convert my images to it?",
                a: "WebP is a modern image format developed by Google that supports both lossy compression and alpha channel transparency. WebP files are typically 25% to 35% smaller than comparable JPG and PNG files, making them ideal for improving website loading performance.",
              },
              {
                q: "Are my private image files uploaded to any external server?",
                a: "No. All conversion operations happen locally inside your browser using HTML5 Canvas APIs. Your files are never uploaded to, stored on, or processed by external servers.",
              },
              {
                q: "Is there a limit on how many files I can convert at once?",
                a: "There are no strict limits on batch conversion volumes. You can upload and convert multiple files up to 25 MB each, limited only by your browser's available memory.",
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

      {/* ── JSON-LD Structured Data Schemas ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "PNG to JPG & Format Converter Suite",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "All",
            description:
              "Batch convert PNG images to JPG, WebP, or PNG with custom compression settings, transparency fill colors, and pixel scaling directly in your browser. 100% private client-side processing.",
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
                name: "Why do transparent PNG backgrounds turn black when converting to JPG?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The JPG image standard does not support an alpha channel for transparency. Our converter allows you to select a solid fill color (defaulting to white) to replace transparent regions during conversion.",
                },
              },
              {
                "@type": "Question",
                name: "Will converting PNG to JPG reduce my file size?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Converting PNG images to JPG typically reduces file size by 50% to 80% due to lossy DCT compression, making it ideal for web publishing.",
                },
              },
              {
                "@type": "Question",
                name: "What is WebP and should I convert my images to it?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "WebP is a modern image format offering superior lossy and lossless compression with alpha channel support, resulting in files 25% to 35% smaller than traditional formats.",
                },
              },
              {
                "@type": "Question",
                name: "Are my private image files uploaded to any external server?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Conversions run entirely within your web browser using client-side HTML5 Canvas APIs, ensuring your images never leave your local device.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}