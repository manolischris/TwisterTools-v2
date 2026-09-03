"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    VectorSquare,
    Code,
    Copy,
    Check,
    Download,
    RefreshCw,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Eye,
    Sliders,
    Layers,
    Info,
    HelpCircle,
    BookOpen,
    FileCode,
    CheckCircle2,
    AlertCircle,
    Crosshair,
    Move,
    Sparkles
} from "lucide-react";

interface PathCommand {
    id: number;
    type: string;
    raw: string;
    args: number[];
    isRelative: boolean;
    startPoint: { x: number; y: number };
    endPoint: { x: number; y: number };
    controlPoints: { x: number; y: number }[];
    arcParams?: { rx: number; ry: number; angle: number; largeArc: number; sweep: number };
    description: string;
}

interface PathMetrics {
    length: number;
    bbox: { x: number; y: number; width: number; height: number };
    totalPoints: number;
    commandCounts: Record<string, number>;
}

const PRESET_PATHS: { name: string; path: string; viewBox: string }[] = [
    {
        name: "Heart Silhouette",
        path: "M 100 130 C 100 130 30 75 30 40 C 30 15 55 10 75 25 C 95 40 100 55 100 55 C 100 55 105 40 125 25 C 145 10 170 15 170 40 C 170 75 100 130 100 130 Z",
        viewBox: "0 0 200 160"
    },
    {
        name: "Smooth Star / Badge",
        path: "M 100 20 L 122 72 L 178 75 L 134 110 L 149 165 L 100 133 L 51 165 L 66 110 L 22 75 L 78 72 Z",
        viewBox: "0 0 200 190"
    },
    {
        name: "Cubic & Quadratic Wave",
        path: "M 20 100 Q 65 30 110 100 T 200 100 C 240 150 280 50 320 100 S 380 150 420 100",
        viewBox: "0 0 440 200"
    },
    {
        name: "Circular Arc Capsule",
        path: "M 60 40 L 140 40 A 30 30 0 0 1 140 100 L 60 100 A 30 30 0 0 1 60 40 Z",
        viewBox: "0 0 200 140"
    }
];

