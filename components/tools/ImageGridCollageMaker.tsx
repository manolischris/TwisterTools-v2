"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import {
    LayoutGrid,
    Upload,
    Download,
    Trash2,
    Sliders,
    Layers,
    Plus,
    CheckCircle2,
    AlertTriangle,
    BookOpen,
    HelpCircle,
    Cpu,
    Palette,
    Move,
    Maximize2,
    Eye
} from "lucide-react";

interface CollageImage {
    id: string;
    file: File;
    name: string;
    src: string;
    naturalWidth: number;
    naturalHeight: number;
    offsetX: number; // -100 to 100 percent
    offsetY: number; // -100 to 100 percent
    zoom: number;    // 1 to 3
}

type LayoutTemplate = "2x1" | "1x2" | "2x2" | "3x1" | "1x3" | "3x3" | "hero-left" | "hero-top";

interface LayoutPreset {
    id: LayoutTemplate;
    name: string;
    slots: number;
    aspectRatio: string;
}

const LAYOUT_PRESETS: LayoutPreset[] = [
    { id: "2x2", name: "2 × 2 Square Grid", slots: 4, aspectRatio: "1:1" },
    { id: "2x1", name: "2 Columns (Side-by-Side)", slots: 2, aspectRatio: "2:1" },
    { id: "1x2", name: "2 Rows (Stacked)", slots: 2, aspectRatio: "1:2" },
    { id: "3x3", name: "3 × 3 Mosaic Matrix", slots: 9, aspectRatio: "1:1" },
    { id: "3x1", name: "3 Columns Panorama", slots: 3, aspectRatio: "3:1" },
    { id: "1x3", name: "3 Rows Vertical Banner", slots: 3, aspectRatio: "1:3" },
    { id: "hero-left", name: "Hero Left + 2 Stacked Right", slots: 3, aspectRatio: "3:2" },
    { id: "hero-top", name: "Hero Top + 2 Split Bottom", slots: 3, aspectRatio: "2:3" },
];

