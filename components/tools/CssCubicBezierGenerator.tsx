"use client";

import React, { useState, useId, useRef, useEffect, useCallback } from "react";
import {
    Activity,
    Copy,
    Check,
    RotateCcw,
    Play,
    Pause,
    Sliders,
    Code2,
    BookOpen,
    HelpCircle,
    Layers,
    CheckCircle2,
    Sparkles,
    MoveHorizontal,
    Compass
} from "lucide-react";

interface PresetCurve {
    name: string;
    label: string;
    category: "CSS Standard" | "Ease In" | "Ease Out" | "Ease In-Out" | "Expressive";
    coords: [number, number, number, number];
}

const PRESETS: PresetCurve[] = [
    { name: "linear", label: "Linear", category: "CSS Standard", coords: [0.0, 0.0, 1.0, 1.0] },
    { name: "ease", label: "Ease (Default)", category: "CSS Standard", coords: [0.25, 0.1, 0.25, 1.0] },
    { name: "ease-in", label: "Ease In", category: "CSS Standard", coords: [0.42, 0.0, 1.0, 1.0] },
    { name: "ease-out", label: "Ease Out", category: "CSS Standard", coords: [0.0, 0.0, 0.58, 1.0] },
    { name: "ease-in-out", label: "Ease In Out", category: "CSS Standard", coords: [0.42, 0.0, 0.58, 1.0] },
    { name: "ease-in-quad", label: "Ease In Quad", category: "Ease In", coords: [0.11, 0.0, 0.5, 0.0] },
    { name: "ease-in-cubic", label: "Ease In Cubic", category: "Ease In", coords: [0.32, 0.0, 0.67, 0.0] },
    { name: "ease-in-quart", label: "Ease In Quart", category: "Ease In", coords: [0.5, 0.0, 0.75, 0.0] },
    { name: "ease-in-expo", label: "Ease In Expo", category: "Ease In", coords: [0.7, 0.0, 0.84, 0.0] },
    { name: "ease-out-quad", label: "Ease Out Quad", category: "Ease Out", coords: [0.5, 1.0, 0.89, 1.0] },
    { name: "ease-out-cubic", label: "Ease Out Cubic", category: "Ease Out", coords: [0.33, 1.0, 0.68, 1.0] },
    { name: "ease-out-quart", label: "Ease Out Quart", category: "Ease Out", coords: [0.25, 1.0, 0.5, 1.0] },
    { name: "ease-out-expo", label: "Ease Out Expo", category: "Ease Out", coords: [0.16, 1.0, 0.3, 1.0] },
    { name: "ease-in-out-quad", label: "Ease In Out Quad", category: "Ease In-Out", coords: [0.45, 0.0, 0.55, 1.0] },
    { name: "ease-in-out-cubic", label: "Ease In Out Cubic", category: "Ease In-Out", coords: [0.65, 0.0, 0.35, 1.0] },
    { name: "ease-in-out-quart", label: "Ease In Out Quart", category: "Ease In-Out", coords: [0.77, 0.0, 0.175, 1.0] },
    { name: "ease-in-out-expo", label: "Ease In Out Expo", category: "Ease In-Out", coords: [0.87, 0.0, 0.13, 1.0] },
    { name: "snappy-bounce", label: "Snappy Pop", category: "Expressive", coords: [0.34, 1.56, 0.64, 1.0] },
    { name: "magnetic-back", label: "Back Anticipate", category: "Expressive", coords: [0.68, -0.55, 0.265, 1.55] },
    { name: "dramatic-overshoot", label: "Dramatic Overshoot", category: "Expressive", coords: [0.175, 0.885, 0.32, 1.275] },
];

