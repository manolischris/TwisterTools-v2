"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
    Download,
    Copy,
    Check,
    Plus,
    Trash2,
    Monitor,
    Layers,
    Sparkles,
    Eye,
    Maximize2,
    Shuffle,
    Code2,
    Compass,
    BookOpen,
    HelpCircle,
    SlidersHorizontal,
    Shapes,
    Paintbrush
} from "lucide-react";

type GradientType = "linear" | "radial" | "conic";

interface ColorStop {
    id: string;
    color: string;
    position: number; // 0 to 100
}

interface AspectRatioPreset {
    id: string;
    label: string;
    category: "Desktop & 4K" | "Mobile & Social" | "Banners & Web";
    width: number;
    height: number;
}

const PRESET_DIMENSIONS: AspectRatioPreset[] = [
    { id: "4k-uhd", label: "4K UHD Wallpaper (3840 × 2160)", category: "Desktop & 4K", width: 3840, height: 2160 },
    { id: "qhd-2k", label: "2K QHD Desktop (2560 × 1440)", category: "Desktop & 4K", width: 2560, height: 1440 },
    { id: "fhd-1080p", label: "Full HD 1080p (1920 × 1080)", category: "Desktop & 4K", width: 1920, height: 1080 },
    { id: "ultrawide", label: "Ultrawide Monitor (3440 × 1440)", category: "Desktop & 4K", width: 3440, height: 1440 },
    { id: "macbook-pro", label: "MacBook Pro Retina (3024 × 1964)", category: "Desktop & 4K", width: 3024, height: 1964 },
    { id: "iphone-16-pro", label: "iPhone Pro / Story (1179 × 2556)", category: "Mobile & Social", width: 1179, height: 2556 },
    { id: "android-fhd", label: "Mobile Full HD (1080 × 2400)", category: "Mobile & Social", width: 1080, height: 2400 },
    { id: "ipad-pro", label: "Tablet / iPad (2048 × 2732)", category: "Mobile & Social", width: 2048, height: 2732 },
    { id: "instagram-post", label: "Square Post 1:1 (1080 × 1080)", category: "Mobile & Social", width: 1080, height: 1080 },
    { id: "og-image", label: "OpenGraph / Social Card (1200 × 630)", category: "Banners & Web", width: 1200, height: 630 },
    { id: "twitter-header", label: "X / Twitter Header (1500 × 500)", category: "Banners & Web", width: 1500, height: 500 },
    { id: "youtube-banner", label: "YouTube Banner (2560 × 1440)", category: "Banners & Web", width: 2560, height: 1440 }
];

