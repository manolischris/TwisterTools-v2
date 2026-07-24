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
  Unlock,
  Maximize2,
  Ratio,
  Crop,
  Scaling,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure TypeScript Client-Side Image Resizer Engine
// Handles High-Quality Canvas Rescaling & Aspect Ratio Locks
// ─────────────────────────────────────────────────────────────

type ResizeMode = "dimensions" | "percentage" | "preset";
type OutputFormat = "original" | "jpeg" | "png" | "webp";

interface ResizerItem {
  id: string;
  file: File;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  resizedBlob: Blob | null;
  resizedUrl: string | null;
  resizedSize: number;
  status: "idle" | "processing" | "completed" | "error";
  errorMessage?: string;
  previewUrl: string;
}

const PRESETS = [
  { label: "Full HD (1080p)", width: 1920, height: 1080 },
  { label: "HD (720p)", width: 1280, height: 720 },
  { label: "4K UHD", width: 3840, height: 2160 },
  { label: "Instagram Square", width: 1080, height: 1080 },
  { label: "Instagram Story / Reel", width: 1080, height: 1920 },
  { label: "Facebook Post", width: 1200, height: 630 },
  { label: "Twitter / X Post", width: 1200, height: 675 },
  { label: "YouTube Thumbnail", width: 1280, height: 720 },
];