export default function CssCubicBezierGenerator() {
    const [p1x, setP1x] = useState<number>(0.25);
    const [p1y, setP1y] = useState<number>(0.1);
    const [p2x, setP2x] = useState<number>(0.25);
    const [p2y, setP2y] = useState<number>(1.0);

    const [duration, setDuration] = useState<number>(1.2);
    const [previewKey, setPreviewKey] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

    const canvasSvgRef = useRef<SVGSVGElement | null>(null);
    const [activeHandle, setActiveHandle] = useState<"p1" | "p2" | null>(null);

    const p1xId = useId();
    const p1yId = useId();
    const p2xId = useId();
    const p2yId = useId();
    const durationId = useId();

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const round3 = (val: number) => Math.round(val * 1000) / 1000;

    const bezierString = `cubic-bezier(${round3(p1x)}, ${round3(p1y)}, ${round3(p2x)}, ${round3(p2y)})`;
    const cssTransitionSnippet = `transition: all ${duration}s ${bezierString};`;
    const cssFullRule = `.custom-animated-element {\n  transition: transform ${duration}s ${bezierString};\n}`;

    const handleCopy = (text: string, identifier: string) => {
        navigator.clipboard.writeText(text);
        setCopiedSnippet(identifier);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const handlePointerMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!activeHandle || !canvasSvgRef.current) return;
        const rect = canvasSvgRef.current.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        const padX = 40;
        const padTop = 60;
        const curveHeight = 240;
        const curveWidth = 240;

        const relX = clientX - rect.left - padX;
        const relY = clientY - rect.top - padTop;

        const normalizedX = clamp(round3(relX / curveWidth), 0, 1);
        const normalizedY = clamp(round3(1 - relY / curveHeight), -0.75, 1.75);

        if (activeHandle === "p1") {
            setP1x(normalizedX);
            setP1y(normalizedY);
        } else {
            setP2x(normalizedX);
            setP2y(normalizedY);
        }
    }, [activeHandle]);

    const handlePointerUp = useCallback(() => {
        setActiveHandle(null);
    }, []);

    useEffect(() => {
        if (activeHandle) {
            window.addEventListener("mousemove", handlePointerMove);
            window.addEventListener("mouseup", handlePointerUp);
            window.addEventListener("touchmove", handlePointerMove, { passive: false });
            window.addEventListener("touchend", handlePointerUp);
        }
        return () => {
            window.removeEventListener("mousemove", handlePointerMove);
            window.removeEventListener("mouseup", handlePointerUp);
            window.removeEventListener("touchmove", handlePointerMove);
            window.removeEventListener("touchend", handlePointerUp);
        };
    }, [activeHandle, handlePointerMove, handlePointerUp]);

    const svgWidth = 320;
    const svgHeight = 360;
    const padX = 40;
    const padTop = 60;
    const curveW = 240;
    const curveH = 240;

    const toSvgX = (nx: number) => padX + nx * curveW;
    const toSvgY = (ny: number) => padTop + (1 - ny) * curveH;

    const startX = toSvgX(0);
    const startY = toSvgY(0);
    const endX = toSvgX(1);
    const endY = toSvgY(1);
    const p1SvgX = toSvgX(p1x);
    const p1SvgY = toSvgY(p1y);
    const p2SvgX = toSvgX(p2x);
    const p2SvgY = toSvgY(p2y);

    const restartAnimation = () => {
        setPreviewKey((prev) => prev + 1);
        setIsPlaying(true);
    };

    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (n: number) => void,
        min: number,
        max: number
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(0);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseFloat(cleaned);
        if (isNaN(num)) {
            setter(0);
        } else {
            setter(clamp(num, min, max));
        }
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "CSS Cubic-Bezier Transition Curve Visualizer & Code Generator",
        "url": "https://twistertools.com/tools/developer-tools/css-cubic-bezier-generator",
        "description": "Interactive CSS cubic-bezier easing curve designer and code generator. Visualize custom transition curves, physics-based overshoot bounce effects, and compare with standard CSS easing curves.",
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
                "name": "What is a cubic-bezier function in CSS transitions and animations?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A CSS cubic-bezier function defines a parametric smooth curve used to calculate time-to-progression interpolation during transitions and keyframe animations. It is governed by four numbers representing two control points (P1x, P1y, P2x, P2y) between the initial coordinate (0,0) and the terminal coordinate (1,1)."
                }
            },
            {
                "@type": "Question",
                "name": "Why must the X coordinates of a cubic-bezier be strictly between 0 and 1?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The X axis on a transition curve represents normalized elapsed time. Because forward physical time cannot flow backwards or exceed 100% of the duration before completion, CSS specifications strictly mandate that P1x and P2x remain in the continuous range [0.0, 1.0]."
                }
            },
            {
                "@type": "Question",
                "name": "How do overshoot and anticipation bounce animations work in CSS cubic-bezier?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While X coordinates are bound between 0 and 1, the Y coordinates (representing property progress or displacement) have no bounds in CSS. Setting a Y coordinate greater than 1.0 creates an elastic overshoot bounce past the end target, whereas setting a Y value below 0.0 produces anticipation rollback before advancing."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between ease, ease-in-out, and linear?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Linear has a constant velocity slope (0.0, 0.0, 1.0, 1.0) with zero acceleration. Ease starts gently, accelerates rapidly mid-way, and slows down gracefully (0.25, 0.1, 0.25, 1.0). Ease-in-out symmetrically ramps up and decelerates, preventing jarring camera or movement stops on screen."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool support Web Animations API (WAAPI) and Framer Motion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. The generated cubic-bezier(x1, y1, x2, y2) tuple is universally compatible with standard CSS transitions, CSS @keyframes, the native browser Web Animations API (element.animate), Framer Motion easing arrays, Tailwind CSS transition timing configs, and GSAP CustomEase plugins."
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

            {/* 12-Column Responsive Workspace Grid (5/7 Split for Canvas Tools) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Curve Visualizer Canvas & Presets (Column Span 5) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6 min-w-0">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            Curve Coordinate Canvas
                        </h2>
                        <button
                            type="button"
                            onClick={() => {
                                setP1x(0.25);
                                setP1y(0.1);
                                setP2x(0.25);
                                setP2y(1.0);
                            }}
                            title="Reset to default ease"
                            className="p-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Interactive Curve SVG Canvas */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 relative select-none touch-none">
                        <svg
                            ref={canvasSvgRef}
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full max-w-[320px] h-auto drop-shadow-xs overflow-visible"
                        >
                            {/* Bounding Box for (0,0) to (1,1) */}
                            <rect
                                x={padX}
                                y={padTop}
                                width={curveW}
                                height={curveH}
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray="3 3"
                                className="text-slate-200 dark:text-slate-800"
                            />

                            {/* Reference Diagonal (Linear Reference) */}
                            <line
                                x1={startX}
                                y1={startY}
                                x2={endX}
                                y2={endY}
                                stroke="currentColor"
                                strokeDasharray="4 4"
                                className="text-slate-300 dark:text-slate-700"
                            />

                            {/* P1 Handle Vector Line */}
                            <line
                                x1={startX}
                                y1={startY}
                                x2={p1SvgX}
                                y2={p1SvgY}
                                stroke="#f43f5e"
                                strokeWidth="2"
                            />

                            {/* P2 Handle Vector Line */}
                            <line
                                x1={endX}
                                y1={endY}
                                x2={p2SvgX}
                                y2={p2SvgY}
                                stroke="#3b82f6"
                                strokeWidth="2"
                            />

                            {/* Cubic Bezier Curve */}
                            <path
                                d={`M ${startX} ${startY} C ${p1SvgX} ${p1SvgY}, ${p2SvgX} ${p2SvgY}, ${endX} ${endY}`}
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />

                            {/* Terminal Points P0 (0,0) and P3 (1,1) */}
                            <circle cx={startX} cy={startY} r="5" className="fill-slate-500 dark:fill-slate-400" />
                            <circle cx={endX} cy={endY} r="5" className="fill-slate-500 dark:fill-slate-400" />

                            {/* Interactive Control Point 1 (Pink / Rose) */}
                            <g
                                transform={`translate(${p1SvgX}, ${p1SvgY})`}
                                onMouseDown={() => setActiveHandle("p1")}
                                onTouchStart={() => setActiveHandle("p1")}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <circle r="18" fill="transparent" />
                                <circle r="9" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
                                <text
                                    y="-14"
                                    textAnchor="middle"
                                    className="text-[10px] font-mono font-bold fill-rose-600 dark:fill-rose-400"
                                >
                                    P1
                                </text>
                            </g>

                            {/* Interactive Control Point 2 (Blue) */}
                            <g
                                transform={`translate(${p2SvgX}, ${p2SvgY})`}
                                onMouseDown={() => setActiveHandle("p2")}
                                onTouchStart={() => setActiveHandle("p2")}
                                className="cursor-grab active:cursor-grabbing"
                            >
                                <circle r="18" fill="transparent" />
                                <circle r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" />
                                <text
                                    y="22"
                                    textAnchor="middle"
                                    className="text-[10px] font-mono font-bold fill-blue-600 dark:fill-blue-400"
                                >
                                    P2
                                </text>
                            </g>

                            {/* Axis Labels */}
                            <text x={padX} y={svgHeight - 12} className="text-[10px] fill-slate-600 dark:text-slate-300 font-mono">
                                0.0 (Start)
                            </text>
                            <text x={padX + curveW - 35} y={svgHeight - 12} className="text-[10px] fill-slate-600 dark:text-slate-300 font-mono">
                                1.0 (End)
                            </text>
                        </svg>

                        <div className="w-full flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 pt-2 px-2">
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                                Control Point P1 ({round3(p1x)}, {round3(p1y)})
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                                Control Point P2 ({round3(p2x)}, {round3(p2y)})
                            </span>
                        </div>
                    </div>

                    {/* Numeric Control Inputs */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Coordinate Values (Precision Tuning)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1">
                                <label htmlFor={p1xId} className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                                    P1.X (0 to 1)
                                </label>
                                <input
                                    id={p1xId}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={p1x}
                                    onChange={(e) => handleNumberInput(e, setP1x, 0, 1)}
                                    aria-label="Control Point 1 X Coordinate"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor={p1yId} className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block">
                                    P1.Y (-0.75 to 1.75)
                                </label>
                                <input
                                    id={p1yId}
                                    type="number"
                                    step="0.01"
                                    min="-0.75"
                                    max="1.75"
                                    value={p1y}
                                    onChange={(e) => handleNumberInput(e, setP1y, -0.75, 1.75)}
                                    aria-label="Control Point 1 Y Coordinate"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor={p2xId} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">
                                    P2.X (0 to 1)
                                </label>
                                <input
                                    id={p2xId}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={p2x}
                                    onChange={(e) => handleNumberInput(e, setP2x, 0, 1)}
                                    aria-label="Control Point 2 X Coordinate"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-bold"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor={p2yId} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block">
                                    P2.Y (-0.75 to 1.75)
                                </label>
                                <input
                                    id={p2yId}
                                    type="number"
                                    step="0.01"
                                    min="-0.75"
                                    max="1.75"
                                    value={p2y}
                                    onChange={(e) => handleNumberInput(e, setP2y, -0.75, 1.75)}
                                    aria-label="Control Point 2 Y Coordinate"
                                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                            Standard & Expressive Presets:
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 max-h-56 overflow-y-auto pr-1">
                            {PRESETS.map((preset) => {
                                const isSelected =
                                    round3(p1x) === preset.coords[0] &&
                                    round3(p1y) === preset.coords[1] &&
                                    round3(p2x) === preset.coords[2] &&
                                    round3(p2y) === preset.coords[3];
                                return (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => {
                                            setP1x(preset.coords[0]);
                                            setP1y(preset.coords[1]);
                                            setP2x(preset.coords[2]);
                                            setP2y(preset.coords[3]);
                                            restartAnimation();
                                        }}
                                        className={`p-2 rounded-xl text-left border transition text-xs cursor-pointer flex flex-col justify-between gap-1 ${isSelected
                                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600"
                                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            }`}
                                    >
                                        <span className="font-semibold truncate">{preset.label}</span>
                                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                                            {preset.category}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Animation Comparisons, Code Snippets & Benchmarking (Column Span 7) */}
                <div className="lg:col-span-7 space-y-6 min-w-0">
                    {/* Live Motion Preview Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-6">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Real-Time Animation Preview
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={restartAnimation}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" /> Replay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                    {isPlaying ? "Pause Loop" : "Resume"}
                                </button>
                            </div>
                        </div>

                        {/* Transition Duration Slider */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between text-xs">
                                <label htmlFor={durationId} className="font-bold text-slate-800 dark:text-slate-200">
                                    Transition Duration:
                                </label>
                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {duration} seconds
                                </span>
                            </div>
                            <input
                                id={durationId}
                                type="range"
                                min="0.2"
                                max="4.0"
                                step="0.1"
                                value={duration}
                                onChange={(e) => setDuration(parseFloat(e.target.value))}
                                aria-label="Transition duration slider"
                                className="w-full accent-indigo-600 cursor-pointer"
                            />
                        </div>

                        {/* Comparison Animation Tracks */}
                        <div className="space-y-4 pt-1">
                            {/* Track 1: Custom User Bezier */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> Your Custom Curve
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                        {bezierString}
                                    </span>
                                </div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-950 rounded-xl p-1.5 relative overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center">
                                    <div
                                        key={`custom-${previewKey}`}
                                        className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md font-bold text-xs"
                                        style={{
                                            animation: isPlaying
                                                ? `tt-slide ${duration}s ${bezierString} infinite alternate`
                                                : "none",
                                        }}
                                    >
                                        P
                                    </div>
                                </div>
                            </div>

                            {/* Track 2: CSS Linear Reference */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        Linear (Constant Speed)
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                        cubic-bezier(0, 0, 1, 1)
                                    </span>
                                </div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-950 rounded-xl p-1.5 relative overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center">
                                    <div
                                        key={`linear-${previewKey}`}
                                        className="w-9 h-9 rounded-lg bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center shadow-sm font-bold text-xs"
                                        style={{
                                            animation: isPlaying
                                                ? `tt-slide ${duration}s linear infinite alternate`
                                                : "none",
                                        }}
                                    >
                                        L
                                    </div>
                                </div>
                            </div>

                            {/* Track 3: Standard Ease Reference */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        Ease (Browser Default)
                                    </span>
                                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                        cubic-bezier(0.25, 0.1, 0.25, 1)
                                    </span>
                                </div>
                                <div className="h-12 bg-slate-100 dark:bg-slate-950 rounded-xl p-1.5 relative overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center">
                                    <div
                                        key={`ease-${previewKey}`}
                                        className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm font-bold text-xs"
                                        style={{
                                            animation: isPlaying
                                                ? `tt-slide ${duration}s ease infinite alternate`
                                                : "none",
                                        }}
                                    >
                                        E
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Scale & Opacity Physical Test */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-3">
                                Modal & Card Pop Simulation:
                            </span>
                            <div className="h-28 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                                <div
                                    key={`modal-${previewKey}`}
                                    className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 shadow-lg flex items-center gap-3"
                                    style={{
                                        animation: isPlaying
                                            ? `tt-pop ${duration}s ${bezierString} infinite alternate`
                                            : "none",
                                    }}
                                >
                                    <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        Scale & Opacity Easing
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Code Output Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                Generated CSS & Framework Snippets
                            </h2>
                            <button
                                type="button"
                                onClick={() => handleCopy(bezierString, "function")}
                                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                            >
                                {copiedSnippet === "function" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedSnippet === "function" ? "Copied" : "Copy Curve Only"}
                            </button>
                        </div>

                        {/* Raw Function Value Box */}
                        <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-between font-mono text-xs text-indigo-300 border border-slate-800">
                            <span className="truncate mr-2">{bezierString}</span>
                            <button
                                type="button"
                                onClick={() => handleCopy(bezierString, "raw")}
                                className="text-slate-400 hover:text-white transition p-1"
                                title="Copy cubic-bezier string"
                            >
                                {copiedSnippet === "raw" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* CSS Transition Line */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span>CSS Transition Rule:</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(cssTransitionSnippet, "transition")}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    {copiedSnippet === "transition" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    Copy Rule
                                </button>
                            </div>
                            <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
                                {cssTransitionSnippet}
                            </pre>
                        </div>

                        {/* Complete CSS Class */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span>Full CSS Class Declaration:</span>
                                <button
                                    type="button"
                                    onClick={() => handleCopy(cssFullRule, "full")}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                    {copiedSnippet === "full" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    Copy Class
                                </button>
                            </div>
                            <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
                                {cssFullRule}
                            </pre>
                        </div>

                        {/* Framework Integration Helpers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                                    Tailwind CSS arbitrary utility:
                                </span>
                                <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all select-all">
                                    ease-[{round3(p1x)},{round3(p1y)},{round3(p2x)},{round3(p2y)}]
                                </code>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                                    Framer Motion transition prop:
                                </span>
                                <code className="text-xs font-mono text-indigo-600 dark:text-indigo-400 break-all select-all">
                                    ease: [{round3(p1x)}, {round3(p1y)}, {round3(p2x)}, {round3(p2y)}]
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dynamic CSS Keyframes for Real-Time Comparison */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @keyframes tt-slide {
                    0% {
                        transform: translateX(0px);
                    }
                    100% {
                        transform: translateX(calc(100% + 280px));
                    }
                }
                @keyframes tt-pop {
                    0% {
                        transform: scale(0.65);
                        opacity: 0.2;
                    }
                    100% {
                        transform: scale(1.08);
                        opacity: 1;
                    }
                }
            `,
                }}
            />

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: The Mathematics Behind Cubic-Bezier Easing */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            The Mathematical Mechanics of CSS Cubic-Bezier Curves
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        In modern web interface engineering, CSS transitions and keyframe animations rely on third-order Bernstein polynomials known as <strong>cubic Bézier curves</strong> to interpolate numerical states across continuous time. A cubic Bézier curve is anchored by four points: P₀(0, 0), P₁(x₁, y₁), P₂(x₂, y₂), and P₃(1, 1). Because P₀ represents the animation start and P₃ marks 100% progress completion, authors only define the intermediate control handles P₁ and P₂.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <MoveHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Monotonic Time Axis
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The horizontal X axis represents elapsed time from 0.0 to 1.0. Because time cannot flow backwards in physical rendering engines, P1x and P2x are strictly constrained to the range [0.0, 1.0].
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Unbounded Progress Axis
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The vertical Y axis dictates property progress (transform, opacity, color). Unlike the X axis, Y values can exceed 1.0 (overshooting the final target) or drop below 0.0 (anticipatory recoil).
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Continuous 1st Derivative
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                The tangent vectors generated by P₁ and P₂ define instantaneous velocity. Smooth tangents prevent jarring rate-of-change spikes, eliminating optical stutter during interactive transitions.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Code2 className="w-4 h-4" /> Parametric Polynomial Formula
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            For any given normalized progression parameter t ∈ [0, 1], the curve coordinates (Bx(t), By(t)) are evaluated according to the explicit cubic polynomial equation:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`B(t) = (1 - t)³ · P₀ + 3(1 - t)² · t · P₁ + 3(1 - t) · t² · P₂ + t³ · P₃`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Standard Curve Reference Table */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            CSS Easing Function Comparison & Timing Benchmarks
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        Selecting the correct easing function directly influences perceived interface responsiveness. Fast entrances reduce cognitive delay, while gentle exits allow users to track layout shifts naturally:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3">CSS Timing Keyword</th>
                                    <th className="p-3">Cubic-Bezier Coords</th>
                                    <th className="p-3">Acceleration Profile</th>
                                    <th className="p-3">Recommended UI Application</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">ease</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.25, 0.1, 0.25, 1.0</td>
                                    <td className="p-3">Rapid acceleration, gentle deceleration</td>
                                    <td className="p-3">Default browser transition; general layout expansion</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">linear</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.0, 0.0, 1.0, 1.0</td>
                                    <td className="p-3">Constant velocity; zero acceleration</td>
                                    <td className="p-3">Infinite spinning loaders, background color fades, progress bars</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">ease-in</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.42, 0.0, 1.0, 1.0</td>
                                    <td className="p-3">Slow launch, abrupt high-velocity exit</td>
                                    <td className="p-3">Dismissing off-screen sheets, notification toast exits</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">ease-out</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.0, 0.0, 0.58, 1.0</td>
                                    <td className="p-3">High initial velocity, friction-damped stop</td>
                                    <td className="p-3">Dialog modals opening, drawer slide-ins, tooltips appearing</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">ease-in-out</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.42, 0.0, 0.58, 1.0</td>
                                    <td className="p-3">Symmetrical start and end dampening</td>
                                    <td className="p-3">Carousel horizontal sliding, accordion expand/collapse</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">overshoot (elastic)</td>
                                    <td className="p-3 font-mono text-indigo-600 dark:text-indigo-400">0.34, 1.56, 0.64, 1.0</td>
                                    <td className="p-3">Spring pop past target with physical snapback</td>
                                    <td className="p-3">Gamified badge unlocks, floating action button triggers</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Best Practices for UI Animation Easing */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                            <Sliders className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Micro-Interaction Architecture: 4 Rules for Fluid Animations
                        </h2>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        High-quality motion design separates mediocre web applications from polished software experiences. Apply these four core principles when calibrating custom transition curves:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Essential Motion Directives
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Animate Exclusively Composited Properties:</strong> Restrict transitions to <code className="font-mono text-indigo-600 dark:text-indigo-400">transform</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">opacity</code>. Modifying <code className="font-mono text-slate-700 dark:text-slate-300">width</code>, <code className="font-mono text-slate-700 dark:text-slate-300">height</code>, or <code className="font-mono text-slate-700 dark:text-slate-300">top</code> forces synchronous browser CPU reflows.
                                </li>
                                <li>
                                    • <strong>Keep Durations Under 300ms for Direct Interactions:</strong> Hover states and button presses should complete within 150ms to 250ms to maintain instantaneous tactile feedback.
                                </li>
                                <li>
                                    • <strong>Asymmetric Enter/Exit Timing:</strong> Elements entering the screen should move faster using <code className="font-mono text-indigo-600 dark:text-indigo-400">ease-out</code> (~200ms), while elements exiting should travel slower using <code className="font-mono text-indigo-600 dark:text-indigo-400">ease-in</code> (~150ms).
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Activity className="w-4 h-4 text-rose-600" /> Pitfalls That Degrade Performance
                            </h3>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
                                <li>
                                    • <strong>Overusing Linear Easing on Positional Changes:</strong> Objects moving linearly appear robotic and unnatural because physical objects in the real world never start or stop with infinite acceleration.
                                </li>
                                <li>
                                    • <strong>Excessive Overshoot on Dense Layouts:</strong> Spring curves with Y &gt; 1.5 risk clipping into neighboring text or triggering accidental horizontal scrollbars if the containing ancestor lacks <code className="font-mono text-indigo-600 dark:text-indigo-400">overflow: hidden</code>.
                                </li>
                                <li>
                                    • <strong>Ignoring prefers-reduced-motion:</strong> Always wrap expressive cubic-bezier animations in media queries honoring user accessibility settings to avoid inducing motion sickness.
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
                                What is a cubic-bezier function in CSS transitions and animations?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                A CSS cubic-bezier function defines a parametric smooth curve used to calculate time-to-progression interpolation during transitions and keyframe animations. It is governed by four numbers representing two control points (P1x, P1y, P2x, P2y) between the initial coordinate (0,0) and the terminal coordinate (1,1).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Why must the X coordinates of a cubic-bezier be strictly between 0 and 1?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                The X axis on a transition curve represents normalized elapsed time. Because forward physical time cannot flow backwards or exceed 100% of the duration before completion, CSS specifications strictly mandate that P1x and P2x remain in the continuous range [0.0, 1.0].
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                How do overshoot and anticipation bounce animations work in CSS cubic-bezier?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                While X coordinates are bound between 0 and 1, the Y coordinates (representing property progress or displacement) have no bounds in CSS. Setting a Y coordinate greater than 1.0 creates an elastic overshoot bounce past the end target, whereas setting a Y value below 0.0 produces anticipation rollback before advancing.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                What is the difference between ease, ease-in-out, and linear?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Linear has a constant velocity slope (0.0, 0.0, 1.0, 1.0) with zero acceleration. Ease starts gently, accelerates rapidly mid-way, and slows down gracefully (0.25, 0.1, 0.25, 1.0). Ease-in-out symmetrically ramps up and decelerates, preventing jarring camera or movement stops on screen.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20 dark:to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">
                                Does this tool support Web Animations API (WAAPI) and Framer Motion?
                            </h3>
                            <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                                Yes. The generated cubic-bezier(x1, y1, x2, y2) tuple is universally compatible with standard CSS transitions, CSS @keyframes, the native browser Web Animations API (element.animate), Framer Motion easing arrays, Tailwind CSS transition timing configs, and GSAP CustomEase plugins.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}