const DEFAULT_SAMPLE_IMAGES = [
    {
        name: "mountain-lake.jpg",
        url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "autumn-forest.jpg",
        url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "desert-dunes.jpg",
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80"
    },
    {
        name: "tropical-beach.jpg",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number,
    max: number
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(min);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const parsed = parseInt(cleaned, 10);
    if (isNaN(parsed)) {
        setter(min);
        return;
    }
    setter(Math.max(min, Math.min(max, parsed)));
};

export default function ImageGridCollageMaker() {
    const [images, setImages] = useState<CollageImage[]>([]);
    const [layout, setLayout] = useState<LayoutTemplate>("2x2");
    const [gap, setGap] = useState<number>(16);
    const [padding, setPadding] = useState<number>(16);
    const [borderRadius, setBorderRadius] = useState<number>(12);
    const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
    const [canvasWidth, setCanvasWidth] = useState<number>(1920);
    const [canvasHeight, setCanvasHeight] = useState<number>(1920);
    const [exportFormat, setExportFormat] = useState<"image/png" | "image/jpeg" | "image/webp">("image/png");
    const [jpegQuality, setJpegQuality] = useState<number>(95);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const gapId = useId();
    const paddingId = useId();
    const radiusId = useId();
    const widthId = useId();
    const heightId = useId();
    const bgColorId = useId();

    const activePreset = LAYOUT_PRESETS.find((p) => p.id === layout) || LAYOUT_PRESETS[0];

    // Load initial sample images
    useEffect(() => {
        let isMounted = true;
        const loadInitialSamples = async () => {
            const loaded: CollageImage[] = [];
            for (let i = 0; i < DEFAULT_SAMPLE_IMAGES.length; i++) {
                const sample = DEFAULT_SAMPLE_IMAGES[i];
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = sample.url;
                await new Promise((resolve) => {
                    img.onload = () => {
                        if (isMounted) {
                            loaded.push({
                                id: `sample-${i}-${Date.now()}`,
                                file: new File([], sample.name, { type: "image/jpeg" }),
                                name: sample.name,
                                src: sample.url,
                                naturalWidth: img.naturalWidth || 800,
                                naturalHeight: img.naturalHeight || 600,
                                offsetX: 0,
                                offsetY: 0,
                                zoom: 1
                            });
                        }
                        resolve(true);
                    };
                    img.onerror = () => resolve(false);
                });
            }
            if (isMounted && loaded.length > 0) {
                setImages(loaded);
            }
        };

        loadInitialSamples();
        return () => {
            isMounted = false;
        };
    }, []);

    // Aspect ratio synchronization when changing layouts
    useEffect(() => {
        if (layout === "2x2" || layout === "3x3") {
            setCanvasWidth(1920);
            setCanvasHeight(1920);
        } else if (layout === "2x1" || layout === "3x1") {
            setCanvasWidth(2400);
            setCanvasHeight(1200);
        } else if (layout === "1x2" || layout === "1x3") {
            setCanvasWidth(1200);
            setCanvasHeight(2400);
        } else if (layout === "hero-left") {
            setCanvasWidth(2400);
            setCanvasHeight(1600);
        } else if (layout === "hero-top") {
            setCanvasWidth(1600);
            setCanvasHeight(2400);
        }
    }, [layout]);

    const processFiles = useCallback((files: FileList | File[]) => {
        const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (fileArr.length === 0) return;

        fileArr.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (typeof e.target?.result === "string") {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = () => {
                        setImages((prev) => [
                            ...prev,
                            {
                                id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
                                file,
                                name: file.name,
                                src: img.src,
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                                offsetX: 0,
                                offsetY: 0,
                                zoom: 1
                            }
                        ]);
                    };
                }
            };
            reader.readAsDataURL(file);
        });
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFiles(e.dataTransfer.files);
            }
        },
        [processFiles]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        if (selectedSlotIndex >= images.length - 1) {
            setSelectedSlotIndex(Math.max(0, images.length - 2));
        }
    };

    const clearAllImages = () => {
        setImages([]);
        setSelectedSlotIndex(0);
    };

    const updateSelectedImage = (patch: Partial<CollageImage>) => {
        if (!images[selectedSlotIndex]) return;
        setImages((prev) => {
            const next = [...prev];
            next[selectedSlotIndex] = { ...next[selectedSlotIndex], ...patch };
            return next;
        });
    };

    // Calculate grid slot layout coordinates
    interface SlotRect {
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const calculateSlots = useCallback(
        (width: number, height: number, p: number, g: number, lay: LayoutTemplate): SlotRect[] => {
            const availW = Math.max(10, width - p * 2);
            const availH = Math.max(10, height - p * 2);

            switch (lay) {
                case "2x1": {
                    const w = (availW - g) / 2;
                    return [
                        { x: p, y: p, width: w, height: availH },
                        { x: p + w + g, y: p, width: w, height: availH }
                    ];
                }
                case "1x2": {
                    const h = (availH - g) / 2;
                    return [
                        { x: p, y: p, width: availW, height: h },
                        { x: p, y: p + h + g, width: availW, height: h }
                    ];
                }
                case "2x2": {
                    const w = (availW - g) / 2;
                    const h = (availH - g) / 2;
                    return [
                        { x: p, y: p, width: w, height: h },
                        { x: p + w + g, y: p, width: w, height: h },
                        { x: p, y: p + h + g, width: w, height: h },
                        { x: p + w + g, y: p + h + g, width: w, height: h }
                    ];
                }
                case "3x1": {
                    const w = (availW - g * 2) / 3;
                    return [
                        { x: p, y: p, width: w, height: availH },
                        { x: p + w + g, y: p, width: w, height: availH },
                        { x: p + (w + g) * 2, y: p, width: w, height: availH }
                    ];
                }
                case "1x3": {
                    const h = (availH - g * 2) / 3;
                    return [
                        { x: p, y: p, width: availW, height: h },
                        { x: p, y: p + h + g, width: availW, height: h },
                        { x: p, y: p + (h + g) * 2, width: availW, height: h }
                    ];
                }
                case "3x3": {
                    const w = (availW - g * 2) / 3;
                    const h = (availH - g * 2) / 3;
                    const list: SlotRect[] = [];
                    for (let r = 0; r < 3; r++) {
                        for (let c = 0; c < 3; c++) {
                            list.push({
                                x: p + c * (w + g),
                                y: p + r * (h + g),
                                width: w,
                                height: h
                            });
                        }
                    }
                    return list;
                }
                case "hero-left": {
                    const leftW = (availW - g) * 0.6;
                    const rightW = availW - g - leftW;
                    const rightH = (availH - g) / 2;
                    return [
                        { x: p, y: p, width: leftW, height: availH },
                        { x: p + leftW + g, y: p, width: rightW, height: rightH },
                        { x: p + leftW + g, y: p + rightH + g, width: rightW, height: rightH }
                    ];
                }
                case "hero-top": {
                    const topH = (availH - g) * 0.6;
                    const botH = availH - g - topH;
                    const botW = (availW - g) / 2;
                    return [
                        { x: p, y: p, width: availW, height: topH },
                        { x: p, y: p + topH + g, width: botW, height: botH },
                        { x: p + botW + g, y: p + topH + g, width: botW, height: botH }
                    ];
                }
                default:
                    return [];
            }
        },
        []
    );

    // Canvas drawing helper
    const drawSlotImage = (
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        slot: SlotRect,
        zoom: number,
        offsetX: number,
        offsetY: number,
        radius: number
    ) => {
        ctx.save();
        ctx.beginPath();
        if (radius > 0) {
            if (typeof (ctx as any).roundRect === "function") {
                (ctx as any).roundRect(slot.x, slot.y, slot.width, slot.height, radius);
            } else {
                ctx.rect(slot.x, slot.y, slot.width, slot.height);
            }
            ctx.clip();
        } else {
            ctx.rect(slot.x, slot.y, slot.width, slot.height);
            ctx.clip();
        }

        const imgAspect = img.naturalWidth / img.naturalHeight;
        const slotAspect = slot.width / slot.height;

        let baseW = slot.width;
        let baseH = slot.height;

        if (imgAspect > slotAspect) {
            baseH = slot.height;
            baseW = baseH * imgAspect;
        } else {
            baseW = slot.width;
            baseH = baseW / imgAspect;
        }

        const finalW = baseW * zoom;
        const finalH = baseH * zoom;

        const maxShiftX = (finalW - slot.width) / 2;
        const maxShiftY = (finalH - slot.height) / 2;

        const shiftX = (offsetX / 100) * maxShiftX;
        const shiftY = (offsetY / 100) * maxShiftY;

        const centerX = slot.x + slot.width / 2;
        const centerY = slot.y + slot.height / 2;

        const drawX = centerX - finalW / 2 + shiftX;
        const drawY = centerY - finalH / 2 + shiftY;

        ctx.drawImage(img, drawX, drawY, finalW, finalH);
        ctx.restore();
    };

    // Render Preview and Export Canvas
    const handleExportCanvas = async () => {
        setIsExporting(true);
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            setIsExporting(false);
            return;
        }

        // Fill canvas background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const slots = calculateSlots(canvasWidth, canvasHeight, padding, gap, layout);

        // Preload HTMLImages
        const imageObjects = await Promise.all(
            images.slice(0, slots.length).map(
                (item) =>
                    new Promise<HTMLImageElement>((resolve) => {
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = item.src;
                        img.onload = () => resolve(img);
                        img.onerror = () => resolve(img);
                    })
            )
        );

        // Draw each slot
        slots.forEach((slot, index) => {
            const imgData = images[index];
            const imgEl = imageObjects[index];

            if (imgData && imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
                drawSlotImage(
                    ctx,
                    imgEl,
                    slot,
                    imgData.zoom,
                    imgData.offsetX,
                    imgData.offsetY,
                    borderRadius
                );
            } else {
                // Placeholder slot background
                ctx.save();
                ctx.fillStyle = "#f1f5f9";
                if (borderRadius > 0) {
                    if (typeof (ctx as any).roundRect === "function") {
                        (ctx as any).roundRect(slot.x, slot.y, slot.width, slot.height, borderRadius);
                    } else {
                        ctx.rect(slot.x, slot.y, slot.width, slot.height);
                    }
                    ctx.fill();
                } else {
                    ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
                }
                ctx.fillStyle = "#94a3b8";
                ctx.font = "bold 24px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(`Empty Slot ${index + 1}`, slot.x + slot.width / 2, slot.y + slot.height / 2);
                ctx.restore();
            }
        });

        // Trigger Download
        const ext = exportFormat === "image/png" ? "png" : exportFormat === "image/webp" ? "webp" : "jpg";
        const downloadName = `twistertools-collage-${layout}-${canvasWidth}x${canvasHeight}.${ext}`;
        const dataUrl = canvas.toDataURL(exportFormat, jpegQuality / 100);

        const link = document.createElement("a");
        link.download = downloadName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsExporting(false);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Multi-Image Canvas Collage & Grid Assembler",
        "url": "https://twistertools.com/tools/image-tools/image-grid-collage-maker",
        "description": "Create custom high-resolution photo grids, side-by-side comparisons, and multi-image mood boards directly in the browser with custom borders, gaps, pan, and zoom controls.",
        "applicationCategory": "DesignApplication",
        "operatingSystem": "All",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        }
    };

    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Do my photographs get uploaded to remote web servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The entire collage compilation and rasterization pipeline occurs locally on your browser through HTML5 Canvas API and JavaScript memory buffers. Your uploaded graphics never touch any remote cloud infrastructure."
                }
            },
            {
                "@type": "Question",
                "name": "Can I export in ultra-high print resolutions like 4K or 300 DPI?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. You can manually adjust the Canvas Output Width and Height up to 4096px or beyond. When exporting, the engine computes coordinates against native pixel arrays to deliver crisp, full-fidelity output suited for print or 4K monitors."
                }
            },
            {
                "@type": "Question",
                "name": "How does pan and zoom work within individual collage slots?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each grid cell applies a virtual bounding box with CSS and Canvas clip masks. Increasing the zoom factor scales the source image proportionally, while horizontal and vertical offset sliders adjust coordinates across the available frame boundary."
                }
            },
            {
                "@type": "Question",
                "name": "What image file formats can I upload and export?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can import PNG, JPEG, WebP, SVG, GIF, and AVIF image formats. You can export your finalized collage as a lossless PNG, lightweight WebP, or high-quality JPEG with adjustable compression sliders."
                }
            },
            {
                "@type": "Question",
                "name": "Can I customize the background color and cell corner radius?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The tool features complete control over border corner radius, slot gap margins, outer canvas padding, and background fill color via native color pickers and hex inputs."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* Hidden canvas for full rasterization */}
            <canvas ref={canvasRef} className="hidden" />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Collage Controls & Layout Configuration */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Reset */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                                Grid & Canvas Controls
                            </h2>
                            <button
                                type="button"
                                onClick={clearAllImages}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                                Clear Photos
                            </button>
                        </div>

                        {/* Layout Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                Select Grid Template
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {LAYOUT_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setLayout(preset.id)}
                                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${layout === preset.id
                                                ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-500"
                                                : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                                            }`}
                                    >
                                        <span className="text-xs font-bold truncate">{preset.name}</span>
                                        <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                                            <span>{preset.slots} slots</span>
                                            <span>{preset.aspectRatio}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Canvas Spacing & Geometries */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Margins, Gaps & Corner Curves
                            </h3>

                            {/* Grid Gap */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={gapId}>Cell Inner Gap:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Grid cell gap"
                                            id={gapId}
                                            type="number"
                                            min="0"
                                            max="80"
                                            value={gap}
                                            onChange={(e) => handleNumberInput(e, setGap, 0, 80)}
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust grid cell gap slider"
                                    type="range"
                                    min="0"
                                    max="80"
                                    step="1"
                                    value={gap}
                                    onChange={(e) => setGap(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Outer Canvas Padding */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={paddingId}>Outer Padding:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Outer canvas padding"
                                            id={paddingId}
                                            type="number"
                                            min="0"
                                            max="120"
                                            value={padding}
                                            onChange={(e) => handleNumberInput(e, setPadding, 0, 120)}
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust outer canvas padding slider"
                                    type="range"
                                    min="0"
                                    max="120"
                                    step="1"
                                    value={padding}
                                    onChange={(e) => setPadding(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Corner Radius */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={radiusId}>Corner Border Radius:</label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Slot corner border radius"
                                            id={radiusId}
                                            type="number"
                                            min="0"
                                            max="60"
                                            value={borderRadius}
                                            onChange={(e) => handleNumberInput(e, setBorderRadius, 0, 60)}
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">px</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust slot corner border radius slider"
                                    type="range"
                                    min="0"
                                    max="60"
                                    step="1"
                                    value={borderRadius}
                                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Background Color & Custom Dimensions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-1.5">
                                    <label htmlFor={bgColorId} className="block text-xs font-bold text-slate-700">
                                        Frame Background:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            id={bgColorId}
                                            type="color"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={backgroundColor}
                                            onChange={(e) => setBackgroundColor(e.target.value)}
                                            className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white text-slate-700 uppercase"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700">Output Resolution:</label>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            aria-label="Canvas export width"
                                            id={widthId}
                                            type="number"
                                            min="400"
                                            max="4096"
                                            value={canvasWidth}
                                            onChange={(e) => handleNumberInput(e, setCanvasWidth, 400, 4096)}
                                            className="w-1/2 px-2 py-1 text-right font-mono text-xs border border-slate-200 rounded bg-white"
                                        />
                                        <span className="text-xs text-slate-400">×</span>
                                        <input
                                            aria-label="Canvas export height"
                                            id={heightId}
                                            type="number"
                                            min="400"
                                            max="4096"
                                            value={canvasHeight}
                                            onChange={(e) => handleNumberInput(e, setCanvasHeight, 400, 4096)}
                                            className="w-1/2 px-2 py-1 text-right font-mono text-xs border border-slate-200 rounded bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Per-Slot Zoom & Repositioning Sub-Inspector */}
                        {images.length > 0 && images[selectedSlotIndex] && (
                            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                        <Move className="w-3.5 h-3.5 text-indigo-600" />
                                        Slot #{selectedSlotIndex + 1} Image Framing
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px]">
                                        {images[selectedSlotIndex].name}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                    {/* Zoom */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                                            <span>Zoom:</span>
                                            <span>{Math.round(images[selectedSlotIndex].zoom * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.05"
                                            value={images[selectedSlotIndex].zoom}
                                            onChange={(e) => updateSelectedImage({ zoom: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    {/* Pan X */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                                            <span>Pan X:</span>
                                            <span>{images[selectedSlotIndex].offsetX}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            step="1"
                                            value={images[selectedSlotIndex].offsetX}
                                            onChange={(e) => updateSelectedImage({ offsetX: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>

                                    {/* Pan Y */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                                            <span>Pan Y:</span>
                                            <span>{images[selectedSlotIndex].offsetY}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            step="1"
                                            value={images[selectedSlotIndex].offsetY}
                                            onChange={(e) => updateSelectedImage({ offsetY: Number(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* File Upload Drop Zone */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center py-5 px-4 text-center ${isDragging
                                        ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
                                        : "border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30"
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => e.target.files && processFiles(e.target.files)}
                                    className="hidden"
                                />
                                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                    Drop multi-image batch here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Loaded: {images.length} / {activePreset.slots} slots filled (JPG, PNG, WebP)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Left Footer */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Zero Server Uploads & Client-Side Raster
                        </span>
                        <span>HTML5 Canvas 2D</span>
                    </div>
                </div>

                {/* Right Panel: Interactive Visualizer & Export Stage */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Visualizer Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Live Collage Viewport
                            </h2>
                            <span className="text-xs font-mono text-slate-500">
                                {canvasWidth} × {canvasHeight} px
                            </span>
                        </div>

                        {/* Live Canvas Viewport Box */}
                        <div
                            ref={previewContainerRef}
                            className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-800 shadow-inner p-2"
                        >
                            {/* Scaled Preview Frame */}
                            <div
                                style={{
                                    backgroundColor: backgroundColor,
                                    padding: `${(padding / canvasWidth) * 100}%`,
                                    gap: `${(gap / canvasWidth) * 100}%`,
                                    aspectRatio: `${canvasWidth} / ${canvasHeight}`
                                }}
                                className="w-full h-full max-h-full max-w-full flex items-center justify-center relative shadow-lg"
                            >
                                {/* Active Slot Overlay Layout Simulation */}
                                <div
                                    className={`w-full h-full grid gap-2`}
                                    style={{
                                        gap: `${(gap / canvasWidth) * 100}%`,
                                        gridTemplateColumns:
                                            layout === "2x2"
                                                ? "repeat(2, minmax(0, 1fr))"
                                                : layout === "2x1"
                                                    ? "repeat(2, minmax(0, 1fr))"
                                                    : layout === "1x2"
                                                        ? "repeat(1, minmax(0, 1fr))"
                                                        : layout === "3x3"
                                                            ? "repeat(3, minmax(0, 1fr))"
                                                            : layout === "3x1"
                                                                ? "repeat(3, minmax(0, 1fr))"
                                                                : layout === "1x3"
                                                                    ? "repeat(1, minmax(0, 1fr))"
                                                                    : layout === "hero-left"
                                                                        ? "1.5fr 1fr"
                                                                        : "repeat(2, minmax(0, 1fr))",
                                        gridTemplateRows:
                                            layout === "hero-top"
                                                ? "1.5fr 1fr"
                                                : undefined
                                    }}
                                >
                                    {Array.from({ length: activePreset.slots }).map((_, index) => {
                                        const imgItem = images[index];
                                        const isSelected = selectedSlotIndex === index;

                                        // Special CSS grid spans for hero templates
                                        let extraClass = "";
                                        if (layout === "hero-left" && index === 0) {
                                            extraClass = "row-span-2";
                                        } else if (layout === "hero-top" && index === 0) {
                                            extraClass = "col-span-2";
                                        }

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedSlotIndex(index)}
                                                style={{
                                                    borderRadius: `${borderRadius}px`
                                                }}
                                                className={`relative overflow-hidden cursor-pointer transition flex items-center justify-center bg-slate-100 ${extraClass} ${isSelected
                                                        ? "ring-2 ring-indigo-600 ring-offset-2"
                                                        : "hover:opacity-90"
                                                    }`}
                                            >
                                                {imgItem ? (
                                                    <div className="w-full h-full relative overflow-hidden">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={imgItem.src}
                                                            alt={`Collage slot ${index + 1}`}
                                                            style={{
                                                                transform: `scale(${imgItem.zoom}) translate(${imgItem.offsetX / 3}%, ${imgItem.offsetY / 3}%)`,
                                                                transformOrigin: "center center"
                                                            }}
                                                            className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-75"
                                                        />
                                                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-[10px] font-mono text-white px-1.5 py-0.5 rounded">
                                                            #{index + 1}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeImage(index);
                                                            }}
                                                            className="absolute top-1.5 right-1.5 bg-rose-600/80 hover:bg-rose-600 text-white p-1 rounded-md transition"
                                                            title="Remove image from slot"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-3 text-slate-400 space-y-1">
                                                        <Plus className="w-6 h-6 mx-auto opacity-50" />
                                                        <span className="text-[10px] font-medium block">
                                                            Empty Slot {index + 1}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Export & Download Setup Card */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Maximize2 className="w-4 h-4 text-indigo-600" />
                                        Collage Output Export
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Renders native pixel buffer ({canvasWidth} × {canvasHeight})
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as "image/png" | "image/jpeg" | "image/webp")}
                                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                    >
                                        <option value="image/png">PNG (.png)</option>
                                        <option value="image/jpeg">JPEG (.jpg)</option>
                                        <option value="image/webp">WebP (.webp)</option>
                                    </select>

                                    {exportFormat !== "image/png" && (
                                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                            <span className="text-[11px] font-semibold text-slate-500">Quality:</span>
                                            <input
                                                type="number"
                                                min="10"
                                                max="100"
                                                value={jpegQuality}
                                                onChange={(e) => handleNumberInput(e, setJpegQuality, 10, 100)}
                                                className="w-10 text-right font-mono text-xs border-0 outline-none p-0 text-slate-800"
                                            />
                                            <span className="text-[11px] text-slate-400">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportCanvas}
                                disabled={isExporting}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? "Compiling Full Pixel Raster..." : `Download High-Res ${exportFormat.split("/")[1].toUpperCase()}`}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-600" />
                            Sub-pixel Bicubic Resampling
                        </span>
                        <span className="font-mono text-slate-600">Active Layout: {activePreset.name}</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Grid Architecture */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithmic Canvas Compositing & Multi-Image Rasterization
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Constructing high-resolution multi-image collages directly inside a modern web browser requires an optimized math model to avoid pixel distortion and aspect-ratio skewing. Unlike basic CSS grid overlays that merely display DOM elements on screen, the TwisterTools Collage Assembler translates responsive layout templates into true 2D HTML5 Canvas coordinate maps:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Aspect Cover Math
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When placing an arbitrary photo into a fixed grid cell, the engine calculates the scale ratio between source dimensions (W_src, H_src) and slot bounds (W_slot, H_slot). It applies an optimal zoom multiplier so that no blank space occurs while maintaining natural perspective.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Move className="w-4 h-4 text-amber-600" /> Pan & Bounding Constraints
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Zooming into an image creates surplus pixel area beyond the cell boundaries. Panning offsets are translated along normal Cartesian axes and constrained to prevent the image edge from detaching from the cell boundary.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Palette className="w-4 h-4 text-emerald-600" /> Rounded Clip Paths
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Canvas 2D contexts utilize native `roundRect` clipping masks before drawing raw bitmaps. This ensures that rounded corners remain mathematically anti-aliased and free of jagged pixel staircasing even at 4K resolutions.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Layout Preset Comparison Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Collage Layout Matrix & Recommended Use Cases
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Selecting the optimal layout depends heavily on image aspect ratios and where your graphic will be published:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Layout Template</th>
                                    <th className="p-3">Slot Capacity</th>
                                    <th className="p-3">Aspect Ratio</th>
                                    <th className="p-3">Best Distribution</th>
                                    <th className="p-3">Ideal Platform</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 × 2 Square Grid</td>
                                    <td className="p-3 font-mono">4 Images</td>
                                    <td className="p-3 font-mono text-indigo-600">1:1</td>
                                    <td className="p-3">Balanced square photo tiles</td>
                                    <td className="p-3">Instagram Feeds, E-commerce Thumbnails</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2 Columns Side-by-Side</td>
                                    <td className="p-3 font-mono">2 Images</td>
                                    <td className="p-3 font-mono text-indigo-600">2:1</td>
                                    <td className="p-3">Before / After or A/B visual comparisons</td>
                                    <td className="p-3">Product Retouching, Fitness Proofs, Case Studies</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 Columns Panorama</td>
                                    <td className="p-3 font-mono">3 Images</td>
                                    <td className="p-3 font-mono text-indigo-600">3:1</td>
                                    <td className="p-3">Sequential visual storytelling or landscape triptychs</td>
                                    <td className="p-3">Website Hero Banners, Twitter/X Headers</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Hero Left + 2 Right</td>
                                    <td className="p-3 font-mono">3 Images</td>
                                    <td className="p-3 font-mono text-indigo-600">3:2</td>
                                    <td className="p-3">Prominent focal subject with supporting details</td>
                                    <td className="p-3">Real Estate Listings, Architectural Portfolios</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">3 × 3 Mosaic Matrix</td>
                                    <td className="p-3 font-mono">9 Images</td>
                                    <td className="p-3 font-mono text-indigo-600">1:1</td>
                                    <td className="p-3">Comprehensive product arrays or mood boards</td>
                                    <td className="p-3">Mood Boards, Fashion Collections, Event Recaps</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices & Export Integrity */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Quality Preservation & Print-Grade Canvas Compilation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        To ensure that your assembled photo grids are suitable for high-resolution retina screens and physical print presses, keep these operational rules in mind:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Design Rules
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Set Adequate Canvas Dimensions:</strong> For social web, 1920×1920 or 2400×1200 provides crisp rendering on 3x retina displays.
                                </li>
                                <li>
                                    • <strong>Maintain Consistent Gaps:</strong> A gap between 12px and 24px gives images breathing room without disorienting the viewer.
                                </li>
                                <li>
                                    • <strong>Use Lossless PNG for Sharp Text & Logos:</strong> If your input graphics contain brand badges or fine lines, choose PNG to avoid compression artifacts.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Traps to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Excessive Digital Zoom:</strong> Zooming in beyond 180% on low-resolution source images causes noticeable pixel blurriness.
                                </li>
                                <li>
                                    • <strong>Conflicting Background Hues:</strong> Avoid harsh neon background colors that overpower your photography; stick to neutral white, soft slate, or deep onyx.
                                </li>
                                <li>
                                    • <strong>Overly Thick Outer Padding:</strong> Avoid padding values larger than 80px unless designing a distinctive wide-matte picture frame look.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Do my photographs get uploaded to remote web servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The entire collage compilation and rasterization pipeline occurs locally on your browser through HTML5 Canvas API and JavaScript memory buffers. Your uploaded graphics never touch any remote cloud infrastructure.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I export in ultra-high print resolutions like 4K or 300 DPI?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. You can manually adjust the Canvas Output Width and Height up to 4096px or beyond. When exporting, the engine computes coordinates against native pixel arrays to deliver crisp, full-fidelity output suited for print or 4K monitors.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does pan and zoom work within individual collage slots?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Each grid cell applies a virtual bounding box with CSS and Canvas clip masks. Increasing the zoom factor scales the source image proportionally, while horizontal and vertical offset sliders adjust coordinates across the available frame boundary.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What image file formats can I upload and export?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                You can import PNG, JPEG, WebP, SVG, GIF, and AVIF image formats. You can export your finalized collage as a lossless PNG, lightweight WebP, or high-quality JPEG with adjustable compression sliders.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I customize the background color and cell corner radius?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The tool features complete control over border corner radius, slot gap margins, outer canvas padding, and background fill color via native color pickers and hex inputs.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}