const FORMAT_MIME: Record<OutputFormat, string> = {
  original: "image/png",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const FORMAT_EXT: Record<OutputFormat, string> = {
  original: "",
  jpeg: ".jpg",
  png: ".png",
  webp: ".webp",
};

/**
 * High-performance Canvas scaling routine with multi-step downscaling
 * for maximum visual crispness and anti-aliasing.
 */
async function scaleImageCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: OutputFormat,
  quality: number,
  bgColor: string
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let currentW = img.naturalWidth;
      let currentH = img.naturalHeight;

      // Create main canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to acquire 2D canvas rendering context."));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Determine output mime type
      let mimeType = file.type;
      if (format !== "original") {
        mimeType = FORMAT_MIME[format];
      }

      // Fill background for non-transparent target formats
      if (mimeType === "image/jpeg") {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      // Multi-step downscaling for smooth results when reducing >50%
      if (targetWidth < currentW * 0.5 || targetHeight < currentH * 0.5) {
        const stepCanvas = document.createElement("canvas");
        const stepCtx = stepCanvas.getContext("2d");

        if (stepCtx) {
          stepCtx.imageSmoothingEnabled = true;
          stepCtx.imageSmoothingQuality = "high";

          let stepW = currentW;
          let stepH = currentH;

          stepCanvas.width = stepW;
          stepCanvas.height = stepH;
          stepCtx.drawImage(img, 0, 0, stepW, stepH);

          while (stepW * 0.5 > targetWidth || stepH * 0.5 > targetHeight) {
            stepW = Math.floor(stepW * 0.5);
            stepH = Math.floor(stepH * 0.5);

            const nextCanvas = document.createElement("canvas");
            nextCanvas.width = stepW;
            nextCanvas.height = stepH;
            const nextCtx = nextCanvas.getContext("2d");

            if (nextCtx) {
              nextCtx.imageSmoothingEnabled = true;
              nextCtx.imageSmoothingQuality = "high";
              nextCtx.drawImage(stepCanvas, 0, 0, stepCanvas.width, stepCanvas.height, 0, 0, stepW, stepH);
              stepCanvas.width = stepW;
              stepCanvas.height = stepH;
              stepCtx.drawImage(nextCanvas, 0, 0);
            } else {
              break;
            }
          }

          ctx.drawImage(stepCanvas, 0, 0, stepCanvas.width, stepCanvas.height, 0, 0, targetWidth, targetHeight);
        } else {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const compressionQuality = quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Image rescaling failed. Canvas stream is empty."));
            return;
          }
          resolve({
            blob,
            width: targetWidth,
            height: targetHeight,
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

export default function ImageResizer() {
  // ── Core State ──
  const [items, setItems] = useState<ResizerItem[]>([]);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("dimensions");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [targetWidth, setTargetWidth] = useState<string>("1280");
  const [targetHeight, setTargetHeight] = useState<string>("720");
  const [scalePercentage, setScalePercentage] = useState<number>(50);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("original");
  const [quality, setQuality] = useState<number>(90);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup Blob URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl);
      });
    };
  }, [items]);

  // Read natural image dimensions on load
  const loadDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  // ── Calculate Target Dimensions ──
  const calculateTargetDimensions = useCallback(
    (origW: number, origH: number): { finalW: number; finalH: number } => {
      if (origW === 0 || origH === 0) return { finalW: 800, finalH: 600 };

      if (resizeMode === "percentage") {
        const factor = scalePercentage / 100;
        return {
          finalW: Math.max(1, Math.round(origW * factor)),
          finalH: Math.max(1, Math.round(origH * factor)),
        };
      }

      if (resizeMode === "preset") {
        const preset = PRESETS[selectedPreset];
        return { finalW: preset.width, finalH: preset.height };
      }

      // Exact dimensions mode
      const reqW = parseInt(targetWidth, 10);
      const reqH = parseInt(targetHeight, 10);

      if (isNaN(reqW) && isNaN(reqH)) return { finalW: origW, finalH: origH };
      if (!isNaN(reqW) && isNaN(reqH)) {
        return { finalW: reqW, finalH: Math.round((reqW / origW) * origH) };
      }
      if (isNaN(reqW) && !isNaN(reqH)) {
        return { finalW: Math.round((reqH / origH) * origW), finalH: reqH };
      }

      return {
        finalW: Math.max(1, reqW || origW),
        finalH: Math.max(1, reqH || origH),
      };
    },
    [resizeMode, scalePercentage, selectedPreset, targetWidth, targetHeight]
  );

  // ── Process Single Item ──
  const processSingleItem = useCallback(
    async (item: ResizerItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
      );

      try {
        const { finalW, finalH } = calculateTargetDimensions(item.originalWidth, item.originalHeight);

        const { blob, width, height } = await scaleImageCanvas(
          item.file,
          finalW,
          finalH,
          outputFormat,
          quality,
          backgroundColor
        );

        const resizedUrl = URL.createObjectURL(blob);

        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) {
              if (i.resizedUrl) URL.revokeObjectURL(i.resizedUrl);
              return {
                ...i,
                status: "completed",
                resizedBlob: blob,
                resizedUrl,
                resizedSize: blob.size,
                targetWidth: width,
                targetHeight: height,
              };
            }
            return i;
          })
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Rescaling failed.";
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", errorMessage: msg } : i))
        );
      }
    },
    [calculateTargetDimensions, outputFormat, quality, backgroundColor]
  );

  // Re-apply settings across all items
  const triggerBatchRecompute = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessingAll(true);
    for (const item of items) {
      await processSingleItem(item);
    }
    setIsProcessingAll(false);
  }, [items, processSingleItem]);

  // ── File Ingestion ──
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setGlobalError(null);
      const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));

      if (validFiles.length === 0) {
        setGlobalError("Please upload valid image files (PNG, JPG, WebP, GIF, BMP, SVG).");
        return;
      }

      const MAX_SINGLE_SIZE = 30 * 1024 * 1024; // 30 MB
      const newItems: ResizerItem[] = [];

      for (const file of validFiles) {
        if (file.size > MAX_SINGLE_SIZE) {
          setGlobalError(`File "${file.name}" exceeds the 30 MB size limit.`);
          continue;
        }

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);
        const dims = await loadDimensions(file);

        newItems.push({
          id,
          file,
          originalName: file.name,
          originalSize: file.size,
          originalWidth: dims.width,
          originalHeight: dims.height,
          targetWidth: dims.width,
          targetHeight: dims.height,
          resizedBlob: null,
          resizedUrl: null,
          resizedSize: 0,
          status: "idle",
          previewUrl,
        });
      }

      setItems((prev) => [...prev, ...newItems]);
    },
    []
  );

  // Auto-process newly added idle items
  useEffect(() => {
    const idleItems = items.filter((i) => i.status === "idle");
    if (idleItems.length > 0) {
      idleItems.forEach((item) => processSingleItem(item));
    }
  }, [items, processSingleItem]);

  // Width / Height input handlers with optional aspect ratio synchronization
  const handleWidthChange = (val: string) => {
    setTargetWidth(val);
    if (lockAspectRatio && items.length > 0) {
      const numW = parseFloat(val);
      const primary = items[0];
      if (!isNaN(numW) && primary.originalWidth > 0) {
        const ratio = primary.originalHeight / primary.originalWidth;
        setTargetHeight(Math.round(numW * ratio).toString());
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setTargetHeight(val);
    if (lockAspectRatio && items.length > 0) {
      const numH = parseFloat(val);
      const primary = items[0];
      if (!isNaN(numH) && primary.originalHeight > 0) {
        const ratio = primary.originalWidth / primary.originalHeight;
        setTargetWidth(Math.round(numH * ratio).toString());
      }
    }
  };

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
        if (target.resizedUrl) URL.revokeObjectURL(target.resizedUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      if (i.resizedUrl) URL.revokeObjectURL(i.resizedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const downloadSingle = (item: ResizerItem) => {
    if (!item.resizedUrl) return;
    const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName;
    const ext = outputFormat === "original" ? "" : FORMAT_EXT[outputFormat];
    const a = document.createElement("a");
    a.href = item.resizedUrl;
    a.download = `${baseName}-${item.targetWidth}x${item.targetHeight}${ext || ".png"}`;
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

  // Stats
  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalResizedBytes = items.reduce((acc, curr) => acc + (curr.resizedSize || 0), 0);
  const sizeDiff = totalOriginalBytes - totalResizedBytes;
  const savingsPct =
    totalOriginalBytes > 0 && totalResizedBytes > 0
      ? Math.round((sizeDiff / totalOriginalBytes) * 100)
      : 0;

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: INGESTION & CONTROLS ══════════════════ */}
        <div className="space-y-5">
          {/* File Upload Zone */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
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
                Drop images here, or <span className="text-indigo-600">click to browse</span>
              </p>
              <p className="text-xs text-slate-500">
                Supports PNG, JPG, WebP, GIF, BMP, SVG (Up to 30 MB per file)
              </p>
            </div>

            {globalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          {/* Resizing Configuration Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Scaling Parameters</h2>
              </div>
              {items.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>

            {/* Resize Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Scaling Strategy</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dimensions" as ResizeMode, label: "Exact Pixels" },
                  { id: "percentage" as ResizeMode, label: "Percentage" },
                  { id: "preset" as ResizeMode, label: "Social Presets" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setResizeMode(mode.id)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all min-h-[40px] ${
                      resizeMode === mode.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategy 1: Exact Dimensions */}
            {resizeMode === "dimensions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">Pixel Dimensions (px)</label>
                  <button
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      lockAspectRatio
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {lockAspectRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {lockAspectRatio ? "Proportions Locked" : "Free Aspect Ratio"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-500">Width (px)</span>
                    <input
                      type="number"
                      placeholder="e.g. 1920"
                      value={targetWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-slate-500">Height (px)</span>
                    <input
                      type="number"
                      placeholder="e.g. 1080"
                      value={targetHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Strategy 2: Percentage Scale Slider */}
            {resizeMode === "percentage" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-700">Scale Factor</label>
                  <span className="font-mono font-bold text-indigo-600">{scalePercentage}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={scalePercentage}
                  onChange={(e) => setScalePercentage(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>25% (Thumbnail)</span>
                  <span>50% (Half)</span>
                  <span>100% (Original)</span>
                  <span>200% (Enlarge)</span>
                </div>
              </div>
            )}

            {/* Strategy 3: Social & Web Presets */}
            {resizeMode === "preset" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Standard Display Aspect Presets</label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(parseInt(e.target.value, 10))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.label} ({p.width} × {p.height} px)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format & Quality Settings */}
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Output Container Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["original", "jpeg", "png", "webp"] as OutputFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setOutputFormat(fmt)}
                      className={`py-2 px-2 text-[11px] font-semibold uppercase rounded-xl border transition-all min-h-[38px] ${
                        outputFormat === fmt
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider for compressed exports */}
              {outputFormat !== "png" && (
                <div className="space-y-1.5">
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
                </div>
              )}

              {/* JPG Alpha Channel Fill Color */}
              {outputFormat === "jpeg" && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="font-medium text-slate-700">Alpha Fill Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                    />
                    <span className="font-mono text-slate-600 uppercase">{backgroundColor}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={triggerBatchRecompute}
              disabled={items.length === 0 || isProcessingAll}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all min-h-[42px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessingAll ? "animate-spin" : ""}`} />
              Re-Process Image Batch
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: RESIZE QUEUE & METRICS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Resized Assets Queue ({items.length})</h2>
              </div>
              {items.some((i) => i.status === "completed") && (
                <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {savingsPct > 0 ? `${savingsPct}% Mass Reduced` : "Optimized Dimensions"}
                </span>
              )}
            </div>

            {/* Queue List */}
            {items.length === 0 ? (
              <div className="h-[400px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No images in processing queue</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload photos on the left panel to execute real-time local canvas scaling.
                </p>
              </div>
            ) : (
              <div className="h-[400px] overflow-y-auto space-y-3 pr-1">
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
                          {item.originalWidth}×{item.originalHeight} px →{" "}
                          <span className="text-indigo-600 font-bold">
                            {item.targetWidth}×{item.targetHeight} px
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(item.originalSize)} →{" "}
                          {item.resizedSize > 0 ? formatBytes(item.resizedSize) : "Scaling..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === "completed" && (
                        <button
                          onClick={() => downloadSingle(item)}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                          title="Download Resized Image"
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
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Initial Mass</p>
                <p className="text-xs font-mono font-bold text-slate-800">{formatBytes(totalOriginalBytes)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Scaled Mass</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{formatBytes(totalResizedBytes)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO & TECHNICAL DEEP CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 mt-12">
        {/* Card 1: Technical Architecture */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Technical Architecture of Client-Side Image Rescaling</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Image dimension scaling is a critical optimization step in web development, design workflows, and digital media production. When resizing graphics, preserving visual sharpness while minimizing pixel interpolation artifacts requires sophisticated canvas rendering algorithms.
            </p>
            <p>
              <strong>Bicubic & Bilinear Interpolation</strong>: Standard single-step canvas scaling can introduce blurriness or aliasing when downscaling large images by more than 50%. Our resizer uses a multi-step step-down scaling algorithm. By progressively halving image dimensions in intermediate memory canvases before rendering the final target size, visual detail and text crispness are preserved without pixel shimmer or moiré patterns.
            </p>
            <p>
              <strong>Aspect Ratio Locking</strong>: Maintains exact width-to-height proportional relationships using the formula H(target) = W(target) × (H(orig) / W(orig)). This prevents unintended distortion, stretching, or squishing across scaled image batches.
            </p>
            <p>
              <strong>Browser-Based Execution</strong>: All processing runs locally in your browser using the HTML5 Canvas API and Web APIs. Images are read via <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">FileReader</code> and transformed in memory without server uploads, offering instant speeds, zero bandwidth costs, and complete data security.
            </p>
          </div>
        </div>

        {/* Card 2: Feature Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Dimension Scaling Matrix & Display Presets</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Use this reference matrix to match standard digital display dimensions across social platforms, web display benchmarks, and video publishing guidelines:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Use Case / Platform</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Dimensions (px)</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Aspect Ratio</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Recommended Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  ["Full HD Web Video Banner", "1920 × 1080", "16:9", "WebP / JPG"],
                  ["Instagram Post (Square)", "1080 × 1080", "1:1", "JPG / PNG"],
                  ["Instagram Story / Reel", "1080 × 1920", "9:16", "JPG / WebP"],
                  ["YouTube Custom Thumbnail", "1280 × 720", "16:9", "JPG / PNG"],
                  ["Open Graph / FB Share Card", "1200 × 630", "1.91:1", "PNG / JPG"],
                  ["Twitter / X Feed Image", "1200 × 675", "16:9", "WebP / JPG"],
                  ["4K UHD Desktop Wallpaper", "3840 × 2160", "16:9", "PNG / WebP"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">{row[0]}</td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600 font-bold">{row[1]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[2]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>How to Batch Scale Image Dimensions</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Images",
                body: "Drag and drop your files into the workspace or click to browse. You can upload multiple files at once, up to 30 MB per file.",
              },
              {
                step: "02",
                title: "Select Scaling Mode",
                body: "Choose Exact Pixels for custom width/height, Percentage Scale for proportional adjustments, or Social Presets for quick standard platform dimensions.",
              },
              {
                step: "03",
                title: "Toggle Aspect Ratio Lock",
                body: "Keep proportions locked to scale automatically without stretching, or unlock aspect ratio control for freeform width and height values.",
              },
              {
                step: "04",
                title: "Export & Download",
                body: "Choose your target output format (PNG, JPG, WebP) and download individual resized images or re-process your queue instantly.",
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

        {/* Card 4: Workflows & Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Practical Web & Publishing Workflows</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Responsive Web Image Optimization",
                body: "Create scaled image variants ($1920\text{px}$, $1280\text{px}$, $640\text{px}$) for HTML <picture> element srcset declarations. Lower display dimensions improve page load speeds and help pass Google Core Web Vitals checks.",
              },
              {
                title: "Social Media Banner Adaptation",
                body: "Quickly resize high-resolution banner graphics to fit platform requirements for YouTube thumbnails, Instagram posts, and Open Graph share cards without installing bulky desktop image editors.",
              },
              {
                title: "E-Commerce Product Thumbnails",
                body: "Normalize irregular vendor photos into uniform pixel dimensions (e.g., $1000 \times 1000\text{px}$ square cards) for consistent store catalog grids.",
              },
              {
                title: "Email Template Image Sizing",
                body: "Resize large hero banners down to email-friendly widths (600px) to prevent rendering overflow issues across Outlook and mobile mail apps.",
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

        {/* Card 5: Privacy & Local Execution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Privacy-First Local Execution Architecture</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "100% In-Browser Execution",
                body: "Your graphics stay on your local device. Canvas pixel scaling runs inside your browser sandbox, protecting confidential documents, personal photos, and proprietary assets.",
              },
              {
                title: "Automated Blob URL Cleanup",
                body: "Temporary Object URLs generated during image scaling are garbage-collected via URL.revokeObjectURL(), keeping memory usage low during large batch operations.",
              },
              {
                title: "Zero Network Bandwidth Usage",
                body: "Because resizing is handled locally on your machine, conversions run at hardware speed—making it easy to work offline or process large batches on slow connections.",
              },
              {
                title: "Multi-Format Re-Encoding",
                body: "Export scaled images to modern formats like WebP, PNG, or JPG with custom compression quality settings and background color fills for transparent PNG sources.",
              },
            ].map(({ title, body }, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: FAQs (Static Border-Highlighted Cards) */}
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
                q: "Will scaling down an image reduce its file size?",
                a: "Yes. Reducing pixel dimensions reduces the total number of pixels in the image. For example, scaling a 3840×2160 (4K) image down to 1920×1080 (1080p) removes 75% of the total pixel data, significantly reducing file size.",
              },
              {
                q: "How does the aspect ratio lock work?",
                a: "When the aspect ratio lock is enabled, changing the width automatically calculates and updates the height (and vice versa) to match your original image proportions, preventing stretching or distortion.",
              },
              {
                q: "Can I enlarge small images to higher pixel dimensions?",
                a: "Yes. You can enter target dimensions larger than the original image or use a percentage scale above 100%. While modern canvas interpolation keeps edges smooth, note that upscaling cannot create new fine detail that wasn't present in the original source image.",
              },
              {
                q: "Are my files uploaded or stored on any remote servers?",
                a: "No. All resizing, canvas rendering, and format conversions happen locally inside your web browser using HTML5 Web APIs. Your images never leave your device.",
              },
              {
                q: "What image formats are supported for resizing?",
                a: "You can upload PNG, JPG, WebP, GIF, BMP, and SVG files. Scaled outputs can be saved as WebP, JPG, PNG, or in their original container format.",
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
            name: "Image Resizer & Pixel Dimensions Scaler",
            applicationCategory: "MultimediaApplication",
            operatingSystem: "All",
            description:
              "Batch scale pixel dimensions, lock aspect ratios, and optimize web graphics with high-performance browser-based canvas rendering.",
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
                name: "Will scaling down an image reduce its file size?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Reducing pixel dimensions removes total pixel volume, significantly decreasing file size.",
                },
              },
              {
                "@type": "Question",
                name: "How does the aspect ratio lock work?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Aspect ratio locking automatically calculates height relative to width to maintain original proportions and prevent stretching.",
                },
              },
              {
                "@type": "Question",
                name: "Are my files uploaded or stored on any remote servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All canvas rendering operations happen locally in your web browser for complete privacy.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}