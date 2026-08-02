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
  Globe,
  Smartphone,
  AppWindow,
  FileCode,
  PackageCheck,
  LayoutGrid,
  Code2,
  CheckCircle,
  Lock,
  Layers3,
  FileCheck2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Target Icon Preset Definitions & Types
// ─────────────────────────────────────────────────────────────

interface IconPreset {
  id: string;
  name: string;
  size: number; // Width/Height square
  category: "favicon" | "apple" | "android" | "ms";
  filename: string;
  description: string;
}

const PRESETS: IconPreset[] = [
  // Standard Favicons
  { id: "fav-16", name: "Favicon 16x16", size: 16, category: "favicon", filename: "favicon-16x16.png", description: "Standard browser tab icon for low-DPI displays" },
  { id: "fav-32", name: "Favicon 32x32", size: 32, category: "favicon", filename: "favicon-32x32.png", description: "Standard browser tab icon for retina/high-DPI displays" },
  { id: "fav-48", name: "Favicon 48x48", size: 48, category: "favicon", filename: "favicon-48x48.png", description: "Desktop shortcut icon format" },
  
  // Apple Touch Icons
  { id: "apple-180", name: "Apple Touch Icon", size: 180, category: "apple", filename: "apple-touch-icon.png", description: "iOS Home Screen icon for iPhone & iPad" },
  { id: "apple-152", name: "iPad Touch Icon", size: 152, category: "apple", filename: "apple-touch-icon-152x152.png", description: "Legacy iPad Home Screen icon" },

  // Android / PWA Web App Manifest
  { id: "pwa-192", name: "Android / PWA 192", size: 192, category: "android", filename: "android-chrome-192x192.png", description: "Standard PWA Home Screen icon" },
  { id: "pwa-512", name: "Android / PWA 512", size: 512, category: "android", filename: "android-chrome-512x512.png", description: "PWA splash screen & App Store icon" },

  // Microsoft Windows Metro Tiles
  { id: "ms-150", name: "Windows Tile 150", size: 150, category: "ms", filename: "mstile-150x150.png", description: "Windows Start Menu medium tile icon" },
];

interface GeneratedIcon {
  preset: IconPreset;
  blob: Blob;
  url: string;
  sizeBytes: number;
}

// ─────────────────────────────────────────────────────────────
// Canvas Rendering Helper Engine
// ─────────────────────────────────────────────────────────────

async function renderIconVariant(
  imageSource: HTMLImageElement,
  targetSize: number,
  padding: number,
  bgColor: string,
  borderRadiusPercent: number,
  useCustomBg: boolean
): Promise<{ blob: Blob; url: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Unable to create canvas 2D rendering context"));
      return;
    }

    // High quality scaling settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Clear canvas
    ctx.clearRect(0, 0, targetSize, targetSize);

    // Apply background color and rounded corners if enabled
    if (useCustomBg || borderRadiusPercent > 0) {
      ctx.save();
      const radius = (targetSize / 2) * (borderRadiusPercent / 100);

      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.lineTo(targetSize - radius, 0);
      ctx.quadraticCurveTo(targetSize, 0, targetSize, radius);
      ctx.lineTo(targetSize, targetSize - radius);
      ctx.quadraticCurveTo(targetSize, targetSize, targetSize - radius, targetSize);
      ctx.lineTo(radius, targetSize);
      ctx.quadraticCurveTo(0, targetSize, 0, targetSize - radius);
      ctx.lineTo(0, radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.closePath();

      if (useCustomBg) {
        ctx.fillStyle = bgColor;
        ctx.fill();
      }
      ctx.clip();
    }

    // Calculate dimensions with inner padding
    const paddingPx = (targetSize * padding) / 100;
    const drawSize = targetSize - paddingPx * 2;
    const drawX = paddingPx;
    const drawY = paddingPx;

    ctx.drawImage(imageSource, drawX, drawY, drawSize, drawSize);

    if (useCustomBg || borderRadiusPercent > 0) {
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas blob generation failed"));
        return;
      }
      const url = URL.createObjectURL(blob);
      resolve({ blob, url, sizeBytes: blob.size });
    }, "image/png");
  });
}

