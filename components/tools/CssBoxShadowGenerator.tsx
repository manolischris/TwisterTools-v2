"use client";

import React, { useState, useMemo } from "react";
import {
    Sun,
    Moon,
    Plus,
    Trash2,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Eye,
    Layers,
    Code2,
    Sliders,
    BookOpen,
    HelpCircle,
    Lightbulb,
    Palette,
    Download,
    Shuffle,
    ChevronRight,
    Monitor,
    Zap,
    Box
} from "lucide-react";

export interface ShadowLayer {
    id: string;
    inset: boolean;
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    spreadRadius: number;
    color: string;
    opacity: number;
}

const DEFAULT_PRESETS: { name: string; category: string; layers: ShadowLayer[]; previewBg: string; boxBg: string; isGlow?: boolean }[] = [
    {
        name: "Subtle Elevation (Level 1)",
        category: "Elevation",
        previewBg: "#f8fafc",
        boxBg: "#ffffff",
        layers: [
            { id: "p1-1", inset: false, offsetX: 0, offsetY: 1, blurRadius: 3, spreadRadius: 0, color: "#0f172a", opacity: 0.1 },
            { id: "p1-2", inset: false, offsetX: 0, offsetY: 1, blurRadius: 2, spreadRadius: -1, color: "#0f172a", opacity: 0.1 }
        ]
    },
    {
        name: "Card Hover (Level 3)",
        category: "Elevation",
        previewBg: "#f8fafc",
        boxBg: "#ffffff",
        layers: [
            { id: "p2-1", inset: false, offsetX: 0, offsetY: 10, blurRadius: 15, spreadRadius: -3, color: "#0f172a", opacity: 0.1 },
            { id: "p2-2", inset: false, offsetX: 0, offsetY: 4, blurRadius: 6, spreadRadius: -4, color: "#0f172a", opacity: 0.1 }
        ]
    },
    {
        name: "Deep Floating Modal (Level 5)",
        category: "Elevation",
        previewBg: "#f8fafc",
        boxBg: "#ffffff",
        layers: [
            { id: "p3-1", inset: false, offsetX: 0, offsetY: 25, blurRadius: 50, spreadRadius: -12, color: "#0f172a", opacity: 0.25 }
        ]
    },
    {
        name: "Smooth 5-Layer Diffusion",
        category: "Layered",
        previewBg: "#f1f5f9",
        boxBg: "#ffffff",
        layers: [
            { id: "p4-1", inset: false, offsetX: 0, offsetY: 2, blurRadius: 4, spreadRadius: 0, color: "#475569", opacity: 0.04 },
            { id: "p4-2", inset: false, offsetX: 0, offsetY: 6, blurRadius: 10, spreadRadius: 0, color: "#475569", opacity: 0.06 },
            { id: "p4-3", inset: false, offsetX: 0, offsetY: 12, blurRadius: 20, spreadRadius: 0, color: "#475569", opacity: 0.08 },
            { id: "p4-4", inset: false, offsetX: 0, offsetY: 24, blurRadius: 40, spreadRadius: 0, color: "#475569", opacity: 0.10 },
            { id: "p4-5", inset: false, offsetX: 0, offsetY: 48, blurRadius: 80, spreadRadius: 0, color: "#475569", opacity: 0.12 }
        ]
    },
    {
        name: "Cyberpunk Neon Cyan",
        category: "Neon Glow",
        previewBg: "#090d16",
        boxBg: "#0f172a",
        isGlow: true,
        layers: [
            { id: "p5-1", inset: false, offsetX: 0, offsetY: 0, blurRadius: 10, spreadRadius: 2, color: "#00f0ff", opacity: 0.9 },
            { id: "p5-2", inset: false, offsetX: 0, offsetY: 0, blurRadius: 25, spreadRadius: 6, color: "#00f0ff", opacity: 0.6 },
            { id: "p5-3", inset: false, offsetX: 0, offsetY: 0, blurRadius: 60, spreadRadius: 14, color: "#00f0ff", opacity: 0.35 }
        ]
    },
    {
        name: "Vibrant Violet Pulsar",
        category: "Neon Glow",
        previewBg: "#0b0813",
        boxBg: "#171026",
        isGlow: true,
        layers: [
            { id: "p6-1", inset: false, offsetX: 0, offsetY: 0, blurRadius: 12, spreadRadius: 1, color: "#c084fc", opacity: 0.9 },
            { id: "p6-2", inset: false, offsetX: 0, offsetY: 0, blurRadius: 30, spreadRadius: 8, color: "#9333ea", opacity: 0.7 },
            { id: "p6-3", inset: false, offsetX: 0, offsetY: 0, blurRadius: 70, spreadRadius: 20, color: "#6b21a8", opacity: 0.4 }
        ]
    },
    {
        name: "Warm Amber Spotlight",
        category: "Neon Glow",
        previewBg: "#120d04",
        boxBg: "#1c1407",
        isGlow: true,
        layers: [
            { id: "p7-1", inset: false, offsetX: 0, offsetY: 0, blurRadius: 15, spreadRadius: 3, color: "#fbbf24", opacity: 0.8 },
            { id: "p7-2", inset: false, offsetX: 0, offsetY: 0, blurRadius: 40, spreadRadius: 10, color: "#f59e0b", opacity: 0.5 },
            { id: "p7-3", inset: false, offsetX: 0, offsetY: 0, blurRadius: 90, spreadRadius: 25, color: "#b45309", opacity: 0.3 }
        ]
    },
    {
        name: "Soft Neumorphic Inset",
        category: "Neumorphism",
        previewBg: "#e2e8f0",
        boxBg: "#e2e8f0",
        layers: [
            { id: "p8-1", inset: true, offsetX: 5, offsetY: 5, blurRadius: 10, spreadRadius: 0, color: "#94a3b8", opacity: 0.5 },
            { id: "p8-2", inset: true, offsetX: -5, offsetY: -5, blurRadius: 10, spreadRadius: 0, color: "#ffffff", opacity: 0.9 }
        ]
    },
    {
        name: "Classic Extruded Neumorph",
        category: "Neumorphism",
        previewBg: "#e0e5ec",
        boxBg: "#e0e5ec",
        layers: [
            { id: "p9-1", inset: false, offsetX: 9, offsetY: 9, blurRadius: 16, spreadRadius: 0, color: "#a3b1c6", opacity: 0.6 },
            { id: "p9-2", inset: false, offsetX: -9, offsetY: -9, blurRadius: 16, spreadRadius: 0, color: "#ffffff", opacity: 1.0 }
        ]
    },
    {
        name: "Sharp Retro Offset (Brutalist)",
        category: "Stylized",
        previewBg: "#fef08a",
        boxBg: "#ffffff",
        layers: [
            { id: "p10-1", inset: false, offsetX: 6, offsetY: 6, blurRadius: 0, spreadRadius: 0, color: "#000000", opacity: 1.0 }
        ]
    }
];

