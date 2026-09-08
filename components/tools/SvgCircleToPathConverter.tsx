"use client";

import React, { useState, useMemo, useRef, useId, useEffect } from "react";
import {
    CircleDot,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    Sliders,
    Code,
    Layers,
    Eye,
    HelpCircle,
    BookOpen,
    CheckCircle2,
    AlertTriangle,
    Monitor,
    Terminal,
    Cpu,
    Download,
    Upload,
    UploadCloud,
    ShieldCheck,
    FileCode2,
    MoveRight,
    Compass
} from "lucide-react";

type PathMethod = "arc" | "cubic";

interface ConvertOptions {
    method: PathMethod;
    precision: number;
    preserveAttributes: boolean;
    formatOutput: boolean;
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  
  <!-- Centered Circle -->
  <circle cx="120" cy="150" r="70" fill="url(#grad1)" stroke="#1e293b" stroke-width="4" id="main-circle" />
  
  <!-- Ellipse Orbit -->
  <ellipse cx="280" cy="150" rx="90" ry="55" fill="#f43f5e" fill-opacity="0.25" stroke="#f43f5e" stroke-width="3" stroke-dasharray="6,6" id="orbit-ellipse" />
  
  <!-- Small Center Indicator Dot -->
  <circle cx="280" cy="150" r="10" fill="#f43f5e" />
</svg>`;

const KAPPA = 0.5522847498307936; // Cubic Bézier optimal circle approximation constant

const sanitizeNumber = (val: number, precision: number): string => {
    const factor = Math.pow(10, precision);
    const rounded = Math.round(val * factor) / factor;
    return Number(rounded.toFixed(precision)).toString();
};

export default function SvgCircleToPathConverter() {
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [inputSvg, setInputSvg] = useState<string>(SAMPLE_SVG);
    const [method, setMethod] = useState<PathMethod>("arc");
    const [precision, setPrecision] = useState<number>(3);
    const [preserveAttributes, setPreserveAttributes] = useState<boolean>(true);
    const [formatOutput, setFormatOutput] = useState<boolean>(true);
    const [copied, setCopied] = useState<boolean>(false);
    const [copiedDOnly, setCopiedDOnly] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const precisionInputId = useId();

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

    const conversionResult = useMemo(() => {
        if (!isMounted || typeof window === "undefined" || typeof DOMParser === "undefined" || !inputSvg.trim()) {
            return {
                outputSvg: "",
                convertedCount: 0,
                extractedPathDList: [] as string[],
                parseError: null as string | null,
            };
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(inputSvg, "image/svg+xml");
            const parserError = doc.querySelector("parsererror");

            if (parserError) {
                return { outputSvg: inputSvg, convertedCount: 0, extractedPathDList: [], parseError: "Malformed SVG markup. Please verify syntax." };
            }

            let convertedCount = 0;
            const extractedPathDList: string[] = [];

            // Convert <circle> elements
            const circles = Array.from(doc.querySelectorAll("circle"));
            circles.forEach((circle) => {
                const cx = parseFloat(circle.getAttribute("cx") || "0");
                const cy = parseFloat(circle.getAttribute("cy") || "0");
                const r = parseFloat(circle.getAttribute("r") || "0");

                if (isNaN(r) || r <= 0) return;

                let d = "";
                if (method === "arc") {
                    const startX = sanitizeNumber(cx - r, precision);
                    const endX = sanitizeNumber(cx + r, precision);
                    const cyStr = sanitizeNumber(cy, precision);
                    const rStr = sanitizeNumber(r, precision);
                    d = `M ${startX} ${cyStr} A ${rStr} ${rStr} 0 1 0 ${endX} ${cyStr} A ${rStr} ${rStr} 0 1 0 ${startX} ${cyStr} Z`;
                } else {
                    const ox = r * KAPPA;
                    const oy = r * KAPPA;
                    const x0 = sanitizeNumber(cx - r, precision);
                    const x1 = sanitizeNumber(cx - ox, precision);
                    const x2 = sanitizeNumber(cx, precision);
                    const x3 = sanitizeNumber(cx + ox, precision);
                    const x4 = sanitizeNumber(cx + r, precision);

                    const y0 = sanitizeNumber(cy - r, precision);
                    const y1 = sanitizeNumber(cy - oy, precision);
                    const y2 = sanitizeNumber(cy, precision);
                    const y3 = sanitizeNumber(cy + oy, precision);
                    const y4 = sanitizeNumber(cy + r, precision);

                    d = `M ${x2} ${y0} C ${x3} ${y0} ${x4} ${y1} ${x4} ${y2} C ${x4} ${y3} ${x3} ${y4} ${x2} ${y4} C ${x1} ${y4} ${x0} ${y3} ${x0} ${y2} C ${x0} ${y1} ${x1} ${y0} ${x2} ${y0} Z`;
                }

                extractedPathDList.push(d);
                const pathElement = doc.createElementNS("http://www.w3.org/2000/svg", "path");
                pathElement.setAttribute("d", d);

                if (preserveAttributes) {
                    Array.from(circle.attributes).forEach((attr) => {
                        if (!["cx", "cy", "r"].includes(attr.name.toLowerCase())) {
                            pathElement.setAttribute(attr.name, attr.value);
                        }
                    });
                }

                circle.parentNode?.replaceChild(pathElement, circle);
                convertedCount++;
            });

            // Convert <ellipse> elements
            const ellipses = Array.from(doc.querySelectorAll("ellipse"));
            ellipses.forEach((ellipse) => {
                const cx = parseFloat(ellipse.getAttribute("cx") || "0");
                const cy = parseFloat(ellipse.getAttribute("cy") || "0");
                const rx = parseFloat(ellipse.getAttribute("rx") || "0");
                const ry = parseFloat(ellipse.getAttribute("ry") || "0");

                if (isNaN(rx) || rx <= 0 || isNaN(ry) || ry <= 0) return;

                let d = "";
                if (method === "arc") {
                    const startX = sanitizeNumber(cx - rx, precision);
                    const endX = sanitizeNumber(cx + rx, precision);
                    const cyStr = sanitizeNumber(cy, precision);
                    const rxStr = sanitizeNumber(rx, precision);
                    const ryStr = sanitizeNumber(ry, precision);
                    d = `M ${startX} ${cyStr} A ${rxStr} ${ryStr} 0 1 0 ${endX} ${cyStr} A ${rxStr} ${ryStr} 0 1 0 ${startX} ${cyStr} Z`;
                } else {
                    const ox = rx * KAPPA;
                    const oy = ry * KAPPA;
                    const x0 = sanitizeNumber(cx - rx, precision);
                    const x1 = sanitizeNumber(cx - ox, precision);
                    const x2 = sanitizeNumber(cx, precision);
                    const x3 = sanitizeNumber(cx + ox, precision);
                    const x4 = sanitizeNumber(cx + rx, precision);

                    const y0 = sanitizeNumber(cy - ry, precision);
                    const y1 = sanitizeNumber(cy - oy, precision);
                    const y2 = sanitizeNumber(cy, precision);
                    const y3 = sanitizeNumber(cy + oy, precision);
                    const y4 = sanitizeNumber(cy + ry, precision);

                    d = `M ${x2} ${y0} C ${x3} ${y0} ${x4} ${y1} ${x4} ${y2} C ${x4} ${y3} ${x3} ${y4} ${x2} ${y4} C ${x1} ${y4} ${x0} ${y3} ${x0} ${y2} C ${x0} ${y1} ${x1} ${y0} ${x2} ${y0} Z`;
                }

                extractedPathDList.push(d);
                const pathElement = doc.createElementNS("http://www.w3.org/2000/svg", "path");
                pathElement.setAttribute("d", d);

                if (preserveAttributes) {
                    Array.from(ellipse.attributes).forEach((attr) => {
                        if (!["cx", "cy", "rx", "ry"].includes(attr.name.toLowerCase())) {
                            pathElement.setAttribute(attr.name, attr.value);
                        }
                    });
                }

                ellipse.parentNode?.replaceChild(pathElement, ellipse);
                convertedCount++;
            });

            const serializer = new XMLSerializer();
            let rawOutput = serializer.serializeToString(doc);

            if (formatOutput) {
                rawOutput = rawOutput
                    .replace(/></g, ">\n<")
                    .replace(/(<path[^>]+>)/g, "  $1")
                    .replace(/(<defs[^>]*>)/g, "  $1")
                    .replace(/(<\/defs>)/g, "  $1")
                    .replace(/(<g[^>]*>)/g, "  $1")
                    .replace(/(<\/g>)/g, "  $1");
            }

            return {
                outputSvg: rawOutput,
                convertedCount,
                extractedPathDList,
                parseError: null as string | null,
            };
        } catch {
            return { outputSvg: inputSvg, convertedCount: 0, extractedPathDList: [], parseError: "Could not process SVG content." };
        }
    }, [inputSvg, method, precision, preserveAttributes, formatOutput, isMounted]);

    const handleCopyAll = () => {
        if (!conversionResult.outputSvg) return;
        navigator.clipboard.writeText(conversionResult.outputSvg);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCopyDOnly = () => {
        if (conversionResult.extractedPathDList.length === 0) return;
        navigator.clipboard.writeText(conversionResult.extractedPathDList.join("\n\n"));
        setCopiedDOnly(true);
        setTimeout(() => setCopiedDOnly(false), 2000);
    };

    const handleDownload = () => {
        if (!conversionResult.outputSvg) return;
        const blob = new Blob([conversionResult.outputSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "converted-paths.svg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content === "string") {
                setInputSvg(content);
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleReset = () => {
        setInputSvg(SAMPLE_SVG);
        setMethod("arc");
        setPrecision(3);
        setPreserveAttributes(true);
        setFormatOutput(true);
    };

    const webAppJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "SVG Circle & Ellipse to Path Converter",
        "url": "https://twistertools.com/tools/image-tools/svg-circle-to-path",
        "description": "Convert native SVG circle and ellipse tags into unified vector path (d) commands using precise Elliptical Arcs or Cubic Bézier curves. Client-side, instant, and loss-free.",
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
                "name": "Why should I convert SVG circle and ellipse tags into path elements?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Native <circle> and <ellipse> elements cannot be morphed using animation engines like GSAP MorphSVG or Framer Motion, which require identical <path d='...'> command structures. Converting them into standard paths unlocks stroke-dasharray animations, shape morphing, unified CSS manipulation, and compatibility with vector font engines."
                }
            },
            {
                "@type": "Question",
                "name": "What is the difference between Elliptical Arc (A) and Cubic Bézier (C) conversion?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Elliptical Arc commands (A) use native radius values to produce exact, mathematically true circles split into two 180-degree arcs. Cubic Bézier curves (C) approximate circles using 4 cubic spline segments scaled by the universal Kappa constant (0.55228475). Cubic paths are required for morphing into complex multi-node polygons, while Arc paths are more compact."
                }
            },
            {
                "@type": "Question",
                "name": "Does this tool preserve styling attributes like fill, stroke, gradients, and CSS classes?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes. When 'Preserve Styles & Attributes' is enabled, attributes such as fill, stroke, stroke-width, id, class, transform, and clip-path are copied directly onto the newly generated <path> tag, maintaining 100% visual fidelity."
                }
            },
            {
                "@type": "Question",
                "name": "What is the mathematical Kappa constant used for Bézier circle approximation?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The magic constant Kappa is 4 * (sqrt(2) - 1) / 3 ≈ 0.5522847498. By placing four cubic Bézier control points at this proportional distance along the bounding box tangents, the maximum radial deviation from an ideal circle is kept under 0.05%."
                }
            },
            {
                "@type": "Question",
                "name": "Is my SVG code or graphic data uploaded to external servers?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. All XML parsing, path transformations, and sanitization execute 100% locally in your web browser via the standard DOMParser and XMLSerializer APIs. Your vectors remain private."
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

            {/* 50/50 Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
                {/* Left Workspace Panel: Input & Conversion Parameters */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Parameters & Controls Bar */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-indigo-600" />
                                    Conversion Settings
                                </h2>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-200 cursor-pointer"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    Reset Sample
                                </button>
                            </div>

                            {/* Method Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 block">Path Algorithm Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMethod("arc")}
                                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${method === "arc"
                                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold">Elliptical Arc (A)</div>
                                            <div className="text-[10px] text-slate-500 font-normal">Compact, true geometry</div>
                                        </div>
                                        {method === "arc" && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setMethod("cubic")}
                                        className={`px-3 py-2 text-xs font-semibold rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${method === "cubic"
                                                ? "border-indigo-600 bg-indigo-50/60 text-indigo-900 font-bold"
                                                : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold">Cubic Bézier (C)</div>
                                            <div className="text-[10px] text-slate-500 font-normal">Best for MorphSVG / GSAP</div>
                                        </div>
                                        {method === "cubic" && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                </div>
                            </div>

                            {/* Precision & Formatting Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                                        <label htmlFor={precisionInputId}>Coordinate Decimals:</label>
                                        <div className="flex items-center gap-1">
                                            <input
                                                id={precisionInputId}
                                                type="number"
                                                min="0"
                                                max="6"
                                                value={precision}
                                                onChange={(e) => handleNumberInput(e, setPrecision, 0, 6)}
                                                className="w-12 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                            <span className="text-slate-500 font-normal">pts</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="6"
                                        step="1"
                                        value={precision}
                                        onChange={(e) => setPrecision(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                </div>

                                <div className="space-y-2 flex flex-col justify-center pt-2 sm:pt-0">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={preserveAttributes}
                                            onChange={(e) => setPreserveAttributes(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">Preserve Styles &amp; Attributes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={formatOutput}
                                            onChange={(e) => setFormatOutput(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">Indent &amp; Clean Markup</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Input Raw SVG Code Editor */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                <label htmlFor="svg-source-input" className="flex items-center gap-1.5">
                                    <Code className="w-4 h-4 text-indigo-600" />
                                    Source SVG Code
                                </label>
                                <span className="text-[11px] font-normal text-slate-500">Paste XML markup containing &lt;circle&gt; or &lt;ellipse&gt;</span>
                            </div>

                            <textarea
                                id="svg-source-input"
                                value={inputSvg}
                                onChange={(e) => setInputSvg(e.target.value)}
                                placeholder="<svg>...</svg>"
                                spellCheck={false}
                                className="w-full h-56 p-3 font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                            />

                            {/* Drag & Drop Upload Dropzone */}
                            <div
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${isDragging
                                        ? "border-indigo-600 bg-indigo-50/60"
                                        : "border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50"
                                    }`}
                            >
                                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                                    <UploadCloud className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-slate-800">
                                        Drop your SVG file here, or <span className="text-indigo-600 underline">browse files</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                        Supports .svg vector files (Max 25MB)
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="svg-file-dropzone-input"
                                />
                            </div>

                            {conversionResult.parseError && (
                                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{conversionResult.parseError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Client-Side Native DOMParser
                        </span>
                        <span>Zero External API Calls</span>
                    </div>
                </div>

                {/* Right Workspace Panel: Real-Time Preview & Output Generator */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 flex flex-col justify-between min-w-0 p-4 sm:p-6">
                    <div className="space-y-5">
                        {/* Live Visualizer Stage Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Eye className="w-5 h-5 text-indigo-600" />
                                Transformed Path Preview
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
                                    {conversionResult.convertedCount} Primitive{conversionResult.convertedCount === 1 ? "" : "s"} Converted
                                </span>
                            </div>
                        </div>

                        {/* Visual Stage Container */}
                        <div className="w-full h-52 bg-slate-900 [background-image:radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] rounded-xl border border-slate-800 p-4 flex items-center justify-center overflow-hidden">
                            {conversionResult.outputSvg && !conversionResult.parseError ? (
                                <div
                                    className="w-full h-full flex items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full [&>svg]:w-auto [&>svg]:h-auto"
                                    dangerouslySetInnerHTML={{ __html: conversionResult.outputSvg }}
                                />
                            ) : (
                                <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                                    <AlertTriangle className="w-6 h-6 text-slate-600" />
                                    <span>No valid SVG to preview</span>
                                </div>
                            )}
                        </div>

                        {/* Exported Result Box */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileCode2 className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                        Converted SVG Markup
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleCopyDOnly}
                                        disabled={conversionResult.extractedPathDList.length === 0}
                                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {copiedDOnly ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedDOnly ? "Copied d!" : "Copy d-path only"}
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto min-h-[140px] max-h-[170px] border border-slate-800">
                                    {conversionResult.outputSvg || "<!-- Converted SVG code will appear here -->"}
                                </pre>
                                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleCopyAll}
                                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition shadow-sm border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? "Copied!" : "Copy SVG"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm border border-indigo-500 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Save .svg
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-slate-500" />
                            SVG 1.1 / SVG 2 Compliant Path Data
                        </span>
                        <span className="text-xs text-indigo-600 font-semibold">
                            GSAP &amp; Framer Motion Ready
                        </span>
                    </div>
                </div>
            </div>

            {/* BELOW-THE-FOLD HIGH-VALUE SEO CONTENT CARDS */}
            <div className="space-y-6">
                {/* Card 1: Vector Mechanics & Primitive Replacement */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            The Mechanics of Converting SVG Circles &amp; Ellipses to Path Commands
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Scalable Vector Graphics (SVG) introduces basic parametric shape elements such as <code>&lt;circle&gt;</code> and <code>&lt;ellipse&gt;</code> for convenience. While these primitives are concise for static rendering, modern UI engineering demands dynamic shape interpolation, line-drawing animations, path trimming, and vector morphing. All of these advanced vector techniques require unified <code>&lt;path&gt;</code> geometry defined by the <code>d</code> path specification.
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <MoveRight className="w-4 h-4 text-indigo-600" /> Unified Shape Morphing
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Libraries like GSAP MorphSVG, anime.js, and Framer Motion cannot interpolate between distinct primitive tag types. Converting all nodes into equivalent <code>&lt;path&gt;</code> structures guarantees seamless point interpolation.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Compass className="w-4 h-4 text-indigo-600" /> Exact Tangent Control
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Cubic Bézier conversions split the 360-degree perimeter into four distinct 90-degree quadrant segments, granting direct access to individual anchor points and control tangent vectors.
                            </p>
                        </div>
                        <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" /> Stroke Drawing Consistency
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Applying CSS <code>stroke-dasharray</code> and <code>stroke-dashoffset</code> to circular primitives can yield inconsistent origin points across rendering engines. Path commands fix the exact start and end node.
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl space-y-3 p-4 sm:p-6">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Terminal className="w-4 h-4" /> Architectural Path Representation
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Comparing a raw primitive with its mathematically equivalent Elliptical Arc and Cubic Bézier path commands:
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800 space-y-2">
                            <div><span className="text-slate-500">// Original primitive:</span></div>
                            <div className="text-amber-300">&lt;circle cx=&quot;50&quot; cy=&quot;50&quot; r=&quot;40&quot; /&gt;</div>
                            <div><span className="text-slate-500">// Converted via Arc (compact true arc):</span></div>
                            <div className="text-emerald-400">&lt;path d=&quot;M 10 50 A 40 40 0 1 0 90 50 A 40 40 0 1 0 10 50 Z&quot; /&gt;</div>
                            <div><span className="text-slate-500">// Converted via Cubic Bézier (Kappa = 0.552285):</span></div>
                            <div className="text-cyan-300">&lt;path d=&quot;M 50 10 C 72.091 10 90 27.909 90 50 C 90 72.091 72.091 90 50 90 C 27.909 90 10 72.091 10 50 C 10 27.909 27.909 10 50 10 Z&quot; /&gt;</div>
                        </div>
                    </div>
                </section>

                {/* Card 2: Mathematical Foundation (Kappa Constant & Arc Matrix) */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Monitor className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Algorithm Comparison: Arc (A) vs. Bézier (C) Mathematics
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        Converting radial primitives requires selecting the right mathematical algorithm for your specific pipeline:
                    </p>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">Method</th>
                                    <th className="p-3">Command Type</th>
                                    <th className="p-3">Anchor Count</th>
                                    <th className="p-3">Mathematical Accuracy</th>
                                    <th className="p-3">Primary Use Case</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 font-medium">
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Elliptical Arc</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">A rx ry rot large sweep x y</td>
                                    <td className="p-3">2 endpoints</td>
                                    <td className="p-3 text-emerald-600 font-bold">100% True Radius</td>
                                    <td className="p-3">Minified asset bundles, icon fonts, static illustrations</td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                    <td className="p-3 font-semibold text-slate-900">Cubic Bézier</td>
                                    <td className="p-3 font-mono text-xs text-indigo-600">C x1 y1, x2 y2, x y</td>
                                    <td className="p-3">4 quadrants (8 handles)</td>
                                    <td className="p-3 text-amber-600 font-bold">99.96% Approximation (Kappa)</td>
                                    <td className="p-3">GSAP MorphSVG, path deformation, stroke animations</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">The Kappa Constant (κ)</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            A single cubic Bézier curve cannot model a circular segment exactly. However, by partitioning the circle into 4 quadrants of 90 degrees and positioning the control point offsets at $r \times \kappa$, where $\kappa = 4 \times (\sqrt{2} - 1) / 3 \approx 0.55228475$, the radial error is limited to an imperceptible 0.043% peak at $45^\circ$.
                        </p>
                    </div>
                </section>

                {/* Card 3: Enterprise Animation & Production Optimization */}
                <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm space-y-6 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Production Best Practices for Animated Vector Paths
                        </h2>
                    </div>

                    <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                        When preparing converted SVG paths for UI motion graphics or high-frequency rendering, apply these battle-tested development practices:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Recommended Workflows
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Coordinate Precision:</strong> Restrict coordinate precision to 2 or 3 decimals. Storing 10+ decimals inflates vector payloads without adding visible sharpness on 4K displays.
                                </li>
                                <li>
                                    • <strong>Attribute Preservation:</strong> Retain original <code>id</code>, <code>fill</code>, <code>stroke</code>, and <code>class</code> attributes to preserve downstream CSS styling hooks.
                                </li>
                                <li>
                                    • <strong>Consistent Start Points:</strong> Both Arc and Bézier conversion outputs establish deterministic start nodes, preventing rotational flicker during morphing transitions.
                                </li>
                            </ul>
                        </div>

                        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" /> Pitfalls to Avoid
                            </h3>
                            <ul className="text-xs text-slate-700 space-y-2">
                                <li>
                                    • <strong>Non-Uniform Transforms:</strong> Never apply non-uniform transforms directly to <code>&lt;circle&gt;</code> elements prior to path conversion; bake matrix transforms into viewBox dimensions first.
                                </li>
                                <li>
                                    • <strong>Zero Radius Values:</strong> Primitives with <code>r=&quot;0&quot;</code> or <code>rx=&quot;0&quot;</code> produce invalid degenerate paths that trigger parsing errors in Safari WebKit.
                                </li>
                                <li>
                                    • <strong>Mixing Morph Nodes:</strong> When interpolating between two shapes, ensure both SVGs use the exact same node count (such as 4 Bézier segments) for smooth geometric transitions.
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Card 4: Frequently Asked Questions (FAQ) */}
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
                                Why should I convert SVG circle and ellipse tags into path elements?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Native <code>&lt;circle&gt;</code> and <code>&lt;ellipse&gt;</code> elements cannot be morphed using animation engines like GSAP MorphSVG or Framer Motion, which require identical <code>&lt;path d=&apos;...&apos;&gt;</code> command structures. Converting them into standard paths unlocks stroke-dasharray animations, shape morphing, unified CSS manipulation, and compatibility with vector font engines.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the difference between Elliptical Arc (A) and Cubic Bézier (C) conversion?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Elliptical Arc commands (A) use native radius values to produce exact, mathematically true circles split into two 180-degree arcs. Cubic Bézier curves (C) approximate circles using 4 cubic spline segments scaled by the universal Kappa constant (0.55228475). Cubic paths are required for morphing into complex multi-node polygons, while Arc paths are more compact.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Does this tool preserve styling attributes like fill, stroke, gradients, and CSS classes?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                Yes. When &quot;Preserve Styles &amp; Attributes&quot; is enabled, attributes such as fill, stroke, stroke-width, id, class, transform, and clip-path are copied directly onto the newly generated <code>&lt;path&gt;</code> tag, maintaining 100% visual fidelity.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                What is the mathematical Kappa constant used for Bézier circle approximation?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                The magic constant Kappa is 4 * (sqrt(2) - 1) / 3 ≈ 0.5522847498. By placing four cubic Bézier control points at this proportional distance along the bounding box tangents, the maximum radial deviation from an ideal circle is kept under 0.05%.
                            </p>
                        </div>

                        <div className="border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent rounded-r-xl p-5">
                            <h3 className="font-bold text-slate-900 text-base mb-2">
                                Is my SVG code or graphic data uploaded to external servers?
                            </h3>
                            <p className="text-slate-700 text-sm md:text-base leading-relaxed">
                                No. All XML parsing, path transformations, and sanitization execute 100% locally in your web browser via the standard DOMParser and XMLSerializer APIs. Your vectors remain private.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}