export default function FaviconGeneratorSuite() {
  // ── Workspace State ──
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>("");
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  
  // ── Fine-Tuning Controls ──
  const [padding, setPadding] = useState<number>(0);
  const [borderRadius, setBorderRadius] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [useCustomBg, setUseCustomBg] = useState<boolean>(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>(PRESETS.map((p) => p.id));
  
  // ── UI Utilities State ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "favicon" | "apple" | "android" | "ms">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on change/unmount
  useEffect(() => {
    return () => {
      generatedIcons.forEach((icon) => URL.revokeObjectURL(icon.url));
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    };
  }, [generatedIcons, sourcePreviewUrl]);

  // ── Re-render Icon Generator Trigger ──
  const generateAllIcons = useCallback(async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Clear previous generated URLs
      generatedIcons.forEach((icon) => URL.revokeObjectURL(icon.url));

      const activeList = PRESETS.filter((p) => selectedPresets.includes(p.id));
      const results: GeneratedIcon[] = [];

      for (const preset of activeList) {
        const item = await renderIconVariant(
          sourceImage,
          preset.size,
          padding,
          bgColor,
          borderRadius,
          useCustomBg
        );
        results.push({
          preset,
          blob: item.blob,
          url: item.url,
          sizeBytes: item.sizeBytes,
        });
      }

      setGeneratedIcons(results);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate icon suite");
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, selectedPresets, padding, bgColor, borderRadius, useCustomBg, generatedIcons]);

  // Trigger batch generation when properties or preset selections update
  useEffect(() => {
    if (sourceImage) {
      generateAllIcons();
    }
  }, [sourceImage, padding, borderRadius, bgColor, useCustomBg, selectedPresets]);

  // ── File Ingestion Handlers ──
  const handleFile = useCallback((file: File) => {
    setErrorMessage(null);

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WebP, SVG).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image file size exceeds 15 MB limit.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
      setSourcePreviewUrl(previewUrl);
      setSourceImage(img);
      setSourceFileName(file.name);
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setErrorMessage("Failed to load image file. File may be corrupt.");
    };

    img.src = previewUrl;
  }, [sourcePreviewUrl]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const togglePreset = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: string) => {
    const categoryPresetIds = PRESETS.filter((p) => p.category === cat).map((p) => p.id);
    const allSelected = categoryPresetIds.every((id) => selectedPresets.includes(id));

    if (allSelected) {
      setSelectedPresets((prev) => prev.filter((id) => !categoryPresetIds.includes(id)));
    } else {
      setSelectedPresets((prev) => Array.from(new Set([...prev, ...categoryPresetIds])));
    }
  };

  const downloadSingleIcon = (icon: GeneratedIcon) => {
    const a = document.createElement("a");
    a.href = icon.url;
    a.download = icon.preset.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clearWorkspace = () => {
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);
    generatedIcons.forEach((icon) => URL.revokeObjectURL(icon.url));
    setSourceImage(null);
    setSourcePreviewUrl(null);
    setSourceFileName("");
    setGeneratedIcons([]);
    setErrorMessage(null);
  };

  // HTML Head Embed Metadata Snippet Generator
  const generateHTMLCode = () => {
    return `<!-- Standard Favicons -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Android / PWA Web App Manifest -->
<link rel="manifest" href="/site.webmanifest">

<!-- Windows Tile Color -->
<meta name="msapplication-TileColor" content="${bgColor}">
<meta name="msapplication-TileImage" content="/mstile-150x150.png">`;
  };

  const copyHTMLCode = async () => {
    try {
      await navigator.clipboard.writeText(generateHTMLCode());
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch {
      /* silent */
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const filteredIcons = generatedIcons.filter(
    (icon) => activeTab === "all" || icon.preset.category === activeTab
  );

  return (
    <div className="w-full space-y-8">

      {/* ── WORKSPACE GRID (50/50 SPLIT) ── */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ══════════════════ LEFT PANEL: INPUT & PARAMETERS ══════════════════ */}
        <div className="space-y-5">
          {/* Upload Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">1. Upload Master Source Graphics</h2>
              </div>
              {sourceImage && (
                <button
                  onClick={clearWorkspace}
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Master
                </button>
              )}
            </div>

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
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {sourcePreviewUrl ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-1 shadow-sm">
                    <img src={sourcePreviewUrl} alt="Master Source" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-left space-y-1">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{sourceFileName}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {sourceImage?.naturalWidth} × {sourceImage?.naturalHeight} px
                    </p>
                    <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Ready for rendering
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-sm">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-0.5">
                    Drop high-res logo or image, or <span className="text-indigo-600">click to browse</span>
                  </p>
                  <p className="text-[11px] text-slate-400">Recommended 512×512px or larger (PNG, SVG, JPG, WebP)</p>
                </>
              )}
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Icon Customization Parameters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">2. Layout & Styling Parameters</h2>
            </div>

            {/* Inner Padding Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Inner Icon Padding</label>
                <span className="font-mono font-bold text-indigo-600">{padding}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={padding}
                onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Edge-to-Edge (0%)</span>
                <span>Compact (30%)</span>
              </div>
            </div>

            {/* Border Radius Corner Squircle Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label className="font-medium text-slate-700">Border Corner Radius</label>
                <span className="font-mono font-bold text-indigo-600">{borderRadius}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Square (0%)</span>
                <span>Squircle (40%)</span>
                <span>Circle (100%)</span>
              </div>
            </div>

            {/* Solid Background Color Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Custom Background Color</label>
                <button
                  type="button"
                  onClick={() => setUseCustomBg(!useCustomBg)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    useCustomBg ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                      useCustomBg ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {useCustomBg && (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="text-xs font-mono border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
                  />
                  <span className="text-[11px] text-slate-500">Replaces alpha channel</span>
                </div>
              )}
            </div>
          </div>

          {/* Preset Platforms Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">3. Target Export Presets</h2>
              </div>
              <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {selectedPresets.length} / {PRESETS.length} Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { cat: "favicon", name: "Standard Favicons", icon: Globe },
                { cat: "apple", name: "iOS / Apple Touch", icon: Smartphone },
                { cat: "android", name: "Android / PWA", icon: AppWindow },
                { cat: "ms", name: "Windows Metro", icon: HardDrive },
              ].map(({ cat, name, icon: Icon }) => {
                const count = PRESETS.filter((p) => p.category === cat && selectedPresets.includes(p.id)).length;
                const total = PRESETS.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      count > 0
                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900"
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-xs font-semibold truncate">{name}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {count}/{total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════════════ RIGHT PANEL: GENERATED SUITE & METADATA ══════════════════ */}
        <div className="space-y-5 sticky top-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Generated Icon Suite ({generatedIcons.length})</h2>
              </div>
              {isProcessing && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />}
            </div>

            {/* Platform Tab Filter */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs">
              {[
                { id: "all", label: "All" },
                { id: "favicon", label: "Favicons" },
                { id: "apple", label: "Apple" },
                { id: "android", label: "Android/PWA" },
                { id: "ms", label: "Windows" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Generated Items Gallery List */}
            {generatedIcons.length === 0 ? (
              <div className="h-[340px] border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center p-4 sm:p-6">
                <Globe className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Generated Favicons</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Upload a master source graphic on the left panel to render all multi-resolution app icons instantly.
                </p>
              </div>
            ) : (
              <div className="h-[340px] overflow-y-auto space-y-2.5 pr-1">
                {filteredIcons.map((item) => (
                  <div
                    key={item.preset.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-200/80 border border-slate-300 overflow-hidden flex items-center justify-center p-1 flex-shrink-0">
                        <img src={item.url} alt={item.preset.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.preset.name}</p>
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {item.preset.size}×{item.preset.size}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{item.preset.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{formatBytes(item.sizeBytes)}</span>
                      <button
                        type="button"
                        onClick={() => downloadSingleIcon(item)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm"
                        title={`Download ${item.preset.filename}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* HTML Metadata Embed Code Box */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-800">HTML &lt;head&gt; Embed Snippet</span>
                </div>
                <button
                  type="button"
                  onClick={copyHTMLCode}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  {copiedHtml ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedHtml ? "Copied Code!" : "Copy Snippet"}
                </button>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto border border-slate-800">
                {generateHTMLCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
           BELOW-THE-FOLD SEO DEEP-CONTENT BLOCK
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-8 mt-12">
        {/* Card 1: Technical Standards & Browser Rendering Specifications */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <span>Technical Standards for Web & Mobile Iconography</span>
            <span className="ml-auto hidden md:inline-flex px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-mono font-semibold text-indigo-600 flex-shrink-0">
              RFC 1034 & PWA Standard
            </span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              Modern web applications require a diverse, multi-resolution asset strategy to ensure razor-sharp branding display across desktop browser chrome, mobile launcher grids, and Progressive Web App (PWA) task switchers. The historical approach of delivering a single, uncompressed 16×16 pixel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">favicon.ico</code> container has been declared legacy behavior by W3C and WHATWG browser standards.
            </p>
            <p>
              Different operating platforms enforce distinct icon rendering pipelines. Apple iOS requires high-density 180×180 pixel PNG graphics designated via <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">&lt;link rel="apple-touch-icon"&gt;</code> tags, over which it applies hardware-level rounded squircle masking. Google Android and Chromium-based PWAs inspect a specialized JSON manifest (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">site.webmanifest</code>) to pick target densities—such as 192×192 pixels for home screen launchers and 512×512 pixels for splash loading screens.
            </p>
            <p>
              Our client-side processing suite uses native HTML5 Canvas rasterization algorithms to dynamically resample master vector or high-resolution bitmaps (PNG, WebP, SVG, JPG) into precision PNG streams. By calculating custom alpha padding, background fills, and squircle border boundaries inside local memory, your assets stay perfectly aligned across Retina screens, desktop taskbars, and mobile web app manifests.
            </p>
          </div>
        </div>

        {/* Card 2: Resolution & Platform Specification Matrix */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Table className="w-5 h-5" />
            </div>
            <span>Icon Specification & Target Platform Matrix</span>
          </h2>
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            Use the comprehensive reference matrix below to evaluate standard dimensions, file naming conventions, target OS display surfaces, and HTML header declaration tags across modern digital platforms:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 to-indigo-600 text-white text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold">Target Specification</th>
                  <th className="px-4 py-3.5 font-bold">Dimensions</th>
                  <th className="px-4 py-3.5 font-bold">Target Surface / Platform</th>
                  <th className="px-4 py-3.5 font-bold">File Designation</th>
                  <th className="px-4 py-3.5 font-bold">HTML Markup Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs md:text-sm text-slate-700">
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Standard Favicon</td>
                  <td className="px-4 py-3 font-mono text-xs">16 × 16 px</td>
                  <td className="px-4 py-3">Low-DPI Browser Tabs & Bookmarks</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">favicon-16x16.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">&lt;link rel="icon" sizes="16x16"&gt;</td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">Retina Favicon</td>
                  <td className="px-4 py-3 font-mono text-xs">32 × 32 px</td>
                  <td className="px-4 py-3">High-DPI / Retina Browser Tabs</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">favicon-32x32.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">&lt;link rel="icon" sizes="32x32"&gt;</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Desktop Shortcut</td>
                  <td className="px-4 py-3 font-mono text-xs">48 × 48 px</td>
                  <td className="px-4 py-3">OS Taskbar & Desktop Shortcuts</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">favicon-48x48.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">&lt;link rel="icon" sizes="48x48"&gt;</td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">Apple Touch Icon</td>
                  <td className="px-4 py-3 font-mono text-xs">180 × 180 px</td>
                  <td className="px-4 py-3">iOS Home Screen (iPhone & iPad)</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">apple-touch-icon.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">&lt;link rel="apple-touch-icon"&gt;</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">PWA Standard Launcher</td>
                  <td className="px-4 py-3 font-mono text-xs">192 × 192 px</td>
                  <td className="px-4 py-3">Android App Launcher & Task Switcher</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">android-chrome-192x192.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">site.webmanifest entry</td>
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-900">PWA Splash Screen</td>
                  <td className="px-4 py-3 font-mono text-xs">512 × 512 px</td>
                  <td className="px-4 py-3">PWA Launch Screen & Store Icon</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">android-chrome-512x512.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">site.webmanifest entry</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-4 py-3 font-semibold text-slate-900">Windows Metro Tile</td>
                  <td className="px-4 py-3 font-mono text-xs">150 × 150 px</td>
                  <td className="px-4 py-3">Windows Start Menu Live Tiles</td>
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">mstile-150x150.png</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600">&lt;meta name="msapplication-TileImage"&gt;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Step-by-Step Implementation Guide */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Workflow className="w-5 h-5" />
            </div>
            <span>How to Deploy Your Multi-Resolution App Icon Suite</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                step: "01",
                title: "Upload Master High-Res Logo Graphics",
                body: "Select a high-resolution vector or raster graphic (preferably 512×512 pixels or larger) with clear visual contrast and simple geometric contours.",
              },
              {
                step: "02",
                title: "Adjust Inner Padding & Corner Radius",
                body: "Use the padding slider to prevent edge clipping on rounded launcher screens, and set squircle or circle masks to match your platform brand identity.",
              },
              {
                step: "03",
                title: "Export & Save Generated Asset Suite",
                body: "Download your newly rendered PNG icon package files directly into your web application's root static directory or /public folder.",
              },
              {
                step: "04",
                title: "Embed Head Metadata & Web Manifest",
                body: "Copy and paste the generated HTML <head> meta tags snippet into your main page template or layout wrapper file (e.g., layout.tsx or index.html).",
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

        {/* Card 4: Web App Manifest & Head Embed Code Examples */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Code2 className="w-5 h-5" />
            </div>
            <span>Production Web App Manifest Configuration</span>
          </h2>
          <div className="space-y-4 text-slate-700 text-sm md:text-base leading-relaxed">
            <p>
              To complete your Progressive Web App (PWA) setup, save the following JSON configuration as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-xs">site.webmanifest</code> in your project's public folder alongside the generated PNG icons:
            </p>
            <pre className="font-mono text-xs leading-relaxed p-4 bg-slate-900 text-indigo-200 rounded-xl overflow-x-auto border border-slate-800">
{`{
  "name": "Your Web Application Name",
  "short_name": "App",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "${bgColor}",
  "background_color": "${bgColor}",
  "display": "standalone"
}`}
            </pre>
          </div>
        </div>

        {/* Card 5: Enterprise Privacy & Client-Side Sandbox Guarantees */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <span>Client-Side Processing & Memory Security Guarantees</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "100% Client-Side Canvas Operations",
                body: "All image resizing, padding calculations, border masking, and background compositing execute exclusively inside your web browser using client-side HTML5 Canvas APIs. Zero byte data is transmitted to external servers.",
              },
              {
                title: "Automated Blob Memory Cleanup",
                body: "Temporary object URLs generated during processing are safely released via URL.revokeObjectURL(), keeping your browser's RAM overhead minimal even during intensive generation tasks.",
              },
              {
                title: "Zero Server Bandwidth Constraints",
                body: "Processing graphics locally means instantaneous asset generation free from remote API queues, rate limits, network latency, or backend storage dependencies.",
              },
              {
                title: "Complete Enterprise Brand Privacy",
                body: "Your proprietary company logos, trademark graphics, and unreleased design prototypes remain fully contained within your workstation's isolated browser sandbox.",
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
                q: "Why do modern web apps require multiple icon sizes instead of a single favicon.ico file?",
                a: "Different operating systems and display environments demand specific resolution standards. Desktop browsers display 32×32 pixel icons in tabs, Apple iOS requires 180×180 pixel touch icons for home screen shortcuts, and Android PWAs use 192×192 and 512×512 icons for app launchers and splash screens. Providing a multi-resolution PNG package ensures sharp visual display across all devices.",
              },
              {
                q: "What is an Apple Touch Icon and how does iOS handle it?",
                a: "An Apple Touch Icon is a high-resolution PNG image used when a user adds a web page to their iPhone or iPad home screen. iOS automatically detects the icon declared via the <link rel='apple-touch-icon'> tag and applies hardware-level rounded corners and masking.",
              },
              {
                q: "What master image format and resolution should I upload for best results?",
                a: "A high-resolution, square PNG, WebP, or SVG file with a transparent background at 512×512 pixels or larger will yield the crispest results across every target icon dimension.",
              },
              {
                q: "What is a Web App Manifest file and why is it needed?",
                a: "A Web App Manifest (site.webmanifest) is a simple JSON file that tells mobile browsers how your Progressive Web App should behave when installed on a user's device. It defines the icons, theme colors, background fills, and default display modes.",
              },
              {
                q: "Are my uploaded graphic files transferred or stored on external servers?",
                a: "No. All conversion operations run locally inside your browser sandbox using client-side JavaScript and HTML5 Canvas APIs. Your files are never uploaded to, processed by, or stored on remote servers.",
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
            name: "Favicon & Multi-Resolution App Icon Suite",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "All",
            browserRequirements: "Requires JavaScript. Supports HTML5 Canvas & Blob APIs.",
            description:
              "Generate multi-resolution app icon suites, standard favicons, Apple touch icons, and Android PWA manifest assets directly in browser.",
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
                name: "Why do modern web apps require multiple icon sizes instead of a single favicon.ico file?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Different platforms require distinct resolution profiles (32x32 for browser tabs, 180x180 for iOS Home Screen, and 512x512 for PWA splash screens) to ensure crisp rendering.",
                },
              },
              {
                "@type": "Question",
                name: "What is an Apple Touch Icon and how does iOS handle it?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "An Apple Touch Icon is a 180x180 PNG graphic used when adding websites to an iOS Home Screen, where iOS automatically applies squircle masking.",
                },
              },
              {
                "@type": "Question",
                name: "Are my uploaded graphic files transferred or stored on external servers?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. All conversion operations run 100% client-side inside your browser sandbox using HTML5 Canvas APIs.",
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}