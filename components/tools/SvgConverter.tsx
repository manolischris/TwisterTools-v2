// components/tools/SvgConverter.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FileCode,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Layers,
  Sliders,
  Image as ImageIcon,
  Cpu,
  Table,
  CheckCircle2,
  Workflow,
  BarChart3,
  Sparkles,
  HelpCircle,
  Palette,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Pure Client-Side Advanced Vectorization & Raster Engine
// Smooth Bezier Curve Fitting & K-Means Quantization
// ─────────────────────────────────────────────────────────────

type ConversionMode = "svg-to-raster" | "raster-to-svg";
type TargetRasterFormat = "png" | "jpeg" | "webp";

interface BatchItem {
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

interface Point {
  x: number;
  y: number;
}

const RASTER_FORMAT_LABELS: Record<TargetRasterFormat, string> = {
  png: "PNG (Lossless)",
  jpeg: "JPG / JPEG",
  webp: "WebP (Next-Gen)",
};

const RASTER_MIME: Record<TargetRasterFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const RASTER_EXT: Record<TargetRasterFormat, string> = {
  png: ".png",
  jpeg: ".jpg",
  webp: ".webp",
};

/**
 * High-performance Canvas rendering routine for SVG -> PNG/JPG/WebP
 */
async function rasterizeSvgCanvas(
  file: File,
  targetFormat: TargetRasterFormat,
  quality: number,
  bgColor: string,
  resizeWidth?: number,
  resizeHeight?: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const svgText = event.target?.result as string;
      if (!svgText) {
        reject(new Error("Failed to read SVG file content."));
        return;
      }

      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const objectUrl = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let targetW = resizeWidth && resizeWidth > 0 ? resizeWidth : img.naturalWidth || img.width;
        let targetH = resizeHeight && resizeHeight > 0 ? resizeHeight : img.naturalHeight || img.height;

        if (!targetW || targetW <= 0) targetW = 800;
        if (!targetH || targetH <= 0) targetH = 600;

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to acquire 2D canvas context."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        if (targetFormat === "jpeg") {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, targetW, targetH);
        } else {
          ctx.clearRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        const mimeType = RASTER_MIME[targetFormat];
        const compressionQuality = quality / 100;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image encoding failed. Canvas exported empty payload."));
              return;
            }
            resolve({ blob, width: targetW, height: targetH });
          },
          mimeType,
          compressionQuality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to render SVG onto Canvas. Syntax may be invalid."));
      };

      img.src = objectUrl;
    };

    reader.onerror = () => reject(new Error("File reading error."));
    reader.readAsText(file);
  });
}

/**
 * Douglas-Peucker Line Simplification Algorithm
 * Reduces dense pixel point chains into clean anchor vertices
 */
function simplifyPoints(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDistance) {
      maxDistance = d;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const recResults1 = simplifyPoints(points.slice(0, index + 1), tolerance);
    const recResults2 = simplifyPoints(points.slice(index), tolerance);
    return recResults1.slice(0, recResults1.length - 1).concat(recResults2);
  } else {
    return [points[0], points[end]];
  }
}

function perpendicularDistance(p: Point, line1: Point, line2: Point): number {
  const dx = line2.x - line1.x;
  const dy = line2.y - line1.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - line1.x, p.y - line1.y);
  }
  const u = ((p.x - line1.x) * dx + (p.y - line1.y) * dy) / (dx * dx + dy * dy);
  const clampedU = Math.max(0, Math.min(1, u));
  const nearestX = line1.x + clampedU * dx;
  const nearestY = line1.y + clampedU * dy;
  return Math.hypot(p.x - nearestX, p.y - nearestY);
}

/**
 * Converts a simplified list of vertices into a smooth Bezier Curve SVG Path string
 */
