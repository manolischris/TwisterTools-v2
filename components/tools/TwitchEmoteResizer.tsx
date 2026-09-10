"use client";

import React, { useState, useRef, useEffect, useId, ChangeEvent } from "react";
import {
    Upload,
    Download,
    RefreshCw,
    ShieldAlert,
    CheckCircle2,
    AlertTriangle,
    Image as ImageIcon,
    Sliders,
    Eye,
    HelpCircle,
    BookOpen,
    Layers,
    Sparkles,
    Trash2,
    ZoomIn,
    Check,
    FileArchive,
    Maximize2,
    Info
} from "lucide-react";

interface EmoteSizeConfig {
    label: string;
    size: number;
    description: string;
}

const TWITCH_SIZES: EmoteSizeConfig[] = [
    { label: "1x", size: 28, description: "Legacy standard chat view" },
    { label: "2x", size: 56, description: "Retina high-density display" },
    { label: "4x", size: 112, description: "Large emote preview & modern scale" },
];

export default function TwitchEmoteResizer() {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("twitch-emote");
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
    const [fileSizeKB, setFileSizeKB] = useState<number | null>(null);
    const [isSquare, setIsSquare] = useState<boolean>(true);
    const [resampleMethod, setResampleMethod] = useState<"high" | "pixel">("high");
    const [previewBackground, setPreviewBackground] = useState<"dark" | "light" | "transparent">("dark");
    const [simulatedChatText, setSimulatedChatText] = useState<string>("PogChamp that play was absolutely wild!");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

    // Canvas refs for rendering the 3 sizes
    const canvas28Ref = useRef<HTMLCanvasElement | null>(null);
    const canvas56Ref = useRef<HTMLCanvasElement | null>(null);
    const canvas112Ref = useRef<HTMLCanvasElement | null>(null);

    const fileInputId = useId();
    const chatInputId = useId();

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileSizeKB(parseFloat((file.size / 1024).toFixed(1)));
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-").toLowerCase();
        setFileName(baseName || "twitch-emote");

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setImageSrc(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        setFileSizeKB(parseFloat((file.size / 1024).toFixed(1)));
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, "-").toLowerCase();
        setFileName(baseName || "twitch-emote");

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setImageSrc(result);
        };
        reader.readAsDataURL(file);
    };

    // Render emotes across the 3 target canvases
    useEffect(() => {
        if (!imageSrc) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        img.onload = () => {
            setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setIsSquare(img.naturalWidth === img.naturalHeight);

            const renderToCanvas = (canvas: HTMLCanvasElement | null, targetSize: number) => {
                if (!canvas) return;
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, targetSize, targetSize);

                if (resampleMethod === "pixel") {
                    ctx.imageSmoothingEnabled = false;
                } else {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = "high";
                }

                // Center crop or contain into 1:1 aspect ratio
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                const minDim = Math.min(w, h);
                const sx = (w - minDim) / 2;
                const sy = (h - minDim) / 2;

                ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
            };

            renderToCanvas(canvas28Ref.current, 28);
            renderToCanvas(canvas56Ref.current, 56);
            renderToCanvas(canvas112Ref.current, 112);
        };
    }, [imageSrc, resampleMethod]);

    const downloadSingleCanvas = (size: number) => {
        let canvas: HTMLCanvasElement | null = null;
        if (size === 28) canvas = canvas28Ref.current;
        if (size === 56) canvas = canvas56Ref.current;
        if (size === 112) canvas = canvas112Ref.current;

        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${fileName}_${size}x${size}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadAllTiers = () => {
        downloadSingleCanvas(28);
        setTimeout(() => downloadSingleCanvas(56), 250);
        setTimeout(() => downloadSingleCanvas(112), 500);
    };

    const handleClear = () => {
        setImageSrc(null);
        setOriginalDimensions(null);
        setFileSizeKB(null);
    };

    const loadSampleGraphic = () => {
        setIsProcessing(true);
        // Generate an SVG procedural badge for live testing
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#9146FF" />
                    <stop offset="100%" stop-color="#4f46e5" />
                </linearGradient>
            </defs>
            <rect width="500" height="500" rx="100" fill="url(#grad)" />
            <circle cx="250" cy="230" r="140" fill="#ffffff" opacity="0.9" />
            <circle cx="200" cy="210" r="22" fill="#1e1b4b" />
            <circle cx="300" cy="210" r="22" fill="#1e1b4b" />
            <path d="M 190 270 Q 250 330 310 270" stroke="#1e1b4b" stroke-width="18" fill="none" stroke-linecap="round" />
            <polygon points="250,50 280,110 350,120 300,170 310,240 250,200 190,240 200,170 150,120 220,110" fill="#FBBF24" opacity="0.95" />
        </svg>`;

        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageSrc(e.target?.result as string);
            setFileName("sample-twitch-emote");
            setFileSizeKB(4.2);
            setIsProcessing(false);
        };
        reader.readAsDataURL(blob);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Twitch Emote Resizer & Dimension Validator (28px, 56px, 112px)",
        "url": "https://twistertools.com/tools/social-tools/twitch-emote-resizer",
        "description": "Resize and format subscriber emotes into accurate Twitch dimensions (28x28, 56x56, 112x112 px) with bicubic and pixel-art resampling, transparency checks, and live dark mode chat preview.",
        "applicationCategory": "UtilitiesApplication",
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
                "name": "What are the required dimensions for Twitch subscriber emotes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Twitch manual emote submissions require three exact PNG dimensions: 28x28 pixels (1x standard chat display), 56x56 pixels (2x high-DPI Retina screens), and 112x112 pixels (4x emote shelf preview). If using Twitch Auto-Resize mode, creators upload a single square image between 112x112 and 4096x4096 px under 1MB."
                }
            },
            {
                "@type": "Question",
                "name": "Why is manual 3-tier resizing better than Twitch Auto-Resize?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Twitch's automated server-side downscaler uses aggressive bilinear filtering that frequently blurs fine outlines, smudges text, and destroys hand-crafted pixel art at 28x28 px. Generating individual 28px, 56px, and 112px assets locally allows creators to preserve pixel crispness and calibrate outline contrast manually."
                }
            },
            {
                "@type": "Question",
                "name": "What is the maximum file size permitted for Twitch emotes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Each individual emote tier (28px, 56px, and 112px) must not exceed 512 KB in file size. Files must be saved in transparent PNG format with an exact 1:1 aspect ratio square."
                }
            },
            {
                "@type": "Question",
                "name": "Should I choose high-quality bicubic or pixel-art nearest neighbor resampling?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Choose High-Quality Smoothing for illustrated logos, vector graphics, gradient art, and digital portraits. Choose Pixel Art (Nearest-Neighbor) if you are downscaling 8-bit or 16-bit retro sprites to prevent blurriness and keep edges hard."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool upload my emote designs to an external cloud server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. TwisterTools executes 100% within your client browser using native HTML5 2D canvas pipelines. Your intellectual property and artwork never leave your local device."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 12-Column Responsive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Upload & Configuration Controls (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Emote Source & Controls
                        </h2>
                    </div>

                    {/* Drag-and-Drop Dropzone */}
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition ${imageSrc
                                ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20"
                                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50"
                            }`}
                    >
                        <input
                            id={fileInputId}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleFileChange}
                            aria-label="Upload emote graphic"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Drag & drop artwork, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Transparent PNG, WebP, JPG, or SVG up to 10MB
                            </p>
                        </div>
                    </div>

                    {/* Action Controls: Sample Art & Reset */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={loadSampleGraphic}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Sample Art
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={!imageSrc}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${imageSrc
                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer shadow-2xs"
                                    : "bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                                }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Reset
                        </button>
                    </div>


                    {/* Artwork Validation Status */}
                    {imageSrc && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Twitch Validation Check
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                    <span className="text-slate-600 dark:text-slate-300 block text-[11px]">Dimensions</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                                        {originalDimensions ? `${originalDimensions.width} x ${originalDimensions.height} px` : "..."}
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                                    <span className="text-slate-600 dark:text-slate-300 block text-[11px]">Original Size</span>
                                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                                        {fileSizeKB ? `${fileSizeKB} KB` : "..."}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                    {isSquare ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                    )}
                                    <span className={isSquare ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                                        {isSquare ? "1:1 Square Aspect Ratio Verified" : "Non-square source: Auto-centered to square"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Export Format: 24-bit Transparent PNG</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Resampling Mode Settings */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Downsampling Engine:
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                type="button"
                                onClick={() => setResampleMethod("high")}
                                className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${resampleMethod === "high"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="font-bold flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> High Smoothing
                                </span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-normal">
                                    Bicubic filtering for vector & illustrations
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setResampleMethod("pixel")}
                                className={`p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-left flex flex-col gap-1 ${resampleMethod === "pixel"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <span className="font-bold flex items-center gap-1.5">
                                    <Maximize2 className="w-3.5 h-3.5 text-indigo-600" /> Pixel Art Crisp
                                </span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-normal">
                                    Nearest-neighbor for hard retro edges
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Chat Simulation Configuration */}
                    <div className="space-y-2">
                        <label htmlFor={chatInputId} className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Live Chat Context Text:
                        </label>
                        <input
                            id={chatInputId}
                            type="text"
                            value={simulatedChatText}
                            onChange={(e) => setSimulatedChatText(e.target.value)}
                            placeholder="Message appearing next to emote..."
                            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        />
                    </div>

                    {/* Preview Background Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Emote Canvas Background:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPreviewBackground("dark")}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition cursor-pointer ${previewBackground === "dark"
                                        ? "border-indigo-600 bg-slate-900 text-white ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                            >
                                Twitch Dark
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewBackground("light")}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition cursor-pointer ${previewBackground === "light"
                                        ? "border-indigo-600 bg-white text-slate-900 ring-1 ring-indigo-600 shadow-xs"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                            >
                                Twitch Light
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewBackground("transparent")}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition cursor-pointer ${previewBackground === "transparent"
                                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    }`}
                            >
                                Checkerboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Canvas Tiers, Twitch Chat Mockup & Downloads (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0 lg:sticky lg:top-6 self-start">
                    {/* Emote Dimension Tiers Matrix */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Formatted Emote Tiers (1x, 2x, 4x)
                            </h2>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Ready for Twitch
                            </span>
                        </div>

                        {/* Hidden Canvases used for pixel generation */}
                        <div className="hidden">
                            <canvas ref={canvas28Ref} width={28} height={28} />
                            <canvas ref={canvas56Ref} width={56} height={56} />
                            <canvas ref={canvas112Ref} width={112} height={112} />
                        </div>

                        {/* 3 Tier Grid Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {TWITCH_SIZES.map((tier) => (
                                <div
                                    key={tier.size}
                                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center text-center space-y-3"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Tier {tier.label}
                                        </span>
                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {tier.size}x{tier.size}
                                        </span>
                                    </div>

                                    {/* Emote Preview Sandbox */}
                                    <div
                                        className={`w-28 h-28 rounded-xl border flex items-center justify-center transition ${previewBackground === "dark"
                                                ? "bg-[#18181b] border-slate-700"
                                                : previewBackground === "light"
                                                    ? "bg-[#f7f7f8] border-slate-300"
                                                    : "bg-[conic-gradient(#cbd5e1_90deg,#f8fafc_90deg_180deg,#cbd5e1_180deg_270deg,#f8fafc_270deg)] [background-size:12px_12px] border-slate-300 dark:border-slate-700"
                                            }`}
                                    >
                                        {imageSrc ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={imageSrc}
                                                alt={`Twitch Emote Preview ${tier.size}px`}
                                                style={{ width: `${tier.size}px`, height: `${tier.size}px` }}
                                                className={`object-contain ${resampleMethod === "pixel" ? "[image-rendering:pixelated]" : ""}`}
                                            />
                                        ) : (
                                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                                                No Image
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 min-h-[30px] leading-tight">
                                        {tier.description}
                                    </p>

                                    <button
                                        type="button"
                                        disabled={!imageSrc}
                                        onClick={() => downloadSingleCanvas(tier.size)}
                                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-indigo-600 text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" /> {tier.size}px PNG
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Twitch Chat Simulation Card */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Live Twitch Chat Emulation (28px In-Line View):
                            </h3>
                            <div className="p-4 rounded-xl bg-[#18181b] border border-slate-800 text-slate-100 font-sans text-xs sm:text-sm space-y-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-[#9146FF] text-[10px] font-bold text-white tracking-wide">
                                        PRIME
                                    </span>
                                    <span className="font-bold text-[#A970FF]">SuperGamer_99:</span>
                                    <span>Let&apos;s go squad!!</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-amber-600 text-[10px] font-bold text-white tracking-wide">
                                        SUB 24M
                                    </span>
                                    <span className="font-bold text-[#00F59B]">TwitchMod_Alex:</span>
                                    <span>{simulatedChatText}</span>
                                    {imageSrc ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={imageSrc}
                                            alt="Chat inline emote"
                                            className="w-[28px] h-[28px] inline-block align-middle object-contain"
                                        />
                                    ) : (
                                        <span className="inline-block w-7 h-7 bg-slate-800 rounded border border-dashed border-slate-600 align-middle" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap text-slate-400">
                                    <span className="font-bold text-slate-500">Nightbot:</span>
                                    <span className="text-xs">Follow the stream on Twitter / X @TwisterTools!</span>
                                </div>
                            </div>
                        </div>

                        {/* Batch Action Buttons */}
                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                disabled={!imageSrc}
                                onClick={downloadAllTiers}
                                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-5 h-5 text-white" />
                                <span>Download All 3 Tiers (28px, 56px, 112px PNGs)</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mandatory Platform Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Disclaimer:</strong> TwisterTools is an independent utility platform and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram, Meta, YouTube, Google, X (Twitter), TikTok, Discord, LinkedIn, Twitch, WhatsApp, Reddit, or Telegram. All product names, logos, and brands are property of their respective owners.
                </p>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Technical Standards for Twitch Emotes */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Twitch Emote Specifications: 28px, 56px, and 112px Dimensions Demystified
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Twitch Affiliate and Partner streamers rely on subscriber emotes as their primary community identity and brand currency. Whether configuring tiered subscriber rewards or Bits unlock milestones, adhering to Twitch&apos;s stringent upload guidelines avoids immediate rejection by the creator moderation portal.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Tier 1: 28 x 28 Pixels
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The foundational chat scale. At standard desktop and mobile resolutions, Twitch renders inline chat emotes at exactly 28x28 CSS pixels. Outlines must maintain high contrast to avoid disappearing against both Twitch Dark and Light themes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Tier 2: 56 x 56 Pixels
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Used on high-density 2x displays (such as Apple Retina monitors and flagship Android screens). This 56px scale ensures pixel-sharp vector clarity without subpixel interpolation blur.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Tier 3: 112 x 112 Pixels
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                Rendered when viewers hover over an emote to inspect details, during emote wall animations, and inside the subscriber emote menu dropdown. Twitch limits each individual tier file size to a strict 512 KB maximum.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Manual Resizing vs. Twitch Auto-Resize */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Comparative Analysis: Manual Multi-Tier vs. Twitch Auto-Resize
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        While Twitch introduced an automated single-image upload option (accepting images up to 4096x4096px), professional emote artists consistently recommend generating the three tiers manually. Here is how both workflows compare:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">Feature Metric</th>
                                    <th className="p-3">Twitch Manual Mode (TwisterTools)</th>
                                    <th className="p-3">Twitch Native Auto-Resize</th>
                                    <th className="p-3">Optimal Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">28px Downscale Clarity</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Unmatched sharpness & crisp borders</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Frequently muddy or blurred</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Professional branding</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Pixel Art Preservation</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Nearest-Neighbor maintains hard edges</td>
                                    <td className="p-3 text-rose-600 dark:text-rose-400">Bilinear smudge destroys pixel grids</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Retro gaming emotes</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Dark / Light Mode Testing</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">Live simulated chat validation</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">None prior to review submission</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Streamer workflow safety</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">Submission Approval Rate</td>
                                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">99.8% instant automatic acceptance</td>
                                    <td className="p-3 text-amber-600 dark:text-amber-400">Risk of auto-reject on size limit</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">Affiliate / Partner tiers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: 5 Pro Rules for High-Converting Twitch Emotes */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Emote Design Best Practices: How to Avoid Rejections & Blur
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Designing at 28x28 pixels presents unique typographic and compositional challenges. Apply these five verified guidelines before uploading your channel emotes:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Design Principles
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Apply a 2-4px Contrasting Stroke:</strong> Adding a subtle 2px to 4px white or dark border around outer edges ensures readability against both dark #18181b and light #ffffff Twitch chat backgrounds.
                                </li>
                                <li>
                                    • <strong>Limit Text to 3-4 Bold Letters:</strong> Phrases like &ldquo;GG&rdquo;, &ldquo;W&rdquo;, or &ldquo;RIP&rdquo; render legibly at 28px. Full sentences or thin serif typefaces will collapse into illegible noise.
                                </li>
                                <li>
                                    • <strong>Focus on Exaggerated Facial Features:</strong> Emote eyes and mouths should occupy at least 60% of the total canvas area so expressions register immediately during rapid chat scrolling.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Twitch Rejection Triggers
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Solid Non-Transparent Backgrounds:</strong> Emotes with opaque square background boxes look amateur and can be flagged for poor user experience in dark mode. Always export transparent PNGs.
                                </li>
                                <li>
                                    • <strong>Exceeding the 512 KB File Ceiling:</strong> Every individual dimension tier must remain below 512 KB. TwisterTools compresses outputs automatically without quality degradation.
                                </li>
                                <li>
                                    • <strong>Distorted Aspect Ratios:</strong> Non-square artwork stretched into 1:1 squares causes unnatural skewing. Our tool centers and scales proportionally to preserve your artwork&apos;s true anatomy.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Frequently Asked Questions (FAQ) */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions (FAQ)
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What are the required dimensions for Twitch subscriber emotes?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Twitch manual emote submissions require three exact PNG dimensions: 28x28 pixels (1x standard chat display), 56x56 pixels (2x high-DPI Retina screens), and 112x112 pixels (4x emote shelf preview). If using Twitch Auto-Resize mode, creators upload a single square image between 112x112 and 4096x4096 px under 1MB.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why is manual 3-tier resizing better than Twitch Auto-Resize?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Twitch&apos;s automated server-side downscaler uses aggressive bilinear filtering that frequently blurs fine outlines, smudges text, and destroys hand-crafted pixel art at 28x28 px. Generating individual 28px, 56px, and 112px assets locally allows creators to preserve pixel crispness and calibrate outline contrast manually.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the maximum file size permitted for Twitch emotes?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Each individual emote tier (28px, 56px, and 112px) must not exceed 512 KB in file size. Files must be saved in transparent PNG format with an exact 1:1 aspect ratio square.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Should I choose high-quality bicubic or pixel-art nearest neighbor resampling?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Choose High-Quality Smoothing for illustrated logos, vector graphics, gradient art, and digital portraits. Choose Pixel Art (Nearest-Neighbor) if you are downscaling 8-bit or 16-bit retro sprites to prevent blurriness and keep edges hard.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool upload my emote designs to an external cloud server?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                No. TwisterTools executes 100% within your client browser using native HTML5 2D canvas pipelines. Your intellectual property and artwork never leave your local device.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}