export default function SvgPathVisualizer() {
    const [rawPath, setRawPath] = useState<string>(PRESET_PATHS[0].path);
    const [viewBoxStr, setViewBoxStr] = useState<string>(PRESET_PATHS[0].viewBox);
    const [selectedCmdIndex, setSelectedCmdIndex] = useState<number | null>(null);
    const [hoveredCmdIndex, setHoveredCmdIndex] = useState<number | null>(null);

    // Visual Display Toggles
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [showControlPoints, setShowControlPoints] = useState<boolean>(true);
    const [showPathFill, setShowPathFill] = useState<boolean>(true);
    const [showCommandNumbers, setShowCommandNumbers] = useState<boolean>(true);
    const [strokeWidth, setStrokeWidth] = useState<number>(2);

    // Zoom & Pan Workspace states
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const [copied, setCopied] = useState<boolean>(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const hiddenPathRef = useRef<SVGPathElement | null>(null);

    // Parse viewBox
    const parsedViewBox = useMemo(() => {
        const parts = viewBoxStr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
            return { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
        }
        return { minX: 0, minY: 0, width: 200, height: 200 };
    }, [viewBoxStr]);

    // Tokenize and parse SVG path data
    const parsedCommands = useMemo<PathCommand[]>(() => {
        setParseError(null);
        if (!rawPath.trim()) return [];

        const commands: PathCommand[] = [];
        const regex = /([a-df-z])([^a-df-z]*)/gi;
        let match: RegExpExecArray | null;

        let currentX = 0;
        let currentY = 0;
        let startX = 0;
        let startY = 0;
        let lastCubicControl: { x: number; y: number } | null = null;
        let lastQuadControl: { x: number; y: number } | null = null;
        let cmdId = 0;

        try {
            while ((match = regex.exec(rawPath)) !== null) {
                const type = match[1];
                const rawArgs = match[2].trim();
                const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
                const args: number[] = [];
                let numMatch: RegExpExecArray | null;

                while ((numMatch = numRegex.exec(rawArgs)) !== null) {
                    args.push(parseFloat(numMatch[0]));
                }

                const isRelative = type === type.toLowerCase();
                const upper = type.toUpperCase();

                // Group multi-parameter commands (e.g. repeated coordinates under one command)
                const getParamCount = (cmd: string): number => {
                    switch (cmd) {
                        case "H":
                        case "V": return 1;
                        case "M":
                        case "L":
                        case "T": return 2;
                        case "S":
                        case "Q": return 4;
                        case "C": return 6;
                        case "A": return 7;
                        case "Z": return 0;
                        default: return args.length;
                    }
                };

                const step = getParamCount(upper);
                const chunkedArgs: number[][] = [];
                if (step > 0 && args.length > step) {
                    for (let i = 0; i < args.length; i += step) {
                        chunkedArgs.push(args.slice(i, i + step));
                    }
                } else {
                    chunkedArgs.push(args);
                }

                chunkedArgs.forEach((subArgs, subIdx) => {
                    // For repeated M commands, subsequent pairs behave as L (implicit lineTo)
                    const effectiveUpper = (upper === "M" && subIdx > 0) ? "L" : upper;
                    const effectiveType = isRelative ? effectiveUpper.toLowerCase() : effectiveUpper;

                    let cmdStartX = currentX;
                    let cmdStartY = currentY;
                    let endX = currentX;
                    let endY = currentY;
                    const controlPoints: { x: number; y: number }[] = [];
                    let arcParams: PathCommand["arcParams"] = undefined;
                    let desc = "";

                    switch (effectiveUpper) {
                        case "M": {
                            const [x, y] = subArgs;
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            startX = endX;
                            startY = endY;
                            desc = `Move to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        case "L": {
                            const [x, y] = subArgs;
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            desc = `Straight line to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        case "H": {
                            const [x] = subArgs;
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            desc = `Horizontal line to X=${endX.toFixed(1)}`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        case "V": {
                            const [y] = subArgs;
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            desc = `Vertical line to Y=${endY.toFixed(1)}`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        case "C": {
                            const [x1, y1, x2, y2, x, y] = subArgs;
                            const cp1 = {
                                x: isRelative ? currentX + (x1 || 0) : (x1 ?? currentX),
                                y: isRelative ? currentY + (y1 || 0) : (y1 ?? currentY)
                            };
                            const cp2 = {
                                x: isRelative ? currentX + (x2 || 0) : (x2 ?? currentX),
                                y: isRelative ? currentY + (y2 || 0) : (y2 ?? currentY)
                            };
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            controlPoints.push(cp1, cp2);
                            lastCubicControl = cp2;
                            lastQuadControl = null;
                            desc = `Cubic Bézier curve to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            break;
                        }
                        case "S": {
                            const [x2, y2, x, y] = subArgs;
                            let cp1 = { x: currentX, y: currentY };
                            if (lastCubicControl) {
                                cp1 = {
                                    x: 2 * currentX - lastCubicControl.x,
                                    y: 2 * currentY - lastCubicControl.y
                                };
                            }
                            const cp2 = {
                                x: isRelative ? currentX + (x2 || 0) : (x2 ?? currentX),
                                y: isRelative ? currentY + (y2 || 0) : (y2 ?? currentY)
                            };
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            controlPoints.push(cp1, cp2);
                            lastCubicControl = cp2;
                            lastQuadControl = null;
                            desc = `Smooth cubic curve to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            break;
                        }
                        case "Q": {
                            const [x1, y1, x, y] = subArgs;
                            const cp = {
                                x: isRelative ? currentX + (x1 || 0) : (x1 ?? currentX),
                                y: isRelative ? currentY + (y1 || 0) : (y1 ?? currentY)
                            };
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            controlPoints.push(cp);
                            lastQuadControl = cp;
                            lastCubicControl = null;
                            desc = `Quadratic Bézier curve to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            break;
                        }
                        case "T": {
                            const [x, y] = subArgs;
                            let cp = { x: currentX, y: currentY };
                            if (lastQuadControl) {
                                cp = {
                                    x: 2 * currentX - lastQuadControl.x,
                                    y: 2 * currentY - lastQuadControl.y
                                };
                            }
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            controlPoints.push(cp);
                            lastQuadControl = cp;
                            lastCubicControl = null;
                            desc = `Smooth quadratic curve to (${endX.toFixed(1)}, ${endY.toFixed(1)})`;
                            break;
                        }
                        case "A": {
                            const [rx, ry, rot, large, sweep, x, y] = subArgs;
                            endX = isRelative ? currentX + (x || 0) : (x ?? currentX);
                            endY = isRelative ? currentY + (y || 0) : (y ?? currentY);
                            arcParams = {
                                rx: Math.abs(rx || 0),
                                ry: Math.abs(ry || 0),
                                angle: rot || 0,
                                largeArc: large || 0,
                                sweep: sweep || 0
                            };
                            desc = `Elliptical Arc to (${endX.toFixed(1)}, ${endY.toFixed(1)}) [R=${rx},${ry}]`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        case "Z": {
                            endX = startX;
                            endY = startY;
                            desc = `Close path back to initial origin (${startX.toFixed(1)}, ${startY.toFixed(1)})`;
                            lastCubicControl = null;
                            lastQuadControl = null;
                            break;
                        }
                        default: {
                            desc = `Custom/Unknown command: ${type}`;
                            break;
                        }
                    }

                    commands.push({
                        id: cmdId++,
                        type: effectiveType,
                        raw: `${effectiveType} ${subArgs.join(" ")}`,
                        args: subArgs,
                        isRelative,
                        startPoint: { x: cmdStartX, y: cmdStartY },
                        endPoint: { x: endX, y: endY },
                        controlPoints,
                        arcParams,
                        description: desc
                    });

                    currentX = endX;
                    currentY = endY;
                });
            }
        } catch (err) {
            setParseError("Syntax error detected during path command extraction.");
        }

        return commands;
    }, [rawPath]);

    // Calculate Bounding Box and Path Length
    const metrics = useMemo<PathMetrics>(() => {
        let length = 0;
        let bbox = { x: 0, y: 0, width: 0, height: 0 };
        const commandCounts: Record<string, number> = {};

        parsedCommands.forEach((cmd) => {
            const letter = cmd.type.toUpperCase();
            commandCounts[letter] = (commandCounts[letter] || 0) + 1;
        });

        if (hiddenPathRef.current) {
            try {
                length = hiddenPathRef.current.getTotalLength() || 0;
                const b = hiddenPathRef.current.getBBox();
                bbox = { x: b.x, y: b.y, width: b.width, height: b.height };
            } catch {
                // In SSR or non-rendered fallback
            }
        }

        // Fallback bounding box if SVG DOM element calculation is unavailable
        if (bbox.width === 0 && bbox.height === 0 && parsedCommands.length > 0) {
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;

            parsedCommands.forEach((cmd) => {
                [cmd.startPoint, cmd.endPoint, ...cmd.controlPoints].forEach((pt) => {
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                });
            });

            if (minX !== Infinity) {
                bbox = {
                    x: minX,
                    y: minY,
                    width: Math.max(1, maxX - minX),
                    height: Math.max(1, maxY - minY)
                };
            }
        }

        return {
            length,
            bbox,
            totalPoints: parsedCommands.length,
            commandCounts
        };
    }, [parsedCommands]);

    // Pan Handlers for SVG Workspace
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsPanning(true);
        setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({
            x: e.clientX - startPan.x,
            y: e.clientY - startPan.y
        });
    };

    const handleMouseUp = () => {
        setIsPanning(false);
    };

    const handleResetWorkspace = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSelectedCmdIndex(null);
    };

    const handleFitViewBox = () => {
        if (metrics.bbox.width > 0 && metrics.bbox.height > 0) {
            const padding = 20;
            const newMinX = Math.floor(metrics.bbox.x - padding);
            const newMinY = Math.floor(metrics.bbox.y - padding);
            const newWidth = Math.ceil(metrics.bbox.width + padding * 2);
            const newHeight = Math.ceil(metrics.bbox.height + padding * 2);
            setViewBoxStr(`${newMinX} ${newMinY} ${newWidth} ${newHeight}`);
            handleResetWorkspace();
        }
    };

    const handleCopyPath = () => {
        navigator.clipboard.writeText(rawPath);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadSvg = () => {
        const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}" width="${parsedViewBox.width}" height="${parsedViewBox.height}">
  <path d="${rawPath.replace(/"/g, "'")}" fill="${showPathFill ? "#6366f1" : "none"}" fill-opacity="0.2" stroke="#4f46e5" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
        const blob = new Blob([fullSvg], { type: "image/svg+xml;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "vector-path-export.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleNumberInput = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (val: number) => void
    ) => {
        const raw = e.target.value;
        if (raw === "") {
            setter(1);
            return;
        }
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        const num = parseFloat(cleaned);
        setter(isNaN(num) ? 1 : num);
    };

    // SEO JSON-LD Schemas
    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG Path Visualizer & Anchor Point Inspector",
        "url": "https://twistertools.com/tools/image-tools/svg-path-visualizer",
        "description": "Interactive vector visualizer and SVG path debugger. Deconstruct d-attribute command strings, inspect cubic and quadratic Bézier handles, and inspect anchor coordinates online.",
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
                "name": "What is the SVG path d attribute and how is it structured?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The SVG path d attribute defines the geometry of a vector outline using a serialized sequence of alphanumeric drawing commands and coordinate parameters. Standard commands include MoveTo (M/m), LineTo (L/l), Horizontal/Vertical LineTo (H/h, V/v), Cubic Bézier (C/c, S/s), Quadratic Bézier (Q/q, T/t), Elliptical Arc (A/a), and ClosePath (Z/z). Uppercase commands use absolute canvas coordinates, while lowercase commands use relative coordinates from the current cursor position."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Cubic (C) and Quadratic (Q) Bézier curves?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A cubic Bézier curve (C) utilizes two independent control handles to calculate tangent acceleration and direction at both the start and endpoints, defined by parametric polynomials of degree three. A quadratic Bézier curve (Q) utilizes only a single shared control point between start and end anchors, generating a parabolic curve of degree two that requires less calculation overhead."
                }
            },
            {
                "@type": "Question",
                "name": "How do Smooth Bézier commands (S and T) calculate missing control points?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Smooth Cubic (S) and Smooth Quadratic (T) commands maintain continuous curvature (G1 continuity) by automatically calculating the first control point as the exact point-reflection of the preceding command's final control point across the current anchor. If the preceding command was not a curve of matching degree, the current anchor point is used directly as the first control handle."
                }
            },
            {
                "@type": "Question",
                "name": "How does the SVG Elliptical Arc command (A) define arc curvature?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The Elliptical Arc command accepts seven distinct parameters: rx (horizontal radius), ry (vertical radius), x-axis-rotation (elliptical tilt angle in degrees), large-arc-flag (0 for arcs <= 180°, 1 for arcs > 180°), sweep-flag (0 for counter-clockwise rotation, 1 for clockwise rotation), and the target end coordinates (x, y)."
                }
            },
            {
                "@type": "Question",
                "name": "Why is interactive path inspection essential for vector animation and optimization?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Vector morphing libraries (like GSAP MorphSVG or Framer Motion) require matching command topologies and identical sub-path point distributions between source and target shapes to prevent shape distortion. Visual anchor inspection enables developers to verify clockwise winding rules, point densities, and control tangent alignments before deployment."
                }
            }
        ]
    };

    return (
        <div className="w-full max-w-full lg:max-w-7xl mx-auto space-y-8 overflow-x-hidden">
            {/* Schema Script Injection */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

            {/* Hidden calculation path element for DOM SVG geometry measurement */}
            <svg className="absolute -left-[9999px] -top-[9999px] w-0 h-0 pointer-events-none" aria-hidden="true">
                <path ref={hiddenPathRef} d={rawPath || "M0 0"} />
            </svg>

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">

                {/* Left Workspace Panel: Input, Preset Controls, and Command Breakdown */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-indigo-600" />
                                Vector Path Input & Setup
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                                    SVG 2.0 Spec Engine
                                </span>
                                <button
                                    onClick={handleCopyPath}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied" : "Copy d"}
                                </button>
                            </div>
                        </div>

                        {/* Presets Row */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Quick Load Benchmark Vectors
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {PRESET_PATHS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        type="button"
                                        onClick={() => {
                                            setRawPath(preset.path);
                                            setViewBoxStr(preset.viewBox);
                                            setSelectedCmdIndex(null);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition text-center truncate cursor-pointer ${rawPath === preset.path
                                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Path d-attribute input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Path Data (<code className="font-mono text-indigo-600">d="..."</code>)
                                </label>
                                <span className="text-[11px] text-slate-500 font-mono">
                                    {rawPath.length} chars
                                </span>
                            </div>
                            <textarea
                                value={rawPath}
                                onChange={(e) => setRawPath(e.target.value)}
                                placeholder="Paste SVG path d-string, e.g., M10 80 Q 95 10 180 80"
                                className="w-full h-28 p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-slate-50/50 leading-relaxed"
                            />
                            {parseError && (
                                <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> {parseError}
                                </p>
                            )}
                        </div>

                        {/* ViewBox & Stroke Width Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Canvas ViewBox
                                </label>
                                <input
                                    type="text"
                                    value={viewBoxStr}
                                    onChange={(e) => setViewBoxStr(e.target.value)}
                                    placeholder="minX minY width height"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Render Stroke Width ({strokeWidth}px)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={strokeWidth}
                                    onChange={(e) => handleNumberInput(e, setStrokeWidth)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                />
                            </div>
                        </div>

                        {/* Interactive Command Breakdown Table */}
                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                    Parsed Segments ({parsedCommands.length})
                                </label>
                                <span className="text-[11px] text-slate-500">Click row to highlight coordinate</span>
                            </div>

                            <div className="h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                                {parsedCommands.length === 0 ? (
                                    <p className="p-4 text-center text-xs text-slate-400">No path commands detected.</p>
                                ) : (
                                    parsedCommands.map((cmd, idx) => {
                                        const isSelected = selectedCmdIndex === idx;
                                        const isHovered = hoveredCmdIndex === idx;
                                        return (
                                            <div
                                                key={cmd.id}
                                                onClick={() => setSelectedCmdIndex(isSelected ? null : idx)}
                                                onMouseEnter={() => setHoveredCmdIndex(idx)}
                                                onMouseLeave={() => setHoveredCmdIndex(null)}
                                                className={`p-2.5 text-xs transition cursor-pointer flex items-center justify-between ${isSelected
                                                        ? "bg-indigo-100/70 border-l-4 border-indigo-600"
                                                        : isHovered
                                                            ? "bg-indigo-50/50"
                                                            : "hover:bg-white"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <span className="w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[11px] bg-indigo-600 text-white flex-shrink-0">
                                                        {cmd.type}
                                                    </span>
                                                    <span className="font-mono text-slate-800 font-medium truncate">
                                                        {cmd.description}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] font-mono text-slate-500 flex-shrink-0">
                                                    ({cmd.endPoint.x.toFixed(1)}, {cmd.endPoint.y.toFixed(1)})
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                        <button
                            onClick={handleFitViewBox}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition shadow-sm cursor-pointer"
                        >
                            <Maximize2 className="w-4 h-4" /> Fit Canvas to Bounds
                        </button>
                        <button
                            onClick={handleDownloadSvg}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 cursor-pointer"
                        >
                            <Download className="w-4 h-4" /> Export Clean SVG
                        </button>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Vector Stage & Inspector */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between min-w-0 p-4 sm:p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Crosshair className="w-4 h-4 text-indigo-600" />
                                Vector Inspection Canvas
                            </h2>
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setZoom((prev) => Math.min(prev + 0.25, 4))}
                                    title="Zoom In"
                                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.5))}
                                    title="Zoom Out"
                                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={handleResetWorkspace}
                                    title="Reset Viewport"
                                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Display Layer Toggles */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <button
                                onClick={() => setShowGrid(!showGrid)}
                                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${showGrid ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                    }`}
                            >
                                Grid Overlay
                            </button>
                            <button
                                onClick={() => setShowControlPoints(!showControlPoints)}
                                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${showControlPoints ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                    }`}
                            >
                                Bézier Handles
                            </button>
                            <button
                                onClick={() => setShowPathFill(!showPathFill)}
                                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${showPathFill ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                    }`}
                            >
                                Silhouette Fill
                            </button>
                            <button
                                onClick={() => setShowCommandNumbers(!showCommandNumbers)}
                                className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${showCommandNumbers ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-600"
                                    }`}
                            >
                                Indices
                            </button>
                        </div>

                        {/* Interactive SVG Canvas */}
                        <div
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className="relative w-full h-[320px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 cursor-grab active:cursor-grabbing select-none"
                        >
                            <svg
                                ref={svgRef}
                                viewBox={`${parsedViewBox.minX} ${parsedViewBox.minY} ${parsedViewBox.width} ${parsedViewBox.height}`}
                                className="w-full h-full"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    transformOrigin: "center center",
                                    transition: isPanning ? "none" : "transform 0.15s ease-out"
                                }}
                            >
                                <defs>
                                    {/* Coordinate Grid Pattern */}
                                    <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.6" />
                                    </pattern>
                                    <pattern id="grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                                        <rect width="100" height="100" fill="url(#grid-pattern)" />
                                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#475569" strokeWidth="1" strokeOpacity="0.8" />
                                    </pattern>
                                </defs>

                                {/* Background Grid */}
                                {showGrid && (
                                    <rect
                                        x={parsedViewBox.minX - 2000}
                                        y={parsedViewBox.minY - 2000}
                                        width={parsedViewBox.width + 4000}
                                        height={parsedViewBox.height + 4000}
                                        fill="url(#grid-major)"
                                    />
                                )}

                                {/* Computed Bounding Box */}
                                {metrics.bbox.width > 0 && (
                                    <rect
                                        x={metrics.bbox.x}
                                        y={metrics.bbox.y}
                                        width={metrics.bbox.width}
                                        height={metrics.bbox.height}
                                        fill="none"
                                        stroke="#6366f1"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                        strokeOpacity="0.4"
                                    />
                                )}

                                {/* Main Vector Path */}
                                <path
                                    d={rawPath}
                                    fill={showPathFill ? "#6366f1" : "none"}
                                    fillOpacity={showPathFill ? "0.2" : "0"}
                                    stroke="#818cf8"
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Control Handles and Lines */}
                                {showControlPoints &&
                                    parsedCommands.map((cmd) => {
                                        if (cmd.controlPoints.length === 0) return null;
                                        return (
                                            <g key={`cp-group-${cmd.id}`}>
                                                {/* Handle line from start to CP1 */}
                                                {cmd.controlPoints[0] && (
                                                    <line
                                                        x1={cmd.startPoint.x}
                                                        y1={cmd.startPoint.y}
                                                        x2={cmd.controlPoints[0].x}
                                                        y2={cmd.controlPoints[0].y}
                                                        stroke="#f59e0b"
                                                        strokeWidth="1"
                                                        strokeDasharray="2 2"
                                                        strokeOpacity="0.8"
                                                    />
                                                )}
                                                {/* Handle line from CP2 to End */}
                                                {cmd.controlPoints[1] && (
                                                    <line
                                                        x1={cmd.controlPoints[1].x}
                                                        y1={cmd.controlPoints[1].y}
                                                        x2={cmd.endPoint.x}
                                                        y2={cmd.endPoint.y}
                                                        stroke="#f59e0b"
                                                        strokeWidth="1"
                                                        strokeDasharray="2 2"
                                                        strokeOpacity="0.8"
                                                    />
                                                )}
                                                {/* Control Points markers */}
                                                {cmd.controlPoints.map((cp, cIdx) => (
                                                    <circle
                                                        key={`cp-${cmd.id}-${cIdx}`}
                                                        cx={cp.x}
                                                        cy={cp.y}
                                                        r={2.5}
                                                        fill="#f59e0b"
                                                        stroke="#ffffff"
                                                        strokeWidth="0.8"
                                                    />
                                                ))}
                                            </g>
                                        );
                                    })}

                                {/* Anchor Points */}
                                {parsedCommands.map((cmd, idx) => {
                                    const isSelected = selectedCmdIndex === idx;
                                    const isHovered = hoveredCmdIndex === idx;
                                    const radius = isSelected ? 5.5 : isHovered ? 4.5 : 3.5;

                                    return (
                                        <g key={`anchor-${cmd.id}`}>
                                            <circle
                                                cx={cmd.endPoint.x}
                                                cy={cmd.endPoint.y}
                                                r={radius}
                                                fill={isSelected ? "#4f46e5" : isHovered ? "#38bdf8" : "#ffffff"}
                                                stroke={isSelected ? "#ffffff" : "#1e293b"}
                                                strokeWidth="1.5"
                                                className="cursor-pointer transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCmdIndex(isSelected ? null : idx);
                                                }}
                                            />
                                            {showCommandNumbers && (
                                                <text
                                                    x={cmd.endPoint.x + 5}
                                                    y={cmd.endPoint.y - 5}
                                                    fontSize="9"
                                                    fontFamily="monospace"
                                                    fontWeight="bold"
                                                    fill={isSelected ? "#a5b4fc" : "#94a3b8"}
                                                >
                                                    #{idx + 1}:{cmd.type}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Canvas Info Badge */}
                            <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono text-slate-300 border border-slate-700 pointer-events-none">
                                Zoom: {(zoom * 100).toFixed(0)}% | Bounds: {metrics.bbox.width.toFixed(0)} × {metrics.bbox.height.toFixed(0)}px
                            </div>
                        </div>

                        {/* Geometric Analytics Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Anchors</span>
                                <span className="text-base font-black text-slate-900">{parsedCommands.length}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Est. Length</span>
                                <span className="text-base font-black text-indigo-600">{metrics.length > 0 ? `${metrics.length.toFixed(1)}px` : "N/A"}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Width (BBox)</span>
                                <span className="text-base font-black text-slate-900">{metrics.bbox.width.toFixed(1)}</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Height (BBox)</span>
                                <span className="text-base font-black text-slate-900">{metrics.bbox.height.toFixed(1)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Selected Anchor Inspector Details */}
                    <div className="pt-3 border-t border-slate-100">
                        {selectedCmdIndex !== null && parsedCommands[selectedCmdIndex] ? (
                            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-indigo-950">
                                    <span>Selected Anchor #{selectedCmdIndex + 1} ({parsedCommands[selectedCmdIndex].type})</span>
                                    <button
                                        onClick={() => setSelectedCmdIndex(null)}
                                        className="text-indigo-600 hover:text-indigo-900 font-normal cursor-pointer"
                                    >
                                        Deselect
                                    </button>
                                </div>
                                <p className="text-slate-700 font-mono text-[11px]">{parsedCommands[selectedCmdIndex].description}</p>
                                <div className="text-slate-600 font-mono text-[11px] grid grid-cols-2 gap-1 pt-1">
                                    <div>End X: <strong className="text-slate-900">{parsedCommands[selectedCmdIndex].endPoint.x}</strong></div>
                                    <div>End Y: <strong className="text-slate-900">{parsedCommands[selectedCmdIndex].endPoint.y}</strong></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 text-indigo-600" /> Click any anchor point on canvas to inspect
                                </span>
                                <span>Coordinates relative to viewBox</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">

                {/* Card 1: Anatomical Guide to SVG Path Commands */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Anatomical Guide to SVG Path Commands and Syntax
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Scalable Vector Graphics (SVG) <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-sm">d</code> attribute defines the outline geometry of paths through a compact, micro-syntax series of commands and coordinates. In the SVG 2.0 specification, every command is represented by a single alphabetic letter. An <strong>uppercase letter</strong> denotes absolute coordinates positioned directly in the canvas coordinate system, whereas a <strong>lowercase letter</strong> defines relative offsets evaluated from the terminal position of the preceding command.
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Command</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Arguments</th>
                                    <th className="p-3">Geometric Behavior</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">M / m</td>
                                    <td className="p-3 font-semibold text-slate-900">MoveTo</td>
                                    <td className="p-3 font-mono text-xs">(x y)+</td>
                                    <td className="p-3">Repositions the pen cursor without drawing. Subsequent coordinates imply a LineTo.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">L / l</td>
                                    <td className="p-3 font-semibold text-slate-900">LineTo</td>
                                    <td className="p-3 font-mono text-xs">(x y)+</td>
                                    <td className="p-3">Draws a straight linear vector from the current pen location to target coordinates.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">H / h</td>
                                    <td className="p-3 font-semibold text-slate-900">Horizontal LineTo</td>
                                    <td className="p-3 font-mono text-xs">x+</td>
                                    <td className="p-3">Draws a perfectly horizontal line, leaving the current Y coordinate unchanged.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">V / v</td>
                                    <td className="p-3 font-semibold text-slate-900">Vertical LineTo</td>
                                    <td className="p-3 font-mono text-xs">y+</td>
                                    <td className="p-3">Draws a perfectly vertical line, leaving the current X coordinate unchanged.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">C / c</td>
                                    <td className="p-3 font-semibold text-slate-900">Cubic Bézier</td>
                                    <td className="p-3 font-mono text-xs">(x1 y1 x2 y2 x y)+</td>
                                    <td className="p-3">Draws a cubic curve using two independent control handles for tangent acceleration.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">S / s</td>
                                    <td className="p-3 font-semibold text-slate-900">Smooth Cubic Bézier</td>
                                    <td className="p-3 font-mono text-xs">(x2 y2 x y)+</td>
                                    <td className="p-3">Draws a continuous cubic curve; the first control point reflects the preceding handle.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">Q / q</td>
                                    <td className="p-3 font-semibold text-slate-900">Quadratic Bézier</td>
                                    <td className="p-3 font-mono text-xs">(x1 y1 x y)+</td>
                                    <td className="p-3">Draws a parabolic curve utilizing a single shared control point.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">T / t</td>
                                    <td className="p-3 font-semibold text-slate-900">Smooth Quadratic</td>
                                    <td className="p-3 font-mono text-xs">(x y)+</td>
                                    <td className="p-3">Smoothly chains quadratic curves by reflecting the previous control handle.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">A / a</td>
                                    <td className="p-3 font-semibold text-slate-900">Elliptical Arc</td>
                                    <td className="p-3 font-mono text-xs">(rx ry rot laf sf x y)+</td>
                                    <td className="p-3">Draws an elliptical arc segment defined by radii, tilt angle, and sweep flags.</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-mono font-bold text-indigo-600">Z / z</td>
                                    <td className="p-3 font-semibold text-slate-900">ClosePath</td>
                                    <td className="p-3 font-mono text-xs">none</td>
                                    <td className="p-3">Closes current subpath by drawing a straight segment back to the initial MoveTo origin.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 2: Mathematics of Cubic and Quadratic Curves */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Move className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Mathematical Formulation of Parametric Bézier Curves
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Vector rendering engines generate smooth curved outlines by evaluating Bernstein polynomials over a normalized interval $t \in [0, 1]$. Understanding how control handles pull the curve enables precise anchor positioning and eliminates unwanted inflection spikes during vector design and CSS animation.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" /> Quadratic Curve Formulation (Degree 2)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A quadratic curve interpolates between start anchor $P_0$, control point $P_1$, and end anchor $P_2$:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                B(t) = (1 - t)²·P₀ + 2(1 - t)t·P₁ + t²·P₂
                            </div>
                            <p className="text-xs text-slate-600">
                                Evaluates faster in memory and produces symmetric parabolic arcs commonly used in font glyphs.
                            </p>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Crosshair className="w-4 h-4 text-indigo-600" /> Cubic Curve Formulation (Degree 3)
                            </h3>
                            <p className="text-sm text-slate-700 leading-relaxed">
                                A cubic curve introduces two independent handles ($P_1$ and $P_2$) between $P_0$ and $P_3$:
                            </p>
                            <div className="bg-slate-900 text-indigo-300 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                                B(t) = (1 - t)³·P₀ + 3(1 - t)²t·P₁ + 3(1 - t)t²·P₂ + t³·P₃
                            </div>
                            <p className="text-xs text-slate-600">
                                Provides complete freedom to model asymmetrical S-curves, acute inflection points, and organic silhouettes.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 3: Deep Dive: The Elliptical Arc (A) Parameter Suite */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <VectorSquare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Decoding the SVG Elliptical Arc Command (A)
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        The Elliptical Arc command (<code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-xs">A rx ry x-axis-rotation large-arc-flag sweep-flag x y</code>) is the most versatile yet complex instruction in vector graphics. Because two points on an ellipse can be connected by four distinct arcs, the boolean flags determine the exact trajectory:
                    </p>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 block">Radii (rx, ry)</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Defines the horizontal and vertical semi-major and semi-minor radii of the ellipse. If equal, renders a circular arc.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 block">X-Axis-Rotation</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                The angular tilt in degrees by which the ellipse coordinate system is rotated relative to the canvas X-axis.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 block">Large-Arc-Flag</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Value <code className="font-mono">0</code> selects the smaller arc (angular span &le; 180°); value <code className="font-mono">1</code> selects the larger arc (&gt; 180°).
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-indigo-600 block">Sweep-Flag</span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                Value <code className="font-mono">0</code> renders counter-clockwise ("negative angle"); value <code className="font-mono">1</code> renders clockwise ("positive angle").
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 4: Vector Optimization & Path Morphing Best Practices */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Best Practices: Optimization & Morphing Readiness
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Coordinate Precision Truncation</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard vector exports from Illustrator or Figma often include floating-point decimals with 6+ decimal places. Limiting precision to 1 or 2 decimals reduces SVG file size by up to 60% without perceptible visual quality loss.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">Consistent Winding & Direction</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Compound vector shapes rely on the Non-Zero Winding Rule (<code className="font-mono text-[11px]">fill-rule="nonzero"</code>). Outer contours must run clockwise while interior cutouts must run counter-clockwise to render clean transparent holes.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm">MorphSVG Interpolation Parity</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When animating shapes using GreenSock MorphSVG or Framer Motion, shapes interpolate cleanest when both source and destination paths contain identical command counts and origin anchor orientations.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Card 5: Static Border-Highlighted FAQ Section */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the SVG path d attribute and how is it structured?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The SVG path <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">d</code> attribute defines the geometry of a vector outline using a serialized sequence of alphanumeric drawing commands and coordinate parameters. Standard commands include MoveTo (M/m), LineTo (L/l), Horizontal/Vertical LineTo (H/h, V/v), Cubic Bézier (C/c, S/s), Quadratic Bézier (Q/q, T/t), Elliptical Arc (A/a), and ClosePath (Z/z). Uppercase commands use absolute canvas coordinates, while lowercase commands use relative coordinates from the current cursor position.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Cubic (C) and Quadratic (Q) Bézier curves?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                A cubic Bézier curve (C) utilizes two independent control handles to calculate tangent acceleration and direction at both the start and endpoints, defined by parametric polynomials of degree three. A quadratic Bézier curve (Q) utilizes only a single shared control point between start and end anchors, generating a parabolic curve of degree two that requires less calculation overhead.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How do Smooth Bézier commands (S and T) calculate missing control points?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Smooth Cubic (S) and Smooth Quadratic (T) commands maintain continuous curvature (G1 continuity) by automatically calculating the first control point as the exact point-reflection of the preceding command's final control point across the current anchor. If the preceding command was not a curve of matching degree, the current anchor point is used directly as the first control handle.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the SVG Elliptical Arc command (A) define arc curvature?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The Elliptical Arc command accepts seven distinct parameters: <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">rx</code> (horizontal radius), <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">ry</code> (vertical radius), <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">x-axis-rotation</code> (elliptical tilt angle in degrees), <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">large-arc-flag</code> (0 for arcs &le; 180°, 1 for arcs &gt; 180°), <code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">sweep-flag</code> (0 for counter-clockwise, 1 for clockwise), and the target end coordinates (<code className="bg-slate-200 px-1 py-0.5 rounded text-xs font-mono">x, y</code>).
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why is interactive path inspection essential for vector animation and optimization?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Vector morphing libraries (like GSAP MorphSVG or Framer Motion) require matching command topologies and identical sub-path point distributions between source and target shapes to prevent shape distortion. Visual anchor inspection enables developers to verify clockwise winding rules, point densities, and control tangent alignments before deployment.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}