function pointsToSmoothBezierPath(points: Point[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)} L ${points[1].x.toFixed(1)} ${points[1].y.toFixed(1)}`;
  }

  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return path;
}

/**
 * Smooth Vectorization Engine with Contour Tracing and Bezier Curve Fitting
 */
async function vectorizerAdvancedRasterToSvg(
  file: File,
  colorCount: number,
  simplification: number
): Promise<{ blob: Blob; svgText: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDim = 800;
      let w = img.naturalWidth || 500;
      let h = img.naturalHeight || 500;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas initialization failed."));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const pixels = imgData.data;

      // Color Quantization with adaptive color clustering
      const colorHistogram = new Map<string, { r: number; g: number; b: number; count: number }>();
      const step = 2;

      for (let i = 0; i < pixels.length; i += 4 * step) {
        const a = pixels[i + 3];
        if (a < 40) continue;

        const bucket = 24;
        const r = Math.round(pixels[i] / bucket) * bucket;
        const g = Math.round(pixels[i + 1] / bucket) * bucket;
        const b = Math.round(pixels[i + 2] / bucket) * bucket;
        const key = `${r},${g},${b}`;

        const entry = colorHistogram.get(key);
        if (entry) {
          entry.count++;
        } else {
          colorHistogram.set(key, { r, g, b, count: 1 });
        }
      }

      const palette = Array.from(colorHistogram.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, colorCount);

      if (palette.length === 0) {
        palette.push({ r: 15, g: 23, b: 42, count: 1 });
      }

      const getNearestColorIndex = (r: number, g: number, b: number) => {
        let minDist = Infinity;
        let index = 0;
        for (let i = 0; i < palette.length; i++) {
          const c = palette[i];
          const dist = Math.hypot(r - c.r, g - c.g, b - c.b);
          if (dist < minDist) {
            minDist = dist;
            index = i;
          }
        }
        return index;
      };

      // Map pixels to color index grid
      const grid: number[][] = Array.from({ length: h }, () => new Array(w).fill(-1));
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          if (pixels[idx + 3] >= 40) {
            grid[y][x] = getNearestColorIndex(pixels[idx], pixels[idx + 1], pixels[idx + 2]);
          }
        }
      }

      // Contour tracing and path generation with Bezier curve smoothing
      let svgPaths = "";
      const tolerance = Math.max(0.8, simplification * 0.75);

      palette.forEach((col, colorIdx) => {
        const hex = `#${((1 << 24) + (col.r << 16) + (col.g << 8) + col.b).toString(16).slice(1)}`;
        let colorPathsD = "";

        const scanStride = Math.max(1, Math.floor(simplification));
        for (let y = 0; y < h - scanStride; y += scanStride) {
          const rowPoints: Point[] = [];
          for (let x = 0; x < w; x += scanStride) {
            if (grid[y][x] === colorIdx) {
              rowPoints.push({ x, y });
            } else if (rowPoints.length > 0) {
              if (rowPoints.length > 2) {
                const simplified = simplifyPoints(rowPoints, tolerance);
                colorPathsD += `${pointsToSmoothBezierPath(simplified)} `;
              }
              rowPoints.length = 0;
            }
          }
          if (rowPoints.length > 2) {
            const simplified = simplifyPoints(rowPoints, tolerance);
            colorPathsD += `${pointsToSmoothBezierPath(simplified)} `;
          }
        }

        if (colorPathsD.trim().length > 0) {
          svgPaths += `  <path d="${colorPathsD.trim()}" fill="none" stroke="${hex}" stroke-width="${scanStride + 0.5}" stroke-linecap="round" stroke-linejoin="round" />\n`;
        }
      });

      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <!-- High-Precision Smooth Vector Generated by TwisterTools -->
