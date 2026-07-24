"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileImage,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Zap,
  Shield,
  Layers,
  Sliders,
  Image as ImageIcon,
  HelpCircle,
  Cpu,
  Table,
  Workflow,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Maximize2,
  Settings,
  Database,
  Lock,
  FileCheck,
  HardDrive,
  Info,
} from "lucide-react";

// Dynamic import for heic2any to maintain SSR compliance
type OutputFormat = "jpeg" | "png";

interface ConversionItem {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  convertedBlob: Blob | null;
  convertedUrl: string | null;
  convertedSize: number;
  status: "idle" | "processing" | "completed" | "error";
  errorMessage?: string;
  previewUrl: string | null;
  isHeic: boolean;
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  jpeg: "JPG / JPEG",
  png: "PNG (Lossless)",
};

const FORMAT_MIME: Record<OutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
};

const FORMAT_EXT: Record<OutputFormat, string> = {
  jpeg: ".jpg",
  png: ".png",
};

export default function HeicToJpgConverter() {
  const [items, setItems] = useState<ConversionItem[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState<number>(85);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
  }, [items]);

  // Core conversion processor combining HEIC decoders and HTML5 Canvas API
  const convertSingleItem = useCallback(
    async (item: ConversionItem) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i
        )
      );

      try {
        let processedBlob: Blob;

        // Check for HEIC/HEIF files
        const isHeicFile =
          item.file.name.toLowerCase().endsWith(".heic") ||
          item.file.name.toLowerCase().endsWith(".heif") ||
          item.file.type.includes("heic") ||
          item.file.type.includes("heif");

        if (isHeicFile) {
          const heic2any = (await import("heic2any")).default;
          const result = await heic2any({
            blob: item.file,
            toType: FORMAT_MIME[outputFormat],
            quality: quality / 100,
          });

          processedBlob = Array.isArray(result) ? result[0] : result;
        } else {
          // Standard Image Processing (AVIF, PNG, WebP) via HTML Canvas API
          processedBlob = await new Promise<Blob>((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(item.file);

            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;

              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("Failed to initialize 2D canvas rendering context."));
                return;
              }

              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";

              if (outputFormat === "jpeg") {
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }

              ctx.drawImage(img, 0, 0);

              canvas.toBlob(
                (blob) => {
                  if (blob) resolve(blob);
                  else reject(new Error("Canvas blob rendering failed."));
                },
                FORMAT_MIME[outputFormat],
                quality / 100
              );
            };

            img.onerror = () => {
              URL.revokeObjectURL(objectUrl);
              reject(new Error("Failed to load source image file into browser decoder."));
            };

            img.src = objectUrl;
          });
        }

        const convertedUrl = URL.createObjectURL(processedBlob);

        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              if (i.convertedUrl) URL.revokeObjectURL(i.convertedUrl);
              return {
                ...i,
                status: "completed",
                convertedBlob: processedBlob,
                convertedUrl,
                convertedSize: processedBlob.size,
                previewUrl: i.previewUrl || convertedUrl,
              };
            }
            return i;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Image processing failed.";
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: "error", errorMessage: msg } : i
          )
        );
      }
    },
    [outputFormat, quality, backgroundColor]
  );

  const triggerBatchReconversion = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    for (const item of items) {
      await convertSingleItem(item);
    }
    setIsProcessingAll(false);
  }, [items, convertSingleItem]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    setGlobalError(null);
    const validFiles = Array.from(files).filter((f) => {
      const ext = f.name.toLowerCase();
      return (
        f.type.startsWith("image/") ||
        ext.endsWith(".heic") ||
        ext.endsWith(".heif") ||
        ext.endsWith(".avif")
      );
    });

    if (validFiles.length === 0) {
      setGlobalError("Please upload valid HEIC, HEIF, AVIF, PNG, or JPG image files.");
      return;
    }

    const MAX_SINGLE_SIZE = 50 * 1024 * 1024; // 50 MB
    const newItems: ConversionItem[] = [];

    for (const file of validFiles) {
      if (file.size > MAX_SINGLE_SIZE) {
        setGlobalError(`File "${file.name}" exceeds the 50 MB size limit.`);
        continue;
      }

      const ext = file.name.toLowerCase();
      const isHeic = ext.endsWith(".heic") || ext.endsWith(".heif");
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate instant preview for non-HEIC images
      const previewUrl = isHeic ? null : URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        originalName: file.name,
        originalSize: file.size,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: 0,
        status: "idle",
        previewUrl,
        isHeic,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Auto-process newly added queue items
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
    a.download = `${baseName}-converted${FORMAT_EXT[outputFormat]}`;
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
                accept="image/*,.heic,.heif,.avif"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drop your HEIC, HEIF, or AVIF files here, or <span className="text-indigo-600">click to browse</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports HEIC, HEIF, AVIF, PNG, JPG (Up to 50 MB per image)
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
                  Reset Queue
                </button>
              )}
            </div>

            {/* Target Output Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Target Output Format</label>
              <div className="grid grid-cols-2 gap-2">
                {(["jpeg", "png"] as OutputFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all min-h-[40px] ${
                      outputFormat === fmt
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider for JPEG */}
            {outputFormat === "jpeg" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">JPEG Compression Quality</label>
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
                  <span>Balanced (85%)</span>
                  <span>Maximum Quality</span>
                </div>
              </div>
            )}

            {/* Background Color Picker for Transparent Media */}
            {outputFormat === "jpeg" && (
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
                  <span className="text-xs text-slate-500">Replaces alpha background</span>
                </div>
              </div>
            )}

            <button
              onClick={triggerBatchReconversion}
              disabled={items.length === 0 || isProcessingAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all min-h-[42px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? "animate-spin" : ""}`} />
              Re-Apply Settings to Queue
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: QUEUE & METRICS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Conversion Queue ({items.length})</h2>
              </div>
              {items.some((i) => i.status === "completed") && (
                <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {overallSavings > 0 ? `${overallSavings}% Total Size Reduction` : "Format Exported"}
                </span>
              )}
            </div>

            {/* Queue List Container */}
            {items.length === 0 ? (
              <div className="h-[380px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No images in queue</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload Apple HEIC or Next-Gen AVIF files to start instant browser-based processing.
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
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 flex items-center justify-center">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileImage className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.originalName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {formatBytes(item.originalSize)} →{" "}
                          {item.convertedSize > 0 ? (
                            <span className="text-indigo-600 font-bold">{formatBytes(item.convertedSize)}</span>
                          ) : (
                            "Decoding..."
                          )}
                        </p>
                        {item.errorMessage && (
                          <p className="text-[10px] text-rose-600 truncate">{item.errorMessage}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === "completed" && (
                        <button
                          onClick={() => downloadSingle(item)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                          title="Download Converted File"
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

            {/* Operational Summary Grid */}
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
           BELOW-THE-FOLD CONTENT (HIGH-VALUE SEO & TECHNICAL ARCHITECTURE)
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 mt-12">
        {/* Card 1: Technical Architecture & Modern Compression Engines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Next-Gen Media Decoders</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Modern mobile devices and web platforms rely on sophisticated compressed media containers to capture high-resolution imagery without overflowing onboard flash storage. 
              <strong> HEIC (High Efficiency Image Container)</strong> utilizes the High Efficiency Video Coding (HEVC / H.265) compression standard, storing photos in approximately half the footprint of legacy JPEG files while preserving superior 10-bit and 12-bit color fidelity, depth maps, and live image metadata.
            </p>
            <p>
              <strong>AVIF (AV1 Image File Format)</strong> represents the open-source, royalty-free evolution of static image encoding, deriving its intra-frame prediction algorithms from the AV1 video codec. While both HEIC and AVIF deliver exceptional compression ratios, legacy desktop applications, Windows OS installations, Adobe design tools, and web publishing systems frequently lack native decoder codecs to render these next-generation containers.
            </p>
            <p>
              Our conversion suite bridges this cross-platform compatibility gap by executing WebAssembly-compiled <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">libheif</code> decoders alongside native HTML5 2D Canvas rendering pipelines entirely inside your web browser. Source image bytes are parsed, converted to uncompressed RGBA pixel arrays, and re-encoded into universal JPEG or PNG formats in real time—guaranteeing 100% data privacy without transmitting single files over remote server pipelines.
            </p>
          </div>
        </div>

        {/* Card 2: Technical Specifications & Codec Matrix */}
        <div className="bg-gradient-to-br from-slate-50/60 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Image Container & Codec Specifications Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-6">
            Compare key technical attributes, compression mechanics, color depth parameters, and target compatibility goals across modern and legacy graphic standards.
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Container Format</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Underlying Codec</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Bit Depth Support</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Cross-Platform Support</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Target Conversion Goal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["HEIC / HEIF", "HEVC (H.265)", "10-bit & 12-bit Color", "Apple Native / Limited Windows", "Convert to Universal JPG/PNG"],
                  ["AVIF", "AV1 Intra-frame", "8-bit, 10-bit, 12-bit HDR", "Modern Web Browsers", "Convert for Legacy Software"],
                  ["JPEG / JPG", "DCT Lossy Quantization", "8-bit Standard RGB", "100% Universal Standard", "Maximum System Compatibility"],
                  ["PNG", "DEFLATE Lossless", "8-bit to 16-bit + Alpha", "100% Universal Standard", "Lossless Archival & Editing"],
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-slate-100 transition-colors`}
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 border-b border-slate-100 font-mono">{row[0]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 border-b border-slate-100 font-mono">{row[1]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 border-b border-slate-100 font-mono">{row[2]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 border-b border-slate-100 font-mono">{row[3]}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-indigo-600 border-b border-slate-100 font-mono">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Conversion Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Convert HEIC & AVIF Files Step-by-Step</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Select or Drag Source Files",
                body: "Drag Apple iPhone HEIC shots, HEIF containers, or AVIF files into the upload box. Our batch engine supports uploading multiple files up to 50 MB each.",
              },
              {
                step: "02",
                title: "Choose Target Export Format",
                body: "Select JPG for lightweight photographic storage and universal OS compatibility, or PNG to preserve uncompressed details and crisp graphic layers.",
              },
              {
                step: "03",
                title: "Adjust Quality & Color Controls",
                body: "Fine-tune the JPEG compression quality slider (recommended 85%) or pick a custom Hex background color to cleanly replace transparent alpha channels.",
              },
              {
                step: "04",
                title: "Download Converted Images",
                body: "Click download on individual converted files or batch-export your converted images directly to your local file system.",
              },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                      {title}
                    </h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Enterprise Production Workflows */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Workflows & Enterprise Applications</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Cross-Platform iPhone Photo Sharing",
                body: "Transferring Apple HEIC images via AirDrop or email to Windows PCs, Android devices, or online forums frequently results in unreadable file errors. Converting files to JPG ensures your images open smoothly everywhere.",
              },
              {
                title: "Web Publishing & Portal Ingestion",
                body: "Many Web CMS platforms, real estate listing systems, job application boards, and government portals reject modern HEIC and AVIF formats. Converting files to standard JPEG guarantees smooth file uploads.",
              },
              {
                title: "E-Commerce Media Normalization",
                body: "Process raw mobile product shots into high-quality JPEG files for Shopify, WooCommerce, Amazon, and eBay stores, balancing visual clarity with quick page load speeds.",
              },
              {
                title: "Design & Post-Production Pipelines",
                body: "Convert raw mobile image captures into accessible PNG or JPEG formats before importing them into legacy photo editing software, Figma, or desktop publishing templates.",
              },
            ].map(({ title, body }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <h3 className="font-semibold text-slate-800 mb-2 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  {title}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Platform Performance & Local Isolation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Browser Architecture & Privacy Guarantees</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Shield,
                title: "100% Client-Side Privacy",
                body: "Your personal photos and sensitive documents are processed locally inside your web browser. No image data is ever uploaded, cached, or saved on remote servers.",
              },
              {
                icon: Zap,
                title: "Zero Latency Processing",
                body: "By performing transformations locally with WebAssembly and client-side HTML5 Canvas APIs, conversions finish quickly without network upload wait times.",
              },
              {
                icon: HardDrive,
                title: "Automatic Memory Cleanup",
                body: "Temporary Blob URLs are released automatically via browser garbage collection, keeping system memory usage low even during large batch conversions.",
              },
              {
                icon: Settings,
                title: "Custom Alpha Channel Control",
                body: "Converting transparent AVIF images to JPEG can sometimes leave dark background artifacts. Our custom Hex color picker lets you select a solid background fill color to keep graphic exports clean.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1.5 text-sm">
                      {title}
                    </h3>
                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Frequently Asked Questions (Static Non-Accordion Format) */}
        <div className="bg-gradient-to-br from-indigo-50/20 to-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Frequently Asked Questions</span>
          </h2>
          <div className="space-y-5">
            {[
              {
                q: "Why can't I open HEIC photos natively on Windows or older devices?",
                a: "HEIC uses the HEVC (H.265) video codec standard, which requires paid display extensions or dedicated codecs on Windows. Converting HEIC files to standard JPG format resolves these cross-platform compatibility issues.",
              },
              {
                q: "Will converting HEIC or AVIF to JPG reduce image quality?",
                a: "Converting to JPG applies JPEG compression. Selecting an 85% to 95% quality setting preserves crisp visual detail while maintaining small file sizes. If you need lossless quality, convert your files to PNG format instead.",
              },
              {
                q: "Are my photos uploaded to any external server during conversion?",
                a: "No. Conversion operations run entirely in your web browser using client-side WebAssembly and HTML5 Canvas technology. Your files stay private on your device.",
              },
              {
                q: "Can I convert AVIF images to PNG format using this tool?",
                a: "Yes. Our converter supports converting AVIF files to both JPG and PNG formats, giving you complete flexibility for web and desktop workflows.",
              },
              {
                q: "What is the maximum file size limit for image uploads?",
                a: "You can upload and convert images up to 50 MB per file, allowing you to process high-resolution mobile camera shots, DSLR exports, and large graphic assets.",
              },
            ].map(({ q, a }) => (
              <div
                key={q}
                className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>
                  {q}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed pl-4">{a}</p>
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
            name: "Next-Gen HEIC & AVIF Image Converter",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "All",
            description:
              "Batch convert Apple HEIC, HEIF, and AVIF photos to JPG or PNG format securely in your browser. 100% private client-side processing.",
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
                name: "Why can't I open HEIC photos natively on Windows or older devices?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "HEIC uses the HEVC (H.265) video codec standard, which requires paid display extensions or dedicated codecs on Windows. Converting HEIC files to standard JPG format resolves these cross-platform compatibility issues.",
                },
              },
              {
                "@type": "Question",
                name: "Are my photos uploaded to any external server during conversion?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. Conversion operations run entirely in your web browser using client-side WebAssembly and HTML5 Canvas technology. Your files stay private on your device.",
                },
              },
              {
                "@type": "Question",
                name: "Will converting HEIC or AVIF to JPG reduce image quality?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Converting to JPG applies JPEG compression. Selecting an 85% to 95% quality setting preserves crisp visual detail while maintaining small file sizes. If you need lossless quality, convert your files to PNG format instead.",
                },
              },
              {
                "@type": "Question",
                name: "Can I convert AVIF images to PNG format using this tool?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Our converter supports converting AVIF files to both JPG and PNG formats, giving you complete flexibility for web and desktop workflows.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}