const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number) => void
) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
        setter(0);
        return;
    }
    const cleaned = raw.replace(/^(-?)0+(?=\d)/, "$1");
    const num = parseInt(cleaned, 10);
    setter(isNaN(num) ? 0 : num);
};

const hexToRgba = (hex: string, alpha: number): string => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

export default function CssBoxShadowGenerator() {
    const [layers, setLayers] = useState<ShadowLayer[]>([
        { id: "layer-1", inset: false, offsetX: 0, offsetY: 12, blurRadius: 24, spreadRadius: -4, color: "#4f46e5", opacity: 0.18 },
        { id: "layer-2", inset: false, offsetX: 0, offsetY: 4, blurRadius: 8, spreadRadius: -2, color: "#0f172a", opacity: 0.08 }
    ]);
    const [activeLayerId, setActiveLayerId] = useState<string>("layer-1");

    // Preview Canvas Settings
    const [previewBg, setPreviewBg] = useState<string>("#f8fafc");
    const [boxBg, setBoxBg] = useState<string>("#ffffff");
    const [boxBorderRadius, setBoxBorderRadius] = useState<number>(16);
    const [boxWidth, setBoxWidth] = useState<number>(200);
    const [boxHeight, setBoxHeight] = useState<number>(200);
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [showBorder, setShowBorder] = useState<boolean>(true);
    const [borderColor, setBorderColor] = useState<string>("#e2e8f0");
    const [activeCodeTab, setActiveCodeTab] = useState<"css" | "tailwind" | "inline">("css");
    const [copied, setCopied] = useState<boolean>(false);

    const activeLayer = useMemo(() => {
        return layers.find((l) => l.id === activeLayerId) || layers[0] || null;
    }, [layers, activeLayerId]);

    const updateActiveLayer = (updater: (prev: ShadowLayer) => ShadowLayer) => {
        if (!activeLayer) return;
        setLayers((prev) =>
            prev.map((l) => (l.id === activeLayer.id ? updater(l) : l))
        );
    };

    const addLayer = () => {
        const newId = `layer-${Date.now()}`;
        const newLayer: ShadowLayer = {
            id: newId,
            inset: false,
            offsetX: 0,
            offsetY: 8,
            blurRadius: 16,
            spreadRadius: 0,
            color: "#4f46e5",
            opacity: 0.25
        };
        setLayers((prev) => [newLayer, ...prev]);
        setActiveLayerId(newId);
    };

    const removeLayer = (id: string) => {
        if (layers.length <= 1) return;
        const filtered = layers.filter((l) => l.id !== id);
        setLayers(filtered);
        if (activeLayerId === id) {
            setActiveLayerId(filtered[0].id);
        }
    };

    const duplicateLayer = (layer: ShadowLayer) => {
        const newId = `layer-${Date.now()}`;
        const cloned: ShadowLayer = { ...layer, id: newId, offsetY: layer.offsetY + 4, blurRadius: layer.blurRadius + 4 };
        setLayers((prev) => [cloned, ...prev]);
        setActiveLayerId(newId);
    };

    const applyPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
        setLayers(preset.layers.map((l, i) => ({ ...l, id: `layer-${Date.now()}-${i}` })));
        setActiveLayerId(`layer-${Date.now()}-0`);
        setPreviewBg(preset.previewBg);
        setBoxBg(preset.boxBg);
    };

    const generateRandomGlow = () => {
        const vibrantHues = ["#6366f1", "#ec4899", "#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#3b82f6", "#14b8a6"];
        const randomColor = vibrantHues[Math.floor(Math.random() * vibrantHues.length)];
        const isDark = Math.random() > 0.3;

        setPreviewBg(isDark ? "#090d16" : "#f8fafc");
        setBoxBg(isDark ? "#0f172a" : "#ffffff");

        const newLayers: ShadowLayer[] = [
            { id: `r-${Date.now()}-1`, inset: false, offsetX: 0, offsetY: 0, blurRadius: 12, spreadRadius: 2, color: randomColor, opacity: 0.85 },
            { id: `r-${Date.now()}-2`, inset: false, offsetX: 0, offsetY: 0, blurRadius: 35, spreadRadius: 8, color: randomColor, opacity: 0.55 },
            { id: `r-${Date.now()}-3`, inset: false, offsetX: 0, offsetY: 0, blurRadius: 75, spreadRadius: 18, color: randomColor, opacity: 0.28 }
        ];
        setLayers(newLayers);
        setActiveLayerId(newLayers[0].id);
    };

    // Derived CSS Strings
    const cssBoxShadowValue = useMemo(() => {
        if (layers.length === 0) return "none";
        return layers
            .map((layer) => {
                const rgba = hexToRgba(layer.color, layer.opacity);
                const insetStr = layer.inset ? "inset " : "";
                return `${insetStr}${layer.offsetX}px ${layer.offsetY}px ${layer.blurRadius}px ${layer.spreadRadius}px ${rgba}`;
            })
            .join(",\n  ");
    }, [layers]);

    const formattedPureCss = useMemo(() => {
        return `box-shadow: ${cssBoxShadowValue};\n-webkit-box-shadow: ${cssBoxShadowValue};`;
    }, [cssBoxShadowValue]);

    const formattedTailwind = useMemo(() => {
        if (layers.length === 0) return "shadow-none";
        const cleanVal = layers
            .map((layer) => {
                const rgba = hexToRgba(layer.color, layer.opacity).replace(/\s+/g, "");
                const insetStr = layer.inset ? "inset_" : "";
                return `${insetStr}${layer.offsetX}px_${layer.offsetY}px_${layer.blurRadius}px_${layer.spreadRadius}px_${rgba}`;
            })
            .join(",");
        return `shadow-[${cleanVal}]`;
    }, [layers]);

    const formattedInlineJsx = useMemo(() => {
        const compactVal = layers
            .map((layer) => {
                const rgba = hexToRgba(layer.color, layer.opacity);
                const insetStr = layer.inset ? "inset " : "";
                return `${insetStr}${layer.offsetX}px ${layer.offsetY}px ${layer.blurRadius}px ${layer.spreadRadius}px ${rgba}`;
            })
            .join(", ");
        return `style={{\n  boxShadow: "${compactVal}",\n  borderRadius: "${boxBorderRadius}px",\n  backgroundColor: "${boxBg}"\n}}`;
    }, [layers, boxBorderRadius, boxBg]);

    const handleCopyCode = () => {
        let textToCopy = "";
        if (activeCodeTab === "css") textToCopy = formattedPureCss;
        else if (activeCodeTab === "tailwind") textToCopy = formattedTailwind;
        else textToCopy = formattedInlineJsx;

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadSnippet = () => {
        const blobContent = `/* Generated via TwisterTools CSS Box Shadow & Glow Generator */\n.custom-shadow-box {\n  background-color: ${boxBg};\n  border-radius: ${boxBorderRadius}px;\n  box-shadow: ${cssBoxShadowValue};\n  -webkit-box-shadow: ${cssBoxShadowValue};\n}\n`;
        const blob = new Blob([blobContent], { type: "text/css;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "box-shadow-styles.css");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // WebApplication & FAQPage JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Box Shadow & Glow Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-box-shadow-generator",
        "description": "Enterprise-grade multi-layer CSS box shadow, inset elevation, neumorphic shading, and neon glow generator with real-time visual canvas, Tailwind CSS output, and React inline style support.",
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
                "name": "How does multi-layer CSS box-shadow stacking work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The CSS box-shadow property accepts multiple comma-separated shadow definitions. The browser renders them in top-to-bottom z-ordering: the first declared shadow is rendered closest to the viewer on top, while subsequent shadows are rendered behind earlier ones. Stacking small dense shadows with wide diffuse shadows produces ultra-realistic physical light dispersion."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between blur-radius and spread-radius in CSS?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Blur-radius determines the softness or Gaussian edge diffusion of the shadow; a value of 0 creates hard, sharp edges. Spread-radius geometrically expands or contracts the physical footprint of the shadow bounding box before the blur algorithm is applied. Negative spread radii produce subtle, tucked-in drop shadows without visible edge overflow."
                }
            },
            {
                "@type": "Question",
                "name": "How do I build authentic neon and outer glow effects with box-shadow?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "To construct an authentic neon glow, set both horizontal (X) and vertical (Y) offsets to 0px. Then stack 3 to 4 shadow layers with identical or harmonious vibrant hues, starting with a narrow, high-opacity core (e.g., 8px blur at 90% opacity) and expanding into wide, low-opacity ambient layers (e.g., 60px blur at 25% opacity)."
                }
            },
            {
                "@type": "Question",
                "name": "Does CSS box-shadow degrade GPU and browser rendering performance?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, large blur radii and multiple shadow layers force the browser rendering pipeline to rasterize complex Gaussian blur filters on CPU/GPU repaints. While static card shadows are inexpensive, animating box-shadow during scrolling or CSS transitions can cause frame rate drops. For silky 60fps animations, consider animating opacity on a pre-rendered pseudo-element (::after) containing the shadow."
                }
            },
            {
                "@type": "Question",
                "name": "How do I use these generated custom shadows in Tailwind CSS v3 and v4?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "In Tailwind CSS, you can apply custom multi-layer shadows using arbitrary square-bracket syntax like shadow-[0px_10px_20px_rgba(0,0,0,0.15)]. In Tailwind v3/v4, spaces inside rgb/rgba color values or parameter commas must be replaced with underscores (e.g., rgba(0,0,0,0.1) or inset_0_2px_4px_#000). Our generator's Tailwind tab formats this automatically."
                }
            },
            {
                "@type": "Question",
                "name": "What is Neumorphism and how is it implemented with CSS box-shadow?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Neumorphism (soft UI) creates simulated physical extrusions or debossed cavities on solid surfaces. It requires setting the element background identical to the canvas background, then applying two opposing diagonal shadows: a dark shadow offset to the bottom-right (e.g., 8px 8px) and a pure white highlight offset to the top-left (e.g., -8px -8px)."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Top Interactive Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Panel: Multi-Layer Editor & Parameter Sliders */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header Row */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Shadow Layer Architect
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={generateRandomGlow}
                                    title="Generate Random Aesthetic Glow"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                                >
                                    <Shuffle className="w-3.5 h-3.5" />
                                    Randomize
                                </button>
                                <button
                                    onClick={addLayer}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Layer
                                </button>
                            </div>
                        </div>

                        {/* Layer Selector Chips */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-indigo-600" /> Active Shadow Layers ({layers.length})
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal lowercase">top renders foremost</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {layers.map((layer, index) => {
                                    const isActive = layer.id === activeLayerId;
                                    return (
                                        <div
                                            key={layer.id}
                                            onClick={() => setActiveLayerId(layer.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${isActive
                                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                                }`}
                                        >
                                            <span
                                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs flex-shrink-0"
                                                style={{ backgroundColor: layer.color }}
                                            />
                                            <span>
                                                Layer {layers.length - index} {layer.inset ? "(Inset)" : ""}
                                            </span>
                                            {layers.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeLayer(layer.id);
                                                    }}
                                                    className="p-1 hover:text-red-500 rounded text-slate-400 transition"
                                                    title="Delete Layer"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active Layer Parameter Sliders */}
                        {activeLayer && (
                            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Editing Selected Layer
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                                            {activeLayer.inset ? "INSET SHADOW" : "DROP SHADOW"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => duplicateLayer(activeLayer)}
                                            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer"
                                        >
                                            <Copy className="w-3 h-3" /> Duplicate
                                        </button>
                                    </div>
                                </div>

                                {/* Inset Toggle Switch */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                                        <Box className="w-4 h-4 text-indigo-600" />
                                        Inset Shadow (Inner Shadow)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => updateActiveLayer((l) => ({ ...l, inset: !l.inset }))}
                                        className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer ${activeLayer.inset ? "bg-indigo-600" : "bg-slate-300"
                                            }`}
                                    >
                                        <div
                                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${activeLayer.inset ? "translate-x-5" : ""
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Offset X & Offset Y Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Horizontal Offset (X)</span>
                                            <span className="font-mono text-indigo-600">{activeLayer.offsetX}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={activeLayer.offsetX}
                                            onChange={(e) =>
                                                updateActiveLayer((l) => ({ ...l, offsetX: parseInt(e.target.value, 10) }))
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Vertical Offset (Y)</span>
                                            <span className="font-mono text-indigo-600">{activeLayer.offsetY}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="100"
                                            value={activeLayer.offsetY}
                                            onChange={(e) =>
                                                updateActiveLayer((l) => ({ ...l, offsetY: parseInt(e.target.value, 10) }))
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Blur Radius & Spread Radius Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Blur Radius</span>
                                            <span className="font-mono text-indigo-600">{activeLayer.blurRadius}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="150"
                                            value={activeLayer.blurRadius}
                                            onChange={(e) =>
                                                updateActiveLayer((l) => ({ ...l, blurRadius: Math.max(0, parseInt(e.target.value, 10)) }))
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Spread Radius</span>
                                            <span className="font-mono text-indigo-600">{activeLayer.spreadRadius}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-50"
                                            max="100"
                                            value={activeLayer.spreadRadius}
                                            onChange={(e) =>
                                                updateActiveLayer((l) => ({ ...l, spreadRadius: parseInt(e.target.value, 10) }))
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Shadow Color & Opacity Controls */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            Shadow Color (Hex)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={activeLayer.color}
                                                onChange={(e) =>
                                                    updateActiveLayer((l) => ({ ...l, color: e.target.value }))
                                                }
                                                className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                                            />
                                            <input
                                                type="text"
                                                value={activeLayer.color}
                                                onChange={(e) =>
                                                    updateActiveLayer((l) => ({ ...l, color: e.target.value }))
                                                }
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 uppercase focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>Layer Opacity</span>
                                            <span className="font-mono text-indigo-600">{Math.round(activeLayer.opacity * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={activeLayer.opacity}
                                            onChange={(e) =>
                                                updateActiveLayer((l) => ({ ...l, opacity: parseFloat(e.target.value) }))
                                            }
                                            className="w-full accent-indigo-600 cursor-pointer pt-2"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preset Design System Gallery */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                Enterprise Preset Library
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                                {DEFAULT_PRESETS.map((preset, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => applyPreset(preset)}
                                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50/60 hover:border-indigo-200 transition text-left space-y-1 cursor-pointer group"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                                            {preset.category}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-900 block truncate">
                                            {preset.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Quick Controls */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            Multi-Stop Layer Compounding
                        </span>
                        <span>Zero Dependency CSS</span>
                    </div>
                </div>

                {/* Right Panel: Live Visual Stage & Production Code Generator */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Live Canvas Toolbar */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Visual Render Canvas
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewBg((prev) => (prev === "#090d16" ? "#f8fafc" : "#090d16"))}
                                    title="Toggle Dark/Light Canvas Background"
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                >
                                    {previewBg === "#090d16" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setShowGrid((prev) => !prev)}
                                    title="Toggle Backdrop Alignment Grid"
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${showGrid ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200 text-slate-600"
                                        }`}
                                >
                                    Grid
                                </button>
                            </div>
                        </div>

                        {/* Interactive Render Stage */}
                        <div
                            className="relative w-full h-80 rounded-2xl border border-slate-200/80 flex items-center justify-center p-6 overflow-hidden transition-colors duration-300"
                            style={{
                                backgroundColor: previewBg,
                                backgroundImage: showGrid
                                    ? `radial-gradient(${previewBg === "#090d16" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"} 1px, transparent 1px)`
                                    : "none",
                                backgroundSize: "16px 16px"
                            }}
                        >
                            {/* Render Box Target */}
                            <div
                                className="flex flex-col items-center justify-center text-center transition-all duration-200 select-none p-4"
                                style={{
                                    width: `${boxWidth}px`,
                                    height: `${boxHeight}px`,
                                    backgroundColor: boxBg,
                                    borderRadius: `${boxBorderRadius}px`,
                                    boxShadow: cssBoxShadowValue,
                                    border: showBorder ? `1px solid ${borderColor}` : "none"
                                }}
                            >
                                <span className={`text-xs font-extrabold uppercase tracking-wider ${boxBg === "#0f172a" || boxBg === "#171026" || boxBg === "#000000" ? "text-white" : "text-slate-900"}`}>
                                    CSS Box Element
                                </span>
                                <span className={`text-[11px] font-mono mt-1 ${boxBg === "#0f172a" || boxBg === "#171026" || boxBg === "#000000" ? "text-slate-400" : "text-slate-500"}`}>
                                    {layers.length} {layers.length === 1 ? "layer" : "layers"} active
                                </span>
                            </div>
                        </div>

                        {/* Box & Canvas Dimensions Customizer */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Canvas BG</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="color"
                                        value={previewBg}
                                        onChange={(e) => setPreviewBg(e.target.value)}
                                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                                    />
                                    <span className="text-[11px] font-mono text-slate-700">{previewBg}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Box BG</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="color"
                                        value={boxBg}
                                        onChange={(e) => setBoxBg(e.target.value)}
                                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                                    />
                                    <span className="text-[11px] font-mono text-slate-700">{boxBg}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Radius: {boxBorderRadius}px</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="60"
                                    value={boxBorderRadius}
                                    onChange={(e) => setBoxBorderRadius(parseInt(e.target.value, 10))}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Box Size: {boxWidth}px</label>
                                <input
                                    type="range"
                                    min="120"
                                    max="280"
                                    value={boxWidth}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setBoxWidth(val);
                                        setBoxHeight(val);
                                    }}
                                    className="w-full accent-indigo-600 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Production Code Exporter */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setActiveCodeTab("css")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeCodeTab === "css" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Pure CSS
                                    </button>
                                    <button
                                        onClick={() => setActiveCodeTab("tailwind")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeCodeTab === "tailwind" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        Tailwind CSS
                                    </button>
                                    <button
                                        onClick={() => setActiveCodeTab("inline")}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeCodeTab === "inline" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
                                            }`}
                                    >
                                        React Inline
                                    </button>
                                </div>
                                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5" /> Ready for Copy
                                </span>
                            </div>

                            {/* Code Output Terminal */}
                            <div className="relative bg-slate-950 text-indigo-300 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner max-h-44">
                                <pre className="leading-relaxed whitespace-pre-wrap">
                                    {activeCodeTab === "css" && formattedPureCss}
                                    {activeCodeTab === "tailwind" && formattedTailwind}
                                    {activeCodeTab === "inline" && formattedInlineJsx}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleCopyCode}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Copied to Clipboard!" : "Copy Code Snippet"}
                        </button>
                        <button
                            onClick={handleDownloadSnippet}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Download .css
                        </button>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO & TECHNICAL GUIDANCE CARDS */}
            <div className="space-y-6">

                {/* Card 1: Architectural Anatomy of CSS Box-Shadow */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anatomy and Syntax Specifications of the CSS Box-Shadow Property
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The CSS <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm">box-shadow</code> property attaches one or more drop-shadow effects around an element frame. It enables web developers to simulate physical depth, elevation surfaces, inset bevels, and vibrant luminescence without rendering static image assets.
                    </p>

                    <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-6 space-y-3 font-mono text-xs overflow-x-auto">
                        <p className="text-indigo-400 font-bold">// Formal W3C Syntax Specification</p>
                        <p className="text-slate-200">
                            box-shadow: [inset?] &lt;offset-x&gt; &lt;offset-y&gt; &lt;blur-radius&gt;? &lt;spread-radius&gt;? &lt;color&gt;?;
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ChevronRight className="w-4 h-4 text-indigo-600" /> Offset-X & Offset-Y
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Length values specifying where the shadow is cast relative to the box center. Positive X moves right; positive Y moves down. Setting both to 0px creates a symmetrical, omnidirectional ambient shadow or neon halo.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ChevronRight className="w-4 h-4 text-indigo-600" /> Blur Radius
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Defines the Gaussian dispersion distance. A value of 0 produces razor-sharp silhouette edges, while larger pixel lengths soften the perimeter into atmospheric light scatter. Negative values are invalid in CSS standards.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <ChevronRight className="w-4 h-4 text-indigo-600" /> Spread Radius
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Geometrically inflates or contracts the shadow source geometry before blur calculation. Positive values expand the boundary outwards; negative values retract the shadow beneath the parent container.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 2: Multi-Layer Diffusion & Elevation Systems */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Multi-Layer Shadow Layering: Mastering Realistic Elevation Systems
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Single-layer CSS shadows often appear artificial and muddy because physical real-world illumination consists of both direct sharp occlusion shadows (umbra) and soft ambient environment bounces (penumbra). By stacking multiple comma-separated shadows, you achieve the velvety, high-end aesthetic seen in enterprise design systems like Tailwind UI, Apple iOS, and Google Material Design.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Elevation Level</th>
                                    <th className="p-3">Component Type</th>
                                    <th className="p-3">Multi-Layer Strategy</th>
                                    <th className="p-3">Visual Outcome</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium text-xs sm:text-sm">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Level 1 (Low)</td>
                                    <td className="p-3">Badges, Table Rows, Inputs</td>
                                    <td className="p-3 font-mono text-xs">0 1px 2px rgba(0,0,0,0.05)</td>
                                    <td className="p-3 text-slate-600">Subtle border accentuation</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Level 2 (Medium)</td>
                                    <td className="p-3">Cards, Interactive Buttons</td>
                                    <td className="p-3 font-mono text-xs">0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(...)</td>
                                    <td className="p-3 text-slate-600">Tactile card lift off canvas</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-bold text-slate-900">Level 3 (High)</td>
                                    <td className="p-3">Dropdown Menus, Popovers</td>
                                    <td className="p-3 font-mono text-xs">0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(...)</td>
                                    <td className="p-3 text-slate-600">Clear spatial separation above content</td>
                                </tr>
                                <tr className="hover:bg-slate-50 bg-indigo-50/30">
                                    <td className="p-3 font-bold text-indigo-950">Level 4 (Floating)</td>
                                    <td className="p-3">Modals, Dialog Overlays, Drawers</td>
                                    <td className="p-3 font-mono text-xs text-indigo-900">0 25px 50px -12px rgba(0,0,0,0.25)</td>
                                    <td className="p-3 text-indigo-800 font-semibold">Maximum focus and z-index dominance</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Neon Glows & Neumorphism Technical Blueprint */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Palette className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Creating Cyberpunk Neon Glows & Soft Neumorphic Inset Shading
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Beyond standard dark drop shadows, the CSS box-shadow specification powers advanced styling techniques, including vibrant luminescence and debossed plastic skeuomorphism.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-600" /> High-Intensity Cyberpunk Glows
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Neon luminescence is generated by eliminating directional offsets (setting X and Y to 0) and stacking concentric layers with progressive blur steps and decreasing opacities.
                            </p>
                            <div className="bg-slate-900 text-cyan-300 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                box-shadow:<br />
                                &nbsp;&nbsp;0 0 10px rgba(6,182,212,0.9),<br />
                                &nbsp;&nbsp;0 0 30px rgba(6,182,212,0.5),<br />
                                &nbsp;&nbsp;0 0 80px rgba(6,182,212,0.25);
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Box className="w-4 h-4 text-indigo-600" /> Soft Neumorphic Surfaces
                            </h3>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Neumorphism pairs an element background identical to the canvas with two diagonal shadows: a dark shadow on the bottom-right and a bright white highlight on the top-left.
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto leading-relaxed">
                                background: #e0e5ec;<br />
                                box-shadow:<br />
                                &nbsp;&nbsp;8px 8px 16px #a3b1c6,<br />
                                &nbsp;&nbsp;-8px -8px 16px #ffffff;
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 4: Performance & Hardware Acceleration Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Performance Optimization: Rendering Pitfalls & 60fps Animation
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Calculating real-time Gaussian blurs on large elements is computationally expensive for mobile GPUs. When implementing heavy multi-layer shadows in modern web applications, adhere to these rendering performance rules:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Avoid Animating Box-Shadow</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Directly transitioning <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">box-shadow</code> forces the browser engine to perform layout repaints on every animation tick, causing noticeable frame drops and jank.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Use Pseudo-Element Opacity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Place the hover shadow on an absolute <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">::after</code> pseudo-element with initial <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">opacity: 0</code> and transition the opacity property for hardware-accelerated 60fps renders.
                            </p>
                        </div>

                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Manage Blur Bounds</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Excessive blur radii (&gt;150px) over extensive layout surfaces increase rasterization memory overhead. Keep blur radii proportionate to element bounding dimensions.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Step-by-Step Practical Integration Guide */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Framework Implementation Walkthrough
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Integrate your customized shadow configurations seamlessly across modern front-end frameworks:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Tailwind CSS Arbitrary Value Setup</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">Tailwind v3+</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Paste custom generated shadow tokens directly into Tailwind utility classes using underscore notation to eliminate whitespace parsing issues:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                &lt;div className=&quot;rounded-2xl bg-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.2)]&quot;&gt;<br />
                                &nbsp;&nbsp;&lt;h3&gt;Interactive Card&lt;/h3&gt;<br />
                                &lt;/div&gt;
                            </div>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <span className="font-bold text-slate-900">Tailwind Config Preset Extension</span>
                                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">tailwind.config.js</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Register your customized design token inside your project theme configuration for reusable design tokens across your team:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                module.exports = &#123;<br />
                                &nbsp;&nbsp;theme: &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;extend: &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;boxShadow: &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#39;glow-brand&#39;: &#39;0 0 20px rgba(99, 102, 241, 0.6)&#39;,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br />
                                &nbsp;&nbsp;&#125;<br />
                                &#125;;
                            </div>
                        </div>
                    </div>
                </section>

                {/* Card 6: Static FAQ Section */}
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
                                How does multi-layer CSS box-shadow stacking work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The CSS box-shadow property accepts multiple comma-separated shadow definitions. The browser renders them in top-to-bottom z-ordering: the first declared shadow is rendered closest to the viewer on top, while subsequent shadows are rendered behind earlier ones. Stacking small dense shadows with wide diffuse shadows produces ultra-realistic physical light dispersion.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between blur-radius and spread-radius in CSS?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Blur-radius determines the softness or Gaussian edge diffusion of the shadow; a value of 0 creates hard, sharp edges. Spread-radius geometrically expands or contracts the physical footprint of the shadow bounding box before the blur algorithm is applied. Negative spread radii produce subtle, tucked-in drop shadows without visible edge overflow.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I build authentic neon and outer glow effects with box-shadow?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                To construct an authentic neon glow, set both horizontal (X) and vertical (Y) offsets to 0px. Then stack 3 to 4 shadow layers with identical or harmonious vibrant hues, starting with a narrow, high-opacity core (e.g., 8px blur at 90% opacity) and expanding into wide, low-opacity ambient layers (e.g., 60px blur at 25% opacity).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does CSS box-shadow degrade GPU and browser rendering performance?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes, large blur radii and multiple shadow layers force the browser rendering pipeline to rasterize complex Gaussian blur filters on CPU/GPU repaints. While static card shadows are inexpensive, animating box-shadow during scrolling or CSS transitions can cause frame rate drops. For silky 60fps animations, consider animating opacity on a pre-rendered pseudo-element (::after) containing the shadow.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do I use these generated custom shadows in Tailwind CSS v3 and v4?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                In Tailwind CSS, you can apply custom multi-layer shadows using arbitrary square-bracket syntax like <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">shadow-[0px_10px_20px_rgba(0,0,0,0.15)]</code>. In Tailwind v3/v4, spaces inside rgb/rgba color values or parameter commas must be replaced with underscores (e.g., <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">rgba(0,0,0,0.1)</code> or <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">inset_0_2px_4px_#000</code>). Our generator's Tailwind tab formats this automatically.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is Neumorphism and how is it implemented with CSS box-shadow?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Neumorphism (soft UI) creates simulated physical extrusions or debossed cavities on solid surfaces. It requires setting the element background identical to the canvas background, then applying two opposing diagonal shadows: a dark shadow offset to the bottom-right (e.g., 8px 8px) and a pure white highlight offset to the top-left (e.g., -8px -8px).
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}