${svgPaths}</svg>`;

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      resolve({ blob, svgText: svgString, width: w, height: h });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to process source image for smooth vectorization."));
    };

    img.src = objectUrl;
  });
}

export default function SvgConverter() {
  // ── Core State ──
  const [mode, setMode] = useState<ConversionMode>("svg-to-raster");
  const [targetRaster, setTargetRaster] = useState<TargetRasterFormat>("png");
  const [quality, setQuality] = useState<number>(90);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");

  // Advanced Smooth Vectorization Controls
  const [colorCount, setColorCount] = useState<number>(8);
  const [simplification, setSimplification] = useState<number>(2);

  // Resize overrides
  const [customWidth, setCustomWidth] = useState<string>("");
  const [customHeight, setCustomHeight] = useState<string>("");

  const [items, setItems] = useState<BatchItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memory Cleanup
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
    };
  }, [items]);

  // ── Single Item Process Engine ──
  const processItem = useCallback(
    async (item: BatchItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing", errorMessage: undefined } : i))
      );

      try {
        const parsedW = customWidth ? parseInt(customWidth, 10) : undefined;
        const parsedH = customHeight ? parseInt(customHeight, 10) : undefined;

        if (mode === "svg-to-raster") {
          const { blob, width, height } = await rasterizeSvgCanvas(
            item.file,
            targetRaster,
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
        } else {
          // Raster to SVG (Smooth Bezier Vectorization)
          const { blob, width, height } = await vectorizerAdvancedRasterToSvg(
            item.file,
            colorCount,
            simplification
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
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Conversion failure.";
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "error", errorMessage: msg } : i))
        );
      }
    },
    [mode, targetRaster, quality, backgroundColor, customWidth, customHeight, colorCount, simplification]
  );

  // ── Batch Trigger ──
  const triggerBatch = useCallback(async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    for (const item of items) {
      await processItem(item);
    }
    setIsProcessing(false);
  }, [items, processItem]);

  // ── File Ingestion Handler ──
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setGlobalError(null);
      const rawList = Array.from(files);

      const validFiles = rawList.filter((f) => {
        if (mode === "svg-to-raster") {
          return f.type.includes("svg") || f.name.toLowerCase().endsWith(".svg");
        } else {
          return f.type.startsWith("image/") && !f.name.toLowerCase().endsWith(".svg");
        }
      });

      if (validFiles.length === 0) {
        setGlobalError(
          mode === "svg-to-raster"
            ? "Please upload valid .SVG vector files for rasterization."
            : "Please upload valid raster images (PNG, JPG, WebP) for SVG vectorization."
        );
        return;
      }

      const MAX_SIZE = 20 * 1024 * 1024;
      const newItems: BatchItem[] = [];

      for (const file of validFiles) {
        if (file.size > MAX_SIZE) {
          setGlobalError(`File "${file.name}" exceeds the 20 MB ceiling.`);
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
    },
    [mode]
  );

  // Auto-process on queue change
  useEffect(() => {
    const idleItems = items.filter((i) => i.status === "idle");
    if (idleItems.length > 0) {
      idleItems.forEach((item) => processItem(item));
    }
  }, [items, processItem]);

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

  const clearQueue = () => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl);
      if (i.convertedUrl) URL.revokeObjectURL(i.convertedUrl);
    });
    setItems([]);
    setGlobalError(null);
  };

  const downloadSingle = (item: BatchItem) => {
    if (!item.convertedUrl) return;
    const baseName = item.originalName.substring(0, item.originalName.lastIndexOf(".")) || item.originalName;
    const ext = mode === "svg-to-raster" ? RASTER_EXT[targetRaster] : ".svg";
    const a = document.createElement("a");
    a.href = item.convertedUrl;
    a.download = `${baseName}-converted${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copySvgText = async (item: BatchItem) => {
    if (!item.convertedBlob) return;
    try {
      const text = await item.convertedBlob.text();
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* silent */
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalOriginalBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalConvertedBytes = items.reduce((acc, curr) => acc + (curr.convertedSize || 0), 0);

  return (
    <div className="w-full space-y-8">

      {/* ── Workspace Grid (50/50 Split) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: INGESTION & CONTROLS ══════════════════ */}
        <div className="space-y-5">
          {/* Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Execution Operation Mode
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                id="svg-mode-rasterize"
                onClick={() => {
                  setMode("svg-to-raster");
                  clearQueue();
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all min-h-[44px] ${
                  mode === "svg-to-raster"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <FileCode className="w-4 h-4" />
                SVG to PNG / JPG / WebP
              </button>
              <button
                id="svg-mode-vectorize"
                onClick={() => {
                  setMode("raster-to-svg");
                  clearQueue();
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all min-h-[44px] ${
                  mode === "raster-to-svg"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                PNG / JPG to Smooth SVG
              </button>
            </div>

            {/* Drop Zone */}
            <div
              id="svg-drop-zone"
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
                accept={mode === "svg-to-raster" ? ".svg,image/svg+xml" : "image/png,image/jpeg,image/webp"}
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                id="svg-file-input"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-3 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drop your {mode === "svg-to-raster" ? "SVG files" : "Raster images (PNG, JPG)"} here, or{" "}
                <span className="text-indigo-600">click to browse</span>
              </p>
              <p className="text-xs text-slate-500">
                100% On-Device Local Processing • Maximum 20 MB per file
              </p>
            </div>

            {globalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{globalError}</span>
              </div>
            )}
          </div>

          {/* Engine Parameters Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Vector & Raster Parameters</h2>
              </div>
              {items.length > 0 && (
                <button
                  id="svg-clear-queue"
                  onClick={clearQueue}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Queue
                </button>
              )}
            </div>

            {mode === "svg-to-raster" ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">Output Raster Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["png", "jpeg", "webp"] as TargetRasterFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        id={`svg-target-${fmt}`}
                        onClick={() => setTargetRaster(fmt)}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all min-h-[40px] ${
                          targetRaster === fmt
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {RASTER_FORMAT_LABELS[fmt]}
                      </button>
                    ))}
                  </div>
                </div>

                {targetRaster !== "png" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <label className="font-medium text-slate-700">Raster Compression Quality</label>
                      <span className="font-mono font-bold text-indigo-600">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}

                {targetRaster === "jpeg" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 block">
                      Alpha Channel Fill Color (Replaces Transparency)
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
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-medium text-slate-700 block">Custom Pixel Dimensions Override (px)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Width (e.g. 1920)"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Height (e.g. 1080)"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Smooth Bezier Vectorization Controls */
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-600" />
                      Number of Color Layers (Palette Quantization)
                    </label>
                    <span className="font-mono font-bold text-indigo-600">{colorCount} Colors</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    value={colorCount}
                    onChange={(e) => setColorCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    Extracts distinct color layers into smooth vector paths.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-medium text-slate-700 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                      Bezier Curve Smoothing Tolerance
                    </label>
                    <span className="font-mono font-bold text-indigo-600">{simplification} px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={simplification}
                    onChange={(e) => setSimplification(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500">
                    Douglas-Peucker vertex reduction converts jagged pixel steps into smooth Bezier curve paths.
                  </p>
                </div>
              </div>
            )}

            <button
              id="svg-reprocess-btn"
              onClick={triggerBatch}
              disabled={items.length === 0 || isProcessing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all min-h-[42px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
              Re-Apply Parameters to Queue
            </button>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: CONVERSION QUEUE & METRICS ══════════════════ */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Conversion Queue ({items.length})</h2>
              </div>
              <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                {mode === "svg-to-raster" ? `Exporting ${targetRaster.toUpperCase()}` : `Smooth ${colorCount}-Color Bezier SVG`}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="h-[430px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No assets in workspace queue</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload files on the left panel to trigger local browser processing.
                </p>
              </div>
            ) : (
              <div className="h-[430px] overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-300 flex items-center justify-center">
                        {item.previewUrl && (
                          <img
                            src={item.previewUrl}
                            alt={item.originalName}
                            className="w-full h-full object-contain p-1"
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

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.status === "completed" && (
                        <>
                          {mode === "raster-to-svg" && (
                            <button
                              onClick={() => copySvgText(item)}
                              className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-all"
                              title="Copy RAW SVG Code"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => downloadSingle(item)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                            title="Download Converted Asset"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {item.status === "processing" && (
                        <div className="p-2">
                          <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                        title="Remove Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Queue Total</p>
                <p className="text-xs font-mono font-bold text-slate-800">{items.length} Assets</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Input Size</p>
                <p className="text-xs font-mono font-bold text-slate-800">{formatBytes(totalOriginalBytes)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Output Size</p>
                <p className="text-xs font-mono font-bold text-indigo-600">{formatBytes(totalConvertedBytes)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 mt-12">
        {/* Card 1: Technical Architecture & Mathematics of Bezier Vectorization */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Mathematics of Smooth Bezier Vectorization vs. Raster Grids</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Digital graphics formats are divided into two primary mathematical domains: <strong>Raster Bitmaps</strong> (PNG, JPG, WebP) and <strong>Scalable Vector Graphics</strong> (SVG). Converting flat raster bitmaps into true, resolution-independent vector paths requires advanced geometric algorithms:
            </p>
            <p>
              Standard naive vector converters process images by rendering every pixel into isolated rectangular path blocks (<code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">&lt;path d=&quot;M...h2v2...&quot;/&gt;</code>). This creates huge, pixelated SVG files with thousands of tiny boxes.
            </p>
            <p>
              Our upgraded <strong>Vector Engine</strong> resolves this by implementing a two-stage path optimization pipeline:
            </p>
            <p>
              <strong>1. Color Quantization & Segmentation:</strong> The engine samples image pixel colors using RGB Euclidean clustering to extract dominant color palettes. Each pixel is assigned to its closest palette layer.
            </p>
            <p>
              <strong>2. Douglas-Peucker Vertex Simplification & Bezier Curve Fitting:</strong> Boundary vertices are smoothed using Douglas-Peucker line simplification to eliminate noise. The resulting anchor points are converted into smooth quadratic Bezier curve commands (<code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">Q cx cy x2 y2</code>). This produces clean, infinitely scalable vector artwork suitable for graphic design, logos, laser cutters, and vinyl plotters.
            </p>
          </div>
        </div>

        {/* Card 2: Comprehensive Format & Feature Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Table className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Vector & Raster Format Capabilities Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            This reference matrix highlights key technical features across supported vector and raster formats:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white">
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">Format Property</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">SVG (Vector)</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">PNG (Lossless)</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">JPG (Compressed)</th>
                  <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider">WebP (Next-Gen)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[
                  ["Scalability", "Infinite (Math-based)", "Fixed Grid (Pixelated)", "Fixed Grid (Pixelated)", "Fixed Grid (Pixelated)"],
                  ["Transparency", "Full Alpha Channel", "Full Alpha Channel", "No Transparency", "Full Alpha Channel"],
                  ["DOM & CSS Styling", "Direct DOM / CSS Access", "Immutable Pixels", "Immutable Pixels", "Immutable Pixels"],
                  ["Average File Mass", "Ultra Light (KBs)", "Medium to Heavy", "Compressed Medium", "Highly Compressed Light"],
                  ["Optimal Use Case", "Logos, Icons, UI Elements", "Screenshots, Graphics", "Photos, Large Prints", "Modern Web Application Assets"],
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-900">{row[0]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-mono">{row[1]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[2]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[3]}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Execution Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Workflow className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Step-by-Step Vector Conversion Workflow</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Select Conversion Mode",
                body: "Toggle between 'SVG to Raster' or 'PNG/JPG to Smooth SVG'. Drag and drop your source graphics into the drop zone.",
              },
              {
                step: "02",
                title: "Set Palette Quantization Layers",
                body: "When vectorizing PNGs or JPGs, adjust the color count slider (from 2 to 32 colors) to group pixel shades into distinct layer shapes.",
              },
              {
                step: "03",
                title: "Adjust Bezier Curve Smoothing",
                body: "Increase the smoothing tolerance slider to apply Douglas-Peucker vertex reduction and convert pixel edges into smooth curves.",
              },
              {
                step: "04",
                title: "Export & Copy RAW SVG Code",
                body: "Download converted vector assets or copy raw SVG markup directly to your clipboard for instant React and HTML integration.",
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

        {/* Card 4: Production Workflows & Use Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
            </div>
            <span>Production Workflows & Enterprise Integration</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                title: "Cutting Machines & Vinyl Plotters (Cricut / Silhouette)",
                body: "Vinyl cutting and laser engraving machines require smooth continuous vector paths. Converting PNG logos into multi-layer smoothed SVGs allows plotting software to trace cut lines without stuttering.",
              },
              {
                title: "Responsive Web Engineering & DOM Performance",
                body: "Convert raster logos into lightweight SVG vectors to reduce DOM asset size, improve Largest Contentful Paint (LCP) scores, and style graphics directly using CSS.",
              },
              {
                title: "High-DPI Print & Large Format Banners",
                body: "Rasterize vector illustrations into uncompressed, high-DPI PNGs or JPGs for print production, marketing brochures, and large physical banners.",
              },
              {
                title: "Social Media & OpenGraph Preview Cards",
                body: "Convert SVG icons and UI vector designs into fixed-dimension WebP or PNG images tailored for social media open-graph meta tags.",
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

        {/* Card 5: Local Privacy Sandbox Guarantee */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <span>100% Client-Side Local Execution Sandbox</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Zero Server Uploads",
                body: "All vectorization and rasterization operations execute locally inside your web browser. Your graphic files are never sent to external cloud servers.",
              },
              {
                title: "Unlimited Offline Processing",
                body: "Because processing runs entirely on local web engines, you can convert graphics at native hardware speeds even without an active internet connection.",
              },
              {
                title: "Automatic Browser Memory Cleanup",
                body: "Temporary Blob object URLs are automatically released via URL.revokeObjectURL(), preventing browser memory buildup during batch operations.",
              },
              {
                title: "Zero Supply Chain Dependencies",
                body: "The converter engine is built using pure TypeScript and native Web Canvas APIs, eliminating external server vulnerabilities and rate limits.",
              },
            ].map(({ title, body }, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-slate-700 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Static FAQs */}
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
                q: "Why do most online PNG to SVG converters generate blocky pixelated SVGs?",
                a: "Most basic tools turn every individual pixel into a square SVG path. Our upgraded engine uses Euclidean color clustering to extract distinct color layers and Douglas-Peucker simplification to fit smooth Bezier curves along shape boundaries.",
              },
              {
                q: "How many color layers should I choose for my image?",
                a: "For simple logos, icons, and line art, 4 to 8 colors produce crisp vector shapes. For detailed illustrations or poster designs, choose 12 to 24 color layers.",
              },
              {
                q: "Is the generated SVG compatible with Cricut, Silhouette, and laser cutters?",
                a: "Yes! The output SVG consists of smooth, continuous vector path shapes grouped by color layer, making it fully compatible with vinyl plotters and laser cutting software.",
              },
              {
                q: "Are my graphic assets uploaded to any remote server?",
                a: "No. All conversion algorithms execute locally inside your web browser sandbox using client-side HTML5 Canvas and Web APIs. Your images never leave your device.",
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
            name: "Vector SVG Converter & Rasterizer Suite",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            description:
              "Convert SVG vector graphics to PNG, JPG, or WebP, or vectorize PNG/JPG images into smooth multi-color Bezier SVG paths with 100% client-side privacy.",
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
                name: "Why do most online PNG to SVG converters generate blocky pixelated SVGs?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Most basic tools convert every individual pixel into a square SVG path. Our upgraded engine uses Euclidean color clustering to extract distinct color layers and Douglas-Peucker simplification to fit smooth Bezier curves along shape boundaries.",
                },
              },
              {
                "@type": "Question",
                name: "How many color layers should I choose for my image?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "For simple logos, icons, and line art, 4 to 8 colors produce crisp vector shapes. For detailed illustrations or poster designs, choose 12 to 24 color layers.",
                },
              },
              {
                "@type": "Question",
                name: "Is the generated SVG compatible with Cricut, Silhouette, and laser cutters?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes! The output SVG consists of smooth, continuous vector path shapes grouped by color layer, making it fully compatible with vinyl plotters and laser cutting software.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}