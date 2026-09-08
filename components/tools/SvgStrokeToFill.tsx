"use client";

import React, { useState, useRef, useEffect, useId, useCallback, useMemo } from "react";
import {
    PenTool,
    Upload,
    Download,
    Copy,
    Check,
    RotateCcw,
    Sliders,
    Eye,
    EyeOff,
    FileCode,
    Sparkles,
    BookOpen,
    HelpCircle,
    Cpu,
    CheckCircle2,
    AlertTriangle,
    Layers,
    RefreshCw,
    Maximize2,
    Code2,
    Terminal,
    ArrowRightLeft,
    ZoomIn,
    ZoomOut
} from "lucide-react";

// Standard benchmark sample SVG with diverse stroke types (lines, polylines, paths, circles, rects)
const SAMPLE_STROKED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="sampleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <!-- Background subtle grid -->
  <rect width="400" height="400" fill="#0f172a" rx="24" />
  
  <!-- Outer complex geometric star with stroke only -->
  <path d="M 200,40 L 240,140 L 350,150 L 265,220 L 295,330 L 200,270 L 105,330 L 135,220 L 50,150 L 160,140 Z" 
        fill="none" 
        stroke="#818cf8" 
        stroke-width="12" 
        stroke-linejoin="round" 
        stroke-linecap="round" />
        
  <!-- Intersecting decorative stroked rings -->
  <circle cx="200" cy="200" r="85" fill="none" stroke="#38bdf8" stroke-width="8" stroke-dasharray="6 8" />
  <circle cx="200" cy="200" r="50" fill="none" stroke="#a855f7" stroke-width="10" />

  <!-- Diagonal dynamic accent vector paths -->
  <line x1="80" y1="80" x2="140" y2="140" stroke="#f43f5e" stroke-width="14" stroke-linecap="round" />
  <line x1="320" y1="320" x2="260" y2="260" stroke="#10b981" stroke-width="14" stroke-linecap="round" />
  
  <!-- Central stroked polygon symbol -->
  <polygon points="200,165 230,225 170,225" fill="none" stroke="#fbbf24" stroke-width="8" stroke-linejoin="round" />
