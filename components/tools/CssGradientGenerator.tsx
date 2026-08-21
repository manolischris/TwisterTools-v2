"use client";

import React, { useState, useMemo } from "react";
import {
    Palette,
    Copy,
    Check,
    RefreshCw,
    Download,
    Sliders,
    Layers,
    Code2,
    Sparkles,
    Eye,
    Plus,
    Trash2,
    Compass,
    HelpCircle,
    BookOpen,
    Cpu,
    ArrowRightLeft,
    Share2,
    CheckCircle2
} from "lucide-react";

type GradientType = "linear" | "radial" | "conic";

interface ColorStop {
    id: string;
    color: string;
    stop: number;
}

const PRESET_GRADIENTS: { name: string; type: GradientType; angle: number; stops: ColorStop[] }[] = [
    {
        name: "Hyper Indigo",
        type: "linear",
        angle: 135,
        stops: [
            { id: "1", color: "#4f46e5", stop: 0 },
            { id: "2", color: "#7c3aed", stop: 50 },
            { id: "3", color: "#ec4899", stop: 100 },
        ],
    },
    {
        name: "Neon Sunset",
        type: "linear",
        angle: 90,
        stops: [
            { id: "1", color: "#f97316", stop: 0 },
            { id: "2", color: "#db2777", stop: 50 },
            { id: "3", color: "#6366f1", stop: 100 },
        ],
    },
    {
        name: "Cyber Emerald",
        type: "linear",
        angle: 120,
        stops: [
            { id: "1", color: "#10b981", stop: 0 },
            { id: "2", color: "#06b6d4", stop: 50 },
            { id: "3", color: "#3b82f6", stop: 100 },
        ],
    },
    {
        name: "Midnight Aura",
        type: "radial",
        angle: 0,
        stops: [
            { id: "1", color: "#1e1b4b", stop: 0 },
            { id: "2", color: "#312e81", stop: 60 },
            { id: "3", color: "#020617", stop: 100 },
        ],
    },
    {
        name: "Prismatic Conic",
        type: "conic",
        angle: 45,
        stops: [
            { id: "1", color: "#ef4444", stop: 0 },
            { id: "2", color: "#eab308", stop: 25 },
            { id: "3", color: "#10b981", stop: 50 },
            { id: "4", color: "#3b82f6", stop: 75 },
            { id: "5", color: "#ef4444", stop: 100 },
        ],
    },
    {
        name: "Warm Peach",
        type: "linear",
        angle: 45,
        stops: [
            { id: "1", color: "#ffecd2", stop: 0 },
            { id: "2", color: "#fcb69f", stop: 100 },
        ],
    },
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void,
    min: number = 0,
    max: number = 360
) => {
    const raw = e.target.value;
    if (raw === "") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) {
        setter(0);
    } else {
        setter(Math.min(max, Math.max(min, num)));
    }
};