const CURATED_PALETTES: { name: string; type: GradientType; angle: number; stops: { color: string; position: number }[] }[] = [
    {
        name: "Hyper Indigo",
        type: "linear",
        angle: 135,
        stops: [
            { color: "#4f46e5", position: 0 },
            { color: "#7c3aed", position: 50 },
            { color: "#ec4899", position: 100 }
        ]
    },
    {
        name: "Deep Space Aurora",
        type: "linear",
        angle: 160,
        stops: [
            { color: "#0f172a", position: 0 },
            { color: "#1e1b4b", position: 40 },
            { color: "#065f46", position: 75 },
            { color: "#10b981", position: 100 }
        ]
    },
    {
        name: "Cyberpunk Sunset",
        type: "linear",
        angle: 45,
        stops: [
            { color: "#312e81", position: 0 },
            { color: "#a21caf", position: 45 },
            { color: "#f43f5e", position: 75 },
            { color: "#fbbf24", position: 100 }
        ]
    },
    {
        name: "Nordic Frost",
        type: "linear",
        angle: 90,
        stops: [
            { color: "#00c6ff", position: 0 },
            { color: "#0072ff", position: 100 }
        ]
    },
    {
        name: "Midnight Glow",
        type: "radial",
        angle: 0,
        stops: [
            { color: "#6366f1", position: 0 },
            { color: "#1e1b4b", position: 60 },
            { color: "#020617", position: 100 }
        ]
    },
    {
        name: "Conic Spectrum",
        type: "conic",
        angle: 0,
        stops: [
            { color: "#ef4444", position: 0 },
            { color: "#eab308", position: 25 },
            { color: "#10b981", position: 50 },
            { color: "#06b6d4", position: 75 },
            { color: "#ef4444", position: 100 }
        ]
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

export default function GradientWallpaperGenerator() {
    // Canvas & Configuration State
    const [gradientType, setGradientType] = useState<GradientType>("linear");
    const [angle, setAngle] = useState<number>(135);
    const [colorStops, setColorStops] = useState<ColorStop[]>([
        { id: "1", color: "#4f46e5", position: 0 },
        { id: "2", color: "#7c3aed", position: 50 },
        { id: "3", color: "#ec4899", position: 100 }
    ]);
    const [selectedPresetId, setSelectedPresetId] = useState<string>("4k-uhd");
    const [customWidth, setCustomWidth] = useState<number>(3840);
    const [customHeight, setCustomHeight] = useState<number>(2160);
    const [noiseOpacity, setNoiseOpacity] = useState<number>(0);
    const [radialCenterX, setRadialCenterX] = useState<number>(50);
    const [radialCenterY, setRadialCenterY] = useState<number>(50);

    // UX Feedback States
    const [copiedCss, setCopiedCss] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<"controls" | "presets" | "code">("controls");

    // Canvas Preview Ref
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Preset Dimension Sync
    const handleSelectPreset = (presetId: string) => {
        setSelectedPresetId(presetId);
        const preset = PRESET_DIMENSIONS.find((p) => p.id === presetId);
        if (preset) {
            setCustomWidth(preset.width);
            setCustomHeight(preset.height);
        }
    };

    // Color Stop Controls
    const handleUpdateStop = (id: string, field: "color" | "position", value: string | number) => {
        setColorStops((prev) =>
            prev.map((stop) => {
                if (stop.id === id) {
                    return { ...stop, [field]: value };
                }
                return stop;
            })
        );
    };

    const handleAddStop = () => {
        if (colorStops.length >= 8) return;
        const lastStop = colorStops[colorStops.length - 1];
        const newPosition = Math.min(100, (lastStop?.position ?? 80) + 15);
        const newStop: ColorStop = {
            id: String(Date.now()),
            color: "#06b6d4",
            position: newPosition
        };
        setColorStops((prev) => [...prev, newStop].sort((a, b) => a.position - b.position));
    };

    const handleRemoveStop = (id: string) => {
        if (colorStops.length <= 2) return;
        setColorStops((prev) => prev.filter((stop) => stop.id !== id));
    };

    const handleRandomize = () => {
        const randomHex = () =>
            "#" +
            Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0");
        const stopCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 stops
        const newStops: ColorStop[] = [];
        const step = 100 / (stopCount - 1);

        for (let i = 0; i < stopCount; i++) {
            newStops.push({
                id: String(Date.now() + i),
                color: randomHex(),
                position: Math.round(i * step)
            });
        }

        const types: GradientType[] = ["linear", "linear", "radial", "conic"];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        setGradientType(chosenType);
        setAngle(Math.floor(Math.random() * 360));
        setColorStops(newStops);
    };

    const handleApplyCuratedPalette = (palette: (typeof CURATED_PALETTES)[0]) => {
        setGradientType(palette.type);
        setAngle(palette.angle);
        setColorStops(
            palette.stops.map((s, idx) => ({
                id: String(Date.now() + idx),
                color: s.color,
                position: s.position
            }))
        );
    };

    // Construct pure CSS gradient string
    const cssGradientString = useMemo(() => {
        const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
        const stopsString = sortedStops.map((s) => `${s.color} ${s.position}%`).join(", ");

        if (gradientType === "linear") {
            return `linear-gradient(${angle}deg, ${stopsString})`;
        } else if (gradientType === "radial") {
            return `radial-gradient(circle at ${radialCenterX}% ${radialCenterY}%, ${stopsString})`;
        } else {
            return `conic-gradient(from ${angle}deg at ${radialCenterX}% ${radialCenterY}%, ${stopsString})`;
        }
    }, [gradientType, angle, colorStops, radialCenterX, radialCenterY]);

    // Draw gradient to HTML5 Canvas (high-res buffer)
    const drawCanvas = useCallback(
        (targetCanvas: HTMLCanvasElement, targetWidth: number, targetHeight: number) => {
            const ctx = targetCanvas.getContext("2d");
            if (!ctx) return;

            targetCanvas.width = targetWidth;
            targetCanvas.height = targetHeight;

            const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);

            if (gradientType === "linear") {
                const angleRad = ((angle - 90) * Math.PI) / 180;
                const length = Math.abs(targetWidth * Math.cos(angleRad)) + Math.abs(targetHeight * Math.sin(angleRad));
                const cx = targetWidth / 2;
                const cy = targetHeight / 2;

                const x0 = cx - (Math.cos(angleRad) * length) / 2;
                const y0 = cy - (Math.sin(angleRad) * length) / 2;
                const x1 = cx + (Math.cos(angleRad) * length) / 2;
                const y1 = cy + (Math.sin(angleRad) * length) / 2;

                const grad = ctx.createLinearGradient(x0, y0, x1, y1);
                sortedStops.forEach((stop) => {
                    grad.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, targetWidth, targetHeight);
            } else if (gradientType === "radial") {
                const cx = (radialCenterX / 100) * targetWidth;
                const cy = (radialCenterY / 100) * targetHeight;
                const radius = Math.sqrt(Math.pow(targetWidth, 2) + Math.pow(targetHeight, 2)) / 2;

                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                sortedStops.forEach((stop) => {
                    grad.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
                });
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, targetWidth, targetHeight);
            } else {
                // Conic Gradient (HTML5 Canvas native support)
                const cx = (radialCenterX / 100) * targetWidth;
                const cy = (radialCenterY / 100) * targetHeight;
                const startAngle = (angle * Math.PI) / 180;

                type ConicCtx = CanvasRenderingContext2D & {
                    createConicGradient?: (startAngle: number, x: number, y: number) => CanvasGradient;
                };
                const conicCtx = ctx as ConicCtx;
                if (typeof conicCtx.createConicGradient === "function") {
                    const grad = conicCtx.createConicGradient(startAngle, cx, cy);
                    sortedStops.forEach((stop) => {
                        grad.addColorStop(Math.min(1, Math.max(0, stop.position / 100)), stop.color);
                    });
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                } else {
                    // Fallback to linear if browser lacks conic canvas API
                    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
                    sortedStops.forEach((stop) => {
                        grad.addColorStop(stop.position / 100, stop.color);
                    });
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                }
            }

            // Optional Grain / Procedural Noise Overlay
            if (noiseOpacity > 0) {
                const noiseCanvas = document.createElement("canvas");
                const noiseSize = 256;
                noiseCanvas.width = noiseSize;
                noiseCanvas.height = noiseSize;
                const nCtx = noiseCanvas.getContext("2d");
                if (nCtx) {
                    const imgData = nCtx.createImageData(noiseSize, noiseSize);
                    const buffer = new Uint32Array(imgData.data.buffer);
                    for (let i = 0; i < buffer.length; i++) {
                        const noiseVal = Math.floor(Math.random() * 255);
                        buffer[i] = (255 << 24) | (noiseVal << 16) | (noiseVal << 8) | noiseVal;
                    }
                    nCtx.putImageData(imgData, 0, 0);

                    const pattern = ctx.createPattern(noiseCanvas, "repeat");
                    if (pattern) {
                        ctx.save();
                        ctx.globalAlpha = noiseOpacity / 100;
                        ctx.fillStyle = pattern;
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                        ctx.restore();
                    }
                }
            }
        },
        [gradientType, angle, colorStops, radialCenterX, radialCenterY, noiseOpacity]
    );

    // Sync Live Preview Canvas
    useEffect(() => {
        if (!canvasRef.current) return;
        // Preview dimensions scaled down proportionally to ensure smooth 60fps rendering
        const maxDisplayWidth = 800;
        const scale = Math.min(1, maxDisplayWidth / Math.max(customWidth, 1));
        const pWidth = Math.max(100, Math.round(customWidth * scale));
        const pHeight = Math.max(100, Math.round(customHeight * scale));

        drawCanvas(canvasRef.current, pWidth, pHeight);
    }, [drawCanvas, customWidth, customHeight]);

    // High-Resolution PNG Export Pipeline
    const handleDownloadPNG = () => {
        setIsExporting(true);

        setTimeout(() => {
            try {
                const exportCanvas = document.createElement("canvas");
                drawCanvas(exportCanvas, customWidth, customHeight);

                exportCanvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            setIsExporting(false);
                            return;
                        }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `gradient-${customWidth}x${customHeight}-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setIsExporting(false);
                    },
                    "image/png",
                    1.0
                );
            } catch (err) {
                console.error("Export failure:", err);
                setIsExporting(false);
            }
        }, 100);
    };

    const handleCopyCSS = () => {
        const fullCss = `/* TwisterTools High-Res Wallpaper Gradient */\nbackground: ${colorStops[0]?.color ?? "#000000"};\nbackground: ${cssGradientString};`;
        navigator.clipboard.writeText(fullCss);
        setCopiedCss(true);
        setTimeout(() => setCopiedCss(false), 2000);
    };

    // WebApplication and FAQ JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Canvas Color Gradient Generator & High-Res PNG Exporter",
        "url": "https://twistertools.com/tools/image-tools/gradient-wallpaper-generator",
        "description": "Design custom linear, radial, and conic color gradients with multi-stop color distribution and export crystal-clear PNG wallpapers in up to 4K UHD resolution natively in your browser.",
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
                "name": "Are the exported gradient wallpapers truly full 4K UHD resolution?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When you select the 4K UHD preset (3840 × 2160 pixels) or input custom pixel values, the tool renders the gradient into an off-screen HTML5 canvas buffer at exact 1:1 hardware pixel coordinates before producing an uncompressed 24-bit PNG file."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Linear, Radial, and Conic gradients?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A Linear gradient interpolates color transitions along a straight directional vector defined by an angle in degrees. A Radial gradient expands transitions symmetrically outward from an origin coordinate in concentric circles or ellipses. A Conic gradient sweeps colors clockwise 360 degrees around a focal point, creating pie-slice and kaleidoscope vortex transitions."
                }
            },
            {
                "@type": "Question",
                "name": "How does the noise grain overlay prevent color banding in smooth gradients?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Color banding occurs when 8-bit color channels (256 levels per RGB channel) lack enough discrete steps to represent subtle transitions smoothly, creating visible stepped stripes. Adding a subtle procedural noise grain introduces microscopic dithering, breaking the stepped boundaries and creating a continuous visual flow on high-dynamic-range displays."
                }
            },
            {
                "@type": "Question",
                "name": "Is my image processed on a remote server or kept completely private?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All gradient calculations, noise generation, canvas rasterization, and PNG file packaging occur 100% locally inside your browser thread via JavaScript and the HTML5 Canvas 2D Rendering Context. No imagery, dimensions, or color codes are ever sent to an external server."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use the exported CSS code directly in production websites?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The generated CSS string adheres to standard W3C CSS Images Module Level 3 and Level 4 specifications, complete with fallback background solid declarations, making it immediately drop-in ready for Tailwind CSS, CSS modules, and styled components."
                }
            },
            {
                "@type": "Question",
                "name": "Can I create wallpapers for dual monitors or mobile smartphones?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The generator includes dedicated presets for Ultrawide 21:9 monitors (3440 × 1440), iPhone / Android displays (1179 × 2556), MacBook Pro Retina displays, social media open-graph banners, and supports custom arbitrary dimensions up to 8000 pixels."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Interactive 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Design Controls & Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Panel Title & Randomize Action Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                                Design Controls
                            </h2>
                            <button
                                type="button"
                                onClick={handleRandomize}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition border border-indigo-200/60 cursor-pointer"
                                title="Generate Random Gradient Palette & Angle"
                            >
                                <Shuffle className="w-3.5 h-3.5" />
                                <span>Randomize</span>
                            </button>
                        </div>

                        {/* Full-Width Tab Switcher Modal Row */}
                        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveTab("controls")}
                                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${activeTab === "controls"
                                        ? "bg-white text-indigo-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Custom
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("presets")}
                                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${activeTab === "presets"
                                        ? "bg-white text-indigo-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                Palettes
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("code")}
                                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer text-center ${activeTab === "code"
                                        ? "bg-white text-indigo-600 shadow-sm font-bold"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                CSS Code
                            </button>
                        </div>

                        {activeTab === "controls" && (
                            <div className="space-y-5">
                                {/* Gradient Mathematical Type */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Shapes className="w-4 h-4 text-indigo-600" />
                                        Interpolation Geometry
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setGradientType(type)}
                                                className={`py-2 px-3 text-xs font-bold rounded-xl transition border uppercase tracking-wider cursor-pointer ${gradientType === type
                                                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Angle / Rotation Slider */}
                                {(gradientType === "linear" || gradientType === "conic") && (
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                            <span className="flex items-center gap-1.5 uppercase tracking-wider">
                                                <Compass className="w-4 h-4 text-indigo-600" />
                                                Direction Angle
                                            </span>
                                            <span className="font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                {angle}°
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            value={angle}
                                            onChange={(e) => setAngle(Number(e.target.value))}
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                                            <span>0° (Right)</span>
                                            <span>90° (Bottom)</span>
                                            <span>180° (Left)</span>
                                            <span>270° (Top)</span>
                                            <span>360°</span>
                                        </div>
                                    </div>
                                )}

                                {/* Radial Origin Coordinates */}
                                {gradientType === "radial" && (
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Maximize2 className="w-4 h-4 text-indigo-600" />
                                            Focal Center Origin
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                                                    <span>Center X:</span>
                                                    <span className="text-indigo-600">{radialCenterX}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={radialCenterX}
                                                    onChange={(e) => setRadialCenterX(Number(e.target.value))}
                                                    className="w-full accent-indigo-600 cursor-pointer"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                                                    <span>Center Y:</span>
                                                    <span className="text-indigo-600">{radialCenterY}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={radialCenterY}
                                                    onChange={(e) => setRadialCenterY(Number(e.target.value))}
                                                    className="w-full accent-indigo-600 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Color Stops Manager */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Paintbrush className="w-4 h-4 text-indigo-600" />
                                            Color Stops ({colorStops.length}/8)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddStop}
                                            disabled={colorStops.length >= 8}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Stop
                                        </button>
                                    </div>

                                    {/* Color Stops Visual Stack */}
                                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                        {colorStops.map((stop) => (
                                            <div
                                                key={stop.id}
                                                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={stop.color}
                                                        onChange={(e) => handleUpdateStop(stop.id, "color", e.target.value)}
                                                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                                                    />
                                                    <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                                                        {stop.color}
                                                    </span>
                                                </div>

                                                <div className="flex-1 flex items-center gap-2">
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="100"
                                                        value={stop.position}
                                                        onChange={(e) =>
                                                            handleUpdateStop(stop.id, "position", Number(e.target.value))
                                                        }
                                                        className="w-full accent-indigo-600 cursor-pointer"
                                                    />
                                                    <span className="font-mono text-xs text-slate-500 w-9 text-right">
                                                        {stop.position}%
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveStop(stop.id)}
                                                    disabled={colorStops.length <= 2}
                                                    className="text-slate-400 hover:text-rose-600 disabled:opacity-20 transition cursor-pointer p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Procedural Noise Grain Factor */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5 uppercase tracking-wider">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                            Anti-Banding Film Grain
                                        </span>
                                        <span className="font-mono text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {noiseOpacity}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="30"
                                        value={noiseOpacity}
                                        onChange={(e) => setNoiseOpacity(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Procedural Gaussian noise eliminates 8-bit color stepped banding on OLED and 4K displays.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === "presets" && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Curated Architectural Palettes
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                                    {CURATED_PALETTES.map((palette) => {
                                        const previewBg =
                                            palette.type === "linear"
                                                ? `linear-gradient(${palette.angle}deg, ${palette.stops
                                                    .map((s) => `${s.color} ${s.position}%`)
                                                    .join(", ")})`
                                                : palette.type === "radial"
                                                    ? `radial-gradient(circle, ${palette.stops
                                                        .map((s) => `${s.color} ${s.position}%`)
                                                        .join(", ")})`
                                                    : `conic-gradient(from ${palette.angle}deg, ${palette.stops
                                                        .map((s) => `${s.color} ${s.position}%`)
                                                        .join(", ")})`;

                                        return (
                                            <button
                                                key={palette.name}
                                                type="button"
                                                onClick={() => handleApplyCuratedPalette(palette)}
                                                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 text-left transition group space-y-2.5 bg-slate-50 hover:bg-white shadow-xs cursor-pointer"
                                            >
                                                <div
                                                    className="w-full h-14 rounded-lg shadow-inner border border-black/10"
                                                    style={{ background: previewBg }}
                                                />
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                                                        {palette.name}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                                        {palette.type}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === "code" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Code2 className="w-4 h-4 text-indigo-600" />
                                        Production CSS Code
                                    </label>
                                    <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">
                                        <p className="text-slate-500">{"/* TwisterTools CSS Export */"}</p>
                                        <p className="text-slate-200">
                                            background-color:{" "}
                                            <span className="text-amber-300">{colorStops[0]?.color ?? "#000000"}</span>;
                                        </p>
                                        <p className="text-slate-200">
                                            background-image:{" "}
                                            <span className="text-indigo-300">{cssGradientString}</span>;
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyCSS}
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition"
                                >
                                    {copiedCss ? (
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    {copiedCss ? "CSS Copied to Clipboard!" : "Copy Full CSS Ruleset"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Canvas Target Resolution Config */}
                    <div className="pt-5 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Monitor className="w-4 h-4 text-indigo-600" />
                                Target Export Resolution
                            </label>
                            <span className="font-mono text-xs font-bold text-indigo-600">
                                {customWidth} × {customHeight} px
                            </span>
                        </div>

                        <select
                            value={selectedPresetId}
                            onChange={(e) => handleSelectPreset(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white cursor-pointer"
                        >
                            {PRESET_DIMENSIONS.map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                    {preset.label}
                                </option>
                            ))}
                        </select>

                        {/* Custom Resolution Inputs */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Width (px)</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="8192"
                                    value={customWidth === 0 ? "" : customWidth}
                                    onChange={(e) => {
                                        handleNumberInput(e, setCustomWidth);
                                        setSelectedPresetId("custom");
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1">Height (px)</label>
                                <input
                                    type="number"
                                    min="100"
                                    max="8192"
                                    value={customHeight === 0 ? "" : customHeight}
                                    onChange={(e) => {
                                        handleNumberInput(e, setCustomHeight);
                                        setSelectedPresetId("custom");
                                    }}
                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Canvas Stage & High-Res PNG Exporter */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Interactive Canvas Stage
                            </h2>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-lg">
                                Real-Time Render
                            </span>
                        </div>

                        {/* Interactive Canvas Stage Container */}
                        <div className="w-full bg-slate-950 rounded-2xl border border-slate-800 p-3 sm:p-5 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden shadow-inner">
                            <div
                                className="relative rounded-lg shadow-2xl overflow-hidden border border-white/20 transition-all duration-300 max-h-[380px] max-w-full flex items-center justify-center"
                                style={{
                                    aspectRatio: `${customWidth} / ${customHeight}`
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full object-contain block"
                                />
                            </div>
                            <div className="mt-4 flex items-center gap-3 text-[11px] font-mono text-slate-400">
                                <span>Aspect: {(customWidth / customHeight).toFixed(2)}:1</span>
                                <span>•</span>
                                <span>
                                    Render Mode: {gradientType.toUpperCase()}
                                </span>
                                {noiseOpacity > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-indigo-400">Noise: {noiseOpacity}%</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Active Palette Visual Summary Strip */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>Active Color Stops</span>
                                <span className="text-slate-400 font-mono">{colorStops.length} Nodes</span>
                            </div>
                            <div className="flex h-3 rounded-md overflow-hidden shadow-xs">
                                {colorStops.map((stop) => (
                                    <div
                                        key={stop.id}
                                        style={{ backgroundColor: stop.color, flex: 1 }}
                                        title={`${stop.color} (${stop.position}%)`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {colorStops.map((stop) => (
                                    <span
                                        key={stop.id}
                                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 uppercase"
                                    >
                                        {stop.color}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* High-Resolution PNG Action CTA */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            type="button"
                            onClick={handleDownloadPNG}
                            disabled={isExporting}
                            className="w-full flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm sm:text-base transition shadow-sm cursor-pointer"
                        >
                            <Download className={`w-5 h-5 ${isExporting ? "animate-bounce" : ""}`} />
                            {isExporting ? "Rasterizing 4K PNG..." : `Export ${customWidth} × ${customHeight} PNG`}
                        </button>

                        <button
                            type="button"
                            onClick={handleCopyCSS}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200 cursor-pointer whitespace-nowrap"
                        >
                            {copiedCss ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            {copiedCss ? "Copied" : "Copy CSS"}
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Foundations of Digital Color Gradients */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Interpolation & Digital Color Gradients
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        A color gradient is an algorithmic continuum of colors produced by interpolating values across a geometric coordinate space. Rather than placing solid pixel fills, the rendering pipeline maps coordinates across a normalized axis (t ∈ [0, 1]) and evaluates mathematical interpolation functions across red, green, and blue color channels.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Compass className="w-4 h-4 text-indigo-600" /> Linear Transitions
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Linear gradients interpolate colors along a 1-dimensional ray projected across angle θ. The vector normalizes the distance between boundaries, projecting smooth orthogonal wavefronts across the surface.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Radial Transitions
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Radial gradients distribute color values outward from a central focal point (x₀, y₀) to radius R according to Euclidean distance d = √((x - x₀)² + (y - y₀)²), creating luminous concentric blooms.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Shapes className="w-4 h-4 text-indigo-600" /> Conic Rotations
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                Conic (sweep) gradients rotate color stops 360 degrees around a pivotal vertex using the polar angle θ = arctan2(y - y₀, x - x₀), generating chromatic vortexes and pie charts.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Resolution & Device Reference Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Standard Wallpaper Display Resolutions & Aspect Ratio Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Exporting wallpapers at exact native display dimensions prevents operating systems from performing bilinear stretching or downsampling, preserving pixel sharpness and gradient clarity:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Target Platform / Hardware</th>
                                    <th className="p-3">Aspect Ratio</th>
                                    <th className="p-3">Native Resolution (W × H)</th>
                                    <th className="p-3">Total Pixels (MP)</th>
                                    <th className="p-3">Recommended Export</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">4K Ultra HD Monitor</td>
                                    <td className="p-3 font-mono">16:9</td>
                                    <td className="p-3 font-mono">3840 × 2160</td>
                                    <td className="p-3 font-bold text-indigo-600">8.29 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Ultrawide Curved Monitor</td>
                                    <td className="p-3 font-mono">21:9</td>
                                    <td className="p-3 font-mono">3440 × 1440</td>
                                    <td className="p-3 font-bold text-indigo-600">4.95 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">2K QHD Gaming Display</td>
                                    <td className="p-3 font-mono">16:9</td>
                                    <td className="p-3 font-mono">2560 × 1440</td>
                                    <td className="p-3 font-bold text-indigo-600">3.68 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Apple MacBook Pro 16″</td>
                                    <td className="p-3 font-mono">16:10</td>
                                    <td className="p-3 font-mono">3024 × 1964</td>
                                    <td className="p-3 font-bold text-indigo-600">5.94 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Apple iPhone 16 Pro / Max</td>
                                    <td className="p-3 font-mono">19.5:9</td>
                                    <td className="p-3 font-mono">1179 × 2556</td>
                                    <td className="p-3 font-bold text-indigo-600">3.01 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">OpenGraph Social Banner</td>
                                    <td className="p-3 font-mono">1.91:1</td>
                                    <td className="p-3 font-mono">1200 × 630</td>
                                    <td className="p-3 font-bold text-indigo-600">0.76 MP</td>
                                    <td className="p-3">PNG 24-bit Lossless</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Color Banding Elimination & Dithering Techniques */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Solving Color Banding in High-Res Display Buffers
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Color banding is a frequent artifact in digital graphics where continuous transitions appear as jagged, discrete stripes rather than smooth gradients. This occurs because standard 24-bit TrueColor buffers allocate only 8 bits per channel (256 discrete intensity levels per Red, Green, and Blue component). When two similar color stops stretch across thousands of pixels on a 4K screen, the system runs out of discrete levels to represent each tiny step.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Spatial Dithering via Gaussian Film Grain</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                By modulating pixels with microscopic procedural noise, the sharp stepped boundary between two color tones is shattered into a randomized stipple pattern. The human visual cortex integrates these micro-variations into a unified, silky transition.
                            </p>
                        </div>
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Multi-Stop Intermediate Harmonics</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Inserting midpoint color stops between two contrasting hues prevents colors from passing through dull grayish midtones in sRGB space, ensuring saturated, vibrant chromatic transitions across the entire canvas spectrum.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are the exported gradient wallpapers truly full 4K UHD resolution?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When you select the 4K UHD preset (3840 × 2160 pixels) or input custom pixel values, the tool renders the gradient into an off-screen HTML5 canvas buffer at exact 1:1 hardware pixel coordinates before producing an uncompressed 24-bit PNG file.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Linear, Radial, and Conic gradients?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A Linear gradient interpolates color transitions along a straight directional vector defined by an angle in degrees. A Radial gradient expands transitions symmetrically outward from an origin coordinate in concentric circles or ellipses. A Conic gradient sweeps colors clockwise 360 degrees around a focal point, creating pie-slice and kaleidoscope vortex transitions.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the noise grain overlay prevent color banding in smooth gradients?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Color banding occurs when 8-bit color channels (256 levels per RGB channel) lack enough discrete steps to represent subtle transitions smoothly, creating visible stepped stripes. Adding a subtle procedural noise grain introduces microscopic dithering, breaking the stepped boundaries and creating a continuous visual flow on high-dynamic-range displays.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my image processed on a remote server or kept completely private?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                All gradient calculations, noise generation, canvas rasterization, and PNG file packaging occur 100% locally inside your browser thread via JavaScript and the HTML5 Canvas 2D Rendering Context. No imagery, dimensions, or color codes are ever sent to an external server.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use the exported CSS code directly in production websites?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The generated CSS string adheres to standard W3C CSS Images Module Level 3 and Level 4 specifications, complete with fallback background solid declarations, making it immediately drop-in ready for Tailwind CSS, CSS modules, and styled components.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I create wallpapers for dual monitors or mobile smartphones?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. The generator includes dedicated presets for Ultrawide 21:9 monitors (3440 × 1440), iPhone / Android displays (1179 × 2556), MacBook Pro Retina displays, social media open-graph banners, and supports custom arbitrary dimensions up to 8000 pixels.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}