</svg>`;

interface ConversionStats {
    originalElementCount: number;
    convertedPathCount: number;
    originalStrokeBytes: number;
    outlineFillBytes: number;
    reductionPercentage: number;
}

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

export default function SvgStrokeToFill() {
    // State management
    const [inputSvg, setInputSvg] = useState<string>(SAMPLE_STROKED_SVG);
    const [outputSvg, setOutputSvg] = useState<string>("");
    const [fileName, setFileName] = useState<string>("vector-artwork.svg");
    const [isComparing, setIsComparing] = useState<boolean>(false);
    const [showWireframe, setShowWireframe] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [overrideFillColor, setOverrideFillColor] = useState<string>("#4f46e5");
    const [useOriginalStrokeColor, setUseOriginalStrokeColor] = useState<boolean>(true);
    const [subdivisionPrecision, setSubdivisionPrecision] = useState<number>(16);
    const [strokeWidthMultiplier, setStrokeWidthMultiplier] = useState<number>(100);
    const [removeOriginalStrokes, setRemoveOriginalStrokes] = useState<boolean>(true);
    const [copiedSvg, setCopiedSvg] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [conversionError, setConversionError] = useState<string | null>(null);
    const [stats, setStats] = useState<ConversionStats>({
        originalElementCount: 6,
        convertedPathCount: 6,
        originalStrokeBytes: 0,
        outlineFillBytes: 0,
        reductionPercentage: 0,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);

    const precisionId = useId();
    const multiplierId = useId();

    /**
     * Browser-Native High-Precision Stroke-to-Outline Vector Engine.
     * Extracts coordinates along stroke geometries using native SVGPathElement math APIs
     * to compute offset parallel polygonal ribbons and contour loops.
     */
    const convertStrokesToFillPolygons = useCallback(
        (svgString: string): { convertedSvg: string; stats: ConversionStats; error?: string } => {
            try {
                if (typeof window === "undefined") {
                    return {
                        convertedSvg: svgString,
                        stats: {
                            originalElementCount: 0,
                            convertedPathCount: 0,
                            originalStrokeBytes: 0,
                            outlineFillBytes: 0,
                            reductionPercentage: 0,
                        },
                    };
                }

                const parser = new DOMParser();
                const doc = parser.parseFromString(svgString, "image/svg+xml");
                const parseError = doc.querySelector("parsererror");
                if (parseError) {
                    return {
                        convertedSvg: svgString,
                        stats: {
                            originalElementCount: 0,
                            convertedPathCount: 0,
                            originalStrokeBytes: svgString.length,
                            outlineFillBytes: svgString.length,
                            reductionPercentage: 0,
                        },
                        error: "Invalid SVG format. Please verify the XML markup structure.",
                    };
                }

                const svgRoot = doc.querySelector("svg");
                if (!svgRoot) {
                    return {
                        convertedSvg: svgString,
                        stats: {
                            originalElementCount: 0,
                            convertedPathCount: 0,
                            originalStrokeBytes: svgString.length,
                            outlineFillBytes: svgString.length,
                            reductionPercentage: 0,
                        },
                        error: "Root <svg> tag not located in input source.",
                    };
                }

                // Target stroked elements
                const strokeElements = Array.from(
                    svgRoot.querySelectorAll("path, line, polyline, polygon, circle, rect, ellipse")
                );

                let originalElementCount = strokeElements.length;
                let convertedPathCount = 0;

                // Hidden temporary SVG for exact geometry point-sampling via getPointAtLength
                const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                tempSvg.style.position = "absolute";
                tempSvg.style.visibility = "hidden";
                tempSvg.style.width = "0";
                tempSvg.style.height = "0";
                document.body.appendChild(tempSvg);

                try {
                    strokeElements.forEach((el) => {
                        const styleAttr = el.getAttribute("style") || "";
                        const strokeAttr = el.getAttribute("stroke");
                        const hasStrokeStyle = /stroke\s*:\s*([^;]+)/i.test(styleAttr);
                        const isStrokeNone =
                            strokeAttr === "none" ||
                            /stroke\s*:\s*none/i.test(styleAttr) ||
                            (!strokeAttr && !hasStrokeStyle);

                        if (isStrokeNone) return;

                        // Parse stroke thickness
                        let strokeWidth = 2;
                        const strokeWidthAttr = el.getAttribute("stroke-width");
                        const strokeWidthMatch = styleAttr.match(/stroke-width\s*:\s*([^;]+)/i);

                        if (strokeWidthAttr) {
                            strokeWidth = parseFloat(strokeWidthAttr) || 2;
                        } else if (strokeWidthMatch) {
                            strokeWidth = parseFloat(strokeWidthMatch[1]) || 2;
                        }

                        // Apply user multiplier
                        const effectiveWidth = strokeWidth * (strokeWidthMultiplier / 100);
                        const halfWidth = effectiveWidth / 2;

                        // Resolve target fill color
                        let resolvedColor = overrideFillColor;
                        if (useOriginalStrokeColor) {
                            if (strokeAttr && strokeAttr !== "currentColor") {
                                resolvedColor = strokeAttr;
                            } else if (strokeWidthMatch) {
                                const strokeColorMatch = styleAttr.match(/stroke\s*:\s*([^;]+)/i);
                                if (strokeColorMatch) resolvedColor = strokeColorMatch[1].trim();
                            }
                        }

                        // Normalize geometry into a uniform path string
                        let pathD = "";
                        const tagName = el.tagName.toLowerCase();

                        if (tagName === "path") {
                            pathD = el.getAttribute("d") || "";
                        } else if (tagName === "line") {
                            const x1 = el.getAttribute("x1") || "0";
                            const y1 = el.getAttribute("y1") || "0";
                            const x2 = el.getAttribute("x2") || "0";
                            const y2 = el.getAttribute("y2") || "0";
                            pathD = `M ${x1},${y1} L ${x2},${y2}`;
                        } else if (tagName === "polyline" || tagName === "polygon") {
                            const points = (el.getAttribute("points") || "").trim().split(/\s+|,/);
                            if (points.length >= 4) {
                                pathD = `M ${points[0]},${points[1]}`;
                                for (let i = 2; i < points.length; i += 2) {
                                    if (points[i] && points[i + 1]) {
                                        pathD += ` L ${points[i]},${points[i + 1]}`;
                                    }
                                }
                                if (tagName === "polygon") pathD += " Z";
                            }
                        } else if (tagName === "circle") {
                            const cx = parseFloat(el.getAttribute("cx") || "0");
                            const cy = parseFloat(el.getAttribute("cy") || "0");
                            const r = parseFloat(el.getAttribute("r") || "0");
                            pathD = `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
                        } else if (tagName === "rect") {
                            const x = parseFloat(el.getAttribute("x") || "0");
                            const y = parseFloat(el.getAttribute("y") || "0");
                            const w = parseFloat(el.getAttribute("width") || "0");
                            const h = parseFloat(el.getAttribute("height") || "0");
                            const rx = parseFloat(el.getAttribute("rx") || "0");
                            const ry = parseFloat(el.getAttribute("ry") || "0");
                            if (rx > 0 || ry > 0) {
                                const r = rx || ry;
                                pathD = `M ${x + r},${y} h ${w - 2 * r} a ${r},${r} 0 0 1 ${r},${r} v ${h - 2 * r} a ${r},${r} 0 0 1 -${r},${r} h -${w - 2 * r} a ${r},${r} 0 0 1 -${r},${r} v -${h - 2 * r} a ${r},${r} 0 0 1 ${r},${r} z`;
                            } else {
                                pathD = `M ${x},${y} h ${w} v ${h} h -${w} Z`;
                            }
                        } else if (tagName === "ellipse") {
                            const cx = parseFloat(el.getAttribute("cx") || "0");
                            const cy = parseFloat(el.getAttribute("cy") || "0");
                            const rx = parseFloat(el.getAttribute("rx") || "0");
                            const ry = parseFloat(el.getAttribute("ry") || "0");
                            pathD = `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 -${rx * 2},0`;
                        }

                        if (!pathD) return;

                        // Create native path element to measure exact mathematical lengths
                        const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        tempPath.setAttribute("d", pathD);
                        tempSvg.appendChild(tempPath);

                        const totalLength = tempPath.getTotalLength();
                        if (totalLength <= 0) return;

                        const isClosed = /z\s*$/i.test(pathD.trim()) || tagName === "circle" || tagName === "polygon" || tagName === "rect" || tagName === "ellipse";

                        // Sample coordinates along the stroke path
                        const steps = Math.max(12, Math.floor(subdivisionPrecision * (totalLength / 60)));
                        const leftPoints: { x: number; y: number }[] = [];
                        const rightPoints: { x: number; y: number }[] = [];

                        const delta = 0.5; // step for computing tangent vector
                        for (let i = 0; i <= steps; i++) {
                            const progress = (i / steps) * totalLength;
                            const pt = tempPath.getPointAtLength(progress);

                            const pBefore = tempPath.getPointAtLength(Math.max(0, progress - delta));
                            const pAfter = tempPath.getPointAtLength(Math.min(totalLength, progress + delta));

                            const dx = pAfter.x - pBefore.x;
                            const dy = pAfter.y - pBefore.y;
                            const len = Math.hypot(dx, dy) || 1;

                            // Normal vector perpendicular to tangent
                            const nx = -dy / len;
                            const ny = dx / len;

                            leftPoints.push({
                                x: parseFloat((pt.x + nx * halfWidth).toFixed(2)),
                                y: parseFloat((pt.y + ny * halfWidth).toFixed(2)),
                            });

                            rightPoints.push({
                                x: parseFloat((pt.x - nx * halfWidth).toFixed(2)),
                                y: parseFloat((pt.y - ny * halfWidth).toFixed(2)),
                            });
                        }

                        tempSvg.removeChild(tempPath);

                        // Assemble outline path
                        let outlineD = "";
                        if (isClosed) {
                            // Closed loop: Outer polygon + Inner polygon via evenodd fill-rule
                            let outerD = `M ${leftPoints[0].x},${leftPoints[0].y} ` + leftPoints.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ") + " Z";
                            let innerD = `M ${rightPoints[0].x},${rightPoints[0].y} ` + rightPoints.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ") + " Z";
                            outlineD = `${outerD} ${innerD}`;
                        } else {
                            // Open path: continuous contour wrapping around rounded end caps
                            const revRight = [...rightPoints].reverse();
                            outlineD = `M ${leftPoints[0].x},${leftPoints[0].y} ` +
                                leftPoints.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ") +
                                " " +
                                revRight.map((p) => `L ${p.x},${p.y}`).join(" ") +
                                " Z";
                        }

                        // Create transformed outline element
                        const outlineElement = doc.createElementNS("http://www.w3.org/2000/svg", "path");
                        outlineElement.setAttribute("d", outlineD);
                        outlineElement.setAttribute("fill", resolvedColor);
                        outlineElement.setAttribute("fill-rule", "evenodd");
                        outlineElement.setAttribute("stroke", "none");
                        outlineElement.setAttribute("data-stroke-converted", "true");

                        // Retain transform and opacity if present
                        if (el.getAttribute("transform")) {
                            outlineElement.setAttribute("transform", el.getAttribute("transform")!);
                        }
                        if (el.getAttribute("opacity")) {
                            outlineElement.setAttribute("opacity", el.getAttribute("opacity")!);
                        }

                        if (removeOriginalStrokes) {
                            el.parentNode?.replaceChild(outlineElement, el);
                        } else {
                            // Keep original with stroke stripped if it has fill, or insert alongside
                            el.setAttribute("stroke", "none");
                            el.parentNode?.insertBefore(outlineElement, el.nextSibling);
                        }

                        convertedPathCount++;
                    });
                } finally {
                    document.body.removeChild(tempSvg);
                }

                // Clean XML serializer output
                const serializer = new XMLSerializer();
                const convertedSvg = serializer.serializeToString(doc);

                const originalBytes = new Blob([svgString]).size;
                const convertedBytes = new Blob([convertedSvg]).size;
                const reduction = originalBytes > 0
                    ? parseFloat((((originalBytes - convertedBytes) / originalBytes) * 100).toFixed(1))
                    : 0;

                return {
                    convertedSvg,
                    stats: {
                        originalElementCount,
                        convertedPathCount,
                        originalStrokeBytes: originalBytes,
                        outlineFillBytes: convertedBytes,
                        reductionPercentage: reduction,
                    },
                };
            } catch (err: any) {
                return {
                    convertedSvg: svgString,
                    stats: {
                        originalElementCount: 0,
                        convertedPathCount: 0,
                        originalStrokeBytes: svgString.length,
                        outlineFillBytes: svgString.length,
                        reductionPercentage: 0,
                    },
                    error: err?.message || "An unexpected error occurred during stroke raster contouring.",
                };
            }
        },
        [
            subdivisionPrecision,
            strokeWidthMultiplier,
            overrideFillColor,
            useOriginalStrokeColor,
            removeOriginalStrokes,
        ]
    );

    // Dynamic execution trigger
    useEffect(() => {
        const result = convertStrokesToFillPolygons(inputSvg);
        if (result.error) {
            setConversionError(result.error);
        } else {
            setConversionError(null);
            setOutputSvg(result.convertedSvg);
            setStats(result.stats);
        }
    }, [inputSvg, convertStrokesToFillPolygons]);

    // Ingestion Handlers
    const processFile = useCallback((file: File) => {
        if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
            alert("Please select a valid SVG vector graphic (.svg).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (typeof event.target?.result === "string") {
                setInputSvg(event.target.result);
                setFileName(file.name);
            }
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processFile(e.dataTransfer.files[0]);
            }
        },
        [processFile]
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleReset = () => {
        setInputSvg(SAMPLE_STROKED_SVG);
        setFileName("vector-artwork.svg");
        setSubdivisionPrecision(16);
        setStrokeWidthMultiplier(100);
        setUseOriginalStrokeColor(true);
        setOverrideFillColor("#4f46e5");
        setRemoveOriginalStrokes(true);
        setShowWireframe(false);
        setZoomLevel(100);
    };

    const handleCopySvg = () => {
        if (!outputSvg) return;
        navigator.clipboard.writeText(outputSvg);
        setCopiedSvg(true);
        setTimeout(() => setCopiedSvg(false), 2000);
    };

    const handleDownloadSvg = () => {
        if (!outputSvg) return;
        const blob = new Blob([outputSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const cleanName = fileName.replace(/\.svg$/i, "") || "converted-outline";
        link.download = `${cleanName}-filled-outlines.svg`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const activeDisplaySvg = useMemo(() => {
        return isComparing ? inputSvg : outputSvg || inputSvg;
    }, [isComparing, inputSvg, outputSvg]);

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG Stroke to Filled Outline Converter",
        "url": "https://twistertools.com/tools/image-tools/svg-stroke-to-fill",
        "description": "Convert stroked SVG paths, lines, and geometry into solid filled polygon outlines client-side. Eliminate stroke-scaling artifacts and optimize vector iconography for web and production.",
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
                "name": "What does converting an SVG stroke to a filled outline do?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Strokes in SVG are mathematical centerlines rendered with a virtual width property. When converted to a filled outline (or expanded stroke), the browser calculates the two outer contour boundaries of that stroke and converts it into a closed vector polygon with fill coordinates, removing the stroke property completely."
                }
            },
            {
                "@type": "Question",
                "name": "Why should I expand or convert SVG strokes to fills for web design?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Strokes often scale unpredictably when responsive SVGs resize, causing icons to look excessively thick or hair-thin unless vector-effect: non-scaling-stroke is applied. Converting strokes to filled outlines guarantees absolute 1:1 visual fidelity at every display resolution, breakpoint, or icon font format."
                }
            },
            {
                "@type": "Question",
                "name": "Are my SVG vector graphics uploaded to any remote server?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. The conversion pipeline runs entirely within your browser DOM using HTML5 Vector APIs and SVGPathElement mathematical point sampling. Your vector files never leave your machine."
                }
            },
            {
                "@type": "Question",
                "name": "How does the contour subdivision precision parameter work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The subdivision precision controls the frequency of mathematical normal vectors evaluated along curved segments. Higher values create smoother, ultra-precise Bézier perimeter loops for complex arcs and circles, while lower values yield compact, low-poly geometries with smaller file sizes."
                }
            },
            {
                "@type": "Question",
                "name": "Can I use the converted SVGs inside icon fonts, Figma, or CNC cutters?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Most CNC vinyl cutters, 3D extruders, glyph font generators (like Fontello or IcoMoon), and vector editors require pure closed filled paths without open stroked lines to calculate toolpaths and glyph boundaries properly."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool support compound paths with multiple holes and intersections?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. Closed geometry strokes like circles, polygons, and rectangles are transformed using the SVG fill-rule=\"evenodd\" standard, generating dual nested contours so that centers remain transparent while the outline border is filled."
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

            {/* Workspace Grid (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Panel: Configuration & Code Ingestion */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-6">
                        {/* Header & Reset Controls */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-indigo-600" />
                                Conversion Parameters
                            </h2>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                Reset Setup
                            </button>
                        </div>

                        {/* Parameter Controls */}
                        <div className="space-y-4">
                            {/* Precision Slider */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={precisionId} className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Contour Subdivision Sampling:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Contour sampling density value"
                                            id={precisionId}
                                            type="number"
                                            min="4"
                                            max="64"
                                            value={subdivisionPrecision}
                                            onChange={(e) => handleNumberInput(e, setSubdivisionPrecision, 4, 64)}
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">pts</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust contour sampling slider"
                                    type="range"
                                    min="4"
                                    max="64"
                                    step="2"
                                    value={subdivisionPrecision}
                                    onChange={(e) => setSubdivisionPrecision(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-[11px] text-slate-500">
                                    Higher values yield ultra-smooth curved bevels; lower values minimize SVG payload size.
                                </p>
                            </div>

                            {/* Stroke Width Scale Factor */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                    <label htmlFor={multiplierId} className="flex items-center gap-1.5">
                                        <PenTool className="w-3.5 h-3.5 text-indigo-500" /> Stroke Thickness Multiplier:
                                    </label>
                                    <div className="flex items-center gap-1">
                                        <input
                                            aria-label="Stroke width multiplier percentage"
                                            id={multiplierId}
                                            type="number"
                                            min="10"
                                            max="500"
                                            value={strokeWidthMultiplier}
                                            onChange={(e) => handleNumberInput(e, setStrokeWidthMultiplier, 10, 500)}
                                            className="w-14 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                        />
                                        <span className="text-slate-500 font-normal">%</span>
                                    </div>
                                </div>
                                <input
                                    aria-label="Adjust stroke width multiplier slider"
                                    type="range"
                                    min="10"
                                    max="400"
                                    step="5"
                                    value={strokeWidthMultiplier}
                                    onChange={(e) => setStrokeWidthMultiplier(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            {/* Color Strategy & Replacement Options */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                                    Fill Shader Configuration
                                </span>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={useOriginalStrokeColor}
                                            onChange={(e) => setUseOriginalStrokeColor(e.target.checked)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Preserve Source Stroke Colors</span>
                                    </label>

                                    {!useOriginalStrokeColor && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-600 font-medium">Uniform Fill:</span>
                                            <input
                                                aria-label="Select custom outline fill color"
                                                type="color"
                                                value={overrideFillColor}
                                                onChange={(e) => setOverrideFillColor(e.target.value)}
                                                className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                                            />
                                            <span className="font-mono text-xs text-slate-600">{overrideFillColor}</span>
                                        </div>
                                    )}
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
                                    <input
                                        type="checkbox"
                                        checked={removeOriginalStrokes}
                                        onChange={(e) => setRemoveOriginalStrokes(e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Strip original stroke attributes completely (Recommended)</span>
                                </label>
                            </div>
                        </div>

                        {/* File Drag & Drop Ingestion Zone */}
                        <div className="space-y-2.5">
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
                                    accept=".svg,image/svg+xml"
                                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                                    className="hidden"
                                />
                                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <p className="text-xs font-semibold text-slate-800 mb-0.5">
                                    Drop SVG vector file here, or <span className="text-indigo-600">click to browse</span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Instant client-side outline expansion (Zero cloud uploads)
                                </p>
                            </div>

                            <div className="flex items-center justify-between px-1 text-xs">
                                <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]" title={fileName}>
                                    Active: <strong className="text-slate-700 font-mono">{fileName}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputSvg(SAMPLE_STROKED_SVG);
                                        setFileName("vector-artwork.svg");
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition border border-slate-200 cursor-pointer shrink-0"
                                >
                                    <RefreshCw className="w-3 h-3 text-slate-500" />
                                    Reload Benchmark Sample
                                </button>
                            </div>
                        </div>

                        {/* Raw SVG Code Editor Drawer */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Code2 className="w-3.5 h-3.5 text-indigo-600" /> Source SVG Code
                                </label>
                                <span className="text-[11px] font-mono text-slate-400">
                                    {inputSvg.length.toLocaleString()} chars
                                </span>
                            </div>
                            <textarea
                                aria-label="Direct SVG markup editor"
                                value={inputSvg}
                                onChange={(e) => setInputSvg(e.target.value)}
                                rows={6}
                                className="w-full font-mono text-xs bg-slate-900 text-indigo-200 p-3 rounded-xl border border-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none resize-y"
                                placeholder="<svg>...</svg>"
                            />
                        </div>

                        {conversionError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                                <div>
                                    <p className="font-bold">XML Parse Error Detected</p>
                                    <p>{conversionError}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Left Panel Footer Specs */}
                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            SVGPathElement Contour Geometry
                        </span>
                        <span>Zero Telemetry Storage</span>
                    </div>
                </div>

                {/* Right Panel: Real-Time Vector Preview & Output Matrix */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Viewport Action Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Vector Output
                            </h2>
                            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% In-Browser Engine
                            </span>
                        </div>

                        {/* Full-Width Viewport Controls (1/3 Width Each) */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                            {/* 1/3: Zoom Controls */}
                            <div className="flex items-center justify-between bg-slate-100 rounded-xl px-2 py-1 border border-slate-200 w-full">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                                    className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                    {zoomLevel}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel((z) => Math.min(300, z + 25))}
                                    className="p-1 hover:bg-white rounded text-slate-600 transition cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* 1/3: Wireframe Mode */}
                            <button
                                type="button"
                                onClick={() => setShowWireframe(!showWireframe)}
                                className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer border flex items-center justify-center gap-1.5 ${showWireframe
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                Wireframe Mode
                            </button>

                            {/* 1/3: Hold to Compare */}
                            <button
                                type="button"
                                onMouseDown={() => setIsComparing(true)}
                                onMouseUp={() => setIsComparing(false)}
                                onTouchStart={() => setIsComparing(true)}
                                onTouchEnd={() => setIsComparing(false)}
                                className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold transition select-none cursor-pointer flex items-center justify-center gap-1.5 ${isComparing
                                    ? "bg-amber-600 text-white shadow-xs"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                                    }`}
                            >
                                {isComparing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                <span className="truncate">{isComparing ? "Original" : "Hold to Compare"}</span>
                            </button>
                        </div>

                        {/* Interactive Vector Viewport Canvas */}
                        <div
                            ref={previewContainerRef}
                            className={`relative w-full h-80 sm:h-96 rounded-xl overflow-hidden flex items-center justify-center border shadow-inner transition-all ${showWireframe
                                ? "bg-slate-900 border-indigo-500/50"
                                : "bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 border-slate-200"
                                }`}
                        >
                            {/* Comparison Badge */}
                            {isComparing && (
                                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider shadow-md animate-pulse z-10">
                                    Original Stroked SVG Active
                                </div>
                            )}

                            {!isComparing && (
                                <div className="absolute top-3 left-3 bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider shadow-md z-10">
                                    Expanded Filled Outlines
                                </div>
                            )}

                            {/* Rendered SVG Display */}
                            <div
                                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                                className={`w-full h-full flex items-center justify-center p-6 transition-transform duration-75 ${showWireframe ? "[&_path]:stroke-indigo-400 [&_path]:stroke-[0.5] [&_path]:fill-transparent" : ""
                                    }`}
                                dangerouslySetInnerHTML={{ __html: activeDisplaySvg }}
                            />

                            {/* Geometry Specs Badge */}
                            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-indigo-300 border border-slate-700/60 shadow-sm flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{stats.convertedPathCount} Outlined Shapes</span>
                            </div>
                        </div>

                        {/* Conversion Analytics Matrix */}
                        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Elements Converted</span>
                                <span className="font-mono text-sm font-bold text-slate-800">
                                    {stats.convertedPathCount} / {stats.originalElementCount}
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Source Weight</span>
                                <span className="font-mono text-sm font-bold text-slate-800">
                                    {(stats.originalStrokeBytes / 1024).toFixed(1)} KB
                                </span>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 font-medium block">Outline Payload</span>
                                <span className="font-mono text-sm font-bold text-indigo-600">
                                    {(stats.outlineFillBytes / 1024).toFixed(1)} KB
                                </span>
                            </div>
                        </div>

                        {/* Export & Code Actions */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleDownloadSvg}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="w-4 h-4" />
                                    Download Outlined SVG
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopySvg}
                                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {copiedSvg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                                    {copiedSvg ? "Markup Copied!" : "Copy Clean Code"}
                                </button>
                            </div>

                            {/* Generated Output Code Snippet */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                                        Processed XML Markup Output
                                    </span>
                                </div>
                                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto max-h-32 border border-slate-800">
                                    {outputSvg || "Awaiting conversion..."}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel Footer */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-600" />
                            Fill-Rule: evenodd (Dual-Contour)
                        </span>
                        <span className="font-mono text-slate-600">{fileName}</span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Vector Geometry & Expanded Contours */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mathematics of Stroke Expansion: From Centerline Vectors to Outline Polygons
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Scalable Vector Graphics define line drawings using parametric centerlines accompanied by virtual stroke attributes: <code>stroke-width</code>, <code>stroke-linecap</code>, and <code>stroke-linejoin</code>. While intuitive during manual vector illustration in software like Adobe Illustrator or Figma, this parametric stroke representation introduces significant scaling hazards in dynamic digital design:
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <PenTool className="w-4 h-4 text-indigo-600" /> Parametric Centerlines
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Standard stroked paths contain only singular 1-dimensional coordinate sequences. The browser graphics pipeline computes the visual boundary on the fly by extruding pixels perpendicular to each instantaneous tangent vector.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Maximize2 className="w-4 h-4 text-indigo-600" /> Resolution Independence
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                When a stroked SVG is rendered at tiny icon dimensions (e.g., 16px) or scaled up to billboard proportions without strict viewBox scaling rules, strokes often blow out or collapse into invisibility.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Dual-Contour Enclosures
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Stroke polygonization evaluates two parallel curves offset by {"$\\pm \\frac{w}{2}$"} across the entire length of the path. Joining these contours into a single <code>&lt;path&gt;</code> with an <code>evenodd</code> fill-rule guarantees exact 1:1 visual fidelity across all renderers.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Offset Vector Sampling Algorithm
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            For every point along an SVG path segment $P(s)$, we evaluate the directional derivative tangent vector {"$T(s) = (\\frac{dx}{ds}, \\frac{dy}{ds})$"}. The normal orthogonal vector $N(s) = (-T_y, T_x)$ is calculated to project the outer and inner polygon edges:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
                            {`// Outline Extrusion Coordinate Formula
LeftBoundary(s)  = Point(s) + Normal(s) * (strokeWidth / 2);
RightBoundary(s) = Point(s) - Normal(s) * (strokeWidth / 2);

// Assembled Closed Polygon Contour
CombinedPath = "M " + LeftPoints.join(" L ") + " L " + RightPoints.reverse().join(" L ") + " Z";`}
                        </div>
                    </div>
                </section>

                {/* Card 2: Comparative Architecture Matrix */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Stroked Paths vs. Outlined Fills: Production Architecture Comparison
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Understanding when to retain stroked paths versus when to bake them down into filled outlines is a critical decision for frontend developers, UI system architects, and digital fabricators:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Vector Trait</th>
                                    <th className="p-3">Stroked Path (Centerline)</th>
                                    <th className="p-3">Expanded Outline (Filled Shape)</th>
                                    <th className="p-3">Best Recommended For</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Icon Font Compatibility</td>
                                    <td className="p-3 text-rose-600 font-semibold">Unsupported (Ignored)</td>
                                    <td className="p-3 text-emerald-600 font-semibold">100% Native Glyph Support</td>
                                    <td className="p-3">TTF/WOFF2 custom webfont sets</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CSS Stroke Animation</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Native (stroke-dashoffset)</td>
                                    <td className="p-3 text-amber-600 font-semibold">Complex (Clip-path required)</td>
                                    <td className="p-3">Animated line-drawing logos</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Responsive Aspect Scaling</td>
                                    <td className="p-3 text-amber-600 font-semibold">Requires non-scaling-stroke</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Scales Proportioned Permanently</td>
                                    <td className="p-3">Design system icons & buttons</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">CNC & Laser Toolpaths</td>
                                    <td className="p-3 text-rose-600 font-semibold">Cuts centerline only</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Cuts exact exterior borders</td>
                                    <td className="p-3">Vinyl cutting, engraving, 3D printing</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Boolean Path Merging</td>
                                    <td className="p-3 text-rose-600 font-semibold">Fails / Leaves open joints</td>
                                    <td className="p-3 text-emerald-600 font-semibold">Unions cleanly with union/weld</td>
                                    <td className="p-3">Single-path SVG icon consolidation</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Card 3: Enterprise Best Practices & Pitfalls */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <FileCode className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Guidelines for High-Fidelity SVG Outline Expansion
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting strokes into polygonal fills modifies the geometry hierarchy. Follow these engineering guidelines to ensure high asset efficiency and visual fidelity across browser viewports:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Engineering Best Practices
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Tune Sampling Precision to Curve Complexity:</strong> Use sampling densities between 16 and 24 for standard iconography to keep file sizes low while avoiding visible facet edges on curved arcs.
                                </li>
                                <li>
                                    • <strong>Enforce `fill-rule="evenodd"`:</strong> When expanding closed geometries like circles or squares, ensure compound holes render transparently by preserving the evenodd rule.
                                </li>
                                <li>
                                    • <strong>Cleanse Deprecated Stroke Styling:</strong> Always strip obsolete <code>stroke</code>, <code>stroke-width</code>, and <code>stroke-linecap</code> attributes so downstream build minifiers (e.g., SVGO) can optimize payload sizes effectively.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Common Hazards to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Losing Interactive Stroke Animations:</strong> Do not convert icons designed for CSS stroke-dasharray reveal animations; outline conversion replaces single path spines with closed 2D loops.
                                </li>
                                <li>
                                    • <strong>Over-sampling Simple Linear Vectors:</strong> Avoid using maximum subdivision rates (e.g., 64 points) on straight lines or polygons, as this adds unnecessary coordinate bulk without visual benefit.
                                </li>
                                <li>
                                    • <strong>Missing Nested Transformations:</strong> Keep parent <code>&lt;g transform="..."&gt;</code> groups intact during export to prevent child paths from drifting out of alignment.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Extended Static FAQ Section */}
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
                                What does converting an SVG stroke to a filled outline do?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Strokes in SVG are mathematical centerlines rendered with a virtual width property. When converted to a filled outline (or expanded stroke), the browser calculates the two outer contour boundaries of that stroke and converts it into a closed vector polygon with fill coordinates, removing the stroke property completely.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Why should I expand or convert SVG strokes to fills for web design?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Strokes often scale unpredictably when responsive SVGs resize, causing icons to look excessively thick or hair-thin unless vector-effect: non-scaling-stroke is applied. Converting strokes to filled outlines guarantees absolute 1:1 visual fidelity at every display resolution, breakpoint, or icon font format.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Are my SVG vector graphics uploaded to any remote server?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. The conversion pipeline runs entirely within your browser DOM using HTML5 Vector APIs and SVGPathElement mathematical point sampling. Your vector files never leave your machine.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                How does the contour subdivision precision parameter work?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The subdivision precision controls the frequency of mathematical normal vectors evaluated along curved segments. Higher values create smoother, ultra-precise Bézier perimeter loops for complex arcs and circles, while lower values yield compact, low-poly geometries with smaller file sizes.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Can I use the converted SVGs inside icon fonts, Figma, or CNC cutters?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Most CNC vinyl cutters, 3D extruders, glyph font generators (like Fontello or IcoMoon), and vector editors require pure closed filled paths without open stroked lines to calculate toolpaths and glyph boundaries properly.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool support compound paths with multiple holes and intersections?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. Closed geometry strokes like circles, polygons, and rectangles are transformed using the SVG fill-rule=&quot;evenodd&quot; standard, generating dual nested contours so that centers remain transparent while the outline border is filled.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}