const getRandomHexColor = (): string => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export default function CssGradientGenerator() {
    const [gradientType, setGradientType] = useState<GradientType>("linear");
    const [angle, setAngle] = useState<number>(135);
    const [radialShape, setRadialShape] = useState<"circle" | "ellipse">("circle");
    const [radialPosition, setRadialPosition] = useState<string>("center");
    const [stops, setStops] = useState<ColorStop[]>([
        { id: "1", color: "#4f46e5", stop: 0 },
        { id: "2", color: "#7c3aed", stop: 50 },
        { id: "3", color: "#ec4899", stop: 100 },
    ]);
    const [activeStopId, setActiveStopId] = useState<string>("1");
    const [includeVendorPrefixes, setIncludeVendorPrefixes] = useState<boolean>(true);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    const sortedStops = useMemo(() => {
        return [...stops].sort((a, b) => a.stop - b.stop);
    }, [stops]);

    const cssGradientValue = useMemo(() => {
        const stopString = sortedStops.map((s) => `${s.color} ${s.stop}%`).join(", ");
        if (gradientType === "linear") {
            return `linear-gradient(${angle}deg, ${stopString})`;
        } else if (gradientType === "radial") {
            return `radial-gradient(${radialShape} at ${radialPosition}, ${stopString})`;
        } else {
            return `conic-gradient(from ${angle}deg at ${radialPosition}, ${stopString})`;
        }
    }, [gradientType, angle, radialShape, radialPosition, sortedStops]);

    const fullCssDeclaration = useMemo(() => {
        if (!includeVendorPrefixes) {
            return `background: ${cssGradientValue};`;
        }
        const fallbackColor = sortedStops[0]?.color || "#4f46e5";
        const stopString = sortedStops.map((s) => `${s.color} ${s.stop}%`).join(", ");

        if (gradientType === "linear") {
            return `/* Fallback solid color */\nbackground-color: ${fallbackColor};\n/* WebKit (Chrome 10-25, Safari 5.1-6) */\nbackground: -webkit-linear-gradient(${angle}deg, ${stopString});\n/* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */\nbackground: linear-gradient(${angle}deg, ${stopString});`;
        } else if (gradientType === "radial") {
            return `/* Fallback solid color */\nbackground-color: ${fallbackColor};\n/* WebKit */\nbackground: -webkit-radial-gradient(${radialPosition}, ${radialShape}, ${stopString});\n/* Standard */\nbackground: radial-gradient(${radialShape} at ${radialPosition}, ${stopString});`;
        } else {
            return `/* Fallback solid color */\nbackground-color: ${fallbackColor};\n/* Conic Gradient (Standard W3C) */\nbackground: conic-gradient(from ${angle}deg at ${radialPosition}, ${stopString});`;
        }
    }, [includeVendorPrefixes, gradientType, angle, radialShape, radialPosition, sortedStops, cssGradientValue]);

    const tailwindArbitraryClass = useMemo(() => {
        return `bg-[${cssGradientValue.replace(/\s+/g, "_")}]`;
    }, [cssGradientValue]);

    const handleAddStop = () => {
        if (stops.length >= 10) return;
        const newStopVal = stops.length > 0 ? Math.min(100, Math.max(0, Math.round((stops[stops.length - 1].stop + 10) % 100))) : 50;
        const newStop: ColorStop = {
            id: Date.now().toString(),
            color: getRandomHexColor(),
            stop: newStopVal,
        };
        setStops([...stops, newStop]);
        setActiveStopId(newStop.id);
    };

    const handleRemoveStop = (id: string) => {
        if (stops.length <= 2) return;
        const filtered = stops.filter((s) => s.id !== id);
        setStops(filtered);
        if (activeStopId === id) {
            setActiveStopId(filtered[0].id);
        }
    };

    const handleUpdateStopColor = (id: string, color: string) => {
        setStops(stops.map((s) => (s.id === id ? { ...s, color } : s)));
    };

    const handleUpdateStopPosition = (id: string, stop: number) => {
        setStops(stops.map((s) => (s.id === id ? { ...s, stop: Math.min(100, Math.max(0, stop)) } : s)));
    };

    const handleRandomize = () => {
        const count = Math.floor(Math.random() * 2) + 2; // 2 to 3 stops
        const newStops: ColorStop[] = [];
        for (let i = 0; i < count; i++) {
            newStops.push({
                id: (Date.now() + i).toString(),
                color: getRandomHexColor(),
                stop: Math.round((100 / (count - 1)) * i),
            });
        }
        setStops(newStops);
        setActiveStopId(newStops[0].id);
        setAngle(Math.floor(Math.random() * 360));
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedFormat(label);
        setTimeout(() => setCopiedFormat(null), 2000);
    };

    const handleDownloadPng = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (gradientType === "linear") {
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = (canvas.width / 2) - (Math.cos(rad) * canvas.width) / 2;
            const y1 = (canvas.height / 2) - (Math.sin(rad) * canvas.height) / 2;
            const x2 = (canvas.width / 2) + (Math.cos(rad) * canvas.width) / 2;
            const y2 = (canvas.height / 2) + (Math.sin(rad) * canvas.height) / 2;
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            sortedStops.forEach((s) => grad.addColorStop(s.stop / 100, s.color));
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width / 2
            );
            sortedStops.forEach((s) => grad.addColorStop(s.stop / 100, s.color));
            ctx.fillStyle = grad;
        }

        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const link = document.createElement("a");
        link.download = "gradient-export-1080p.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Gradient Generator & Code Exporter",
        "url": "https://twistertools.com/tools/developer-tools/css-gradient-generator",
        "description": "Generate ultra-smooth modern CSS linear, radial, and conic gradients with live interactive controls, vendor prefix output, and high-resolution PNG image exports.",
        "applicationCategory": "DeveloperApplication",
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
                "name": "What is the difference between linear, radial, and conic gradients in CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A linear-gradient transitions colors smoothly along a straight vector line specified by an angle or direction keyword. A radial-gradient radiates outwards from a central point in circular or elliptical patterns. A conic-gradient sweeps colors rotated around a central focal point like a color wheel or radar sweep."
                }
            },
            {
                "@type": "Question",
                "name": "Do modern browsers still require vendor prefixes for CSS gradients?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All major modern browsers (Chrome, Edge, Safari, Firefox, Opera) fully support standard unprefixed CSS gradients. However, including legacy webkit prefixes ensures backwards compatibility for older mobile webviews, legacy embedded browsers, and older WebKit engines."
                }
            },
            {
                "@type": "Question",
                "name": "How do I implement custom arbitrary CSS gradients in Tailwind CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Tailwind CSS v3+ supports arbitrary values. You can apply custom generated gradients using the arbitrary class syntax bg-[linear-gradient(135deg,#4f46e5_0%,#ec4899_100%)] where spaces are replaced with underscores."
                }
            },
            {
                "@type": "Question",
                "name": "How does this tool export high-resolution gradient wallpapers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The exporter calculates exact vector color coordinates on a 1920x1080 HTML5 2D Canvas context in-memory and renders a crisp lossless PNG download directly without server roundtrips."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use color stops beyond 0% and 100%?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, CSS gradients support negative stop values and stops beyond 100%. While this UI focuses on standard bounded stops (0-100%) for intuitive design, identical CSS rules apply across expanded ranges."
                }
            },
            {
                "@type": "Question",
                "name": "What causes color banding in CSS gradients and how can I avoid it?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Color banding occurs when subtle hue or lightness transitions have insufficient 8-bit color depth steps over large display distances. Adding intermediate transitional color stops or applying subtle background noise textures mitigates banding artifacts."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Controls & Palette Stops */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Gradient Configuration
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                                    {stops.length} Stops
                                </span>
                                <button
                                    onClick={handleRandomize}
                                    type="button"
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-400 text-xs font-semibold transition border border-indigo-100 dark:border-slate-700 cursor-pointer shadow-xs"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Randomize</span>
                                </button>
                            </div>
                        </div>

                        {/* Gradient Type Selector */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Gradient Style
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                                {(["linear", "radial", "conic"] as GradientType[]).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setGradientType(type)}
                                        className={`py-2 px-3 text-xs font-bold rounded-lg transition capitalize cursor-pointer ${gradientType === type
                                            ? "bg-white text-indigo-600 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Angular & Geometric Controls */}
                        {gradientType === "linear" && (
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                        <Compass className="w-4 h-4 text-indigo-600" />
                                        Angle Orientation
                                    </span>
                                    <span className="font-mono text-indigo-600">{angle}°</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={angle}
                                        onChange={(e) => setAngle(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="360"
                                        value={angle === 0 ? "" : angle}
                                        onChange={(e) => handleNumberInput(e, setAngle, 0, 360)}
                                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-center bg-white"
                                    />
                                </div>
                                <div className="flex gap-1.5 pt-1">
                                    {[0, 45, 90, 135, 180, 270].map((presetAngle) => (
                                        <button
                                            key={presetAngle}
                                            onClick={() => setAngle(presetAngle)}
                                            className={`flex-1 py-1 text-[11px] font-bold rounded border transition cursor-pointer ${angle === presetAngle
                                                ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {presetAngle}°
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {gradientType === "radial" && (
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Radial Shape</label>
                                    <select
                                        value={radialShape}
                                        onChange={(e) => setRadialShape(e.target.value as "circle" | "ellipse")}
                                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="circle">Circle</option>
                                        <option value="ellipse">Ellipse</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Focal Origin</label>
                                    <select
                                        value={radialPosition}
                                        onChange={(e) => setRadialPosition(e.target.value)}
                                        className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="center">Center</option>
                                        <option value="top">Top</option>
                                        <option value="bottom">Bottom</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {gradientType === "conic" && (
                            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-1.5">
                                        <Compass className="w-4 h-4 text-indigo-600" />
                                        Conic Starting Angle
                                    </span>
                                    <span className="font-mono text-indigo-600">{angle}°</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={angle}
                                        onChange={(e) => setAngle(Number(e.target.value))}
                                        className="w-full accent-indigo-600 cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="360"
                                        value={angle === 0 ? "" : angle}
                                        onChange={(e) => handleNumberInput(e, setAngle, 0, 360)}
                                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono text-center bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Color Stops List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Color Stops ({stops.length}/10)
                                </label>
                                <button
                                    onClick={handleAddStop}
                                    disabled={stops.length >= 10}
                                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Stop
                                </button>
                            </div>

                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {sortedStops.map((s, index) => (
                                    <div
                                        key={s.id}
                                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${activeStopId === s.id
                                            ? "border-indigo-500 bg-indigo-50/40"
                                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                                            }`}
                                    >
                                        <input
                                            type="color"
                                            value={s.color}
                                            onChange={(e) => handleUpdateStopColor(s.id, e.target.value)}
                                            className="w-8 h-8 rounded-lg border-0 cursor-pointer p-0 bg-transparent flex-shrink-0"
                                        />
                                        <input
                                            type="text"
                                            value={s.color}
                                            onChange={(e) => handleUpdateStopColor(s.id, e.target.value)}
                                            className="w-20 px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <div className="flex-1 flex items-center gap-2">
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={s.stop}
                                                onChange={(e) => handleUpdateStopPosition(s.id, Number(e.target.value))}
                                                className="w-full accent-indigo-600 cursor-pointer"
                                            />
                                            <span className="text-xs font-mono text-slate-600 w-9 text-right">{s.stop}%</span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveStop(s.id)}
                                            disabled={stops.length <= 2}
                                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition p-1 cursor-pointer"
                                            title="Delete Stop"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Presets Gallery */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Curated Presets
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {PRESET_GRADIENTS.map((p) => {
                                    const presetStyle = p.type === "linear"
                                        ? `linear-gradient(${p.angle}deg, ${p.stops.map(s => `${s.color} ${s.stop}%`).join(", ")})`
                                        : p.type === "radial"
                                            ? `radial-gradient(circle at center, ${p.stops.map(s => `${s.color} ${s.stop}%`).join(", ")})`
                                            : `conic-gradient(from ${p.angle}deg at center, ${p.stops.map(s => `${s.color} ${s.stop}%`).join(", ")})`;
                                    return (
                                        <button
                                            key={p.name}
                                            onClick={() => {
                                                setGradientType(p.type);
                                                setAngle(p.angle);
                                                setStops(p.stops);
                                            }}
                                            className="group relative h-12 rounded-xl border border-slate-200 overflow-hidden text-left p-2 flex flex-col justify-end transition hover:border-indigo-400 cursor-pointer shadow-xs"
                                            style={{ background: presetStyle }}
                                        >
                                            <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/40 backdrop-blur-xs px-1.5 py-0.5 rounded">
                                                {p.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Workspace Panel: Live Viewport & Export Engine */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-indigo-600" />
                                Live Viewport & Code Engine
                            </h2>
                            <button
                                onClick={handleDownloadPng}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer shadow-xs"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export PNG (1080p)
                            </button>
                        </div>

                        {/* Interactive Gradient Canvas Stage */}
                        <div
                            className="w-full h-56 sm:h-64 rounded-2xl border border-slate-200/80 shadow-inner transition-all duration-300 relative overflow-hidden flex items-end p-4"
                            style={{ background: cssGradientValue }}
                        >
                            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-mono border border-white/10 shadow-lg">
                                {gradientType.toUpperCase()} • {stops.length} STOPS
                            </div>
                        </div>

                        {/* Output Code Tabs & Toggle */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Code2 className="w-4 h-4 text-indigo-600" />
                                    Production CSS Output
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium">
                                    <input
                                        type="checkbox"
                                        checked={includeVendorPrefixes}
                                        onChange={(e) => setIncludeVendorPrefixes(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                                    />
                                    Include Vendor Prefixes
                                </label>
                            </div>

                            <div className="relative">
                                <pre className="p-3.5 bg-slate-900 text-indigo-300 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
                                    {fullCssDeclaration}
                                </pre>
                                <button
                                    onClick={() => handleCopy(fullCssDeclaration, "css")}
                                    className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                    {copiedFormat === "css" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedFormat === "css" ? "Copied" : "Copy CSS"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Tailwind Arbitrary Class Box */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Tailwind CSS Arbitrary Class
                            </label>
                            <div className="relative">
                                <pre className="p-3 bg-slate-100 text-slate-800 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all pr-24">
                                    {tailwindArbitraryClass}
                                </pre>
                                <button
                                    onClick={() => handleCopy(tailwindArbitraryClass, "tailwind")}
                                    className="absolute top-2 right-2 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition border border-slate-200 flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                    {copiedFormat === "tailwind" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedFormat === "tailwind" ? "Copied" : "Copy Class"}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            W3C Compliant Syntax
                        </span>
                        <span className="font-mono">CSS3 / CSS Images Module Level 4</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Technical Architecture & CSS Gradient Syntax Engine */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Technical Architecture: CSS Gradient Syntax & Color Interpolation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        CSS gradients belong to the <code>&lt;image&gt;</code> data type governed by the <strong>W3C CSS Images and Replacements Module Level 4</strong>. Rather than downloading rasterized bitmap assets, gradients are dynamically computed vector graphics calculated mathematically by the browser GPU at runtime, rendering at crisp vector fidelity across any display density or device pixel ratio.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Compass className="w-4 h-4 text-indigo-600" /> Linear Gradients
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Defined by a progress vector line with an angle ($0^\circ$ to $360^\circ$) or directional keywords (<code>to top right</code>). Color stops transition proportionally along this linear axis.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-indigo-600" /> Radial Gradients
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Emanate outward from a central anchor point (defaulting to <code>center</code>). Configured with either circular geometries with equal radii or elliptical contours constrained by boundary boxes.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                                <RefreshCw className="w-4 h-4 text-indigo-600" /> Conic Gradients
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Colors rotate 360 degrees around a central point, mirroring a pie chart or color wheel. Often used for radar displays, chromatic loaders, and conical light reflections.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Gradient Specification Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            CSS Gradient Types & Mathematical Coordinate Matrix
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding how the browser raster engine maps coordinates for each gradient function ensures precise UI alignment and predictable rendering:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Gradient Type</th>
                                    <th className="p-3">Mathematical Space</th>
                                    <th className="p-3">Directional Parameter</th>
                                    <th className="p-3">Standard W3C Syntax</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Linear</td>
                                    <td className="p-3">1D Vector Ray</td>
                                    <td className="p-3 font-mono">0deg - 360deg / to [side]</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">linear-gradient(angle, c1 s1, c2 s2)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Radial</td>
                                    <td className="p-3">2D Euclidean Plane</td>
                                    <td className="p-3 font-mono">[shape] at [position]</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">radial-gradient(circle at center, c1, c2)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Conic</td>
                                    <td className="p-3">2D Polar Angular Ray</td>
                                    <td className="p-3 font-mono">from [angle] at [position]</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">conic-gradient(from 0deg, c1, c2)</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Repeating Linear</td>
                                    <td className="p-3">Periodic 1D Pattern</td>
                                    <td className="p-3 font-mono">Cycle bounded length (px/%)</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">repeating-linear-gradient(45deg, c1, c2 10px)</td>
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
                            Eliminating Color Banding & Mastering Perceptual Interpolation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Color banding manifests on sRGB displays when transitioning across low-contrast dark hues (e.g., #0f172a to #1e293b). Because standard 8-bit color channels only allocate 256 discrete tonal steps per channel, transitions spread across large viewports create visible stair-step edges.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Transitional Mid-Stops</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Inserting non-linear intermediate stops at 30% or 70% smooths luminance shifts and eliminates harsh perceptual transitions between contrasting complementary hues.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Micro-Noise SVG Overlay</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Pairing a subtle feTurbulence SVG noise texture at 2-3% opacity over high-contrast CSS gradients creates spatial dithering that breaks up banding artifacts cleanly.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Modern Framework Integration Examples */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Framework Implementations (Tailwind CSS, Styled-Components & Vanilla)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Seamlessly drop generated gradient tokens into your frontend application architecture:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 border border-slate-800 min-w-0">
                            <span className="text-indigo-400 font-bold uppercase block text-[10px]">Tailwind Config Theme Token</span>
                            <pre className="text-indigo-300 overflow-x-auto">
                                {`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'brand-glow': 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
      }
    }
  }
}`}
                            </pre>
                        </div>

                        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 border border-slate-800 min-w-0">
                            <span className="text-indigo-400 font-bold uppercase block text-[10px]">Inline React Style Object</span>
                            <pre className="text-indigo-300 overflow-x-auto">
                                {`const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};`}
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Card 5: Extended Frequently Asked Questions (FAQ) */}
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
                                What is the difference between linear, radial, and conic gradients in CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A linear-gradient transitions colors smoothly along a straight vector line specified by an angle or direction keyword. A radial-gradient radiates outwards from a central point in circular or elliptical patterns. A conic-gradient sweeps colors rotated around a central focal point like a color wheel or radar sweep.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Do modern browsers still require vendor prefixes for CSS gradients?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                All major modern browsers (Chrome, Edge, Safari, Firefox, Opera) fully support standard unprefixed CSS gradients. However, including legacy webkit prefixes ensures backwards compatibility for older mobile webviews, legacy embedded browsers, and older WebKit engines.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I implement custom arbitrary CSS gradients in Tailwind CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Tailwind CSS v3+ supports arbitrary values. You can apply custom generated gradients using the arbitrary class syntax <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">bg-[linear-gradient(135deg,#4f46e5_0%,#ec4899_100%)]</code> where spaces are replaced with underscores.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does this tool export high-resolution gradient wallpapers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The exporter calculates exact vector color coordinates on a 1920x1080 HTML5 2D Canvas context in-memory and renders a crisp lossless PNG download directly without server roundtrips.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use color stops beyond 0% and 100%?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, CSS gradients support negative stop values and stops beyond 100%. While this UI focuses on standard bounded stops (0-100%) for intuitive design, identical CSS rules apply across expanded ranges.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What causes color banding in CSS gradients and how can I avoid it?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Color banding occurs when subtle hue or lightness transitions have insufficient 8-bit color depth steps over large display distances. Adding intermediate transitional color stops or applying subtle background noise textures mitigates banding artifacts.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}